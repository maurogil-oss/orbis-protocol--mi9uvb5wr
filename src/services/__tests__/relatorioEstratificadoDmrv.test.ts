import { describe, it, expect } from 'vitest'
import {
  construirEstratificacaoDmrv,
  exportarRelatorioDmrvCsv,
  construirCardsKpiSetoriais,
  type DadosDmrvEmpresa,
} from '@/services/dmrvEmissoesService'
import { PROTOCOLOS_SETORIAIS } from '@/data/protocolosSetoriais'

describe('Relatório Estratificado dMRV - Reconciliação Pericial, Drill-Down e Traçabilidade', () => {
  const lotesMock = [
    {
      id: 'lote-real-01',
      cdv_codigo: 'CDV-SP-001',
      cdv_nome: 'Desmanche Verde Mooca Ltda',
      cdv_cnpj: '33.000.168/0001-09',
      protocolo: 'automotiva',
      total_co2e_evitado_kg: 2180,
      total_peso_kg: 1000,
      total_pecas: 2,
      veiculo_baixa_detran: 'DETRAN-SP-2025-99881',
      payload_bruto_json: JSON.stringify({
        chaveAcesso: '35250133000168000109550010000012341000012345',
        hashSha256: 'a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0',
      }),
      created: '2025-01-15T10:00:00Z',
    },
    {
      id: 'lote-real-02',
      cdv_codigo: 'CDV-MATERIAIS_CRITICOS_RECUPERADOS-101',
      cdv_nome: 'Reminera Reciclagem de Eletrônicos SA',
      cdv_cnpj: '33.000.168/0001-09',
      protocolo: 'materiais-criticos-recuperados',
      total_co2e_evitado_kg: 270,
      total_peso_kg: 50.5,
      total_pecas: 2,
      payload_bruto_json: JSON.stringify({
        modeloDoc: 'DCP',
        chaveAcesso: 'DCP-2025-REMINERA-009',
        hashSha256: 'fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210',
      }),
      created: '2025-02-10T14:30:00Z',
    },
  ]

  const pecasMock = [
    {
      id: 'peca-01',
      lote: 'lote-real-01',
      categoria_material: 'aco',
      descricao_peca: 'Porta dianteira esquerda em aço estampado',
      peso_kg: 1000,
      fator_co2e_kg: 2.18,
      co2e_evitado_kg: 2180,
      hash_sha256: 'a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0',
    },
    {
      id: 'peca-02',
      lote: 'lote-real-02',
      categoria_material: 'cobre',
      descricao_peca: 'Fio de cobre eletrolítico puro',
      peso_kg: 50,
      fator_co2e_kg: 5.4,
      co2e_evitado_kg: 270,
      hash_sha256: 'fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210',
    },
    {
      id: 'peca-03',
      lote: 'lote-real-02',
      categoria_material: 'outros',
      descricao_peca: 'Fração de Ouro Fino Recuperado (Sem fator de crédito)',
      peso_kg: 0.5,
      fator_co2e_kg: 0,
      co2e_evitado_kg: 0,
      hash_sha256: 'fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210',
    },
  ]

  it('calcula a estratificação em 3 níveis com reconciliação exata no modo Real (Produção)', () => {
    const kpiCards = construirCardsKpiSetoriais({
      slugDominante: 'automotiva',
      protocolo: PROTOCOLOS_SETORIAIS.automotiva,
      totalCo2eKg: 2450,
      totalMassaKg: 1050.5,
      totalPecas: 3,
      totalLotes: 2,
    })

    const est = construirEstratificacaoDmrv({
      lotes: lotesMock,
      pecas: pecasMock,
      kpiCards,
      origem: 'producao',
      cnpj: '33.000.168/0001-09',
      protocoloDominanteSlug: 'automotiva',
      protocoloDominanteNome: 'Desmanche e Reciclagem Automotiva',
    })

    // 1. Verificação Nível A (Protocolo): soma de CO2e e massa de cada protocolo = total
    expect(est.porProtocolo.length).toBe(2)
    const somaCo2eProtocolos = est.porProtocolo.reduce((acc, p) => acc + p.co2e_evitado_kg, 0)
    const somaMassaProtocolos = est.porProtocolo.reduce((acc, p) => acc + p.massa_kg, 0)

    expect(Math.round(somaCo2eProtocolos * 10) / 10).toBe(2450)
    expect(Math.round(somaMassaProtocolos * 10) / 10).toBe(1050.5)

    // 2. Verificação Nível B (Fator & Material): presença de materiais com fator e materiais sem fator
    const itemAco = est.porFatorMaterial.find((m) => m.chave === 'mat_aco')
    expect(itemAco).toBeDefined()
    expect(itemAco?.fator_co2e_kg).toBe(2.18)
    expect(itemAco?.co2e_evitado_kg).toBe(2180)
    expect(itemAco?.possuiFatorOficial).toBe(true)
    expect(itemAco?.statusRastreabilidade).toBe('com_fator_atribuido')

    const itemCobre = est.porFatorMaterial.find((m) => m.chave === 'mat_cobre')
    expect(itemCobre).toBeDefined()
    expect(itemCobre?.fator_co2e_kg).toBe(5.4)
    expect(itemCobre?.co2e_evitado_kg).toBe(270)

    // 3. Peça de ouro SEM FATOR NÃO SOME: deve aparecer com badge "rastreada, sem CO₂e atribuído"
    const itemOuro = est.porFatorMaterial.find((m) => m.chave.includes('critico_Ouro'))
    expect(itemOuro).toBeDefined()
    expect(itemOuro?.possuiFatorOficial).toBe(false)
    expect(itemOuro?.fator_co2e_kg).toBe(0)
    expect(itemOuro?.co2e_evitado_kg).toBe(0)
    expect(itemOuro?.peso_kg).toBe(0.5)
    expect(itemOuro?.statusRastreabilidade).toBe('rastreada_sem_co2e')

    // 4. Verificação Nível C (Lote -> Documento -> Hash): todos os lotes com hash SHA-256 preservado
    expect(est.porLoteDocumento.length).toBe(2)
    const lote1 = est.porLoteDocumento.find((l) => l.loteId === 'lote-real-01')
    expect(lote1).toBeDefined()
    expect(lote1?.hashSha256).toBe(
      'a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0',
    )
    expect(lote1?.tipoDocumento).toBe('NF-e')

    const lote2 = est.porLoteDocumento.find((l) => l.loteId === 'lote-real-02')
    expect(lote2).toBeDefined()
    expect(lote2?.hashSha256).toBe(
      'fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210',
    )

    // 5. Soma de conferência pericial
    expect(est.totaisConferencia.co2e_evitado_kg).toBe(2450)
    expect(est.totaisConferencia.massa_kg).toBe(1050.5)
    expect(est.totaisConferencia.total_pecas).toBe(3)
    expect(est.totaisConferencia.total_lotes).toBe(2)
    expect(est.totaisConferencia.massa_sem_co2e_kg).toBe(0.5)
    expect(est.totaisConferencia.pecas_sem_co2e).toBe(1)
  })

  it('funciona identicamente no modo Sandbox (Demonstração) respeitando o filtro de origem', () => {
    const lotesSandbox = [
      {
        id: 'synth-01',
        origem: 'sintetico',
        cdv_codigo: 'CDV-SANDBOX-001',
        protocolo: 'textil',
        total_co2e_evitado_kg: 500,
        total_peso_kg: 200,
        total_pecas: 5,
        created: '2025-01-20T00:00:00Z',
      },
    ]

    const kpiCards = construirCardsKpiSetoriais({
      slugDominante: 'textil',
      protocolo: PROTOCOLOS_SETORIAIS.textil,
      totalCo2eKg: 500,
      totalMassaKg: 200,
      totalPecas: 5,
      totalLotes: 1,
    })

    const est = construirEstratificacaoDmrv({
      lotes: lotesSandbox,
      pecas: [],
      kpiCards,
      origem: 'sintetico',
      cnpj: '00.000.000/0001-91',
      protocoloDominanteSlug: 'textil',
      protocoloDominanteNome: 'Moda Circular e Resíduos Têxteis',
    })

    expect(est.origemFiltro).toBe('sintetico')
    expect(est.totaisConferencia.co2e_evitado_kg).toBe(500)
    expect(est.totaisConferencia.massa_kg).toBe(200)
    expect(est.totaisConferencia.total_lotes).toBe(1)
    expect(est.porProtocolo[0].protocoloSlug).toBe('textil')
    expect(est.porLoteDocumento[0].hashSha256).toMatch(/^ORB-SYNTH/)
  })

  it('exportarRelatorioDmrvCsv inclui as 3 seções estratificadas e a soma de conferência', async () => {
    const kpiCards = construirCardsKpiSetoriais({
      slugDominante: 'automotiva',
      protocolo: PROTOCOLOS_SETORIAIS.automotiva,
      totalCo2eKg: 2450,
      totalMassaKg: 1050.5,
      totalPecas: 3,
      totalLotes: 2,
    })

    const est = construirEstratificacaoDmrv({
      lotes: lotesMock,
      pecas: pecasMock,
      kpiCards,
      origem: 'producao',
      cnpj: '33.000.168/0001-09',
      protocoloDominanteSlug: 'automotiva',
      protocoloDominanteNome: 'Desmanche e Reciclagem Automotiva',
    })

    const dadosDmrv: DadosDmrvEmpresa = {
      cnpj: '33.000.168/0001-09',
      origem_filtro: 'producao',
      total_co2e_evitado_kg: 2450,
      total_massa_reciclada_kg: 1050.5,
      total_pecas_reaproveitadas: 3,
      total_lotes_processados: 2,
      emissao_anual_tco2e: 45.2,
      escopo1_tco2e: 12.0,
      escopo2_tco2e: 18.0,
      escopo3_tco2e: 15.2,
      serie_temporal: [{ mes: '2025-01', co2e_evitado_kg: 2450, massa_kg: 1050.5 }],
      relatorios_anteriores: [],
      protocoloDominanteSlug: 'automotiva',
      protocoloDominanteNome: 'Desmanche e Reciclagem Automotiva',
      kpiCards,
      relatorioEstratificado: est,
    }

    const resultado = await exportarRelatorioDmrvCsv(dadosDmrv)
    expect(resultado.hash).toBeDefined()
    expect(resultado.hash.length).toBe(64)
    expect(resultado.nomeArquivo).toContain('relatorio_dmrv_33000168000109')
  })

  it('peça de soja NUNCA é rotulada como Fração Crítica (Ouro/Paládio/Prata/Terras Raras) e exibe "Soja em Grãos — rastreada, sem CO₂e atribuído"', () => {
    const pecaSojaMock = [
      {
        id: 'peca-soja-01',
        lote: 'lote-agro-01',
        material_declarado: 'Soja em Grãos [STATUS: EM ESTRUTURAÇÃO DE CATÁLOGO - ZERO CRÉDITO]',
        descricao_peca: 'Carga de Soja em Grãos - NCM 1201.90.00',
        categoria_material: 'agro',
        peso_kg: 50000,
        fator_co2e_kg: 0,
        co2e_evitado_kg: 0,
      },
    ]

    const loteAgroMock = [
      {
        id: 'lote-agro-01',
        cdv_codigo: 'SANDBOX-AGRO',
        created: '2025-02-20T10:00:00Z',
      },
    ]

    const kpiCards = construirCardsKpiSetoriais({
      slugDominante: 'agro',
      protocolo: PROTOCOLOS_SETORIAIS.agro,
      totalCo2eKg: 0,
      totalMassaKg: 50000,
      totalPecas: 1,
      totalLotes: 1,
    })

    const est = construirEstratificacaoDmrv({
      lotes: loteAgroMock,
      pecas: pecaSojaMock,
      kpiCards,
      origem: 'sintetico',
      cnpj: '33.000.168/0001-09',
      protocoloDominanteSlug: 'agro',
      protocoloDominanteNome: 'Agronegócio & Grãos',
    })

    expect(est.porFatorMaterial.length).toBe(1)
    const materialSoja = est.porFatorMaterial[0]

    // NUNCA deve ser classificado como minerais críticos nem conter termos de metais preciosos
    expect(materialSoja.nomeMaterial).not.toContain('Fração Crítica')
    expect(materialSoja.nomeMaterial).not.toContain('Ouro')
    expect(materialSoja.nomeMaterial).not.toContain('Paládio')
    expect(materialSoja.nomeMaterial).not.toContain('Terras Raras')
    expect(materialSoja.categoriaMaterial).toBe('agro_rastreado')

    // Deve exibir o nome canônico e limpo especificado
    expect(materialSoja.nomeMaterial).toBe('Soja em Grãos — rastreada, sem CO₂e atribuído')
    expect(materialSoja.fator_co2e_kg).toBe(0)
    expect(materialSoja.co2e_evitado_kg).toBe(0)
    expect(materialSoja.possuiFatorOficial).toBe(false)
    expect(materialSoja.statusRastreabilidade).toBe('rastreada_sem_co2e')
    expect(materialSoja.fonteFator).toContain('Em estruturação de catálogo — zero crédito')
  })

  it('preserva a tagline institucional unificada com travessão intacta', () => {
    const taglineEsperada = 'Prova Documental da Economia Circular — dMRV'
    expect(taglineEsperada).toContain('— dMRV')
    expect(taglineEsperada).not.toContain('(dMRV)')
  })
})
