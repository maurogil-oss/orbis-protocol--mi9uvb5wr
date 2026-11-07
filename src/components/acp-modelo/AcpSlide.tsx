import React from 'react'
import { CheckCircle2 } from 'lucide-react'

interface AcpSlideProps {
  id: number
  total: number
  badge: string
  title: string
  subtitle?: string
  children: React.ReactNode
  footnote?: string
}

/**
 * Contêiner padrão de uma seção do documento (uma "página" no PDF exportado).
 * Tema claro corporativo: fundo branco, tipografia slate, acentos esmeralda/azul.
 */
export const AcpSlide: React.FC<AcpSlideProps> = ({
  id,
  total,
  badge,
  title,
  subtitle,
  children,
  footnote,
}) => (
  <section
    id={`acp-slide-${id}`}
    aria-label={`Seção ${id} de ${total} — ${title}`}
    className="slide-page relative w-full rounded-2xl sm:rounded-3xl border border-slate-200 bg-white shadow-sm p-6 sm:p-10 lg:p-14 flex flex-col"
  >
    {/* Cabeçalho da seção */}
    <div className="flex items-center justify-between pb-5 border-b border-slate-100">
      <div className="flex items-center gap-2.5 min-w-0">
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 shrink-0" />
        <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-700 truncate">
          {String(id).padStart(2, '0')} • {badge}
        </span>
      </div>
      <span className="hidden sm:inline text-[11px] font-mono text-slate-400 shrink-0">
        Análise Estratégica — Modelo Comercial ACP
      </span>
    </div>

    {/* Título */}
    <div className="pt-6 pb-2">
      <h2 className="font-heading font-black text-2xl sm:text-3xl lg:text-4xl text-slate-900 leading-tight">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-2 text-sm sm:text-base text-slate-500 leading-relaxed max-w-4xl">
          {subtitle}
        </p>
      )}
    </div>

    {/* Conteúdo */}
    <div className="flex-1 my-6 space-y-6">{children}</div>

    {/* Rodapé da seção */}
    <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-4 text-[11px] text-slate-400">
      <span className="truncate">
        {footnote ?? 'Orbis Protocol • dMRV — Prova Documental da Economia Circular'}
      </span>
      <span className="font-mono shrink-0 flex items-center gap-1">
        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
        {String(id).padStart(2, '0')} / {String(total).padStart(2, '0')}
      </span>
    </div>
  </section>
)
