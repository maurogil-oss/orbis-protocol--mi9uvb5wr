import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, vi } from 'vitest'
import SolucoesIndex from '@/pages/SolucoesIndex'
import ProtocoloIndexPage from '@/pages/ProtocoloIndexPage'
import TrilhasIndex from '@/pages/TrilhasIndex'
import Layout from '@/components/Layout'
import BreadcrumbOrbis from '@/components/BreadcrumbOrbis'
import BlocoOutrasSolucoes from '@/components/BlocoOutrasSolucoes'

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

describe('Rodada 3: Árvore de Hubs da Vitrine Pública', () => {
  describe('1. Hub Soluções (/solucoes)', () => {
    it('renderiza árvore de decisão interativa com perguntas-ramo e solução recomendada', () => {
      render(
        <MemoryRouter initialEntries={['/solucoes']}>
          <SolucoesIndex />
        </MemoryRouter>,
      )

      // Título da árvore de decisão
      expect(screen.getByText('Qual é o desafio da sua empresa?')).toBeDefined()
      expect(screen.getByText(/ÁRVORE DE DECISÃO DO ORBIS PROTOCOL/i)).toBeDefined()

      // Perguntas-ramo mandatórias
      expect(screen.getByText(/Sua empresa recicla ou gera resíduo industrial\?/i)).toBeDefined()
      expect(
        screen.getByText(/Compra ou processa aço, alumínio, cobre ou polímeros\?/i),
      ).toBeDefined()
      expect(screen.getByText(/Precisa atender o Programa MOVER ou CDVerde\?/i)).toBeDefined()
      expect(
        screen.getByText(/Precisa comprovar conformidade tributária na reforma/i),
      ).toBeDefined()

      // Troca de ramo ao clicar na pergunta de materiais críticos
      const btnMetais = screen.getByRole('button', {
        name: /Compra ou processa aço, alumínio, cobre ou polímeros\?/i,
      })
      fireEvent.click(btnMetais)

      // Painel de resolução atualizado
      expect(
        screen.getByText(/Mineração Urbana & Materiais Críticos \(Passaporte DCP\)/i),
      ).toBeDefined()
      expect(screen.getByRole('link', { name: /Acessar Passaporte DCP/i })).toBeDefined()
    })

    it('utiliza componentes de src/components/hub-solucoes/ (3 Eixos e Circularidade/DPP)', () => {
      const { container } = render(
        <MemoryRouter initialEntries={['/solucoes']}>
          <SolucoesIndex />
        </MemoryRouter>,
      )

      // Seção 3 Eixos Narrativos
      expect(container.querySelector('#tres-eixos')).not.toBeNull()
      expect(screen.getByText('Os 3 Eixos Narrativos da Arquitetura')).toBeDefined()
      expect(screen.getByText(/Logística Reversa & Balanço de Massa \(PNRS\)/i)).toBeDefined()

      // Seção Circularidade e DPP
      expect(container.querySelector('#circularidade-dpp')).not.toBeNull()
      expect(
        screen.getByText(/Passaporte Digital de Produto \(DPP\) & Circularidade/i),
      ).toBeDefined()

      // Entradas "em estruturação" sem promessa de produto/prazo
      const badgesEstruturacao = screen.getAllByText(/em estruturação/i)
      expect(badgesEstruturacao.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('2. Hub Protocolo (/protocolo)', () => {
    it('renderiza resumo leigo da metodologia com os 3 pontos obrigatórios e links das filhas', () => {
      render(
        <MemoryRouter initialEntries={['/protocolo']}>
          <ProtocoloIndexPage />
        </MemoryRouter>,
      )

      // Título do Hub
      expect(screen.getByText('O Protocolo Orbis')).toBeDefined()
      expect(screen.getByText(/HUB METODOLÓGICO & REGULATÓRIO/i)).toBeDefined()

      // Resumo Leigo
      expect(screen.getByText(/Como calculamos a pegada e por que ela é defensável/i)).toBeDefined()
      expect(screen.getByText(/A partir das notas reais, não de estimativas/i)).toBeDefined()
      expect(screen.getByText(/De onde vêm os fatores de emissão/i)).toBeDefined()
      expect(screen.getByText(/O "evitado" é indicador preliminar/i)).toBeDefined()
      expect(screen.getByText(/não constitui crédito de carbono negociável/i)).toBeDefined()

      // Links para páginas-filhas
      expect(screen.getByText(/Metodologia & Fatores Oficiais \(DM-ORB-001\)/i)).toBeDefined()
      expect(screen.getByText(/Consultar Atestado \(Verificador Público\)/i)).toBeDefined()
      expect(screen.getByText(/Radar Regulatório/i)).toBeDefined()
      expect(screen.getByText(/API de Ingestão CDV v2/i)).toBeDefined()
      expect(screen.getByText(/API de NFs v1/i)).toBeDefined()
    })
  })

  describe('3. Hub Trilhas (/trilhas)', () => {
    it('absorve Orbis Educação com destaque e link para credenciamento escolar', () => {
      render(
        <MemoryRouter initialEntries={['/trilhas']}>
          <TrilhasIndex />
        </MemoryRouter>,
      )

      expect(screen.getByText('Trilhas de Formação & Habilitação')).toBeDefined()
      expect(screen.getByText(/Orbis Educação — Sustentabilidade nas Escolas/i)).toBeDefined()
      expect(screen.getByRole('link', { name: /Conhecer Orbis Educação/i })).toBeDefined()
      expect(screen.getByRole('link', { name: /Credenciar Escola/i })).toBeDefined()
    })
  })

  describe('4. Cabeçalho Dinâmico (5 Destinos Públicos)', () => {
    it('cabeçalho renderiza exatamente os 5 destinos da vitrine pública no desktop', () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <Layout />
        </MemoryRouter>,
      )

      const navDesktop = screen.getByRole('navigation', { name: /navegação principal/i })

      // 1. Início
      expect(navDesktop.querySelector('a[href="/"]')?.textContent).toBe('Início')
      // 2. Soluções
      expect(navDesktop.querySelector('a[href="/solucoes"]')?.textContent).toBe('Soluções')
      // 3. Trilhas
      expect(navDesktop.querySelector('a[href="/trilhas"]')?.textContent).toBe('Trilhas')
      // 4. Protocolo
      expect(navDesktop.querySelector('a[href="/protocolo"]')?.textContent).toBe('Protocolo')
      // 5. Diagnóstico
      expect(navDesktop.querySelector('a[href="/diagnostico"]')?.textContent).toBe('Diagnóstico')
    })
  })

  describe('5. Breadcrumb & Bloco de Outras Soluções Reutilizáveis', () => {
    it('BreadcrumbOrbis é acessível com aria-label, estrutura de lista e aria-current', () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <BreadcrumbOrbis
            items={[{ label: 'Soluções', href: '/solucoes' }, { label: 'Programa MOVER' }]}
          />
        </MemoryRouter>,
      )

      const nav = screen.getByRole('navigation', { name: /navegação estrutural/i })
      expect(nav).toBeDefined()

      const listItems = nav.querySelectorAll('li')
      expect(listItems.length).toBe(3) // Home + Soluções + Programa MOVER

      const currentItem = screen.getByText('Programa MOVER')
      expect(currentItem.getAttribute('aria-current')).toBe('page')
    })

    it('BlocoOutrasSolucoes filtra a solução ativa atual e exibe soluções alternativas', () => {
      render(
        <MemoryRouter initialEntries={['/mover']}>
          <BlocoOutrasSolucoes solucaoAtualHref="/mover" maxItens={4} />
        </MemoryRouter>,
      )

      expect(screen.getByText('Outras Soluções do Orbis Protocol')).toBeDefined()
      // A solução atual (/mover) não deve aparecer repetida nos cards filhos
      expect(screen.queryByText('Programa MOVER & CDVerde')).toBeNull()
      // Outras soluções devem estar presentes
      expect(screen.getByText('Mineração Urbana & Materiais Críticos')).toBeDefined()
    })
  })
})
