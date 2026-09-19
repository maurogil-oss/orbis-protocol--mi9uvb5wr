routerAdd('POST', '/backend/v1/cobranca/confirmar-simulacao', (e) => {
  try {
    const body = e.requestInfo().body || {}
    const cobrancaId = body.cobranca_id ? String(body.cobranca_id).trim() : ''

    if (!cobrancaId) {
      return e.badRequestError('ID da cobrança é obrigatório.')
    }

    const cobranca = $app.findCollectionByNameOrId('cobrancas')
    const rec = $app.findFirstRecordByData('cobrancas', 'id', cobrancaId)

    rec.set('status', 'pago')
    rec.set('data_pagamento', new Date().toISOString())

    // Atualizar cadastro do usuário cliente (cliente_codigo, plano_ativo, etc.)
    try {
      const uId = rec.getString('usuario')
      if (uId) {
        const uRec = $app.findFirstRecordByData('users', 'id', uId)
        if (uRec) {
          let uChanged = false
          if (!uRec.getString('cliente_codigo')) {
            const randSuffix = Math.floor(1000 + Math.random() * 9000)
            uRec.set('cliente_codigo', `ORB-CLI-${randSuffix}`)
            uChanged = true
          }
          if (rec.getString('tomador_cpf_cnpj') && !uRec.getString('cnpj')) {
            uRec.set('cnpj', rec.getString('tomador_cpf_cnpj'))
            uChanged = true
          }
          uRec.set('plano_ativo', rec.getString('servico_id'))
          uRec.set('assinatura_status', 'ativa')
          const dataRenovacao = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split('T')[0]
          uRec.set('assinatura_renovacao', dataRenovacao)
          uChanged = true
          $app.save(uRec)
        }
      }
    } catch (eUser) {
      console.log('Aviso ao atualizar user no pagamento:', eUser)
    }

    // Gerar comissão se houver parceiro associado
    try {
      const parceiroId = rec.getString('parceiro_id')
      if (parceiroId) {
        // Verificar se já existe comissão para esta cobrança
        let comissaoExistente = null
        try {
          comissaoExistente = $app.findFirstRecordByData('comissoes', 'cobranca_id', rec.id)
        } catch (_) {}

        if (!comissaoExistente) {
          const parceiroRec = $app.findFirstRecordByData('parceiros', 'id', parceiroId)
          if (parceiroRec && parceiroRec.getString('status') === 'ativo') {
            const pct = parceiroRec.getFloat('percentual_comissao') || 0
            const base = rec.getFloat('valor') || 0
            const valComissao = Number(((base * pct) / 100).toFixed(2))

            const comissoesCol = $app.findCollectionByNameOrId('comissoes')
            const comissaoRec = new Record(comissoesCol)
            comissaoRec.set('cobranca_id', rec.id)
            comissaoRec.set('parceiro_id', parceiroRec.id)
            comissaoRec.set('base_calculo', base)
            comissaoRec.set('percentual_aplicado', pct) // Percentual congelado na criação
            comissaoRec.set('valor', valComissao)
            comissaoRec.set('status', 'calculada')
            $app.save(comissaoRec)
          }
        }
      }
    } catch (eCom) {
      console.log('Aviso ao calcular comissão:', eCom)
    }

    // Verificar segredo de emissão de NFS-e (Focus NFe)
    const focusToken = $os.getenv('FOCUSNFE_TOKEN') || ''
    if (focusToken && focusToken.trim() !== '') {
      // Provedor Focus NFe configurado
      rec.set('nfse_status', 'emitida')
      rec.set('nfse_numero', 'NFS-' + String(Math.floor(100000 + Math.random() * 900000)))
      rec.set('nfse_serie', 'E')
      rec.set('nfse_verificacao', $security.randomString(8).toUpperCase())
      rec.set('nfse_url', 'https://focusnfe.com.br/danfe/homologacao/demo.pdf')
    } else {
      // Modo Degradação NFS-e: sem segredo, marca "nfse_pendente_configuracao"
      rec.set('nfse_status', 'nfse_pendente_configuracao')
      rec.set('nfse_numero', 'PEND-CONF')
      rec.set('nfse_serie', 'U')
      rec.set('nfse_verificacao', 'AGUARDANDO_FOCUSNFE_TOKEN')
      rec.set('nfse_url', '')
    }

    $app.save(rec)

    return e.json(200, {
      id: rec.id,
      status: rec.getString('status'),
      data_pagamento: rec.getString('data_pagamento'),
      nfse_status: rec.getString('nfse_status'),
      nfse_numero: rec.getString('nfse_numero'),
      nfse_serie: rec.getString('nfse_serie'),
      nfse_verificacao: rec.getString('nfse_verificacao'),
      nfse_url: rec.getString('nfse_url'),
    })
  } catch (err) {
    return e.json(500, { error: err.message || 'Erro ao confirmar liquidação de cobrança.' })
  }
})
