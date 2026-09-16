/**
 * TABELAS CURADAS DE FATORES DE EMISSÃO OFICIAIS (MCTI, GHG PROTOCOL BRASIL, IPCC AR6)
 *
 * Rastreabilidade completa:
 * - MCTI / SIN: Sistema Interligado Nacional (Fatores médios mensais/anuais da rede elétrica)
 * - GHG Protocol Programa Brasileiro (Tabela v2024.1.0)
 * - IPCC Sexto Relatório de Avaliação (AR6, 2021/2023) - Métricas GWP100 (Global Warming Potential)
 * - ISO 14067: Insetting e Pegada de Carbono de Produtos na Cadeia Automotiva / CDV
 */

export interface FatorEmissaoCurado {
  id: string
  categoria:
    | 'combustivel_fossil'
    | 'biocombustivel'
    | 'eletricidade'
    | 'transporte'
    | 'efluente_agua'
    | 'residuos'
  fonte: string
  anoReferencia: number
  versaoTabela: string
  unidade: string
  // Fatores em kg de cada gás por unidade
  kgCO2: number
  kgCH4: number
  kgN2O: number
  // GWP AR6 (IPCC 2021): CO2 = 1, CH4 fóssil = 29.8, N2O = 273
  // tCO2e fóssil calculado
  fatorFossilTCO2e: number
  // Emissões biogênicas separadas (kg CO2 bio por unidade)
  kgCO2Biogenico: number
  tierIncertezaPadrao: 'Tier 1' | 'Tier 2' | 'Tier 3'
  incertezaPadraoPct: number // ±%
  descricao: string
}

/**
 * Potenciais de Aquecimento Global (GWP 100 anos) - IPCC AR6 (Sixth Assessment Report)
 * CH₄ fóssil = 29,8 (com feedbacks climáticos / AR6 WGI Tabela 7.15); N₂O = 273
 */
export const GWP_AR6 = {
  CO2: 1,
  CH4_fossil: 29.8,
  CH4_biogenico: 27.2,
  N2O: 273,
} as const

/**
 * Fatores Oficiais Curados de Combustíveis e Insumos
 */
export const FATORES_EMISSAO_CURADOS: Record<string, FatorEmissaoCurado> = {
  // 1. Diesel Comercial S10 (B14 - 86% fóssil + 14% biodiesel obrigatório 2024)
  diesel_s10: {
    id: 'diesel_s10',
    categoria: 'combustivel_fossil',
    fonte: 'GHG Protocol Brasil / ANP',
    anoReferencia: 2024,
    versaoTabela: 'PBGHG 2024.1.0',
    unidade: 'litros',
    kgCO2: 2.27, // Parcela fóssil do litro com B14
    kgCH4: 0.00012,
    kgN2O: 0.00008,
    // (2.27*1 + 0.00012*29.8 + 0.00008*273) / 1000 = ~0.002295 tCO2e/L
    fatorFossilTCO2e: 0.002295,
    kgCO2Biogenico: 0.38, // Parcela biogênica do biodiesel B14
    tierIncertezaPadrao: 'Tier 2',
    incertezaPadraoPct: 4.5,
    descricao: 'Óleo Diesel S10 (mistura obrigatória B14 vigente em 2024)',
  },

  // 2. Gasolina Comum C (27% etanol anidro)
  gasolina_c: {
    id: 'gasolina_c',
    categoria: 'combustivel_fossil',
    fonte: 'GHG Protocol Brasil / ANP',
    anoReferencia: 2024,
    versaoTabela: 'PBGHG 2024.1.0',
    unidade: 'litros',
    kgCO2: 1.62,
    kgCH4: 0.00025,
    kgN2O: 0.00007,
    fatorFossilTCO2e: 0.001646,
    kgCO2Biogenico: 0.59,
    tierIncertezaPadrao: 'Tier 2',
    incertezaPadraoPct: 4.0,
    descricao: 'Gasolina Comum tipo C (mistura 27% etanol anidro)',
  },

  // 3. Etanol Hidratado (Biocombustível 100% biogênico no ciclo)
  etanol_hidratado: {
    id: 'etanol_hidratado',
    categoria: 'biocombustivel',
    fonte: 'GHG Protocol Brasil',
    anoReferencia: 2024,
    versaoTabela: 'PBGHG 2024.1.0',
    unidade: 'litros',
    kgCO2: 0.0, // Fóssil zero na queima
    kgCH4: 0.00009,
    kgN2O: 0.00003,
    fatorFossilTCO2e: 0.000011, // Apenas traços de N2O e CH4 na combustão
    kgCO2Biogenico: 1.51,
    tierIncertezaPadrao: 'Tier 2',
    incertezaPadraoPct: 5.0,
    descricao: 'Etanol Hidratado Combustível (EHC)',
  },

  // 4. Gás Liquefeito de Petróleo (GLP)
  glp: {
    id: 'glp',
    categoria: 'combustivel_fossil',
    fonte: 'GHG Protocol Brasil / Balanço Energético Nacional EPE',
    anoReferencia: 2024,
    versaoTabela: 'PBGHG 2024.1.0',
    unidade: 'kg',
    kgCO2: 2.98,
    kgCH4: 0.00005,
    kgN2O: 0.00003,
    fatorFossilTCO2e: 0.002989,
    kgCO2Biogenico: 0.0,
    tierIncertezaPadrao: 'Tier 2',
    incertezaPadraoPct: 3.5,
    descricao: 'Gás Liquefeito de Petróleo (GLP / Botijão e Granel)',
  },

  // 5. Gás Natural Veicular / Industrial (GNV / GN)
  gnv: {
    id: 'gnv',
    categoria: 'combustivel_fossil',
    fonte: 'MCTI / GHG Protocol Brasil',
    anoReferencia: 2024,
    versaoTabela: 'PBGHG 2024.1.0',
    unidade: 'm³',
    kgCO2: 1.99,
    kgCH4: 0.00004,
    kgN2O: 0.00002,
    fatorFossilTCO2e: 0.001996,
    kgCO2Biogenico: 0.0,
    tierIncertezaPadrao: 'Tier 2',
    incertezaPadraoPct: 4.0,
    descricao: 'Gás Natural Veicular / Industrial (m³ nas CNTP)',
  },

  // 6. Eletricidade - Fator Médio do Sistema Interligado Nacional (SIN) - Localização
  eletricidade_sin_localizacao: {
    id: 'eletricidade_sin_localizacao',
    categoria: 'eletricidade',
    fonte: 'MCTI - Fatores de Emissão de CO2 do SIN',
    anoReferencia: 2024,
    versaoTabela: 'MCTI SIN 2024 (Média Anual)',
    unidade: 'kWh',
    kgCO2: 0.0485, // 0.0485 kgCO2/kWh no SIN (matriz predominantemente hídrica/renovável)
    kgCH4: 0.000001,
    kgN2O: 0.0000005,
    fatorFossilTCO2e: 0.0000486, // ~0.0486 tCO2e por 1.000 kWh (ou 0.0486 kgCO2e/kWh)
    kgCO2Biogenico: 0.008, // Pequena fração biogênica térmica de biomassa
    tierIncertezaPadrao: 'Tier 3',
    incertezaPadraoPct: 2.0,
    descricao: 'Fator Médio Oficial do SIN - Abordagem Baseada em Localização (MCTI)',
  },

  // 7. Eletricidade - Energia Renovável Certificada (I-REC / Mercado Livre com PPA Verde) - Mercado
  eletricidade_irec_mercado: {
    id: 'eletricidade_irec_mercado',
    categoria: 'eletricidade',
    fonte: 'The International REC Standard / GHG Protocol Scope 2 Guidance',
    anoReferencia: 2024,
    versaoTabela: 'GHG Protocol Scope 2 Market-based',
    unidade: 'kWh',
    kgCO2: 0.0, // Fator zero assegurado por I-REC cancelado
    kgCH4: 0.0,
    kgN2O: 0.0,
    fatorFossilTCO2e: 0.0,
    kgCO2Biogenico: 0.0,
    tierIncertezaPadrao: 'Tier 3',
    incertezaPadraoPct: 1.0,
    descricao: 'Eletricidade 100% Renovável Assegurada (I-REC / PPA Solar/Eólica)',
  },

  // 8. Transporte Rodoviário de Cargas Terceirizado (CT-e / MDF-e por t.km)
  transporte_rodoviario_tkm: {
    id: 'transporte_rodoviario_tkm',
    categoria: 'transporte',
    fonte: 'GLEC Framework v3.0 / GHG Protocol Brasil Escopo 3',
    anoReferencia: 2024,
    versaoTabela: 'GLEC v3.0 Brasil Rodoviário',
    unidade: 'tkm', // tonelada transportada x km percorrido
    kgCO2: 0.098,
    kgCH4: 0.000006,
    kgN2O: 0.000003,
    fatorFossilTCO2e: 0.000099, // ~0.099 kgCO2e/t.km
    kgCO2Biogenico: 0.016,
    tierIncertezaPadrao: 'Tier 1',
    incertezaPadraoPct: 12.0,
    descricao: 'Transporte Rodoviário de Carga Geral Pesada (Média Brasil)',
  },

  // 9. Transporte Aéreo de Passageiros (BP-e por passageiro.km)
  transporte_passageiro_aereo_km: {
    id: 'transporte_passageiro_aereo_km',
    categoria: 'transporte',
    fonte: 'ICAO / UK DEFRA / GHG Protocol',
    anoReferencia: 2024,
    versaoTabela: 'DEFRA 2024 Flight Domestic',
    unidade: 'pkm',
    kgCO2: 0.133,
    kgCH4: 0.000001,
    kgN2O: 0.000001,
    fatorFossilTCO2e: 0.0001335,
    kgCO2Biogenico: 0.0,
    tierIncertezaPadrao: 'Tier 2',
    incertezaPadraoPct: 8.0,
    descricao: 'Deslocamento Aéreo Doméstico de Passageiros (BP-e)',
  },

  // 10. Abastecimento de Água Tratada e Tratamento de Efluentes
  fatura_agua_m3: {
    id: 'fatura_agua_m3',
    categoria: 'efluente_agua',
    fonte: 'SNIS / Sabesp / GHG Protocol Escopo 3',
    anoReferencia: 2024,
    versaoTabela: 'SNIS 2024 / DEFRA Water Supply',
    unidade: 'm³',
    kgCO2: 0.344,
    kgCH4: 0.00002,
    kgN2O: 0.00001,
    fatorFossilTCO2e: 0.000347, // 0.347 kgCO2e/m³ de água e esgoto tratado
    kgCO2Biogenico: 0.0,
    tierIncertezaPadrao: 'Tier 2',
    incertezaPadraoPct: 6.0,
    descricao: 'Ciclo Integrado de Água Encanada e Esgotamento Sanitário',
  },

  // 11. Telecomunicações e Dados (NFCom por GB / assinatura corporativa)
  telecom_nfcom_gb: {
    id: 'telecom_nfcom_gb',
    categoria: 'residuos',
    fonte: 'ITU-T L.1410 / The Shift Project',
    anoReferencia: 2024,
    versaoTabela: 'ITU-T 2024 Data Centers',
    unidade: 'GB',
    kgCO2: 0.012,
    kgCH4: 0.0,
    kgN2O: 0.0,
    fatorFossilTCO2e: 0.000012,
    kgCO2Biogenico: 0.0,
    tierIncertezaPadrao: 'Tier 1',
    incertezaPadraoPct: 15.0,
    descricao: 'Tráfego de Dados e Infraestrutura Cloud/Telecom (NFCom)',
  },

  // 12. Insetting Circular de Peça Usada em CDV (ISO 14067)
  insetting_cdv_peca: {
    id: 'insetting_cdv_peca',
    categoria: 'residuos',
    fonte: 'ISO 14067 / Programa MOVER / ABREE',
    anoReferencia: 2024,
    versaoTabela: 'ISO 14067 Insetting Circular 2024',
    unidade: 'unidade',
    kgCO2: -24.5, // Emissão evitada: substitui a manufatura virgem de peça nova (aço/alumínio/polímero)
    kgCH4: 0.0,
    kgN2O: 0.0,
    fatorFossilTCO2e: -0.0245, // -24,5 kgCO2e evitados por peça reutilizada rastreada
    kgCO2Biogenico: 0.0,
    tierIncertezaPadrao: 'Tier 3',
    incertezaPadraoPct: 5.0,
    descricao: 'Insetting ISO 14067 - Crédito por Evitação de Emissões de Peça Reciclada no CDV',
  },
}
