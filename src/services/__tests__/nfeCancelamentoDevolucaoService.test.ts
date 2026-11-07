import { describe, it, expect } from 'vitest'
import {
  detectarCancelamentoXml,
  isCfopDevolucao,
  checarCfopItem,
} from '../nfeCancelamentoDevolucaoService'
import { parseNFeXML } from '../nfeParser'
import { processarDocumentoFiscal } from '../modelosFiscaisParser'
import { calcularInventarioEmissoes } from '../motorEmissoes'

// XML fixture de NF-e normal (válida, chave de 44 dígitos com DV correto: 35240112345678000190550010000001231000001234)
const xmlNFeNormal = `<?xml version="1.0" encoding="UTF-8"?>
<nfeProc xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">
  <NFe>
    <infNFe Id="NFe35240112345678000190550010000001231000001234" versao="4.00">
      <ide>
        <mod>55</mod>
        <serie>1</serie>
        <nNF>123</nNF>
        <natOp>Venda de mercadoria</natOp>
        <dhEmi>2026-03-10T10:00:00-03:00</dhEmi>
      </ide>
      <emit>
        <CNPJ>12345678000190</CNPJ>
        <xNome>Fornecedor de Aco Brasil Ltda</xNome>
      </emit>
      <dest>
        <CNPJ>98765432000198</CNPJ>
        <xNome>Comprador Industria S.A.</xNome>
      </dest>
      <det nItem="1">
        <prod>
          <cProd>ACO01</cProd>
          <xProd>Chapa de Aco Carbono Laminado</xProd>
          <NCM>72081000</NCM>
          <CFOP>5102</CFOP>
          <uCom>KG</uCom>
          <qCom>1000.0000</qCom>
          <vUnCom>10.00</vUnCom>
          <vProd>10000.00</vProd>
        </prod>
        <imposto>
          <ICMS><ICMS00><vICMS>1800.00</vICMS></ICMS00></ICMS>
        </imposto>
      </det>
      <total>
        <ICMSTot>
          <vProd>10000.00</vProd>
          <vNF>10000.00</vNF>
          <vICMS>1800.00</vICMS>
        </ICMSTot>
      </total>
    </infNFe>
  </NFe>
  <protNFe versao="4.00">
    <infProt>
      <cStat>100</cStat>
      <xMotivo>Autorizado o uso da NF-e</xMotivo>
      <dhRecbto>2026-03-10T10:02:00-03:00</dhRecbto>
      <nProt>135240001234567</nProt>
    </infProt>
  </protNFe>
</nfeProc>`

// XML fixture de NF-e com evento de cancelamento (tpEvento 110111 / procEventoNFe)
const xmlNFeCanceladaComEvento = `<?xml version="1.0" encoding="UTF-8"?>
<nfeProc xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">
  <NFe>
    <infNFe Id="NFe35240112345678000190550010000001231000001234" versao="4.00">
      <ide>
        <mod>55</mod>
        <serie>1</serie>
        <nNF>123</nNF>
        <natOp>Venda de mercadoria</natOp>
        <dhEmi>2026-03-10T10:00:00-03:00</dhEmi>
      </ide>
      <emit>
        <CNPJ>12345678000190</CNPJ>
        <xNome>Fornecedor Cancelado Ltda</xNome>
      </emit>
      <dest>
        <CNPJ>98765432000198</CNPJ>
        <xNome>Comprador Industria S.A.</xNome>
      </dest>
      <det nItem="1">
        <prod>
          <cProd>ACO01</cProd>
          <xProd>Chapa de Aco Carbono</xProd>
          <NCM>72081000</NCM>
          <CFOP>5102</CFOP>
          <uCom>KG</uCom>
          <qCom>500.0000</qCom>
          <vUnCom>10.00</vUnCom>
          <vProd>5000.00</vProd>
        </prod>
      </det>
      <total>
        <ICMSTot><vNF>5000.00</vNF></ICMSTot>
      </total>
    </infNFe>
  </NFe>
  <procEventoNFe versao="1.00">
    <eventoNFe versao="1.00">
      <infEvento Id="ID1101113524011234567800019055001000000123100000123401">
        <tpEvento>110111</tpEvento>
        <descEvento>Cancelamento da NF-e</descEvento>
        <dhEvento>2026-03-11T14:30:00-03:00</dhEvento>
      </infEvento>
    </eventoNFe>
    <retEvento versao="1.00">
      <infEventoRet>
        <cStat>135</cStat>
        <xMotivo>Evento registrado e vinculado a NF-e</xMotivo>
        <dhRegEvento>2026-03-11T14:30:15-03:00</dhRegEvento>
        <nProt>135240009999999</nProt>
      </infEventoRet>
    </retEvento>
  </procEventoNFe>
</nfeProc>`

// XML fixture de NF-e com protocolo cStat 101 (Cancelamento Homologado)
const xmlNFeCanceladaProt101 = `<?xml version="1.0" encoding="UTF-8"?>
<nfeProc xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">
  <NFe>
    <infNFe Id="NFe35240112345678000190550010000001231000001234" versao="4.00">
      <ide>
        <mod>55</mod>
        <serie>1</serie>
        <nNF>124</nNF>
      </ide>
      <emit><CNPJ>12345678000190</CNPJ></emit>
      <dest><CNPJ>98765432000198</CNPJ></dest>
      <det nItem="1">
        <prod>
          <cProd>P01</cProd>
          <xProd>Produto Cancelado</xProd>
          <CFOP>5102</CFOP>
          <vProd>1000.00</vProd>
        </prod>
      </det>
      <total><ICMSTot><vNF>1000.00</vNF></ICMSTot></total>
    </infNFe>
  </NFe>
  <protNFe versao="4.00">
    <infProt>
      <cStat>101</cStat>
      <xMotivo>Cancelamento de NF-e homologado</xMotivo>
      <dhRecbto>2026-03-12T09:15:00-03:00</dhRecbto>
      <nProt>135240008888888</nProt>
    </infProt>
  </protNFe>
</nfeProc>`

// XML fixture de NF-e contendo itens normais e itens de DEVOLUÇÃO (CFOP 1201 e 5202)
const xmlNFeComDevolucao = `<?xml version="1.0" encoding="UTF-8"?>
<nfeProc xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">
  <NFe>
    <infNFe Id="NFe35240112345678000190550010000001231000001234" versao="4.00">
      <ide>
        <mod>55</mod>
        <serie>1</serie>
        <nNF>200</nNF>
        <natOp>Operacoes mistas</natOp>
        <dhEmi>2026-03-15T11:00:00-03:00</dhEmi>
      </ide>
      <emit>
        <CNPJ>12345678000190</CNPJ>
        <xNome>Siderurgica Fornecedora</xNome>
      </emit>
      <dest>
        <CNPJ>98765432000198</CNPJ>
        <xNome>Industria Transformadora</xNome>
      </dest>
      <!-- Item 1: Venda Normal (Aço) - CFOP 5102 - Deve ser somado na pegada -->
      <det nItem="1">
        <prod>
          <cProd>ACO_NORMAL</cProd>
          <xProd>Aco Laminado para Fabricacao</xProd>
          <NCM>72081000</NCM>
          <CFOP>5102</CFOP>
          <uCom>KG</uCom>
          <qCom>1000.0000</qCom>
          <vUnCom>10.00</vUnCom>
          <vProd>10000.00</vProd>
        </prod>
      </det>
      <!-- Item 2: Devolução de Compra - CFOP 1201 - NÃO DEVE SOMAR -->
      <det nItem="2">
        <prod>
          <cProd>DEV_01</cProd>
          <xProd>Devolucao de Compra de Alumínio Defeituoso</xProd>
          <NCM>76011000</NCM>
          <CFOP>1201</CFOP>
          <uCom>KG</uCom>
          <qCom>500.0000</qCom>
          <vUnCom>20.00</vUnCom>
          <vProd>10000.00</vProd>
        </prod>
      </det>
      <!-- Item 3: Devolução com Substituição Tributária - CFOP 5411 - NÃO DEVE SOMAR -->
      <det nItem="3">
        <prod>
          <cProd>DEV_ST</cProd>
          <xProd>Devolucao Venda Producao c/ ST</xProd>
          <NCM>72081000</NCM>
          <CFOP>5411</CFOP>
          <uCom>KG</uCom>
          <qCom>200.0000</qCom>
          <vUnCom>10.00</vUnCom>
          <vProd>2000.00</vProd>
        </prod>
      </det>
      <total>
        <ICMSTot>
          <vProd>22000.00</vProd>
          <vNF>22000.00</vNF>
        </ICMSTot>
      </total>
    </infNFe>
  </NFe>
</nfeProc>`

describe('Etapa 2 Piloto ACP — Detecção de Cancelamento e CFOP de Devolução em NF-e', () => {
  describe('1. Detecção e recusa de NF-e Cancelada', () => {
    it('detecta evento de cancelamento tpEvento 110111 e gera motivo claro com data e protocolo', () => {
      const cancelamento = detectarCancelamentoXml(xmlNFeCanceladaComEvento)
      expect(cancelamento.cancelada).toBe(true)
      expect(cancelamento.tpEvento).toBe('110111')
      expect(cancelamento.motivoRecusa).toContain('NF-e cancelada na SEFAZ')
      expect(cancelamento.motivoRecusa).toContain('11/03/2026')
      expect(cancelamento.motivoRecusa).toContain('protocolo 135240009999999')
    })

    it('detecta cancelamento homologado via protNFe cStat 101', () => {
      const cancelamento = detectarCancelamentoXml(xmlNFeCanceladaProt101)
      expect(cancelamento.cancelada).toBe(true)
      expect(cancelamento.cStat).toBe('101')
      expect(cancelamento.motivoRecusa).toContain('NF-e cancelada na SEFAZ')
    })

    it('não marca nota normal autorizada como cancelada', () => {
      const cancelamento = detectarCancelamentoXml(xmlNFeNormal)
      expect(cancelamento.cancelada).toBe(false)
    })

    it('recusa parsing em parseNFeXML quando o XML traz evento de cancelamento', () => {
      expect(() => parseNFeXML(xmlNFeCanceladaComEvento)).toThrow(
        /NF-e cancelada na SEFAZ.*não pode ser usada na pegada/i,
      )
    })

    it('recusa parsing em processarDocumentoFiscal quando a nota está cancelada', () => {
      expect(() => processarDocumentoFiscal(xmlNFeCanceladaProt101)).toThrow(
        /NF-e cancelada na SEFAZ/i,
      )
    })
  })

  describe('2. Identificação e Exclusão de CFOP de Devolução', () => {
    it('classifica CFOPs 1.2xx, 5.2xx, 1.4xx, 5.4xx como devolução', () => {
      // 1.2xx (entradas devoluções)
      expect(isCfopDevolucao('1201')).toBe(true)
      expect(isCfopDevolucao('1202')).toBe(true)
      expect(isCfopDevolucao('1203')).toBe(true)
      expect(isCfopDevolucao('1209')).toBe(true)

      // 5.2xx (saídas devoluções)
      expect(isCfopDevolucao('5201')).toBe(true)
      expect(isCfopDevolucao('5202')).toBe(true)

      // 2.2xx / 6.2xx (interestaduais devoluções)
      expect(isCfopDevolucao('2201')).toBe(true)
      expect(isCfopDevolucao('6202')).toBe(true)

      // ST de devolução (1410, 1411, 5410, 5411, 2410, 6411)
      expect(isCfopDevolucao('1410')).toBe(true)
      expect(isCfopDevolucao('1411')).toBe(true)
      expect(isCfopDevolucao('5410')).toBe(true)
      expect(isCfopDevolucao('5411')).toBe(true)
      expect(isCfopDevolucao('2410')).toBe(true)
      expect(isCfopDevolucao('6411')).toBe(true)

      // CFOPs normais de venda e compra não devem ser devolução
      expect(isCfopDevolucao('5101')).toBe(false)
      expect(isCfopDevolucao('5102')).toBe(false)
      expect(isCfopDevolucao('1101')).toBe(false)
      expect(isCfopDevolucao('1102')).toBe(false)
      expect(isCfopDevolucao('2102')).toBe(false)
    })

    it('checarCfopItem retorna motivo de exclusão claro e legível', () => {
      const checkDev = checarCfopItem('1201')
      expect(checkDev.isDevolucao).toBe(true)
      expect(checkDev.motivoExclusao).toContain('CFOP 1201 (devolução)')
      expect(checkDev.motivoExclusao).toContain('não compõe a pegada')

      const checkNormal = checarCfopItem('5102')
      expect(checkNormal.isDevolucao).toBe(false)
      expect(checkNormal.motivoExclusao).toBeUndefined()
    })

    it('etiqueta itens de devolução no parseNFeXML e calcula totalizadores excluídos', () => {
      const parsed = parseNFeXML(xmlNFeComDevolucao)
      expect(parsed.itens.length).toBe(3)

      // Item 1: Normal
      expect(parsed.itens[0].cfop).toBe('5102')
      expect(parsed.itens[0].isDevolucao).toBeUndefined()

      // Item 2: Devolução 1201
      expect(parsed.itens[1].cfop).toBe('1201')
      expect(parsed.itens[1].isDevolucao).toBe(true)
      expect(parsed.itens[1].motivoExclusaoCfop).toContain('CFOP 1201')

      // Item 3: Devolução ST 5411
      expect(parsed.itens[2].cfop).toBe('5411')
      expect(parsed.itens[2].isDevolucao).toBe(true)
      expect(parsed.itens[2].motivoExclusaoCfop).toContain('CFOP 5411')

      // Totalizadores de exclusão
      expect(parsed.qtdItensDevolucaoExcluidos).toBe(2)
      expect(parsed.valorDevolucaoExcluido).toBe(12000.0) // 10000 + 2000
    })

    it('processarDocumentoFiscal etiqueta os itens e expõe contadores de devolução', () => {
      const doc = processarDocumentoFiscal(xmlNFeComDevolucao)
      expect(doc.qtdItensDevolucaoExcluidos).toBe(2)
      expect(doc.valorDevolucaoExcluido).toBe(12000.0)

      const devItens = doc.itens.filter((it) => it.isDevolucao)
      expect(devItens.length).toBe(2)
    })
  })

  describe('3. Motor de Emissões — Não soma itens de devolução à pegada', () => {
    it('o motor de emissões soma apenas o item normal (5102) e ignora os itens de devolução (1201 e 5411)', () => {
      const doc = processarDocumentoFiscal(xmlNFeComDevolucao)

      // Calcula inventário com o documento misto
      const inventario = calcularInventarioEmissoes([doc], {
        anoBase: 2026,
      })

      // O item normal tem 1000 kg de aço (1 tonelada). Fator worldsteel: 2.18 tCO2e/t
      // O item 2 de alumínio (500 kg = 0.5 t com fator ~14.4 = 7.2 tCO2e) é DEVOLUÇÃO e NÃO PODE SOMAR.
      // O item 3 de aço (200 kg) é DEVOLUÇÃO e NÃO PODE SOMAR.
      // Portanto, o escopo 3 fóssil deve ser EXATAMENTE 1.0 * 2.18 = 2.18 tCO2e (e NÃO somar alumínio ou segundo aço)
      expect(inventario.escopo3TotalTCO2e).toBeCloseTo(2.18, 2)
      expect(inventario.emissoesTotaisFosseisTCO2e).toBeCloseTo(2.18, 2)
    })

    it('processa nota normal intacta calculando emissões corretamente', () => {
      const docNormal = processarDocumentoFiscal(xmlNFeNormal)
      expect(docNormal.qtdItensDevolucaoExcluidos).toBeUndefined()

      const inventarioNormal = calcularInventarioEmissoes([docNormal], {
        anoBase: 2026,
      })
      // 1000 kg aço = 2.18 tCO2e
      expect(inventarioNormal.escopo3TotalTCO2e).toBeCloseTo(2.18, 2)
    })
  })
})
