/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    // -------------------------------------------------------------------------
    // MIGRATION 0111: CONFIGURAÇÕES DA EMPRESA (LEITURA ASSISTIDA DE DOCUMENTOS)
    // -------------------------------------------------------------------------
    // Permite configurar por empresa/organização a funcionalidade de:
    // - leitura_assistida_ativa (bool, default true, não obrigatório para permitir false)
    // - leitura_assistida_alterada_em (data/texto ISO)
    // - leitura_assistida_alterada_por (email / nome do responsável na sessão)
    // -------------------------------------------------------------------------

    let col
    try {
      col = app.findCollectionByNameOrId('empresa_configuracoes')
    } catch (_) {
      col = new Collection({
        name: 'empresa_configuracoes',
        type: 'base',
        // list/view: qualquer autenticado ou regras públicas para leitura resiliente
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        // create/update/delete: autenticados (master, admin ou usuário responsável)
        createRule: "@request.auth.id != ''",
        updateRule: "@request.auth.id != ''",
        deleteRule: "@request.auth.id != '' && @request.auth.role = 'master'",
        fields: [
          {
            name: 'empresa_cnpj',
            type: 'text',
            required: true,
          },
          {
            name: 'empresa_nome',
            type: 'text',
          },
          {
            name: 'leitura_assistida_ativa',
            type: 'bool',
            // No PocketBase BoolField required exige true, então NÃO usar required!
          },
          {
            name: 'leitura_assistida_alterada_em',
            type: 'text',
          },
          {
            name: 'leitura_assistida_alterada_por',
            type: 'text',
          },
          {
            name: 'created',
            type: 'autodate',
            onCreate: true,
            onUpdate: false,
          },
          {
            name: 'updated',
            type: 'autodate',
            onCreate: true,
            onUpdate: true,
          },
        ],
        indexes: [
          'CREATE UNIQUE INDEX idx_empresa_config_cnpj ON empresa_configuracoes (empresa_cnpj)',
        ],
      })
      app.save(col)
    }
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('empresa_configuracoes')
      app.delete(col)
    } catch (_) {}
  },
)
