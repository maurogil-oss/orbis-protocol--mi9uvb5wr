import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import FatoresEmissaoPublicoPage from '../FatoresEmissaoPublicoPage'

describe('Página Pública /fatores - Métricas e Referências', () => {
  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <FatoresEmissaoPublicoPage />
      </BrowserRouter>,
    )
  }

  it('deve renderizar o título e h1 "Métricas e Referências" e o texto institucional', () => {
    renderComponent()

    const heading = screen.getByRole('heading', { level: 1, name: /Métricas e Referências/i })
    expect(heading).not.toBeNull()

    expect(
      screen.getByText(
        /A Orbis Protocol aplica fatores de emissão de fontes primárias reconhecidas/i,
      ),
    ).not.toBeNull()

    expect(
      screen.getByText(
        /Os fatores aplicados a cada lote são divulgados exclusivamente no resultado do Verificador/i,
      ),
    ).not.toBeNull()
  })

  it('deve apresentar as referências canônicas obrigatórias', () => {
    renderComponent()

    expect(screen.getByText('IPCC AR6')).not.toBeNull()
    expect(screen.getByText('worldsteel')).not.toBeNull()
    expect(screen.getByText('IAI 2024')).not.toBeNull()
    expect(screen.getByText('ICA')).not.toBeNull()
    expect(screen.getByText('GHG Protocol')).not.toBeNull()
    expect(screen.getByText('ISO 14064-1')).not.toBeNull()
    expect(screen.getByText('Lei 15.042/2024')).not.toBeNull()
    expect(screen.getByText('Lei 14.902/2024')).not.toBeNull()
    expect(screen.getByText('IFRS S1 / S2')).not.toBeNull()
    expect(screen.getByText('PNRS — Lei 12.305/2010')).not.toBeNull()
    expect(screen.getByText('Diretriz Técnica DM-ORB-001 v1.1')).not.toBeNull()
  })

  it('NÃO deve conter valores numéricos de fatores de emissão no texto renderizado', () => {
    renderComponent()

    const textoCompleto = document.body.textContent || ''

    // Asserções estritas solicitadas pela tarefa:
    expect(textoCompleto).not.toContain('14,40')
    expect(textoCompleto).not.toContain('2,18')
    expect(textoCompleto).not.toContain('4,10')
    expect(textoCompleto).not.toContain('0,50')
  })

  it('NÃO deve conter botão ou link de download de CSV', () => {
    renderComponent()

    expect(screen.queryByText(/Exportar CSV/i)).toBeNull()
    expect(screen.queryByText(/Download CSV/i)).toBeNull()
    expect(screen.queryByRole('button', { name: /csv/i })).toBeNull()
    expect(screen.queryByRole('link', { name: /csv/i })).toBeNull()
  })

  it('deve conter aviso discreto de que a régua completa é restrita e CTA para o Verificador', () => {
    renderComponent()

    expect(screen.getByText(/Catálogo Pericial com Valores Numéricos é Restrito/i)).not.toBeNull()

    const linkVerificador = screen.getByRole('link', { name: /Consultar no Verificador/i })
    expect(linkVerificador.getAttribute('href')).toBe('/verificador')
  })

  it('deve conter link para a Diretriz DM-ORB-001 em /norma-dm-orb-001', () => {
    renderComponent()

    const linkNorma = screen.getByRole('link', { name: /Acessar Diretriz DM-ORB-001/i })
    expect(linkNorma.getAttribute('href')).toBe('/norma-dm-orb-001')
  })

  it('deve aplicar terminologia canônica e não utilizar termos proibidos no texto público', () => {
    renderComponent()

    // Deve usar "Atestado de Conformidade Orbis (com ART/RRT)" ou "Atestado Orbis"
    expect(
      screen.getAllByText(/Atestado de Conformidade Orbis \(com ART\/RRT\)/i).length,
    ).toBeGreaterThan(0)

    const textoCompleto = document.body.textContent || ''
    // PROIBIDO "Selo Oficial" e "Certificado" / "Certificação"
    expect(textoCompleto).not.toContain('Selo Oficial')
    expect(textoCompleto).not.toContain('Certificado de Carbono')
    expect(textoCompleto).not.toContain('Certificação')
  })
})
