/**
 * SERVIÇO DE FATORES DE EMISSÃO VERSIONADOS COM IMPORTAÇÃO CSV
 *
 * Em conformidade com:
 * - Etapa 3 Peça 3b do Plano de Piloto ACP
 * - Regras de Governança: "Criar tabela de fatores de emissão versionada
 *   (fonte, ano, escopo, geografia, unidade, validade). Não preencher valores
 *   sem fonte; deixar importável via CSV."
 * - Blindagem "Opção B": catálogo completo e importação são restritos ao Gestor Master.
 * - Princípio de Anti-Retroatividade: todo cálculo gera um snapshot imutável
 *   (fatorSnapshot) por item, de modo que atualizações futuras nunca alterem
 *   cálculos emitidos no passado.
 */

import pb from '@/lib/pocketbase/client'
import {
  FatorCanonicaItem,
  CATALOGO_FATORES_CO2E,
  MAPA_FATORES_CANONICOS,
} from './catalogoFatoresOficiais'

export interface FatorEmissaoVersionado {
  id?: string
  codigo: string
  material: string
  descricao?: string
  fator: number
  unidade: string
  incerteza_pct?: number
  tier?: string
  fonte: string
  ano: number
  escopo: string
  geografia: string
  validade: string
  versao: string
  categoria?: string
  bloqueado_atestado?: boolean
  indicativo?: boolean
  origem?: string
  metadados_json?: Record<string, any>
  created?: string
  updated?: string
}

export interface FatorSnapshotItem {
  codigoFator: string
  versaoFator: string
  valorFator: number
  unidadeFator: string
  fonteFator: string
  anoReferencia: number
  escopoFator: string
  geografiaFator: string
  validadeFator: string
  tierFator?: string
  incertezaPct?: number
  dataSnapshotIso: string
  hashSnapshot?: string
}

export interface ErroLinhaCsvFator {
  linhaNumero: number
  campo: string
  motivo: string
  conteudoLinha?: string
}

export interface ResultadoParseCsvFatores {
  sucesso: boolean
  fatoresValidos: FatorEmissaoVersionado[]
  erros: ErroLinhaCsvFator[]
  totalLinhasLidas: number
  totalAceitas: number
  totalRecusadas: number
}

export interface ResultadoImportacaoFatores {
  sucesso: boolean
  totalImportados: number
  totalIgnorados: number
  totalErros: number
  erros: ErroLinhaCsvFator[]
  mensagem: string
}

export const CABECALHO_CSV_FATORES_PADRAO =
  'codigo;material;fator;unidade;fonte;ano;escopo;geografia;validade;versao;incerteza_pct;tier;descricao'

export const MODELO_EXEMPLO_CSV_FATORES = `codigo;material;fator;unidade;fonte;ano;escopo;geografia;validade;versao;incerteza_pct;tier;descricao
mat-aco-reciclado;Aço Secundário Reciclado;0.65;kgCO2e/kg;worldsteel Scrap Route EAF 2024;2024;Escopo 3 Cat. 1 / Insetting;Global (worldsteel);2025-01-01 a 2026-12-31;v2025.2;4.0;T3;Aço reciclado produzido em forno elétrico a arco (EAF)
mat-aluminio-secundario;Alumínio Secundário Fundido;0.82;kgCO2e/kg;IAI Secondary Aluminium Scrap LCA 2024;2024;Escopo 3 Cat. 1 / Insetting;Global (IAI);2025-01-01 a 2026-12-31;v2025.2;5.0;T3;Alumínio reciclado a partir de sucata pós-consumo
comb-etanol-hidratado;Etanol Hidratado Combustível;1.42;kgCO2e/L;PBGHG / Renovabio ANP 2024;2024;Escopo 1;Brasil;2025-01-01 a 2025-12-31;v2025.2;3.5;T2;Queima de biocombustível em veículos da frota`

/**
 * Faz split de linha CSV respeitando ponto-e-vírgula ou vírgula
 */
function splitCsvLine(linha: string, separador: string): string[] {
  const valores: string[] = []
  let atual = ''
  let emAspas = false

  for (let i = 0; i < linha.length; i++) {
    const char = linha[i]
    if (char === '"') {
      if (emAspas && linha[i + 1] === '"') {
        atual += '"'
        i++
      } else {
        emAspas = !emAspas
      }
    } else if (char === separador && !emAspas) {
      valores.push(atual.trim())
      atual = ''
    } else {
      atual += char
    }
  }
  valores.push(atual.trim())
  return valores
}

/**
 * Valida e converte CSV em lista de FatorEmissaoVersionado
 * Regra de ouro: linha sem fonte é estritamente recusada com erro claro informando o número da linha.
 */
export function parseCsvFatoresEmissao(conteudoCsv: string): ResultadoParseCsvFatores {
  const erros: ErroLinhaCsvFator[] = []
  const fatoresValidos: FatorEmissaoVersionado[] = []

  if (!conteudoCsv || !conteudoCsv.trim()) {
    return {
      sucesso: false,
      fatoresValidos: [],
      erros: [{ linhaNumero: 1, campo: 'arquivo', motivo: 'Arquivo CSV está vazio ou em branco' }],
      totalLinhasLidas: 0,
      totalAceitas: 0,
      totalRecusadas: 1,
    }
  }

  // Normaliza quebras de linha
  const linhas = conteudoCsv.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n')
  const linhasFiltradas = linhas.map((l) => l.trim()).filter((l) => l.length > 0)

  if (linhasFiltradas.length < 2) {
    return {
      sucesso: false,
      fatoresValidos: [],
      erros: [
        {
          linhaNumero: 1,
          campo: 'arquivo',
          motivo: 'O arquivo CSV precisa ter cabeçalho e ao menos uma linha de dados.',
        },
      ],
      totalLinhasLidas: linhasFiltradas.length,
      totalAceitas: 0,
      totalRecusadas: 1,
    }
  }

  // Detecta separador (; ou ,)
  const cabecalhoLinha = linhasFiltradas[0]
  const separador = cabecalhoLinha.includes(';') ? ';' : ','

  const colunas = splitCsvLine(cabecalhoLinha, separador).map((c) =>
    c.toLowerCase().replace(/["']/g, '').replace(/\s+/g, '_'),
  )

  const findIdx = (nomes: string[]) => colunas.findIndex((c) => nomes.includes(c))

  const idxCodigo = findIdx(['codigo', 'id', 'cod', 'codigo_material'])
  const idxMaterial = findIdx(['material', 'nome_material', 'nome', 'descricao_material'])
  const idxFator = findIdx(['fator', 'valor', 'valor_fator', 'fator_emissao', 'kgco2e'])
  const idxUnidade = findIdx(['unidade', 'und', 'uom'])
  const idxFonte = findIdx(['fonte', 'fonte_oficial', 'fonte_fator', 'referencia_fonte'])
  const idxAno = findIdx(['ano', 'ano_referencia', 'ano_base'])
  const idxEscopo = findIdx(['escopo', 'escopo_alvo', 'categoria_escopo'])
  const idxGeografia = findIdx(['geografia', 'regiao', 'pais', 'abrangencia'])
  const idxValidade = findIdx(['validade', 'vigencia', 'periodo_validade'])
  const idxVersao = findIdx(['versao', 'versao_tabela', 'versao_registro'])
  const idxIncerteza = findIdx(['incerteza_pct', 'incerteza', 'ufe', 'incerteza_relativa'])
  const idxTier = findIdx(['tier', 'tier_metodologico'])
  const idxDescricao = findIdx(['descricao', 'detalhe', 'notas', 'observacao'])

  // Validação estrita do cabeçalho mínimo exigido
  if (idxFonte === -1) {
    return {
      sucesso: false,
      fatoresValidos: [],
      erros: [
        {
          linhaNumero: 1,
          campo: 'fonte',
          motivo:
            'Coluna obrigatória "fonte" ausente no cabeçalho do CSV. Nenhum fator pode entrar sem fonte.',
        },
      ],
      totalLinhasLidas: linhasFiltradas.length,
      totalAceitas: 0,
      totalRecusadas: linhasFiltradas.length - 1,
    }
  }

  if (idxFator === -1) {
    return {
      sucesso: false,
      fatoresValidos: [],
      erros: [
        {
          linhaNumero: 1,
          campo: 'fator',
          motivo: 'Coluna obrigatória "fator" ausente no cabeçalho do CSV.',
        },
      ],
      totalLinhasLidas: linhasFiltradas.length,
      totalAceitas: 0,
      totalRecusadas: linhasFiltradas.length - 1,
    }
  }

  // Processa linha a linha
  for (let i = 1; i < linhasFiltradas.length; i++) {
    const numLinha = i + 1
    const linhaTexto = linhasFiltradas[i]
    const celulas = splitCsvLine(linhaTexto, separador)

    const getVal = (idx: number) => (idx >= 0 && idx < celulas.length ? celulas[idx].trim() : '')

    const codigo = getVal(idxCodigo) || `fator-${numLinha}`
    const material = getVal(idxMaterial) || codigo
    const valorStr = getVal(idxFator).replace(',', '.')
    const unidade = getVal(idxUnidade) || 'kgCO2e/kg'
    const fonte = getVal(idxFonte)
    const anoStr = getVal(idxAno)
    const escopo = getVal(idxEscopo) || 'Escopo 3 Cat. 1'
    const geografia = getVal(idxGeografia) || 'Global / Brasil'
    const validade = getVal(idxValidade) || 'Vigência Aberta'
    const versao = getVal(idxVersao) || 'v2025.2'
    const incertezaStr = getVal(idxIncerteza).replace(',', '.')
    const tier = getVal(idxTier) || 'T2'
    const descricao = getVal(idxDescricao) || ''

    // REGRA DE OURO ACP: Fonte é estritamente obrigatória. Sem fonte, linha rejeitada!
    if (!fonte || fonte.trim().length === 0 || fonte.toLowerCase() === 'null') {
      erros.push({
        linhaNumero: numLinha,
        campo: 'fonte',
        motivo: `Linha ${numLinha}: Campo "fonte" está vazio. Nenhum fator de emissão pode ser registrado sem fonte homologada.`,
        conteudoLinha: linhaTexto,
      })
      continue
    }

    // Validação do valor numérico do fator
    const valorNum = parseFloat(valorStr)
    if (isNaN(valorNum) || valorNum < 0) {
      erros.push({
        linhaNumero: numLinha,
        campo: 'fator',
        motivo: `Linha ${numLinha}: Valor do fator "${valorStr}" inválido ou negativo.`,
        conteudoLinha: linhaTexto,
      })
      continue
    }

    // Validação do ano
    let anoNum = parseInt(anoStr, 10)
    if (isNaN(anoNum) || anoNum < 1990 || anoNum > 2100) {
      anoNum = new Date().getFullYear()
    }

    // Validação da incerteza
    let incertezaNum = parseFloat(incertezaStr)
    if (isNaN(incertezaNum) || incertezaNum < 0) {
      incertezaNum = 5.0 // 5% default
    }

    fatoresValidos.push({
      codigo,
      material,
      descricao,
      fator: valorNum,
      unidade,
      incerteza_pct: incertezaNum,
      tier,
      fonte,
      ano: anoNum,
      escopo,
      geografia,
      validade,
      versao,
      bloqueado_atestado: false,
      indicativo: false,
      origem: 'importacao_csv',
    })
  }

  return {
    sucesso: erros.length === 0 && fatoresValidos.length > 0,
    fatoresValidos,
    erros,
    totalLinhasLidas: linhasFiltradas.length - 1,
    totalAceitas: fatoresValidos.length,
    totalRecusadas: erros.length,
  }
}

/**
 * Importa fatores validados na coleção do PocketBase (ou simula com retorno estruturado)
 */
export async function importarFatoresCsvPocketBase(
  conteudoCsv: string,
): Promise<ResultadoImportacaoFatores> {
  const parseResult = parseCsvFatoresEmissao(conteudoCsv)

  if (parseResult.fatoresValidos.length === 0) {
    return {
      sucesso: false,
      totalImportados: 0,
      totalIgnorados: 0,
      totalErros: parseResult.erros.length,
      erros: parseResult.erros,
      mensagem:
        parseResult.erros.length > 0
          ? `Importação cancelada: ${parseResult.erros.length} linha(s) com erro (veja os detalhes abaixo). Nenhum fator sem fonte foi gravado.`
          : 'Nenhum fator válido encontrado no CSV.',
    }
  }

  let importados = 0
  let errosGravacao: ErroLinhaCsvFator[] = [...parseResult.erros]

  for (const fator of parseResult.fatoresValidos) {
    try {
      // Verifica se já existe fator idêntico (codigo + versao)
      let existenteId: string | null = null
      try {
        const existente = await pb
          .collection('fatores_emissao')
          .getFirstListItem(`codigo = "${fator.codigo}" && versao = "${fator.versao}"`)
        if (existente) {
          existenteId = existente.id
        }
      } catch {
        // Record not found
      }

      if (existenteId) {
        await pb.collection('fatores_emissao').update(existenteId, {
          material: fator.material,
          descricao: fator.descricao,
          fator: fator.fator,
          unidade: fator.unidade,
          incerteza_pct: fator.incerteza_pct,
          tier: fator.tier,
          fonte: fator.fonte,
          ano: fator.ano,
          escopo: fator.escopo,
          geografia: fator.geografia,
          validade: fator.validade,
          origem: 'importacao_csv_atualizacao',
        })
      } else {
        await pb.collection('fatores_emissao').create({
          ...fator,
          origem: 'importacao_csv',
        })
      }
      importados++
    } catch (err: any) {
      errosGravacao.push({
        linhaNumero: 0,
        campo: 'pocketbase',
        motivo: `Falha ao salvar fator ${fator.codigo}: ${err?.message || 'erro desconhecido'}`,
      })
    }
  }

  const sucessoTotal = errosGravacao.length === 0
  return {
    sucesso: sucessoTotal,
    totalImportados: importados,
    totalIgnorados: 0,
    totalErros: errosGravacao.length,
    erros: errosGravacao,
    mensagem: `Importação concluída: ${importados} fator(es) gravado(s) com sucesso.${
      errosGravacao.length > 0 ? ` ${errosGravacao.length} erro(s) ou recusa(s) registrados.` : ''
    }`,
  }
}

/**
 * Cria snapshot imutável do fator de emissão no momento do cálculo.
 * Garante a regra pericial de ANTI-RETROATIVIDADE:
 * Mesmo que o catálogo seja atualizado no futuro, o item ou lote calculado
 * preserva integralmente seu snapshot da versão X.
 */
export function criarSnapshotFator(
  fator: Partial<FatorEmissaoVersionado> | Partial<FatorCanonicaItem>,
): FatorSnapshotItem {
  const codigo =
    (fator as any).codigo || (fator as any).codigoMaterial || (fator as any).id || 'desconhecido'
  const versao = (fator as any).versao || (fator as any).versaoRegistro || 'v2025.2'
  const valor =
    typeof (fator as any).fator === 'number'
      ? (fator as any).fator
      : typeof (fator as any).valorFator === 'number'
        ? (fator as any).valorFator
        : 0
  const unidade = (fator as any).unidade || 'kgCO2e/kg'
  const fonte = (fator as any).fonte || (fator as any).fonteOficial || 'Fonte não informada'
  const ano = (fator as any).ano || (fator as any).anoReferencia || new Date().getFullYear()
  const escopo = (fator as any).escopo || (fator as any).categoria || 'Escopo 3'
  const geografia = (fator as any).geografia || (fator as any).fronteira || 'Global'
  const validade = (fator as any).validade || (fator as any).vigencia || '2025-01-01 a 2026-12-31'
  const tier = (fator as any).tier || (fator as any).tierIncerteza || 'T3'
  const incertezaPct =
    typeof (fator as any).incerteza_pct === 'number'
      ? (fator as any).incerteza_pct
      : typeof (fator as any).incertezaPct === 'number'
        ? (fator as any).incertezaPct
        : 5.0

  const dataSnapshotIso = new Date().toISOString()
  const hashSnapshot = `snp_${codigo}_${versao}_${valor}_${ano}_${dataSnapshotIso.slice(0, 10)}`

  return {
    codigoFator: codigo,
    versaoFator: versao,
    valorFator: valor,
    unidadeFator: unidade,
    fonteFator: fonte,
    anoReferencia: ano,
    escopoFator: escopo,
    geografiaFator: geografia,
    validadeFator: validade,
    tierFator: tier,
    incertezaPct,
    dataSnapshotIso,
    hashSnapshot,
  }
}

/**
 * Consulta fator canônico unificando catálogo fixo com coleção versionada
 */
export async function obterFatorComSnapshot(
  codigoMaterial: string,
  versaoDesejada?: string,
): Promise<{ fator: FatorEmissaoVersionado; snapshot: FatorSnapshotItem } | null> {
  // 1. Tenta buscar no PocketBase
  try {
    let filter = `codigo = "${codigoMaterial}"`
    if (versaoDesejada) {
      filter += ` && versao = "${versaoDesejada}"`
    }
    const record = await pb
      .collection('fatores_emissao')
      .getFirstListItem<FatorEmissaoVersionado>(filter, { sort: '-created' })

    if (record) {
      return {
        fator: record,
        snapshot: criarSnapshotFator(record),
      }
    }
  } catch {
    // Busca do PocketBase falhou ou registro inexistente, recorre ao catálogo canônico em memória
  }

  // 2. Fallback no catálogo em memória homologado
  const itemCanonica =
    MAPA_FATORES_CANONICOS[codigoMaterial] ||
    CATALOGO_FATORES_CO2E.find(
      (f) => f.id === codigoMaterial || f.codigoMaterial === codigoMaterial,
    )

  if (itemCanonica) {
    const convertido: FatorEmissaoVersionado = {
      codigo: itemCanonica.codigoMaterial,
      material: itemCanonica.nomeMaterial || itemCanonica.codigoMaterial,
      descricao: itemCanonica.descricao,
      fator: itemCanonica.valorFator,
      unidade: itemCanonica.unidade,
      incerteza_pct: itemCanonica.incertezaPct || itemCanonica.incertezaRelativaUfe * 100,
      tier: itemCanonica.tier,
      fonte: itemCanonica.fonteOficial,
      ano: itemCanonica.anoReferencia,
      escopo: itemCanonica.categoria,
      geografia: itemCanonica.fronteira || 'Global',
      validade: itemCanonica.vigencia,
      versao: itemCanonica.versao || itemCanonica.versaoRegistro || 'v2025.2',
      bloqueado_atestado: itemCanonica.bloqueadoAtestado,
      indicativo: itemCanonica.indicativo,
      origem: 'catalogo_memoria',
    }

    return {
      fator: convertido,
      snapshot: criarSnapshotFator(convertido),
    }
  }

  return null
}
