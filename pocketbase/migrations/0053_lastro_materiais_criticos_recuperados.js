/**
 * MIGRATION 0053: LASTRO DE CIRCULARIDADE — CAMPOS DE MATERIAIS CRÍTICOS RECUPERADOS (MINERAÇÃO URBANA)
 *
 * Adiciona à coleção lastro_circularidade:
 * - massa_materiais_criticos_kg: number
 * - teor_terras_raras_kg: number (NdFeB, discos/motores elétricos)
 * - teor_metais_nobres_g: number (Au/Pd/Ag em PCBs, gramas)
 * - teor_cobre_recuperado_kg: number (fios, bobinados, chicotes)
 * - tipo_lastro_segregado: select ('lr_decreto_11413', 'segregado_materiais_criticos_recuperados', 'misto')
 */

migrate(
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('lastro_circularidade')

      if (!col.fields.getByName('massa_materiais_criticos_kg')) {
        col.fields.add(
          new NumberField({
            name: 'massa_materiais_criticos_kg',
            required: false,
          }),
        )
      }

      if (!col.fields.getByName('teor_terras_raras_kg')) {
        col.fields.add(
          new NumberField({
            name: 'teor_terras_raras_kg',
            required: false,
          }),
        )
      }

      if (!col.fields.getByName('teor_metais_nobres_g')) {
        col.fields.add(
          new NumberField({
            name: 'teor_metais_nobres_g',
            required: false,
          }),
        )
      }

      if (!col.fields.getByName('teor_cobre_recuperado_kg')) {
        col.fields.add(
          new NumberField({
            name: 'teor_cobre_recuperado_kg',
            required: false,
          }),
        )
      }

      if (!col.fields.getByName('tipo_lastro_segregado')) {
        col.fields.add(
          new SelectField({
            name: 'tipo_lastro_segregado',
            values: ['lr_decreto_11413', 'segregado_materiais_criticos_recuperados', 'misto'],
            maxSelect: 1,
            required: false,
          }),
        )
      }

      app.save(col)
      console.log(
        '[Migration 0053] Campos de materiais críticos adicionados à lastro_circularidade.',
      )
    } catch (err) {
      console.log('[Migration 0053] Erro ao atualizar lastro_circularidade:', err)
      throw err
    }
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('lastro_circularidade')
      const campos = [
        'massa_materiais_criticos_kg',
        'teor_terras_raras_kg',
        'teor_metais_nobres_g',
        'teor_cobre_recuperado_kg',
        'tipo_lastro_segregado',
      ]
      for (const c of campos) {
        const f = col.fields.getByName(c)
        if (f) col.fields.removeByName(c)
      }
      app.save(col)
    } catch (_) {}
  },
)
