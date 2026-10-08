import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Diagnostico from '../Diagnostico'
import * as AuthContext from '@/contexts/AuthContext'

vi.mock('@/contexts/AuthContext', async () => {
  const actual = await vi.importActual<typeof AuthContext>('@/contexts/AuthContext')
  return {
    ...actual,
    useAuth: vi.fn(),
  }
})

describe('Diagnostico - Micro-textos Explicativos nos Campos (Confiança Visível)', () => {
  it('deve renderizar os micro-textos explicando o porquê de cada dado pedido no Step 1', () => {
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      login: vi.fn(),
      user: null,
      token: '',
      isAuthenticated: false,
      isLoading: false,
      role: 'cliente',
      isMaster: false,
      isAdmin: false,
      isFinanceiro: false,
      isFinanceiroLeitor: false,
      isPerito: false,
      isController: false,
      isParceiro: false,
      logout: vi.fn(),
      refreshAuth: vi.fn(),
      isContaPendente: false,
      isContaRejeitada: false,
      requestPasswordReset: vi.fn(),
      confirmPasswordReset: vi.fn(),
      requestVerification: vi.fn().mockResolvedValue({ success: true }),
      confirmVerification: vi.fn().mockResolvedValue({ success: true }),    })

    render(
      <MemoryRouter initialEntries={['/diagnostico']}>
        <Diagnostico />
      </MemoryRouter>,
    )

    // Micro-texto do CNPJ
    expect(
      screen.getByText(
        /Usaremos seu CNPJ para identificar sua empresa e sugerir sua trilha regulatória/i,
      ),
    ).toBeDefined()

    // Micro-texto da Razão Social
    expect(
      screen.getByText(/Identifica a pessoa jurídica na emissão do laudo técnico/i),
    ).toBeDefined()

    // Micro-texto do E-mail Corporativo
    expect(
      screen.getByText(/Para criar seu acesso seguro e enviar o diagnóstico completo/i),
    ).toBeDefined()

    // Micro-texto do WhatsApp
    expect(
      screen.getByText(/Canal direto para envio do protocolo e contato operacional/i),
    ).toBeDefined()
  })
})
