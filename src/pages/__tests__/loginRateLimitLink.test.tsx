import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Login from '../Login'
import * as AuthContext from '@/contexts/AuthContext'

vi.mock('@/contexts/AuthContext', async () => {
  const actual = await vi.importActual<typeof AuthContext>('@/contexts/AuthContext')
  return {
    ...actual,
    useAuth: vi.fn(),
  }
})

describe('Login - Padrão de Confiança Visível e Link Esqueci Minha Senha', () => {
  it('ao exibir mensagem de erro ou bloqueio de rate-limit, deve incluir link "Esqueci minha senha" para /recuperar-senha', async () => {
    const mockLogin = vi.fn().mockResolvedValue({
      success: false,
      error:
        'Credenciais inválidas ou limite temporário de tentativas excedido. Se você errou a senha recentemente, aguarde alguns instantes antes de tentar novamente.',
    })

    vi.mocked(AuthContext.useAuth).mockReturnValue({
      login: mockLogin,
      user: null,
      token: '',
      isAuthenticated: false,
      isLoading: false,
      role: 'cliente',
      isMaster: false,
      isAdmin: false,
      isFinanceiro: false,
      isFinanceiroLeitor: false,
      isController: false,
      isClienteAcp: false,
      isParceiro: false,
      isAdminOrPerito: false,
      isGestaoPendente: false,
      logout: vi.fn(),
      refreshAuth: vi.fn(),
      requestPasswordReset: vi.fn(),
      confirmPasswordReset: vi.fn(),
    })

    render(
      <MemoryRouter initialEntries={['/login']}>
        <Login />
      </MemoryRouter>,
    )

    const emailInput = screen.getByPlaceholderText(/seu\.email@empresa\.com\.br/i)
    const passInput = screen.getByPlaceholderText('••••••••')
    const submitBtn = screen.getByRole('button', { name: /Entrar na Plataforma/i })

    fireEvent.change(emailInput, { target: { value: 'maurog1@hotmail.com' } })
    fireEvent.change(passInput, { target: { value: 'SenhaErrada123!' } })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      // Deve exibir a mensagem de erro/bloqueio
      const alert = screen.getByRole('alert')
      expect(alert.textContent).toContain('Credenciais inválidas ou limite temporário')

      // Deve incluir link para /recuperar-senha com o texto "Esqueci minha senha"
      const linkEsqueci = screen.getByRole('link', { name: /Esqueci minha senha/i })
      expect(linkEsqueci).toBeDefined()
      expect(linkEsqueci.getAttribute('href')).toBe('/recuperar-senha')
    })
  })
})
