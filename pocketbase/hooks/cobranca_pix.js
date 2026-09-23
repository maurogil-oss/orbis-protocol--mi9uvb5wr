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
    let origemPreco = 'catalogo'
    let divergenciaPreco = false

    // Preços oficiais de fallback tabelados no código (com prioridade para business_settings se disponível)
    let precoFallback = 490
    if (servicoId === 'laudo_pericial') precoFallback = 2850
    else if (servicoId === 'assinatura_bureau') precoFallback = 7800

    try {
      const bRecs = $app.findRecordsByFilter('business_settings', 'id != ""', '-created', 1, 0)
      if (bRecs && bRecs.length > 0) {
        const planosJson = bRecs[0].get('precos_planos')
        if (planosJson && typeof planosJson === 'object') {
          if (planosJson[servicoId] !== undefined) {
            precoFallback = Number(planosJson[servicoId])
          }
        }
      }
    } catch (_) {}

    try {
      const catalogoItem = $app.findFirstRecordByData('servicos_catalogo', 'servico_id', servicoId)
      if (catalogoItem && catalogoItem.getBool('ativo')) {
        valor = catalogoItem.getFloat('preco')
        servicoNome = catalogoItem.getString('nome')
        origemPreco = 'catalogo'
        if (Number(valor) !== Number(precoFallback)) {
          divergenciaPreco = true
        }
      } else {
        valor = precoFallback
        origemPreco = 'contingencia'
        divergenciaPreco = true
      }
    } catch (_) {
      valor = precoFallback
      origemPreco = 'contingencia'
      divergenciaPreco = true
      if (servicoId === 'laudo_pericial') {
        servicoNome = 'Laudo Pericial com ART'
      } else if (servicoId === 'assinatura_bureau') {
        servicoNome = 'Bureau ACP'
      } else if (servicoId === 'diagnostico') {
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
      try {
        const adminUser = $app.findAuthRecordByEmail('_pb_users_auth_', 'maurog1@hotmail.com')
        cobrancaRecord.set('usuario', adminUser.id)
      } catch (_) {}
    }

    cobrancaRecord.set('servico_id', servicoId)
    cobrancaRecord.set('servico_nome', servicoNome)
    cobrancaRecord.set('valor', valor)
    cobrancaRecord.set('origem_preco', origemPreco)
    cobrancaRecord.set('divergencia_preco', divergenciaPreco)
    cobrancaRecord.set('tomador_nome', tomadorNome)
    cobrancaRecord.set('tomador_cpf_cnpj', tomadorCpfCnpj)
    cobrancaRecord.set('tomador_email', tomadorEmail)
    cobrancaRecord.set('tomador_endereco', tomadorEndereco)
    // Gateway primário oficial: PagBank (mantém compatibilidade com histórico)
    cobrancaRecord.set('provider', 'pagbank')

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

    // Credencial PagBank lida de variável de ambiente / cofre ($os.getenv)
    // Se não existir, verifica se há token em app_config_secrets ou no fallback legado
    let pagbankToken = $os.getenv('PAGBANK_TOKEN') || ''
    if (!pagbankToken) {
      try {
        const secretRec = $app.findFirstRecordByData('app_config_secrets', 'chave', 'PAGBANK_TOKEN')
        if (secretRec) {
          const v = secretRec.getString('valor')
          if (v && v !== '[MIGRADO_PARA_ENV_VAR]') {
            pagbankToken = v
          }
        }
      } catch (_) {}
    }

    let modoDegradacao = false
    let avisoGateway = ''

    if (pagbankToken && pagbankToken.trim() !== '') {
      // Chamada real à API PagBank v4 (Orders com QR Code PIX)
      try {
        const siteUrl = $os.getenv('SITE_URL') || 'https://www.orbis-protocol.com'
        const isSandbox = ($os.getenv('PAGBANK_ENV') || '').toLowerCase() === 'sandbox'
        const baseUrlPagBank = isSandbox
          ? 'https://sandbox.api.pagseguro.com'
          : 'https://api.pagseguro.com'

        const cleanDoc = tomadorCpfCnpj.replace(/\D/g, '')
        const centavos = Math.round(Number(valor) * 100)

        const pagbankPayload = {
          reference_id: txidGerado,
          customer: {
            name: tomadorNome,
            email: tomadorEmail,
            tax_id: cleanDoc,
          },
          items: [
            {
              reference_id: servicoId,
              name: `${servicoNome} - Orbis Protocol`,
              quantity: 1,
              unit_amount: centavos,
            },
          ],
          qr_codes: [
            {
              amount: {
                value: centavos,
              },
              expiration_date: expiraEm,
            },
          ],
          notification_urls: [`${siteUrl}/backend/v1/cobranca/webhook`],
        }

        const res = $http.send({
          url: `${baseUrlPagBank}/orders`,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${pagbankToken.trim()}`,
            Accept: 'application/json',
          },
          body: JSON.stringify(pagbankPayload),
          timeout: 20,
        })

        if (res.statusCode >= 200 && res.statusCode < 300 && res.json) {
          const pbData = res.json
          cobrancaRecord.set('provider_payment_id', String(pbData.id))
          cobrancaRecord.set('status', 'pendente')

          const qrs = pbData.qr_codes || []
          const qr0 = qrs.length > 0 ? qrs[0] : null
          const qrText = qr0?.text || ''
          const qrLinks = qr0?.links || []
          const pngLink = qrLinks.find((l) => l.media === 'image/png' || l.rel === 'QRCODE.PNG')

          cobrancaRecord.set('qr_code_payload', qrText)
          cobrancaRecord.set('qr_code_base64', '')
          if (pngLink && pngLink.href) {
            cobrancaRecord.set('url_comprovante', pngLink.href)
          }
        } else {
          modoDegradacao = true
          avisoGateway = `PagBank retornou status ${res.statusCode}. Operando em modo de simulação controlada.`
        }
      } catch (errApi) {
        modoDegradacao = true
        avisoGateway = `Falha na conexão com PagBank (${errApi.message}). Operando em simulação controlada.`
      }
    } else {
      // Degradação graciosa sem token no cofre
      modoDegradacao = true
      avisoGateway = 'Gateway não configurado — cadastre PAGBANK_TOKEN no cofre'
    }

    if (modoDegradacao) {
      cobrancaRecord.set('status', 'pendente_simulacao')
      cobrancaRecord.set('provider_payment_id', 'SIMULADO_PB_' + $security.randomString(12))

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
      provider: cobrancaRecord.getString('provider'),
      provider_payment_id: cobrancaRecord.getString('provider_payment_id'),
      qr_code_payload: cobrancaRecord.getString('qr_code_payload'),
      qr_code_base64: cobrancaRecord.getString('qr_code_base64'),
      data_expiracao: cobrancaRecord.getString('data_expiracao'),
      modo_degradacao: modoDegradacao,
      aviso_gateway: avisoGateway,
      hash_integridade: cobrancaRecord.getString('hash_integridade'),
      origem_preco: cobrancaRecord.getString('origem_preco'),
      divergencia_preco: cobrancaRecord.getBool('divergencia_preco'),
    })
  } catch (err) {
    return e.json(500, { error: err.message || 'Erro ao gerar cobrança PIX via PagBank.' })
  }
})
