export type StatusNorma = 'Vigente' | 'Em fase-teste' | 'Previsto'

export interface ItemRadarRegulatorio {
  id: string
  dataMarco: string
  ano: string
  norma: string
  status: StatusNorma
  titulo: string
  descricaoCurta: string
  quemAfeta: string[]
  acaoRecomendada: string
  baseLegal: string
  tagSetorial: 'Tributário' | 'Carbono/SBCE' | 'Comércio Exterior' | 'Ambiental/ESG'
}

export const ITENS_RADAR_REGULATORIO: ItemRadarRegulatorio[] = [
  {
    id: 'resolucao_cvm_244_2026',
    dataMarco: '2026',
    ano: '2026',
    norma: 'Resolução CVM nº 244/2026 & Ofício-Circular CVM',
    status: 'Vigente',
    titulo: 'CVM 244/2026: Fim da Obrigatoriedade IFRS S1/S2 e Veto a Greenwashing por Associação',
    descricaoCurta:
      'Revoga a obrigatoriedade do reporte de sustentabilidade nos padrões CBPS/IFRS S1 e S2 no mercado de capitais brasileiro, retornando ao regime voluntário pratique-ou-explique. O ofício-circular complementar veda expressamente o uso de declarações como "alinhado ao" ou "baseado em" padrão ISSB/CBPS sem conformidade integral e verificável.',
    quemAfeta: [
      'Companhias abertas, securitizadoras e emissores de valores mobiliários',
      'Fundos de investimento com mandato ou estratégia ASG/ESG',
      'Empresas fornecedoras e participantes de cadeias de valor de companhias listadas',
    ],
    acaoRecomendada:
      'Utilizar demonstrações elaboradas segundo as diretrizes de reporte voluntário, substituindo declarações vagas de alinhamento por evidências fiscais e documentais auditáveis com chancela pericial, evitando riscos de autuação por greenwashing por associação.',
    baseLegal: 'Resolução CVM nº 244/2026 e Ofício-Circular CVM de orientação',
    tagSetorial: 'Ambiental/ESG',
  },
  {
    id: 'resolucao_bacen_586_2026',
    dataMarco: '2026',
    ano: '2026',
    norma: 'Resolução CMN/Bacen nº 586/2026',
    status: 'Vigente',
    titulo: 'Bacen 586/2026: Atualização dos Relatórios GRSAC nas Instituições Financeiras',
    descricaoCurta:
      'Atualiza as diretrizes para elaboração e divulgação do Relatório de Gerenciamento de Riscos e Oportunidades Sociais, Ambientais e Climáticas (GRSAC) pelas instituições autorizadas a funcionar pelo Banco Central, intensificando a exigência de dados primários e rastreabilidade na concessão de crédito.',
    quemAfeta: [
      'Bancos múltiplos, comerciais, de investimento e cooperativas de crédito',
      'Empresas tomadoras de crédito bancário e financiamentos verdes (Green Capital)',
      'Grandes grupos industriais com obrigações de reporte socioambiental perante o SFN',
    ],
    acaoRecomendada:
      'Estruturar inventários com prova documental e rastreabilidade fiscal para apresentar aos bancos credores demonstrativos defensáveis de risco climático e aderência às métricas GRSAC.',
    baseLegal: 'Resolução CMN/Bacen nº 586/2026 e aprimoramento da Res. BCB 4.945/2021',
    tagSetorial: 'Carbono/SBCE',
  },
  {
    id: 'portaria_previc_728_2026',
    dataMarco: '2026',
    ano: '2026',
    norma: 'Portaria Previc nº 728/2026',
    status: 'Vigente',
    titulo:
      'Portaria Previc 728/2026: Riscos ASG, Dupla Materialidade e Plano ASG em Fundos de Pensão',
    descricaoCurta:
      'Regulamenta a integração e a gestão de riscos e oportunidades de sustentabilidade (fatores ASG) nas Entidades Fechadas de Previdência Complementar (EFPC). Estabelece a obrigatoriedade de Plano ASG estruturado, análise de dupla materialidade e diligência qualificada sobre emissores e ativos investidos.',
    quemAfeta: [
      'Entidades Fechadas de Previdência Complementar (EFPCs / fundos de pensão)',
      'Gestoras e administradoras de fundos de investimento com capital previdenciário',
      'Companhias emissoras de debêntures, ações e notas comerciais alvos de alocação de fundos',
    ],
    acaoRecomendada:
      'Disponibilizar dossiês técnicos com indicadores de dupla materialidade e conformidade de governança climática para qualificar empresas como ativos elegíveis aos mandatos dos fundos de pensão.',
    baseLegal: 'Portaria Previc nº 728/2026 e Resolução Previc nº 23/2023',
    tagSetorial: 'Ambiental/ESG',
  },
  {
    id: 'decreto_13094_probioqav_cssaf',
    dataMarco: '2026',
    ano: '2026',
    norma: 'Decreto nº 13.094/2026 & ProBioQAV (Lei 14.993/2024)',
    status: 'Vigente',
    titulo: 'Decreto 13.094/2026: ProBioQAV, CS-SAF e Regime Formal de Book and Claim',
    descricaoCurta:
      'Regulamenta o Programa Nacional de Combustível Sustentável de Aviação (ProBioQAV) no âmbito da Lei do Combustível do Futuro, criando o Certificado de Combustível Sustentável de Aviação (CS-SAF). Trata-se do primeiro certificado brasileiro estruturado em regime formal de book and claim, operando com estrita separação do atributo ambiental da entrega física do combustível e vedando terminantemente a dupla contagem (o mesmo litro não pode gerar CBIO e CS-SAF). Estabelece interoperabilidade mandatória com o programa internacional CORSIA (ICAO) e com o Sistema Brasileiro de Comércio de Emissões (SBCE / Lei 15.042/2024), com consulta pública da ANAC em curso. O arcabouço adota como referência a norma ISO 22095-3:2026 (primeira norma internacional de book and claim para cadeia de custódia), fundamentada no conceito de TIEC (Transferrable Instrument with Entitlement to Claim — a menor unidade transferível).',
    quemAfeta: [
      'Operadores aéreos regulares e aviação comercial e geral com metas mandatórias de redução de emissões',
      'Produtores e importadores de combustível sustentável de aviação (SAF) e agentes da cadeia de suprimentos',
      'Distribuidores de combustíveis de aviação, aeroportos e operadores de infraestrutura logística de abastecimento',
    ],
    acaoRecomendada:
      'Estruturar a custódia documental e a integridade de dados primários da rota de biocombustíveis e insumos renováveis, garantindo que a infraestrutura de dMRV e prova digital assegure a unicidade registral e comprove a ausência de dupla contagem entre CBIO, CGOB e CS-SAF perante a ANAC e o SBCE.',
    baseLegal:
      'Decreto Federal nº 13.094/2026, Lei Federal nº 14.993/2024 (Lei do Combustível do Futuro), ISO 22095-3:2026 e Consulta Pública ANAC',
    tagSetorial: 'Carbono/SBCE',
  },
  {
    id: 'consulta_publica_susep_issb',
    dataMarco: '2026',
    ano: '2026',
    norma: 'Consulta Pública Susep (Alinhamento ISSB / IFRS S1 e S2)',
    status: 'Em fase-teste',
    titulo: 'Consulta Pública Susep: Revogação da Circular 666/2022 e Alinhamento aos Padrões ISSB',
    descricaoCurta:
      'Proposta regulatória da Superintendência de Seguros Privados (Susep) para revogar a Circular Susep nº 666/2022 e atualizar o marco de sustentabilidade do setor segurador e ressegurador brasileiro, convergindo aos padrões globais de divulgação climática do ISSB (IFRS S1 e S2 / CBPS 01 e 02). A estrutura do relatório apoia-se em 4 tabelas padronizadas cobrindo os pilares centrais de governança, estratégia, gestão de riscos e métricas e metas. Adota lógica de proporcionalidade por porte das entidades supervisionadas (segmentação S1 a S4), concede dispensa de relatório separado se a entidade já elaborar reporte IFRS S1/S2 acompanhado de asseguração/auditoria independente, e fixa calendário mandatório: norma em vigor a partir de 31/12/2026, coleta de dados primários ao longo de 2027 e primeira divulgação pública obrigatória em 2028.',
    quemAfeta: [
      'Sociedades seguradoras, resseguradores locais e entidades abertas de previdência complementar',
      'Corretoras e estipulantes de seguros patrimoniais, de responsabilidade civil e de transportes',
      'Indústrias seguradas que contratam coberturas para riscos climáticos, ambientais e de infraestrutura',
    ],
    acaoRecomendada:
      'Organizar os dados primários de governança, estratégia climática, matriz de riscos e métricas de emissões segundo a lógica das 4 tabelas padronizadas da Susep e IFRS S1/S2, preparando a cadeia de custódia documental auditável para o ciclo de coleta de 2027 e divulgação em 2028.',
    baseLegal:
      'Consulta Pública Susep (substituição da Circular Susep nº 666/2022; vigência 31/12/2026, coleta 2027, divulgação 2028)',
    tagSetorial: 'Ambiental/ESG',
  },
  {
    id: 'verra_scope3_standard_s3s',
    dataMarco: '15/09/2026',
    ano: '2026',
    norma: 'Verra Scope 3 Standard (S3S) Program',
    status: 'Previsto',
    titulo: 'Verra Scope 3 Standard (S3S) Program: Ações Climáticas na Cadeia de Valor Corporativa',
    descricaoCurta:
      'Padrão global para certificação de ações climáticas dentro da cadeia de valor corporativa (insetting), com Unidades de Escopo 3 (S3Us) e operação digital-first (dMRV). A versão 1.0 contempla metodologias para agricultura e concreto; metodologias para materiais circulares e reciclagem constam como expansão futura, ainda sem metodologia publicada.',
    quemAfeta: [
      'Empresas com metas corporativas de redução de emissões de Escopo 3',
      'Cadeia de valor automotiva, siderúrgica e de manufatura',
      'Fornecedores industriais inseridos em programas de insetting corporativo',
    ],
    acaoRecomendada:
      'Relevante para empresas com metas de redução de Escopo 3 (ex.: cadeia automotiva e siderúrgica). A rastreabilidade ponta a ponta e a prova documental exigidas pelo programa são compatíveis com a abordagem dMRV que a plataforma já opera.',
    baseLegal: 'Verra Scope 3 Standard (S3S) v1.0 (Registro Internacional Voluntário)',
    tagSetorial: 'Carbono/SBCE',
  },
  {
    id: 'fase_teste_ibscbs_2026',
    dataMarco: '01/08/2026',
    ano: '2026',
    norma: 'LC 214/2025 (Art. 348) & EC 132/2023',
    status: 'Em fase-teste',
    titulo: 'Fase-teste IBS/CBS: Destaque Obrigatório de IBS 0,1% e CBS 0,9% na NF-e',
    descricaoCurta:
      'Início oficial do destaque nos documentos fiscais eletrônicos (NF-e modelo 55 e NFC-e modelo 65) com alíquotas de teste de IBS (0,1%) e CBS (0,9%). O recolhimento efetivo é dispensado se as obrigações acessórias forem pontualmente entregues.',
    quemAfeta: [
      'Todas as empresas emissoras de NF-e e NFC-e',
      'Desenvolvedores de ERP e emissores fiscais',
      'Indústria, Comércio e Serviços',
    ],
    acaoRecomendada:
      'Verificar se o emissor de notas fiscais do ERP está atualizado para gerar os grupos XML <IBSCBS> (vBCIBS, vIBS, pIBS, vBCCBS, vCBS, pCBS, cClassTrib) a partir de 1º/08/2026.',
    baseLegal: 'Art. 348 da LC 214/2025 e cronograma da EC 132/2023',
    tagSetorial: 'Tributário',
  },
  {
    id: 'lc227_decreto12955',
    dataMarco: '2026',
    ano: '2026',
    norma: 'LC 227/2026 & Decreto nº 12.955/2026',
    status: 'Vigente',
    titulo: 'Novas Normas Gerais da Reforma Tributária (IBS/CBS e Comitê Gestor)',
    descricaoCurta:
      'Instituição e detalhamento da governança do Comitê Gestor do IBS (CGIBS), uniformização das regras operacionais federativas entre os 26 Estados, DF e 5.570 Municípios e estruturação do split payment inteligente.',
    quemAfeta: [
      'Empresas operando no comércio interestadual',
      'Instituições financeiras e adquirentes de cartão',
      'Grandes contribuintes e médias empresas',
    ],
    acaoRecomendada:
      'Mapear contas bancárias corporativas e rotinas financeiras para adaptação à liquidação com split payment e parametrização do CGIBS.',
    baseLegal: 'LC 227/2026 e Decreto Presidencial nº 12.955/2026',
    tagSetorial: 'Tributário',
  },
  {
    id: 'imposto_seletivo_lc214',
    dataMarco: '2026 / 2027',
    ano: '2026',
    norma: 'LC 214/2025 (Imposto Seletivo)',
    status: 'Em fase-teste',
    titulo: 'Regulamentação do Imposto Seletivo ("Imposto do Pecado")',
    descricaoCurta:
      'Incidência monofásica extrafiscal sobre veículos poluentes a combustão, embarcações e aeronaves esportivas, cigarros/tabaco, bebidas alcoólicas, bebidas açucaradas, carvão mineral e bens minerais extraídos. Peças recicladas (CDV) contam com desoneração protetiva.',
    quemAfeta: [
      'Montadoras e importadoras de veículos e aeronaves',
      'Indústria de tabaco, bebidas alcoólicas e refrigerantes',
      'Mineradoras e produtoras de combustíveis fósseis',
    ],
    acaoRecomendada:
      'Auditar o cadastro de NCM dos itens faturados na NF-e para identificar bens potencialmente afetados e mitigar riscos tributários.',
    baseLegal: 'LC 214/2025, Anexo do Imposto Seletivo e EC 132/2023',
    tagSetorial: 'Tributário',
  },
  {
    id: 'resolucao_cgibs_6_cashback',
    dataMarco: '2026',
    ano: '2026',
    norma: 'Resolução CGIBS nº 6/2026 & Cashback IBS/CBS',
    status: 'Vigente',
    titulo: 'Resolução CGIBS nº 6/2026 e Mecanismo de Cashback Social',
    descricaoCurta:
      'Normatização do cashback de IBS/CBS para famílias de baixa renda (CadÚnico) nas contas de energia elétrica, botijão de gás (GLP), telecomunicações e cesta básica nacional, processado via CPF na nota.',
    quemAfeta: [
      'Distribuidoras de energia elétrica (NF3e)',
      'Distribuidoras de gás GLP',
      'Operadoras de telecomunicações (NFCom)',
      'Varejistas de alimentos e supermercados',
    ],
    acaoRecomendada:
      'Adequar os sistemas de checkout e emissão para transmissão correta do CPF do consumidor e código específico de classificação de desoneração social.',
    baseLegal: 'Resolução do Comitê Gestor do IBS nº 6/2026',
    tagSetorial: 'Tributário',
  },
  {
    id: 'cbam_ue_transicao',
    dataMarco: '2024 - 2026',
    ano: '2026',
    norma: 'Regulamento (UE) 2023/956 (CBAM)',
    status: 'Vigente',
    titulo: 'CBAM/UE: Transição até Regime Definitivo com Cobrança de Certificados',
    descricaoCurta:
      'Mecanismo de Ajuste de Carbono na Fronteira da União Europeia. O período de reporte trimestral de emissões incorporadas transita para o regime financeiro definitivo em 2026, onde importadores europeus compram certificados CBAM.',
    quemAfeta: [
      'Exportadores de cimento, ferro, aço, alumínio, fertilizantes, eletricidade e hidrogênio para a UE',
      'Cadeias integradas de suprimentos voltadas ao comércio europeu',
    ],
    acaoRecomendada:
      'Realizar inventário pericial de emissões de Escopo 1 e Escopo 2 com metodologia ISO 14064 / GHG Protocol para certificar os produtos exportados.',
    baseLegal: 'Regulamento Europeu CBAM 2023/956 e diretrizes da Comissão Europeia',
    tagSetorial: 'Comércio Exterior',
  },
  {
    id: 'sbce_lei_15042',
    dataMarco: '2024 - 2029',
    ano: '2026',
    norma: 'Lei Federal nº 15.042/2024 (Marco Legal do SBCE)',
    status: 'Vigente',
    titulo: 'SBCE: Sistema Brasileiro de Comércio de Emissões de GEE',
    descricaoCurta:
      'Marco regulatório do mercado de carbono no Brasil. Estabelece governança climática e limiares de conformidade: reporte obrigatório para emissões > 10.000 tCO₂e/ano e compensação/metas obrigatórias para > 25.000 tCO₂e/ano, com fase operacional plena até ~2029.',
    quemAfeta: [
      'Indústrias de transformação e pesadas (siderurgia, cimento, químicas, papel e celulose)',
      'Grandes geradores de energia térmica e transportadoras',
      'Instalações industriais com consumo energético intensivo',
    ],
    acaoRecomendada:
      'Calcular o enquadramento de emissões da empresa no funil Orbis dMRV e estruturar inventário auditado com rastreabilidade fiscal para antecipar exigências probatórias.',
    baseLegal: 'Lei Federal nº 15.042/2024',
    tagSetorial: 'Carbono/SBCE',
  },
  {
    id: 'cbs_efetiva_2027',
    dataMarco: '01/01/2027',
    ano: '2027',
    norma: 'EC 132/2023 & LC 214/2025',
    status: 'Previsto',
    titulo: 'CBS Efetiva: Extinção Completa do PIS e da Cofins',
    descricaoCurta:
      'Cobrança plena da CBS federal com alíquota de referência estimada em ~8,8% e extinção definitiva do PIS e da Cofins. Crédito financeiro integral e amplo sobre todas as aquisições da empresa.',
    quemAfeta: [
      'Todas as pessoas jurídicas do regime de Lucro Real, Presumido e tomadores de Simples Nacional',
    ],
    acaoRecomendada:
      'Ajustar contratos de fornecimento e precificação de vendas, considerando a ampla apropriação de créditos e o fim dos litígios sobre o conceito restritivo de insumo.',
    baseLegal: 'Art. 195 e ADCT da CF com redação dada pela EC 132/2023',
    tagSetorial: 'Tributário',
  },
  {
    id: 'transicao_federativa_ibs',
    dataMarco: '2029 - 2032',
    ano: '2029',
    norma: 'EC 132/2023',
    status: 'Previsto',
    titulo: 'Transição Federativa do IBS: Redução Gradual do ICMS e ISS',
    descricaoCurta:
      'Período em que o ICMS estadual e o ISS municipal são proporcionalmente reduzidos (90%, 80%, 70%...) enquanto a alíquota do IBS sobe gradativamente até a consolidação total em 2033.',
    quemAfeta: [
      'Empresas industriais, comerciais e prestadoras de serviços em todo o território nacional',
      'Empresas usuárias de incentivos fiscais estaduais de ICMS',
    ],
    acaoRecomendada:
      'Substituir o planejamento fiscal baseado em guerra fiscal interestadual por eficiência logística e auditoria probatória de dados.',
    baseLegal: 'Disposições Constitucionais Transitórias da EC 132/2023',
    tagSetorial: 'Tributário',
  },
  {
    id: 'ibs_cbs_pleno_2033',
    dataMarco: '01/01/2033',
    ano: '2033',
    norma: 'EC 132/2023',
    status: 'Previsto',
    titulo: 'Regime Pleno do Novo IVA Dual (IBS + CBS)',
    descricaoCurta:
      'Vigência definitiva e integral do novo modelo tributário brasileiro: ICMS e ISS extintos, tributação 100% no destino pelo IBS e CBS com devolução célere de saldos credores.',
    quemAfeta: ['Economia brasileira em sua totalidade'],
    acaoRecomendada:
      'Manter conformidade digital contínua através do protocolo de auditoria e chancela dMRV.',
    baseLegal: 'Art. 156-A da Constituição Federal (EC 132/2023)',
    tagSetorial: 'Tributário',
  },
  {
    id: 'pnrs_logistica_reversa',
    dataMarco: 'Em vigor',
    ano: '2026',
    norma: 'Lei Federal nº 12.305/2010 (PNRS) & Decretos 11.044 e 11.413',
    status: 'Vigente',
    titulo: 'PNRS: Política Nacional de Resíduos Sólidos & Certificados de Reciclagem',
    descricaoCurta:
      'Obrigatoriedade de estruturação e implementação de sistemas de logística reversa e comprovação de reciclagem de embalagens em geral, eletroeletrônicos, baterias e pneus através de Certificados de Crédito de Reciclagem (CCRR).',
    quemAfeta: [
      'Fabricantes, importadores, distribuidores e comerciantes de embalagens, bens de consumo e eletrônicos',
    ],
    acaoRecomendada:
      'Garantir notas fiscais eletrônicas de destinação ambiental e aquisição de certificados de crédito de reciclagem ou insetting com rastreabilidade probatória.',
    baseLegal: 'Lei Federal 12.305/2010 e Decretos 11.044/2022 e 11.413/2023',
    tagSetorial: 'Ambiental/ESG',
  },
  {
    id: 'renovabio_cbios',
    dataMarco: 'Em vigor',
    ano: '2026',
    norma: 'Lei Federal nº 13.576/2017 (RenovaBio) & Resoluções ANP',
    status: 'Vigente',
    titulo: 'RenovaBio & Metas Compulsórias de Descarbonização (CBIOs)',
    descricaoCurta:
      'Política Nacional de Biocombustíveis. Obriga distribuidores de combustíveis fósseis a comprovar o cumprimento de metas anuais de descarbonização mediante aquisição e aposentadoria de Créditos de Descarbonização (CBIOs) na B3.',
    quemAfeta: [
      'Distribuidoras de combustíveis',
      'Produtores e importadores de etanol, biodiesel e biometano',
    ],
    acaoRecomendada:
      'Acompanhar a Nota de Eficiência Energético-Ambiental da certificação e realizar conciliação probatória das faturas fiscais de biometano/etanol.',
    baseLegal: 'Lei Federal 13.576/2017 e resoluções anuais do CNPE/ANP',
    tagSetorial: 'Ambiental/ESG',
  },
  {
    id: 'eudr_anti_desmatamento',
    dataMarco: '2025 / 2026',
    ano: '2026',
    norma: 'Regulamento (UE) 2023/1115 (EUDR)',
    status: 'Vigente',
    titulo: 'EUDR: Regulamento Anti-Desmatamento da União Europeia',
    descricaoCurta:
      'Proíbe a colocação ou exportação para a União Europeia de produtos derivados de áreas desmatadas após 31/12/2020. Exige geolocalização por polígono da propriedade rural de origem e declaração de diligência prévia (Due Diligence).',
    quemAfeta: [
      'Cadeias produtivas de soja, carne bovina, café, cacau, madeira, borracha e óleo de palma e seus derivados',
    ],
    acaoRecomendada:
      'Vincular o Cadastro Ambiental Rural (CAR) e coordenadas geodésicas às NF-e de entrada e emitir selos de procedência verificada no protocolo Orbis.',
    baseLegal: 'Regulamento da União Europeia 2023/1115',
    tagSetorial: 'Comércio Exterior',
  },
  {
    id: 'csrd_csddd_ue',
    dataMarco: '2024 - 2027',
    ano: '2026',
    norma: 'Diretiva CSRD (2022/2464) & Diretiva CSDDD (2024/1760)',
    status: 'Vigente',
    titulo: 'CSRD & CSDDD (UE): Due Diligence e Reporte de Sustentabilidade Corporativa',
    descricaoCurta:
      'Diretivas europeias de sustentabilidade corporativa e dever de diligência devida nos direitos humanos e ambientais em toda a cadeia global de suprimentos (Scope 3 upstream/downstream). Fornecedores de multinacionais europeias devem auditar suas operações.',
    quemAfeta: [
      'Fornecedores brasileiros e latino-americanos de empresas europeias ou multinacionais cotadas em bolsa na UE',
    ],
    acaoRecomendada:
      'Disponibilizar relatórios padronizados de sustentabilidade (IFRS S1/S2 e GHG Protocol) com verificação independente probatória para clientes B2B globais.',
    baseLegal: 'Diretivas Europeias CSRD 2022/2464/EU e CSDDD 2024/1760/EU',
    tagSetorial: 'Ambiental/ESG',
  },
]
