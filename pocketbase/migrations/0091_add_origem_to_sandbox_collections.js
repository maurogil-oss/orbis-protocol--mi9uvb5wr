/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    // 1. selos: adicionar campo origem
    try {
      const selosCol = app.findCollectionByNameOrId('selos')
      if (!selosCol.fields.getByName('origem')) {
        selosCol.fields.add(
          new TextField({
            name: 'origem',
            required: false,
          }),
        )
        app.save(selosCol)
      }
    } catch (err) {
      console.log('Erro ao adicionar origem em selos:', err)
    }

    // 2. cdv_lotes: adicionar campo origem
    try {
      const lotesCol = app.findCollectionByNameOrId('cdv_lotes')
      if (!lotesCol.fields.getByName('origem')) {
        lotesCol.fields.add(
          new TextField({
            name: 'origem',
            required: false,
          }),
        )
        app.save(lotesCol)
      }
    } catch (err) {
      console.log('Erro ao adicionar origem em cdv_lotes:', err)
    }

    // 3. cdv_pecas: adicionar campo origem
    try {
      const pecasCol = app.findCollectionByNameOrId('cdv_pecas')
      if (!pecasCol.fields.getByName('origem')) {
        pecasCol.fields.add(
          new TextField({
            name: 'origem',
            required: false,
          }),
        )
        app.save(pecasCol)
      }
    } catch (err) {
      console.log('Erro ao adicionar origem em cdv_pecas:', err)
    }

    // 4. dpp_destinacao_final: adicionar campo origem
    try {
      const destCol = app.findCollectionByNameOrId('dpp_destinacao_final')
      if (!destCol.fields.getByName('origem')) {
        destCol.fields.add(
          new TextField({
            name: 'origem',
            required: false,
          }),
        )
        app.save(destCol)
      }
    } catch (err) {
      console.log('Erro ao adicionar origem em dpp_destinacao_final:', err)
    }
  },
  (app) => {
    const collections = ['selos', 'cdv_lotes', 'cdv_pecas', 'dpp_destinacao_final']
    for (const name of collections) {
      try {
        const col = app.findCollectionByNameOrId(name)
        const field = col.fields.getByName('origem')
        if (field) {
          col.fields.remove(field)
          app.save(col)
        }
      } catch (_) {}
    }
  },
)
