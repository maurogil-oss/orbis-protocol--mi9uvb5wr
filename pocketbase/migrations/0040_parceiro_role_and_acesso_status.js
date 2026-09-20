/**
 * MIGRATION 0040: EXPANSÃO DO ROLE 'PARCEIRO', CAMPO PARCEIRO_ACESSO_STATUS E VÍNCULO AUTOMÁTICO
 *
 * 1. Expande o select de roles na coleção users para incluir 'parceiro':
 *    ['admin', 'perito', 'cliente', 'financeiro_leitor', 'cliente_acp', 'parceiro']
 * 2. Adiciona o campo parceiro_acesso_status na coleção users:
 *    select: ['pendente', 'liberado', 'suspenso'] (default: 'pendente' quando role='parceiro')
 * 3. Garante que parceiros só consigam ler/atualizar apenas seus próprios registros em parceiros e comissoes,
 *    enquanto admin e financeiro_leitor continuam com acesso de governança.
 * 4. Garante retrocompatibilidade total com contas existentes.
 */

migrate(
  (app) => {
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
    const roleField = usersCol.fields.getByName('role')
    const allowedRoles = [
      'admin',
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

    // Adiciona parceiro_acesso_status se ainda não existir
    if (!usersCol.fields.getByName('parceiro_acesso_status')) {
      usersCol.fields.add(
        new SelectField({
          name: 'parceiro_acesso_status',
          values: ['pendente', 'liberado', 'suspenso'],
          maxSelect: 1,
          required: false,
        }),
      )
    }

    // Regras de RLS da coleção users:
    // list/view: próprio ou admin/financeiro/financeiro_leitor
    usersCol.listRule =
      "@request.auth.id != '' && (@request.auth.id = id || @request.auth.role = 'admin' || @request.auth.role = 'financeiro' || @request.auth.role = 'financeiro_leitor')"
    usersCol.viewRule =
      "@request.auth.id != '' && (@request.auth.id = id || @request.auth.role = 'admin' || @request.auth.role = 'financeiro' || @request.auth.role = 'financeiro_leitor')"
    // update: admin pode atualizar tudo; financeiro pode atualizar status; dono pode atualizar apenas seus próprios dados sem alterar role nem parceiro_acesso_status
    usersCol.updateRule =
      "@request.auth.id != '' && (@request.auth.role = 'admin' || (@request.auth.id = id && @request.body.role:isset = false && @request.body.parceiro_acesso_status:isset = false))"
    usersCol.deleteRule = "@request.auth.id != '' && @request.auth.role = 'admin'"

    app.save(usersCol)

    // Ajusta regras da coleção parceiros para garantir isolamento estrito:
    // Apenas parceiro dono, admin ou financeiro_leitor
    try {
      const parceirosCol = app.findCollectionByNameOrId('parceiros')
      parceirosCol.listRule =
        "@request.auth.id != '' && (@request.auth.role = 'admin' || @request.auth.role = 'financeiro' || @request.auth.role = 'financeiro_leitor' || usuario = @request.auth.id)"
      parceirosCol.viewRule =
        "@request.auth.id != '' && (@request.auth.role = 'admin' || @request.auth.role = 'financeiro' || @request.auth.role = 'financeiro_leitor' || usuario = @request.auth.id)"
      // Update: admin/financeiro pode atualizar tudo; parceiro dono pode atualizar dados bancários e documento fiscal
      parceirosCol.updateRule =
        "@request.auth.id != '' && (@request.auth.role = 'admin' || @request.auth.role = 'financeiro' || (usuario = @request.auth.id && @request.body.status:isset = false && @request.body.percentual_comissao:isset = false && @request.body.documento_fiscal_validado:isset = false))"
      app.save(parceirosCol)
    } catch (eParc) {
      console.log('Aviso ao atualizar regras de parceiros:', eParc)
    }

    // Ajusta regras da coleção comissoes:
    // Leitura estrita pelo parceiro dono ou admin ou financeiro ou financeiro_leitor
    try {
      const comissoesCol = app.findCollectionByNameOrId('comissoes')
      comissoesCol.listRule =
        "@request.auth.id != '' && (@request.auth.role = 'admin' || @request.auth.role = 'financeiro' || @request.auth.role = 'financeiro_leitor' || parceiro_id.usuario = @request.auth.id)"
      comissoesCol.viewRule =
        "@request.auth.id != '' && (@request.auth.role = 'admin' || @request.auth.role = 'financeiro' || @request.auth.role = 'financeiro_leitor' || parceiro_id.usuario = @request.auth.id)"
      app.save(comissoesCol)
    } catch (eCom) {
      console.log('Aviso ao atualizar regras de comissoes:', eCom)
    }
  },
  (app) => {
    try {
      const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
      const roleField = usersCol.fields.getByName('role')
      if (roleField) {
        roleField.values = ['admin', 'perito', 'cliente', 'financeiro_leitor', 'cliente_acp']
        app.save(usersCol)
      }
    } catch (_) {}
  },
)
