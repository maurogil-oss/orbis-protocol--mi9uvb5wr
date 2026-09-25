/**
 * Hook pb_hooks para o Digest Semanal do Radar Regulatório.
 *
 * Requisitos:
 * 1. Disparo agendado via cronAdd toda segunda-feira 7h da manhã (horário comercial / 07:00).
 *    Configurado como '0 7 * * 1' (segunda 7h) ou via trigger manual no Console Admin.
 * 2. Formato fixo para cada norma:
 *    - O que é
 *    - Quem afeta
 *    - O que muda na prática
 *    - Prazo
 *    - O que fazer agora
 * 3. Dois CTAs rastreados ao final:
 *    (a) Primário: "Receba semanalmente — teste grátis de 15 dias" -> /radar-semanal?ref={userCode}
 *    (b) Secundário: "Quer saber como isso afeta o SEU CNPJ? Diagnóstico gratuito" -> /diagnostico?ref={userCode}
 * 4. Posição legal em rodapé: "Conteúdo informativo; não substitui assessoria jurídica ou contábil."
 * 5. Sem prometer crédito de carbono.
 * 6. Rota POST /backend/v1/radar-digest-disparar para execução manual via Console Admin.
 */

routerAdd('POST', '/backend/v1/radar-digest-disparar', (e) => {
  try {
    // Apenas admins / masters / controllers podem disparar manualmente
    if (!e.auth) {
      return e.json(401, { error: 'Autenticação necessária.' })
    }
    const papel = e.auth.getString('role')
    if (papel !== 'admin' && papel !== 'master' && papel !== 'controller') {
      return e.json(403, {
        error: 'Permissão negada. Apenas administradores podem disparar o digest.',
      })
    }

    const body = e.requestInfo().body || {}
    const edicaoId = body.edicao_id || ''

    let edicaoRecord = null
    if (edicaoId) {
      try {
        edicaoRecord = $app.findRecordById('radar_edicoes', edicaoId)
      } catch (_) {}
    }

    // Se não informou id, pega a última edição publicada
    if (!edicaoRecord) {
      const edicoes = $app.findRecordsByFilter(
        'radar_edicoes',
        'publicada = true',
        '-data_edicao',
        1,
        0,
      )
      if (edicoes && edicoes.length > 0) {
        edicaoRecord = edicoes[0]
      }
    }

    if (!edicaoRecord) {
      return e.json(404, { error: 'Nenhuma edição de Radar Regulatório encontrada para envio.' })
    }

    // Buscar usuários elegíveis com acesso ativo (trial não expirado ou ativo)
    const agora = new Date()
    const todosUsuarios = $app.findRecordsByFilter('users', 'id != ""', 'created', 500, 0)

    let totalEnviados = 0
    const errosEnvio = []

    for (let i = 0; i < todosUsuarios.length; i++) {
      const u = todosUsuarios[i]
      const status = u.getString('radar_acesso_status')
      const trialFim = u.getString('radar_trial_fim')
      const assFim = u.getString('radar_assinatura_fim')
      const role = u.getString('role')

      // Usuários com trial ativo, assinatura ativa ou administradores recebem o digest
      let temAcesso = false
      if (role === 'admin' || role === 'master' || role === 'controller') {
        temAcesso = true
      } else if (status === 'ativo') {
        if (!assFim || new Date(assFim) >= agora) temAcesso = true
      } else if (status === 'trial') {
        if (!trialFim || new Date(trialFim) >= agora) temAcesso = true
      }

      if (!temAcesso) continue

      const destinatarioEmail = u.getString('email')
      if (!destinatarioEmail || destinatarioEmail.indexOf('@') === -1) continue

      const userCode = u.getString('cliente_codigo') || 'ORB-REF-' + u.id.slice(0, 6).toUpperCase()
      const userName = u.getString('name') || 'Assinante'

      // Monta HTML do Digest
      let normasArray = []
      try {
        const rawJson = edicaoRecord.get('itens_normas_json')
        if (Array.isArray(rawJson)) {
          normasArray = rawJson
        } else if (typeof rawJson === 'string') {
          normasArray = JSON.parse(rawJson)
        }
      } catch (_) {}

      let blocosNormasHtml = ''
      for (let n = 0; n < normasArray.length; n++) {
        const item = normasArray[n]
        blocosNormasHtml += `
          <div style="margin-bottom: 24px; padding: 18px; background-color: #111820; border: 1px solid #1e293b; border-radius: 8px;">
            <div style="display: inline-block; padding: 3px 8px; background-color: rgba(18, 184, 134, 0.15); color: #12B886; font-size: 11px; font-weight: bold; border-radius: 4px; margin-bottom: 8px;">
              ${item.segmento || 'Regulatório'} • ${item.base_legal || ''}
            </div>
            <h3 style="margin: 0 0 12px 0; color: #F4F7FA; font-size: 16px; font-weight: bold;">
              ${item.norma || 'Norma em Análise'}
            </h3>
            
            <p style="margin: 6px 0; color: #cbd5e1; font-size: 13px; line-height: 1.5;">
              <strong style="color: #94a3b8;">1. O que é:</strong> ${item.o_que_e || '-'}
            </p>
            <p style="margin: 6px 0; color: #cbd5e1; font-size: 13px; line-height: 1.5;">
              <strong style="color: #94a3b8;">2. Quem afeta:</strong> ${item.quem_afeta || '-'}
            </p>
            <p style="margin: 6px 0; color: #cbd5e1; font-size: 13px; line-height: 1.5;">
              <strong style="color: #94a3b8;">3. O que muda na prática:</strong> ${item.o_que_muda_na_pratica || '-'}
            </p>
            <p style="margin: 6px 0; color: #cbd5e1; font-size: 13px; line-height: 1.5;">
              <strong style="color: #f59e0b;">4. Prazo:</strong> <strong>${item.prazo || 'Consulte o calendário'}</strong>
            </p>
            <p style="margin: 6px 0; color: #cbd5e1; font-size: 13px; line-height: 1.5;">
              <strong style="color: #12B886;">5. O que fazer agora:</strong> ${item.o_que_fazer_agora || '-'}
            </p>
          </div>
        `
      }

      const ctaPrimarioUrl = `https://www.orbis-protocol.com/radar-semanal?ref=${encodeURIComponent(userCode)}`
      const ctaSecundarioUrl = `https://www.orbis-protocol.com/diagnostico?ref=${encodeURIComponent(userCode)}`
      const centralUrl = `https://www.orbis-protocol.com/central-radar`

      const htmlBody = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>${edicaoRecord.getString('titulo')}</title>
        </head>
        <body style="margin: 0; padding: 24px 12px; background-color: #0A0E12; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #F4F7FA;">
          <table align="center" width="100%" style="max-width: 650px; background-color: #0D1217; border: 1px solid #1e293b; border-radius: 12px; overflow: hidden; padding: 28px;">
            <tr>
              <td>
                <div style="border-bottom: 1px solid #1e293b; padding-bottom: 16px; margin-bottom: 20px;">
                  <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #12B886; font-weight: bold;">
                    ORBIS PROTOCOL • RADAR SEMANAL
                  </span>
                  <h1 style="margin: 8px 0 4px 0; font-size: 20px; color: #F4F7FA; font-weight: 800;">
                    ${edicaoRecord.getString('titulo')}
                  </h1>
                  <p style="margin: 0; color: #94a3b8; font-size: 12px;">
                    Data: ${edicaoRecord.getString('data_edicao')} • Edição nº ${edicaoRecord.getInt('numero_edicao')} • Olá, ${userName}
                  </p>
                </div>

                <div style="margin-bottom: 24px; padding: 14px; background-color: rgba(18, 184, 134, 0.08); border-left: 3px solid #12B886; border-radius: 4px; color: #e2e8f0; font-size: 13px; line-height: 1.5;">
                  <strong>Resumo Executivo da Semana:</strong><br>
                  ${edicaoRecord.getString('resumo_semana')}
                </div>

                <!-- Lista de Normas Estruturadas -->
                ${blocosNormasHtml}

                <!-- Link Direto para a Central Autenticada -->
                <div style="text-align: center; margin: 28px 0 20px 0;">
                  <a href="${centralUrl}" style="display: inline-block; padding: 10px 20px; background-color: #1e293b; color: #F4F7FA; font-size: 12px; font-weight: bold; text-decoration: none; border-radius: 6px; border: 1px solid #334155;">
                    Abrir esta edição na Central de Radar →
                  </a>
                </div>

                <!-- Seção de CTAs Rastreados com Código ref -->
                <div style="margin-top: 32px; padding: 20px; background-color: #111820; border: 1px solid #1e293b; border-radius: 8px; text-align: center;">
                  <span style="display: block; font-size: 11px; text-transform: uppercase; color: #94a3b8; letter-spacing: 1px; margin-bottom: 6px;">
                    Programa de Indicação • Seu código de parceiro: <strong style="color: #12B886;">${userCode}</strong>
                  </span>
                  <h4 style="margin: 0 0 14px 0; color: #F4F7FA; font-size: 15px;">
                    Compartilhe estas atualizações com seus clientes ou parceiros
                  </h4>

                  <!-- CTA Primário -->
                  <div style="margin-bottom: 12px;">
                    <a href="${ctaPrimarioUrl}" style="display: inline-block; width: 85%; max-width: 420px; padding: 12px 20px; background-color: #12B886; color: #0A0E12; font-size: 13px; font-weight: bold; text-decoration: none; border-radius: 6px;">
                      Receba semanalmente — teste grátis de 15 dias
                    </a>
                  </div>

                  <!-- CTA Secundário -->
                  <div>
                    <a href="${ctaSecundarioUrl}" style="display: inline-block; width: 85%; max-width: 420px; padding: 10px 18px; background-color: transparent; border: 1px solid #12B886; color: #12B886; font-size: 12px; font-weight: 600; text-decoration: none; border-radius: 6px;">
                      Quer saber como isso afeta o SEU CNPJ? Diagnóstico gratuito
                    </a>
                  </div>
                </div>

                <!-- Rodapé de Posicionamento Mandatório -->
                <div style="margin-top: 28px; padding-top: 16px; border-top: 1px solid #1e293b; text-align: center; color: #64748b; font-size: 11px; line-height: 1.5;">
                  <p style="margin: 0 0 6px 0;">
                    <strong>Posicionamento Legal:</strong> Conteúdo informativo; não substitui assessoria jurídica ou contábil.
                  </p>
                  <p style="margin: 0;">
                    Orbis Protocol • Infraestrutura de prova documental e inteligência regulatória.<br>
                    Você está recebendo este e-mail porque possui acesso trial ou assinatura ativa ao Radar Semanal.
                  </p>
                </div>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `

      try {
        const senderAddress = $app.settings().meta.senderAddress || 'suporte@orbis-protocol.com'
        const senderName = $app.settings().meta.senderName || 'Orbis Protocol'

        const mailMsg = new MailerMessage({
          from: {
            address: senderAddress,
            name: senderName,
          },
          to: [{ address: destinatarioEmail }],
          subject: `[Radar Semanal Orbis] ${edicaoRecord.getString('titulo')}`,
          html: htmlBody,
        })

        $app.newMailClient().send(mailMsg)
        totalEnviados++
      } catch (errSend) {
        errosEnvio.push({ email: destinatarioEmail, erro: errSend.message })
      }
    }

    // Registra métricas na edição
    edicaoRecord.set('total_destinatarios_enviados', totalEnviados)
    edicaoRecord.set('data_envio_digest', new Date().toISOString())
    $app.save(edicaoRecord)

    return e.json(200, {
      sucesso: true,
      edicao_id: edicaoRecord.id,
      numero_edicao: edicaoRecord.getInt('numero_edicao'),
      total_enviados: totalEnviados,
      total_erros: errosEnvio.length,
      erros: errosEnvio,
    })
  } catch (err) {
    return e.json(500, { error: err.message || 'Erro ao processar disparo do digest semanal.' })
  }
})

// Job agendado: Segunda-feira 7h da manhã UTC (0 7 * * 1)
cronAdd('radar_semanal_digest_segunda', '0 7 * * 1', () => {
  try {
    const edicoes = $app.findRecordsByFilter(
      'radar_edicoes',
      'publicada = true',
      '-data_edicao',
      1,
      0,
    )
    if (!edicoes || edicoes.length === 0) return

    const edicao = edicoes[0]
    const agora = new Date()

    // Enviar aos usuários ativos e trial
    const todosUsuarios = $app.findRecordsByFilter('users', 'id != ""', 'created', 500, 0)
    let enviados = 0

    for (let i = 0; i < todosUsuarios.length; i++) {
      const u = todosUsuarios[i]
      const status = u.getString('radar_acesso_status')
      const trialFim = u.getString('radar_trial_fim')
      const assFim = u.getString('radar_assinatura_fim')
      const role = u.getString('role')

      let temAcesso = false
      if (role === 'admin' || role === 'master' || role === 'controller') {
        temAcesso = true
      } else if (status === 'ativo') {
        if (!assFim || new Date(assFim) >= agora) temAcesso = true
      } else if (status === 'trial') {
        if (!trialFim || new Date(trialFim) >= agora) temAcesso = true
      }

      if (!temAcesso) continue

      const destinatarioEmail = u.getString('email')
      if (!destinatarioEmail || destinatarioEmail.indexOf('@') === -1) continue

      const userCode = u.getString('cliente_codigo') || 'ORB-REF-' + u.id.slice(0, 6).toUpperCase()
      const ctaPrimarioUrl = `https://www.orbis-protocol.com/radar-semanal?ref=${encodeURIComponent(userCode)}`
      const ctaSecundarioUrl = `https://www.orbis-protocol.com/diagnostico?ref=${encodeURIComponent(userCode)}`

      const senderAddress = $app.settings().meta.senderAddress || 'suporte@orbis-protocol.com'
      const senderName = $app.settings().meta.senderName || 'Orbis Protocol'

      const mailMsg = new MailerMessage({
        from: { address: senderAddress, name: senderName },
        to: [{ address: destinatarioEmail }],
        subject: `[Radar Semanal Orbis] ${edicao.getString('titulo')}`,
        html: `<p>Acesse o novo Radar Regulatório da semana na íntegra: <a href="https://www.orbis-protocol.com/central-radar">Central de Radar</a>.</p>
               <p><a href="${ctaPrimarioUrl}">Receba semanalmente — teste grátis de 15 dias</a> | <a href="${ctaSecundarioUrl}">Diagnóstico gratuito do seu CNPJ</a></p>
               <p style="font-size: 11px; color: #666;">Conteúdo informativo; não substitui assessoria jurídica ou contábil.</p>`,
      })

      try {
        $app.newMailClient().send(mailMsg)
        enviados++
      } catch (_) {}
    }

    edicao.set('total_destinatarios_enviados', enviados)
    edicao.set('data_envio_digest', new Date().toISOString())
    $app.save(edicao)
  } catch (errCron) {
    console.log('Erro no cron radar_semanal_digest_segunda:', errCron)
  }
})
