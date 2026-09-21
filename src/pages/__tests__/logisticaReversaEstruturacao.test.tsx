import React from 'react'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect } from 'vitest'
import Index from '@/pages/Index'
import SolucoesIndex from '@/pages/SolucoesIndex'

describe('Bloco Institucional: Logística Reversa — em estruturação', () => {
  const TITULO_EXATO = 'Logística Reversa — em estruturação'
  const CORPO_EXATO =
    'Estendemos nossa infraestrutura de prova documental à logística reversa (PNRS / Decreto 11.413/2023): rastreabilidade de lotes de material, balanço de massa auditável e documentos prontos para envio a órgãos de controle e entidades gestoras.'
  const CTA_EXATO = 'Fale com a equipe'

  it('exibe o bloco institucional na Home (Index) com textos exatos, badge discreta e CTA para /diagnostico', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Index />
      </MemoryRouter>,
    )

    // Título exato
    const titulo = screen.getByRole('heading', { level: 3, name: TITULO_EXATO })
    expect(titulo).toBeDefined()

    // Corpo exato
    expect(screen.getByText(CORPO_EXATO)).toBeDefined()

    // Badge discreta "Em estruturação"
    const badges = screen.getAllByText('Em estruturação')
    expect(badges.length).toBeGreaterThanOrEqual(1)

    // CTA exato apontando para o formulário de diagnóstico (/diagnostico)
    const cta = screen.getByRole('link', { name: new RegExp(CTA_EXATO, 'i') })
    expect(cta).toBeDefined()
    expect(cta.getAttribute('href')).toBe('/diagnostico')
  })

  it('exibe o card institucional na página Soluções (SolucoesIndex) com textos exatos, badge discreta e CTA para /diagnostico', () => {
    render(
      <MemoryRouter initialEntries={['/solucoes']}>
        <SolucoesIndex />
      </MemoryRouter>,
    )

    // Título exato
    const titulo = screen.getByRole('heading', { level: 2, name: TITULO_EXATO })
    expect(titulo).toBeDefined()

    // Corpo exato
    expect(screen.getByText(CORPO_EXATO)).toBeDefined()

    // Badge discreta "Em estruturação"
    const badge = screen.getByText('Em estruturação')
    expect(badge).toBeDefined()

    // CTA exato apontando para o formulário de diagnóstico (/diagnostico)
    const cta = screen.getByRole('link', { name: new RegExp(CTA_EXATO, 'i') })
    expect(cta).toBeDefined()
    expect(cta.getAttribute('href')).toBe('/diagnostico')
  })
})
