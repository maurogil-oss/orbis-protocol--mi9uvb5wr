import pb from '@/lib/pocketbase/client'

export interface ParceiroRecord {
  id: string
  codigo_parceiro: string
  nome: string
  cpf_cnpj: string
  contato: string
  percentual_comissao: number
  banco: string
  agencia: string
  conta: string
  chave_pix: string
  status: 'ativo' | 'inativo' | 'suspenso'
  usuario?: string
  tipo_documentacao?: 'RPA' | 'NFSe_pj'
  documento_fiscal_url?: string
  documento_fiscal_validado?: boolean
  created: string
  updated: string
}

export type ParceiroAcessoStatus = 'pendente' | 'liberado' | 'suspenso'

export async function atualizarStatusAcessoParceiro(
  userId: string,
  status: ParceiroAcessoStatus,
  motivo?: string,
): Promise<{ sucesso: boolean; novo_status: ParceiroAcessoStatus; mensagem: string }> {
  const res = await pb.send('/backend/v1/admin/parceiro-acesso', {
    method: 'POST',
    body: {
      user_id: userId,
      status,
      motivo,
    },
  })
  return res
}

export interface ComissaoRecord {
  id: string
  cobranca_id: string
  parceiro_id: string
  base_calculo: number
  percentual_aplicado: number
  valor: number
  status: 'calculada' | 'paga'
  data_pagamento?: string
  comprovante?: string
  created: string
  updated: string
  expand?: {
    cobranca_id?: any
    parceiro_id?: ParceiroRecord
  }
}

export async function listarParceiros(): Promise<ParceiroRecord[]> {
  return pb.collection('parceiros').getFullList<ParceiroRecord>({
    sort: '-created',
  })
}

export async function obterParceiroPorCodigo(codigo: string): Promise<ParceiroRecord | null> {
  try {
    return await pb
      .collection('parceiros')
      .getFirstListItem<ParceiroRecord>(`codigo_parceiro = "${codigo}"`)
  } catch (_) {
    return null
  }
}

export async function obterMeuPerfilParceiro(): Promise<ParceiroRecord | null> {
  const currentUserId = pb.authStore.record?.id
  if (!currentUserId) return null
  try {
    return await pb
      .collection('parceiros')
      .getFirstListItem<ParceiroRecord>(`usuario = "${currentUserId}"`)
  } catch (_) {
    return null
  }
}

export async function criarParceiro(dados: Partial<ParceiroRecord>): Promise<ParceiroRecord> {
  return pb.collection('parceiros').create<ParceiroRecord>(dados)
}

export async function atualizarParceiro(
  id: string,
  dados: Partial<ParceiroRecord>,
): Promise<ParceiroRecord> {
  return pb.collection('parceiros').update<ParceiroRecord>(id, dados)
}

export async function excluirParceiro(id: string): Promise<boolean> {
  return pb.collection('parceiros').delete(id)
}

export async function listarComissoes(parceiroId?: string): Promise<ComissaoRecord[]> {
  const filter = parceiroId ? `parceiro_id = "${parceiroId}"` : ''
  return pb.collection('comissoes').getFullList<ComissaoRecord>({
    filter,
    sort: '-created',
    expand: 'cobranca_id,parceiro_id',
  })
}

export async function registrarPagamentoComissao(
  comissaoId: string,
  comprovante?: string,
): Promise<ComissaoRecord> {
  return pb.collection('comissoes').update<ComissaoRecord>(comissaoId, {
    status: 'paga',
    data_pagamento: new Date().toISOString(),
    comprovante: comprovante || 'Registrado via Console de Gestão Orbis',
  })
}
