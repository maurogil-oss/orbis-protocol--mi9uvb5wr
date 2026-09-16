migrate(
  (app) => {
    // 1. Atualizar leads_diagnostico: adicionar campo 'origem' (ex.: 'funil', 'agente_ia', 'portal')
    const leadsCol = app.findCollectionByNameOrId('leads_diagnostico')
    if (!leadsCol.fields.getByName('origem')) {
      leadsCol.fields.add(
        new SelectField({
          name: 'origem',
          values: ['funil', 'agente_ia', 'portal'],
          maxSelect: 1,
        }),
      )
    }

    // Campo lido/visto pelo auditor (booleano opcional)
    if (!leadsCol.fields.getByName('visto_auditor')) {
      leadsCol.fields.add(
        new BoolField({
          name: 'visto_auditor',
        }),
      )
    }

    app.save(leadsCol)

    // Atualizar leads existentes para origem = 'funil' se estiver nulo
    try {
      app
        .db()
        .newQuery(
          "UPDATE leads_diagnostico SET origem = 'funil' WHERE origem IS NULL OR origem = ''",
        )
        .execute()
    } catch (_) {}

    // 2. Criar coleção nfe_upload para armazenar os dados extraídos de XML de NF-e
    // Regras:
    // list, view, update, delete: dono (@request.auth.id = usuario) ou admin/perito
    // create: usuário autenticado (@request.auth.id != '')
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')

    try {
      app.findCollectionByNameOrId('nfe_upload')
      // Se já existir, pula
    } catch (_) {
      const nfeCol = new Collection({
        name: 'nfe_upload',
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
          { name: 'chave_acesso', type: 'text', max: 44 },
          { name: 'numero_nota', type: 'text' },
          { name: 'serie', type: 'text' },
          { name: 'modelo', type: 'text' }, // 55 ou 65
          { name: 'data_emissao', type: 'text' },
          { name: 'cnpj_emitente', type: 'text' },
          { name: 'nome_emitente', type: 'text' },
          { name: 'cnpj_destinatario', type: 'text' },
          { name: 'nome_destinatario', type: 'text' },
          { name: 'valor_total_nf', type: 'number' },
          { name: 'valor_icms', type: 'number' },
          { name: 'valor_ipi', type: 'number' },
          { name: 'valor_pis', type: 'number' },
          { name: 'valor_cofins', type: 'number' },
          { name: 'qtd_itens', type: 'number', onlyInt: true },
          { name: 'resumo_itens_json', type: 'json' },
          { name: 'nome_arquivo', type: 'text' },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_nfe_usuario ON nfe_upload (usuario)',
          'CREATE INDEX idx_nfe_chave ON nfe_upload (chave_acesso)',
        ],
      })
      app.save(nfeCol)
    }

    // 3. Garantir usuário de serviço para chats anônimos do agente de IA
    try {
      app.findAuthRecordByEmail('_pb_users_auth_', 'visitante-ia@orbisprotocol.com')
    } catch (_) {
      const rec = new Record(usersCol)
      rec.setEmail('visitante-ia@orbisprotocol.com')
      rec.setPassword($security.randomString(28))
      rec.setVerified(true)
      rec.set('name', 'Visitante Agente Orbis')
      rec.set('role', 'cliente')
      app.save(rec)
    }
  },
  (app) => {
    try {
      const nfeCol = app.findCollectionByNameOrId('nfe_upload')
      app.delete(nfeCol)
    } catch (_) {}

    try {
      const user = app.findAuthRecordByEmail('_pb_users_auth_', 'visitante-ia@orbisprotocol.com')
      app.delete(user)
    } catch (_) {}
  },
)
