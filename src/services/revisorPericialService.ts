import pb from '@/lib/pocketbase/client'
import { ServicoCobrancaId, SERVICOS_COBRANCA } from '@/services/cobrancaService'
import { InventarioEmissoesResultado } from '@/services/motorEmissoes'

export type SeveridadeAchado = 'alta' | 'media' | 'baixa'

export interface AchadoPericial {
  id: string
  titulo: string
  severidade: SeveridadeAchado
  norma_referencia: string
  descricao: string
  impacto_risco: string
  plano_recomendado: ServicoCobrancaId
  recomendacao_acao: string
}

export interface ResultadoTriagemPericial {
  score_pericial: number // 0 a 100
  grau_conformidade: string
  achados_total: number
  achados_publicos: AchadoPericial[]
  achados_ocultos_count: number
  plano_recomendado: ServicoCobrancaId
  resumo_parecer: string
  is_demo: boolean
  empresa_nome: string
  cnpj: string
  ano_base: number
  metodologias_auditadas: string
}

export interface ExecutarTriagemInput {
  inventario_id?: string
  inventario?: InventarioEmissoesResultado
  empresa_nome?: string
  cnpj?: string
  is_demo?: boolean
}

/**
 * Dispara a revisão pericial automatizada através do backend Skip Cloud.
 * O agente audita o inventário contra critérios periciais (GHG Protocol, MCTI/SIN, GLEC, ISO 14067, IPCC AR6, SBCE).
 */
export async function dispararTriagemPericial(
  input: ExecutarTriagemInput,
): Promise<ResultadoTriagemPericial> {
  const url = `${pb.baseUrl}/backend/v1/revisor-pericial/triagem`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(pb.authStore.token ? { Authorization: pb.authStore.token } : {}),
    },
    body: JSON.stringify(input),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Erro ao executar a triagem pericial.')
  }

  return res.json()
}

/**
 * Consulta o histórico de revisões salvas para um CNPJ ou inventário.
 */
export async function listarRevisoesPericiais(cnpj?: string): Promise<any[]> {
  try {
    const filter = cnpj ? `cnpj = '${cnpj}'` : ''
    return await pb.collection('pericial_revisoes').getFullList({
      filter,
      sort: '-created',
    })
  } catch {
    return []
  }
}

/**
 * Helper para obter label amigável e texto de CTA contextual do plano
 */
export function getInfoCtaPlano(planoId: ServicoCobrancaId): {
  titulo: string
  valorFormatado: string
  descricaoCta: string
  badgeLabel: string
} {
  const info = SERVICOS_COBRANCA[planoId] || SERVICOS_COBRANCA.laudo_pericial
  if (planoId === 'assinatura_bureau') {
    return {
      titulo: 'Bureau ACP — Gestão Contínua & Curva MAC',
      valorFormatado: 'R$ 7.800',
      descricaoCta: 'Adequar com Assinatura Bureau ACP — R$ 7.800',
      badgeLabel: 'Recomendação Estrutural Contínua',
    }
  }
  if (planoId === 'diagnostico') {
    return {
      titulo: 'Diagnóstico Orbis — Validação Prévia',
      valorFormatado: 'R$ 490',
      descricaoCta: 'Iniciar com Diagnóstico Orbis — R$ 490',
      badgeLabel: 'Validação Preliminar',
    }
  }
  return {
    titulo: 'Laudo Pericial com ART / RRT',
    valorFormatado: 'R$ 2.850',
    descricaoCta: 'Corrigir com laudo chancelado — R$ 2.850',
    badgeLabel: 'Correção Pericial com Validade Jurídica',
  }
}
