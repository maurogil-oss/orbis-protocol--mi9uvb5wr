import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, vi } from 'vitest'
import Layout from '@/components/Layout'
import Index from '@/pages/Index'

// Mock simples de autenticação
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    token: '',
    isAuthenticated: false,
    isLoading: false,
    role: 'cliente',
    isAdminOrPerito: false,
    isParceiro: false,
    login: vi.fn(),
    logout: vi.fn(),
    refreshAuth: vi.fn(),
  }),
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

describe('Navegação e Dropdown de Soluções no Layout', () => {
  it('o contêiner do cabeçalho sticky possui z-50 e não possui overflow-hidden que corte o dropdown', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/']}>
        <Layout />
      </MemoryRouter>,
    )

    // O contêiner sticky do cabeçalho deve ter z-50 e não deve ter overflow-hidden
    const stickyContainer = container.querySelector('.sticky.top-0')
    expect(stickyContainer).not.toBeNull()
    expect(stickyContainer?.className).toContain('z-50')
    expect(stickyContainer?.className).not.toContain('overflow-hidden')

    // Apenas a faixa regulatória interna retém overflow-hidden para a rolagem horizontal
    const marqueeBar = container.querySelector('.animate-marquee')?.parentElement
    expect(marqueeBar?.className).toContain('overflow-hidden')
  })

  it('abre o dropdown Soluções ao clicar e exibe itens sobrepostos com z-50', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Layout />
      </MemoryRouter>,
    )

    // Botão Soluções
    const solucoesBtn = screen.getByRole('button', { name: /soluções/i })
    expect(solucoesBtn).toBeDefined()
    expect(solucoesBtn.getAttribute('aria-expanded')).toBe('false')

    // Clica no botão Soluções
    fireEvent.click(solucoesBtn)
    expect(solucoesBtn.getAttribute('aria-expanded')).toBe('true')

    // O menu dropdown deve estar aberto e ter papel menu
    const dropdownMenu = screen.getByRole('menu', { name: /submenu soluções/i })
    expect(dropdownMenu).toBeDefined()
    expect(dropdownMenu.className).toContain('z-50')

    // Itens das soluções visíveis
    expect(screen.getByText('Orbis LPF — Leitura Pré-Faturamento')).toBeDefined()
    expect(screen.getByText('Diagnóstico & Mercado de Carbono (SBCE)')).toBeDefined()
    expect(screen.getByText('Planos & Certificação')).toBeDefined()
    expect(screen.getByText('Portal Corporativo')).toBeDefined()
    expect(screen.getByText('Case CDVerde')).toBeDefined()
    expect(screen.getByText('Descarbonização via MOVER')).toBeDefined()
    expect(screen.getByText('Radar Semanal (Assinatura)')).toBeDefined()

    // Fecha ao pressionar Escape
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('menu', { name: /submenu soluções/i })).toBeNull()
  })

  it('o dropdown Soluções funciona com a landing page (Index) renderizada no Outlet', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <div className="flex flex-col min-h-screen">
          <Layout />
          <Index />
        </div>
      </MemoryRouter>,
    )

    const solucoesBtn = screen.getByRole('button', { name: /soluções/i })
    fireEvent.click(solucoesBtn)

    const dropdownMenu = screen.getByRole('menu', { name: /submenu soluções/i })
    expect(dropdownMenu).toBeDefined()

    // Valida que o link para Orbis LPF no menu funciona e está presente
    const lpfLink = screen.getByRole('menuitem', { name: /orbis lpf/i })
    expect(lpfLink).toBeDefined()
    expect(lpfLink.getAttribute('href')).toBe('/solucoes#orbis-lpf')
  })
})
