/**
 * MIGRATION 0098: ADICIONAR VALOR 'agro_rastreado' AO CAMPO categoria_material EM cdv_pecas
 *
 * Contexto:
 * 1. O pipeline de ingestão do Sandbox dMRV classifica peças/itens agrícolas com
 *    categoriaSelect = 'agro_rastreado' (materiais rastreados, sem CO₂e atribuído).
 *    Ao tentar persistir esses registros em 'cdv_pecas', o PocketBase rejeitava com
 *    HTTP 400 "Invalid value agro_rastreado" porque o campo SelectField aceitava apenas
 *    ['aco', 'aluminio', 'cobre', 'polimeros', 'concreto', 'outros'].
 *
 * 2. Esta migração adiciona 'agro_rastreado' à lista de valores permitidos em:
 *    - 'cdv_pecas.categoria_material': passa a ['aco', 'aluminio', 'cobre', 'polimeros', 'concreto', 'agro_rastreado', 'outros']
 *
 * 3. Limpeza dos lotes SANDBOX-AGRO órfãos criados sem peças (devido à rejeição 400).
 */

migrate(
  (app) => {
    // 1. Atualizar schema de cdv_pecas.categoria_material
    try {
      const pecasCol = app.findCollectionByNameOrId('cdv_pecas')
      const catField = pecasCol.fields.getByName('categoria_material')
      if (catField) {
        catField.values = [
          'aco',
          'aluminio',
          'cobre',
          'polimeros',
          'concreto',
          'agro_rastreado',
          'outros',
        ]
        app.save(pecasCol)
        console.log(
          '[Migration 0098] categoria_material em cdv_pecas atualizado com sucesso para incluir agro_rastreado.',
        )
      }
    } catch (err) {
      console.log('[Migration 0098] Erro ao atualizar categoria_material em cdv_pecas:', err)
      throw err
    }

    // 2. Limpar lotes SANDBOX-AGRO órfãos sem registros filhos em cdv_pecas
    try {
      const deleteSql = `
        DELETE FROM cdv_lotes
        WHERE cdv_codigo = 'SANDBOX-AGRO'
          AND id NOT IN (SELECT DISTINCT lote FROM cdv_pecas WHERE lote IS NOT NULL)
      `
      app.db().newQuery(deleteSql).execute()
      console.log('[Migration 0098] Lotes SANDBOX-AGRO órfãos limpos com sucesso.')
    } catch (err) {
      console.log('[Migration 0098] Aviso ao limpar lotes órfãos em cdv_lotes:', err)
    }
  },
  (app) => {
    try {
      const pecasCol = app.findCollectionByNameOrId('cdv_pecas')
      const catField = pecasCol.fields.getByName('categoria_material')
      if (catField) {
        catField.values = ['aco', 'aluminio', 'cobre', 'polimeros', 'concreto', 'outros']
        app.save(pecasCol)
      }
    } catch (_) {}
  },
)
