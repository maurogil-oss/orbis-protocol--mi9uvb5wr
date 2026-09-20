migrate(
  (app) => {
    // 0048_demo_audit_trail.js
    // Trilha de auditoria anônima do Modo Demonstração Orientada (/demo)
    // Sem dados pessoais, sem exigir login (telemetria anônima de demonstração comercial)
    try {
      app.findCollectionByNameOrId('demo_audit_trail')
    } catch (_) {
      const col = new Collection({
        name: 'demo_audit_trail',
        type: 'base',
        listRule: "@request.auth.id != ''", // apenas administradores / auditores logados podem ler
        viewRule: "@request.auth.id != ''",
        createRule: '', // público: qualquer visitante da /demo pode registrar o início anônimo
        updateRule: null, // imutável: trilha de auditoria append-only
        deleteRule: "@request.auth.id != '' && @request.auth.role = 'admin'",
        fields: [
          {
            name: 'sessao_id',
            type: 'text',
            required: true,
          },
          {
            name: 'etapa_inicial',
            type: 'number',
            required: true,
          },
          {
            name: 'etapa_nome',
            type: 'text',
          },
          {
            name: 'timestamp_inicio',
            type: 'text',
            required: true,
          },
          {
            name: 'origem_url',
            type: 'text',
          },
          {
            name: 'user_agent_resumido',
            type: 'text',
          },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_demo_audit_sessao ON demo_audit_trail (sessao_id)',
          'CREATE INDEX idx_demo_audit_created ON demo_audit_trail (created DESC)',
        ],
      })
      app.save(col)
    }
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('demo_audit_trail')
      app.delete(col)
    } catch (_) {}
  },
)
