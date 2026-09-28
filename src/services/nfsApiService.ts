import pb from '@/lib/pocketbase/client'

export interface EmpresaApiKeyNfsRecord {
  id: string
  usuario: string
  empresa_nome: string
  cnpj_vinculado: string
  chave_prefixo: string
  chave_hash: string
  chave_mascarada?: string
  ativa: boolean
  ultimo_uso?: string
  requests_count_1min?: number
  data_revogacao?: string
  motivo_revogacao?: string
  created: string
  updated: string
}

export interface NfsApiLoteLogRecord {
  id: string
  usuario?: string
  cnpj_vinculado: string
  api_key_hash: string
  total_recebidos: number
  total_aceitos: number
  total_rejeitados: number
  status: 'processado' | 'parcial' | 'rejeitado'
  ip_origem?: string
  resumo_processamento_json?: {
    aceitos_resumo?: Array<{ chave: string; valor: number }>
    rejeicoes?: Array<{
      indice?: number
      chave_acesso?: string
      nome_arquivo?: string
      erro: string
    }>
  }
  created: string
  updated: string
}

export interface DocumentoXmlInput {
  xml: string
  nome_arquivo?: string
}

export interface LoteNfsEnvioInput {
  documentos: Array<DocumentoXmlInput | string>
}

export interface NfsItemAceito {
  indice: number
  nfe_id: string
  chave_acesso: string
  numero_nota: string
  serie: string
  data_emissao: string
  cnpj_emitente: string
  cnpj_destinatario: string
  valor_total: number
  valor_pis: number
  valor_cofins: number
  valor_icms: number
  qtd_itens: number
  combustivel_detectado?: { tipo: string; litros: number } | null
}

export interface NfsItemRejeitado {
  indice: number
  chave_acesso?: string
  nome_arquivo?: string
  erro: string
  motivo?: string
}

export interface RespostaLoteNfs {
  sucesso: boolean
  status: 'processado' | 'parcial' | 'rejeitado'
  lote_id?: string
  cnpj_vinculado: string
  total_recebidos: number
  total_aceitos: number
  total_rejeitados: number
  documentos_aceitos: NfsItemAceito[]
  rejeicoes: NfsItemRejeitado[]
  erro?: string
}

/**
 * Obtém a chave de API ativa para o CNPJ e usuário, ou cria se não existir.
 */
export async function obterOuCriarApiKeyNfs(params: {
  empresaNome: string
  cnpj: string
  usuarioId?: string
}): Promise<{ chaveCompleta?: string; record: EmpresaApiKeyNfsRecord }> {
  const cleanCnpj = params.cnpj.replace(/\D/g, '')

  // 1. Tentar buscar chave ativa existente
  try {
    const filter = `cnpj_vinculado = "${cleanCnpj}" && ativa = true`
    const existing = await pb
      .collection('empresa_api_keys_nfs')
      .getFirstListItem<EmpresaApiKeyNfsRecord>(filter)
    return { record: existing }
  } catch {
    // Continua para criação de nova chave
  }

  // 2. Gerar nova chave segura de 32 bytes hexadecimais
  const randomHex = Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
  const rawKey = `orb_nfs_live_${randomHex}`

  // 3. Hash SHA-256
  const encoder = new TextEncoder()
  const data = encoder.encode(rawKey)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashHex = Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')

  const masked = `orb_nfs_live_...${rawKey.slice(-6)}`
  const userId = params.usuarioId || pb.authStore.record?.id || ''

  const rec = await pb.collection('empresa_api_keys_nfs').create<EmpresaApiKeyNfsRecord>({
    usuario: userId,
    empresa_nome: params.empresaNome || 'Empresa Emissora',
    cnpj_vinculado: cleanCnpj,
    chave_prefixo: 'orb_nfs_live_',
    chave_hash: hashHex,
    chave_mascarada: masked,
    ativa: true,
  })

  return { chaveCompleta: rawKey, record: rec }
}

/**
 * Revoga uma chave de API existente
 */
export async function revogarApiKeyNfs(
  keyId: string,
  motivo: string = 'Revogação manual solicitada pelo administrador no Hub Fiscal',
): Promise<EmpresaApiKeyNfsRecord> {
  const agora = new Date().toISOString()
  return await pb.collection('empresa_api_keys_nfs').update<EmpresaApiKeyNfsRecord>(keyId, {
    ativa: false,
    data_revogacao: agora,
    motivo_revogacao: motivo,
  })
}

/**
 * Regenera (revoga anterior e gera nova) a chave de API de NFs
 */
export async function regenerarApiKeyNfs(params: {
  empresaNome: string
  cnpj: string
  usuarioId?: string
}): Promise<{ novaChave: string; record: EmpresaApiKeyNfsRecord }> {
  const cleanCnpj = params.cnpj.replace(/\D/g, '')

  // Revoga as anteriores do mesmo CNPJ
  try {
    const list = await pb.collection('empresa_api_keys_nfs').getFullList<EmpresaApiKeyNfsRecord>({
      filter: `cnpj_vinculado = "${cleanCnpj}" && ativa = true`,
    })
    for (const old of list) {
      await revogarApiKeyNfs(old.id, 'Chave substituída por regeneração no Hub Conexão Fiscal')
    }
  } catch {
    /* ignora */
  }

  // Gera a nova
  const randomHex = Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
  const rawKey = `orb_nfs_live_${randomHex}`

  const encoder = new TextEncoder()
  const data = encoder.encode(rawKey)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashHex = Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')

  const masked = `orb_nfs_live_...${rawKey.slice(-6)}`
  const userId = params.usuarioId || pb.authStore.record?.id || ''

  const rec = await pb.collection('empresa_api_keys_nfs').create<EmpresaApiKeyNfsRecord>({
    usuario: userId,
    empresa_nome: params.empresaNome || 'Empresa Emissora',
    cnpj_vinculado: cleanCnpj,
    chave_prefixo: 'orb_nfs_live_',
    chave_hash: hashHex,
    chave_mascarada: masked,
    ativa: true,
  })

  return { novaChave: rawKey, record: rec }
}

/**
 * Lista as chaves de API do usuário/empresa
 */
export async function listarApiKeysNfs(cnpj?: string): Promise<EmpresaApiKeyNfsRecord[]> {
  try {
    let filter = ''
    if (cnpj) {
      const clean = cnpj.replace(/\D/g, '')
      filter = `cnpj_vinculado = "${clean}"`
    }
    return await pb.collection('empresa_api_keys_nfs').getFullList<EmpresaApiKeyNfsRecord>({
      filter,
      sort: '-created',
    })
  } catch {
    return []
  }
}

/**
 * Lista os registros de auditoria de lotes de NFs
 */
export async function listarLogsLotesNfs(
  cnpj?: string,
  limit: number = 20,
): Promise<NfsApiLoteLogRecord[]> {
  try {
    let filter = ''
    if (cnpj) {
      const clean = cnpj.replace(/\D/g, '')
      filter = `cnpj_vinculado = "${clean}"`
    }
    const result = await pb.collection('nfs_api_lotes_log').getList<NfsApiLoteLogRecord>(1, limit, {
      filter,
      sort: '-created',
    })
    return result.items
  } catch {
    return []
  }
}

/**
 * Envia um lote de XMLs de NF-e para a rota de ingestão backend
 */
export async function enviarLoteNfsApi(
  apiKey: string,
  lote: LoteNfsEnvioInput,
): Promise<RespostaLoteNfs> {
  const url = `${pb.baseUrl}/backend/v1/nfs/lotes`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': apiKey,
    },
    body: JSON.stringify(lote),
  })

  const json = await res.json()
  if (!res.ok) {
    throw new Error(json.erro || `Falha na requisição: status ${res.status}`)
  }
  return json as RespostaLoteNfs
}
