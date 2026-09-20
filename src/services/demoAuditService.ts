/**
 * SERVIÇO DE AUDITORIA E TELEMETRIA ANÔNIMA DA DEMONSTRAÇÃO ORIENTADA (/demo)
 *
 * Registra o início de cada demonstração sem coletar nenhum dado pessoal (LGPD estrita,
 * sem exigir login, coleção pública demo_audit_trail com createRule aberta "").
 */

import pb from '@/lib/pocketbase/client'

export interface DemoAuditInput {
  etapaInicial?: number
  etapaNome?: string
  origemUrl?: string
}

export interface DemoAuditRecord {
  id: string
  sessao_id: string
  etapa_inicial: number
  etapa_nome?: string
  timestamp_inicio: string
  origem_url?: string
  user_agent_resumido?: string
  created: string
}

const DEMO_SESSION_STORAGE_KEY = 'orbis_demo_session_id'

/**
 * Obtém ou inicializa um identificador randômico de sessão temporário (apenas em memória/sessionStorage).
 * Não rastreia o indivíduo; apenas correlaciona as interações dentro da mesma sessão de demonstração.
 */
export function obterSessaoDemoId(): string {
  if (typeof window === 'undefined') {
    return 'demo-server-session'
  }
  try {
    let sessaoId = window.sessionStorage.getItem(DEMO_SESSION_STORAGE_KEY)
    if (!sessaoId) {
      const randomHex = Array.from(crypto.getRandomValues(new Uint8Array(8)))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')
      sessaoId = `demo_${Date.now()}_${randomHex}`
      window.sessionStorage.setItem(DEMO_SESSION_STORAGE_KEY, sessaoId)
    }
    return sessaoId
  } catch {
    return `demo_${Date.now()}`
  }
}

let demoInicioRegistrado = false

/**
 * Registra o início da demonstração comercial orientada de forma anônima.
 * Idempotente por carregamento de página / sessão.
 */
export async function registrarInicioDemonstracao(
  input: DemoAuditInput = {},
): Promise<{ sucesso: boolean; recordId?: string }> {
  if (demoInicioRegistrado) {
    return { sucesso: true }
  }

  const sessaoId = obterSessaoDemoId()
  const etapaInicial = typeof input.etapaInicial === 'number' ? input.etapaInicial : 1
  const etapaNome = input.etapaNome || 'Boas-vindas'
  const timestampInicio = new Date().toISOString()
  const origemUrl =
    input.origemUrl || (typeof window !== 'undefined' ? window.location.href : '/demo')

  // Resumo anônimo do user agent (apenas tipo de dispositivo / plataforma, sem dados de identificação)
  let userAgentResumido = 'Navegador Web'
  if (typeof navigator !== 'undefined') {
    const ua = navigator.userAgent
    if (/mobile/i.test(ua)) userAgentResumido = 'Dispositivo Móvel'
    else if (/tablet/i.test(ua)) userAgentResumido = 'Tablet'
    else userAgentResumido = 'Desktop'
  }

  try {
    const record = await pb.collection('demo_audit_trail').create<DemoAuditRecord>({
      sessao_id: sessaoId,
      etapa_inicial: etapaInicial,
      etapa_nome: etapaNome,
      timestamp_inicio: timestampInicio,
      origem_url: origemUrl.slice(0, 200),
      user_agent_resumido: userAgentResumido,
    })
    demoInicioRegistrado = true
    return { sucesso: true, recordId: record.id }
  } catch (err) {
    // Falha não-bloqueante: telemetria nunca impede a exibição da demonstração pública
    console.warn('[Orbis Demo] Telemetria anônima não persistida no backend:', err)
    demoInicioRegistrado = true
    return { sucesso: false }
  }
}
