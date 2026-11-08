import pb from '@/lib/pocketbase/client'
import { calcularInventarioEmissoes } from '@/services/motorEmissoes'
import type { DocumentoFiscalProcessado } from '@/services/modelosFiscaisParser'

/**
 * Estrutura consolidada de indicadores anonimizados do Piloto ACP.
 * NUNCA contém nome, razão social, CNPJ ou e-mail de empresa individual.
 */
export interface IndicadoresAcpAgregados {
  /** Quantidade total de empresas associadas ativas (papel cliente_acp) */
  totalEmpresasAtivas: number
  /** Quantidade total de lotes/notas fiscais importados */
  totalLotesNotas: number
  /** Total de itens apurados / processados */
  totalItensApurados: number
  /** Total de itens calculados (com fator mapeado) */
  totalItensCalculados: number
  /** Total de itens não calculados (sem fator mapeado na DM-ORB-001, emissão zero) */
  totalItensNaoCalculados: number
  /**
   * Soma agregada de emissões totais (tCO₂e) — rótulo ESTIMATIVA • dMRV.
   * Se totalEmpresasAtivas < 3, é null (anti-reidentificação por dedução).
   */
  emissoesTotaisTco2e: number | null
  /**
   * Emissões evitadas / recuperadas consolidadas (tCO₂e) se houver CDV/economia circular.
   * Se totalEmpresasAtivas < 3, é null.
   */
  emissoesEvitadasTco2e: number | null
  /** Se o threshold de anti-dedução (k-anonimato >= 3) foi ativado */
  protecaoAntiDeducaoAtiva: boolean
  /** Se a base está vazia (0 empresas ou 0 lotes) */
  semDados: boolean
  /** Data/hora do cálculo da agregação (ISO) */
  calculadoEm: string
}

/**
 * Quantidade mínima de empresas necessária para liberar a exibição de métricas contínuas (emissões).
 * Menos de 3 empresas impede dedução por subtração caso uma das partes conheça o próprio valor.
 */
export const MINIMO_EMPRESAS_ANTI_DEDUCAO = 3

/**
 * Calcula os indicadores agregados da carteira ACP a partir das coleções do PocketBase
 * respeitando estritamente a blindagem pericial da Opção B e anonimização total.
 */
export async function obterIndicadoresAgregadosAcp(): Promise<IndicadoresAcpAgregados> {
  const agora = new Date().toISOString()

  // 1. Busca usuários com papel cliente_acp (ou que tenham código com prefixo ORB-ACP)
  let empresasAtivasCount = 0
  let userIdsAcp: string[] = []

  try {
    const users = await pb.collection('users').getFullList({
      filter: 'role = "cliente_acp"',
      fields: 'id,role,cliente_codigo',
    })
    empresasAtivasCount = users.length
    userIdsAcp = users.map((u) => u.id)
  } catch (err) {
    console.log('[acpIndicadoresService] Aviso ao buscar empresas ACP:', err)
  }

  // Se não houver empresas ativas registradas
  if (empresasAtivasCount === 0) {
    return {
      totalEmpresasAtivas: 0,
      totalLotesNotas: 0,
      totalItensApurados: 0,
      totalItensCalculados: 0,
      totalItensNaoCalculados: 0,
      emissoesTotaisTco2e: null,
      emissoesEvitadasTco2e: null,
      protecaoAntiDeducaoAtiva: false,
      semDados: true,
      calculadoEm: agora,
    }
  }

  // 2. Busca notas fiscais / lotes das empresas participantes
  // Consultamos a coleção nfe_upload vinculada aos IDs dos clientes ACP
  let totalLotesNotas = 0
  let totalItensApurados = 0
  let totalItensCalculados = 0
  let totalItensNaoCalculados = 0
  let somaEmissoesTotaisTco2e = 0

  try {
    // Filtro por usuários participantes se a lista for viável; caso contrário pega todos do escopo ACP
    let nfeList: any[] = []
    if (userIdsAcp.length > 0) {
      // Monta filtro PocketBase: usuario = 'id1' || usuario = 'id2' ...
      const chunks: string[][] = []
      for (let i = 0; i < userIdsAcp.length; i += 20) {
        chunks.push(userIdsAcp.slice(i, i + 20))
      }

      for (const chunk of chunks) {
        const filterStr = chunk.map((id) => `usuario = "${id}"`).join(' || ')
        const batch = await pb.collection('nfe_upload').getFullList({
          filter: filterStr,
          sort: '-created',
        })
        nfeList.push(...batch)
      }
    }

    totalLotesNotas = nfeList.length

    // Processa itens e emissões
    const docsParaEmissoes: DocumentoFiscalProcessado[] = []

    for (const item of nfeList) {
      const resumoItens = Array.isArray(item.resumo_itens_json) ? item.resumo_itens_json : []
      const qtdItensNota = resumoItens.length || item.qtd_itens || 0
      totalItensApurados += qtdItensNota

      let itensNaoCalc = 0
      for (const it of resumoItens) {
        if (
          it.naoCalculado ||
          (typeof it.fonteFator === 'string' &&
            it.fonteFator.toLowerCase().includes('não calculado'))
        ) {
          itensNaoCalc++
        }
      }
      totalItensNaoCalculados += itensNaoCalc
      totalItensCalculados += Math.max(0, qtdItensNota - itensNaoCalc)

      // Monta doc processado para alimentar o motor oficial de emissões
      docsParaEmissoes.push({
        chaveAcesso: item.chave_acesso || item.id,
        modeloFiscal: item.modelo_fiscal || (item.modelo === '65' ? '65_nfce' : '55_nfe'),
        numeroDocumento: item.numero_nota || '1',
        serie: item.serie || '1',
        dataEmissao: item.data_emissao || item.created,
        cnpjEmitente: '', // Limpo para garantia de anonimização na memória
        nomeEmitente: '',
        cnpjDestinatario: '',
        nomeDestinatario: '',
        valorTotal: item.valor_total_nf || 0,
        valorIcms: item.valor_icms || 0,
        valorIpi: item.valor_ipi || 0,
        valorPis: item.valor_pis || 0,
        valorCofins: item.valor_cofins || 0,
        combustivelTipo: item.combustivel_tipo,
        combustivelLitros: item.combustivel_litros,
        energiaKwh: item.energia_kwh,
        transporteTkm: item.transporte_tkm,
        origem: item.origem || 'manual',
        itens: resumoItens,
      })
    }

    if (docsParaEmissoes.length > 0) {
      const inventarioAgregado = calcularInventarioEmissoes(docsParaEmissoes, {
        empresaNome: 'Agregado ACP (Anonimizado)',
        cnpj: '00.000.000/0000-00',
        possuiIREC: false,
      })
      somaEmissoesTotaisTco2e = inventarioAgregado.emissoesTotaisFosseisTCO2e
    }
  } catch (err) {
    console.log('[acpIndicadoresService] Aviso ao computar notas ACP:', err)
  }

  // 3. Aplica regra de anti-reidentificação por dedução (k-anonimato mínimo = 3)
  const protecaoAntiDeducaoAtiva = empresasAtivasCount < MINIMO_EMPRESAS_ANTI_DEDUCAO
  const semDados = empresasAtivasCount === 0 || totalLotesNotas === 0

  return {
    totalEmpresasAtivas: empresasAtivasCount,
    totalLotesNotas,
    totalItensApurados,
    totalItensCalculados,
    totalItensNaoCalculados,
    emissoesTotaisTco2e: protecaoAntiDeducaoAtiva
      ? null
      : Number(somaEmissoesTotaisTco2e.toFixed(3)),
    emissoesEvitadasTco2e: protecaoAntiDeducaoAtiva ? null : 0,
    protecaoAntiDeducaoAtiva,
    semDados,
    calculadoEm: agora,
  }
}

/**
 * Gera conteúdo CSV estritamente anonimizado com os indicadores agregados do piloto ACP.
 * NUNCA inclui identificadores individuais (nome, CNPJ, e-mail).
 */
export function gerarCsvIndicadoresAcp(indicadores: IndicadoresAcpAgregados): string {
  const linhas: string[] = []

  linhas.push('RELATÓRIO CONSOLIDADO DE INDICADORES AGREGADOS — PILOTO ACP')
  linhas.push('Orbis Protocol • dMRV de Economia Circular e Descarbonização')
  linhas.push(`Gerado em;${new Date(indicadores.calculadoEm).toLocaleString('pt-BR')}`)
  linhas.push('Classificação;Dados Agregados e Anonimizados (Opção B - Sem dados identificáveis)')
  linhas.push('')
  linhas.push('Métrica Indicadora;Valor Consolidado;Observação Metodológica')
  linhas.push(
    `Empresas Associadas Participantes;${indicadores.totalEmpresasAtivas};Contas ativas vinculadas ao convênio ACP (papel cliente_acp)`,
  )
  linhas.push(
    `Lotes e Notas Fiscais Importadas;${indicadores.totalLotesNotas};Documentos fiscais e lotes dMRV submetidos`,
  )
  linhas.push(
    `Total de Itens Apurados;${indicadores.totalItensApurados};Itens físicos e insumos processados`,
  )
  linhas.push(
    `Itens Calculados (Com Fator DM-ORB-001);${indicadores.totalItensCalculados};Classificados com fatores de emissão oficiais curados`,
  )
  linhas.push(
    `Itens Não Calculados;${indicadores.totalItensNaoCalculados};Sem fator oficial mapeado (emissão zero; sem fallback silencioso)`,
  )

  if (indicadores.protecaoAntiDeducaoAtiva) {
    linhas.push(
      `Emissões Totais Estimadas (tCO2e);[PROTEGIDO];Menos de 3 empresas participantes (regra anti-dedução ativa para preservar sigilo)`,
    )
    linhas.push(
      `Emissões Evitadas Consolidadas (tCO2e);[PROTEGIDO];Menos de 3 empresas participantes (regra anti-dedução ativa)`,
    )
  } else if (indicadores.emissoesTotaisTco2e !== null) {
    linhas.push(
      `Emissões Totais Estimadas (tCO2e);${indicadores.emissoesTotaisTco2e.toFixed(3).replace('.', ',')};ESTIMATIVA • dMRV (DM-ORB-001 v1.1)`,
    )
    linhas.push(
      `Emissões Evitadas Consolidadas (tCO2e);${(indicadores.emissoesEvitadasTco2e || 0).toFixed(3).replace('.', ',')};Recuperação de materiais / Economia Circular`,
    )
  } else {
    linhas.push('Emissões Totais Estimadas (tCO2e);0,000;Sem emissões calculadas')
  }

  linhas.push('')
  linhas.push('NOTAS LEGAIS E LIMITAÇÕES METODOLÓGICAS:')
  linhas.push(
    '- Metodologia: Norma Técnica DM-ORB-001 v1.1. Valores de emissão seguem o rótulo ESTIMATIVA • dMRV.',
  )
  linhas.push(
    '- Blindagem Opção B: Nenhum valor unitário de fator de emissão é exposto nesta planilha.',
  )
  linhas.push(
    '- Sigilo e LGPD: Relatório 100% anonimizado. Não contém dados pessoais nem identificadores fiscais individuais.',
  )

  return linhas.join('\r\n')
}

/**
 * Dispara o download de um arquivo CSV gerado no navegador.
 */
export function baixarArquivoCsv(
  conteudo: string,
  nomeArquivo: string = 'indicadores-agregados-acp.csv',
) {
  const blob = new Blob(['\uFEFF' + conteudo], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', nomeArquivo)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
