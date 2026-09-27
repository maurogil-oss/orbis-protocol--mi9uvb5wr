import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
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
} from 'lucide-react'
import { validarSenhaForte } from '@/lib/passwordPolicy'

export default function RedefinirSenhaPage() {
  const [searchParams] = useSearchParams()
  // PocketBase links de reset padrão usam ?token=... ou o link redirecionado
  const tokenParam = (searchParams.get('token') || '').trim()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [concluido, setConcluido] = useState(false)

  const { confirmPasswordReset } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!tokenParam) {
      setError('Token de redefinição não fornecido ou link incompleto. Solicite um novo link.')
    }
  }, [tokenParam])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!tokenParam) {
      setError('Token de redefinição ausente. Utilize o link enviado ao seu e-mail.')
      return
    }

    // Validação estrita da regra da plataforma: letras (maiúscula/minúscula), números e símbolo
    const valSenha = validarSenhaForte(password)
    if (!valSenha.valida) {
      setError(valSenha.mensagem)
      return
    }
    if (password !== confirmPassword) {
      setError('As senhas digitadas não coincidem.')
      return
    }

    setIsLoading(true)
    let res: { success: boolean; error?: string }

    try {
      res = await confirmPasswordReset(tokenParam, password)
    } catch (err: any) {
      res = {
        success: false,
        error:
          err?.message ||
          'Falha de comunicação com o servidor ao confirmar nova senha. Tente novamente.',
      }
    } finally {
      setIsLoading(false)
    }

    // REGRA DE CONFIANÇA VISÍVEL: A tela de sucesso SOMENTE pode ser exibida após confirmação real e explícita do backend (res.success === true).
    // Qualquer falha, recusa por política ou token inválido DEVE exibir erro explícito na tela e JAMAIS sucesso falso.
    if (res && res.success === true) {
      setConcluido(true)
      setTimeout(() => {
        navigate('/login', { replace: true })
      }, 3500)
    } else {
      setConcluido(false)
      setError(
        res?.error ||
          'Não foi possível redefinir a senha. O servidor recusou a requisição (o link pode ter expirado ou já ter sido utilizado).',
      )
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
          <h1 className="font-heading font-extrabold text-2xl text-[#F4F7FA]">REDEFINIR SENHA</h1>
          <p className="text-xs text-[#93A3B5] mt-1">
            Plataforma Orbis Protocol • Criação de Nova Credencial
          </p>
        </div>

        {concluido ? (
          <div className="space-y-6 animate-fade-in text-center">
            <div className="p-5 rounded-xl bg-[#12B886]/10 border border-[#12B886]/40 text-xs text-[#F4F7FA] space-y-3">
              <CheckCircle2 className="w-8 h-8 text-[#12B886] mx-auto" />
              <h3 className="font-bold text-sm text-[#12B886]">Senha Redefinida com Sucesso!</h3>
              <p className="text-[#93A3B5] leading-relaxed">
                Sua credencial foi atualizada de forma segura. Você será redirecionado para a tela
                de login em alguns instantes.
              </p>
            </div>

            <Link
              to="/login"
              className="w-full py-3.5 rounded-xl font-bold bg-[#12B886] text-[#0A0E12] hover:bg-[#0CA678] transition-all shadow-emerald-glow flex items-center justify-center gap-2 text-sm"
            >
              <span>Ir para Login Agora</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {!tokenParam && (
              <div className="p-3.5 mb-4 rounded-lg bg-[#F03E54]/10 border border-[#F03E54]/30 text-xs text-[#F03E54] flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>Link inválido ou sem token. Solicite nova recuperação de senha.</span>
              </div>
            )}

            {error && (
              <div className="p-3.5 mb-4 rounded-lg bg-[#F03E54]/10 border border-[#F03E54]/30 text-xs text-[#F03E54] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#93A3B5] mb-1.5">
                Nova Senha Forte (Mínimo 10 caracteres, letras, números e símbolo) *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#93A3B5]" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••"
                  minLength={10}
                  className="w-full pl-10 pr-4 py-3 rounded-lg bg-[#0A0E12] border border-[rgba(244,247,250,0.15)] text-[#F4F7FA] placeholder-[#93A3B5]/50 focus:outline-none focus:ring-2 focus:ring-[#12B886] text-sm"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#93A3B5] mb-1.5">
                Confirmar Nova Senha *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#93A3B5]" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••••"
                  minLength={10}
                  className="w-full pl-10 pr-4 py-3 rounded-lg bg-[#0A0E12] border border-[rgba(244,247,250,0.15)] text-[#F4F7FA] placeholder-[#93A3B5]/50 focus:outline-none focus:ring-2 focus:ring-[#12B886] text-sm"
                  required
                />
              </div>
            </div>

            {/* Painel de Confiança Visível da Política de Senha na Redefinição */}
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
                  className="p-3.5 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.08)] space-y-2.5 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[#93A3B5] flex items-center gap-1.5 text-[11px]">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#12B886]" />
                      Regra de Senha Forte
                    </span>
                    <span
                      className={`text-[10px] font-bold ${
                        forca === 'forte'
                          ? 'text-[#12B886]'
                          : forca === 'media'
                            ? 'text-[#D9B36C]'
                            : 'text-[#93A3B5]'
                      }`}
                    >
                      {forca === 'forte'
                        ? 'Atende à política'
                        : password.length > 0
                          ? 'Incompleta'
                          : 'Aguardando digitação'}
                    </span>
                  </div>

                  <div className="w-full h-1.5 rounded-full bg-[#16202B] overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${barraCor}`}
                      style={{ width: `${percentualForca}%` }}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                    <div
                      className={`flex items-center gap-1.5 ${regras.min10 ? 'text-[#12B886]' : 'text-[#93A3B5]'}`}
                    >
                      <CheckCircle2
                        className={`w-3 h-3 shrink-0 ${regras.min10 ? 'text-[#12B886]' : 'text-[#93A3B5]/40'}`}
                      />
                      <span>Mínimo 10 caracteres</span>
                    </div>

                    <div
                      className={`flex items-center gap-1.5 ${
                        regras.maiuscula && regras.minuscula ? 'text-[#12B886]' : 'text-[#93A3B5]'
                      }`}
                    >
                      <CheckCircle2
                        className={`w-3 h-3 shrink-0 ${
                          regras.maiuscula && regras.minuscula
                            ? 'text-[#12B886]'
                            : 'text-[#93A3B5]/40'
                        }`}
                      />
                      <span>Letras (A-Z e a-z)</span>
                    </div>

                    <div
                      className={`flex items-center gap-1.5 ${regras.numero ? 'text-[#12B886]' : 'text-[#93A3B5]'}`}
                    >
                      <CheckCircle2
                        className={`w-3 h-3 shrink-0 ${regras.numero ? 'text-[#12B886]' : 'text-[#93A3B5]/40'}`}
                      />
                      <span>Números (0 a 9)</span>
                    </div>

                    <div
                      className={`flex items-center gap-1.5 ${regras.simbolo ? 'text-[#12B886]' : 'text-[#93A3B5]'}`}
                    >
                      <CheckCircle2
                        className={`w-3 h-3 shrink-0 ${regras.simbolo ? 'text-[#12B886]' : 'text-[#93A3B5]/40'}`}
                      />
                      <span>Símbolo (!@#$%...)</span>
                    </div>
                  </div>

                  {password && confirmPassword && (
                    <div
                      className={`text-[10px] pt-1 border-t border-[rgba(244,247,250,0.06)] flex items-center gap-1.5 ${
                        senhasIguais ? 'text-[#12B886]' : 'text-[#F03E54]'
                      }`}
                    >
                      <CheckCircle2
                        className={`w-3 h-3 shrink-0 ${senhasIguais ? 'text-[#12B886]' : 'text-[#F03E54]'}`}
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
              disabled={isLoading || !tokenParam}
              className="w-full py-3.5 rounded-xl font-bold bg-[#12B886] text-[#0A0E12] hover:bg-[#0CA678] transition-all shadow-emerald-glow flex items-center justify-center gap-2 disabled:opacity-50 text-sm mt-2"
            >
              {isLoading ? 'Redefinindo...' : 'Salvar Nova Senha'}
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="pt-4 text-center">
              <Link
                to="/recuperar-senha"
                className="inline-flex items-center gap-1.5 text-xs text-[#93A3B5] hover:text-[#12B886] transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Solicitar novo link de recuperação</span>
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
