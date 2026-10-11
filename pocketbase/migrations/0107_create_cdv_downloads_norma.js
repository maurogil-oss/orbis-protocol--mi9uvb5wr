migrate(
  (app) => {
    // Coleção cdv_downloads_norma: registro de auditoria e prova documental de quem baixou a norma e o CSV completo
    const collection = new Collection({
      name: 'cdv_downloads_norma',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: null, // imutável — prova documental não pode ser adulterada
      deleteRule: null,
      fields: [
        {
          name: 'user_id',
          type: 'relation',
          collectionId: '_pb_users_auth_',
          required: false,
          cascadeDelete: false,
          maxSelect: 1,
        },
        { name: 'user_email', type: 'text', required: true },
        { name: 'user_nome', type: 'text' },
        {
          name: 'tipo_download',
          type: 'select',
          required: true,
          values: ['norma_integral', 'csv_completo'],
          maxSelect: 1,
        },
        { name: 'termo_aceito', type: 'bool' },
        { name: 'versao_norma', type: 'text' },
        { name: 'ip_hash', type: 'text' },
        { name: 'user_agent', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_downloads_norma_email ON cdv_downloads_norma (user_email)',
        'CREATE INDEX idx_downloads_norma_tipo ON cdv_downloads_norma (tipo_download)',
        'CREATE INDEX idx_downloads_norma_created ON cdv_downloads_norma (created DESC)',
      ],
    })

    app.save(collection)
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('cdv_downloads_norma')
      app.delete(col)
    } catch (_) {}
  },
)
