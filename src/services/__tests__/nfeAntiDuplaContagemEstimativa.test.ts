import { describe, it, expect } from 'vitest'
import { calcularInventarioEmissoes } from '../motorEmissoes'
import type { DocumentoFiscalProcessado } from '../modelosFiscaisParser'

describe('Anti-dupla-contagem e Rótulo ESTIMATIVA (Piloto ACP Etapa 3 Peça 3d)', () => {
  const criarDocMock = (
    chave: string,
    numNota: string,
    itens: Array<{
      numeroItem: number
      descricao: string
      ncm: string
      quantidade: number
      unidade: string
      valorTotal: number
      isDevolucao?: boolean
    }>,
  ): DocumentoFiscalProcessado => ({
    chaveAcesso: chave,
    modeloFiscal: '55_nfe',
    numeroDocumento: numNota,
    serie: '1',
    dataEmissao: '2026-04-10T14:30:00-03:00',
    cnpjEmitente: '11.222.333/0001-44',
    nomeEmitente: 'Fornecedor Aço e Metais Brasil Ltda',
    cnpjDestinatario: '99.888.777/0001-66',
    nomeDestinatario: 'Cliente Indústria Transformadora S.A.',
    valorTotal: 50000,
    valorIcms: 9000,
    valorIpi: 0,
    valorPis: 825,
    valorCofins: 3800,
    origem: 'manual',
    itens: itens.map((it) => ({
      numeroItem: it.numeroItem,
      codigo: `PROD_${it.numeroItem}`,
      descricao: it.descricao,
      ncm: it.ncm,
      cfop: '5102',
      unidade: it.unidade,
      quantidade: it.quantidade,
      valorUnitario: it.valorTotal / it.quantidade,
      valorTotal: it.valorTotal,
      isDevolucao: Boolean(it.isDevolucao),
    })),
  })

  it('Anti-dupla-contagem: mesma NF-e (chave de acesso) duplicada 2× é somada exatamente 1×', () => {
    const chaveUnica = '41260411222333000144550010000012341000012345'
    const docOriginal = criarDocMock(chaveUnica, '1234', [
      {
        numeroItem: 1,
        descricao: 'Chapa de Aço Laminado a Quente',
        ncm: '72083900',
        quantidade: 1000, // 1000 kg = 1 tonelada
        unidade: 'KG',
        valorTotal: 8000,
      },
    ])

    // Mesma nota inserida duas vezes no lote de cálculo
    const docDuplicado = criarDocMock(chaveUnica, '1234', [
      {
        numeroItem: 1,
        descricao: 'Chapa de Aço Laminado a Quente (cópia idêntica)',
        ncm: '72083900',
        quantidade: 1000,
        unidade: 'KG',
        valorTotal: 8000,
      },
    ])

    // 1 execução com apenas 1 nota
    const inventarioUmaNota = calcularInventarioEmissoes([docOriginal])
    // 1 execução com a mesma nota 2 vezes
    const inventarioComDuplicata = calcularInventarioEmissoes([docOriginal, docDuplicado])

    // As emissões calculadas DEVEM ser exatamente iguais (nenhuma soma dupla)
    expect(inventarioComDuplicata.escopo3TotalTCO2e).toBe(inventarioUmaNota.escopo3TotalTCO2e)
    expect(inventarioComDuplicata.emissoesTotaisFosseisTCO2e).toBe(
      inventarioUmaNota.emissoesTotaisFosseisTCO2e,
    )
    expect(inventarioComDuplicata.totalDocumentosAnalisados).toBe(1)

    // A auditoria de não-duplicidade deve registrar a rejeição da nota repetida
    expect(inventarioComDuplicata.auditoriaDuplaContagem).toBeDefined()
    expect(inventarioComDuplicata.auditoriaDuplaContagem?.totalDocumentosRecebidos).toBe(2)
    expect(inventarioComDuplicata.auditoriaDuplaContagem?.totalDocumentosUnicosProcessados).toBe(1)
    expect(inventarioComDuplicata.auditoriaDuplaContagem?.documentosDuplicadosIgnorados).toBe(1)
    expect(inventarioComDuplicata.auditoriaDuplaContagem?.chavesAcessoUnicas).toContain(chaveUnica)
  })

  it('Anti-dupla-contagem: item duplicado dentro da mesma NF-e é somado apenas 1×', () => {
    const chaveUnica = '41260411222333000144550010000056781000056789'
    const docComItemDuplicadoInterno = criarDocMock(chaveUnica, '5678', [
      {
        numeroItem: 1,
        descricao: 'Barra de Alumínio Primário',
        ncm: '76011000',
        quantidade: 500, // 500 kg
        unidade: 'KG',
        valorTotal: 12000,
      },
      {
        // Mesmo número de item repetido dentro da mesma NF-e
        numeroItem: 1,
        descricao: 'Barra de Alumínio Primário (Item 1 Repetido)',
        ncm: '76011000',
        quantidade: 500,
        unidade: 'KG',
        valorTotal: 12000,
      },
      {
        numeroItem: 2,
        descricao: 'Cobre Eletrolítico Primário',
        ncm: '74031100',
        quantidade: 200, // 200 kg
        unidade: 'KG',
        valorTotal: 9000,
      },
    ])

    const docSemDuplicacao = criarDocMock(chaveUnica, '5678', [
      {
        numeroItem: 1,
        descricao: 'Barra de Alumínio Primário',
        ncm: '76011000',
        quantidade: 500,
        unidade: 'KG',
        valorTotal: 12000,
      },
      {
        numeroItem: 2,
        descricao: 'Cobre Eletrolítico Primário',
        ncm: '74031100',
        quantidade: 200,
        unidade: 'KG',
        valorTotal: 9000,
      },
    ])

    const inventarioNormal = calcularInventarioEmissoes([docSemDuplicacao])
    const inventarioComItemRepetido = calcularInventarioEmissoes([docComItemDuplicadoInterno])

    // As emissões devem bater exatamente igual porque o item 1 repetido foi ignorado
    expect(inventarioComItemRepetido.escopo3TotalTCO2e).toBe(inventarioNormal.escopo3TotalTCO2e)
    expect(inventarioComItemRepetido.auditoriaDuplaContagem?.itensDuplicadosIgnorados).toBe(1)
    expect(inventarioComItemRepetido.auditoriaDuplaContagem?.totalItensUnicosProcessados).toBe(2)
  })

  it('Rótulo ESTIMATIVA e Limitações Metodológicas acompanham o resultado da pegada', () => {
    const chave = '41260411222333000144550010000099991000099990'
    const doc = criarDocMock(chave, '9999', [
      {
        numeroItem: 1,
        descricao: 'Aço Laminado',
        ncm: '72083900',
        quantidade: 100,
        unidade: 'KG',
        valorTotal: 1000,
      },
      {
        numeroItem: 2,
        descricao: 'Item com NCM não mapeado',
        ncm: '99999999',
        quantidade: 50,
        unidade: 'UN',
        valorTotal: 500,
      },
    ])

    const inventario = calcularInventarioEmissoes([doc], {
      empresaNome: 'Empresa Piloto ACP',
      cnpj: '99.888.777/0001-66',
    })

    // Rótulo obrigatório ESTIMATIVA
    expect(inventario.rotuloResultado).toBe('ESTIMATIVA')

    // Declaração de natureza institucional neutra em pt-BR
    expect(inventario.declaracaoNaturezaResultado).toContain('ESTIMATIVA')
    expect(inventario.declaracaoNaturezaResultado).toContain('sem emissão de créditos de carbono')
    expect(inventario.declaracaoNaturezaResultado).toContain('limitações metodológicas')

    // Lista de limitações metodológicas estruturada e visível
    expect(Array.isArray(inventario.limitacoesMetodologicas)).toBe(true)
    expect(inventario.limitacoesMetodologicas.length).toBeGreaterThanOrEqual(5)

    const limitacoesJuntas = inventario.limitacoesMetodologicas.join(' | ')
    // Verifica limitações exigidas: não calculados, transporte/hipótese, fatores genéricos, uso da terra (LUC), posição não-emissora
    expect(limitacoesJuntas).toContain('não calculados')
    expect(limitacoesJuntas).toContain('Transporte')
    expect(limitacoesJuntas).toContain('Fatores de emissão genéricos')
    expect(limitacoesJuntas).toContain('Uso da terra e LUC')
    expect(limitacoesJuntas).toContain(
      'não configurando emissão, custódia ou transação de créditos de carbono',
    )
  })
})
