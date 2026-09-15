import React, { useState, useEffect } from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import { OrbisGlobe } from './OrbisGlobe'
import { useAuth } from '@/contexts/AuthContext'
import {
  Menu,
  X,
  ShieldCheck,
  ChevronRight,
  LogOut,
  User,
  LayoutDashboard,
  FileCheck2,
  Lock,
} from 'lucide-react'

export default function Layout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const location = useLocation()
  const { isAuthenticated, user, logout, isAdminOrPerito } = useAuth()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [location.pathname])

  const navLinks = [
    { label: 'Início', path: '/' },
    { label: 'O Protocolo', path: '/#o-que-e' },
    { label: 'Trilhas', path: '/trilhas' },
    { label: 'Soluções', path: '/solucoes' },
    { label: 'Planos', path: '/planos' },
    { label: 'Verificador de Selos', path: '/verificador' },
    ...(isAuthenticated ? [{ label: 'Financeiro', path: '/financeiro' }] : []),
  ]

  const regulations = [
    'LEI 15.042/2024 (DIRETRIZES SBCE)',
    'PROGRAMA MOVER LEI 14.902/2024 (AUTOMOTIVO & CDV)',
    'REPORTE VOLUNTÁRIO IFRS S1/S2 (RES. CVM 193)',
    'PREPARAÇÃO ESG CREDORES (RES. BCB 4.945/2021)',
    'NBR ISO 14064',
    'NBC TO 3000 & ART TÉCNICA',
    'REFORMA TRIBUTÁRIA NOVO IVA',
  ]

  return (
    <div className="flex flex-col min-h-screen bg-[#0A0E12] text-[#F4F7FA] selection:bg-[#12B886]/30 selection:text-white">
      {/* 1. Regulatory Marquee Top Bar */}
      <div className="w-full bg-[#070A0D] border-b border-[rgba(244,247,250,0.08)] py-2 text-xs overflow-hidden z-50">
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
        className={`sticky top-0 z-40 transition-all duration-300 ${
          isScrolled
            ? 'bg-[#0A0E12]/90 backdrop-blur-md border-b border-[rgba(244,247,250,0.12)] shadow-xl'
            : 'bg-[#0A0E12]/60 backdrop-blur-sm border-b border-transparent'
        }`}
      >
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 flex items-center justify-between h-20">
          {/* Brand Logo & Name */}
          <Link to="/" className="flex items-center gap-3.5 group">
            <OrbisGlobe size={40} />
            <div className="flex flex-col">
              <span className="font-heading font-black text-xl tracking-[0.08em] text-[#F4F7FA] group-hover:text-[#12B886] transition-colors">
                ORBIS<span className="text-[#12B886]">.</span>PROTOCOL
              </span>
              <span className="text-[10px] tracking-[0.2em] uppercase text-[#93A3B5] font-semibold -mt-1">
                Auditoria & Rastreabilidade
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-7">
            {navLinks.map((item) => (
              <Link
                key={item.label}
                to={item.path}
                className={`text-sm tracking-wide font-medium transition-colors hover:text-[#12B886] ${
                  location.pathname === item.path
                    ? 'text-[#12B886] font-semibold'
                    : 'text-[#93A3B5]'
                }`}
              >
                {item.label}
              </Link>
            ))}
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

      {/* 3. Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer Content */}
          <div className="relative w-full max-w-xs bg-[#111820] border-l border-[rgba(244,247,250,0.12)] h-full p-6 flex flex-col justify-between shadow-2xl z-10 animate-slide-left">
            <div>
              <div className="flex items-center justify-between pb-6 border-b border-[rgba(244,247,250,0.1)]">
                <div className="flex items-center gap-3">
                  <OrbisGlobe size={32} />
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

              <div className="mt-6 flex flex-col gap-3">
                {navLinks.map((item) => (
                  <Link
                    key={item.label}
                    to={item.path}
                    className={`flex items-center justify-between py-2.5 px-3 rounded-lg text-base font-medium transition-colors ${
                      location.pathname === item.path
                        ? 'bg-[#12B886]/10 text-[#12B886]'
                        : 'text-[#93A3B5] hover:text-[#F4F7FA] hover:bg-[#16202B]'
                    }`}
                  >
                    <span>{item.label}</span>
                    <ChevronRight className="w-4 h-4 opacity-50" />
                  </Link>
                ))}

                {isAdminOrPerito && (
                  <Link
                    to="/console-do-auditor"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between py-2.5 px-3 rounded-lg text-base font-medium text-[#D9B36C] hover:bg-[#16202B] transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <FileCheck2 className="w-4 h-4" />
                      Console do Auditor
                    </span>
                    <Lock className="w-3.5 h-3.5" />
                  </Link>
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
      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>

      {/* 5. Institutional Footer */}
      <footer className="bg-[#070A0D] border-t border-[rgba(244,247,250,0.12)] pt-14 pb-8">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-[rgba(244,247,250,0.08)]">
            {/* Col 1 & 2: Brand Info */}
            <div className="lg:col-span-2 flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <OrbisGlobe size={36} />
                <span className="font-heading font-black text-xl tracking-wider text-[#F4F7FA]">
                  ORBIS PROTOCOL
                </span>
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
                  <Link to="/trilhas/mover" className="hover:text-[#12B886] transition-colors">
                    Mobilidade Verde (MOVER)
                  </Link>
                </li>
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
                  </Link>{' '}
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
                to="/privacidade"
                className="text-[11px] text-[#93A3B5]/80 hover:text-[#12B886] underline"
              >
                Política de Privacidade LGPD
              </Link>
              <span className="text-[#12B886] font-semibold">Selo Oficial Registrado</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
