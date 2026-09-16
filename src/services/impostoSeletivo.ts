/**
 * Classificação de Bens e Serviços sujeitos ao Imposto Seletivo (IS)
 * Base legal: Emenda Constitucional nº 132/2023 e Lei Complementar nº 214/2025 (Regulamentação do IBS, CBS e IS)
 *
 * O Imposto Seletivo ("Imposto do Pecado") incide sobre produção, extração, comercialização
 * ou importação de bens e serviços prejudiciais à saúde ou ao meio ambiente.
 *
 * Categorias principais definidas pela LC 214/2025:
 * 1. Veículos automotores terrestres, aquáticos e aéreos (embarcações e aeronaves)
 * 2. Cigarros, fumo e derivados de tabaco
 * 3. Bebidas alcoólicas (cervejas, destilados, vinhos, etc.)
 * 4. Bebidas açucaradas (refrigerantes, energéticos, néctares com adição de açúcar)
 * 5. Carvão mineral e combustíveis fósseis poluentes
 * 6. Bens minerais extraídos ou concentrados (minério de ferro, petróleo bruto, gás natural)
 * 7. Apostas, concursos de prognósticos e fantasy games / premiações
 *
 * NOTA: Peças recicladas e veículos em fim de vida (CDV / economia circular) e
 * fontes renováveis contam com desoneração/não incidência expressa.
 */

export interface ClassificacaoISResultado {
  sujeito: boolean
  categoria?: string
  descricaoCategoria?: string
  aliquotaReferencial?: string
  fonte: string
  disclaimer: string
}

export interface RegraNCMImpostoSeletivo {
  id: string
  categoria: string
  descricao: string
  /** Prefixos de NCM (capítulos com 2 dígitos, posições com 4 dígitos ou subposições com 6 a 8 dígitos) */
  ncmPrefixos: string[]
  /** Exceções que NÃO incidem mesmo tendo o prefixo (ex: peças recicladas, elétricos puros com alíquota zero) */
  excecoesPrefixos?: string[]
  aliquotaReferencial: string
  artigoLC214: string
}

export const REGRAS_IMPOSTO_SELETIVO: RegraNCMImpostoSeletivo[] = [
  {
    id: 'fumo_tabaco',
    categoria: 'Cigarro e Derivados do Tabaco',
    descricao:
      'Cigarros, charutos, cigarrilhas, fumo picado, tabaco para narguilé e vapes/cigarros eletrônicos.',
    ncmPrefixos: ['2401', '2402', '2403', '2404'],
    aliquotaReferencial:
      'Alíquota ad valorem + ad rem específica elevada (estimada em até 50%-100%)',
    artigoLC214: 'LC 214/2025, Anexo referente ao IS - Seção Fumo e Derivados',
  },
  {
    id: 'bebidas_alcoolicas',
    categoria: 'Bebidas Alcoólicas',
    descricao:
      'Cervejas, chopes, vinhos, espumantes, vermutes, aguardentes, uísques, vodcas e destilados.',
    ncmPrefixos: ['2203', '2204', '2205', '2206', '2208'],
    aliquotaReferencial: 'Alíquota híbrida escalonada pelo teor alcoólico (estimada 10% a 40%)',
    artigoLC214: 'LC 214/2025, Anexo referente ao IS - Seção Bebidas Alcoólicas',
  },
  {
    id: 'bebidas_acucaradas',
    categoria: 'Bebidas Açucaradas',
    descricao:
      'Refrigerantes, bebidas aromatizadas artificiais, néctares com adição de açúcar e energéticos.',
    ncmPrefixos: ['22021000', '22029900', '22029000'],
    aliquotaReferencial:
      'Alíquota progressiva conforme teor de açúcar adicionado (estimada 5% a 15%)',
    artigoLC214: 'LC 214/2025, Anexo referente ao IS - Seção Bebidas Açucaradas',
  },
  {
    id: 'veiculos_automotores',
    categoria: 'Veículos Poluentes (Automóveis, Embarcações e Aeronaves)',
    descricao:
      'Automóveis de passeio a combustão, utilitários leves, motocicletas, embarcações e aeronaves executivas/recreativas.',
    ncmPrefixos: [
      '8703', // Automóveis de passageiros a combustão
      '8711', // Motocicletas a combustão
      '8903', // Embarcações de esporte e recreio, iates, barcos a motor
      '8802', // Aeronaves executivas e de uso não-regular
      '8702', // Veículos de transporte coletivo a combustão fóssil (faixa específica)
    ],
    // Não incide em autopeças puras (8708) fora da montagem nem em peças de desmontagem (CDV)
    aliquotaReferencial:
      'Critério de eficiência ambiental e emissões de CO₂ / eficiência energética (estimada 5% a 25%)',
    artigoLC214: 'LC 214/2025, Anexo referente ao IS - Seção Mobilidade Fóssil e Aeronaves',
  },
  {
    id: 'carvao_mineral',
    categoria: 'Carvão Mineral e Combustíveis Fósseis Poluentes',
    descricao:
      'Carvão mineral, hulha, linhita e turfa destinados à queima energética e emissão de particulados.',
    ncmPrefixos: ['2701', '2702', '2703', '2704'],
    aliquotaReferencial:
      'Alíquota ambiental extrafiscal sobre o impacto de carbono (estimada 1% a 5%)',
    artigoLC214: 'LC 214/2025, Anexo referente ao IS - Seção Carvão Mineral',
  },
  {
    id: 'minerais_extraidos',
    categoria: 'Bens Minerais Extraídos / Concentrados',
    descricao:
      'Extração de minério de ferro, petróleo bruto e gás natural fóssil na primeira comercialização ou exportação.',
    ncmPrefixos: [
      '2601', // Minérios de ferro e seus concentrados
      '2709', // Óleos brutos de petróleo ou de minerais betuminosos
      '271111', // Gás natural liquefeito
      '271121', // Gás natural no estado gasoso
    ],
    aliquotaReferencial: 'Teto constitucional de 0,25% a 1% na extração primária',
    artigoLC214: 'LC 214/2025, Anexo referente ao IS - Seção Bens Minerais e Petróleo Bruto',
  },
]

const DISCLAIMER_OFICIAL =
  'LC 214/2025, Anexo referente ao IS (estimativa preliminar e educativa sujeita às regulamentações definitivas de alíquotas pelo Comitê Gestor e Receita Federal).'

/**
 * Normaliza o código NCM removendo pontos, traços, espaços e caracteres especiais.
 */
export function normalizarNCM(ncmRaw: string | null | undefined): string {
  if (!ncmRaw) return ''
  return ncmRaw.replace(/[^\d]/g, '').trim()
}

/**
 * Classifica um NCM individual e verifica se está no campo de incidência do Imposto Seletivo.
 */
export function classificarNCM(ncmRaw: string): ClassificacaoISResultado {
  const ncm = normalizarNCM(ncmRaw)

  if (!ncm || ncm.length < 2) {
    return {
      sujeito: false,
      fonte: 'LC 214/2025, Anexo referente ao IS',
      disclaimer: DISCLAIMER_OFICIAL,
    }
  }

  for (const regra of REGRAS_IMPOSTO_SELETIVO) {
    // Verifica se coincide com alguma exceção
    if (regra.excecoesPrefixos && regra.excecoesPrefixos.some((exc) => ncm.startsWith(exc))) {
      continue
    }

    // Verifica se inicia com algum dos prefixos da categoria
    const match = regra.ncmPrefixos.some((pref) => ncm.startsWith(pref))
    if (match) {
      return {
        sujeito: true,
        categoria: regra.categoria,
        descricaoCategoria: regra.descricao,
        aliquotaReferencial: regra.aliquotaReferencial,
        fonte: regra.artigoLC214,
        disclaimer: DISCLAIMER_OFICIAL,
      }
    }
  }

  return {
    sujeito: false,
    fonte: 'LC 214/2025, Anexo referente ao IS',
    disclaimer: DISCLAIMER_OFICIAL,
  }
}

/**
 * Analisa uma lista de itens fiscais e resume os bens sujeitos ao Imposto Seletivo
 */
export interface ResumoItensIS {
  totalItens: number
  totalItensSujeitosIS: number
  categoriasEncontradas: { categoria: string; count: number; aliquota: string }[]
  ncmsSujeitosUnicos: string[]
  temItemSujeito: boolean
}

export function analisarItensImpostoSeletivo(
  itens: Array<{ ncm?: string; descricao?: string }>,
): ResumoItensIS {
  let countSujeitos = 0
  const categoriasMap = new Map<string, { count: number; aliquota: string }>()
  const ncmsSet = new Set<string>()

  itens.forEach((item) => {
    if (!item.ncm) return
    const res = classificarNCM(item.ncm)
    if (res.sujeito && res.categoria) {
      countSujeitos++
      ncmsSet.add(normalizarNCM(item.ncm))
      const current = categoriasMap.get(res.categoria) || {
        count: 0,
        aliquota: res.aliquotaReferencial || '',
      }
      current.count++
      categoriasMap.set(res.categoria, current)
    }
  })

  const categoriasEncontradas = Array.from(categoriasMap.entries()).map(([cat, data]) => ({
    categoria: cat,
    count: data.count,
    aliquota: data.aliquota,
  }))

  return {
    totalItens: itens.length,
    totalItensSujeitosIS: countSujeitos,
    categoriasEncontradas,
    ncmsSujeitosUnicos: Array.from(ncmsSet),
    temItemSujeito: countSujeitos > 0,
  }
}
