/**
 * MOTOR PERICIAL DE CÁLCULO DE EMISSÕES DE GEE (ESCOPOS 1, 2 E 3)
 *
 * Em total conformidade com:
 * - Diretrizes GHG Protocol Programa Brasileiro
 * - Fatores Oficiais do MCTI / SIN
 * - Métricas GWP do Sexto Relatório do IPCC (AR6)
 * - Critérios de enquadramento da Lei Federal 15.042/2024 (SBCE):
 *     * < 10.000 tCO2e/ano: Isento de reporte compulsório
 *     * >= 10.000 tCO2e e < 25.000 tCO2e/ano: Plano de Monitoramento e Reporte Obrigatório
 *     * >= 25.000 tCO2e/ano: Dever de Reporte e Metas Obrigatórias de Compensação / Alocação
 * - Insetting ISO 14067 para Cadeia Automotiva / CDV (Centrais de Desmontagem Veicular)
 * - Duplo reporte de Escopo 2: Localização (fator SIN) vs Mercado (com I-REC)
 * - Tiers de incerteza (±% ponderado) e segregação estrita de emissões fósseis e biogênicas.
 */

import { classificarItemCompradoNCM } from './classificacaoFisicaNCM'
import { DocumentoFiscalProcessado } from './modelosFiscaisParser'
import { FATORES_EMISSAO_CURADOS, GWP_AR6, FatorEmissaoCurado } from './fatoresEmissaoOficiais'

export interface ItemEmissaoApurada {
  id: string
  origemDocChave: string
  modeloFiscal: string
  descricaoItem: string
  categoria: 'Escopo 1' | 'Escopo 2' | 'Escopo 3' | 'Insetting'
  subcategoria: string
  quantidade: number
  unidade: string
  fatorUtilizado: FatorEmissaoCurado
  // Emissões de gases individuais (kg)
  kgCO2: number
  kgCH4: number
  kgN2O: number
  // tCO2e calculado com GWP AR6
  fossilTCO2e: number
  biogenicoTCO2e: number
  tierIncerteza: 'Tier 1' | 'Tier 2' | 'Tier 3'
  incertezaPct: number
  fonteFator: string
}

export interface InventarioEmissoesResultado {
  empresaNome: string
  cnpj: string
  anoBase: number
  periodoReferencia: string
  totalDocumentosAnalisados: number

  // Totais por Escopo (tCO2e fóssil)
  escopo1TotalTCO2e: number
  escopo2LocalizacaoTCO2e: number
  escopo2MercadoTCO2e: number
  escopo3TotalTCO2e: number

  // Emissões Biogênicas (reportadas separadamente conforme GHG Protocol)
  emissoesBiogenicasTotalTCO2e: number

  // Insetting Circular ISO 14067 (redução líquida via reaproveitamento)
  insettingTotalTCO2e: number

  // Total Geral Consolidado (Escopo 1 + Escopo 2 Localização + Escopo 3)
  emissoesTotaisFosseisTCO2e: number
  // Total Líquido após Insetting
  emissoesLiquidasTCO2e: number

  // Incerteza consolidada ponderada (±%)
  incertezaConsolidadaPct: number

  // Enquadramento Regulatório SBCE (Lei 15.042/2024)
  enquadramentoSBCE: {
    status: 'isento_monitoramento' | 'dever_reporte_10k' | 'dever_compensacao_25k'
    titulo: string
    explicacao: string
    limiar10kPct: number // % atingido do limiar de 10k
    limiar25kPct: number // % atingido do limiar de 25k
  }

  // Desdobramento detalhado para emissão do laudo pericial
  itensDetalhados: ItemEmissaoApurada[]
  declarouEnergiaRenovavelMercado: boolean
  versaoMetodologia: string
}

export interface OpcoesCalculoInventario {
  empresaNome?: string
  cnpj?: string
  anoBase?: number
  possuiIREC?: boolean // Se possui energia renovável contratada para Escopo 2 Mercado
  fatorCustomizadoSIN?: number
  insettingCdvCo2eKg?: number // Adicional: CO2e evitado acumulado dos lotes de CDV vinculado
  itensBensCompradosNCM?: Array<{
    descricao: string
    ncm?: string
    unidadeDeclarada?: string
    quantidadeFisica?: number
    valorBrl: number
  }>
}

/**
 * Executa a apuração pericial completa do inventário de emissões a partir da ingestão de documentos fiscais
 */
export function calcularInventarioEmissoes(
  documentos: DocumentoFiscalProcessado[],
  opcoes?: OpcoesCalculoInventario,
): InventarioEmissoesResultado {
  const itensApurados: ItemEmissaoApurada[] = []
  const possuiIREC = Boolean(opcoes?.possuiIREC)

  let escopo1Fossil = 0
  let escopo1Biogenico = 0
  let escopo2Localizacao = 0
  let escopo2Mercado = 0
  let escopo3Fossil = 0
  let escopo3Biogenico = 0
  let insettingTotal = 0

  let somaIncertezaPonderada = 0
  let pesoTotalEmissoes = 0

  for (const doc of documentos) {
    // 1. ESCOPO 1: Queima de Combustíveis em Frotas Próprias ou Queimadores (NF-e, NFC-e)
    if (doc.combustivelLitros && doc.combustivelLitros > 0 && doc.combustivelTipo) {
      const litros = doc.combustivelLitros
      let fatorKey = 'diesel_s10'
      if (doc.combustivelTipo === 'gasolina') fatorKey = 'gasolina_c'
      else if (doc.combustivelTipo === 'etanol') fatorKey = 'etanol_hidratado'
      else if (doc.combustivelTipo === 'glp') fatorKey = 'glp'
      else if (doc.combustivelTipo === 'gnv') fatorKey = 'gnv'

      const fator = FATORES_EMISSAO_CURADOS[fatorKey] || FATORES_EMISSAO_CURADOS.diesel_s10

      // Cálculos estritos por gás com GWP AR6
      const kgCO2 = litros * fator.kgCO2
      const kgCH4 = litros * fator.kgCH4
      const kgN2O = litros * fator.kgN2O
      const tCO2eFossil =
        (kgCO2 * GWP_AR6.CO2 + kgCH4 * GWP_AR6.CH4_fossil + kgN2O * GWP_AR6.N2O) / 1000
      const tCO2eBio = (litros * fator.kgCO2Biogenico) / 1000

      escopo1Fossil += tCO2eFossil
      escopo1Biogenico += tCO2eBio

      somaIncertezaPonderada += tCO2eFossil * fator.incertezaPadraoPct
      pesoTotalEmissoes += tCO2eFossil

      itensApurados.push({
        id: `e1_${doc.chaveAcesso.slice(-8)}_${fatorKey}`,
        origemDocChave: doc.chaveAcesso,
        modeloFiscal: doc.modeloFiscal,
        descricaoItem: `Combustão Estacionária/Móvel: ${fator.descricao}`,
        categoria: 'Escopo 1',
        subcategoria: 'Combustíveis Fósseis & Biocombustíveis',
        quantidade: litros,
        unidade: fator.unidade,
        fatorUtilizado: fator,
        kgCO2,
        kgCH4,
        kgN2O,
        fossilTCO2e: tCO2eFossil,
        biogenicoTCO2e: tCO2eBio,
        tierIncerteza: fator.tierIncertezaPadrao,
        incertezaPct: fator.incertezaPadraoPct,
        fonteFator: `${fator.fonte} (${fator.versaoTabela})`,
      })
    }

    // 2. ESCOPO 2: Eletricidade Consumida da Rede (NF3e / Faturas de Energia)
    if (doc.energiaKwh && doc.energiaKwh > 0) {
      const kwh = doc.energiaKwh
      const fatorLoc = FATORES_EMISSAO_CURADOS.eletricidade_sin_localizacao
      const fatorMerc = possuiIREC
        ? FATORES_EMISSAO_CURADOS.eletricidade_irec_mercado
        : FATORES_EMISSAO_CURADOS.eletricidade_sin_localizacao

      const tCO2eLocalizacao = kwh * fatorLoc.fatorFossilTCO2e
      const tCO2eMercado = kwh * fatorMerc.fatorFossilTCO2e
      const tCO2eBio = (kwh * fatorLoc.kgCO2Biogenico) / 1000

      escopo2Localizacao += tCO2eLocalizacao
      escopo2Mercado += tCO2eMercado

      somaIncertezaPonderada += tCO2eLocalizacao * fatorLoc.incertezaPadraoPct
      pesoTotalEmissoes += tCO2eLocalizacao

      itensApurados.push({
        id: `e2_${doc.chaveAcesso.slice(-8)}_eletricidade`,
        origemDocChave: doc.chaveAcesso,
        modeloFiscal: doc.modeloFiscal,
        descricaoItem: `Eletricidade Rede SIN (${kwh.toLocaleString('pt-BR')} kWh)`,
        categoria: 'Escopo 2',
        subcategoria: possuiIREC ? 'Mercado Livre I-REC Zero Carbon' : 'Abordagem Localização SIN',
        quantidade: kwh,
        unidade: 'kWh',
        fatorUtilizado: fatorLoc,
        kgCO2: kwh * fatorLoc.kgCO2,
        kgCH4: kwh * fatorLoc.kgCH4,
        kgN2O: kwh * fatorLoc.kgN2O,
        fossilTCO2e: tCO2eLocalizacao,
        biogenicoTCO2e: tCO2eBio,
        tierIncerteza: fatorLoc.tierIncertezaPadrao,
        incertezaPct: fatorLoc.incertezaPadraoPct,
        fonteFator: `${fatorLoc.fonte} (${fatorLoc.versaoTabela})`,
      })
    }

    // 3. ESCOPO 3: Transporte Contratado / Terceirizado (CT-e Mod. 57, MDF-e Mod. 58)
    if (doc.transporteTkm && doc.transporteTkm > 0) {
      const tkm = doc.transporteTkm
      const fator = FATORES_EMISSAO_CURADOS.transporte_rodoviario_tkm
      const tCO2e = tkm * fator.fatorFossilTCO2e
      const tCO2eBio = (tkm * fator.kgCO2Biogenico) / 1000

      escopo3Fossil += tCO2e
      escopo3Biogenico += tCO2eBio

      somaIncertezaPonderada += tCO2e * fator.incertezaPadraoPct
      pesoTotalEmissoes += tCO2e

      itensApurados.push({
        id: `e3_${doc.chaveAcesso.slice(-8)}_transporte`,
        origemDocChave: doc.chaveAcesso,
        modeloFiscal: doc.modeloFiscal,
        descricaoItem: `Logística Rodoviária Terceirizada (${tkm.toLocaleString('pt-BR')} t.km)`,
        categoria: 'Escopo 3',
        subcategoria: 'Transporte & Distribuição Upstream/Downstream',
        quantidade: tkm,
        unidade: 'tkm',
        fatorUtilizado: fator,
        kgCO2: tkm * fator.kgCO2,
        kgCH4: tkm * fator.kgCH4,
        kgN2O: tkm * fator.kgN2O,
        fossilTCO2e: tCO2e,
        biogenicoTCO2e: tCO2eBio,
        tierIncerteza: fator.tierIncertezaPadrao,
        incertezaPct: fator.incertezaPadraoPct,
        fonteFator: `${fator.fonte} (${fator.versaoTabela})`,
      })
    }

    // 4. ESCOPO 3: Água e Saneamento
    if (doc.aguaM3 && doc.aguaM3 > 0) {
      const m3 = doc.aguaM3
      const fator = FATORES_EMISSAO_CURADOS.fatura_agua_m3
      const tCO2e = m3 * fator.fatorFossilTCO2e

      escopo3Fossil += tCO2e
      somaIncertezaPonderada += tCO2e * fator.incertezaPadraoPct
      pesoTotalEmissoes += tCO2e

      itensApurados.push({
        id: `e3_${doc.chaveAcesso.slice(-8)}_agua`,
        origemDocChave: doc.chaveAcesso,
        modeloFiscal: doc.modeloFiscal,
        descricaoItem: `Consumo de Água & Efluentes (${m3} m³)`,
        categoria: 'Escopo 3',
        subcategoria: 'Tratamento de Água e Resíduos',
        quantidade: m3,
        unidade: 'm³',
        fatorUtilizado: fator,
        kgCO2: m3 * fator.kgCO2,
        kgCH4: m3 * fator.kgCH4,
        kgN2O: m3 * fator.kgN2O,
        fossilTCO2e: tCO2e,
        biogenicoTCO2e: 0,
        tierIncerteza: fator.tierIncertezaPadrao,
        incertezaPct: fator.incertezaPadraoPct,
        fonteFator: `${fator.fonte} (${fator.versaoTabela})`,
      })
    }

    // 5. ESCOPO 3: Telecomunicações (NFCom)
    if (doc.telecomGb && doc.telecomGb > 0) {
      const gb = doc.telecomGb
      const fator = FATORES_EMISSAO_CURADOS.telecom_nfcom_gb
      const tCO2e = gb * fator.fatorFossilTCO2e

      escopo3Fossil += tCO2e
      somaIncertezaPonderada += tCO2e * fator.incertezaPadraoPct
      pesoTotalEmissoes += tCO2e

      itensApurados.push({
        id: `e3_${doc.chaveAcesso.slice(-8)}_telecom`,
        origemDocChave: doc.chaveAcesso,
        modeloFiscal: doc.modeloFiscal,
        descricaoItem: `Infraestrutura de Telecomunicações & Nuvem (${gb} GB)`,
        categoria: 'Escopo 3',
        subcategoria: 'Bens e Serviços Adquiridos',
        quantidade: gb,
        unidade: 'GB',
        fatorUtilizado: fator,
        kgCO2: gb * fator.kgCO2,
        kgCH4: 0,
        kgN2O: 0,
        fossilTCO2e: tCO2e,
        biogenicoTCO2e: 0,
        tierIncerteza: fator.tierIncertezaPadrao,
        incertezaPct: fator.incertezaPadraoPct,
        fonteFator: `${fator.fonte} (${fator.versaoTabela})`,
      })
    }

    // 5.1 ESCOPO 3: Bens e Serviços Comprados (Categoria 1) dos Itens da NF-e com NCM
    if (doc.itens && Array.isArray(doc.itens) && doc.itens.length > 0) {
      for (const item of doc.itens) {
        // Ignora itens de combustível/energia/telecom já apurados nos blocos anteriores
        const ncmRaw = item.ncm || ''
        if (ncmRaw.startsWith('2710') || ncmRaw.startsWith('2711') || ncmRaw.startsWith('2716')) {
          continue
        }
        // Se já houver apuração de combustível pelo doc, evita dupla contagem
        if (doc.combustivelLitros && doc.combustivelLitros > 0) {
          continue
        }

        const classif = classificarItemCompradoNCM({
          descricao: item.descricao || 'Item de Mercadoria / Insumo',
          ncm: item.ncm,
          unidadeDeclarada: item.unidade,
          quantidadeFisica: item.quantidade,
          valorBrl: item.valorTotal || 0,
        })

        escopo3Fossil += classif.emissaoFossilTco2e
        somaIncertezaPonderada += classif.emissaoFossilTco2e * classif.incertezaPct
        pesoTotalEmissoes += classif.emissaoFossilTco2e

        itensApurados.push({
          id: `e3_cat1_${doc.chaveAcesso.slice(-6)}_${item.numeroItem || itensApurados.length}`,
          origemDocChave: doc.chaveAcesso,
          modeloFiscal: doc.modeloFiscal,
          descricaoItem: `${item.descricao || 'Insumo/Mercadoria'} [${classif.familia.nome}] - ${classif.declaracaoMetodologica}`,
          categoria: 'Escopo 3',
          subcategoria: 'Bens e Serviços Comprados (Cat. 1)',
          quantidade: classif.quantidadeFisica,
          unidade: classif.unidadeFisica,
          fatorUtilizado: {
            id: `ncm_${classif.familia.id}`,
            descricao: `Fator ${classif.familia.nome} (${classif.fonteFator})`,
            categoria: 'Escopo 3',
            subcategoria: 'Bens e Serviços Comprados',
            unidade: classif.unidadeFator,
            kgCO2: classif.fatorUtilizado,
            kgCH4: 0,
            kgN2O: 0,
            kgCO2Biogenico: 0,
            fatorFossilTCO2e: classif.fatorUtilizado / 1000,
            fonte: classif.fonteFator,
            anoReferencia: 2024,
            versaoTabela: 'ACV / Spend Ecoinvent',
            tierIncertezaPadrao: classif.tierIncerteza,
            incertezaPadraoPct: classif.incertezaPct,
          },
          kgCO2: classif.emissaoFossilKgCo2e,
          kgCH4: 0,
          kgN2O: 0,
          fossilTCO2e: classif.emissaoFossilTco2e,
          biogenicoTCO2e: 0,
          tierIncerteza: classif.tierIncerteza,
          incertezaPct: classif.incertezaPct,
          fonteFator: `${classif.fonteFator} (${classif.declaracaoMetodologica})`,
        })
      }
    }

    // 6. INSETTING CIRCULAR ISO 14067: Peças Automotivas Reutilizadas de CDV
    if (doc.pecasReutilizadasQtd && doc.pecasReutilizadasQtd > 0) {
      const qtd = doc.pecasReutilizadasQtd
      const fator = FATORES_EMISSAO_CURADOS.insetting_cdv_peca
      const tCO2eEvitado = Math.abs(qtd * fator.fatorFossilTCO2e)
      insettingTotal += tCO2eEvitado

      itensApurados.push({
        id: `insetting_${doc.chaveAcesso.slice(-8)}`,
        origemDocChave: doc.chaveAcesso,
        modeloFiscal: doc.modeloFiscal,
        descricaoItem: `Insetting ISO 14067: ${qtd} peças reutilizadas em CDV (Evitação de Matéria Virgem)`,
        categoria: 'Insetting',
        subcategoria: 'Economia Circular Automotiva (Programa MOVER)',
        quantidade: qtd,
        unidade: 'unidade',
        fatorUtilizado: fator,
        kgCO2: -1 * (qtd * Math.abs(fator.kgCO2)),
        kgCH4: 0,
        kgN2O: 0,
        fossilTCO2e: -tCO2eEvitado,
        biogenicoTCO2e: 0,
        tierIncerteza: fator.tierIncertezaPadrao,
        incertezaPct: fator.incertezaPadraoPct,
        fonteFator: `${fator.fonte} (${fator.versaoTabela})`,
      })
    }
  }

  // 7. INSETTING CDV VINCULADO VIA LOTES OPERACIONAIS (kg -> tCO2e)
  if (opcoes?.insettingCdvCo2eKg && opcoes.insettingCdvCo2eKg > 0) {
    const tCO2eLotes = Number((opcoes.insettingCdvCo2eKg / 1000).toFixed(3))
    insettingTotal += tCO2eLotes
    itensApurados.push({
      id: 'insetting_cdv_lotes_vinculados',
      origemDocChave: opcoes.cnpj || 'CDV_LOTES',
      modeloFiscal: '55_nfe',
      descricaoItem: `Insetting ISO 14067: ${opcoes.insettingCdvCo2eKg.toLocaleString('pt-BR')} kg CO₂e evitados em lotes operacionais CDV`,
      categoria: 'Insetting',
      subcategoria: 'Economia Circular Automotiva (Programa MOVER & DPP)',
      quantidade: opcoes.insettingCdvCo2eKg,
      unidade: 'kg CO2e',
      fatorUtilizado: FATORES_EMISSAO_CURADOS.insetting_cdv_peca,
      kgCO2: -opcoes.insettingCdvCo2eKg,
      kgCH4: 0,
      kgN2O: 0,
      fossilTCO2e: -tCO2eLotes,
      biogenicoTCO2e: 0,
      tierIncerteza: 'Tier 2',
      incertezaPct: 5.0,
      fonteFator: 'Orbis dMRV v3.2 / Módulo CDV Operacional',
    })
  }

  // Se não houver itens com combustível/energia explícita nas notas, cria estimativa calibrada pelo total faturado
  if (itensApurados.length === 0 && documentos.length > 0) {
    const somaTotal = documentos.reduce((acc, d) => acc + (d.valorTotal || 0), 0)
    // Estimativa conservadora de serviço/comércio: ~0.000008 tCO2e por R$ faturado
    const tEstimado = Math.max(0.1, somaTotal * 0.000008)
    const e1 = tEstimado * 0.35
    const e2 = tEstimado * 0.45
    const e3 = tEstimado * 0.2

    escopo1Fossil = e1
    escopo2Localizacao = e2
    escopo2Mercado = possuiIREC ? 0 : e2
    escopo3Fossil = e3

    pesoTotalEmissoes = tEstimado
    somaIncertezaPonderada = tEstimado * 10.0 // 10% incerteza média

    itensApurados.push({
      id: 'estimativa_preliminar_faturada',
      origemDocChave: documentos[0]?.chaveAcesso || 'CONSOLIDADO',
      modeloFiscal: '55_nfe',
      descricaoItem: 'Apuração preliminar baseada no faturamento de insumos das notas fiscais',
      categoria: 'Escopo 1',
      subcategoria: 'Estimativa Preliminar Documentada',
      quantidade: somaTotal,
      unidade: 'BRL',
      fatorUtilizado: FATORES_EMISSAO_CURADOS.diesel_s10,
      kgCO2: e1 * 1000,
      kgCH4: 0,
      kgN2O: 0,
      fossilTCO2e: e1,
      biogenicoTCO2e: 0,
      tierIncerteza: 'Tier 1',
      incertezaPct: 15.0,
      fonteFator: 'Metodologia Híbrida GHG Protocol / Contábil',
    })
  }

  const emissoesTotaisFosseis = escopo1Fossil + escopo2Localizacao + escopo3Fossil
  const emissoesBiogenicasTotal = escopo1Biogenico + escopo3Biogenico
  const emissoesLiquidas = Math.max(0, emissoesTotaisFosseis - insettingTotal)

  const incertezaConsolidadaPct =
    pesoTotalEmissoes > 0 ? Number((somaIncertezaPonderada / pesoTotalEmissoes).toFixed(1)) : 5.0

  // Enquadramento SBCE (Lei 15.042/2024)
  let statusSBCE: 'isento_monitoramento' | 'dever_reporte_10k' | 'dever_compensacao_25k' =
    'isento_monitoramento'
  let tituloSBCE = 'Isento de Reporte Compulsório (< 10.000 tCO₂e/ano)'
  let explicacaoSBCE =
    'Suas emissões operacionais estão abaixo do piso regulatório de 10.000 tCO₂e/ano da Lei 15.042/2024. A organização não possui deveres sancionatórios, podendo utilizar seu inventário de forma voluntária para redução de spread bancário e atração de clientes.'

  if (emissoesTotaisFosseis >= 25000) {
    statusSBCE = 'dever_compensacao_25k'
    tituloSBCE = 'Dever de Reporte & Compensação Compulsória (≥ 25.000 tCO₂e/ano)'
    explicacaoSBCE =
      'A organização ultrapassa o limiar máximo do SBCE. Exige-se apresentação do Plano de Monitoramento dMRV, auditoria anual por terceira parte independente e obrigação de entrega de Ativos de Redução de Emissões para cobrir a cota anual.'
  } else if (emissoesTotaisFosseis >= 10000) {
    statusSBCE = 'dever_reporte_10k'
    tituloSBCE = 'Dever de Reporte e Monitoramento Anual (10.000 a 25.000 tCO₂e/ano)'
    explicacaoSBCE =
      'A organização está inserida no Sistema de Registro Central do SBCE. Deve elaborar e submeter o Relatório de Emissões anualmente sob metodologia dMRV, sem dever imediato de aquisição de cotas compulsórias.'
  }

  const limiar10kPct = Number(Math.min(100, (emissoesTotaisFosseis / 10000) * 100).toFixed(1))
  const limiar25kPct = Number(Math.min(100, (emissoesTotaisFosseis / 25000) * 100).toFixed(1))

  return {
    empresaNome: opcoes?.empresaNome || 'Empresa Cadastrada',
    cnpj: opcoes?.cnpj || '00.000.000/0001-00',
    anoBase: opcoes?.anoBase || new Date().getFullYear(),
    periodoReferencia: `${new Date().getFullYear()} (Acumulado)`,
    totalDocumentosAnalisados: documentos.length,
    escopo1TotalTCO2e: Number(escopo1Fossil.toFixed(3)),
    escopo2LocalizacaoTCO2e: Number(escopo2Localizacao.toFixed(3)),
    escopo2MercadoTCO2e: Number(escopo2Mercado.toFixed(3)),
    escopo3TotalTCO2e: Number(escopo3Fossil.toFixed(3)),
    emissoesBiogenicasTotalTCO2e: Number(emissoesBiogenicasTotal.toFixed(3)),
    insettingTotalTCO2e: Number(insettingTotal.toFixed(3)),
    emissoesTotaisFosseisTCO2e: Number(emissoesTotaisFosseis.toFixed(3)),
    emissoesLiquidasTCO2e: Number(emissoesLiquidas.toFixed(3)),
    incertezaConsolidadaPct,
    enquadramentoSBCE: {
      status: statusSBCE,
      titulo: tituloSBCE,
      explicacao: explicacaoSBCE,
      limiar10kPct,
      limiar25kPct,
    },
    itensDetalhados: itensApurados,
    declarouEnergiaRenovavelMercado: possuiIREC,
    versaoMetodologia: 'Orbis dMRV v3.2 • MCTI/SIN 2024 • IPCC AR6 • SBCE Lei 15.042/2024',
  }
}
