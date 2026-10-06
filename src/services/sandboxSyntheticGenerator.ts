/**
 * sandboxSyntheticGenerator.ts
 *
 * Gerador 100% nativo em TypeScript de documentos fiscais sintéticos para o
 * Sandbox de Ingestão do Orbis Protocol.
 *
 * Alinhado integralmente aos 15 Protocolos Setoriais do catálogo oficial
 * (protocolosSetoriais.ts) + módulo Materiais Críticos Recuperados & Mineração Urbana:
 *  1. agro (Agronegócio & Grãos)
 *  2. siderurgia (Siderurgia & Aço Verde)
 *  3. cimento (Cimento & Concreto)
 *  4. energia (Energia Renovável & Biogás)
 *  5. quimica (Química / Indústria Química & Petroquímica)
 *  6. logistica (Logística & Transporte de Cargas / Frete)
 *  7. textil (Têxtil, Confecção & Calçados)
 *  8. mineracao (Mineração & Minerais Críticos)
 *  9. automotiva (Automotiva / Indústria Automotiva, Autopeças & CDVs)
 * 10. alimentos (Alimentos & Bebidas)
 * 11. papel (Papel & Celulose)
 * 12. plasticos (Plásticos & Economia Circular)
 * 13. farmaceutica (Farmacêutica & Cosmética)
 * 14. construcao (Construção Civil & Canteiros Verdes)
 * 15. varejo (Comércio Varejista, Atacado & Serviços)
 * 16. materiais-criticos-recuperados (Materiais Críticos Recuperados & Mineração Urbana)
 *
 * Aliases legados retrocompatíveis:
 * - 'combustiveis' -> mapeia para 'energia' (ou mantido como alias)
 * - 'desmanche_cdv' -> mapeia para 'automotiva'
 * - 'transporte_cte' -> mapeia para 'logistica'
 * - 'varejo_reverso' -> mapeia para 'varejo'
 * - 'construcao_rcd' -> mapeia para 'construcao'
 * - 'mineracao_urbana_criticos' -> mapeia para 'materiais-criticos-recuperados'
 *
 * Fatores Oficiais Rígidos (catalogoFatoresOficiais.ts):
 * - Aço: 2,18 kgCO₂e/kg (worldsteel 2024/2025)
 * - Alumínio: 14,40 kgCO₂e/kg (IAI 2024)
 * - Cobre: 5,40 kgCO₂e/kg (CopperMark / ICA)
 * - Polímeros: 1,90 kgCO₂e/kg (PlasticsEurope)
 * - Concreto / RCD: 0,12 kgCO₂e/kg (ACV agregado reciclado)
 * - Outros / genérico: 1,50 kgCO₂e/kg (procedimento conservador DM-ORB-001)
 *
 * Regras fixas e imutáveis:
 * - NUNCA inventar número ou prometer crédito de carbono sobre materiais críticos (ouro, paládio, prata, terras raras — só cobre pontua).
 * - "Selo Oficial" é termo banido do texto público.
 * - Nada de superlativos de escala ("maior rede", etc.).
 * - Marca permanente em infCpl: MARCA_SANDBOX_OBRIGATORIA.
 */

export const MARCA_SANDBOX_OBRIGATORIA =
  '[DOCUMENTO SINTÉTICO - AMBIENTE DE SANDBOX ORBIS PROTOCOL - NÃO AUTORIZADO PELA SEFAZ - USO EXCLUSIVO DE TESTE E HOMOLOGAÇÃO]'

/**
 * Slugs canônicos dos 15 Protocolos Setoriais + Materiais Críticos Recuperados,
 * mais aliases retrocompatíveis suportados.
 */
export type ProtocoloSetorialSlug =
  | 'agro'
  | 'siderurgia'
  | 'cimento'
  | 'energia'
  | 'quimica'
  | 'logistica'
  | 'textil'
  | 'mineracao'
  | 'automotiva'
  | 'alimentos'
  | 'papel'
  | 'plasticos'
  | 'farmaceutica'
  | 'construcao'
  | 'varejo'
  | 'materiais-criticos-recuperados'

export type SegmentoSandboxLegado =
  | 'combustiveis'
  | 'desmanche_cdv'
  | 'transporte_cte'
  | 'varejo_reverso'
  | 'construcao_rcd'
  | 'mineracao_urbana_criticos'

export type SegmentoSandbox = ProtocoloSetorialSlug | SegmentoSandboxLegado

export interface OpcaoSegmentoSandbox {
  chave: SegmentoSandbox
  slugCanonico: ProtocoloSetorialSlug
  titulo: string
  subtitulo: string
  modeloPrincipal: '55' | '57'
  rastreabilidadePecas: boolean
}

export const SEGMENTOS_SANDBOX_CATALOGO: OpcaoSegmentoSandbox[] = [
  {
    chave: 'agro',
    slugCanonico: 'agro',
    titulo: 'Agronegócio & Grãos',
    subtitulo: 'Soja, milho, biomassa, biofertilizantes e rastreabilidade EUDR (NF-e mod. 55)',
    modeloPrincipal: '55',
    rastreabilidadePecas: false,
  },
  {
    chave: 'siderurgia',
    slugCanonico: 'siderurgia',
    titulo: 'Siderurgia & Aço Verde',
    subtitulo: 'Sucata ferrosa, bobinas, tarugos e aço laminado (fator 2,18 kgCO₂e/kg, CBAM)',
    modeloPrincipal: '55',
    rastreabilidadePecas: true,
  },
  {
    chave: 'cimento',
    slugCanonico: 'cimento',
    titulo: 'Cimento & Concreto',
    subtitulo: 'Clínquer, concreto sustentável e agregados reciclados (fator 0,12 kgCO₂e/kg)',
    modeloPrincipal: '55',
    rastreabilidadePecas: true,
  },
  {
    chave: 'energia',
    slugCanonico: 'energia',
    titulo: 'Energia Renovável & Biogás',
    subtitulo: 'Biometanol, biometano, etanol e combustíveis de baixa intensidade de carbono',
    modeloPrincipal: '55',
    rastreabilidadePecas: false,
  },
  {
    chave: 'quimica',
    slugCanonico: 'quimica',
    titulo: 'Química & Petroquímica',
    subtitulo: 'Solventes recuperados, resinas químicas e bioinsumos industriais',
    modeloPrincipal: '55',
    rastreabilidadePecas: false,
  },
  {
    chave: 'logistica',
    slugCanonico: 'logistica',
    titulo: 'Logística & Transporte de Cargas',
    subtitulo: 'Frete rodoviário interestadual com RNTRC e rota GLEC (CT-e mod. 57)',
    modeloPrincipal: '57',
    rastreabilidadePecas: false,
  },
  {
    chave: 'textil',
    slugCanonico: 'textil',
    titulo: 'Têxtil, Confecção & Calçados',
    subtitulo: 'Aparas de algodão, fibras recicladas e tecidos circulares rastreados',
    modeloPrincipal: '55',
    rastreabilidadePecas: true,
  },
  {
    chave: 'mineracao',
    slugCanonico: 'mineracao',
    titulo: 'Mineração & Minerais Críticos',
    subtitulo: 'Minério beneficiado, concentrados minerais e recuperação de rejeitos',
    modeloPrincipal: '55',
    rastreabilidadePecas: false,
  },
  {
    chave: 'automotiva',
    slugCanonico: 'automotiva',
    titulo: 'Automotiva / CDVs',
    subtitulo:
      'Peças usadas de desmanche credenciado, chassi rastreado (aço 2,18, alu 14,40, cobre 5,40)',
    modeloPrincipal: '55',
    rastreabilidadePecas: true,
  },
  {
    chave: 'alimentos',
    slugCanonico: 'alimentos',
    titulo: 'Alimentos & Bebidas',
    subtitulo: 'Subprodutos agroindustriais, coprodutos e embalagens pós-consumo',
    modeloPrincipal: '55',
    rastreabilidadePecas: false,
  },
  {
    chave: 'papel',
    slugCanonico: 'papel',
    titulo: 'Papel & Celulose',
    subtitulo: 'Aparas de papelão ondulado, celulose reciclada e embalagens celulósicas',
    modeloPrincipal: '55',
    rastreabilidadePecas: true,
  },
  {
    chave: 'plasticos',
    slugCanonico: 'plasticos',
    titulo: 'Plásticos & Economia Circular',
    subtitulo: 'Polímeros recuperados PP, PEAD, PET, ABS (fator oficial 1,90 kgCO₂e/kg)',
    modeloPrincipal: '55',
    rastreabilidadePecas: true,
  },
  {
    chave: 'farmaceutica',
    slugCanonico: 'farmaceutica',
    titulo: 'Farmacêutica & Cosmética',
    subtitulo: 'Embalagens de medicamentos, logística reversa hospitalar e resíduos estéreis',
    modeloPrincipal: '55',
    rastreabilidadePecas: false,
  },
  {
    chave: 'construcao',
    slugCanonico: 'construcao',
    titulo: 'Construção Civil & Canteiros Verdes',
    subtitulo: 'RCD, agregados de concreto (0,12 kgCO₂e/kg) e armaduras de aço (2,18 kgCO₂e/kg)',
    modeloPrincipal: '55',
    rastreabilidadePecas: true,
  },
  {
    chave: 'varejo',
    slugCanonico: 'varejo',
    titulo: 'Comércio Varejista, Atacado & Serviços',
    subtitulo:
      'Logística reversa de eletroeletrônicos e peças com aço, alumínio, cobre e polímeros',
    modeloPrincipal: '55',
    rastreabilidadePecas: true,
  },
  {
    chave: 'materiais-criticos-recuperados',
    slugCanonico: 'materiais-criticos-recuperados',
    titulo: 'Materiais Críticos Recuperados & Mineração Urbana',
    subtitulo:
      'Cobre calculado (5,40). Ouro, paládio, prata e terras raras em estruturação sem crédito',
    modeloPrincipal: '55',
    rastreabilidadePecas: true,
  },
]

export function normalizarSegmento(seg: SegmentoSandbox): ProtocoloSetorialSlug {
  switch (seg) {
    case 'combustiveis':
      return 'energia'
    case 'desmanche_cdv':
      return 'automotiva'
    case 'transporte_cte':
      return 'logistica'
    case 'varejo_reverso':
      return 'varejo'
    case 'construcao_rcd':
      return 'construcao'
    case 'mineracao_urbana_criticos':
      return 'materiais-criticos-recuperados'
    default:
      return seg
  }
}

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
  categoriaMaterial?:
    | 'aco'
    | 'aluminio'
    | 'cobre'
    | 'polimeros'
    | 'concreto'
    | 'agro_rastreado'
    | 'outros'
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
    protocoloSetorialSlug?: ProtocoloSetorialSlug
    protocoloSetorialNome?: string
    chassi?: string
    placa?: string
    rntrc?: string
    combustivelTipo?: string
    volumeLitros?: number
    municipioOrigem?: string
    municipioDestino?: string
    roundSeed?: number
  }
}

/**
 * Gerador pseudoaleatório determinístico (Mulberry32) para derivação
 * reprodutível a partir de semente de rodada (roundSeed).
 */
export function criarPrng(seed: number): () => number {
  let s = Math.floor(Math.abs(seed)) >>> 0
  if (s === 0) s = 1
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Gera uma nova semente de rodada inteira positiva dentro da faixa de 6 a 7 dígitos.
 */
export function gerarSementeRodada(): number {
  return Math.floor(100000 + Math.random() * 900000)
}

// ----------------------------------------------------------------------
// 1. GERAÇÃO E VALIDAÇÃO DE CNPJ COM SUPORTE ALFANUMÉRICO (MÓDULO 11)
// ----------------------------------------------------------------------

export function charToValorCnpj(c: string): number {
  const code = c.toUpperCase().charCodeAt(0)
  if (code >= 48 && code <= 57) {
    return code - 48
  }
  if (code >= 65 && code <= 90) {
    return code - 55
  }
  throw new Error(`Caractere inválido para CNPJ: ${c}`)
}

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

export function validarCnpjAlfanumerico(cnpjInput: string): boolean {
  if (!cnpjInput) return false
  const limpo = cnpjInput.toUpperCase().replace(/[^0-9A-Z]/g, '')
  if (limpo.length !== 14) return false

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

export function formatarCnpj(cnpj14: string): string {
  const limpo = cnpj14.toUpperCase().replace(/[^0-9A-Z]/g, '')
  if (limpo.length !== 14) return cnpj14
  return `${limpo.slice(0, 2)}.${limpo.slice(2, 5)}.${limpo.slice(5, 8)}/${limpo.slice(8, 12)}-${limpo.slice(12, 14)}`
}

export function gerarCnpjValido(opcoes?: { alfanumerico?: boolean; seed?: number }): string {
  const charsAlfanum = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const seed = opcoes?.seed ?? Math.floor(Math.random() * 1000000)

  let base12 = ''
  if (opcoes?.alfanumerico) {
    for (let i = 0; i < 8; i++) {
      const idx = (seed * 17 + i * 31 + 7) % charsAlfanum.length
      base12 += charsAlfanum[idx]
    }
    if (!/[A-Z]/.test(base12)) {
      base12 = base12.slice(0, 7) + 'A'
    }
    base12 += '0001'
  } else {
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
// 2. CHAVE DE ACESSO FISCAL (44 DÍGITOS MOD 11 PESOS 2-9)
// ----------------------------------------------------------------------

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

export function gerarChaveAcesso44(params: {
  cUF: string
  aamm: string
  cnpjEmitente: string
  modelo: '55' | '57'
  serie: string
  numeroDoc: string
  tpEmis?: string
  codigoAleatorio?: string
}): string {
  const cUF = params.cUF.padStart(2, '0').slice(0, 2)
  const aamm = params.aamm.padStart(4, '0').slice(0, 4)

  let cnpjNum = params.cnpjEmitente.replace(/\D/g, '')
  if (cnpjNum.length !== 14) {
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

export async function calcularSha256(texto: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const encoder = new TextEncoder()
    const data = encoder.encode(texto)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    return Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
  }
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
// 4. CONSTRUTORES DE XML (NF-e mod. 55 e CT-e mod. 57)
// ----------------------------------------------------------------------

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
        <natOp>OPERACAO FISCAL SANDBOX DMRV HOMOLOGACAO</natOp>
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
        <verProc>OrbisProtocol_Sandbox_2.0</verProc>
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
        <verProc>OrbisProtocol_Sandbox_2.0</verProc>
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
// 5. GERADOR CENTRAL DE DOCUMENTOS SINTÉTICOS ALINHADO AOS 15 PROTOCOLOS
// ----------------------------------------------------------------------

export async function gerarDocumentoSintetico(params: {
  segmento: SegmentoSandbox
  indice: number
  dataReferencia?: string
  usarCnpjAlfanumerico?: boolean
  roundSeed?: number
}): Promise<DocumentoSintetico> {
  const slug = normalizarSegmento(params.segmento)
  const idx = params.indice
  const dataHoje = params.dataReferencia || new Date().toISOString().slice(0, 10)
  const aamm = `${dataHoje.slice(2, 4)}${dataHoje.slice(5, 7)}`
  const roundSeed = params.roundSeed ?? 0

  // PRNG determinístico por roundSeed + índice do documento
  const prng = criarPrng((roundSeed * 1009 + idx * 37 + 7) >>> 0)

  // Deslocamento de CNPJ: garante DVs válidos mantendo reprodutibilidade e variedade por rodada
  const cnpjSeedEmit = (1000 + idx * 17 + slug.length + (roundSeed % 50000) * 13) >>> 0
  const cnpjSeedDest = (2000 + idx * 29 + slug.length + (roundSeed % 50000) * 19) >>> 0

  const cnpjEmit = gerarCnpjValido({
    alfanumerico: params.usarCnpjAlfanumerico && idx % 2 === 0,
    seed: cnpjSeedEmit,
  })
  const cnpjDest = gerarCnpjValido({
    alfanumerico: false,
    seed: cnpjSeedDest,
  })

  // Helper para cNF (8 dígitos aleatórios da NFe/CTe): incorpora roundSeed e índice garantindo unicidade diária
  const gerarCodigoAleatorioChave = (baseCode: number): string => {
    const val = ((baseCode + ((roundSeed * 7919 + idx * 313) % 89999999)) % 90000000) + 10000000
    return val.toString().slice(0, 8)
  }

  // 1. AGRO (Agronegócio & Grãos) - NF-e 55
  if (slug === 'agro') {
    const nNF = (110000 + idx).toString()
    const chave = gerarChaveAcesso44({
      cUF: '41',
      aamm,
      cnpjEmitente: cnpjEmit,
      modelo: '55',
      serie: '1',
      numeroDoc: nNF,
      codigoAleatorio: gerarCodigoAleatorioChave(81000000),
    })
    // Faixa realista por segmento: soja ~30–90 t por lote (500 a 1500 sacas de 60 kg)
    const deltaSacas = Math.floor(prng() * 1000) // 0 a 999
    const sacas = 500 + deltaSacas // 500 a 1499 sacas = 30 a ~90 toneladas
    const pesoKg = sacas * 60
    const precoSaca = Math.round((130 + prng() * 15) * 100) / 100 // R$ 130 a 145 / saca
    const vProd = Math.round(sacas * precoSaca * 100) / 100
    const itens: ItemDocumentoSintetico[] = [
      {
        nItem: 1,
        cProd: `AGR-SOJA-GR-${idx + 1}`,
        xProd: 'SOJA EM GRAOS SAFRA RASTREADA CAR EUDR - NCM 1201.90.00',
        ncm: '1201.90.00',
        cfop: '5102',
        uCom: 'SC',
        qCom: sacas,
        vUnCom: 135.5,
        vProd,
        categoriaMaterial: 'agro_rastreado',
        pesoKg,
        fatorCo2eKg: 0,
        co2eEvitadoKg: 0,
        statusCalculo: 'em_estruturacao_de_catalogo',
        teorDeclarado: 'Poligonal CAR PR-0000000-EUDR • Livre de desmatamento pós-2020',
      },
    ]
    const infCpl = `${MARCA_SANDBOX_OBRIGATORIA} - Protocolo Setorial 01: Agronegócio & Grãos. Due diligence EUDR e Código Florestal CAR. CFOP 5102. NCM 1201.90.00.`
    const xml = construirXmlNFe({
      chaveAcesso: chave,
      numero: nNF,
      serie: '1',
      dataEmissao: dataHoje,
      cnpjEmitente: cnpjEmit,
      razaoSocialEmitente: 'Cooperativa Agroindustrial Grãos do Sul S.A. (Sandbox)',
      cnpjDestinatario: cnpjDest,
      razaoSocialDestinatario: 'Exportadora & Moinhos Integrados do Brasil S.A.',
      valorTotal: vProd,
      itens,
      infCpl,
    })
    const hash = await calcularSha256(xml)
    return {
      id: `SYN-AGRO-${idx + 1}-${chave.slice(-6)}`,
      segmento: params.segmento,
      modeloFiscal: '55',
      chaveAcesso: chave,
      numeroDocumento: nNF,
      serie: '1',
      dataEmissao: dataHoje,
      cnpjEmitente: cnpjEmit,
      razaoSocialEmitente: 'Cooperativa Agroindustrial Grãos do Sul S.A.',
      cnpjDestinatario: cnpjDest,
      razaoSocialDestinatario: 'Exportadora & Moinhos Integrados do Brasil S.A.',
      valorTotal: vProd,
      itens,
      xmlConteudo: xml,
      hashSha256: hash,
      dadosAdicionais: {
        marcaInfCpl: MARCA_SANDBOX_OBRIGATORIA,
        protocoloSetorialSlug: 'agro',
        protocoloSetorialNome: 'Agronegócio & Grãos',
      },
    }
  }

  // 2. SIDERURGIA (Siderurgia & Aço Verde) - NF-e 55 (fator aço 2,18)
  if (slug === 'siderurgia') {
    const nNF = (120000 + idx).toString()
    const chave = gerarChaveAcesso44({
      cUF: '41',
      aamm,
      cnpjEmitente: cnpjEmit,
      modelo: '55',
      serie: '1',
      numeroDoc: nNF,
      codigoAleatorio: gerarCodigoAleatorioChave(82000000),
    })
    // Faixa realista: sucata ferrosa ~3.000 a 10.000 kg por carregamento de caminhão
    const pesoKg = Math.round(3000 + prng() * 6000 + (idx % 5) * 200)
    const precoKg = Math.round((4.6 + prng() * 0.7) * 100) / 100 // R$ 4,60 a 5,30/kg
    const vProd = Math.round(pesoKg * precoKg * 100) / 100
    const co2e = Math.round(pesoKg * 2.18 * 100) / 100
    const itens: ItemDocumentoSintetico[] = [
      {
        nItem: 1,
        cProd: `SID-SUC-ACO-${idx + 1}`,
        xProd: 'SUCATA FERROSA PREPARADA PARA ACIARIA ELETRICA EAF (ACO LAMINADO RECICLADO)',
        ncm: '7204.49.00',
        cfop: '5102',
        uCom: 'KG',
        qCom: pesoKg,
        vUnCom: 4.95,
        vProd,
        categoriaMaterial: 'aco',
        pesoKg,
        fatorCo2eKg: 2.18,
        co2eEvitadoKg: co2e,
        statusCalculo: 'calculado',
        teorDeclarado: 'Aço Laminado / Estampado (fator worldsteel oficial 2,18 kgCO₂e/kg)',
      },
    ]
    const infCpl = `${MARCA_SANDBOX_OBRIGATORIA} - Protocolo Setorial 02: Siderurgia & Aço Verde. CFOP 5102. NCM 7204.49.00. Emissões incorporadas e abatimento por sucata ferrosa.`
    const xml = construirXmlNFe({
      chaveAcesso: chave,
      numero: nNF,
      serie: '1',
      dataEmissao: dataHoje,
      cnpjEmitente: cnpjEmit,
      razaoSocialEmitente: 'Siderúrgica Aço Verde do Paraná S.A. (Sandbox)',
      cnpjDestinatario: cnpjDest,
      razaoSocialDestinatario: 'Laminadora & Tubos Metalúrgicos Integrados Ltda',
      valorTotal: vProd,
      itens,
      infCpl,
    })
    const hash = await calcularSha256(xml)
    return {
      id: `SYN-SID-${idx + 1}-${chave.slice(-6)}`,
      segmento: params.segmento,
      modeloFiscal: '55',
      chaveAcesso: chave,
      numeroDocumento: nNF,
      serie: '1',
      dataEmissao: dataHoje,
      cnpjEmitente: cnpjEmit,
      razaoSocialEmitente: 'Siderúrgica Aço Verde do Paraná S.A.',
      cnpjDestinatario: cnpjDest,
      razaoSocialDestinatario: 'Laminadora & Tubos Metalúrgicos Integrados Ltda',
      valorTotal: vProd,
      itens,
      xmlConteudo: xml,
      hashSha256: hash,
      dadosAdicionais: {
        marcaInfCpl: MARCA_SANDBOX_OBRIGATORIA,
        protocoloSetorialSlug: 'siderurgia',
        protocoloSetorialNome: 'Siderurgia & Aço Verde',
      },
    }
  }

  // 3. CIMENTO (Cimento & Concreto) - NF-e 55 (fator concreto 0,12)
  if (slug === 'cimento') {
    const nNF = (130000 + idx).toString()
    const chave = gerarChaveAcesso44({
      cUF: '41',
      aamm,
      cnpjEmitente: cnpjEmit,
      modelo: '55',
      serie: '1',
      numeroDoc: nNF,
      codigoAleatorio: gerarCodigoAleatorioChave(83000000),
    })
    // Faixa realista: concreto / cimento granel ~12 a 45 toneladas por caminhão betoneira/silo
    const toneladas = Math.round((12 + prng() * 30 + (idx % 4) * 2) * 10) / 10
    const pesoKg = Math.round(toneladas * 1000)
    const vProd = Math.round(toneladas * 320.0 * 100) / 100
    const co2e = Math.round(pesoKg * 0.12 * 100) / 100
    const itens: ItemDocumentoSintetico[] = [
      {
        nItem: 1,
        cProd: `CIM-CP-IV-${idx + 1}`,
        xProd: 'CIMENTO CP-IV POZOLANICO BAIXO CARBONO COM RESIDUOS COPROCESSADOS',
        ncm: '2523.29.10',
        cfop: '5102',
        uCom: 'TON',
        qCom: toneladas,
        vUnCom: 320.0,
        vProd,
        categoriaMaterial: 'concreto',
        pesoKg,
        fatorCo2eKg: 0.12,
        co2eEvitadoKg: co2e,
        statusCalculo: 'calculado',
        teorDeclarado: 'Agregado e ligante reciclado (fator oficial 0,12 kgCO₂e/kg)',
      },
    ]
    const infCpl = `${MARCA_SANDBOX_OBRIGATORIA} - Protocolo Setorial 03: Cimento & Concreto. CFOP 5102. NCM 2523.29.10. Resolução CONAMA 499/2020 coprocessamento.`
    const xml = construirXmlNFe({
      chaveAcesso: chave,
      numero: nNF,
      serie: '1',
      dataEmissao: dataHoje,
      cnpjEmitente: cnpjEmit,
      razaoSocialEmitente: 'Cimentos & Concretos Sustentáveis do Brasil S.A. (Sandbox)',
      cnpjDestinatario: cnpjDest,
      razaoSocialDestinatario: 'Concreteira & Obras Estruturais do Paraná Ltda',
      valorTotal: vProd,
      itens,
      infCpl,
    })
    const hash = await calcularSha256(xml)
    return {
      id: `SYN-CIM-${idx + 1}-${chave.slice(-6)}`,
      segmento: params.segmento,
      modeloFiscal: '55',
      chaveAcesso: chave,
      numeroDocumento: nNF,
      serie: '1',
      dataEmissao: dataHoje,
      cnpjEmitente: cnpjEmit,
      razaoSocialEmitente: 'Cimentos & Concretos Sustentáveis do Brasil S.A.',
      cnpjDestinatario: cnpjDest,
      razaoSocialDestinatario: 'Concreteira & Obras Estruturais do Paraná Ltda',
      valorTotal: vProd,
      itens,
      xmlConteudo: xml,
      hashSha256: hash,
      dadosAdicionais: {
        marcaInfCpl: MARCA_SANDBOX_OBRIGATORIA,
        protocoloSetorialSlug: 'cimento',
        protocoloSetorialNome: 'Cimento & Concreto',
      },
    }
  }

  // 4. ENERGIA (Energia Renovável & Biogás / Combustíveis) - NF-e 55
  if (slug === 'energia') {
    const isBiometanol = idx % 2 === 1
    const ncm = isBiometanol ? '2905.11.00' : '2710.19.21'
    const xProd = isBiometanol
      ? 'BIOMETANOL RENOVÁVEL INDUSTRIAL - CARBURANTE NEUTRO'
      : 'OLEO DIESEL B S10 COMUM GRANEL - BAIXO TEOR DE ENXOFRE'
    const cfop = isBiometanol ? '6655' : '5655'
    const cProd = isBiometanol ? 'BIO-MET-01' : 'DSL-S10-02'
    // Faixa realista: caminhão tanque de combustível ~8.000 a 30.000 litros
    const litros = Math.round(8000 + prng() * 20000 + (idx % 5) * 1000)
    const precoLitro = isBiometanol ? 4.85 : 5.92
    const valorTotal = Math.round(litros * precoLitro * 100) / 100
    const nNF = (140000 + idx).toString()
    const chave = gerarChaveAcesso44({
      cUF: '41',
      aamm,
      cnpjEmitente: cnpjEmit,
      modelo: '55',
      serie: '1',
      numeroDoc: nNF,
      codigoAleatorio: gerarCodigoAleatorioChave(84000000),
    })
    const infCpl = `${MARCA_SANDBOX_OBRIGATORIA} - Protocolo Setorial 04: Energia Renovável & Biogás. CFOP ${cfop}. NCM ${ncm}. Volume: ${litros} L.`
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
        fatorCo2eKg: 0,
        co2eEvitadoKg: 0,
        statusCalculo: 'em_estruturacao_de_catalogo',
      },
    ]
    const xml = construirXmlNFe({
      chaveAcesso: chave,
      numero: nNF,
      serie: '1',
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
      id: `SYN-ENG-${idx + 1}-${chave.slice(-6)}`,
      segmento: params.segmento,
      modeloFiscal: '55',
      chaveAcesso: chave,
      numeroDocumento: nNF,
      serie: '1',
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
        protocoloSetorialSlug: 'energia',
        protocoloSetorialNome: 'Energia Renovável & Biogás',
        combustivelTipo: isBiometanol ? 'biometanol' : 'diesel_s10',
        volumeLitros: litros,
      },
    }
  }

  // 5. QUÍMICA (Química & Petroquímica) - NF-e 55
  if (slug === 'quimica') {
    const nNF = (150000 + idx).toString()
    const chave = gerarChaveAcesso44({
      cUF: '41',
      aamm,
      cnpjEmitente: cnpjEmit,
      modelo: '55',
      serie: '1',
      numeroDoc: nNF,
      codigoAleatorio: gerarCodigoAleatorioChave(85000000),
    })
    // Faixa realista: solvente recuperado em IBCs (1.000 L cada) ~2.000 a 10.000 litros
    const litros = Math.round(2000 + prng() * 6000 + (idx % 4) * 1000)
    const vProd = Math.round(litros * 7.8 * 100) / 100
    const itens: ItemDocumentoSintetico[] = [
      {
        nItem: 1,
        cProd: `QUI-SOLV-REC-${idx + 1}`,
        xProd: 'SOLVENTE INDUSTRIAL RECUPERADO DE REGENERAÇÃO TÉRMICA (NCM 3814.00.90)',
        ncm: '3814.00.90',
        cfop: '5102',
        uCom: 'L',
        qCom: litros,
        vUnCom: 7.8,
        vProd,
        categoriaMaterial: 'outros',
        pesoKg: Math.round(litros * 0.88),
        fatorCo2eKg: 0,
        co2eEvitadoKg: 0,
        statusCalculo: 'em_estruturacao_de_catalogo',
      },
    ]
    const infCpl = `${MARCA_SANDBOX_OBRIGATORIA} - Protocolo Setorial 05: Indústria Química & Petroquímica. CFOP 5102. NCM 3814.00.90.`
    const xml = construirXmlNFe({
      chaveAcesso: chave,
      numero: nNF,
      serie: '1',
      dataEmissao: dataHoje,
      cnpjEmitente: cnpjEmit,
      razaoSocialEmitente: 'Química Verde & Solventes Ecológicos do Brasil S.A. (Sandbox)',
      cnpjDestinatario: cnpjDest,
      razaoSocialDestinatario: 'Indústria Química Integrada do Paraná Ltda',
      valorTotal: vProd,
      itens,
      infCpl,
    })
    const hash = await calcularSha256(xml)
    return {
      id: `SYN-QUI-${idx + 1}-${chave.slice(-6)}`,
      segmento: params.segmento,
      modeloFiscal: '55',
      chaveAcesso: chave,
      numeroDocumento: nNF,
      serie: '1',
      dataEmissao: dataHoje,
      cnpjEmitente: cnpjEmit,
      razaoSocialEmitente: 'Química Verde & Solventes Ecológicos do Brasil S.A.',
      cnpjDestinatario: cnpjDest,
      razaoSocialDestinatario: 'Indústria Química Integrada do Paraná Ltda',
      valorTotal: vProd,
      itens,
      xmlConteudo: xml,
      hashSha256: hash,
      dadosAdicionais: {
        marcaInfCpl: MARCA_SANDBOX_OBRIGATORIA,
        protocoloSetorialSlug: 'quimica',
        protocoloSetorialNome: 'Química & Petroquímica',
      },
    }
  }

  // 6. LOGÍSTICA (Logística & Transporte de Cargas) - CT-e 57
  if (slug === 'logistica') {
    const nCT = (300000 + idx).toString()
    const chave = gerarChaveAcesso44({
      cUF: '41',
      aamm,
      cnpjEmitente: cnpjEmit,
      modelo: '57',
      serie: '1',
      numeroDoc: nCT,
      codigoAleatorio: gerarCodigoAleatorioChave(65000000),
    })
    const rntrc = (80000000 + ((roundSeed * 13 + idx) % 9999999)).toString().slice(0, 8)
    const cfop = '6353'
    // Faixa realista: frete rodoviário interestadual lote fechado R$ 2.400 a R$ 7.500
    const valorFrete = Math.round((2400 + prng() * 4500 + (idx % 5) * 200) * 100) / 100
    const pesoCargaKg = Math.round(8000 + prng() * 14000) // 8 a 22 toneladas
    const infCpl = `${MARCA_SANDBOX_OBRIGATORIA} - Protocolo Setorial 06: Logística & Transporte. PR -> SP. RNTRC ${rntrc}. CFOP ${cfop}. GLEC Framework.`
    const xml = construirXmlCTe({
      chaveAcesso: chave,
      numero: nCT,
      serie: '1',
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
        pesoKg: pesoCargaKg,
        fatorCo2eKg: 0,
        co2eEvitadoKg: 0,
        statusCalculo: 'em_estruturacao_de_catalogo',
      },
    ]
    return {
      id: `SYN-LOG-${idx + 1}-${chave.slice(-6)}`,
      segmento: params.segmento,
      modeloFiscal: '57',
      chaveAcesso: chave,
      numeroDocumento: nCT,
      serie: '1',
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
        protocoloSetorialSlug: 'logistica',
        protocoloSetorialNome: 'Logística & Transporte de Cargas',
        rntrc,
        municipioOrigem: 'Curitiba/PR',
        municipioDestino: 'São Paulo/SP',
      },
    }
  }

  // 7. TÊXTIL (Têxtil, Confecção & Calçados) - NF-e 55 (polímeros sintéticos / outros)
  if (slug === 'textil') {
    const nNF = (170000 + idx).toString()
    const chave = gerarChaveAcesso44({
      cUF: '41',
      aamm,
      cnpjEmitente: cnpjEmit,
      modelo: '55',
      serie: '1',
      numeroDoc: nNF,
      codigoAleatorio: gerarCodigoAleatorioChave(87000000),
    })
    // Faixa realista: fardos de fibra PET reciclada ~800 a 4.000 kg
    const pesoKg = Math.round(800 + prng() * 3000 + (idx % 4) * 200)
    const vProd = Math.round(pesoKg * 8.5 * 100) / 100
    const co2e = Math.round(pesoKg * 1.9 * 100) / 100
    const itens: ItemDocumentoSintetico[] = [
      {
        nItem: 1,
        cProd: `TEX-FIB-REC-${idx + 1}`,
        xProd: 'FIBRA SINTETICA POLIESTER RECICLADA DE GARRAFAS PET (NCM 5503.20.90)',
        ncm: '5503.20.90',
        cfop: '5102',
        uCom: 'KG',
        qCom: pesoKg,
        vUnCom: 8.5,
        vProd,
        categoriaMaterial: 'polimeros',
        pesoKg,
        fatorCo2eKg: 1.9,
        co2eEvitadoKg: co2e,
        statusCalculo: 'calculado',
        teorDeclarado: 'Polímeros recuperados (fator oficial PlasticsEurope 1,90 kgCO₂e/kg)',
      },
    ]
    const infCpl = `${MARCA_SANDBOX_OBRIGATORIA} - Protocolo Setorial 07: Têxtil, Confecção & Calçados. CFOP 5102. NCM 5503.20.90.`
    const xml = construirXmlNFe({
      chaveAcesso: chave,
      numero: nNF,
      serie: '1',
      dataEmissao: dataHoje,
      cnpjEmitente: cnpjEmit,
      razaoSocialEmitente: 'EcoTêxtil & Fibras Recicladas do Sul S.A. (Sandbox)',
      cnpjDestinatario: cnpjDest,
      razaoSocialDestinatario: 'Tecelagem & Fiação Santa Catarina Ltda',
      valorTotal: vProd,
      itens,
      infCpl,
    })
    const hash = await calcularSha256(xml)
    return {
      id: `SYN-TEX-${idx + 1}-${chave.slice(-6)}`,
      segmento: params.segmento,
      modeloFiscal: '55',
      chaveAcesso: chave,
      numeroDocumento: nNF,
      serie: '1',
      dataEmissao: dataHoje,
      cnpjEmitente: cnpjEmit,
      razaoSocialEmitente: 'EcoTêxtil & Fibras Recicladas do Sul S.A.',
      cnpjDestinatario: cnpjDest,
      razaoSocialDestinatario: 'Tecelagem & Fiação Santa Catarina Ltda',
      valorTotal: vProd,
      itens,
      xmlConteudo: xml,
      hashSha256: hash,
      dadosAdicionais: {
        marcaInfCpl: MARCA_SANDBOX_OBRIGATORIA,
        protocoloSetorialSlug: 'textil',
        protocoloSetorialNome: 'Têxtil, Confecção & Calçados',
      },
    }
  }

  // 8. MINERAÇÃO (Mineração & Minerais Críticos) - NF-e 55
  if (slug === 'mineracao') {
    const nNF = (180000 + idx).toString()
    const chave = gerarChaveAcesso44({
      cUF: '41',
      aamm,
      cnpjEmitente: cnpjEmit,
      modelo: '55',
      serie: '1',
      numeroDoc: nNF,
      codigoAleatorio: gerarCodigoAleatorioChave(88000000),
    })
    // Faixa realista: minério beneficiado carretas caçamba rodotrem ~30 a 80 toneladas
    const toneladas = Math.round((30 + prng() * 45 + (idx % 4) * 3) * 10) / 10
    const vProd = Math.round(toneladas * 480.0 * 100) / 100
    const itens: ItemDocumentoSintetico[] = [
      {
        nItem: 1,
        cProd: `MIN-CONC-FER-${idx + 1}`,
        xProd: 'MINERIO DE FERRO BENEFICIADO ALTO TEOR (PELLET FEED - NCM 2601.12.00)',
        ncm: '2601.12.00',
        cfop: '5102',
        uCom: 'TON',
        qCom: toneladas,
        vUnCom: 480.0,
        vProd,
        categoriaMaterial: 'outros',
        pesoKg: toneladas * 1000,
        fatorCo2eKg: 0,
        co2eEvitadoKg: 0,
        statusCalculo: 'em_estruturacao_de_catalogo',
      },
    ]
    const infCpl = `${MARCA_SANDBOX_OBRIGATORIA} - Protocolo Setorial 08: Mineração & Minerais Críticos. CFOP 5102. NCM 2601.12.00.`
    const xml = construirXmlNFe({
      chaveAcesso: chave,
      numero: nNF,
      serie: '1',
      dataEmissao: dataHoje,
      cnpjEmitente: cnpjEmit,
      razaoSocialEmitente: 'Mineração & Beneficiamento Serra Verde S.A. (Sandbox)',
      cnpjDestinatario: cnpjDest,
      razaoSocialDestinatario: 'Pelotizadora & Portos Integrados do Brasil S.A.',
      valorTotal: vProd,
      itens,
      infCpl,
    })
    const hash = await calcularSha256(xml)
    return {
      id: `SYN-MINER-${idx + 1}-${chave.slice(-6)}`,
      segmento: params.segmento,
      modeloFiscal: '55',
      chaveAcesso: chave,
      numeroDocumento: nNF,
      serie: '1',
      dataEmissao: dataHoje,
      cnpjEmitente: cnpjEmit,
      razaoSocialEmitente: 'Mineração & Beneficiamento Serra Verde S.A.',
      cnpjDestinatario: cnpjDest,
      razaoSocialDestinatario: 'Pelotizadora & Portos Integrados do Brasil S.A.',
      valorTotal: vProd,
      itens,
      xmlConteudo: xml,
      hashSha256: hash,
      dadosAdicionais: {
        marcaInfCpl: MARCA_SANDBOX_OBRIGATORIA,
        protocoloSetorialSlug: 'mineracao',
        protocoloSetorialNome: 'Mineração & Minerais Críticos',
      },
    }
  }

  // 9. AUTOMOTIVA (Automotiva / CDVs) - NF-e 55 (aço 2,18, alumínio 14,40, cobre 5,40)
  if (slug === 'automotiva') {
    const chassiFinal = (1000 + ((roundSeed * 7 + idx) % 8999)).toString().slice(-4)
    const chassi = `93YBB05U0GJ${chassiFinal}`
    const placa = `ORB-${(2000 + ((roundSeed * 11 + idx) % 7999)).toString().slice(-4)}`
    const nNF = (200000 + idx).toString()
    const chave = gerarChaveAcesso44({
      cUF: '41',
      aamm,
      cnpjEmitente: cnpjEmit,
      modelo: '55',
      serie: '2',
      numeroDoc: nNF,
      codigoAleatorio: gerarCodigoAleatorioChave(76000000),
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
        co2eEvitadoKg: Math.round(18.5 * 2.18 * 100) / 100,
        statusCalculo: 'calculado',
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
        co2eEvitadoKg: Math.round(8.2 * 14.4 * 100) / 100,
        statusCalculo: 'calculado',
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
        fatorCo2eKg: 5.4,
        co2eEvitadoKg: Math.round(3.8 * 5.4 * 100) / 100,
        statusCalculo: 'calculado',
      },
    ]
    const valorTotal = itens.reduce((acc, it) => acc + it.vProd, 0)
    const infCpl = `${MARCA_SANDBOX_OBRIGATORIA} - Protocolo Setorial 09: Automotiva/CDVs. Peças de desmontagem técnica credenciada DETRAN/PR. Chassi: ${chassi}.`
    const xml = construirXmlNFe({
      chaveAcesso: chave,
      numero: nNF,
      serie: '2',
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
      segmento: params.segmento,
      modeloFiscal: '55',
      chaveAcesso: chave,
      numeroDocumento: nNF,
      serie: '2',
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
        protocoloSetorialSlug: 'automotiva',
        protocoloSetorialNome: 'Indústria Automotiva, Autopeças & CDVs',
        chassi,
        placa,
      },
    }
  }

  // 10. ALIMENTOS (Alimentos & Bebidas) - NF-e 55
  if (slug === 'alimentos') {
    const nNF = (210000 + idx).toString()
    const chave = gerarChaveAcesso44({
      cUF: '41',
      aamm,
      cnpjEmitente: cnpjEmit,
      modelo: '55',
      serie: '1',
      numeroDoc: nNF,
      codigoAleatorio: gerarCodigoAleatorioChave(71000000),
    })
    // Faixa realista: subprodutos alimentícios (levedura / cevada ração) ~3.000 a 12.000 kg
    const pesoKg = Math.round(3000 + prng() * 8000 + (idx % 4) * 500)
    const vProd = Math.round(pesoKg * 2.1 * 100) / 100
    const itens: ItemDocumentoSintetico[] = [
      {
        nItem: 1,
        cProd: `ALI-SUB-RAC-${idx + 1}`,
        xProd: 'SUBPRODUTO DE LEVEDURA E CEVADA PARA RACAO ANIMAL CIRCULAR (NCM 2303.30.00)',
        ncm: '2303.30.00',
        cfop: '5102',
        uCom: 'KG',
        qCom: pesoKg,
        vUnCom: 2.1,
        vProd,
        categoriaMaterial: 'outros',
        pesoKg,
        fatorCo2eKg: 0,
        co2eEvitadoKg: 0,
        statusCalculo: 'em_estruturacao_de_catalogo',
      },
    ]
    const infCpl = `${MARCA_SANDBOX_OBRIGATORIA} - Protocolo Setorial 10: Alimentos & Bebidas. CFOP 5102. NCM 2303.30.00. Economia circular de subprodutos alimentícios.`
    const xml = construirXmlNFe({
      chaveAcesso: chave,
      numero: nNF,
      serie: '1',
      dataEmissao: dataHoje,
      cnpjEmitente: cnpjEmit,
      razaoSocialEmitente: 'Cervejaria & Alimentos Sustentáveis do Brasil S.A. (Sandbox)',
      cnpjDestinatario: cnpjDest,
      razaoSocialDestinatario: 'Fábrica de Nutrição Animal & Rações do Sul Ltda',
      valorTotal: vProd,
      itens,
      infCpl,
    })
    const hash = await calcularSha256(xml)
    return {
      id: `SYN-ALI-${idx + 1}-${chave.slice(-6)}`,
      segmento: params.segmento,
      modeloFiscal: '55',
      chaveAcesso: chave,
      numeroDocumento: nNF,
      serie: '1',
      dataEmissao: dataHoje,
      cnpjEmitente: cnpjEmit,
      razaoSocialEmitente: 'Cervejaria & Alimentos Sustentáveis do Brasil S.A.',
      cnpjDestinatario: cnpjDest,
      razaoSocialDestinatario: 'Fábrica de Nutrição Animal & Rações do Sul Ltda',
      valorTotal: vProd,
      itens,
      xmlConteudo: xml,
      hashSha256: hash,
      dadosAdicionais: {
        marcaInfCpl: MARCA_SANDBOX_OBRIGATORIA,
        protocoloSetorialSlug: 'alimentos',
        protocoloSetorialNome: 'Alimentos & Bebidas',
      },
    }
  }

  // 11. PAPEL (Papel & Celulose) - NF-e 55
  if (slug === 'papel') {
    const nNF = (220000 + idx).toString()
    const chave = gerarChaveAcesso44({
      cUF: '41',
      aamm,
      cnpjEmitente: cnpjEmit,
      modelo: '55',
      serie: '1',
      numeroDoc: nNF,
      codigoAleatorio: gerarCodigoAleatorioChave(72000000),
    })
    // Faixa realista: aparas de papelão prensado em fardos ~8 a 25 toneladas por carga
    const toneladas = Math.round((8 + prng() * 16 + (idx % 4) * 1.5) * 10) / 10
    const pesoKg = Math.round(toneladas * 1000)
    const vProd = Math.round(toneladas * 650.0 * 100) / 100
    const itens: ItemDocumentoSintetico[] = [
      {
        nItem: 1,
        cProd: `PAP-APAR-OND-${idx + 1}`,
        xProd: 'APARAS DE PAPELAO ONDULADO CLASSIFICADAS PARA RECICLAGEM (NCM 4707.10.00)',
        ncm: '4707.10.00',
        cfop: '5102',
        uCom: 'TON',
        qCom: toneladas,
        vUnCom: 650.0,
        vProd,
        categoriaMaterial: 'outros',
        pesoKg,
        fatorCo2eKg: 0,
        co2eEvitadoKg: 0,
        statusCalculo: 'em_estruturacao_de_catalogo',
      },
    ]
    const infCpl = `${MARCA_SANDBOX_OBRIGATORIA} - Protocolo Setorial 11: Papel & Celulose. CFOP 5102. NCM 4707.10.00. Logística reversa e reciclagem celulósica.`
    const xml = construirXmlNFe({
      chaveAcesso: chave,
      numero: nNF,
      serie: '1',
      dataEmissao: dataHoje,
      cnpjEmitente: cnpjEmit,
      razaoSocialEmitente: 'Klabin & Papel Reciclado Integrado S.A. (Sandbox)',
      cnpjDestinatario: cnpjDest,
      razaoSocialDestinatario: 'Embalagens & Caixas Paraná Ltda',
      valorTotal: vProd,
      itens,
      infCpl,
    })
    const hash = await calcularSha256(xml)
    return {
      id: `SYN-PAP-${idx + 1}-${chave.slice(-6)}`,
      segmento: params.segmento,
      modeloFiscal: '55',
      chaveAcesso: chave,
      numeroDocumento: nNF,
      serie: '1',
      dataEmissao: dataHoje,
      cnpjEmitente: cnpjEmit,
      razaoSocialEmitente: 'Klabin & Papel Reciclado Integrado S.A.',
      cnpjDestinatario: cnpjDest,
      razaoSocialDestinatario: 'Embalagens & Caixas Paraná Ltda',
      valorTotal: vProd,
      itens,
      xmlConteudo: xml,
      hashSha256: hash,
      dadosAdicionais: {
        marcaInfCpl: MARCA_SANDBOX_OBRIGATORIA,
        protocoloSetorialSlug: 'papel',
        protocoloSetorialNome: 'Papel & Celulose',
      },
    }
  }

  // 12. PLÁSTICOS (Plásticos & Economia Circular) - NF-e 55 (fator polímeros 1,90)
  if (slug === 'plasticos') {
    const nNF = (230000 + idx).toString()
    const chave = gerarChaveAcesso44({
      cUF: '41',
      aamm,
      cnpjEmitente: cnpjEmit,
      modelo: '55',
      serie: '1',
      numeroDoc: nNF,
      codigoAleatorio: gerarCodigoAleatorioChave(73000000),
    })
    // Faixa realista: resina termoplástica reciclada em bags ~1.500 a 7.000 kg
    const pesoKg = Math.round(1500 + prng() * 5000 + (idx % 4) * 250)
    const precoKg = Math.round((5.8 + prng() * 1.0) * 100) / 100
    const vProd = Math.round(pesoKg * precoKg * 100) / 100
    const co2e = Math.round(pesoKg * 1.9 * 100) / 100
    const itens: ItemDocumentoSintetico[] = [
      {
        nItem: 1,
        cProd: `PLA-GRAN-PP-${idx + 1}`,
        xProd: 'RESINA TERMOPLASTICA RECICLADA EM GRAOS PP/PEAD (NCM 3902.10.20)',
        ncm: '3902.10.20',
        cfop: '5102',
        uCom: 'KG',
        qCom: pesoKg,
        vUnCom: 6.2,
        vProd,
        categoriaMaterial: 'polimeros',
        pesoKg,
        fatorCo2eKg: 1.9,
        co2eEvitadoKg: co2e,
        statusCalculo: 'calculado',
        teorDeclarado:
          'Polímeros Automotivos e Termoplásticos PP (fator PlasticsEurope 1,90 kgCO₂e/kg)',
      },
    ]
    const infCpl = `${MARCA_SANDBOX_OBRIGATORIA} - Protocolo Setorial 12: Plásticos & Economia Circular. CFOP 5102. NCM 3902.10.20. Reciclagem mecânica pós-consumo.`
    const xml = construirXmlNFe({
      chaveAcesso: chave,
      numero: nNF,
      serie: '1',
      dataEmissao: dataHoje,
      cnpjEmitente: cnpjEmit,
      razaoSocialEmitente: 'Polímeros Circulares & Reciclagem Brasil S.A. (Sandbox)',
      cnpjDestinatario: cnpjDest,
      razaoSocialDestinatario: 'Indústria de Injeção Plástica Curitiba Ltda',
      valorTotal: vProd,
      itens,
      infCpl,
    })
    const hash = await calcularSha256(xml)
    return {
      id: `SYN-PLA-${idx + 1}-${chave.slice(-6)}`,
      segmento: params.segmento,
      modeloFiscal: '55',
      chaveAcesso: chave,
      numeroDocumento: nNF,
      serie: '1',
      dataEmissao: dataHoje,
      cnpjEmitente: cnpjEmit,
      razaoSocialEmitente: 'Polímeros Circulares & Reciclagem Brasil S.A.',
      cnpjDestinatario: cnpjDest,
      razaoSocialDestinatario: 'Indústria de Injeção Plástica Curitiba Ltda',
      valorTotal: vProd,
      itens,
      xmlConteudo: xml,
      hashSha256: hash,
      dadosAdicionais: {
        marcaInfCpl: MARCA_SANDBOX_OBRIGATORIA,
        protocoloSetorialSlug: 'plasticos',
        protocoloSetorialNome: 'Plásticos & Economia Circular',
      },
    }
  }

  // 13. FARMACÊUTICA (Farmacêutica & Cosmética) - NF-e 55
  if (slug === 'farmaceutica') {
    const nNF = (240000 + idx).toString()
    const chave = gerarChaveAcesso44({
      cUF: '41',
      aamm,
      cnpjEmitente: cnpjEmit,
      modelo: '55',
      serie: '1',
      numeroDoc: nNF,
      codigoAleatorio: gerarCodigoAleatorioChave(74000000),
    })
    // Faixa realista: caixas de descarte controlado de embalagens/blisters ~500 a 3.000 un
    const qCom = Math.round(500 + prng() * 2500 + (idx % 4) * 100)
    const vProd = Math.round((12000 + prng() * 18000 + (idx % 5) * 1000) * 100) / 100
    const pesoKg = Math.round(qCom * 0.35)
    const itens: ItemDocumentoSintetico[] = [
      {
        nItem: 1,
        cProd: `FAR-EMB-REV-${idx + 1}`,
        xProd: 'DESCARTE CONTROLADO DE EMBALAGENS FARMACEUTICAS BLISTER/VIDRO (NCM 3004.90.99)',
        ncm: '3004.90.99',
        cfop: '5949',
        uCom: 'UN',
        qCom,
        vUnCom: Math.round((vProd / qCom) * 100) / 100,
        vProd,
        categoriaMaterial: 'outros',
        pesoKg,
        fatorCo2eKg: 0,
        co2eEvitadoKg: 0,
        statusCalculo: 'em_estruturacao_de_catalogo',
      },
    ]
    const infCpl = `${MARCA_SANDBOX_OBRIGATORIA} - Protocolo Setorial 13: Indústria Farmacêutica & Cosmética. Logística reversa de medicamentos Decreto 10.388/2020. CFOP 5949.`
    const xml = construirXmlNFe({
      chaveAcesso: chave,
      numero: nNF,
      serie: '1',
      dataEmissao: dataHoje,
      cnpjEmitente: cnpjEmit,
      razaoSocialEmitente: 'Laboratório Farmacêutico Integrado do Sul S.A. (Sandbox)',
      cnpjDestinatario: cnpjDest,
      razaoSocialDestinatario: 'Logística Reversa & Incineração Térmica Hospitalar Ltda',
      valorTotal: vProd,
      itens,
      infCpl,
    })
    const hash = await calcularSha256(xml)
    return {
      id: `SYN-FAR-${idx + 1}-${chave.slice(-6)}`,
      segmento: params.segmento,
      modeloFiscal: '55',
      chaveAcesso: chave,
      numeroDocumento: nNF,
      serie: '1',
      dataEmissao: dataHoje,
      cnpjEmitente: cnpjEmit,
      razaoSocialEmitente: 'Laboratório Farmacêutico Integrado do Sul S.A.',
      cnpjDestinatario: cnpjDest,
      razaoSocialDestinatario: 'Logística Reversa & Incineração Térmica Hospitalar Ltda',
      valorTotal: vProd,
      itens,
      xmlConteudo: xml,
      hashSha256: hash,
      dadosAdicionais: {
        marcaInfCpl: MARCA_SANDBOX_OBRIGATORIA,
        protocoloSetorialSlug: 'farmaceutica',
        protocoloSetorialNome: 'Farmacêutica & Cosmética',
      },
    }
  }

  // 14. CONSTRUÇÃO (Construção Civil & Canteiros Verdes / construcao_rcd) - NF-e 55 (concreto 0,12 e aço 2,18)
  if (slug === 'construcao') {
    const nNF = (500000 + idx).toString()
    const chave = gerarChaveAcesso44({
      cUF: '41',
      aamm,
      cnpjEmitente: cnpjEmit,
      modelo: '55',
      serie: '1',
      numeroDoc: nNF,
      codigoAleatorio: gerarCodigoAleatorioChave(43000000),
    })
    const cfop = idx % 2 === 0 ? '5102' : '5949'
    const britaTon = Math.round((10 + prng() * 18 + (idx % 5)) * 10) / 10
    const blocosMil = Math.round((1 + prng() * 3) * 10) / 10
    const acoKg = Math.round(1800 + prng() * 3200 + (idx % 5) * 200)

    const itens: ItemDocumentoSintetico[] = [
      {
        nItem: 1,
        cProd: `RCD-AGREG-BRITA-${idx + 1}`,
        xProd: 'AGREGADO RECICLADO DE CONCRETO (BRITA RCD GRADUADA)',
        ncm: '2517.10.00',
        cfop,
        uCom: 'TON',
        qCom: britaTon,
        vUnCom: 48.0,
        vProd: Math.round(britaTon * 48.0 * 100) / 100,
        categoriaMaterial: 'concreto',
        pesoKg: Math.round(britaTon * 1000),
        fatorCo2eKg: 0.12,
        co2eEvitadoKg: Math.round(britaTon * 1000 * 0.12 * 100) / 100,
        statusCalculo: 'calculado',
      },
      {
        nItem: 2,
        cProd: `RCD-BLOCO-CONC-${idx + 1}`,
        xProd: 'BLOCO DE CONCRETO RECICLADO ESTRUTURAL 14X19X39',
        ncm: '6810.11.00',
        cfop,
        uCom: 'MIL',
        qCom: blocosMil,
        vUnCom: 2850.0,
        vProd: Math.round(blocosMil * 2850.0 * 100) / 100,
        categoriaMaterial: 'concreto',
        pesoKg: Math.round(blocosMil * 12000),
        fatorCo2eKg: 0.12,
        co2eEvitadoKg: Math.round(blocosMil * 12000 * 0.12 * 100) / 100,
        statusCalculo: 'calculado',
      },
      {
        nItem: 3,
        cProd: `RCD-ACO-ARMAD-${idx + 1}`,
        xProd: 'ACO CA-50 RECUPERADO DE DEMOLICAO CONTROLADA',
        ncm: '7214.20.00',
        cfop,
        uCom: 'KG',
        qCom: acoKg,
        vUnCom: 4.1,
        vProd: Math.round(acoKg * 4.1 * 100) / 100,
        categoriaMaterial: 'aco',
        pesoKg: acoKg,
        fatorCo2eKg: 2.18,
        co2eEvitadoKg: Math.round(acoKg * 2.18 * 100) / 100,
        statusCalculo: 'calculado',
      },
    ]
    const valorTotal = Math.round(itens.reduce((acc, it) => acc + it.vProd, 0) * 100) / 100
    const infCpl = `${MARCA_SANDBOX_OBRIGATORIA} - Protocolo Setorial 14: Construção Civil & Canteiros Verdes. CONAMA 307/2002. CFOP ${cfop}.`
    const xml = construirXmlNFe({
      chaveAcesso: chave,
      numero: nNF,
      serie: '1',
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
      segmento: params.segmento,
      modeloFiscal: '55',
      chaveAcesso: chave,
      numeroDocumento: nNF,
      serie: '1',
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
        protocoloSetorialSlug: 'construcao',
        protocoloSetorialNome: 'Construção Civil & Canteiros Verdes',
      },
    }
  }

  // 15. VAREJO (Comércio Varejista / varejo_reverso) - NF-e 55 (aço 2,18, alu 14,40, cobre 5,40, polímeros 1,90)
  if (slug === 'varejo') {
    const nNF = (400000 + idx).toString()
    const chave = gerarChaveAcesso44({
      cUF: '41',
      aamm,
      cnpjEmitente: cnpjEmit,
      modelo: '55',
      serie: '1',
      numeroDoc: nNF,
      codigoAleatorio: gerarCodigoAleatorioChave(54000000),
    })
    const cfop = idx % 3 === 0 ? '5949' : idx % 3 === 1 ? '6949' : '1949'
    const qFontes = Math.round(8 + prng() * 12 + (idx % 4))
    const qTeclados = Math.round(5 + prng() * 10 + (idx % 3))
    const qRoteadores = Math.round(3 + prng() * 8 + (idx % 3))
    const qCabosKg = Math.round((6.0 + prng() * 12.0 + (idx % 4)) * 10) / 10

    const itens: ItemDocumentoSintetico[] = [
      {
        nItem: 1,
        cProd: `RET-FONTE-AC-${idx + 1}`,
        xProd: 'FONTE CARREGADORA CHAVEADA REVERSA 65W (POLIMERO/COBRE)',
        ncm: '8504.40.10',
        cfop,
        uCom: 'UN',
        qCom: qFontes,
        vUnCom: 28.5,
        vProd: Math.round(qFontes * 28.5 * 100) / 100,
        categoriaMaterial: 'polimeros',
        pesoKg: Math.round(qFontes * 0.28 * 100) / 100,
        fatorCo2eKg: 1.9,
        co2eEvitadoKg: Math.round(qFontes * 0.28 * 1.9 * 100) / 100,
        statusCalculo: 'calculado',
      },
      {
        nItem: 2,
        cProd: `RET-PERIF-TECL-${idx + 1}`,
        xProd: 'TECLADO E PERIFERICO DESUSO CHASSI METALICO (ACO/POLIMERO)',
        ncm: '8471.60.52',
        cfop,
        uCom: 'UN',
        qCom: qTeclados,
        vUnCom: 35.0,
        vProd: Math.round(qTeclados * 35.0 * 100) / 100,
        categoriaMaterial: 'aco',
        pesoKg: Math.round(qTeclados * 0.75 * 100) / 100,
        fatorCo2eKg: 2.18,
        co2eEvitadoKg: Math.round(qTeclados * 0.75 * 2.18 * 100) / 100,
        statusCalculo: 'calculado',
      },
      {
        nItem: 3,
        cProd: `RET-ROUT-WIFI-${idx + 1}`,
        xProd: 'ROTEADOR GIGA BLINDAGEM ALUMINIO DISSIPADOR (ALUMINIO/COBRE)',
        ncm: '8517.62.77',
        cfop,
        uCom: 'UN',
        qCom: qRoteadores,
        vUnCom: 95.0,
        vProd: Math.round(qRoteadores * 95.0 * 100) / 100,
        categoriaMaterial: 'aluminio',
        pesoKg: Math.round(qRoteadores * 0.45 * 100) / 100,
        fatorCo2eKg: 14.4,
        co2eEvitadoKg: Math.round(qRoteadores * 0.45 * 14.4 * 100) / 100,
        statusCalculo: 'calculado',
      },
      {
        nItem: 4,
        cProd: `RET-CABOS-COBRE-${idx + 1}`,
        xProd: 'LOTE DE CABOS DE ENERGIA E CHICOTES DE COBRE REVERSO',
        ncm: '8504.40.10',
        cfop,
        uCom: 'KG',
        qCom: qCabosKg,
        vUnCom: 32.0,
        vProd: Math.round(qCabosKg * 32.0 * 100) / 100,
        categoriaMaterial: 'cobre',
        pesoKg: Math.round(qCabosKg * 100) / 100,
        fatorCo2eKg: 5.4,
        co2eEvitadoKg: Math.round(qCabosKg * 5.4 * 100) / 100,
        statusCalculo: 'calculado',
      },
    ]
    const valorTotal = Math.round(itens.reduce((acc, it) => acc + it.vProd, 0) * 100) / 100
    const infCpl = `${MARCA_SANDBOX_OBRIGATORIA} - Protocolo Setorial 15: Comércio Varejista. Logística reversa eletroeletrônicos. CFOP ${cfop}. PNRS Lei 12.305/2010.`
    const xml = construirXmlNFe({
      chaveAcesso: chave,
      numero: nNF,
      serie: '1',
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
      segmento: params.segmento,
      modeloFiscal: '55',
      chaveAcesso: chave,
      numeroDocumento: nNF,
      serie: '1',
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
        protocoloSetorialSlug: 'varejo',
        protocoloSetorialNome: 'Comércio Varejista, Atacado & Serviços',
      },
    }
  }

  // 16. MATERIAIS CRÍTICOS RECUPERADOS & MINERAÇÃO URBANA - NF-e 55
  // REGRA FIXA DO USUÁRIO:
  // Apenas cobre entra no cálculo de carbono (fator oficial 5,40).
  // Ouro, paládio, prata e terras raras são 100% rastreáveis com status pericial "em estruturação de catálogo"
  // e CO₂e zerado. NUNCA inventar número.
  const nNF = (600000 + idx).toString()
  const chave = gerarChaveAcesso44({
    cUF: '41',
    aamm,
    cnpjEmitente: cnpjEmit,
    modelo: '55',
    serie: '1',
    numeroDoc: nNF,
    codigoAleatorio: gerarCodigoAleatorioChave(32000000),
  })
  const cfop = idx % 2 === 0 ? '5949' : '6949'
  // Faixa realista: mineração urbana / sucata eletrônica PCI ~200 a 800 kg de fração cobre
  const pesoCobre = Math.round(200 + prng() * 500 + (idx % 6) * 20)
  const qOuroG = Math.round(80 + prng() * 120 + (idx % 5) * 10)
  const qPaladioG = Math.round(50 + prng() * 80 + (idx % 4) * 8)
  const qTerrasKg = Math.round(30 + prng() * 50 + (idx % 5) * 5)

  const itens: ItemDocumentoSintetico[] = [
    {
      nItem: 1,
      cProd: `URB-PCI-COBRE-${idx + 1}`,
      xProd: 'SUCATA DE PLACAS PCI RECUPERADA - FRACAO COBRE ELETROLITICO',
      ncm: '8534.00.00',
      cfop,
      uCom: 'KG',
      qCom: pesoCobre,
      vUnCom: 48.0,
      vProd: Math.round(pesoCobre * 48.0 * 100) / 100,
      categoriaMaterial: 'cobre',
      pesoKg: pesoCobre,
      fatorCo2eKg: 5.4,
      co2eEvitadoKg: Math.round(pesoCobre * 5.4 * 100) / 100,
      statusCalculo: 'calculado',
      teorDeclarado: 'Cobre 99,9% refinado secundário (fator oficial ICA 5,40 kgCO₂e/kg)',
    },
    {
      nItem: 2,
      cProd: `URB-PCI-OURO-AU-${idx + 1}`,
      xProd: 'FRACAO CONCENTRADA DE OURO (AU) DE CONTATOS PCI [EM ESTRUTURACAO DE CATALOGO]',
      ncm: '8534.00.00',
      cfop,
      uCom: 'G',
      qCom: qOuroG,
      vUnCom: 395.0,
      vProd: Math.round(qOuroG * 395.0 * 100) / 100,
      categoriaMaterial: 'outros',
      pesoKg: Math.round((qOuroG / 1000) * 1000) / 1000,
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
      qCom: qPaladioG,
      vUnCom: 210.0,
      vProd: Math.round(qPaladioG * 210.0 * 100) / 100,
      categoriaMaterial: 'outros',
      pesoKg: Math.round((qPaladioG / 1000) * 1000) / 1000,
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
      qCom: qTerrasKg,
      vUnCom: 180.0,
      vProd: Math.round(qTerrasKg * 180.0 * 100) / 100,
      categoriaMaterial: 'outros',
      pesoKg: qTerrasKg,
      fatorCo2eKg: 0,
      co2eEvitadoKg: 0,
      statusCalculo: 'em_estruturacao_de_catalogo',
      teorDeclarado: 'Teor declarado: 31,5% NdFeB • Sem alegação de carbono',
    },
  ]
  const valorTotal = Math.round(itens.reduce((acc, it) => acc + it.vProd, 0) * 100) / 100
  const infCpl = `${MARCA_SANDBOX_OBRIGATORIA} - Protocolo Setorial 16: Materiais Críticos Recuperados & Mineração Urbana. CFOP ${cfop}. Apenas cobre entra no cálculo de carbono (fator oficial ICA 5,40). Ouro, paládio, prata e terras raras com status pericial 'em estruturação de catálogo' e zero crédito de carbono.`
  const xml = construirXmlNFe({
    chaveAcesso: chave,
    numero: nNF,
    serie: '1',
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
    segmento: params.segmento,
    modeloFiscal: '55',
    chaveAcesso: chave,
    numeroDocumento: nNF,
    serie: '1',
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
      protocoloSetorialSlug: 'materiais-criticos-recuperados',
      protocoloSetorialNome: 'Materiais Críticos Recuperados & Mineração Urbana',
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
  roundSeed?: number
}): Promise<DocumentoSintetico[]> {
  // Se nenhuma roundSeed for fornecida, gera uma nova para cada rodada
  const roundSeed = params.roundSeed ?? gerarSementeRodada()
  const lote: DocumentoSintetico[] = []
  for (let i = 0; i < params.quantidade; i++) {
    const doc = await gerarDocumentoSintetico({
      segmento: params.segmento,
      indice: i,
      dataReferencia: params.dataReferencia,
      usarCnpjAlfanumerico: params.usarCnpjAlfanumerico ?? true,
      roundSeed,
    })
    // Grava roundSeed nos dados adicionais para rastreabilidade pericial
    doc.dadosAdicionais.roundSeed = roundSeed
    lote.push(doc)
  }
  return lote
}
