import { describe, it, expect } from 'vitest'
import {
  FATORES_CDV_MATERIAIS,
  calcularHashCanonicalPeca,
  calcularHashCanonicalLote,
} from '../cdvService'

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

  it('deve gerar hash SHA-256 verificável determinístico para o Lote Consolidado', async () => {
    const lote = {
      id: 'h1dpr8wniludemh',
      cdv_cnpj: '76.123.456/0001-12',
      veiculo_baixa_detran: 'PR-BX-2026-991204',
    }

    const pecas = [
      {
        selo_dpp: 'PR-SEAL-2026-991823',
        hash_sha256: '5f16fe468a99f78c6ff17f97ab52b5759e290ecc1dca75923858090a9e053b61',
        peso_kg: 14.5,
        co2e_evitado_kg: 41.33,
      },
      {
        selo_dpp: 'PR-SEAL-2026-991824',
        hash_sha256: '61e47159d4b0e558920428ed0341283b3b03d34a44d5322fce289d5cd2590c02',
        peso_kg: 5.2,
        co2e_evitado_kg: 28.08,
      },
      {
        selo_dpp: 'PR-SEAL-2026-991825',
        hash_sha256: '7127fd88b01ad3c338d9f777725c47ebbb7360bfe5ae51a753de7f2f1df426ea',
        peso_kg: 3.8,
        co2e_evitado_kg: 7.22,
      },
    ]

    const hashLote1 = await calcularHashCanonicalLote(lote, pecas)
    const hashLote2 = await calcularHashCanonicalLote(lote, [...pecas].reverse()) // Ordem reversa deve dar o mesmo hash pois ordena lexicograficamente

    expect(hashLote1).toBeDefined()
    expect(hashLote1.length).toBe(64)
    expect(hashLote1).toBe(hashLote2)

    // Alteração em qualquer peça deve alterar o hash do lote
    const hashLoteAlterado = await calcularHashCanonicalLote(lote, [
      pecas[0],
      pecas[1],
      {
        ...pecas[2],
        hash_sha256: '0000000000000000000000000000000000000000000000000000000000000000',
      },
    ])
    expect(hashLoteAlterado).not.toBe(hashLote1)
  })
})
