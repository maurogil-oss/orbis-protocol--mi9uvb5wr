import { describe, it, expect } from 'vitest'
import {
  calcularLoteOrbisV2,
  FATORES_MATERIAIS_V2,
  GWP_AR6_R134A,
  GWP_AR6_R1234YF,
  REFRIGERANTES_CATALOGO_V2,
  obterFatorConservadorParaPecaMista,
  LoteInputV2,
} from '../cdvEngineV2'

describe('Motor de Cálculo Orbis v2 & DM-ORB-001 v1.1', () => {
  it('aplica a nova fórmula por peça: Evitado = Q × FE_ref × L_i × DF − PE com DF=0.30 e Li=1.0', () => {
    const loteInput: LoteInputV2 = {
      cdv: { nome: 'CDV Teste', cnpj: '11.222.333/0001-44' },
      veiculo_doador: {
        marca_modelo: 'VW Gol 1.6',
        baixa_detran: 'PR-BX-2026-TESTE',
        tara_kg: 980,
        tara_fonte: 'documento_veiculo',
      },
      pecas: [
        {
          sku: 'PART-GOL-CAPO-01',
          descricao: 'Capô de Aço',
          material: 'Aço',
          peso_kg: 10.0,
        },
      ],
      destinacao: [
        {
          sku: 'PART-GOL-CAPO-01',
          status: 'vendida',
          evidencia: { tipo: 'nfe', numero: '123' },
        },
      ],
    }

    const resultado = calcularLoteOrbisV2(loteInput)

    // Aço FE = 2.18, Q = 10, Li = 1.0, DF = 0.30 -> Evitado Bruto = 10 * 2.18 * 1.0 * 0.30 = 6.54
    // PE = 0 -> Evitado Líquido = 6.54
    expect(resultado.evitado_bruto_kg).toBe(6.54)
    expect(resultado.evitado_liquido_kg).toBe(6.54)
    expect(resultado.evitado_confirmado_kg).toBe(6.54)
    expect(resultado.df_aplicado).toBe(0.3)
    expect(resultado.li_aplicado).toBe(1.0)
    expect(resultado.versao_metodologia).toBe('DM-ORB-001-v1.1')
  })

  it('Critério de aceite (a): Peça sem destinação fica com claim potencial e não soma no evitado confirmado', () => {
    const loteInput: LoteInputV2 = {
      cdv: { nome: 'CDV Teste', cnpj: '11.222.333/0001-44' },
      veiculo_doador: {
        marca_modelo: 'VW Gol 1.6',
        baixa_detran: 'PR-BX-2026-TESTE',
      },
      pecas: [
        {
          sku: 'PECA-COM-DESTINACAO',
          descricao: 'Capô com NF',
          material: 'Aço',
          peso_kg: 10.0,
        },
        {
          sku: 'PECA-SEM-DESTINACAO',
          descricao: 'Porta em estoque',
          material: 'Aço',
          peso_kg: 10.0,
        },
      ],
      destinacao: [
        {
          sku: 'PECA-COM-DESTINACAO',
          status: 'vendida',
          evidencia: { tipo: 'nfe', numero: '001' },
        },
        {
          sku: 'PECA-SEM-DESTINACAO',
          status: 'estoque', // Sem venda ou reciclagem final comprovada
        },
      ],
    }

    const resultado = calcularLoteOrbisV2(loteInput)

    expect(resultado.pecas_detalhes[0].status_claim).toBe('confirmado')
    expect(resultado.pecas_detalhes[1].status_claim).toBe('potencial')

    // Confirmado deve conter apenas a peça com destinação (6.54)
    expect(resultado.evitado_confirmado_kg).toBe(6.54)
    // Potencial deve conter a peça em estoque (6.54)
    expect(resultado.evitado_potencial_kg).toBe(6.54)
    // O total líquido soma ambos os elegíveis (13.08)
    expect(resultado.evitado_liquido_kg).toBe(13.08)
  })

  it('Critério de aceite (d): Peça mista sem decomposição adota o menor fator entre as opções (conservador)', () => {
    // Comparando aço (2.18), alumínio (14.4), cobre (4.1) e polímeros (1.9)
    const conservador = obterFatorConservadorParaPecaMista(['aco', 'polimeros'])
    expect(conservador.material).toBe('polimeros')
    expect(conservador.fe_ref).toBe(1.9)

    const conservadorGeral = obterFatorConservadorParaPecaMista(['aco', 'aluminio', 'cobre'])
    expect(conservadorGeral.material).toBe('aco')
    expect(conservadorGeral.fe_ref).toBe(2.18)
  })

  it('calcula corretamente a decomposição de peças mistas com percentuais explícitos (§5.1)', () => {
    const loteInput: LoteInputV2 = {
      cdv: { nome: 'CDV Teste', cnpj: '11.222.333/0001-44' },
      veiculo_doador: {
        marca_modelo: 'VW Gol 1.6',
        baixa_detran: 'PR-BX-2026-TESTE',
      },
      pecas: [
        {
          sku: 'PECA-MISTA-01',
          descricao: 'Porta com revestimento plástico',
          peso_kg: 10.0,
          composicao_material: [
            { material: 'aco', percentual: 80 }, // 8 kg * 2.18 * 0.3 = 5.232
            { material: 'polimeros', percentual: 20 }, // 2 kg * 1.90 * 0.3 = 1.14
          ],
        },
      ],
      destinacao: [
        {
          sku: 'PECA-MISTA-01',
          status: 'vendida',
          evidencia: { tipo: 'nfe', numero: '555' },
        },
      ],
    }

    const resultado = calcularLoteOrbisV2(loteInput)
    // 5.232 + 1.14 = 6.372 kgCO2e -> round2 6.37
    expect(resultado.evitado_bruto_kg).toBe(6.37)
    expect(resultado.evitado_liquido_kg).toBe(6.37)
  })

  it('adiciona fluxo de refrigerante R-134a com GWP 1530 do IPCC AR6 e DF 1.0 (§1.3)', () => {
    const loteComR134a: LoteInputV2 = {
      cdv: { nome: 'CDV Teste', cnpj: '11.222.333/0001-44' },
      veiculo_doador: {
        marca_modelo: 'VW Gol 1.6',
        baixa_detran: 'PR-BX-2026-TESTE',
        fluidos: [
          {
            tipo: 'R134a',
            massa_kg: 0.65,
            evidencia: 'MTR-SINIR-GAS-01',
          },
        ],
      },
      pecas: [],
    }

    const res = calcularLoteOrbisV2(loteComR134a)
    // 0.65 kg * 1530 * 1.0 = 994.50 kgCO2e
    expect(res.evitado_refrigerante_kg).toBe(994.5)
    expect(res.evitado_liquido_kg).toBe(994.5)
    expect(res.refrigerante_declaracao).toContain('1.530')
  })

  it('adiciona fluxo de refrigerante moderno R-1234yf com GWP 0.50 do IPCC AR6 WG1 Tab. 7.SM.7', () => {
    expect(GWP_AR6_R1234YF).toBe(0.5)
    expect(REFRIGERANTES_CATALOGO_V2.r1234yf.gwp100).toBe(0.5)
    expect(REFRIGERANTES_CATALOGO_V2.r1234yf.fonte).toContain('7.SM.7')

    const loteComR1234yf: LoteInputV2 = {
      cdv: { nome: 'CDV Teste Moderno', cnpj: '11.222.333/0001-44' },
      veiculo_doador: {
        marca_modelo: 'Toyota Corolla 2022',
        baixa_detran: 'PR-BX-2026-COROLLA',
        fluidos: [
          {
            tipo: 'R1234yf',
            massa_kg: 0.5,
            evidencia: 'MTR-SINIR-R1234-01',
          },
        ],
      },
      pecas: [],
    }

    const res = calcularLoteOrbisV2(loteComR1234yf)
    // 0.50 kg * 0.50 GWP * 1.0 DF = 0.25 kgCO2e
    expect(res.evitado_refrigerante_kg).toBe(0.25)
    expect(res.evitado_liquido_kg).toBe(0.25)
    expect(res.refrigerante_declaracao).toContain('R-1234yf')
    expect(res.refrigerante_declaracao).toContain('0,50')
  })

  it('declara refrigerante não capturado quando não houver drenagem documentada (§1.3)', () => {
    const loteSemFluidos: LoteInputV2 = {
      cdv: { nome: 'CDV Teste', cnpj: '11.222.333/0001-44' },
      veiculo_doador: {
        marca_modelo: 'VW Gol 1.6',
        baixa_detran: 'PR-BX-2026-TESTE',
      },
      pecas: [],
    }

    const res = calcularLoteOrbisV2(loteSemFluidos)
    expect(res.evitado_refrigerante_kg).toBe(0)
    expect(res.refrigerante_declaracao).toContain('refrigerante não capturado')
  })

  it('Critério de aceite (e): Incerteza do lote bate com a soma em quadratura manual', () => {
    const loteInput: LoteInputV2 = {
      cdv: { nome: 'CDV Teste', cnpj: '11.222.333/0001-44' },
      veiculo_doador: {
        marca_modelo: 'VW Gol 1.6',
        baixa_detran: 'PR-BX-2026-TESTE',
        tara_fonte: 'documento_veiculo', // u_massa = 0.01 (1%)
      },
      pecas: [
        {
          sku: 'P1',
          descricao: 'Peça Aço',
          material: 'Aço',
          peso_kg: 20.0, // Evitado = 20 * 2.18 * 0.3 = 13.08, u_fe = 0.035
        },
        {
          sku: 'P2',
          descricao: 'Peça Alumínio',
          material: 'Alumínio',
          peso_kg: 5.0, // Evitado = 5 * 14.40 * 0.3 = 21.60, u_fe = 0.040
        },
      ],
    }

    const res = calcularLoteOrbisV2(loteInput)

    const e1 = 13.08
    const u1 = FATORES_MATERIAIS_V2.aco.u_fe // 0.035
    const e2 = 21.6
    const u2 = FATORES_MATERIAIS_V2.aluminio.u_fe // 0.040
    const totalE = 34.68
    const uMassa = 0.01

    const somaQuadrados = Math.pow(e1 * u1, 2) + Math.pow(e2 * u2, 2) + Math.pow(totalE * uMassa, 2)
    const incertezaEsperada = Math.round(Math.sqrt(somaQuadrados) * 100) / 100

    expect(res.incerteza_kg).toBe(incertezaEsperada)
  })

  it('segrega resultados em fóssil, biogênico e total (biogênico = 0 declarado)', () => {
    const loteInput: LoteInputV2 = {
      cdv: { nome: 'CDV Teste', cnpj: '11.222.333/0001-44' },
      veiculo_doador: {
        marca_modelo: 'VW Gol 1.6',
        baixa_detran: 'PR-BX-2026-TESTE',
      },
      pecas: [
        {
          sku: 'P1',
          descricao: 'Peça Aço',
          material: 'Aço',
          peso_kg: 10.0,
        },
      ],
    }

    const res = calcularLoteOrbisV2(loteInput)
    expect(res.segregacao.biogenico_kg).toBe(0)
    expect(res.segregacao.fossil_kg).toBe(res.evitado_liquido_kg)
    expect(res.segregacao.total_kg).toBe(res.evitado_liquido_kg)
  })

  it('deduz PE_peça das emissões de energia e diesel informadas pelo CDV', () => {
    const loteComEnergia: LoteInputV2 = {
      cdv: { nome: 'CDV Teste', cnpj: '11.222.333/0001-44' },
      veiculo_doador: {
        marca_modelo: 'VW Gol 1.6',
        baixa_detran: 'PR-BX-2026-TESTE',
      },
      energia_cdv_competencia: {
        kwh_mes: 100, // 100 * 0.0486 = 4.86 kgCO2e
        combustiveis_litros: {
          diesel_s10: 10, // 10 * 2.295 = 22.95 kgCO2e
        },
      },
      pecas: [
        {
          sku: 'P1',
          descricao: 'Peça Aço',
          material: 'Aço',
          peso_kg: 100.0,
        },
      ],
    }

    const res = calcularLoteOrbisV2(loteComEnergia)
    // PE lote = ceil(4.86 + 22.95) = ceil(27.81) = 28.00
    expect(res.pe_lote_kg).toBe(28)
    // Evitado bruto = 100 * 2.18 * 0.3 = 65.40
    // Evitado líquido = floor(65.40 - 28) = 37.40
    expect(res.evitado_liquido_kg).toBe(37.4)
  })
})
