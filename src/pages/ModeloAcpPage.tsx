import React from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Printer, Maximize2, Minimize2 } from 'lucide-react'
import { useSeo } from '@/hooks/useSeo'
import { OrbisLogo } from '@/components/OrbisLogo'
import { AcpSlide } from '@/components/acp-modelo/AcpSlide'
import { Slide1SumarioExecutivo } from '@/components/acp-modelo/Slide1SumarioExecutivo'
import { Slide2Segmentacao } from '@/components/acp-modelo/Slide2Segmentacao'
import { Slide3Regulamentacao } from '@/components/acp-modelo/Slide3Regulamentacao'
import { Slide4AnaliseTecnica } from '@/components/acp-modelo/Slide4AnaliseTecnica'
import { Slide5Roadmap } from '@/components/acp-modelo/Slide5Roadmap'
import { Slide6Riscos } from '@/components/acp-modelo/Slide6Riscos'
import { Slide7ProximaReuniao } from '@/components/acp-modelo/Slide7ProximaReuniao'

const TOTAL_SLIDES = 7

export const ModeloAcpPage: React.FC = () => {
  useSeo({
    title: 'Análise Estratégica — Modelo Comercial ACP — Orbis Protocol',
    description:
      'Documento de trabalho: modelo comercial e produtos para empresas associadas da Associação Comercial do Paraná (ACP), com pacotes por porte, análise técnica de integração e roadmap.',
  })

  const [currentSlide, setCurrentSlide] = React.useState(1)
  const [isFullscreen, setIsFullscreen] = React.useState(false)

  const goToSlide = React.useCallback((index: number) => {
    if (index >= 1 && index <= TOTAL_SLIDES) {
      setCurrentSlide(index)
      const el = document.getElementById(`acp-slide-${index}`)
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [])

  const nextSlide = React.useCallback(() => {
    if (currentSlide < TOTAL_SLIDES) goToSlide(currentSlide + 1)
  }, [currentSlide, goToSlide])

  const prevSlide = React.useCallback(() => {
    if (currentSlide > 1) goToSlide(currentSlide - 1)
  }, [currentSlide, goToSlide])

  // Navegação por teclado (Setas / Home / End), ignorando campos de texto
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return
      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault()
        nextSlide()
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault()
        prevSlide()
      } else if (e.key === 'Home') {
        e.preventDefault()
        goToSlide(1)
      } else if (e.key === 'End') {
        e.preventDefault()
        goToSlide(TOTAL_SLIDES)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [nextSlide, prevSlide, goToSlide])

  // Sincroniza slide atual com a posição de rolagem
  React.useEffect(() => {
    const handleScroll = () => {
      for (let i = 1; i <= TOTAL_SLIDES; i++) {
        const el = document.getElementById(`acp-slide-${i}`)
        if (el) {
          const rect = el.getBoundingClientRect()
          if (rect.top <= window.innerHeight * 0.4 && rect.bottom >= window.innerHeight * 0.4) {
            setCurrentSlide(i)
            break
          }
        }
      }
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {})
      setIsFullscreen(true)
    } else {
      document.exitFullscreen().catch(() => {})
      setIsFullscreen(false)
    }
  }

  return (
    <div className="acp-deck-root min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-emerald-600/20">
      {/* Barra de controle flutuante (oculta na impressão) */}
      <header
        aria-label="Controles do documento"
        className="no-print sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-200 px-4 sm:px-8 py-3 flex items-center justify-between shadow-sm"
      >
        <div className="flex items-center gap-3">
          <OrbisLogo variant="full" height={28} alt="Orbis Protocol" />
          <div className="hidden md:flex items-center gap-2 pl-4 border-l border-slate-200">
            <span className="text-[11px] font-mono tracking-wider uppercase text-emerald-700 font-semibold">
              Análise Estratégica
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-500">Modelo Comercial ACP</span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1 bg-slate-100 border border-slate-200 rounded-lg p-1">
            <button
              type="button"
              onClick={prevSlide}
              disabled={currentSlide === 1}
              aria-label="Seção anterior"
              className="p-1.5 rounded-md hover:bg-white text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="px-2.5 font-mono text-xs font-bold text-emerald-700 select-none">
              <span className="text-slate-800">{String(currentSlide).padStart(2, '0')}</span>
              <span className="text-slate-400 font-normal mx-1">/</span>
              <span>{String(TOTAL_SLIDES).padStart(2, '0')}</span>
            </div>
            <button
              type="button"
              onClick={nextSlide}
              disabled={currentSlide === TOTAL_SLIDES}
              aria-label="Próxima seção"
              className="p-1.5 rounded-md hover:bg-white text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => window.print()}
            aria-label="Exportar PDF do documento"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm transition-all active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">Exportar PDF</span>
            <span className="sm:hidden">PDF</span>
          </button>

          <button
            type="button"
            onClick={toggleFullscreen}
            aria-label="Alternar tela cheia"
            className="hidden sm:inline-flex p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 border border-slate-200 transition-all"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      <main className="deck-container max-w-[1440px] mx-auto px-3 sm:px-6 lg:px-8 py-6 space-y-8 sm:space-y-12">
        {/* Rótulo de rascunho */}
        <div className="no-print max-w-5xl mx-auto rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-xs sm:text-sm text-amber-900">
          <strong>Documento de trabalho — Análise Estratégica.</strong> Proposta sujeita a
          aprovação. Versão 1.0. Distribuição restrita à equipe Orbis e à diretoria da ACP.
        </div>

        <Slide1SumarioExecutivo />
        <Slide2Segmentacao />
        <Slide3Regulamentacao />
        <Slide4AnaliseTecnica />
        <Slide5Roadmap />
        <Slide6Riscos />
        <Slide7ProximaReuniao />
      </main>

      <footer className="no-print max-w-[1440px] mx-auto px-4 sm:px-8 pb-10 pt-4 text-center text-xs text-slate-500">
        Orbis Protocol • Documento interno de trabalho — v1.0 — distribuição restrita
      </footer>
    </div>
  )
}

export default ModeloAcpPage
