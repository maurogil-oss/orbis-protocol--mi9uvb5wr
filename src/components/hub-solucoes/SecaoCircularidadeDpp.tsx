import React from 'react'
import { Link } from 'react-router-dom'
import {
  Cpu,
  QrCode,
  Lock,
  ExternalLink,
  Search,
  ChevronRight,
  Sparkles,
  ArrowRight,
} from 'lucide-react'

export interface SecaoCircularidadeDppProps {
  id?: string
  className?: string
}

/**
 * Componente modularizado da Seção de Circularidade & DPP (Decreto 11.413/2023).
 * Preparado como conteúdo reutilizável do futuro hub "Soluções".
 */
export function SecaoCircularidadeDpp({
  id = 'circularidade-dpp',
  className = '',
}: SecaoCircularidadeDppProps) {
  return (
    <section
      id={id}
      aria-label="Circularidade e Passaporte Digital de Produto"
      className={`py-20 md:py-28 bg-white dark:bg-[#0A1628] relative overflow-hidden ${className}`}
    >
      <div className="hidden dark:block absolute top-1/2 right-0 w-[500px] h-[300px] linear-glow-emerald pointer-events-none" />

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 relative z-10">
        <div className="p-8 sm:p-12 rounded-3xl bg-slate-50 dark:bg-[#0E1A2E] border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-2xl relative overflow-hidden hover:border-emerald-600/40 dark:hover:border-[#059669]/40 transition-all">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-[#059669]/10 border border-emerald-200 dark:border-[#059669]/30 text-emerald-700 dark:text-[#059669] text-xs font-semibold uppercase tracking-wider">
                <Cpu className="w-3.5 h-3.5 stroke-[1.5]" />
                <span>Passaporte Digital de Produto & Lastro de Circularidade</span>
              </div>

              <h2 className="font-heading font-black text-2xl sm:text-3xl md:text-4xl text-slate-900 dark:text-[#F8FAFC] leading-tight tracking-tight">
                CIRCULARIDADE COM PROVA CRIPTOGRÁFICA DE ORIGEM E DESTINAÇÃO
              </h2>

              <p className="text-sm sm:text-base text-slate-600 dark:text-[#94A3B8] leading-relaxed">
                Conectamos a baixa oficial de veículos no DETRAN, balanço de massa, emissões de CO2e
                evitadas e destinação final em integração com o SINIR. Sem declarações corporativas
                vazias.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-3.5 rounded-xl bg-white dark:bg-[#0A1628] border border-slate-200 dark:border-slate-800 flex items-start gap-2.5 shadow-xs">
                  <QrCode className="w-4 h-4 text-emerald-600 dark:text-[#059669] shrink-0 mt-0.5 stroke-[1.5]" />
                  <div className="text-xs">
                    <span className="font-bold text-slate-900 dark:text-[#F8FAFC] block">
                      QR Code Dinâmico
                    </span>
                    <span className="text-slate-600 dark:text-[#94A3B8]">
                      Acesso público instantâneo por peça e por lote veicular
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-white dark:bg-[#0A1628] border border-slate-200 dark:border-slate-800 flex items-start gap-2.5 shadow-xs">
                  <Lock className="w-4 h-4 text-amber-600 dark:text-[#D9B36C] shrink-0 mt-0.5 stroke-[1.5]" />
                  <div className="text-xs">
                    <span className="font-bold text-slate-900 dark:text-[#F8FAFC] block">
                      Lastro Inviolável
                    </span>
                    <span className="text-slate-600 dark:text-[#94A3B8]">
                      Hash SHA-256 canônico gerado sob o Decreto 11.413/2023
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 pt-4">
                {/* Link direto para Passaporte de Produto */}
                <Link
                  to="/passaporte-lote/PR-BX-2026-1240105"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-xs sm:text-sm font-bold bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-[#2563EB] dark:text-white dark:hover:bg-blue-600 hover:-translate-y-0.5 transition-all shadow-sm"
                >
                  <span>Abrir Passaporte de Produto (DPP)</span>
                  <ExternalLink className="w-4 h-4" />
                </Link>

                {/* Link direto para Verificador público de atestados e lastros */}
                <Link
                  to="/verificador"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-xs sm:text-sm font-semibold border border-amber-300 dark:border-[#D9B36C]/60 text-amber-700 dark:text-[#D9B36C] hover:bg-amber-600 hover:text-white dark:hover:bg-[#D9B36C] dark:hover:text-[#0A1628] transition-all bg-white dark:bg-[#0E1A2E]"
                >
                  <Search className="w-4 h-4 stroke-[1.5]" />
                  <span>Verificador Público de Atestados & Lastros</span>
                </Link>
              </div>
            </div>

            {/* Prévia interativa do Passaporte */}
            <div className="lg:col-span-5">
              <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#0A1628] border border-emerald-300 dark:border-[#059669]/30 shadow-md dark:shadow-xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-xs font-mono text-emerald-700 dark:text-[#059669] font-bold">
                    DEMO OPERACIONAL | CDVERDE
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded bg-emerald-100 dark:bg-[#059669]/20 text-emerald-800 dark:text-[#059669] font-mono">
                    DECRETO 11.413
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="text-xs text-slate-600 dark:text-[#94A3B8]">
                    Lote de Desmontagem Veicular:
                  </div>
                  <div className="font-heading font-bold text-sm text-slate-900 dark:text-[#F8FAFC]">
                    Renault Clio Authentique 1.0 16V Hi-Flex
                  </div>
                  <div className="text-xs font-mono text-amber-700 dark:text-[#D9B36C]">
                    Baixa DETRAN: PR-BX-2026-1240105
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2">
                  <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#111827] text-center border border-slate-100 dark:border-slate-800">
                    <span className="text-xs text-slate-600 dark:text-[#94A3B8] uppercase block">
                      CO2e Evitado
                    </span>
                    <span className="font-heading font-black text-sm text-emerald-700 dark:text-[#059669]">
                      1.584,81 kg
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#111827] text-center border border-slate-100 dark:border-slate-800">
                    <span className="text-xs text-slate-600 dark:text-[#94A3B8] uppercase block">
                      Peças Rastreáveis
                    </span>
                    <span className="font-heading font-black text-sm text-slate-900 dark:text-[#F8FAFC]">
                      49 componentes
                    </span>
                  </div>
                </div>

                <div className="pt-2 text-xs text-slate-600 dark:text-[#94A3B8] flex items-center justify-between">
                  <Link
                    to="/solucoes/case-cdverde"
                    className="text-emerald-700 dark:text-[#059669] hover:underline inline-flex items-center gap-1"
                  >
                    <span>Ler estudo de caso completo</span>
                    <ChevronRight className="w-3 h-3" />
                  </Link>
                  <Link
                    to="/verificador"
                    className="text-amber-700 dark:text-[#D9B36C] hover:underline"
                  >
                    Auditar hash →
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Card de Materiais Críticos Recuperados */}
          <div className="mt-8 pt-8 border-t border-slate-200 dark:border-slate-800">
            <div className="p-6 sm:p-7 rounded-2xl bg-white dark:bg-[#0A1628] border border-amber-300 dark:border-[#D9B36C]/40 hover:border-emerald-500 dark:hover:border-[#059669] transition-all flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xs">
              <div className="space-y-2 max-w-3xl">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-amber-50 dark:bg-[#111827] text-amber-700 dark:text-[#D9B36C] border border-amber-200 dark:border-[#D9B36C]/30">
                    MINERAÇÃO URBANA & REEE
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-emerald-50 dark:bg-[#111827] text-emerald-700 dark:text-[#059669] border border-emerald-200 dark:border-[#059669]/30">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-[#059669] stroke-[1.8]" />
                    Passaporte DCP
                  </span>
                </div>

                <h3 className="font-heading font-bold text-xl text-slate-900 dark:text-[#F8FAFC]">
                  Materiais Críticos Recuperados
                </h3>

                <p className="text-xs sm:text-sm text-slate-600 dark:text-[#94A3B8] leading-relaxed">
                  Prova de origem urbana para terras raras, metais nobres e cobre recuperados de
                  e-waste e veículos.
                </p>
              </div>

              <div className="shrink-0">
                <Link
                  to="/materiais-criticos"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs sm:text-sm font-bold bg-slate-100 dark:bg-[#111827] border border-slate-200 dark:border-[#D9B36C]/50 text-slate-800 dark:text-[#D9B36C] hover:bg-emerald-600 hover:text-white dark:hover:bg-[#D9B36C] dark:hover:text-[#0A1628] transition-all"
                >
                  <span>Acessar Passaporte DCP</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
