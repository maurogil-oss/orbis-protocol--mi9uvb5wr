migrate(
  (app) => {
    // Coleção dpp_consultas
    // Registra cada verificação/acesso a Passaportes Digitais de Produto (DPP Consolidado de Lote e DPP Individual de Peça).
    // RLS: Leitura apenas autenticada (console do CDV), escrita permitida sem autenticação (para registrar consultas anônimas de QR público).
    try {
      app.findCollectionByNameOrId('dpp_consultas')
    } catch (_) {
      const consultasCol = new Collection({
        name: 'dpp_consultas',
        type: 'base',
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule: '', // Público para permitir auditoria anônima no QR code ou página pública
        updateRule: "@request.auth.id != ''",
        deleteRule: "@request.auth.id != ''",
        fields: [
          {
            name: 'alvo_tipo',
            type: 'select',
            values: ['lote', 'selo'],
            maxSelect: 1,
            required: true,
          },
          { name: 'alvo_identificador', type: 'text', required: true }, // ID do lote, baixa DETRAN ou selo DPP (ex: PR-SEAL-2026-991823)
          { name: 'lote_id', type: 'text' }, // ID do lote vinculado (se aplicável, para filtros rápidos no console operacional)
          {
            name: 'canal',
            type: 'select',
            values: ['qr', 'web', 'embed'],
            maxSelect: 1,
            required: true,
          },
          { name: 'hash_conferido', type: 'bool' }, // true: conferido/válido, false: divergente
          { name: 'hash_calculado', type: 'text' },
          { name: 'ip_mascarado', type: 'text' }, // Ex.: 189.40.xxx.xxx ou 2804:14d:xxxx:xxxx:: conforme LGPD
          { name: 'user_agent', type: 'text' },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_dpp_consultas_alvo ON dpp_consultas (alvo_identificador)',
          'CREATE INDEX idx_dpp_consultas_lote ON dpp_consultas (lote_id)',
          'CREATE INDEX idx_dpp_consultas_canal ON dpp_consultas (canal)',
          'CREATE INDEX idx_dpp_consultas_created ON dpp_consultas (created DESC)',
        ],
      })
      app.save(consultasCol)
    }
  },
  (app) => {
    try {
      const consultasCol = app.findCollectionByNameOrId('dpp_consultas')
      app.delete(consultasCol)
    } catch (_) {}
  },
)
