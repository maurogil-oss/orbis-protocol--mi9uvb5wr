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

    // Criptografa a senha com chave segura no servidor
    const secretKey = $os.getenv('PB_SUPERUSER_TOKEN') || 'orbis_protocol_safe_key_32chars_min'
    let senhaCifrada = ''
    if (senhaRaw) {
      senhaCifrada = $security.encrypt(senhaRaw, secretKey)
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
    const agoraIso = new Date().toISOString()

    certRec.set('cnpj_titular', cnpjTitular)
    if (razaoSocial) certRec.set('razao_social', razaoSocial)
    if (senhaCifrada) certRec.set('senha_cifrada', senhaCifrada)
    certRec.set('ativo', true)
    certRec.set('status_custodia', 'ativo')
    certRec.set('termo_lgpd_aceito', true)
    certRec.set('data_aceite_lgpd', agoraIso)
    certRec.set('termo_versao', termoVersao)
    certRec.set('consentimento_ip', String(clientIp).split(',')[0].trim())
    certRec.set('consentimento_data_hora', agoraIso)
    certRec.set('data_revogacao', '')
    certRec.set('motivo_revogacao', '')

    $app.save(certRec)

    return e.json(200, {
      sucesso: true,
      mensagem:
        'Certificado A1 aceito e custodiado sob Termo de Responsabilidade e Sigilo Fiscal (Modo Read-Only). Senha cifrada AES-256 no cofre do servidor.',
      certificado_id: certRec.id,
      cnpj_titular: cnpjTitular,
      ativo: true,
      status_custodia: 'ativo',
      termo_versao: termoVersao,
      consentimento_ip: certRec.getString('consentimento_ip'),
      consentimento_data_hora: agoraIso,
    })
  } catch (err) {
    return e.json(500, {
      sucesso: false,
      erro: err.message || 'Erro ao processar certificado A1.',
    })
  }
})
