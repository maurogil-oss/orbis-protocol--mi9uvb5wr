import React from 'react'
import { ResultadoComparativoTributario, FaixaImpactoTributario } from '@/services/tributosReforma'
import {
  TrendingUp,
  AlertTriangle,
  Scale,
  CheckCircle2,
  HelpCircle,
  ArrowRight,
  ShieldCheck,
  Building2,
  Globe2,
  Calendar,
  AlertCircle,
  Zap,
} from 'lucide-react'

interface Props {
  comparativo: ResultadoComparativoTributario
  regimeDeclarado?: string
  exportaUE?: boolean
  cbamBens?: string
  enquadramentoSBCE?: string
  onConfirmar?: () => void
  onVoltar?: () => void
  isSubmitting?: boolean
  modoRevisao?: boolean
}

export function ComparativoTributarioView({
  comparativo,
  regimeDeclarado,
  exportaUE,
  cbamBens,
  enquadramentoSBCE,
  onConfirmar,
  onVoltar,
  isSubmitting = false,
  modoRevisao = false,
}: Props) {
  const getBadgeImpacto = (faixa: FaixaImpactoTributario) => {
    switch (faixa) {
      case 'ganho_provavel':
        return {
          icon: TrendingUp,
          bg: 'bg-[#12B886]/10 border-[#12B886]/40 text-[#12B886]',
          badgeText: 'GANHO PROVÁVEL',
          glow: 'shadow-emerald-glow',
        }
      case 'ponto_atencao':
        return {
          icon: AlertTriangle,
          bg: 'bg-[#F03E54]/10 border-[#F03E54]/40 text-[#F03E54]',
          badgeText: 'PONTO DE ATENÇÃO',
          glow: '',
        }
      case 'neutro':
      default:
        return {
          icon: Scale,
          bg: 'bg-[#D9B36C]/10 border-[#D9B36C]/40 text-[#D9B36C]',
          badgeText: 'NEUTRO / ADAPTAÇÃO',
          glow: '',
        }
    }
  }

  const badge = getBadgeImpacto(comparativo.faixaImpacto)
  const IconImpacto = badge.icon

  return (
    <div className="space-y-6 animate-fade-in text-left text-slate-900 dark:text-[#F4F7FA]">
      {/* Cabeçalho da Etapa Comparativa */}
      <div className="border-b border-slate-200 dark:border-[rgba(244,247,250,0.08)] pb-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-[#16202B] border border-emerald-300 dark:border-[#12B886]/40 text-[#12B886] text-xs font-bold tracking-wider uppercase mb-2">
          <Scale className="w-3.5 h-3.5" />
          ETAPA FINAL • COMPARATIVO REFORMA TRIBUTÁRIA × PERFIL ESG
        </div>
        <h2 className="font-heading font-extrabold text-xl sm:text-2xl text-slate-900 dark:text-[#F4F7FA]">
          TRIBUTOS ATUAIS × DEPOIS DA REFORMA
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-[#93A3B5] mt-1">
          Cruzamento dos dados coletados (regime declarado, limiares SBCE e fronteira CBAM) com o
          modelo de transição IBS/CBS (EC 132/2023 + Lei Complementar).
        </p>
      </div>

      {/* Destaque da Faixa de Impacto Qualitativo */}
      <div className={`p-5 rounded-2xl border ${badge.bg} transition-all space-y-2 shadow-sm`}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/60 dark:bg-[#0A0E12]/60 shrink-0 shadow-sm">
              <IconImpacto className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono tracking-widest uppercase opacity-80 block">
                Classificação Preliminar
              </span>
              <span className="font-heading font-extrabold text-base sm:text-lg">
                {comparativo.tituloImpacto}
              </span>
            </div>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border shrink-0 ${badge.bg}`}
          >
            {badge.badgeText}
          </span>
        </div>
        <p className="text-xs text-slate-600 dark:text-[#93A3B5] leading-relaxed pl-1 pt-1">
          {comparativo.subtituloImpacto}
        </p>
      </div>

      {/* Mini Resumo das Variáveis do Perfil */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0A0E12] border border-slate-200 dark:border-[rgba(244,247,250,0.08)] shadow-sm">
          <span className="text-slate-600 dark:text-[#93A3B5] block text-[11px] flex items-center gap-1.5 mb-1">
            <Building2 className="w-3.5 h-3.5 text-[#12B886]" />
            Regime Declarado:
          </span>
          <span className="font-semibold text-slate-900 dark:text-[#F4F7FA]">
            {regimeDeclarado || 'A confirmar'}
          </span>
        </div>
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0A0E12] border border-slate-200 dark:border-[rgba(244,247,250,0.08)] shadow-sm">
          <span className="text-slate-600 dark:text-[#93A3B5] block text-[11px] flex items-center gap-1.5 mb-1">
            <Globe2 className="w-3.5 h-3.5 text-amber-600 dark:text-[#D9B36C]" />
            Exportação UE / CBAM:
          </span>
          <span className="font-semibold text-slate-900 dark:text-[#F4F7FA]">
            {exportaUE ? `Sim (${cbamBens || 'Bens cobertos'})` : 'Não'}
          </span>
        </div>
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0A0E12] border border-slate-200 dark:border-[rgba(244,247,250,0.08)] shadow-sm">
          <span className="text-slate-600 dark:text-[#93A3B5] block text-[11px] flex items-center gap-1.5 mb-1">
            <ShieldCheck className="w-3.5 h-3.5 text-[#12B886]" />
            Enquadramento SBCE:
          </span>
          <span
            className="font-semibold text-amber-700 dark:text-[#D9B36C] truncate block"
            title={enquadramentoSBCE}
          >
            {enquadramentoSBCE || 'Avaliação preliminar'}
          </span>
        </div>
      </div>

      {/* Destaque Específico se for Exportador CBAM */}
      {comparativo.destaqueExportacao && (
        <div className="p-4 rounded-xl bg-[#12B886]/10 border border-[#12B886]/30 text-xs text-[#F4F7FA] flex items-start gap-3">
          <CheckCircle2 className="w-4 h-4 text-[#12B886] shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <strong className="text-[#12B886] block uppercase tracking-wider text-[11px]">
              Vantagem Competitiva no Comércio Exterior
            </strong>
            <span className="text-[#93A3B5] leading-relaxed">{comparativo.destaqueExportacao}</span>
          </div>
        </div>
      )}

      {/* Tabela Comparativa Lado a Lado "Hoje × Depois da Reforma" */}
      <div className="rounded-xl border border-slate-200 dark:border-[rgba(244,247,250,0.12)] overflow-hidden bg-slate-50 dark:bg-[#0A0E12] shadow-sm">
        <div className="grid grid-cols-12 bg-slate-100 dark:bg-[#16202B] px-4 py-3 border-b border-slate-200 dark:border-[rgba(244,247,250,0.1)] text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-[#93A3B5]">
          <div className="col-span-12 sm:col-span-3 text-slate-900 dark:text-[#F4F7FA]">
            Tributo & Eixo
          </div>
          <div className="hidden sm:block sm:col-span-4 text-slate-600 dark:text-[#93A3B5]">
            Sistema Vigente (Hoje)
          </div>
          <div className="hidden sm:block sm:col-span-5 text-[#12B886]">Reforma (EC 132/2023)</div>
        </div>

        <div className="divide-y divide-slate-200 dark:divide-[rgba(244,247,250,0.08)]">
          {comparativo.linhas.map((linha, idx) => (
            <div
              key={idx}
              className="p-4 grid grid-cols-12 gap-3 items-start hover:bg-slate-100/60 dark:hover:bg-[#111820]/60 transition-colors"
            >
              {/* Eixo */}
              <div className="col-span-12 sm:col-span-3">
                <span className="font-heading font-bold text-sm text-slate-900 dark:text-[#F4F7FA] block">
                  {linha.tributo}
                </span>
                <span className="sm:hidden text-[11px] text-slate-500 dark:text-[#93A3B5] mt-1 block">
                  Visão comparada:
                </span>
              </div>

              {/* Hoje */}
              <div className="col-span-12 sm:col-span-4 text-xs">
                <span className="sm:hidden text-[10px] uppercase font-bold text-slate-500 dark:text-[#93A3B5] block mb-0.5">
                  Hoje:
                </span>
                <span className="text-slate-600 dark:text-[#93A3B5]">{linha.hoje}</span>
              </div>

              {/* Depois da Reforma + Reflexo no Caso Concreto */}
              <div className="col-span-12 sm:col-span-5 text-xs space-y-1.5">
                <span className="sm:hidden text-[10px] uppercase font-bold text-[#12B886] block mb-0.5">
                  Depois da Reforma:
                </span>
                <span className="text-slate-900 dark:text-[#F4F7FA] font-medium block">
                  {linha.reforma}
                </span>
                <div className="p-2.5 rounded-lg bg-white dark:bg-[#16202B]/80 border border-slate-200 dark:border-[rgba(244,247,250,0.06)] text-[11px] text-slate-600 dark:text-[#93A3B5] leading-relaxed shadow-sm">
                  <strong className="text-amber-700 dark:text-[#D9B36C] block text-[10px] uppercase tracking-wider mb-0.5">
                    Reflexo no perfil da empresa:
                  </strong>
                  {linha.detalhePersonalizado}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bloco Destaque: IBS/CBS na Fase-Teste (Art. 348 LC 214/2025 e Decreto 12.955/2026) */}
      {comparativo.faseTesteIbsCbs && (
        <div
          className={`p-5 rounded-2xl border transition-all text-xs space-y-3 ${
            comparativo.faseTesteIbsCbs.possuiDestaqueReal
              ? 'bg-[#12B886]/10 border-[#12B886]/40'
              : 'bg-[#16202B] border-[#D9B36C]/30'
          }`}
        >
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2.5">
              <div
                className={`p-2 rounded-xl shrink-0 ${
                  comparativo.faseTesteIbsCbs.possuiDestaqueReal
                    ? 'bg-[#12B886]/20 text-[#12B886]'
                    : 'bg-[#D9B36C]/20 text-[#D9B36C]'
                }`}
              >
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-mono tracking-wider uppercase text-[#93A3B5] block">
                  Regulamentação Oficial • LC 227/2026 e Decreto 12.955/2026
                </span>
                <h3 className="font-heading font-extrabold text-sm text-[#F4F7FA]">
                  IBS/CBS NA FASE-TESTE (A PARTIR DE 1º/08/2026)
                </h3>
              </div>
            </div>

            <span
              className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                comparativo.faseTesteIbsCbs.possuiDestaqueReal
                  ? 'bg-[#12B886]/20 text-[#12B886] border-[#12B886]/40'
                  : 'bg-[#D9B36C]/20 text-[#D9B36C] border-[#D9B36C]/40'
              }`}
            >
              {comparativo.faseTesteIbsCbs.possuiDestaqueReal
                ? 'DADOS REAIS EXTRAÍDOS'
                : 'ALERTA DE OBRIGATORIEDADE'}
            </span>
          </div>

          {comparativo.faseTesteIbsCbs.possuiDestaqueReal ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div className="p-3 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.08)]">
                <span className="text-[10px] text-[#93A3B5] uppercase block mb-0.5">
                  IBS Real Destacado
                </span>
                <span className="text-base font-heading font-bold text-[#12B886]">
                  R${' '}
                  {comparativo.faseTesteIbsCbs.valorIbsReal.toLocaleString('pt-BR', {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.08)]">
                <span className="text-[10px] text-[#93A3B5] uppercase block mb-0.5">
                  CBS Real Destacada
                </span>
                <span className="text-base font-heading font-bold text-[#12B886]">
                  R${' '}
                  {comparativo.faseTesteIbsCbs.valorCbsReal.toLocaleString('pt-BR', {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.08)]">
                <span className="text-[10px] text-[#93A3B5] uppercase block mb-0.5">
                  Total IBS + CBS
                </span>
                <span className="text-base font-heading font-bold text-[#F4F7FA]">
                  R${' '}
                  {comparativo.faseTesteIbsCbs.valorTotalIbsCbs.toLocaleString('pt-BR', {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-[#0A0E12] border border-[#D9B36C]/30 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-[#D9B36C] shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-xs text-[#F4F7FA] font-medium leading-relaxed">
                  {comparativo.faseTesteIbsCbs.mensagem}
                </p>
                <div className="text-[11px] text-[#93A3B5]">
                  <span>Regra de dispensa: </span>
                  <strong className="text-[#D9B36C]">
                    Recolhimento dispensado se as obrigações acessórias forem cumpridas (art. 348 da
                    LC 214/2025).
                  </strong>
                </div>
              </div>
            </div>
          )}

          <div className="text-[11px] text-[#93A3B5] flex items-center justify-between border-t border-[rgba(244,247,250,0.08)] pt-2.5">
            <span>Base Legal: {comparativo.faseTesteIbsCbs.baseLegal}</span>
            <span className="font-semibold text-[#12B886]">Prazo: 1º/08/2026</span>
          </div>
        </div>
      )}

      {/* Bloco Destaque: Imposto Seletivo por NCM (LC 214/2025) */}
      {comparativo.impostoSeletivoAnalise &&
        comparativo.impostoSeletivoAnalise.possuiItensIdentificados && (
          <div className="p-5 rounded-2xl bg-[#F03E54]/10 border border-[#F03E54]/40 text-xs space-y-3">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#F03E54]/20 text-[#F03E54] shrink-0">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-mono tracking-wider uppercase text-[#F03E54] block font-bold">
                    Classificação Específica LC 214/2025
                  </span>
                  <h3 className="font-heading font-extrabold text-sm text-[#F4F7FA]">
                    ITENS SUJEITOS AO IMPOSTO SELETIVO (IS) DETECTADOS
                  </h3>
                </div>
              </div>

              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#F03E54]/20 text-[#F03E54] border border-[#F03E54]/40">
                {comparativo.impostoSeletivoAnalise.totalItensIdentificados} ITEM(NS) AFETADO(S)
              </span>
            </div>

            <p className="text-xs text-[#F4F7FA] leading-relaxed">
              {comparativo.impostoSeletivoAnalise.mensagem}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              {comparativo.impostoSeletivoAnalise.categoriasEncontradas.map((cat, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-lg bg-[#0A0E12] border border-[#F03E54]/30 flex flex-col justify-between"
                >
                  <div className="font-bold text-[#F4F7FA] text-xs">{cat.categoria}</div>
                  <div className="text-[11px] text-[#93A3B5] mt-1">
                    <span>Itens classificados: </span>
                    <strong className="text-[#F03E54]">{cat.count}</strong> • {cat.aliquota}
                  </div>
                </div>
              ))}
            </div>

            <div className="text-[11px] text-[#93A3B5] border-t border-[rgba(244,247,250,0.08)] pt-2 flex justify-between items-center">
              <span>Fonte: {comparativo.impostoSeletivoAnalise.fonte}</span>
              <span className="text-[#D9B36C] font-mono">Estimativa pericial de impacto</span>
            </div>
          </div>
        )}

      {/* Informação sobre a fase de testes e transição */}
      <div className="p-4 rounded-xl bg-white dark:bg-[#111820] border border-slate-200 dark:border-[rgba(244,247,250,0.08)] space-y-1 text-xs shadow-sm">
        <div className="flex items-center gap-2 text-amber-700 dark:text-[#D9B36C]">
          <HelpCircle className="w-4 h-4 shrink-0" />
          <strong className="uppercase tracking-wider text-[11px]">
            Cronograma Oficial de Transição
          </strong>
        </div>
        <p className="text-slate-600 dark:text-[#93A3B5] leading-relaxed pl-6">
          {comparativo.transicaoInfo}
        </p>
      </div>

      {/* Disclaimer Regulatório Obrigatório */}
      <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0A0E12] border border-slate-200 dark:border-[rgba(244,247,250,0.1)] text-[11px] text-slate-500 dark:text-[#93A3B5]/80 leading-relaxed italic">
        <strong>Aviso Regulatório:</strong> {comparativo.disclaimer}
      </div>

      {/* Ações de navegação do wizard (se não estiver em modo de apenas revisão) */}
      {!modoRevisao && onConfirmar && onVoltar && (
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-[rgba(244,247,250,0.08)]">
          <button
            type="button"
            onClick={onVoltar}
            className="w-full sm:w-auto px-5 py-3 rounded-xl font-semibold border border-[rgba(244,247,250,0.2)] text-[#93A3B5] hover:text-[#F4F7FA] transition-colors"
          >
            Voltar ao Termo LGPD
          </button>
          <button
            type="button"
            onClick={onConfirmar}
            disabled={isSubmitting}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-bold bg-[#12B886] text-[#0A0E12] hover:bg-[#0CA678] transition-all shadow-emerald-glow disabled:opacity-50"
          >
            {isSubmitting ? 'Gerando Protocolo...' : 'Concluir Diagnóstico com Comparativo'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  )
}
