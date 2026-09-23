routerAdd('POST', '/backend/v1/cobranca/webhook', (e) => {
  try {
    const body = e.requestInfo().body || {}
    const query = e.requestInfo().query || {}

    // Suporte tanto ao webhook PagBank (charges/orders/reference_id/id)
    // quanto a webhooks legados (body.data.id / query.id)
    const paymentId =
      body.id ||
      body.order_id ||
      body.data?.id ||
      query['data.id'] ||
      query.id ||
      (body.charges && body.charges[0] ? body.charges[0].id : '')
    const referenceId =
      body.reference_id ||
      body.order?.reference_id ||
      (body.charges && body.charges[0] ? body.charges[0].reference_id : '')

    if (!paymentId && !referenceId) {
      return e.json(200, { received: true, status: 'ignored_no_id' })
    }

    let cobranca = null
    // 1. Tenta buscar por provider_payment_id
    if (paymentId) {
      try {
        cobranca = $app.findFirstRecordByData('cobrancas', 'provider_payment_id', String(paymentId))
      } catch (_) {}
    }

    // 2. Tenta buscar por reference_id / txid
    if (!cobranca && referenceId) {
      try {
        cobranca = $app.findFirstRecordByData('cobrancas', 'txid', String(referenceId))
      } catch (_) {}
    }

    if (!cobranca) {
      return e.json(200, { received: true, status: 'payment_not_found' })
    }

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

    let isPago = false

    // Verificar se no próprio payload já veio status PAID do PagBank
    const chargeStatus = body.charges && body.charges[0] ? body.charges[0].status : ''
    const bodyStatus = (body.status || chargeStatus || '').toUpperCase()
    if (bodyStatus === 'PAID' || bodyStatus === 'PAGO' || bodyStatus === 'APPROVED') {
      isPago = true
    }

    // Se temos token oficial e id, podemos consultar a API do PagBank para validar
    if (!isPago && pagbankToken && pagbankToken.trim() !== '') {
      try {
        const isSandbox = ($os.getenv('PAGBANK_ENV') || '').toLowerCase() === 'sandbox'
        const baseUrlPagBank = isSandbox
          ? 'https://sandbox.api.pagseguro.com'
          : 'https://api.pagseguro.com'

        // Pode ser consulta de pedido (/orders/{id}) ou de charge (/charges/{id})
        const lookupId = cobranca.getString('provider_payment_id') || paymentId
        if (lookupId && !lookupId.startsWith('SIMULADO_')) {
          const res = $http.send({
            url: `${baseUrlPagBank}/orders/${lookupId}`,
            method: 'GET',
            headers: {
              Authorization: `Bearer ${pagbankToken.trim()}`,
              Accept: 'application/json',
            },
            timeout: 15,
          })

          if (res.statusCode === 200 && res.json) {
            const ord = res.json
            const ch = ord.charges || []
            const paidCharge = ch.find((c) => c.status === 'PAID')
            if (paidCharge || ord.status === 'PAID') {
              isPago = true
            }
          }
        }
      } catch (_) {}
    } else if (!isPago) {
      // Em modo de testes / simulação
      if (
        body.action === 'payment.created' ||
        body.type === 'payment' ||
        body.simulate_paid ||
        body.event === 'order.paid'
      ) {
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
              const role = uRec.getString('role')
              const prefix = role === 'cliente_acp' ? 'ORB-ACP-' : 'ORB-CLI-'
              uRec.set('cliente_codigo', `${prefix}${randSuffix}`)
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
              let pct = parceiroRec.getFloat('percentual_comissao') || 0
              if (pct <= 0) {
                try {
                  const bRecs = $app.findRecordsByFilter(
                    'business_settings',
                    'id != ""',
                    '-created',
                    1,
                    0,
                  )
                  if (bRecs && bRecs.length > 0) {
                    const pConfig = bRecs[0].getFloat('comissao_parceiro_percent')
                    if (typeof pConfig === 'number' && pConfig > 0) pct = pConfig
                  }
                } catch (_) {}
              }
              if (pct <= 0) pct = 10
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
    return e.json(500, { error: err.message || 'Erro ao processar webhook PagBank de cobrança.' })
  }
})
