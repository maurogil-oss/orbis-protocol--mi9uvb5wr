import { describe, it, expect } from 'vitest'
import {
  PROTOCOLOS_SETORIAIS,
  LISTA_PROTOCOLOS_SETORIAIS,
  getProtocoloBySlug,
} from '@/data/protocolosSetoriais'
import {
  determinarProtocoloDominante,
  construirCardsKpiSetoriais,
  normalizarSlugSegmento,
} from '@/services/dmrvEmissoesService'

describe('KPIs por Protocolo Setorial no dMRV - Catálogo e Travas de Vocabulário', () => {
  it('todos os 16 protocolos possuem exatamente 4 KPIs canônicos definidos', () => {
    const keys = Object.keys(PROTOCOLOS_SETORIAIS)
    expect(keys.length).toBeGreaterThanOrEqual(16)

    for (const key of keys) {
      const protocolo = PROTOCOLOS_SETORIAIS[key]
      expect(protocolo.kpisCanicos, `Protocolo ${key} sem kpisCanicos`).toBeDefined()
      expect(protocolo.kpisCanicos?.length, `Protocolo ${key} não tem 4 KPIs`).toBe(4)

      const ids = protocolo.kpisCanicos!.map((k) => k.id)
      expect(ids).toEqual(['co2e_evitado', 'kpi_pos2', 'kpi_pos3', 'kpi_pos4'])

      // Todo protocolo pontua CO2e evitado
      expect(protocolo.kpisCanicos![0].rotulo).toContain('CO₂e Evitado')
    }
  })

  it('apenas o protocolo automotivo (9) utiliza vocabulário de veículos ("veículos", "despoluição", "lotes cdv")', () => {
    const termosAutomotivos = [/veículo/i, /despoluição/i, /lotes cdv/i]

    for (const [slug, protocolo] of Object.entries(PROTOCOLOS_SETORIAIS)) {
      if (slug === 'automotiva') {
        // No automotivo, a legenda de despoluição e lotes CDV deve existir
        const card4 = protocolo.kpisCanicos?.find((k) => k.id === 'kpi_pos4')
        expect(card4?.legenda).toContain('Veículos com despoluição atendida')
        expect(card4?.rotulo).toContain('Lotes CDV Fechados')
        continue
      }

      // Em todos os outros 15 segmentos, nenhum dos termos automotivos pode estar presente nos KPIs
      for (const kpi of protocolo.kpisCanicos || []) {
        const textoCompleto = `${kpi.rotulo} ${kpi.legenda} ${kpi.unidade}`
        for (const termo of termosAutomotivos) {
          expect(
            termo.test(textoCompleto),
            `Segmento não-automotivo "${slug}" vazou termo veicular "${termo}": "${textoCompleto}"`,
          ).toBe(false)
        }
      }
    }
  })

  it('Têxtil (11) define unidades de resíduo têxtil e lotes têxteis sem vocabulário de veículos', () => {
    const textil = getProtocoloBySlug('textil')
    expect(textil).toBeDefined()
    const cards = construirCardsKpiSetoriais({
      slugDominante: 'textil',
      protocolo: textil!,
      totalCo2eKg: 5000,
      totalMassaKg: 2500,
      totalPecas: 80,
      totalLotes: 4,
    })

    expect(cards[1].rotulo).toBe('Resíduo Têxtil Desviado')
    expect(cards[1].unidade).toBe('kg')
    expect(cards[2].rotulo).toBe('Itens & Peças com Selo DPP')
    expect(cards[3].rotulo).toBe('Lotes Têxteis Fechados')
    expect(cards[3].legenda).toBe('Remessas têxteis com conformidade ABVTEX/ABR comprovada')

    const textoTotal = cards.map((c) => `${c.rotulo} ${c.legenda}`).join(' ')
    expect(textoTotal).not.toMatch(/veículo|despoluição|chassi|cdv/i)
  })

  it('Logística & Transporte (6) define tkm transportados e CT-es rastreados com derivação honesta', () => {
    const logistica = getProtocoloBySlug('logistica')
    expect(logistica).toBeDefined()
    const cards = construirCardsKpiSetoriais({
      slugDominante: 'logistica',
      protocolo: logistica!,
      totalCo2eKg: 10000,
      totalMassaKg: 5000, // 5 toneladas
      totalPecas: 20,
      totalLotes: 2,
    })

    // 5000 kg / 1000 * 400 km = 2.000 tkm eq.
    expect(cards[1].rotulo).toBe('Trabalho de Transporte (tkm)')
    expect(cards[1].unidade).toBe('tkm eq.')
    expect(cards[1].valorNumerico).toBe(2000)
    expect(cards[1].destaqueBadge).toBe('GLEC v3.0 (400 km eq.)')
    expect(cards[2].rotulo).toBe('CT-es & Fretes Rastreados')
    expect(cards[2].unidade).toBe('documentos')
    expect(cards[3].rotulo).toBe('Viagens & Despachos Fechados')

    const textoTotal = cards.map((c) => `${c.rotulo} ${c.legenda}`).join(' ')
    expect(textoTotal).not.toMatch(/veículo|despoluição|chassi|cdv/i)
  })

  it('Construção Civil (14) define RCD / Agregados Reciclados e caçambas de obra', () => {
    const construcao = getProtocoloBySlug('construcao')
    expect(construcao).toBeDefined()
    const cards = construirCardsKpiSetoriais({
      slugDominante: 'construcao',
      protocolo: construcao!,
      totalCo2eKg: 1200,
      totalMassaKg: 10000,
      totalPecas: 15,
      totalLotes: 3,
    })

    expect(cards[1].rotulo).toBe('RCD / Agregados Reciclados')
    expect(cards[2].rotulo).toBe('Caçambas & Manifestos de RCD')
    expect(cards[3].rotulo).toBe('Lotes de Canteiro Fechados')

    const textoTotal = cards.map((c) => `${c.rotulo} ${c.legenda}`).join(' ')
    expect(textoTotal).not.toMatch(/veículo|despoluição|chassi|cdv/i)
  })

  it('Materiais Críticos Recuperados (16): só cobre pontua carbono, metais nobres em estruturação', () => {
    const matCriticos = getProtocoloBySlug('materiais-criticos-recuperados')
    expect(matCriticos).toBeDefined()
    const cards = construirCardsKpiSetoriais({
      slugDominante: 'materiais-criticos-recuperados',
      protocolo: matCriticos!,
      totalCo2eKg: 540,
      totalMassaKg: 100,
      totalPecas: 12,
      totalLotes: 2,
    })

    expect(cards[0].rotulo).toBe('CO₂e Evitado (Cobre Recuperado)')
    expect(cards[0].legenda).toContain('Apenas cobre pontua em carbono')
    expect(cards[1].rotulo).toBe('Cobre Puro / Frações Críticas')
    expect(cards[2].rotulo).toBe('Frações com Teor Declarado')
    expect(cards[3].rotulo).toBe('Lotes DCP de Origem Urbana')

    const textoTotal = cards.map((c) => `${c.rotulo} ${c.legenda}`).join(' ')
    expect(textoTotal).not.toMatch(/veículo|despoluição|chassi|cdv/i)
  })

  it('Energia Renovável & Biogás (4) deriva volume de biogás e MWh gerados', () => {
    const energia = getProtocoloBySlug('energia')
    expect(energia).toBeDefined()
    const cards = construirCardsKpiSetoriais({
      slugDominante: 'energia',
      protocolo: energia!,
      totalCo2eKg: 8500, // 8500 kgCO2e / 85 = 100 MWh eq.
      totalMassaKg: 10000, // 10000 kg * 0.45 = 4500 m³ biogás
      totalPecas: 10,
      totalLotes: 2,
    })

    expect(cards[1].rotulo).toBe('Biogás / Combustível Renovável')
    expect(cards[1].unidade).toBe('m³ eq.')
    expect(cards[1].valorNumerico).toBe(4500)
    expect(cards[2].rotulo).toBe('Geração Elétrica / Lastros I-REC')
    expect(cards[2].unidade).toBe('MWh eq.')
    expect(cards[2].valorNumerico).toBe(100)
    expect(cards[3].rotulo).toBe('Lotes de Geração & Injeção')
  })

  it('determinarProtocoloDominante resolve corretamente o segmento a partir de lotes e metadados', () => {
    // 1. Lotes têxteis
    const lotesTextil = [
      { id: '1', cdv_codigo: 'CDV-TEXTIL-001', protocolo: 'textil' },
      { id: '2', cdv_codigo: 'CDV-TEXTIL-002', protocolo: 'textil' },
    ]
    const domTextil = determinarProtocoloDominante(lotesTextil, [])
    expect(domTextil.slug).toBe('textil')

    // 2. Lotes de logística
    const lotesLogistica = [
      {
        id: '1',
        payload_bruto_json: JSON.stringify({ protocoloSetorialSlug: 'logistica' }),
      },
    ]
    const domLog = determinarProtocoloDominante(lotesLogistica, [])
    expect(domLog.slug).toBe('logistica')

    // 3. Materiais Críticos via código do lote
    const lotesCriticos = [{ id: '1', cdv_codigo: 'CDV-MATERIAIS_CRITICOS_RECUPERADOS-101' }]
    const domCrit = determinarProtocoloDominante(lotesCriticos, [])
    expect(domCrit.slug).toBe('materiais-criticos-recuperados')

    // 4. Lotes automotivos
    const lotesAutomotivos = [{ id: '1', cdv_codigo: 'CDV-SP-001', protocolo: 'automotiva' }]
    const domAuto = determinarProtocoloDominante(lotesAutomotivos, [])
    expect(domAuto.slug).toBe('automotiva')
  })
})
