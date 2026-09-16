/**
 * SERVIÇO CLIENT-SIDE DE INTEGRAÇÃO COM PROXY INFOSIMPLES
 *
 * Comunica-se exclusivamente com a rota segura pb_hooks (/backend/v1/infosimples/*).
 * NUNCA expõe chaves ou tokens no bundle do navegador.
 * Suporta modo degradação elegante caso o token INFOSIMPLES_TOKEN não esteja no cofre.
 */

import pb from '@/lib/pocketbase/client'

export interface ConsultaInfoSimplesResponse {
  sucesso: boolean
  degradacao: boolean
  token_configurado: boolean
  chave_acesso?: string
  codigo?: number
  mensagem?: string
  custo_creditos?: number
  consulta_id?: string
  nfe_upload_id?: string
  dados?: any
  erro?: string
}

export interface CertificadoA1ConfigInput {
  cnpj_titular: string
  razao_social?: string
  senha: string
  termo_lgpd_aceito: boolean
}

/**
 * Consulta uma chave de acesso de NF-e de 44 dígitos através do hook seguro server-side.
 */
export async function consultarNFeInfoSimples(
  chaveAcesso: string,
  usarCertificadoA1 = false,
): Promise<ConsultaInfoSimplesResponse> {
  const chaveLimpa = (chaveAcesso || '').replace(/\D/g, '').trim()

  if (chaveLimpa.length !== 44) {
    throw new Error('A chave de acesso deve conter exatamente 44 dígitos numéricos.')
  }

  // Faz a requisição POST ao endpoint server-side proxy
  const res = await fetch(`${pb.baseUrl}/backend/v1/infosimples/consultar-nfe`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: pb.authStore.token ? `Bearer ${pb.authStore.token}` : '',
    },
    body: JSON.stringify({
      chave_acesso: chaveLimpa,
      usar_certificado_a1: usarCertificadoA1,
    }),
  })

  const json = await res.json()
  return json as ConsultaInfoSimplesResponse
}

/**
 * Registra dados de certificado A1 do cliente com senha cifrada no backend e consentimento LGPD
 */
export async function salvarConfigCertificadoA1(
  input: CertificadoA1ConfigInput,
): Promise<{ sucesso: boolean; mensagem: string; certificado_id?: string }> {
  const res = await fetch(`${pb.baseUrl}/backend/v1/infosimples/salvar-certificado-a1`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: pb.authStore.token ? `Bearer ${pb.authStore.token}` : '',
    },
    body: JSON.stringify(input),
  })

  const json = await res.json()
  if (!res.ok) {
    throw new Error(json.erro || json.message || 'Erro ao registrar certificado A1.')
  }
  return json
}

/**
 * Busca histórico de consultas efetuadas para rastreabilidade de custo em créditos
 */
export async function listarConsultasInfoSimples(usuarioId?: string) {
  if (!usuarioId) return []
  try {
    const list = await pb.collection('infosimples_consultas').getList(1, 20, {
      filter: `usuario = "${usuarioId}"`,
      sort: '-created',
    })
    return list.items
  } catch {
    return []
  }
}
