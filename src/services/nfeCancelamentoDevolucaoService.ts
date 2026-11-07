/**
 * SERVIÇO DE DETECÇÃO DE CANCELAMENTO E DEVOLUÇÃO EM NF-e (ETAPA 2 PILOTO ACP)
 *
 * Regras:
 * 1. Nota Cancelada:
 *    - Detecta eventos SEFAZ de cancelamento (tpEvento 110111: Cancelamento da NF-e; 110112: Cancelamento por Substituição).
 *    - Detecta nós típicos de cancelamento: procCancNFe, retCancNFe, retEvento com tpEvento 110111/110112 e cStat 101/135/136/151/155.
 *    - Detecta cStat 101 (Cancelamento de NF-e homologado) no protNFe ou retConsSitNFe.
 *    - Emite mensagem padronizada com data do evento ou da homologação, rejeitando a importação da nota.
 *
 * 2. CFOP de Devolução:
 *    - CFOPs iniciando por 1.2xx, 2.2xx, 3.2xx, 5.2xx, 6.2xx, 7.2xx (devolução de compra/venda)
 *    - CFOPs iniciando por 1.4xx, 2.4xx, 5.4xx, 6.4xx relativos a devolução/retorno com Substituição Tributária (ex: 1410, 1411, 2410, 2411, 5410, 5411, 6410, 6411)
 *    - CFOPs específicos de devolução: 1201, 1202, 1203, 1204, 1208, 1209, 2201, 2202, 5201, 5202, 6201, 6202, etc.
 *    - Itens com CFOP de devolução NÃO entram na apuração de carbono nem no valor operacional normal.
 */

export interface EventoCancelamentoNFe {
  cancelada: boolean
  tpEvento?: string
  descEvento?: string
  cStat?: string
  xMotivo?: string
  dataCancelamento?: string
  protocolo?: string
  motivoRecusa?: string
}

export interface ChecagemCfopItem {
  cfopLimpo: string
  isDevolucao: boolean
  motivoExclusao?: string
}

export const TP_EVENTOS_CANCELAMENTO = ['110111', '110112'] as const

/**
 * Verifica se um código CFOP de 4 dígitos representa operação de devolução ou retorno
 * conforme Convênio S/Nº de 15/12/1970 e Tabela CFOP SEFAZ.
 */
export function isCfopDevolucao(cfopRaw?: string | number | null): boolean {
  if (cfopRaw === undefined || cfopRaw === null) return false
  const cfop = String(cfopRaw).replace(/\D/g, '')
  if (cfop.length !== 4) return false

  // 1. Grupos x.2xx: Devoluções de vendas e compras
  // 1.2xx (entradas estaduais), 2.2xx (interestaduais), 3.2xx (exterior),
  // 5.2xx (saídas estaduais), 6.2xx (saídas interestaduais), 7.2xx (saídas exterior)
  if (/^[123567]2\d{2}$/.test(cfop)) {
    return true
  }

  // 2. Devoluções com Substituição Tributária específicas em x.4xx
  // Ex: 1410/1411 (devolução de compra ST), 2410/2411, 5410/5411 (devolução de venda ST), 6410/6411
  // Outros retornos/devoluções de remessa em garantia ou troca com ST: 1414, 1415, 2414, 2415, 5412, 5413, 6412, 6413
  const cfopsDevolucaoST = [
    '1410',
    '1411',
    '1414',
    '1415',
    '2410',
    '2411',
    '2414',
    '2415',
    '5410',
    '5411',
    '5412',
    '5413',
    '6410',
    '6411',
    '6412',
    '6413',
  ]
  if (cfopsDevolucaoST.includes(cfop)) {
    return true
  }

  // 3. Casos adicionais comuns citados no briefing: 1949/5949 quando descritos como devolução
  // Mas por número fixo, cobrimos todos os x.2xx e os x.4xx listados acima.
  return false
}

/**
 * Valida CFOP do item e produz mensagem auditável
 */
export function checarCfopItem(cfopRaw?: string | number | null): ChecagemCfopItem {
  const cfopLimpo = cfopRaw ? String(cfopRaw).replace(/\D/g, '') : ''
  const devolucao = isCfopDevolucao(cfopLimpo)

  return {
    cfopLimpo,
    isDevolucao: devolucao,
    motivoExclusao: devolucao
      ? `CFOP ${cfopLimpo} (devolução) — não compõe a pegada de carbono nem operação normal`
      : undefined,
  }
}

/**
 * Formata data de cancelamento ISO para padrão brasileiro legível
 */
export function formatarDataEvento(dataRaw?: string): string {
  if (!dataRaw) return ''
  try {
    const d = new Date(dataRaw)
    if (!isNaN(d.getTime())) {
      const dia = String(d.getDate()).padStart(2, '0')
      const mes = String(d.getMonth() + 1).padStart(2, '0')
      const ano = d.getFullYear()
      const horas = String(d.getHours()).padStart(2, '0')
      const mins = String(d.getMinutes()).padStart(2, '0')
      return `${dia}/${mes}/${ano} ${horas}:${mins}`
    }
  } catch {
    /* fallback */
  }
  return dataRaw.slice(0, 19).replace('T', ' ')
}

/**
 * Detecta se uma NF-e em formato XML (string ou Document) possui evento ou protocolo de cancelamento
 */
export function detectarCancelamentoXml(xmlConteudo: string | Document): EventoCancelamentoNFe {
  let doc: Document
  if (typeof xmlConteudo === 'string') {
    const trimmed = xmlConteudo.trim()
    if (!trimmed) {
      return { cancelada: false }
    }
    const parser = new DOMParser()
    doc = parser.parseFromString(trimmed, 'text/xml')
  } else {
    doc = xmlConteudo
  }

  // 1. Procura por eventos de cancelamento em <retEvento>, <procEventoNFe>, <evento>, <eventoNFe>
  const eventos = doc.querySelectorAll('evento, eventoNFe, infEvento, retEvento, infEventoRet')
  for (let i = 0; i < eventos.length; i++) {
    const ev = eventos[i]
    const tpEvento = (ev.querySelector('tpEvento')?.textContent || '').trim()
    if (tpEvento === '110111' || tpEvento === '110112') {
      const descEvento =
        (ev.querySelector('descEvento')?.textContent || '').trim() ||
        (tpEvento === '110111' ? 'Cancelamento da NF-e' : 'Cancelamento por Substituição')
      const dhRegEvento =
        (ev.querySelector('dhRegEvento')?.textContent || '').trim() ||
        (ev.querySelector('dhEvento')?.textContent || '').trim()
      const nProt = (ev.querySelector('nProt')?.textContent || '').trim()
      const cStat = (ev.querySelector('cStat')?.textContent || '').trim()
      const xMotivo = (ev.querySelector('xMotivo')?.textContent || '').trim()

      const dataFormatada = dhRegEvento ? formatarDataEvento(dhRegEvento) : ''
      const complementoData = dataFormatada ? ` em ${dataFormatada}` : ''
      const complementoProt = nProt ? ` (protocolo ${nProt})` : ''

      return {
        cancelada: true,
        tpEvento,
        descEvento,
        cStat: cStat || '135',
        xMotivo: xMotivo || 'Evento de cancelamento homologado',
        dataCancelamento: dhRegEvento || undefined,
        protocolo: nProt || undefined,
        motivoRecusa: `NF-e cancelada na SEFAZ${complementoData}${complementoProt} — não pode ser usada na pegada.`,
      }
    }
  }

  // 2. Procura por estruturas <procCancNFe> ou <retCancNFe> (layout legado de cancelamento)
  const procCanc = doc.querySelector('procCancNFe, retCancNFe, cancNFe')
  if (procCanc) {
    const cStat = (procCanc.querySelector('cStat')?.textContent || '').trim()
    const xMotivo = (procCanc.querySelector('xMotivo')?.textContent || '').trim()
    const dhRecbto = (procCanc.querySelector('dhRecbto')?.textContent || '').trim()
    const nProt = (procCanc.querySelector('nProt')?.textContent || '').trim()

    const dataFormatada = dhRecbto ? formatarDataEvento(dhRecbto) : ''
    const complementoData = dataFormatada ? ` em ${dataFormatada}` : ''
    const complementoProt = nProt ? ` (protocolo ${nProt})` : ''

    return {
      cancelada: true,
      tpEvento: '110111',
      descEvento: 'Cancelamento de NF-e homologado',
      cStat: cStat || '101',
      xMotivo: xMotivo || 'Cancelamento de NF-e homologado',
      dataCancelamento: dhRecbto || undefined,
      protocolo: nProt || undefined,
      motivoRecusa: `NF-e cancelada na SEFAZ${complementoData}${complementoProt} — não pode ser usada na pegada.`,
    }
  }

  // 3. Procura por <protNFe> com cStat = 101 ("Cancelamento de NF-e homologado") ou 151/155
  const protNFe = doc.querySelector('protNFe, infProt')
  if (protNFe) {
    const cStat = (protNFe.querySelector('cStat')?.textContent || '').trim()
    if (cStat === '101' || cStat === '151' || cStat === '155') {
      const xMotivo = (protNFe.querySelector('xMotivo')?.textContent || '').trim()
      const dhRecbto = (protNFe.querySelector('dhRecbto')?.textContent || '').trim()
      const nProt = (protNFe.querySelector('nProt')?.textContent || '').trim()

      const dataFormatada = dhRecbto ? formatarDataEvento(dhRecbto) : ''
      const complementoData = dataFormatada ? ` em ${dataFormatada}` : ''
      const complementoProt = nProt ? ` (protocolo ${nProt})` : ''

      return {
        cancelada: true,
        tpEvento: '110111',
        descEvento: 'Cancelamento homologado',
        cStat,
        xMotivo: xMotivo || 'Cancelamento de NF-e homologado',
        dataCancelamento: dhRecbto || undefined,
        protocolo: nProt || undefined,
        motivoRecusa: `NF-e cancelada na SEFAZ${complementoData}${complementoProt} — não pode ser usada na pegada.`,
      }
    }
  }

  // 4. Detecção por texto rápido defensivo caso seja XML plano com tags de evento
  if (typeof xmlConteudo === 'string') {
    if (
      xmlConteudo.includes('tpEvento>110111<') ||
      xmlConteudo.includes('tpEvento>110112<') ||
      (xmlConteudo.includes('<cStat>101<') && xmlConteudo.includes('Cancelamento'))
    ) {
      return {
        cancelada: true,
        tpEvento: xmlConteudo.includes('110112') ? '110112' : '110111',
        descEvento: 'Cancelamento de NF-e',
        motivoRecusa: 'NF-e cancelada na SEFAZ — não pode ser usada na pegada.',
      }
    }
  }

  return { cancelada: false }
}
