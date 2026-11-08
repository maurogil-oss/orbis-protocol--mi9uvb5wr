import { describe, it, expect } from 'vitest'
import { parseNFeXML } from '../nfeParser'
import { processarDocumentoFiscal } from '../modelosFiscaisParser'
import { calcularInventarioEmissoes } from '../motorEmissoes'

/**
 * Suíte de Testes Consolidados — Piloto ACP Etapa 7
 * Cobre ponta a ponta:
 * 1. Parser de NF-e
 * 2. Conversão explícita de unidades (tonelada, grama, kg, unidade divergente/incompatível)
 * 3. Cálculo da pegada de emissões
 * 4. Nota cancelada (evento e protocolo cStat 101)
 * 5. Itens de devolução (CFOPs 1.2xx, 5.2xx, etc.)
 * 6. Itens com e sem fator de emissão (marcação explícita "não calculado" e zero emissões)
 */
describe('Piloto ACP - Etapa 7: Verificação Consolidada de Parser, Conversão e Cálculo', () => {
  // Fixture: NF-e com 4 itens demonstrando todos os cenários da especificação
  // Item 1: Aço em Tonelada (uCom = t, 2.5 t -> 2.500 kg, fator aço worldsteel 2.18 / NCM 7210 2.45)
  // Item 2: Alumínio em Gramas (uCom = g, 500.000 g -> 500 kg, fator NCM 7601 11.20)
  // Item 3: Item em Unidade Divergente/Incompatível com massa (uCom = UN ou CX, sem conversão mássica -> não calculado)
  // Item 4: Item sem fator mapeado (NCM 99999999 -> não calculado)
  const xmlNfeMulticasos = `<?xml version="1.0" encoding="UTF-8"?>
<nfeProc xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">
  <NFe>
    <infNFe Id="NFe35240112345678000190550010000007771000007777" versao="4.00">
      <ide>
        <mod>55</mod>
        <serie>1</serie>
        <nNF>7777</nNF>
        <natOp>Venda e Remessa</natOp>
        <dhEmi>2026-03-20T10:00:00-03:00</dhEmi>
      </ide>
      <emit>
        <CNPJ>12345678000190</CNPJ>
        <xNome>Fornecedor Multimateriais ACP Ltda</xNome>
      </emit>
      <dest>
        <CNPJ>98765432000198</CNPJ>
        <xNome>Comprador Piloto ACP S.A.</xNome>
      </dest>
      <!-- Item 1: 2.5 toneladas de Aço laminado -->
      <det nItem="1">
        <prod>
          <cProd>ACO-TON</cProd>
          <xProd>Chapa de Aco Carbono em Tonelada</xProd>
          <NCM>72101100</NCM>
          <CFOP>5102</CFOP>
          <uCom>t</uCom>
          <qCom>2.5</qCom>
          <vUnCom>12000.00</vUnCom>
          <vProd>30000.00</vProd>
        </prod>
      </det>
      <!-- Item 2: 500.000 gramas de Alumínio primário -->
      <det nItem="2">
        <prod>
          <cProd>ALU-GR</cProd>
          <xProd>Lingote de Aluminio Primario em Gramas</xProd>
          <NCM>76011000</NCM>
          <CFOP>5102</CFOP>
          <uCom>g</uCom>
          <qCom>500000</qCom>
          <vUnCom>0.03</vUnCom>
          <vProd>15000.00</vProd>
        </prod>
      </det>
      <!-- Item 3: Unidade divergente/incompatível com base mássica (UN/CX) -->
      <det nItem="3">
        <prod>
          <cProd>PEC-UN</cProd>
          <xProd>Gabinete Mecanico Montado Unidade</xProd>
          <NCM>72101100</NCM>
          <CFOP>5102</CFOP>
          <uCom>UN</uCom>
          <qCom>100</qCom>
          <vUnCom>80.00</vUnCom>
          <vProd>8000.00</vProd>
        </prod>
      </det>
      <!-- Item 4: Item sem fator cadastrado / NCM não mapeado -->
      <det nItem="4">
        <prod>
          <cProd>DIV-SEM-FATOR</cProd>
          <xProd>Servico Insumo Avulso Sem Fator</xProd>
          <NCM>99999999</NCM>
          <CFOP>5102</CFOP>
          <uCom>KG</uCom>
          <qCom>200</qCom>
          <vUnCom>15.00</vUnCom>
          <vProd>3000.00</vProd>
        </prod>
      </det>
      <total>
        <ICMSTot>
          <vProd>56000.00</vProd>
          <vNF>56000.00</vNF>
        </ICMSTot>
      </total>
    </infNFe>
  </NFe>
  <protNFe versao="4.00">
    <infProt>
      <cStat>100</cStat>
      <xMotivo>Autorizado o uso da NF-e</xMotivo>
      <dhRecbto>2026-03-20T10:02:00-03:00</dhRecbto>
      <nProt>135260001234567</nProt>
    </infProt>
  </protNFe>
</nfeProc>`

  it('1. parseNFeXML extrai todas as unidades (t, g, UN, KG) e valores sem corromper campos fiscais', () => {
    const parsed = parseNFeXML(xmlNfeMulticasos, 'nfe_multicasos.xml')
    expect(parsed.itens.length).toBe(4)
    expect(parsed.chaveAcesso).toBe('35240112345678000190550010000007771000007777')
    expect(parsed.itens[0].unidade).toBe('t')
    expect(parsed.itens[0].quantidade).toBe(2.5)
    expect(parsed.itens[1].unidade).toBe('g')
    expect(parsed.itens[1].quantidade).toBe(500000)
    expect(parsed.itens[2].unidade).toBe('UN')
    expect(parsed.itens[2].quantidade).toBe(100)
    expect(parsed.itens[3].unidade).toBe('KG')
    expect(parsed.itens[3].quantidade).toBe(200)
  })

  it('2. Conversão explícita de unidades: tonelada (x1000), grama (/1000) e recusa fundamentada de UN', () => {
    const doc = processarDocumentoFiscal(xmlNfeMulticasos, 'nfe_multicasos.xml')
    expect(doc.itens.length).toBe(4)

    // Item 1: Tonelada -> convertida com memória explícita
    const itemTon = doc.itens[0]
    expect(itemTon.unidade).toBe('t')
    expect(itemTon.quantidade).toBe(2.5)
    expect(itemTon.memoriaConversaoTexto).toContain('2.5 t × 1.000 = 2.500 kg')
    expect(itemTon.naoCalculado).toBeFalsy()

    // Item 2: Gramas -> dividida por 1000
    const itemGr = doc.itens[1]
    expect(itemGr.unidade).toBe('g')
    expect(itemGr.quantidade).toBe(500000)
    expect(itemGr.memoriaConversaoTexto).toContain('500000 g ÷ 1.000 = 500 kg')
    expect(itemGr.naoCalculado).toBeFalsy()

    // Item 3: UN -> Unidade divergente/incompatível com base mássica -> não calculado
    const itemUnDivergente = doc.itens[2]
    expect(itemUnDivergente.unidade).toBe('UN')
    expect(itemUnDivergente.naoCalculado).toBe(true)

    // Item 4: NCM inexistente -> não calculado
    const itemSemFator = doc.itens[3]
    expect(itemSemFator.naoCalculado).toBe(true)
  })

  it('3. Cálculo da pegada de carbono: apenas itens válidos somam, itens não calculados têm emissão estritamente 0', () => {
    const doc = processarDocumentoFiscal(xmlNfeMulticasos, 'nfe_multicasos.xml')
    const inventario = calcularInventarioEmissoes([doc], {
      empresaNome: 'Comprador Piloto ACP S.A.',
      cnpj: '98.765.432/0001-98',
    })

    // Apuração dos itens
    const itensApurados = inventario.itensDetalhados
    expect(itensApurados.length).toBe(4)

    // Item 1 (Aço 2.500 kg x 2.45 NCM 7210) = 6.125 tCO2e
    const apuradoTon = itensApurados[0]
    expect(apuradoTon.quantidade).toBe(2500)
    expect(apuradoTon.unidade).toBe('kg')
    expect(apuradoTon.fossilTCO2e).toBeCloseTo(6.125, 3)

    // Item 2 (Alumínio 500 kg x 11.20 NCM 7601) = 5.600 tCO2e
    const apuradoGr = itensApurados[1]
    expect(apuradoGr.quantidade).toBe(500)
    expect(apuradoGr.unidade).toBe('kg')
    expect(apuradoGr.fossilTCO2e).toBeCloseTo(5.6, 2)

    // Item 3 (Unidade divergente UN) -> emissão rigorosamente ZERO
    const apuradoUn = itensApurados[2]
    expect(apuradoUn.naoCalculado).toBe(true)
    expect(apuradoUn.fossilTCO2e).toBe(0)
    expect(apuradoUn.kgCO2).toBe(0)

    // Item 4 (Sem fator NCM 99999999) -> emissão rigorosamente ZERO (sem fallback arbitrário)
    const apuradoSemFator = itensApurados[3]
    expect(apuradoSemFator.naoCalculado).toBe(true)
    expect(apuradoSemFator.fossilTCO2e).toBe(0)
    expect(apuradoSemFator.kgCO2).toBe(0)

    // Total = 6.125 + 5.600 + 0 + 0 = 11.725 tCO2e
    expect(inventario.escopo3TotalTCO2e).toBeCloseTo(11.725, 3)
  })

  it('4. Recusa e bloqueio estrito de NF-e cancelada na SEFAZ (com evento de cancelamento ou cStat 101)', () => {
    const xmlCancelada = `<?xml version="1.0" encoding="UTF-8"?>
<nfeProc xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">
  <NFe>
    <infNFe Id="NFe35240112345678000190550010000009991000009999" versao="4.00">
      <ide><mod>55</mod><serie>1</serie><nNF>999</nNF></ide>
      <emit><CNPJ>12345678000190</CNPJ></emit>
      <dest><CNPJ>98765432000198</CNPJ></dest>
      <det nItem="1">
        <prod>
          <cProd>P1</cProd>
          <xProd>Produto Cancelado</xProd>
          <NCM>72101100</NCM>
          <CFOP>5102</CFOP>
          <uCom>KG</uCom>
          <qCom>1000</qCom>
          <vProd>5000.00</vProd>
        </prod>
      </det>
      <total><ICMSTot><vNF>5000.00</vNF></ICMSTot></total>
    </infNFe>
  </NFe>
  <protNFe versao="4.00">
    <infProt>
      <cStat>101</cStat>
      <xMotivo>Cancelamento de NF-e homologado</xMotivo>
      <nProt>135240008888888</nProt>
    </infProt>
  </protNFe>
</nfeProc>`

    // Deve lançar exceção clara informando recusa por cancelamento SEFAZ
    expect(() => parseNFeXML(xmlCancelada)).toThrow(/NF-e cancelada na SEFAZ/i)
    expect(() => processarDocumentoFiscal(xmlCancelada)).toThrow(/NF-e cancelada na SEFAZ/i)
  })

  it('5. Exclusão estrita de itens com CFOP de devolução (1.2xx, 5.2xx, 1.4xx, 5.4xx) sem somar na pegada', () => {
    const xmlComDevolucao = `<?xml version="1.0" encoding="UTF-8"?>
<nfeProc xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">
  <NFe>
    <infNFe Id="NFe35240112345678000190550010000003331000003333" versao="4.00">
      <ide><mod>55</mod><serie>1</serie><nNF>333</nNF><dhEmi>2026-03-20T10:00:00-03:00</dhEmi></ide>
      <emit><CNPJ>12345678000190</CNPJ></emit>
      <dest><CNPJ>98765432000198</CNPJ></dest>
      <!-- Item normal de venda CFOP 5102: 1.000 kg aço -->
      <det nItem="1">
        <prod>
          <cProd>ACO-OK</cProd>
          <xProd>Aco Normal de Venda</xProd>
          <NCM>72081000</NCM>
          <CFOP>5102</CFOP>
          <uCom>KG</uCom>
          <qCom>1000</qCom>
          <vProd>10000.00</vProd>
        </prod>
      </det>
      <!-- Item devolvido CFOP 1201: 5.000 kg alumínio -> NÃO PODE SOMAR -->
      <det nItem="2">
        <prod>
          <cProd>ALU-DEV</cProd>
          <xProd>Devolucao de Compra Aluminio</xProd>
          <NCM>76011000</NCM>
          <CFOP>1201</CFOP>
          <uCom>KG</uCom>
          <qCom>5000</qCom>
          <vProd>50000.00</vProd>
        </prod>
      </det>
      <total><ICMSTot><vNF>60000.00</vNF></ICMSTot></total>
    </infNFe>
  </NFe>
  <protNFe versao="4.00">
    <infProt><cStat>100</cStat><xMotivo>Autorizado o uso da NF-e</xMotivo></infProt>
  </protNFe>
</nfeProc>`

    const doc = processarDocumentoFiscal(xmlComDevolucao)
    expect(doc.qtdItensDevolucaoExcluidos).toBe(1)
    expect(doc.valorDevolucaoExcluido).toBe(50000.0)

    const itemDevolvido = doc.itens.find((i) => i.codigo === 'ALU-DEV')
    expect(itemDevolvido?.isDevolucao).toBe(true)

    // Motor de cálculo: apenas o item normal soma (1000 kg de aço x 2.18 worldsteel = 2.18 tCO2e)
    const inv = calcularInventarioEmissoes([doc])
    expect(inv.escopo3TotalTCO2e).toBeCloseTo(2.18, 2)
  })
})
