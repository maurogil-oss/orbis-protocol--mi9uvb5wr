routerAdd('POST', '/backend/v1/infosimples/consultar-nfe', (e) => {
  try {
    const authRecord = e.auth
    if (!authRecord) {
      return e.json(401, {
        sucesso: false,
        degradacao: false,
        erro: 'Autenticação necessária para consultar a API InfoSimples.',
      })
    }

    const body = e.requestInfo().body || {}
    const chaveAcessoRaw = body.chave_acesso ? String(body.chave_acesso).replace(/\D/g, '') : ''

    if (!chaveAcessoRaw || chaveAcessoRaw.length !== 44) {
      return e.badRequestError(
        'Chave de acesso inválida. A chave de NF-e deve conter exatamente 44 dígitos numéricos.',
      )
    }

    const token = $os.getenv('INFOSIMPLES_TOKEN') || ''
    const tokenConfigurado = Boolean(token && token.trim().length > 0)

    // Se o token não estiver configurado no cofre do Skip Cloud, ativa o Modo Degradação Elegante
    if (!tokenConfigurado) {
      // Registra a tentativa para auditoria interna
      try {
        const consultasCol = $app.findCollectionByNameOrId('infosimples_consultas')
        const recAudit = new Record(consultasCol)
        recAudit.set('usuario', authRecord.id)
        recAudit.set('chave_acesso', chaveAcessoRaw)
        recAudit.set('status', 'token_ausente')
        recAudit.set('codigo_retorno', 503)
        recAudit.set(
          'mensagem_retorno',
          'Modo degradação ativo: credencial INFOSIMPLES_TOKEN não configurada no cofre de segredos.',
        )
        recAudit.set('custo_creditos', 0)
        recAudit.set('usou_certificado_a1', false)
        recAudit.set('resposta_json', {
          modo: 'degradacao',
          motivo: 'Token de integração InfoSimples pendente de provisionamento.',
          fallback: 'Upload manual de arquivo XML ativo.',
        })
        $app.save(recAudit)
      } catch (_) {}

      return e.json(200, {
        sucesso: false,
        degradacao: true,
        token_configurado: false,
        codigo: 503,
        mensagem:
          'Integração InfoSimples em modo de degradação planejado: o segredo INFOSIMPLES_TOKEN ainda não foi provisionado no cofre da nuvem. O upload manual de arquivos XML continua funcionando normalmente.',
        chave_acesso: chaveAcessoRaw,
      })
    }

    // Token configurado: chamada ao endpoint oficial da InfoSimples
    const endpoint = 'https://api.infosimples.com/api/v2/consultas/receita-federal-nfe'
    const payload = {
      token: token,
      nfe: chaveAcessoRaw,
    }

    let usouCertificado = false
    if (body.usar_certificado_a1) {
      try {
        const certRec = $app.findFirstRecordByData(
          'cliente_certificados_a1',
          'usuario',
          authRecord.id,
        )
        if (certRec && certRec.getBool('ativo')) {
          const secretKey =
            $os.getenv('PB_SUPERUSER_TOKEN') || 'orbis_protocol_safe_key_32chars_min'
          const passRaw = certRec.getString('senha_cifrada')
            ? $security.decrypt(certRec.getString('senha_cifrada'), secretKey)
            : ''
          payload.pkcs12_pass = passRaw
          usouCertificado = true
        }
      } catch (_) {}
    }

    // Dispara requisição HTTP à InfoSimples
    const httpRes = $http.send({
      url: endpoint,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      timeout: 30,
    })

    const resJson = httpRes.json || {}
    const statusCode = httpRes.statusCode
    const code = resJson.code !== undefined ? resJson.code : statusCode
    const codeMessage = resJson.code_message || resJson.message || 'Consulta finalizada'

    // Custos da consulta (InfoSimples tabela 0.06 créditos padrão para NF-e)
    const custoCreditos = resJson.total_price !== undefined ? Number(resJson.total_price) : 0.06

    // Verifica se retornou dados de nota
    let notaData = null
    if (Array.isArray(resJson.data) && resJson.data.length > 0) {
      notaData = resJson.data[0]
    } else if (resJson.data && typeof resJson.data === 'object') {
      notaData = resJson.data
    }

    // Se a consulta foi bem sucedida (InfoSimples code 200 normal)
    const isSuccess = statusCode === 200 && (code === 200 || code === 201)

    // Grava registro na coleção de auditoria e custos infosimples_consultas
    let consultaRecId = ''
    try {
      const consultasCol = $app.findCollectionByNameOrId('infosimples_consultas')
      const recAudit = new Record(consultasCol)
      recAudit.set('usuario', authRecord.id)
      recAudit.set('chave_acesso', chaveAcessoRaw)
      recAudit.set('status', isSuccess ? 'sucesso' : 'erro_api')
      recAudit.set('codigo_retorno', Number(code) || statusCode)
      recAudit.set('mensagem_retorno', String(codeMessage).slice(0, 500))
      recAudit.set('custo_creditos', custoCreditos)
      recAudit.set('usou_certificado_a1', usouCertificado)
      recAudit.set('resposta_json', resJson)
      $app.save(recAudit)
      consultaRecId = recAudit.id
    } catch (_) {}

    // Se houve sucesso e retornou dados da NF-e, normaliza e persiste em nfe_upload
    let nfeUploadId = ''
    if (isSuccess && notaData) {
      try {
        const nfeInfo = notaData.nfe || {}
        const emitInfo = notaData.emitente || {}
        const destInfo = notaData.destinatario || {}
        const totaisInfo = notaData.totais || {}
        const produtosList = Array.isArray(notaData.produtos) ? notaData.produtos : []

        const nfeCol = $app.findCollectionByNameOrId('nfe_upload')
        const nfeRec = new Record(nfeCol)
        nfeRec.set('usuario', authRecord.id)
        nfeRec.set('chave_acesso', chaveAcessoRaw)
        nfeRec.set('numero_nota', String(nfeInfo.numero || ''))
        nfeRec.set('serie', String(nfeInfo.serie || '1'))
        nfeRec.set('modelo', String(nfeInfo.modelo || '55'))
        nfeRec.set('data_emissao', String(nfeInfo.data_emissao || new Date().toISOString()))
        nfeRec.set('cnpj_emitente', String(emitInfo.cnpj || ''))
        nfeRec.set('nome_emitente', String(emitInfo.nome || emitInfo.nome_fantasia || ''))
        nfeRec.set('cnpj_destinatario', String(destInfo.cnpj || destInfo.cpf || ''))
        nfeRec.set('nome_destinatario', String(destInfo.nome || ''))

        const vTotal = Number(totaisInfo.valor_nfe || totaisInfo.normalizado_valor_nfe || 0)
        const vIcms = Number(totaisInfo.valor_icms || totaisInfo.normalizado_valor_icms || 0)
        const vIpi = Number(totaisInfo.valor_ipi || totaisInfo.normalizado_valor_ipi || 0)
        const vPis = Number(totaisInfo.valor_pis || totaisInfo.normalizado_valor_pis || 0)
        const vCofins = Number(totaisInfo.valor_cofins || totaisInfo.normalizado_valor_cofins || 0)

        nfeRec.set('valor_total_nf', vTotal)
        nfeRec.set('valor_icms', vIcms)
        nfeRec.set('valor_ipi', vIpi)
        nfeRec.set('valor_pis', vPis)
        nfeRec.set('valor_cofins', vCofins)
        nfeRec.set('qtd_itens', produtosList.length)
        nfeRec.set('resumo_itens_json', produtosList.slice(0, 15))
        nfeRec.set('nome_arquivo', 'InfoSimples_API_' + chaveAcessoRaw.slice(0, 8) + '.json')
        nfeRec.set('origem', 'infosimples')
        nfeRec.set('modelo_fiscal', '55_nfe')
        nfeRec.set('dados_adicionais_json', {
          consulta_id: consultaRecId,
          completa: Boolean(notaData.nfe_completa),
          situacao: nfeInfo.situacao || 'Autorizada',
        })

        $app.save(nfeRec)
        nfeUploadId = nfeRec.id
      } catch (_) {}
    }

    return e.json(200, {
      sucesso: isSuccess,
      degradacao: false,
      token_configurado: true,
      chave_acesso: chaveAcessoRaw,
      codigo: code,
      mensagem: codeMessage,
      custo_creditos: custoCreditos,
      consulta_id: consultaRecId,
      nfe_upload_id: nfeUploadId,
      dados: notaData,
    })
  } catch (err) {
    return e.json(500, {
      sucesso: false,
      degradacao: false,
      erro: err.message || 'Erro interno no proxy InfoSimples.',
    })
  }
})
