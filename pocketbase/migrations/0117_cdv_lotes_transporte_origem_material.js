migrate(
  (app) => {
    const lotesCol = app.findCollectionByNameOrId('cdv_lotes')

    if (!lotesCol.fields.getByName('transporte_distancia_km')) {
      lotesCol.fields.add(
        new NumberField({
          name: 'transporte_distancia_km',
          min: 0,
        }),
      )
    }

    if (!lotesCol.fields.getByName('transporte_modal')) {
      lotesCol.fields.add(
        new TextField({
          name: 'transporte_modal',
        }),
      )
    }

    if (!lotesCol.fields.getByName('origem_cidade')) {
      lotesCol.fields.add(
        new TextField({
          name: 'origem_cidade',
        }),
      )
    }

    if (!lotesCol.fields.getByName('origem_uf')) {
      lotesCol.fields.add(
        new TextField({
          name: 'origem_uf',
        }),
      )
    }

    if (!lotesCol.fields.getByName('tipo_material_predominante')) {
      lotesCol.fields.add(
        new TextField({
          name: 'tipo_material_predominante',
        }),
      )
    }

    if (!lotesCol.fields.getByName('hipoteses_declaradas_json')) {
      lotesCol.fields.add(
        new JSONField({
          name: 'hipoteses_declaradas_json',
        }),
      )
    }

    app.save(lotesCol)
  },
  (app) => {
    const lotesCol = app.findCollectionByNameOrId('cdv_lotes')
    const nomes = [
      'transporte_distancia_km',
      'transporte_modal',
      'origem_cidade',
      'origem_uf',
      'tipo_material_predominante',
      'hipoteses_declaradas_json',
    ]

    for (const nome of nomes) {
      const field = lotesCol.fields.getByName(nome)
      if (field) {
        lotesCol.fields.remove(field)
      }
    }

    app.save(lotesCol)
  },
)
