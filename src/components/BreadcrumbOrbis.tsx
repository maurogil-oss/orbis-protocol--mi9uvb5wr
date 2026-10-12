import React from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, Home } from 'lucide-react'

export interface BreadcrumbItemDef {
  label: string
  href?: string
}

export interface BreadcrumbOrbisProps {
  items: BreadcrumbItemDef[]
  className?: string
}

/**
 * Breadcrumb acessível (WCAG 2.1 AA / P0 de acessibilidade):
 * - <nav aria-label="Navegação estrutural">
 * - Estrutura de lista semântica <ol> e <li>
 * - Alvos de clique confortáveis (min-h-[44px] inline-flex items-center)
 * - Contraste alto garantido em tema claro (slate-600 / slate-900 / emerald-700) e escuro (slate-400 / white / emerald-400)
 * - aria-current="page" no item final
 */
export function BreadcrumbOrbis({ items, className = '' }: BreadcrumbOrbisProps) {
  return (
    <nav
      aria-label="Navegação estrutural"
      className={`w-full max-w-full overflow-x-auto py-2.5 ${className}`}
    >
      <ol className="flex items-center flex-wrap gap-1 text-xs font-medium text-slate-600 dark:text-slate-300">
        <li className="inline-flex items-center">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-slate-700 dark:text-slate-200 hover:text-emerald-700 dark:hover:text-emerald-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors min-h-[44px]"
            title="Página Inicial do Orbis Protocol"
          >
            <Home className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span className="sr-only">Início</span>
          </Link>
        </li>

        {items.map((item, index) => {
          const isLast = index === items.length - 1

          return (
            <li key={`${item.label}-${index}`} className="inline-flex items-center gap-1">
              <ChevronRight
                className="w-3.5 h-3.5 text-slate-400 dark:text-slate-400 shrink-0"
                aria-hidden="true"
              />
              {isLast || !item.href ? (
                <span
                  aria-current={isLast ? 'page' : undefined}
                  className="px-2 py-1 font-semibold text-slate-900 dark:text-[#F8FAFC] truncate max-w-[280px] sm:max-w-md inline-flex items-center min-h-[44px]"
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  to={item.href}
                  className="px-2 py-1 rounded text-slate-700 dark:text-slate-200 hover:text-emerald-700 dark:hover:text-emerald-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors truncate max-w-[240px] inline-flex items-center min-h-[44px]"
                >
                  {item.label}
                </Link>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

export default BreadcrumbOrbis
