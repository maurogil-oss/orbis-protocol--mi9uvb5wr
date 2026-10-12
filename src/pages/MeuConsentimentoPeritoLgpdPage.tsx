import React from 'react'
import { Link } from 'react-router-dom'
import { ShieldCheck, Award, ArrowLeft, ExternalLink, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { BlocoConsentimentoPeritoLgpd } from '@/components/BlocoConsentimentoPeritoLgpd'
import { useSeo } from '@/hooks/useSeo'
import { useAuth } from '@/contexts/AuthContext'

export default function MeuConsentimentoPeritoLgpdPage() {
  useSeo({
    title: 'Meu Consentimento LGPD — Perito Técnico | Orbis Protocol',
    description:
      'Gestão formal de consentimento de divulgação de dados técnicos e registro profissional nos passaportes e laudos dMRV conforme Art. 7º, I e Art. 6º, III da LGPD.',
  })

  const { user, role } = useAuth()

  return (
    <div className="min-h-screen py-6 md:py-12 bg-slate-50 dark:bg-[#0A1628] text-slate-900 dark:text-[#F8FAFC] transition-colors">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-6">
        {/* Barra superior de navegação */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-2">
            <Link to="/painel">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-8 text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-[#F8FAFC]"
              >
                <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                Voltar ao Painel
              </Button>
            </Link>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <span className="text-xs font-mono text-slate-500 dark:text-[#94A3B8]">
              Área do Perito:{' '}
              <strong className="text-slate-900 dark:text-[#F8FAFC]">{user?.email}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Link to="/revisor-f6">
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-8 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-[#F8FAFC]"
              >
                <Award className="w-3.5 h-3.5 mr-1 text-emerald-600 dark:text-[#059669]" />
                Revisão Pericial F6
              </Button>
            </Link>
            <Link to="/verificador" target="_blank">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-8 text-slate-600 dark:text-[#94A3B8]"
              >
                <ExternalLink className="w-3.5 h-3.5 mr-1" />
                Verificador Público
              </Button>
            </Link>
          </div>
        </div>

        {/* Bloco de Gestão de Consentimento */}
        <BlocoConsentimentoPeritoLgpd />
      </div>
    </div>
  )
}
