import { describe, it, expect } from 'vitest'
import { parseNFeXML, agregarCreditosNFe, AVISO_FASE_TESTE_IBS_CBS } from '../nfeParser'
import { classificarNCM, analisarItensImpostoSeletivo } from '../impostoSeletivo'
import { calcularComparativoTributario } from '../tributosReforma'

describe('Bloco 2 & 3: Parser NF-e com IBS/CBS e Classificação de Imposto Seletivo por NCM', () => {
  // Fixture: XML de NF-e pós-01/08/2026 com grupos <IBSCBS> (IBS 0,1% e CBS 0,9%) e item com NCM sujeito ao Imposto Seletivo
  const xmlComIbsCbsEImpostoSeletivo = `
    <NFe xmlns="http://www.portalfiscal.inf.br/nfe">
      <infNFe Id="NFe35260812345678000190550010000008881000001234" versao="4.00">
        <ide>
          <cUF>35</cUF>
          <cNF>00001234</cNF>
          <natOp>Venda de Mercadorias e Produtos</natOp>
          <mod>55</mod>
          <serie>1</serie>
          <nNF>888</nNF>
          <dhEmi>2026-08-15T10:30:00-03:00</dhEmi>
          <tpNF>1</tpNF>
        </ide>
        <emit>
          <CNPJ>12345678000190</CNPJ>
          <xNome>Industria e Bebidas Premium S.A.</xNome>
        </emit>
        <dest>
          <CNPJ>98765432000110</CNPJ>
          <xNome>Distribuidora e Logistica Nacional Ltda</xNome>
        </dest>
        <total>
          <ICMSTot>
            <vProd>100000.00</vProd>
            <vNF>100000.00</vNF>
            <vICMS>18000.00</vICMS>
            <vIPI>5000.00</vIPI>
            <vPIS>1650.00</vPIS>
            <vCOFINS>7600.00</vCOFINS>
          </ICMSTot>
          <vIBSTot>100.00</vIBSTot>
          <vCBSTot>900.00</vCBSTot>
        </total>
        <det nItem="1">
          <prod>
            <cProd>BEB-01</cProd>
            <xProd>Cerveja Artesanal Puro Malte 600ml</xProd>
            <NCM>22030000</NCM>
            <CFOP>5101</CFOP>
            <uCom>UN</uCom>
            <qCom>5000</qCom>
            <vUnCom>20.00</vUnCom>
            <vProd>100000.00</vProd>
          </prod>
          <imposto>
            <vICMS>18000.00</vICMS>
            <vIPI>5000.00</vIPI>
            <vPIS>1650.00</vPIS>
            <vCOFINS>7600.00</vCOFINS>
            <IBSCBS>
              <cClassTrib>01.001</cClassTrib>
              <vBCIBS>100000.00</vBCIBS>
              <pIBS>0.10</pIBS>
              <vIBS>100.00</vIBS>
              <vBCCBS>100000.00</vBCCBS>
              <pCBS>0.90</pCBS>
              <vCBS>900.00</vCBS>
            </IBSCBS>
          </imposto>
        </det>
      </infNFe>
    </NFe>
  `

  // Fixture: XML de NF-e tradicional (sem grupos IBS/CBS, anterior a 01/08/2026)
  const xmlSemIbsCbsTradicional = `
    <NFe xmlns="http://www.portalfiscal.inf.br/nfe">
      <infNFe Id="NFe35240112345678000190550010000001231000001234" versao="4.00">
        <ide>
          <cUF>35</cUF>
          <cNF>00009999</cNF>
          <natOp>Venda de Moveis de Escritorio</natOp>
          <mod>55</mod>
          <serie>1</serie>
          <nNF>123</nNF>
          <dhEmi>2024-03-20T14:00:00-03:00</dhEmi>
        </ide>
        <emit>
          <CNPJ>11222333000144</CNPJ>
          <xNome>Moveis Corporativos do Brasil</xNome>
        </emit>
        <dest>
          <CNPJ>98765432000110</CNPJ>
          <xNome>Empresa Cliente Ltda</xNome>
        </dest>
        <total>
          <ICMSTot>
            <vProd>15000.00</vProd>
            <vNF>15000.00</vNF>
            <vICMS>2700.00</vICMS>
            <vIPI>750.00</vIPI>
            <vPIS>247.50</vPIS>
            <vCOFINS>1140.00</vCOFINS>
          </ICMSTot>
        </total>
        <det nItem="1">
          <prod>
            <cProd>MOV-01</cProd>
            <xProd>Mesa Estacao de Trabalho Ergonomica</xProd>
            <NCM>94031000</NCM>
            <CFOP>5101</CFOP>
            <uCom>UN</uCom>
            <qCom>10</qCom>
            <vUnCom>1500.00</vUnCom>
            <vProd>15000.00</vProd>
          </prod>
          <imposto>
            <vICMS>2700.00</vICMS>
            <vIPI>750.00</vIPI>
            <vPIS>247.50</vPIS>
            <vCOFINS>1140.00</vCOFINS>
          </imposto>
        </det>
      </infNFe>
    </NFe>
  `

  it('deve extrair campos IBS/CBS (vBCIBS, vIBS, vCBS, pIBS, pCBS, cClassTrib e totalizadores) quando presentes', () => {
    const dados = parseNFeXML(xmlComIbsCbsEImpostoSeletivo, 'nfe_com_ibscbs.xml')

    expect(dados.chaveAcesso).toBe('35260812345678000190550010000008881000001234')
    expect(dados.numeroNota).toBe('888')
    expect(dados.valorTotalNF).toBe(100000.0)
    expect(dados.temDestaqueIbsCbs).toBe(true)
    expect(dados.valorIbsTotal).toBe(100.0)
    expect(dados.valorCbsTotal).toBe(900.0)
    expect(dados.avisoFaseTesteIbsCbs).toBeUndefined()

    // Verifica item 1
    const item = dados.itens[0]
    expect(item.vBCIBS).toBe(100000.0)
    expect(item.vIBS).toBe(100.0)
    expect(item.pIBS).toBe(0.1)
    expect(item.vBCCBS).toBe(100000.0)
    expect(item.vCBS).toBe(900.0)
    expect(item.pCBS).toBe(0.9)
    expect(item.cClassTrib).toBe('01.001')

    // Verifica classificação do Imposto Seletivo no item (NCM 22030000 = Cerveja / Bebida Alcoólica)
    expect(dados.totalItensSujeitosIS).toBe(1)
    expect(dados.itensSujeitosIS[0].categoria).toBe('Bebidas Alcoólicas')
    expect(item.impostoSeletivo?.sujeito).toBe(true)
    expect(item.impostoSeletivo?.categoria).toBe('Bebidas Alcoólicas')
  })

  it('deve emitir aviso educativo de obrigatoriedade 01/08/2026 para notas sem destaque IBS/CBS', () => {
    const dados = parseNFeXML(xmlSemIbsCbsTradicional, 'nfe_sem_ibscbs.xml')

    expect(dados.chaveAcesso).toBe('35240112345678000190550010000001231000001234')
    expect(dados.temDestaqueIbsCbs).toBe(false)
    expect(dados.valorIbsTotal).toBe(0)
    expect(dados.valorCbsTotal).toBe(0)
    expect(dados.avisoFaseTesteIbsCbs).toBe(AVISO_FASE_TESTE_IBS_CBS)
    expect(dados.totalItensSujeitosIS).toBe(0)

    // Item não sujeito ao Imposto Seletivo (NCM 94031000 = Móveis de metal)
    expect(dados.itens[0].impostoSeletivo).toBeUndefined()
  })

  it('deve agregar corretamente notas com e sem IBS/CBS', () => {
    const n1 = parseNFeXML(xmlComIbsCbsEImpostoSeletivo)
    const n2 = parseNFeXML(xmlSemIbsCbsTradicional)

    const agregacao = agregarCreditosNFe([n1, n2])
    expect(agregacao.totalNotas).toBe(2)
    expect(agregacao.somaValorTotal).toBe(115000.0)
    expect(agregacao.somaIbs).toBe(100.0)
    expect(agregacao.somaCbs).toBe(900.0)
    expect(agregacao.somaIbsCbs).toBe(1000.0)
    expect(agregacao.notasComIbsCbs).toBe(1)
    expect(agregacao.notasSemIbsCbs).toBe(1)
    expect(agregacao.totalItensSujeitosIS).toBe(1)
  })

  it('deve classificar corretamente NCMs de diversas categorias do Imposto Seletivo (LC 214/2025)', () => {
    // 1. Veículo automotor a combustão
    const veiculo = classificarNCM('87032310')
    expect(veiculo.sujeito).toBe(true)
    expect(veiculo.categoria).toContain('Veículos Poluentes')

    // 2. Embarcação de recreio
    const barco = classificarNCM('8903.92.00')
    expect(barco.sujeito).toBe(true)
    expect(barco.categoria).toContain('Veículos Poluentes')

    // 3. Tabaco / Cigarro
    const tabaco = classificarNCM('24022000')
    expect(tabaco.sujeito).toBe(true)
    expect(tabaco.categoria).toContain('Cigarro e Derivados')

    // 4. Bebida açucarada / Refrigerante
    const refri = classificarNCM('2202.10.00')
    expect(refri.sujeito).toBe(true)
    expect(refri.categoria).toContain('Bebidas Açucaradas')

    // 5. Carvão mineral
    const carvao = classificarNCM('27011200')
    expect(carvao.sujeito).toBe(true)
    expect(carvao.categoria).toContain('Carvão Mineral')

    // 6. Minério de ferro / Petróleo bruto
    const minerio = classificarNCM('26011100')
    expect(minerio.sujeito).toBe(true)
    expect(minerio.categoria).toContain('Bens Minerais Extraídos')

    // 7. Não sujeito (ex: hortaliças ou software ou tecido)
    const arroz = classificarNCM('1006.30.21')
    expect(arroz.sujeito).toBe(false)

    // Analisador em lote
    const lote = analisarItensImpostoSeletivo([
      { ncm: '87032310', descricao: 'Carro Sedan 2.0 Gasolina' },
      { ncm: '10063021', descricao: 'Arroz Polido' },
      { ncm: '24022000', descricao: 'Cigarros' },
    ])
    expect(lote.totalItens).toBe(3)
    expect(lote.totalItensSujeitosIS).toBe(2)
    expect(lote.temItemSujeito).toBe(true)
  })

  it('deve refletir NCMs reais no comparativo tributário e preencher o bloco da fase-teste IBS/CBS', () => {
    const compComItensIS = calcularComparativoTributario({
      regime_tributario: 'Lucro Real',
      dadosNFeReais: {
        totalNotas: 1,
        somaValorTotal: 100000,
        somaPisCofins: 9250,
        somaIcms: 18000,
        somaIpi: 5000,
        somaIbs: 100,
        somaCbs: 900,
        notasComIbsCbs: 1,
        notasSemIbsCbs: 0,
        itensOuNCMs: [{ ncm: '22030000', descricao: 'Cerveja Especial' }],
      },
    })

    // Bloco IBS/CBS na Fase-teste
    expect(compComItensIS.faseTesteIbsCbs.possuiDestaqueReal).toBe(true)
    expect(compComItensIS.faseTesteIbsCbs.valorIbsReal).toBe(100)
    expect(compComItensIS.faseTesteIbsCbs.valorCbsReal).toBe(900)

    // Bloco Imposto Seletivo
    expect(compComItensIS.impostoSeletivoAnalise.possuiItensIdentificados).toBe(true)
    expect(compComItensIS.impostoSeletivoAnalise.totalItensIdentificados).toBe(1)

    // Linha IPI -> IS deve conter mensagem personalizada citando o item real
    const linhaIS = compComItensIS.linhas.find((l) => l.tributo.includes('Imposto Seletivo'))
    expect(linhaIS?.detalhePersonalizado).toContain(
      'Sua empresa opera 1 item(ns) potencialmente sujeito(s) ao Imposto Seletivo',
    )
  })
})
