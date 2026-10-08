/**
 * Serviço de Camada de Licença e Trial do Produto Central — Orbis Protocol
 *
 * Modelo de Comercialização Definido:
 * 1. Produto CENTRAL: Pegada de carbono das notas fiscais e produtos (informação rápida e consistente).
 * 2. Tributo (PLUS de atração): "Situação tributária da empresa em relação à reforma tributária"
 *    - NUNCA prometer achado de crédito ou recuperação de dinheiro escondido.
 * 3. Radar Semanal (PLUS de receita): Monitoramento regulatório contínuo por faixas (1=R$59, 5=R$149, 30=R$249, acima sob consulta). Liberação manual pelo Console v1.
 * 4. Cadastro Gratuito: Entrega o diagnóstico completo do CNPJ (elegibilidade, protocolos aplicáveis, comparativo) SEM valores de nota.
 * 5. Trial de 15 dias: Sem cartão de crédito, LIMITE EXATO DE 5 NOTAS INICIAIS.
 * 6. Plano Contratado: Pegada contínua ilimitada + Laudo pericial (hash, chancela, DPP, exportações auditáveis) + Situação tributária contínua + Radar Semanal como plus.
 * 7. Bloqueio Suave: Ao expirar os 15 dias ou esgotar as 5 notas, o usuário preserva o histórico e resultados já produzidos, mas novas importações mostram convite de contratação.
 */

import pb from '@/lib/pocketbase/client'

export type CamadaLicenca = 'free_cadastro' | 'trial' | 'plano_contratado'

export const LIMITE_NOTAS_TRIAL_PADRAO = 5
export const DURACAO_DIAS_TRIAL_PADRAO = 15

export interface EstadoLicencaUsuario {
  camada: CamadaLicenca
  isTrial: boolean
  isPlanoContratado: boolean
  isFreeCadastro: boolean
  // Confirmação de e-mail institucional
  emailVerificado: boolean
  precisaConfirmarEmail: boolean
  // Dados do trial
  trialAtivo: boolean
  trialPendenteConfirmacaoEmail: boolean
  trialExpiradoPorTempo: boolean
  trialEsgotadoPorNotas: boolean
  bloqueioSuaveAtivo: boolean
  motivoBloqueio?: 'dias_expirados' | 'limite_notas_atingido' | 'sem_trial'
  diasRestantesTrial: number
  diasTotaisTrial: number
  notasConsumidas: number
  notasLimite: number
  notasRestantes: number
  dataInicioTrial?: string
  dataFimTrial?: string
  // Regras de acesso
  podeImportarNovasNotas: boolean
  podeVerPegadaPorNota: boolean
  podeVerSituacaoTributariaPorNota: boolean
  podeVerDiagnosticoCnpjCompleto: boolean
  podeEmitirLaudoPericialCompleto: boolean
  // Mensagem institucional amigável
  mensagemStatus: string
}

export interface UsuarioLicencaInput {
  id?: string
  email?: string
  verified?: boolean
  role?: string
  plano_ativo?: string
  assinatura_status?: string
  licenca_camada?: string
  trial_tipo?: string
  trial_inicio?: string
  trial_fim?: string
  trial_notas_limite?: number
  trial_notas_consumidas?: number
  cliente_acesso_status?: string
  ultimo_acesso?: string
  created?: string
}

/**
 * Avalia o estado de licença a partir de um registro de usuário (puro, testável sem rede).
 */
export function avaliarEstadoLicenca(
  user?: UsuarioLicencaInput | null,
  totalNotasBanco?: number,
): EstadoLicencaUsuario {
  // Se não autenticado
  if (!user) {
    return {
      camada: 'free_cadastro',
      isTrial: false,
      isPlanoContratado: false,
      isFreeCadastro: true,
      emailVerificado: false,
      precisaConfirmarEmail: false,
      trialAtivo: false,
      trialPendenteConfirmacaoEmail: false,
      trialExpiradoPorTempo: false,
      trialEsgotadoPorNotas: false,
      bloqueioSuaveAtivo: false,
      diasRestantesTrial: 0,
      diasTotaisTrial: DURACAO_DIAS_TRIAL_PADRAO,
      notasConsumidas: 0,
      notasLimite: LIMITE_NOTAS_TRIAL_PADRAO,
      notasRestantes: 0,
      podeImportarNovasNotas: false,
      podeVerPegadaPorNota: false,
      podeVerSituacaoTributariaPorNota: false,
      podeVerDiagnosticoCnpjCompleto: true,
      podeEmitirLaudoPericialCompleto: false,
      mensagemStatus: 'Cadastro gratuito: diagnóstico do CNPJ liberado sem valores de nota.',
    }
  }

  // Papéis administrativos e técnicos possuem acesso irrestrito para governança e perícia
  const role = user.role || 'cliente'
  const ehGestorOuPerito =
    role === 'master' ||
    role === 'admin' ||
    role === 'controller' ||
    role === 'perito' ||
    role === 'financeiro' ||
    role === 'financeiro_leitor'

  // Plano contratado (assinatura ativa ou plano cadastrado pela gestão)
  const temPlanoAtivo =
    Boolean(user.plano_ativo && user.plano_ativo.trim() !== '' && user.plano_ativo !== 'Nenhum') ||
    user.assinatura_status === 'ativa' ||
    user.licenca_camada === 'plano_contratado'

  const emailVerificado = user.verified === true

  if (ehGestorOuPerito || temPlanoAtivo) {
    return {
      camada: 'plano_contratado',
      isTrial: false,
      isPlanoContratado: true,
      isFreeCadastro: false,
      emailVerificado: true,
      precisaConfirmarEmail: false,
      trialAtivo: false,
      trialPendenteConfirmacaoEmail: false,
      trialExpiradoPorTempo: false,
      trialEsgotadoPorNotas: false,
      bloqueioSuaveAtivo: false,
      diasRestantesTrial: 999,
      diasTotaisTrial: DURACAO_DIAS_TRIAL_PADRAO,
      notasConsumidas: totalNotasBanco ?? (user.trial_notas_consumidas || 0),
      notasLimite: 999999,
      notasRestantes: 999999,
      podeImportarNovasNotas: true,
      podeVerPegadaPorNota: true,
      podeVerSituacaoTributariaPorNota: true,
      podeVerDiagnosticoCnpjCompleto: true,
      podeEmitirLaudoPericialCompleto: true,
      mensagemStatus:
        'Plano Contratado: pegada contínua ilimitada, laudos periciais e situação tributária contínua.',
    }
  }

  // Se o usuário for cliente e ainda não tiver confirmado o e-mail:
  // o trial de 15 dias passa a contar/ativar só após a confirmação.
  // Enquanto verified === false: bloqueia as ações operacionais do trial (importação/cálculo)
  const precisaConfirmarEmail = !emailVerificado

  // Se o usuário está em free_cadastro explícito e sem trial iniciado
  const camadaDeclarada = user.licenca_camada || 'trial' // novos clientes iniciam em trial por padrão
  const ehFreePuro = camadaDeclarada === 'free_cadastro' && !user.trial_inicio && !user.trial_fim

  if (ehFreePuro) {
    return {
      camada: 'free_cadastro',
      isTrial: false,
      isPlanoContratado: false,
      isFreeCadastro: true,
      emailVerificado,
      precisaConfirmarEmail,
      trialAtivo: false,
      trialPendenteConfirmacaoEmail: false,
      trialExpiradoPorTempo: false,
      trialEsgotadoPorNotas: false,
      bloqueioSuaveAtivo: false,
      diasRestantesTrial: 0,
      diasTotaisTrial: DURACAO_DIAS_TRIAL_PADRAO,
      notasConsumidas: totalNotasBanco ?? (user.trial_notas_consumidas || 0),
      notasLimite: 0,
      notasRestantes: 0,
      podeImportarNovasNotas: false,
      podeVerPegadaPorNota: false,
      podeVerSituacaoTributariaPorNota: false,
      podeVerDiagnosticoCnpjCompleto: true,
      podeEmitirLaudoPericialCompleto: false,
      mensagemStatus:
        'Cadastro gratuito: diagnóstico completo do CNPJ disponível. Ative o trial de 15 dias para ler até 5 notas.',
    }
  }

  // Modo TRIAL de 15 dias e 5 notas iniciais
  const agora = new Date()
  let dataFim: Date
  let dataInicio: Date

  if (user.trial_fim) {
    dataFim = new Date(user.trial_fim)
    dataInicio = user.trial_inicio
      ? new Date(user.trial_inicio)
      : new Date(dataFim.getTime() - DURACAO_DIAS_TRIAL_PADRAO * 24 * 60 * 60 * 1000)
  } else {
    dataInicio = user.created ? new Date(user.created) : agora
    dataFim = new Date(dataInicio.getTime() + DURACAO_DIAS_TRIAL_PADRAO * 24 * 60 * 60 * 1000)
  }

  const msRestantes = dataFim.getTime() - agora.getTime()
  const diasRestantes = Math.max(0, Math.ceil(msRestantes / (1000 * 60 * 60 * 24)))
  const trialExpiradoPorTempo = msRestantes <= 0

  const notasLimite =
    typeof user.trial_notas_limite === 'number' && user.trial_notas_limite > 0
      ? user.trial_notas_limite
      : LIMITE_NOTAS_TRIAL_PADRAO

  const notasConsumidas =
    typeof totalNotasBanco === 'number' ? totalNotasBanco : user.trial_notas_consumidas || 0

  const notasRestantes = Math.max(0, notasLimite - notasConsumidas)
  const trialEsgotadoPorNotas = notasRestantes <= 0

  const bloqueioSuaveAtivo = trialExpiradoPorTempo || trialEsgotadoPorNotas
  const trialAtivo = !bloqueioSuaveAtivo && !precisaConfirmarEmail

  let motivoBloqueio: 'dias_expirados' | 'limite_notas_atingido' | undefined
  let mensagemStatus = ''

  if (precisaConfirmarEmail) {
    mensagemStatus =
      'Confirme seu e-mail institucional para ativar o trial de 15 dias sem cartão com 5 notas fiscais.'
  } else if (trialExpiradoPorTempo) {
    motivoBloqueio = 'dias_expirados'
    mensagemStatus = `Trial de 15 dias encerrado. Seus resultados anteriores continuam preservados. Contrate o plano para importação contínua.`
  } else if (trialEsgotadoPorNotas) {
    motivoBloqueio = 'limite_notas_atingido'
    mensagemStatus = `Limite de ${notasLimite} notas do trial atingido (${diasRestantes} dias restantes). Seus dados continuam disponíveis. Contrate o plano para importações ilimitadas.`
  } else {
    mensagemStatus = `Trial ativo: restam ${diasRestantes} dias e ${notasRestantes} de ${notasLimite} notas iniciais sem cartão.`
  }

  return {
    camada: 'trial',
    isTrial: true,
    isPlanoContratado: false,
    isFreeCadastro: false,
    emailVerificado,
    precisaConfirmarEmail,
    trialAtivo,
    trialPendenteConfirmacaoEmail: precisaConfirmarEmail,
    trialExpiradoPorTempo,
    trialEsgotadoPorNotas,
    bloqueioSuaveAtivo,
    motivoBloqueio,
    diasRestantesTrial: diasRestantes,
    diasTotaisTrial: DURACAO_DIAS_TRIAL_PADRAO,
    notasConsumidas,
    notasLimite,
    notasRestantes,
    dataInicioTrial: dataInicio.toISOString(),
    dataFimTrial: dataFim.toISOString(),
    // Bloqueia as ações operacionais de importação até que o e-mail esteja confirmado
    podeImportarNovasNotas: !bloqueioSuaveAtivo && !precisaConfirmarEmail,
    podeVerPegadaPorNota: true,
    podeVerSituacaoTributariaPorNota: true,
    podeVerDiagnosticoCnpjCompleto: true,
    podeEmitirLaudoPericialCompleto: false,
    mensagemStatus,
  }
}

/**
 * Obtém o estado de licença completo do usuário corrente sincronizando contagem real de notas no PocketBase.
 */
export async function obterEstadoLicencaUsuario(usuarioId?: string): Promise<EstadoLicencaUsuario> {
  const userPb = pb.authStore.record
  const uid = usuarioId || userPb?.id

  if (!uid) {
    return avaliarEstadoLicenca(null)
  }

  try {
    // 1. Busca usuário mais atualizado do PocketBase
    const user = await pb.collection('users').getOne<UsuarioLicencaInput>(uid)

    // 2. Conta notas reais do usuário na coleção nfe_upload
    let totalNotas = 0
    try {
      const contagemRes = await pb.collection('nfe_upload').getList(1, 1, {
        filter: `usuario = "${uid}"`,
      })
      totalNotas = contagemRes.totalItems
    } catch {
      totalNotas = user.trial_notas_consumidas || 0
    }

    // Se o usuário ainda não tiver trial_inicio ou trial_fim configurados, inicializa no PB
    if (
      !user.trial_inicio &&
      user.licenca_camada !== 'free_cadastro' &&
      user.licenca_camada !== 'plano_contratado'
    ) {
      try {
        const agora = new Date()
        const dataFim = new Date(agora.getTime() + DURACAO_DIAS_TRIAL_PADRAO * 24 * 60 * 60 * 1000)
        await pb.collection('users').update(uid, {
          trial_tipo: 'trial_15d_5notas',
          trial_inicio: agora.toISOString(),
          trial_fim: dataFim.toISOString(),
          trial_notas_limite: LIMITE_NOTAS_TRIAL_PADRAO,
          trial_notas_consumidas: totalNotas,
          licenca_camada: 'trial',
        })
        user.trial_tipo = 'trial_15d_5notas'
        user.trial_inicio = agora.toISOString()
        user.trial_fim = dataFim.toISOString()
        user.trial_notas_limite = LIMITE_NOTAS_TRIAL_PADRAO
        user.trial_notas_consumidas = totalNotas
        user.licenca_camada = 'trial'
      } catch {
        /* se falhar por permissão de update, segue com avaliação em memória */
      }
    } else if (user.trial_notas_consumidas !== totalNotas) {
      // Sincroniza contador de notas consumidas
      try {
        await pb.collection('users').update(uid, {
          trial_notas_consumidas: totalNotas,
        })
        user.trial_notas_consumidas = totalNotas
      } catch {
        /* ignora se não conseguir atualizar */
      }
    }

    return avaliarEstadoLicenca(user, totalNotas)
  } catch {
    // Fallback: avalia com os dados locais do authStore se a rede falhar
    return avaliarEstadoLicenca(userPb as any)
  }
}

/**
 * Incrementa contador de notas consumidas no PocketBase (chamado após ingestão bem-sucedida de nota).
 */
export async function registrarConsumoNotaTrial(
  usuarioId: string,
  quantidade: number = 1,
): Promise<void> {
  if (!usuarioId) return
  try {
    const user = await pb.collection('users').getOne<UsuarioLicencaInput>(usuarioId)
    const atual = user.trial_notas_consumidas || 0
    await pb.collection('users').update(usuarioId, {
      trial_notas_consumidas: atual + quantidade,
    })
  } catch {
    /* tolerância a falha silenciosa */
  }
}
