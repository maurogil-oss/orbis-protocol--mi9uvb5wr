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

  it('contém as novas entradas do Radar: CVM 244/2026, Bacen 586/2026, Previc 728/2026 e Consulta Susep enriquecida', () => {
    // 1. Resolução CVM 244/2026
    const cvmItem = ITENS_RADAR_REGULATORIO.find((item) => item.id === 'resolucao_cvm_244_2026')
    expect(cvmItem).toBeDefined()
    expect(cvmItem?.norma).toContain('CVM nº 244/2026')
    expect(cvmItem?.descricaoCurta).toContain('pratique-ou-explique')
    expect(cvmItem?.descricaoCurta).toContain('greenwashing por associação')

    // 2. Resolução BCB 586/2026
    const bacenItem = ITENS_RADAR_REGULATORIO.find((item) => item.id === 'resolucao_bacen_586_2026')
    expect(bacenItem).toBeDefined()
    expect(bacenItem?.norma).toBe('Resolução BCB nº 586/2026')
    expect(bacenItem?.baseLegal).toContain('5.185/2024')
    expect(bacenItem?.descricaoCurta).toContain('GRSAC')

    // 3. Portaria Previc 728/2026 & Resolução PREVIC 26/2025
    const previcItem = ITENS_RADAR_REGULATORIO.find(
      (item) => item.id === 'portaria_previc_728_2026',
    )
    expect(previcItem).toBeDefined()
    expect(previcItem?.norma).toContain('728/2026')
    expect(previcItem?.baseLegal).toContain('PREVIC nº 26/2025')
    expect(previcItem?.descricaoCurta).toContain('Plano ASG')
    expect(previcItem?.descricaoCurta).toContain('dupla materialidade')

    // 4. Consulta Pública Susep (enriquecida com detalhes)
    const susepItem = ITENS_RADAR_REGULATORIO.find(
      (item) => item.id === 'consulta_publica_susep_issb',
    )
    expect(susepItem).toBeDefined()
    expect(susepItem?.descricaoCurta).toContain('Circular Susep nº 666/2022')
    expect(susepItem?.descricaoCurta).toContain('ISSB')
    expect(susepItem?.descricaoCurta).toContain('4 tabelas padronizadas')
    expect(susepItem?.descricaoCurta).toContain('governança')
    expect(susepItem?.descricaoCurta).toContain('estratégia')
    expect(susepItem?.descricaoCurta).toContain('gestão de riscos')
    expect(susepItem?.descricaoCurta).toContain('métricas e metas')
    expect(susepItem?.descricaoCurta).toContain('proporcionalidade por porte')
    expect(susepItem?.descricaoCurta).toContain('dispensa de relatório separado')
    expect(susepItem?.descricaoCurta).toContain('IFRS S1/S2')
    expect(susepItem?.descricaoCurta).toContain('31/12/2026')
    expect(susepItem?.descricaoCurta).toContain('2027')
    expect(susepItem?.descricaoCurta).toContain('2028')
  })

  it('contém a entrada do Decreto 13.094/2026 (ProBioQAV, CS-SAF, book and claim e ISO 22095-3)', () => {
    const safItem = ITENS_RADAR_REGULATORIO.find(
      (item) => item.id === 'decreto_13094_probioqav_cssaf',
    )
    expect(safItem).toBeDefined()
    expect(safItem?.norma).toContain('Decreto nº 13.094/2026')
    expect(safItem?.status).toBe('Vigente')
    expect(safItem?.tagSetorial).toBe('Carbono/SBCE')

    // Verificações conceituais e regulatórias do SAF
    expect(safItem?.descricaoCurta).toContain('ProBioQAV')
    expect(safItem?.descricaoCurta).toContain('CS-SAF')
    expect(safItem?.descricaoCurta).toContain('book and claim')
    expect(safItem?.descricaoCurta).toContain('separação do atributo ambiental da entrega física')
    expect(safItem?.descricaoCurta).toContain('dupla contagem')
    expect(safItem?.descricaoCurta).toContain('o mesmo litro não pode gerar CBIO e CS-SAF')
    expect(safItem?.descricaoCurta).toContain('CORSIA')
    expect(safItem?.descricaoCurta).toContain('SBCE')
    expect(safItem?.descricaoCurta).toContain('consulta pública da ANAC')
    expect(safItem?.descricaoCurta).toContain('ISO 22095-3:2026')
    expect(safItem?.descricaoCurta).toContain(
      'primeira parte da série internacional ISO 22095 dedicada integralmente ao modelo de book and claim',
    )
    expect(safItem?.descricaoCurta).toContain('TIEC')

    // Trava de não-emissor na ação recomendada
    expect(safItem?.acaoRecomendada).toContain('dMRV')
    expect(safItem?.acaoRecomendada).toContain('prova digital')
    const safTexto = JSON.stringify(safItem).toLowerCase()
    expect(safTexto).not.toContain('emitiremos cs-saf')
    expect(safTexto).not.toContain('somos emissores')
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
