migrate(
  (app) => {
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')

    // 1. Coleção empresa_api_keys_nfs para chaves de API de NFs por empresa/conta
    try {
      app.findCollectionByNameOrId('empresa_api_keys_nfs')
    } catch (_) {
      const keysCol = new Collection({
        name: 'empresa_api_keys_nfs',
        type: 'base',
        listRule:
          "@request.auth.id != '' && (usuario = @request.auth.id || @request.auth.role = 'admin' || @request.auth.role = 'master')",
        viewRule:
          "@request.auth.id != '' && (usuario = @request.auth.id || @request.auth.role = 'admin' || @request.auth.role = 'master')",
        createRule: "@request.auth.id != ''",
        updateRule:
          "@request.auth.id != '' && (usuario = @request.auth.id || @request.auth.role = 'admin' || @request.auth.role = 'master')",
        deleteRule:
          "@request.auth.id != '' && (usuario = @request.auth.id || @request.auth.role = 'admin' || @request.auth.role = 'master')",
        fields: [
          {
            name: 'usuario',
            type: 'relation',
            required: true,
            collectionId: usersCol.id,
            cascadeDelete: true,
            maxSelect: 1,
          },
          { name: 'empresa_nome', type: 'text', required: true },
          { name: 'cnpj_vinculado', type: 'text', required: true },
          { name: 'chave_prefixo', type: 'text', required: true }, // ex: orb_nfs_live_
          { name: 'chave_hash', type: 'text', required: true }, // SHA-256 da chave
          { name: 'chave_mascarada', type: 'text' },
          { name: 'ativa', type: 'bool' },
          { name: 'ultimo_uso', type: 'date' },
          { name: 'requests_count_1min', type: 'number', onlyInt: true },
          { name: 'data_revogacao', type: 'text' },
          { name: 'motivo_revogacao', type: 'text' },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_nfs_keys_usuario ON empresa_api_keys_nfs (usuario)',
          'CREATE INDEX idx_nfs_keys_cnpj ON empresa_api_keys_nfs (cnpj_vinculado)',
          'CREATE INDEX idx_nfs_keys_hash ON empresa_api_keys_nfs (chave_hash)',
        ],
      })
      app.save(keysCol)
    }

    // 2. Coleção nfs_api_lotes_log para registro de auditoria e métricas das chamadas à API de NFs
    try {
      app.findCollectionByNameOrId('nfs_api_lotes_log')
    } catch (_) {
      const logCol = new Collection({
        name: 'nfs_api_lotes_log',
        type: 'base',
        listRule:
          "@request.auth.id != '' && (usuario = @request.auth.id || @request.auth.role = 'admin' || @request.auth.role = 'master')",
        viewRule:
          "@request.auth.id != '' && (usuario = @request.auth.id || @request.auth.role = 'admin' || @request.auth.role = 'master')",
        createRule: "@request.auth.id != ''",
        updateRule: "@request.auth.id != '' && @request.auth.role = 'admin'",
        deleteRule: "@request.auth.id != '' && @request.auth.role = 'admin'",
        fields: [
          {
            name: 'usuario',
            type: 'relation',
            required: false,
            collectionId: usersCol.id,
            cascadeDelete: false,
            maxSelect: 1,
          },
          { name: 'cnpj_vinculado', type: 'text', required: true },
          { name: 'api_key_hash', type: 'text', required: true },
          { name: 'total_recebidos', type: 'number', onlyInt: true },
          { name: 'total_aceitos', type: 'number', onlyInt: true },
          { name: 'total_rejeitados', type: 'number', onlyInt: true },
          {
            name: 'status',
            type: 'select',
            values: ['processado', 'parcial', 'rejeitado'],
            maxSelect: 1,
          },
          { name: 'ip_origem', type: 'text' },
          { name: 'resumo_processamento_json', type: 'json' },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_nfs_log_usuario ON nfs_api_lotes_log (usuario)',
          'CREATE INDEX idx_nfs_log_cnpj ON nfs_api_lotes_log (cnpj_vinculado)',
          'CREATE INDEX idx_nfs_log_created ON nfs_api_lotes_log (created)',
        ],
      })
      app.save(logCol)
    }

    // 3. Atualizar nfe_upload para aceitar origem 'api_nfs' se for campo select
    try {
      const nfeCol = app.findCollectionByNameOrId('nfe_upload')
      const campoOrigem = nfeCol.fields.getByName('origem')
      if (campoOrigem && campoOrigem.type === 'select') {
        const valoresAtuais = campoOrigem.values || []
        if (!valoresAtuais.includes('api_nfs')) {
          campoOrigem.values = [...valoresAtuais, 'api_nfs']
          app.save(nfeCol)
        }
      }
    } catch (_) {}
  },
  (app) => {
    try {
      const logCol = app.findCollectionByNameOrId('nfs_api_lotes_log')
      app.delete(logCol)
    } catch (_) {}
    try {
      const keysCol = app.findCollectionByNameOrId('empresa_api_keys_nfs')
      app.delete(keysCol)
    } catch (_) {}
  },
)
