routerAdd('POST', '/backend/v1/lead-diagnostico-submit', (e) => {
  try {
    const body = e.requestInfo().body || {}
    const cnpj = body.cnpj ? String(body.cnpj).trim() : ''
    const razaoSocial = body.razao_social ? String(body.razao_social).trim() : ''

    if (!cnpj || !razaoSocial) {
      return e.badRequestError('CNPJ e Razão Social são obrigatórios.')
    }

    const leadsCol = $app.findCollectionByNameOrId('leads_diagnostico')
    let leadRecord = null

    try {
      leadRecord = $app.findFirstRecordByData('leads_diagnostico', 'cnpj', cnpj)
    } catch (_) {}

    const isNew = !leadRecord
    if (isNew) {
      leadRecord = new Record(leadsCol)
      leadRecord.set('status', 'novo')
      leadRecord.set('origem', body.origem || 'funil')
    }

    leadRecord.set('cnpj', cnpj)
    leadRecord.set('razao_social', razaoSocial)
    leadRecord.set('demonstracao', Boolean(body.demonstracao))
    if (body.email) leadRecord.set('email', String(body.email).trim())
    if (body.whatsapp) leadRecord.set('whatsapp', String(body.whatsapp).trim())
    if (body.responsavel) leadRecord.set('responsavel', String(body.responsavel).trim())
    if (body.categoria_profissional)
      leadRecord.set('categoria_profissional', String(body.categoria_profissional).trim())
    if (body.conselho) leadRecord.set('conselho', String(body.conselho).trim())
    if (body.vinculo_institucional)
      leadRecord.set('vinculo_institucional', String(body.vinculo_institucional).trim())
    if (body.regime_tributario)
      leadRecord.set('regime_tributario', String(body.regime_tributario).trim())
    if (body.consumo_energia) leadRecord.set('consumo_energia', String(body.consumo_energia).trim())
    if (body.frota_propria) leadRecord.set('frota_propria', String(body.frota_propria).trim())
    if (body.inventario_ghg) leadRecord.set('inventario_ghg', String(body.inventario_ghg).trim())
    if (body.iso_14001) leadRecord.set('iso_14001', String(body.iso_14001).trim())
    if (body.faixa_emissoes) leadRecord.set('faixa_emissoes', String(body.faixa_emissoes).trim())
    if (body.enquadramento_sbce)
      leadRecord.set('enquadramento_sbce', String(body.enquadramento_sbce).trim())
    if (body.exporta_ue_cbam) leadRecord.set('exporta_ue_cbam', String(body.exporta_ue_cbam).trim())
    if (body.cbam_bens) leadRecord.set('cbam_bens', String(body.cbam_bens).trim())
    if (body.faixa_impacto_tributario)
      leadRecord.set('faixa_impacto_tributario', String(body.faixa_impacto_tributario).trim())
    if (body.comparativo_tributario_json)
      leadRecord.set('comparativo_tributario_json', body.comparativo_tributario_json)

    // Captura estrita de IP e data/hora server-side para Trilha de Consentimento LGPD
    const reqInfo = e.requestInfo()
    const clientIp =
      reqInfo.headers['x-forwarded-for'] ||
      reqInfo.headers['x-real-ip'] ||
      reqInfo.remoteIP ||
      '127.0.0.1'
    leadRecord.set('consentimento_ip', String(clientIp).split(',')[0].trim())
    leadRecord.set('consentimento_data_hora', new Date().toISOString())
    leadRecord.set(
      'termo_versao',
      body.termo_versao ? String(body.termo_versao).trim() : 'v2026-01',
    )

    if (body.usuario) {
      leadRecord.set('usuario', body.usuario)
    } else if (e.auth && e.auth.id) {
      leadRecord.set('usuario', e.auth.id)
    }

    $app.save(leadRecord)

    return e.json(200, {
      id: leadRecord.id,
      cnpj: leadRecord.getString('cnpj'),
      razao_social: leadRecord.getString('razao_social'),
      status: leadRecord.getString('status'),
      demonstracao: leadRecord.getBool('demonstracao'),
      consentimento_ip: leadRecord.getString('consentimento_ip'),
      consentimento_data_hora: leadRecord.getString('consentimento_data_hora'),
      termo_versao: leadRecord.getString('termo_versao'),
      is_new: isNew,
    })
  } catch (err) {
    return e.json(500, { error: err.message || 'Erro ao registrar lead com trilha LGPD.' })
  }
})
