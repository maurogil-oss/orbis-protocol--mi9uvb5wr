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
  termo_versao?: string
  arquivo_base64?: string
  arquivo_nome?: string
  validade_certificado?: string
}

export interface CertificadoA1Status {
  id: string
  cnpj_titular: string
  razao_social?: string
  ativo: boolean
  status_custodia?: 'ativo' | 'revogado' | 'expirado'
  termo_versao?: string
  termo_lgpd_aceito?: boolean
  data_aceite_lgpd?: string
  consentimento_ip?: string
  consentimento_data_hora?: string
  data_revogacao?: string
  motivo_revogacao?: string
  arquivo_pfx?: string
  validade_certificado?: string
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
export async function salvarConfigCertificadoA1(input: CertificadoA1ConfigInput): Promise<{
  sucesso: boolean
  mensagem: string
  certificado_id?: string
  cnpj_titular?: string
  razao_social?: string
  arquivo_pfx?: string
  validade_certificado?: string
  consentimento_ip?: string
  consentimento_data_hora?: string
  termo_versao?: string
  status_custodia?: string
}> {
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
 * Revogação instantânea da custódia do Certificado A1 nos servidores.
 * Executa zeramento de chave criptográfica e remoção de arquivo.
 */
export async function revogarCertificadoA1(motivo = 'Revogação voluntária pelo titular'): Promise<{
  sucesso: boolean
  mensagem: string
  data_revogacao: string
  status_custodia: string
}> {
  const res = await fetch(`${pb.baseUrl}/backend/v1/infosimples/revogar-certificado-a1`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: pb.authStore.token ? `Bearer ${pb.authStore.token}` : '',
    },
    body: JSON.stringify({ motivo }),
  })

  const json = await res.json()
  if (!res.ok) {
    throw new Error(json.erro || json.message || 'Erro ao revogar certificado A1.')
  }
  return json
}

/**
 * Obtém o status atual do certificado A1 do usuário autenticado
 */
export async function obterStatusCertificadoA1(
  usuarioId?: string,
): Promise<CertificadoA1Status | null> {
  if (!usuarioId) return null
  try {
    const records = await pb.collection('cliente_certificados_a1').getList(1, 1, {
      filter: `usuario = "${usuarioId}"`,
      sort: '-created',
    })
    if (records.items.length === 0) return null
    const rec = records.items[0]
    return {
      id: rec.id,
      cnpj_titular: rec.getString('cnpj_titular'),
      razao_social: rec.getString('razao_social'),
      ativo: rec.getBool('ativo'),
      status_custodia:
        (rec.getString('status_custodia') as any) || (rec.getBool('ativo') ? 'ativo' : 'revogado'),
      termo_versao: rec.getString('termo_versao') || 'v2026-01',
      termo_lgpd_aceito: rec.getBool('termo_lgpd_aceito'),
      data_aceite_lgpd: rec.getString('data_aceite_lgpd'),
      consentimento_ip: rec.getString('consentimento_ip'),
      consentimento_data_hora: rec.getString('consentimento_data_hora'),
      data_revogacao: rec.getString('data_revogacao'),
      motivo_revogacao: rec.getString('motivo_revogacao'),
      arquivo_pfx: rec.getString('arquivo_pfx'),
      validade_certificado: rec.getString('validade_certificado'),
    }
  } catch {
    return null
  }
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
