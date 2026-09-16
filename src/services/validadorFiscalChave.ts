/**
 * Utilitários de validação e integridade criptográfica de chaves de acesso
 * e documentos fiscais eletrônicos (NF-e, CT-e, NFC-e, MDF-e, etc.).
 *
 * Padrão Manual de Orientação do Contribuinte (MOC / SEFAZ):
 * - Chave de acesso: 44 dígitos numéricos.
 * - Os primeiros 43 dígitos compõem o corpo do documento.
 * - O 44º dígito é o Dígito Verificador (DV) calculado via Módulo 11
 *   com pesos de 2 a 9 da direita para a esquerda.
 * - Resto da divisão por 11:
 *     resto 0 ou 1 => DV = 0;
 *     DV calculado (11 - resto) >= 10 => DV = 0.
 */

export interface ValidacaoChaveAcessoResultado {
  valida: boolean
  chaveLimpa: string
  dvEsperado?: number
  dvInformado?: number
  mensagemErro?: string
}

/**
 * Valida o DV módulo 11 de uma chave de acesso fiscal de 44 dígitos (NF-e, CT-e, etc.).
 */
export function validarChaveAcesso44(
  chaveAcessoRaw: string | null | undefined,
): ValidacaoChaveAcessoResultado {
  if (!chaveAcessoRaw) {
    return {
      valida: false,
      chaveLimpa: '',
      mensagemErro: 'Chave de acesso não informada.',
    }
  }

  const chaveLimpa = String(chaveAcessoRaw).replace(/\D/g, '').trim()

  if (chaveLimpa.length !== 44) {
    return {
      valida: false,
      chaveLimpa,
      mensagemErro: `Chave de acesso incompleta: esperado 44 dígitos, recebido ${chaveLimpa.length}.`,
    }
  }

  const base43 = chaveLimpa.slice(0, 43)
  const dvInformado = parseInt(chaveLimpa.charAt(43), 10)

  // Cálculo Módulo 11: pesos de 2 a 9 da direita para a esquerda
  let soma = 0
  let peso = 2

  for (let i = base43.length - 1; i >= 0; i--) {
    const digito = parseInt(base43.charAt(i), 10)
    soma += digito * peso
    peso++
    if (peso > 9) {
      peso = 2
    }
  }

  const resto = soma % 11
  let dvCalculado = 11 - resto
  if (resto === 0 || resto === 1 || dvCalculado >= 10) {
    dvCalculado = 0
  }

  const valida = dvCalculado === dvInformado

  return {
    valida,
    chaveLimpa,
    dvEsperado: dvCalculado,
    dvInformado,
    mensagemErro: valida ? undefined : 'Chave de acesso inválida — DV módulo 11 não confere.',
  }
}

/**
 * Calcula o hash SHA-256 de uma string no navegador (Web Crypto API) ou fallback universal.
 */
export async function calcularSha256Hex(texto: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const msgUint8 = new TextEncoder().encode(texto)
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
  }

  // Fallback determinístico caso Web Crypto não esteja disponível em ambientes legados
  let h1 = 0xdeadbeef ^ 0
  let h2 = 0x41c6ce57 ^ 0
  for (let i = 0; i < texto.length; i++) {
    const ch = texto.charCodeAt(i)
    h1 = Math.imul(h1 ^ ch, 2654435761)
    h2 = Math.imul(h2 ^ ch, 1597334677)
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909)
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909)
  const hexPart = (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16)
  return hexPart.padStart(64, '0')
}

/**
 * Gera o identificador hash da chave de acesso para controle de deduplicação e encadeamento.
 */
export async function calcularHashChaveAcesso(chave44: string): Promise<string> {
  const chaveLimpa = chave44.replace(/\D/g, '').trim()
  return calcularSha256Hex(chaveLimpa)
}
