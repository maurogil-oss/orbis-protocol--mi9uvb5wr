/**
 * MIGRATION 0039: EXPANSÃO DO ROLE CLIENTE_ACP E PREFIXAÇÃO ORB-ACP
 *
 * 1. Expande o select de roles na coleção users para incluir 'cliente_acp':
 *    ['admin', 'perito', 'cliente', 'financeiro_leitor', 'cliente_acp']
 * 2. Atualiza regras de acesso da coleção users para manter permissões consistentes
 * 3. Garante que contas existentes NÃO sejam reescritas
 */

migrate(
  (app) => {
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
    const roleField = usersCol.fields.getByName('role')
    const allowedRoles = ['admin', 'perito', 'cliente', 'financeiro_leitor', 'cliente_acp']

    if (roleField) {
      roleField.values = allowedRoles
    } else {
      usersCol.fields.add(
        new SelectField({
          name: 'role',
          values: allowedRoles,
          maxSelect: 1,
        }),
      )
    }

    // Regras de RLS da coleção users:
    // list/view: próprio ou admin/financeiro_leitor
    usersCol.listRule =
      "@request.auth.id != '' && (@request.auth.id = id || @request.auth.role = 'admin' || @request.auth.role = 'financeiro_leitor')"
    usersCol.viewRule =
      "@request.auth.id != '' && (@request.auth.id = id || @request.auth.role = 'admin' || @request.auth.role = 'financeiro_leitor')"
    // update: admin pode atualizar tudo; dono pode atualizar apenas seus próprios dados cadastrais sem alterar role
    usersCol.updateRule =
      "@request.auth.id != '' && (@request.auth.role = 'admin' || (@request.auth.id = id && @request.body.role:isset = false))"
    usersCol.deleteRule = "@request.auth.id != '' && @request.auth.role = 'admin'"

    app.save(usersCol)
  },
  (app) => {
    try {
      const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
      const roleField = usersCol.fields.getByName('role')
      if (roleField) {
        roleField.values = ['admin', 'perito', 'cliente', 'financeiro_leitor']
        app.save(usersCol)
      }
    } catch (_) {}
  },
)
