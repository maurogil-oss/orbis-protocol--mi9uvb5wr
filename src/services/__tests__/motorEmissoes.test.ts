import { describe, it, expect } from 'vitest'
import { processarDocumentoFiscal } from '../modelosFiscaisParser'
import { calcularInventarioEmissoes } from '../motorEmissoes'

describe('Motor Pericial de Emissões & Modelos Fiscais', () => {
  it('deve processar XML de NF-e com combustível e calcular Escopo 1 fóssil e biogênico', () => {
    const xmlNFeDiesel = `
      <NFe>
        <infNFe Id="NFe35240112345678000190550010000001231000001234">
          <ide>
            <mod>55</mod>
            <serie>1</serie>
            <nNF>1234</nNF>
            <dhEmi>2024-05-10T10:00:00-03:00</dhEmi>
          </ide>
          <emit>
            <CNPJ>12345678000190</CNPJ>
            <xNome>Posto de Combustíveis Rota Verde</xNome>
          </emit>
          <dest>
            <CNPJ>98765432000110</CNPJ>
            <xNome>Transportadora e Logística Exemplo Ltda</xNome>
          </dest>
          <total>
            <ICMSTot>
              <vNF>6500.00</vNF>
              <vICMS>1105.00</vICMS>
              <vPIS>107.25</vPIS>
              <vCOFINS>494.00</vCOFINS>
            </ICMSTot>
          </total>
          <det nItem="1">
            <prod>
              <cProd>001</cProd>
              <xProd>Oleo Diesel S10 B14 Rodoviario</xProd>
              <NCM>27101921</NCM>
              <uCom>LT</uCom>
              <qCom>1000</qCom>
              <vUnCom>6.50</vUnCom>
              <vProd>6500.00</vProd>
            </prod>
          </det>
        </infNFe>
      </NFe>
    `

    const doc = processarDocumentoFiscal(xmlNFeDiesel, 'nfe_diesel.xml')
    expect(doc.modeloFiscal).toBe('55_nfe')
    expect(doc.combustivelTipo).toBe('diesel')
    expect(doc.combustivelLitros).toBe(1000)

    const inventario = calcularInventarioEmissoes([doc], {
      empresaNome: 'Transportadora Exemplo',
      cnpj: '98.765.432/0001-10',
    })

    expect(inventario.escopo1TotalTCO2e).toBeGreaterThan(2.0)
    expect(inventario.emissoesBiogenicasTotalTCO2e).toBeGreaterThan(0.3)
    expect(inventario.enquadramentoSBCE.status).toBe('isento_monitoramento')
  })

  it('deve processar NF3e de energia elétrica e aplicar duplo reporte de Escopo 2', () => {
    const xmlNF3e = `
      <NF3e>
        <infNF3e Id="NF3e35240112345678000190660010000001231000001234">
          <ide>
            <mod>66</mod>
            <nNF>9876</nNF>
            <dhEmi>2024-05-15T00:00:00-03:00</dhEmi>
          </ide>
          <emit>
            <CNPJ>11222333000144</CNPJ>
            <xNome>Companhia Paranaense de Energia Copel</xNome>
          </emit>
          <dest>
            <CNPJ>98765432000110</CNPJ>
            <xNome>Fabrica Metalurgica Exemplo</xNome>
          </dest>
          <total>
            <vNF>15000.00</vNF>
          </total>
          <det nItem="1">
            <prod>
              <xProd>Consumo Ativo kWh Industrial</xProd>
              <uCom>kWh</uCom>
              <qCom>25000</qCom>
              <vProd>15000.00</vProd>
            </prod>
          </det>
        </infNF3e>
      </NF3e>
    `

    const doc = processarDocumentoFiscal(xmlNF3e, 'energia_copel.xml')
    expect(doc.modeloFiscal).toBe('66_nf3e')
    expect(doc.energiaKwh).toBe(25000)

    // Sem I-REC: Escopo 2 Mercado usa fator Localização
    const invSemIrec = calcularInventarioEmissoes([doc], { possuiIREC: false })
    expect(invSemIrec.escopo2LocalizacaoTCO2e).toBeGreaterThan(1.0)
    expect(invSemIrec.escopo2MercadoTCO2e).toBe(invSemIrec.escopo2LocalizacaoTCO2e)

    // Com I-REC: Escopo 2 Mercado zera
    const invComIrec = calcularInventarioEmissoes([doc], { possuiIREC: true })
    expect(invComIrec.escopo2MercadoTCO2e).toBe(0)
  })

  it('deve aplicar Insetting ISO 14067 para peças reutilizadas em CDVs', () => {
    const xmlNFePecasCDV = `
      <NFe>
        <infNFe Id="NFe35240112345678000190550010000009991000001234">
          <ide><mod>55</mod><nNF>999</nNF></ide>
          <emit><CNPJ>12345678000190</CNPJ><xNome>CDV Auto Pecas Verdes Credenciado</xNome></emit>
          <dest><CNPJ>98765432000110</CNPJ><xNome>Oficina Mecanica</xNome></dest>
          <total><ICMSTot><vNF>2400.00</vNF></ICMSTot></total>
          <det nItem="1">
            <prod>
              <cProd>CDV-01</cProd>
              <xProd>Porta Dianteira Usada e Reutilizada CDV DETRAN</xProd>
              <qCom>10</qCom>
              <vProd>2400.00</vProd>
            </prod>
          </det>
        </infNFe>
      </NFe>
    `

    const doc = processarDocumentoFiscal(xmlNFePecasCDV)
    expect(doc.pecasReutilizadasQtd).toBe(10)

    const inv = calcularInventarioEmissoes([doc])
    expect(inv.insettingTotalTCO2e).toBeGreaterThan(0.2) // ~0.245 tCO2e evitados
  })
})
