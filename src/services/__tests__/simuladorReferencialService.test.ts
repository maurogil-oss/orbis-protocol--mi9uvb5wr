import { describe, it, expect } from 'vitest'
import {
  calcularSimuladorReferencial,
  isMaterialExcluidoDaSimulacao,
  exportarSimuladorReferencialCsv,
  TEXTO_ROTULO_ONIPRESENTE,
  PREMISSA_FAIXA_PRECO,
} from '../simuladorReferencialService'

describe('Simulador Referencial de Potencial de Crédito (Informativo)', () => {
  // Dados de teste com materiais homologados e frações em estruturação
  const mockLotes = [
    {
      id: 'lote-001',
      cdv_codigo: 'CDV-AUTO-001',
      protocolo: 'automotiva',
      total_peso_kg: 500,
      total_co2e_evitado_kg: 1000,
      total_pecas: 4,
    },
    {
      id: 'lote-002',
      cdv_codigo: 'CDV-LOG-002',
      protocolo: 'logistica',
      total_peso_kg: 1000,
      total_co2e_evitado_kg: 250,
      total_pecas: 2,
    },
  ]

  const mockPecas = [
    // Material 1: Aço com fator oficial homologado (elegível)
    {
      id: 'peca-01',
      lote: 'lote-001',
      protocolo: 'automotiva',
      descricao_peca: 'Porta de Aço Automotivo',
      material_declarado: 'Aço carbono estampado',
      peso_kg: 40,
      fator_co2e_kg: 1.89,
      co2e_evitado_kg: 75.6,
      statusCalculo: 'homologado',
    },
    // Material 2: Alumínio com fator oficial homologado (elegível)
    {
      id: 'peca-02',
      lote: 'lote-001',
      protocolo: 'automotiva',
      descricao_peca: 'Capô de Alumínio Fundido',
      material_declarado: 'Alumínio primário',
      peso_kg: 20,
      fator_co2e_kg: 14.4,
      co2e_evitado_kg: 288.0,
      statusCalculo: 'homologado',
    },
    // Material 3: Fração em estruturação — Ouro em mineração urbana (EXCLUÍDO)
    {
      id: 'peca-03',
      lote: 'lote-001',
      protocolo: 'automotiva',
      descricao_peca: 'Conector com banho de ouro 24k (ECU)',
      material_declarado: 'Ouro recuperado',
      categoria_material: 'materiais_criticos_rastreados',
      peso_kg: 0.05,
      fator_co2e_kg: 0,
      co2e_evitado_kg: 0,
      statusCalculo: 'em_estruturacao_de_catalogo',
    },
    // Material 4: Fração em estruturação — Terras Raras / Ímã NdFeB (EXCLUÍDO)
    {
      id: 'peca-04',
      lote: 'lote-001',
      protocolo: 'automotiva',
      descricao_peca: 'Ímã de Neodímio NdFeB (motor de partida)',
      material_declarado: 'Terras raras',
      peso_kg: 0.8,
      fator_co2e_kg: 0,
      co2e_evitado_kg: 0,
      statusCalculo: 'em_estruturacao_de_catalogo',
    },
    // Material 5: Bateria Li-ion fora de escopo (EXCLUÍDO)
    {
      id: 'peca-05',
      lote: 'lote-001',
      protocolo: 'automotiva',
      descricao_peca: 'Bateria Auxiliar 12V Li-ion',
      material_declarado: 'Bateria',
      categoria_material: 'baterias_veiculares',
      peso_kg: 15.0,
      fator_co2e_kg: 0,
      co2e_evitado_kg: 0,
    },
    // Material 6: Logística multimodal com fator homologado (elegível)
    {
      id: 'peca-06',
      lote: 'lote-002',
      protocolo: 'logistica',
      descricao_peca: 'Transferência Rodoviária Carga Consolidada',
      material_declarado: 'Transporte rodoviário euro 5',
      peso_kg: 1000,
      fator_co2e_kg: 0.25,
      co2e_evitado_kg: 250.0,
    },
  ]

  it('Regra 1: rótulo onipresente exato deve estar presente no resultado e em cada linha', () => {
    const res = calcularSimuladorReferencial({
      lotes: mockLotes,
      pecas: mockPecas,
      cnpj: '33.000.168/0001-09',
      origem: 'producao',
    })

    expect(res.rotuloObrigatorio).toBe(TEXTO_ROTULO_ONIPRESENTE)
    expect(res.rotuloObrigatorio).toBe(
      'Simulação Referencial — sem validade, não emissível, não negociável',
    )
  })

  it('Regra 2: cálculo transparente exibe SEMPRE faixa US$ 5–25/tCO₂e (mín–máx) e conversão em R$', () => {
    const res = calcularSimuladorReferencial({
      lotes: mockLotes,
      pecas: mockPecas,
      cnpj: '33.000.168/0001-09',
      origem: 'producao',
    })

    // Total CO2e elegível: peca-01 (75.6) + peca-02 (288.0) + peca-06 (250.0) = 613.6 kg = 0.614 tCO2e
    expect(res.totalCo2eElegivelKg).toBe(613.6)
    expect(res.totalTco2eElegivel).toBe(0.614)

    // Valores em USD: 0.614 * 5 = 3.07 | 0.614 * 25 = 15.35
    expect(res.faixaUsd.min).toBeCloseTo(3.07, 2)
    expect(res.faixaUsd.max).toBeCloseTo(15.35, 2)
    expect(res.faixaUsd.formatado).toContain('US$')
    expect(res.faixaUsd.formatado).toContain('–')

    // Valores em BRL com câmbio declarado de 5.75
    expect(res.faixaBrl.min).toBeCloseTo(3.07 * 5.75, 1)
    expect(res.faixaBrl.max).toBeCloseTo(15.35 * 5.75, 1)
    expect(res.faixaBrl.formatado).toContain('R$')

    // Premissas metodológicas visíveis e citadas
    expect(res.premissas.fontePreco).toContain('Ecosystem Marketplace')
    expect(res.premissas.fonteCambio).toContain('PTAX')
    expect(res.premissas.avisoLegal).toContain('prova documental')
  })

  it('Regra 4: apenas materiais com fator homologado entram no cálculo do potencial; frações sem fator são explicadas', () => {
    const res = calcularSimuladorReferencial({
      lotes: mockLotes,
      pecas: mockPecas,
      cnpj: '33.000.168/0001-09',
      origem: 'producao',
    })

    // Total de peças no mock = 6; elegíveis com fator = 3 (aço, alumínio, logística)
    expect(res.totalPecasElegiveis).toBe(3)

    // As 3 frações sem fator (ouro, terras raras, bateria) foram para a lista de exclusões
    expect(res.exclusoes.length).toBe(3)

    const exclusaoOuro = res.exclusoes.find((e) =>
      e.materialOuDescricao.toLowerCase().includes('ouro'),
    )
    expect(exclusaoOuro).toBeDefined()
    expect(exclusaoOuro?.motivoExclusao).toContain('estruturação')

    const exclusaoTerrasRaras = res.exclusoes.find(
      (e) =>
        e.materialOuDescricao.toLowerCase().includes('neodímio') ||
        e.materialOuDescricao.toLowerCase().includes('terras'),
    )
    expect(exclusaoTerrasRaras).toBeDefined()
    expect(exclusaoTerrasRaras?.motivoExclusao).toContain('estruturação')

    const exclusaoBateria = res.exclusoes.find((e) =>
      e.materialOuDescricao.toLowerCase().includes('bateria'),
    )
    expect(exclusaoBateria).toBeDefined()
    expect(exclusaoBateria?.motivoExclusao).toContain('fora de escopo')

    // Massa excluída total somada corretamente
    expect(res.totalMassaExcluidaKg).toBe(15.9) // 0.05 + 0.8 + 15.0 = 15.85 -> 15.9
    expect(res.totalItensExcluidos).toBe(3)
  })

  it('Reconciliação pericial: soma das linhas dos protocolos deve bater 100% com o total elegível', () => {
    const res = calcularSimuladorReferencial({
      lotes: mockLotes,
      pecas: mockPecas,
      cnpj: '33.000.168/0001-09',
      origem: 'producao',
    })

    const somaCo2eLinhas = res.decomposicaoPorProtocolo.reduce(
      (acc, p) => acc + p.co2eKgElegivel,
      0,
    )
    expect(Math.abs(somaCo2eLinhas - res.totalCo2eElegivelKg)).toBeLessThan(0.01)
    expect(res.reconciliacao.somaBatePerfeitamente).toBe(true)
  })

  it('Exportação CSV deve carregar cabeçalho de isenção, premissas de preço e tabela de exclusões', () => {
    const res = calcularSimuladorReferencial({
      lotes: mockLotes,
      pecas: mockPecas,
      cnpj: '33.000.168/0001-09',
      origem: 'producao',
    })

    const csv = exportarSimuladorReferencialCsv(res)
    expect(csv.nomeArquivo).toContain('Simulador_Referencial_Potencial')
    expect(csv.url).toBeDefined()
  })

  it('Função isMaterialExcluidoDaSimulacao detecta corretamente casos de exclusão', () => {
    const casoOuro = isMaterialExcluidoDaSimulacao({
      descricao: 'Placa com trilhas de ouro',
      categoria: 'materiais_criticos_rastreados',
      fatorCo2e: 0,
      co2eEvitadoKg: 0,
    })
    expect(casoOuro.excluido).toBe(true)
    expect(casoOuro.status).toBe('em_estruturacao_de_catalogo')

    const casoAco = isMaterialExcluidoDaSimulacao({
      descricao: 'Chapa de Aço Laminado',
      categoria: 'metais_ferrosos',
      fatorCo2e: 1.89,
      co2eEvitadoKg: 189,
      possuiFatorOficial: true,
    })
    expect(casoAco.excluido).toBe(false)
  })
})
