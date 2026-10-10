import pb from '@/lib/pocketbase/client'

export type TipoConsultaTimeline = 'nfe_upload' | 'infosimples' | 'cdv_lote' | 'relatorio_exportado'

export interface ItemLinhaDoTempoConsulta {
  id: string
  tipo: TipoConsultaTimeline
  tipoRotulo: string
  referencia: string
  dataHora: string
  status: string
  statusRotulo: string
  statusVariante: 'sucesso' | 'alerta' | 'erro' | 'neutro'
  custoCreditos?: number
  empresaCnpj?: string
  empresaNome?: string
  usuarioId?: string
  usuarioNome?: string
  usuarioEmail?: string
  origem?: string
  isSandbox?: boolean
  dadosCompletos: Record<string, any>
}

export interface FiltrosHistoricoConsultas {
  clienteCnpj?: string // Selecionar por cliente (CNPJ)
  usuarioId?: string // Selecionar por usuário
  tipo?: TipoConsultaTimeline | 'todos'
  status?: string // 'todos' ou valor específico
  dataInicio?: string // YYYY-MM-DD
  dataFim?: string // YYYY-MM-DD
  origemModo?: 'reais' | 'sandbox' | 'todos' // 'reais' por padrão
  buscaTexto?: string
}

export interface MetricasHistoricoConsultas {
  totalConsultas: number
  totalCreditosInfosimples: number
  contagemPorTipo: {
    nfe_upload: number
    infosimples: number
    cdv_lote: number
    relatorio_exportado: number
  }
}

export interface ClienteOpcaoFiltro {
  cnpj: string
  nome: string
}

export interface UsuarioOpcaoFiltro {
  id: string
  nome: string
  email: string
}

/**
 * Normaliza e agrega registros de nfe_upload
 */
export function normalizarNfeUpload(rec: any): ItemLinhaDoTempoConsulta {
  const isSintetico =
    rec.origem === 'sintetico' ||
    Boolean(rec.dados_adicionais_json?.is_demo) ||
    (typeof rec.chave_acesso === 'string' && rec.chave_acesso.includes('SANDBOX'))

  const status = rec.resumo_itens_json?.status || 'concluido'

  return {
    id: `nfe-${rec.id}`,
    tipo: 'nfe_upload',
    tipoRotulo: 'NF-e / Documento Fiscal',
    referencia: rec.chave_acesso || rec.numero_nota || `NF-${rec.id.slice(0, 8)}`,
    dataHora: rec.created || rec.data_emissao || new Date().toISOString(),
    status,
    statusRotulo: status === 'erro' ? 'Erro de Leitura' : 'Nota Consultada / Importada',
    statusVariante: status === 'erro' ? 'erro' : 'sucesso',
    custoCreditos: undefined,
    empresaCnpj: rec.cnpj_emitente || rec.cnpj_destinatario || rec.expand?.usuario?.cnpj || '',
    empresaNome:
      rec.nome_emitente || rec.nome_destinatario || rec.expand?.usuario?.name || 'Empresa',
    usuarioId: rec.usuario || rec.expand?.usuario?.id || '',
    usuarioNome: rec.expand?.usuario?.name || rec.expand?.usuario?.email || 'Usuário',
    usuarioEmail: rec.expand?.usuario?.email || '',
    origem: rec.origem || 'upload',
    isSandbox: isSintetico,
    dadosCompletos: {
      ...rec,
      _colecaoOrigem: 'nfe_upload',
      chave_acesso: rec.chave_acesso,
      modelo_fiscal: rec.modelo_fiscal,
      valor_total_nf: rec.valor_total_nf,
      qtd_itens: rec.qtd_itens,
      data_emissao: rec.data_emissao,
    },
  }
}

/**
 * Normaliza e agrega registros de infosimples_consultas
 */
export function normalizarInfosimples(rec: any): ItemLinhaDoTempoConsulta {
  const custo =
    typeof rec.custo_creditos === 'number' ? rec.custo_creditos : Number(rec.custo_creditos) || 0
  const isSintetico =
    rec.status === 'simulacao' ||
    (rec.mensagem_retorno && rec.mensagem_retorno.toLowerCase().includes('sintétic')) ||
    (rec.resposta_json &&
      typeof rec.resposta_json === 'object' &&
      rec.resposta_json.modo === 'sandbox')

  let statusVariante: 'sucesso' | 'alerta' | 'erro' | 'neutro' = 'sucesso'
  let statusRotulo = 'Sucesso (API InfoSimples)'

  if (rec.status === 'erro_api') {
    statusVariante = 'erro'
    statusRotulo = 'Erro API / Não encontrada'
  } else if (rec.status === 'token_ausente') {
    statusVariante = 'alerta'
    statusRotulo = 'Token Não Configurado'
  } else if (rec.status === 'nao_encontrado') {
    statusVariante = 'alerta'
    statusRotulo = 'Não Encontrado na SEFAZ'
  } else if (rec.status === 'simulacao') {
    statusVariante = 'neutro'
    statusRotulo = 'Simulação (Sandbox)'
  }

  const userCnpj = rec.expand?.usuario?.cnpj || ''
  const userNome = rec.expand?.usuario?.name || rec.expand?.usuario?.email || 'Usuário'

  return {
    id: `info-${rec.id}`,
    tipo: 'infosimples',
    tipoRotulo: 'InfoSimples (Consulta Fiscal / SEFAZ)',
    referencia: rec.chave_acesso || `CONS-${rec.id.slice(0, 8)}`,
    dataHora: rec.created || new Date().toISOString(),
    status: rec.status || 'sucesso',
    statusRotulo,
    statusVariante,
    custoCreditos: custo,
    empresaCnpj: userCnpj,
    empresaNome: userNome,
    usuarioId: rec.usuario || rec.expand?.usuario?.id || '',
    usuarioNome: userNome,
    usuarioEmail: rec.expand?.usuario?.email || '',
    origem: rec.status === 'simulacao' ? 'sintetico' : 'infosimples',
    isSandbox: Boolean(isSintetico),
    dadosCompletos: {
      ...rec,
      _colecaoOrigem: 'infosimples_consultas',
      chave_acesso: rec.chave_acesso,
      codigo_retorno: rec.codigo_retorno,
      mensagem_retorno: rec.mensagem_retorno,
      usou_certificado_a1: rec.usou_certificado_a1,
      resposta_json: rec.resposta_json,
    },
  }
}

/**
 * Normaliza e agrega registros de cdv_lotes
 */
export function normalizarCdvLote(rec: any): ItemLinhaDoTempoConsulta {
  const isSintetico =
    rec.origem === 'sintetico' ||
    Boolean(rec.is_demo) ||
    (typeof rec.cdv_codigo === 'string' && rec.cdv_codigo.includes('SANDBOX'))

  let statusVariante: 'sucesso' | 'alerta' | 'erro' | 'neutro' = 'sucesso'
  let statusRotulo = 'Lote Processado'

  if (rec.status === 'parcial') {
    statusVariante = 'alerta'
    statusRotulo = 'Processado Parcial'
  } else if (rec.status === 'rejeitado') {
    statusVariante = 'erro'
    statusRotulo = 'Lote Rejeitado'
  } else if (rec.status === 'anulado') {
    statusVariante = 'erro'
    statusRotulo = 'Lote Anulado'
  }

  return {
    id: `cdv-${rec.id}`,
    tipo: 'cdv_lote',
    tipoRotulo: 'Lote dMRV / Acervo Probatório',
    referencia: rec.cdv_codigo || rec.veiculo_baixa_detran || `LOTE-${rec.id.slice(0, 8)}`,
    dataHora: rec.created || new Date().toISOString(),
    status: rec.status || 'processado',
    statusRotulo,
    statusVariante,
    custoCreditos: undefined,
    empresaCnpj: rec.cdv_cnpj || '',
    empresaNome: rec.cdv_nome || 'Centro de Desmontagem',
    usuarioId: '',
    usuarioNome: rec.cdv_nome || 'API Externa / Ingestão dMRV',
    usuarioEmail: '',
    origem: rec.origem || rec.origem_envio || 'api',
    isSandbox: Boolean(isSintetico),
    dadosCompletos: {
      ...rec,
      _colecaoOrigem: 'cdv_lotes',
      cdv_nome: rec.cdv_nome,
      cdv_cnpj: rec.cdv_cnpj,
      cdv_codigo: rec.cdv_codigo,
      veiculo_marca_modelo: rec.veiculo_marca_modelo,
      veiculo_chassi: rec.veiculo_chassi,
      veiculo_baixa_detran: rec.veiculo_baixa_detran,
      total_pecas: rec.total_pecas,
      total_peso_kg: rec.total_peso_kg,
      total_co2e_evitado_kg: rec.total_co2e_evitado_kg,
      selo_detran_lote: rec.selo_detran_lote,
      origem_envio: rec.origem_envio,
    },
  }
}

/**
 * Normaliza e agrega registros de relatorios_exportados
 */
export function normalizarRelatorioExportado(rec: any): ItemLinhaDoTempoConsulta {
  const isSintetico =
    (rec.metadados_json && rec.metadados_json.origem === 'sintetico') ||
    (typeof rec.codigo_verificacao === 'string' && rec.codigo_verificacao.includes('DEMO'))

  const tipoNomeMap: Record<string, string> = {
    dossie_completo_pericial: 'Dossiê Completo Pericial',
    inventario_emissoes: 'Inventário de Emissões dMRV',
    comparativo_tributario: 'Comparativo Tributário Reforma',
    green_capital: 'Green Capital & Financiamento',
  }

  const rotuloTipo = tipoNomeMap[rec.tipo_relatorio] || 'Laudo / Relatório Técnico'

  return {
    id: `rel-${rec.id}`,
    tipo: 'relatorio_exportado',
    tipoRotulo: `Laudo Exportado (${rotuloTipo})`,
    referencia: rec.codigo_verificacao || `VRF-${rec.id.slice(0, 8).toUpperCase()}`,
    dataHora: rec.created || new Date().toISOString(),
    status: rec.assinado_icp_brasil ? 'assinado' : 'exportado',
    statusRotulo: rec.assinado_icp_brasil ? 'Exportado & Assinado ICP-Brasil' : 'Laudo Exportado',
    statusVariante: 'sucesso',
    custoCreditos: undefined,
    empresaCnpj: rec.cnpj || rec.expand?.usuario?.cnpj || '',
    empresaNome: rec.razao_social || rec.expand?.usuario?.name || 'Empresa Titular',
    usuarioId: rec.usuario || rec.expand?.usuario?.id || '',
    usuarioNome: rec.gerado_por_nome || rec.expand?.usuario?.name || 'Auditor / Gestor',
    usuarioEmail: rec.expand?.usuario?.email || '',
    origem: isSintetico ? 'sintetico' : 'producao',
    isSandbox: Boolean(isSintetico),
    dadosCompletos: {
      ...rec,
      _colecaoOrigem: 'relatorios_exportados',
      codigo_verificacao: rec.codigo_verificacao,
      hash_sha256: rec.hash_sha256,
      tipo_relatorio: rec.tipo_relatorio,
      gerado_por_nome: rec.gerado_por_nome,
      gerado_por_role: rec.gerado_por_role,
      assinado_icp_brasil: rec.assinado_icp_brasil,
      metadados_json: rec.metadados_json,
    },
  }
}

/**
 * Junta e ordena itens das 4 coleções
 */
export function consolidarLinhaDoTempo(
  nfeList: any[],
  infosimplesList: any[],
  cdvList: any[],
  relatoriosList: any[],
): ItemLinhaDoTempoConsulta[] {
  const itens: ItemLinhaDoTempoConsulta[] = [
    ...nfeList.map(normalizarNfeUpload),
    ...infosimplesList.map(normalizarInfosimples),
    ...cdvList.map(normalizarCdvLote),
    ...relatoriosList.map(normalizarRelatorioExportado),
  ]

  // Ordenação cronológica decrescente (mais recente primeiro)
  return itens.sort((a, b) => new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime())
}

/**
 * Aplica os filtros em memória sobre a linha do tempo consolidada
 */
export function filtrarLinhaDoTempo(
  itens: ItemLinhaDoTempoConsulta[],
  filtros: FiltrosHistoricoConsultas,
): ItemLinhaDoTempoConsulta[] {
  return itens.filter((item) => {
    // 1. Filtro Real vs Sandbox vs Todos (padrão: consultas reais por padrão)
    if (filtros.origemModo === 'reais' && item.isSandbox) {
      return false
    }
    if (filtros.origemModo === 'sandbox' && !item.isSandbox) {
      return false
    }

    // 2. Filtro por tipo
    if (filtros.tipo && filtros.tipo !== 'todos' && item.tipo !== filtros.tipo) {
      return false
    }

    // 3. Filtro por Empresa / CNPJ
    if (filtros.clienteCnpj && filtros.clienteCnpj !== 'todos') {
      const cnpjAlvoLimpo = filtros.clienteCnpj.replace(/\D/g, '')
      const cnpjItemLimpo = (item.empresaCnpj || '').replace(/\D/g, '')
      if (cnpjItemLimpo !== cnpjAlvoLimpo) {
        return false
      }
    }

    // 4. Filtro por Usuário
    if (filtros.usuarioId && filtros.usuarioId !== 'todos') {
      if (item.usuarioId !== filtros.usuarioId) {
        return false
      }
    }

    // 5. Filtro por Status
    if (filtros.status && filtros.status !== 'todos') {
      if (item.status !== filtros.status) {
        return false
      }
    }

    // 6. Filtro por Período (datas)
    if (filtros.dataInicio) {
      const dtInicio = new Date(`${filtros.dataInicio}T00:00:00Z`).getTime()
      const dtItem = new Date(item.dataHora).getTime()
      if (dtItem < dtInicio) {
        return false
      }
    }
    if (filtros.dataFim) {
      const dtFim = new Date(`${filtros.dataFim}T23:59:59.999Z`).getTime()
      const dtItem = new Date(item.dataHora).getTime()
      if (dtItem > dtFim) {
        return false
      }
    }

    // 7. Busca textual livre (referência, empresa, hash, etc.)
    if (filtros.buscaTexto && filtros.buscaTexto.trim()) {
      const q = filtros.buscaTexto.toLowerCase()
      const refMatch = item.referencia.toLowerCase().includes(q)
      const empMatch = (item.empresaNome || '').toLowerCase().includes(q)
      const cnpjMatch = (item.empresaCnpj || '').toLowerCase().includes(q)
      const userMatch = (item.usuarioNome || '').toLowerCase().includes(q)
      const emailMatch = (item.usuarioEmail || '').toLowerCase().includes(q)
      const hashMatch = (item.dadosCompletos?.hash_sha256 || '').toLowerCase().includes(q)

      if (!refMatch && !empMatch && !cnpjMatch && !userMatch && !emailMatch && !hashMatch) {
        return false
      }
    }

    return true
  })
}

/**
 * Calcula totalizadores sobre a lista filtrada
 */
export function calcularMetricasHistorico(
  itensFiltrados: ItemLinhaDoTempoConsulta[],
): MetricasHistoricoConsultas {
  let totalCreditos = 0
  const contagem: MetricasHistoricoConsultas['contagemPorTipo'] = {
    nfe_upload: 0,
    infosimples: 0,
    cdv_lote: 0,
    relatorio_exportado: 0,
  }

  for (const item of itensFiltrados) {
    if (item.custoCreditos && item.custoCreditos > 0) {
      totalCreditos += item.custoCreditos
    }
    if (contagem[item.tipo] !== undefined) {
      contagem[item.tipo]++
    }
  }

  return {
    totalConsultas: itensFiltrados.length,
    totalCreditosInfosimples: Number(totalCreditos.toFixed(4)),
    contagemPorTipo: contagem,
  }
}

/**
 * Busca os dados das 4 coleções em paralelo via PocketBase
 */
export async function carregarDadosHistoricoConsultas(): Promise<{
  nfeList: any[]
  infosimplesList: any[]
  cdvList: any[]
  relatoriosList: any[]
  clientesOpcoes: ClienteOpcaoFiltro[]
  usuariosOpcoes: UsuarioOpcaoFiltro[]
}> {
  const [nfeRes, infosRes, cdvRes, relRes, usersRes] = await Promise.all([
    pb
      .collection('nfe_upload')
      .getFullList({
        sort: '-created',
        expand: 'usuario',
      })
      .catch(() => []),
    pb
      .collection('infosimples_consultas')
      .getFullList({
        sort: '-created',
        expand: 'usuario',
      })
      .catch(() => []),
    pb
      .collection('cdv_lotes')
      .getFullList({
        sort: '-created',
      })
      .catch(() => []),
    pb
      .collection('relatorios_exportados')
      .getFullList({
        sort: '-created',
        expand: 'usuario',
      })
      .catch(() => []),
    pb
      .collection('users')
      .getFullList({
        sort: 'name',
      })
      .catch(() => []),
  ])

  // Extrair CNPJs únicos de clientes para compor o filtro
  const mapaCnpjs = new Map<string, string>()

  // A partir dos usuários cadastrados
  for (const u of usersRes) {
    if (u.cnpj && u.cnpj.trim()) {
      mapaCnpjs.set(u.cnpj.trim(), u.name || u.email || 'Cliente')
    }
  }

  // A partir dos lotes de CDV
  for (const lote of cdvRes) {
    if (lote.cdv_cnpj && lote.cdv_cnpj.trim()) {
      const nomeExistente = mapaCnpjs.get(lote.cdv_cnpj.trim())
      mapaCnpjs.set(lote.cdv_cnpj.trim(), nomeExistente || lote.cdv_nome || 'Titular do Lote dMRV')
    }
  }

  // A partir de relatórios
  for (const rel of relRes) {
    if (rel.cnpj && rel.cnpj.trim()) {
      const nomeExistente = mapaCnpjs.get(rel.cnpj.trim())
      mapaCnpjs.set(rel.cnpj.trim(), nomeExistente || rel.razao_social || 'Empresa')
    }
  }

  // A partir de NFs
  for (const nfe of nfeRes) {
    if (nfe.cnpj_emitente && nfe.cnpj_emitente.trim()) {
      const nome = mapaCnpjs.get(nfe.cnpj_emitente.trim())
      mapaCnpjs.set(nfe.cnpj_emitente.trim(), nome || nfe.nome_emitente || 'Emitente NF-e')
    }
  }

  const clientesOpcoes: ClienteOpcaoFiltro[] = Array.from(mapaCnpjs.entries()).map(
    ([cnpj, nome]) => ({
      cnpj,
      nome,
    }),
  )

  const usuariosOpcoes: UsuarioOpcaoFiltro[] = usersRes.map((u: any) => ({
    id: u.id,
    nome: u.name || u.email,
    email: u.email,
  }))

  return {
    nfeList: nfeRes,
    infosimplesList: infosRes,
    cdvList: cdvRes,
    relatoriosList: relRes,
    clientesOpcoes,
    usuariosOpcoes,
  }
}

/**
 * Gera string CSV formatada da listagem filtrada
 */
export function exportarHistoricoConsultasCsv(itens: ItemLinhaDoTempoConsulta[]): {
  conteudoCsv: string
  nomeArquivo: string
  totalRegistros: number
} {
  const cabecalho = [
    'Tipo de Consulta',
    'Referência',
    'Data/Hora',
    'Status',
    'Custo Créditos InfoSimples',
    'Empresa (CNPJ)',
    'Razão Social / Nome',
    'Usuário / Operador',
    'Ambiente',
    'Hash / Código de Verificação',
  ]

  const linhas = itens.map((item) => {
    const dataFormatada = new Date(item.dataHora).toLocaleString('pt-BR')
    const custo =
      item.custoCreditos !== undefined ? item.custoCreditos.toString().replace('.', ',') : '0'
    const ambiente = item.isSandbox ? 'Sandbox (Demonstração)' : 'Produção (Real)'
    const hashRef =
      item.dadosCompletos?.hash_sha256 ||
      item.dadosCompletos?.codigo_verificacao ||
      item.dadosCompletos?.hash_chave ||
      ''

    return [
      `"${item.tipoRotulo.replace(/"/g, '""')}"`,
      `"${item.referencia.replace(/"/g, '""')}"`,
      `"${dataFormatada}"`,
      `"${item.statusRotulo.replace(/"/g, '""')}"`,
      custo,
      `"${(item.empresaCnpj || '').replace(/"/g, '""')}"`,
      `"${(item.empresaNome || '').replace(/"/g, '""')}"`,
      `"${(item.usuarioNome || '').replace(/"/g, '""')}"`,
      `"${ambiente}"`,
      `"${hashRef.replace(/"/g, '""')}"`,
    ].join(';')
  })

  const conteudoCsv = '\uFEFF' + [cabecalho.join(';'), ...linhas].join('\r\n')
  const dataHoje = new Date().toISOString().slice(0, 10)
  const nomeArquivo = `historico_consultas_orbis_${dataHoje}.csv`

  return {
    conteudoCsv,
    nomeArquivo,
    totalRegistros: itens.length,
  }
}
