import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Clock,
  FileText,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Lock,
  Mail,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react'
import type { EstadoLicencaUsuario } from '@/services/licencaService'
import { useAuth } from '@/contexts/AuthContext'

interface TrialStatusBannerProps {
  licenca: EstadoLicencaUsuario
  onContratarClick?: () => void
}

export const TrialStatusBanner: React.FC<TrialStatusBannerProps> = ({
  licenca,
  onContratarClick,
}) => {
  const { user, requestVerification } = useAuth()
  const [reenviando, setReenviando] = useState(false)
  const [mensagemReenvio, setMensagemReenvio] = useState<string | null>(null)
  const [cooldownRestante, setCooldownRestante] = useState<number>(0)

  useEffect(() => {
    if (cooldownRestante <= 0) return
    const timer = setInterval(() => {
      setCooldownRestante((prev) => Math.max(0, prev - 1))
    }, 1000)
    return () => clearInterval(timer)
  }, [cooldownRestante])

  const handleReenviarEmail = async () => {
    if (cooldownRestante > 0 || reenviando) return
    const emailDestino = user?.email
    if (!emailDestino) {
      setMensagemReenvio('E-mail do usuário não identificado.')
      return
    }

    setReenviando(true)
    setMensagemReenvio(null)
    try {
      const res = await requestVerification(emailDestino)
      if (res.success) {
        setMensagemReenvio(
          'Link de confirmação reenviado com sucesso! Verifique sua caixa de entrada.',
        )
        setCooldownRestante(60)
      } else {
        setMensagemReenvio(res.error || 'Falha ao reenviar confirmação.')
      }
    } catch (err: any) {
      setMensagemReenvio(err?.message || 'Falha na conexão com o servidor.')
    } finally {
      setReenviando(false)
    }
  }

  // Se o usuário precisa confirmar o e-mail: Banner "Confirme seu e-mail para ativar o trial"
  if (licenca.precisaConfirmarEmail) {
    return (
      <div className="mb-6 p-5 sm:p-6 rounded-2xl bg-amber-500/10 border-2 border-amber-500/60 dark:border-[#F59F00]/60 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs shadow-md">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-700 dark:text-[#F59F00] flex items-center justify-center shrink-0 mt-0.5">
            <Mail className="w-5 h-5" />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-heading font-extrabold text-slate-900 dark:text-[#F8FAFC] text-sm">
                CONFIRME SEU E-MAIL PARA ATIVAR O TRIAL
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-800 dark:text-[#F59F00] font-mono text-[10px] font-bold uppercase tracking-wider">
                CONFIRMAÇÃO PENDENTE
              </span>
            </div>

            <p className="text-slate-700 dark:text-[#94A3B8] text-xs leading-relaxed max-w-3xl">
              Enviamos um link de ativação para{' '}
              <strong className="text-slate-900 dark:text-[#F4F7FA]">
                {user?.email || 'seu e-mail institucional'}
              </strong>
              . As ações operacionais do trial (importação de notas fiscais e cálculo) estão
              bloqueadas até a confirmação. O trial de <strong>15 dias sem cartão</strong> com até{' '}
              <strong>5 notas fiscais</strong> passa a contar imediatamente após a confirmação.
            </p>

            {mensagemReenvio && (
              <div className="flex items-center gap-1.5 text-xs text-emerald-700 dark:text-[#12B886] font-medium pt-1">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{mensagemReenvio}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleReenviarEmail}
            disabled={cooldownRestante > 0 || reenviando}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-sm ${
              cooldownRestante > 0 || reenviando
                ? 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-not-allowed'
                : 'bg-amber-600 dark:bg-[#F59F00] text-white dark:text-[#0A0E12] hover:opacity-90'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${reenviando ? 'animate-spin' : ''}`} />
            <span>
              {reenviando
                ? 'Enviando...'
                : cooldownRestante > 0
                  ? `Reenviar em ${cooldownRestante}s`
                  : 'Reenviar E-mail'}
            </span>
          </button>
        </div>
      </div>
    )
  }

  // Se for plano contratado, exibe badge compacto de plano ativo ilimitado
  if (licenca.isPlanoContratado) {
    return (
      <div className="mb-6 p-4 rounded-2xl bg-emerald-50 dark:bg-[#0E1A2E] border border-emerald-300 dark:border-[#059669]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-[#059669]/20 flex items-center justify-center text-emerald-700 dark:text-[#059669]">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-heading font-bold text-slate-900 dark:text-[#F8FAFC]">
                PLANO CONTRATADO • ACESSO ILIMITADO
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-200/80 dark:bg-[#059669]/30 text-emerald-800 dark:text-[#10B981] font-mono text-[10px] font-bold">
                ATIVO
              </span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-[#94A3B8] mt-0.5">
              Pegada contínua de carbono por nota/produto, laudo pericial (hash, chancela, DPP,
              exportações auditáveis) e situação tributária contínua da reforma.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/central-radar"
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-[#16202B] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-[#F4F7FA] hover:border-emerald-500"
          >
            Radar Semanal (Plus)
          </Link>
          <Link
            to="/planos"
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 dark:bg-[#2563EB] text-white hover:opacity-90"
          >
            Ver Faturas & Planos
          </Link>
        </div>
      </div>
    )
  }

  // Se for free_cadastro sem trial
  if (licenca.isFreeCadastro) {
    return (
      <div className="mb-6 p-5 rounded-2xl bg-slate-100 dark:bg-[#111820] border border-slate-300 dark:border-[rgba(244,247,250,0.12)] flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs shadow-xs">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-[#D9B36C]/20 flex items-center justify-center text-amber-700 dark:text-[#D9B36C] shrink-0 mt-0.5">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-heading font-bold text-slate-900 dark:text-[#F8FAFC] text-sm">
                CADASTRO GRATUITO • DIAGNÓSTICO DO CNPJ
              </span>
              <span className="px-2 py-0.5 rounded-full bg-slate-200 dark:bg-[#16202B] text-slate-700 dark:text-[#93A3B5] font-mono text-[10px] font-bold">
                SEM VALORES DE NOTA
              </span>
            </div>
            <p className="text-slate-600 dark:text-[#93A3B5] text-xs leading-relaxed max-w-2xl">
              Você tem acesso ao <strong>diagnóstico completo do CNPJ</strong> (elegibilidade,
              protocolos setoriais aplicáveis e comparativo regulatório). Ative o{' '}
              <strong>trial de 15 dias sem cartão</strong> para ler até{' '}
              <strong>5 notas fiscais</strong> com pegada de carbono detalhada e a situação
              tributária da empresa em relação à reforma tributária.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            to="/planos"
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider bg-emerald-600 dark:bg-[#12B886] text-white dark:text-[#0A0E12] hover:opacity-90 transition-all shadow-sm flex items-center justify-center gap-2"
          >
            <span>Ver Planos & Contratar</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    )
  }

  // Se o trial está no BLOQUEIO SUAVE (expirou por tempo ou esgotou as 5 notas)
  if (licenca.bloqueioSuaveAtivo) {
    const isDias = licenca.motivoBloqueio === 'dias_expirados'
    return (
      <div className="mb-6 p-5 sm:p-6 rounded-2xl bg-amber-500/10 border-2 border-amber-500/60 dark:border-[#D9B36C]/60 flex flex-col md:flex-row md:items-center justify-between gap-5 text-xs shadow-md">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-700 dark:text-[#D9B36C] flex items-center justify-center shrink-0 mt-0.5">
            <Lock className="w-5 h-5" />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-heading font-extrabold text-slate-900 dark:text-[#F8FAFC] text-sm">
                {isDias
                  ? 'PERÍODO DE TESTE GRATUITO CONCLUÍDO (15 DIAS)'
                  : `LIMITE DE NOTAS DO TRIAL ATINGIDO (${licenca.notasLimite} NOTAS)`}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-800 dark:text-[#D9B36C] font-mono text-[10px] font-bold uppercase tracking-wider">
                BLOQUEIO SUAVE ATIVO
              </span>
            </div>

            <p className="text-slate-700 dark:text-[#94A3B8] text-xs leading-relaxed max-w-3xl">
              <strong>Seus dados e resultados anteriores continuam preservados:</strong> você pode
              consultar o histórico das {licenca.notasConsumidas} nota(s) ingerida(s), os laudos e o
              diagnóstico do CNPJ a qualquer momento. Para importar novas notas fiscais e habilitar
              pegada contínua ilimitada, laudo pericial formal com chancela e situação tributária
              contínua, contrate um plano.
            </p>

            <div className="flex items-center gap-4 text-[11px] font-mono text-slate-600 dark:text-[#93A3B5] pt-1">
              <span>
                Dias restantes:{' '}
                <strong className="text-rose-600 dark:text-[#EF4444]">0 de 15</strong>
              </span>
              <span>•</span>
              <span>
                Notas consumidas:{' '}
                <strong className="text-amber-700 dark:text-[#D9B36C]">
                  {licenca.notasConsumidas} de {licenca.notasLimite}
                </strong>
              </span>
              <span>•</span>
              <span>Sem cobrança automática</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
          <Link
            to="/planos"
            onClick={onContratarClick}
            className="px-5 py-3 rounded-xl font-bold text-xs uppercase tracking-wider bg-emerald-600 dark:bg-[#12B886] text-white dark:text-[#0A0E12] hover:opacity-95 transition-all shadow-md flex items-center justify-center gap-2"
          >
            <span>Contratar Plano</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    )
  }

  // TRIAL ATIVO — Mostra contador visual de dias (15..0) e notas (5..0)
  const pctDias = Math.max(0, Math.min(100, (licenca.diasRestantesTrial / 15) * 100))
  const pctNotas = Math.max(0, Math.min(100, (licenca.notasRestantes / licenca.notasLimite) * 100))

  return (
    <div className="mb-6 p-5 rounded-2xl bg-white dark:bg-[#111820] border border-emerald-300 dark:border-[#12B886]/40 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Lado esquerdo: título e descrição */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-[#12B886]/20 text-emerald-800 dark:text-[#12B886] font-mono text-[10px] font-bold uppercase tracking-wider">
              <Clock className="w-3 h-3" />
              TRIAL DE 15 DIAS SEM CARTÃO ATIVO
            </span>
            <span className="text-[11px] text-slate-500 dark:text-[#93A3B5]">
              Produto Central: <strong>Pegada de Carbono por Nota/Produto</strong>
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-[#93A3B5] leading-relaxed">
            Consulte a pegada de carbono exata de cada nota fiscal e, como plus, a{' '}
            <em>situação tributária da empresa em relação à reforma tributária</em>. Limite de até{' '}
            {licenca.notasLimite} notas no teste gratuito.
          </p>
        </div>

        {/* Lado direito: 2 Chips Contadores (Dias Restantes e Notas Restantes) */}
        <div className="flex items-center gap-3">
          {/* Chip 1: Dias Restantes */}
          <div className="px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-[#0A0E12] border border-slate-200 dark:border-[rgba(244,247,250,0.1)] text-center min-w-[110px]">
            <div className="flex items-center justify-center gap-1 text-[10px] uppercase font-bold text-slate-500 dark:text-[#93A3B5]">
              <Clock className="w-3 h-3 text-emerald-600 dark:text-[#12B886]" />
              <span>Dias</span>
            </div>
            <div className="text-xl font-heading font-black text-slate-900 dark:text-[#F4F7FA]">
              {licenca.diasRestantesTrial}{' '}
              <span className="text-xs font-normal text-slate-400">/ 15d</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-800 h-1 rounded-full mt-1 overflow-hidden">
              <div
                className="bg-emerald-600 dark:bg-[#12B886] h-1 rounded-full transition-all"
                style={{ width: `${pctDias}%` }}
              />
            </div>
          </div>

          {/* Chip 2: Notas Restantes */}
          <div className="px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-[#0A0E12] border border-slate-200 dark:border-[rgba(244,247,250,0.1)] text-center min-w-[110px]">
            <div className="flex items-center justify-center gap-1 text-[10px] uppercase font-bold text-slate-500 dark:text-[#93A3B5]">
              <FileText className="w-3 h-3 text-amber-600 dark:text-[#D9B36C]" />
              <span>Notas</span>
            </div>
            <div className="text-xl font-heading font-black text-slate-900 dark:text-[#F4F7FA]">
              {licenca.notasRestantes}{' '}
              <span className="text-xs font-normal text-slate-400">/ {licenca.notasLimite}</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-800 h-1 rounded-full mt-1 overflow-hidden">
              <div
                className="bg-amber-600 dark:bg-[#D9B36C] h-1 rounded-full transition-all"
                style={{ width: `${pctNotas}%` }}
              />
            </div>
          </div>

          <Link
            to="/planos"
            className="hidden sm:inline-flex px-3.5 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-[#16202B] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-[#F4F7FA] hover:border-[#12B886] transition-all"
          >
            Fazer Upgrade
          </Link>
        </div>
      </div>
    </div>
  )
}
