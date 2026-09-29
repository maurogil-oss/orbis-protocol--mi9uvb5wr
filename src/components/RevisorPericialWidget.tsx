import React from 'react'
import { Link } from 'react-router-dom'
import {
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Lock,
  ArrowRight,
  Sparkles,
  RefreshCw,
  Scale,
  Award,
  FileCheck2,
} from 'lucide-react'
import {
  ResultadoTriagemPericial,
  AchadoPericial,
  getInfoCtaPlano,
} from '@/services/revisorPericialService'

interface RevisorPericialWidgetProps {
  resultado: ResultadoTriagemPericial | null
  isLoading?: boolean
  onReexecutar?: () => void
  isDemo?: boolean
}

export const RevisorPericialWidget: React.FC<RevisorPericialWidgetProps> = ({
  resultado,
  isLoading = false,
  onReexecutar,
  isDemo = false,
}) => {
  if (isLoading) {
    return (
      <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#111820] border border-emerald-300 dark:border-[#12B886]/40 shadow-sm space-y-4 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#12B886]">
            <Sparkles className="w-4 h-4 animate-spin" />
            <span>Triagem Pericial Automática em Andamento...</span>
          </div>
          <span className="text-xs text-slate-500 dark:text-[#93A3B5]">
            Auditando contra critérios GHG/MCTI/SBCE
          </span>
        </div>
        <div className="h-6 bg-slate-100 dark:bg-[#16202B] rounded-lg w-3/4" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="h-28 bg-slate-50 dark:bg-[#0A0E12] rounded-xl border border-slate-200 dark:border-[rgba(244,247,250,0.06)]" />
          <div className="h-28 bg-slate-50 dark:bg-[#0A0E12] rounded-xl border border-slate-200 dark:border-[rgba(244,247,250,0.06)]" />
        </div>
      </div>
    )
  }

  if (!resultado) {
    return (
      <div className="p-6 rounded-2xl bg-white dark:bg-[#111820] border border-slate-200 dark:border-[rgba(244,247,250,0.1)] text-center space-y-3 shadow-sm">
        <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-[#12B886]/10 text-[#12B886] flex items-center justify-center mx-auto">
          <FileCheck2 className="w-6 h-6" />
        </div>
        <h4 className="font-heading font-bold text-base text-slate-900 dark:text-[#F4F7FA]">
          Triagem Pericial Automática (Pré-Laudo)
        </h4>
        <p className="text-xs text-slate-600 dark:text-[#93A3B5] max-w-lg mx-auto">
          Audite o inventário de emissões contra os critérios periciais do GHG Protocol, MCTI/SIN,
          GLEC e Lei 15.042/2024 para identificar fragilidades antes da auditoria formal.
        </p>
        {onReexecutar && (
          <button
            type="button"
            onClick={onReexecutar}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-[#12B886] text-[#0A0E12] hover:bg-[#0CA678] transition-all shadow-emerald-glow"
          >
            Iniciar Triagem Pericial
          </button>
        )}
      </div>
    )
  }

  const {
    score_pericial,
    grau_conformidade,
    achados_publicos,
    achados_ocultos_count,
    plano_recomendado,
    resumo_parecer,
  } = resultado

  const infoPlano = getInfoCtaPlano(plano_recomendado)

  // Cor do score
  const scoreColor =
    score_pericial >= 80
      ? 'text-[#12B886]'
      : score_pericial >= 65
        ? 'text-amber-700 dark:text-[#D9B36C]'
        : 'text-rose-600 dark:text-[#F03E54]'

  const scoreBg =
    score_pericial >= 80
      ? 'border-emerald-300 dark:border-[#12B886]/40 from-emerald-50/50 dark:from-[#12B886]/15 via-white dark:via-[#111820] to-slate-50 dark:to-[#0A0E12]'
      : score_pericial >= 65
        ? 'border-amber-300 dark:border-[#D9B36C]/40 from-amber-50/40 dark:from-[#D9B36C]/15 via-white dark:via-[#111820] to-slate-50 dark:to-[#0A0E12]'
        : 'border-rose-300 dark:border-[#F03E54]/40 from-rose-50/40 dark:from-[#F03E54]/15 via-white dark:via-[#111820] to-slate-50 dark:to-[#0A0E12]'

  return (
    <div className="space-y-4">
      {/* 1. Header do Painel de Triagem Pericial */}
      <div
        className={`p-6 sm:p-7 rounded-2xl bg-gradient-to-br ${scoreBg} border shadow-lg relative`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-200 dark:border-[rgba(244,247,250,0.08)]">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white dark:bg-[#111820] border border-emerald-300 dark:border-[#12B886]/50 text-[#12B886] text-xs font-bold uppercase tracking-wider shadow-sm">
                <Sparkles className="w-3.5 h-3.5" />
                Agente Revisor Pericial • Skip Cloud
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-[#D9B36C]/10 text-amber-800 dark:text-[#D9B36C] border border-amber-300 dark:border-[#D9B36C]/30 text-[11px] font-semibold">
                <Scale className="w-3 h-3" />
                Triagem Pericial Automática — Pré-Laudo
              </span>
              {isDemo && (
                <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-[#3B82F6]/20 text-blue-700 dark:text-[#3B82F6] text-[10px] font-mono font-bold">
                  Demonstração Corporativa
                </span>
              )}
            </div>

            <h3 className="font-heading font-extrabold text-xl sm:text-2xl text-slate-900 dark:text-[#F4F7FA]">
              PARECER DE CONFORMIDADE METODOLÓGICA & AUDITORIA PRÉVIA
            </h3>
            <p className="text-xs text-slate-600 dark:text-[#93A3B5] mt-1.5 max-w-2xl leading-relaxed">
              {resumo_parecer}
            </p>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            {/* Bloco do Score Pericial */}
            <div className="p-4 rounded-xl bg-white dark:bg-[#0A0E12] border border-slate-200 dark:border-[rgba(244,247,250,0.12)] flex flex-col items-center justify-center min-w-[150px] shadow-sm">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-[#93A3B5]">
                Score Pericial
              </span>
              <div className={`font-heading font-black text-3xl sm:text-4xl ${scoreColor} mt-0.5`}>
                {score_pericial}
                <span className="text-xs font-normal text-slate-500 dark:text-[#93A3B5]">
                  {' '}
                  / 100
                </span>
              </div>
              <span className="text-[10px] text-slate-600 dark:text-[#93A3B5] mt-0.5 font-semibold text-center">
                {grau_conformidade}
              </span>
            </div>

            {onReexecutar && (
              <button
                type="button"
                onClick={onReexecutar}
                className="p-3 rounded-xl bg-white dark:bg-[#16202B] border border-slate-200 dark:border-[rgba(244,247,250,0.15)] text-slate-600 dark:text-[#93A3B5] hover:text-[#12B886] hover:border-[#12B886] transition-all shadow-sm"
                title="Reexecutar Triagem Pericial"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* 2. Banner de Esclarecimento Institucional: IA gera demanda, não substitui o perito */}
        <div className="mt-4 p-3.5 rounded-xl bg-white/80 dark:bg-[#0A0E12]/80 border border-slate-200 dark:border-[rgba(244,247,250,0.08)] flex items-start gap-3 text-xs text-slate-600 dark:text-[#93A3B5] shadow-sm">
          <Award className="w-4 h-4 text-amber-600 dark:text-[#D9B36C] shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong className="text-slate-900 dark:text-[#F4F7FA]">
              Posicionamento Regulatório & Ético:{' '}
            </strong>
            A inteligência artificial atua exclusivamente como ferramenta de triagem prévia
            (pré-laudo) para mapeamento de fragilidades e cálculo de incerteza. Apenas o{' '}
            <strong className="text-[#12B886]">
              Laudo Pericial formal com ART (CREA) ou RRT (CAU)
            </strong>{' '}
            assinado por perito técnico credenciado é o documento com responsabilidade técnica e
            aceitação perante o SBCE (Lei 15.042/2024), CVM (Resolução 244/2026) e auditorias
            contábeis NBC TO 3000 / ISAE 3000.
          </div>
        </div>

        {/* 3. ACHADOS PÚBLICOS (APENAS OS 2 DE MAIOR SEVERIDADE) */}
        <div className="mt-6 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-[#D9B36C]" />
              <span className="font-bold text-slate-900 dark:text-[#F4F7FA] uppercase tracking-wider">
                Achados Periciais Identificados (Amostra Pública de Triagem)
              </span>
            </div>
            <span className="text-[11px] text-slate-500 dark:text-[#93A3B5]">
              Exibindo <strong>{achados_publicos.length}</strong> de{' '}
              <strong>{resultado.achados_total}</strong> achados
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {achados_publicos.map((achado: AchadoPericial) => {
              const severidadeBadge =
                achado.severidade === 'alta'
                  ? 'bg-rose-50 dark:bg-[#F03E54]/15 text-rose-700 dark:text-[#F03E54] border-rose-200 dark:border-[#F03E54]/30'
                  : achado.severidade === 'media'
                    ? 'bg-amber-50 dark:bg-[#D9B36C]/15 text-amber-800 dark:text-[#D9B36C] border-amber-200 dark:border-[#D9B36C]/30'
                    : 'bg-emerald-50 dark:bg-[#12B886]/15 text-emerald-800 dark:text-[#12B886] border-emerald-200 dark:border-[#12B886]/30'

              return (
                <div
                  key={achado.id}
                  className="p-4 sm:p-5 rounded-xl bg-white dark:bg-[#0A0E12] border border-slate-200 dark:border-[rgba(244,247,250,0.1)] flex flex-col justify-between hover:border-[#12B886]/40 transition-all space-y-3 shadow-sm"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${severidadeBadge}`}
                      >
                        Severidade {achado.severidade}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500 dark:text-[#93A3B5]">
                        {achado.norma_referencia}
                      </span>
                    </div>

                    <h4 className="font-heading font-bold text-sm text-slate-900 dark:text-[#F4F7FA] leading-snug">
                      {achado.titulo}
                    </h4>

                    <p className="text-xs text-slate-600 dark:text-[#93A3B5] mt-2 leading-relaxed">
                      {achado.descricao}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-[rgba(244,247,250,0.06)] space-y-2 text-[11px]">
                    <div className="text-slate-600 dark:text-[#93A3B5]">
                      <strong className="text-amber-700 dark:text-[#D9B36C]">
                        Impacto no Laudo:{' '}
                      </strong>
                      {achado.impacto_risco}
                    </div>
                    <div className="text-emerald-800 dark:text-[#12B886] bg-emerald-50 dark:bg-[#12B886]/10 p-2 rounded-lg border border-emerald-200 dark:border-[#12B886]/20">
                      <strong>Recomendação Técnica: </strong>
                      {achado.recomendacao_acao}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* 4. PAYWALL CONTEXTUAL DOS ACHADOS OCULTOS */}
        {achados_ocultos_count > 0 && (
          <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-slate-100/80 via-white to-slate-100/80 dark:from-[#16202B]/80 dark:via-[#111820] dark:to-[#16202B]/80 border border-dashed border-slate-300 dark:border-[rgba(244,247,250,0.2)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-50 dark:bg-[#D9B36C]/10 text-amber-700 dark:text-[#D9B36C] shrink-0">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-slate-900 dark:text-[#F4F7FA] block">
                  +{achados_ocultos_count} achados de metodologia, integridade de insumos e
                  conformidade SBCE
                </span>
                <span className="text-[11px] text-slate-600 dark:text-[#93A3B5]">
                  O inventário gratuito exibe a triagem prévia. O relatório detalhado com a íntegra
                  dos achados, memória pericial de cálculo e histórico está disponível no laudo
                  formal.
                </span>
              </div>
            </div>

            <span className="text-[11px] font-mono text-amber-800 dark:text-[#D9B36C] bg-white dark:bg-[#0A0E12] px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[rgba(244,247,250,0.1)] shrink-0 shadow-sm">
              Desbloqueio com ART
            </span>
          </div>
        )}

        {/* 5. MOTOR DE CONVERSÃO / CTA CONTEXTUAL */}
        <div className="mt-6 pt-5 border-t border-slate-200 dark:border-[rgba(244,247,250,0.1)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#12B886] block">
              {infoPlano.badgeLabel}
            </span>
            <div className="font-heading font-extrabold text-base text-slate-900 dark:text-[#F4F7FA]">
              {infoPlano.titulo}
            </div>
            <p className="text-xs text-slate-600 dark:text-[#93A3B5]">
              Emita o laudo técnico definitivo assinado com ART e asseguração conforme NBC TO 3000.
            </p>
          </div>

          <Link
            to={`/checkout?servico=${plano_recomendado}`}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-xs uppercase tracking-wider bg-[#12B886] text-[#0A0E12] hover:bg-[#0CA678] transition-all shadow-emerald-glow shrink-0"
          >
            <span>{infoPlano.descricaoCta}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}
