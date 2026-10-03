import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams, useParams } from 'react-router-dom'
import pb from '@/lib/pocketbase/client'
import { useAuth } from '@/contexts/AuthContext'
import { OrbisGlobe } from '@/components/OrbisGlobe'
import {
  Lock,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  ShieldCheck,
  Eye,
  EyeOff,
  RefreshCw,
} from 'lucide-react'
import { validarSenhaForte } from '@/lib/passwordPolicy'

export default function RedefinirSenhaPage() {
  const [searchParams] = useSearchParams()
  const routeParams = useParams<{ token?: string }>()
  const navigate = useNavigate()
  const { refreshAuth } = useAuth()

  // Extração robusta do token: aceita params de rota, query string (?token=, ?t=, ?key=, etc.) e hash
  const extractToken = (): string => {
    // 1. Parâmetro de rota (/redefinir-senha/:token)
    if (routeParams?.token && routeParams.token.trim()) {
      return routeParams.token.trim()
    }

    // 2. Parâmetros de query string padrão do PocketBase e variações
    const fromSearch =
      searchParams.get('token') ||
      searchParams.get('t') ||
      searchParams.get('key') ||
      searchParams.get('reset_token') ||
      searchParams.get('resetToken') ||
      searchParams.get('tokenKey') ||
      searchParams.get('code') ||
      searchParams.get('auth_token')
    if (fromSearch) return fromSearch.trim()

    // 3. Fallback lendo diretamente window.location (evita atrasos de sincronização do router)
    try {
      if (typeof window !== 'undefined' && window.location) {
        if (window.location.search) {
          const directSearch = new URLSearchParams(window.location.search)
          const searchTok =
            directSearch.get('token') ||
            directSearch.get('t') ||
            directSearch.get('key') ||
            directSearch.get('reset_token') ||
            directSearch.get('resetToken') ||
            directSearch.get('tokenKey') ||
            directSearch.get('code')
          if (searchTok) return searchTok.trim()
        }

        // 4. Suporte caso o link venha com hash fragment (#token=... ou #/redefinir-senha?token=...)
        const hash = window.location.hash || ''
        const hashQueryIdx = hash.indexOf('?')
        if (hashQueryIdx !== -1) {
          const hashParams = new URLSearchParams(hash.slice(hashQueryIdx + 1))
          const hashToken =
            hashParams.get('token') ||
            hashParams.get('t') ||
            hashParams.get('key') ||
            hashParams.get('reset_token')
          if (hashToken) return hashToken.trim()
        }
        if (hash.includes('=')) {
          const cleanHash = hash.startsWith('#') ? hash.slice(1) : hash
          const directParams = new URLSearchParams(cleanHash)
          const directToken =
            directParams.get('token') ||
            directParams.get('t') ||
            directParams.get('key') ||
            directParams.get('reset_token')
          if (directToken) return directToken.trim()
        }
      }
    } catch {
      /* fallback silencioso */
    }

    return ''
  }

  // Extração amigável do e-mail do usuário se vier na query string (ex: ?token=...&email=maurog1@hotmail.com)
  const extractUserEmail = (): string => {
    const emailParam =
      searchParams.get('email') ||
      searchParams.get('user') ||
      searchParams.get('usuario') ||
      searchParams.get('u')
    if (emailParam) return emailParam.trim()
    try {
      if (typeof window !== 'undefined' && window.location && window.location.search) {
        const directSearch = new URLSearchParams(window.location.search)
        const directEmail =
          directSearch.get('email') ||
          directSearch.get('user') ||
          directSearch.get('usuario') ||
          directSearch.get('u')
        if (directEmail) return directEmail.trim()
      }
    } catch {
      /* fallback */
    }
    return ''
  }

  const [tokenParam, setTokenParam] = useState<string>(() => extractToken())
  const [userEmail] = useState<string>(() => extractUserEmail())
  const [manualToken, setManualToken] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [isTokenError, setIsTokenError] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [concluido, setConcluido] = useState(false)

  useEffect(() => {
    const tok = extractToken()
    if (tok) {
      setTokenParam(tok)
      setError('')
      setIsTokenError(false)
    } else {
      setTokenParam('')
      setError(
        'Token de redefinição não detectado na URL. Verifique se copiou o link completo recebido no e-mail ou informe o token manualmente.',
      )
      setIsTokenError(true)
    }
  }, [searchParams, routeParams?.token])

  const activeToken = (manualToken.trim() || tokenParam).trim()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsTokenError(false)

    const currentToken = activeToken
    if (!currentToken) {
      setError(
        'Token de redefinição ausente. O link do e-mail pode estar incompleto. Solicite um novo link de recuperação.',
      )
      setIsTokenError(true)
      return
    }

    // Validação de senhas coincidentes
    if (password !== confirmPassword) {
      setError(
        'As senhas digitadas não coincidem. Certifique-se de digitar a mesma senha em ambos os campos.',
      )
      return
    }

    // Validação de política de segurança da plataforma: mínimo 10 caracteres, maiúscula, minúscula, número e símbolo
    const valSenha = validarSenhaForte(password)
    if (!valSenha.valida) {
      setError(valSenha.mensagem)
      return
    }

    setIsLoading(true)
    console.info('[RedefinirSenha] Disparando chamada confirmPasswordReset ao SDK PocketBase...')

    try {
      // Chamada obrigatória e direta ao método confirmPasswordReset do SDK PocketBase
      const res = await pb
        .collection('users')
        .confirmPasswordReset(currentToken, password, confirmPassword)

      console.info('[RedefinirSenha] Resposta do backend:', res)

      // Se retornou false (PocketBase retorna boolean true em sucesso ou status 204/200)
      if (res === false) {
        throw new Error('Falha na confirmação de redefinição de senha.')
      }

      setConcluido(true)
      refreshAuth?.()
      setTimeout(() => {
        navigate('/login', { replace: true })
      }, 3500)
    } catch (err: any) {
      console.error('[RedefinirSenha] Erro recebido ao confirmar senha no backend:', err)

      const status = err?.status || err?.response?.status || err?.data?.code || 0
      const errData = err?.data?.data || err?.response?.data || {}

      // 1. Mensagem de campo específica do PocketBase
      const tokenFieldMsg = errData?.token?.message || errData?.token?.code
      const passwordFieldMsg = errData?.password?.message
      const passwordConfirmFieldMsg = errData?.passwordConfirm?.message

      // Mensagem geral da resposta
      const rawMessage = err?.data?.message || err?.response?.message || err?.message || ''

      const isTokenInvalidOrExpired =
        status === 400 &&
        (tokenFieldMsg ||
          rawMessage.toLowerCase().includes('token') ||
          rawMessage.toLowerCase().includes('failed to confirm password reset') ||
          rawMessage.toLowerCase().includes('invalid token') ||
          rawMessage.toLowerCase().includes('expired'))

      if (isTokenInvalidOrExpired) {
        setIsTokenError(true)
        setError(
          'Este link de redefinição é inválido ou expirou. Por motivos de segurança, links de redefinição têm validade de aproximadamente 30 minutos e só podem ser usados uma única vez. Solicite um novo link para continuar.',
        )
      } else if (passwordFieldMsg || passwordConfirmFieldMsg) {
        setError(
          `Requisito de senha não atendido: ${passwordFieldMsg || passwordConfirmFieldMsg}. Verifique as regras de segurança e tente novamente.`,
        )
      } else if (
        rawMessage.toLowerCase().includes('política') ||
        rawMessage.toLowerCase().includes('falta:')
      ) {
        setError(rawMessage)
      } else if (
        status === 0 ||
        err?.name === 'TypeError' ||
        rawMessage.includes('Failed to fetch') ||
        rawMessage.includes('NetworkError') ||
        rawMessage.includes('Network request failed')
      ) {
        setError(
          'Erro de conexão ao comunicar com o servidor. Verifique sua conexão com a internet e tente novamente.',
        )
      } else {
        setError(
          rawMessage ||
            'Não foi possível redefinir a senha. O servidor não aceitou a requisição. O link pode ter expirado ou já ter sido utilizado.',
        )
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen py-16 flex items-center justify-center bg-slate-50 dark:bg-[#0A1628] px-4 transition-colors">
      <div className="w-full max-w-md p-8 rounded-2xl bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-slate-800 shadow-2xl relative">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="relative mb-3">
            <div className="absolute inset-0 rounded-full bg-[#12B886]/25 blur-lg scale-125" />
            <OrbisGlobe size={56} className="relative z-10" />
          </div>
          <h1 className="font-heading font-extrabold text-2xl text-slate-900 dark:text-[#F4F7FA]">
            REDEFINIR SENHA
          </h1>
          <p className="text-xs text-slate-500 dark:text-[#93A3B5] mt-1">
            Plataforma Orbis Protocol • Criação de Nova Credencial
          </p>
          {userEmail && (
            <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
              <span>Conta:</span>
              <strong>{userEmail}</strong>
            </div>
          )}
        </div>

        {concluido ? (
          <div className="space-y-6 animate-fade-in text-center">
            <div className="p-5 rounded-xl bg-emerald-50 dark:bg-[#12B886]/10 border border-emerald-300 dark:border-[#12B886]/40 text-xs text-slate-700 dark:text-[#F4F7FA] space-y-3">
              <CheckCircle2 className="w-10 h-10 text-[#12B886] mx-auto" />
              <h3 className="font-bold text-base text-emerald-700 dark:text-[#12B886]">
                Senha Redefinida com Sucesso!
              </h3>
              <p className="text-slate-600 dark:text-[#93A3B5] leading-relaxed">
                Sua credencial de acesso foi atualizada com segurança na base oficial da Orbis
                Protocol. Você será redirecionado para o login em instantes.
              </p>
            </div>

            <Link
              to="/login"
              className="w-full py-3.5 rounded-xl font-bold bg-[#12B886] text-white hover:bg-[#0CA678] transition-all shadow-emerald-glow flex items-center justify-center gap-2 text-sm"
            >
              <span>Ir para Login Agora</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Aviso quando o token não for detectado na URL */}
            {!activeToken && (
              <div
                role="alert"
                className="p-3.5 mb-2 rounded-xl bg-amber-50 dark:bg-[#F59F00]/10 border border-amber-300 dark:border-[#F59F00]/30 text-xs text-amber-900 dark:text-[#F59F00] flex items-start gap-2.5"
              >
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="leading-relaxed space-y-1">
                  <p className="font-bold">Link de redefinição sem token</p>
                  <p>
                    O link aberto não contém o parâmetro do token. Verifique se o endereço do e-mail
                    foi aberto por completo ou informe o token manualmente abaixo.
                  </p>
                </div>
              </div>
            )}

            {!tokenParam && (
              <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-[#16202B] border border-slate-200 dark:border-[rgba(244,247,250,0.12)] space-y-2">
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-[#93A3B5] uppercase tracking-wider">
                  Inserir Token de Redefinição Manualmente
                </label>
                <input
                  type="text"
                  value={manualToken}
                  onChange={(e) => {
                    setManualToken(e.target.value)
                    if (e.target.value.trim()) setError('')
                  }}
                  placeholder="Cole aqui o token recebido no e-mail"
                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#0A1628] border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-[#F4F7FA] text-xs placeholder-slate-400 dark:placeholder-[#93A3B5]/40 focus:outline-none focus:ring-1 focus:ring-[#12B886]"
                />
              </div>
            )}

            {/* Banner de erro visível com suporte a ação em caso de token expirado */}
            {error && (
              <div
                role="alert"
                data-testid="redefinir-senha-erro"
                className="p-4 mb-2 rounded-xl bg-rose-50 dark:bg-[#F03E54]/10 border border-rose-300 dark:border-[#F03E54]/30 text-xs text-rose-900 dark:text-[#F03E54] space-y-2.5"
              >
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600 dark:text-[#F03E54]" />
                  <div className="leading-relaxed space-y-1">
                    <p className="font-bold text-rose-950 dark:text-[#F4F7FA]">
                      {isTokenError ? 'Link Inválido ou Expirado' : 'Atenção na Redefinição'}
                    </p>
                    <p>{error}</p>
                  </div>
                </div>

                {isTokenError && (
                  <div className="pt-2 border-t border-rose-200 dark:border-[#F03E54]/20 flex items-center justify-between">
                    <span className="text-[11px] text-slate-600 dark:text-[#93A3B5]">
                      Links de redefinição expiram em ~30 min.
                    </span>
                    <Link
                      to="/recuperar-senha"
                      className="font-bold text-emerald-700 dark:text-[#12B886] hover:underline inline-flex items-center gap-1 text-[11px]"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Solicitar novo link</span>
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* Campo Nova Senha */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-[#93A3B5] mb-1.5">
                Nova Senha Forte (Mínimo 10 caracteres, letras, números e símbolo) *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-[#93A3B5]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••"
                  minLength={10}
                  className="w-full pl-10 pr-10 py-3 rounded-lg bg-slate-50 dark:bg-[#0A1628] border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-[#F4F7FA] placeholder-slate-400 dark:placeholder-[#93A3B5]/50 focus:outline-none focus:ring-2 focus:ring-[#12B886] text-sm"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-[#93A3B5] hover:text-[#12B886] transition-colors"
                  aria-label={showPassword ? 'Ocultar senha' : 'Exibir senha'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Campo Confirmar Nova Senha */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-[#93A3B5] mb-1.5">
                Confirmar Nova Senha *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-[#93A3B5]" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••••"
                  minLength={10}
                  className="w-full pl-10 pr-10 py-3 rounded-lg bg-slate-50 dark:bg-[#0A1628] border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-[#F4F7FA] placeholder-slate-400 dark:placeholder-[#93A3B5]/50 focus:outline-none focus:ring-2 focus:ring-[#12B886] text-sm"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-[#93A3B5] hover:text-[#12B886] transition-colors"
                  aria-label={showConfirmPassword ? 'Ocultar senha' : 'Exibir senha'}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Painel de Requisitos e Força da Senha */}
            {(() => {
              const resValidacao = validarSenhaForte(password)
              const { regras, pontos, forca } = resValidacao
              const percentualForca = (pontos / 5) * 100
              const senhasIguais = Boolean(
                password && confirmPassword && password === confirmPassword,
              )

              const barraCor =
                forca === 'forte'
                  ? 'bg-[#12B886]'
                  : forca === 'media'
                    ? 'bg-[#D9B36C]'
                    : pontos > 0
                      ? 'bg-[#F03E54]'
                      : 'bg-transparent'

              return (
                <div
                  data-testid="redefinir-senha-feedback"
                  className="p-3.5 rounded-xl bg-slate-100 dark:bg-[#0A1628] border border-slate-200 dark:border-[rgba(244,247,250,0.08)] space-y-2.5 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-600 dark:text-[#93A3B5] flex items-center gap-1.5 text-[11px]">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#12B886]" />
                      Regra de Senha Forte da Orbis
                    </span>
                    <span
                      className={`text-[10px] font-bold ${
                        forca === 'forte'
                          ? 'text-[#12B886]'
                          : forca === 'media'
                            ? 'text-amber-600 dark:text-[#D9B36C]'
                            : 'text-slate-500 dark:text-[#93A3B5]'
                      }`}
                    >
                      {forca === 'forte'
                        ? 'Atende à política ✓'
                        : password.length > 0
                          ? 'Incompleta'
                          : 'Aguardando digitação'}
                    </span>
                  </div>

                  <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-[#16202B] overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${barraCor}`}
                      style={{ width: `${percentualForca}%` }}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                    <div
                      className={`flex items-center gap-1.5 ${
                        regras.min10
                          ? 'text-emerald-700 dark:text-[#12B886] font-medium'
                          : 'text-slate-500 dark:text-[#93A3B5]'
                      }`}
                    >
                      <CheckCircle2
                        className={`w-3 h-3 shrink-0 ${
                          regras.min10 ? 'text-[#12B886]' : 'text-slate-300 dark:text-[#93A3B5]/40'
                        }`}
                      />
                      <span>Mínimo 10 caracteres</span>
                    </div>

                    <div
                      className={`flex items-center gap-1.5 ${
                        regras.maiuscula && regras.minuscula
                          ? 'text-emerald-700 dark:text-[#12B886] font-medium'
                          : 'text-slate-500 dark:text-[#93A3B5]'
                      }`}
                    >
                      <CheckCircle2
                        className={`w-3 h-3 shrink-0 ${
                          regras.maiuscula && regras.minuscula
                            ? 'text-[#12B886]'
                            : 'text-slate-300 dark:text-[#93A3B5]/40'
                        }`}
                      />
                      <span>Letras (A-Z e a-z)</span>
                    </div>

                    <div
                      className={`flex items-center gap-1.5 ${
                        regras.numero
                          ? 'text-emerald-700 dark:text-[#12B886] font-medium'
                          : 'text-slate-500 dark:text-[#93A3B5]'
                      }`}
                    >
                      <CheckCircle2
                        className={`w-3 h-3 shrink-0 ${
                          regras.numero ? 'text-[#12B886]' : 'text-slate-300 dark:text-[#93A3B5]/40'
                        }`}
                      />
                      <span>Números (0 a 9)</span>
                    </div>

                    <div
                      className={`flex items-center gap-1.5 ${
                        regras.simbolo
                          ? 'text-emerald-700 dark:text-[#12B886] font-medium'
                          : 'text-slate-500 dark:text-[#93A3B5]'
                      }`}
                    >
                      <CheckCircle2
                        className={`w-3 h-3 shrink-0 ${
                          regras.simbolo
                            ? 'text-[#12B886]'
                            : 'text-slate-300 dark:text-[#93A3B5]/40'
                        }`}
                      />
                      <span>Símbolo (!@#$%...)</span>
                    </div>
                  </div>

                  {password && confirmPassword && (
                    <div
                      className={`text-[10px] pt-1 border-t border-slate-200 dark:border-[rgba(244,247,250,0.06)] flex items-center gap-1.5 ${
                        senhasIguais
                          ? 'text-emerald-700 dark:text-[#12B886] font-medium'
                          : 'text-rose-600 dark:text-[#F03E54] font-medium'
                      }`}
                    >
                      <CheckCircle2
                        className={`w-3 h-3 shrink-0 ${
                          senhasIguais ? 'text-[#12B886]' : 'text-rose-600 dark:text-[#F03E54]'
                        }`}
                      />
                      <span>
                        {senhasIguais
                          ? 'As senhas conferem ✓'
                          : 'As senhas digitadas não coincidem'}
                      </span>
                    </div>
                  )}
                </div>
              )
            })()}

            <button
              type="submit"
              disabled={isLoading || !activeToken}
              className="w-full py-3.5 rounded-xl font-bold bg-[#12B886] text-white hover:bg-[#0CA678] transition-all shadow-emerald-glow flex items-center justify-center gap-2 disabled:opacity-50 text-sm mt-2 cursor-pointer disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Salvando Nova Senha no Servidor...</span>
                </>
              ) : (
                <>
                  <span>Salvar Nova Senha</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="pt-4 text-center">
              <Link
                to="/recuperar-senha"
                className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-[#93A3B5] hover:text-[#12B886] transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Solicitar novo link de recuperação de senha</span>
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
