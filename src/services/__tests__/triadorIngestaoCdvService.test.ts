import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { consultarTriadorIngestao, conversarComTriadorCdv } from '../triadorIngestaoCdvService'
import pb from '@/lib/pocketbase/client'

describe('Triador de Ingestão CDV (Agente Nativo Skip Cloud Service)', () => {
  const originalFetch = global.fetch

  beforeEach(() => {
    vi.restoreAllMocks()
  })

  afterEach(() => {
    global.fetch = originalFetch
  })

  it('deve retornar a triagem estruturada do endpoint /backend/v1/cdv/triagem', async () => {
    const mockResultado = {
      sucesso: true,
      fonte: 'agente_nativo' as const,
      triagem: {
        aprovado_para_ingestao: true,
        nivel_risco: 'baixo' as const,
        resumo_triagem: 'Documento conforme diretrizes dMRV.',
        classificacao_proposta: [
          {
            item_index: 0,
            descricao: 'Capô de Aço',
            categoria_material: 'aco' as const,
            justificativa: 'Estamparia ferrosa',
            fator_referencia: 2.18,
            observacao_metodologica: 'Fator worldsteel 2025 sem flag',
          },
          {
            item_index: 1,
            descricao: 'Soja em Grãos',
            categoria_material: 'agro_rastreado' as const,
            justificativa: 'Massa rastreada sem crédito de carbono',
            fator_referencia: 0,
            observacao_metodologica: 'Agro rastreado com CO2e = 0 por design',
          },
        ],
        anomalias_detectadas: [],
      },
    }

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockResultado,
    })

    const payload = {
      chaveAcesso: '41260376123456000100550010000000011000000010',
      cnpjEmitente: '76.123.456/0001-00',
      itens: [{ xProd: 'Capô de Aço', pesoKg: 15 }],
    }

    const resultado = await consultarTriadorIngestao(payload)

    expect(global.fetch).toHaveBeenCalledTimes(1)
    expect(resultado).not.toBeNull()
    expect(resultado?.aprovado_para_ingestao).toBe(true)
    expect(resultado?.nivel_risco).toBe('baixo')
    expect(resultado?.classificacao_proposta).toHaveLength(2)
    expect(resultado?.classificacao_proposta[0].categoria_material).toBe('aco')
    expect(resultado?.classificacao_proposta[1].categoria_material).toBe('agro_rastreado')
  })

  it('deve ser não-bloqueante e retornar null se o backend falhar ou retornar erro 500', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Timeout no modelo Skip Cloud' }),
    })

    const payload = { chaveAcesso: 'invalida' }
    const resultado = await consultarTriadorIngestao(payload)

    expect(resultado).toBeNull()
  })

  it('deve ser não-bloqueante e retornar null se houver exceção de rede', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error / connection refused'))

    const payload = { chaveAcesso: 'qualquer' }
    const resultado = await consultarTriadorIngestao(payload)

    expect(resultado).toBeNull()
  })

  it('deve permitir conversa interativa via /backend/v1/agent-chat especificando o agente triador-ingestao-cdv', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        content:
          'Proposta de classificação: Bobina de Cobre = cobre (fator 4,10 kgCO2e/kg - ICA 2024 sem flag).',
        conversation_id: 'conv_123',
        message_id: 'msg_456',
      }),
    })

    const resposta = await conversarComTriadorCdv('Classifique bobina de cobre 50kg')

    expect(resposta.content).toContain('4,10')
    expect(resposta.conversationId).toBe('conv_123')
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/backend/v1/agent-chat'),
      expect.objectContaining({
        body: JSON.stringify({
          agent: 'triador-ingestao-cdv',
          message: 'Classifique bobina de cobre 50kg',
          conversation_id: null,
        }),
      }),
    )
  })
})
