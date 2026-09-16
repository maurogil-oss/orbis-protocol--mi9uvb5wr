import pb from '@/lib/pocketbase/client'
import { calcularSha256Hex } from './validadorFiscalChave'

export interface HashCompetenciaRecord {
  id: string
  usuario: string
  cnpj: string
  competencia: string // ex: "2026-07" ou "07/2026"
  hash_fechamento: string // "0x..."
  total_notas: number
  chaves_inclusas: string[]
  data_fechamento: string
  created?: string
  updated?: string
}

export interface FecharCompetenciaInput {
  cnpj: string
  competencia: string
  chavesOuHashesNotas: string[]
}

/**
 * Calcula o hash encadeado de fechamento por competência.
 * Regra: SHA-256 sobre a concatenação dos hashes/chaves individuais ordenados lexicograficamente.
 * Denominação exclusiva: "hash de fechamento por competência" (sem menção a ZKP, blockchain ou ledger).
 */
export async function calcularHashFechamentoCompetencia(chavesOuHashes: string[]): Promise<string> {
  if (!chavesOuHashes || chavesOuHashes.length === 0) {
    const rawVazio = 'COMPETENCIA_VAZIA'
    const hex = await calcularSha256Hex(rawVazio)
    return `0x${hex}`
  }

  // Ordenação lexicográfica estrita
  const ordenados = [...chavesOuHashes].map((s) => String(s).trim()).sort()
  const concatenacao = ordenados.join('|')
  const sha = await calcularSha256Hex(concatenacao)
  return `0x${sha}`
}

/**
 * Registra o fechamento da competência na coleção hashes_competencia do PocketBase.
 */
export async function registrarFechamentoCompetencia(
  input: FecharCompetenciaInput,
): Promise<HashCompetenciaRecord> {
  const user = pb.authStore.record
  if (!user) {
    throw new Error('Usuário autenticado necessário para fechar competência.')
  }

  const hashFechamento = await calcularHashFechamentoCompetencia(input.chavesOuHashesNotas)
  const dataFechamento = new Date().toISOString()

  // Verifica se já existe fechamento para esta competência e CNPJ; se existir atualiza, senão cria
  try {
    const existentes = await pb.collection('hashes_competencia').getList(1, 1, {
      filter: `cnpj = "${input.cnpj}" && competencia = "${input.competencia}"`,
    })

    if (existentes.items.length > 0) {
      const rec = existentes.items[0]
      const atualizado = await pb.collection('hashes_competencia').update(rec.id, {
        hash_fechamento: hashFechamento,
        total_notas: input.chavesOuHashesNotas.length,
        chaves_inclusas: input.chavesOuHashesNotas,
        data_fechamento: dataFechamento,
      })
      return atualizado as unknown as HashCompetenciaRecord
    }
  } catch {
    /* intentionally ignored */
  }

  const criado = await pb.collection('hashes_competencia').create({
    usuario: user.id,
    cnpj: input.cnpj,
    competencia: input.competencia,
    hash_fechamento: hashFechamento,
    total_notas: input.chavesOuHashesNotas.length,
    chaves_inclusas: input.chavesOuHashesNotas,
    data_fechamento: dataFechamento,
  })

  return criado as unknown as HashCompetenciaRecord
}

/**
 * Consulta o hash de fechamento da competência mais recente para um determinado CNPJ e competência.
 */
export async function obterFechamentoCompetencia(
  cnpj: string,
  competencia?: string,
): Promise<HashCompetenciaRecord | null> {
  try {
    const filter = competencia
      ? `cnpj = "${cnpj}" && competencia = "${competencia}"`
      : `cnpj = "${cnpj}"`
    const res = await pb.collection('hashes_competencia').getList(1, 1, {
      filter,
      sort: '-created',
    })

    if (res.items.length > 0) {
      return res.items[0] as unknown as HashCompetenciaRecord
    }
    return null
  } catch {
    return null
  }
}
