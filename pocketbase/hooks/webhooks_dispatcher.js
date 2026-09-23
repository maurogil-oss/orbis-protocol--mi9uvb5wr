/**
 * DISPATCHER CENTRAL DE WEBHOOKS B2B DO ORBIS PROTOCOL
 *
 * Envia notificações HTTP POST assinadas com HMAC-SHA256 para clientes cadastrados
 * quando eventos relevantes ocorrem no sistema:
 * - lote_cdv_recebido: Novo lote de peças veiculares registrado via API / CDV
 * - selo_emitido: Novo Passaporte Digital ou Selo emitido
 *
 * Regra Skip Cloud: Funções auxiliares devem ser inline dentro de cada callback.
 */

// 1. Hook pós-criação de Lote CDV (lote_cdv_recebido)
onRecordAfterCreateSuccess((e) => {
  try {
    const record = e.record
    const userId = record.get('usuario')
    if (!userId) return

    const app = e.app
    let configs = []
    try {
      configs = app.findRecordsByFilter(
        'webhooks_config',
        'usuario = {:userId} && ativo = true',
        '-created',
        50,
        0,
        { userId: userId },
      )
    } catch (_) {
      return
    }

    if (!configs || configs.length === 0) return

    const evento = 'lote_cdv_recebido'
    const dados = {
      lote_id: record.id,
      codigo_lote: record.get('codigo_lote'),
      origem_cdv: record.get('origem_cdv'),
      veiculo_modelo: record.get('veiculo_modelo'),
      veiculo_ano: record.get('veiculo_ano'),
      quantidade_pecas: record.get('quantidade_pecas'),
      total_kg_evitados_co2: record.get('total_kg_evitados_co2'),
      hash_integridade_lote: record.get('hash_integridade_lote'),
    }

    const payloadCompleto = {
      id: 'evt_' + $security.randomString(16),
      evento: evento,
      timestamp: new Date().toISOString(),
      ambiente: 'production',
      versao_api: '2025-01',
      dados: dados,
    }

    const payloadStr = JSON.stringify(payloadCompleto)

    for (let i = 0; i < configs.length; i++) {
      const cfg = configs[i]
      let eventosInscritos = cfg.get('eventos_ativos') || []
      if (typeof eventosInscritos === 'string') {
        try {
          eventosInscritos = JSON.parse(eventosInscritos)
        } catch (_) {
          eventosInscritos = [eventosInscritos]
        }
      }

      const inscrito =
        eventosInscritos.includes('*') ||
        eventosInscritos.includes(evento) ||
        eventosInscritos.includes('lote_cdv_recebido')

      if (!inscrito) continue

      const urlDestino = cfg.get('url_destino')
      const secret = cfg.get('secret_hmac') || 'orbis_secret_default'
      let signature = ''
      try {
        signature = $security.hs256(payloadStr, secret)
      } catch (_) {
        signature = $security.sha256(secret + ':' + payloadStr)
      }

      const inicioMs = Date.now()
      let httpStatus = 0
      let statusEntrega = 'falha'
      let corpoResp = ''

      try {
        const resp = $http.send({
          url: urlDestino,
          method: 'POST',
          timeout: 10,
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'OrbisProtocol-Webhook/1.0 (+https://www.orbis-protocol.com)',
            'X-Orbis-Event': evento,
            'X-Orbis-Signature': signature,
            'X-Orbis-Timestamp': payloadCompleto.timestamp,
          },
          body: payloadStr,
        })
        httpStatus = resp.statusCode
        corpoResp = (resp.raw || resp.body || '').toString().slice(0, 1000)
        if (httpStatus >= 200 && httpStatus < 300) {
          statusEntrega = 'sucesso'
        }
      } catch (err) {
        httpStatus = 0
        corpoResp = 'Erro de envio: ' + (err.message || String(err))
      }

      const duracaoMs = Date.now() - inicioMs

      try {
        const entregasCol = app.findCollectionByNameOrId('webhooks_entregas')
        const reg = new Record(entregasCol)
        reg.set('webhook_config', cfg.id)
        reg.set('usuario', userId)
        reg.set('evento', evento)
        reg.set('url_destino', urlDestino)
        reg.set('payload_json', payloadCompleto)
        reg.set('signature_hmac', signature)
        reg.set('http_status', httpStatus)
        reg.set('status_entrega', statusEntrega)
        reg.set('resposta_corpo', corpoResp)
        reg.set('tempo_resposta_ms', duracaoMs)
        reg.set('tentativa', 1)
        app.save(reg)
      } catch (_) {}
    }
  } catch (err) {
    console.error('[Hook Webhook lote_cdv_recebido] Erro:', err)
  }
}, 'cdv_lotes')

// 2. Hook pós-criação de Selo/DPP (selo_emitido)
onRecordAfterCreateSuccess((e) => {
  try {
    const record = e.record
    const userId = record.get('usuario')
    if (!userId) return

    const app = e.app
    let configs = []
    try {
      configs = app.findRecordsByFilter(
        'webhooks_config',
        'usuario = {:userId} && ativo = true',
        '-created',
        50,
        0,
        { userId: userId },
      )
    } catch (_) {
      return
    }

    if (!configs || configs.length === 0) return

    const evento = 'selo_emitido'
    const dados = {
      selo_id: record.id,
      codigo_selo: record.get('codigo_selo') || record.get('codigo_canonico'),
      tipo_selo: record.get('tipo_selo') || record.get('tipo'),
      status: record.get('status'),
      hash_sha256: record.get('hash_sha256') || record.get('hash_integridade'),
    }

    const payloadCompleto = {
      id: 'evt_' + $security.randomString(16),
      evento: evento,
      timestamp: new Date().toISOString(),
      ambiente: 'production',
      versao_api: '2025-01',
      dados: dados,
    }

    const payloadStr = JSON.stringify(payloadCompleto)

    for (let i = 0; i < configs.length; i++) {
      const cfg = configs[i]
      let eventosInscritos = cfg.get('eventos_ativos') || []
      if (typeof eventosInscritos === 'string') {
        try {
          eventosInscritos = JSON.parse(eventosInscritos)
        } catch (_) {
          eventosInscritos = [eventosInscritos]
        }
      }

      const inscrito =
        eventosInscritos.includes('*') ||
        eventosInscritos.includes(evento) ||
        eventosInscritos.includes('selo_emitido')

      if (!inscrito) continue

      const urlDestino = cfg.get('url_destino')
      const secret = cfg.get('secret_hmac') || 'orbis_secret_default'
      let signature = ''
      try {
        signature = $security.hs256(payloadStr, secret)
      } catch (_) {
        signature = $security.sha256(secret + ':' + payloadStr)
      }

      const inicioMs = Date.now()
      let httpStatus = 0
      let statusEntrega = 'falha'
      let corpoResp = ''

      try {
        const resp = $http.send({
          url: urlDestino,
          method: 'POST',
          timeout: 10,
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'OrbisProtocol-Webhook/1.0 (+https://www.orbis-protocol.com)',
            'X-Orbis-Event': evento,
            'X-Orbis-Signature': signature,
            'X-Orbis-Timestamp': payloadCompleto.timestamp,
          },
          body: payloadStr,
        })
        httpStatus = resp.statusCode
        corpoResp = (resp.raw || resp.body || '').toString().slice(0, 1000)
        if (httpStatus >= 200 && httpStatus < 300) {
          statusEntrega = 'sucesso'
        }
      } catch (err) {
        httpStatus = 0
        corpoResp = 'Erro de envio: ' + (err.message || String(err))
      }

      const duracaoMs = Date.now() - inicioMs

      try {
        const entregasCol = app.findCollectionByNameOrId('webhooks_entregas')
        const reg = new Record(entregasCol)
        reg.set('webhook_config', cfg.id)
        reg.set('usuario', userId)
        reg.set('evento', evento)
        reg.set('url_destino', urlDestino)
        reg.set('payload_json', payloadCompleto)
        reg.set('signature_hmac', signature)
        reg.set('http_status', httpStatus)
        reg.set('status_entrega', statusEntrega)
        reg.set('resposta_corpo', corpoResp)
        reg.set('tempo_resposta_ms', duracaoMs)
        reg.set('tentativa', 1)
        app.save(reg)
      } catch (_) {}
    }
  } catch (err) {
    console.error('[Hook Webhook selo_emitido] Erro:', err)
  }
}, 'selos')

// 3. Rota HTTP para disparo e teste manual de webhook (ou reenvio)
routerAdd('POST', '/backend/v1/orbis/webhooks/testar', (c) => {
  const authRecord = c.get('authRecord')
  if (!authRecord) {
    return c.json(401, { error: 'Autenticação necessária' })
  }

  const data = $apis.requestInfo(c).data || {}
  const webhookConfigId = data.webhook_config_id
  const eventoTeste = data.evento || 'teste_conexao'

  if (!webhookConfigId) {
    return c.json(400, { error: 'webhook_config_id é obrigatório' })
  }

  const app = $app
  let cfg = null
  try {
    cfg = app.findRecordById('webhooks_config', webhookConfigId)
  } catch (_) {
    return c.json(404, { error: 'Configuração de webhook não encontrada' })
  }

  // Verifica propriedade ou se é admin
  const role = authRecord.get('role')
  if (role !== 'admin' && cfg.get('usuario') !== authRecord.id) {
    return c.json(403, { error: 'Acesso negado a esta configuração' })
  }

  const urlDestino = cfg.get('url_destino')
  const secret = cfg.get('secret_hmac') || 'orbis_secret_default'

  const payloadTeste = {
    id: 'evt_test_' + $security.randomString(16),
    evento: eventoTeste,
    timestamp: new Date().toISOString(),
    ambiente: 'test_sandbox',
    versao_api: '2025-01',
    dados: {
      mensagem: 'Disparo de teste de integração do Orbis Protocol',
      usuario_id: authRecord.id,
      email: authRecord.get('email'),
      exemplo_dado_fiscal: {
        documento: 'NF-e 000.124.981',
        tco2e_evitada: 12.85,
        status: 'homologado',
      },
    },
  }

  const payloadStr = JSON.stringify(payloadTeste)
  let signature = ''
  try {
    signature = $security.hs256(payloadStr, secret)
  } catch (_) {
    signature = $security.sha256(secret + ':' + payloadStr)
  }

  const inicioMs = Date.now()
  let httpStatus = 0
  let corpoResp = ''
  let statusEntrega = 'falha'

  try {
    const resp = $http.send({
      url: urlDestino,
      method: 'POST',
      timeout: 8,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'OrbisProtocol-WebhookTest/1.0',
        'X-Orbis-Event': eventoTeste,
        'X-Orbis-Signature': signature,
        'X-Orbis-Timestamp': payloadTeste.timestamp,
      },
      body: payloadStr,
    })

    httpStatus = resp.statusCode
    corpoResp = (resp.raw || resp.body || '').toString().slice(0, 1000)
    if (httpStatus >= 200 && httpStatus < 300) {
      statusEntrega = 'sucesso'
    }
  } catch (err) {
    httpStatus = 0
    corpoResp = 'Erro ao conectar à URL de destino: ' + (err.message || String(err))
  }

  const duracaoMs = Date.now() - inicioMs

  // Grava o log da entrega de teste
  try {
    const entregasCol = app.findCollectionByNameOrId('webhooks_entregas')
    const reg = new Record(entregasCol)
    reg.set('webhook_config', cfg.id)
    reg.set('usuario', authRecord.id)
    reg.set('evento', eventoTeste)
    reg.set('url_destino', urlDestino)
    reg.set('payload_json', payloadTeste)
    reg.set('signature_hmac', signature)
    reg.set('http_status', httpStatus)
    reg.set('status_entrega', statusEntrega)
    reg.set('resposta_corpo', corpoResp)
    reg.set('tempo_resposta_ms', duracaoMs)
    reg.set('tentativa', 1)
    app.save(reg)
  } catch (logErr) {
    console.error('[Webhooks Teste] Falha ao gravar log:', logErr)
  }

  return c.json(200, {
    ok: statusEntrega === 'sucesso',
    http_status: httpStatus,
    status_entrega: statusEntrega,
    tempo_resposta_ms: duracaoMs,
    resposta_corpo: corpoResp,
    signature_gerada: signature,
    payload_enviado: payloadTeste,
  })
})
