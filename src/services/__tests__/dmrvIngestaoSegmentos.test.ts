import { describe, it, expect } from 'vitest'
import {
  determinarProtocoloDominante,
  construirCardsKpiSetoriais,
  normalizarSlugSegmento,
} from '@/services/dmrvEmissoesService'
import { getProtocoloBySlug } from '@/data/protocolosSetoriais'
import { gerarLoteSintetico } from '@/services/sandboxSyntheticGenerator'

describe('dmrvIngestaoSegmentos - Ingestão Universal dMRV nos 16 Segmentos', () => {
  it('normalizarSlugSegmento mapeia termos de agronegócio estritamente para "agro"', () => {
    expect(normalizarSlugSegmento('agro')).toBe('agro')
    expect(normalizarSlugSegmento('agronegocio')).toBe('agro')
    expect(normalizarSlugSegmento('AGRO_SOJA')).toBe('agro')
    expect(normalizarSlugSegmento('pecuaria_corte')).toBe('agro')
    expect(normalizarSlugSegmento('florestal_pinus')).toBe('agro')
  })

  it('determinarProtocoloDominante identifica "agro" a partir do lote gerado pelo Sandbox', async () => {
    const docsAgro = await gerarLoteSintetico({
      segmento: 'agro',
      quantidade: 1,
      usarCnpjAlfanumerico: false,
    })

    expect(docsAgro.length).toBe(1)
    const doc = docsAgro[0]

    // Simulação do registro em cdv_lotes como o Sandbox grava
    const loteGravado = {
      id: 'lote-agro-test',
      cdv_nome: doc.razaoSocialEmitente,
      cdv_cnpj: doc.cnpjEmitente,
      cdv_codigo: 'SANDBOX-AGRO',
      veiculo_marca_modelo: 'Agronegócio & Grãos (Demonstração)',
      veiculo_chassi: `SYNTH-${doc.chaveAcesso.slice(-8)}`,
      origem: 'sintetico',
      is_demo: true,
      total_pecas: doc.itens.length,
      total_peso_kg: doc.itens.reduce((acc, it) => acc + (it.pesoKg || 0), 0),
      total_co2e_evitado_kg: 0,
      payload_bruto_json: {
        tipo: 'sandbox_sintetico',
        segmento: doc.segmento,
        protocoloSetorialSlug: 'agro',
        chaveAcesso: doc.chaveAcesso,
      },
    }

    const dom = determinarProtocoloDominante([loteGravado], [])
    expect(dom.slug).toBe('agro')
    expect(dom.nome).toBe('Agronegócio & Grãos')
  })

  it('cards KPI assumem o vocabulário canônico de Agronegócio sem vazamento veicular', () => {
    const protoAgro = getProtocoloBySlug('agro')
    expect(protoAgro).toBeDefined()

    const cards = construirCardsKpiSetoriais({
      slugDominante: 'agro',
      protocolo: protoAgro!,
      totalCo2eKg: 0,
      totalMassaKg: 30000,
      totalPecas: 500,
      totalLotes: 1,
    })

    expect(cards.length).toBe(4)
    expect(cards[0].rotulo).toBe('CO₂e Evitado Total')
    expect(cards[1].rotulo).toBe('Produção Agrícola / Biomassa')
    expect(cards[1].unidade).toBe('kg')
    expect(cards[1].valorFormatado).toContain('30.000')

    expect(cards[2].rotulo).toBe('Talhões & Entregas Auditadas')
    expect(cards[2].unidade).toBe('itens')
    expect(cards[2].valorFormatado).toBe('500')

    expect(cards[3].rotulo).toBe('Lotes Agrícolas Fechados')
    expect(cards[3].unidade).toBe('lotes')
    expect(cards[3].valorFormatado).toBe('1')

    // Garantia de ausência de vocabulário veicular
    const textoCards = cards.map((c) => `${c.rotulo} ${c.legenda} ${c.unidade}`).join(' ')
    expect(textoCards).not.toMatch(/veículo|despoluição|chassi|peça usada|desmanche|cdv/i)
  })

  it('lotes de Energia, Logística, Mineração e Química definem seus respectivos protocolos dominantes', () => {
    const segmentos = ['energia', 'logistica', 'mineracao', 'quimica']

    for (const seg of segmentos) {
      const lote = {
        id: `lote-${seg}`,
        payload_bruto_json: {
          protocoloSetorialSlug: seg,
        },
      }

      const dom = determinarProtocoloDominante([lote], [])
      expect(dom.slug).toBe(seg)

      const proto = getProtocoloBySlug(seg)
      expect(proto).toBeDefined()

      const cards = construirCardsKpiSetoriais({
        slugDominante: seg,
        protocolo: proto!,
        totalCo2eKg: 100,
        totalMassaKg: 1000,
        totalPecas: 10,
        totalLotes: 1,
      })

      // Nenhum dos segmentos vazará vocabulário automotivo
      const texto = cards.map((c) => `${c.rotulo} ${c.legenda}`).join(' ')
      expect(texto).not.toMatch(/veículo|despoluição|chassi/i)
    }
  })
})
