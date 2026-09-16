import pb from '@/lib/pocketbase/client'

export interface ItemMatrizGRI {
  codigo: string
  nome: string
  status: 'atendido' | 'parcial' | 'em_desenvolvimento' | 'nao_aplicavel'
}

export interface MatrizGRIJson {
  economica?: {
    status: string
    itens: ItemMatrizGRI[]
  }
  ambiental?: {
    status: string
    itens: ItemMatrizGRI[]
  }
  social?: {
    status: string
    itens: ItemMatrizGRI[]
  }
}

export interface CertidaoItem {
  nome: string
  emissor: string
  status: 'valida' | 'pendente' | 'em_renovacao'
  validade?: string
}

export interface PontoCurvaMAC {
  iniciativa: string
  custo_reais_por_tco2e: number // Negativo = economia líquida
  potencial_reducao_tco2e: number
  pay_back_meses?: number
}

export interface DossieElegibilidadeItem {
  atende: boolean
  pontuacao: number
  itens_atendidos: string[]
}

export interface DossieElegibilidadeJson {
  brde_recupera_sul?: DossieElegibilidadeItem
  fomento_parana_verde?: DossieElegibilidadeItem
  bndes_clima?: DossieElegibilidadeItem
  [key: string]: DossieElegibilidadeItem | undefined
}

export interface ConfigRevelacaoSeletiva {
  mostrar_kg_co2e_produzido: boolean
  mostrar_score_esg: boolean
  mostrar_matriz_gri: boolean
  mostrar_certidoes: boolean
  mostrar_curva_mac: boolean
  mostrar_dossie_elegibilidade: boolean
  // Campos de sigilo comercial absoluto (sempre falsos / nunca revelados):
  mostrar_volume_financeiro?: boolean
  mostrar_margem_lucro?: boolean
  mostrar_clientes_privados?: boolean
}

export interface PassaporteFornecedorRecord {
  id: string
  usuario: string
  empresa_nome: string
  empresa_cnpj: string
  token_consulta: string
  setor_atuacao?: string
  kg_co2e_por_kg_produzido?: number
  peso_produzido_kg_ano?: number
  emissoes_totais_tco2e?: number
  score_esg?: number
  matriz_gri_json?: MatrizGRIJson
  certidoes_json?: CertidaoItem[]
  curva_mac_json?: PontoCurvaMAC[]
  dossie_elegibilidade_json?: DossieElegibilidadeJson
  config_revelacao_json?: ConfigRevelacaoSeletiva
  hash_integridade?: string
  data_inventario_origem?: string
  ativo: boolean
  created: string
  updated: string
}

export interface PassaportePublicoResponse {
  empresa_nome: string
  empresa_cnpj: string
  setor_atuacao?: string
  data_inventario_origem?: string
  hash_integridade?: string
  token_consulta: string
  banner_confianca: string
  data_consulta_utc: string
  kg_co2e_por_kg_produzido?: number
  peso_produzido_kg_ano?: number
  emissoes_totais_tco2e?: number
  score_esg?: number
  matriz_gri?: MatrizGRIJson
  certidoes?: CertidaoItem[]
  curva_mac?: PontoCurvaMAC[]
  dossie_elegibilidade?: DossieElegibilidadeJson
}

export async function listarPassaportesBureau(): Promise<PassaporteFornecedorRecord[]> {
  return pb.collection('fornecedores_passaportes').getFullList<PassaporteFornecedorRecord>({
    sort: '-created',
  })
}

export async function consultarPassaportePorTokenPublico(
  token: string,
): Promise<PassaportePublicoResponse> {
  const url = `${pb.baseUrl}/backend/v1/bureau/passaporte/${token}`
  const res = await fetch(url)
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Passaporte não encontrado ou indisponível.')
  }
  return res.json()
}

export async function salvarPassaporteBureau(
  id: string | null,
  dados: Partial<PassaporteFornecedorRecord>,
): Promise<PassaporteFornecedorRecord> {
  if (id) {
    return pb.collection('fornecedores_passaportes').update<PassaporteFornecedorRecord>(id, dados)
  }
  return pb.collection('fornecedores_passaportes').create<PassaporteFornecedorRecord>(dados)
}
