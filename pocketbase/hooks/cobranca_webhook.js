routerAdd('POST', '/backend/v1/cobranca/webhook', (e) => {
  try {
    const body = e.requestInfo().body || {}
    const query = e.requestInfo().query || {}
    const paymentId = body.data?.id || query['data.id'] || query.id || body.id

    if (!paymentId) {
      return e.json(200, { received: true, status: 'ignored_no_id' })
    }

    let cobranca = null
    try {
      cobranca = $app.findFirstRecordByData('cobrancas', 'provider_payment_id', String(paymentId))
    } catch (_) {}

    if (!cobranca) {
      return e.json(200, { received: true, status: 'payment_not_found' })
    }

    const mpToken = $os.getenv('MERCADOPAGO_ACCESS_TOKEN') || ''
    let isPago = false

    if (mpToken && mpToken.trim() !== '') {
      try {
        const res = $http.send({
          url: `https://api.mercadopago.com/v1/payments/${paymentId}`,
          method: 'GET',
          headers: {
            Authorization: `Bearer ${mpToken}`,
          },
          timeout: 15,
        })

        if (res.statusCode === 200 && res.json && res.json.status === 'approved') {
          isPago = true
        }
      } catch (_) {}
    } else {
      // Em modo de testes / simulação
      if (body.action === 'payment.created' || body.type === 'payment' || body.simulate_paid) {
        isPago = true
      }
    }

    if (isPago) {
      cobranca.set('status', 'pago')
      cobranca.set('data_pagamento', new Date().toISOString())
      $app.save(cobranca)

      // Disparar emissão automática da NFS-e (ou tentativa)
      const focusToken = $os.getenv('FOCUSNFE_TOKEN') || ''
      if (!focusToken || focusToken.trim() === '') {
        cobranca.set('nfse_status', 'nfse_pendente_configuracao')
        $app.save(cobranca)
      }
    }

    return e.json(200, {
      received: true,
      cobranca_id: cobranca.id,
      status: cobranca.getString('status'),
    })
  } catch (err) {
    return e.json(500, { error: err.message || 'Erro ao processar webhook de cobrança.' })
  }
})
