import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { OrbisGlobe } from '@/components/OrbisGlobe'
import { Mail, ArrowRight, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react'

export default function RecuperarSenhaPage() {
  const [email, setEmail] = useState('')
  const [submetido, setSubmetido] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [isEmailNotFound, setIsEmailNotFound] = useState(false)

  const { requestPasswordReset } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsEmailNotFound(false)
    setIsLoading(true)

    try {
      const res = await requestPasswordReset(email.trim().toLowerCase())
      if (res?.isEmailNotFound) {
        setIsEmailNotFound(true)
        setError(
          res.error ||
            'Não encontramos uma conta com este e-mail. Confira se o endereço foi digitado corretamente (atenção a letras e números parecidos, como "gil" e "g1").',
        )
      } else {
        setSubmetido(true)
      }
    } catch {
      setSubmetido(true)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen py-16 flex items-center justify-center bg-[#0A0E12] px-4 text-[#F4F7FA]">
      <div className="w-full max-w-md p-8 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.12)] shadow-2xl relative">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="relative mb-3">
            <div className="absolute inset-0 rounded-full bg-[#12B886]/25 blur-lg scale-125" />
            <OrbisGlobe size={56} className="relative z-10" />
          </div>
          <h1 className="font-heading font-extrabold text-2xl text-[#F4F7FA]">RECUPERAR SENHA</h1>
          <p className="text-xs text-[#93A3B5] mt-1">
            Plataforma Orbis Protocol • Governança Segura de Credenciais
          </p>
        </div>

        {submetido ? (
          <div className="space-y-6 animate-fade-in">
            <div className="p-4 rounded-xl bg-[#12B886]/10 border border-[#12B886]/40 text-xs text-[#F4F7FA] space-y-2">
              <div className="flex items-center gap-2 text-[#12B886] font-bold">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <span>Instruções de redefinição solicitadas</span>
              </div>
              <p className="text-[#93A3B5] leading-relaxed">
                Se o e-mail informado estiver registrado em nossa base corporativa, você receberá um
                link seguro para cadastrar uma nova senha. Por motivos de conformidade e
                privacidade, não confirmamos a existência de contas.
              </p>
              <p className="text-[11px] text-[#93A3B5]/80">
                Verifique também sua caixa de spam ou lixo eletrônico.
              </p>
            </div>

            <div className="pt-2">
              <Link
                to="/login"
                className="w-full py-3 rounded-xl font-bold bg-[#12B886] text-[#0A0E12] hover:bg-[#0CA678] transition-all shadow-emerald-glow flex items-center justify-center gap-2 text-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Voltar para o Login</span>
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-xs text-[#93A3B5] leading-relaxed mb-4">
              Informe seu e-mail cadastrado. Enviaremos um link de uso único e tempo limitado para
              que você possa redefinir sua senha de acesso com segurança.
            </p>

            {error && (
              <div
                role="alert"
                className={`p-3.5 mb-4 rounded-lg text-xs space-y-1 ${
                  isEmailNotFound
                    ? 'bg-[#F59F00]/10 border border-[#F59F00]/40 text-[#F59F00]'
                    : 'bg-[#F03E54]/10 border border-[#F03E54]/30 text-[#F03E54]'
                }`}
              >
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="leading-relaxed">
                    {isEmailNotFound && (
                      <p className="font-bold text-[#F4F7FA] mb-0.5">
                        E-mail não encontrado no sistema
                      </p>
                    )}
                    <span>{error}</span>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#93A3B5] mb-1.5">
                E-mail Cadastrado
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

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-xl font-bold bg-[#12B886] text-[#0A0E12] hover:bg-[#0CA678] transition-all shadow-emerald-glow flex items-center justify-center gap-2 disabled:opacity-50 text-sm mt-2"
            >
              {isLoading ? 'Enviando solicitação...' : 'Enviar Link de Redefinição'}
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="pt-4 text-center">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-xs text-[#93A3B5] hover:text-[#12B886] transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Lembrei minha senha, voltar ao login</span>
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
