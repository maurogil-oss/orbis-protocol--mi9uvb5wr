import pb from '@/lib/pocketbase/client'

export type ServicoCobrancaId = 'diagnostico' | 'laudo_pericial' | 'assinatura_bureau'

export type StatusCobranca = 'pendente' | 'pendente_simulacao' | 'pago' | 'expirado' | 'cancelado'

export interface ServicoPrecoInfo {
  id: ServicoCobrancaId
  nome: string
  valor: number
  descricao: string
  detalhes: string[]
}

export const SERVICOS_COBRANCA: Record<ServicoCobrancaId, ServicoPrecoInfo> = {
  diagnostico: {
    id: 'diagnostico',
    nome: 'Diagnóstico Orbis',
    valor: 490,
    descricao: 'Primeiro resultado prévio validado, com Hash de integridade e demais entregas.',
    detalhes: [
      'Primeiro resultado prévio validado por CNPJ',
      'Hash de integridade criptográfica dMRV',
      'Emissão do Selo Oficial Orbis Protocol',
      'Atestado preparatório para exigências ESG bancárias (Res. BCB 4.945/2021)',
    ],
  },
  laudo_pericial: {
    id: 'laudo_pericial',
    nome: 'Laudo Pericial com ART',
    valor: 2850,
    descricao:
      'Chancela de perito homologado, auditoria técnica aprofundada e apuração probatória.',
    detalhes: [
      'Tudo do Diagnóstico Orbis',
      'Chancela de perito homologado com ART/RRT acoplada',
      'Laudo pericial emitido sob a norma NBC TO 3000 do CFC',
      'Dossiê preparatório para créditos do Programa MOVER e Green Capital',
      'Ingestão de XMLs de NF-e e conciliação probatória',
    ],
  },
  assinatura_bureau: {
    id: 'assinatura_bureau',
    nome: 'Bureau ACP',
    valor: 7800,
    descricao: 'Gestão contínua, passaportes do fornecedor e dossiê BRDE/fomento.',
    detalhes: [
      'Tudo do Laudo Pericial com ART',
      'Gestão contínua e Cockpit do Bureau ACP',
      'Passaporte Digital do Fornecedor com revelação seletiva',
      'Dossiê contínuo de elegibilidade para linhas BRDE e fomento',
      'Curva MAC personalizada (Custo Marginal de Abatimento)',
      'Selo Oficial ACP / IBESG com QR Code verificável',
    ],
  },
}

export interface CobrancaRecord {
  id: string
  usuario: string
  servico_id: ServicoCobrancaId | string
  servico_nome: string
  valor: number
  status: StatusCobranca
  tomador_nome: string
  tomador_cpf_cnpj: string
  tomador_email: string
  tomador_endereco?: string
  provider: string
  provider_payment_id?: string
  txid: string
  qr_code_payload?: string
  qr_code_base64?: string
  url_comprovante?: string
  data_expiracao?: string
  hash_integridade?: string
  data_pagamento?: string
  nfse_numero?: string
  nfse_serie?: string
  nfse_verificacao?: string
  nfse_url?: string
  nfse_status?: string
  parceiro_id?: string
  codigo_indicacao?: string
  liquidado_por?: string
  liquidado_em?: string
  liquidacao_justificativa?: string
  liquidacao_comprovante_ref?: string
  origem_preco?: 'catalogo' | 'contingencia' | string
  divergencia_preco?: boolean
  ciclo_recorrencia?: string
  created: string
  updated: string
  expand?: {
    parceiro_id?: any
    usuario?: any
  }
}

export interface CriarCobrancaPixInput {
  servico_id: ServicoCobrancaId | string
  tomador_nome: string
  tomador_cpf_cnpj: string
  tomador_email: string
  tomador_endereco?: string
  usuario?: string
  ref?: string
  codigo_indicacao?: string
}

export interface CriarCobrancaPixResponse {
  cobranca_id: string
  servico_id: ServicoCobrancaId
  servico_nome: string
  valor: number
  status: StatusCobranca
  txid: string
  provider_payment_id: string
  qr_code_payload: string
  qr_code_base64?: string
  data_expiracao: string
  modo_degradacao: boolean
  aviso_gateway: string
  hash_integridade: string
  origem_preco?: string
  divergencia_preco?: boolean
}

export async function criarCobrancaPix(
  input: CriarCobrancaPixInput,
): Promise<CriarCobrancaPixResponse> {
  const url = `${pb.baseUrl}/backend/v1/cobranca/pix`
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
    throw new Error(err.error || 'Erro ao gerar cobrança PIX.')
  }

  return res.json()
}

export async function verificarCiclosAssinatura(): Promise<{
  sucesso: boolean
  data_verificacao: string
  cobrancas_geradas: number
  cobrancas_vencidas: number
  users_atualizados: number
}> {
  const url = `${pb.baseUrl}/backend/v1/assinaturas/verificar-ciclo`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(pb.authStore.token ? { Authorization: pb.authStore.token } : {}),
    },
    body: JSON.stringify({}),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Erro ao sincronizar ciclos de assinatura.')
  }

  return res.json()
}

export async function consultarCobranca(cobrancaId: string): Promise<CobrancaRecord> {
  return pb.collection('cobrancas').getOne<CobrancaRecord>(cobrancaId)
}

export async function listarMinhasCobrancas(): Promise<CobrancaRecord[]> {
  return pb.collection('cobrancas').getFullList<CobrancaRecord>({
    sort: '-created',
  })
}

export interface ConfirmarPagamentoManualInput {
  cobranca_id: string
  justificativa?: string
  comprovante_ref?: string
  confirmacao_dupla?: boolean
  is_manual?: boolean
  liquidado_por?: string
}

export async function confirmarPagamentoSimulado(
  inputOrId: string | ConfirmarPagamentoManualInput,
): Promise<{
  id: string
  status: StatusCobranca
  data_pagamento: string
  liquidado_por?: string
  liquidado_em?: string
  liquidacao_justificativa?: string
  liquidacao_comprovante_ref?: string
  nfse_status: string
  nfse_numero?: string
  nfse_serie?: string
  nfse_verificacao?: string
  nfse_url?: string
}> {
  const payload = typeof inputOrId === 'string' ? { cobranca_id: inputOrId } : inputOrId
  const url = `${pb.baseUrl}/backend/v1/cobranca/confirmar-simulacao`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(pb.authStore.token ? { Authorization: pb.authStore.token } : {}),
    },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Erro ao confirmar pagamento.')
  }

  return res.json()
}

export async function emitirNfse(cobrancaId: string): Promise<{
  cobranca_id: string
  nfse_status: string
  nfse_numero: string
  nfse_serie: string
  nfse_verificacao: string
  nfse_url: string
  aviso?: string | null
}> {
  const url = `${pb.baseUrl}/backend/v1/nfse/emissao`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(pb.authStore.token ? { Authorization: pb.authStore.token } : {}),
    },
    body: JSON.stringify({ cobranca_id: cobrancaId }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Erro ao emitir NFS-e.')
  }

  return res.json()
}
