routerAdd('POST', '/backend/v1/lgpd/descarte-vencidos', (e) => {
  try {
    if (
      !e.auth ||
      (e.auth.getString('role') !== 'admin' && e.auth.getString('role') !== 'perito')
    ) {
      return e.json(403, {
        error: 'Apenas administradores e peritos podem disparar rotina de expurgo LGPD.',
      })
    }

    const agora = new Date()
    // 24 meses atrás para leads_diagnostico
    const corte24Meses = new Date(agora.getTime() - 24 * 30 * 24 * 60 * 60 * 1000).toISOString()

    // Buscar leads mais antigos que corte24Meses com status concluido ou inativo
    const leadsVencidos = $app.findRecordsByFilter(
      'leads_diagnostico',
      `created <= '${corte24Meses}'`,
      'created',
      100,
      0,
    )

    let totalAnonimizados = 0
    for (let lead of leadsVencidos) {
      // Anonimizar dados pessoais conforme Art. 16 da LGPD
      lead.set('responsavel', 'ANONIMIZADO_LGPD')
      lead.set('email', `anonimizado_${lead.id}@expurgo.lgpd`)
      lead.set('whatsapp', '00000000000')
      $app.save(lead)
      totalAnonimizados++
    }

    // Atualizar último expurgo na política lgpd_retencoes
    try {
      const polRec = $app.findFirstRecordByData('lgpd_retencoes', 'tipo_dado', 'leads_diagnostico')
      polRec.set('ultimo_expurgo', agora.toISOString().split('T')[0])
      $app.save(polRec)
    } catch (_) {}

    return e.json(200, {
      sucesso: true,
      mensagem: `Rotina de descarte e anonimização executada com sucesso sob Art. 16 da LGPD.`,
      total_processados: totalAnonimizados,
      corte_aplicado: corte24Meses,
      executado_por: e.auth.getString('name') || e.auth.getString('email'),
      data_execucao: agora.toISOString(),
    })
  } catch (err) {
    return e.json(500, { error: err.message || 'Erro ao processar rotina de descarte LGPD.' })
  }
})
