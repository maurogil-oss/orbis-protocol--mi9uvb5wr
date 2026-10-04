/// <reference path="../pb_data/types.d.ts" />

/**
 * Migração 0093: Adiciona campo 'origem' à coleção emissoes_inventario e
 * garante que os papéis master e admin possam criar/atualizar/excluir registros
 * na coleção para operação de Sandbox e inventários regulatórios.
 */
migrate(
  (app) => {
    try {
      const invCol = app.findCollectionByNameOrId('emissoes_inventario')

      // 1. Adicionar campo 'origem' se não existir
      if (!invCol.fields.getByName('origem')) {
        invCol.fields.add(
          new TextField({
            name: 'origem',
            required: false,
          }),
        )
      }

      // 2. Atualizar regras de acesso para permitir master/admin além das regras existentes
      // List/view: auth users (seus próprios) ou admin, master, perito
      invCol.listRule =
        "@request.auth.id != '' && (usuario = @request.auth.id || @request.auth.role = 'admin' || @request.auth.role = 'master' || @request.auth.role = 'perito')"
      invCol.viewRule =
        "@request.auth.id != '' && (usuario = @request.auth.id || @request.auth.role = 'admin' || @request.auth.role = 'master' || @request.auth.role = 'perito')"
      invCol.createRule = "@request.auth.id != ''"
      invCol.updateRule =
        "@request.auth.id != '' && (usuario = @request.auth.id || @request.auth.role = 'admin' || @request.auth.role = 'master' || @request.auth.role = 'perito')"
      invCol.deleteRule =
        "@request.auth.id != '' && (@request.auth.role = 'admin' || @request.auth.role = 'master')"

      app.save(invCol)
    } catch (err) {
      console.log('Erro na migração 0093_add_origem_to_emissoes_inventario:', err)
      throw err
    }
  },
  (app) => {
    try {
      const invCol = app.findCollectionByNameOrId('emissoes_inventario')
      const field = invCol.fields.getByName('origem')
      if (field) {
        invCol.fields.remove(field)
      }
      invCol.listRule =
        "@request.auth.id != '' && (usuario = @request.auth.id || @request.auth.role = 'admin' || @request.auth.role = 'perito')"
      invCol.viewRule =
        "@request.auth.id != '' && (usuario = @request.auth.id || @request.auth.role = 'admin' || @request.auth.role = 'perito')"
      invCol.updateRule =
        "@request.auth.id != '' && (usuario = @request.auth.id || @request.auth.role = 'admin' || @request.auth.role = 'perito')"
      invCol.deleteRule = "@request.auth.id != '' && @request.auth.role = 'admin'"
      app.save(invCol)
    } catch (_) {}
  },
)
