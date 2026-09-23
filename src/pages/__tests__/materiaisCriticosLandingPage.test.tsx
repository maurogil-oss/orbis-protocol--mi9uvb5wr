import { describe, it, expect } from 'vitest'
import React from 'react'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Index from '../Index'
import SolucoesIndex from '../SolucoesIndex'

describe('Landing Page & Soluções • Integrações de Materiais Críticos', () => {
  it('renderiza a linha discreta "Novo:" com link para /materiais-criticos no hero do Index sem quebrar layout', () => {
    render(
      <MemoryRouter>
        <Index />
      </MemoryRouter>,
    )

    // Tag "Novo:"
    const novoBadge = screen.getByText('Novo:')
    expect(novoBadge).toBeDefined()
    expect(novoBadge.className).toContain('text-[#D9B36C]')
    expect(novoBadge.className).toContain('font-semibold')

    // Link para /materiais-criticos
    const linkNovo = screen.getByRole('link', {
      name: /Passaporte Digital de Materiais Críticos Recuperados/i,
    })
    expect(linkNovo).toBeDefined()
    expect(linkNovo.getAttribute('href')).toBe('/materiais-criticos')
    expect(linkNovo.className).toContain('text-[#12B886]')
  })

  it('renderiza o card de Materiais Críticos Recuperados na seção de circularidade do Index', () => {
    render(
      <MemoryRouter>
        <Index />
      </MemoryRouter>,
    )

    expect(screen.getByText('MINERAÇÃO URBANA & REEE')).toBeDefined()
    expect(screen.getByRole('heading', { name: 'Materiais Críticos Recuperados' })).toBeDefined()
    expect(
      screen.getByText(
        /Prova de origem urbana para terras raras, metais nobres e cobre recuperados de e-waste e veículos\./i,
      ),
    ).toBeDefined()

    const linkCard = screen.getByRole('link', { name: /Acessar Passaporte DCP/i })
    expect(linkCard).toBeDefined()
    expect(linkCard.getAttribute('href')).toBe('/materiais-criticos')
  })

  it('renderiza o bloco de Materiais Críticos Recuperados no hub de Soluções (SolucoesIndex)', () => {
    render(
      <MemoryRouter>
        <SolucoesIndex />
      </MemoryRouter>,
    )

    expect(screen.getByText('MINERAÇÃO URBANA & REEE')).toBeDefined()
    expect(screen.getByRole('heading', { name: 'Materiais Críticos Recuperados' })).toBeDefined()
    expect(
      screen.getByText(
        'Passaporte Digital de Produto (DCP) por lote com rastreabilidade criptográfica.',
      ),
    ).toBeDefined()
    expect(
      screen.getByText(
        'Prova de origem urbana para terras raras, metais nobres e cobre recuperados de e-waste e veículos.',
      ),
    ).toBeDefined()

    const linkSolucao = screen.getByRole('link', { name: /Ver Materiais Críticos/i })
    expect(linkSolucao).toBeDefined()
    expect(linkSolucao.getAttribute('href')).toBe('/materiais-criticos')
  })
})
