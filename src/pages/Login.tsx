import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { OrbisGlobe } from '@/components/OrbisGlobe'
import { ShieldCheck, Lock, Mail, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as any)?.from?.pathname || '/painel'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    const res = await login(email, password)
    setIsLoading(false)

    if (res.success) {
      navigate(from, { replace: true })
    } else {
      setError(res.error || 'Credenciais inválidas. Verifique seu e-mail e senha.')
    }
  }

  const fillTestAdmin = () => {
    setEmail('maurog1@hotmail.com')
    setPassword('Skip@Pass')
    setError('')
  }

  return (
    <div className="min-h-screen py-16 flex items-center justify-center bg-[#0A0E12] px-4">
      <div className="w-full max-w-md p-8 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.12)] shadow-2xl relative">
        <div className="flex flex-col items-center text-center mb-8">
          <OrbisGlobe size={48} className="mb-4" />
          <h1 className="font-heading font-extrabold text-2xl text-[#F4F7FA]">ORBIS PROTOCOL</h1>
          <p className="text-xs text-[#93A3B5] mt-1">
            Autenticação Segura • Acesso a Laudos e Selos dMRV
          </p>
        </div>

        {error && (
          <div className="p-3.5 mb-6 rounded-lg bg-[#F03E54]/10 border border-[#F03E54]/30 text-xs text-[#F03E54] flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#93A3B5] mb-1.5">
              E-mail Corporativo
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#93A3B5]" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu.email@empresa.com.br"
                className="w-full pl-10 pr-4 py-3 rounded-lg bg-[#0A0E12] border border-[rgba(244,247,250,0.15)] text-[#F4F7FA] placeholder-[#93A3B5]/50 focus:outline-none focus:ring-2 focus:ring-[#12B886] text-sm"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#93A3B5] mb-1.5">
              Senha de Acesso
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#93A3B5]" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 rounded-lg bg-[#0A0E12] border border-[rgba(244,247,250,0.15)] text-[#F4F7FA] placeholder-[#93A3B5]/50 focus:outline-none focus:ring-2 focus:ring-[#12B886] text-sm"
                required
              />
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

        {/* Quick Test Demo Credentials */}
        <div className="mt-6 pt-5 border-t border-[rgba(244,247,250,0.08)] text-center">
          <p className="text-xs text-[#93A3B5] mb-2">Conta de Auditor / Admin pré-cadastrada:</p>
          <button
            type="button"
            onClick={fillTestAdmin}
            className="text-xs font-mono py-1.5 px-3 rounded-lg bg-[#16202B] border border-[rgba(244,247,250,0.12)] text-[#D9B36C] hover:border-[#D9B36C] transition-all"
          >
            Usar: maurog1@hotmail.com (Skip@Pass)
          </button>
        </div>

        <div className="mt-6 text-center text-xs text-[#93A3B5]">
          Não tem cadastro ainda?{' '}
          <Link to="/diagnostico" className="text-[#12B886] font-semibold hover:underline">
            Inicie seu diagnóstico por CNPJ
          </Link>
        </div>
      </div>
    </div>
  )
}
