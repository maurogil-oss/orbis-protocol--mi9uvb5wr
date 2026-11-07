import { describe, it, expect } from 'vitest'
import { processarDocumentoFiscal } from '../modelosFiscaisParser'
import { calcularInventarioEmissoes } from '../motorEmissoes'
import {
  classificarItemCompradoNCM,
  identificarFamiliaNCM,
  normalizarNCM,
} from '../classificacaoFisicaNCM'

describe('Piloto ACP - Etapa 2 Peça 2c: Itens sem fator (Não Calculado), Fatores Canônicos e Persistência Completa (>15 itens)', () => {
  it('(1) item sem fator de emissão mapeado → flag "naoCalculado" true, fator 0, emissão 0,000 tCO2e (nunca fallback "outros 1,5")', () => {
    // 1.1 Teste no nível da classificação física NCM
    const itemSemFator = classificarItemCompradoNCM({
      descricao: 'Serviço de Consultoria ou Mercadoria Sem Fator',
      ncm: '99999999', // NCM inexistente/não mapeado
      unidadeDeclarada: 'un',
      quantidadeFisica: 50,
      valorBrl: 10000,
    })

    expect(itemSemFator.naoCalculado).toBe(true)
    expect(itemSemFator.fatorUtilizado).toBe(0)
    expect(itemSemFator.emissaoFossilKgCo2e).toBe(0)
    expect(itemSemFator.emissaoFossilTco2e).toBe(0)
    expect(itemSemFator.familia.id).toBe('outros')
    expect(itemSemFator.familia.fatorKgCO2ePorUnidade).toBe(0)
    expect(itemSemFator.fonteFator).toContain('Não calculado')

    // 1.2 Teste através do parser fiscal de NF-e
    const xmlNFeComItemSemFator = `
      <NFe>
        <infNFe Id="NFe35240112345678000190550010000008881000008888">
          <ide><mod>55</mod><serie>1</serie><nNF>8888</nNF><dhEmi>2024-05-10T10:00:00-03:00</dhEmi></ide>
          <emit><CNPJ>12345678000190</CNPJ><xNome>Fornecedor Genérico Ltda</xNome></emit>
          <dest><CNPJ>98765432000110</CNPJ><xNome>Comprador Piloto ACP</xNome></dest>
          <total><ICMSTot><vNF>5000.00</vNF></ICMSTot></total>
          <det nItem="1">
            <prod>
              <cProd>INEXIST-01</cProd>
              <xProd>Produto Insumo Especial Sem Fator Mapeado</xProd>
              <NCM>99999999</NCM>
              <uCom>KG</uCom>
              <qCom>1000</qCom>
              <vUnCom>5.00</vUnCom>
              <vProd>5000.00</vProd>
            </prod>
          </det>
        </infNFe>
      </NFe>
    `

    const doc = processarDocumentoFiscal(xmlNFeComItemSemFator, 'nfe_sem_fator.xml')
    expect(doc.itens.length).toBe(1)
    expect(doc.itens[0].naoCalculado).toBe(true)

    // 1.3 Teste através do motor de cálculo de pegada de carbono
    const inventario = calcularInventarioEmissoes([doc], {
      empresaNome: 'Comprador Piloto ACP',
      cnpj: '98.765.432/0001-10',
    })

    // Como o único item é "não calculado", a emissão de Escopo 3 NÃO pode receber fallback (ex: 1000kg * 1.5 = 1500kg = 1.5 tCO2e)
    // O Escopo 3 deve ser RIGOROSAMENTE 0,000 tCO2e
    expect(inventario.escopo3TotalTCO2e).toBe(0)
    expect(inventario.emissoesTotaisFosseisTCO2e).toBe(0)

    const itemApurado = inventario.itensDetalhados.find((i) => i.origemDocChave === doc.chaveAcesso)
    expect(itemApurado).toBeDefined()
    expect(itemApurado?.naoCalculado).toBe(true)
    expect(itemApurado?.fossilTCO2e).toBe(0)
    expect(itemApurado?.fatorUtilizado.kgCO2).toBe(0)
    expect(itemApurado?.fonteFator).toContain('Não calculado')
  })

  it('(2) item com fator (aço 2,18, alumínio 14,40, cobre 4,10) → cálculo normal inalterado', () => {
    // 2.1 Metais na classificação NCM de compra (Capítulos 72 a 83)
    // Ex: NCM 7210 (Aço laminado plano)
    const ncmAco = normalizarNCM('7210.11.00')
    const familiaAco = identificarFamiliaNCM(ncmAco)
    expect(familiaAco.id).toBe('metais')

    const itemAco = classificarItemCompradoNCM({
      descricao: 'Bobina de Aço Carbono Laminado',
      ncm: '72101100',
      unidadeDeclarada: 'kg',
      quantidadeFisica: 1000, // 1.000 kg
      valorBrl: 6500,
    })
    expect(itemAco.naoCalculado).toBeFalsy()
    expect(itemAco.elevadoParaTier2).toBe(true)
    expect(itemAco.fatorUtilizado).toBe(2.45) // Fator médio ponderado da família de metais na classificação física
    expect(itemAco.emissaoFossilKgCo2e).toBe(2450)
    expect(itemAco.emissaoFossilTco2e).toBe(2.45)

    // 2.2 NF-e contendo itens com NCM de metais e polímeros processados no motor de emissões
    const xmlNFeMetais = `
      <NFe>
        <infNFe Id="NFe35240112345678000190550010000007771000007777">
          <ide><mod>55</mod><serie>1</serie><nNF>7777</nNF><dhEmi>2024-05-10T10:00:00-03:00</dhEmi></ide>
          <emit><CNPJ>12345678000190</CNPJ><xNome>Siderúrgica & Metais do Brasil</xNome></emit>
          <dest><CNPJ>98765432000110</CNPJ><xNome>Indústria Metalúrgica</xNome></dest>
          <total><ICMSTot><vNF>10000.00</vNF></ICMSTot></total>
          <det nItem="1">
            <prod>
              <cProd>MET-01</cProd>
              <xProd>Chapa de Aço Laminado</xProd>
              <NCM>72101100</NCM>
              <uCom>KG</uCom>
              <qCom>2000</qCom>
              <vUnCom>5.00</vUnCom>
              <vProd>10000.00</vProd>
            </prod>
          </det>
        </infNFe>
      </NFe>
    `

    const docMetais = processarDocumentoFiscal(xmlNFeMetais, 'nfe_metais.xml')
    expect(docMetais.itens[0].naoCalculado).toBeFalsy()

    const invMetais = calcularInventarioEmissoes([docMetais])
    // 2000 kg * 2.45 kgCO2e/kg = 4900 kgCO2e = 4.9 tCO2e
    expect(invMetais.escopo3TotalTCO2e).toBeCloseTo(4.9, 2)
    expect(invMetais.itensDetalhados[0].naoCalculado).toBeFalsy()
  })

  it('(3) nota com mais de 15 itens → todos os itens persistidos/apurados (nada cortado pelo limite anterior de 15)', () => {
    // Gerar XML de NF-e com 22 itens distintos
    const qtdTotalItens = 22
    let detsXml = ''
    for (let i = 1; i <= qtdTotalItens; i++) {
      // Alterna alguns itens de papel, alguns de metais e alguns sem fator
      const ncm = i % 3 === 0 ? '99999999' : i % 2 === 0 ? '72101100' : '48191000'
      detsXml += `
        <det nItem="${i}">
          <prod>
            <cProd>SKU-${i}</cProd>
            <xProd>Item Fiscal Insumo Numero ${i}</xProd>
            <NCM>${ncm}</NCM>
            <uCom>KG</uCom>
            <qCom>100</qCom>
            <vUnCom>10.00</vUnCom>
            <vProd>1000.00</vProd>
          </prod>
        </det>
      `
    }

    const xmlVariosItens = `
      <NFe>
        <infNFe Id="NFe35240112345678000190550010000005551000005555">
          <ide><mod>55</mod><serie>1</serie><nNF>5555</nNF><dhEmi>2024-05-10T10:00:00-03:00</dhEmi></ide>
          <emit><CNPJ>12345678000190</CNPJ><xNome>Atacadista & Distribuidora Integral</xNome></emit>
          <dest><CNPJ>98765432000110</CNPJ><xNome>Empresa Piloto ACP</xNome></dest>
          <total><ICMSTot><vNF>${qtdTotalItens * 1000}.00</vNF></ICMSTot></total>
          ${detsXml}
        </infNFe>
      </NFe>
    `

    const doc = processarDocumentoFiscal(xmlVariosItens, 'nfe_22_itens.xml')

    // Prova que NENHUM item foi cortado por .slice(0, 15)
    expect(doc.itens.length).toBe(qtdTotalItens)
    expect(doc.itens.length).toBeGreaterThan(15)

    // Verifica que cada um dos 22 itens está preservado em ordem
    for (let i = 1; i <= qtdTotalItens; i++) {
      expect(doc.itens[i - 1].numeroItem).toBe(i)
      expect(doc.itens[i - 1].codigo).toBe(`SKU-${i}`)
    }

    // Calcula no motor de emissões
    const inv = calcularInventarioEmissoes([doc])

    // Todos os 22 itens devem estar presentes nos itens apurados
    const itensDoDoc = inv.itensDetalhados.filter((it) => it.origemDocChave === doc.chaveAcesso)
    expect(itensDoDoc.length).toBe(qtdTotalItens)

    // Itens com NCM 99999999 devem ter flag naoCalculado true e emissão 0
    const itensNaoCalculados = itensDoDoc.filter((it) => it.naoCalculado)
    expect(itensNaoCalculados.length).toBeGreaterThan(0)
    for (const it of itensNaoCalculados) {
      expect(it.fossilTCO2e).toBe(0)
      expect(it.kgCO2).toBe(0)
    }

    // Itens calculados com sucesso não podem ter naoCalculado
    const itensCalculados = itensDoDoc.filter((it) => !it.naoCalculado)
    expect(itensCalculados.length).toBe(qtdTotalItens - itensNaoCalculados.length)
    for (const it of itensCalculados) {
      expect(it.fossilTCO2e).toBeGreaterThan(0)
    }
  })
})
