/**
 * sandboxSyntheticGenerator.ts
 *
 * Gerador 100% nativo em TypeScript de documentos fiscais sintéticos para o
 * Sandbox de Ingestão (Fase 1) do Orbis Protocol.
 *
 * Sem nenhuma dependência externa (sem chamadas a InfoSimples, SEFAZ, Receita ou sites de terceiros).
 * Totalmente determinístico, seguro e auditável.
 *
 * Características:
 * - CNPJ com algoritmo módulo 11 padrão da Receita Federal do Brasil, com suporte
 *   estendido a caracteres alfanuméricos (A-Z = 10-35) conforme IN RFB 2.229/2024.
 * - Chave de acesso de 44 dígitos (NF-e mod. 55 e CT-e mod. 57) com DV calculado
 *   por módulo 11 com pesos de 2 a 9 (da direita para a esquerda).
 * - Segmentos reais:
 *   1) Combustíveis & Biocombustíveis (Diesel S10 NCM 2710.19.21, Biometanol NCM 2905.11.00, CFOP 5655/6655).
 *   2) Desmanche & Peças Usadas (Padrão Renova Ecopeças / CDV credenciado, NCMs automotivos, chassi, motor, portas).
 *   3) Frete & Transporte Interestadual (CT-e mod. 57, CFOP 6353, RNTRC, volumes, transportadora).
 * - XML sintético completo estruturalmente íntegro com a marca OBRIGATÓRIA em infCpl:
 *   "[DOCUMENTO SINTÉTICO - AMBIENTE DE SANDBOX ORBIS PROTOCOL - NÃO AUTORIZADO PELA SEFAZ - USO EXCLUSIVO DE TESTE E HOMOLOGAÇÃO]"
 */

export const MARCA_SANDBOX_OBRIGATORIA =
  '[DOCUMENTO SINTÉTICO - AMBIENTE DE SANDBOX ORBIS PROTOCOL - NÃO AUTORIZADO PELA SEFAZ - USO EXCLUSIVO DE TESTE E HOMOLOGAÇÃO]'

export type SegmentoSandbox =
  | 'combustiveis'
  | 'desmanche_cdv'
  | 'transporte_cte'
  | 'varejo_reverso'
  | 'construcao_rcd'
  | 'mineracao_urbana_criticos'

export interface ItemDocumentoSintetico {
  nItem: number
  cProd: string
  xProd: string
  ncm: string
  cfop: string
  uCom: string
  qCom: number
  vUnCom: number
  vProd: number
  categoriaMaterial?: 'aco' | 'aluminio' | 'cobre' | 'polimeros' | 'concreto' | 'outros'
  pesoKg?: number
  fatorCo2eKg?: number
  co2eEvitadoKg?: number
  statusCalculo?: 'calculado' | 'em_estruturacao_de_catalogo'
  teorDeclarado?: string
}

export interface DocumentoSintetico {
  id: string
  segmento: SegmentoSandbox
  modeloFiscal: '55' | '57'
  chaveAcesso: string
  numeroDocumento: string
  serie: string
  dataEmissao: string
  cnpjEmitente: string
  razaoSocialEmitente: string
  cnpjDestinatario: string
  razaoSocialDestinatario: string
  valorTotal: number
  itens: ItemDocumentoSintetico[]
  xmlConteudo: string
  hashSha256: string
  dadosAdicionais: {
    marcaInfCpl: string
    chassi?: string
    placa?: string
    rntrc?: string
    combustivelTipo?: string
    volumeLitros?: number
    municipioOrigem?: string
    municipioDestino?: string
  }
}

// ----------------------------------------------------------------------
// 1. GERAÇÃO E VALIDAÇÃO DE CNPJ COM SUPORTE ALFANUMÉRICO (MÓDULO 11)
// ----------------------------------------------------------------------

/**
 * Converte um caractere alfanumérico para seu valor numérico segundo a regra
 * oficial da Receita Federal (0-9 => 0-9; A-Z => 10-35, ASCII - 55).
 */
export function charToValorCnpj(c: string): number {
  const code = c.toUpperCase().charCodeAt(0)
  if (code >= 48 && code <= 57) {
    // '0'-'9'
    return code - 48
  }
  if (code >= 65 && code <= 90) {
    // 'A'-'Z'
    return code - 55
  }
  throw new Error(`Caractere inválido para CNPJ: ${c}`)
}

/**
 * Calcula os dois dígitos verificadores de um CNPJ (com 12 caracteres base).
 * Aceita tanto dígitos numéricos (0-9) quanto letras maiúsculas (A-Z).
 *
 * Módulo 11 oficial:
 * 1º DV: pesos [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
 * 2º DV: pesos [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
 * Resto = soma % 11
 * DV = (resto < 2) ? 0 : 11 - resto
 */
export function calcularDvCnpj(base12: string): { dv1: number; dv2: number; completo: string } {
  const limpo = base12.toUpperCase().replace(/[^0-9A-Z]/g, '')
  if (limpo.length !== 12) {
    throw new Error(`Base de CNPJ deve conter exatamente 12 caracteres, recebido: ${limpo.length}`)
  }

  const pesos1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  let soma1 = 0
  for (let i = 0; i < 12; i++) {
    soma1 += charToValorCnpj(limpo[i]) * pesos1[i]
  }
  const mod1 = soma1 % 11
  const dv1 = mod1 < 2 ? 0 : 11 - mod1

  const pesos2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  let soma2 = 0
  for (let i = 0; i < 12; i++) {
    soma2 += charToValorCnpj(limpo[i]) * pesos2[i]
  }
  soma2 += dv1 * pesos2[12]
  const mod2 = soma2 % 11
  const dv2 = mod2 < 2 ? 0 : 11 - mod2

  return {
    dv1,
    dv2,
    completo: `${limpo}${dv1}${dv2}`,
  }
}

/**
 * Valida um CNPJ (numérico tradicional ou com base alfanumérica).
 */
export function validarCnpjAlfanumerico(cnpjInput: string): boolean {
  if (!cnpjInput) return false
  const limpo = cnpjInput.toUpperCase().replace(/[^0-9A-Z]/g, '')
  if (limpo.length !== 14) return false

  // Se for 100% numérico, rejeita repetições óbvias (ex.: 00000000000000)
  if (/^\d{14}$/.test(limpo)) {
    if (/^(\d)\1{13}$/.test(limpo)) return false
  }

  const base12 = limpo.slice(0, 12)
  const informadoDv1 = parseInt(limpo[12], 10)
  const informadoDv2 = parseInt(limpo[13], 10)
  if (isNaN(informadoDv1) || isNaN(informadoDv2)) return false

  try {
    const { dv1, dv2 } = calcularDvCnpj(base12)
    return dv1 === informadoDv1 && dv2 === informadoDv2
  } catch {
    return false
  }
}

/**
 * Formata um CNPJ de 14 caracteres (XX.XXX.XXX/XXXX-XX).
 */
export function formatarCnpj(cnpj14: string): string {
  const limpo = cnpj14.toUpperCase().replace(/[^0-9A-Z]/g, '')
  if (limpo.length !== 14) return cnpj14
  return `${limpo.slice(0, 2)}.${limpo.slice(2, 5)}.${limpo.slice(5, 8)}/${limpo.slice(8, 12)}-${limpo.slice(12, 14)}`
}

/**
 * Gera um CNPJ matematicamente válido.
 * Permite alternar entre formato numérico padrão e alfanumérico (IN 2.229/2024).
 */
export function gerarCnpjValido(opcoes?: { alfanumerico?: boolean; seed?: number }): string {
  const charsAlfanum = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const seed = opcoes?.seed ?? Math.floor(Math.random() * 1000000)

  let base12 = ''
  if (opcoes?.alfanumerico) {
    // Gera base com letras e números mistos
    // Raiz (8 caracteres com pelo menos 1 letra) + Estabelecimento '0001'
    for (let i = 0; i < 8; i++) {
      const idx = (seed * 17 + i * 31 + 7) % charsAlfanum.length
      base12 += charsAlfanum[idx]
    }
    // Garante ao menos uma letra na raiz
    if (!/[A-Z]/.test(base12)) {
      base12 = base12.slice(0, 7) + 'A'
    }
    base12 += '0001'
  } else {
    // 100% numérico
    for (let i = 0; i < 8; i++) {
      const dig = ((seed * 13 + i * 7 + 3) % 9) + 1
      base12 += dig.toString()
    }
    base12 += '0001'
  }

  const { completo } = calcularDvCnpj(base12)
  return completo
}

// ----------------------------------------------------------------------
// 2. GERAÇÃO DE CHAVE DE ACESSO FISCAL (44 DÍGITOS MOD 11 PESOS 2-9)
// ----------------------------------------------------------------------

/**
 * Calcula o Dígito Verificador de 1 dígito para uma chave de 43 dígitos.
 * Pesos de 2 a 9, da direita para a esquerda.
 * Resto = soma % 11
 * Se resto 0 ou 1 => DV = 0; Se (11 - resto) >= 10 => DV = 0; senão DV = 11 - resto.
 */
export function calcularDvChave44(chave43: string): number {
  const limpa = chave43.replace(/\D/g, '')
  if (limpa.length !== 43) {
    throw new Error(
      `A base da chave de acesso deve ter exatamente 43 dígitos, recebido ${limpa.length}`,
    )
  }

  let soma = 0
  let peso = 2
  for (let i = limpa.length - 1; i >= 0; i--) {
    const digito = parseInt(limpa[i], 10)
    soma += digito * peso
    peso++
    if (peso > 9) peso = 2
  }

  const resto = soma % 11
  let dv = 11 - resto
  if (resto === 0 || resto === 1 || dv >= 10) {
    dv = 0
  }
  return dv
}

/**
 * Gera uma chave de acesso fiscal íntegra de 44 dígitos:
 * cUF (2) + AAMM (4) + CNPJ emitente puramente numérico (14) + mod (2) + serie (3) + nNF (9) + tpEmis (1) + cNF (8) + cDV (1)
 */
export function gerarChaveAcesso44(params: {
  cUF: string // ex: '41' (Paraná), '35' (São Paulo)
  aamm: string // ex: '2604'
  cnpjEmitente: string // 14 dígitos numéricos
  modelo: '55' | '57' // NF-e mod 55 ou CT-e mod 57
  serie: string // 1 a 3 dígitos (preenchido com zeros à esquerda)
  numeroDoc: string // 1 a 9 dígitos (preenchido com zeros à esquerda)
  tpEmis?: string // '1' = Normal
  codigoAleatorio?: string // 8 dígitos cNF
}): string {
  const cUF = params.cUF.padStart(2, '0').slice(0, 2)
  const aamm = params.aamm.padStart(4, '0').slice(0, 4)

  // O CNPJ na chave da SEFAZ é numérico (14 dígitos). Se o CNPJ sintético tiver letras,
  // mapeamos os caracteres para valores numéricos para compor a chave fiscal padrão 44 dígitos.
  let cnpjNum = params.cnpjEmitente.replace(/\D/g, '')
  if (cnpjNum.length !== 14) {
    // Fallback: se tiver letras, converte modulo 10
    const chars = params.cnpjEmitente.replace(/[^0-9A-Z]/gi, '')
    let numStr = ''
    for (let i = 0; i < Math.min(14, chars.length); i++) {
      numStr += (charToValorCnpj(chars[i]) % 10).toString()
    }
    cnpjNum = numStr.padEnd(14, '0')
  }

  const mod = params.modelo
  const serie = params.serie.padStart(3, '0').slice(0, 3)
  const nNF = params.numeroDoc.padStart(9, '0').slice(0, 9)
  const tpEmis = (params.tpEmis || '1').slice(0, 1)
  const cNF = (params.codigoAleatorio || '87654321').padStart(8, '0').slice(0, 8)

  const base43 = `${cUF}${aamm}${cnpjNum}${mod}${serie}${nNF}${tpEmis}${cNF}`
  const cDV = calcularDvChave44(base43)
  return `${base43}${cDV}`
}

// ----------------------------------------------------------------------
// 3. HASH CANÔNICO SHA-256 SÍNCRONO/UNIVERSAL
// ----------------------------------------------------------------------

/**
 * Calcula o hash SHA-256 canônico de forma universal (Node/Vite/Browser).
 */
export async function calcularSha256(texto: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const encoder = new TextEncoder()
    const data = encoder.encode(texto)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    return Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
  }
  // Fallback FNV-1a expandido de 64 caracteres
  let h1 = 0x811c9dc5
  let h2 = 0x9e3779b9
  for (let i = 0; i < texto.length; i++) {
    const ch = texto.charCodeAt(i)
    h1 = Math.imul(h1 ^ ch, 16777619)
    h2 = Math.imul(h2 ^ ch, 2246822519)
  }
  const part1 = (h1 >>> 0).toString(16).padStart(8, '0')
  const part2 = (h2 >>> 0).toString(16).padStart(8, '0')
  return (part1 + part2).repeat(4).slice(0, 64)
}

// ----------------------------------------------------------------------
// 4. GERADORES DE XML SINTÉTICO POR SEGMENTO
// ----------------------------------------------------------------------

/**
 * Constrói o XML sintético da NF-e mod. 55 com estrutura SEFAZ íntegra.
 */
function construirXmlNFe(doc: {
  chaveAcesso: string
  numero: string
  serie: string
  dataEmissao: string
  cnpjEmitente: string
  razaoSocialEmitente: string
  cnpjDestinatario: string
  razaoSocialDestinatario: string
  valorTotal: number
  itens: ItemDocumentoSintetico[]
  infCpl: string
}): string {
  const itensXml = doc.itens
    .map(
      (item) => `      <det nItem="${item.nItem}">
        <prod>
          <cProd>${item.cProd}</cProd>
          <xProd>${item.xProd}</xProd>
          <NCM>${item.ncm}</NCM>
          <CFOP>${item.cfop}</CFOP>
          <uCom>${item.uCom}</uCom>
          <qCom>${item.qCom.toFixed(2)}</qCom>
          <vUnCom>${item.vUnCom.toFixed(4)}</vUnCom>
          <vProd>${item.vProd.toFixed(2)}</vProd>
        </prod>
        <imposto>
          <ICMS>
            <ICMS00>
              <orig>0</orig>
              <CST>00</CST>
              <modBC>3</modBC>
              <vBC>${item.vProd.toFixed(2)}</vBC>
              <pICMS>18.00</pICMS>
              <vICMS>${(item.vProd * 0.18).toFixed(2)}</vICMS>
            </ICMS00>
          </ICMS>
        </imposto>
      </det>`,
    )
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<nfeProc xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">
  <NFe>
    <infNFe Id="NFe${doc.chaveAcesso}" versao="4.00">
      <ide>
        <cUF>41</cUF>
        <cNF>${doc.chaveAcesso.slice(35, 43)}</cNF>
        <natOp>VENDA DE MERCADORIA / OPERACAO HOMOLOGACAO</natOp>
        <mod>55</mod>
        <serie>${parseInt(doc.serie, 10)}</serie>
        <nNF>${parseInt(doc.numero, 10)}</nNF>
        <dhEmi>${doc.dataEmissao}T10:00:00-03:00</dhEmi>
        <tpNF>1</tpNF>
        <idDest>1</idDest>
        <cMunFG>4106902</cMunFG>
        <tpImp>1</tpImp>
        <tpEmis>1</tpEmis>
        <cDV>${doc.chaveAcesso.slice(43, 44)}</cDV>
        <tpAmb>2</tpAmb>
        <finNFe>1</finNFe>
        <indFinal>1</indFinal>
        <indPres>1</indPres>
        <procEmi>0</procEmi>
        <verProc>OrbisProtocol_Sandbox_1.0</verProc>
      </ide>
      <emit>
        <CNPJ>${doc.cnpjEmitente.replace(/\D/g, '')}</CNPJ>
        <xNome>${doc.razaoSocialEmitente}</xNome>
        <enderEmit>
          <xLgr>Avenida das Indústrias Sustentáveis</xLgr>
          <nro>1000</nro>
          <xBairro>Distrito Industrial</xBairro>
          <cMun>4106902</cMun>
          <xMun>Curitiba</xMun>
          <UF>PR</UF>
          <CEP>80000000</CEP>
          <cPais>1058</cPais>
          <xPais>Brasil</xPais>
        </enderEmit>
        <IE>9012345678</IE>
        <CRT>3</CRT>
      </emit>
      <dest>
        <CNPJ>${doc.cnpjDestinatario.replace(/\D/g, '')}</CNPJ>
        <xNome>${doc.razaoSocialDestinatario}</xNome>
        <enderDest>
          <xLgr>Rodovia da Integração</xLgr>
          <nro>500</nro>
          <xBairro>Parque Logístico</xBairro>
          <cMun>4106902</cMun>
          <xMun>Curitiba</xMun>
          <UF>PR</UF>
          <CEP>81000000</CEP>
          <cPais>1058</cPais>
          <xPais>Brasil</xPais>
        </enderDest>
        <indIEDest>1</indIEDest>
        <IE>9087654321</IE>
      </dest>
${itensXml}
      <total>
        <ICMSTot>
          <vBC>${doc.valorTotal.toFixed(2)}</vBC>
          <vICMS>${(doc.valorTotal * 0.18).toFixed(2)}</vICMS>
          <vProd>${doc.valorTotal.toFixed(2)}</vProd>
          <vNF>${doc.valorTotal.toFixed(2)}</vNF>
        </ICMSTot>
      </total>
      <infAdic>
        <infCpl>${doc.infCpl}</infCpl>
      </infAdic>
    </infNFe>
  </NFe>
</nfeProc>`
}

/**
 * Constrói o XML sintético do CT-e mod. 57 com estrutura SEFAZ íntegra.
 */
function construirXmlCTe(doc: {
  chaveAcesso: string
  numero: string
  serie: string
  dataEmissao: string
  cnpjEmitente: string
  razaoSocialEmitente: string
  cnpjDestinatario: string
  razaoSocialDestinatario: string
  valorTotal: number
  rntrc: string
  cfop: string
  infCpl: string
}): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<cteProc xmlns="http://www.portalfiscal.inf.br/cte" versao="3.00">
  <CTe>
    <infCte Id="CTe${doc.chaveAcesso}" versao="3.00">
      <ide>
        <cUF>41</cUF>
        <cCT>${doc.chaveAcesso.slice(35, 43)}</cCT>
        <CFOP>${doc.cfop}</CFOP>
        <natOp>PRESTACAO DE SERVICO DE TRANSPORTE DE CARGA</natOp>
        <mod>57</mod>
        <serie>${parseInt(doc.serie, 10)}</serie>
        <nCT>${parseInt(doc.numero, 10)}</nCT>
        <dhEmi>${doc.dataEmissao}T11:00:00-03:00</dhEmi>
        <tpImp>1</tpImp>
        <tpEmis>1</tpEmis>
        <cDV>${doc.chaveAcesso.slice(43, 44)}</cDV>
        <tpAmb>2</tpAmb>
        <tpCTe>0</tpCTe>
        <procEmi>0</procEmi>
        <verProc>OrbisProtocol_Sandbox_1.0</verProc>
      </ide>
      <emit>
        <CNPJ>${doc.cnpjEmitente.replace(/\D/g, '')}</CNPJ>
        <xNome>${doc.razaoSocialEmitente}</xNome>
        <RNTRC>${doc.rntrc}</RNTRC>
        <enderEmit>
          <xLgr>Rodovia BR-116</xLgr>
          <nro>4200</nro>
          <xBairro>Tatuquara</xBairro>
          <cMun>4106902</cMun>
          <xMun>Curitiba</xMun>
          <UF>PR</UF>
        </enderEmit>
      </emit>
      <dest>
        <CNPJ>${doc.cnpjDestinatario.replace(/\D/g, '')}</CNPJ>
        <xNome>${doc.razaoSocialDestinatario}</xNome>
        <enderDest>
          <xLgr>Via Anchieta</xLgr>
          <nro>800</nro>
          <xBairro>Sacomã</xBairro>
          <cMun>3550308</cMun>
          <xMun>São Paulo</xMun>
          <UF>SP</UF>
        </enderDest>
      </dest>
      <vPrest>
        <vTPrest>${doc.valorTotal.toFixed(2)}</vTPrest>
        <vRec>${doc.valorTotal.toFixed(2)}</vRec>
      </vPrest>
      <imp>
        <ICMS>
          <ICMS00>
            <CST>00</CST>
            <vBC>${doc.valorTotal.toFixed(2)}</vBC>
            <pICMS>12.00</pICMS>
            <vICMS>${(doc.valorTotal * 0.12).toFixed(2)}</vICMS>
          </ICMS00>
        </ICMS>
      </imp>
      <compl>
        <xObs>${doc.infCpl}</xObs>
      </compl>
    </infCte>
  </CTe>
</cteProc>`
}

// ----------------------------------------------------------------------
// 5. GERADOR PRINCIPAL DE LOTE SINTÉTICO POR SEGMENTO
// ----------------------------------------------------------------------

export async function gerarDocumentoSintetico(params: {
  segmento: SegmentoSandbox
  indice: number
  dataReferencia?: string
  usarCnpjAlfanumerico?: boolean
}): Promise<DocumentoSintetico> {
  const idx = params.indice
  const dataHoje = params.dataReferencia || new Date().toISOString().slice(0, 10)
  const aamm = `${dataHoje.slice(2, 4)}${dataHoje.slice(5, 7)}`

  if (params.segmento === 'combustiveis') {
    // NF-e mod 55 de combustíveis: Diesel S10 NCM 2710.19.21 ou biometanol NCM 2905.11.00, CFOP 5655 / 6655
    const isBiometanol = idx % 2 === 1
    const ncm = isBiometanol ? '2905.11.00' : '2710.19.21'
    const xProd = isBiometanol
      ? 'BIOMETANOL RENOVÁVEL INDUSTRIAL - CARBURANTE NEUTRO'
      : 'OLEO DIESEL B S10 COMUM GRANEL - BAIXO TEOR DE ENXOFRE'
    const cfop = isBiometanol ? '6655' : '5655'
    const cProd = isBiometanol ? 'BIO-MET-01' : 'DSL-S10-02'
    const litros = 10000 + ((idx * 2500) % 20000)
    const precoLitro = isBiometanol ? 4.85 : 5.92
    const valorTotal = Math.round(litros * precoLitro * 100) / 100

    const cnpjEmit = gerarCnpjValido({
      alfanumerico: params.usarCnpjAlfanumerico && idx % 3 === 0,
      seed: 1000 + idx * 7,
    })
    const cnpjDest = gerarCnpjValido({
      alfanumerico: false,
      seed: 2000 + idx * 11,
    })

    const nNF = (100000 + idx).toString()
    const serie = '1'
    const chave = gerarChaveAcesso44({
      cUF: '41',
      aamm,
      cnpjEmitente: cnpjEmit,
      modelo: '55',
      serie,
      numeroDoc: nNF,
      codigoAleatorio: `${87000000 + idx}`.slice(0, 8),
    })

    const infCpl = `${MARCA_SANDBOX_OBRIGATORIA} - Carga granel autorizada sob regime especial. CFOP ${cfop}. NCM ${ncm}. Volume: ${litros} L.`

    const itens: ItemDocumentoSintetico[] = [
      {
        nItem: 1,
        cProd,
        xProd,
        ncm,
        cfop,
        uCom: 'L',
        qCom: litros,
        vUnCom: precoLitro,
        vProd: valorTotal,
        categoriaMaterial: 'outros',
        pesoKg: Math.round(litros * 0.84),
        fatorCo2eKg: isBiometanol ? 0.45 : 3.12,
      },
    ]

    const xml = construirXmlNFe({
      chaveAcesso: chave,
      numero: nNF,
      serie,
      dataEmissao: dataHoje,
      cnpjEmitente: cnpjEmit,
      razaoSocialEmitente: isBiometanol
        ? 'Refinaria Verde & Biocombustíveis do Sul S.A. (Sandbox)'
        : 'Petrobras Distribuidora de Combustíveis Integrada Ltda (Sandbox)',
      cnpjDestinatario: cnpjDest,
      razaoSocialDestinatario: 'Rede PetroLeste Abastecimento e Transportes S.A.',
      valorTotal,
      itens,
      infCpl,
    })

    const hash = await calcularSha256(xml)

    return {
      id: `SYN-COMB-${idx + 1}-${chave.slice(-6)}`,
      segmento: 'combustiveis',
      modeloFiscal: '55',
      chaveAcesso: chave,
      numeroDocumento: nNF,
      serie,
      dataEmissao: dataHoje,
      cnpjEmitente: cnpjEmit,
      razaoSocialEmitente: isBiometanol
        ? 'Refinaria Verde & Biocombustíveis do Sul S.A.'
        : 'Petrobras Distribuidora de Combustíveis Integrada Ltda',
      cnpjDestinatario: cnpjDest,
      razaoSocialDestinatario: 'Rede PetroLeste Abastecimento e Transportes S.A.',
      valorTotal,
      itens,
      xmlConteudo: xml,
      hashSha256: hash,
      dadosAdicionais: {
        marcaInfCpl: MARCA_SANDBOX_OBRIGATORIA,
        combustivelTipo: isBiometanol ? 'biometanol' : 'diesel_s10',
        volumeLitros: litros,
      },
    }
  }

  if (params.segmento === 'desmanche_cdv') {
    // NF-e mod 55 de peças usadas de desmontagem (padrão Renova Ecopeças / CDVerde credenciado)
    // NCMs automotivos 8708.29.99, 8708.70.90, 8407.34.90; com registro de chassi
    const chassiFinal = (1000 + idx).toString().slice(-4)
    const chassi = `93YBB05U0GJ${chassiFinal}`
    const placa = `ORB-${(2000 + idx).toString().slice(-4)}`

    const cnpjEmit = gerarCnpjValido({
      alfanumerico: params.usarCnpjAlfanumerico && idx % 2 === 0,
      seed: 3000 + idx * 13,
    })
    const cnpjDest = gerarCnpjValido({
      alfanumerico: false,
      seed: 4000 + idx * 19,
    })

    const nNF = (200000 + idx).toString()
    const serie = '2'
    const chave = gerarChaveAcesso44({
      cUF: '41',
      aamm,
      cnpjEmitente: cnpjEmit,
      modelo: '55',
      serie,
      numeroDoc: nNF,
      codigoAleatorio: `${76000000 + idx}`.slice(0, 8),
    })

    const itens: ItemDocumentoSintetico[] = [
      {
        nItem: 1,
        cProd: `ECO-PORTA-LD-${idx + 1}`,
        xProd: `PORTA DIANTEIRA DIREITA REUTILIZAVEL COM VIDRO (CHASSI ${chassi})`,
        ncm: '8708.29.99',
        cfop: '5102',
        uCom: 'UN',
        qCom: 1,
        vUnCom: 680.0,
        vProd: 680.0,
        categoriaMaterial: 'aco',
        pesoKg: 18.5,
        fatorCo2eKg: 2.18,
      },
      {
        nItem: 2,
        cProd: `ECO-RODA-ALU-${idx + 1}`,
        xProd: `RODA DE LIGA LEVE ARO 15 ORIGINAL REVISADA (CHASSI ${chassi})`,
        ncm: '8708.70.90',
        cfop: '5102',
        uCom: 'UN',
        qCom: 1,
        vUnCom: 350.0,
        vProd: 350.0,
        categoriaMaterial: 'aluminio',
        pesoKg: 8.2,
        fatorCo2eKg: 14.4,
      },
      {
        nItem: 3,
        cProd: `ECO-MTR-ARR-${idx + 1}`,
        xProd: `MOTOR DE ARRANQUE / PARTIDA 12V TESTADO (CHASSI ${chassi})`,
        ncm: '8511.40.00',
        cfop: '5102',
        uCom: 'UN',
        qCom: 1,
        vUnCom: 290.0,
        vProd: 290.0,
        categoriaMaterial: 'cobre',
        pesoKg: 3.8,
        fatorCo2eKg: 3.8,
      },
    ]

    const valorTotal = itens.reduce((acc, it) => acc + it.vProd, 0)
    const infCpl = `${MARCA_SANDBOX_OBRIGATORIA} - Peças de desmontagem técnica credenciada DETRAN/PR. Chassi rastreado: ${chassi}. Baixa DETRAN homologada.`

    const xml = construirXmlNFe({
      chaveAcesso: chave,
      numero: nNF,
      serie,
      dataEmissao: dataHoje,
      cnpjEmitente: cnpjEmit,
      razaoSocialEmitente: 'Renova Ecopeças & Desmontagem Veicular Integrada S.A. (Sandbox)',
      cnpjDestinatario: cnpjDest,
      razaoSocialDestinatario: 'Oficina & Reparadora Automotiva Central Curitibana Ltda',
      valorTotal,
      itens,
      infCpl,
    })

    const hash = await calcularSha256(xml)

    return {
      id: `SYN-CDV-${idx + 1}-${chave.slice(-6)}`,
      segmento: 'desmanche_cdv',
      modeloFiscal: '55',
      chaveAcesso: chave,
      numeroDocumento: nNF,
      serie,
      dataEmissao: dataHoje,
      cnpjEmitente: cnpjEmit,
      razaoSocialEmitente: 'Renova Ecopeças & Desmontagem Veicular Integrada S.A.',
      cnpjDestinatario: cnpjDest,
      razaoSocialDestinatario: 'Oficina & Reparadora Automotiva Central Curitibana Ltda',
      valorTotal,
      itens,
      xmlConteudo: xml,
      hashSha256: hash,
      dadosAdicionais: {
        marcaInfCpl: MARCA_SANDBOX_OBRIGATORIA,
        chassi,
        placa,
      },
    }
  }

  if (params.segmento === 'transporte_cte') {
    // CT-e mod 57 de frete interestadual: CFOP 6353, RNTRC, volumes de carga
    const cnpjEmit = gerarCnpjValido({
      alfanumerico: params.usarCnpjAlfanumerico && idx % 2 === 1,
      seed: 5000 + idx * 17,
    })
    const cnpjDest = gerarCnpjValido({
      alfanumerico: false,
      seed: 6000 + idx * 23,
    })

    const nCT = (300000 + idx).toString()
    const serie = '1'
    const chave = gerarChaveAcesso44({
      cUF: '41',
      aamm,
      cnpjEmitente: cnpjEmit,
      modelo: '57',
      serie,
      numeroDoc: nCT,
      codigoAleatorio: `${65000000 + idx}`.slice(0, 8),
    })

    const rntrc = (80000000 + idx).toString()
    const cfop = '6353'
    const valorFrete = Math.round((2800 + ((idx * 340) % 4500)) * 100) / 100
    const infCpl = `${MARCA_SANDBOX_OBRIGATORIA} - Transporte interestadual PR -> SP. RNTRC ${rntrc}. CFOP ${cfop}. Rastreabilidade de frete rodoviário de cargas.`

    const xml = construirXmlCTe({
      chaveAcesso: chave,
      numero: nCT,
      serie,
      dataEmissao: dataHoje,
      cnpjEmitente: cnpjEmit,
      razaoSocialEmitente: 'Expresso RodoLog Logística e Transportes Interestaduais S.A. (Sandbox)',
      cnpjDestinatario: cnpjDest,
      razaoSocialDestinatario: 'Centro de Distribuição Bandeirantes Logística Ltda',
      valorTotal: valorFrete,
      rntrc,
      cfop,
      infCpl,
    })

    const hash = await calcularSha256(xml)

    const itens: ItemDocumentoSintetico[] = [
      {
        nItem: 1,
        cProd: 'SRV-FRETE-ROD',
        xProd: 'PRESTACAO DE SERVICO DE TRANSPORTE RODOVIARIO DE CARGAS (PR-SP)',
        ncm: '0000.00.00',
        cfop,
        uCom: 'UN',
        qCom: 1,
        vUnCom: valorFrete,
        vProd: valorFrete,
        categoriaMaterial: 'outros',
        pesoKg: 12500,
      },
    ]

    return {
      id: `SYN-CTE-${idx + 1}-${chave.slice(-6)}`,
      segmento: 'transporte_cte',
      modeloFiscal: '57',
      chaveAcesso: chave,
      numeroDocumento: nCT,
      serie,
      dataEmissao: dataHoje,
      cnpjEmitente: cnpjEmit,
      razaoSocialEmitente: 'Expresso RodoLog Logística e Transportes Interestaduais S.A.',
      cnpjDestinatario: cnpjDest,
      razaoSocialDestinatario: 'Centro de Distribuição Bandeirantes Logística Ltda',
      valorTotal: valorFrete,
      itens,
      xmlConteudo: xml,
      hashSha256: hash,
      dadosAdicionais: {
        marcaInfCpl: MARCA_SANDBOX_OBRIGATORIA,
        rntrc,
        municipioOrigem: 'Curitiba/PR',
        municipioDestino: 'São Paulo/SP',
      },
    }
  }

  // ----------------------------------------------------------------------
  // a. COMÉRCIO & VAREJO (varejo_reverso)
  // CFOPs 5.949 / 6.949 / 1.949
  // NCMs: 8504.40.10 (fontes/carregadores), 8471.60.52 (periféricos), 8517.62.77 (roteadores)
  // Materiais das peças restritos aos catalogados: aço, alumínio, cobre, polímeros
  // ----------------------------------------------------------------------
  if (params.segmento === 'varejo_reverso') {
    const cnpjEmit = gerarCnpjValido({
      alfanumerico: params.usarCnpjAlfanumerico && idx % 2 === 0,
      seed: 7000 + idx * 19,
    })
    const cnpjDest = gerarCnpjValido({
      alfanumerico: false,
      seed: 7500 + idx * 29,
    })

    const nNF = (400000 + idx).toString()
    const serie = '1'
    const chave = gerarChaveAcesso44({
      cUF: '41',
      aamm,
      cnpjEmitente: cnpjEmit,
      modelo: '55',
      serie,
      numeroDoc: nNF,
      codigoAleatorio: `${54000000 + idx}`.slice(0, 8),
    })

    const cfop = idx % 3 === 0 ? '5949' : idx % 3 === 1 ? '6949' : '1949'

    const itens: ItemDocumentoSintetico[] = [
      {
        nItem: 1,
        cProd: `RET-FONTE-AC-${idx + 1}`,
        xProd: 'FONTE CARREGADORA CHAVEADA REVERSA 65W (POLIMERO/COBRE)',
        ncm: '8504.40.10',
        cfop,
        uCom: 'UN',
        qCom: 10 + (idx % 5),
        vUnCom: 28.5,
        vProd: Math.round((10 + (idx % 5)) * 28.5 * 100) / 100,
        categoriaMaterial: 'polimeros',
        pesoKg: Math.round((10 + (idx % 5)) * 0.28 * 100) / 100,
        fatorCo2eKg: 1.9,
        co2eEvitadoKg: Math.round((10 + (idx % 5)) * 0.28 * 1.9 * 100) / 100,
        statusCalculo: 'calculado',
      },
      {
        nItem: 2,
        cProd: `RET-PERIF-TECL-${idx + 1}`,
        xProd: 'TECLADO E PERIFERICO DESUSO CHASSI METALICO (ACO/POLIMERO)',
        ncm: '8471.60.52',
        cfop,
        uCom: 'UN',
        qCom: 6 + (idx % 4),
        vUnCom: 35.0,
        vProd: Math.round((6 + (idx % 4)) * 35.0 * 100) / 100,
        categoriaMaterial: 'aco',
        pesoKg: Math.round((6 + (idx % 4)) * 0.75 * 100) / 100,
        fatorCo2eKg: 2.18,
        co2eEvitadoKg: Math.round((6 + (idx % 4)) * 0.75 * 2.18 * 100) / 100,
        statusCalculo: 'calculado',
      },
      {
        nItem: 3,
        cProd: `RET-ROUT-WIFI-${idx + 1}`,
        xProd: 'ROTEADOR GIGA BLINDAGEM ALUMINIO DISSIPADOR (ALUMINIO/COBRE)',
        ncm: '8517.62.77',
        cfop,
        uCom: 'UN',
        qCom: 4 + (idx % 3),
        vUnCom: 95.0,
        vProd: Math.round((4 + (idx % 3)) * 95.0 * 100) / 100,
        categoriaMaterial: 'aluminio',
        pesoKg: Math.round((4 + (idx % 3)) * 0.45 * 100) / 100,
        fatorCo2eKg: 14.4,
        co2eEvitadoKg: Math.round((4 + (idx % 3)) * 0.45 * 14.4 * 100) / 100,
        statusCalculo: 'calculado',
      },
      {
        nItem: 4,
        cProd: `RET-CABOS-COBRE-${idx + 1}`,
        xProd: 'LOTE DE CABOS DE ENERGIA E CHICOTES DE COBRE REVERSO',
        ncm: '8504.40.10',
        cfop,
        uCom: 'KG',
        qCom: 8.5 + (idx % 4),
        vUnCom: 32.0,
        vProd: Math.round((8.5 + (idx % 4)) * 32.0 * 100) / 100,
        categoriaMaterial: 'cobre',
        pesoKg: Math.round((8.5 + (idx % 4)) * 100) / 100,
        fatorCo2eKg: 5.4,
        co2eEvitadoKg: Math.round((8.5 + (idx % 4)) * 5.4 * 100) / 100,
        statusCalculo: 'calculado',
      },
    ]

    const valorTotal = Math.round(itens.reduce((acc, it) => acc + it.vProd, 0) * 100) / 100
    const infCpl = `${MARCA_SANDBOX_OBRIGATORIA} - Remessa para logística reversa de eletroeletrônicos e embalagens no varejo físico. CFOP ${cfop}. PNRS Lei 12.305/2010.`

    const xml = construirXmlNFe({
      chaveAcesso: chave,
      numero: nNF,
      serie,
      dataEmissao: dataHoje,
      cnpjEmitente: cnpjEmit,
      razaoSocialEmitente: 'Varejo Sustentável & Eletro Reversa Brasil S.A. (Sandbox)',
      cnpjDestinatario: cnpjDest,
      razaoSocialDestinatario: 'Centro de Triagem e Descaracterização Reversa Ltda',
      valorTotal,
      itens,
      infCpl,
    })

    const hash = await calcularSha256(xml)

    return {
      id: `SYN-VAR-${idx + 1}-${chave.slice(-6)}`,
      segmento: 'varejo_reverso',
      modeloFiscal: '55',
      chaveAcesso: chave,
      numeroDocumento: nNF,
      serie,
      dataEmissao: dataHoje,
      cnpjEmitente: cnpjEmit,
      razaoSocialEmitente: 'Varejo Sustentável & Eletro Reversa Brasil S.A.',
      cnpjDestinatario: cnpjDest,
      razaoSocialDestinatario: 'Centro de Triagem e Descaracterização Reversa Ltda',
      valorTotal,
      itens,
      xmlConteudo: xml,
      hashSha256: hash,
      dadosAdicionais: {
        marcaInfCpl: MARCA_SANDBOX_OBRIGATORIA,
      },
    }
  }

  // ----------------------------------------------------------------------
  // b. IMOBILIÁRIO & CONSTRUÇÃO CIVIL (construcao_rcd)
  // RCD, agregados reciclados de concreto. CFOPs 5.102 / 5.949
  // NCMs: 6810.11.00 (blocos concreto), 2517.10.00 (agregados/brita), 7214.20.00 (armaduras aço)
  // Materiais: concreto 0,12 e aço 2,18
  // ----------------------------------------------------------------------
  if (params.segmento === 'construcao_rcd') {
    const cnpjEmit = gerarCnpjValido({
      alfanumerico: params.usarCnpjAlfanumerico && idx % 2 === 1,
      seed: 8000 + idx * 23,
    })
    const cnpjDest = gerarCnpjValido({
      alfanumerico: false,
      seed: 8500 + idx * 37,
    })

    const nNF = (500000 + idx).toString()
    const serie = '1'
    const chave = gerarChaveAcesso44({
      cUF: '41',
      aamm,
      cnpjEmitente: cnpjEmit,
      modelo: '55',
      serie,
      numeroDoc: nNF,
      codigoAleatorio: `${43000000 + idx}`.slice(0, 8),
    })

    const cfop = idx % 2 === 0 ? '5102' : '5949'

    const itens: ItemDocumentoSintetico[] = [
      {
        nItem: 1,
        cProd: `RCD-AGREG-BRITA-${idx + 1}`,
        xProd: 'AGREGADO RECICLADO DE CONCRETO (BRITA RCD GRADUADA)',
        ncm: '2517.10.00',
        cfop,
        uCom: 'TON',
        qCom: 12 + (idx % 8),
        vUnCom: 48.0,
        vProd: Math.round((12 + (idx % 8)) * 48.0 * 100) / 100,
        categoriaMaterial: 'concreto',
        pesoKg: (12 + (idx % 8)) * 1000,
        fatorCo2eKg: 0.12,
        co2eEvitadoKg: Math.round((12 + (idx % 8)) * 1000 * 0.12 * 100) / 100,
        statusCalculo: 'calculado',
      },
      {
        nItem: 2,
        cProd: `RCD-BLOCO-CONC-${idx + 1}`,
        xProd: 'BLOCO DE CONCRETO RECICLADO ESTRUTURAL 14X19X39',
        ncm: '6810.11.00',
        cfop,
        uCom: 'MIL',
        qCom: 2 + (idx % 3),
        vUnCom: 2850.0,
        vProd: Math.round((2 + (idx % 3)) * 2850.0 * 100) / 100,
        categoriaMaterial: 'concreto',
        pesoKg: (2 + (idx % 3)) * 12000,
        fatorCo2eKg: 0.12,
        co2eEvitadoKg: Math.round((2 + (idx % 3)) * 12000 * 0.12 * 100) / 100,
        statusCalculo: 'calculado',
      },
      {
        nItem: 3,
        cProd: `RCD-ACO-ARMAD-${idx + 1}`,
        xProd: 'ACO CA-50 RECUPERADO DE DEMOLICAO CONTROLADA',
        ncm: '7214.20.00',
        cfop,
        uCom: 'KG',
        qCom: 2500 + (idx % 5) * 500,
        vUnCom: 4.1,
        vProd: Math.round((2500 + (idx % 5) * 500) * 4.1 * 100) / 100,
        categoriaMaterial: 'aco',
        pesoKg: 2500 + (idx % 5) * 500,
        fatorCo2eKg: 2.18,
        co2eEvitadoKg: Math.round((2500 + (idx % 5) * 500) * 2.18 * 100) / 100,
        statusCalculo: 'calculado',
      },
    ]

    const valorTotal = Math.round(itens.reduce((acc, it) => acc + it.vProd, 0) * 100) / 100
    const infCpl = `${MARCA_SANDBOX_OBRIGATORIA} - Agregados e materiais reciclados de construção civil (RCD). CONAMA 307/2002. CFOP ${cfop}.`

    const xml = construirXmlNFe({
      chaveAcesso: chave,
      numero: nNF,
      serie,
      dataEmissao: dataHoje,
      cnpjEmitente: cnpjEmit,
      razaoSocialEmitente: 'EcoBrita & Reciclagem de RCD Construção Civil S.A. (Sandbox)',
      cnpjDestinatario: cnpjDest,
      razaoSocialDestinatario: 'Construtora Metropolitana Obras Sustentáveis Ltda',
      valorTotal,
      itens,
      infCpl,
    })

    const hash = await calcularSha256(xml)

    return {
      id: `SYN-RCD-${idx + 1}-${chave.slice(-6)}`,
      segmento: 'construcao_rcd',
      modeloFiscal: '55',
      chaveAcesso: chave,
      numeroDocumento: nNF,
      serie,
      dataEmissao: dataHoje,
      cnpjEmitente: cnpjEmit,
      razaoSocialEmitente: 'EcoBrita & Reciclagem de RCD Construção Civil S.A.',
      cnpjDestinatario: cnpjDest,
      razaoSocialDestinatario: 'Construtora Metropolitana Obras Sustentáveis Ltda',
      valorTotal,
      itens,
      xmlConteudo: xml,
      hashSha256: hash,
      dadosAdicionais: {
        marcaInfCpl: MARCA_SANDBOX_OBRIGATORIA,
      },
    }
  }

  // ----------------------------------------------------------------------
  // c. MINERAÇÃO URBANA & MATERIAIS CRÍTICOS (mineracao_urbana_criticos)
  // Sucata eletrônica, placas de circuito impresso (NCM 8534.00.00), resíduos (NCM 8548.00.00)
  // CFOP 5.949 / 6.949
  // REGRA CRÍTICA DO USUÁRIO:
  // APENAS COBRE entra no cálculo de carbono (fator 5,40).
  // Ouro, paládio, prata e terras raras (neodímio) são 100% rastreáveis (identificador de lote,
  // teor declarado em ppm/g/t, hash SHA-256, DPP) mas seus campos fator_co2e_kg/co2e_evitado_kg
  // recebem status "em estruturação de catálogo" — valor nulo/zero com indicação pericial explícita,
  // NENHUM fator inventado, NENHUMA alegação de crédito de carbono sobre esses materiais.
  // ----------------------------------------------------------------------
  // params.segmento === 'mineracao_urbana_criticos'
  const cnpjEmit = gerarCnpjValido({
    alfanumerico: params.usarCnpjAlfanumerico && idx % 2 === 0,
    seed: 9000 + idx * 31,
  })
  const cnpjDest = gerarCnpjValido({
    alfanumerico: false,
    seed: 9500 + idx * 41,
  })

  const nNF = (600000 + idx).toString()
  const serie = '1'
  const chave = gerarChaveAcesso44({
    cUF: '41',
    aamm,
    cnpjEmitente: cnpjEmit,
    modelo: '55',
    serie,
    numeroDoc: nNF,
    codigoAleatorio: `${32000000 + idx}`.slice(0, 8),
  })

  const cfop = idx % 2 === 0 ? '5949' : '6949'

  const itens: ItemDocumentoSintetico[] = [
    {
      nItem: 1,
      cProd: `URB-PCI-COBRE-${idx + 1}`,
      xProd: 'SUCATA DE PLACAS PCI RECUPERADA - FRACAO COBRE ELETROLITICO',
      ncm: '8534.00.00',
      cfop,
      uCom: 'KG',
      qCom: 350 + (idx % 10) * 20,
      vUnCom: 48.0,
      vProd: Math.round((350 + (idx % 10) * 20) * 48.0 * 100) / 100,
      categoriaMaterial: 'cobre',
      pesoKg: 350 + (idx % 10) * 20,
      fatorCo2eKg: 5.4,
      co2eEvitadoKg: Math.round((350 + (idx % 10) * 20) * 5.4 * 100) / 100,
      statusCalculo: 'calculado',
      teorDeclarado: 'Cobre 99,9% refinado secundário',
    },
    {
      nItem: 2,
      cProd: `URB-PCI-OURO-AU-${idx + 1}`,
      xProd: 'FRACAO CONCENTRADA DE OURO (AU) DE CONTATOS PCI [EM ESTRUTURACAO DE CATALOGO]',
      ncm: '8534.00.00',
      cfop,
      uCom: 'G',
      qCom: 125 + (idx % 5) * 15,
      vUnCom: 395.0,
      vProd: Math.round((125 + (idx % 5) * 15) * 395.0 * 100) / 100,
      categoriaMaterial: 'outros',
      pesoKg: Math.round(((125 + (idx % 5) * 15) / 1000) * 1000) / 1000,
      fatorCo2eKg: 0,
      co2eEvitadoKg: 0,
      statusCalculo: 'em_estruturacao_de_catalogo',
      teorDeclarado: 'Teor declarado: 280 ppm (g/t) • Sem alegação de carbono',
    },
    {
      nItem: 3,
      cProd: `URB-PCI-PALADIO-PD-${idx + 1}`,
      xProd: 'FRACAO CONCENTRADA PALADIO (PD) E PRATA (AG) [EM ESTRUTURACAO DE CATALOGO]',
      ncm: '8548.00.00',
      cfop,
      uCom: 'G',
      qCom: 85 + (idx % 4) * 10,
      vUnCom: 210.0,
      vProd: Math.round((85 + (idx % 4) * 10) * 210.0 * 100) / 100,
      categoriaMaterial: 'outros',
      pesoKg: Math.round(((85 + (idx % 4) * 10) / 1000) * 1000) / 1000,
      fatorCo2eKg: 0,
      co2eEvitadoKg: 0,
      statusCalculo: 'em_estruturacao_de_catalogo',
      teorDeclarado: 'Teor declarado: 95 ppm (g/t) • Sem alegação de carbono',
    },
    {
      nItem: 4,
      cProd: `URB-TERRAS-RARAS-ND-${idx + 1}`,
      xProd: 'IMAS DE NEODIMIO NDFEB RECUPERADOS (TERRAS RARAS) [EM ESTRUTURACAO DE CATALOGO]',
      ncm: '8548.00.00',
      cfop,
      uCom: 'KG',
      qCom: 45 + (idx % 6) * 5,
      vUnCom: 180.0,
      vProd: Math.round((45 + (idx % 6) * 5) * 180.0 * 100) / 100,
      categoriaMaterial: 'outros',
      pesoKg: 45 + (idx % 6) * 5,
      fatorCo2eKg: 0,
      co2eEvitadoKg: 0,
      statusCalculo: 'em_estruturacao_de_catalogo',
      teorDeclarado: 'Teor declarado: 31,5% NdFeB • Sem alegação de carbono',
    },
  ]

  const valorTotal = Math.round(itens.reduce((acc, it) => acc + it.vProd, 0) * 100) / 100
  const infCpl = `${MARCA_SANDBOX_OBRIGATORIA} - Mineração urbana e materiais críticos recuperados. CFOP ${cfop}. Apenas cobre entra no cálculo de carbono (fator 5,40). Ouro, paládio, prata e terras raras são 100% rastreáveis com status pericial 'em estruturação de catálogo' e zero crédito de carbono.`

  const xml = construirXmlNFe({
    chaveAcesso: chave,
    numero: nNF,
    serie,
    dataEmissao: dataHoje,
    cnpjEmitente: cnpjEmit,
    razaoSocialEmitente: 'Urban Mining & Materiais Críticos do Brasil S.A. (Sandbox)',
    cnpjDestinatario: cnpjDest,
    razaoSocialDestinatario: 'Refinaria Metalúrgica de Metais Nobres e Estratégicos Ltda',
    valorTotal,
    itens,
    infCpl,
  })

  const hash = await calcularSha256(xml)

  return {
    id: `SYN-MIN-${idx + 1}-${chave.slice(-6)}`,
    segmento: 'mineracao_urbana_criticos',
    modeloFiscal: '55',
    chaveAcesso: chave,
    numeroDocumento: nNF,
    serie,
    dataEmissao: dataHoje,
    cnpjEmitente: cnpjEmit,
    razaoSocialEmitente: 'Urban Mining & Materiais Críticos do Brasil S.A.',
    cnpjDestinatario: cnpjDest,
    razaoSocialDestinatario: 'Refinaria Metalúrgica de Metais Nobres e Estratégicos Ltda',
    valorTotal,
    itens,
    xmlConteudo: xml,
    hashSha256: hash,
    dadosAdicionais: {
      marcaInfCpl: MARCA_SANDBOX_OBRIGATORIA,
    },
  }
}

/**
 * Gera um lote completo com N documentos sintéticos (1, 10, 20 ou 50).
 */
export async function gerarLoteSintetico(params: {
  segmento: SegmentoSandbox
  quantidade: number
  dataReferencia?: string
  usarCnpjAlfanumerico?: boolean
}): Promise<DocumentoSintetico[]> {
  const lote: DocumentoSintetico[] = []
  for (let i = 0; i < params.quantidade; i++) {
    const doc = await gerarDocumentoSintetico({
      segmento: params.segmento,
      indice: i,
      dataReferencia: params.dataReferencia,
      usarCnpjAlfanumerico: params.usarCnpjAlfanumerico ?? true,
    })
    lote.push(doc)
  }
  return lote
}
