import { describe, it, expect, vi } from 'vitest'
import {
  determinarProtocoloDominante,
  extrairSlugLote,
  construirCardsKpiSetoriais,
  normalizarSlugSegmento,
} from '@/services/dmrvEmissoesService'
import { getProtocoloBySlug } from '@/data/protocolosSetoriais'
import { gerarLoteSintetico } from '@/services/sandboxSyntheticGenerator'
import pb from '@/lib/pocketbase/client'

describe('dmrvIngestaoSegmentos - Ingestão Universal dMRV nos 16 Segmentos', () => {
  it('normalizarSlugSegmento mapeia termos de agronegócio estritamente para "agro"', () => {
    expect(normalizarSlugSegmento('agro')).toBe('agro')
    expect(normalizarSlugSegmento('agronegocio')).toBe('agro')
    expect(normalizarSlugSegmento('AGRO_SOJA')).toBe('agro')
    expect(normalizarSlugSegmento('pecuaria_corte')).toBe('agro')
    expect(normalizarSlugSegmento('florestal_pinus')).toBe('agro')
  })

  it('determinarProtocoloDominante identifica "agro" a partir do lote gerado pelo Sandbox', async () => {
    const docsAgro = await gerarLoteSintetico({
      segmento: 'agro',
      quantidade: 1,
      usarCnpjAlfanumerico: false,
    })

    expect(docsAgro.length).toBe(1)
    const doc = docsAgro[0]

    // Simulação do registro em cdv_lotes como o Sandbox grava
    const loteGravado = {
      id: 'lote-agro-test',
      cdv_nome: doc.razaoSocialEmitente,
      cdv_cnpj: doc.cnpjEmitente,
      cdv_codigo: 'SANDBOX-AGRO',
      veiculo_marca_modelo: 'Agronegócio & Grãos (Demonstração)',
      veiculo_chassi: `SYNTH-${doc.chaveAcesso.slice(-8)}`,
      origem: 'sintetico',
      is_demo: true,
      total_pecas: doc.itens.length,
      total_peso_kg: doc.itens.reduce((acc, it) => acc + (it.pesoKg || 0), 0),
      total_co2e_evitado_kg: 0,
      payload_bruto_json: {
        tipo: 'sandbox_sintetico',
        segmento: doc.segmento,
        protocoloSetorialSlug: 'agro',
        chaveAcesso: doc.chaveAcesso,
      },
    }

    const dom = determinarProtocoloDominante([loteGravado], [])
    expect(dom.slug).toBe('agro')
    expect(dom.nome).toBe('Agronegócio & Grãos')
  })

  it('cards KPI assumem o vocabulário canônico de Agronegócio sem vazamento veicular', () => {
    const protoAgro = getProtocoloBySlug('agro')
    expect(protoAgro).toBeDefined()

    const cards = construirCardsKpiSetoriais({
      slugDominante: 'agro',
      protocolo: protoAgro!,
      totalCo2eKg: 0,
      totalMassaKg: 30000,
      totalPecas: 500,
      totalLotes: 1,
    })

    expect(cards.length).toBe(4)
    expect(cards[0].rotulo).toBe('CO₂e Evitado Total')
    expect(cards[1].rotulo).toBe('Produção Agrícola / Biomassa')
    expect(cards[1].unidade).toBe('kg')
    expect(cards[1].valorFormatado).toContain('30.000')

    expect(cards[2].rotulo).toBe('Talhões & Entregas Auditadas')
    expect(cards[2].unidade).toBe('itens')
    expect(cards[2].valorFormatado).toBe('500')

    expect(cards[3].rotulo).toBe('Lotes Agrícolas Fechados')
    expect(cards[3].unidade).toBe('lotes')
    expect(cards[3].valorFormatado).toBe('1')

    // Garantia de ausência de vocabulário veicular
    const textoCards = cards.map((c) => `${c.rotulo} ${c.legenda} ${c.unidade}`).join(' ')
    expect(textoCards).not.toMatch(/veículo|despoluição|chassi|peça usada|desmanche|cdv/i)
  })

  it('lotes de Energia, Logística, Mineração e Química definem seus respectivos protocolos dominantes', () => {
    const segmentos = ['energia', 'logistica', 'mineracao', 'quimica']

    for (const seg of segmentos) {
      const lote = {
        id: `lote-${seg}`,
        payload_bruto_json: {
          protocoloSetorialSlug: seg,
        },
      }

      const dom = determinarProtocoloDominante([lote], [])
      expect(dom.slug).toBe(seg)

      const proto = getProtocoloBySlug(seg)
      expect(proto).toBeDefined()

      const cards = construirCardsKpiSetoriais({
        slugDominante: seg,
        protocolo: proto!,
        totalCo2eKg: 100,
        totalMassaKg: 1000,
        totalPecas: 10,
        totalLotes: 1,
      })

      // Nenhum dos segmentos vazará vocabulário automotivo
      const texto = cards.map((c) => `${c.rotulo} ${c.legenda}`).join(' ')
      expect(texto).not.toMatch(/veículo|despoluição|chassi/i)
    }
  })

  it('regex reconhece SANDBOX-AGRO sem dígitos sufixados no cdv_codigo', () => {
    // Apenas cdv_codigo sem payload_bruto_json e sem campos de setor
    const loteApenasCodigo = {
      id: 'lote-sem-digitos',
      cdv_codigo: 'SANDBOX-AGRO',
    }

    const dom = determinarProtocoloDominante([loteApenasCodigo], [])
    expect(dom.slug).toBe('agro')
    expect(dom.nome).toBe('Agronegócio & Grãos')
  })

  it('5 lotes Cimento antigos + 5 Varejo + 10 SANDBOX-AGRO novos → dominante = agro', () => {
    const lotesCimento = Array.from({ length: 5 }).map((_, i) => ({
      id: `lote-cimento-${i}`,
      segmento: 'cimento',
      created: '2024-10-01T10:00:00.000Z',
      payload_bruto_json: {
        protocoloSetorialSlug: 'cimento',
        segmentoSlug: 'cimento',
        tipoSegmento: 'cimento',
      },
    }))

    const lotesVarejo = Array.from({ length: 5 }).map((_, i) => ({
      id: `lote-varejo-${i}`,
      segmento: 'varejo',
      created: '2024-10-02T10:00:00.000Z',
      payload_bruto_json: {
        protocoloSetorialSlug: 'varejo',
        segmentoSlug: 'varejo',
        tipoSegmento: 'varejo',
      },
    }))

    const lotesAgro = Array.from({ length: 10 }).map((_, i) => ({
      id: `lote-agro-${i}`,
      cdv_codigo: 'SANDBOX-AGRO',
      created: '2025-03-01T10:00:00.000Z',
      total_co2e_evitado_kg: 0,
    }))

    // 5 Cimento + 5 Varejo + 10 Agro => Agro possui 10 votos distintos (maior contagem de lotes)
    const todosLotes = [...lotesCimento, ...lotesVarejo, ...lotesAgro]
    const dom = determinarProtocoloDominante(todosLotes, [])

    expect(dom.slug).toBe('agro')
    expect(dom.nome).toBe('Agronegócio & Grãos')
    expect(dom.verticalMaisRecenteSlug).toBe('agro')
  })

  it('10 Materiais Críticos antigos + 10 Agro novos (empate exato) → agro vence pelo lote mais recente', () => {
    const lotesCriticosAntigos = Array.from({ length: 10 }).map((_, i) => ({
      id: `lote-critico-${i}`,
      cdv_codigo: 'SANDBOX-MATERIAIS_CRITICOS',
      created: '2025-01-01T10:00:00.000Z',
      payload_bruto_json: {
        protocoloSetorialSlug: 'materiais-criticos-recuperados',
        segmentoSlug: 'materiais-criticos-recuperados',
      },
    }))

    const lotesAgroNovos = Array.from({ length: 10 }).map((_, i) => ({
      id: `lote-agro-${i}`,
      cdv_codigo: 'SANDBOX-AGRO',
      created: '2025-02-15T15:30:00.000Z',
    }))

    // Inserindo primeiro os materiais críticos para garantir que não vence apenas pela ordem de inserção
    const todosLotes = [...lotesCriticosAntigos, ...lotesAgroNovos]

    const dom = determinarProtocoloDominante(todosLotes, [])
    expect(dom.slug).toBe('agro')
    expect(dom.nome).toBe('Agronegócio & Grãos')
    expect(dom.verticalMaisRecenteSlug).toBe('agro')
  })

  it('extrairSlugLote respeita a ordem estrita de prioridade das fontes', () => {
    // 1. protocolo tem prioridade sobre tudo
    expect(
      extrairSlugLote({
        protocolo: 'energia',
        protocolo_setorial: 'cimento',
        segmento: 'varejo',
        setor: 'textil',
        cdv_codigo: 'SANDBOX-AGRO',
      }),
    ).toBe('energia')

    // 2. protocolo_setorial tem prioridade sobre segmento
    expect(
      extrairSlugLote({
        protocolo_setorial: 'cimento',
        segmento: 'varejo',
        setor: 'textil',
        cdv_codigo: 'SANDBOX-AGRO',
      }),
    ).toBe('cimento')

    // 3. segmento sobre cdv_codigo
    expect(
      extrairSlugLote({
        segmento: 'varejo',
        cdv_codigo: 'SANDBOX-AGRO',
      }),
    ).toBe('varejo')

    // 4. cdv_codigo via regex sem dígitos
    expect(
      extrairSlugLote({
        cdv_codigo: 'SANDBOX-AGRO',
      }),
    ).toBe('agro')

    // 5. payload_bruto_json
    expect(
      extrairSlugLote({
        payload_bruto_json: JSON.stringify({ protocoloSetorialSlug: 'logistica' }),
      }),
    ).toBe('logistica')
  })

  it('lote SANDBOX-AGRO com soja resolve protocolo agro sem TypeError e exibe nome formatado seguro', async () => {
    const { carregarDadosDmrvEmpresa } = await import('../dmrvEmissoesService')

    const loteAgro = {
      id: 'lote-agro-teste-1',
      cdv_codigo: 'SANDBOX-AGRO',
      total_peso_kg: 50000,
      total_co2e_evitado_kg: 0,
      origem: 'sintetico',
      created: '2026-03-01T10:00:00.000Z',
    }

    const pecaSoja = {
      id: 'peca-soja-1',
      lote: 'lote-agro-teste-1',
      descricao_peca: 'Soja em Grãos - Granel Agrícola Safra 2026',
      categoria_material: 'agro',
      peso_kg: 50000,
      fator_co2e_kg: 0,
      co2e_evitado_kg: 0,
      origem: 'sintetico',
      protocolo: 'agro',
    }

    vi.spyOn(pb.collection('cdv_lotes'), 'getFullList').mockResolvedValueOnce([loteAgro] as any)
    vi.spyOn(pb.collection('cdv_pecas'), 'getFullList').mockResolvedValueOnce([pecaSoja] as any)
    vi.spyOn(pb.collection('emissoes_inventario'), 'getFullList').mockResolvedValueOnce([] as any)
    vi.spyOn(pb.collection('relatorios_exportados'), 'getFullList').mockResolvedValueOnce([] as any)

    const resultado = await carregarDadosDmrvEmpresa('33.000.168/0001-09', 'sintetico')

    expect(resultado.protocoloDominanteSlug).toBe('agro')
    expect(resultado.protocoloDominanteNome).toBe('Agro & Biomassa Sustentável')
    expect(resultado.kpiCards).toBeDefined()
    expect(resultado.kpiCards.length).toBe(4)

    // A peça de soja deve aparecer como rastreada sem crédito, nunca com rótulo de fração crítica
    const matSoja = resultado.relatorioEstratificado.porFatorMaterial.find((m) =>
      m.nomeMaterial.includes('Soja'),
    )
    expect(matSoja).toBeDefined()
    expect(matSoja?.nomeMaterial).toBe('Soja em Grãos — rastreada, sem CO₂e atribuído')
    expect(matSoja?.categoriaMaterial).toBe('agro_rastreado')
    expect(matSoja?.nomeMaterial).not.toMatch(/Fração Crítica|Ouro|Paládio|Prata/i)
  })
})
