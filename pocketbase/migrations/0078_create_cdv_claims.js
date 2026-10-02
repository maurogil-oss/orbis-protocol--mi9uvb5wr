migrate(
  (app) => {
    // Criar coleção cdv_claims para registro público e deduplicação de custódia inter-CDVs
    const collection = new Collection({
      name: 'cdv_claims',
      type: 'base',
      listRule: '', // Leitura pública permitida para transparência e verificação de custódia
      viewRule: '',
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'chave_dedup', type: 'text', required: true }, // chassi + sku + data_baixa normalizados
        { name: 'chassi', type: 'text', required: true },
        { name: 'sku', type: 'text', required: true },
        { name: 'data_baixa', type: 'text', required: true },
        { name: 'cdv_cnpj', type: 'text', required: true },
        { name: 'cdv_nome', type: 'text' },
        { name: 'lote_id', type: 'text' },
        { name: 'selo_dpp', type: 'text' },
        { name: 'hash_claim', type: 'text', required: true },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: ['confirmado', 'potencial', 'conflito', 'anulado'],
          maxSelect: 1,
        },
        { name: 'destinacao_tipo', type: 'text' },
        { name: 'destinacao_evidencia', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE UNIQUE INDEX idx_cdv_claims_chave ON cdv_claims (chave_dedup)',
        'CREATE INDEX idx_cdv_claims_chassi ON cdv_claims (chassi)',
        'CREATE INDEX idx_cdv_claims_hash ON cdv_claims (hash_claim)',
        'CREATE INDEX idx_cdv_claims_status ON cdv_claims (status)',
      ],
    })

    app.save(collection)
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('cdv_claims')
      app.delete(col)
    } catch (_) {}
  },
)
