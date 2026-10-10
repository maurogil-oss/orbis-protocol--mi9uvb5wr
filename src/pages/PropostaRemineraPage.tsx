import React, { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  ChevronLeft,
  ChevronRight,
  Printer,
  Maximize2,
  Minimize2,
  Layers,
  ShieldCheck,
  Cpu,
  Flame,
  Recycle,
  Sparkles,
  TreePine,
  ArrowRight,
  TrendingUp,
  FileCheck2,
  Building2,
  Scale,
  Hash,
  Share2,
  CheckCircle2,
} from 'lucide-react'
import { OrbisLogo, OrbisOfficialGlobe } from '@/components/OrbisLogo'

interface SlideContent {
  id: number
  badge: string
  title: string
  subtitle?: string
}

export const PropostaRemineraPage: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(1)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const totalSlides = 10

  const goToSlide = useCallback(
    (index: number) => {
      if (index >= 1 && index <= totalSlides) {
        setCurrentSlide(index)
        const element = document.getElementById(`slide-${index}`)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }
    },
    [totalSlides],
  )

  const nextSlide = useCallback(() => {
    if (currentSlide < totalSlides) {
      goToSlide(currentSlide + 1)
    }
  }, [currentSlide, totalSlides, goToSlide])

  const prevSlide = useCallback(() => {
    if (currentSlide > 1) {
      goToSlide(currentSlide - 1)
    }
  }, [currentSlide, goToSlide])

  // Navegação por teclado (Setas Esquerda/Direita)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignora se estiver em input ou textarea
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
        goToSlide(totalSlides)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [nextSlide, prevSlide, goToSlide, totalSlides])

  // Sincroniza slide atual com scroll no modo tela cheia / normal
  useEffect(() => {
    const handleScroll = () => {
      for (let i = 1; i <= totalSlides; i++) {
        const el = document.getElementById(`slide-${i}`)
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
  }, [totalSlides])

  const handlePrint = () => {
    window.print()
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {})
      setIsFullscreen(true)
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {})
      }
      setIsFullscreen(false)
    }
  }

  const slidesMeta: SlideContent[] = [
    {
      id: 1,
      badge: 'PROPOSTA COMERCIAL • DECK ESTRATÉGICO',
      title: 'Orbis Protocol — Proposta de Parceria',
    },
    {
      id: 2,
      badge: 'ALINHAMENTO ESTRATÉGICO',
      title: 'Contexto e Posicionamento: Reminera + Orbis',
    },
    { id: 3, badge: 'DIAGNÓSTICO ESTRATÉGICO', title: 'As 3 Dores Críticas Endereçadas' },
    {
      id: 4,
      badge: 'PILOTO IMEDIATO (30–60 DIAS)',
      title: 'Módulo 1: Passaporte Digital de Aço Secundário',
    },
    {
      id: 5,
      badge: 'COMPLIANCE & DIFERENCIAÇÃO B2B',
      title: 'Módulo 2: Selo de Logística Reversa Auditada',
    },
    {
      id: 6,
      badge: 'FASE 2 • CONEXÃO DE CADEIA',
      title: 'Módulo 3: Manifesto Digital CDV → Reminera',
    },
    { id: 7, badge: 'INTEGRIDADE AMBIENTAL', title: 'Módulo 4: dMRV de Gases Refrigerantes' },
    {
      id: 8,
      badge: 'FRONTEIRA TECNOLÓGICA',
      title: 'Módulo 5: Passaporte de Materiais Críticos Recuperados',
    },
    {
      id: 9,
      badge: 'ROADMAP ESTRATÉGICO',
      title: 'Visão de Evolução: Carbono → Cadeia → Natureza',
    },
    { id: 10, badge: 'PLANO DE AÇÃO', title: 'Próximos Passos & Início da Operação Piloto' },
  ]

  return (
    <div className="proposta-deck-root min-h-screen bg-[#0A0E12] text-[#F4F7FA] font-sans selection:bg-[#12B886]/30 selection:text-[#F4F7FA]">
      {/* BARRA SUPERIOR FLUTUANTE DE CONTROLE (Oculta na impressão) */}
      <header
        aria-label="Controles da Apresentação"
        className="no-print sticky top-0 z-50 bg-[#0A0E12] border-b border-[rgba(244,247,250,0.1)] px-4 sm:px-8 py-3.5 flex items-center justify-between transition-all shadow-[0_4px_24px_rgba(0,0,0,0.6)]"
      >
        <div className="flex items-center gap-4">
          <OrbisLogo variant="full" height={30} alt="Orbis Protocol" />
          <div className="hidden md:flex items-center gap-2 pl-4 border-l border-[rgba(244,247,250,0.12)]">
            <span className="text-[11px] font-mono tracking-wider uppercase text-[#D9B36C] font-semibold">
              Metal Carbon Hub / Reminera
            </span>
            <span className="text-xs text-[#93A3B5]">•</span>
            <span className="text-xs text-[#93A3B5]">Proposta Comercial & Técnica</span>
          </div>
        </div>

        {/* Controles centrais de navegação */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1 bg-[#16202B] border border-[rgba(244,247,250,0.12)] rounded-lg p-1">
            <button
              type="button"
              onClick={prevSlide}
              disabled={currentSlide === 1}
              aria-label="Slide anterior"
              className="p-1.5 rounded-md hover:bg-[#111820] text-[#F4F7FA] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="px-2.5 font-mono text-xs font-bold text-[#12B886] select-none">
              <span className="text-[#F4F7FA]">{String(currentSlide).padStart(2, '0')}</span>
              <span className="text-[#93A3B5] font-normal mx-1">/</span>
              <span>{String(totalSlides).padStart(2, '0')}</span>
            </div>
            <button
              type="button"
              onClick={nextSlide}
              disabled={currentSlide === totalSlides}
              aria-label="Próximo slide"
              className="p-1.5 rounded-md hover:bg-[#111820] text-[#F4F7FA] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Botão de Exportar PDF */}
          <button
            type="button"
            onClick={handlePrint}
            aria-label="Exportar PDF da proposta"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#12B886] hover:bg-[#0CA678] text-[#0A0E12] font-semibold text-xs sm:text-sm transition-all shadow-emerald-glow active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">Exportar PDF</span>
            <span className="sm:hidden">PDF</span>
          </button>

          {/* Botão Tela Cheia */}
          <button
            type="button"
            onClick={toggleFullscreen}
            aria-label="Alternar tela cheia"
            className="hidden sm:inline-flex p-2 rounded-lg bg-[#16202B] hover:bg-[#111820] text-[#93A3B5] hover:text-[#F4F7FA] border border-[rgba(244,247,250,0.12)] transition-all"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* CONTAINER PRINCIPAL DOS SLIDES */}
      <main className="deck-container max-w-[1440px] mx-auto px-3 sm:px-6 lg:px-8 py-6 space-y-8 sm:space-y-12">
        {/* ============================================================== */}
        {/* SLIDE 1 — CAPA */}
        {/* ============================================================== */}
        <section
          id="slide-1"
          aria-label="Slide 1 — Capa: Orbis Protocol — Proposta de Parceria"
          className="slide-page relative w-full aspect-auto lg:aspect-[16/9] min-h-[580px] sm:min-h-[640px] lg:min-h-[680px] bg-gradient-to-br from-[#0D131A] via-[#111820] to-[#0A0E12] rounded-2xl sm:rounded-3xl border border-[rgba(244,247,250,0.12)] shadow-2xl p-6 sm:p-10 lg:p-16 flex flex-col justify-between overflow-hidden"
        >
          {/* Brilho esmeralda e dourado de fundo */}
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#12B886]/15 rounded-full blur-[140px] pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-[#D9B36C]/10 rounded-full blur-[140px] pointer-events-none" />

          {/* Cabeçalho do Slide */}
          <div className="relative z-10 flex items-center justify-between pb-6 border-b border-[rgba(244,247,250,0.08)]">
            <div className="flex items-center gap-3">
              <OrbisOfficialGlobe size={42} />
              <div>
                <span className="font-heading font-black tracking-wider text-sm sm:text-base text-[#F4F7FA]">
                  ORBIS PROTOCOL
                </span>
                <span className="block text-[11px] font-mono text-[#D9B36C] uppercase tracking-widest">
                  Infraestrutura Probatória B2B
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="inline-block px-3 py-1 rounded-full text-[11px] font-mono font-bold bg-[#16202B] text-[#12B886] border border-[#12B886]/30">
                PROPOSTA ESTRATÉGICA
              </span>
              <span className="block text-[11px] text-[#93A3B5] mt-1 font-mono">
                Março de 2026 • Documento Oficial
              </span>
            </div>
          </div>

          {/* Corpo Central da Capa */}
          <div className="relative z-10 my-auto py-8 sm:py-12 space-y-6 max-w-4xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#D9B36C]/10 border border-[#D9B36C]/30 text-[#D9B36C] text-xs font-mono font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Parceria Tecnológica Institucional</span>
            </div>

            <h1 className="font-heading font-black text-3xl sm:text-5xl lg:text-6xl text-[#F4F7FA] leading-[1.1] tracking-tight">
              Orbis Protocol — <br className="hidden sm:inline" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#12B886] via-[#20c997] to-[#D9B36C]">
                Proposta de Parceria
              </span>
            </h1>

            <p className="text-base sm:text-xl text-[#93A3B5] leading-relaxed max-w-3xl font-light">
              Infraestrutura de prova documental, rastreabilidade criptográfica e valorização de
              descarbonização para a{' '}
              <strong className="text-[#F4F7FA] font-semibold">Metal Carbon Hub / Reminera</strong>.
            </p>

            {/* Badges de Destaque da Operação Reminera */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-4">
              <div className="p-3.5 rounded-xl bg-[#16202B]/80 border border-[rgba(244,247,250,0.1)]">
                <span className="text-[10px] font-mono text-[#D9B36C] uppercase block">
                  Planta Industrial
                </span>
                <span className="font-heading font-bold text-sm text-[#F4F7FA]">
                  Fazenda Rio Grande / PR
                </span>
                <span className="text-[11px] text-[#93A3B5] block mt-0.5">
                  18.000 m² • Shredder do Paraná
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-[#16202B]/80 border border-[rgba(244,247,250,0.1)]">
                <span className="text-[10px] font-mono text-[#12B886] uppercase block">
                  Filosofia Operacional
                </span>
                <span className="font-heading font-bold text-sm text-[#F4F7FA]">
                  Zero Waste to Landfill
                </span>
                <span className="text-[11px] text-[#93A3B5] block mt-0.5">
                  Mineração urbana avançada
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-[#16202B]/80 border border-[rgba(244,247,250,0.1)]">
                <span className="text-[10px] font-mono text-[#93A3B5] uppercase block">
                  Interoperabilidade
                </span>
                <span className="font-heading font-bold text-sm text-[#F4F7FA]">
                  SRA Complementado
                </span>
                <span className="text-[11px] text-[#93A3B5] block mt-0.5">
                  Camada probatória acima do ERP
                </span>
              </div>
            </div>
          </div>

          {/* Rodapé Padrão do Slide */}
          <div className="relative z-10 pt-4 border-t border-[rgba(244,247,250,0.08)] flex items-center justify-between text-xs text-[#93A3B5]">
            <div className="flex items-center gap-2">
              <OrbisOfficialGlobe size={18} />
              <span className="font-mono text-[11px]">
                Orbis Protocol • Governança & Prova Criptográfica
              </span>
            </div>
            <span className="font-mono text-[11px] text-[#D9B36C] font-bold">Slide 01 / 10</span>
          </div>
        </section>

        {/* ============================================================== */}
        {/* SLIDE 2 — CONTEXTO & POSICIONAMENTO */}
        {/* ============================================================== */}
        <section
          id="slide-2"
          aria-label="Slide 2 — Contexto e Posicionamento: Reminera + Orbis"
          className="slide-page relative w-full aspect-auto lg:aspect-[16/9] min-h-[580px] sm:min-h-[640px] lg:min-h-[680px] bg-gradient-to-br from-[#0D131A] via-[#111820] to-[#0A0E12] rounded-2xl sm:rounded-3xl border border-[rgba(244,247,250,0.12)] shadow-2xl p-6 sm:p-10 lg:p-16 flex flex-col justify-between overflow-hidden"
        >
          <div className="relative z-10 flex items-center justify-between pb-4 border-b border-[rgba(244,247,250,0.08)]">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#12B886]" />
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#12B886]">
                02 • CONTEXTO E ALINHAMENTO
              </span>
            </div>
            <OrbisLogo variant="emblem" height={24} alt="Orbis" />
          </div>

          <div className="relative z-10 my-auto py-6 space-y-6">
            <div className="max-w-3xl space-y-3">
              <h2 className="font-heading font-black text-2xl sm:text-4xl text-[#F4F7FA] leading-tight">
                Vocês dominam a operação física. <br />
                <span className="text-[#12B886]">
                  O Orbis transforma dados em prova jurídica e financeira.
                </span>
              </h2>
              <p className="text-sm sm:text-base text-[#93A3B5] leading-relaxed">
                A Reminera opera o único shredder do Paraná em Fazenda Rio Grande (R$ 50M
                investidos, 18.000 m² de pátio). O sistema proprietário{' '}
                <strong className="text-[#F4F7FA]">SRA</strong> já realiza a coleta operacional com
                excelência. O papel do Orbis{' '}
                <strong className="text-[#D9B36C]">não é substituir nem competir com o SRA</strong>,
                mas atuar como camada probatória complementar externa.
              </p>
            </div>

            {/* Comparativo de Papéis: SRA vs Orbis Protocol */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
              <div className="p-5 sm:p-6 rounded-2xl bg-[#16202B]/90 border border-[rgba(244,247,250,0.12)] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold uppercase text-[#93A3B5] tracking-wider">
                    SISTEMA PROPRIETÁRIO REMINERA
                  </span>
                  <span className="px-2.5 py-0.5 rounded text-[10px] font-mono bg-[#0A0E12] text-[#93A3B5] border border-[rgba(244,247,250,0.1)]">
                    Camada Operacional Interna
                  </span>
                </div>
                <h3 className="font-heading font-bold text-lg text-[#F4F7FA]">
                  SRA — Rastreamento Operacional
                </h3>
                <ul className="space-y-2 text-xs sm:text-sm text-[#93A3B5]">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#93A3B5] shrink-0 mt-0.5" />
                    <span>Controle de balança, entrada e pesagem de caminhões no pátio.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#93A3B5] shrink-0 mt-0.5" />
                    <span>
                      Gestão interna do triturador (shredder) e separadores magnéticos/correntes de
                      Foucault.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#93A3B5] shrink-0 mt-0.5" />
                    <span>
                      Estoque fabril, movimentação física e emissão de notas fiscais internas.
                    </span>
                  </li>
                </ul>
              </div>

              <div className="p-5 sm:p-6 rounded-2xl bg-[#111820] border-2 border-[#12B886]/40 shadow-emerald-glow-subtle space-y-3 relative">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold uppercase text-[#12B886] tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    CAMADA ORBIS PROTOCOL • DIFERENCIAL DE INTENSIDADE REAL
                  </span>
                  <span className="px-2.5 py-0.5 rounded text-[10px] font-mono bg-[#12B886]/15 text-[#12B886] border border-[#12B886]/30">
                    Camada Probatória Externa
                  </span>
                </div>
                <h3 className="font-heading font-bold text-lg text-[#F4F7FA]">
                  Infraestrutura de Prova Documental (dMRV)
                </h3>
                <div className="p-2.5 rounded-lg bg-[#0A0E12] border border-[#12B886]/30 text-xs text-[#F4F7FA] leading-relaxed">
                  <strong className="text-[#12B886]">Diferencial de Intensidade:</strong> o que os
                  bancos fazem por estimativa de categorias de gasto (Extrato de Carbono do C6), a
                  Orbis faz pelo dado real da nota fiscal — insumo por insumo. Indicadores de
                  intensidade (<strong className="text-[#12B886]">CO₂e por nota</strong>,{' '}
                  <strong className="text-[#12B886]">CO₂e por R$ faturado</strong>) como números que
                  nenhum concorrente mostra.
                </div>
                <ul className="space-y-2 text-xs sm:text-sm text-[#93A3B5]">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#12B886] shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-[#F4F7FA]">Hash Criptográfico SHA-256:</strong>{' '}
                      selagem imutável de lotes com timestamp.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#12B886] shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-[#F4F7FA]">Selos Verificáveis Publicamente:</strong>{' '}
                      link/QR Code sem expor segredos industriais da Reminera.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#12B886] shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-[#F4F7FA]">Conformidade Fiscal & ESG:</strong>{' '}
                      blindagem contra glosa IBS/CBS (EC 132) e exigências do Programa MOVER.
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="relative z-10 pt-4 border-t border-[rgba(244,247,250,0.08)] flex items-center justify-between text-xs text-[#93A3B5]">
            <div className="flex items-center gap-2">
              <OrbisOfficialGlobe size={18} />
              <span className="font-mono text-[11px]">
                Interoperabilidade via API & Webhook com o SRA
              </span>
            </div>
            <span className="font-mono text-[11px] text-[#D9B36C] font-bold">Slide 02 / 10</span>
          </div>
        </section>

        {/* ============================================================== */}
        {/* SLIDE 3 — AS 3 DORES */}
        {/* ============================================================== */}
        <section
          id="slide-3"
          aria-label="Slide 3 — As 3 Dores Críticas Endereçadas"
          className="slide-page relative w-full aspect-auto lg:aspect-[16/9] min-h-[580px] sm:min-h-[640px] lg:min-h-[680px] bg-gradient-to-br from-[#0D131A] via-[#111820] to-[#0A0E12] rounded-2xl sm:rounded-3xl border border-[rgba(244,247,250,0.12)] shadow-2xl p-6 sm:p-10 lg:p-16 flex flex-col justify-between overflow-hidden"
        >
          <div className="relative z-10 flex items-center justify-between pb-4 border-b border-[rgba(244,247,250,0.08)]">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#D9B36C]" />
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#D9B36C]">
                03 • AS DORES CRÍTICAS DA CADEIA
              </span>
            </div>
            <OrbisLogo variant="emblem" height={24} alt="Orbis" />
          </div>

          <div className="relative z-10 my-auto py-6 space-y-6">
            <div className="max-w-3xl space-y-2">
              <h2 className="font-heading font-black text-2xl sm:text-4xl text-[#F4F7FA] leading-tight">
                Os 3 gargalos que travam margem e compliance
              </h2>
              <p className="text-sm sm:text-base text-[#93A3B5]">
                O mercado de sucata e mineração urbana enfrenta uma virada regulatória sem
                precedentes em 2026.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-5 pt-2">
              {/* Dor A */}
              <div className="p-5 sm:p-6 rounded-2xl bg-[#16202B]/80 border border-[rgba(244,247,250,0.1)] flex flex-col justify-between space-y-4 hover:border-[#12B886]/50 transition-all">
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-[#12B886]/10 border border-[#12B886]/30 flex items-center justify-center text-[#12B886]">
                    <FileCheck2 className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-mono uppercase tracking-wider text-[#12B886] font-bold block">
                    DOR 01 • RASTREABILIDADE
                  </span>
                  <h3 className="font-heading font-bold text-base sm:text-lg text-[#F4F7FA]">
                    Comprovação de Origem Legal e Baixa Veicular
                  </h3>
                  <p className="text-xs sm:text-sm text-[#93A3B5] leading-relaxed">
                    Exigências crescentes da <strong className="text-[#F4F7FA]">PNRS</strong>,{' '}
                    <strong className="text-[#F4F7FA]">Programa MOVER</strong> e{' '}
                    <strong className="text-[#F4F7FA]">Resolução CONTRAN 611</strong>. Sucata de
                    leilão ou desmanche sem prova irrefutável de baixa no Detran e NF-e corre risco
                    de bloqueio e desqualificação por clientes industriais.
                  </p>
                </div>
                <div className="p-2.5 rounded-lg bg-[#0A0E12] border border-[rgba(244,247,250,0.08)] text-[11px] text-[#D9B36C] font-mono">
                  Solução: Passaporte DPP com hash de baixa veicular
                </div>
              </div>

              {/* Dor B */}
              <div className="p-5 sm:p-6 rounded-2xl bg-[#16202B]/80 border border-[rgba(244,247,250,0.1)] flex flex-col justify-between space-y-4 hover:border-[#D9B36C]/50 transition-all">
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-[#D9B36C]/10 border border-[#D9B36C]/30 flex items-center justify-center text-[#D9B36C]">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-mono uppercase tracking-wider text-[#D9B36C] font-bold block">
                    DOR 02 • MONETIZAÇÃO ESG
                  </span>
                  <h3 className="font-heading font-bold text-base sm:text-lg text-[#F4F7FA]">
                    Sucata Vendida como Commodity Genérica
                  </h3>
                  <p className="text-xs sm:text-sm text-[#93A3B5] leading-relaxed">
                    Cada tonelada de sucata de aço triturada pela Reminera evita cerca de{' '}
                    <strong className="text-[#F4F7FA]">1,5 tCO₂e</strong> em relação ao minério de
                    ferro virgem. Hoje essa vantagem climática é absorvida pelo comprador sem gerar
                    o devido prêmio financeiro de descarbonização à Reminera.
                  </p>
                </div>
                <div className="p-2.5 rounded-lg bg-[#0A0E12] border border-[rgba(244,247,250,0.08)] text-[11px] text-[#12B886] font-mono">
                  Solução: dMRV de CO₂e evitado por lote comercial
                </div>
              </div>

              {/* Dor C */}
              <div className="p-5 sm:p-6 rounded-2xl bg-[#16202B]/80 border border-[rgba(244,247,250,0.1)] flex flex-col justify-between space-y-4 hover:border-[#12B886]/50 transition-all">
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-[#12B886]/10 border border-[#12B886]/30 flex items-center justify-center text-[#12B886]">
                    <Flame className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-mono uppercase tracking-wider text-[#12B886] font-bold block">
                    DOR 03 • INTEGRIDADE TÉCNICA
                  </span>
                  <h3 className="font-heading font-bold text-base sm:text-lg text-[#F4F7FA]">
                    Auditoria de Destruição de Gases Refrigerantes
                  </h3>
                  <p className="text-xs sm:text-sm text-[#93A3B5] leading-relaxed">
                    Gases recolhidos de ar-condicionado veicular e linha branca (R-134a, CFC-12)
                    possuem GWP altíssimo (1.430 a &gt;10.000). A destruição térmica em
                    coprocessamento exige pesagens e vazões à prova de contestação para auditorias
                    severas.
                  </p>
                </div>
                <div className="p-2.5 rounded-lg bg-[#0A0E12] border border-[rgba(244,247,250,0.08)] text-[11px] text-[#D9B36C] font-mono">
                  Solução: Trilha imutável pronta para envio a VVB
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-10 pt-4 border-t border-[rgba(244,247,250,0.08)] flex items-center justify-between text-xs text-[#93A3B5]">
            <div className="flex items-center gap-2">
              <OrbisOfficialGlobe size={18} />
              <span className="font-mono text-[11px]">
                Proteção jurídica contra fraudes e passivos da cadeia
              </span>
            </div>
            <span className="font-mono text-[11px] text-[#D9B36C] font-bold">Slide 03 / 10</span>
          </div>
        </section>

        {/* ============================================================== */}
        {/* SLIDE 4 — MÓDULO 1: PASSAPORTE DIGITAL DE AÇO SECUNDÁRIO */}
        {/* ============================================================== */}
        <section
          id="slide-4"
          aria-label="Slide 4 — Módulo 1 (Porta de Entrada / Piloto): Passaporte Digital de Aço Secundário"
          className="slide-page relative w-full aspect-auto lg:aspect-[16/9] min-h-[580px] sm:min-h-[640px] lg:min-h-[680px] bg-gradient-to-br from-[#0D131A] via-[#111820] to-[#0A0E12] rounded-2xl sm:rounded-3xl border border-[rgba(244,247,250,0.12)] shadow-2xl p-6 sm:p-10 lg:p-16 flex flex-col justify-between overflow-hidden"
        >
          <div className="relative z-10 flex items-center justify-between pb-4 border-b border-[rgba(244,247,250,0.08)]">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#12B886]" />
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#12B886]">
                04 • MÓDULO 1 (PILOTO IMEDIATO 30–60 DIAS)
              </span>
            </div>
            <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-bold bg-[#12B886]/15 text-[#12B886] border border-[#12B886]/30">
              PORTA DE ENTRADA
            </span>
          </div>

          <div className="relative z-10 my-auto py-6 space-y-6">
            <div className="max-w-3xl space-y-2">
              <h2 className="font-heading font-black text-2xl sm:text-4xl text-[#F4F7FA] leading-tight">
                Passaporte Digital de Aço Secundário
              </h2>
              <p className="text-sm sm:text-base text-[#93A3B5]">
                Cada lote/fardo triturado no shredder recebe um Documento de Comprovação de Produto
                (DCP) com hash criptográfico, atestando origem legal e emissões de CO₂e evitadas.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
              {/* Lado Esquerdo: Mecânica e Benefícios */}
              <div className="lg:col-span-7 space-y-3.5">
                <div className="p-4 rounded-xl bg-[#16202B]/80 border border-[rgba(244,247,250,0.1)] space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#12B886]">
                    <Layers className="w-4 h-4" />
                    <span>COMO FUNCIONA NA PRÁTICA</span>
                  </div>
                  <p className="text-xs sm:text-sm text-[#93A3B5] leading-relaxed">
                    O SRA conclui a batelada do shredder e envia via webhook/API a massa líquida e a
                    NFe de saída. O Orbis calcula o CO₂e evitado (~1,5 tCO₂e por tonelada vs minério
                    virgem), gera o hash SHA-256 canônico e devolve o DCP com QR Code para o ticket
                    de expedição.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl bg-[#0A0E12] border border-[#12B886]/30">
                    <span className="text-[10px] font-mono uppercase text-[#12B886] block font-bold">
                      Impacto Comercial
                    </span>
                    <span className="font-heading font-bold text-sm text-[#F4F7FA] block mt-1">
                      Prêmio por Tonelada
                    </span>
                    <span className="text-[11px] text-[#93A3B5] block mt-0.5">
                      Siderúrgicas e OEMs do Programa MOVER pagam prêmio por lote com comprovação
                      auditável de pegada de carbono.
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#0A0E12] border border-[#D9B36C]/30">
                    <span className="text-[10px] font-mono uppercase text-[#D9B36C] block font-bold">
                      Proteção Fiscal
                    </span>
                    <span className="font-heading font-bold text-sm text-[#F4F7FA] block mt-1">
                      Blindagem IBS/CBS (EC 132)
                    </span>
                    <span className="text-[11px] text-[#93A3B5] block mt-0.5">
                      Dossiê probatório pronto contra glosa de créditos tributários na cadeia de
                      reciclagem da Reforma Tributária.
                    </span>
                  </div>
                </div>
              </div>

              {/* Lado Direito: Caixa de Escopo do Piloto */}
              <div className="lg:col-span-5 p-5 rounded-2xl bg-gradient-to-br from-[#16202B] to-[#111820] border-2 border-[#12B886]/40 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <span className="text-[11px] font-mono text-[#12B886] uppercase font-bold tracking-wider block">
                    FORMATO DO PROJETO PILOTO
                  </span>
                  <div className="font-heading font-black text-xl text-[#F4F7FA]">
                    30 a 60 Dias de Operação Assistida
                  </div>
                  <ul className="space-y-2 text-xs text-[#93A3B5]">
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#12B886] mt-1.5 shrink-0" />
                      <span>
                        Emissão de DCPs para fardos reais expedidos da planta de Fazenda Rio Grande.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#12B886] mt-1.5 shrink-0" />
                      <span>
                        Conferência pública por QR Code nos tickets de balança e laudos anexos às
                        NF-e.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#12B886] mt-1.5 shrink-0" />
                      <span>
                        Sem atrito na operação diária do shredder: integração leve e assíncrona.
                      </span>
                    </li>
                  </ul>
                </div>
                <div className="p-3 rounded-xl bg-[#0A0E12]/80 border border-[#12B886]/30 text-center">
                  <span className="text-xs font-mono text-[#12B886] font-bold">
                    Zero interrupção nas linhas de britagem e triagem
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-10 pt-4 border-t border-[rgba(244,247,250,0.08)] flex items-center justify-between text-xs text-[#93A3B5]">
            <div className="flex items-center gap-2">
              <OrbisOfficialGlobe size={18} />
              <span className="font-mono text-[11px]">
                Passaporte de Aço Secundário • Padrão DCP interoperável
              </span>
            </div>
            <span className="font-mono text-[11px] text-[#D9B36C] font-bold">Slide 04 / 10</span>
          </div>
        </section>

        {/* ============================================================== */}
        {/* SLIDE 5 — MÓDULO 2: LOGÍSTICA REVERSA AUDITADA (VIA ACP-PR) */}
        {/* ============================================================== */}
        <section
          id="slide-5"
          aria-label="Slide 5 — Módulo 2: Selo de Logística Reversa Auditada (via ACP-PR)"
          className="slide-page relative w-full aspect-auto lg:aspect-[16/9] min-h-[580px] sm:min-h-[640px] lg:min-h-[680px] bg-gradient-to-br from-[#0D131A] via-[#111820] to-[#0A0E12] rounded-2xl sm:rounded-3xl border border-[rgba(244,247,250,0.12)] shadow-2xl p-6 sm:p-10 lg:p-16 flex flex-col justify-between overflow-hidden"
        >
          <div className="relative z-10 flex items-center justify-between pb-4 border-b border-[rgba(244,247,250,0.08)]">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#D9B36C]" />
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#D9B36C]">
                05 • MÓDULO 2 (INDÚSTRIA ELETROELETRÔNICA & LINHA BRANCA)
              </span>
            </div>
            <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-bold bg-[#16202B] text-[#93A3B5] border border-[rgba(244,247,250,0.15)]">
              EM ESTRUTURAÇÃO
            </span>
          </div>

          <div className="relative z-10 my-auto py-6 space-y-6">
            <div className="max-w-3xl space-y-2">
              <h2 className="font-heading font-black text-2xl sm:text-4xl text-[#F4F7FA] leading-tight">
                Selo de Logística Reversa Auditada (via ACP-PR)
              </h2>
              <p className="text-sm sm:text-base text-[#93A3B5]">
                Para as indústrias de eletroeletrônicos e refrigeração atendidas pela Reminera:
                passaporte Orbis para comprovar desvio de aterro (Zero Waste to Landfill) na
                logística reversa da PNRS.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-5 rounded-2xl bg-[#16202B]/80 border border-[rgba(244,247,250,0.1)] space-y-2.5">
                <div className="w-9 h-9 rounded-lg bg-[#12B886]/10 border border-[#12B886]/30 flex items-center justify-center text-[#12B886]">
                  <Recycle className="w-5 h-5" />
                </div>
                <h3 className="font-heading font-bold text-base text-[#F4F7FA]">
                  Zero Waste to Landfill
                </h3>
                <p className="text-xs text-[#93A3B5] leading-relaxed">
                  Balanço de massa auditável demonstrando a destinação de cada fração: ferrosos,
                  não-ferrosos, plásticos e isolantes térmicos, assegurando nota máxima nas metas da
                  PNRS e Decreto 11.413/2023.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-[#16202B]/80 border border-[rgba(244,247,250,0.1)] space-y-2.5">
                <div className="w-9 h-9 rounded-lg bg-[#D9B36C]/10 border border-[#D9B36C]/30 flex items-center justify-center text-[#D9B36C]">
                  <Building2 className="w-5 h-5" />
                </div>
                <h3 className="font-heading font-bold text-base text-[#F4F7FA]">
                  Canal de Convênio ACP-PR
                </h3>
                <p className="text-xs text-[#93A3B5] leading-relaxed">
                  Acesso qualificado a indústrias compradoras e geradoras associadas à Associação
                  Comercial do Paraná, posicionando a Reminera como o operador preferencial de
                  descarte ecológico do estado.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-[#16202B]/80 border border-[rgba(244,247,250,0.1)] space-y-2.5">
                <div className="w-9 h-9 rounded-lg bg-[#12B886]/10 border border-[#12B886]/30 flex items-center justify-center text-[#12B886]">
                  <Scale className="w-5 h-5" />
                </div>
                <h3 className="font-heading font-bold text-base text-[#F4F7FA]">
                  Conexão SINIR & Órgãos
                </h3>
                <p className="text-xs text-[#93A3B5] leading-relaxed">
                  Dossiês digitais estruturados prontos para envio ao MTR Nacional/SINIR e órgãos
                  ambientais estaduais, eliminando planilhas manuais e inconsistências de pesos
                  informados.
                </p>
              </div>
            </div>

            {/* NOTA DE GOVERNANÇA RIGOROSA */}
            <div className="p-4 rounded-xl bg-[#0A0E12] border border-[#D9B36C]/40 text-xs text-[#93A3B5] space-y-1">
              <span className="font-mono text-[#D9B36C] font-bold block uppercase tracking-wider text-[10px]">
                DIRETRIZ DE GOVERNANÇA INSTITUCIONAL
              </span>
              <p>
                Módulo em estruturação técnica. O Orbis Protocol atua como{' '}
                <strong className="text-[#F4F7FA]">
                  infraestrutura de prova documental independente
                </strong>
                , não constituindo entidade gestora de certificados de reciclagem nem emissor de
                títulos oficiais.
              </p>
            </div>
          </div>

          <div className="relative z-10 pt-4 border-t border-[rgba(244,247,250,0.08)] flex items-center justify-between text-xs text-[#93A3B5]">
            <div className="flex items-center gap-2">
              <OrbisOfficialGlobe size={18} />
              <span className="font-mono text-[11px]">
                Logística Reversa PNRS • Camada de Prova Documental
              </span>
            </div>
            <span className="font-mono text-[11px] text-[#D9B36C] font-bold">Slide 05 / 10</span>
          </div>
        </section>

        {/* ============================================================== */}
        {/* SLIDE 6 — MÓDULO 3: MANIFESTO DIGITAL CDV → REMINERA */}
        {/* ============================================================== */}
        <section
          id="slide-6"
          aria-label="Slide 6 — Módulo 3 (Fase 2): Manifesto digital CDV → Reminera"
          className="slide-page relative w-full aspect-auto lg:aspect-[16/9] min-h-[580px] sm:min-h-[640px] lg:min-h-[680px] bg-gradient-to-br from-[#0D131A] via-[#111820] to-[#0A0E12] rounded-2xl sm:rounded-3xl border border-[rgba(244,247,250,0.12)] shadow-2xl p-6 sm:p-10 lg:p-16 flex flex-col justify-between overflow-hidden"
        >
          <div className="relative z-10 flex items-center justify-between pb-4 border-b border-[rgba(244,247,250,0.08)]">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#12B886]" />
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#12B886]">
                06 • MÓDULO 3 (FASE 2 • CONEXÃO DE CADEIA)
              </span>
            </div>
            <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-bold bg-[#12B886]/15 text-[#12B886] border border-[#12B886]/30">
              INTEGRAÇÃO UPSTREAM
            </span>
          </div>

          <div className="relative z-10 my-auto py-6 space-y-6">
            <div className="max-w-3xl space-y-2">
              <h2 className="font-heading font-black text-2xl sm:text-4xl text-[#F4F7FA] leading-tight">
                Manifesto Digital CDV → Reminera
              </h2>
              <p className="text-sm sm:text-base text-[#93A3B5]">
                Integração direta com a rede de Centros de Desmanche Veicular (CDVs) credenciados
                pelo Orbis Protocol no Paraná e na Região Sul.
              </p>
            </div>

            {/* Linha do Fluxo CDV -> Shredder */}
            <div className="p-5 sm:p-6 rounded-2xl bg-[#16202B]/80 border border-[rgba(244,247,250,0.1)] space-y-4">
              <div className="text-xs font-mono uppercase tracking-wider text-[#12B886] font-bold">
                FLUXO AUTOMATIZADO DE ORIGEM VEICULAR
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.08)] space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono text-[#D9B36C]">
                    <span>PASSO 1 • NO DESMANCHE</span>
                    <span className="w-2 h-2 rounded-full bg-[#D9B36C]" />
                  </div>
                  <h4 className="font-heading font-bold text-sm text-[#F4F7FA]">
                    Checklist de 77 Peças
                  </h4>
                  <p className="text-xs text-[#93A3B5]">
                    O perito do CDV classifica carcaças ou itens como{' '}
                    <strong className="text-[#F4F7FA]">
                      [Inservível / Reciclagem Obrigatória]
                    </strong>{' '}
                    conforme a Res. CONTRAN 611/2016.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#0A0E12] border border-[#12B886]/40 space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono text-[#12B886]">
                    <span>PASSO 2 • RASTRO DIGITAL</span>
                    <span className="w-2 h-2 rounded-full bg-[#12B886]" />
                  </div>
                  <h4 className="font-heading font-bold text-sm text-[#F4F7FA]">
                    Manifesto Digital Instantâneo
                  </h4>
                  <p className="text-xs text-[#93A3B5]">
                    O lote é vinculado à baixa oficial do DETRAN-PR e à NF-e de remessa com hash
                    pré-calculado, pronto para tráfego seguro.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.08)] space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono text-[#12B886]">
                    <span>PASSO 3 • NO PÁTIO REMINERA</span>
                    <span className="w-2 h-2 rounded-full bg-[#12B886]" />
                  </div>
                  <h4 className="font-heading font-bold text-sm text-[#F4F7FA]">
                    Entrada Limpa no Shredder
                  </h4>
                  <p className="text-xs text-[#93A3B5]">
                    A Reminera recebe material 100% blindado contra risco de receptação, com dados
                    de conformidade fiscal validados na SEFA-PR.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#111820] border border-[#12B886]/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <span className="text-[#93A3B5]">
                Posicionamento de médio prazo: criação de um{' '}
                <strong className="text-[#F4F7FA]">
                  canal cativo de sucata veicular regularizada
                </strong>
                , alimentando o shredder com fluxo contínuo e procedência defensável.
              </span>
              <span className="shrink-0 font-mono text-[#12B886] font-bold">
                Receita Recorrente & Escala
              </span>
            </div>
          </div>

          <div className="relative z-10 pt-4 border-t border-[rgba(244,247,250,0.08)] flex items-center justify-between text-xs text-[#93A3B5]">
            <div className="flex items-center gap-2">
              <OrbisOfficialGlobe size={18} />
              <span className="font-mono text-[11px]">
                Conexão CDV ↔ SRA ↔ Reminera • Detran-PR e Sefa-PR
              </span>
            </div>
            <span className="font-mono text-[11px] text-[#D9B36C] font-bold">Slide 06 / 10</span>
          </div>
        </section>

        {/* ============================================================== */}
        {/* SLIDE 7 — MÓDULO 4: dMRV DE GASES REFRIGERANTES */}
        {/* ============================================================== */}
        <section
          id="slide-7"
          aria-label="Slide 7 — Módulo 4: dMRV de Gases Refrigerantes"
          className="slide-page relative w-full aspect-auto lg:aspect-[16/9] min-h-[580px] sm:min-h-[640px] lg:min-h-[680px] bg-gradient-to-br from-[#0D131A] via-[#111820] to-[#0A0E12] rounded-2xl sm:rounded-3xl border border-[rgba(244,247,250,0.12)] shadow-2xl p-6 sm:p-10 lg:p-16 flex flex-col justify-between overflow-hidden"
        >
          <div className="relative z-10 flex items-center justify-between pb-4 border-b border-[rgba(244,247,250,0.08)]">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#12B886]" />
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#12B886]">
                07 • MÓDULO 4 (POTENCIAL CLIMÁTICO CRÍTICO)
              </span>
            </div>
            <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-bold bg-[#D9B36C]/15 text-[#D9B36C] border border-[#D9B36C]/30">
              dMRV PREPARATÓRIO
            </span>
          </div>

          <div className="relative z-10 my-auto py-6 space-y-6">
            <div className="max-w-3xl space-y-2">
              <h2 className="font-heading font-black text-2xl sm:text-4xl text-[#F4F7FA] leading-tight">
                dMRV de Gases Refrigerantes
              </h2>
              <p className="text-sm sm:text-base text-[#93A3B5]">
                Captura de dados de pesagem e vazão com integridade criptográfica (hash SHA-256)
                para destruição de fluidos de altíssimo potencial de aquecimento global (GWP).
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
              <div className="p-5 sm:p-6 rounded-2xl bg-[#16202B]/80 border border-[rgba(244,247,250,0.1)] space-y-3">
                <span className="text-xs font-mono uppercase text-[#D9B36C] font-bold block">
                  POTÊNCIA CLIMÁTICA DOS GASES RECOLHIDOS
                </span>
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.08)] flex items-center justify-between">
                    <div>
                      <span className="font-bold text-sm text-[#F4F7FA] block">R-134a (HFC)</span>
                      <span className="text-[11px] text-[#93A3B5]">
                        Ar-condicionado automotivo e refrigeração
                      </span>
                    </div>
                    <span className="font-mono text-sm text-[#12B886] font-bold">GWP: 1.430</span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.08)] flex items-center justify-between">
                    <div>
                      <span className="font-bold text-sm text-[#F4F7FA] block">CFC-12 / HCFCs</span>
                      <span className="text-[11px] text-[#93A3B5]">
                        Linha branca e frotas legadas
                      </span>
                    </div>
                    <span className="font-mono text-sm text-[#D9B36C] font-bold">
                      GWP: &gt; 10.000
                    </span>
                  </div>
                </div>
                <p className="text-xs text-[#93A3B5] leading-relaxed pt-1">
                  Pequenos volumes recolhidos na planta representam centenas ou milhares de
                  toneladas de CO₂e evitadas se comprovadamente destruídos.
                </p>
              </div>

              <div className="p-5 sm:p-6 rounded-2xl bg-[#111820] border-2 border-[#12B886]/40 space-y-3 flex flex-col justify-between">
                <div className="space-y-3">
                  <span className="text-xs font-mono uppercase text-[#12B886] font-bold block flex items-center gap-1.5">
                    <Hash className="w-3.5 h-3.5" />
                    ENTREGA: dMRV PRONTO PARA ENVIO
                  </span>
                  <h3 className="font-heading font-bold text-base text-[#F4F7FA]">
                    Integridade de Dados da Balança ao Coprocessamento
                  </h3>
                  <p className="text-xs text-[#93A3B5] leading-relaxed">
                    O Orbis sela os tickets de pesagem da recolhedora, os laudos de cromatografia de
                    pureza e o certificado de destruição térmica em forno cimenteiro com carimbo de
                    tempo e hash encadeado.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-[#0A0E12] border border-[#D9B36C]/40 text-xs text-[#93A3B5] space-y-1">
                  <span className="font-mono text-[10px] text-[#D9B36C] font-bold block uppercase">
                    REGRA FUNDAMENTAL DE PRECISÃO DISCURSIVA
                  </span>
                  <p>
                    Preparação para monetização futura, quando o programa de validação estiver
                    contratado. A emissão de créditos de carbono é atribuição exclusiva de{' '}
                    <strong className="text-[#F4F7FA]">VVB acreditado, ainda não contratado</strong>
                    . O Orbis entrega o dossiê dMRV pronto e auditável, nunca a emissão de créditos.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-10 pt-4 border-t border-[rgba(244,247,250,0.08)] flex items-center justify-between text-xs text-[#93A3B5]">
            <div className="flex items-center gap-2">
              <OrbisOfficialGlobe size={18} />
              <span className="font-mono text-[11px]">
                dMRV Digital • GWP IPCC AR6 • Dossiê Pronto para Auditoria
              </span>
            </div>
            <span className="font-mono text-[11px] text-[#D9B36C] font-bold">Slide 07 / 10</span>
          </div>
        </section>

        {/* ============================================================== */}
        {/* SLIDE 8 — MÓDULO 5: MATERIAIS CRÍTICOS RECUPERADOS */}
        {/* ============================================================== */}
        <section
          id="slide-8"
          aria-label="Slide 8 — Módulo 5 (Diferencial Estratégico): Passaporte Digital de Materiais Críticos Recuperados"
          className="slide-page relative w-full aspect-auto lg:aspect-[16/9] min-h-[580px] sm:min-h-[640px] lg:min-h-[680px] bg-gradient-to-br from-[#0D131A] via-[#111820] to-[#0A0E12] rounded-2xl sm:rounded-3xl border border-[rgba(244,247,250,0.12)] shadow-2xl p-6 sm:p-10 lg:p-16 flex flex-col justify-between overflow-hidden"
        >
          <div className="relative z-10 flex items-center justify-between pb-4 border-b border-[rgba(244,247,250,0.08)]">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#D9B36C]" />
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#D9B36C]">
                08 • MÓDULO 5 (DIFERENCIAL ESTRATÉGICO DE LONGO PRAZO)
              </span>
            </div>
            <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-bold bg-[#D9B36C]/15 text-[#D9B36C] border border-[#D9B36C]/30">
              MINERAÇÃO URBANA HIGH-VALUE
            </span>
          </div>

          <div className="relative z-10 my-auto py-6 space-y-6">
            <div className="max-w-3xl space-y-2">
              <h2 className="font-heading font-black text-2xl sm:text-4xl text-[#F4F7FA] leading-tight">
                Passaporte Digital de Materiais Críticos Recuperados
              </h2>
              <p className="text-sm sm:text-base text-[#93A3B5]">
                Prova de origem urbana, rastreabilidade e compliance para terras raras, metais
                nobres e cobre recuperados de e-waste e veículos.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-5 rounded-2xl bg-[#16202B]/80 border border-[rgba(244,247,250,0.1)] space-y-3">
                <div className="w-9 h-9 rounded-lg bg-[#D9B36C]/10 border border-[#D9B36C]/30 flex items-center justify-center text-[#D9B36C]">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h3 className="font-heading font-bold text-base text-[#F4F7FA]">
                  Terras Raras (Neodímio)
                </h3>
                <p className="text-xs text-[#93A3B5] leading-relaxed">
                  Ímãs permanentes recuperados de motores de tração, servomotores e discos rígidos
                  (e-waste). Matéria-prima crítica para a indústria da transição energética e
                  mobilidade elétrica.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-[#16202B]/80 border border-[rgba(244,247,250,0.1)] space-y-3">
                <div className="w-9 h-9 rounded-lg bg-[#12B886]/10 border border-[#12B886]/30 flex items-center justify-center text-[#12B886]">
                  <Cpu className="w-5 h-5" />
                </div>
                <h3 className="font-heading font-bold text-base text-[#F4F7FA]">
                  Metais Nobres (Au, Pd, Ag)
                </h3>
                <p className="text-xs text-[#93A3B5] leading-relaxed">
                  Ouro, paládio e prata concentrados em placas de circuito impresso (PCBs) e
                  catalisadores. A prova de origem urbana protege contra a suspeita de ouro ou
                  minério de garimpo ilegal.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-[#16202B]/80 border border-[rgba(244,247,250,0.1)] space-y-3">
                <div className="w-9 h-9 rounded-lg bg-[#D9B36C]/10 border border-[#D9B36C]/30 flex items-center justify-center text-[#D9B36C]">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <h3 className="font-heading font-bold text-base text-[#F4F7FA]">
                  Cobre Secundário (Bobinas)
                </h3>
                <p className="text-xs text-[#93A3B5] leading-relaxed">
                  Fiação automotiva e bobinados triturados. Valorização imediata por meio de
                  passaporte digital atestando desvio de aterro e pureza física com lastro fiscal
                  completo.
                </p>
              </div>
            </div>

            {/* Quadro de Valor & Regra Crítica */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-[#0A0E12] border border-[#12B886]/30 text-xs text-[#93A3B5] space-y-1">
                <span className="font-mono text-[#12B886] font-bold block uppercase">
                  ONDE ESTÁ O VALOR ECONÔMICO?
                </span>
                <p>
                  O valor gerado é o{' '}
                  <strong className="text-[#F4F7FA]">prêmio de origem urbana</strong> pago por
                  indústrias compradoras globais, conformidade irrefutável com NF-e e cumprimento de
                  exigências internacionais de suprimento responsável.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#0A0E12] border border-[#D9B36C]/30 text-xs text-[#93A3B5] space-y-1">
                <span className="font-mono text-[#D9B36C] font-bold block uppercase">
                  REGRA FUNDAMENTAL DE SEGURANÇA
                </span>
                <p>
                  A plataforma Orbis{' '}
                  <strong className="text-[#F4F7FA]">
                    nunca promete nem calcula créditos de carbono sobre esses materiais
                  </strong>
                  . O foco é estritamente rastreabilidade física, pureza e conformidade legal.
                </p>
              </div>
            </div>
          </div>

          <div className="relative z-10 pt-4 border-t border-[rgba(244,247,250,0.08)] flex items-center justify-between text-xs text-[#93A3B5]">
            <div className="flex items-center gap-2">
              <OrbisOfficialGlobe size={18} />
              <span className="font-mono text-[11px]">
                Passaporte DCP de Materiais Críticos • Origem Urbana Comprovada
              </span>
            </div>
            <span className="font-mono text-[11px] text-[#D9B36C] font-bold">Slide 08 / 10</span>
          </div>
        </section>

        {/* ============================================================== */}
        {/* SLIDE 9 — VISÃO DE EVOLUÇÃO (CARBONO → CADEIA → NATUREZA) */}
        {/* ============================================================== */}
        <section
          id="slide-9"
          aria-label="Slide 9 — Visão de Evolução da Plataforma: Carbono → Cadeia → Natureza"
          className="slide-page relative w-full aspect-auto lg:aspect-[16/9] min-h-[580px] sm:min-h-[640px] lg:min-h-[680px] bg-gradient-to-br from-[#0D131A] via-[#111820] to-[#0A0E12] rounded-2xl sm:rounded-3xl border border-[rgba(244,247,250,0.12)] shadow-2xl p-6 sm:p-10 lg:p-16 flex flex-col justify-between overflow-hidden"
        >
          <div className="relative z-10 flex items-center justify-between pb-4 border-b border-[rgba(244,247,250,0.08)]">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#12B886]" />
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#12B886]">
                09 • ROADMAP ESTRATÉGICO DA INFRAESTRUTURA
              </span>
            </div>
            <OrbisLogo variant="emblem" height={24} alt="Orbis" />
          </div>

          <div className="relative z-10 my-auto py-6 space-y-6">
            <div className="max-w-3xl space-y-2">
              <h2 className="font-heading font-black text-2xl sm:text-4xl text-[#F4F7FA] leading-tight">
                Visão de Evolução: Carbono → Cadeia → Natureza
              </h2>
              <p className="text-sm sm:text-base text-[#93A3B5]">
                O Orbis não é uma ferramenta estática. É uma infraestrutura de governança que
                acompanha as exigências corporativas globais.
              </p>
            </div>

            {/* Tríade de Evolução */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
              {/* Etapa 1: Carbono */}
              <div className="p-5 sm:p-6 rounded-2xl bg-[#16202B]/90 border-2 border-[#12B886]/40 shadow-emerald-glow-subtle space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-[#12B886] font-bold uppercase px-2 py-0.5 rounded bg-[#12B886]/20">
                    HOJE • PRESENTE
                  </span>
                  <Flame className="w-4 h-4 text-[#12B886]" />
                </div>
                <h3 className="font-heading font-bold text-lg text-[#F4F7FA]">
                  1. Descarbonização & Fiscal
                </h3>
                <p className="text-xs text-[#93A3B5] leading-relaxed">
                  Prova de descarbonização (CO₂e evitado do aço secundário e fluidos térmicos) e
                  conformidade tributária preventiva contra a reforma do IBS/CBS e Imposto Seletivo.
                </p>
              </div>

              {/* Etapa 2: Cadeia */}
              <div className="p-5 sm:p-6 rounded-2xl bg-[#16202B]/80 border border-[rgba(244,247,250,0.12)] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-[#D9B36C] font-bold uppercase px-2 py-0.5 rounded bg-[#D9B36C]/20">
                    AMANHÃ • EXPANSÃO
                  </span>
                  <Layers className="w-4 h-4 text-[#D9B36C]" />
                </div>
                <h3 className="font-heading font-bold text-lg text-[#F4F7FA]">
                  2. Dados Verificáveis de Cadeia
                </h3>
                <p className="text-xs text-[#93A3B5] leading-relaxed">
                  Interoperabilidade transparente entre desmanches credenciados, operadores de
                  sucata, indústrias compradoras e órgãos estaduais (Detran, Sefa, IAT).
                </p>
              </div>

              {/* Etapa 3: Natureza */}
              <div className="p-5 sm:p-6 rounded-2xl bg-[#16202B]/80 border border-[rgba(244,247,250,0.12)] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-[#20c997] font-bold uppercase px-2 py-0.5 rounded bg-[#20c997]/20">
                    HORIZONTE • IFRS
                  </span>
                  <TreePine className="w-4 h-4 text-[#20c997]" />
                </div>
                <h3 className="font-heading font-bold text-lg text-[#F4F7FA]">
                  3. Natureza & Biodiversidade
                </h3>
                <p className="text-xs text-[#93A3B5] leading-relaxed">
                  Desvio auditado de aterros e mineração primária evitada convertidos em métricas
                  estruturadas de impacto sobre o capital natural e ecossistemas.
                </p>
              </div>
            </div>

            {/* CITAÇÃO VERBATIM APROVADA DA PLATAFORMA */}
            <div className="p-5 rounded-2xl bg-[#0A0E12] border border-[#12B886]/40 relative overflow-hidden">
              <div className="text-[10px] font-mono text-[#D9B36C] uppercase font-bold tracking-wider mb-2">
                DIRETRIZ OFICIAL PUBLICADA NA PLATAFORMA ORBIS PROTOCOL
              </div>
              <blockquote className="text-xs sm:text-sm text-[#F4F7FA] italic leading-relaxed border-l-2 border-[#12B886] pl-3.5">
                "Estendemos nossa infraestrutura de prova documental à logística reversa (PNRS /
                Decreto 11.413/2023): rastreabilidade de lotes de material, balanço de massa
                auditável e documentos prontos para envio a órgãos de controle e entidades gestoras.
                Na mesma lógica, a infraestrutura Orbis está preparada para dados verificáveis de
                natureza e biodiversidade, à medida que os padrões IFRS incorporam o tema nas
                divulgações corporativas."
              </blockquote>
            </div>
          </div>

          <div className="relative z-10 pt-4 border-t border-[rgba(244,247,250,0.08)] flex items-center justify-between text-xs text-[#93A3B5]">
            <div className="flex items-center gap-2">
              <OrbisOfficialGlobe size={18} />
              <span className="font-mono text-[11px]">
                Elaborado segundo os padrões globais IFRS S1, IFRS S2 e CVM 244/2026
              </span>
            </div>
            <span className="font-mono text-[11px] text-[#D9B36C] font-bold">Slide 09 / 10</span>
          </div>
        </section>

        {/* ============================================================== */}
        {/* SLIDE 10 — PRÓXIMOS PASSOS */}
        {/* ============================================================== */}
        <section
          id="slide-10"
          aria-label="Slide 10 — Próximos Passos & Início da Operação Piloto"
          className="slide-page relative w-full aspect-auto lg:aspect-[16/9] min-h-[580px] sm:min-h-[640px] lg:min-h-[680px] bg-gradient-to-br from-[#0D131A] via-[#111820] to-[#0A0E12] rounded-2xl sm:rounded-3xl border border-[rgba(244,247,250,0.12)] shadow-2xl p-6 sm:p-10 lg:p-16 flex flex-col justify-between overflow-hidden"
        >
          <div className="relative z-10 flex items-center justify-between pb-4 border-b border-[rgba(244,247,250,0.08)]">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#12B886]" />
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#12B886]">
                10 • PLANO DE AÇÃO & PRÓXIMOS PASSOS
              </span>
            </div>
            <OrbisLogo variant="emblem" height={24} alt="Orbis" />
          </div>

          <div className="relative z-10 my-auto py-6 space-y-6">
            <div className="max-w-3xl space-y-2">
              <h2 className="font-heading font-black text-2xl sm:text-4xl text-[#F4F7FA] leading-tight">
                Como iniciamos em 3 etapas simples
              </h2>
              <p className="text-sm sm:text-base text-[#93A3B5]">
                Estrutura ágil para validar o modelo técnico e comercial sem onerar a rotina da
                planta.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              {/* Etapa 1 */}
              <div className="p-5 sm:p-6 rounded-2xl bg-[#16202B]/80 border border-[rgba(244,247,250,0.1)] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-black text-[#12B886]">FASE 01</span>
                  <span className="text-[10px] font-mono text-[#93A3B5]">Semana 1</span>
                </div>
                <h3 className="font-heading font-bold text-base text-[#F4F7FA]">
                  Reunião de Alinhamento
                </h3>
                <p className="text-xs text-[#93A3B5] leading-relaxed">
                  Alinhamento da equipe técnica Orbis com os gestores do SRA e do pátio para mapear
                  o layout de dados das pesagens do shredder.
                </p>
              </div>

              {/* Etapa 2 */}
              <div className="p-5 sm:p-6 rounded-2xl bg-[#16202B]/80 border border-[rgba(244,247,250,0.1)] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-black text-[#D9B36C]">FASE 02</span>
                  <span className="text-[10px] font-mono text-[#93A3B5]">Semanas 2–3</span>
                </div>
                <h3 className="font-heading font-bold text-base text-[#F4F7FA]">
                  Escopo do Piloto de Aço
                </h3>
                <p className="text-xs text-[#93A3B5] leading-relaxed">
                  Definição do lote piloto de fardos de aço secundário para emissão dos primeiros
                  DCPs com cálculo de CO₂e evitado.
                </p>
              </div>

              {/* Etapa 3 */}
              <div className="p-5 sm:p-6 rounded-2xl bg-[#16202B]/80 border border-[rgba(244,247,250,0.1)] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-black text-[#12B886]">FASE 03</span>
                  <span className="text-[10px] font-mono text-[#93A3B5]">30 a 60 dias</span>
                </div>
                <h3 className="font-heading font-bold text-base text-[#F4F7FA]">
                  Carta de Intenções & Piloto
                </h3>
                <p className="text-xs text-[#93A3B5] leading-relaxed">
                  Assinatura do termo de cooperação técnica sem exclusividade punitiva e início da
                  emissão assistida em ambiente real.
                </p>
              </div>
            </div>

            {/* CTA Final e Contato */}
            <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-[#111820] via-[#16202B] to-[#111820] border-2 border-[#12B886]/50 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-2 text-center md:text-left">
                <span className="text-xs font-mono text-[#D9B36C] font-bold uppercase tracking-widest block">
                  CANAL DIRETO COM OS FUNDADORES
                </span>
                <div className="font-heading font-black text-xl sm:text-2xl text-[#F4F7FA]">
                  "O gargalo do novo ciclo ESG não é medir — é provar."
                </div>
                <div className="text-xs sm:text-sm text-[#93A3B5]">
                  Contato oficial:{' '}
                  <a
                    href="mailto:contato@orbis-protocol.com"
                    className="font-mono text-[#12B886] hover:underline font-semibold"
                  >
                    contato@orbis-protocol.com
                  </a>{' '}
                  • Curitiba & Região Metropolitana
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                <a
                  href="mailto:contato@orbis-protocol.com?subject=Piloto%20Orbis%20Protocol%20x%20Reminera"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-heading font-bold text-xs sm:text-sm bg-[#12B886] hover:bg-[#0CA678] text-[#0A0E12] transition-all shadow-emerald-glow text-center"
                >
                  <span>Agendar Alinhamento</span>
                  <ArrowRight className="w-4 h-4" />
                </a>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="no-print inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl font-semibold text-xs sm:text-sm bg-[#0A0E12] border border-[#D9B36C]/60 text-[#D9B36C] hover:bg-[#D9B36C] hover:text-[#0A0E12] transition-all text-center"
                >
                  <Printer className="w-4 h-4" />
                  <span>Baixar Apresentação PDF</span>
                </button>
              </div>
            </div>
          </div>

          <div className="relative z-10 pt-4 border-t border-[rgba(244,247,250,0.08)] flex items-center justify-between text-xs text-[#93A3B5]">
            <div className="flex items-center gap-2">
              <OrbisOfficialGlobe size={18} />
              <span className="font-mono text-[11px]">
                Orbis Protocol • Infraestrutura de Prova Documental
              </span>
            </div>
            <span className="font-mono text-[11px] text-[#D9B36C] font-bold">Slide 10 / 10</span>
          </div>
        </section>
      </main>

      {/* RODAPÉ FLUTUANTE INFORMATIVO (Apenas em tela, oculto no print) */}
      <footer className="no-print max-w-[1440px] mx-auto px-4 py-6 text-center text-xs text-[#93A3B5] border-t border-[rgba(244,247,250,0.06)] flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#12B886] animate-pulse" />
          <span>Deck Widescreen 16:9 • Navegue pelas setas do teclado (← / →) ou scroll</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handlePrint}
            className="text-[#12B886] hover:underline flex items-center gap-1 font-semibold"
          >
            <Printer className="w-3.5 h-3.5" />
            Exportar como PDF
          </button>
          <span>•</span>
          <span className="font-mono text-[11px]">Metal Carbon Hub / Reminera</span>
          <span>•</span>
          <Link to="/termos" className="text-[#93A3B5] hover:text-[#12B886] underline font-medium">
            Termos de Uso
          </Link>
        </div>
      </footer>
    </div>
  )
}

export default PropostaRemineraPage
