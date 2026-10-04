import React, { useState, useEffect } from 'react'
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Printer,
  ChevronDown,
  ChevronUp,
  FileText,
  Search,
  ExternalLink,
  Layers,
  Database,
  Lock,
} from 'lucide-react'
import {
  executarAuditoriaIntegridade,
  imprimirLaudoIntegridadeHtml,
  LaudoIntegridadeResultado,
  ItemAuditoria,
} from '@/services/auditoriaIntegridadeService'
import { useAuth } from '@/contexts/AuthContext'

export function ConsoleAuditoriaIntegridadeTab() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [resultado, setResultado] = useState<LaudoIntegridadeResultado | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({})
  const [filtroStatus, setFiltroStatus] = useState<'todos' | 'alerta' | 'ok'>('todos')
  const [buscaTexto, setBuscaTexto] = useState('')

  const rodarAuditoria = async () => {
    setLoading(true)
    setErro(null)
    try {
      const res = await executarAuditoriaIntegridade(
        user?.email || user?.name || 'auditor@orbis-protocol.com',
      )
      setResultado(res)
      // Auto-expandir itens com alerta
      const exp: Record<string, boolean> = {}
      Object.values(res.itens).forEach((item) => {
        if (item.status === 'alerta') exp[item.id] = true
      })
      setExpandedItems(exp)
    } catch (err: any) {
      console.error('Erro ao executar auditoria de integridade:', err)
      setErro(err?.message || 'Falha ao executar rotina de auditoria no banco.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    rodarAuditoria()
  }, [])

  const toggleExpand = (id: string) => {
    setExpandedItems((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const itensLista = resultado ? Object.values(resultado.itens) : []

  const itensFiltrados = itensLista.filter((item) => {
    if (filtroStatus === 'alerta' && item.status !== 'alerta') return false
    if (filtroStatus === 'ok' && item.status !== 'ok') return false
    if (buscaTexto.trim()) {
      const q = buscaTexto.toLowerCase()
      const matchTitulo = item.titulo.toLowerCase().includes(q)
      const matchDesc = item.descricao.toLowerCase().includes(q)
      const matchReg = item.registrosAfetados.some(
        (r) => r.identificador.toLowerCase().includes(q) || r.detalhes.toLowerCase().includes(q),
      )
      return matchTitulo || matchDesc || matchReg
    }
    return true
  })

  return (
    <div className="space-y-6 animate-fade-in" data-testid="console-auditoria-integridade-tab">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-[#12B886]" />
            <h2 className="font-heading font-black text-xl text-slate-900 dark:text-[#F4F7FA] tracking-tight">
              Auditoria de Integridade & Higiene dMRV
            </h2>
          </div>
          <p className="text-xs text-slate-600 dark:text-[#93A3B5] max-w-3xl leading-relaxed">
            Varredura pericial automatizada sobre os dados reais da base (cdv_lotes, cdv_pecas,
            emissoes_inventario e selos). Reconciliação matemática exata, consistência de fatores de
            emissão, custódia probatória e detecção de anomalias higiênicas.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            data-testid="btn-executar-auditoria"
            onClick={rodarAuditoria}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-[#0E1A2E] border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-[#F4F7FA] hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-[#12B886] transition-colors shadow-sm disabled:opacity-50"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-600' : ''}`}
            />
            <span>{loading ? 'Auditando...' : 'Reexecutar Verificações'}</span>
          </button>

          {resultado && (
            <button
              type="button"
              data-testid="btn-imprimir-laudo-integridade"
              onClick={() => imprimirLaudoIntegridadeHtml(resultado)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#12B886] text-[#0A0E12] font-bold text-xs shadow-emerald-glow hover:bg-emerald-500 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir Laudo Pericial</span>
            </button>
          )}
        </div>
      </div>

      {erro && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{erro}</span>
        </div>
      )}

      {/* KPI Cards do Laudo */}
      {resultado && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-slate-800 shadow-sm">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-[#93A3B5] block">
              Testes Executados
            </span>
            <span className="font-heading font-black text-2xl text-slate-900 dark:text-[#F4F7FA] block mt-1">
              {resultado.totalVerificacoes}
            </span>
            <span className="text-[10px] text-slate-500 dark:text-[#93A3B5] block mt-0.5">
              4 blocos periciais de conformidade
            </span>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-slate-800 shadow-sm">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-[#93A3B5] block">
              Apontamentos / Alertas
            </span>
            <span
              className={`font-heading font-black text-2xl block mt-1 ${
                resultado.totalAlertas === 0
                  ? 'text-emerald-600 dark:text-[#12B886]'
                  : 'text-amber-600 dark:text-amber-400'
              }`}
            >
              {resultado.totalAlertas}
            </span>
            <span className="text-[10px] text-slate-500 dark:text-[#93A3B5] block mt-0.5">
              {resultado.totalAlertas === 0
                ? 'Base em total conformidade'
                : 'Requer saneamento / revisão'}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-slate-800 shadow-sm">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-[#93A3B5] block">
              Conformes (OK)
            </span>
            <span className="font-heading font-black text-2xl text-emerald-600 dark:text-[#12B886] block mt-1">
              {resultado.totalVerificacoes - resultado.totalAlertas}
            </span>
            <span className="text-[10px] text-slate-500 dark:text-[#93A3B5] block mt-0.5">
              Verificações íntegras
            </span>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-slate-800 shadow-sm">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-[#93A3B5] block">
              Última Execução
            </span>
            <span className="font-mono text-xs font-bold text-slate-900 dark:text-[#F4F7FA] block mt-2">
              {new Date(resultado.geradoEmIso).toLocaleTimeString('pt-BR')}
            </span>
            <span className="text-[10px] text-slate-500 dark:text-[#93A3B5] block mt-0.5">
              {new Date(resultado.geradoEmIso).toLocaleDateString('pt-BR')}
            </span>
          </div>
        </div>
      )}

      {/* Barra de Filtros e Pesquisa */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-xl bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar verificação ou registro..."
              value={buscaTexto}
              onChange={(e) => setBuscaTexto(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-50 dark:bg-[#111820] border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-[#F4F7FA] focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center gap-1 bg-slate-100 dark:bg-[#111820] p-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
            <button
              type="button"
              onClick={() => setFiltroStatus('todos')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                filtroStatus === 'todos'
                  ? 'bg-white dark:bg-[#1A2638] text-slate-900 dark:text-[#F4F7FA] shadow-xs'
                  : 'text-slate-600 dark:text-[#93A3B5]'
              }`}
            >
              Todos ({itensLista.length})
            </button>
            <button
              type="button"
              onClick={() => setFiltroStatus('alerta')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                filtroStatus === 'alerta'
                  ? 'bg-amber-500/20 text-amber-700 dark:text-amber-400 shadow-xs'
                  : 'text-slate-600 dark:text-[#93A3B5]'
              }`}
            >
              Alertas ({itensLista.filter((i) => i.status === 'alerta').length})
            </button>
            <button
              type="button"
              onClick={() => setFiltroStatus('ok')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                filtroStatus === 'ok'
                  ? 'bg-emerald-500/20 text-emerald-700 dark:text-[#12B886] shadow-xs'
                  : 'text-slate-600 dark:text-[#93A3B5]'
              }`}
            >
              OK ({itensLista.filter((i) => i.status === 'ok').length})
            </button>
          </div>
        </div>

        <div className="text-[11px] text-slate-500 dark:text-[#93A3B5] font-mono">
          Escopo: Base conectada PocketBase (Lotes, Peças, Inventários, Selos)
        </div>
      </div>

      {/* Lista de Verificações com Drill-Down */}
      <div className="space-y-3">
        {loading && !resultado && (
          <div className="p-12 text-center text-xs text-slate-500 dark:text-[#93A3B5] space-y-2">
            <RefreshCw className="w-6 h-6 animate-spin text-emerald-600 mx-auto" />
            <p>Executando varredura pericial de integridade sobre a base de dados...</p>
          </div>
        )}

        {itensFiltrados.map((item) => {
          const isExp = expandedItems[item.id]
          const isAlerta = item.status === 'alerta'
          const temAfetados = item.registrosAfetados.length > 0

          return (
            <div
              key={item.id}
              data-testid={`auditoria-item-${item.id}`}
              className={`rounded-2xl border transition-all overflow-hidden bg-white dark:bg-[#0E1A2E] ${
                isAlerta
                  ? 'border-amber-300 dark:border-amber-500/40 shadow-xs'
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              {/* Topo do Card */}
              <div
                onClick={() => toggleExpand(item.id)}
                className="p-4 sm:p-5 flex items-start sm:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-[#111820]/50 transition-colors"
              >
                <div className="flex items-start sm:items-center gap-3">
                  <div
                    className={`p-2 rounded-xl shrink-0 ${
                      isAlerta
                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                        : 'bg-emerald-500/10 text-emerald-600 dark:text-[#12B886]'
                    }`}
                  >
                    {isAlerta ? (
                      <AlertTriangle className="w-5 h-5" />
                    ) : (
                      <CheckCircle2 className="w-5 h-5" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-[#F4F7FA]">
                        {item.titulo}
                      </h3>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-full uppercase font-bold border ${
                          isAlerta
                            ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-400/30'
                            : 'bg-emerald-500/10 text-emerald-700 dark:text-[#12B886] border-emerald-400/30'
                        }`}
                      >
                        {isAlerta ? `ALERTA (${item.totalInconformidades})` : 'CONFORME (OK)'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-[#93A3B5] mt-0.5 leading-relaxed">
                      {item.descricao}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right hidden sm:block">
                    <span className="text-xs font-mono font-bold text-slate-900 dark:text-[#F4F7FA] block">
                      {item.totalVerificados} registros
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-[#93A3B5]">
                      {item.totalInconformidades > 0
                        ? `${item.totalInconformidades} divergência(s)`
                        : '0 divergências'}
                    </span>
                  </div>

                  <button
                    type="button"
                    aria-label="Expandir ou recolher verificação"
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
                  >
                    {isExp ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Drill-down de registros afetados */}
              {isExp && (
                <div className="border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#0A1628]/60 p-4 sm:p-5 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold uppercase tracking-wider text-slate-500 dark:text-[#93A3B5] text-[10px]">
                      {temAfetados
                        ? `Registros com Apontamento (${item.registrosAfetados.length})`
                        : 'Nenhum registro inconforme identificado'}
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      Total auditado: {item.totalVerificados} registros
                    </span>
                  </div>

                  {temAfetados ? (
                    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0E1A2E]">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-100 dark:bg-[#111820] text-slate-600 dark:text-[#93A3B5] uppercase text-[10px] border-b border-slate-200 dark:border-slate-800">
                          <tr>
                            <th className="p-3 font-semibold">Identificador / Documento</th>
                            <th className="p-3 font-semibold">Detalhes do Apontamento</th>
                            <th className="p-3 font-semibold">Valor Esperado</th>
                            <th className="p-3 font-semibold">Valor Encontrado</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-mono text-[11px]">
                          {item.registrosAfetados.map((reg, idx) => (
                            <tr
                              key={`${reg.id}-${idx}`}
                              className="hover:bg-slate-50 dark:hover:bg-[#111820]/50 transition-colors"
                            >
                              <td className="p-3 font-bold text-slate-900 dark:text-[#F4F7FA]">
                                {reg.identificador}
                                <span className="text-[9px] text-slate-400 block font-normal">
                                  ID: {reg.id}
                                </span>
                              </td>
                              <td className="p-3 text-slate-700 dark:text-[#93A3B5] font-sans">
                                {reg.detalhes}
                              </td>
                              <td className="p-3 text-emerald-700 dark:text-[#12B886]">
                                {reg.valorEsperado ?? '-'}
                              </td>
                              <td className="p-3 text-amber-700 dark:text-amber-400 font-bold">
                                {reg.valorEncontrado ?? '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-xs text-emerald-700 dark:text-[#12B886] flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>
                        Todos os registros auditados atendem estritamente aos critérios desta
                        verificação.
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}

        {itensFiltrados.length === 0 && (
          <div className="p-8 text-center text-xs text-slate-500 dark:text-[#93A3B5] bg-white dark:bg-[#0E1A2E] rounded-xl border border-slate-200 dark:border-slate-800">
            Nenhuma verificação encontrada para os filtros aplicados.
          </div>
        )}
      </div>

      {/* Rodapé institucional */}
      <div className="p-4 rounded-xl bg-slate-100 dark:bg-[#0E1A2E] border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-[#93A3B5] leading-relaxed flex items-start gap-3">
        <Lock className="w-4 h-4 text-emerald-600 dark:text-[#12B886] shrink-0 mt-0.5" />
        <div>
          <strong className="text-slate-900 dark:text-[#F4F7FA] block font-heading">
            Aviso Legal e de Limitação de Escopo Pericial:
          </strong>
          Este módulo constitui ferramenta pericial de controle interno contínuo da plataforma Orbis
          Protocol. Ele assegura a inviolabilidade da cadeia de custódia, o balanço de massa dos
          lotes e a higiene cadastral dMRV. O laudo é emitido para governança da administração do
          sistema, sem substituir ou dispensar auditorias externas independentes de terceira parte
          (VVB) quando exigidas por órgãos reguladores.
        </div>
      </div>
    </div>
  )
}
