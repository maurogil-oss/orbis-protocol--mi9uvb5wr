migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('relatorios_exportados')

    if (!col.fields.getByName('arquivo_assinado_pdf')) {
      col.fields.add(
        new FileField({
          name: 'arquivo_assinado_pdf',
          maxSelect: 1,
          maxSize: 15728640, // 15MB
          mimeTypes: ['application/pdf'],
        }),
      )
    }

    if (!col.fields.getByName('assinatura_digital_json')) {
      col.fields.add(
        new JSONField({
          name: 'assinatura_digital_json',
          maxSize: 1048576, // 1MB
        }),
      )
    }

    if (!col.fields.getByName('assinado_icp_brasil')) {
      col.fields.add(
        new BoolField({
          name: 'assinado_icp_brasil',
        }),
      )
    }

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('relatorios_exportados')
    if (col.fields.getByName('arquivo_assinado_pdf')) {
      col.fields.removeByName('arquivo_assinado_pdf')
    }
    if (col.fields.getByName('assinatura_digital_json')) {
      col.fields.removeByName('assinatura_digital_json')
    }
    if (col.fields.getByName('assinado_icp_brasil')) {
      col.fields.removeByName('assinado_icp_brasil')
    }
    app.save(col)
  },
)
