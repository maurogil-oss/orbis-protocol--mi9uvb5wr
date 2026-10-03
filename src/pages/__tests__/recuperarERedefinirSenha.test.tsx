import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import RecuperarSenhaPage from '../RecuperarSenhaPage'
import RedefinirSenhaPage from '../RedefinirSenhaPage'
import { AuthProvider } from '@/contexts/AuthContext'
import pb from '@/lib/pocketbase/client'

// Mock do PocketBase
vi.mock('@/lib/pocketbase/client', () => {
  return {
    default: {
      authStore: {
        record: null,
        token: '',
        onChange: vi.fn(() => () => {}),
        clear: vi.fn(),
      },
      collection: vi.fn(),
    },
  }
})

describe('Fluxo de Recuperação e Redefinição de Senha - Orbis Protocol', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('RecuperarSenhaPage deve permitir enviar solicitação e exibir aviso de privacidade e segurança', async () => {
    const mockRequestPasswordReset = vi.fn().mockResolvedValue(true)
    vi.mocked(pb.collection).mockReturnValue({
      requestPasswordReset: mockRequestPasswordReset,
    } as any)

    render(
      <MemoryRouter>
        <AuthProvider>
          <RecuperarSenhaPage />
        </AuthProvider>
      </MemoryRouter>,
    )

    expect(screen.getByText(/RECUPERAR SENHA/i)).toBeDefined()
    const inputEmail = screen.getByPlaceholderText('seu.email@empresa.com.br')
    const btnSubmit = screen.getByRole('button', { name: /Enviar Link de Redefinição/i })

    fireEvent.change(inputEmail, { target: { value: 'maurog1@hotmail.com' } })
    fireEvent.click(btnSubmit)

    await waitFor(() => {
      expect(mockRequestPasswordReset).toHaveBeenCalledWith('maurog1@hotmail.com')
      expect(screen.getByText(/Instruções de redefinição solicitadas/i)).toBeDefined()
      expect(
        screen.getByText(/Se o e-mail informado estiver registrado em nossa base corporativa/i),
      ).toBeDefined()
    })
  })

  it('RecuperarSenhaPage deve exibir aviso específico quando o backend responder que o e-mail não existe (404)', async () => {
    const error404: any = new Error("The requested resource wasn't found.")
    error404.status = 404
    const mockRequestPasswordReset = vi.fn().mockRejectedValue(error404)
    vi.mocked(pb.collection).mockReturnValue({
      requestPasswordReset: mockRequestPasswordReset,
    } as any)

    render(
      <MemoryRouter>
        <AuthProvider>
          <RecuperarSenhaPage />
        </AuthProvider>
      </MemoryRouter>,
    )

    const inputEmail = screen.getByPlaceholderText('seu.email@empresa.com.br')
    const btnSubmit = screen.getByRole('button', { name: /Enviar Link de Redefinição/i })

    fireEvent.change(inputEmail, { target: { value: 'maurogil@hotmail.com' } })
    fireEvent.click(btnSubmit)

    await waitFor(() => {
      const alert = screen.getByRole('alert')
      expect(alert.textContent).toContain('E-mail não encontrado no sistema')
      expect(alert.textContent).toContain('Não encontramos uma conta com este e-mail')
      expect(alert.textContent).toContain('letras e números parecidos, como "gil" e "g1"')
    })
  })

  it('RedefinirSenhaPage deve ler ?token= da URL e alertar se o token estiver ausente, permitindo inserção manual', () => {
    render(
      <MemoryRouter initialEntries={['/redefinir-senha']}>
        <AuthProvider>
          <RedefinirSenhaPage />
        </AuthProvider>
      </MemoryRouter>,
    )

    expect(screen.getByText(/REDEFINIR SENHA/i)).toBeDefined()
    expect(screen.getByText(/Token de redefinição não fornecido ou link incompleto/i)).toBeDefined()
    expect(screen.getByPlaceholderText(/Cole aqui o token recebido no e-mail/i)).toBeDefined()
  })

  it('RedefinirSenhaPage deve permitir inserir token manualmente se o link vier sem query param', async () => {
    const mockConfirmPasswordReset = vi.fn().mockResolvedValue(true)
    vi.mocked(pb.collection).mockReturnValue({
      confirmPasswordReset: mockConfirmPasswordReset,
    } as any)

    render(
      <MemoryRouter initialEntries={['/redefinir-senha']}>
        <AuthProvider>
          <RedefinirSenhaPage />
        </AuthProvider>
      </MemoryRouter>,
    )

    const inputManualToken = screen.getByPlaceholderText(/Cole aqui o token recebido no e-mail/i)
    fireEvent.change(inputManualToken, { target: { value: 'TOKEN_MANUAL_123' } })

    const inputs = screen.getAllByPlaceholderText('••••••••••')
    fireEvent.change(inputs[0], { target: { value: 'OrbisProtocol@2026' } })
    fireEvent.change(inputs[1], { target: { value: 'OrbisProtocol@2026' } })

    const btnSalvar = screen.getByRole('button', { name: /Salvar Nova Senha/i })
    expect(btnSalvar).not.toBeDisabled()
    fireEvent.click(btnSalvar)

    await waitFor(() => {
      expect(mockConfirmPasswordReset).toHaveBeenCalledWith(
        'TOKEN_MANUAL_123',
        'OrbisProtocol@2026',
        'OrbisProtocol@2026',
      )
      expect(screen.getByText(/Senha Redefinida com Sucesso!/i)).toBeDefined()
    })
  })

  it('RedefinirSenhaPage deve validar política de senha e chamar confirmPasswordReset(token, senha)', async () => {
    const mockConfirmPasswordReset = vi.fn().mockResolvedValue(true)
    vi.mocked(pb.collection).mockReturnValue({
      confirmPasswordReset: mockConfirmPasswordReset,
    } as any)

    render(
      <MemoryRouter initialEntries={['/redefinir-senha?token=TOKEN_DE_TESTE_123']}>
        <AuthProvider>
          <RedefinirSenhaPage />
        </AuthProvider>
      </MemoryRouter>,
    )

    expect(screen.getByText(/REDEFINIR SENHA/i)).toBeDefined()

    const inputs = screen.getAllByPlaceholderText('••••••••••')
    const novaSenhaInput = inputs[0]
    const confirmarSenhaInput = inputs[1]
    const btnSalvar = screen.getByRole('button', { name: /Salvar Nova Senha/i })

    // Testar validação de senha fraca (<10 chars)
    fireEvent.change(novaSenhaInput, { target: { value: 'Curta1!' } })
    fireEvent.change(confirmarSenhaInput, { target: { value: 'Curta1!' } })
    fireEvent.click(btnSalvar)

    await waitFor(() => {
      expect(screen.getByText(/mínimo de 10 caracteres/i)).toBeDefined()
    })

    // Testar senha forte sem símbolo
    fireEvent.change(novaSenhaInput, { target: { value: 'OrbisProtocol2026' } })
    fireEvent.change(confirmarSenhaInput, { target: { value: 'OrbisProtocol2026' } })
    fireEvent.click(btnSalvar)

    await waitFor(() => {
      expect(screen.getByText(/pelo menos 1 caractere especial ou símbolo/i)).toBeDefined()
    })

    // Testar senhas divergentes
    fireEvent.change(novaSenhaInput, { target: { value: 'OrbisProtocol@2026' } })
    fireEvent.change(confirmarSenhaInput, { target: { value: 'OrbisDiferente@2026' } })
    fireEvent.click(btnSalvar)

    await waitFor(() => {
      expect(screen.getByText(/As senhas digitadas não coincidem/i)).toBeDefined()
    })

    // Testar senha forte atendendo todos os requisitos (letras, números e símbolo)
    fireEvent.change(novaSenhaInput, { target: { value: 'OrbisProtocol@2026' } })
    fireEvent.change(confirmarSenhaInput, { target: { value: 'OrbisProtocol@2026' } })
    fireEvent.click(btnSalvar)

    await waitFor(() => {
      expect(mockConfirmPasswordReset).toHaveBeenCalledWith(
        'TOKEN_DE_TESTE_123',
        'OrbisProtocol@2026',
        'OrbisProtocol@2026',
      )
      expect(screen.getByText(/Senha Redefinida com Sucesso!/i)).toBeDefined()
    })
  })

  it('RedefinirSenhaPage deve exibir erro 400 visível na tela em caso de token expirado ou inválido', async () => {
    const error400: any = new Error('Failed to confirm password reset.')
    error400.status = 400
    error400.data = {
      code: 400,
      message: 'Failed to confirm password reset.',
      data: {
        token: { code: 'validation_invalid_token', message: 'Token inválido ou expirado.' },
      },
    }
    const mockConfirmPasswordReset = vi.fn().mockRejectedValue(error400)
    vi.mocked(pb.collection).mockReturnValue({
      confirmPasswordReset: mockConfirmPasswordReset,
    } as any)

    render(
      <MemoryRouter initialEntries={['/redefinir-senha?token=TOKEN_EXPIRADO']}>
        <AuthProvider>
          <RedefinirSenhaPage />
        </AuthProvider>
      </MemoryRouter>,
    )

    const inputs = screen.getAllByPlaceholderText('••••••••••')
    const novaSenhaInput = inputs[0]
    const confirmarSenhaInput = inputs[1]
    const btnSalvar = screen.getByRole('button', { name: /Salvar Nova Senha/i })

    fireEvent.change(novaSenhaInput, { target: { value: 'OrbisProtocol@2026' } })
    fireEvent.change(confirmarSenhaInput, { target: { value: 'OrbisProtocol@2026' } })
    fireEvent.click(btnSalvar)

    await waitFor(() => {
      const erroBox = screen.getByTestId('redefinir-senha-erro')
      expect(erroBox.textContent).toMatch(/Token inválido ou expirado/i)
      expect(screen.queryByText(/Senha Redefinida com Sucesso!/i)).toBeNull()
    })
  })

  it('RedefinirSenhaPage deve exibir mensagem de erro clara de rede ou falha de conexão', async () => {
    const netError: any = new TypeError('Failed to fetch')
    const mockConfirmPasswordReset = vi.fn().mockRejectedValue(netError)
    vi.mocked(pb.collection).mockReturnValue({
      confirmPasswordReset: mockConfirmPasswordReset,
    } as any)

    render(
      <MemoryRouter initialEntries={['/redefinir-senha?token=TOKEN_REDE']}>
        <AuthProvider>
          <RedefinirSenhaPage />
        </AuthProvider>
      </MemoryRouter>,
    )

    const inputs = screen.getAllByPlaceholderText('••••••••••')
    fireEvent.change(inputs[0], { target: { value: 'OrbisProtocol@2026' } })
    fireEvent.change(inputs[1], { target: { value: 'OrbisProtocol@2026' } })
    fireEvent.click(screen.getByRole('button', { name: /Salvar Nova Senha/i }))

    await waitFor(() => {
      const erroBox = screen.getByTestId('redefinir-senha-erro')
      expect(erroBox.textContent).toMatch(/Erro de conexão ao comunicar com o servidor/i)
      expect(screen.queryByText(/Senha Redefinida com Sucesso!/i)).toBeNull()
    })
  })
})
