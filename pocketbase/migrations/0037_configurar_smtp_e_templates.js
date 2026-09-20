/**
 * MIGRATION 0037: CONFIGURAÇÃO SMTP E AJUSTE DE TEMPLATE DE RESET DE SENHA
 *
 * Configura o SMTP do PocketBase a partir de variáveis de ambiente:
 * - SMTP_HOST
 * - SMTP_PORT
 * - SMTP_SENDER_NAME (padrão: "Orbis Protocol")
 * - SMTP_SENDER_EMAIL (padrão: "suporte@orbisprotocol.org")
 * - SMTP_USERNAME
 * - SMTP_PASSWORD
 * - SMTP_ENABLED (flag booleana)
 *
 * Se as variáveis estiverem ausentes, aplica de forma defensiva sem quebrar o deploy,
 * registrando log informativo.
 *
 * Ajusta também o template de reset de senha para apontar para a rota oficial:
 * {APP_URL}/redefinir-senha?token={TOKEN}
 */

migrate(
  (app) => {
    try {
      const settings = app.settings()
      if (!settings) {
        console.log('[SMTP Config] Settings não disponível no objeto app.')
        return
      }

      // 1. Configuração de URL e Metadados do App (SITE_URL / APP_URL)
      const siteUrl = ($os.getenv('SITE_URL') || '').trim()
      if (siteUrl && settings.meta) {
        // Remove barra final se houver
        const cleanSiteUrl = siteUrl.endsWith('/') ? siteUrl.slice(0, -1) : siteUrl
        settings.meta.appURL = cleanSiteUrl
      }

      // 2. Configuração de Remetente Padrão
      const senderName = ($os.getenv('SMTP_SENDER_NAME') || 'Orbis Protocol').trim()
      const senderEmail = ($os.getenv('SMTP_SENDER_EMAIL') || 'suporte@orbisprotocol.org').trim()

      if (settings.meta) {
        settings.meta.appName = settings.meta.appName || 'Orbis Protocol'
        settings.meta.senderName = senderName
        settings.meta.senderAddress = senderEmail

        // 3. Template de Redefinição de Senha
        // Garante que o link aponte para a rota do frontend: /redefinir-senha?token={TOKEN}
        if (!settings.meta.resetPasswordTemplate) {
          settings.meta.resetPasswordTemplate = {}
        }
        settings.meta.resetPasswordTemplate.subject = 'Redefinição de Senha - Orbis Protocol'
        settings.meta.resetPasswordTemplate.body =
          '<p>Olá,</p>' +
          '<p>Recebemos uma solicitação para redefinir a senha da sua conta corporativa na plataforma <strong>Orbis Protocol</strong>.</p>' +
          '<p>Para cadastrar uma nova credencial com segurança, clique no link abaixo:</p>' +
          '<p><a class="btn" href="{APP_URL}/redefinir-senha?token={TOKEN}" target="_blank" rel="noopener">Redefinir Senha</a></p>' +
          '<p>Ou acesse diretamente: <br/><code>{APP_URL}/redefinir-senha?token={TOKEN}</code></p>' +
          '<p>Caso você não tenha solicitado esta alteração, ignore este e-mail por precaução.</p>' +
          '<p>Atenciosamente,<br/>Equipe de Segurança da Informação & Governança<br/><strong>Orbis Protocol</strong></p>'

        if (settings.meta.resetPasswordTemplate.actionUrl !== undefined) {
          settings.meta.resetPasswordTemplate.actionUrl = '{APP_URL}/redefinir-senha?token={TOKEN}'
        }
      }

      // Também ajusta o template em users caso o PB v0.36 use opções na coleção auth
      try {
        const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
        if (usersCol && usersCol.resetPasswordTemplate) {
          usersCol.resetPasswordTemplate.subject = 'Redefinição de Senha - Orbis Protocol'
          usersCol.resetPasswordTemplate.body =
            '<p>Olá,</p>' +
            '<p>Recebemos uma solicitação para redefinir a senha da sua conta corporativa na plataforma <strong>Orbis Protocol</strong>.</p>' +
            '<p>Para cadastrar uma nova credencial com segurança, clique no link abaixo:</p>' +
            '<p><a class="btn" href="{APP_URL}/redefinir-senha?token={TOKEN}" target="_blank" rel="noopener">Redefinir Senha</a></p>' +
            '<p>Ou acesse diretamente: <br/><code>{APP_URL}/redefinir-senha?token={TOKEN}</code></p>' +
            '<p>Caso você não tenha solicitado esta alteração, ignore este e-mail por precaução.</p>' +
            '<p>Atenciosamente,<br/>Equipe de Segurança da Informação & Governança<br/><strong>Orbis Protocol</strong></p>'
          if (usersCol.resetPasswordTemplate.actionUrl !== undefined) {
            usersCol.resetPasswordTemplate.actionUrl = '{APP_URL}/redefinir-senha?token={TOKEN}'
          }
          app.save(usersCol)
        }
      } catch (errCol) {
        // Silencioso se a coleção users for gerenciada em nível global de settings
      }

      // 4. Configuração SMTP a partir de Variáveis de Ambiente
      const smtpHost = ($os.getenv('SMTP_HOST') || '').trim()
      const smtpPortRaw = ($os.getenv('SMTP_PORT') || '').trim()
      const smtpUser = ($os.getenv('SMTP_USERNAME') || '').trim()
      const smtpPass = ($os.getenv('SMTP_PASSWORD') || '').trim()
      const smtpEnabledRaw = ($os.getenv('SMTP_ENABLED') || '').trim().toLowerCase()

      if (smtpHost) {
        if (!settings.smtp) {
          settings.smtp = {}
        }
        const portNum = parseInt(smtpPortRaw, 10) || 587
        const isEnabled =
          smtpEnabledRaw === 'true' ||
          smtpEnabledRaw === '1' ||
          smtpEnabledRaw === 'yes' ||
          smtpEnabledRaw === ''

        settings.smtp.enabled = isEnabled
        settings.smtp.host = smtpHost
        settings.smtp.port = portNum
        settings.smtp.username = smtpUser
        settings.smtp.password = smtpPass
        settings.smtp.tls = portNum === 465

        console.log(
          '[SMTP Config] Servidor SMTP configurado com sucesso: ' +
            smtpHost +
            ':' +
            portNum +
            ' (enabled=' +
            isEnabled +
            ')',
        )
      } else {
        console.log(
          '[SMTP Config] SMTP não configurado — variáveis ausentes. Deploy mantido sem alterações de conexão SMTP.',
        )
      }

      app.save(settings)
    } catch (err) {
      console.log(
        '[SMTP Config] Aviso ao configurar SMTP/Templates: ' +
          (err && err.message ? err.message : err),
      )
    }
  },
  (app) => {
    // Reversão opcional (no-op para não degradar estado em rollback)
  },
)
