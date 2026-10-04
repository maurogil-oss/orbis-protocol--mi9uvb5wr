import React, { useState } from 'react'
import { ChevronDown, Menu, X, Sparkles, Check } from 'lucide-react'
import {
  AdminTab,
  AdminGroupId,
  AdminGroupDefinition,
  getVisibleGroups,
} from '@/data/adminNavConfig'

interface AdminGroupNavProps {
  activeTab: AdminTab
  activeGroup: AdminGroupId
  isMaster: boolean
  onSelectTab: (tab: AdminTab, group: AdminGroupId) => void
  onSelectGroup: (group: AdminGroupId) => void
  tabsScrollRef: React.RefObject<HTMLDivElement | null>
  canScrollLeft: boolean
  canScrollRight: boolean
  scrollTabs: (direction: 'left' | 'right') => void
  checkTabsScroll: () => void
}

/**
 * Componente de Navegação do Console Administrativo
 * - Organizado em 4 grupos funcionais: Financeiro, Operacional, dMRV & Prova, Governança
 * - Nível 1: Seleção de grupo (Tabs superiores / Accordion mobile / Drawer)
 * - Nível 2: Abas daquele grupo ativo com rolagem horizontal suave, indicador do grupo ativo e badges
 * - Suporta abertura/expansão de accordion por grupo no desktop e gaveta (drawer) no mobile
 * - Preserva todos os `data-testid` existentes (`admin-tab-${aba.id}`, `admin-tabs-scroll-left`, etc.)
 * - Garante visibilidade condicional rigorosa por papel (itens restritos a master nunca vazam)
 */
export function AdminGroupNav({
  activeTab,
  activeGroup,
  isMaster,
  onSelectTab,
  onSelectGroup,
  tabsScrollRef,
  canScrollLeft,
  canScrollRight,
  scrollTabs,
  checkTabsScroll,
}: AdminGroupNavProps) {
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)
  const [accordionOpen, setAccordionOpen] = useState(false)

  const visibleGroups = getVisibleGroups(isMaster)
  const currentGroup = visibleGroups.find((g) => g.id === activeGroup) || visibleGroups[0]

  const handleTabClick = (tabId: AdminTab, groupId: AdminGroupId) => {
    onSelectTab(tabId, groupId)
    setMobileDrawerOpen(false)
    const el = tabsScrollRef.current
    if (el) setTimeout(checkTabsScroll, 200)
  }

  return (
    <div
      data-testid="admin-tabs-nav-container"
      className="mb-8 space-y-4 pb-2 border-b border-slate-200 dark:border-[rgba(244,247,250,0.08)]"
    >
      {/* ========================================================= */}
      {/* DESKTOP & TABLET: NAVEGAÇÃO DE 1º NÍVEL (GRUPOS POR ÁREA) */}
      {/* ========================================================= */}
      <div className="hidden md:flex items-center justify-between gap-3">
        {/* Pílulas de Seleção de Grupo */}
        <div
          data-testid="admin-group-selector"
          className="flex items-center gap-2 p-1.5 rounded-2xl bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-slate-800 shadow-sm"
        >
          {visibleGroups.map((group) => {
            const GroupIcon = group.icon
            const isGroupActive = activeGroup === group.id
            const count = group.tabs.length

            return (
              <button
                key={group.id}
                type="button"
                data-testid={`admin-group-btn-${group.id}`}
                onClick={() => onSelectGroup(group.id)}
                className={`relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                  isGroupActive
                    ? 'bg-[#2563EB] text-white shadow-md shadow-blue-600/20'
                    : 'text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-[#F8FAFC] hover:bg-slate-100 dark:hover:bg-[#16202B]'
                }`}
                title={group.description}
              >
                <GroupIcon
                  className={`w-4 h-4 ${isGroupActive ? 'text-white' : 'text-slate-500 dark:text-[#94A3B8]'}`}
                />
                <span>{group.label}</span>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold ${
                    isGroupActive
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-100 dark:bg-[#111827] text-slate-500 dark:text-[#94A3B8]'
                  }`}
                >
                  {count}
                </span>
                {/* Indicador se o activeTab está dentro deste grupo */}
                {group.tabs.some((t) => t.id === activeTab) && !isGroupActive && (
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"
                    title="Aba ativa pertence a este grupo"
                  />
                )}
              </button>
            )
          })}
        </div>

        {/* Botão de alternância para Visão Geral / Accordion de Todos os Grupos */}
        <button
          type="button"
          data-testid="admin-group-accordion-toggle"
          onClick={() => setAccordionOpen((prev) => !prev)}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-[#F8FAFC] bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-slate-800 shadow-sm transition-colors"
          title="Ver mapa completo das 4 áreas"
        >
          <span>Mapa de Áreas</span>
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform duration-200 ${
              accordionOpen ? 'rotate-180 text-emerald-500' : ''
            }`}
          />
        </button>
      </div>

      {/* ========================================================= */}
      {/* MOBILE: BARRA COMPACTA COM BOTÃO DRAWER + SELETOR DE ÁREA */}
      {/* ========================================================= */}
      <div className="md:hidden flex items-center justify-between gap-2 p-2 rounded-xl bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-2">
          {(() => {
            const GroupIcon = currentGroup.icon
            return (
              <div className="w-8 h-8 rounded-lg bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                <GroupIcon className="w-4 h-4" />
              </div>
            )
          })()}
          <div>
            <span className="text-[10px] text-slate-500 dark:text-[#94A3B8] uppercase block tracking-wider font-semibold">
              Área do Console
            </span>
            <span className="text-xs font-bold text-slate-900 dark:text-[#F8FAFC]">
              {currentGroup.label}
            </span>
          </div>
        </div>

        <button
          type="button"
          data-testid="admin-mobile-drawer-toggle"
          onClick={() => setMobileDrawerOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-[#111827] text-slate-700 dark:text-[#F8FAFC] text-xs font-semibold border border-slate-300 dark:border-slate-700"
        >
          <Menu className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Trocar Área / Aba</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* MAPA EXPANDIDO (ACCORDION) EM DESKTOP SE ATIVADO           */}
      {/* ========================================================= */}
      {accordionOpen && (
        <div
          data-testid="admin-accordion-overview"
          className="hidden md:grid grid-cols-4 gap-3 p-4 rounded-2xl bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-slate-800 shadow-lg animate-fade-in"
        >
          {visibleGroups.map((group) => {
            const GroupIcon = group.icon
            const isCurrent = activeGroup === group.id

            return (
              <div
                key={group.id}
                className={`p-3 rounded-xl border transition-all ${
                  isCurrent
                    ? 'border-blue-500/50 bg-blue-500/5 dark:bg-blue-500/10'
                    : 'border-slate-200 dark:border-slate-800/80 bg-slate-50/50 dark:bg-[#111820]/60'
                }`}
              >
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <GroupIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <strong className="text-xs font-bold text-slate-900 dark:text-[#F8FAFC]">
                      {group.label}
                    </strong>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 dark:text-[#94A3B8]">
                    {group.tabs.length} abas
                  </span>
                </div>
                <div className="space-y-1">
                  {group.tabs.map((tab) => {
                    const TabIcon = tab.icon
                    const isTabActive = activeTab === tab.id

                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => {
                          handleTabClick(tab.id, group.id)
                          setAccordionOpen(false)
                        }}
                        className={`w-full text-left flex items-center justify-between px-2 py-1.5 rounded-lg text-[11px] transition-colors ${
                          isTabActive
                            ? 'bg-[#12B886] text-[#0A0E12] font-bold shadow-xs'
                            : 'text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-[#F8FAFC] hover:bg-slate-200/60 dark:hover:bg-[#16202B]'
                        }`}
                      >
                        <span className="flex items-center gap-1.5 truncate">
                          <TabIcon className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{tab.label}</span>
                        </span>
                        {isTabActive && <Check className="w-3 h-3 text-[#0A0E12] shrink-0" />}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ========================================================= */}
      {/* NÍVEL 2: BARRA DE ABAS DO GRUPO SELECIONADO               */}
      {/* ========================================================= */}
      <div className="relative">
        {/* Seta esquerda */}
        <button
          type="button"
          data-testid="admin-tabs-scroll-left"
          onClick={() => scrollTabs('left')}
          aria-label="Rolar abas para a esquerda"
          disabled={!canScrollLeft}
          className={`absolute left-0 top-1/2 -translate-y-[calc(50%+3px)] z-20 w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-md ${
            canScrollLeft
              ? 'opacity-100 bg-white/95 dark:bg-[#0E1A2E]/95 text-slate-700 dark:text-[#F4F7FA] border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-[#16202B] hover:text-emerald-600 dark:hover:text-[#12B886] hover:scale-105'
              : 'opacity-0 pointer-events-none'
          }`}
        >
          <span className="sr-only">Rolar para a esquerda</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>

        {/* Gradiente sutil indicador à esquerda */}
        {canScrollLeft && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-0 top-0 bottom-0 w-12 z-10 bg-gradient-to-r from-slate-50 dark:from-[#0A1628] to-transparent"
          />
        )}

        {/* Faixa de rolagem das abas (mantém id e data-testid exatos) */}
        <div
          ref={tabsScrollRef}
          data-testid="admin-tabs-scroll-container"
          className="flex items-center gap-2 overflow-x-auto scroll-smooth no-scrollbar px-1 py-1"
        >
          {/* Indicador visual da área ativa na própria faixa */}
          <div
            data-testid="admin-active-group-badge"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider bg-slate-200/80 dark:bg-[#111827] text-slate-700 dark:text-[#94A3B8] border border-slate-300 dark:border-slate-800 shrink-0"
            title={`Área ativa: ${currentGroup.label}`}
          >
            {(() => {
              const GIcon = currentGroup.icon
              return <GIcon className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            })()}
            <span>{currentGroup.label}</span>
          </div>

          {currentGroup.tabs.map((aba) => {
            const Icon = aba.icon
            const active = activeTab === aba.id
            const isSandbox = aba.id === 'sandbox'

            return (
              <button
                key={aba.id}
                data-testid={`admin-tab-${aba.id}`}
                onClick={() => handleTabClick(aba.id, currentGroup.id)}
                className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shrink-0 ${
                  active
                    ? 'bg-[#12B886] text-[#0A0E12] shadow-emerald-glow'
                    : isSandbox
                      ? 'bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-400/50 dark:border-emerald-500/40 hover:bg-emerald-500/20 dark:hover:bg-emerald-500/25 shadow-sm'
                      : 'bg-white dark:bg-[#111820] text-slate-600 dark:text-[#93A3B5] hover:text-slate-900 dark:hover:text-[#F4F7FA] hover:bg-slate-100 dark:hover:bg-[#16202B] border border-slate-200 dark:border-[rgba(244,247,250,0.06)] shadow-sm'
                }`}
                title={aba.description}
              >
                <Icon
                  className={`w-4 h-4 ${
                    isSandbox && !active
                      ? 'text-emerald-600 dark:text-emerald-400 animate-pulse'
                      : ''
                  }`}
                />
                <span>{aba.label}</span>

                {/* Badge de destaque na Sandbox quando inativa */}
                {isSandbox && !active && (
                  <span
                    data-testid="sandbox-tab-badge"
                    className="ml-1 inline-flex items-center px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider bg-emerald-600/20 text-emerald-800 dark:text-emerald-200 border border-emerald-500/30"
                  >
                    Novo
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Gradiente sutil indicador à direita */}
        {canScrollRight && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute right-0 top-0 bottom-0 w-12 z-10 bg-gradient-to-l from-slate-50 dark:from-[#0A1628] to-transparent"
          />
        )}

        {/* Seta direita */}
        <button
          type="button"
          data-testid="admin-tabs-scroll-right"
          onClick={() => scrollTabs('right')}
          aria-label="Rolar abas para a direita"
          disabled={!canScrollRight}
          className={`absolute right-0 top-1/2 -translate-y-[calc(50%+3px)] z-20 w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-md ${
            canScrollRight
              ? 'opacity-100 bg-white/95 dark:bg-[#0E1A2E]/95 text-slate-700 dark:text-[#F4F7FA] border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-[#16202B] hover:text-emerald-600 dark:hover:text-[#12B886] hover:scale-105'
              : 'opacity-0 pointer-events-none'
          }`}
        >
          <span className="sr-only">Rolar para a direita</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* ========================================================= */}
      {/* DRAWER MOBILE: AGRUPAMENTO POR ÁREA (MODAL LATERAL/BOTTOM) */}
      {/* ========================================================= */}
      {mobileDrawerOpen && (
        <div
          data-testid="admin-mobile-drawer"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
        >
          <div
            data-testid="admin-mobile-drawer-content"
            className="w-full max-w-lg rounded-t-3xl sm:rounded-2xl bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-slate-800 p-5 space-y-4 max-h-[85vh] flex flex-col shadow-2xl"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="font-heading font-black text-base text-slate-900 dark:text-[#F8FAFC]">
                  Navegação do Console
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-[#94A3B8]">
                  Selecione a área e a aba desejada
                </p>
              </div>
              <button
                type="button"
                data-testid="admin-mobile-drawer-close"
                onClick={() => setMobileDrawerOpen(false)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-[#F8FAFC] hover:bg-slate-100 dark:hover:bg-[#16202B]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Lista dos 4 Grupos com Suas Abas */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {visibleGroups.map((group) => {
                const GroupIcon = group.icon
                const isGroupSelected = activeGroup === group.id

                return (
                  <div
                    key={group.id}
                    data-testid={`admin-drawer-group-${group.id}`}
                    className={`rounded-2xl border p-3 transition-all ${
                      isGroupSelected
                        ? 'border-blue-500/40 bg-blue-500/5 dark:bg-blue-500/10'
                        : 'border-slate-200 dark:border-slate-800/80 bg-slate-50/50 dark:bg-[#111820]/50'
                    }`}
                  >
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        <GroupIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <span className="text-xs font-bold text-slate-900 dark:text-[#F8FAFC]">
                          {group.label}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-500 dark:text-[#94A3B8]">
                        {group.tabs.length} abas
                      </span>
                    </div>

                    <div className="grid grid-cols-1 gap-1.5">
                      {group.tabs.map((tab) => {
                        const TabIcon = tab.icon
                        const isTabActive = activeTab === tab.id
                        const isSandbox = tab.id === 'sandbox'

                        return (
                          <button
                            key={tab.id}
                            type="button"
                            data-testid={`admin-drawer-tab-${tab.id}`}
                            onClick={() => handleTabClick(tab.id, group.id)}
                            className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-left transition-all ${
                              isTabActive
                                ? 'bg-[#12B886] text-[#0A0E12] shadow-sm'
                                : 'text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-[#F8FAFC] hover:bg-slate-200/60 dark:hover:bg-[#16202B]'
                            }`}
                          >
                            <span className="flex items-center gap-2 truncate">
                              <TabIcon className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate">{tab.label}</span>
                            </span>

                            <div className="flex items-center gap-1.5 shrink-0">
                              {isSandbox && !isTabActive && (
                                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold uppercase bg-emerald-600/20 text-emerald-800 dark:text-emerald-200 border border-emerald-500/30">
                                  Novo
                                </span>
                              )}
                              {isTabActive && <Check className="w-4 h-4 text-[#0A0E12]" />}
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
