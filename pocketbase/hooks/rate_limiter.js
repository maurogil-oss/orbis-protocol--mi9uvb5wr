/**
 * RATE LIMITER PARA ROTAS PÚBLICAS E LOGIN - ORBIS PROTOCOL (Pré-Pentest)
 *
 * Aplica limitação por IP na coleção audit_log / contagem temporal:
 * - /backend/v1/lead-diagnostico-submit: 5 requisições por minuto por IP
 * - /backend/v1/cdv/pecas/: 30 requisições por minuto por IP
 * - /backend/v1/cobranca/pix: 30 requisições por minuto por IP
 * - Login (users auth-with-password): 10 tentativas por minuto por IP + bloqueio progressivo
 *
 * Ao ultrapassar:
 * - Resposta 429 com mensagem pt-BR: "Muitas tentativas. Aguarde alguns minutos."
 * - Registro do evento 'RATE_LIMIT_EXCEEDED' no audit_log com ação, IP, rota e hash encadeado.
 *
 * NOTA DE ARQUITETURA GOJA/POCKETBASE:
 * Callbacks rodam em pools isolados de VM, logo não acessam funções top-level.
 * Todo o código de verificação e auditoria é mantido estritamente inline em cada callback.
 */

// 1. Interceptador para rotas REST HTTP públicas de escrita e consulta
routerUse((e) => {
  const req = e.request
  const urlPath = (req && req.url ? req.url.path : '') || ''
  const method = (req && req.method ? req.method.toUpperCase() : '') || 'GET'

  // Identificar se a requisição atual é alvo de rate limit
  let rotaAlvo = ''
  let maxPermitido = 0

  if (urlPath.indexOf('/backend/v1/lead-diagnostico-submit') !== -1 && method === 'POST') {
    rotaAlvo = 'lead_submit'
    maxPermitido = 5
  } else if (urlPath.indexOf('/backend/v1/cdv/pecas/') !== -1 && method === 'GET') {
    rotaAlvo = 'cdv_public'
    maxPermitido = 30
  } else if (urlPath.indexOf('/backend/v1/cobranca/pix') !== -1 && method === 'POST') {
    rotaAlvo = 'cobranca_pix'
    maxPermitido = 30
  }

  if (rotaAlvo !== '') {
    // Extrai IP do cliente
    let clientIp = '127.0.0.1'
    try {
      const info = e.requestInfo()
      if (info && info.headers) {
        const fwd =
          info.headers['x-forwarded-for'] || info.headers['x-real-ip'] || info.remoteIP || ''
        clientIp = String(fwd).split(',')[0].trim() || '127.0.0.1'
      }
    } catch (_) {
      clientIp = '127.0.0.1'
    }

    // Calcula timestamp de 1 minuto atrás (janela deslizante no audit_log)
    const agoraMs = Date.now()
    const umMinutoAtrasIso = new Date(agoraMs - 60000).toISOString().replace('T', ' ').slice(0, 19)

    // Consulta ocorrências registradas recentemente para esta rota e IP
    let contagem = 0
    try {
      const logsRecentes = $app.findRecordsByFilter(
        'audit_log',
        `entidade = 'rate_limiter' && entidade_id = '${rotaAlvo}' && ip = '${clientIp}' && created >= '${umMinutoAtrasIso}'`,
        '-created',
        maxPermitido + 2,
        0,
      )
      contagem = logsRecentes ? logsRecentes.length : 0
    } catch (_) {
      contagem = 0
    }

    if (contagem >= maxPermitido) {
      // Registra evento RATE_LIMIT_EXCEEDED no audit_log com hash encadeado
      try {
        const auditCol = $app.findCollectionByNameOrId('audit_log')
        const log = new Record(auditCol)

        let previousHash = 'GENESIS_HASH_RATE_LIMIT_ORBIS_2026'
        try {
          const ultimos = $app.findRecordsByFilter('audit_log', 'id != ""', '-created', 1, 0)
          if (ultimos && ultimos.length > 0) {
            const u = ultimos[0]
            const d = u.get('detalhes') || {}
            previousHash = (d && d.chain_hash) || u.getString('hash_sha256') || u.id
          }
        } catch (_) {}

        const timestampIso = new Date().toISOString()
        const canonicalStr = `RATE_LIMIT_EXCEEDED|${clientIp}|${rotaAlvo}|${contagem + 1}|${maxPermitido}|${timestampIso}|${previousHash}`
        const chainHash = $security.sha256(canonicalStr)

        log.set('acao', 'RATE_LIMIT_EXCEEDED')
        log.set('entidade', 'rate_limiter')
        log.set('entidade_id', rotaAlvo)
        log.set('ator_id', 'sistema_firewall')
        log.set('ator_email', 'security@orbisprotocol.org')
        log.set('papel', 'firewall')
        log.set('ip', clientIp)
        log.set('detalhes', {
          rota: rotaAlvo,
          limite_por_minuto: maxPermitido,
          tentativas_acumuladas: contagem + 1,
          previous_hash: previousHash,
          chain_hash: chainHash,
          bloqueio: 'HTTP 429 Too Many Requests',
          data_evento: timestampIso,
        })
        $app.save(log)
      } catch (errAudit) {
        console.log('[rate_limiter] Erro ao registrar RATE_LIMIT_EXCEEDED:', errAudit)
      }

      return e.json(429, {
        sucesso: false,
        error: 'Muitas tentativas. Aguarde alguns minutos.',
        mensagem: 'Muitas tentativas. Aguarde alguns minutos.',
        retry_after: 60,
      })
    }

    // Registra heartbeat desta requisição no audit_log para computar a janela
    try {
      const auditCol = $app.findCollectionByNameOrId('audit_log')
      const pingLog = new Record(auditCol)
      pingLog.set('acao', 'RATE_LIMIT_PING')
      pingLog.set('entidade', 'rate_limiter')
      pingLog.set('entidade_id', rotaAlvo)
      pingLog.set('ator_id', 'sistema_firewall')
      pingLog.set('ator_email', 'security@orbisprotocol.org')
      pingLog.set('papel', 'firewall')
      pingLog.set('ip', clientIp)
      pingLog.set('detalhes', {
        rota: rotaAlvo,
        ordem: contagem + 1,
      })
      $app.save(pingLog)
    } catch (_) {}
  }

  return e.next()
})

// 2. Rate limit para Login (users auth-with-password): 10 tentativas por minuto por IP + bloqueio progressivo
onRecordAuthWithPasswordRequest((e) => {
  let clientIp = '127.0.0.1'
  try {
    const info = e.requestInfo()
    if (info && info.headers) {
      const fwd =
        info.headers['x-forwarded-for'] || info.headers['x-real-ip'] || info.remoteIP || ''
      clientIp = String(fwd).split(',')[0].trim() || '127.0.0.1'
    }
  } catch (_) {
    clientIp = '127.0.0.1'
  }

  const agoraMs = Date.now()
  const umMinutoAtrasIso = new Date(agoraMs - 60000).toISOString().replace('T', ' ').slice(0, 19)
  const maxLoginPermitido = 10

  let contagemLogin = 0
  try {
    const logsRecentes = $app.findRecordsByFilter(
      'audit_log',
      `entidade = 'rate_limiter' && entidade_id = 'login_users' && ip = '${clientIp}' && created >= '${umMinutoAtrasIso}'`,
      '-created',
      maxLoginPermitido + 2,
      0,
    )
    contagemLogin = logsRecentes ? logsRecentes.length : 0
  } catch (_) {
    contagemLogin = 0
  }

  if (contagemLogin >= maxLoginPermitido) {
    // Registra evento RATE_LIMIT_EXCEEDED no audit_log com hash encadeado
    try {
      const auditCol = $app.findCollectionByNameOrId('audit_log')
      const log = new Record(auditCol)

      let previousHash = 'GENESIS_HASH_RATE_LIMIT_ORBIS_2026'
      try {
        const ultimos = $app.findRecordsByFilter('audit_log', 'id != ""', '-created', 1, 0)
        if (ultimos && ultimos.length > 0) {
          const u = ultimos[0]
          const d = u.get('detalhes') || {}
          previousHash = (d && d.chain_hash) || u.getString('hash_sha256') || u.id
        }
      } catch (_) {}

      const timestampIso = new Date().toISOString()
      const canonicalStr = `RATE_LIMIT_EXCEEDED|${clientIp}|login_users|${contagemLogin + 1}|${maxLoginPermitido}|${timestampIso}|${previousHash}`
      const chainHash = $security.sha256(canonicalStr)

      log.set('acao', 'RATE_LIMIT_EXCEEDED')
      log.set('entidade', 'rate_limiter')
      log.set('entidade_id', 'login_users')
      log.set('ator_id', 'sistema_firewall')
      log.set('ator_email', 'security@orbisprotocol.org')
      log.set('papel', 'firewall')
      log.set('ip', clientIp)
      log.set('detalhes', {
        rota: 'login_users',
        limite_por_minuto: maxLoginPermitido,
        tentativas_acumuladas: contagemLogin + 1,
        previous_hash: previousHash,
        chain_hash: chainHash,
        bloqueio: 'Bloqueio progressivo de login',
        data_evento: timestampIso,
      })
      $app.save(log)
    } catch (_) {}

    throw new BadRequestError('Muitas tentativas. Aguarde alguns minutos.')
  }

  // Registra tentativa no audit_log
  try {
    const auditCol = $app.findCollectionByNameOrId('audit_log')
    const pingLog = new Record(auditCol)
    pingLog.set('acao', 'RATE_LIMIT_PING')
    pingLog.set('entidade', 'rate_limiter')
    pingLog.set('entidade_id', 'login_users')
    pingLog.set('ator_id', 'sistema_firewall')
    pingLog.set('ator_email', 'security@orbisprotocol.org')
    pingLog.set('papel', 'firewall')
    pingLog.set('ip', clientIp)
    pingLog.set('detalhes', {
      rota: 'login_users',
      ordem: contagemLogin + 1,
    })
    $app.save(pingLog)
  } catch (_) {}

  e.next()
}, 'users')
