import React from 'react'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect } from 'vitest'
import Index from '@/pages/Index'

describe('Hero Section - Home (Index)', () => {
  it('exibe o eyebrow com INFRAESTRUTURA DE COMPROVAÇÃO E RASTREABILIDADE e o novo título principal', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Index />
      </MemoryRouter>,
    )

    // Eyebrow presente
    expect(screen.getByText('INFRAESTRUTURA DE COMPROVAÇÃO E RASTREABILIDADE')).toBeDefined()

    // Título principal (h1) com o novo texto exato
    const h1 = screen.getByRole('heading', { level: 1 })
    expect(h1).toBeDefined()
    expect(h1.textContent).toContain('Lemos cada nota fiscal da sua cadeia e geramos a')
    expect(h1.textContent).toContain('prova de descarbonização')

    // Subtítulo atualizado com a nova tagline como contexto de mercado mantendo descarbonização e Lei 15.042/2024
    expect(
      screen.getByText(
        'Prova documental da economia circular para descarbonização verificável e conformidade regulatória (Lei 15.042/2024, SBCE)',
      ),
    ).toBeDefined()

    // CTAs mantidos
    const ctaDiagnostico = screen.getByRole('link', { name: /Iniciar Diagnóstico/i })
    expect(ctaDiagnostico).toBeDefined()
    expect(ctaDiagnostico.getAttribute('href')).toBe('/diagnostico')

    const ctaProtocolo = screen.getByRole('link', { name: /Conhecer o Protocolo/i })
    expect(ctaProtocolo).toBeDefined()
    expect(ctaProtocolo.getAttribute('href')).toBe('#eixos-narrativos')

    // Emblema animado mantido
    expect(screen.getByText('Auditoria & Rastreabilidade Confiável')).toBeDefined()
  })
})
