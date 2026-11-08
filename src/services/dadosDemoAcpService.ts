/**
 * Dados de Exemplo Anonimizados para Demonstração do Piloto ACP (Etapa 7).
 *
 * Características:
 * - Totalmente fictício: nenhum dado real de empresa ou pessoa física.
 * - Etiquetas claras e visíveis: is_demo = true, tag 'DEMO', aviso institucional.
 * - 1 Lote Didático ACP + 3 NF-e fictícias completas.
 * - Cobertura de materiais com fatores canônicos oficiais:
 *   * Aço: 2,18 tCO2e/t (worldsteel) / classificação NCM
 *   * Alumínio: 14,40 tCO2e/t (IAI 2024 global)
 *   * Cobre: 4,10 tCO2e/t (ICA)
 *   * Item em Tonelada com conversão explícita (x1000)
 *   * Item sem fator ("não calculado" explícito, emissão 0,000)
 */

import type { DocumentoFiscalProcessado } from './modelosFiscaisParser'

export const ID_LOTE_DEMO_ACP = 'acp_demo_lote_piloto_01'
export const CODIGO_LOTE_DEMO_ACP = 'ORB-ACP-DEMO-2026-001'
export const CNPJ_EMPRESA_DEMO_ACP = '00.000.000/0001-91' // CNPJ genérico/fictício de teste
export const NOME_EMPRESA_DEMO_ACP = 'Empresa Associada Piloto ACP (Demonstração Didática)'

export const AVISO_DADOS_DEMO_ACP =
  'DADOS DE DEMONSTRAÇÃO ANONIMIZADOS — Piloto ACP: lote e notas fiscais simuladas para teste didático e auditoria metodológica. Não constituem operação comercial real.'

export interface ItemNotaDemoACP {
  numeroItem: number
  codigo: string
  descricao: string
  ncm: string
  cfop: string
  unidadeDeclarada: string
  quantidadeDeclarada: number
  quantidadeConvertidaKg: number
  fatorKgCo2ePorKg: number
  fatorFonte: string
  emissaoFossilTco2e: number
  naoCalculado?: boolean
  memoriaCalculo: string
}

export interface NotaFiscalDemoACP {
  chaveAcesso: string
  numeroNota: string
  serie: string
  dataEmissao: string
  emitenteRazao: string
  emitenteCnpj: string
  destinatarioRazao: string
  destinatarioCnpj: string
  valorTotalNf: number
  isDemo: true
  tagDemo: 'DEMO'
  itens: ItemNotaDemoACP[]
  emissaoTotalTco2e: number
  xmlSimulado: string
}

export interface LoteDemonstracaoACP {
  id: string
  codigo_lote: string
  titulo: string
  is_demo: true
  tag: 'DEMO'
  tipo: 'piloto_acp_demonstrativo'
  data_criacao: string
  empresa_razao: string
  empresa_cnpj: string
  notas_fiscais: NotaFiscalDemoACP[]
  totais: {
    qtdNotas: number
    qtdItens: number
    qtdItensComFator: number
    qtdItensNaoCalculados: number
    massaTotalKg: number
    emissaoTotalTco2e: number
    emissaoAcoTco2e: number
    emissaoAluminioTco2e: number
    emissaoCobreTco2e: number
  }
}

/**
 * Fixture de 3 Notas Fiscais Fictícias do Piloto ACP:
 *
 * Nota 1 (NF-e 1010): Foco em Metais Pesados (Aço em Tonelada + Cobre em kg)
 * - Item 1: 5.0 t de Aço estrutural laminado (5.000 kg x 2.18 tCO2e/t = 10.900 tCO2e)
 * - Item 2: 200 kg de Cobre eletrolítico (200 kg x 4.10 kgCO2e/kg = 0.820 tCO2e)
 *
 * Nota 2 (NF-e 1020): Foco em Alumínio Primário + Item sem Fator
 * - Item 1: 500 kg de Alumínio primário (500 kg x 14.40 kgCO2e/kg = 7.200 tCO2e)
 * - Item 2: 50 unidades de Insumo Especial sem fator ("não calculado", emissão 0,000 tCO2e)
 *
 * Nota 3 (NF-e 1030): Foco em Reciclagem e Unidades Divergentes
 * - Item 1: 1.2 t de Sucata/Aço Reutilizado (1.200 kg x 2.18 = 2.616 tCO2e)
 * - Item 2: 15 Caixas de Embalagem Secundária sem base mássica ("não calculado", emissão 0,000 tCO2e)
 */
export const NOTAS_DEMO_PILOTO_ACP: NotaFiscalDemoACP[] = [
  {
    chaveAcesso: '41260300000000000191550010000010101000010104',
    numeroNota: '1010',
    serie: '1',
    dataEmissao: '2026-03-15T09:00:00-03:00',
    emitenteRazao: 'Metalúrgica Fictícia Curitiba Ltda (DEMO)',
    emitenteCnpj: '00.000.000/0002-72',
    destinatarioRazao: NOME_EMPRESA_DEMO_ACP,
    destinatarioCnpj: CNPJ_EMPRESA_DEMO_ACP,
    valorTotalNf: 62000.0,
    isDemo: true,
    tagDemo: 'DEMO',
    itens: [
      {
        numeroItem: 1,
        codigo: 'ACO-STR-01',
        descricao: 'Viga de Aço Estrutural Carbono Laminado em Tonelada (DEMO)',
        ncm: '72101100',
        cfop: '5102',
        unidadeDeclarada: 't',
        quantidadeDeclarada: 5.0,
        quantidadeConvertidaKg: 5000.0,
        fatorKgCo2ePorKg: 2.18,
        fatorFonte: 'worldsteel 2024 / DM-ORB-001 canônico (2,18 tCO2e/t)',
        emissaoFossilTco2e: 10.9,
        memoriaCalculo:
          '5.0 t × 1.000 = 5.000 kg × 2,18 kgCO₂e/kg = 10.900,00 kgCO₂e (10.9000 tCO₂e)',
      },
      {
        numeroItem: 2,
        codigo: 'COB-ELE-02',
        descricao: 'Barra de Cobre Eletrolítico Puro em Quilogramas (DEMO)',
        ncm: '74081100',
        cfop: '5102',
        unidadeDeclarada: 'kg',
        quantidadeDeclarada: 200.0,
        quantidadeConvertidaKg: 200.0,
        fatorKgCo2ePorKg: 4.1,
        fatorFonte: 'ICA 2024 / DM-ORB-001 canônico (4,10 kgCO2e/kg)',
        emissaoFossilTco2e: 0.82,
        memoriaCalculo: '200 kg × 4,10 kgCO₂e/kg = 820,00 kgCO₂e (0.8200 tCO₂e)',
      },
    ],
    emissaoTotalTco2e: 11.72,
    xmlSimulado: `<?xml version="1.0" encoding="UTF-8"?>
<nfeProc xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">
  <NFe>
    <infNFe Id="NFe41260300000000000191550010000010101000010104" versao="4.00">
      <ide><mod>55</mod><serie>1</serie><nNF>1010</nNF><dhEmi>2026-03-15T09:00:00-03:00</dhEmi></ide>
      <emit><CNPJ>00000000000272</CNPJ><xNome>Metalurgica Ficticia Curitiba Ltda DEMO</xNome></emit>
      <dest><CNPJ>00000000000191</CNPJ><xNome>Empresa Associada Piloto ACP</xNome></dest>
      <det nItem="1">
        <prod>
          <cProd>ACO-STR-01</cProd>
          <xProd>Viga de Aco Estrutural Carbono Laminado em Tonelada DEMO</xProd>
          <NCM>72101100</NCM>
          <CFOP>5102</CFOP>
          <uCom>t</uCom>
          <qCom>5.0</qCom>
          <vUnCom>10000.00</vUnCom>
          <vProd>50000.00</vProd>
        </prod>
      </det>
      <det nItem="2">
        <prod>
          <cProd>COB-ELE-02</cProd>
          <xProd>Barra de Cobre Eletrolitico Puro em Quilogramas DEMO</xProd>
          <NCM>74081100</NCM>
          <CFOP>5102</CFOP>
          <uCom>KG</uCom>
          <qCom>200</qCom>
          <vUnCom>60.00</vUnCom>
          <vProd>12000.00</vProd>
        </prod>
      </det>
      <total><ICMSTot><vNF>62000.00</vNF></ICMSTot></total>
    </infNFe>
  </NFe>
  <protNFe versao="4.00"><infProt><cStat>100</cStat><xMotivo>Autorizado o uso da NF-e (DEMO)</xMotivo></infProt></protNFe>
</nfeProc>`,
  },
  {
    chaveAcesso: '41260300000000000191550010000010201000010201',
    numeroNota: '1020',
    serie: '1',
    dataEmissao: '2026-03-16T14:30:00-03:00',
    emitenteRazao: 'Alumínios e Insumos do Paraná Ltda (DEMO)',
    emitenteCnpj: '00.000.000/0003-53',
    destinatarioRazao: NOME_EMPRESA_DEMO_ACP,
    destinatarioCnpj: CNPJ_EMPRESA_DEMO_ACP,
    valorTotalNf: 35000.0,
    isDemo: true,
    tagDemo: 'DEMO',
    itens: [
      {
        numeroItem: 1,
        codigo: 'ALU-PRI-01',
        descricao: 'Lingote de Alumínio Primário em Quilogramas (DEMO)',
        ncm: '76011000',
        cfop: '5102',
        unidadeDeclarada: 'kg',
        quantidadeDeclarada: 500.0,
        quantidadeConvertidaKg: 500.0,
        fatorKgCo2ePorKg: 14.4,
        fatorFonte: 'IAI 2024 / DM-ORB-001 canônico global (14,40 tCO2e/t)',
        emissaoFossilTco2e: 7.2,
        memoriaCalculo: '500 kg × 14,40 kgCO₂e/kg = 7.200,00 kgCO₂e (7.2000 tCO₂e)',
      },
      {
        numeroItem: 2,
        codigo: 'INS-SEM-FATOR-02',
        descricao: 'Insumo de Fixação Mecânica Sem Fator Cadastrado (DEMO)',
        ncm: '99999999',
        cfop: '5102',
        unidadeDeclarada: 'UN',
        quantidadeDeclarada: 50.0,
        quantidadeConvertidaKg: 0,
        fatorKgCo2ePorKg: 0,
        fatorFonte: 'Não calculado — NCM sem fator e unidade sem base mássica',
        emissaoFossilTco2e: 0.0,
        naoCalculado: true,
        memoriaCalculo: 'Item não calculado (emissão 0,000 tCO2e) — vedado fallback arbitrário',
      },
    ],
    emissaoTotalTco2e: 7.2,
    xmlSimulado: `<?xml version="1.0" encoding="UTF-8"?>
<nfeProc xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">
  <NFe>
    <infNFe Id="NFe41260300000000000191550010000010201000010201" versao="4.00">
      <ide><mod>55</mod><serie>1</serie><nNF>1020</nNF><dhEmi>2026-03-16T14:30:00-03:00</dhEmi></ide>
      <emit><CNPJ>00000000000353</CNPJ><xNome>Aluminios e Insumos do Parana Ltda DEMO</xNome></emit>
      <dest><CNPJ>00000000000191</CNPJ><xNome>Empresa Associada Piloto ACP</xNome></dest>
      <det nItem="1">
        <prod>
          <cProd>ALU-PRI-01</cProd>
          <xProd>Lingote de Aluminio Primario em Quilogramas DEMO</xProd>
          <NCM>76011000</NCM>
          <CFOP>5102</CFOP>
          <uCom>kg</uCom>
          <qCom>500</qCom>
          <vUnCom>50.00</vUnCom>
          <vProd>25000.00</vProd>
        </prod>
      </det>
      <det nItem="2">
        <prod>
          <cProd>INS-SEM-FATOR-02</cProd>
          <xProd>Insumo de Fixacao Mecanica Sem Fator Cadastrado DEMO</xProd>
          <NCM>99999999</NCM>
          <CFOP>5102</CFOP>
          <uCom>UN</uCom>
          <qCom>50</qCom>
          <vUnCom>200.00</vUnCom>
          <vProd>10000.00</vProd>
        </prod>
      </det>
      <total><ICMSTot><vNF>35000.00</vNF></ICMSTot></total>
    </infNFe>
  </NFe>
  <protNFe versao="4.00"><infProt><cStat>100</cStat><xMotivo>Autorizado o uso da NF-e (DEMO)</xMotivo></infProt></protNFe>
</nfeProc>`,
  },
  {
    chaveAcesso: '41260300000000000191550010000010301000010309',
    numeroNota: '1030',
    serie: '1',
    dataEmissao: '2026-03-18T11:15:00-03:00',
    emitenteRazao: 'Distribuidora Paranaense de Metais S.A. (DEMO)',
    emitenteCnpj: '00.000.000/0004-34',
    destinatarioRazao: NOME_EMPRESA_DEMO_ACP,
    destinatarioCnpj: CNPJ_EMPRESA_DEMO_ACP,
    valorTotalNf: 28000.0,
    isDemo: true,
    tagDemo: 'DEMO',
    itens: [
      {
        numeroItem: 1,
        codigo: 'ACO-REC-01',
        descricao: 'Chapa de Aço Laminado Reutilizável em Tonelada (DEMO)',
        ncm: '72081000',
        cfop: '5102',
        unidadeDeclarada: 'ton',
        quantidadeDeclarada: 1.2,
        quantidadeConvertidaKg: 1200.0,
        fatorKgCo2ePorKg: 2.18,
        fatorFonte: 'worldsteel 2024 / DM-ORB-001 canônico (2,18 tCO2e/t)',
        emissaoFossilTco2e: 2.616,
        memoriaCalculo:
          '1.2 ton × 1.000 = 1.200 kg × 2,18 kgCO₂e/kg = 2.616,00 kgCO₂e (2.6160 tCO₂e)',
      },
      {
        numeroItem: 2,
        codigo: 'EMB-CX-02',
        descricao: 'Caixas de Madeira para Proteção Transporte (DEMO)',
        ncm: '44151000',
        cfop: '5102',
        unidadeDeclarada: 'CX',
        quantidadeDeclarada: 15.0,
        quantidadeConvertidaKg: 0,
        fatorKgCo2ePorKg: 0,
        fatorFonte: 'Não calculado — unidade volumétrica/embalagem sem peso fiscal',
        emissaoFossilTco2e: 0.0,
        naoCalculado: true,
        memoriaCalculo: 'Item não calculado (emissão 0,000 tCO2e) — unidade incompatível com kg',
      },
    ],
    emissaoTotalTco2e: 2.616,
    xmlSimulado: `<?xml version="1.0" encoding="UTF-8"?>
<nfeProc xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">
  <NFe>
    <infNFe Id="NFe41260300000000000191550010000010301000010309" versao="4.00">
      <ide><mod>55</mod><serie>1</serie><nNF>1030</nNF><dhEmi>2026-03-18T11:15:00-03:00</dhEmi></ide>
      <emit><CNPJ>00000000000434</CNPJ><xNome>Distribuidora Paranaense de Metais S.A. DEMO</xNome></emit>
      <dest><CNPJ>00000000000191</CNPJ><xNome>Empresa Associada Piloto ACP</xNome></dest>
      <det nItem="1">
        <prod>
          <cProd>ACO-REC-01</cProd>
          <xProd>Chapa de Aco Laminado Reutilizavel em Tonelada DEMO</xProd>
          <NCM>72081000</NCM>
          <CFOP>5102</CFOP>
          <uCom>ton</uCom>
          <qCom>1.2</qCom>
          <vUnCom>20000.00</vUnCom>
          <vProd>24000.00</vProd>
        </prod>
      </det>
      <det nItem="2">
        <prod>
          <cProd>EMB-CX-02</cProd>
          <xProd>Caixas de Madeira para Protecao Transporte DEMO</xProd>
          <NCM>44151000</NCM>
          <CFOP>5102</CFOP>
          <uCom>CX</uCom>
          <qCom>15</qCom>
          <vUnCom>266.66</vUnCom>
          <vProd>4000.00</vProd>
        </prod>
      </det>
      <total><ICMSTot><vNF>28000.00</vNF></ICMSTot></total>
    </infNFe>
  </NFe>
  <protNFe versao="4.00"><infProt><cStat>100</cStat><xMotivo>Autorizado o uso da NF-e (DEMO)</xMotivo></infProt></protNFe>
</nfeProc>`,
  },
]

/**
 * Retorna o Lote Completo de Demonstração Anonimizado do Piloto ACP.
 */
export function obterLoteDemonstracaoACP(): LoteDemonstracaoACP {
  const notas = NOTAS_DEMO_PILOTO_ACP
  const qtdNotas = notas.length
  let qtdItens = 0
  let qtdItensComFator = 0
  let qtdItensNaoCalculados = 0
  let massaTotalKg = 0
  let emissaoTotalTco2e = 0
  let emissaoAcoTco2e = 0
  let emissaoAluminioTco2e = 0
  let emissaoCobreTco2e = 0

  for (const n of notas) {
    for (const it of n.itens) {
      qtdItens++
      massaTotalKg += it.quantidadeConvertidaKg
      emissaoTotalTco2e += it.emissaoFossilTco2e

      if (it.naoCalculado) {
        qtdItensNaoCalculados++
      } else {
        qtdItensComFator++
      }

      if (
        it.descricao.toLowerCase().includes('aço') ||
        it.descricao.toLowerCase().includes('aco')
      ) {
        emissaoAcoTco2e += it.emissaoFossilTco2e
      } else if (
        it.descricao.toLowerCase().includes('alumínio') ||
        it.descricao.toLowerCase().includes('aluminio')
      ) {
        emissaoAluminioTco2e += it.emissaoFossilTco2e
      } else if (it.descricao.toLowerCase().includes('cobre')) {
        emissaoCobreTco2e += it.emissaoFossilTco2e
      }
    }
  }

  return {
    id: ID_LOTE_DEMO_ACP,
    codigo_lote: CODIGO_LOTE_DEMO_ACP,
    titulo: 'Lote Piloto ACP Demonstrativo — Cadeia de Metais e Reciclagem Industrial (DEMO)',
    is_demo: true,
    tag: 'DEMO',
    tipo: 'piloto_acp_demonstrativo',
    data_criacao: '2026-03-20T10:00:00-03:00',
    empresa_razao: NOME_EMPRESA_DEMO_ACP,
    empresa_cnpj: CNPJ_EMPRESA_DEMO_ACP,
    notas_fiscais: notas,
    totais: {
      qtdNotas,
      qtdItens,
      qtdItensComFator,
      qtdItensNaoCalculados,
      massaTotalKg,
      emissaoTotalTco2e: Number(emissaoTotalTco2e.toFixed(3)),
      emissaoAcoTco2e: Number(emissaoAcoTco2e.toFixed(3)),
      emissaoAluminioTco2e: Number(emissaoAluminioTco2e.toFixed(3)),
      emissaoCobreTco2e: Number(emissaoCobreTco2e.toFixed(3)),
    },
  }
}

/**
 * Converte as notas fictícias do piloto ACP para o formato padronizado de DocumentoFiscalProcessado.
 */
export function obterDocumentosProcessadosDemoACP(): DocumentoFiscalProcessado[] {
  return NOTAS_DEMO_PILOTO_ACP.map((nota) => ({
    chaveAcesso: nota.chaveAcesso,
    modeloFiscal: '55_nfe',
    numeroDocumento: nota.numeroNota,
    serie: nota.serie,
    dataEmissao: nota.dataEmissao,
    cnpjEmitente: nota.emitenteCnpj,
    nomeEmitente: nota.emitenteRazao,
    cnpjDestinatario: nota.destinatarioCnpj,
    nomeDestinatario: nota.destinatarioRazao,
    valorTotal: nota.valorTotalNf,
    valorIcms: 0,
    valorIpi: 0,
    valorPis: 0,
    valorCofins: 0,
    itens: nota.itens.map((it) => ({
      numeroItem: it.numeroItem,
      codigo: it.codigo,
      descricao: it.descricao,
      ncm: it.ncm,
      cfop: it.cfop,
      unidade: it.unidadeDeclarada,
      quantidade: it.quantidadeDeclarada,
      valorUnitario:
        it.quantidadeDeclarada > 0
          ? nota.valorTotalNf / nota.itens.length / it.quantidadeDeclarada
          : 0,
      valorTotal: nota.valorTotalNf / nota.itens.length,
      naoCalculado: it.naoCalculado ? true : undefined,
      memoriaCalculoTexto: it.memoriaCalculo,
    })),
    nomeArquivo: `nfe_demo_acp_${nota.numeroNota}.xml`,
    origem: 'manual',
  }))
}
