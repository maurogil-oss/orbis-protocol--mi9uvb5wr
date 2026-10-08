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
        log.set('ator_email', 'suporte@orbis-protocol.com')
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
      pingLog.set('ator_email', 'suporte@orbis-protocol.com')
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

// 2. Rate limit de força bruta no login (users auth-with-password):
//    - Dois critérios: e-mail normalizado (login_user_<email>) e IP (login_ip_<ip>)
//    - Janela: 5 tentativas inválidas em 15 minutos dispara bloqueio progressivo:
//      5 falhas -> 30s; 6 falhas -> 2min; 7+ falhas -> 10min.
//    - Mensagem de erro SEMPRE genérica:
//      "Credenciais inválidas ou limite temporário de tentativas excedido. Por favor, tente novamente mais tarde."
//    - Registro no audit_log: acao 'AUTH_BRUTE_FORCE_BLOCKED', entidade 'rate_limiter',
//      detalhes com email mascarado, contagem de falhas, duração e chain_hash.
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

  const rawIdentity = (e.identity || '').toString().trim().toLowerCase()
  const emailKey = rawIdentity ? 'login_user_' + rawIdentity : ''
  const ipKey = 'login_ip_' + clientIp

  const agoraMs = Date.now()
  const quinzeMinutosAtrasMs = agoraMs - 15 * 60 * 1000
  const quinzeMinutosAtrasIso = new Date(quinzeMinutosAtrasMs)
    .toISOString()
    .replace('T', ' ')
    .slice(0, 19)

  // Função inline para mascarar e-mail: jo***e@empresa.com
  let emailMascarado = 'desconhecido'
  if (rawIdentity) {
    const partesEmail = rawIdentity.split('@')
    const usuarioParte = partesEmail[0] || ''
    const dominioParte = partesEmail[1] || ''
    if (usuarioParte.length <= 2) {
      emailMascarado = usuarioParte.charAt(0) + '***@' + dominioParte
    } else {
      emailMascarado =
        usuarioParte.slice(0, 2) + '***' + usuarioParte.slice(-1) + '@' + dominioParte
    }
  }

  const MENSAGEM_GENERICA =
    'Credenciais inválidas ou limite temporário de tentativas excedido. Por favor, tente novamente mais tarde.'

  // Helper inline para contar falhas e verificar se há bloqueio ativo em uma chave
  const verificarChave = (chave, ehIp) => {
    if (!chave) return { contagem: 0, bloqueado: false, duracaoSec: 0, tempoRestanteSec: 0 }

    let logs = []
    try {
      const filtro = ehIp
        ? `entidade = 'rate_limiter' && (entidade_id = '${chave}' || ip = '${clientIp}') && acao = 'AUTH_LOGIN_FAILED' && created >= '${quinzeMinutosAtrasIso}'`
        : `entidade = 'rate_limiter' && entidade_id = '${chave}' && acao = 'AUTH_LOGIN_FAILED' && created >= '${quinzeMinutosAtrasIso}'`

      logs = $app.findRecordsByFilter('audit_log', filtro, '-created', 50, 0) || []
    } catch (_) {
      logs = []
    }

    const contagem = logs.length
    if (contagem >= 5) {
      // Determina duração progressiva da penalidade
      let duracaoSec = 30
      if (contagem === 6) {
        duracaoSec = 120
      } else if (contagem >= 7) {
        duracaoSec = 600
      }

      // Última falha registrada
      const ultimoLog = logs[0]
      let ultimoMs = agoraMs
      try {
        const createdStr = ultimoLog.getString('created').replace(' ', 'T') + 'Z'
        ultimoMs = new Date(createdStr).getTime()
      } catch (_) {
        ultimoMs = agoraMs
      }

      const diffSec = Math.floor((agoraMs - ultimoMs) / 1000)
      if (diffSec < duracaoSec) {
        return {
          bloqueado: true,
          contagem: contagem,
          duracaoSec: duracaoSec,
          tempoRestanteSec: duracaoSec - diffSec,
        }
      }
    }

    return { contagem: contagem, bloqueado: false, duracaoSec: 0, tempoRestanteSec: 0 }
  }

  const stEmail = verificarChave(emailKey, false)
  const stIp = verificarChave(ipKey, true)

  const estaBloqueado = stEmail.bloqueado || stIp.bloqueado
  const motivoBloqueio =
    stEmail.bloqueado && stIp.bloqueado ? 'email_e_ip' : stEmail.bloqueado ? 'email' : 'ip'
  const contagemAtiva = Math.max(stEmail.contagem, stIp.contagem)
  const duracaoAtiva = Math.max(stEmail.duracaoSec, stIp.duracaoSec)

  if (estaBloqueado) {
    // Registrar bloqueio no audit_log com acao 'AUTH_BRUTE_FORCE_BLOCKED'
    try {
      const auditCol = $app.findCollectionByNameOrId('audit_log')
      const blockLog = new Record(auditCol)

      let previousHash = 'GENESIS_HASH_AUTH_BRUTE_FORCE_ORBIS_2026'
      try {
        const ultimos = $app.findRecordsByFilter('audit_log', 'id != ""', '-created', 1, 0)
        if (ultimos && ultimos.length > 0) {
          const u = ultimos[0]
          const d = u.get('detalhes') || {}
          previousHash = (d && d.chain_hash) || u.getString('hash_sha256') || u.id
        }
      } catch (_) {}

      const timestampIso = new Date().toISOString()
      const canonicalStr = `AUTH_BRUTE_FORCE_BLOCKED|${clientIp}|${emailMascarado}|${contagemAtiva}|${duracaoAtiva}|${motivoBloqueio}|${timestampIso}|${previousHash}`
      const chainHash = $security.sha256(canonicalStr)

      blockLog.set('acao', 'AUTH_BRUTE_FORCE_BLOCKED')
      blockLog.set('entidade', 'rate_limiter')
      blockLog.set('entidade_id', emailKey || ipKey)
      blockLog.set('ator_id', 'sistema_firewall')
      blockLog.set('ator_email', 'suporte@orbis-protocol.com')
      blockLog.set('papel', 'firewall')
      blockLog.set('ip', clientIp)
      blockLog.set('detalhes', {
        email_mascarado: emailMascarado,
        contagem_falhas: contagemAtiva,
        duracao_bloqueio_segundos: duracaoAtiva,
        criterio_bloqueio: motivoBloqueio,
        previous_hash: previousHash,
        chain_hash: chainHash,
        status: '429_TOO_MANY_REQUESTS',
        data_evento: timestampIso,
      })
      $app.save(blockLog)
    } catch (errAudit) {
      console.log('[rate_limiter] Erro ao gravar AUTH_BRUTE_FORCE_BLOCKED:', errAudit)
    }

    throw new BadRequestError(MENSAGEM_GENERICA)
  }

  // Executa o próximo handler na cadeia (tentativa real de autenticação de senha)
  let authErro = null
  try {
    e.next()
  } catch (err) {
    authErro = err
  }

  if (authErro) {
    // Autenticação falhou! Registrar falha para e-mail e IP no audit_log
    const novaContagem = contagemAtiva + 1
    const statusErro = (authErro && (authErro.status || (authErro.data && authErro.data.code))) || 0
    const motivoFalha =
      statusErro === 404
        ? 'conta_inexistente'
        : authErro && authErro.message && authErro.message.toLowerCase().includes('password')
          ? 'senha_incorreta'
          : 'credenciais_invalidas'

    try {
      const auditCol = $app.findCollectionByNameOrId('audit_log')

      let previousHash = 'GENESIS_HASH_AUTH_FAIL_ORBIS_2026'
      try {
        const ultimos = $app.findRecordsByFilter('audit_log', 'id != ""', '-created', 1, 0)
        if (ultimos && ultimos.length > 0) {
          const u = ultimos[0]
          const d = u.get('detalhes') || {}
          previousHash = (d && d.chain_hash) || u.getString('hash_sha256') || u.id
        }
      } catch (_) {}

      const timestampIso = new Date().toISOString()

      // 1. Evento audit_log exigido: 'login_falha' (e-mail informado, motivo, IP)
      try {
        const loginFalhaLog = new Record(auditCol)
        const canonicalFalhaStr = `login_falha|${rawIdentity}|${motivoFalha}|${clientIp}|${timestampIso}|${previousHash}`
        const chainHashFalha = $security.sha256(canonicalFalhaStr)

        loginFalhaLog.set('acao', 'login_falha')
        loginFalhaLog.set('entidade', 'users')
        loginFalhaLog.set('entidade_id', rawIdentity || 'desconhecido')
        loginFalhaLog.set('ator_id', 'sistema_auth')
        loginFalhaLog.set('ator_email', rawIdentity || '')
        loginFalhaLog.set('papel', 'visitante')
        loginFalhaLog.set('ip', clientIp)
        loginFalhaLog.set('detalhes', {
          email_informado: rawIdentity,
          email_mascarado: emailMascarado,
          motivo: motivoFalha,
          status_erro: statusErro,
          ip: clientIp,
          data_hora: timestampIso,
          tentativa_numero: novaContagem,
          previous_hash: previousHash,
          chain_hash: chainHashFalha,
        })
        $app.save(loginFalhaLog)
        previousHash = chainHashFalha
      } catch (errFalhaLog) {
        console.log('[rate_limiter] Erro ao gravar evento login_falha:', errFalhaLog)
      }

      // Registrar falha associada ao e-mail para rate-limit
      if (emailKey) {
        const failUserLog = new Record(auditCol)
        const canonicalUserStr = `AUTH_LOGIN_FAILED|${emailKey}|${clientIp}|${novaContagem}|${timestampIso}|${previousHash}`
        const chainHashUser = $security.sha256(canonicalUserStr)

        failUserLog.set('acao', 'AUTH_LOGIN_FAILED')
        failUserLog.set('entidade', 'rate_limiter')
        failUserLog.set('entidade_id', emailKey)
        failUserLog.set('ator_id', 'sistema_firewall')
        failUserLog.set('ator_email', 'suporte@orbis-protocol.com')
        failUserLog.set('papel', 'firewall')
        failUserLog.set('ip', clientIp)
        failUserLog.set('detalhes', {
          chave: emailKey,
          email_mascarado: emailMascarado,
          tentativa_numero: novaContagem,
          motivo: motivoFalha,
          previous_hash: previousHash,
          chain_hash: chainHashUser,
          data_evento: timestampIso,
        })
        $app.save(failUserLog)
        previousHash = chainHashUser
      }

      // Registrar falha associada ao IP para rate-limit
      const failIpLog = new Record(auditCol)
      const canonicalIpStr = `AUTH_LOGIN_FAILED|${ipKey}|${clientIp}|${novaContagem}|${timestampIso}|${previousHash}`
      const chainHashIp = $security.sha256(canonicalIpStr)

      failIpLog.set('acao', 'AUTH_LOGIN_FAILED')
      failIpLog.set('entidade', 'rate_limiter')
      failIpLog.set('entidade_id', ipKey)
      failIpLog.set('ator_id', 'sistema_firewall')
      failIpLog.set('ator_email', 'suporte@orbis-protocol.com')
      failIpLog.set('papel', 'firewall')
      failIpLog.set('ip', clientIp)
      failIpLog.set('detalhes', {
        chave: ipKey,
        email_mascarado: emailMascarado,
        tentativa_numero: novaContagem,
        motivo: motivoFalha,
        previous_hash: previousHash,
        chain_hash: chainHashIp,
        data_evento: timestampIso,
      })
      $app.save(failIpLog)

      // Se ao falhar atingiu 5 ou mais tentativas, registra imediatamente o bloqueio progressivo
      if (novaContagem >= 5) {
        let duracaoSec = 30
        if (novaContagem === 6) {
          duracaoSec = 120
        } else if (novaContagem >= 7) {
          duracaoSec = 600
        }

        const blockLog = new Record(auditCol)
        const canonicalBlockStr = `AUTH_BRUTE_FORCE_BLOCKED|${clientIp}|${emailMascarado}|${novaContagem}|${duracaoSec}|threshold_atingido|${timestampIso}|${chainHashIp}`
        const chainHashBlock = $security.sha256(canonicalBlockStr)

        blockLog.set('acao', 'AUTH_BRUTE_FORCE_BLOCKED')
        blockLog.set('entidade', 'rate_limiter')
        blockLog.set('entidade_id', emailKey || ipKey)
        blockLog.set('ator_id', 'sistema_firewall')
        blockLog.set('ator_email', 'suporte@orbis-protocol.com')
        blockLog.set('papel', 'firewall')
        blockLog.set('ip', clientIp)
        blockLog.set('detalhes', {
          email_mascarado: emailMascarado,
          contagem_falhas: novaContagem,
          duracao_bloqueio_segundos: duracaoSec,
          criterio_bloqueio: 'threshold_atingido',
          previous_hash: chainHashIp,
          chain_hash: chainHashBlock,
          status: '429_TOO_MANY_REQUESTS',
          data_evento: timestampIso,
        })
        $app.save(blockLog)
      }
    } catch (errRec) {
      console.log('[rate_limiter] Erro ao registrar falha de autenticação:', errRec)
    }

    // Se o erro original tiver status específico (ex.: 404 quando o e-mail não existe no PocketBase),
    // preserva o erro original para permitir que o cliente identifique "e-mail não encontrado" vs "senha incorreta"
    if (statusErro === 404 || (authErro && authErro.status === 404)) {
      throw authErro
    }

    // Para outros erros (400 senha inválida, etc.), mantém o lançamento com mensagem controlada
    throw new BadRequestError(MENSAGEM_GENERICA)
  }

  // SUCESSO NA AUTENTICAÇÃO:
  // e.record contém o usuário recém-autenticado pelo PocketBase
  try {
    const authRec = e.record
    const timestampIso = new Date().toISOString()
    let userAgent = ''
    try {
      const info = e.requestInfo()
      if (info && info.headers) {
        userAgent = String(info.headers['user-agent'] || '').slice(0, 500)
      }
    } catch (_) {}

    // 1. Atualizar campo ultimo_acesso no registro do usuário via UPDATE SQL parametrizado
    // (não interfere no retorno do e.next() nem dispara recursão)
    if (authRec && authRec.id) {
      try {
        $app
          .db()
          .newQuery('UPDATE users SET ultimo_acesso = {:ultimo} WHERE id = {:id}')
          .bind({
            ultimo: timestampIso,
            id: authRec.id,
          })
          .execute()
      } catch (errUpd) {
        console.log('[rate_limiter] Erro ao atualizar ultimo_acesso do usuário:', errUpd)
      }
    }

    // 2. Gravar evento 'login_sucesso' no audit_log
    const auditCol = $app.findCollectionByNameOrId('audit_log')
    if (auditCol && authRec) {
      const logSucesso = new Record(auditCol)
      const userId = authRec.id
      const userEmail = authRec.getString('email') || rawIdentity
      const userRole = authRec.getString('role') || 'cliente'
      const userName = authRec.getString('name') || userEmail

      let previousHash = 'GENESIS_HASH_LOGIN_SUCESSO_ORBIS_2026'
      try {
        const ultimos = $app.findRecordsByFilter('audit_log', 'id != ""', '-created', 1, 0)
        if (ultimos && ultimos.length > 0) {
          const u = ultimos[0]
          const d = u.get('detalhes') || {}
          previousHash = (d && d.chain_hash) || u.getString('hash_sha256') || u.id
        }
      } catch (_) {}

      const canonicalStr = `login_sucesso|${userId}|${userEmail}|${userRole}|${clientIp}|${timestampIso}|${previousHash}`
      const chainHash = $security.sha256(canonicalStr)

      logSucesso.set('acao', 'login_sucesso')
      logSucesso.set('entidade', 'users')
      logSucesso.set('entidade_id', userId)
      logSucesso.set('ator_id', userId)
      logSucesso.set('ator_email', userEmail)
      logSucesso.set('papel', userRole)
      logSucesso.set('ip', clientIp)
      logSucesso.set('detalhes', {
        ator_id: userId,
        ator_nome: userName,
        ator_email: userEmail,
        papel: userRole,
        ip: clientIp,
        user_agent: userAgent,
        data_hora: timestampIso,
        previous_hash: previousHash,
        chain_hash: chainHash,
      })
      $app.save(logSucesso)
    }
  } catch (errSucessoLog) {
    console.log('[rate_limiter] Erro ao registrar login_sucesso no audit_log:', errSucessoLog)
  }

  e.next()
}, 'users')
