import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import RecuperarSenhaPage from '../RecuperarSenhaPage'
import RedefinirSenhaPage, { sanitizeToken } from '../RedefinirSenhaPage'
import { AuthProvider } from '@/contexts/AuthContext'
import pb from '@/lib/pocketbase/client'

// Mock do SDK PocketBase
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

describe('Função utilitária sanitizeToken', () => {
  it('deve retornar string vazia para valores nulos, indefinidos ou vazios', () => {
    expect(sanitizeToken(null)).toBe('')
    expect(sanitizeToken(undefined)).toBe('')
    expect(sanitizeToken('')).toBe('')
    expect(sanitizeToken('   ')).toBe('')
  })

  it('deve decodificar URI components e cortar parâmetros residuais colados', () => {
    expect(sanitizeToken('TOKEN123%2Babc')).toBe('TOKEN123+abc')
    expect(sanitizeToken('TOKEN123%2Fxyz&email=maurog1@hotmail.com')).toBe('TOKEN123/xyz')
  })

  it('deve remover aspas, colchetes ou caracteres residuais de e-mail', () => {
    expect(sanitizeToken('"MEUTOKEN"')).toBe('MEUTOKEN')
    expect(sanitizeToken('<MEUTOKEN>')).toBe('MEUTOKEN')
    expect(sanitizeToken("'MEUTOKEN'")).toBe('MEUTOKEN')
  })
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

  it('Cenário 1: RedefinirSenhaPage deve alertar visivelmente quando token estiver ausente e orientar novo link ao tentar submeter', async () => {
    render(
      <MemoryRouter initialEntries={['/redefinir-senha']}>
        <AuthProvider>
          <RedefinirSenhaPage />
        </AuthProvider>
      </MemoryRouter>,
    )

    expect(screen.getByText(/REDEFINIR SENHA/i)).toBeDefined()
    expect(screen.getByText(/Token de redefinição não detectado na URL/i)).toBeDefined()
    expect(screen.getByPlaceholderText(/Cole aqui o token recebido no e-mail/i)).toBeDefined()

    // Ao clicar em Salvar sem token, deve exibir alerta visível de token ausente (nunca return silencioso)
    const btnSalvar = screen.getByRole('button', { name: /Salvar Nova Senha/i })
    fireEvent.click(btnSalvar)

    await waitFor(() => {
      const erroBox = screen.getByTestId('redefinir-senha-erro')
      expect(erroBox.textContent).toMatch(/Token de redefinição ausente/i)
      expect(erroBox.textContent).toMatch(/Solicite um novo link/i)
      expect(screen.getByRole('link', { name: /Solicitar novo link/i })).toBeDefined()
    })
  })

  it('Cenário 2: Submissão bem-sucedida deve chamar confirmPasswordReset do SDK e exibir tela de sucesso (query param)', async () => {
    const mockConfirmPasswordReset = vi.fn().mockResolvedValue(true)
    vi.mocked(pb.collection).mockReturnValue({
      confirmPasswordReset: mockConfirmPasswordReset,
    } as any)

    render(
      <MemoryRouter
        initialEntries={['/redefinir-senha?token=TOKEN_QUERY_PARAM_123&email=maurog1@hotmail.com']}
      >
        <AuthProvider>
          <RedefinirSenhaPage />
        </AuthProvider>
      </MemoryRouter>,
    )

    expect(screen.getByText('maurog1@hotmail.com')).toBeDefined()

    const inputs = screen.getAllByPlaceholderText('••••••••••')
    fireEvent.change(inputs[0], { target: { value: 'OrbisProtocol@2026' } })
    fireEvent.change(inputs[1], { target: { value: 'OrbisProtocol@2026' } })

    const btnSalvar = screen.getByRole('button', { name: /Salvar Nova Senha/i })
    fireEvent.click(btnSalvar)

    await waitFor(() => {
      expect(mockConfirmPasswordReset).toHaveBeenCalledTimes(1)
      expect(mockConfirmPasswordReset).toHaveBeenCalledWith(
        'TOKEN_QUERY_PARAM_123',
        'OrbisProtocol@2026',
        'OrbisProtocol@2026',
      )
      expect(screen.getByText(/Senha Redefinida com Sucesso!/i)).toBeDefined()
      expect(screen.getByRole('link', { name: /Ir para Login Agora/i })).toBeDefined()
    })
  })

  it('Cenário 3: Submissão bem-sucedida deve funcionar também via path param (/redefinir-senha/:token) com token codificado', async () => {
    const mockConfirmPasswordReset = vi.fn().mockResolvedValue(true)
    vi.mocked(pb.collection).mockReturnValue({
      confirmPasswordReset: mockConfirmPasswordReset,
    } as any)

    render(
      <MemoryRouter initialEntries={['/redefinir-senha/TOKEN%2BPARAM%2F123']}>
        <AuthProvider>
          <Routes>
            <Route path="/redefinir-senha/:token" element={<RedefinirSenhaPage />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    )

    const inputs = screen.getAllByPlaceholderText('••••••••••')
    fireEvent.change(inputs[0], { target: { value: 'OrbisProtocol@2026' } })
    fireEvent.change(inputs[1], { target: { value: 'OrbisProtocol@2026' } })

    const btnSalvar = screen.getByRole('button', { name: /Salvar Nova Senha/i })
    fireEvent.click(btnSalvar)

    await waitFor(() => {
      expect(mockConfirmPasswordReset).toHaveBeenCalledWith(
        'TOKEN+PARAM/123',
        'OrbisProtocol@2026',
        'OrbisProtocol@2026',
      )
      expect(screen.getByText(/Senha Redefinida com Sucesso!/i)).toBeDefined()
    })
  })

  it('Cenário 4: Token expirado ou inválido (400) deve exibir mensagem visível orientando a solicitar novo link', async () => {
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
    fireEvent.change(inputs[0], { target: { value: 'OrbisProtocol@2026' } })
    fireEvent.change(inputs[1], { target: { value: 'OrbisProtocol@2026' } })
    fireEvent.click(screen.getByRole('button', { name: /Salvar Nova Senha/i }))

    await waitFor(() => {
      expect(mockConfirmPasswordReset).toHaveBeenCalledWith(
        'TOKEN_EXPIRADO',
        'OrbisProtocol@2026',
        'OrbisProtocol@2026',
      )
      const erroBox = screen.getByTestId('redefinir-senha-erro')
      expect(erroBox.textContent).toMatch(/Link Inválido ou Expirado/i)
      expect(erroBox.textContent).toMatch(/30 minutos/i)
      expect(screen.getByRole('link', { name: /Solicitar novo link/i })).toBeDefined()
      expect(screen.queryByText(/Senha Redefinida com Sucesso!/i)).toBeNull()
    })
  })

  it('Cenário 5: Senhas divergentes devem exibir mensagem clara e NÃO chamar o SDK', async () => {
    const mockConfirmPasswordReset = vi.fn()
    vi.mocked(pb.collection).mockReturnValue({
      confirmPasswordReset: mockConfirmPasswordReset,
    } as any)

    render(
      <MemoryRouter initialEntries={['/redefinir-senha?token=TOKEN_VALIDO']}>
        <AuthProvider>
          <RedefinirSenhaPage />
        </AuthProvider>
      </MemoryRouter>,
    )

    const inputs = screen.getAllByPlaceholderText('••••••••••')
    fireEvent.change(inputs[0], { target: { value: 'OrbisProtocol@2026' } })
    fireEvent.change(inputs[1], { target: { value: 'OrbisOutraSenha@2026' } })
    fireEvent.click(screen.getByRole('button', { name: /Salvar Nova Senha/i }))

    await waitFor(() => {
      expect(screen.getByText(/As senhas digitadas não coincidem/i)).toBeDefined()
      expect(mockConfirmPasswordReset).not.toHaveBeenCalled()
    })
  })

  it('Cenário 6: Violação de regra de senha client-side (mínimo 10, maiúscula, minúscula, número, símbolo) deve exibir a exigência exata', async () => {
    const mockConfirmPasswordReset = vi.fn()
    vi.mocked(pb.collection).mockReturnValue({
      confirmPasswordReset: mockConfirmPasswordReset,
    } as any)

    render(
      <MemoryRouter initialEntries={['/redefinir-senha?token=TOKEN_VALIDO']}>
        <AuthProvider>
          <RedefinirSenhaPage />
        </AuthProvider>
      </MemoryRouter>,
    )

    const inputs = screen.getAllByPlaceholderText('••••••••••')
    const btnSalvar = screen.getByRole('button', { name: /Salvar Nova Senha/i })

    // Falta comprimento
    fireEvent.change(inputs[0], { target: { value: 'Ab1!' } })
    fireEvent.change(inputs[1], { target: { value: 'Ab1!' } })
    fireEvent.click(btnSalvar)
    await waitFor(() => {
      expect(screen.getByText(/mínimo de 10 caracteres/i)).toBeDefined()
      expect(mockConfirmPasswordReset).not.toHaveBeenCalled()
    })

    // Falta símbolo
    fireEvent.change(inputs[0], { target: { value: 'OrbisProtocol2026' } })
    fireEvent.change(inputs[1], { target: { value: 'OrbisProtocol2026' } })
    fireEvent.click(btnSalvar)
    await waitFor(() => {
      expect(screen.getByText(/pelo menos 1 caractere especial ou símbolo/i)).toBeDefined()
      expect(mockConfirmPasswordReset).not.toHaveBeenCalled()
    })
  })

  it('Cenário 7: Violação de regra de senha rejeitada pelo backend deve repassar a exigência na tela', async () => {
    const errorServer: any = new Error(
      'A senha informada não atende à política de segurança da Orbis Protocol. Falta: pelo menos 1 número.',
    )
    errorServer.status = 400
    const mockConfirmPasswordReset = vi.fn().mockRejectedValue(errorServer)
    vi.mocked(pb.collection).mockReturnValue({
      confirmPasswordReset: mockConfirmPasswordReset,
    } as any)

    render(
      <MemoryRouter initialEntries={['/redefinir-senha?token=TOKEN_VALIDO']}>
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
      expect(erroBox.textContent).toMatch(/política de segurança/i)
      expect(screen.queryByText(/Senha Redefinida com Sucesso!/i)).toBeNull()
    })
  })

  it('Cenário 8: Erro de rede/falha de conexão deve exibir mensagem amigável e visível', async () => {
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

  it('Cenário 9: Inserção manual de token deve permitir salvar e chamar o SDK com sucesso', async () => {
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
    fireEvent.change(inputManualToken, { target: { value: '  TOKEN_MANUAL_123  ' } })

    const inputs = screen.getAllByPlaceholderText('••••••••••')
    fireEvent.change(inputs[0], { target: { value: 'OrbisProtocol@2026' } })
    fireEvent.change(inputs[1], { target: { value: 'OrbisProtocol@2026' } })

    const btnSalvar = screen.getByRole('button', { name: /Salvar Nova Senha/i })
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
})
