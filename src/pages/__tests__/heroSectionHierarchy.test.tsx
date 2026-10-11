import React from 'react'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect } from 'vitest'
import Index from '@/pages/Index'

describe('Hero Section - Home (Index)', () => {
  it('exibe o novo hero em duas colunas com eyebrow, headline, CTAs, confiança e cartão ilustrativo', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Index />
      </MemoryRouter>,
    )

    // Eyebrow exato
    expect(screen.getByText('Pegada de carbono a partir da NF-e')).toBeDefined()

    // Headline principal (h1) com texto exato e destaque em esmeralda
    const h1 = screen.getByRole('heading', { level: 1 })
    expect(h1).toBeDefined()
    expect(h1.textContent).toContain('Cada nota fiscal da sua cadeia vira')
    expect(h1.textContent).toContain('prova de descarbonização.')

    // Parágrafo curto do hero
    expect(
      screen.getByText(
        /Conectamos suas NF-e e SPED, calculamos a pegada de carbono e entregamos um documento verificável/i,
      ),
    ).toBeDefined()

    // CTAs: "Iniciar diagnóstico gratuito" (→ /diagnostico) e "Ver como funciona" (âncora #como-funciona)
    const ctaDiagnostico = screen.getByRole('link', { name: /Iniciar diagnóstico gratuito/i })
    expect(ctaDiagnostico).toBeDefined()
    expect(ctaDiagnostico.getAttribute('href')).toBe('/diagnostico')

    const ctaComoFunciona = screen.getByRole('link', { name: /Ver como funciona/i })
    expect(ctaComoFunciona).toBeDefined()
    expect(ctaComoFunciona.getAttribute('href')).toBe('#como-funciona')

    // Linha de confiança sem menção de tributo
    expect(
      screen.getByText('15 dias de teste, sem cartão. Até 5 notas na avaliação.'),
    ).toBeDefined()

    // Cartão ilustrativo do Atestado de Conformidade Orbis
    expect(screen.getByText('Atestado de Conformidade Orbis')).toBeDefined()
    expect(screen.getByText('Lote EXP-2026-0412 · GHG Protocol')).toBeDefined()
    expect(screen.getAllByText('Exemplo').length).toBeGreaterThanOrEqual(1)

    // Linhas da tabela recalculadas com fatores auditados DM-ORB-001
    expect(screen.getByText('Bobina de aço laminado')).toBeDefined()
    expect(screen.getByText('26,16')).toBeDefined() // 12,0 t × 2,18

    expect(screen.getByText('Sucata ferrosa (reciclada)')).toBeDefined()
    expect(screen.getByText('3,57')).toBeDefined() // 8,5 t × 0,42

    expect(screen.getByText('Frete rodoviário — 640 km')).toBeDefined()
    expect(screen.getByText('1,30')).toBeDefined() // 640 km × 20,5 t × 0,099 / 1000

    expect(screen.getByText('Total do lote')).toBeDefined()
    expect(screen.getByText('31,03')).toBeDefined() // 26,16 + 3,57 + 1,30

    // Rodapé do cartão e nota com link para /verificador
    expect(screen.getByText('Assinado por perito credenciado · ART vinculada')).toBeDefined()
    expect(screen.getByText(/sha256 9f3a 61c0 e8b2 4d17/i)).toBeDefined()
    expect(screen.getByText(/Documento ilustrativo\. Cada atestado real pode ser/i)).toBeDefined()
    const linkVerificador = screen.getByRole('link', { name: /conferido publicamente pelo hash/i })
    expect(linkVerificador.getAttribute('href')).toBe('/verificador')
  })

  it('exibe a nova seção "Da nota fiscal ao documento verificável" em 3 etapas com âncora #como-funciona', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/']}>
        <Index />
      </MemoryRouter>,
    )

    // Âncora como-funciona presente no DOM
    const secao = container.querySelector('#como-funciona')
    expect(secao).not.toBeNull()

    // Título da seção
    expect(screen.getByText('Da nota fiscal ao documento verificável')).toBeDefined()

    // Destaque "Você só participa da primeira"
    expect(screen.getByText('Você só participa da primeira.')).toBeDefined()

    // 3 etapas
    expect(screen.getByText('Importação das notas')).toBeDefined()
    expect(screen.getByText('Cálculo auditado DM-ORB-001')).toBeDefined()
    expect(screen.getByText('Documento verificável com hash público')).toBeDefined()

    // Números das etapas
    expect(screen.getByText('01')).toBeDefined()
    expect(screen.getByText('02')).toBeDefined()
    expect(screen.getByText('03')).toBeDefined()
  })

  it('garante que os elementos antigos foram REMOVIDOS do hero', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/']}>
        <Index />
      </MemoryRouter>,
    )

    const textContent = container.textContent || ''

    // Removido do hero: o subtítulo em caixa-alta antigo
    expect(textContent).not.toContain(
      'Prova documental da economia circular para descarbonização verificável e conformidade regulatória (Lei 15.042/2024, SBCE)',
    )

    // Removido do hero: o parágrafo longo repetitivo antigo
    expect(textContent).not.toContain(
      'A plataforma que transforma notas fiscais e dados operacionais em prova: cálculo da pegada de carbono',
    )

    // Removido do hero: menção de tributo/reforma tributária no hero
    expect(textContent).not.toContain('reforma tributária.')
  })
})
