import { describe, it, expect } from 'vitest'
import {
  CATALOGO_FATORES_OFICIAIS,
  obterFatorOficialPorId,
  obterFatorPorCodigoMaterial,
} from '../catalogoFatoresOficiais'
import {
  calcularLoteOrbisV2,
  identificarCategoriaMaterial,
  FATORES_MATERIAIS_V2,
} from '../cdvEngineV2'
import { isRegistroReal } from '@/components/BadgeOrigemLote'

describe('Validação do Fator Lã de Rocha no Catálogo Oficial e Motor V2', () => {
  it('deve conter o material lã de rocha com fator 1,50 kgCO2e/kg e flag pendente de verificação', () => {
    const fator = CATALOGO_FATORES_OFICIAIS.find((f) => f.codigoMaterial === 'la_de_rocha')
    expect(fator).toBeDefined()
    expect(fator?.valorFator).toBe(1.5)
    expect(fator?.unidade).toBe('kgCO₂e/kg')
    expect(fator?.pendenteVerificacao).toBe(true)
    expect(fator?.tierIncerteza).toBe('Tier 1')
    expect(fator?.incertezaPct).toBe(10.0)
    expect(fator?.nomeMaterial).toContain('[Pendente de verificação de fonte]')
  })

  it('deve permitir recuperação de lã de rocha por id e código', () => {
    const fId = obterFatorOficialPorId('mat-la-de-rocha')
    expect(fId).toBeDefined()
    expect(fId?.valorFator).toBe(1.5)

    const fCod = obterFatorPorCodigoMaterial('la_de_rocha')
    expect(fCod).toBeDefined()
    expect(fCod?.valorFator).toBe(1.5)
  })

  it('deve identificar categoria la_de_rocha por variações de texto: "lã de rocha", "rockwool", etc.', () => {
    expect(identificarCategoriaMaterial('Lã de Rocha Basáltica')).toBe('la_de_rocha')
    expect(identificarCategoriaMaterial('painel rockwool industrial 50mm')).toBe('la_de_rocha')
    expect(identificarCategoriaMaterial('la de rocha')).toBe('la_de_rocha')
    expect(identificarCategoriaMaterial('Mineral Wool Insulation')).toBe('la_de_rocha')
  })

  it('deve ter o fator registrado em FATORES_MATERIAIS_V2 com fe_ref = 1.50 e u_fe = 0.10', () => {
    expect(FATORES_MATERIAIS_V2.la_de_rocha).toBeDefined()
    expect(FATORES_MATERIAIS_V2.la_de_rocha.fe_ref).toBe(1.5)
    expect(FATORES_MATERIAIS_V2.la_de_rocha.u_fe).toBe(0.1)
  })
})

describe('Regra dos Badges Real vs Sandbox dMRV / DEMO', () => {
  it('deve identificar como real origem="importado_manual_com_documento"', () => {
    expect(isRegistroReal('importado_manual_com_documento', false)).toBe(true)
    expect(isRegistroReal('importado_manual_com_documento', null)).toBe(true)
    expect(isRegistroReal('importado_manual_com_documento', undefined)).toBe(true)
  })

  it('deve identificar como real quando !is_demo e não sintético', () => {
    expect(isRegistroReal('erp', false)).toBe(true)
    expect(isRegistroReal('manual_api', false)).toBe(true)
  })

  it('deve identificar como sandbox/demo registros sintéticos ou com is_demo = true', () => {
    expect(isRegistroReal('sintetico', false)).toBe(false)
    expect(isRegistroReal('sintetico', true)).toBe(false)
    expect(isRegistroReal(null, true)).toBe(false)
    expect(isRegistroReal('erp', true)).toBe(false)
  })
})

describe('Cálculo Reproduzível do Lote Real VERTEC Pan Urania IW29', () => {
  it('reproduz com exatidão as métricas do lote e de suas 2 peças', () => {
    // Parâmetros físicos da ficha técnica Pan Urania IW29:
    // Painel 50 mm, peso 15,6 kg/m², área total = 136,80 m² (152 peças de 0,90 m²)
    // Peso total = 136,80 * 15,6 = 2.134,08 kg
    // Peça Aço: 1.288,66 kg, FE = 2,18 -> Evitado = 1288,66 * 2.18 * 0.30 = 842,78 kgCO2e
    // Peça Lã de Rocha: 845,42 kg, FE = 1,50 -> Evitado = 845,42 * 1.50 * 0.30 = 380,44 kgCO2e
    const pesoAco = 1288.66
    const pesoLdr = 845.42
    const pesoTotal = pesoAco + pesoLdr // 2134.08 kg
    expect(pesoTotal).toBeCloseTo(2134.08, 2)

    const resultado = calcularLoteOrbisV2({
      lote_id: 'VERTEC-IW29-2022',
      df_config: 0.3,
      li_config: 1.0,
      pecas: [
        {
          sku: 'VERTEC-IW29-ACO',
          descricao: 'Chapas de Aço (0,5 mm perfurada + 0,7 mm sólida)',
          material: 'aço laminado estrutural',
          peso_kg: pesoAco,
          tara_fonte: 'balança',
        },
        {
          sku: 'VERTEC-IW29-LDR',
          descricao: 'Núcleo Lã de Rocha 50 mm (~124 kg/m³)',
          material: 'lã de rocha mineral basáltica',
          peso_kg: pesoLdr,
          tara_fonte: 'balança',
        },
      ],
      destinacao: [
        { sku: 'VERTEC-IW29-ACO', status: 'vendida', evidencia: 'NF 157/158 Pan Urania' },
        { sku: 'VERTEC-IW29-LDR', status: 'vendida', evidencia: 'NF 157/158 Pan Urania' },
      ],
    })

    // 1. Emissão evitada por peça
    const pecaAco = resultado.pecas_detalhes.find((p) => p.sku === 'VERTEC-IW29-ACO')
    const pecaLdr = resultado.pecas_detalhes.find((p) => p.sku === 'VERTEC-IW29-LDR')

    expect(pecaAco).toBeDefined()
    expect(pecaAco?.material_categoria).toBe('aco')
    expect(pecaAco?.fe_ref_aplicado).toBe(2.18)
    expect(pecaAco?.evitado_liquido_kg).toBe(842.78)

    expect(pecaLdr).toBeDefined()
    expect(pecaLdr?.material_categoria).toBe('la_de_rocha')
    expect(pecaLdr?.fe_ref_aplicado).toBe(1.5)
    expect(pecaLdr?.evitado_liquido_kg).toBe(380.44)

    // 2. Totais consolidados
    // Total evitado líquido = 842.78 + 380.44 = 1.223,22 kgCO2e
    expect(resultado.evitado_liquido_kg).toBe(1223.22)
    expect(resultado.evitado_confirmado_kg).toBe(1223.22)

    // Total bruto: 2809.28 (aço) + 1268.13 (ldr) = 4.077,41 ou 4.077,42 kgCO2e
    expect(resultado.evitado_bruto_kg).toBeCloseTo(4077.41, 0)

    // 3. Intensidades apuradas em relação à área (136,80 m²) e faturamento (R$ 30.862,65):
    // Intensidade bruta de emissões incorporadas por real faturado:
    // 4.077,42 kgCO2e / R$ 30.862,65 ≈ 0,132 kgCO2e/R$
    const faturamentoTotal = 30862.65
    const areaTotalM2 = 136.8
    const intensidadeBrutaPorReal = 4077.42 / faturamentoTotal
    const intensidadeBrutaPorM2 = 4077.42 / areaTotalM2

    expect(intensidadeBrutaPorReal).toBeCloseTo(0.132, 2)
    expect(intensidadeBrutaPorM2).toBeCloseTo(29.81, 1)

    // Evitado consolidado por real e por m2:
    const intensidadeEvitadaPorReal = resultado.evitado_liquido_kg / faturamentoTotal
    const intensidadeEvitadaPorM2 = resultado.evitado_liquido_kg / areaTotalM2
    expect(intensidadeEvitadaPorReal).toBeCloseTo(0.0396, 3)
    expect(intensidadeEvitadaPorM2).toBeCloseTo(8.94, 1)
  })
})
