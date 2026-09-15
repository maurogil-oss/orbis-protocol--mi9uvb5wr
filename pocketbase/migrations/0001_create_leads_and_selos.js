migrate(
  (app) => {
    const usersCollection = app.findCollectionByNameOrId('_pb_users_auth_')

    const leads = new Collection({
      name: 'leads_diagnostico',
      type: 'base',
      listRule: '',
      viewRule: '',
      createRule: '',
      updateRule: "@request.auth.id != '' && (usuario = @request.auth.id || @request.auth.id = id)",
      deleteRule: "@request.auth.id != '' && (usuario = @request.auth.id || @request.auth.id = id)",
      fields: [
        { name: 'cnpj', type: 'text', required: true },
        { name: 'razao_social', type: 'text', required: true },
        { name: 'email', type: 'text' },
        { name: 'whatsapp', type: 'text' },
        { name: 'responsavel', type: 'text' },
        {
          name: 'categoria_profissional',
          type: 'select',
          values: [
            'Empresário / Diretor / Gestor da Empresa',
            'Centro de Desmontagem Veicular (CDV / Desmanche Credenciado)',
            'Contador / Auditor Independente (CRC)',
            'Engenheiro Mecânico / Ambiental (CREA - Resp. Técnico)',
            'Advogado Tributarista / Ambientalista (OAB)',
            'Consultor de Sustentabilidade & Compliance',
            'Perito Contábil',
            'Auditor',
            'Engenheiro',
            'Advogado',
            'Contador',
            'Outro',
          ],
          maxSelect: 1,
        },
        { name: 'conselho', type: 'text' },
        {
          name: 'vinculo_institucional',
          type: 'select',
          values: [
            'Mercado Nacional (Bahia, SP, Brasil)',
            'Associado ACP (Paraná)',
            'Cadeia Automotiva / CDV (Programa MOVER)',
            'Mercado Nacional',
            'Associado ACP Paraná',
            'Cadeia Automotiva MOVER',
          ],
          maxSelect: 1,
        },
        { name: 'regime_tributario', type: 'text' },
        {
          name: 'status',
          type: 'select',
          values: ['novo', 'em_analise', 'concluido'],
          maxSelect: 1,
        },
        {
          name: 'usuario',
          type: 'relation',
          collectionId: usersCollection.id,
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE UNIQUE INDEX idx_leads_cnpj ON leads_diagnostico (cnpj)',
        'CREATE INDEX idx_leads_status ON leads_diagnostico (status)',
        'CREATE INDEX idx_leads_usuario ON leads_diagnostico (usuario)',
      ],
    })
    app.save(leads)

    const selos = new Collection({
      name: 'selos',
      type: 'base',
      listRule: '',
      viewRule: '',
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'codigo_selo', type: 'text', required: true },
        { name: 'empresa', type: 'text', required: true },
        { name: 'cnpj', type: 'text', required: true },
        {
          name: 'status',
          type: 'select',
          values: ['ativo', 'expirado', 'revogado'],
          maxSelect: 1,
        },
        { name: 'data_emissao', type: 'date' },
        { name: 'data_validade', type: 'date' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE UNIQUE INDEX idx_selos_codigo ON selos (codigo_selo)',
        'CREATE INDEX idx_selos_status ON selos (status)',
        'CREATE INDEX idx_selos_cnpj ON selos (cnpj)',
      ],
    })
    app.save(selos)
  },
  (app) => {
    try {
      const selos = app.findCollectionByNameOrId('selos')
      app.delete(selos)
    } catch (_) {}

    try {
      const leads = app.findCollectionByNameOrId('leads_diagnostico')
      app.delete(leads)
    } catch (_) {}
  },
)
