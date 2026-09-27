/**
 * Validador e Política de Senha Forte — Orbis Protocol (Pré-Pentest)
 *
 * Regra:
 * - Mínimo de 10 caracteres
 * - Pelo menos 1 letra maiúscula [A-Z]
 * - Pelo menos 1 letra minúscula [a-z]
 * - Pelo menos 1 número [0-9]
 */

export interface RegrasSenhaDetalhes {
  min10: boolean
  maiuscula: boolean
  minuscula: boolean
  numero: boolean
  simbolo: boolean
}

export interface ValidacaoSenhaResultado {
  valida: boolean
  erros: string[]
  mensagem: string
  regras: RegrasSenhaDetalhes
  pontos: number
  forca: 'fraca' | 'media' | 'forte'
}

// Símbolos aceitos: pontuação, caracteres especiais ou qualquer caractere não alfanumérico
export const REGEX_SIMBOLO = /[^A-Za-z0-9]/

export function avaliarRegrasSenha(senha: string): RegrasSenhaDetalhes {
  const s = String(senha || '')
  return {
    min10: s.length >= 10,
    maiuscula: /[A-Z]/.test(s),
    minuscula: /[a-z]/.test(s),
    numero: /[0-9]/.test(s),
    simbolo: REGEX_SIMBOLO.test(s),
  }
}

export function validarSenhaForte(senha: string): ValidacaoSenhaResultado {
  const erros: string[] = []
  const regras = avaliarRegrasSenha(senha)

  if (!regras.min10) {
    erros.push('mínimo de 10 caracteres')
  }
  if (!regras.maiuscula) {
    erros.push('pelo menos 1 letra maiúscula [A-Z]')
  }
  if (!regras.minuscula) {
    erros.push('pelo menos 1 letra minúscula [a-z]')
  }
  if (!regras.numero) {
    erros.push('pelo menos 1 número [0-9]')
  }
  if (!regras.simbolo) {
    erros.push('pelo menos 1 caractere especial ou símbolo (!@#$%^&*...)')
  }

  // Pontuação de força (0 a 5)
  const pontos =
    (regras.min10 ? 1 : 0) +
    (regras.maiuscula ? 1 : 0) +
    (regras.minuscula ? 1 : 0) +
    (regras.numero ? 1 : 0) +
    (regras.simbolo ? 1 : 0)

  let forca: 'fraca' | 'media' | 'forte' = 'fraca'
  if (pontos === 5) {
    forca = 'forte'
  } else if (pontos >= 3) {
    forca = 'media'
  }

  if (erros.length === 0) {
    return {
      valida: true,
      erros: [],
      mensagem: '',
      regras,
      pontos,
      forca: 'forte',
    }
  }

  const mensagem = `A senha informada não atende à política de segurança da Orbis Protocol. Falta: ${erros.join(', ')}.`
  return {
    valida: false,
    erros,
    mensagem,
    regras,
    pontos,
    forca,
  }
}
