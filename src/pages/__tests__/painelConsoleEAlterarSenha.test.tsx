import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import PainelCliente from '../PainelCliente'

let mockAuth = {
  user: {
    id: 'usr-cliente-1',
    email: 'cliente@exemplo.com',
    role: 'cliente',
  },
  isMaster: false,
  isAdmin: false,
}

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockAuth,
}))

vi.mock('@/hooks/use-realtime', () => ({
  useRealtime: vi.fn(),
}))

vi.mock('@/lib/pocketbase/client', () => {
  const collectionMock = {
    getFullList: vi.fn().mockResolvedValue([]),
    getList: vi.fn().mockResolvedValue({ items: [], totalItems: 0 }),
  }
  return {
    default: {
      collection: vi.fn(() => collectionMock),
      authStore: {
        model: { id: 'usr-1' },
      },
    },
  }
})

describe('PainelCliente — Acesso ao Console Admin e Alterar Senha', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('NÃO exibe o botão "Console Admin" para perfil cliente regular', () => {
    mockAuth = {
      user: {
        id: 'usr-cliente-1',
        email: 'cliente@exemplo.com',
        role: 'cliente',
      },
      isMaster: false,
      isAdmin: false,
    }

    render(
      <MemoryRouter>
        <PainelCliente />
      </MemoryRouter>,
    )

    expect(screen.queryByText(/Console Admin/i)).toBeNull()
    expect(screen.getByRole('button', { name: /Alterar senha/i })).toBeDefined()
  })

  it('NÃO exibe o botão "Console Admin" para perito técnico', () => {
    mockAuth = {
      user: {
        id: 'usr-perito-1',
        email: 'perito@exemplo.com',
        role: 'perito',
      },
      isMaster: false,
      isAdmin: false,
    }

    render(
      <MemoryRouter>
        <PainelCliente />
      </MemoryRouter>,
    )

    expect(screen.queryByText(/Console Admin/i)).toBeNull()
  })

  it('EXIBE o botão "Console Admin" com link para /admin quando isMaster === true', () => {
    mockAuth = {
      user: {
        id: 'usr-master-1',
        email: 'master@orbis-protocol.com',
        role: 'master',
      },
      isMaster: true,
      isAdmin: false,
    }

    render(
      <MemoryRouter>
        <PainelCliente />
      </MemoryRouter>,
    )

    const botaoConsole = screen.getByRole('link', { name: /Console Admin/i })
    expect(botaoConsole).toBeDefined()
    expect(botaoConsole.getAttribute('href')).toBe('/admin')
  })

  it('EXIBE o botão "Console Admin" com link para /admin quando isAdmin === true', () => {
    mockAuth = {
      user: {
        id: 'usr-admin-1',
        email: 'admin@orbis-protocol.com',
        role: 'admin',
      },
      isMaster: false,
      isAdmin: true,
    }

    render(
      <MemoryRouter>
        <PainelCliente />
      </MemoryRouter>,
    )

    const botaoConsole = screen.getByRole('link', { name: /Console Admin/i })
    expect(botaoConsole).toBeDefined()
    expect(botaoConsole.getAttribute('href')).toBe('/admin')
  })
})
