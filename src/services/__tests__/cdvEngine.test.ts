import { describe, it, expect } from 'vitest'
import { FATORES_CDV_MATERIAIS, calcularHashCanonicalPeca } from '../cdvService'

describe('Módulo CDV Operacional & DPP Engine', () => {
  it('deve possuir fatores curados de CO2e evitado corretos por material', () => {
    expect(FATORES_CDV_MATERIAIS.aco.fatorKgCO2ePorKg).toBe(2.85)
    expect(FATORES_CDV_MATERIAIS.aluminio.fatorKgCO2ePorKg).toBe(8.2)
    expect(FATORES_CDV_MATERIAIS.cobre.fatorKgCO2ePorKg).toBe(5.4)
    expect(FATORES_CDV_MATERIAIS.polimeros.fatorKgCO2ePorKg).toBe(1.9)
    expect(FATORES_CDV_MATERIAIS.outros.fatorKgCO2ePorKg).toBe(1.5)
  })

  it('deve calcular corretamente o CO2e evitado para as peças do veículo de teste Gol 1.6', () => {
    // Capô 14,5 kg Aço -> 14.5 * 2.85 = 41.325 -> 41.33 kg
    const capoPeso = 14.5
    const capoCo2e = Number((capoPeso * FATORES_CDV_MATERIAIS.aco.fatorKgCO2ePorKg).toFixed(2))
    expect(capoCo2e).toBe(41.33)

    // Alternador 5,2 kg Cobre -> 5.2 * 5.4 = 28.08 kg
    const altPeso = 5.2
    const altCo2e = Number((altPeso * FATORES_CDV_MATERIAIS.cobre.fatorKgCO2ePorKg).toFixed(2))
    expect(altCo2e).toBe(28.08)

    // Parachoque 3,8 kg Polímeros -> 3.8 * 1.9 = 7.22 kg
    const paraPeso = 3.8
    const paraCo2e = Number(
      (paraPeso * FATORES_CDV_MATERIAIS.polimeros.fatorKgCO2ePorKg).toFixed(2),
    )
    expect(paraCo2e).toBe(7.22)

    // Total evitado no lote
    const totalEvitado = capoCo2e + altCo2e + paraCo2e
    expect(totalEvitado).toBe(76.63)
  })

  it('deve gerar hash SHA-256 canônico consistente e determinístico', async () => {
    const peca = {
      selo_dpp: 'PR-SEAL-2026-991823',
      sku_interno: 'PART-SND-CAPO-01',
      descricao_peca: 'Capô Dianteiro Original com Vedação Acústica',
      peso_kg: 14.5,
      co2e_evitado_kg: 41.33,
      veiculo_baixa_detran: 'PR-BX-2026-991204',
      cdv_cnpj: '76.123.456/0001-12',
    }

    const hash1 = await calcularHashCanonicalPeca(peca)
    const hash2 = await calcularHashCanonicalPeca(peca)

    expect(hash1).toBeDefined()
    expect(hash1.length).toBe(64) // SHA-256 hex string
    expect(hash1).toBe(hash2)

    // Qualquer alteração no peso deve invalidar o hash
    const hashAlterado = await calcularHashCanonicalPeca({
      ...peca,
      peso_kg: 14.6,
    })
    expect(hashAlterado).not.toBe(hash1)
  })
})
