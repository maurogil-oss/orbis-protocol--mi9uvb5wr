import pb from '@/lib/pocketbase/client'

export type TipoPedidoLGPD =
  | 'confirmacao_existencia'
  | 'acesso_dados'
  | 'correcao'
  | 'anonimizacao_bloqueio_eliminacao'
  | 'portabilidade'
  | 'revogacao_consentimento'

export type StatusPedidoLGPD = 'recebido' | 'em_analise' | 'atendido' | 'recusado'

export interface SolicitacaoLGPD {
  id?: string
  protocolo: string
  tipo_pedido: TipoPedidoLGPD
  nome_titular: string
  email_titular: string
  cpf_cnpj_titular: string
  descricao: string
  status: StatusPedidoLGPD
  prazo_legal_dias: number
  data_limite_resposta: string
  hash_protocolo?: string
  resposta_encarregado?: string
  atendido_por?: string
  created?: string
  updated?: string
}

export interface PoliticaRetencaoLGPD {
  id?: string
  tipo_dado: string
  descricao_dado: string
  prazo_meses: number
  base_legal: string
  rotina_descarte: string
  artigo_legal?: string
  ativo?: boolean
  ultimo_expurgo?: string
  created?: string
}

export async function criarSolicitacaoLGPD(dados: {
  tipo_pedido: TipoPedidoLGPD
  nome_titular: string
  email_titular: string
  cpf_cnpj_titular: string
  descricao: string
}): Promise<SolicitacaoLGPD> {
  const agora = new Date()
  const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase()
  const protocolo = `LGPD-${agora.getFullYear()}-${randomSuffix}`

  // Prazo legal de 15 dias (Art. 19, II da LGPD)
  const dataLimite = new Date(agora.getTime() + 15 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0]

  // Hash do protocolo para integridade
  const hash = Array.from(
    new Uint8Array(
      await crypto.subtle.digest(
        'SHA-256',
        new TextEncoder().encode(
          `${protocolo}|${dados.cpf_cnpj_titular}|${dados.tipo_pedido}|${dataLimite}`,
        ),
      ),
    ),
  )
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')

  const payload = {
    protocolo,
    tipo_pedido: dados.tipo_pedido,
    nome_titular: dados.nome_titular.trim(),
    email_titular: dados.email_titular.trim().toLowerCase(),
    cpf_cnpj_titular: dados.cpf_cnpj_titular.trim(),
    descricao: dados.descricao.trim(),
    status: 'recebido' as StatusPedidoLGPD,
    prazo_legal_dias: 15,
    data_limite_resposta: dataLimite,
    hash_protocolo: hash,
  }

  const record = await pb.collection('lgpd_solicitacoes').create<SolicitacaoLGPD>(payload)
  return record
}

export async function listarSolicitacoesLGPD(): Promise<SolicitacaoLGPD[]> {
  return pb.collection('lgpd_solicitacoes').getFullList<SolicitacaoLGPD>({
    sort: '-created',
  })
}

export async function atualizarStatusSolicitacaoLGPD(
  id: string,
  status: StatusPedidoLGPD,
  resposta?: string,
  atendidoPor?: string,
): Promise<SolicitacaoLGPD> {
  return pb.collection('lgpd_solicitacoes').update<SolicitacaoLGPD>(id, {
    status,
    resposta_encarregado: resposta,
    atendido_por: atendidoPor,
  })
}

export async function listarPoliticasRetencao(): Promise<PoliticaRetencaoLGPD[]> {
  return pb.collection('lgpd_retencoes').getFullList<PoliticaRetencaoLGPD>({
    sort: 'prazo_meses',
  })
}

export async function dispararDescarteLGPD(): Promise<{
  sucesso: boolean
  mensagem: string
  total_processados: number
  corte_aplicado: string
  executado_por?: string
  data_execucao: string
}> {
  const url = `${pb.baseUrl}/backend/v1/lgpd/descarte-vencidos`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: pb.authStore.token,
    },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Erro ao disparar rotina de descarte.')
  }
  return res.json()
}
