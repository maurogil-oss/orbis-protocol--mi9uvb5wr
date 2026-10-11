import React from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react'

export interface CardAtestadoHeroProps {
  className?: string
}

/**
 * Card ilustrativo do Atestado de Conformidade Orbis para o Hero da Home.
 *
 * Valores auditados com a metodologia DM-ORB-001 (catálogo em TS):
 * 1. Bobina de aço laminado: 12,0 t × 2,18 tCO₂e/t (worldsteel 2024/2025) = 26,16 tCO₂e
 * 2. Sucata ferrosa reciclada: 8,5 t × 0,42 tCO₂e/t (fator proxy EAF reciclado / DM-ORB-001) = 3,57 tCO₂e
 * 3. Frete rodoviário 640 km: 640 km × 20,5 t × 0,099 kgCO₂e/t·km (GLEC v3.0 / GHG Protocol Brasil) / 1000 = 1,30 tCO₂e
 * Total do lote: 26,16 + 3,57 + 1,30 = 31,03 tCO₂e
 *
 * Marcado visivelmente como "Exemplo" e "Documento ilustrativo", com hash SHA-256 canônico
 * e link para conferência em /verificador.
 */
export function CardAtestadoHero({ className = '' }: CardAtestadoHeroProps) {
  return (
    <div className={`w-full max-w-lg mx-auto lg:max-w-none ${className}`}>
      {/* Moldura do documento ilustrativo */}
      <div className="relative rounded-2xl bg-white dark:bg-[#0E1A2E] border border-slate-200/90 dark:border-slate-800 p-6 sm:p-7 shadow-xl shadow-slate-200/50 dark:shadow-2xl dark:shadow-black/40 transition-all">
        {/* Cabeçalho do Card */}
        <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="font-heading font-bold text-base sm:text-lg text-slate-900 dark:text-[#F8FAFC] tracking-tight">
              Atestado de Conformidade Orbis
            </h3>
            <p className="font-mono text-xs text-slate-500 dark:text-[#94A3B8] mt-0.5">
              Lote EXP-2026-0412 · GHG Protocol
            </p>
          </div>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800">
            Exemplo
          </span>
        </div>

        {/* Cabeçalho da tabela Origem / tCO₂e */}
        <div className="flex items-center justify-between text-xs font-medium text-slate-400 dark:text-slate-400 pt-3 pb-2 border-b border-slate-100 dark:border-slate-800/80">
          <span>Origem</span>
          <span className="font-mono">tCO₂e</span>
        </div>

        {/* Linhas da Tabela */}
        <div className="divide-y divide-slate-100 dark:divide-slate-800/60 text-sm">
          {/* Linha 1: Bobina de aço laminado */}
          <div className="py-3 flex items-baseline justify-between gap-3">
            <div className="min-w-0">
              <div className="font-medium text-slate-800 dark:text-slate-200 text-sm">
                Bobina de aço laminado
              </div>
              <div className="font-mono text-xs text-slate-500 dark:text-[#94A3B8] mt-0.5">
                NF-e 4126 0512 …0187 · 12,0 t
              </div>
            </div>
            <div className="font-mono font-semibold text-slate-900 dark:text-slate-100 text-base shrink-0">
              26,16
            </div>
          </div>

          {/* Linha 2: Sucata ferrosa (reciclada) */}
          <div className="py-3 flex items-baseline justify-between gap-3">
            <div className="min-w-0">
              <div className="font-medium text-slate-800 dark:text-slate-200 text-sm">
                Sucata ferrosa (reciclada)
              </div>
              <div className="font-mono text-xs text-slate-500 dark:text-[#94A3B8] mt-0.5">
                NF-e 4126 0512 …0203 · 8,5 t
              </div>
            </div>
            <div className="font-mono font-semibold text-slate-900 dark:text-slate-100 text-base shrink-0">
              3,57
            </div>
          </div>

          {/* Linha 3: Frete rodoviário */}
          <div className="py-3 flex items-baseline justify-between gap-3">
            <div className="min-w-0">
              <div className="font-medium text-slate-800 dark:text-slate-200 text-sm">
                Frete rodoviário — 640 km
              </div>
              <div className="font-mono text-xs text-slate-500 dark:text-[#94A3B8] mt-0.5">
                NF-e 4126 0513 …0011 · 1 viagem
              </div>
            </div>
            <div className="font-mono font-semibold text-slate-900 dark:text-slate-100 text-base shrink-0">
              1,30
            </div>
          </div>
        </div>

        {/* Linha Total do Lote */}
        <div className="pt-3 pb-4 border-t border-slate-200 dark:border-slate-700/80 flex items-baseline justify-between">
          <span className="font-heading font-bold text-sm sm:text-base text-slate-900 dark:text-[#F8FAFC]">
            Total do lote
          </span>
          <span className="font-mono font-black text-xl sm:text-2xl text-emerald-600 dark:text-[#059669]">
            31,03
          </span>
        </div>

        {/* Rodapé do Card */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-xs font-medium text-emerald-700 dark:text-emerald-400">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span>Assinado por perito credenciado · ART vinculada</span>
          </div>

          <div className="font-mono text-[11px] sm:text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-[#0A1628] px-3 py-1.5 rounded-lg border border-slate-200/80 dark:border-slate-800 break-all select-all">
            sha256 9f3a 61c0 e8b2 4d17 … a90c c21e
          </div>
        </div>
      </div>

      {/* Nota e link para o verificador fora do cartão */}
      <p className="mt-3 text-center text-xs text-slate-500 dark:text-[#94A3B8] leading-relaxed max-w-sm mx-auto">
        Documento ilustrativo. Cada atestado real pode ser{' '}
        <Link
          to="/verificador"
          className="text-slate-700 dark:text-slate-300 underline font-medium hover:text-emerald-600 dark:hover:text-[#059669] transition-colors"
        >
          conferido publicamente pelo hash
        </Link>
        .
      </p>
    </div>
  )
}

export default CardAtestadoHero
