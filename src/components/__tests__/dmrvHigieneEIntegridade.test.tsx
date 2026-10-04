import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import React from 'react'
import { ConsoleSandboxIngestaoTab } from '../ConsoleSandboxIngestaoTab'
import pb from '@/lib/pocketbase/client'

describe('ConsoleSandboxIngestaoTab - Higiene dMRV: Problemas A, B e C', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  // (a) PROBLEMA A: peça concreto/RCD grava categoria 'concreto', nunca 'outros'
  it('(a) peça concreto/RCD grava categoria "concreto", com fator 0.12 e status calculado, nunca "outros"', async () => {
    vi.spyOn(pb.collection('emissoes_inventario'), 'getFullList').mockResolvedValue([])
    vi.spyOn(pb.collection('emissoes_inventario'), 'create').mockResolvedValue({
      id: 'inv-cimento-1',
    } as any)
    vi.spyOn(pb.collection('selos'), 'create').mockResolvedValue({
      id: 'selo-1',
      codigo_selo: 'SELO-CONCRETO-1',
    } as any)
    vi.spyOn(pb.collection('cdv_lotes'), 'create').mockResolvedValue({
      id: 'lote-cimento-1',
    } as any)
    const pecasCreateSpy = vi.spyOn(pb.collection('cdv_pecas'), 'create').mockResolvedValue({
      id: 'peca-cimento-1',
    } as any)

    render(<ConsoleSandboxIngestaoTab />)

    // Seleciona Cimento e Construção Civil
    const select = screen.getByRole('combobox') as HTMLSelectElement
    fireEvent.change(select, { target: { value: 'cimento' } })

    // Volume 1
    const btnVol1 = screen.getByRole('button', { name: '1' })
    fireEvent.click(btnVol1)

    // Gerar
    const btnGerar = screen.getByRole('button', { name: /Gerar 1 Docs Sintéticos/i })
    fireEvent.click(btnGerar)

    await waitFor(() => {
      expect(screen.getByText(/Lote de Documentos Prontos/i)).toBeInTheDocument()
    })

    // Ingestar
    const btnIngestar = screen.getByRole('button', { name: /Ingestar no Pipeline/i })
    fireEvent.click(btnIngestar)

    await waitFor(() => {
      expect(pecasCreateSpy).toHaveBeenCalled()
    })

    // Cada peça gerada para cimento/concreto DEVE ter categoria_material === 'concreto', NUNCA 'outros'
    const chamadas = pecasCreateSpy.mock.calls
    expect(chamadas.length).toBeGreaterThan(0)
    for (const [rawPayload] of chamadas) {
      const payload = rawPayload as Record<string, any>
      expect(payload.categoria_material).toBe('concreto')
      expect(payload.categoria_material).not.toBe('outros')
      expect(payload.fator_co2e_kg).toBe(0.12)
    }
  })

  // (b) PROBLEMA B: duas ingestões do mesmo segmento/CNPJ mantêm exatamente 1 registro de inventário (upsert)
  it('(b) duas ingestões do mesmo segmento/CNPJ executam update no inventário existente e mantêm 1 registro', async () => {
    const invExistente = {
      id: 'inv-existente-urban-mining',
      cnpj: '38.456.789/0001-12',
      laudo_detalhes_json: JSON.stringify({
        segmento: 'materiais-criticos-recuperados',
        tipo: 'sandbox_sintetico',
      }),
    }

    const getFullListSpy = vi
      .spyOn(pb.collection('emissoes_inventario'), 'getFullList')
      .mockResolvedValue([invExistente] as any)
    const createInvSpy = vi.spyOn(pb.collection('emissoes_inventario'), 'create')
    const updateInvSpy = vi
      .spyOn(pb.collection('emissoes_inventario'), 'update')
      .mockResolvedValue({ id: invExistente.id } as any)

    vi.spyOn(pb.collection('selos'), 'create').mockResolvedValue({ id: 'selo-1' } as any)
    vi.spyOn(pb.collection('cdv_lotes'), 'create').mockResolvedValue({ id: 'lote-1' } as any)
    vi.spyOn(pb.collection('cdv_pecas'), 'create').mockResolvedValue({ id: 'peca-1' } as any)

    render(<ConsoleSandboxIngestaoTab />)

    // Seleciona Mineração Urbana
    const select = screen.getByRole('combobox') as HTMLSelectElement
    fireEvent.change(select, { target: { value: 'materiais-criticos-recuperados' } })

    const btnVol1 = screen.getByRole('button', { name: '1' })
    fireEvent.click(btnVol1)

    const btnGerar = screen.getByRole('button', { name: /Gerar 1 Docs Sintéticos/i })
    fireEvent.click(btnGerar)

    await waitFor(() => {
      expect(screen.getByText(/Lote de Documentos Prontos/i)).toBeInTheDocument()
    })

    const btnIngestar = screen.getByRole('button', { name: /Ingestar no Pipeline/i })
    fireEvent.click(btnIngestar)

    await waitFor(() => {
      expect(updateInvSpy).toHaveBeenCalled()
    })

    // Como já existia inventário com o mesmo CNPJ e segmento, executou UPDATE e NÃO create
    expect(getFullListSpy).toHaveBeenCalled()
    expect(updateInvSpy).toHaveBeenCalledWith(
      invExistente.id,
      expect.objectContaining({
        origem: 'sintetico',
        laudo_detalhes_json: expect.objectContaining({
          segmento: 'materiais-criticos-recuperados',
          atualizadoEm: expect.any(String),
        }),
      }),
    )
    expect(createInvSpy).not.toHaveBeenCalled()
  })

  // (c) PROBLEMA C: lotes de segmentos não-veiculares gravam campos veiculares vazios, e só 'automotiva' os popula
  it('(c) lotes de segmentos não-veiculares gravam campos veiculares vazios, enquanto automotiva os popula', async () => {
    vi.spyOn(pb.collection('emissoes_inventario'), 'getFullList').mockResolvedValue([])
    vi.spyOn(pb.collection('emissoes_inventario'), 'create').mockResolvedValue({
      id: 'inv-1',
    } as any)
    vi.spyOn(pb.collection('selos'), 'create').mockResolvedValue({ id: 'selo-1' } as any)
    const lotesCreateSpy = vi.spyOn(pb.collection('cdv_lotes'), 'create').mockResolvedValue({
      id: 'lote-1',
    } as any)
    vi.spyOn(pb.collection('cdv_pecas'), 'create').mockResolvedValue({ id: 'peca-1' } as any)

    // 1. Testa segmento NÃO-VEICULAR: Farmacêutica
    const { unmount } = render(<ConsoleSandboxIngestaoTab />)
    const select = screen.getByRole('combobox') as HTMLSelectElement
    fireEvent.change(select, { target: { value: 'farmaceutica' } })

    const btnVol1 = screen.getByRole('button', { name: '1' })
    fireEvent.click(btnVol1)

    const btnGerar = screen.getByRole('button', { name: /Gerar 1 Docs Sintéticos/i })
    fireEvent.click(btnGerar)

    await waitFor(() => {
      expect(screen.getByText(/Lote de Documentos Prontos/i)).toBeInTheDocument()
    })

    const btnIngestar = screen.getByRole('button', { name: /Ingestar no Pipeline/i })
    fireEvent.click(btnIngestar)

    await waitFor(() => {
      expect(lotesCreateSpy).toHaveBeenCalled()
    })

    expect(lotesCreateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        origem: 'sintetico',
        veiculo_chassi: '',
        veiculo_baixa_detran: '',
        veiculo_placa: '',
        veiculo_seguradora: '',
        veiculo_marca_modelo: '',
      }),
    )

    unmount()
    lotesCreateSpy.mockClear()

    // 2. Testa segmento VEICULAR: Automotiva
    render(<ConsoleSandboxIngestaoTab />)
    const selectAuto = screen.getByRole('combobox') as HTMLSelectElement
    fireEvent.change(selectAuto, { target: { value: 'automotiva' } })

    const btnVolAuto = screen.getByRole('button', { name: '1' })
    fireEvent.click(btnVolAuto)

    const btnGerarAuto = screen.getByRole('button', { name: /Gerar 1 Docs Sintéticos/i })
    fireEvent.click(btnGerarAuto)

    await waitFor(() => {
      expect(screen.getByText(/Lote de Documentos Prontos/i)).toBeInTheDocument()
    })

    const btnIngestarAuto = screen.getByRole('button', { name: /Ingestar no Pipeline/i })
    fireEvent.click(btnIngestarAuto)

    await waitFor(() => {
      expect(lotesCreateSpy).toHaveBeenCalled()
    })

    // Para automotiva, os campos veiculares DEVEM estar preenchidos
    expect(lotesCreateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        origem: 'sintetico',
        veiculo_chassi: expect.stringMatching(/.+/),
        veiculo_baixa_detran: expect.stringMatching(/^SYN-BX-/),
        veiculo_marca_modelo: expect.stringMatching(/Demonstração/),
      }),
    )
  })
})
