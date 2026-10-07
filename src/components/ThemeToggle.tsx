import React, { useEffect, useState } from 'react'
import { Sun, Moon } from 'lucide-react'

export interface ThemeToggleProps {
  className?: string
  /**
   * 'default': p-2 com ícone w-4 h-4
   * 'compact': p-1.5 com ícone w-3.5 h-3.5 (ideal para cabeçalho mobile < 380px)
   */
  size?: 'default' | 'compact'
}

export function ThemeToggle({ className = '', size = 'default' }: ThemeToggleProps) {
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    return document.documentElement.classList.contains('dark')
  })

  useEffect(() => {
    // Sincroniza estado inicial com a classe atual do html
    const currentIsDark = document.documentElement.classList.contains('dark')
    setIsDark(currentIsDark)
  }, [])

  const toggleTheme = () => {
    const nextIsDark = !isDark
    setIsDark(nextIsDark)
    if (nextIsDark) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('orbis-theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('orbis-theme', 'light')
    }
  }

  const isCompact = size === 'compact'
  const paddingClass = isCompact ? 'p-1.5 rounded-lg' : 'p-2 rounded-xl'
  const iconClass = isCompact ? 'w-3.5 h-3.5' : 'w-4 h-4'

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={isDark ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
      aria-label={isDark ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
      className={`inline-flex items-center justify-center shrink-0 ${paddingClass} text-slate-500 hover:text-slate-900 dark:text-[#94A3B8] dark:hover:text-[#F8FAFC] border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0E1A2E] hover:bg-slate-50 dark:hover:bg-[#111827] transition-all duration-200 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/50 ${className}`}
    >
      {isDark ? (
        <Sun className={`${iconClass} text-amber-400 animate-in spin-in-180 duration-300`} />
      ) : (
        <Moon
          className={`${iconClass} text-slate-700 dark:text-[#94A3B8] animate-in spin-in-180 duration-300`}
        />
      )}
    </button>
  )
}
