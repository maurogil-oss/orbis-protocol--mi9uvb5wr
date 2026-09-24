/**
 * MIGRATION 0054: ATUALIZAR TEMPLATE DE RESET DE SENHA COM DOMÍNIO OFICIAL
 *
 * Garante que tanto settings.meta.resetPasswordTemplate quanto a coleção _pb_users_auth_
 * tenham actionUrl apontando para https://www.orbis-protocol.com/redefinir-senha?token={TOKEN}
 * e texto oficial com remetente suporte@orbis-protocol.com.
 */

migrate(
  (app) => {
    try {
      const settings = app.settings()
      if (settings && settings.meta) {
        settings.meta.appURL = 'https://www.orbis-protocol.com'
        settings.meta.senderName = 'Orbis Protocol'
        settings.meta.senderAddress = 'suporte@orbis-protocol.com'

        if (!settings.meta.resetPasswordTemplate) {
          settings.meta.resetPasswordTemplate = {}
        }
        settings.meta.resetPasswordTemplate.subject = 'Redefina sua senha'
        settings.meta.resetPasswordTemplate.actionUrl =
          'https://www.orbis-protocol.com/redefinir-senha?token={TOKEN}'
        settings.meta.resetPasswordTemplate.body =
          '<p>Olá,</p>' +
          '<p>Recebemos uma solicitação para redefinir a senha da sua conta na plataforma <strong>Orbis Protocol</strong>.</p>' +
          '<p>Para cadastrar uma nova credencial com segurança, clique no link abaixo:</p>' +
          '<p><a class="btn" href="https://www.orbis-protocol.com/redefinir-senha?token={TOKEN}" target="_blank" rel="noopener">Redefinir Senha</a></p>' +
          '<p>Ou acesse diretamente: <br/><code>https://www.orbis-protocol.com/redefinir-senha?token={TOKEN}</code></p>' +
          '<p>Aviso: Este link possui validade limitada. Se você não solicitou, ignore este e-mail por segurança.</p>' +
          '<p>Atenciosamente,<br/>Equipe de Suporte & Governança<br/><strong>Orbis Protocol</strong> (suporte@orbis-protocol.com)</p>'

        app.save(settings)
      }

      try {
        const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
        if (usersCol && usersCol.resetPasswordTemplate) {
          usersCol.resetPasswordTemplate.subject = 'Redefina sua senha'
          usersCol.resetPasswordTemplate.actionUrl =
            'https://www.orbis-protocol.com/redefinir-senha?token={TOKEN}'
          usersCol.resetPasswordTemplate.body =
            '<p>Olá,</p>' +
            '<p>Recebemos uma solicitação para redefinir a senha da sua conta na plataforma <strong>Orbis Protocol</strong>.</p>' +
            '<p>Para cadastrar uma nova credencial com segurança, clique no link abaixo:</p>' +
            '<p><a class="btn" href="https://www.orbis-protocol.com/redefinir-senha?token={TOKEN}" target="_blank" rel="noopener">Redefinir Senha</a></p>' +
            '<p>Ou acesse diretamente: <br/><code>https://www.orbis-protocol.com/redefinir-senha?token={TOKEN}</code></p>' +
            '<p>Aviso: Este link possui validade limitada. Se você não solicitou, ignore este e-mail por segurança.</p>' +
            '<p>Atenciosamente,<br/>Equipe de Suporte & Governança<br/><strong>Orbis Protocol</strong> (suporte@orbis-protocol.com)</p>'
          app.save(usersCol)
        }
      } catch (_) {}
    } catch (err) {
      console.log(
        '[Migration 0054] Erro ao sincronizar template: ' +
          (err && err.message ? err.message : err),
      )
    }
  },
  (app) => {
    // Reversão no-op
  },
)
