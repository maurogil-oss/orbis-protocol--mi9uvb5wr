import { describe, it, expect, vi, beforeEach } from 'vitest'
import { assinarLaudoComCertificadoA1 } from '../assinaturaLaudoService'
import pb from '@/lib/pocketbase/client'
import forge from 'node-forge'

describe('assinaturaLaudoService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deve retornar erro se o id do laudo ou senha não forem fornecidos', async () => {
    const res1 = await assinarLaudoComCertificadoA1({ relatorioId: '', senhaPfx: '123' })
    expect(res1.sucesso).toBe(false)
    expect(res1.erro).toContain('ID do laudo')

    const res2 = await assinarLaudoComCertificadoA1({ relatorioId: 'rec-1', senhaPfx: '' })
    expect(res2.sucesso).toBe(false)
    expect(res2.erro).toContain('Senha')
  })

  it('deve executar fluxo com sucesso assinando documento com PKCS#12 e registrando no backend', async () => {
    // Mock do fetch do endpoint /backend/v1/laudos/assinar-icp-brasil
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        sucesso: true,
        mensagem:
          'Documento com assinatura digital baseada em certificado ICP-Brasil e-CNPJ A1 sob custódia do titular e prova criptográfica SHA-256 registrado com sucesso.',
        relatorio_id: 'rel-123',
        hash_sha256: 'a1b2c3d4e5f6',
        timestamp_servidor: '2026-09-28T12:00:00.000Z',
        titular_nome: 'MGM CONSULTORIA EMPRESARIAL LTDA:19598964000101',
        cnpj_titular: '19598964000101',
      }),
    })
    globalThis.fetch = mockFetch

    // Cria PKCS#12 sintético
    const keys = forge.pki.rsa.generateKeyPair(1024)
    const cert = forge.pki.createCertificate()
    cert.publicKey = keys.publicKey
    cert.serialNumber = '01'
    cert.validity.notBefore = new Date(Date.UTC(2025, 0, 1))
    cert.validity.notAfter = new Date(Date.UTC(2027, 1, 12, 12, 0, 0))
    const attrs = [{ name: 'commonName', value: 'MGM CONSULTORIA EMPRESARIAL LTDA:19598964000101' }]
    cert.setSubject(attrs)
    cert.setIssuer(attrs)
    cert.sign(keys.privateKey, forge.md.sha256.create())

    const senha = 'TesteSenha123'
    const p12Asn1 = forge.pkcs12.toPkcs12Asn1(keys.privateKey, [cert], senha)
    const p12Der = forge.asn1.toDer(p12Asn1).getBytes()
    const p12Base64 = forge.util.encode64(p12Der)

    const resultado = await assinarLaudoComCertificadoA1({
      relatorioId: 'rel-123',
      senhaPfx: senha,
      arquivoPfxBase64: p12Base64,
      pdfOriginalBytes: new TextEncoder().encode('Conteúdo do Laudo Pericial'),
    })

    expect(resultado.sucesso).toBe(true)
    expect(resultado.cnpjTitular).toBe('19598964000101')
    expect(resultado.timestampServidor).toBe('2026-09-28T12:00:00.000Z')
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })
})
