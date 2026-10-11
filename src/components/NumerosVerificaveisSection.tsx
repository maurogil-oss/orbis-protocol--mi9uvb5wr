import React from 'react'
import { Link } from 'react-router-dom'
import {
  ShieldCheck,
  CheckCircle2,
  FileCheck,
  Layers,
  TrendingDown,
  Hash,
  ArrowRight,
} from 'lucide-react'
import { BadgeOrigemLote } from '@/components/BadgeOrigemLote'

export interface NumerosVerificaveisSectionProps {
  id?: string
  className?: string
}

/**
 * Seção de Credibilidade do Orbis Protocol:
 * Funde "Números Verificáveis" com o caso real VERTEC em um único bloco coeso de credibilidade.
 * Preserva:
 * - Badge "Real"
 * - Lote real VERTEC-IW29-2022
 * - NFs 157/158 Pan Urania
 * - 152 painéis
 * - 4.077 kgCO₂e brutos
 * - 1.223 kgCO₂e evitado com etiqueta "evitado preliminar"
 * - Atestado Orbis (com ART/RRT)
 * - Proibição de "Certificado", "Certificação" e "Selo Oficial"
 * - Acessibilidade: alvos >= 44px, contraste >= 4.5:1
 */
export function NumerosVerificaveisSection({
  id = 'credibilidade-caso-vertec',
  className = '',
}: NumerosVerificaveisSectionProps) {
  return (
    <section
      id={id}
      aria-label="Credibilidade e Prova Documental: Números Verificáveis e Caso Real VERTEC"
      className={`py-16 md:py-20 bg-slate-50 dark:bg-[#0A1628]/60 border-y border-slate-200 dark:border-slate-800 relative overflow-hidden transition-colors ${className}`}
    >
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 relative z-10">
        {/* Cabeçalho da Seção de Credibilidade */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 sm:mb-10 gap-4">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-[#111827] border border-emerald-300 dark:border-[#059669]/40 text-emerald-800 dark:text-[#059669] text-xs font-semibold uppercase tracking-wider mb-3">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-[#059669]" />
              <span>Credibilidade e prova documental</span>
            </div>
            <h2 className="text-left font-heading font-extrabold text-[clamp(0.72rem,2.8vw,2.25rem)] text-slate-900 dark:text-[#F8FAFC] tracking-tight leading-tight whitespace-normal min-[480px]:whitespace-nowrap [text-wrap:balance]">
              CASO REAL DE PRODUÇÃO: LOTE VERTEC
            </h2>
            <p className="text-left text-sm sm:text-base text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
              Primeiro lote real gravado no protocolo dMRV (lote VERTEC-IW29-2022). Rastreabilidade
              física e fiscal de painéis termoacústicos com lã de rocha a partir de NF-e Pan Urania.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <BadgeOrigemLote origem="real" />
            <Link
              to="/verificador"
              className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline min-h-[44px]"
            >
              <span>Consultar no Verificador</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Card Unificado de Credibilidade: Informação do caso ao lado das métricas auditadas */}
        <div className="rounded-2xl bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-slate-800 shadow-md p-6 sm:p-8 space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-6 border-b border-slate-200 dark:border-slate-800 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono font-bold text-lg sm:text-xl text-slate-900 dark:text-[#F8FAFC]">
                  Lote VERTEC-IW29-2022
                </span>
                <span className="px-2.5 py-0.5 rounded text-xs font-mono font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                  Primeiro lote real gravado
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                Pan Urania (NFs 157 e 158) • Painel IW29 lã de rocha 50mm
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Origem fiscal comprovada:
              </span>
              <span className="font-mono text-xs px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold border border-slate-200 dark:border-slate-700">
                NF-e 157 / NF-e 158
              </span>
            </div>
          </div>

          {/* Grid de 4 cartões com números reais apurados */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {/* Card 1: Volume */}
            <div className="p-5 rounded-xl bg-slate-50 dark:bg-[#0A1628] border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Volume de painéis
                </span>
                <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-extrabold font-heading text-slate-900 dark:text-[#F8FAFC]">
                  152 painéis
                </div>
                <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-400">
                  Painel IW29 lã de rocha 50mm
                </p>
              </div>
            </div>

            {/* Card 2: CO2e Bruto */}
            <div className="p-5 rounded-xl bg-slate-50 dark:bg-[#0A1628] border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  CO₂e Bruto
                </span>
                <Hash className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-extrabold font-heading text-slate-900 dark:text-[#F8FAFC]">
                  4.077 kgCO₂e
                </div>
                <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-400">
                  Pegada apurada pelas notas de origem
                </p>
              </div>
            </div>

            {/* Card 3: CO2e Evitado Preliminar */}
            <div className="p-5 rounded-xl bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/50 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
                  CO₂e Evitado
                </span>
                <TrendingDown className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-extrabold font-heading text-emerald-800 dark:text-emerald-300">
                  1.223 kgCO₂e
                </div>
                <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700">
                  evitado preliminar
                </div>
              </div>
            </div>

            {/* Card 4: Atestado Orbis */}
            <div className="p-5 rounded-xl bg-slate-50 dark:bg-[#0A1628] border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Atestado Orbis
                </span>
                <FileCheck className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-extrabold font-heading text-slate-900 dark:text-[#F8FAFC]">
                  Com ART/RRT
                </div>
                <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-400">
                  Atestado de Conformidade Orbis
                </p>
              </div>
            </div>
          </div>

          {/* Rodapé do Caso: nota técnica de rastreabilidade e ressalva de evitado preliminar */}
          <div className="p-4 rounded-xl bg-slate-100/80 dark:bg-[#0A1628] border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-700 dark:text-slate-300">
            <div className="flex items-start sm:items-center gap-2 text-left">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5 sm:mt-0" />
              <span>
                Caso real auditado: NF-e 157/158 Pan Urania com rastreabilidade de lã de rocha 50mm
                e memória de cálculo documentada. O evitado é preliminar (não substitui laudo
                pericial, não é crédito negociável).
              </span>
            </div>
            <Link
              to="/verificador"
              className="shrink-0 px-4 py-2.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-[#2563EB] dark:text-white dark:hover:bg-blue-600 font-semibold transition-colors min-h-[44px] inline-flex items-center justify-center gap-1.5"
            >
              <span>Consultar no Verificador</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

export default NumerosVerificaveisSection
