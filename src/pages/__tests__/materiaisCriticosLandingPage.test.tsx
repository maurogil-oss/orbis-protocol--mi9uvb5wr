import { describe, it, expect } from 'vitest'
import React from 'react'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import SolucoesIndex from '../SolucoesIndex'
import { SecaoCircularidadeDpp } from '@/components/hub-solucoes/SecaoCircularidadeDpp'

describe('Hub Soluções • Integrações de Materiais Críticos', () => {
  it('renderiza o card de Materiais Críticos Recuperados no componente SecaoCircularidadeDpp (preparado para o hub Soluções)', () => {
    render(
      <MemoryRouter>
        <SecaoCircularidadeDpp />
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
