/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    // -------------------------------------------------------------------------
    // MIGRATION 0112: ÍNDICE DE CNPJ EM CDV_LOTE_PENDENCIAS & APOIO AO PAINEL DE RESULTADOS
    // -------------------------------------------------------------------------
    // O Painel de Resultados exige agregação e rastreamento de pendências de coleta,
    // lotes e conformidade restritos por CNPJ. Adicionamos índices auxiliares de
    // performance para consultas rápidas na coleção cdv_lote_pendencias.
    // -------------------------------------------------------------------------
    try {
      const col = app.findCollectionByNameOrId('cdv_lote_pendencias')
      if (col) {
        col.addIndex('idx_cdv_lote_pendencias_lote', false, 'lote', '')
        col.addIndex('idx_cdv_lote_pendencias_status', false, 'status', '')
        app.save(col)
      }
    } catch (err) {
      console.log('[0112] Aviso ao adicionar índices em cdv_lote_pendencias:', err)
    }
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('cdv_lote_pendencias')
      if (col) {
        col.removeIndex('idx_cdv_lote_pendencias_lote')
        col.removeIndex('idx_cdv_lote_pendencias_status')
        app.save(col)
      }
    } catch (_) {}
  },
)
