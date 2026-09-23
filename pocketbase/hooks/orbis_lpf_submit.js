routerAdd('POST', '/backend/v1/orbis-lpf-submit', (e) => {
  try {
    const body = e.requestInfo().body || {}
    const cnpjRaw = body.cnpj ? String(body.cnpj).trim() : ''
    const razaoSocial = body.razao_social ? String(body.razao_social).trim() : ''
    const email = body.email ? String(body.email).trim() : ''
    const whatsapp =
      body.whatsapp || body.telefone ? String(body.whatsapp || body.telefone).trim() : ''
    const setor = body.setor ? String(body.setor).trim() : ''
    const volumeExportacao = body.volume_exportacao ? String(body.volume_exportacao).trim() : ''

    if (!cnpjRaw || !razaoSocial || !email) {
      return e.badRequestError('CNPJ, Razão Social e E-mail comercial são obrigatórios.')
    }

    // Normalização dos dígitos do CNPJ
    const cnpjDigits = cnpjRaw.replace(/\D/g, '')
    if (cnpjDigits.length !== 14) {
      return e.badRequestError('CNPJ deve conter 14 dígitos numéricos.')
    }

    // Formatação canônica do CNPJ (XX.XXX.XXX/XXXX-XX)
    const cnpjFormatted = cnpjDigits.replace(
      /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
      '$1.$2.$3/$4-$5',
    )

    const leadsCol = $app.findCollectionByNameOrId('leads_diagnostico')

    // Regra de Negócio: Limite de 1 leitura gratuita por CNPJ
    // Busca por CNPJ formatado ou dígitos brutos
    let existingLead = null
    try {
      existingLead = $app.findFirstRecordByData('leads_diagnostico', 'cnpj', cnpjFormatted)
    } catch (_) {}

    if (!existingLead) {
      try {
        existingLead = $app.findFirstRecordByData('leads_diagnostico', 'cnpj', cnpjDigits)
      } catch (_) {}
    }

    if (existingLead) {
      return e.json(200, {
        ja_solicitado: true,
        message: 'Este CNPJ já solicitou a leitura gratuita — nossa equipe entrará em contato.',
        id: existingLead.id,
      })
    }

    // Novo registro de lead LPF
    const leadRecord = new Record(leadsCol)
    leadRecord.set('cnpj', cnpjFormatted)
    leadRecord.set('razao_social', razaoSocial)
    leadRecord.set('email', email)
    leadRecord.set('whatsapp', whatsapp)
    leadRecord.set('status', 'novo')
    leadRecord.set('origem', 'orbis_lpf')

    // Armazena setor no campo cbam_bens ou categoria_profissional para auditoria
    if (setor) {
      leadRecord.set('cbam_bens', setor)
    }

    if (volumeExportacao) {
      leadRecord.set('volume_exportacao', volumeExportacao)
    }

    // Captura estrita de IP e data/hora server-side para Trilha de Consentimento LGPD
    const reqInfo = e.requestInfo()
    const clientIp =
      reqInfo.headers['x-forwarded-for'] ||
      reqInfo.headers['x-real-ip'] ||
      reqInfo.remoteIP ||
      '127.0.0.1'
    leadRecord.set('consentimento_ip', String(clientIp).split(',')[0].trim())
    leadRecord.set('consentimento_data_hora', new Date().toISOString())
    leadRecord.set('termo_versao', 'orbis_lpf_v1')

    if (e.auth && e.auth.id) {
      leadRecord.set('usuario', e.auth.id)
    }

    $app.save(leadRecord)

    return e.json(201, {
      ja_solicitado: false,
      message: 'Solicitação de leitura pré-faturamento enviada com sucesso.',
      id: leadRecord.id,
      cnpj: leadRecord.getString('cnpj'),
      razao_social: leadRecord.getString('razao_social'),
    })
  } catch (err) {
    return e.json(500, { error: err.message || 'Erro ao processar solicitação Orbis LPF.' })
  }
})
