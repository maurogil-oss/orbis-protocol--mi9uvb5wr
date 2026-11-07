import pb from '@/lib/pocketbase/client'

export interface VerificacaoDuplicidadeNfeResult {
  duplicada: boolean
  idExistente?: string
  dataImportacao?: string
  numeroNota?: string
  mensagem?: string
}

/**
 * Formata data ISO (ex: "2026-03-15 14:20:00.000Z") para formato legível DD/MM/AAAA ou YYYY-MM-DD
 */
export function formatarDataImportacao(dataRaw?: string): string {
  if (!dataRaw) return 'data não identificada'
  try {
    const d = new Date(dataRaw)
    if (!isNaN(d.getTime())) {
      const dia = String(d.getDate()).padStart(2, '0')
      const mes = String(d.getMonth() + 1).padStart(2, '0')
      const ano = d.getFullYear()
      return `${dia}/${mes}/${ano}`
    }
  } catch {
    // fallback para substring
  }
  return dataRaw.slice(0, 10)
}

/**
 * Mensagem canônica de erro de rejeição por duplicidade
 */
export function buildMensagemDuplicidade(
  dataImportacaoFormatada: string,
  numeroNota?: string,
): string {
  const notaComplemento = numeroNota ? ` (Nota nº ${numeroNota})` : ''
  return `Esta nota${notaComplemento} já foi importada em ${dataImportacaoFormatada} — importação bloqueada por duplicidade.`
}

/**
 * Consulta se uma chave de acesso já existe na coleção `nfe_upload`.
 * Retorna se está duplicada, os dados do registro existente e a mensagem clara formatada.
 */
export async function verificarDuplicidadeNfe(
  chaveAcesso?: string,
): Promise<VerificacaoDuplicidadeNfeResult> {
  if (!chaveAcesso) {
    return { duplicada: false }
  }

  const chaveLimpa = chaveAcesso.replace(/\D/g, '')
  if (!chaveLimpa) {
    return { duplicada: false }
  }

  try {
    // Busca registro existente por chave_acesso
    const existente = await pb
      .collection('nfe_upload')
      .getFirstListItem(`chave_acesso = "${chaveLimpa}"`, {
        fields: 'id,chave_acesso,numero_nota,created,data_emissao',
      })

    if (existente && existente.id) {
      const dataRaw = existente.created || (existente as any).data_emissao || ''
      const dataFormatada = formatarDataImportacao(dataRaw)
      const numNota = existente.numero_nota || undefined
      const mensagem = buildMensagemDuplicidade(dataFormatada, numNota)

      console.warn(
        `[nfeDuplicidadeService] Tentativa de importação duplicada rejeitada: chave=${chaveLimpa}, existenteId=${existente.id}, importadaEm=${dataFormatada}`,
      )

      return {
        duplicada: true,
        idExistente: existente.id,
        dataImportacao: dataFormatada,
        numeroNota: numNota,
        mensagem,
      }
    }
  } catch (err: any) {
    // Se status for 404 (não encontrado), significa que a chave NÃO existe — ok continuar
    if (err?.status === 404 || err?.response?.status === 404) {
      return { duplicada: false }
    }
    // Outros erros (ex: timeout ou permissão) loga e não bloqueia se for apenas falha de leitura
    console.error('[nfeDuplicidadeService] Erro ao consultar duplicidade de NF-e:', err)
  }

  return { duplicada: false }
}
