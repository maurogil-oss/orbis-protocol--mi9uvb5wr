import React from 'react'
import {
  Utensils,
  AlertTriangle,
  Leaf,
  Scale,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Flame,
  Recycle,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { ResultadoComparativoSegmentoAlimentacao } from '@/services/diagnosticoSegmentosService'

interface Props {
  resultado: ResultadoComparativoSegmentoAlimentacao
  razaoSocial: string
  cnpj: string
  onContinuar?: () => void
}

export function ResultadoSegmentoAlimentacaoView({
  resultado,
  razaoSocial,
  cnpj,
  onContinuar,
}: Props) {
  return (
    <div className="space-y-6 animate-fade-in text-left">
      {/* Header com Segmento */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-500/15 via-[#111820] to-[#0A0E12] border border-[#12B886]/40">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-2">
            <Utensils className="w-5 h-5 text-[#12B886]" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#12B886]">
              Trilha Flagship • Diagnóstico Setorial de Alimentação
            </span>
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-[#12B886]/20 text-[#12B886] text-xs font-semibold">
            {resultado.tipoEstabelecimentoRotulo}
          </span>
        </div>
        <h3 className="font-heading font-bold text-lg sm:text-xl text-[#F4F7FA]">
          Pegada de Carbono e Circularidade do Food Service
        </h3>
        <p className="text-xs text-[#93A3B5] mt-1">
          {razaoSocial} • CNPJ: <span className="font-mono text-[#D9B36C]">{cnpj}</span>
        </p>
      </div>

      {/* Etiqueta OBRIGATÓRIA: Preliminar — não substitui laudo pericial */}
      <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/40 text-amber-700 dark:text-[#D9B36C] text-xs font-medium flex items-center gap-2.5">
        <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500" />
        <span>
          <strong>preliminar — não substitui laudo pericial</strong>: estimativa baseada nas
          declarações operacionais e fatores médios de emissão do setor. A pegada analítica por nota
          fiscal e balanço pericial com hash/chancela são emitidos no trial de 15 dias / 5 notas e
          no plano contratado.
        </span>
      </div>

      {/* Grid de Métricas Principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Estimativa de Emissões */}
        <div className="p-5 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.1)] space-y-2">
          <div className="flex items-center justify-between text-xs text-[#93A3B5]">
            <span>Faixa Estimada de Emissões</span>
            <Flame className="w-4 h-4 text-orange-400" />
          </div>
          <div className="text-2xl font-mono font-extrabold text-[#F4F7FA]">
            {resultado.faixaEstimadaEmissoesMensaisTco2e.min.toFixed(1)} –{' '}
            {resultado.faixaEstimadaEmissoesMensaisTco2e.max.toFixed(1)}{' '}
            <span className="text-sm font-normal text-[#93A3B5]">tCO₂e / mês</span>
          </div>
          <p className="text-[11px] text-[#93A3B5]">
            Abrange Escopo 1 (gás/cocção), Escopo 2 (eletricidade) e Escopo 3 preliminar (embalagens
            e insumos).
          </p>
        </div>

        {/* Benchmark Setorial */}
        <div className="p-5 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.1)] space-y-2">
          <div className="flex items-center justify-between text-xs text-[#93A3B5]">
            <span>Benchmark Setorial Alimentação</span>
            <Scale className="w-4 h-4 text-[#12B886]" />
          </div>
          <div className="text-sm font-semibold text-[#12B886]">
            {resultado.benchmarkSetorial.posicaoReferencial}
          </div>
          <p className="text-[11px] text-[#93A3B5]">
            Média referencial do segmento: ~
            {Math.round(resultado.benchmarkSetorial.mediaSegmentoTco2ePorNotaOuMilBrl * 1000)} kg
            CO₂e / R$ mil faturados no food service brasileiro.
          </p>
        </div>
      </div>

      {/* Fatores Destacados */}
      {resultado.fatoresDestacados.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#93A3B5]">
            Fatores Críticos Destacados na Operação
          </h4>
          <div className="space-y-2">
            {resultado.fatoresDestacados.map((item, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-[#111820] border border-[rgba(244,247,250,0.08)] flex items-start gap-3 text-xs"
              >
                <div
                  className={`mt-0.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase shrink-0 ${
                    item.impacto === 'alto'
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}
                >
                  Impacto {item.impacto}
                </div>
                <div>
                  <span className="font-semibold text-[#F4F7FA] block mb-0.5">{item.fator}</span>
                  <span className="text-[#93A3B5] leading-relaxed">{item.descricao}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Logística Reversa / PNRS */}
      <div className="p-4 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.1)] flex items-start gap-3 text-xs">
        <Recycle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-[#F4F7FA] block mb-0.5">
            Logística Reversa de Embalagens (PNRS)
          </span>
          <p className="text-[#93A3B5] leading-relaxed">{resultado.conformidadePnrs}</p>
        </div>
      </div>

      {/* Próximos Passos & Modelo Comercial */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-[rgba(244,247,250,0.1)] text-xs text-[#93A3B5] space-y-2">
        <span className="font-semibold text-[#F4F7FA] block">
          Modelo Comercial Vigente e Portões de Acesso:
        </span>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <strong>Sem login (Visitante):</strong> Resumo preliminar com protocolo DX-.
          </li>
          <li>
            <strong>Cadastro gratuito:</strong> Acesso ao diagnóstico completo do CNPJ sem valores
            detalhados por nota.
          </li>
          <li>
            <strong>Trial de 15 dias sem cartão (5 notas):</strong> Pegada por nota/insumo +
            situação tributária como plus.
          </li>
          <li>
            <strong>Plano contratado:</strong> Pegada contínua ilimitada + laudo pericial com hash e
            chancela + Radar Semanal.
          </li>
        </ul>
      </div>

      {onContinuar && (
        <div className="pt-2">
          <button
            type="button"
            onClick={onContinuar}
            className="w-full py-3.5 rounded-xl font-bold bg-[#12B886] text-[#0A0E12] hover:bg-[#0CA678] transition-all shadow-emerald-glow flex items-center justify-center gap-2"
          >
            <span>Concluir Diagnóstico e Emitir Protocolo DX-</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  )
}
