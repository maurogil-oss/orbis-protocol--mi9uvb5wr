import React, { useState, useEffect, useMemo } from 'react'
import {
  Mail,
  Send,
  RefreshCw,
  Download,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  UserCheck,
  UserX,
  Filter,
  Search,
  ChevronRight,
  ShieldAlert,
  Calendar,
  Sparkles,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import pb from '@/lib/pocketbase/client'
import { carregarDadosHistoricoConsultas } from '@/services/historicoConsultasService'
import {
  ReativacaoEnvioRecord,
  UsuarioElegibilidadeReativacao,
  MetricasCampanhaReativacao,
  listarEnviosReativacao,
  calcularInatividadeUsuario,
  calcularMetricasReativacao,
  dispararJobReativacaoManual,
  exportarEnviosReativacaoCsv,
} from '@/services/reativacaoService'

export function ConsoleReativacaoTab() {
  const { toast } = useToast()

  const [loading, setLoading] = useState(true)
  const [executandoJob, setExecutandoJob] = useState(false)
  const [exportando, setExportando] = useState(false)

  // Dados carregados
  const [envios, setEnvios] = useState<ReativacaoEnvioRecord[]>([])
  const [usuariosElegibilidade, setUsuariosElegibilidade] = useState<
    UsuarioElegibilidadeReativacao[]
  >([])

  // Sub-aba: 'envios' | 'inativos' | 'optout'
  const [subAba, setSubAba] = useState<'envios' | 'inativos' | 'optout'>('envios')

  // Filtros
  const [filtroToque, setFiltroToque] = useState<'todos' | 'd30' | 'd60'>('todos')
  const [filtroStatus, setFiltroStatus] = useState<'todos' | 'enviado' | 'falha'>('todos')
  const [buscaTexto, setBuscaTexto] = useState('')

  // Item detalhado modal/preview
  const [envioSelecionado, setEnvioSelecionado] = useState<ReativacaoEnvioRecord | null>(null)

  // Carregar dados de acervo e envios
  const carregarDados = async () => {
    setLoading(true)
    try {
      const [historicoRes, enviosRes, usersRes] = await Promise.all([
        carregarDadosHistoricoConsultas().catch(() => ({
          nfeList: [],
          infosimplesList: [],
          cdvList: [],
          relatoriosList: [],
          clientesOpcoes: [],
          usuariosOpcoes: [],
        })),
        listarEnviosReativacao(),
        pb
          .collection('users')
          .getFullList({ sort: '-created' })
          .catch(() => []),
      ])

      setEnvios(enviosRes)

      // Calcular elegibilidade e inatividade para cada usuário
      const elegibilidades: UsuarioElegibilidadeReativacao[] = []
      for (const u of usersRes) {
        // Filtrar envios do próprio usuário
        const enviosUser = enviosRes.filter((e) => e.usuario === u.id)
        const itemEl = calcularInatividadeUsuario(
          u,
          historicoRes.nfeList,
          historicoRes.infosimplesList,
          historicoRes.cdvList,
          historicoRes.relatoriosList,
          enviosUser,
        )
        elegibilidades.push(itemEl)
      }

      setUsuariosElegibilidade(elegibilidades)
    } catch (err: any) {
      console.error('Erro ao carregar dados de reativação:', err)
      toast({
        title: 'Erro ao carregar dados',
        description: err.message || 'Falha ao sincronizar dados da campanha de reativação.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregarDados()
  }, [])

  // Métricas calculadas
  const metricas: MetricasCampanhaReativacao = useMemo(() => {
    return calcularMetricasReativacao(usuariosElegibilidade, envios)
  }, [usuariosElegibilidade, envios])

  // Filtragem dos envios registrados
  const enviosFiltrados = useMemo(() => {
    return envios.filter((env) => {
      if (filtroToque !== 'todos' && env.toque !== filtroToque) return false
      if (filtroStatus !== 'todos' && env.status !== filtroStatus) return false

      if (buscaTexto.trim()) {
        const q = buscaTexto.toLowerCase()
        const email = (env.destinatario_email || env.expand?.usuario?.email || '').toLowerCase()
        const nome = (env.expand?.usuario?.name || '').toLowerCase()
        const erro = (env.mensagem_erro || '').toLowerCase()
        const id = env.id.toLowerCase()
        if (!email.includes(q) && !nome.includes(q) && !erro.includes(q) && !id.includes(q)) {
          return false
        }
      }
      return true
    })
  }, [envios, filtroToque, filtroStatus, buscaTexto])

  // Lista de inativos (no gatilho de 30 ou 60 dias)
  const usuariosInativos = useMemo(() => {
    return usuariosElegibilidade.filter((u) => {
      if (u.optOut) return false
      if (filtroToque !== 'todos') {
        return u.toqueElegivel === filtroToque
      }
      return u.toqueElegivel !== null
    })
  }, [usuariosElegibilidade, filtroToque])

  // Lista de usuários com opt-out ativo
  const usuariosOptOut = useMemo(() => {
    return usuariosElegibilidade.filter((u) => u.optOut)
  }, [usuariosElegibilidade])

  // Disparo manual do job
  const handleDispararJob = async (dryRun: boolean = false) => {
    setExecutandoJob(true)
    try {
      const res = await dispararJobReativacaoManual(dryRun)
      toast({
        title: dryRun ? 'Simulação de Disparo Concluída' : 'Campanha de Reativação Executada!',
        description: `${res.enviados} e-mail(s) processado(s), ${res.elegiveis_d30} no gatilho 30d, ${res.elegiveis_d60} no gatilho 60d.`,
      })
      await carregarDados()
    } catch (err: any) {
      toast({
        title: 'Erro ao executar reativação',
        description: err.message || 'Falha na comunicação com o backend.',
        variant: 'destructive',
      })
    } finally {
      setExecutandoJob(false)
    }
  }

  // Exportar CSV
  const handleExportarCsv = () => {
    if (enviosFiltrados.length === 0) {
      toast({
        title: 'Nenhum registro para exportar',
        description: 'Ajuste os filtros para exibir envios.',
        variant: 'destructive',
      })
      return
    }

    setExportando(true)
    try {
      const { conteudoCsv, nomeArquivo, totalRegistros } =
        exportarEnviosReativacaoCsv(enviosFiltrados)
      const blob = new Blob([conteudoCsv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.setAttribute('href', url)
      link.setAttribute('download', nomeArquivo)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast({
        title: 'Exportação Concluída',
        description: `${totalRegistros} registro(s) exportado(s) em ${nomeArquivo}.`,
      })
    } catch (err: any) {
      toast({
        title: 'Erro na exportação',
        description: err.message,
        variant: 'destructive',
      })
    } finally {
      setExportando(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho da Aba */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-[#12B886]/10 text-emerald-800 dark:text-[#12B886] border border-emerald-300 dark:border-[#12B886]/30 text-[10px] font-mono uppercase font-bold tracking-wider flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" />
              <span>Automação & Retenção de Clientes</span>
            </span>
            <span className="text-[11px] text-slate-500 dark:text-[#93A3B5] font-mono">
              Job Diário: 08:00 UTC (cronAdd)
            </span>
          </div>
          <h2 className="font-heading font-bold text-lg sm:text-xl text-slate-900 dark:text-[#F4F7FA]">
            Campanha de Reativação por E-mail (Toques 30d / 60d)
          </h2>
          <p className="text-xs text-slate-600 dark:text-[#93A3B5] max-w-3xl leading-relaxed">
            Identificação diária e reengajamento de contas inativas com dados reais do acervo
            probatório (NF-e, lotes CDVerde, InfoSimples e laudos emitidos), governança de opt-out e
            deduplicação mensal estrita.
          </p>
        </div>

        {/* Ações principais */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            data-testid="btn-atualizar-reativacao"
            onClick={carregarDados}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-[#111820] border border-slate-200 dark:border-[rgba(244,247,250,0.1)] text-xs text-slate-700 dark:text-[#F4F7FA] hover:bg-slate-50 dark:hover:bg-[#16202B] transition-colors shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#12B886]' : ''}`} />
            <span>Atualizar</span>
          </button>

          <button
            type="button"
            data-testid="btn-exportar-csv-reativacao"
            onClick={handleExportarCsv}
            disabled={exportando || enviosFiltrados.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-[#111820] border border-slate-200 dark:border-[rgba(244,247,250,0.1)] text-xs text-slate-700 dark:text-[#F4F7FA] hover:bg-slate-50 dark:hover:bg-[#16202B] transition-colors shadow-sm disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5 text-[#12B886]" />
            <span>{exportando ? 'Exportando...' : 'Exportar CSV'}</span>
          </button>

          <button
            type="button"
            data-testid="btn-disparar-job-simular"
            onClick={() => handleDispararJob(true)}
            disabled={executandoJob}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-[#16202B] border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Simular Disparo (Dry-run)</span>
          </button>

          <button
            type="button"
            data-testid="btn-disparar-job-real"
            onClick={() => handleDispararJob(false)}
            disabled={executandoJob}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#12B886] text-[#0A0E12] font-bold text-xs uppercase tracking-wider hover:bg-[#0fa678] transition-colors shadow-emerald-glow disabled:opacity-50"
          >
            <Send className={`w-3.5 h-3.5 ${executandoJob ? 'animate-bounce' : ''}`} />
            <span>{executandoJob ? 'Processando...' : 'Executar Job Agora'}</span>
          </button>
        </div>
      </div>

      {/* Cartões de Métricas (6 KPIs Principais) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Gatilho 30 dias */}
        <div
          data-testid="card-kpi-gatilho-30d"
          className="p-4 rounded-xl bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-slate-800 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-500 dark:text-[#93A3B5] uppercase font-semibold">
              Gatilho 30 Dias
            </span>
            <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-[#12B886]" />
          </div>
          <span className="font-heading font-black text-xl text-slate-900 dark:text-[#F4F7FA] block mt-1">
            {metricas.gatilhoD30Count}
          </span>
          <span className="text-[10px] text-slate-500 dark:text-[#93A3B5] block mt-0.5">
            inativos 30-59d
          </span>
        </div>

        {/* Gatilho 60 dias */}
        <div
          data-testid="card-kpi-gatilho-60d"
          className="p-4 rounded-xl bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-slate-800 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-500 dark:text-[#93A3B5] uppercase font-semibold">
              Gatilho 60 Dias
            </span>
            <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-[#3B82F6]" />
          </div>
          <span className="font-heading font-black text-xl text-blue-600 dark:text-[#3B82F6] block mt-1">
            {metricas.gatilhoD60Count}
          </span>
          <span className="text-[10px] text-slate-500 dark:text-[#93A3B5] block mt-0.5">
            inativos ≥ 60 dias
          </span>
        </div>

        {/* Total Enviados Toque D30 */}
        <div
          data-testid="card-kpi-enviados-d30"
          className="p-4 rounded-xl bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-slate-800 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-500 dark:text-[#93A3B5] uppercase font-semibold">
              Enviados (D30)
            </span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-[#12B886]" />
          </div>
          <span className="font-heading font-black text-xl text-[#12B886] block mt-1">
            {metricas.totalEnviadosD30}
          </span>
          <span className="text-[10px] text-slate-500 dark:text-[#93A3B5] block mt-0.5">
            provas esperando
          </span>
        </div>

        {/* Total Enviados Toque D60 */}
        <div
          data-testid="card-kpi-enviados-d60"
          className="p-4 rounded-xl bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-slate-800 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-500 dark:text-[#93A3B5] uppercase font-semibold">
              Enviados (D60)
            </span>
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />
          </div>
          <span className="font-heading font-black text-xl text-blue-600 dark:text-blue-400 block mt-1">
            {metricas.totalEnviadosD60}
          </span>
          <span className="text-[10px] text-slate-500 dark:text-[#93A3B5] block mt-0.5">
            valor regulatório
          </span>
        </div>

        {/* Opt-outs Ativos */}
        <div
          data-testid="card-kpi-optouts"
          className="p-4 rounded-xl bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-slate-800 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-500 dark:text-[#93A3B5] uppercase font-semibold">
              Opt-outs Ativos
            </span>
            <UserX className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
          </div>
          <span className="font-heading font-black text-xl text-amber-700 dark:text-amber-400 block mt-1">
            {metricas.totalOptOutsAtivos}
          </span>
          <span className="text-[10px] text-slate-500 dark:text-[#93A3B5] block mt-0.5">
            contas descadastradas
          </span>
        </div>

        {/* Taxa de Retorno */}
        <div
          data-testid="card-kpi-taxa-retorno"
          className="p-4 rounded-xl bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-slate-800 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-500 dark:text-[#93A3B5] uppercase font-semibold">
              Taxa de Retorno
            </span>
            <UserCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-[#12B886]" />
          </div>
          <span className="font-heading font-black text-xl text-emerald-600 dark:text-[#12B886] block mt-1">
            {metricas.taxaRetornoPercentual}%
          </span>
          <span className="text-[10px] text-slate-500 dark:text-[#93A3B5] block mt-0.5">
            {metricas.usuariosReativadosCount} reativaram atividade
          </span>
        </div>
      </div>

      {/* Navegação entre Visualizações */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-[rgba(244,247,250,0.08)] pb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            data-testid="subaba-envios"
            onClick={() => setSubAba('envios')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              subAba === 'envios'
                ? 'bg-[#12B886] text-[#0A0E12] shadow-sm'
                : 'bg-white dark:bg-[#111820] text-slate-600 dark:text-[#93A3B5] hover:bg-slate-100 dark:hover:bg-[#16202B]'
            }`}
          >
            Linha do Tempo de Envios ({envios.length})
          </button>

          <button
            type="button"
            data-testid="subaba-inativos"
            onClick={() => setSubAba('inativos')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              subAba === 'inativos'
                ? 'bg-[#12B886] text-[#0A0E12] shadow-sm'
                : 'bg-white dark:bg-[#111820] text-slate-600 dark:text-[#93A3B5] hover:bg-slate-100 dark:hover:bg-[#16202B]'
            }`}
          >
            Usuários no Gatilho ({usuariosInativos.length})
          </button>

          <button
            type="button"
            data-testid="subaba-optout"
            onClick={() => setSubAba('optout')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              subAba === 'optout'
                ? 'bg-[#12B886] text-[#0A0E12] shadow-sm'
                : 'bg-white dark:bg-[#111820] text-slate-600 dark:text-[#93A3B5] hover:bg-slate-100 dark:hover:bg-[#16202B]'
            }`}
          >
            Opt-outs Ativos ({usuariosOptOut.length})
          </button>
        </div>

        {/* Filtros rápidos */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          {subAba === 'envios' && (
            <>
              <div className="flex items-center gap-1.5 bg-white dark:bg-[#111820] border border-slate-200 dark:border-[rgba(244,247,250,0.1)] px-2.5 py-1 rounded-lg">
                <Filter className="w-3 h-3 text-slate-400" />
                <select
                  aria-label="Filtro de Toque de Reativação"
                  value={filtroToque}
                  onChange={(e) => setFiltroToque(e.target.value as any)}
                  className="bg-transparent text-slate-800 dark:text-[#F4F7FA] focus:outline-none text-xs"
                >
                  <option value="todos">Todos os Toques</option>
                  <option value="d30">Toque Dia 30</option>
                  <option value="d60">Toque Dia 60</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5 bg-white dark:bg-[#111820] border border-slate-200 dark:border-[rgba(244,247,250,0.1)] px-2.5 py-1 rounded-lg">
                <select
                  aria-label="Filtro de Status de Envio"
                  value={filtroStatus}
                  onChange={(e) => setFiltroStatus(e.target.value as any)}
                  className="bg-transparent text-slate-800 dark:text-[#F4F7FA] focus:outline-none text-xs"
                >
                  <option value="todos">Todos os Status</option>
                  <option value="enviado">Enviados</option>
                  <option value="falha">Falhas</option>
                </select>
              </div>
            </>
          )}

          <div className="relative">
            <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={buscaTexto}
              onChange={(e) => setBuscaTexto(e.target.value)}
              placeholder="Buscar por e-mail ou nome..."
              className="pl-8 pr-3 py-1 rounded-lg bg-white dark:bg-[#111820] border border-slate-200 dark:border-[rgba(244,247,250,0.1)] text-xs text-slate-800 dark:text-[#F4F7FA] focus:outline-none w-48 sm:w-56"
            />
          </div>
        </div>
      </div>

      {/* 1. VISUALIZAÇÃO: LINHA DO TEMPO DE ENVIOS */}
      {subAba === 'envios' && (
        <div className="rounded-2xl bg-white dark:bg-[#111820] border border-slate-200 dark:border-[rgba(244,247,250,0.1)] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-[#0D1217] text-slate-600 dark:text-[#93A3B5] uppercase text-[10px] border-b border-slate-200 dark:border-[rgba(244,247,250,0.08)]">
                <tr>
                  <th className="p-3.5">Destinatário & Conta</th>
                  <th className="p-3.5">Toque</th>
                  <th className="p-3.5">Data/Hora Disparo</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Snapshot da Conta</th>
                  <th className="p-3.5">Retorno (Reativou?)</th>
                  <th className="p-3.5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[rgba(244,247,250,0.05)]">
                {enviosFiltrados.map((env) => {
                  const snap = (env.dados_conta_json || {}) as Partial<
                    import('@/services/reativacaoService').SnapshotContaReativacao
                  >
                  const isSucesso = env.status === 'enviado'

                  return (
                    <tr
                      key={env.id}
                      className="hover:bg-slate-50 dark:hover:bg-[#16202B]/60 transition-colors"
                    >
                      <td className="p-3.5">
                        <strong className="text-slate-900 dark:text-[#F4F7FA] block">
                          {env.expand?.usuario?.name || 'Cliente'}
                        </strong>
                        <span className="text-slate-500 dark:text-[#93A3B5] font-mono text-[11px]">
                          {env.destinatario_email || env.expand?.usuario?.email}
                        </span>
                        {snap.cnpj && (
                          <span className="block text-[10px] text-slate-400 font-mono">
                            CNPJ: {snap.cnpj}
                          </span>
                        )}
                      </td>

                      <td className="p-3.5">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            env.toque === 'd30'
                              ? 'bg-emerald-50 dark:bg-[#12B886]/10 text-emerald-700 dark:text-[#12B886] border border-emerald-200 dark:border-[#12B886]/30'
                              : 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800/40'
                          }`}
                        >
                          {env.toque === 'd30' ? 'Dia 30 (Provas)' : 'Dia 60 (Marco)'}
                        </span>
                      </td>

                      <td className="p-3.5 font-mono text-[11px] text-slate-600 dark:text-[#cbd5e1]">
                        {new Date(env.created).toLocaleString('pt-BR')}
                      </td>

                      <td className="p-3.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            isSucesso
                              ? 'bg-emerald-50 dark:bg-[#12B886]/20 text-emerald-800 dark:text-[#12B886]'
                              : 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400'
                          }`}
                        >
                          {isSucesso ? (
                            <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-[#12B886]" />
                          ) : (
                            <XCircle className="w-3 h-3 text-red-500" />
                          )}
                          <span>{isSucesso ? 'Enviado' : 'Falha'}</span>
                        </span>
                        {env.mensagem_erro && (
                          <span className="block text-[10px] text-red-500 truncate max-w-[180px] mt-0.5">
                            {env.mensagem_erro}
                          </span>
                        )}
                      </td>

                      <td className="p-3.5">
                        <div className="text-[11px] space-y-0.5 text-slate-600 dark:text-[#93A3B5]">
                          <span>
                            <strong>{snap.nfe_consultadas ?? 0}</strong> NFs •{' '}
                            <strong>{snap.lotes_cdv ?? 0}</strong> lotes CDV
                          </span>
                          <span className="block text-[10px] text-slate-400">
                            {snap.laudos_exportados ?? 0} laudos emitidos (
                            {snap.dias_inatividade ?? 0}d inativo)
                          </span>
                        </div>
                      </td>
                      <td className="p-3.5">
                        {env.reativou ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/50">
                            <UserCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                            <span>Reativou</span>
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">Aguardando</span>
                        )}
                      </td>

                      <td className="p-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => setEnvioSelecionado(env)}
                          className="px-2.5 py-1 rounded bg-slate-100 dark:bg-[#16202B] hover:bg-slate-200 dark:hover:bg-[#1f2d3d] text-slate-700 dark:text-[#D9B36C] font-semibold text-[11px] transition-colors"
                        >
                          Ver Detalhes
                        </button>
                      </td>
                    </tr>
                  )
                })}

                {enviosFiltrados.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="p-8 text-center text-xs text-slate-500 dark:text-[#93A3B5]"
                    >
                      Nenhum envio registrado com os filtros atuais.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. VISUALIZAÇÃO: USUÁRIOS NO GATILHO (ELEGÍVEIS) */}
      {subAba === 'inativos' && (
        <div className="rounded-2xl bg-white dark:bg-[#111820] border border-slate-200 dark:border-[rgba(244,247,250,0.1)] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-[#0D1217] text-slate-600 dark:text-[#93A3B5] uppercase text-[10px] border-b border-slate-200 dark:border-[rgba(244,247,250,0.08)]">
                <tr>
                  <th className="p-3.5">Usuário / Empresa</th>
                  <th className="p-3.5">Dias Inativo</th>
                  <th className="p-3.5">Gatilho Atual</th>
                  <th className="p-3.5">Acervo Acumulado</th>
                  <th className="p-3.5">Último Lote / Atividade</th>
                  <th className="p-3.5">Status Deduplicação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[rgba(244,247,250,0.05)]">
                {usuariosInativos.map((u) => (
                  <tr
                    key={u.usuarioId}
                    className="hover:bg-slate-50 dark:hover:bg-[#16202B]/60 transition-colors"
                  >
                    <td className="p-3.5">
                      <strong className="text-slate-900 dark:text-[#F4F7FA] block">{u.nome}</strong>
                      <span className="text-slate-500 dark:text-[#93A3B5] font-mono text-[11px]">
                        {u.email}
                      </span>
                      {u.cnpj && (
                        <span className="block text-[10px] text-slate-400 font-mono">{u.cnpj}</span>
                      )}
                    </td>

                    <td className="p-3.5">
                      <span className="font-heading font-bold text-sm text-amber-700 dark:text-[#D9B36C]">
                        {u.diasInatividade} dias
                      </span>
                    </td>

                    <td className="p-3.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          u.toqueElegivel === 'd30'
                            ? 'bg-emerald-50 dark:bg-[#12B886]/10 text-emerald-700 dark:text-[#12B886] border border-emerald-200 dark:border-[#12B886]/30'
                            : 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800/40'
                        }`}
                      >
                        {u.toqueElegivel === 'd30' ? 'Dia 30' : 'Dia 60'}
                      </span>
                    </td>

                    <td className="p-3.5">
                      <div className="text-[11px] text-slate-600 dark:text-[#cbd5e1] space-y-0.5">
                        <span>{u.snapshot.nfe_consultadas} NFs</span> •{' '}
                        <span>{u.snapshot.lotes_cdv} Lotes CDV</span>
                        <span className="block text-[10px] text-slate-400">
                          {u.snapshot.laudos_exportados} laudos emitidos
                        </span>
                      </div>
                    </td>

                    <td className="p-3.5 font-mono text-[11px] text-slate-600 dark:text-[#cbd5e1]">
                      {new Date(u.ultimaAtividadeData).toLocaleDateString('pt-BR')}
                    </td>

                    <td className="p-3.5">
                      {u.jaEnviadoUltimos30d ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          <Clock className="w-3 h-3 text-amber-500" />
                          <span>Bloqueado 30d</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-50 dark:bg-[#12B886]/20 text-emerald-800 dark:text-[#12B886]">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Elegível</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}

                {usuariosInativos.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="p-8 text-center text-xs text-slate-500 dark:text-[#93A3B5]"
                    >
                      Nenhum usuário no gatilho de inatividade no momento.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. VISUALIZAÇÃO: OPT-OUTS ATIVOS */}
      {subAba === 'optout' && (
        <div className="rounded-2xl bg-white dark:bg-[#111820] border border-slate-200 dark:border-[rgba(244,247,250,0.1)] overflow-hidden shadow-sm">
          <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border-b border-amber-200 dark:border-amber-900/40 text-xs text-amber-800 dark:text-amber-200 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
            <span>
              Contas listadas abaixo exerceram o direito de opt-out e são rigorosamente excluídas do
              job diário de reativação.
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-[#0D1217] text-slate-600 dark:text-[#93A3B5] uppercase text-[10px] border-b border-slate-200 dark:border-[rgba(244,247,250,0.08)]">
                <tr>
                  <th className="p-3.5">Usuário</th>
                  <th className="p-3.5">E-mail</th>
                  <th className="p-3.5">CNPJ</th>
                  <th className="p-3.5">Data do Descadastro</th>
                  <th className="p-3.5">Situação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[rgba(244,247,250,0.05)]">
                {usuariosOptOut.map((u) => (
                  <tr
                    key={u.usuarioId}
                    className="hover:bg-slate-50 dark:hover:bg-[#16202B]/60 transition-colors"
                  >
                    <td className="p-3.5 font-semibold text-slate-900 dark:text-[#F4F7FA]">
                      {u.nome}
                    </td>
                    <td className="p-3.5 font-mono text-slate-600 dark:text-[#cbd5e1]">
                      {u.email}
                    </td>
                    <td className="p-3.5 font-mono text-slate-500">{u.cnpj || '-'}</td>
                    <td className="p-3.5 font-mono text-slate-600 dark:text-[#cbd5e1]">
                      {u.optOutData
                        ? new Date(u.optOutData).toLocaleString('pt-BR')
                        : 'Registro Manual'}
                    </td>
                    <td className="p-3.5">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700/50">
                        <UserX className="w-3 h-3" />
                        <span>Opt-out Ativo</span>
                      </span>
                    </td>
                  </tr>
                ))}

                {usuariosOptOut.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="p-8 text-center text-xs text-slate-500 dark:text-[#93A3B5]"
                    >
                      Nenhuma conta com opt-out ativo no momento.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal de Detalhes do Envio */}
      {envioSelecionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-xl rounded-2xl bg-white dark:bg-[#111820] border-2 border-[#12B886] p-6 space-y-4 shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-[rgba(244,247,250,0.1)] pb-3">
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-[#12B886]" />
                <h3 className="font-heading font-bold text-base text-slate-900 dark:text-[#F4F7FA]">
                  Auditoria de Disparo • Toque{' '}
                  {envioSelecionado.toque === 'd30' ? 'Dia 30' : 'Dia 60'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEnvioSelecionado(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs flex-1 overflow-y-auto">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0A0E12] border border-slate-200 dark:border-[rgba(244,247,250,0.06)] space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Destinatário:</span>
                  <strong className="text-slate-800 dark:text-slate-200">
                    {envioSelecionado.destinatario_email}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Status:</span>
                  <span
                    className={`font-bold uppercase ${
                      envioSelecionado.status === 'enviado' ? 'text-[#12B886]' : 'text-red-500'
                    }`}
                  >
                    {envioSelecionado.status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Data/Hora:</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300">
                    {new Date(envioSelecionado.created).toLocaleString('pt-BR')}
                  </span>
                </div>
                {envioSelecionado.mensagem_erro && (
                  <div className="pt-1 text-red-500 font-mono text-[11px]">
                    Erro: {envioSelecionado.mensagem_erro}
                  </div>
                )}
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-[#93A3B5] block mb-1">
                  Snapshot Probatório Congelado no Momento do Envio
                </span>
                <pre className="p-4 rounded-xl bg-slate-50 dark:bg-[#0A0E12] border border-slate-200 dark:border-[rgba(244,247,250,0.1)] text-[#12B886] font-mono text-xs overflow-x-auto whitespace-pre-wrap leading-relaxed">
                  {JSON.stringify(envioSelecionado.dados_conta_json || {}, null, 2)}
                </pre>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-200 dark:border-[rgba(244,247,250,0.08)]">
              <button
                type="button"
                onClick={() => setEnvioSelecionado(null)}
                className="px-5 py-2 rounded-xl bg-slate-100 dark:bg-[#16202B] text-xs font-semibold text-slate-700 dark:text-[#F4F7FA]"
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
