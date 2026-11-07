migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('nfe_upload')

    // Campo de arquivo para custódia do XML original
    if (!col.fields.getByName('arquivo_xml')) {
      col.fields.add(
        new FileField({
          name: 'arquivo_xml',
          maxSelect: 1,
          maxSize: 10485760, // 10MB
          mimeTypes: ['text/xml', 'application/xml', 'text/plain'],
        }),
      )
    }

    // Campo de hash SHA-256 do arquivo XML original (imutável após criação)
    if (!col.fields.getByName('xml_sha256')) {
      col.fields.add(
        new TextField({
          name: 'xml_sha256',
          min: 64,
          max: 64,
        }),
      )
    }

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('nfe_upload')
    if (col.fields.getByName('arquivo_xml')) {
      col.fields.removeByName('arquivo_xml')
    }
    if (col.fields.getByName('xml_sha256')) {
      col.fields.removeByName('xml_sha256')
    }
    app.save(col)
  },
)
