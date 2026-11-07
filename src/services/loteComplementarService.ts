/**
 * Módulo de Dados Complementares do Lote & Declaração de Hipóteses Periciais
 * Etapa 3, Peça 3c (Parceria ACP)
 *
 * Escopo:
 * - Transporte: distância em km + modal (rodoviário, ferroviário, hidroviário).
 * - Origem: cidade e estado (UF).
 * - Tipo de material predominante: alinhado aos fatores oficiais (aço, alumínio, cobre, polímeros, outros).
 *
 * Regra de ouro pericial / anti-invenção:
 * - NUNCA inventar números, distâncias ou modais quando ausentes.
 * - Quando um campo fica em branco, declarar EXPLICITAMENTE a hipótese pericial adotada na memória de cálculo e no laudo.
 * - Se distância e modal forem informados, registrar como dado declarado pelo usuário.
 * - Fatores de transporte não são inventados sem fonte: a emissão de transporte permanece como dado informativo
 *   ou explicitada com a hipótese correspondente ("componente de transporte desconsiderado nesta apuração preliminar").
 * - Opção B mantida: NENHUM valor de fator numérico visível em telas públicas.
 * - Rótulos corretos: nunca "certificado" ou "crédito", sempre ESTIMATIVA / preliminar.
 */

export type ModalTransporte = 'rodoviario' | 'ferroviario' | 'hidroviario'

export type TipoMaterialPredominante = 'aco' | 'aluminio' | 'cobre' | 'polimeros' | 'outros'

export interface DadosComplementaresLoteInput {
  transporte_distancia_km?: number | null | string
  transporte_modal?: ModalTransporte | string | null
  origem_cidade?: string | null
  origem_uf?: string | null
  tipo_material_predominante?: TipoMaterialPredominante | string | null
}

export interface HipoteseDeclaradaItem {
  campo:
    | 'transporte_distancia_km'
    | 'transporte_modal'
    | 'origem'
    | 'tipo_material'
    | 'transporte_consolidado'
  rotulo: string
  status: 'informado' | 'nao_informado'
  valorDeclarado?: string | number | null
  hipoteseTexto: string
  impactoCalculo: string
}

export interface MemoriaHipotesesLote {
  temTransporteDeclarado: boolean
  temOrigemDeclarada: boolean
  temMaterialDeclarado: boolean
  distanciaKm: number | null
  modal: ModalTransporte | null
  origemTexto: string | null
  materialSlug: TipoMaterialPredominante | null
  materialRotulo: string | null
  hipoteses: HipoteseDeclaradaItem[]
  textoConsolidadoLaudo: string
}

export const MODAIS_TRANSPORTE_OPCOES: Array<{
  id: ModalTransporte
  label: string
  descricao: string
}> = [
  {
    id: 'rodoviario',
    label: 'Rodoviário (Caminhão / Frota)',
    descricao: 'Transporte rodoviário de carga intermunicipal / interestadual',
  },
  {
    id: 'ferroviario',
    label: 'Ferroviário (Vagão / Trem)',
    descricao: 'Transporte ferroviário em malha cargueira',
  },
  {
    id: 'hidroviario',
    label: 'Hidroviário (Barcaça / Cabotagem)',
    descricao: 'Transporte por vias navegáveis interiores ou marítimo de cabotagem',
  },
]

export const TIPOS_MATERIAL_OPCOES: Array<{
  id: TipoMaterialPredominante
  label: string
  descricao: string
}> = [
  {
    id: 'aco',
    label: 'Aço / Ferrosos',
    descricao: 'Chapas, perfis, blocos e estruturas de aço laminado/estampado',
  },
  {
    id: 'aluminio',
    label: 'Alumínio',
    descricao: 'Carcaças usinadas, radiadores, cabeçotes e ligas de alumínio',
  },
  {
    id: 'cobre',
    label: 'Cobre',
    descricao: 'Bobinas elétricas, estatores, cabos e chicotes eletrolíticos',
  },
  {
    id: 'polimeros',
    label: 'Polímeros / Plásticos',
    descricao: 'Termoplásticos de engenharia, para-choques e compostos PP/PA',
  },
  {
    id: 'outros',
    label: 'Outros / Misto',
    descricao: 'Materiais múltiplos ou insumos diversos sem fração dominante única',
  },
]

export const UFS_BRASIL = [
  'AC',
  'AL',
  'AP',
  'AM',
  'BA',
  'CE',
  'DF',
  'ES',
  'GO',
  'MA',
  'MT',
  'MS',
  'MG',
  'PA',
  'PB',
  'PR',
  'PE',
  'PI',
  'RJ',
  'RN',
  'RS',
  'RO',
  'RR',
  'SC',
  'SP',
  'SE',
  'TO',
] as const

/**
 * Normaliza e valida os dados complementares recebidos do formulário ou API
 */
export function normalizarDadosComplementaresLote(input?: DadosComplementaresLoteInput | null): {
  transporte_distancia_km: number | null
  transporte_modal: ModalTransporte | null
  origem_cidade: string | null
  origem_uf: string | null
  tipo_material_predominante: TipoMaterialPredominante | null
} {
  if (!input) {
    return {
      transporte_distancia_km: null,
      transporte_modal: null,
      origem_cidade: null,
      origem_uf: null,
      tipo_material_predominante: null,
    }
  }

  // Distância em km
  let distanciaKm: number | null = null
  if (input.transporte_distancia_km !== undefined && input.transporte_distancia_km !== null) {
    const parsed =
      typeof input.transporte_distancia_km === 'number'
        ? input.transporte_distancia_km
        : parseFloat(String(input.transporte_distancia_km).replace(',', '.'))
    if (!Number.isNaN(parsed) && parsed > 0) {
      distanciaKm = Math.round(parsed * 100) / 100
    }
  }

  // Modal
  let modal: ModalTransporte | null = null
  const modalRaw = String(input.transporte_modal || '')
    .toLowerCase()
    .trim()
  if (modalRaw === 'rodoviario' || modalRaw === 'rodoviária' || modalRaw === 'rodovia') {
    modal = 'rodoviario'
  } else if (modalRaw === 'ferroviario' || modalRaw === 'ferrovia') {
    modal = 'ferroviario'
  } else if (modalRaw === 'hidroviario' || modalRaw === 'hidrovia' || modalRaw === 'maritimo') {
    modal = 'hidroviario'
  }

  // Cidade e UF
  const cidade = input.origem_cidade ? String(input.origem_cidade).trim() : null
  let uf: string | null = null
  if (input.origem_uf) {
    const ufUpper = String(input.origem_uf).toUpperCase().trim()
    if (UFS_BRASIL.includes(ufUpper as any)) {
      uf = ufUpper
    }
  }

  // Material predominante
  let mat: TipoMaterialPredominante | null = null
  const matRaw = String(input.tipo_material_predominante || '')
    .toLowerCase()
    .trim()
  if (matRaw === 'aco' || matRaw === 'aço') {
    mat = 'aco'
  } else if (matRaw === 'aluminio' || matRaw === 'alumínio') {
    mat = 'aluminio'
  } else if (matRaw === 'cobre') {
    mat = 'cobre'
  } else if (
    matRaw === 'polimeros' ||
    matRaw === 'polímeros' ||
    matRaw === 'plastico' ||
    matRaw === 'plásticos'
  ) {
    mat = 'polimeros'
  } else if (matRaw === 'outros' || matRaw === 'misto') {
    mat = 'outros'
  }

  return {
    transporte_distancia_km: distanciaKm,
    transporte_modal: modal,
    origem_cidade: cidade || null,
    origem_uf: uf || null,
    tipo_material_predominante: mat,
  }
}

/**
 * Constrói a memória de hipóteses periciais declaradas sobre o lote.
 * Nunca inventa números quando campos estão ausentes.
 */
export function construirMemoriaHipotesesLote(
  dados?: DadosComplementaresLoteInput | null,
): MemoriaHipotesesLote {
  const norm = normalizarDadosComplementaresLote(dados)
  const hipoteses: HipoteseDeclaradaItem[] = []

  // 1. Transporte (Distância e Modal)
  const temDistancia = norm.transporte_distancia_km !== null && norm.transporte_distancia_km > 0
  const temModal = norm.transporte_modal !== null

  if (temDistancia && temModal) {
    const modalRotulo =
      norm.transporte_modal === 'rodoviario'
        ? 'Rodoviário'
        : norm.transporte_modal === 'ferroviario'
          ? 'Ferroviário'
          : 'Hidroviário'
    hipoteses.push({
      campo: 'transporte_consolidado',
      rotulo: 'Transporte do Lote',
      status: 'informado',
      valorDeclarado: `${norm.transporte_distancia_km} km (${modalRotulo})`,
      hipoteseTexto: `Transporte declarado pelo operador: ${norm.transporte_distancia_km} km via modal ${modalRotulo}.`,
      impactoCalculo:
        'Informação registrada para rastreabilidade de montante logístico (Escopo 3 Categoria 4 / upstream). Sem fator inventado nesta apuração preliminar.',
    })
  } else if (temDistancia && !temModal) {
    hipoteses.push({
      campo: 'transporte_modal',
      rotulo: 'Modal de Transporte',
      status: 'nao_informado',
      valorDeclarado: `${norm.transporte_distancia_km} km`,
      hipoteseTexto:
        'Modal de transporte não informado — hipótese: modalidade indeterminada; emissão de transporte não calculada para evitar premissa arbitrária.',
      impactoCalculo:
        'Distância preservada como registro físico; cálculo de tkm e CO2e logístico suspenso.',
    })
  } else if (!temDistancia && temModal) {
    const modalRotulo =
      norm.transporte_modal === 'rodoviario'
        ? 'Rodoviário'
        : norm.transporte_modal === 'ferroviario'
          ? 'Ferroviário'
          : 'Hidroviário'
    hipoteses.push({
      campo: 'transporte_distancia_km',
      rotulo: 'Distância de Transporte',
      status: 'nao_informado',
      valorDeclarado: modalRotulo,
      hipoteseTexto: `Modal declarado (${modalRotulo}), porém distância em km não informada — hipótese: percurso logístico desconsiderado no balanço consolidado.`,
      impactoCalculo: 'Sem acréscimo de emissão fóssil de transporte.',
    })
  } else {
    hipoteses.push({
      campo: 'transporte_consolidado',
      rotulo: 'Transporte e Logística Upstream',
      status: 'nao_informado',
      valorDeclarado: null,
      hipoteseTexto:
        'Transporte não informado — hipótese: componente de transporte desconsiderado nesta apuração preliminar.',
      impactoCalculo:
        'Nenhum valor fictício de distância ou frete foi imputado. O laudo reflete estritamente a massa física recuperada.',
    })
  }

  // 2. Origem Geográfica
  const temCidade = !!norm.origem_cidade
  const temUf = !!norm.origem_uf
  let origemTexto: string | null = null

  if (temCidade && temUf) {
    origemTexto = `${norm.origem_cidade} / ${norm.origem_uf}`
    hipoteses.push({
      campo: 'origem',
      rotulo: 'Origem Geográfica do Lote',
      status: 'informado',
      valorDeclarado: origemTexto,
      hipoteseTexto: `Origem declarada: município de ${norm.origem_cidade} (${norm.origem_uf}), vinculada ao emissor/fornecedor primário.`,
      impactoCalculo: 'Permite rastreabilidade territorial e análise pericial regionalizada.',
    })
  } else if (!temCidade && temUf) {
    origemTexto = `Estado de ${norm.origem_uf}`
    hipoteses.push({
      campo: 'origem',
      rotulo: 'Origem Geográfica do Lote',
      status: 'informado',
      valorDeclarado: norm.origem_uf,
      hipoteseTexto: `Origem restrita à UF (${norm.origem_uf}) — município específico não discriminado pelo operador.`,
      impactoCalculo: 'Localização estadual mantida para inventário territorial preliminar.',
    })
  } else if (temCidade && !temUf) {
    origemTexto = norm.origem_cidade
    hipoteses.push({
      campo: 'origem',
      rotulo: 'Origem Geográfica do Lote',
      status: 'informado',
      valorDeclarado: norm.origem_cidade,
      hipoteseTexto: `Município declarado (${norm.origem_cidade}), sem UF especificada.`,
      impactoCalculo: 'Preservado como metadado textual informativo.',
    })
  } else {
    hipoteses.push({
      campo: 'origem',
      rotulo: 'Origem Geográfica do Lote',
      status: 'nao_informado',
      valorDeclarado: null,
      hipoteseTexto:
        'Origem geográfica (cidade/UF) não informada — hipótese: procede do domicílio cadastral do emitente fiscal da NF-e.',
      impactoCalculo: 'Não altera fatores mássicos de descarbonização do inventário.',
    })
  }

  // 3. Tipo de Material Predominante
  let materialRotulo: string | null = null
  if (norm.tipo_material_predominante) {
    const itemOpt = TIPOS_MATERIAL_OPCOES.find((m) => m.id === norm.tipo_material_predominante)
    materialRotulo = itemOpt ? itemOpt.label : norm.tipo_material_predominante
    hipoteses.push({
      campo: 'tipo_material',
      rotulo: 'Tipo de Material Predominante',
      status: 'informado',
      valorDeclarado: materialRotulo,
      hipoteseTexto: `Material predominante declarado: ${materialRotulo}. Alinhado ao catálogo de fatores oficiais da metodologia DM-ORB-001.`,
      impactoCalculo:
        'Confirma a homogeneidade mássica das frações e a aderência aos fatores específicos do lote.',
    })
  } else {
    hipoteses.push({
      campo: 'tipo_material',
      rotulo: 'Tipo de Material Predominante',
      status: 'nao_informado',
      valorDeclarado: null,
      hipoteseTexto:
        'Tipo de material predominante não especificado — hipótese: classificação individual item a item via NCM e descrição da NF-e.',
      impactoCalculo:
        'Cada componente segue o fator mássico correspondente à sua NCM declarada na NF-e.',
    })
  }

  // Texto consolidado para exibição rápida no Laudo A4 e tela
  const partesTexto = hipoteses.map((h) => `• ${h.rotulo}: ${h.hipoteseTexto}`)
  const textoConsolidadoLaudo = partesTexto.join('\n')

  return {
    temTransporteDeclarado: temDistancia && temModal,
    temOrigemDeclarada: !!origemTexto,
    temMaterialDeclarado: !!materialRotulo,
    distanciaKm: norm.transporte_distancia_km,
    modal: norm.transporte_modal,
    origemTexto,
    materialSlug: norm.tipo_material_predominante,
    materialRotulo,
    hipoteses,
    textoConsolidadoLaudo,
  }
}
