/**
 * SIMULADOR REFERENCIAL DE POTENCIAL DE CRÉDITO (INFORMATIVO) — ORBIS PROTOCOL
 *
 * Módulo interno exclusivo do Console Administrativo (/admin, aba "12. dMRV Emissões Evitadas (SBCE)").
 *
 * CONTEXTO E REGRAS INEGOCIÁVEIS DE BLINDAGEM DO PRODUTO:
 * 1. RÓTULO ONIPRESENTE: "Simulação Referencial — sem validade, não emissível, não negociável".
 *    A plataforma é infraestrutura de prova documental; NÃO emite créditos de carbono.
 *    Este simulador é ferramenta interna de conversa comercial com cliente: ordem de grandeza referencial.
 * 2. CÁLCULO TRANSPARENTE: tCO₂e evitado elegível × faixa US$ 5–25/tCO₂e (SEMPRE como faixa mín–máx,
 *    nunca valor pontual único). Conversão aproximada para R$ com câmbio premissa declarado (PTAX / US$ 1,00 = R$ 5,75).
 * 3. SEPARADO DO RELATÓRIO ESTRATIFICADO: O relatório estratificado probatório (commit 0.0.170)
 *    permanece 100% documental e pericial, sem valor financeiro. Este simulador vive em seção própria.
 * 4. SÓ MATERIAIS COM FATOR OFICIAL: Apenas linhas com fator oficial no catálogo DM-ORB-001 entram no
 *    cálculo do potencial. Frações em estruturação de catálogo (ouro, prata, paládio, terras raras e
 *    materiais com fator 0 / sem fator / status 'em_estruturacao_de_catalogo') ficam EXCLUÍDAS
 *    com linha explicitando o motivo — NUNCA somem silenciosamente.
 * 5. APENAS NO CONSOLE: Nenhuma tela pública pode referenciar ou renderizar este simulador.
 */

import { PROTOCOLOS_SETORIAIS, getProtocoloBySlug } from '@/data/protocolosSetoriais'
import type { FiltroOrigemDmrv } from './dmrvEmissoesService'

export const TEXTO_ROTULO_ONIPRESENTE =
  'Simulação Referencial — sem validade, não emissível, não negociável'

export const PREMISSA_FAIXA_PRECO = {
  minUsd: 5.0,
  maxUsd: 25.0,
  moedaPadrao: 'USD',
  fontePremissa:
    'Ecosystem Marketplace / State of the Voluntary Carbon Markets 2024 & Diretrizes SBCE para créditos de descarbonização de resíduos industriais e logística reversa (faixa referencial conservadora US$ 5,00 a US$ 25,00/tCO₂e)',
  cambioBrlPremissa: 5.75, // Cotação de referência indicativa PTAX declarada
  fonteCambio: 'Cotação Referencial Indicativa Banco Central do Brasil (PTAX R$ 5,75/US$ 1,00)',
}

export interface LinhaSimuladorProtocolo {
  protocoloSlug: string
  protocoloNome: string
  tco2eElegivel: number
  co2eKgElegivel: number
  massaElegivelKg: number
  totalPecasElegiveis: number
  totalLotes: number
  valorMinimoUsd: number
  valorMaximoUsd: number
  valorMinimoBrl: number
  valorMaximoBrl: number
  unidadeCanonica: string
  quantidadeCanonicaFormatada: string
  premisaBadge?: string
}

export interface LinhaExclusaoSimulador {
  chave: string
  materialOuDescricao: string
  categoria: string
  protocoloSlug: string
  massaKg: number
  totalItens: number
  motivoExclusao: string
  statusCatalogo: 'em_estruturacao_de_catalogo' | 'sem_fator_homologado' | 'fora_de_escopo'
}

export interface SimuladorReferencialResultado {
  geradoEmIso: string
  cnpjTitular: string
  origemFiltro: FiltroOrigemDmrv
  rotuloObrigatorio: string

  // Totais elegíveis (apenas materiais com fator homologado)
  totalCo2eElegivelKg: number
  totalTco2eElegivel: number
  totalMassaElegivelKg: number
  totalPecasElegiveis: number

  // Faixa de valor consolidada
  faixaUsd: {
    min: number
    max: number
    formatado: string
  }
  faixaBrl: {
    min: number
    max: number
    formatado: string
  }

  // Decomposição por protocolo setorial
  decomposicaoPorProtocolo: LinhaSimuladorProtocolo[]

  // Materiais e frações excluídas da simulação
  exclusoes: LinhaExclusaoSimulador[]
  totalMassaExcluidaKg: number
  totalItensExcluidos: number

  // Premissas metodológicas declaradas
  premissas: {
    precoFaixaMinUsd: number
    precoFaixaMaxUsd: number
    fontePreco: string
    cambioBrl: number
    fonteCambio: string
    avisoLegal: string
  }

  // Reconciliação pericial com o dMRV
  reconciliacao: {
    co2eTotalOrigemKg: number
    co2eElegivelSimuladorKg: number
    co2eExcluidoKg: number
    somaBatePerfeitamente: boolean
  }
}

/**
 * Normaliza textos para verificar se o item pertence à lista de materiais em estruturação
 * ou sem fator homologado oficial no DM-ORB-001.
 */
export function isMaterialExcluidoDaSimulacao(params: {
  descricao?: string
  categoria?: string
  fatorCo2e?: number
  co2eEvitadoKg?: number
  statusCalculo?: string
  possuiFatorOficial?: boolean
}): {
  excluido: boolean
  motivo: string
  status: 'em_estruturacao_de_catalogo' | 'sem_fator_homologado' | 'fora_de_escopo'
} {
  const {
    descricao = '',
    categoria = '',
    fatorCo2e = 0,
    co2eEvitadoKg = 0,
    statusCalculo,
    possuiFatorOficial,
  } = params
  const desc = descricao.toLowerCase()
  const cat = categoria.toLowerCase()

  if (statusCalculo === 'em_estruturacao_de_catalogo') {
    return {
      excluido: true,
      motivo:
        'Fração em estruturação de catálogo (DM-ORB-001 Apêndice B) — sem crédito/fator atribuído',
      status: 'em_estruturacao_de_catalogo',
    }
  }

  if (
    desc.includes('ouro') ||
    desc.includes('paladio') ||
    desc.includes('paládio') ||
    desc.includes('prata') ||
    desc.includes('terras raras') ||
    desc.includes('terras_raras') ||
    desc.includes('ndfeb') ||
    desc.includes('sem crédito') ||
    desc.includes('em estruturação') ||
    cat === 'materiais_criticos_rastreados'
  ) {
    return {
      excluido: true,
      motivo: 'Fração crítica em estruturação de catálogo (mineração urbana sem fator homologado)',
      status: 'em_estruturacao_de_catalogo',
    }
  }

  if (desc.includes('bateria') || cat.includes('bateria')) {
    return {
      excluido: true,
      motivo: 'Baterias Li-ion (fora de escopo v2.1 — ABNT NBR 10004 / PNRS art. 33)',
      status: 'fora_de_escopo',
    }
  }

  if (possuiFatorOficial === false || (fatorCo2e <= 0 && co2eEvitadoKg <= 0)) {
    return {
      excluido: true,
      motivo: 'Material sem fator de emissão homologado no catálogo DM-ORB-001 v1.1',
      status: 'sem_fator_homologado',
    }
  }

  return { excluido: false, motivo: '', status: 'sem_fator_homologado' }
}

/**
 * Calcula o Simulador Referencial de Potencial de Crédito a partir dos dados do painel dMRV.
 *
 * Garante:
 * - Apenas materiais com fator homologado entram no cálculo.
 * - Materiais excluídos aparecem explicitamente na lista de exclusões com motivo claro.
 * - Faixa US$ 5–25/tCO₂e exibida sempre em mín–máx e equivalente em R$.
 * - Reconciliação auditável com o total elegível.
 */
export function calcularSimuladorReferencial(params: {
  lotes: any[]
  pecas: any[]
  cnpj: string
  origem: FiltroOrigemDmrv
  protocoloDominanteSlug?: string
}): SimuladorReferencialResultado {
  const { lotes, pecas, cnpj, origem, protocoloDominanteSlug = 'automotiva' } = params

  const mapaLotes = new Map<string, any>()
  for (const l of lotes) {
    if (l.id) mapaLotes.set(l.id, l)
  }

  const mapaProtocolos = new Map<
    string,
    {
      slug: string
      nome: string
      co2eElegivelKg: number
      massaElegivelKg: number
      pecasCount: number
      lotesSet: Set<string>
      premisaBadge?: string
    }
  >()

  const listaExclusoes: LinhaExclusaoSimulador[] = []
  const mapaExclusoesAgregadas = new Map<string, LinhaExclusaoSimulador>()

  let totalCo2eBrutoGeralKg = 0
  let totalCo2eElegivelKg = 0
  let totalMassaElegivelKg = 0
  let totalPecasElegiveis = 0

  const obterSlugItem = (p: any, loteRef: any): string => {
    if (p?.protocolo) return p.protocolo
    if (loteRef?.protocolo) return loteRef.protocolo
    if (loteRef?.protocolo_setorial) return loteRef.protocolo_setorial
    if (loteRef?.segmento) return loteRef.segmento
    if (loteRef?.setor) return loteRef.setor
    if (loteRef?.cdv_codigo && typeof loteRef.cdv_codigo === 'string') {
      const m = loteRef.cdv_codigo.match(/^[A-Z0-9]+-([A-Z0-9_]+)(?:-\d+)?$/i)
      if (m && m[1]) return m[1].toLowerCase()
    }
    return protocoloDominanteSlug || 'automotiva'
  }

  // Se houver peças individuais
  if (pecas.length > 0) {
    for (const p of pecas) {
      const loteRef = p.lote ? mapaLotes.get(p.lote) : null
      const slugRaw = obterSlugItem(p, loteRef)
      const slug = slugRaw.toLowerCase()
      const protoInfo = getProtocoloBySlug(slug) || PROTOCOLOS_SETORIAIS[slug]
      const nomeProto = protoInfo?.nome || slug

      const co2ePeca = Number(p.co2e_evitado_kg || 0)
      const pesoPeca = Number(p.peso_kg || 0)
      const fatorPeca = Number(p.fator_co2e_kg ?? 0)
      totalCo2eBrutoGeralKg += co2ePeca

      const testeExclusao = isMaterialExcluidoDaSimulacao({
        descricao: p.descricao_peca || p.material_declarado || '',
        categoria: p.categoria_material || p.categoria || '',
        fatorCo2e: fatorPeca,
        co2eEvitadoKg: co2ePeca,
        statusCalculo: p.statusCalculo,
        possuiFatorOficial: fatorPeca > 0 && co2ePeca > 0,
      })

      if (testeExclusao.excluido) {
        const chaveAgrupada = `${slug}_${testeExclusao.status}_${p.descricao_peca || p.material_declarado || 'item'}`
        const exist = mapaExclusoesAgregadas.get(chaveAgrupada)
        if (exist) {
          exist.massaKg = Math.round((exist.massaKg + pesoPeca) * 10) / 10
          exist.totalItens += 1
        } else {
          mapaExclusoesAgregadas.set(chaveAgrupada, {
            chave: chaveAgrupada,
            materialOuDescricao:
              p.descricao_peca || p.material_declarado || 'Item sem fator oficial',
            categoria: p.categoria_material || 'outros',
            protocoloSlug: slug,
            massaKg: Math.round(pesoPeca * 10) / 10,
            totalItens: 1,
            motivoExclusao: testeExclusao.motivo,
            statusCatalogo: testeExclusao.status,
          })
        }
        continue
      }

      // Material elegível com fator homologado
      totalCo2eElegivelKg += co2ePeca
      totalMassaElegivelKg += pesoPeca
      totalPecasElegiveis += 1

      const reg = mapaProtocolos.get(slug) || {
        slug,
        nome: nomeProto,
        co2eElegivelKg: 0,
        massaElegivelKg: 0,
        pecasCount: 0,
        lotesSet: new Set<string>(),
      }

      reg.co2eElegivelKg += co2ePeca
      reg.massaElegivelKg += pesoPeca
      reg.pecasCount += 1
      if (p.lote) reg.lotesSet.add(p.lote)
      mapaProtocolos.set(slug, reg)
    }
  } else {
    // Caso de lotes agregados sem peças filhas (ex: cargas consolidadas de transporte/materiais)
    for (const l of lotes) {
      const slugRaw = l.protocolo || l.protocolo_setorial || l.segmento || protocoloDominanteSlug
      const slug = String(slugRaw).toLowerCase()
      const protoInfo = getProtocoloBySlug(slug) || PROTOCOLOS_SETORIAIS[slug]
      const nomeProto = protoInfo?.nome || slug

      const co2eLote = Number(l.total_co2e_evitado_kg || 0)
      const pesoLote = Number(l.total_peso_kg || 0)
      const pecasLote = Number(l.total_pecas || 0)
      totalCo2eBrutoGeralKg += co2eLote

      if (co2eLote <= 0) {
        const chaveAgrupada = `lote_sem_fator_${l.id || Math.random()}`
        mapaExclusoesAgregadas.set(chaveAgrupada, {
          chave: chaveAgrupada,
          materialOuDescricao: l.cdv_codigo || `Lote ${l.id?.slice(0, 8)}`,
          categoria: 'lotes_sem_co2e',
          protocoloSlug: slug,
          massaKg: Math.round(pesoLote * 10) / 10,
          totalItens: pecasLote || 1,
          motivoExclusao: 'Lote sem CO₂e atribuído por fator homologado (excluído da simulação)',
          statusCatalogo: 'sem_fator_homologado',
        })
        continue
      }

      totalCo2eElegivelKg += co2eLote
      totalMassaElegivelKg += pesoLote
      totalPecasElegiveis += pecasLote

      const reg = mapaProtocolos.get(slug) || {
        slug,
        nome: nomeProto,
        co2eElegivelKg: 0,
        massaElegivelKg: 0,
        pecasCount: 0,
        lotesSet: new Set<string>(),
      }
      reg.co2eElegivelKg += co2eLote
      reg.massaElegivelKg += pesoLote
      reg.pecasCount += pecasLote
      if (l.id) reg.lotesSet.add(l.id)
      mapaProtocolos.set(slug, reg)
    }
  }

  // Converter mapa de exclusões em array ordenado por massa decrescente
  for (const item of mapaExclusoesAgregadas.values()) {
    listaExclusoes.push(item)
  }
  listaExclusoes.sort((a, b) => b.massaKg - a.massaKg)

  // Totais elegíveis arredondados
  const totalCo2eElegivelArr = Math.round(totalCo2eElegivelKg * 10) / 10
  const totalTco2eElegivel = Math.round((totalCo2eElegivelArr / 1000) * 1000) / 1000

  // Cálculo da faixa em USD e BRL
  const minUsd = Math.round(totalTco2eElegivel * PREMISSA_FAIXA_PRECO.minUsd * 100) / 100
  const maxUsd = Math.round(totalTco2eElegivel * PREMISSA_FAIXA_PRECO.maxUsd * 100) / 100

  const minBrl = Math.round(minUsd * PREMISSA_FAIXA_PRECO.cambioBrlPremissa * 100) / 100
  const maxBrl = Math.round(maxUsd * PREMISSA_FAIXA_PRECO.cambioBrlPremissa * 100) / 100

  // Decomposição por protocolo setorial com unidades canônicas
  const decomposicaoPorProtocolo: LinhaSimuladorProtocolo[] = Array.from(
    mapaProtocolos.values(),
  ).map((p) => {
    const tco2e = Math.round((p.co2eElegivelKg / 1000) * 1000) / 1000
    const protoInfo = getProtocoloBySlug(p.slug) || PROTOCOLOS_SETORIAIS[p.slug]

    const minLinhaUsd = Math.round(tco2e * PREMISSA_FAIXA_PRECO.minUsd * 100) / 100
    const maxLinhaUsd = Math.round(tco2e * PREMISSA_FAIXA_PRECO.maxUsd * 100) / 100
    const minLinhaBrl = Math.round(minLinhaUsd * PREMISSA_FAIXA_PRECO.cambioBrlPremissa * 100) / 100
    const maxLinhaBrl = Math.round(maxLinhaUsd * PREMISSA_FAIXA_PRECO.cambioBrlPremissa * 100) / 100

    // Unidades canônicas do protocolo (ex: kg de aço, t.km para logística, m³ biogás)
    let unidadeCanonica = 'kg'
    let qtdFormatada = p.massaElegivelKg.toLocaleString('pt-BR', { maximumFractionDigits: 1 })
    let premisaBadge: string | undefined

    if (p.slug === 'logistica') {
      const tkm = Math.round((p.massaElegivelKg / 1000) * 400 * 10) / 10
      unidadeCanonica = 't.km'
      qtdFormatada = tkm.toLocaleString('pt-BR', { maximumFractionDigits: 1 })
      premisaBadge = 'GLEC v3.0 (400 km eq.)'
    } else if (p.slug === 'energia') {
      unidadeCanonica = 'm³ biogás'
      qtdFormatada = (Math.round(p.massaElegivelKg * 0.45 * 10) / 10).toLocaleString('pt-BR')
      premisaBadge = 'Balanço estequiométrico'
    }

    return {
      protocoloSlug: p.slug,
      protocoloNome: protoInfo?.nome || p.nome,
      tco2eElegivel: tco2e,
      co2eKgElegivel: Math.round(p.co2eElegivelKg * 10) / 10,
      massaElegivelKg: Math.round(p.massaElegivelKg * 10) / 10,
      totalPecasElegiveis: p.pecasCount,
      totalLotes: p.lotesSet.size,
      valorMinimoUsd: minLinhaUsd,
      valorMaximoUsd: maxLinhaUsd,
      valorMinimoBrl: minLinhaBrl,
      valorMaximoBrl: maxLinhaBrl,
      unidadeCanonica,
      quantidadeCanonicaFormatada: qtdFormatada,
      premisaBadge,
    }
  })

  const totalMassaExcluidaKg = listaExclusoes.reduce((acc, x) => acc + x.massaKg, 0)
  const totalItensExcluidos = listaExclusoes.reduce((acc, x) => acc + x.totalItens, 0)

  // Reconciliação pericial: soma das linhas do simulador deve bater com o total elegível
  const somaCo2eLinhas = decomposicaoPorProtocolo.reduce((acc, l) => acc + l.co2eKgElegivel, 0)
  const somaBate = Math.abs(somaCo2eLinhas - totalCo2eElegivelArr) < 0.1

  const formatarFaixaMoeda = (min: number, max: number, moeda: 'USD' | 'BRL'): string => {
    if (moeda === 'USD') {
      const fMin = min.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
      const fMax = max.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
      return `US$ ${fMin} – US$ ${fMax}`
    }
    const fMin = min.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    const fMax = max.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    return `R$ ${fMin} – R$ ${fMax}`
  }

  return {
    geradoEmIso: new Date().toISOString(),
    cnpjTitular: cnpj,
    origemFiltro: origem,
    rotuloObrigatorio: TEXTO_ROTULO_ONIPRESENTE,
    totalCo2eElegivelKg: totalCo2eElegivelArr,
    totalTco2eElegivel,
    totalMassaElegivelKg: Math.round(totalMassaElegivelKg * 10) / 10,
    totalPecasElegiveis,
    faixaUsd: {
      min: minUsd,
      max: maxUsd,
      formatado: formatarFaixaMoeda(minUsd, maxUsd, 'USD'),
    },
    faixaBrl: {
      min: minBrl,
      max: maxBrl,
      formatado: formatarFaixaMoeda(minBrl, maxBrl, 'BRL'),
    },
    decomposicaoPorProtocolo,
    exclusoes: listaExclusoes,
    totalMassaExcluidaKg: Math.round(totalMassaExcluidaKg * 10) / 10,
    totalItensExcluidos,
    premissas: {
      precoFaixaMinUsd: PREMISSA_FAIXA_PRECO.minUsd,
      precoFaixaMaxUsd: PREMISSA_FAIXA_PRECO.maxUsd,
      fontePreco: PREMISSA_FAIXA_PRECO.fontePremissa,
      cambioBrl: PREMISSA_FAIXA_PRECO.cambioBrlPremissa,
      fonteCambio: PREMISSA_FAIXA_PRECO.fonteCambio,
      avisoLegal:
        'A Orbis Protocol atua estritamente como infraestrutura de prova documental criptográfica e rastreabilidade (dMRV). Esta ferramenta não emite, não custodia e não transaciona ativos de carbono ou certificados financeiros. Valores apresentados são estimativas referenciais de ordem de grandeza sem qualquer validade comercial ou jurídica.',
    },
    reconciliacao: {
      co2eTotalOrigemKg: Math.round(totalCo2eBrutoGeralKg * 10) / 10,
      co2eElegivelSimuladorKg: totalCo2eElegivelArr,
      co2eExcluidoKg: Math.round((totalCo2eBrutoGeralKg - totalCo2eElegivelArr) * 10) / 10,
      somaBatePerfeitamente: somaBate,
    },
  }
}

/**
 * Exporta o resultado da simulação referencial em CSV com o cabeçalho de isenção obrigatório.
 */
export function exportarSimuladorReferencialCsv(simulacao: SimuladorReferencialResultado): {
  url: string
  nomeArquivo: string
  hash: string
} {
  const agora = new Date()
  const dataIso = agora.toISOString().slice(0, 10)
  const linhas: string[] = []

  linhas.push('SIMULADOR REFERENCIAL DE POTENCIAL DE CREDITO (INFORMATIVO)')
  linhas.push(`ROTULO OBRIGATORIO;${simulacao.rotuloObrigatorio}`)
  linhas.push(`Data de Geracao;${agora.toLocaleString('pt-BR')}`)
  linhas.push(`CNPJ Titular;${simulacao.cnpjTitular}`)
  linhas.push(
    `Ambiente / Origem;${simulacao.origemFiltro === 'sintetico' ? 'SANDBOX (DEMONSTRACAO)' : 'PRODUCAO (DADOS REAIS)'}`,
  )
  linhas.push(
    'Aviso Institucional;Plataforma de prova documental — NAO EMISSORA de creditos de carbono',
  )
  linhas.push('')
  linhas.push('PREMISSAS METODOLOGICAS VISIVEIS')
  linhas.push(
    `Faixa de Preco de Referencia;US$ ${simulacao.premissas.precoFaixaMinUsd.toFixed(2)} a US$ ${simulacao.premissas.precoFaixaMaxUsd.toFixed(2)} por tCO2e (SEMPRE COMO FAIXA)`,
  )
  linhas.push(`Fonte da Faixa de Preco;${simulacao.premissas.fontePreco}`)
  linhas.push(
    `Cambio Declarado;R$ ${simulacao.premissas.cambioBrl.toFixed(2)} por US$ 1,00 (${simulacao.premissas.fonteCambio})`,
  )
  linhas.push('')
  linhas.push('TOTAIS ELEGIVEIS (SOMENTE MATERIAIS COM FATOR HOMOLOGADO DM-ORB-001)')
  linhas.push(`Total de CO2e Elegivel (kg);${simulacao.totalCo2eElegivelKg.toFixed(2)}`)
  linhas.push(`Total de tCO2e Elegivel;${simulacao.totalTco2eElegivel.toFixed(4)}`)
  linhas.push(`Massa Total Elegivel (kg);${simulacao.totalMassaElegivelKg.toFixed(2)}`)
  linhas.push(`Itens/Pecas Elegiveis;${simulacao.totalPecasElegiveis}`)
  linhas.push(
    `Potencial Financeiro em Dolar (Faixa);${simulacao.faixaUsd.formatado};${simulacao.rotuloObrigatorio}`,
  )
  linhas.push(
    `Potencial Financeiro em Reais (Faixa);${simulacao.faixaBrl.formatado};${simulacao.rotuloObrigatorio}`,
  )
  linhas.push('')

  linhas.push('DECOMPOSICAO POR PROTOCOLO SETORIAL')
  linhas.push(
    'Protocolo;tCO2e Elegivel;CO2e Elegivel (kg);Massa/Unidade Canonica;Pecas;Faixa USD (Min - Max);Faixa BRL (Min - Max);Rotulo de Isencao;Premissa Setorial',
  )
  for (const p of simulacao.decomposicaoPorProtocolo) {
    const faixaUsd = `US$ ${p.valorMinimoUsd.toFixed(2)} - US$ ${p.valorMaximoUsd.toFixed(2)}`
    const faixaBrl = `R$ ${p.valorMinimoBrl.toFixed(2)} - R$ ${p.valorMaximoBrl.toFixed(2)}`
    const premissa = p.premisaBadge || 'DM-ORB-001 v1.1'
    linhas.push(
      `${p.protocoloNome};${p.tco2eElegivel.toFixed(4)};${p.co2eKgElegivel.toFixed(2)};${p.quantidadeCanonicaFormatada} ${p.unidadeCanonica};${p.totalPecasElegiveis};${faixaUsd};${faixaBrl};${simulacao.rotuloObrigatorio};${premissa}`,
    )
  }
  linhas.push('')

  linhas.push('FRACOES E MATERIAIS EXCLUIDOS DA SIMULACAO (RASTREADOS, SEM CO2E ATRIBUIDO)')
  linhas.push(
    'Material / Descricao;Categoria;Protocolo;Massa (kg);Itens;Status de Catalogo;Motivo da Exclusao',
  )
  if (simulacao.exclusoes.length === 0) {
    linhas.push(
      'Nenhuma fracao excluida — todos os itens do lote possuem fator oficial homologado;;;;;;',
    )
  } else {
    for (const ex of simulacao.exclusoes) {
      linhas.push(
        `${ex.materialOuDescricao};${ex.categoria};${ex.protocoloSlug};${ex.massaKg.toFixed(2)};${ex.totalItens};${ex.statusCatalogo};${ex.motivoExclusao}`,
      )
    }
  }
  linhas.push('')
  linhas.push('RECONCILIACAO AUDITAVEL DO SIMULADOR')
  linhas.push(`CO2e Bruto de Origem (kg);${simulacao.reconciliacao.co2eTotalOrigemKg.toFixed(2)}`)
  linhas.push(
    `CO2e Elegivel Incorporado na Simulacao (kg);${simulacao.reconciliacao.co2eElegivelSimuladorKg.toFixed(2)}`,
  )
  linhas.push(`CO2e de Fracoes Excluidas (kg);${simulacao.reconciliacao.co2eExcluidoKg.toFixed(2)}`)
  linhas.push(
    `Status de Reconciliacao;${simulacao.reconciliacao.somaBatePerfeitamente ? '100% CONFORME (Soma bate perfeitamente)' : 'DIVERGENCIA DETECTADA'}`,
  )

  const csvContent = linhas.join('\r\n')
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const nomeArquivo = `Simulador_Referencial_Potencial_${simulacao.cnpjTitular.replace(/\D/g, '')}_${dataIso}_${simulacao.origemFiltro.toUpperCase()}.csv`

  return {
    url,
    nomeArquivo,
    hash: `SIM-${dataIso}-${simulacao.cnpjTitular.slice(0, 8)}`,
  }
}
