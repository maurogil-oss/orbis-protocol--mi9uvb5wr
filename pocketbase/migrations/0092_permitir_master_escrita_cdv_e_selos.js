/// <reference path="../pb_data/types.d.ts" />

/**
 * Migração 0092: Permissões de escrita para o papel 'master'
 *
 * Atualiza as regras de create/update/delete nas coleções:
 * - selos: create/update/delete aceitam master, admin e perito
 * - cdv_lotes: create/update/delete aceitam master e admin
 * - cdv_pecas: create/update/delete aceitam master e admin
 * - dpp_destinacao_final: create/update/delete aceitam master e admin
 *
 * As leituras (list/view) permanecem públicas ou conforme já configurado.
 */
migrate(
  (app) => {
    // 1. selos
    try {
      const col = app.findCollectionByNameOrId('selos')
      col.createRule =
        "@request.auth.id != '' && (@request.auth.role = 'master' || @request.auth.role = 'admin' || @request.auth.role = 'perito')"
      col.updateRule =
        "@request.auth.id != '' && (@request.auth.role = 'master' || @request.auth.role = 'admin' || @request.auth.role = 'perito')"
      col.deleteRule =
        "@request.auth.id != '' && (@request.auth.role = 'master' || @request.auth.role = 'admin' || @request.auth.role = 'perito')"
      app.save(col)
    } catch (err) {
      console.log('Erro ao atualizar regras de selos:', err)
    }

    // 2. cdv_lotes
    try {
      const col = app.findCollectionByNameOrId('cdv_lotes')
      col.createRule =
        "@request.auth.id != '' && (@request.auth.role = 'master' || @request.auth.role = 'admin')"
      col.updateRule =
        "@request.auth.id != '' && (@request.auth.role = 'master' || @request.auth.role = 'admin')"
      col.deleteRule =
        "@request.auth.id != '' && (@request.auth.role = 'master' || @request.auth.role = 'admin')"
      app.save(col)
    } catch (err) {
      console.log('Erro ao atualizar regras de cdv_lotes:', err)
    }

    // 3. cdv_pecas
    try {
      const col = app.findCollectionByNameOrId('cdv_pecas')
      col.createRule =
        "@request.auth.id != '' && (@request.auth.role = 'master' || @request.auth.role = 'admin')"
      col.updateRule =
        "@request.auth.id != '' && (@request.auth.role = 'master' || @request.auth.role = 'admin')"
      col.deleteRule =
        "@request.auth.id != '' && (@request.auth.role = 'master' || @request.auth.role = 'admin')"
      app.save(col)
    } catch (err) {
      console.log('Erro ao atualizar regras de cdv_pecas:', err)
    }

    // 4. dpp_destinacao_final
    try {
      const col = app.findCollectionByNameOrId('dpp_destinacao_final')
      col.createRule =
        "@request.auth.id != '' && (@request.auth.role = 'master' || @request.auth.role = 'admin')"
      col.updateRule =
        "@request.auth.id != '' && (@request.auth.role = 'master' || @request.auth.role = 'admin')"
      col.deleteRule =
        "@request.auth.id != '' && (@request.auth.role = 'master' || @request.auth.role = 'admin')"
      app.save(col)
    } catch (err) {
      console.log('Erro ao atualizar regras de dpp_destinacao_final:', err)
    }
  },
  (app) => {
    try {
      const selosCol = app.findCollectionByNameOrId('selos')
      selosCol.createRule =
        "@request.auth.id != '' && (@request.auth.role = 'admin' || @request.auth.role = 'perito')"
      selosCol.updateRule =
        "@request.auth.id != '' && (@request.auth.role = 'admin' || @request.auth.role = 'perito')"
      selosCol.deleteRule =
        "@request.auth.id != '' && (@request.auth.role = 'admin' || @request.auth.role = 'perito')"
      app.save(selosCol)
    } catch (_) {}

    try {
      const lotesCol = app.findCollectionByNameOrId('cdv_lotes')
      lotesCol.createRule = "@request.auth.id != '' && @request.auth.role = 'admin'"
      lotesCol.updateRule = "@request.auth.id != '' && @request.auth.role = 'admin'"
      lotesCol.deleteRule = "@request.auth.id != '' && @request.auth.role = 'admin'"
      app.save(lotesCol)
    } catch (_) {}

    try {
      const pecasCol = app.findCollectionByNameOrId('cdv_pecas')
      pecasCol.createRule = "@request.auth.id != '' && @request.auth.role = 'admin'"
      pecasCol.updateRule = "@request.auth.id != '' && @request.auth.role = 'admin'"
      pecasCol.deleteRule = "@request.auth.id != '' && @request.auth.role = 'admin'"
      app.save(pecasCol)
    } catch (_) {}

    try {
      const destCol = app.findCollectionByNameOrId('dpp_destinacao_final')
      destCol.createRule = "@request.auth.id != '' && @request.auth.role = 'admin'"
      destCol.updateRule = "@request.auth.id != '' && @request.auth.role = 'admin'"
      destCol.deleteRule = "@request.auth.id != '' && @request.auth.role = 'admin'"
      app.save(destCol)
    } catch (_) {}
  },
)
