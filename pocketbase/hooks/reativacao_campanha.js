/**
 * HOOK & CRON DIÁRIO DE CAMPANHA DE REATIVAÇÃO POR E-MAIL (Orbis Protocol)
 *
 * NOTA DE ARQUITETURA POCKETBASE JSVM:
 * Cada callback registrado em cronAdd e routerAdd roda em uma instância isolada da VM goja.
 * Todas as funções auxiliares devem ficar INLINE dentro do corpo de cada callback.
 *
 * 1. Disparo diário agendado via cronAdd('reativacao_diaria_orbis', '0 8 * * *')
 * 2. POST /backend/v1/reativacao/executar-job (trigger manual para admins/master)
 * 3. POST /backend/v1/reativacao/opt-out (descadastro público com token HMAC/SHA256)
 * 4. GET /backend/v1/reativacao/opt-out/consultar (verificação pública do token)
 */

// 1. CRON DIÁRIO ÀS 08:00 UTC (0 8 * * *)
cronAdd('reativacao_diaria_orbis', '0 8 * * *', () => {
  try {
    const agora = new Date()
    const hojeIso = agora.toISOString().split('T')[0]
    const trintaDiasMs = 30 * 24 * 60 * 60 * 1000

    const enviosCol = $app.findCollectionByNameOrId('reativacao_envios')
    const todosUsuarios = $app.findRecordsByFilter('users', 'id != ""', 'created', 1000, 0)

    for (let i = 0; i < todosUsuarios.length; i++) {
      const u = todosUsuarios[i]
      const uId = u.id
      const uEmail = u.getString('email') || ''
      const uNome = u.getString('name') || 'Cliente'
      const uCnpj = u.getString('cnpj') || ''
      const optOut = u.getBool('opt_out_reativacao')

      if (optOut) continue
      if (!uEmail || uEmail.indexOf('@') === -1) continue
      if (uEmail.indexOf('visitante-ia@') !== -1) continue

      // Deduplicação 30 dias
      let enviosAnteriores = []
      try {
        enviosAnteriores = $app.findRecordsByFilter(
          'reativacao_envios',
          `usuario = "${uId}"`,
          '-created',
          10,
          0,
        )
      } catch (_) {}

      let bloqueado = false
      for (let k = 0; k < enviosAnteriores.length; k++) {
        const envio = enviosAnteriores[k]
        const diffMs = agora.getTime() - new Date(envio.getString('created')).getTime()
        if (envio.getString('status') === 'enviado' && diffMs < trintaDiasMs) {
          bloqueado = true
          break
        }
        const dataEnvioDia =
          envio.getString('data_envio') || envio.getString('created').split('T')[0]
        if (envio.getString('status') === 'falha' && dataEnvioDia === hojeIso) {
          bloqueado = true
          break
        }
      }
      if (bloqueado) continue

      // Acervo
      let nfeCount = 0
      let nfeUltimaData = null
      let infosimplesCount = 0
      let infosimplesUltimaData = null
      let cdvCount = 0
      let cdvUltimaData = null
      let relatoriosCount = 0
      let relatoriosAssinados = 0
      let relatoriosUltimaData = null

      try {
        const nfes = $app.findRecordsByFilter(
          'nfe_upload',
          `usuario = "${uId}" || (cnpj_emitente != "" && cnpj_emitente = "${uCnpj}")`,
          '-created',
          500,
          0,
        )
        nfeCount = nfes.length
        if (nfes.length > 0) nfeUltimaData = new Date(nfes[0].getString('created'))
      } catch (_) {}

      try {
        const infos = $app.findRecordsByFilter(
          'infosimples_consultas',
          `usuario = "${uId}"`,
          '-created',
          500,
          0,
        )
        infosimplesCount = infos.length
        if (infos.length > 0) infosimplesUltimaData = new Date(infos[0].getString('created'))
      } catch (_) {}

      if (uCnpj) {
        try {
          const lotes = $app.findRecordsByFilter(
            'cdv_lotes',
            `cdv_cnpj = "${uCnpj}"`,
            '-created',
            500,
            0,
          )
          cdvCount = lotes.length
          if (lotes.length > 0) cdvUltimaData = new Date(lotes[0].getString('created'))
        } catch (_) {}
      }

      try {
        const rels = $app.findRecordsByFilter(
          'relatorios_exportados',
          `usuario = "${uId}" || (cnpj != "" && cnpj = "${uCnpj}")`,
          '-created',
          500,
          0,
        )
        relatoriosCount = rels.length
        for (let r = 0; r < rels.length; r++) {
          if (rels[r].getBool('assinado_icp_brasil')) relatoriosAssinados++
        }
        if (rels.length > 0) relatoriosUltimaData = new Date(rels[0].getString('created'))
      } catch (_) {}

      const datas = [
        nfeUltimaData,
        infosimplesUltimaData,
        cdvUltimaData,
        relatoriosUltimaData,
      ].filter(Boolean)
      let ultimaAtiv = null
      if (datas.length > 0) {
        datas.sort((a, b) => b.getTime() - a.getTime())
        ultimaAtiv = datas[0]
      } else {
        ultimaAtiv = new Date(u.getString('created'))
      }

      const diffDias = Math.floor((agora.getTime() - ultimaAtiv.getTime()) / (1000 * 60 * 60 * 24))
      let toque = null
      if (diffDias >= 60) {
        toque = 'd60'
      } else if (diffDias >= 30) {
        toque = 'd30'
      } else {
        continue
      }

      const tokenOptOut = $security.sha256(`${uId}|${uEmail}|orbis_optout_salt_2026`).slice(0, 32)
      const siteUrl = ($os.getenv('SITE_URL') || 'https://www.orbis-protocol.com').replace(
        /\/$/,
        '',
      )
      const optOutUrl = `${siteUrl}/preferencias?token=${encodeURIComponent(tokenOptOut)}&uid=${encodeURIComponent(uId)}`
      const painelUrl = `${siteUrl}/painel`
      const contatoUrl = `${siteUrl}/canal-titular`
      const dataUltLote = cdvUltimaData
        ? cdvUltimaData.toLocaleDateString('pt-BR')
        : nfeUltimaData
          ? nfeUltimaData.toLocaleDateString('pt-BR')
          : 'N/A'

      const snapshot = {
        nfe_consultadas: nfeCount,
        infosimples_consultas: infosimplesCount,
        lotes_cdv: cdvCount,
        laudos_exportados: relatoriosCount,
        laudos_assinados_icp: relatoriosAssinados,
        laudos_pendentes: Math.max(0, nfeCount > 0 && relatoriosCount === 0 ? 1 : 0),
        ultima_atividade_data: ultimaAtiv.toISOString(),
        dias_inatividade: diffDias,
        ultimo_lote_data_formatada: dataUltLote,
        cnpj: uCnpj,
      }

      let assunto = ''
      let html = ''

      if (toque === 'd30') {
        assunto = 'Sua conta Orbis Protocol tem provas esperando por você'
        html = `
          <!DOCTYPE html>
          <html lang="pt-BR">
          <head><meta charset="utf-8"><title>${assunto}</title></head>
          <body style="margin: 0; padding: 24px 12px; background-color: #0A1628; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #F8FAFC;">
            <table align="center" width="100%" style="max-width: 600px; background-color: #0E1A2E; border: 1px solid #1e293b; border-radius: 12px; overflow: hidden; padding: 32px 24px;">
              <tr><td>
                <div style="border-bottom: 1px solid #1e293b; padding-bottom: 20px; margin-bottom: 24px;">
                  <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #12B886; font-weight: bold; display: block; margin-bottom: 6px;">
                    ORBIS PROTOCOL • GESTÃO DE ACERVO PROBATÓRIO
                  </span>
                  <h1 style="margin: 0; font-size: 20px; color: #F8FAFC; font-weight: 800; line-height: 1.3;">
                    Sua conta tem dados e evidências aguardando consolidação
                  </h1>
                  <p style="margin: 8px 0 0 0; color: #94A3B8; font-size: 13px;">
                    Olá, <strong>${uNome}</strong> (${uCnpj || 'Conta Corporativa'})
                  </p>
                </div>
                <p style="margin: 0 0 16px 0; color: #cbd5e1; font-size: 14px; line-height: 1.6;">
                  Notamos que faz ${diffDias} dias desde seu último acesso à plataforma. Seu acervo probatório está seguro e estruturado em nosso cofre de dados:
                </p>
                <div style="background-color: #0A1628; border: 1px solid #1e293b; border-left: 4px solid #12B886; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
                  <table width="100%" style="font-size: 13px; color: #e2e8f0; line-height: 1.8;">
                    <tr><td style="color: #94A3B8;">Documentos / NF-e consultadas:</td><td align="right"><strong>${nfeCount}</strong></td></tr>
                    <tr><td style="color: #94A3B8;">Consultas SEFAZ (InfoSimples):</td><td align="right"><strong>${infosimplesCount}</strong></td></tr>
                    <tr><td style="color: #94A3B8;">Lotes dMRV vinculados:</td><td align="right"><strong>${cdvCount}</strong></td></tr>
                    <tr><td style="color: #94A3B8;">Laudos periciais emitidos:</td><td align="right"><strong>${relatoriosCount}</strong></td></tr>
                    <tr><td style="color: #94A3B8;">Última movimentação:</td><td align="right"><strong>${dataUltLote}</strong></td></tr>
                  </table>
                </div>
                <div style="text-align: center; margin-bottom: 32px;">
                  <a href="${painelUrl}" style="display: inline-block; padding: 14px 32px; background-color: #12B886; color: #0A0E12; font-size: 14px; font-weight: bold; text-decoration: none; border-radius: 8px;">
                    Acessar Meu Painel e Retomar Provas →
                  </a>
                </div>
                <div style="border-top: 1px solid #1e293b; padding-top: 20px; font-size: 11px; color: #64748b; line-height: 1.6; text-align: center;">
                  <p style="margin: 0 0 8px 0;"><strong>Orbis Protocol</strong> • Prova Documental da Economia Circular — dMRV</p>
                  <p style="margin: 0 0 12px 0;">Simulação Referencial — sem validade, não emissível, não negociável.</p>
                  <p style="margin: 0;">Não deseja receber lembretes? <a href="${optOutUrl}" style="color: #94A3B8; text-decoration: underline;">Descadastrar conta aqui</a>.</p>
                </div>
              </td></tr>
            </table>
          </body>
          </html>
        `
      } else {
        assunto = 'O que mudou no mercado de comprovação desde sua última visita'
        html = `
          <!DOCTYPE html>
          <html lang="pt-BR">
          <head><meta charset="utf-8"><title>${assunto}</title></head>
          <body style="margin: 0; padding: 24px 12px; background-color: #0A1628; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #F8FAFC;">
            <table align="center" width="100%" style="max-width: 600px; background-color: #0E1A2E; border: 1px solid #1e293b; border-radius: 12px; overflow: hidden; padding: 32px 24px;">
              <tr><td>
                <div style="border-bottom: 1px solid #1e293b; padding-bottom: 20px; margin-bottom: 24px;">
                  <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #3B82F6; font-weight: bold; display: block; margin-bottom: 6px;">
                    ORBIS PROTOCOL • ATUALIZAÇÃO REGULATÓRIA & CONFORMIDADE
                  </span>
                  <h1 style="margin: 0; font-size: 20px; color: #F8FAFC; font-weight: 800; line-height: 1.3;">
                    O que mudou no marco de comprovação ambiental e fiscal
                  </h1>
                  <p style="margin: 8px 0 0 0; color: #94A3B8; font-size: 13px;">
                    Panorama técnico para: <strong>${uNome}</strong> (${uCnpj || 'Conta Corporativa'})
                  </p>
                </div>
                <p style="margin: 0 0 16px 0; color: #cbd5e1; font-size: 14px; line-height: 1.6;">
                  Nos últimos 60 dias, o ambiente regulatório brasileiro avançou em exigências de prova documental:
                </p>
                <div style="margin-bottom: 24px;">
                  <div style="background-color: #0A1628; border: 1px solid #1e293b; border-left: 3px solid #3B82F6; border-radius: 6px; padding: 12px; margin-bottom: 8px;">
                    <strong style="color: #F8FAFC; font-size: 13px;">1. SBCE (Lei 14.902/2024):</strong>
                    <span style="color: #94A3B8; font-size: 12px; display: block; margin-top: 4px;">Critérios rígidos de integridade e custódia probatória de notas e laudos.</span>
                  </div>
                  <div style="background-color: #0A1628; border: 1px solid #1e293b; border-left: 3px solid #12B886; border-radius: 6px; padding: 12px; margin-bottom: 8px;">
                    <strong style="color: #F8FAFC; font-size: 13px;">2. Programa MOVER & CDVerde:</strong>
                    <span style="color: #94A3B8; font-size: 12px; display: block; margin-top: 4px;">Rastreabilidade de desmontagem veicular e destinação final (Dec. 11.413/2023).</span>
                  </div>
                  <div style="background-color: #0A1628; border: 1px solid #1e293b; border-left: 3px solid #D9B36C; border-radius: 6px; padding: 12px;">
                    <strong style="color: #F8FAFC; font-size: 13px;">3. Reforma Tributária (Lei 15.042/2024):</strong>
                    <span style="color: #94A3B8; font-size: 12px; display: block; margin-top: 4px;">Exigência de lastro documental para créditos não cumulativos de IBS/CBS.</span>
                  </div>
                </div>
                <div style="text-align: center; margin-bottom: 32px;">
                  <div style="margin-bottom: 12px;">
                    <a href="${painelUrl}" style="display: inline-block; width: 85%; max-width: 380px; padding: 14px 24px; background-color: #12B886; color: #0A0E12; font-size: 14px; font-weight: bold; text-decoration: none; border-radius: 8px;">
                      Acessar Painel da Minha Conta
                    </a>
                  </div>
                  <div>
                    <a href="${contatoUrl}" style="display: inline-block; width: 85%; max-width: 380px; padding: 12px 24px; background-color: transparent; border: 1px solid #3B82F6; color: #60a5fa; font-size: 13px; font-weight: 600; text-decoration: none; border-radius: 8px;">
                      Agendar Conversa com Especialista
                    </a>
                  </div>
                </div>
                <div style="border-top: 1px solid #1e293b; padding-top: 20px; font-size: 11px; color: #64748b; line-height: 1.6; text-align: center;">
                  <p style="margin: 0 0 8px 0;"><strong>Orbis Protocol</strong> • Prova Documental da Economia Circular — dMRV</p>
                  <p style="margin: 0 0 12px 0;">Simulação Referencial — sem validade, não emissível, não negociável.</p>
                  <p style="margin: 0;">Não deseja receber informativos? <a href="${optOutUrl}" style="color: #94A3B8; text-decoration: underline;">Descadastrar conta aqui</a>.</p>
                </div>
              </td></tr>
            </table>
          </body>
          </html>
        `
      }

      try {
        const senderAddress = $app.settings().meta.senderAddress || 'suporte@orbis-protocol.com'
        const senderName = $app.settings().meta.senderName || 'Orbis Protocol'

        const mailMsg = new MailerMessage({
          from: { address: senderAddress, name: senderName },
          to: [{ address: uEmail }],
          subject: assunto,
          html: html,
        })

        $app.newMailClient().send(mailMsg)

        const recEnvio = new Record(enviosCol)
        recEnvio.set('usuario', uId)
        recEnvio.set('toque', toque)
        recEnvio.set('data_envio', hojeIso)
        recEnvio.set('status', 'enviado')
        recEnvio.set('destinatario_email', uEmail)
        recEnvio.set('dados_conta_json', snapshot)
        recEnvio.set('mensagem_erro', '')
        recEnvio.set('reativou', false)
        $app.save(recEnvio)
      } catch (errSend) {
        try {
          const recFalha = new Record(enviosCol)
          recFalha.set('usuario', uId)
          recFalha.set('toque', toque)
          recFalha.set('data_envio', hojeIso)
          recFalha.set('status', 'falha')
          recFalha.set('destinatario_email', uEmail)
          recFalha.set('dados_conta_json', snapshot)
          recFalha.set('mensagem_erro', (errSend && errSend.message) || String(errSend))
          recFalha.set('reativou', false)
          $app.save(recFalha)
        } catch (_) {}
      }
    }
  } catch (errCron) {
    console.log('[Reativação Campanha Cron] Erro:', errCron)
  }
})

// 2. ENDPOINT PARA DISPARO MANUAL (Console Admin / Master)
routerAdd('POST', '/backend/v1/reativacao/executar-job', (e) => {
  try {
    if (!e.auth) {
      return e.json(401, { error: 'Autenticação necessária.' })
    }
    const role = e.auth.getString('role')
    if (role !== 'admin' && role !== 'master' && role !== 'controller') {
      return e.json(403, {
        error: 'Permissão negada. Apenas administradores podem disparar o job de reativação.',
      })
    }

    const body = e.requestInfo().body || {}
    const dryRun = Boolean(body.dry_run)

    const agora = new Date()
    const hojeIso = agora.toISOString().split('T')[0]
    const trintaDiasMs = 30 * 24 * 60 * 60 * 1000

    let totalAvaliado = 0
    let totalElegivelD30 = 0
    let totalElegivelD60 = 0
    let totalEnviados = 0
    let totalIgnoradosOptOut = 0
    let totalIgnoradosRecente = 0
    let totalErros = 0
    const logs = []

    const enviosCol = $app.findCollectionByNameOrId('reativacao_envios')
    const todosUsuarios = $app.findRecordsByFilter('users', 'id != ""', 'created', 1000, 0)

    for (let i = 0; i < todosUsuarios.length; i++) {
      const u = todosUsuarios[i]
      totalAvaliado++

      const uId = u.id
      const uEmail = u.getString('email') || ''
      const uNome = u.getString('name') || 'Cliente'
      const uCnpj = u.getString('cnpj') || ''
      const optOut = u.getBool('opt_out_reativacao')

      if (optOut) {
        totalIgnoradosOptOut++
        continue
      }
      if (!uEmail || uEmail.indexOf('@') === -1) continue
      if (uEmail.indexOf('visitante-ia@') !== -1) continue

      // Deduplicação 30 dias
      let enviosAnteriores = []
      try {
        enviosAnteriores = $app.findRecordsByFilter(
          'reativacao_envios',
          `usuario = "${uId}"`,
          '-created',
          10,
          0,
        )
      } catch (_) {}

      let bloqueado = false
      for (let k = 0; k < enviosAnteriores.length; k++) {
        const envio = enviosAnteriores[k]
        const diffMs = agora.getTime() - new Date(envio.getString('created')).getTime()
        if (envio.getString('status') === 'enviado' && diffMs < trintaDiasMs) {
          bloqueado = true
          break
        }
        const dataEnvioDia =
          envio.getString('data_envio') || envio.getString('created').split('T')[0]
        if (envio.getString('status') === 'falha' && dataEnvioDia === hojeIso) {
          bloqueado = true
          break
        }
      }
      if (bloqueado) {
        totalIgnoradosRecente++
        continue
      }

      // Atividades nas coleções
      let nfeCount = 0
      let nfeUltimaData = null
      let infosimplesCount = 0
      let infosimplesUltimaData = null
      let cdvCount = 0
      let cdvUltimaData = null
      let relatoriosCount = 0
      let relatoriosAssinados = 0
      let relatoriosUltimaData = null

      try {
        const nfes = $app.findRecordsByFilter(
          'nfe_upload',
          `usuario = "${uId}" || (cnpj_emitente != "" && cnpj_emitente = "${uCnpj}")`,
          '-created',
          500,
          0,
        )
        nfeCount = nfes.length
        if (nfes.length > 0) nfeUltimaData = new Date(nfes[0].getString('created'))
      } catch (_) {}

      try {
        const infos = $app.findRecordsByFilter(
          'infosimples_consultas',
          `usuario = "${uId}"`,
          '-created',
          500,
          0,
        )
        infosimplesCount = infos.length
        if (infos.length > 0) infosimplesUltimaData = new Date(infos[0].getString('created'))
      } catch (_) {}

      if (uCnpj) {
        try {
          const lotes = $app.findRecordsByFilter(
            'cdv_lotes',
            `cdv_cnpj = "${uCnpj}"`,
            '-created',
            500,
            0,
          )
          cdvCount = lotes.length
          if (lotes.length > 0) cdvUltimaData = new Date(lotes[0].getString('created'))
        } catch (_) {}
      }

      try {
        const rels = $app.findRecordsByFilter(
          'relatorios_exportados',
          `usuario = "${uId}" || (cnpj != "" && cnpj = "${uCnpj}")`,
          '-created',
          500,
          0,
        )
        relatoriosCount = rels.length
        for (let r = 0; r < rels.length; r++) {
          if (rels[r].getBool('assinado_icp_brasil')) relatoriosAssinados++
        }
        if (rels.length > 0) relatoriosUltimaData = new Date(rels[0].getString('created'))
      } catch (_) {}

      const datas = [
        nfeUltimaData,
        infosimplesUltimaData,
        cdvUltimaData,
        relatoriosUltimaData,
      ].filter(Boolean)
      let ultimaAtiv = null
      if (datas.length > 0) {
        datas.sort((a, b) => b.getTime() - a.getTime())
        ultimaAtiv = datas[0]
      } else {
        ultimaAtiv = new Date(u.getString('created'))
      }

      const diffDias = Math.floor((agora.getTime() - ultimaAtiv.getTime()) / (1000 * 60 * 60 * 24))
      let toque = null
      if (diffDias >= 60) {
        toque = 'd60'
        totalElegivelD60++
      } else if (diffDias >= 30) {
        toque = 'd30'
        totalElegivelD30++
      } else {
        continue
      }

      const tokenOptOut = $security.sha256(`${uId}|${uEmail}|orbis_optout_salt_2026`).slice(0, 32)
      const siteUrl = ($os.getenv('SITE_URL') || 'https://www.orbis-protocol.com').replace(
        /\/$/,
        '',
      )
      const optOutUrl = `${siteUrl}/preferencias?token=${encodeURIComponent(tokenOptOut)}&uid=${encodeURIComponent(uId)}`
      const painelUrl = `${siteUrl}/painel`
      const contatoUrl = `${siteUrl}/canal-titular`
      const dataUltLote = cdvUltimaData
        ? cdvUltimaData.toLocaleDateString('pt-BR')
        : nfeUltimaData
          ? nfeUltimaData.toLocaleDateString('pt-BR')
          : 'N/A'

      const snapshot = {
        nfe_consultadas: nfeCount,
        infosimples_consultas: infosimplesCount,
        lotes_cdv: cdvCount,
        laudos_exportados: relatoriosCount,
        laudos_assinados_icp: relatoriosAssinados,
        laudos_pendentes: Math.max(0, nfeCount > 0 && relatoriosCount === 0 ? 1 : 0),
        ultima_atividade_data: ultimaAtiv.toISOString(),
        dias_inatividade: diffDias,
        ultimo_lote_data_formatada: dataUltLote,
        cnpj: uCnpj,
      }

      let assunto = ''
      let html = ''

      if (toque === 'd30') {
        assunto = 'Sua conta Orbis Protocol tem provas esperando por você'
        html = `
          <!DOCTYPE html>
          <html lang="pt-BR">
          <head><meta charset="utf-8"><title>${assunto}</title></head>
          <body style="margin: 0; padding: 24px 12px; background-color: #0A1628; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #F8FAFC;">
            <table align="center" width="100%" style="max-width: 600px; background-color: #0E1A2E; border: 1px solid #1e293b; border-radius: 12px; overflow: hidden; padding: 32px 24px;">
              <tr><td>
                <div style="border-bottom: 1px solid #1e293b; padding-bottom: 20px; margin-bottom: 24px;">
                  <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #12B886; font-weight: bold; display: block; margin-bottom: 6px;">
                    ORBIS PROTOCOL • GESTÃO DE ACERVO PROBATÓRIO
                  </span>
                  <h1 style="margin: 0; font-size: 20px; color: #F8FAFC; font-weight: 800; line-height: 1.3;">
                    Sua conta tem dados e evidências aguardando consolidação
                  </h1>
                  <p style="margin: 8px 0 0 0; color: #94A3B8; font-size: 13px;">
                    Olá, <strong>${uNome}</strong> (${uCnpj || 'Conta Corporativa'})
                  </p>
                </div>
                <p style="margin: 0 0 16px 0; color: #cbd5e1; font-size: 14px; line-height: 1.6;">
                  Notamos que faz ${diffDias} dias desde seu último acesso à plataforma. Seu acervo probatório está seguro e estruturado em nosso cofre de dados:
                </p>
                <div style="background-color: #0A1628; border: 1px solid #1e293b; border-left: 4px solid #12B886; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
                  <table width="100%" style="font-size: 13px; color: #e2e8f0; line-height: 1.8;">
                    <tr><td style="color: #94A3B8;">Documentos / NF-e consultadas:</td><td align="right"><strong>${nfeCount}</strong></td></tr>
                    <tr><td style="color: #94A3B8;">Consultas SEFAZ (InfoSimples):</td><td align="right"><strong>${infosimplesCount}</strong></td></tr>
                    <tr><td style="color: #94A3B8;">Lotes dMRV vinculados:</td><td align="right"><strong>${cdvCount}</strong></td></tr>
                    <tr><td style="color: #94A3B8;">Laudos periciais emitidos:</td><td align="right"><strong>${relatoriosCount}</strong></td></tr>
                    <tr><td style="color: #94A3B8;">Última movimentação:</td><td align="right"><strong>${dataUltLote}</strong></td></tr>
                  </table>
                </div>
                <div style="text-align: center; margin-bottom: 32px;">
                  <a href="${painelUrl}" style="display: inline-block; padding: 14px 32px; background-color: #12B886; color: #0A0E12; font-size: 14px; font-weight: bold; text-decoration: none; border-radius: 8px;">
                    Acessar Meu Painel e Retomar Provas →
                  </a>
                </div>
                <div style="border-top: 1px solid #1e293b; padding-top: 20px; font-size: 11px; color: #64748b; line-height: 1.6; text-align: center;">
                  <p style="margin: 0 0 8px 0;"><strong>Orbis Protocol</strong> • Prova Documental da Economia Circular — dMRV</p>
                  <p style="margin: 0 0 12px 0;">Simulação Referencial — sem validade, não emissível, não negociável.</p>
                  <p style="margin: 0;">Não deseja receber lembretes? <a href="${optOutUrl}" style="color: #94A3B8; text-decoration: underline;">Descadastrar conta aqui</a>.</p>
                </div>
              </td></tr>
            </table>
          </body>
          </html>
        `
      } else {
        assunto = 'O que mudou no mercado de comprovação desde sua última visita'
        html = `
          <!DOCTYPE html>
          <html lang="pt-BR">
          <head><meta charset="utf-8"><title>${assunto}</title></head>
          <body style="margin: 0; padding: 24px 12px; background-color: #0A1628; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #F8FAFC;">
            <table align="center" width="100%" style="max-width: 600px; background-color: #0E1A2E; border: 1px solid #1e293b; border-radius: 12px; overflow: hidden; padding: 32px 24px;">
              <tr><td>
                <div style="border-bottom: 1px solid #1e293b; padding-bottom: 20px; margin-bottom: 24px;">
                  <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #3B82F6; font-weight: bold; display: block; margin-bottom: 6px;">
                    ORBIS PROTOCOL • ATUALIZAÇÃO REGULATÓRIA & CONFORMIDADE
                  </span>
                  <h1 style="margin: 0; font-size: 20px; color: #F8FAFC; font-weight: 800; line-height: 1.3;">
                    O que mudou no marco de comprovação ambiental e fiscal
                  </h1>
                  <p style="margin: 8px 0 0 0; color: #94A3B8; font-size: 13px;">
                    Panorama técnico para: <strong>${uNome}</strong> (${uCnpj || 'Conta Corporativa'})
                  </p>
                </div>
                <p style="margin: 0 0 16px 0; color: #cbd5e1; font-size: 14px; line-height: 1.6;">
                  Nos últimos 60 dias, o ambiente regulatório brasileiro avançou em exigências de prova documental:
                </p>
                <div style="margin-bottom: 24px;">
                  <div style="background-color: #0A1628; border: 1px solid #1e293b; border-left: 3px solid #3B82F6; border-radius: 6px; padding: 12px; margin-bottom: 8px;">
                    <strong style="color: #F8FAFC; font-size: 13px;">1. SBCE (Lei 14.902/2024):</strong>
                    <span style="color: #94A3B8; font-size: 12px; display: block; margin-top: 4px;">Critérios rígidos de integridade e custódia probatória de notas e laudos.</span>
                  </div>
                  <div style="background-color: #0A1628; border: 1px solid #1e293b; border-left: 3px solid #12B886; border-radius: 6px; padding: 12px; margin-bottom: 8px;">
                    <strong style="color: #F8FAFC; font-size: 13px;">2. Programa MOVER & CDVerde:</strong>
                    <span style="color: #94A3B8; font-size: 12px; display: block; margin-top: 4px;">Rastreabilidade de desmontagem veicular e destinação final (Dec. 11.413/2023).</span>
                  </div>
                  <div style="background-color: #0A1628; border: 1px solid #1e293b; border-left: 3px solid #D9B36C; border-radius: 6px; padding: 12px;">
                    <strong style="color: #F8FAFC; font-size: 13px;">3. Reforma Tributária (Lei 15.042/2024):</strong>
                    <span style="color: #94A3B8; font-size: 12px; display: block; margin-top: 4px;">Exigência de lastro documental para créditos não cumulativos de IBS/CBS.</span>
                  </div>
                </div>
                <div style="text-align: center; margin-bottom: 32px;">
                  <div style="margin-bottom: 12px;">
                    <a href="${painelUrl}" style="display: inline-block; width: 85%; max-width: 380px; padding: 14px 24px; background-color: #12B886; color: #0A0E12; font-size: 14px; font-weight: bold; text-decoration: none; border-radius: 8px;">
                      Acessar Painel da Minha Conta
                    </a>
                  </div>
                  <div>
                    <a href="${contatoUrl}" style="display: inline-block; width: 85%; max-width: 380px; padding: 12px 24px; background-color: transparent; border: 1px solid #3B82F6; color: #60a5fa; font-size: 13px; font-weight: 600; text-decoration: none; border-radius: 8px;">
                      Agendar Conversa com Especialista
                    </a>
                  </div>
                </div>
                <div style="border-top: 1px solid #1e293b; padding-top: 20px; font-size: 11px; color: #64748b; line-height: 1.6; text-align: center;">
                  <p style="margin: 0 0 8px 0;"><strong>Orbis Protocol</strong> • Prova Documental da Economia Circular — dMRV</p>
                  <p style="margin: 0 0 12px 0;">Simulação Referencial — sem validade, não emissível, não negociável.</p>
                  <p style="margin: 0;">Não deseja receber informativos? <a href="${optOutUrl}" style="color: #94A3B8; text-decoration: underline;">Descadastrar conta aqui</a>.</p>
                </div>
              </td></tr>
            </table>
          </body>
          </html>
        `
      }

      if (dryRun) {
        logs.push({
          usuario_id: uId,
          email: uEmail,
          toque: toque,
          dias_inatividade: diffDias,
          status: 'simulado',
        })
        totalEnviados++
        continue
      }

      try {
        const senderAddress = $app.settings().meta.senderAddress || 'suporte@orbis-protocol.com'
        const senderName = $app.settings().meta.senderName || 'Orbis Protocol'

        const mailMsg = new MailerMessage({
          from: { address: senderAddress, name: senderName },
          to: [{ address: uEmail }],
          subject: assunto,
          html: html,
        })

        $app.newMailClient().send(mailMsg)

        const recEnvio = new Record(enviosCol)
        recEnvio.set('usuario', uId)
        recEnvio.set('toque', toque)
        recEnvio.set('data_envio', hojeIso)
        recEnvio.set('status', 'enviado')
        recEnvio.set('destinatario_email', uEmail)
        recEnvio.set('dados_conta_json', snapshot)
        recEnvio.set('mensagem_erro', '')
        recEnvio.set('reativou', false)
        $app.save(recEnvio)

        totalEnviados++
        logs.push({ usuario_id: uId, email: uEmail, toque: toque, status: 'enviado' })
      } catch (errSend) {
        totalErros++
        const msgErro = (errSend && errSend.message) || String(errSend)
        try {
          const recFalha = new Record(enviosCol)
          recFalha.set('usuario', uId)
          recFalha.set('toque', toque)
          recFalha.set('data_envio', hojeIso)
          recFalha.set('status', 'falha')
          recFalha.set('destinatario_email', uEmail)
          recFalha.set('dados_conta_json', snapshot)
          recFalha.set('mensagem_erro', msgErro)
          recFalha.set('reativou', false)
          $app.save(recFalha)
        } catch (_) {}

        logs.push({
          usuario_id: uId,
          email: uEmail,
          toque: toque,
          status: 'falha',
          erro: msgErro,
        })
      }
    }

    return e.json(200, {
      sucesso: true,
      data_execucao: hojeIso,
      dry_run: dryRun,
      total_avaliado: totalAvaliado,
      elegiveis_d30: totalElegivelD30,
      elegiveis_d60: totalElegivelD60,
      enviados: totalEnviados,
      ignorados_opt_out: totalIgnoradosOptOut,
      ignorados_recente: totalIgnoradosRecente,
      erros: totalErros,
      logs: logs,
    })
  } catch (err) {
    return e.json(500, { error: err.message || 'Erro ao processar disparo.' })
  }
})

// 3. ENDPOINT DE OPT-OUT PÚBLICO
routerAdd('POST', '/backend/v1/reativacao/opt-out', (e) => {
  try {
    const body = e.requestInfo().body || {}
    const userId = body.usuario_id || body.uid || ''
    const token = body.token || ''

    if (!userId) {
      return e.json(400, { error: 'Parâmetro usuario_id não informado.' })
    }

    let userRecord = null
    try {
      userRecord = $app.findRecordById('users', userId)
    } catch (_) {
      return e.json(404, { error: 'Conta de usuário não encontrada.' })
    }

    const email = userRecord.getString('email')

    // Validar token HMAC/SHA256
    const tokenEsperado = $security.sha256(`${userId}|${email}|orbis_optout_salt_2026`).slice(0, 32)
    const isDonoLogado = e.auth && e.auth.id === userId
    const isAdminLogado =
      e.auth &&
      (e.auth.getString('role') === 'admin' ||
        e.auth.getString('role') === 'master' ||
        e.auth.getString('role') === 'controller')

    if (!isDonoLogado && !isAdminLogado) {
      if (!token || token !== tokenEsperado) {
        return e.json(403, { error: 'Token de descadastro inválido ou expirado.' })
      }
    }

    const novoOptOut = body.reverter ? false : true
    const agoraIso = new Date().toISOString()

    userRecord.set('opt_out_reativacao', novoOptOut)
    userRecord.set('opt_out_reativacao_data', novoOptOut ? agoraIso : '')
    $app.save(userRecord)

    return e.json(200, {
      sucesso: true,
      opt_out: novoOptOut,
      data: agoraIso,
      email: email,
      mensagem: novoOptOut
        ? 'Descadastro realizado com sucesso. Você não receberá mais e-mails de reativação.'
        : 'Preferência restabelecida. Você voltará a receber lembretes de integridade da conta.',
    })
  } catch (err) {
    return e.json(500, { error: err.message || 'Erro ao processar descadastro.' })
  }
})

// 4. ENDPOINT PARA CONSULTA PÚBLICA DO STATUS DE OPT-OUT POR TOKEN
routerAdd('GET', '/backend/v1/reativacao/opt-out/consultar', (e) => {
  try {
    const query = e.requestInfo().query || {}
    const userId = query.uid || query.usuario_id || ''
    const token = query.token || ''

    if (!userId) {
      return e.json(400, { error: 'Parâmetro uid não informado.' })
    }

    let userRecord = null
    try {
      userRecord = $app.findRecordById('users', userId)
    } catch (_) {
      return e.json(404, { error: 'Conta não encontrada.' })
    }

    const email = userRecord.getString('email')
    const tokenEsperado = $security.sha256(`${userId}|${email}|orbis_optout_salt_2026`).slice(0, 32)
    const isValido = token === tokenEsperado

    return e.json(200, {
      sucesso: true,
      token_valido: isValido,
      email_mascarado: email ? email.replace(/^(.{2})(.*)(@.*)$/, '$1***$3') : '',
      nome: userRecord.getString('name') || 'Cliente',
      opt_out: userRecord.getBool('opt_out_reativacao'),
      opt_out_data: userRecord.getString('opt_out_reativacao_data'),
    })
  } catch (err) {
    return e.json(500, { error: err.message })
  }
})
