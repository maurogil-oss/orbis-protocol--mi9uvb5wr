import pb from '@/lib/pocketbase/client'
import { registrarEventoAudit } from '@/services/auditService'

export interface PrecosPlanosConfig {
  diagnostico: number
  laudo_pericial: number
  assinatura_bureau: number
}

export interface BusinessSettingsRecord {
  id: string
  limite_four_eyes: number
  comissao_acp_percent: number
  comissao_parceiro_percent: number
  precos_planos: PrecosPlanosConfig
  atualizado_por?: string
  atualizado_em: string
  created: string
  updated: string
  expand?: {
    atualizado_por?: {
      id: string
      name?: string
      email: string
      role?: string
    }
  }
}

export interface AlteracaoCampoHistorico {
  campo: string
  label: string
  valorAnterior: any
  valorNovo: any
  atorEmail: string
  atorId: string
  quando: string
}

export const BUSINESS_SETTINGS_FALLBACK: BusinessSettingsRecord = {
  id: 'fallback_default',
  limite_four_eyes: 5000,
  comissao_acp_percent: 10,
  comissao_parceiro_percent: 10,
  precos_planos: {
    diagnostico: 490,
    laudo_pericial: 2850,
    assinatura_bureau: 7800,
  },
  atualizado_em: '2026-01-01T00:00:00.000Z',
  created: '2026-01-01T00:00:00.000Z',
  updated: '2026-01-01T00:00:00.000Z',
}

/**
 * Carrega o registro ativo de parâmetros do negócio da coleção `business_settings`.
 * Se a tabela estiver vazia ou falhar na leitura (ex: offline), retorna o fallback seguro com valores vigentes.
 */
export async function obterBusinessSettings(): Promise<BusinessSettingsRecord> {
  try {
    const records = await pb.collection('business_settings').getList<BusinessSettingsRecord>(1, 1, {
      sort: '-created',
      expand: 'atualizado_por',
    })

    if (records.items && records.items.length > 0) {
      const item = records.items[0]
      return {
        ...item,
        limite_four_eyes:
          typeof item.limite_four_eyes === 'number'
            ? item.limite_four_eyes
            : BUSINESS_SETTINGS_FALLBACK.limite_four_eyes,
        comissao_acp_percent:
          typeof item.comissao_acp_percent === 'number'
            ? item.comissao_acp_percent
            : BUSINESS_SETTINGS_FALLBACK.comissao_acp_percent,
        comissao_parceiro_percent:
          typeof item.comissao_parceiro_percent === 'number'
            ? item.comissao_parceiro_percent
            : BUSINESS_SETTINGS_FALLBACK.comissao_parceiro_percent,
        precos_planos: {
          diagnostico:
            item.precos_planos?.diagnostico ?? BUSINESS_SETTINGS_FALLBACK.precos_planos.diagnostico,
          laudo_pericial:
            item.precos_planos?.laudo_pericial ??
            BUSINESS_SETTINGS_FALLBACK.precos_planos.laudo_pericial,
          assinatura_bureau:
            item.precos_planos?.assinatura_bureau ??
            BUSINESS_SETTINGS_FALLBACK.precos_planos.assinatura_bureau,
        },
      }
    }
  } catch (err) {
    console.warn(
      '[businessSettingsService] Falha ao carregar business_settings, usando fallback:',
      err,
    )
  }

  return BUSINESS_SETTINGS_FALLBACK
}

/**
 * Validação de formulário de parâmetros do negócio
 */
export function validarBusinessSettings(dados: {
  limite_four_eyes: number
  comissao_acp_percent: number
  comissao_parceiro_percent: number
  precos_planos: PrecosPlanosConfig
}): { valido: boolean; erros: string[] } {
  const erros: string[] = []

  if (dados.limite_four_eyes < 0 || isNaN(dados.limite_four_eyes)) {
    erros.push('O limite do four-eyes deve ser um valor numérico não-negativo (>= 0).')
  }

  if (
    dados.comissao_acp_percent < 0 ||
    dados.comissao_acp_percent > 100 ||
    isNaN(dados.comissao_acp_percent)
  ) {
    erros.push('A comissão ACP deve ser um percentual entre 0 e 100%.')
  }

  if (
    dados.comissao_parceiro_percent < 0 ||
    dados.comissao_parceiro_percent > 100 ||
    isNaN(dados.comissao_parceiro_percent)
  ) {
    erros.push('A comissão de parceiro deve ser um percentual entre 0 e 100%.')
  }

  if (dados.precos_planos.diagnostico < 0 || isNaN(dados.precos_planos.diagnostico)) {
    erros.push('O preço do Diagnóstico deve ser um número não-negativo.')
  }

  if (dados.precos_planos.laudo_pericial < 0 || isNaN(dados.precos_planos.laudo_pericial)) {
    erros.push('O preço do Laudo Pericial deve ser um número não-negativo.')
  }

  if (dados.precos_planos.assinatura_bureau < 0 || isNaN(dados.precos_planos.assinatura_bureau)) {
    erros.push('O preço do Bureau ACP deve ser um número não-negativo.')
  }

  return {
    valido: erros.length === 0,
    erros,
  }
}

/**
 * Salva novos parâmetros de negócio:
 * 1. Compara campo por campo com o registro atual.
 * 2. Atualiza ou cria na coleção `business_settings`.
 * 3. Grava no `audit_log` UM evento por campo alterado com:
 *    - quem fez (ator_id, ator_email, papel)
 *    - campo alterado
 *    - valor anterior
 *    - valor novo
 *    - quando
 */
export async function salvarBusinessSettings(
  novosDados: {
    limite_four_eyes: number
    comissao_acp_percent: number
    comissao_parceiro_percent: number
    precos_planos: PrecosPlanosConfig
  },
  justificativa?: string,
): Promise<{
  sucesso: boolean
  registro: BusinessSettingsRecord
  alteracoes: { campo: string; anterior: any; novo: any }[]
}> {
  const validacao = validarBusinessSettings(novosDados)
  if (!validacao.valido) {
    throw new Error(validacao.erros.join(' '))
  }

  const atual = await obterBusinessSettings()
  const timestamp = new Date().toISOString()
  const authUser = pb.authStore.record

  // Detectar alterações em cada campo
  const alteracoes: { campo: string; label: string; anterior: any; novo: any }[] = []

  if (Number(atual.limite_four_eyes) !== Number(novosDados.limite_four_eyes)) {
    alteracoes.push({
      campo: 'limite_four_eyes',
      label: 'Limite Quatro-Olhos (R$)',
      anterior: Number(atual.limite_four_eyes),
      novo: Number(novosDados.limite_four_eyes),
    })
  }

  if (Number(atual.comissao_acp_percent) !== Number(novosDados.comissao_acp_percent)) {
    alteracoes.push({
      campo: 'comissao_acp_percent',
      label: 'Comissão ACP (%)',
      anterior: Number(atual.comissao_acp_percent),
      novo: Number(novosDados.comissao_acp_percent),
    })
  }

  if (Number(atual.comissao_parceiro_percent) !== Number(novosDados.comissao_parceiro_percent)) {
    alteracoes.push({
      campo: 'comissao_parceiro_percent',
      label: 'Comissão Parceiro (%)',
      anterior: Number(atual.comissao_parceiro_percent),
      novo: Number(novosDados.comissao_parceiro_percent),
    })
  }

  // Preços por plano
  if (Number(atual.precos_planos?.diagnostico) !== Number(novosDados.precos_planos.diagnostico)) {
    alteracoes.push({
      campo: 'precos_planos.diagnostico',
      label: 'Preço Diagnóstico Orbis (R$)',
      anterior: Number(atual.precos_planos?.diagnostico),
      novo: Number(novosDados.precos_planos.diagnostico),
    })
  }

  if (
    Number(atual.precos_planos?.laudo_pericial) !== Number(novosDados.precos_planos.laudo_pericial)
  ) {
    alteracoes.push({
      campo: 'precos_planos.laudo_pericial',
      label: 'Preço Laudo Pericial (R$)',
      anterior: Number(atual.precos_planos?.laudo_pericial),
      novo: Number(novosDados.precos_planos.laudo_pericial),
    })
  }

  if (
    Number(atual.precos_planos?.assinatura_bureau) !==
    Number(novosDados.precos_planos.assinatura_bureau)
  ) {
    alteracoes.push({
      campo: 'precos_planos.assinatura_bureau',
      label: 'Preço Bureau ACP (R$)',
      anterior: Number(atual.precos_planos?.assinatura_bureau),
      novo: Number(novosDados.precos_planos.assinatura_bureau),
    })
  }

  // Se não houve alteração, apenas retorna o atual
  if (alteracoes.length === 0) {
    return {
      sucesso: true,
      registro: atual,
      alteracoes: [],
    }
  }

  const payload: Partial<BusinessSettingsRecord> = {
    limite_four_eyes: novosDados.limite_four_eyes,
    comissao_acp_percent: novosDados.comissao_acp_percent,
    comissao_parceiro_percent: novosDados.comissao_parceiro_percent,
    precos_planos: novosDados.precos_planos,
    atualizado_em: timestamp,
    atualizado_por: authUser?.id || undefined,
  }

  let savedRecord: BusinessSettingsRecord
  if (atual.id && atual.id !== 'fallback_default') {
    savedRecord = await pb
      .collection('business_settings')
      .update<BusinessSettingsRecord>(atual.id, payload)
  } else {
    savedRecord = await pb.collection('business_settings').create<BusinessSettingsRecord>(payload)
  }

  // Também sincroniza com servicos_catalogo para refletir os preços na tabela do catálogo
  try {
    const planosMap: Record<string, number> = {
      diagnostico: novosDados.precos_planos.diagnostico,
      laudo_pericial: novosDados.precos_planos.laudo_pericial,
      assinatura_bureau: novosDados.precos_planos.assinatura_bureau,
    }

    for (const [servId, novoPreco] of Object.entries(planosMap)) {
      try {
        const catRec = await pb
          .collection('servicos_catalogo')
          .getFirstListItem(`servico_id = "${servId}"`)
        if (catRec && Number(catRec.preco) !== Number(novoPreco)) {
          await pb.collection('servicos_catalogo').update(catRec.id, {
            preco: novoPreco,
          })
        }
      } catch (_) {
        // Se não existir no catálogo, pode ignorar
      }
    }
  } catch (eCat) {
    console.warn('[businessSettingsService] Aviso ao sincronizar servicos_catalogo:', eCat)
  }

  // Grava no audit_log UM evento por alteração de campo (Requisito 3)
  for (const alt of alteracoes) {
    await registrarEventoAudit({
      acao: 'business_setting_alterado',
      entidade: 'business_settings',
      entidade_id: savedRecord.id,
      detalhes: {
        campo: alt.campo,
        label: alt.label,
        valor_anterior: alt.anterior,
        valor_novo: alt.novo,
        justificativa: justificativa || 'Alteração pelo Gestor Master em Parâmetros do Negócio',
        atualizado_em: timestamp,
        ator_email: authUser?.email,
        ator_nome: authUser?.name,
        papel: (authUser as any)?.role || 'master',
      },
    })
  }

  return {
    sucesso: true,
    registro: savedRecord,
    alteracoes,
  }
}

/**
 * Consulta no audit_log o último evento de alteração por campo dos parâmetros de negócio.
 * Retorna um mapa de campo -> { atorEmail, quando, valorAnterior, valorNovo }
 */
export async function obterHistoricoUltimasAlteracoes(): Promise<
  Record<string, AlteracaoCampoHistorico>
> {
  const resultado: Record<string, AlteracaoCampoHistorico> = {}

  try {
    const logs = await pb.collection('audit_log').getList(1, 50, {
      filter: "entidade = 'business_settings' && acao = 'business_setting_alterado'",
      sort: '-created',
    })

    for (const log of logs.items) {
      const campo = log.detalhes?.campo
      if (campo && !resultado[campo]) {
        resultado[campo] = {
          campo,
          label: log.detalhes?.label || campo,
          valorAnterior: log.detalhes?.valor_anterior,
          valorNovo: log.detalhes?.valor_novo,
          atorEmail: log.ator_email || log.detalhes?.ator_email || log.ator_id || 'master',
          atorId: log.ator_id || '',
          quando: log.created || log.detalhes?.atualizado_em || '',
        }
      }
    }
  } catch (err) {
    console.warn('[businessSettingsService] Falha ao consultar histórico de alterações:', err)
  }

  return resultado
}
