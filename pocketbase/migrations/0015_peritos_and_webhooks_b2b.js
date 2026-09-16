migrate(
  (app) => {
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')

    // 1. Coleção perito_credenciamentos (Fluxo de Credenciamento ART/RRT de Peritos)
    try {
      app.findCollectionByNameOrId('perito_credenciamentos')
    } catch (_) {
      const peritoCol = new Collection({
        name: 'perito_credenciamentos',
        type: 'base',
        // Público pode criar (createRule aberta para cadastro prévio); leitura e modificação restritas a admin e ao próprio usuário se logado
        listRule:
          "@request.auth.id != '' && (@request.auth.role = 'admin' || usuario = @request.auth.id)",
        viewRule:
          "@request.auth.id != '' && (@request.auth.role = 'admin' || usuario = @request.auth.id)",
        createRule: '', // Público cria (create-only)
        updateRule: "@request.auth.role = 'admin'",
        deleteRule: "@request.auth.role = 'admin'",
        fields: [
          {
            name: 'usuario',
            type: 'relation',
            required: false,
            collectionId: usersCol.id,
            cascadeDelete: false,
            maxSelect: 1,
          },
          { name: 'nome_completo', type: 'text', required: true },
          { name: 'cpf', type: 'text', required: true },
          {
            name: 'conselho_tipo',
            type: 'select',
            values: ['CREA', 'CRC', 'CRQ', 'CRBio', 'OAB', 'OUTRO'],
            maxSelect: 1,
            required: true,
          },
          { name: 'registro_profissional', type: 'text', required: true },
          { name: 'registro_uf', type: 'text', required: true },
          { name: 'email_corporativo', type: 'text', required: true },
          { name: 'telefone', type: 'text', required: true },
          { name: 'areas_atuacao', type: 'json' }, // array de slugs dos protocolos
          { name: 'numero_art_rrt', type: 'text' },
          {
            name: 'documento_art_pdf',
            type: 'file',
            maxSelect: 1,
            maxSize: 15 * 1024 * 1024,
            mimeTypes: ['application/pdf', 'image/jpeg', 'image/png'],
          },
          { name: 'termo_versao', type: 'text', required: true },
          { name: 'consentimento_data_hora', type: 'text', required: true },
          { name: 'consentimento_ip', type: 'text' },
          {
            name: 'status',
            type: 'select',
            values: ['pendente', 'aprovado', 'rejeitado'],
            maxSelect: 1,
            required: true,
          },
          { name: 'observacao_auditor', type: 'text' },
          { name: 'aprovado_por', type: 'text' },
          { name: 'data_decisao', type: 'text' },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_cred_email ON perito_credenciamentos (email_corporativo)',
          'CREATE INDEX idx_cred_cpf ON perito_credenciamentos (cpf)',
          'CREATE INDEX idx_cred_status ON perito_credenciamentos (status)',
        ],
      })
      app.save(peritoCol)
    }

    // 2. Coleção webhooks_config (Configuração B2B de Webhooks por Organização/Cliente)
    try {
      app.findCollectionByNameOrId('webhooks_config')
    } catch (_) {
      const whConfigCol = new Collection({
        name: 'webhooks_config',
        type: 'base',
        listRule:
          "@request.auth.id != '' && (usuario = @request.auth.id || @request.auth.role = 'admin')",
        viewRule:
          "@request.auth.id != '' && (usuario = @request.auth.id || @request.auth.role = 'admin')",
        createRule: "@request.auth.id != ''",
        updateRule:
          "@request.auth.id != '' && (usuario = @request.auth.id || @request.auth.role = 'admin')",
        deleteRule:
          "@request.auth.id != '' && (usuario = @request.auth.id || @request.auth.role = 'admin')",
        fields: [
          {
            name: 'usuario',
            type: 'relation',
            required: true,
            collectionId: usersCol.id,
            cascadeDelete: true,
            maxSelect: 1,
          },
          { name: 'nome_aplicacao', type: 'text', required: true },
          { name: 'url_destino', type: 'url', required: true },
          { name: 'secret_hmac', type: 'text', required: true }, // Segredo SHA-256
          { name: 'eventos_ativos', type: 'json', required: true }, // Array de eventos inscritos
          { name: 'ativo', type: 'bool' },
          { name: 'descricao', type: 'text' },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_wh_user ON webhooks_config (usuario)',
          'CREATE INDEX idx_wh_ativo ON webhooks_config (ativo)',
        ],
      })
      app.save(whConfigCol)
    }

    // 3. Coleção webhooks_entregas (Log de Disparos e Auditoria B2B)
    try {
      app.findCollectionByNameOrId('webhooks_entregas')
    } catch (_) {
      const whEntregasCol = new Collection({
        name: 'webhooks_entregas',
        type: 'base',
        listRule:
          "@request.auth.id != '' && (usuario = @request.auth.id || @request.auth.role = 'admin')",
        viewRule:
          "@request.auth.id != '' && (usuario = @request.auth.id || @request.auth.role = 'admin')",
        createRule: "@request.auth.role = 'admin'", // Disparos gravados pelo servidor
        updateRule: "@request.auth.role = 'admin'",
        deleteRule: "@request.auth.role = 'admin'",
        fields: [
          {
            name: 'webhook_config',
            type: 'relation',
            required: false,
            collectionId: app.findCollectionByNameOrId('webhooks_config').id,
            cascadeDelete: true,
            maxSelect: 1,
          },
          {
            name: 'usuario',
            type: 'relation',
            required: false,
            collectionId: usersCol.id,
            cascadeDelete: true,
            maxSelect: 1,
          },
          { name: 'evento', type: 'text', required: true },
          { name: 'url_destino', type: 'text', required: true },
          { name: 'payload_json', type: 'json' },
          { name: 'signature_hmac', type: 'text' },
          { name: 'http_status', type: 'number', onlyInt: true },
          {
            name: 'status_entrega',
            type: 'select',
            values: ['sucesso', 'falha', 'em_processamento'],
            maxSelect: 1,
            required: true,
          },
          { name: 'resposta_corpo', type: 'text' },
          { name: 'tempo_resposta_ms', type: 'number', onlyInt: true },
          { name: 'tentativa', type: 'number', onlyInt: true },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_wh_ent_user ON webhooks_entregas (usuario)',
          'CREATE INDEX idx_wh_ent_evento ON webhooks_entregas (evento)',
          'CREATE INDEX idx_wh_ent_status ON webhooks_entregas (status_entrega)',
        ],
      })
      app.save(whEntregasCol)
    }

    // 4. Seed de 1 credenciamento de exemplo para demonstração no console do auditor
    try {
      const peritoCol = app.findCollectionByNameOrId('perito_credenciamentos')
      const count = app.countRecords(
        'perito_credenciamentos',
        "email_corporativo = 'perito.exemplo@orbisprotocol.org'",
      )
      if (count === 0) {
        const record = new Record(peritoCol)
        record.set('nome_completo', 'Dr. Roberto Silveira Brandão (Exemplo)')
        record.set('cpf', '012.345.678-90')
        record.set('conselho_tipo', 'CREA')
        record.set('registro_profissional', 'CREA-SP 506.128/D')
        record.set('registro_uf', 'SP')
        record.set('email_corporativo', 'perito.exemplo@orbisprotocol.org')
        record.set('telefone', '(11) 98765-4321')
        record.set('areas_atuacao', ['siderurgia', 'automotiva', 'energia'])
        record.set('numero_art_rrt', 'ART-2025-0891274-SP')
        record.set('termo_versao', 'v1.0-2025')
        record.set('consentimento_data_hora', new Date().toISOString())
        record.set('consentimento_ip', '187.64.12.90')
        record.set('status', 'pendente')
        record.set('observacao_auditor', 'Credenciamento aguardando homologação documental.')
        app.save(record)
      }
    } catch (e) {
      // Ignora erro de seed
    }
  },
  (app) => {
    try {
      const entregas = app.findCollectionByNameOrId('webhooks_entregas')
      app.delete(entregas)
    } catch (_) {}
    try {
      const config = app.findCollectionByNameOrId('webhooks_config')
      app.delete(config)
    } catch (_) {}
    try {
      const peritos = app.findCollectionByNameOrId('perito_credenciamentos')
      app.delete(peritos)
    } catch (_) {}
  },
)
