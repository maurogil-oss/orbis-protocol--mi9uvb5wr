import pb from '@/lib/pocketbase/client'
import type { RecordModel } from 'pocketbase'

export type TipoPendenciaColeta =
  | 'nota_fiscal_destinador'
  | 'foto_pesagem'
  | 'art_responsavel_tecnico'
  | 'baixa_detran'
  | 'mtr_sinir'
  | 'termo_descontaminacao'
  | 'laudo_pericial'
  | 'outro'

export type StatusPendenciaColeta = 'pendente' | 'preenchida' | 'cancelada'

export interface CdvLotePendenciaRecord extends RecordModel {
  lote: string
  titulo: string
  descricao?: string
  tipo_pendencia?: TipoPendenciaColeta
  respondente_nome: string
  respondente_email: string
  respondente_papel?: string
  status: StatusPendenciaColeta
  data_atribuicao?: string
  data_resolucao?: string
  resolvido_por_nome?: string
  resolvido_por_email?: string
  comprovante_documento_ref?: string
  observacao_resolucao?: string
  created: string
  updated: string
}

export interface CriarPendenciaInput {
  loteId: string
  titulo: string
  descricao?: string
  tipo_pendencia?: TipoPendenciaColeta
  respondente_nome: string
  respondente_email: string
  respondente_papel?: string
}

export interface ResolverPendenciaInput {
  pendenciaId: string
  resolvido_por_nome?: string
  resolvido_por_email?: string
  comprovante_documento_ref?: string
  observacao_resolucao?: string
}

export interface ResumoPendenciasLote {
  total: number
  resolvidas: number
  pendentes: number
  canceladas: number
  percentualConcluido: number
  statusTexto: string // ex: "3 de 5 pendências resolvidas"
  todasResolvidas: boolean
}

export const ROTULOS_TIPOS_PENDENCIA: Record<TipoPendenciaColeta, string> = {
  nota_fiscal_destinador: 'Nota Fiscal do Destinador / Reciclador',
  foto_pesagem: 'Foto / Registro de Pesagem',
  art_responsavel_tecnico: 'ART do Responsável Técnico (CREA/CFT)',
  baixa_detran: 'Comprovante de Baixa DETRAN',
  mtr_sinir: 'Manifesto de Transporte (MTR / SINIR)',
  termo_descontaminacao: 'Termo de Descontaminação / Drenagem',
  laudo_pericial: 'Laudo Pericial Complementar',
  outro: 'Outro Documento / Evidência',
}

/**
 * Calcula o resumo consolidado de pendências resolvidas vs total para um lote (ex.: 3 de 5 resolvidas).
 * Pendências canceladas não contam no denominador ativo nem no numerador de resolvidas.
 */
export function calcularResumoPendencias(
  pendencias: CdvLotePendenciaRecord[],
): ResumoPendenciasLote {
  const ativas = pendencias.filter((p) => p.status !== 'cancelada')
  const total = ativas.length
  const resolvidas = ativas.filter((p) => p.status === 'preenchida').length
  const pendentes = ativas.filter((p) => p.status === 'pendente').length
  const canceladas = pendencias.filter((p) => p.status === 'cancelada').length

  const percentualConcluido = total > 0 ? Math.round((resolvidas / total) * 100) : 100
  const statusTexto =
    total === 0 ? 'Sem pendências atribuídas' : `${resolvidas} de ${total} pendências resolvidas`
  const todasResolvidas = total === 0 || resolvidas === total

  return {
    total,
    resolvidas,
    pendentes,
    canceladas,
    percentualConcluido,
    statusTexto,
    todasResolvidas,
  }
}

/**
 * Lista pendências atribuídas a um lote
 */
export async function listarPendenciasDoLote(loteId: string): Promise<CdvLotePendenciaRecord[]> {
  if (!loteId) return []
  try {
    return await pb.collection('cdv_lote_pendencias').getFullList<CdvLotePendenciaRecord>({
      filter: `lote = "${loteId.replace(/"/g, '\\"')}"`,
      sort: '-created',
      requestKey: null,
    })
  } catch (err: any) {
    console.warn(
      `[cdvPendenciasService] Erro ao listar pendências do lote ${loteId}:`,
      err?.message,
    )
    return []
  }
}

/**
 * Cria uma nova pendência atribuída a um respondente no fluxo de coleta do lote
 */
export async function criarPendenciaLote(
  input: CriarPendenciaInput,
): Promise<CdvLotePendenciaRecord> {
  if (!input.loteId) throw new Error('Identificador do lote é obrigatório.')
  if (!input.titulo?.trim()) throw new Error('Título da pendência é obrigatório.')
  if (!input.respondente_nome?.trim()) throw new Error('Nome do respondente é obrigatório.')
  if (!input.respondente_email?.trim()) throw new Error('E-mail do respondente é obrigatório.')

  const nowIso = new Date().toISOString()
  const payload = {
    lote: input.loteId,
    titulo: input.titulo.trim(),
    descricao: input.descricao?.trim() || '',
    tipo_pendencia: input.tipo_pendencia || 'outro',
    respondente_nome: input.respondente_nome.trim(),
    respondente_email: input.respondente_email.trim().toLowerCase(),
    respondente_papel: input.respondente_papel?.trim() || 'Operação / Desmonte',
    status: 'pendente',
    data_atribuicao: nowIso,
  }

  return await pb.collection('cdv_lote_pendencias').create<CdvLotePendenciaRecord>(payload)
}

/**
 * Marca uma pendência como preenchida/resolvida
 */
export async function resolverPendenciaLote(
  input: ResolverPendenciaInput,
): Promise<CdvLotePendenciaRecord> {
  if (!input.pendenciaId) throw new Error('Identificador da pendência é obrigatório.')

  const nowIso = new Date().toISOString()
  const payload: Partial<CdvLotePendenciaRecord> = {
    status: 'preenchida',
    data_resolucao: nowIso,
    resolvido_por_nome: input.resolvido_por_nome || 'Usuário Autenticado',
    resolvido_por_email: input.resolvido_por_email || '',
    comprovante_documento_ref: input.comprovante_documento_ref?.trim() || '',
    observacao_resolucao: input.observacao_resolucao?.trim() || '',
  }

  return await pb
    .collection('cdv_lote_pendencias')
    .update<CdvLotePendenciaRecord>(input.pendenciaId, payload)
}

/**
 * Reabre uma pendência marcada como resolvida voltando ao status pendente
 */
export async function reabrirPendenciaLote(pendenciaId: string): Promise<CdvLotePendenciaRecord> {
  if (!pendenciaId) throw new Error('Identificador da pendência é obrigatório.')

  return await pb.collection('cdv_lote_pendencias').update<CdvLotePendenciaRecord>(pendenciaId, {
    status: 'pendente',
    data_resolucao: '',
    observacao_resolucao: '',
  })
}

/**
 * Cancela uma pendência que não seja mais necessária
 */
export async function cancelarPendenciaLote(
  pendenciaId: string,
  motivo?: string,
): Promise<CdvLotePendenciaRecord> {
  if (!pendenciaId) throw new Error('Identificador da pendência é obrigatório.')

  return await pb.collection('cdv_lote_pendencias').update<CdvLotePendenciaRecord>(pendenciaId, {
    status: 'cancelada',
    observacao_resolucao: motivo || 'Cancelada pela gestão do lote',
  })
}
