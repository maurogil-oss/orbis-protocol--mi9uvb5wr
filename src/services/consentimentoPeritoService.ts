import pb from '@/lib/pocketbase/client'

export const VERSAO_TERMO_CONSENTIMENTO_LGPD = 'LGPD-PERITO-v1.0'

export interface ConsentimentoPeritoRecord {
  id: string
  usuario?: string
  perito_credenciamento?: string
  nome_completo: string
  conselho_tipo?: string
  registro_profissional: string
  registro_uf?: string
  numero_art_rrt?: string
  documento_identificacao?: string
  termo_versao: string
  termo_aceito_em: string
  status: 'ativo' | 'revogado'
  revogado_em?: string
  ip_registro?: string
  observacao?: string
  created: string
  updated: string
}

export interface DadosPeritoExibicao {
  /** Se os dados estão protegidos por mascaramento LGPD padrão */
  mascarado: boolean
  /** Texto formatado para o card/tabela */
  textoFormatado: string
  /** Se os dados completos foram revelados com base em consentimento formal */
  consentimentoValido: boolean
  /** Nota explicativa para ser exibida discreta abaixo ou no tooltip */
  notaLgpd?: string
  /** Dados originais caso revelados */
  dadosCompletos?: {
    nome?: string
    conselho?: string
    registro?: string
    uf?: string
    art?: string
  }
}

/**
 * Normaliza número de registro para matching (ex: "182.940/D", "182940D", "182940")
 */
export function normalizarRegistroProfissional(valor?: string): string {
  if (!valor) return ''
  return valor.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()
}

/**
 * Aplica mascaramento parcial LGPD por padrão nos dados do perito responsável.
 * Exemplo de saída: "Eng. Responsável • ART ***-SP" ou "CREA-PR ***.940/D • Eng. Responsável"
 */
export function formatarPeritoComMascaramentoPadrao(
  rawResponsavel?: string,
  ufFallback: string = 'SP',
): string {
  if (!rawResponsavel || !rawResponsavel.trim()) {
    return `Eng. Responsável • ART ***-${ufFallback}`
  }

  const str = rawResponsavel.trim()

  // Se já contiver mascaramento explícito
  if (str.includes('***')) {
    return str
  }

  // Tentar extrair UF (ex: CREA-PR, CREA-SP, etc.)
  const ufMatch = str.match(/CREA-([A-Z]{2})/i) || str.match(/-([A-Z]{2})\b/i)
  const uf = ufMatch ? ufMatch[1].toUpperCase() : ufFallback

  // Extrair números do CREA para mascarar parte (ex: 182.940/D -> ***.940/D)
  const creaNumMatch = str.match(/(\d{1,3})[.\s]?(\d{3,4})([/-][A-Z0-9]+)?/i)
  if (creaNumMatch) {
    const finalDigits = creaNumMatch[2]
    const sufixo = creaNumMatch[3] || ''
    return `Eng. Responsável • CREA-${uf} ***.${finalDigits}${sufixo} • ART ***-${uf}`
  }

  return `Eng. Responsável • ART ***-${uf}`
}

/**
 * Resolve a exibição do perito:
 * - Se houver consentimento formal ativo no backend (ou passado diretamente), exibe os dados completos
 * - Por padrão, aplica mascaramento parcial ("Eng. Responsável • ART ***-SP")
 */
export function resolverExibicaoPerito(
  rawResponsavel?: string,
  consentimentoAtivo?: ConsentimentoPeritoRecord | null,
): DadosPeritoExibicao {
  if (consentimentoAtivo && consentimentoAtivo.status === 'ativo') {
    const conselhoUf = consentimentoAtivo.conselho_tipo
      ? `${consentimentoAtivo.conselho_tipo}${consentimentoAtivo.registro_uf ? '-' + consentimentoAtivo.registro_uf : ''}`
      : 'CREA'
    const reg = consentimentoAtivo.registro_profissional || ''
    const nome = consentimentoAtivo.nome_completo || ''
    const art = consentimentoAtivo.numero_art_rrt
      ? ` • ART ${consentimentoAtivo.numero_art_rrt}`
      : ''

    const textoCompleto = nome
      ? `${conselhoUf} ${reg} - ${nome}${art}`.trim()
      : (rawResponsavel || `${conselhoUf} ${reg}${art}`).trim()

    return {
      mascarado: false,
      textoFormatado: textoCompleto,
      consentimentoValido: true,
      notaLgpd:
        'Dados divulgados com consentimento formal do responsável técnico (Art. 7º, I da LGPD)',
      dadosCompletos: {
        nome: consentimentoAtivo.nome_completo,
        conselho: consentimentoAtivo.conselho_tipo,
        registro: consentimentoAtivo.registro_profissional,
        uf: consentimentoAtivo.registro_uf,
        art: consentimentoAtivo.numero_art_rrt,
      },
    }
  }

  // Mascaramento por padrão
  const textoMascarado = formatarPeritoComMascaramentoPadrao(rawResponsavel)
  return {
    mascarado: true,
    textoFormatado: textoMascarado,
    consentimentoValido: false,
    notaLgpd: 'Identificação protegida por padrão conforme LGPD (Art. 6º, III — Minimização)',
  }
}

/**
 * Consulta no backend se existe consentimento formal ativo para um determinado registro ou nome de perito
 */
export async function buscarConsentimentoAtivoPerito(params: {
  registroProfissional?: string
  usuarioId?: string
  nomeCompleto?: string
}): Promise<ConsentimentoPeritoRecord | null> {
  try {
    const filters: string[] = ["status = 'ativo'"]

    if (params.usuarioId) {
      filters.push(`usuario = '${params.usuarioId}'`)
    } else if (params.registroProfissional) {
      // Normalização do registro
      const regLimpo = params.registroProfissional.trim().replace(/['"]/g, '')
      filters.push(`registro_profissional ~ '${regLimpo}'`)
    } else if (params.nomeCompleto) {
      const nomeLimpo = params.nomeCompleto.trim().replace(/['"]/g, '')
      filters.push(`nome_completo ~ '${nomeLimpo}'`)
    } else {
      return null
    }

    const records = await pb
      .collection('consentimentos_perito')
      .getList<ConsentimentoPeritoRecord>(1, 1, {
        filter: filters.join(' && '),
        sort: '-created',
      })

    return records.items[0] || null
  } catch (err) {
    // Silencioso caso a coleção ainda esteja vazia ou offline
    return null
  }
}

/**
 * Registra novo consentimento formal LGPD pelo perito autenticado
 */
export async function registrarConsentimentoPerito(dados: {
  nomeCompleto: string
  registroProfissional: string
  conselhoTipo?: string
  registroUf?: string
  numeroArtRrt?: string
  documentoIdentificacao?: string
  peritoCredenciamentoId?: string
  observacao?: string
}): Promise<ConsentimentoPeritoRecord> {
  const usuarioId = pb.authStore.model?.id || undefined

  const payload: Record<string, any> = {
    nome_completo: dados.nomeCompleto.trim(),
    registro_profissional: dados.registroProfissional.trim(),
    conselho_tipo: dados.conselhoTipo?.trim() || 'CREA',
    registro_uf: (dados.registroUf || 'SP').toUpperCase().trim(),
    termo_versao: VERSAO_TERMO_CONSENTIMENTO_LGPD,
    termo_aceito_em: new Date().toISOString(),
    status: 'ativo',
    observacao:
      dados.observacao ||
      'Consentimento formal registrado para divulgação em Passaportes e Laudos Orbis.',
  }

  if (usuarioId) {
    payload.usuario = usuarioId
  }
  if (dados.peritoCredenciamentoId) {
    payload.perito_credenciamento = dados.peritoCredenciamentoId
  }
  if (dados.numeroArtRrt) {
    payload.numero_art_rrt = dados.numeroArtRrt.trim()
  }
  if (dados.documentoIdentificacao) {
    payload.documento_identificacao = dados.documentoIdentificacao.trim()
  }

  // Se já existir consentimento prévio deste usuário/registro, revoga o anterior antes de criar novo
  try {
    if (usuarioId) {
      const anteriores = await pb
        .collection('consentimentos_perito')
        .getFullList<ConsentimentoPeritoRecord>({
          filter: `usuario = '${usuarioId}' && status = 'ativo'`,
        })
      for (const ant of anteriores) {
        await pb.collection('consentimentos_perito').update(ant.id, {
          status: 'revogado',
          revogado_em: new Date().toISOString(),
          observacao: 'Substituído por novo consentimento registrado.',
        })
      }
    }
  } catch {
    /* intentionally ignored */
  }

  return await pb.collection('consentimentos_perito').create<ConsentimentoPeritoRecord>(payload)
}

/**
 * Revoga um consentimento formal LGPD previamente concedido
 */
export async function revogarConsentimentoPerito(
  consentimentoId: string,
  motivo?: string,
): Promise<ConsentimentoPeritoRecord> {
  return await pb
    .collection('consentimentos_perito')
    .update<ConsentimentoPeritoRecord>(consentimentoId, {
      status: 'revogado',
      revogado_em: new Date().toISOString(),
      observacao: motivo || 'Consentimento formal revogado a pedido do perito técnico.',
    })
}
