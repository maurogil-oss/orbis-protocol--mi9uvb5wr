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
} from 'lucide-react'

export default function Layout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [solutionsDropdownOpen, setSolutionsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const dropdownTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const location = useLocation()
  const { isAuthenticated, user, logout, isAdminOrPerito } = useAuth()

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

  // Soluções dropdown items with short 1-line descriptions
  // Green Capital and Financeiro are only included if user is authenticated
  const solutionItems = [
    {
      title: 'Radar Regulatório',
      desc: 'Monitoramento contínuo de normas, SBCE e reforma tributária',
      path: '/radar-regulatorio',
      icon: Scale,
    },
    {
      title: 'Planos',
      desc: 'Assinaturas modulares e tabela de serviços técnicos',
      path: '/planos',
      icon: Sparkles,
    },
    {
      title: 'Bureau ACP',
      desc: 'Cockpit e governança de passaporte sustentável de fornecedores',
      path: '/bureau',
      icon: Building2,
    },
    ...(isAuthenticated
      ? [
          {
            title: 'Green Capital',
            desc: 'Simulação de crédito verde com taxas bonificadas ESG',
            path: '/capital',
            icon: Coins,
          },
          {
            title: 'Financeiro',
            desc: 'Gestão de pagamentos PIX instantâneos e NFS-e automática',
            path: '/financeiro',
            icon: Receipt,
          },
        ]
      : []),
    {
      title: 'Case CDVerde',
      desc: 'Rastreabilidade e circularidade automotiva (Lei Mover)',
      path: '/solucoes/case-cdverde',
      icon: Recycle,
    },
    {
      title: 'O Protocolo',
      desc: 'Metodologia e infraestrutura probatória dMRV para conformidade',
      path: '/#o-que-e',
      icon: BookOpen,
    },
  ]

  // Check if current route matches any solutions item or solutions index
  const isSolutionsActive =
    location.pathname === '/solucoes' ||
    solutionItems.some((item) => {
      if (item.path.startsWith('/#')) {
        return location.pathname === '/' && location.hash === item.path.replace('/', '')
      }
      return location.pathname === item.path || location.pathname.startsWith(`${item.path}/`)
    })

  const regulations = [
    '01/08/2026: FASE-TESTE IBS 0,1% / CBS 0,9% NA NF-E (ART. 348 LC 214/2025)',
    'LC 227/2026 & DECRETO 12.955/2026 (NOVO IVA DUAL)',
    'LEI 15.042/2024 (DIRETRIZES SBCE - MERCADO REGULADO DE CARBONO)',
    'PROGRAMA MOVER LEI 14.902/2024 (AUTOMOTIVO & CIRCULARIDADE CDV)',
    'REPORTE VOLUNTÁRIO IFRS S1/S2 (RES. CVM 193)',
    'PREPARAÇÃO ESG CREDORES (RES. BCB 4.945/2021)',
    'MECANISMO CBAM / UNIÃO EUROPEIA (TRANSIÇÃO ATÉ 2026)',
    'NBR ISO 14064 & METODOLOGIA GHG PROTOCOL',
    'NBC TO 3000 & ART TÉCNICA dMRV',
  ]

  return (
    <div className="flex flex-col min-h-screen w-full overflow-x-clip bg-[#0A0E12] text-[#F4F7FA] selection:bg-[#12B886]/30 selection:text-white">
      {/* Cabeçalho Unificado Sticky com z-index alto e largura contida */}
      <div className="sticky top-0 z-40 w-full">
        {/* 1. Regulatory Marquee Top Bar */}
        <div className="w-full bg-[#070A0D] border-b border-[rgba(244,247,250,0.08)] py-2 text-xs overflow-hidden">
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

        {/* 2. Sticky Header */}
        <header
          className={`w-full transition-all duration-300 ${
            isScrolled
              ? 'bg-[#0A0E12]/95 backdrop-blur-md border-b border-[rgba(244,247,250,0.12)] shadow-xl'
              : 'bg-[#0A0E12]/90 backdrop-blur-sm border-b border-[rgba(244,247,250,0.05)]'
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

            {/* Desktop Navigation - Enxuta: Início · Trilhas · Soluções ▾ · Verificador de Selos */}
            <nav className="hidden lg:flex items-center gap-6 xl:gap-7">
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
                    <div className="w-[520px] max-w-[90vw] p-3 rounded-xl bg-[#0D1217] border border-[rgba(244,247,250,0.12)] shadow-2xl backdrop-blur-xl">
                      <div className="px-3 py-2 border-b border-[rgba(244,247,250,0.06)] flex items-center justify-between mb-1">
                        <span className="text-[11px] font-semibold tracking-wider uppercase text-[#12B886]">
                          Portfólio de Soluções & Módulos
                        </span>
                        <Link
                          to="/solucoes"
                          onClick={() => setSolutionsDropdownOpen(false)}
                          className="text-[11px] text-[#93A3B5] hover:text-[#12B886] transition-colors"
                        >
                          Ver Visão Geral →
                        </Link>
                      </div>

                      <div className="grid grid-cols-1 gap-1">
                        {solutionItems.map((item) => {
                          const Icon = item.icon
                          const isActive = item.path.startsWith('/#')
                            ? location.pathname === '/' &&
                              location.hash === item.path.replace('/', '')
                            : location.pathname === item.path

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
                                <span
                                  className={`text-sm font-semibold tracking-wide transition-colors ${
                                    isActive
                                      ? 'text-[#12B886]'
                                      : 'text-[#F4F7FA] group-hover:text-[#12B886]'
                                  }`}
                                >
                                  {item.title}
                                </span>
                                <span className="text-xs text-[#93A3B5] leading-snug line-clamp-1">
                                  {item.desc}
                                </span>
                              </div>
                            </Link>
                          )
                        })}
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
                Verificador de Selos
              </Link>
            </nav>

            {/* Header Action Buttons */}
            <div className="hidden md:flex items-center gap-3.5">
              <Link
                to="/diagnostico"
                className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg text-sm font-semibold bg-[#12B886] text-[#0A0E12] hover:bg-[#0CA678] hover:scale-[1.02] transition-all shadow-emerald-glow"
              >
                Iniciar Diagnóstico
              </Link>

              {isAuthenticated ? (
                <div className="flex items-center gap-2">
                  <Link
                    to="/painel"
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium border border-[rgba(244,247,250,0.2)] text-[#F4F7FA] hover:border-[#12B886] hover:text-[#12B886] transition-all bg-[#111820]"
                  >
                    <LayoutDashboard className="w-4 h-4 text-[#12B886]" />
                    Painel
                  </Link>
                  <button
                    onClick={logout}
                    title="Sair"
                    className="p-2.5 rounded-lg text-[#93A3B5] hover:text-[#F03E54] border border-[rgba(244,247,250,0.12)] hover:border-[#F03E54]/40 transition-all bg-[#111820]"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center px-4 py-2.5 rounded-lg text-sm font-medium border border-[rgba(244,247,250,0.25)] text-[#F4F7FA] hover:border-[#12B886] hover:text-[#12B886] transition-all"
                >
                  Entrar
                </Link>
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

          {/* Drawer Content */}
          <div className="relative w-full max-w-xs bg-[#111820] border-l border-[rgba(244,247,250,0.12)] h-full p-6 flex flex-col justify-between shadow-2xl z-10 animate-in slide-in-from-right duration-300">
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
                  <span>Verificador de Selos</span>
                  <ChevronRight className="w-4 h-4 opacity-50" />
                </Link>

                {/* Grupo Soluções */}
                <div className="pt-3 mt-2 border-t border-[rgba(244,247,250,0.08)]">
                  <div className="px-3 pb-2 flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-[#12B886] flex items-center gap-1.5">
                      <Layers className="w-3 h-3 text-[#12B886]" />
                      Soluções & Módulos
                    </span>
                    <Link
                      to="/solucoes"
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-[10px] text-[#93A3B5] hover:text-[#12B886]"
                    >
                      Ver Tudo
                    </Link>
                  </div>

                  <div className="flex flex-col gap-1">
                    {solutionItems.map((item) => {
                      const Icon = item.icon
                      const isActive = item.path.startsWith('/#')
                        ? location.pathname === '/' && location.hash === item.path.replace('/', '')
                        : location.pathname === item.path

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
                            <span className="truncate">{item.title}</span>
                          </div>
                          <ChevronRight className="w-3.5 h-3.5 opacity-40 flex-shrink-0" />
                        </Link>
                      )
                    })}
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
              </div>
            </div>

            <div className="pt-6 border-t border-[rgba(244,247,250,0.1)] flex flex-col gap-3">
              <Link
                to="/diagnostico"
                className="w-full text-center py-3 rounded-lg text-sm font-semibold bg-[#12B886] text-[#0A0E12] hover:bg-[#0CA678] shadow-emerald-glow"
              >
                Iniciar Diagnóstico
              </Link>
              {isAuthenticated ? (
                <div className="flex flex-col gap-2">
                  <Link
                    to="/painel"
                    className="w-full text-center py-2.5 rounded-lg text-sm font-medium border border-[rgba(244,247,250,0.2)] text-[#F4F7FA] hover:border-[#12B886]"
                  >
                    Meu Painel ({user?.name || user?.email})
                  </Link>
                  <button
                    onClick={logout}
                    className="w-full text-center py-2 rounded-lg text-xs font-medium text-[#F03E54] hover:bg-[#F03E54]/10"
                  >
                    Desconectar Sessão
                  </button>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="w-full text-center py-2.5 rounded-lg text-sm font-medium border border-[rgba(244,247,250,0.25)] text-[#F4F7FA]"
                >
                  Entrar na Conta
                </Link>
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

      {/* 5. Institutional Footer */}
      <footer className="bg-[#070A0D] border-t border-[rgba(244,247,250,0.12)] pt-14 pb-8">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-[rgba(244,247,250,0.08)]">
            {/* Col 1 & 2: Brand Info */}
            <div className="lg:col-span-2 flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <OrbisGlobe size={40} />
                <div className="flex flex-col">
                  <span className="font-heading font-black text-xl tracking-wider text-[#F4F7FA]">
                    ORBIS PROTOCOL
                  </span>
                  <span className="text-[10px] tracking-[0.15em] uppercase text-[#93A3B5] font-semibold -mt-0.5">
                    Infraestrutura dMRV & Rastreabilidade
                  </span>
                </div>
              </div>
              <p className="text-sm text-[#93A3B5] leading-relaxed max-w-md">
                Infraestrutura tecnológica de dados e auditoria probatória (dMRV) para
                descarbonização, rastreabilidade fiscal e emissão de selos de sustentabilidade
                reconhecidos pelo sistema financeiro e grandes compradores.
              </p>
              <div className="flex items-center gap-3 text-xs text-[#D9B36C]">
                <ShieldCheck className="w-4 h-4 text-[#D9B36C]" />
                <span>MGM CONSULTORIA EMPRESARIAL LTDA • CNPJ 19.598.964/0001-01</span>
              </div>
            </div>

            {/* Col 3: Trilhas & Regulatório */}
            <div className="flex flex-col gap-3">
              <span className="font-heading text-xs text-[#F4F7FA] font-bold tracking-wider">
                TRILHAS SETORIAIS
              </span>
              <ul className="flex flex-col gap-2 text-sm text-[#93A3B5]">
                <li>
                  <Link to="/radar-regulatorio" className="hover:text-[#F4F7FA] transition-colors">
                    Radar Regulatório
                  </Link>
                </li>
                <li>
                  <Link
                    to="/credenciamento"
                    className="text-[#12B886] hover:underline transition-colors flex items-center gap-1"
                  >
                    <span>Credenciamento de Perito</span>
                    <span className="text-[10px] bg-[#12B886]/10 px-1 rounded font-mono">ART</span>
                  </Link>
                </li>{' '}
                <li>
                  <Link
                    to="/trilhas/sbce-financas-verdes"
                    className="hover:text-[#12B886] transition-colors"
                  >
                    Mercado SBCE & Finanças Verdes
                  </Link>
                </li>
                <li>
                  <Link
                    to="/trilhas/peritos-tecnicos"
                    className="hover:text-[#12B886] transition-colors"
                  >
                    Peritos Técnicos & Auditores
                  </Link>
                </li>
                <li>
                  <Link to="/trilhas" className="text-[#12B886] hover:underline text-xs">
                    Todas as Trilhas →
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 4: Soluções & Portais */}
            <div className="flex flex-col gap-3">
              <span className="font-heading text-xs text-[#F4F7FA] font-bold tracking-wider">
                HUB DE SOLUÇÕES
              </span>
              <ul className="flex flex-col gap-2 text-sm text-[#93A3B5]">
                <li>
                  <Link
                    to="/planos"
                    className="text-[#93A3B5] hover:text-[#F4F7FA] transition-colors"
                  >
                    Planos & Preços
                  </Link>
                </li>
                <li>
                  <Link
                    to="/checkout"
                    className="text-[#12B886] hover:text-[#12B886]/80 font-semibold transition-colors flex items-center gap-1"
                  >
                    Checkout PIX & NFS-e
                  </Link>
                </li>
                <li>
                  <Link
                    to="/bureau"
                    className="text-[#D9B36C] hover:text-[#D9B36C]/80 font-semibold transition-colors"
                  >
                    Cockpit Bureau ACP (Passaporte)
                  </Link>
                </li>
                <li>
                  <Link
                    to="/solucoes/portal-corporativo"
                    className="hover:text-[#12B886] transition-colors"
                  >
                    Portal Corporativo (IFRS/SPED)
                  </Link>
                </li>
                <li>
                  <Link
                    to="/solucoes/case-cdverde"
                    className="hover:text-[#12B886] transition-colors"
                  >
                    Case CDVerde (Desmontagem VFV)
                  </Link>
                </li>
                <li>
                  <Link
                    to="/solucoes/cadeias-produtivas"
                    className="hover:text-[#12B886] transition-colors"
                  >
                    Catálogo 15 Cadeias Produtivas
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 5: Acesso Rápido */}
            <div className="flex flex-col gap-3">
              <span className="font-heading text-xs text-[#F4F7FA] font-bold tracking-wider">
                FERRAMENTAS
              </span>
              <ul className="flex flex-col gap-2 text-sm text-[#93A3B5]">
                <li>
                  <Link
                    to="/radar-regulatorio"
                    className="hover:text-[#12B886] transition-colors text-[#12B886] font-semibold flex items-center gap-1.5"
                  >
                    Radar Regulatório 2026
                    <span className="px-1.5 py-0.2 rounded bg-[#12B886]/20 text-[10px]">Novo</span>
                  </Link>
                </li>
                <li>
                  <Link to="/diagnostico" className="hover:text-[#12B886] transition-colors">
                    Diagnóstico por CNPJ
                  </Link>
                </li>
                <li>
                  <Link to="/verificador" className="hover:text-[#12B886] transition-colors">
                    Verificador Público de Selos
                  </Link>
                </li>
                <li>
                  <Link
                    to="/capital"
                    className="hover:text-[#12B886] transition-colors text-[#12B886] font-semibold"
                  >
                    Green Capital Engine (8 Linhas)
                  </Link>
                </li>
                <li>
                  <Link to="/financeiro" className="hover:text-[#12B886] transition-colors">
                    Módulo Financeiro (Protegido)
                  </Link>
                </li>
                {isAdminOrPerito && (
                  <li>
                    <Link
                      to="/console-do-auditor"
                      className="hover:text-[#12B886] transition-colors flex items-center gap-1.5"
                    >
                      Console do Auditor
                      <Lock className="w-3 h-3 text-[#D9B36C]" />
                    </Link>
                  </li>
                )}
                <li>
                  <Link to="/teste" className="text-xs text-[#93A3B5]/60 hover:text-[#93A3B5]">
                    Catálogo de Teste
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#93A3B5]">
            <p>
              © {new Date().getFullYear()} Orbis Protocol • Auditoria & Rastreabilidade dMRV. Todos
              os direitos reservados.
            </p>
            <div className="flex items-center gap-6">
              <Link
                to="/titular-dados"
                className="text-[11px] text-[#12B886] hover:underline font-semibold"
              >
                Canal do Titular LGPD (Art. 18)
              </Link>
              <Link
                to="/privacidade"
                className="text-[11px] text-[#93A3B5]/80 hover:text-[#12B886] underline"
              >
                Política de Privacidade
              </Link>
              <span className="text-[#12B886] font-semibold">Selo Oficial Registrado</span>
            </div>{' '}
          </div>
        </div>
      </footer>
    </div>
  )
}
