/**
 * MIGRATION 0049: GESTÃO DE NÍVEIS DE ACESSO COM GESTOR MASTER E CONTROLLER
 *
 * 1. Expande o select de roles na coleção users para incluir 'master' e 'controller':
 *    ['master', 'admin', 'controller', 'perito', 'cliente', 'financeiro', 'financeiro_leitor', 'cliente_acp', 'parceiro']
 * 2. Adiciona o campo status_aprovacao na coleção users:
 *    select: ['pendente', 'aprovado', 'rejeitado'] (default null para clientes comuns; 'pendente' para cadastros Gestão)
 * 3. Atribui papel 'master' e status_aprovacao 'aprovado' ao usuário administrador existente:
 *    maurog1@hotmail.com ("Mauro Gestor Orbis")
 * 4. Atualiza regras de RLS na coleção users e audit_log:
 *    - Leitura users: próprio usuário, master, admin, controller, financeiro, financeiro_leitor
 *    - Atualização users:
 *        * master pode alterar tudo (inclusive aprovações e papéis)
 *        * admin comum pode alterar campos operacionais de clientes, MAS NÃO PODE alterar role nem status_aprovacao
 *        * usuário comum só pode alterar dados próprios se não mexer em role, parceiro_acesso_status e status_aprovacao
 *    - Leitura audit_log: master, admin, controller, financeiro_leitor
 *    - Cobranças, comissões, dossiês/relatórios: leitura ampla pelo controller
 */

migrate(
  (app) => {
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
    const roleField = usersCol.fields.getByName('role')
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
    ]

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

    // Campo status_aprovacao para contas de gestão pendentes de validação pelo master
    if (!usersCol.fields.getByName('status_aprovacao')) {
      usersCol.fields.add(
        new SelectField({
          name: 'status_aprovacao',
          values: ['pendente', 'aprovado', 'rejeitado'],
          maxSelect: 1,
          required: false,
        }),
      )
    }

    // Atualiza regras de RLS da coleção users:
    // list/view: próprio ou master/admin/controller/financeiro/financeiro_leitor
    usersCol.listRule =
      "@request.auth.id != '' && (@request.auth.id = id || @request.auth.role = 'master' || @request.auth.role = 'admin' || @request.auth.role = 'controller' || @request.auth.role = 'financeiro' || @request.auth.role = 'financeiro_leitor')"
    usersCol.viewRule =
      "@request.auth.id != '' && (@request.auth.id = id || @request.auth.role = 'master' || @request.auth.role = 'admin' || @request.auth.role = 'controller' || @request.auth.role = 'financeiro' || @request.auth.role = 'financeiro_leitor')"

    // updateRule:
    // master: pode atualizar tudo
    // admin comum: pode atualizar, MAS NUNCA role nem status_aprovacao (governança privativa do master)
    // usuário comum: dados próprios sem alterar role, parceiro_acesso_status ou status_aprovacao
    usersCol.updateRule =
      "@request.auth.id != '' && (@request.auth.role = 'master' || (@request.auth.role = 'admin' && @request.body.role:isset = false && @request.body.status_aprovacao:isset = false) || (@request.auth.id = id && @request.body.role:isset = false && @request.body.parceiro_acesso_status:isset = false && @request.body.status_aprovacao:isset = false))"

    // deleteRule: apenas master (nem admin comum deleta contas)
    usersCol.deleteRule = "@request.auth.id != '' && @request.auth.role = 'master'"

    app.save(usersCol)

    // Atribuir papel 'master' e status 'aprovado' ao usuário administrador existente: maurog1@hotmail.com
    try {
      app
        .db()
        .newQuery(
          "UPDATE users SET role = 'master', status_aprovacao = 'aprovado' WHERE email = 'maurog1@hotmail.com'",
        )
        .execute()
    } catch (eMauro) {
      console.log('Aviso ao atualizar usuário maurog1@hotmail.com para master:', eMauro)
    }

    // Atualizar coleção audit_log para permitir leitura ao master e ao controller
    try {
      const auditCol = app.findCollectionByNameOrId('audit_log')
      auditCol.listRule =
        "@request.auth.id != '' && (@request.auth.role = 'master' || @request.auth.role = 'admin' || @request.auth.role = 'controller' || @request.auth.role = 'financeiro_leitor')"
      auditCol.viewRule =
        "@request.auth.id != '' && (@request.auth.role = 'master' || @request.auth.role = 'admin' || @request.auth.role = 'controller' || @request.auth.role = 'financeiro_leitor')"
      app.save(auditCol)
    } catch (eAudit) {
      console.log('Aviso ao atualizar regras de audit_log para master/controller:', eAudit)
    }

    // Atualizar coleção relatorios_exportados (dossiês) para leitura ampla do controller
    try {
      const relCol = app.findCollectionByNameOrId('relatorios_exportados')
      relCol.listRule =
        "@request.auth.id != '' && (usuario = @request.auth.id || @request.auth.role = 'master' || @request.auth.role = 'admin' || @request.auth.role = 'controller' || @request.auth.role = 'financeiro_leitor' || @request.auth.role = 'perito')"
      relCol.viewRule =
        "@request.auth.id != '' && (usuario = @request.auth.id || @request.auth.role = 'master' || @request.auth.role = 'admin' || @request.auth.role = 'controller' || @request.auth.role = 'financeiro_leitor' || @request.auth.role = 'perito')"
      app.save(relCol)
    } catch (_) {}

    // Atualizar coleção cobrancas para leitura ampla do controller e master
    try {
      const cobCol = app.findCollectionByNameOrId('cobrancas')
      cobCol.listRule =
        "@request.auth.id != '' && (usuario = @request.auth.id || parceiro_id.usuario = @request.auth.id || @request.auth.role = 'master' || @request.auth.role = 'admin' || @request.auth.role = 'controller' || @request.auth.role = 'financeiro' || @request.auth.role = 'financeiro_leitor')"
      cobCol.viewRule =
        "@request.auth.id != '' && (usuario = @request.auth.id || parceiro_id.usuario = @request.auth.id || @request.auth.role = 'master' || @request.auth.role = 'admin' || @request.auth.role = 'controller' || @request.auth.role = 'financeiro' || @request.auth.role = 'financeiro_leitor')"
      app.save(cobCol)
    } catch (_) {}

    // Atualizar coleção comissoes para leitura ampla do controller e master
    try {
      const comCol = app.findCollectionByNameOrId('comissoes')
      comCol.listRule =
        "@request.auth.id != '' && (@request.auth.role = 'master' || @request.auth.role = 'admin' || @request.auth.role = 'controller' || @request.auth.role = 'financeiro' || @request.auth.role = 'financeiro_leitor' || parceiro_id.usuario = @request.auth.id)"
      comCol.viewRule =
        "@request.auth.id != '' && (@request.auth.role = 'master' || @request.auth.role = 'admin' || @request.auth.role = 'controller' || @request.auth.role = 'financeiro' || @request.auth.role = 'financeiro_leitor' || parceiro_id.usuario = @request.auth.id)"
      app.save(comCol)
    } catch (_) {}
  },
  (app) => {
    try {
      const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
      const roleField = usersCol.fields.getByName('role')
      if (roleField) {
        roleField.values = [
          'admin',
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
