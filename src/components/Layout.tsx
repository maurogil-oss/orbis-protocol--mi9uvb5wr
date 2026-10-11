import React, { useState, useEffect, useRef } from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import { OrbisGlobe } from './OrbisGlobe'
import { OrbisLogo } from './OrbisLogo'
import { useAuth } from '@/contexts/AuthContext'
import { AssistenteOrbisWidget } from './AssistenteOrbisWidget'
import { ThemeToggle } from './ThemeToggle'
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
  GraduationCap,
  Mail,
} from 'lucide-react'

export default function Layout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [solutionsDropdownOpen, setSolutionsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const dropdownTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const location = useLocation()
  const { isAuthenticated, user, logout, role, isMaster, isAdmin, isAdminOrPerito, isParceiro } =
    useAuth()

  // Determinação precisa do papel para exibição no cabeçalho
  const isGestao =
    isMaster ||
    isAdmin ||
    role === 'master' ||
    role === 'admin' ||
    role === 'controller' ||
    role === 'financeiro' ||
    role === 'financeiro_leitor'
  const isPerito = role === 'perito'
  const isCliente =
    role === 'cliente' || role === 'cliente_acp' || (!isGestao && !isPerito && !isParceiro)

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
        {
          title: 'Orbis Educação (MEI & Escolas)',
          desc: 'Programa socioeducativo para escolas e microempreendedores em economia circular.',
          path: '/educacao',
          icon: GraduationCap,
          badge: 'Social',
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
          title: 'Consultar atestado',
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

  // 6 itens essenciais da faixa regulatória
  const regulations = [
    '01/08/2026: Fase-teste IBS 0,1% / CBS 0,9% na NF-e (Art. 348 LC 214/2025)',
    'Lei 15.042/2024: Mercado Regulado de Carbono (SBCE - limiares 10k e 25k tCO₂e)',
    'Programa MOVER Lei 14.902/2024: Desmontagem veicular e circularidade estruturadas conforme Lei 14.902/2024',
    'Reforma Tributária LC 227/2026 & Decreto 12.955/2026: Novo IVA Dual',
    'IFRS S1/S2: relato de sustentabilidade e riscos climáticos',
    'Res. BCB 4.945/2021: Políticas de Responsabilidade Social, Ambiental e Climática (PRSAC)',
  ]

  const isHomePage = location.pathname === '/'

  return (
    <div className="flex flex-col min-h-screen w-full max-w-full min-w-0 overflow-x-hidden bg-background text-foreground selection:bg-emerald-600/20 selection:text-emerald-900 dark:selection:bg-[#059669]/30 dark:selection:text-white">
      {/* Skip-link WCAG 2.4.1 (P0 de acessibilidade): primeiro elemento focável */}
      <a
        href="#conteudo-principal"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:px-4 focus:py-2.5 focus:rounded-lg focus:bg-emerald-600 focus:text-white focus:font-bold focus:shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-400 min-h-[44px] min-w-[44px] inline-flex items-center"
      >
        Pular para o conteúdo
      </a>

      {/* Cabeçalho Unificado Sticky com z-index alto (z-50) e sem overflow-hidden no contêiner para não cortar menus flutuantes */}
      <div className="sticky top-0 z-50 w-full max-w-full min-w-0">
        {/* 1. Regulatory Marquee Top Bar — Contraste refinado claro e escuro. Sai da Home para atender WCAG 2.2.2 e o requisito 3 */}
        {!isHomePage && (
          <div className="w-full max-w-full min-w-0 bg-slate-100 dark:bg-[#0A1628] border-b border-slate-200/80 dark:border-slate-800 py-2 text-xs overflow-hidden transition-colors duration-300">
            <div className="animate-marquee items-center gap-6 whitespace-nowrap text-slate-700 dark:text-slate-300 font-medium tracking-wider max-w-full">
              {[...regulations, ...regulations].map((reg, idx) => (
                <span key={idx} className="inline-flex items-center gap-4 shrink-0">
                  <span className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    {reg}
                  </span>
                  <span className="text-slate-400 dark:text-slate-500 font-bold" aria-hidden="true">
                    •
                  </span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 2. Sticky Header — Fundo surface corporativo branco/slate no claro e #0A1628 no escuro */}
        <header
          className={`w-full max-w-full min-w-0 transition-all duration-300 bg-white/95 dark:bg-[#0A1628] backdrop-blur-md relative z-50 ${
            isScrolled
              ? 'border-b border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]'
              : 'border-b border-slate-200/70 dark:border-slate-800/60'
          }`}
        >
          <div className="w-full max-w-[1400px] mx-auto px-3 sm:px-6 flex items-center justify-between h-20 min-w-0 gap-2 xl:gap-4">
            {/* Brand Logo & Name — shrink-0 garante que o logo nunca seja comprimido ou invadido pela navegação */}
            <Link
              to="/"
              className="flex items-center gap-2 sm:gap-3 group shrink-0 min-w-0 min-h-[44px]"
              title="Orbis Protocol"
              aria-label="Orbis Protocol"
            >
              <div className="shrink-0" aria-hidden="true">
                <div className="block sm:hidden">
                  <OrbisGlobe size={32} />
                </div>
                <div className="hidden sm:block">
                  <OrbisGlobe size={40} />
                </div>
              </div>
              <div className="flex flex-col items-start sm:items-center text-left sm:text-center min-w-0 shrink-0">
                <span className="font-heading font-black text-[13px] min-[380px]:text-sm sm:text-lg lg:text-xl tracking-[0.01em] min-[380px]:tracking-[0.03em] sm:tracking-[0.08em] text-slate-900 dark:text-[#F8FAFC] group-hover:text-emerald-600 dark:group-hover:text-[#059669] transition-colors whitespace-nowrap sm:text-center sm:w-full">
                  ORBIS<span className="text-emerald-600 dark:text-[#059669]">.</span>PROTOCOL
                </span>
                <span className="text-[12px] tracking-[0.04em] min-[380px]:tracking-[0.06em] sm:tracking-[0.18em] uppercase text-slate-700 dark:text-slate-300 font-semibold whitespace-nowrap sm:text-center sm:w-full">
                  Economia Circular — dMRV
                </span>
              </div>
            </Link>

            {/* Desktop Navigation - 5 Destinos Públicos: Início, Soluções, Trilhas, Protocolo, Diagnóstico */}
            <nav
              aria-label="Navegação principal"
              className="hidden lg:flex items-center gap-2.5 xl:gap-5 2xl:gap-6 shrink min-w-0"
            >
              {/* 1. Início */}
              <Link
                to="/"
                className={`text-xs xl:text-sm tracking-wide font-medium transition-colors hover:text-emerald-600 dark:hover:text-[#059669] whitespace-nowrap min-h-[44px] inline-flex items-center ${
                  location.pathname === '/' && !location.hash
                    ? 'text-emerald-600 dark:text-[#059669] font-semibold'
                    : 'text-slate-700 dark:text-slate-300'
                }`}
              >
                Início
              </Link>

              {/* 2. Soluções (Link direto para /solucoes + Dropdown flutuante de atalhos da árvore) */}
              <div
                ref={dropdownRef}
                className="relative"
                onMouseEnter={handleDropdownMouseEnter}
                onMouseLeave={handleDropdownMouseLeave}
              >
                <div className="flex items-center">
                  <Link
                    to="/solucoes"
                    className={`inline-flex items-center text-xs xl:text-sm tracking-wide font-medium transition-colors hover:text-emerald-600 dark:hover:text-[#059669] py-2 whitespace-nowrap min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 dark:focus-visible:ring-[#2563EB] rounded ${
                      isSolutionsActive
                        ? 'text-emerald-600 dark:text-[#059669] font-semibold'
                        : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    Soluções
                  </Link>
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
                    aria-label="Expandir atalhos de Soluções"
                    className="p-1 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                  >
                    <ChevronDown
                      className={`w-3.5 h-3.5 transition-transform duration-200 ${
                        solutionsDropdownOpen
                          ? 'rotate-180 text-emerald-600 dark:text-[#059669]'
                          : 'opacity-70'
                      }`}
                    />
                  </button>
                </div>

                {/* Dropdown / Mega Menu Flutuante */}
                {solutionsDropdownOpen && (
                  <div
                    role="menu"
                    aria-label="Submenu Soluções"
                    className="absolute left-1/2 -translate-x-1/2 top-full pt-2 z-50 animate-in fade-in-0 zoom-in-95 duration-150"
                  >
                    <div className="w-[580px] max-w-[92vw] p-4 rounded-xl bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-slate-800 shadow-xl dark:shadow-2xl backdrop-blur-xl max-h-[85vh] overflow-y-auto">
                      <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between mb-3">
                        <span className="text-xs font-semibold tracking-wider text-emerald-600 dark:text-[#059669]">
                          Árvore de Decisão & Soluções
                        </span>
                        <Link
                          to="/solucoes"
                          onClick={() => setSolutionsDropdownOpen(false)}
                          className="text-xs text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-[#059669] transition-colors"
                        >
                          Ver árvore completa →
                        </Link>
                      </div>

                      <div className="space-y-4">
                        {solutionGroups.map((group) => (
                          <div key={group.persona} className="space-y-1.5">
                            <div className="px-2.5 flex items-baseline justify-between">
                              <span className="text-xs font-bold text-slate-900 dark:text-[#F8FAFC] uppercase tracking-wider">
                                {group.persona}
                              </span>
                              <span className="text-[12px] text-slate-600 dark:text-slate-300 hidden sm:inline">
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
                                        ? 'bg-emerald-50 dark:bg-[#059669]/10 border border-emerald-200 dark:border-[#059669]/30'
                                        : 'hover:bg-slate-50 dark:hover:bg-[#111827] border border-transparent'
                                    }`}
                                  >
                                    <div
                                      className={`mt-0.5 p-2 rounded-lg flex-shrink-0 transition-colors ${
                                        isActive
                                          ? 'bg-emerald-100 text-emerald-700 dark:bg-[#059669]/20 dark:text-[#059669]'
                                          : 'bg-slate-100 dark:bg-[#0E1A2E] text-slate-600 dark:text-[#94A3B8] group-hover:text-emerald-600 dark:group-hover:text-[#059669] group-hover:bg-emerald-50 dark:group-hover:bg-[#059669]/10'
                                      }`}
                                    >
                                      <Icon className="w-4 h-4" />
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                      <div className="flex items-center gap-2">
                                        <span
                                          className={`text-sm font-semibold tracking-wide transition-colors ${
                                            isActive
                                              ? 'text-emerald-700 dark:text-[#059669]'
                                              : 'text-slate-900 dark:text-[#F8FAFC] group-hover:text-emerald-600 dark:group-hover:text-[#059669]'
                                          }`}
                                        >
                                          {item.title}
                                        </span>
                                        {'badge' in item && item.badge && (
                                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[12px] font-mono font-semibold bg-amber-50 dark:bg-[#111827] text-amber-800 dark:text-[#D9B36C] border border-amber-200 dark:border-[#D9B36C]/30 shrink-0">
                                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 dark:bg-[#D9B36C]" />
                                            {item.badge}
                                          </span>
                                        )}
                                      </div>
                                      <span className="text-xs text-slate-600 dark:text-slate-300 leading-snug line-clamp-1">
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
                      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 px-2.5 flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
                        <span>Passaporte sustentável de fornecedores:</span>
                        <Link
                          to="/bureau"
                          onClick={() => setSolutionsDropdownOpen(false)}
                          className="text-emerald-600 dark:text-[#059669] hover:underline font-medium"
                        >
                          Acessar Cockpit Bureau ACP →
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 3. Trilhas (absorve Orbis Educação e formação técnica) */}
              <Link
                to="/trilhas"
                className={`text-xs xl:text-sm tracking-wide font-medium transition-colors hover:text-emerald-600 dark:hover:text-[#059669] whitespace-nowrap min-h-[44px] inline-flex items-center ${
                  location.pathname.startsWith('/trilhas') ||
                  location.pathname.startsWith('/educacao')
                    ? 'text-emerald-600 dark:text-[#059669] font-semibold'
                    : 'text-slate-700 dark:text-slate-300'
                }`}
              >
                Trilhas
              </Link>

              {/* 4. Protocolo (novo hub metodológico e regulatório) */}
              <Link
                to="/protocolo"
                className={`text-xs xl:text-sm tracking-wide font-medium transition-colors hover:text-emerald-600 dark:hover:text-[#059669] whitespace-nowrap min-h-[44px] inline-flex items-center ${
                  location.pathname === '/protocolo' ||
                  location.pathname === '/fatores' ||
                  location.pathname === '/radar-regulatorio' ||
                  location.pathname === '/api-docs-cdv' ||
                  location.pathname === '/api-docs-nfs'
                    ? 'text-emerald-600 dark:text-[#059669] font-semibold'
                    : 'text-slate-700 dark:text-slate-300'
                }`}
              >
                Protocolo
              </Link>

              {/* 5. Diagnóstico */}
              <Link
                to="/diagnostico"
                className={`text-xs xl:text-sm tracking-wide font-medium transition-colors hover:text-emerald-600 dark:hover:text-[#059669] whitespace-nowrap min-h-[44px] inline-flex items-center ${
                  location.pathname === '/diagnostico'
                    ? 'text-emerald-600 dark:text-[#059669] font-semibold'
                    : 'text-slate-700 dark:text-slate-300'
                }`}
              >
                Diagnóstico
              </Link>
            </nav>

            {/* Header Action Buttons & Theme Toggle — Dinâmico por Sessão (Rodada 2) */}
            <div className="hidden md:flex items-center gap-2 lg:gap-3 shrink-0">
              <ThemeToggle />

              {/* Link discreto para Verificar Atestado (caminho fixo do comprador, sempre visível para todos) */}
              <Link
                to="/verificador"
                className="hidden xl:inline-flex items-center justify-center px-3 py-2 text-xs xl:text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-400 hover:underline min-h-[44px] whitespace-nowrap shrink-0"
              >
                Verificar Atestado
              </Link>

              {/* 1. Visitante NÃO autenticado */}
              {!isAuthenticated ? (
                <>
                  <Link
                    to="/diagnostico"
                    className="inline-flex items-center justify-center px-4 xl:px-5 py-2.5 rounded-xl text-xs xl:text-sm font-bold whitespace-nowrap bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-[#2563EB] dark:text-white dark:hover:bg-blue-600 hover:-translate-y-0.5 active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 transition-all duration-200 shadow-sm shrink-0 min-h-[44px]"
                  >
                    Iniciar Diagnóstico
                  </Link>
                  <div className="flex items-center gap-1.5 xl:gap-2 pl-2 xl:pl-3 border-l border-slate-200 dark:border-slate-800 shrink-0">
                    <Link
                      to="/login"
                      className="inline-flex items-center justify-center px-3 py-2 text-xs xl:text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:underline whitespace-nowrap min-h-[44px]"
                    >
                      Entrar
                    </Link>
                    {!isHomePage && (
                      <Link
                        to="/registro"
                        className="inline-flex items-center justify-center px-2.5 xl:px-3 py-2 rounded-xl text-xs xl:text-sm font-medium whitespace-nowrap border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-emerald-600/60 dark:hover:border-[#059669]/60 hover:text-slate-900 dark:hover:text-white transition-all bg-white dark:bg-[#0A1628] shrink-0 min-h-[44px]"
                      >
                        Criar conta
                      </Link>
                    )}
                  </div>
                </>
              ) : (
                /* 2. Usuário Autenticado: sem CTAs de aquisição/marketing ("Iniciar Diagnóstico" some) */
                <div className="flex items-center gap-1.5 xl:gap-2 shrink-0">
                  {/* Papel GESTÃO (master, admin, controller, financeiro) -> "Console" (/admin) */}
                  {isGestao && (
                    <Link
                      to="/admin"
                      className="inline-flex items-center gap-1.5 px-3.5 xl:px-4 py-2.5 rounded-xl text-xs xl:text-sm font-bold whitespace-nowrap bg-blue-600 text-white hover:bg-blue-700 dark:bg-[#2563EB] dark:hover:bg-blue-600 hover:-translate-y-0.5 active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 transition-all duration-200 shadow-sm shrink-0 min-h-[44px]"
                    >
                      <Lock className="w-4 h-4 stroke-[1.8] shrink-0" />
                      <span>Console</span>
                    </Link>
                  )}

                  {/* Papel PERITO -> "Revisão Pericial" (/revisor-f6) */}
                  {isPerito && (
                    <Link
                      to="/revisor-f6"
                      className="inline-flex items-center gap-1.5 px-3.5 xl:px-4 py-2.5 rounded-xl text-xs xl:text-sm font-bold whitespace-nowrap bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 hover:-translate-y-0.5 active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 transition-all duration-200 shadow-sm shrink-0 min-h-[44px]"
                    >
                      <FileCheck2 className="w-4 h-4 stroke-[1.8] shrink-0" />
                      <span>Revisão Pericial</span>
                    </Link>
                  )}

                  {/* Papel PARCEIRO -> "Meu Portal" (/parceiro) */}
                  {isParceiro && (
                    <Link
                      to="/parceiro"
                      className="inline-flex items-center gap-1.5 px-3.5 xl:px-4 py-2.5 rounded-xl text-xs xl:text-sm font-bold whitespace-nowrap bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 hover:-translate-y-0.5 active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 transition-all duration-200 shadow-sm shrink-0 min-h-[44px]"
                    >
                      <LayoutDashboard className="w-4 h-4 stroke-[1.8] shrink-0" />
                      <span>Meu Portal</span>
                    </Link>
                  )}

                  {/* Papel CLIENTE (inclui cliente_acp e default) -> "Meu Portal" (/painel) */}
                  {isCliente && !isGestao && !isPerito && !isParceiro && (
                    <Link
                      to="/painel"
                      className="inline-flex items-center gap-1.5 px-3.5 xl:px-4 py-2.5 rounded-xl text-xs xl:text-sm font-bold whitespace-nowrap bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 hover:-translate-y-0.5 active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 transition-all duration-200 shadow-sm shrink-0 min-h-[44px]"
                    >
                      <LayoutDashboard className="w-4 h-4 stroke-[1.8] shrink-0" />
                      <span>Meu Portal</span>
                    </Link>
                  )}

                  <div className="flex items-center pl-1.5 xl:pl-2 border-l border-slate-200 dark:border-slate-800 shrink-0">
                    <button
                      onClick={logout}
                      title="Sair"
                      className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-[#F03E54] border border-slate-200 dark:border-slate-800 hover:border-rose-200 dark:hover:border-[#F03E54]/40 transition-all duration-200 bg-white dark:bg-[#0E1A2E] shrink-0 min-h-[44px] min-w-[44px] inline-flex items-center justify-center"
                    >
                      <LogOut className="w-4 h-4 stroke-[1.5]" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile / Tablet Actions: Theme Toggle + Hamburger */}
            <div className="lg:hidden flex items-center gap-1 sm:gap-2 shrink-0 ml-auto">
              <ThemeToggle size="compact" />
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="p-1.5 sm:p-2 text-slate-800 dark:text-[#F8FAFC] hover:text-emerald-600 dark:hover:text-[#059669] transition-colors shrink-0 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
                aria-label="Abrir menu"
              >
                <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>
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

          {/* Drawer Content — Sólido opaco com tom-base #0A1628 */}
          <div className="relative w-full max-w-xs bg-[#0A1628] border-l border-slate-800 h-full p-6 flex flex-col justify-between shadow-2xl z-10 animate-in slide-in-from-right duration-300">
            <div>
              <div className="flex items-center justify-between pb-6 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <OrbisGlobe size={34} />
                  <div className="flex flex-col items-center text-center">
                    <span className="font-heading font-black text-lg tracking-wider text-[#F8FAFC] text-center w-full">
                      ORBIS PROTOCOL
                    </span>
                    <span className="text-[11px] tracking-[0.2em] uppercase text-[#94A3B8] font-semibold whitespace-nowrap text-center w-full -mt-0.5">
                      Economia Circular — dMRV
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 text-[#94A3B8] hover:text-[#F8FAFC]"
                  aria-label="Fechar menu"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="mt-6 flex flex-col gap-1 overflow-y-auto max-h-[calc(100vh-220px)] pr-1">
                {/* 5 Destinos Públicos: Início, Soluções, Trilhas, Protocolo, Diagnóstico */}
                <Link
                  to="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between py-2.5 px-3 rounded-lg text-sm font-medium transition-colors ${
                    location.pathname === '/' && !location.hash
                      ? 'bg-[#059669]/10 text-[#059669]'
                      : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#111827]'
                  }`}
                >
                  <span>Início</span>
                  <ChevronRight className="w-4 h-4 opacity-50" />
                </Link>

                <Link
                  to="/solucoes"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between py-2.5 px-3 rounded-lg text-sm font-medium transition-colors ${
                    location.pathname.startsWith('/solucoes')
                      ? 'bg-[#059669]/10 text-[#059669]'
                      : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#111827]'
                  }`}
                >
                  <span>Soluções (Árvore de Decisão)</span>
                  <ChevronRight className="w-4 h-4 opacity-50" />
                </Link>

                <Link
                  to="/trilhas"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between py-2.5 px-3 rounded-lg text-sm font-medium transition-colors ${
                    location.pathname.startsWith('/trilhas') ||
                    location.pathname.startsWith('/educacao')
                      ? 'bg-[#059669]/10 text-[#059669]'
                      : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#111827]'
                  }`}
                >
                  <span>Trilhas & Educação</span>
                  <ChevronRight className="w-4 h-4 opacity-50" />
                </Link>

                <Link
                  to="/protocolo"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between py-2.5 px-3 rounded-lg text-sm font-medium transition-colors ${
                    location.pathname === '/protocolo' ||
                    location.pathname === '/fatores' ||
                    location.pathname === '/radar-regulatorio'
                      ? 'bg-[#059669]/10 text-[#059669]'
                      : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#111827]'
                  }`}
                >
                  <span>Protocolo (Metodologia & APIs)</span>
                  <ChevronRight className="w-4 h-4 opacity-50" />
                </Link>

                <Link
                  to="/diagnostico"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between py-2.5 px-3 rounded-lg text-sm font-medium transition-colors ${
                    location.pathname === '/diagnostico'
                      ? 'bg-[#059669]/10 text-[#059669]'
                      : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#111827]'
                  }`}
                >
                  <span>Diagnóstico</span>
                  <ChevronRight className="w-4 h-4 opacity-50" />
                </Link>

                {/* Subseções / Atalhos Rápidos da Árvore de Soluções */}
                <div className="pt-3 mt-2 border-t border-slate-800">
                  <div className="px-3 pb-2 flex items-center justify-between">
                    <span className="text-xs uppercase font-bold tracking-wider text-[#059669] flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-[#059669]" />
                      Atalhos Rápidos
                    </span>
                    <Link
                      to="/solucoes"
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-xs text-[#94A3B8] hover:text-[#059669]"
                    >
                      Ver árvore
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
                                  ? 'bg-[#059669]/10 text-[#059669]'
                                  : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#111827]'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 truncate">
                                <Icon className="w-3.5 h-3.5 opacity-70 flex-shrink-0" />
                                <div className="truncate">
                                  <div className="flex items-center gap-1.5 truncate">
                                    <span className="truncate font-medium">{item.title}</span>
                                    {'badge' in item && item.badge && (
                                      <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[9px] font-mono font-semibold bg-[#111827] text-[#D9B36C] border border-[#D9B36C]/30 shrink-0">
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
                  <div className="pt-2 mt-2 border-t border-slate-800">
                    <Link
                      to="/console-do-auditor"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center justify-between py-2.5 px-3 rounded-lg text-xs font-medium text-[#D9B36C] hover:bg-[#111827] transition-colors"
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
                  <div className="pt-2 mt-2 border-t border-slate-800">
                    <Link
                      to="/parceiro-painel"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center justify-between py-2.5 px-3 rounded-lg text-xs font-medium text-[#059669] hover:bg-[#111827] transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4" />
                        Painel do Parceiro
                      </span>
                      <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-[#059669]/20 text-[#059669]">
                        {user?.cliente_codigo || 'ORB-PAR'}
                      </span>
                    </Link>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-6 border-t border-slate-800 flex flex-col gap-3">
              {/* O link "Verificar Atestado" permanece FIXO no drawer mobile para TODOS os públicos */}
              <Link
                to="/verificador"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 rounded-lg text-sm font-medium border border-slate-800 text-slate-300 hover:text-emerald-400 bg-[#0E1A2E]/70 transition-all duration-200 min-h-[44px] flex items-center justify-center"
              >
                Verificar Atestado
              </Link>

              {/* Visitante não autenticado vê CTA Iniciar Diagnóstico e Entrar */}
              {!isAuthenticated ? (
                <>
                  <Link
                    to="/diagnostico"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center py-3 rounded-lg text-sm font-bold bg-[#2563EB] text-white hover:bg-blue-600 transition-all duration-200 shadow-sm min-h-[44px] flex items-center justify-center"
                  >
                    Iniciar Diagnóstico
                  </Link>
                  <div className="flex flex-col gap-2 pt-1 border-t border-slate-800">
                    <Link
                      to="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="w-full text-center py-2.5 rounded-lg text-sm font-medium border border-slate-800 text-slate-300 hover:border-[#059669] min-h-[44px] flex items-center justify-center"
                    >
                      Entrar na Conta
                    </Link>
                  </div>
                </>
              ) : (
                /* Autenticado: sem CTA Iniciar Diagnóstico; direcionamento dinâmico pelo papel */
                <div className="flex flex-col gap-2 pt-1 border-t border-slate-800">
                  {isGestao && (
                    <Link
                      to="/admin"
                      onClick={() => setMobileMenuOpen(false)}
                      className="w-full text-center py-2.5 rounded-lg text-sm font-bold bg-[#2563EB] text-white hover:bg-blue-600 min-h-[44px] flex items-center justify-center gap-2"
                    >
                      <Lock className="w-4 h-4" />
                      <span>Console</span>
                    </Link>
                  )}

                  {isPerito && (
                    <Link
                      to="/revisor-f6"
                      onClick={() => setMobileMenuOpen(false)}
                      className="w-full text-center py-2.5 rounded-lg text-sm font-bold bg-emerald-600 text-white hover:bg-emerald-500 min-h-[44px] flex items-center justify-center gap-2"
                    >
                      <FileCheck2 className="w-4 h-4" />
                      <span>Revisão Pericial</span>
                    </Link>
                  )}

                  {isParceiro && (
                    <Link
                      to="/parceiro"
                      onClick={() => setMobileMenuOpen(false)}
                      className="w-full text-center py-2.5 rounded-lg text-sm font-bold bg-emerald-600 text-white hover:bg-emerald-500 min-h-[44px] flex items-center justify-center gap-2"
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      <span>Meu Portal</span>
                    </Link>
                  )}

                  {isCliente && !isGestao && !isPerito && !isParceiro && (
                    <Link
                      to="/painel"
                      onClick={() => setMobileMenuOpen(false)}
                      className="w-full text-center py-2.5 rounded-lg text-sm font-bold bg-emerald-600 text-white hover:bg-emerald-500 min-h-[44px] flex items-center justify-center gap-2"
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      <span>Meu Portal</span>
                    </Link>
                  )}

                  <button
                    onClick={() => {
                      logout()
                      setMobileMenuOpen(false)
                    }}
                    className="w-full text-center py-2 rounded-lg text-xs font-medium text-[#F03E54] hover:bg-[#F03E54]/10 min-h-[44px] flex items-center justify-center"
                  >
                    Desconectar Sessão
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4. Main Page Content */}
      <main
        id="conteudo-principal"
        tabIndex={-1}
        className="flex-1 flex flex-col w-full min-w-0 focus:outline-none"
      >
        <Outlet />
      </main>

      {/* Widget Flutuante do Assistente Orbis IA (Landing / e /diagnostico e todo o site) */}
      <AssistenteOrbisWidget />

      {/* 5. Institutional Footer — Design corporativo claro/escuro */}
      <footer className="bg-slate-50 dark:bg-[#0A1628] border-t border-slate-200 dark:border-slate-800 pt-16 sm:pt-20 pb-12 sm:pb-16 text-slate-700 dark:text-[#94A3B8] relative overflow-hidden">
        {/* Glow sutil de fundo no rodapé */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[250px] linear-glow-emerald pointer-events-none opacity-20" />

        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 relative z-10">
          {/* Barra de Regulamentações no Topo do Rodapé */}
          <div className="mb-12 pb-8 border-b border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center justify-between gap-3 mb-4">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-700 dark:text-[#059669] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-[#059669]" />
                Enquadramento e Diretrizes Regulatórias
              </span>
              <span className="text-[12px] font-mono text-slate-500 dark:text-[#94A3B8] hidden sm:inline">
                Normas e Marcos Oficiais
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <div className="p-3 rounded-xl bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-slate-800 shadow-xs">
                <span className="block text-xs font-bold text-slate-900 dark:text-[#F8FAFC]">
                  Lei 15.042/2024
                </span>
                <span className="text-[12px] text-slate-600 dark:text-[#94A3B8] leading-tight mt-0.5 block">
                  Mercado Regulado de Carbono (SBCE)
                </span>
              </div>
              <div className="p-3 rounded-xl bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-slate-800 shadow-xs">
                <span className="block text-xs font-bold text-slate-900 dark:text-[#F8FAFC]">
                  SBCE — Lei 14.902/2024
                </span>
                <span className="text-[12px] text-slate-600 dark:text-[#94A3B8] leading-tight mt-0.5 block">
                  Mobilidade Verde & Créditos
                </span>
              </div>
              <div className="p-3 rounded-xl bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-slate-800 shadow-xs">
                <span className="block text-xs font-bold text-slate-900 dark:text-[#F8FAFC]">
                  Programa MOVER/CDVerde
                </span>
                <span className="text-[12px] text-slate-600 dark:text-[#94A3B8] leading-tight mt-0.5 block">
                  Circularidade & Desmonte VFV
                </span>
              </div>
              <div className="p-3 rounded-xl bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-slate-800 shadow-xs">
                <span className="block text-xs font-bold text-slate-900 dark:text-[#F8FAFC]">
                  IFRS S1/S2
                </span>
                <span className="text-[12px] text-slate-600 dark:text-[#94A3B8] leading-tight mt-0.5 block">
                  Relato Climático & Escopos 1/2/3
                </span>
              </div>
              <div className="p-3 rounded-xl bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-slate-800 shadow-xs sm:col-span-2 lg:col-span-1">
                <span className="block text-xs font-bold text-slate-900 dark:text-[#F8FAFC]">
                  Crédito Bacen 4.945
                </span>
                <span className="text-[12px] text-slate-600 dark:text-[#94A3B8] leading-tight mt-0.5 block">
                  Políticas PRSAC no Crédito Bancário
                </span>
              </div>
            </div>
          </div>

          {/* Grid de 4 Colunas Rotuladas: Marca, Soluções, Verificação, Orbis */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8 pb-14 sm:pb-16 border-b border-slate-200/80 dark:border-slate-800">
            {/* Coluna 1: Marca & Identidade Institucional (lg:col-span-4) */}
            <div className="lg:col-span-4 flex flex-col justify-between gap-6 pr-0 lg:pr-6">
              <div className="space-y-4">
                <Link to="/" className="inline-flex items-center gap-3.5 group min-h-[44px]">
                  <div className="relative flex items-center justify-center shrink-0">
                    <OrbisGlobe size={40} />
                  </div>
                  <div className="flex flex-col items-center text-center">
                    <span className="font-heading font-black text-xl tracking-[0.08em] text-slate-900 dark:text-[#F8FAFC] group-hover:text-emerald-600 dark:group-hover:text-[#059669] transition-colors text-center w-full">
                      ORBIS PROTOCOL
                    </span>
                    <span className="text-[11px] tracking-[0.22em] uppercase text-slate-900 dark:text-white font-semibold -mt-0.5 whitespace-nowrap text-center w-full">
                      Economia Circular — dMRV
                    </span>
                  </div>
                </Link>
                <p className="text-xs sm:text-sm text-slate-700 dark:text-[#94A3B8] leading-relaxed max-w-sm font-medium">
                  Infraestrutura de comprovação e rastreabilidade para a economia circular
                </p>
              </div>

              <div className="space-y-2.5 pt-1">
                <div className="inline-flex items-center gap-2.5 px-3 py-2 rounded-lg bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-slate-800 text-xs text-amber-700 dark:text-[#D9B36C] shadow-xs">
                  <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-[#D9B36C] shrink-0" />
                  <span className="font-mono tracking-tight text-slate-800 dark:text-[#94A3B8]">
                    MGM CONSULTORIA EMPRESARIAL LTDA • CNPJ 19.598.964/0001-01
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs">
                  <a
                    href="mailto:contato@orbis-protocol.com"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-[#059669]/15 text-emerald-800 dark:text-[#059669] hover:bg-emerald-100 dark:hover:bg-[#059669]/25 font-semibold transition-colors min-h-[44px]"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>contato@orbis-protocol.com</span>
                  </a>
                  <Link
                    to="/equipe"
                    className="inline-flex items-center text-slate-600 dark:text-[#94A3B8] hover:text-emerald-700 dark:hover:text-[#059669] font-medium transition-colors min-h-[44px]"
                  >
                    Equipe & Operação →
                  </Link>
                </div>
              </div>
            </div>

            {/* Coluna 2: Soluções (lg:col-span-3) */}
            <div className="lg:col-span-3 flex flex-col gap-3">
              <span className="font-heading text-xs text-slate-900 dark:text-[#F8FAFC] font-bold tracking-[0.16em] uppercase opacity-95">
                Soluções
              </span>
              <ul className="flex flex-col gap-1 text-xs sm:text-sm">
                <li>
                  <Link
                    to="/solucoes#orbis-lpf"
                    className="group inline-flex items-center gap-2 text-slate-800 dark:text-[#F8FAFC] font-medium hover:text-emerald-600 dark:hover:text-[#059669] transition-all hover:translate-x-0.5 duration-200 min-h-[44px]"
                  >
                    <span>Orbis LPF — Leitura Pré-Faturamento</span>
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-100 dark:bg-[#059669]/15 text-emerald-800 dark:text-[#059669] border border-emerald-300 dark:border-[#059669]/35 shrink-0">
                      <span className="w-1 h-1 rounded-full bg-emerald-600 dark:bg-[#059669]" />
                      Novo
                    </span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/diagnostico"
                    className="inline-flex items-center text-slate-700 dark:text-[#94A3B8] hover:text-emerald-600 dark:hover:text-[#F8FAFC] transition-all hover:translate-x-0.5 duration-200 min-h-[44px]"
                  >
                    Pegada de carbono
                  </Link>
                </li>
                <li>
                  <Link
                    to="/solucoes"
                    className="inline-flex items-center gap-2 text-slate-700 dark:text-[#94A3B8] hover:text-emerald-600 dark:hover:text-[#F8FAFC] transition-all hover:translate-x-0.5 duration-200 min-h-[44px]"
                  >
                    <span>Passaporte Digital de Produto</span>
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-slate-100 dark:bg-[#111827] text-slate-600 dark:text-[#94A3B8] border border-slate-200 dark:border-slate-800">
                      em estruturação
                    </span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/diagnostico"
                    className="inline-flex items-center text-slate-700 dark:text-[#94A3B8] hover:text-emerald-600 dark:hover:text-[#F8FAFC] transition-all hover:translate-x-0.5 duration-200 min-h-[44px]"
                  >
                    Reforma tributária
                  </Link>
                </li>
                <li>
                  <Link
                    to="/solucoes"
                    className="inline-flex items-center gap-2 text-slate-700 dark:text-[#94A3B8] hover:text-emerald-600 dark:hover:text-[#F8FAFC] transition-all hover:translate-x-0.5 duration-200 min-h-[44px]"
                  >
                    <span>Logística reversa</span>
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-slate-100 dark:bg-[#111827] text-slate-600 dark:text-[#94A3B8] border border-slate-200 dark:border-slate-800">
                      em estruturação
                    </span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/mover"
                    className="inline-flex items-center text-slate-700 dark:text-[#94A3B8] hover:text-emerald-600 dark:hover:text-[#F8FAFC] transition-all hover:translate-x-0.5 duration-200 min-h-[44px]"
                  >
                    Programa MOVER
                  </Link>
                </li>
              </ul>
            </div>

            {/* Coluna 3: Verificação (lg:col-span-2) */}
            <div className="lg:col-span-2 flex flex-col gap-3">
              <span className="font-heading text-xs text-slate-900 dark:text-[#F8FAFC] font-bold tracking-[0.16em] uppercase opacity-95">
                Verificação
              </span>
              <ul className="flex flex-col gap-1 text-xs sm:text-sm">
                <li>
                  <Link
                    to="/verificador"
                    className="inline-flex items-center font-semibold text-emerald-700 dark:text-[#059669] hover:underline transition-all hover:translate-x-0.5 duration-200 min-h-[44px]"
                  >
                    Consultar atestado
                  </Link>
                </li>
                <li>
                  <Link
                    to="/fatores"
                    className="inline-flex items-center text-slate-700 dark:text-[#94A3B8] hover:text-emerald-600 dark:hover:text-[#F8FAFC] transition-all hover:translate-x-0.5 duration-200 min-h-[44px]"
                  >
                    Metodologia
                  </Link>
                </li>
                <li>
                  <Link
                    to="/trilhas/peritos-tecnicos"
                    className="inline-flex items-center text-slate-700 dark:text-[#94A3B8] hover:text-emerald-600 dark:hover:text-[#F8FAFC] transition-all hover:translate-x-0.5 duration-200 min-h-[44px]"
                  >
                    Rede de peritos
                  </Link>
                </li>
                <li>
                  <Link
                    to="/radar-regulatorio"
                    className="inline-flex items-center text-slate-700 dark:text-[#94A3B8] hover:text-emerald-600 dark:hover:text-[#F8FAFC] transition-all hover:translate-x-0.5 duration-200 min-h-[44px]"
                  >
                    Radar Regulatório
                  </Link>
                </li>
                {isAdminOrPerito && (
                  <li>
                    <Link
                      to="/console-do-auditor"
                      className="inline-flex items-center gap-1.5 text-amber-700 dark:text-[#D9B36C] hover:underline font-medium min-h-[44px]"
                    >
                      <Lock className="w-3 h-3" />
                      <span>Console do Auditor</span>
                    </Link>
                  </li>
                )}
              </ul>
            </div>

            {/* Coluna 4: Orbis (lg:col-span-3) */}
            <div className="lg:col-span-3 flex flex-col gap-3">
              <span className="font-heading text-xs text-slate-900 dark:text-[#F8FAFC] font-bold tracking-[0.16em] uppercase opacity-95">
                Orbis
              </span>
              <ul className="flex flex-col gap-1 text-xs sm:text-sm">
                <li>
                  <Link
                    to="/educacao"
                    className="inline-flex items-center gap-1.5 text-slate-700 dark:text-[#94A3B8] hover:text-emerald-600 dark:hover:text-[#F8FAFC] transition-all hover:translate-x-0.5 duration-200 min-h-[44px]"
                  >
                    <span>Orbis Educação</span>
                    <span className="px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-[#059669]/10 text-emerald-700 dark:text-[#059669] border border-emerald-200 dark:border-[#059669]/25 text-[10px] font-mono">
                      Social
                    </span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/trilhas"
                    className="inline-flex items-center text-slate-700 dark:text-[#94A3B8] hover:text-emerald-600 dark:hover:text-[#F8FAFC] transition-all hover:translate-x-0.5 duration-200 min-h-[44px]"
                  >
                    Trilhas
                  </Link>
                </li>
                <li>
                  <Link
                    to="/solucoes/bureau-acp"
                    className="inline-flex items-center text-slate-700 dark:text-[#94A3B8] hover:text-emerald-600 dark:hover:text-[#F8FAFC] transition-all hover:translate-x-0.5 duration-200 min-h-[44px]"
                  >
                    Parceria ACP
                  </Link>
                </li>
                <li>
                  <a
                    href="mailto:contato@orbis-protocol.com"
                    className="inline-flex items-center gap-1.5 text-slate-700 dark:text-[#94A3B8] hover:text-emerald-600 dark:hover:text-[#F8FAFC] transition-all hover:translate-x-0.5 duration-200 min-h-[44px]"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Contato</span>
                  </a>
                </li>
                <li>
                  <Link
                    to="/equipe"
                    className="inline-flex items-center text-slate-700 dark:text-[#94A3B8] hover:text-emerald-600 dark:hover:text-[#F8FAFC] transition-all hover:translate-x-0.5 duration-200 min-h-[44px]"
                  >
                    Estrutura & Governança
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar — Copyright & Regulatório / LGPD / Proteção Anti-Cópia */}
          <div className="pt-8 sm:pt-10 flex flex-col gap-4 text-xs text-slate-500 dark:text-[#94A3B8]/80">
            {/* Linha 1: Aviso curto de proteção de conteúdo e documentos */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pb-3 border-b border-slate-200/60 dark:border-slate-800 text-center sm:text-left">
              <p className="text-[11px] text-slate-600 dark:text-[#94A3B8] flex items-center gap-2 justify-center sm:justify-start">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-[#059669] shrink-0" />
                <span>
                  Conteúdo e documentos protegidos — © {new Date().getFullYear()} Orbis Protocol.
                  Prova documental via hash SHA-256 e trilha imutável.
                </span>
              </p>
              <div className="flex items-center gap-3 shrink-0 text-[11px]">
                <Link
                  to="/termos"
                  className="text-emerald-600 dark:text-[#059669] hover:underline font-semibold transition-colors"
                >
                  Termos de Uso
                </Link>
                <span className="text-slate-300 dark:text-slate-700">•</span>
                <Link
                  to="/privacidade"
                  className="text-slate-600 dark:text-[#94A3B8] hover:text-emerald-600 dark:hover:text-[#059669] underline transition-colors"
                >
                  Privacidade
                </Link>
              </div>
            </div>

            {/* Linha 2: Copyright institucional & Links complementares */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-center sm:text-left text-[11px] text-slate-500 dark:text-[#94A3B8]/70">
                © 2026 Orbis Protocol — Infraestrutura de Prova Documental da Economia Circular —
                dMRV. Todos os direitos reservados.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-5">
                <Link
                  to="/equipe"
                  className="text-[11px] text-slate-500 dark:text-[#94A3B8] hover:text-emerald-600 dark:hover:text-[#059669] transition-colors font-medium"
                >
                  Equipe & Operação
                </Link>
                <span className="text-slate-300 dark:text-slate-700">•</span>
                <Link
                  to="/titular-dados"
                  className="text-[11px] text-slate-500 dark:text-[#94A3B8] hover:text-emerald-600 dark:hover:text-[#059669] transition-colors"
                >
                  Canal do Titular LGPD (Art. 18)
                </Link>
                <span className="text-emerald-700 dark:text-[#059669] font-semibold text-[11px] flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-[#059669] animate-pulse" />
                  Atestado de Conformidade Orbis
                </span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
