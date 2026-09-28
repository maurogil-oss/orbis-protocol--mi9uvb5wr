import forge from 'node-forge'

export interface ExtracaoCertificadoA1Resultado {
  sucesso: boolean
  validadeIso?: string
  validadePocketBase?: string // "YYYY-MM-DD HH:mm:ss.000Z"
  notBefore?: Date
  notAfter?: Date
  cnpjTitular?: string
  razaoSocial?: string
  titularNome?: string
  erro?: string
}

/**
 * Formata um objeto Date para o formato estrito aceito pelo PocketBase v0.36:
 * "YYYY-MM-DD HH:mm:ss.000Z" (espaço em vez de 'T').
 */
export function formatarDataParaPocketBase(date: Date): string {
  const pad = (n: number, len = 2) => String(n).padStart(len, '0')
  const ano = date.getUTCFullYear()
  const mes = pad(date.getUTCMonth() + 1)
  const dia = pad(date.getUTCDate())
  const hora = pad(date.getUTCHours())
  const min = pad(date.getUTCMinutes())
  const seg = pad(date.getUTCSeconds())
  const ms = pad(date.getUTCMilliseconds(), 3)
  return `${ano}-${mes}-${dia} ${hora}:${min}:${seg}.${ms}Z`
}

/**
 * Desempacota em memória no navegador o contêiner PKCS#12 (.pfx / .p12)
 * utilizando a senha fornecida pelo usuário, extrai a validade (notAfter)
 * do certificado X.509 e os dados do titular.
 *
 * @param arquivoBase64 string em base64 (com ou sem data:application/x-pkcs12;base64, prefix)
 * @param senha string com a senha do arquivo .pfx
 */
export function extrairMetadadosCertificadoPfx(
  arquivoBase64: string,
  senha: string,
): ExtracaoCertificadoA1Resultado {
  try {
    let cleanB64 = arquivoBase64
    const commaIdx = cleanB64.indexOf(',')
    if (commaIdx !== -1) {
      cleanB64 = cleanB64.substring(commaIdx + 1)
    }
    cleanB64 = cleanB64.replace(/\s+/g, '')

    const derBytes = forge.util.decode64(cleanB64)
    const asn1Obj = forge.asn1.fromDer(derBytes)

    // Descriptografa o PKCS#12. Usamos modo tolerante (strict = false).
    let p12: any = null
    try {
      p12 = forge.pkcs12.pkcs12FromAsn1(asn1Obj, false, senha)
    } catch {
      p12 = forge.pkcs12.pkcs12FromAsn1(asn1Obj, senha)
    }

    if (!p12) {
      return { sucesso: false, erro: 'Falha ao processar contêiner PKCS#12.' }
    }

    // Busca o certBag
    const certBags = p12.getBags({ bagType: forge.pki.oids.certBag })
    const bagsList = (certBags && certBags[forge.pki.oids.certBag]) || []

    let targetCert: any = null

    // Procura o certificado que possui chave privada associada ou que é o titular final
    for (const bag of bagsList) {
      if (bag.cert) {
        if (!targetCert) {
          targetCert = bag.cert
        } else if (
          bag.cert.validity?.notAfter &&
          targetCert.validity?.notAfter &&
          bag.cert.validity.notAfter.getTime() > targetCert.validity.notAfter.getTime()
        ) {
          // Em cadeias ICP-Brasil, a raiz costuma ter validade maior, mas o certificado titular
          // é o que não tem BasicConstraints cA=true
          const isCa = bag.cert.extensions?.some(
            (ext: any) => ext.name === 'basicConstraints' && ext.cA === true,
          )
          if (!isCa) {
            targetCert = bag.cert
          }
        }
      }
    }

    if (!targetCert) {
      // Fallback em safeContents
      if (Array.isArray(p12.safeContents)) {
        for (const sc of p12.safeContents) {
          if (Array.isArray(sc.safeBags)) {
            for (const sb of sc.safeBags) {
              if (sb.cert) {
                targetCert = sb.cert
                break
              }
            }
          }
          if (targetCert) break
        }
      }
    }

    if (!targetCert || !targetCert.validity || !targetCert.validity.notAfter) {
      return {
        sucesso: false,
        erro: 'Nenhum certificado X.509 com campo validity.notAfter encontrado no contêiner PKCS#12.',
      }
    }

    const notAfter: Date = targetCert.validity.notAfter
    const notBefore: Date = targetCert.validity.notBefore
    const validadePocketBase = formatarDataParaPocketBase(notAfter)
    const validadeIso = notAfter.toISOString()

    // Extrai dados do sujeito (CNPJ e Razão Social se presentes no CN do certificado ICP-Brasil)
    let commonName = ''
    let razaoSocial = ''
    let cnpjTitular = ''

    if (Array.isArray(targetCert.subject?.attributes)) {
      for (const attr of targetCert.subject.attributes) {
        if (attr.name === 'commonName' || attr.shortName === 'CN') {
          commonName = String(attr.value || '')
        }
        if (attr.name === 'organizationName' || attr.shortName === 'O') {
          razaoSocial = String(attr.value || '')
        }
      }
    }

    // Padrão ICP-Brasil e-CNPJ no Common Name: "RAZAO SOCIAL:12345678000199" ou similar
    const cnpjMatch =
      commonName.match(/(\d{14})/) || commonName.match(/(\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2})/)
    if (cnpjMatch) {
      cnpjTitular = cnpjMatch[1].replace(/\D/g, '')
    }

    return {
      sucesso: true,
      validadeIso,
      validadePocketBase,
      notBefore,
      notAfter,
      cnpjTitular,
      razaoSocial:
        razaoSocial || (commonName.includes(':') ? commonName.split(':')[0].trim() : commonName),
      titularNome: commonName,
    }
  } catch (err: any) {
    const msg = err && err.message ? err.message : String(err)
    console.warn('[extrairMetadadosCertificadoPfx] Falha ao extrair metadados do PKCS#12:', msg)
    return {
      sucesso: false,
      erro: msg,
    }
  }
}
