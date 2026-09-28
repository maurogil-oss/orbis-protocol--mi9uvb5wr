import { describe, it, expect } from 'vitest'
import {
  extrairMetadadosCertificadoPfx,
  formatarDataParaPocketBase,
} from '../certificadoA1Extractor'
import forge from 'node-forge'

describe('certificadoA1Extractor', () => {
  it('deve formatar data para o padrão PocketBase v0.36 (YYYY-MM-DD HH:mm:ss.000Z)', () => {
    const data = new Date(Date.UTC(2027, 1, 12, 10, 30, 0, 0))
    const formatted = formatarDataParaPocketBase(data)
    expect(formatted).toBe('2027-02-12 10:30:00.000Z')
    expect(formatted).not.toContain('T')
  })

  it('não deve lançar exceção ao receber base64 corrompido ou senha incorreta', () => {
    const res = extrairMetadadosCertificadoPfx('dGVzdGUgaW52YWxpZG8=', 'senha123')
    expect(res.sucesso).toBe(false)
    expect(res.erro).toBeDefined()
  })

  it('deve extrair validade notAfter com sucesso de um contêiner PKCS#12 gerado', () => {
    // Gera par de chaves RSA e certificado de teste com notAfter em 2027
    const keys = forge.pki.rsa.generateKeyPair(1024)
    const cert = forge.pki.createCertificate()
    cert.publicKey = keys.publicKey
    cert.serialNumber = '01'
    cert.validity.notBefore = new Date(Date.UTC(2025, 0, 1))
    cert.validity.notAfter = new Date(Date.UTC(2027, 1, 12, 12, 0, 0))

    const attrs = [
      { name: 'commonName', value: 'MGM CONSULTORIA EMPRESARIAL LTDA:19598964000101' },
      { name: 'organizationName', value: 'MGM Consultoria Empresarial' },
    ]
    cert.setSubject(attrs)
    cert.setIssuer(attrs)
    cert.sign(keys.privateKey, forge.md.sha256.create())

    // Cria contêiner PKCS#12 com senha
    const senha = 'TesteSenha123'
    const p12Asn1 = forge.pkcs12.toPkcs12Asn1(keys.privateKey, [cert], senha)
    const p12Der = forge.asn1.toDer(p12Asn1).getBytes()
    const p12Base64 = forge.util.encode64(p12Der)

    const resultado = extrairMetadadosCertificadoPfx(p12Base64, senha)
    expect(resultado.sucesso).toBe(true)
    expect(resultado.validadePocketBase).toBe('2027-02-12 12:00:00.000Z')
    expect(resultado.cnpjTitular).toBe('19598964000101')
    expect(resultado.notAfter?.getUTCFullYear()).toBe(2027)
  })
})
