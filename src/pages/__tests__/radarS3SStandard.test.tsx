import React from 'react'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect } from 'vitest'
import RadarRegulatorio from '@/pages/RadarRegulatorio'
import { ITENS_RADAR_REGULATORIO } from '@/data/radarRegulatorioData'
import { AuthProvider } from '@/contexts/AuthContext'
import Index from '@/pages/Index'
import SolucoesIndex from '@/pages/SolucoesIndex'
import Layout from '@/components/Layout'

describe('Radar Regulatório: Verra Scope 3 Standard (S3S) Program', () => {
  it('contém a entrada do Verra Scope 3 Standard (S3S) Program com dados factuais', () => {
    const s3sItem = ITENS_RADAR_REGULATORIO.find(
      (item) => item.id === 'verra_scope3_standard_s3s' || item.norma.includes('Scope 3 Standard'),
    )

    expect(s3sItem).toBeDefined()
    expect(s3sItem?.norma).toBe('Verra Scope 3 Standard (S3S) Program')
    expect(s3sItem?.dataMarco).toBe('15/09/2026')
    expect(s3sItem?.status).toBe('Previsto')
    expect(s3sItem?.tagSetorial).toBe('Carbono/SBCE')

    // Verificações factuais exigidas
    expect(s3sItem?.descricaoCurta).toContain('insetting')
    expect(s3sItem?.descricaoCurta).toContain('S3Us')
    expect(s3sItem?.descricaoCurta).toContain('dMRV')
    expect(s3sItem?.descricaoCurta).toContain('agricultura e concreto')
    expect(s3sItem?.descricaoCurta).toContain('ainda sem metodologia publicada')

    expect(s3sItem?.acaoRecomendada).toContain('Escopo 3')
    expect(s3sItem?.acaoRecomendada).toContain('cadeia automotiva e siderúrgica')
    expect(s3sItem?.acaoRecomendada).toContain('dMRV')
  })

  it('trava ausência de termos proibidos na entrada S3S do Radar', () => {
    const s3sItem = ITENS_RADAR_REGULATORIO.find((item) => item.id === 'verra_scope3_standard_s3s')
    expect(s3sItem).toBeDefined()

    const textoCompleto = JSON.stringify(s3sItem).toLowerCase()

    // Palavras e conceitos estritamente proibidos
    expect(textoCompleto).not.toContain('emitiremos')
    expect(textoCompleto).not.toContain('geraremos s3us')
    expect(textoCompleto).not.toContain('geraremos')
    expect(textoCompleto).not.toContain('créditos de reciclagem')
    expect(textoCompleto).not.toContain('creditos de reciclagem')
    expect(textoCompleto).not.toContain('parceira')
    expect(textoCompleto).not.toContain('parceria com a verra')
    expect(textoCompleto).not.toContain('aceitos por grandes compradores')
    expect(textoCompleto).not.toContain('afiliação')
    expect(textoCompleto).not.toContain('endosso')
  })

  it('renderiza o card do S3S na página RadarRegulatorio', () => {
    render(
      <AuthProvider>
        <MemoryRouter initialEntries={['/radar-regulatorio']}>
          <RadarRegulatorio />
        </MemoryRouter>
      </AuthProvider>,
    )

    expect(screen.getByText(/Verra Scope 3 Standard \(S3S\) Program/i)).toBeDefined()
    expect(screen.getByText(/15\/09\/2026/)).toBeDefined()
    expect(
      screen.getByText(/Unidades de Escopo 3 \(S3Us\) e operação digital-first \(dMRV\)/i),
    ).toBeDefined()
  })

  it('garante que textos aprovados de Logística Reversa (Index, SolucoesIndex e Layout) permanecem intactos', () => {
    // 1. Home
    const { unmount: unmountHome } = render(
      <MemoryRouter initialEntries={['/']}>
        <Index />
      </MemoryRouter>,
    )
    expect(
      screen.getByRole('heading', { level: 3, name: 'Logística Reversa — em estruturação' }),
    ).toBeDefined()
    expect(
      screen.getByText(
        'Estendemos nossa infraestrutura de prova documental à logística reversa (PNRS / Decreto 11.413/2023): rastreabilidade de lotes de material, balanço de massa auditável e documentos prontos para envio a órgãos de controle e entidades gestoras. Na mesma lógica, a infraestrutura Orbis está preparada para dados verificáveis de natureza e biodiversidade, à medida que os padrões IFRS incorporam o tema nas divulgações corporativas.',
      ),
    ).toBeDefined()
    unmountHome()

    // 2. Soluções
    const { unmount: unmountSolucoes } = render(
      <MemoryRouter initialEntries={['/solucoes']}>
        <SolucoesIndex />
      </MemoryRouter>,
    )
    expect(
      screen.getByRole('heading', { level: 2, name: 'Logística Reversa — em estruturação' }),
    ).toBeDefined()
    unmountSolucoes()

    // 3. Layout / Menu
    render(
      <AuthProvider>
        <MemoryRouter initialEntries={['/']}>
          <Layout />
        </MemoryRouter>
      </AuthProvider>,
    )
    const links = screen
      .getAllByRole('link')
      .filter((link) => link.getAttribute('href') === '/solucoes#logistica-reversa')
    expect(links.length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Logística Reversa (PNRS)').length).toBeGreaterThanOrEqual(1)
  })
})
