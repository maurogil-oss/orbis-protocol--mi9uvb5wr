import { describe, it, expect, vi } from 'vitest'
import {
  calcularDvCnpj,
  validarCnpjAlfanumerico,
  gerarCnpjValido,
  calcularDvChave44,
  gerarChaveAcesso44,
  gerarDocumentoSintetico,
  gerarLoteSintetico,
  gerarSementeRodada,
  normalizarSegmento,
  SEGMENTOS_SANDBOX_CATALOGO,
  MARCA_SANDBOX_OBRIGATORIA,
} from '../sandboxSyntheticGenerator'
import { isValidCNPJ } from '../cnpj'
import { calcularInventarioGhgPorSegmento } from '@/components/ConsoleSandboxIngestaoTab'
import pb from '@/lib/pocketbase/client'

describe('sandboxSyntheticGenerator - Suite de Verificação do Sandbox e Isolamento dMRV', () => {
  // 1. Verificação do módulo 11 de CNPJ (com caracteres alfanuméricos)
  it('calcula e valida CNPJ puramente numérico corretamente', () => {
    // Base: 330001680001 -> DV esperado 09
    const { dv1, dv2, completo } = calcularDvCnpj('330001680001')
    expect(dv1).toBe(0)
    expect(dv2).toBe(9)
    expect(completo).toBe('33000168000109')
    expect(validarCnpjAlfanumerico('33000168000109')).toBe(true)
  })

  it('calcula e valida CNPJ alfanumérico conforme IN RFB 2.229/2024', () => {
    // Gera base com letras e calcula DVs
    const baseAlfanum = '12ABC3450001'
    const { dv1, dv2, completo } = calcularDvCnpj(baseAlfanum)
    expect(typeof dv1).toBe('number')
    expect(typeof dv2).toBe('number')
    expect(completo.length).toBe(14)
    expect(validarCnpjAlfanumerico(completo)).toBe(true)
  })

  it('gerarCnpjValido produz CNPJs estritamente válidos pelo algoritmo oficial', () => {
    for (let i = 0; i < 10; i++) {
      const cnpjNum = gerarCnpjValido({ alfanumerico: false, seed: i * 11 })
      expect(validarCnpjAlfanumerico(cnpjNum)).toBe(true)

      const cnpjAlfa = gerarCnpjValido({ alfanumerico: true, seed: i * 23 })
      expect(validarCnpjAlfanumerico(cnpjAlfa)).toBe(true)
    }
  })

  // 2. Chave de acesso 44 dígitos mod 11 pesos 2-9
  it('calcularDvChave44 e gerarChaveAcesso44 produzem chave de 44 dígitos com DV válido', () => {
    const chave = gerarChaveAcesso44({
      cUF: '41',
      aamm: '2603',
      cnpjEmitente: '33000168000109',
      modelo: '55',
      serie: '1',
      numeroDoc: '100',
    })
    expect(chave.length).toBe(44)
    const base43 = chave.slice(0, 43)
    const dvCalculado = calcularDvChave44(base43)
    expect(dvCalculado.toString()).toBe(chave.slice(43, 44))
  })

  // 3. Catálogo dos 15 Protocolos Setoriais + Materiais Críticos
  it('SEGMENTOS_SANDBOX_CATALOGO contém exatamente os 15 protocolos setoriais + materiais críticos', () => {
    expect(SEGMENTOS_SANDBOX_CATALOGO.length).toBe(16)

    const slugs = SEGMENTOS_SANDBOX_CATALOGO.map((s) => s.slugCanonico)
    expect(slugs).toContain('agro')
    expect(slugs).toContain('siderurgia')
    expect(slugs).toContain('cimento')
    expect(slugs).toContain('energia')
    expect(slugs).toContain('quimica')
    expect(slugs).toContain('logistica')
    expect(slugs).toContain('textil')
    expect(slugs).toContain('mineracao')
    expect(slugs).toContain('automotiva')
    expect(slugs).toContain('alimentos')
    expect(slugs).toContain('papel')
    expect(slugs).toContain('plasticos')
    expect(slugs).toContain('farmaceutica')
    expect(slugs).toContain('construcao')
    expect(slugs).toContain('varejo')
    expect(slugs).toContain('materiais-criticos-recuperados')
  })

  it('normalizarSegmento mapeia corretamente chaves canônicas e legadas', () => {
    expect(normalizarSegmento('automotiva')).toBe('automotiva')
    expect(normalizarSegmento('desmanche_cdv')).toBe('automotiva')
    expect(normalizarSegmento('combustiveis')).toBe('energia')
    expect(normalizarSegmento('transporte_cte')).toBe('logistica')
    expect(normalizarSegmento('varejo_reverso')).toBe('varejo')
    expect(normalizarSegmento('construcao_rcd')).toBe('construcao')
    expect(normalizarSegmento('mineracao_urbana_criticos')).toBe('materiais-criticos-recuperados')
  })

  // 4. Geração por segmento com fatores oficiais e regras fixas
  it('gera documento sintético para Siderurgia & Aço Verde com fator oficial 2,18', async () => {
    const doc = await gerarDocumentoSintetico({
      segmento: 'siderurgia',
      indice: 0,
      dataReferencia: '2026-03-15',
    })

    expect(doc.modeloFiscal).toBe('55')
    expect(doc.chaveAcesso.length).toBe(44)
    expect(doc.itens.length).toBe(1)
    expect(doc.itens[0].categoriaMaterial).toBe('aco')
    expect(doc.itens[0].fatorCo2eKg).toBe(2.18)
    expect(doc.itens[0].co2eEvitadoKg).toBeGreaterThan(0)
    expect(doc.xmlConteudo).toContain(MARCA_SANDBOX_OBRIGATORIA)
  })

  it('gera documento sintético para Automotiva / CDVs com fatores oficiais (aço 2,18, alu 14,40, cobre 5,40)', async () => {
    const doc = await gerarDocumentoSintetico({
      segmento: 'automotiva',
      indice: 1,
      dataReferencia: '2026-03-15',
    })

    expect(doc.itens.length).toBe(3)
    const aco = doc.itens.find((i) => i.categoriaMaterial === 'aco')
    const alu = doc.itens.find((i) => i.categoriaMaterial === 'aluminio')
    const cobre = doc.itens.find((i) => i.categoriaMaterial === 'cobre')

    expect(aco?.fatorCo2eKg).toBe(2.18)
    expect(alu?.fatorCo2eKg).toBe(14.4)
    expect(cobre?.fatorCo2eKg).toBe(5.4)
    expect(doc.xmlConteudo).toContain(MARCA_SANDBOX_OBRIGATORIA)
  })

  it('gera documento de Materiais Críticos com regra fixa: apenas cobre pontua e ouro/paládio/terras raras com zero crédito', async () => {
    const doc = await gerarDocumentoSintetico({
      segmento: 'materiais-criticos-recuperados',
      indice: 0,
      dataReferencia: '2026-03-15',
    })

    const cobre = doc.itens.find((i) => i.cProd.includes('COBRE'))
    const ouro = doc.itens.find((i) => i.cProd.includes('OURO'))
    const paladio = doc.itens.find((i) => i.cProd.includes('PALADIO'))
    const terrasRaras = doc.itens.find((i) => i.cProd.includes('TERRAS-RARAS'))

    expect(cobre).toBeDefined()
    expect(cobre?.categoriaMaterial).toBe('cobre')
    expect(cobre?.fatorCo2eKg).toBe(5.4)
    expect(cobre?.co2eEvitadoKg).toBeGreaterThan(0)

    // Metais nobres e terras raras: NUNCA pontuam crédito de carbono (regra permanente da casa)
    expect(ouro?.fatorCo2eKg).toBe(0)
    expect(ouro?.co2eEvitadoKg).toBe(0)
    expect(ouro?.statusCalculo).toBe('em_estruturacao_de_catalogo')

    expect(paladio?.fatorCo2eKg).toBe(0)
    expect(paladio?.co2eEvitadoKg).toBe(0)
    expect(paladio?.statusCalculo).toBe('em_estruturacao_de_catalogo')

    expect(terrasRaras?.fatorCo2eKg).toBe(0)
    expect(terrasRaras?.co2eEvitadoKg).toBe(0)
    expect(terrasRaras?.statusCalculo).toBe('em_estruturacao_de_catalogo')

    // Verificação de proibição estrita de termos banidos
    expect(doc.xmlConteudo).not.toContain('Selo Oficial')
    expect(doc.xmlConteudo).toContain(MARCA_SANDBOX_OBRIGATORIA)
  })

  it('gera documento de CT-e (mod. 57) para Logística & Transporte', async () => {
    const doc = await gerarDocumentoSintetico({
      segmento: 'logistica',
      indice: 0,
      dataReferencia: '2026-03-15',
    })

    expect(doc.modeloFiscal).toBe('57')
    expect(doc.xmlConteudo).toContain('<cteProc')
    expect(doc.dadosAdicionais.rntrc).toBeDefined()
    expect(doc.xmlConteudo).toContain(MARCA_SANDBOX_OBRIGATORIA)
  })

  // 5. Coerência setorial do Inventário GHG sintético gerado na ingestão
  it('calcularInventarioGhgPorSegmento gera Escopos 1/2/3 coerentes com o protocolo setorial', () => {
    // Logística: alto Escopo 1 (combustão diesel frotas)
    const invLog = calcularInventarioGhgPorSegmento('logistica', 10)
    expect(invLog.escopo1Tco2e).toBeGreaterThan(invLog.escopo2LocalizacaoTco2e)
    expect(invLog.descricaoPerfil).toContain('Combustão móvel de frota pesada')

    // Varejo: maior Escopo 2 (eletricidade de lojas/CDs) em relação ao Escopo 1
    const invVarejo = calcularInventarioGhgPorSegmento('varejo', 10)
    expect(invVarejo.escopo2LocalizacaoTco2e).toBeGreaterThan(invVarejo.escopo1Tco2e)

    // Siderurgia: grande volume direto em altos-fornos
    const invSid = calcularInventarioGhgPorSegmento('siderurgia', 10)
    expect(invSid.escopo1Tco2e).toBeGreaterThan(300)

    // Construção: peso principal em insumos / cadeia (Escopo 3)
    const invConst = calcularInventarioGhgPorSegmento('construcao', 10)
    expect(invConst.escopo3Tco2e).toBeGreaterThan(invConst.escopo1Tco2e)
  })

  it('gerarLoteSintetico produz a quantidade exata de documentos solicitada', async () => {
    const lote = await gerarLoteSintetico({
      segmento: 'energia',
      quantidade: 5,
    })
    expect(lote.length).toBe(5)
    for (const d of lote) {
      expect(d.chaveAcesso.length).toBe(44)
      expect(d.hashSha256.length).toBe(64)
      expect(d.xmlConteudo).toContain(MARCA_SANDBOX_OBRIGATORIA)
    }
  })

  // 6. Teste de isolamento pericial estrito no dMRV e emissoes_inventario
  it('carregarDadosDmrvEmpresa isola dados de produção (padrão) e dados de sandbox quando filtroOrigem é sintetico', async () => {
    const { carregarDadosDmrvEmpresa } = await import('../dmrvEmissoesService')

    const mockLotes = [
      {
        id: 'lote-real-1',
        origem: 'producao',
        total_co2e_evitado_kg: 1000,
        total_peso_kg: 500,
        cdv_cnpj: '33000168000109',
        created: '2026-01-15T10:00:00.000Z',
      },
      {
        id: 'lote-synth-1',
        origem: 'sintetico',
        total_co2e_evitado_kg: 9999,
        total_peso_kg: 3333,
        cdv_cnpj: '33000168000109',
        created: '2026-03-20T10:00:00.000Z',
      },
    ]

    const mockPecas = [
      {
        id: 'peca-real-1',
        origem: 'producao',
        co2e_evitado_kg: 1000,
        peso_kg: 500,
        cdv_cnpj: '33000168000109',
        created: '2026-01-15T10:00:00.000Z',
      },
      {
        id: 'peca-synth-1',
        origem: 'sintetico',
        co2e_evitado_kg: 9999,
        peso_kg: 3333,
        cdv_cnpj: '33000168000109',
        created: '2026-03-20T10:00:00.000Z',
      },
    ]

    const mockInventarios = [
      {
        id: 'inv-real-1',
        origem: 'producao',
        escopo1_total_tco2e: 50.0,
        escopo2_localizacao_tco2e: 20.0,
        escopo3_total_tco2e: 100.0,
        created: '2026-01-15T10:00:00.000Z',
      },
      {
        id: 'inv-synth-1',
        origem: 'sintetico',
        escopo1_total_tco2e: 500.0,
        escopo2_localizacao_tco2e: 200.0,
        escopo3_total_tco2e: 1000.0,
        created: '2026-03-20T10:00:00.000Z',
      },
    ]

    vi.spyOn(pb.collection('emissoes_inventario'), 'getFullList').mockResolvedValue(
      mockInventarios as any,
    )
    vi.spyOn(pb.collection('cdv_lotes'), 'getFullList').mockResolvedValue(mockLotes as any)
    vi.spyOn(pb.collection('cdv_pecas'), 'getFullList').mockResolvedValue(mockPecas as any)
    vi.spyOn(pb.collection('relatorios_exportados'), 'getFullList').mockResolvedValue([])

    // 1. Chamada produção: apenas lotes/peças/inventário reais
    const dadosProd = await carregarDadosDmrvEmpresa('33.000.168/0001-09', 'producao')
    expect(dadosProd.total_co2e_evitado_kg).toBe(1000)
    expect(dadosProd.total_massa_reciclada_kg).toBe(500)
    expect(dadosProd.total_pecas_reaproveitadas).toBe(1)
    expect(dadosProd.total_lotes_processados).toBe(1)
    expect(dadosProd.escopo1_tco2e).toBe(50.0)
    expect(dadosProd.escopo2_tco2e).toBe(20.0)
    expect(dadosProd.escopo3_tco2e).toBe(100.0)
    expect(dadosProd.emissao_anual_tco2e).toBe(170.0)
    // Série temporal usa a data real do lote de janeiro
    expect(dadosProd.serie_temporal[0]?.mes).toContain('/26')

    // 2. Chamada sandbox ('sintetico'): apenas registros com origem == 'sintetico'
    const dadosSandbox = await carregarDadosDmrvEmpresa('33.000.168/0001-09', 'sintetico')
    expect(dadosSandbox.total_co2e_evitado_kg).toBe(9999)
    expect(dadosSandbox.total_massa_reciclada_kg).toBe(3333)
    expect(dadosSandbox.total_pecas_reaproveitadas).toBe(1)
    expect(dadosSandbox.total_lotes_processados).toBe(1)
    expect(dadosSandbox.escopo1_tco2e).toBe(500.0)
    expect(dadosSandbox.escopo2_tco2e).toBe(200.0)
    expect(dadosSandbox.escopo3_tco2e).toBe(1000.0)
    expect(dadosSandbox.emissao_anual_tco2e).toBe(1700.0)
    expect(dadosSandbox.serie_temporal[0]?.mes).toContain('/26')
  })

  // 7. Semente por rodada (round seed) - Requisitos verbatim da tarefa
  describe('Semente por rodada no gerador sintético (Requisitos do usuário)', () => {
    it('(a) duas gerações do mesmo segmento em mesma data produzem conjuntos de chaves de acesso distintos', async () => {
      const hoje = '2026-03-30'
      const loteA = await gerarLoteSintetico({
        segmento: 'agro',
        quantidade: 5,
        dataReferencia: hoje,
        roundSeed: 123456,
      })
      const loteB = await gerarLoteSintetico({
        segmento: 'agro',
        quantidade: 5,
        dataReferencia: hoje,
        roundSeed: 654321,
      })

      const chavesA = loteA.map((d) => d.chaveAcesso)
      const chavesB = loteB.map((d) => d.chaveAcesso)

      // Nenhuma chave do lote A pode coincidir com lote B no mesmo dia
      const intersecaoChaves = chavesA.filter((c) => chavesB.includes(c))
      expect(intersecaoChaves).toHaveLength(0)

      // Hashes sha256 também devem ser distintos
      const hashesA = loteA.map((d) => d.hashSha256)
      const hashesB = loteB.map((d) => d.hashSha256)
      const intersecaoHashes = hashesA.filter((h) => hashesB.includes(h))
      expect(intersecaoHashes).toHaveLength(0)
    })

    it('(b) todos os CNPJs gerados entre rodadas passam na validação de DV', async () => {
      for (const roundSeed of [11111, 22222, 987654]) {
        const lote = await gerarLoteSintetico({
          segmento: 'automotiva',
          quantidade: 4,
          roundSeed,
        })
        for (const doc of lote) {
          // Validação oficial (incluindo suporte a alfanumérico se gerado)
          expect(validarCnpjAlfanumerico(doc.cnpjEmitente)).toBe(true)
          expect(validarCnpjAlfanumerico(doc.cnpjDestinatario)).toBe(true)
          if (/^\d{14}$/.test(doc.cnpjEmitente)) {
            expect(isValidCNPJ(doc.cnpjEmitente)).toBe(true)
          }
          if (/^\d{14}$/.test(doc.cnpjDestinatario)) {
            expect(isValidCNPJ(doc.cnpjDestinatario)).toBe(true)
          }
        }
      }
    })

    it('(c) pesos e quantidades variam a cada execução e ficam dentro das faixas realistas por segmento', async () => {
      const docRodada1 = await gerarDocumentoSintetico({
        segmento: 'agro',
        indice: 0,
        roundSeed: 10001,
      })
      const docRodada2 = await gerarDocumentoSintetico({
        segmento: 'agro',
        indice: 0,
        roundSeed: 20002,
      })

      // Soja: ~30 a 90 toneladas por lote (30.000 a 90.000 kg)
      expect(docRodada1.itens[0].pesoKg).toBeGreaterThanOrEqual(30000)
      expect(docRodada1.itens[0].pesoKg).toBeLessThanOrEqual(90000)
      expect(docRodada2.itens[0].pesoKg).toBeGreaterThanOrEqual(30000)
      expect(docRodada2.itens[0].pesoKg).toBeLessThanOrEqual(90000)

      // Variam entre rodadas diferentes
      expect(docRodada1.itens[0].pesoKg).not.toBe(docRodada2.itens[0].pesoKg)
      expect(docRodada1.cnpjEmitente).not.toBe(docRodada2.cnpjEmitente)
      expect(docRodada1.chaveAcesso).not.toBe(docRodada2.chaveAcesso)
    })

    it('(d) categoria agro_rastreado preservada com CO₂e = 0 em qualquer roundSeed', async () => {
      for (const seed of [101, 202, 999999]) {
        const docAgro = await gerarDocumentoSintetico({
          segmento: 'agro',
          indice: 0,
          roundSeed: seed,
        })
        expect(docAgro.itens[0].categoriaMaterial).toBe('agro_rastreado')
        expect(docAgro.itens[0].fatorCo2eKg).toBe(0)
        expect(docAgro.itens[0].co2eEvitadoKg).toBe(0)
        expect(docAgro.itens[0].statusCalculo).toBe('em_estruturacao_de_catalogo')
      }
    })

    it('gerarSementeRodada retorna inteiro positivo de 6 dígitos', () => {
      const seed1 = gerarSementeRodada()
      const seed2 = gerarSementeRodada()
      expect(Number.isInteger(seed1)).toBe(true)
      expect(seed1).toBeGreaterThanOrEqual(100000)
      expect(seed1).toBeLessThan(1000000)
    })

    it('roundSeed padrão é gerado automaticamente em gerarLoteSintetico sem parâmetro explícito', async () => {
      const loteA = await gerarLoteSintetico({ segmento: 'siderurgia', quantidade: 2 })
      const loteB = await gerarLoteSintetico({ segmento: 'siderurgia', quantidade: 2 })
      expect(loteA[0].chaveAcesso).not.toBe(loteB[0].chaveAcesso)
      expect(loteA[0].dadosAdicionais.roundSeed).toBeDefined()
      expect(loteB[0].dadosAdicionais.roundSeed).toBeDefined()
      expect(loteA[0].dadosAdicionais.roundSeed).not.toBe(loteB[0].dadosAdicionais.roundSeed)
    })
  })
})
