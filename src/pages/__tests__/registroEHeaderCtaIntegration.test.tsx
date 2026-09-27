import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import '@testing-library/jest-dom'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import Layout from '@/components/Layout'
import RegistroPage from '@/pages/RegistroPage'
import Login from '@/pages/Login'
import Index from '@/pages/Index'
import Planos from '@/pages/Planos'
import pb from '@/lib/pocketbase/client'

// Mock de autenticação controlado por teste
let mockAuthState = {
  user: null as any,
  token: '',
  isAuthenticated: false,
  isLoading: false,
  role: 'cliente',
  isAdminOrPerito: false,
  login: vi.fn(),
  logout: vi.fn(),
  refreshAuth: vi.fn(),
}

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockAuthState,
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

// Mock do PocketBase SDK
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
    },
  }
})

describe('Fluxo de Cadastro Permanente & Visível (Orbis Protocol)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuthState = {
      user: null,
      token: '',
      isAuthenticated: false,
      isLoading: false,
      role: 'cliente',
      isAdminOrPerito: false,
      login: vi.fn().mockResolvedValue({ success: true }),
      logout: vi.fn(),
      refreshAuth: vi.fn(),
    }
  })

  it('Layout exibe exatamente um botão de acesso à demonstração no header desktop, mantendo "Criar conta", "Entrar" e "Iniciar Diagnóstico"', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Layout />
      </MemoryRouter>,
    )

    // Desktop & Mobile drawer têm botão Criar conta
    const criarContaLinks = screen.getAllByRole('link', { name: /Criar conta/i })
    expect(criarContaLinks.length).toBeGreaterThanOrEqual(1)
    expect(criarContaLinks[0].getAttribute('href')).toBe('/registro')

    // Botão Entrar também está visível
    const entrarLinks = screen.getAllByRole('link', { name: /Entrar/i })
    expect(entrarLinks.length).toBeGreaterThanOrEqual(1)

    // Botão Iniciar Diagnóstico está visível no cabeçalho
    const diagnosticoLinks = screen.getAllByRole('link', { name: /Iniciar Diagnóstico/i })
    expect(diagnosticoLinks.length).toBeGreaterThanOrEqual(1)
    expect(diagnosticoLinks.some((l) => l.getAttribute('href') === '/diagnostico')).toBe(true)

    // Botão de acesso à demonstração: exatamente UM no header desktop (além do link do footer)
    // Procuramos os links que apontam para /demo
    const headerDemoLink = screen.getAllByRole('link', { name: /Ver Demonstração/i })
    expect(headerDemoLink.length).toBeGreaterThanOrEqual(1)
    const demoLinks = headerDemoLink.filter((l) => l.getAttribute('href') === '/demo')
    expect(demoLinks.length).toBeGreaterThanOrEqual(1)

    // Verificar especificamente dentro do header desktop
    const headerElement = screen.getByRole('banner')
    const desktopDemoLinks = Array.from(headerElement.querySelectorAll('a[href="/demo"]'))
    // Exatamente UM link para /demo no cabeçalho desktop
    expect(desktopDemoLinks.length).toBe(1)
    expect(desktopDemoLinks[0].textContent?.trim()).toBe('Ver Demonstração')

    // Não deve haver botão ou badge grudado "Demo" residual no cabeçalho
    expect(headerElement.textContent).not.toMatch(/Demo$/)
  })

  it('Drawer mobile exibe link para /demo com "Ver Demonstração"', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Layout />
      </MemoryRouter>,
    )

    // Abrir o menu mobile
    const openMenuBtn = screen.getByLabelText(/Abrir menu/i)
    fireEvent.click(openMenuBtn)

    // Encontrar o link Ver Demonstração no drawer mobile
    const allDemoLinks = screen.getAllByRole('link', { name: /Ver Demonstração/i })
    const drawerDemoLink = allDemoLinks.find(
      (l) => l.getAttribute('href') === '/demo' && l.className.includes('w-full'),
    )
    expect(drawerDemoLink).toBeDefined()
    expect(drawerDemoLink?.getAttribute('href')).toBe('/demo')
  })

  it('Layout oculta "Criar conta" e "Entrar" e exibe "Painel" quando autenticado', () => {
    mockAuthState.isAuthenticated = true
    mockAuthState.user = { id: 'usr-1', email: 'cliente@empresa.com.br', name: 'Cliente Teste' }

    render(
      <MemoryRouter initialEntries={['/']}>
        <Layout />
      </MemoryRouter>,
    )

    // Não deve exibir links de Criar conta nem de Entrar
    expect(screen.queryByRole('link', { name: /^Criar conta$/i })).toBeNull()
    expect(screen.queryByRole('link', { name: /^Entrar$/i })).toBeNull()

    // Deve exibir link para Painel
    expect(screen.getAllByRole('link', { name: /Painel/i }).length).toBeGreaterThanOrEqual(1)
  })

  it('Página /registro renderiza formulário com opções de cliente e perito e link para /login', () => {
    render(
      <MemoryRouter initialEntries={['/registro']}>
        <RegistroPage />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: /CRIAR SUA CONTA/i })).toBeDefined()
    expect(screen.getByText(/Cliente \/ Empresa/i)).toBeDefined()
    expect(screen.getByText(/Cliente ACP/i)).toBeDefined()
    expect(screen.getByText(/Perito Técnico/i)).toBeDefined()

    // Link para login existente
    const linkLogin = screen.getByRole('link', { name: /Já tenho conta → Entrar/i })
    expect(linkLogin.getAttribute('href')).toBe('/login')
  })

  it('Página /registro valida campos obrigatórios, senhas divergentes e aceite dos termos', async () => {
    render(
      <MemoryRouter initialEntries={['/registro']}>
        <RegistroPage />
      </MemoryRouter>,
    )

    const nomeInput = screen.getByPlaceholderText(/Maria Silva ou Indústria Alfa Ltda/i)
    const emailInput = screen.getByPlaceholderText(/seu\.email@empresa\.com\.br/i)
    const submitBtn = screen.getByRole('button', { name: /Criar Conta de Cliente/i })

    // 1. Tentar enviar sem preencher nada
    fireEvent.change(nomeInput, { target: { value: '' } })
    fireEvent.click(submitBtn)
    const alert1 = await screen.findByRole('alert')
    expect(alert1.textContent).toMatch(/informe seu nome completo ou razão social/i)

    // 2. Preenche nome mas senha fraca/curta (< 10 caracteres ou faltando símbolos)
    fireEvent.change(nomeInput, { target: { value: 'Engenharia Alfa' } })
    fireEvent.change(emailInput, { target: { value: 'alfa@eng.com.br' } })
    const senhaInputs = screen.getAllByPlaceholderText(/••••••••|Ex: SenhaForte2026/i)
    fireEvent.change(senhaInputs[0], { target: { value: '123' } })
    fireEvent.change(senhaInputs[1], { target: { value: '123' } })
    fireEvent.click(submitBtn)
    const alert2 = await screen.findByRole('alert')
    expect(alert2.textContent).toMatch(/mínimo de 10 caracteres/i)

    // 3. Senhas divergentes (com senha forte válida no campo de senha)
    fireEvent.change(senhaInputs[0], { target: { value: 'SenhaForte@2026' } })
    fireEvent.change(senhaInputs[1], { target: { value: 'OutraSenha@2026' } })
    fireEvent.click(submitBtn)
    const alert3 = await screen.findByRole('alert')
    expect(alert3.textContent).toMatch(/confirmação de senha não confere/i)

    // 4. Termo de aceite não marcado
    fireEvent.change(senhaInputs[1], { target: { value: 'SenhaForte@2026' } })
    fireEvent.click(submitBtn)
    const alert4 = await screen.findByRole('alert')
    expect(alert4.textContent).toMatch(/concordar com os Termos de Uso/i)
  })

  it('Página /registro submete cadastro de perito com role="perito" ao PocketBase', async () => {
    const mockCreate = vi.fn().mockResolvedValue({ id: 'new-perito-123' })
    vi.mocked(pb.collection).mockReturnValue({
      create: mockCreate,
    } as any)

    render(
      <MemoryRouter initialEntries={['/registro']}>
        <RegistroPage />
      </MemoryRouter>,
    )

    // Seleciona perfil Perito
    const peritoBtn = screen.getByText(/Perito Técnico/i)
    fireEvent.click(peritoBtn)

    // Preenche campos
    const nomeInput = screen.getByPlaceholderText(/Dr\. Eng\. Carlos Mendonça/i)
    const emailInput = screen.getByPlaceholderText(/seu\.email@empresa\.com\.br/i)
    const senhaInputs = screen.getAllByPlaceholderText(/••••••••|Ex: SenhaForte2026/i)
    const checkboxTermo = screen.getByRole('checkbox')

    fireEvent.change(nomeInput, { target: { value: 'Dr. Roberto Carlos CREA' } })
    fireEvent.change(emailInput, { target: { value: 'roberto@periciatecnica.com.br' } })
    fireEvent.change(senhaInputs[0], { target: { value: 'Perito#Seguro2026' } })
    fireEvent.change(senhaInputs[1], { target: { value: 'Perito#Seguro2026' } })
    fireEvent.click(checkboxTermo)
    const submitBtn = screen.getByRole('button', { name: /Criar Conta de Perito/i })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledWith({
        email: 'roberto@periciatecnica.com.br',
        password: 'Perito#Seguro2026',
        passwordConfirm: 'Perito#Seguro2026',
        name: 'Dr. Roberto Carlos CREA',
        role: 'perito',
        status_aprovacao: 'aprovado',
      })
      expect(mockAuthState.login).toHaveBeenCalledWith(
        'roberto@periciatecnica.com.br',
        'Perito#Seguro2026',
      )
    })

    expect(await screen.findByText(/Conta criada e autenticada com sucesso!/i)).toBeDefined()
  })

  it('Página /registro suporta cadastro como Cliente ACP com role="cliente_acp" e pré-seleção via query/state', async () => {
    const mockCreate = vi.fn().mockResolvedValue({ id: 'new-acp-123' })
    vi.mocked(pb.collection).mockReturnValue({
      create: mockCreate,
    } as any)

    render(
      <MemoryRouter initialEntries={['/registro?papel=acp']}>
        <RegistroPage />
      </MemoryRouter>,
    )

    // Preenche campos
    const nomeInput = screen.getByPlaceholderText(/Maria Silva ou Indústria Alfa Ltda/i)
    const emailInput = screen.getByPlaceholderText(/seu\.email@empresa\.com\.br/i)
    const senhaInputs = screen.getAllByPlaceholderText(/••••••••|Ex: SenhaForte2026/i)
    const checkboxTermo = screen.getByRole('checkbox')

    fireEvent.change(nomeInput, { target: { value: 'Associada ACP Curitiba S.A.' } })
    fireEvent.change(emailInput, { target: { value: 'acp@associada.com.br' } })
    fireEvent.change(senhaInputs[0], { target: { value: 'SenhaForteACP@2026' } })
    fireEvent.change(senhaInputs[1], { target: { value: 'SenhaForteACP@2026' } })
    fireEvent.click(checkboxTermo)
    const submitBtn = screen.getByRole('button', { name: /Criar Conta de Cliente ACP/i })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledWith({
        email: 'acp@associada.com.br',
        password: 'SenhaForteACP@2026',
        passwordConfirm: 'SenhaForteACP@2026',
        name: 'Associada ACP Curitiba S.A.',
        role: 'cliente_acp',
        status_aprovacao: 'aprovado',
      })
      expect(mockAuthState.login).toHaveBeenCalledWith('acp@associada.com.br', 'SenhaForteACP@2026')
    })
  })

  it('Página /login contém link direto para /registro', () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <Login />
      </MemoryRouter>,
    )

    const criarContaLink = screen.getByRole('link', { name: /Criar conta agora/i })
    expect(criarContaLink).toBeDefined()
    expect(criarContaLink.getAttribute('href')).toBe('/registro')
  })

  it('Página inicial (Index /) e /planos possuem CTAs apontando para /registro', () => {
    // Index
    const { unmount } = render(
      <MemoryRouter initialEntries={['/']}>
        <Index />
      </MemoryRouter>,
    )
    const indexRegistroLinks = screen.getAllByRole('link', { name: /Criar Conta/i })
    expect(indexRegistroLinks.length).toBeGreaterThanOrEqual(1)
    expect(indexRegistroLinks.some((l) => l.getAttribute('href') === '/registro')).toBe(true)
    unmount()

    // Planos
    render(
      <MemoryRouter initialEntries={['/planos']}>
        <Planos />
      </MemoryRouter>,
    )
    const planosRegistroLinks = screen.getAllByRole('link', { name: /Criar conta/i })
    expect(planosRegistroLinks.length).toBeGreaterThanOrEqual(1)
    expect(planosRegistroLinks.some((l) => l.getAttribute('href') === '/registro')).toBe(true)
  })
})
