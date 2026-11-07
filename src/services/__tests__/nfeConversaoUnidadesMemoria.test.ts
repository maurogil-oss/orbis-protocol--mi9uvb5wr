import { describe, it, expect } from 'vitest'
import { converterUnidadeExplicita, classificarItemCompradoNCM } from '../classificacaoFisicaNCM'
import { processarDocumentoFiscal } from '../modelosFiscaisParser'
import { calcularInventarioEmissoes } from '../motorEmissoes'

describe('Piloto ACP - Etapa 3 Peça 3a: Conversão Explícita de Unidades e Memória de Cálculo', () => {
  it('(1) conversor direto converterUnidadeExplicita: tonelada (t/ton) multiplica por 1000 com memória pericial', () => {
    const resTon = converterUnidadeExplicita(2.5, 't', 'kg')
    expect(resTon.sucesso).toBe(true)
    expect(resTon.operacao).toBe('multiplicacao')
    expect(resTon.fatorConversao).toBe(1000)
    expect(resTon.quantidadeConvertidaKg).toBe(2500)
    expect(resTon.formulaTexto).toContain('2.5 t × 1.000 = 2.500 kg')

    const resTonEscrito = converterUnidadeExplicita(10, 'ton', 'kg')
    expect(resTonEscrito.sucesso).toBe(true)
    expect(resTonEscrito.quantidadeConvertidaKg).toBe(10000)
  })

  it('(2) conversor direto converterUnidadeExplicita: grama (g/gr) divide por 1000 com memória pericial', () => {
    const resGrama = converterUnidadeExplicita(500, 'g', 'kg')
    expect(resGrama.sucesso).toBe(true)
    expect(resGrama.operacao).toBe('divisao')
    expect(resGrama.fatorConversao).toBe(0.001)
    expect(resGrama.quantidadeConvertidaKg).toBe(0.5)
    expect(resGrama.formulaTexto).toContain('500 g ÷ 1.000 = 0,5 kg')

    const resGr = converterUnidadeExplicita(2500, 'gramas', 'kg')
    expect(resGr.sucesso).toBe(true)
    expect(resGr.quantidadeConvertidaKg).toBe(2.5)
  })

  it('(3) conversor direto converterUnidadeExplicita: quilograma (kg) identidade sem conversão necessária', () => {
    const resKg = converterUnidadeExplicita(150, 'kg', 'kg')
    expect(resKg.sucesso).toBe(true)
    expect(resKg.operacao).toBe('identidade')
    expect(resKg.fatorConversao).toBe(1)
    expect(resKg.quantidadeConvertidaKg).toBe(150)
    expect(resKg.formulaTexto).toContain('sem conversão necessária')
  })

  it('(4) conversor direto converterUnidadeExplicita: unidade ausente ou desconhecida/incompatível → insucesso e recusa', () => {
    // Unidade ausente / vazia
    const resVazia = converterUnidadeExplicita(100, '', 'kg')
    expect(resVazia.sucesso).toBe(false)
    expect(resVazia.operacao).toBe('incompativel')
    expect(resVazia.quantidadeConvertidaKg).toBe(0)
    expect(resVazia.motivo).toContain('vedado assumir kg silenciosamente')

    // Unidade incompatível com massa (ex: UN, CX, PC)
    const resUn = converterUnidadeExplicita(50, 'UN', 'kg')
    expect(resUn.sucesso).toBe(false)
    expect(resUn.operacao).toBe('incompativel')
    expect(resUn.quantidadeConvertidaKg).toBe(0)
    expect(resUn.motivo).toContain('incompatível com a base mássica')

    // Litro para sólido (sem densidade pericial registrada)
    const resLitroSolido = converterUnidadeExplicita(20, 'L', 'kg')
    expect(resLitroSolido.sucesso).toBe(false)
    expect(resLitroSolido.motivo).toContain('sem densidade volumétrica pericial')
  })

  it('(5) classificação física NCM com item em tonelada: converte x1000 e gera memória de cálculo completa', () => {
    // Aço Carbono (Capítulo 72) -> Família Metais (fator 2.45 kgCO2e/kg)
    const classif = classificarItemCompradoNCM({
      descricao: 'Bobina de Aço Estrutural',
      ncm: '72101100',
      unidadeDeclarada: 'ton',
      quantidadeFisica: 3, // 3 toneladas = 3.000 kg
      valorBrl: 18000,
    })

    expect(classif.elevadoParaTier2).toBe(true)
    expect(classif.naoCalculado).toBeFalsy()
    expect(classif.quantidadeFisica).toBe(3000) // Convertido para kg
    expect(classif.unidadeFisica).toBe('kg')
    expect(classif.fatorUtilizado).toBe(2.45)
    // 3.000 kg * 2.45 = 7.350 kgCO2e = 7.35 tCO2e
    expect(classif.emissaoFossilKgCo2e).toBe(7350)
    expect(classif.emissaoFossilTco2e).toBe(7.35)

    expect(classif.memoriaConversao).toBeDefined()
    expect(classif.memoriaConversao?.sucesso).toBe(true)
    expect(classif.memoriaConversao?.operacao).toBe('multiplicacao')
    expect(classif.memoriaConversao?.quantidadeConvertidaKg).toBe(3000)

    expect(classif.memoriaCalculo).toBeDefined()
    expect(classif.memoriaCalculo?.entradaQtd).toBe(3)
    expect(classif.memoriaCalculo?.entradaUnidade).toBe('ton')
    expect(classif.memoriaCalculo?.quantidadeKg).toBe(3000)
    expect(classif.memoriaCalculo?.formulaTexto).toContain('3 ton × 1.000 = 3.000 kg')
    expect(classif.memoriaCalculo?.formulaTexto).toContain(
      '3.000 kg × 2.45 kgCO₂e/kg = 7.350,00 kgCO₂e (7.3500 tCO₂e)',
    )
  })

  it('(6) classificação física NCM com item com unidade ausente ou desconhecida → marcado como não calculado (emissão zero)', () => {
    // NCM de Metal (7210) mas com unidade "UN" (unidades)
    const classifUnidadeIncompativel = classificarItemCompradoNCM({
      descricao: 'Chapa de Aço Cortada em Peça Unitária',
      ncm: '72101100',
      unidadeDeclarada: 'UN',
      quantidadeFisica: 10,
      valorBrl: 5000,
    })

    expect(classifUnidadeIncompativel.naoCalculado).toBe(true)
    expect(classifUnidadeIncompativel.fatorUtilizado).toBe(0)
    expect(classifUnidadeIncompativel.emissaoFossilKgCo2e).toBe(0)
    expect(classifUnidadeIncompativel.emissaoFossilTco2e).toBe(0)
    expect(classifUnidadeIncompativel.fonteFator).toContain('Não calculado')
    expect(classifUnidadeIncompativel.motivoTier).toContain('unidade ausente ou desconhecida')

    // NCM com unidade ausente (vazia/null)
    const classifSemUnidade = classificarItemCompradoNCM({
      descricao: 'Barra de Aço Sem Unidade no XML',
      ncm: '72101100',
      unidadeDeclarada: '',
      quantidadeFisica: 100,
      valorBrl: 3000,
    })

    expect(classifSemUnidade.naoCalculado).toBe(true)
    expect(classifSemUnidade.emissaoFossilTco2e).toBe(0)
  })

  it('(7) ponta a ponta: NF-e com itens em tonelada, grama, kg e unidade desconhecida no motor de emissões', () => {
    const xmlNfe = `
      <NFe>
        <infNFe Id="NFe35240112345678000190550010000009991000009999">
          <ide><mod>55</mod><serie>1</serie><nNF>9999</nNF><dhEmi>2024-05-10T10:00:00-03:00</dhEmi></ide>
          <emit><CNPJ>12345678000190</CNPJ><xNome>Fornecedor de Metais e Polimeros</xNome></emit>
          <dest><CNPJ>98765432000110</CNPJ><xNome>Comprador Piloto ACP</xNome></dest>
          <total><ICMSTot><vNF>80000.00</vNF></ICMSTot></total>
          <!-- Item 1: 2 toneladas de Aço (NCM 7210 -> Metais 2.45 kgCO2e/kg) -> 2000 kg * 2.45 = 4900 kg = 4.9 tCO2e -->
          <det nItem="1">
            <prod>
              <cProd>ACO-TON-01</cProd>
              <xProd>Aço Carbono Bobinado em Tonelada</xProd>
              <NCM>72101100</NCM>
              <uCom>t</uCom>
              <qCom>2</qCom>
              <vUnCom>15000.00</vUnCom>
              <vProd>30000.00</vProd>
            </prod>
          </det>
          <!-- Item 2: 500.000 gramas de Polímero (NCM 3901 -> Polímeros 1.95 kgCO2e/kg) -> 500 kg * 1.95 = 975 kg = 0.975 tCO2e -->
          <det nItem="2">
            <prod>
              <cProd>POLI-G-02</cProd>
              <xProd>Resina Virgem PEBD em Gramas</xProd>
              <NCM>39011010</NCM>
              <uCom>g</uCom>
              <qCom>500000</qCom>
              <vUnCom>0.04</vUnCom>
              <vProd>20000.00</vProd>
            </prod>
          </det>
          <!-- Item 3: 1.000 kg de Aço (normal, sem alteração) -> 1000 kg * 2.45 = 2450 kg = 2.45 tCO2e -->
          <det nItem="3">
            <prod>
              <cProd>ACO-KG-03</cProd>
              <xProd>Perfil de Aço Normal em Quilogramas</xProd>
              <NCM>72101100</NCM>
              <uCom>KG</uCom>
              <qCom>1000</qCom>
              <vUnCom>10.00</vUnCom>
              <vProd>10000.00</vProd>
            </prod>
          </det>
          <!-- Item 4: 50 Peças (UN) sem unidade de massa -> NÃO CALCULADO (zero) -->
          <det nItem="4">
            <prod>
              <cProd>ACO-UN-04</cProd>
              <xProd>Chapa Acabada em Peça sem Peso Declarado</xProd>
              <NCM>72101100</NCM>
              <uCom>UN</uCom>
              <qCom>50</qCom>
              <vUnCom>400.00</vUnCom>
              <vProd>20000.00</vProd>
            </prod>
          </det>
        </infNFe>
      </NFe>
    `

    const doc = processarDocumentoFiscal(xmlNfe, 'nfe_unidades.xml')
    expect(doc.itens.length).toBe(4)

    // Verifica itens no nível do documento processado
    expect(doc.itens[0].unidade).toBe('t')
    expect(doc.itens[0].quantidade).toBe(2)
    expect(doc.itens[0].naoCalculado).toBeFalsy()
    expect(doc.itens[0].memoriaConversaoTexto).toContain('2 t × 1.000 = 2.000 kg')

    expect(doc.itens[1].unidade).toBe('g')
    expect(doc.itens[1].quantidade).toBe(500000)
    expect(doc.itens[1].naoCalculado).toBeFalsy()
    expect(doc.itens[1].memoriaConversaoTexto).toContain('500000 g ÷ 1.000 = 500 kg')

    expect(doc.itens[2].unidade).toBe('KG')
    expect(doc.itens[2].quantidade).toBe(1000)
    expect(doc.itens[2].naoCalculado).toBeFalsy()
    expect(doc.itens[2].memoriaConversaoTexto).toContain('sem conversão necessária')

    expect(doc.itens[3].unidade).toBe('UN')
    expect(doc.itens[3].quantidade).toBe(50)
    expect(doc.itens[3].naoCalculado).toBe(true)

    // Apuração no Motor de Emissões
    const inventario = calcularInventarioEmissoes([doc], {
      empresaNome: 'Comprador Piloto ACP',
      cnpj: '98.765.432/0001-10',
    })

    // Emissão total esperada:
    // Item 1: 4.900 tCO2e
    // Item 2: 0.975 tCO2e
    // Item 3: 2.450 tCO2e
    // Item 4: 0.000 tCO2e (não calculado)
    // Total = 4.900 + 0.975 + 2.450 = 8.325 tCO2e
    expect(inventario.escopo3TotalTCO2e).toBeCloseTo(8.325, 3)
    expect(inventario.emissoesTotaisFosseisTCO2e).toBeCloseTo(8.325, 3)

    // Verifica memórias de cálculo no laudo de itens apurados
    const itensApurados = inventario.itensDetalhados
    expect(itensApurados.length).toBe(4)

    const item1 = itensApurados[0]
    expect(item1.quantidade).toBe(2000) // Convertido para kg no motor
    expect(item1.unidade).toBe('kg')
    expect(item1.fossilTCO2e).toBeCloseTo(4.9, 3)
    expect(item1.memoriaConversao?.operacao).toBe('multiplicacao')
    expect(item1.memoriaConversao?.quantidadeConvertidaKg).toBe(2000)
    expect(item1.memoriaCalculoTexto).toContain('2 t × 1.000 = 2.000 kg')

    const item2 = itensApurados[1]
    expect(item2.quantidade).toBe(500)
    expect(item2.unidade).toBe('kg')
    expect(item2.fossilTCO2e).toBeCloseTo(0.975, 3)
    expect(item2.memoriaConversao?.operacao).toBe('divisao')
    expect(item2.memoriaCalculoTexto).toContain('500000 g ÷ 1.000 = 500 kg')

    const item3 = itensApurados[2]
    expect(item3.quantidade).toBe(1000)
    expect(item3.unidade).toBe('kg')
    expect(item3.fossilTCO2e).toBeCloseTo(2.45, 3)
    expect(item3.memoriaConversao?.operacao).toBe('identidade')

    const item4 = itensApurados[3]
    expect(item4.naoCalculado).toBe(true)
    expect(item4.fossilTCO2e).toBe(0)
    expect(item4.memoriaConversao?.sucesso).toBe(false)
  })
})
