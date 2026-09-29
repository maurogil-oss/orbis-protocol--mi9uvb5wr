import React, { useState } from 'react'
import {
  Scale,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  Recycle,
  Sparkles,
  Layers,
  Flame,
  Droplets,
  Info,
  TrendingUp,
  Percent,
  HelpCircle,
  Filter,
  ShieldAlert,
} from 'lucide-react'
import type { BalancoMassaVeiculo, ItemBalancoMassa } from '@/services/destinacaoFinalService'

export type FiltroLrTaxonomia = 'todos' | 'sujeito_lr_11413' | 'convencional'

interface BalancoMassaVeiculoSectionProps {
  balanco: BalancoMassaVeiculo
  veiculoModelo?: string
  veiculoBaixa?: string
  isModoCompacto?: boolean
}

export function BalancoMassaVeiculoSection({
  balanco,
  veiculoModelo,
  veiculoBaixa,
  isModoCompacto = false,
}: BalancoMassaVeiculoSectionProps) {
  const [copiedHash, setCopiedHash] = useState(false)
  const [itemDetalheAberto, setItemDetalheAberto] = useState<string | null>(null)
  const [filtroLr, setFiltroLr] = useState<FiltroLrTaxonomia>('todos')

  const copyHash = () => {
    if (!balanco.hashBalancoSha256) return
    navigator.clipboard.writeText(balanco.hashBalancoSha256)
    setCopiedHash(true)
    setTimeout(() => setCopiedHash(false), 2000)
  }

  // Ícones por categoria do balanço
  const getCategoriaIcon = (cat: ItemBalancoMassa['categoria']) => {
    switch (cat) {
      case 'reuso_circular':
        return <Sparkles className="w-4 h-4 text-emerald-600 dark:text-[#12B886]" />
      case 'metais_reciclagem':
        return <Flame className="w-4 h-4 text-blue-600 dark:text-[#3B82F6]" />
      case 'despoluicao_gate':
        return <ShieldCheck className="w-4 h-4 text-emerald-700 dark:text-[#10B981]" />
      case 'oleo_rlo':
        return <Droplets className="w-4 h-4 text-amber-600 dark:text-[#D9B36C]" />
      case 'perdas_processo':
        return <Layers className="w-4 h-4 text-slate-500 dark:text-[#93A3B5]" />
      default:
        return <Recycle className="w-4 h-4 text-emerald-600 dark:text-[#12B886]" />
    }
  }

  return (
    <div className="rounded-3xl bg-white dark:bg-[#111820] border-2 border-emerald-500/40 dark:border-[#12B886]/40 shadow-sm dark:shadow-emerald-glow overflow-hidden text-slate-900 dark:text-[#F4F7FA]">
      {/* CABEÇALHO DO BLOCO */}
      <div className="p-5 sm:p-7 bg-gradient-to-r from-slate-50 via-slate-100/70 to-slate-50 dark:from-[#111820] dark:via-[#16202B] dark:to-[#111820] border-b border-slate-200 dark:border-[rgba(244,247,250,0.1)]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-[#12B886]/15 border border-emerald-200 dark:border-[#12B886]/40 text-emerald-700 dark:text-[#12B886] text-[11px] font-bold uppercase tracking-wider">
                <Scale className="w-3.5 h-3.5" />
                INDICADOR OFICIAL • BALANÇO DE MASSA DO VEÍCULO DOADOR
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-[#D9B36C]/20 border border-amber-200 dark:border-[#D9B36C]/50 text-amber-700 dark:text-[#D9B36C] text-[10px] font-mono font-bold uppercase">
                ESTIMATIVA CURBSIDE
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-[#3B82F6]/20 border border-blue-200 dark:border-[#3B82F6]/40 text-blue-700 dark:text-[#60A5FA] text-[10px] font-mono font-bold uppercase">
                DIRETIVA ELV 2000/53/EC
              </span>
            </div>

            <h3 className="font-heading font-black text-xl sm:text-2xl text-slate-900 dark:text-[#F4F7FA] tracking-wide">
              Balanço de Massa & Taxa de Valorização Circular (%RRR)
            </h3>

            <p className="text-xs text-slate-600 dark:text-[#93A3B5] max-w-3xl leading-relaxed">
              Consolidação analítica dos fluxos ponderais do veículo doador{' '}
              {veiculoModelo ? (
                <strong className="text-slate-900 dark:text-[#F4F7FA]">{veiculoModelo}</strong>
              ) : (
                ''
              )}
              : reúso circular com selo DPP, destinação final segregada (gate de despoluição, RLO e
              metais) e resíduo de processo frente à meta de valorização da Diretiva ELV 2000/53/EC.
            </p>
          </div>

          {/* Destaque Curbside Estimado */}
          <div className="shrink-0 p-4 rounded-2xl bg-slate-50 dark:bg-[#0A0E12] border border-emerald-500/30 dark:border-[#12B886]/40 min-w-[240px]">
            <div className="flex items-center justify-between text-[10px] uppercase font-bold text-slate-500 dark:text-[#93A3B5] tracking-wider mb-1">
              <span>Massa Estimada (Curbside)</span>
              <span className="font-mono text-amber-700 dark:text-[#D9B36C]">± Referência</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-heading font-black text-2xl sm:text-3xl text-emerald-600 dark:text-[#12B886]">
                {balanco.massaEstimadaVeiculoKg.toLocaleString('pt-BR', {
                  minimumFractionDigits: 1,
                  maximumFractionDigits: 1,
                })}
              </span>
              <span className="text-xs text-slate-500 dark:text-[#93A3B5] font-mono">
                kg (tara estimada)
              </span>
            </div>
            <div className="text-[10px] text-slate-500 dark:text-[#93A3B5] mt-1 line-clamp-2 leading-tight">
              {balanco.fonteEstimativaVeiculo}
            </div>
          </div>
        </div>
      </div>

      <div className="p-5 sm:p-7 space-y-6">
        {/* CARDS COM OS 4 INDICADORES CENTRAIS DO BALANÇO */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* 1. Reúso Circular */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#0A0E12] border border-emerald-500/40 dark:border-[#12B886]/50 relative overflow-hidden group">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-bold text-emerald-700 dark:text-[#12B886] flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                Reúso Circular
              </span>
              <span className="text-[10px] font-mono font-bold text-emerald-800 dark:text-[#12B886] bg-emerald-100 dark:bg-[#12B886]/10 px-2 py-0.5 rounded-full">
                {balanco.percentualReusoPct.toFixed(1)}%
              </span>
            </div>
            <div className="font-heading font-black text-xl sm:text-2xl text-emerald-700 dark:text-[#12B886] mt-1">
              {balanco.massaCircularRecuperadaKg.toLocaleString('pt-BR', {
                minimumFractionDigits: 1,
                maximumFractionDigits: 2,
              })}{' '}
              <span className="text-xs font-normal text-slate-500 dark:text-[#93A3B5]">kg</span>
            </div>
            <p className="text-[10px] text-slate-600 dark:text-[#93A3B5] mt-1 leading-snug">
              Peças íntegras catalogadas no DPP Consolidado
            </p>
          </div>

          {/* 2. Destinação Final Total */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#0A0E12] border border-blue-400/40 dark:border-[#3B82F6]/50 relative overflow-hidden">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-bold text-blue-700 dark:text-[#60A5FA] flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                <Flame className="w-3.5 h-3.5" />
                Destinação Final
              </span>
              <span className="text-[10px] font-mono font-bold text-blue-800 dark:text-[#60A5FA] bg-blue-100 dark:bg-[#3B82F6]/10 px-2 py-0.5 rounded-full">
                {balanco.percentualReciclagemDestinacaoPct.toFixed(1)}%
              </span>
            </div>
            <div className="font-heading font-black text-xl sm:text-2xl text-blue-700 dark:text-[#60A5FA] mt-1">
              {balanco.massaDestinacaoFinalTotalKg.toLocaleString('pt-BR', {
                minimumFractionDigits: 1,
                maximumFractionDigits: 2,
              })}{' '}
              <span className="text-xs font-normal text-slate-500 dark:text-[#93A3B5]">kg</span>
            </div>
            <p className="text-[10px] text-slate-600 dark:text-[#93A3B5] mt-1 leading-snug">
              Gate (bateria/pneus) + RLO + Metais/Aciaria
            </p>
          </div>

          {/* 3. Valorização Total (% RRR) */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#0A0E12] border-2 border-emerald-600 dark:border-[#12B886] relative overflow-hidden">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-bold text-slate-900 dark:text-[#F4F7FA] flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600 dark:text-[#12B886]" />
                Taxa Valorização Total
              </span>
              <span className="text-[10px] font-mono font-black text-emerald-800 dark:text-[#12B886] bg-emerald-100 dark:bg-[#12B886]/20 px-2 py-0.5 rounded-full border border-emerald-300 dark:border-[#12B886]/40">
                {balanco.percentualValorizacaoTotalPct.toFixed(1)}%
              </span>
            </div>
            <div className="font-heading font-black text-xl sm:text-2xl text-slate-900 dark:text-[#F4F7FA] mt-1">
              {balanco.massaValorizadaTotalKg.toLocaleString('pt-BR', {
                minimumFractionDigits: 1,
                maximumFractionDigits: 2,
              })}{' '}
              <span className="text-xs font-normal text-slate-500 dark:text-[#93A3B5]">kg</span>
            </div>
            <p className="text-[10px] text-emerald-700 dark:text-[#12B886] mt-1 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Reúso + Reciclagem homologados
            </p>
          </div>

          {/* 4. Perdas de Processo / Não Rastreado */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#0A0E12] border border-slate-200 dark:border-[rgba(244,247,250,0.1)] relative overflow-hidden">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-bold text-slate-600 dark:text-[#93A3B5] flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                <Layers className="w-3.5 h-3.5 text-slate-500 dark:text-[#64748B]" />
                Perdas / Processo
              </span>
              <span className="text-[10px] font-mono font-bold text-slate-600 dark:text-[#93A3B5] bg-slate-100 dark:bg-[#16202B] px-2 py-0.5 rounded-full">
                {balanco.percentualPerdasPct.toFixed(1)}%
              </span>
            </div>
            <div className="font-heading font-black text-xl sm:text-2xl text-slate-800 dark:text-[#93A3B5] mt-1">
              {balanco.massaPerdasProcessoKg.toLocaleString('pt-BR', {
                minimumFractionDigits: 1,
                maximumFractionDigits: 2,
              })}{' '}
              <span className="text-xs font-normal text-slate-500 dark:text-[#64748B]">kg</span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-[#93A3B5] mt-1 leading-snug">
              Fração residual, estofamentos ou não triada
            </p>
          </div>
        </div>

        {/* BARRA HORIZONTAL DE COMPOSIÇÃO PERCENTUAL (% PONDERADA SOBRE A MASSA CURBSIDE) */}
        <div className="p-5 rounded-2xl bg-slate-50 dark:bg-[#0A0E12] border border-slate-200 dark:border-[rgba(244,247,250,0.08)] space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Percent className="w-4 h-4 text-emerald-600 dark:text-[#12B886]" />
              <span className="font-heading font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-[#F4F7FA]">
                Composição Ponderada da Massa do Veículo ({balanco.massaEstimadaVeiculoKg} kg =
                100%)
              </span>
            </div>
            <span className="text-[11px] font-mono text-amber-700 dark:text-[#D9B36C]">
              Valorização Efetiva:{' '}
              <strong className="text-emerald-700 dark:text-[#12B886]">
                {balanco.percentualValorizacaoTotalPct.toFixed(1)}%
              </strong>
            </span>
          </div>

          {/* Barra Stacked */}
          <div className="h-6 w-full rounded-xl bg-slate-200 dark:bg-[#16202B] overflow-hidden flex shadow-inner border border-slate-300 dark:border-[rgba(244,247,250,0.08)]">
            {balanco.itens.map((item) => {
              if (item.percentual <= 0) return null
              return (
                <div
                  key={item.categoria}
                  style={{
                    width: `${item.percentual}%`,
                    backgroundColor: item.cor,
                  }}
                  className="h-full relative group transition-all duration-300 hover:brightness-110 flex items-center justify-center text-[10px] font-mono font-bold text-[#0A0E12] overflow-hidden px-1"
                  title={`${item.rotulo}: ${item.massaKg.toFixed(1)} kg (${item.percentual.toFixed(1)}%)`}
                >
                  {item.percentual >= 8 && <span>{item.percentual.toFixed(0)}%</span>}
                </div>
              )
            })}
          </div>

          {/* Legenda Dinâmica da Barra */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 pt-2 text-[11px]">
            {balanco.itens.map((item) => (
              <div
                key={item.categoria}
                className="flex items-start gap-2 p-2 rounded-xl bg-white dark:bg-[#111820]/70 border border-slate-200 dark:border-[rgba(244,247,250,0.04)] shadow-xs"
              >
                <span
                  className="w-3 h-3 rounded-full shrink-0 mt-0.5"
                  style={{ backgroundColor: item.cor }}
                />
                <div className="min-w-0 flex-1">
                  <div
                    className="text-[10px] font-bold text-slate-900 dark:text-[#F4F7FA] truncate"
                    title={item.rotulo}
                  >
                    {item.rotulo.split('(')[0].trim()}
                  </div>
                  <div className="text-[10px] font-mono text-slate-500 dark:text-[#93A3B5] flex items-center justify-between">
                    <span>{item.massaKg.toFixed(1)} kg</span>
                    <strong className="text-amber-700 dark:text-[#D9B36C]">
                      {item.percentual.toFixed(1)}%
                    </strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* PARÂMETRO COMPARATIVO: DIRETIVA ELV 2000/53/EC (META EUROPEIA DE REÚSO, RECICLAGEM E VALORIZAÇÃO) */}
        <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-50/70 via-white to-blue-50/70 dark:from-[#111820] dark:via-[#16202B] dark:to-[#111820] border-2 border-blue-400/50 dark:border-[#3B82F6]/40 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-blue-200 dark:border-[rgba(244,247,250,0.08)]">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 dark:bg-[#3B82F6] animate-pulse" />
              <span className="font-heading font-extrabold text-xs uppercase tracking-wider text-blue-700 dark:text-[#60A5FA]">
                BENCHMARK INTERNACIONAL • DIRETIVA ELV 2000/53/EC (END-OF-LIFE VEHICLES)
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-600 dark:text-[#93A3B5]">
              Art. 7º • Metas %RRR (Reuse, Recycling and Recovery)
            </span>
          </div>

          <p className="text-xs text-slate-600 dark:text-[#93A3B5] leading-relaxed">
            A Diretiva 2000/53/EC do Parlamento Europeu estabelece os parâmetros técnicos globais de
            referência para a gestão de veículos em fim de vida: meta mínima de{' '}
            <strong className="text-slate-900 dark:text-[#F4F7FA]">
              85% para Reúso e Reciclagem
            </strong>{' '}
            de massa por veículo e meta mínima de{' '}
            <strong className="text-emerald-700 dark:text-[#12B886]">
              95% para Valorização Total
            </strong>{' '}
            (incluindo recuperação energética).
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            {/* Meta 1: 85% Reúso + Reciclagem */}
            <div className="p-4 rounded-xl bg-white dark:bg-[#0A0E12] border border-slate-200 dark:border-[rgba(244,247,250,0.08)] space-y-2 shadow-xs">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900 dark:text-[#F4F7FA]">
                  Meta 1: Reúso + Reciclagem (≥ 85%)
                </span>
                <span
                  className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    balanco.atingiuMetaReusoReciclagem
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-[#12B886]/15 dark:text-[#12B886] dark:border-[#12B886]/30'
                      : 'bg-amber-100 text-amber-800 border border-amber-300 dark:bg-[#F59E0B]/15 dark:text-[#F59E0B] dark:border-[#F59E0B]/30'
                  }`}
                >
                  {balanco.atingiuMetaReusoReciclagem ? (
                    <>
                      <CheckCircle2 className="w-3 h-3" />
                      Atingida ({balanco.percentualValorizacaoTotalPct.toFixed(1)}%)
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-3 h-3" />
                      Em Progresso ({balanco.percentualValorizacaoTotalPct.toFixed(1)}% / 85%)
                    </>
                  )}
                </span>
              </div>

              {/* Barra de Progresso Meta 1 */}
              <div className="space-y-1">
                <div className="h-2.5 w-full bg-slate-200 dark:bg-[#16202B] rounded-full overflow-hidden flex">
                  <div
                    style={{
                      width: `${Math.min(balanco.percentualValorizacaoTotalPct, 100)}%`,
                    }}
                    className={`h-full ${
                      balanco.atingiuMetaReusoReciclagem
                        ? 'bg-emerald-600 dark:bg-[#12B886]'
                        : 'bg-amber-500 dark:bg-[#D9B36C]'
                    }`}
                  />
                </div>
                <div className="flex justify-between text-[10px] font-mono text-slate-500 dark:text-[#93A3B5]">
                  <span>Apurado no Lote: {balanco.percentualValorizacaoTotalPct.toFixed(1)}%</span>
                  <span>Alvo Regulatório: 85,0%</span>
                </div>
              </div>
            </div>

            {/* Meta 2: 95% Valorização Total */}
            <div className="p-4 rounded-xl bg-white dark:bg-[#0A0E12] border border-slate-200 dark:border-[rgba(244,247,250,0.08)] space-y-2 shadow-xs">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900 dark:text-[#F4F7FA]">
                  Meta 2: Valorização Total (≥ 95%)
                </span>
                <span
                  className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    balanco.atingiuMetaValorizacaoTotal
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-[#12B886]/15 dark:text-[#12B886] dark:border-[#12B886]/30'
                      : 'bg-blue-100 text-blue-800 border border-blue-300 dark:bg-[#3B82F6]/15 dark:text-[#60A5FA] dark:border-[#3B82F6]/30'
                  }`}
                >
                  {balanco.atingiuMetaValorizacaoTotal ? (
                    <>
                      <CheckCircle2 className="w-3 h-3" />
                      Atingida ({balanco.percentualValorizacaoTotalPct.toFixed(1)}%)
                    </>
                  ) : (
                    <>
                      <Info className="w-3 h-3" />
                      Diferencial Restante:{' '}
                      {(95.0 - balanco.percentualValorizacaoTotalPct).toFixed(1)}%
                    </>
                  )}
                </span>
              </div>

              {/* Barra de Progresso Meta 2 */}
              <div className="space-y-1">
                <div className="h-2.5 w-full bg-slate-200 dark:bg-[#16202B] rounded-full overflow-hidden flex">
                  <div
                    style={{
                      width: `${Math.min(balanco.percentualValorizacaoTotalPct, 100)}%`,
                    }}
                    className={`h-full ${
                      balanco.atingiuMetaValorizacaoTotal
                        ? 'bg-emerald-600 dark:bg-[#12B886]'
                        : 'bg-blue-600 dark:bg-[#3B82F6]'
                    }`}
                  />
                </div>
                <div className="flex justify-between text-[10px] font-mono text-slate-500 dark:text-[#93A3B5]">
                  <span>Apurado no Lote: {balanco.percentualValorizacaoTotalPct.toFixed(1)}%</span>
                  <span>Alvo Pleno: 95,0%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* TABELA DISCRIMINADA DAS FRAÇÕES DO BALANÇO DE MASSA COM FILTRO E BADGES LR DECRETO 11.413/2023 */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="font-heading font-bold text-xs uppercase tracking-wider text-slate-600 dark:text-[#93A3B5]">
                Detalhamento de Fluxos Ponderais & Rastreabilidade de Saída
              </span>
            </div>

            {/* Filtro Interativo de Taxonomia LR */}
            <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 dark:bg-[#0A0E12] p-1 rounded-xl border border-slate-200 dark:border-[rgba(244,247,250,0.08)]">
              <span className="text-[10px] text-slate-600 dark:text-[#93A3B5] px-2 flex items-center gap-1 font-semibold">
                <Filter className="w-3 h-3 text-emerald-600 dark:text-[#12B886]" />
                Taxonomia LR:
              </span>
              <button
                type="button"
                onClick={() => setFiltroLr('todos')}
                className={`text-[10px] font-mono px-2.5 py-1 rounded-lg transition-all ${
                  filtroLr === 'todos'
                    ? 'bg-emerald-600 text-white dark:bg-[#12B886] dark:text-[#0A0E12] font-bold shadow'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white dark:text-[#93A3B5] dark:hover:text-[#F4F7FA] dark:hover:bg-[#16202B]'
                }`}
              >
                Todos ({balanco.itens.length})
              </button>
              <button
                type="button"
                onClick={() => setFiltroLr('sujeito_lr_11413')}
                className={`text-[10px] font-mono px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
                  filtroLr === 'sujeito_lr_11413'
                    ? 'bg-amber-600 text-white dark:bg-[#D9B36C] dark:text-[#0A0E12] font-bold shadow'
                    : 'text-amber-700 dark:text-[#D9B36C] hover:bg-amber-100/70 dark:hover:bg-[#D9B36C]/15'
                }`}
              >
                <ShieldAlert className="w-3 h-3" />
                LR Dec. 11.413 (
                {
                  balanco.itens.filter(
                    (i) => i.categoria === 'despoluicao_gate' || i.categoria === 'oleo_rlo',
                  ).length
                }
                )
              </button>
              <button
                type="button"
                onClick={() => setFiltroLr('convencional')}
                className={`text-[10px] font-mono px-2.5 py-1 rounded-lg transition-all ${
                  filtroLr === 'convencional'
                    ? 'bg-blue-600 text-white dark:bg-[#3B82F6] dark:text-[#0A0E12] font-bold shadow'
                    : 'text-blue-700 dark:text-[#60A5FA] hover:bg-blue-100/70 dark:hover:bg-[#3B82F6]/15'
                }`}
              >
                Convencional (
                {
                  balanco.itens.filter(
                    (i) => i.categoria === 'metais_reciclagem' || i.categoria === 'reuso_circular',
                  ).length
                }
                )
              </button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-[rgba(244,247,250,0.08)] bg-white dark:bg-[#0A0E12]">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 dark:border-[rgba(244,247,250,0.08)] text-slate-600 dark:text-[#93A3B5] uppercase font-semibold text-[10px] bg-slate-50 dark:bg-[#111820]">
                <tr>
                  <th className="py-2.5 px-3">Fração / Destino Ponderal</th>
                  <th className="py-2.5 px-3">Taxonomia Decreto 11.413/2023</th>
                  <th className="py-2.5 px-3">Tipo de Destinação</th>
                  <th className="py-2.5 px-3 text-right">Massa (kg)</th>
                  <th className="py-2.5 px-3 text-right">% Veículo Doador</th>
                  <th className="py-2.5 px-3 text-center">Enquadramento ELV</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[rgba(244,247,250,0.04)] text-slate-800 dark:text-[#F4F7FA]">
                {balanco.itens
                  .filter((item) => {
                    const isLrObrigatoria =
                      item.categoria === 'despoluicao_gate' || item.categoria === 'oleo_rlo'
                    if (filtroLr === 'sujeito_lr_11413') return isLrObrigatoria
                    if (filtroLr === 'convencional') return !isLrObrigatoria
                    return true
                  })
                  .map((item) => {
                    const isLrObrigatoria =
                      item.categoria === 'despoluicao_gate' || item.categoria === 'oleo_rlo'

                    return (
                      <tr
                        key={item.categoria}
                        className="hover:bg-slate-50 dark:hover:bg-[#16202B]/50 transition-colors"
                      >
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            {getCategoriaIcon(item.categoria)}
                            <div>
                              <div className="font-semibold text-slate-900 dark:text-[#F4F7FA]">
                                {item.rotulo}
                              </div>
                              <div className="text-[10px] text-slate-500 dark:text-[#93A3B5] line-clamp-1">
                                {item.descricao}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          {isLrObrigatoria ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 dark:bg-[#D9B36C]/15 dark:text-[#D9B36C] dark:border-[#D9B36C]/40">
                              <ShieldAlert className="w-3 h-3 text-amber-700 dark:text-[#D9B36C]" />
                              Sujeito à LR Dec. 11.413
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200 dark:bg-[#16202B] dark:text-[#93A3B5] dark:border-[rgba(244,247,250,0.08)]">
                              Metal Convencional / Reúso
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 font-mono text-[11px] text-slate-600 dark:text-[#93A3B5]">
                          {item.tipoFluxoResumo}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-amber-700 dark:text-[#D9B36C] whitespace-nowrap">
                          {item.massaKg.toLocaleString('pt-BR', {
                            minimumFractionDigits: 1,
                            maximumFractionDigits: 2,
                          })}{' '}
                          kg
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold whitespace-nowrap">
                          <span
                            className="px-2 py-0.5 rounded text-[11px]"
                            style={{
                              backgroundColor: `${item.cor}25`,
                              color: item.cor,
                            }}
                          >
                            {item.percentual.toFixed(1)}%
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          {item.categoria === 'perdas_processo' ? (
                            <span className="text-[10px] font-mono text-slate-600 dark:text-[#93A3B5] bg-slate-100 dark:bg-[#16202B] px-2 py-0.5 rounded">
                              Fração Não Recuperada
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300 dark:text-[#12B886] dark:bg-[#12B886]/10 dark:border-[#12B886]/20">
                              <CheckCircle2 className="w-3 h-3" />
                              Valorização Computada
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
              </tbody>
            </table>
          </div>
        </div>

        {/* HASH SHA-256 DO BALANÇO & CLÁUSULA DE RESERVA PRÉ-LAUDO */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-[#0A0E12] border border-emerald-500/35 dark:border-[#12B886]/35 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-[rgba(244,247,250,0.08)] pb-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-[#12B886]" />
              <span className="font-heading font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-[#F4F7FA]">
                HASH SHA-256 CANÔNICO DO BALANÇO DE MASSA
              </span>
            </div>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 dark:text-[#12B886] bg-emerald-100 dark:bg-[#12B886]/15 px-2 py-0.5 rounded-full border border-emerald-300 dark:border-[#12B886]/30">
              <CheckCircle2 className="w-3 h-3" />
              Determinístico & Auditável ✓
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-[#111820] p-2.5 sm:p-3 rounded-xl border border-slate-200 dark:border-[rgba(244,247,250,0.06)] shadow-xs">
            <div className="min-w-0 flex-1">
              <span className="text-[9px] font-mono text-slate-500 dark:text-[#93A3B5] uppercase block">
                Prova Criptográfica Lexicográfica do Balanço Ponderal
              </span>
              <span className="font-mono text-[11px] sm:text-xs text-amber-700 dark:text-[#D9B36C] break-all select-all font-semibold">
                {balanco.hashBalancoSha256}
              </span>
            </div>
            <button
              type="button"
              onClick={copyHash}
              className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-[#16202B] text-xs font-semibold text-slate-700 dark:text-[#93A3B5] hover:text-slate-900 dark:hover:text-[#F4F7FA] hover:bg-emerald-50 dark:hover:bg-[#12B886]/20 transition-all flex items-center gap-1.5 shrink-0 self-start sm:self-center border border-slate-200 dark:border-transparent"
            >
              {copiedHash ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-[#12B886]" />
                  <span className="text-emerald-700 dark:text-[#12B886]">Copiado</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar Hash</span>
                </>
              )}
            </button>
          </div>

          {/* Cláusula Estrita de Reserva Pré-Laudo */}
          <div className="p-3 rounded-xl bg-white dark:bg-[#111820] border border-amber-200 dark:border-[#D9B36C]/30 text-[10px] text-slate-600 dark:text-[#93A3B5] leading-relaxed flex items-start gap-2 shadow-xs">
            <Info className="w-4 h-4 text-amber-700 dark:text-[#D9B36C] shrink-0 mt-0.5" />
            <div>
              <strong className="text-amber-800 dark:text-[#D9B36C] block uppercase font-bold text-[9px] mb-0.5">
                Reserva Metodológica Pré-Laudo & Estimativa de Massa
              </strong>
              <span>{balanco.reservaPreLaudo}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
