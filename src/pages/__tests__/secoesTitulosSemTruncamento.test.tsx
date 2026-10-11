import React from 'react'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, vi } from 'vitest'
import Index from '@/pages/Index'

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

describe('Landing Page - Verificação de ausência de truncamento nos 4 títulos de seção', () => {
  const TITULOS_ESPERADOS = [
    'DA NOTA FISCAL AO DOCUMENTO VERIFICÁVEL',
    'COMO O ORBIS PROTOCOLO ATENDE O SEU PERFIL',
    'REGULAÇÃO QUE MUDA O JOGO PARA A EMPRESA',
    'CASO REAL DE PRODUÇÃO: LOTE VERTEC',
  ]

  it('renderiza os 4 títulos completos e sem classes de truncamento (overflow-hidden, text-ellipsis)', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Index />
      </MemoryRouter>,
    )

    for (const textoTitulo of TITULOS_ESPERADOS) {
      const heading = screen.getByText(textoTitulo)
      expect(heading).toBeDefined()

      // Proibido truncar texto
      expect(heading.className).not.toContain('text-ellipsis')
      expect(heading.className).not.toContain('overflow-hidden')
      expect(heading.className).not.toContain('truncate')

      // Escalonamento responsivo fluído
      expect(heading.className).toContain('text-[clamp(')

      // Em telas >= 480px deve ter min-[480px]:whitespace-nowrap para linha única limpa
      expect(heading.className).toContain('min-[480px]:whitespace-nowrap')

      // Text-wrap balance para caso extremo estreito (< 480px)
      expect(heading.className).toContain('[text-wrap:balance]')
    }
  })

  it('garante que cada título compartilha alinhamento coerente com seu subtítulo/parágrafo introdutório', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Index />
      </MemoryRouter>,
    )

    // Seção 1: Da nota fiscal ao documento verificável -> centralizado com subtítulo
    const h2Secao1 = screen.getByText('DA NOTA FISCAL AO DOCUMENTO VERIFICÁVEL')
    expect(h2Secao1.className).toContain('text-center')
    const pSecao1 = screen.getByText(/Transforme documentos fiscais rotineiros em comprovação/i)
    expect(pSecao1.className).toContain('text-center')

    // Seção 2: Como o Orbis Protocolo atende o seu perfil -> centralizado com subtítulo
    const h2Secao2 = screen.getByText('COMO O ORBIS PROTOCOLO ATENDE O SEU PERFIL')
    expect(h2Secao2.className).toContain('text-center')
    const pSecao2 = screen.getByText(/Selecione o seu papel na cadeia de valor/i)
    expect(pSecao2.className).toContain('text-center')

    // Seção 3: Regulação que muda o jogo para a empresa -> centralizado com subtítulo
    const h2Secao3 = screen.getByText('REGULAÇÃO QUE MUDA O JOGO PARA A EMPRESA')
    expect(h2Secao3.className).toContain('text-center')
    const pSecao3 = screen.getByText(/As quatro diretrizes que tornam a auditoria documental/i)
    expect(pSecao3.className).toContain('text-center')

    // Seção 4: Caso real de produção: Lote VERTEC -> alinhado à esquerda com subtítulo
    const h2Secao4 = screen.getByText('CASO REAL DE PRODUÇÃO: LOTE VERTEC')
    expect(h2Secao4.className).toContain('text-left')
    const pSecao4 = screen.getByText(
      /Primeiro lote real gravado no protocolo dMRV \(lote VERTEC-IW29-2022\)/i,
    )
    expect(pSecao4.className).toContain('text-left')
  })
})
