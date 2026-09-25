/**
 * CATÁLOGO COMPLETO DOS 15 PROTOCOLOS SETORIAIS — ORBIS PROTOCOL
 *
 * Cada protocolo possui:
 * - Identificador único (slug)
 * - Nome e ícone
 * - Descrição técnica aprofundada
 * - Enquadramento Legal específico (normas, abrangência, datas-chave)
 * - Evidências de Captura exigidas (documentação comprobatória fiscal/operacional)
 * - Resultado Pericial Esperado (entregas no laudo dMRV, intensidades, créditos)
 * - Fatores de Emissão Peculiares (IPCC, GLEC, MCTI, metodologias setoriais)
 * - Indicadores e tipo de laudo pericial oficial
 */

export interface NormaSetorial {
  norma: string
  titulo: string
  abrangencia:
    | 'Obrigatório'
    | 'Voluntário'
    | 'Cadeia de Valor (Escopo 3)'
    | 'Comércio Exterior'
    | 'Previsto'
    | 'Setorial'
  dataChave: string
  detalhe: string
}

export interface FatorEmissaoPeculiar {
  parametro: string
  fator: string
  unidade: string
  fonte: string
  observacao: string
}

export interface ProtocoloSetorial {
  id: string
  slug: string
  nome: string
  icone: string
  tagline: string
  descricao: string
  regulamentacao: string
  fatorEmissao: string
  principaisIndicadores: string[]
  tipoLaudo: string
  // Aprofundamento pericial:
  enquadramentoLegal: NormaSetorial[]
  evidenciasCaptura: {
    categoria: string
    documentos: string[]
    obrigatorio: boolean
  }[]
  resultadoPericial: {
    entregas: string[]
    tco2ePorUnidade: string
    elegibilidadeLinhasVerdes: string[]
    beneficiosTributarios: string[]
  }
  fatoresPeculiares: FatorEmissaoPeculiar[]
}

export const PROTOCOLOS_SETORIAIS: Record<string, ProtocoloSetorial> = {
  agro: {
    id: 'agro',
    slug: 'agro',
    nome: 'Agronegócio & Grãos',
    icone: 'Sprout',
    tagline: 'Rastreabilidade antidesmatamento, balanço de carbono no solo e metano entérico',
    fatorEmissao: 'Metano entérico, N2O fertilizantes e diesel agrícola',
    regulamentacao: 'EUDR (UE 2023/1115), Código Florestal / CAR, Plano ABC+, SBCE Lei 15.042/2024',
    descricao:
      'Protocolo pericial voltado a produtores de soja, milho, algodão e cooperativas agroindustriais. Monitoramento integrado de emissões biogênicas, remoções no solo, fertilizantes nitrogenados e conformidade antidesmatamento georreferenciada.',
    principaisIndicadores: [
      'tCO2e/ha por safra colhida',
      'Balanço de Carbono no Solo (Soil Organic Carbon)',
      'Emissões biogênicas vs fósseis',
      'Conformidade de poligonal CAR sem sobreposição',
    ],
    tipoLaudo: 'Laudo Pericial de Produção Sustentável & Aptidão Exportadora EUDR',
    enquadramentoLegal: [
      {
        norma: 'Regulamento (UE) 2023/1115 (EUDR)',
        titulo: 'Regulamento Antidesmatamento da União Europeia',
        abrangencia: 'Comércio Exterior',
        dataChave: '30/12/2025 (Grandes Contribuintes) / 30/06/2026 (MPEs)',
        detalhe:
          'Exige due diligence, polígonos de geolocalização e comprovação de ausência de desmatamento pós-31/12/2020 para soja, carne bovina, café, cacau, borracha e madeira.',
      },
      {
        norma: 'Lei Federal nº 12.651/2012',
        titulo: 'Código Florestal Brasileiro & Cadastro Ambiental Rural (CAR)',
        abrangencia: 'Obrigatório',
        dataChave: 'Vigente',
        detalhe:
          'Manutenção de Reserva Legal (20% a 80% dependendo do bioma) e Áreas de Preservação Permanente (APPs).',
      },
      {
        norma: 'Lei Federal nº 15.042/2024',
        titulo: 'Sistema Brasileiro de Comércio de Emissões (SBCE)',
        abrangencia: 'Voluntário',
        dataChave: '2025-2029 (Transição)',
        detalhe:
          'Produção primária agropecuária não submetida a limites compulsórios de emissão direta, mas elegível a geração de créditos de carbono no solo e insetting para indústrias alimentícias.',
      },
      {
        norma: 'Plano ABC+ (2020-2030)',
        titulo:
          'Plano Setorial para Adaptação à Mudança do Clima e Baixa Emissão de Carbono na Agropecuária',
        abrangencia: 'Voluntário',
        dataChave: 'Vigente até 2030',
        detalhe:
          'Diretrizes oficiais do MAPA para plantio direto, fixação biológica de nitrogênio e integração lavoura-pecuária-floresta (ILPF).',
      },
    ],
    evidenciasCaptura: [
      {
        categoria: 'Documentos Cadastrais e Fundiários',
        obrigatorio: true,
        documentos: [
          'Cadastro Ambiental Rural (CAR) ativo e validado no SICAR',
          'Certidão de Cadastro de Imóvel Rural (CCIR / INCRA)',
          'Polígonos georreferenciados da propriedade em formato KML/GeoJSON',
        ],
      },
      {
        categoria: 'Documentos Fiscais & Insumos',
        obrigatorio: true,
        documentos: [
          'NF-e de aquisição de fertilizantes químicos com teores N-P-K declarados',
          'NF-e de aquisição de diesel agrícola (S10/S500)',
          'NF-e de aquisição de defensivos e sementes certificadas',
          'NF-e de comercialização e escoamento da safra por talhão',
        ],
      },
      {
        categoria: 'Manejo & Laudos Técnicos',
        obrigatorio: false,
        documentos: [
          'Análises laboratoriais de carbono orgânico do solo (0-20cm e 20-40cm)',
          'Caderno de campo digital com datas de aplicação e dessecação',
          'Certificação RTRS, ProTerra ou Algodão Brasileiro Responsável (quando houver)',
        ],
      },
    ],
    resultadoPericial: {
      entregas: [
        'Inventário de emissões de Escopo 1 (diesel, fertilizantes N2O, calcário) e Escopo 2',
        'Balanço líquido de carbono por hectare (tCO2e/ha/ano)',
        'Declaração pericial de due diligence e rastreabilidade para atendimento ao EUDR',
        'Memorial de cálculo com fatores oficiais do IPCC Tier 2 / MAPA',
      ],
      tco2ePorUnidade: '0,45 a 1,10 tCO2e / tonelada de grão produzido (média safra nacional)',
      elegibilidadeLinhasVerdes: [
        'BNDES Agro Sustentável / Pronaf Bioeconomia',
        'Linha Sicredi Agro Cooperados Sustentabilidade (spread bonificado de até -1,8% a.a.)',
        'Banco do Brasil Pronampe Verde & Cédula de Produto Rural (CPR Verde)',
      ],
      beneficiosTributarios: [
        'Aproveitamento de crédito presumido de IBS/CBS na cadeia agroindustrial (LC 214/2025)',
        'Isenção de Imposto Seletivo sobre bens primários essenciais',
        'Geração de CPR-Verde registrável na B3',
      ],
    },
    fatoresPeculiares: [
      {
        parametro: 'Emissão de N2O por Fertilizante Nitrogenado Aplicado',
        fator: '0,01 kg N2O-N / kg N sintético (1%)',
        unidade: 'kg N2O / kg N',
        fonte: 'IPCC 2019 Refinement / MCTI Agro 2024',
        observacao:
          'Aplicável diretamente sobre a quantidade declarada de N presente nos adubos da NF-e.',
      },
      {
        parametro: 'Emissão por Calagem (Calcário Agrícola CaCO3)',
        fator: '0,12 tC / t CaCO3 (equivalente a 0,44 tCO2 / t calcário)',
        unidade: 'tCO2 / t calcário',
        fonte: 'IPCC Guidelines 2006 Vol 4',
        observacao: 'Liberação de CO2 durante a neutralização da acidez do solo.',
      },
      {
        parametro: 'Consumo de Óleo Diesel Agrícola em Tratores e Colheitadeiras',
        fator: '2,68 kg CO2e / litro (mistura comercial B14)',
        unidade: 'kg CO2e / litro',
        fonte: 'Orbis dMRV / MCTI 2024',
        observacao: 'Ponderado com 14% de biodiesel e 86% de diesel fóssil.',
      },
    ],
  },

  siderurgia: {
    id: 'siderurgia',
    slug: 'siderurgia',
    nome: 'Siderurgia & Aço Verde',
    icone: 'Flame',
    tagline:
      'Auditoria de altos-fornos, bio-redutores, sucata reciclada e declaração CBAM União Europeia',
    fatorEmissao: 'Coque de carvão mineral, bio-redutores e energia elétrica',
    regulamentacao: 'CBAM (Regulamento UE 2023/956), SBCE Lei 15.042/2024, ISO 14064-1',
    descricao:
      'Protocolo desenhado para aciarias integradas, semi-integradas e laminadores. Apuração de emissões incorporadas diretas e indiretas para atender aduanas europeias do CBAM e limites obrigatórios do SBCE no Brasil.',
    principaisIndicadores: [
      'tCO2e / tonelada de aço bruto (acabado ou semi-acabado)',
      'Percentual de sucata ferrosa reciclada utilizada',
      'Taxa de substituição de coque fóssil por carvão vegetal renovável',
      'Intensidade carbônica CBAM específica por código CN (NCM)',
    ],
    tipoLaudo: 'Declaração Probatória de Emissões Incorporadas CBAM & Conformidade SBCE',
    enquadramentoLegal: [
      {
        norma: 'Regulamento (UE) 2023/956 (CBAM)',
        titulo: 'Mecanismo de Ajuste Fronteiriço de Carbono da União Europeia',
        abrangencia: 'Comércio Exterior',
        dataChave: '01/01/2026 (Início da cobrança financeira de certificados CBAM)',
        detalhe:
          'Exportadores de ferro e aço para a UE devem fornecer declaração de emissões diretas (Escopo 1) e indiretas de eletricidade (Escopo 2) sob metodologia específica da Comissão Europeia.',
      },
      {
        norma: 'Lei Federal nº 15.042/2024',
        titulo: 'Marco Legal do SBCE (Mercado Regulado Brasileiro)',
        abrangencia: 'Obrigatório',
        dataChave: '2026-2029',
        detalhe:
          'Siderúrgicas com emissões > 25.000 tCO2e/ano estão sob regime compulsório de cota e plano de monitoramento dMRV anual com asseguração independente.',
      },
      {
        norma: 'ABNT NBR ISO 14064-1:2020',
        titulo: 'Inventários de Gases de Efeito Estufa no Nível Organizacional',
        abrangencia: 'Obrigatório',
        dataChave: 'Vigente',
        detalhe:
          'Padrão metodológico para auditoria pericial e rastreamento de incerteza de medição.',
      },
    ],
    evidenciasCaptura: [
      {
        categoria: 'Documentos Fiscais de Redutores e Combustíveis',
        obrigatorio: true,
        documentos: [
          'NF-e de fornecimento de carvão vegetal (com DDOF/SINAFLOR) ou coque mineral',
          'Faturas de gás natural industrial e faturas elétricas de alta tensão (A1/A2)',
          'NF-e de entrada de sucata metálica (CFOPs de reciclagem)',
          'SPED EFD ICMS/IPI (Blocos C, H e K de produção industrial)',
        ],
      },
      {
        categoria: 'Balancete Operacional e Laboratorial',
        obrigatorio: true,
        documentos: [
          'Balanço de massa do alto-forno e aciaria (teor de carbono de entrada vs saída)',
          'Análises granulométricas e físico-químicas de carvão e minério de ferro',
          'Certificados de aferição e calibração de medidores de fluxo contínuo de gases',
        ],
      },
      {
        categoria: 'Certificações de Sustentabilidade',
        obrigatorio: false,
        documentos: [
          'Certificação FSC do maciço florestal para siderúrgicas a carvão vegetal',
          'Certificado de Aço Verde ResponsibleSteel (quando disponível)',
        ],
      },
    ],
    resultadoPericial: {
      entregas: [
        'Dossiê de emissões incorporadas no padrão oficial CBAM Communication Template',
        'Inventário de Escopos 1, 2 e 3 com memória detalhada de coque, calcário e eletrodos',
        'Atestado de abatimento por sucata reciclada e biomassa renovável',
        'Cálculo de Cotas Brasileiras de Emissão (CBE) estimadas para o SBCE',
      ],
      tco2ePorUnidade:
        '1,4 a 2,2 tCO2e / t de aço em rota coque fóssil; 0,3 a 0,7 tCO2e / t com bio-redutores e forno elétrico a arco (EAF)',
      elegibilidadeLinhasVerdes: [
        'BNDES Fundo Clima (Descarbonização Industrial)',
        'Financiamentos internacionais com spread bonificado para transição energética',
        'Debêntures verdes incentivadas (Lei 14.801/2024)',
      ],
      beneficiosTributarios: [
        'Redução ou eliminação do imposto de fronteira aduaneiro europeu (CBAM certificates)',
        'Mitigação do Imposto Seletivo sobre extração e queima de combustíveis fósseis (LC 214/2025)',
        'Crédito integral de IBS/CBS sobre aquisição de energia limpa e bioredutores',
      ],
    },
    fatoresPeculiares: [
      {
        parametro: 'Consumo de Coque Metalúrgico em Alto-Forno',
        fator: '3,10 tCO2 / t coque consumido',
        unidade: 'tCO2 / t insumo',
        fonte: 'IPCC Guidelines 2006 Vol 3 (Metal Industry)',
        observacao:
          'Fator primário de oxidação do carbono mineral no processo de redução do minério.',
      },
      {
        parametro: 'Descarbonatação de Fundentes (Calcário CaCO3 e Dolomita)',
        fator: '0,44 tCO2 / t calcário e 0,477 tCO2 / t dolomita',
        unidade: 'tCO2 / t fundente',
        fonte: 'IPCC 2006 / Aço Brasil',
        observacao: 'Emissão de processo na formação da escória metalúrgica.',
      },
      {
        parametro: 'Consumo de Eletrodos de Grafite em Forno Elétrico a Arco (EAF)',
        fator: '3,66 tCO2 / t eletrodo oxidado',
        unidade: 'tCO2 / t eletrodo',
        fonte: 'GHG Protocol Industrial Sector',
        observacao: 'Consumo do grafite na fusão da sucata reciclada.',
      },
    ],
  },

  cimento: {
    id: 'cimento',
    slug: 'cimento',
    nome: 'Cimento & Concreto',
    icone: 'Box',
    tagline: 'Coprocessamento de resíduos, fator clínquer/cimento e descarbonatação do calcário',
    fatorEmissao: 'Descarbonatação do calcário e combustão de clínquer',
    regulamentacao: 'Roadmap SNIC, CBAM UE, Resolução CONAMA 499/2020, SBCE Lei 15.042/2024',
    descricao:
      'Auditoria de fornos rotativos de cimento, moagens e concreteiras. Monitoramento da substituição térmica por biomassa e CDR, cálculo do fator clínquer/cimento e comprovação de coprocessamento com emissão pericial probatória.',
    principaisIndicadores: [
      'kg CO2 / tonelada de cimento comercializado',
      'Fator Clínquer / Cimento (%)',
      'Taxa de Substituição Térmica no Forno (%)',
      'Volume de resíduos coprocessados em substituição a combustíveis fósseis',
    ],
    tipoLaudo: 'Laudo Pericial de Coprocessamento & Eficiência de Clínquer',
    enquadramentoLegal: [
      {
        norma: 'Resolução CONAMA nº 499/2020',
        titulo: 'Diretrizes e Critérios para Coprocessamento de Resíduos em Fornos de Cimento',
        abrangencia: 'Obrigatório',
        dataChave: 'Vigente',
        detalhe:
          'Regula o uso de Combustíveis Derivados de Resíduos (CDR), biomassa e pneus inservíveis em substituição ao coque de petróleo.',
      },
      {
        norma: 'Regulamento (UE) 2023/956 (CBAM)',
        titulo: 'CBAM para Cimento e Clínquer Exportado',
        abrangencia: 'Comércio Exterior',
        dataChave: '01/01/2026',
        detalhe:
          'Incide diretamente sobre importações de cimento hidráulico e clínquer na União Europeia.',
      },
      {
        norma: 'Lei Federal nº 15.042/2024',
        titulo: 'SBCE para Fábricas de Cimento',
        abrangencia: 'Obrigatório',
        dataChave: '2026-2029',
        detalhe:
          'Indústria cimenteira sujeita ao teto de 25.000 tCO2e/ano, exigindo inventário auditado por perito registrado.',
      },
    ],
    evidenciasCaptura: [
      {
        categoria: 'Documentos Fiscais & Rastreio de Insumos',
        obrigatorio: true,
        documentos: [
          'NF-e e Manifesto de Transporte de Resíduos (MTR / SINIR) de resíduos para coprocessamento',
          'Faturas fiscais de coque de petróleo importado e nacional',
          'SPED EFD ICMS/IPI com apuração do volume de clínquer produzido e cimento ensacado/granel',
        ],
      },
      {
        categoria: 'Dados Operacionais dos Fornos',
        obrigatorio: true,
        documentos: [
          'Relatório contínuo de emissões de chaminé (CEMS) para CO2, NOx e SOx',
          'Percentuais laboratoriais de teor de óxido de cálcio (CaO) e óxido de magnésio (MgO) no calcário',
          'Certificado de Destinação Final (CDF) emitido para os geradores de resíduos coprocessados',
        ],
      },
    ],
    resultadoPericial: {
      entregas: [
        'Atestado pericial de taxa de substituição térmica alcançada no ano-base',
        'Inventário de emissões de processo (calcinação) e de combustão',
        'Comprovação de redução de intensidade carbônica frente à média setorial nacional',
        'Dossiê de emissão de créditos de logística reversa e economia circular',
      ],
      tco2ePorUnidade:
        '540 a 620 kg CO2 / t de cimento no Brasil (referência SNIC, entre as menores do mundo)',
      elegibilidadeLinhasVerdes: [
        'BNDES Finem Meio Ambiente & Fundo Clima',
        'Linhas de Financiamento Verde para Adaptação Industrial (Banco do Brasil / Caixa)',
      ],
      beneficiosTributarios: [
        'Mitigação do Imposto Seletivo sobre combustíveis fósseis (coque de petróleo)',
        'Geração de créditos de reciclagem e logística reversa utilizáveis para dedução',
      ],
    },
    fatoresPeculiares: [
      {
        parametro: 'Descarbonatação do Clínquer de Cimento',
        fator: '0,525 tCO2 / t clínquer produzido',
        unidade: 'tCO2 / t clínquer',
        fonte: 'CSI / GCCA Cement CO2 Protocol & SNIC',
        observacao: 'Liberação direta do calcário por reação endotérmica a 1450°C.',
      },
      {
        parametro: 'Combustão de Coque de Petróleo (Petcoke)',
        fator: '3,24 tCO2 / t coque consumido (PCI ~34 GJ/t)',
        unidade: 'tCO2 / t insumo',
        fonte: 'IPCC 2006 Vol 2 (Stationary Combustion)',
        observacao: 'Combustível fóssil tradicional de queima em fornos rotativos.',
      },
    ],
  },

  energia: {
    id: 'energia',
    slug: 'energia',
    nome: 'Energia Renovável & Biogás',
    icone: 'Zap',
    tagline:
      'Garantias de Origem (I-REC), biometano, deslocamento de emissões, CBIOs, CGOB e ativos ambientais desvinculados',
    fatorEmissao: 'Fator médio da matriz do SIN / MCTI e deslocamento fóssil',
    regulamentacao:
      'I-REC Standard, RenovaBio (Lei 13.576/2017), Combustível do Futuro (Lei 14.993/2024), ProBioQAV (Decreto 13.094/2026), ANEEL Res. 1.059/2023, SBCE Lei 15.042/2024',
    descricao:
      'Protocolo para geradores solares, eólicos, PCHs, usinas de biogás/biometano, produtores de biocombustíveis e autoprodutores. Rastreabilidade de geração limpa, cálculo de emissões evitadas para consumidores industriais e auditoria de lastro documental para certificados ambientais. No setor de biocombustíveis e biometano, a trajetória regulatória brasileira consolidou uma arquitetura contínua de ativos ambientais: desde o pioneiro CBIO (2017, no RenovaBio), passando pelo CGOB (2026, Certificado de Garantia de Origem de Biometano no âmbito da Lei do Combustível do Futuro), até o CS-SAF (2026, no ProBioQAV via Decreto 13.094/2026 sob regime formal de book and claim). Esses três instrumentos compartilham a mesma arquitetura de atributos ambientais autônomos ou desvinculados da entrega física. Nesse ecossistema, a plataforma Orbis atua estritamente como infraestrutura dMRV de prova de integridade e rastreabilidade desses ativos — operando a prevenção pericial de dupla contagem e a custódia documental ponta a ponta dos insumos, sem emitir certificados, registrar títulos financeiros ou atuar como órgão emissor.',
    principaisIndicadores: [
      'MWh de energia renovável gerada e auditada',
      'tCO2e evitadas por deslocamento da matriz fóssil',
      'Volume de biometano purificado (m³) e lastro de CBIOs / CGOB',
      'Fator médio de emissão por MWh (Escopo 2 Escolha de Compra)',
      'Unicidade de lastro documental e prevenção de dupla contagem de atributos',
    ],
    tipoLaudo: 'Atestado de Descarbonização Energética de Escopo 2 & Origem Renovável',
    enquadramentoLegal: [
      {
        norma: 'Lei Federal nº 13.576/2017 (RenovaBio)',
        titulo: 'Política Nacional de Biocombustíveis & Créditos de Descarbonização (CBIOs)',
        abrangencia: 'Obrigatório',
        dataChave: 'Vigente com metas anuais ANP',
        detalhe:
          'Geração de CBIOs na B3 a partir da Nota de Eficiência Energético-Ambiental de biometano e etanol, inaugurando a arquitetura brasileira de ativos ambientais descarbonizantes.',
      },
      {
        norma: 'Lei Federal nº 14.993/2024 & Resoluções ANP',
        titulo: 'Combustível do Futuro & Certificado de Garantia de Origem de Biometano (CGOB)',
        abrangencia: 'Obrigatório',
        dataChave: 'Vigente / Implementação 2026',
        detalhe:
          'Programa de incentivo ao biometano e descarbonização do gás natural com emissão primária do CGOB por agentes certificadores credenciados, atestando a origem e a intensidade de carbono do biometano purificado.',
      },
      {
        norma: 'Decreto Federal nº 13.094/2026 & Lei 14.993/2024',
        titulo: 'ProBioQAV, CS-SAF e Regime Formal de Book and Claim',
        abrangencia: 'Obrigatório',
        dataChave: 'Vigente / Consulta ANAC 2026',
        detalhe:
          'Regulamentação do programa de SAF com criação do certificado CS-SAF sob regime de book and claim (ISO 22095-3:2026), separação do atributo ambiental, interoperabilidade CORSIA/SBCE e vedação expressa à dupla contagem com CBIOs.',
      },
      {
        norma: 'I-REC Standard / Instituto Totum',
        titulo: 'Certificados Internacionais de Energia Renovável (I-REC)',
        abrangencia: 'Voluntário',
        dataChave: 'Vigente',
        detalhe:
          'Atesta que 1 MWh de eletricidade foi gerado por fonte renovável e injetado na rede.',
      },
      {
        norma: 'Resolução Normativa ANEEL nº 1.059/2023',
        titulo: 'Marco Legal da Micro e Minigeração Distribuída (Lei 14.300/2022)',
        abrangencia: 'Obrigatório',
        dataChave: 'Vigente',
        detalhe: 'Regula conexão, compensação de créditos energéticos e transição tarifária de GD.',
      },
    ],
    evidenciasCaptura: [
      {
        categoria: 'Documentos Fiscais & Faturas Elétricas',
        obrigatorio: true,
        documentos: [
          'NF3e (Modelo 66) de injeção e fornecimento de energia elétrica',
          'Relatório de medição oficial da CCEE (Câmara de Comercialização de Energia Elétrica)',
          'Certificados digitais I-REC emitidos e com baixa/aposentadoria no registro oficial',
        ],
      },
      {
        categoria: 'Biometano & Combustíveis Verdes',
        obrigatorio: false,
        documentos: [
          'NF-e de biometano com especificação ANP de pureza e poder calorífico',
          'Certificado de Aposentadoria de CBIOs emitido pela B3 ou lastro documental de CGOB',
          'Laudo cromatográfico de teor de CH4 do biogás (> 95% para biometano)',
          'Documentação de cadeia de custódia e prova de não-duplicação de atributos ambientais',
        ],
      },
    ],
    resultadoPericial: {
      entregas: [
        'Atestado de emissão zero de Escopo 2 para clientes no método de Escolha de Compra (Market-Based)',
        'Cálculo de tCO2e evitadas para instrução de relatórios IFRS S2 e CDP',
        'Auditoria e rastreabilidade pericial de integridade e ausência de dupla contagem de certificados',
        'Dossiê de dMRV e cadeia de custódia documental para verificação independente',
      ],
      tco2ePorUnidade: '0,000 tCO2e/MWh (com I-REC) vs 0,085 tCO2e/MWh (fator médio SIN MCTI 2024)',
      elegibilidadeLinhasVerdes: [
        'BNDES Finame Energia Renovável',
        'Linha Sicredi / Sicoob Energia Solar com redução de taxa',
        'Fundo Constitucional FNO/FNE/FCO Verde',
      ],
      beneficiosTributarios: [
        'Não-incidência do Imposto Seletivo sobre fontes eólicas, solares e biometano',
        'Crédito financeiro de IBS e CBS sobre compra de energia elétrica corporativa',
      ],
    },
    fatoresPeculiares: [
      {
        parametro: 'Fator Médio do Sistema Interligado Nacional (SIN)',
        fator: '0,085 tCO2e / MWh (ano 2024)',
        unidade: 'tCO2e / MWh',
        fonte: 'MCTI / Sistema Interligado Nacional',
        observacao: 'Fator mensal e anual oficial para reporte de Escopo 2 no Brasil.',
      },
      {
        parametro: 'Deslocamento de Combustível Fóssil por Biometano',
        fator: '-2,68 kg CO2e / litro diesel equivalente',
        unidade: 'kg CO2e / Nm³',
        fonte: 'RenovaBio / ANP',
        observacao: 'Substituição direta do diesel em frotas pesadas.',
      },
    ],
  },

  quimica: {
    id: 'quimica',
    slug: 'quimica',
    nome: 'Indústria Química & Petroquímica',
    icone: 'FlaskConical',
    tagline:
      'Química verde, rotas de síntese, gás natural, resinas biológicas e Atuação Responsável',
    fatorEmissao: 'Consumo de gás natural, reações de craqueamento e nafta',
    regulamentacao:
      'Atuação Responsável (ABIQUIM), SBCE Lei 15.042/2024, CBAM UE (Adubos/Fertilizantes)',
    descricao:
      'Protocolo para polos cloroquímicos, petroquímicos, fabricantes de resinas, tintas e fertilizantes nitrogenados. Auditoria de processos térmicos, reações catalíticas e migração para matérias-primas de fonte renovável.',
    principaisIndicadores: [
      'tCO2e por tonelada de produto químico ou intermediário',
      'Consumo térmico específico (GJ/t)',
      'Eficiência atômica e balanço de carbono da reação',
      'Percentual de carbono renovável em intermediários químicos',
    ],
    tipoLaudo: 'Relatório Técnico Pericial de Intensidade Carbônica Industrial & SBCE',
    enquadramentoLegal: [
      {
        norma: 'Lei Federal nº 15.042/2024',
        titulo: 'SBCE para o Complexo Químico',
        abrangencia: 'Obrigatório',
        dataChave: '2026-2029',
        detalhe:
          'Grandes indústrias químicas com emissões acima de 25k tCO2e/ano submetidas a obrigações mandatórias.',
      },
      {
        norma: 'Regulamento CBAM (UE 2023/956) - Fertilizantes e Hidrogênio',
        titulo: 'CBAM para Insumos Químicos e Amônia',
        abrangencia: 'Comércio Exterior',
        dataChave: '01/01/2026',
        detalhe:
          'Exportações de fertilizantes nitrogenados, amônia e hidrogênio auditadas nas fronteiras da UE.',
      },
      {
        norma: 'Programa Atuação Responsável (Responsible Care - ABIQUIM)',
        titulo: 'Gestão de Segurança de Processos e Desempenho Ambiental',
        abrangencia: 'Voluntário',
        dataChave: 'Vigente',
        detalhe: 'Diretrizes internacionais da ICCA para redução de acidentes e pegada carbônica.',
      },
    ],
    evidenciasCaptura: [
      {
        categoria: 'Documentos Fiscais de Combustíveis e Matérias-Primas',
        obrigatorio: true,
        documentos: [
          'Faturas e NF-e de gás natural encanado (m³ e poder calorífico superior)',
          'NF-e de matérias-primas fósseis (nafta petroquímica, benzeno, tolueno)',
          'NF-e de insumos biológicos (etanol para bio-polietileno, glicerina loira)',
        ],
      },
      {
        categoria: 'Controles de Emissão Fugitiva e Chaminés',
        obrigatorio: true,
        documentos: [
          'Relatório LDAR (Leak Detection and Repair) de compostos orgânicos voláteis (COVs)',
          'Dados de queima contínua em tochas e flares de emergência',
        ],
      },
    ],
    resultadoPericial: {
      entregas: [
        'Inventário de emissões de processo químico direto e térmico',
        'Separação pericial entre carbono fóssil e biogênico nos produtos finais',
        'Dossiê preparatório para alocação de Cotas Brasileiras de Emissão (CBE)',
      ],
      tco2ePorUnidade: '1,2 a 3,5 tCO2e / tonelada dependendo da rota de síntese química',
      elegibilidadeLinhasVerdes: [
        'BNDES Fundo Clima — Descarbonização e Eficiência Industrial',
        'Linhas de Financiamento de Química Verde e Bioeconomia',
      ],
      beneficiosTributarios: [
        'Mitigação do Imposto Seletivo sobre insumos minerais e combustíveis (LC 214/2025)',
        'Crédito integral de IBS/CBS sobre aquisição de gás natural e biomassa',
      ],
    },
    fatoresPeculiares: [
      {
        parametro: 'Combustão de Gás Natural Industrial',
        fator: '2,02 kg CO2 / m³ consumido',
        unidade: 'kg CO2 / m³',
        fonte: 'MCTI / IPCC 2006 Vol 2',
        observacao: 'Fator ajustado para gás natural canalizado nacional.',
      },
      {
        parametro: 'Síntese de Amônia (Haber-Bosch com Reforma a Vapor de Gás Natural)',
        fator: '1,6 a 2,1 tCO2 / t NH3 produzida',
        unidade: 'tCO2 / t produto',
        fonte: 'IPCC 2006 Vol 3 (Ammonia Production)',
        observacao: 'Emissão estequiométrica inevitável na reforma a vapor fóssil.',
      },
    ],
  },

  logistica: {
    id: 'logistica',
    slug: 'logistica',
    nome: 'Logística & Transporte de Cargas',
    icone: 'Truck',
    tagline:
      'Diretrizes GLEC Framework, telemetria fiscal CT-e/MDF-e e descarbonização de frotas rodoviárias',
    fatorEmissao: 'Óleo diesel S10/S500, Biodiesel B14 e combustível marítimo',
    regulamentacao:
      'GLEC Framework v3.0, ISO 14083:2023, Programa Despoluir (CNT), SBCE Lei 15.042/2024',
    descricao:
      'Protocolo para transportadoras rodoviárias de carga, operadores logísticos, navegação de cabotagem e ferrovias. Ingestão automatizada de CT-e e MDF-e para apuração de emissões por tonelada-quilômetro (tkm) e comprovação de Escopo 3.',
    principaisIndicadores: [
      'g CO2e por Tonelada-Quilômetro Útil (tkm / TKU)',
      'Consumo específico de diesel (km/l e l/100tkm)',
      'Percentual de biocombustíveis e eletrificação da frota',
      'Taxa de retorno vazio (Empty Running Rate %)',
    ],
    tipoLaudo: 'Laudo Pericial de Logística de Baixo Carbono & Escopo 3 Corporativo',
    enquadramentoLegal: [
      {
        norma: 'ISO 14083:2023',
        titulo: 'Quantificação e Reporte de Emissões de GEE em Cadeias de Transporte',
        abrangencia: 'Obrigatório',
        dataChave: 'Vigente',
        detalhe:
          'Primeira norma internacional unificada que substitui a EN 16258, baseada nas diretrizes do GLEC Framework.',
      },
      {
        norma: 'Global Logistics Emissions Council (GLEC Framework v3.0)',
        titulo: 'Metodologia Padrão de Cálculo de Emissões Logísticas',
        abrangencia: 'Voluntário',
        dataChave: 'Vigente',
        detalhe:
          'Exigida por multinacionais para reporte de Escopo 3 (transporte upstream e downstream).',
      },
      {
        norma: 'Programa Despoluir (CNT / SEST SENAT)',
        titulo: 'Programa Ambiental do Transporte de Cargas',
        abrangencia: 'Voluntário',
        dataChave: 'Vigente',
        detalhe:
          'Aferição de opacidade de fumaça preta em veículos diesel para otimização de queima.',
      },
    ],
    evidenciasCaptura: [
      {
        categoria: 'Documentos Fiscais de Transporte & Combustível',
        obrigatorio: true,
        documentos: [
          'Conhecimentos de Transporte Eletrônico (CT-e modelo 57) e MDF-e (modelo 58)',
          'NF-e de abastecimento de combustíveis (diesel S10, biodiesel, gás natural veicular ou biometano)',
          'Dados de telemetria veicular (odômetro, consumo por viagem e peso carregado)',
        ],
      },
      {
        categoria: 'Controle de Manutenção da Frota',
        obrigatorio: false,
        documentos: [
          'Laudos periódicos de ensaio de opacidade (teste de fumaça preta)',
          'Relatório de gestão de pneus (recapagem / recapabilidade)',
        ],
      },
    ],
    resultadoPericial: {
      entregas: [
        'Atestado de emissão por viagem e por cliente para declaração de Escopo 3 B2B',
        'Aferição do índice g CO2e/tkm por rota e modalidade (rodoviário/ferroviário)',
        'Plano técnico de substituição gradual de combustíveis e telemetria',
      ],
      tco2ePorUnidade:
        '62 a 120 g CO2e / tkm para caminhões pesados rodoviários; 18 a 35 g CO2e / tkm para ferrovia/cabotagem',
      elegibilidadeLinhasVerdes: [
        'BNDES Fundo Clima (Mobilidade Urbana e Logística Verde)',
        'Linhas de Financiamento para Caminhões Elétricos e a Gás (Banco do Brasil / BV / Itaú BBA)',
      ],
      beneficiosTributarios: [
        'Aproveitamento integral de créditos de IBS e CBS sobre diesel e pedágios (LC 214/2025)',
        'Isenção ou mitigação de IPVA verde em estados federados para frotas limpas',
      ],
    },
    fatoresPeculiares: [
      {
        parametro: 'Fator Diesel Comercial B14 Rodoviário (Well-to-Wheel)',
        fator: '2,68 kg CO2e / litro fóssil + 0,42 kg CO2 biogênico',
        unidade: 'kg CO2e / litro',
        fonte: 'MCTI / IPCC 2006 / ANP 2024',
        observacao:
          'Fator consolidado para diesel S10 com 14% de mistura obrigatória de biodiesel.',
      },
      {
        parametro: 'Fator GLEC Rodoviário Padrão Brasil (Caminhão Articulado 40t)',
        fator: '75 g CO2e / tkm',
        unidade: 'g CO2e / tkm',
        fonte: 'GLEC Framework v3.0 / Smart Freight Centre',
        observacao: 'Média de ocupação típica do agronegócio e bens de consumo no Brasil.',
      },
    ],
  },

  textil: {
    id: 'textil',
    slug: 'textil',
    nome: 'Têxtil, Confecção & Calçados',
    icone: 'Scissors',
    tagline:
      'Rastreabilidade do algodão, efluentes de tingimento, caldeiras de biomassa e logística reversa de tecidos',
    fatorEmissao: 'Tingimento, caldeiras a biomassa e matérias sintéticas',
    regulamentacao: 'ABVTEX, Selo ABR (Algodão Brasileiro Responsável), Resoluções CONAMA, PNRS',
    descricao:
      'Protocolo para fiações, tecelagens, malharias, tinturarias e confecções. Rastreabilidade da matéria-prima (algodão responsável e poliéster reciclado), auditoria de caldeiras a vapor e conformidade socioambiental de fornecedores.',
    principaisIndicadores: [
      'Litros de água por kg de tecido beneficiado',
      'Percentual de fibras recicladas ou certificadas (ABR / BCI)',
      'kg CO2e por metro de tecido ou peça acabada',
      'Taxa de valorização de aparas e resíduos têxteis',
    ],
    tipoLaudo: 'Atestado de Rastreabilidade de Cadeia Têxtil, Hídrica & Carbono',
    enquadramentoLegal: [
      {
        norma: 'Programa ABVTEX',
        titulo: 'Programa de Qualificação de Fornecedores para o Varejo Têxtil',
        abrangencia: 'Obrigatório',
        dataChave: 'Vigente',
        detalhe:
          'Exigido pelas maiores redes varejistas do país para homologação de fornecedores e subcontratados.',
      },
      {
        norma: 'Programa Algodão Brasileiro Responsável (ABR / ABRAPA)',
        titulo: 'Certificação de Sustentabilidade da Fibra de Algodão',
        abrangencia: 'Voluntário',
        dataChave: 'Vigente',
        detalhe: 'Benchmark internacional alinhado ao Better Cotton Initiative (BCI).',
      },
      {
        norma: 'Lei Federal nº 12.305/2010 (PNRS)',
        titulo: 'Logística Reversa de Resíduos Têxteis e Embalagens Pós-Consumo',
        abrangencia: 'Obrigatório',
        dataChave: 'Vigente',
        detalhe: 'Destinação ambientalmente adequada de sobras de confecção e embalagens.',
      },
    ],
    evidenciasCaptura: [
      {
        categoria: 'Documentos Fiscais de Fibras e Biomassa',
        obrigatorio: true,
        documentos: [
          'NF-e de compra de pluma ou fio de algodão com certificação ABR indicada',
          'NF-e de compra de biomassa/lenha (com DOF florestal) ou gás para caldeiras',
          'NF-e de aquisição de corantes e produtos químicos auxiliares',
        ],
      },
      {
        categoria: 'Monitoramento Hídrico e Efluentes',
        obrigatorio: true,
        documentos: [
          'Outorga de captação e laudo de descarte de efluente tratado na ETE',
          'Faturas de água industrial e energia elétrica',
        ],
      },
    ],
    resultadoPericial: {
      entregas: [
        'Atestado de rastreabilidade completa do fio à peça pronta',
        'Inventário de emissões de Escopos 1 e 2 com foco em vapor de processo',
        'Declaração de conformidade para atendimento a redes varejistas (Renner, Riachuelo, C&A, Zara)',
      ],
      tco2ePorUnidade: '2,5 a 6,0 kg CO2e / kg de tecido beneficiado e tingido',
      elegibilidadeLinhasVerdes: [
        'Linhas de Financiamento para Modernização de Teares e Caldeiras (BNDES)',
        'Crédito com taxa reduzida para empresas com certificação ABVTEX Ouro',
      ],
      beneficiosTributarios: [
        'Crédito integral de IBS/CBS sobre aquisições de insumos têxteis e energia',
        'Geração de créditos de reciclagem e descarte zero de aterro',
      ],
    },
    fatoresPeculiares: [
      {
        parametro: 'Queima de Cavaco de Madeira em Caldeiras Têxteis',
        fator: '0,00 tCO2 fóssil / t + 1,75 tCO2 biogênico / t',
        unidade: 'tCO2 / t cavaco',
        fonte: 'GHG Protocol Brasil / IPCC 2006',
        observacao: 'Emissão neutra de carbono fóssil; reportada estritamente no escopo biogênico.',
      },
    ],
  },

  mineracao: {
    id: 'mineracao',
    slug: 'mineracao',
    nome: 'Mineração & Minerais Críticos',
    icone: 'Pickaxe',
    tagline:
      'Lavra a céu aberto, eletrificação de equipamentos pesados, lítio, bauxita, ferro e normas ANM',
    fatorEmissao: 'Frota pesada de lavra aberta, britagem e explosivos',
    regulamentacao:
      'Normas ANM, Padrões IRMA, SBCE Lei 15.042/2024, CBAM UE (Minérios de Ferro/Alumínio)',
    descricao:
      'Protocolo para mineração de ferro, bauxita, cobre, níquel, lítio e terras raras. Auditoria de queima de óleo diesel em caminhões fora-de-estrada, consumo eletrointensivo de britagem/moagem e estabilidade de barragens de rejeitos.',
    principaisIndicadores: [
      'tCO2e por tonelada de ROM (Run of Mine) lavrado',
      'tCO2e por tonelada de concentrado mineral produzido',
      'Consumo específico de diesel (litros / t ROM)',
      'Consumo elétrico na cominuição (kWh / t)',
    ],
    tipoLaudo: 'Laudo Pericial de Sustentabilidade Operacional da Lavra & Minerais Críticos',
    enquadramentoLegal: [
      {
        norma: 'Lei Federal nº 15.042/2024',
        titulo: 'SBCE para Grandes Empreendimentos Minerários',
        abrangencia: 'Obrigatório',
        dataChave: '2026-2029',
        detalhe:
          'Empresas de mineração com emissões acima de 25.000 tCO2e/ano submetidas a obrigações mandatórias.',
      },
      {
        norma: 'Normas Reguladoras de Mineração (NRM / ANM)',
        titulo: 'Conformidade da Agência Nacional de Mineração',
        abrangencia: 'Obrigatório',
        dataChave: 'Vigente',
        detalhe: 'Plano de Aproveitamento Econômico (PAE) e Plano de Fechamento de Mina (PAF).',
      },
      {
        norma: 'Padrão IRMA (Initiative for Responsible Mining Assurance)',
        titulo: 'Norma Internacional de Mineração Responsável',
        abrangencia: 'Voluntário',
        dataChave: 'Vigente',
        detalhe:
          'Exigência global de fabricantes de veículos elétricos e eletrônicos para lítio, níquel e cobre.',
      },
    ],
    evidenciasCaptura: [
      {
        categoria: 'Documentos Fiscais de Combustíveis & Explosivos',
        obrigatorio: true,
        documentos: [
          'NF-e de fornecimento de diesel a granel para frota fora-de-estrada',
          'NF-e de nitrato de amônio e emulsões explosivas',
          'Faturas de alta tensão (A1/A2) da usina de beneficiamento',
        ],
      },
      {
        categoria: 'Licenciamento & Georreferenciamento',
        obrigatorio: true,
        documentos: [
          'Portaria de Lavra emitida pelo MME/ANM',
          'Licença de Operação (LO) ambiental vigente e declaração de estabilidade de barragens',
        ],
      },
    ],
    resultadoPericial: {
      entregas: [
        'Inventário de emissões de Escopo 1 de frota de lavra e Escopo 2 de beneficiamento',
        'Dossiê de minerais críticos para cadeias globais de transição energética (EUA / UE)',
        'Mapeamento de rotas de eletrificação e redução de consumo de diesel',
      ],
      tco2ePorUnidade:
        '6 a 18 kg CO2e / t ROM lavrado (minério de ferro); 20 a 50 kg CO2e / t para bauxita',
      elegibilidadeLinhasVerdes: [
        'BNDES Fundo Clima para Transição Energética em Mineração',
        'Linhas de Financiamento Internacional para Minerais Estratégicos',
      ],
      beneficiosTributarios: [
        'Adequação preventiva à alíquota de Imposto Seletivo sobre extração de bens minerais (LC 214/2025)',
        'Crédito de IBS/CBS sobre diesel e máquinas pesadas',
      ],
    },
    fatoresPeculiares: [
      {
        parametro: 'Detonação de Emulsões Explosivas (Nitrato de Amônio)',
        fator: '0,18 tCO2e / t explosivo detonado',
        unidade: 'tCO2e / t',
        fonte: 'ANFO / IPCC 2006',
        observacao: 'Emissão direta durante a fragmentação da rocha.',
      },
    ],
  },

  automotiva: {
    id: 'automotiva',
    slug: 'automotiva',
    nome: 'Indústria Automotiva, Autopeças & CDVs',
    icone: 'Car',
    tagline:
      'Programa MOVER (Lei 14.902/2024), Passaporte Digital de Produto (DPP), Detran e créditos de IPI',
    fatorEmissao: 'Estamparia, pintura robotizada, soldagem e peças reaproveitadas',
    regulamentacao:
      'Programa MOVER (Lei 14.902/2024), Lei 12.977/2014 (Desmonte), Portarias DETRAN',
    descricao:
      'Protocolo exclusivo para montadoras, fabricantes de autopeças e Centrais de Desmontagem Veicular credenciadas (CDV). Emissão do Passaporte Digital de Peça Automotiva (DPP) com QR Code inviolável, cálculo de emissões evitadas e lastro probatório para abatimento de IPI.',
    principaisIndicadores: [
      'Índice de Reciclabilidade Veicular (%)',
      'Passaportes Digitais de Peças (DPP) homologados',
      'kg CO2e evitado por peça automotiva reutilizada',
      'Créditos fiscais de IPI gerados no Programa MOVER',
    ],
    tipoLaudo: 'Dossiê Técnico Probatório MOVER / IPI & Passaporte Digital de Peça (DPP)',
    enquadramentoLegal: [
      {
        norma: 'Lei Federal nº 14.902/2024 (Programa MOVER)',
        titulo: 'Programa Mobilidade Verde e Inovação',
        abrangencia: 'Obrigatório',
        dataChave: 'Em vigor com diretrizes até 2028',
        detalhe:
          'Concede créditos financeiros de IPI proporcionais à reciclabilidade de materiais e descarbonização do berço ao túmulo.',
      },
      {
        norma: 'Lei Federal nº 12.977/2014 (Lei do Desmanche)',
        titulo: 'Regulamentação da Atividade de Desmontagem de Veículos',
        abrangencia: 'Obrigatório',
        dataChave: 'Vigente',
        detalhe:
          'Exige credenciamento perante o DETRAN, baixa definitiva do veículo e rastreabilidade de peças.',
      },
      {
        norma: 'LC 214/2025 (Reforma Tributária & Peças Verdes)',
        titulo: 'Desoneração Protetiva de Peças Usadas de CDVs',
        abrangencia: 'Obrigatório',
        dataChave: '01/01/2027',
        detalhe:
          'Peças recicladas de desmontagem legal gozam de desoneração de Imposto Seletivo e créditos de IBS/CBS.',
      },
    ],
    evidenciasCaptura: [
      {
        categoria: 'Documentos de Entrada do Veículo Fim de Vida (VFV)',
        obrigatorio: true,
        documentos: [
          'Certidão de Baixa Definitiva do DETRAN',
          'Nota fiscal de leilão ou termo de destinação de seguradora parceira',
          'Laudo fotográfico de entrada com chassi e motor conferidos',
        ],
      },
      {
        categoria: 'Rastreabilidade de Peças e Vendas',
        obrigatorio: true,
        documentos: [
          'Passaporte Digital de Peça (DPP) gerado no padrão Orbis dMRV com QR Code',
          'NF-e de saída da peça reutilizada com destaque do número do selo DPP',
          'ART/RRT do Responsável Técnico do CDV (Engenheiro Mecânico CREA)',
        ],
      },
    ],
    resultadoPericial: {
      entregas: [
        'Dossiê com registro de integridade de peças verdes e emissões evitadas',
        'Atestado de circularidade para montadoras comprovarem metas de conteúdo reciclado no MOVER',
        'Etiquetas de impressão com QR Code do Passaporte Digital para gôndolas e e-commerce',
      ],
      tco2ePorUnidade:
        'Evitação de 10 a 180 kg CO2e por peça reaproveitada (frente à produção virgem)',
      elegibilidadeLinhasVerdes: [
        'Linha de Financiamento para Modernização de CDVs e Frotas Verdes (BNDES)',
        'Spread reduzido para revendas e oficinas que compram peças verdes rastreadas',
      ],
      beneficiosTributarios: [
        'Crédito financeiro direto de IPI no âmbito do Programa MOVER para fabricantes',
        'Desoneração total de Imposto Seletivo na comercialização de peças de reúso',
      ],
    },
    fatoresPeculiares: [
      {
        parametro: 'Insetting ISO 14067: Peça de Aço Reutilizada',
        fator: '-2,45 kg CO2e / kg de aço evitado',
        unidade: 'kg CO2e / kg',
        fonte: 'Orbis dMRV / ISO 14067 / WorldSteel',
        observacao: 'Substituição de matéria-prima siderúrgica virgem.',
      },
      {
        parametro: 'Insetting ISO 14067: Peça de Alumínio Reutilizada',
        fator: '-8,90 kg CO2e / kg de alumínio evitado',
        unidade: 'kg CO2e / kg',
        fonte: 'International Aluminium Institute / Orbis dMRV',
        observacao: 'Evita a produção primária eletrointensiva de bauxita/alumínio.',
      },
    ],
  },

  alimentos: {
    id: 'alimentos',
    slug: 'alimentos',
    nome: 'Alimentos & Bebidas',
    icone: 'UtensilsCrossed',
    tagline:
      'Frigoríficos, laticínios, cervejarias, gases refrigerantes fluorados e embalagens pós-consumo',
    fatorEmissao: 'Refrigeração industrial (gases fluorados) e caldeiras',
    regulamentacao: 'SIF / MAPA, ISO 22000, Protocolo de Montreal, PNRS (Logística Reversa)',
    descricao:
      'Protocolo para indústrias de alimentos processados, bebidas, laticínios e frigoríficos. Rastreabilidade de vazamentos de fluidos refrigerantes em túneis de congelamento, caldeiras a vapor, efluentes e embalagens.',
    principaisIndicadores: [
      'kg CO2e por lote produzido / hectolitro de bebida',
      'Taxa anual de fuga de gases refrigerantes (R404A, R134a, Amônia)',
      'Eficiência energética térmica de caldeiras a vapor',
      'Percentual de embalagens recicladas na logística reversa',
    ],
    tipoLaudo: 'Certificado de Conformidade Sanitário-Ambiental & Pegada de Produto',
    enquadramentoLegal: [
      {
        norma: 'Decreto Federal nº 11.413/2023',
        titulo: 'Certificados de Crédito de Reciclagem de Embalagens em Geral',
        abrangencia: 'Obrigatório',
        dataChave: 'Vigente',
        detalhe:
          'Fabricantes de alimentos e bebidas devem comprovar a logística reversa de no mínimo 22% a 30% das embalagens colocadas no mercado.',
      },
      {
        norma: 'Emenda de Kigali ao Protocolo de Montreal (Decreto 11.666/2023)',
        titulo: 'Controle e Eliminação Gradual de HFCs Fluorados',
        abrangencia: 'Obrigatório',
        dataChave: 'Cronograma 2024-2045',
        detalhe:
          'Redução progressiva de fluidos refrigerantes de alto Potencial de Aquecimento Global (GWP).',
      },
    ],
    evidenciasCaptura: [
      {
        categoria: 'Documentos Fiscais de Fluidos e Combustíveis',
        obrigatorio: true,
        documentos: [
          'NF-e de reposição de gases refrigerantes para sistemas de refrigeração',
          'NF-e de biomassa, cavaco ou gás natural para caldeiras industriais',
          'Faturas elétricas de média/alta tensão para câmaras frigoríficas',
        ],
      },
      {
        categoria: 'Logística Reversa & Embalagens',
        obrigatorio: true,
        documentos: [
          'Notas fiscais de aquisição de Certificados de Crédito de Reciclagem (CCRR / RECICLA+)',
          'Relatório de balanço de massa de materiais de embalagem (vidro, papel, plástico, alumínio)',
        ],
      },
    ],
    resultadoPericial: {
      entregas: [
        'Inventário de emissões fugitivas de Escopo 1 com conversão IPCC AR6',
        'Balanço de logística reversa de embalagens e conformidade PNRS',
        'Dossiê de pegada de carbono para atender redes supermercadistas (GPA, Carrefour, Assaí)',
      ],
      tco2ePorUnidade:
        '0,15 a 0,60 kg CO2e / kg de alimento processado; 8 a 15 kg CO2e / hL de cerveja',
      elegibilidadeLinhasVerdes: [
        'BNDES Finem Linhas Verdes Agroindústria',
        'Dossiê técnico com cálculo de pegada de carbono pronto para envio a instituições financeiras para redução de spread',
      ],
      beneficiosTributarios: [
        'Desoneração ou redução de alíquota na Cesta Básica Nacional (LC 214/2025)',
        'Aproveitamento integral de créditos de reciclagem para cumprimento de obrigações',
      ],
    },
    fatoresPeculiares: [
      {
        parametro: 'Fuga de Gás Refrigerante R404A',
        fator: '3.922 kg CO2e / kg vazado',
        unidade: 'kg CO2e / kg',
        fonte: 'IPCC AR5 / AR6 GWP',
        observacao:
          'Altíssimo impacto climático; cada kg perdido equivale a quase 4 toneladas de CO2.',
      },
      {
        parametro: 'Refrigeração Natural por Amônia (R717)',
        fator: '0,00 kg CO2e / kg vazado (GWP = 0)',
        unidade: 'kg CO2e / kg',
        fonte: 'IPCC / UNEP',
        observacao: 'Não causa efeito estufa direto, sendo recomendada na transição.',
      },
    ],
  },

  papel: {
    id: 'papel',
    slug: 'papel',
    nome: 'Papel & Celulose',
    icone: 'Trees',
    tagline:
      'Lixívia negra, cogeração elétrica para o SIN, maciços de eucalipto/pinus e balanço líquido negativo',
    fatorEmissao: 'Lixívia negra, caldeiras de recuperação e biomassa florestal',
    regulamentacao: 'Certificação FSC / PEFC, Resoluções CONAMA, SBCE Lei 15.042/2024, EUDR',
    descricao:
      'Protocolo para fábricas de celulose branqueada, papéis para embalagens, papel tissue e silvicultura. Contabilização do ciclo do carbono biogênico, autossuficiência energética por lixívia negra e exportação excedentária para o SIN.',
    principaisIndicadores: [
      'Remoções florestais líquidas de CO2 (tCO2 / ha / ano)',
      'Geração excedentária de energia renovável injetada na rede (MWh)',
      'Taxa de queima de lixívia negra em caldeiras de recuperação',
      'Percentual de madeira certificada FSC / Cerflor',
    ],
    tipoLaudo: 'Laudo Pericial de Carbono Biogênico Florestal & Cogeração',
    enquadramentoLegal: [
      {
        norma: 'Regulamento (UE) 2023/1115 (EUDR)',
        titulo: 'Exigência Antidesmatamento para Celulose e Papel',
        abrangencia: 'Comércio Exterior',
        dataChave: '30/12/2025',
        detalhe:
          'Exportações de celulose brasileira para a Europa exigem geolocalização exata dos talhões de colheita.',
      },
      {
        norma: 'Lei Federal nº 15.042/2024',
        titulo: 'SBCE para Grandes Produtores de Papel e Celulose',
        abrangencia: 'Obrigatório',
        dataChave: '2026-2029',
        detalhe:
          'Possibilidade de geração de ativos de redução e créditos para negociação com setores de difícil descarbonização.',
      },
    ],
    evidenciasCaptura: [
      {
        categoria: 'Documentos Florestais & Cadeia de Custódia',
        obrigatorio: true,
        documentos: [
          'Cadastro Ambiental Rural (CAR) das fazendas de floresta plantada',
          'Certificados FSC ou PEFC / Cerflor de Manejo Florestal e Cadeia de Custódia',
          'Documento de Origem Florestal (DOF / SINAFLOR) ou Guia Florestal Estadual',
        ],
      },
      {
        categoria: 'Operação da Fábrica & Energia',
        obrigatorio: true,
        documentos: [
          'Relatório de balanço de massa da caldeira de recuperação química',
          'Faturas de venda de energia excedentária à CCEE',
        ],
      },
    ],
    resultadoPericial: {
      entregas: [
        'Balanço líquido de carbono corporativo (remoções florestais vs emissões de processo)',
        'Dossiê de aptidão exportadora para atendimento às exigências europeias do EUDR',
        'Certificação de intensidade carbônica negativa ou próxima de zero',
      ],
      tco2ePorUnidade:
        'Balanço líquido tipicamente negativo: -1,2 a -2,5 tCO2e / tonelada de celulose produzida',
      elegibilidadeLinhasVerdes: [
        'BNDES Florestal e Fundo Clima',
        'Green Bonds e Sustainability-Linked Bonds no mercado de capitais internacional',
      ],
      beneficiosTributarios: [
        'Crédito integral de IBS/CBS sobre investimentos em reflorestamento e cogeração',
        'Desoneração total de EUDR com certificação de compliance',
      ],
    },
    fatoresPeculiares: [
      {
        parametro: 'Remoção Média de Carbono em Plantios de Eucalipto no Brasil',
        fator: '25 a 35 tCO2 / ha / ano',
        unidade: 'tCO2 / ha / ano',
        fonte: 'Ibá (Indústria Brasileira de Árvores) / IPCC',
        observacao:
          'Ciclos rápidos de crescimento de 6 a 7 anos conferem altíssima produtividade ao Brasil.',
      },
    ],
  },

  plasticos: {
    id: 'plasticos',
    slug: 'plasticos',
    nome: 'Plásticos & Economia Circular',
    icone: 'Recycle',
    tagline:
      'Resina pós-consumo reciclada (PCR), extrusão, créditos de reciclagem e circularidade PNRS',
    fatorEmissao: 'Injeção, extrusão e consumo de resinas fósseis virgens',
    regulamentacao:
      'PNRS (Lei 12.305/2010), Decreto 11.413/2023, Tratado Global de Plásticos da ONU',
    descricao:
      'Protocolo para recicladores mecânicos de plástico, transformadores e convertedores de embalagens. Atestado de incorporação de PCR, cálculo de emissões evitadas de resina virgem e emissão de lastro para créditos de reciclagem.',
    principaisIndicadores: [
      'Percentual de resina pós-consumo (PCR) incorporado na produção',
      'Consumo energético por kg de peça plástica injetada (kWh/kg)',
      'Créditos de reciclagem certificados emitidos',
      'Volume de plástico desviado de aterros sanitários',
    ],
    tipoLaudo: 'Atestado Pericial de Circularidade de Polímeros & PNRS',
    enquadramentoLegal: [
      {
        norma: 'Decreto Federal nº 11.413/2023',
        titulo: 'Certificado de Crédito de Reciclagem de Logística Reversa (CCRR)',
        abrangencia: 'Obrigatório',
        dataChave: 'Vigente',
        detalhe:
          'Regula a emissão e comercialização de créditos de reciclagem no sistema nacional.',
      },
      {
        norma: 'Tratado Global contra a Poluição Plástica (ONU)',
        titulo: 'Instrumento Internacional Legalmente Vinculante',
        abrangencia: 'Previsto',
        dataChave: 'Em negociação (2025/2026)',
        detalhe: 'Metas globais obrigatórias de conteúdo reciclado e redução de polímeros virgens.',
      },
    ],
    evidenciasCaptura: [
      {
        categoria: 'Documentos Fiscais de Sucata e Resinas',
        obrigatorio: true,
        documentos: [
          'NF-e de aquisição de aparas plásticas pós-consumo e garrafas PET enfardadas',
          'Manifesto de Transporte de Resíduos (MTR) emitido no SINIR',
          'NF-e de venda de pellets reciclados ou produtos acabados com percentual PCR',
        ],
      },
    ],
    resultadoPericial: {
      entregas: [
        'Atestado de circularidade probatória com rastreabilidade da origem dos fardos',
        'Cálculo de emissões evitadas frente ao polímero fóssil virgem correspondente',
        'Chancela pericial para emissão de Certificados de Crédito de Reciclagem',
      ],
      tco2ePorUnidade:
        'Evitação de 1,2 a 1,8 kg CO2e / kg de resina PCR reciclada em relação ao plástico virgem',
      elegibilidadeLinhasVerdes: [
        'BNDES Economia Circular',
        'Linhas de Financiamento Verde para Aquisição de Extrusoras e Lavadoras de Reciclagem',
      ],
      beneficiosTributarios: [
        'Crédito presumido de IBS/CBS na aquisição de materiais reciclados de cooperativas e catadores',
        'Desoneração de Imposto Seletivo sobre produtos que utilizem resina reciclada comprovada',
      ],
    },
    fatoresPeculiares: [
      {
        parametro: 'Pegada de Carbono de Polietileno (PE) Fóssil Virgem',
        fator: '1,95 kg CO2e / kg resina virgem',
        unidade: 'kg CO2e / kg',
        fonte: 'PlasticsEurope / Ecoinvent',
        observacao: 'Emissões da nafta ao pellet virgem na petroquímica.',
      },
      {
        parametro: 'Pegada de Carbono de Polietileno Reciclado (rPE / PCR)',
        fator: '0,45 kg CO2e / kg resina reciclada',
        unidade: 'kg CO2e / kg',
        fonte: 'Orbis dMRV Circular Engine',
        observacao: 'Redução superior a 75% na pegada carbônica.',
      },
    ],
  },

  farmaceutica: {
    id: 'farmaceutica',
    slug: 'farmaceutica',
    nome: 'Indústria Farmacêutica & Cosmética',
    icone: 'Stethoscope',
    tagline:
      'Salas limpas, sistemas HVAC contínuos, descarte de resíduos perigosos e boas práticas ANVISA',
    fatorEmissao: 'Salas limpas com HVAC contínuo e solventes industriais',
    regulamentacao: 'Anvisa RDC 658/2022 (BPF), RDC 222/2018 (Resíduos de Saúde), IFRS S1/S2',
    descricao:
      'Protocolo para laboratórios farmacêuticos, indústrias de cosméticos e saneantes. Rastreabilidade de eficiência de sistemas de ar condicionado para salas limpas, recuperação de solventes orgânicos e descarte termicamente seguro de resíduos perigosos.',
    principaisIndicadores: [
      'Consumo energético de HVAC por m² de sala limpa',
      'Percentual de solventes orgânicos recuperados e reutilizados',
      'Gestão de Resíduos de Serviços de Saúde (RSS) e perigosos (Classe I)',
      'Intensidade de emissões por milhão de doses produzidas',
    ],
    tipoLaudo: 'Laudo Pericial de Sustentabilidade Farmacêutica & Auditoria ESG',
    enquadramentoLegal: [
      {
        norma: 'RDC ANVISA nº 658/2022',
        titulo: 'Diretrizes Gerais de Boas Práticas de Fabricação de Medicamentos (BPF)',
        abrangencia: 'Obrigatório',
        dataChave: 'Vigente',
        detalhe:
          'Controle ambiental rigoroso de áreas limpas, classificação de ar e validação térmica.',
      },
      {
        norma: 'RDC ANVISA nº 222/2018',
        titulo: 'Regulamento Técnico para o Gerenciamento de Resíduos de Serviços de Saúde',
        abrangencia: 'Obrigatório',
        dataChave: 'Vigente',
        detalhe: 'Tratamento térmico de resíduos do Grupo B (químicos e medicamentos rejeitados).',
      },
    ],
    evidenciasCaptura: [
      {
        categoria: 'Documentos Fiscais & Tratamento de Resíduos',
        obrigatorio: true,
        documentos: [
          'NF-e e Certificado de Destinação Final (CDF) de incineração ou coprocessamento de resíduos químicos',
          'Faturas elétricas de subestação com rateio para centrais de água gelada (chillers)',
          'NF-e de compra e destilação de solventes industriais (etanol, acetona, isopropanol)',
        ],
      },
    ],
    resultadoPericial: {
      entregas: [
        'Inventário de emissões de Escopo 1 (solventes e caldeiras de esterilização) e Escopo 2',
        'Comprovação de conformidade socioambiental para atração de investidores de saúde',
        'Atestado de rastreabilidade de resíduos hospitalares e químicos descartados',
      ],
      tco2ePorUnidade: '2,8 a 8,5 kg CO2e / mil doses ou unidades comercializadas',
      elegibilidadeLinhasVerdes: [
        'Financiamentos de Inovação e Sustentabilidade da Finep e BNDES',
        'Spreads bonificados em bancos para laboratórios com alta pontuação ESG',
      ],
      beneficiosTributarios: [
        'Isenção ou redução na lista da Cesta Básica e medicamentos da Reforma Tributária (LC 214/2025)',
        'Créditos fiscais amplos de IBS/CBS sobre aquisição de maquinário e salas limpas',
      ],
    },
    fatoresPeculiares: [
      {
        parametro: 'Incineração Térmica de Resíduos Químicos Farmacêuticos (Classe I)',
        fator: '1,45 tCO2 / t resíduo incinerado',
        unidade: 'tCO2 / t',
        fonte: 'IPCC 2006 Vol 5 (Waste Incineration)',
        observacao:
          'Emissão decorrente da combustão controlada para destruição de moléculas ativas.',
      },
    ],
  },

  construcao: {
    id: 'construcao',
    slug: 'construcao',
    nome: 'Construção Civil & Canteiros Verdes',
    icone: 'Hammer',
    tagline:
      'Carbono incorporado na obra, britagem de RCD reciclado, PBQP-H e certificações LEED/AQUA',
    fatorEmissao: 'Transporte de terraplanagem, aço, concreto e resíduos (RCD)',
    regulamentacao: 'Resolução CONAMA 307/2002 (RCD), PBQP-H, Certificações LEED / AQUA-HQE, SBCE',
    descricao:
      'Protocolo para construtoras, incorporadoras e gerenciadoras de obras. Mensuração do carbono embutido na fase construtiva (A1-A5 da EN 15978), gestão e britagem de Resíduos da Construção Civil (RCD) e redução de desperdício de cimento.',
    principaisIndicadores: [
      'kg CO2e por m² de área construída',
      'Taxa de desvio de aterro de RCD (reciclagem de entulho)',
      'Percentual de concreto com agregados reciclados ou cinzas volantes',
      'Consumo de madeira de desforma com certificação de origem legal',
    ],
    tipoLaudo: 'Atestado de Baixo Carbono para Canteiros de Obra & Carbono Incorporado',
    enquadramentoLegal: [
      {
        norma: 'Resolução CONAMA nº 307/2002',
        titulo: 'Gestão dos Resíduos da Construção Civil (RCD)',
        abrangencia: 'Obrigatório',
        dataChave: 'Vigente com alterações',
        detalhe:
          'Obrigatoriedade de elaboração do Plano de Gerenciamento de RCD para todas as obras.',
      },
      {
        norma: 'Programa Brasileiro da Qualidade e Produtividade do Habitat (PBQP-H)',
        titulo: 'Sistema de Avaliação da Conformidade de Empresas de Serviços e Obras',
        abrangencia: 'Obrigatório',
        dataChave: 'Vigente',
        detalhe:
          'Exigência de controle de perdas e gestão de fornecedores qualificados no âmbito do Minha Casa Minha Vida.',
      },
    ],
    evidenciasCaptura: [
      {
        categoria: 'Documentos Fiscais de Materiais Estruturais',
        obrigatorio: true,
        documentos: [
          'NF-e de concreto usinado com indicação da resistência (fck) e traço',
          'NF-e de aço CA-50 / CA-60 para armação',
          'Comprovantes de destinação de RCD (Manifestos de Transporte e caçambas licenciadas)',
        ],
      },
    ],
    resultadoPericial: {
      entregas: [
        'Inventário de carbono incorporado no ciclo construtivo (berço ao portão da obra)',
        'Dossiê comprobatório para pontuação em certificações LEED, AQUA-HQE e EDGE',
        'Atestado de economia circular para destinação correta de entulhos',
      ],
      tco2ePorUnidade: '280 a 550 kg CO2e / m² construído (dependendo da tipologia e altura)',
      elegibilidadeLinhasVerdes: [
        'Caixa Econômica Federal — Selo Casa Azul + e Financiamento com Juros Menores',
        'CRI Verde (Certificados de Recebíveis Imobiliários Verdes)',
      ],
      beneficiosTributarios: [
        'Crédito financeiro de IBS/CBS sobre aquisição de concreto e aço com fornecedor regular',
        'Descontos em IPTU Verde concedidos por municípios conveniados',
      ],
    },
    fatoresPeculiares: [
      {
        parametro: 'Concreto Usinado Padrão fck 30 MPa',
        fator: '240 a 310 kg CO2e / m³ concreto',
        unidade: 'kg CO2e / m³',
        fonte: 'GCCA / SNIC / SIDAC',
        observacao: 'Impactado diretamente pelo fator clínquer do cimento empregado no traço.',
      },
    ],
  },

  varejo: {
    id: 'varejo',
    slug: 'varejo',
    nome: 'Comércio Varejista, Atacado & Serviços',
    icone: 'ShoppingBag',
    tagline: 'Climatização eficiente, logística de entrega urbana, embalagens, novo IVA e Selo ACP',
    fatorEmissao: 'Ar-condicionado central, iluminação e logística de entrega urbana',
    regulamentacao: 'Diretrizes ACP / IBESG, LC 214/2025 (Reforma Tributária), PNRS',
    descricao:
      'Protocolo ágil desenhado para redes varejistas, supermercados, franquias, centros comerciais e empresas de serviços. Foco na adaptação ao novo regime de IBS/CBS, eficiência no consumo elétrico de refrigeração/iluminação e obtenção de Selo de Sustentabilidade para vitrines.',
    principaisIndicadores: [
      'Consumo energético por m² de área de vendas (kWh/m²)',
      'Emissões da frota de entrega urbana ou motoboys (Escopo 3)',
      'Taxa de reciclagem de papelão e embalagens pós-venda',
      'Score ESG simplificado para obtenção de taxas bancárias especiais',
    ],
    tipoLaudo: 'Selo Oficial de Conformidade para Comércio & Serviços (Parceria ACP)',
    enquadramentoLegal: [
      {
        norma: 'Lei Complementar nº 214/2025',
        titulo: 'Reforma Tributária e o Split Payment no Comércio',
        abrangencia: 'Obrigatório',
        dataChave: '01/08/2026 (Fase-teste) e 01/01/2027 (Pleno)',
        detalhe:
          'Adaptação dos terminais de venda (POS/TEF) ao split payment automático e destaque de IBS/CBS na NFC-e.',
      },
      {
        norma: 'Resolução CGIBS nº 6/2026',
        titulo: 'Mecanismo de Cashback Social de IBS/CBS',
        abrangencia: 'Obrigatório',
        dataChave: '2026',
        detalhe:
          'Adequação dos sistemas de supermercados e farmácias para identificação do CPF e repasse do cashback.',
      },
    ],
    evidenciasCaptura: [
      {
        categoria: 'Documentos Fiscais & Energia',
        obrigatorio: true,
        documentos: [
          'Faturas de energia elétrica das lojas e depósitos',
          'Amostragem de arquivos XML de NFC-e (modelo 65) e NF-e (modelo 55)',
          'NF-e de coleta e venda de fardos de papelão e plástico gerados no desempacotamento',
        ],
      },
    ],
    resultadoPericial: {
      entregas: [
        'Comparativo tributário com simulação de impacto do novo IVA sobre margens de venda',
        'Inventário simplificado de emissões de Escopo 2 (eletricidade) e Escopo 1 (ar-condicionado)',
        'Selo Oficial Orbis / ACP para uso em fachadas, websites e material promocional',
      ],
      tco2ePorUnidade: '15 a 45 kg CO2e / m² de loja por ano',
      elegibilidadeLinhasVerdes: [
        'Linha ACP / Fomento Paraná Sustentável',
        'Pronampe Verde para Micro e Pequenas Empresas comerciais',
      ],
      beneficiosTributarios: [
        'Aproveitamento integral de créditos de CBS sobre contas de energia e telecomunicações',
        'Fim da cumulatividade e devolução célere de saldos credores no Comitê Gestor do IBS',
      ],
    },
    fatoresPeculiares: [
      {
        parametro: 'Fator de Emissão da Eletricidade Consumida em Horário de Ponta Comercial',
        fator: '0,085 tCO2e / MWh',
        unidade: 'tCO2e / MWh',
        fonte: 'MCTI / SIN',
        observacao: 'Média de rede do Sistema Interligado Nacional.',
      },
    ],
  },

  'materiais-criticos-recuperados': {
    id: 'materiais-criticos-recuperados',
    slug: 'materiais-criticos-recuperados',
    nome: 'Materiais Críticos Recuperados & Mineração Urbana',
    icone: 'Layers',
    tagline:
      'Origem urbana comprovada, cadeia de custódia anti-receptação, DCP por lote com hash SHA-256 e conformidade PNRS',
    fatorEmissao: 'Eletricidade de segregação/trituração e logística de captação urbana',
    regulamentacao:
      'Lei 12.305/2010 (PNRS), Decreto 11.413/2023, Resoluções CONAMA, Diretrizes ANM e ABNT ISO 14067',
    descricao:
      'Protocolo técnico probatório para comprovação de origem urbana, rastreabilidade fiscal e pericial de lotes segregados de materiais críticos recuperados (terras raras NdFeB de discos rígidos e motores elétricos, concentrados de ouro, paládio e prata de placas de circuito impresso - PCBs, e cobre de alta pureza de fios, bobinados e chicotes). Emissão de Passaporte Digital de Produto (DCP) por lote com prova criptográfica SHA-256, QR Code público e cálculo da pegada de carbono berço-ao-portão com dados verificáveis.',
    principaisIndicadores: [
      'Massa total do lote segregado (kg) e teores por fração crítica',
      'Teor estimado de terras raras NdFeB (kg) em componentes magnéticos',
      'Teor estimado de metais nobres (Au, Pd, Ag em gramas) em frações de PCBs',
      'Massa de cobre de alta pureza recuperado (kg) de chicotes e bobinados',
      'Chaves de NF-e (44 dígitos) e DANFE de aquisição de sucata urbana auditadas',
      'Hash SHA-256 canônico e QR Code do DCP público por lote',
    ],
    tipoLaudo: 'Passaporte Digital de Produto (DCP) — Lote de Materiais Críticos Recuperados',
    enquadramentoLegal: [
      {
        norma: 'Lei Federal nº 12.305/2010 (PNRS)',
        titulo: 'Política Nacional de Resíduos Sólidos & Logística Reversa',
        abrangencia: 'Obrigatório',
        dataChave: 'Vigente',
        detalhe:
          'Fundamenta a obrigatoriedade da destinação ambientalmente adequada de eletroeletrônicos e peças pós-consumo, priorizando a valorização e a reintrodução em ciclos produtivos industriais.',
      },
      {
        norma: 'Decreto Federal nº 11.413/2023',
        titulo: 'Marco dos Certificados de Estruturação e Logística Reversa',
        abrangencia: 'Setorial',
        dataChave: 'Vigente',
        detalhe:
          'Estabelece parâmetros de comprovação de destinação de frações de materiais recicláveis e lastro de circularidade segregado.',
      },
      {
        norma: 'Resoluções CONAMA & Diretrizes ANM',
        titulo: 'Aproveitamento de Frações Estratégicas e Mineração Urbana',
        abrangencia: 'Setorial',
        dataChave: 'Vigente',
        detalhe:
          'Classificação de resíduos não-perigosos/perigosos, controle de manuseio e salvaguarda contra atividades extrativas ilegais via comprovação de procedência urbana.',
      },
      {
        norma: 'Legislação Fiscal Federal / SEFAZ (Ajuste SINIEF)',
        titulo: 'Conformidade Fiscal de Sucatas e Cadeia de Custódia Anti-Receptação',
        abrangencia: 'Obrigatório',
        dataChave: 'Vigente',
        detalhe:
          'Exigência de rastreamento estrito de NF-e com CFOP específico de sucatas/resíduos, DANFE e transportador para blindar a cadeia contra ilícitos e receptação.',
      },
    ],
    evidenciasCaptura: [
      {
        categoria: 'Origem Urbana & Cadeia de Custódia Fiscal',
        obrigatorio: true,
        documentos: [
          'Chave de acesso da NF-e de entrada (44 dígitos) com CFOP de sucata/descarte urbano',
          'Documento Auxiliar da Nota Fiscal Eletrônica (DANFE) e identificação do fornecedor urbano',
          'Dados do transportador licenciado e manifesto de transporte vinculado ao lote',
          'Declaração pericial de origem exclusivamente urbana e não-extrativa',
        ],
      },
      {
        categoria: 'Balancete Operacional & Segregação por Lote',
        obrigatorio: true,
        documentos: [
          'Boletim de pesagem calibrada de entrada e saída por fração do lote',
          'Registro de descaracterização e segregação física de componentes (PCBs, discos, motores, chicotes)',
          'Laudo pericial de composição ou espectrometria/densitometria do concentrado',
        ],
      },
      {
        categoria: 'Pegada de Carbono Berço-ao-Portão',
        obrigatorio: false,
        documentos: [
          'Faturas de energia elétrica da unidade de processamento (kWh consumidos no lote)',
          'Registro de consumo de combustível ou distância no transporte da sucata urbana (t.km)',
          'Relatório de cálculo da pegada de carbono com dados verificáveis para compradores',
        ],
      },
    ],
    resultadoPericial: {
      entregas: [
        'Passaporte Digital de Produto (DCP) com hash SHA-256 e QR Code público por lote',
        'Atestado de origem estritamente urbana e conformidade com a Lei 12.305/2010 (PNRS)',
        'Cadeia de custódia fiscal auditada de ponta a ponta (chave NF-e 44 dígitos e DANFE)',
        'Cálculo da pegada de carbono berço-ao-portão com dados verificáveis',
        'Dossiê técnico em formato PDF/JSON estruturado, pronto para envio a refinarias e indústrias compradoras de materiais críticos',
      ],
      tco2ePorUnidade:
        'Dados calculados conforme metodologia berço-ao-portão por parceiro metodológico a ser contratado, com dados verificáveis para cada lote processado',
      elegibilidadeLinhasVerdes: [
        'Linhas de Financiamento de Economia Circular e Mineração Urbana (BNDES / FINEP)',
        'Acesso a refinarias e indústrias compradoras de materiais críticos com prêmio de procedência verificável',
      ],
      beneficiosTributarios: [
        'Segurança jurídica e não-cumulatividade plena de IBS/CBS na cadeia de reciclagem',
        'Mitigação total de riscos de autuação por receptação de sucata metálica e eletrônica',
        'Dossiê comprobatório idôneo perante a fiscalização fazendária e órgãos ambientais',
      ],
    },
    fatoresPeculiares: [
      {
        parametro: 'Pegada de Carbono Berço-ao-Portão de Fração de Terras Raras (NdFeB)',
        fator: 'Cálculo com dados verificáveis de rota urbana',
        unidade: 'kg CO2e / kg NdFeB',
        fonte: 'Parceiro metodológico a ser contratado / ABNT ISO 14067',
        observacao:
          'Estimativa berço-ao-portão com parâmetros de processo verificáveis, sem emissão de créditos de carbono.',
      },
      {
        parametro: 'Pegada de Carbono Berço-ao-Portão de Concentrado de Metais Nobres (Au/Pd/Ag)',
        fator: 'Cálculo com dados verificáveis de rota urbana',
        unidade: 'kg CO2e / g metal precioso',
        fonte: 'Parceiro metodológico a ser contratado / ABNT ISO 14067',
        observacao:
          'Balanço de energia de cominuição e separação física da sucata de placas de circuito impresso.',
      },
      {
        parametro: 'Pegada de Carbono Berço-ao-Portão de Cobre Recuperado de Alta Pureza',
        fator: 'Cálculo com dados verificáveis de rota urbana',
        unidade: 'kg CO2e / kg Cu',
        fonte: 'Parceiro metodológico a ser contratado / ABNT ISO 14067',
        observacao:
          'Apurado por dados de eletricidade da unidade e transporte da sucata até o portão da fábrica.',
      },
    ],
  },
}

/**
 * Array dos 15 protocolos para iterações na interface
 */
export const LISTA_PROTOCOLOS_SETORIAIS: ProtocoloSetorial[] = Object.values(PROTOCOLOS_SETORIAIS)

/**
 * Helper para buscar protocolo por slug ou id
 */
export function getProtocoloBySlug(slug: string): ProtocoloSetorial | undefined {
  return PROTOCOLOS_SETORIAIS[slug]
}
