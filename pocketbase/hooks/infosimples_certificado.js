routerAdd('POST', '/backend/v1/infosimples/salvar-certificado-a1', (e) => {
  try {
    const authRecord = e.auth
    if (!authRecord) {
      return e.json(401, {
        sucesso: false,
        erro: 'Autenticação necessária para gerenciar certificado digital.',
      })
    }

    const body = e.requestInfo().body || {}
    const cnpjTitular = body.cnpj_titular ? String(body.cnpj_titular).replace(/\D/g, '') : ''
    const razaoSocial = body.razao_social ? String(body.razao_social).trim() : ''
    const senhaRaw = body.senha ? String(body.senha) : ''
    const termoLgpdAceito = Boolean(body.termo_lgpd_aceito)
    const arquivoBase64Raw = body.arquivo_base64 ? String(body.arquivo_base64) : ''
    const arquivoNomeOriginal = body.arquivo_nome
      ? String(body.arquivo_nome).trim()
      : 'certificado.pfx'

    // Helper interno para formatar datas no padrão obrigatório do PocketBase v0.36: "YYYY-MM-DD HH:mm:ss.000Z"
    const formatarDataPb = (dataInput) => {
      if (!dataInput) return ''
      let d = null
      if (dataInput instanceof Date) {
        d = dataInput
      } else {
        const s = String(dataInput).trim()
        if (!s) return ''
        d = new Date(s)
      }
      if (!d || isNaN(d.getTime())) return ''
      const pad = (n, len = 2) => String(n).padStart(len, '0')
      const ano = d.getUTCFullYear()
      const mes = pad(d.getUTCMonth() + 1)
      const dia = pad(d.getUTCDate())
      const hora = pad(d.getUTCHours())
      const min = pad(d.getUTCMinutes())
      const seg = pad(d.getUTCSeconds())
      const ms = pad(d.getUTCMilliseconds(), 3)
      return `${ano}-${mes}-${dia} ${hora}:${min}:${seg}.${ms}Z`
    }

    if (!cnpjTitular || cnpjTitular.length !== 14) {
      return e.badRequestError(
        'CNPJ do titular do certificado é obrigatório e deve ter 14 dígitos.',
      )
    }

    if (!termoLgpdAceito) {
      return e.badRequestError(
        'É obrigatório aceitar expressamente o Termo de Consentimento LGPD para custódia segura de credenciais de certificado A1.',
      )
    }

    // Processamento do arquivo .pfx (PKCS#12) se enviado em base64
    let arquivoFileObject = null
    let validadeExtraidaIso = ''
    let nomeArquivoSalvo = ''

    if (arquivoBase64Raw) {
      // 1. Limpa cabeçalho data:...;base64, se houver
      let cleanB64 = arquivoBase64Raw
      const commaIdx = cleanB64.indexOf(',')
      if (commaIdx !== -1) {
        cleanB64 = cleanB64.substring(commaIdx + 1)
      }
      cleanB64 = cleanB64.replace(/\s+/g, '')

      // 2. Validação de tamanho: limite 5 MB (base64 ~6.8 MB)
      const tamEstimadoBytes = Math.ceil((cleanB64.length * 3) / 4)
      if (tamEstimadoBytes > 5242880) {
        return e.badRequestError(
          'Arquivo excede o limite máximo permitido de 5 MB para certificados A1.',
        )
      }

      // 3. Conversão de Base64 para byte array compatível com Goja/PocketBase JSVM
      const b64Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
      const b64WithoutPad = cleanB64.replace(/=/g, '')
      let paddedB64 = b64WithoutPad
      while (paddedB64.length % 4 !== 0) {
        paddedB64 += 'A'
      }

      const bytes = []
      let charIdx = 0
      while (charIdx < paddedB64.length) {
        const c1 = b64Chars.indexOf(paddedB64.charAt(charIdx++))
        const c2 = b64Chars.indexOf(paddedB64.charAt(charIdx++))
        const c3 = b64Chars.indexOf(paddedB64.charAt(charIdx++))
        const c4 = b64Chars.indexOf(paddedB64.charAt(charIdx++))

        if (c1 === -1 || c2 === -1 || c3 === -1 || c4 === -1) {
          return e.badRequestError('Formato de codificação base64 inválido.')
        }

        const bits24 = (c1 << 18) | (c2 << 12) | (c3 << 6) | c4
        const b1 = (bits24 >> 16) & 0xff
        const b2 = (bits24 >> 8) & 0xff
        const b3 = bits24 & 0xff

        bytes.push(b1)
        if (charIdx - 2 < b64WithoutPad.length) {
          bytes.push(b2)
        }
        if (charIdx - 1 < b64WithoutPad.length) {
          bytes.push(b3)
        }
      }

      if (bytes.length < 32) {
        return e.badRequestError(
          'Arquivo .pfx corrompido ou muito pequeno para ser um certificado PKCS#12 válido.',
        )
      }

      // 4. Validação do formato PKCS#12 (ASN.1 SEQUENCE: primeiro byte 0x30)
      if (bytes[0] !== 0x30) {
        return e.badRequestError(
          'Arquivo não é um contêiner PKCS#12 (.pfx/.p12) válido (estrutura ASN.1 inválida).',
        )
      }

      // 5. Tentativa de extrair a data de validade (NotAfter) do certificado contido no PKCS#12
      // Em certificados ICP-Brasil e X.509 padrão, o validity contém notBefore e notAfter em UTCTime ou GeneralizedTime
      try {
        const dateCandidates = []
        for (let i = 0; i < bytes.length - 14; i++) {
          const tag = bytes[i]
          // UTCTime: tag 0x17, comprimento normalmente 13 (YYMMDDHHMMSSZ) ou 15/17
          if (tag === 0x17) {
            const len = bytes[i + 1]
            if (len >= 13 && len <= 17 && i + 2 + len <= bytes.length) {
              let s = ''
              for (let k = 0; k < len; k++) {
                s += String.fromCharCode(bytes[i + 2 + k])
              }
              const mUtc = /^(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})?Z$/.exec(s)
              if (mUtc) {
                const yy = parseInt(mUtc[1], 10)
                const fullYear = yy < 50 ? 2000 + yy : 1900 + yy
                const mm = parseInt(mUtc[2], 10) - 1
                const dd = parseInt(mUtc[3], 10)
                const hh = parseInt(mUtc[4], 10)
                const min = parseInt(mUtc[5], 10)
                const sec = mUtc[6] ? parseInt(mUtc[6], 10) : 0
                const d = new Date(Date.UTC(fullYear, mm, dd, hh, min, sec))
                if (!isNaN(d.getTime())) {
                  dateCandidates.push(d)
                }
              }
            }
          }
          // GeneralizedTime: tag 0x18, comprimento normalmente 15 (YYYYMMDDHHMMSSZ)
          if (tag === 0x18) {
            const len = bytes[i + 1]
            if (len >= 15 && len <= 20 && i + 2 + len <= bytes.length) {
              let s = ''
              for (let k = 0; k < len; k++) {
                s += String.fromCharCode(bytes[i + 2 + k])
              }
              const mGen = /^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})?Z$/.exec(s)
              if (mGen) {
                const fullYear = parseInt(mGen[1], 10)
                const mm = parseInt(mGen[2], 10) - 1
                const dd = parseInt(mGen[3], 10)
                const hh = parseInt(mGen[4], 10)
                const min = parseInt(mGen[5], 10)
                const sec = mGen[6] ? parseInt(mGen[6], 10) : 0
                const d = new Date(Date.UTC(fullYear, mm, dd, hh, min, sec))
                if (!isNaN(d.getTime())) {
                  dateCandidates.push(d)
                }
              }
            }
          }
        }

        // Se encontrou datas, a validade do certificado titular é geralmente a data futura mais distante
        if (dateCandidates.length > 0) {
          dateCandidates.sort((a, b) => b.getTime() - a.getTime())
          const maiorData = dateCandidates[0]
          // Validade precisa ser razoável (após ano 2020 e antes de 2050)
          if (maiorData.getUTCFullYear() >= 2020 && maiorData.getUTCFullYear() <= 2050) {
            validadeExtraidaIso = maiorData.toISOString()
          }
        }
      } catch (dateErr) {
        console.log(
          '[Certificado A1] Não foi possível extrair validade automaticamente: ' +
            (dateErr.message || ''),
        )
      }

      // 6. Sanitização rigorosa do nome do arquivo e extensão .pfx para compatibilidade de MIME
      let nomeBase = arquivoNomeOriginal.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/_{2,}/g, '_')
      if (nomeBase.toLowerCase().endsWith('.p12')) {
        nomeBase = nomeBase.slice(0, -4) + '.pfx'
      } else if (!nomeBase.toLowerCase().endsWith('.pfx')) {
        nomeBase = nomeBase.replace(/\.[^/.]+$/, '') + '.pfx'
      }
      nomeArquivoSalvo = nomeBase || 'certificado.pfx'

      try {
        if (typeof $filesystem !== 'undefined' && typeof $filesystem.fileFromBytes === 'function') {
          arquivoFileObject = $filesystem.fileFromBytes(bytes, nomeArquivoSalvo)
        }
      } catch (fsErr) {
        console.error(
          '[Certificado A1] Erro ao instanciar $filesystem.fileFromBytes: ' + (fsErr.message || ''),
        )
      }
    }

    // Criptografa a senha com chave segura no servidor (derivada com SHA-256 para garantir 32 bytes exatos para AES-256)
    const rawSecret = $os.getenv('PB_SUPERUSER_TOKEN') || 'orbis_protocol_safe_key_32chars_min'
    const derivedKey = $security.sha256(rawSecret).slice(0, 32)
    let senhaCifrada = ''
    if (senhaRaw) {
      senhaCifrada = $security.encrypt(senhaRaw, derivedKey)
    }

    const certCol = $app.findCollectionByNameOrId('cliente_certificados_a1')
    let certRec = null

    try {
      certRec = $app.findFirstRecordByData('cliente_certificados_a1', 'usuario', authRecord.id)
    } catch (_) {}

    const isNew = !certRec
    if (isNew) {
      certRec = new Record(certCol)
      certRec.set('usuario', authRecord.id)
    }

    // Captura IP e data/hora server-side para Trilha de Consentimento do Termo de Custódia
    const reqInfo = e.requestInfo()
    const clientIp =
      reqInfo.headers['x-forwarded-for'] ||
      reqInfo.headers['x-real-ip'] ||
      reqInfo.remoteIP ||
      '127.0.0.1'
    const termoVersao = body.termo_versao ? String(body.termo_versao).trim() : 'v2026-01'
    const agoraDate = new Date()
    const dataAceitePb = formatarDataPb(agoraDate)

    certRec.set('cnpj_titular', cnpjTitular)
    if (razaoSocial) certRec.set('razao_social', razaoSocial)
    if (senhaCifrada) certRec.set('senha_cifrada', senhaCifrada)
    if (arquivoFileObject) {
      certRec.set('arquivo_pfx', arquivoFileObject)
    }
    if (validadeExtraidaIso) {
      certRec.set('validade_certificado', formatarDataPb(validadeExtraidaIso))
    } else if (body.validade_certificado) {
      certRec.set('validade_certificado', formatarDataPb(body.validade_certificado))
    }

    certRec.set('ativo', true)
    certRec.set('status_custodia', 'ativo')
    certRec.set('termo_lgpd_aceito', true)
    certRec.set('data_aceite_lgpd', dataAceitePb)
    certRec.set('termo_versao', termoVersao)
    certRec.set('consentimento_ip', String(clientIp).split(',')[0].trim())
    certRec.set('consentimento_data_hora', dataAceitePb)
    certRec.set('data_revogacao', '')
    certRec.set('motivo_revogacao', '')

    $app.save(certRec)

    // Nome final do arquivo salvo na coleção
    const arquivoSalvoFinal = certRec.getString('arquivo_pfx') || nomeArquivoSalvo
    const validadeSalvaFinal = certRec.getString('validade_certificado') || validadeExtraidaIso

    return e.json(200, {
      sucesso: true,
      mensagem:
        'Certificado A1 aceito e custodiado sob Termo de Responsabilidade e Sigilo Fiscal (Modo Read-Only). Senha cifrada AES-256 no cofre do servidor.',
      certificado_id: certRec.id,
      cnpj_titular: cnpjTitular,
      razao_social: razaoSocial || certRec.getString('razao_social'),
      arquivo_pfx: arquivoSalvoFinal,
      validade_certificado: validadeSalvaFinal,
      ativo: true,
      status_custodia: 'ativo',
      termo_versao: termoVersao,
      consentimento_ip: certRec.getString('consentimento_ip'),
      consentimento_data_hora: dataAceitePb,
    })
  } catch (err) {
    console.error(
      '[salvar-certificado-a1] ERRO NA GRAVAÇÃO:',
      err ? err.message : err,
      err && err.response ? JSON.stringify(err.response) : '',
      err && err.data ? JSON.stringify(err.data) : '',
      err && err.stack ? err.stack : '',
    )
    return e.json(500, {
      sucesso: false,
      erro: err && err.message ? err.message : 'Erro ao processar certificado A1.',
    })
  }
})
