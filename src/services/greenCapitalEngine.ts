/**
 * GREEN CAPITAL ENGINE — MOTOR DE CRÉDITO VERDE & SPREAD BONIFICADO
 * Orbis Protocol • Conexão dMRV para Financiamento Sustentável
 *
 * Compara taxas de mercado padrão x taxas bonificadas por comprovação de descarbonização
 * (inventário GHG Protocol, laudo com ART, selo Orbis dMRV).
 *
 * Base regulatória e bancária:
 * - Resolução BCB 4.945/2021 (Políticas de Responsabilidade Social, Ambiental e Climática - PRSAC)
 * - BNDES Fundo Clima (Decreto 11.548/2023)
 * - Linhas BRDE, Fomento Paraná, Banco do Brasil, Santander, Sicredi e Itaú
 */

export type FinalidadeCreditoVerde =
  | 'eficiencia_energetica'
  | 'frota_eletrica_gas'
  | 'economia_circular'
  | 'energia_solar'
  | 'agro_verde'

export interface LinhaCreditoVerde {
  id: string
  nome: string
  instituicao: string
  logoInstituicao?: string
  categoria: 'Publico' | 'Desenvolvimento Regional' | 'Cooperativo' | 'Privado Comercial'
  publicoAlvo: string
  faixaValorMin: number
  faixaValorMax: number
  prazoMinMeses: number
  prazoMaxMeses: number
  carenciaMeses: number
  // Taxas nominais anuais estimativas (%)
  taxaPadraoMercadoAa: number // Ex: 16.5% a.a. (CDI + spread ou pré padrão)
  taxaBonificadaVerdeAa: number // Ex: 9.5% a.a. (com laudo/selo Orbis)
  finalidadesCompativeis: FinalidadeCreditoVerde[]
  exigenciasDocumentais: string[]
  evidenciasQueOrbisAtende: string[]
  criteriosEnquadramento: string[]
  descricao: string
  linkInstitucional?: string
}

export const LINHAS_CREDITO_VERDE: LinhaCreditoVerde[] = [
  {
    id: 'bndes_fundo_clima',
    nome: 'BNDES Fundo Clima (Subprograma Indústria & Cidades Sustentáveis)',
    instituicao: 'BNDES',
    categoria: 'Publico',
    publicoAlvo: 'Indústrias, empresas de médio e grande porte, transportadoras e concessionárias',
    faixaValorMin: 150000,
    faixaValorMax: 50000000,
    prazoMinMeses: 36,
    prazoMaxMeses: 192, // até 16 anos
    carenciaMeses: 24,
    taxaPadraoMercadoAa: 15.5,
    taxaBonificadaVerdeAa: 8.0, // Custo financeiro subsidiado TR/TF + spread reduzido
    finalidadesCompativeis: [
      'eficiencia_energetica',
      'frota_eletrica_gas',
      'economia_circular',
      'energia_solar',
    ],
    exigenciasDocumentais: [
      'Inventário corporativo de GEE (Escopo 1 e 2)',
      'Laudo técnico de viabilidade ambiental com ART/RRT',
      'Plano de investimento e redução projetada de tCO₂e',
      'Certidões negativas fiscais e ambientais vigentes',
    ],
    evidenciasQueOrbisAtende: [
      'Inventário completo Escopo 1, 2 e 3 do Motor Pericial Orbis',
      'Laudo pericial preliminar com metadados probatórios e chancela',
      'Estimativa preliminar alinhada à Lei 15.042/2024 (SBCE)',
    ],
    criteriosEnquadramento: [
      'Redução mínima comprovável de 15% na intensidade de carbono ou eletrificação de processos',
      'Projetos de infraestrutura urbana, mobilidade de baixa emissão e circularidade',
    ],
    descricao:
      'Linha federal com os menores spreads do país para mitigação de mudanças climáticas. Exige rigorosa comprovação dMRV de redução de emissões.',
  },
  {
    id: 'brde_dossie_verde',
    nome: 'BRDE Crédito Verde (Banco Regional de Desenvolvimento do Extremo Sul)',
    instituicao: 'BRDE',
    categoria: 'Desenvolvimento Regional',
    publicoAlvo:
      'Empresas do PR, SC e RS de qualquer porte, indústrias e cooperativas agroindustriais',
    faixaValorMin: 100000,
    faixaValorMax: 20000000,
    prazoMinMeses: 24,
    prazoMaxMeses: 120,
    carenciaMeses: 18,
    taxaPadraoMercadoAa: 16.0,
    taxaBonificadaVerdeAa: 9.8,
    finalidadesCompativeis: [
      'energia_solar',
      'eficiencia_energetica',
      'economia_circular',
      'agro_verde',
    ],
    exigenciasDocumentais: [
      'Dossiê de elegibilidade socioambiental e climática',
      'Laudo de neutralização ou balanço de carbono auditado',
      'Projeto de engenharia com responsável técnico',
      'Cadastro de fornecedores homologados',
    ],
    evidenciasQueOrbisAtende: [
      'Dossiê Verde para Spread Bancário gerado no Orbis Protocol',
      'Duplo reporte Escopo 2 (Localização x Mercado Livre com I-REC)',
      'Memória de cálculo baseada em fatores oficiais MCTI/SIN',
    ],
    criteriosEnquadramento: [
      'Localização da operação nos estados do Paraná, Santa Catarina ou Rio Grande do Sul',
      'Apresentação de métricas mensuráveis de ecoeficiência operacional',
    ],
    descricao:
      'Financiamento estruturado para a região Sul com bonificação tarifária atrelada à apresentação do dossiê de descarbonização pericial.',
  },
  {
    id: 'fomento_parana_verde',
    nome: 'Fomento Paraná — Linha Paraná Clima & Ecoeficiência',
    instituicao: 'Fomento Paraná',
    categoria: 'Desenvolvimento Regional',
    publicoAlvo: 'Micro, pequenas e médias empresas estabelecidas no Estado do Paraná',
    faixaValorMin: 30000,
    faixaValorMax: 3000000,
    prazoMinMeses: 18,
    prazoMaxMeses: 72,
    carenciaMeses: 12,
    taxaPadraoMercadoAa: 17.2,
    taxaBonificadaVerdeAa: 10.5,
    finalidadesCompativeis: ['energia_solar', 'eficiencia_energetica', 'economia_circular'],
    exigenciasDocumentais: [
      'Comprovante de registro e atividade no Estado do Paraná',
      'Diagnóstico de sustentabilidade e consumo de insumos',
      'Orçamento dos equipamentos ou retrofitting industrial',
    ],
    evidenciasQueOrbisAtende: [
      'Diagnóstico Orbis Protocol com chancela de Associação Comercial (ACP Paraná)',
      'Relatório analítico comparativo IBS/CBS e créditos de inovação',
    ],
    criteriosEnquadramento: [
      'Empresas paranaenses com faturamento até R$ 16 milhões/ano',
      'Investimento em geração solar distribuída, maquinário eficiente ou gestão de resíduos',
    ],
    descricao:
      'Condições especiais para pequenas e médias empresas do Paraná que comprovem compromisso de transição energética e economia de baixo carbono.',
  },
  {
    id: 'bb_pronampe_verde',
    nome: 'Banco do Brasil — Pronampe Verde & Linha Agro Sustentável',
    instituicao: 'Banco do Brasil',
    categoria: 'Publico',
    publicoAlvo: 'MPEs, produtores rurais, agroindústrias e cooperativas agrícolas',
    faixaValorMin: 50000,
    faixaValorMax: 5000000,
    prazoMinMeses: 24,
    prazoMaxMeses: 84,
    carenciaMeses: 12,
    taxaPadraoMercadoAa: 16.8,
    taxaBonificadaVerdeAa: 11.2,
    finalidadesCompativeis: ['agro_verde', 'energia_solar', 'eficiencia_energetica'],
    exigenciasDocumentais: [
      'Declaração de enquadramento PRSAC / Res. BCB 4.945',
      'CAR (Cadastro Ambiental Rural) para imóveis rurais',
      'Inventário preliminar de emissões ou certificação de boas práticas',
    ],
    evidenciasQueOrbisAtende: [
      'Preparação para Resolução BCB 4.945/2021 (Políticas PRSAC bancárias)',
      'Inventário de emissões do Motor Pericial Orbis com GWP AR6',
    ],
    criteriosEnquadramento: [
      'Enquadramento no Pronampe ou linhas do Plano Safra Verde',
      'Projetos de bioinsumos, recuperação de pastagens e energia fotovoltaica',
    ],
    descricao:
      'Taxa subsidiada com desconto no spread do BB para empresas e produtores com práticas comprovadas de preservação e baixa emissão.',
  },
  {
    id: 'santander_sll',
    nome: 'Santander — Sustainability-Linked Loan (SLL) Corporativo',
    instituicao: 'Santander',
    categoria: 'Privado Comercial',
    publicoAlvo: 'Médias e grandes empresas (Lucro Real ou Presumido) com metas de ESG',
    faixaValorMin: 500000,
    faixaValorMax: 30000000,
    prazoMinMeses: 24,
    prazoMaxMeses: 96,
    carenciaMeses: 12,
    taxaPadraoMercadoAa: 15.8,
    taxaBonificadaVerdeAa: 11.8,
    finalidadesCompativeis: [
      'eficiencia_energetica',
      'frota_eletrica_gas',
      'economia_circular',
      'energia_solar',
    ],
    exigenciasDocumentais: [
      'Definição de KPIs de sustentabilidade com meta anual auditada (ex.: redução de tCO₂e)',
      'Relatório anual de emissões por auditoria independente',
      'Demonstrativo fiscal com histórico contábil (SPED/ECF)',
    ],
    evidenciasQueOrbisAtende: [
      'Trilha de auditoria dMRV do Orbis com hash SHA-256 e registro criptográfico',
      'Histórico de notas fiscais NF-e/NF3e/CT-e processadas no motor pericial',
      'Selo Orbis Protocol com QR Code verificável',
    ],
    criteriosEnquadramento: [
      'Compromisso contratual com redução escalonada de pegada de carbono',
      'Spread cai progressivamente a cada ano em que a meta do laudo é batida',
    ],
    descricao:
      'Empréstimo atrelado a metas: o spread bancário diminui automaticamente conforme a empresa atesta a redução de emissões via laudos periciais.',
  },
  {
    id: 'sicredi_agro_associados',
    nome: 'Sicredi — Linha Agro & Cooperados Sustentabilidade',
    instituicao: 'Sicredi',
    categoria: 'Cooperativo',
    publicoAlvo: 'Cooperados Sicredi, produtores agropecuários e empresas ligadas ao agronegócio',
    faixaValorMin: 40000,
    faixaValorMax: 4000000,
    prazoMinMeses: 18,
    prazoMaxMeses: 72,
    carenciaMeses: 12,
    taxaPadraoMercadoAa: 16.2,
    taxaBonificadaVerdeAa: 11.0,
    finalidadesCompativeis: ['agro_verde', 'energia_solar', 'eficiencia_energetica'],
    exigenciasDocumentais: [
      'Vínculo de cooperado ativo no Sicredi',
      'Diagnóstico de pegada ambiental das propriedades ou instalações',
      'Comprovação de destinação de resíduos',
    ],
    evidenciasQueOrbisAtende: [
      'Dossiê com métricas de Escopo 1 (combustíveis e agroquímicos) e Escopo 2',
      'Laudo técnico padronizado com ART/RRT acoplada',
    ],
    criteriosEnquadramento: [
      'Aquisição de sistemas fotovoltaicos, irrigação de alta precisão ou biogás',
      'Adequação aos critérios cooperativos de sustentabilidade comunitária',
    ],
    descricao:
      'Linha do sistema cooperativo que bonifica associados que adotam práticas limpas e comprovam responsabilidade ambiental com laudo formal.',
  },
  {
    id: 'sicredi_circularidade',
    nome: 'Sicredi — Linha Cooperado Economia Circular & Reciclagem',
    instituicao: 'Sicredi',
    categoria: 'Cooperativo',
    publicoAlvo: 'PMEs, Centros de Desmontagem Veicular (CDV), recicladores e comércios de reúso',
    faixaValorMin: 30000,
    faixaValorMax: 2500000,
    prazoMinMeses: 12,
    prazoMaxMeses: 60,
    carenciaMeses: 6,
    taxaPadraoMercadoAa: 16.9,
    taxaBonificadaVerdeAa: 11.5,
    finalidadesCompativeis: ['economia_circular', 'eficiencia_energetica'],
    exigenciasDocumentais: [
      'Comprovação de reaproveitamento de materiais ou desmanche credenciado DETRAN',
      'Inventário de peças ou insumos recuperados (Insetting ISO 14067)',
      'Licença ambiental simplificada ou dispensa oficial',
    ],
    evidenciasQueOrbisAtende: [
      'Insetting Circular ISO 14067 apurado no Orbis (evitação de matéria virgem)',
      'Passaporte Digital de Produto (DPP) para rastreio de peças de reúso',
      'Aderência à Trilha MOVER e economia circular automotiva',
    ],
    criteriosEnquadramento: [
      'Operações de logística reversa, recondicionamento de peças e economia circular',
    ],
    descricao:
      'Voltada especificamente para empresas que operam na esteira da economia circular e reaproveitamento de materiais com emissão evitada.',
  },
  {
    id: 'itau_frotas_verdes',
    nome: 'Itaú BBA — Financiamento de Frotas & Veículos de Baixa Emissão',
    instituicao: 'Itaú',
    categoria: 'Privado Comercial',
    publicoAlvo: 'Transportadoras, frotistas, indústrias e empresas de entrega/distribuição',
    faixaValorMin: 100000,
    faixaValorMax: 15000000,
    prazoMinMeses: 24,
    prazoMaxMeses: 72,
    carenciaMeses: 6,
    taxaPadraoMercadoAa: 16.4,
    taxaBonificadaVerdeAa: 11.9,
    finalidadesCompativeis: ['frota_eletrica_gas', 'eficiencia_energetica'],
    exigenciasDocumentais: [
      'Plano de substituição de veículos a combustão por elétricos, híbridos ou biometano',
      'Memória de cálculo de emissões evitadas na frota (tCO₂e/ano)',
      'Relatório de gestão de combustíveis (CT-e / NF-e)',
    ],
    evidenciasQueOrbisAtende: [
      'Apuração de Escopo 1 (diesel vs biocombustíveis) e Escopo 3 (logística terceirizada) do Orbis',
      'Cálculo de emissões pelo GWP AR6 do GHG Protocol Brasil',
      'Comparativo de economia tributária IBS/CBS na transição da frota',
    ],
    criteriosEnquadramento: [
      'Aquisição de caminhões elétricos, vans utilitárias, empilhadeiras ou veículos a gás natural/biometano',
      'Mínimo de 3 veículos ou investimento superior a R$ 100 mil',
    ],
    descricao:
      'Taxas reduzidas para modernização de frotas comerciais com foco em transição energética e descarbonização da logística urbana e rodoviária.',
  },
]

export interface SimulacaoCreditoVerdeInput {
  valorDesejado: number
  prazoMeses: number
  finalidade: FinalidadeCreditoVerde
  porteEmpresa?: 'micro_pequena' | 'media' | 'grande'
  segmento?: string
  regimeTributario?: string
  temInventarioOrbis?: boolean
  emissoesTotaisTCO2e?: number
}

export interface ResultadoLinhaSimulada {
  linha: LinhaCreditoVerde
  compativel: boolean
  motivosIncompatibilidade: string[]
  valorSimulado: number
  prazoMeses: number
  taxaPadraoAa: number
  taxaBonificadaAa: number
  diferencaSpreadPontos: number // Ex: 7.5 p.p.
  // Financiamento Price simplificado
  parcelaMensalPadrao: number
  parcelaMensalBonificada: number
  economiaMensal: number
  economiaAnual: number
  economiaTotalPrazo: number
  economiaPercentualSobreJuros: number
  nivelAderenciaOrbis: 'alta' | 'media' | 'basica'
}

export interface ResultadoGreenCapitalEngine {
  valorDesejado: number
  prazoMeses: number
  finalidade: FinalidadeCreditoVerde
  linhasAvaliadas: ResultadoLinhaSimulada[]
  melhorLinha: ResultadoLinhaSimulada | null
  economiaTotalMaxima: number
  economiaAnualMaxima: number
  totalLinhasCompativeis: number
  disclaimer: string
}

/**
 * Fórmula da Tabela Price para simulação de prestação mensal fixa
 */
function calcularParcelaPrice(valor: number, taxaAnualPct: number, prazoMeses: number): number {
  if (taxaAnualPct <= 0 || prazoMeses <= 0 || valor <= 0) return 0
  // Taxa mensal equivalente
  const i = Math.pow(1 + taxaAnualPct / 100, 1 / 12) - 1
  const parcela = (valor * (i * Math.pow(1 + i, prazoMeses))) / (Math.pow(1 + i, prazoMeses) - 1)
  return Number.isFinite(parcela) ? parcela : 0
}

/**
 * Executa a simulação completa do Green Capital Engine
 */
export function simularGreenCapitalEngine(
  input: SimulacaoCreditoVerdeInput,
): ResultadoGreenCapitalEngine {
  const valor = Math.max(10000, input.valorDesejado || 300000)
  const prazo = Math.min(192, Math.max(12, input.prazoMeses || 48))

  const linhasAvaliadas: ResultadoLinhaSimulada[] = LINHAS_CREDITO_VERDE.map((linha) => {
    const motivos: string[] = []

    // Verifica compatibilidade de valor
    if (valor < linha.faixaValorMin) {
      motivos.push(
        `Valor abaixo do mínimo operacional desta linha (mínimo: R$ ${linha.faixaValorMin.toLocaleString('pt-BR')})`,
      )
    }
    if (valor > linha.faixaValorMax) {
      motivos.push(
        `Valor acima do teto desta linha (máximo: R$ ${linha.faixaValorMax.toLocaleString('pt-BR')})`,
      )
    }

    // Verifica compatibilidade de prazo
    const prazoAjustado = Math.min(linha.prazoMaxMeses, Math.max(linha.prazoMinMeses, prazo))
    if (prazo > linha.prazoMaxMeses) {
      motivos.push(
        `Prazo solicitado (${prazo} meses) excede o teto desta linha (${linha.prazoMaxMeses} meses)`,
      )
    }

    // Verifica compatibilidade de finalidade
    const atendeFinalidade = linha.finalidadesCompativeis.includes(input.finalidade)
    if (!atendeFinalidade) {
      motivos.push(
        `Esta linha não contempla a finalidade "${formatarFinalidade(input.finalidade)}"`,
      )
    }

    const compativel = motivos.length === 0

    // Cálculo financeiro
    const parcelaPadrao = calcularParcelaPrice(valor, linha.taxaPadraoMercadoAa, prazoAjustado)
    const parcelaBonificada = calcularParcelaPrice(
      valor,
      linha.taxaBonificadaVerdeAa,
      prazoAjustado,
    )

    const totalPagoPadrao = parcelaPadrao * prazoAjustado
    const totalPagoBonificado = parcelaBonificada * prazoAjustado
    const jurosPadrao = Math.max(0, totalPagoPadrao - valor)
    const jurosBonificado = Math.max(0, totalPagoBonificado - valor)

    const economiaTotal = Math.max(0, totalPagoPadrao - totalPagoBonificado)
    const economiaMensal = Math.max(0, parcelaPadrao - parcelaBonificada)
    const economiaAnual = economiaMensal * 12
    const diferencaSpread = Number(
      (linha.taxaPadraoMercadoAa - linha.taxaBonificadaVerdeAa).toFixed(2),
    )

    const economiaPercentualSobreJuros =
      jurosPadrao > 0 ? Number(((economiaTotal / jurosPadrao) * 100).toFixed(1)) : 0

    // Aderência Orbis
    let nivelAderencia: 'alta' | 'media' | 'basica' = 'media'
    if (
      linha.id === 'bndes_fundo_clima' ||
      linha.id === 'brde_dossie_verde' ||
      linha.id === 'santander_sll'
    ) {
      nivelAderencia = 'alta'
    } else if (linha.id === 'sicredi_circularidade' && input.finalidade === 'economia_circular') {
      nivelAderencia = 'alta'
    }

    return {
      linha,
      compativel,
      motivosIncompatibilidade: motivos,
      valorSimulado: valor,
      prazoMeses: prazoAjustado,
      taxaPadraoAa: linha.taxaPadraoMercadoAa,
      taxaBonificadaAa: linha.taxaBonificadaVerdeAa,
      diferencaSpreadPontos: diferencaSpread,
      parcelaMensalPadrao: Number(parcelaPadrao.toFixed(2)),
      parcelaMensalBonificada: Number(parcelaBonificada.toFixed(2)),
      economiaMensal: Number(economiaMensal.toFixed(2)),
      economiaAnual: Number(economiaAnual.toFixed(2)),
      economiaTotalPrazo: Number(economiaTotal.toFixed(2)),
      economiaPercentualSobreJuros,
      nivelAderenciaOrbis: nivelAderencia,
    }
  })

  // Ordena: compatíveis primeiro, depois pela maior economia total
  linhasAvaliadas.sort((a, b) => {
    if (a.compativel && !b.compativel) return -1
    if (!a.compativel && b.compativel) return 1
    return b.economiaTotalPrazo - a.economiaTotalPrazo
  })

  const compativeis = linhasAvaliadas.filter((l) => l.compativel)
  const melhorLinha = compativeis.length > 0 ? compativeis[0] : linhasAvaliadas[0] || null

  const economiaTotalMaxima = melhorLinha ? melhorLinha.economiaTotalPrazo : 0
  const economiaAnualMaxima = melhorLinha ? melhorLinha.economiaAnual : 0

  return {
    valorDesejado: valor,
    prazoMeses: prazo,
    finalidade: input.finalidade,
    linhasAvaliadas,
    melhorLinha,
    economiaTotalMaxima,
    economiaAnualMaxima,
    totalLinhasCompativeis: compativeis.length,
    disclaimer:
      'Simulação indicativa baseada nas condições médias de mercado e normativos vigentes das instituições financeiras. Documentos e laudos verificáveis prontos para envio aos agentes financeiros. Não constitui promessa ou garantia de aprovação de crédito, estando a concessão e a taxa final sujeitas à análise cadastral, garantias, score de crédito e governança ambiental da empresa pelo agente financeiro.',
  }
}

export function formatarFinalidade(f: FinalidadeCreditoVerde): string {
  switch (f) {
    case 'eficiencia_energetica':
      return 'Eficiência Energética & Retrofitting'
    case 'frota_eletrica_gas':
      return 'Frota Elétrica, Híbrida ou a Biometano'
    case 'economia_circular':
      return 'Economia Circular & Reúso de Materiais'
    case 'energia_solar':
      return 'Geração de Energia Solar Fotovoltaica'
    case 'agro_verde':
      return 'Agro Sustentável & Práticas de Baixa Emissão'
    default:
      return f
  }
}
