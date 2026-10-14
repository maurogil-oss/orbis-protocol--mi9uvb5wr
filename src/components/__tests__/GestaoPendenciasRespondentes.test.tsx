import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GestaoPendenciasRespondentes } from '../GestaoPendenciasRespondentes'
import * as cdvPendenciasService from '@/services/cdvPendenciasService'

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'usr-1', name: 'Gestor Teste', email: 'gestor@empresa.com' },
  }),
}))

describe('GestaoPendenciasRespondentes - Componente de UI', () => {
  const mockPendencias: cdvPendenciasService.CdvLotePendenciaRecord[] = [
    {
      id: 'p1',
      collectionId: 'cdv_lote_pendencias',
      collectionName: 'cdv_lote_pendencias',
      lote: 'lote-123',
      titulo: 'Nota fiscal do reciclador siderúrgico',
      descricao: 'Verificar se o peso bate com o romaneio.',
      tipo_pendencia: 'nota_fiscal_destinador',
      respondente_nome: 'Carlos Mendes',
      respondente_email: 'carlos@patio.com',
      respondente_papel: 'Fiscal de Pátio',
      status: 'preenchida',
      data_atribuicao: '2026-03-01T10:00:00Z',
      data_resolucao: '2026-03-01T12:00:00Z',
      resolvido_por_nome: 'Carlos Mendes',
      comprovante_documento_ref: 'NF-e 001.452',
      observacao_resolucao: 'Conferido com sucesso',
      created: '2026-03-01T10:00:00Z',
      updated: '2026-03-01T12:00:00Z',
    },
    {
      id: 'p2',
      collectionId: 'cdv_lote_pendencias',
      collectionName: 'cdv_lote_pendencias',
      lote: 'lote-123',
      titulo: 'Foto de pesagem da carcaça',
      tipo_pendencia: 'foto_pesagem',
      respondente_nome: 'Marcos Operação',
      respondente_email: 'marcos@patio.com',
      respondente_papel: 'Desmonte',
      status: 'pendente',
      data_atribuicao: '2026-03-01T10:00:00Z',
      created: '2026-03-01T10:00:00Z',
      updated: '2026-03-01T10:00:00Z',
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(cdvPendenciasService, 'listarPendenciasDoLote').mockResolvedValue(mockPendencias)
  })

  it('deve exibir o resumo visual X de Y pendências resolvidas', async () => {
    const onResumoChangeMock = vi.fn()
    render(
      <GestaoPendenciasRespondentes
        loteId="lote-123"
        loteIdentificador="LOTE-GOL-001"
        onResumoChange={onResumoChangeMock}
      />,
    )

    await waitFor(() => {
      const badgeResumo = screen.getByTestId('status-resumo-pendencias')
      expect(badgeResumo).toBeInTheDocument()
      expect(badgeResumo).toHaveTextContent('1 de 2 pendências resolvidas')
      expect(badgeResumo).toHaveTextContent('50% concluído')
    })

    expect(onResumoChangeMock).toHaveBeenCalledWith(
      expect.objectContaining({
        total: 2,
        resolvidas: 1,
        pendentes: 1,
        percentualConcluido: 50,
      }),
    )
  })

  it('deve renderizar os respondentes e títulos das pendências', async () => {
    render(<GestaoPendenciasRespondentes loteId="lote-123" loteIdentificador="LOTE-GOL-001" />)

    await waitFor(() => {
      expect(screen.getByText('Nota fiscal do reciclador siderúrgico')).toBeInTheDocument()
      expect(screen.getByText('Foto de pesagem da carcaça')).toBeInTheDocument()
      expect(screen.getByText('Carlos Mendes')).toBeInTheDocument()
      expect(screen.getByText('carlos@patio.com')).toBeInTheDocument()
      expect(screen.getByText('Marcos Operação')).toBeInTheDocument()
      expect(screen.getByText('marcos@patio.com')).toBeInTheDocument()
    })
  })

  it('deve permitir abrir o modal de atribuição de nova pendência', async () => {
    render(<GestaoPendenciasRespondentes loteId="lote-123" loteIdentificador="LOTE-GOL-001" />)

    await waitFor(() => {
      expect(screen.getByText('Atribuir Pendência')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Atribuir Pendência'))

    expect(screen.getByText('Atribuir Pendência de Coleta ao Respondente')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Ex.: Carlos Mendes')).toBeInTheDocument()
  })

  it('deve abrir o modal de resolução ao clicar em Resolver', async () => {
    render(<GestaoPendenciasRespondentes loteId="lote-123" loteIdentificador="LOTE-GOL-001" />)

    await waitFor(() => {
      expect(screen.getByText('Foto de pesagem da carcaça')).toBeInTheDocument()
    })

    const botaoResolver = screen.getByTitle('Marcar pendência como resolvida')
    fireEvent.click(botaoResolver)

    expect(screen.getByText('Marcar Pendência como Resolvida')).toBeInTheDocument()
    expect(screen.getByText('Foto de pesagem da carcaça')).toBeInTheDocument()
  })
})
