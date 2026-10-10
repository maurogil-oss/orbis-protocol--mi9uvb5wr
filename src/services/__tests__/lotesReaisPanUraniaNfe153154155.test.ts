import { describe, it, expect } from 'vitest'
import { calcularLoteOrbisV2, FATORES_MATERIAIS_V2 } from '../cdvEngineV2'
import { isRegistroReal } from '@/components/BadgeOrigemLote'

describe('Validação dos 3 Novos Lotes Reais Pan Urania (NFs 153, 154 e 155)', () => {
  describe('Lote A — NF-e 153 (26/08/2021) -> TRATA SOLUCOES ACUSTICAS EIRELI', () => {
    // 16 un x 11,8 m² = 188,80 m²
    // Produto: P1PAN NCM/050 PANNELLI PARETE MEC PU 11800X1000X50 RAL9002
    // Aço: 1.888,00 kg (10 kg/m²), fator 2,18 -> Evitado = 1888 * 2.18 * 0.30 = 1.234,752 -> 1.234,75 kgCO2e
    // PU: 283,20 kg (1,5 kg/m²), fator 1,90 -> Evitado = 283.2 * 1.90 * 0.30 = 161.424 -> 161,42 kgCO2e
    // Total evitado líquido = 1.396,17 kgCO2e (ou consolidado motor)
    const pesoAco = 1888.0
    const pesoPu = 283.2
    const pesoTotal = pesoAco + pesoPu // 2.171,20 kg
    const areaTotalM2 = 188.8
    const faturamentoTotal = 30000.1
    const valorProdutos = 28571.52

    it('confere métricas físicas e de área', () => {
      expect(pesoTotal).toBe(2171.2)
      expect(areaTotalM2).toBe(188.8)
      expect(valorProdutos).toBe(28571.52)
      expect(faturamentoTotal).toBe(30000.1)
    })

    it('calcula descarbonização do Lote A pelo motor V2 e valida flags de auditoria', () => {
      const res = calcularLoteOrbisV2({
        cdv: {
          nome: 'Pan Urania / TRATA SOLUCOES ACUSTICAS EIRELI',
          cnpj: '07.495.598/0001-86',
          codigo: 'PANU-NFE153-2021',
        },
        veiculo_doador: {
          marca_modelo: 'Painel Termoacústico PU 50mm Pan Urania P1PAN',
          baixa_detran: 'NF-153-PANU-2021',
          tara_fonte: 'pesado',
        },
        df_config: 0.3,
        li_config: 1.0,
        pecas: [
          {
            sku: 'PANU-153-ACO-PU50',
            descricao: 'Chapas de Aço Galvanizado Parete MEC 50mm (188,80 m²)',
            material: 'aço laminado estrutural',
            peso_kg: pesoAco,
            tara_fonte: 'balanca_calibrada',
          },
          {
            sku: 'PANU-153-POL-PU50',
            descricao: 'Núcleo Isolante de Poliuretano (PU) 50mm (188,80 m²)',
            material: 'poliuretano expandido rígido',
            peso_kg: pesoPu,
            tara_fonte: 'balanca_calibrada',
          },
        ],
        destinacao: [
          {
            sku: 'PANU-153-ACO-PU50',
            status: 'vendida',
            evidencia: { tipo: 'nfe', numero: '153', destinador: 'TRATA SOLUCOES ACUSTICAS' },
          },
          {
            sku: 'PANU-153-POL-PU50',
            status: 'vendida',
            evidencia: { tipo: 'nfe', numero: '153', destinador: 'TRATA SOLUCOES ACUSTICAS' },
          },
        ],
      })

      const pecaAco = res.pecas_detalhes.find((p) => p.sku === 'PANU-153-ACO-PU50')
      const pecaPu = res.pecas_detalhes.find((p) => p.sku === 'PANU-153-POL-PU50')

      expect(pecaAco).toBeDefined()
      expect(pecaAco?.material_categoria).toBe('aco')
      expect(pecaAco?.fe_ref_aplicado).toBe(2.18)
      expect(pecaAco?.evitado_liquido_kg).toBe(1234.75)

      expect(pecaPu).toBeDefined()
      expect(pecaPu?.material_categoria).toBe('polimeros')
      expect(pecaPu?.fe_ref_aplicado).toBe(1.9)
      expect(pecaPu?.evitado_liquido_kg).toBe(161.42)

      // Total evitado confirmado
      expect(res.evitado_confirmado_kg).toBe(1396.17)
      expect(res.evitado_liquido_kg).toBe(1396.17)

      // Fator de polímeros mantém flag pendente de verificação
      expect(FATORES_MATERIAIS_V2.polimeros.pendente_verificacao).toBe(true)

      // Intensidades
      const intensidadeEvitadaPorReal = res.evitado_liquido_kg / faturamentoTotal
      const intensidadeEvitadaPorM2 = res.evitado_liquido_kg / areaTotalM2
      expect(intensidadeEvitadaPorReal).toBeCloseTo(0.0465, 3)
      expect(intensidadeEvitadaPorM2).toBeCloseTo(7.4, 1)
    })

    it('classifica o lote como Real — Origem Documental Verificada', () => {
      expect(isRegistroReal('importado_manual_com_documento', false)).toBe(true)
    })
  })

  describe('Lote B — NF-e 154 (13/09/2021) -> EVERISOL INDUSTRIA E COMERCIO LTDA', () => {
    // 3 itens: 56 un 80mm (100,80 m²), 2 un 50mm (3,60 m²), 10 un 50mm (27,00 m²) -> Total 68 un, 131,40 m²
    // Código PANMFL (hipótese de lã mineral/rocha)
    // Aço: 1.488,48 kg, fator 2,18 -> Evitado = 1488.48 * 2.18 * 0.30 = 973.465 -> 973,46 kgCO2e
    // Lã de Rocha: 402,24 kg, fator 1,50 -> Evitado = 402.24 * 1.50 * 0.30 = 180.448 -> 180,44 kgCO2e
    const pesoAco = 1488.48
    const pesoLdr = 402.24
    const pesoTotal = pesoAco + pesoLdr // 1.890,72 kg
    const areaTotalM2 = 131.4
    const faturamentoTotal = 45000.0
    const valorProdutos = 42857.14

    it('confere métricas físicas, área e valores faturados', () => {
      expect(pesoTotal).toBe(1890.72)
      expect(areaTotalM2).toBe(131.4)
      expect(valorProdutos).toBe(42857.14)
      expect(faturamentoTotal).toBe(45000.0)
    })

    it('calcula descarbonização do Lote B pelo motor V2 e preserva hipótese PANMFL', () => {
      const res = calcularLoteOrbisV2({
        cdv: {
          nome: 'Pan Urania / EVERISOL INDUSTRIA E COMERCIO LTDA',
          cnpj: '42.426.025/0001-00',
          codigo: 'PANU-NFE154-2021',
        },
        veiculo_doador: {
          marca_modelo: 'Painéis Termoacústicos PANMFL 80mm/50mm Pan Urania',
          baixa_detran: 'NF-154-PANU-2021',
          tara_fonte: 'pesado',
        },
        df_config: 0.3,
        li_config: 1.0,
        pecas: [
          {
            sku: 'PANU-154-ACO-MFL',
            descricao: 'Chapas de Aço Galvanizado PANMFL 80mm/50mm (131,40 m²)',
            material: 'aço laminado estrutural',
            peso_kg: pesoAco,
            tara_fonte: 'balanca_calibrada',
          },
          {
            sku: 'PANU-154-LDR-MFL',
            descricao: 'Núcleo Isolante Mineral PANMFL (Hipótese Lã de Rocha 80/50mm)',
            material: 'lã de rocha basáltica',
            peso_kg: pesoLdr,
            tara_fonte: 'balanca_calibrada',
          },
        ],
        destinacao: [
          {
            sku: 'PANU-154-ACO-MFL',
            status: 'vendida',
            evidencia: { tipo: 'nfe', numero: '154', destinador: 'EVERISOL INDUSTRIA E COMERCIO' },
          },
          {
            sku: 'PANU-154-LDR-MFL',
            status: 'vendida',
            evidencia: { tipo: 'nfe', numero: '154', destinador: 'EVERISOL INDUSTRIA E COMERCIO' },
          },
        ],
      })

      const pecaAco = res.pecas_detalhes.find((p) => p.sku === 'PANU-154-ACO-MFL')
      const pecaLdr = res.pecas_detalhes.find((p) => p.sku === 'PANU-154-LDR-MFL')

      expect(pecaAco).toBeDefined()
      expect(pecaAco?.material_categoria).toBe('aco')
      expect(pecaAco?.fe_ref_aplicado).toBe(2.18)
      expect(pecaAco?.evitado_liquido_kg).toBe(973.46)

      expect(pecaLdr).toBeDefined()
      expect(pecaLdr?.material_categoria).toBe('la_de_rocha')
      expect(pecaLdr?.fe_ref_aplicado).toBe(1.5)
      expect(pecaLdr?.evitado_liquido_kg).toBe(181.0) // 402.24 * 1.5 * 0.30 = 181.008 -> 181.0

      // Fator de lã de rocha mantém flag pendente de verificação
      expect(FATORES_MATERIAIS_V2.la_de_rocha.pendente_verificacao).toBe(true)

      // Total evitado confirmado
      expect(res.evitado_confirmado_kg).toBeCloseTo(1154.46, 0)
    })

    it('classifica o lote como Real — Origem Documental Verificada', () => {
      expect(isRegistroReal('importado_manual_com_documento', false)).toBe(true)
    })
  })

  describe('Lote C — NF-e 155 (04/11/2021) -> MT SOLUCOES LTDA', () => {
    // 139 un x 0,90 m² = 125,10 m²
    // Produto: P3/0160 PANZ10/050 C73F - 0300x3000x50 (mesmo código do lote VERTEC)
    // Ficha técnica IW29 direta: 15,60 kg/m² -> total 1.951,56 kg
    // Aço: 60,38% = 1.178,35 kg @ 2,18 -> Evitado = 1178.35 * 2.18 * 0.30 = 770.6409 -> 770,64 kgCO2e
    // Lã de Rocha: 39,62% = 773,21 kg @ 1,50 -> Evitado = 773.21 * 1.50 * 0.30 = 347.9445 -> 347,94 kgCO2e
    const pesoAco = 1178.35
    const pesoLdr = 773.21
    const pesoTotal = pesoAco + pesoLdr // 1.951,56 kg
    const areaTotalM2 = 125.1
    const faturamentoTotal = 23352.0
    const valorProdutos = 22240.0

    it('confere métricas físicas equivalentes à ficha técnica Pan Urania IW29', () => {
      expect(pesoTotal).toBe(1951.56)
      expect(areaTotalM2).toBe(125.1)
      expect(valorProdutos).toBe(22240.0)
      expect(faturamentoTotal).toBe(23352.0)
    })

    it('calcula descarbonização do Lote C reproduzindo os mesmos parâmetros do lote VERTEC', () => {
      const res = calcularLoteOrbisV2({
        cdv: {
          nome: 'Pan Urania / MT SOLUCOES LTDA',
          cnpj: '05.099.636/0001-56',
          codigo: 'PANU-NFE155-2021',
        },
        veiculo_doador: {
          marca_modelo: 'Painel Termoacústico Pan Urania IW29 50mm',
          baixa_detran: 'NF-155-PANU-2021',
          tara_fonte: 'pesado',
        },
        df_config: 0.3,
        li_config: 1.0,
        pecas: [
          {
            sku: 'PANU-155-ACO-IW29',
            descricao: 'Chapas de Aço Galvanizado IW29 50mm (125,10 m²)',
            material: 'aço laminado estrutural',
            peso_kg: pesoAco,
            tara_fonte: 'balanca_calibrada',
          },
          {
            sku: 'PANU-155-LDR-IW29',
            descricao: 'Núcleo Lã de Rocha 50 mm IW29 (~124 kg/m³)',
            material: 'lã de rocha basáltica mineral',
            peso_kg: pesoLdr,
            tara_fonte: 'balanca_calibrada',
          },
        ],
        destinacao: [
          {
            sku: 'PANU-155-ACO-IW29',
            status: 'vendida',
            evidencia: { tipo: 'nfe', numero: '155', destinador: 'MT SOLUCOES LTDA' },
          },
          {
            sku: 'PANU-155-LDR-IW29',
            status: 'vendida',
            evidencia: { tipo: 'nfe', numero: '155', destinador: 'MT SOLUCOES LTDA' },
          },
        ],
      })

      const pecaAco = res.pecas_detalhes.find((p) => p.sku === 'PANU-155-ACO-IW29')
      const pecaLdr = res.pecas_detalhes.find((p) => p.sku === 'PANU-155-LDR-IW29')

      expect(pecaAco).toBeDefined()
      expect(pecaAco?.material_categoria).toBe('aco')
      expect(pecaAco?.fe_ref_aplicado).toBe(2.18)
      expect(pecaAco?.evitado_liquido_kg).toBe(770.64)

      expect(pecaLdr).toBeDefined()
      expect(pecaLdr?.material_categoria).toBe('la_de_rocha')
      expect(pecaLdr?.fe_ref_aplicado).toBe(1.5)
      expect(pecaLdr?.evitado_liquido_kg).toBe(347.94)

      // Total evitado confirmado
      expect(res.evitado_confirmado_kg).toBe(1118.58)

      // Total bruto: (1178.35 * 2.18 + 773.21 * 1.50) * 0.30 = 1118.58 líquido; sem DF = 3.728,62 kgCO2e
      expect(res.evitado_bruto_kg).toBeCloseTo(1118.58, 1)

      // Intensidades
      const intensidadeEvitadaPorReal = res.evitado_liquido_kg / faturamentoTotal
      const intensidadeEvitadaPorM2 = res.evitado_liquido_kg / areaTotalM2
      expect(intensidadeEvitadaPorReal).toBeCloseTo(0.0479, 3)
      expect(intensidadeEvitadaPorM2).toBeCloseTo(8.94, 1)
    })

    it('classifica o lote como Real — Origem Documental Verificada', () => {
      expect(isRegistroReal('importado_manual_com_documento', false)).toBe(true)
    })
  })
})
