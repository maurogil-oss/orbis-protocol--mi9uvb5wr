import React, { useState, useEffect } from 'react'
import {
  CdvHonorarioRecord,
  TipoPerito,
  listarTodosHonorariosAdmin,
  criarHonorario,
  encerrarVigenciaHonorario,
  atualizarValorHonorarioComHistorico,
} from '@/services/honorariosService'
import { useAuth } from '@/contexts/AuthContext'
import {
  DollarSign,
  Plus,
  RefreshCw,
  TrendingUp,
  History,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Filter,
} from 'lucide-react'

interface ConsoleHonorariosTabProps {
  isReadOnly?: boolean
}

export const ConsoleHonorariosTab: React.FC<ConsoleHonorariosTabProps> = ({ isReadOnly }) => {
  const { user } = useAuth()
  const [honorarios, setHonorarios] = useState<CdvHonorarioRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [filtroTipoPerito, setFiltroTipoPerito] = useState<string>('todos')
  const [filtroStatus, setFiltroStatus] = useState<string>('todos')
  const [feedback, setFeedback] = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(null)

  // Modal Novo Honorário
  const [modalNovo, setModalNovo] = useState(false)
  const [novoForm, setNovoForm] = useState({
    tipo_perito: 'CREA' as TipoPerito,
    tipo_laudo: 'atestado_orbis_verificacao',
    titulo_laudo: '',
    valor_base: 1000,
    unidade: 'por laudo',
    vigencia_inicio: new Date().toISOString().slice(0, 10),
    observacoes: '',
  })
  const [salvandoNovo, setSalvandoNovo] = useState(false)

  // Modal Ajuste de Mercado (Preservando Histórico)
  const [modalAjuste, setModalAjuste] = useState<{
    aberto: boolean
    registro: CdvHonorarioRecord | null
    novoValor: number
    novaDataInicio: string
    novasObservacoes: string
  }>({
    aberto: false,
    registro: null,
    novoValor: 0,
    novaDataInicio: new Date().toISOString().slice(0, 10),
    novasObservacoes: '',
  })
  const [salvandoAjuste, setSalvandoAjuste] = useState(false)

  const exibirFeedback = (tipo: 'ok' | 'erro', texto: string) => {
    setFeedback({ tipo, texto })
    setTimeout(() => setFeedback(null), 5000)
  }

  const carregarDados = async () => {
    setLoading(true)
    try {
      const lista = await listarTodosHonorariosAdmin()
      setHonorarios(lista)
    } catch (err: any) {
      console.error(err)
      exibirFeedback('erro', 'Falha ao carregar honorários: ' + (err?.message || ''))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregarDados()
  }, [])

  const handleCriarHonorario = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!novoForm.titulo_laudo.trim()) {
      alert('Informe o título do laudo ou atestado.')
      return
    }
    if (novoForm.valor_base <= 0) {
      alert('O valor base deve ser maior que zero.')
      return
    }

    setSalvandoNovo(true)
    try {
      await criarHonorario({
        tipo_perito: novoForm.tipo_perito,
        tipo_laudo: novoForm.tipo_laudo,
        titulo_laudo: novoForm.titulo_laudo,
        valor_base: Number(novoForm.valor_base),
        unidade: novoForm.unidade,
        vigencia_inicio: novoForm.vigencia_inicio,
        ativo: true,
        observacoes: novoForm.observacoes,
      })

      exibirFeedback('ok', 'Tabela de honorário cadastrada com sucesso!')
      setModalNovo(false)
      setNovoForm({
        tipo_perito: 'CREA',
        tipo_laudo: 'atestado_orbis_verificacao',
        titulo_laudo: '',
        valor_base: 1000,
        unidade: 'por laudo',
        vigencia_inicio: new Date().toISOString().slice(0, 10),
        observacoes: '',
      })
      await carregarDados()
    } catch (err: any) {
      exibirFeedback('erro', 'Erro ao criar honorário: ' + (err?.message || ''))
    } finally {
      setSalvandoNovo(false)
    }
  }

  const handleEncerrarVigencia = async (hon: CdvHonorarioRecord) => {
    const dataFim = prompt(
      `Confirma encerrar a vigência deste honorário (R$ ${hon.valor_base.toFixed(2)} - ${hon.tipo_perito})?\nInforme a data final de vigência (AAAA-MM-DD):`,
      new Date().toISOString().slice(0, 10),
    )
    if (!dataFim) return

    try {
      await encerrarVigenciaHonorario(hon.id, dataFim)
      exibirFeedback('ok', 'Vigência encerrada sem exclusão de histórico.')
      await carregarDados()
    } catch (err: any) {
      exibirFeedback('erro', 'Falha ao encerrar vigência: ' + (err?.message || ''))
    }
  }

  const abrirModalAjuste = (hon: CdvHonorarioRecord) => {
    setModalAjuste({
      aberto: true,
      registro: hon,
      novoValor: hon.valor_base,
      novaDataInicio: new Date().toISOString().slice(0, 10),
      novasObservacoes: `Ajuste de mercado alinhado com cotações vigentes (anterior: R$ ${hon.valor_base.toFixed(2)}).`,
    })
  }

  const handleSalvarAjusteMercado = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!modalAjuste.registro) return
    if (modalAjuste.novoValor <= 0) {
      alert('O novo valor deve ser superior a zero.')
      return
    }

    setSalvandoAjuste(true)
    try {
      await atualizarValorHonorarioComHistorico({
        registroAnteriorId: modalAjuste.registro.id,
        novoValorBase: Number(modalAjuste.novoValor),
        novaDataVigenciaInicio: modalAjuste.novaDataInicio,
        novasObservacoes: modalAjuste.novasObservacoes,
      })

      exibirFeedback(
        'ok',
        `Honorário ajustado conforme o mercado com sucesso! O registro anterior foi encerrado e o novo valor vigora desde ${modalAjuste.novaDataInicio}.`,
      )
      setModalAjuste({
        aberto: false,
        registro: null,
        novoValor: 0,
        novaDataInicio: new Date().toISOString().slice(0, 10),
        novasObservacoes: '',
      })
      await carregarDados()
    } catch (err: any) {
      exibirFeedback('erro', 'Erro ao salvar ajuste de mercado: ' + (err?.message || ''))
    } finally {
      setSalvandoAjuste(false)
    }
  }

  const honorariosFiltrados = honorarios.filter((h) => {
    const matchTipo = filtroTipoPerito === 'todos' || h.tipo_perito === filtroTipoPerito
    const matchStatus =
      filtroStatus === 'todos' ||
      (filtroStatus === 'vigente' && h.ativo) ||
      (filtroStatus === 'encerrado' && !h.ativo)
    return matchTipo && matchStatus
  })

  const totalAtivos = honorarios.filter((h) => h.ativo).length
  const totalEncerrados = honorarios.filter((h) => !h.ativo).length

  return (
    <div className="space-y-6">
      {/* Header & Ações */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-white dark:bg-[#111820] border border-slate-200 dark:border-[rgba(244,247,250,0.1)] shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-[#12B886]/10 text-emerald-800 dark:text-[#12B886] border border-emerald-300 dark:border-[#12B886]/30 text-[10px] font-mono uppercase font-bold tracking-wider">
              GESTÃO DE HONORÁRIOS DE PERITOS • MODELO DINÂMICO DE MERCADO
            </span>
          </div>
          <h2 className="font-heading font-black text-xl text-slate-900 dark:text-[#F4F7FA]">
            Tabela Configurável de Honorários Periciais
          </h2>
          <p className="text-xs text-slate-600 dark:text-[#93A3B5] mt-1 max-w-2xl">
            Ajuste os valores pagos aos peritos credenciados conforme a demanda do mercado e a
            categoria profissional (CREA, CAU, CFT, CRC, CRQ). Histórico de vigência 100% preservado
            sem perda de registros anteriores.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={carregarDados}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-[#0A0E12] border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-[#93A3B5] hover:text-slate-900 dark:hover:text-[#F4F7FA] transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#12B886]' : ''}`} />
            <span>Atualizar</span>
          </button>

          {!isReadOnly && (
            <button
              type="button"
              onClick={() => setModalNovo(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#12B886] text-[#0A0E12] font-bold text-xs shadow-emerald-glow hover:bg-[#0ca678] transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Registro de Honorário</span>
            </button>
          )}
        </div>
      </div>

      {/* Feedback banner */}
      {feedback && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center justify-between border ${
            feedback.tipo === 'ok'
              ? 'bg-emerald-50 dark:bg-[#12B886]/10 border-emerald-300 dark:border-[#12B886] text-emerald-800 dark:text-[#12B886]'
              : 'bg-red-500/10 border-red-500 text-red-500'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.tipo === 'ok' ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <AlertTriangle className="w-4 h-4" />
            )}
            <span>{feedback.texto}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="underline font-bold text-xs">
            fechar
          </button>
        </div>
      )}

      {/* KPI Cards de Honorários */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-[#111820] border border-slate-200 dark:border-[rgba(244,247,250,0.1)] shadow-sm">
          <span className="text-[10px] text-slate-500 dark:text-[#93A3B5] uppercase block">
            Honorários Vigentes Ativos
          </span>
          <span className="font-heading font-black text-2xl text-[#12B886]">{totalAtivos}</span>
          <span className="text-[10px] text-slate-500 dark:text-[#93A3B5] block mt-0.5">
            disponíveis para peritos na trilha pública
          </span>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#111820] border border-slate-200 dark:border-[rgba(244,247,250,0.1)] shadow-sm">
          <span className="text-[10px] text-slate-500 dark:text-[#93A3B5] uppercase block">
            Histórico de Vigências Encerradas
          </span>
          <span className="font-heading font-black text-2xl text-amber-700 dark:text-[#D9B36C]">
            {totalEncerrados}
          </span>
          <span className="text-[10px] text-slate-500 dark:text-[#93A3B5] block mt-0.5">
            valores anteriores preservados
          </span>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#111820] border border-slate-200 dark:border-[rgba(244,247,250,0.1)] shadow-sm">
          <span className="text-[10px] text-slate-500 dark:text-[#93A3B5] uppercase block">
            Conselhos Cobertos na Matriz
          </span>
          <span className="font-heading font-black text-2xl text-blue-600 dark:text-[#3B82F6]">
            {new Set(honorarios.map((h) => h.tipo_perito)).size}
          </span>
          <span className="text-[10px] text-slate-500 dark:text-[#93A3B5] block mt-0.5">
            CREA, CAU, CFT, CRC, CRQ
          </span>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="p-4 rounded-xl bg-white dark:bg-[#111820] border border-slate-200 dark:border-[rgba(244,247,250,0.1)] flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 text-slate-600 dark:text-[#93A3B5]">
            <Filter className="w-3.5 h-3.5" />
            <span className="font-bold">Filtrar:</span>
          </div>

          <select
            value={filtroTipoPerito}
            onChange={(e) => setFiltroTipoPerito(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-[#0A0E12] border border-slate-200 dark:border-[rgba(244,247,250,0.15)] text-slate-900 dark:text-[#F4F7FA]"
          >
            <option value="todos">Todos os Conselhos (CREA, CAU, CFT...)</option>
            <option value="CREA">CREA (Engenharia)</option>
            <option value="CAU">CAU (Arquitetura)</option>
            <option value="CFT">CFT (Técnicos Industriais)</option>
            <option value="CRC">CRC (Contabilidade)</option>
            <option value="CRQ">CRQ (Química)</option>
            <option value="CRBio">CRBio (Biologia)</option>
            <option value="OUTRO">Outros</option>
          </select>

          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-[#0A0E12] border border-slate-200 dark:border-[rgba(244,247,250,0.15)] text-slate-900 dark:text-[#F4F7FA]"
          >
            <option value="todos">Todos os Status</option>
            <option value="vigente">Vigente Ativo</option>
            <option value="encerrado">Vigência Encerrada (Histórico)</option>
          </select>
        </div>

        <span className="text-[11px] text-slate-500 dark:text-[#93A3B5]">
          Mostrando {honorariosFiltrados.length} de {honorarios.length} registros
        </span>
      </div>

      {/* Tabela de Honorários */}
      <div className="rounded-2xl bg-white dark:bg-[#111820] border border-slate-200 dark:border-[rgba(244,247,250,0.1)] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 dark:bg-[#0D1217] text-slate-600 dark:text-[#93A3B5] uppercase text-[10px] border-b border-slate-200 dark:border-[rgba(244,247,250,0.08)]">
              <tr>
                <th className="p-3.5">Conselho / Tipo</th>
                <th className="p-3.5">Tipo de Laudo & Descrição</th>
                <th className="p-3.5">Valor Base (BRL)</th>
                <th className="p-3.5">Unidade</th>
                <th className="p-3.5">Vigência</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Ações de Gestão</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[rgba(244,247,250,0.05)]">
              {honorariosFiltrados.map((hon) => (
                <tr
                  key={hon.id}
                  className="hover:bg-slate-50 dark:hover:bg-[#16202B]/50 transition-colors"
                >
                  <td className="p-3.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-blue-50 dark:bg-[#3B82F6]/20 text-blue-700 dark:text-[#3B82F6] border border-blue-200 dark:border-[#3B82F6]/30">
                      {hon.tipo_perito}
                    </span>
                  </td>
                  <td className="p-3.5 max-w-md">
                    <strong className="text-slate-900 dark:text-[#F4F7FA] block text-xs">
                      {hon.titulo_laudo}
                    </strong>
                    <span className="text-[10px] text-slate-500 dark:text-[#93A3B5] font-mono block">
                      Código: {hon.tipo_laudo}
                    </span>
                    {hon.observacoes && (
                      <p className="text-[11px] text-slate-600 dark:text-[#93A3B5] mt-1 leading-snug italic">
                        {hon.observacoes}
                      </p>
                    )}
                  </td>
                  <td className="p-3.5">
                    <span className="font-heading font-black text-sm text-[#12B886]">
                      R${' '}
                      {Number(hon.valor_base).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </td>
                  <td className="p-3.5 text-slate-600 dark:text-[#93A3B5] font-mono">
                    {hon.unidade}
                  </td>
                  <td className="p-3.5 text-[11px] font-mono">
                    <span className="text-slate-700 dark:text-[#F4F7FA] block">
                      De: {hon.vigencia_inicio}
                    </span>
                    {hon.vigencia_fim ? (
                      <span className="text-slate-500 dark:text-[#93A3B5]">
                        Até: {hon.vigencia_fim}
                      </span>
                    ) : (
                      <span className="text-[#12B886] font-semibold">Atual (indeterminado)</span>
                    )}
                  </td>
                  <td className="p-3.5">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        hon.ativo
                          ? 'bg-[#12B886]/20 text-[#12B886]'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {hon.ativo ? 'Vigente' : 'Encerrado'}
                    </span>
                  </td>
                  <td className="p-3.5 text-right space-x-2 whitespace-nowrap">
                    {!isReadOnly && hon.ativo && (
                      <>
                        <button
                          type="button"
                          onClick={() => abrirModalAjuste(hon)}
                          className="px-2.5 py-1 rounded bg-[#12B886]/10 hover:bg-[#12B886] text-[#12B886] hover:text-[#0A0E12] font-semibold text-[11px] border border-[#12B886]/30 transition-colors inline-flex items-center gap-1"
                          title="Ajustar valor conforme mercado mantendo o histórico de vigência"
                        >
                          <TrendingUp className="w-3 h-3" />
                          <span>Ajustar Mercado</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEncerrarVigencia(hon)}
                          className="px-2.5 py-1 rounded bg-amber-50 dark:bg-[#D9B36C]/10 text-amber-700 dark:text-[#D9B36C] hover:bg-amber-100 dark:hover:bg-[#D9B36C]/20 border border-amber-300 dark:border-[#D9B36C]/30 text-[11px] transition-colors"
                        >
                          Encerrar Vigência
                        </button>
                      </>
                    )}
                    {!hon.ativo && (
                      <span className="text-[10px] text-slate-500 dark:text-[#93A3B5] italic">
                        Histórico arquivado
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {honorariosFiltrados.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="p-8 text-center text-xs text-slate-500 dark:text-[#93A3B5]"
                  >
                    Nenhum honorário encontrado neste filtro.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: CADASTRAR NOVO HONORÁRIO */}
      {modalNovo && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#111820] border border-slate-200 dark:border-[rgba(244,247,250,0.1)] rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="font-heading font-black text-lg text-slate-900 dark:text-[#F4F7FA]">
                Cadastrar Novo Honorário Pericial
              </h3>
              <button
                type="button"
                onClick={() => setModalNovo(false)}
                className="text-slate-400 hover:text-slate-200 text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCriarHonorario} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-[#93A3B5] mb-1 font-bold">
                    Conselho Profissional *
                  </label>
                  <select
                    value={novoForm.tipo_perito}
                    onChange={(e) =>
                      setNovoForm({ ...novoForm, tipo_perito: e.target.value as TipoPerito })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#0A0E12] border border-slate-300 dark:border-[rgba(244,247,250,0.15)] text-slate-900 dark:text-[#F4F7FA]"
                  >
                    <option value="CREA">CREA (Engenharia)</option>
                    <option value="CAU">CAU (Arquitetura)</option>
                    <option value="CFT">CFT (Técnicos Industriais)</option>
                    <option value="CRC">CRC (Contabilidade)</option>
                    <option value="CRQ">CRQ (Química)</option>
                    <option value="CRBio">CRBio (Biologia)</option>
                    <option value="OUTRO">Outro Conselho</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-[#93A3B5] mb-1 font-bold">
                    Tipo Técnico do Laudo *
                  </label>
                  <select
                    value={novoForm.tipo_laudo}
                    onChange={(e) => setNovoForm({ ...novoForm, tipo_laudo: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#0A0E12] border border-slate-300 dark:border-[rgba(244,247,250,0.15)] text-slate-900 dark:text-[#F4F7FA]"
                  >
                    <option value="laudo_lote_cdverde">Laudo de Lote CDVerde</option>
                    <option value="atestado_orbis_verificacao">Atestado Orbis (com ART/RRT)</option>
                    <option value="auditoria_f6_reproducao">
                      Auditoria F6 (Reprodução de Cálculo)
                    </option>
                    <option value="parecer_sbce">Parecer SBCE & Finanças Verdes</option>
                    <option value="inventario_ghg_dmrv">Inventário GHG / dMRV</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-[#93A3B5] mb-1 font-bold">
                  Título Descritivo do Laudo / Atestado *
                </label>
                <input
                  type="text"
                  required
                  value={novoForm.titulo_laudo}
                  onChange={(e) => setNovoForm({ ...novoForm, titulo_laudo: e.target.value })}
                  placeholder="Ex: Atestado Orbis (com ART/RRT) — Verificação dMRV e Conformidade"
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#0A0E12] border border-slate-300 dark:border-[rgba(244,247,250,0.15)] text-slate-900 dark:text-[#F4F7FA]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-[#93A3B5] mb-1 font-bold">
                    Valor Base (R$ BRL) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    value={novoForm.valor_base}
                    onChange={(e) =>
                      setNovoForm({ ...novoForm, valor_base: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#0A0E12] border border-slate-300 dark:border-[rgba(244,247,250,0.15)] text-slate-900 dark:text-[#F4F7FA] font-bold text-[#12B886]"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-[#93A3B5] mb-1 font-bold">
                    Unidade de Cobrança *
                  </label>
                  <input
                    type="text"
                    required
                    value={novoForm.unidade}
                    onChange={(e) => setNovoForm({ ...novoForm, unidade: e.target.value })}
                    placeholder="por laudo, por lote, por hora..."
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#0A0E12] border border-slate-300 dark:border-[rgba(244,247,250,0.15)] text-slate-900 dark:text-[#F4F7FA]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-[#93A3B5] mb-1 font-bold">
                  Início de Vigência *
                </label>
                <input
                  type="date"
                  required
                  value={novoForm.vigencia_inicio}
                  onChange={(e) => setNovoForm({ ...novoForm, vigencia_inicio: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#0A0E12] border border-slate-300 dark:border-[rgba(244,247,250,0.15)] text-slate-900 dark:text-[#F4F7FA] font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-[#93A3B5] mb-1 font-bold">
                  Observações e Justificativa Metodológica
                </label>
                <textarea
                  rows={2}
                  value={novoForm.observacoes}
                  onChange={(e) => setNovoForm({ ...novoForm, observacoes: e.target.value })}
                  placeholder="Escopo da perícia, anotação ART/RRT e responsabilidade técnica..."
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#0A0E12] border border-slate-300 dark:border-[rgba(244,247,250,0.15)] text-slate-900 dark:text-[#F4F7FA]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalNovo(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvandoNovo}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-[#12B886] text-[#0A0E12] hover:bg-[#0ca678] transition-colors shadow-emerald-glow disabled:opacity-50"
                >
                  {salvandoNovo ? 'Salvando...' : 'Cadastrar Honorário'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: AJUSTAR VALOR CONFORME O MERCADO (COM HISTÓRICO) */}
      {modalAjuste.aberto && modalAjuste.registro && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#111820] border border-slate-200 dark:border-[rgba(244,247,250,0.1)] rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#12B886] font-mono">
                  Preservação de Histórico Append-Only
                </span>
                <h3 className="font-heading font-black text-lg text-slate-900 dark:text-[#F4F7FA]">
                  Ajustar Honorário Conforme o Mercado
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalAjuste({ ...modalAjuste, aberto: false })}
                className="text-slate-400 hover:text-slate-200 text-sm"
              >
                ✕
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0A0E12] border border-slate-200 dark:border-slate-800 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-[#93A3B5]">Laudo:</span>
                <strong className="text-slate-900 dark:text-[#F4F7FA]">
                  {modalAjuste.registro.titulo_laudo}
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-[#93A3B5]">Conselho / Tipo Perito:</span>
                <span className="font-mono text-blue-600 dark:text-[#3B82F6] font-bold">
                  {modalAjuste.registro.tipo_perito}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-[#93A3B5]">Valor Base Atual:</span>
                <span className="font-heading font-black text-amber-700 dark:text-[#D9B36C]">
                  R${' '}
                  {Number(modalAjuste.registro.valor_base).toLocaleString('pt-BR', {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-[#93A3B5]">Vigência Atual Desde:</span>
                <span className="font-mono text-slate-700 dark:text-[#F4F7FA]">
                  {modalAjuste.registro.vigencia_inicio}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-blue-50 dark:bg-[#3B82F6]/10 border border-blue-200 dark:border-[#3B82F6]/30 text-[11px] text-blue-900 dark:text-[#3B82F6] leading-relaxed">
              <strong>Como funciona o modelo de ajuste:</strong> O registro atual será encerrado com
              vigência até a data informada abaixo, e um novo registro será aberto com o novo valor.
              Nenhum dado é apagado — laudos passados mantêm o valor histórico intacto.
            </div>

            <form onSubmit={handleSalvarAjusteMercado} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-[#93A3B5] mb-1 font-bold">
                  Novo Valor de Mercado (R$ BRL) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  required
                  value={modalAjuste.novoValor}
                  onChange={(e) =>
                    setModalAjuste({
                      ...modalAjuste,
                      novoValor: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#0A0E12] border border-slate-300 dark:border-[rgba(244,247,250,0.15)] text-slate-900 dark:text-[#F4F7FA] font-bold text-base text-[#12B886]"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-[#93A3B5] mb-1 font-bold">
                  Data de Início da Nova Vigência *
                </label>
                <input
                  type="date"
                  required
                  value={modalAjuste.novaDataInicio}
                  onChange={(e) =>
                    setModalAjuste({
                      ...modalAjuste,
                      novaDataInicio: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#0A0E12] border border-slate-300 dark:border-[rgba(244,247,250,0.15)] text-slate-900 dark:text-[#F4F7FA] font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-[#93A3B5] mb-1 font-bold">
                  Motivo do Ajuste / Nota de Governança
                </label>
                <textarea
                  rows={2}
                  value={modalAjuste.novasObservacoes}
                  onChange={(e) =>
                    setModalAjuste({
                      ...modalAjuste,
                      novasObservacoes: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-[#0A0E12] border border-slate-300 dark:border-[rgba(244,247,250,0.15)] text-slate-900 dark:text-[#F4F7FA]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalAjuste({ ...modalAjuste, aberto: false })}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvandoAjuste}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-[#12B886] text-[#0A0E12] hover:bg-[#0ca678] transition-colors shadow-emerald-glow disabled:opacity-50"
                >
                  {salvandoAjuste ? 'Processando Ajuste...' : 'Aplicar Ajuste de Mercado'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
