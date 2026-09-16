// Hook PocketBase para registro de verificação e auditoria de DPP (Consolidado e Individual)
// Captura o IP real da requisição e mascara conforme LGPD (Art. 5º, XI c/c Art. 13 - retenção minimizada)
// Exemplo: 189.40.122.95 -> 189.40.xxx.xxx | 2804:14d:5483:8100:... -> 2804:14d:xxxx:xxxx::
routerAdd('POST', '/backend/v1/cdv/consultas', (e) => {
  const body = e.requestInfo().body || {}
  const headers = e.requestInfo().headers || {}

  const alvoTipo = body.alvo_tipo === 'selo' ? 'selo' : 'lote'
  const alvoIdentificador = String(body.alvo_identificador || '')
    .trim()
    .toUpperCase()
  let loteId = String(body.lote_id || '').trim()
  const canal = ['qr', 'web', 'embed'].includes(body.canal) ? body.canal : 'web'
  const hashConferido = body.hash_conferido !== undefined ? Boolean(body.hash_conferido) : true
  const hashCalculado = String(body.hash_calculado || '').trim()

  if (!alvoIdentificador) {
    return e.json(400, {
      sucesso: false,
      erro: 'Informe o alvo_identificador (lote ID, baixa DETRAN ou selo DPP).',
    })
  }

  // 1. Capturar o IP da requisição
  // Verificar cabeçalhos de proxy reverso / cloudflare / load balancer
  const xForwardedFor = headers['x-forwarded-for'] || headers['X-Forwarded-For'] || ''
  const xRealIp = headers['x-real-ip'] || headers['X-Real-Ip'] || ''
  const cfConnectingIp = headers['cf-connecting-ip'] || headers['Cf-Connecting-Ip'] || ''

  let rawIp = ''
  if (cfConnectingIp) {
    rawIp = String(cfConnectingIp).trim()
  } else if (xForwardedFor) {
    rawIp = String(xForwardedFor).split(',')[0].trim()
  } else if (xRealIp) {
    rawIp = String(xRealIp).trim()
  } else if (e.request && e.request.remoteAddr) {
    rawIp = String(e.request.remoteAddr).split(':')[0].trim()
  }

  // 2. Mascarar o IP conforme LGPD
  let ipMascarado = 'xxx.xxx.xxx.xxx'
  if (rawIp) {
    // Tratar IPv4 vs IPv6
    if (rawIp.includes('.')) {
      // IPv4: manter 2 primeiros octetos (ex: 189.40.xxx.xxx)
      const parts = rawIp.split('.')
      if (parts.length === 4) {
        ipMascarado = `${parts[0]}.${parts[1]}.xxx.xxx`
      } else {
        ipMascarado = 'xxx.xxx.xxx.xxx'
      }
    } else if (rawIp.includes(':')) {
      // IPv6: manter os 2 primeiros hextetos
      const parts = rawIp.split(':')
      if (parts.length >= 2) {
        ipMascarado = `${parts[0]}:${parts[1]}:xxxx:xxxx::`
      } else {
        ipMascarado = 'xxxx:xxxx::'
      }
    }
  }

  const userAgent = String(headers['user-agent'] || headers['User-Agent'] || '').slice(0, 250)

  // 3. Se for lote e não veio loteId explícito, tentar resolver o id real do lote
  if (alvoTipo === 'lote' && !loteId) {
    try {
      const loteRec = $app.findFirstRecordByData(
        'cdv_lotes',
        'veiculo_baixa_detran',
        alvoIdentificador,
      )
      loteId = loteRec.id
    } catch (_) {
      try {
        const loteRec = $app.findCollectionByNameOrId('cdv_lotes')
        // Se já for o ID
        const testRec = $app.findRecordById('cdv_lotes', alvoIdentificador)
        loteId = testRec.id
      } catch (_) {
        loteId = alvoIdentificador
      }
    }
  } else if (alvoTipo === 'selo' && !loteId) {
    // Tentar descobrir lote_id da peça
    try {
      const pecaRec = $app.findFirstRecordByData('cdv_pecas', 'selo_dpp', alvoIdentificador)
      loteId = pecaRec.getString('lote') || ''
    } catch (_) {}
  }

  // 4. Salvar na coleção dpp_consultas
  try {
    const consultasCol = $app.findCollectionByNameOrId('dpp_consultas')
    const rec = new Record(consultasCol)
    rec.set('alvo_tipo', alvoTipo)
    rec.set('alvo_identificador', alvoIdentificador)
    rec.set('lote_id', loteId)
    rec.set('canal', canal)
    rec.set('hash_conferido', hashConferido)
    rec.set('hash_calculado', hashCalculado)
    rec.set('ip_mascarado', ipMascarado)
    rec.set('user_agent', userAgent)

    $app.save(rec)

    return e.json(201, {
      sucesso: true,
      id: rec.id,
      alvo_tipo: alvoTipo,
      alvo_identificador: alvoIdentificador,
      lote_id: loteId,
      canal: canal,
      hash_conferido: hashConferido,
      ip_mascarado: ipMascarado,
      created: rec.getString('created'),
    })
  } catch (err) {
    return e.json(500, {
      sucesso: false,
      erro: err.message || 'Falha ao registrar consulta DPP.',
    })
  }
})
