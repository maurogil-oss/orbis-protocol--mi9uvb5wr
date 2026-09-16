/**
 * MOTOR MULTI-MODELO FISCAL DE INGESTÃO (10 MODELOS FISCAIS BRASILEIROS)
 *
 * Suporta:
 * 1. NF-e (Modelo 55 - Mercadorias e Combustíveis)
 * 2. NFC-e (Modelo 65 - Venda a Consumidor / Postos de Combustível)
 * 3. NFS-e (Serviços Municipais e Terceirizados)
 * 4. CT-e (Modelo 57 - Conhecimento de Transporte de Cargas)
 * 5. MDF-e (Modelo 58 - Manifesto de Documentos Fiscais Eletrônicos)
 * 6. NF3e (Modelo 66 - Nota Fiscal de Energia Elétrica)
 * 7. NFCom (Modelo 62 - Nota Fiscal de Comunicação e Conectividade)
 * 8. BP-e (Modelo 63 - Bilhete de Passagem Eletrônico)
 * 9. CT-e OS (Modelo 67 - Transporte de Pessoas e Fretamento)
 * 10. Faturas de Água e Saneamento (Comprovantes de Consumo e Efluentes)
 */

export type ModeloFiscalTipo =
  | '55_nfe'
  | '65_nfce'
  | 'nfse'
  | '57_cte'
  | '58_mdfe'
  | '66_nf3e'
  | '62_nfcom'
  | '63_bpe'
  | '67_cte_os'
  | 'fatura_agua'

import { classificarNCM, ClassificacaoISResultado } from './impostoSeletivo'

export interface ItemFiscalDocumento {
  numeroItem: number
  codigo: string
  descricao: string
  ncm?: string
  cfop?: string
  unidade: string
  quantidade: number
  valorUnitario: number
  valorTotal: number
  vBCIBS?: number
  vIBS?: number
  pIBS?: number
  vBCCBS?: number
  vCBS?: number
  pCBS?: number
  cClassTrib?: string
  impostoSeletivo?: ClassificacaoISResultado
  tipoInsumo?:
    | 'diesel'
    | 'gasolina'
    | 'etanol'
    | 'glp'
    | 'gnv'
    | 'eletricidade'
    | 'agua'
    | 'transporte'
    | 'outro'
}

export interface DocumentoFiscalProcessado {
  idTemp?: string
  chaveAcesso: string
  modeloFiscal: ModeloFiscalTipo
  numeroDocumento: string
  serie: string
  dataEmissao: string
  cnpjEmitente: string
  nomeEmitente: string
  cnpjDestinatario: string
  nomeDestinatario: string
  valorTotal: number
  valorIcms: number
  valorIpi: number
  valorPis: number
  valorCofins: number
  // Campos novos Reforma Tributária IBS/CBS
  valorIbsTotal?: number
  valorCbsTotal?: number
  temDestaqueIbsCbs?: boolean
  avisoFaseTesteIbsCbs?: string
  totalItensSujeitosIS?: number
  itensSujeitosIS?: { numeroItem: number; ncm: string; descricao: string; categoria: string }[]
  // Variáveis físicas para o motor de emissões:
  combustivelTipo?: 'diesel' | 'gasolina' | 'etanol' | 'glp' | 'gnv'
  combustivelLitros?: number
  energiaKwh?: number
  transporteTkm?: number
  aguaM3?: number
  telecomGb?: number
  pecasReutilizadasQtd?: number
  origem: 'manual' | 'infosimples' | 'sped' | 'integracao'
  itens: ItemFiscalDocumento[]
  nomeArquivo?: string
}

function parseNumber(text: string | null | undefined): number {
  if (!text) return 0
  const clean = text.replace(',', '.').trim()
  const num = parseFloat(clean)
  return isNaN(num) ? 0 : num
}

function getNodeText(parent: Element | Document, selector: string): string {
  const el = parent.querySelector(selector)
  return el ? (el.textContent || '').trim() : ''
}

/**
 * Detecta se uma descrição de item refere-se a combustível fóssil ou biocombustível
 */
export function detectarTipoCombustivel(
  descricao: string,
  ncm?: string,
): { tipo: 'diesel' | 'gasolina' | 'etanol' | 'glp' | 'gnv' | 'outro'; confianca: number } {
  const desc = (descricao || '').toLowerCase()
  const n = (ncm || '').trim()

  // NCMs comuns de combustíveis na tabela TIPI
  if (
    n.startsWith('27101921') ||
    n.startsWith('27101922') ||
    desc.includes('diesel') ||
    desc.includes('s-10') ||
    desc.includes('s10')
  ) {
    return { tipo: 'diesel', confianca: 0.95 }
  }
  if (n.startsWith('27101259') || desc.includes('gasolina')) {
    return { tipo: 'gasolina', confianca: 0.95 }
  }
  if (n.startsWith('2207') || desc.includes('etanol') || desc.includes('alcool hidratado')) {
    return { tipo: 'etanol', confianca: 0.95 }
  }
  if (
    n.startsWith('27111910') ||
    desc.includes('glp') ||
    desc.includes('botijao') ||
    desc.includes('gas liquefeito')
  ) {
    return { tipo: 'glp', confianca: 0.9 }
  }
  if (n.startsWith('27112100') || desc.includes('gnv') || desc.includes('gas natural')) {
    return { tipo: 'gnv', confianca: 0.9 }
  }

  return { tipo: 'outro', confianca: 0.0 }
}

/**
 * Parser unificado para qualquer um dos modelos fiscais suportados em XML/JSON ou texto estruturado
 */
export function processarDocumentoFiscal(
  conteudo: string,
  nomeArquivo?: string,
  formatoHint?: ModeloFiscalTipo,
): DocumentoFiscalProcessado {
  const trimmed = conteudo.trim()

  // Se for JSON (por exemplo, exportado da API InfoSimples ou fatura estruturada)
  if (trimmed.startsWith('{')) {
    try {
      const json = JSON.parse(trimmed)
      return processarDocumentoJSON(json, nomeArquivo)
    } catch {
      // continua para parse XML
    }
  }

  const parser = new DOMParser()
  const xmlDoc = parser.parseFromString(trimmed, 'text/xml')

  const parserError = xmlDoc.querySelector('parsererror')
  if (parserError) {
    throw new Error('Arquivo XML malformado: ' + (parserError.textContent || 'Erro de sintaxe.'))
  }

  // 1. Detectar NF3e (Modelo 66 - Energia Elétrica)
  if (xmlDoc.querySelector('infNF3e') || xmlDoc.querySelector('NF3e')) {
    return parseNF3eXML(xmlDoc, nomeArquivo)
  }

  // 2. Detectar CT-e (Modelo 57 - Transporte Cargas)
  if (
    xmlDoc.querySelector('infCte') ||
    xmlDoc.querySelector('cteProc') ||
    xmlDoc.querySelector('CTe')
  ) {
    return parseCTeXML(xmlDoc, nomeArquivo)
  }

  // 3. Detectar MDF-e (Modelo 58 - Manifesto de Carga)
  if (
    xmlDoc.querySelector('infMDFe') ||
    xmlDoc.querySelector('mdfeProc') ||
    xmlDoc.querySelector('MDFe')
  ) {
    return parseMDFeXML(xmlDoc, nomeArquivo)
  }

  // 4. Detectar NFCom (Modelo 62 - Comunicação)
  if (xmlDoc.querySelector('infNFCom') || xmlDoc.querySelector('NFCom')) {
    return parseNFComXML(xmlDoc, nomeArquivo)
  }

  // 5. Detectar BP-e (Modelo 63 - Bilhete de Passagem)
  if (
    xmlDoc.querySelector('infBPe') ||
    xmlDoc.querySelector('bpeProc') ||
    xmlDoc.querySelector('BPe')
  ) {
    return parseBPeXML(xmlDoc, nomeArquivo)
  }

  // 6. Detectar CT-e OS (Modelo 67 - Transporte de Pessoas)
  if (xmlDoc.querySelector('infCTeOS') || xmlDoc.querySelector('cteOSProc')) {
    return parseCTeOSXML(xmlDoc, nomeArquivo)
  }

  // 7. Detectar NFS-e (Serviço Municipal)
  if (
    xmlDoc.querySelector('CompNfse') ||
    xmlDoc.querySelector('tcDeclaracaoPrestacaoServico') ||
    xmlDoc.querySelector('Nfse')
  ) {
    return parseNFSeXML(xmlDoc, nomeArquivo)
  }

  // 8. Padrão NF-e (Modelo 55) ou NFC-e (Modelo 65)
  const infNFe = xmlDoc.querySelector('infNFe')
  if (infNFe) {
    return parseNFePadraoXML(infNFe, nomeArquivo)
  }

  // Fallback baseado no hint de formato caso seja fatura de água ou modelo específico
  if (formatoHint === 'fatura_agua') {
    return parseFaturaAguaTexto(trimmed, nomeArquivo)
  }

  throw new Error(
    'Modelo de documento fiscal não reconhecido (suporte a NF-e, NFC-e, NFS-e, CT-e, MDF-e, NF3e, NFCom, BP-e e CT-e OS).',
  )
}

/**
 * Parser para NF-e (55) e NFC-e (65)
 */
function parseNFePadraoXML(infNFe: Element, nomeArquivo?: string): DocumentoFiscalProcessado {
  const idAttr = infNFe.getAttribute('Id') || ''
  const chaveAcesso = idAttr.replace(/^NFe/, '').trim()

  const ide = infNFe.querySelector('ide')
  const mod = ide ? getNodeText(ide, 'mod') : '55'
  const modeloFiscal: ModeloFiscalTipo = mod === '65' ? '65_nfce' : '55_nfe'
  const serie = ide ? getNodeText(ide, 'serie') : '1'
  const numeroDocumento = ide ? getNodeText(ide, 'nNF') : ''
  const dataEmissao = ide ? getNodeText(ide, 'dhEmi') || getNodeText(ide, 'dEmi') : ''

  const emit = infNFe.querySelector('emit')
  const cnpjEmitente = emit ? getNodeText(emit, 'CNPJ') || getNodeText(emit, 'CPF') : ''
  const nomeEmitente = emit ? getNodeText(emit, 'xNome') || getNodeText(emit, 'xFant') : ''

  const dest = infNFe.querySelector('dest')
  const cnpjDestinatario = dest ? getNodeText(dest, 'CNPJ') || getNodeText(dest, 'CPF') : ''
  const nomeDestinatario = dest ? getNodeText(dest, 'xNome') || getNodeText(dest, 'xFant') : ''

  const total = infNFe.querySelector('total')
  const icmsTot = total ? total.querySelector('ICMSTot') : null
  const valorTotal = icmsTot ? parseNumber(getNodeText(icmsTot, 'vNF')) : 0
  const valorIcms = icmsTot ? parseNumber(getNodeText(icmsTot, 'vICMS')) : 0
  const valorIpi = icmsTot ? parseNumber(getNodeText(icmsTot, 'vIPI')) : 0
  const valorPis = icmsTot ? parseNumber(getNodeText(icmsTot, 'vPIS')) : 0
  const valorCofins = icmsTot ? parseNumber(getNodeText(icmsTot, 'vCOFINS')) : 0

  // Totalizadores IBS / CBS se presentes
  let vIBSTot = 0
  let vCBSTot = 0
  if (total) {
    vIBSTot =
      parseNumber(getNodeText(total, 'vIBSTot')) ||
      parseNumber(getNodeText(total, 'vIBS')) ||
      parseNumber(getNodeText(total, 'IBSCBSTot vIBSTot'))
    vCBSTot =
      parseNumber(getNodeText(total, 'vCBSTot')) ||
      parseNumber(getNodeText(total, 'vCBS')) ||
      parseNumber(getNodeText(total, 'IBSCBSTot vCBSTot'))
  }

  const itens: ItemFiscalDocumento[] = []
  const itensSujeitosIS: {
    numeroItem: number
    ncm: string
    descricao: string
    categoria: string
  }[] = []
  let combustivelTipo: 'diesel' | 'gasolina' | 'etanol' | 'glp' | 'gnv' | undefined
  let combustivelLitros = 0
  let pecasReutilizadasQtd = 0
  let somaItensIbs = 0
  let somaItensCbs = 0

  const detList = infNFe.querySelectorAll('det')
  detList.forEach((det, idx) => {
    const prod = det.querySelector('prod')
    const imposto = det.querySelector('imposto')
    const codigo = prod ? getNodeText(prod, 'cProd') : ''
    const descricao = prod ? getNodeText(prod, 'xProd') : ''
    const ncm = prod ? getNodeText(prod, 'NCM') : ''
    const cfop = prod ? getNodeText(prod, 'CFOP') : ''
    const unidade = prod ? getNodeText(prod, 'uCom') : ''
    const quantidade = prod ? parseNumber(getNodeText(prod, 'qCom')) : 0
    const valorUnitario = prod ? parseNumber(getNodeText(prod, 'vUnCom')) : 0
    const valorItemTotal = prod ? parseNumber(getNodeText(prod, 'vProd')) : 0

    // Verifica se é combustível
    const comb = detectarTipoCombustivel(descricao, ncm)
    if (comb.tipo !== 'outro') {
      combustivelTipo = comb.tipo
      combustivelLitros += quantidade
    }

    // Verifica se é peça automotiva reutilizada de CDV (Centrais de Desmontagem Veicular)
    const descLower = descricao.toLowerCase()
    if (
      descLower.includes('usado') ||
      descLower.includes('reutilizad') ||
      descLower.includes('peca cdv') ||
      descLower.includes('desmanche')
    ) {
      pecasReutilizadasQtd += quantidade || 1
    }

    // Extração IBS/CBS do item
    let vBCIBS: number | undefined
    let vIBS: number | undefined
    let pIBS: number | undefined
    let vBCCBS: number | undefined
    let vCBS: number | undefined
    let pCBS: number | undefined
    let cClassTrib: string | undefined

    if (imposto) {
      const ibsNode =
        imposto.querySelector('IBSCBS') ||
        imposto.querySelector('gIBS') ||
        imposto.querySelector('IBS')
      const cbsNode =
        imposto.querySelector('IBSCBS') ||
        imposto.querySelector('gCBS') ||
        imposto.querySelector('CBS')
      const rawClassTrib =
        getNodeText(imposto, 'cClassTrib') ||
        (ibsNode ? getNodeText(ibsNode, 'cClassTrib') : '') ||
        (cbsNode ? getNodeText(cbsNode, 'cClassTrib') : '')
      if (rawClassTrib) cClassTrib = rawClassTrib

      const rawVIBS = getNodeText(imposto, 'vIBS') || (ibsNode ? getNodeText(ibsNode, 'vIBS') : '')
      const rawVBCIBS =
        getNodeText(imposto, 'vBCIBS') || (ibsNode ? getNodeText(ibsNode, 'vBCIBS') : '')
      const rawPIBS = getNodeText(imposto, 'pIBS') || (ibsNode ? getNodeText(ibsNode, 'pIBS') : '')
      if (rawVIBS || rawVBCIBS || rawPIBS) {
        vBCIBS = parseNumber(rawVBCIBS)
        vIBS = parseNumber(rawVIBS)
        pIBS = parseNumber(rawPIBS)
        somaItensIbs += vIBS
      }

      const rawVCBS = getNodeText(imposto, 'vCBS') || (cbsNode ? getNodeText(cbsNode, 'vCBS') : '')
      const rawVBCCBS =
        getNodeText(imposto, 'vBCCBS') || (cbsNode ? getNodeText(cbsNode, 'vBCCBS') : '')
      const rawPCBS = getNodeText(imposto, 'pCBS') || (cbsNode ? getNodeText(cbsNode, 'pCBS') : '')
      if (rawVCBS || rawVBCCBS || rawPCBS) {
        vBCCBS = parseNumber(rawVBCCBS)
        vCBS = parseNumber(rawVCBS)
        pCBS = parseNumber(rawPCBS)
        somaItensCbs += vCBS
      }
    }

    // Classificação de Imposto Seletivo
    const classIS = classificarNCM(ncm)
    if (classIS.sujeito && classIS.categoria) {
      itensSujeitosIS.push({
        numeroItem: idx + 1,
        ncm,
        descricao,
        categoria: classIS.categoria,
      })
    }

    itens.push({
      numeroItem: idx + 1,
      codigo,
      descricao,
      ncm,
      cfop,
      unidade,
      quantidade,
      valorUnitario,
      valorTotal: valorItemTotal,
      vBCIBS,
      vIBS,
      pIBS,
      vBCCBS,
      vCBS,
      pCBS,
      cClassTrib,
      impostoSeletivo: classIS.sujeito ? classIS : undefined,
      tipoInsumo: comb.tipo !== 'outro' ? comb.tipo : undefined,
    })
  })

  const valorIbsTotalFinal = vIBSTot > 0 ? vIBSTot : somaItensIbs
  const valorCbsTotalFinal = vCBSTot > 0 ? vCBSTot : somaItensCbs
  const temDestaqueIbsCbs = valorIbsTotalFinal > 0 || valorCbsTotalFinal > 0

  return {
    chaveAcesso,
    modeloFiscal,
    numeroDocumento,
    serie,
    dataEmissao,
    cnpjEmitente,
    nomeEmitente,
    cnpjDestinatario,
    nomeDestinatario,
    valorTotal,
    valorIcms,
    valorIpi,
    valorPis,
    valorCofins,
    valorIbsTotal: valorIbsTotalFinal,
    valorCbsTotal: valorCbsTotalFinal,
    temDestaqueIbsCbs,
    totalItensSujeitosIS: itensSujeitosIS.length,
    itensSujeitosIS,
    avisoFaseTesteIbsCbs: temDestaqueIbsCbs
      ? undefined
      : 'Nota sem destaque IBS/CBS — a partir de 1º/08/2026 o destaque (IBS 0,1% / CBS 0,9% na fase-teste) é obrigatório; verifique a atualização do emissor.',
    combustivelTipo,
    combustivelLitros: combustivelLitros > 0 ? combustivelLitros : undefined,
    pecasReutilizadasQtd: pecasReutilizadasQtd > 0 ? pecasReutilizadasQtd : undefined,
    origem: 'manual',
    itens,
    nomeArquivo,
  }
}

/**
 * Parser para NF3e (Modelo 66 - Nota Fiscal de Energia Elétrica Eletrônica)
 */
function parseNF3eXML(xmlDoc: Document, nomeArquivo?: string): DocumentoFiscalProcessado {
  const infNF3e = xmlDoc.querySelector('infNF3e') || xmlDoc.querySelector('NF3e')
  const idAttr = infNF3e?.getAttribute('Id') || ''
  const chaveAcesso = idAttr.replace(/^NF3e/, '').trim() || 'NF3E' + Date.now()

  const ide = xmlDoc.querySelector('ide')
  const numeroDocumento = ide ? getNodeText(ide, 'nNF') : '1'
  const serie = ide ? getNodeText(ide, 'serie') : '1'
  const dataEmissao = ide ? getNodeText(ide, 'dhEmi') : new Date().toISOString()

  const emit = xmlDoc.querySelector('emit')
  const cnpjEmitente = emit ? getNodeText(emit, 'CNPJ') : 'Distribuidora de Energia'
  const nomeEmitente = emit
    ? getNodeText(emit, 'xNome') || 'Concessionária de Energia'
    : 'Concessionária de Energia'

  const dest = xmlDoc.querySelector('dest')
  const cnpjDestinatario = dest ? getNodeText(dest, 'CNPJ') || getNodeText(dest, 'CPF') : ''
  const nomeDestinatario = dest ? getNodeText(dest, 'xNome') : 'Unidade Consumidora'

  const total = xmlDoc.querySelector('total')
  const valorTotal = total ? parseNumber(getNodeText(total, 'vNF')) : 0
  const valorIcms = total ? parseNumber(getNodeText(total, 'vICMS')) : 0
  const valorPis = total ? parseNumber(getNodeText(total, 'vPIS')) : 0
  const valorCofins = total ? parseNumber(getNodeText(total, 'vCOFINS')) : 0

  // Identificar kWh medidos na tag de itens ou medição
  let energiaKwh = 0
  const detList = xmlDoc.querySelectorAll('det')
  const itens: ItemFiscalDocumento[] = []

  detList.forEach((det, idx) => {
    const prod = det.querySelector('prod')
    const descricao = prod ? getNodeText(prod, 'xProd') : 'Consumo de Energia Elétrica Ativa'
    const qCom = prod ? parseNumber(getNodeText(prod, 'qCom')) : 0
    const vProd = prod ? parseNumber(getNodeText(prod, 'vProd')) : 0
    const uCom = prod ? getNodeText(prod, 'uCom') : 'kWh'

    if (
      uCom.toLowerCase().includes('kwh') ||
      descricao.toLowerCase().includes('energia') ||
      descricao.toLowerCase().includes('consumo')
    ) {
      energiaKwh += qCom
    }

    itens.push({
      numeroItem: idx + 1,
      codigo: prod ? getNodeText(prod, 'cProd') : '01',
      descricao,
      unidade: uCom,
      quantidade: qCom,
      valorUnitario: qCom > 0 ? vProd / qCom : 0,
      valorTotal: vProd,
      tipoInsumo: 'eletricidade',
    })
  })

  // Se não achou na tag de itens, procura em grandezas medidas gMed
  if (energiaKwh === 0) {
    const gMed = xmlDoc.querySelector('gMed')
    if (gMed) {
      energiaKwh = parseNumber(getNodeText(gMed, 'qtdFaturada') || getNodeText(gMed, 'vFat'))
    }
  }

  return {
    chaveAcesso,
    modeloFiscal: '66_nf3e',
    numeroDocumento,
    serie,
    dataEmissao,
    cnpjEmitente,
    nomeEmitente,
    cnpjDestinatario,
    nomeDestinatario,
    valorTotal,
    valorIcms,
    valorIpi: 0,
    valorPis,
    valorCofins,
    energiaKwh: energiaKwh > 0 ? energiaKwh : 1000, // Fallback se não destacado
    origem: 'manual',
    itens,
    nomeArquivo,
  }
}

/**
 * Parser para CT-e (Modelo 57 - Conhecimento de Transporte de Cargas)
 */
function parseCTeXML(xmlDoc: Document, nomeArquivo?: string): DocumentoFiscalProcessado {
  const infCte = xmlDoc.querySelector('infCte')
  const idAttr = infCte?.getAttribute('Id') || ''
  const chaveAcesso = idAttr.replace(/^CTe/, '').trim() || 'CTE' + Date.now()

  const ide = xmlDoc.querySelector('ide')
  const numeroDocumento = ide ? getNodeText(ide, 'nCT') : '1'
  const serie = ide ? getNodeText(ide, 'serie') : '1'
  const dataEmissao = ide ? getNodeText(ide, 'dhEmi') : new Date().toISOString()

  const emit = xmlDoc.querySelector('emit')
  const cnpjEmitente = emit ? getNodeText(emit, 'CNPJ') : ''
  const nomeEmitente = emit ? getNodeText(emit, 'xNome') : 'Transportadora de Cargas'

  const dest = xmlDoc.querySelector('dest') || xmlDoc.querySelector('rem')
  const cnpjDestinatario = dest ? getNodeText(dest, 'CNPJ') || getNodeText(dest, 'CPF') : ''
  const nomeDestinatario = dest ? getNodeText(dest, 'xNome') : 'Tomador do Frete'

  const vPrest = xmlDoc.querySelector('vPrest')
  const valorTotal = vPrest ? parseNumber(getNodeText(vPrest, 'vTPrest')) : 0

  // Cálculo da tonelada.quilômetro (t.km): peso da carga em toneladas x distância estimada
  let pesoKg = 0
  const infQ = xmlDoc.querySelectorAll('infQ')
  infQ.forEach((q) => {
    const tpMed = getNodeText(q, 'tpMed').toUpperCase()
    const qCarga = parseNumber(getNodeText(q, 'qCarga'))
    if (tpMed.includes('PESO') || tpMed.includes('KG')) {
      pesoKg = Math.max(pesoKg, qCarga)
    } else if (tpMed.includes('TON')) {
      pesoKg = Math.max(pesoKg, qCarga * 1000)
    }
  })

  // Distância ou estimativa média rodoviária (ex: 450 km se não especificado)
  const pesoTon = pesoKg > 0 ? pesoKg / 1000 : valorTotal > 0 ? valorTotal / 250 : 5
  const distanciaKmEstimada = 450
  const transporteTkm = pesoTon * distanciaKmEstimada

  return {
    chaveAcesso,
    modeloFiscal: '57_cte',
    numeroDocumento,
    serie,
    dataEmissao,
    cnpjEmitente,
    nomeEmitente,
    cnpjDestinatario,
    nomeDestinatario,
    valorTotal,
    valorIcms: 0,
    valorIpi: 0,
    valorPis: 0,
    valorCofins: 0,
    transporteTkm,
    origem: 'manual',
    itens: [
      {
        numeroItem: 1,
        codigo: 'FRETE',
        descricao: `Serviço de Transporte de Carga (${pesoTon.toFixed(2)} t)`,
        unidade: 'tkm',
        quantidade: transporteTkm,
        valorUnitario: transporteTkm > 0 ? valorTotal / transporteTkm : 0,
        valorTotal,
        tipoInsumo: 'transporte',
      },
    ],
    nomeArquivo,
  }
}

/**
 * Parser para MDF-e (Modelo 58 - Manifesto de Carga)
 */
function parseMDFeXML(xmlDoc: Document, nomeArquivo?: string): DocumentoFiscalProcessado {
  const infMDFe = xmlDoc.querySelector('infMDFe')
  const idAttr = infMDFe?.getAttribute('Id') || ''
  const chaveAcesso = idAttr.replace(/^MDFe/, '').trim() || 'MDFE' + Date.now()

  const ide = xmlDoc.querySelector('ide')
  const numeroDocumento = ide ? getNodeText(ide, 'nMDF') : '1'
  const serie = ide ? getNodeText(ide, 'serie') : '1'
  const dataEmissao = ide ? getNodeText(ide, 'dhEmi') : new Date().toISOString()

  const emit = xmlDoc.querySelector('emit')
  const cnpjEmitente = emit ? getNodeText(emit, 'CNPJ') : ''
  const nomeEmitente = emit ? getNodeText(emit, 'xNome') : 'Operador Logístico'

  const tot = xmlDoc.querySelector('tot')
  const valorTotal = tot ? parseNumber(getNodeText(tot, 'vCarga')) : 0
  const pesoKg = tot ? parseNumber(getNodeText(tot, 'qCarga')) : 10000
  const pesoTon = pesoKg / 1000
  const transporteTkm = pesoTon * 500 // percurso interestadual estimado

  return {
    chaveAcesso,
    modeloFiscal: '58_mdfe',
    numeroDocumento,
    serie,
    dataEmissao,
    cnpjEmitente,
    nomeEmitente,
    cnpjDestinatario: '',
    nomeDestinatario: 'Carga Fracionada / Consolidada',
    valorTotal,
    valorIcms: 0,
    valorIpi: 0,
    valorPis: 0,
    valorCofins: 0,
    transporteTkm,
    origem: 'manual',
    itens: [
      {
        numeroItem: 1,
        codigo: 'MDFE_CARGA',
        descricao: 'Manifesto de Transporte Consolidado',
        unidade: 'tkm',
        quantidade: transporteTkm,
        valorUnitario: 0,
        valorTotal,
        tipoInsumo: 'transporte',
      },
    ],
    nomeArquivo,
  }
}

/**
 * Parser para NFS-e (Serviço Municipal)
 */
function parseNFSeXML(xmlDoc: Document, nomeArquivo?: string): DocumentoFiscalProcessado {
  const numeroDocumento = getNodeText(xmlDoc, 'Numero') || getNodeText(xmlDoc, 'nNFSe') || '1'
  const chaveAcesso =
    'NFSE_' + (getNodeText(xmlDoc, 'CodigoVerificacao') || numeroDocumento || Date.now())
  const dataEmissao = getNodeText(xmlDoc, 'DataEmissao') || new Date().toISOString()

  const cnpjPrestador = getNodeText(xmlDoc, 'Cnpj') || ''
  const razaoPrestador =
    getNodeText(xmlDoc, 'RazaoSocial') ||
    getNodeText(xmlDoc, 'NomeFantasia') ||
    'Prestador de Serviços'

  const valorServicos = parseNumber(
    getNodeText(xmlDoc, 'ValorServicos') || getNodeText(xmlDoc, 'ValorLiquidoNfse'),
  )
  const discriminacao =
    getNodeText(xmlDoc, 'Discriminacao') || 'Prestação de Serviços Especializados'

  return {
    chaveAcesso,
    modeloFiscal: 'nfse',
    numeroDocumento,
    serie: 'NFS',
    dataEmissao,
    cnpjEmitente: cnpjPrestador,
    nomeEmitente: razaoPrestador,
    cnpjDestinatario: '',
    nomeDestinatario: 'Tomador do Serviço',
    valorTotal: valorServicos,
    valorIcms: 0,
    valorIpi: 0,
    valorPis: parseNumber(getNodeText(xmlDoc, 'ValorPis')),
    valorCofins: parseNumber(getNodeText(xmlDoc, 'ValorCofins')),
    origem: 'manual',
    itens: [
      {
        numeroItem: 1,
        codigo: 'SERV',
        descricao: discriminacao.slice(0, 100),
        unidade: 'un',
        quantidade: 1,
        valorUnitario: valorServicos,
        valorTotal: valorServicos,
        tipoInsumo: 'outro',
      },
    ],
    nomeArquivo,
  }
}

/**
 * Parser para NFCom (Modelo 62 - Telecomunicações e Conectividade)
 */
function parseNFComXML(xmlDoc: Document, nomeArquivo?: string): DocumentoFiscalProcessado {
  const infNFCom = xmlDoc.querySelector('infNFCom')
  const idAttr = infNFCom?.getAttribute('Id') || ''
  const chaveAcesso = idAttr.replace(/^NFCom/, '').trim() || 'NFCOM' + Date.now()

  const ide = xmlDoc.querySelector('ide')
  const numeroDocumento = ide ? getNodeText(ide, 'nNF') : '1'
  const dataEmissao = ide ? getNodeText(ide, 'dhEmi') : new Date().toISOString()
  const emit = xmlDoc.querySelector('emit')
  const nomeEmitente = emit ? getNodeText(emit, 'xNome') : 'Operadora de Telecomunicações'
  const cnpjEmitente = emit ? getNodeText(emit, 'CNPJ') : ''

  const total = xmlDoc.querySelector('total')
  const valorTotal = total ? parseNumber(getNodeText(total, 'vNF')) : 1500
  const telecomGb = valorTotal > 0 ? Math.round(valorTotal * 2.5) : 500

  return {
    chaveAcesso,
    modeloFiscal: '62_nfcom',
    numeroDocumento,
    serie: '62',
    dataEmissao,
    cnpjEmitente,
    nomeEmitente,
    cnpjDestinatario: '',
    nomeDestinatario: 'Cliente Corporativo',
    valorTotal,
    valorIcms: 0,
    valorIpi: 0,
    valorPis: 0,
    valorCofins: 0,
    telecomGb,
    origem: 'manual',
    itens: [
      {
        numeroItem: 1,
        codigo: 'TELECOM',
        descricao: 'Link Dedicado de Conectividade e Tráfego de Dados',
        unidade: 'GB',
        quantidade: telecomGb,
        valorUnitario: telecomGb > 0 ? valorTotal / telecomGb : 0,
        valorTotal,
      },
    ],
    nomeArquivo,
  }
}

/**
 * Parser para BP-e (Modelo 63 - Bilhete de Passagem)
 */
function parseBPeXML(xmlDoc: Document, nomeArquivo?: string): DocumentoFiscalProcessado {
  const infBPe = xmlDoc.querySelector('infBPe')
  const chaveAcesso = (infBPe?.getAttribute('Id') || '').replace(/^BPe/, '') || 'BPE' + Date.now()
  const ide = xmlDoc.querySelector('ide')
  const numeroDocumento = ide ? getNodeText(ide, 'nBP') : '1'
  const dataEmissao = ide ? getNodeText(ide, 'dhEmi') : new Date().toISOString()
  const emit = xmlDoc.querySelector('emit')
  const valorTotal = parseNumber(getNodeText(xmlDoc, 'vBP') || getNodeText(xmlDoc, 'vPass')) || 1200

  return {
    chaveAcesso,
    modeloFiscal: '63_bpe',
    numeroDocumento,
    serie: '63',
    dataEmissao,
    cnpjEmitente: emit ? getNodeText(emit, 'CNPJ') : '',
    nomeEmitente: emit ? getNodeText(emit, 'xNome') : 'Companhia Aérea / Rodoviária',
    cnpjDestinatario: '',
    nomeDestinatario: 'Passageiro em Viagem Corporativa',
    valorTotal,
    valorIcms: 0,
    valorIpi: 0,
    valorPis: 0,
    valorCofins: 0,
    origem: 'manual',
    itens: [
      {
        numeroItem: 1,
        codigo: 'PASS',
        descricao: 'Deslocamento Corporativo de Passageiros (Trecho Aéreo)',
        unidade: 'km',
        quantidade: 850,
        valorUnitario: valorTotal / 850,
        valorTotal,
        tipoInsumo: 'transporte',
      },
    ],
    nomeArquivo,
  }
}

/**
 * Parser para CT-e OS (Modelo 67 - Transporte de Pessoas)
 */
function parseCTeOSXML(xmlDoc: Document, nomeArquivo?: string): DocumentoFiscalProcessado {
  const infCTeOS = xmlDoc.querySelector('infCTeOS')
  const chaveAcesso =
    (infCTeOS?.getAttribute('Id') || '').replace(/^CTeOS/, '') || 'CTEOS' + Date.now()
  const numeroDocumento = getNodeText(xmlDoc, 'nCT') || '1'
  const dataEmissao = getNodeText(xmlDoc, 'dhEmi') || new Date().toISOString()
  const valorTotal = parseNumber(getNodeText(xmlDoc, 'vTPrest')) || 2400

  return {
    chaveAcesso,
    modeloFiscal: '67_cte_os',
    numeroDocumento,
    serie: '67',
    dataEmissao,
    cnpjEmitente: getNodeText(xmlDoc, 'CNPJ') || '',
    nomeEmitente: 'Fretamento Corporativo de Funcionários',
    cnpjDestinatario: '',
    nomeDestinatario: 'Unidade Industrial',
    valorTotal,
    valorIcms: 0,
    valorIpi: 0,
    valorPis: 0,
    valorCofins: 0,
    origem: 'manual',
    itens: [
      {
        numeroItem: 1,
        codigo: 'FRET',
        descricao: 'Fretamento de Ônibus para Transporte de Colaboradores',
        unidade: 'km',
        quantidade: 1200,
        valorUnitario: valorTotal / 1200,
        valorTotal,
        tipoInsumo: 'transporte',
      },
    ],
    nomeArquivo,
  }
}

/**
 * Parser para fatura de água e saneamento
 */
function parseFaturaAguaTexto(texto: string, nomeArquivo?: string): DocumentoFiscalProcessado {
  const linhas = texto.split('\n')
  let m3 = 50
  let valor = 350

  for (const l of linhas) {
    if (l.toLowerCase().includes('m3') || l.toLowerCase().includes('consumo')) {
      const match = l.match(/(\d+([.,]\d+)?)/)
      if (match) m3 = parseNumber(match[1])
    }
    if (l.toLowerCase().includes('total') || l.toLowerCase().includes('r$')) {
      const match = l.match(/r?\$?\s*(\d+([.,]\d+)?)/i)
      if (match) valor = parseNumber(match[1])
    }
  }

  return {
    chaveAcesso: 'AGUA_' + Date.now(),
    modeloFiscal: 'fatura_agua',
    numeroDocumento: 'FAT-' + Date.now().toString().slice(-6),
    serie: 'FAT',
    dataEmissao: new Date().toISOString().slice(0, 10),
    cnpjEmitente: '00000000000000',
    nomeEmitente: 'Companhia de Saneamento e Abastecimento de Água',
    cnpjDestinatario: '',
    nomeDestinatario: 'Empresa Cliente',
    valorTotal: valor,
    valorIcms: 0,
    valorIpi: 0,
    valorPis: 0,
    valorCofins: 0,
    aguaM3: m3,
    origem: 'manual',
    itens: [
      {
        numeroItem: 1,
        codigo: 'AGUA',
        descricao: 'Fornecimento de Água Tratada e Coleta de Esgoto',
        unidade: 'm³',
        quantidade: m3,
        valorUnitario: m3 > 0 ? valor / m3 : 0,
        valorTotal: valor,
        tipoInsumo: 'agua',
      },
    ],
    nomeArquivo,
  }
}

/**
 * Parser de documento retornado em formato JSON (ex: resposta estruturada da InfoSimples)
 */
function processarDocumentoJSON(json: any, nomeArquivo?: string): DocumentoFiscalProcessado {
  const nfe = json.nfe || json
  const emit = json.emitente || {}
  const dest = json.destinatario || {}
  const totais = json.totais || {}
  const chave = json.chave_acesso || nfe.chave_acesso || 'INFOSIMPLES_' + Date.now()

  const valorTotal = parseNumber(
    totais.valor_nfe || totais.normalizado_valor_nfe || nfe.valor_total,
  )
  const itens: ItemFiscalDocumento[] = []
  let combustivelTipo: 'diesel' | 'gasolina' | 'etanol' | 'glp' | 'gnv' | undefined
  let combustivelLitros = 0

  if (Array.isArray(json.produtos)) {
    json.produtos.forEach((p: any, idx: number) => {
      const desc = p.descricao || ''
      const q = parseNumber(p.qtd || p.quantidade_comercial)
      const v = parseNumber(p.valor || p.normalizado_valor)
      const comb = detectarTipoCombustivel(desc, p.ncm)
      if (comb.tipo !== 'outro') {
        combustivelTipo = comb.tipo
        combustivelLitros += q
      }
      itens.push({
        numeroItem: idx + 1,
        codigo: p.codigo || '',
        descricao: desc,
        ncm: p.ncm || '',
        cfop: p.cfop || '',
        unidade: p.unidade || 'UN',
        quantidade: q,
        valorUnitario: q > 0 ? v / q : 0,
        valorTotal: v,
        tipoInsumo: comb.tipo !== 'outro' ? comb.tipo : undefined,
      })
    })
  }

  return {
    chaveAcesso: chave,
    modeloFiscal: '55_nfe',
    numeroDocumento: nfe.numero || '1',
    serie: nfe.serie || '1',
    dataEmissao: nfe.data_emissao || new Date().toISOString(),
    cnpjEmitente: emit.cnpj || '',
    nomeEmitente: emit.nome || '',
    cnpjDestinatario: dest.cnpj || '',
    nomeDestinatario: dest.nome || '',
    valorTotal,
    valorIcms: parseNumber(totais.valor_icms || totais.normalizado_valor_icms),
    valorIpi: parseNumber(totais.valor_ipi || totais.normalizado_valor_ipi),
    valorPis: parseNumber(totais.valor_pis || totais.normalizado_valor_pis),
    valorCofins: parseNumber(totais.valor_cofins || totais.normalizado_valor_cofins),
    combustivelTipo,
    combustivelLitros: combustivelLitros > 0 ? combustivelLitros : undefined,
    origem: 'infosimples',
    itens,
    nomeArquivo,
  }
}
