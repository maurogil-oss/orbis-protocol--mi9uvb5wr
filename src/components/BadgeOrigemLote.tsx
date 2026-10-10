import React from 'react'
import { FileCheck, Sparkles, AlertTriangle } from 'lucide-react'

export interface BadgeOrigemLoteProps {
  origem?: string | null
  isDemo?: boolean | null
  className?: string
  tamanho?: 'sm' | 'md' | 'lg'
}

/**
 * Determina se o registro possui origem documental verificada (real) ou sintética/sandbox.
 * Regra: real quando origem === "importado_manual_com_documento" OU !is_demo (e origem !== 'sintetico').
 */
export function isRegistroReal(origem?: string | null, isDemo?: boolean | null): boolean {
  if (origem === 'importado_manual_com_documento') {
    return true
  }
  if (origem === 'sintetico' || isDemo === true) {
    return false
  }
  return isDemo === false
}

/**
 * Badge padronizado de status Real / Sandbox dMRV / DEMO.
 * Exibe badge "Real" (esmeralda, ícone de verificação documental FileCheck, texto "Origem Documental Verificada")
 * quando origem === "importado_manual_com_documento" ou !is_demo.
 * Mantém badge "Sandbox dMRV"/"DEMO" nos registros sintéticos.
 */
export function BadgeOrigemLote({
  origem,
  isDemo,
  className = '',
  tamanho = 'md',
}: BadgeOrigemLoteProps) {
  const eReal = isRegistroReal(origem, isDemo)

  const classesTamanho = {
    sm: 'px-2 py-0.5 text-[9px] gap-1',
    md: 'px-2.5 py-0.5 text-[10px] gap-1.5',
    lg: 'px-3 py-1 text-xs gap-2',
  }[tamanho]

  const iconeTamanho = tamanho === 'lg' ? 'w-3.5 h-3.5' : 'w-3 h-3'

  if (eReal) {
    return (
      <span
        data-testid="badge-origem-real"
        className={`inline-flex items-center font-mono font-bold uppercase tracking-wider rounded-full bg-emerald-500/15 text-emerald-700 dark:text-[#10B981] border border-emerald-500/40 shadow-sm print:bg-emerald-50 print:text-emerald-800 print:border-emerald-600 ${classesTamanho} ${className}`}
        title="Origem Documental Verificada: dados apurados a partir de documento fiscal/técnico comprobatório auditável"
      >
        <FileCheck className={`${iconeTamanho} text-emerald-600 dark:text-[#10B981] shrink-0`} />
        <span>Origem Documental Verificada</span>
      </span>
    )
  }

  return (
    <span
      data-testid="badge-origem-sandbox"
      className={`inline-flex items-center font-mono font-extrabold uppercase tracking-wider rounded-full bg-amber-500/15 text-amber-600 dark:text-[#D9B36C] border border-amber-500/40 shadow-sm print:bg-amber-100 print:text-amber-900 print:border-amber-500 ${classesTamanho} ${className}`}
      title="Registro Sintético / Sandbox dMRV / Simulação de Demonstração"
    >
      <AlertTriangle className={`${iconeTamanho} text-amber-500 dark:text-[#D9B36C] shrink-0`} />
      <span>Sandbox dMRV • DEMO</span>
    </span>
  )
}

export default BadgeOrigemLote
