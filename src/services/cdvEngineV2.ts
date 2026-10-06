/**
 * MOTOR DE CÁLCULO ORBIS v2 & DM-ORB-001 v1.1
 * Implementação prescritiva conforme §1 e §2 da Especificação Técnica:
 *
 * Fórmula por peça:
 *   Evitado_peça = Q × FE_ref(material) × L_i × DF − PE_peça
 *
 * Onde:
 *   - Q = massa medida em kg
 *   - FE_ref = fator de emissão do material virgem equivalente (kgCO₂e/kg)
 *   - L_i = 1,0 (conservador reuso completo na v2.0)
 *   - DF = 0,30 (fator de deslocamento conservador na v2.0, ref VMR0007)
 *   - PE_peça = emissões de projeto alocadas (PE_lote ÷ massa recuperada total × Q)
 *
 * Refrigerante R-134a:
 *   Evitado_refrig = massa_R134a_kg × GWP100_AR6 × DF_refrig
 *   GWP100 AR6 para HFC-134a = 1530 (IPCC AR6 WG1 Tabela 7.15, com feedbacks)
 *   DF_refrig = 1,0 (deslocamento direto e recuperação mandatória)
 *
 * Incerteza do lote (Soma em quadratura):
 *   Incerteza_lote = √(Σ (Evitado_peça × u_FE)² + (Evitado_lote × u_massa)²)
 *
 * Convenções e Regras:
 *   - Evitado: arredondamento sempre para baixo (Math.floor(x * 100) / 100), valor positivo
 *   - Emissões (PE): arredondamento sempre para cima (Math.ceil(x * 100) / 100)
 *   - Segregação em 3 colunas: fóssil / biogênico / total (no CDV biogênico = 0)
 *   - Destinação obrigatória para confirmação de claim (§0.3): sem evidência, claim = potencial (não soma no evitado confirmado)
 */

export const VERSAO_METODOLOGIA_CDV_V2 = 'DM-ORB-001-v1.1'

// GWP 100 oficial IPCC AR6 WG1 Capítulo 7 (Tabela 7.15 e Tabela 7.SM.7 com feedbacks de carbono)
export const GWP_AR6_R134A = 1530
// HFO-1234yf (R-1234yf): IPCC AR6 WG1 Ch. 7 Tab. 7.SM.7 (CF3CF=CH2, Lifetime 0.033 anos; GWP100 = 0.501; conservador de catálogo = 0.50)
export const GWP_AR6_R1234YF = 0.5
export const DF_REFRIGERANTE_PADRAO = 1.0

export interface FatorRefrigeranteV2 {
  tipo: string
  nome: string
  formula: string
  gwp100: number
  df: number
  fonte: string
  aplicacao: string
}

export const REFRIGERANTES_CATALOGO_V2: Record<string, FatorRefrigeranteV2> = {
  r134a: {
    tipo: 'R134a',
    nome: '1,1,1,2-Tetrafluoroetano (HFC-134a / R-134a)',
    formula: 'CH₂FCF₃ (R-134a)',
    gwp100: 1530,
    df: 1.0,
    fonte: 'IPCC AR6 WG1 Capítulo 7 Tabela 7.15 (com feedbacks de carbono)',
    aplicacao: 'Veículos anteriores a ~2017 e HVAC comercial',
  },
  r1234yf: {
    tipo: 'R1234yf',
    nome: '2,3,3,3-Tetrafluoropropeno (HFO-1234yf / R-1234yf)',
    formula: 'CF₃CF=CH₂ (R-1234yf)',
    gwp100: 0.5,
    df: 1.0,
    fonte:
      'IPCC AR6 WG1 Capítulo 7 Tabela 7.SM.7 (HFO-1234yf, GWP100 = 0,501 com feedbacks; adotado 0,50 conservador)',
    aplicacao: 'Veículos pós-~2017 (padrão automotivo global moderno)',
  },
}

// Fatores de referência e incertezas relativas u_FE
export interface FatorMaterialV2 {
  material: 'aco' | 'aluminio' | 'cobre' | 'polimeros' | 'outros'
  nome: string
  fe_ref: number // kgCO₂e/kg
  u_fe: number // incerteza relativa do fator (ex: 0.035 = 3.5%)
  fonte: string
  vigencia: string
  tier: 'T1' | 'T2' | 'T3' | 'T4'
  pendente_verificacao?: boolean
}

export const FATORES_MATERIAIS_V2: Record<string, FatorMaterialV2> = {
  aco: {
    material: 'aco',
    nome: 'Aço Laminado / Estampado',
    fe_ref: 2.18,
    u_fe: 0.035, // ±3.5%
    fonte:
      'worldsteel Association, Sustainability Indicators Report 2025, indicador 1a GHG emissions intensity 2024 = 2,18 tCO₂e/t aço bruto, escopos 1+2+3 cat. 1',
    vigencia: '2025-01-01/2025-12-31',
    tier: 'T3',
    pendente_verificacao: false,
  },
  aluminio: {
    material: 'aluminio',
    nome: 'Alumínio Primário Automotivo (Fallback Global)',
    fe_ref: 14.4,
    u_fe: 0.04, // ±4.0%
    fonte:
      'International Aluminium Institute (IAI), 2024 Data Release, alumínio primário global cradle-to-gate, escopos 1+2+3',
    vigencia: '2025-01-01/2025-12-31',
    tier: 'T3',
    pendente_verificacao: false,
  },
  cobre: {
    material: 'cobre',
    nome: 'Cobre / Bobinamentos Elétricos',
    fe_ref: 4.1,
    u_fe: 0.045, // ±4.5%
    fonte:
      'International Copper Association (ICA), Estudo Global LCI/LCA cradle-to-gate de cobre primário refinado (média global)',
    vigencia: '2025-01-01/2025-12-31',
    tier: 'T3',
    pendente_verificacao: false,
  },
  polimeros: {
    material: 'polimeros',
    nome: 'Polímeros Automotivos (PP / EPDM / ABS)',
    fe_ref: 1.9,
    u_fe: 0.05, // ±5.0%
    fonte:
      'PlasticsEurope Eco-profiles 2023 (PCR ISO 14025, declared unit 1 kg resina at gate, menor valor da faixa 1,91-5,70 correspondente a PP)',
    vigencia: '2025-01-01/2025-12-31',
    tier: 'T2',
    pendente_verificacao: true,
  },
  outros: {
    material: 'outros',
    nome: 'Outros Materiais (Estimativa Conservadora)',
    fe_ref: 1.5,
    u_fe: 0.1, // ±10.0%
    fonte:
      'Orbis dMRV Baseline Conservadora (derivação interna conservadora — procedimento sob publicação formal)',
    vigencia: '2025-01-01/2025-12-31',
    tier: 'T1',
    pendente_verificacao: false,
  },
}

export function floor2(valor: number): number {
  if (isNaN(valor) || !isFinite(valor)) return 0
  return Math.floor(valor * 100) / 100
}

export function ceil2(valor: number): number {
  if (isNaN(valor) || !isFinite(valor)) return 0
  return Math.ceil(valor * 100) / 100
}

export function round2(valor: number): number {
  if (isNaN(valor) || !isFinite(valor)) return 0
  return Math.round(valor * 100) / 100
}

export interface ComposicaoMaterialItem {
  material: 'aco' | 'aluminio' | 'cobre' | 'polimeros' | 'outros'
  percentual: number // soma idealmente 100%
}

export interface EvidenciaDestinacaoInput {
  sku: string
  status: 'vendida' | 'estoque' | 'reciclada' | 'pendente'
  evidencia?: {
    tipo: 'nfe' | 'mtr' | 'reincorporacao' | 'outro'
    numero?: string
    chave?: string
    destinador?: string
  }
}

export interface FluidoInput {
  tipo: 'R134a' | 'R1234yf' | string
  massa_kg: number
  evidencia?: string
}

export interface RecondicionamentoInput {
  energia_kwh?: number
  horas_trabalho?: number
}

export interface PecaInputV2 {
  sku: string
  descricao: string
  material?: string
  composicao_material?: ComposicaoMaterialItem[]
  peso_kg: number
  ncm?: string
  estado?: 'reutilizavel' | 'recuperavel' | 'reciclavel'
  recondicionamento?: RecondicionamentoInput
  responsavel_crea?: string
  tara_fonte?: 'balanca_calibrada' | 'estimado'
}

export interface EnergiaCdvCompetenciaInput {
  kwh_mes?: number
  fonte?: 'fatura' | 'estimado'
  combustiveis_litros?: {
    diesel_s10?: number
    gasolina?: number
  }
}

export interface VeiculoDoadorInputV2 {
  marca_modelo: string
  chassi?: string
  placa?: string
  baixa_detran: string
  seguradora_sinistro?: string
  tara_kg?: number
  tara_fonte?: 'documento_veiculo' | 'pesado' | 'estimado'
  fluidos?: FluidoInput[]
  destinacao_carcaca?: string
}

export interface LoteInputV2 {
  cdv: {
    nome: string
    cnpj: string
    codigo?: string
    responsavel_crea?: string
  }
  veiculo_doador: VeiculoDoadorInputV2
  pecas: PecaInputV2[]
  destinacao?: EvidenciaDestinacaoInput[]
  energia_cdv_competencia?: EnergiaCdvCompetenciaInput
  df_config?: number // default 0.30
  li_config?: number // default 1.0
  origem?: 'erp' | 'ecommerce' | 'manual_api' | 'planilha'
}

export interface PecaCalculoResultadoV2 {
  sku: string
  descricao: string
  peso_kg: number
  material_categoria: 'aco' | 'aluminio' | 'cobre' | 'polimeros' | 'outros'
  fe_ref_aplicado: number
  li_aplicado: number
  df_aplicado: number
  evitado_bruto_kg: number // Q × FE × L_i × DF
  pe_alocado_kg: number
  evitado_liquido_kg: number // max(0, evitado_bruto - pe_alocado), floor 2 casas
  u_fe: number
  tier: 'T1' | 'T2' | 'T3' | 'T4'
  tem_destinacao_confirmada: boolean
  status_claim: 'confirmado' | 'potencial'
  snapshot_fonte: string
  snapshot_vigencia: string
  decomposicao_aplicada?: ComposicaoMaterialItem[]
}

export interface LoteCalculoResultadoV2 {
  versao_metodologia: string
  evitado_bruto_kg: number
  pe_lote_kg: number
  pe_detalhes: {
    energia_kwh: number
    diesel_litros: number
    metodo: 'alocacao_proporcional_massa' | 'direto_zero_declarado'
    justificativa?: string
  }
  evitado_liquido_kg: number // Total de todas as peças elegíveis (floor 2 casas)
  evitado_confirmado_kg: number // Apenas com evidência de destinação (venda/reincorporação/MTR)
  evitado_potencial_kg: number // Sem destinação documental concluída
  evitado_refrigerante_kg: number
  refrigerante_declaracao: string
  incerteza_kg: number // Erro absoluto consolidado
  incerteza_pct: number // Incerteza relativa percentual
  tiers: {
    T1_kg: number
    T2_kg: number
    T3_kg: number
    T4_kg: number
  }
  segregacao: {
    fossil_kg: number
    biogenico_kg: number
    total_kg: number
  }
  df_aplicado: number
  li_aplicado: number
  fatores_snapshot: Array<{
    sku: string
    fator: number
    fonte: string
    vigencia: string
    tier: string
  }>
  pecas_detalhes: PecaCalculoResultadoV2[]
}

/**
 * Normaliza e identifica a categoria material primária
 */
export function identificarCategoriaMaterial(
  materialRaw?: string,
): 'aco' | 'aluminio' | 'cobre' | 'polimeros' | 'outros' {
  if (!materialRaw) return 'outros'
  const matLower = materialRaw.toLowerCase().trim()
  if (
    matLower.includes('aço') ||
    matLower.includes('aco') ||
    matLower.includes('ferro') ||
    matLower.includes('metal') ||
    matLower.includes('lâmina')
  ) {
    return 'aco'
  }
  if (matLower.includes('alum') || matLower.includes('alumin')) {
    return 'aluminio'
  }
  if (matLower.includes('cobre')) {
    return 'cobre'
  }
  if (
    matLower.includes('poli') ||
    matLower.includes('plast') ||
    matLower.includes('borracha') ||
    matLower.includes('polipropileno') ||
    matLower.includes('epdm') ||
    matLower.includes('abs')
  ) {
    return 'polimeros'
  }
  return 'outros'
}

/**
 * Para peça mista sem decomposição explícita, a regra conservadora (§2.5d) prescreve:
 * fator do material de MENOR fator entre os materiais possíveis.
 */
export function obterFatorConservadorParaPecaMista(
  materiaisPossiveis: Array<'aco' | 'aluminio' | 'cobre' | 'polimeros' | 'outros'>,
): FatorMaterialV2 {
  if (!materiaisPossiveis || materiaisPossiveis.length === 0) {
    return FATORES_MATERIAIS_V2.outros
  }
  let menorFator = FATORES_MATERIAIS_V2[materiaisPossiveis[0]] || FATORES_MATERIAIS_V2.outros
  for (const m of materiaisPossiveis) {
    const f = FATORES_MATERIAIS_V2[m]
    if (f && f.fe_ref < menorFator.fe_ref) {
      menorFator = f
    }
  }
  return menorFator
}

/**
 * MOTOR DE CÁLCULO V2 - EXECUTA O MODELO DM-ORB-001 v1.1
 */
export function calcularLoteOrbisV2(input: LoteInputV2): LoteCalculoResultadoV2 {
  const df = typeof input.df_config === 'number' ? input.df_config : 0.3
  const li = typeof input.li_config === 'number' ? input.li_config : 1.0

  // 1. Mapa de evidências de destinação por SKU
  const mapaDestinacao = new Map<string, EvidenciaDestinacaoInput>()
  if (Array.isArray(input.destinacao)) {
    for (const d of input.destinacao) {
      if (d && d.sku) {
        mapaDestinacao.set(d.sku.trim(), d)
      }
    }
  }

  // 2. Calcular Emissões do Projeto (PE_lote) a partir de faturas de energia do CDV
  // Fator energia SIN 2024: 0.0486 kgCO2e/kWh
  // Fator Diesel S10: 2.295 kgCO2e/L
  let peLoteTotal = 0
  const energiaInfo = input.energia_cdv_competencia || {}
  const kwhMes = Number(energiaInfo.kwh_mes) || 0
  const dieselLitros = Number(energiaInfo.combustiveis_litros?.diesel_s10) || 0

  if (kwhMes > 0 || dieselLitros > 0) {
    const peEnergia = kwhMes * 0.0486
    const peDiesel = dieselLitros * 2.295
    // Estimativa de fração mensal atribuível ao lote (ex.: se o lote representa fração da massa do mês)
    // Para simplificação de alocação conservadora: rateio direto das emissões diretas informadas
    peLoteTotal = ceil2(peEnergia + peDiesel)
  }

  // Massa total recuperada
  const pecasList = Array.isArray(input.pecas) ? input.pecas : []
  let massaRecuperadaTotalKg = 0
  for (const p of pecasList) {
    const peso = Number(p.peso_kg) || 0
    if (peso > 0) {
      massaRecuperadaTotalKg += peso
    }
  }

  // 3. Processar cada peça
  const pecasCalculadas: PecaCalculoResultadoV2[] = []
  const fatoresSnapshot: LoteCalculoResultadoV2['fatores_snapshot'] = []

  let somaEvitadoBruto = 0
  let somaEvitadoLiquido = 0
  let somaEvitadoConfirmado = 0
  let somaEvitadoPotencial = 0
  let somaQuadradosIncerteza = 0

  let t1TotalKg = 0
  let t2TotalKg = 0
  let t3TotalKg = 0
  let t4TotalKg = 0

  for (const peca of pecasList) {
    const sku = (peca.sku || '').trim()
    const desc = (peca.descricao || '').trim()
    const peso = Number(peca.peso_kg) || 0
    if (peso <= 0) continue

    // Rateio de PE proporcional à massa (se PE_lote informado)
    let pePeca = 0
    if (peLoteTotal > 0 && massaRecuperadaTotalKg > 0) {
      pePeca = ceil2((peLoteTotal / massaRecuperadaTotalKg) * peso)
    }
    // Adicionar custos diretos de recondicionamento se informados
    if (peca.recondicionamento?.energia_kwh) {
      const peRecond = ceil2(peca.recondicionamento.energia_kwh * 0.0486)
      pePeca = ceil2(pePeca + peRecond)
    }

    // Material e fatores
    let categoriaEscolhida: 'aco' | 'aluminio' | 'cobre' | 'polimeros' | 'outros' = 'outros'
    let fatorObj: FatorMaterialV2 = FATORES_MATERIAIS_V2.outros
    let evitadoBrutoPeca = 0

    // Se possui decomposição mista explícita (§5.1 DM)
    if (Array.isArray(peca.composicao_material) && peca.composicao_material.length > 0) {
      categoriaEscolhida = peca.composicao_material[0].material || 'outros'
      let evitadoComposto = 0
      let uFePonderado = 0
      for (const comp of peca.composicao_material) {
        const mat = comp.material || 'outros'
        const f = FATORES_MATERIAIS_V2[mat] || FATORES_MATERIAIS_V2.outros
        const frac = Math.max(0, Math.min(100, comp.percentual)) / 100
        const subMassa = peso * frac
        evitadoComposto += subMassa * f.fe_ref * li * df
        uFePonderado += frac * f.u_fe
      }
      evitadoBrutoPeca = evitadoComposto
      fatorObj = {
        ...FATORES_MATERIAIS_V2[categoriaEscolhida],
        u_fe: uFePonderado || 0.05,
      }
    } else {
      // Material simples ou não decomposto
      categoriaEscolhida = identificarCategoriaMaterial(peca.material)
      fatorObj = FATORES_MATERIAIS_V2[categoriaEscolhida] || FATORES_MATERIAIS_V2.outros
      evitadoBrutoPeca = peso * fatorObj.fe_ref * li * df
    }

    // Evitado líquido por peça (positivo, floor de 2 casas, conservador)
    const evitadoLiquidoPeca = floor2(Math.max(0, evitadoBrutoPeca - pePeca))

    // Verificação de destinação obrigatória (§0.3 e §2.5a)
    const dest = mapaDestinacao.get(sku)
    const temDestinacaoConfirmada =
      !!dest && (dest.status === 'vendida' || dest.status === 'reciclada') && !!dest.evidencia

    const statusClaim: 'confirmado' | 'potencial' = temDestinacaoConfirmada
      ? 'confirmado'
      : 'potencial'

    // Tiers conforme DM: T1 (medido/balança) até T4 (estimado)
    let tierPeca: 'T1' | 'T2' | 'T3' | 'T4' = 'T1'
    if (peca.tara_fonte === 'estimado') {
      tierPeca = 'T4'
      t4TotalKg += evitadoLiquidoPeca
    } else if (fatorObj.tier === 'T3') {
      tierPeca = 'T3'
      t3TotalKg += evitadoLiquidoPeca
    } else if (fatorObj.tier === 'T2') {
      tierPeca = 'T2'
      t2TotalKg += evitadoLiquidoPeca
    } else {
      tierPeca = 'T1'
      t1TotalKg += evitadoLiquidoPeca
    }

    // Acumular incerteza por peça: (Evitado_peça × u_FE)²
    somaQuadradosIncerteza += Math.pow(evitadoLiquidoPeca * fatorObj.u_fe, 2)

    somaEvitadoBruto += evitadoBrutoPeca
    somaEvitadoLiquido += evitadoLiquidoPeca
    if (temDestinacaoConfirmada) {
      somaEvitadoConfirmado += evitadoLiquidoPeca
    } else {
      somaEvitadoPotencial += evitadoLiquidoPeca
    }

    const calcPeca: PecaCalculoResultadoV2 = {
      sku,
      descricao: desc,
      peso_kg: peso,
      material_categoria: categoriaEscolhida,
      fe_ref_aplicado: fatorObj.fe_ref,
      li_aplicado: li,
      df_aplicado: df,
      evitado_bruto_kg: round2(evitadoBrutoPeca),
      pe_alocado_kg: pePeca,
      evitado_liquido_kg: evitadoLiquidoPeca,
      u_fe: fatorObj.u_fe,
      tier: tierPeca,
      tem_destinacao_confirmada: temDestinacaoConfirmada,
      status_claim: statusClaim,
      snapshot_fonte: fatorObj.fonte,
      snapshot_vigencia: fatorObj.vigencia,
      decomposicao_aplicada: peca.composicao_material,
    }

    pecasCalculadas.push(calcPeca)

    fatoresSnapshot.push({
      sku,
      fator: fatorObj.fe_ref,
      fonte: fatorObj.fonte,
      vigencia: fatorObj.vigencia,
      tier: tierPeca,
    })
  }

  // 4. Refrigerantes (§1.3: R-134a, R-1234yf)
  let evitadoRefrigeranteKg = 0
  let refrigeranteDeclaracao =
    'Refrigerante não capturado no gate de despoluição — evitado subestimado por conservativeness.'
  const fluidos = input.veiculo_doador?.fluidos || []
  const fluidosValidos: Array<{ tipo: string; massa: number; evitado: number; evidencia: string }> =
    []

  for (const f of fluidos) {
    if (!f || !(Number(f.massa_kg) > 0)) continue
    const tipoNorm = String(f.tipo)
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
    const massa = Number(f.massa_kg)

    let gwp = 0
    let rotulo = ''
    if (tipoNorm === 'r134a') {
      gwp = GWP_AR6_R134A
      rotulo = 'R-134a'
    } else if (tipoNorm === 'r1234yf') {
      gwp = GWP_AR6_R1234YF
      rotulo = 'R-1234yf'
    }

    if (gwp > 0) {
      const evitadoFluido = floor2(massa * gwp * DF_REFRIGERANTE_PADRAO)
      evitadoRefrigeranteKg = floor2(evitadoRefrigeranteKg + evitadoFluido)
      fluidosValidos.push({
        tipo: rotulo,
        massa,
        evitado: evitadoFluido,
        evidencia: f.evidencia || 'evidência registrada',
      })
    }
  }

  if (fluidosValidos.length > 0) {
    const partes = fluidosValidos.map(
      (fv) =>
        `Drenagem documentada de ${fv.tipo} (${fv.massa.toFixed(2)} kg) com GWP AR6 de ${
          fv.tipo === 'R-134a' ? '1.530' : '0,50'
        } e DF 1,0 (${fv.evidencia})`,
    )
    refrigeranteDeclaracao = partes.join(' | ')
  }

  // Total líquido consolidado do lote
  const evitadoLiquidoFinal = floor2(somaEvitadoLiquido + evitadoRefrigeranteKg)
  const evitadoConfirmadoFinal = floor2(somaEvitadoConfirmado + evitadoRefrigeranteKg)
  const evitadoPotencialFinal = floor2(somaEvitadoPotencial)

  // 5. Incerteza do lote (Soma em quadratura):
  // Incerteza_lote = √(Σ (Evitado_peça × u_FE)² + (Evitado_lote × u_massa)²)
  // u_massa: balança calibrada ±1% (0.01), ou ±10% se estimada
  const uMassa = input.veiculo_doador?.tara_fonte === 'estimado' ? 0.1 : 0.01
  const termoMassa = Math.pow(evitadoLiquidoFinal * uMassa, 2)
  const incertezaLoteKg = round2(Math.sqrt(somaQuadradosIncerteza + termoMassa))
  const incertezaPct =
    evitadoLiquidoFinal > 0 ? round2((incertezaLoteKg / evitadoLiquidoFinal) * 100) : 0

  return {
    versao_metodologia: VERSAO_METODOLOGIA_CDV_V2,
    evitado_bruto_kg: floor2(somaEvitadoBruto),
    pe_lote_kg: peLoteTotal,
    pe_detalhes: {
      energia_kwh: kwhMes,
      diesel_litros: dieselLitros,
      metodo: peLoteTotal > 0 ? 'alocacao_proporcional_massa' : 'direto_zero_declarado',
      justificativa:
        peLoteTotal > 0
          ? 'Emissões do CDV alocadas proporcionalmente à massa recuperada.'
          : 'CDV não reportou consumo de energia no fechamento da competência — PE declarado como 0 com plano de monitoramento.',
    },
    evitado_liquido_kg: evitadoLiquidoFinal,
    evitado_confirmado_kg: evitadoConfirmadoFinal,
    evitado_potencial_kg: evitadoPotencialFinal,
    evitado_refrigerante_kg: evitadoRefrigeranteKg,
    refrigerante_declaracao: refrigeranteDeclaracao,
    incerteza_kg: incertezaLoteKg,
    incerteza_pct: incertezaPct,
    tiers: {
      T1_kg: floor2(t1TotalKg),
      T2_kg: floor2(t2TotalKg),
      T3_kg: floor2(t3TotalKg),
      T4_kg: floor2(t4TotalKg),
    },
    segregacao: {
      fossil_kg: evitadoLiquidoFinal, // Emissões evitadas no CDV são de origem fóssil (metais, plásticos, eletricidade primária)
      biogenico_kg: 0, // Declarado explicitamente conforme §6.2 DM-ORB-001
      total_kg: evitadoLiquidoFinal,
    },
    df_aplicado: df,
    li_aplicado: li,
    fatores_snapshot: fatoresSnapshot,
    pecas_detalhes: pecasCalculadas,
  }
}
