/**
 * Parser client-side para arquivos XML de NF-e (Modelo 55) e NFC-e (Modelo 65).
 * Baseado na especificação técnica SEFAZ do padrão nacional de Documentos Fiscais Eletrônicos (NF-e)
 * e nas diretrizes da Emenda Constitucional 132/2023 e LC 214/2025 para a transição IBS/CBS e Imposto Seletivo.
 * Executa inteiramente no navegador via DOMParser, respeitando a privacidade e LGPD.
 */

import { classificarNCM, ClassificacaoISResultado } from './impostoSeletivo'
import { validarChaveAcesso44 } from './validadorFiscalChave'

export { validarChaveAcesso44 }

export interface ItemNFeResumo {
  numeroItem: number
  codigo: string
  descricao: string
  ncm: string
  cfop: string
  unidade: string
  quantidade: number
  valorUnitario: number
  valorTotal: number
  valorIcms?: number
  valorIpi?: number
  valorPis?: number
  valorCofins?: number
  // Campos novos da Reforma Tributária (pós-01/08/2026 - Fase-teste IBS/CBS)
  vBCIBS?: number
  vIBS?: number
  pIBS?: number
  vBCCBS?: number
  vCBS?: number
  pCBS?: number
  cClassTrib?: string
  // Imposto Seletivo
  impostoSeletivo?: ClassificacaoISResultado
}

export interface NFeDadosExtraidos {
  chaveAcesso: string
  numeroNota: string
  serie: string
  modelo: '55' | '65' | string
  naturezaOperacao: string
  dataEmissao: string
  cnpjEmitente: string
  nomeEmitente: string
  cnpjDestinatario: string
  nomeDestinatario: string
  valorTotalNF: number
  valorProdutos: number
  valorFrete: number
  valorSeguro: number
  valorDesconto: number
  valorOutros: number
  valorIcms: number
  valorIpi: number
  valorPis: number
  valorCofins: number
  // Campos e totalizadores novos da Reforma Tributária (IBS/CBS)
  valorIbsTotal: number
  valorCbsTotal: number
  temDestaqueIbsCbs: boolean
  totalItensSujeitosIS: number
  itensSujeitosIS: { numeroItem: number; ncm: string; descricao: string; categoria: string }[]
  avisoFaseTesteIbsCbs?: string
  qtdItens: number
  itens: ItemNFeResumo[]
  nomeArquivo?: string
}

export interface AgregacaoCreditosNFe {
  totalNotas: number
  somaValorTotal: number
  somaPis: number
  somaCofins: number
  somaPisCofins: number
  somaIcms: number
  somaIpi: number
  // Totais de IBS e CBS extraídos
  somaIbs: number
  somaCbs: number
  somaIbsCbs: number
  notasComIbsCbs: number
  notasSemIbsCbs: number
  totalItensSujeitosIS: number
  periodoInicio?: string
  periodoFim?: string
  notasValidas: NFeDadosExtraidos[]
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

export const AVISO_FASE_TESTE_IBS_CBS =
  'Nota sem destaque IBS/CBS — a partir de 1º/08/2026 o destaque (IBS 0,1% / CBS 0,9% na fase-teste) é obrigatório; verifique a atualização do emissor.'

/**
 * Faz o parsing do conteúdo em texto de um arquivo XML de NF-e ou NFC-e,
 * extraindo tributos vigentes, campos IBS/CBS (quando presentes) e classificação de Imposto Seletivo por NCM.
 */
export function parseNFeXML(xmlString: string, nomeArquivo?: string): NFeDadosExtraidos {
  const parser = new DOMParser()
  const xmlDoc = parser.parseFromString(xmlString, 'text/xml')

  // Verifica erro de parse de XML
  const parserError = xmlDoc.querySelector('parsererror')
  if (parserError) {
    throw new Error(
      'Arquivo XML malformado ou corrompido: ' +
        (parserError.textContent || 'Erro de sintaxe XML.'),
    )
  }

  // Verifica se é NF-e / NFC-e (tag <infNFe> ou <NFe>)
  const infNFe = xmlDoc.querySelector('infNFe')
  if (!infNFe) {
    throw new Error(
      'O arquivo enviado não é um XML de NF-e/NFC-e válido (tag <infNFe> não encontrada).',
    )
  }

  // Extrai chave de acesso do atributo Id (ex: "NFe35240112345678000190550010000001231000001234")
  const idAttr = infNFe.getAttribute('Id') || ''
  const chaveAcesso = idAttr.replace(/^NFe/, '').trim()

  // Validação do DV módulo 11 da chave de 44 dígitos
  if (chaveAcesso.length === 44) {
    const validacaoDV = validarChaveAcesso44(chaveAcesso)
    if (!validacaoDV.valida) {
      throw new Error(
        `Chave de acesso inválida — DV módulo 11 não confere (informado: ${validacaoDV.dvInformado}, esperado: ${validacaoDV.dvEsperado}).`,
      )
    }
  }

  // Tag <ide>
  const ide = infNFe.querySelector('ide')
  const modelo = ide ? getNodeText(ide, 'mod') : ''
  const serie = ide ? getNodeText(ide, 'serie') : ''
  const numeroNota = ide ? getNodeText(ide, 'nNF') : ''
  const naturezaOperacao = ide ? getNodeText(ide, 'natOp') : ''
  const dataEmissaoRaw = ide ? getNodeText(ide, 'dhEmi') || getNodeText(ide, 'dEmi') : ''

  // Tag <emit> (Emitente)
  const emit = infNFe.querySelector('emit')
  const cnpjEmitente = emit ? getNodeText(emit, 'CNPJ') || getNodeText(emit, 'CPF') : ''
  const nomeEmitente = emit ? getNodeText(emit, 'xNome') || getNodeText(emit, 'xFant') : ''

  // Tag <dest> (Destinatário)
  const dest = infNFe.querySelector('dest')
  const cnpjDestinatario = dest ? getNodeText(dest, 'CNPJ') || getNodeText(dest, 'CPF') : ''
  const nomeDestinatario = dest ? getNodeText(dest, 'xNome') || getNodeText(dest, 'xFant') : ''

  // Tag <total> -> <ICMSTot> e possíveis totalizadores de IBS / CBS
  const total = infNFe.querySelector('total')
  const icmsTot = total ? total.querySelector('ICMSTot') : null

  const valorTotalNF = icmsTot ? parseNumber(getNodeText(icmsTot, 'vNF')) : 0
  const valorProdutos = icmsTot ? parseNumber(getNodeText(icmsTot, 'vProd')) : 0
  const valorFrete = icmsTot ? parseNumber(getNodeText(icmsTot, 'vFrete')) : 0
  const valorSeguro = icmsTot ? parseNumber(getNodeText(icmsTot, 'vSeg')) : 0
  const valorDesconto = icmsTot ? parseNumber(getNodeText(icmsTot, 'vDesc')) : 0
  const valorOutros = icmsTot ? parseNumber(getNodeText(icmsTot, 'vOutro')) : 0

  const valorIcms = icmsTot ? parseNumber(getNodeText(icmsTot, 'vICMS')) : 0
  const valorIpi = icmsTot ? parseNumber(getNodeText(icmsTot, 'vIPI')) : 0
  const valorPis = icmsTot ? parseNumber(getNodeText(icmsTot, 'vPIS')) : 0
  const valorCofins = icmsTot ? parseNumber(getNodeText(icmsTot, 'vCOFINS')) : 0

  // Totalizadores de IBS/CBS na tag total (<IBSCBSTot>, <vIBSTot>, <vCBSTot>, <gIBS> ou dentro de total)
  let vIBSTot = 0
  let vCBSTot = 0
  if (total) {
    vIBSTot =
      parseNumber(getNodeText(total, 'vIBSTot')) ||
      parseNumber(getNodeText(total, 'vIBS')) ||
      parseNumber(getNodeText(total, 'IBSCBSTot vIBSTot')) ||
      parseNumber(getNodeText(total, 'IBSCBSTot vIBS'))
    vCBSTot =
      parseNumber(getNodeText(total, 'vCBSTot')) ||
      parseNumber(getNodeText(total, 'vCBS')) ||
      parseNumber(getNodeText(total, 'IBSCBSTot vCBSTot')) ||
      parseNumber(getNodeText(total, 'IBSCBSTot vCBS'))
  }

  // Tag <det> (Itens da NF-e)
  const detList = infNFe.querySelectorAll('det')
  const itens: ItemNFeResumo[] = []
  const itensSujeitosIS: {
    numeroItem: number
    ncm: string
    descricao: string
    categoria: string
  }[] = []

  let somaItensIbs = 0
  let somaItensCbs = 0

  detList.forEach((detEl, idx) => {
    const prod = detEl.querySelector('prod')
    const imposto = detEl.querySelector('imposto')

    const codigo = prod ? getNodeText(prod, 'cProd') : ''
    const descricao = prod ? getNodeText(prod, 'xProd') : ''
    const ncm = prod ? getNodeText(prod, 'NCM') : ''
    const cfop = prod ? getNodeText(prod, 'CFOP') : ''
    const unidade = prod ? getNodeText(prod, 'uCom') : ''
    const quantidade = prod ? parseNumber(getNodeText(prod, 'qCom')) : 0
    const valorUnitario = prod ? parseNumber(getNodeText(prod, 'vUnCom')) : 0
    const valorTotal = prod ? parseNumber(getNodeText(prod, 'vProd')) : 0

    // Tributos vigentes destacados no item
    const itemIcms = imposto ? parseNumber(getNodeText(imposto, 'vICMS')) : 0
    const itemIpi = imposto ? parseNumber(getNodeText(imposto, 'vIPI')) : 0
    const itemPis = imposto ? parseNumber(getNodeText(imposto, 'vPIS')) : 0
    const itemCofins = imposto ? parseNumber(getNodeText(imposto, 'vCOFINS')) : 0

    // Extração de grupos IBS / CBS no item (grupo IBSCBS / gIBS / gCBS conforme layout EC 132)
    let vBCIBS: number | undefined
    let vIBS: number | undefined
    let pIBS: number | undefined
    let vBCCBS: number | undefined
    let vCBS: number | undefined
    let pCBS: number | undefined
    let cClassTrib: string | undefined

    if (imposto) {
      // Procura por IBSCBS, gIBS, gCBS, IBS, CBS
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

      // IBS
      const rawVBCIBS =
        getNodeText(imposto, 'vBCIBS') || (ibsNode ? getNodeText(ibsNode, 'vBCIBS') : '')
      const rawVIBS = getNodeText(imposto, 'vIBS') || (ibsNode ? getNodeText(ibsNode, 'vIBS') : '')
      const rawPIBS = getNodeText(imposto, 'pIBS') || (ibsNode ? getNodeText(ibsNode, 'pIBS') : '')
      if (rawVIBS || rawVBCIBS || rawPIBS) {
        vBCIBS = parseNumber(rawVBCIBS)
        vIBS = parseNumber(rawVIBS)
        pIBS = parseNumber(rawPIBS)
        somaItensIbs += vIBS
      }

      // CBS
      const rawVBCCBS =
        getNodeText(imposto, 'vBCCBS') || (cbsNode ? getNodeText(cbsNode, 'vBCCBS') : '')
      const rawVCBS = getNodeText(imposto, 'vCBS') || (cbsNode ? getNodeText(cbsNode, 'vCBS') : '')
      const rawPCBS = getNodeText(imposto, 'pCBS') || (cbsNode ? getNodeText(cbsNode, 'pCBS') : '')
      if (rawVCBS || rawVBCCBS || rawPCBS) {
        vBCCBS = parseNumber(rawVBCCBS)
        vCBS = parseNumber(rawVCBS)
        pCBS = parseNumber(rawPCBS)
        somaItensCbs += vCBS
      }
    }

    // Classificação de Imposto Seletivo por NCM
    const classificacaoIS = classificarNCM(ncm)
    if (classificacaoIS.sujeito && classificacaoIS.categoria) {
      itensSujeitosIS.push({
        numeroItem: idx + 1,
        ncm,
        descricao,
        categoria: classificacaoIS.categoria,
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
      valorTotal,
      valorIcms: itemIcms,
      valorIpi: itemIpi,
      valorPis: itemPis,
      valorCofins: itemCofins,
      vBCIBS,
      vIBS,
      pIBS,
      vBCCBS,
      vCBS,
      pCBS,
      cClassTrib,
      impostoSeletivo: classificacaoIS.sujeito ? classificacaoIS : undefined,
    })
  })

  // Se o totalizador geral estava zerado mas os itens tinham IBS/CBS destacados, compõe o total
  const valorIbsTotalFinal = vIBSTot > 0 ? vIBSTot : somaItensIbs
  const valorCbsTotalFinal = vCBSTot > 0 ? vCBSTot : somaItensCbs
  const temDestaqueIbsCbs = valorIbsTotalFinal > 0 || valorCbsTotalFinal > 0

  return {
    chaveAcesso,
    numeroNota,
    serie,
    modelo: modelo || '55',
    naturezaOperacao,
    dataEmissao: dataEmissaoRaw,
    cnpjEmitente,
    nomeEmitente,
    cnpjDestinatario,
    nomeDestinatario,
    valorTotalNF,
    valorProdutos,
    valorFrete,
    valorSeguro,
    valorDesconto,
    valorOutros,
    valorIcms,
    valorIpi,
    valorPis,
    valorCofins,
    valorIbsTotal: valorIbsTotalFinal,
    valorCbsTotal: valorCbsTotalFinal,
    temDestaqueIbsCbs,
    totalItensSujeitosIS: itensSujeitosIS.length,
    itensSujeitosIS,
    avisoFaseTesteIbsCbs: temDestaqueIbsCbs ? undefined : AVISO_FASE_TESTE_IBS_CBS,
    qtdItens: itens.length,
    itens,
    nomeArquivo,
  }
}

/**
 * Agrega totais de uma lista de notas fiscais processadas para alimentar o comparativo tributário.
 */
export function agregarCreditosNFe(notas: NFeDadosExtraidos[]): AgregacaoCreditosNFe {
  let somaValorTotal = 0
  let somaPis = 0
  let somaCofins = 0
  let somaIcms = 0
  let somaIpi = 0
  let somaIbs = 0
  let somaCbs = 0
  let notasComIbsCbs = 0
  let notasSemIbsCbs = 0
  let totalItensSujeitosIS = 0

  const datas: string[] = []

  for (const n of notas) {
    somaValorTotal += n.valorTotalNF || 0
    somaPis += n.valorPis || 0
    somaCofins += n.valorCofins || 0
    somaIcms += n.valorIcms || 0
    somaIpi += n.valorIpi || 0
    somaIbs += n.valorIbsTotal || 0
    somaCbs += n.valorCbsTotal || 0
    totalItensSujeitosIS += n.totalItensSujeitosIS || 0

    if (n.temDestaqueIbsCbs) {
      notasComIbsCbs++
    } else {
      notasSemIbsCbs++
    }

    if (n.dataEmissao) {
      datas.push(n.dataEmissao.slice(0, 10))
    }
  }

  datas.sort()
  const periodoInicio = datas.length > 0 ? datas[0] : undefined
  const periodoFim = datas.length > 0 ? datas[datas.length - 1] : undefined

  return {
    totalNotas: notas.length,
    somaValorTotal,
    somaPis,
    somaCofins,
    somaPisCofins: somaPis + somaCofins,
    somaIcms,
    somaIpi,
    somaIbs,
    somaCbs,
    somaIbsCbs: somaIbs + somaCbs,
    notasComIbsCbs,
    notasSemIbsCbs,
    totalItensSujeitosIS,
    periodoInicio,
    periodoFim,
    notasValidas: notas,
  }
}

/**
 * Formata valor em Real (BRL)
 */
export function formatCurrencyBRL(val: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(val)
}
