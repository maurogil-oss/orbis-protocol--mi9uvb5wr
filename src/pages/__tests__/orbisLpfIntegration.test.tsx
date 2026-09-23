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

  // 1. Textos da Landing Page (Index)
  it('exibe a seção de destaque Orbis LPF na Home (Index) com textos exatos, selo e microcopy', () => {
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

    // Parágrafos exatos
    expect(
      screen.getByText(
        /Hoje, a indústria descobre a intensidade de carbono do seu produto meses depois do embarque/i,
      ),
    ).toBeDefined()
    expect(
      screen.getByText(
        /O Orbis inverte a ordem\. No momento do pedido de venda, calculamos a intensidade de carbono estimada do lote/i,
      ),
    ).toBeDefined()
    expect(screen.getByText('Você negocia com o número na mão. Não meses depois.')).toBeDefined()

    // Linha de público e estado declarado
    expect(
      screen.getByText(
        /Para siderúrgicas, fundições, agroindústrias, desmanches e montadoras com exportação ou exposição a critérios de intensidade de carbono\./i,
      ),
    ).toBeDefined()
    expect(screen.getByText('[Estado: metodologia em estruturação — oferta piloto]')).toBeDefined()

    // CTA primário e microcopy
    const botaoCta = screen.getByRole('button', { name: /Solicitar primeira leitura gratuita/i })
    expect(botaoCta).toBeDefined()
    expect(screen.getByText('1 leitura por CNPJ. Sem compromisso.')).toBeDefined()

    // Formulário do item 3 presente na página
    expect(
      screen.getByRole('heading', { level: 2, name: 'Sua primeira leitura é por nossa conta.' }),
    ).toBeDefined()
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

  // 3. Formulário da Leitura Gratuita e Regra de Limite de 1 por CNPJ
  it('exibe os campos obrigatórios do formulário e textos "O que você recebe" e "Como funciona"', () => {
    render(
      <MemoryRouter>
        <FormularioOrbisLpf />
      </MemoryRouter>,
    )

    // Textos informativos
    expect(
      screen.getByText(
        /Envie os dados do seu próximo embarque e receba o Relatório de Pré-Leitura Orbis/i,
      ),
    ).toBeDefined()

    expect(
      screen.getByText('Intensidade de carbono estimada do lote (tCO₂e por unidade);'),
    ).toBeDefined()
    expect(
      screen.getByText('Comparação entre o cenário sem prova e o cenário com dossiê probatório;'),
    ).toBeDefined()
    expect(
      screen.getByText(
        'Lista objetiva do que falta para a prova completa — e o que o Orbis resolve.',
      ),
    ).toBeDefined()

    // Como funciona com menção expressa à "equipe técnica Orbis"
    expect(
      screen.getByText(
        /A leitura inicial é operada pela equipe técnica Orbis \(oferta piloto\)\./i,
      ),
    ).toBeDefined()

    // Campos do formulário
    expect(screen.getByLabelText(/CNPJ/i)).toBeDefined()
    expect(screen.getByLabelText(/Razão Social/i)).toBeDefined()
    expect(screen.getByLabelText(/E-mail Comercial/i)).toBeDefined()
    expect(screen.getByLabelText(/Contato \/ Telefone/i)).toBeDefined()
    expect(screen.getByLabelText(/Setor/i)).toBeDefined()
    expect(screen.getByLabelText(/Volume de Exportação/i)).toBeDefined()

    // Botão e microcopy
    expect(screen.getByRole('button', { name: /Enviar solicitação/i })).toBeDefined()
    expect(
      screen.getByText(
        'Seus dados são usados exclusivamente para a elaboração da leitura. Sem spam, sem compartilhamento.',
      ),
    ).toBeDefined()
  })

  it('exibe mensagem amigável quando o CNPJ já solicitou a leitura gratuita (limite de 1 por CNPJ)', async () => {
    // Mock do serviço simulando resposta do backend informando ja_solicitado = true
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

    const cnpjInput = screen.getByLabelText(/CNPJ/i)
    const razaoInput = screen.getByLabelText(/Razão Social/i)
    const emailInput = screen.getByLabelText(/E-mail Comercial/i)
    const setorSelect = screen.getByLabelText(/Setor/i)
    const submitBtn = screen.getByRole('button', { name: /Enviar solicitação/i })

    // Preenche com CNPJ válido matematicamente
    fireEvent.change(cnpjInput, { target: { value: '14.882.310/0001-44' } })
    fireEvent.change(razaoInput, { target: { value: 'Metalúrgica Teste S.A.' } })
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

    const cnpjInput = screen.getByLabelText(/CNPJ/i)
    const razaoInput = screen.getByLabelText(/Razão Social/i)
    const emailInput = screen.getByLabelText(/E-mail Comercial/i)
    const setorSelect = screen.getByLabelText(/Setor/i)
    const submitBtn = screen.getByRole('button', { name: /Enviar solicitação/i })

    fireEvent.change(cnpjInput, { target: { value: '14.882.310/0001-44' } })
    fireEvent.change(razaoInput, { target: { value: 'Indústria Nova S.A.' } })
    fireEvent.change(emailInput, { target: { value: 'export@industrianova.com.br' } })
    fireEvent.change(setorSelect, { target: { value: 'alumínio' } })

    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(screen.getByText('Solicitação Recebida com Sucesso!')).toBeDefined()
    })
  })

  // 4. Presença do Orbis LPF na Navegação (Header Dropdown e Rodapé)
  it('exibe Orbis LPF no menu Soluções do Layout e no rodapé em HUB DE SOLUÇÕES com badge e âncora corretos', () => {
    render(
      <AuthProvider>
        <MemoryRouter initialEntries={['/']}>
          <Layout />
        </MemoryRouter>
      </AuthProvider>,
    )

    // Verifica presença no grupo 'Para empresas' do dropdown/drawer
    const linksLpf = screen
      .getAllByRole('link')
      .filter((link) => link.getAttribute('href') === '/solucoes#orbis-lpf')

    // Deve estar presente no menu (desktop + mobile drawer) e no rodapé (coluna HUB DE SOLUÇÕES)
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
