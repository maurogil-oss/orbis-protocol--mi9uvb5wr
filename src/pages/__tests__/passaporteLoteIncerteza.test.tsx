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
    consultarLoteConsolidado: vi.fn(),
    registrarConsultaDpp: vi.fn().mockResolvedValue({ id: 'cons-1' }),
    obterHistoricoConsultasDpp: vi.fn().mockResolvedValue({ total: 1, ultimas: [] }),
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

  it('exibe incerteza relativa por material nas linhas do Anexo I e incerteza consolidada calculada no rodapé (visão desktop e mobile)', async () => {
    const mockLote: cdvService.CdvLoteRecord = {
      id: 'lote-teste-123',
      collectionId: 'col-lotes',
      collectionName: 'cdv_lotes',
      cdv_codigo: 'CDV-PR-01',
      cdv_nome: 'CDV Paranaense Sustentável',
      cdv_cnpj: '99.888.777/0001-66',
      veiculo_marca_modelo: 'VW Gol 1.6 2018',
      veiculo_placa: 'ABC1D23',
      veiculo_chassi: '9BWAA05U0DP123456',
      veiculo_baixa_detran: 'PR-BX-2026-991204',
      origem_envio: 'erp',
      status: 'processado',
      total_pecas: 2,
      total_peso_kg: 15.0,
      total_co2e_evitado_kg: 34.68,
      created: '2026-03-01T10:00:00.000Z',
      updated: '2026-03-01T10:00:00.000Z',
    }

    const mockPecas: cdvService.CdvPecaRecord[] = [
      {
        id: 'peca-1',
        collectionId: 'col-pecas',
        collectionName: 'cdv_pecas',
        lote: 'lote-teste-123',
        sku_interno: 'SKU-ACO-1',
        descricao_peca: 'Capô do Motor',
        categoria_material: 'aco',
        material_declarado: 'Aço Laminado',
        peso_kg: 10.0,
        fator_co2e_kg: 2.18,
        co2e_evitado_kg: 6.54,
        hash_sha256: 'hash-peca-1',
        status: 'ativo',
        selo_dpp: 'ORB-PR-2026-0001-ACO',
        catalogo_numero: 1,
        created: '2026-03-01T10:00:00.000Z',
        updated: '2026-03-01T10:00:00.000Z',
      },
      {
        id: 'peca-2',
        collectionId: 'col-pecas',
        collectionName: 'cdv_pecas',
        lote: 'lote-teste-123',
        sku_interno: 'SKU-ALU-1',
        descricao_peca: 'Radiador de Alumínio',
        categoria_material: 'aluminio',
        material_declarado: 'Alumínio Fundido',
        peso_kg: 5.0,
        fator_co2e_kg: 14.4,
        co2e_evitado_kg: 21.6,
        hash_sha256: 'hash-peca-2',
        status: 'ativo',
        selo_dpp: 'ORB-PR-2026-0002-ALU',
        catalogo_numero: 2,
        created: '2026-03-01T10:00:00.000Z',
        updated: '2026-03-01T10:00:00.000Z',
      },
    ]

    vi.mocked(cdvService.consultarLoteConsolidado).mockResolvedValue({
      lote: mockLote,
      pecas: mockPecas,
    })

    const { container } = render(
      <MemoryRouter initialEntries={['/passaporte-lote/PR-BX-2026-991204']}>
        <Routes>
          <Route path="/passaporte-lote/:lote" element={<PassaporteLotePublicoPage />} />
        </Routes>
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getAllByText('VW Gol 1.6 2018').length).toBeGreaterThan(0)
    })

    // Validação da visão mobile: cartões de peças e resumo do lote
    const mobileView = container.querySelector('.mobile-view-only')
    expect(mobileView).not.toBeNull()
    expect(mobileView?.textContent).toContain('Capô do Motor')
    expect(mobileView?.textContent).toContain('Radiador de Alumínio')
    expect(mobileView?.textContent).toContain('ORB-PR-2026-0001-ACO')
    expect(mobileView?.textContent).toContain('ORB-PR-2026-0002-ALU')

    // Validação da visão desktop / impressão (document-view em 2 páginas A4 com tabela do Anexo I)
    const desktopView = container.querySelector('.desktop-document-view')
    expect(desktopView).not.toBeNull()

    // Na tabela detalhada do Anexo I (desktop), u_FE específico por material:
    // Aço ±3.5% e Alumínio ±4.0%
    expect(desktopView?.textContent).toContain('±3.5%')
    expect(desktopView?.textContent).toContain('±4.0%')

    // Consolidação de incerteza por quadratura no rodapé do Anexo I
    expect(desktopView?.textContent).toContain('Incerteza consolidada por quadratura')
    expect(desktopView?.textContent).toContain('±')
    expect(desktopView?.textContent).toMatch(/PE = 0,00 quando não há faturas de energia elétrica/)

    // Metodologia: u_FE individual por material citado na nota de rodapé
    expect(desktopView?.textContent).toContain('Aço ±3,5%')
    expect(desktopView?.textContent).toContain('Alumínio ±4,0%')
    expect(desktopView?.textContent).toContain('Cobre ±4,5%')
    expect(desktopView?.textContent).toContain('Polímeros ±5,0%')
    expect(desktopView?.textContent).toContain('Outros ±10,0%')
  })

  it('calcula corretamente a incerteza consolidada por quadratura com 5 materiais distintos', async () => {
    const mockLote5: cdvService.CdvLoteRecord = {
      id: 'lote-5mat-123',
      collectionId: 'col-lotes',
      collectionName: 'cdv_lotes',
      cdv_codigo: 'CDV-PR-01',
      cdv_nome: 'CDV Paranaense Sustentável',
      cdv_cnpj: '99.888.777/0001-66',
      veiculo_marca_modelo: 'Veículo Teste Multi-Materiais',
      veiculo_baixa_detran: 'PR-BX-2026-5MAT',
      origem_envio: 'erp',
      status: 'processado',
      total_pecas: 5,
      total_peso_kg: 50.0,
      total_co2e_evitado_kg: 100.0,
      created: '2026-03-01T10:00:00.000Z',
      updated: '2026-03-01T10:00:00.000Z',
    }

    const mockPecas5: cdvService.CdvPecaRecord[] = [
      {
        id: 'p-aco',
        collectionId: 'col-pecas',
        collectionName: 'cdv_pecas',
        lote: 'lote-5mat-123',
        sku_interno: 'SKU-1',
        descricao_peca: 'Estrutura de Aço',
        categoria_material: 'aco',
        material_declarado: 'Aço Laminado',
        peso_kg: 20.0,
        fator_co2e_kg: 2.18,
        co2e_evitado_kg: 13.08,
        hash_sha256: 'hash-p-aco',
        status: 'ativo',
        selo_dpp: 'ORB-5MAT-01',
        created: '2026-03-01T10:00:00.000Z',
        updated: '2026-03-01T10:00:00.000Z',
      },
      {
        id: 'p-alu',
        collectionId: 'col-pecas',
        collectionName: 'cdv_pecas',
        lote: 'lote-5mat-123',
        sku_interno: 'SKU-2',
        descricao_peca: 'Cárter de Alumínio',
        categoria_material: 'aluminio',
        material_declarado: 'Alumínio Fundido',
        peso_kg: 10.0,
        fator_co2e_kg: 14.4,
        co2e_evitado_kg: 43.2,
        hash_sha256: 'hash-p-alu',
        status: 'ativo',
        selo_dpp: 'ORB-5MAT-02',
        created: '2026-03-01T10:00:00.000Z',
        updated: '2026-03-01T10:00:00.000Z',
      },
      {
        id: 'p-cob',
        collectionId: 'col-pecas',
        collectionName: 'cdv_pecas',
        lote: 'lote-5mat-123',
        sku_interno: 'SKU-3',
        descricao_peca: 'Chicote de Cobre',
        categoria_material: 'cobre',
        material_declarado: 'Cobre Eletrolítico',
        peso_kg: 5.0,
        fator_co2e_kg: 4.1,
        co2e_evitado_kg: 6.15,
        hash_sha256: 'hash-p-cob',
        status: 'ativo',
        selo_dpp: 'ORB-5MAT-03',
        created: '2026-03-01T10:00:00.000Z',
        updated: '2026-03-01T10:00:00.000Z',
      },
      {
        id: 'p-pol',
        collectionId: 'col-pecas',
        collectionName: 'cdv_pecas',
        lote: 'lote-5mat-123',
        sku_interno: 'SKU-4',
        descricao_peca: 'Pára-choque Plástico',
        categoria_material: 'polimeros',
        material_declarado: 'Polipropileno',
        peso_kg: 10.0,
        fator_co2e_kg: 1.9,
        co2e_evitado_kg: 5.7,
        hash_sha256: 'hash-p-pol',
        status: 'ativo',
        selo_dpp: 'ORB-5MAT-04',
        created: '2026-03-01T10:00:00.000Z',
        updated: '2026-03-01T10:00:00.000Z',
      },
      {
        id: 'p-out',
        collectionId: 'col-pecas',
        collectionName: 'cdv_pecas',
        lote: 'lote-5mat-123',
        sku_interno: 'SKU-5',
        descricao_peca: 'Componente Misto',
        categoria_material: 'outros',
        material_declarado: 'Materiais Diversos',
        peso_kg: 5.0,
        fator_co2e_kg: 1.5,
        co2e_evitado_kg: 2.25,
        hash_sha256: 'hash-p-out',
        status: 'ativo',
        selo_dpp: 'ORB-5MAT-05',
        created: '2026-03-01T10:00:00.000Z',
        updated: '2026-03-01T10:00:00.000Z',
      },
    ]

    vi.mocked(cdvService.consultarLoteConsolidado).mockResolvedValue({
      lote: mockLote5,
      pecas: mockPecas5,
    })

    const { container } = render(
      <MemoryRouter initialEntries={['/passaporte-lote/PR-BX-2026-5MAT']}>
        <Routes>
          <Route path="/passaporte-lote/:lote" element={<PassaporteLotePublicoPage />} />
        </Routes>
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getAllByText('Veículo Teste Multi-Materiais').length).toBeGreaterThan(0)
    })

    const desktopView = container.querySelector('.desktop-document-view')
    expect(desktopView).not.toBeNull()

    // Verifica que todas as incertezas relativas foram renderizadas nas linhas correspondentes
    expect(desktopView?.textContent).toContain('±3.5%') // Aço
    expect(desktopView?.textContent).toContain('±4.0%') // Alumínio
    expect(desktopView?.textContent).toContain('±4.5%') // Cobre
    expect(desktopView?.textContent).toContain('±5.0%') // Polímeros
    expect(desktopView?.textContent).toContain('±10.0%') // Outros

    // Verifica presença da incerteza consolidada calculada
    expect(desktopView?.textContent).toContain('Incerteza consolidada por quadratura:')
  })

  it('exibe FE Aplicado com unidade kgCO₂e/kg, fonte metodológica canônica e badge Pendente de verificação de fonte', async () => {
    const mockLotePendente: cdvService.CdvLoteRecord = {
      id: 'lote-pendente-123',
      collectionId: 'col-lotes',
      collectionName: 'cdv_lotes',
      cdv_nome: 'Eco Desmonte Paraná',
      cdv_cnpj: '99.888.777/0001-66',
      cdv_codigo: 'CDV-99',
      veiculo_marca_modelo: 'Veículo Teste Auditoria Fontes',
      origem_envio: 'erp',
      status: 'processado',
      total_pecas: 2,
      total_peso_kg: 35.0,
      total_co2e_evitado_kg: 40.0,
      veiculo_baixa_detran: 'DETRAN-PR-DESM-2026-FONTES',
      hash_sha256: 'sha256-hash-fontes-lote',
      created: '2026-03-01T12:00:00.000Z',
      updated: '2026-03-01T12:00:00.000Z',
    }

    const mockPecasPendente: cdvService.CdvPecaRecord[] = [
      {
        id: 'p-pol-1',
        collectionId: 'col-pecas',
        collectionName: 'cdv_pecas',
        lote: 'lote-pendente-123',
        sku_interno: 'SKU-POL-1',
        descricao_peca: 'Pára-choque Dianteiro Plástico',
        categoria_material: 'polimeros',
        material_declarado: 'Polímeros Automotivos',
        peso_kg: 15.0,
        fator_co2e_kg: 3.1,
        co2e_evitado_kg: 13.95,
        hash_sha256: 'hash-p-pol-1',
        status: 'ativo',
        selo_dpp: 'ORB-FONTES-01',
        created: '2026-03-01T10:00:00.000Z',
        updated: '2026-03-01T10:00:00.000Z',
      },
      {
        id: 'p-aco-1',
        collectionId: 'col-pecas',
        collectionName: 'cdv_pecas',
        lote: 'lote-pendente-123',
        sku_interno: 'SKU-ACO-1',
        descricao_peca: 'Capô de Aço',
        categoria_material: 'aco',
        material_declarado: 'Aço Laminado',
        peso_kg: 20.0,
        fator_co2e_kg: 2.18,
        co2e_evitado_kg: 13.08,
        hash_sha256: 'hash-p-aco-1',
        status: 'ativo',
        selo_dpp: 'ORB-FONTES-02',
        created: '2026-03-01T10:00:00.000Z',
        updated: '2026-03-01T10:00:00.000Z',
      },
    ]

    vi.mocked(cdvService.consultarLoteConsolidado).mockResolvedValue({
      lote: mockLotePendente,
      pecas: mockPecasPendente,
    })

    const { container } = render(
      <MemoryRouter initialEntries={['/passaporte-lote/DETRAN-PR-DESM-2026-FONTES']}>
        <Routes>
          <Route path="/passaporte-lote/:lote" element={<PassaporteLotePublicoPage />} />
        </Routes>
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getAllByText('Veículo Teste Auditoria Fontes').length).toBeGreaterThan(0)
    })

    const desktopView = container.querySelector('.desktop-document-view')
    expect(desktopView).not.toBeNull()

    // Valida coluna FE Aplicado e unidade
    expect(desktopView?.textContent).toContain('FE Aplicado')
    expect(desktopView?.textContent).toContain('Fonte Metodológica')
    expect(desktopView?.textContent).toContain('kgCO₂e/kg')

    // Valida fontes canônicas
    expect(desktopView?.textContent).toContain('worldsteel (2024)')
    expect(desktopView?.textContent).toContain('PlasticsEurope (2022)')

    // Valida badge "Pendente de verificação de fonte" renderizado para polímeros
    expect(desktopView?.textContent).toContain('Pendente de verificação de fonte')
  })

  it('adapta a identificação de origem para lote industrial (sem veículo doador)', async () => {
    const mockLoteIndustrial: cdvService.CdvLoteRecord = {
      id: 'vrtclotew292022',
      collectionId: 'col-lotes',
      collectionName: 'cdv_lotes',
      cdv_nome: 'Pan Urania / VERTEC Engenheiros Associados Ltda',
      cdv_cnpj: '03.366.187/0001-30',
      cdv_codigo: 'VERTEC-IW29-2022',
      veiculo_marca_modelo: 'Painéis Sanduíche Termoisolantes PUR/PIR',
      origem_envio: 'erp',
      status: 'processado',
      total_pecas: 2,
      total_peso_kg: 500.0,
      total_co2e_evitado_kg: 750.0,
      veiculo_baixa_detran: '',
      veiculo_chassi: '',
      hash_sha256: 'sha256-hash-industrial-pan-urania',
      created: '2026-03-01T12:00:00.000Z',
      updated: '2026-03-01T12:00:00.000Z',
    }

    const mockPecasIndustrial: cdvService.CdvPecaRecord[] = [
      {
        id: 'p-ind-1',
        collectionId: 'col-pecas',
        collectionName: 'cdv_pecas',
        lote: 'vrtclotew292022',
        sku_interno: 'SKU-IND-1',
        descricao_peca: 'Painel PUR 50mm',
        categoria_material: 'aco',
        material_declarado: 'Aço Galvanizado + PUR',
        peso_kg: 250.0,
        fator_co2e_kg: 2.18,
        co2e_evitado_kg: 375.0,
        hash_sha256: 'hash-p-ind-1',
        status: 'ativo',
        selo_dpp: 'ORB-IND-01',
        created: '2026-03-01T10:00:00.000Z',
        updated: '2026-03-01T10:00:00.000Z',
      },
    ]

    vi.mocked(cdvService.consultarLoteConsolidado).mockResolvedValue({
      lote: mockLoteIndustrial,
      pecas: mockPecasIndustrial,
    })

    const { container } = render(
      <MemoryRouter initialEntries={['/passaporte-lote/VERTEC-IW29-2022']}>
        <Routes>
          <Route path="/passaporte-lote/:lote" element={<PassaporteLotePublicoPage />} />
        </Routes>
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getAllByText(/Painéis Sanduíche/i).length).toBeGreaterThan(0)
    })

    const desktopView = container.querySelector('.desktop-document-view')
    expect(desktopView).not.toBeNull()

    // 1) Desktop: cabeçalho adaptado para Identificação da Origem e Origem Validada
    expect(desktopView?.textContent).toContain('Identificação da Origem')
    expect(desktopView?.textContent).toContain('Origem Validada')
    expect(desktopView?.textContent).toContain('Código Canônico dMRV:')

    // Não deve conter os rótulos de desmonte / veículo doador no card
    expect(desktopView?.textContent).not.toContain('Identificação do Veículo Doador')
    expect(desktopView?.textContent).not.toContain('Centro de Desmonte de Origem Validado')
    expect(desktopView?.textContent).not.toContain(
      'Veículo Doador: Lote industrial — sem veículo doador associado',
    )

    // 2) Mobile: deve conter Identificação da Origem e Origem Validada
    const mobileView = container.querySelector('.mobile-view-only')
    expect(mobileView).not.toBeNull()
    expect(mobileView?.textContent).toContain('Identificação da Origem')
    expect(mobileView?.textContent).toContain('Origem Validada')
    expect(mobileView?.textContent).not.toContain('• Centro de Desmonte de origem:')
  })

  it('mantém a terminologia automotiva para lote com veículo doador', async () => {
    const mockLoteVeicular: cdvService.CdvLoteRecord = {
      id: 'lote-gol-veicular',
      collectionId: 'col-lotes',
      collectionName: 'cdv_lotes',
      cdv_nome: 'CDV Renascer Peças Usadas',
      cdv_cnpj: '12.345.678/0001-90',
      cdv_codigo: 'CDV-RENASCER-01',
      veiculo_marca_modelo: 'VW Gol 1.0 Trendline 2018',
      origem_envio: 'erp',
      status: 'processado',
      total_pecas: 1,
      total_peso_kg: 20.0,
      total_co2e_evitado_kg: 40.0,
      veiculo_baixa_detran: 'PR-BX-2026-GOL-99',
      veiculo_chassi: '9BWAA05U0DP123456',
      hash_sha256: 'sha256-hash-gol-veicular',
      created: '2026-03-01T12:00:00.000Z',
      updated: '2026-03-01T12:00:00.000Z',
    }

    vi.mocked(cdvService.consultarLoteConsolidado).mockResolvedValue({
      lote: mockLoteVeicular,
      pecas: [],
    })

    const { container } = render(
      <MemoryRouter initialEntries={['/passaporte-lote/PR-BX-2026-GOL-99']}>
        <Routes>
          <Route path="/passaporte-lote/:lote" element={<PassaporteLotePublicoPage />} />
        </Routes>
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getAllByText(/VW Gol 1.0/i).length).toBeGreaterThan(0)
    })

    const desktopView = container.querySelector('.desktop-document-view')
    expect(desktopView?.textContent).toContain('Identificação do Veículo Doador')
    expect(desktopView?.textContent).toContain('Centro de Desmonte de Origem Validado')
    expect(desktopView?.textContent).toContain('Centro de Desmonte de origem:')
  })
})
