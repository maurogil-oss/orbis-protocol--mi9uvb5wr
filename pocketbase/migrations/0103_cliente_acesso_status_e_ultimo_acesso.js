/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')

    // 1. cliente_acesso_status: select 'ativo' | 'suspenso' (default: 'ativo')
    if (!usersCol.fields.getByName('cliente_acesso_status')) {
      usersCol.fields.add(
        new SelectField({
          name: 'cliente_acesso_status',
          values: ['ativo', 'suspenso'],
          maxSelect: 1,
        }),
      )
    }

    // 2. ultimo_acesso: text (ISO datetime da última autenticação com sucesso)
    if (!usersCol.fields.getByName('ultimo_acesso')) {
      usersCol.fields.add(
        new TextField({
          name: 'ultimo_acesso',
        }),
      )
    }

    // 3. Template de verificação de e-mail no PocketBase (aponta para /confirmar-email?token={TOKEN})
    try {
      const settings = app.settings()
      if (settings && settings.meta) {
        if (!settings.meta.verificationTemplate) {
          settings.meta.verificationTemplate = {}
        }
        settings.meta.verificationTemplate.subject =
          'Confirmação de E-mail • Ativação do Trial Orbis Protocol'
        settings.meta.verificationTemplate.body =
          '<p>Olá,</p>' +
          '<p>Obrigado por criar sua conta corporativa na plataforma <strong>Orbis Protocol</strong>.</p>' +
          '<p>Para ativar seu <strong>Trial de 15 dias sem cartão</strong> com até <strong>5 notas fiscais</strong> para cálculo de pegada de carbono e situação tributária, confirme seu endereço de e-mail clicando no link abaixo:</p>' +
          '<p><a class="btn" href="{APP_URL}/confirmar-email?token={TOKEN}" target="_blank" rel="noopener">Confirmar E-mail e Ativar Trial</a></p>' +
          '<p>Ou acesse diretamente: <br/><code>{APP_URL}/confirmar-email?token={TOKEN}</code></p>' +
          '<p>Atenciosamente,<br/>Equipe de Engenharia dMRV & Governança<br/><strong>Orbis Protocol</strong></p>'

        if (settings.meta.verificationTemplate.actionUrl !== undefined) {
          settings.meta.verificationTemplate.actionUrl = '{APP_URL}/confirmar-email?token={TOKEN}'
        }
        app.save(settings)
      }
    } catch (errSettings) {
      console.log(
        '[Migration 0103] Aviso ao configurar verificationTemplate em settings:',
        errSettings,
      )
    }

    if (usersCol.verificationTemplate) {
      try {
        usersCol.verificationTemplate.subject =
          'Confirmação de E-mail • Ativação do Trial Orbis Protocol'
        usersCol.verificationTemplate.body =
          '<p>Olá,</p>' +
          '<p>Obrigado por criar sua conta corporativa na plataforma <strong>Orbis Protocol</strong>.</p>' +
          '<p>Para ativar seu <strong>Trial de 15 dias sem cartão</strong> com até <strong>5 notas fiscais</strong> para cálculo de pegada de carbono e situação tributária, confirme seu endereço de e-mail clicando no link abaixo:</p>' +
          '<p><a class="btn" href="{APP_URL}/confirmar-email?token={TOKEN}" target="_blank" rel="noopener">Confirmar E-mail e Ativar Trial</a></p>' +
          '<p>Ou acesse diretamente: <br/><code>{APP_URL}/confirmar-email?token={TOKEN}</code></p>' +
          '<p>Atenciosamente,<br/>Equipe de Engenharia dMRV & Governança<br/><strong>Orbis Protocol</strong></p>'

        if (usersCol.verificationTemplate.actionUrl !== undefined) {
          usersCol.verificationTemplate.actionUrl = '{APP_URL}/confirmar-email?token={TOKEN}'
        }
      } catch (_) {}
    }

    app.save(usersCol)

    // Backfill defensivo: usuários existentes sem cliente_acesso_status recebem 'ativo'
    try {
      app
        .db()
        .newQuery(
          "UPDATE users SET cliente_acesso_status = 'ativo' WHERE cliente_acesso_status IS NULL OR cliente_acesso_status = ''",
        )
        .execute()
    } catch (errBf) {
      console.log('[Migration 0103] Aviso no backfill de cliente_acesso_status:', errBf)
    }
  },
  (app) => {
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
    const fieldsToRemove = ['cliente_acesso_status', 'ultimo_acesso']
    fieldsToRemove.forEach((f) => {
      const field = usersCol.fields.getByName(f)
      if (field) {
        usersCol.fields.removeByName(f)
      }
    })
    app.save(usersCol)
  },
)
