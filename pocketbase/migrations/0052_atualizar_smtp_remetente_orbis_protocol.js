/**
 * MIGRATION 0052: ATUALIZAR DOMÍNIO OFICIAL E REMETENTE SMTP PARA ORBIS-PROTOCOL.COM
 *
 * Atualiza o remetente oficial SMTP e metadados no PocketBase:
 * - senderAddress: 'suporte@orbis-protocol.com'
 * - senderName: 'Orbis Protocol'
 * - appURL: 'https://www.orbis-protocol.com'
 * - Templates de e-mail e dados legados de demonstração/parceiros com o novo domínio
 */

migrate(
  (app) => {
    try {
      const settings = app.settings()
      if (settings && settings.meta) {
        const siteUrl = ($os.getenv('SITE_URL') || 'https://www.orbis-protocol.com').trim()
        const cleanSiteUrl = siteUrl.endsWith('/') ? siteUrl.slice(0, -1) : siteUrl
        settings.meta.appURL = cleanSiteUrl

        const senderEmail = ($os.getenv('SMTP_SENDER_EMAIL') || 'suporte@orbis-protocol.com').trim()
        const senderName = ($os.getenv('SMTP_SENDER_NAME') || 'Orbis Protocol').trim()

        settings.meta.appName = settings.meta.appName || 'Orbis Protocol'
        settings.meta.senderName = senderName
        settings.meta.senderAddress = senderEmail

        if (settings.meta.resetPasswordTemplate) {
          settings.meta.resetPasswordTemplate.actionUrl = '{APP_URL}/redefinir-senha?token={TOKEN}'
        }

        app.save(settings)
        console.log(
          '[Migration 0052] Settings atualizado com senderAddress=' +
            senderEmail +
            ' e appURL=' +
            cleanSiteUrl,
        )
      }

      // Atualiza também na coleção _pb_users_auth_ se houver resetPasswordTemplate
      try {
        const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
        if (usersCol && usersCol.resetPasswordTemplate) {
          if (usersCol.resetPasswordTemplate.actionUrl !== undefined) {
            usersCol.resetPasswordTemplate.actionUrl = '{APP_URL}/redefinir-senha?token={TOKEN}'
          }
          app.save(usersCol)
        }
      } catch (_) {}

      // Atualiza eventuais registros legados na base de parceiros que continham parcerias@orbisprotocol.org
      try {
        const parceiros = app.findRecordsByFilter(
          'parceiros',
          "contato ~ 'orbisprotocol.org' || chave_pix ~ 'orbisprotocol.org'",
          '',
          10,
          0,
        )
        for (let i = 0; i < parceiros.length; i++) {
          const p = parceiros[i]
          let mudou = false
          if (p.getString('contato') === 'parcerias@orbisprotocol.org') {
            p.set('contato', 'contato@orbis-protocol.com')
            mudou = true
          }
          if (p.getString('chave_pix') === 'parcerias@orbisprotocol.org') {
            p.set('chave_pix', 'contato@orbis-protocol.com')
            mudou = true
          }
          if (mudou) {
            app.save(p)
          }
        }
      } catch (_) {}

      // Atualiza eventuais registros legados na base de perito_credenciamentos
      try {
        const peritos = app.findRecordsByFilter(
          'perito_credenciamentos',
          "email_corporativo ~ 'orbisprotocol.org'",
          '',
          10,
          0,
        )
        for (let i = 0; i < peritos.length; i++) {
          const per = peritos[i]
          const emailAtual = per.getString('email_corporativo')
          if (emailAtual.includes('orbisprotocol.org')) {
            per.set(
              'email_corporativo',
              emailAtual.replace('orbisprotocol.org', 'orbis-protocol.com'),
            )
            app.save(per)
          }
        }
      } catch (_) {}
    } catch (err) {
      console.log('[Migration 0052] Erro na migração: ' + (err && err.message ? err.message : err))
    }
  },
  (app) => {
    // Reversão no-op
  },
)
