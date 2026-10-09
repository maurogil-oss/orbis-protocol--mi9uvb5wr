import React, { useState, useEffect } from 'react'
import {
  School,
  Building,
  Users,
  Award,
  TrendingUp,
  Download,
  Filter,
  CheckCircle2,
  Clock,
  Printer,
  ShieldCheck,
  Search,
  ExternalLink,
  PlusCircle,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  obterMetricasPainelEducacional,
  MetricasEscolaPainel,
  ConsolidadoRedeMetricas,
} from '@/services/escolasService'

export default function PainelEducacionalPage() {
  const [metricasEscolas, setMetricasEscolas] = useState<MetricasEscolaPainel[]>([])
  const [consolidado, setConsolidado] = useState<ConsolidadoRedeMetricas>({
    totalEscolas: 0,
    totalAlunosRede: 0,
    totalAlunosAlcancados: 0,
    mediaConclusaoTrilha: 0,
    totalAtestadosEmitidos: 0,
  })
  const [filtroRede, setFiltroRede] = useState<'todas' | 'municipal' | 'estadual' | 'particular'>(
    'todas',
  )
  const [busca, setBusca] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function carregar() {
      try {
        const dados = await obterMetricasPainelEducacional()
        setMetricasEscolas(dados.escolasMetricas)
        setConsolidado(dados.consolidado)
      } finally {
        setLoading(false)
      }
    }
    carregar()
  }, [])

  const escolasFiltradas = metricasEscolas.filter((esc) => {
    const matchRede = filtroRede === 'todas' || esc.rede === filtroRede
    const matchBusca =
      !busca ||
      esc.nomeEscola.toLowerCase().includes(busca.toLowerCase()) ||
      esc.municipio.toLowerCase().includes(busca.toLowerCase())
    return matchRede && matchBusca
  })

  // Métricas do subconjunto filtrado para relatórios dinâmicos da rede
  const totalAlunosFiltrados = escolasFiltradas.reduce((acc, e) => acc + e.totalAlunos, 0)
  const totalAlcancadosFiltrados = escolasFiltradas.reduce((acc, e) => acc + e.alunosAlcancados, 0)
  const totalAtestadosFiltrados = escolasFiltradas.reduce((acc, e) => acc + e.atestadosEmitidos, 0)
  const mediaConclusaoFiltrada = escolasFiltradas.length
    ? Math.round(
        escolasFiltradas.reduce((acc, e) => acc + e.percentualConclusaoTrilha, 0) /
          escolasFiltradas.length,
      )
    : 0

  return (
    <div className="min-h-screen py-10 md:py-16 bg-slate-50 dark:bg-[#0A1628] text-slate-900 dark:text-[#F4F7FA] w-full max-w-full overflow-x-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 w-full">
        {/* Cabeçalho */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2 text-xs font-bold text-emerald-600 dark:text-[#12B886] uppercase tracking-wider">
              <School className="w-4 h-4" />
              <span>ORBIS EDUCAÇÃO • PAINEL DE IMPACTO ESG</span>
            </div>
            <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-slate-900 dark:text-[#F4F7FA]">
              Painel do Programa Educacional & Relatórios
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-[#93A3B5] mt-1">
              Métricas consolidadas de engajamento para secretarias de educação, escolas
              particulares e patrocinadores B2B2C.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => window.print()}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-[#0E1A2E] text-slate-700 dark:text-[#CBD5E1] border border-slate-200 dark:border-[rgba(244,247,250,0.1)] flex items-center gap-1.5 transition-all shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Exportar Relatório PDF</span>
            </button>
            <Link
              to="/escolas/cadastro"
              className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 transition-all shadow-sm"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Nova Escola</span>
            </Link>
          </div>
        </div>

        {/* 4 CARDS CONSOLIDADOS DE IMPACTO PARA O PATROCINADOR */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="p-5 rounded-2xl bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-[rgba(244,247,250,0.1)] space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-[#93A3B5]">
              <span>Escolas Atendidas</span>
              <Building className="w-4 h-4 text-emerald-600 dark:text-[#12B886]" />
            </div>
            <div className="text-2xl sm:text-3xl font-mono font-extrabold text-slate-900 dark:text-white">
              {consolidado.totalEscolas}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-[#93A3B5]">
              Unidades públicas e privadas integradas
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-[rgba(244,247,250,0.1)] space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-[#93A3B5]">
              <span>Alunos Alcançados</span>
              <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-mono font-extrabold text-slate-900 dark:text-white">
              {consolidado.totalAlunosAlcancados.toLocaleString('pt-BR')}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-[#93A3B5]">
              De um total de {consolidado.totalAlunosRede.toLocaleString('pt-BR')} matriculados
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-[rgba(244,247,250,0.1)] space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-[#93A3B5]">
              <span>% Conclusão da Trilha</span>
              <TrendingUp className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl sm:text-3xl font-mono font-extrabold text-slate-900 dark:text-white">
              {consolidado.mediaConclusaoTrilha}%
            </div>
            <p className="text-[11px] text-slate-500 dark:text-[#93A3B5]">
              Média ponderada da rede de ensino
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-[rgba(244,247,250,0.1)] space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-[#93A3B5]">
              <span>Atestados Emitidos</span>
              <Award className="w-4 h-4 text-emerald-600 dark:text-[#12B886]" />
            </div>
            <div className="text-2xl sm:text-3xl font-mono font-extrabold text-emerald-700 dark:text-[#12B886]">
              {consolidado.totalAtestadosEmitidos.toLocaleString('pt-BR')}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-[#93A3B5]">
              Com hash SHA-256 verificável
            </p>
          </div>
        </div>

        {/* FILTROS E BUSCA */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-[rgba(244,247,250,0.1)] mb-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar por escola ou cidade..."
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-50 dark:bg-[#0A1220] border border-slate-200 dark:border-[rgba(244,247,250,0.1)] text-xs text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
            {[
              { id: 'todas', label: 'Todas as Redes' },
              { id: 'municipal', label: 'Municipal' },
              { id: 'estadual', label: 'Estadual' },
              { id: 'particular', label: 'Particular' },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFiltroRede(f.id as typeof filtroRede)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  filtroRede === f.id
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 dark:bg-[#0A1220] text-slate-600 dark:text-[#93A3B5] hover:text-slate-900'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* RELATÓRIO CONSOLIDADO DO FILTRO ATIVO */}
        {filtroRede !== 'todas' && (
          <div className="p-4 mb-6 rounded-2xl bg-white dark:bg-[#0E1A2E] border border-emerald-500/30 flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="space-y-0.5">
              <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-[#12B886]">
                Consolidado da Rede Selecionada ({filtroRede})
              </span>
              <p className="font-semibold text-slate-900 dark:text-white">
                {escolasFiltradas.length} escola(s) •{' '}
                {totalAlcancadosFiltrados.toLocaleString('pt-BR')} de{' '}
                {totalAlunosFiltrados.toLocaleString('pt-BR')} alunos matriculados
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <span className="text-[10px] text-slate-500 block">Conclusão Média</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {mediaConclusaoFiltrada}%
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-500 block">Atestados Emitidos</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-[#12B886]">
                  {totalAtestadosFiltrados.toLocaleString('pt-BR')}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* TABELA / RELATÓRIO ESTRATIFICADO POR ESCOLA */}
        <div className="bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-[rgba(244,247,250,0.1)] rounded-2xl shadow-xl overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-[rgba(244,247,250,0.08)] flex items-center justify-between">
            <h3 className="font-heading font-bold text-sm sm:text-base text-slate-900 dark:text-[#F4F7FA]">
              Relatório Estratificado por Unidade Escolar
            </h3>
            <span className="text-xs text-slate-500 dark:text-[#93A3B5]">
              {escolasFiltradas.length} unidade(s) listada(s)
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-[#0A1220] text-slate-600 dark:text-[#93A3B5] uppercase font-semibold border-b border-slate-200 dark:border-[rgba(244,247,250,0.08)]">
                <tr>
                  <th className="py-3 px-4">Instituição de Ensino</th>
                  <th className="py-3 px-3">Município / UF</th>
                  <th className="py-3 px-3">Rede / Modalidade</th>
                  <th className="py-3 px-3 text-right">Total Alunos</th>
                  <th className="py-3 px-3 text-right">Alcançados</th>
                  <th className="py-3 px-3 text-center">% Conclusão</th>
                  <th className="py-3 px-4 text-right">Atestados</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[rgba(244,247,250,0.06)]">
                {escolasFiltradas.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">
                      Nenhuma escola encontrada para os filtros selecionados.
                    </td>
                  </tr>
                ) : (
                  escolasFiltradas.map((esc) => (
                    <tr
                      key={esc.escolaId}
                      className="hover:bg-slate-50/80 dark:hover:bg-[#111C2E] transition-colors"
                    >
                      <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">
                        {esc.nomeEscola}
                      </td>
                      <td className="py-3.5 px-3 text-slate-600 dark:text-[#93A3B5]">
                        {esc.municipio} / {esc.uf}
                      </td>
                      <td className="py-3.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            esc.rede === 'municipal'
                              ? 'bg-emerald-500/10 text-emerald-700 dark:text-[#12B886]'
                              : esc.rede === 'estadual'
                                ? 'bg-blue-500/10 text-blue-700 dark:text-blue-400'
                                : 'bg-purple-500/10 text-purple-700 dark:text-purple-400'
                          }`}
                        >
                          {esc.rede}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono text-slate-700 dark:text-[#CBD5E1]">
                        {esc.totalAlunos.toLocaleString('pt-BR')}
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono text-emerald-700 dark:text-[#12B886] font-semibold">
                        {esc.alunosAlcancados.toLocaleString('pt-BR')}
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-16 h-1.5 rounded-full bg-slate-200 dark:bg-[#0A1220] overflow-hidden">
                            <div
                              className="h-full bg-emerald-500"
                              style={{ width: `${esc.percentualConclusaoTrilha}%` }}
                            />
                          </div>
                          <span className="font-mono text-[11px] font-semibold">
                            {esc.percentualConclusaoTrilha}%
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                        {esc.atestadosEmitidos.toLocaleString('pt-BR')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
