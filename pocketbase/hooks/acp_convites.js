/**
 * PB Hook: acp_convites.js
 * Endpoints seguros para gestão e aceite de convites de empresas associadas ACP.
 *
 * PocketBase v0.23+ conventions:
 * - Auth user: e.auth (não e.get('authRecord'))
 * - Path param: e.request.pathValue('token')
 * - Body: e.requestInfo().body
 * - Scoping: Nenhum helper top-level; declarar tudo inline no corpo do callback
 */

// 1. Criar convite
routerAdd('POST', '/backend/v1/acp/convites', (e) => {
  try {
    const authRecord = e.auth
    if (!authRecord) {
      return e.json(401, { error: 'Autenticação necessária.' })
    }

    const role = authRecord.getString('role')
    if (role !== 'admin_acp' && role !== 'admin' && role !== 'master') {
      return e.json(403, {
        error: 'Acesso negado. Apenas administradores ACP ou Master podem gerar convites.',
      })
    }

    const reqInfo = e.requestInfo()
    const body = (reqInfo && reqInfo.body) || {}
    const empresaNome = (body.empresa_nome || body.nome || '').trim()
    const email = (body.email || '').trim().toLowerCase()
    const cnpj = (body.cnpj || '').trim()
    const diasValidade = parseInt(body.dias_validade, 10) || 7
    const observacoes = (body.observacoes || '').trim()

    if (!empresaNome) {
      return e.json(400, { error: 'O nome da empresa associada é obrigatório.' })
    }

    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email || !emailRe.test(email)) {
      return e.json(400, { error: 'Informe um e-mail válido para a empresa associada.' })
    }

    const convitesCol = $app.findCollectionByNameOrId('convites_acp')

    // Gerar token único e impossível de adivinhar
    const token =
      $security.randomString(32) +
      '-' +
      $security.sha256(empresaNome + email + Date.now()).substring(0, 16)

    const agora = new Date()
    const expiraEm = new Date(agora.getTime() + diasValidade * 24 * 60 * 60 * 1000).toISOString()

    const rec = new Record(convitesCol)
    rec.set('token', token)
    rec.set('empresa_nome', empresaNome)
    rec.set('cnpj', cnpj)
    rec.set('email', email)
    rec.set('status', 'pendente')
    rec.set('expira_em', expiraEm)
    rec.set('criado_por', authRecord.id)
    rec.set('observacoes', observacoes)

    $app.save(rec)

    // Trilha de auditoria simples
    try {
      const auditCol = $app.findCollectionByNameOrId('audit_logs')
      if (auditCol) {
        const audit = new Record(auditCol)
        audit.set('action', 'acp_convite_criado')
        audit.set('user_id', authRecord.id)
        audit.set('resource', 'convites_acp/' + rec.id)
        audit.set('severity', 'info')
        audit.set(
          'details',
          JSON.stringify({
            empresa_nome: empresaNome,
            email: email,
            cnpj: cnpj,
            dias_validade: diasValidade,
            criado_por_role: role,
          }),
        )
        audit.set('timestamp', new Date().toISOString())
        $app.save(audit)
      }
    } catch (_) {}

    return e.json(201, {
      success: true,
      convite: {
        id: rec.id,
        token: token,
        empresa_nome: empresaNome,
        cnpj: cnpj,
        email: email,
        status: 'pendente',
        expira_em: expiraEm,
        created: rec.getString('created'),
      },
      mensagem: 'Convite ACP gerado com sucesso.',
    })
  } catch (err) {
    console.log('[acp_convites] Erro ao criar convite:', err)
    return e.json(500, {
      error: 'Falha interna ao criar convite ACP: ' + (err && err.message ? err.message : err),
    })
  }
})

// 2. Validar token de convite
routerAdd('GET', '/backend/v1/acp/convites/validar/{token}', (e) => {
  try {
    const token = (e.request.pathValue('token') || '').trim()
    if (!token) {
      return e.json(400, {
        valido: false,
        motivo: 'Token ausente ou inválido.',
      })
    }

    let rec = null
    try {
      rec = $app.findFirstRecordByData('convites_acp', 'token', token)
    } catch (_) {
      return e.json(404, {
        valido: false,
        motivo: 'Convite não encontrado. Verifique se o link está correto.',
      })
    }

    const status = rec.getString('status')
    const expiraEmStr = rec.getString('expira_em')
    const expiraEm = new Date(expiraEmStr)
    const agora = new Date()

    if (status === 'usado') {
      return e.json(410, {
        valido: false,
        motivo: 'Este convite já foi utilizado para cadastrar a empresa associada.',
        status: 'usado',
        usado_em: rec.getString('usado_em'),
      })
    }

    if (status === 'cancelado') {
      return e.json(410, {
        valido: false,
        motivo: 'Este convite foi cancelado pela administração da ACP.',
        status: 'cancelado',
      })
    }

    if (agora > expiraEm || status === 'expirado') {
      if (status !== 'expirado') {
        try {
          rec.set('status', 'expirado')
          $app.save(rec)
        } catch (_) {}
      }
      return e.json(410, {
        valido: false,
        motivo: 'Este convite expirou. Solicite um novo link de convite à ACP.',
        status: 'expirado',
        expira_em: expiraEmStr,
      })
    }

    return e.json(200, {
      valido: true,
      convite: {
        id: rec.id,
        token: rec.getString('token'),
        empresa_nome: rec.getString('empresa_nome'),
        cnpj: rec.getString('cnpj'),
        email: rec.getString('email'),
        status: 'pendente',
        expira_em: expiraEmStr,
      },
    })
  } catch (err) {
    console.log('[acp_convites] Erro ao validar convite:', err)
    return e.json(500, {
      valido: false,
      motivo: 'Erro ao validar convite ACP.',
    })
  }
})

// 3. Aceitar convite e criar conta cliente_acp
routerAdd('POST', '/backend/v1/acp/convites/aceitar', (e) => {
  try {
    const reqInfo = e.requestInfo()
    const body = (reqInfo && reqInfo.body) || {}
    const token = (body.token || '').trim()
    const password = (body.password || body.senha || '').trim()
    const nomeResponsavel = (body.nome_responsavel || body.name || '').trim()
    const cnpjInformado = (body.cnpj || '').trim()

    if (!token) {
      return e.json(400, { error: 'Token de convite obrigatório.' })
    }

    if (!password || password.length < 8) {
      return e.json(400, { error: 'A senha deve possuir no mínimo 8 caracteres.' })
    }

    let rec = null
    try {
      rec = $app.findFirstRecordByData('convites_acp', 'token', token)
    } catch (_) {
      return e.json(404, { error: 'Convite não encontrado ou inválido.' })
    }

    const status = rec.getString('status')
    if (status === 'usado') {
      return e.json(410, {
        error: 'Este convite já foi utilizado e não pode ser reutilizado.',
      })
    }

    const expiraEm = new Date(rec.getString('expira_em'))
    if (new Date() > expiraEm || status === 'expirado') {
      try {
        rec.set('status', 'expirado')
        $app.save(rec)
      } catch (_) {}
      return e.json(410, {
        error: 'Este convite expirou. Solicite um novo link à ACP.',
      })
    }

    const emailConvite = rec.getString('email').trim().toLowerCase()
    const empresaNome = rec.getString('empresa_nome').trim()
    const cnpjConvite = (rec.getString('cnpj') || cnpjInformado).trim()

    // Verificar se o e-mail já existe na coleção users
    try {
      const userExistente = $app.findAuthRecordByEmail('users', emailConvite)
      if (userExistente) {
        return e.json(409, {
          error:
            'Já existe uma conta cadastrada com este e-mail. Entre em contato com a ACP ou faça login.',
        })
      }
    } catch (_) {
      // Usuário não existe, fluxo normal
    }

    // Criar usuário vinculado com papel cliente_acp
    const usersCol = $app.findCollectionByNameOrId('users')
    const newUser = new Record(usersCol)

    const agora = new Date()
    const dataTrialFim = new Date(agora.getTime() + 15 * 24 * 60 * 60 * 1000).toISOString()
    const randSuffix = Math.floor(1000 + Math.random() * 9000)
    const codigoAcp = 'ORB-ACP-' + randSuffix

    newUser.set('email', emailConvite)
    newUser.set('password', password)
    newUser.set('passwordConfirm', password)
    newUser.set('name', nomeResponsavel || empresaNome)
    newUser.set('role', 'cliente_acp')
    newUser.set('cliente_codigo', codigoAcp)
    newUser.set('cnpj', cnpjConvite)
    newUser.set('status_aprovacao', 'aprovado')
    newUser.set('licenca_camada', 'trial')
    newUser.set('trial_tipo', 'trial_15d_5notas')
    newUser.set('trial_inicio', agora.toISOString())
    newUser.set('trial_fim', dataTrialFim)
    newUser.set('trial_notas_limite', 5)
    newUser.set('trial_notas_consumidas', 0)
    // Consentimento LGPD e Termos de Uso registrados formalmente no aceite do convite ACP
    const versaoConsentimento = (
      body.lgpd_versao || 'v1.0 — 2026-02 / Termos v1.0 — 2026-02'
    ).trim()
    const headers = (reqInfo && reqInfo.headers) || {}
    const ipOrigem = headers['x-forwarded-for'] || headers['x-real-ip'] || 'origem_convite_acp'
    newUser.set('lgpd_termo_versao', versaoConsentimento)
    newUser.set('lgpd_consentimento_data_hora', agora.toISOString())
    newUser.set('lgpd_consentimento_ip', ipOrigem)

    $app.save(newUser)

    // Atualizar registro do convite como usado
    rec.set('status', 'usado')
    rec.set('usado_em', agora.toISOString())
    rec.set('usuario_criado', newUser.id)
    $app.save(rec)

    // Auditoria
    try {
      const auditCol = $app.findCollectionByNameOrId('audit_logs')
      if (auditCol) {
        const audit = new Record(auditCol)
        audit.set('action', 'acp_convite_aceito')
        audit.set('user_id', newUser.id)
        audit.set('resource', 'convites_acp/' + rec.id)
        audit.set('severity', 'info')
        audit.set(
          'details',
          JSON.stringify({
            token_id: rec.id,
            email: emailConvite,
            empresa_nome: empresaNome,
            cliente_codigo: codigoAcp,
            role: 'cliente_acp',
          }),
        )
        audit.set('timestamp', agora.toISOString())
        $app.save(audit)
      }
    } catch (_) {}

    return e.json(200, {
      success: true,
      mensagem: 'Cadastro da empresa associada ACP realizado com sucesso!',
      usuario: {
        id: newUser.id,
        email: emailConvite,
        name: newUser.getString('name'),
        role: 'cliente_acp',
        cliente_codigo: codigoAcp,
      },
    })
  } catch (err) {
    console.log('[acp_convites] Erro ao aceitar convite:', err)
    return e.json(500, {
      error: 'Falha ao processar cadastro do convite: ' + (err && err.message ? err.message : err),
    })
  }
})

// 4. Listar participantes associados vinculados à ACP
routerAdd('GET', '/backend/v1/acp/empresas-participantes', (e) => {
  try {
    const authRecord = e.auth
    if (!authRecord) {
      return e.json(401, { error: 'Autenticação necessária.' })
    }

    const role = authRecord.getString('role')
    if (role !== 'admin_acp' && role !== 'admin' && role !== 'master') {
      return e.json(403, {
        error: 'Acesso restrito à administração da ACP e Gestor Master.',
      })
    }

    // Busca usuários com role cliente_acp
    const users = $app.findRecordsByFilter('users', "role = 'cliente_acp'", '-created', 100, 0)

    const lista = users.map((u) => {
      return {
        id: u.id,
        name: u.getString('name'),
        email: u.getString('email'),
        cliente_codigo: u.getString('cliente_codigo'),
        cnpj: u.getString('cnpj'),
        role: u.getString('role'),
        created: u.getString('created'),
        status_aprovacao: u.getString('status_aprovacao') || 'aprovado',
      }
    })

    return e.json(200, {
      success: true,
      total: lista.length,
      empresas: lista,
    })
  } catch (err) {
    console.log('[acp_convites] Erro ao listar empresas participantes:', err)
    return e.json(500, {
      error: 'Falha ao buscar empresas associadas ACP.',
    })
  }
})
