migrate(
  (app) => {
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')

    // 1. Enriquecer cliente_certificados_a1 com trilha de consentimento versionada e campos de revogação
    const certCol = app.findCollectionByNameOrId('cliente_certificados_a1')
    if (!certCol.fields.getByName('consentimento_ip')) {
      certCol.fields.add(new TextField({ name: 'consentimento_ip' }))
    }
    if (!certCol.fields.getByName('consentimento_data_hora')) {
      certCol.fields.add(new TextField({ name: 'consentimento_data_hora' }))
    }
    if (!certCol.fields.getByName('termo_versao')) {
      certCol.fields.add(new TextField({ name: 'termo_versao' }))
    }
    if (!certCol.fields.getByName('status_custodia')) {
      certCol.fields.add(
        new SelectField({
          name: 'status_custodia',
          values: ['ativo', 'revogado', 'expirado'],
          maxSelect: 1,
        }),
      )
    }
    if (!certCol.fields.getByName('data_revogacao')) {
      certCol.fields.add(new TextField({ name: 'data_revogacao' }))
    }
    if (!certCol.fields.getByName('motivo_revogacao')) {
      certCol.fields.add(new TextField({ name: 'motivo_revogacao' }))
    }
    app.save(certCol)

    // 2. Criar coleção sped_importacoes (Modelo 2: Portal do Contador / EFD ICMS/IPI e EFD Contribuições)
    try {
      app.findCollectionByNameOrId('sped_importacoes')
    } catch (_) {
      const spedCol = new Collection({
        name: 'sped_importacoes',
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
          { name: 'razao_social', type: 'text' },
          {
            name: 'tipo_sped',
            type: 'select',
            values: ['efd_icms_ipi', 'efd_contribuicoes', 'ecd', 'ecf', 'outro'],
            maxSelect: 1,
            required: true,
          },
          { name: 'periodo_apuracao', type: 'text', required: true }, // Ex: "01/2026", "2025"
          { name: 'data_inicio', type: 'text' },
          { name: 'data_fim', type: 'text' },
          { name: 'total_documentos', type: 'number', onlyInt: true },
          { name: 'valor_total_documentos', type: 'number' },
          { name: 'valor_icms_destacado', type: 'number' },
          { name: 'valor_ipi_destacado', type: 'number' },
          { name: 'valor_pis_destacado', type: 'number' },
          { name: 'valor_cofins_destacado', type: 'number' },
          { name: 'nome_arquivo', type: 'text' },
          { name: 'hash_arquivo', type: 'text' },
          { name: 'resumo_detalhado_json', type: 'json' },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_sped_usuario ON sped_importacoes (usuario)',
          'CREATE INDEX idx_sped_cnpj ON sped_importacoes (cnpj)',
          'CREATE INDEX idx_sped_periodo ON sped_importacoes (periodo_apuracao)',
        ],
      })
      app.save(spedCol)
    }
  },
  (app) => {
    try {
      const spedCol = app.findCollectionByNameOrId('sped_importacoes')
      app.delete(spedCol)
    } catch (_) {}
  },
)
