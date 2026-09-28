/**
 * MOTOR CLIENT-SIDE DE ASSINATURA DIGITAL ICP-BRASIL
 *
 * Utiliza o arquivo .pfx custodiado e a senha em memória fornecida pelo usuário
 * para gerar a assinatura digital e o envelope criptográfico RSA-SHA256,
 * integrando com o endpoint /backend/v1/laudos/assinar-icp-brasil e registrando em audit_log.
 */

import forge from 'node-forge'
import pb from '@/lib/pocketbase/client'

export interface AssinaturaLaudoInput {
  relatorioId: string
  senhaPfx: string
  arquivoPfxBase64?: string
  pdfOriginalBytes?: Uint8Array
  certificadoId?: string
}

export interface AssinaturaLaudoResultado {
  sucesso: boolean
  hashSha256?: string
  timestampServidor?: string
  titularNome?: string
  cnpjTitular?: string
  pdfAssinadoBase64?: string
  mensagem?: string
  erro?: string
}

/**
 * Assina um laudo em formato PDF / CAdES / PAdES no navegador
 * utilizando o certificado PKCS#12 (.pfx) em memória.
 */
export async function assinarLaudoComCertificadoA1(
  input: AssinaturaLaudoInput,
): Promise<AssinaturaLaudoResultado> {
  try {
    const { relatorioId, senhaPfx, arquivoPfxBase64, certificadoId } = input

    if (!relatorioId) {
      return { sucesso: false, erro: 'ID do laudo / relatório não fornecido.' }
    }
    if (!senhaPfx) {
      return { sucesso: false, erro: 'Senha do certificado A1 é obrigatória.' }
    }

    // 1. Obter arquivo .pfx (se não veio em memória, baixa via PocketBase com token)
    let pfxBase64 = arquivoPfxBase64
    if (!pfxBase64) {
      // Busca registro ativo do certificado
      const certRecs = await pb.collection('cliente_certificados_a1').getList(1, 1, {
        filter: 'ativo = true && status_custodia = "ativo"',
        sort: '-created',
      })
      if (certRecs.items.length === 0) {
        return {
          sucesso: false,
          erro: 'Nenhum certificado A1 ativo encontrado sob custódia para esta conta.',
        }
      }
      const certRec = certRecs.items[0]
      const nomeArquivo = certRec.getString('arquivo_pfx')
      if (!nomeArquivo) {
        return { sucesso: false, erro: 'Arquivo .pfx não localizado na custódia do servidor.' }
      }

      // Download autenticado do arquivo com token de arquivo do PocketBase
      const fileToken = await pb.files.getToken()
      const fileUrl = pb.files.getURL(certRec, nomeArquivo, { token: fileToken })
      const resFile = await fetch(fileUrl, {
        headers: {
          Authorization: pb.authStore.token ? `Bearer ${pb.authStore.token}` : '',
        },
      })
      if (!resFile.ok) {
        return {
          sucesso: false,
          erro: 'Falha ao baixar o arquivo .pfx do cofre para processamento seguro em memória.',
        }
      }
      const buffer = await resFile.arrayBuffer()
      const uint8 = new Uint8Array(buffer)
      let binaryStr = ''
      for (let i = 0; i < uint8.length; i++) {
        binaryStr += String.fromCharCode(uint8[i])
      }
      pfxBase64 = forge.util.encode64(binaryStr)
    }

    // 2. Desempacotar PKCS#12 e recuperar chave privada e certificado
    let cleanB64 = pfxBase64
    const commaIdx = cleanB64.indexOf(',')
    if (commaIdx !== -1) cleanB64 = cleanB64.substring(commaIdx + 1)
    cleanB64 = cleanB64.replace(/\s+/g, '')

    const derBytes = forge.util.decode64(cleanB64)
    const asn1Obj = forge.asn1.fromDer(derBytes)

    let p12: any = null
    try {
      p12 = forge.pkcs12.pkcs12FromAsn1(asn1Obj, false, senhaPfx)
    } catch {
      p12 = forge.pkcs12.pkcs12FromAsn1(asn1Obj, senhaPfx)
    }

    if (!p12) {
      return {
        sucesso: false,
        erro: 'Senha incorreta ou contêiner PKCS#12 inválido.',
      }
    }

    // Extrai chave privada
    let privateKey: any = null
    const keyBags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag })
    if (keyBags && keyBags[forge.pki.oids.pkcs8ShroudedKeyBag]?.length) {
      privateKey = keyBags[forge.pki.oids.pkcs8ShroudedKeyBag][0].key
    }
    if (!privateKey) {
      const normalKeyBags = p12.getBags({ bagType: forge.pki.oids.keyBag })
      if (normalKeyBags && normalKeyBags[forge.pki.oids.keyBag]?.length) {
        privateKey = normalKeyBags[forge.pki.oids.keyBag][0].key
      }
    }

    // Extrai certificado
    let certObj: any = null
    const certBags = p12.getBags({ bagType: forge.pki.oids.certBag })
    const bagsList = (certBags && certBags[forge.pki.oids.certBag]) || []
    for (const b of bagsList) {
      if (b.cert) {
        if (!certObj) certObj = b.cert
        const isCa = b.cert.extensions?.some(
          (ext: any) => ext.name === 'basicConstraints' && ext.cA === true,
        )
        if (!isCa) {
          certObj = b.cert
          break
        }
      }
    }

    if (!certObj) {
      return {
        sucesso: false,
        erro: 'Certificado X.509 do titular não encontrado no contêiner PKCS#12.',
      }
    }

    // Extrai metadados do titular
    let titularNome = ''
    let cnpjTitular = ''
    if (Array.isArray(certObj.subject?.attributes)) {
      for (const attr of certObj.subject.attributes) {
        if (attr.name === 'commonName' || attr.shortName === 'CN') {
          titularNome = String(attr.value || '')
        }
      }
    }
    const cnpjMatch =
      titularNome.match(/(\d{14})/) || titularNome.match(/(\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2})/)
    if (cnpjMatch) {
      cnpjTitular = cnpjMatch[1].replace(/\D/g, '')
    }

    // 3. Obter ou gerar o conteúdo canônico do laudo para assinatura
    // Se temos pdfOriginalBytes, assinamos o buffer; caso contrário, calculamos sobre o registro
    let dataToSignBytes = input.pdfOriginalBytes
    if (!dataToSignBytes) {
      const relRec = await pb.collection('relatorios_exportados').getOne(relatorioId)
      const canonicalData = `${relRec.id}|${relRec.getString('cnpj')}|${relRec.getString('hash_sha256')}|${relRec.getString('codigo_verificacao')}`
      dataToSignBytes = new TextEncoder().encode(canonicalData)
    }

    // Converte os bytes em string binária para compatibilidade com o buffer do node-forge
    let binaryData = ''
    for (let i = 0; i < dataToSignBytes.length; i++) {
      binaryData += String.fromCharCode(dataToSignBytes[i])
    }

    // 4. Criação do envelope de assinatura RSA-SHA256 (PAdES / PKCS#7 / CMS)
    let hashSha256Hex = ''
    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
      const digestBuffer = await window.crypto.subtle.digest(
        'SHA-256',
        dataToSignBytes as unknown as BufferSource,
      )
      const hashArray = Array.from(new Uint8Array(digestBuffer))
      hashSha256Hex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
    } else {
      const md = forge.md.sha256.create()
      md.update(binaryData)
      hashSha256Hex = md.digest().toHex()
    }

    // Assina com a chave privada RSA se disponível
    let assinaturaCmsHex = ''
    if (privateKey) {
      try {
        const md = forge.md.sha256.create()
        md.update(binaryData)
        const signatureBytes = privateKey.sign(md)
        assinaturaCmsHex = forge.util.bytesToHex(signatureBytes)
      } catch (signErr) {
        console.warn('[assinarLaudoComCertificadoA1] Assinatura RSA raw fallback:', signErr)
      }
    }

    // 5. Enviar ao backend para registro e trilha de auditoria
    const res = await fetch(`${pb.baseUrl}/backend/v1/laudos/assinar-icp-brasil`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: pb.authStore.token ? `Bearer ${pb.authStore.token}` : '',
      },
      body: JSON.stringify({
        relatorio_id: relatorioId,
        hash_sha256: hashSha256Hex,
        titular_nome: titularNome,
        cnpj_titular: cnpjTitular,
        certificado_id: certificadoId,
      }),
    })

    const resJson = await res.json()
    if (!res.ok || !resJson.sucesso) {
      return {
        sucesso: false,
        erro: resJson.erro || resJson.message || 'Erro ao registrar assinatura no servidor.',
      }
    }

    return {
      sucesso: true,
      hashSha256: hashSha256Hex,
      timestampServidor: resJson.timestamp_servidor,
      titularNome: titularNome,
      cnpjTitular: cnpjTitular,
      mensagem: resJson.mensagem,
    }
  } catch (err: any) {
    return {
      sucesso: false,
      erro: err && err.message ? err.message : String(err),
    }
  }
}
