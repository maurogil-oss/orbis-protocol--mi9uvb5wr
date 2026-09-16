/**
 * Parser client-side para arquivos XML de NF-e (Modelo 55) e NFC-e (Modelo 65).
 * Baseado na especificação técnica SEFAZ do padrão nacional de Documentos Fiscais Eletrônicos (NF-e).
 * Executa inteiramente no navegador via DOMParser, respeitando a privacidade e LGPD.
 */

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

/**
 * Faz o parsing do conteúdo em texto de um arquivo XML de NF-e ou NFC-e.
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

  // Tag <total> -> <ICMSTot>
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

  // Tag <det> (Itens da NF-e)
  const detList = infNFe.querySelectorAll('det')
  const itens: ItemNFeResumo[] = []

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

    // Tributos destacados no item
    const itemIcms = imposto ? parseNumber(getNodeText(imposto, 'vICMS')) : 0
    const itemIpi = imposto ? parseNumber(getNodeText(imposto, 'vIPI')) : 0
    const itemPis = imposto ? parseNumber(getNodeText(imposto, 'vPIS')) : 0
    const itemCofins = imposto ? parseNumber(getNodeText(imposto, 'vCOFINS')) : 0

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
    })
  })

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

  const datas: string[] = []

  for (const n of notas) {
    somaValorTotal += n.valorTotalNF || 0
    somaPis += n.valorPis || 0
    somaCofins += n.valorCofins || 0
    somaIcms += n.valorIcms || 0
    somaIpi += n.valorIpi || 0
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
