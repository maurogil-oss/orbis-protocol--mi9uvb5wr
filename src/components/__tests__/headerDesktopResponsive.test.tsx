import React from 'react'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, vi } from 'vitest'
import Layout from '@/components/Layout'

// Mock simples de autenticação
let mockAuthState = {
  user: null as any,
  token: '',
  isAuthenticated: false,
  isLoading: false,
  role: 'cliente',
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

describe('Header Desktop Layout Responsivo & Anti-Sobreposição', () => {
  it('o logotipo possui shrink-0 e whitespace-nowrap, garantindo que nunca seja sobreposto ou espremido pela navegação', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/']}>
        <Layout />
      </MemoryRouter>,
    )

    const brandLink = screen.getByTitle('Orbis Protocol')
    expect(brandLink).toBeDefined()
    // Brand link deve ter shrink-0 para não comprimir perante outros elementos
    expect(brandLink.className).toContain('shrink-0')

    const brandName = container.querySelector('header a[title="Orbis Protocol"] span.font-heading')
    expect(brandName?.className).toContain('whitespace-nowrap')
    expect(brandName?.className).not.toContain('truncate')

    const brandTagline = container.querySelector('header a[title="Orbis Protocol"] span.uppercase')
    expect(brandTagline?.className).toContain('whitespace-nowrap')
    expect(brandTagline?.className).not.toContain('truncate')
  })

  it('todos os itens de navegação e botões no cabeçalho desktop usam whitespace-nowrap para não quebrar texto', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/']}>
        <Layout />
      </MemoryRouter>,
    )

    const header = container.querySelector('header')
    expect(header).not.toBeNull()

    // Botões CTA do cabeçalho
    const diagnosticoBtn = header?.querySelector('a[href="/diagnostico"]')
    expect(diagnosticoBtn).not.toBeNull()
    expect(diagnosticoBtn?.className).toContain('whitespace-nowrap')
    expect(diagnosticoBtn?.className).toContain('shrink-0')

    const demoBtn = header?.querySelector('a[href="/demo"]')
    expect(demoBtn).not.toBeNull()
    expect(demoBtn?.className).toContain('whitespace-nowrap')
    expect(demoBtn?.className).toContain('shrink-0')

    // Links de navegação desktop
    const navLinks = header?.querySelectorAll('nav a')
    navLinks?.forEach((link) => {
      expect(link.className).toContain('whitespace-nowrap')
    })
  })

  it('no modo autenticado (/painel), botões e link Painel mantêm shrink-0 e whitespace-nowrap', () => {
    mockAuthState = {
      ...mockAuthState,
      isAuthenticated: true,
      user: { id: 'usr-1', email: 'gestor@empresa.com.br', name: 'Gestor Alfa' },
    }

    const { container } = render(
      <MemoryRouter initialEntries={['/painel']}>
        <Layout />
      </MemoryRouter>,
    )

    const header = container.querySelector('header')
    const painelLink = header?.querySelector('a[href="/painel"]')
    expect(painelLink).not.toBeNull()
    expect(painelLink?.className).toContain('whitespace-nowrap')
    expect(painelLink?.className).toContain('shrink-0')

    const logoutBtn = header?.querySelector('button[title="Sair"]')
    expect(logoutBtn).not.toBeNull()
    expect(logoutBtn?.className).toContain('shrink-0')
  })
})
