import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import PassaporteLotePublicoPage from '../PassaporteLotePublicoPage'
import PassaportePublicoPage from '../PassaportePublicoPage'

// Mock de Lote Consolidado e Peça Individual para teste de renderização da aba
vi.mock('@/services/cdvService', async () => {
  const actual =
    await vi.importActual<typeof import('@/services/cdvService')>('@/services/cdvService')
  return {
    ...actual,
    consultarLoteConsolidado: vi.fn().mockResolvedValue({
      lote: {
        id: 'c1jz14hgmf7n13i',
        cdv_nome: 'CDVerde Centro de Desmontagem Veicular',
        cdv_cnpj: '76.123.456/0001-12',
        cdv_codigo: 'DETRAN-PR-CDV-0089',
        veiculo_marca_modelo: 'Renault Clio Authentique 1.0 16V Hi-Flex',
        veiculo_chassi: '93YBB05U0GJ***711',
        veiculo_baixa_detran: 'PR-BX-2026-1240105',
        veiculo_seguradora: 'Porto Seguro Cia de Seguros',
        total_pecas: 49,
        total_peso_kg: 437.7,
        total_co2e_evitado_kg: 1584.81,
        is_demo: true,
        created: '2026-09-16T18:48:27.890Z',
      },
      pecas: [
        {
          id: 'p1',
          selo_dpp: 'PR-SEAL-2026-000101',
          sku_interno: 'CLIO-MOT-01',
          descricao_peca: 'Bloco do Motor 1.0 16V D4D com Mancais',
          categoria_material: 'aco',
          subsistema: 'Motor',
          material_declarado: 'Ferro Fundido / Aço Estrutural',
          peso_kg: 42.0,
          fator_co2e_kg: 2.85,
          co2e_evitado_kg: 119.7,
          responsavel_crea: 'CREA-PR 182.940/D',
          created: '2026-09-16T18:48:27.890Z',
        },
      ],
    }),
    consultarPassaportePorSelo: vi.fn().mockResolvedValue({
      id: 'p1',
      selo_dpp: 'PR-SEAL-2026-000101',
      sku_interno: 'CLIO-MOT-01',
      descricao_peca: 'Bloco do Motor 1.0 16V D4D com Mancais',
      categoria_material: 'aco',
      material_declarado: 'Ferro Fundido / Aço Estrutural',
      peso_kg: 42.0,
      fator_co2e_kg: 2.85,
      co2e_evitado_kg: 119.7,
      veiculo_baixa_detran: 'PR-BX-2026-1240105',
      cdv_cnpj: '76.123.456/0001-12',
      lote: 'c1jz14hgmf7n13i',
      created: '2026-09-16T18:48:27.890Z',
    }),
    registrarConsultaDpp: vi
      .fn()
      .mockResolvedValue({ id: 'c1', created: '2026-09-16T18:48:27.890Z' }),
    obterHistoricoConsultasDpp: vi.fn().mockResolvedValue({ total: 1, ultimas: [] }),
  }
})

describe('Aba Destinação Final no DPP Consolidado e DPP da Peça', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renderiza o botão da aba Destinação Final no DPP Consolidado do Lote e alterna entre abas', async () => {
    render(
      <MemoryRouter initialEntries={['/passaporte-lote/PR-BX-2026-1240105']}>
        <Routes>
          <Route path="/passaporte-lote/:lote" element={<PassaporteLotePublicoPage />} />
        </Routes>
      </MemoryRouter>,
    )

    // Aguardar carregar
    const abaDestinacaoBtn = await screen.findByRole('button', {
      name: /Destinação Final \(Gate, RLO & Metais\)/i,
    })
    expect(abaDestinacaoBtn).not.toBeNull()

    // Clicar para abrir a aba Destinação Final
    fireEvent.click(abaDestinacaoBtn)

    // Verificar se as 3 camadas e seus elementos principais aparecem
    expect(await screen.findByText(/Gate de Despoluição Veicular/i)).not.toBeNull()
    expect(screen.getByText(/Bateria, Pneus & Fluidos/i)).not.toBeNull()
    expect(screen.getByText(/CONAMA 401\/2008/i)).not.toBeNull()
    expect(screen.getByText(/MTR-SINIR-2026-8819204-PR/i)).not.toBeNull()

    // Camada 2: Óleo RLO e aviso de estimativa
    expect(
      screen.getByText(/Óleo Lubrificante Usado ou Contaminado \(RLO\) & Rerrefino/i),
    ).not.toBeNull()
    expect(screen.getAllByText(/Estimativa/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/VVB/i).length).toBeGreaterThan(0)

    // Camada 3: Metais / Carcaça
    expect(
      screen.getByText(/Metais, Carcaça & Catalisadores \(Reciclagem em Aciaria\)/i),
    ).not.toBeNull()
    expect(screen.getByText(/Claim Principal de Reciclagem/i)).not.toBeNull()

    // Balanço de massa do veículo presente na aba de destinação
    expect(screen.getAllByText(/Balanço de Massa do Veículo Doador/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Taxa de Valorização/i).length).toBeGreaterThan(0)
  })

  it('renderiza o bloco e aba Balanço de Massa do Veículo Doador com comparativo ELV e hash', async () => {
    render(
      <MemoryRouter initialEntries={['/passaporte-lote/PR-BX-2026-1240105']}>
        <Routes>
          <Route path="/passaporte-lote/:lote" element={<PassaporteLotePublicoPage />} />
        </Routes>
      </MemoryRouter>,
    )

    // Aguardar carregar e encontrar botão da aba Balanço de Massa
    const abaBalancoBtn = await screen.findByRole('button', {
      name: /Balanço de Massa do Veículo/i,
    })
    expect(abaBalancoBtn).not.toBeNull()

    fireEvent.click(abaBalancoBtn)

    // Elementos da aba dedicada de Balanço de Massa
    expect(
      await screen.findByText(/Balanço de Massa & Taxa de Valorização Circular \(%RRR\)/i),
    ).not.toBeNull()
    expect(screen.getAllByText(/Reúso Circular/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Destinação Final/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Perdas \/ Processo/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Diretiva ELV 2000\/53\/EC/i).length).toBeGreaterThan(0)
    expect(
      screen.getAllByText(/HASH SHA-256 CANÔNICO DO BALANÇO DE MASSA/i).length,
    ).toBeGreaterThan(0)
    expect(screen.getAllByText(/Reserva Metodológica Pré-Laudo/i).length).toBeGreaterThan(0)
  })

  it('renderiza o botão da aba Destinação Final no DPP Individual da Peça', async () => {
    render(
      <MemoryRouter initialEntries={['/passaporte/PR-SEAL-2026-000101']}>
        <Routes>
          <Route path="/passaporte/:selo" element={<PassaportePublicoPage />} />
        </Routes>
      </MemoryRouter>,
    )

    // Aba presente no DPP individual
    const abaDestinacaoBtn = await screen.findByRole('button', {
      name: /Destinação Final \(3 Camadas\)/i,
    })
    expect(abaDestinacaoBtn).not.toBeNull()

    fireEvent.click(abaDestinacaoBtn)

    expect(
      await screen.findByText(/Destinação Final & Cadeia de Despoluição do Veículo Doador/i),
    ).not.toBeNull()
    expect(screen.getByText(/Gate de Despoluição Veicular/i)).not.toBeNull()
  })
})
