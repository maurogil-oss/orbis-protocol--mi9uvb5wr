import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  calcularResumoPendencias,
  criarPendenciaLote,
  resolverPendenciaLote,
  reabrirPendenciaLote,
  cancelarPendenciaLote,
  listarPendenciasDoLote,
  type CdvLotePendenciaRecord,
} from '../cdvPendenciasService'
import pb from '@/lib/pocketbase/client'

vi.mock('@/lib/pocketbase/client', () => {
  const collectionMock = {
    getFullList: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  }
  return {
    default: {
      collection: vi.fn(() => collectionMock),
    },
  }
})

describe('cdvPendenciasService - Gestão de Respondentes e Pendências do Lote', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Cálculo do resumo X de Y pendências resolvidas', () => {
    it('deve retornar resumo vazio quando o lote não tem pendências', () => {
      const resumo = calcularResumoPendencias([])
      expect(resumo.total).toBe(0)
      expect(resumo.resolvidas).toBe(0)
      expect(resumo.pendentes).toBe(0)
      expect(resumo.percentualConcluido).toBe(100)
      expect(resumo.statusTexto).toBe('Sem pendências atribuídas')
      expect(resumo.todasResolvidas).toBe(true)
    })

    it('deve calcular corretamente 3 de 5 pendências resolvidas', () => {
      const mockPendencias: CdvLotePendenciaRecord[] = [
        {
          id: 'p1',
          collectionId: 'cdv_lote_pendencias',
          collectionName: 'cdv_lote_pendencias',
          lote: 'lote-gol-01',
          titulo: 'Nota fiscal do destinador',
          respondente_nome: 'Marcos Fiscal',
          respondente_email: 'marcos@patio.com',
          status: 'preenchida',
          created: '2026-03-01T10:00:00Z',
          updated: '2026-03-01T12:00:00Z',
        },
        {
          id: 'p2',
          collectionId: 'cdv_lote_pendencias',
          collectionName: 'cdv_lote_pendencias',
          lote: 'lote-gol-01',
          titulo: 'Foto da pesagem rodoviária',
          respondente_nome: 'João Pátio',
          respondente_email: 'joao@patio.com',
          status: 'preenchida',
          created: '2026-03-01T10:00:00Z',
          updated: '2026-03-01T12:00:00Z',
        },
        {
          id: 'p3',
          collectionId: 'cdv_lote_pendencias',
          collectionName: 'cdv_lote_pendencias',
          lote: 'lote-gol-01',
          titulo: 'ART do responsável técnico',
          respondente_nome: 'Eng. Roberto',
          respondente_email: 'roberto@engenharia.com',
          status: 'preenchida',
          created: '2026-03-01T10:00:00Z',
          updated: '2026-03-01T12:00:00Z',
        },
        {
          id: 'p4',
          collectionId: 'cdv_lote_pendencias',
          collectionName: 'cdv_lote_pendencias',
          lote: 'lote-gol-01',
          titulo: 'Comprovante de baixa DETRAN',
          respondente_nome: 'Clara Despachante',
          respondente_email: 'clara@juridico.com',
          status: 'pendente',
          created: '2026-03-01T10:00:00Z',
          updated: '2026-03-01T10:00:00Z',
        },
        {
          id: 'p5',
          collectionId: 'cdv_lote_pendencias',
          collectionName: 'cdv_lote_pendencias',
          lote: 'lote-gol-01',
          titulo: 'MTR SINIR final',
          respondente_nome: 'Marcos Fiscal',
          respondente_email: 'marcos@patio.com',
          status: 'pendente',
          created: '2026-03-01T10:00:00Z',
          updated: '2026-03-01T10:00:00Z',
        },
      ]

      const resumo = calcularResumoPendencias(mockPendencias)

      expect(resumo.total).toBe(5)
      expect(resumo.resolvidas).toBe(3)
      expect(resumo.pendentes).toBe(2)
      expect(resumo.percentualConcluido).toBe(60)
      expect(resumo.statusTexto).toBe('3 de 5 pendências resolvidas')
      expect(resumo.todasResolvidas).toBe(false)
    })

    it('deve desconsiderar pendências canceladas do total ativo', () => {
      const mockComCancelada: CdvLotePendenciaRecord[] = [
        {
          id: 'p1',
          collectionId: 'cdv_lote_pendencias',
          collectionName: 'cdv_lote_pendencias',
          lote: 'lote-02',
          titulo: 'NF Destinador',
          respondente_nome: 'Ana',
          respondente_email: 'ana@empresa.com',
          status: 'preenchida',
          created: '2026-03-01T10:00:00Z',
          updated: '2026-03-01T12:00:00Z',
        },
        {
          id: 'p2',
          collectionId: 'cdv_lote_pendencias',
          collectionName: 'cdv_lote_pendencias',
          lote: 'lote-02',
          titulo: 'Documento dispensado',
          respondente_nome: 'Carlos',
          respondente_email: 'carlos@empresa.com',
          status: 'cancelada',
          created: '2026-03-01T10:00:00Z',
          updated: '2026-03-01T12:00:00Z',
        },
      ]

      const resumo = calcularResumoPendencias(mockComCancelada)
      expect(resumo.total).toBe(1)
      expect(resumo.resolvidas).toBe(1)
      expect(resumo.canceladas).toBe(1)
      expect(resumo.percentualConcluido).toBe(100)
      expect(resumo.statusTexto).toBe('1 de 1 pendências resolvidas')
      expect(resumo.todasResolvidas).toBe(true)
    })
  })

  describe('Operações de Atribuição e Resolução de Pendências', () => {
    it('deve criar pendência com respondente designado (nome e e-mail)', async () => {
      const mockCreatedRecord: CdvLotePendenciaRecord = {
        id: 'pend-new-1',
        collectionId: 'cdv_lote_pendencias',
        collectionName: 'cdv_lote_pendencias',
        lote: 'lote-gol-01',
        titulo: 'Nota fiscal de destinação da sucata ferrosa',
        descricao: 'Anexar espelho da NF-e emitida pelo triturador credenciado.',
        tipo_pendencia: 'nota_fiscal_destinador',
        respondente_nome: 'Felipe Silveira',
        respondente_email: 'felipe@siderurgica.com.br',
        respondente_papel: 'Escritório Fiscal',
        status: 'pendente',
        created: '2026-03-01T14:00:00Z',
        updated: '2026-03-01T14:00:00Z',
      }

      const colMock = (pb.collection as any)()
      colMock.create.mockResolvedValueOnce(mockCreatedRecord)

      const result = await criarPendenciaLote({
        loteId: 'lote-gol-01',
        titulo: 'Nota fiscal de destinação da sucata ferrosa',
        descricao: 'Anexar espelho da NF-e emitida pelo triturador credenciado.',
        tipo_pendencia: 'nota_fiscal_destinador',
        respondente_nome: 'Felipe Silveira',
        respondente_email: 'felipe@siderurgica.com.br',
        respondente_papel: 'Escritório Fiscal',
      })

      expect(pb.collection).toHaveBeenCalledWith('cdv_lote_pendencias')
      expect(colMock.create).toHaveBeenCalledWith(
        expect.objectContaining({
          lote: 'lote-gol-01',
          titulo: 'Nota fiscal de destinação da sucata ferrosa',
          respondente_nome: 'Felipe Silveira',
          respondente_email: 'felipe@siderurgica.com.br',
          status: 'pendente',
        }),
      )
      expect(result.id).toBe('pend-new-1')
      expect(result.status).toBe('pendente')
    })

    it('deve rejeitar criação sem dados obrigatórios do respondente', async () => {
      await expect(
        criarPendenciaLote({
          loteId: '',
          titulo: 'Teste',
          respondente_nome: 'Fulano',
          respondente_email: 'fulano@teste.com',
        }),
      ).rejects.toThrow('Identificador do lote é obrigatório.')

      await expect(
        criarPendenciaLote({
          loteId: 'lote-01',
          titulo: '',
          respondente_nome: 'Fulano',
          respondente_email: 'fulano@teste.com',
        }),
      ).rejects.toThrow('Título da pendência é obrigatório.')

      await expect(
        criarPendenciaLote({
          loteId: 'lote-01',
          titulo: 'Teste',
          respondente_nome: '',
          respondente_email: 'fulano@teste.com',
        }),
      ).rejects.toThrow('Nome do respondente é obrigatório.')

      await expect(
        criarPendenciaLote({
          loteId: 'lote-01',
          titulo: 'Teste',
          respondente_nome: 'Fulano',
          respondente_email: '',
        }),
      ).rejects.toThrow('E-mail do respondente é obrigatório.')
    })

    it('deve marcar pendência como resolvida gravando quem resolveu e data', async () => {
      const colMock = (pb.collection as any)()
      colMock.update.mockResolvedValueOnce({
        id: 'pend-123',
        status: 'preenchida',
        data_resolucao: '2026-03-01T15:30:00Z',
        resolvido_por_nome: 'Auditor Carlos',
        comprovante_documento_ref: 'NF-e 045123',
      })

      const atualizado = await resolverPendenciaLote({
        pendenciaId: 'pend-123',
        resolvido_por_nome: 'Auditor Carlos',
        resolvido_por_email: 'carlos@orbis.com',
        comprovante_documento_ref: 'NF-e 045123',
        observacao_resolucao: 'Conferido com DANFE e balança',
      })

      expect(colMock.update).toHaveBeenCalledWith(
        'pend-123',
        expect.objectContaining({
          status: 'preenchida',
          resolvido_por_nome: 'Auditor Carlos',
          comprovante_documento_ref: 'NF-e 045123',
        }),
      )
      expect(atualizado.status).toBe('preenchida')
    })

    it('deve reabrir pendência preenchida voltando a pendente', async () => {
      const colMock = (pb.collection as any)()
      colMock.update.mockResolvedValueOnce({
        id: 'pend-123',
        status: 'pendente',
      })

      const reaberto = await reabrirPendenciaLote('pend-123')
      expect(colMock.update).toHaveBeenCalledWith('pend-123', {
        status: 'pendente',
        data_resolucao: '',
        observacao_resolucao: '',
      })
      expect(reaberto.status).toBe('pendente')
    })

    it('deve cancelar pendência com justificativa', async () => {
      const colMock = (pb.collection as any)()
      colMock.update.mockResolvedValueOnce({
        id: 'pend-123',
        status: 'cancelada',
      })

      const cancelado = await cancelarPendenciaLote('pend-123', 'Dispensado por decisão fiscal')
      expect(colMock.update).toHaveBeenCalledWith('pend-123', {
        status: 'cancelada',
        observacao_resolucao: 'Dispensado por decisão fiscal',
      })
      expect(cancelado.status).toBe('cancelada')
    })

    it('deve listar pendências do lote filtradas pelo identificador', async () => {
      const colMock = (pb.collection as any)()
      colMock.getFullList.mockResolvedValueOnce([
        { id: 'item1', lote: 'lote-gol-01', titulo: 'Pesagem', status: 'pendente' },
      ])

      const lista = await listarPendenciasDoLote('lote-gol-01')
      expect(colMock.getFullList).toHaveBeenCalledWith({
        filter: 'lote = "lote-gol-01"',
        sort: '-created',
        requestKey: null,
      })
      expect(lista).toHaveLength(1)
      expect(lista[0].id).toBe('item1')
    })
  })
})
