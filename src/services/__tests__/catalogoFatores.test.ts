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
    expect(METADADOS_CATALOGO_FATORES.dataVigencia).toContain('01 de Outubro de 2026')
    expect(METADADOS_CATALOGO_FATORES.dataVigencia).toContain('v1.1')
    expect(METADADOS_CATALOGO_FATORES.dataVigencia).toContain('v1.0 histórica desde 01/01/2025')
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
    expect(aluminio?.valorFator).toBe(FATORES_CDV_MATERIAIS.aluminio.fatorKgCO2ePorKg) // 14.4
    expect(aluminio?.valorFator).toBe(14.4)
    expect(aluminio?.fonteOficial).toContain('International Aluminium Institute')
    expect(aluminio?.detalheTecnico).toContain('14,40 kgCO₂e/kg')
    expect(aluminio?.detalheTecnico).toContain('REGIONAL BR')
    expect(aluminio?.detalheTecnico).toContain('~10,00')

    const cobre = CATALOGO_FATORES_CO2E.find((f) => f.id === 'mat-cobre')
    expect(cobre).toBeDefined()
    expect(cobre?.valorFator).toBe(FATORES_CDV_MATERIAIS.cobre.fatorKgCO2ePorKg) // 4.1
    expect(cobre?.valorFator).toBe(4.1)
    expect(cobre?.fonteOficial).toContain('International Copper Association')

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

    const r1234yf = CATALOGO_FATORES_CO2E.find((f) => f.id === 'mat-r1234yf-refrigerante')
    expect(r1234yf).toBeDefined()
    expect(r1234yf?.valorFator).toBe(0.5)
    expect(r1234yf?.fonteOficial).toContain('IPCC AR6 WG1')
    expect(r1234yf?.fonteOficial).toContain('7.SM.7')

    const bateria = CATALOGO_FATORES_CO2E.find((f) => f.id === 'mat-bateria-tracao-fora-escopo')
    expect(bateria).toBeDefined()
    expect(bateria?.valorFator).toBe(0.0)
    expect(bateria?.tierIncerteza).toBe('Tier 4')
    expect(bateria?.descricao).toContain('Fora de escopo v2.1')
    expect(bateria?.detalheTecnico).toContain('Chalmers 2024')
    expect(bateria?.detalheTecnico).toContain('ABNT NBR 10004')
    expect(bateria?.detalheTecnico).toContain('art. 33 da PNRS')

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

    const r1234yfGwp = GWP_IPCC_AR6_OFICIAL.gases.find((g) => g.formula.includes('CF₃CF=CH₂'))
    expect(r1234yfGwp).toBeDefined()
    expect(r1234yfGwp?.gwp).toBe(0.5)
    expect(r1234yfGwp?.fonte).toContain('Tabela 7.SM.7')
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
