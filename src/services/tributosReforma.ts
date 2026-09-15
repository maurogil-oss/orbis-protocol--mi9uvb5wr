/**
 * Motor de Cálculo e Análise Comparativa da Reforma Tributária
 * Base legal: Emenda Constitucional nº 132/2023, Lei Complementar (ex.: PLP 68/2024 / Lei 517/2025)
 * Fase de testes IBS/CBS a partir de 2026; transição federativa até 2078.
 */

export type FaixaImpactoTributario = 'ganho_provavel' | 'neutro' | 'ponto_atencao'

export interface TributoLinhaComparativa {
  tributo: string
  hoje: string
  reforma: string
  detalhePersonalizado: string
  statusTag?: 'positivo' | 'neutro' | 'alerta'
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

  // Determinação da faixa de impacto qualitativo
  // Simples Nacional: tem regras e sublimites próprios de transição (opção por manter recolhimento unificado ou destacar IBS/CBS para transferir créditos a clientes B2B)
  // Exportadores: forte "ganho_provavel" por desoneração ampla e crédito presumido de IBS/CBS
  // Lucro Real com insumos tributados / cadeia longa: "ganho_provavel" pelo fim do resíduo cumulativo
  // Serviços puros no Lucro Presumido sem insumos: "ponto_atencao" pela alíquota de referência (~28%), salvo setores com redução
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

  // 1. Linha PIS / COFINS -> CBS
  let pisCofinsHoje = 'PIS (0,65% a 1,65%) e Cofins (3% a 7,6%), cumulatividade parcial'
  let cbsReforma = 'CBS (Contribuição sobre Bens e Serviços - Federal, ~8,8%) com crédito integral'
  let pisDetalhe =
    'Não-cumulatividade plena: crédito sobre todas as aquisições de bens e serviços tributados ("base ampla"), acabando com o litígio sobre o conceito restritivo de insumo.'

  if (isSimples) {
    pisCofinsHoje = 'Recolhido em guia única (DAS) dentro da faixa da receita bruta'
    cbsReforma = 'Possibilidade de recolher CBS no DAS ou apurar pelo regime regular'
    pisDetalhe =
      'Se optar por recolher no regime geral da CBS, transfere crédito financeiro integral para clientes corporativos (B2B), aumentando a competitividade de vendas.'
  } else if (exportaUE) {
    pisDetalhe =
      'Receitas de exportação mantêm imunidade absoluta na CBS, com devolução rápida em dinheiro ou compensação líquida de créditos decorrentes de insumos.'
  }

  // 2. Linha ICMS / ISS -> IBS
  let icmsIssHoje = 'ICMS (estadual, 17% a 20,5%) e ISS (municipal, 2% a 5%)'
  let ibsReforma = 'IBS (Imposto sobre Bens e Serviços - Estados e Municípios, ~19,2%)'
  let ibsDetalhe =
    'Cobrança no destino final do consumo (fim da guerra fiscal interestadual e dos benefícios temporários); transição federativa gradual da receita até 2078.'

  if (isAssociadoACP) {
    ibsDetalhe =
      'Fim da guerra fiscal entre Paraná, Santa Catarina e São Paulo; vendas interestaduais passam a ser tributadas no destino pelo Comitê Gestor do IBS, com regras uniformes.'
  }

  // 3. Linha IPI -> Imposto Seletivo ("Imposto do Pecado")
  let ipiHoje = 'IPI cobrado na industrialização (tabela TIPI ampla de 0% a 30%+)'
  let ipiReforma =
    'IPI residual apenas para incentivo da ZFM e Imposto Seletivo (IS) sobre nocivos à saúde e meio ambiente'
  let ipiDetalhe =
    'O IPI tradicional é praticamente extinto. O Imposto Seletivo incidirá estritamente sobre bens prejudiciais à saúde ou meio ambiente (veículos poluentes, combustíveis fósseis, fumo, bebidas).'

  if (isMoverOrCDV) {
    ipiDetalhe =
      'Desmontagem de veículos (CDV) e peças recicladas ficam FORA da incidência do Seletivo e ganham vantagem comparativa frente a veículos virgens poluentes.'
  } else if (!isAltaEmissao && !exportaUE) {
    ipiDetalhe =
      'O setor de atuação da empresa tende a ficar TOTALMENTE FORA do Imposto Seletivo, eliminando burocracias com tabelas de NCM/TIPI.'
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
      statusTag: 'positivo',
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
      'Cronograma Oficial: Início da fase de teste do IBS/CBS em 2026 (alíquota teste de 0,9% CBS e 0,1% IBS), extinção gradual do PIS/Cofins até 2027 e transição do ICMS/ISS até 2032.',
    disclaimer:
      'Estimativa preliminar e educativa — não substitui análise tributária formal; a fase de teste do IBS/CBS inicia em 2026 e as alíquotas-setor serão definidas por lei complementar.',
  }
}
