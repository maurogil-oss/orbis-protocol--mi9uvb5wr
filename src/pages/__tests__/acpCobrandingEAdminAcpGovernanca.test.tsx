import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import React from 'react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { ConsoleGovernancaMasterTab } from '@/components/ConsoleGovernancaMasterTab'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import {
  obterAcpCobrandingConfig,
  salvarAcpCobrandingConfig,
  TEXTO_ACP_COBRANDING_PADRAO,
} from '@/services/platformSettingsService'
import { alterarPapelUsuarioMaster } from '@/services/adminConsoleService'

// Mocks
const mockAuthState: {
  user: any
  role: string
  isMaster: boolean
  isAdmin: boolean
  isAdminAcp: boolean
  loading: boolean
} = {
  user: { id: 'master-1', email: 'master@orbisprotocol.org', role: 'master' },
  role: 'master',
  isMaster: true,
  isAdmin: true,
  isAdminAcp: false,
  loading: false,
}

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockAuthState,
}))

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}))

vi.mock('@/services/platformSettingsService', async () => {
  const actual = await vi.importActual<any>('@/services/platformSettingsService')
  return {
    ...actual,
    obterAcpCobrandingConfig: vi.fn().mockResolvedValue({
      ativo: false,
      texto: actual.TEXTO_ACP_COBRANDING_PADRAO,
      logoUrl: '',
    }),
    salvarAcpCobrandingConfig: vi.fn().mockImplementation(async (config: any) => ({
      ativo: config.ativo,
      texto: config.texto || actual.TEXTO_ACP_COBRANDING_PADRAO,
      logoUrl: config.logoUrl || '',
    })),
  }
})

vi.mock('@/services/adminConsoleService', async () => {
  const actual = await vi.importActual<any>('@/services/adminConsoleService')
  return {
    ...actual,
    alterarPapelUsuarioMaster: vi.fn().mockResolvedValue({
      sucesso: true,
      mensagem: 'Papel do usuário atualizado com sucesso.',
    }),
  }
})

describe('Etapa 4 Peça 4b: Console Master Co-branding ACP e Papel admin_acp', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuthState.user = { id: 'master-1', email: 'master@orbisprotocol.org', role: 'master' }
    mockAuthState.role = 'master'
    mockAuthState.isMaster = true
    mockAuthState.isAdmin = true
    mockAuthState.isAdminAcp = false
  })

  describe('1. Controle de Co-branding ACP no Console Master', () => {
    it('renderiza o bloco de controle de co-branding ACP com toggle, texto padrão e campo logo', async () => {
      render(
        <MemoryRouter>
          <ConsoleGovernancaMasterTab usuarios={[]} onAtualizar={vi.fn()} />
        </MemoryRouter>,
      )

      expect(screen.getByTestId('bloco-controle-cobranding-acp')).toBeDefined()
      expect(screen.getByText(/Co-branding ACP \(Parceria Comercial\)/i)).toBeDefined()
      expect(screen.getByTestId('toggle-acp-cobranding')).toBeDefined()
      expect(screen.getByDisplayValue(TEXTO_ACP_COBRANDING_PADRAO)).toBeDefined()
      expect(screen.getByTestId('btn-salvar-cobranding-acp')).toBeDefined()
    })

    it('permite ativar o co-branding, alterar o texto e salvar via platformSettingsService', async () => {
      render(
        <MemoryRouter>
          <ConsoleGovernancaMasterTab usuarios={[]} onAtualizar={vi.fn()} />
        </MemoryRouter>,
      )

      // Alterna toggle
      const toggle = screen.getByTestId('toggle-acp-cobranding')
      fireEvent.click(toggle)

      // Altera texto
      const inputTexto = screen.getByLabelText(/Texto da Parceria/i)
      fireEvent.change(inputTexto, {
        target: { value: 'em parceria com a Associação Comercial do Paraná - Regional Curitiba' },
      })

      // Salva
      const btnSalvar = screen.getByTestId('btn-salvar-cobranding-acp')
      fireEvent.click(btnSalvar)

      await waitFor(() => {
        expect(salvarAcpCobrandingConfig).toHaveBeenCalledWith(
          expect.objectContaining({
            ativo: true,
            texto: 'em parceria com a Associação Comercial do Paraná - Regional Curitiba',
          }),
          'master@orbisprotocol.org',
        )
      })
    })
  })

  describe('2. Atribuição e Remoção do papel admin_acp na Listagem de Usuários', () => {
    it('exibe botão de ação rápida "Tornar Admin ACP" para usuário comum e abre modal de confirmação', async () => {
      const mockUsuarios = [
        {
          id: 'usr-cliente-1',
          name: 'João ACP',
          email: 'joao.acp@empresa.com.br',
          role: 'cliente',
          status_aprovacao: 'aprovado',
          created: '2026-03-25T10:00:00Z',
        },
      ]

      render(
        <MemoryRouter>
          <ConsoleGovernancaMasterTab usuarios={mockUsuarios} onAtualizar={vi.fn()} />
        </MemoryRouter>,
      )

      const btnToggle = screen.getByTestId('btn-toggle-admin-acp-usr-cliente-1')
      expect(btnToggle.textContent).toContain('Tornar Admin ACP')

      // Clica para abrir modal de confirmação
      fireEvent.click(btnToggle)

      expect(screen.getByText(/Atribuir Papel admin_acp/i)).toBeDefined()
      expect(screen.getByText(/joao\.acp@empresa\.com\.br/i)).toBeDefined()

      // Confirma
      const btnConfirmar = screen.getByRole('button', { name: /Confirmar Atribuição/i })
      fireEvent.click(btnConfirmar)

      await waitFor(() => {
        expect(alterarPapelUsuarioMaster).toHaveBeenCalledWith(
          expect.objectContaining({
            userId: 'usr-cliente-1',
            novoPapel: 'admin_acp',
          }),
        )
      })
    })

    it('exibe "Remover Admin ACP" para usuário que já é admin_acp e reverte para cliente com confirmação', async () => {
      const mockUsuarios = [
        {
          id: 'usr-admin-acp-1',
          name: 'Gestora ACP',
          email: 'gestora@acpr.com.br',
          role: 'admin_acp',
          status_aprovacao: 'aprovado',
          created: '2026-03-25T10:00:00Z',
        },
      ]

      render(
        <MemoryRouter>
          <ConsoleGovernancaMasterTab usuarios={mockUsuarios} onAtualizar={vi.fn()} />
        </MemoryRouter>,
      )

      const btnToggle = screen.getByTestId('btn-toggle-admin-acp-usr-admin-acp-1')
      expect(btnToggle.textContent).toContain('Remover Admin ACP')

      fireEvent.click(btnToggle)

      expect(screen.getByText(/Remover Papel admin_acp/i)).toBeDefined()

      const btnConfirmar = screen.getByRole('button', { name: /Confirmar Remoção/i })
      fireEvent.click(btnConfirmar)

      await waitFor(() => {
        expect(alterarPapelUsuarioMaster).toHaveBeenCalledWith(
          expect.objectContaining({
            userId: 'usr-admin-acp-1',
            novoPapel: 'cliente',
          }),
        )
      })
    })

    it('permite selecionar admin_acp também no modal completo de alteração de papel', async () => {
      const mockUsuarios = [
        {
          id: 'usr-cliente-2',
          name: 'Maria Teste',
          email: 'maria@teste.com.br',
          role: 'cliente',
          status_aprovacao: 'aprovado',
          created: '2026-03-25T10:00:00Z',
        },
      ]

      render(
        <MemoryRouter>
          <ConsoleGovernancaMasterTab usuarios={mockUsuarios} onAtualizar={vi.fn()} />
        </MemoryRouter>,
      )

      const btnAlterar = screen.getByRole('button', { name: /Alterar Papel/i })
      fireEvent.click(btnAlterar)

      expect(screen.getByText(/Alterar Nível de Acesso \(Papel\)/i)).toBeDefined()
      const selectPapel = screen.getByLabelText(/Selecione o Novo Papel/i)

      fireEvent.change(selectPapel, { target: { value: 'admin_acp' } })
      const inputJustificativa = screen.getByLabelText(/Justificativa Formal/i)
      fireEvent.change(inputJustificativa, {
        target: { value: 'Concessão de acesso administrativo ACP para auditoria do piloto.' },
      })

      const btnSalvar = screen.getByRole('button', { name: /Salvar Alteração/i })
      fireEvent.click(btnSalvar)

      await waitFor(() => {
        expect(alterarPapelUsuarioMaster).toHaveBeenCalledWith(
          expect.objectContaining({
            userId: 'usr-cliente-2',
            novoPapel: 'admin_acp',
          }),
        )
      })
    })
  })

  describe('3. Proteção de Acesso à rota /painel-acp', () => {
    it('libera acesso a /painel-acp para usuário admin_acp', () => {
      mockAuthState.role = 'admin_acp'
      mockAuthState.isMaster = false
      mockAuthState.isAdmin = false
      mockAuthState.isAdminAcp = true
      mockAuthState.user = { id: 'usr-acp', email: 'acp@acpr.com.br', role: 'admin_acp' }

      render(
        <MemoryRouter initialEntries={['/painel-acp']}>
          <Routes>
            <Route
              path="/painel-acp"
              element={
                <ProtectedRoute requireRole="adminAcpOrAdmin">
                  <div data-testid="conteudo-painel-acp">Painel ACP Liberado</div>
                </ProtectedRoute>
              }
            />
            <Route path="/painel" element={<div>Painel Cliente Redirecionado</div>} />
          </Routes>
        </MemoryRouter>,
      )

      expect(screen.getByTestId('conteudo-painel-acp')).toBeDefined()
    })

    it('bloqueia acesso a /painel-acp e redireciona para /painel se usuário for cliente comum', () => {
      mockAuthState.role = 'cliente'
      mockAuthState.isMaster = false
      mockAuthState.isAdmin = false
      mockAuthState.isAdminAcp = false
      mockAuthState.user = { id: 'usr-cliente', email: 'cliente@empresa.com.br', role: 'cliente' }

      render(
        <MemoryRouter initialEntries={['/painel-acp']}>
          <Routes>
            <Route
              path="/painel-acp"
              element={
                <ProtectedRoute requireRole="adminAcpOrAdmin">
                  <div data-testid="conteudo-painel-acp">Painel ACP Liberado</div>
                </ProtectedRoute>
              }
            />
            <Route path="/painel" element={<div data-testid="redirecionado">Painel Cliente</div>} />
          </Routes>
        </MemoryRouter>,
      )

      expect(screen.queryByTestId('conteudo-painel-acp')).toBeNull()
      expect(screen.getByTestId('redirecionado')).toBeDefined()
    })

    it('não-master não visualiza o Console de Governança Master', () => {
      mockAuthState.role = 'admin_acp'
      mockAuthState.isMaster = false
      mockAuthState.isAdmin = false
      mockAuthState.isAdminAcp = true

      render(
        <MemoryRouter>
          <ConsoleGovernancaMasterTab usuarios={[]} onAtualizar={vi.fn()} />
        </MemoryRouter>,
      )

      expect(screen.queryByTestId('bloco-controle-cobranding-acp')).toBeNull()
      expect(screen.getByText(/Acesso Restrito ao Gestor Master/i)).toBeDefined()
    })
  })
})
