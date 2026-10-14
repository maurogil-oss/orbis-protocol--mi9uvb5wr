/**
 * SERVIÇO DE LEITURA E PRÉ-PREENCHIMENTO DE NOTA FISCAL (AGENTE NATIVO SKIP CLOUD)
 *
 * Agente: "triador-ingestao-cdv"
 * Rota Backend: POST /backend/v1/cdv/leitura-nota
 *
 * Princípios Fundamentais (Invioláveis):
 * 1. Os dados extraídos do documento (PDF/imagem/texto) são ESTRITAMENTE SUGESTÕES de pré-preenchimento.
 * 2. NADA é gravado automaticamente no lote sem revisão e confirmação humana explícita.
 * 3. Auditoria transparente: cada campo confirmado registra procedência (leitura automática vs manual)
 *    e a identidade do confirmador (nome e e-mail da sessão).
 * 4. Degradação graciosa: se o documento for ilegível, protegido ou falhar, o fluxo cai suavemente
 *    para preenchimento manual com aviso claro, sem quebrar ou bloquear.
 * 5. NUNCA calcula nem decide CO₂e, fatores de desconto ou hash SHA-256 (competência do motor determinístico DM-ORB-001 v1.1).
 */

import pb from '@/lib/pocketbase/client'

export interface ItemNfeSugerido {
  descricao: string
  ncm?: string
  quantidade?: number
  valor_total?: number
  peso_kg?: number
  categoria_sugerida?:
    | 'aco'
    | 'aluminio'
    | 'cobre'
    | 'polimeros'
    | 'concreto'
    | 'agro_rastreado'
    | 'outros'
}

export interface DadosNotaFiscalSugeridos {
  numero_nota: string
  serie: string
  data_emissao: string
  emitente_razao_social: string
  emitente_cnpj: string
  destinatario_razao_social: string
  destinatario_cnpj_cpf: string
  descricao_material: string
  peso_liquido_kg: number
  peso_bruto_kg: number
  valor_total: number
  itens?: ItemNfeSugerido[]
}

export interface RespostaLeituraNotaFiscal {
  sucesso_leitura: boolean
  degradacao_graciosa: boolean
  fonte?: 'agente_nativo' | 'extracao_contingencia'
  agente?: string
  documento_arquivo?: string
  documento_truncado?: boolean
  confianca?: 'alta' | 'media' | 'baixa'
  tipo_documento?: 'NFE' | 'DANFE' | 'CTE' | 'DESCONHECIDO'
  dados_sugeridos: DadosNotaFiscalSugeridos | null
  alertas?: string[]
  mensagem_aviso?: string
  mensagem_operador?: string
  motivo?: string
}

export interface MetadadosAuditoriaCampo {
  origem: 'leitura_automatica' | 'manual'
  valor_sugerido_original?: any
  confirmado_por_nome: string
  confirmado_por_email: string
  data_confirmacao: string
  documento_origem_ref?: string
}

export interface LoteComAuditoriaPreenchimento {
  numero_nota: string
  serie: string
  data_emissao: string
  emitente_razao_social: string
  emitente_cnpj: string
  destinatario_razao_social: string
  destinatario_cnpj_cpf: string
  descricao_material: string
  peso_liquido_kg: number
  peso_bruto_kg: number
  valor_total: number
  itens: ItemNfeSugerido[]
  auditoria: {
    campos: Record<string, MetadadosAuditoriaCampo>
    confirmado_em: string
    confirmado_por: {
      nome: string
      email: string
    }
    documento_lido_ref?: string
    fonte_leitura?: string
  }
}

/**
 * Envia um arquivo anexado (PDF ou imagem) ou texto/XML para a rota de leitura do Triador de Ingestão CDV.
 * Não lança erro fatal; em caso de falha de rede ou timeout, degrada graciosamente para preenchimento manual.
 */
export async function lerNotaFiscalParaSugestao(params: {
  arquivo?: File | Blob
  nomeArquivo?: string
  textoOuXml?: string
  timeoutMs?: number
}): Promise<RespostaLeituraNotaFiscal> {
  const timeoutMs = params.timeoutMs || 15000
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null
  const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null

  try {
    const url = `${pb.baseUrl}/backend/v1/cdv/leitura-nota`
    let response: Response

    if (params.arquivo) {
      // Envio via FormData (multipart) para processamento server-side com $documents.toMarkdown
      const formData = new FormData()
      formData.append(
        'arquivo',
        params.arquivo,
        params.nomeArquivo || (params.arquivo as any).name || 'nota_fiscal.pdf',
      )
      if (params.textoOuXml) {
        formData.append('texto', params.textoOuXml)
      }

      response = await fetch(url, {
        method: 'POST',
        headers: {
          ...(pb.authStore.token ? { Authorization: pb.authStore.token } : {}),
        },
        body: formData,
        signal: controller ? controller.signal : undefined,
      })
    } else {
      // Envio via payload JSON com texto/markdown extraído
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(pb.authStore.token ? { Authorization: pb.authStore.token } : {}),
        },
        body: JSON.stringify({
          texto: params.textoOuXml || '',
          nome_arquivo: params.nomeArquivo || 'documento_nota_fiscal.txt',
        }),
        signal: controller ? controller.signal : undefined,
      })
    }

    if (!response.ok) {
      console.warn(
        `[leitorNotaFiscalService] Resposta HTTP ${response.status} na rota de leitura (degradação graciosa).`,
      )
      return {
        sucesso_leitura: false,
        degradacao_graciosa: true,
        motivo: `Serviço respondeu status HTTP ${response.status}.`,
        mensagem_aviso: 'Não foi possível ler o documento — preenchimento manual.',
        dados_sugeridos: null,
      }
    }

    const data: RespostaLeituraNotaFiscal = await response.json()
    return data
  } catch (err: any) {
    console.warn(
      '[leitorNotaFiscalService] Exceção na leitura documental (degradação graciosa ativada):',
      err?.message || err,
    )
    return {
      sucesso_leitura: false,
      degradacao_graciosa: true,
      motivo: err?.message || 'Falha de comunicação ou timeout na leitura.',
      mensagem_aviso: 'Não foi possível ler o documento — preenchimento manual.',
      dados_sugeridos: null,
    }
  } finally {
    if (timer) clearTimeout(timer)
  }
}

/**
 * Constrói o envelope de auditoria completo quando o operador humano confirma os valores sugeridos.
 * NADA é salvo sem esse passo explícito.
 */
export function construirRegistroAuditoriaLote(params: {
  valoresFinais: DadosNotaFiscalSugeridos
  sugestoesOriginais: DadosNotaFiscalSugeridos | null
  usuarioConfirmador: {
    nome?: string
    email?: string
  }
  documentoRef?: string
  fonteLeitura?: string
}): LoteComAuditoriaPreenchimento {
  const agoraIso = new Date().toISOString()
  const nome = params.usuarioConfirmador.nome || 'Operador Responsável'
  const email = params.usuarioConfirmador.email || 'operador@orbisprotocol.com'

  const camposAuditoria: Record<string, MetadadosAuditoriaCampo> = {}
  const camposChave: (keyof DadosNotaFiscalSugeridos)[] = [
    'numero_nota',
    'serie',
    'data_emissao',
    'emitente_razao_social',
    'emitente_cnpj',
    'destinatario_razao_social',
    'destinatario_cnpj_cpf',
    'descricao_material',
    'peso_liquido_kg',
    'peso_bruto_kg',
    'valor_total',
  ]

  for (const chave of camposChave) {
    const valFinal = params.valoresFinais[chave]
    const valSugerido = params.sugestoesOriginais ? params.sugestoesOriginais[chave] : undefined
    const veioDeSugestao = Boolean(
      params.sugestoesOriginais &&
      valSugerido !== undefined &&
      valSugerido !== null &&
      valSugerido !== '' &&
      valSugerido !== 0,
    )

    camposAuditoria[chave] = {
      origem: veioDeSugestao ? 'leitura_automatica' : 'manual',
      valor_sugerido_original: veioDeSugestao ? valSugerido : undefined,
      confirmado_por_nome: nome,
      confirmado_por_email: email,
      data_confirmacao: agoraIso,
      documento_origem_ref: params.documentoRef || 'Anexo NF-e',
    }
  }

  return {
    ...params.valoresFinais,
    itens: params.valoresFinais.itens || [],
    auditoria: {
      campos: camposAuditoria,
      confirmado_em: agoraIso,
      confirmado_por: { nome, email },
      documento_lido_ref: params.documentoRef,
      fonte_leitura: params.fonteLeitura || 'triador-ingestao-cdv',
    },
  }
}
