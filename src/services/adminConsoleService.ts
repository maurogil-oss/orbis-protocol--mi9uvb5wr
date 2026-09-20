import pb from '@/lib/pocketbase/client'

export interface AdminKpis {
  receitaTotal: number
  cobrancasPagas: number
  cobrancasPendentes: number
  totalClientes: number
  totalLeads: number
  totalConsultasDpp: number
  totalLotesCdv: number
  totalRevisoes: number
  totalConsultasInfosimples: number
  custoTotalInfosimples: number
  comissoesPendentes: number
  comissoesPagas: number
  totalParceiros: number
  peritosPendentes: number
  peritosAprovados: number
}

export async function carregarAdminKpis(): Promise<AdminKpis> {
  const [
    cobrancas,
    users,
    leads,
    dpps,
    lotes,
    revisoes,
    infosimples,
    comissoes,
    parceiros,
    peritos,
  ] = await Promise.allSettled([
    pb.collection('cobrancas').getFullList({ fields: 'valor,status' }),
    pb.collection('users').getFullList({ fields: 'id,role' }),
    pb.collection('leads_diagnostico').getFullList({
      filter: 'demonstracao != true',
      fields: 'id,status,demonstracao',
    }),
    pb.collection('dpp_consultas').getFullList({ fields: 'id' }),
    pb.collection('cdv_lotes').getFullList({ fields: 'id' }),
    pb.collection('pericial_revisoes').getFullList({ fields: 'id' }),
    pb.collection('infosimples_consultas').getFullList({ fields: 'id,custo_creditos' }),
    pb.collection('comissoes').getFullList({ fields: 'id,valor,status' }),
    pb.collection('parceiros').getFullList({ fields: 'id,status' }),
    pb.collection('perito_credenciamentos').getFullList({ fields: 'id,status' }),
  ])

  let receitaTotal = 0
  let cobrancasPagas = 0
  let cobrancasPendentes = 0

  if (cobrancas.status === 'fulfilled') {
    for (const c of cobrancas.value as any[]) {
      if (c.status === 'pago') {
        receitaTotal += Number(c.valor) || 0
        cobrancasPagas += 1
      } else if (c.status === 'pendente' || c.status === 'pendente_simulacao') {
        cobrancasPendentes += 1
      }
    }
  }

  let totalConsultasInfosimples = 0
  let custoTotalInfosimples = 0
  if (infosimples.status === 'fulfilled') {
    totalConsultasInfosimples = infosimples.value.length
    for (const inf of infosimples.value as any[]) {
      custoTotalInfosimples += Number(inf.custo_creditos) || 0
    }
  }

  let comissoesPendentes = 0
  let comissoesPagas = 0
  if (comissoes.status === 'fulfilled') {
    for (const com of comissoes.value as any[]) {
      if (com.status === 'paga') {
        comissoesPagas += Number(com.valor) || 0
      } else {
        comissoesPendentes += Number(com.valor) || 0
      }
    }
  }

  let peritosPendentes = 0
  let peritosAprovados = 0
  if (peritos.status === 'fulfilled') {
    for (const p of peritos.value as any[]) {
      if (p.status === 'pendente') peritosPendentes += 1
      if (p.status === 'aprovado') peritosAprovados += 1
    }
  }

  return {
    receitaTotal,
    cobrancasPagas,
    cobrancasPendentes,
    totalClientes: users.status === 'fulfilled' ? users.value.length : 0,
    totalLeads: leads.status === 'fulfilled' ? leads.value.length : 0,
    totalConsultasDpp: dpps.status === 'fulfilled' ? dpps.value.length : 0,
    totalLotesCdv: lotes.status === 'fulfilled' ? lotes.value.length : 0,
    totalRevisoes: revisoes.status === 'fulfilled' ? revisoes.value.length : 0,
    totalConsultasInfosimples,
    custoTotalInfosimples,
    comissoesPendentes,
    comissoesPagas,
    totalParceiros: parceiros.status === 'fulfilled' ? parceiros.value.length : 0,
    peritosPendentes,
    peritosAprovados,
  }
}

export async function listarClientesAdmin() {
  return pb.collection('users').getFullList({
    sort: '-created',
  })
}

export async function atualizarClienteAdmin(userId: string, data: Record<string, any>) {
  return pb.collection('users').update(userId, data)
}

export async function listarCobrancasAdmin(filtroStatus?: string) {
  const filter = filtroStatus && filtroStatus !== 'todos' ? `status = '${filtroStatus}'` : ''
  return pb.collection('cobrancas').getFullList({
    filter,
    sort: '-created',
    expand: 'usuario,parceiro_id',
  })
}

export async function listarLeadsAdmin(incluirDemonstracao = false) {
  const filter = incluirDemonstracao ? '' : 'demonstracao != true'
  return pb.collection('leads_diagnostico').getFullList({
    filter,
    sort: '-created',
    expand: 'usuario',
  })
}

export async function listarConsultasDppAdmin() {
  return pb.collection('dpp_consultas').getFullList({
    sort: '-created',
  })
}

export async function listarLotesCdvAdmin() {
  return pb.collection('cdv_lotes').getFullList({
    sort: '-created',
  })
}

export async function listarPecasCdvAdmin() {
  return pb.collection('cdv_pecas').getFullList({
    sort: '-created',
  })
}

export async function listarDestinacoesFinaisAdmin() {
  return pb.collection('dpp_destinacao_final').getFullList({
    sort: '-created',
    expand: 'lote',
  })
}

export async function listarRevisoesPericiaisAdmin() {
  return pb.collection('pericial_revisoes').getFullList({
    sort: '-created',
    expand: 'usuario,inventario',
  })
}

export async function listarConsultasInfosimplesAdmin() {
  return pb.collection('infosimples_consultas').getFullList({
    sort: '-created',
    expand: 'usuario',
  })
}
