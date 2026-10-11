import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
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

describe('Nova Home Orbis Protocol - Rodada 1 Completa', () => {
  it('renderiza a Seção de Perfil em Abas com acessibilidade (role="tablist", role="tab", aria-selected, setas) e alvos >= 44px', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Index />
      </MemoryRouter>,
    )

    const tablist = screen.getByRole('tablist', { name: /Perfis de atuação no Orbis Protocol/i })
    expect(tablist).toBeDefined()

    const tabs = screen.getAllByRole('tab')
    expect(tabs).toHaveLength(4)

    const tabEmpresa = screen.getByRole('tab', { name: /Empresa/i })
    const tabComprador = screen.getByRole('tab', { name: /Comprador/i })
    const tabPerito = screen.getByRole('tab', { name: /Perito/i })
    const tabAcp = screen.getByRole('tab', { name: /Associado ACP/i })

    expect(tabEmpresa).toBeDefined()
    expect(tabComprador).toBeDefined()
    expect(tabPerito).toBeDefined()
    expect(tabAcp).toBeDefined()

    // Aba inicial ativa é Empresa
    expect(tabEmpresa.getAttribute('aria-selected')).toBe('true')
    expect(tabComprador.getAttribute('aria-selected')).toBe('false')

    // Alvos >= 44px (min-h-[44px])
    expect(tabEmpresa.className).toContain('min-h-[44px]')
    expect(tabComprador.className).toContain('min-h-[44px]')

    // Conteúdo da aba Empresa
    expect(screen.getByText('Diagnóstico e Gestão de Emissões por NF-e')).toBeDefined()
    const btnEmpresa = screen.getByRole('link', { name: /Iniciar Diagnóstico/i })
    expect(btnEmpresa.getAttribute('href')).toBe('/diagnostico')

    // Navegação por teclado: ArrowRight avança para Comprador
    tabEmpresa.focus()
    fireEvent.keyDown(tabEmpresa, { key: 'ArrowRight' })
    expect(tabComprador.getAttribute('aria-selected')).toBe('true')
    expect(screen.getByText('Conferência Criptográfica de Fornecedores')).toBeDefined()

    // Botão próprio de Comprador
    const btnComprador = screen.getByRole('link', { name: /Verificar Atestado/i })
    expect(btnComprador.getAttribute('href')).toBe('/verificador')

    // Navegação por teclado: ArrowRight avança para Perito
    fireEvent.keyDown(tabComprador, { key: 'ArrowRight' })
    expect(tabPerito.getAttribute('aria-selected')).toBe('true')
    expect(screen.getByText('Apresentação da Revisão Pericial e Credenciamento')).toBeDefined()

    // Botão próprio de Perito
    const btnPerito = screen.getByRole('link', { name: /Apresentação da Revisão Pericial/i })
    expect(btnPerito.getAttribute('href')).toBe('/revisor-f6')

    // Navegação por teclado: ArrowRight avança para Associado ACP
    fireEvent.keyDown(tabPerito, { key: 'ArrowRight' })
    expect(tabAcp.getAttribute('aria-selected')).toBe('true')
    expect(screen.getByText('Portal do Parceiro e Acesso Corporativo ACP')).toBeDefined()

    // Botão próprio de Associado ACP
    const btnAcp = screen.getByRole('link', { name: /Portal do Parceiro/i })
    expect(btnAcp.getAttribute('href')).toBe('/parceiro')
  })

  it('exibe a Lista Regulatória Fixa estática com os 4 itens e sem marquee', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/']}>
        <Index />
      </MemoryRouter>,
    )

    // Título da seção
    expect(screen.getByText('REGULAÇÃO QUE MUDA O JOGO PARA A EMPRESA')).toBeDefined()

    // 4 itens presentes
    expect(screen.getByText('Lei 15.042/2024')).toBeDefined()
    expect(screen.getByText('SBCE — Lei 14.902/2024')).toBeDefined()
    expect(screen.getByText('Programa MOVER/CDVerde')).toBeDefined()
    expect(screen.getByText('IFRS S1/S2')).toBeDefined()

    // Uma linha de impacto para cada item
    expect(
      screen.getByText(
        /Institui o Sistema Brasileiro de Comércio de Emissões com teto e reporte compulsório/i,
      ),
    ).toBeDefined()
    expect(
      screen.getByText(
        /Exige rastreabilidade de materiais e emissões do berço ao túmulo para habilitação a créditos/i,
      ),
    ).toBeDefined()
    expect(
      screen.getByText(
        /Condiciona benefícios de IPI e inovação à comprovação pericial de reciclabilidade/i,
      ),
    ).toBeDefined()
    expect(
      screen.getByText(
        /Torna obrigatória a divulgação auditável de riscos climáticos e inventário de Escopos 1, 2 e 3/i,
      ),
    ).toBeDefined()

    // Sem faixa marquee na home
    expect(container.querySelector('.animate-marquee')).toBeNull()
  })

  it('exibe o Exemplo de Atestado Orbis visivelmente marcado com "Exemplo" e "Documento ilustrativo"', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Index />
      </MemoryRouter>,
    )

    // Selos obrigatórios visíveis
    expect(screen.getByText('Exemplo')).toBeDefined()
    expect(screen.getByText('Documento ilustrativo')).toBeDefined()

    // Termo obrigatório
    expect(screen.getAllByText('Atestado Orbis (com ART/RRT)').length).toBeGreaterThanOrEqual(1)

    // Estrutura do lote de referência sem dados sensíveis
    expect(screen.getByText('VERTEC-IW29-2022')).toBeDefined()
    expect(screen.getByText(/1\.223,22 kg/i)).toBeDefined()
  })

  it('garante AUSÊNCIA dos termos banidos e tecnologias internas na Home', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/']}>
        <Index />
      </MemoryRouter>,
    )

    const textContent = container.textContent || ''

    // Ausência de Extrato C6
    expect(textContent).not.toContain('Extrato C6')

    // Ausência de termos banidos de certificação
    expect(textContent).not.toContain('Certificado Oficial')
    expect(textContent).not.toContain('Selo Oficial')
    expect(textContent).not.toContain('Certificação Orbis')

    // Ausência de termos de tecnologia interna
    expect(textContent).not.toContain('PocketBase')
    expect(textContent).not.toContain('cdv_lotes')
    expect(textContent).not.toContain('cdv_pecas')
  })

  it('garante que o aviso de "metodologia em estruturação — oferta piloto" foi substituído pelo badge canônico com 1 única aparição na home', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/']}>
        <Index />
      </MemoryRouter>,
    )

    const matches = (container.textContent?.match(/Programa piloto · 1 leitura por CNPJ/g) || [])
      .length
    expect(matches).toBe(1)
  })
})
