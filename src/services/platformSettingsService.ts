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

export const CHAVE_ACP_COBRANDING_ATIVO = 'acp_cobranding_ativo'
export const CHAVE_ACP_COBRANDING_TEXTO = 'acp_cobranding_texto'
export const CHAVE_ACP_COBRANDING_LOGO_URL = 'acp_cobranding_logo_url'

export const TEXTO_ACP_COBRANDING_PADRAO = 'em parceria com a Associação Comercial do Paraná'
export const LOGO_ACP_COBRANDING_PADRAO = 'https://img.usecurling.com/i?q=parana&color=solid-black'

export interface AcpCobrandingConfig {
  ativo: boolean
  texto: string
  logoUrl: string
  /**
   * Alias de compatibilidade com outros componentes
   */
  texto_parceria?: string
  logo_url?: string
}

export type CobrandingAcpConfig = AcpCobrandingConfig

/**
 * Obtém a configuração consolidada de Co-branding da ACP
 */
export async function obterAcpCobrandingConfig(): Promise<AcpCobrandingConfig> {
  try {
    const [ativoStr, textoStr, logoUrlStr] = await Promise.all([
      obterSetting(CHAVE_ACP_COBRANDING_ATIVO, 'false'),
      obterSetting(CHAVE_ACP_COBRANDING_TEXTO, TEXTO_ACP_COBRANDING_PADRAO),
      obterSetting(CHAVE_ACP_COBRANDING_LOGO_URL, LOGO_ACP_COBRANDING_PADRAO),
    ])

    const textoFinal = textoStr || TEXTO_ACP_COBRANDING_PADRAO
    const logoFinal = logoUrlStr || LOGO_ACP_COBRANDING_PADRAO
    return {
      ativo: ativoStr === 'true',
      texto: textoFinal,
      logoUrl: logoFinal,
      texto_parceria: textoFinal,
      logo_url: logoFinal,
    }
  } catch {
    return {
      ativo: false,
      texto: TEXTO_ACP_COBRANDING_PADRAO,
      logoUrl: LOGO_ACP_COBRANDING_PADRAO,
      texto_parceria: TEXTO_ACP_COBRANDING_PADRAO,
      logo_url: LOGO_ACP_COBRANDING_PADRAO,
    }
  }
}

/**
 * Alias de compatibilidade para PainelAcpPage
 */
export const obterConfigCobrandingAcp = obterAcpCobrandingConfig

/**
 * Atualiza a configuração de Co-branding ACP (requer papel master/admin)
 */
export async function salvarAcpCobrandingConfig(
  config: Partial<AcpCobrandingConfig>,
  atualizadoPor = 'master',
): Promise<AcpCobrandingConfig> {
  const promessas: Promise<unknown>[] = []

  if (config.ativo !== undefined) {
    promessas.push(
      atualizarSetting(CHAVE_ACP_COBRANDING_ATIVO, config.ativo ? 'true' : 'false', atualizadoPor),
    )
  }
  if (config.texto !== undefined) {
    promessas.push(
      atualizarSetting(
        CHAVE_ACP_COBRANDING_TEXTO,
        config.texto.trim() || TEXTO_ACP_COBRANDING_PADRAO,
        atualizadoPor,
      ),
    )
  }
  if (config.logoUrl !== undefined) {
    promessas.push(
      atualizarSetting(
        CHAVE_ACP_COBRANDING_LOGO_URL,
        config.logoUrl.trim() || LOGO_ACP_COBRANDING_PADRAO,
        atualizadoPor,
      ),
    )
  }

  await Promise.all(promessas)
  const finalConfig = await obterAcpCobrandingConfig()

  // Dispara evento local e storage para atualização em tempo real no cabeçalho e telas ACP
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(
        'orbis_acp_cobranding',
        JSON.stringify({
          ...finalConfig,
          _ts: Date.now(),
        }),
      )
      window.dispatchEvent(new CustomEvent('orbis_acp_cobranding_change', { detail: finalConfig }))
    } catch {
      // Ignora erro em ambientes restritos de storage
    }
  }

  return finalConfig
}

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
