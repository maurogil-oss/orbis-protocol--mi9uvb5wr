import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { AdminTab, AdminGroupId, getVisibleGroups } from '@/data/adminNavConfig'
import {
  ShieldCheck,
  ChevronRight,
  Menu,
  X,
  ExternalLink,
  Lock,
  Layers,
  Sparkles,
  FileText,
  TrendingUp,
} from 'lucide-react'

interface AdminSidebarNavProps {
  activeTab: AdminTab
  activeGroup: AdminGroupId
  isMaster: boolean
  onSelectTab: (tab: AdminTab, group: AdminGroupId) => void
  onSelectGroup: (group: AdminGroupId) => void
  userEmail?: string
  userRole?: string
}

/**
 * Sidebar Escura Exclusiva do Console Administrativo
 * - Tema navy institucional canônico (#0A1628 / #0E1A2E / #111827)
 * - Diferencia o ambiente operacional interno do layout público
 * - Agrupamento hierárquico nos 4 blocos funcionais
 * - Sinaliza restrição exclusiva de Governança para Gestor Master
 * - Modo recolhível / gaveta mobile com alvos >= 44px
 */
export function AdminSidebarNav({
  activeTab,
  activeGroup,
  isMaster,
  onSelectTab,
  onSelectGroup,
  userEmail,
  userRole,
}: AdminSidebarNavProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const visibleGroups = getVisibleGroups(isMaster)

  const handleTabClick = (tabId: AdminTab, groupId: AdminGroupId) => {
    onSelectTab(tabId, groupId)
    setMobileOpen(false)
  }

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#0A1628] text-slate-100 border-r border-slate-800/80 shadow-2xl w-72">
      {/* CABEÇALHO DA SIDEBAR */}
      <div className="p-5 border-b border-slate-800/80 bg-[#0E1A2E]/70 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-heading font-black text-sm tracking-wider uppercase text-white">
              Console Orbis
            </span>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-bold uppercase border border-blue-500/30">
            {isMaster ? 'Master' : 'Admin'}
          </span>
        </div>
        <p className="text-[11px] text-slate-400 leading-tight">
          Ambiente interno • Navegação estruturada em 4 áreas
        </p>
      </div>

      {/* LISTA HIERÁRQUICA DE GRUPOS E ABAS */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 custom-scrollbar">
        {visibleGroups.map((group) => {
          const GroupIcon = group.icon
          const isGroupActive = activeGroup === group.id

          return (
            <div key={group.id} className="space-y-1.5">
              <button
                type="button"
                onClick={() => onSelectGroup(group.id)}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${
                  isGroupActive
                    ? 'text-blue-400 bg-blue-950/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
                }`}
              >
                <span className="flex items-center gap-2">
                  <GroupIcon className="w-3.5 h-3.5" />
                  <span>{group.label}</span>
                </span>
                <span className="text-[10px] font-mono opacity-60">{group.tabs.length}</span>
              </button>

              <div className="space-y-1 pl-2 border-l border-slate-800">
                {group.tabs.map((tab) => {
                  const TabIcon = tab.icon
                  const isTabActive = activeTab === tab.id
                  const isSandbox = tab.id === 'sandbox'

                  return (
                    <button
                      key={tab.id}
                      type="button"
                      data-testid={`admin-sidebar-tab-${tab.id}`}
                      onClick={() => handleTabClick(tab.id, group.id)}
                      className={`w-full text-left flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium transition-all ${
                        isTabActive
                          ? 'bg-[#12B886] text-[#0A0E12] font-bold shadow-md shadow-emerald-950'
                          : isSandbox
                            ? 'text-emerald-400 hover:bg-emerald-950/30 border border-emerald-900/40'
                            : 'text-slate-300 hover:text-white hover:bg-[#111827]'
                      }`}
                      title={tab.description}
                    >
                      <span className="flex items-center gap-2 truncate">
                        <TabIcon className="w-4 h-4 shrink-0" />
                        <span className="truncate">{tab.label}</span>
                      </span>

                      {tab.isMasterOnly && !isTabActive && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0">
                          Master
                        </span>
                      )}

                      {isSandbox && !isTabActive && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded font-mono font-bold bg-emerald-500/20 text-emerald-300 shrink-0">
                          Novo
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}

        {/* ALERTA VISUAL CASO ADMIN COMUM ESTEJA OPERANDO */}
        {!isMaster && (
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] text-slate-400 space-y-1">
            <div className="flex items-center gap-1.5 text-amber-400 font-semibold text-xs">
              <Lock className="w-3.5 h-3.5" />
              <span>Governança Restrita</span>
            </div>
            <p>
              Validação de contas Gestão pendentes e alteração de papéis são exclusivas do Gestor
              Master.
            </p>
          </div>
        )}
      </div>

      {/* RODAPÉ DA SIDEBAR COM CONTEXTO DA SESSÃO */}
      <div className="p-4 border-t border-slate-800/80 bg-[#0E1A2E]/70 space-y-3">
        <div className="text-[11px] space-y-0.5">
          <span className="text-slate-400 block truncate">Operador:</span>
          <strong className="text-white block font-mono truncate">
            {userEmail || 'admin@orbis-protocol.com'}
          </strong>
        </div>

        <div className="flex items-center gap-2 pt-1 border-t border-slate-800">
          <Link
            to="/painel-resultados"
            className="flex-1 py-1.5 px-2 rounded-lg bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-300 border border-emerald-800/40 text-[11px] font-semibold text-center transition-colors flex items-center justify-center gap-1"
            title="Painel Executivo de Resultados"
          >
            <span>Resultados</span>
            <TrendingUp className="w-3 h-3 text-emerald-400" />
          </Link>
          <Link
            to="/painel"
            className="flex-1 py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium text-center transition-colors flex items-center justify-center gap-1"
          >
            <span>Meu Portal</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
          <Link
            to="/"
            className="py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
            title="Ir para o início"
          >
            Home
          </Link>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* DESKTOP SIDEBAR FIXA */}
      <aside
        data-testid="admin-console-sidebar"
        aria-label="Navegação Lateral do Console"
        className="hidden lg:block shrink-0 sticky top-4 h-[calc(100vh-2rem)] rounded-2xl overflow-hidden shadow-2xl border border-slate-800 mr-6"
      >
        {sidebarContent}
      </aside>

      {/* BOTÃO MOBILE PARA ABRIR SIDEBAR EM GAVETA */}
      <div className="lg:hidden mb-4 flex items-center justify-between p-3 rounded-xl bg-[#0A1628] border border-slate-800 text-white shadow-md">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span className="font-heading font-black text-xs uppercase tracking-wider">
            Console • {activeGroup.toUpperCase()}
          </span>
        </div>
        <button
          type="button"
          data-testid="admin-sidebar-mobile-toggle"
          onClick={() => setMobileOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors"
        >
          <Menu className="w-4 h-4 text-emerald-400" />
          <span>Menu do Console</span>
        </button>
      </div>

      {/* DRAWER MOBILE DA SIDEBAR */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex bg-black/80 backdrop-blur-sm lg:hidden animate-fade-in">
          <div className="relative w-72 max-w-[85vw] h-full">
            {sidebarContent}
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-[-44px] p-2 rounded-full bg-slate-800 text-white hover:bg-slate-700"
              aria-label="Fechar sidebar do console"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1" onClick={() => setMobileOpen(false)} />
        </div>
      )}
    </>
  )
}
