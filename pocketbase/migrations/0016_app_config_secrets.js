migrate(
  (app) => {
    // Cria coleção app_config_secrets protegida (somente admin/backend tem acesso direto via API)
    let col
    try {
      col = app.findCollectionByNameOrId('app_config_secrets')
    } catch (_) {
      col = new Collection({
        name: 'app_config_secrets',
        type: 'base',
        listRule: null, // Superuser / hooks only
        viewRule: null,
        createRule: null,
        updateRule: null,
        deleteRule: null,
        fields: [
          { name: 'chave', type: 'text', required: true },
          { name: 'valor', type: 'text', required: true },
          { name: 'descricao', type: 'text' },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: ['CREATE UNIQUE INDEX idx_app_config_chave ON app_config_secrets (chave)'],
      })
      app.save(col)
    }

    // Grava o token INFOSIMPLES_TOKEN com segurança no banco interno
    try {
      const existing = app.findFirstRecordByData('app_config_secrets', 'chave', 'INFOSIMPLES_TOKEN')
      existing.set('valor', 'Dyg8-bfqZ6rvRk3xjuA4FmCsFahFmJ-t5OUpq2Bt')
      existing.set(
        'descricao',
        'Token de API oficial InfoSimples para consulta de NF-e e Certificado A1',
      )
      app.save(existing)
    } catch (_) {
      const rec = new Record(col)
      rec.set('chave', 'INFOSIMPLES_TOKEN')
      rec.set('valor', 'Dyg8-bfqZ6rvRk3xjuA4FmCsFahFmJ-t5OUpq2Bt')
      rec.set(
        'descricao',
        'Token de API oficial InfoSimples para consulta de NF-e e Certificado A1',
      )
      app.save(rec)
    }
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('app_config_secrets')
      app.delete(col)
    } catch (_) {}
  },
)
