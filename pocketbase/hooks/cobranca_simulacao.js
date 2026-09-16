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
