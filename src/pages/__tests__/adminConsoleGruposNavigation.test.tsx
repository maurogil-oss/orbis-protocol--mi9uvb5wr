import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import AdminConsolePage from '@/pages/AdminConsolePage'
import {
  ADMIN_NAV_GROUPS,
  TAB_DEEP_LINK_ALIASES,
  getGroupByTab,
  getVisibleGroups,
  resolveInitialTab,
} from '@/data/adminNavConfig'

// Mock do hook useAuth
const mockAuthState = {
  user: {
    id: 'usr-master-1',
    email: 'maurogil@orbis-protocol.com',
    nome: 'Mauro Gil',
    role: 'master',
  },
  isAdmin: true,
  isMaster: true,
  isFinanceiroLeitor: false,
  requestPasswordReset: vi.fn(),
}

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockAuthState,
}))

// Mocks de dados assíncronos do AdminConsolePage para isolamento
vi.mock('@/services/adminConsoleService', () => ({
  buscarDadosAdmin: vi.fn().mockResolvedValue({
    cobrancas: [],
    clientes: [],
    peritos: [],
    transacoesSped: [],
    auditoriaLogs: [],
    resumoKpis: {
      receitaTotalLiquida: 0,
      cobrancasPendentes: 0,
      totalClientes: 0,
      peritosPendentes: 0,
      peritosAprovados: 0,
      consumoTotalSped: 0,
      custoTotalApis: 0,
      totalComissoesPendentes: 0,
    },
    assinaturas: [],
    produtosCatalogo: [],
    custosApis: [],
    comissoes: [],
  }),
  marcarCobrancaComoPaga: vi.fn(),
  emitirNfseAdmin: vi.fn(),
  aprovarRecusarContaGestaoMaster: vi.fn(),
  alterarPapelUsuarioMaster: vi.fn(),
  redefinirSenhaUsuarioMaster: vi.fn(),
}))

// Mocks de sub-abas pesadas
vi.mock('@/components/ConsoleRadarSemanalTab', () => ({
  ConsoleRadarSemanalTab: () => <div data-testid="tab-content-radar">Radar Semanal Content</div>,
}))
vi.mock('@/components/ConsoleHonorariosTab', () => ({
  ConsoleHonorariosTab: () => <div data-testid="tab-content-honorarios">Honorários Content</div>,
}))
vi.mock('@/components/ConsoleSandboxIngestaoTab', () => ({
  ConsoleSandboxIngestaoTab: () => <div data-testid="tab-content-sandbox">Sandbox Content</div>,
}))
vi.mock('@/components/ConsoleAuditoriaIntegridadeTab', () => ({
  ConsoleAuditoriaIntegridadeTab: () => (
    <div data-testid="tab-content-auditoria-integridade">Auditoria Integridade Content</div>
  ),
}))
vi.mock('@/components/ConsoleHistoricoConsultasTab', () => ({
  ConsoleHistoricoConsultasTab: () => (
    <div data-testid="tab-content-historico">Histórico Content</div>
  ),
}))
vi.mock('@/components/ConsoleReativacaoTab', () => ({
  ConsoleReativacaoTab: () => <div data-testid="tab-content-reativacao">Reativação Content</div>,
}))
vi.mock('@/components/ConsoleGovernancaMasterTab', () => ({
  ConsoleGovernancaMasterTab: () => (
    <div data-testid="tab-content-governanca">Governança Master Content</div>
  ),
}))
vi.mock('@/components/ConsoleParametrosNegocioTab', () => ({
  ConsoleParametrosNegocioTab: () => (
    <div data-testid="tab-content-parametros">Parâmetros de Negócio Content</div>
  ),
}))
vi.mock('@/components/PainelDmrvEmissoesEvitadas', () => ({
  PainelDmrvEmissoesEvitadas: () => <div data-testid="tab-content-dmrv">dMRV Content</div>,
}))
vi.mock('@/components/GerenciadorLastrosTab', () => ({
  GerenciadorLastrosTab: () => <div data-testid="tab-content-lastro">Lastro Content</div>,
}))
vi.mock('@/components/CcrlrSinirInteroperabilidadeTab', () => ({
  CcrlrSinirInteroperabilidadeTab: () => <div data-testid="tab-content-ccrlr">CCRLR Content</div>,
}))

describe('Console Administrativo — Regressão de Grupos, Deep Links e Visibilidade', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuthState.isMaster = true
    mockAuthState.isAdmin = true
    mockAuthState.user.role = 'master'
  })

  describe('1. Mapeamento Estrutural de Grupos e Abas', () => {
    it('possui exatamente os 4 grupos requeridos pelo usuário', () => {
      const groupLabels = ADMIN_NAV_GROUPS.map((g) => g.label)
      expect(groupLabels).toEqual(['Financeiro', 'Operacional', 'dMRV & Prova', 'Governança'])
    })

    it('distribui as abas conforme especificado nos requisitos', () => {
      const financeiro = ADMIN_NAV_GROUPS.find((g) => g.id === 'financeiro')!
      const operacional = ADMIN_NAV_GROUPS.find((g) => g.id === 'operacional')!
      const dmrv = ADMIN_NAV_GROUPS.find((g) => g.id === 'dmrv_prova')!
      const governanca = ADMIN_NAV_GROUPS.find((g) => g.id === 'governanca')!

      // Financeiro
      const finTabIds = financeiro.tabs.map((t) => t.id)
      expect(finTabIds).toContain('receita')
      expect(finTabIds).toContain('assinaturas')
      expect(finTabIds).toContain('produtos')
      expect(finTabIds).toContain('comissoes')
      expect(finTabIds).toContain('honorarios_peritos')
      expect(finTabIds).toContain('custos')
      expect(finTabIds).toContain('radar_semanal') // Posicionado coerentemente no Financeiro

      // Operacional
      const opTabIds = operacional.tabs.map((t) => t.id)
      expect(opTabIds).toContain('clientes')
      expect(opTabIds).toContain('reativacao') // Posicionado coerentemente no Operacional
      expect(opTabIds).toContain('uso')
      expect(opTabIds).toContain('peritos')
      expect(opTabIds).toContain('sandbox')
      expect(opTabIds).toContain('historico_consultas')
      expect(opTabIds).toContain('lastro_conformidade')
      expect(opTabIds).toContain('ccrlr_sinir')

      // dMRV & Prova
      const dmrvTabIds = dmrv.tabs.map((t) => t.id)
      expect(dmrvTabIds).toContain('dmrv_todas_empresas')
      expect(dmrvTabIds).toContain('auditoria_integridade')
      expect(dmrvTabIds).toContain('auditoria')

      // Governança
      const govTabIds = governanca.tabs.map((t) => t.id)
      expect(govTabIds).toContain('configuracoes')
      expect(govTabIds).toContain('governanca')
      expect(govTabIds).toContain('parametros_negocio')
    })

    it('NENHUM rótulo de aba possui prefixo numérico 1–16', () => {
      for (const group of ADMIN_NAV_GROUPS) {
        for (const tab of group.tabs) {
          expect(tab.label).not.toMatch(/^\d+\./)
          expect(tab.label).not.toMatch(/^\d+\s/)
        }
      }
    })
  })

  describe('2. Resolução de Deep Links e Retrocompatibilidade', () => {
    it('resolve todos os deep links canônicos corretamente', () => {
      const cases: Array<[string, string, string]> = [
        ['receita', 'receita', 'financeiro'],
        ['assinaturas', 'assinaturas', 'financeiro'],
        ['produtos', 'produtos', 'financeiro'],
        ['comissoes', 'comissoes', 'financeiro'],
        ['honorarios_peritos', 'honorarios_peritos', 'financeiro'],
        ['custos', 'custos', 'financeiro'],
        ['radar_semanal', 'radar_semanal', 'financeiro'],
        ['clientes', 'clientes', 'operacional'],
        ['reativacao', 'reativacao', 'operacional'],
        ['uso', 'uso', 'operacional'],
        ['peritos', 'peritos', 'operacional'],
        ['sandbox', 'sandbox', 'operacional'],
        ['historico_consultas', 'historico_consultas', 'operacional'],
        ['lastro_conformidade', 'lastro_conformidade', 'operacional'],
        ['ccrlr_sinir', 'ccrlr_sinir', 'operacional'],
        ['dmrv_todas_empresas', 'dmrv_todas_empresas', 'dmrv_prova'],
        ['auditoria_integridade', 'auditoria_integridade', 'dmrv_prova'],
        ['auditoria', 'auditoria', 'dmrv_prova'],
        ['configuracoes', 'configuracoes', 'governanca'],
        ['governanca', 'governanca', 'governanca'],
        ['parametros_negocio', 'parametros_negocio', 'governanca'],
      ]

      for (const [qTab, expectedTab, expectedGroup] of cases) {
        const res = resolveInitialTab(qTab, true)
        expect(res.tab).toBe(expectedTab)
        expect(res.group).toBe(expectedGroup)
      }
    })

    it('resolve aliases populares como ?tab=dmrv, ?tab=historico, ?tab=honorarios, ?tab=sandbox', () => {
      expect(resolveInitialTab('dmrv', true)).toEqual({
        tab: 'dmrv_todas_empresas',
        group: 'dmrv_prova',
      })
      expect(resolveInitialTab('historico', true)).toEqual({
        tab: 'historico_consultas',
        group: 'operacional',
      })
      expect(resolveInitialTab('honorarios', true)).toEqual({
        tab: 'honorarios_peritos',
        group: 'financeiro',
      })
      expect(resolveInitialTab('sandbox', true)).toEqual({
        tab: 'sandbox',
        group: 'operacional',
      })
      expect(resolveInitialTab('reativacao', true)).toEqual({
        tab: 'reativacao',
        group: 'operacional',
      })
      expect(resolveInitialTab('radar', true)).toEqual({
        tab: 'radar_semanal',
        group: 'financeiro',
      })
      expect(resolveInitialTab('lastro', true)).toEqual({
        tab: 'lastro_conformidade',
        group: 'operacional',
      })
      expect(resolveInitialTab('sinir', true)).toEqual({
        tab: 'ccrlr_sinir',
        group: 'operacional',
      })
    })

    it('mantém retrocompatibilidade com links numéricos antigos (1 a 16)', () => {
      expect(resolveInitialTab('1', true).tab).toBe('receita')
      expect(resolveInitialTab('2', true).tab).toBe('clientes')
      expect(resolveInitialTab('12', true).tab).toBe('dmrv_todas_empresas')
      expect(resolveInitialTab('13', true).tab).toBe('historico_consultas')
      expect(resolveInitialTab('15', true).tab).toBe('governanca')
      expect(resolveInitialTab('16', true).tab).toBe('parametros_negocio')
    })

    it('identifica o grupo correto via getGroupByTab', () => {
      expect(getGroupByTab('receita')).toBe('financeiro')
      expect(getGroupByTab('clientes')).toBe('operacional')
      expect(getGroupByTab('dmrv_todas_empresas')).toBe('dmrv_prova')
      expect(getGroupByTab('governanca')).toBe('governanca')
    })
  })

  describe('3. Visibilidade por Papel (Admin Comum vs. Gestor Master)', () => {
    it('usuário sem papel master NÃO recebe abas master-only na lista de visíveis', () => {
      const visibleTabs = getVisibleGroups(false)
      const govGroup = visibleTabs.find((g) => g.id === 'governanca')!
      expect(govGroup).toBeDefined()
      // No grupo governança, apenas Governança & MOVER (configuracoes) é visível para admin comum
      const tabIds = govGroup.tabs.map((t) => t.id)
      expect(tabIds).toContain('configuracoes')
      expect(tabIds).not.toContain('governanca')
      expect(tabIds).not.toContain('parametros_negocio')
    })

    it('usuário master recebe todas as abas de governança', () => {
      const visibleTabs = getVisibleGroups(true)
      const govGroup = visibleTabs.find((g) => g.id === 'governanca')!
      const tabIds = govGroup.tabs.map((t) => t.id)
      expect(tabIds).toContain('configuracoes')
      expect(tabIds).toContain('governanca')
      expect(tabIds).toContain('parametros_negocio')
    })

    it('bloqueia deep link direto para ?tab=governanca quando usuário não é master', () => {
      const res = resolveInitialTab('governanca', false)
      expect(res.tab).toBe('receita')
      expect(res.group).toBe('financeiro')
    })

    it('bloqueia deep link direto para ?tab=parametros_negocio quando usuário não é master', () => {
      const res = resolveInitialTab('parametros_negocio', false)
      expect(res.tab).toBe('receita')
      expect(res.group).toBe('financeiro')
    })
  })

  describe('4. Renderização Integrada no AdminConsolePage', () => {
    it('renderiza os 4 botões de grupo no desktop e o seletor de grupo', async () => {
      render(
        <MemoryRouter initialEntries={['/admin?tab=receita']}>
          <AdminConsolePage />
        </MemoryRouter>,
      )

      await waitFor(() => {
        expect(screen.getByTestId('admin-group-selector')).toBeDefined()
      })

      expect(screen.getByTestId('admin-group-btn-financeiro')).toBeDefined()
      expect(screen.getByTestId('admin-group-btn-operacional')).toBeDefined()
      expect(screen.getByTestId('admin-group-btn-dmrv_prova')).toBeDefined()
      expect(screen.getByTestId('admin-group-btn-governanca')).toBeDefined()

      // Mostra as abas do grupo Financeiro
      expect(screen.getByTestId('admin-tab-receita')).toBeDefined()
      expect(screen.getByTestId('admin-tab-assinaturas')).toBeDefined()
      expect(screen.getByTestId('admin-tab-radar_semanal')).toBeDefined()
      expect(screen.getByTestId('admin-tab-honorarios_peritos')).toBeDefined()
    })

    it('ao alternar para o grupo dMRV & Prova, renderiza apenas as abas daquele grupo', async () => {
      render(
        <MemoryRouter initialEntries={['/admin?tab=receita']}>
          <AdminConsolePage />
        </MemoryRouter>,
      )

      await waitFor(() => {
        expect(screen.getByTestId('admin-group-btn-dmrv_prova')).toBeDefined()
      })

      fireEvent.click(screen.getByTestId('admin-group-btn-dmrv_prova'))

      await waitFor(() => {
        expect(screen.getByTestId('admin-tab-dmrv_todas_empresas')).toBeDefined()
        expect(screen.getByTestId('admin-tab-auditoria_integridade')).toBeDefined()
        expect(screen.getByTestId('admin-tab-auditoria')).toBeDefined()
      })

      // As abas financeiras não devem estar presentes na faixa ativa de abas
      const scrollContainer = screen.getByTestId('admin-tabs-scroll-container')
      expect(scrollContainer.querySelector('[data-testid="admin-tab-receita"]')).toBeNull()
    })

    it('abre e fecha o Mapa de Áreas (Accordion Desktop)', async () => {
      render(
        <MemoryRouter initialEntries={['/admin?tab=receita']}>
          <AdminConsolePage />
        </MemoryRouter>,
      )

      await waitFor(() => {
        expect(screen.getByTestId('admin-group-accordion-toggle')).toBeDefined()
      })

      expect(screen.queryByTestId('admin-accordion-overview')).toBeNull()

      // Abre
      fireEvent.click(screen.getByTestId('admin-group-accordion-toggle'))
      await waitFor(() => {
        expect(screen.getByTestId('admin-accordion-overview')).toBeDefined()
      })

      // Fecha
      fireEvent.click(screen.getByTestId('admin-group-accordion-toggle'))
      await waitFor(() => {
        expect(screen.queryByTestId('admin-accordion-overview')).toBeNull()
      })
    })

    it('abre e navega via Drawer Mobile', async () => {
      render(
        <MemoryRouter initialEntries={['/admin?tab=receita']}>
          <AdminConsolePage />
        </MemoryRouter>,
      )

      await waitFor(() => {
        expect(screen.getByTestId('admin-mobile-drawer-toggle')).toBeDefined()
      })

      // Abre Drawer
      fireEvent.click(screen.getByTestId('admin-mobile-drawer-toggle'))
      await waitFor(() => {
        expect(screen.getByTestId('admin-mobile-drawer')).toBeDefined()
      })

      // Clica na aba do Drawer para navegar até dMRV Emissões
      const dmrvDrawerTab = screen.getByTestId('admin-drawer-tab-dmrv_todas_empresas')
      expect(dmrvDrawerTab).toBeDefined()
      fireEvent.click(dmrvDrawerTab)

      // Drawer fecha após clique
      await waitFor(() => {
        expect(screen.queryByTestId('admin-mobile-drawer')).toBeNull()
      })

      // dMRV agora está ativo
      expect(screen.getByTestId('tab-content-dmrv')).toBeDefined()
    })

    it('deep link direto ?tab=dmrv renderiza grupo dMRV & Prova ativo com a aba selecionada', async () => {
      render(
        <MemoryRouter initialEntries={['/admin?tab=dmrv']}>
          <AdminConsolePage />
        </MemoryRouter>,
      )

      await waitFor(() => {
        expect(screen.getByTestId('tab-content-dmrv')).toBeDefined()
      })

      const groupBtn = screen.getByTestId('admin-group-btn-dmrv_prova')
      expect(groupBtn.className).toContain('bg-[#2563EB]')
    })

    it('deep link direto ?tab=sandbox renderiza grupo Operacional ativo com aba Sandbox', async () => {
      render(
        <MemoryRouter initialEntries={['/admin?tab=sandbox']}>
          <AdminConsolePage />
        </MemoryRouter>,
      )

      await waitFor(() => {
        expect(screen.getByTestId('tab-content-sandbox')).toBeDefined()
      })

      const groupBtn = screen.getByTestId('admin-group-btn-operacional')
      expect(groupBtn.className).toContain('bg-[#2563EB]')
    })

    it('deep link direto ?tab=reativacao renderiza grupo Operacional ativo com aba Reativação', async () => {
      render(
        <MemoryRouter initialEntries={['/admin?tab=reativacao']}>
          <AdminConsolePage />
        </MemoryRouter>,
      )

      await waitFor(() => {
        expect(screen.getByTestId('tab-content-reativacao')).toBeDefined()
      })

      const groupBtn = screen.getByTestId('admin-group-btn-operacional')
      expect(groupBtn.className).toContain('bg-[#2563EB]')
    })

    it('deep link direto ?tab=radar_semanal renderiza grupo Financeiro ativo com aba Radar Semanal', async () => {
      render(
        <MemoryRouter initialEntries={['/admin?tab=radar_semanal']}>
          <AdminConsolePage />
        </MemoryRouter>,
      )

      await waitFor(() => {
        expect(screen.getByTestId('tab-content-radar')).toBeDefined()
      })

      const groupBtn = screen.getByTestId('admin-group-btn-financeiro')
      expect(groupBtn.className).toContain('bg-[#2563EB]')
    })

    it('usuário sem permissão master NÃO visualiza Governança Master mesmo acessando ?tab=governanca', async () => {
      mockAuthState.isMaster = false
      mockAuthState.user.role = 'admin'

      render(
        <MemoryRouter initialEntries={['/admin?tab=governanca']}>
          <AdminConsolePage />
        </MemoryRouter>,
      )

      await waitFor(() => {
        expect(screen.getByTestId('admin-tabs-nav-container')).toBeDefined()
      })

      // Redireciona com segurança para Financeiro / Receita
      expect(screen.queryByTestId('tab-content-governanca')).toBeNull()
      expect(screen.queryByTestId('admin-tab-governanca')).toBeNull()
      expect(screen.queryByTestId('admin-tab-parametros_negocio')).toBeNull()
    })
  })
})
