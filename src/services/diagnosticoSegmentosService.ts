/**
 * Serviço e Modelo de Diagnóstico por Segmento
 * Orbis Protocol — Trilha Flagship: Alimentação / Bares / Restaurantes / Lanchonetes / Delivery
 *
 * Segmentos:
 * - alimentacao: Ativo (Flagship)
 * - turismo: Em estruturação (sem prometer produto/prazo)
 * - mei: Em estruturação (sem prometer produto/prazo)
 * - geral: Padrão transversal
 */

export type SegmentoDiagnosticoId = 'alimentacao' | 'turismo' | 'mei' | 'geral'

export interface SegmentoDefinicao {
  id: SegmentoDiagnosticoId
  nome: string
  subtitulo: string
  status: 'ativo' | 'em_estruturacao'
  descricaoStatus?: string
  icone: string
}

export const SEGMENTOS_DIAGNOSTICO: SegmentoDefinicao[] = [
  {
    id: 'alimentacao',
    nome: 'Alimentação / Bares / Restaurantes / Lanchonetes / Delivery',
    subtitulo: 'Segmentação Flagship • Gastronomia, Food Service & Delivery',
    status: 'ativo',
    icone: 'Utensils',
  },
  {
    id: 'turismo',
    nome: 'Turismo, Hotelaria & Receptivo',
    subtitulo: 'Hotelaria, pousadas e agências de receptivo',
    status: 'em_estruturacao',
    descricaoStatus:
      'Módulo setorial em estruturação técnica preliminar, sem promessa de prazo ou data de lançamento.',
    icone: 'Compass',
  },
  {
    id: 'mei',
    nome: 'Microempreendedor Individual (MEI)',
    subtitulo: 'Pequenos negócios, comércio de bairro e prestadores de serviços MEI',
    status: 'em_estruturacao',
    descricaoStatus:
      'Trilha de diagnóstico MEI em estruturação técnica. Para capacitação imediata, consulte o programa Orbis Educação.',
    icone: 'Store',
  },
  {
    id: 'geral',
    nome: 'Indústria, Serviços & Outros Segmentos',
    subtitulo: 'Trilha geral transversal para empresas em geral',
    status: 'ativo',
    icone: 'Building2',
  },
]

export interface PerguntasSegmentoAlimentacao {
  tipo_estabelecimento:
    | 'restaurante'
    | 'bar'
    | 'lanchonete'
    | 'delivery'
    | 'padaria'
    | 'refeicoes_coletivas'
  porte_funcionarios: '1_a_4' | '5_a_15' | '16_a_50' | 'acima_50'
  porte_faturamento_mensal: 'ate_30k' | '30k_a_100k' | '100k_a_300k' | 'acima_300k'
  principais_insumos: string[] // 'carnes', 'graos', 'oleo_fritura', 'bebidas', 'embalagens_plasticas', 'embalagens_papel', 'descartaveis'
  fontes_energia: string[] // 'eletrica_concessionaria', 'glp_botijao', 'gas_encanado', 'solar_propria', 'lenha_carvao'
  residuos_gerados: string[] // 'organicos', 'oleo_fritura_usado', 'reciclaveis_secos', 'rejeitos'
  origem_insumos: 'predominante_local_regional' | 'mista' | 'predominante_nacional_distante'
  logistica_reversa_embalagens: 'possui_coleta_ou_parceria' | 'nao_possui' | 'em_estruturacao'
}

export const INSUMOS_ALIMENTACAO_OPCOES = [
  { id: 'carnes', label: 'Carnes e Proteína Animal (bovina, frango, suína, pescados)' },
  { id: 'graos', label: 'Grãos, Farinhas, Massas e Cereais' },
  { id: 'oleo_fritura', label: 'Óleos de Fritura e Gorduras Vegetais' },
  { id: 'bebidas', label: 'Bebidas (cervejas, refrigerantes, sucos, destilados)' },
  { id: 'embalagens_plasticas', label: 'Embalagens Plásticas e Isopor (delivery)' },
  { id: 'embalagens_papel', label: 'Embalagens de Papel, Papelão e Kraft' },
  { id: 'descartaveis', label: 'Descartáveis e Utensílios de Uso Único' },
]

export const ENERGIA_ALIMENTACAO_OPCOES = [
  { id: 'eletrica_concessionaria', label: 'Energia Elétrica (Baixa Tensão / Concessionária)' },
  { id: 'glp_botijao', label: 'GLP / Gás de Cozinha (Botijão P13 / P45 / Cilindros)' },
  { id: 'gas_encanado', label: 'Gás Natural Encanado (GN canalizado)' },
  { id: 'lenha_carvao', label: 'Lenha ou Carvão Vegetal (Pizzarias / Churrascarias)' },
  { id: 'solar_propria', label: 'Geração Solar Própria ou Mercado Livre' },
]

export const RESIDUOS_ALIMENTACAO_OPCOES = [
  { id: 'organicos', label: 'Resíduos Orgânicos de Cozinha / Restos de Alimentos' },
  { id: 'oleo_fritura_usado', label: 'Óleo de Fritura Usado (OGU)' },
  { id: 'reciclaveis_secos', label: 'Recicláveis Secos (Vidro, Latas de Alumínio, Papelão)' },
  { id: 'rejeitos', label: 'Rejeitos Comuns / Aterro Sanitário' },
]

export interface ResultadoComparativoSegmentoAlimentacao {
  segmento: 'alimentacao'
  tipoEstabelecimentoRotulo: string
  faixaEstimadaEmissoesMensaisTco2e: { min: number; max: number }
  fatoresDestacados: Array<{
    fator: string
    impacto: 'alto' | 'medio' | 'baixo'
    descricao: string
  }>
  benchmarkSetorial: {
    mediaSegmentoTco2ePorNotaOuMilBrl: number
    posicaoReferencial: string
    dicaEconomiaCircular: string
  }
  conformidadePnrs: string
}

/**
 * Calcula estimativa e comparativo do segmento de Alimentação
 * Mantém o mesmo motor de fatores canônicos da plataforma
 */
export function calcularDiagnosticoAlimentacao(
  dados: PerguntasSegmentoAlimentacao,
): ResultadoComparativoSegmentoAlimentacao {
  const rotulosTipo: Record<string, string> = {
    restaurante: 'Restaurante / Buffet',
    bar: 'Bar / Choperia',
    lanchonete: 'Lanchonete / Fast-food',
    delivery: 'Operação Exclusiva Delivery / Dark Kitchen',
    padaria: 'Padaria / Confeitaria',
    refeicoes_coletivas: 'Refeições Coletivas / Cozinha Industrial',
  }

  // Base mensal por faturamento/porte (toneladas CO2e/mês estimadas)
  let baseMin = 0.4
  let baseMax = 1.8

  if (dados.porte_faturamento_mensal === '30k_a_100k') {
    baseMin = 1.2
    baseMax = 3.8
  } else if (dados.porte_faturamento_mensal === '100k_a_300k') {
    baseMin = 3.5
    baseMax = 9.5
  } else if (dados.porte_faturamento_mensal === 'acima_300k') {
    baseMin = 8.0
    baseMax = 24.0
  }

  // Multiplicadores por insumos intensivos
  if (dados.principais_insumos.includes('carnes')) {
    baseMin *= 1.35
    baseMax *= 1.45
  }
  if (dados.principais_insumos.includes('embalagens_plasticas')) {
    baseMin *= 1.15
    baseMax *= 1.2
  }
  if (
    dados.fontes_energia.includes('glp_botijao') ||
    dados.fontes_energia.includes('lenha_carvao')
  ) {
    baseMin *= 1.2
    baseMax *= 1.25
  }
  if (dados.origem_insumos === 'predominante_local_regional') {
    baseMin *= 0.88
    baseMax *= 0.9
  }

  const fatoresDestacados: ResultadoComparativoSegmentoAlimentacao['fatoresDestacados'] = []

  if (dados.principais_insumos.includes('carnes')) {
    fatoresDestacados.push({
      fator: 'Proteína Animal e Cadeia Frigorífica',
      impacto: 'alto',
      descricao:
        'Cadeia de carne bovina e laticínios responde pela maior fração de emissões incorporadas (Escopo 3 upstream). Fornecedores com rastreabilidade reduzem este índice.',
    })
  }

  if (
    dados.fontes_energia.includes('glp_botijao') ||
    dados.fontes_energia.includes('gas_encanado')
  ) {
    fatoresDestacados.push({
      fator: 'Combustão de GLP / Gás Natural',
      impacto: 'alto',
      descricao:
        'Queima direta de GLP na cocção gera emissões de Escopo 1 (2,98 kg CO₂e/kg de GLP). Monitoramento de rendimento e manutenção de queimadores evita desperdício.',
    })
  }

  if (
    dados.principais_insumos.includes('embalagens_plasticas') ||
    dados.principais_insumos.includes('embalagens_papel')
  ) {
    fatoresDestacados.push({
      fator: 'Embalagens e Descartáveis de Delivery (PNRS)',
      impacto: 'medio',
      descricao:
        'Logística reversa obrigatória de embalagens pós-consumo (Lei 12.305/2010 e Decreto 11.413/2023). A substituição por papel kraft certificado e parcerias com cooperativas reduzem passivo fiscal e ambiental.',
    })
  }

  if (dados.residuos_gerados.includes('oleo_fritura_usado')) {
    fatoresDestacados.push({
      fator: 'Destinação de Óleo de Fritura Usado (OGU)',
      impacto: 'medio',
      descricao:
        'Destinação certificada para biodiesel ou saboaria gera comprovante de circularidade com balanço de massa rastreável.',
    })
  }

  // PNRS
  let conformidadePnrs =
    'Em estruturação — recomendada homologação de destinação de embalagens e óleo vegetal com MTR / SINIR.'
  if (dados.logistica_reversa_embalagens === 'possui_coleta_ou_parceria') {
    conformidadePnrs =
      'Parceria declarada ativa — apto a comprovar rastreabilidade de logística reversa com laudo pericial.'
  } else if (dados.logistica_reversa_embalagens === 'nao_possui') {
    conformidadePnrs =
      'Pendente de implantação — passível de cobrança pelas diretrizes municipais e PNRS.'
  }

  return {
    segmento: 'alimentacao',
    tipoEstabelecimentoRotulo: rotulosTipo[dados.tipo_estabelecimento] || 'Alimentação & Bebidas',
    faixaEstimadaEmissoesMensaisTco2e: {
      min: Number(baseMin.toFixed(2)),
      max: Number(baseMax.toFixed(2)),
    },
    fatoresDestacados,
    benchmarkSetorial: {
      mediaSegmentoTco2ePorNotaOuMilBrl: 0.042, // ~42 kg CO2e a cada R$ 1.000 faturados na média food service BR
      posicaoReferencial:
        dados.origem_insumos === 'predominante_local_regional' &&
        dados.logistica_reversa_embalagens === 'possui_coleta_ou_parceria'
          ? 'Desempenho preliminar superior à média do segmento de alimentação (menor pegada de transporte e logística reversa ativa).'
          : 'Desempenho compatível com a média do segmento de bares e restaurantes brasileiros.',
      dicaEconomiaCircular:
        'Priorizar fornecedores com notas fiscais detalhadas (NCM dos insumos), adotar embalagens biodegradáveis ou recicláveis e emitir atestado de destinação do óleo de fritura.',
    },
    conformidadePnrs,
  }
}
