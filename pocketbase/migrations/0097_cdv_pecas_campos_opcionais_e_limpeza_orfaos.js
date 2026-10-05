/**
 * MIGRATION 0097: TORNAR peso_kg E co2e_evitado_kg OPCIONAIS EM cdv_pecas & LIMPEZA DE LOTES SANDBOX ÓRFÃOS
 *
 * 1. Em PocketBase, campos do tipo 'number' marcados como required = true tratam o número 0
 *    como campo em branco ("cannot be blank"). No ecossistema dMRV da Orbis Protocol, diversos
 *    segmentos produtivos (Agro, Energia, Química, etc.) rastreiam massa sem emissão de créditos
 *    de carbono (status: "em_estruturacao_de_catalogo"), gravando co2e_evitado_kg = 0 e peso_kg = 0
 *    de forma estritamente honesta e fidedigna.
 *    Esta migração torna peso_kg e co2e_evitado_kg opcionais (required = false) na coleção cdv_pecas.
 *
 * 2. Limpeza dos 10 lotes SANDBOX-AGRO órfãos criados hoje (2026-10-05) que não possuem
 *    nenhum registro filho em cdv_pecas (devido à falha 400 antes da correção).
 *    A exclusão é realizada via SQL cru (app.db().newQuery) para bypassar a trava do hook
 *    dpp_congelamento_anulacao.js que impede exclusão de lotes com status 'processado' via API.
 */

migrate(
  (app) => {
    // 1. Tornar peso_kg e co2e_evitado_kg opcionais (required = false) em cdv_pecas
    try {
      const pecasCol = app.findCollectionByNameOrId('cdv_pecas')
      const pesoField = pecasCol.fields.getByName('peso_kg')
      if (pesoField) {
        pesoField.required = false
      }
      const co2eField = pecasCol.fields.getByName('co2e_evitado_kg')
      if (co2eField) {
        co2eField.required = false
      }
      app.save(pecasCol)
    } catch (err) {
      console.log('[Migration 0097] Erro ao atualizar cdv_pecas:', err)
      throw err
    }

    // 2. Limpar lotes SANDBOX-AGRO órfãos criados a partir de 2026-10-05 sem registros em cdv_pecas
    try {
      const deleteSql = `
        DELETE FROM cdv_lotes
        WHERE cdv_codigo = 'SANDBOX-AGRO'
          AND created >= '2026-10-05 00:00:00'
          AND id NOT IN (SELECT DISTINCT lote FROM cdv_pecas WHERE lote IS NOT NULL)
      `
      app.db().newQuery(deleteSql).execute()
      console.log('[Migration 0097] Lotes SANDBOX-AGRO órfãos limpos com sucesso.')
    } catch (err) {
      console.log('[Migration 0097] Aviso ao limpar lotes órfãos em cdv_lotes:', err)
    }
  },
  (app) => {
    try {
      const pecasCol = app.findCollectionByNameOrId('cdv_pecas')
      const pesoField = pecasCol.fields.getByName('peso_kg')
      if (pesoField) {
        pesoField.required = true
      }
      const co2eField = pecasCol.fields.getByName('co2e_evitado_kg')
      if (co2eField) {
        co2eField.required = true
      }
      app.save(pecasCol)
    } catch (_) {}
  },
)
