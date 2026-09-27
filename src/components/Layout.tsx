import React, { useState, useEffect, useRef } from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import { OrbisGlobe } from './OrbisGlobe'
import { OrbisLogo } from './OrbisLogo'
import { useAuth } from '@/contexts/AuthContext'
import { AssistenteOrbisWidget } from './AssistenteOrbisWidget'
import {
  Menu,
  X,
  ShieldCheck,
  ChevronRight,
  ChevronDown,
  LogOut,
  User,
  LayoutDashboard,
  FileCheck2,
  Lock,
  Layers,
  Scale,
  Sparkles,
  Building2,
  Coins,
  Receipt,
  Recycle,
  BookOpen,
  Car,
  Compass,
} from 'lucide-react'

export default function Layout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [solutionsDropdownOpen, setSolutionsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const dropdownTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const location = useLocation()
  const { isAuthenticated, user, logout, isAdminOrPerito, isParceiro } = useAuth()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close mobile drawer and dropdown on route change
  useEffect(() => {
    setMobileMenuOpen(false)
    setSolutionsDropdownOpen(false)
  }, [location.pathname, location.hash])

  // Handle outside click & Esc key for solutions dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setSolutionsDropdownOpen(false)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSolutionsDropdownOpen(false)
      }
    }

    if (solutionsDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleKeyDown)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [solutionsDropdownOpen])

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (dropdownTimeoutRef.current) {
        clearTimeout(dropdownTimeoutRef.current)
      }
    }
  }, [])

  const handleDropdownMouseEnter = () => {
    if (dropdownTimeoutRef.current) {
      clearTimeout(dropdownTimeoutRef.current)
      dropdownTimeoutRef.current = null
    }
    setSolutionsDropdownOpen(true)
  }

  const handleDropdownMouseLeave = () => {
    if (dropdownTimeoutRef.current) {
      clearTimeout(dropdownTimeoutRef.current)
    }
    dropdownTimeoutRef.current = setTimeout(() => {
      setSolutionsDropdownOpen(false)
    }, 150)
  }

  // Grupos de Soluções organizados por persona com linguagem clara e subtítulo de 1 linha
  const solutionGroups = [
    {
      persona: 'Para empresas',
      rotuloCurto: 'Empresas, indústrias e comércio',
      itens: [
        {
          title: 'Orbis LPF — Leitura Pré-Faturamento',
          desc: 'Leitura antecipada da intensidade de carbono antes do faturamento — metodologia exclusiva, oferta piloto.',
          path: '/solucoes#orbis-lpf',
          icon: ShieldCheck,
          badge: 'Oferta piloto',
        },
        {
          title: 'Diagnóstico & Mercado de Carbono (SBCE)',
          desc: 'Calcule seu enquadramento na Lei 15.042/2024 e o impacto tributário do IVA dual.',
          path: '/diagnostico',
          icon: Sparkles,
        },
        {
          title: 'Planos & Certificação',
          desc: 'Tabela de serviços oficiais, assinaturas e contratação com emissão de nota fiscal.',
          path: '/planos',
          icon: Receipt,
        },
        {
          title: 'Portal Corporativo',
          desc: 'Tour interativo de 12 notas fiscais com cálculo de emissões e laudo técnico.',
          path: '/corporativo',
          icon: Building2,
        },
        {
          title: 'Logística Reversa (PNRS)',
          desc: 'Rastreabilidade de lotes de material e balanço de massa auditável — módulo em estruturação.',
          path: '/solucoes#logistica-reversa',
          icon: Layers,
          badge: 'Em estruturação',
        },
        {
          title: 'Mineração Urbana & Materiais Críticos',
          desc: 'Origem urbana de terras raras, metais nobres e cobre com Passaporte Digital de Produto.',
          path: '/materiais-criticos',
          icon: ShieldCheck,
          badge: 'DCP',
        },
      ],
    },
    {
      persona: 'Para desmontagem veicular',
      rotuloCurto: 'Centros de Desmontagem (CDVs) e cadeia automotiva',
      itens: [
        {
          title: 'Case CDVerde',
          desc: 'Rastreabilidade de peças verdes e baterias com passaporte digital de produto.',
          path: '/solucoes/case-cdverde',
          icon: Recycle,
        },
        {
          title: 'Descarbonização via MOVER',
          desc: 'Regras da Lei 14.902/2024 e metodologia internacional para descarbonização veicular.',
          path: '/mover',
          icon: Car,
        },
      ],
    },
    {
      persona: 'Ferramentas públicas',
      rotuloCurto: 'Consultas abertas a qualquer comprador ou auditor',
      itens: [
        {
          title: 'Consultar Selo',
          desc: 'Validação pública de autenticidade criptográfica de laudos e passaportes emitidos.',
          path: '/verificador',
          icon: ShieldCheck,
        },
        {
          title: 'Radar Regulatório',
          desc: 'Calendário de prazos da reforma tributária, marco do SBCE e exigências climáticas.',
          path: '/radar-regulatorio',
          icon: Scale,
        },
        {
          title: 'Radar Semanal (Assinatura)',
          desc: 'Serviço semanal de inteligência regulatória executiva por faixa de CNPJs.',
          path: '/radar-semanal',
          icon: Compass,
          badge: 'Novo',
        },
      ],
    },
  ]

  // Itens planos para verificação de rota ativa e drawer
  const allSolutionItems = solutionGroups.flatMap((g) => g.itens)

  // Check if current route matches any solutions item or solutions index
  const isSolutionsActive =
    location.pathname === '/solucoes' ||
    location.pathname === '/bureau' ||
    location.pathname === '/solucoes/bureau-acp' ||
    location.pathname === '/solucoes/portal-corporativo' ||
    allSolutionItems.some((item) => {
      if (item.path.startsWith('/#')) {
        return location.pathname === '/' && location.hash === item.path.replace('/', '')
      }
      return location.pathname === item.path || location.pathname.startsWith(`${item.path}/`)
    })

  // 4 itens essenciais da faixa regulatória
  const regulations = [
    '01/08/2026: Fase-teste IBS 0,1% / CBS 0,9% na NF-e (Art. 348 LC 214/2025)',
    'Lei 15.042/2024: Mercado Regulado de Carbono (SBCE - limiares 10k e 25k tCO₂e)',
    'Programa MOVER Lei 14.902/2024: Desmontagem veicular e circularidade homologada',
    'Reforma Tributária LC 227/2026 & Decreto 12.955/2026: Novo IVA Dual',
  ]

  return (
    <div className="flex flex-col min-h-screen w-full overflow-x-clip bg-[#0A0E12] text-[#F4F7FA] selection:bg-[#12B886]/30 selection:text-white">
      {/* Cabeçalho Unificado Sticky com z-index alto e largura contida */}
      <div className="sticky top-0 z-40 w-full">
        {/* 1. Regulatory Marquee Top Bar — Sólido opaco #0A0E12 sem transparência e sem backdrop-blur */}
        <div className="w-full bg-[#0A0E12] border-b border-[rgba(244,247,250,0.06)] py-2 text-xs overflow-hidden transition-colors duration-300">
          <div className="animate-marquee items-center gap-6 whitespace-nowrap text-[#93A3B5] font-medium tracking-wider">
            {[...regulations, ...regulations].map((reg, idx) => (
              <span key={idx} className="inline-flex items-center gap-4">
                <span className="text-[#12B886] font-semibold flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#12B886]" />
                  {reg}
                </span>
                <span className="text-[rgba(244,247,250,0.2)]">•</span>
              </span>
            ))}
          </div>
        </div>

        {/* 2. Sticky Header — Sólido opaco #0A0E12 sem transparência e sem backdrop-blur, com divisória fina e sombra suave ao rolar */}
        <header
          className={`w-full transition-all duration-300 bg-[#0A0E12] ${
            isScrolled
              ? 'border-b border-[rgba(244,247,250,0.08)] shadow-[0_4px_24px_rgba(0,0,0,0.6)]'
              : 'border-b border-[rgba(244,247,250,0.04)]'
          }`}
        >
          <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 flex items-center justify-between h-20">
            {/* Brand Logo & Name */}
            <Link to="/" className="flex items-center gap-3.5 group" title="Orbis Protocol">
              <OrbisGlobe size={42} />
              <div className="flex flex-col">
                <span className="font-heading font-black text-xl tracking-[0.08em] text-[#F4F7FA] group-hover:text-[#12B886] transition-colors">
                  ORBIS<span className="text-[#12B886]">.</span>PROTOCOL
                </span>
                <span className="text-[10px] tracking-[0.2em] uppercase text-[#93A3B5] font-semibold -mt-1">
                  Auditoria & Rastreabilidade
                </span>
              </div>
            </Link>

            {/* Desktop Navigation - Enxuta: Início · Trilhas · Soluções ▾ · Consultar Selo */}
            <nav className="hidden lg:flex items-center gap-6 xl:gap-7 ml-6 xl:ml-8 mr-6 xl:mr-8">
              <Link
                to="/"
                className={`text-sm tracking-wide font-medium transition-colors hover:text-[#12B886] ${
                  location.pathname === '/' && !location.hash
                    ? 'text-[#12B886] font-semibold'
                    : 'text-[#93A3B5]'
                }`}
              >
                Início
              </Link>

              <Link
                to="/trilhas"
                className={`text-sm tracking-wide font-medium transition-colors hover:text-[#12B886] ${
                  location.pathname.startsWith('/trilhas')
                    ? 'text-[#12B886] font-semibold'
                    : 'text-[#93A3B5]'
                }`}
              >
                Trilhas
              </Link>

              {/* Dropdown Soluções */}
              <div
                ref={dropdownRef}
                className="relative"
                onMouseEnter={handleDropdownMouseEnter}
                onMouseLeave={handleDropdownMouseLeave}
              >
                <button
                  type="button"
                  onClick={() => setSolutionsDropdownOpen((prev) => !prev)}
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      setSolutionsDropdownOpen(true)
                    }
                  }}
                  aria-expanded={solutionsDropdownOpen}
                  aria-haspopup="true"
                  className={`inline-flex items-center gap-1.5 text-sm tracking-wide font-medium transition-colors hover:text-[#12B886] py-2 focus:outline-none focus-visible:ring-1 focus-visible:ring-[#12B886] rounded ${
                    isSolutionsActive ? 'text-[#12B886] font-semibold' : 'text-[#93A3B5]'
                  }`}
                >
                  <span>Soluções</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${
                      solutionsDropdownOpen ? 'rotate-180 text-[#12B886]' : 'opacity-70'
                    }`}
                  />
                </button>

                {/* Dropdown / Mega Menu Flutuante */}
                {solutionsDropdownOpen && (
                  <div
                    role="menu"
                    aria-label="Submenu Soluções"
                    className="absolute left-1/2 -translate-x-1/2 top-full pt-2 z-50 animate-in fade-in-0 zoom-in-95 duration-150"
                  >
                    <div className="w-[580px] max-w-[92vw] p-4 rounded-xl bg-[#0D1217] border border-[rgba(244,247,250,0.12)] shadow-2xl backdrop-blur-xl max-h-[85vh] overflow-y-auto">
                      <div className="px-3 py-2 border-b border-[rgba(244,247,250,0.08)] flex items-center justify-between mb-3">
                        <span className="text-xs font-semibold tracking-wider text-[#12B886]">
                          Soluções por perfil
                        </span>
                        <Link
                          to="/solucoes"
                          onClick={() => setSolutionsDropdownOpen(false)}
                          className="text-xs text-[#93A3B5] hover:text-[#12B886] transition-colors"
                        >
                          Ver visão geral →
                        </Link>
                      </div>

                      <div className="space-y-4">
                        {solutionGroups.map((group) => (
                          <div key={group.persona} className="space-y-1.5">
                            <div className="px-2.5 flex items-baseline justify-between">
                              <span className="text-xs font-bold text-[#F4F7FA] uppercase tracking-wider">
                                {group.persona}
                              </span>
                              <span className="text-[11px] text-[#93A3B5] hidden sm:inline">
                                {group.rotuloCurto}
                              </span>
                            </div>

                            <div className="grid grid-cols-1 gap-1">
                              {group.itens.map((item) => {
                                const Icon = item.icon
                                const isActive = location.pathname === item.path

                                return (
                                  <Link
                                    key={item.title}
                                    to={item.path}
                                    role="menuitem"
                                    onClick={() => setSolutionsDropdownOpen(false)}
                                    className={`group flex items-start gap-3 p-2.5 rounded-lg transition-all ${
                                      isActive
                                        ? 'bg-[#12B886]/10 border border-[#12B886]/30'
                                        : 'hover:bg-[#16202B] border border-transparent'
                                    }`}
                                  >
                                    <div
                                      className={`mt-0.5 p-2 rounded-lg flex-shrink-0 transition-colors ${
                                        isActive
                                          ? 'bg-[#12B886]/20 text-[#12B886]'
                                          : 'bg-[#111820] text-[#93A3B5] group-hover:text-[#12B886] group-hover:bg-[#12B886]/10'
                                      }`}
                                    >
                                      <Icon className="w-4 h-4" />
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                      <div className="flex items-center gap-2">
                                        <span
                                          className={`text-sm font-semibold tracking-wide transition-colors ${
                                            isActive
                                              ? 'text-[#12B886]'
                                              : 'text-[#F4F7FA] group-hover:text-[#12B886]'
                                          }`}
                                        >
                                          {item.title}
                                        </span>
                                        {'badge' in item && item.badge && (
                                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono font-semibold bg-[#16202B] text-[#D9B36C] border border-[#D9B36C]/30 shrink-0">
                                            <span className="w-1 h-1 rounded-full bg-[#D9B36C]" />
                                            {item.badge}
                                          </span>
                                        )}
                                      </div>
                                      <span className="text-xs text-[#93A3B5] leading-snug line-clamp-1">
                                        {item.desc}
                                      </span>
                                    </div>
                                  </Link>
                                )
                              })}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Atalho adicional para Bureau ACP unificado */}
                      <div className="mt-3 pt-3 border-t border-[rgba(244,247,250,0.06)] px-2.5 flex items-center justify-between text-xs text-[#93A3B5]">
                        <span>Passaporte sustentável de fornecedores:</span>
                        <Link
                          to="/bureau"
                          onClick={() => setSolutionsDropdownOpen(false)}
                          className="text-[#12B886] hover:underline font-medium"
                        >
                          Acessar Cockpit Bureau ACP →
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <Link
                to="/verificador"
                className={`text-sm tracking-wide font-medium transition-colors hover:text-[#12B886] ${
                  location.pathname === '/verificador'
                    ? 'text-[#12B886] font-semibold'
                    : 'text-[#93A3B5]'
                }`}
              >
                Consultar Selo
              </Link>
            </nav>

            {/* Header Action Buttons — Respiro generoso garantido (0.0.74 e 0.0.76) */}
            <div className="hidden md:flex items-center gap-3.5 pl-4 xl:pl-6">
              <Link
                to="/diagnostico"
                className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-[#12B886] text-[#0A0E12] hover:bg-[#0CA678] hover:shadow-emerald-glow-subtle hover:-translate-y-0.5 active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#12B886]/50 transition-all duration-200 shadow-sm"
              >
                Iniciar Diagnóstico
              </Link>

              <Link
                to="/demo"
                className="inline-flex items-center justify-center px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium border border-[rgba(244,247,250,0.14)] text-[#93A3B5] hover:border-[#12B886]/50 hover:text-[#F4F7FA] hover:bg-[#111820] hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#12B886]/40 transition-all duration-200 bg-[#0A0E12]"
              >
                Ver Demonstração
              </Link>

              {isAuthenticated ? (
                <div className="flex items-center gap-2.5 pl-3 border-l border-[rgba(244,247,250,0.12)]">
                  <Link
                    to={isParceiro ? '/parceiro-painel' : '/painel'}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium border border-[rgba(244,247,250,0.15)] text-[#F4F7FA] hover:border-[#12B886]/60 hover:text-[#12B886] hover:-translate-y-0.5 transition-all duration-200 bg-[#111820]"
                  >
                    <LayoutDashboard className="w-4 h-4 text-[#12B886] stroke-[1.5]" />
                    {isParceiro ? 'Painel do Parceiro' : 'Painel'}
                  </Link>
                  <button
                    onClick={logout}
                    title="Sair"
                    className="p-2 rounded-xl text-[#93A3B5] hover:text-[#F03E54] border border-[rgba(244,247,250,0.12)] hover:border-[#F03E54]/40 transition-all duration-200 bg-[#111820]"
                  >
                    <LogOut className="w-4 h-4 stroke-[1.5]" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2.5 pl-3 border-l border-[rgba(244,247,250,0.12)]">
                  <Link
                    to="/login"
                    className="inline-flex items-center justify-center px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium border border-[rgba(244,247,250,0.14)] text-[#93A3B5] hover:border-[#12B886]/60 hover:text-[#F4F7FA] hover:-translate-y-0.5 transition-all duration-200 bg-[#0A0E12]"
                  >
                    Entrar
                  </Link>
                  <Link
                    to="/registro"
                    className="inline-flex items-center justify-center px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-[#16202B] border border-[#12B886]/40 text-[#12B886] hover:bg-[#12B886] hover:text-[#0A0E12] hover:-translate-y-0.5 transition-all duration-200 shadow-sm"
                  >
                    Criar conta
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 text-[#F4F7FA] hover:text-[#12B886] transition-colors"
              aria-label="Abrir menu"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </header>
      </div>

      {/* 3. Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex justify-end overflow-hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer Content — Sólido opaco com tom-base #0A0E12 */}
          <div className="relative w-full max-w-xs bg-[#0A0E12] border-l border-[rgba(244,247,250,0.12)] h-full p-6 flex flex-col justify-between shadow-2xl z-10 animate-in slide-in-from-right duration-300">
            <div>
              <div className="flex items-center justify-between pb-6 border-b border-[rgba(244,247,250,0.1)]">
                <div className="flex items-center gap-3">
                  <OrbisGlobe size={34} />
                  <span className="font-heading font-black text-lg tracking-wider text-[#F4F7FA]">
                    ORBIS PROTOCOL
                  </span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 text-[#93A3B5] hover:text-[#F4F7FA]"
                  aria-label="Fechar menu"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="mt-6 flex flex-col gap-1 overflow-y-auto max-h-[calc(100vh-220px)] pr-1">
                {/* Itens Principais */}
                <Link
                  to="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between py-2.5 px-3 rounded-lg text-sm font-medium transition-colors ${
                    location.pathname === '/' && !location.hash
                      ? 'bg-[#12B886]/10 text-[#12B886]'
                      : 'text-[#93A3B5] hover:text-[#F4F7FA] hover:bg-[#16202B]'
                  }`}
                >
                  <span>Início</span>
                  <ChevronRight className="w-4 h-4 opacity-50" />
                </Link>

                <Link
                  to="/trilhas"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between py-2.5 px-3 rounded-lg text-sm font-medium transition-colors ${
                    location.pathname.startsWith('/trilhas')
                      ? 'bg-[#12B886]/10 text-[#12B886]'
                      : 'text-[#93A3B5] hover:text-[#F4F7FA] hover:bg-[#16202B]'
                  }`}
                >
                  <span>Trilhas</span>
                  <ChevronRight className="w-4 h-4 opacity-50" />
                </Link>

                <Link
                  to="/verificador"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between py-2.5 px-3 rounded-lg text-sm font-medium transition-colors ${
                    location.pathname === '/verificador'
                      ? 'bg-[#12B886]/10 text-[#12B886]'
                      : 'text-[#93A3B5] hover:text-[#F4F7FA] hover:bg-[#16202B]'
                  }`}
                >
                  <span>Consultar Selo</span>
                  <ChevronRight className="w-4 h-4 opacity-50" />
                </Link>

                {/* Grupo Soluções em 3 personas */}
                <div className="pt-3 mt-2 border-t border-[rgba(244,247,250,0.08)]">
                  <div className="px-3 pb-2 flex items-center justify-between">
                    <span className="text-xs uppercase font-bold tracking-wider text-[#12B886] flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-[#12B886]" />
                      Soluções por perfil
                    </span>
                    <Link
                      to="/solucoes"
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-xs text-[#93A3B5] hover:text-[#12B886]"
                    >
                      Ver tudo
                    </Link>
                  </div>

                  <div className="flex flex-col gap-3 mt-1">
                    {solutionGroups.map((group) => (
                      <div key={group.persona} className="space-y-1">
                        <div className="px-3 text-[11px] font-semibold text-[#D9B36C] uppercase tracking-wider">
                          {group.persona}
                        </div>
                        {group.itens.map((item) => {
                          const Icon = item.icon
                          const isActive = location.pathname === item.path

                          return (
                            <Link
                              key={item.title}
                              to={item.path}
                              onClick={() => setMobileMenuOpen(false)}
                              className={`flex items-center justify-between py-2 px-3 rounded-lg text-xs font-medium transition-colors ${
                                isActive
                                  ? 'bg-[#12B886]/10 text-[#12B886]'
                                  : 'text-[#93A3B5] hover:text-[#F4F7FA] hover:bg-[#16202B]'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 truncate">
                                <Icon className="w-3.5 h-3.5 opacity-70 flex-shrink-0" />
                                <div className="truncate">
                                  <div className="flex items-center gap-1.5 truncate">
                                    <span className="truncate font-medium">{item.title}</span>
                                    {'badge' in item && item.badge && (
                                      <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[9px] font-mono font-semibold bg-[#16202B] text-[#D9B36C] border border-[#D9B36C]/30 shrink-0">
                                        <span className="w-1 h-1 rounded-full bg-[#D9B36C]" />
                                        {item.badge}
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[11px] text-[#93A3B5]/70 truncate">
                                    {item.desc}
                                  </div>
                                </div>
                              </div>
                              <ChevronRight className="w-3.5 h-3.5 opacity-40 flex-shrink-0" />
                            </Link>
                          )
                        })}
                      </div>
                    ))}
                  </div>
                </div>

                {isAdminOrPerito && (
                  <div className="pt-2 mt-2 border-t border-[rgba(244,247,250,0.08)]">
                    <Link
                      to="/console-do-auditor"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center justify-between py-2.5 px-3 rounded-lg text-xs font-medium text-[#D9B36C] hover:bg-[#16202B] transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <FileCheck2 className="w-4 h-4" />
                        Console do Auditor
                      </span>
                      <Lock className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                )}

                {isParceiro && (
                  <div className="pt-2 mt-2 border-t border-[rgba(244,247,250,0.08)]">
                    <Link
                      to="/parceiro-painel"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center justify-between py-2.5 px-3 rounded-lg text-xs font-medium text-[#12B886] hover:bg-[#16202B] transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4" />
                        Painel do Parceiro
                      </span>
                      <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-[#12B886]/20 text-[#12B886]">
                        {user?.cliente_codigo || 'ORB-PAR'}
                      </span>
                    </Link>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-6 border-t border-[rgba(244,247,250,0.1)] flex flex-col gap-3">
              <Link
                to="/diagnostico"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-3 rounded-lg text-sm font-semibold bg-gradient-to-r from-[#0F9E74] to-[#12B886] text-[#0A0E12] hover:from-[#12B886] hover:to-[#17C994] transition-all duration-200 shadow-sm"
              >
                Iniciar Diagnóstico
              </Link>
              <Link
                to="/demo"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 rounded-lg text-sm font-medium border border-[rgba(244,247,250,0.18)] text-[#D5DFEA] hover:border-[#12B886]/50 hover:text-[#12B886] bg-[#111820]/70 transition-all duration-200"
              >
                Ver Demonstração
              </Link>
              {isAuthenticated ? (
                <div className="flex flex-col gap-2 pt-1 border-t border-[rgba(244,247,250,0.08)]">
                  <Link
                    to={isParceiro ? '/parceiro-painel' : '/painel'}
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center py-2.5 rounded-lg text-sm font-medium border border-[rgba(244,247,250,0.2)] text-[#F4F7FA] hover:border-[#12B886]"
                  >
                    {isParceiro ? 'Painel do Parceiro' : 'Meu Painel'} ({user?.name || user?.email})
                  </Link>
                  <button
                    onClick={() => {
                      logout()
                      setMobileMenuOpen(false)
                    }}
                    className="w-full text-center py-2 rounded-lg text-xs font-medium text-[#F03E54] hover:bg-[#F03E54]/10"
                  >
                    Desconectar Sessão
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2 pt-1 border-t border-[rgba(244,247,250,0.08)]">
                  <Link
                    to="/registro"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center py-2.5 rounded-lg text-sm font-semibold bg-[#16202B] border border-[#12B886]/60 text-[#12B886] hover:bg-[#12B886] hover:text-[#0A0E12] transition-colors"
                  >
                    Criar conta
                  </Link>
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center py-2.5 rounded-lg text-sm font-medium border border-[rgba(244,247,250,0.2)] text-[#D5DFEA] hover:border-[#12B886]"
                  >
                    Entrar na Conta
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4. Main Page Content */}
      <main className="flex-1 flex flex-col w-full min-w-0">
        <Outlet />
      </main>

      {/* Widget Flutuante do Assistente Orbis IA (Landing / e /diagnostico e todo o site) */}
      <AssistenteOrbisWidget />

      {/* 5. Institutional Footer — Estilo Linear dark-first com glow suave e transição fluida a partir de #0A0E12 */}
      <footer className="bg-gradient-to-b from-[#0A0E12] via-[#080B0F] to-[#070A0D] border-t border-[rgba(244,247,250,0.08)] pt-20 sm:pt-24 pb-12 sm:pb-16 text-[#93A3B5] relative overflow-hidden">
        {/* Glow sutil de fundo no rodapé */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[250px] linear-glow-emerald pointer-events-none opacity-40" />

        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8 pb-14 sm:pb-16 border-b border-[rgba(244,247,250,0.06)]">
            {/* Col 1 & 2: Brand Info (5 colunas no grid de 12 para excelente respiro) */}
            <div className="lg:col-span-5 flex flex-col justify-between gap-6 pr-0 lg:pr-8">
              <div className="space-y-4">
                <Link to="/" className="inline-flex items-center gap-3.5 group">
                  <div className="relative flex items-center justify-center">
                    <OrbisGlobe size={40} />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-heading font-black text-xl tracking-[0.08em] text-[#F4F7FA] group-hover:text-[#12B886] transition-colors">
                      ORBIS PROTOCOL
                    </span>
                    <span className="text-[10px] tracking-[0.25em] text-[#D9B36C] font-mono uppercase font-bold">
                      Carbono & Circularidade
                    </span>
                  </div>
                </Link>{' '}
                <p className="text-xs sm:text-sm text-[#93A3B5]/90 leading-relaxed max-w-sm">
                  Infraestrutura tecnológica de dados e auditoria probatória (dMRV) para cálculo da
                  pegada de carbono, laudos periciais, conformidade tributária e emissão de selos e
                  passaportes digitais verificáveis — prontos para envio aos órgãos de controle e a
                  instituições financeiras.
                </p>
              </div>

              <div className="pt-2">
                <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-[#111820]/70 border border-[rgba(244,247,250,0.08)] text-[11px] text-[#D9B36C]">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#D9B36C] shrink-0" />
                  <span className="font-mono tracking-tight text-[#93A3B5]">
                    MGM CONSULTORIA EMPRESARIAL LTDA • CNPJ 19.598.964/0001-01
                  </span>
                </div>
              </div>
            </div>

            {/* Col 2: HUB DE SOLUÇÕES (3 colunas) */}
            <div className="lg:col-span-3 flex flex-col gap-4">
              <span className="font-heading text-[11px] text-[#F4F7FA] font-bold tracking-[0.18em] uppercase opacity-90">
                HUB DE SOLUÇÕES
              </span>
              <ul className="flex flex-col gap-2.5 text-xs sm:text-sm">
                <li>
                  <Link
                    to="/solucoes#orbis-lpf"
                    className="group inline-flex items-center gap-2 text-[#F4F7FA] font-medium hover:text-[#12B886] transition-all hover:translate-x-0.5 duration-200"
                  >
                    <span>Orbis LPF — Leitura Pré-Faturamento</span>
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-[#12B886]/15 text-[#12B886] border border-[#12B886]/35 shrink-0">
                      <span className="w-1 h-1 rounded-full bg-[#12B886]" />
                      Novo
                    </span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/trilhas/peritos-tecnicos"
                    className="text-[#93A3B5] hover:text-[#F4F7FA] transition-all hover:translate-x-0.5 duration-200 inline-block"
                  >
                    Peritos Técnicos & Auditores
                  </Link>
                </li>
                <li>
                  <Link
                    to="/materiais-criticos"
                    className="text-[#93A3B5] hover:text-[#12B886] transition-all hover:translate-x-0.5 duration-200 inline-flex items-center gap-1.5"
                  >
                    <span>Materiais Críticos Recuperados</span>
                    <span className="text-[9px] bg-[#12B886]/10 text-[#12B886] border border-[#12B886]/25 px-1 py-0.5 rounded font-mono">
                      DCP
                    </span>
                  </Link>
                </li>{' '}
                <li>
                  <Link
                    to="/checkout"
                    className="text-[#93A3B5] hover:text-[#12B886] font-medium transition-all hover:translate-x-0.5 duration-200 inline-flex items-center gap-1.5"
                  >
                    <span>Checkout PIX & NFS-e</span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/bureau"
                    className="text-[#93A3B5] hover:text-[#D9B36C] font-medium transition-all hover:translate-x-0.5 duration-200 inline-block"
                  >
                    Cockpit Bureau ACP (Passaporte)
                  </Link>
                </li>
                <li>
                  <Link
                    to="/corporativo"
                    className="text-[#93A3B5] hover:text-[#12B886] font-medium transition-all hover:translate-x-0.5 duration-200 inline-flex items-center gap-1.5"
                  >
                    <span>Modo Demonstração Corporativo</span>
                    <span className="text-[9px] bg-[#12B886]/10 text-[#12B886] border border-[#12B886]/25 px-1 py-0.5 rounded font-mono">
                      Demo
                    </span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/solucoes/portal-corporativo"
                    className="text-[#93A3B5] hover:text-[#12B886] transition-all hover:translate-x-0.5 duration-200 inline-block"
                  >
                    Portal Corporativo (IFRS/SPED)
                  </Link>
                </li>
                <li>
                  <Link
                    to="/mover"
                    className="text-[#93A3B5] hover:text-[#12B886] font-medium transition-all hover:translate-x-0.5 duration-200 inline-flex items-center gap-1.5"
                  >
                    <span>Espaço MOVER (GS 448)</span>
                    <span className="text-[9px] bg-[#12B886]/10 text-[#12B886] border border-[#12B886]/25 px-1 py-0.5 rounded font-mono">
                      Novo
                    </span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/solucoes/case-cdverde"
                    className="text-[#93A3B5] hover:text-[#12B886] transition-all hover:translate-x-0.5 duration-200 inline-block"
                  >
                    Case CDVerde (Desmontagem VFV)
                  </Link>
                </li>
                <li>
                  <Link
                    to="/api-docs-cdv"
                    className="text-[#93A3B5] hover:text-[#12B886] transition-all hover:translate-x-0.5 duration-200 inline-flex items-center gap-1.5 font-medium"
                  >
                    <span>API v1 — Desmontagem Veicular</span>
                    <span className="text-[9px] bg-[#16202B] text-[#93A3B5] border border-[rgba(244,247,250,0.12)] px-1 py-0.5 rounded font-mono">
                      v1
                    </span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/fatores"
                    className="text-[#93A3B5] hover:text-[#12B886] transition-all hover:translate-x-0.5 duration-200 inline-flex items-center gap-1.5"
                  >
                    <span>Catálogo de Fatores CO₂e</span>
                    <span className="text-[9px] bg-[#D9B36C]/10 text-[#D9B36C] border border-[#D9B36C]/30 px-1 py-0.5 rounded font-mono font-medium">
                      Bloco 4
                    </span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/solucoes/cadeias-produtivas"
                    className="text-[#93A3B5] hover:text-[#12B886] transition-all hover:translate-x-0.5 duration-200 inline-block"
                  >
                    Catálogo 15 Cadeias Produtivas
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 3: TRILHAS SETORIAIS (2 colunas) */}
            <div className="lg:col-span-2 flex flex-col gap-4">
              <span className="font-heading text-[11px] text-[#F4F7FA] font-bold tracking-[0.18em] uppercase opacity-90">
                TRILHAS SETORIAIS
              </span>
              <ul className="flex flex-col gap-2.5 text-xs sm:text-sm">
                <li>
                  <Link
                    to="/radar-regulatorio"
                    className="text-[#93A3B5] hover:text-[#F4F7FA] transition-all hover:translate-x-0.5 duration-200 inline-block"
                  >
                    Radar Regulatório
                  </Link>
                </li>
                <li>
                  <Link
                    to="/credenciamento"
                    className="text-[#93A3B5] hover:text-[#12B886] transition-all hover:translate-x-0.5 duration-200 inline-flex items-center gap-1.5"
                  >
                    <span>Credenciamento de Perito</span>
                    <span className="text-[9px] bg-[#12B886]/10 text-[#12B886] border border-[#12B886]/25 px-1 py-0.5 rounded font-mono">
                      ART
                    </span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/trilhas/sbce-financas-verdes"
                    className="text-[#93A3B5] hover:text-[#12B886] transition-all hover:translate-x-0.5 duration-200 inline-block"
                  >
                    Mercado SBCE & Finanças Verdes
                  </Link>
                </li>
                <li>
                  <Link
                    to="/trilhas/peritos-tecnicos"
                    className="text-[#93A3B5] hover:text-[#12B886] transition-all hover:translate-x-0.5 duration-200 inline-block"
                  >
                    Peritos Técnicos & Auditores
                  </Link>
                </li>
                <li className="pt-1">
                  <Link
                    to="/trilhas"
                    className="text-[#12B886] hover:underline text-xs inline-flex items-center gap-1 font-medium hover:translate-x-0.5 transition-all duration-200"
                  >
                    <span>Todas as Trilhas →</span>
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 4: FERRAMENTAS & CONTATO (2 colunas) */}
            <div className="lg:col-span-2 flex flex-col gap-4">
              <span className="font-heading text-[11px] text-[#F4F7FA] font-bold tracking-[0.18em] uppercase opacity-90">
                FERRAMENTAS
              </span>
              <ul className="flex flex-col gap-2.5 text-xs sm:text-sm">
                <li>
                  <Link
                    to="/demo"
                    className="text-[#93A3B5] hover:text-[#12B886] font-medium transition-all hover:translate-x-0.5 duration-200 inline-flex items-center gap-1.5"
                  >
                    <span>Ver Demonstração</span>
                    <span className="px-1 py-0.5 rounded bg-[#12B886]/10 text-[#12B886] border border-[#12B886]/25 text-[9px] font-mono">
                      Tour
                    </span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/radar-regulatorio"
                    className="text-[#93A3B5] hover:text-[#12B886] font-medium transition-all hover:translate-x-0.5 duration-200 inline-flex items-center gap-1.5"
                  >
                    <span>Radar Regulatório 2026</span>
                    <span className="px-1 py-0.5 rounded bg-[#12B886]/10 text-[#12B886] border border-[#12B886]/25 text-[9px] font-mono">
                      Novo
                    </span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/diagnostico"
                    className="text-[#93A3B5] hover:text-[#12B886] transition-all hover:translate-x-0.5 duration-200 inline-block"
                  >
                    Diagnóstico por CNPJ
                  </Link>
                </li>
                <li>
                  <Link
                    to="/verificador"
                    className="text-[#93A3B5] hover:text-[#12B886] transition-all hover:translate-x-0.5 duration-200 inline-block"
                  >
                    Consultar Selo
                  </Link>
                </li>
                <li>
                  <Link
                    to="/fatores"
                    className="text-[#93A3B5] hover:text-[#12B886] transition-all hover:translate-x-0.5 duration-200 inline-block"
                  >
                    Fatores CO₂e & Metodologia
                  </Link>
                </li>
                <li>
                  <Link
                    to="/capital"
                    className="text-[#93A3B5] hover:text-[#12B886] font-medium transition-all hover:translate-x-0.5 duration-200 inline-block"
                  >
                    Green Capital Engine
                  </Link>
                </li>
                {isAdminOrPerito && (
                  <li>
                    <Link
                      to="/console-do-auditor"
                      className="text-[#D9B36C] hover:text-[#D9B36C]/80 transition-all hover:translate-x-0.5 duration-200 inline-flex items-center gap-1.5 font-medium"
                    >
                      <span>Console do Auditor</span>
                      <Lock className="w-3 h-3 text-[#D9B36C]" />
                    </Link>
                  </li>
                )}
                <li>
                  <Link
                    to="/teste"
                    className="text-[11px] text-[#93A3B5]/50 hover:text-[#93A3B5] transition-colors"
                  >
                    Catálogo de Teste
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar — Copyright & Regulatório / LGPD */}
          <div className="pt-8 sm:pt-10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#93A3B5]/80">
            <p className="text-center sm:text-left">
              © {new Date().getFullYear()} Orbis Protocol • Auditoria & Rastreabilidade dMRV. Todos
              os direitos reservados.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-6">
              <Link
                to="/titular-dados"
                className="text-[11px] text-[#12B886] hover:underline font-semibold transition-colors"
              >
                Canal do Titular LGPD (Art. 18)
              </Link>
              <Link
                to="/privacidade"
                className="text-[11px] text-[#93A3B5]/80 hover:text-[#12B886] underline transition-colors"
              >
                Política de Privacidade
              </Link>
              <span className="text-[#12B886] font-semibold text-[11px] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#12B886] animate-pulse" />
                Selo Oficial Registrado
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
