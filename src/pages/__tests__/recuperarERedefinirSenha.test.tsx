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

  it('RedefinirSenhaPage deve ler ?token= da URL e alertar se o token estiver ausente', () => {
    render(
      <MemoryRouter initialEntries={['/redefinir-senha']}>
        <AuthProvider>
          <RedefinirSenhaPage />
        </AuthProvider>
      </MemoryRouter>,
    )

    expect(screen.getByText(/REDEFINIR SENHA/i)).toBeDefined()
    expect(screen.getByText(/Token de redefinição não fornecido ou link incompleto/i)).toBeDefined()
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

  it('RedefinirSenhaPage JAMAIS deve exibir sucesso falso se o backend rejeitar a redefinição', async () => {
    const mockConfirmPasswordReset = vi
      .fn()
      .mockRejectedValue(new Error('Token inválido ou expirado.'))
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
      // Deve exibir erro explícito retornado pelo backend
      expect(screen.getByText(/Token inválido ou expirado/i)).toBeDefined()
      // NUNCA deve exibir tela de sucesso falso
      expect(screen.queryByText(/Senha Redefinida com Sucesso!/i)).toBeNull()
    })
  })
})
