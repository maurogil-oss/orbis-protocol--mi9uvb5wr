import React, { useState } from 'react'
import { AlertCircle, Loader2, Sparkles, ArrowRight, X, CheckCircle2 } from 'lucide-react'
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
  camposExtrasVisiveis?: boolean
}

export function FormularioOrbisLpf({
  id = 'formulario-leitura-gratuita',
  tituloVisivel = false,
  onSuccess,
  onClose,
  className = '',
  camposExtrasVisiveis = false,
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
      email,
      setor,
      razao_social: razaoSocial || `Empresa CNPJ ${cnpj}`,
      telefone: contatoTelefone,
      volume_exportacao: volumeExportacao,
    }

    const validacao = validarCamposLpf(dados)
    if (!validacao.valido) {
      // Filtrar apenas os 3 campos públicos da LPF
      const errosLpf: Record<string, string> = {}
      if (validacao.erros.cnpj) errosLpf.cnpj = validacao.erros.cnpj
      if (validacao.erros.email) errosLpf.email = validacao.erros.email
      if (validacao.erros.setor) errosLpf.setor = validacao.erros.setor
      setErros(errosLpf)
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
      className={`scroll-mt-28 p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-slate-800 shadow-xl dark:shadow-2xl relative text-slate-900 dark:text-[#F8FAFC] ${className}`}
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
        <div className="mb-6 border-b border-slate-200 dark:border-slate-800 pb-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-[#111827] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-mono font-medium mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-[#059669]" />
            <span>Programa piloto · 1 leitura por CNPJ</span>
          </div>
          <h2 className="font-heading font-extrabold text-2xl sm:text-3xl text-slate-900 dark:text-[#F8FAFC] mb-2">
            Sua primeira leitura é por nossa conta.
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-[#94A3B8] leading-relaxed">
            Envie os dados do seu próximo embarque e receba o Relatório de Pré-Leitura Orbis: a
            intensidade de carbono estimada do lote, o cenário de custo na ausência de prova e o que
            falta para fechar o dossiê probatório completo.
          </p>
        </div>
      )}

      {/* Mensagem de sucesso */}
      {sucesso ? (
        <div className="p-6 rounded-xl bg-emerald-50 dark:bg-[#059669]/10 border border-emerald-300 dark:border-[#059669] text-center space-y-4 animate-fade-in">
          <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-[#059669]/20 border border-emerald-300 dark:border-[#059669] flex items-center justify-center mx-auto text-emerald-700 dark:text-[#059669]">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="font-heading font-extrabold text-lg sm:text-xl text-slate-900 dark:text-[#F8FAFC]">
            Solicitação Recebida com Sucesso!
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-[#94A3B8] max-w-lg mx-auto leading-relaxed">
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
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Header compacto do formulário à direita */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-700 dark:text-[#059669]">
              Formulário de Solicitação
            </span>
            <span className="text-xs font-mono text-slate-500 dark:text-[#94A3B8]">
              3 campos rápidos
            </span>
          </div>

          {/* Alerta de duplicidade / já solicitado */}
          {avisoDuplicado && (
            <div
              data-testid="aviso-duplicado"
              className="p-3.5 rounded-xl bg-amber-50 dark:bg-[#D9B36C]/10 border border-amber-300 dark:border-[#D9B36C] text-slate-800 dark:text-[#F8FAFC] flex items-start gap-2.5 animate-fade-in text-xs sm:text-sm leading-relaxed"
            >
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-[#D9B36C] shrink-0 mt-0.5" />
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
              className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/40 text-red-600 dark:text-red-300 flex items-start gap-2.5 animate-fade-in text-xs sm:text-sm"
            >
              <AlertCircle className="w-4 h-4 text-red-500 dark:text-red-400 shrink-0 mt-0.5" />
              <span>{feedbackGeral}</span>
            </div>
          )}

          {/* Campo 1: CNPJ da Empresa (com máscara e busca automática de dados) */}
          <div>
            <label
              htmlFor="lpf-cnpj"
              className="block text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-[#F8FAFC] mb-1.5"
            >
              CNPJ da empresa <span className="text-emerald-600 dark:text-[#059669]">*</span>
            </label>
            <div className="relative">
              <input
                id="lpf-cnpj"
                name="cnpj"
                type="text"
                inputMode="numeric"
                required
                placeholder="00.000.000/0000-00"
                maxLength={18}
                value={cnpj}
                onChange={(e) => handleCnpjChange(e.target.value)}
                aria-invalid={Boolean(erros.cnpj)}
                className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0A1628] border ${
                  erros.cnpj
                    ? 'border-red-500 focus:border-red-500'
                    : 'border-slate-300 dark:border-slate-800 focus:border-emerald-500 dark:focus:border-[#2563EB]'
                } text-slate-900 dark:text-[#F8FAFC] placeholder-slate-400 dark:placeholder-[#94A3B8]/60 text-sm focus:outline-none transition-colors min-h-[44px]`}
              />
              {consultandoCnpj && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-xs text-slate-500 dark:text-[#94A3B8]">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600 dark:text-[#059669]" />
                  <span className="hidden sm:inline">Buscando...</span>
                </div>
              )}
            </div>
            {erros.cnpj && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-1 font-medium">
                {erros.cnpj}
              </p>
            )}
          </div>

          {/* Campo 2: E-mail corporativo / comercial */}
          <div>
            <label
              htmlFor="lpf-email"
              className="block text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-[#F8FAFC] mb-1.5"
            >
              E-mail corporativo <span className="text-emerald-600 dark:text-[#059669]">*</span>
            </label>
            <input
              id="lpf-email"
              name="email"
              type="email"
              required
              placeholder="diretoria@empresa.com.br"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                setErros((prev) => {
                  const next = { ...prev }
                  delete next.email
                  return next
                })
              }}
              aria-invalid={Boolean(erros.email)}
              className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0A1628] border ${
                erros.email
                  ? 'border-red-500 focus:border-red-500'
                  : 'border-slate-300 dark:border-slate-800 focus:border-emerald-500 dark:focus:border-[#2563EB]'
              } text-slate-900 dark:text-[#F8FAFC] placeholder-slate-400 dark:placeholder-[#94A3B8]/60 text-sm focus:outline-none transition-colors min-h-[44px]`}
            />
            {erros.email && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-1 font-medium">
                {erros.email}
              </p>
            )}
          </div>

          {/* Campo 3: Setor da empresa */}
          <div>
            <label
              htmlFor="lpf-setor"
              className="block text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-[#F8FAFC] mb-1.5"
            >
              Setor da empresa <span className="text-emerald-600 dark:text-[#059669]">*</span>
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
              aria-invalid={Boolean(erros.setor)}
              className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0A1628] border ${
                erros.setor
                  ? 'border-red-500 focus:border-red-500'
                  : 'border-slate-300 dark:border-slate-800 focus:border-emerald-500 dark:focus:border-[#2563EB]'
              } text-slate-900 dark:text-[#F8FAFC] text-sm focus:outline-none transition-colors min-h-[44px]`}
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
              <p className="text-xs text-red-600 dark:text-red-400 mt-1 font-medium">
                {erros.setor}
              </p>
            )}
          </div>

          {/* Campos Opcionais Extras (caso necessários) */}
          {camposExtrasVisiveis && (
            <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div>
                <label
                  htmlFor="lpf-razao-social"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-[#F8FAFC] mb-1.5"
                >
                  Razão Social
                </label>
                <input
                  id="lpf-razao-social"
                  type="text"
                  placeholder="Nome empresarial completo"
                  value={razaoSocial}
                  onChange={(e) => setRazaoSocial(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0A1628] border border-slate-300 dark:border-slate-800 text-sm min-h-[44px]"
                />
              </div>
              <div>
                <label
                  htmlFor="lpf-telefone"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-[#F8FAFC] mb-1.5"
                >
                  Contato / Telefone
                </label>
                <input
                  id="lpf-telefone"
                  type="text"
                  placeholder="(00) 00000-0000"
                  value={contatoTelefone}
                  onChange={(e) => setContatoTelefone(maskPhone(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0A1628] border border-slate-300 dark:border-slate-800 text-sm min-h-[44px]"
                />
              </div>
              <div>
                <label
                  htmlFor="lpf-volume"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-[#F8FAFC] mb-1.5"
                >
                  Volume de Exportação
                </label>
                <input
                  id="lpf-volume"
                  type="text"
                  placeholder="ex.: 500 toneladas/mês"
                  value={volumeExportacao}
                  onChange={(e) => setVolumeExportacao(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0A1628] border border-slate-300 dark:border-slate-800 text-sm min-h-[44px]"
                />
              </div>
            </div>
          )}

          {/* Botão de envio e microcopy */}
          <div className="pt-2 flex flex-col items-stretch gap-2.5">
            <button
              type="submit"
              disabled={enviando}
              className="w-full inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl text-sm font-bold bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-[#2563EB] dark:text-white dark:hover:bg-blue-600 hover:scale-[1.01] transition-all shadow-md dark:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
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

            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-[#94A3B8]">
              <span>1 leitura por CNPJ. Sem compromisso.</span>
              <span>100% confidencial</span>
            </div>
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
      <div className="relative w-full max-w-xl my-8 z-10 animate-fade-in">
        <FormularioOrbisLpf
          id="formulario-leitura-gratuita-modal"
          tituloVisivel
          onClose={onClose}
          onSuccess={() => {}}
        />
      </div>
    </div>
  )
}

export default FormularioOrbisLpf
