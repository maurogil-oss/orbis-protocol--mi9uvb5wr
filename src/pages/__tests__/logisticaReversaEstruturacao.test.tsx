import React from 'react'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect } from 'vitest'
import Index from '@/pages/Index'
import SolucoesIndex from '@/pages/SolucoesIndex'
import Layout from '@/components/Layout'
import { AuthProvider } from '@/contexts/AuthContext'

describe('Bloco Institucional: Logística Reversa — em estruturação', () => {
  const TITULO_EXATO = 'Logística Reversa — em estruturação'
  const CORPO_EXATO =
    'Estendemos nossa infraestrutura de prova documental à logística reversa (PNRS / Decreto 11.413/2023): rastreabilidade de lotes de material, balanço de massa auditável e documentos prontos para envio a órgãos de controle e entidades gestoras.'
  const CORPO_HOME_EXATO =
    'Estendemos nossa infraestrutura de prova documental à logística reversa (PNRS / Decreto 11.413/2023): rastreabilidade de lotes de material, balanço de massa auditável e documentos prontos para envio a órgãos de controle e entidades gestoras. Na mesma lógica, a infraestrutura Orbis está preparada para dados verificáveis de natureza e biodiversidade, à medida que os padrões IFRS incorporam o tema nas divulgações corporativas.'
  const CTA_EXATO = 'Fale com a equipe'

  it('exibe o bloco institucional na Home (Index) com textos exatos, badge discreta, teaser de biodiversidade/natureza e CTA para /diagnostico', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Index />
      </MemoryRouter>,
    )

    // Título exato
    const titulo = screen.getByRole('heading', { level: 3, name: TITULO_EXATO })
    expect(titulo).toBeDefined()

    // Corpo exato com o teaser de biodiversidade/natureza
    expect(screen.getByText(CORPO_HOME_EXATO)).toBeDefined()

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

    // Âncora id="logistica-reversa" presente no card e scroll-mt configurado para compensar header fixo
    const cardEl = document.getElementById('logistica-reversa')
    expect(cardEl).not.toBeNull()
    expect(cardEl?.classList.contains('scroll-mt-32')).toBe(true)
  })

  it('exibe o item no menu Soluções (Layout) no dropdown desktop e drawer mobile com âncora /solucoes#logistica-reversa e badge "Em estruturação"', () => {
    render(
      <AuthProvider>
        <MemoryRouter initialEntries={['/']}>
          <Layout />
        </MemoryRouter>
      </AuthProvider>,
    )

    // O dropdown de soluções é aberto pelo botão "Soluções"
    // No dropdown e drawer, procuramos pelos links que apontam para /solucoes#logistica-reversa
    const links = screen
      .getAllByRole('link')
      .filter((link) => link.getAttribute('href') === '/solucoes#logistica-reversa')

    // Esperado ao menos 1 (dropdown desktop e drawer mobile carregam a lista de itens)
    expect(links.length).toBeGreaterThanOrEqual(1)

    // Verifica que o título "Logística Reversa (PNRS)" e a descrição curta estão presentes
    const titulos = screen.getAllByText('Logística Reversa (PNRS)')
    expect(titulos.length).toBeGreaterThanOrEqual(1)

    const descricoes = screen.getAllByText(
      'Rastreabilidade de lotes de material e balanço de massa auditável — módulo em estruturação.',
    )
    expect(descricoes.length).toBeGreaterThanOrEqual(1)

    // Verifica a presença da badge "Em estruturação" nos links
    const badges = screen.getAllByText('Em estruturação')
    expect(badges.length).toBeGreaterThanOrEqual(1)
  })
})
