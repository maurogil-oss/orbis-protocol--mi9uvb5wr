import { describe, it, expect } from 'vitest'
import {
  CATALOGO_FATORES_CO2E,
  METADADOS_CATALOGO_FATORES,
  GWP_IPCC_AR6_OFICIAL,
} from '@/services/catalogoFatoresOficiais'
import { FATORES_CDV_MATERIAIS } from '@/services/cdvService'

describe('Catálogo Oficial de Fatores CO₂e (Bloco 4 /fatores)', () => {
  it('deve possuir metadados válidos com versão, vigência e nota de snapshot congelado', () => {
    expect(METADADOS_CATALOGO_FATORES.versao).toBe('v2025.2')
    expect(METADADOS_CATALOGO_FATORES.dataVigencia).toContain('2025')
    expect(METADADOS_CATALOGO_FATORES.notaSnapshotCongelamento).toContain('Snapshot Imutável')
    expect(METADADOS_CATALOGO_FATORES.notaSnapshotCongelamento).toContain('congelado')
    expect(METADADOS_CATALOGO_FATORES.reservaPreLaudo).toContain('Reserva Metodológica Pré-Laudo')
    expect(METADADOS_CATALOGO_FATORES.reservaPreLaudo).toContain('VVB')
  })

  it('deve ser 100% fiel aos fatores curados de materiais CDV da plataforma', () => {
    const aco = CATALOGO_FATORES_CO2E.find((f) => f.id === 'mat-aco')
    expect(aco).toBeDefined()
    expect(aco?.valorFator).toBe(FATORES_CDV_MATERIAIS.aco.fatorKgCO2ePorKg) // 2.18
    expect(aco?.fonteOficial).toContain('worldsteel')

    const aluminio = CATALOGO_FATORES_CO2E.find((f) => f.id === 'mat-aluminio')
    expect(aluminio).toBeDefined()
    expect(aluminio?.valorFator).toBe(FATORES_CDV_MATERIAIS.aluminio.fatorKgCO2ePorKg) // 16.6
    expect(aluminio?.fonteOficial).toContain('International Aluminium Institute')

    const cobre = CATALOGO_FATORES_CO2E.find((f) => f.id === 'mat-cobre')
    expect(cobre).toBeDefined()
    expect(cobre?.valorFator).toBe(FATORES_CDV_MATERIAIS.cobre.fatorKgCO2ePorKg) // 5.4
    expect(cobre?.fonteOficial).toContain('CopperMark')

    const polimeros = CATALOGO_FATORES_CO2E.find((f) => f.id === 'mat-polimeros')
    expect(polimeros).toBeDefined()
    expect(polimeros?.valorFator).toBe(FATORES_CDV_MATERIAIS.polimeros.fatorKgCO2ePorKg) // 1.9
    expect(polimeros?.fonteOficial).toContain('PlasticsEurope')

    const outros = CATALOGO_FATORES_CO2E.find((f) => f.id === 'mat-outros')
    expect(outros).toBeDefined()
    expect(outros?.valorFator).toBe(FATORES_CDV_MATERIAIS.outros.fatorKgCO2ePorKg) // 1.5
  })

  it('deve conter fatores de combustíveis, eletricidade SIN/I-REC e insetting ISO 14067', () => {
    const diesel = CATALOGO_FATORES_CO2E.find((f) => f.id === 'comb-diesel-s10')
    expect(diesel).toBeDefined()
    expect(diesel?.valorFator).toBe(2.295)

    const sin = CATALOGO_FATORES_CO2E.find((f) => f.id === 'energia-sin-localizacao')
    expect(sin).toBeDefined()
    expect(sin?.fonteOficial).toContain('MCTI')

    const irec = CATALOGO_FATORES_CO2E.find((f) => f.id === 'energia-irec-mercado')
    expect(irec).toBeDefined()
    expect(irec?.valorFator).toBe(0.0)

    const r134a = CATALOGO_FATORES_CO2E.find((f) => f.id === 'mat-r134a-refrigerante')
    expect(r134a).toBeDefined()
    expect(r134a?.valorFator).toBe(1530.0)

    // O fator insetting fixo foi removido do catálogo (§3: cálculo agora é por massa)
    const insettingFixo = CATALOGO_FATORES_CO2E.find((f) => f.id === 'insetting-peca')
    expect(insettingFixo).toBeUndefined()
  })

  it('deve conter as métricas oficiais de GWP do IPCC AR6', () => {
    expect(GWP_IPCC_AR6_OFICIAL.versao).toContain('IPCC AR6')
    const ch4Fossil = GWP_IPCC_AR6_OFICIAL.gases.find((g) => g.formula === 'CH₄ (fóssil)')
    expect(ch4Fossil?.gwp).toBe(29.8)

    const n2o = GWP_IPCC_AR6_OFICIAL.gases.find((g) => g.formula === 'N₂O')
    expect(n2o?.gwp).toBe(273)
  })

  it('não deve conter menções indevidas a marcas de terceiros sem contrato ("Renova")', () => {
    for (const item of CATALOGO_FATORES_CO2E) {
      const texto =
        `${item.nomeMaterial} ${item.descricao} ${item.fonteOficial} ${item.normaPadrao}`.toLowerCase()
      if (texto.includes('renova')) {
        expect(texto).toContain('renovabio') // Única ocorrência legítima permitida
      }
    }
  })
})
