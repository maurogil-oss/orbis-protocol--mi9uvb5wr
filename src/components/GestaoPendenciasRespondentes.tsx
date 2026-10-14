import React, { useState, useEffect } from 'react'
import {
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  FileCheck,
  Mail,
  User,
  ShieldCheck,
  XCircle,
  RotateCcw,
  Sparkles,
  ChevronRight,
  Filter,
} from 'lucide-react'
import {
  listarPendenciasDoLote,
  criarPendenciaLote,
  resolverPendenciaLote,
  reabrirPendenciaLote,
  cancelarPendenciaLote,
  calcularResumoPendencias,
  ROTULOS_TIPOS_PENDENCIA,
  type CdvLotePendenciaRecord,
  type TipoPendenciaColeta,
  type ResumoPendenciasLote,
} from '@/services/cdvPendenciasService'
import { useAuth } from '@/contexts/AuthContext'

interface GestaoPendenciasRespondentesProps {
  loteId: string
  loteIdentificador?: string
  readOnly?: boolean
  onResumoChange?: (resumo: ResumoPendenciasLote) => void
}

export function GestaoPendenciasRespondentes({
  loteId,
  loteIdentificador,
  readOnly = false,
  onResumoChange,
}: GestaoPendenciasRespondentesProps) {
  const { user } = useAuth()
  const [pendencias, setPendencias] = useState<CdvLotePendenciaRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSalvando, setIsSalvando] = useState(false)
  const [filtroStatus, setFiltroStatus] = useState<'todas' | 'pendente' | 'preenchida'>('todas')
  const [modalNovaAberta, setModalNovaAberta] = useState(false)
  const [pendenciaParaResolver, setPendenciaParaResolver] = useState<CdvLotePendenciaRecord | null>(
    null,
  )

  // Formulário de Nova Pendência
  const [novoTitulo, setNovoTitulo] = useState('')
  const [novaDescricao, setNovaDescricao] = useState('')
  const [novoTipo, setNovoTipo] = useState<TipoPendenciaColeta>('nota_fiscal_destinador')
  const [novoRespondenteNome, setNovoRespondenteNome] = useState('')
  const [novoRespondenteEmail, setNovoRespondenteEmail] = useState('')
  const [novoRespondentePapel, setNovoRespondentePapel] = useState('Fiscal de Pátio / Operação')
  const [erroForm, setErroForm] = useState<string | null>(null)

  // Formulário de Resolução
  const [docRefResolucao, setDocRefResolucao] = useState('')
  const [obsResolucao, setObsResolucao] = useState('')
  const [erroResolucao, setErroResolucao] = useState<string | null>(null)

  const carregarPendencias = async () => {
    if (!loteId) return
    setIsLoading(true)
    try {
      const records = await listarPendenciasDoLote(loteId)
      setPendencias(records)
      const resumo = calcularResumoPendencias(records)
      onResumoChange?.(resumo)
    } catch (err: any) {
      console.warn('[GestaoPendenciasRespondentes] Falha ao carregar:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    carregarPendencias()
  }, [loteId])

  const resumo = calcularResumoPendencias(pendencias)

  const handleCriar = async (e: React.FormEvent) => {
    e.preventDefault()
    setErroForm(null)

    if (!novoTitulo.trim()) {
      setErroForm('Informe o que falta coletar.')
      return
    }
    if (!novoRespondenteNome.trim()) {
      setErroForm('Informe o nome do respondente designado.')
      return
    }
    if (!novoRespondenteEmail.trim() || !novoRespondenteEmail.includes('@')) {
      setErroForm('Informe um e-mail válido para o respondente.')
      return
    }

    setIsSalvando(true)
    try {
      await criarPendenciaLote({
        loteId,
        titulo: novoTitulo,
        descricao: novaDescricao,
        tipo_pendencia: novoTipo,
        respondente_nome: novoRespondenteNome,
        respondente_email: novoRespondenteEmail,
        respondente_papel: novoRespondentePapel,
      })

      // Reset
      setNovoTitulo('')
      setNovaDescricao('')
      setNovoRespondenteNome('')
      setNovoRespondenteEmail('')
      setModalNovaAberta(false)
      await carregarPendencias()
    } catch (err: any) {
      setErroForm(err?.message || 'Erro ao registrar pendência.')
    } finally {
      setIsSalvando(false)
    }
  }

  const handleConfirmarResolucao = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!pendenciaParaResolver) return
    setErroResolucao(null)
    setIsSalvando(true)

    try {
      await resolverPendenciaLote({
        pendenciaId: pendenciaParaResolver.id,
        resolvido_por_nome: user?.name || 'Gestor do Lote',
        resolvido_por_email: user?.email || '',
        comprovante_documento_ref: docRefResolucao,
        observacao_resolucao: obsResolucao,
      })

      setPendenciaParaResolver(null)
      setDocRefResolucao('')
      setObsResolucao('')
      await carregarPendencias()
    } catch (err: any) {
      setErroResolucao(err?.message || 'Falha ao marcar como resolvida.')
    } finally {
      setIsSalvando(false)
    }
  }

  const handleReabrir = async (id: string) => {
    if (!confirm('Deseja reabrir esta pendência como pendente?')) return
    setIsSalvando(true)
    try {
      await reabrirPendenciaLote(id)
      await carregarPendencias()
    } catch (err: any) {
      alert(`Falha ao reabrir pendência: ${err?.message}`)
    } finally {
      setIsSalvando(false)
    }
  }

  const handleCancelar = async (id: string) => {
    if (!confirm('Deseja cancelar esta pendência da coleta?')) return
    setIsSalvando(true)
    try {
      await cancelarPendenciaLote(id)
      await carregarPendencias()
    } catch (err: any) {
      alert(`Falha ao cancelar: ${err?.message}`)
    } finally {
      setIsSalvando(false)
    }
  }

  const pendenciasFiltradas = pendencias.filter((p) => {
    if (filtroStatus === 'todas') return true
    return p.status === filtroStatus
  })

  // Sugestões rápidas de respondentes de cliente
  const preencherSugestao = (tipo: TipoPendenciaColeta, titulo: string, papel: string) => {
    setNovoTipo(tipo)
    setNovoTitulo(titulo)
    setNovoRespondentePapel(papel)
  }

  return (
    <div className="space-y-4">
      {/* CARD PRINCIPAL DO RESUMO E CONTROLES */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-[#0A1628] border border-slate-200 dark:border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-[#059669] flex items-center justify-center shrink-0">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-heading font-bold text-slate-900 dark:text-[#F8FAFC]">
                  Gestão de Respondentes & Pendências da Coleta
                </h4>
                <p className="text-xs text-slate-500 dark:text-[#94A3B8]">
                  Atribuição por responsável (pátio, desmonte, escritório) e status do lote{' '}
                  <span className="font-mono text-emerald-600 dark:text-[#059669]">
                    {loteIdentificador || loteId}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* INDICADOR RESUMO: X DE Y RESOLVIDAS */}
          <div className="flex items-center gap-3">
            <div
              data-testid="status-resumo-pendencias"
              className={`px-3.5 py-1.5 rounded-xl border flex items-center gap-2 transition-all ${
                resumo.total === 0
                  ? 'bg-slate-100 dark:bg-[#111827] border-slate-200 dark:border-slate-800 text-slate-600 dark:text-[#94A3B8]'
                  : resumo.todasResolvidas
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-[#059669]'
                    : 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-[#D9B36C]'
              }`}
            >
              {resumo.total === 0 ? (
                <ShieldCheck className="w-4 h-4 text-slate-400" />
              ) : resumo.todasResolvidas ? (
                <CheckCircle2 className="w-4 h-4 text-[#059669]" />
              ) : (
                <Clock className="w-4 h-4 text-amber-600 dark:text-[#D9B36C]" />
              )}
              <div className="text-left">
                <div className="text-[10px] uppercase font-bold tracking-wider font-mono">
                  {resumo.total === 0
                    ? 'Coleta sem pendências'
                    : `${resumo.resolvidas} de ${resumo.total} pendências resolvidas`}
                </div>
                {resumo.total > 0 && (
                  <div className="text-[10px] text-slate-500 dark:text-[#94A3B8]">
                    {resumo.percentualConcluido}% concluído • {resumo.pendentes} pendente(s)
                  </div>
                )}
              </div>
            </div>

            {!readOnly && (
              <button
                type="button"
                onClick={() => {
                  setErroForm(null)
                  setModalNovaAberta(true)
                }}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 dark:bg-[#059669] text-white hover:bg-emerald-700 transition-all flex items-center gap-1.5 shadow-sm shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Atribuir Pendência</span>
              </button>
            )}
          </div>
        </div>

        {/* BARRA DE PROGRESSO VISUAL */}
        {resumo.total > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  resumo.todasResolvidas
                    ? 'bg-[#059669]'
                    : 'bg-gradient-to-r from-amber-500 to-[#059669]'
                }`}
                style={{ width: `${resumo.percentualConcluido}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* FILTROS E LISTA DE PENDÊNCIAS */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-[#94A3B8]">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5" />
            <span>Filtrar:</span>
            <button
              type="button"
              onClick={() => setFiltroStatus('todas')}
              className={`px-2 py-0.5 rounded-lg font-medium transition-colors ${
                filtroStatus === 'todas'
                  ? 'bg-slate-200 dark:bg-[#111827] text-slate-900 dark:text-[#F8FAFC] font-bold'
                  : 'hover:text-slate-900 dark:hover:text-[#F8FAFC]'
              }`}
            >
              Todas ({pendencias.length})
            </button>
            <button
              type="button"
              onClick={() => setFiltroStatus('pendente')}
              className={`px-2 py-0.5 rounded-lg font-medium transition-colors ${
                filtroStatus === 'pendente'
                  ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-[#D9B36C] font-bold'
                  : 'hover:text-slate-900 dark:hover:text-[#F8FAFC]'
              }`}
            >
              Pendentes ({resumo.pendentes})
            </button>
            <button
              type="button"
              onClick={() => setFiltroStatus('preenchida')}
              className={`px-2 py-0.5 rounded-lg font-medium transition-colors ${
                filtroStatus === 'preenchida'
                  ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-[#059669] font-bold'
                  : 'hover:text-slate-900 dark:hover:text-[#F8FAFC]'
              }`}
            >
              Resolvidas ({resumo.resolvidas})
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-6 text-xs text-slate-400">
            Carregando pendências da coleta...
          </div>
        ) : pendenciasFiltradas.length === 0 ? (
          <div className="text-center py-6 px-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0E1A2E] text-xs text-slate-500 dark:text-[#94A3B8]">
            {pendencias.length === 0 ? (
              <div className="space-y-1">
                <p>Nenhuma pendência atribuída a este lote.</p>
                <p className="text-[11px] text-slate-400">
                  Adicione pendências para que o fiscal de pátio, desmonte ou escritório preencham
                  evidências específicas (NF do destinador, peso, ART, etc.).
                </p>
              </div>
            ) : (
              <p>Nenhuma pendência encontrada com o filtro selecionado.</p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {pendenciasFiltradas.map((item) => {
              const isPreenchida = item.status === 'preenchida'
              const isCancelada = item.status === 'cancelada'
              const tipoRotulo = item.tipo_pendencia
                ? ROTULOS_TIPOS_PENDENCIA[item.tipo_pendencia] || item.tipo_pendencia
                : 'Evidência de Coleta'

              return (
                <div
                  key={item.id}
                  data-testid={`pendencia-item-${item.id}`}
                  className={`p-3.5 rounded-xl border transition-all ${
                    isPreenchida
                      ? 'bg-emerald-50/40 dark:bg-[#059669]/5 border-emerald-200 dark:border-[#059669]/20'
                      : isCancelada
                        ? 'bg-slate-50 dark:bg-[#0A1628] border-slate-200 dark:border-slate-800 opacity-60'
                        : 'bg-white dark:bg-[#0E1A2E] border-slate-200 dark:border-slate-800 hover:border-amber-400/40'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase font-mono ${
                            isPreenchida
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-[#059669]/20 dark:text-[#059669]'
                              : isCancelada
                                ? 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                : 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-[#D9B36C]'
                          }`}
                        >
                          {isPreenchida && <CheckCircle2 className="w-3 h-3" />}
                          {!isPreenchida && !isCancelada && <Clock className="w-3 h-3" />}
                          {isCancelada && <XCircle className="w-3 h-3" />}
                          <span>{item.status}</span>
                        </span>

                        <span className="text-[11px] font-mono text-slate-500 dark:text-[#94A3B8]">
                          {tipoRotulo}
                        </span>
                      </div>

                      <h5 className="text-xs font-bold text-slate-900 dark:text-[#F8FAFC]">
                        {item.titulo}
                      </h5>

                      {item.descricao && (
                        <p className="text-[11px] text-slate-600 dark:text-[#94A3B8] leading-relaxed">
                          {item.descricao}
                        </p>
                      )}

                      {/* RESPONDENTE DESIGNADO */}
                      <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-slate-500 dark:text-[#94A3B8]">
                        <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                          <User className="w-3 h-3 text-slate-400" />
                          <span>{item.respondente_nome}</span>
                          {item.respondente_papel && (
                            <span className="text-[10px] text-slate-400">
                              ({item.respondente_papel})
                            </span>
                          )}
                        </span>
                        <span className="flex items-center gap-1 font-mono text-[10px]">
                          <Mail className="w-3 h-3 text-slate-400" />
                          <span>{item.respondente_email}</span>
                        </span>
                        {item.data_atribuicao && (
                          <span className="text-[10px]">
                            Atribuída em:{' '}
                            {new Date(item.data_atribuicao).toLocaleDateString('pt-BR')}
                          </span>
                        )}
                      </div>

                      {/* INFORMAÇÕES DE RESOLUÇÃO */}
                      {isPreenchida && (
                        <div className="mt-2 p-2 rounded-lg bg-emerald-50 dark:bg-[#059669]/10 border border-emerald-200 dark:border-[#059669]/20 text-[11px] space-y-1">
                          <div className="flex items-center gap-2 text-emerald-800 dark:text-[#059669] font-medium">
                            <FileCheck className="w-3.5 h-3.5 shrink-0" />
                            <span>
                              Preenchida por {item.resolvido_por_nome || 'Equipe'}{' '}
                              {item.data_resolucao &&
                                `em ${new Date(item.data_resolucao).toLocaleString('pt-BR')}`}
                            </span>
                          </div>
                          {item.comprovante_documento_ref && (
                            <div className="font-mono text-[10px] text-slate-600 dark:text-slate-300">
                              Ref. Documental: <strong>{item.comprovante_documento_ref}</strong>
                            </div>
                          )}
                          {item.observacao_resolucao && (
                            <div className="text-[10px] text-slate-600 dark:text-slate-300 italic">
                              Nota: {item.observacao_resolucao}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* AÇÕES */}
                    {!readOnly && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        {!isPreenchida && !isCancelada && (
                          <button
                            type="button"
                            onClick={() => {
                              setErroResolucao(null)
                              setDocRefResolucao('')
                              setObsResolucao('')
                              setPendenciaParaResolver(item)
                            }}
                            className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-600 dark:bg-[#059669] text-white hover:bg-emerald-700 transition-all flex items-center gap-1 shadow-sm"
                            title="Marcar pendência como resolvida"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Resolver</span>
                          </button>
                        )}

                        {isPreenchida && (
                          <button
                            type="button"
                            onClick={() => handleReabrir(item.id)}
                            className="p-1 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors"
                            title="Reabrir como pendente"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {!isCancelada && !isPreenchida && (
                          <button
                            type="button"
                            onClick={() => handleCancelar(item.id)}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                            title="Cancelar pendência"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* MODAL / DIALOG: ATRIBUIR NOVA PENDÊNCIA */}
      {modalNovaAberta && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-600 dark:text-[#059669]" />
                <h3 className="font-heading font-bold text-sm sm:text-base text-slate-900 dark:text-[#F8FAFC]">
                  Atribuir Pendência de Coleta ao Respondente
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalNovaAberta(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCriar} className="p-4 sm:p-5 space-y-4">
              {erroForm && (
                <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{erroForm}</span>
                </div>
              )}

              {/* ATALHOS RÁPIDOS */}
              <div className="space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Modelos Rápidos de Pendência de Coleta:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      preencherSugestao(
                        'nota_fiscal_destinador',
                        'Nota Fiscal do Destinador Final (Reciclador / Carcaça)',
                        'Escritório / Fiscal',
                      )
                    }
                    className="px-2 py-1 rounded-lg text-[10px] bg-slate-100 dark:bg-[#111827] text-slate-700 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-700 transition-colors"
                  >
                    📄 NF Destinador
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      preencherSugestao(
                        'foto_pesagem',
                        'Registro Fotográfico de Pesagem na Balança Rodoviária',
                        'Fiscal de Pátio',
                      )
                    }
                    className="px-2 py-1 rounded-lg text-[10px] bg-slate-100 dark:bg-[#111827] text-slate-700 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-700 transition-colors"
                  >
                    ⚖️ Foto Pesagem
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      preencherSugestao(
                        'art_responsavel_tecnico',
                        'ART do Responsável Técnico pelo Desmonte e Descontaminação',
                        'Engenheiro Mecânico / CREA',
                      )
                    }
                    className="px-2 py-1 rounded-lg text-[10px] bg-slate-100 dark:bg-[#111827] text-slate-700 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-700 transition-colors"
                  >
                    📐 ART Técnico
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      preencherSugestao(
                        'baixa_detran',
                        'Certidão de Baixa Permanente no DETRAN do Veículo Doador',
                        'Despachante / Jurídico',
                      )
                    }
                    className="px-2 py-1 rounded-lg text-[10px] bg-slate-100 dark:bg-[#111827] text-slate-700 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-700 transition-colors"
                  >
                    🚗 Baixa DETRAN
                  </button>
                </div>
              </div>

              {/* TIPO */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Tipo de Evidência / Documento
                </label>
                <select
                  value={novoTipo}
                  onChange={(e) => setNovoTipo(e.target.value as TipoPendenciaColeta)}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#0A1628] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  {Object.entries(ROTULOS_TIPOS_PENDENCIA).map(([chave, rotulo]) => (
                    <option key={chave} value={chave}>
                      {rotulo}
                    </option>
                  ))}
                </select>
              </div>

              {/* TÍTULO */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  O que falta coletar? (Título da Pendência) *
                </label>
                <input
                  type="text"
                  required
                  value={novoTitulo}
                  onChange={(e) => setNovoTitulo(e.target.value)}
                  placeholder="Ex.: NF-e de remessa para a siderúrgica com peso líquido"
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#0A1628] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* DESCRIÇÃO */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Orientações para quem responde (opcional)
                </label>
                <textarea
                  rows={2}
                  value={novaDescricao}
                  onChange={(e) => setNovaDescricao(e.target.value)}
                  placeholder="Ex.: Verificar se o CNPJ do destinatário confere com o licenciamento ambiental do pátio."
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#0A1628] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* RESPONDENTE: NOME E PAPEL */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Quem responde (Nome) *
                  </label>
                  <input
                    type="text"
                    required
                    value={novoRespondenteNome}
                    onChange={(e) => setNovoRespondenteNome(e.target.value)}
                    placeholder="Ex.: Carlos Mendes"
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#0A1628] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Papel / Setor do Respondente
                  </label>
                  <input
                    type="text"
                    value={novoRespondentePapel}
                    onChange={(e) => setNovoRespondentePapel(e.target.value)}
                    placeholder="Ex.: Fiscal de Pátio"
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#0A1628] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* RESPONDENTE: E-MAIL */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  E-mail do Respondente *
                </label>
                <input
                  type="email"
                  required
                  value={novoRespondenteEmail}
                  onChange={(e) => setNovoRespondenteEmail(e.target.value)}
                  placeholder="Ex.: patio@centrodesmonte.com.br"
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#0A1628] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <span className="text-[10px] text-slate-400">
                  O respondente pode ser qualquer pessoa da organização cliente, sem necessidade de
                  usuário pré-cadastrado.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalNovaAberta(false)}
                  className="px-3.5 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSalvando}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 dark:bg-[#059669] text-white hover:bg-emerald-700 transition-all disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isSalvando ? 'Salvando...' : 'Criar Pendência'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL / DIALOG: RESOLVER PENDÊNCIA */}
      {pendenciaParaResolver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-[#059669]" />
                <h3 className="font-heading font-bold text-sm sm:text-base text-slate-900 dark:text-[#F8FAFC]">
                  Marcar Pendência como Resolvida
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPendenciaParaResolver(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmarResolucao} className="p-4 sm:p-5 space-y-4">
              {erroResolucao && (
                <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{erroResolucao}</span>
                </div>
              )}

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0A1628] border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">
                  Item a resolver:
                </span>
                <div className="text-xs font-bold text-slate-900 dark:text-[#F8FAFC]">
                  {pendenciaParaResolver.titulo}
                </div>
                <div className="text-[11px] text-slate-500">
                  Respondente designado: {pendenciaParaResolver.respondente_nome} (
                  {pendenciaParaResolver.respondente_email})
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Referência do Documento / Comprovante (opcional)
                </label>
                <input
                  type="text"
                  value={docRefResolucao}
                  onChange={(e) => setDocRefResolucao(e.target.value)}
                  placeholder="Ex.: NF-e 001.452 / Chave 352108170245... ou MTR 2026/889"
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#0A1628] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Observação da Resolução / Conferência (opcional)
                </label>
                <textarea
                  rows={2}
                  value={obsResolucao}
                  onChange={(e) => setObsResolucao(e.target.value)}
                  placeholder="Ex.: Conferido peso e assinaturas do responsável técnico."
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#0A1628] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setPendenciaParaResolver(null)}
                  className="px-3.5 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Voltar
                </button>
                <button
                  type="submit"
                  disabled={isSalvando}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 dark:bg-[#059669] text-white hover:bg-emerald-700 transition-all disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{isSalvando ? 'Gravando...' : 'Confirmar Resolução'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default GestaoPendenciasRespondentes
