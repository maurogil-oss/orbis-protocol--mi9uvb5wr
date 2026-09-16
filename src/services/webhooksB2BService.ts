import { pb } from '@/lib/pocketbase/client'

export interface WebhookConfigRecord {
  id: string
  usuario: string
  nome_aplicacao: string
  url_destino: string
  secret_hmac: string
  eventos_ativos: string[]
  ativo: boolean
  descricao?: string
  created: string
  updated: string
}

export interface WebhookEntregaRecord {
  id: string
  webhook_config?: string
  usuario?: string
  evento: string
  url_destino: string
  payload_json: any
  signature_hmac?: string
  http_status?: number
  status_entrega: 'sucesso' | 'falha' | 'em_processamento'
  resposta_corpo?: string
  tempo_resposta_ms?: number
  tentativa?: number
  created: string
  updated: string
}

export const EVENTOS_WEBHOOK_DISPONIVEIS = [
  {
    id: 'lote_cdv_recebido',
    nome: 'Lote CDV Recebido',
    desc: 'Disparado quando um novo lote de peças automotivas é ingerido via API',
  },
  {
    id: 'selo_emitido',
    nome: 'Selo / DPP Homologado',
    desc: 'Disparado ao emitir um novo Selo ou Passaporte Digital',
  },
  {
    id: 'inventario_concluido',
    nome: 'Inventário dMRV Concluído',
    desc: 'Disparado ao finalizar a apuração de emissões com memorial',
  },
  {
    id: 'relatorio_gerado',
    nome: 'Dossiê / Laudo Pericial Gerado',
    desc: 'Disparado quando o laudo PDF é assinado e compilado',
  },
  {
    id: 'cobranca_confirmada',
    nome: 'Pagamento PIX Confirmado',
    desc: 'Disparado na liquidação financeira das taxas do laudo',
  },
]

/**
 * Gera um segredo aleatório HMAC SHA-256
 */
export function gerarSegredoHmac(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = 'whsec_'
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

/**
 * Lista webhooks configurados para o usuário
 */
export async function listarWebhooksUsuario(usuarioId: string): Promise<WebhookConfigRecord[]> {
  const records = await pb.collection('webhooks_config').getFullList<WebhookConfigRecord>({
    filter: `usuario = '${usuarioId}'`,
    sort: '-created',
  })
  return records
}

/**
 * Cria uma nova configuração de webhook B2B
 */
export async function criarWebhookConfig(input: {
  nome_aplicacao: string
  url_destino: string
  secret_hmac: string
  eventos_ativos: string[]
  descricao?: string
}): Promise<WebhookConfigRecord> {
  const userId = pb.authStore.model?.id
  if (!userId) throw new Error('Usuário não autenticado')

  const record = await pb.collection('webhooks_config').create<WebhookConfigRecord>({
    usuario: userId,
    nome_aplicacao: input.nome_aplicacao.trim(),
    url_destino: input.url_destino.trim(),
    secret_hmac: input.secret_hmac.trim(),
    eventos_ativos: input.eventos_ativos,
    ativo: true,
    descricao: input.descricao?.trim() || '',
  })
  return record
}

/**
 * Atualiza configuração de webhook
 */
export async function atualizarWebhookConfig(
  id: string,
  dados: Partial<{
    nome_aplicacao: string
    url_destino: string
    secret_hmac: string
    eventos_ativos: string[]
    ativo: boolean
    descricao: string
  }>,
): Promise<WebhookConfigRecord> {
  const record = await pb.collection('webhooks_config').update<WebhookConfigRecord>(id, dados)
  return record
}

/**
 * Remove webhook
 */
export async function excluirWebhookConfig(id: string): Promise<boolean> {
  await pb.collection('webhooks_config').delete(id)
  return true
}

/**
 * Lista histórico de entregas de webhooks para o cliente
 */
export async function listarEntregasWebhooks(
  usuarioId: string,
  limit: number = 30,
): Promise<WebhookEntregaRecord[]> {
  const records = await pb.collection('webhooks_entregas').getList<WebhookEntregaRecord>(1, limit, {
    filter: `usuario = '${usuarioId}'`,
    sort: '-created',
  })
  return records.items
}

/**
 * Executa disparo de teste manual na API
 */
export async function testarDisparoWebhook(
  webhookConfigId: string,
  evento?: string,
): Promise<{
  ok: boolean
  http_status: number
  status_entrega: string
  tempo_resposta_ms: number
  resposta_corpo: string
  signature_gerada: string
  payload_enviado: any
}> {
  const res = await pb.send<{
    ok: boolean
    http_status: number
    status_entrega: string
    tempo_resposta_ms: number
    resposta_corpo: string
    signature_gerada: string
    payload_enviado: any
  }>('/backend/v1/orbis/webhooks/testar', {
    method: 'POST',
    body: {
      webhook_config_id: webhookConfigId,
      evento: evento || 'teste_conexao',
    },
  })
  return res
}
