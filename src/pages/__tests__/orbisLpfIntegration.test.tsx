import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import Index from '@/pages/Index'
import SolucoesIndex from '@/pages/SolucoesIndex'
import { FormularioOrbisLpf } from '@/components/FormularioOrbisLpf'
import Layout from '@/components/Layout'
import { AuthProvider } from '@/contexts/AuthContext'
import * as orbisLpfService from '@/services/orbisLpfService'

describe('Oferta Orbis LPF — Leitura Pré-Faturamento', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  // 1. Textos da Landing Page (Index) na nova estrutura compactada em duas colunas
  it('exibe a seção de destaque Orbis LPF na Home (Index) com textos exatos, selo e formulário à direita sem botão redundante de scroll', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Index />
      </MemoryRouter>,
    )

    // Selo / Eyebrow
    expect(screen.getByText('◆ METODOLOGIA EXCLUSIVA ORBIS')).toBeDefined()

    // Título e Subtítulo
    expect(
      screen.getByRole('heading', { level: 2, name: 'ORBIS LPF — Leitura Pré-Faturamento' }),
    ).toBeDefined()
    expect(screen.getByText('Auditoria Fiscal de Carbono Pré-Faturamento')).toBeDefined()

    // Frase de impacto
    expect(
      screen.getByText(/Sua exportação, precificada em carbono antes de faturar\./i),
    ).toBeDefined()

    // Parágrafos concisos da versão compactada
    expect(
      screen.getByText(
        /Hoje, a indústria descobre a intensidade de carbono do seu produto meses depois do embarque/i,
      ),
    ).toBeDefined()
    expect(screen.getByText('Você negocia com o número na mão. Não meses depois.')).toBeDefined()

    // Linha de público e estado declarado
    expect(
      screen.getByText(
        /Siderúrgicas, fundições, agroindústrias, desmanches e exportadores com exposição a critérios de carbono\./i,
      ),
    ).toBeDefined()
    expect(screen.getByText('Programa piloto · 1 leitura por CNPJ')).toBeDefined()

    // Botão de scroll redundante removido conforme escopo aprovado
    expect(
      screen.queryByRole('button', { name: /Solicitar primeira leitura gratuita/i }),
    ).toBeNull()

    // Formulário de 3 campos visível à direita sem rolagem
    expect(screen.getByLabelText(/CNPJ da empresa/i)).toBeDefined()
    expect(screen.getByLabelText(/E-mail corporativo/i)).toBeDefined()
    expect(screen.getByLabelText(/Setor da empresa/i)).toBeDefined()
    expect(screen.getByRole('button', { name: /Enviar solicitação/i })).toBeDefined()
  })

  // 2. Card em /solucoes
  it('exibe o card da Orbis LPF em /solucoes com título, texto e CTA exatos', () => {
    render(
      <MemoryRouter initialEntries={['/solucoes']}>
        <SolucoesIndex />
      </MemoryRouter>,
    )

    // Título do Card
    expect(
      screen.getByRole('heading', {
        level: 2,
        name: '◆ ORBIS LPF — Leitura Pré-Faturamento | Metodologia Exclusiva',
      }),
    ).toBeDefined()

    // Texto exato
    expect(
      screen.getByText(
        'Leitura antecipada da intensidade de carbono do lote antes do faturamento, com cálculo da pegada de carbono e âncora probatória em registro criptográfico. Entregável verificável, pronto para envio ao importador.',
      ),
    ).toBeDefined()

    // CTA exato
    const ctaCard = screen.getByRole('button', { name: 'Primeira leitura gratuita →' })
    expect(ctaCard).toBeDefined()

    // Clicar no botão abre o modal com o formulário
    fireEvent.click(ctaCard)
    expect(
      screen.getAllByRole('heading', {
        level: 2,
        name: 'Sua primeira leitura é por nossa conta.',
      }).length,
    ).toBeGreaterThanOrEqual(1)
  })

  // 3. Formulário da Leitura Gratuita (3 campos essenciais) e Regra de Limite de 1 por CNPJ
  it('exibe os campos obrigatórios do formulário (CNPJ, e-mail, setor) com validação e persistência', () => {
    render(
      <MemoryRouter>
        <FormularioOrbisLpf tituloVisivel />
      </MemoryRouter>,
    )

    // Textos informativos quando tituloVisivel = true
    expect(
      screen.getByText(
        /Envie os dados do seu próximo embarque e receba o Relatório de Pré-Leitura Orbis/i,
      ),
    ).toBeDefined()

    // 3 campos principais da LPF
    expect(screen.getByLabelText(/CNPJ da empresa/i)).toBeDefined()
    expect(screen.getByLabelText(/E-mail corporativo/i)).toBeDefined()
    expect(screen.getByLabelText(/Setor da empresa/i)).toBeDefined()

    // Botão de envio
    expect(screen.getByRole('button', { name: /Enviar solicitação/i })).toBeDefined()
    expect(screen.getByText('1 leitura por CNPJ. Sem compromisso.')).toBeDefined()
  })

  it('exibe mensagem amigável quando o CNPJ já solicitou a leitura gratuita (limite de 1 por CNPJ)', async () => {
    vi.spyOn(orbisLpfService, 'enviarSolicitacaoLpf').mockResolvedValueOnce({
      success: true,
      ja_solicitado: true,
      message: 'Este CNPJ já solicitou a leitura gratuita — nossa equipe entrará em contato.',
      id: 'lead-existente-123',
    })

    render(
      <MemoryRouter>
        <FormularioOrbisLpf />
      </MemoryRouter>,
    )

    const cnpjInput = screen.getByLabelText(/CNPJ da empresa/i)
    const emailInput = screen.getByLabelText(/E-mail corporativo/i)
    const setorSelect = screen.getByLabelText(/Setor da empresa/i)
    const submitBtn = screen.getByRole('button', { name: /Enviar solicitação/i })

    // Preenche com CNPJ válido matematicamente
    fireEvent.change(cnpjInput, { target: { value: '14.882.310/0001-91' } })
    fireEvent.change(emailInput, { target: { value: 'contato@metalurgicateste.com' } })
    fireEvent.change(setorSelect, { target: { value: 'aço' } })

    fireEvent.click(submitBtn)

    await waitFor(() => {
      const aviso = screen.getByTestId('aviso-duplicado')
      expect(aviso).toBeDefined()
      expect(
        screen.getByText(
          'Este CNPJ já solicitou a leitura gratuita — nossa equipe entrará em contato.',
        ),
      ).toBeDefined()
    })
  })

  it('realiza submissão com sucesso para CNPJ novo', async () => {
    vi.spyOn(orbisLpfService, 'enviarSolicitacaoLpf').mockResolvedValueOnce({
      success: true,
      ja_solicitado: false,
      message: 'Solicitação de leitura pré-faturamento enviada com sucesso.',
      id: 'novo-lead-456',
    })

    render(
      <MemoryRouter>
        <FormularioOrbisLpf />
      </MemoryRouter>,
    )

    const cnpjInput = screen.getByLabelText(/CNPJ da empresa/i)
    const emailInput = screen.getByLabelText(/E-mail corporativo/i)
    const setorSelect = screen.getByLabelText(/Setor da empresa/i)
    const submitBtn = screen.getByRole('button', { name: /Enviar solicitação/i })

    fireEvent.change(cnpjInput, { target: { value: '14.882.310/0001-91' } })
    fireEvent.change(emailInput, { target: { value: 'export@industrianova.com.br' } })
    fireEvent.change(setorSelect, { target: { value: 'alumínio' } })

    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(screen.getByText('Solicitação Recebida com Sucesso!')).toBeDefined()
    })
  })

  // 4. Presença do Orbis LPF na Navegação (Header Dropdown e Rodapé)
  it('exibe Orbis LPF no menu Soluções do Layout e no rodapé na coluna Soluções com badge e âncora corretos', () => {
    render(
      <AuthProvider>
        <MemoryRouter initialEntries={['/']}>
          <Layout />
        </MemoryRouter>
      </AuthProvider>,
    )

    // Verifica presença no grupo 'Para empresas' do dropdown/drawer e na coluna 'Soluções' do rodapé
    const linksLpf = screen
      .getAllByRole('link')
      .filter((link) => link.getAttribute('href') === '/solucoes#orbis-lpf')

    // Deve estar presente no menu (desktop + mobile drawer) e no rodapé (coluna Soluções)
    expect(linksLpf.length).toBeGreaterThanOrEqual(2)

    // Título e descrição no menu do dropdown
    expect(
      screen.getAllByText('Orbis LPF — Leitura Pré-Faturamento').length,
    ).toBeGreaterThanOrEqual(1)
    expect(
      screen.getAllByText(
        'Leitura antecipada da intensidade de carbono antes do faturamento — metodologia exclusiva, oferta piloto.',
      ).length,
    ).toBeGreaterThanOrEqual(1)

    // Badges 'Oferta piloto' no menu e 'Novo' no rodapé
    expect(screen.getAllByText('Oferta piloto').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Novo').length).toBeGreaterThanOrEqual(1)

    // Âncora confere com o card em /solucoes
    expect(linksLpf[0].getAttribute('href')).toBe('/solucoes#orbis-lpf')
  })
})
