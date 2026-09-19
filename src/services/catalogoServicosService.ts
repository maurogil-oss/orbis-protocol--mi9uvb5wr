import pb from '@/lib/pocketbase/client'

export interface ServicoCatalogoRecord {
  id: string
  nome: string
  servico_id: string
  descricao: string
  preco: number
  tipo: 'avulso' | 'recorrente'
  ativo: boolean
  ordem: number
  isFallback?: boolean
  divergenciaDetectada?: boolean
  created: string
  updated: string
}

export interface CatalogoResult {
  itens: ServicoCatalogoRecord[]
  isFallback: boolean
  divergenciaDetectada: boolean
}

export const PRODUTOS_REAIS_FALLBACK: Record<
  string,
  { nome: string; preco: number; tipo: 'avulso' | 'recorrente'; descricao: string }
> = {
  diagnostico: {
    nome: 'Diagnóstico Orbis (Essencial)',
    preco: 490,
    tipo: 'avulso',
    descricao:
      'Primeiro resultado prévio validado por CNPJ com Hash de integridade criptográfica dMRV e Selo Oficial.',
  },
  laudo_pericial: {
    nome: 'Laudo Pericial com ART (MOVER)',
    preco: 2850,
    tipo: 'avulso',
    descricao:
      'Chancela de perito homologado com ART/RRT acoplada, laudo NBC TO 3000 do CFC e dossiê para créditos MOVER.',
  },
  assinatura_bureau: {
    nome: 'Bureau ACP (Corporativo)',
    preco: 7800,
    tipo: 'recorrente',
    descricao:
      'Gestão contínua, passaportes do fornecedor com revelação seletiva, dossiê contínuo BRDE/fomento e curva MAC.',
  },
}

export async function listarServicosCatalogoComStatus(): Promise<CatalogoResult> {
  try {
    const records = await pb.collection('servicos_catalogo').getFullList<ServicoCatalogoRecord>({
      sort: 'ordem',
      filter: 'ativo = true',
    })
    if (records.length > 0) {
      // Verificar se há divergência com tabela padrão de fallback
      let divergencia = false
      const marcados = records.map((r) => {
        const fb = PRODUTOS_REAIS_FALLBACK[r.servico_id]
        const temDivergencia = fb ? Number(fb.preco) !== Number(r.preco) : false
        if (temDivergencia) divergencia = true
        return {
          ...r,
          isFallback: false,
          divergenciaDetectada: temDivergencia,
        }
      })
      return {
        itens: marcados,
        isFallback: false,
        divergenciaDetectada: divergencia,
      }
    }
  } catch (err) {
    console.warn('Fallback catálogo serviços ativado:', err)
  }

  // Fallback ativado por falha ou coleção vazia
  const fallbackItens: ServicoCatalogoRecord[] = Object.entries(PRODUTOS_REAIS_FALLBACK).map(
    ([key, item], index) => ({
      id: key,
      nome: item.nome,
      servico_id: key,
      descricao: item.descricao,
      preco: item.preco,
      tipo: item.tipo,
      ativo: true,
      ordem: index + 1,
      isFallback: true,
      divergenciaDetectada: true,
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
    }),
  )

  return {
    itens: fallbackItens,
    isFallback: true,
    divergenciaDetectada: true,
  }
}

export async function listarServicosCatalogo(): Promise<ServicoCatalogoRecord[]> {
  const res = await listarServicosCatalogoComStatus()
  return res.itens
}

export async function obterServicoCatalogo(
  servicoId: string,
): Promise<ServicoCatalogoRecord | null> {
  try {
    const rec = await pb
      .collection('servicos_catalogo')
      .getFirstListItem<ServicoCatalogoRecord>(`servico_id = "${servicoId}"`)
    if (rec) return rec
  } catch {
    /* intentionally ignored */
  }

  const fallback = PRODUTOS_REAIS_FALLBACK[servicoId]
  if (fallback) {
    return {
      id: servicoId,
      nome: fallback.nome,
      servico_id: servicoId,
      descricao: fallback.descricao,
      preco: fallback.preco,
      tipo: fallback.tipo,
      ativo: true,
      ordem: 1,
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
    }
  }

  return null
}

export async function criarServicoCatalogo(
  dados: Partial<ServicoCatalogoRecord>,
): Promise<ServicoCatalogoRecord> {
  return pb.collection('servicos_catalogo').create<ServicoCatalogoRecord>(dados)
}

export async function atualizarServicoCatalogo(
  id: string,
  dados: Partial<ServicoCatalogoRecord>,
): Promise<ServicoCatalogoRecord> {
  return pb.collection('servicos_catalogo').update<ServicoCatalogoRecord>(id, dados)
}

export async function excluirServicoCatalogo(id: string): Promise<boolean> {
  return pb.collection('servicos_catalogo').delete(id)
}
