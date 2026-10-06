import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import React from 'react'
import { BrowserRouter } from 'react-router-dom'
import LaudoIntegridadeDemoPage from '../LaudoIntegridadeDemoPage'
import pb from '@/lib/pocketbase/client'

describe('LaudoIntegridadeDemoPage - Anexo de Demonstração Geral', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('renderiza o laudo de integridade com estado real da base e botões de ação', async () => {
    vi.spyOn(pb.collection('cdv_lotes'), 'getFullList').mockResolvedValue([
      {
        id: 'lote-1',
        cdv_codigo: 'DETRAN-PR-CDV-0089',
        cdv_nome: 'CDV Demo',
        total_peso_kg: 50,
        total_co2e_evitado_kg: 205,
        status: 'processado',
        origem: 'sintetico',
        veiculo_chassi: '9BWAA05U0DP123456',
        veiculo_baixa_detran: 'PR-BX-2026-0001',
        payload_bruto_json: JSON.stringify({
          chaveAcesso: '41260976123456000100550010000001011234567890',
          hashSha256: 'a'.repeat(64),
        }),
      },
    ] as any)

    vi.spyOn(pb.collection('cdv_pecas'), 'getFullList').mockResolvedValue([
      {
        id: 'peca-1',
        lote: 'lote-1',
        peso_kg: 50,
        fator_co2e_kg: 4.1,
        co2e_evitado_kg: 205,
        categoria_material: 'cobre',
        descricao_peca: 'Cobre Refinado',
        hash_sha256: 'b'.repeat(64),
      },
    ] as any)

    vi.spyOn(pb.collection('emissoes_inventario'), 'getFullList').mockResolvedValue([])
    vi.spyOn(pb.collection('selos'), 'getFullList').mockResolvedValue([])

    render(
      <BrowserRouter>
        <LaudoIntegridadeDemoPage />
      </BrowserRouter>,
    )

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /Laudo de Integridade da Base dMRV/i }),
      ).toBeInTheDocument()
    })

    expect(screen.getByText(/Anexo Técnico Pericial • Demonstração Geral/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Reexecutar Auditoria/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Imprimir Laudo Pericial/i })).toBeInTheDocument()
    expect(screen.getByText(/Quadro de Verificações Periciais/i)).toBeInTheDocument()
    expect(
      screen.getByText(/Auditoria de Fatores Oficiais: Fator de Cobre Legado 5,40 Remanescente/i),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/Auditoria de Chaves Fiscais: Duplicidade de Chave de Acesso/i),
    ).toBeInTheDocument()
    expect(screen.getByText(/Integridade Relacional: Lotes e Peças Órfãos/i)).toBeInTheDocument()
  })
})
