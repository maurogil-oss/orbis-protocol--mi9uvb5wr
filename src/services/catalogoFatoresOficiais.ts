/**
 * CATÁLOGO OFICIAL DE FATORES DE EMISSÃO E INSETTING CO₂e (ORBIS PROTOCOL)
 *
 * Versão do Catálogo: v2025.2 (Vigência a partir de 01/01/2025)
 *
 * Princípio Fundamental de Arquitetura:
 * "O fator aplicado a cada peça, lote ou documento fiscal é congelado (snapshot)
 * no documento no momento da emissão — mudanças futuras no catálogo nunca alteram
 * retroativamente documentos emitidos no passado."
 *
 * Fontes Reconhecidas:
 * - WorldSteel Association (LCI/ACV de Aço Laminado / Estampado)
 * - International Aluminium Institute - IAI (ACV de Alumínio Primário Automotivo)
 * - International Copper Association - ICA (ACV de Cobre e Bobinamentos Elétricos)
 * - PlasticsEurope LCA Dataset (PP, EPDM, ABS e Termoplásticos de Engenharia)
 * - IPCC AR6 (Sixth Assessment Report, 2021/2023 - GWP100 com feedbacks climáticos)
 * - MCTI / SIN (Fatores Médios Mensais e Anuais da Rede Elétrica Nacional)
 * - GHG Protocol Programa Brasileiro (Tabela PBGHG Oficial)
 * - Diretiva ELV 2000/53/EC e ISO 14067 (Pegada de Carbono de Produto e Insetting)
 */

export interface FatorCatalogoItem {
  id: string
  categoria:
    | 'cdv_materiais' // Materiais da Desmontagem Veicular (DPP)
    | 'combustiveis' // Combustíveis Fósseis e Renováveis
    | 'energia_eletrica' // Rede SIN e Mercado Livre I-REC
    | 'transporte_logistica' // Frete Terceirizado e Passageiros
    | 'utilidades_residuos' // Água, Saneamento, Telecom e Insetting
  nomeMaterial: string
  descricao: string
  valorFator: number // Valor numérico principal do fator
  unidade: string // Ex: kgCO₂e/kg, kgCO₂e/L, kgCO₂e/kWh
  tipoImpacto: 'emissao_evitada' | 'emissao_direta' | 'emissao_indireta' | 'credito_insetting'
  fonteOficial: string
  anoReferencia: number
  normaPadrao: string
  tierIncerteza: 'Tier 1' | 'Tier 2' | 'Tier 3'
  incertezaPct: number
  detalheTecnico: string
  gasesCobertos?: {
    co2?: number
    ch4?: number
    n2o?: number
  }
}

export interface MetadadosCatalogoFatores {
  versao: string
  dataVigencia: string
  dataPublicacao: string
  orgaoResponsavel: string
  notaSnapshotCongelamento: string
  reservaPreLaudo: string
  totalFatores: number
}

export const METADADOS_CATALOGO_FATORES: MetadadosCatalogoFatores = {
  versao: 'v2025.2',
  dataVigencia: '01 de Janeiro de 2025',
  dataPublicacao: '15 de Janeiro de 2025',
  orgaoResponsavel: 'Comitê Técnico Metodológico dMRV & Conselho Consultivo Orbis Protocol',
  notaSnapshotCongelamento:
    'Snapshot Imutável: O fator de emissão ou descarbonização aplicado a cada peça, lote, nota fiscal ou laudo é estritamente congelado no corpo do documento no momento exato de sua emissão e incorporado ao hash SHA-256 canônico. Atualizações, calibrações ou novas versões deste catálogo têm vigência estritamente prospectiva e jamais retroagem para recalcular registros já assinados.',
  reservaPreLaudo:
    'Reserva Metodológica Pré-Laudo: Os fatores curados neste catálogo refletem o estado da arte de inventários de ciclo de vida (ACV) e balanços de massa oficiais. Para emissão de créditos transacionáveis de carbono em bolsas voluntárias ou cumprimento de metas compulsórias do SBCE (Lei 15.042/2024), os relatórios mantêm o status pré-laudo até homologação por Organismo de Verificação e Validação (VVB) credenciado.',
  totalFatores: 16,
}

export const CATALOGO_FATORES_CO2E: FatorCatalogoItem[] = [
  // 1. Materiais Automotivos de Desmontagem (DPP - CDV)
  {
    id: 'mat-aco',
    categoria: 'cdv_materiais',
    nomeMaterial: 'Aço Laminado / Estampado',
    descricao:
      'Chapas de carroceria, partes estruturais, portas, capôs e componentes de estampagem veicular.',
    valorFator: 2.18,
    unidade: 'kgCO₂e/kg',
    tipoImpacto: 'emissao_evitada',
    fonteOficial:
      'worldsteel "Sustainability Indicators Report 2025" (Indicador 1a GHG emissions intensity 2024)',
    anoReferencia: 2024,
    normaPadrao: 'worldsteel CO2 data collection methodology • Escopos 1, 2 e 3 Categoria 1',
    tierIncerteza: 'Tier 3',
    incertezaPct: 3.5,
    detalheTecnico:
      'Emissão evitada na reciclagem ou reúso direto: substitui a produção primária de aço bruto (média ponderada global 2024 de 2,18 tCO₂e/t das rotas BF-BOF, scrap-EAF e DRI-EAF; intensidade de CO₂ direta = 1,92 tCO₂/t). Ajustado conservadoramente de 2,85 para 2,18 kgCO₂e/kg.',
  },
  {
    id: 'mat-aluminio',
    categoria: 'cdv_materiais',
    nomeMaterial: 'Alumínio Primário Automotivo (Fallback Global)',
    descricao:
      'Rodas de liga leve, blocos de motor, cabeçotes, braços de suspensão e carcaças de transmissão.',
    valorFator: 14.4,
    unidade: 'kgCO₂e/kg',
    tipoImpacto: 'emissao_evitada',
    fonteOficial:
      'International Aluminium Institute (IAI), Primary Aluminium Greenhouse Gas Emissions Intensity (emissão 2024, tabela Primary Aluminium — Total Cradle-to-Gate: 14,4 tCO₂e/t Al)',
    anoReferencia: 2024,
    normaPadrao: 'IAI Cradle-to-Gate Guidance • ISO 14067 / ISO 14040/44',
    tierIncerteza: 'Tier 3',
    incertezaPct: 4.0,
    detalheTecnico:
      'Fallback global citável e conservador aplicado como padrão do motor v2: 14,40 kgCO₂e/kg. Decomposição verificada IAI 2024 berço-ao-portão: eletricidade-indireta 8,5 + PFC-direto 0,9 + processo CO₂-direto 1,5 + materiais auxiliares-indireto 1,3 + energia térmica 1,6 + transporte 0,5 = 14,4 tCO₂e/t Al. URL: https://international-aluminium.org/statistics/greenhouse-gas-emissions-intensity-primary-aluminium/. CENÁRIO ALTERNATIVO REGIONAL BR (HIDRELÉTRICA): ~10,00 kgCO₂e/kg (IAI Aluminium Carbon Footprint FAQs, gráfico indicativo por fonte de eletricidade hidrelétrica ~10 tCO₂e/t; URL: https://international-aluminium.org/landing/aluminium-carbon-footprint-faqs/). O cenário regional é INDICATIVO, não-default do motor, ativável exclusivamente com evidência documental própria por lote/peça (EPD de fundição ou LCI regional), respeitando a hierarquia de fatores (§7 DM-ORB-001). Nota de decisão do titular: "Ancorado na produção global média IAI 2024 (fallback conservador); cenário regional hidrelétrico BR (~10,0, IAI FAQs indicativo) ativável somente com evidência documental própria por peça/lote."',
  },
  {
    id: 'mat-cobre',
    categoria: 'cdv_materiais',
    nomeMaterial: 'Cobre / Bobinamentos Elétricos',
    descricao:
      'Fiações de chicotes, bobinas de alternadores, motores de arranque, atuadores e estatores.',
    valorFator: 5.4,
    unidade: 'kgCO₂e/kg',
    tipoImpacto: 'emissao_evitada',
    fonteOficial:
      'CopperMark "Decarbonizing the Copper Sector" (2024, base ICA, rota pirometalúrgica)',
    anoReferencia: 2024,
    normaPadrao: 'ICA Life Cycle Assessment • Rota Pirometalúrgica Berço-ao-Portão',
    tierIncerteza: 'Tier 3',
    incertezaPct: 4.5,
    detalheTecnico:
      'Evita mineração e pirometalurgia primária de sulfeto de cobre: intensidade berço-ao-portão de catodo de cobre refinado é 5,3 tCO₂e/t; o valor adotado de 5,40 kgCO₂e/kg incorpora margem conservadora de refino final e estamparia elétrica.',
  },
  {
    id: 'mat-polimeros',
    categoria: 'cdv_materiais',
    nomeMaterial: 'Polímeros Automotivos (PP / EPDM / ABS)',
    descricao:
      'Parachoques termoplásticos, forros de porta, painéis de instrumentos, carcaças de filtro e spoilers.',
    valorFator: 1.9,
    unidade: 'kgCO₂e/kg',
    tipoImpacto: 'emissao_evitada',
    fonteOficial: 'PlasticsEurope Eco-profiles (PCR ISO 14025, declared unit 1 kg resina at gate)',
    anoReferencia: 2023,
    normaPadrao: 'Eco-profiles of the European Plastics Industry • ISO 14025 / ISO 14040/44',
    tierIncerteza: 'Tier 2',
    incertezaPct: 5.0,
    detalheTecnico:
      'Substitui a síntese de resinas petroquímicas virgens at gate. Literatura revisada PlasticsEurope apresenta faixa de 1,91 a 5,70 kgCO₂e/kg por polímero automotivo; o fator 1,90 kgCO₂e/kg corresponde à ponta inferior mais conservadora da classe (polipropileno - PP). Dataset EU adotado como proxy internacional defensável.',
  },
  {
    id: 'mat-outros',
    categoria: 'cdv_materiais',
    nomeMaterial: 'Outros Materiais (Estimativa Conservadora)',
    descricao:
      'Materiais compósitos, vidros, espelhos retrovisores, tecidos sintéticos ou peças de composição mista.',
    valorFator: 1.5,
    unidade: 'kgCO₂e/kg',
    tipoImpacto: 'emissao_evitada',
    fonteOficial:
      'Orbis dMRV Baseline Conservadora (derivação interna conservadora — procedimento sob publicação)',
    anoReferencia: 2024,
    normaPadrao: 'Diretiva de Conservadorismo dMRV • ISO 14064-1',
    tierIncerteza: 'Tier 1',
    incertezaPct: 10.0,
    detalheTecnico:
      'Derivação interna conservadora (procedimento metodológico sob publicação formal): piso protetivo calculado sobre média harmônica ponderada de insumos industriais automotivos secundários com margem de segurança conservadora de 25% para evitar superestimação de peças compósitas ou sem identificação material inequívoca.',
  },
  {
    id: 'mat-r134a-refrigerante',
    categoria: 'cdv_materiais',
    nomeMaterial: 'Gás Refrigerante R-134a (HFC-134a Recuperado)',
    descricao:
      'Fluido halogenado recuperado na drenagem obrigatória do sistema de climatização veicular (despoluição prévia).',
    valorFator: 1530.0,
    unidade: 'kgCO₂e/kg',
    tipoImpacto: 'emissao_evitada',
    fonteOficial: 'IPCC AR6 WG1 Capítulo 7 Tabela 7.15 (GWP 100 com feedbacks de carbono)',
    anoReferencia: 2023,
    normaPadrao: 'IPCC AR6 WG1 Tab. 7.15 • Resolução CONAMA 267/2000',
    tierIncerteza: 'Tier 3',
    incertezaPct: 2.0,
    detalheTecnico:
      'Evita emissão fugitiva direta e demanda de fluido virgem. Fator GWP100 oficial fixado em 1.530 kgCO₂e/kg com fator de deslocamento DF=1,0 quando comprovada a regeneração ou incineração em parque licenciado.',
  },

  // 2. Combustíveis de Frota e Instalações (Escopo 1)
  {
    id: 'comb-diesel-s10',
    categoria: 'combustiveis',
    nomeMaterial: 'Óleo Diesel Comercial S10 (B14)',
    descricao:
      'Combustível de caminhões pesados, caminhonetes e grupos geradores a diesel em operação fabril (Escopo 1).',
    valorFator: 2.295,
    unidade: 'kgCO₂e/L',
    tipoImpacto: 'emissao_direta',
    fonteOficial: 'GHG Protocol Brasil / ANP',
    anoReferencia: 2025,
    normaPadrao: 'PBGHG v2025.1 (GWP IPCC AR6)',
    tierIncerteza: 'Tier 2',
    incertezaPct: 4.5,
    detalheTecnico:
      'Parcela fóssil (86%) do diesel B14: 2,270 kg CO₂ fóssil + 0,00012 kg CH₄ + 0,00008 kg N₂O ponderados pelo AR6. Parcela biogênica: 0,38 kg CO₂/L relatada à parte.',
    gasesCobertos: { co2: 2.27, ch4: 0.00012, n2o: 0.00008 },
  },
  {
    id: 'comb-gasolina-c',
    categoria: 'combustiveis',
    nomeMaterial: 'Gasolina Comum Comercial Tipo C',
    descricao:
      'Combustível de veículos leves de frota e equipes comerciais (mistura com 27% etanol anidro) (Escopo 1).',
    valorFator: 1.646,
    unidade: 'kgCO₂e/L',
    tipoImpacto: 'emissao_direta',
    fonteOficial: 'GHG Protocol Brasil / ANP',
    anoReferencia: 2025,
    normaPadrao: 'PBGHG v2025.1 (GWP IPCC AR6)',
    tierIncerteza: 'Tier 2',
    incertezaPct: 4.0,
    detalheTecnico:
      'Parcela fóssil da gasolina: 1,620 kg CO₂ + CH₄ e N₂O pelo AR6. Parcela biogênica do anidro: 0,59 kg CO₂/L separada.',
    gasesCobertos: { co2: 1.62, ch4: 0.00025, n2o: 0.00007 },
  },
  {
    id: 'comb-etanol-hidratado',
    categoria: 'combustiveis',
    nomeMaterial: 'Etanol Hidratado Combustível (EHC)',
    descricao:
      'Biocombustível 100% canavieiro para abastecimento direto de veículos flex (Escopo 1).',
    valorFator: 0.011,
    unidade: 'kgCO₂e/L',
    tipoImpacto: 'emissao_direta',
    fonteOficial: 'GHG Protocol Brasil / ANP',
    anoReferencia: 2025,
    normaPadrao: 'PBGHG v2025.1 • Balanço Biogênico de Ciclo Curto',
    tierIncerteza: 'Tier 2',
    incertezaPct: 5.0,
    detalheTecnico:
      'Emissão fóssil direta praticamente nula na queima (0,011 kgCO₂e/L de traços de CH₄ e N₂O). Emissão biogênica de 1,510 kg CO₂/L compensada pela reabsorção fotossintética do canavial.',
    gasesCobertos: { co2: 0.0, ch4: 0.00009, n2o: 0.00003 },
  },
  {
    id: 'comb-gas-natural',
    categoria: 'combustiveis',
    nomeMaterial: 'Gás Natural Veicular / Industrial (GNV / GN)',
    descricao:
      'Gás natural canalizado para caldeiras, estufas de pintura e frotas adaptadas a gás (Escopo 1).',
    valorFator: 1.996,
    unidade: 'kgCO₂e/m³',
    tipoImpacto: 'emissao_direta',
    fonteOficial: 'MCTI / GHG Protocol Brasil',
    anoReferencia: 2025,
    normaPadrao: 'PBGHG v2025.1 / MCTI Fatores de Combustão Fóssil',
    tierIncerteza: 'Tier 2',
    incertezaPct: 4.0,
    detalheTecnico:
      '1,990 kg CO₂ fóssil por metro cúbico nas CNTP + fatores de metano não queimado.',
    gasesCobertos: { co2: 1.99, ch4: 0.00004, n2o: 0.00002 },
  },
  {
    id: 'comb-glp',
    categoria: 'combustiveis',
    nomeMaterial: 'Gás Liquefeito de Petróleo (GLP)',
    descricao:
      'Gás envasado ou a granel para empilhadeiras fabris e aquecimento industrial (Escopo 1).',
    valorFator: 2.989,
    unidade: 'kgCO₂e/kg',
    tipoImpacto: 'emissao_direta',
    fonteOficial: 'GHG Protocol Brasil / Balanço Energético EPE',
    anoReferencia: 2025,
    normaPadrao: 'PBGHG v2025.1 / EPE BEN 2025',
    tierIncerteza: 'Tier 2',
    incertezaPct: 3.5,
    detalheTecnico:
      '2,980 kg CO₂ fóssil/kg derivado da mistura balanceada de propano e butano comercial.',
  },

  // 3. Eletricidade e Matriz Energética (Escopo 2 - Dual Reporting: Location-based e Market-based)
  {
    id: 'energia-sin-localizacao',
    categoria: 'energia_eletrica',
    nomeMaterial: 'Eletricidade Rede SIN (Escopo 2 - Localização MCTI)',
    descricao:
      'Consumo fático de energia elétrica da rede pública do Sistema Interligado Nacional (NF3-e / Fatura Concessionária) - Escopo 2 baseado na localização com atualização anual automática.',
    valorFator: 0.0486,
    unidade: 'kgCO₂e/kWh',
    tipoImpacto: 'emissao_indireta',
    fonteOficial: 'MCTI - Ministério da Ciência, Tecnologia e Inovação',
    anoReferencia: 2024,
    normaPadrao: 'MCTI SIN 2024 • GHG Protocol Scope 2 (Location-based)',
    tierIncerteza: 'Tier 3',
    incertezaPct: 2.0,
    detalheTecnico:
      'Fator oficial médio do grid brasileiro: reflete a alta penetração hidrelétrica, eólica e solar da matriz interligada nacional. Emissão fóssil de 0,0485 kgCO₂/kWh. Atualizado anualmente pelo MCTI no primeiro trimestre.',
  },
  {
    id: 'energia-irec-mercado',
    categoria: 'energia_eletrica',
    nomeMaterial: 'Eletricidade Renovável Assegurada (Escopo 2 - Mercado I-REC)',
    descricao:
      'Contratos de Ambiente de Contratação Livre (ACL) com Certificados de Energia Renovável I-REC cancelados - Escopo 2 baseado no mercado.',
    valorFator: 0.0,
    unidade: 'kgCO₂e/kWh',
    tipoImpacto: 'emissao_indireta',
    fonteOficial: 'The International REC Standard / GHG Protocol Scope 2',
    anoReferencia: 2024,
    normaPadrao: 'GHG Protocol Scope 2 Guidance (Market-based)',
    tierIncerteza: 'Tier 3',
    incertezaPct: 1.0,
    detalheTecnico:
      'Fator zero assegurado mediante cancelamento e aposentadoria irrevogável do certificado I-REC na plataforma rastreada.',
  },

  // 4. Transporte e Logística Upstream/Downstream (Escopo 3)
  {
    id: 'transp-rodoviario-tkm',
    categoria: 'transporte_logistica',
    nomeMaterial: 'Transporte Rodoviário Terceirizado de Cargas (Escopo 3 Cat. 4)',
    descricao:
      'Frete rodoviário de peças, sucatas e matérias-primas por tonelada movimentada a cada quilômetro (CT-e / MDF-e) - Escopo 3 Categoria 4 (Transporte e distribuição upstream).',
    valorFator: 0.099,
    unidade: 'kgCO₂e/t.km',
    tipoImpacto: 'emissao_indireta',
    fonteOficial: 'GLEC Framework v3.0 / GHG Protocol Brasil',
    anoReferencia: 2024,
    normaPadrao: 'GLEC Framework v3.0 Rodoviário Brasil • Escopo 3 Cat. 4',
    tierIncerteza: 'Tier 1',
    incertezaPct: 12.0,
    detalheTecnico:
      'Calculado por produto tonelada × quilômetro: 0,098 kg CO₂ fóssil + 0,016 kg CO₂ biogênico do biodiesel B14 por t.km.',
  },
  {
    id: 'transp-aereo-pkm',
    categoria: 'transporte_logistica',
    nomeMaterial: 'Transporte Aéreo de Passageiros (Escopo 3 Cat. 6)',
    descricao:
      'Deslocamentos aéreos domésticos de executivos, peritos e auditores (BP-e) - Escopo 3 Categoria 6 (Viagens a negócios).',
    valorFator: 0.1335,
    unidade: 'kgCO₂e/passageiro.km',
    tipoImpacto: 'emissao_indireta',
    fonteOficial: 'ICAO / UK DEFRA / GHG Protocol',
    anoReferencia: 2024,
    normaPadrao: 'DEFRA Flight Domestic Emission Factor • Escopo 3 Cat. 6',
    tierIncerteza: 'Tier 2',
    incertezaPct: 8.0,
    detalheTecnico:
      'Fator ponderado por assento-quilômetro incluindo efeitos de forçamento radiativo médio em altitude.',
  },

  // 5. Utilidades e Tratamento (Escopo 3 Cat. 1 / Cat. 5)
  {
    id: 'util-agua-saneamento',
    categoria: 'utilidades_residuos',
    nomeMaterial: 'Água Encanada e Tratamento de Efluentes Industriais (Escopo 3 Cat. 1/5)',
    descricao:
      'Captação, potabilização e tratamento aeróbio/anaeróbio de efluentes sanitários e industriais - Escopo 3 Categoria 1 (Bens e serviços comprados) e Categoria 5 (Resíduos gerados nas operações).',
    valorFator: 0.347,
    unidade: 'kgCO₂e/m³',
    tipoImpacto: 'emissao_indireta',
    fonteOficial: 'SNIS / Sabesp / UK DEFRA Water Supply',
    anoReferencia: 2024,
    normaPadrao: 'SNIS 2024 • DEFRA Water Supply and Treatment • Escopo 3 Cat. 1/5',
    tierIncerteza: 'Tier 2',
    incertezaPct: 6.0,
    detalheTecnico:
      'Ciclo completo de utilidade pública: 0,344 kgCO₂e de energia de bombeamento e reagentes químicos por m³ faturado.',
  },
]

/**
 * Potenciais de Aquecimento Global (GWP 100) - IPCC Sexto Relatório de Avaliação (AR6 2021/2023)
 * Aplicado obrigatoriamente pelo motor Orbis dMRV em conformidade com o SBCE (Lei 15.042/2024).
 */
export const GWP_IPCC_AR6_OFICIAL = {
  versao: 'IPCC AR6 (Sixth Assessment Report - WGI Tabela 7.15)',
  periodo: 'GWP 100 anos com feedbacks de carbono',
  gases: [
    {
      gas: 'Dióxido de Carbono (CO₂)',
      formula: 'CO₂',
      gwp: 1,
      vidaAtmosfericaAnos: 'Centenas a milhares de anos',
      fonte: 'IPCC AR6 WGI',
    },
    {
      gas: 'Metano Fóssil (CH₄ Fóssil)',
      formula: 'CH₄ (fóssil)',
      gwp: 29.8,
      vidaAtmosfericaAnos: '11.8 anos',
      fonte: 'IPCC AR6 WGI (Tabela 7.15 com feedback)',
    },
    {
      gas: 'Metano Não-Fóssil / Biogênico (CH₄ Bio)',
      formula: 'CH₄ (bio)',
      gwp: 27.2,
      vidaAtmosfericaAnos: '11.8 anos',
      fonte: 'IPCC AR6 WGI',
    },
    {
      gas: 'Óxido Nitroso (N₂O)',
      formula: 'N₂O',
      gwp: 273,
      vidaAtmosfericaAnos: '109 anos',
      fonte: 'IPCC AR6 WGI',
    },
    {
      gas: 'Hexafluoreto de Enxofre (SF₆)',
      formula: 'SF₆',
      gwp: 25200,
      vidaAtmosfericaAnos: '3.200 anos',
      fonte: 'IPCC AR6 WGI',
    },
    {
      gas: '1,1,1,2-Tetrafluoroetano (HFC-134a / R-134a)',
      formula: 'CH₂FCF₃ (R-134a)',
      gwp: 1530,
      vidaAtmosfericaAnos: '14.0 anos',
      fonte: 'IPCC AR6 WGI (Tabela 7.15 com feedbacks)',
    },
  ],
} as const
