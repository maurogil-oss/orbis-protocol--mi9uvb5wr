import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import PassaporteLotePublicoPage from '../PassaporteLotePublicoPage'
import DcpCorporativoDemoPage from '../DcpCorporativoDemoPage'
import DcpProdutoPublicoPage from '../DcpProdutoPublicoPage'

// Mock dos serviços para retornar dados de teste determinísticos
vi.mock('@/services/cdvService', async () => {
  const actual =
    await vi.importActual<typeof import('@/services/cdvService')>('@/services/cdvService')
  return {
    ...actual,
    consultarLoteConsolidado: vi.fn().mockResolvedValue({
      lote: {
        id: 'LOTE-TESTE-123',
        cdv_nome: 'CDV EcoPeças Curitiba',
        cdv_cnpj: '12.345.678/0001-90',
        cdv_codigo: 'DETRAN-PR-CDV-0089',
        veiculo_marca_modelo: 'Toyota Corolla Cross 2.0 2023',
        veiculo_chassi: '9BRBL48E6M0***123',
        veiculo_baixa_detran: 'PR-BX-2026-999',
        veiculo_seguradora: 'Porto Seguro Cia de Seguros',
        total_pecas: 2,
        total_peso_kg: 50.5,
        total_co2e_evitado_kg: 120.3,
        is_demo: true,
        created: '2026-07-15T10:00:00.000Z',
      },
      pecas: [
        {
          id: 'peca-1',
          selo_dpp: 'ORB-CDV-PR-2026-001',
          sku_interno: 'SKU-MOT-01',
          descricao_peca: 'Bloco de Motor de Alumínio',
          categoria_material: 'aluminio',
          subsistema: 'Motor',
          material_declarado: 'Alumínio Fundido',
          peso_kg: 35.0,
          fator_co2e_kg: 8.24,
          co2e_evitado_kg: 85.0,
          responsavel_crea: 'CREA-PR 182.940/D',
        },
        {
          id: 'peca-2',
          selo_dpp: 'ORB-CDV-PR-2026-002',
          sku_interno: 'SKU-CAM-01',
          descricao_peca: 'Carcaça de Câmbio Automático',
          categoria_material: 'aluminio',
          subsistema: 'Câmbio',
          material_declarado: 'Alumínio Fundido',
          peso_kg: 15.5,
          fator_co2e_kg: 8.24,
          co2e_evitado_kg: 35.3,
          responsavel_crea: 'CREA-PR 182.940/D',
        },
      ],
    }),
    registrarConsultaDpp: vi
      .fn()
      .mockResolvedValue({ id: 'cons-1', created: '2026-07-20T10:00:00.000Z' }),
    obterHistoricoConsultasDpp: vi.fn().mockResolvedValue({
      total: 3,
      ultimas: [
        {
          id: 'c1',
          created: '2026-07-20T10:00:00.000Z',
          canal: 'qr',
          hash_conferido: true,
          ip_mascarado: '189.40.xxx.xxx',
        },
      ],
    }),
  }
})

describe('Mobile Optimization on Document Pages (DPP Lote, DCP Corporativo & DCP Produto)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('PassaporteLotePublicoPage renders mobile summary card and Gerar PDF CTA button', async () => {
    render(
      <MemoryRouter initialEntries={['/passaporte-lote/LOTE-TESTE-123']}>
        <Routes>
          <Route path="/passaporte-lote/:lote" element={<PassaporteLotePublicoPage />} />
        </Routes>
      </MemoryRouter>,
    )

    // Aguarda carregar dados
    const summaryHeading = await screen.findByText(/RESUMO DO DPP CONSOLIDADO/i)
    expect(summaryHeading).not.toBeNull()

    // Botão CTA Mobile "Gerar PDF / Imprimir Documento A4"
    const pdfButtons = screen.getAllByRole('button', {
      name: /Gerar PDF \/ Imprimir Documento A4/i,
    })
    expect(pdfButtons.length).toBeGreaterThanOrEqual(1)

    // Indicadores-chave do resumo
    expect(screen.getByText(/Veículo Doador/i)).not.toBeNull()
    expect(screen.getByText(/Massa Circular/i)).not.toBeNull()
    expect(screen.getByText(/Integridade Criptográfica/i)).not.toBeNull()
    expect(screen.getAllByText(/Verificada ✓/i).length).toBeGreaterThan(0)
  })

  it('DcpCorporativoDemoPage renders mobile summary card with scope indicators and Gerar PDF CTA', async () => {
    render(
      <MemoryRouter initialEntries={['/corporativo/dcp']}>
        <Routes>
          <Route path="/corporativo/dcp" element={<DcpCorporativoDemoPage />} />
        </Routes>
      </MemoryRouter>,
    )

    // Resumo mobile presente
    const summaryBadge = await screen.findByText(/RESUMO DO DCP CORPORATIVO/i)
    expect(summaryBadge).not.toBeNull()

    // CTA de PDF Mobile presente
    const pdfButton = screen.getByRole('button', { name: /Gerar PDF \/ Imprimir Documento A4/i })
    expect(pdfButton).not.toBeNull()

    // Indicadores de Escopo e Fechamento
    expect(screen.getByText(/Passivo Fóssil por Escopo/i)).not.toBeNull()
    expect(screen.getByText(/Escopo 1 \(Direto\)/i)).not.toBeNull()
    expect(screen.getByText(/Escopo 2 \(Energia\)/i)).not.toBeNull()
    expect(screen.getByText(/Fechamento SHA-256/i)).not.toBeNull()
  })

  it('DcpProdutoPublicoPage renders mobile summary card with functional unit and Gerar PDF CTA', async () => {
    render(
      <MemoryRouter initialEntries={['/dcp/ORB-DCP-KLBN-4819']}>
        <Routes>
          <Route path="/dcp/:selo" element={<DcpProdutoPublicoPage />} />
        </Routes>
      </MemoryRouter>,
    )

    // Resumo mobile presente
    const summaryBadge = await screen.findByText(/RESUMO DO DCP DO PRODUTO/i)
    expect(summaryBadge).not.toBeNull()

    // CTA de PDF Mobile presente
    const pdfButton = screen.getByRole('button', { name: /Gerar PDF \/ Imprimir Documento A4/i })
    expect(pdfButton).not.toBeNull()

    // Indicadores de Unidade Funcional e Prova Criptográfica
    expect(screen.getByText(/Unidade Funcional de Referência/i)).not.toBeNull()
    expect(screen.getByText(/Hash SHA-256 Verificável/i)).not.toBeNull()
    expect(screen.getByText(/Ciclo de Vida Cradle-to-Gate/i)).not.toBeNull()
  })
})
