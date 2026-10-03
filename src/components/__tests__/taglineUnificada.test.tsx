import React from 'react'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect } from 'vitest'
import Layout from '@/components/Layout'

describe('Layout - Tagline Unificada da Marca', () => {
  it('exibe no cabeçalho desktop e drawer mobile a tagline "Economia Circular — dMRV" com travessão eme', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/']}>
        <Layout />
      </MemoryRouter>,
    )

    // Taglines no cabeçalho e rodapé: "Economia Circular — dMRV"
    const taglines = screen.getAllByText('Economia Circular — dMRV')
    expect(taglines.length).toBeGreaterThanOrEqual(2)

    // Cabeçalho desktop tem a classe de 10px e tracking largo
    const desktopTagline = container.querySelector(
      'header span.text-\\[10px\\].tracking-\\[0\\.2em\\]',
    )
    expect(desktopTagline).not.toBeNull()
    expect(desktopTagline?.textContent?.trim()).toBe('Economia Circular — dMRV')
    expect(desktopTagline?.textContent).toContain('—')
    expect(desktopTagline?.textContent).not.toContain('-') // não deve ter hífen simples
    expect(desktopTagline?.textContent).not.toContain('(')
    expect(desktopTagline?.textContent).not.toContain(')')
  })

  it('exibe no rodapé "Economia Circular — dMRV" com travessão eme e sem hífen simples nem parênteses', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/']}>
        <Layout />
      </MemoryRouter>,
    )

    // Rodapé bloco da marca com classes específicas do rodapé
    const footerTagline = container.querySelector('footer span.tracking-\\[0\\.25em\\]')
    expect(footerTagline).not.toBeNull()
    expect(footerTagline?.textContent?.trim()).toBe('Economia Circular — dMRV')
    // Garante que usa travessão eme —, não hífen simples nem parênteses
    expect(footerTagline?.textContent).toContain('—')
    expect(footerTagline?.textContent).not.toContain('-')
    expect(footerTagline?.textContent).not.toContain('(')
    expect(footerTagline?.textContent).not.toContain(')')
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
