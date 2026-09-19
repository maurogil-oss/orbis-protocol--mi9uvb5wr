routerAdd('POST', '/backend/v1/cobranca/pix', (e) => {
  try {
    const body = e.requestInfo().body || {}
    const servicoId = body.servico_id ? String(body.servico_id).trim() : ''
    const tomadorNome = body.tomador_nome ? String(body.tomador_nome).trim() : ''
    const tomadorCpfCnpj = body.tomador_cpf_cnpj ? String(body.tomador_cpf_cnpj).trim() : ''
    const tomadorEmail = body.tomador_email ? String(body.tomador_email).trim() : ''
    const tomadorEndereco = body.tomador_endereco ? String(body.tomador_endereco).trim() : ''

    if (!servicoId || !tomadorNome || !tomadorCpfCnpj || !tomadorEmail) {
      return e.badRequestError('Dados incompletos do tomador ou serviço não selecionado.')
    }

    // Tentar obter preço e nome da coleção servicos_catalogo; fallback para tabela fixa
    let valor = 490
    let servicoNome = 'Diagnóstico Orbis'

    try {
      const catalogoItem = $app.findFirstRecordByData('servicos_catalogo', 'servico_id', servicoId)
      if (catalogoItem) {
        valor = catalogoItem.getFloat('preco')
        servicoNome = catalogoItem.getString('nome')
      }
    } catch (_) {
      if (servicoId === 'laudo_pericial') {
        valor = 2850
        servicoNome = 'Laudo Pericial com ART'
      } else if (servicoId === 'assinatura_bureau') {
        valor = 7800
        servicoNome = 'Bureau ACP'
      } else if (servicoId === 'diagnostico') {
        valor = 490
        servicoNome = 'Diagnóstico Orbis'
      }
    }

    const cobrancasCol = $app.findCollectionByNameOrId('cobrancas')
    const cobrancaRecord = new Record(cobrancasCol)

    if (e.auth && e.auth.id) {
      cobrancaRecord.set('usuario', e.auth.id)
    } else if (body.usuario) {
      cobrancaRecord.set('usuario', body.usuario)
    } else {
      // Se não autenticado, associa ao usuário admin padrão
      try {
        const adminUser = $app.findAuthRecordByEmail('_pb_users_auth_', 'maurog1@hotmail.com')
        cobrancaRecord.set('usuario', adminUser.id)
      } catch (_) {}
    }

    cobrancaRecord.set('servico_id', servicoId)
    cobrancaRecord.set('servico_nome', servicoNome)
    cobrancaRecord.set('valor', valor)
    cobrancaRecord.set('tomador_nome', tomadorNome)
    cobrancaRecord.set('tomador_cpf_cnpj', tomadorCpfCnpj)
    cobrancaRecord.set('tomador_email', tomadorEmail)
    cobrancaRecord.set('tomador_endereco', tomadorEndereco)
    cobrancaRecord.set('provider', 'mercadopago')

    // Suporte a código de indicação de parceiro (?ref=ORB-PAR-XXXX ou body.ref)
    const refCode = body.ref || body.codigo_indicacao || ''
    if (refCode) {
      cobrancaRecord.set('codigo_indicacao', String(refCode).trim())
      try {
        const parceiroRec = $app.findFirstRecordByData(
          'parceiros',
          'codigo_parceiro',
          String(refCode).trim(),
        )
        if (parceiroRec) {
          cobrancaRecord.set('parceiro_id', parceiroRec.id)
        }
      } catch (_) {}
    }

    const txidGerado = 'TXID-' + $security.randomString(16).toUpperCase()
    cobrancaRecord.set('txid', txidGerado)

    const expiraEm = new Date(Date.now() + 30 * 60 * 1000).toISOString()
    cobrancaRecord.set('data_expiracao', expiraEm)

    const mpToken = $os.getenv('MERCADOPAGO_ACCESS_TOKEN') || ''
    let modoDegradacao = false
    let avisoGateway = ''

    if (mpToken && mpToken.trim() !== '') {
      // Chamada real à API do Mercado Pago
      try {
        const siteUrl = $os.getenv('SITE_URL') || 'https://orbisprotocol.org'
        const mpPayload = {
          transaction_amount: Number(valor),
          description: `${servicoNome} - Orbis Protocol`,
          payment_method_id: 'pix',
          payer: {
            email: tomadorEmail,
            first_name: tomadorNome.split(' ')[0],
            last_name: tomadorNome.split(' ').slice(1).join(' ') || 'Cliente',
            identification: {
              type: tomadorCpfCnpj.replace(/\D/g, '').length > 11 ? 'CNPJ' : 'CPF',
              number: tomadorCpfCnpj.replace(/\D/g, ''),
            },
          },
          notification_url: `${siteUrl}/backend/v1/cobranca/webhook`,
        }

        const res = $http.send({
          url: 'https://api.mercadopago.com/v1/payments',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${mpToken}`,
            'X-Idempotency-Key': txidGerado,
          },
          body: JSON.stringify(mpPayload),
          timeout: 20,
        })

        if (res.statusCode >= 200 && res.statusCode < 300 && res.json) {
          const mpData = res.json
          cobrancaRecord.set('provider_payment_id', String(mpData.id))
          cobrancaRecord.set('status', 'pendente')

          const poi = mpData.point_of_interaction || {}
          const txData = poi.transaction_data || {}
          cobrancaRecord.set('qr_code_payload', txData.qr_code || '')
          cobrancaRecord.set('qr_code_base64', txData.qr_code_base64 || '')
          cobrancaRecord.set('url_comprovante', txData.ticket_url || '')
        } else {
          // Erro retornado pela API Mercado Pago -> fallback controlado para simulação
          modoDegradacao = true
          avisoGateway = `Mercado Pago retornou status ${res.statusCode}. Operando em modo de simulação controlada.`
        }
      } catch (errApi) {
        modoDegradacao = true
        avisoGateway = `Falha na conexão com Mercado Pago (${errApi.message}). Operando em simulação controlada.`
      }
    } else {
      modoDegradacao = true
      avisoGateway = 'Gateway não configurado — cadastre MERCADOPAGO_ACCESS_TOKEN no cofre'
    }

    if (modoDegradacao) {
      cobrancaRecord.set('status', 'pendente_simulacao')
      cobrancaRecord.set('provider_payment_id', 'SIMULADO_' + $security.randomString(12))

      // Payload PIX Copia e Cola demonstrativo (EMV QRCPS padrão BR Code)
      const fakePixPayload = `00020126580014br.gov.bcb.pix0136${txidGerado}520400005303986540${valor.toFixed(2).length < 5 ? '0' : ''}${valor.toFixed(2)}5802BR5925MGM CONSULTORIA EMPRESARI6008CURITIBA62070503***6304ABCD`
      cobrancaRecord.set('qr_code_payload', fakePixPayload)
      cobrancaRecord.set('qr_code_base64', '')
    }

    const canonicalHash = `${cobrancaRecord.getString('txid')}|${cobrancaRecord.getString('tomador_cpf_cnpj')}|${valor}|${cobrancaRecord.getString('servico_id')}`
    cobrancaRecord.set('hash_integridade', $security.sha256(canonicalHash))

    $app.save(cobrancaRecord)

    return e.json(200, {
      cobranca_id: cobrancaRecord.id,
      servico_id: cobrancaRecord.getString('servico_id'),
      servico_nome: cobrancaRecord.getString('servico_nome'),
      valor: cobrancaRecord.getFloat('valor'),
      status: cobrancaRecord.getString('status'),
      txid: cobrancaRecord.getString('txid'),
      provider_payment_id: cobrancaRecord.getString('provider_payment_id'),
      qr_code_payload: cobrancaRecord.getString('qr_code_payload'),
      qr_code_base64: cobrancaRecord.getString('qr_code_base64'),
      data_expiracao: cobrancaRecord.getString('data_expiracao'),
      modo_degradacao: modoDegradacao,
      aviso_gateway: avisoGateway,
      hash_integridade: cobrancaRecord.getString('hash_integridade'),
    })
  } catch (err) {
    return e.json(500, { error: err.message || 'Erro ao gerar cobrança PIX.' })
  }
})
