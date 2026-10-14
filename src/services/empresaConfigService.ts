/**
 * SERVIÇO DE CONFIGURAÇÕES DA EMPRESA (EMPRESA_CONFIGURACOES)
 * Gerencia preferências por empresa/organização, incluindo o toggle de
 * "Leitura assistida de documentos" (ativa por padrão), com auditoria
 * de data e responsável (usuário autenticado).
 */
import pb from '@/lib/pocketbase/client'
import type { RecordModel } from 'pocketbase'

export interface EmpresaConfiguracaoRecord extends RecordModel {
  empresa_cnpj: string
  empresa_nome?: string
  leitura_assistida_ativa: boolean
  leitura_assistida_alterada_em?: string
  leitura_assistida_alterada_por?: string
}

export interface EmpresaConfiguracaoDTO {
  empresaCnpj: string
  empresaNome?: string
  leituraAssistidaAtiva: boolean
  alteradaEm?: string
  alteradaPor?: string
}

/**
 * Normaliza CNPJ removendo pontuações para chave consistente
 */
export function normalizarCnpj(cnpj?: string): string {
  if (!cnpj) return ''
  return cnpj.replace(/\D/g, '')
}

/**
 * Memória local/fallback para execução em testes ou caso o backend esteja indisponível
 */
const fallbackConfigMemoria = new Map<
  string,
  {
    leituraAssistidaAtiva: boolean
    alteradaEm?: string
    alteradaPor?: string
    empresaNome?: string
  }
>()

/**
 * Obtém as configurações de uma empresa pelo CNPJ.
 * Se a configuração não existir para a empresa, trata como ativa (default: true)
 * e degrada graciosamente.
 */
export async function obterConfiguracaoEmpresa(
  empresaCnpjRaw?: string,
  empresaNomePadrao?: string,
): Promise<EmpresaConfiguracaoDTO> {
  const cnpjLimpo = normalizarCnpj(empresaCnpjRaw)

  // Default padrão se cnpj não for fornecido ou vazio
  const configPadrao: EmpresaConfiguracaoDTO = {
    empresaCnpj: empresaCnpjRaw || 'PADRAO',
    empresaNome: empresaNomePadrao || 'Empresa Padrão',
    leituraAssistidaAtiva: true,
  }

  if (!cnpjLimpo && !empresaCnpjRaw) {
    return configPadrao
  }

  const chave = cnpjLimpo || empresaCnpjRaw || 'PADRAO'

  // Verifica memória primeiro em caso de mock/fallback
  if (fallbackConfigMemoria.has(chave)) {
    const mem = fallbackConfigMemoria.get(chave)!
    return {
      empresaCnpj: empresaCnpjRaw || chave,
      empresaNome: mem.empresaNome || empresaNomePadrao,
      leituraAssistidaAtiva: mem.leituraAssistidaAtiva,
      alteradaEm: mem.alteradaEm,
      alteradaPor: mem.alteradaPor,
    }
  }

  try {
    // Tenta buscar no PocketBase pelo CNPJ exato ou limpo
    const record = await pb
      .collection('empresa_configuracoes')
      .getFirstListItem<EmpresaConfiguracaoRecord>(
        `empresa_cnpj = "${empresaCnpjRaw}" || empresa_cnpj = "${cnpjLimpo}"`,
        { requestKey: null },
      )

    return {
      empresaCnpj: record.empresa_cnpj,
      empresaNome: record.empresa_nome || empresaNomePadrao,
      // Se não definido no record, default é true
      leituraAssistidaAtiva:
        typeof record.leitura_assistida_ativa === 'boolean' ? record.leitura_assistida_ativa : true,
      alteradaEm: record.leitura_assistida_alterada_em,
      alteradaPor: record.leitura_assistida_alterada_por,
    }
  } catch {
    // Se não encontrado ou der erro no backend, degrada graciosamente para ativa (default true)
    return {
      ...configPadrao,
      empresaCnpj: empresaCnpjRaw || chave,
    }
  }
}

/**
 * Atualiza a configuração de "Leitura assistida de documentos" para uma empresa,
 * registrando com data ISO e responsável (email/nome da sessão autenticada).
 */
export async function salvarLeituraAssistidaEmpresa(params: {
  empresaCnpj: string
  empresaNome?: string
  leituraAssistidaAtiva: boolean
  responsavelNomeOuEmail: string
}): Promise<EmpresaConfiguracaoDTO> {
  const cnpjLimpo = normalizarCnpj(params.empresaCnpj)
  const chave = cnpjLimpo || params.empresaCnpj || 'PADRAO'
  const dataIso = new Date().toISOString()
  const responsavel = params.responsavelNomeOuEmail || 'Gestor Master'

  // Atualiza cache em memória
  fallbackConfigMemoria.set(chave, {
    leituraAssistidaAtiva: params.leituraAssistidaAtiva,
    alteradaEm: dataIso,
    alteradaPor: responsavel,
    empresaNome: params.empresaNome,
  })

  try {
    let existingRecord: EmpresaConfiguracaoRecord | null = null
    try {
      existingRecord = await pb
        .collection('empresa_configuracoes')
        .getFirstListItem<EmpresaConfiguracaoRecord>(
          `empresa_cnpj = "${params.empresaCnpj}" || empresa_cnpj = "${cnpjLimpo}"`,
          { requestKey: null },
        )
    } catch {
      existingRecord = null
    }

    if (existingRecord) {
      const updated = await pb
        .collection('empresa_configuracoes')
        .update<EmpresaConfiguracaoRecord>(existingRecord.id, {
          empresa_nome: params.empresaNome || existingRecord.empresa_nome,
          leitura_assistida_ativa: params.leituraAssistidaAtiva,
          leitura_assistida_alterada_em: dataIso,
          leitura_assistida_alterada_por: responsavel,
        })

      return {
        empresaCnpj: updated.empresa_cnpj,
        empresaNome: updated.empresa_nome,
        leituraAssistidaAtiva: updated.leitura_assistida_ativa,
        alteradaEm: updated.leitura_assistida_alterada_em,
        alteradaPor: updated.leitura_assistida_alterada_por,
      }
    } else {
      const created = await pb
        .collection('empresa_configuracoes')
        .create<EmpresaConfiguracaoRecord>({
          empresa_cnpj: params.empresaCnpj,
          empresa_nome: params.empresaNome || 'Empresa Cadastrada',
          leitura_assistida_ativa: params.leituraAssistidaAtiva,
          leitura_assistida_alterada_em: dataIso,
          leitura_assistida_alterada_por: responsavel,
        })

      return {
        empresaCnpj: created.empresa_cnpj,
        empresaNome: created.empresa_nome,
        leituraAssistidaAtiva: created.leitura_assistida_ativa,
        alteradaEm: created.leitura_assistida_alterada_em,
        alteradaPor: created.leitura_assistida_alterada_por,
      }
    }
  } catch (err) {
    console.warn(
      '[empresaConfigService] Aviso ao persistir no PocketBase, mantendo estado local:',
      err,
    )
    return {
      empresaCnpj: params.empresaCnpj,
      empresaNome: params.empresaNome,
      leituraAssistidaAtiva: params.leituraAssistidaAtiva,
      alteradaEm: dataIso,
      alteradaPor: responsavel,
    }
  }
}

/**
 * Reseta o estado local de teste (útil para suítes de teste)
 */
export function _limparMemoriaConfiguracaoEmpresa(): void {
  fallbackConfigMemoria.clear()
}
