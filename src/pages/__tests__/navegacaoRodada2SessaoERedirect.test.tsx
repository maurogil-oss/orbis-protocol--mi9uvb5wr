import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import Layout from '@/components/Layout'
import Login from '@/pages/Login'
import Verificador from '@/pages/Verificador'
import pb from '@/lib/pocketbase/client'

// Mock do AuthContext
let mockAuthState = {
  user: null as any,
  token: '',
  isAuthenticated: false,
  isLoading: false,
  role: 'cliente',
  isMaster: false,
  isAdmin: false,
  isAdminOrPerito: false,
  isParceiro: false,
  login: vi.fn(),
  logout: vi.fn(),
  refreshAuth: vi.fn(),
}

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockAuthState,
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

// Mock do PocketBase
vi.mock('@/lib/pocketbase/client', () => ({
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
  },
}))

describe('Rodada 2: Navegação Dinâmica por Sessão, Redirects e Verificador', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuthState = {
      user: null,
      token: '',
      isAuthenticated: false,
      isLoading: false,
      role: 'cliente',
      isMaster: false,
      isAdmin: false,
      isAdminOrPerito: false,
      isParceiro: false,
      login: vi.fn().mockResolvedValue({ success: true }),
      logout: vi.fn(),
      refreshAuth: vi.fn(),
    }
    ;(pb.authStore as any).record = null
  })

  describe('1. Cabeçalho Dinâmico por Sessão (Layout.tsx)', () => {
    it('visitante não autenticado: exibe CTA "Iniciar Diagnóstico" + links discretos "Entrar" e "Verificar Atestado"', () => {
      mockAuthState.isAuthenticated = false
      mockAuthState.user = null

      render(
        <MemoryRouter initialEntries={['/']}>
          <Layout />
        </MemoryRouter>,
      )

      const header = screen.getByRole('banner')
      expect(header.querySelector('a[href="/diagnostico"]')?.textContent).toContain(
        'Iniciar Diagnóstico',
      )
      expect(header.querySelector('a[href="/login"]')?.textContent).toContain('Entrar')
      expect(header.querySelector('a[href="/verificador"]')?.textContent).toContain(
        'Verificar Atestado',
      )

      // Não exibe links de logado
      expect(screen.queryByRole('link', { name: /Meu Portal/i })).toBeNull()
      expect(screen.queryByRole('link', { name: /Console/i })).toBeNull()
      expect(screen.queryByRole('link', { name: /Revisão Pericial/i })).toBeNull()
    })

    it('usuário autenticado com papel CLIENTE: esconde CTA de marketing e exibe "Meu Portal" apontando para /painel', () => {
      mockAuthState.isAuthenticated = true
      mockAuthState.role = 'cliente'
      mockAuthState.user = { id: 'cli-1', email: 'cliente@empresa.com.br', name: 'Cliente S.A.' }

      render(
        <MemoryRouter initialEntries={['/']}>
          <Layout />
        </MemoryRouter>,
      )

      const header = screen.getByRole('banner')
      // Não exibe CTA Iniciar Diagnóstico de marketing nem Entrar
      expect(header.textContent).not.toContain('Iniciar Diagnóstico')
      expect(header.querySelector('a[href="/login"]')).toBeNull()

      // O destino da navegação "Diagnóstico" continua presente nos 5 destinos
      const navDesktop = screen.getByRole('navigation', { name: /navegação principal/i })
      expect(navDesktop.querySelector('a[href="/diagnostico"]')?.textContent).toBe('Diagnóstico')

      // Exibe "Meu Portal" apontando para /painel
      const portalLinks = screen.getAllByRole('link', { name: /Meu Portal/i })
      expect(portalLinks.length).toBeGreaterThanOrEqual(1)
      expect(portalLinks.some((l) => l.getAttribute('href') === '/painel')).toBe(true)

      // "Verificar Atestado" permanece visível (caminho fixo do comprador)
      expect(header.querySelector('a[href="/verificador"]')).not.toBeNull()
    })

    it('usuário autenticado com papel GESTÃO (admin/master): exibe "Console" apontando para /admin sem CTAs de marketing', () => {
      mockAuthState.isAuthenticated = true
      mockAuthState.role = 'admin'
      mockAuthState.isAdmin = true
      mockAuthState.user = { id: 'adm-1', email: 'admin@orbis-protocol.com', name: 'Administrador' }

      render(
        <MemoryRouter initialEntries={['/']}>
          <Layout />
        </MemoryRouter>,
      )

      const header = screen.getByRole('banner')
      // Sem Iniciar Diagnóstico de CTA de aquisição
      expect(header.textContent).not.toContain('Iniciar Diagnóstico')

      // O destino da navegação "Diagnóstico" continua presente nos 5 destinos
      const navDesktop = screen.getByRole('navigation', { name: /navegação principal/i })
      expect(navDesktop.querySelector('a[href="/diagnostico"]')?.textContent).toBe('Diagnóstico')

      // Exibe "Console" apontando para /admin
      const consoleLinks = screen.getAllByRole('link', { name: /Console/i })
      expect(consoleLinks.length).toBeGreaterThanOrEqual(1)
      expect(consoleLinks.some((l) => l.getAttribute('href') === '/admin')).toBe(true)

      // "Verificar Atestado" permanece visível
      expect(header.querySelector('a[href="/verificador"]')).not.toBeNull()
    })

    it('usuário autenticado com papel PERITO: exibe link "Revisão Pericial" apontando para /revisor-f6', () => {
      mockAuthState.isAuthenticated = true
      mockAuthState.role = 'perito'
      mockAuthState.user = { id: 'per-1', email: 'perito@crea.org.br', name: 'Dr. Perito' }

      render(
        <MemoryRouter initialEntries={['/']}>
          <Layout />
        </MemoryRouter>,
      )

      const header = screen.getByRole('banner')
      expect(header.textContent).not.toContain('Iniciar Diagnóstico')

      const revisaoLinks = screen.getAllByRole('link', { name: /Revisão Pericial/i })
      expect(revisaoLinks.length).toBeGreaterThanOrEqual(1)
      expect(revisaoLinks.some((l) => l.getAttribute('href') === '/revisor-f6')).toBe(true)
      expect(header.querySelector('a[href="/verificador"]')).not.toBeNull()
    })

    it('usuário autenticado com papel PARCEIRO: exibe link "Meu Portal" apontando para /parceiro', () => {
      mockAuthState.isAuthenticated = true
      mockAuthState.role = 'parceiro'
      mockAuthState.isParceiro = true
      mockAuthState.user = { id: 'par-1', email: 'parceiro@acp.org.br', name: 'Parceiro ACP' }

      render(
        <MemoryRouter initialEntries={['/']}>
          <Layout />
        </MemoryRouter>,
      )

      const header = screen.getByRole('banner')
      expect(header.textContent).not.toContain('Iniciar Diagnóstico')

      const portalLinks = screen.getAllByRole('link', { name: /Meu Portal/i })
      expect(portalLinks.length).toBeGreaterThanOrEqual(1)
      expect(portalLinks.some((l) => l.getAttribute('href') === '/parceiro')).toBe(true)
      expect(header.querySelector('a[href="/verificador"]')).not.toBeNull()
    })
  })

  describe('2. Redirect Pós-Login por Papel (Login.tsx)', () => {
    it('cliente é redirecionado para /painel após login bem-sucedido', async () => {
      ;(pb.authStore as any).record = { id: 'c-1', role: 'cliente' }
      mockAuthState.login = vi.fn().mockResolvedValue({ success: true })

      render(
        <MemoryRouter initialEntries={['/login']}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/painel"
              element={<div data-testid="pagina-painel">Painel do Cliente</div>}
            />
          </Routes>
        </MemoryRouter>,
      )

      const emailInput = screen.getByPlaceholderText(/seu\.email@empresa\.com\.br/i)
      const senhaInput = screen.getByPlaceholderText('••••••••')
      const submitBtn = screen.getByRole('button', { name: /Entrar no Sistema/i })

      fireEvent.change(emailInput, { target: { value: 'cliente@teste.com' } })
      fireEvent.change(senhaInput, { target: { value: 'Senha@123456' } })
      fireEvent.click(submitBtn)

      await waitFor(() => {
        expect(screen.getByTestId('pagina-painel')).toBeDefined()
      })
    })

    it('gestor/admin é redirecionado para /admin após login bem-sucedido', async () => {
      ;(pb.authStore as any).record = { id: 'a-1', role: 'admin' }
      mockAuthState.login = vi.fn().mockResolvedValue({ success: true })

      render(
        <MemoryRouter initialEntries={['/login']}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/admin" element={<div data-testid="pagina-admin">Console Admin</div>} />
          </Routes>
        </MemoryRouter>,
      )

      const emailInput = screen.getByPlaceholderText(/seu\.email@empresa\.com\.br/i)
      const senhaInput = screen.getByPlaceholderText('••••••••')
      const submitBtn = screen.getByRole('button', { name: /Entrar no Sistema/i })

      fireEvent.change(emailInput, { target: { value: 'admin@orbis-protocol.com' } })
      fireEvent.change(senhaInput, { target: { value: 'Admin@123456' } })
      fireEvent.click(submitBtn)

      await waitFor(() => {
        expect(screen.getByTestId('pagina-admin')).toBeDefined()
      })
    })

    it('perito é redirecionado para /revisor-f6 após login bem-sucedido', async () => {
      ;(pb.authStore as any).record = { id: 'p-1', role: 'perito' }
      mockAuthState.login = vi.fn().mockResolvedValue({ success: true })

      render(
        <MemoryRouter initialEntries={['/login']}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/revisor-f6"
              element={<div data-testid="pagina-revisor">Revisão Pericial</div>}
            />
          </Routes>
        </MemoryRouter>,
      )

      const emailInput = screen.getByPlaceholderText(/seu\.email@empresa\.com\.br/i)
      const senhaInput = screen.getByPlaceholderText('••••••••')
      const submitBtn = screen.getByRole('button', { name: /Entrar no Sistema/i })

      fireEvent.change(emailInput, { target: { value: 'perito@crea.com' } })
      fireEvent.change(senhaInput, { target: { value: 'Perito@123456' } })
      fireEvent.click(submitBtn)

      await waitFor(() => {
        expect(screen.getByTestId('pagina-revisor')).toBeDefined()
      })
    })

    it('parceiro é redirecionado para /parceiro após login bem-sucedido', async () => {
      ;(pb.authStore as any).record = { id: 'par-1', role: 'parceiro' }
      mockAuthState.login = vi.fn().mockResolvedValue({ success: true })

      render(
        <MemoryRouter initialEntries={['/login']}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/parceiro"
              element={<div data-testid="pagina-parceiro">Área do Parceiro</div>}
            />
          </Routes>
        </MemoryRouter>,
      )

      const emailInput = screen.getByPlaceholderText(/seu\.email@empresa\.com\.br/i)
      const senhaInput = screen.getByPlaceholderText('••••••••')
      const submitBtn = screen.getByRole('button', { name: /Entrar no Sistema/i })

      fireEvent.change(emailInput, { target: { value: 'parceiro@acp.com' } })
      fireEvent.change(senhaInput, { target: { value: 'Parceiro@123456' } })
      fireEvent.click(submitBtn)

      await waitFor(() => {
        expect(screen.getByTestId('pagina-parceiro')).toBeDefined()
      })
    })

    it('parâmetro ?next= tem prioridade sobre o redirecionamento por papel', async () => {
      ;(pb.authStore as any).record = { id: 'c-1', role: 'cliente' }
      mockAuthState.login = vi.fn().mockResolvedValue({ success: true })

      render(
        <MemoryRouter initialEntries={['/login?next=/verificador']}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/verificador"
              element={<div data-testid="pagina-verificador">Verificador</div>}
            />
            <Route path="/painel" element={<div data-testid="pagina-painel">Painel</div>} />
          </Routes>
        </MemoryRouter>,
      )

      const emailInput = screen.getByPlaceholderText(/seu\.email@empresa\.com\.br/i)
      const senhaInput = screen.getByPlaceholderText('••••••••')
      const submitBtn = screen.getByRole('button', { name: /Entrar no Sistema/i })

      fireEvent.change(emailInput, { target: { value: 'cliente@teste.com' } })
      fireEvent.change(senhaInput, { target: { value: 'Senha@123456' } })
      fireEvent.click(submitBtn)

      await waitFor(() => {
        expect(screen.getByTestId('pagina-verificador')).toBeDefined()
        expect(screen.queryByTestId('pagina-painel')).toBeNull()
      })
    })
  })

  describe('3. CTA de Diagnóstico na Tela de Resultado da Verificação (Verificador.tsx)', () => {
    it('mostra CTA de diagnóstico pós-resultado para visitante (com atestado encontrado ou não)', async () => {
      mockAuthState.isAuthenticated = false
      mockAuthState.role = 'cliente'

      // Mock de busca que não encontra selo
      const mockGetFirst = vi.fn().mockRejectedValue(new Error('not found'))
      const mockGetFullList = vi.fn().mockResolvedValue([])
      vi.mocked(pb.collection).mockReturnValue({
        getFirstListItem: mockGetFirst,
        getFullList: mockGetFullList,
      } as any)

      render(
        <MemoryRouter initialEntries={['/verificador']}>
          <Verificador />
        </MemoryRouter>,
      )

      const input = screen.getByPlaceholderText(/Ex\.: ORB-2024-0001/i)
      const btn = screen.getByRole('button', { name: /Verificar Selo/i })

      fireEvent.change(input, { target: { value: 'ORB-INEXISTENTE' } })
      fireEvent.click(btn)

      await waitFor(() => {
        expect(screen.getByTestId('cta-diagnostico-verificador')).toBeDefined()
      })

      const ctaBlock = screen.getByTestId('cta-diagnostico-verificador')
      expect(ctaBlock.textContent).toContain('Seu fornecedor já comprova descarbonização')
      expect(ctaBlock.textContent).toContain('preliminar — não substitui laudo pericial')

      const linkDiagnostico = ctaBlock.querySelector('a[href="/diagnostico"]')
      expect(linkDiagnostico).not.toBeNull()
      expect(linkDiagnostico?.textContent).toContain('Iniciar diagnóstico')
    })

    it('NÃO mostra CTA de diagnóstico pós-resultado para usuário cliente autenticado', async () => {
      mockAuthState.isAuthenticated = true
      mockAuthState.role = 'cliente'
      mockAuthState.user = { id: 'c-1', email: 'cliente@empresa.com.br' }

      const mockGetFirst = vi.fn().mockRejectedValue(new Error('not found'))
      const mockGetFullList = vi.fn().mockResolvedValue([])
      vi.mocked(pb.collection).mockReturnValue({
        getFirstListItem: mockGetFirst,
        getFullList: mockGetFullList,
      } as any)

      render(
        <MemoryRouter initialEntries={['/verificador']}>
          <Verificador />
        </MemoryRouter>,
      )

      const input = screen.getByPlaceholderText(/Ex\.: ORB-2024-0001/i)
      const btn = screen.getByRole('button', { name: /Verificar Selo/i })

      fireEvent.change(input, { target: { value: 'ORB-INEXISTENTE' } })
      fireEvent.click(btn)

      await waitFor(() => {
        expect(screen.getByText(/Esse selo não foi encontrado em nossos registros/i)).toBeDefined()
      })

      // O CTA de diagnóstico NÃO deve estar presente para cliente já cadastrado
      expect(screen.queryByTestId('cta-diagnostico-verificador')).toBeNull()
    })
  })
})
