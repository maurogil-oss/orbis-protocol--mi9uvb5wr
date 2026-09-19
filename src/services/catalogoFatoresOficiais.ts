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
    valorFator: 2.85,
    unidade: 'kgCO₂e/kg',
    tipoImpacto: 'emissao_evitada',
    fonteOficial: 'WorldSteel Association / IED / MCTI',
    anoReferencia: 2024,
    normaPadrao: 'ISO 14040/14044 (ACV de Aço Virgem Primário)',
    tierIncerteza: 'Tier 3',
    incertezaPct: 3.5,
    detalheTecnico:
      'Emissão evitada na reciclagem ou reúso direto: evita a rota primária de alto-forno a carvão fóssil/coque metalúrgico (~2,85 kgCO₂e/kg de aço bruto virgem).',
  },
  {
    id: 'mat-aluminio',
    categoria: 'cdv_materiais',
    nomeMaterial: 'Alumínio Primário Automotivo',
    descricao:
      'Rodas de liga leve, blocos de motor, cabeçotes, braços de suspensão e carcaças de transmissão.',
    valorFator: 8.2,
    unidade: 'kgCO₂e/kg',
    tipoImpacto: 'emissao_evitada',
    fonteOficial: 'International Aluminium Institute (IAI)',
    anoReferencia: 2023,
    normaPadrao: 'IAI LCA Guidelines • ISO 14067',
    tierIncerteza: 'Tier 3',
    incertezaPct: 4.0,
    detalheTecnico:
      'Evita o refino eletrolítico primário de bauxita (processo Hall-Héroult com anodo de carbono), altamente intensivo em energia elétrica fóssil internacional.',
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
    fonteOficial: 'International Copper Association (ICA)',
    anoReferencia: 2023,
    normaPadrao: 'ICA Life Cycle Assessment Report',
    tierIncerteza: 'Tier 3',
    incertezaPct: 4.5,
    detalheTecnico:
      'Evita mineração e pirometalurgia primária de sulfeto de cobre (fator médio global virgem de 5,40 kgCO₂e por kg de catodo refinado).',
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
    fonteOficial: 'PlasticsEurope LCA Dataset',
    anoReferencia: 2023,
    normaPadrao: 'Eco-profiles of the European Plastics Industry',
    tierIncerteza: 'Tier 2',
    incertezaPct: 5.0,
    detalheTecnico:
      'Substitui a síntese de resinas petroquímicas virgens derivadas de nafta ou gás natural em craqueadores térmicos.',
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
    fonteOficial: 'Orbis dMRV Baseline Conservadora',
    anoReferencia: 2024,
    normaPadrao: 'Diretiva de Conservadorismo dMRV • ISO 14064-1',
    tierIncerteza: 'Tier 1',
    incertezaPct: 10.0,
    detalheTecnico:
      'Fator piso conservador aplicado preventivamente pelo motor da plataforma para evitar superestimação quando não houver laudo laboratorial de liga metálica.',
  },
  {
    id: 'insetting-peca',
    categoria: 'cdv_materiais',
    nomeMaterial: 'Insetting Circular de Peça Usada Reutilizada',
    descricao:
      'Crédito por evitação de manufatura virgem de peça automotiva pronta reincorporada à frota.',
    valorFator: -24.5,
    unidade: 'kgCO₂e/peça',
    tipoImpacto: 'credito_insetting',
    fonteOficial: 'ISO 14067 / Programa MOVER / ABREE',
    anoReferencia: 2024,
    normaPadrao: 'ISO 14067:2018 (Insetting Circular em Cadeia Fechada)',
    tierIncerteza: 'Tier 3',
    incertezaPct: 5.0,
    detalheTecnico:
      'Crédito líquido ponderado da peça média reutilizada com certificado de integridade mecânica, estancando a necessidade de peça nova importada.',
  },

  // 2. Combustíveis de Frota e Instalações (Escopo 1)
  {
    id: 'comb-diesel-s10',
    categoria: 'combustiveis',
    nomeMaterial: 'Óleo Diesel Comercial S10 (B14)',
    descricao:
      'Combustível de caminhões pesados, caminhonetes e grupos geradores a diesel em operação fabril.',
    valorFator: 2.295,
    unidade: 'kgCO₂e/L',
    tipoImpacto: 'emissao_direta',
    fonteOficial: 'GHG Protocol Brasil / ANP',
    anoReferencia: 2024,
    normaPadrao: 'PBGHG v2024.1.0 (GWP IPCC AR6)',
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
      'Combustível de veículos leves de frota e equipes comerciais (mistura com 27% etanol anidro).',
    valorFator: 1.646,
    unidade: 'kgCO₂e/L',
    tipoImpacto: 'emissao_direta',
    fonteOficial: 'GHG Protocol Brasil / ANP',
    anoReferencia: 2024,
    normaPadrao: 'PBGHG v2024.1.0 (GWP IPCC AR6)',
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
    descricao: 'Biocombustível 100% canavieiro para abastecimento direto de veículos flex.',
    valorFator: 0.011,
    unidade: 'kgCO₂e/L',
    tipoImpacto: 'emissao_direta',
    fonteOficial: 'GHG Protocol Brasil / ANP',
    anoReferencia: 2024,
    normaPadrao: 'PBGHG v2024.1.0 • Balanço Biogênico de Ciclo Curto',
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
      'Gás natural canalizado para caldeiras, estufas de pintura e frotas adaptadas a gás.',
    valorFator: 1.996,
    unidade: 'kgCO₂e/m³',
    tipoImpacto: 'emissao_direta',
    fonteOficial: 'MCTI / GHG Protocol Brasil',
    anoReferencia: 2024,
    normaPadrao: 'MCTI Fatores de Combustão Fóssil',
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
    descricao: 'Gás envasado ou a granel para empilhadeiras fabris e aquecimento industrial.',
    valorFator: 2.989,
    unidade: 'kgCO₂e/kg',
    tipoImpacto: 'emissao_direta',
    fonteOficial: 'GHG Protocol Brasil / Balanço Energético EPE',
    anoReferencia: 2024,
    normaPadrao: 'EPE BEN 2024',
    tierIncerteza: 'Tier 2',
    incertezaPct: 3.5,
    detalheTecnico:
      '2,980 kg CO₂ fóssil/kg derivado da mistura balanceada de propano e butano comercial.',
  },

  // 3. Eletricidade e Matriz Energética (Escopo 2)
  {
    id: 'energia-sin-localizacao',
    categoria: 'energia_eletrica',
    nomeMaterial: 'Eletricidade Rede SIN (Localização MCTI)',
    descricao:
      'Consumo fático de energia elétrica da rede pública do Sistema Interligado Nacional (NF3-e / Fatura Concessionária).',
    valorFator: 0.0486,
    unidade: 'kgCO₂e/kWh',
    tipoImpacto: 'emissao_indireta',
    fonteOficial: 'MCTI - Ministério da Ciência, Tecnologia e Inovação',
    anoReferencia: 2024,
    normaPadrao: 'MCTI SIN 2024 (Média Anual Oficial Ponderada)',
    tierIncerteza: 'Tier 3',
    incertezaPct: 2.0,
    detalheTecnico:
      'Fator oficial médio do grid brasileiro: reflete a alta penetração hidrelétrica, eólica e solar da matriz interligada nacional. Emissão fóssil de 0,0485 kgCO₂/kWh.',
  },
  {
    id: 'energia-irec-mercado',
    categoria: 'energia_eletrica',
    nomeMaterial: 'Eletricidade Renovável Assegurada (I-REC / Mercado)',
    descricao:
      'Contratos de Ambiente de Contratação Livre (ACL) com Certificados de Energia Renovável I-REC cancelados.',
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
    nomeMaterial: 'Transporte Rodoviário Terceirizado de Cargas',
    descricao:
      'Frete rodoviário de peças, sucatas e matérias-primas por tonelada movimentada a cada quilômetro (CT-e / MDF-e).',
    valorFator: 0.099,
    unidade: 'kgCO₂e/t.km',
    tipoImpacto: 'emissao_indireta',
    fonteOficial: 'GLEC Framework v3.0 / GHG Protocol Brasil',
    anoReferencia: 2024,
    normaPadrao: 'GLEC Framework v3.0 Rodoviário Brasil (Média Carga Geral)',
    tierIncerteza: 'Tier 1',
    incertezaPct: 12.0,
    detalheTecnico:
      'Calculado por produto tonelada × quilômetro: 0,098 kg CO₂ fóssil + 0,016 kg CO₂ biogênico do biodiesel B14 por t.km.',
  },
  {
    id: 'transp-aereo-pkm',
    categoria: 'transporte_logistica',
    nomeMaterial: 'Transporte Aéreo de Passageiros (Business Travel)',
    descricao: 'Deslocamentos aéreos domésticos de executivos, peritos e auditores (BP-e).',
    valorFator: 0.1335,
    unidade: 'kgCO₂e/passageiro.km',
    tipoImpacto: 'emissao_indireta',
    fonteOficial: 'ICAO / UK DEFRA / GHG Protocol',
    anoReferencia: 2024,
    normaPadrao: 'DEFRA Flight Domestic Emission Factor',
    tierIncerteza: 'Tier 2',
    incertezaPct: 8.0,
    detalheTecnico:
      'Fator ponderado por assento-quilômetro incluindo efeitos de forçamento radiativo médio em altitude.',
  },

  // 5. Utilidades e Tratamento
  {
    id: 'util-agua-saneamento',
    categoria: 'utilidades_residuos',
    nomeMaterial: 'Água Encanada e Tratamento de Efluentes Industriais',
    descricao:
      'Captação, potabilização e tratamento aeróbio/anaeróbio de efluentes sanitários e industriais.',
    valorFator: 0.347,
    unidade: 'kgCO₂e/m³',
    tipoImpacto: 'emissao_indireta',
    fonteOficial: 'SNIS / Sabesp / UK DEFRA Water Supply',
    anoReferencia: 2024,
    normaPadrao: 'SNIS 2024 • DEFRA Water Supply and Treatment',
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
  ],
} as const
