import React, { useState } from 'react'
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileText,
  Search,
  Sparkles,
  ArrowRight,
  X,
} from 'lucide-react'
import {
  enviarSolicitacaoLpf,
  maskCNPJ,
  maskPhone,
  SetorOrbisLpf,
  validarCamposLpf,
} from '@/services/orbisLpfService'
import { cleanCNPJ, consultarCNPJ, isValidCNPJ } from '@/services/cnpj'

const SETORES_DISPONIVEIS: { valor: SetorOrbisLpf; rotulo: string }[] = [
  { valor: 'aço', rotulo: 'Aço' },
  { valor: 'alumínio', rotulo: 'Alumínio' },
  { valor: 'cimento', rotulo: 'Cimento' },
  { valor: 'fertilizantes', rotulo: 'Fertilizantes' },
  { valor: 'agroindústria', rotulo: 'Agroindústria' },
  { valor: 'autopeças', rotulo: 'Autopeças' },
  { valor: 'outro', rotulo: 'Outro' },
]

export interface FormularioOrbisLpfProps {
  id?: string
  tituloVisivel?: boolean
  onSuccess?: () => void
  onClose?: () => void
  className?: string
}

export function FormularioOrbisLpf({
  id = 'formulario-leitura-gratuita',
  tituloVisivel = true,
  onSuccess,
  onClose,
  className = '',
}: FormularioOrbisLpfProps) {
  const [cnpj, setCnpj] = useState('')
  const [razaoSocial, setRazaoSocial] = useState('')
  const [email, setEmail] = useState('')
  const [contatoTelefone, setContatoTelefone] = useState('')
  const [setor, setSetor] = useState<string>('')
  const [volumeExportacao, setVolumeExportacao] = useState('')

  const [consultandoCnpj, setConsultandoCnpj] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [erros, setErros] = useState<Record<string, string>>({})
  const [avisoDuplicado, setAvisoDuplicado] = useState<string | null>(null)
  const [sucesso, setSucesso] = useState(false)
  const [feedbackGeral, setFeedbackGeral] = useState<string | null>(null)

  // Auto-preenchimento ao informar CNPJ válido
  const handleCnpjChange = async (val: string) => {
    const formatted = maskCNPJ(val)
    setCnpj(formatted)
    setErros((prev) => {
      const next = { ...prev }
      delete next.cnpj
      return next
    })
    setAvisoDuplicado(null)

    const digits = cleanCNPJ(formatted)
    if (digits.length === 14 && isValidCNPJ(digits) && !razaoSocial) {
      setConsultandoCnpj(true)
      try {
        const dados = await consultarCNPJ(digits)
        if (dados?.razao_social) {
          setRazaoSocial(dados.razao_social)
        }
        if (dados?.email && !email) {
          setEmail(dados.email.toLowerCase())
        }
        if (dados?.ddd_telefone && !contatoTelefone) {
          setContatoTelefone(maskPhone(dados.ddd_telefone))
        }
      } catch (_) {
        // Falha silenciosa de auto-preenchimento (usuário preenche manual)
      } finally {
        setConsultandoCnpj(false)
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setAvisoDuplicado(null)
    setFeedbackGeral(null)

    const dados = {
      cnpj,
      razao_social: razaoSocial,
      email,
      telefone: contatoTelefone,
      setor,
      volume_exportacao: volumeExportacao,
    }

    const validacao = validarCamposLpf(dados)
    if (!validacao.valido) {
      setErros(validacao.erros)
      return
    }

    setErros({})
    setEnviando(true)

    try {
      const res = await enviarSolicitacaoLpf(dados)

      if (res.ja_solicitado) {
        setAvisoDuplicado(
          'Este CNPJ já solicitou a leitura gratuita — nossa equipe entrará em contato.',
        )
      } else if (res.success) {
        setSucesso(true)
        if (onSuccess) onSuccess()
      } else {
        setFeedbackGeral(res.error || res.message || 'Ocorreu um erro ao enviar a solicitação.')
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha na conexão.'
      setFeedbackGeral(msg)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div
      id={id}
      className={`scroll-mt-28 p-6 sm:p-10 rounded-2xl bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-slate-800 shadow-xl dark:shadow-2xl relative text-slate-900 dark:text-[#F8FAFC] ${className}`}
    >
      {onClose && (
        <button
          onClick={onClose}
          type="button"
          aria-label="Fechar formulário"
          className="absolute top-5 right-5 p-2 rounded-lg text-slate-500 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-[#F8FAFC] hover:bg-slate-100 dark:hover:bg-[#111827] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      )}

      {tituloVisivel && (
        <div className="mb-8 border-b border-slate-200 dark:border-slate-800 pb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-[#111827] border border-emerald-200 dark:border-[#059669]/40 text-emerald-800 dark:text-[#059669] text-xs font-semibold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Oferta Piloto • 1 Leitura por CNPJ</span>
          </div>
          <h2 className="font-heading font-extrabold text-2xl sm:text-3xl md:text-4xl text-slate-900 dark:text-[#F8FAFC] mb-3">
            Sua primeira leitura é por nossa conta.
          </h2>
          <p className="text-sm sm:text-base text-slate-600 dark:text-[#94A3B8] leading-relaxed max-w-3xl">
            Envie os dados do seu próximo embarque e receba o Relatório de Pré-Leitura Orbis: a
            intensidade de carbono estimada do lote, o cenário de custo na ausência de prova e o que
            falta para fechar o dossiê probatório completo.
          </p>
        </div>
      )}

      {/* Grid informativa: O que você recebe e Como funciona */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 p-5 sm:p-6 rounded-xl bg-slate-50 dark:bg-[#0A1628] border border-slate-200 dark:border-slate-800">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-[#059669] block mb-3">
            O que você recebe:
          </span>
          <ul className="space-y-2.5 text-xs sm:text-sm text-slate-600 dark:text-[#94A3B8]">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-[#059669] shrink-0 mt-0.5" />
              <span>Intensidade de carbono estimada do lote (tCO₂e por unidade);</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-[#059669] shrink-0 mt-0.5" />
              <span>Comparação entre o cenário sem prova e o cenário com dossiê probatório;</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-[#059669] shrink-0 mt-0.5" />
              <span>
                Lista objetiva do que falta para a prova completa — e o que o Orbis resolve.
              </span>
            </li>
          </ul>
        </div>

        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-[#D9B36C] block mb-3">
            Como funciona:
          </span>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-[#94A3B8] leading-relaxed">
            A leitura inicial é operada pela equipe técnica Orbis (oferta piloto). 1 leitura por
            CNPJ, sem custo e sem compromisso. Se o número fizer sentido, você conversa com a gente.
            Se não fizer, você ganhou um número que talvez não tivesse.
          </p>
        </div>
      </div>

      {/* Mensagem de sucesso */}
      {sucesso ? (
        <div className="p-6 sm:p-8 rounded-xl bg-emerald-50 dark:bg-[#059669]/10 border border-emerald-300 dark:border-[#059669] text-center space-y-4 animate-fade-in">
          <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-[#059669]/20 border border-emerald-300 dark:border-[#059669] flex items-center justify-center mx-auto text-emerald-700 dark:text-[#059669]">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="font-heading font-extrabold text-xl text-slate-900 dark:text-[#F8FAFC]">
            Solicitação Recebida com Sucesso!
          </h3>
          <p className="text-sm text-slate-600 dark:text-[#94A3B8] max-w-lg mx-auto leading-relaxed">
            Nossa equipe técnica já registrou os dados do seu CNPJ ({cnpj || 'informado'}).
            Iniciaremos a análise da intensidade de carbono estimada do lote e entraremos em contato
            pelo e-mail <strong className="text-slate-900 dark:text-[#F8FAFC]">{email}</strong>.
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => {
                setSucesso(false)
                setCnpj('')
                setRazaoSocial('')
                setEmail('')
                setContatoTelefone('')
                setSetor('')
                setVolumeExportacao('')
              }}
              className="text-xs font-semibold text-emerald-700 dark:text-[#059669] hover:underline"
            >
              Nova consulta ou conferência de outro CNPJ
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Alerta de duplicidade / já solicitado */}
          {avisoDuplicado && (
            <div
              data-testid="aviso-duplicado"
              className="p-4 rounded-xl bg-amber-50 dark:bg-[#D9B36C]/10 border border-amber-300 dark:border-[#D9B36C] text-slate-800 dark:text-[#F8FAFC] flex items-start gap-3 animate-fade-in text-sm leading-relaxed"
            >
              <AlertCircle className="w-5 h-5 text-amber-600 dark:text-[#D9B36C] shrink-0 mt-0.5" />
              <div>
                <strong className="block text-amber-800 dark:text-[#D9B36C] font-semibold mb-0.5">
                  Aviso de Solicitação Anterior
                </strong>
                <span>{avisoDuplicado}</span>
              </div>
            </div>
          )}

          {/* Erro geral */}
          {feedbackGeral && (
            <div
              data-testid="erro-geral"
              className="p-4 rounded-xl bg-red-500/10 border border-red-500/40 text-red-600 dark:text-red-300 flex items-start gap-3 animate-fade-in text-sm"
            >
              <AlertCircle className="w-5 h-5 text-red-500 dark:text-red-400 shrink-0 mt-0.5" />
              <span>{feedbackGeral}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* CNPJ */}
            <div>
              <label
                htmlFor="lpf-cnpj"
                className="block text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-[#F8FAFC] mb-2"
              >
                CNPJ <span className="text-emerald-600 dark:text-[#059669]">*</span>
              </label>
              <div className="relative">
                <input
                  id="lpf-cnpj"
                  name="cnpj"
                  type="text"
                  required
                  placeholder="00.000.000/0000-00"
                  value={cnpj}
                  onChange={(e) => handleCnpjChange(e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-[#0A1628] border ${
                    erros.cnpj
                      ? 'border-red-500 focus:border-red-500'
                      : 'border-slate-200 dark:border-slate-800 focus:border-emerald-500 dark:focus:border-[#2563EB]'
                  } text-slate-900 dark:text-[#F8FAFC] placeholder-slate-400 dark:placeholder-[#94A3B8]/60 text-sm focus:outline-none transition-colors`}
                />
                {consultandoCnpj && (
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-xs text-slate-500 dark:text-[#94A3B8]">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600 dark:text-[#059669]" />
                    <span className="hidden sm:inline">Buscando...</span>
                  </div>
                )}
              </div>
              {erros.cnpj && (
                <p className="text-xs text-red-500 dark:text-red-400 mt-1.5">{erros.cnpj}</p>
              )}
            </div>

            {/* Razão Social */}
            <div>
              <label
                htmlFor="lpf-razao-social"
                className="block text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-[#F8FAFC] mb-2"
              >
                Razão Social <span className="text-emerald-600 dark:text-[#059669]">*</span>
              </label>
              <input
                id="lpf-razao-social"
                name="razao_social"
                type="text"
                required
                placeholder="Nome empresarial conforme Receita Federal"
                value={razaoSocial}
                onChange={(e) => {
                  setRazaoSocial(e.target.value)
                  setErros((prev) => {
                    const next = { ...prev }
                    delete next.razao_social
                    return next
                  })
                }}
                className={`w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-[#0A1628] border ${
                  erros.razao_social
                    ? 'border-red-500 focus:border-red-500'
                    : 'border-slate-200 dark:border-slate-800 focus:border-emerald-500 dark:focus:border-[#2563EB]'
                } text-slate-900 dark:text-[#F8FAFC] placeholder-slate-400 dark:placeholder-[#94A3B8]/60 text-sm focus:outline-none transition-colors`}
              />
              {erros.razao_social && (
                <p className="text-xs text-red-500 dark:text-red-400 mt-1.5">
                  {erros.razao_social}
                </p>
              )}
            </div>

            {/* E-mail comercial */}
            <div>
              <label
                htmlFor="lpf-email"
                className="block text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-[#F8FAFC] mb-2"
              >
                E-mail Comercial <span className="text-emerald-600 dark:text-[#059669]">*</span>
              </label>
              <input
                id="lpf-email"
                name="email"
                type="email"
                required
                placeholder="exportacao@empresa.com.br"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  setErros((prev) => {
                    const next = { ...prev }
                    delete next.email
                    return next
                  })
                }}
                className={`w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-[#0A1628] border ${
                  erros.email
                    ? 'border-red-500 focus:border-red-500'
                    : 'border-slate-200 dark:border-slate-800 focus:border-emerald-500 dark:focus:border-[#2563EB]'
                } text-slate-900 dark:text-[#F8FAFC] placeholder-slate-400 dark:placeholder-[#94A3B8]/60 text-sm focus:outline-none transition-colors`}
              />
              {erros.email && (
                <p className="text-xs text-red-500 dark:text-red-400 mt-1.5">{erros.email}</p>
              )}
            </div>

            {/* Contato/telefone */}
            <div>
              <label
                htmlFor="lpf-telefone"
                className="block text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-[#F8FAFC] mb-2"
              >
                Contato / Telefone
              </label>
              <input
                id="lpf-telefone"
                name="telefone"
                type="text"
                placeholder="(00) 00000-0000"
                value={contatoTelefone}
                onChange={(e) => setContatoTelefone(maskPhone(e.target.value))}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-[#0A1628] border border-slate-200 dark:border-slate-800 focus:border-emerald-500 dark:focus:border-[#2563EB] text-slate-900 dark:text-[#F8FAFC] placeholder-slate-400 dark:placeholder-[#94A3B8]/60 text-sm focus:outline-none transition-colors"
              />
            </div>

            {/* Setor (dropdown) */}
            <div>
              <label
                htmlFor="lpf-setor"
                className="block text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-[#F8FAFC] mb-2"
              >
                Setor <span className="text-emerald-600 dark:text-[#059669]">*</span>
              </label>
              <select
                id="lpf-setor"
                name="setor"
                required
                value={setor}
                onChange={(e) => {
                  setSetor(e.target.value)
                  setErros((prev) => {
                    const next = { ...prev }
                    delete next.setor
                    return next
                  })
                }}
                className={`w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-[#0A1628] border ${
                  erros.setor
                    ? 'border-red-500 focus:border-red-500'
                    : 'border-slate-200 dark:border-slate-800 focus:border-emerald-500 dark:focus:border-[#2563EB]'
                } text-slate-900 dark:text-[#F8FAFC] text-sm focus:outline-none transition-colors`}
              >
                <option value="" disabled>
                  Selecione o setor
                </option>
                {SETORES_DISPONIVEIS.map((s) => (
                  <option
                    key={s.valor}
                    value={s.valor}
                    className="bg-white text-slate-900 dark:bg-[#0E1A2E] dark:text-[#F8FAFC]"
                  >
                    {s.rotulo}
                  </option>
                ))}
              </select>
              {erros.setor && (
                <p className="text-xs text-red-500 dark:text-red-400 mt-1.5">{erros.setor}</p>
              )}
            </div>

            {/* Volume de exportação estimado (opcional) */}
            <div>
              <label
                htmlFor="lpf-volume"
                className="block text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-[#F8FAFC] mb-2"
              >
                Volume de Exportação Estimado{' '}
                <span className="text-[10px] text-slate-500 dark:text-[#94A3B8] font-normal normal-case">
                  (opcional)
                </span>
              </label>
              <input
                id="lpf-volume"
                name="volume_exportacao"
                type="text"
                placeholder="Ex.: 500 toneladas/mês, 2 lotes/ano"
                value={volumeExportacao}
                onChange={(e) => setVolumeExportacao(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-[#0A1628] border border-slate-200 dark:border-slate-800 focus:border-emerald-500 dark:focus:border-[#2563EB] text-slate-900 dark:text-[#F8FAFC] placeholder-slate-400 dark:placeholder-[#94A3B8]/60 text-sm focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* Botão de envio e microcopy */}
          <div className="pt-4 flex flex-col items-center sm:items-start gap-3">
            <button
              type="submit"
              disabled={enviando}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl text-sm font-bold bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-[#2563EB] dark:text-white dark:hover:bg-blue-600 hover:scale-[1.01] transition-all shadow-md dark:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {enviando ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processando solicitação...</span>
                </>
              ) : (
                <>
                  <span>Enviar solicitação</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <p className="text-xs text-slate-500 dark:text-[#94A3B8] leading-relaxed">
              Seus dados são usados exclusivamente para a elaboração da leitura. Sem spam, sem
              compartilhamento.
            </p>
          </div>
        </form>
      )}
    </div>
  )
}

/**
 * Modal flutuante para abertura do formulário a partir de qualquer ponto
 */
export function ModalFormularioOrbisLpf({
  isOpen,
  onClose,
}: {
  isOpen: boolean
  onClose: () => void
}) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-3xl my-8 z-10 animate-fade-in">
        <FormularioOrbisLpf
          id="formulario-leitura-gratuita-modal"
          onClose={onClose}
          onSuccess={() => {}}
        />
      </div>
    </div>
  )
}
