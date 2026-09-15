/**
 * Serviço de consulta cadastral de CNPJ
 * APIs públicas utilizadas:
 * 1. BrasilAPI (preferencial): https://brasilapi.com.br/api/cnpj/v1/{cnpj}
 * 2. Minha Receita (fallback): https://minhareceita.org/{cnpj}
 */

export interface DadosEmpresaCNPJ {
  cnpj: string
  razao_social: string
  nome_fantasia?: string
  situacao_cadastral?: string
  descricao_situacao_cadastral?: string
  cnae_fiscal?: number | string
  cnae_fiscal_descricao?: string
  logradouro?: string
  numero?: string
  complemento?: string
  bairro?: string
  municipio?: string
  uf?: string
  cep?: string
  ddd_telefone?: string
  email?: string
  capital_social?: number
  data_inicio_atividade?: string
  natureza_juridica?: string
  porte?: string
  regime_tributario_sugerido?: 'Simples Nacional' | 'Lucro Presumido' | 'Lucro Real' | 'A confirmar'
  fonte: 'brasilapi' | 'minhareceita'
}

/**
 * Normaliza e remove qualquer caracter não numérico do CNPJ
 */
export function cleanCNPJ(cnpj: string): string {
  return cnpj.replace(/\D/g, '')
}

/**
 * Validação algorítmica de CNPJ brasileiro (dígitos verificadores)
 */
export function isValidCNPJ(cnpjInput: string): boolean {
  const digits = cleanCNPJ(cnpjInput)
  if (digits.length !== 14) return false

  // Bloqueia dígitos repetidos óbvios (ex.: 00000000000000, 11111111111111)
  if (/^(\d)\1{13}$/.test(digits)) return false

  // Validação do 1º dígito verificador
  const b = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  let sum = 0
  for (let i = 0; i < 12; i++) {
    sum += parseInt(digits[i], 10) * b[i]
  }
  let mod = sum % 11
  const digit1 = mod < 2 ? 0 : 11 - mod
  if (parseInt(digits[12], 10) !== digit1) return false

  // Validação do 2º dígito verificador
  const b2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  sum = 0
  for (let i = 0; i < 13; i++) {
    sum += parseInt(digits[i], 10) * b2[i]
  }
  mod = sum % 11
  const digit2 = mod < 2 ? 0 : 11 - mod
  return parseInt(digits[13], 10) === digit2
}

/**
 * Formata um telefone com DDD retornado pelas APIs
 */
export function formatTelefone(ddd?: string, tel?: string): string {
  if (!tel && !ddd) return ''
  const full = `${ddd || ''}${tel || ''}`.replace(/\D/g, '')
  if (full.length === 11) {
    return `(${full.slice(0, 2)}) ${full.slice(2, 7)}-${full.slice(7)}`
  }
  if (full.length === 10) {
    return `(${full.slice(0, 2)}) ${full.slice(2, 6)}-${full.slice(6)}`
  }
  return full
}

/**
 * Infere o regime provável com base nos dados do Simples/Porte ou deixa padrão
 */
function inferRegime(
  opcaoPeloSimples?: boolean | null,
  porte?: string,
  capitalSocial?: number,
): 'Simples Nacional' | 'Lucro Presumido' | 'Lucro Real' | 'A confirmar' {
  if (opcaoPeloSimples === true) {
    return 'Simples Nacional'
  }
  return 'A confirmar'
}

/**
 * Consulta a BrasilAPI
 */
async function fetchBrasilAPI(cnpjDigits: string): Promise<DadosEmpresaCNPJ> {
  const url = `https://brasilapi.com.br/api/cnpj/v1/${cnpjDigits}`
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  })

  if (!response.ok) {
    let errorMsg = `BrasilAPI retornou status ${response.status}`
    try {
      const errJson = await response.json()
      if (errJson?.message) errorMsg = errJson.message
    } catch {
      // ignore
    }
    throw new Error(errorMsg)
  }

  const data = await response.json()

  const tel = formatTelefone('', data.ddd_telefone_1 || data.ddd_telefone_2)
  const regime = inferRegime(data.opcao_pelo_simples, data.porte, data.capital_social)

  return {
    cnpj: cnpjDigits,
    razao_social: data.razao_social || data.nome_fantasia || '',
    nome_fantasia: data.nome_fantasia || '',
    situacao_cadastral: String(data.situacao_cadastral || ''),
    descricao_situacao_cadastral: data.descricao_situacao_cadastral || 'ATIVA',
    cnae_fiscal: data.cnae_fiscal,
    cnae_fiscal_descricao: data.cnae_fiscal_descricao || '',
    logradouro: [data.descricao_tipo_de_logradouro, data.logradouro].filter(Boolean).join(' '),
    numero: data.numero,
    complemento: data.complemento,
    bairro: data.bairro,
    municipio: data.municipio,
    uf: data.uf,
    cep: data.cep,
    ddd_telefone: tel,
    email: data.email || '',
    capital_social: data.capital_social,
    data_inicio_atividade: data.data_inicio_atividade,
    natureza_juridica: data.natureza_juridica,
    porte: data.porte,
    regime_tributario_sugerido: regime,
    fonte: 'brasilapi',
  }
}

/**
 * Consulta o Minha Receita (fallback)
 */
async function fetchMinhaReceita(cnpjDigits: string): Promise<DadosEmpresaCNPJ> {
  const url = `https://minhareceita.org/${cnpjDigits}`
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  })

  if (!response.ok) {
    let errorMsg = `Minha Receita retornou status ${response.status}`
    try {
      const errJson = await response.json()
      if (errJson?.message) errorMsg = errJson.message
    } catch {
      // ignore
    }
    throw new Error(errorMsg)
  }

  const data = await response.json()

  const tel = formatTelefone('', data.ddd_telefone_1 || data.ddd_telefone_2)
  const regime = inferRegime(data.opcao_pelo_simples, data.porte, data.capital_social)

  return {
    cnpj: cnpjDigits,
    razao_social: data.razao_social || data.nome_fantasia || '',
    nome_fantasia: data.nome_fantasia || '',
    situacao_cadastral: String(data.situacao_cadastral || ''),
    descricao_situacao_cadastral: data.descricao_situacao_cadastral || 'ATIVA',
    cnae_fiscal: data.cnae_fiscal,
    cnae_fiscal_descricao: data.cnae_fiscal_descricao || '',
    logradouro: [data.descricao_tipo_de_logradouro, data.logradouro].filter(Boolean).join(' '),
    numero: data.numero,
    complemento: data.complemento,
    bairro: data.bairro,
    municipio: data.municipio,
    uf: data.uf,
    cep: data.cep,
    ddd_telefone: tel,
    email: data.email || '',
    capital_social: data.capital_social,
    data_inicio_atividade: data.data_inicio_atividade,
    natureza_juridica: data.natureza_juridica,
    porte: data.porte,
    regime_tributario_sugerido: regime,
    fonte: 'minhareceita',
  }
}

/**
 * Função principal: busca CNPJ na BrasilAPI com fallback transparente na Minha Receita
 */
export async function consultarCNPJ(cnpjInput: string): Promise<DadosEmpresaCNPJ> {
  const digits = cleanCNPJ(cnpjInput)
  if (digits.length !== 14) {
    throw new Error('CNPJ deve conter 14 dígitos numéricos.')
  }

  // Tenta 1: BrasilAPI
  try {
    const res = await fetchBrasilAPI(digits)
    return res
  } catch (errBrasil) {
    // Tenta 2: Minha Receita
    try {
      const resFallback = await fetchMinhaReceita(digits)
      return resFallback
    } catch (errMinhaReceita) {
      const msg =
        errBrasil instanceof Error
          ? errBrasil.message
          : errMinhaReceita instanceof Error
            ? errMinhaReceita.message
            : 'CNPJ não encontrado na base de dados pública da Receita Federal.'
      throw new Error(`Não foi possível localizar dados para o CNPJ ${cnpjInput}. Motivo: ${msg}`)
    }
  }
}
