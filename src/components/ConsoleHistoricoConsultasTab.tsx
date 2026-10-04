import React, { useState, useEffect, useMemo } from 'react'
import {
  History,
  Search,
  Filter,
  FileSpreadsheet,
  RefreshCw,
  FileText,
  Boxes,
  Activity,
  Layers,
  Calendar,
  Building2,
  User,
  Coins,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Sparkles,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Hash,
  Download,
  Info,
} from 'lucide-react'
import {
  ItemLinhaDoTempoConsulta,
  FiltrosHistoricoConsultas,
  TipoConsultaTimeline,
  ClienteOpcaoFiltro,
  UsuarioOpcaoFiltro,
  carregarDadosHistoricoConsultas,
  consolidarLinhaDoTempo,
  filtrarLinhaDoTempo,
  calcularMetricasHistorico,
  exportarHistoricoConsultasCsv,
} from '@/services/historicoConsultasService'
import { useToast } from '@/hooks/use-toast'

const ITENS_POR_PAGINA = 20

export function ConsoleHistoricoConsultasTab() {
  const { toast } = useToast()
  const [carregando, setCarregando] = useState(true)
  const [exportando, setExportando] = useState(false)

  // Itens brutos consolidados
  const [todosItens, setTodosItens] = useState<ItemLinhaDoTempoConsulta[]>([])
  const [clientesOpcoes, setClientesOpcoes] = useState<ClienteOpcaoFiltro[]>([])
  const [usuariosOpcoes, setUsuariosOpcoes] = useState<UsuarioOpcaoFiltro[]>([])

  // Filtros
  const [filtros, setFiltros] = useState<FiltrosHistoricoConsultas>({
    clienteCnpj: 'todos',
    usuarioId: 'todos',
    tipo: 'todos',
    status: 'todos',
    dataInicio: '',
    dataFim: '',
    origemModo: 'reais', // Padrão: consultas reais por padrão
    buscaTexto: '',
  })

  // Paginação
  const [paginaAtual, setPaginaAtual] = useState(1)

  // Modal de Detalhes
  const [itemSelecionado, setItemSelecionado] = useState<ItemLinhaDoTempoConsulta | null>(null)

  const carregarDados = async () => {
    setCarregando(true)
    try {
      const { nfeList, infosimplesList, cdvList, relatoriosList, clientesOpcoes, usuariosOpcoes } =
        await carregarDadosHistoricoConsultas()

      const unificados = consolidarLinhaDoTempo(nfeList, infosimplesList, cdvList, relatoriosList)
      setTodosItens(unificados)
      setClientesOpcoes(clientesOpcoes)
      setUsuariosOpcoes(usuariosOpcoes)
    } catch (err: any) {
      console.error('Erro ao carregar histórico de consultas:', err)
      toast({
        title: 'Erro ao carregar dados',
        description: err?.message || 'Falha ao buscar registros do banco PocketBase.',
        variant: 'destructive',
      })
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregarDados()
  }, [])

  // Aplicação dos filtros em tempo real
  const itensFiltrados = useMemo(() => {
    return filtrarLinhaDoTempo(todosItens, filtros)
  }, [todosItens, filtros])

  // Totalizadores recalculados para o filtro ativo
  const metricas = useMemo(() => {
    return calcularMetricasHistorico(itensFiltrados)
  }, [itensFiltrados])

  // Paginação
  const totalPaginas = Math.max(1, Math.ceil(itensFiltrados.length / ITENS_POR_PAGINA))
  const itensPaginados = useMemo(() => {
    const inicio = (paginaAtual - 1) * ITENS_POR_PAGINA
    return itensFiltrados.slice(inicio, inicio + ITENS_POR_PAGINA)
  }, [itensFiltrados, paginaAtual])

  // Resetar página ao mudar filtros
  useEffect(() => {
    setPaginaAtual(1)
  }, [filtros])

  const handleExportarCsv = () => {
    if (itensFiltrados.length === 0) {
      toast({
        title: 'Nenhum dado para exportar',
        description: 'Ajuste os filtros para incluir pelo menos uma consulta na listagem.',
        variant: 'destructive',
      })
      return
    }

    setExportando(true)
    try {
      const { conteudoCsv, nomeArquivo, totalRegistros } =
        exportarHistoricoConsultasCsv(itensFiltrados)
      const blob = new Blob([conteudoCsv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = nomeArquivo
      a.click()
      URL.revokeObjectURL(url)

      toast({
        title: 'Exportação Concluída com Sucesso',
        description: `${totalRegistros} registro(s) exportado(s) em ${nomeArquivo}.`,
      })
    } catch (err: any) {
      toast({
        title: 'Erro na exportação',
        description: err?.message || 'Falha ao gerar arquivo CSV.',
        variant: 'destructive',
      })
    } finally {
      setExportando(false)
    }
  }

  const limparFiltros = () => {
    setFiltros({
      clienteCnpj: 'todos',
      usuarioId: 'todos',
      tipo: 'todos',
      status: 'todos',
      dataInicio: '',
      dataFim: '',
      origemModo: 'reais',
      buscaTexto: '',
    })
  }

  const getIconeTipo = (tipo: TipoConsultaTimeline) => {
    switch (tipo) {
      case 'nfe_upload':
        return <FileText className="w-4 h-4 text-emerald-600 dark:text-[#12B886]" />
      case 'infosimples':
        return <Coins className="w-4 h-4 text-blue-600 dark:text-blue-400" />
      case 'cdv_lote':
        return <Boxes className="w-4 h-4 text-amber-600 dark:text-[#D9B36C]" />
      case 'relatorio_exportado':
        return <ShieldCheck className="w-4 h-4 text-purple-600 dark:text-purple-400" />
      default:
        return <History className="w-4 h-4 text-slate-500" />
    }
  }

  return (
    <div className="space-y-6 animate-fade-in" data-testid="console-historico-consultas-tab">
      {/* Cabeçalho */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-[#12B886]">
              <History className="w-5 h-5" />
            </div>
            <h2 className="font-heading font-black text-xl text-slate-900 dark:text-[#F4F7FA] tracking-tight">
              Histórico de Consultas por Cliente (Linha do Tempo Unificada)
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-[10px] font-mono text-slate-700 dark:text-slate-300 font-bold uppercase">
              Auditoria de Tráfego & APIs
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-[#93A3B5] max-w-3xl leading-relaxed">
            Visão unificada e auditável de NFs consultadas (<code>nfe_upload</code>), consultas
            fiscais SEFAZ com custos em créditos (<code>infosimples_consultas</code>), lotes via API
            CDVerde (<code>cdv_lotes</code>) e laudos periciais exportados com hash de verificação (
            <code>relatorios_exportados</code>).
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {/* Alternador Real vs Sandbox (padrão dados reais) */}
          <div className="inline-flex rounded-xl p-1 bg-slate-100 dark:bg-[#111820] border border-slate-300 dark:border-slate-800">
            <button
              type="button"
              data-testid="filtro-origem-reais"
              onClick={() => setFiltros((prev) => ({ ...prev, origemModo: 'reais' }))}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                filtros.origemModo === 'reais'
                  ? 'bg-white dark:bg-[#1A2638] text-slate-900 dark:text-[#F4F7FA] shadow-xs'
                  : 'text-slate-600 dark:text-[#93A3B5] hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Consultas Reais
            </button>
            <button
              type="button"
              data-testid="filtro-origem-sandbox"
              onClick={() => setFiltros((prev) => ({ ...prev, origemModo: 'sandbox' }))}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                filtros.origemModo === 'sandbox'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                  : 'text-slate-600 dark:text-[#93A3B5] hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Sparkles className="w-3 h-3" />
              <span>Sandbox</span>
            </button>
            <button
              type="button"
              data-testid="filtro-origem-todos"
              onClick={() => setFiltros((prev) => ({ ...prev, origemModo: 'todos' }))}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                filtros.origemModo === 'todos'
                  ? 'bg-white dark:bg-[#1A2638] text-slate-900 dark:text-[#F4F7FA] shadow-xs'
                  : 'text-slate-600 dark:text-[#93A3B5] hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Todas
            </button>
          </div>

          <button
            type="button"
            data-testid="btn-recarregar-historico"
            onClick={carregarDados}
            disabled={carregando}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-[#0E1A2E] border border-slate-300 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-[#F4F7FA] hover:border-emerald-500 transition-colors shadow-sm disabled:opacity-50"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${carregando ? 'animate-spin text-emerald-600' : ''}`}
            />
            <span>Atualizar</span>
          </button>

          <button
            type="button"
            data-testid="btn-exportar-csv-historico"
            onClick={handleExportarCsv}
            disabled={exportando || itensFiltrados.length === 0}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#12B886] hover:bg-emerald-500 text-[#0A0E12] font-bold text-xs shadow-emerald-glow transition-colors disabled:opacity-50"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>{exportando ? 'Exportando...' : 'Exportar CSV'}</span>
          </button>
        </div>
      </div>

      {/* Tarja Informativa se Sandbox estiver ativo */}
      {filtros.origemModo === 'sandbox' && (
        <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-400/40 text-amber-900 dark:text-amber-200 text-xs flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            Exibindo consultas sintéticas e simulações geradas no ambiente de testes (Sandbox).
          </span>
        </div>
      )}

      {/* 3. TOTALIZADORES NO TOPO */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Geral de Consultas no Filtro */}
        <div
          data-testid="card-metrica-total-consultas"
          className="p-4 rounded-xl bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-slate-800 shadow-sm"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-[#93A3B5]">
            <span className="text-[10px] uppercase font-bold tracking-wider">Total Consultas</span>
            <Activity className="w-3.5 h-3.5 text-emerald-600 dark:text-[#12B886]" />
          </div>
          <span className="font-heading font-black text-2xl text-slate-900 dark:text-[#F4F7FA] block mt-1">
            {metricas.totalConsultas}
          </span>
          <span className="text-[10px] text-slate-500 dark:text-[#93A3B5] block mt-0.5">
            no período filtrado
          </span>
        </div>

        {/* Custo Total InfoSimples em Créditos */}
        <div
          data-testid="card-metrica-total-creditos"
          className="p-4 rounded-xl bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-slate-800 shadow-sm"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-[#93A3B5]">
            <span className="text-[10px] uppercase font-bold tracking-wider">
              Créditos InfoSimples
            </span>
            <Coins className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          </div>
          <span className="font-heading font-black text-2xl text-blue-600 dark:text-blue-400 block mt-1">
            {metricas.totalCreditosInfosimples.toLocaleString('pt-BR', {
              minimumFractionDigits: 2,
            })}
          </span>
          <span className="text-[10px] text-slate-500 dark:text-[#93A3B5] block mt-0.5">
            consumidos na SEFAZ
          </span>
        </div>

        {/* NFs Consultadas */}
        <div
          data-testid="card-metrica-nfe-upload"
          className="p-4 rounded-xl bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-slate-800 shadow-sm"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-[#93A3B5]">
            <span className="text-[10px] uppercase font-bold tracking-wider">NFs / Ingestão</span>
            <FileText className="w-3.5 h-3.5 text-emerald-600 dark:text-[#12B886]" />
          </div>
          <span className="font-heading font-black text-2xl text-slate-900 dark:text-[#F4F7FA] block mt-1">
            {metricas.contagemPorTipo.nfe_upload}
          </span>
          <span className="text-[10px] text-slate-500 dark:text-[#93A3B5] block mt-0.5">
            coleção nfe_upload
          </span>
        </div>

        {/* Consultas InfoSimples */}
        <div
          data-testid="card-metrica-infosimples"
          className="p-4 rounded-xl bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-slate-800 shadow-sm"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-[#93A3B5]">
            <span className="text-[10px] uppercase font-bold tracking-wider">APIs InfoSimples</span>
            <Coins className="w-3.5 h-3.5 text-blue-500" />
          </div>
          <span className="font-heading font-black text-2xl text-slate-900 dark:text-[#F4F7FA] block mt-1">
            {metricas.contagemPorTipo.infosimples}
          </span>
          <span className="text-[10px] text-slate-500 dark:text-[#93A3B5] block mt-0.5">
            varreduras SEFAZ
          </span>
        </div>

        {/* Lotes API CDVerde */}
        <div
          data-testid="card-metrica-cdv-lotes"
          className="p-4 rounded-xl bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-slate-800 shadow-sm"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-[#93A3B5]">
            <span className="text-[10px] uppercase font-bold tracking-wider">Lotes CDVerde</span>
            <Boxes className="w-3.5 h-3.5 text-amber-600 dark:text-[#D9B36C]" />
          </div>
          <span className="font-heading font-black text-2xl text-slate-900 dark:text-[#F4F7FA] block mt-1">
            {metricas.contagemPorTipo.cdv_lote}
          </span>
          <span className="text-[10px] text-slate-500 dark:text-[#93A3B5] block mt-0.5">
            via API de desmonte
          </span>
        </div>

        {/* Laudos Exportados */}
        <div
          data-testid="card-metrica-relatorios"
          className="p-4 rounded-xl bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-slate-800 shadow-sm"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-[#93A3B5]">
            <span className="text-[10px] uppercase font-bold tracking-wider">
              Laudos Exportados
            </span>
            <ShieldCheck className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
          </div>
          <span className="font-heading font-black text-2xl text-slate-900 dark:text-[#F4F7FA] block mt-1">
            {metricas.contagemPorTipo.relatorio_exportado}
          </span>
          <span className="text-[10px] text-slate-500 dark:text-[#93A3B5] block mt-0.5">
            com prova SHA-256
          </span>
        </div>
      </div>

      {/* 2. BARRA DE FILTROS */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-[#F4F7FA] uppercase tracking-wider">
            <Filter className="w-3.5 h-3.5 text-emerald-600 dark:text-[#12B886]" />
            <span>Filtros Paramétricos da Linha do Tempo</span>
          </div>
          <button
            type="button"
            onClick={limparFiltros}
            className="text-[11px] text-emerald-600 dark:text-[#12B886] hover:underline"
          >
            Limpar Filtros
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
          {/* Busca Textual */}
          <div className="relative">
            <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-[#93A3B5] mb-1">
              Busca (Chave / Lote / Hash / Nome)
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                data-testid="input-busca-historico"
                placeholder="Ex.: 352606..., Gol, VRF-..."
                value={filtros.buscaTexto}
                onChange={(e) => setFiltros((prev) => ({ ...prev, buscaTexto: e.target.value }))}
                className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-[#111820] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-[#F4F7FA] focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Filtro por Cliente / Empresa (CNPJ) */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-[#93A3B5] mb-1">
              Cliente / CNPJ Vinculado
            </label>
            <select
              data-testid="select-filtro-cliente"
              value={filtros.clienteCnpj}
              onChange={(e) => setFiltros((prev) => ({ ...prev, clienteCnpj: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#111820] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-[#F4F7FA] focus:outline-none focus:border-emerald-500"
            >
              <option value="todos">Todos os Clientes</option>
              {clientesOpcoes.map((cli) => (
                <option key={cli.cnpj} value={cli.cnpj}>
                  {cli.cnpj} — {cli.nome.slice(0, 24)}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro por Usuário */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-[#93A3B5] mb-1">
              Usuário / Operador
            </label>
            <select
              data-testid="select-filtro-usuario"
              value={filtros.usuarioId}
              onChange={(e) => setFiltros((prev) => ({ ...prev, usuarioId: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#111820] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-[#F4F7FA] focus:outline-none focus:border-emerald-500"
            >
              <option value="todos">Todos os Usuários</option>
              {usuariosOpcoes.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nome} ({u.email})
                </option>
              ))}
            </select>
          </div>

          {/* Filtro por Tipo de Consulta */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-[#93A3B5] mb-1">
              Tipo de Consulta
            </label>
            <select
              data-testid="select-filtro-tipo"
              value={filtros.tipo}
              onChange={(e) =>
                setFiltros((prev) => ({
                  ...prev,
                  tipo: e.target.value as FiltrosHistoricoConsultas['tipo'],
                }))
              }
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#111820] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-[#F4F7FA] focus:outline-none focus:border-emerald-500"
            >
              <option value="todos">Todos os Tipos (4 Coleções)</option>
              <option value="nfe_upload">NF-e (nfe_upload)</option>
              <option value="infosimples">InfoSimples Fiscal (infosimples_consultas)</option>
              <option value="cdv_lote">Lotes API CDVerde (cdv_lotes)</option>
              <option value="relatorio_exportado">Laudos Exportados (relatorios_exportados)</option>
            </select>
          </div>

          {/* Filtro por Período */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-[#93A3B5] mb-1">
              Período (Início / Fim)
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              <input
                type="date"
                data-testid="input-data-inicio"
                value={filtros.dataInicio}
                onChange={(e) => setFiltros((prev) => ({ ...prev, dataInicio: e.target.value }))}
                className="w-full px-2 py-1.5 rounded-lg bg-slate-50 dark:bg-[#111820] border border-slate-300 dark:border-slate-700 text-[11px] text-slate-900 dark:text-[#F4F7FA]"
              />
              <input
                type="date"
                data-testid="input-data-fim"
                value={filtros.dataFim}
                onChange={(e) => setFiltros((prev) => ({ ...prev, dataFim: e.target.value }))}
                className="w-full px-2 py-1.5 rounded-lg bg-slate-50 dark:bg-[#111820] border border-slate-300 dark:border-slate-700 text-[11px] text-slate-900 dark:text-[#F4F7FA]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 4. LINHA DO TEMPO CRONOLÓGICA & TABELA */}
      <div className="rounded-2xl bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-600 dark:text-[#12B886]" />
            <h3 className="font-heading font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-[#F4F7FA]">
              Linha do Tempo de Consultas ({itensFiltrados.length} evento(s) no filtro)
            </h3>
          </div>
          <span className="text-[11px] text-slate-500 dark:text-[#93A3B5] font-mono">
            Página {paginaAtual} de {totalPaginas}
          </span>
        </div>

        {carregando ? (
          <div className="p-12 text-center text-xs text-slate-500 dark:text-[#93A3B5] space-y-2">
            <RefreshCw className="w-6 h-6 animate-spin text-emerald-600 mx-auto" />
            <p>Carregando histórico unificado das 4 coleções...</p>
          </div>
        ) : itensFiltrados.length === 0 ? (
          /* 7. ESTADO VAZIO AMIGÁVEL */
          <div
            data-testid="estado-vazio-historico"
            className="p-12 text-center text-slate-500 dark:text-[#93A3B5] space-y-3"
          >
            <History className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto" />
            <div className="space-y-1">
              <strong className="text-sm text-slate-800 dark:text-slate-200 block">
                Nenhuma consulta localizada para os filtros selecionados
              </strong>
              <p className="text-xs max-w-md mx-auto leading-relaxed">
                Não foram encontrados registros para o cliente, período ou tipo especificado. Tente
                ampliar o período de datas ou remover os filtros ativos acima.
              </p>
            </div>
            <button
              type="button"
              onClick={limparFiltros}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-200 transition-colors"
            >
              Restaurar Filtros Padrão
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs" data-testid="tabela-historico-consultas">
              <thead className="bg-slate-100 dark:bg-[#111820] text-slate-600 dark:text-[#93A3B5] uppercase text-[10px] border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3.5 font-semibold">Tipo & Origem</th>
                  <th className="p-3.5 font-semibold">Referência do Documento</th>
                  <th className="p-3.5 font-semibold">Cliente / CNPJ</th>
                  <th className="p-3.5 font-semibold">Data / Hora</th>
                  <th className="p-3.5 font-semibold">Status</th>
                  <th className="p-3.5 font-semibold text-right">Custo InfoSimples</th>
                  <th className="p-3.5 font-semibold text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
                {itensPaginados.map((item) => (
                  <tr
                    key={item.id}
                    data-testid={`timeline-item-${item.id}`}
                    className="hover:bg-slate-50 dark:hover:bg-[#111820]/60 transition-colors"
                  >
                    {/* Tipo & Origem */}
                    <td className="p-3.5">
                      <div className="flex items-center gap-2">
                        {getIconeTipo(item.tipo)}
                        <div>
                          <span className="font-semibold text-slate-900 dark:text-[#F4F7FA] block">
                            {item.tipoRotulo}
                          </span>
                          <span className="text-[10px] text-slate-500 dark:text-[#93A3B5] font-mono">
                            {item.isSandbox ? (
                              <span className="text-amber-600 dark:text-amber-400 font-bold">
                                Sandbox / Demo
                              </span>
                            ) : (
                              'Produção Real'
                            )}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Referência */}
                    <td className="p-3.5">
                      <strong className="font-mono text-[11px] text-slate-900 dark:text-[#F4F7FA] block truncate max-w-[220px]">
                        {item.referencia}
                      </strong>
                      {item.dadosCompletos?.hash_sha256 && (
                        <span className="font-mono text-[9px] text-emerald-600 dark:text-[#12B886] block truncate max-w-[200px]">
                          Hash: {item.dadosCompletos.hash_sha256.slice(0, 16)}...
                        </span>
                      )}
                    </td>

                    {/* Cliente / CNPJ */}
                    <td className="p-3.5">
                      <span className="font-medium text-slate-900 dark:text-[#F4F7FA] block truncate max-w-[180px]">
                        {item.empresaNome || 'Empresa'}
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-[#93A3B5] font-mono">
                        {item.empresaCnpj || 'CNPJ não informado'}
                      </span>
                    </td>

                    {/* Data / Hora */}
                    <td className="p-3.5 font-mono text-[11px] text-slate-600 dark:text-[#93A3B5] whitespace-nowrap">
                      {new Date(item.dataHora).toLocaleDateString('pt-BR')}{' '}
                      <span className="text-slate-400 dark:text-slate-600">
                        {new Date(item.dataHora).toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="p-3.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          item.statusVariante === 'sucesso'
                            ? 'bg-emerald-500/10 text-emerald-700 dark:text-[#12B886] border border-emerald-500/30'
                            : item.statusVariante === 'alerta'
                              ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30'
                              : item.statusVariante === 'erro'
                                ? 'bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/30'
                                : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {item.statusVariante === 'sucesso' && <CheckCircle2 className="w-3 h-3" />}
                        {item.statusVariante === 'alerta' && <AlertTriangle className="w-3 h-3" />}
                        {item.statusVariante === 'erro' && <XCircle className="w-3 h-3" />}
                        <span>{item.statusRotulo}</span>
                      </span>
                    </td>

                    {/* Custo em Créditos InfoSimples (Coluna Própria) */}
                    <td className="p-3.5 text-right font-mono">
                      {item.custoCreditos !== undefined ? (
                        <div data-testid={`custo-item-${item.id}`}>
                          <span className="font-bold text-blue-600 dark:text-blue-400">
                            {item.custoCreditos.toLocaleString('pt-BR', {
                              minimumFractionDigits: 2,
                            })}
                          </span>
                          <span className="text-[10px] text-slate-400 block">créditos</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-600">—</span>
                      )}
                    </td>

                    {/* Ações (Ver Detalhes) */}
                    <td className="p-3.5 text-right">
                      <button
                        type="button"
                        data-testid={`btn-detalhes-${item.id}`}
                        onClick={() => setItemSelecionado(item)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-[#16202B] border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-[#93A3B5] hover:text-emerald-600 dark:hover:text-[#12B886] hover:border-emerald-500 text-[11px] font-semibold transition-colors"
                      >
                        <Info className="w-3 h-3" />
                        <span>Detalhes</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Rodapé da Paginação */}
        {itensFiltrados.length > ITENS_POR_PAGINA && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-[#93A3B5]">
              Mostrando {itensPaginados.length} de {itensFiltrados.length} consultas
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                data-testid="btn-pag-anterior"
                onClick={() => setPaginaAtual((p) => Math.max(1, p - 1))}
                disabled={paginaAtual === 1}
                className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-[#F4F7FA] disabled:opacity-30 hover:border-emerald-500 transition-colors"
                aria-label="Página anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="font-mono text-xs px-2">
                {paginaAtual} / {totalPaginas}
              </span>

              <button
                type="button"
                data-testid="btn-pag-proxima"
                onClick={() => setPaginaAtual((p) => Math.min(totalPaginas, p + 1))}
                disabled={paginaAtual === totalPaginas}
                className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-[#F4F7FA] disabled:opacity-30 hover:border-emerald-500 transition-colors"
                aria-label="Próxima página"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 5. MODAL DE DETALHES EXISTENTE (sem duplicar visualizadores) */}
      {itemSelecionado && (
        <div
          data-testid="modal-detalhes-consulta"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
        >
          <div className="w-full max-w-2xl rounded-2xl bg-white dark:bg-[#111820] border-2 border-emerald-500 dark:border-[#12B886] p-6 space-y-4 shadow-2xl max-h-[90vh] flex flex-col">
            {/* Topo do Modal */}
            <div className="flex items-start justify-between border-b border-slate-200 dark:border-[rgba(244,247,250,0.1)] pb-3">
              <div className="flex items-center gap-2">
                {getIconeTipo(itemSelecionado.tipo)}
                <div>
                  <h3 className="font-heading font-bold text-base text-slate-900 dark:text-[#F4F7FA]">
                    Detalhes da Consulta • {itemSelecionado.tipoRotulo}
                  </h3>
                  <span className="text-[11px] text-slate-500 dark:text-[#93A3B5] font-mono">
                    ID: {itemSelecionado.id}
                  </span>
                </div>
              </div>
              <button
                type="button"
                data-testid="btn-fechar-modal-detalhes"
                onClick={() => setItemSelecionado(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-[#F4F7FA]"
              >
                ✕
              </button>
            </div>

            {/* Metadados Básicos */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] bg-slate-50 dark:bg-[#0A0E12] p-3 rounded-xl border border-slate-200 dark:border-[rgba(244,247,250,0.06)]">
              <div>
                <span className="text-slate-500 dark:text-[#93A3B5] block">Referência:</span>
                <strong className="text-slate-900 dark:text-[#F4F7FA] font-mono truncate block">
                  {itemSelecionado.referencia}
                </strong>
              </div>
              <div>
                <span className="text-slate-500 dark:text-[#93A3B5] block">Cliente / Empresa:</span>
                <strong className="text-slate-900 dark:text-[#F4F7FA] truncate block">
                  {itemSelecionado.empresaNome}
                </strong>
              </div>
              <div>
                <span className="text-slate-500 dark:text-[#93A3B5] block">CNPJ:</span>
                <span className="text-slate-900 dark:text-[#F4F7FA] font-mono">
                  {itemSelecionado.empresaCnpj || '-'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-[#93A3B5] block">Data/Hora:</span>
                <span className="text-slate-900 dark:text-[#F4F7FA] font-mono">
                  {new Date(itemSelecionado.dataHora).toLocaleString('pt-BR')}
                </span>
              </div>
            </div>

            {/* Se for InfoSimples: destaque de custo e retorno */}
            {itemSelecionado.tipo === 'infosimples' && (
              <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <strong className="text-blue-700 dark:text-blue-400 uppercase font-bold">
                    Consumo de Créditos InfoSimples:
                  </strong>
                  <span className="font-mono font-bold text-sm text-blue-700 dark:text-blue-300">
                    {itemSelecionado.custoCreditos} créditos
                  </span>
                </div>
                <div className="text-[11px] text-slate-600 dark:text-[#93A3B5]">
                  Mensagem SEFAZ: {itemSelecionado.dadosCompletos?.mensagem_retorno || 'OK'} •
                  Código: {itemSelecionado.dadosCompletos?.codigo_retorno ?? 200}
                </div>
              </div>
            )}

            {/* Se for Laudo Exportado: Hash e Código de Verificação */}
            {itemSelecionado.tipo === 'relatorio_exportado' && (
              <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-xs space-y-1.5 font-mono">
                <div className="flex items-center gap-1.5 text-purple-700 dark:text-purple-300 font-bold">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Código de Verificação: {itemSelecionado.referencia}</span>
                </div>
                <div className="text-[11px] text-slate-600 dark:text-[#93A3B5] break-all">
                  SHA-256: {itemSelecionado.dadosCompletos?.hash_sha256 || 'Assinatura registrada'}
                </div>
              </div>
            )}

            {/* Se for Lote CDVerde */}
            {itemSelecionado.tipo === 'cdv_lote' && (
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs space-y-1">
                <strong className="text-amber-800 dark:text-amber-300 font-bold block">
                  Veículo: {itemSelecionado.dadosCompletos?.veiculo_marca_modelo || 'Não informado'}
                </strong>
                <div className="text-[11px] text-slate-600 dark:text-[#93A3B5]">
                  Baixa DETRAN: {itemSelecionado.dadosCompletos?.veiculo_baixa_detran || '-'} •
                  Peças: {itemSelecionado.dadosCompletos?.total_pecas || 0} • Peso:{' '}
                  {itemSelecionado.dadosCompletos?.total_peso_kg || 0} kg
                </div>
              </div>
            )}

            {/* Payload Bruto / JSON */}
            <div className="flex-1 overflow-y-auto space-y-1 text-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-[#93A3B5]">
                Registro Completo (JSON do Banco de Dados)
              </span>
              <pre className="p-3.5 rounded-xl bg-slate-100 dark:bg-[#0A0E12] border border-slate-200 dark:border-[rgba(244,247,250,0.1)] text-emerald-700 dark:text-[#12B886] font-mono text-[11px] overflow-x-auto max-h-56">
                {JSON.stringify(itemSelecionado.dadosCompletos, null, 2)}
              </pre>
            </div>

            {/* Rodapé do Modal */}
            <div className="flex justify-end pt-2 border-t border-slate-200 dark:border-[rgba(244,247,250,0.08)]">
              <button
                type="button"
                onClick={() => setItemSelecionado(null)}
                className="px-5 py-2 rounded-xl bg-slate-200 dark:bg-[#16202B] text-xs font-semibold text-slate-700 dark:text-[#F4F7FA] hover:bg-slate-300 transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
