import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest'
import {
  buildPagBankOrderPayload,
  extractPagBankPixData,
  PagBankOrderResponse,
} from '@/services/pagbankAdapter'
import {
  criarCobrancaPix,
  consultarCobranca,
  confirmarPagamentoSimulado,
  SERVICOS_COBRANCA,
} from '@/services/cobrancaService'
import pb from '@/lib/pocketbase/client'

// Mock do pocketbase client
vi.mock('@/lib/pocketbase/client', () => {
  return {
    default: {
      baseUrl: 'https://test.goskip.dev',
      authStore: {
        token: 'mock-token-xyz',
      },
      collection: vi.fn(),
    },
  }
})

describe('Integração de Pagamento PagBank (Adapter, Cobrança, Degradação e Quatro-Olhos)', () => {
  const originalFetch = global.fetch

  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = vi.fn()
  })

  afterAll(() => {
    global.fetch = originalFetch
  })

  describe('1. Adapter PagBank (construção de payload e extração de dados)', () => {
    it('constrói payload correto de Ordem PIX v4 no padrão PagBank (valores em centavos e itens)', () => {
      const payload = buildPagBankOrderPayload({
        referenceId: 'TXID-TEST-001',
        servicoId: 'diagnostico',
        servicoNome: 'Diagnóstico Orbis',
        valorReais: 490,
        tomadorNome: 'Empresa Teste Sustentável Ltda',
        tomadorCpfCnpj: '12.345.678/0001-90',
        tomadorEmail: 'financeiro@empresa.com.br',
        notificationUrl: 'https://orbisprotocol.org/backend/v1/cobranca/webhook',
        expiracaoMinutos: 30,
      })

      expect(payload.reference_id).toBe('TXID-TEST-001')
      expect(payload.customer.name).toBe('Empresa Teste Sustentável Ltda')
      expect(payload.customer.tax_id).toBe('12345678000190') // sem pontuação
      expect(payload.customer.email).toBe('financeiro@empresa.com.br')
      expect(payload.items[0].unit_amount).toBe(49000) // R$ 490 em centavos
      expect(payload.qr_codes[0].amount.value).toBe(49000)
      expect(payload.notification_urls).toContain(
        'https://orbisprotocol.org/backend/v1/cobranca/webhook',
      )
    })

    it('extrai corretamente texto PIX copia e cola e link do QR Code da resposta PagBank', () => {
      const mockOrder: PagBankOrderResponse = {
        id: 'ORDE_PAGBANK_123456',
        reference_id: 'TXID-TEST-001',
        created_at: '2026-03-30T12:00:00Z',
        customer: {
          name: 'Empresa Teste',
          email: 'teste@empresa.com.br',
          tax_id: '12345678000190',
        },
        qr_codes: [
          {
            id: 'QR_PAGBANK_001',
            amount: { value: 49000 },
            text: '00020126580014br.gov.bcb.pix0136PAGBANKPIX1234567890520400005303986540490.005802BR5925PAGBANK6008SAOPAULO62070503***6304ABCD',
            arrangements: ['PIX'],
            links: [
              {
                rel: 'QRCODE.PNG',
                href: 'https://assets.pagseguro.com.br/qrcode/ORDE_PAGBANK_123456.png',
                media: 'image/png',
                type: 'GET',
              },
            ],
          },
        ],
        charges: [
          {
            id: 'CHAR_PAGBANK_999',
            reference_id: 'TXID-TEST-001',
            status: 'WAITING',
            amount: { value: 49000, currency: 'BRL' },
          },
        ],
      }

      const extracted = extractPagBankPixData(mockOrder)
      expect(extracted.paymentId).toBe('ORDE_PAGBANK_123456')
      expect(extracted.qrCodeText).toContain('00020126580014br.gov.bcb.pix')
      expect(extracted.qrCodePngUrl).toBe(
        'https://assets.pagseguro.com.br/qrcode/ORDE_PAGBANK_123456.png',
      )
      expect(extracted.status).toBe('WAITING')
    })
  })

  describe('2. Criação de Cobrança PIX e Degradação Graciosa (sem credencial no cofre)', () => {
    it('cria cobrança com sucesso quando endpoint backend retorna resposta do gateway PagBank', async () => {
      const mockResponse = {
        cobranca_id: 'cob_pagbank_1',
        servico_id: 'diagnostico',
        servico_nome: 'Diagnóstico Orbis',
        valor: 490,
        status: 'pendente',
        txid: 'TXID-ABC123456789',
        provider: 'pagbank',
        provider_payment_id: 'ORDE_PAGBANK_REAL_1',
        qr_code_payload: '00020126580014br.gov.bcb.pix...real...',
        qr_code_base64: '',
        data_expiracao: '2026-03-30T12:30:00Z',
        modo_degradacao: false,
        aviso_gateway: '',
        hash_integridade: 'hash_sha256_valido',
      }

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as any)

      const res = await criarCobrancaPix({
        servico_id: 'diagnostico',
        tomador_nome: 'EcoIndústria Ltda',
        tomador_cpf_cnpj: '00.123.456/0001-00',
        tomador_email: 'contato@ecoindustria.com.br',
      })

      expect(global.fetch).toHaveBeenCalledWith(
        'https://test.goskip.dev/backend/v1/cobranca/pix',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            Authorization: 'mock-token-xyz',
          }),
        }),
      )
      expect(res.cobranca_id).toBe('cob_pagbank_1')
      expect(res.status).toBe('pendente')
      expect(res.modo_degradacao).toBe(false)
    })

    it('degrada graciosamente com aviso informativo quando PAGBANK_TOKEN não está no cofre', async () => {
      const mockResponseDegradado = {
        cobranca_id: 'cob_pagbank_simulado_1',
        servico_id: 'laudo_pericial',
        servico_nome: 'Laudo Pericial com ART',
        valor: 2850,
        status: 'pendente_simulacao',
        txid: 'TXID-SIMULADO-1234',
        provider: 'pagbank',
        provider_payment_id: 'SIMULADO_PB_abcdef123456',
        qr_code_payload: '00020126580014br.gov.bcb.pix0136TXID-SIMULADO-1234...',
        qr_code_base64: '',
        data_expiracao: '2026-03-30T12:30:00Z',
        modo_degradacao: true,
        aviso_gateway: 'Gateway não configurado — cadastre PAGBANK_TOKEN no cofre',
        hash_integridade: 'hash_integridade_simulado',
      }

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponseDegradado,
      } as any)

      const res = await criarCobrancaPix({
        servico_id: 'laudo_pericial',
        tomador_nome: 'CDV Peças Verdes',
        tomador_cpf_cnpj: '11.222.333/0001-44',
        tomador_email: 'contato@cdvpecas.com.br',
      })

      expect(res.modo_degradacao).toBe(true)
      expect(res.status).toBe('pendente_simulacao')
      expect(res.aviso_gateway).toContain('PAGBANK_TOKEN')
      expect(res.qr_code_payload).toBeDefined()
    })
  })

  describe('3. Fluxo de Confirmação e Regra de Quatro Olhos (Limite R$ 5.000)', () => {
    it('permite confirmação direta para cobrança com valor <= R$ 5.000 (ex.: Diagnóstico R$ 490 ou Laudo R$ 2.850)', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'cob_diag_1',
          status: 'pago',
          data_pagamento: '2026-03-30T12:35:00Z',
          liquidado_por: 'Admin Operador',
          nfse_status: 'nfse_pendente_configuracao',
        }),
      } as any)

      const res = await confirmarPagamentoSimulado({
        cobranca_id: 'cob_diag_1',
        is_manual: false,
      })

      expect(res.status).toBe('pago')
      expect(res.data_pagamento).toBeDefined()
    })

    it('exige dupla confirmação e justificativa para liquidação manual de valor > R$ 5.000 (Bureau ACP R$ 7.800)', async () => {
      // Quando tenta confirmar manual sem dupla confirmação, backend recusa
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          error: 'Cobranças com valor acima de R$ 5.000 exigem dupla confirmação.',
        }),
      } as any)

      await expect(
        confirmarPagamentoSimulado({
          cobranca_id: 'cob_bureau_7800',
          is_manual: true,
          justificativa: 'Liquidação autorizada pelo gestor',
          comprovante_ref: 'PIX-DOC-7800',
          confirmacao_dupla: false, // Faltou o segundo olho
        }),
      ).rejects.toThrow(/dupla confirmação/i)
    })

    it('aprova liquidação acima de R$ 5.000 quando dupla confirmação e justificativa são fornecidas', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'cob_bureau_7800',
          status: 'pago',
          valor: 7800,
          data_pagamento: '2026-03-30T12:40:00Z',
          liquidado_por: 'Controlador Geral (Console Gestão)',
          liquidacao_justificativa: 'Parecer favorável CFO e conferência bancária confirmada',
          liquidacao_comprovante_ref: 'PIX-E2E-99887766',
          nfse_status: 'nfse_pendente_configuracao',
        }),
      } as any)

      const res = await confirmarPagamentoSimulado({
        cobranca_id: 'cob_bureau_7800',
        is_manual: true,
        justificativa: 'Parecer favorável CFO e conferência bancária confirmada',
        comprovante_ref: 'PIX-E2E-99887766',
        confirmacao_dupla: true,
      })

      expect(res.status).toBe('pago')
      expect(res.liquidado_por).toContain('Controlador Geral')
      expect(res.liquidacao_justificativa).toBeDefined()
    })
  })
})
