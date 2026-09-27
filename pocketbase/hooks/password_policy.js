/**
 * POLÍTICA DE SENHA FORTE - HOOK SERVER-SIDE (Orbis Protocol)
 *
 * Exigências:
 * - Mínimo de 10 caracteres
 * - Pelo menos 1 letra maiúscula [A-Z]
 * - Pelo menos 1 letra minúscula [a-z]
 * - Pelo menos 1 número [0-9]
 * - Mensagem clara em pt-BR detalhando exatamente o que falta.
 *
 * Aplica-se no cadastro de novos usuários e na redefinição / alteração de senha.
 */

// 1. Validação na criação de usuário (cadastro)
onRecordCreate((e) => {
  const rec = e.record
  const pass = rec.getString('password') || ''

  if (pass) {
    const erros = []
    if (pass.length < 10) {
      erros.push('mínimo de 10 caracteres')
    }
    if (!/[A-Z]/.test(pass)) {
      erros.push('pelo menos 1 letra maiúscula')
    }
    if (!/[a-z]/.test(pass)) {
      erros.push('pelo menos 1 letra minúscula')
    }
    if (!/[0-9]/.test(pass)) {
      erros.push('pelo menos 1 número')
    }
    if (!/[^A-Za-z0-9]/.test(pass)) {
      erros.push('pelo menos 1 caractere especial ou símbolo')
    }

    if (erros.length > 0) {
      throw new BadRequestError(
        'A senha informada não atende à política de segurança da Orbis Protocol. Falta: ' +
          erros.join(', ') +
          '.',
      )
    }
  }

  e.next()
}, 'users')

// 2. Validação na atualização de usuário (troca de senha)
onRecordUpdate((e) => {
  const rec = e.record
  const pass = rec.getString('password') || ''

  if (pass) {
    const erros = []
    if (pass.length < 10) {
      erros.push('mínimo de 10 caracteres')
    }
    if (!/[A-Z]/.test(pass)) {
      erros.push('pelo menos 1 letra maiúscula')
    }
    if (!/[a-z]/.test(pass)) {
      erros.push('pelo menos 1 letra minúscula')
    }
    if (!/[0-9]/.test(pass)) {
      erros.push('pelo menos 1 número')
    }
    if (!/[^A-Za-z0-9]/.test(pass)) {
      erros.push('pelo menos 1 caractere especial ou símbolo')
    }

    if (erros.length > 0) {
      throw new BadRequestError(
        'A senha informada não atende à política de segurança da Orbis Protocol. Falta: ' +
          erros.join(', ') +
          '.',
      )
    }
  }

  e.next()
}, 'users')

// 3. Personalização do e-mail de reset de senha (onMailerRecordPasswordResetSend)
// Disparado no envio oficial do e-mail de reset, quando o PocketBase JÁ gerou e persistiu o token oficial.
// Substitui remetente, assunto, html e text de e.message utilizando e.meta.token oficial.
// Chama e.next() no final para o envio ocorrer normalmente.
onMailerRecordPasswordResetSend((e) => {
  try {
    const rawToken = e.meta && (e.meta.token || e.meta['token'])
    const token = typeof rawToken === 'string' ? rawToken : String(rawToken || '')

    const resetUrl =
      'https://www.orbis-protocol.com/redefinir-senha?token=' + encodeURIComponent(token)
    const remetenteEmail = 'suporte@orbis-protocol.com'
    const remetenteNome = 'Orbis Protocol'
    const assunto = 'Redefina sua senha'

    const htmlBody =
      '<!DOCTYPE html>' +
      '<html>' +
      '<head><meta charset="utf-8"></head>' +
      '<body style="font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, Helvetica, Arial, sans-serif; background-color: #0A0E12; color: #F4F7FA; margin: 0; padding: 24px;">' +
      '  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 560px; margin: 0 auto; background-color: #111820; border: 1px solid rgba(244,247,250,0.12); border-radius: 16px; overflow: hidden;">' +
      '    <tr>' +
      '      <td style="padding: 32px 32px 16px 32px; text-align: center;">' +
      '        <h1 style="color: #12B886; font-size: 22px; margin: 0 0 8px 0; letter-spacing: 1px; font-weight: 800;">ORBIS PROTOCOL</h1>' +
      '        <p style="color: #93A3B5; font-size: 13px; margin: 0;">Plataforma de Governança e Rastreabilidade</p>' +
      '      </td>' +
      '    </tr>' +
      '    <tr>' +
      '      <td style="padding: 16px 32px 32px 32px;">' +
      '        <h2 style="color: #F4F7FA; font-size: 18px; margin: 0 0 16px 0; font-weight: 700;">Redefina sua senha</h2>' +
      '        <p style="color: #D1D5DB; font-size: 14px; line-height: 1.6; margin: 0 0 16px 0;">' +
      '          Recebemos uma solicitação para redefinir a senha da sua conta na plataforma Orbis Protocol.' +
      '        </p>' +
      '        <p style="color: #D1D5DB; font-size: 14px; line-height: 1.6; margin: 0 0 24px 0;">' +
      '          Clique no botão abaixo para criar uma nova senha:' +
      '        </p>' +
      '        <div style="text-align: center; margin: 28px 0;">' +
      '          <a href="' +
      resetUrl +
      '" target="_blank" rel="noopener noreferrer" style="background-color: #12B886; color: #0A0E12; font-weight: 700; font-size: 14px; padding: 14px 28px; text-decoration: none; border-radius: 10px; display: inline-block;">' +
      '            Redefinir Minha Senha' +
      '          </a>' +
      '        </div>' +
      '        <p style="color: #93A3B5; font-size: 12px; line-height: 1.5; margin: 20px 0 12px 0;">' +
      '          Ou copie e cole o link direto no seu navegador:<br/>' +
      '          <a href="' +
      resetUrl +
      '" style="color: #12B886; word-break: break-all; font-size: 12px;">' +
      resetUrl +
      '</a>' +
      '        </p>' +
      '        <div style="background-color: rgba(240, 62, 84, 0.08); border: 1px solid rgba(240, 62, 84, 0.25); border-radius: 8px; padding: 12px; margin-top: 24px;">' +
      '          <p style="color: #FCA5A5; font-size: 12px; line-height: 1.5; margin: 0;">' +
      '            <strong>Atenção:</strong> Este link possui validade limitada. Se você não solicitou a redefinição de senha, ignore este e-mail; nenhuma alteração será realizada em sua conta.' +
      '          </p>' +
      '        </div>' +
      '      </td>' +
      '    </tr>' +
      '    <tr>' +
      '      <td style="padding: 20px 32px; background-color: #0A0E12; border-top: 1px solid rgba(244,247,250,0.08); text-align: center;">' +
      '        <p style="color: #6B7280; font-size: 11px; margin: 0;">' +
      '          Orbis Protocol • Segurança e Governança • suporte@orbis-protocol.com' +
      '        </p>' +
      '      </td>' +
      '    </tr>' +
      '  </table>' +
      '</body>' +
      '</html>'

    const textBody =
      'Redefina sua senha - Orbis Protocol\n\n' +
      'Recebemos uma solicitação para redefinir a senha da sua conta na plataforma Orbis Protocol.\n\n' +
      'Para redefinir sua senha, acesse o link abaixo:\n' +
      resetUrl +
      '\n\n' +
      'Aviso: Este link possui validade limitada.\n' +
      'Se você não solicitou, ignore este e-mail por segurança.\n\n' +
      'Atenciosamente,\n' +
      'Equipe de Suporte Orbis Protocol\n' +
      'suporte@orbis-protocol.com'

    if (e.message) {
      e.message.from = { address: remetenteEmail, name: remetenteNome }
      e.message.subject = assunto
      e.message.html = htmlBody
      e.message.text = textBody
    }

    const emailDest =
      (e.record && (e.record.email ? e.record.email() : e.record.getString('email'))) ||
      'destinatário'
    console.log(
      '[Password Reset Hook] Mensagem de reset personalizada com sucesso para: ' +
        emailDest +
        ' | token presente: ' +
        (token ? 'sim' : 'não'),
    )
  } catch (err) {
    console.log(
      '[Password Reset Hook] Erro ao personalizar mensagem de reset: ' +
        (err && err.message ? err.message : err),
    )
  }

  return e.next()
}, 'users')

// 4. Validação ao confirmar reset de senha (confirmPasswordReset)
onRecordConfirmPasswordResetRequest((e) => {
  const info = e.requestInfo()
  const body = info ? info.body || {} : {}
  const pass = String(body.password || body.newPassword || '').trim()

  if (pass) {
    const erros = []
    if (pass.length < 10) {
      erros.push('mínimo de 10 caracteres')
    }
    if (!/[A-Z]/.test(pass)) {
      erros.push('pelo menos 1 letra maiúscula')
    }
    if (!/[a-z]/.test(pass)) {
      erros.push('pelo menos 1 letra minúscula')
    }
    if (!/[0-9]/.test(pass)) {
      erros.push('pelo menos 1 número')
    }
    if (!/[^A-Za-z0-9]/.test(pass)) {
      erros.push('pelo menos 1 caractere especial ou símbolo')
    }

    if (erros.length > 0) {
      throw new BadRequestError(
        'A senha informada não atende à política de segurança da Orbis Protocol. Falta: ' +
          erros.join(', ') +
          '.',
      )
    }
  }

  e.next()
}, 'users')
