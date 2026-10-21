import React, { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  BarChart3,
  Download,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  Minus,
  FileCheck2,
  AlertTriangle,
  Layers,
  Scale,
  Sparkles,
  Building2,
  Clock,
  CheckCircle2,
  FileText,
  RefreshCw,
  ExternalLink,
  Lock,
  Leaf,
  Info,
  Calendar,
  PieChart as PieChartIcon,
} from 'lucide-react'
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from 'recharts'
import { useAuth } from '@/contexts/AuthContext'
import { useSeo } from '@/hooks/useSeo'
import pb from '@/lib/pocketbase/client'
import {
  carregarDadosPainelResultadosEmpresa,
  exportarPainelResultadosCsv,
  normalizarCnpj,
  type DadosPainelResultados,
} from '@/services/painelResultadosService'

export default function PainelResultadosPage() {
  useSeo({
    title: 'Painel de Resultados • Orbis Protocol',
    description:
      'Visão executiva consolidada de resultados para bancos, conselho e auditorias. Massa recuperada, CO₂e confirmado dos lotes e atestados.',
  })

  const { user, role } = useAuth()
  const [dados, setDados] = useState<DadosPainelResultados | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [erroMsg, setErroMsg] = useState<string | null>(null)
  const [periodoSelecionado, setPeriodoSelecionado] = useState<12 | 6 | 3>(12)

  // Identifica o CNPJ da empresa do usuário logado
  // Pode estar no user.cnpj, ou em um lead associado ao usuário
  const [empresaContexto, setEmpresaContexto] = useState<{
    cnpj: string | null
    nome: string | null
  }>({
    cnpj: (user as any)?.cnpj || null,
    nome: (user as any)?.empresa_nome || (user as any)?.razao_social || user?.name || null,
  })

  // Busca se há CNPJ no lead se não estiver no authRecord
  useEffect(() => {
    let ativo = true
    const resolverCnpj = async () => {
      const userCnpj = (user as any)?.cnpj
      if (userCnpj && userCnpj.trim()) {
        setEmpresaContexto({
          cnpj: userCnpj.trim(),
          nome: (user as any)?.razao_social || user?.name || 'Empresa Cadastrada',
        })
        return
      }

      // Tenta buscar nos leads do usuário
      if (user?.id) {
        try {
          const leads = await pb.collection('leads_diagnostico').getList(1, 1, {
            filter: `usuario = "${user.id}"`,
            sort: '-created',
            requestKey: null,
          })
          if (leads.items.length > 0 && ativo) {
            const l = leads.items[0]
            setEmpresaContexto({
              cnpj: l.cnpj || null,
              nome: l.razao_social || user?.name || 'Empresa Cadastrada',
            })
            return
          }
        } catch {
          /* intentionally ignored */
        }
      }

      // Se for gestor master ou admin sem CNPJ específico, tenta buscar o primeiro lead corporativo existente
      if ((role === 'master' || role === 'admin') && ativo) {
        try {
          const leads = await pb.collection('leads_diagnostico').getList(1, 1, {
            sort: '-created',
            requestKey: null,
          })
          if (leads.items.length > 0 && ativo) {
            const l = leads.items[0]
            setEmpresaContexto({
              cnpj: l.cnpj || null,
              nome: l.razao_social || 'Empresa em Análise (Visão de Gestão)',
            })
            return
          }
        } catch {
          /* intentionally ignored */
        }
      }
    }

    resolverCnpj()
    return () => {
      ativo = false
    }
  }, [user, role])

  const carregarDados = async () => {
    setIsLoading(true)
    setErroMsg(null)
    try {
      const res = await carregarDadosPainelResultadosEmpresa(
        empresaContexto.cnpj,
        empresaContexto.nome,
        periodoSelecionado,
      )
      setDados(res)
    } catch (err: any) {
      setErroMsg(err?.message || 'Falha ao consolidar o Painel de Resultados.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    carregarDados()
  }, [empresaContexto.cnpj, periodoSelecionado])

  // Função de exportação para CSV
  const handleExportarCsv = () => {
    if (!dados) return
    const { conteudoCsv, nomeArquivo } = exportarPainelResultadosCsv(dados)
    const blob = new Blob([conteudoCsv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', nomeArquivo)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // Cores institucionais e acessíveis para a rosca de materiais
  const CORES_MATERIAIS: Record<string, string> = {
    aco: '#2563EB', // Azul corporativo
    aluminio: '#06B6D4', // Ciano
    cobre: '#F97316', // Laranja metálico
    polimeros: '#8B5CF6', // Roxo/violeta
    outros: '#64748B', // Slate neutro
  }

  // Componente auxiliar para renderizar a seta de tendência vs mês anterior
  const renderTendenciaBadge = (
    tendencia?: {
      direcao: 'alta' | 'baixa' | 'neutro'
      rotuloVariacao: string
      percentualVariacao: number | null
    },
    inverterCoresPositivasNegativas = false, // ex: para pendências, alta é alerta (vermelho), baixa é bom (verde)
  ) => {
    if (!tendencia) return null

    const { direcao, rotuloVariacao } = tendencia

    let isPositivo = direcao === 'alta'
    let isNegativo = direcao === 'baixa'

    if (inverterCoresPositivasNegativas) {
      isPositivo = direcao === 'baixa'
      isNegativo = direcao === 'alta'
    }

    if (direcao === 'neutro') {
      return (
        <span
          data-testid="tendencia-badge-neutro"
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-1.5 py-0.5 rounded"
          title="Sem variação vs mês anterior"
        >
          <Minus className="w-3 h-3" />
          <span>{rotuloVariacao}</span>
        </span>
      )
    }

    if (isPositivo) {
      return (
        <span
          data-testid="tendencia-badge-alta"
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/60 dark:border-emerald-800/40 px-1.5 py-0.5 rounded"
          title="Variação positiva vs mês anterior"
        >
          {direcao === 'alta' ? (
            <TrendingUp className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <TrendingDown className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
          )}
          <span>{rotuloVariacao}</span>
        </span>
      )
    }

    return (
      <span
        data-testid="tendencia-badge-baixa"
        className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50 border border-rose-200/60 dark:border-rose-800/40 px-1.5 py-0.5 rounded"
        title="Variação negativa vs mês anterior"
      >
        {direcao === 'baixa' ? (
          <TrendingDown className="w-3 h-3 text-rose-600 dark:text-rose-400" />
        ) : (
          <TrendingUp className="w-3 h-3 text-rose-600 dark:text-rose-400" />
        )}
        <span>{rotuloVariacao}</span>
      </span>
    )
  }

  return (
    <div
      data-testid="painel-resultados-page"
      className="min-h-screen bg-slate-50 dark:bg-[#0A1628] text-slate-800 dark:text-slate-100 py-8 px-4 sm:px-6 lg:px-8 transition-colors duration-200"
    >
      <div className="max-w-7xl mx-auto space-y-8">
        {/* CABEÇALHO EXECUTIVO */}
        <div className="bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Visão Executiva • Bancos, Conselho & Auditores</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white font-heading">
                Painel de Resultados
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400 max-w-3xl leading-relaxed">
                Relatório consolidado de descarbonização e balanço de massa apurado pelo protocolo{' '}
                <strong className="text-slate-900 dark:text-slate-200">DM-ORB-001 v1.1</strong> para
                o seu{' '}
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  Centro de Desmonte
                </span>
                . Dados protegidos por prova documental criptográfica e isolamento por CNPJ.
              </p>
              {empresaContexto.cnpj && (
                <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-500 dark:text-slate-400 font-mono">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    <strong>{empresaContexto.nome || 'Empresa Titular'}</strong>
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                    CNPJ:{' '}
                    <span className="text-slate-700 dark:text-slate-300">
                      {empresaContexto.cnpj}
                    </span>
                  </span>
                </div>
              )}
            </div>

            {/* AÇÕES NO TOPO COM FILTRO DE PERÍODO (3 / 6 / 12 MESES) */}
            <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-3 shrink-0">
              {/* FILTRO DE PERÍODO (3 / 6 / 12 MESES) */}
              <div
                data-testid="filtro-periodo-container"
                className="inline-flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
              >
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-slate-500 dark:text-slate-400 font-medium">
                  <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span className="hidden md:inline">Período:</span>
                </span>
                <button
                  type="button"
                  data-testid="filtro-periodo-3m"
                  onClick={() => setPeriodoSelecionado(3)}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    periodoSelecionado === 3
                      ? 'bg-white dark:bg-emerald-600 text-emerald-700 dark:text-white shadow-xs font-bold'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  3 meses
                </button>
                <button
                  type="button"
                  data-testid="filtro-periodo-6m"
                  onClick={() => setPeriodoSelecionado(6)}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    periodoSelecionado === 6
                      ? 'bg-white dark:bg-emerald-600 text-emerald-700 dark:text-white shadow-xs font-bold'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  6 meses
                </button>
                <button
                  type="button"
                  data-testid="filtro-periodo-12m"
                  onClick={() => setPeriodoSelecionado(12)}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    periodoSelecionado === 12
                      ? 'bg-white dark:bg-emerald-600 text-emerald-700 dark:text-white shadow-xs font-bold'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  12 meses
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={carregarDados}
                  disabled={isLoading}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700 disabled:opacity-50"
                  title="Recarregar dados"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">Atualizar</span>
                </button>

                <button
                  type="button"
                  data-testid="btn-exportar-csv"
                  onClick={handleExportarCsv}
                  disabled={!dados || !dados.possuiEmpresaAssociada || isLoading}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>CSV</span>
                </button>

                <Link
                  to="/painel"
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-transparent border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
                >
                  <span>Portal</span>
                  <ExternalLink className="w-3 h-3 opacity-60" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* ALERTA DE RESTRINGÊNCIA / ESTADO VAZIO CASO SEM EMPRESA */}
        {dados && !dados.possuiEmpresaAssociada && (
          <div
            data-testid="estado-vazio-sem-empresa"
            className="p-8 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200 space-y-3"
          >
            <div className="flex items-center gap-3 font-bold text-base">
              <Lock className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>Privacidade Absoluta • Nenhuma Empresa Associada ao Usuário</span>
            </div>
            <p className="text-sm leading-relaxed text-amber-800 dark:text-amber-300">
              O seu perfil de acesso atual (ex.: perito externo ou auditor sem vínculo empresarial)
              não possui um CNPJ corporativo associado. Em conformidade rigorosa com a política de
              privacidade do Orbis Protocol, os dados de descarbonização e balanço de massa são
              estritamente restritos ao universo da própria empresa cadastrada, sendo vedado
              qualquer vazamento ou consolidação cruzada de dados de outros CNPJs.
            </p>
            <div className="pt-2">
              <Link
                to="/painel"
                className="inline-flex items-center gap-2 text-xs font-semibold text-amber-900 dark:text-amber-100 underline underline-offset-4 hover:opacity-80"
              >
                <span>Acessar o portal principal para vincular CNPJ de faturamento</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}

        {/* BLOCO DE KPIS DO TOPO */}
        {dados && dados.possuiEmpresaAssociada && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Indicadores-Chave de Desempenho (KPIs do Centro de Desmonte)</span>
              </h2>
              <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">
                Massa auditada & CO₂e confirmado dos lotes
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              {/* 1. Lotes em Coleta */}
              <div
                data-testid="kpi-lotes-em-coleta"
                className="p-5 rounded-2xl bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-3"
              >
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                  <span className="text-xs font-semibold">Lotes em Coleta</span>
                  <Clock className="w-4 h-4 text-amber-500" />
                </div>
                <div>
                  <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                    {dados.kpis.lotesEmColeta}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Processo em triagem/pátio
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
                  {renderTendenciaBadge(dados.kpis.tendencias?.lotesEmColeta)}
                </div>
              </div>

              {/* 2. Lotes Validados/Confirmados */}
              <div
                data-testid="kpi-lotes-confirmados"
                className="p-5 rounded-2xl bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-3"
              >
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                  <span className="text-xs font-semibold">Lotes Validados</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                </div>
                <div>
                  <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                    {dados.kpis.lotesValidadosConfirmados}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    validado/confirmado
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
                  {renderTendenciaBadge(dados.kpis.tendencias?.lotesValidadosConfirmados)}
                </div>
              </div>

              {/* 3. Massa Recuperada (kg) */}
              <div
                data-testid="kpi-massa-recuperada"
                className="p-5 rounded-2xl bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-3"
              >
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                  <span className="text-xs font-semibold">Massa Recuperada</span>
                  <Scale className="w-4 h-4 text-blue-500" />
                </div>
                <div>
                  <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                    {dados.kpis.massaRecuperadaKg.toLocaleString('pt-BR', {
                      maximumFractionDigits: 1,
                    })}{' '}
                    <span className="text-xs font-normal text-slate-500">kg</span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {dados.kpis.massaRecuperadaToneladas.toFixed(2).replace('.', ',')} t total
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
                  {renderTendenciaBadge(dados.kpis.tendencias?.massaRecuperadaKg)}
                </div>
              </div>

              {/* 4. CO₂e Confirmado Total (tCO₂e) */}
              <div
                data-testid="kpi-co2e-confirmado"
                className="p-5 rounded-2xl bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-3"
              >
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                  <span className="text-xs font-semibold">CO₂e Confirmado</span>
                  <Leaf className="w-4 h-4 text-emerald-500" />
                </div>
                <div>
                  <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                    {dados.kpis.co2eConfirmadoTotalTco2e.toLocaleString('pt-BR', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 3,
                    })}{' '}
                    <span className="text-xs font-normal text-slate-500">tCO₂e</span>
                  </div>
                  <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5 font-medium truncate">
                    {dados.kpis.co2eConfirmadoTotalKg.toLocaleString('pt-BR', {
                      maximumFractionDigits: 1,
                    })}{' '}
                    kgCO₂e
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
                  {renderTendenciaBadge(dados.kpis.tendencias?.co2eConfirmadoTotalKg)}
                </div>
              </div>

              {/* 5. Documentos Emitidos (Atestados vs Preliminares) */}
              <div
                data-testid="kpi-documentos-emitidos"
                className="p-5 rounded-2xl bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-3"
              >
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                  <span className="text-xs font-semibold">Documentos</span>
                  <FileText className="w-4 h-4 text-purple-500" />
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm font-mono">
                    <span className="text-xs text-slate-500 font-sans">Atestados:</span>
                    <strong className="text-emerald-600 dark:text-emerald-400 text-base">
                      {dados.kpis.documentosAtestadosEmitidos}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between text-sm font-mono mt-0.5">
                    <span className="text-xs text-slate-500 font-sans">Preliminares:</span>
                    <strong className="text-slate-700 dark:text-slate-300">
                      {dados.kpis.documentosRelatoriosPreliminares}
                    </strong>
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
                  {renderTendenciaBadge(dados.kpis.tendencias?.documentosEmitidos)}
                </div>
              </div>

              {/* 6. Pendências de Coleta em Aberto */}
              <div
                data-testid="kpi-pendencias-aberto"
                className="p-5 rounded-2xl bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-3"
              >
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                  <span className="text-xs font-semibold">Pendências Coleta</span>
                  <AlertTriangle
                    className={`w-4 h-4 ${
                      dados.kpis.pendenciasColetaEmAberto > 0 ? 'text-rose-500' : 'text-slate-400'
                    }`}
                  />
                </div>
                <div>
                  <div
                    className={`text-2xl font-black font-mono ${
                      dados.kpis.pendenciasColetaEmAberto > 0
                        ? 'text-rose-600 dark:text-rose-400'
                        : 'text-slate-900 dark:text-white'
                    }`}
                  >
                    {dados.kpis.pendenciasColetaEmAberto}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                    {dados.kpis.pendenciasColetaEmAberto === 0
                      ? 'Nenhuma em aberto'
                      : 'Aguardando respondentes'}
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
                  {renderTendenciaBadge(dados.kpis.tendencias?.pendenciasColetaEmAberto, true)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PEÇA 3: GRÁFICO DE BARRAS MENSAIS COMPARATIVAS (MASSA × CO₂e LADO A LADO) */}
        {dados && dados.possuiEmpresaAssociada && (
          <div
            data-testid="secao-barras-comparativas-mensais"
            className="bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <span>Comparativo Mensal: Massa Recuperada × CO₂e Confirmado</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Barras lado a lado exibindo a correspondência entre a massa recuperada (kg) e o
                  CO₂e confirmado (kgCO₂e) no período de{' '}
                  <strong className="text-slate-800 dark:text-slate-200">
                    {periodoSelecionado} meses
                  </strong>
                  .
                </p>
              </div>

              <div className="flex items-center gap-4 text-xs font-semibold">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-blue-500 inline-block" />
                  <span className="text-slate-700 dark:text-slate-300">Massa (kg)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block" />
                  <span className="text-slate-700 dark:text-slate-300">CO₂e (kgCO₂e)</span>
                </div>
              </div>
            </div>

            {/* GRÁFICO RECHARTS LADO A LADO */}
            <div className="w-full h-72 sm:h-80 pt-2" data-testid="grafico-barras-lado-a-lado">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={dados.evolucaoMensal}
                  margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#334155"
                    opacity={0.2}
                    vertical={false}
                  />
                  <XAxis
                    dataKey="mesRotulo"
                    tick={{ fill: '#64748B', fontSize: 11 }}
                    tickLine={{ stroke: '#94A3B8' }}
                  />
                  <YAxis
                    tick={{ fill: '#64748B', fontSize: 11 }}
                    tickLine={{ stroke: '#94A3B8' }}
                    tickFormatter={(val) =>
                      val >= 1000 ? `${(val / 1000).toFixed(1)}k` : `${val}`
                    }
                  />
                  <RechartsTooltip
                    content={({ active, payload }) => {
                      if (!active || !payload || !payload.length) return null
                      const ponto = payload[0].payload
                      return (
                        <div className="bg-slate-900/95 dark:bg-[#07101E]/95 backdrop-blur-sm border border-slate-700 rounded-xl p-3 shadow-xl text-white text-xs space-y-1.5">
                          <div className="font-bold text-slate-200 border-b border-slate-700 pb-1">
                            {ponto.mesRotulo} • {ponto.lotesCount} lote(s)
                          </div>
                          <div className="flex items-center justify-between gap-4">
                            <span className="flex items-center gap-1.5 text-blue-300">
                              <span className="w-2 h-2 rounded-full bg-blue-500" />
                              Massa:
                            </span>
                            <span className="font-mono font-bold">
                              {Number(ponto.massaKg).toLocaleString('pt-BR', {
                                maximumFractionDigits: 1,
                              })}{' '}
                              kg
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-4">
                            <span className="flex items-center gap-1.5 text-emerald-300">
                              <span className="w-2 h-2 rounded-full bg-emerald-500" />
                              CO₂e:
                            </span>
                            <span className="font-mono font-bold">
                              {Number(ponto.co2eConfirmadoKg).toLocaleString('pt-BR', {
                                maximumFractionDigits: 1,
                              })}{' '}
                              kgCO₂e
                            </span>
                          </div>
                        </div>
                      )
                    }}
                  />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    wrapperStyle={{ paddingBottom: '10px' }}
                    content={() => null}
                  />
                  <Bar
                    dataKey="massaKg"
                    name="Massa (kg)"
                    fill="#3B82F6"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={32}
                  />
                  <Bar
                    dataKey="co2eConfirmadoKg"
                    name="CO₂e Confirmado (kg)"
                    fill="#10B981"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={32}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Relação direta massa auditada × emissões evitadas apuradas por lote</span>
              </span>
              <span className="font-mono text-[11px] mt-1 sm:mt-0">
                Metodologia DM-ORB-001 v1.1
              </span>
            </div>
          </div>
        )}

        {/* SEÇÃO COM AS PEÇAS 1 (ROSCA DE MATERIAIS) E 2 (BARRAS POR STATUS DO DOSSIÊ) */}
        {dados && dados.possuiEmpresaAssociada && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* PEÇA 1: GRÁFICO DE ROSCA (DONUT) COLORIDO POR MATERIAL */}
            <div
              data-testid="secao-grafico-donut-materiais"
              className="bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <PieChartIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      <span>Composição por Material (Massa & %)</span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Gráfico de rosca evidenciando a partição percentual de cada fração metálica e
                      polimérica recuperada.
                    </p>
                  </div>
                </div>

                {/* GRÁFICO DONUT RECHARTS COM LEGENDA COLORIDA */}
                <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-6">
                  <div className="w-52 h-52 sm:w-60 sm:h-60 shrink-0 relative flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <RechartsTooltip
                          content={({ active, payload }) => {
                            if (!active || !payload || !payload.length) return null
                            const item = payload[0].payload as (typeof dados.quebraPorMaterial)[0]
                            return (
                              <div className="bg-slate-900/95 dark:bg-[#07101E]/95 border border-slate-700 rounded-xl p-2.5 shadow-xl text-white text-xs space-y-1">
                                <div className="font-bold flex items-center gap-1.5">
                                  <span
                                    className="w-2.5 h-2.5 rounded-full"
                                    style={{
                                      backgroundColor: CORES_MATERIAIS[item.categoria] || '#64748B',
                                    }}
                                  />
                                  <span>{item.nomeExibicao}</span>
                                </div>
                                <div className="text-slate-300">
                                  Massa:{' '}
                                  <strong className="text-white font-mono">
                                    {item.pesoKg.toLocaleString('pt-BR', {
                                      maximumFractionDigits: 1,
                                    })}{' '}
                                    kg
                                  </strong>
                                </div>
                                <div className="text-emerald-400">
                                  Participação:{' '}
                                  <strong className="font-mono">
                                    {item.percentualPeso.toFixed(1).replace('.', ',')}%
                                  </strong>
                                </div>
                              </div>
                            )
                          }}
                        />
                        <Pie
                          data={dados.quebraPorMaterial}
                          dataKey="pesoKg"
                          nameKey="nomeExibicao"
                          innerRadius={55}
                          outerRadius={85}
                          paddingAngle={3}
                          stroke="#0F172A"
                          strokeWidth={2}
                        >
                          {dados.quebraPorMaterial.map((entry) => (
                            <Cell
                              key={`cell-donut-${entry.categoria}`}
                              fill={CORES_MATERIAIS[entry.categoria] || '#64748B'}
                            />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>

                    {/* CENTRO DA ROSCA */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                      <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                        Total
                      </span>
                      <span className="text-base font-black font-mono text-slate-900 dark:text-white">
                        {dados.kpis.massaRecuperadaToneladas.toFixed(1).replace('.', ',')} t
                      </span>
                    </div>
                  </div>

                  {/* LEGENDA DETALHADA COM CORES E PERCENTUAIS EXIBIDOS */}
                  <div className="flex-1 w-full space-y-2 text-xs">
                    {dados.quebraPorMaterial.map((item) => {
                      const cor = CORES_MATERIAIS[item.categoria] || '#64748B'
                      return (
                        <div
                          key={`legenda-donut-${item.categoria}`}
                          data-testid={`donut-material-${item.categoria}`}
                          className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800"
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className="w-3 h-3 rounded-full shrink-0"
                              style={{ backgroundColor: cor }}
                            />
                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                              {item.nomeExibicao}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 font-mono">
                            <span className="text-slate-500 dark:text-slate-400">
                              {item.pesoKg.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} kg
                            </span>
                            <span
                              className="font-bold px-1.5 py-0.5 rounded text-[11px]"
                              style={{
                                color: cor,
                                backgroundColor: `${cor}15`,
                              }}
                            >
                              {item.percentualPeso.toFixed(1).replace('.', ',')}%
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between border border-slate-100 dark:border-slate-800">
                <span>Rastreabilidade conforme DM-ORB-001 v1.1</span>
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  Opção B: Sem exposição de fatores
                </span>
              </div>
            </div>

            {/* PEÇA 2: GRÁFICO DE BARRAS POR STATUS DO DOSSIÊ */}
            <div
              data-testid="secao-grafico-status-dossie"
              className="bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      <span>Status do Dossiê dos Lotes</span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Distribuição dos lotes pelas etapas de conformidade: em coleta (âmbar),
                      validado (azul), confirmado (índigo) e Atestado (verde).
                    </p>
                  </div>
                </div>

                {/* BARRAS DE STATUS DO DOSSIÊ */}
                <div className="pt-4 space-y-4">
                  {dados.statusDossie.map((item) => {
                    return (
                      <div
                        key={`status-dossie-${item.statusChave}`}
                        data-testid={`status-dossie-${item.statusChave}`}
                        className="space-y-1.5"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                            <span
                              className="w-2.5 h-2.5 rounded-full"
                              style={{ backgroundColor: item.cor }}
                            />
                            <span>{item.rotulo}</span>
                          </span>
                          <div className="font-mono text-xs flex items-center gap-2">
                            <strong className="text-slate-900 dark:text-white">
                              {item.quantidade} lote{item.quantidade === 1 ? '' : 's'}
                            </strong>
                            <span className="text-slate-400">
                              ({item.percentual.toFixed(1).replace('.', ',')}%)
                            </span>
                          </div>
                        </div>

                        {/* Barra de progresso com cor respectiva */}
                        <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                          <div
                            style={{
                              width: `${Math.max(item.percentual, item.quantidade > 0 ? 5 : 0)}%`,
                              backgroundColor: item.cor,
                            }}
                            className="h-full rounded-full transition-all duration-500"
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* NOTA INSTITUCIONAL OBRIGATÓRIA */}
              <div className="p-3.5 rounded-xl bg-slate-100/70 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
                <div className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-slate-400" />
                  <span>Diretriz Regulatória Orbis dMRV</span>
                </div>
                <p className="leading-snug">
                  O CO₂e confirmado refere-se estritamente às emissões evitadas apuradas no balanço
                  de massa dos lotes. A plataforma apura o CO₂e dos lotes e{' '}
                  <strong>NÃO emite créditos de carbono</strong>.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* SEÇÃO INFERIOR: DISTRIBUIÇÃO POR MATERIAL (SEM EXIBIR FATORES - REGRA OPÇÃO B) */}
        {dados && dados.possuiEmpresaAssociada && (
          <div
            data-testid="secao-distribuicao-materiais"
            className="bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <span>Distribuição por Material (Pesos e Percentuais)</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Balanço consolidado de massa e CO₂e confirmado por grupo de material.{' '}
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    Sem exposição de catálogo de fatores (Opção B).
                  </span>
                </p>
              </div>

              <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                Total rastreado:{' '}
                <strong className="text-slate-900 dark:text-white">
                  {dados.kpis.massaRecuperadaKg.toLocaleString('pt-BR', {
                    maximumFractionDigits: 1,
                  })}{' '}
                  kg
                </strong>
              </div>
            </div>

            {/* TABELA DE MATERIAIS */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 uppercase font-semibold">
                    <th className="py-3 px-4">Material Auditado</th>
                    <th className="py-3 px-4 text-right">Massa Recuperada (kg)</th>
                    <th className="py-3 px-4 text-right">Participação na Massa</th>
                    <th className="py-3 px-4 text-right">CO₂e Confirmado (kgCO₂e)</th>
                    <th className="py-3 px-4 text-right">Participação no CO₂e</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {dados.quebraPorMaterial.map((item) => (
                    <tr
                      key={item.categoria}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span>{item.nomeExibicao}</span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-800 dark:text-slate-200">
                        {item.pesoKg.toLocaleString('pt-BR', {
                          minimumFractionDigits: 1,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-600 dark:text-slate-300">
                        <div className="flex items-center justify-end gap-2">
                          <span>{item.percentualPeso.toFixed(1).replace('.', ',')}%</span>
                          <div className="w-16 h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden hidden sm:block">
                            <div
                              style={{ width: `${Math.min(item.percentualPeso, 100)}%` }}
                              className="h-full bg-blue-500 rounded-full"
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {item.co2eConfirmadoKg.toLocaleString('pt-BR', {
                          minimumFractionDigits: 1,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-600 dark:text-slate-300">
                        <div className="flex items-center justify-end gap-2">
                          <span>{item.percentualCo2e.toFixed(1).replace('.', ',')}%</span>
                          <div className="w-16 h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden hidden sm:block">
                            <div
                              style={{ width: `${Math.min(item.percentualCo2e, 100)}%` }}
                              className="h-full bg-emerald-500 rounded-full"
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* RODAPÉ DO PAINEL COM ASSINATURA METODOLÓGICA */}
        <div className="p-4 rounded-xl bg-slate-100 dark:bg-[#0E1A2E]/50 border border-slate-200 dark:border-slate-800/80 text-xs text-slate-500 dark:text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>
              Orbis Protocol • Emissão sob a Norma Metodológica DM-ORB-001 v1.1 e Atestado Orbis
              dMRV
            </span>
          </div>
          <div className="flex items-center gap-3 font-mono text-[11px]">
            <span>Centro de Desmonte Credenciado</span>
            <span>•</span>
            <Link to="/fatores" className="text-emerald-600 dark:text-emerald-400 hover:underline">
              Metodologia Oficial
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
