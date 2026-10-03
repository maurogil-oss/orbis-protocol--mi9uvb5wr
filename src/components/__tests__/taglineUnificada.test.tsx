import React from 'react'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect } from 'vitest'
import Layout from '@/components/Layout'

describe('Layout - Tagline Unificada da Marca', () => {
  it('exibe a tagline limpa no cabeçalho desktop e drawer mobile', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/']}>
        <Layout />
      </MemoryRouter>,
    )

    // Tagline do cabeçalho limpa: "Prova Documental da Economia Circular"
    const headerTaglines = screen.getAllByText('Prova Documental da Economia Circular')
    expect(headerTaglines.length).toBeGreaterThanOrEqual(1)

    // Cabeçalho desktop tem a classe de 10px e tracking largo
    const desktopTagline = container.querySelector(
      'header span.text-\\[10px\\].tracking-\\[0\\.2em\\]',
    )
    expect(desktopTagline).not.toBeNull()
    expect(desktopTagline?.textContent?.trim()).toBe('Prova Documental da Economia Circular')
  })

  it('exibe no rodapé "Prova Documental da Economia Circular — dMRV" com travessão eme', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Layout />
      </MemoryRouter>,
    )

    // Rodapé bloco da marca
    const footerTagline = screen.getByText('Prova Documental da Economia Circular — dMRV')
    expect(footerTagline).toBeDefined()
    // Garante que usa travessão eme —, não hífen nem parênteses
    expect(footerTagline.textContent).toContain('—')
    expect(footerTagline.textContent).not.toContain('(')
    expect(footerTagline.textContent).not.toContain(')')
  })

  it('exibe copyright no formato exato com ano e travessão eme', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Layout />
      </MemoryRouter>,
    )

    const copyright = screen.getByText(
      /© 2026 Orbis Protocol — Infraestrutura de Prova Documental da Economia Circular — dMRV\. Todos os direitos reservados\./,
    )
    expect(copyright).toBeDefined()
    expect(copyright.textContent).toContain('—')
    expect(copyright.textContent).not.toContain('(')
    expect(copyright.textContent).not.toContain(')')
  })
})
