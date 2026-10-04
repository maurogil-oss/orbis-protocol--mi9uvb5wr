import React, { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import {
  CheckCircle2,
  AlertCircle,
  MailX,
  ShieldCheck,
  RefreshCw,
  BellOff,
  BellRing,
  ArrowRight,
  ExternalLink,
} from 'lucide-react'
import { consultarOptOutPublico, confirmarOptOutPublico } from '@/services/reativacaoService'
import { useAuth } from '@/contexts/AuthContext'

export default function PreferenciasEmailPage() {
  const [searchParams] = useSearchParams()
  const { user } = useAuth()

  // Parâmetros de link (token HMAC e ID de usuário)
  const tokenParam = searchParams.get('token') || ''
  const uidParam = searchParams.get('uid') || (user ? user.id : '')

  const [loading, setLoading] = useState(true)
  const [submetendo, setSubmetendo] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null)

  const [dadosStatus, setDadosStatus] = useState<{
    tokenValido: boolean
    nome: string
    emailMascarado: string
    optOutAtivo: boolean
    optOutData?: string
  } | null>(null)

  useEffect(() => {
    async function carregarStatus() {
      if (!uidParam) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setErro(null)

        // Se tem token, consulta via endpoint público
        if (tokenParam) {
          const res = await consultarOptOutPublico(uidParam, tokenParam)
          setDadosStatus({
            tokenValido: res.token_valido,
            nome: res.nome,
            emailMascarado: res.email_mascarado,
            optOutAtivo: res.opt_out,
            optOutData: res.opt_out_data,
          })
          if (!res.token_valido) {
            setErro('O token de segurança deste link expirou ou não corresponde a esta conta.')
          }
        } else if (user && user.id === uidParam) {
          // Usuário autenticado visualizando as próprias preferências
          setDadosStatus({
            tokenValido: true,
            nome: user.name || 'Cliente',
            emailMascarado: user.email ? user.email.replace(/^(.{2})(.*)(@.*)$/, '$1***$3') : '',
            optOutAtivo: Boolean((user as any).opt_out_reativacao),
            optOutData: (user as any).opt_out_reativacao_data,
          })
        } else {
          setErro('Link de preferências incompleto. Forneça o token ou acesse autenticado.')
        }
      } catch (err: any) {
        setErro(err.message || 'Erro ao carregar preferências de e-mail.')
      } finally {
        setLoading(false)
      }
    }

    carregarStatus()
  }, [uidParam, tokenParam, user])

  const handleAlterarPreferencia = async (reverter: boolean) => {
    if (!uidParam) return

    setSubmetendo(true)
    setErro(null)
    setMensagemSucesso(null)

    try {
      const res = await confirmarOptOutPublico(uidParam, tokenParam, reverter)
      setMensagemSucesso(res.mensagem)
      setDadosStatus((prev) =>
        prev
          ? {
              ...prev,
              optOutAtivo: res.opt_out,
              optOutData: res.data,
            }
          : null,
      )
    } catch (err: any) {
      setErro(err.message || 'Erro ao atualizar preferência.')
    } finally {
      setSubmetendo(false)
    }
  }

  return (
    <div className="min-h-screen py-16 px-4 bg-slate-50 dark:bg-[#0A1628] text-slate-900 dark:text-[#F8FAFC] flex flex-col justify-center items-center transition-colors">
      <div className="w-full max-w-xl">
        {/* Cabeçalho */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40 text-xs font-mono font-semibold uppercase tracking-wider mb-3">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Controle de Comunicações & Governança</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-heading font-black tracking-tight text-slate-900 dark:text-white">
            Preferências de E-mail
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-2 max-w-md mx-auto">
            Gerencie o recebimento de notificações institucionais, atualizações regulatórias e
            lembretes de acervo probatório do Orbis Protocol.
          </p>
        </div>

        {/* Card Principal */}
        <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-500 dark:text-slate-400">
              <RefreshCw className="w-6 h-6 animate-spin text-[#12B886]" />
              <span className="text-xs font-medium">Carregando suas preferências...</span>
            </div>
          ) : !uidParam ? (
            <div className="text-center py-6 space-y-4">
              <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Identificador de conta ausente
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-sm mx-auto">
                Para ajustar suas preferências de e-mail, utilize o link de descadastro contido no
                rodapé da mensagem que você recebeu ou realize o login no sistema.
              </p>
              <div className="pt-2">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#12B886] text-[#0A0E12] font-bold text-xs hover:bg-[#0fa678] transition-colors"
                >
                  <span>Entrar com Minha Conta</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ) : (
            <>
              {/* Feedback de erro */}
              {erro && (
                <div
                  data-testid="optout-erro-alerta"
                  className="p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/40 text-red-700 dark:text-red-300 text-xs flex items-start gap-3"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="leading-relaxed">{erro}</div>
                </div>
              )}

              {/* Feedback de sucesso */}
              {mensagemSucesso && (
                <div
                  data-testid="optout-sucesso-alerta"
                  className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-200 text-xs flex items-start gap-3"
                >
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
                  <div className="leading-relaxed font-medium">{mensagemSucesso}</div>
                </div>
              )}

              {/* Informações da conta */}
              {dadosStatus && (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0A1628] border border-slate-200 dark:border-slate-800/80 space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 dark:text-slate-400">Titular da Conta:</span>
                    <strong className="text-slate-900 dark:text-slate-200">
                      {dadosStatus.nome}
                    </strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 dark:text-slate-400">E-mail:</span>
                    <span className="font-mono text-slate-700 dark:text-slate-300">
                      {dadosStatus.emailMascarado}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-800">
                    <span className="text-slate-500 dark:text-slate-400">Situação Atual:</span>
                    {dadosStatus.optOutAtivo ? (
                      <span
                        data-testid="status-descadastrado"
                        className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800/50"
                      >
                        <BellOff className="w-3 h-3" />
                        <span>Descadastrado (Opt-out Ativo)</span>
                      </span>
                    ) : (
                      <span
                        data-testid="status-inscrito"
                        className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800/50"
                      >
                        <BellRing className="w-3 h-3" />
                        <span>Inscrição Ativa</span>
                      </span>
                    )}
                  </div>
                  {dadosStatus.optOutData && dadosStatus.optOutAtivo && (
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 pt-1 text-right font-mono">
                      Descadastrado em: {new Date(dadosStatus.optOutData).toLocaleString('pt-BR')}
                    </div>
                  )}
                </div>
              )}

              {/* Explicação dos comunicados */}
              <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                <p>
                  <strong>O que esta preferência controla:</strong>
                </p>
                <ul className="list-disc pl-5 space-y-1.5 text-slate-600 dark:text-slate-400">
                  <li>
                    Lembretes de 30 dias sobre notas fiscais não vinculadas a laudos periciais;
                  </li>
                  <li>
                    Informativos institucionais e avanços regulatórios (SBCE, MOVER, IBS/CBS);
                  </li>
                  <li>Sugestões de consolidação de acervo probatório.</li>
                </ul>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                  <em>
                    Nota de segurança: Notificações transacionais essenciais (como recuperação de
                    senha e verificação de credenciais) continuarão sendo enviadas normalmente.
                  </em>
                </p>
              </div>

              {/* Ações de confirmação */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-3">
                {dadosStatus?.optOutAtivo ? (
                  <button
                    type="button"
                    data-testid="btn-reverter-optout"
                    disabled={submetendo}
                    onClick={() => handleAlterarPreferencia(true)}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#12B886] text-[#0A0E12] font-bold text-xs uppercase tracking-wider hover:bg-[#0fa678] transition-colors disabled:opacity-50 shadow-emerald-glow"
                  >
                    {submetendo ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <BellRing className="w-4 h-4" />
                    )}
                    <span>Reativar Notificações da Conta</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    data-testid="btn-confirmar-optout"
                    disabled={submetendo}
                    onClick={() => handleAlterarPreferencia(false)}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider transition-colors disabled:opacity-50"
                  >
                    {submetendo ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <MailX className="w-4 h-4" />
                    )}
                    <span>Confirmar Descadastro (Opt-out)</span>
                  </button>
                )}

                <Link
                  to="/painel"
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs transition-colors"
                >
                  <span>Ir para o Painel</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            </>
          )}
        </div>

        {/* Rodapé Institucional */}
        <div className="mt-8 text-center text-xs text-slate-500 dark:text-slate-400 space-y-2">
          <p>
            <strong>Orbis Protocol</strong> • Prova Documental da Economia Circular — dMRV
          </p>
          <p className="text-[11px] text-slate-400 dark:text-slate-400">
            Dúvidas ou solicitações de direitos de titular (LGPD)? Acesse nosso{' '}
            <Link to="/titular-dados" className="text-[#12B886] underline hover:text-[#0fa678]">
              Canal do Titular
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  )
}
