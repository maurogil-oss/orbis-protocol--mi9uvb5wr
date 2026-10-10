import pb from '@/lib/pocketbase/client'

export type ToqueReativacao = 'd30' | 'd60'
export type StatusEnvioReativacao = 'enviado' | 'falha'

export interface SnapshotContaReativacao {
  nfe_consultadas: number
  infosimples_consultas: number
  lotes_cdv: number
  laudos_exportados: number
  laudos_assinados_icp: number
  laudos_pendentes: number
  ultima_atividade_data: string
  dias_inatividade: number
  ultimo_lote_data_formatada: string
  cnpj?: string
}

export interface ReativacaoEnvioRecord {
  id: string
  usuario: string
  toque: ToqueReativacao
  data_envio: string
  status: StatusEnvioReativacao
  destinatario_email: string
  dados_conta_json: SnapshotContaReativacao
  mensagem_erro?: string
  reativou?: boolean
  data_reativacao?: string
  created: string
  updated: string
  expand?: {
    usuario?: {
      id: string
      name?: string
      email?: string
      cnpj?: string
      opt_out_reativacao?: boolean
      opt_out_reativacao_data?: string
    }
  }
}

export interface UsuarioElegibilidadeReativacao {
  usuarioId: string
  nome: string
  email: string
  cnpj: string
  diasInatividade: number
  ultimaAtividadeData: string
  toqueElegivel: ToqueReativacao | null
  optOut: boolean
  optOutData?: string
  jaEnviadoUltimos30d: boolean
  ultimoEnvio?: ReativacaoEnvioRecord
  snapshot: SnapshotContaReativacao
  reativouAposUltimoEnvio?: boolean
}

export interface MetricasCampanhaReativacao {
  totalUsuariosAvaliados: number
  gatilhoD30Count: number
  gatilhoD60Count: number
  totalEnviadosD30: number
  totalEnviadosD60: number
  totalFalhas: number
  totalOptOutsAtivos: number
  usuariosReativadosCount: number
  taxaRetornoPercentual: number
}

export interface FiltrosReativacao {
  toque?: 'todos' | 'd30' | 'd60'
  status?: 'todos' | 'enviado' | 'falha'
  apenasOptOut?: boolean
  buscaTexto?: string
}

/**
 * Normaliza e calcula inatividade de um usuário com base nas 4 coleções de acervo
 */
export function calcularInatividadeUsuario(
  user: any,
  nfes: any[],
  infos: any[],
  lotesCdv: any[],
  relatorios: any[],
  enviosDoUsuario: ReativacaoEnvioRecord[] = [],
): UsuarioElegibilidadeReativacao {
  const agora = new Date()
  const userCnpjLimpo = (user.cnpj || '').replace(/\D/g, '')

  // 1. Filtrar NFs do usuário ou do CNPJ
  const nfesUsuario = nfes.filter((n) => {
    if (n.usuario === user.id) return true
    if (userCnpjLimpo) {
      const emitLimpo = (n.cnpj_emitente || '').replace(/\D/g, '')
      const destLimpo = (n.cnpj_destinatario || '').replace(/\D/g, '')
      if (emitLimpo === userCnpjLimpo || destLimpo === userCnpjLimpo) return true
    }
    return false
  })

  // 2. Filtrar InfoSimples
  const infosUsuario = infos.filter((i) => i.usuario === user.id)

  // 3. Filtrar Lotes CDV por CNPJ
  const lotesUsuario = lotesCdv.filter((l) => {
    if (!userCnpjLimpo) return false
    const loteCnpjLimpo = (l.cdv_cnpj || '').replace(/\D/g, '')
    return loteCnpjLimpo === userCnpjLimpo
  })

  // 4. Filtrar Relatórios Exportados
  const relsUsuario = relatorios.filter((r) => {
    if (r.usuario === user.id) return true
    if (userCnpjLimpo) {
      const relCnpjLimpo = (r.cnpj || '').replace(/\D/g, '')
      return relCnpjLimpo === userCnpjLimpo
    }
    return false
  })

  // Achar última data de cada
  const extrairDataMaisRecente = (lista: any[]): Date | null => {
    if (!lista || lista.length === 0) return null
    let max = 0
    for (const item of lista) {
      const dt = new Date(item.created || item.dataHora || item.updated || 0).getTime()
      if (dt > max) max = dt
    }
    return max > 0 ? new Date(max) : null
  }

  const nfeDt = extrairDataMaisRecente(nfesUsuario)
  const infoDt = extrairDataMaisRecente(infosUsuario)
  const cdvDt = extrairDataMaisRecente(lotesUsuario)
  const relDt = extrairDataMaisRecente(relsUsuario)

  const datas = [nfeDt, infoDt, cdvDt, relDt].filter(Boolean) as Date[]
  let ultimaAtividade: Date
  if (datas.length > 0) {
    datas.sort((a, b) => b.getTime() - a.getTime())
    ultimaAtividade = datas[0]
  } else {
    ultimaAtividade = new Date(user.created || agora.toISOString())
  }

  const diffDias = Math.max(
    0,
    Math.floor((agora.getTime() - ultimaAtividade.getTime()) / (1000 * 60 * 60 * 24)),
  )

  let toqueElegivel: ToqueReativacao | null = null
  if (diffDias >= 60) {
    toqueElegivel = 'd60'
  } else if (diffDias >= 30) {
    toqueElegivel = 'd30'
  }

  // Deduplicação dos últimos 30 dias
  const trintaDiasMs = 30 * 24 * 60 * 60 * 1000
  let jaEnviadoUltimos30d = false
  let ultimoEnvio: ReativacaoEnvioRecord | undefined = undefined

  if (enviosDoUsuario.length > 0) {
    const ordenados = [...enviosDoUsuario].sort(
      (a, b) => new Date(b.created).getTime() - new Date(a.created).getTime(),
    )
    ultimoEnvio = ordenados[0]
    for (const env of ordenados) {
      const diffMs = agora.getTime() - new Date(env.created).getTime()
      if (env.status === 'enviado' && diffMs < trintaDiasMs) {
        jaEnviadoUltimos30d = true
        break
      }
    }
  }

  // Checar se o usuário reativou após o último envio registrado
  let reativouAposUltimoEnvio = false
  if (ultimoEnvio && ultimoEnvio.status === 'enviado') {
    const dtEnvio = new Date(ultimoEnvio.created).getTime()
    if (ultimaAtividade.getTime() > dtEnvio + 60 * 1000) {
      // Atividade registrada pelo menos 1 minuto após o envio
      reativouAposUltimoEnvio = true
    }
  }

  const relsAssinados = relsUsuario.filter((r) => r.assinado_icp_brasil).length
  const laudosPendentes = Math.max(0, nfesUsuario.length > 0 && relsUsuario.length === 0 ? 1 : 0)

  const dataUltimoLote = cdvDt
    ? cdvDt.toLocaleDateString('pt-BR')
    : nfeDt
      ? nfeDt.toLocaleDateString('pt-BR')
      : 'N/A'

  const snapshot: SnapshotContaReativacao = {
    nfe_consultadas: nfesUsuario.length,
    infosimples_consultas: infosUsuario.length,
    lotes_cdv: lotesUsuario.length,
    laudos_exportados: relsUsuario.length,
    laudos_assinados_icp: relsAssinados,
    laudos_pendentes: laudosPendentes,
    ultima_atividade_data: ultimaAtividade.toISOString(),
    dias_inatividade: diffDias,
    ultimo_lote_data_formatada: dataUltimoLote,
    cnpj: user.cnpj,
  }

  return {
    usuarioId: user.id,
    nome: user.name || user.email || 'Cliente',
    email: user.email || '',
    cnpj: user.cnpj || '',
    diasInatividade: diffDias,
    ultimaAtividadeData: ultimaAtividade.toISOString(),
    toqueElegivel,
    optOut: Boolean(user.opt_out_reativacao),
    optOutData: user.opt_out_reativacao_data,
    jaEnviadoUltimos30d,
    ultimoEnvio,
    snapshot,
    reativouAposUltimoEnvio,
  }
}

/**
 * Carrega todos os registros de reativacao_envios
 */
export async function listarEnviosReativacao(): Promise<ReativacaoEnvioRecord[]> {
  try {
    const records = await pb.collection('reativacao_envios').getFullList({
      sort: '-created',
      expand: 'usuario',
    })
    return records as unknown as ReativacaoEnvioRecord[]
  } catch (err) {
    console.warn('Aviso ao listar reativacao_envios:', err)
    return []
  }
}

/**
 * Calcula totalizadores e métricas consolidadas
 */
export function calcularMetricasReativacao(
  elegibilidades: UsuarioElegibilidadeReativacao[],
  envios: ReativacaoEnvioRecord[],
): MetricasCampanhaReativacao {
  let gatilhoD30 = 0
  let gatilhoD60 = 0
  let optOuts = 0

  for (const item of elegibilidades) {
    if (item.optOut) {
      optOuts++
      continue
    }
    if (item.toqueElegivel === 'd30') gatilhoD30++
    if (item.toqueElegivel === 'd60') gatilhoD60++
  }

  let totalD30 = 0
  let totalD60 = 0
  let totalFalhas = 0
  const usuariosReativadosSet = new Set<string>()
  const usuariosEnviadosComSucessoSet = new Set<string>()

  for (const env of envios) {
    if (env.status === 'enviado') {
      if (env.toque === 'd30') totalD30++
      if (env.toque === 'd60') totalD60++
      usuariosEnviadosComSucessoSet.add(env.usuario)
      if (env.reativou) {
        usuariosReativadosSet.add(env.usuario)
      }
    } else {
      totalFalhas++
    }
  }

  // Também computa reativações detectadas a partir da timeline de elegibilidade
  for (const el of elegibilidades) {
    if (el.reativouAposUltimoEnvio) {
      usuariosReativadosSet.add(el.usuarioId)
    }
  }

  const taxaRetorno =
    usuariosEnviadosComSucessoSet.size > 0
      ? Number(((usuariosReativadosSet.size / usuariosEnviadosComSucessoSet.size) * 100).toFixed(1))
      : 0

  return {
    totalUsuariosAvaliados: elegibilidades.length,
    gatilhoD30Count: gatilhoD30,
    gatilhoD60Count: gatilhoD60,
    totalEnviadosD30: totalD30,
    totalEnviadosD60: totalD60,
    totalFalhas,
    totalOptOutsAtivos: optOuts,
    usuariosReativadosCount: usuariosReativadosSet.size,
    taxaRetornoPercentual: taxaRetorno,
  }
}

/**
 * Disparo manual do job de reativação pelo Console Admin
 */
export async function dispararJobReativacaoManual(dryRun: boolean = false): Promise<{
  sucesso: boolean
  data_execucao: string
  total_avaliado: number
  elegiveis_d30: number
  elegiveis_d60: number
  enviados: number
  ignorados_opt_out: number
  ignorados_recente: number
  erros: number
  logs?: any[]
}> {
  const token = pb.authStore.token
  const baseUrl = pb.baseUrl.replace(/\/$/, '')
  const res = await fetch(`${baseUrl}/backend/v1/reativacao/executar-job`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: token ? `Bearer ${token}` : '',
    },
    body: JSON.stringify({ dry_run: dryRun }),
  })

  if (!res.ok) {
    const errJson = await res.json().catch(() => ({}))
    throw new Error(errJson.error || `Erro HTTP ${res.status} ao disparar campanha.`)
  }

  return res.json()
}

/**
 * Consulta status público de opt-out por token (sem exigir autenticação)
 */
export async function consultarOptOutPublico(
  userId: string,
  token: string,
): Promise<{
  sucesso: boolean
  token_valido: boolean
  email_mascarado: string
  nome: string
  opt_out: boolean
  opt_out_data?: string
}> {
  const baseUrl = pb.baseUrl.replace(/\/$/, '')
  const url = `${baseUrl}/backend/v1/reativacao/opt-out/consultar?uid=${encodeURIComponent(userId)}&token=${encodeURIComponent(token)}`
  const res = await fetch(url)
  if (!res.ok) {
    const errJson = await res.json().catch(() => ({}))
    throw new Error(errJson.error || `Erro HTTP ${res.status}`)
  }
  return res.json()
}

/**
 * Confirma o descadastro de opt-out (público via token ou autenticado pelo usuário)
 */
export async function confirmarOptOutPublico(
  userId: string,
  token: string,
  reverter: boolean = false,
): Promise<{
  sucesso: boolean
  opt_out: boolean
  data: string
  email: string
  mensagem: string
}> {
  const baseUrl = pb.baseUrl.replace(/\/$/, '')
  const authHeader = pb.authStore.token ? `Bearer ${pb.authStore.token}` : ''
  const res = await fetch(`${baseUrl}/backend/v1/reativacao/opt-out`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(authHeader ? { Authorization: authHeader } : {}),
    },
    body: JSON.stringify({
      usuario_id: userId,
      token,
      reverter,
    }),
  })

  if (!res.ok) {
    const errJson = await res.json().catch(() => ({}))
    throw new Error(errJson.error || `Erro HTTP ${res.status} ao atualizar preferências.`)
  }

  return res.json()
}

/**
 * Exporta histórico de envios de reativação para CSV
 */
export function exportarEnviosReativacaoCsv(envios: ReativacaoEnvioRecord[]): {
  conteudoCsv: string
  nomeArquivo: string
  totalRegistros: number
} {
  const cabecalho = [
    'ID Envio',
    'Data/Hora Envio',
    'Toque',
    'Destinatário (E-mail)',
    'Status',
    'NFs Consultadas',
    'Lotes dMRV',
    'Laudos Emitidos',
    'Dias Inatividade',
    'Reativou Atividade?',
    'Mensagem de Erro',
  ]

  const linhas = envios.map((env) => {
    const dataHora = new Date(env.created).toLocaleString('pt-BR')
    const toqueRotulo =
      env.toque === 'd30' ? 'Dia 30 (Provas Esperando)' : 'Dia 60 (Marco Regulatório)'
    const snap = env.dados_conta_json || ({} as SnapshotContaReativacao)

    return [
      `"${env.id}"`,
      `"${dataHora}"`,
      `"${toqueRotulo}"`,
      `"${env.destinatario_email || env.expand?.usuario?.email || ''}"`,
      `"${env.status === 'enviado' ? 'Enviado com Sucesso' : 'Falha no Envio'}"`,
      snap.nfe_consultadas ?? 0,
      snap.lotes_cdv ?? 0,
      snap.laudos_exportados ?? 0,
      snap.dias_inatividade ?? 0,
      env.reativou ? 'SIM' : 'NÃO',
      `"${(env.mensagem_erro || '').replace(/"/g, '""')}"`,
    ].join(';')
  })

  const conteudoCsv = '\uFEFF' + [cabecalho.join(';'), ...linhas].join('\r\n')
  const dataHoje = new Date().toISOString().slice(0, 10)
  const nomeArquivo = `campanha_reativacao_orbis_${dataHoje}.csv`

  return {
    conteudoCsv,
    nomeArquivo,
    totalRegistros: envios.length,
  }
}
