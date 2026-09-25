import pb from '@/lib/pocketbase/client'

export type RadarSegmento =
  | 'Fiscal / Tributário'
  | 'Ambiental/ESG'
  | 'Energia'
  | 'Financeiro'
  | 'Comércio Exterior'
  | 'Carbono/SBCE'

export type RadarAcessoStatus = 'trial' | 'ativo' | 'expirado' | 'cancelado' | 'nenhum'

export type RadarFaixaCnpj =
  | '1_cnpj'
  | 'ate_5_cnpjs'
  | 'ate_30_cnpjs'
  | 'acima_30_sob_consulta'
  | 'nenhum'

export interface ItemNormaRadar {
  id: string
  norma: string
  segmento: RadarSegmento
  o_que_e: string
  quem_afeta: string
  o_que_muda_na_pratica: string
  prazo: string
  o_que_fazer_agora: string
  base_legal?: string
}

export interface RadarEdicaoRecord {
  id: string
  numero_edicao: number
  titulo: string
  resumo_semana: string
  data_edicao: string
  aberta_publico: boolean
  mes_ano_referencia: string
  itens_normas_json: ItemNormaRadar[]
  autor_editorial: string
  publicada: boolean
  total_destinatarios_enviados?: number
  data_envio_digest?: string
  created: string
  updated: string
  // Estado no frontend para usuário corrente
  lida?: boolean
  leitura_id?: string
}

export interface RadarPlanoInfo {
  id: RadarFaixaCnpj
  nome: string
  faixaTexto: string
  precoMensal: number | null
  precoTexto: string
  destaque?: boolean
  popular?: boolean
  beneficios: string[]
  regraLicenca: string
  limiteCnpjsTexto: string
}

export const PLANOS_RADAR_SEMANAL: RadarPlanoInfo[] = [
  {
    id: '1_cnpj',
    nome: 'Plano 1 CNPJ',
    faixaTexto: '1 CNPJ atendido',
    precoMensal: 59,
    precoTexto: 'R$ 59/mês',
    limiteCnpjsTexto: 'Até 1 CNPJ',
    regraLicenca:
      'Uso exclusivo interno para o CNPJ cadastrado. Acesso individual por login; vedado o compartilhamento de credenciais.',
    beneficios: [
      'Digest semanal no e-mail toda segunda-feira 7h',
      'Acesso à Central de Radar com acervo completo e busca',
      'Formato executivo: O que é, Quem afeta, O que muda, Prazo e O que fazer',
      'Código de indicação exclusivo para clientes/parceiros',
      '15 dias grátis de degustação sem necessidade de cartão',
    ],
  },
  {
    id: 'ate_5_cnpjs',
    nome: 'Plano até 5 CNPJs',
    faixaTexto: 'Até 5 CNPJs atendidos',
    precoMensal: 149,
    precoTexto: 'R$ 149/mês',
    destaque: true,
    popular: true,
    limiteCnpjsTexto: 'Até 5 CNPJs',
    regraLicenca:
      'Destinado a uso interno ou pequenas carteiras contábeis (até 5 CNPJs). Acesso individual por login com licença vinculada à empresa contratante.',
    beneficios: [
      'Tudo do Plano 1 CNPJ',
      'Monitoramento regulatório para até 5 CNPJs ou filiais',
      'Repasse autorizado de informativos executivos aos CNPJs contratados',
      'Filtros setoriais avançados (Fiscal, Ambiental, Energia, Financeiro)',
      '15 dias grátis de degustação sem cartão',
    ],
  },
  {
    id: 'ate_30_cnpjs',
    nome: 'Plano até 30 CNPJs',
    faixaTexto: 'Até 30 CNPJs atendidos',
    precoMensal: 249,
    precoTexto: 'R$ 249/mês',
    limiteCnpjsTexto: 'Até 30 CNPJs',
    regraLicenca:
      'Plano Multi-CNPJ para escritórios contábeis, auditorias e consultorias: repasse de informativos expressamente permitido aos até 30 CNPJs da carteira contratada.',
    beneficios: [
      'Tudo do Plano até 5 CNPJs',
      'Cobertura e repasse autorizado para até 30 clientes da carteira',
      'Alertas de transição IBS/CBS, SBCE, RenovaBio e Imposto Seletivo',
      'Apoio consultivo à equipe contábil/fiscal',
      '15 dias grátis de degustação sem cartão',
    ],
  },
  {
    id: 'acima_30_sob_consulta',
    nome: 'Plano Acima de 30 CNPJs',
    faixaTexto: 'Acima de 30 CNPJs',
    precoMensal: null,
    precoTexto: 'Sob consulta',
    limiteCnpjsTexto: 'Carteiras corporativas ilimitadas',
    regraLicenca:
      'Plano Corporate/Franquias: repasse expressamente permitido a toda a carteira contratada, com onboarding dedicado e múltiplos logins operacionais.',
    beneficios: [
      'Cobertura ilimitada de CNPJs sob contrato corporativo',
      'Repasse irrestrito de informativos a todos os CNPJs atendidos',
      'Canal prioritário e briefing regulatório sob demanda',
      'Integração com ecossistema dMRV e conformidade ESG',
      'Contato direto com nossa equipe para proposta customizada',
    ],
  },
]

export const AVISO_LEGAL_RADAR =
  'Conteúdo estritamente informativo; não substitui assessoria jurídica ou contábil individualizada.'

/**
 * Verifica se um usuário possui acesso ativo ao Radar Semanal
 * (trial dentro do prazo, assinatura ativa, ou papel administrativo).
 */
export function verificarAcessoRadar(user: any): {
  temAcesso: boolean
  motivo:
    | 'admin'
    | 'trial_ativo'
    | 'assinatura_ativa'
    | 'trial_expirado'
    | 'assinatura_expirada'
    | 'sem_acesso'
  diasRestantesTrial: number
  status: RadarAcessoStatus
  planoFaixa: RadarFaixaCnpj
} {
  if (!user) {
    return {
      temAcesso: false,
      motivo: 'sem_acesso',
      diasRestantesTrial: 0,
      status: 'nenhum',
      planoFaixa: 'nenhum',
    }
  }

  const role = user.role || 'cliente'
  if (role === 'admin' || role === 'master' || role === 'controller') {
    return {
      temAcesso: true,
      motivo: 'admin',
      diasRestantesTrial: 999,
      status: 'ativo',
      planoFaixa: 'ate_30_cnpjs',
    }
  }

  const status: RadarAcessoStatus = user.radar_acesso_status || 'nenhum'
  const planoFaixa: RadarFaixaCnpj = user.radar_plano_faixa || 'nenhum'
  const agora = new Date()

  if (status === 'ativo') {
    if (!user.radar_assinatura_fim) {
      return {
        temAcesso: true,
        motivo: 'assinatura_ativa',
        diasRestantesTrial: 0,
        status,
        planoFaixa,
      }
    }
    const dataFim = new Date(user.radar_assinatura_fim)
    if (dataFim >= agora) {
      return {
        temAcesso: true,
        motivo: 'assinatura_ativa',
        diasRestantesTrial: 0,
        status,
        planoFaixa,
      }
    }
    return {
      temAcesso: false,
      motivo: 'assinatura_expirada',
      diasRestantesTrial: 0,
      status: 'expirado',
      planoFaixa,
    }
  }

  if (status === 'trial') {
    if (!user.radar_trial_fim) {
      return { temAcesso: true, motivo: 'trial_ativo', diasRestantesTrial: 15, status, planoFaixa }
    }
    const dataFim = new Date(user.radar_trial_fim)
    const diffMs = dataFim.getTime() - agora.getTime()
    const dias = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
    if (dias > 0) {
      return {
        temAcesso: true,
        motivo: 'trial_ativo',
        diasRestantesTrial: dias,
        status,
        planoFaixa,
      }
    }
    return {
      temAcesso: false,
      motivo: 'trial_expirado',
      diasRestantesTrial: 0,
      status: 'expirado',
      planoFaixa,
    }
  }

  return {
    temAcesso: false,
    motivo: 'sem_acesso',
    diasRestantesTrial: 0,
    status,
    planoFaixa,
  }
}

/**
 * Ativa o trial gratuito de 15 dias para o usuário atual (sem cartão).
 */
export async function ativarTrial15DiasUsuario(
  userId: string,
  faixa: RadarFaixaCnpj = '1_cnpj',
): Promise<any> {
  const agora = new Date()
  const dataFim = new Date(agora.getTime() + 15 * 24 * 60 * 60 * 1000)

  const updated = await pb.collection('users').update(userId, {
    radar_acesso_status: 'trial',
    radar_plano_faixa: faixa,
    radar_trial_fim: dataFim.toISOString(),
  })

  return updated
}

/**
 * Lista as edições do Radar.
 * Para usuários logados com acesso: todas as publicadas + estado lida/não lida.
 * Para público não logado: somente edições com aberta_publico = true.
 */
export async function listarEdicoesRadar(userId?: string): Promise<RadarEdicaoRecord[]> {
  try {
    let filter = 'publicada = true'
    if (!userId) {
      filter = 'aberta_publico = true && publicada = true'
    }

    const edicoes = await pb.collection('radar_edicoes').getFullList<any>({
      filter,
      sort: '-numero_edicao',
    })

    let leiturasMap = new Map<string, { lida: boolean; leitura_id: string }>()
    if (userId) {
      try {
        const leituras = await pb.collection('radar_leituras').getFullList<any>({
          filter: `usuario = "${userId}"`,
        })
        for (const l of leituras) {
          leiturasMap.set(l.edicao, { lida: Boolean(l.lida), leitura_id: l.id })
        }
      } catch {
        /* intentionally ignored */
      }
    }

    return edicoes.map((e) => {
      const leituraInfo = leiturasMap.get(e.id)
      return {
        id: e.id,
        numero_edicao: e.numero_edicao,
        titulo: e.titulo,
        resumo_semana: e.resumo_semana || '',
        data_edicao: e.data_edicao,
        aberta_publico: Boolean(e.aberta_publico),
        mes_ano_referencia: e.mes_ano_referencia || '',
        itens_normas_json: Array.isArray(e.itens_normas_json)
          ? e.itens_normas_json
          : typeof e.itens_normas_json === 'string'
            ? JSON.parse(e.itens_normas_json || '[]')
            : [],
        autor_editorial: e.autor_editorial || 'Curadoria Regulatória Orbis',
        publicada: Boolean(e.publicada),
        total_destinatarios_enviados: e.total_destinatarios_enviados || 0,
        data_envio_digest: e.data_envio_digest || '',
        created: e.created,
        updated: e.updated,
        lida: leituraInfo ? leituraInfo.lida : false,
        leitura_id: leituraInfo ? leituraInfo.leitura_id : undefined,
      }
    })
  } catch (err) {
    console.error('Erro ao listar edições do radar:', err)
    return []
  }
}

/**
 * Obtém a edição aberta do mês para prova de qualidade pública.
 */
export async function obterEdicaoAbertaDoMes(): Promise<RadarEdicaoRecord | null> {
  try {
    const list = await pb.collection('radar_edicoes').getList<any>(1, 1, {
      filter: 'aberta_publico = true && publicada = true',
      sort: '-data_edicao',
    })
    if (list.items && list.items.length > 0) {
      const e = list.items[0]
      return {
        id: e.id,
        numero_edicao: e.numero_edicao,
        titulo: e.titulo,
        resumo_semana: e.resumo_semana || '',
        data_edicao: e.data_edicao,
        aberta_publico: true,
        mes_ano_referencia: e.mes_ano_referencia || '',
        itens_normas_json: Array.isArray(e.itens_normas_json)
          ? e.itens_normas_json
          : typeof e.itens_normas_json === 'string'
            ? JSON.parse(e.itens_normas_json || '[]')
            : [],
        autor_editorial: e.autor_editorial || 'Curadoria Regulatória Orbis',
        publicada: true,
        created: e.created,
        updated: e.updated,
      }
    }
    return null
  } catch (err) {
    console.error('Erro ao buscar edição aberta do mês:', err)
    return null
  }
}

/**
 * Alterna a marcação de lida / não lida de uma edição pelo usuário logado.
 */
export async function alternarLeituraEdicao(
  userId: string,
  edicaoId: string,
  lida: boolean,
  leituraId?: string,
): Promise<{ lida: boolean; leitura_id: string }> {
  if (leituraId) {
    const res = await pb.collection('radar_leituras').update(leituraId, {
      lida,
      data_leitura: lida ? new Date().toISOString() : '',
    })
    return { lida: Boolean(res.lida), leitura_id: res.id }
  }

  // Tenta achar ou criar
  try {
    const existente = await pb
      .collection('radar_leituras')
      .getFirstListItem(`usuario = "${userId}" && edicao = "${edicaoId}"`)
    const res = await pb.collection('radar_leituras').update(existente.id, {
      lida,
      data_leitura: lida ? new Date().toISOString() : '',
    })
    return { lida: Boolean(res.lida), leitura_id: res.id }
  } catch (_) {
    const criada = await pb.collection('radar_leituras').create({
      usuario: userId,
      edicao: edicaoId,
      lida,
      data_leitura: lida ? new Date().toISOString() : '',
    })
    return { lida: Boolean(criada.lida), leitura_id: criada.id }
  }
}

/**
 * Funções administrativas do Console Admin para o Radar Semanal:
 */

export async function listarAssinantesRadarAdmin(): Promise<any[]> {
  try {
    const users = await pb.collection('users').getFullList<any>({
      filter:
        'radar_acesso_status != "nenhum" || radar_trial_fim != "" || radar_assinatura_fim != ""',
      sort: '-created',
    })
    return users
  } catch (err) {
    console.error('Erro ao listar assinantes do radar:', err)
    return []
  }
}

export async function atualizarAcessoRadarUsuarioAdmin(
  userId: string,
  dados: {
    radar_acesso_status: RadarAcessoStatus
    radar_plano_faixa: RadarFaixaCnpj
    radar_trial_fim?: string
    radar_assinatura_fim?: string
  },
): Promise<any> {
  const updated = await pb.collection('users').update(userId, dados)
  return updated
}

export async function criarOuAtualizarEdicaoAdmin(dados: Partial<RadarEdicaoRecord>): Promise<any> {
  const payload = {
    numero_edicao: dados.numero_edicao,
    titulo: dados.titulo,
    resumo_semana: dados.resumo_semana,
    data_edicao: dados.data_edicao,
    aberta_publico: Boolean(dados.aberta_publico),
    mes_ano_referencia: dados.mes_ano_referencia,
    itens_normas_json: dados.itens_normas_json,
    autor_editorial: dados.autor_editorial || 'Curadoria Regulatória Orbis',
    publicada: dados.publicada !== false,
  }

  if (dados.id) {
    return await pb.collection('radar_edicoes').update(dados.id, payload)
  }
  return await pb.collection('radar_edicoes').create(payload)
}

export async function dispararDigestSemanalAdmin(edicaoId?: string): Promise<any> {
  const token = pb.authStore.token
  const baseUrl = pb.baseUrl
  const res = await fetch(`${baseUrl}/backend/v1/radar-digest-disparar`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ edicao_id: edicaoId }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Falha no disparo do digest' }))
    throw new Error(err.error || 'Erro no disparo do digest')
  }
  return await res.json()
}
