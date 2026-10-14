import React, { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  BarChart3,
  Download,
  ShieldCheck,
  TrendingUp,
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
} from 'lucide-react'
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
  const [metricaGrafico, setMetricaGrafico] = useState<'massa' | 'co2e'>('co2e')

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
  }, [empresaContexto.cnpj])

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

  // Cálculos para o gráfico de barras dos 12 meses
  const maxValorGrafico = useMemo(() => {
    if (!dados || dados.evolucaoMensal.length === 0) return 1
    const valores = dados.evolucaoMensal.map((p) =>
      metricaGrafico === 'co2e' ? p.co2eConfirmadoKg : p.massaKg,
    )
    const max = Math.max(...valores, 0)
    return max > 0 ? max : 1
  }, [dados, metricaGrafico])

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

            {/* AÇÕES NO TOPO */}
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={carregarDados}
                disabled={isLoading}
                className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700 disabled:opacity-50"
                title="Recarregar dados"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Atualizar</span>
              </button>

              <button
                type="button"
                data-testid="btn-exportar-csv"
                onClick={handleExportarCsv}
                disabled={!dados || !dados.possuiEmpresaAssociada || isLoading}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-4 h-4" />
                <span>Exportar CSV Executivo</span>
              </button>

              <Link
                to="/painel"
                className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-transparent border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
              >
                <span>Meu Portal</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-60" />
              </Link>
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
                className="p-5 rounded-2xl bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between"
              >
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
                  <span className="text-xs font-semibold">Lotes em Coleta</span>
                  <Clock className="w-4 h-4 text-amber-500" />
                </div>
                <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                  {dados.kpis.lotesEmColeta}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Processo em triagem/pátio
                </div>
              </div>

              {/* 2. Lotes Validados/Confirmados */}
              <div
                data-testid="kpi-lotes-confirmados"
                className="p-5 rounded-2xl bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between"
              >
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
                  <span className="text-xs font-semibold">Lotes Validados</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                  {dados.kpis.lotesValidadosConfirmados}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  validado/confirmado
                </div>
              </div>

              {/* 3. Massa Recuperada (kg) */}
              <div
                data-testid="kpi-massa-recuperada"
                className="p-5 rounded-2xl bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between"
              >
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
                  <span className="text-xs font-semibold">Massa Recuperada</span>
                  <Scale className="w-4 h-4 text-blue-500" />
                </div>
                <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                  {dados.kpis.massaRecuperadaKg.toLocaleString('pt-BR', {
                    maximumFractionDigits: 1,
                  })}{' '}
                  <span className="text-xs font-normal text-slate-500">kg</span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  {dados.kpis.massaRecuperadaToneladas.toFixed(2).replace('.', ',')} t total
                </div>
              </div>

              {/* 4. CO₂e Confirmado Total (tCO₂e) */}
              <div
                data-testid="kpi-co2e-confirmado"
                className="p-5 rounded-2xl bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between"
              >
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
                  <span className="text-xs font-semibold">CO₂e Confirmado</span>
                  <Leaf className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                  {dados.kpis.co2eConfirmadoTotalTco2e.toLocaleString('pt-BR', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 3,
                  })}{' '}
                  <span className="text-xs font-normal text-slate-500">tCO₂e</span>
                </div>
                <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-medium">
                  {dados.kpis.co2eConfirmadoTotalKg.toLocaleString('pt-BR', {
                    maximumFractionDigits: 1,
                  })}{' '}
                  kgCO₂e dos lotes
                </div>
              </div>

              {/* 5. Documentos Emitidos (Atestados vs Preliminares) */}
              <div
                data-testid="kpi-documentos-emitidos"
                className="p-5 rounded-2xl bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between"
              >
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
                  <span className="text-xs font-semibold">Documentos</span>
                  <FileText className="w-4 h-4 text-purple-500" />
                </div>
                <div className="text-lg font-bold text-slate-900 dark:text-white font-mono space-y-0.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-xs text-slate-500 font-sans">Atestados:</span>
                    <strong className="text-emerald-600 dark:text-emerald-400">
                      {dados.kpis.documentosAtestadosEmitidos}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-xs text-slate-500 font-sans">Preliminares:</span>
                    <strong className="text-slate-700 dark:text-slate-300">
                      {dados.kpis.documentosRelatoriosPreliminares}
                    </strong>
                  </div>
                </div>
                <div className="text-[10px] text-slate-400 mt-1">Atestado Orbis & Laudos</div>
              </div>

              {/* 6. Pendências de Coleta em Aberto */}
              <div
                data-testid="kpi-pendencias-aberto"
                className="p-5 rounded-2xl bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between"
              >
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
                  <span className="text-xs font-semibold">Pendências Coleta</span>
                  <AlertTriangle
                    className={`w-4 h-4 ${
                      dados.kpis.pendenciasColetaEmAberto > 0 ? 'text-rose-500' : 'text-slate-400'
                    }`}
                  />
                </div>
                <div
                  className={`text-2xl font-black font-mono ${
                    dados.kpis.pendenciasColetaEmAberto > 0
                      ? 'text-rose-600 dark:text-rose-400'
                      : 'text-slate-900 dark:text-white'
                  }`}
                >
                  {dados.kpis.pendenciasColetaEmAberto}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  {dados.kpis.pendenciasColetaEmAberto === 0
                    ? 'Nenhuma pendência aberta'
                    : 'Aguardando respondentes'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SEÇÃO DO MEIO: EVOLUÇÃO NO TEMPO (GRÁFICO 12 MESES) & STATUS DE CONFORMIDADE */}
        {dados && dados.possuiEmpresaAssociada && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* GRÁFICO MENSAL DOS ÚLTIMOS 12 MESES (OCUPA 2 COLUNAS) */}
            <div
              data-testid="secao-evolucao-mensal"
              className="lg:col-span-2 bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    <span>Evolução no Tempo (Últimos 12 Meses)</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Dados históricos reais compilados a partir dos lotes emitidos pela organização
                  </p>
                </div>

                {/* SELETOR DE MÉTRICA DO GRÁFICO */}
                <div className="inline-flex items-center rounded-xl bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setMetricaGrafico('co2e')}
                    className={`px-3 py-1.5 rounded-lg transition-colors ${
                      metricaGrafico === 'co2e'
                        ? 'bg-white dark:bg-emerald-600 text-emerald-700 dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    CO₂e Confirmado (kg)
                  </button>
                  <button
                    type="button"
                    onClick={() => setMetricaGrafico('massa')}
                    className={`px-3 py-1.5 rounded-lg transition-colors ${
                      metricaGrafico === 'massa'
                        ? 'bg-white dark:bg-blue-600 text-blue-700 dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Massa Recuperada (kg)
                  </button>
                </div>
              </div>

              {/* BARRAS DO GRÁFICO */}
              <div className="pt-4">
                <div className="grid grid-cols-12 gap-1.5 sm:gap-2 items-end h-56 sm:h-64 px-2 border-b border-slate-200 dark:border-slate-700">
                  {dados.evolucaoMensal.map((ponto, idx) => {
                    const valor = metricaGrafico === 'co2e' ? ponto.co2eConfirmadoKg : ponto.massaKg
                    const alturaPct = maxValorGrafico > 0 ? (valor / maxValorGrafico) * 100 : 0
                    const alturaFinal = Math.max(alturaPct, 4) // Mantém uma altura mínima visual se 0

                    return (
                      <div
                        key={ponto.mesChave}
                        className="flex flex-col items-center justify-end h-full group relative"
                      >
                        {/* TOOLTIP HOVER */}
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-full mb-2 z-20 pointer-events-none bg-slate-900 dark:bg-slate-800 text-white text-[11px] rounded-lg p-2 shadow-xl whitespace-nowrap text-center">
                          <div className="font-bold">{ponto.mesRotulo}</div>
                          <div>Massa: {ponto.massaKg.toFixed(1).replace('.', ',')} kg</div>
                          <div>
                            CO₂e: {ponto.co2eConfirmadoKg.toFixed(1).replace('.', ',')} kgCO₂e
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {ponto.lotesCount} lote(s)
                          </div>
                        </div>

                        {/* BARRA */}
                        <div
                          style={{ height: `${alturaFinal}%` }}
                          className={`w-full max-w-[28px] rounded-t-md transition-all duration-300 ${
                            valor > 0
                              ? metricaGrafico === 'co2e'
                                ? 'bg-emerald-500 dark:bg-emerald-500 hover:bg-emerald-600 dark:hover:bg-emerald-400'
                                : 'bg-blue-500 dark:bg-blue-500 hover:bg-blue-600 dark:hover:bg-blue-400'
                              : 'bg-slate-200 dark:bg-slate-800'
                          }`}
                        />
                      </div>
                    )
                  })}
                </div>

                {/* RÓTULOS DOS MESES ABAIXO DAS BARRAS */}
                <div className="grid grid-cols-12 gap-1.5 sm:gap-2 pt-2 px-2 text-center text-[10px] sm:text-xs font-mono text-slate-500 dark:text-slate-400">
                  {dados.evolucaoMensal.map((ponto) => (
                    <div key={ponto.mesChave} className="truncate">
                      {ponto.mesRotulo.split('/')[0]}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="flex items-center gap-1.5">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      metricaGrafico === 'co2e' ? 'bg-emerald-500' : 'bg-blue-500'
                    }`}
                  />
                  <span>
                    {metricaGrafico === 'co2e'
                      ? 'CO₂e Confirmado dos lotes (kgCO₂e)'
                      : 'Massa recuperada e comprovada (kg)'}
                  </span>
                </span>
                <span className="font-mono text-[11px]">Metodologia DM-ORB-001 v1.1</span>
              </div>
            </div>

            {/* STATUS DE CONFORMIDADE & AUDITORIA (1 COLUNA) */}
            <div
              data-testid="secao-status-conformidade"
              className="bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6 flex flex-col justify-between"
            >
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 pb-4 border-b border-slate-100 dark:border-slate-800">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <span>Status de Conformidade</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                  Triagem pericial e integridade documental dos lotes registrados pelo Centro de
                  Desmonte.
                </p>

                <div className="space-y-3 mt-5">
                  {/* Item 1: Com Atestado Ativo */}
                  <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/60 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <div>
                        <div className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                          Atestado Orbis Ativo
                        </div>
                        <div className="text-[11px] text-emerald-700 dark:text-emerald-400">
                          Lotes validados e confirmados
                        </div>
                      </div>
                    </div>
                    <span className="text-lg font-black font-mono text-emerald-800 dark:text-emerald-200">
                      {dados.statusConformidade.lotesComAtestadoAtivo}
                    </span>
                  </div>

                  {/* Item 2: Em Coleta */}
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                      <div>
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          Em Coleta / Pátio
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          Triagem e etiquetagem
                        </div>
                      </div>
                    </div>
                    <span className="text-lg font-black font-mono text-slate-800 dark:text-slate-200">
                      {dados.statusConformidade.lotesEmColeta}
                    </span>
                  </div>

                  {/* Item 3: Com Pendências */}
                  <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                      <div>
                        <div className="text-xs font-bold text-amber-900 dark:text-amber-200">
                          Com Pendências
                        </div>
                        <div className="text-[11px] text-amber-700 dark:text-amber-400">
                          Documentos ou evidências em aberto
                        </div>
                      </div>
                    </div>
                    <span className="text-lg font-black font-mono text-amber-800 dark:text-amber-200">
                      {dados.statusConformidade.lotesComPendencias}
                    </span>
                  </div>
                </div>
              </div>

              {/* NOTA INSTITUCIONAL SOBRE CRÉDITOS */}
              <div className="p-3.5 rounded-xl bg-slate-100/70 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
                <div className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-slate-400" />
                  <span>Diretriz Regulatória Orbis dMRV</span>
                </div>
                <p className="leading-snug">
                  O CO₂e confirmado refere-se estritamente às emissões evitadas apuradas no balanço
                  de massa dos lotes. A plataforma não emite nem comercializa créditos de carbono.
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
