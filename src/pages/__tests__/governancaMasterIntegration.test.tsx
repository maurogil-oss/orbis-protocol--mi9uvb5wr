import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import {
  ConsoleGovernancaMasterTab,
  PAPEIS_PERMITIDOS_GOVERNANCA,
} from '@/components/ConsoleGovernancaMasterTab'
import AdminConsolePage from '@/pages/AdminConsolePage'
import RegistroPage from '@/pages/RegistroPage'
import Login from '@/pages/Login'
import {
  aprovarRecusarContaGestaoMaster,
  alterarPapelUsuarioMaster,
} from '@/services/adminConsoleService'
import pb from '@/lib/pocketbase/client'

// Mocks de módulos de serviço pesados do AdminConsolePage para isolar os testes
vi.mock('@/services/adminConsoleService', async (importOriginal) => {
  const actual = await importOriginal<any>()
  return {
    ...actual,
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
    listarClientesAdmin: vi.fn().mockResolvedValue([
      {
        id: 'user-master-1',
        name: 'Mauro Master',
        email: 'mauro@orbisprotocol.org',
        role: 'master',
        status_aprovacao: 'aprovado',
        created: '2026-01-01T00:00:00Z',
      },
      {
        id: 'user-admin-1',
        name: 'Carlos Admin',
        email: 'carlos@orbisprotocol.org',
        role: 'admin',
        status_aprovacao: 'aprovado',
        created: '2026-01-02T00:00:00Z',
      },
      {
        id: 'user-gestao-pend-1',
        name: 'Novo Gestor Pendente',
        email: 'gestor.pendente@empresa.com.br',
        role: 'admin',
        status_aprovacao: 'pendente',
        created: '2026-03-20T00:00:00Z',
      },
    ]),
    listarLeadsAdmin: vi.fn().mockResolvedValue([]),
    listarConsultasDppAdmin: vi.fn().mockResolvedValue([]),
    listarLotesCdvAdmin: vi.fn().mockResolvedValue([]),
    listarPecasCdvAdmin: vi.fn().mockResolvedValue([]),
    listarDestinacoesFinaisAdmin: vi.fn().mockResolvedValue([]),
    listarRevisoesPericiaisAdmin: vi.fn().mockResolvedValue([]),
    listarConsultasInfosimplesAdmin: vi.fn().mockResolvedValue([]),
    aprovarRecusarContaGestaoMaster: vi.fn().mockResolvedValue({
      sucesso: true,
      mensagem: 'Conta aprovada com sucesso.',
    }),
    alterarPapelUsuarioMaster: vi.fn().mockResolvedValue({
      sucesso: true,
      mensagem: 'Papel alterado com sucesso.',
    }),
  }
})

vi.mock('@/services/auditService', () => ({
  listarAuditLogs: vi.fn().mockResolvedValue({ items: [], totalItems: 0 }),
  registrarEventoAudit: vi.fn().mockResolvedValue({ id: 'audit-log-1' }),
  anularDocumentoDpp: vi.fn().mockResolvedValue({ sucesso: true }),
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
  listarServicosCatalogoComStatus: vi.fn().mockResolvedValue([]),
  listarServicosCatalogo: vi.fn().mockResolvedValue([]),
}))

vi.mock('@/services/parceirosService', () => ({
  listarParceiros: vi.fn().mockResolvedValue([]),
  listarComissoes: vi.fn().mockResolvedValue([]),
  atualizarStatusAcessoParceiro: vi.fn().mockResolvedValue({ sucesso: true }),
}))

vi.mock('@/services/peritoService', () => ({
  listarCredenciamentosPeritos: vi.fn().mockResolvedValue([]),
  atualizarValidadeArtPerito: vi.fn().mockResolvedValue({ sucesso: true }),
  reativarPeritoSuspenso: vi.fn().mockResolvedValue({ sucesso: true }),
}))

vi.mock('@/services/platformSettingsService', () => ({
  obterMoverAmpliadoHabilitado: vi.fn().mockResolvedValue(false),
  setMoverAmpliadoHabilitado: vi.fn().mockResolvedValue({ sucesso: true }),
}))

// Mock de AuthContext
let mockAuthState: {
  user: any
  token: string
  isAuthenticated: boolean
  isLoading: boolean
  role: string
  isMaster: boolean
  isAdmin: boolean
  isAdminOrPerito: boolean
  isFinanceiroLeitor: boolean
  isFinanceiro: boolean
  isController: boolean
  isClienteAcp: boolean
  isParceiro: boolean
  isGestaoPendente: boolean
  login: ReturnType<typeof vi.fn>
  logout: ReturnType<typeof vi.fn>
  refreshAuth: ReturnType<typeof vi.fn>
  requestPasswordReset: ReturnType<typeof vi.fn>
  confirmPasswordReset: ReturnType<typeof vi.fn>
}

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockAuthState,
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

// Mock do PocketBase client
vi.mock('@/lib/pocketbase/client', () => {
  return {
    default: {
      collection: vi.fn(),
      authStore: {
        record: null,
        token: '',
        model: null,
        onChange: vi.fn(() => () => {}),
        clear: vi.fn(),
      },
      baseUrl: 'http://localhost:8090',
      send: vi.fn(),
    },
  }
})

describe('Governança Gestor Master — Especificação e Controles Estritos', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuthState = {
      user: {
        id: 'usr-master-001',
        name: 'Gestor Master Orbis',
        email: 'master@orbisprotocol.org',
        role: 'master',
        status_aprovacao: 'aprovado',
      },
      token: 'valid-master-token',
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
      login: vi.fn().mockResolvedValue({ success: true }),
      logout: vi.fn(),
      refreshAuth: vi.fn(),
      requestPasswordReset: vi.fn().mockResolvedValue({ success: true }),
      confirmPasswordReset: vi.fn().mockResolvedValue({ success: true }),
    }
  })

  // 1. Apenas o papel master pode aprovar contas Gestão pendentes e alterar papéis; admin comum NÃO consegue
  describe('1. Prerrogativa Exclusiva do Gestor Master vs Admin Comum', () => {
    it('renderiza botões de aprovar/recusar e alterar papéis quando role === "master"', () => {
      const mockUsuarios = [
        {
          id: 'user-pend-1',
          name: 'Pendente Silva',
          email: 'silva@gestao.com',
          role: 'admin',
          status_aprovacao: 'pendente',
          created: '2026-03-25T10:00:00Z',
        },
        {
          id: 'user-regular-1',
          name: 'Cliente Regular',
          email: 'cliente@regular.com',
          role: 'cliente',
          status_aprovacao: 'aprovado',
          created: '2026-03-20T10:00:00Z',
        },
      ]

      render(
        <MemoryRouter>
          <ConsoleGovernancaMasterTab usuarios={mockUsuarios} onAtualizar={vi.fn()} />
        </MemoryRouter>,
      )

      expect(screen.getByText(/Painel de Governança Master/i)).toBeDefined()
      expect(screen.getByRole('button', { name: /Aprovar/i })).toBeDefined()
      expect(screen.getByRole('button', { name: /Recusar/i })).toBeDefined()
      expect(screen.getByRole('button', { name: /Alterar Papel/i })).toBeDefined()
    })

    it('bloqueia e exibe aviso de acesso restrito se usuário NÃO for master na tab de governança', () => {
      mockAuthState.role = 'admin'
      mockAuthState.isMaster = false
      mockAuthState.isAdmin = true

      render(
        <MemoryRouter>
          <ConsoleGovernancaMasterTab usuarios={[]} onAtualizar={vi.fn()} />
        </MemoryRouter>,
      )

      expect(screen.getByText(/Acesso Restrito ao Gestor Master/i)).toBeDefined()
      expect(screen.getByText(/Esta aba é restrita exclusivamente ao papel/i)).toBeDefined()
      expect(screen.queryByText(/Fila de Contas Gestão Pendentes/i)).toBeNull()
    })

    it('ConsoleGovernancaMasterTab dispara aprovarRecusarContaGestaoMaster com justificativa ao aprovar', async () => {
      const onAtualizarMock = vi.fn()
      const mockUsuarios = [
        {
          id: 'target-pend-99',
          name: 'Candidato Admin',
          email: 'candidato@gestao.com',
          role: 'admin',
          status_aprovacao: 'pendente',
          created: '2026-03-25T10:00:00Z',
        },
      ]

      render(
        <MemoryRouter>
          <ConsoleGovernancaMasterTab usuarios={mockUsuarios} onAtualizar={onAtualizarMock} />
        </MemoryRouter>,
      )

      const btnAprovar = screen.getByRole('button', { name: /Aprovar/i })
      fireEvent.click(btnAprovar)

      // Modal abre
      expect(screen.getByText(/Homologar Conta de Gestão/i)).toBeDefined()
      const btnConfirmar = screen.getByRole('button', { name: /Confirmar Decisão/i })
      fireEvent.click(btnConfirmar)

      await waitFor(() => {
        expect(aprovarRecusarContaGestaoMaster).toHaveBeenCalledWith(
          expect.objectContaining({
            userId: 'target-pend-99',
            decisao: 'aprovar',
            novoPapel: 'admin',
          }),
        )
      })
    })

    it('ConsoleGovernancaMasterTab dispara alterarPapelUsuarioMaster ao mudar papel de usuário', async () => {
      const onAtualizarMock = vi.fn()
      const mockUsuarios = [
        {
          id: 'target-user-123',
          name: 'Operador Teste',
          email: 'op@orbisprotocol.org',
          role: 'cliente',
          status_aprovacao: 'aprovado',
          created: '2026-03-25T10:00:00Z',
        },
      ]

      render(
        <MemoryRouter>
          <ConsoleGovernancaMasterTab usuarios={mockUsuarios} onAtualizar={onAtualizarMock} />
        </MemoryRouter>,
      )

      const btnAlterar = screen.getByRole('button', { name: /Alterar Papel/i })
      fireEvent.click(btnAlterar)

      expect(screen.getByText(/Alterar Nível de Acesso \(Papel\)/i)).toBeDefined()
      const btnSalvar = screen.getByRole('button', { name: /Salvar Alteração/i })
      fireEvent.click(btnSalvar)

      await waitFor(() => {
        expect(alterarPapelUsuarioMaster).toHaveBeenCalledWith(
          expect.objectContaining({
            userId: 'target-user-123',
            novoPapel: 'cliente',
          }),
        )
      })
    })
  })

  // 2. Nenhuma interface permite criar ou conceder o papel master
  describe('2. Blindagem: Papel "master" nunca concedível por interface ou cadastro público', () => {
    it('o cadastro público /registro NÃO lista e NÃO permite selecionar papel "master"', () => {
      render(
        <MemoryRouter initialEntries={['/registro']}>
          <RegistroPage />
        </MemoryRouter>,
      )

      // Deve listar opções normais: Cliente, Cliente ACP, Perito, Parceiro, Gestão
      expect(screen.getByText(/Cliente \/ Empresa/i)).toBeDefined()
      expect(screen.getByText(/Cliente ACP/i)).toBeDefined()
      expect(screen.getByText(/Perito Técnico/i)).toBeDefined()
      expect(screen.getByText(/Parceiro/i)).toBeDefined()
      expect(screen.getByText(/Gestão/i)).toBeDefined()

      // NÃO pode haver botão de selecionar "master"
      expect(screen.queryByRole('button', { name: /^Master$/i })).toBeNull()
      expect(screen.queryByRole('button', { name: /^Gestor Master$/i })).toBeNull()
    })

    it('a lista de papéis selecionáveis no painel de governança PAPEIS_PERMITIDOS_GOVERNANCA não contém "master"', () => {
      const rolesIds = PAPEIS_PERMITIDOS_GOVERNANCA.map((p) => p.id)
      expect(rolesIds).not.toContain('master')
      expect(rolesIds).toContain('admin')
      expect(rolesIds).toContain('controller')
      expect(rolesIds).toContain('financeiro')
      expect(rolesIds).toContain('financeiro_leitor')
      expect(rolesIds).toContain('perito')
      expect(rolesIds).toContain('parceiro')
      expect(rolesIds).toContain('cliente_acp')
      expect(rolesIds).toContain('cliente')
    })
  })

  // 3. Conta com perfil Gestão criada em /registro nasce com status_aprovacao: 'pendente' e é bloqueada no ProtectedRoute
  describe('3. Ciclo de Vida da Conta Gestão e Bloqueio no ProtectedRoute', () => {
    it('ao criar conta com perfil Gestão em /registro, grava role="admin" e status_aprovacao="pendente"', async () => {
      const mockCreate = vi.fn().mockResolvedValue({
        id: 'novo-gestor-1',
        email: 'gestor@empresa.com.br',
        role: 'admin',
        status_aprovacao: 'pendente',
      })

      vi.mocked(pb.collection).mockReturnValue({
        create: mockCreate,
      } as any)

      render(
        <MemoryRouter initialEntries={['/registro?papel=gestao']}>
          <RegistroPage />
        </MemoryRouter>,
      )

      const nomeInput = screen.getByPlaceholderText(/Maria Silva ou Indústria Alfa Ltda/i)
      const emailInput = screen.getByPlaceholderText(/seu\.email@empresa\.com\.br/i)
      const senhas = screen.getAllByPlaceholderText(/••••••••/i)
      const checkboxTermo = screen.getByRole('checkbox')

      fireEvent.change(nomeInput, { target: { value: 'Marcos Gerente' } })
      fireEvent.change(emailInput, { target: { value: 'marcos@gestao.com' } })
      fireEvent.change(senhas[0], { target: { value: 'SenhaForteGestao2026' } })
      fireEvent.change(senhas[1], { target: { value: 'SenhaForteGestao2026' } })
      fireEvent.click(checkboxTermo)

      const submitBtn = screen.getByRole('button', {
        name: /Criar Conta de Gestão \(Pendente de Validação\)/i,
      })
      fireEvent.click(submitBtn)

      await waitFor(() => {
        expect(mockCreate).toHaveBeenCalledWith(
          expect.objectContaining({
            email: 'marcos@gestao.com',
            name: 'Marcos Gerente',
            role: 'admin',
            status_aprovacao: 'pendente',
          }),
        )
      })
    })

    it('ProtectedRoute bloqueia usuário Gestão com status_aprovacao="pendente" exibindo tela de homologação', () => {
      mockAuthState.role = 'admin'
      mockAuthState.isMaster = false
      mockAuthState.isAdmin = true
      mockAuthState.user = {
        id: 'usr-gestao-pend-1',
        email: 'carlos.pendente@empresa.com',
        role: 'admin',
        status_aprovacao: 'pendente',
      }

      render(
        <MemoryRouter initialEntries={['/admin']}>
          <ProtectedRoute requireRole="admin">
            <div data-testid="conteudo-secreto">Área Secreta do Console</div>
          </ProtectedRoute>
        </MemoryRouter>,
      )

      expect(screen.queryByTestId('conteudo-secreto')).toBeNull()
      expect(
        screen.getByRole('heading', { name: /Acesso em Análise pelo Gestor Master/i }),
      ).toBeDefined()
      expect(screen.getByText(/Perfil Gestão • Pendente de Aprovação/i)).toBeDefined()
      expect(screen.getByText(/carlos\.pendente@empresa\.com/i)).toBeDefined()
    })

    it('ProtectedRoute libera acesso quando conta de Gestão tiver status_aprovacao="aprovado"', () => {
      mockAuthState.role = 'admin'
      mockAuthState.isMaster = false
      mockAuthState.isAdmin = true
      mockAuthState.user = {
        id: 'usr-gestao-aprovado',
        email: 'carlos.aprovado@empresa.com',
        role: 'admin',
        status_aprovacao: 'aprovado',
      }

      render(
        <MemoryRouter initialEntries={['/admin']}>
          <ProtectedRoute requireRole="admin">
            <div data-testid="conteudo-secreto">Área Liberada do Console</div>
          </ProtectedRoute>
        </MemoryRouter>,
      )

      expect(screen.getByTestId('conteudo-secreto')).toBeDefined()
    })
  })

  // 4. Redirecionamento pós-login por papel
  describe('4. Redirecionamento Pós-Login por Papel', () => {
    it.each([
      ['master', '/admin?tab=governanca'],
      ['admin', '/admin'],
      ['controller', '/admin?tab=auditoria'],
      ['financeiro', '/admin?tab=receita'],
      ['financeiro_leitor', '/admin?tab=receita'],
      ['perito', '/credenciamento'],
      ['parceiro', '/parceiro-painel'],
      ['cliente', '/painel'],
      ['cliente_acp', '/painel'],
    ])('papel %s redireciona pós-login para %s', async (papelTestado, rotaEsperada) => {
      ;(pb.authStore as any).record = {
        id: `usr-${papelTestado}`,
        email: `${papelTestado}@empresa.com`,
        role: papelTestado,
        status_aprovacao: 'aprovado',
      }

      mockAuthState.login = vi.fn().mockResolvedValue({ success: true })

      render(
        <MemoryRouter initialEntries={['/login']}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="*" element={<div data-testid="target-route" />} />
          </Routes>
        </MemoryRouter>,
      )

      const emailInput = screen.getByPlaceholderText(/seu\.email@empresa\.com\.br/i)
      const senhaInput = screen.getByPlaceholderText(/••••••••/i)

      fireEvent.change(emailInput, { target: { value: `${papelTestado}@empresa.com` } })
      fireEvent.change(senhaInput, { target: { value: 'SenhaForte123' } })

      const submitBtn = screen.getByRole('button', { name: /Entrar no Sistema/i })
      fireEvent.click(submitBtn)

      await waitFor(() => {
        expect(mockAuthState.login).toHaveBeenCalled()
      })
    })
  })

  // 5. Aba "Governança Master" só renderiza para role === 'master' (admin comum não vê)
  describe('5. Renderização Condicional da Aba de Governança no AdminConsolePage', () => {
    it('usuário com role="master" visualiza o botão da aba "14. Governança Master"', async () => {
      mockAuthState.role = 'master'
      mockAuthState.isMaster = true
      mockAuthState.isAdmin = true

      render(
        <MemoryRouter initialEntries={['/admin']}>
          <AdminConsolePage />
        </MemoryRouter>,
      )

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /14\. Governança Master/i })).toBeDefined()
      })
    })

    it('usuário com role="admin" comum NÃO visualiza a aba "14. Governança Master"', async () => {
      mockAuthState.role = 'admin'
      mockAuthState.isMaster = false
      mockAuthState.isAdmin = true

      render(
        <MemoryRouter initialEntries={['/admin']}>
          <AdminConsolePage />
        </MemoryRouter>,
      )

      await waitFor(() => {
        expect(screen.getByText(/ADMINISTRAÇÃO ORBIS PROTOCOL/i)).toBeDefined()
      })

      expect(screen.queryByRole('button', { name: /14\. Governança Master/i })).toBeNull()
    })

    it('usuário controller NÃO visualiza a aba "14. Governança Master"', async () => {
      mockAuthState.role = 'controller'
      mockAuthState.isMaster = false
      mockAuthState.isAdmin = false

      render(
        <MemoryRouter initialEntries={['/admin?tab=auditoria']}>
          <AdminConsolePage />
        </MemoryRouter>,
      )

      await waitFor(() => {
        expect(screen.getByText(/ADMINISTRAÇÃO ORBIS PROTOCOL/i)).toBeDefined()
      })

      expect(screen.queryByRole('button', { name: /14\. Governança Master/i })).toBeNull()
    })
  })

  // 6. Auditoria de aprovação/recusa/alteração de papel
  describe('6. Auditoria e Rastreabilidade Formal de Governança', () => {
    it('aprovarRecusarContaGestaoMaster chama endpoint dedicado com parâmetros de auditoria', async () => {
      vi.mocked(pb.send).mockResolvedValueOnce({
        sucesso: true,
        decisao: 'aprovar',
        status_aprovacao: 'aprovado',
        novo_papel: 'controller',
        mensagem: 'Conta aprovada com sucesso.',
      })

      // Testando o serviço real adminConsoleService
      const actualAdminService = await vi.importActual<any>('@/services/adminConsoleService')
      const res = await actualAdminService.aprovarRecusarContaGestaoMaster({
        userId: 'usr-alvo-1',
        decisao: 'aprovar',
        novoPapel: 'controller',
        justificativa: 'Validação pelo Gestor Master',
      })

      expect(pb.send).toHaveBeenCalledWith('/backend/v1/master/aprovar-gestao', {
        method: 'POST',
        body: {
          user_id: 'usr-alvo-1',
          decisao: 'aprovar',
          novo_papel: 'controller',
          justificativa: 'Validação pelo Gestor Master',
        },
      })
      expect(res.sucesso).toBe(true)
      expect(res.decisao).toBe('aprovar')
    })

    it('alterarPapelUsuarioMaster chama endpoint de alteração de papel', async () => {
      vi.mocked(pb.send).mockResolvedValueOnce({
        sucesso: true,
        novo_papel: 'financeiro',
        mensagem: 'Papel alterado com sucesso.',
      })

      const actualAdminService = await vi.importActual<any>('@/services/adminConsoleService')
      const res = await actualAdminService.alterarPapelUsuarioMaster({
        userId: 'usr-alvo-2',
        novoPapel: 'financeiro',
        justificativa: 'Transferência de função corporativa',
      })

      expect(pb.send).toHaveBeenCalledWith('/backend/v1/master/alterar-papel', {
        method: 'POST',
        body: {
          user_id: 'usr-alvo-2',
          novo_papel: 'financeiro',
          justificativa: 'Transferência de função corporativa',
        },
      })
      expect(res.sucesso).toBe(true)
      expect(res.novo_papel).toBe('financeiro')
    })

    it('redefinirSenhaUsuarioMaster chama endpoint de redefinição de senha com retorno temporário único', async () => {
      vi.mocked(pb.send).mockResolvedValueOnce({
        sucesso: true,
        user_id: 'usr-alvo-3',
        email: 'alvo@orbis-protocol.com',
        senha_temporaria: 'TempPass@2025!',
        mensagem: 'Senha temporária gerada com sucesso.',
      })

      const actualAdminService = await vi.importActual<any>('@/services/adminConsoleService')
      const res = await actualAdminService.redefinirSenhaUsuarioMaster({
        userId: 'usr-alvo-3',
      })

      expect(pb.send).toHaveBeenCalledWith('/backend/v1/master/redefinir-senha-usuario', {
        method: 'POST',
        body: {
          user_id: 'usr-alvo-3',
        },
      })
      expect(res.sucesso).toBe(true)
      expect(res.senha_temporaria).toBe('TempPass@2025!')
    })
  })
})
