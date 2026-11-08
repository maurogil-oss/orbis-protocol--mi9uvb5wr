import pb from '@/lib/pocketbase/client'
import { registrarEventoAudit } from '@/services/auditService'

/**
 * Versão atual dos termos de uso e política de privacidade da plataforma Orbis Protocol.
 * Atualizar esta constante ao emitir novas revisões documentais regulatórias.
 */
export const VERSAO_DOCUMENTO_LGPD_ATUAL = 'v1.0 — 2026-02'
export const DATA_VIGENCIA_LGPD_ATUAL = 'Fevereiro de 2026'

/**
 * Contato institucional do controlador / canal de privacidade e encarregado.
 * NÃO inventar dados de DPO pessoal físico sem chancela da governança.
 */
export const CONTATO_CONTROLADOR_LGPD = {
  razaoSocial: 'MGM CONSULTORIA EMPRESARIAL LTDA',
  cnpj: '19.598.964/0001-01',
  emailContato: 'contato@orbis-protocol.com',
  canalDpo: 'dpo@mgmconsultoria.com.br',
  dpoNomeGenerico: 'Comitê Institucional de Privacidade e Segurança (DPO Interino)',
  dpoDefinicaoPendente: true,
  prazoRespostaDias: 15,
}

export interface RegistroConsentimentoUsuarioParams {
  userId: string
  userEmail?: string
  versao?: string
  dataHora?: string
  ip?: string
  origem?: 'cadastro' | 'convite_acp' | 'login_aviso' | 'diagnostico'
}

/**
 * Verifica se um usuário autenticado possui registro do consentimento LGPD na versão vigente.
 */
export function verificarConsentimentoLgpd(usuario: {
  lgpd_termo_versao?: string | null
  lgpd_consentimento_data_hora?: string | null
} | null | undefined): {
  possuiConsentimento: boolean
  versaoRegistrada: string | null
  versaoAtual: string
  pendenteAtualizacao: boolean
} {
  if (!usuario) {
    return {
      possuiConsentimento: false,
      versaoRegistrada: null,
      versaoAtual: VERSAO_DOCUMENTO_LGPD_ATUAL,
      pendenteAtualizacao: true,
    }
  }

  const versao = usuario.lgpd_termo_versao?.trim() || null
  const dataHora = usuario.lgpd_consentimento_data_hora?.trim() || null

  const possuiConsentimento = Boolean(versao && dataHora)
  const pendenteAtualizacao = !possuiConsentimento

  return {
    possuiConsentimento,
    versaoRegistrada: versao,
    versaoAtual: VERSAO_DOCUMENTO_LGPD_ATUAL,
    pendenteAtualizacao,
  }
}

/**
 * Registra o aceite do consentimento LGPD para um usuário, atualizando os campos no PocketBase
 * e inserindo registro na trilha de auditoria formal (audit_log).
 */
export async function registrarConsentimentoUsuario(
  params: RegistroConsentimentoUsuarioParams,
): Promise<{ sucesso: boolean; versao: string; dataHora: string }> {
  const versao = params.versao || VERSAO_DOCUMENTO_LGPD_ATUAL
  const dataHora = params.dataHora || new Date().toISOString()
  const origem = params.origem || 'cadastro'

  try {
    await pb.collection('users').update(params.userId, {
      lgpd_termo_versao: versao,
      lgpd_consentimento_data_hora: dataHora,
      lgpd_consentimento_ip: params.ip || 'origem_web',
    })

    // Registra na trilha de auditoria se disponível
    await registrarEventoAudit({
      acao: 'lgpd_consentimento_aceito',
      entidade: 'users',
      entidade_id: params.userId,
      detalhes: {
        versao,
        data_hora: dataHora,
        email: params.userEmail,
        origem,
      },
    }).catch(() => false)

    return { sucesso: true, versao, dataHora }
  } catch (err) {
    console.warn('[termoConsentimentoService] Erro ao gravar consentimento do usuário:', err)
    return { sucesso: false, versao, dataHora }
  }
}
