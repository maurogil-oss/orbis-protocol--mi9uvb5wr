import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import AdminConsolePage from '@/pages/AdminConsolePage'
import pb from '@/lib/pocketbase/client'
import * as adminConsoleService from '@/services/adminConsoleService'

// Mock de autenticação adaptável
let mockAuthState: any = {
  user: null,
  role: 'cliente',
  loading: false,
  isMaster: false,
  isAdmin: false,
  isController: false,
  isFinanceiro: false,
  isAuditor: false,
  isPerito: false,
  isCliente: true,
  isParceiro: false,
}

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockAuthState,
}))

// Mock do PocketBase
vi.mock('@/lib/pocketbase/client', () => ({
  pb: {
    send: vi.fn(),
    collection: vi.fn(() => ({
      getFullList: vi.fn().mockResolvedValue([]),
      getList: vi.fn().mockResolvedValue({ items: [], totalItems: 0 }),
      getOne: vi.fn().mockResolvedValue({}),
      update: vi.fn().mockResolvedValue({}),
      create: vi.fn().mockResolvedValue({}),
    })),
    authStore: {
      isValid: true,
      token: 'test-token',
      record: { id: 'usr-123', email: 'admin@orbis.com', role: 'admin' },
    },
  },
}))

describe('Controle de Acesso de Cliente, Badges e Governança no Console (v0.0.197)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.alert = vi.fn()
  })

  describe('1. Guarda de Rotas (ProtectedRoute) com Cliente Suspenso vs Ativo', () => {
    it('bloqueia cliente com cliente_acesso_status === "suspenso" e exibe aviso institucional com suporte', () => {
      mockAuthState = {
        user: {
          id: 'cli-suspenso-1',
          email: 'cliente.suspenso@empresa.com.br',
          role: 'cliente',
          cliente_acesso_status: 'suspenso',
        },
        role: 'cliente',
        loading: false,
        isMaster: false,
        isAdmin: false,
        isController: false,
        isFinanceiro: false,
        isAuditor: false,
        isPerito: false,
        isCliente: true,
        isParceiro: false,
      }

      render(
        <MemoryRouter initialEntries={['/painel']}>
          <ProtectedRoute>
            <div data-testid="conteudo-painel">Painel Operacional do Cliente</div>
          </ProtectedRoute>
        </MemoryRouter>,
      )

      // Não deve exibir o conteúdo protegido
      expect(screen.queryByTestId('conteudo-painel')).toBeNull()

      // Deve exibir o card institucional de suspensão
      expect(screen.getByText(/Conta Suspensa • Acesso Restrito/i)).toBeDefined()
      expect(screen.getByRole('heading', { name: /Acesso à Conta Suspenso/i })).toBeDefined()
      expect(screen.getByText(/cliente\.suspenso@empresa\.com\.br/i)).toBeDefined()
      expect(screen.getByText(/suporte@orbis-protocol\.com/i)).toBeDefined()
      expect(screen.getByRole('link', { name: /Falar com o Suporte/i })).toBeDefined()
    })

    it('permite que cliente com cliente_acesso_status === "ativo" acesse normalmente', () => {
      mockAuthState = {
        user: {
          id: 'cli-ativo-1',
          email: 'cliente.ativo@empresa.com.br',
          role: 'cliente',
          cliente_acesso_status: 'ativo',
        },
        role: 'cliente',
        loading: false,
        isMaster: false,
        isAdmin: false,
        isController: false,
        isFinanceiro: false,
        isAuditor: false,
        isPerito: false,
        isCliente: true,
        isParceiro: false,
      }

      render(
        <MemoryRouter initialEntries={['/painel']}>
          <ProtectedRoute>
            <div data-testid="conteudo-painel">Painel Operacional do Cliente</div>
          </ProtectedRoute>
        </MemoryRouter>,
      )

      expect(screen.getByTestId('conteudo-painel')).toBeDefined()
      expect(screen.getByText('Painel Operacional do Cliente')).toBeDefined()
    })

    it('não bloqueia administradores ou gestor master mesmo se cliente_acesso_status estiver configurado', () => {
      mockAuthState = {
        user: {
          id: 'master-1',
          email: 'master@orbis-protocol.com',
          role: 'master',
          cliente_acesso_status: 'suspenso', // Não deve afetar master/admin
        },
        role: 'master',
        loading: false,
        isMaster: true,
        isAdmin: true,
        isController: false,
        isFinanceiro: false,
        isAuditor: false,
        isPerito: false,
        isCliente: false,
        isParceiro: false,
      }

      render(
        <MemoryRouter initialEntries={['/admin']}>
          <ProtectedRoute requireRole="master">
            <div data-testid="conteudo-master">Área de Governança Master</div>
          </ProtectedRoute>
        </MemoryRouter>,
      )

      expect(screen.getByTestId('conteudo-master')).toBeDefined()
      expect(screen.queryByText(/Acesso à Conta Suspenso/i)).toBeNull()
    })
  })

  describe('2. Console Administrativo (Aba Clientes): Badges e Ações de Suspensão / Reativação', () => {
    beforeEach(() => {
      mockAuthState = {
        user: {
          id: 'admin-1',
          email: 'admin@orbis-protocol.com',
          role: 'admin',
        },
        role: 'admin',
        loading: false,
        isMaster: false,
        isAdmin: true,
        isController: false,
        isFinanceiro: false,
        isAuditor: false,
        isPerito: false,
        isCliente: false,
        isParceiro: false,
      }
    })

    it('renderiza os badges de e-mail verificado, último acesso e status Ativo/Suspenso na lista de clientes', async () => {
      const mockClientes = [
        {
          id: 'cli-1',
          email: 'verificado@cliente.com',
          name: 'Empresa Verificada Ltda',
          role: 'cliente',
          verified: true,
          cliente_acesso_status: 'ativo',
          ultimo_acesso: '2026-04-10T14:30:00Z',
          cnpj: '12.345.678/0001-90',
          plano_ativo: 'diagnostico',
          assinatura_status: 'ativa',
        },
        {
          id: 'cli-2',
          email: 'pendente@cliente.com',
          name: 'Empresa Pendente SA',
          role: 'cliente',
          verified: false,
          cliente_acesso_status: 'suspenso',
          ultimo_acesso: null,
          cnpj: '98.765.432/0001-10',
          plano_ativo: 'corporativo',
          assinatura_status: 'inadimplente',
        },
      ]

      vi.spyOn(adminConsoleService, 'listarClientesAdmin').mockResolvedValue(mockClientes as any)
      vi.spyOn(adminConsoleService, 'carregarAdminKpis').mockResolvedValue({
        receitaTotal: 0,
        cobrancasPagas: 0,
        cobrancasPendentes: 0,
        totalClientes: 2,
        totalLeads: 0,
        totalConsultasDpp: 0,
        totalLotesCdv: 0,
        totalRevisoes: 0,
        totalConsultasInfosimples: 0,
        custoTotalInfosimples: 0,
        comissoesPendentes: 0,
        comissoesPagas: 0,
        totalParceiros: 0,
        peritosPendentes: 0,
        peritosAprovados: 0,
      })
      vi.spyOn(adminConsoleService, 'listarCobrancasAdmin').mockResolvedValue([])
      vi.spyOn(adminConsoleService, 'listarLeadsAdmin').mockResolvedValue([])
      vi.spyOn(adminConsoleService, 'listarConsultasDppAdmin').mockResolvedValue([])
      vi.spyOn(adminConsoleService, 'listarLotesCdvAdmin').mockResolvedValue([])
      vi.spyOn(adminConsoleService, 'listarRevisoesPericiaisAdmin').mockResolvedValue([])
      vi.spyOn(adminConsoleService, 'listarConsultasInfosimplesAdmin').mockResolvedValue([])

      render(
        <MemoryRouter initialEntries={['/admin?tab=clientes']}>
          <AdminConsolePage />
        </MemoryRouter>,
      )

      await waitFor(() => {
        expect(screen.getByText('Empresa Verificada Ltda')).toBeDefined()
      })

      // 1. Badges de E-mail
      expect(screen.getByText('E-mail verificado')).toBeDefined()
      expect(screen.getByText('E-mail não verificado')).toBeDefined()

      // 2. Badges de Status da Conta
      expect(screen.getByText('Conta Ativa')).toBeDefined()
      expect(screen.getByText('Conta Suspensa')).toBeDefined()

      // 3. Último Acesso
      expect(screen.getByText(/Sem registro/i)).toBeDefined()
      // O cliente 1 tem timestamp renderizado
      expect(screen.getAllByText(/Último Acesso:/i).length).toBe(2)

      // 4. Botões de ação de governança
      expect(screen.getByRole('button', { name: /Suspender Cliente/i })).toBeDefined()
      expect(screen.getByRole('button', { name: /Reativar Cliente/i })).toBeDefined()
    })

    it('abre modal e dispara alteração de suspensão com justificativa chamando adminConsoleService', async () => {
      const mockClientes = [
        {
          id: 'cli-para-suspender',
          email: 'devedor@cliente.com',
          name: 'Devedor S.A.',
          role: 'cliente',
          verified: true,
          cliente_acesso_status: 'ativo',
          ultimo_acesso: '2026-04-01T10:00:00Z',
          cnpj: '11.222.333/0001-44',
          plano_ativo: 'diagnostico',
          assinatura_status: 'inadimplente',
        },
      ]

      vi.spyOn(adminConsoleService, 'listarClientesAdmin').mockResolvedValue(mockClientes as any)
      vi.spyOn(adminConsoleService, 'carregarAdminKpis').mockResolvedValue({
        receitaTotal: 0,
        cobrancasPagas: 0,
        cobrancasPendentes: 0,
        totalClientes: 1,
        totalLeads: 0,
        totalConsultasDpp: 0,
        totalLotesCdv: 0,
        totalRevisoes: 0,
        totalConsultasInfosimples: 0,
        custoTotalInfosimples: 0,
        comissoesPendentes: 0,
        comissoesPagas: 0,
        totalParceiros: 0,
        peritosPendentes: 0,
        peritosAprovados: 0,
      })
      vi.spyOn(adminConsoleService, 'listarCobrancasAdmin').mockResolvedValue([])
      vi.spyOn(adminConsoleService, 'listarLeadsAdmin').mockResolvedValue([])
      vi.spyOn(adminConsoleService, 'listarConsultasDppAdmin').mockResolvedValue([])
      vi.spyOn(adminConsoleService, 'listarLotesCdvAdmin').mockResolvedValue([])
      vi.spyOn(adminConsoleService, 'listarRevisoesPericiaisAdmin').mockResolvedValue([])
      vi.spyOn(adminConsoleService, 'listarConsultasInfosimplesAdmin').mockResolvedValue([])

      const spyAlterarStatus = vi
        .spyOn(adminConsoleService, 'alterarClienteAcessoStatus')
        .mockResolvedValue({
          sucesso: true,
          novo_status: 'suspenso',
          status_anterior: 'ativo',
          mensagem: 'Acesso do cliente suspenso com sucesso.',
        })

      render(
        <MemoryRouter initialEntries={['/admin?tab=clientes']}>
          <AdminConsolePage />
        </MemoryRouter>,
      )

      await waitFor(() => {
        expect(screen.getByText('Devedor S.A.')).toBeDefined()
      })

      const btnSuspender = screen.getByRole('button', { name: /Suspender Cliente/i })
      fireEvent.click(btnSuspender)

      // Modal de Suspensão deve estar aberto
      expect(screen.getByRole('heading', { name: /Suspender Acesso de Cliente/i })).toBeDefined()
      expect(screen.getByText(/devedor@cliente\.com/i)).toBeDefined()

      const textarea = screen.getByPlaceholderText(/Descreva o motivo da suspensão/i)
      fireEvent.change(textarea, { target: { value: 'Inadimplência contratual comprovada' } })

      const btnConfirmar = screen.getByRole('button', { name: /Confirmar Suspensão/i })
      fireEvent.click(btnConfirmar)

      await waitFor(() => {
        expect(spyAlterarStatus).toHaveBeenCalledWith({
          userId: 'cli-para-suspender',
          status: 'suspenso',
          motivo: 'Inadimplência contratual comprovada',
        })
      })
    })
  })
})
