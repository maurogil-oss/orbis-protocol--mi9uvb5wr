import React, { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { FileQuestion, Home, ShieldCheck, Stethoscope, ArrowRight } from 'lucide-react'
import { useSeo } from '@/hooks/useSeo'

export default function NotFound() {
  const location = useLocation()

  useSeo({
    title: 'Página não encontrada (404) — Orbis Protocol',
    description:
      'A página solicitada não foi localizada na infraestrutura pública e autenticada do Orbis Protocol.',
  })

  useEffect(() => {
    console.error('404 Error: Usuário tentou acessar rota inexistente:', location.pathname)
  }, [location.pathname])

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-16 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-[#0A1628] transition-colors">
      <div className="w-full max-w-xl text-center space-y-8 animate-fade-in">
        <div className="relative inline-flex items-center justify-center">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-lg">
            <FileQuestion className="w-10 h-10 sm:w-12 sm:h-12" />
          </div>
          <span className="absolute -bottom-2 -right-2 px-3 py-1 rounded-full text-xs font-mono font-black uppercase bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md">
            Erro 404
          </span>
        </div>

        <div className="space-y-3">
          <h1 className="font-heading font-black text-3xl sm:text-4xl text-slate-900 dark:text-[#F8FAFC] tracking-tight">
            Página não encontrada
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-[#94A3B8] max-w-md mx-auto leading-relaxed">
            O endereço digitado (
            <code className="font-mono text-xs px-2 py-0.5 rounded bg-slate-200/80 dark:bg-slate-800 text-slate-800 dark:text-[#F8FAFC]">
              {location.pathname}
            </code>
            ) não existe, foi movido ou está temporariamente indisponível.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            to="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-emerald-glow text-sm min-h-[44px]"
          >
            <Home className="w-4 h-4" />
            <span>Voltar ao início</span>
          </Link>
          <Link
            to="/verificador"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold bg-white dark:bg-[#0E1A2E] border border-slate-300 dark:border-slate-800 text-slate-800 dark:text-[#F8FAFC] hover:bg-slate-100 dark:hover:bg-[#16202B] hover:border-emerald-500 transition-colors text-sm min-h-[44px]"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Verificador de Atestados</span>
          </Link>
        </div>

        <div className="pt-6 border-t border-slate-200 dark:border-slate-800/80 text-xs text-slate-500 dark:text-[#94A3B8] space-y-2">
          <p>Procurando pelo enquadramento da sua empresa?</p>
          <Link
            to="/diagnostico"
            className="inline-flex items-center gap-1.5 font-bold text-emerald-700 dark:text-emerald-400 hover:underline"
          >
            <Stethoscope className="w-3.5 h-3.5" />
            <span>Iniciar diagnóstico gratuito por CNPJ</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  )
}
