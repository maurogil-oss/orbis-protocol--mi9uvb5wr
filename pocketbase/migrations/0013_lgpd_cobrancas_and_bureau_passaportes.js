migrate(
  (app) => {
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')

    // 1. Atualizar leads_diagnostico: trilha de consentimento LGPD
    const leadsCol = app.findCollectionByNameOrId('leads_diagnostico')
    if (!leadsCol.fields.getByName('consentimento_data_hora')) {
      leadsCol.fields.add(new TextField({ name: 'consentimento_data_hora' }))
    }
    if (!leadsCol.fields.getByName('consentimento_ip')) {
      leadsCol.fields.add(new TextField({ name: 'consentimento_ip' }))
    }
    if (!leadsCol.fields.getByName('termo_versao')) {
      leadsCol.fields.add(new TextField({ name: 'termo_versao' }))
    }
    app.save(leadsCol)

    // 2. Coleção lgpd_solicitacoes (Canal do Titular Art. 18)
    // Regras RLS: público pode criar pedido (create-only), só admin/perito lê e atualiza status.
    try {
      app.findCollectionByNameOrId('lgpd_solicitacoes')
    } catch (_) {
      const solicitacoesCol = new Collection({
        name: 'lgpd_solicitacoes',
        type: 'base',
        listRule:
          "@request.auth.id != '' && (@request.auth.role = 'admin' || @request.auth.role = 'perito')",
        viewRule:
          "@request.auth.id != '' && (@request.auth.role = 'admin' || @request.auth.role = 'perito')",
        createRule: '', // Público (create-only)
        updateRule:
          "@request.auth.id != '' && (@request.auth.role = 'admin' || @request.auth.role = 'perito')",
        deleteRule:
          "@request.auth.id != '' && (@request.auth.role = 'admin' || @request.auth.role = 'perito')",
        fields: [
          { name: 'protocolo', type: 'text', required: true },
          {
            name: 'tipo_pedido',
            type: 'select',
            values: [
              'confirmacao_existencia',
              'acesso_dados',
              'correcao',
              'anonimizacao_bloqueio_eliminacao',
              'portabilidade',
              'revogacao_consentimento',
            ],
            required: true,
            maxSelect: 1,
          },
          { name: 'nome_titular', type: 'text', required: true },
          { name: 'email_titular', type: 'email', required: true },
          { name: 'cpf_cnpj_titular', type: 'text', required: true },
          { name: 'descricao', type: 'text', required: true },
          {
            name: 'status',
            type: 'select',
            values: ['recebido', 'em_analise', 'atendido', 'recusado'],
            required: true,
            maxSelect: 1,
          },
          { name: 'prazo_legal_dias', type: 'number', onlyInt: true },
          { name: 'data_limite_resposta', type: 'text' },
          { name: 'hash_protocolo', type: 'text' },
          { name: 'resposta_encarregado', type: 'text' },
          { name: 'atendido_por', type: 'text' },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE UNIQUE INDEX idx_lgpd_solic_protocolo ON lgpd_solicitacoes (protocolo)',
          'CREATE INDEX idx_lgpd_solic_status ON lgpd_solicitacoes (status)',
          'CREATE INDEX idx_lgpd_solic_cpf_cnpj ON lgpd_solicitacoes (cpf_cnpj_titular)',
        ],
      })
      app.save(solicitacoesCol)
    }

    // 3. Coleção lgpd_retencoes (Políticas por tipo de dado)
    try {
      app.findCollectionByNameOrId('lgpd_retencoes')
    } catch (_) {
      const retencoesCol = new Collection({
        name: 'lgpd_retencoes',
        type: 'base',
        listRule: '', // Público para visualização na política de privacidade e console
        viewRule: '',
        createRule:
          "@request.auth.id != '' && (@request.auth.role = 'admin' || @request.auth.role = 'perito')",
        updateRule:
          "@request.auth.id != '' && (@request.auth.role = 'admin' || @request.auth.role = 'perito')",
        deleteRule:
          "@request.auth.id != '' && (@request.auth.role = 'admin' || @request.auth.role = 'perito')",
        fields: [
          { name: 'tipo_dado', type: 'text', required: true },
          { name: 'descricao_dado', type: 'text', required: true },
          { name: 'prazo_meses', type: 'number', required: true, onlyInt: true },
          { name: 'base_legal', type: 'text', required: true },
          { name: 'rotina_descarte', type: 'text', required: true },
          { name: 'artigo_legal', type: 'text' },
          { name: 'ativo', type: 'bool' },
          { name: 'ultimo_expurgo', type: 'date' },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: ['CREATE UNIQUE INDEX idx_lgpd_retenc_tipo ON lgpd_retencoes (tipo_dado)'],
      })
      app.save(retencoesCol)

      // Seed das 5 políticas solicitadas no briefing:
      const retCol = app.findCollectionByNameOrId('lgpd_retencoes')
      const seedRetencoes = [
        {
          tipo_dado: 'leads_diagnostico',
          descricao_dado: 'Diagnósticos e cadastros de elegibilidade preliminar',
          prazo_meses: 24,
          base_legal: 'Consentimento do Titular e Procedimentos Preliminares a Contrato',
          artigo_legal: 'Art. 7º, I e V da Lei 13.709/2018 (LGPD)',
          rotina_descarte:
            'Anonimização pericial de campos identificáveis (nome, e-mail, telefone) e exclusão após 24 meses de inatividade.',
        },
        {
          tipo_dado: 'nfe_upload_e_emissoes',
          descricao_dado: 'Uploads de NF-e, CT-e, NFS-e e Laudos de Inventário de Emissões',
          prazo_meses: 60,
          base_legal: 'Cumprimento de Obrigação Legal e Regulatória / Prova Pericial',
          artigo_legal: 'Art. 7º, II da LGPD; Art. 173 do CTN; NBC TO 3000 do CFC',
          rotina_descarte:
            'Guarda probatória de 5 anos fiscais. Expurgado arquivo binário e mantido hash probatório após transcurso prescricional.',
        },
        {
          tipo_dado: 'selos_e_dpp',
          descricao_dado: 'Selos de Sustentabilidade e Passaportes Digitais de Peças (DPP)',
          prazo_meses: 60,
          base_legal: 'Garantia Regulatória e Rastreabilidade de Conformidade MOVER/SBCE',
          artigo_legal: 'Art. 7º, II e IX da LGPD; Lei 14.902/2024 (MOVER)',
          rotina_descarte:
            'Armazenamento integral por 60 meses para verificação pública por terceiros e cadeia compradora.',
        },
        {
          tipo_dado: 'lgpd_solicitacoes',
          descricao_dado: 'Protocolos de Solicitação de Direitos do Titular (Art. 18)',
          prazo_meses: 60,
          base_legal: 'Cumprimento de Obrigação Legal e Prestação de Contas à ANPD',
          artigo_legal: 'Art. 18 e Art. 32 da Lei 13.709/2018; Resoluções CD/ANPD',
          rotina_descarte:
            'Guarda de evidência de resposta tempestiva por 5 anos, arquivamento com hash de integridade.',
        },
        {
          tipo_dado: 'logs_consulta',
          descricao_dado: 'Logs de Acesso, Varreduras de APIs e Sessões',
          prazo_meses: 12,
          base_legal: 'Segurança da Informação e Marco Civil da Internet',
          artigo_legal: 'Art. 15 da Lei 12.965/2014 (MCI) e Art. 46 da LGPD',
          rotina_descarte:
            'Exclusão automática cíclica dos registros transitórios superiores a 12 meses.',
        },
      ]

      for (const item of seedRetencoes) {
        try {
          app.findFirstRecordByData('lgpd_retencoes', 'tipo_dado', item.tipo_dado)
        } catch (_) {
          const rec = new Record(retCol)
          rec.set('tipo_dado', item.tipo_dado)
          rec.set('descricao_dado', item.descricao_dado)
          rec.set('prazo_meses', item.prazo_meses)
          rec.set('base_legal', item.base_legal)
          rec.set('artigo_legal', item.artigo_legal)
          rec.set('rotina_descarte', item.rotina_descarte)
          rec.set('ativo', true)
          app.save(rec)
        }
      }
    }

    // 4. Coleção cobrancas (Checkout PIX + NFS-e)
    // 3 serviços do modelo original: diagnóstico R$ 490 / laudo pericial R$ 2.850 / assinatura bureau R$ 7.800
    // RLS: Dono ou Admin/Perito
    try {
      app.findCollectionByNameOrId('cobrancas')
    } catch (_) {
      const cobrancasCol = new Collection({
        name: 'cobrancas',
        type: 'base',
        listRule:
          "@request.auth.id != '' && (usuario = @request.auth.id || @request.auth.role = 'admin' || @request.auth.role = 'perito')",
        viewRule:
          "@request.auth.id != '' && (usuario = @request.auth.id || @request.auth.role = 'admin' || @request.auth.role = 'perito')",
        createRule: "@request.auth.id != ''",
        updateRule:
          "@request.auth.id != '' && (usuario = @request.auth.id || @request.auth.role = 'admin' || @request.auth.role = 'perito')",
        deleteRule:
          "@request.auth.id != '' && (@request.auth.role = 'admin' || @request.auth.role = 'perito')",
        fields: [
          {
            name: 'usuario',
            type: 'relation',
            required: true,
            collectionId: usersCol.id,
            cascadeDelete: false,
            maxSelect: 1,
          },
          {
            name: 'servico_id',
            type: 'select',
            values: ['diagnostico', 'laudo_pericial', 'assinatura_bureau'],
            required: true,
            maxSelect: 1,
          },
          { name: 'servico_nome', type: 'text', required: true },
          { name: 'valor', type: 'number', required: true },
          {
            name: 'status',
            type: 'select',
            values: ['pendente', 'pendente_simulacao', 'pago', 'expirado', 'cancelado'],
            required: true,
            maxSelect: 1,
          },
          { name: 'tomador_nome', type: 'text', required: true },
          { name: 'tomador_cpf_cnpj', type: 'text', required: true },
          { name: 'tomador_email', type: 'email', required: true },
          { name: 'tomador_endereco', type: 'text' },
          { name: 'provider', type: 'text' }, // mercadopago
          { name: 'provider_payment_id', type: 'text' },
          { name: 'txid', type: 'text' },
          { name: 'qr_code_payload', type: 'text' },
          { name: 'qr_code_base64', type: 'text' },
          { name: 'url_comprovante', type: 'text' },
          { name: 'data_expiracao', type: 'text' },
          { name: 'hash_integridade', type: 'text' },
          { name: 'data_pagamento', type: 'text' },
          { name: 'nfse_numero', type: 'text' },
          { name: 'nfse_serie', type: 'text' },
          { name: 'nfse_verificacao', type: 'text' },
          { name: 'nfse_url', type: 'text' },
          { name: 'nfse_status', type: 'text' },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_cobrancas_usuario ON cobrancas (usuario)',
          'CREATE INDEX idx_cobrancas_status ON cobrancas (status)',
          'CREATE INDEX idx_cobrancas_txid ON cobrancas (txid)',
          'CREATE INDEX idx_cobrancas_payment_id ON cobrancas (provider_payment_id)',
        ],
      })
      app.save(cobrancasCol)
    }

    // 5. Coleção fornecedores_passaportes (Cockpit Bureau ACP - Passaporte do Fornecedor)
    // RLS: Dono + Admin/Perito tem acesso completo.
    // Compradores acessam via link tokenizado (token_consulta) público em consulta.
    try {
      app.findCollectionByNameOrId('fornecedores_passaportes')
    } catch (_) {
      const passaportesCol = new Collection({
        name: 'fornecedores_passaportes',
        type: 'base',
        listRule:
          "@request.auth.id != '' && (usuario = @request.auth.id || @request.auth.role = 'admin' || @request.auth.role = 'perito')",
        viewRule:
          "token_consulta != '' || (@request.auth.id != '' && (usuario = @request.auth.id || @request.auth.role = 'admin' || @request.auth.role = 'perito'))",
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
            cascadeDelete: false,
            maxSelect: 1,
          },
          { name: 'empresa_nome', type: 'text', required: true },
          { name: 'empresa_cnpj', type: 'text', required: true },
          { name: 'token_consulta', type: 'text', required: true },
          { name: 'setor_atuacao', type: 'text' },
          { name: 'kg_co2e_por_kg_produzido', type: 'number' },
          { name: 'peso_produzido_kg_ano', type: 'number' },
          { name: 'emissoes_totais_tco2e', type: 'number' },
          { name: 'score_esg', type: 'number' }, // 0 a 100
          { name: 'matriz_gri_json', type: 'json' },
          { name: 'certidoes_json', type: 'json' },
          { name: 'curva_mac_json', type: 'json' },
          { name: 'dossie_elegibilidade_json', type: 'json' },
          { name: 'config_revelacao_json', type: 'json' }, // Booleano por item: o que o comprador pode ver
          { name: 'hash_integridade', type: 'text' },
          { name: 'data_inventario_origem', type: 'text' },
          { name: 'ativo', type: 'bool' },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE UNIQUE INDEX idx_passaporte_token ON fornecedores_passaportes (token_consulta)',
          'CREATE INDEX idx_passaporte_usuario ON fornecedores_passaportes (usuario)',
          'CREATE INDEX idx_passaporte_cnpj ON fornecedores_passaportes (empresa_cnpj)',
        ],
      })
      app.save(passaportesCol)
    }

    // 6. Seed do Passaporte Demonstrativo para o Bureau ACP
    try {
      const passCol = app.findCollectionByNameOrId('fornecedores_passaportes')
      const demoToken = 'orbis-pass-demo-metais-parana'
      try {
        app.findFirstRecordByData('fornecedores_passaportes', 'token_consulta', demoToken)
      } catch (_) {
        const adminUser = app.findAuthRecordByEmail('_pb_users_auth_', 'maurog1@hotmail.com')
        const rec = new Record(passCol)
        rec.set('usuario', adminUser.id)
        rec.set('empresa_nome', 'Metais & Ligas Paraná S/A')
        rec.set('empresa_cnpj', '76.890.123/0001-45')
        rec.set('token_consulta', demoToken)
        rec.set('setor_atuacao', 'Metalurgia & Autopeças de Precisão (Cadeia MOVER)')
        rec.set('kg_co2e_por_kg_produzido', 1.84)
        rec.set('peso_produzido_kg_ano', 450000)
        rec.set('emissoes_totais_tco2e', 828)
        rec.set('score_esg', 88)
        rec.set('data_inventario_origem', '2026-02-15')
        rec.set('ativo', true)

        rec.set('matriz_gri_json', {
          economica: {
            status: 'conforme',
            itens: [
              {
                codigo: 'GRI 201',
                nome: 'Desempenho Econômico e Valor Gerado',
                status: 'atendido',
              },
              { codigo: 'GRI 205', nome: 'Combate à Corrupção e Compliance', status: 'atendido' },
            ],
          },
          ambiental: {
            status: 'conforme',
            itens: [
              {
                codigo: 'GRI 302',
                nome: 'Gestão de Energia & Fontes Renováveis',
                status: 'atendido',
              },
              {
                codigo: 'GRI 305',
                nome: 'Emissões GEE Escopos 1, 2 e 3 (dMRV)',
                status: 'atendido',
              },
              {
                codigo: 'GRI 306',
                nome: 'Economia Circular e Resíduos Sólidos',
                status: 'atendido',
              },
            ],
          },
          social: {
            status: 'conforme',
            itens: [
              {
                codigo: 'GRI 403',
                nome: 'Saúde e Segurança Ocupacional (SSO)',
                status: 'atendido',
              },
              {
                codigo: 'GRI 405',
                nome: 'Diversidade e Igualdade de Oportunidades',
                status: 'atendido',
              },
            ],
          },
        })

        rec.set('certidoes_json', [
          {
            nome: 'CNDT - Débitos Trabalhistas (TST)',
            emissor: 'Tribunal Superior do Trabalho',
            status: 'valida',
            validade: '2026-11-20',
          },
          {
            nome: 'Certidão Negativa de Débitos Federais e Previdenciários',
            emissor: 'Receita Federal / PGFN',
            status: 'valida',
            validade: '2026-09-15',
          },
          {
            nome: 'Certificação NBR ISO 14001:2015',
            emissor: 'Certificadora Acreditada INMETRO',
            status: 'valida',
            validade: '2027-04-10',
          },
          {
            nome: 'Alvará Sanitário e Licença Ambiental de Operação (LO)',
            emissor: 'Instituto Água e Terra (IAT-PR)',
            status: 'valida',
            validade: '2026-12-30',
          },
        ])

        rec.set('curva_mac_json', [
          {
            iniciativa: 'Substituição de Caldeira a Óleo por Biomassa',
            custo_reais_por_tco2e: -45,
            potencial_reducao_tco2e: 280,
            pay_back_meses: 14,
          },
          {
            iniciativa: 'Autogeração Solar Fotovoltaica na Fábrica (1MWp)',
            custo_reais_por_tco2e: -20,
            potencial_reducao_tco2e: 190,
            pay_back_meses: 32,
          },
          {
            iniciativa: 'Eletrificação de Empilhadeiras e Veículos Internos',
            custo_reais_por_tco2e: 35,
            potencial_reducao_tco2e: 85,
            pay_back_meses: 24,
          },
          {
            iniciativa: 'Eficiência de Fornos de Indução e Insetting ISO 14067',
            custo_reais_por_tco2e: 78,
            potencial_reducao_tco2e: 140,
            pay_back_meses: 36,
          },
        ])

        rec.set('dossie_elegibilidade_json', {
          brde_recupera_sul: {
            atende: true,
            pontuacao: 92,
            itens_atendidos: [
              'Inventário GHG completo',
              'Sem passivo ambiental',
              'Licença de Operação válida',
              'Taxa bonificada elegível (-1,8% a.a.)',
            ],
          },
          fomento_parana_verde: {
            atende: true,
            pontuacao: 95,
            itens_atendidos: [
              'Sede no Paraná',
              'Certidões negativas plenas',
              'Projeto de eficiência energética acoplado',
            ],
          },
          bndes_clima: {
            atende: true,
            pontuacao: 86,
            itens_atendidos: [
              'Score ESG > 75',
              'Verificação pericial de dados',
              'Conformidade de governança',
            ],
          },
        })

        rec.set('config_revelacao_json', {
          mostrar_kg_co2e_produzido: true,
          mostrar_score_esg: true,
          mostrar_matriz_gri: true,
          mostrar_certidoes: true,
          mostrar_curva_mac: true,
          mostrar_dossie_elegibilidade: true,
          mostrar_volume_financeiro: false, // Dado comercial sensível: SEMPRE FALSO
          mostrar_margem_lucro: false, // Dado comercial sensível: SEMPRE FALSO
          mostrar_clientes_privados: false, // Dado comercial sensível: SEMPRE FALSO
        })

        const canonical = `${rec.getString('empresa_cnpj')}|${rec.getString('token_consulta')}|${rec.getInt('score_esg')}|${rec.getFloat('kg_co2e_por_kg_produzido')}|2026-02-15`
        rec.set('hash_integridade', $security.sha256(canonical))
        app.save(rec)
      }
    } catch (_) {}
  },
  (app) => {
    try {
      const passCol = app.findCollectionByNameOrId('fornecedores_passaportes')
      app.delete(passCol)
    } catch (_) {}
    try {
      const cobCol = app.findCollectionByNameOrId('cobrancas')
      app.delete(cobCol)
    } catch (_) {}
    try {
      const retCol = app.findCollectionByNameOrId('lgpd_retencoes')
      app.delete(retCol)
    } catch (_) {}
    try {
      const solCol = app.findCollectionByNameOrId('lgpd_solicitacoes')
      app.delete(solCol)
    } catch (_) {}
  },
)
