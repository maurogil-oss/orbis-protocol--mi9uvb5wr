import { describe, it, expect } from 'vitest'
import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import MateriaisCriticosPublicPage from '../MateriaisCriticosPublicPage'
import { DcpDemonstracaoPublicaPage } from '../DcpDemonstracaoPublicaPage'
import { ConferenciaLastroPublicaPage } from '../ConferenciaLastroPublicaPage'

describe('Página de Materiais Críticos • Correções de QR Code e Tipografia do Hero', () => {
  it('renderiza o hero com a tipografia padrão reduzida (text-2xl sm:text-4xl font-extrabold)', () => {
    render(
      <MemoryRouter>
        <MateriaisCriticosPublicPage />
      </MemoryRouter>,
    )

    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading).toBeDefined()
    expect(heading.textContent).toContain('Valor = Prêmio de Origem Urbana')
    // Verifica que não usa mais font-black text-3xl sm:text-5xl md:text-6xl
    expect(heading.className).toContain('text-2xl')
    expect(heading.className).toContain('sm:text-4xl')
    expect(heading.className).toContain('font-extrabold')
    expect(heading.className).not.toContain('text-3xl sm:text-5xl md:text-6xl')
    expect(heading.className).not.toContain('font-black')
  })

  it('atualiza o link e QR code dinamicamente conforme inputs do simulador', () => {
    const { container } = render(
      <MemoryRouter>
        <MateriaisCriticosPublicPage />
      </MemoryRouter>,
    )

    // Localizar botão "Abrir Espelho"
    const linkAbrir = screen.getByRole('link', { name: /abrir espelho/i })
    expect(linkAbrir).toBeDefined()
    expect(linkAbrir.getAttribute('href')).toContain('/conferencia-lastro-demo')
    expect(linkAbrir.getAttribute('href')).toContain('lote=ORB-CRIT-2026-X9B2')
    expect(linkAbrir.getAttribute('href')).toContain('massa=1450')

    // Localizar input do lote e alterar
    const inputLote = screen.getByDisplayValue('ORB-CRIT-2026-X9B2')
    fireEvent.change(inputLote, { target: { value: 'ORB-CRIT-CUSTOM-77' } })

    // Link e QR SVG devem refletir o novo lote
    expect(linkAbrir.getAttribute('href')).toContain('lote=ORB-CRIT-CUSTOM-77')

    // Altera a massa
    const inputMassa = screen.getByDisplayValue('1450')
    fireEvent.change(inputMassa, { target: { value: '2800' } })
    expect(linkAbrir.getAttribute('href')).toContain('massa=2800')

    // QR Code SVG deve estar presente e com valor da rota demo
    const svgQr = container.querySelector('svg')
    expect(svgQr).toBeDefined()
  })

  it('recalcula o hash SHA-256 dinamicamente ao editar massa e parâmetros do simulador', async () => {
    render(
      <MemoryRouter>
        <MateriaisCriticosPublicPage />
      </MemoryRouter>,
    )

    const hashElement = screen.getByTestId('hash-sha256-display')
    expect(hashElement).toBeDefined()

    // Aguarda o hash inicial ser calculado (64 hexadecimais)
    await waitFor(() => {
      expect(hashElement.textContent).toMatch(/^[a-f0-9]{64}$/)
    })
    const hashOriginal = hashElement.textContent

    // Altera a massa do simulador
    const inputMassa = screen.getByDisplayValue('1450')
    fireEvent.change(inputMassa, { target: { value: '3200' } })

    // Deve recalcular e gerar um novo hash determinístico diferente
    await waitFor(() => {
      expect(hashElement.textContent).not.toBe(hashOriginal)
      expect(hashElement.textContent).toMatch(/^[a-f0-9]{64}$/)
    })
  })

  it('renderiza o botão "Falar com o time" com link mailto, assunto correto e estilo coerente', () => {
    render(
      <MemoryRouter>
        <MateriaisCriticosPublicPage />
      </MemoryRouter>,
    )

    const btnFalar = screen.getByRole('link', { name: /falar com o time/i })
    expect(btnFalar).toBeDefined()
    expect(btnFalar.getAttribute('href')).toBe(
      'mailto:contato@orbis-protocol.com?subject=Interesse%20em%20Materiais%20Cr%C3%ADticos%20Recuperados',
    )
    expect(btnFalar.className).toContain('bg-[#D9B36C]')
  })

  it('renderiza a página DcpDemonstracaoPublicaPage com identificação clara de DEMONSTRAÇÃO e métricas recebidas', () => {
    render(
      <MemoryRouter
        initialEntries={[
          '/conferencia-lastro-demo?lote=ORB-CRIT-999&massa=3200&nd=150.5&au=800&cu=2100&via=qr',
        ]}
      >
        <Routes>
          <Route path="/conferencia-lastro-demo" element={<DcpDemonstracaoPublicaPage />} />
        </Routes>
      </MemoryRouter>,
    )

    // Deve exibir aviso explícito de demonstração
    expect(
      screen.getByText(/DOCUMENTO EM MODO DEMONSTRAÇÃO PEDAGÓGICA \(SIMULAÇÃO\)/i),
    ).toBeDefined()
    expect(screen.getAllByText(/DEMONSTRAÇÃO/i).length).toBeGreaterThanOrEqual(1)

    // Deve exibir o código do lote recebido na URL
    expect(screen.getByText('ORB-CRIT-999')).toBeDefined()

    // Deve exibir a massa informada
    expect(screen.getByText(/3\.200/i)).toBeDefined()

    // Deve exibir frações
    expect(screen.getByText(/150,5/i)).toBeDefined()
    expect(screen.getByText(/800/i)).toBeDefined()
    expect(screen.getByText(/2\.100/i)).toBeDefined()

    // Deve conter botão para voltar a materiais críticos
    expect(screen.getByRole('link', { name: /voltar a materiais críticos/i })).toBeDefined()
  })

  it('DcpDemonstracaoPublicaPage exibe Integridade Verificada quando o hash coincide e Hash Divergente quando adulterado', async () => {
    // 1. Caso com hash válido recalculado (ou sem hash prévio na URL)
    const { unmount } = render(
      <MemoryRouter
        initialEntries={[
          '/conferencia-lastro-demo?lote=ORB-CRIT-TEST&massa=1000&nd=50&au=200&cu=700&nfe=35260133000168000109550010000048121098765432',
        ]}
      >
        <Routes>
          <Route path="/conferencia-lastro-demo" element={<DcpDemonstracaoPublicaPage />} />
        </Routes>
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('status-integridade-verificada')).toBeDefined()
    })
    expect(screen.getByText(/Integridade Verificada/i)).toBeDefined()
    unmount()

    // 2. Caso com hash fornecido divergente do recálculo
    render(
      <MemoryRouter
        initialEntries={[
          '/conferencia-lastro-demo?lote=ORB-CRIT-TEST&massa=1000&nd=50&au=200&cu=700&nfe=35260133000168000109550010000048121098765432&hash=0000000000000000000000000000000000000000000000000000000000000000',
        ]}
      >
        <Routes>
          <Route path="/conferencia-lastro-demo" element={<DcpDemonstracaoPublicaPage />} />
        </Routes>
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('status-hash-divergente')).toBeDefined()
    })
    expect(screen.getByText(/Hash Divergente/i)).toBeDefined()
  })

  it('compatibilidade ConferenciaLastroPublicaPage: exibe demonstração funcional para ORB-CRIT sem erro de lote não encontrado', async () => {
    render(
      <MemoryRouter initialEntries={['/conferencia-lastro/ORB-CRIT-2026-X9B2?via=qr']}>
        <Routes>
          <Route
            path="/conferencia-lastro/:codigoOuId"
            element={<ConferenciaLastroPublicaPage />}
          />
        </Routes>
      </MemoryRouter>,
    )

    // Espera renderização sem mostrar 'Lastro Não Localizado'
    await waitFor(() => {
      expect(screen.getByText(/DCP Materiais Críticos Recuperados/i)).toBeDefined()
    })
    expect(screen.getByText('ORB-CRIT-2026-X9B2')).toBeDefined()
    expect(screen.queryByText(/Lastro Não Localizado/i)).toBeNull()
  })
})
