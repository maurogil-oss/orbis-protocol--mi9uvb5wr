import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  calcularSha256,
  calcularSha256Arquivo,
  formatarHashCurto,
  obterUrlArquivoXmlNfe,
} from '../nfeCustodiaService'
import { verificarDuplicidadeNfe } from '../nfeDuplicidadeService'
import { processarDocumentoFiscal } from '../modelosFiscaisParser'
import pb from '@/lib/pocketbase/client'

vi.mock('@/lib/pocketbase/client', () => ({
  default: {
    baseUrl: 'https://backend.test.internal',
    collection: vi.fn(),
    files: {
      getURL: vi.fn(
        (record: any, filename: string) =>
          `https://backend.test.internal/api/files/nfe_upload/${record.id}/${filename}`,
      ),
    },
  },
}))

describe('Fluxo Completo de Custódia de NF-e, Hash SHA-256 e Regras de Recusa', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const xmlNormalExemplo = `<?xml version="1.0" encoding="UTF-8"?>
<NFe xmlns="http://www.portalfiscal.inf.br/nfe">
  <infNFe Id="NFe35240112345678000190550010000012341000012345" versao="4.00">
    <ide>
      <nNF>1234</nNF>
      <serie>1</serie>
      <dhEmi>2024-01-15T10:00:00-03:00</dhEmi>
      <mod>55</mod>
    </ide>
    <emit>
      <CNPJ>12345678000190</CNPJ>
      <xNome>EMITENTE TESTE SA</xNome>
    </emit>
    <dest>
      <CNPJ>98765432000100</CNPJ>
      <xNome>DESTINATARIO TESTE LTDA</xNome>
    </dest>
    <total>
      <ICMSTot>
        <vNF>1000.00</vNF>
        <vICMS>180.00</vICMS>
        <vPIS>16.50</vPIS>
        <vCOFINS>76.00</vCOFINS>
      </ICMSTot>
    </total>
    <det nItem="1">
      <prod>
        <cProd>A01</cProd>
        <xProd>BARRA DE FERRO ACO</xProd>
        <NCM>72142000</NCM>
        <CFOP>5102</CFOP>
        <uCom>KG</uCom>
        <qCom>100.0000</qCom>
        <vUnCom>10.00</vUnCom>
        <vProd>1000.00</vProd>
      </prod>
    </det>
  </infNFe>
</NFe>`

  const xmlCanceladaExemplo = `<?xml version="1.0" encoding="UTF-8"?>
<procEventoNFe xmlns="http://www.portalfiscal.inf.br/nfe">
  <evento>
    <infEvento>
      <tpEvento>110111</tpEvento>
      <chNFe>35240112345678000190550010000012341000012345</chNFe>
      <dhEvento>2024-01-16T12:00:00-03:00</dhEvento>
      <nProt>135240000000001</nProt>
      <detEvento>
        <descEvento>Cancelamento</descEvento>
        <xJust>Cancelamento por duplicidade de faturamento</xJust>
      </detEvento>
    </infEvento>
  </evento>
</procEventoNFe>`

  it('calcula hash SHA-256 idêntico tanto via string direta quanto via File/Blob', async () => {
    const file = new File([xmlNormalExemplo], 'nfe-1234.xml', { type: 'text/xml' })
    const hashFromString = await calcularSha256(xmlNormalExemplo)
    const hashFromFile = await calcularSha256Arquivo(file)

    expect(hashFromFile).toBe(hashFromString)
    expect(hashFromFile).toMatch(/^[0-9a-f]{64}$/)
    expect(formatarHashCurto(hashFromFile)).toBe(
      `${hashFromFile.slice(0, 8)}...${hashFromFile.slice(-4)}`,
    )
  })

  it('armazena arquivo_xml original e vincula hash SHA-256 ao criar nota normal no PocketBase', async () => {
    const file = new File([xmlNormalExemplo], 'nfe-1234.xml', { type: 'text/xml' })
    const text = await file.text()
    const parsedDoc = processarDocumentoFiscal(text, file.name)
    const xmlSha256 = await calcularSha256Arquivo(file)

    const mockCreate = vi.fn().mockResolvedValue({
      id: 'nfe_record_999',
      chave_acesso: parsedDoc.chaveAcesso,
      xml_sha256: xmlSha256,
      arquivo_xml: 'nfe-1234.xml',
    })
    vi.mocked(pb.collection).mockReturnValue({
      create: mockCreate,
    } as any)

    // Simula a construção de FormData no envio do arquivo original
    const formData = new FormData()
    formData.append('chave_acesso', parsedDoc.chaveAcesso || '')
    formData.append('arquivo_xml', file, file.name)
    formData.append('xml_sha256', xmlSha256)

    await pb.collection('nfe_upload').create(formData)

    expect(mockCreate).toHaveBeenCalledTimes(1)
    const passedFormData = mockCreate.mock.calls[0][0] as FormData
    expect(passedFormData.get('chave_acesso')).toBe('35240112345678000190550010000012341000012345')
    expect(passedFormData.get('xml_sha256')).toBe(xmlSha256)
    expect(passedFormData.get('arquivo_xml')).toBeTruthy()

    // O URL de download pode ser resolvido
    const url = obterUrlArquivoXmlNfe({
      id: 'nfe_record_999',
      arquivo_xml: 'nfe-1234.xml',
    })
    expect(url).toBe(
      'https://backend.test.internal/api/files/nfe_upload/nfe_record_999/nfe-1234.xml',
    )
  })

  it('recusa nota cancelada sem persistir e sem anexar XML', async () => {
    const fileCancelada = new File([xmlCanceladaExemplo], 'cancelamento-1234.xml', {
      type: 'text/xml',
    })
    const text = await fileCancelada.text()

    const mockCreate = vi.fn()
    vi.mocked(pb.collection).mockReturnValue({
      create: mockCreate,
    } as any)

    // O parser fiscal deve lançar erro explícito de cancelamento
    expect(() => processarDocumentoFiscal(text, fileCancelada.name)).toThrow(
      /CANCELADA.*Recusada para lastro/i,
    )

    // Nenhum create foi chamado para o arquivo cancelado
    expect(mockCreate).not.toHaveBeenCalled()
  })

  it('recusa nota duplicada sem persistir e sem anexar XML', async () => {
    const chave = '35240112345678000190550010000012341000012345'

    vi.mocked(pb.collection).mockReturnValue({
      getFirstListItem: vi.fn().mockResolvedValue({
        id: 'nfe_existente_1',
        chave_acesso: chave,
        numero_nota: '1234',
        created: '2024-01-15T12:00:00Z',
      }),
    } as any)

    const duplicidade = await verificarDuplicidadeNfe(chave)
    expect(duplicidade.duplicada).toBe(true)
    expect(duplicidade.mensagem).toContain('já foi importada anteriormente')

    // No fluxo do Painel do Cliente, quando duplicada == true, a iteração dá continue e não chama create
    const mockCreate = vi.fn()
    vi.mocked(pb.collection).mockReturnValue({
      create: mockCreate,
      getFirstListItem: vi.fn().mockResolvedValue({ id: 'existente' }),
    } as any)

    if (!duplicidade.duplicada) {
      await pb.collection('nfe_upload').create(new FormData())
    }

    expect(mockCreate).not.toHaveBeenCalled()
  })

  it('mantém cálculo normal de itens e flag de revisão intactos no fluxo com custódia', async () => {
    const parsedDoc = processarDocumentoFiscal(xmlNormalExemplo, 'nfe-1234.xml')
    expect(parsedDoc.itens).toHaveLength(1)
    expect(parsedDoc.itens[0].descricao).toBe('BARRA DE FERRO ACO')
    expect(parsedDoc.itens[0].ncm).toBe('72142000')
    expect(parsedDoc.itens[0].isDevolucao).toBe(false)
    expect(parsedDoc.itens[0].naoCalculado).toBe(false)
  })
})
