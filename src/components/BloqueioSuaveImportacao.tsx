import React from 'react'
import { Link } from 'react-router-dom'
import { Lock, ArrowRight, ShieldCheck, Sparkles, CheckCircle2 } from 'lucide-react'

interface BloqueioSuaveImportacaoProps {
  motivo?: 'dias_expirados' | 'limite_notas_atingido' | 'sem_trial'
  notasConsumidas?: number
  notasLimite?: number
  onVerPlanosClick?: () => void
}

export const BloqueioSuaveImportacao: React.FC<BloqueioSuaveImportacaoProps> = ({
  motivo = 'limite_notas_atingido',
  notasConsumidas = 5,
  notasLimite = 5,
  onVerPlanosClick,
}) => {
  const isDias = motivo === 'dias_expirados'

  return (
    <div className="p-8 sm:p-10 rounded-2xl bg-white dark:bg-[#111820] border-2 border-amber-500/50 dark:border-[#D9B36C]/50 shadow-lg text-center max-w-2xl mx-auto space-y-6">
      <div className="w-14 h-14 rounded-2xl bg-amber-500/15 text-amber-700 dark:text-[#D9B36C] mx-auto flex items-center justify-center">
        <Lock className="w-7 h-7" />
      </div>

      <div className="space-y-2">
        <span className="inline-block px-3 py-1 rounded-full bg-amber-500/20 text-amber-800 dark:text-[#D9B36C] text-xs font-mono font-bold uppercase tracking-wider">
          Limite de Importação do Teste Gratuito
        </span>
        <h3 className="font-heading font-extrabold text-xl sm:text-2xl text-slate-900 dark:text-[#F8FAFC]">
          {isDias
            ? 'Seu período de teste de 15 dias chegou ao fim'
            : `Você atingiu o limite de ${notasLimite} notas do teste gratuito`}
        </h3>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-[#93A3B5] leading-relaxed max-w-lg mx-auto">
          Suas {notasConsumidas} nota(s) já processada(s), históricos e resultados calculados
          continuam <strong>100% disponíveis</strong> para sua consulta. Para realizar novas
          importações, contratar o plano com leitura contínua ilimitada:
        </p>
      </div>

      {/* O que o plano oferece */}
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0A0E12] border border-slate-200 dark:border-[rgba(244,247,250,0.08)] text-left text-xs space-y-2.5">
        <div className="font-bold text-slate-900 dark:text-[#F8FAFC] uppercase tracking-wider text-[11px] mb-1">
          O que o plano contratado entrega:
        </div>
        <div className="flex items-start gap-2 text-slate-600 dark:text-[#93A3B5]">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-[#12B886] shrink-0 mt-0.5" />
          <span>
            <strong>Pegada contínua de carbono ilimitada:</strong> leitura de todas as notas fiscais
            do seu CNPJ sem travas.
          </span>
        </div>
        <div className="flex items-start gap-2 text-slate-600 dark:text-[#93A3B5]">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-[#12B886] shrink-0 mt-0.5" />
          <span>
            <strong>Laudo pericial probatório:</strong> hash SHA-256 canônico, chancela técnica, DPP
            e exportações auditáveis para órgãos e bancos.
          </span>
        </div>
        <div className="flex items-start gap-2 text-slate-600 dark:text-[#93A3B5]">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-[#12B886] shrink-0 mt-0.5" />
          <span>
            <strong>Situação tributária contínua:</strong> acompanhamento do impacto da reforma
            tributária em cada nota (sem prometer achado de crédito).
          </span>
        </div>
        <div className="flex items-start gap-2 text-slate-600 dark:text-[#93A3B5]">
          <CheckCircle2 className="w-4 h-4 text-amber-600 dark:text-[#D9B36C] shrink-0 mt-0.5" />
          <span>
            <strong>Radar Semanal (Plus de Receita):</strong> curadoria regulatória por faixas de
            CNPJ (1=R$59, 5=R$149, 30=R$249, liberação manual).
          </span>
        </div>
      </div>

      <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
        <Link
          to="/planos"
          onClick={onVerPlanosClick}
          className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider bg-emerald-600 dark:bg-[#12B886] text-white dark:text-[#0A0E12] hover:opacity-90 transition-all shadow-emerald-glow flex items-center justify-center gap-2"
        >
          <span>Conhecer Planos & Contratar</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  )
}
