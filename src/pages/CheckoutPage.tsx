import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams, useLocation, Link } from 'react-router-dom'
import {
  CreditCard,
  QrCode,
  CheckCircle2,
  AlertCircle,
  Copy,
  Clock,
  ShieldCheck,
  FileText,
  Download,
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  Sparkles,
  RefreshCw,
  Info,
} from 'lucide-react'
import {
  consultarCobranca,
  confirmarPagamentoSimulado,
  emitirNfse,
  criarCobrancaPix,
  SERVICOS_COBRANCA,
  ServicoCobrancaId,
  CobrancaRecord,
} from '@/services/cobrancaService'
import { listarServicosCatalogo, ServicoCatalogoRecord } from '@/services/catalogoServicosService'
import { useAuth } from '@/contexts/AuthContext'
import { QRCodeSVG } from '@/components/QRCodeSVG'

export default function CheckoutPage() {
  const { cobrancaId } = useParams<{ cobrancaId?: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const { user, isAuthenticated } = useAuth()

  // Parâmetro de indicação de parceiro (?ref=ORB-PAR-XXXX)
  const refCode = searchParams.get('ref') || ''

  const [catalogo, setCatalogo] = useState<Record<string, ServicoCatalogoRecord>>({})

  useEffect(() => {
    listarServicosCatalogo()
      .then((items) => {
        const map: Record<string, ServicoCatalogoRecord> = {}
        for (const item of items) {
          map[item.servico_id] = item
        }
        setCatalogo(map)
      })
      .catch(() => {})
  }, [])

  // Inicializa o serviço selecionado a partir de query param (?servico=...) ou location.state
  const servicoFromQuery = (searchParams.get('servico') || (location.state as any)?.servico) as
    | string
    | null
  const servicoValidoInicial = servicoFromQuery || 'diagnostico'

  // Se veio sem cobrancaId, exibe formulário para iniciar cobrança
  const [servicoSelecionado, setServicoSelecionado] = useState<string>(servicoValidoInicial)

  // Atualiza serviço selecionado caso query param mude
  useEffect(() => {
    const servicoParam = searchParams.get('servico')
    if (servicoParam) {
      setServicoSelecionado(servicoParam)
    }
  }, [searchParams])
  const [tomador, setTomador] = useState({
    nome: user?.name || '',
    cpf_cnpj: '',
    email: user?.email || '',
    endereco: '',
  })

  const [cobranca, setCobranca] = useState<CobrancaRecord | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [erro, setErro] = useState('')
  const [copiado, setCopiado] = useState(false)
  const [avisoGateway, setAvisoGateway] = useState<string | null>(null)
  const [tempoRestanteSegundos, setTempoRestanteSegundos] = useState(1800) // 30 min
  const [isEmitindoNfse, setIsEmitindoNfse] = useState(false)

  // Carregar cobrança existente se id informado na rota
  useEffect(() => {
    if (cobrancaId) {
      carregarCobranca(cobrancaId)
    }
  }, [cobrancaId])

  const carregarCobranca = async (id: string) => {
    setIsLoading(true)
    setErro('')
    try {
      const rec = await consultarCobranca(id)
      setCobranca(rec)
      if (rec.status === 'pendente_simulacao') {
        setAvisoGateway(
          'Gateway não configurado — cadastre MERCADOPAGO_ACCESS_TOKEN no cofre. Operando em modo simulação controlada.',
        )
      }
    } catch (err: any) {
      setErro('Cobrança não encontrada ou expirada.')
    } finally {
      setIsLoading(false)
    }
  }

  // Polling automático do status enquanto pendente
  useEffect(() => {
    if (!cobranca || cobranca.status === 'pago' || cobranca.status === 'cancelado') return

    const interval = setInterval(async () => {
      try {
        const atualizada = await consultarCobranca(cobranca.id)
        if (atualizada.status !== cobranca.status) {
          setCobranca(atualizada)
        }
      } catch {
        /* intentionally ignored */
      }
    }, 4000)

    return () => clearInterval(interval)
  }, [cobranca])

  // Contagem regressiva de 30 minutos
  useEffect(() => {
    if (!cobranca || cobranca.status === 'pago') return

    const timer = setInterval(() => {
      setTempoRestanteSegundos((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)

    return () => clearInterval(timer)
  }, [cobranca])

  const handleCriarCobranca = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro('')
    setIsSubmitting(true)

    if (!tomador.nome || !tomador.cpf_cnpj || !tomador.email) {
      setErro('Preencha os dados cadastrais obrigatórios do tomador.')
      setIsSubmitting(false)
      return
    }

    try {
      const resp = await criarCobrancaPix({
        servico_id: servicoSelecionado,
        tomador_nome: tomador.nome,
        tomador_cpf_cnpj: tomador.cpf_cnpj,
        tomador_email: tomador.email,
        tomador_endereco: tomador.endereco,
        ref: refCode,
        codigo_indicacao: refCode,
      })

      if (resp.aviso_gateway) {
        setAvisoGateway(resp.aviso_gateway)
      }

      // Redireciona para URL com ID ou seta local
      navigate(`/checkout/${resp.cobranca_id}`, { replace: true })
      await carregarCobranca(resp.cobranca_id)
    } catch (err: any) {
      setErro(err.message || 'Erro ao gerar cobrança.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCopiarPix = () => {
    if (cobranca?.qr_code_payload) {
      navigator.clipboard.writeText(cobranca.qr_code_payload)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 3000)
    }
  }

  const handleSimularPagamento = async () => {
    if (!cobranca) return
    setIsSubmitting(true)
    try {
      const res = await confirmarPagamentoSimulado(cobranca.id)
      await carregarCobranca(cobranca.id)
    } catch (err: any) {
      alert(err.message || 'Erro ao simular pagamento.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEmitirNfseManualmente = async () => {
    if (!cobranca) return
    setIsEmitindoNfse(true)
    try {
      await emitirNfse(cobranca.id)
      await carregarCobranca(cobranca.id)
    } catch (err: any) {
      alert(err.message || 'Erro ao emitir NFS-e.')
    } finally {
      setIsEmitindoNfse(false)
    }
  }

  const formatarTempo = (segundos: number) => {
    const m = Math.floor(segundos / 60)
    const s = segundos % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen py-12 md:py-20 bg-[#0A0E12]">
      <div className="max-w-[1000px] mx-auto px-4 sm:px-6">
        <div className="mb-6 flex items-center justify-between">
          <Link
            to="/planos"
            className="inline-flex items-center gap-2 text-xs font-semibold text-[#93A3B5] hover:text-[#12B886] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Voltar aos Planos</span>
          </Link>
          <span className="text-[11px] font-mono text-[#D9B36C]">
            Checkout Seguro PIX + NFS-e Probatória
          </span>
        </div>

        {/* Banner Modo Degradação / Aviso de Gateway */}
        {avisoGateway && (
          <div className="mb-6 p-4 rounded-xl bg-[#D9B36C]/10 border border-[#D9B36C]/40 text-xs text-[#D9B36C] flex items-start gap-3 animate-fade-in">
            <Info className="w-5 h-5 shrink-0 mt-0.5 text-[#D9B36C]" />
            <div className="space-y-1">
              <strong className="block font-bold">Modo de Operação Controlado:</strong>
              <p>{avisoGateway}</p>
              <p className="text-[11px] text-[#93A3B5]">
                O fluxo completo (geração do PIX, conciliação e solicitação de NFS-e) permanece
                demonstrável. Após cadastrar o token oficial no cofre do sistema, a cobrança se
                conecta diretamente ao arranjo real do Banco Central.
              </p>
            </div>
          </div>
        )}

        {/* TELA DE CHECKOUT ATIVO (QUANDO EXISTE UMA COBRANÇA EM ANDAMENTO) */}
        {cobranca ? (
          <div className="p-8 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.12)] shadow-2xl space-y-8 animate-fade-in">
            {/* Header Cobrança */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[rgba(244,247,250,0.08)] pb-6">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#12B886] block">
                  Cobrança ID: {cobranca.id} • TXID: {cobranca.txid}
                </span>
                <h1 className="font-heading font-extrabold text-2xl text-[#F4F7FA] mt-1">
                  {cobranca.servico_nome}
                </h1>
                <span className="text-xs text-[#93A3B5]">
                  Tomador: <strong className="text-[#F4F7FA]">{cobranca.tomador_nome}</strong>{' '}
                  (CNPJ/CPF: {cobranca.tomador_cpf_cnpj})
                </span>
              </div>

              <div className="text-right">
                <span className="text-xs text-[#93A3B5] block">Valor Total</span>
                <div className="font-heading font-black text-3xl text-[#12B886]">
                  R$ {cobranca.valor?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>

            {/* SE JÁ PAGO: SUCESSO, COMPROVANTE E NFS-E */}
            {cobranca.status === 'pago' ? (
              <div className="p-8 rounded-2xl bg-[#0A0E12] border border-[#12B886] text-center space-y-6">
                <div className="w-16 h-16 rounded-full bg-[#12B886]/10 border border-[#12B886] flex items-center justify-center text-[#12B886] mx-auto shadow-emerald-glow">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#12B886] block">
                    PAGAMENTO CONFIRMADO
                  </span>
                  <h2 className="font-heading font-extrabold text-2xl text-[#F4F7FA] mt-1">
                    PROTOCOLO FISCAL E TÉCNICO LIBERADO
                  </h2>
                  <p className="text-xs text-[#93A3B5] mt-1">
                    Liquidado em{' '}
                    {cobranca.data_pagamento
                      ? new Date(cobranca.data_pagamento).toLocaleString('pt-BR')
                      : 'Hoje'}
                    .
                  </p>
                </div>

                {/* Bloco da NFS-e */}
                <div className="p-5 rounded-xl bg-[#111820] border border-[rgba(244,247,250,0.1)] text-left max-w-lg mx-auto text-xs space-y-2">
                  <div className="flex items-center justify-between border-b border-[rgba(244,247,250,0.08)] pb-2">
                    <span className="text-[#93A3B5] font-semibold">
                      Nota Fiscal de Serviço (NFS-e):
                    </span>
                    <span className="px-2 py-0.5 rounded bg-[#12B886]/20 text-[#12B886] font-bold text-[10px] uppercase">
                      {cobranca.nfse_status === 'emitida'
                        ? 'Emitida com Sucesso'
                        : cobranca.nfse_status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                    <div>
                      <span className="text-[#93A3B5] block">Número NFS-e:</span>
                      <strong className="text-[#F4F7FA] font-mono">
                        {cobranca.nfse_numero || 'MODO-HOMOLOG'}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[#93A3B5] block">Código Verificação:</span>
                      <strong className="text-[#D9B36C] font-mono">
                        {cobranca.nfse_verificacao || 'VERIF-HOMOLOG'}
                      </strong>
                    </div>
                  </div>

                  {cobranca.nfse_url ? (
                    <div className="pt-2">
                      <a
                        href={cobranca.nfse_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#16202B] border border-[#12B886] text-[#12B886] hover:bg-[#12B886] hover:text-[#0A0E12] font-semibold text-xs transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Baixar DANFSE (PDF)</span>
                      </a>
                    </div>
                  ) : (
                    <div className="pt-2 flex items-center justify-between text-[10px] text-[#93A3B5]">
                      <span>Provedor: Focus NFe (homologação/degradação controlada)</span>
                      <button
                        type="button"
                        onClick={handleEmitirNfseManualmente}
                        disabled={isEmitindoNfse}
                        className="text-[#12B886] underline font-semibold"
                      >
                        {isEmitindoNfse ? 'Emitindo...' : 'Reemitir NFS-e'}
                      </button>
                    </div>
                  )}
                </div>

                <div className="pt-2 flex justify-center gap-3">
                  <Link
                    to="/planos"
                    className="px-6 py-3 rounded-xl font-bold bg-[#12B886] text-[#0A0E12] hover:bg-[#0CA678] text-xs uppercase tracking-wider transition-all shadow-emerald-glow"
                  >
                    Ver Histórico & Planos
                  </Link>
                  <Link
                    to="/painel"
                    className="px-5 py-3 rounded-xl font-semibold border border-[rgba(244,247,250,0.2)] text-[#F4F7FA] hover:border-[#12B886] text-xs"
                  >
                    Ir ao Painel do Cliente
                  </Link>
                </div>
              </div>
            ) : (
              /* SE PENDENTE: QR CODE PIX + COPIA E COLA + CONTADOR */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                {/* Lado Esquerdo: QR Code e Timer */}
                <div className="flex flex-col items-center text-center p-6 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.08)]">
                  <div className="p-4 bg-white rounded-2xl shadow-xl mb-4">
                    {cobranca.qr_code_base64 ? (
                      <img
                        src={`data:image/png;base64,${cobranca.qr_code_base64}`}
                        alt="QR Code PIX"
                        className="w-48 h-48 sm:w-56 sm:h-56 object-contain"
                      />
                    ) : (
                      <QRCodeSVG
                        value={cobranca.qr_code_payload || `PIX-TXID-${cobranca.txid}`}
                        size={200}
                      />
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-xs text-[#D9B36C] mb-2 font-mono font-bold">
                    <Clock className="w-4 h-4 animate-pulse" />
                    <span>Expira em: {formatarTempo(tempoRestanteSegundos)}</span>
                  </div>
                  <p className="text-[11px] text-[#93A3B5] max-w-xs leading-relaxed">
                    Abra o aplicativo do seu banco ou internet banking PJ, escolha a opção{' '}
                    <strong>Pagar com PIX</strong> e aponte a câmera para o QR Code acima.
                  </p>
                </div>

                {/* Lado Direito: PIX Copia e Cola & Simulação Controlada */}
                <div className="space-y-5">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#93A3B5] mb-2">
                      PIX Copia e Cola (Chave BR Code)
                    </label>
                    <div className="p-3 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.15)] font-mono text-xs text-[#93A3B5] break-all max-h-24 overflow-y-auto mb-2 select-all">
                      {cobranca.qr_code_payload}
                    </div>
                    <button
                      type="button"
                      onClick={handleCopiarPix}
                      className="w-full py-3 rounded-xl font-bold bg-[#16202B] border border-[#12B886]/40 text-[#12B886] hover:bg-[#12B886] hover:text-[#0A0E12] transition-all text-xs flex items-center justify-center gap-2"
                    >
                      <Copy className="w-4 h-4" />
                      <span>{copiado ? 'Código PIX Copiado!' : 'Copiar Código PIX'}</span>
                    </button>
                  </div>

                  <div className="p-4 rounded-xl bg-[#16202B]/60 border border-[rgba(244,247,250,0.08)] space-y-2 text-xs text-[#93A3B5]">
                    <div className="flex items-center gap-2 text-[#12B886] font-semibold">
                      <ShieldCheck className="w-4 h-4" />
                      <span>Conciliação Automática em Tempo Real</span>
                    </div>
                    <p className="text-[11px] leading-relaxed">
                      Esta tela faz polling automático da confirmação bancária. Assim que o
                      pagamento for liquidado, o status mudará instantaneamente e a NFS-e será
                      protocolada.
                    </p>
                  </div>

                  {/* Botão de Simulação Controlada para Demonstração */}
                  {(cobranca.status === 'pendente_simulacao' || cobranca.status === 'pendente') && (
                    <div className="pt-2 border-t border-[rgba(244,247,250,0.08)]">
                      <button
                        type="button"
                        onClick={handleSimularPagamento}
                        disabled={isSubmitting}
                        className="w-full py-3 rounded-xl font-bold bg-gradient-to-r from-[#D9B36C] to-[#C49A50] text-[#0A0E12] hover:opacity-90 transition-all text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg"
                      >
                        <Sparkles className="w-4 h-4" />
                        <span>Simular Liquidação Imediata (Ambiente Homologação)</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* FORMULÁRIO DE SELEÇÃO DE SERVIÇO E DADOS FISCAIS DO TOMADOR */
          <form
            onSubmit={handleCriarCobranca}
            className="p-8 sm:p-10 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.12)] space-y-8 shadow-2xl"
          >
            <div>
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#12B886] block mb-2">
                PASSO 1 DE 2: CONTRATAÇÃO PERICIAL
              </span>
              <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-[#F4F7FA]">
                SELECIONE O SERVIÇO DE COBRANÇA
              </h1>
              <p className="text-xs sm:text-sm text-[#93A3B5] mt-1">
                Serviços oficiais da infraestrutura Orbis Protocol com emissão automática de NFS-e e
                protocolo probatório.
              </p>
            </div>

            {erro && (
              <div className="p-4 rounded-xl bg-[#F03E54]/10 border border-[#F03E54]/30 text-xs text-[#F03E54] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{erro}</span>
              </div>
            )}

            {/* Indicador de Link de Indicação de Parceiro */}
            {refCode && (
              <div className="p-3.5 rounded-xl bg-[#12B886]/10 border border-[#12B886]/30 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-[#12B886]">
                  <Sparkles className="w-4 h-4" />
                  <span>
                    Indicação de Parceiro Credenciado ativa:{' '}
                    <strong className="font-mono">{refCode}</strong>
                  </span>
                </div>
                <span className="text-[10px] uppercase font-bold text-[#D9B36C] bg-[#D9B36C]/10 px-2 py-0.5 rounded">
                  Parceria Oficial
                </span>
              </div>
            )}

            {/* Grid dos 3 Serviços Oficiais lidos da coleção servicos_catalogo */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(['diagnostico', 'laudo_pericial', 'assinatura_bureau'] as const).map((key) => {
                const s = SERVICOS_COBRANCA[key]
                const catItem = catalogo[key]
                const nomeExibicao = catItem?.nome || s.nome
                const precoExibicao = catItem?.preco ?? s.valor
                const descExibicao = catItem?.descricao || s.descricao
                const isSelected = servicoSelecionado === key

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setServicoSelecionado(key)}
                    className={`p-5 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'bg-gradient-to-b from-[#16202B] to-[#111820] border-2 border-[#12B886] shadow-emerald-glow'
                        : 'bg-[#0A0E12] border-[rgba(244,247,250,0.1)] hover:border-[rgba(244,247,250,0.25)]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-mono text-[#D9B36C] uppercase font-bold">
                          {key === 'diagnostico' && 'Essencial • Entrada'}
                          {key === 'laudo_pericial' && 'MOVER • Perícia com ART'}
                          {key === 'assinatura_bureau' && 'Corporativo • Bureau ACP'}
                        </span>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-[#12B886]" />}
                      </div>
                      <h3 className="font-heading font-bold text-base text-[#F4F7FA] mb-2 leading-snug">
                        {nomeExibicao}
                      </h3>
                      <div className="font-heading font-black text-2xl text-[#12B886] mb-3">
                        R$ {precoExibicao.toLocaleString('pt-BR')}
                      </div>
                      <p className="text-[11px] text-[#93A3B5] leading-relaxed mb-4">
                        {descExibicao}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-[rgba(244,247,250,0.06)] text-[10px] text-[#93A3B5] space-y-1">
                      {s.detalhes.slice(0, 2).map((d, i) => (
                        <div key={i} className="flex items-center gap-1.5">
                          <span className="text-[#12B886]">•</span>
                          <span className="truncate">{d}</span>
                        </div>
                      ))}
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Formulário Fiscal do Tomador */}
            <div className="pt-4 border-t border-[rgba(244,247,250,0.08)] space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-[#93A3B5] block">
                PASSO 2 DE 2: DADOS FISCAIS DO TOMADOR (PARA NFS-E)
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-[#93A3B5] mb-1">
                    Razão Social / Nome Completo *
                  </label>
                  <input
                    type="text"
                    required
                    value={tomador.nome}
                    onChange={(e) => setTomador({ ...tomador, nome: e.target.value })}
                    placeholder="Empresa Tomadora Ltda"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#0A0E12] border border-[rgba(244,247,250,0.15)] text-xs text-[#F4F7FA] focus:outline-none focus:ring-2 focus:ring-[#12B886]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#93A3B5] mb-1">
                    CNPJ ou CPF do Tomador *
                  </label>
                  <input
                    type="text"
                    required
                    value={tomador.cpf_cnpj}
                    onChange={(e) => setTomador({ ...tomador, cpf_cnpj: e.target.value })}
                    placeholder="00.000.000/0000-00"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#0A0E12] border border-[rgba(244,247,250,0.15)] text-xs text-[#F4F7FA] focus:outline-none focus:ring-2 focus:ring-[#12B886] font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#93A3B5] mb-1">
                    E-mail para Envio da NFS-e *
                  </label>
                  <input
                    type="email"
                    required
                    value={tomador.email}
                    onChange={(e) => setTomador({ ...tomador, email: e.target.value })}
                    placeholder="financeiro@empresa.com.br"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#0A0E12] border border-[rgba(244,247,250,0.15)] text-xs text-[#F4F7FA] focus:outline-none focus:ring-2 focus:ring-[#12B886]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#93A3B5] mb-1">
                    Endereço Fiscal Completo
                  </label>
                  <input
                    type="text"
                    value={tomador.endereco}
                    onChange={(e) => setTomador({ ...tomador, endereco: e.target.value })}
                    placeholder="Rua, Número, Bairro, Cidade - UF"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#0A0E12] border border-[rgba(244,247,250,0.15)] text-xs text-[#F4F7FA] focus:outline-none focus:ring-2 focus:ring-[#12B886]"
                  />
                </div>
              </div>
            </div>

            {/* Resumo e Ação de Gerar PIX */}
            <div className="p-5 rounded-2xl bg-[#0A0E12] border border-[rgba(244,247,250,0.1)] flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <span className="text-xs text-[#93A3B5]">Total a Faturar:</span>
                <div className="font-heading font-black text-2xl text-[#12B886]">
                  R${' '}
                  {(
                    catalogo[servicoSelecionado]?.preco ??
                    SERVICOS_COBRANCA[servicoSelecionado as ServicoCobrancaId]?.valor ??
                    490
                  ).toLocaleString('pt-BR', {
                    minimumFractionDigits: 2,
                  })}
                </div>
                <span className="text-[11px] text-[#93A3B5]">
                  Pagamento via PIX com emissão imediata de NFS-e
                </span>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold bg-[#12B886] text-[#0A0E12] hover:bg-[#0CA678] transition-all shadow-emerald-glow flex items-center justify-center gap-2 text-xs uppercase tracking-wider disabled:opacity-50"
              >
                <QrCode className="w-4 h-4" />
                <span>{isSubmitting ? 'Gerando PIX...' : 'Gerar QR Code PIX'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
