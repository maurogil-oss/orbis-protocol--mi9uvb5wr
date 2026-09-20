/**
 * SERVIÇO OPERACIONAL CDV (CENTRO DE DESMONTAGEM VEICULAR)
 * Módulo para ingestão em lotes, geração de Passaportes Digitais de Peça (DPP),
 * cálculo de CO2e evitado por fatores materiais oficiais, chaves de API e integração pública.
 */
import pb from '@/lib/pocketbase/client'
import type { RecordModel } from 'pocketbase'

export interface FatorCdvMaterial {
  categoria: 'aco' | 'aluminio' | 'cobre' | 'polimeros' | 'outros'
  nome: string
  fatorKgCO2ePorKg: number
  fonte: string
  ano: number
}

export const FATORES_CDV_MATERIAIS: Record<string, FatorCdvMaterial> = {
  aco: {
    categoria: 'aco',
    nome: 'Aço Laminado / Estampado',
    fatorKgCO2ePorKg: 2.85,
    fonte: 'WorldSteel / IED / MCTI',
    ano: 2024,
  },
  aluminio: {
    categoria: 'aluminio',
    nome: 'Alumínio Primário Automotivo',
    fatorKgCO2ePorKg: 8.2,
    fonte: 'International Aluminium Institute (IAI)',
    ano: 2023,
  },
  cobre: {
    categoria: 'cobre',
    nome: 'Cobre / Bobinamentos Elétricos',
    fatorKgCO2ePorKg: 5.4,
    fonte: 'International Copper Association (ICA)',
    ano: 2023,
  },
  polimeros: {
    categoria: 'polimeros',
    nome: 'Polímeros Automotivos (PP / EPDM / ABS)',
    fatorKgCO2ePorKg: 1.9,
    fonte: 'PlasticsEurope LCA Dataset',
    ano: 2023,
  },
  outros: {
    categoria: 'outros',
    nome: 'Outros Materiais (Estimativa Conservadora)',
    fatorKgCO2ePorKg: 1.5,
    fonte: 'Orbis dMRV Baseline Conservadora',
    ano: 2024,
  },
}

export interface CdvLoteRecord extends RecordModel {
  cdv_nome: string
  cdv_cnpj: string
  cdv_codigo: string
  api_key_hash?: string
  veiculo_marca_modelo: string
  veiculo_chassi?: string
  veiculo_placa?: string
  veiculo_baixa_detran: string
  veiculo_seguradora?: string
  origem_envio: 'erp' | 'ecommerce' | 'manual_api' | 'planilha'
  status: 'processado' | 'parcial' | 'rejeitado' | 'anulado'
  motivo_anulacao?: string
  anulado_em?: string
  anulado_por?: string
  total_pecas: number
  total_peso_kg: number
  total_co2e_evitado_kg: number
  payload_bruto_json?: any
  is_demo?: boolean
  cartela_desmontagem?: string
  ctf_ibama?: string
  selo_detran_lote?: string
}

export interface CdvPecaRecord extends RecordModel {
  lote: string
  sku_interno: string
  selo_dpp: string
  descricao_peca: string
  categoria_material: 'aco' | 'aluminio' | 'cobre' | 'polimeros' | 'outros'
  material_declarado: string
  peso_kg: number
  ncm?: string
  fator_co2e_kg: number
  co2e_evitado_kg: number
  hash_sha256: string
  responsavel_crea?: string
  cdv_origem?: string
  cdv_cnpj?: string
  status: 'ativo' | 'reutilizado' | 'descartado' | 'anulado'
  motivo_anulacao?: string
  anulado_em?: string
  anulado_por?: string
  veiculo_marca_modelo?: string
  veiculo_chassi_mascarado?: string
  veiculo_baixa_detran?: string
  veiculo_seguradora?: string
  subsistema?: string
  lr_decreto_11413?: 'sujeito_lr_11413' | 'convencional'
  lr_categoria?: string
}

export interface CdvApiKeyRecord extends RecordModel {
  cdv_nome: string
  cdv_cnpj: string
  cdv_codigo?: string
  chave_prefixo: string
  chave_hash: string
  chave_mascarada: string
  ativa: boolean
  ultimo_uso?: string
}

export interface DppConsultaRecord extends RecordModel {
  alvo_tipo: 'lote' | 'selo'
  alvo_identificador: string
  lote_id?: string
  canal: 'qr' | 'web' | 'embed'
  hash_conferido: boolean
  hash_calculado?: string
  ip_mascarado?: string
  user_agent?: string
  created: string
}

export interface RegistrarConsultaDppInput {
  alvo_tipo: 'lote' | 'selo'
  alvo_identificador: string
  lote_id?: string
  canal: 'qr' | 'web' | 'embed'
  hash_conferido: boolean
  hash_calculado?: string
}

export interface IngestaoLoteInput {
  cdv: {
    nome: string
    cnpj: string
    codigo?: string
    responsavel_crea?: string
  }
  veiculo_doador: {
    marca_modelo: string
    chassi?: string
    placa?: string
    baixa_detran: string
    seguradora_sinistro?: string
  }
  pecas: Array<{
    sku: string
    descricao: string
    material: string
    peso_kg: number
    ncm?: string
    responsavel_crea?: string
  }>
  origem?: 'erp' | 'ecommerce' | 'manual_api' | 'planilha'
}

export interface IngestaoLoteResponse {
  sucesso: boolean
  lote_id: string
  cdv_origem: string
  veiculo_doador: {
    marca_modelo: string
    baixa_detran: string
    chassi_mascarado: string
    seguradora_sinistro?: string | null
  }
  total_processado: number
  total_pecas_criadas: number
  total_peso_kg: number
  total_co2e_evitado_kg: number
  pecas: Array<{
    indice: number
    sku_interno: string
    selo_dpp: string
    descricao: string
    peso_kg: number
    material_categoria: string
    fator_aplicado: number
    incerteza_material: boolean
    ncm?: string
    co2e_evitado_kg: number
    hash_sha256: string
    passaporte_url: string
  }>
  erros_por_item?: Array<{
    indice: number
    sku: string
    erro: string
  }>
  erro?: string
}

/**
 * Recalcula o Hash SHA-256 canônico da peça no frontend para auditoria e verificação de integridade
 */
export async function calcularHashCanonicalPeca(peca: {
  selo_dpp: string
  sku_interno: string
  descricao_peca: string
  peso_kg: number
  co2e_evitado_kg: number
  veiculo_baixa_detran?: string
  cdv_cnpj?: string
}): Promise<string> {
  const baixaNorm = (peca.veiculo_baixa_detran || '').toUpperCase().trim()
  const cnpjNorm = (peca.cdv_cnpj || '').trim()
  const canonicalStr = `${peca.selo_dpp}|${peca.sku_interno}|${peca.descricao_peca}|${Number(peca.peso_kg).toFixed(2)}|${Number(peca.co2e_evitado_kg).toFixed(2)}|${baixaNorm}|${cnpjNorm}`

  const encoder = new TextEncoder()
  const data = encoder.encode(canonicalStr)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Consulta pública de uma peça pelo selo DPP (sem login)
 */
/**
 * Calcula o hash SHA-256 verificável de integridade de um Lote Consolidado de Peças.
 * Padrão adotado na plataforma: SHA-256 sobre a concatenação ordenada lexicograficamente dos hashes individuais
 * de cada peça (ou canônico selo|sku|peso|co2e quando não houver hash individual pré-gravado).
 */
export async function calcularHashCanonicalLote(
  lote: {
    id?: string
    cdv_cnpj?: string
    veiculo_baixa_detran?: string
  },
  pecas: Array<{
    selo_dpp: string
    hash_sha256?: string
    sku_interno?: string
    peso_kg?: number
    co2e_evitado_kg?: number
  }>,
): Promise<string> {
  if (!pecas || pecas.length === 0) {
    const rawVazio = `LOTE_VAZIO|${lote.id || ''}|${lote.cdv_cnpj || ''}|${lote.veiculo_baixa_detran || ''}`
    const encoder = new TextEncoder()
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(rawVazio))
    return Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
  }

  // Ordenação lexicográfica estrita dos hashes ou selos das peças
  const hashesOrdenados = pecas
    .map((p) => {
      if (p.hash_sha256 && p.hash_sha256.trim()) {
        return p.hash_sha256.trim().toLowerCase()
      }
      return `${p.selo_dpp}|${p.sku_interno || ''}|${Number(p.peso_kg || 0).toFixed(2)}|${Number(p.co2e_evitado_kg || 0).toFixed(2)}`
    })
    .sort()

  const concatenacao = `${lote.id || ''}|${(lote.cdv_cnpj || '').trim()}|${(lote.veiculo_baixa_detran || '').trim()}|${hashesOrdenados.join('|')}`
  const encoder = new TextEncoder()
  const data = encoder.encode(concatenacao)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * Consulta pública de um lote consolidado por ID ou por código de baixa do DETRAN (sem login)
 */
export async function consultarLoteConsolidado(
  loteIdOuBaixa: string,
): Promise<{ lote: CdvLoteRecord; pecas: CdvPecaRecord[] } | null> {
  const param = loteIdOuBaixa.trim()
  if (!param) return null

  try {
    let lote: CdvLoteRecord | null = null

    // 1. Tentar buscar direto por ID do lote (15 chars alfanuméricos padrão PocketBase)
    if (/^[a-z0-9]{15}$/i.test(param)) {
      try {
        lote = await pb.collection('cdv_lotes').getOne<CdvLoteRecord>(param)
      } catch {
        lote = null
      }
    }

    // 2. Se não encontrou por ID ou não é um ID alfanumérico de 15 chars, buscar por baixa DETRAN, cartela de desmontagem, ou código
    if (!lote) {
      const cleanParam = param.replace(/"/g, '\\"')
      try {
        lote = await pb
          .collection('cdv_lotes')
          .getFirstListItem<CdvLoteRecord>(
            `veiculo_baixa_detran = "${cleanParam}" || id = "${cleanParam}" || cdv_codigo = "${cleanParam}" || cartela_desmontagem = "${cleanParam}" || selo_detran_lote = "${cleanParam}"`,
          )
      } catch {
        // Tentar busca sem case ou com trim caso tenha variação de espaçamento
        try {
          lote = await pb
            .collection('cdv_lotes')
            .getFirstListItem<CdvLoteRecord>(
              `veiculo_baixa_detran ~ "${cleanParam}" || cartela_desmontagem ~ "${cleanParam}"`,
            )
        } catch {
          lote = null
        }
      }
    }

    if (!lote) {
      return null
    }

    // 3. Buscar todas as peças vinculadas ao lote
    const pecas = await pb.collection('cdv_pecas').getFullList<CdvPecaRecord>({
      filter: `lote = "${lote.id}"`,
      sort: 'categoria_material,descricao_peca',
    })

    return { lote, pecas }
  } catch {
    return null
  }
}

export async function consultarPassaportePorSelo(selo: string): Promise<CdvPecaRecord | null> {
  const seloNorm = selo.trim().toUpperCase()
  try {
    const record = await pb
      .collection('cdv_pecas')
      .getFirstListItem<CdvPecaRecord>(`selo_dpp = "${seloNorm}"`)
    return record
  } catch {
    return null
  }
}

/**
 * Dispara ingestão via endpoint REST /backend/v1/cdv/lotes
 */
export async function enviarLoteCdvApi(
  payload: IngestaoLoteInput,
  apiKey: string,
): Promise<IngestaoLoteResponse> {
  const res = await fetch(`${pb.baseUrl}/backend/v1/cdv/lotes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': apiKey,
    },
    body: JSON.stringify(payload),
  })

  const json = await res.json()
  if (!res.ok && !json.sucesso) {
    throw new Error(json.erro || `Falha na requisição HTTP (status ${res.status})`)
  }
  return json as IngestaoLoteResponse
}

/**
 * Lista lotes de um CDV (por CNPJ ou geral para o cliente logado)
 */
export async function listarLotesCdv(cnpj?: string): Promise<CdvLoteRecord[]> {
  try {
    const filter = cnpj ? `cdv_cnpj = "${cnpj}"` : ''
    return await pb.collection('cdv_lotes').getFullList<CdvLoteRecord>({
      filter: filter || undefined,
      sort: '-created',
    })
  } catch {
    return []
  }
}

/**
 * Lista peças de um lote específico
 */
export async function listarPecasPorLote(loteId: string): Promise<CdvPecaRecord[]> {
  try {
    return await pb.collection('cdv_pecas').getFullList<CdvPecaRecord>({
      filter: `lote = "${loteId}"`,
      sort: '-created',
    })
  } catch {
    return []
  }
}

/**
 * Busca ou gera a chave de API do CDV para o CNPJ
 */
export async function obterOuCriarApiKeyCdv(params: {
  cdvNome: string
  cdvCnpj: string
  cdvCodigo?: string
}): Promise<{ chaveCompleta?: string; record: CdvApiKeyRecord }> {
  try {
    const existing = await pb
      .collection('cdv_api_keys')
      .getFirstListItem<CdvApiKeyRecord>(`cdv_cnpj = "${params.cdvCnpj}" && ativa = true`)
    return { record: existing }
  } catch {
    // Gerar nova chave
    const randomHex = Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
    const rawKey = `orb_cdv_live_${randomHex}`

    // Hash da chave
    const encoder = new TextEncoder()
    const data = encoder.encode(rawKey)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashHex = Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')

    const masked = `orb_cdv_live_...${rawKey.slice(-6)}`

    const rec = await pb.collection('cdv_api_keys').create<CdvApiKeyRecord>({
      cdv_nome: params.cdvNome,
      cdv_cnpj: params.cdvCnpj,
      cdv_codigo: params.cdvCodigo || 'DETRAN-PR-CDV-0089',
      chave_prefixo: 'orb_cdv_live_',
      chave_hash: hashHex,
      chave_mascarada: masked,
      ativa: true,
    })

    return { chaveCompleta: rawKey, record: rec }
  }
}

/**
 * Regenera chave de API para o CDV
 */
export async function regenerarApiKeyCdv(
  cdvCnpj: string,
  cdvNome: string,
  cdvCodigo?: string,
): Promise<{ novaChave: string; record: CdvApiKeyRecord }> {
  const randomHex = Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
  const rawKey = `orb_cdv_live_${randomHex}`

  const encoder = new TextEncoder()
  const data = encoder.encode(rawKey)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashHex = Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')

  const masked = `orb_cdv_live_...${rawKey.slice(-6)}`

  // Desativa anteriores
  try {
    const olds = await pb
      .collection('cdv_api_keys')
      .getFullList<CdvApiKeyRecord>({ filter: `cdv_cnpj = "${cdvCnpj}"` })
    for (const old of olds) {
      await pb.collection('cdv_api_keys').update(old.id, { ativa: false })
    }
  } catch {
    /* intentionally ignored */
  }

  const rec = await pb.collection('cdv_api_keys').create<CdvApiKeyRecord>({
    cdv_nome: cdvNome,
    cdv_cnpj: cdvCnpj,
    cdv_codigo: cdvCodigo || 'DETRAN-PR-CDV-0089',
    chave_prefixo: 'orb_cdv_live_',
    chave_hash: hashHex,
    chave_mascarada: masked,
    ativa: true,
  })

  return { novaChave: rawKey, record: rec }
}

// Controle de debounce em memória para evitar registros duplicados em recarregamento imediato
const consultasEmVooDebounce = new Map<string, number>()

/**
 * Registra o acesso a um DPP (Lote ou Peça Individual) via endpoint de auditoria do PocketBase.
 * Captura IP real no backend e mascara estritamente segundo a LGPD (mantém apenas 2 octetos).
 * Idempotente com janela de 10 segundos para não inflar métricas com F5 ou recargas consecutivas.
 */
export async function registrarConsultaDpp(
  input: RegistrarConsultaDppInput,
): Promise<{ sucesso: boolean; record?: Partial<DppConsultaRecord> }> {
  const chaveDebounce = `${input.alvo_tipo}:${input.alvo_identificador}:${input.canal}`
  const agora = Date.now()
  const ultimoRegistro = consultasEmVooDebounce.get(chaveDebounce)

  if (ultimoRegistro && agora - ultimoRegistro < 10000) {
    return { sucesso: true }
  }
  consultasEmVooDebounce.set(chaveDebounce, agora)

  try {
    const res = await fetch(`${pb.baseUrl}/backend/v1/cdv/consultas`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    })

    if (!res.ok) {
      // Fallback: se o endpoint customizado falhar por algum motivo, tentar gravação direta na coleção pública
      try {
        const direto = await pb.collection('dpp_consultas').create({
          alvo_tipo: input.alvo_tipo,
          alvo_identificador: input.alvo_identificador,
          lote_id: input.lote_id || '',
          canal: input.canal,
          hash_conferido: input.hash_conferido,
          hash_calculado: input.hash_calculado || '',
          ip_mascarado: 'xxx.xxx.xxx.xxx',
        })
        return { sucesso: true, record: direto as any }
      } catch {
        return { sucesso: false }
      }
    }

    const data = await res.json()
    return { sucesso: true, record: data }
  } catch {
    // Tentar fallback direto via SDK PocketBase (RLS createRule vazia "")
    try {
      const direto = await pb.collection('dpp_consultas').create({
        alvo_tipo: input.alvo_tipo,
        alvo_identificador: input.alvo_identificador,
        lote_id: input.lote_id || '',
        canal: input.canal,
        hash_conferido: input.hash_conferido,
        hash_calculado: input.hash_calculado || '',
        ip_mascarado: 'xxx.xxx.xxx.xxx',
      })
      return { sucesso: true, record: direto as any }
    } catch {
      return { sucesso: false }
    }
  }
}

/**
 * Consulta o histórico de verificações recentes de um lote ou selo específico.
 * Se autenticado, lê de dpp_consultas.
 */
export async function obterHistoricoConsultasDpp(
  alvoIdentificador: string,
  loteId?: string,
  limit: number = 5,
): Promise<{ total: number; ultimas: DppConsultaRecord[] }> {
  try {
    const norm = alvoIdentificador.trim().toUpperCase()
    let filter = `alvo_identificador = "${norm}"`
    if (loteId && loteId.trim()) {
      filter = `alvo_identificador = "${norm}" || lote_id = "${loteId.trim()}"`
    }

    const result = await pb.collection('dpp_consultas').getList<DppConsultaRecord>(1, limit, {
      filter,
      sort: '-created',
      requestKey: null,
    })

    return {
      total: result.totalItems,
      ultimas: result.items,
    }
  } catch {
    // Fallback gracioso caso usuário não esteja logado e a listRule requeira autenticação
    return {
      total: 0,
      ultimas: [],
    }
  }
}

/**
 * Consulta todas as verificações DPP para o console do CDV (exige autenticação)
 */
export async function listarTodasConsultasDpp(limit: number = 500): Promise<DppConsultaRecord[]> {
  try {
    return await pb.collection('dpp_consultas').getFullList<DppConsultaRecord>({
      sort: '-created',
      batch: limit,
      requestKey: null,
    })
  } catch {
    return []
  }
}
