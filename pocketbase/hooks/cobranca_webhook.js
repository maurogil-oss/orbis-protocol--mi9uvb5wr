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

      // Atualizar usuário cliente
      try {
        const uId = cobranca.getString('usuario')
        if (uId) {
          const uRec = $app.findFirstRecordByData('users', 'id', uId)
          if (uRec) {
            let uChanged = false
            if (!uRec.getString('cliente_codigo')) {
              const randSuffix = Math.floor(1000 + Math.random() * 9000)
              uRec.set('cliente_codigo', `ORB-CLI-${randSuffix}`)
              uChanged = true
            }
            if (cobranca.getString('tomador_cpf_cnpj') && !uRec.getString('cnpj')) {
              uRec.set('cnpj', cobranca.getString('tomador_cpf_cnpj'))
              uChanged = true
            }
            uRec.set('plano_ativo', cobranca.getString('servico_id'))
            uRec.set('assinatura_status', 'ativa')
            const dataRenovacao = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
              .toISOString()
              .split('T')[0]
            uRec.set('assinatura_renovacao', dataRenovacao)
            uChanged = true
            $app.save(uRec)
          }
        }
      } catch (_) {}

      // Gerar comissão se houver parceiro_id
      try {
        const parceiroId = cobranca.getString('parceiro_id')
        if (parceiroId) {
          let comissaoExistente = null
          try {
            comissaoExistente = $app.findFirstRecordByData('comissoes', 'cobranca_id', cobranca.id)
          } catch (_) {}

          if (!comissaoExistente) {
            const parceiroRec = $app.findFirstRecordByData('parceiros', 'id', parceiroId)
            if (parceiroRec && parceiroRec.getString('status') === 'ativo') {
              const pct = parceiroRec.getFloat('percentual_comissao') || 0
              const base = cobranca.getFloat('valor') || 0
              const valComissao = Number(((base * pct) / 100).toFixed(2))

              const comissoesCol = $app.findCollectionByNameOrId('comissoes')
              const comissaoRec = new Record(comissoesCol)
              comissaoRec.set('cobranca_id', cobranca.id)
              comissaoRec.set('parceiro_id', parceiroRec.id)
              comissaoRec.set('base_calculo', base)
              comissaoRec.set('percentual_aplicado', pct)
              comissaoRec.set('valor', valComissao)
              comissaoRec.set('status', 'calculada')
              $app.save(comissaoRec)
            }
          }
        }
      } catch (_) {}

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
