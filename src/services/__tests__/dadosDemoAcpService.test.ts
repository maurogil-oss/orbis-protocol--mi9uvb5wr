import { describe, it, expect } from 'vitest'
import {
  obterLoteDemonstracaoACP,
  obterDocumentosProcessadosDemoACP,
  NOTAS_DEMO_PILOTO_ACP,
  ID_LOTE_DEMO_ACP,
  CODIGO_LOTE_DEMO_ACP,
  AVISO_DADOS_DEMO_ACP,
} from '../dadosDemoAcpService'
import { isLoteDemo } from '../loteDemoService'
import { processarDocumentoFiscal } from '../modelosFiscaisParser'
import { calcularInventarioEmissoes } from '../motorEmissoes'

describe('Piloto ACP - Etapa 7: Dados de Exemplo Anonimizados para Demonstração', () => {
  it('1. Lote demo do piloto ACP está claramente marcado como is_demo=true e tag DEMO', () => {
    const lote = obterLoteDemonstracaoACP()

    expect(lote.id).toBe(ID_LOTE_DEMO_ACP)
    expect(lote.codigo_lote).toBe(CODIGO_LOTE_DEMO_ACP)
    expect(lote.is_demo).toBe(true)
    expect(lote.tag).toBe('DEMO')
    expect(lote.tipo).toBe('piloto_acp_demonstrativo')
    expect(AVISO_DADOS_DEMO_ACP).toContain('DADOS DE DEMONSTRAÇÃO ANONIMIZADOS')

    // Verificado pelo helper global isLoteDemo
    expect(isLoteDemo(lote)).toBe(true)
    expect(isLoteDemo(ID_LOTE_DEMO_ACP)).toBe(true)
    expect(isLoteDemo(CODIGO_LOTE_DEMO_ACP)).toBe(true)
  })

  it('2. Contém 3 notas fiscais fictícias com itens variados (aço, cobre, alumínio, sem fator e tonelada)', () => {
    const lote = obterLoteDemonstracaoACP()
    expect(lote.notas_fiscais.length).toBe(3)

    const [n1, n2, n3] = lote.notas_fiscais

    // Todas marcadas com isDemo e tag DEMO
    for (const n of [n1, n2, n3]) {
      expect(n.isDemo).toBe(true)
      expect(n.tagDemo).toBe('DEMO')
      expect(n.emitenteCnpj).toMatch(/^00\.000\.000\/\d{4}-\d{2}$/)
      expect(n.destinatarioCnpj).toBe('00.000.000/0001-91')
    }

    // Nota 1: Aço em Tonelada (2,18 tCO2e/t) + Cobre em kg (4,10 kgCO2e/kg)
    const itemAcoTon = n1.itens.find((i) => i.codigo === 'ACO-STR-01')
    expect(itemAcoTon).toBeDefined()
    expect(itemAcoTon?.unidadeDeclarada).toBe('t')
    expect(itemAcoTon?.quantidadeDeclarada).toBe(5.0)
    expect(itemAcoTon?.quantidadeConvertidaKg).toBe(5000.0)
    expect(itemAcoTon?.fatorKgCo2ePorKg).toBe(2.18)
    expect(itemAcoTon?.emissaoFossilTco2e).toBeCloseTo(10.9, 2)

    const itemCobre = n1.itens.find((i) => i.codigo === 'COB-ELE-02')
    expect(itemCobre).toBeDefined()
    expect(itemCobre?.unidadeDeclarada).toBe('kg')
    expect(itemCobre?.fatorKgCo2ePorKg).toBe(4.1)
    expect(itemCobre?.emissaoFossilTco2e).toBeCloseTo(0.82, 2)

    // Nota 2: Alumínio (14,40 tCO2e/t) + Item sem Fator
    const itemAlu = n2.itens.find((i) => i.codigo === 'ALU-PRI-01')
    expect(itemAlu).toBeDefined()
    expect(itemAlu?.fatorKgCo2ePorKg).toBe(14.4)
    expect(itemAlu?.emissaoFossilTco2e).toBeCloseTo(7.2, 2)

    const itemSemFator = n2.itens.find((i) => i.codigo === 'INS-SEM-FATOR-02')
    expect(itemSemFator).toBeDefined()
    expect(itemSemFator?.naoCalculado).toBe(true)
    expect(itemSemFator?.emissaoFossilTco2e).toBe(0)

    // Nota 3: Item em tonelada e unidade divergente (CX)
    const itemCx = n3.itens.find((i) => i.codigo === 'EMB-CX-02')
    expect(itemCx).toBeDefined()
    expect(itemCx?.naoCalculado).toBe(true)
    expect(itemCx?.emissaoFossilTco2e).toBe(0)
  })

  it('3. Totais agregados do lote demo conferem com a soma exata dos itens', () => {
    const lote = obterLoteDemonstracaoACP()
    expect(lote.totais.qtdNotas).toBe(3)
    expect(lote.totais.qtdItens).toBe(6)
    expect(lote.totais.qtdItensComFator).toBe(4)
    expect(lote.totais.qtdItensNaoCalculados).toBe(2)

    // Massa total convertida = 5.000 + 200 + 500 + 1.200 = 6.900 kg
    expect(lote.totais.massaTotalKg).toBe(6900)

    // Emissão total esperada = 10.9 (aço) + 0.82 (cobre) + 7.2 (alu) + 2.616 (aço) = 21.536 tCO2e
    expect(lote.totais.emissaoTotalTco2e).toBeCloseTo(21.536, 3)
  })

  it('4. Parsing dos XMLs simulados das notas demo funciona no parser real de NF-e', () => {
    for (const nota of NOTAS_DEMO_PILOTO_ACP) {
      const doc = processarDocumentoFiscal(nota.xmlSimulado, `demo_${nota.numeroNota}.xml`)
      expect(doc.numeroDocumento).toBe(nota.numeroNota)
      expect(doc.chaveAcesso).toBe(nota.chaveAcesso)
      expect(doc.itens.length).toBe(nota.itens.length)
    }

    // Calcula inventário a partir dos documentos demo processados
    const docs = obterDocumentosProcessadosDemoACP()
    expect(docs.length).toBe(3)

    const inv = calcularInventarioEmissoes(docs, {
      empresaNome: 'Empresa Associada Piloto ACP DEMO',
      cnpj: '00.000.000/0001-91',
    })

    expect(inv.escopo3TotalTCO2e).toBeGreaterThan(0)
    // Itens com flag naoCalculado foram preservados com emissão 0
    const itensNaoCalculados = inv.itensDetalhados.filter((i) => i.naoCalculado)
    expect(itensNaoCalculados.length).toBe(2)
    for (const it of itensNaoCalculados) {
      expect(it.fossilTCO2e).toBe(0)
    }
  })
})
