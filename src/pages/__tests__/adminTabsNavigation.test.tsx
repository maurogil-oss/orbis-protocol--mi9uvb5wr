import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import AdminConsolePage from '@/pages/AdminConsolePage'

// Mock dos serviços do AdminConsolePage para isolar os testes
vi.mock('@/services/adminConsoleService', () => ({
  carregarAdminKpis: vi.fn().mockResolvedValue({
    receitaTotal: 50000,
    cobrancasPagas: 10,
    cobrancasPendentes: 2,
    totalClientes: 15,
    totalLeads: 8,
    totalConsultasDpp: 30,
    totalLotesCdv: 5,
    totalRevisoes: 3,
    totalConsultasInfosimples: 20,
    custoTotalInfosimples: 40,
    comissoesPendentes: 1200,
    comissoesPagas: 3000,
    totalParceiros: 4,
    peritosPendentes: 1,
    peritosAprovados: 3,
  }),
  listarCobrancasAdmin: vi.fn().mockResolvedValue([]),
  listarClientesAdmin: vi.fn().mockResolvedValue([]),
  listarLeadsAdmin: vi.fn().mockResolvedValue([]),
  listarConsultasDppAdmin: vi.fn().mockResolvedValue([]),
  listarLotesCdvAdmin: vi.fn().mockResolvedValue([]),
  listarPecasCdvAdmin: vi.fn().mockResolvedValue([]),
  listarDestinacoesFinaisAdmin: vi.fn().mockResolvedValue([]),
  listarRevisoesPericiaisAdmin: vi.fn().mockResolvedValue([]),
  listarConsultasInfosimplesAdmin: vi.fn().mockResolvedValue([]),
}))

vi.mock('@/services/auditService', () => ({
  listarAuditLogs: vi.fn().mockResolvedValue({ items: [], totalItems: 0 }),
}))

vi.mock('@/services/cobrancaService', () => ({
  confirmarPagamentoSimulado: vi.fn().mockResolvedValue({ sucesso: true }),
  emitirNfse: vi.fn().mockResolvedValue({ sucesso: true }),
  verificarCiclosAssinatura: vi.fn().mockResolvedValue({
    cobrancas_geradas: 0,
    cobrancas_vencidas: 0,
    users_atualizados: 0,
    data_verificacao: new Date().toISOString(),
  }),
}))

vi.mock('@/services/catalogoServicosService', () => ({
  listarServicosCatalogo: vi.fn().mockResolvedValue([]),
}))

vi.mock('@/services/parceirosService', () => ({
  listarParceiros: vi.fn().mockResolvedValue([]),
  listarComissoes: vi.fn().mockResolvedValue([]),
}))

vi.mock('@/services/peritoService', () => ({
  listarCredenciamentosPeritos: vi.fn().mockResolvedValue([]),
}))

vi.mock('@/services/platformSettingsService', () => ({
  obterMoverAmpliadoHabilitado: vi.fn().mockResolvedValue(false),
  setMoverAmpliadoHabilitado: vi.fn().mockResolvedValue({ sucesso: true }),
}))

vi.mock('@/services/businessSettingsService', () => ({
  obterBusinessSettings: vi.fn().mockResolvedValue({ limite_four_eyes: 5000 }),
  BUSINESS_SETTINGS_FALLBACK: { limite_four_eyes: 5000 },
}))

let mockAuthState = {
  user: {
    id: 'usr-master-1',
    name: 'Mauro Gestor Master',
    email: 'maurogil@orbisprotocol.org',
    role: 'master',
    status_aprovacao: 'aprovado',
  },
  token: 'mock-token',
  isAuthenticated: true,
  isLoading: false,
  role: 'master',
  isMaster: true,
  isAdmin: true,
  isAdminOrPerito: true,
  isFinanceiroLeitor: false,
  isFinanceiro: false,
  isController: false,
  isClienteAcp: false,
  isParceiro: false,
  isGestaoPendente: false,
  login: vi.fn(),
  logout: vi.fn(),
  refreshAuth: vi.fn(),
  requestPasswordReset: vi.fn(),
  confirmPasswordReset: vi.fn(),
}

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockAuthState,
}))

describe('AdminConsolePage - Navegação de Abas e Destaque Sandbox', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuthState = {
      user: {
        id: 'usr-master-1',
        name: 'Mauro Gestor Master',
        email: 'maurogil@orbisprotocol.org',
        role: 'master',
        status_aprovacao: 'aprovado',
      },
      token: 'mock-token',
      isAuthenticated: true,
      isLoading: false,
      role: 'master',
      isMaster: true,
      isAdmin: true,
      isAdminOrPerito: true,
      isFinanceiroLeitor: false,
      isFinanceiro: false,
      isController: false,
      isClienteAcp: false,
      isParceiro: false,
      isGestaoPendente: false,
      login: vi.fn(),
      logout: vi.fn(),
      refreshAuth: vi.fn(),
      requestPasswordReset: vi.fn(),
      confirmPasswordReset: vi.fn(),
    }
  })

  it('renderiza o container de navegação de abas e os controles de seta (scroll left/right)', async () => {
    render(
      <MemoryRouter initialEntries={['/admin']}>
        <AdminConsolePage />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('admin-tabs-nav-container')).toBeDefined()
    })

    expect(screen.getByTestId('admin-tabs-scroll-left')).toBeDefined()
    expect(screen.getByTestId('admin-tabs-scroll-right')).toBeDefined()
    expect(screen.getByTestId('admin-tabs-scroll-container')).toBeDefined()
  })

  it('renderiza exatamente 15 abas para o Gestor Master, incluindo a aba Sandbox de Ingestão', async () => {
    render(
      <MemoryRouter initialEntries={['/admin']}>
        <AdminConsolePage />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('admin-tab-sandbox')).toBeDefined()
    })

    const tabsContainer = screen.getByTestId('admin-tabs-scroll-container')
    const tabButtons = tabsContainer.querySelectorAll('button[data-testid^="admin-tab-"]')
    // 15 abas conforme confirmação explícita do usuário para o papel Gestor Master
    expect(tabButtons.length).toBe(15)

    // Confirma presença da aba Sandbox de Ingestão
    const sandboxTab = screen.getByTestId('admin-tab-sandbox')
    expect(sandboxTab.textContent).toContain('Sandbox de Ingestão')
  })

  it('destaca visualmente a aba Sandbox quando inativa (badge "Novo" e borda esmeralda sutil)', async () => {
    // Abrir em outra aba (ex: receita) para que o sandbox fique inativo
    render(
      <MemoryRouter initialEntries={['/admin?tab=receita']}>
        <AdminConsolePage />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('admin-tab-sandbox')).toBeDefined()
    })

    const sandboxTab = screen.getByTestId('admin-tab-sandbox')
    // Verifica que o badge de destaque "Novo" existe quando inativa
    const badge = screen.getByTestId('sandbox-tab-badge')
    expect(badge).toBeDefined()
    expect(badge.textContent).toBe('Novo')

    // Classes de destaque esmeralda diferenciadas do restante das abas inativas
    expect(sandboxTab.className).toContain('emerald')
  })

  it('ao clicar na aba Sandbox, ativa a aba e remove o badge sutil mantendo o padrão das demais abas ativas', async () => {
    render(
      <MemoryRouter initialEntries={['/admin?tab=receita']}>
        <AdminConsolePage />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('admin-tab-sandbox')).toBeDefined()
    })

    const sandboxTab = screen.getByTestId('admin-tab-sandbox')
    fireEvent.click(sandboxTab)

    // Quando selecionada, a aba ganha o estilo padrão ativo (bg-[#12B886]) e o badge "Novo" some
    await waitFor(() => {
      expect(sandboxTab.className).toContain('bg-[#12B886]')
      expect(screen.queryByTestId('sandbox-tab-badge')).toBeNull()
    })
  })

  it('dispara a rolagem de abas ao clicar na seta direita ou esquerda', async () => {
    render(
      <MemoryRouter initialEntries={['/admin']}>
        <AdminConsolePage />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('admin-tabs-scroll-container')).toBeDefined()
    })

    const scrollContainer = screen.getByTestId('admin-tabs-scroll-container')
    const scrollByMock = vi.fn()
    scrollContainer.scrollBy = scrollByMock

    const rightBtn = screen.getByTestId('admin-tabs-scroll-right')
    fireEvent.click(rightBtn)
    expect(scrollByMock).toHaveBeenCalledWith(
      expect.objectContaining({ left: 320, behavior: 'smooth' }),
    )

    const leftBtn = screen.getByTestId('admin-tabs-scroll-left')
    fireEvent.click(leftBtn)
    expect(scrollByMock).toHaveBeenCalledWith(
      expect.objectContaining({ left: -320, behavior: 'smooth' }),
    )
  })
})
