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

// 3. Validação ao confirmar reset de senha (confirmPasswordReset)
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
