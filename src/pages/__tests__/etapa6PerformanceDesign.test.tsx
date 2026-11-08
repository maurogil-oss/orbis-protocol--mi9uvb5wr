import React from 'react'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect } from 'vitest'
import Index from '@/pages/Index'

describe('Etapa 6 - Performance, Acessibilidade e Design Institucional na Home', () => {
  it('exibe CTA orientado a benefício "Solicite uma demonstração" e CTA de diagnóstico gratuito', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Index />
      </MemoryRouter>,
    )

    const ctaDemo = screen.getByRole('link', { name: /Solicite uma demonstração/i })
    expect(ctaDemo).toBeDefined()
    expect(ctaDemo.getAttribute('href')).toBe('/demo/orientada')

    const ctaDiagnostico = screen.getByRole('link', { name: /Iniciar diagnóstico gratuito/i })
    expect(ctaDiagnostico).toBeDefined()
    expect(ctaDiagnostico.getAttribute('href')).toBe('/diagnostico')
  })

  it('exibe o fluxograma circular com etapas legíveis no container responsivo para mobile', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/']}>
        <Index />
      </MemoryRouter>,
    )

    const fluxograma = container.querySelector('[data-testid="fluxograma-circular-container"]')
    expect(fluxograma).not.toBeNull()
    expect(screen.getByText('FLUXOGRAMA CIRCULAR DA ECONOMIA DE CARBONO (dMRV)')).toBeDefined()
    expect(screen.getByText('Ciclo Fechado · dMRV')).toBeDefined()
  })

  it('exibe período e metodologia declarados para as métricas da home', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Index />
      </MemoryRouter>,
    )

    expect(screen.getByText(/Período auditado: Competência 2022/i)).toBeDefined()
    expect(screen.getByText(/Metodologia: DM-ORB-001 v1\.1/i)).toBeDefined()
  })

  it('exibe seção de parceiros institucionais incluindo a Associação Comercial do Paraná (ACP)', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Index />
      </MemoryRouter>,
    )

    expect(screen.getByText('PARCEIROS INSTITUCIONAIS')).toBeDefined()
    expect(screen.getByText('Associação Comercial do Paraná (ACP)')).toBeDefined()
    expect(screen.getByText(/Código ORB-ACP/i)).toBeDefined()
    expect(screen.getByRole('link', { name: /Conhecer o Bureau ACP/i })).toBeDefined()

    // Verifica que a imagem do parceiro possui alt acessível
    const logoAcp = screen.getByAltText(/Associação Comercial do Paraná/i)
    expect(logoAcp).toBeDefined()
  })
})
