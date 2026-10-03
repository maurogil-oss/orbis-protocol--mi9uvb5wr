import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import PassaporteLotePublicoPage from '../PassaporteLotePublicoPage'
import * as cdvService from '@/services/cdvService'

vi.mock('@/services/cdvService', async () => {
  const actual =
    await vi.importActual<typeof import('@/services/cdvService')>('@/services/cdvService')
  return {
    ...actual,
    buscarLoteComPecasPorParametro: vi.fn(),
    registrarConsultaPublicaDpp: vi.fn().mockResolvedValue({ id: 'cons-1' }),
    obterHistoricoConsultasDpp: vi.fn().mockResolvedValue([]),
    calcularHashCanonicalLote: vi.fn().mockResolvedValue('a1b2c3d4e5f67890abcdef1234567890'),
  }
})

vi.mock('@/services/destinacaoFinalService', async () => {
  const actual = await vi.importActual<typeof import('@/services/destinacaoFinalService')>(
    '@/services/destinacaoFinalService',
  )
  return {
    ...actual,
    consultarDestinacaoFinalLote: vi.fn().mockResolvedValue(null),
  }
})

describe('PassaporteLotePublicoPage - Anexo I u_FE e Incerteza Consolidada', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('exibe incerteza relativa por material nas linhas e incerteza consolidada calculada no rodapé', async () => {
    const mockLote: cdvService.CdvLoteRecord = {
      id: 'lote-teste-123',
      cdv_id: 'cdv-1',
      cdv_nome: 'CDV Paranaense Sustentável',
      cdv_cnpj: '99.888.777/0001-66',
      veiculo_marca_modelo: 'VW Gol 1.6 2018',
      veiculo_placa: 'ABC1D23',
      veiculo_chassi: '9BWAA05U0DP123456',
      veiculo_baixa_detran: 'PR-BX-2026-991204',
      status: 'homologado',
      total_pecas: 2,
      total_peso_kg: 15.0,
      total_co2e_evitado_kg: 34.68,
      created: '2026-03-01T10:00:00.000Z',
      updated: '2026-03-01T10:00:00.000Z',
    }

    const mockPecas: cdvService.CdvPecaRecord[] = [
      {
        id: 'peca-1',
        lote_id: 'lote-teste-123',
        sku_interno: 'SKU-ACO-1',
        descricao_peca: 'Capô do Motor',
        categoria_material: 'aco',
        material_declarado: 'Aço Laminado',
        peso_kg: 10.0,
        fator_co2e_kg: 2.18,
        co2e_evitado_kg: 6.54,
        selo_dpp: 'ORB-PR-2026-0001-ACO',
        status_conformidade: 'aprovado',
        catalogo_numero: 1,
        created: '2026-03-01T10:00:00.000Z',
        updated: '2026-03-01T10:00:00.000Z',
      },
      {
        id: 'peca-2',
        lote_id: 'lote-teste-123',
        sku_interno: 'SKU-ALU-1',
        descricao_peca: 'Radiador de Alumínio',
        categoria_material: 'aluminio',
        material_declarado: 'Alumínio Fundido',
        peso_kg: 5.0,
        fator_co2e_kg: 14.4,
        co2e_evitado_kg: 21.6,
        selo_dpp: 'ORB-PR-2026-0002-ALU',
        status_conformidade: 'aprovado',
        catalogo_numero: 2,
        created: '2026-03-01T10:00:00.000Z',
        updated: '2026-03-01T10:00:00.000Z',
      },
    ]

    vi.mocked(cdvService.buscarLoteComPecasPorParametro).mockResolvedValue({
      lote: mockLote,
      pecas: mockPecas,
    })

    render(
      <MemoryRouter initialEntries={['/passaporte-lote/PR-BX-2026-991204']}>
        <Routes>
          <Route path="/passaporte-lote/:lote" element={<PassaporteLotePublicoPage />} />
        </Routes>
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByText('VW Gol 1.6 2018')).toBeInTheDocument()
    })

    // Deve conter a incerteza específica do Aço (±3.5%) e do Alumínio (±4.0%) nas linhas do Anexo I
    expect(screen.getByText('±3.5%')).toBeInTheDocument()
    expect(screen.getByText('±4.0%')).toBeInTheDocument()

    // O rodapé deve exibir a incerteza consolidada por quadratura e a nota de PE=0
    expect(screen.getByText(/Incerteza consolidada por quadratura/i)).toBeInTheDocument()
    expect(
      screen.getByText(/PE = 0,00 quando não há faturas de energia elétrica/i),
    ).toBeInTheDocument()
  })
})
