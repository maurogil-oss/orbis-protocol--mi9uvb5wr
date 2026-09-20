/**
 * Validador e Política de Senha Forte — Orbis Protocol (Pré-Pentest)
 *
 * Regra:
 * - Mínimo de 10 caracteres
 * - Pelo menos 1 letra maiúscula [A-Z]
 * - Pelo menos 1 letra minúscula [a-z]
 * - Pelo menos 1 número [0-9]
 */

export interface ValidacaoSenhaResultado {
  valida: boolean
  erros: string[]
  mensagem: string
}

export function validarSenhaForte(senha: string): ValidacaoSenhaResultado {
  const erros: string[] = []
  const s = String(senha || '')

  if (s.length < 10) {
    erros.push('mínimo de 10 caracteres')
  }
  if (!/[A-Z]/.test(s)) {
    erros.push('pelo menos 1 letra maiúscula')
  }
  if (!/[a-z]/.test(s)) {
    erros.push('pelo menos 1 letra minúscula')
  }
  if (!/[0-9]/.test(s)) {
    erros.push('pelo menos 1 número')
  }

  if (erros.length === 0) {
    return {
      valida: true,
      erros: [],
      mensagem: '',
    }
  }

  const mensagem = `A senha informada não atende à política de segurança. Falta: ${erros.join(', ')}.`
  return {
    valida: false,
    erros,
    mensagem,
  }
}
