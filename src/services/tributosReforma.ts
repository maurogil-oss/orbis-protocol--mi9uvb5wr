/**
 * Motor de Cálculo e Análise Comparativa da Reforma Tributária
 * Base legal: Emenda Constitucional nº 132/2023, Lei Complementar nº 214/2025, LC 227/2026 e Decreto 12.955/2026.
 * Fase de testes IBS/CBS a partir de 1º/08/2026 (IBS 0,1% e CBS 0,9%); transição federativa até 2033 (pleno).
 */

import { classificarNCM } from './impostoSeletivo'

export type FaixaImpactoTributario = 'ganho_provavel' | 'neutro' | 'ponto_atencao'

export interface TributoLinhaComparativa {
  tributo: string
  hoje: string
  reforma: string
  detalhePersonalizado: string
  statusTag?: 'positivo' | 'neutro' | 'alerta'
}

export interface BlocoFaseTesteIbsCbs {
  possuiDestaqueReal: boolean
  valorIbsReal: number
  valorCbsReal: number
  valorTotalIbsCbs: number
  totalNotasAnalisadas: number
  notasComDestaque: number
  notasSemDestaque: number
  mensagem: string
  prazoObrigatoriedade: string
  baseLegal: string
}

export interface BlocoImpostoSeletivoAnalise {
  possuiItensIdentificados: boolean
  totalItensIdentificados: number
  categoriasEncontradas: { categoria: string; count: number; aliquota: string }[]
  ncmsIdentificados: string[]
  mensagem: string
  fonte: string
}

export interface ResultadoComparativoTributario {
  faixaImpacto: FaixaImpactoTributario
  tituloImpacto: string
  subtituloImpacto: string
  linhas: TributoLinhaComparativa[]
  resumoSetorial: string
  destaqueExportacao?: string
  transicaoInfo: string
  disclaimer: string
  // Novos blocos específicos da EC 132 e LC 214/2025
  faseTesteIbsCbs: BlocoFaseTesteIbsCbs
  impostoSeletivoAnalise: BlocoImpostoSeletivoAnalise
}

export interface ItemNFeParaComparativo {
  ncm?: string
  descricao?: string
  vIBS?: number
  vCBS?: number
}

export interface DadosCreditosReaisNFe {
  totalNotas: number
  periodoResumo?: string
  somaValorTotal: number
  somaPisCofins: number
  somaIcms: number
  somaIpi: number
  // Campos IBS/CBS reais agregados
  somaIbs?: number
  somaCbs?: number
  notasComIbsCbs?: number
  notasSemIbsCbs?: number
  // Itens ou NCMs das notas
  itensOuNCMs?: Array<{ ncm?: string; descricao?: string }>
}

export interface PerfilTributarioESGInput {
  regime_tributario?: string
  categoria_profissional?: string
  vinculo_institucional?: string
  faixa_emissoes?: 'abaixo_10k' | 'entre_10k_25k' | 'acima_25k' | 'nao_sei_calcular' | string
  exporta_ue_cbam?: 'sim' | 'nao' | string
  cbam_bens?: string
  cnae_descricao?: string
  razao_social?: string
  dadosNFeReais?: DadosCreditosReaisNFe
}

export function calcularComparativoTributario(
  input: PerfilTributarioESGInput,
): ResultadoComparativoTributario {
  const regime = input.regime_tributario || 'A confirmar'
  const isSimples = regime.toLowerCase().includes('simples')
  const isPresumido = regime.toLowerCase().includes('presumido')
  const isReal = regime.toLowerCase().includes('real')
  const exportaUE = input.exporta_ue_cbam === 'sim'
  const isMoverOrCDV =
    input.vinculo_institucional?.includes('MOVER') ||
    input.categoria_profissional?.includes('CDV') ||
    input.categoria_profissional?.includes('Desmontagem')
  const isAssociadoACP = input.vinculo_institucional?.includes('ACP')
  const isAltaEmissao =
    input.faixa_emissoes === 'acima_25k' || input.faixa_emissoes === 'entre_10k_25k'

  let faixa: FaixaImpactoTributario = 'neutro'
  let titulo = 'Impacto Tributário Neutro / Em Transição Adaptativa'
  let subtitulo =
    'O equilíbrio entre créditos mais amplos e alíquotas de referência dependerá da cadeia de fornecedores da empresa.'

  if (exportaUE) {
    faixa = 'ganho_provavel'
    titulo = 'Ganho Provável (Desoneração de Exportações & Crédito Presumido)'
    subtitulo =
      'A empresa se beneficia da imunidade plena nas exportações e do fim do acúmulo de créditos presos de PIS/Cofins e ICMS.'
  } else if (isSimples) {
    faixa = 'neutro'
    titulo = 'Transição Neutra com Opção Estratégica (Simples Nacional)'
    subtitulo =
      'A empresa pode optar por continuar no regime unificado do Simples ou recolher IBS/CBS por fora para transferir crédito aos clientes B2B.'
  } else if (isMoverOrCDV) {
    faixa = 'ganho_provavel'
    titulo = 'Ganho Provável (Circularidade & Créditos Plenos na Cadeia)'
    subtitulo =
      'A circularidade de peças e materiais ganha tração com a eliminação da cumulatividade e incentivos da mobilidade verde (MOVER).'
  } else if (isPresumido) {
    faixa = 'ponto_atencao'
    titulo = 'Ponto de Atenção (Planejamento de Créditos na Transição)'
    subtitulo =
      'A alíquota de referência unificada (IBS + CBS estimada em ~28%) exigirá mapeamento de insumos e auditoria de compras para tomada de créditos.'
  } else if (isReal) {
    faixa = 'ganho_provavel'
    titulo = 'Ganho Provável (Não-Cumulatividade Plena de Insumos)'
    subtitulo =
      'Fim das disputas de creditamento de PIS/Cofins e ressarcimento célere de saldos credores acumulados.'
  }

  const nfe = input.dadosNFeReais

  // Análise de NCMs reais para Imposto Seletivo
  let totalItensIS = 0
  const categoriasMap = new Map<string, { count: number; aliquota: string }>()
  const ncmsSet = new Set<string>()

  if (nfe?.itensOuNCMs && nfe.itensOuNCMs.length > 0) {
    nfe.itensOuNCMs.forEach((item) => {
      if (!item.ncm) return
      const res = classificarNCM(item.ncm)
      if (res.sujeito && res.categoria) {
        totalItensIS++
        ncmsSet.add(item.ncm.replace(/[^\d]/g, ''))
        const current = categoriasMap.get(res.categoria) || {
          count: 0,
          aliquota: res.aliquotaReferencial || '',
        }
        current.count++
        categoriasMap.set(res.categoria, current)
      }
    })
  }

  const categoriasISList = Array.from(categoriasMap.entries()).map(([cat, val]) => ({
    categoria: cat,
    count: val.count,
    aliquota: val.aliquota,
  }))

  const temItensISReais = totalItensIS > 0
  const nomesCategoriasIS = categoriasISList
    .map((c) => `${c.categoria} (${c.count} itens)`)
    .join(', ')

  // 1. Linha PIS / COFINS -> CBS
  let pisCofinsHoje =
    nfe && nfe.somaPisCofins > 0
      ? `R$ ${nfe.somaPisCofins.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} apurados (baseado em ${nfe.totalNotas} notas${nfe.periodoResumo ? `, ${nfe.periodoResumo}` : ''})`
      : 'PIS (0,65% a 1,65%) e Cofins (3% a 7,6%), cumulatividade parcial'

  let cbsReforma = 'CBS (Contribuição sobre Bens e Serviços - Federal, ~8,8%) com crédito integral'
  let pisDetalhe =
    nfe && nfe.somaPisCofins > 0
      ? `Créditos reais de PIS/Cofins extraídos dos XMLs enviados (R$ ${nfe.somaPisCofins.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}). Na CBS, esses insumos geram crédito financeiro irrestrito sobre a base ampla, eliminando o contencioso fiscal.`
      : 'Não-cumulatividade plena: crédito sobre todas as aquisições de bens e serviços tributados ("base ampla"), acabando com o litígio sobre o conceito restritivo de insumo.'

  if (isSimples && (!nfe || nfe.somaPisCofins === 0)) {
    pisCofinsHoje = 'Recolhido em guia única (DAS) dentro da faixa da receita bruta'
    cbsReforma = 'Possibilidade de recolher CBS no DAS ou apurar pelo regime regular'
    pisDetalhe =
      'Se optar por recolher no regime geral da CBS, transfere crédito financeiro integral para clientes corporativos (B2B), aumentando a competitividade de vendas.'
  } else if (exportaUE && (!nfe || nfe.somaPisCofins === 0)) {
    pisDetalhe =
      'Receitas de exportação mantêm imunidade absoluta na CBS, com devolução rápida em dinheiro ou compensação líquida de créditos decorrentes de insumos.'
  }

  // 2. Linha ICMS / ISS -> IBS
  let icmsIssHoje =
    nfe && nfe.somaIcms > 0
      ? `R$ ${nfe.somaIcms.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} de ICMS destacado (${nfe.totalNotas} notas reais)`
      : 'ICMS (estadual, 17% a 20,5%) e ISS (municipal, 2% a 5%)'

  let ibsReforma = 'IBS (Imposto sobre Bens e Serviços - Estados e Municípios, ~19,2%)'
  let ibsDetalhe =
    nfe && nfe.somaIcms > 0
      ? `ICMS real apurado nos XMLs: R$ ${nfe.somaIcms.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}. Com o IBS cobrado no destino, todo esse montante passa a ser creditável sem necessidade de estorno por guerra fiscal interestadual.`
      : 'Cobrança no destino final do consumo (fim da guerra fiscal interestadual e dos benefícios temporários); transição federativa gradual da receita até 2033.'

  if (isAssociadoACP && (!nfe || nfe.somaIcms === 0)) {
    ibsDetalhe =
      'Fim da guerra fiscal entre Paraná, Santa Catarina e São Paulo; vendas interestaduais passam a ser tributadas no destino pelo Comitê Gestor do IBS, com regras uniformes.'
  }

  // 3. Linha IPI -> Imposto Seletivo ("Imposto do Pecado")
  let ipiHoje =
    nfe && nfe.somaIpi > 0
      ? `R$ ${nfe.somaIpi.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} de IPI destacado (${nfe.totalNotas} notas)`
      : 'IPI cobrado na industrialização (tabela TIPI ampla de 0% a 30%+)'

  let ipiReforma =
    'IPI residual apenas para incentivo da ZFM e Imposto Seletivo (IS) sobre nocivos à saúde e meio ambiente'

  let ipiDetalhe = ''
  if (temItensISReais) {
    ipiDetalhe = `Sua empresa opera ${totalItensIS} item(ns) potencialmente sujeito(s) ao Imposto Seletivo (categoria(s): ${nomesCategoriasIS}), classificados pela LC 214/2025. É recomendada a revisão técnica dos cadastros fiscais para mitigar o impacto de caixa.`
  } else if (nfe && nfe.totalNotas > 0) {
    ipiDetalhe =
      nfe.somaIpi > 0
        ? `IPI real recolhido nas notas: R$ ${nfe.somaIpi.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}. Nenhum NCM das notas importadas foi enquadrado nas listas nocivas do Imposto Seletivo da LC 214/2025: essa carga tende a ser zerada na transição, gerando ganho de caixa.`
        : 'Nenhum item das notas fiscais importadas está sujeito ao Imposto Seletivo da LC 214/2025. A carga de IPI é zerada para produtos não nocivos.'
  } else {
    // Sem notas importadas -> estimativa padrão
    if (isMoverOrCDV) {
      ipiDetalhe =
        'Desmontagem de veículos (CDV) e peças recicladas ficam FORA da incidência do Seletivo e ganham vantagem comparativa frente a veículos virgens poluentes.'
    } else if (!isAltaEmissao && !exportaUE) {
      ipiDetalhe =
        'O setor de atuação da empresa tende a ficar TOTALMENTE FORA do Imposto Seletivo, eliminando burocracias com tabelas de NCM/TIPI.'
    } else {
      ipiDetalhe =
        'O IPI tradicional é praticamente extinto. O Imposto Seletivo incidirá estritamente sobre bens prejudiciais à saúde ou meio ambiente (veículos poluentes, combustíveis fósseis, fumo, bebidas).'
    }
  }

  // 4. Linha Exportação & Mecanismo CBAM
  let expHoje = 'Desoneração com saldo credor muitas vezes represado por anos'
  let expReforma = 'Desoneração total no destino + ressarcimento ágil de IBS/CBS'
  let expDetalhe =
    'Princípio da tributação no destino: exportações brasileiras saem desoneradas de IBS e CBS, com direito a restituição líquida garantida em prazo legal.'

  if (exportaUE) {
    expDetalhe = `Empresa assinalou exportação para a UE (${input.cbam_bens || 'bens industriais'}). Na reforma, a neutralidade tributária de IBS/CBS fortalece a competitividade cambial, enquanto a mensuração rigorosa de carbono evita penalidades no Mecanismo CBAM europeu.`
  }

  const linhas: TributoLinhaComparativa[] = [
    {
      tributo: 'PIS / Cofins → CBS',
      hoje: pisCofinsHoje,
      reforma: cbsReforma,
      detalhePersonalizado: pisDetalhe,
      statusTag: isReal || exportaUE ? 'positivo' : 'neutro',
    },
    {
      tributo: 'ICMS e ISS → IBS',
      hoje: icmsIssHoje,
      reforma: ibsReforma,
      detalhePersonalizado: ibsDetalhe,
      statusTag: 'neutro',
    },
    {
      tributo: 'IPI → Imposto Seletivo (IS)',
      hoje: ipiHoje,
      reforma: ipiReforma,
      detalhePersonalizado: ipiDetalhe,
      statusTag: temItensISReais ? 'alerta' : 'positivo',
    },
    {
      tributo: 'Comércio Exterior & Exportação',
      hoje: expHoje,
      reforma: expReforma,
      detalhePersonalizado: expDetalhe,
      statusTag: exportaUE ? 'positivo' : 'neutro',
    },
  ]

  let resumoSetorial = `Análise fundamentada no regime declarado (${regime}) e no perfil de emissões e governança da empresa.`
  if (exportaUE) {
    resumoSetorial += ` A convergência entre o crédito financeiro pleno da reforma tributária e a auditoria de emissões dMRV confere blindagem contra retenções alfandegárias no mercado comum europeu.`
  }

  // Configuração do Bloco "IBS/CBS na Fase-teste"
  const valorIbsReal = nfe?.somaIbs || 0
  const valorCbsReal = nfe?.somaCbs || 0
  const valorTotalIbsCbs = valorIbsReal + valorCbsReal
  const notasComDestaque = nfe?.notasComIbsCbs || 0
  const notasSemDestaque = nfe?.notasSemIbsCbs || 0
  const totalNotas = nfe?.totalNotas || 0
  const possuiDestaqueReal = valorTotalIbsCbs > 0 || notasComDestaque > 0

  const faseTesteIbsCbs: BlocoFaseTesteIbsCbs = {
    possuiDestaqueReal,
    valorIbsReal,
    valorCbsReal,
    valorTotalIbsCbs,
    totalNotasAnalisadas: totalNotas,
    notasComDestaque,
    notasSemDestaque,
    mensagem: possuiDestaqueReal
      ? `Valores reais de IBS/CBS apurados nos XMLs: R$ ${valorTotalIbsCbs.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (IBS: R$ ${valorIbsReal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} | CBS: R$ ${valorCbsReal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}). Na fase-teste de 2026, as alíquotas de referência são IBS 0,1% e CBS 0,9%, com recolhimento dispensado se cumpridas as obrigações acessórias (art. 348 da LC 214/2025).`
      : 'Nota sem destaque IBS/CBS — a partir de 1º/08/2026 o destaque (IBS 0,1% / CBS 0,9% na fase-teste) é obrigatório; verifique a atualização do emissor do ERP. O recolhimento efetivo é dispensado se as obrigações acessórias forem entregues em conformidade.',
    prazoObrigatoriedade: '1º de agosto de 2026',
    baseLegal: 'Art. 348 da LC 214/2025, LC 227/2026 e Decreto 12.955/2026',
  }

  // Configuração do Bloco "Imposto Seletivo Classificado por NCM"
  const impostoSeletivoAnalise: BlocoImpostoSeletivoAnalise = {
    possuiItensIdentificados: temItensISReais,
    totalItensIdentificados: totalItensIS,
    categoriasEncontradas: categoriasISList,
    ncmsIdentificados: Array.from(ncmsSet),
    mensagem: temItensISReais
      ? `Sua empresa opera ${totalItensIS} item(ns) potencialmente sujeito(s) ao Imposto Seletivo: ${nomesCategoriasIS}.`
      : nfe && nfe.totalNotas > 0
        ? 'Nenhum NCM das notas importadas coincide com as listas de bens prejudiciais à saúde ou meio ambiente sujeitos ao Imposto Seletivo da LC 214/2025.'
        : 'Estimativa baseada no perfil da empresa. Sem notas fiscais importadas, a incidência de Imposto Seletivo é avaliada de forma preliminar.',
    fonte: 'LC 214/2025, Anexo referente ao IS',
  }

  return {
    faixaImpacto: faixa,
    tituloImpacto: titulo,
    subtituloImpacto: subtitulo,
    linhas,
    resumoSetorial,
    destaqueExportacao: exportaUE
      ? `Atenção CBAM: Bens declarados "${input.cbam_bens || 'cobertos'}" contarão com crédito presumido integral de IBS/CBS na saída e exigem inventário certificado de GEE para aduanas da UE.`
      : undefined,
    transicaoInfo:
      'Cronograma Oficial: Início da fase de teste do IBS/CBS em 1º/08/2026 (IBS 0,1% e CBS 0,9%), CBS efetiva em 2027, transição federativa do IBS de 2029 a 2032 e regime pleno a partir de 2033.',
    disclaimer:
      nfe && nfe.totalNotas > 0
        ? `Valores vigentes baseados em ${nfe.totalNotas} notas fiscais reais importadas pelo contribuinte. Fonte: LC 214/2025, LC 227/2026 e Decreto 12.955/2026 (estimativa educativa preliminar sujeita a regulamentações do Comitê Gestor do IBS e RFB).`
        : 'Estimativa preliminar e educativa — não substitui análise tributária formal; a fase de teste do IBS/CBS inicia em 1º/08/2026 conforme a LC 214/2025 e Decreto 12.955/2026.',
    faseTesteIbsCbs,
    impostoSeletivoAnalise,
  }
}
