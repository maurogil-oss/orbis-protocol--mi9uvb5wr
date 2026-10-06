import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import ModoDemonstracaoOrientadaPage from '../ModoDemonstracaoOrientadaPage'
import * as demoAuditService from '@/services/demoAuditService'
import * as cdvService from '@/services/cdvService'
import * as relatorioLaudoPdf from '@/services/relatorioLaudoPdf'

describe('ModoDemonstracaoOrientadaPage (/demo)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(demoAuditService, 'registrarInicioDemonstracao').mockResolvedValue({ sucesso: true })
    vi.spyOn(cdvService, 'consultarLoteConsolidado').mockResolvedValue({
      lote: {
        id: 'c1jz14hgmf7n13i',
        veiculo_marca_modelo: 'Renault Clio Authentique 1.0 16V Hi-Flex',
        veiculo_baixa_detran: 'PR-BX-2026-1240105',
        veiculo_placa: 'AYK-7110',
        cartela_desmontagem: '12401050711',
        total_pecas: 77,
        total_peso_kg: 437.7,
        total_co2e_evitado_kg: 1584.81,
        cdv_cnpj: '76.123.456/0001-00',
        cdv_nome: 'CDVerde Centro de Desmontagem Veicular',
        is_demo: true,
      } as any,
      pecas: [
        {
          id: 'peca-01',
          catalogo_numero: 1,
          descricao_peca: 'Motor de Partida 12V Hi-Flex',
          categoria_material: 'aco',
          peso_kg: 3.8,
          co2e_evitado_kg: 9.31,
          selo_dpp: 'PR-DPP-CLIO-001',
        },
        {
          id: 'peca-50',
          catalogo_numero: 50,
          descricao_peca: 'Módulo Eletrônico de Injeção ECU',
          categoria_material: 'polimeros',
          peso_kg: 0.8,
          co2e_evitado_kg: 2.1,
          selo_dpp: 'PR-DPP-CLIO-050',
        },
      ] as any,
    })
  })

  it('deve renderizar a Etapa 1 (Boas-vindas) por padrão e acionar telemetria', async () => {
    render(
      <MemoryRouter initialEntries={['/demo']}>
        <ModoDemonstracaoOrientadaPage />
      </MemoryRouter>,
    )

    expect(screen.getByText(/Modo Demonstração Comercial/i)).toBeDefined()
    expect(
      screen.getByText(
        /A plataforma que transforma notas fiscais e dados operacionais em prova técnica/i,
      ),
    ).toBeDefined()

    // Verifica que o discurso oficial está no texto
    expect(
      screen.getByText(
        /A Orbis é plataforma de auditoria e rastreabilidade; nossas entregas são o cálculo da pegada de carbono/i,
      ),
    ).toBeDefined()

    expect(demoAuditService.registrarInicioDemonstracao).toHaveBeenCalled()

    // Verifica a presença explícita dos 3 Pilares Fundamentais na Etapa 1
    expect(screen.getByText(/Falha do Modelo Autodeclarado/i)).toBeDefined()
    expect(screen.getByText(/Prova Documental Unitária/i)).toBeDefined()
    expect(screen.getByText(/Imutabilidade & Verificabilidade Pública/i)).toBeDefined()
  })

  it('deve avançar para a Etapa 2 (Motor de Cálculo) e exibir segregação fóssil x biogênica', async () => {
    render(
      <MemoryRouter initialEntries={['/demo']}>
        <ModoDemonstracaoOrientadaPage />
      </MemoryRouter>,
    )

    // Clica no botão Próximo do topo ou inferior
    const proximos = screen.getAllByRole('button', { name: /Próxim/i })
    fireEvent.click(proximos[0])

    await waitFor(() => {
      expect(screen.getByText(/Motor de cálculo com segregação fóssil × biogênico/i)).toBeDefined()
    })

    expect(screen.getByText(/Emissão Fóssil/i)).toBeDefined()
    expect(screen.getByText(/Emissão Biogênica/i)).toBeDefined()
  })

  it('deve permitir pular diretamente para a Etapa 4 (Rastreabilidade CDV) pela trilha lateral', async () => {
    render(
      <MemoryRouter initialEntries={['/demo']}>
        <ModoDemonstracaoOrientadaPage />
      </MemoryRouter>,
    )

    // Clica na etapa 4 na trilha
    const etapa4Btns = screen.getAllByRole('button', { name: /Rastreabilidade veicular/i })
    fireEvent.click(etapa4Btns[0])

    await waitFor(() => {
      expect(screen.getByText(/Lote demo Renault Clio com selo DPP e 77 peças/i)).toBeDefined()
    })

    // Confere se o lote Clio foi renderizado
    expect(screen.getByText(/Renault Clio Authentique 1.0 16V Hi-Flex/i)).toBeDefined()
  })

  it('deve exibir os CTAs de encerramento na Etapa 6', async () => {
    render(
      <MemoryRouter initialEntries={['/demo']}>
        <ModoDemonstracaoOrientadaPage />
      </MemoryRouter>,
    )

    const etapa6Btns = screen.getAllByRole('button', { name: /Próximos passos e contratação/i })
    fireEvent.click(etapa6Btns[0])

    await waitFor(() => {
      expect(
        screen.getByText(
          /Pronto para colocar sua empresa em conformidade climática e tributária\?/i,
        ),
      ).toBeDefined()
    })

    const linkPlanos = screen.getByRole('link', { name: /Ver Planos & Tabela de Preços/i })
    expect(linkPlanos.getAttribute('href')).toBe('/planos')
  })

  it('deve exibir o botão Exportar Demonstração (PDF) no cabeçalho e acionar a exportação', async () => {
    const exportarSpy = vi
      .spyOn(relatorioLaudoPdf, 'exportarDemonstracaoOrientadaPdf')
      .mockResolvedValue({
        hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        codigo: 'ORBIS-DEMO-1240105-0001',
      })

    render(
      <MemoryRouter initialEntries={['/demo']}>
        <ModoDemonstracaoOrientadaPage />
      </MemoryRouter>,
    )

    const botoesExportar = screen.getAllByRole('button', {
      name: /Exportar Demonstração \(PDF\)/i,
    })
    expect(botoesExportar.length).toBeGreaterThanOrEqual(1)

    // Dispara exportação clicando no botão do cabeçalho
    fireEvent.click(botoesExportar[0])

    await waitFor(() => {
      expect(exportarSpy).toHaveBeenCalledTimes(1)
    })

    const payloadChamada = exportarSpy.mock.calls[0][0]
    expect(payloadChamada.loteClio?.baixaDetran).toBe('PR-BX-2026-1240105')
    expect(payloadChamada.dossie?.hashFechamento).toBeDefined()
    expect(payloadChamada.simulador?.tipoCombustivel).toBe('diesel')
  })
})
