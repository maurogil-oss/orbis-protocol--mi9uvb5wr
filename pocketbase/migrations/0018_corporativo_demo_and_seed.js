migrate(
  (app) => {
    // 1. Coleção corporativo_demo para armazenar o dossiê da organização e notas de demonstração
    let demoCol
    try {
      demoCol = app.findCollectionByNameOrId('corporativo_demo')
    } catch (_) {
      demoCol = new Collection({
        name: 'corporativo_demo',
        type: 'base',
        // Leitura pública para a demonstração corporativa aberta /corporativo
        listRule: '',
        viewRule: '',
        createRule:
          "@request.auth.id != '' && (@request.auth.role = 'admin' || @request.auth.role = 'perito')",
        updateRule:
          "@request.auth.id != '' && (@request.auth.role = 'admin' || @request.auth.role = 'perito')",
        deleteRule:
          "@request.auth.id != '' && (@request.auth.role = 'admin' || @request.auth.role = 'perito')",
        fields: [
          { name: 'slug', type: 'text', required: true },
          {
            name: 'tipo',
            type: 'select',
            values: ['empresa_dossie', 'nota_fiscal'],
            required: true,
            maxSelect: 1,
          },
          { name: 'titulo', type: 'text', required: true },
          { name: 'cnpj', type: 'text' },
          {
            name: 'modelo_fiscal',
            type: 'select',
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
          },
          { name: 'categoria_operacional', type: 'text' }, // frota, frete, instalacoes, servicos, etc
          {
            name: 'escopo_alvo',
            type: 'select',
            values: ['escopo_1', 'escopo_2', 'escopo_3'],
            maxSelect: 1,
          },
          { name: 'fossil_kg_co2e', type: 'number' },
          { name: 'biogenico_kg_co2', type: 'number' },
          { name: 'insetting_kg_co2e', type: 'number' },
          { name: 'tier_incerteza', type: 'text' },
          { name: 'incerteza_pct', type: 'number' },
          { name: 'valor_brl', type: 'number' },
          { name: 'quantidade_declarada', type: 'text' },
          { name: 'cnae', type: 'text' },
          { name: 'razao_social_parceiro', type: 'text' },
          { name: 'numero_documento', type: 'text' },
          { name: 'data_emissao', type: 'text' },
          { name: 'status_sefaz', type: 'text' },
          { name: 'detalhes_json', type: 'json' },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE UNIQUE INDEX idx_corp_demo_slug ON corporativo_demo (slug)',
          'CREATE INDEX idx_corp_demo_tipo ON corporativo_demo (tipo)',
          'CREATE INDEX idx_corp_demo_modelo ON corporativo_demo (modelo_fiscal)',
        ],
      })
      app.save(demoCol)
    }

    // 2. Seed do Dossiê da Empresa Fictícia: "Indústrias & Logística Integrada Brasil S.A."
    try {
      app.findFirstRecordByData('corporativo_demo', 'slug', 'dossie-industrias-logistica-brasil')
    } catch (_) {
      const rec = new Record(demoCol)
      rec.set('slug', 'dossie-industrias-logistica-brasil')
      rec.set('tipo', 'empresa_dossie')
      rec.set('titulo', 'Indústrias & Logística Integrada Brasil S.A.')
      rec.set('cnpj', '76.492.108/0001-92')
      rec.set('cnae', '4930-2/02 & 2599-3/99')
      rec.set('razao_social_parceiro', 'Conselho & Auditoria CRC PR-048.910/O-4')
      rec.set('valor_brl', 1420500)
      rec.set('detalhes_json', {
        segmento: 'Manufatura, Logística & Cadeia de Suprimentos',
        localidades: 'Curitiba - PR & São Paulo - SP',
        auditor_crc: 'CRC PR-048.910/O-4',
        auditor_responsavel: 'Dr. Valmor C. Menezes (Auditor Independente Ibracon/CFC)',
        score_esg: 840,
        score_esg_max: 1000,
        escopo1_tco2e: 480.2,
        escopo2_tco2e: 310.8,
        escopo3_tco2e: 629.5,
        total_emissoes_tco2e: 1420.5,
        amostra_12_notas_fossil_tco2e: 12.91,
        amostra_12_notas_biogenico_tco2e: 2.06,
        amostra_12_notas_insetting_tco2e: 1.13,
        hash_integridade: '0x8f4b29a7e3c12948bb92ff78201a0bc45d61e93f91823ab12c',
        padrao_asseguracao: 'ISAE 3000 / NBC TO 3000 (Asseguração Limitada a Razoável)',
        versao_metodologia: 'GHG Protocol Brasil v2025.1 / IPCC AR6 (GWP100)',
        gwp_ar6: { ch4: 27.2, n2o: 273 },
        duplo_reporte: {
          localizacao_sin_fator: 0.06, // kg CO2/kWh
          mercado_irec_fator: 0.0,
        },
      })
      app.save(rec)
    }

    // 3. Seed das 12 Notas Fiscais Demonstrativas nos 10 Modelos Fiscais
    const notasDemo = [
      {
        slug: 'nota-01-copel-nf3e',
        tipo: 'nota_fiscal',
        titulo: 'Copel (Energia Elétrica Rede SIN)',
        numero_documento: '004.892.102',
        modelo_fiscal: '66_nf3e',
        categoria_operacional: 'instalacoes',
        cnae: '3514-0/00',
        status_sefaz: 'OK (Autorizada SEFAZ-PR)',
        tier_incerteza: 'Tier 3',
        incerteza_pct: 4.0,
        razao_social_parceiro: 'COPEL DISTRIBUIÇÃO S.A.',
        cnpj: '76.483.817/0001-20',
        data_emissao: '15/07/2026',
        valor_brl: 4850.0,
        quantidade_declarada: '6.420 kWh',
        escopo_alvo: 'escopo_2',
        fossil_kg_co2e: 385.2,
        biogenico_kg_co2: 0.0,
        insetting_kg_co2e: 0.0,
        detalhes_json: {
          discriminacao: 'Energia Elétrica Ativa - Fornecimento Fático Mercado Cativo / TUSD',
          fonte_fator: 'Fator Médio SIN 0,0600 kgCO₂e/kWh (MCTI Julho/2026)',
          fator_numerico: 0.06,
          unidade_fator: 'kg CO₂e/kWh',
          duplo_reporte: {
            localizacao_kg: 385.2,
            mercado_irec_kg: 0.0,
          },
          subcategoria: 'Eletricidade de Rede (Geração Externa)',
          ncm: '2716.00.00',
        },
      },
      {
        slug: 'nota-02-diesel-s10-nfe',
        tipo: 'nota_fiscal',
        titulo: 'Combustível (Diesel B S10 - Tanque Base)',
        numero_documento: '001.204.881',
        modelo_fiscal: '55_nfe',
        categoria_operacional: 'frota',
        cnae: '4731-8/00',
        status_sefaz: 'OK (Autorizada SEFAZ-PR)',
        tier_incerteza: 'Tier 3',
        incerteza_pct: 3.5,
        razao_social_parceiro: 'POSTO REDE PASTO COMBUSTIVEIS LTDA',
        cnpj: '04.112.980/0001-31',
        data_emissao: '22/07/2026',
        valor_brl: 12400.0,
        quantidade_declarada: '2.150 Litros',
        escopo_alvo: 'escopo_1',
        fossil_kg_co2e: 5740.5,
        biogenico_kg_co2: 387.0,
        insetting_kg_co2e: 0.0,
        detalhes_json: {
          discriminacao: 'Óleo Diesel B S10 - Abastecimento em Base de Frotas Próprias',
          fonte_fator: 'GHG Protocol BR 2025 (Fator Fóssil 2,670 kgCO₂e/L + Parcela Biodiesel B14)',
          fator_numerico: 2.67,
          unidade_fator: 'kg CO₂e/L',
          combustivel_tipo: 'diesel',
          subcategoria: 'Combustão Móvel - Frota Própria Pesada',
          ncm: '2710.19.21',
        },
      },
      {
        slug: 'nota-03-gas-natural-nfe',
        tipo: 'nota_fiscal',
        titulo: 'Gás Natural Industrial (Canalizado)',
        numero_documento: '000.412.900',
        modelo_fiscal: '55_nfe',
        categoria_operacional: 'instalacoes',
        cnae: '3520-4/02',
        status_sefaz: 'OK (Autorizada SEFAZ-PR)',
        tier_incerteza: 'Tier 3',
        incerteza_pct: 4.0,
        razao_social_parceiro: 'COMPAGAS S.A.',
        cnpj: '00.452.190/0001-77',
        data_emissao: '02/07/2026',
        valor_brl: 3100.0,
        quantidade_declarada: '890 m³',
        escopo_alvo: 'escopo_1',
        fossil_kg_co2e: 1780.0,
        biogenico_kg_co2: 0.0,
        insetting_kg_co2e: 0.0,
        detalhes_json: {
          discriminacao: 'Gás Natural Canalizado Comercial / Industrial para Caldeiras',
          fonte_fator: 'MCTI / ANP / GHG Protocol BR (2,000 kgCO₂e/m³)',
          fator_numerico: 2.0,
          unidade_fator: 'kg CO₂e/m³',
          combustivel_tipo: 'gnv',
          subcategoria: 'Combustão Estacionária Industrial',
          ncm: '2711.21.00',
        },
      },
      {
        slug: 'nota-04-klabin-papelao-insetting',
        tipo: 'nota_fiscal',
        titulo: 'Insumo Papelão Reciclado (Insetting)',
        numero_documento: '009.110.450',
        modelo_fiscal: '55_nfe',
        categoria_operacional: 'insumos',
        cnae: '1733-8/00',
        status_sefaz: 'OK (Autorizada SEFAZ-PR)',
        tier_incerteza: 'Tier 2',
        incerteza_pct: 8.5,
        razao_social_parceiro: 'KLABIN S.A.',
        cnpj: '89.637.490/0001-45',
        data_emissao: '28/07/2026',
        valor_brl: 18500.0,
        quantidade_declarada: '4.500 kg',
        escopo_alvo: 'escopo_3',
        fossil_kg_co2e: 1125.0,
        biogenico_kg_co2: 0.0,
        insetting_kg_co2e: 1125.0, // Insetting evitado na cadeia
        detalhes_json: {
          discriminacao: 'Caixas de Papelão Ondulado Recicláveis com Insetting ISO 14067',
          fonte_fator: 'ISO 14067:2018 / Ecoinvent 3.10 (0,250 kgCO₂e/kg matéria reciclada)',
          fator_numerico: 0.25,
          insetting_evitado_kg: 1125.0,
          unidade_fator: 'kg CO₂e/kg',
          subcategoria: 'Bens e Serviços Comprados (Cadeia Upstream)',
          ncm: '4819.10.00',
        },
      },
      {
        slug: 'nota-05-frete-rodoviario-cte',
        tipo: 'nota_fiscal',
        titulo: 'Frete Rodoviário Insumos (CT-e Upstream)',
        numero_documento: '000.089.312',
        modelo_fiscal: '57_cte',
        categoria_operacional: 'frete',
        cnae: '4930-2/02',
        status_sefaz: 'OK (Autorizada SEFAZ-PR)',
        tier_incerteza: 'Tier 3',
        incerteza_pct: 5.0,
        razao_social_parceiro: 'RODOVIÁRIO SOUZA & CIA LTDA',
        cnpj: '05.340.890/0001-18',
        data_emissao: '29/07/2026',
        valor_brl: 6200.0,
        quantidade_declarada: '16.800 t.km (1.200 km / 14 ton)',
        escopo_alvo: 'escopo_3',
        fossil_kg_co2e: 1512.0,
        biogenico_kg_co2: 0.0,
        insetting_kg_co2e: 0.0,
        detalhes_json: {
          discriminacao:
            'Conhecimento de Transporte Eletrônico (CT-e) - Frete Terceirizado de Insumos',
          fonte_fator: 'GLEC Framework v3.0 / GHG Protocol BR (0,0900 kgCO₂e/t.km)',
          fator_numerico: 0.09,
          unidade_fator: 'kg CO₂e/t.km',
          transporte_tkm: 16800,
          subcategoria: 'Transporte e Distribuição Upstream (Mod. 57)',
        },
      },
      {
        slug: 'nota-06-etanol-varejo-nfce',
        tipo: 'nota_fiscal',
        titulo: 'Abastecimento Varejo (NFC-e Etanol Frota Leve)',
        numero_documento: '003.541.200',
        modelo_fiscal: '65_nfce',
        categoria_operacional: 'frota',
        cnae: '4731-8/00',
        status_sefaz: 'OK (Autorizada SEFAZ-PR)',
        tier_incerteza: 'Tier 3',
        incerteza_pct: 3.0,
        razao_social_parceiro: 'AUTO POSTO ECOLÓGICO PARANÁ LTDA',
        cnpj: '11.450.982/0001-90',
        data_emissao: '30/07/2026',
        valor_brl: 4250.0,
        quantidade_declarada: '1.100 Litros',
        escopo_alvo: 'escopo_1',
        fossil_kg_co2e: 462.0,
        biogenico_kg_co2: 1672.0,
        insetting_kg_co2e: 0.0,
        detalhes_json: {
          discriminacao: 'Etanol Hidratado Combustível Comum - Cupom Eletrônico NFC-e Varejo',
          fonte_fator: 'GHG Protocol BR (Fóssil 0,420 kgCO₂e/L | Biogênico 1,520 kgCO₂/L)',
          fator_numerico: 0.42,
          unidade_fator: 'kg CO₂e/L',
          combustivel_tipo: 'etanol',
          subcategoria: 'Combustão Móvel Frota Comercial Flex',
          ncm: '2207.20.19',
        },
      },
      {
        slug: 'nota-07-manutencao-industrial-nfse',
        tipo: 'nota_fiscal',
        titulo: 'Serviços de Manutenção Industrial (NFS-e Municipal)',
        numero_documento: '2026/008412',
        modelo_fiscal: 'nfse',
        categoria_operacional: 'servicos',
        cnae: '7112-0/00',
        status_sefaz: 'OK (Autorizada PMC Curitiba)',
        tier_incerteza: 'Tier 2',
        incerteza_pct: 12.0,
        razao_social_parceiro: 'TECHSERVICES ENGENHARIA & MANUTENCAO LTDA',
        cnpj: '18.990.112/0001-65',
        data_emissao: '18/07/2026',
        valor_brl: 8400.0,
        quantidade_declarada: 'R$ 8.400,00 (Horas Técnicas)',
        escopo_alvo: 'escopo_3',
        fossil_kg_co2e: 126.0,
        biogenico_kg_co2: 0.0,
        insetting_kg_co2e: 0.0,
        detalhes_json: {
          discriminacao:
            'NFS-e de Serviços Técnicos de Calibração e Manutenção Preventiva de Planta',
          fonte_fator:
            'DEFRA UK / Ecoinvent 3.10 (0,0150 kgCO₂e por R$ gasto em serviços técnicos)',
          fator_numerico: 0.015,
          unidade_fator: 'kg CO₂e/R$',
          subcategoria: 'Serviços Terceirizados & Manutenção Predial',
        },
      },
      {
        slug: 'nota-08-viagem-terrestre-bpe',
        tipo: 'nota_fiscal',
        titulo: 'Viagens Corporativas Terrestres (BP-e Interestadual)',
        numero_documento: '000.142.890',
        modelo_fiscal: '63_bpe',
        categoria_operacional: 'viagens',
        cnae: '4922-1/01',
        status_sefaz: 'OK (Autorizada ANTT/SEFAZ)',
        tier_incerteza: 'Tier 3',
        incerteza_pct: 4.5,
        razao_social_parceiro: 'VIAÇÃO GARCIA SUL LTDA',
        cnpj: '78.583.190/0001-09',
        data_emissao: '12/07/2026',
        valor_brl: 960.0,
        quantidade_declarada: '4.200 p.km (8 passagens)',
        escopo_alvo: 'escopo_3',
        fossil_kg_co2e: 159.6,
        biogenico_kg_co2: 0.0,
        insetting_kg_co2e: 0.0,
        detalhes_json: {
          discriminacao:
            'Bilhetes de Passagem Eletrônica (BP-e) - Viagens Técnicas Curitiba x Londrina',
          fonte_fator: 'DEFRA UK Passenger Road (0,0380 kgCO₂e/passageiro.km)',
          fator_numerico: 0.038,
          unidade_fator: 'kg CO₂e/p.km',
          subcategoria: 'Viagens a Negócios Terrestres (Business Travel Mod. 63)',
        },
      },
      {
        slug: 'nota-09-fretamento-turnos-cte-os',
        tipo: 'nota_fiscal',
        titulo: 'Fretamento de Turnos Fabris (CT-e OS Commuting)',
        numero_documento: '000.038.411',
        modelo_fiscal: '67_cte_os',
        categoria_operacional: 'transporte_colab',
        cnae: '4929-9/02',
        status_sefaz: 'OK (Autorizada SEFAZ-PR)',
        tier_incerteza: 'Tier 3',
        incerteza_pct: 5.0,
        razao_social_parceiro: 'FRETAMENTO PARANÁ TRANSPORTE & TURISMO LTDA',
        cnpj: '03.712.449/0001-52',
        data_emissao: '31/07/2026',
        valor_brl: 7800.0,
        quantidade_declarada: '1.850 km rodados (Linha Fabril)',
        escopo_alvo: 'escopo_3',
        fossil_kg_co2e: 1443.0,
        biogenico_kg_co2: 0.0,
        insetting_kg_co2e: 0.0,
        detalhes_json: {
          discriminacao:
            'CT-e Outros Serviços (Mod 67) - Fretamento Dedicado Diário de Funcionários',
          fonte_fator: 'GHG Protocol BR / GLEC (0,7800 kgCO₂e/km rodado em ônibus fretado)',
          fator_numerico: 0.78,
          unidade_fator: 'kg CO₂e/km',
          subcategoria: 'Deslocamento de Colaboradores (Commuting Mod. 67)',
        },
      },
      {
        slug: 'nota-10-sanepar-agua-saneamento',
        tipo: 'nota_fiscal',
        titulo: 'Saneamento & Água Industrial (Fatura Concessionária)',
        numero_documento: 'MATR-948201',
        modelo_fiscal: 'fatura_agua',
        categoria_operacional: 'instalacoes',
        cnae: '3600-6/01',
        status_sefaz: 'OK (Autorizada Agência Reguladora)',
        tier_incerteza: 'Tier 3',
        incerteza_pct: 6.0,
        razao_social_parceiro: 'SANEPAR - CIA DE SANEAMENTO DO PARANÁ',
        cnpj: '76.484.013/0001-45',
        data_emissao: '20/07/2026',
        valor_brl: 2940.0,
        quantidade_declarada: '420 m³ (Água Tratada & Efluentes)',
        escopo_alvo: 'escopo_3',
        fossil_kg_co2e: 144.5,
        biogenico_kg_co2: 0.0,
        insetting_kg_co2e: 0.0,
        detalhes_json: {
          discriminacao:
            'Conta Mensal de Utilidade Pública - Água Tratada Industrial e Coleta de Esgoto',
          fonte_fator: 'DEFRA Water Supply and Treatment (0,3440 kgCO₂e/m³ água + efluente)',
          fator_numerico: 0.344,
          unidade_fator: 'kg CO₂e/m³',
          subcategoria: 'Tratamento de Água e Efluentes Operacionais',
        },
      },
      {
        slug: 'nota-11-mdfe-consolidacao-cargas',
        tipo: 'nota_fiscal',
        titulo: 'Consolidação de Cargas (MDF-e Trilha Anti-Bicontagem)',
        numero_documento: '000.012.940',
        modelo_fiscal: '58_mdfe',
        categoria_operacional: 'frete',
        cnae: '4930-2/02',
        status_sefaz: 'OK (Autorizada SEFAZ-PR/SC)',
        tier_incerteza: 'Tier 3',
        incerteza_pct: 3.0,
        razao_social_parceiro: 'TRANSLOG BRASIL CONSOLIDADORA LTDA',
        cnpj: '08.992.341/0001-70',
        data_emissao: '25/07/2026',
        valor_brl: 0.0,
        quantidade_declarada: 'Percurso PR -> SC (Múltiplos CT-es Vinculados)',
        escopo_alvo: 'escopo_3',
        fossil_kg_co2e: 0.0,
        biogenico_kg_co2: 0.0,
        insetting_kg_co2e: 0.0,
        detalhes_json: {
          discriminacao:
            'MDF-e Modelo 58 - Documento Fiscal de Rastreabilidade e Auditoria de Percurso Rodoviário',
          fonte_fator:
            'Trilha Probatória dMRV: documento não gera passivo direto para evitar bicontagem',
          fator_numerico: 0.0,
          unidade_fator: 'kg CO₂e/doc',
          subcategoria: 'Auditoria de Trânsito Rodoviário e Custódia de Carga',
        },
      },
      {
        slug: 'nota-12-claro-nfcom-telecom',
        tipo: 'nota_fiscal',
        titulo: 'Telecomunicações & Nuvem (NFCom Modelo 62)',
        numero_documento: '000.892.401',
        modelo_fiscal: '62_nfcom',
        categoria_operacional: 'instalacoes',
        cnae: '6110-8/03',
        status_sefaz: 'OK (Autorizada SEFAZ-SP)',
        tier_incerteza: 'Tier 2',
        incerteza_pct: 10.0,
        razao_social_parceiro: 'CLARO BRASIL S.A. TELECOMUNICAÇÕES',
        cnpj: '40.432.544/0001-47',
        data_emissao: '10/07/2026',
        valor_brl: 2400.0,
        quantidade_declarada: 'Link Dedicado 1 Gbps Fibra',
        escopo_alvo: 'escopo_3',
        fossil_kg_co2e: 28.8,
        biogenico_kg_co2: 0.0,
        insetting_kg_co2e: 0.0,
        detalhes_json: {
          discriminacao:
            'NFCom Modelo 62 - Conectividade de Fibra Óptica e Telecomunicações Corporativas',
          fonte_fator: 'EPA Climate Leaders / DEFRA Telecom (0,0120 kgCO₂e por R$ serviço telecom)',
          fator_numerico: 0.012,
          unidade_fator: 'kg CO₂e/R$',
          subcategoria: 'Serviços de Telecomunicação Corporativa e Nuvem',
        },
      },
    ]

    for (const n of notasDemo) {
      try {
        app.findFirstRecordByData('corporativo_demo', 'slug', n.slug)
      } catch (_) {
        const record = new Record(demoCol)
        record.set('slug', n.slug)
        record.set('tipo', n.tipo)
        record.set('titulo', n.titulo)
        record.set('numero_documento', n.numero_documento)
        record.set('modelo_fiscal', n.modelo_fiscal)
        record.set('categoria_operacional', n.categoria_operacional)
        record.set('cnae', n.cnae)
        record.set('status_sefaz', n.status_sefaz)
        record.set('tier_incerteza', n.tier_incerteza)
        record.set('incerteza_pct', n.incerteza_pct)
        record.set('razao_social_parceiro', n.razao_social_parceiro)
        record.set('cnpj', n.cnpj)
        record.set('data_emissao', n.data_emissao)
        record.set('valor_brl', n.valor_brl)
        record.set('quantidade_declarada', n.quantidade_declarada)
        record.set('escopo_alvo', n.escopo_alvo)
        record.set('fossil_kg_co2e', n.fossil_kg_co2e)
        record.set('biogenico_kg_co2', n.biogenico_kg_co2)
        record.set('insetting_kg_co2e', n.insetting_kg_co2e)
        record.set('detalhes_json', n.detalhes_json)
        app.save(record)
      }
    }
  },
  (app) => {
    try {
      const demoCol = app.findCollectionByNameOrId('corporativo_demo')
      app.delete(demoCol)
    } catch (_) {}
  },
)
