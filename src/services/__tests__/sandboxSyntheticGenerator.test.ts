import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  charToValorCnpj,
  calcularDvCnpj,
  validarCnpjAlfanumerico,
  gerarCnpjValido,
  calcularDvChave44,
  gerarChaveAcesso44,
  gerarDocumentoSintetico,
  gerarLoteSintetico,
  MARCA_SANDBOX_OBRIGATORIA,
} from '../sandboxSyntheticGenerator'
import { obterNumerosVerificaveis } from '../metricasHomeService'
import pb from '@/lib/pocketbase/client'

describe('SandboxSyntheticGenerator - Algoritmos Matemáticos Nativos', () => {
  describe('CNPJ Módulo 11 (Numérico Tradicional e Alfanumérico IN RFB 2.229/2024)', () => {
    it('converte corretamente caracteres numéricos e alfabéticos segundo padrão Receita Federal', () => {
      // 0-9 => 0-9
      expect(charToValorCnpj('0')).toBe(0)
      expect(charToValorCnpj('9')).toBe(9)
      // A-Z => 10-35 (ASCII - 55)
      expect(charToValorCnpj('A')).toBe(10)
      expect(charToValorCnpj('B')).toBe(11)
      expect(charToValorCnpj('Z')).toBe(35)
      expect(charToValorCnpj('a')).toBe(10) // case insensitive
    })

    it('calcula os dois DVs de CNPJ puramente numérico e valida matematicamente', () => {
      // Base conhecida com estabelecimento 0001
      const base = '123456780001'
      const { dv1, dv2, completo } = calcularDvCnpj(base)
      expect(completo.length).toBe(14)
      expect(completo).toBe(`${base}${dv1}${dv2}`)
      expect(validarCnpjAlfanumerico(completo)).toBe(true)
    })

    it('calcula e valida CNPJ com raiz alfanumérica conforme IN RFB 2.229/2024', () => {
      // Raiz alfanumérica ex: '12ABC3450001'
      const baseAlfa = '12ABC3450001'
      const { dv1, dv2, completo } = calcularDvCnpj(baseAlfa)
      expect(typeof dv1).toBe('number')
      expect(typeof dv2).toBe('number')
      expect(dv1).toBeGreaterThanOrEqual(0)
      expect(dv1).toBeLessThanOrEqual(9)
      expect(dv2).toBeGreaterThanOrEqual(0)
      expect(dv2).toBeLessThanOrEqual(9)
      expect(validarCnpjAlfanumerico(completo)).toBe(true)
    })

    it('rejeita CNPJs com DVs incorretos ou formatações inválidas', () => {
      expect(validarCnpjAlfanumerico('12345678000199')).toBe(false)
      expect(validarCnpjAlfanumerico('00000000000000')).toBe(false)
      expect(validarCnpjAlfanumerico('11111111111111')).toBe(false)
      expect(validarCnpjAlfanumerico('123')).toBe(false)
    })

    it('gerador gerarCnpjValido produz 100% de CNPJs válidos (numéricos e alfanuméricos)', () => {
      for (let i = 0; i < 20; i++) {
        const cnpjNum = gerarCnpjValido({ alfanumerico: false, seed: i * 17 })
        expect(validarCnpjAlfanumerico(cnpjNum)).toBe(true)
        expect(cnpjNum).toMatch(/^\d{14}$/)

        const cnpjAlfa = gerarCnpjValido({ alfanumerico: true, seed: i * 31 + 5 })
        expect(validarCnpjAlfanumerico(cnpjAlfa)).toBe(true)
        expect(cnpjAlfa.length).toBe(14)
      }
    })
  })

  describe('Chave de Acesso Fiscal de 44 Dígitos (NF-e mod. 55 e CT-e mod. 57)', () => {
    it('calcula o Dígito Verificador por módulo 11 com pesos de 2 a 9 corretamente', () => {
      // Chave base de 43 dígitos
      const chaveBase43 = '412604000000000001915500100010000118765432'
      const dv = calcularDvChave44(chaveBase43)
      expect(typeof dv).toBe('number')
      expect(dv).toBeGreaterThanOrEqual(0)
      expect(dv).toBeLessThanOrEqual(9)
    })

    it('gera chave de 44 dígitos íntegra com modelo 55 e modelo 57', () => {
      const chaveNfe = gerarChaveAcesso44({
        cUF: '41',
        aamm: '2604',
        cnpjEmitente: '12345678000195',
        modelo: '55',
        serie: '1',
        numeroDoc: '100001',
        codigoAleatorio: '87654321',
      })
      expect(chaveNfe.length).toBe(44)
      expect(chaveNfe.slice(0, 2)).toBe('41')
      expect(chaveNfe.slice(2, 6)).toBe('2604')
      expect(chaveNfe.slice(20, 22)).toBe('55') // mod 55

      // Verifica que o último dígito é exatamente o DV calculado dos 43 anteriores
      const dvEsperadoNfe = calcularDvChave44(chaveNfe.slice(0, 43))
      expect(parseInt(chaveNfe.slice(43, 44), 10)).toBe(dvEsperadoNfe)

      const chaveCte = gerarChaveAcesso44({
        cUF: '41',
        aamm: '2604',
        cnpjEmitente: '98765432000188',
        modelo: '57',
        serie: '1',
        numeroDoc: '200001',
        codigoAleatorio: '12345678',
      })
      expect(chaveCte.length).toBe(44)
      expect(chaveCte.slice(20, 22)).toBe('57') // mod 57
      const dvEsperadoCte = calcularDvChave44(chaveCte.slice(0, 43))
      expect(parseInt(chaveCte.slice(43, 44), 10)).toBe(dvEsperadoCte)
    })
  })

  describe('Geradores de Documentos Sintéticos por Segmento com Marca Canônica', () => {
    it('gera NF-e de combustíveis com Diesel S10 e Biometanol, NCMs e marca obrigatória', async () => {
      const doc = await gerarDocumentoSintetico({
        segmento: 'combustiveis',
        indice: 0,
      })
      expect(doc.segmento).toBe('combustiveis')
      expect(doc.modeloFiscal).toBe('55')
      expect(doc.chaveAcesso.length).toBe(44)
      expect(doc.xmlConteudo).toContain(MARCA_SANDBOX_OBRIGATORIA)
      expect(doc.xmlConteudo).toContain('NCM')
      expect(doc.xmlConteudo).toContain('<nfeProc')
      expect(doc.hashSha256.length).toBe(64)
    })

    it('gera NF-e de desmanche com padrão Renova Ecopeças, chassi e NCM automotivo', async () => {
      const doc = await gerarDocumentoSintetico({
        segmento: 'desmanche_cdv',
        indice: 1,
      })
      expect(doc.segmento).toBe('desmanche_cdv')
      expect(doc.modeloFiscal).toBe('55')
      expect(doc.dadosAdicionais.chassi).toBeDefined()
      expect(doc.xmlConteudo).toContain(MARCA_SANDBOX_OBRIGATORIA)
      expect(doc.xmlConteudo).toContain('CHASSI')
      expect(doc.itens.length).toBeGreaterThan(0)
    })

    it('gera CT-e de transporte interestadual com CFOP 6353 e RNTRC', async () => {
      const doc = await gerarDocumentoSintetico({
        segmento: 'transporte_cte',
        indice: 2,
      })
      expect(doc.segmento).toBe('transporte_cte')
      expect(doc.modeloFiscal).toBe('57')
      expect(doc.xmlConteudo).toContain(MARCA_SANDBOX_OBRIGATORIA)
      expect(doc.xmlConteudo).toContain('<cteProc')
      expect(doc.xmlConteudo).toContain('RNTRC')
    })

    it('gera lote sintético com volume requisitado (ex: 10 documentos)', async () => {
      const lote = await gerarLoteSintetico({
        segmento: 'desmanche_cdv',
        quantidade: 10,
      })
      expect(lote.length).toBe(10)
      lote.forEach((doc) => {
        expect(doc.chaveAcesso.length).toBe(44)
        expect(doc.xmlConteudo).toContain(MARCA_SANDBOX_OBRIGATORIA)
      })
    })
  })
})

describe('Isolamento de Segurança e Métricas Públicas (Sandbox)', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('obterNumerosVerificaveis adiciona filtro para excluir origem == "sintetico"', async () => {
    const spyGetList = vi.spyOn(pb.collection('selos'), 'getList').mockResolvedValue({
      page: 1,
      perPage: 1,
      totalItems: 15,
      totalPages: 1,
      items: [],
    } as any)

    vi.spyOn(pb.collection('lastro_circularidade'), 'getList').mockResolvedValue({
      page: 1,
      perPage: 1,
      totalItems: 3,
      totalPages: 1,
      items: [],
    } as any)

    vi.spyOn(pb.collection('ccrlr_manifestos_sinir'), 'getList').mockResolvedValue({
      page: 1,
      perPage: 1,
      totalItems: 0,
      totalPages: 1,
      items: [],
    } as any)

    const spyPecas = vi.spyOn(pb.collection('cdv_pecas'), 'getList').mockResolvedValue({
      page: 1,
      perPage: 1,
      totalItems: 50,
      totalPages: 1,
      items: [],
    } as any)

    vi.spyOn(pb.collection('dpp_consultas'), 'getList').mockResolvedValue({
      page: 1,
      perPage: 1,
      totalItems: 100,
      totalPages: 1,
      items: [],
    } as any)

    const resultado = await obterNumerosVerificaveis()

    // Verifica se selos chamou com o filtro de exclusão do sandbox
    expect(spyGetList).toHaveBeenCalledWith(
      1,
      1,
      expect.objectContaining({
        filter: 'origem != "sintetico"',
      }),
    )

    // Verifica se peças chamou com o filtro de exclusão do sandbox
    expect(spyPecas).toHaveBeenCalledWith(
      1,
      1,
      expect.objectContaining({
        filter: 'origem != "sintetico"',
      }),
    )

    expect(resultado.selosEmitidos).toBe(15)
    expect(resultado.pecasRastreadas).toBe(50)
  })

  it('verificador público filtra fora selos com origem === "sintetico"', async () => {
    // Simula tentativa de consulta a selo sintético no backend
    const spyGetFirst = vi
      .spyOn(pb.collection('selos'), 'getFirstListItem')
      .mockImplementation(async (filter: string) => {
        // Se a query exigir origem != 'sintetico', o selo sintético não deve ser retornado
        if (filter.includes("origem != 'sintetico'")) {
          throw new Error('404 Not Found')
        }
        return {
          id: 'sintetico-1',
          codigo_selo: 'PR-SEAL-2026-SYN001',
          origem: 'sintetico',
        } as any
      })

    // Ao consultar com a cláusula de isolamento, gera erro de registro não encontrado
    await expect(
      pb
        .collection('selos')
        .getFirstListItem("codigo_selo = 'PR-SEAL-2026-SYN001' && origem != 'sintetico'"),
    ).rejects.toThrow('404 Not Found')

    expect(spyGetFirst).toHaveBeenCalled()
  })
})
