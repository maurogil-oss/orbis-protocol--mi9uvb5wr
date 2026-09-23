/**
 * MIGRATION 0051: CAMPOS E VALORES PARA OFERTA ORBIS LPF (LEITURA PRÉ-FATURAMENTO)
 *
 * 1. Atualizar campo 'origem' em leads_diagnostico para incluir 'orbis_lpf'
 * 2. Adicionar campo 'volume_exportacao' (text) em leads_diagnostico (opcional)
 */

migrate(
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('leads_diagnostico')

      // Atualizar campo origem com os valores permitidos
      const origemField = col.fields.getByName('origem')
      if (origemField) {
        origemField.values = ['funil', 'agente_ia', 'portal', 'orbis_lpf']
      } else {
        col.fields.add(
          new SelectField({
            name: 'origem',
            values: ['funil', 'agente_ia', 'portal', 'orbis_lpf'],
            maxSelect: 1,
          }),
        )
      }

      // Adicionar campo volume_exportacao se não existir
      if (!col.fields.getByName('volume_exportacao')) {
        col.fields.add(
          new TextField({
            name: 'volume_exportacao',
            required: false,
          }),
        )
      }

      app.save(col)
    } catch (err) {
      console.log('Erro na migration 0051 (leads_diagnostico orbis_lpf):', err)
      throw err
    }
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('leads_diagnostico')
      const origemField = col.fields.getByName('origem')
      if (origemField) {
        origemField.values = ['funil', 'agente_ia', 'portal']
      }
      if (col.fields.getByName('volume_exportacao')) {
        col.fields.removeByName('volume_exportacao')
      }
      app.save(col)
    } catch (_) {}
  },
)
