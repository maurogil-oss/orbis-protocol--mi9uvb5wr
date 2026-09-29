import React, { useEffect, useState } from 'react'
import { Sun, Moon } from 'lucide-react'

export function ThemeToggle({ className = '' }: { className?: string }) {
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

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={isDark ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
      aria-label={isDark ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
      className={`inline-flex items-center justify-center p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-[#93A3B5] dark:hover:text-[#F4F7FA] border border-slate-200 dark:border-[rgba(244,247,250,0.12)] bg-white dark:bg-[#111820] hover:bg-slate-50 dark:hover:bg-[#16202B] transition-all duration-200 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 ${className}`}
    >
      {isDark ? (
        <Sun className="w-4 h-4 text-amber-400 animate-in spin-in-180 duration-300" />
      ) : (
        <Moon className="w-4 h-4 text-slate-700 animate-in spin-in-180 duration-300" />
      )}
    </button>
  )
}
