routerAdd('POST', '/backend/v1/agent-save-lead', (e) => {
  try {
    const body = e.requestInfo().body || {}
    const cnpj = body.cnpj ? String(body.cnpj).trim() : ''
    const razaoSocial = body.razao_social ? String(body.razao_social).trim() : ''

    if (!cnpj && !razaoSocial) {
      return e.badRequestError('CNPJ ou Razão Social é obrigatório para registrar lead.')
    }

    const leadsCol = $app.findCollectionByNameOrId('leads_diagnostico')
    let leadRecord = null

    // Verificar se já existe lead por CNPJ
    if (cnpj) {
      try {
        leadRecord = $app.findFirstRecordByData('leads_diagnostico', 'cnpj', cnpj)
      } catch (_) {}
    }

    const isNew = !leadRecord
    if (isNew) {
      leadRecord = new Record(leadsCol)
      leadRecord.set('status', 'novo')
      leadRecord.set('origem', 'agente_ia')
    }

    if (cnpj) leadRecord.set('cnpj', cnpj)
    if (razaoSocial) leadRecord.set('razao_social', razaoSocial)
    if (body.email) leadRecord.set('email', String(body.email).trim())
    if (body.whatsapp) leadRecord.set('whatsapp', String(body.whatsapp).trim())
    if (body.responsavel) leadRecord.set('responsavel', String(body.responsavel).trim())
    if (body.regime_tributario)
      leadRecord.set('regime_tributario', String(body.regime_tributario).trim())
    if (body.faixa_emissoes) leadRecord.set('faixa_emissoes', String(body.faixa_emissoes).trim())
    if (body.enquadramento_sbce)
      leadRecord.set('enquadramento_sbce', String(body.enquadramento_sbce).trim())
    if (body.exporta_ue_cbam) leadRecord.set('exporta_ue_cbam', String(body.exporta_ue_cbam).trim())
    if (body.cbam_bens) leadRecord.set('cbam_bens', String(body.cbam_bens).trim())
    if (body.faixa_impacto_tributario)
      leadRecord.set('faixa_impacto_tributario', String(body.faixa_impacto_tributario).trim())
    if (body.comparativo_tributario_json)
      leadRecord.set('comparativo_tributario_json', body.comparativo_tributario_json)

    // Se o usuário estiver autenticado, vincula
    if (e.auth && e.auth.id) {
      leadRecord.set('usuario', e.auth.id)
    }

    $app.save(leadRecord)

    return e.json(200, {
      id: leadRecord.id,
      cnpj: leadRecord.getString('cnpj'),
      razao_social: leadRecord.getString('razao_social'),
      faixa_impacto_tributario: leadRecord.getString('faixa_impacto_tributario'),
      origem: leadRecord.getString('origem'),
      is_new: isNew,
    })
  } catch (err) {
    return e.json(500, { error: err.message || 'Erro ao registrar lead do agente.' })
  }
})
