/**
 * Serviço de consulta e enriquecimento cadastral de CNPJ
 * Integração: OpenCNPJ (primário, sem credencial, gratuito) com fallback resiliente
 * Fontes:
 * 1. OpenCNPJ (primário): https://api.opencnpj.org/{cnpj} (direto e/ou via proxy /backend/v1/cnpj/{cnpj})
 * 2. BrasilAPI (fallback 1): https://brasilapi.com.br/api/cnpj/v1/{cnpj}
 * 3. Minha Receita (fallback 2): https://minhareceita.org/{cnpj}
 */

import pb from '@/lib/pocketbase/client'

export interface ItemCnae {
  codigo: string | number
  descricao: string
  is_principal?: boolean
}

export interface DadosEmpresaCNPJ {
  cnpj: string
  razao_social: string
  nome_fantasia?: string
  situacao_cadastral?: string
  descricao_situacao_cadastral?: string
  data_situacao_cadastral?: string
  cnae_fiscal?: number | string
  cnae_fiscal_descricao?: string
  cnaes_secundarios?: string[]
  cnaes_lista?: ItemCnae[]
  logradouro?: string
  numero?: string
  complemento?: string
  bairro?: string
  municipio?: string
  uf?: string
  cep?: string
  ddd_telefone?: string
  email?: string
  capital_social?: number | string
  data_inicio_atividade?: string
  natureza_juridica?: string
  porte?: string
  opcao_simples?: boolean | string
  opcao_mei?: boolean | string
  regime_tributario_sugerido?: 'Simples Nacional' | 'Lucro Presumido' | 'Lucro Real' | 'A confirmar'
  fonte: 'opencnpj' | 'brasilapi' | 'minhareceita' | 'demonstracao'
  ativa: boolean
}

/**
 * Normaliza e remove qualquer caracter não numérico do CNPJ
 */
export function cleanCNPJ(cnpj: string): string {
  return cnpj.replace(/\D/g, '')
}

/**
 * Validação algorítmica de CNPJ brasileiro (dígitos verificadores oficiais)
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
 * Infere se a situação cadastral informada é ATIVA
 */
export function isSituacaoAtiva(situacao?: string | number): boolean {
  if (!situacao) return true // Se ausente, assume ativa como tolerante
  const sit = String(situacao).trim().toUpperCase()
  return (
    sit === 'ATIVA' || sit === '02' || sit === '2' || sit === 'HABILITADA' || sit.includes('ATIVA')
  )
}

/**
 * Infere o regime provável com base nos dados do Simples/Porte
 */
function inferRegime(
  opcaoPeloSimples?: boolean | string | null,
  porte?: string,
): 'Simples Nacional' | 'Lucro Presumido' | 'Lucro Real' | 'A confirmar' {
  if (
    opcaoPeloSimples === true ||
    opcaoPeloSimples === 'S' ||
    opcaoPeloSimples === 'SIM' ||
    opcaoPeloSimples === 'true'
  ) {
    return 'Simples Nacional'
  }
  const p = (porte || '').toUpperCase()
  if (p.includes('ME') || p.includes('EPP') || p.includes('MICRO')) {
    return 'Simples Nacional'
  }
  if (p.includes('DEMAIS') || p.includes('GRANDE')) {
    return 'Lucro Real'
  }
  return 'A confirmar'
}

/**
 * Consulta a API do OpenCNPJ diretamente no cliente HTTP
 * Endpoint: https://api.opencnpj.org/{cnpj}
 * Formato oficial:
 * {
 *   cnpj: "00000000000191",
 *   razao_social: "BANCO DO BRASIL SA",
 *   situacao_cadastral: "Ativa",
 *   cnae_principal: "6422100",
 *   cnaes_secundarios: ["6499999"],
 *   cnaes: [{ codigo: "6422100", descricao: "...", is_principal: true }, ...],
 *   porte_empresa: "Demais",
 *   opcao_simples: "N",
 *   ...
 * }
 */
export async function fetchOpenCNPJ(cnpjDigits: string): Promise<DadosEmpresaCNPJ> {
  const url = `https://api.opencnpj.org/${cnpjDigits}`
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  })

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('CNPJ não encontrado na base pública da Receita Federal (OpenCNPJ).')
    }
    throw new Error(`OpenCNPJ retornou status ${response.status}`)
  }

  const data = await response.json()
  if (!data || (!data.razao_social && !data.cnpj)) {
    throw new Error('Resposta de dados do OpenCNPJ vazia ou em formato desconhecido.')
  }

  // Identifica descrição do CNAE principal se vier em cnaes
  let cnaeDesc = ''
  let cnaesLista: ItemCnae[] = []
  if (Array.isArray(data.cnaes)) {
    cnaesLista = data.cnaes
    const princ = data.cnaes.find(
      (c: ItemCnae) => c.is_principal || String(c.codigo) === String(data.cnae_principal),
    )
    if (princ) {
      cnaeDesc = princ.descricao || ''
    }
  }

  // Telefones
  let telefoneFormatado = ''
  if (Array.isArray(data.telefones) && data.telefones.length > 0) {
    const foneValido =
      data.telefones.find((t: { is_fax?: boolean }) => !t.is_fax) || data.telefones[0]
    telefoneFormatado = formatTelefone(foneValido.ddd, foneValido.numero)
  }

  const situacaoRaw = data.situacao_cadastral || ''
  const ativa = isSituacaoAtiva(situacaoRaw)
  const regime = inferRegime(data.opcao_simples, data.porte_empresa)

  const logradouroCompleto = [data.tipo_logradouro, data.logradouro].filter(Boolean).join(' ')

  return {
    cnpj: cnpjDigits,
    razao_social: data.razao_social || data.nome_fantasia || '',
    nome_fantasia: data.nome_fantasia || '',
    situacao_cadastral: situacaoRaw,
    descricao_situacao_cadastral: situacaoRaw.toUpperCase(),
    data_situacao_cadastral: data.data_situacao_cadastral,
    cnae_fiscal: data.cnae_principal,
    cnae_fiscal_descricao: cnaeDesc,
    cnaes_secundarios: Array.isArray(data.cnaes_secundarios) ? data.cnaes_secundarios : [],
    cnaes_lista: cnaesLista,
    logradouro: logradouroCompleto,
    numero: data.numero,
    complemento: data.complemento,
    bairro: data.bairro,
    municipio: data.municipio,
    uf: data.uf,
    cep: data.cep ? data.cep.replace(/\D/g, '') : '',
    ddd_telefone: telefoneFormatado,
    email: data.email || '',
    capital_social: data.capital_social,
    data_inicio_atividade: data.data_inicio_atividade,
    natureza_juridica: data.natureza_juridica,
    porte: data.porte_empresa || 'Demais',
    opcao_simples: data.opcao_simples,
    opcao_mei: data.opcao_mei,
    regime_tributario_sugerido: regime,
    fonte: 'opencnpj',
    ativa,
  }
}

/**
 * Consulta a rota interna backend PocketBase /backend/v1/cnpj/{cnpj}
 * que centraliza a chamada e tenta OpenCNPJ -> BrasilAPI -> Minha Receita
 */
export async function fetchProxyBackend(cnpjDigits: string): Promise<DadosEmpresaCNPJ> {
  const url = `${pb.baseUrl}/backend/v1/cnpj/${cnpjDigits}`
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  })

  if (!response.ok) {
    let msg = `Erro no proxy backend: status ${response.status}`
    try {
      const errJson = await response.json()
      if (errJson?.error) msg = errJson.error
    } catch {
      /* intentionally ignored */
    }
    throw new Error(msg)
  }

  const resJson = await response.json()
  if (!resJson || !resJson.sucesso || !resJson.dados) {
    throw new Error(resJson?.error || 'Dados não retornados pelo proxy backend.')
  }

  const data = resJson.dados
  const fonte = resJson.fonte as 'opencnpj' | 'brasilapi' | 'minhareceita'

  if (fonte === 'opencnpj') {
    let cnaeDesc = ''
    let cnaesLista: ItemCnae[] = []
    if (Array.isArray(data.cnaes)) {
      cnaesLista = data.cnaes
      const princ = data.cnaes.find(
        (c: ItemCnae) => c.is_principal || String(c.codigo) === String(data.cnae_principal),
      )
      if (princ) cnaeDesc = princ.descricao || ''
    }
    let telefoneFormatado = ''
    if (Array.isArray(data.telefones) && data.telefones.length > 0) {
      const foneValido =
        data.telefones.find((t: { is_fax?: boolean }) => !t.is_fax) || data.telefones[0]
      telefoneFormatado = formatTelefone(foneValido.ddd, foneValido.numero)
    }
    const situacaoRaw = data.situacao_cadastral || ''
    const ativa = isSituacaoAtiva(situacaoRaw)
    const regime = inferRegime(data.opcao_simples, data.porte_empresa)
    return {
      cnpj: cnpjDigits,
      razao_social: data.razao_social || data.nome_fantasia || '',
      nome_fantasia: data.nome_fantasia || '',
      situacao_cadastral: situacaoRaw,
      descricao_situacao_cadastral: situacaoRaw.toUpperCase(),
      data_situacao_cadastral: data.data_situacao_cadastral,
      cnae_fiscal: data.cnae_principal,
      cnae_fiscal_descricao: cnaeDesc,
      cnaes_secundarios: Array.isArray(data.cnaes_secundarios) ? data.cnaes_secundarios : [],
      cnaes_lista: cnaesLista,
      logradouro: [data.tipo_logradouro, data.logradouro].filter(Boolean).join(' '),
      numero: data.numero,
      complemento: data.complemento,
      bairro: data.bairro,
      municipio: data.municipio,
      uf: data.uf,
      cep: data.cep ? data.cep.replace(/\D/g, '') : '',
      ddd_telefone: telefoneFormatado,
      email: data.email || '',
      capital_social: data.capital_social,
      data_inicio_atividade: data.data_inicio_atividade,
      natureza_juridica: data.natureza_juridica,
      porte: data.porte_empresa || 'Demais',
      opcao_simples: data.opcao_simples,
      opcao_mei: data.opcao_mei,
      regime_tributario_sugerido: regime,
      fonte: 'opencnpj',
      ativa,
    }
  }

  // Se o proxy retornou da BrasilAPI ou Minha Receita
  const tel = formatTelefone('', data.ddd_telefone_1 || data.ddd_telefone_2)
  const regime = inferRegime(data.opcao_pelo_simples, data.porte)
  const sit = String(data.descricao_situacao_cadastral || data.situacao_cadastral || 'ATIVA')
  const ativa = isSituacaoAtiva(sit)

  return {
    cnpj: cnpjDigits,
    razao_social: data.razao_social || data.nome_fantasia || '',
    nome_fantasia: data.nome_fantasia || '',
    situacao_cadastral: String(data.situacao_cadastral || ''),
    descricao_situacao_cadastral: sit.toUpperCase(),
    cnae_fiscal: data.cnae_fiscal,
    cnae_fiscal_descricao: data.cnae_fiscal_descricao || '',
    cnaes_secundarios: Array.isArray(data.cnaes_secundarios)
      ? data.cnaes_secundarios.map((c: { codigo?: string | number } | string) =>
          typeof c === 'object' && c !== null ? String(c.codigo) : String(c),
        )
      : [],
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
    fonte,
    ativa,
  }
}

/**
 * Consulta a BrasilAPI (fallback direto)
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
  const regime = inferRegime(data.opcao_pelo_simples, data.porte)
  const sit = String(data.descricao_situacao_cadastral || data.situacao_cadastral || 'ATIVA')
  const ativa = isSituacaoAtiva(sit)

  return {
    cnpj: cnpjDigits,
    razao_social: data.razao_social || data.nome_fantasia || '',
    nome_fantasia: data.nome_fantasia || '',
    situacao_cadastral: String(data.situacao_cadastral || ''),
    descricao_situacao_cadastral: sit.toUpperCase(),
    cnae_fiscal: data.cnae_fiscal,
    cnae_fiscal_descricao: data.cnae_fiscal_descricao || '',
    cnaes_secundarios: Array.isArray(data.cnaes_secundarios)
      ? data.cnaes_secundarios.map((c: { codigo?: string | number } | string) =>
          typeof c === 'object' && c !== null ? String(c.codigo) : String(c),
        )
      : [],
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
    ativa,
  }
}

/**
 * Consulta o Minha Receita (fallback direto)
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
  const regime = inferRegime(data.opcao_pelo_simples, data.porte)
  const sit = String(data.descricao_situacao_cadastral || data.situacao_cadastral || 'ATIVA')
  const ativa = isSituacaoAtiva(sit)

  return {
    cnpj: cnpjDigits,
    razao_social: data.razao_social || data.nome_fantasia || '',
    nome_fantasia: data.nome_fantasia || '',
    situacao_cadastral: String(data.situacao_cadastral || ''),
    descricao_situacao_cadastral: sit.toUpperCase(),
    cnae_fiscal: data.cnae_fiscal,
    cnae_fiscal_descricao: data.cnae_fiscal_descricao || '',
    cnaes_secundarios: Array.isArray(data.cnaes_secundarios)
      ? data.cnaes_secundarios.map((c: { codigo?: string | number } | string) =>
          typeof c === 'object' && c !== null ? String(c.codigo) : String(c),
        )
      : [],
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
    ativa,
  }
}

/**
 * Função principal: busca CNPJ no OpenCNPJ com estratégia em cascata e tolerância a falhas
 * Cascata:
 * 1. OpenCNPJ direto (alta velocidade, formato rico com cnaes completos)
 * 2. Proxy interno da plataforma (/backend/v1/cnpj/{cnpj})
 * 3. BrasilAPI (fallback)
 * 4. Minha Receita (fallback)
 */
export async function consultarCNPJ(cnpjInput: string): Promise<DadosEmpresaCNPJ> {
  const digits = cleanCNPJ(cnpjInput)
  if (digits.length !== 14) {
    throw new Error('CNPJ deve conter 14 dígitos numéricos.')
  }

  // 1. Tenta OpenCNPJ direto
  try {
    const resOpen = await fetchOpenCNPJ(digits)
    return resOpen
  } catch (errOpen) {
    // Se for explicitamente 404 (CNPJ não existe na base)
    if (errOpen instanceof Error && errOpen.message.includes('não encontrado')) {
      // Tenta uma verificação adicional na BrasilAPI para evitar falso negativo
      try {
        const resBrasil = await fetchBrasilAPI(digits)
        return resBrasil
      } catch (_) {
        throw new Error(
          'CNPJ não localizado na base pública da Receita Federal — confira a digitação.',
        )
      }
    }
  }

  // 2. Tenta Proxy Backend interno
  try {
    const resProxy = await fetchProxyBackend(digits)
    return resProxy
  } catch (_) {
    // Segue para os fallbacks diretos
  }

  // 3. Fallback: BrasilAPI
  try {
    const resBrasil = await fetchBrasilAPI(digits)
    return resBrasil
  } catch (errBrasil) {
    // 4. Fallback: Minha Receita
    try {
      const resMinhaReceita = await fetchMinhaReceita(digits)
      return resMinhaReceita
    } catch (errMinhaReceita) {
      throw new Error(
        'CNPJ não localizado na base da Receita Federal ou serviços de consulta temporariamente instáveis. Você pode preencher os dados manualmente.',
      )
    }
  }
}
