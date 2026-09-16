migrate(
  (app) => {
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')

    // 1. Atualizar nfe_upload para suportar os 10 modelos fiscais e rastreabilidade InfoSimples
    const nfeCol = app.findCollectionByNameOrId('nfe_upload')
    if (!nfeCol.fields.getByName('origem')) {
      nfeCol.fields.add(
        new SelectField({
          name: 'origem',
          values: ['manual', 'infosimples', 'sped', 'integracao'],
          maxSelect: 1,
        }),
      )
    }
    if (!nfeCol.fields.getByName('modelo_fiscal')) {
      nfeCol.fields.add(
        new SelectField({
          name: 'modelo_fiscal',
          values: [
            '55_nfe',
            '65_nfce',
            'nfse',
            '57_cte',
            '58_mdfe',
            '66_nf3e',
            '62_nfcom',
            '63_bpe',
            '67_cte_os',
            'fatura_agua',
          ],
          maxSelect: 1,
        }),
      )
    }
    if (!nfeCol.fields.getByName('combustivel_tipo')) {
      nfeCol.fields.add(new TextField({ name: 'combustivel_tipo' }))
    }
    if (!nfeCol.fields.getByName('combustivel_litros')) {
      nfeCol.fields.add(new NumberField({ name: 'combustivel_litros' }))
    }
    if (!nfeCol.fields.getByName('energia_kwh')) {
      nfeCol.fields.add(new NumberField({ name: 'energia_kwh' }))
    }
    if (!nfeCol.fields.getByName('transporte_tkm')) {
      nfeCol.fields.add(new NumberField({ name: 'transporte_tkm' }))
    }
    if (!nfeCol.fields.getByName('dados_adicionais_json')) {
      nfeCol.fields.add(new JSONField({ name: 'dados_adicionais_json' }))
    }
    app.save(nfeCol)

    // 2. Coleção infosimples_consultas (rastreabilidade de auditoria, custos e respostas da InfoSimples)
    try {
      app.findCollectionByNameOrId('infosimples_consultas')
    } catch (_) {
      const consultasCol = new Collection({
        name: 'infosimples_consultas',
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
          { name: 'chave_acesso', type: 'text', max: 44, required: true },
          {
            name: 'status',
            type: 'select',
            values: ['sucesso', 'erro_api', 'token_ausente', 'nao_encontrado', 'simulacao'],
            maxSelect: 1,
          },
          { name: 'codigo_retorno', type: 'number', onlyInt: true },
          { name: 'mensagem_retorno', type: 'text' },
          { name: 'custo_creditos', type: 'number' },
          { name: 'usou_certificado_a1', type: 'bool' },
          { name: 'resposta_json', type: 'json' },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_infosimples_usuario ON infosimples_consultas (usuario)',
          'CREATE INDEX idx_infosimples_chave ON infosimples_consultas (chave_acesso)',
        ],
      })
      app.save(consultasCol)
    }

    // 3. Coleção cliente_certificados_a1 (Upload de .pfx do cliente com senha cifrada e metadados)
    try {
      app.findCollectionByNameOrId('cliente_certificados_a1')
    } catch (_) {
      const certCol = new Collection({
        name: 'cliente_certificados_a1',
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
          { name: 'cnpj_titular', type: 'text', required: true },
          { name: 'razao_social', type: 'text' },
          { name: 'arquivo_pfx', type: 'file', maxSelect: 1, maxSize: 5242880 },
          { name: 'senha_cifrada', type: 'text' }, // Cifrada via PB $security.encrypt no backend
          { name: 'validade_certificado', type: 'date' },
          { name: 'ativo', type: 'bool' },
          { name: 'termo_lgpd_aceito', type: 'bool' },
          { name: 'data_aceite_lgpd', type: 'date' },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_cert_usuario ON cliente_certificados_a1 (usuario)',
          'CREATE INDEX idx_cert_cnpj ON cliente_certificados_a1 (cnpj_titular)',
        ],
      })
      app.save(certCol)
    }

    // 4. Coleção emissoes_inventario (Laudos e apurações periciais completas por Escopos 1, 2 e 3)
    try {
      app.findCollectionByNameOrId('emissoes_inventario')
    } catch (_) {
      const emissoesCol = new Collection({
        name: 'emissoes_inventario',
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
          { name: 'empresa_nome', type: 'text', required: true },
          { name: 'cnpj', type: 'text', required: true },
          { name: 'ano_base', type: 'number', onlyInt: true },
          { name: 'periodo_referencia', type: 'text' },
          { name: 'escopo1_total_tco2e', type: 'number' },
          { name: 'escopo2_localizacao_tco2e', type: 'number' },
          { name: 'escopo2_mercado_tco2e', type: 'number' },
          { name: 'escopo3_total_tco2e', type: 'number' },
          { name: 'emissoes_biogenicas_tco2e', type: 'number' },
          { name: 'emissoes_totais_tco2e', type: 'number' },
          { name: 'insetting_iso14067_tco2e', type: 'number' },
          { name: 'incerteza_consolidada_pct', type: 'number' },
          {
            name: 'status_sbce',
            type: 'select',
            values: ['isento_monitoramento', 'dever_reporte_10k', 'dever_compensacao_25k'],
            maxSelect: 1,
          },
          { name: 'laudo_detalhes_json', type: 'json' },
          { name: 'versao_metodologia', type: 'text' },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_emissoes_usuario ON emissoes_inventario (usuario)',
          'CREATE INDEX idx_emissoes_cnpj ON emissoes_inventario (cnpj)',
        ],
      })
      app.save(emissoesCol)
    }
  },
  (app) => {
    try {
      const emissoesCol = app.findCollectionByNameOrId('emissoes_inventario')
      app.delete(emissoesCol)
    } catch (_) {}

    try {
      const certCol = app.findCollectionByNameOrId('cliente_certificados_a1')
      app.delete(certCol)
    } catch (_) {}

    try {
      const consultasCol = app.findCollectionByNameOrId('infosimples_consultas')
      app.delete(consultasCol)
    } catch (_) {}
  },
)
