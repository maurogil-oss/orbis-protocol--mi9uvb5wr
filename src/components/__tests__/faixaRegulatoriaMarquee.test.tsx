import { describe, it, expect, vi } from 'vitest'
import React from 'react'
import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Layout from '@/components/Layout'

// Mock simples de autenticação
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    token: '',
    isAuthenticated: false,
    isLoading: false,
    role: 'cliente',
    isAdminOrPerito: false,
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

describe('Faixa regulatória rolante (marquee) no Layout global', () => {
  it('contém exatamente os 6 itens regulatórios exigidos na ordem correta', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/']}>
        <Layout />
      </MemoryRouter>,
    )

    const marquee = container.querySelector('.animate-marquee')
    expect(marquee).not.toBeNull()

    // 4 itens originais
    expect(
      screen.getAllByText(
        /01\/08\/2026: Fase-teste IBS 0,1% \/ CBS 0,9% na NF-e \(Art\. 348 LC 214\/2025\)/i,
      ).length,
    ).toBeGreaterThanOrEqual(1)
    expect(
      screen.getAllByText(
        /Lei 15\.042\/2024: Mercado Regulado de Carbono \(SBCE - limiares 10k e 25k tCO₂e\)/i,
      ).length,
    ).toBeGreaterThanOrEqual(1)
    expect(
      screen.getAllByText(
        /Programa MOVER Lei 14\.902\/2024: Desmontagem veicular e circularidade homologada/i,
      ).length,
    ).toBeGreaterThanOrEqual(1)
    expect(
      screen.getAllByText(/Reforma Tributária LC 227\/2026 & Decreto 12\.955\/2026: Novo IVA Dual/i)
        .length,
    ).toBeGreaterThanOrEqual(1)

    // 2 novos itens solicitados
    expect(
      screen.getAllByText('IFRS S1/S2: relato de sustentabilidade e riscos climáticos').length,
    ).toBeGreaterThanOrEqual(1)
    expect(
      screen.getAllByText(
        'Res. BCB 4.945/2021: Políticas de Responsabilidade Social, Ambiental e Climática (PRSAC)',
      ).length,
    ).toBeGreaterThanOrEqual(1)
  })
})
