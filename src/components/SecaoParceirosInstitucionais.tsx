import React from 'react'
import { Link } from 'react-router-dom'
import { ShieldCheck, ArrowRight, ExternalLink } from 'lucide-react'

export interface SecaoParceirosInstitucionaisProps {
  id?: string
  className?: string
}

export function SecaoParceirosInstitucionais({
  id = 'parceiros-institucionais',
  className = '',
}: SecaoParceirosInstitucionaisProps) {
  return (
    <section
      id={id}
      aria-label="Parceiros Institucionais e Alianças Estratégicas"
      className={`py-14 sm:py-20 bg-white dark:bg-[#0A1628] border-b border-slate-200 dark:border-slate-800 transition-colors ${className}`}
    >
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-[#111827] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-mono font-semibold uppercase tracking-wider mb-3">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-[#2563EB]" />
            <span>ALIANÇAS & COOPERAÇÃO TÉCNICA</span>
          </div>
          <h2 className="font-heading font-black text-2xl sm:text-3xl text-slate-900 dark:text-[#F8FAFC] tracking-tight">
            PARCEIROS INSTITUCIONAIS
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-[#94A3B8] leading-relaxed">
            Cooperação regional e setorial para infraestrutura de prova documental da
            descarbonização.
          </p>
        </div>

        {/* Card Destaque: ACP — Associação Comercial do Paraná */}
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-50 dark:bg-[#0E1A2E] border border-slate-200 dark:border-slate-800 hover:border-blue-500/40 dark:hover:border-blue-500/40 transition-all shadow-xs">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
            {/* Logo / Emblema ACP */}
            <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col items-start gap-4">
              <div className="p-3 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-center shrink-0">
                <img
                  src="https://img.usecurling.com/i?q=parana&color=solid-black"
                  alt="Logo da Associação Comercial do Paraná (ACP)"
                  className="h-10 sm:h-12 w-auto object-contain dark:invert"
                  loading="lazy"
                  decoding="async"
                  width="120"
                  height="48"
                />
              </div>
              <div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  Piloto Regional · Paraná
                </span>
                <h3 className="font-heading font-bold text-lg sm:text-xl text-slate-900 dark:text-[#F8FAFC] tracking-tight mt-1.5">
                  Associação Comercial do Paraná (ACP)
                </h3>
                <p className="text-xs text-slate-600 dark:text-[#94A3B8] mt-1">
                  Parceria estratégica para difusão de dMRV e crédito verde entre empresas
                  associadas.
                </p>
              </div>
            </div>

            {/* Informações de cooperação e escopo */}
            <div className="lg:col-span-5 space-y-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
              <p className="leading-relaxed">
                O acordo técnico viabiliza o <strong>Programa Piloto ACP</strong>, integrando as
                empresas associadas da ACP à infraestrutura probatória do Orbis Protocol, com
                condições exclusivas, emissão simplificada de passaportes sustentáveis e
                conformidade com a Lei 15.042/2024 (SBCE).
              </p>
              <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
                <div className="p-2.5 rounded-xl bg-white dark:bg-[#0A1628] border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500 block">Acesso corporativo:</span>
                  <strong className="text-slate-900 dark:text-[#F8FAFC]">Código ORB-ACP</strong>
                </div>
                <div className="p-2.5 rounded-xl bg-white dark:bg-[#0A1628] border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500 block">Benefício:</span>
                  <strong className="text-emerald-700 dark:text-emerald-400">
                    Atendimento prioritário
                  </strong>
                </div>
              </div>
            </div>

            {/* Ações / Links */}
            <div className="lg:col-span-3 flex flex-col gap-2.5">
              <Link
                to="/solucoes/bureau-acp"
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs sm:text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 dark:bg-[#2563EB] dark:hover:bg-blue-600 transition-all min-h-[44px] shadow-xs"
              >
                <span>Conhecer o Bureau ACP</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/parceiro"
                className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-[#0A1628] border border-slate-200 dark:border-slate-800 min-h-[44px] transition-colors"
              >
                <span>Portal do Parceiro ACP</span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default SecaoParceirosInstitucionais
