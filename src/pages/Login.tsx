import React, { useState } from 'react'
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { OrbisGlobe } from '@/components/OrbisGlobe'
import {
  ShieldCheck,
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
} from 'lucide-react'
import { useSeo } from '@/hooks/useSeo'

export default function Login() {
  useSeo({
    title: 'Login de Acesso — Orbis Protocol',
    description:
      'Autenticação segura na infraestrutura dMRV do Orbis Protocol. Acesso a laudos, atestados e painéis de conformidade.',
  })
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isEmailNotFound, setIsEmailNotFound] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()

  // Destino salvo de rota protegida ou parâmetro ?next= / ?returnUrl=
  const fromState =
    (location.state as any)?.from?.pathname ||
    (typeof (location.state as any)?.from === 'string' ? (location.state as any).from : null)
  const nextParam = searchParams.get('next') || searchParams.get('returnUrl')
  const returnTarget = nextParam || fromState

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsEmailNotFound(false)
    setIsLoading(true)

    const cleanEmail = email.trim().toLowerCase()
    const res = await login(cleanEmail, password)
    setIsLoading(false)

    if (res.success) {
      // Obter o usuário recém-autenticado no client PocketBase para direcionamento estrito por papel
      const userRecord = (await import('@/lib/pocketbase/client')).default.authStore.record as any
      const userRole = String(userRecord?.role || 'cliente').toLowerCase()

      // 1. Prioridade absoluta: parâmetro de retorno explícito (?next= ou location.state.from)
      if (
        returnTarget &&
        returnTarget !== '/login' &&
        returnTarget.startsWith('/') &&
        !returnTarget.startsWith('//')
      ) {
        navigate(returnTarget, { replace: true })
        return
      }

      // 2. Redirecionamento pós-login por papel (Rodada 2):
      // - gestão (master, admin, controller, financeiro, financeiro_leitor): /admin
      // - perito: /revisor-f6 (rota canônica de revisão pericial)
      // - parceiro: /parceiro (área do parceiro)
      // - cliente / cliente_acp / outros: /painel
      const isGestao =
        userRole === 'master' ||
        userRole === 'admin' ||
        userRole === 'controller' ||
        userRole === 'financeiro' ||
        userRole === 'financeiro_leitor'

      if (isGestao) {
        if (userRole === 'master') {
          navigate('/admin?tab=governanca', { replace: true })
        } else if (userRole === 'controller') {
          navigate('/admin?tab=auditoria', { replace: true })
        } else if (userRole === 'financeiro' || userRole === 'financeiro_leitor') {
          navigate('/admin?tab=receita', { replace: true })
        } else {
          navigate('/admin', { replace: true })
        }
      } else if (userRole === 'perito') {
        navigate('/revisor-f6', { replace: true })
      } else if (userRole === 'parceiro') {
        navigate('/parceiro', { replace: true })
      } else {
        navigate('/painel', { replace: true })
      }
    } else {
      setIsEmailNotFound(!!res.isEmailNotFound)
      setError(
        res.error ||
          'Credenciais inválidas ou limite temporário de tentativas excedido. Por favor, tente novamente mais tarde.',
      )
    }
  }

  return (
    <div className="min-h-screen py-16 flex items-center justify-center bg-slate-50 dark:bg-[#0A1628] px-4 transition-colors">
      <div className="w-full max-w-md p-8 rounded-2xl bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-slate-800 shadow-2xl relative">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="relative mb-3">
            <div className="absolute inset-0 rounded-full bg-[#12B886]/25 blur-lg scale-125" />
            <OrbisGlobe size={56} className="relative z-10" />
          </div>
          <h1 className="font-heading font-extrabold text-2xl text-slate-900 dark:text-[#F4F7FA]">
            ORBIS PROTOCOL
          </h1>
          <p className="text-xs text-slate-600 dark:text-[#93A3B5] mt-1">
            Autenticação Segura • Acesso a Laudos e Selos dMRV
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className={`p-4 mb-6 rounded-xl text-xs space-y-2.5 ${
              isEmailNotFound
                ? 'bg-amber-500/10 border border-amber-500/40 text-amber-700 dark:text-[#F59F00]'
                : 'bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-[#F03E54]'
            }`}
          >
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="leading-relaxed space-y-1">
                {isEmailNotFound && (
                  <p className="font-bold text-slate-900 dark:text-[#F4F7FA]">
                    E-mail não encontrado no sistema
                  </p>
                )}
                <p>{error}</p>
              </div>
            </div>
            <div
              className={`pt-2 border-t flex items-center justify-between flex-wrap gap-2 text-[11px] ${
                isEmailNotFound ? 'border-amber-500/20' : 'border-rose-500/20'
              }`}
            >
              {isEmailNotFound ? (
                <>
                  <span className="text-slate-600 dark:text-[#93A3B5]">
                    Ainda não possui cadastro na plataforma?
                  </span>
                  <Link
                    to="/registro"
                    className="font-bold text-emerald-700 dark:text-[#12B886] hover:underline inline-flex items-center gap-1 transition-colors"
                  >
                    <span>Criar uma conta</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </>
              ) : (
                <>
                  <span className="text-slate-600 dark:text-[#93A3B5]">
                    Esqueceu ou precisa redefinir sua credencial?
                  </span>
                  <Link
                    to="/recuperar-senha"
                    className="font-bold text-emerald-700 dark:text-[#12B886] hover:underline inline-flex items-center gap-1 transition-colors"
                  >
                    <span>Esqueci minha senha</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </>
              )}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="login-email-input"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-[#93A3B5] mb-1.5"
            >
              E-mail Corporativo
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-[#93A3B5]" />
              <input
                id="login-email-input"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu.email@empresa.com.br"
                className="w-full pl-10 pr-4 py-3 rounded-lg bg-slate-50 dark:bg-[#0A1628] border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-[#F8FAFC] placeholder-slate-400 dark:placeholder-[#94A3B8]/50 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                required
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="login-password-input"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-[#93A3B5]"
              >
                Senha de Acesso
              </label>
              <Link
                to="/recuperar-senha"
                className="text-xs text-emerald-700 dark:text-[#12B886] hover:underline transition-colors"
              >
                Esqueci minha senha?
              </Link>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-[#93A3B5]" />
              <input
                id="login-password-input"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-50 dark:bg-[#0A1628] border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-[#F8FAFC] text-sm focus:outline-none focus:border-emerald-500 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-[#93A3B5] hover:text-emerald-700 dark:hover:text-[#12B886] transition-colors"
                aria-label={showPassword ? 'Ocultar senha' : 'Exibir senha'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 rounded-xl font-bold bg-[#12B886] text-[#0A0E12] hover:bg-[#0CA678] transition-all shadow-emerald-glow flex items-center justify-center gap-2 disabled:opacity-50 text-sm mt-2"
          >
            {isLoading ? 'Autenticando...' : 'Entrar no Sistema'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-[#93A3B5] space-y-2">
          <div>
            Ainda não tem conta no Orbis?{' '}
            <Link to="/registro" className="text-[#12B886] font-bold hover:underline">
              Criar conta agora
            </Link>
          </div>
          <div>
            Quer apenas simular?{' '}
            <Link to="/diagnostico" className="text-[#93A3B5] hover:text-[#12B886] hover:underline">
              Inicie seu diagnóstico por CNPJ
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
