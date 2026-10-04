import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import React from 'react'
import { ConsoleSandboxIngestaoTab } from '../ConsoleSandboxIngestaoTab'
import pb from '@/lib/pocketbase/client'

describe('ConsoleSandboxIngestaoTab - Tratamento de Erros e Gravação Real', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('exibe erro de backend quando a gravação de selos ou lotes falhar (não engole erros)', async () => {
    // Simula erro 400 Failed to create record do PocketBase em selos
    const selosCreateSpy = vi.spyOn(pb.collection('selos'), 'create').mockRejectedValue({
      status: 400,
      message: 'Failed to create record.',
      response: {
        data: {
          codigo_selo: { message: 'Only authorized roles can write.' },
        },
      },
    })

    render(<ConsoleSandboxIngestaoTab />)

    // Clica para gerar 1 documento sintético
    const btnGerar = screen.getByRole('button', { name: /Gerar 10 Docs Sintéticos/i })
    fireEvent.click(btnGerar)

    // Aguarda tabela aparecer com lote gerado
    await waitFor(() => {
      expect(screen.getByText(/Lote de Documentos Prontos/i)).toBeInTheDocument()
    })

    // Iniciar Ingestão no Pipeline
    const btnIngestar = screen.getByRole('button', { name: /Ingestar no Pipeline/i })
    fireEvent.click(btnIngestar)

    // Aguarda feedback de erro na tela
    await waitFor(() => {
      expect(screen.getByText(/Falha na ingestão:/i)).toBeInTheDocument()
    })

    // Deve exibir o badge/texto de ERRO BACKEND e não Sucesso
    expect(screen.getAllByText(/ERRO BACKEND/i).length).toBeGreaterThan(0)
    expect(screen.getByText(/Falhados: 10/i)).toBeInTheDocument()
    expect(screen.getByText(/Gravados: 0/i)).toBeInTheDocument()
    expect(selosCreateSpy).toHaveBeenCalled()
  })

  it('reporta sucesso e contagem de peças quando gravação no backend responde 200/201', async () => {
    vi.spyOn(pb.collection('selos'), 'create').mockResolvedValue({
      id: 'selo-123',
      codigo_selo: 'PR-SEAL-2026-999999',
    } as any)

    vi.spyOn(pb.collection('cdv_lotes'), 'create').mockResolvedValue({
      id: 'lote-123',
    } as any)

    vi.spyOn(pb.collection('cdv_pecas'), 'create').mockResolvedValue({
      id: 'peca-123',
    } as any)

    render(<ConsoleSandboxIngestaoTab />)

    // Troca volume para 1 para agilizar teste
    const btnVol1 = screen.getByRole('button', { name: '1' })
    fireEvent.click(btnVol1)

    // Clica para gerar
    const btnGerar = screen.getByRole('button', { name: /Gerar 1 Docs Sintéticos/i })
    fireEvent.click(btnGerar)

    await waitFor(() => {
      expect(screen.getByText(/Lote de Documentos Prontos/i)).toBeInTheDocument()
    })

    // Iniciar Ingestão
    const btnIngestar = screen.getByRole('button', { name: /Ingestar no Pipeline/i })
    fireEvent.click(btnIngestar)

    await waitFor(() => {
      expect(
        screen.getByText(/Ingestão concluída: 1 documento\(s\) gravado\(s\) com sucesso/i),
      ).toBeInTheDocument()
    })

    expect(screen.getByText(/Gravados: 1/i)).toBeInTheDocument()
    expect(screen.queryByText(/Falhados:/i)).not.toBeInTheDocument()
  })
})
