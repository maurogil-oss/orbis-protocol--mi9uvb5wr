migrate(
  (app) => {
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')

    // 1. Coleção simulacoes_credito_verde (Green Capital Engine)
    try {
      app.findCollectionByNameOrId('simulacoes_credito_verde')
    } catch (_) {
      const simulacaoCol = new Collection({
        name: 'simulacoes_credito_verde',
        type: 'base',
        listRule:
          "@request.auth.id != '' && (usuario = @request.auth.id || @request.auth.role = 'admin' || @request.auth.role = 'perito')",
        viewRule:
          "@request.auth.id != '' && (usuario = @request.auth.id || @request.auth.role = 'admin' || @request.auth.role = 'perito')",
        createRule: "@request.auth.id != ''",
        updateRule:
          "@request.auth.id != '' && (usuario = @request.auth.id || @request.auth.role = 'admin' || @request.auth.role = 'perito')",
        deleteRule:
          "@request.auth.id != '' && (usuario = @request.auth.id || @request.auth.role = 'admin' || @request.auth.role = 'perito')",
        fields: [
          {
            name: 'usuario',
            type: 'relation',
            required: true,
            collectionId: usersCol.id,
            cascadeDelete: true,
            maxSelect: 1,
          },
          { name: 'empresa_nome', type: 'text' },
          { name: 'cnpj', type: 'text' },
          { name: 'valor_desejado', type: 'number', required: true },
          { name: 'prazo_meses', type: 'number', onlyInt: true, required: true },
          {
            name: 'finalidade',
            type: 'select',
            values: [
              'eficiencia_energetica',
              'frota_eletrica_gas',
              'economia_circular',
              'energia_solar',
              'agro_verde',
            ],
            maxSelect: 1,
            required: true,
          },
          { name: 'linha_selecionada_id', type: 'text' },
          { name: 'linha_selecionada_nome', type: 'text' },
          { name: 'taxa_padrao_aa', type: 'number' },
          { name: 'taxa_bonificada_aa', type: 'number' },
          { name: 'economia_anual_estimada', type: 'number' },
          { name: 'economia_total_estimada', type: 'number' },
          { name: 'detalhes_simulacao_json', type: 'json' },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_simulacao_usuario ON simulacoes_credito_verde (usuario)',
          'CREATE INDEX idx_simulacao_cnpj ON simulacoes_credito_verde (cnpj)',
        ],
      })
      app.save(simulacaoCol)
    }

    // 2. Coleção relatorios_exportados (Rastreabilidade pericial de PDFs gerados)
    try {
      app.findCollectionByNameOrId('relatorios_exportados')
    } catch (_) {
      const relatoriosCol = new Collection({
        name: 'relatorios_exportados',
        type: 'base',
        listRule:
          "@request.auth.id != '' && (usuario = @request.auth.id || @request.auth.role = 'admin' || @request.auth.role = 'perito')",
        viewRule:
          "@request.auth.id != '' && (usuario = @request.auth.id || @request.auth.role = 'admin' || @request.auth.role = 'perito')",
        createRule: "@request.auth.id != ''",
        updateRule:
          "@request.auth.id != '' && (usuario = @request.auth.id || @request.auth.role = 'admin' || @request.auth.role = 'perito')",
        deleteRule:
          "@request.auth.id != '' && (usuario = @request.auth.id || @request.auth.role = 'admin' || @request.auth.role = 'perito')",
        fields: [
          {
            name: 'usuario',
            type: 'relation',
            required: true,
            collectionId: usersCol.id,
            cascadeDelete: true,
            maxSelect: 1,
          },
          { name: 'cnpj', type: 'text', required: true },
          { name: 'razao_social', type: 'text', required: true },
          {
            name: 'tipo_relatorio',
            type: 'select',
            values: [
              'dossie_completo_pericial',
              'inventario_emissoes',
              'comparativo_tributario',
              'green_capital',
            ],
            maxSelect: 1,
            required: true,
          },
          { name: 'codigo_verificacao', type: 'text' },
          { name: 'hash_sha256', type: 'text' },
          { name: 'gerado_por_nome', type: 'text' },
          { name: 'gerado_por_role', type: 'text' },
          { name: 'metadados_json', type: 'json' },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_relatorios_usuario ON relatorios_exportados (usuario)',
          'CREATE INDEX idx_relatorios_cnpj ON relatorios_exportados (cnpj)',
          'CREATE INDEX idx_relatorios_codigo ON relatorios_exportados (codigo_verificacao)',
        ],
      })
      app.save(relatoriosCol)
    }
  },
  (app) => {
    try {
      const relatoriosCol = app.findCollectionByNameOrId('relatorios_exportados')
      app.delete(relatoriosCol)
    } catch (_) {}

    try {
      const simulacaoCol = app.findCollectionByNameOrId('simulacoes_credito_verde')
      app.delete(simulacaoCol)
    } catch (_) {}
  },
)
