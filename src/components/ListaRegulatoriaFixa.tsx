import React from 'react'
import { Scale, FileCheck2, Leaf, BarChart3 } from 'lucide-react'

export interface RegulacaoItem {
  id: string
  titulo: string
  linhaImpacto: string
  icon: React.ComponentType<{ className?: string }>
  normaRef: string
}

export const ITENS_REGULACAO_FIXA: RegulacaoItem[] = [
  {
    id: 'lei-15042',
    titulo: 'Lei 15.042/2024',
    normaRef: 'Marco Legal do SBCE',
    linhaImpacto:
      'Institui o Sistema Brasileiro de Comércio de Emissões com teto e reporte compulsório para operações acima de 10.000 tCO₂e/ano.',
    icon: Scale,
  },
  {
    id: 'sbce-14902',
    titulo: 'SBCE — Lei 14.902/2024',
    normaRef: 'Mobilidade Verde & Créditos',
    linhaImpacto:
      'Exige rastreabilidade de materiais e emissões do berço ao túmulo para habilitação a créditos tributários e desoneração fiscal.',
    icon: Leaf,
  },
  {
    id: 'mover-cdverde',
    titulo: 'Programa MOVER/CDVerde',
    normaRef: 'Circularidade & Desmonte',
    linhaImpacto:
      'Condiciona benefícios de IPI e inovação à comprovação pericial de reciclabilidade, balanço de massa e baixa rastreada de veículos.',
    icon: FileCheck2,
  },
  {
    id: 'ifrs-s1-s2',
    titulo: 'IFRS S1/S2',
    normaRef: 'Resolução CVM 244/2026',
    linhaImpacto:
      'Torna obrigatória a divulgação auditável de riscos climáticos e inventário de Escopos 1, 2 e 3 para acesso a capital e crédito bancário.',
    icon: BarChart3,
  },
]

export interface ListaRegulatoriaFixaProps {
  className?: string
}

/**
 * Seção estática "Regulação que muda o jogo para a empresa"
 * Substitui o antigo marquee na home:
 * - 4 itens essenciais com UMA linha do que cada um muda
 * - Sem animação automática (respeita prefers-reduced-motion por construção)
 * - Contraste >= 4.5:1 e tipografia mínima >= 12px
 */
export function ListaRegulatoriaFixa({ className = '' }: ListaRegulatoriaFixaProps) {
  return (
    <section
      aria-label="Regulação que muda o jogo para a empresa"
      className={`py-14 sm:py-18 bg-white dark:bg-[#0A1628] border-b border-slate-200 dark:border-slate-800 ${className}`}
    >
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center mb-10 sm:mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-[#111827] border border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-mono font-semibold uppercase tracking-wider mb-3">
            <span
              className="w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-[#059669]"
              aria-hidden="true"
            />
            <span>Marco Regulatório Brasileiro e Global</span>
          </div>
          <h2 className="font-heading font-black text-[clamp(0.72rem,2.8vw,2.25rem)] text-slate-900 dark:text-[#F8FAFC] tracking-tight mb-3 leading-tight whitespace-normal min-[480px]:whitespace-nowrap [text-wrap:balance]">
            REGULAÇÃO QUE MUDA O JOGO PARA A EMPRESA
          </h2>
          <p className="text-sm sm:text-base text-slate-700 dark:text-slate-300 leading-relaxed font-normal">
            As quatro diretrizes que tornam a auditoria documental de notas fiscais e emissões
            mandatória para a indústria brasileira.
          </p>
        </div>

        {/* Grade Estática 4 Itens — sem animação contínua */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {ITENS_REGULACAO_FIXA.map((item) => {
            const Icon = item.icon
            return (
              <div
                key={item.id}
                className="flex flex-col justify-between p-6 rounded-2xl bg-slate-50 dark:bg-[#0E1A2E] border border-slate-200 dark:border-slate-800 shadow-xs hover:border-emerald-600/40 dark:hover:border-[#059669]/50 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-white dark:bg-[#0A1628] border border-slate-200 dark:border-slate-800 flex items-center justify-center text-emerald-700 dark:text-[#059669]">
                      <Icon className="w-5 h-5 stroke-[1.8]" />
                    </div>
                    <span className="text-xs font-mono font-semibold text-slate-600 dark:text-[#94A3B8]">
                      {item.normaRef}
                    </span>
                  </div>

                  <h3 className="font-heading font-black text-lg text-slate-900 dark:text-[#F8FAFC] mb-2 leading-snug">
                    {item.titulo}
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                    {item.linhaImpacto}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center gap-1.5 text-xs font-mono font-semibold text-emerald-700 dark:text-[#059669]">
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-[#059669]"
                    aria-hidden="true"
                  />
                  <span>Impacto mandatório</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default ListaRegulatoriaFixa
