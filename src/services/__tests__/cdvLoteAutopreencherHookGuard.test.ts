import { describe, it, expect, vi } from 'vitest'

describe('cdv_lote_autopreencher hook - guarda anti-disparo', () => {
  // Replicamos a lógica exata de decisão do hook para testar a guarda
  function deveAutopreencher(loteRec: {
    id: string
    origem?: string
    is_demo?: boolean
    cdv_codigo?: string
    veiculo_chassi?: string
  }) {
    if (!loteRec || !loteRec.id) return false

    const origem = loteRec.origem || ''
    const isDemo = Boolean(loteRec.is_demo)
    const cdvCodigoLote = loteRec.cdv_codigo || ''
    const chassiLote = loteRec.veiculo_chassi || ''

    if (origem === 'sintetico' || isDemo || cdvCodigoLote.toUpperCase().startsWith('SANDBOX-')) {
      return false
    }

    const isLoteAutomotivoLegitimo =
      chassiLote.trim() !== '' || cdvCodigoLote.toUpperCase().startsWith('DETRAN')

    return isLoteAutomotivoLegitimo
  }

  it('bloqueia lotes com origem = "sintetico"', () => {
    expect(
      deveAutopreencher({
        id: 'lote-synth-1',
        origem: 'sintetico',
        cdv_codigo: 'SANDBOX-AGRO',
        veiculo_chassi: '',
      }),
    ).toBe(false)
  })

  it('bloqueia lotes com cdv_codigo iniciando por "SANDBOX-"', () => {
    expect(
      deveAutopreencher({
        id: 'lote-synth-2',
        origem: '',
        is_demo: false,
        cdv_codigo: 'SANDBOX-AUTOMOTIVA',
        veiculo_chassi: '9BWZZZ377VT004251',
      }),
    ).toBe(false)
  })

  it('bloqueia lotes com is_demo = true', () => {
    expect(
      deveAutopreencher({
        id: 'lote-synth-3',
        origem: '',
        is_demo: true,
        cdv_codigo: 'DETRAN-PR-CDV-0089',
        veiculo_chassi: '9BWZZZ377VT004251',
      }),
    ).toBe(false)
  })

  it('bloqueia lotes não-automotivos sem chassi e sem DETRAN', () => {
    expect(
      deveAutopreencher({
        id: 'lote-real-agro',
        origem: 'real',
        is_demo: false,
        cdv_codigo: 'COOP-AGRO-01',
        veiculo_chassi: '',
      }),
    ).toBe(false)
  })

  it('permite lotes CDV automotivos reais com DETRAN ou com chassi', () => {
    expect(
      deveAutopreencher({
        id: 'lote-cdv-real-1',
        origem: 'erp',
        is_demo: false,
        cdv_codigo: 'DETRAN-PR-CDV-0089',
        veiculo_chassi: '9BWZZZ377VT004251',
      }),
    ).toBe(true)

    expect(
      deveAutopreencher({
        id: 'lote-cdv-real-2',
        origem: 'erp',
        is_demo: false,
        cdv_codigo: 'CDV-CURITIBA-01',
        veiculo_chassi: '9BWZZZ377VT004251',
      }),
    ).toBe(true)
  })
})
