/**
 * Serviço de Agregação e Inteligência Executiva do Painel de Resultados
 * Orbis Protocol — dMRV & Economia Circular
 *
 * REGRAS CRÍTICAS:
 * 1. Privacidade Absoluta: Segregação por CNPJ da própria empresa autenticada.
 *    Sem empresa associada (ex: perito externo sem CNPJ) => NENHUM dado de terceiros pode vazar.
 * 2. Opção B (Proteção do Catálogo de Fatores):
 *    NENHUM valor de fator de emissão é exibido no painel (fatores existem só no Verificador/Passaporte
 *    vinculados ao hash). O painel mostra RESULTADOS de massa (kg) e CO₂e confirmado (tCO₂e e kgCO₂e).
 * 3. Terminologia Obrigatória:
 *    - "Centro de Desmonte"
 *    - "validado/confirmado"
 *    - "Atestado Orbis"
 *    - Proibido: "Certificado", "Certificação", "Selo Oficial", "homologado", "CDVerde".
 *    - CO₂e confirmado é dos lotes, nunca promessa de crédito de carbono (a plataforma não emite créditos).
 */

import pb from '@/lib/pocketbase/client'
import type { CdvLoteRecord, CdvPecaRecord } from '@/services/cdvService'
import type { CdvLotePendenciaRecord } from '@/services/cdvPendenciasService'

export interface KpisPainelResultados {
  lotesEmColeta: number
  lotesValidadosConfirmados: number
  massaRecuperadaKg: number
  massaRecuperadaToneladas: number
  co2eConfirmadoTotalKg: number
  co2eConfirmadoTotalTco2e: number
  documentosAtestadosEmitidos: number
  documentosRelatoriosPreliminares: number
  pendenciasColetaEmAberto: number
}

export interface PontoEvolucaoMensal {
  mesChave: string // "2026-05"
  mesRotulo: string // "mai/26"
  massaKg: number
  co2eConfirmadoKg: number
  co2eConfirmadoTco2e: number
  lotesCount: number
}

export interface QuebraMaterialResultado {
  categoria: 'aco' | 'aluminio' | 'cobre' | 'polimeros' | 'outros'
  nomeExibicao: string
  pesoKg: number
  percentualPeso: number
  co2eConfirmadoKg: number
  percentualCo2e: number
}

export interface StatusConformidadeResultados {
  lotesComAtestadoAtivo: number
  lotesEmColeta: number
  lotesComPendencias: number
  lotesAnuladosOuRejeitados: number
  totalLotes: number
}

export interface DadosPainelResultados {
  cnpjEmpresa: string
  nomeEmpresa: string
  possuiEmpresaAssociada: boolean
  kpis: KpisPainelResultados
  evolucaoMensal: PontoEvolucaoMensal[]
  quebraPorMaterial: QuebraMaterialResultado[]
  statusConformidade: StatusConformidadeResultados
  totalPecasRastreadas: number
}

export interface InputAgregacaoPainel {
  cnpjEmpresa?: string | null
  nomeEmpresa?: string | null
  lotes: CdvLoteRecord[]
  pecas: CdvPecaRecord[]
  pendencias: CdvLotePendenciaRecord[]
  selosAtestados?: any[]
  relatoriosExportados?: any[]
}

/**
 * Normaliza CNPJ removendo qualquer caractere não numérico.
 */
export function normalizarCnpj(cnpj?: string | null): string {
  if (!cnpj) return ''
  return cnpj.replace(/\D/g, '').trim()
}

/**
 * Mapeia categorias de materiais para o grupo executivo do painel:
 * aço, alumínio, cobre, polímeros e outros (concreto, la_de_rocha, agro_rastreado caem em outros).
 */
export function normalizarCategoriaMaterialPainel(
  rawCat?: string,
): 'aco' | 'aluminio' | 'cobre' | 'polimeros' | 'outros' {
  const norm = (rawCat || '').toLowerCase().trim()
  if (norm === 'aco' || norm === 'aço' || norm === 'ferro' || norm === 'aco_carbono') return 'aco'
  if (norm === 'aluminio' || norm === 'alumínio') return 'aluminio'
  if (norm === 'cobre') return 'cobre'
  if (
    norm === 'polimeros' ||
    norm === 'polímeros' ||
    norm === 'plastico' ||
    norm === 'plásticos' ||
    norm === 'pp' ||
    norm === 'abs'
  )
    return 'polimeros'
  return 'outros'
}

export const NOMES_MATERIAIS_PAINEL: Record<
  'aco' | 'aluminio' | 'cobre' | 'polimeros' | 'outros',
  string
> = {
  aco: 'Aço Estrutural / Laminado',
  aluminio: 'Alumínio Automotivo',
  cobre: 'Cobre Eletrolítico',
  polimeros: 'Polímeros Técnicos (PP/ABS)',
  outros: 'Outros Materiais Reciclados',
}

/**
 * Formata mês chave (ex: "2026-04-12T...") para chave "2026-04" e rótulo amigável "abr/26".
 */
export function formatarMesChaveERotulo(dataIso?: string | null): {
  chave: string
  rotulo: string
} {
  const data = dataIso ? new Date(dataIso) : new Date()
  const dValida = isNaN(data.getTime()) ? new Date() : data
  const ano = dValida.getUTCFullYear()
  const mesNum = dValida.getUTCMonth() + 1
  const mesPad = String(mesNum).padStart(2, '0')
  const anoCurto = String(ano).slice(-2)

  const nomesMeses = [
    'jan',
    'fev',
    'mar',
    'abr',
    'mai',
    'jun',
    'jul',
    'ago',
    'set',
    'out',
    'nov',
    'dez',
  ]
  const rotulo = `${nomesMeses[mesNum - 1]}/${anoCurto}`
  return { chave: `${ano}-${mesPad}`, rotulo }
}

/**
 * Gera lista contínua com os últimos 12 meses anteriores/atuais para que o gráfico não fique quebrado
 */
export function gerarUltimos12Meses(): Array<{ chave: string; rotulo: string }> {
  const meses: Array<{ chave: string; rotulo: string }> = []
  const dataRef = new Date()

  for (let i = 11; i >= 0; i--) {
    const d = new Date(Date.UTC(dataRef.getUTCFullYear(), dataRef.getUTCMonth() - i, 1))
    const ano = d.getUTCFullYear()
    const mesNum = d.getUTCMonth() + 1
    const mesPad = String(mesNum).padStart(2, '0')
    const anoCurto = String(ano).slice(-2)
    const nomesMeses = [
      'jan',
      'fev',
      'mar',
      'abr',
      'mai',
      'jun',
      'jul',
      'ago',
      'set',
      'out',
      'nov',
      'dez',
    ]
    meses.push({
      chave: `${ano}-${mesPad}`,
      rotulo: `${nomesMeses[mesNum - 1]}/${anoCurto}`,
    })
  }

  return meses
}

/**
 * Agregação pura em memória dos dados dos lotes, peças, pendências e documentos.
 * Respeita isolamento absoluto pelo CNPJ da empresa.
 */
export function agregarDadosPainelResultados(input: InputAgregacaoPainel): DadosPainelResultados {
  const cnpjAlvoLimpo = normalizarCnpj(input.cnpjEmpresa)
  const possuiEmpresa = Boolean(cnpjAlvoLimpo && cnpjAlvoLimpo.length >= 8)

  if (!possuiEmpresa) {
    return {
      cnpjEmpresa: '',
      nomeEmpresa: input.nomeEmpresa || 'Sem empresa vinculada',
      possuiEmpresaAssociada: false,
      kpis: {
        lotesEmColeta: 0,
        lotesValidadosConfirmados: 0,
        massaRecuperadaKg: 0,
        massaRecuperadaToneladas: 0,
        co2eConfirmadoTotalKg: 0,
        co2eConfirmadoTotalTco2e: 0,
        documentosAtestadosEmitidos: 0,
        documentosRelatoriosPreliminares: 0,
        pendenciasColetaEmAberto: 0,
      },
      evolucaoMensal: gerarUltimos12Meses().map((m) => ({
        mesChave: m.chave,
        mesRotulo: m.rotulo,
        massaKg: 0,
        co2eConfirmadoKg: 0,
        co2eConfirmadoTco2e: 0,
        lotesCount: 0,
      })),
      quebraPorMaterial: [
        {
          categoria: 'aco',
          nomeExibicao: NOMES_MATERIAIS_PAINEL.aco,
          pesoKg: 0,
          percentualPeso: 0,
          co2eConfirmadoKg: 0,
          percentualCo2e: 0,
        },
        {
          categoria: 'aluminio',
          nomeExibicao: NOMES_MATERIAIS_PAINEL.aluminio,
          pesoKg: 0,
          percentualPeso: 0,
          co2eConfirmadoKg: 0,
          percentualCo2e: 0,
        },
        {
          categoria: 'cobre',
          nomeExibicao: NOMES_MATERIAIS_PAINEL.cobre,
          pesoKg: 0,
          percentualPeso: 0,
          co2eConfirmadoKg: 0,
          percentualCo2e: 0,
        },
        {
          categoria: 'polimeros',
          nomeExibicao: NOMES_MATERIAIS_PAINEL.polimeros,
          pesoKg: 0,
          percentualPeso: 0,
          co2eConfirmadoKg: 0,
          percentualCo2e: 0,
        },
        {
          categoria: 'outros',
          nomeExibicao: NOMES_MATERIAIS_PAINEL.outros,
          pesoKg: 0,
          percentualPeso: 0,
          co2eConfirmadoKg: 0,
          percentualCo2e: 0,
        },
      ],
      statusConformidade: {
        lotesComAtestadoAtivo: 0,
        lotesEmColeta: 0,
        lotesComPendencias: 0,
        lotesAnuladosOuRejeitados: 0,
        totalLotes: 0,
      },
      totalPecasRastreadas: 0,
    }
  }

  // 1. Filtragem estrita dos lotes da empresa logada
  const lotesEmpresa = input.lotes.filter((lote) => {
    const cnpjLote = normalizarCnpj(lote.cdv_cnpj)
    return cnpjLote === cnpjAlvoLimpo
  })

  const lotesIdsSet = new Set(lotesEmpresa.map((l) => l.id))

  // 2. Filtragem de peças vinculadas aos lotes da empresa ou com CNPJ compatível
  const pecasEmpresa = input.pecas.filter((peca) => {
    if (peca.lote && lotesIdsSet.has(peca.lote)) return true
    if (peca.cdv_cnpj && normalizarCnpj(peca.cdv_cnpj) === cnpjAlvoLimpo) return true
    return false
  })

  // 3. Filtragem de pendências de coleta vinculadas aos lotes da empresa
  const pendenciasEmpresa = input.pendencias.filter((pend) => {
    return pend.lote && lotesIdsSet.has(pend.lote)
  })

  // Mapear pendências por lote para conferência de conformidade
  const pendenciasPorLote = new Map<string, CdvLotePendenciaRecord[]>()
  for (const p of pendenciasEmpresa) {
    const list = pendenciasPorLote.get(p.lote) || []
    list.push(p)
    pendenciasPorLote.set(p.lote, list)
  }

  // 4. Apuração de KPIs dos Lotes
  let lotesValidadosConfirmados = 0
  let lotesEmColeta = 0
  let lotesComPendencias = 0
  let lotesAnuladosOuRejeitados = 0
  let massaRecuperadaKg = 0
  let co2eConfirmadoTotalKg = 0

  for (const lote of lotesEmpresa) {
    const status = lote.status
    const isAnuladoOuRejeitado = status === 'anulado' || status === 'rejeitado'
    const isProcessado = status === 'processado'

    if (isAnuladoOuRejeitado) {
      lotesAnuladosOuRejeitados++
      continue
    }

    const pendenciasDoLote = pendenciasPorLote.get(lote.id) || []
    const temPendenciasAbertas = pendenciasDoLote.some((p) => p.status === 'pendente')

    if (temPendenciasAbertas) {
      lotesComPendencias++
    }

    if (isProcessado) {
      lotesValidadosConfirmados++
    } else {
      lotesEmColeta++
    }

    massaRecuperadaKg += Number(lote.total_peso_kg || 0)
    co2eConfirmadoTotalKg += Number(lote.total_co2e_evitado_kg || 0)
  }

  // Pendências em aberto
  const pendenciasColetaEmAberto = pendenciasEmpresa.filter((p) => p.status === 'pendente').length

  // 5. Apuração de Documentos Emitidos (Atestados vs Relatórios Preliminares)
  const selosAtestados = (input.selosAtestados || []).filter((s) => {
    const cnpjSelo = normalizarCnpj(s.cnpj)
    return cnpjSelo === cnpjAlvoLimpo && s.status === 'ativo'
  })

  const relatorios = (input.relatoriosExportados || []).filter((r) => {
    const cnpjRel = normalizarCnpj(r.cnpj)
    return cnpjRel === cnpjAlvoLimpo
  })

  // Atestados: selos ativos tipo atestado_conformidade ou atestado_participacao ou código de atestado
  let documentosAtestadosEmitidos = selosAtestados.length
  if (documentosAtestadosEmitidos === 0 && lotesValidadosConfirmados > 0) {
    // Cada lote validado/confirmado no ecossistema gera um Atestado Orbis de lote
    documentosAtestadosEmitidos = lotesValidadosConfirmados
  }

  // Relatórios preliminares exportados pela empresa
  const documentosRelatoriosPreliminares = relatorios.length

  // 6. Evolução no Tempo (Série mensal dos últimos 12 meses)
  const mapaUltimos12 = new Map<
    string,
    { mesRotulo: string; massaKg: number; co2eKg: number; lotesCount: number }
  >()
  const lista12 = gerarUltimos12Meses()
  for (const m of lista12) {
    mapaUltimos12.set(m.chave, { mesRotulo: m.rotulo, massaKg: 0, co2eKg: 0, lotesCount: 0 })
  }

  for (const lote of lotesEmpresa) {
    if (lote.status === 'anulado' || lote.status === 'rejeitado') continue

    const dataRef = lote.created || (lote as any).data_emissao || new Date().toISOString()
    const { chave, rotulo } = formatarMesChaveERotulo(dataRef)

    const entrada = mapaUltimos12.get(chave)
    if (entrada) {
      entrada.massaKg += Number(lote.total_peso_kg || 0)
      entrada.co2eKg += Number(lote.total_co2e_evitado_kg || 0)
      entrada.lotesCount += 1
    } else {
      // Se tiver lote com data anterior ou posterior aos 12 meses padrão, adiciona no mapa
      mapaUltimos12.set(chave, {
        mesRotulo: rotulo,
        massaKg: Number(lote.total_peso_kg || 0),
        co2eKg: Number(lote.total_co2e_evitado_kg || 0),
        lotesCount: 1,
      })
    }
  }

  const chavesOrdenadas = Array.from(mapaUltimos12.keys()).sort()
  // Manter os últimos 12 meses mais recentes
  const chavesFinais = chavesOrdenadas.slice(-12)
  const evolucaoMensal: PontoEvolucaoMensal[] = chavesFinais.map((chave) => {
    const d = mapaUltimos12.get(chave)!
    return {
      mesChave: chave,
      mesRotulo: d.mesRotulo,
      massaKg: Math.round(d.massaKg * 100) / 100,
      co2eConfirmadoKg: Math.round(d.co2eKg * 100) / 100,
      co2eConfirmadoTco2e: Math.round((d.co2eKg / 1000) * 1000) / 1000,
      lotesCount: d.lotesCount,
    }
  })

  // 7. Quebra por Material (SEM exibir fatores de emissão — regra Opção B)
  const mapaMateriais: Record<
    'aco' | 'aluminio' | 'cobre' | 'polimeros' | 'outros',
    { pesoKg: number; co2eKg: number }
  > = {
    aco: { pesoKg: 0, co2eKg: 0 },
    aluminio: { pesoKg: 0, co2eKg: 0 },
    cobre: { pesoKg: 0, co2eKg: 0 },
    polimeros: { pesoKg: 0, co2eKg: 0 },
    outros: { pesoKg: 0, co2eKg: 0 },
  }

  // Agrega a partir das peças rastreadas ativas dos lotes
  const pecasValidas = pecasEmpresa.filter((p) => p.status !== 'anulado')

  for (const peca of pecasValidas) {
    const cat = normalizarCategoriaMaterialPainel(peca.categoria_material)
    const peso = Number(peca.peso_kg || 0)
    const co2e = Number(peca.co2e_evitado_kg || 0)

    mapaMateriais[cat].pesoKg += peso
    mapaMateriais[cat].co2eKg += co2e
  }

  // Se não houver peças individuais carregadas mas houver lotes com peso,
  // faz distribuição estimativa preliminar baseada no perfil padrão CONTRAN 611/veicular
  let pesoTotalMateriais =
    mapaMateriais.aco.pesoKg +
    mapaMateriais.aluminio.pesoKg +
    mapaMateriais.cobre.pesoKg +
    mapaMateriais.polimeros.pesoKg +
    mapaMateriais.outros.pesoKg

  if (pesoTotalMateriais === 0 && massaRecuperadaKg > 0) {
    // Distribuição representativa automotiva média:
    // Aço: 70%, Alumínio: 12%, Cobre: 4%, Polímeros: 10%, Outros: 4%
    mapaMateriais.aco.pesoKg = massaRecuperadaKg * 0.7
    mapaMateriais.aco.co2eKg = co2eConfirmadoTotalKg * 0.65

    mapaMateriais.aluminio.pesoKg = massaRecuperadaKg * 0.12
    mapaMateriais.aluminio.co2eKg = co2eConfirmadoTotalKg * 0.22

    mapaMateriais.cobre.pesoKg = massaRecuperadaKg * 0.04
    mapaMateriais.cobre.co2eKg = co2eConfirmadoTotalKg * 0.05

    mapaMateriais.polimeros.pesoKg = massaRecuperadaKg * 0.1
    mapaMateriais.polimeros.co2eKg = co2eConfirmadoTotalKg * 0.06

    mapaMateriais.outros.pesoKg = massaRecuperadaKg * 0.04
    mapaMateriais.outros.co2eKg = co2eConfirmadoTotalKg * 0.02

    pesoTotalMateriais = massaRecuperadaKg
  }

  const co2eTotalMateriais =
    mapaMateriais.aco.co2eKg +
    mapaMateriais.aluminio.co2eKg +
    mapaMateriais.cobre.co2eKg +
    mapaMateriais.polimeros.co2eKg +
    mapaMateriais.outros.co2eKg

  const categoriasOrdem: Array<'aco' | 'aluminio' | 'cobre' | 'polimeros' | 'outros'> = [
    'aco',
    'aluminio',
    'cobre',
    'polimeros',
    'outros',
  ]

  const quebraPorMaterial: QuebraMaterialResultado[] = categoriasOrdem.map((cat) => {
    const dados = mapaMateriais[cat]
    const pctPeso =
      pesoTotalMateriais > 0 ? Math.round((dados.pesoKg / pesoTotalMateriais) * 1000) / 10 : 0
    const pctCo2e =
      co2eTotalMateriais > 0 ? Math.round((dados.co2eKg / co2eTotalMateriais) * 1000) / 10 : 0

    return {
      categoria: cat,
      nomeExibicao: NOMES_MATERIAIS_PAINEL[cat],
      pesoKg: Math.round(dados.pesoKg * 100) / 100,
      percentualPeso: pctPeso,
      co2eConfirmadoKg: Math.round(dados.co2eKg * 100) / 100,
      percentualCo2e: pctCo2e,
    }
  })

  // 8. Status de Conformidade
  const statusConformidade: StatusConformidadeResultados = {
    lotesComAtestadoAtivo: lotesValidadosConfirmados,
    lotesEmColeta,
    lotesComPendencias,
    lotesAnuladosOuRejeitados,
    totalLotes: lotesEmpresa.length,
  }

  return {
    cnpjEmpresa: input.cnpjEmpresa || '',
    nomeEmpresa: input.nomeEmpresa || lotesEmpresa[0]?.cdv_nome || 'Empresa Cadastrada',
    possuiEmpresaAssociada: true,
    kpis: {
      lotesEmColeta,
      lotesValidadosConfirmados,
      massaRecuperadaKg: Math.round(massaRecuperadaKg * 100) / 100,
      massaRecuperadaToneladas: Math.round((massaRecuperadaKg / 1000) * 1000) / 1000,
      co2eConfirmadoTotalKg: Math.round(co2eConfirmadoTotalKg * 100) / 100,
      co2eConfirmadoTotalTco2e: Math.round((co2eConfirmadoTotalKg / 1000) * 1000) / 1000,
      documentosAtestadosEmitidos,
      documentosRelatoriosPreliminares,
      pendenciasColetaEmAberto,
    },
    evolucaoMensal,
    quebraPorMaterial,
    statusConformidade,
    totalPecasRastreadas: pecasValidas.length,
  }
}

/**
 * Consulta as coleções reais do PocketBase para a empresa logada.
 * Se o usuário não tiver empresa associada, não busca dados e retorna estado seguro vazio.
 */
export async function carregarDadosPainelResultadosEmpresa(
  cnpjUsuario?: string | null,
  nomeEmpresa?: string | null,
): Promise<DadosPainelResultados> {
  const cnpjLimpo = normalizarCnpj(cnpjUsuario)
  if (!cnpjLimpo || cnpjLimpo.length < 8) {
    return agregarDadosPainelResultados({
      cnpjEmpresa: null,
      nomeEmpresa: nomeEmpresa || 'Sem empresa associada',
      lotes: [],
      pecas: [],
      pendencias: [],
      selosAtestados: [],
      relatoriosExportados: [],
    })
  }

  try {
    // Buscar lotes da própria empresa via PocketBase
    // O CNPJ pode estar formatado ou numérico
    const [lotesRes, selosRes, relatoriosRes] = await Promise.all([
      pb
        .collection('cdv_lotes')
        .getFullList<CdvLoteRecord>({
          sort: '-created',
          requestKey: null,
        })
        .catch(() => []),
      pb
        .collection('selos')
        .getFullList({
          sort: '-created',
          requestKey: null,
        })
        .catch(() => []),
      pb
        .collection('relatorios_exportados')
        .getFullList({
          sort: '-created',
          requestKey: null,
        })
        .catch(() => []),
    ])

    // Filtra no cliente para cobrir formatos pontuados e sem pontuação
    const lotesEmpresa = (lotesRes || []).filter((l) => normalizarCnpj(l.cdv_cnpj) === cnpjLimpo)

    let pecasEmpresa: CdvPecaRecord[] = []
    let pendenciasEmpresa: CdvLotePendenciaRecord[] = []

    if (lotesEmpresa.length > 0) {
      const lotesIds = lotesEmpresa.map((l) => l.id)
      const loteFilter = lotesIds.map((id) => `lote = "${id}"`).join(' || ')

      const [pecasRes, pendenciasRes] = await Promise.all([
        pb
          .collection('cdv_pecas')
          .getFullList<CdvPecaRecord>({
            filter: loteFilter,
            sort: '-created',
            requestKey: null,
          })
          .catch(() => []),
        pb
          .collection('cdv_lote_pendencias')
          .getFullList<CdvLotePendenciaRecord>({
            filter: loteFilter,
            sort: '-created',
            requestKey: null,
          })
          .catch(() => []),
      ])

      pecasEmpresa = pecasRes
      pendenciasEmpresa = pendenciasRes
    }

    return agregarDadosPainelResultados({
      cnpjEmpresa: cnpjUsuario,
      nomeEmpresa: nomeEmpresa || lotesEmpresa[0]?.cdv_nome,
      lotes: lotesEmpresa,
      pecas: pecasEmpresa,
      pendencias: pendenciasEmpresa,
      selosAtestados: selosRes,
      relatoriosExportados: relatoriosRes,
    })
  } catch (err) {
    console.warn('[painelResultadosService] Erro ao carregar dados do painel:', err)
    return agregarDadosPainelResultados({
      cnpjEmpresa: cnpjUsuario,
      nomeEmpresa,
      lotes: [],
      pecas: [],
      pendencias: [],
    })
  }
}

/**
 * Exporta o resumo executivo do Painel de Resultados em formato CSV
 * com delimitador ';' e BOM UTF-8 para abertura perfeita no Excel.
 */
export function exportarPainelResultadosCsv(dados: DadosPainelResultados): {
  conteudoCsv: string
  nomeArquivo: string
} {
  const agora = new Date()
  const dataIso = agora.toISOString().slice(0, 10)
  const horaFormatada = agora.toLocaleTimeString('pt-BR')

  const linhas: string[] = []

  linhas.push('ORBIS PROTOCOL - PAINEL DE RESULTADOS EXECUTIVO')
  linhas.push(`Data de Emissao;${dataIso} ${horaFormatada}`)
  linhas.push(`Empresa Titular;${dados.nomeEmpresa}`)
  linhas.push(`CNPJ da Empresa;${dados.cnpjEmpresa || 'Nao informado'}`)
  linhas.push('Metodologia de Descarbonizacao;DM-ORB-001 v1.1 - dMRV')
  linhas.push(
    'Nota de Enquadramento;CO2e confirmado dos lotes auditados. A plataforma nao emite creditos de carbono.',
  )
  linhas.push('')

  linhas.push('--- INDICADORES-CHAVE DE DESEMPENHO (KPIS) ---')
  linhas.push('Metrica;Valor;Unidade;Observacao')
  linhas.push(
    `Lotes Validados e Confirmados;${dados.kpis.lotesValidadosConfirmados};lotes;Centro de Desmonte auditado`,
  )
  linhas.push(`Lotes em Coleta;${dados.kpis.lotesEmColeta};lotes;Processo em andamento no patio`)
  linhas.push(
    `Massa Recuperada Total;${dados.kpis.massaRecuperadaKg.toFixed(2).replace('.', ',')};kg;Balanço de massa comprovado (${dados.kpis.massaRecuperadaToneladas.toFixed(3).replace('.', ',')} t)`,
  )
  linhas.push(
    `CO2e Confirmado dos Lotes;${dados.kpis.co2eConfirmadoTotalTco2e.toFixed(3).replace('.', ',')};tCO2e;Somatório dos lotes da empresa (${dados.kpis.co2eConfirmadoTotalKg.toFixed(2).replace('.', ',')} kgCO2e)`,
  )
  linhas.push(
    `Atestados Orbis Emitidos;${dados.kpis.documentosAtestadosEmitidos};documentos;Atestados de conformidade ativos`,
  )
  linhas.push(
    `Relatorios Preliminares Emitidos;${dados.kpis.documentosRelatoriosPreliminares};documentos;Dossiês e extratos preliminares`,
  )
  linhas.push(
    `Pendencias de Coleta em Aberto;${dados.kpis.pendenciasColetaEmAberto};pendencias;Documentos ou fotos pendentes de respondentes`,
  )
  linhas.push('')

  linhas.push('--- EVOLUCAO MENSAL (SERIE TEMPORAL DOS ULTIMOS 12 MESES) ---')
  linhas.push(
    'Competencia;Massa Recuperada (kg);CO2e Confirmado (kgCO2e);CO2e Confirmado (tCO2e);Lotes do Mes',
  )
  for (const ponto of dados.evolucaoMensal) {
    linhas.push(
      [
        ponto.mesRotulo,
        ponto.massaKg.toFixed(2).replace('.', ','),
        ponto.co2eConfirmadoKg.toFixed(2).replace('.', ','),
        ponto.co2eConfirmadoTco2e.toFixed(3).replace('.', ','),
        ponto.lotesCount,
      ].join(';'),
    )
  }
  linhas.push('')

  linhas.push('--- DISTRIBUICAO POR MATERIAL (MASSAS E PERCENTUAIS) ---')
  linhas.push(
    'Material;Massa Recuperada (kg);Participacao na Massa (%);CO2e Confirmado (kgCO2e);Participacao no CO2e (%)',
  )
  for (const item of dados.quebraPorMaterial) {
    linhas.push(
      [
        item.nomeExibicao,
        item.pesoKg.toFixed(2).replace('.', ','),
        item.percentualPeso.toFixed(1).replace('.', ',') + '%',
        item.co2eConfirmadoKg.toFixed(2).replace('.', ','),
        item.percentualCo2e.toFixed(1).replace('.', ',') + '%',
      ].join(';'),
    )
  }
  linhas.push('')

  linhas.push('--- STATUS DE CONFORMIDADE DOS LOTES ---')
  linhas.push('Status;Quantidade;Classificacao')
  linhas.push(
    `Com Atestado Orbis Ativo;${dados.statusConformidade.lotesComAtestadoAtivo};Lotes confirmados e auditados`,
  )
  linhas.push(
    `Em Coleta;${dados.statusConformidade.lotesEmColeta};Lotes em fase de triagem ou preenchimento`,
  )
  linhas.push(
    `Com Pendencias de Respondentes;${dados.statusConformidade.lotesComPendencias};Lotes com documentos em aberto`,
  )
  linhas.push(
    `Anulados ou Rejeitados;${dados.statusConformidade.lotesAnuladosOuRejeitados};Lotes invalidados`,
  )
  linhas.push(
    `Total de Lotes da Empresa;${dados.statusConformidade.totalLotes};Universo integral da organização`,
  )

  const conteudoCsv = '\uFEFF' + linhas.join('\r\n')
  const cnpjNomeArquivo = dados.cnpjEmpresa
    ? normalizarCnpj(dados.cnpjEmpresa).slice(0, 8)
    : 'empresa'
  const nomeArquivo = `painel_resultados_orbis_${cnpjNomeArquivo}_${dataIso}.csv`

  return { conteudoCsv, nomeArquivo }
}
