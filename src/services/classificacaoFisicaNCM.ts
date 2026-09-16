/**
 * CLASSIFICAÇÃO FÍSICA DE ITENS COMPRADOS POR FAMÍLIAS NCM (ESCOPO 3 - CATEGORIA 1)
 *
 * Mapeamento de famílias NCM para aplicação de fatores por massa / unidade física (Tier 2 - ACV),
 * elevando itens antes apurados no método spend-based (Tier 1, ±18%).
 *
 * Declaração formal exigida: "proxy interno por NCM, validação do Revisor"
 * ATENÇÃO: NUNCA citar NCM como referência normativa (é proxy interno da plataforma).
 *
 * Famílias mapeadas:
 * - papel_celulosicos: Capítulos 47 a 49 (ex: 4802, 4819, 4821)
 * - polimeros: Capítulos 39 e 40 (ex: 3901, 3923, 4016)
 * - metais: Capítulos 72 a 83 (ex: 7210, 7310, 7609, 7616)
 * - combustiveis: Capítulo 27 (exceto 2716 - energia elétrica de rede, que pertence ao Escopo 2)
 * - eletricos: Capítulos 84 e 85 (subset de componentes eletroeletrônicos e máquinas)
 * - outros: Demais NCMs
 *
 * Fontes de Fatores Físicos (Tier 2):
 * - Ecoinvent 3.10 / WorldSteel / International Aluminium Institute (IAI) / PlasticsEurope / DEFRA
 */

export type FamiliaNCMId =
  | 'papel_celulosicos'
  | 'polimeros'
  | 'metais'
  | 'combustiveis'
  | 'eletricos'
  | 'outros'

export interface FamiliaNCMConfig {
  id: FamiliaNCMId
  nome: string
  descricao: string
  capitulosNCM: string[]
  exemplosNCM: string[]
  // Fator físico de ciclo de vida (Tier 2) em kg CO₂e por unidade física
  fatorKgCO2ePorUnidade: number
  unidadeFisica: string // 'kg', 'L', 'un'
  unidadesCompativeis: string[] // ex: ['kg', 'kilos', 'quilogramas', 'ton', 't']
  incertezaTier2Pct: number // ±8.0% a ±10.0%
  fonteACV: string
}

export const DECLARACAO_PROXY_NCM = 'proxy interno por NCM, validação do Revisor'

export const FAMILIAS_NCM_CONFIG: Record<FamiliaNCMId, FamiliaNCMConfig> = {
  papel_celulosicos: {
    id: 'papel_celulosicos',
    nome: 'Papel e Celulósicos',
    descricao: 'Caixas de papelão, bobinas, formulários contínuos, embalagens de fibra e celulose',
    capitulosNCM: ['47', '48', '49'],
    exemplosNCM: ['4802', '4819', '4821'],
    fatorKgCO2ePorUnidade: 0.92, // 0.920 kg CO2e / kg papel/papelão médio (Ecoinvent 3.10)
    unidadeFisica: 'kg',
    unidadesCompativeis: ['kg', 'kg.', 'kilos', 'quilogramas', 'ton', 't', 'un'],
    incertezaTier2Pct: 8.5,
    fonteACV: 'Ecoinvent 3.10 / FEFCO European Database (Corrugated Board)',
  },
  polimeros: {
    id: 'polimeros',
    nome: 'Polímeros e Plásticos',
    descricao:
      'Filmes plásticos (PE/PP/PET), embalagens termoformadas, borrachas e polímeros industriais',
    capitulosNCM: ['39', '40'],
    exemplosNCM: ['3901', '3902', '3923', '4016'],
    fatorKgCO2ePorUnidade: 2.15, // 2.150 kg CO2e / kg polímero virgem/mix (PlasticsEurope LCA)
    unidadeFisica: 'kg',
    unidadesCompativeis: ['kg', 'kg.', 'kilos', 'quilogramas', 'ton', 't', 'un', 'mil'],
    incertezaTier2Pct: 9.0,
    fonteACV: 'PlasticsEurope LCA Dataset / Ecoinvent 3.10',
  },
  metais: {
    id: 'metais',
    nome: 'Metais (Aço, Alumínio e Cobre)',
    descricao: 'Chapas, tubos, arames, perfilados, recipientes metálicos e ferragens',
    capitulosNCM: ['72', '73', '74', '75', '76', '77', '78', '79', '80', '81', '82', '83'],
    exemplosNCM: ['7210', '7310', '7609', '7616'],
    fatorKgCO2ePorUnidade: 2.45, // média ponderada aço/alumínio/cobre processado
    unidadeFisica: 'kg',
    unidadesCompativeis: ['kg', 'kg.', 'kilos', 'quilogramas', 'ton', 't', 'un', 'pç'],
    incertezaTier2Pct: 7.5,
    fonteACV: 'WorldSteel / International Aluminium Institute (IAI) / Ecoinvent 3.10',
  },
  combustiveis: {
    id: 'combustiveis',
    nome: 'Combustíveis e Óleos de Processo',
    descricao: 'Óleos lubrificantes, solventes, graxas e frações hidrocarbônicas de processo',
    capitulosNCM: ['27'], // exceto 2716
    exemplosNCM: ['2710', '2711'],
    fatorKgCO2ePorUnidade: 2.85, // kg CO2e / L
    unidadeFisica: 'L',
    unidadesCompativeis: ['l', 'lt', 'lts', 'litro', 'litros', 'm3', 'kg'],
    incertezaTier2Pct: 5.5,
    fonteACV: 'GHG Protocol BR / Ecoinvent 3.10 / ANP',
  },
  eletricos: {
    id: 'eletricos',
    nome: 'Elétricos, Eletrônicos & Máquinas',
    descricao: 'Motores elétricos, transformadores, cabos, placas e componentes eletromecânicos',
    capitulosNCM: ['84', '85'],
    exemplosNCM: ['8471', '8504', '8544'],
    fatorKgCO2ePorUnidade: 4.8, // kg CO2e / kg componente eletroeletrônico
    unidadeFisica: 'kg',
    unidadesCompativeis: ['kg', 'kg.', 'un', 'pç', 'pc'],
    incertezaTier2Pct: 9.5,
    fonteACV: 'Ecoinvent 3.10 (Electronics & Components) / DEFRA',
  },
  outros: {
    id: 'outros',
    nome: 'Outros Bens Comprados',
    descricao: 'Demais insumos manufaturados ou mercadorias diversas',
    capitulosNCM: [],
    exemplosNCM: [],
    fatorKgCO2ePorUnidade: 1.5,
    unidadeFisica: 'kg',
    unidadesCompativeis: ['kg', 'un', 'pç'],
    incertezaTier2Pct: 12.0,
    fonteACV: 'Orbis dMRV Baseline Conservadora',
  },
}

// Fator padrão spend-based (Tier 1) para Escopo 3 Categoria 1 (bens comprados):
// ~0.0450 kg CO2e por R$ gasto (DEFRA / Ecoinvent 3.10 Economic Input-Output)
export const FATOR_SPEND_BASED_CAT1_KGCO2E_POR_BRL = 0.045
export const INCERTEZA_TIER1_SPEND_BASED_PCT = 18.0

export interface ItemCompradoInput {
  id?: string
  numeroItem?: number
  codigo?: string
  descricao: string
  ncm?: string
  unidadeDeclarada?: string
  quantidadeFisica?: number
  valorBrl: number
}

export interface ItemClassificadoNCMResultado {
  id: string
  descricao: string
  ncmNormalizado: string
  familia: FamiliaNCMConfig
  unidadeFisica: string
  quantidadeFisica: number
  valorBrl: number
  // Se foi elevado para Tier 2 ou mantido em Tier 1 spend-based
  elevadoParaTier2: boolean
  motivoTier: string
  tierIncerteza: 'Tier 1' | 'Tier 2' | 'Tier 3'
  incertezaPct: number
  fatorUtilizado: number
  unidadeFator: string
  emissaoFossilKgCo2e: number
  emissaoFossilTco2e: number
  fonteFator: string
  declaracaoMetodologica: string
}

export interface ResumoClassificacaoFamiliasNCM {
  totalItens: number
  itensElevadosTier2: number
  itensPermanecidosTier1: number
  percentualElevadosTier2: number
  // Emissões calculadas com a classificação física (Tier 2 quando aplicável)
  emissaoTotalFossilTco2e: number
  // Contra-prova: se todos fossem spend-based (Tier 1)
  emissaoSpendBasedPuroTco2e: number
  // Incerteza ponderada resultante da categoria 1
  incertezaPonderadaCat1Pct: number
  // Redução de incerteza em pontos percentuais (ex: 18.0% - 9.2% = 8.8 p.p.)
  reducaoIncertezaPontosPct: number
  distribuicaoPorFamilia: Record<
    FamiliaNCMId,
    {
      familiaNome: string
      quantidadeItens: number
      massaOuQtdFisicaTotal: number
      unidadeFisica: string
      emissaoTco2e: number
      itensTier2: number
      itensTier1: number
    }
  >
  declaracaoNormativa: string
  alertaRevisorSugerido?: string
}

/**
 * Normaliza código NCM removendo pontos, traços e espaços, completando até 8 dígitos
 */
export function normalizarNCM(ncmRaw?: string | null): string {
  if (!ncmRaw) return ''
  const limpo = ncmRaw.replace(/[^\d]/g, '')
  if (limpo.length === 8) return limpo
  if (limpo.length < 8 && limpo.length >= 2) return limpo.padEnd(8, '0')
  return limpo.slice(0, 8)
}

/**
 * Identifica a família NCM de um item a partir do seu código NCM.
 * Declarado como PROXY INTERNO da plataforma (não referência normativa).
 */
export function identificarFamiliaNCM(ncmRaw?: string | null): FamiliaNCMConfig {
  const ncm = normalizarNCM(ncmRaw)
  if (!ncm || ncm.length < 2) {
    return FAMILIAS_NCM_CONFIG.outros
  }

  const capitulo = ncm.slice(0, 2)

  // Combustíveis: capítulo 27, EXCETO 2716 (energia elétrica que pertence ao Escopo 2)
  if (capitulo === '27') {
    if (ncm.startsWith('2716')) {
      return FAMILIAS_NCM_CONFIG.outros
    }
    return FAMILIAS_NCM_CONFIG.combustiveis
  }

  // Papel e Celulósicos: capítulos 47, 48, 49
  if (capitulo === '47' || capitulo === '48' || capitulo === '49') {
    return FAMILIAS_NCM_CONFIG.papel_celulosicos
  }

  // Polímeros e Plásticos: capítulos 39 e 40
  if (capitulo === '39' || capitulo === '40') {
    return FAMILIAS_NCM_CONFIG.polimeros
  }

  // Metais: capítulos 72 a 83
  const capNum = parseInt(capitulo, 10)
  if (!isNaN(capNum) && capNum >= 72 && capNum <= 83) {
    return FAMILIAS_NCM_CONFIG.metais
  }

  // Elétricos e Máquinas: capítulos 84 e 85
  if (capitulo === '84' || capitulo === '85') {
    return FAMILIAS_NCM_CONFIG.eletricos
  }

  return FAMILIAS_NCM_CONFIG.outros
}

/**
 * Verifica se a unidade declarada (uCom) é conversível/compatível com a família
 */
function normalizarQuantidadeParaFamilia(
  qtdRaw: number,
  unidadeRaw: string,
  familia: FamiliaNCMConfig,
): number {
  if (qtdRaw <= 0) return 0
  const u = (unidadeRaw || '').toLowerCase().trim()

  // Se a família usa 'kg'
  if (familia.unidadeFisica === 'kg') {
    if (u === 'ton' || u === 't' || u === 'tonelada' || u === 'toneladas') {
      return qtdRaw * 1000
    }
    if (u === 'g' || u === 'grama' || u === 'gramas') {
      return qtdRaw / 1000
    }
    return qtdRaw // Assume kg se compatível ou unidade padrão
  }

  // Se a família usa 'L'
  if (familia.unidadeFisica === 'L') {
    if (u === 'm3' || u === 'm³') {
      return qtdRaw * 1000
    }
    if (u === 'ml') {
      return qtdRaw / 1000
    }
    return qtdRaw
  }

  return qtdRaw
}

/**
 * Processa um item de nota fiscal comprado (Escopo 3 Categoria 1):
 * - Se possui NCM mapeável E quantidade física válida (qCom > 0): eleva para Tier 2 (fator ACV de base física da família)
 * - Se não possui quantidade física ou NCM não mapeável: mantém spend-based Tier 1 (±18%)
 */
export function classificarItemCompradoNCM(
  item: ItemCompradoInput,
  index = 0,
): ItemClassificadoNCMResultado {
  const id = item.id || `item_${index + 1}`
  const ncm = normalizarNCM(item.ncm)
  const familia = identificarFamiliaNCM(ncm)

  const temNcmMapeavel = ncm.length >= 2 && familia.id !== 'outros'
  const temQtdFisica = typeof item.quantidadeFisica === 'number' && item.quantidadeFisica > 0
  const valorBrl = Math.max(0, item.valorBrl || 0)

  // Decisão de elevação para Tier 2
  if (temNcmMapeavel && temQtdFisica) {
    const qtdConvertida = normalizarQuantidadeParaFamilia(
      item.quantidadeFisica!,
      item.unidadeDeclarada || familia.unidadeFisica,
      familia,
    )
    const emissaoKg = qtdConvertida * familia.fatorKgCO2ePorUnidade
    const emissaoT = emissaoKg / 1000

    return {
      id,
      descricao: item.descricao,
      ncmNormalizado: ncm,
      familia,
      unidadeFisica: familia.unidadeFisica,
      quantidadeFisica: qtdConvertida,
      valorBrl,
      elevadoParaTier2: true,
      motivoTier: `Elevado para Tier 2: NCM ${ncm.slice(0, 4)} mapeado para família ${familia.nome} com quantidade física disponível (${qtdConvertida.toLocaleString('pt-BR')} ${familia.unidadeFisica}).`,
      tierIncerteza: 'Tier 2',
      incertezaPct: familia.incertezaTier2Pct,
      fatorUtilizado: familia.fatorKgCO2ePorUnidade,
      unidadeFator: `kg CO₂e/${familia.unidadeFisica}`,
      emissaoFossilKgCo2e: Number(emissaoKg.toFixed(2)),
      emissaoFossilTco2e: Number(emissaoT.toFixed(4)),
      fonteFator: familia.fonteACV,
      declaracaoMetodologica: DECLARACAO_PROXY_NCM,
    }
  }

  // Caso contrário: mantém spend-based Tier 1 (±18%)
  const emissaoSpendKg = valorBrl * FATOR_SPEND_BASED_CAT1_KGCO2E_POR_BRL
  const emissaoSpendT = emissaoSpendKg / 1000

  return {
    id,
    descricao: item.descricao,
    ncmNormalizado: ncm,
    familia,
    unidadeFisica: 'BRL',
    quantidadeFisica: valorBrl,
    valorBrl,
    elevadoParaTier2: false,
    motivoTier: !temQtdFisica
      ? 'Mantido em Tier 1 (spend-based, ±18%): quantidade física (qCom) não disponível na nota fiscal.'
      : 'Mantido em Tier 1 (spend-based, ±18%): NCM não classificado em família física específica.',
    tierIncerteza: 'Tier 1',
    incertezaPct: INCERTEZA_TIER1_SPEND_BASED_PCT,
    fatorUtilizado: FATOR_SPEND_BASED_CAT1_KGCO2E_POR_BRL,
    unidadeFator: 'kg CO₂e/R$',
    emissaoFossilKgCo2e: Number(emissaoSpendKg.toFixed(2)),
    emissaoFossilTco2e: Number(emissaoSpendT.toFixed(4)),
    fonteFator: 'DEFRA UK / Ecoinvent 3.10 Input-Output (spend-based)',
    declaracaoMetodologica: DECLARACAO_PROXY_NCM,
  }
}

/**
 * Agrega a classificação completa dos itens comprados de um inventário ou amostra
 */
export function resumirClassificacaoItensComprados(
  itens: ItemCompradoInput[],
): ResumoClassificacaoFamiliasNCM {
  const classificados = itens.map((it, idx) => classificarItemCompradoNCM(it, idx))

  let totalItens = classificados.length
  let itensElevadosTier2 = 0
  let itensPermanecidosTier1 = 0
  let emissaoTotalFossilKg = 0
  let emissaoSpendBasedPuroKg = 0
  let somaIncertezaPonderada = 0

  const dist: Record<FamiliaNCMId, any> = {
    papel_celulosicos: {
      familiaNome: FAMILIAS_NCM_CONFIG.papel_celulosicos.nome,
      quantidadeItens: 0,
      massaOuQtdFisicaTotal: 0,
      unidadeFisica: 'kg',
      emissaoTco2e: 0,
      itensTier2: 0,
      itensTier1: 0,
    },
    polimeros: {
      familiaNome: FAMILIAS_NCM_CONFIG.polimeros.nome,
      quantidadeItens: 0,
      massaOuQtdFisicaTotal: 0,
      unidadeFisica: 'kg',
      emissaoTco2e: 0,
      itensTier2: 0,
      itensTier1: 0,
    },
    metais: {
      familiaNome: FAMILIAS_NCM_CONFIG.metais.nome,
      quantidadeItens: 0,
      massaOuQtdFisicaTotal: 0,
      unidadeFisica: 'kg',
      emissaoTco2e: 0,
      itensTier2: 0,
      itensTier1: 0,
    },
    combustiveis: {
      familiaNome: FAMILIAS_NCM_CONFIG.combustiveis.nome,
      quantidadeItens: 0,
      massaOuQtdFisicaTotal: 0,
      unidadeFisica: 'L',
      emissaoTco2e: 0,
      itensTier2: 0,
      itensTier1: 0,
    },
    eletricos: {
      familiaNome: FAMILIAS_NCM_CONFIG.eletricos.nome,
      quantidadeItens: 0,
      massaOuQtdFisicaTotal: 0,
      unidadeFisica: 'kg',
      emissaoTco2e: 0,
      itensTier2: 0,
      itensTier1: 0,
    },
    outros: {
      familiaNome: FAMILIAS_NCM_CONFIG.outros.nome,
      quantidadeItens: 0,
      massaOuQtdFisicaTotal: 0,
      unidadeFisica: 'kg/R$',
      emissaoTco2e: 0,
      itensTier2: 0,
      itensTier1: 0,
    },
  }

  for (const c of classificados) {
    const fId = c.familia.id
    dist[fId].quantidadeItens += 1
    dist[fId].emissaoTco2e += c.emissaoFossilTco2e

    if (c.elevadoParaTier2) {
      itensElevadosTier2 += 1
      dist[fId].itensTier2 += 1
      dist[fId].massaOuQtdFisicaTotal += c.quantidadeFisica
    } else {
      itensPermanecidosTier1 += 1
      dist[fId].itensTier1 += 1
    }

    emissaoTotalFossilKg += c.emissaoFossilKgCo2e
    // Equivalente se fosse 100% spend-based
    emissaoSpendBasedPuroKg += c.valorBrl * FATOR_SPEND_BASED_CAT1_KGCO2E_POR_BRL

    somaIncertezaPonderada += c.emissaoFossilKgCo2e * c.incertezaPct
  }

  const emissaoTotalFossilTco2e = Number((emissaoTotalFossilKg / 1000).toFixed(4))
  const emissaoSpendBasedPuroTco2e = Number((emissaoSpendBasedPuroKg / 1000).toFixed(4))

  const percentualElevadosTier2 =
    totalItens > 0 ? Number(((itensElevadosTier2 / totalItens) * 100).toFixed(1)) : 0

  const incertezaPonderadaCat1Pct =
    emissaoTotalFossilKg > 0
      ? Number((somaIncertezaPonderada / emissaoTotalFossilKg).toFixed(1))
      : INCERTEZA_TIER1_SPEND_BASED_PCT

  const reducaoIncertezaPontosPct = Number(
    Math.max(0, INCERTEZA_TIER1_SPEND_BASED_PCT - incertezaPonderadaCat1Pct).toFixed(1),
  )

  // Arredonda as emissões por família
  for (const k of Object.keys(dist) as FamiliaNCMId[]) {
    dist[k].emissaoTco2e = Number(dist[k].emissaoTco2e.toFixed(4))
    dist[k].massaOuQtdFisicaTotal = Number(dist[k].massaOuQtdFisicaTotal.toFixed(2))
  }

  // Alerta consultivo do revisor quando maioria permanece spend-based
  let alertaRevisorSugerido: string | undefined
  if (totalItens > 0 && itensPermanecidosTier1 > totalItens / 2) {
    alertaRevisorSugerido =
      'A maioria dos itens do Escopo 3 Categoria 1 permanece apurada pelo método spend-based (Tier 1, ±18%). Recomenda-se priorizar aquisições com quantidade física destacada na nota (qCom) para elevar a qualidade do inventário para Tier 2 (fatores ACV).'
  }

  return {
    totalItens,
    itensElevadosTier2,
    itensPermanecidosTier1,
    percentualElevadosTier2,
    emissaoTotalFossilTco2e,
    emissaoSpendBasedPuroTco2e,
    incertezaPonderadaCat1Pct,
    reducaoIncertezaPontosPct,
    distribuicaoPorFamilia: dist,
    declaracaoNormativa: DECLARACAO_PROXY_NCM,
    alertaRevisorSugerido,
  }
}
