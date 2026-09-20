migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('leads_diagnostico')

    if (!col.fields.getByName('demonstracao')) {
      col.fields.add(
        new BoolField({
          name: 'demonstracao',
          required: false,
        }),
      )
      app.save(col)
    }
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('leads_diagnostico')
      const field = col.fields.getByName('demonstracao')
      if (field) {
        col.fields.removeByName('demonstracao')
        app.save(col)
      }
    } catch (_) {}
  },
)
