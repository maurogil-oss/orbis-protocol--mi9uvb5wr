/**
 * SERVIÇO DE TRIAGEM DE INGESTÃO CDV (AGENTE NATIVO SKIP CLOUD)
 *
 * Agente: "triador-ingestao-cdv"
 * Escopo: CDVerde GERAL (15 verticais + materiais críticos, incluindo desmanche veicular).
 *
 * Princípios Fundamentais:
 * 1. Propor classificação (categoria_material no enum do banco) com justificativa.
 * 2. Sinalizar anomalias antes da gravação física (duplicidade de chave no dia, massa implausível, CNPJ inválido).
 * 3. NÃO-BLOQUEANTE: se o agente falhar ou demorar, a ingestão prossegue pelo fluxo determinístico.
 * 4. NUNCA decide nem calcula CO₂e, hash SHA-256 ou assinatura ICP-Brasil (papel do motor determinístico DM-ORB-001 v1.1).
 */

import pb from '@/lib/pocketbase/client'

export type CategoriaMaterialCdv =
  | 'aco'
  | 'aluminio'
  | 'cobre'
  | 'polimeros'
  | 'concreto'
  | 'agro_rastreado'
  | 'outros'

export type SeveridadeAnomalia = 'baixa' | 'media' | 'alta' | 'critica'

export interface AnomaliaDetectada {
  codigo:
    | 'CHAVE_DUPLICADA'
    | 'CHAVE_INVALIDA'
    | 'MASSA_INVEROSSÍMIL'
    | 'CNPJ_INVALIDO'
    | 'CAMPO_OBRIGATORIO_FALTANTE'
    | 'LOTE_SEM_PECAS'
    | 'CATEGORIA_INCONSISTENTE'
    | 'OUTRA'
  severidade: SeveridadeAnomalia
  descricao: string
  campo_afetado?: string
  sugestao_correcao?: string
}

export interface ClassificacaoPropostaItem {
  item_index: number
  descricao: string
  categoria_material: CategoriaMaterialCdv
  justificativa: string
  fator_referencia?: number | null
  observacao_metodologica?: string
}

export interface TriagemIngestaoCdvResultado {
  aprovado_para_ingestao: boolean
  nivel_risco: 'baixo' | 'medio' | 'alto' | 'bloqueante'
  resumo_triagem: string
  classificacao_proposta: ClassificacaoPropostaItem[]
  anomalias_detectadas: AnomaliaDetectada[]
}

export interface RespostaTriagemEndpoint {
  sucesso: boolean
  fonte: 'agente_nativo' | 'motor_contingencia'
  triagem: TriagemIngestaoCdvResultado
}

/**
 * Consulta a triagem prévia do agente nativo Skip Cloud de forma não-bloqueante.
 * Em caso de erro de rede ou indisponibilidade da IA, retorna null sem lançar erro,
 * permitindo que a ingestão continue normalmente.
 */
export async function consultarTriadorIngestao(
  documentoOuLote: any,
  timeoutMs: number = 8000,
): Promise<TriagemIngestaoCdvResultado | null> {
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null
  const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null

  try {
    const url = `${pb.baseUrl}/backend/v1/cdv/triagem`
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(pb.authStore.token ? { Authorization: pb.authStore.token } : {}),
      },
      body: JSON.stringify({ documento: documentoOuLote }),
      signal: controller ? controller.signal : undefined,
    })

    if (!res.ok) {
      console.warn(
        `[Triador Ingestão CDV] Endpoint respondeu status HTTP ${res.status} (não-bloqueante)`,
      )
      return null
    }

    const data: RespostaTriagemEndpoint = await res.json()
    if (data && data.sucesso && data.triagem) {
      return data.triagem
    }

    return null
  } catch (err: any) {
    // Erro não-bloqueante: a esteira principal segue intacta
    console.warn(
      '[Triador Ingestão CDV] Chamada ao agente ignorada com segurança (não-bloqueante):',
      err?.message || err,
    )
    return null
  } finally {
    if (timer) clearTimeout(timer)
  }
}

/**
 * Envia uma mensagem direta de chat para o agente nativo "triador-ingestao-cdv".
 * Útil para diálogos interativos ou perguntas sobre classificação de materiais.
 */
export async function conversarComTriadorCdv(
  mensagem: string,
  conversationId?: string | null,
): Promise<{
  content: string
  conversationId?: string
  messageId?: string
}> {
  const url = `${pb.baseUrl}/backend/v1/agent-chat`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(pb.authStore.token ? { Authorization: pb.authStore.token } : {}),
    },
    body: JSON.stringify({
      agent: 'triador-ingestao-cdv',
      message: mensagem,
      conversation_id: conversationId || null,
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || `Erro ao consultar agente triador (${res.status})`)
  }

  const json = await res.json()
  return {
    content: json.content || '',
    conversationId: json.conversation_id,
    messageId: json.message_id,
  }
}
