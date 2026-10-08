import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { CheckCircle2, AlertCircle, Loader2, ArrowRight, Sparkles, Mail } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { OrbisGlobe } from '@/components/OrbisGlobe'

export default function ConfirmarEmailPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const navigate = useNavigate()
  const { confirmVerification, isAuthenticated, refreshAuth } = useAuth()

  const [status, setStatus] = useState<'validando' | 'sucesso' | 'erro'>('validando')
  const [erroMsg, setErroMsg] = useState<string>('')

  useEffect(() => {
    let ativo = true

    if (!token) {
      setStatus('erro')
      setErroMsg(
        'Token de verificação ausente na URL. Por favor, utilize o link recebido por e-mail.',
      )
      return
    }

    const executarConfirmacao = async () => {
      try {
        const res = await confirmVerification(token)
        if (!ativo) return

        if (res.success) {
          refreshAuth()
          setStatus('sucesso')
        } else {
          setStatus('erro')
          setErroMsg(
            res.error ||
              'Token de verificação expirado ou inválido. Acesse o painel para solicitar um novo link.',
          )
        }
      } catch (err: any) {
        if (!ativo) return
        setStatus('erro')
        setErroMsg(err?.message || 'Falha ao confirmar e-mail institucional.')
      }
    }

    executarConfirmacao()

    return () => {
      ativo = false
    }
  }, [token])

  return (
    <div className="min-h-screen py-16 flex items-center justify-center bg-[#0A0E12] px-4">
      <div className="w-full max-w-md p-8 sm:p-10 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.12)] shadow-2xl relative text-center">
        {/* Glow de fundo */}
        <div className="absolute top-0 right-1/4 w-48 h-48 bg-[#12B886]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col items-center mb-6">
          <OrbisGlobe size={48} className="mb-3" />
          <h1 className="font-heading font-extrabold text-xl text-[#F4F7FA] uppercase tracking-wider">
            Confirmação de E-mail
          </h1>
          <p className="text-xs text-[#93A3B5] mt-1">
            Plataforma Orbis Protocol • Ativação de Trial
          </p>
        </div>

        {status === 'validando' && (
          <div className="space-y-4 py-6">
            <Loader2 className="w-10 h-10 text-[#12B886] animate-spin mx-auto" />
            <p className="text-sm text-[#F4F7FA] font-medium">
              Validando confirmação de e-mail e ativando seu trial...
            </p>
            <p className="text-xs text-[#93A3B5]">
              Aguarde alguns instantes enquanto autenticamos seu acesso.
            </p>
          </div>
        )}

        {status === 'sucesso' && (
          <div className="space-y-5 animate-fade-in">
            <div className="w-14 h-14 rounded-full bg-[#12B886]/20 border border-[#12B886]/40 flex items-center justify-center text-[#12B886] mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-lg font-bold text-[#F4F7FA]">E-mail Confirmado com Sucesso!</h2>
              <div className="p-3.5 rounded-xl bg-[#12B886]/10 border border-[#12B886]/30 text-xs text-[#12B886] flex items-center justify-center gap-2">
                <Sparkles className="w-4 h-4 shrink-0" />
                <span className="font-semibold">
                  Trial de 15 dias sem cartão ativado com 5 notas fiscais
                </span>
              </div>
              <p className="text-xs text-[#93A3B5] leading-relaxed">
                Sua conta corporativa está totalmente verificada. Você já pode importar até{' '}
                <strong>5 notas fiscais</strong> para calcular a{' '}
                <strong>pegada de carbono por nota/produto</strong> e, como plus, visualizar a{' '}
                <strong>situação tributária da empresa em relação à reforma tributária</strong>.
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate(isAuthenticated ? '/painel' : '/login', { replace: true })}
              className="w-full py-3 rounded-xl font-bold bg-[#12B886] text-[#0A0E12] hover:bg-[#0CA678] transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-wider shadow-emerald-glow"
            >
              <span>{isAuthenticated ? 'Ir para o Painel do Cliente' : 'Fazer Login'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {status === 'erro' && (
          <div className="space-y-5 animate-fade-in">
            <div className="w-14 h-14 rounded-full bg-[#F03E54]/20 border border-[#F03E54]/40 flex items-center justify-center text-[#F03E54] mx-auto">
              <AlertCircle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-lg font-bold text-[#F4F7FA]">
                Não Foi Possível Confirmar o E-mail
              </h2>
              <p className="text-xs text-[#F03E54] bg-[#F03E54]/10 p-3 rounded-xl border border-[#F03E54]/30">
                {erroMsg}
              </p>
              <p className="text-xs text-[#93A3B5] leading-relaxed">
                O link de confirmação pode ter expirado ou já ter sido utilizado. Você pode reenviar
                um novo link de confirmação diretamente pelo seu painel.
              </p>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <Link
                to={isAuthenticated ? '/painel' : '/login'}
                className="w-full py-3 rounded-xl font-bold bg-[#16202B] hover:bg-[#12B886] hover:text-[#0A0E12] text-[#F4F7FA] transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-wider"
              >
                <Mail className="w-4 h-4" />
                <span>{isAuthenticated ? 'Voltar ao Painel' : 'Acessar Login'}</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
