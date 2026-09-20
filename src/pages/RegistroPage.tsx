import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import pb from '@/lib/pocketbase/client'
import { OrbisGlobe } from '@/components/OrbisGlobe'
import {
  ShieldCheck,
  Lock,
  Mail,
  User,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Building2,
  Award,
  Sparkles,
  Info,
} from 'lucide-react'

type PerfilRole = 'cliente' | 'perito'

export default function RegistroPage() {
  const [role, setRole] = useState<PerfilRole>('cliente')
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [termoAceite, setTermoAceite] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sucesso, setSucesso] = useState(false)

  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as any)?.from?.pathname

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const cleanNome = nome.trim()
    const cleanEmail = email.trim().toLowerCase()

    if (!cleanNome) {
      setError('Por favor, informe seu nome completo ou razão social.')
      return
    }

    if (!cleanEmail) {
      setError('Por favor, informe um e-mail válido.')
      return
    }

    if (password.length < 8) {
      setError('A senha deve conter no mínimo 8 caracteres.')
      return
    }

    if (password !== passwordConfirm) {
      setError('A confirmação de senha não confere com a senha informada.')
      return
    }

    if (!termoAceite) {
      setError('É necessário concordar com os Termos de Uso e Política de Privacidade.')
      return
    }

    setIsLoading(true)

    try {
      // 1. Cria usuário na collection users com role selecionado
      await pb.collection('users').create({
        email: cleanEmail,
        password,
        passwordConfirm,
        name: cleanNome,
        role: role,
      })

      // 2. Autentica automaticamente
      const authRes = await login(cleanEmail, password)

      if (!authRes.success) {
        throw new Error(
          authRes.error || 'Conta criada, mas houve falha ao autenticar automaticamente.',
        )
      }

      setSucesso(true)

      // 3. Redirecionamento condicional ao perfil
      setTimeout(() => {
        if (from) {
          navigate(from, { replace: true })
        } else if (role === 'perito') {
          // Perito vai direto ao credenciamento para homologar ART/RRT
          navigate('/credenciamento', { replace: true })
        } else {
          // Cliente vai ao seu painel
          navigate('/painel', { replace: true })
        }
      }, 900)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao criar conta. Tente novamente.'
      // Tratamento amigável para e-mail já em uso
      if (
        typeof msg === 'string' &&
        (msg.toLowerCase().includes('email') ||
          msg.toLowerCase().includes('unique') ||
          msg.toLowerCase().includes('already'))
      ) {
        setError('Este e-mail já está cadastrado. Tente entrar com sua senha ou use outro e-mail.')
      } else {
        setError(msg)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen py-12 md:py-20 flex items-center justify-center bg-[#0A0E12] px-4 sm:px-6">
      <div className="w-full max-w-xl p-6 sm:p-10 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.12)] shadow-2xl relative">
        {/* Glow de fundo */}
        <div className="absolute top-0 right-1/4 w-48 h-48 bg-[#12B886]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Cabeçalho */}
        <div className="flex flex-col items-center text-center mb-8 relative z-10">
          <div className="relative mb-3">
            <div className="absolute inset-0 rounded-full bg-[#12B886]/25 blur-lg scale-125" />
            <OrbisGlobe size={52} className="relative z-10" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#16202B] border border-[#12B886]/30 text-[#12B886] text-[11px] font-semibold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            Cadastro na Plataforma Orbis
          </div>
          <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-[#F4F7FA]">
            CRIAR SUA CONTA
          </h1>
          <p className="text-xs sm:text-sm text-[#93A3B5] mt-1 max-w-md">
            Acesso permanente a laudos periciais dMRV, passaportes de descarbonização e painel de
            governança regulatória.
          </p>
        </div>

        {/* Banner de Erro */}
        {error && (
          <div
            role="alert"
            className="p-3.5 mb-6 rounded-lg bg-[#F03E54]/10 border border-[#F03E54]/30 text-xs sm:text-sm text-[#F03E54] flex items-center gap-2.5"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Banner de Sucesso */}
        {sucesso && (
          <div className="p-4 mb-6 rounded-lg bg-[#12B886]/15 border border-[#12B886] text-xs sm:text-sm text-[#12B886] flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <div>
              <p className="font-semibold">Conta criada e autenticada com sucesso!</p>
              <p className="text-[11px] text-[#93A3B5] mt-0.5">
                Redirecionando para {role === 'perito' ? 'o Credenciamento Pericial' : 'seu Painel'}
                ...
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
          {/* Seletor de Perfil (Role) */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#93A3B5] mb-2">
              Escolha seu Perfil de Acesso *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Opção Cliente */}
              <button
                type="button"
                onClick={() => setRole('cliente')}
                className={`p-3.5 rounded-xl border text-left transition-all flex items-start gap-3 ${
                  role === 'cliente'
                    ? 'bg-[#12B886]/15 border-[#12B886] shadow-emerald-glow'
                    : 'bg-[#0A0E12] border-[rgba(244,247,250,0.1)] hover:border-[rgba(244,247,250,0.25)]'
                }`}
              >
                <div
                  className={`p-2 rounded-lg shrink-0 ${
                    role === 'cliente'
                      ? 'bg-[#12B886] text-[#0A0E12]'
                      : 'bg-[#16202B] text-[#93A3B5]'
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-heading font-bold text-xs sm:text-sm text-[#F4F7FA]">
                      Cliente / Empresa
                    </span>
                    {role === 'cliente' && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#12B886] shrink-0" />
                    )}
                  </div>
                  <p className="text-[11px] text-[#93A3B5] leading-snug mt-1">
                    Indústrias, CDVs, frotas e gestores de sustentabilidade.
                  </p>
                </div>
              </button>

              {/* Opção Perito */}
              <button
                type="button"
                onClick={() => setRole('perito')}
                className={`p-3.5 rounded-xl border text-left transition-all flex items-start gap-3 ${
                  role === 'perito'
                    ? 'bg-[#12B886]/15 border-[#12B886] shadow-emerald-glow'
                    : 'bg-[#0A0E12] border-[rgba(244,247,250,0.1)] hover:border-[rgba(244,247,250,0.25)]'
                }`}
              >
                <div
                  className={`p-2 rounded-lg shrink-0 ${
                    role === 'perito'
                      ? 'bg-[#12B886] text-[#0A0E12]'
                      : 'bg-[#16202B] text-[#93A3B5]'
                  }`}
                >
                  <Award className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-heading font-bold text-xs sm:text-sm text-[#F4F7FA]">
                      Perito Técnico
                    </span>
                    {role === 'perito' && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#12B886] shrink-0" />
                    )}
                  </div>
                  <p className="text-[11px] text-[#93A3B5] leading-snug mt-1">
                    Engenheiros CREA, contadores CRC e auditores dMRV.
                  </p>
                </div>
              </button>
            </div>

            {/* Explicação contextual sobre o perfil escolhido */}
            <div className="mt-2.5 p-2.5 rounded-lg bg-[#0A0E12] border border-[rgba(244,247,250,0.06)] flex items-start gap-2 text-[11px] text-[#93A3B5]">
              <Info className="w-3.5 h-3.5 text-[#12B886] shrink-0 mt-0.5" />
              <span>
                {role === 'perito'
                  ? 'Como Perito Técnico, após criar sua conta você completará o credenciamento com número de ART/RRT e conselho regional para emitir laudos chancelados.'
                  : 'Como Cliente, você terá acesso imediato ao painel, importação de NF-e/SPED, diagnóstico SBCE e contratação de serviços.'}
              </span>
            </div>
          </div>

          {/* Nome / Responsável */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#93A3B5] mb-1.5">
              {role === 'perito' ? 'Nome Completo do Perito *' : 'Nome Completo ou Razão Social *'}
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#93A3B5]" />
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder={
                  role === 'perito'
                    ? 'Dr. Eng. Carlos Mendonça'
                    : 'Maria Silva ou Indústria Alfa Ltda'
                }
                className="w-full pl-10 pr-4 py-3 rounded-lg bg-[#0A0E12] border border-[rgba(244,247,250,0.15)] text-[#F4F7FA] placeholder-[#93A3B5]/40 focus:outline-none focus:ring-2 focus:ring-[#12B886] text-sm"
                required
              />
            </div>
          </div>

          {/* E-mail Corporativo */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#93A3B5] mb-1.5">
              E-mail Corporativo *
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#93A3B5]" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu.email@empresa.com.br"
                className="w-full pl-10 pr-4 py-3 rounded-lg bg-[#0A0E12] border border-[rgba(244,247,250,0.15)] text-[#F4F7FA] placeholder-[#93A3B5]/40 focus:outline-none focus:ring-2 focus:ring-[#12B886] text-sm"
                required
              />
            </div>
          </div>

          {/* Senha e Confirmação de Senha */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#93A3B5] mb-1.5">
                Senha (mín. 8 dígitos) *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#93A3B5]" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  minLength={8}
                  className="w-full pl-10 pr-4 py-3 rounded-lg bg-[#0A0E12] border border-[rgba(244,247,250,0.15)] text-[#F4F7FA] placeholder-[#93A3B5]/40 focus:outline-none focus:ring-2 focus:ring-[#12B886] text-sm"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#93A3B5] mb-1.5">
                Confirmar Senha *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#93A3B5]" />
                <input
                  type="password"
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  placeholder="••••••••"
                  minLength={8}
                  className="w-full pl-10 pr-4 py-3 rounded-lg bg-[#0A0E12] border border-[rgba(244,247,250,0.15)] text-[#F4F7FA] placeholder-[#93A3B5]/40 focus:outline-none focus:ring-2 focus:ring-[#12B886] text-sm"
                  required
                />
              </div>
            </div>
          </div>

          {/* Aceite dos Termos */}
          <label className="flex items-start gap-3 p-3 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.1)] cursor-pointer">
            <input
              type="checkbox"
              checked={termoAceite}
              onChange={(e) => setTermoAceite(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded text-[#12B886] focus:ring-0 border-[rgba(244,247,250,0.2)] bg-[#111820]"
            />
            <span className="text-xs text-[#93A3B5] leading-relaxed">
              Declaro que li e concordo com os{' '}
              <Link to="/privacidade" className="text-[#12B886] hover:underline" target="_blank">
                Termos de Uso e Política de Privacidade
              </Link>{' '}
              da infraestrutura dMRV do Orbis Protocol (LGPD Art. 7º/18).
            </span>
          </label>

          {/* Botão de Submissão */}
          <button
            type="submit"
            disabled={isLoading || sucesso}
            className="w-full py-3.5 rounded-xl font-bold bg-[#12B886] text-[#0A0E12] hover:bg-[#0CA678] hover:scale-[1.01] transition-all shadow-emerald-glow flex items-center justify-center gap-2 disabled:opacity-50 text-sm uppercase tracking-wider"
          >
            {isLoading ? (
              <span>Criando conta e autenticando...</span>
            ) : (
              <>
                <span>Criar Conta de {role === 'perito' ? 'Perito' : 'Cliente'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Link claro para Login existente */}
        <div className="mt-8 pt-6 border-t border-[rgba(244,247,250,0.1)] text-center text-xs text-[#93A3B5] flex flex-col sm:flex-row items-center justify-center gap-2">
          <span>Já tem uma conta cadastrada?</span>
          <Link
            to="/login"
            className="text-[#12B886] font-bold hover:underline inline-flex items-center gap-1"
          >
            <span>Já tenho conta → Entrar</span>
          </Link>
        </div>

        {/* Informação adicional sobre o diagnóstico */}
        <div className="mt-4 text-center">
          <Link
            to="/diagnostico"
            className="text-[11px] text-[#93A3B5]/80 hover:text-[#12B886] transition-colors"
          >
            Quer apenas simular sem cadastro prévio? Faça um diagnóstico por CNPJ →
          </Link>
        </div>
      </div>
    </div>
  )
}
