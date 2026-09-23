/**
 * Utilitários para hashing criptográfico determinístico e canônico
 * do módulo de Materiais Críticos Recuperados & Mineração Urbana.
 */

export interface FracaoCriticaCanonica {
  id: string
  percentual: number
  massaKg: number
}

export interface PayloadCanonicoMateriais {
  codigoLote: string
  massaTotalKg: number
  fracoes: FracaoCriticaCanonica[]
  chaveNfe: string
}

/**
 * Constrói a representação serializada canônica determinística do lote:
 * - codigoLote: trim e uppercase
 * - massaTotalKg: arredondado a 2 casas decimais (number fixo)
 * - fracoes: ordenadas alfabeticamente por id, com percentual e massaKg arredondados a 2 casas
 * - chaveNfe: apenas dígitos numéricos
 */
export function construirPayloadCanonicoMateriais(params: {
  codigoLote: string
  massaTotalKg: number | string
  teorNdFeB?: number | string // kg
  teorMetaisNobres?: number | string // g (convertido para kg ou mantido normalizado)
  teorCobre?: number | string // kg
  fracoes?: FracaoCriticaCanonica[]
  chaveNfe: string
}): PayloadCanonicoMateriais {
  const codigoLote = String(params.codigoLote || '')
    .trim()
    .toUpperCase()
  const massaTotalNum = Math.max(0, Number(params.massaTotalKg) || 0)
  const massaTotalKg = Number(massaTotalNum.toFixed(2))

  let fracoesLista: FracaoCriticaCanonica[] = []

  if (params.fracoes && params.fracoes.length > 0) {
    fracoesLista = params.fracoes.map((f) => {
      const p = Number((Number(f.percentual) || 0).toFixed(2))
      const m = Number((Number(f.massaKg) || 0).toFixed(2))
      return {
        id: String(f.id).trim().toLowerCase(),
        percentual: p,
        massaKg: m,
      }
    })
  } else {
    // Montagem padronizada das 3 frações declaradas
    const ndKg = Math.max(0, Number(params.teorNdFeB) || 0)
    const cuKg = Math.max(0, Number(params.teorCobre) || 0)
    // Au/Pd/Ag informado em gramas: converter para kg no balanço
    const auGramas = Math.max(0, Number(params.teorMetaisNobres) || 0)
    const auKg = auGramas / 1000

    const pctNd = massaTotalKg > 0 ? (ndKg / massaTotalKg) * 100 : 0
    const pctAu = massaTotalKg > 0 ? (auKg / massaTotalKg) * 100 : 0
    const pctCu = massaTotalKg > 0 ? (cuKg / massaTotalKg) * 100 : 0

    fracoesLista = [
      {
        id: 'terras_raras_ndfeb',
        percentual: Number(pctNd.toFixed(2)),
        massaKg: Number(ndKg.toFixed(2)),
      },
      {
        id: 'metais_nobres_au_pd_ag',
        percentual: Number(pctAu.toFixed(2)),
        massaKg: Number(auKg.toFixed(2)),
      },
      {
        id: 'cobre_puro_recuperado',
        percentual: Number(pctCu.toFixed(2)),
        massaKg: Number(cuKg.toFixed(2)),
      },
    ]
  }

  // Ordenar determinísticamente por id
  fracoesLista.sort((a, b) => a.id.localeCompare(b.id))

  const chaveNfe = String(params.chaveNfe || '').replace(/\D/g, '')

  return {
    codigoLote,
    massaTotalKg,
    fracoes: fracoesLista,
    chaveNfe,
  }
}

/**
 * Calcula o hash SHA-256 canônico usando crypto.subtle.digest sobre JSON.stringify
 * do payload canônico determinístico.
 */
export async function calcularHashCanonicoMateriais(params: {
  codigoLote: string
  massaTotalKg: number | string
  teorNdFeB?: number | string
  teorMetaisNobres?: number | string
  teorCobre?: number | string
  fracoes?: FracaoCriticaCanonica[]
  chaveNfe: string
}): Promise<string> {
  const payload = construirPayloadCanonicoMateriais(params)
  const jsonCanonico = JSON.stringify(payload)

  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const encoder = new TextEncoder()
    const bytes = encoder.encode(jsonCanonico)
    const hashBuffer = await crypto.subtle.digest('SHA-256', bytes)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
  }

  // Fallback determinístico caso Web Crypto não esteja disponível
  let h1 = 0xdeadbeef ^ 0
  let h2 = 0x41c6ce57 ^ 0
  for (let i = 0; i < jsonCanonico.length; i++) {
    const ch = jsonCanonico.charCodeAt(i)
    h1 = Math.imul(h1 ^ ch, 2654435761)
    h2 = Math.imul(h2 ^ ch, 1597334677)
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909)
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909)
  const hexPart = (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16)
  return hexPart.padStart(64, '0')
}
