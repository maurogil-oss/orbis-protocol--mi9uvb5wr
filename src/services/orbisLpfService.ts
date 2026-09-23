/**
 * Orbis LPF — Leitura Pré-Faturamento
 * Serviço frontend para submissão de solicitação de leitura gratuita e validação de 1 por CNPJ.
 */

import pb from '@/lib/pocketbase/client'
import { cleanCNPJ, isValidCNPJ } from '@/services/cnpj'

export type SetorOrbisLpf =
  | 'aço'
  | 'alumínio'
  | 'cimento'
  | 'fertilizantes'
  | 'agroindústria'
  | 'autopeças'
  | 'outro'

export interface SolicitacaoLpfInput {
  cnpj: string
  razao_social: string
  email: string
  telefone?: string
  whatsapp?: string
  setor: SetorOrbisLpf | string
  volume_exportacao?: string
}

export interface SolicitacaoLpfResultado {
  success: boolean
  ja_solicitado: boolean
  message: string
  id?: string
  error?: string
}

export function maskCNPJ(value: string): string {
  return value
    .replace(/\D/g, '')
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
    .slice(0, 18)
}

export function maskPhone(value: string): string {
  return value
    .replace(/\D/g, '')
    .replace(/^(\d{2})(\d)/g, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .slice(0, 15)
}

export function validarEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

/**
 * Validação prévia de campos da solicitação LPF
 */
export function validarCamposLpf(dados: Partial<SolicitacaoLpfInput>): {
  valido: boolean
  erros: Record<string, string>
} {
  const erros: Record<string, string> = {}

  const digits = cleanCNPJ(dados.cnpj || '')
  if (!digits) {
    erros.cnpj = 'O CNPJ é obrigatório.'
  } else if (digits.length !== 14) {
    erros.cnpj = 'O CNPJ deve conter 14 dígitos.'
  } else if (!isValidCNPJ(digits)) {
    erros.cnpj = 'CNPJ inválido (dígitos verificadores incorretos).'
  }

  if (!dados.razao_social || !dados.razao_social.trim()) {
    erros.razao_social = 'A Razão Social é obrigatória.'
  }

  if (!dados.email || !dados.email.trim()) {
    erros.email = 'O E-mail comercial é obrigatório.'
  } else if (!validarEmail(dados.email)) {
    erros.email = 'Informe um e-mail comercial válido.'
  }

  if (!dados.setor || !dados.setor.trim()) {
    erros.setor = 'Selecione o setor da sua empresa.'
  }

  return {
    valido: Object.keys(erros).length === 0,
    erros,
  }
}

/**
 * Envia a solicitação de leitura gratuita Orbis LPF para o endpoint de backend.
 * Trata o caso de CNPJ já cadastrado com mensagem amigável:
 * "Este CNPJ já solicitou a leitura gratuita — nossa equipe entrará em contato."
 */
export async function enviarSolicitacaoLpf(
  dados: SolicitacaoLpfInput,
): Promise<SolicitacaoLpfResultado> {
  const validacao = validarCamposLpf(dados)
  if (!validacao.valido) {
    const primeiroErro = Object.values(validacao.erros)[0]
    return {
      success: false,
      ja_solicitado: false,
      message: primeiroErro,
      error: primeiroErro,
    }
  }

  const endpoint = `${pb.baseUrl}/backend/v1/orbis-lpf-submit`

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        cnpj: dados.cnpj,
        razao_social: dados.razao_social,
        email: dados.email,
        whatsapp: dados.whatsapp || dados.telefone || '',
        setor: dados.setor,
        volume_exportacao: dados.volume_exportacao || '',
      }),
    })

    if (!res.ok) {
      let erroTexto = 'Erro ao processar solicitação.'
      try {
        const erroJson = await res.json()
        erroTexto = erroJson.error || erroJson.message || erroTexto
      } catch {
        /* intentionally ignored */
      }
      return {
        success: false,
        ja_solicitado: false,
        message: erroTexto,
        error: erroTexto,
      }
    }

    const json = await res.json()

    if (json.ja_solicitado) {
      return {
        success: true,
        ja_solicitado: true,
        message:
          json.message ||
          'Este CNPJ já solicitou a leitura gratuita — nossa equipe entrará em contato.',
        id: json.id,
      }
    }

    return {
      success: true,
      ja_solicitado: false,
      message: json.message || 'Solicitação de leitura pré-faturamento enviada com sucesso.',
      id: json.id,
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Falha na conexão com o servidor.'
    return {
      success: false,
      ja_solicitado: false,
      message: msg,
      error: msg,
    }
  }
}
