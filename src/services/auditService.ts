import pb from '@/lib/pocketbase/client'

export interface AuditLogRecord {
  id: string
  acao: string
  entidade: string
  entidade_id?: string
  registro_id?: string
  ator_id?: string
  ator_email?: string
  papel?: string
  detalhes?: any
  ip?: string
  created: string
  updated: string
}

export interface ListarAuditLogsParams {
  entidade?: string
  ator?: string
  acao?: string
  dataInicio?: string
  dataFim?: string
  page?: number
  perPage?: number
}

/**
 * Registra um evento no audit_log através de rota segura ou chamada client autenticada (quando hook)
 * Como a coleção audit_log é createRule: null, o cliente não pode criar diretamente via collection.create.
 * Para eventos originados da UI autorizada pelo admin (ex: redefinição de senha ou log frontend),
 * o backend expõe routerAdd('POST', '/backend/v1/audit/registrar') ou hooks gravam diretamente.
 */
export async function registrarEventoAudit(evento: {
  acao: string
  entidade: string
  entidade_id?: string
  detalhes?: any
}): Promise<boolean> {
  try {
    const res = await pb.send('/backend/v1/audit/registrar', {
      method: 'POST',
      body: evento,
    })
    return Boolean(res?.sucesso)
  } catch (err) {
    console.warn('[auditService] Aviso ao registrar evento:', err)
    return false
  }
}

/**
 * Lista registros da trilha de auditoria append-only
 * Acesso exclusivo para admin e financeiro_leitor
 */
export async function listarAuditLogs(
  params: ListarAuditLogsParams = {},
): Promise<{ items: AuditLogRecord[]; totalItems: number }> {
  const filters: string[] = []

  if (params.entidade && params.entidade !== 'todas') {
    filters.push(`entidade = '${params.entidade}'`)
  }

  if (params.acao && params.acao !== 'todas') {
    filters.push(`acao = '${params.acao}'`)
  }

  if (params.ator) {
    const atorTrim = params.ator.trim()
    filters.push(`(ator_email ~ '${atorTrim}' || ator_id ~ '${atorTrim}')`)
  }

  if (params.dataInicio) {
    filters.push(`created >= '${params.dataInicio} 00:00:00'`)
  }

  if (params.dataFim) {
    filters.push(`created <= '${params.dataFim} 23:59:59'`)
  }

  const filterStr = filters.join(' && ')

  const result = await pb
    .collection('audit_log')
    .getList<AuditLogRecord>(params.page || 1, params.perPage || 50, {
      filter: filterStr,
      sort: '-created',
    })

  return {
    items: result.items,
    totalItems: result.totalItems,
  }
}

/**
 * Dispara anulação formal de documento DPP (Peça, Lote, Destinação ou Selo)
 * Exclusivo de Admin, gravando no audit_log
 */
export async function anularDocumentoDpp(params: {
  tipo: 'peca' | 'lote' | 'destinacao' | 'selo'
  id: string
  motivo: string
}): Promise<{ sucesso: boolean; mensagem: string; status: string }> {
  return pb.send('/backend/v1/dpp/anular', {
    method: 'POST',
    body: params,
  })
}
