/**
 * SERVIÇO DE CONFIGURAÇÕES DA PLATAFORMA (PLATFORM_SETTINGS)
 * Gerenciamento centralizado de flags e parâmetros de governança, incluindo
 * o toggle regulatório da Ampliação do Programa MOVER para centros de desmontagem (CDV).
 */
import pb from '@/lib/pocketbase/client'
import type { RecordModel } from 'pocketbase'

export interface PlatformSettingRecord extends RecordModel {
  chave: string
  valor: string
  atualizado_por?: string
  atualizado_em?: string
}

export const CHAVE_MOVER_AMPLIADO = 'mover_ampliado_habilitado'

/**
 * Obtém o valor booleano da flag da ampliação do Programa MOVER (default: false)
 */
export async function obterMoverAmpliadoHabilitado(): Promise<boolean> {
  try {
    const record = await pb
      .collection('platform_settings')
      .getFirstListItem<PlatformSettingRecord>(`chave = "${CHAVE_MOVER_AMPLIADO}"`, {
        requestKey: null,
      })
    return record.valor === 'true'
  } catch {
    return false
  }
}

/**
 * Lê uma configuração genérica pelo nome da chave
 */
export async function obterSetting(chave: string, valorPadrao = ''): Promise<string> {
  try {
    const record = await pb
      .collection('platform_settings')
      .getFirstListItem<PlatformSettingRecord>(`chave = "${chave}"`, {
        requestKey: null,
      })
    return record.valor || valorPadrao
  } catch {
    return valorPadrao
  }
}

/**
 * Atualiza ou cria uma configuração da plataforma (requer papel admin)
 */
export async function atualizarSetting(
  chave: string,
  valor: string,
  atualizadoPor = 'admin',
): Promise<PlatformSettingRecord> {
  try {
    const existing = await pb
      .collection('platform_settings')
      .getFirstListItem<PlatformSettingRecord>(`chave = "${chave}"`, {
        requestKey: null,
      })
    return await pb.collection('platform_settings').update<PlatformSettingRecord>(existing.id, {
      valor,
      atualizado_por: atualizadoPor,
      atualizado_em: new Date().toISOString(),
    })
  } catch {
    return await pb.collection('platform_settings').create<PlatformSettingRecord>({
      chave,
      valor,
      atualizado_por: atualizadoPor,
      atualizado_em: new Date().toISOString(),
    })
  }
}

/**
 * Atualiza a flag de habilitação do catálogo ampliado MOVER
 */
export async function setMoverAmpliadoHabilitado(
  habilitado: boolean,
  atualizadoPor = 'admin',
): Promise<PlatformSettingRecord> {
  return atualizarSetting(CHAVE_MOVER_AMPLIADO, habilitado ? 'true' : 'false', atualizadoPor)
}
