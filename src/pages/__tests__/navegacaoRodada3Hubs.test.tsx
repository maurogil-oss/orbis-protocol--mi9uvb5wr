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
import MoverPublicPage from '@/pages/MoverPublicPage'
import MateriaisCriticosPublicPage from '@/pages/MateriaisCriticosPublicPage'
import DcpDemonstracaoPublicaPage from '@/pages/DcpDemonstracaoPublicaPage'
import DcpProdutoPublicoPage from '@/pages/DcpProdutoPublicoPage'
import ModoCorporativoDemoPage from '@/pages/ModoCorporativoDemoPage'
import PortalCorporativo from '@/pages/PortalCorporativo'
import CaseCDVerde from '@/pages/CaseCDVerde'
import CadeiasProdutivasPage from '@/pages/CadeiasProdutivasPage'
import RadarSemanalPublicPage from '@/pages/RadarSemanalPublicPage'
import CentralRadarPage from '@/pages/CentralRadarPage'
import FatoresEmissaoPublicoPage from '@/pages/FatoresEmissaoPublicoPage'
import Verificador from '@/pages/Verificador'
import RadarRegulatorio from '@/pages/RadarRegulatorio'
import ApiDocsCdvPage from '@/pages/ApiDocsCdvPage'
import { ApiDocsNfsPage } from '@/pages/ApiDocsNfsPage'
import EducacaoPublicPage from '@/pages/EducacaoPublicPage'
import PosicaoCreditoCarbonoPage from '@/pages/PosicaoCreditoCarbonoPage'
import PosicaoEscopo3Page from '@/pages/PosicaoEscopo3Page'

// Mock simples de autenticação configurável
let mockAuthState = {
  user: null as any,
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
      expect(
        screen.getByText(/Carbono evitado e crédito de carbono — nossa posição/i),
      ).toBeDefined()
      expect(screen.getByText(/Escopo 3 e insetting — quem reivindica o quê/i)).toBeDefined()
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

  describe('4. Cabeçalho Dinâmico (Exatamente os 5 Destinos Públicos nos Diferentes Estados de Sessão)', () => {
    const validar5Destinos = (navDesktop: HTMLElement) => {
      const links = navDesktop.querySelectorAll('a')
      // Devem existir os 5 destinos mandatórios
      expect(navDesktop.querySelector('a[href="/"]')?.textContent?.trim()).toBe('Início')
      expect(navDesktop.querySelector('a[href="/solucoes"]')?.textContent?.trim()).toBe('Soluções')
      expect(navDesktop.querySelector('a[href="/trilhas"]')?.textContent?.trim()).toBe('Trilhas')
      expect(navDesktop.querySelector('a[href="/protocolo"]')?.textContent?.trim()).toBe(
        'Protocolo',
      )
      expect(navDesktop.querySelector('a[href="/diagnostico"]')?.textContent?.trim()).toBe(
        'Diagnóstico',
      )

      // E a lista de links diretos de navegação de primeiro nível possui exatamente esses 5
      const labels = Array.from(links).map((l) => l.textContent?.trim())
      expect(labels).toEqual(['Início', 'Soluções', 'Trilhas', 'Protocolo', 'Diagnóstico'])
    }

    it('estado de sessão: VISITANTE NÃO AUTENTICADO preserva exatamente os 5 destinos no desktop', () => {
      mockAuthState = {
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
      }

      render(
        <MemoryRouter initialEntries={['/']}>
          <Layout />
        </MemoryRouter>,
      )

      const navDesktop = screen.getByRole('navigation', { name: /navegação principal/i })
      validar5Destinos(navDesktop)

      // CTA Iniciar Diagnóstico presente no header para visitante
      const header = screen.getByRole('banner')
      expect(header.textContent).toContain('Iniciar Diagnóstico')
      expect(header.textContent).toContain('Entrar')
    })

    it('estado de sessão: CLIENTE AUTENTICADO preserva exatamente os 5 destinos no desktop', () => {
      mockAuthState = {
        user: { id: 'usr-c1', email: 'cliente@empresa.com.br' },
        token: 'token-c1',
        isAuthenticated: true,
        isLoading: false,
        role: 'cliente',
        isMaster: false,
        isAdmin: false,
        isAdminOrPerito: false,
        isParceiro: false,
        login: vi.fn(),
        logout: vi.fn(),
        refreshAuth: vi.fn(),
      }

      render(
        <MemoryRouter initialEntries={['/']}>
          <Layout />
        </MemoryRouter>,
      )

      const navDesktop = screen.getByRole('navigation', { name: /navegação principal/i })
      validar5Destinos(navDesktop)

      // Não exibe CTA Iniciar Diagnóstico nem Entrar, exibe Meu Portal
      const header = screen.getByRole('banner')
      expect(header.textContent).not.toContain('Iniciar Diagnóstico')
      expect(header.querySelector('a[href="/login"]')).toBeNull()
      expect(screen.getAllByRole('link', { name: /Meu Portal/i }).length).toBeGreaterThanOrEqual(1)
    })

    it('estado de sessão: GESTÃO / ADMIN AUTENTICADO preserva exatamente os 5 destinos no desktop', () => {
      mockAuthState = {
        user: { id: 'usr-a1', email: 'admin@orbis.com' },
        token: 'token-a1',
        isAuthenticated: true,
        isLoading: false,
        role: 'admin',
        isMaster: false,
        isAdmin: true,
        isAdminOrPerito: true,
        isParceiro: false,
        login: vi.fn(),
        logout: vi.fn(),
        refreshAuth: vi.fn(),
      }

      render(
        <MemoryRouter initialEntries={['/']}>
          <Layout />
        </MemoryRouter>,
      )

      const navDesktop = screen.getByRole('navigation', { name: /navegação principal/i })
      validar5Destinos(navDesktop)

      // Exibe Console
      expect(screen.getAllByRole('link', { name: /Console/i }).length).toBeGreaterThanOrEqual(1)
    })

    it('estado de sessão: PERITO AUTENTICADO preserva exatamente os 5 destinos no desktop', () => {
      mockAuthState = {
        user: { id: 'usr-p1', email: 'perito@crea.com' },
        token: 'token-p1',
        isAuthenticated: true,
        isLoading: false,
        role: 'perito',
        isMaster: false,
        isAdmin: false,
        isAdminOrPerito: true,
        isParceiro: false,
        login: vi.fn(),
        logout: vi.fn(),
        refreshAuth: vi.fn(),
      }

      render(
        <MemoryRouter initialEntries={['/']}>
          <Layout />
        </MemoryRouter>,
      )

      const navDesktop = screen.getByRole('navigation', { name: /navegação principal/i })
      validar5Destinos(navDesktop)

      expect(
        screen.getAllByRole('link', { name: /Revisão Pericial/i }).length,
      ).toBeGreaterThanOrEqual(1)
    })

    it('estado de sessão: PARCEIRO AUTENTICADO preserva exatamente os 5 destinos no desktop', () => {
      mockAuthState = {
        user: { id: 'usr-par1', email: 'parceiro@acp.com' },
        token: 'token-par1',
        isAuthenticated: true,
        isLoading: false,
        role: 'parceiro',
        isMaster: false,
        isAdmin: false,
        isAdminOrPerito: false,
        isParceiro: true,
        login: vi.fn(),
        logout: vi.fn(),
        refreshAuth: vi.fn(),
      }

      render(
        <MemoryRouter initialEntries={['/']}>
          <Layout />
        </MemoryRouter>,
      )

      const navDesktop = screen.getByRole('navigation', { name: /navegação principal/i })
      validar5Destinos(navDesktop)

      expect(
        screen
          .getAllByRole('link', { name: /Meu Portal/i })
          .some((l) => l.getAttribute('href') === '/parceiro'),
      ).toBe(true)
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

    it('presença do BreadcrumbOrbis e acessibilidade em todas as páginas-filhas obrigatórias', () => {
      const paginasFilhas = [
        { nome: 'mover', componente: <MoverPublicPage /> },
        { nome: 'materiais-criticos', componente: <MateriaisCriticosPublicPage /> },
        { nome: 'dcp-demo', componente: <DcpDemonstracaoPublicaPage /> },
        { nome: 'dcp-produto', componente: <DcpProdutoPublicoPage /> },
        { nome: 'corporativo-modo', componente: <ModoCorporativoDemoPage /> },
        { nome: 'corporativo-portal', componente: <PortalCorporativo /> },
        { nome: 'case-cdverde', componente: <CaseCDVerde /> },
        { nome: 'cadeias-produtivas', componente: <CadeiasProdutivasPage /> },
        { nome: 'radar-semanal', componente: <RadarSemanalPublicPage /> },
        { nome: 'central-radar', componente: <CentralRadarPage /> },
        { nome: 'fatores', componente: <FatoresEmissaoPublicoPage /> },
        { nome: 'verificador', componente: <Verificador /> },
        { nome: 'radar-regulatorio', componente: <RadarRegulatorio /> },
        { nome: 'api-docs-cdv', componente: <ApiDocsCdvPage /> },
        { nome: 'api-docs-nfs', componente: <ApiDocsNfsPage /> },
        { nome: 'educacao', componente: <EducacaoPublicPage /> },
        { nome: 'posicao-credito-carbono', componente: <PosicaoCreditoCarbonoPage /> },
        { nome: 'posicao-escopo-3', componente: <PosicaoEscopo3Page /> },
      ]
      paginasFilhas.forEach(({ nome, componente }) => {
        const { unmount } = render(<MemoryRouter initialEntries={['/']}>{componente}</MemoryRouter>)

        const nav = screen.getByRole('navigation', { name: /navegação estrutural/i })
        expect(nav, `BreadcrumbOrbis não encontrado na página-filha ${nome}`).toBeDefined()

        const currentItem = nav.querySelector('[aria-current="page"]')
        expect(
          currentItem,
          `Item ativo aria-current="page" ausente na página ${nome}`,
        ).not.toBeNull()

        unmount()
      })
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
