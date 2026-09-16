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

    certRec.set('cnpj_titular', cnpjTitular)
    if (razaoSocial) certRec.set('razao_social', razaoSocial)
    if (senhaCifrada) certRec.set('senha_cifrada', senhaCifrada)
    certRec.set('ativo', true)
    certRec.set('termo_lgpd_aceito', true)
    certRec.set('data_aceite_lgpd', new Date().toISOString())

    $app.save(certRec)

    return e.json(200, {
      sucesso: true,
      mensagem:
        'Configurações do Certificado A1 salvas com segurança. Senha cifrada e restrita ao CNPJ titular.',
      certificado_id: certRec.id,
      cnpj_titular: cnpjTitular,
      ativo: true,
    })
  } catch (err) {
    return e.json(500, {
      sucesso: false,
      erro: err.message || 'Erro ao processar certificado A1.',
    })
  }
})
