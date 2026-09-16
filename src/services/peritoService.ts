import pb from '@/lib/pocketbase/client'

export const TERMO_CREDENCIAMENTO_VERSAO = 'v1.0-2025'

export interface PeritoCredenciamentoRecord {
  id: string
  usuario?: string
  nome_completo: string
  cpf: string
  conselho_tipo: 'CREA' | 'CRC' | 'CRQ' | 'CRBio' | 'OAB' | 'OUTRO'
  registro_profissional: string
  registro_uf: string
  email_corporativo: string
  telefone: string
  areas_atuacao: string[]
  numero_art_rrt?: string
  documento_art_pdf?: string
  termo_versao: string
  consentimento_data_hora: string
  consentimento_ip?: string
  status: 'pendente' | 'aprovado' | 'rejeitado'
  observacao_auditor?: string
  aprovado_por?: string
  data_decisao?: string
  created: string
  updated: string
}

export interface SolicitarCredenciamentoInput {
  nome_completo: string
  cpf: string
  conselho_tipo: 'CREA' | 'CRC' | 'CRQ' | 'CRBio' | 'OAB' | 'OUTRO'
  registro_profissional: string
  registro_uf: string
  email_corporativo: string
  telefone: string
  areas_atuacao: string[]
  numero_art_rrt?: string
  documento_art_arquivo?: File | null
  aceite_termo: boolean
}

/**
 * Submete solicitação pública de credenciamento pericial
 */
export async function submeterCredenciamentoPerito(
  input: SolicitarCredenciamentoInput,
): Promise<PeritoCredenciamentoRecord> {
  const formData = new FormData()

  if (pb.authStore.model?.id) {
    formData.append('usuario', pb.authStore.model.id)
  }

  formData.append('nome_completo', input.nome_completo.trim())
  formData.append('cpf', input.cpf.trim())
  formData.append('conselho_tipo', input.conselho_tipo)
  formData.append('registro_profissional', input.registro_profissional.trim())
  formData.append('registro_uf', input.registro_uf.toUpperCase().trim())
  formData.append('email_corporativo', input.email_corporativo.toLowerCase().trim())
  formData.append('telefone', input.telefone.trim())
  formData.append('areas_atuacao', JSON.stringify(input.areas_atuacao))
  if (input.numero_art_rrt) {
    formData.append('numero_art_rrt', input.numero_art_rrt.trim())
  }
  if (input.documento_art_arquivo) {
    formData.append('documento_art_pdf', input.documento_art_arquivo)
  }

  formData.append('termo_versao', TERMO_CREDENCIAMENTO_VERSAO)
  formData.append('consentimento_data_hora', new Date().toISOString())
  formData.append('status', 'pendente')
  formData.append(
    'observacao_auditor',
    'Credenciamento submetido via portal. Aguardando conferência documental.',
  )

  const record = await pb
    .collection('perito_credenciamentos')
    .create<PeritoCredenciamentoRecord>(formData)
  return record
}

/**
 * Lista credenciamentos para a fila do auditor
 */
export async function listarCredenciamentosPeritos(
  statusFiltro?: string,
): Promise<PeritoCredenciamentoRecord[]> {
  const filter = statusFiltro && statusFiltro !== 'todos' ? `status = '${statusFiltro}'` : ''
  const records = await pb
    .collection('perito_credenciamentos')
    .getFullList<PeritoCredenciamentoRecord>({
      filter,
      sort: '-created',
    })
  return records
}

/**
 * Decisão do auditor sobre o credenciamento (aprovar ou rejeitar)
 */
export async function julgarCredenciamentoPerito(params: {
  id: string
  status: 'aprovado' | 'rejeitado'
  observacao_auditor?: string
  aprovado_por?: string
  usuarioId?: string
}): Promise<PeritoCredenciamentoRecord> {
  const updateData: Record<string, any> = {
    status: params.status,
    observacao_auditor: params.observacao_auditor || '',
    aprovado_por: params.aprovado_por || pb.authStore.model?.email || 'auditor_orbis',
    data_decisao: new Date().toISOString(),
  }

  const updatedRecord = await pb
    .collection('perito_credenciamentos')
    .update<PeritoCredenciamentoRecord>(params.id, updateData)

  // Se aprovado e temos um usuarioId associado, atualiza a role do usuário para 'perito'
  if (params.status === 'aprovado') {
    const targetUserId = params.usuarioId || updatedRecord.usuario
    if (targetUserId) {
      try {
        await pb.collection('users').update(targetUserId, {
          role: 'perito',
        })
      } catch (e) {
        console.warn('[julgarCredenciamentoPerito] Não foi possível atualizar role do usuário:', e)
      }
    }
  }

  return updatedRecord
}

/**
 * Busca credenciamento aprovado do perito autenticado para exibição no Laudo
 */
export async function buscarCredenciamentoAtivoPerito(
  usuarioId: string,
): Promise<PeritoCredenciamentoRecord | null> {
  try {
    const records = await pb
      .collection('perito_credenciamentos')
      .getList<PeritoCredenciamentoRecord>(1, 1, {
        filter: `usuario = '${usuarioId}' && status = 'aprovado'`,
        sort: '-created',
      })
    return records.items[0] || null
  } catch (_) {
    return null
  }
}
