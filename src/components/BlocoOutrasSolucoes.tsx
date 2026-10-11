import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Sparkles, ShieldCheck } from 'lucide-react'

export interface SolucaoRelacionadaItem {
  titulo: string
  subtitulo: string
  href: string
  badge?: string
}

export const TODAS_SOLUCOES_RELACIONADAS: SolucaoRelacionadaItem[] = [
  {
    titulo: 'Programa MOVER & CDVerde',
    subtitulo: 'Descarbonização veicular e desmontagem VFV conforme Lei 14.902/2024.',
    href: '/mover',
    badge: 'Lei 14.902',
  },
  {
    titulo: 'Mineração Urbana & Materiais Críticos',
    subtitulo: 'Terras raras, cobre e metais nobres com Passaporte Digital DCP.',
    href: '/materiais-criticos',
    badge: 'DCP',
  },
  {
    titulo: 'Passaporte Digital de Produto (DCP)',
    subtitulo: 'Rastreabilidade por lote e verificação por QR Code e hash SHA-256.',
    href: '/dcp',
    badge: 'Em estruturação',
  },
  {
    titulo: 'Portal Corporativo',
    subtitulo: 'Tour interativo de 12 notas fiscais com cálculo de emissões e laudo pericial.',
    href: '/corporativo',
  },
  {
    titulo: 'Case CDVerde',
    subtitulo: 'Rastreabilidade de peças verdes e baterias de tração com baixa DETRAN.',
    href: '/case-cdverde',
  },
  {
    titulo: 'Catálogo de Cadeias Produtivas',
    subtitulo: 'Diretrizes técnicas e fatores oficiais para 15 setores da economia.',
    href: '/cadeias-produtivas',
  },
  {
    titulo: 'Radar Semanal (Assinatura)',
    subtitulo: 'Serviço semanal de inteligência regulatória executiva por faixa de CNPJs.',
    href: '/radar-semanal',
    badge: 'Pago',
  },
  {
    titulo: 'Central do Radar',
    subtitulo: 'Acervo estruturado de edições, buscas por segmento e gestão de leitura.',
    href: '/central-radar',
  },
  {
    titulo: 'Logística Reversa (PNRS)',
    subtitulo: 'Balanço de massa auditável e lastro para Decreto 11.413/2023.',
    href: '/solucoes#logistica-reversa',
    badge: 'Em estruturação',
  },
]

export interface BlocoOutrasSolucoesProps {
  solucaoAtualHref?: string
  titulo?: string
  subtitulo?: string
  maxItens?: number
  className?: string
}

/**
 * Bloco reutilizável para rodapé das páginas-filhas de Soluções.
 * Permite ao visitante explorar as demais ramificações sem precisar voltar ao topo.
 */
export function BlocoOutrasSolucoes({
  solucaoAtualHref = '',
  titulo = 'Outras Soluções do Orbis Protocol',
  subtitulo = 'Navegue pelas soluções da árvore de decisão de acordo com o desafio da sua empresa.',
  maxItens = 4,
  className = '',
}: BlocoOutrasSolucoesProps) {
  const itensFiltrados = TODAS_SOLUCOES_RELACIONADAS.filter((item) => {
    if (!solucaoAtualHref) return true
    return item.href !== solucaoAtualHref && !item.href.startsWith(solucaoAtualHref + '#')
  }).slice(0, maxItens)

  return (
    <section
      aria-label="Outras soluções do ecossistema"
      className={`mt-16 pt-12 border-t border-slate-200 dark:border-slate-800 ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block mb-1">
            ECOSSISTEMA ORBIS
          </span>
          <h3 className="font-heading font-black text-xl sm:text-2xl text-slate-900 dark:text-white">
            {titulo}
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl">
            {subtitulo}
          </p>
        </div>
        <Link
          to="/solucoes"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-emerald-700 dark:text-emerald-400 hover:underline min-h-[44px] shrink-0"
        >
          <span>Árvore de decisão completa</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {itensFiltrados.map((item) => (
          <Link
            key={item.href}
            to={item.href}
            className="group p-5 rounded-2xl bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 dark:hover:border-emerald-500/50 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Solução
                </span>
                {item.badge && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    {item.badge}
                  </span>
                )}
              </div>
              <h4 className="font-heading font-bold text-sm text-slate-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                {item.titulo}
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                {item.subtitulo}
              </p>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              <span>Conhecer</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}

export default BlocoOutrasSolucoes
