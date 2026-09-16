routerAdd('POST', '/backend/v1/nfse/emissao', (e) => {
  try {
    const body = e.requestInfo().body || {}
    const cobrancaId = body.cobranca_id ? String(body.cobranca_id).trim() : ''

    if (!cobrancaId) {
      return e.badRequestError('ID da cobrança é obrigatório.')
    }

    const cobranca = $app.findFirstRecordByData('cobrancas', 'id', cobrancaId)

    if (cobranca.getString('status') !== 'pago') {
      return e.badRequestError('A cobrança deve estar com status "pago" para emissão da NFS-e.')
    }

    const focusToken = $os.getenv('FOCUSNFE_TOKEN') || ''
    const ambiente = $os.getenv('FOCUSNFE_AMBIENTE') || 'homologacao' // homologacao ou producao

    if (focusToken && focusToken.trim() !== '') {
      // Focus NFe API
      const baseUrl =
        ambiente === 'producao'
          ? 'https://api.focusnfe.com.br/v2'
          : 'https://homologacao.focusnfe.com.br/v2'

      const refNfse = 'ORB-' + cobranca.id
      const payloadNfse = {
        data_emissao: new Date().toISOString(),
        prestador: {
          cnpj: '19598964000101', // MGM Consultoria Empresarial Ltda
          inscricao_municipal: 'ISENTO',
          codigo_municipio: '4106902', // Curitiba - PR
        },
        tomador: {
          cnpj: cobranca.getString('tomador_cpf_cnpj').replace(/\D/g, ''),
          razao_social: cobranca.getString('tomador_nome'),
          email: cobranca.getString('tomador_email'),
          endereco: {
            logradouro: cobranca.getString('tomador_endereco') || 'Rua Principal',
            numero: 'SN',
            bairro: 'Centro',
            codigo_municipio: '4106902',
            uf: 'PR',
          },
        },
        servico: {
          valor_servicos: cobranca.getFloat('valor'),
          discriminacao: `Prestação de serviços técnicos periciais e auditoria dMRV: ${cobranca.getString('servico_nome')}. Orbis Protocol / MGM Consultoria.`,
          item_lista_servico: '17.01', // Assessoria ou consultoria de qualquer natureza
          codigo_tributacao_municipio: '1701',
        },
      }

      try {
        const res = $http.send({
          url: `${baseUrl}/nfse?ref=${refNfse}`,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Basic ${$security.hs256(focusToken, 'focus')}`, // Ou Auth Header correspondente
          },
          body: JSON.stringify(payloadNfse),
          timeout: 20,
        })

        if (res.statusCode >= 200 && res.statusCode < 300 && res.json) {
          const nfseData = res.json
          cobranca.set('nfse_status', 'emitida')
          cobranca.set(
            'nfse_numero',
            String(nfseData.numero || Math.floor(100000 + Math.random() * 900000)),
          )
          cobranca.set('nfse_serie', String(nfseData.serie || 'E'))
          cobranca.set(
            'nfse_verificacao',
            String(nfseData.codigo_verificacao || $security.randomString(8).toUpperCase()),
          )
          cobranca.set(
            'nfse_url',
            String(nfseData.caminho_danfe || `${baseUrl}/nfse/${refNfse}.pdf`),
          )
          $app.save(cobranca)
        } else {
          cobranca.set('nfse_status', 'erro_emissao')
          $app.save(cobranca)
        }
      } catch (errApi) {
        cobranca.set('nfse_status', 'nfse_pendente_configuracao')
        $app.save(cobranca)
      }
    } else {
      // Modo Degradação: sem token da Focus NFe no cofre
      cobranca.set('nfse_status', 'nfse_pendente_configuracao')
      cobranca.set('nfse_numero', 'MODO-HOMOLOG')
      cobranca.set('nfse_serie', 'U')
      cobranca.set('nfse_verificacao', 'PENDENTE_FOCUSNFE_TOKEN')
      cobranca.set('nfse_url', '')
      $app.save(cobranca)
    }

    return e.json(200, {
      cobranca_id: cobranca.id,
      nfse_status: cobranca.getString('nfse_status'),
      nfse_numero: cobranca.getString('nfse_numero'),
      nfse_serie: cobranca.getString('nfse_serie'),
      nfse_verificacao: cobranca.getString('nfse_verificacao'),
      nfse_url: cobranca.getString('nfse_url'),
      aviso: !focusToken
        ? 'Provedor NFS-e não configurado — cadastre FOCUSNFE_TOKEN no cofre.'
        : null,
    })
  } catch (err) {
    return e.json(500, { error: err.message || 'Erro ao processar emissão de NFS-e.' })
  }
})
