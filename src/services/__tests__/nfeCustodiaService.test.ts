import { describe, it, expect } from 'vitest'
import { calcularSha256, formatarHashCurto, obterUrlArquivoXmlNfe } from '../nfeCustodiaService'

describe('nfeCustodiaService — Custódia e Hash SHA-256 de NF-e', () => {
  it('calcula hash SHA-256 exato de string vazia (vetor de teste padrão NIST)', async () => {
    // Hash conhecido de string vazia:
    // e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
    const hash = await calcularSha256('')
    expect(hash).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855')
  })

  it('calcula hash SHA-256 exato do vetor padrão NIST "abc"', async () => {
    // Hash conhecido de "abc":
    // ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad
    const hash = await calcularSha256('abc')
    expect(hash).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad')
  })

  it('calcula hash SHA-256 exato de um XML de NF-e', async () => {
    const xmlNfe =
      '<?xml version="1.0" encoding="UTF-8"?><NFe><infNFe Id="NFe35240112345678000190550010000012341000012345"></infNFe></NFe>'
    const hash = await calcularSha256(xmlNfe)
    expect(hash).toHaveLength(64)
    expect(hash).toMatch(/^[0-9a-f]{64}$/)

    // Executando uma segunda vez deve ser 100% determinístico e idêntico
    const hash2 = await calcularSha256(xmlNfe)
    expect(hash2).toBe(hash)
  })

  it('calcula hash sobre Uint8Array', async () => {
    const bytes = new TextEncoder().encode('abc')
    const hash = await calcularSha256(bytes)
    expect(hash).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad')
  })

  it('abrevia hash para visualização com prefixo e sufixo legíveis', () => {
    const hashCompleto = 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'
    const formatado = formatarHashCurto(hashCompleto)
    expect(formatado).toBe('ba7816bf...15ad')
  })

  it('retorna vazio se o hash não estiver definido', () => {
    expect(formatarHashCurto(undefined)).toBe('')
    expect(formatarHashCurto(null)).toBe('')
    expect(formatarHashCurto('')).toBe('')
  })

  it('gera URL de download do PocketBase quando o arquivo está presente', () => {
    const record = {
      id: 'rec_123',
      arquivo_xml: 'nota_fiscal_3524.xml',
    }
    const url = obterUrlArquivoXmlNfe(record)
    expect(url).toBeTruthy()
    expect(url).toContain('rec_123')
    expect(url).toContain('nota_fiscal_3524.xml')
  })

  it('retorna null se o record não possuir arquivo_xml', () => {
    expect(obterUrlArquivoXmlNfe({ id: 'rec_123' })).toBeNull()
    expect(obterUrlArquivoXmlNfe({ id: 'rec_123', arquivo_xml: '' })).toBeNull()
  })
})
