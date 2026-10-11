import React from 'react'
import { Link } from 'react-router-dom'
import { FileUp, Calculator, FileCheck2, ArrowRight, ShieldCheck } from 'lucide-react'

export interface SecaoComoFuncionaEtapasProps {
  id?: string
  className?: string
}

const ETAPAS = [
  {
    numero: '01',
    titulo: 'Importação das notas',
    descricao:
      'Conectamos seu ERP, SPED ou XMLs de NF-e, CT-e e NFS-e. Sem redigitação e com validação criptográfica direta na SEFAZ.',
    icone: FileUp,
    badge: 'Passo 1 · Sua empresa',
    destaque: true,
  },
  {
    numero: '02',
    titulo: 'Cálculo auditado DM-ORB-001',
    descricao:
      'Nosso motor determinístico cruza cada insumo com os fatores oficiais auditados (worldsteel, IAI, GLEC, PBGHG) e rastreia os balanços de massa.',
    icone: Calculator,
    badge: 'Passo 2 · Automatizado',
    destaque: false,
  },
  {
    numero: '03',
    titulo: 'Documento verificável com hash público',
    descricao:
      'Emissão do Atestado de Conformidade Orbis com ART/RRT vinculada, chave SHA-256 canônica e QR Code pronto para fiscalização, contabilidade e bancos.',
    icone: FileCheck2,
    badge: 'Passo 3 · Verificação pública',
    destaque: false,
  },
]

export function SecaoComoFuncionaEtapas({
  id = 'como-funciona',
  className = '',
}: SecaoComoFuncionaEtapasProps) {
  return (
    <section
      id={id}
      aria-label="Como funciona o Orbis Protocol: Da nota fiscal ao documento verificável"
      className={`py-16 md:py-24 bg-white dark:bg-[#0A1628] border-b border-slate-200/80 dark:border-slate-800/80 relative scroll-mt-20 ${className}`}
    >
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 relative z-10">
        {/* Cabeçalho da Seção */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800 text-emerald-800 dark:text-[#059669] text-xs font-mono font-bold tracking-wider uppercase mb-4">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>FLUXO SIMPLES EM 3 ETAPAS</span>
          </div>

          <h2 className="text-center font-heading font-black text-[clamp(0.72rem,2.8vw,2.25rem)] text-slate-900 dark:text-[#F8FAFC] tracking-tight leading-tight whitespace-normal min-[480px]:whitespace-nowrap [text-wrap:balance]">
            DA NOTA FISCAL AO DOCUMENTO VERIFICÁVEL
          </h2>

          <p className="mt-3 text-center text-sm sm:text-base text-slate-600 dark:text-[#94A3B8] leading-relaxed">
            Transforme documentos fiscais rotineiros em comprovação de descarbonização pronta para
            órgãos ambientais, auditorias contábeis e instituições financeiras.{' '}
            <strong className="text-slate-900 dark:text-[#F8FAFC] font-semibold">
              Você só participa da primeira.
            </strong>
          </p>
        </div>

        {/* Grade de 3 etapas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {ETAPAS.map((etapa) => {
            const Icone =
              etapa.numero === '01' ? FileUp : etapa.numero === '02' ? Calculator : FileCheck2
            return (
              <div
                key={etapa.numero}
                className="relative rounded-2xl bg-slate-50 dark:bg-[#0E1A2E] border border-slate-200 dark:border-slate-800 p-6 sm:p-7 flex flex-col justify-between hover:border-emerald-500/50 dark:hover:border-[#059669]/50 transition-all shadow-xs group"
              >
                <div>
                  {/* Topo do Card com Número e Badge */}
                  <div className="flex items-center justify-between gap-3 mb-5">
                    <span className="font-heading font-black text-3xl sm:text-4xl text-emerald-600 dark:text-[#059669] opacity-90">
                      {etapa.numero}
                    </span>
                    <span className="font-mono text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full bg-white dark:bg-[#0A1628] text-slate-600 dark:text-[#94A3B8] border border-slate-200 dark:border-slate-700">
                      {etapa.badge}
                    </span>
                  </div>

                  {/* Ícone */}
                  <div className="w-12 h-12 rounded-xl bg-white dark:bg-[#0A1628] border border-slate-200 dark:border-slate-700/80 flex items-center justify-center text-emerald-600 dark:text-[#059669] mb-4 group-hover:scale-105 transition-transform shadow-xs">
                    <Icone className="w-6 h-6 stroke-[1.8]" />
                  </div>

                  {/* Título */}
                  <h3 className="font-heading font-bold text-lg text-slate-900 dark:text-[#F8FAFC] tracking-tight mb-2">
                    {etapa.titulo}
                  </h3>

                  {/* Descrição */}
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-[#94A3B8] leading-relaxed">
                    {etapa.descricao}
                  </p>
                </div>

                {/* Destaque contextual da etapa 3 */}
                {etapa.numero === '03' && (
                  <div className="mt-5 pt-4 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs">
                    <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                      Zero burocracia para sua equipe
                    </span>
                    <Link
                      to="/verificador"
                      className="inline-flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-[#059669]"
                    >
                      <span>Verificador</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Rodapé da Seção com CTA de Início */}
        <div className="mt-12 text-center">
          <Link
            to="/diagnostico"
            className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl text-sm font-bold bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-[#059669] dark:hover:bg-emerald-600 shadow-md transition-all hover:-translate-y-0.5 min-h-[44px]"
          >
            <span>Iniciar diagnóstico gratuito agora</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}

export default SecaoComoFuncionaEtapas
