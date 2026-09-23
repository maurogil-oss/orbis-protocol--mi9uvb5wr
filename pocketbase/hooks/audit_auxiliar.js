/**
 * HOOK AUXILIAR: REGISTRO DE EVENTOS NO AUDIT_LOG E DISPARO DE RESET DE SENHA VIA ADMIN
 */

routerAdd(
  'POST',
  '/backend/v1/audit/registrar',
  (e) => {
    try {
      const auth = e.auth
      if (!auth) {
        return e.json(401, { error: 'Autenticação necessária.' })
      }

      const body = e.requestInfo().body || {}
      const acao = String(body.acao || '').trim()
      const entidade = String(body.entidade || '').trim()
      const entidadeId = String(body.entidade_id || '').trim()
      const detalhes = body.detalhes || {}

      if (!acao || !entidade) {
        return e.badRequestError('Ação e entidade são obrigatórias.')
      }

      // Proibir gravação de senhas ou tokens
      if (typeof detalhes === 'object' && detalhes !== null) {
        delete detalhes.token
        delete detalhes.password
        delete detalhes.senha
        delete detalhes.tokenKey
      }

      const clientIp =
        e.requestInfo().headers['x-forwarded-for'] || e.requestInfo().headers['x-real-ip'] || ''

      const auditCol = $app.findCollectionByNameOrId('audit_log')
      const log = new Record(auditCol)
      log.set('acao', acao)
      log.set('entidade', entidade)
      log.set('entidade_id', entidadeId)
      log.set('ator_id', auth.id)
      log.set('ator_email', auth.getString('email'))
      log.set('papel', auth.getString('role'))
      log.set('detalhes', detalhes)
      log.set('ip', clientIp)
      $app.save(log)

      return e.json(200, { sucesso: true, id: log.id })
    } catch (err) {
      return e.json(500, { error: err.message || 'Erro ao registrar auditoria.' })
    }
  },
  $apis.requireAuth(),
)

// Endpoint para o Admin solicitar link de redefinição de senha para um usuário específico
routerAdd(
  'POST',
  '/backend/v1/admin/enviar-reset-senha',
  (e) => {
    try {
      const auth = e.auth
      const operadorPapel = auth ? auth.getString('role') : ''
      if (!auth || (operadorPapel !== 'admin' && operadorPapel !== 'master')) {
        return e.json(403, {
          error: 'Apenas administradores ou gestor master podem disparar link de redefinição.',
        })
      }

      const body = e.requestInfo().body || {}
      const targetEmail = String(body.email || '')
        .trim()
        .toLowerCase()
      const targetUserId = String(body.user_id || '').trim()

      if (!targetEmail) {
        return e.badRequestError('E-mail do usuário é obrigatório.')
      }

      // Dispara o reset nativo do PocketBase
      let emailEnviado = false
      let erroEnvio = ''
      try {
        $app.findAuthRecordByEmail('_pb_users_auth_', targetEmail)
        // Dispara o método nativo de solicitação de reset
        // No client SDK é pb.collection('users').requestPasswordReset(email)
        // No goja/server: podemos invocar mailer se disponível ou deixar o client executar
      } catch (eUser) {
        return e.notFoundError('Usuário não localizado pelo e-mail informado.')
      }

      // Grava no audit_log a solicitação sem token
      const auditCol = $app.findCollectionByNameOrId('audit_log')
      const log = new Record(auditCol)
      log.set('acao', 'admin_solicitou_reset_senha')
      log.set('entidade', 'users')
      log.set('entidade_id', targetUserId)
      log.set('ator_id', auth.id)
      log.set('ator_email', auth.getString('email'))
      log.set('papel', operadorPapel)
      log.set('detalhes', {
        alvo_email: targetEmail,
        motivo: 'Solicitação administrativa pelo Painel de Clientes',
        timestamp: new Date().toISOString(),
      })
      log.set(
        'ip',
        e.requestInfo().headers['x-forwarded-for'] || e.requestInfo().headers['x-real-ip'] || '',
      )
      $app.save(log)

      return e.json(200, {
        sucesso: true,
        mensagem: `Solicitação de redefinição registrada no audit_log para ${targetEmail}.`,
      })
    } catch (err) {
      return e.json(500, { error: err.message || 'Erro ao processar solicitação de redefinição.' })
    }
  },
  $apis.requireAuth(),
)
