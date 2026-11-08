/**
 * Serviço de Gestão e Aceite de Convites de Empresas Associadas ACP (Peça 4c)
 *
 * Comunica com a coleção 'convites_acp' e os endpoints dedicados no backend:
 * - POST /backend/v1/acp/convites
 * - GET  /backend/v1/acp/convites/validar/{token}
 * - POST /backend/v1/acp/convites/aceitar
 * - GET  /backend/v1/acp/empresas-participantes
 */

import pb from '@/lib/pocketbase/client'

export type StatusConviteAcp = 'pendente' | 'usado' | 'expirado' | 'cancelado'

export interface ConviteAcpItem {
  id: string
  token: string
  empresa_nome: string
  cnpj?: string
  email: string
  status: StatusConviteAcp
  expira_em: string
  usado_em?: string
  usuario_criado?: string
  criado_por?: string
  observacoes?: string
  created: string
  updated?: string
}

export interface NovoConviteAcpPayload {
  empresa_nome: string
  email: string
  cnpj?: string
  dias_validade?: number
  observacoes?: string
}

export interface ValidacaoConviteAcpResposta {
  valido: boolean
  motivo?: string
  status?: StatusConviteAcp
  convite?: {
    id: string
    token: string
    empresa_nome: string
    cnpj?: string
    email: string
    status: StatusConviteAcp
    expira_em: string
  }
}

export interface AceitarConviteAcpPayload {
  token: string
  password: string
  nome_responsavel?: string
  cnpj?: string
}

export interface EmpresaParticipanteAcp {
  id: string
  name: string
  email: string
  cliente_codigo?: string
  cnpj?: string
  role: string
  created: string
  status_aprovacao?: string
}

/**
 * Cria um novo convite seguro para uma empresa associada ACP.
 * Requer permissão admin_acp, admin ou master.
 */
export async function criarConviteAcp(
  payload: NovoConviteAcpPayload,
): Promise<{ success: boolean; convite: ConviteAcpItem; linkConvite: string; mensagem: string }> {
  const cleanNome = payload.empresa_nome.trim()
  const cleanEmail = payload.email.trim().toLowerCase()
  const cleanCnpj = payload.cnpj ? payload.cnpj.trim() : ''
  const diasValidade = payload.dias_validade || 7

  if (!cleanNome) {
    throw new Error('O nome da empresa associada é obrigatório.')
  }
  if (!cleanEmail || !cleanEmail.includes('@')) {
    throw new Error('Informe um e-mail válido para o convite.')
  }

  // Tenta via endpoint do backend PocketBase
  try {
    const res = await pb.send('/backend/v1/acp/convites', {
      method: 'POST',
      body: {
        empresa_nome: cleanNome,
        email: cleanEmail,
        cnpj: cleanCnpj,
        dias_validade: diasValidade,
        observacoes: payload.observacoes?.trim() || '',
      },
    })

    const token = res.convite.token
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    const linkConvite = `${origin}/convite/${token}`

    return {
      success: true,
      convite: res.convite,
      linkConvite,
      mensagem: res.mensagem || 'Convite gerado com sucesso.',
    }
  } catch (err: unknown) {
    // Fallback defensivo via SDK direto se o endpoint falhar
    const agora = new Date()
    const expiraEm = new Date(agora.getTime() + diasValidade * 24 * 60 * 60 * 1000).toISOString()
    const randPart =
      Math.random().toString(36).substring(2, 12) + Math.random().toString(36).substring(2, 12)
    const token = `acp_${randPart}_${Date.now()}`

    const rec = await pb.collection('convites_acp').create<ConviteAcpItem>({
      token,
      empresa_nome: cleanNome,
      email: cleanEmail,
      cnpj: cleanCnpj,
      status: 'pendente',
      expira_em: expiraEm,
      criado_por: pb.authStore.record?.id || '',
      observacoes: payload.observacoes?.trim() || '',
    })

    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    const linkConvite = `${origin}/convite/${token}`

    return {
      success: true,
      convite: rec,
      linkConvite,
      mensagem: 'Convite ACP gerado com sucesso.',
    }
  }
}

/**
 * Valida o token do convite antes de exibir o formulário de cadastro.
 * Endpoint público seguro.
 */
export async function validarTokenConviteAcp(token: string): Promise<ValidacaoConviteAcpResposta> {
  const cleanToken = (token || '').trim()
  if (!cleanToken) {
    return {
      valido: false,
      motivo: 'Token de convite não informado.',
    }
  }

  try {
    const res = await pb.send(
      `/backend/v1/acp/convites/validar/${encodeURIComponent(cleanToken)}`,
      {
        method: 'GET',
      },
    )
    return res as ValidacaoConviteAcpResposta
  } catch (err: any) {
    // Se o backend retornou 410 com payload de motivo
    if (err && err.response && err.response.motivo) {
      return {
        valido: false,
        motivo: err.response.motivo,
        status: err.response.status,
      }
    }
    // Fallback de consulta direta caso o hook não responda
    try {
      const rec = await pb
        .collection('convites_acp')
        .getFirstListItem<ConviteAcpItem>(`token = "${cleanToken}"`)

      const agora = new Date()
      const expira = new Date(rec.expira_em)

      if (rec.status === 'usado') {
        return {
          valido: false,
          motivo: 'Este convite já foi utilizado para cadastrar a empresa associada.',
          status: 'usado',
        }
      }
      if (rec.status === 'cancelado') {
        return {
          valido: false,
          motivo: 'Este convite foi cancelado pela administração da ACP.',
          status: 'cancelado',
        }
      }
      if (agora > expira || rec.status === 'expirado') {
        return {
          valido: false,
          motivo: 'Este convite expirou. Solicite um novo link de convite à ACP.',
          status: 'expirado',
        }
      }

      return {
        valido: true,
        convite: {
          id: rec.id,
          token: rec.token,
          empresa_nome: rec.empresa_nome,
          cnpj: rec.cnpj,
          email: rec.email,
          status: rec.status,
          expira_em: rec.expira_em,
        },
      }
    } catch (_) {
      return {
        valido: false,
        motivo: 'Convite não encontrado. Verifique se o endereço foi digitado corretamente.',
      }
    }
  }
}

/**
 * Conclui o cadastro vinculado da empresa associada via convite.
 * Cria conta com papel cliente_acp e marca convite como 'usado'.
 */
export async function aceitarConviteAcp(payload: AceitarConviteAcpPayload): Promise<{
  success: boolean
  mensagem: string
  usuario?: { id: string; email: string; name: string; role: string; cliente_codigo?: string }
}> {
  const cleanToken = payload.token.trim()
  if (!cleanToken) {
    throw new Error('Token de convite obrigatório.')
  }
  if (!payload.password || payload.password.length < 8) {
    throw new Error('A senha deve conter no mínimo 8 caracteres.')
  }

  try {
    const res = await pb.send('/backend/v1/acp/convites/aceitar', {
      method: 'POST',
      body: {
        token: cleanToken,
        password: payload.password,
        nome_responsavel: payload.nome_responsavel?.trim() || '',
        cnpj: payload.cnpj?.trim() || '',
      },
    })
    return res
  } catch (err: any) {
    const msg =
      err?.response?.error ||
      err?.message ||
      'Falha ao cadastrar a empresa associada via convite. Tente novamente.'
    throw new Error(msg)
  }
}

/**
 * Lista todos os convites gerados para acompanhamento no Painel ACP.
 * Requer admin_acp, admin ou master.
 */
export async function listarConvitesAcp(): Promise<ConviteAcpItem[]> {
  try {
    const records = await pb.collection('convites_acp').getFullList<ConviteAcpItem>({
      sort: '-created',
    })

    // Atualização em memória defensiva de status expirado
    const agora = new Date()
    return records.map((rec) => {
      if (rec.status === 'pendente' && new Date(rec.expira_em) < agora) {
        return { ...rec, status: 'expirado' }
      }
      return rec
    })
  } catch (err) {
    console.log('[acpConvitesService] Aviso ao listar convites:', err)
    return []
  }
}

/**
 * Lista as empresas participantes vinculadas à ACP (role = 'cliente_acp').
 * Requer admin_acp, admin ou master.
 */
export async function listarEmpresasParticipantesAcp(): Promise<EmpresaParticipanteAcp[]> {
  try {
    const res = await pb.send('/backend/v1/acp/empresas-participantes', {
      method: 'GET',
    })
    if (res && Array.isArray(res.empresas)) {
      return res.empresas
    }
  } catch {
    /* intentionally ignored */
  }

  // Fallback via SDK
  try {
    const users = await pb.collection('users').getList(1, 100, {
      filter: 'role = "cliente_acp"',
      sort: '-created',
    })

    return users.items.map((u: any) => ({
      id: u.id,
      name: u.name || u.email,
      email: u.email,
      cliente_codigo: u.cliente_codigo,
      cnpj: u.cnpj,
      role: u.role,
      created: u.created,
      status_aprovacao: u.status_aprovacao || 'aprovado',
    }))
  } catch (err) {
    console.log('[acpConvitesService] Aviso ao listar empresas participantes:', err)
    return []
  }
}

/**
 * Gera URL absoluta de convite dado um token.
 */
export function gerarUrlConvite(token: string): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  return `${origin}/convite/${token}`
}
