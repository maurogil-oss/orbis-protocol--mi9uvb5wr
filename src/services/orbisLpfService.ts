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
  email: string
  setor: SetorOrbisLpf | string
  razao_social?: string
  telefone?: string
  whatsapp?: string
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

  if (!dados.email || !dados.email.trim()) {
    erros.email = 'O E-mail corporativo é obrigatório.'
  } else if (!validarEmail(dados.email)) {
    erros.email = 'Informe um e-mail corporativo válido (ex: nome@empresa.com.br).'
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

  const digits = cleanCNPJ(dados.cnpj)
  const razaoSocialNome = dados.razao_social?.trim() || `Empresa CNPJ ${maskCNPJ(digits)}`
  const emailNorm = dados.email.trim().toLowerCase()
  const setorNorm = dados.setor.trim()

  // 1. Tentar gravar via hook customizado pb_hooks /backend/v1/orbis-lpf-submit
  const endpoint = `${pb.baseUrl}/backend/v1/orbis-lpf-submit`
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        cnpj: digits,
        razao_social: razaoSocialNome,
        email: emailNorm,
        whatsapp: dados.whatsapp || dados.telefone || '',
        setor: setorNorm,
        volume_exportacao: dados.volume_exportacao || '',
      }),
    })

    if (res.ok) {
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
        message: json.message || 'Solicitação de leitura gratuita enviada com sucesso.',
        id: json.id,
      }
    }
  } catch (errEndpoint) {
    console.warn(
      '[OrbisLPF] Endpoint pb_hooks indisponível, tentando collection direta leads_diagnostico:',
      errEndpoint,
    )
  }

  // 2. Persistir diretamente na collection leads_diagnostico do PocketBase
  try {
    // Verificar se já existe solicitação com esse CNPJ
    try {
      const existente = await pb
        .collection('leads_diagnostico')
        .getFirstListItem(`cnpj="${digits}"`)
      if (existente) {
        return {
          success: true,
          ja_solicitado: true,
          message: 'Este CNPJ já solicitou a leitura gratuita — nossa equipe entrará em contato.',
          id: existente.id,
        }
      }
    } catch {
      // Se não encontrou (404), continua para criar novo
    }

    const leadRecord = await pb.collection('leads_diagnostico').create({
      cnpj: digits,
      razao_social: razaoSocialNome,
      email: emailNorm,
      telefone: dados.telefone || dados.whatsapp || '',
      setor: setorNorm,
      origem: 'lpf_leitura_gratuita',
      status: 'novo',
      dados_adicionais: {
        origem: 'home_lpf_3_campos',
        tipo_solicitacao: 'lpf_leitura_gratuita',
        setor: setorNorm,
        data_solicitacao: new Date().toISOString(),
      },
    })

    return {
      success: true,
      ja_solicitado: false,
      message: 'Solicitação de leitura gratuita enviada com sucesso.',
      id: leadRecord.id,
    }
  } catch (errDb: unknown) {
    console.warn(
      '[OrbisLPF] Falha ao persistir em leads_diagnostico, salvando em contingência local:',
      errDb,
    )

    // 3. Fallback seguro em localStorage
    try {
      const backupKey = 'orbis_lpf_leads_backup'
      const salvos = JSON.parse(localStorage.getItem(backupKey) || '[]')
      const jaExiste = salvos.some((l: { cnpj: string }) => l.cnpj === digits)
      if (jaExiste) {
        return {
          success: true,
          ja_solicitado: true,
          message: 'Este CNPJ já solicitou a leitura gratuita — nossa equipe entrará em contato.',
        }
      }

      salvos.push({
        cnpj: digits,
        email: emailNorm,
        setor: setorNorm,
        razao_social: razaoSocialNome,
        origem: 'lpf_leitura_gratuita',
        data: new Date().toISOString(),
      })
      localStorage.setItem(backupKey, JSON.stringify(salvos))

      return {
        success: true,
        ja_solicitado: false,
        message: 'Solicitação de leitura gratuita registrada com sucesso.',
      }
    } catch {
      const msg = errDb instanceof Error ? errDb.message : 'Falha na conexão com o servidor.'
      return {
        success: false,
        ja_solicitado: false,
        message: msg,
        error: msg,
      }
    }
  }
}
