/**
 * MIGRATION 0120: PAPEL ADMIN_ACP E CO-BRANDING CONFIGURÁVEL ACP
 *
 * 1. Adiciona o papel 'admin_acp' aos valores do select 'role' na coleção users:
 *    ['master', 'admin', 'controller', 'perito', 'cliente', 'financeiro', 'financeiro_leitor', 'cliente_acp', 'parceiro', 'admin_acp']
 * 2. Atualiza regras de acesso da coleção platform_settings para aceitar role 'master' ou 'admin'.
 * 3. Garante registros iniciais na collection platform_settings:
 *    - acp_cobranding_ativo ('true' ou 'false')
 *    - acp_cobranding_texto ('em parceria com a Associação Comercial do Paraná')
 *    - acp_cobranding_logo_url (URL do logo ACP)
 */
migrate(
  (app) => {
    // 1. Atualizar select role em users
    try {
      const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
      const roleField = usersCol.fields.getByName('role')
      if (roleField) {
        const allowedRoles = [
          'master',
          'admin',
          'controller',
          'perito',
          'cliente',
          'financeiro',
          'financeiro_leitor',
          'cliente_acp',
          'parceiro',
          'admin_acp',
        ]
        roleField.values = allowedRoles
        app.save(usersCol)
      }
    } catch (err) {
      console.log('[Migration 0120] Aviso ao atualizar campo role em users:', err)
    }

    // 2. Atualizar permissões de platform_settings para master e admin
    try {
      const psCol = app.findCollectionByNameOrId('platform_settings')
      if (psCol) {
        psCol.createRule =
          "@request.auth.id != '' && (@request.auth.role = 'master' || @request.auth.role = 'admin')"
        psCol.updateRule =
          "@request.auth.id != '' && (@request.auth.role = 'master' || @request.auth.role = 'admin')"
        psCol.deleteRule =
          "@request.auth.id != '' && (@request.auth.role = 'master' || @request.auth.role = 'admin')"
        app.save(psCol)
      }
    } catch (err) {
      console.log('[Migration 0120] Aviso ao atualizar regras de platform_settings:', err)
    }

    // 3. Inicializar configurações de co-branding ACP se não existirem
    try {
      const psCol = app.findCollectionByNameOrId('platform_settings')
      if (psCol) {
        const defaultSettings = [
          {
            chave: 'acp_cobranding_ativo',
            valor: 'false',
          },
          {
            chave: 'acp_cobranding_texto',
            valor: 'em parceria com a Associação Comercial do Paraná',
          },
          {
            chave: 'acp_cobranding_logo_url',
            valor: 'https://img.usecurling.com/i?q=parana&color=solid-black',
          },
        ]

        for (const item of defaultSettings) {
          try {
            const existing = app.findFirstRecordByData('platform_settings', 'chave', item.chave)
            if (!existing) {
              const rec = new Record(psCol)
              rec.set('chave', item.chave)
              rec.set('valor', item.valor)
              rec.set('atualizado_por', 'migration_0120')
              rec.set('atualizado_em', new Date().toISOString())
              app.save(rec)
            }
          } catch (_) {
            const rec = new Record(psCol)
            rec.set('chave', item.chave)
            rec.set('valor', item.valor)
            rec.set('atualizado_por', 'migration_0120')
            rec.set('atualizado_em', new Date().toISOString())
            app.save(rec)
          }
        }
      }
    } catch (err) {
      console.log('[Migration 0120] Aviso ao inicializar platform_settings:', err)
    }
  },
  (app) => {
    // Reversão segura
    try {
      const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
      const roleField = usersCol.fields.getByName('role')
      if (roleField) {
        roleField.values = [
          'master',
          'admin',
          'controller',
          'perito',
          'cliente',
          'financeiro',
          'financeiro_leitor',
          'cliente_acp',
          'parceiro',
        ]
        app.save(usersCol)
      }
    } catch (_) {}
  },
)
