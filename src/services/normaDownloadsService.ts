import pb from '@/lib/pocketbase/client'

export type TipoDownloadNorma = 'norma_integral' | 'csv_completo'

export interface RegistroDownloadNormaInput {
  userId?: string
  userEmail: string
  userNome?: string
  tipoDownload: TipoDownloadNorma
  termoAceito: boolean
  versaoNorma?: string
  userAgent?: string
}

export interface RegistroDownloadNormaRecord {
  id: string
  user_id?: string
  user_email: string
  user_nome?: string
  tipo_download: TipoDownloadNorma
  termo_aceito: boolean
  versao_norma?: string
  user_agent?: string
  created: string
  updated: string
}

export const TERMO_USO_NORMA_DM_ORB_001 =
  'Documento de uso restrito. Autorizado para consulta e avaliação pelo titular desta conta. Proibida a reprodução, redistribuição ou utilização comercial para replicação de metodologia concorrente. Cada acesso é registrado.'

/**
 * Registra o download da norma ou do CSV completo na coleção cdv_downloads_norma.
 * Exige aceitação expressa do termo de uso.
 */
export async function registrarDownloadNorma(
  input: RegistroDownloadNormaInput,
): Promise<{ success: boolean; id?: string; error?: string }> {
  if (!input.termoAceito) {
    return {
      success: false,
      error:
        'É obrigatório aceitar o termo de confidencialidade e uso restrito para baixar o documento.',
    }
  }

  if (!input.userEmail || !input.userEmail.trim()) {
    return {
      success: false,
      error: 'E-mail do titular da conta é obrigatório para registrar a custódia do download.',
    }
  }

  try {
    const payload = {
      user_id: input.userId || pb.authStore.record?.id || undefined,
      user_email: input.userEmail.trim().toLowerCase(),
      user_nome: input.userNome || (pb.authStore.record as any)?.name || undefined,
      tipo_download: input.tipoDownload,
      termo_aceito: true,
      versao_norma: input.versaoNorma || 'v1.1',
      user_agent:
        typeof navigator !== 'undefined' ? (navigator.userAgent || '').slice(0, 250) : undefined,
    }

    const record = await pb.collection('cdv_downloads_norma').create(payload)
    return { success: true, id: record.id }
  } catch (err: any) {
    console.error('Falha ao registrar download da norma:', err)
    return {
      success: false,
      error: err?.message || 'Falha ao registrar custódia do download.',
    }
  }
}

/**
 * Consulta histórico de downloads do usuário autenticado
 */
export async function listarDownloadsUsuario(
  userEmail?: string,
): Promise<RegistroDownloadNormaRecord[]> {
  try {
    const emailFiltro = userEmail || pb.authStore.record?.email
    const filter = emailFiltro ? `user_email = "${emailFiltro.toLowerCase()}"` : ''
    const records = await pb
      .collection('cdv_downloads_norma')
      .getList<RegistroDownloadNormaRecord>(1, 50, {
        filter,
        sort: '-created',
      })
    return records.items
  } catch (err) {
    console.warn('Erro ao listar downloads de norma:', err)
    return []
  }
}
