import React from 'react'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { describe, it, expect, vi } from 'vitest'
import App from '@/App'
import Layout from '@/components/Layout'
import PosicaoCreditoCarbonoPage from '@/pages/PosicaoCreditoCarbonoPage'
import PosicaoEscopo3Page from '@/pages/PosicaoEscopo3Page'
import ProtocoloIndexPage from '@/pages/ProtocoloIndexPage'

// Mock simples de autenticação
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    token: '',
    isAuthenticated: false,
    isLoading: false,
    role: 'cliente',
    isMaster: false,
    isAdmin: false,
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

describe('Páginas de Posição Pública: /posicao-credito-carbono e /posicao-escopo-3', () => {
  describe('1. Página 1 — /posicao-credito-carbono', () => {
    it('renderiza título, declaração direta de que NÃO emite créditos e breadcrumb de filha do Protocolo', () => {
      render(
        <MemoryRouter initialEntries={['/posicao-credito-carbono']}>
          <PosicaoCreditoCarbonoPage />
        </MemoryRouter>,
      )

      // Breadcrumb filha do Protocolo
      const nav = screen.getByRole('navigation', { name: /navegação estrutural/i })
      expect(nav).toBeDefined()
      expect(screen.getByRole('link', { name: 'Protocolo' })).toBeDefined()
      expect(screen.getByText('Carbono evitado e crédito de carbono — nossa posição')).toBeDefined()

      // Título da página
      expect(
        screen.getByRole('heading', {
          level: 1,
          name: /Carbono evitado e crédito de carbono — nossa posição/i,
        }),
      ).toBeDefined()

      // Declaração direta no topo
      expect(
        screen.getByText(/A Orbis NÃO emite, não registra e não comercializa créditos de carbono/i),
      ).toBeDefined()
      expect(
        screen.getByText(/Somos infraestrutura de prova documental \(dMRV\) da economia circular/i),
      ).toBeDefined()
    })

    it('exibe a etiqueta obrigatória de indicador preliminar sem desvios', () => {
      render(
        <MemoryRouter initialEntries={['/posicao-credito-carbono']}>
          <PosicaoCreditoCarbonoPage />
        </MemoryRouter>,
      )

      expect(
        screen.getByText(
          'preliminar — não substitui laudo pericial, não é crédito negociável, não é ativo do SBCE',
        ),
      ).toBeDefined()
    })

    it('detalha Verra S3S (V1 agro e concreto, reciclagem sem metodologia) e posiciona a ponte', () => {
      render(
        <MemoryRouter initialEntries={['/posicao-credito-carbono']}>
          <PosicaoCreditoCarbonoPage />
        </MemoryRouter>,
      )

      expect(screen.getByText(/Verra Scope 3 Standard \(S3S\)/i)).toBeDefined()
      expect(
        screen.getByText(
          /Versão 1\.0 \(V1\) do programa contempla exclusivamente metodologias para agricultura e concreto/i,
        ),
      ).toBeDefined()
      expect(
        screen.getByText(
          /reciclagem industrial e desmontagem veicular ainda não possui metodologia própria/i,
        ),
      ).toBeDefined()
      expect(
        screen.getByText(/não prometemos crédito de reciclagem nem geração de S3U/i),
      ).toBeDefined()

      // Quando faz / não faz sentido
      expect(screen.getByText(/Quando NÃO faz sentido buscar registro externo/i)).toBeDefined()
      expect(screen.getByText(/Quando faz sentido buscar registro externo/i)).toBeDefined()
    })

    it('contém FAQ com as 4+ perguntas mandatórias e respostas honestas', () => {
      render(
        <MemoryRouter initialEntries={['/posicao-credito-carbono']}>
          <PosicaoCreditoCarbonoPage />
        </MemoryRouter>,
      )

      expect(screen.getByText(/Esse documento vale como crédito de carbono\?/i)).toBeDefined()
      expect(screen.getByText(/Posso vender o carbono evitado do meu lote\?/i)).toBeDefined()
      expect(
        screen.getByText(/O que falta para virar crédito de carbono de mercado\?/i),
      ).toBeDefined()
      expect(screen.getByText(/Quem valida os cálculos e dados hoje\?/i)).toBeDefined()
    })

    it('possui cross-link apontando para /posicao-escopo-3', () => {
      render(
        <MemoryRouter initialEntries={['/posicao-credito-carbono']}>
          <PosicaoCreditoCarbonoPage />
        </MemoryRouter>,
      )

      const linkEscopo3 = screen.getByRole('link', { name: /Escopo 3 e insetting/i })
      expect(linkEscopo3.getAttribute('href')).toBe('/posicao-escopo-3')
    })
  })

  describe('2. Página 2 — /posicao-escopo-3', () => {
    it('renderiza título, insetting (GHG Protocol Scope 3 & ISO 14064-1) e breadcrumb', () => {
      render(
        <MemoryRouter initialEntries={['/posicao-escopo-3']}>
          <PosicaoEscopo3Page />
        </MemoryRouter>,
      )

      // Breadcrumb filha do Protocolo
      const nav = screen.getByRole('navigation', { name: /navegação estrutural/i })
      expect(nav).toBeDefined()
      expect(screen.getByRole('link', { name: 'Protocolo' })).toBeDefined()
      expect(screen.getByText('Escopo 3 e insetting — quem reivindica o quê')).toBeDefined()

      // Título da página
      expect(
        screen.getByRole('heading', {
          level: 1,
          name: /Escopo 3 e insetting — quem reivindica o quê/i,
        }),
      ).toBeDefined()

      // GHG Protocol e ISO 14064-1
      expect(
        screen.getByText(/GHG Protocol Corporate Value Chain \(Scope 3\) Standard/i),
      ).toBeDefined()
      expect(screen.getAllByText(/ISO 14064-1/i).length).toBeGreaterThanOrEqual(1)
    })

    it('contém a Matriz de Titularidade (compradora Cat 1, montadora Cat 12, fornecedor não reivindica)', () => {
      render(
        <MemoryRouter initialEntries={['/posicao-escopo-3']}>
          <PosicaoEscopo3Page />
        </MemoryRouter>,
      )

      expect(
        screen.getByText(/Matriz de Titularidade: quem reporta e quem reivindica o quê/i),
      ).toBeDefined()
      expect(
        screen.getByText(/Escopo 3 • Categoria 1 \(Bens e Serviços Adquiridos\)/i),
      ).toBeDefined()
      expect(
        screen.getByText(
          /Escopo 3 • Categoria 12 \(Tratamento de Fim de Vida de Produtos Vendidos\)/i,
        ),
      ).toBeDefined()
      expect(screen.getByText(/NÃO reivindica nem vende a redução/i)).toBeDefined()
      expect(screen.getByText(/argumento comercial/i)).toBeDefined()
    })

    it('apresenta a guarda de uso único e a marca RETIRED_FOR_INSETTING', () => {
      render(
        <MemoryRouter initialEntries={['/posicao-escopo-3']}>
          <PosicaoEscopo3Page />
        </MemoryRouter>,
      )

      expect(screen.getByText(/Uso único: a guarda criptográfica de dupla contagem/i)).toBeDefined()
      expect(screen.getAllByText(/RETIRED_FOR_INSETTING/i).length).toBeGreaterThanOrEqual(1)
      expect(screen.getByText(/A claim é estritamente única/i)).toBeDefined()
    })

    it('descreve os componentes do Dossiê de Escopo 3 com transparência sobre polímeros e fatores DM-ORB-001', () => {
      render(
        <MemoryRouter initialEntries={['/posicao-escopo-3']}>
          <PosicaoEscopo3Page />
        </MemoryRouter>,
      )

      expect(screen.getByText(/O que a Orbis entrega: o "Dossiê de Escopo 3"/i)).toBeDefined()
      expect(screen.getByText(/IAI 14,40/i)).toBeDefined()
      expect(screen.getByText(/worldsteel 2,18/i)).toBeDefined()
      expect(screen.getByText(/ICA 4,10/i)).toBeDefined()
      expect(screen.getByText(/pendente de verificação de fonte/i)).toBeDefined()
      expect(screen.getByText(/Cadeia de custódia SHA-256/i)).toBeDefined()
    })

    it('trata honestidade sobre verificação independente (Audit Grade ≠ ISO 14064-3 de terceira parte)', () => {
      render(
        <MemoryRouter initialEntries={['/posicao-escopo-3']}>
          <PosicaoEscopo3Page />
        </MemoryRouter>,
      )

      expect(
        screen.getByText(
          /Auditoria interna \(Audit Grade\) não substitui verificação independente/i,
        ),
      ).toBeDefined()
      expect(screen.getByText(/ABNT NBR ISO 14064-3/i)).toBeDefined()
      expect(
        screen.getAllByText(/Atestado de Conformidade Orbis \(com ART\/RRT\)/i).length,
      ).toBeGreaterThanOrEqual(1)
    })

    it('possui cross-link apontando para /posicao-credito-carbono', () => {
      render(
        <MemoryRouter initialEntries={['/posicao-escopo-3']}>
          <PosicaoEscopo3Page />
        </MemoryRouter>,
      )

      const linkCredito = screen.getByRole('link', { name: /Posição sobre crédito de carbono/i })
      expect(linkCredito.getAttribute('href')).toBe('/posicao-credito-carbono')
    })
  })

  describe('3. Rigor Terminológico (Ausência Estrita de Termos Banidos)', () => {
    it('Página 1 não contém "Selo Oficial", "Certificado" ou "Certificação" como produto da Orbis nem "homologado"', () => {
      const { container } = render(
        <MemoryRouter initialEntries={['/posicao-credito-carbono']}>
          <PosicaoCreditoCarbonoPage />
        </MemoryRouter>,
      )

      const texto = container.textContent || ''
      expect(texto).not.toContain('Selo Oficial')
      expect(texto).not.toContain('Certificado Orbis')
      expect(texto).not.toContain('Certificação Orbis')
      expect(texto).not.toContain('homologado pela Orbis')
      // Usa termos canônicos
      expect(texto).toContain('Atestado de Conformidade Orbis (com ART/RRT)')
      expect(texto).toContain('Atestado Orbis')
    })

    it('Página 2 não contém "Selo Oficial", "certificado de redução" como produto nem "homologado"', () => {
      const { container } = render(
        <MemoryRouter initialEntries={['/posicao-escopo-3']}>
          <PosicaoEscopo3Page />
        </MemoryRouter>,
      )

      const texto = container.textContent || ''
      expect(texto).not.toContain('Selo Oficial')
      expect(texto).not.toContain('certificado de redução de carbono')
      expect(texto).not.toContain('Certificado Orbis')
      expect(texto).not.toContain('Certificação Orbis')
      // Garante que explicita a vedação
      expect(texto).toContain('Nunca chamamos nosso produto de "certificado de redução de carbono"')
      expect(texto).toContain('ponte automática para Verra')
    })
  })

  describe('4. Integração no Rodapé (Layout.tsx)', () => {
    it('coluna Verificação do rodapé contém os links para /posicao-credito-carbono e /posicao-escopo-3', () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <Layout />
        </MemoryRouter>,
      )

      const linkCreditoRodape = screen.getByRole('link', {
        name: 'Posição sobre crédito de carbono',
      })
      expect(linkCreditoRodape).toBeDefined()
      expect(linkCreditoRodape.getAttribute('href')).toBe('/posicao-credito-carbono')

      const linkEscopo3Rodape = screen.getByRole('link', {
        name: 'Escopo 3 e insetting',
      })
      expect(linkEscopo3Rodape).toBeDefined()
      expect(linkEscopo3Rodape.getAttribute('href')).toBe('/posicao-escopo-3')
    })
  })

  describe('5. Roteamento e Hub Protocolo', () => {
    it('o hub /protocolo lista as 2 novas páginas-filhas em DESTINOS_PROTOCOLO e no resumo leigo', () => {
      render(
        <MemoryRouter initialEntries={['/protocolo']}>
          <ProtocoloIndexPage />
        </MemoryRouter>,
      )

      expect(
        screen.getByRole('link', {
          name: /Carbono evitado e crédito de carbono — nossa posição/i,
        }),
      ).toBeDefined()

      expect(
        screen.getByRole('link', {
          name: /Escopo 3 e insetting — quem reivindica o quê/i,
        }),
      ).toBeDefined()

      // Links no resumo leigo
      expect(screen.getByRole('link', { name: /Posição sobre créditos/i })).toBeDefined()
      expect(
        screen.getAllByRole('link', { name: /Escopo 3 e insetting/i }).length,
      ).toBeGreaterThanOrEqual(1)
    })

    it('as rotas /posicao-credito-carbono e /posicao-escopo-3 respondem na árvore do App', () => {
      const { unmount } = render(
        <MemoryRouter initialEntries={['/posicao-credito-carbono']}>
          <App />
        </MemoryRouter>,
      )

      expect(
        screen.getByRole('heading', {
          level: 1,
          name: /Carbono evitado e crédito de carbono — nossa posição/i,
        }),
      ).toBeDefined()

      unmount()

      render(
        <MemoryRouter initialEntries={['/posicao-escopo-3']}>
          <App />
        </MemoryRouter>,
      )

      expect(
        screen.getByRole('heading', {
          level: 1,
          name: /Escopo 3 e insetting — quem reivindica o quê/i,
        }),
      ).toBeDefined()
    })
  })
})
