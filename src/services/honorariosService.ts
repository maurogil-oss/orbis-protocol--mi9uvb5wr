import pb from '@/lib/pocketbase/client'

export type TipoPerito = 'CREA' | 'CAU' | 'CFT' | 'CRC' | 'CRQ' | 'CRBio' | 'OUTRO'

export type TipoLaudoHonorario =
  | 'laudo_lote_cdverde'
  | 'atestado_orbis_verificacao'
  | 'auditoria_f6_reproducao'
  | 'parecer_sbce'
  | 'inventario_ghg_dmrv'
  | string

export interface CdvHonorarioRecord {
  id: string
  tipo_perito: TipoPerito
  tipo_laudo: TipoLaudoHonorario
  titulo_laudo: string
  valor_base: number
  unidade: string // ex: "por laudo", "por lote", "por hora"
  vigencia_inicio: string // YYYY-MM-DD
  vigencia_fim?: string
  ativo: boolean
  observacoes?: string
  atualizado_por?: string
  created: string
  updated: string
}

export interface CriarHonorarioInput {
  tipo_perito: TipoPerito
  tipo_laudo: TipoLaudoHonorario
  titulo_laudo: string
  valor_base: number
  unidade: string
  vigencia_inicio: string
  vigencia_fim?: string
  ativo?: boolean
  observacoes?: string
}

export interface AtualizarHonorarioComHistoricoInput {
  registroAnteriorId: string
  novoValorBase: number
  novaUnidade?: string
  novoTituloLaudo?: string
  novasObservacoes?: string
  novaDataVigenciaInicio: string
}

export const HONORARIOS_FALLBACK: Omit<CdvHonorarioRecord, 'id' | 'created' | 'updated'>[] = [
  {
    tipo_perito: 'CREA',
    tipo_laudo: 'laudo_lote_cdverde',
    titulo_laudo: 'Laudo Pericial de Lote CDVerde (Desmontagem & Circularidade)',
    valor_base: 850.0,
    unidade: 'por lote',
    vigencia_inicio: '2025-01-01',
    ativo: true,
    observacoes:
      'Aferição física e documental de peças desmontadas, rastreabilidade QR Code e ART acoplada.',
  },
  {
    tipo_perito: 'CREA',
    tipo_laudo: 'atestado_orbis_verificacao',
    titulo_laudo: 'Atestado Orbis (com ART/RRT) — Verificação dMRV e Conformidade',
    valor_base: 1450.0,
    unidade: 'por laudo',
    vigencia_inicio: '2025-01-01',
    ativo: true,
    observacoes:
      'Verificação pericial de balanço de massa, fatores de emissão oficiais e anotação de responsabilidade técnica.',
  },
  {
    tipo_perito: 'CREA',
    tipo_laudo: 'auditoria_f6_reproducao',
    titulo_laudo: 'Auditoria F6 — Reprodução de Cálculo Metodológico e Amostragem',
    valor_base: 2200.0,
    unidade: 'por lote',
    vigencia_inicio: '2025-01-01',
    ativo: true,
    observacoes:
      'Reprodução analítica independente sem motor proprietário conforme DM-ORB-001 v1.1 §6.3.',
  },
  {
    tipo_perito: 'CRC',
    tipo_laudo: 'atestado_orbis_verificacao',
    titulo_laudo: 'Atestado Orbis Contábil — Inventário GHG e Conformidade Tributária',
    valor_base: 1250.0,
    unidade: 'por laudo',
    vigencia_inicio: '2025-01-01',
    ativo: true,
    observacoes:
      'Conciliação contábil-fiscal SPED/NF-e, créditos tributários de circularidade e conformidade NBC TO 3000.',
  },
  {
    tipo_perito: 'CFT',
    tipo_laudo: 'laudo_lote_cdverde',
    titulo_laudo: 'Laudo Pericial de Lote CDVerde (Técnico Industrial TRT)',
    valor_base: 650.0,
    unidade: 'por lote',
    vigencia_inicio: '2025-01-01',
    ativo: true,
    observacoes:
      'Aferição técnica mecânica/automotiva e rastreabilidade no pátio com Termo de Responsabilidade Técnica (TRT).',
  },
  {
    tipo_perito: 'CRQ',
    tipo_laudo: 'atestado_orbis_verificacao',
    titulo_laudo: 'Atestado Orbis — Descontaminação de Fluidos & Emissões Fugitivas',
    valor_base: 1100.0,
    unidade: 'por laudo',
    vigencia_inicio: '2025-01-01',
    ativo: true,
    observacoes:
      'Validação de recuperação de gases halogenados (R-134a/R-1234yf), descarte de óleos perigosos e ART química.',
  },
  {
    tipo_perito: 'CAU',
    tipo_laudo: 'atestado_orbis_verificacao',
    titulo_laudo: 'Atestado Orbis — Avaliação de Adequação de Instalações e Galpões CDV',
    valor_base: 1350.0,
    unidade: 'por laudo',
    vigencia_inicio: '2025-01-01',
    ativo: true,
    observacoes:
      'Inspeção arquitetônica de pisos impermeabilizados, bacias de contenção e áreas de segregação com RRT.',
  },
]

/**
 * Lista todos os honorários vigentes (público / peritos)
 */
export async function listarHonorariosVigentes(): Promise<CdvHonorarioRecord[]> {
  try {
    const records = await pb.collection('cdv_honorarios').getFullList<CdvHonorarioRecord>({
      filter: 'ativo = true',
      sort: 'tipo_perito,tipo_laudo',
      requestKey: null,
    })
    if (records && records.length > 0) {
      return records
    }
  } catch (err) {
    console.warn('[honorariosService] Falha ao consultar cdv_honorarios via PB:', err)
  }

  // Fallback seguro em caso de indisponibilidade
  return HONORARIOS_FALLBACK.map((h, i) => ({
    ...h,
    id: `fallback-hon-${i + 1}`,
    created: '2025-01-01T00:00:00.000Z',
    updated: '2025-01-01T00:00:00.000Z',
  }))
}

/**
 * Lista todo o histórico de honorários para o Console Administrativo
 */
export async function listarTodosHonorariosAdmin(): Promise<CdvHonorarioRecord[]> {
  try {
    return await pb.collection('cdv_honorarios').getFullList<CdvHonorarioRecord>({
      sort: '-created',
      requestKey: null,
    })
  } catch (err) {
    console.warn('[honorariosService] Falha ao listar cdv_honorarios admin:', err)
    return listarHonorariosVigentes()
  }
}

/**
 * Cria um novo registro de honorário pericial
 */
export async function criarHonorario(input: CriarHonorarioInput): Promise<CdvHonorarioRecord> {
  const currentUserId = pb.authStore.model?.id
  const payload: Record<string, any> = {
    tipo_perito: input.tipo_perito,
    tipo_laudo: input.tipo_laudo,
    titulo_laudo: input.titulo_laudo,
    valor_base: input.valor_base,
    unidade: input.unidade,
    vigencia_inicio: input.vigencia_inicio,
    vigencia_fim: input.vigencia_fim || '',
    ativo: input.ativo !== undefined ? input.ativo : true,
    observacoes: input.observacoes || '',
  }
  if (currentUserId) {
    payload.atualizado_por = currentUserId
  }

  return await pb.collection('cdv_honorarios').create<CdvHonorarioRecord>(payload)
}

/**
 * Encerra a vigência de um registro existente sem apagá-lo (preservação do histórico imutável)
 */
export async function encerrarVigenciaHonorario(
  id: string,
  dataEncerramento?: string,
): Promise<CdvHonorarioRecord> {
  const dataFim = dataEncerramento || new Date().toISOString().slice(0, 10)
  const currentUserId = pb.authStore.model?.id
  const payload: Record<string, any> = {
    ativo: false,
    vigencia_fim: dataFim,
  }
  if (currentUserId) {
    payload.atualizado_por = currentUserId
  }

  return await pb.collection('cdv_honorarios').update<CdvHonorarioRecord>(id, payload)
}

/**
 * Ajusta o valor de honorário conforme o mercado preservando o histórico:
 * 1. Encerra a vigência do registro anterior
 * 2. Cria um novo registro com o novo valor e nova data de início de vigência
 */
export async function atualizarValorHonorarioComHistorico(
  input: AtualizarHonorarioComHistoricoInput,
): Promise<{ anterior: CdvHonorarioRecord; novo: CdvHonorarioRecord }> {
  // Carrega registro anterior
  const anterior = await pb
    .collection('cdv_honorarios')
    .getOne<CdvHonorarioRecord>(input.registroAnteriorId)

  // Encerra anterior no dia anterior ou na data de início da nova vigência
  const anteriorEncerrado = await encerrarVigenciaHonorario(
    anterior.id,
    input.novaDataVigenciaInicio,
  )

  // Cria novo registro
  const novo = await criarHonorario({
    tipo_perito: anterior.tipo_perito,
    tipo_laudo: anterior.tipo_laudo,
    titulo_laudo: input.novoTituloLaudo || anterior.titulo_laudo,
    valor_base: input.novoValorBase,
    unidade: input.novaUnidade || anterior.unidade,
    vigencia_inicio: input.novaDataVigenciaInicio,
    ativo: true,
    observacoes:
      input.novasObservacoes ||
      `Ajuste de mercado em ${new Date().toLocaleDateString('pt-BR')} (valor anterior: R$ ${anterior.valor_base.toFixed(2)}).`,
  })

  return { anterior: anteriorEncerrado, novo }
}
