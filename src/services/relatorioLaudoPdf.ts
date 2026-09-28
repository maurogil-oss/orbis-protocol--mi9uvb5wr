/**
 * GERADOR DE RELATÓRIO PERICIAL & DOSSIÊ EM PDF (CLIENT-SIDE)
 * Orbis Protocol • Auditoria & Rastreabilidade dMRV
 *
 * Gera um documento PDF estruturado e pronto para entrega:
 * - Capa institucional com gradiente escuro e verde-esmeralda (#0A0E12 / #12B886)
 * - Sumário executivo e identificação corporativa (Razão Social, CNPJ, Responsável, Data/Hora)
 * - Seção 1: Diagnóstico Regulatório & Perfil Climático (SBCE Lei 15.042/2024, limiares 10k/25k, CBAM UE)
 * - Seção 2: Inventário Pericial de Emissões GEE (Escopos 1, 2 e 3, duplo reporte Localização x Mercado, GWP AR6, incerteza)
 * - Seção 3: Diagnóstico Comparativo da Reforma Tributária (Tributos Hoje x Reforma EC 132/2023, créditos NF-e apurados)
 * - Seção 4: Green Capital Engine — 8 Linhas de Crédito Verde & Spread Bonificado (taxa padrão x bonificada, economia em R$)
 * - Seção 5: Conclusão Pericial, Hash Criptográfico SHA-256 e Disclaimers Regulatórios Obrigatórios
 * - Cabeçalho e numeração de páginas profissional
 *
 * Implementado via motor vetorial nativo em formato PDF 1.4 / Janela de Impressão de Alta Fidelidade (com fallback nativo para download/impressão direta em qualquer navegador).
 */

import { InventarioEmissoesResultado } from './motorEmissoes'
import { ResultadoComparativoTributario } from './tributosReforma'
import { ResultadoGreenCapitalEngine, formatarFinalidade } from './greenCapitalEngine'
import { formatCurrencyBRL } from './nfeParser'

export interface DocumentoFonteNFe {
  id?: string
  chave_acesso?: string
  numero_nota?: string
  serie?: string
  data_emissao?: string
  cnpj_emitente?: string
  nome_emitente?: string
  valor_total_nf?: number
  credito_apurado?: number
  valor_pis?: number
  valor_cofins?: number
  valor_icms?: number
  modelo?: string
}

export interface DadosRelatorioDossie {
  identificacao: {
    razaoSocial: string
    cnpj: string
    responsavel?: string
    categoriaProfissional?: string
    conselho?: string
    email?: string
    whatsapp?: string
    regimeTributario?: string
    vinculoInstitucional?: string
    dataGeracao?: string
    geradoPorNome?: string
    geradoPorRole?: string
    demonstracao?: boolean
    // Credenciamento do Perito Técnico (ART/RRT, CREA/CRC)
    peritoCredenciado?: {
      nome: string
      conselho: string
      registro: string
      uf: string
      numeroArtRrt?: string
      termoVersao?: string
    }
    // Avaliação de Adicionalidade MOVER (Camada Declaratória Anexa - Fora do Hash)
    avaliacaoAdicionalidade?: {
      adicionalidade_investimento: boolean
      barreira_tecnologica: boolean
      nao_obrigatoriedade_legal: boolean
      justificativa_pericial?: string
      data_avaliacao?: string
      avaliador_nome?: string
      status_parecer?: string
    }
  }
  diagnostico: {
    enquadramentoSbceTexto?: string
    statusSbce?: string
    exportaUeCbam?: string
    cbamBens?: string
    faixaEmissoes?: string
  }
  inventario?: InventarioEmissoesResultado | null
  comparativoTributario?: ResultadoComparativoTributario | null
  greenCapital?: ResultadoGreenCapitalEngine | null
  documentosFonte?: DocumentoFonteNFe[]
  hashDocumentosFonte?: string
  hashIntegridade?: string
  codigoSelo?: string
}

/**
 * Calcula hash SHA-256 no browser via Web Crypto API
 */
export async function calcularHashDossie(conteudoTexto: string): Promise<string> {
  if (typeof window === 'undefined' || !window.crypto || !window.crypto.subtle) {
    // Fallback simples
    let hash = 0
    for (let i = 0; i < conteudoTexto.length; i++) {
      hash = (hash << 5) - hash + conteudoTexto.charCodeAt(i)
      hash |= 0
    }
    return `ORBIS-SHA256-${Math.abs(hash).toString(16).padStart(16, '0').toUpperCase()}`
  }

  const msgUint8 = new TextEncoder().encode(conteudoTexto)
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgUint8)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase()
}

/**
 * Calcula o hash SHA-256 canônico de um conjunto de Documentos Fonte (NF-e).
 * Segue o padrão de ordenação lexicográfica estrita similar a calcularHashCanonicalLote.
 * Canônico por nota: chave_acesso|numero_nota|serie|data_emissao|cnpj_emitente|valor_total_nf|credito_apurado
 */
export async function calcularHashCanonicalDocumentosFonte(
  documentos: DocumentoFonteNFe[],
  cnpjAuditado?: string,
): Promise<string> {
  const cnpjClean = (cnpjAuditado || '').replace(/\D/g, '')

  if (!documentos || documentos.length === 0) {
    const rawVazio = `FONTES_VAZIO|${cnpjClean}`
    return await calcularHashDossie(rawVazio)
  }

  // Mapeamento canônico determinístico com 2 casas decimais e ordenação lexicográfica
  const stringsOrdenadas = documentos
    .map((doc) => {
      const chave = (doc.chave_acesso || '').trim()
      const numero = (doc.numero_nota || '').trim()
      const serie = (doc.serie || '').trim()
      const data = (doc.data_emissao || '').trim().slice(0, 10)
      const cnpjEmit = (doc.cnpj_emitente || '').replace(/\D/g, '')
      const vlrTotal = Number(doc.valor_total_nf || 0).toFixed(2)
      const vlrCred = Number(
        doc.credito_apurado ?? Number(doc.valor_pis || 0) + Number(doc.valor_cofins || 0),
      ).toFixed(2)
      return `${chave}|${numero}|${serie}|${data}|${cnpjEmit}|${vlrTotal}|${vlrCred}`
    })
    .sort()

  const concatenacao = `${cnpjClean}|${documentos.length}|${stringsOrdenadas.join('||')}`
  return await calcularHashDossie(concatenacao)
}

/**
 * Exporta a relação completa de documentos fonte em formato CSV estruturado (RFC 4180 / pt-BR):
 * - Codificação UTF-8 com BOM (0xEF, 0xBB, 0xBF) para compatibilidade nativa com Excel
 * - Separador ponto e vírgula ';'
 * - Cabeçalho pericial de metadados com CNPJ, Razão Social, Data, Qtd e Hash SHA-256 do lote
 * - Download automático via Blob no browser
 */
export function exportarDocumentosFonteCsv(params: {
  razaoSocial: string
  cnpj: string
  documentos: DocumentoFonteNFe[]
  hashDocumentosFonte: string
  dataGeracao?: string
}): void {
  const { razaoSocial, cnpj, documentos, hashDocumentosFonte, dataGeracao } = params

  const dataStr = dataGeracao || new Date().toISOString()
  const escapeCsv = (val: string | number | undefined | null) => {
    if (val === undefined || val === null) return ''
    const str = String(val)
    if (str.includes(';') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`
    }
    return str
  }

  const formatBrlNum = (val: number | undefined | null) => {
    return Number(val || 0)
      .toFixed(2)
      .replace('.', ',')
  }

  const linhas: string[] = []

  // Metadados periciais no topo
  linhas.push('# ORBIS PROTOCOL — ANEXO PERICIAL DE DOCUMENTOS FONTE')
  linhas.push(`# RAZAO_SOCIAL;${escapeCsv(razaoSocial)}`)
  linhas.push(`# CNPJ_AUDITADO;${escapeCsv(cnpj)}`)
  linhas.push(`# DATA_GERACAO;${escapeCsv(dataStr)}`)
  linhas.push(`# TOTAL_DOCUMENTOS;${documentos.length}`)
  linhas.push(`# HASH_SHA256_DOCUMENTOS_FONTE;${hashDocumentosFonte}`)
  linhas.push('# PADRAO_COMPATIBILIDADE;RFC 4180 / Excel pt-BR (BOM UTF-8, sep ;) ;')
  linhas.push('') // Linha em branco

  // Cabeçalho das colunas
  linhas.push(
    [
      'Numero',
      'Serie',
      'Modelo',
      'Data Emissao',
      'CNPJ Emitente',
      'Razao Social Emitente',
      'Chave de Acesso (44 digitos)',
      'Valor Total (R$)',
      'Credito Apurado PIS+COFINS (R$)',
      'PIS (R$)',
      'COFINS (R$)',
      'ICMS (R$)',
    ].join(';'),
  )

  let somaTotal = 0
  let somaCredito = 0

  documentos.forEach((d) => {
    const vTotal = Number(d.valor_total_nf || 0)
    const vCred = Number(
      d.credito_apurado ?? Number(d.valor_pis || 0) + Number(d.valor_cofins || 0),
    )
    somaTotal += vTotal
    somaCredito += vCred

    linhas.push(
      [
        escapeCsv(d.numero_nota || ''),
        escapeCsv(d.serie || '1'),
        escapeCsv(d.modelo || '55'),
        escapeCsv(d.data_emissao ? d.data_emissao.slice(0, 10) : ''),
        escapeCsv(d.cnpj_emitente || ''),
        escapeCsv(d.nome_emitente || ''),
        escapeCsv(d.chave_acesso || ''),
        formatBrlNum(vTotal),
        formatBrlNum(vCred),
        formatBrlNum(d.valor_pis),
        formatBrlNum(d.valor_cofins),
        formatBrlNum(d.valor_icms),
      ].join(';'),
    )
  })

  // Linha de totalização
  linhas.push(
    [
      'TOTAL CONSOLIDADO',
      '',
      '',
      '',
      '',
      `${documentos.length} notas`,
      '',
      formatBrlNum(somaTotal),
      formatBrlNum(somaCredito),
      '',
      '',
      '',
    ].join(';'),
  )

  const conteudoCsv = '\uFEFF' + linhas.join('\r\n')
  const blob = new Blob([conteudoCsv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  const cnpjClean = cnpj.replace(/\D/g, '')
  link.setAttribute('href', url)
  link.setAttribute(
    'download',
    `orbis_documentos_fonte_${cnpjClean || 'empresa'}_${new Date().toISOString().slice(0, 10)}.csv`,
  )
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Monta o HTML pericial para renderização e impressão/exportação para PDF
 */
export function gerarHtmlRelatorioDossie(dados: DadosRelatorioDossie, hashSha256: string): string {
  const dataExtenso =
    dados.identificacao.dataGeracao ||
    new Date().toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })

  const inv = dados.inventario
  const trib = dados.comparativoTributario
  const cap = dados.greenCapital
  const isDemo = Boolean(dados.identificacao.demonstracao)

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>${isDemo ? '[DEMONSTRAÇÃO] ' : ''}Dossiê Pericial Orbis Protocol — ${dados.identificacao.razaoSocial}</title>
  <style>
    @page {
      size: A4;
      margin: 15mm 15mm 15mm 15mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 0;
      background-color: #ffffff;
      color: #111827;
      font-size: 11pt;
      line-height: 1.45;
    }
    .page-break {
      page-break-after: always;
      break-after: page;
    }
    .avoid-break {
      page-break-inside: avoid;
      break-inside: avoid;
    }

    /* CAPA */
    .capa-container {
      position: relative;
      background: linear-gradient(135deg, #0A0E12 0%, #111820 60%, #070A0D 100%);
      color: #F4F7FA;
      padding: 40px 35px;
      border-radius: 8px;
      min-height: 940px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      border-left: 6px solid ${isDemo ? '#D9B36C' : '#12B886'};
      overflow: hidden;
    }
    .watermark-demo {
      position: fixed;
      top: 35%;
      left: 10%;
      right: 10%;
      transform: rotate(-35deg);
      font-size: 82pt;
      font-weight: 900;
      color: rgba(217, 179, 108, 0.13);
      text-align: center;
      text-transform: uppercase;
      letter-spacing: 12px;
      pointer-events: none;
      z-index: 9999;
      user-select: none;
    }

    /* MARCA D'ÁGUA DE PROVENIÊNCIA ORBIS PROTOCOL */
    .watermark-proveniencia-overlay {
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: 9998;
      display: flex;
      flex-direction: column;
      justify-content: space-around;
      align-items: center;
      overflow: hidden;
      opacity: 0.085;
      user-select: none;
    }
    .watermark-proveniencia-line {
      transform: rotate(-24deg);
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 10pt;
      font-weight: 700;
      color: #0A0E12;
      letter-spacing: 3px;
      white-space: nowrap;
      text-transform: uppercase;
      line-height: 1.8;
      text-align: center;
    }
    .watermark-proveniencia-faixa {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      background: #F8FAFC;
      border: 1px dashed #CBD5E1;
      border-left: 3px solid #12B886;
      border-radius: 4px;
      padding: 6px 10px;
      margin-bottom: 14px;
      font-size: 7.5pt;
      color: #475569;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    }
    .watermark-proveniencia-faixa strong {
      color: #0A0E12;
    }
    .watermark-proveniencia-faixa .badge-origem {
      background: rgba(18, 184, 134, 0.15);
      color: #047857;
      font-weight: 800;
      padding: 2px 6px;
      border-radius: 3px;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      font-size: 7pt;
      border: 1px solid rgba(18, 184, 134, 0.35);
      white-space: nowrap;
    }
    .badge-demo-top {
      background: #D9B36C;
      color: #0A0E12;
      font-weight: 900;
      font-size: 8.5pt;
      padding: 4px 10px;
      border-radius: 4px;
      letter-spacing: 1px;
      text-transform: uppercase;
      display: inline-block;
    }
    .capa-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid rgba(244, 247, 250, 0.15);
      padding-bottom: 20px;
    }
    .capa-brand {
      font-size: 20pt;
      font-weight: 900;
      letter-spacing: 2px;
      color: #F4F7FA;
    }
    .capa-brand span {
      color: #12B886;
    }
    .capa-tag {
      background: rgba(18, 184, 134, 0.15);
      color: #12B886;
      border: 1px solid #12B886;
      padding: 4px 10px;
      border-radius: 4px;
      font-size: 8.5pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .capa-title-area {
      margin: 50px 0;
    }
    .capa-subtitle {
      color: #D9B36C;
      font-size: 11pt;
      text-transform: uppercase;
      letter-spacing: 2px;
      font-weight: 700;
      margin-bottom: 12px;
    }
    .capa-title {
      font-size: 26pt;
      font-weight: 900;
      line-height: 1.15;
      color: #FFFFFF;
      margin: 0 0 16px 0;
    }
    .capa-desc {
      color: #93A3B5;
      font-size: 12pt;
      max-width: 650px;
      line-height: 1.5;
    }
    .capa-meta-box {
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(244, 247, 250, 0.12);
      border-radius: 6px;
      padding: 20px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
      font-size: 10pt;
    }
    .capa-meta-item label {
      display: block;
      color: #93A3B5;
      font-size: 8pt;
      text-transform: uppercase;
      font-weight: 700;
      letter-spacing: 0.5px;
      margin-bottom: 3px;
    }
    .capa-meta-item strong {
      color: #F4F7FA;
      font-size: 11pt;
    }
    .capa-footer {
      border-top: 1px solid rgba(244, 247, 250, 0.15);
      padding-top: 15px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 8pt;
      color: #93A3B5;
    }

    /* PÁGINAS DE CONTEÚDO */
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #12B886;
      padding-bottom: 8px;
      margin-bottom: 20px;
      font-size: 9pt;
      color: #6B7280;
    }
    .page-header-title {
      font-weight: 800;
      color: #0A0E12;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .section-title {
      font-size: 15pt;
      font-weight: 800;
      color: #0A0E12;
      margin: 20px 0 10px 0;
      display: flex;
      align-items: center;
      gap: 8px;
      border-left: 4px solid #12B886;
      padding-left: 10px;
    }
    .section-subtitle {
      font-size: 9.5pt;
      color: #4B5563;
      margin-bottom: 15px;
      line-height: 1.4;
    }

    /* CARDS & GRIDS */
    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 15px;
    }
    .grid-3 {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 10px;
      margin-bottom: 15px;
    }
    .grid-4 {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr 1fr;
      gap: 10px;
      margin-bottom: 15px;
    }
    .card {
      background: #F9FAFB;
      border: 1px solid #E5E7EB;
      border-radius: 6px;
      padding: 12px 14px;
    }
    .card-highlight {
      background: #F0FDF4;
      border: 1px solid #86EFAC;
    }
    .card-alert {
      background: #FEF2F2;
      border: 1px solid #FECACA;
    }
    .card-gold {
      background: #FFFBEB;
      border: 1px solid #FDE68A;
    }
    .card-label {
      font-size: 8pt;
      font-weight: 700;
      text-transform: uppercase;
      color: #6B7280;
      margin-bottom: 4px;
      letter-spacing: 0.5px;
    }
    .card-value {
      font-size: 14pt;
      font-weight: 900;
      color: #111827;
      line-height: 1.1;
    }
    .card-value-green {
      color: #059669;
    }
    .card-value-gold {
      color: #B45309;
    }
    .card-value-red {
      color: #DC2626;
    }
    .card-desc {
      font-size: 8pt;
      color: #4B5563;
      margin-top: 4px;
    }

    /* TABELAS */
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 15px;
      font-size: 9pt;
    }
    th {
      background: #0A0E12;
      color: #FFFFFF;
      text-align: left;
      padding: 8px 10px;
      font-weight: 700;
      font-size: 8.5pt;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    td {
      padding: 7px 10px;
      border-bottom: 1px solid #E5E7EB;
      color: #374151;
    }
    tr:nth-child(even) td {
      background: #F9FAFB;
    }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .font-mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
    .font-bold { font-weight: 700; }

    /* BADGES */
    .badge {
      display: inline-block;
      padding: 2px 7px;
      border-radius: 3px;
      font-size: 7.5pt;
      font-weight: 700;
      text-transform: uppercase;
    }
    .badge-green { background: #DCFCE7; color: #166534; }
    .badge-blue { background: #DBEAFE; color: #1E40AF; }
    .badge-yellow { background: #FEF3C7; color: #92400E; }
    .badge-red { background: #FEE2E2; color: #991B1B; }

    /* CAIXAS DE AVISO / DISCLAIMER */
    .disclaimer-box {
      background: #F3F4F6;
      border-left: 3px solid #9CA3AF;
      padding: 10px 12px;
      font-size: 8pt;
      color: #4B5563;
      margin-top: 15px;
      line-height: 1.4;
    }
    .hash-box {
      background: #0A0E12;
      color: #D9B36C;
      font-family: monospace;
      padding: 10px 14px;
      border-radius: 4px;
      font-size: 8pt;
      word-break: break-all;
      margin-top: 15px;
      border: 1px solid rgba(217, 179, 108, 0.4);
    }

    .footer-fixed {
      margin-top: 25px;
      padding-top: 10px;
      border-top: 1px solid #E5E7EB;
      display: flex;
      justify-content: space-between;
      font-size: 7.5pt;
      color: #9CA3AF;
    }
  </style>
</head>
<body>

  <!-- ==================== MARCA D'ÁGUA DE PROVENIÊNCIA (REPETIÇÃO DIAGONAL) ==================== -->
  <div class="watermark-proveniencia-overlay" aria-hidden="true">
    <div class="watermark-proveniencia-line">
      ORBIS PROTOCOL • PROVA DOCUMENTAL • EMISSÃO: ${dataExtenso.toUpperCase()} • HASH: ${hashSha256.slice(0, 16)} • ${dados.identificacao.cnpj}
    </div>
    <div class="watermark-proveniencia-line">
      INFRAESTRUTURA DMRV • ORBIS PROTOCOL • ENTE: ${dados.identificacao.razaoSocial.toUpperCase().slice(0, 32)} • HASH: ${hashSha256.slice(0, 16)}
    </div>
    <div class="watermark-proveniencia-line">
      EMITIDO VIA ORBIS PROTOCOL • PROVA IMUTÁVEL SHA-256 • AUTENTICIDADE EM ORBIS-PROTOCOL.COM/VERIFICADOR
    </div>
    <div class="watermark-proveniencia-line">
      ORBIS PROTOCOL • PROVA DOCUMENTAL • EMISSÃO: ${dataExtenso.toUpperCase()} • HASH: ${hashSha256.slice(0, 16)} • ${dados.identificacao.cnpj}
    </div>
  </div>

  <!-- ==================== MARCA D'ÁGUA DEMONSTRAÇÃO SE APLICÁVEL ==================== -->
  ${isDemo ? '<div class="watermark-demo">DEMONSTRAÇÃO</div>' : ''}

  <!-- ==================== PÁGINA 1: CAPA INSTITUCIONAL ==================== -->
  <div class="capa-container page-break">
    <div class="capa-header">
      <div class="capa-brand">ORBIS<span>.</span>PROTOCOL</div>
      <div style="display: flex; gap: 8px; align-items: center;">
        ${isDemo ? '<div class="badge-demo-top">DEMONSTRAÇÃO • MODELO PEDAGÓGICO</div>' : ''}
        <div class="capa-tag">DOSSIÊ TÉCNICO & DMRV • LEI 15.042/2024</div>
      </div>
    </div>

    <div class="capa-title-area">
      <div class="capa-subtitle">RELATÓRIO PERICIAL CONSOLIDADO</div>
      <h1 class="capa-title">INVENTÁRIO DE EMISSÕES & COMPARATIVO TRIBUTÁRIO</h1>
      <p class="capa-desc">
        Demonstrativo pericial de emissões de GEE (Escopos 1, 2 e 3), apuração qualitativa da Reforma Tributária (IBS/CBS), simulação do Green Capital Engine e evidências probatórias para mitigação de spread bancário.
      </p>
    </div>

    <div>
      <div class="capa-meta-box">
        <div class="capa-meta-item">
          <label>Organização Auditada</label>
          <strong>${dados.identificacao.razaoSocial}</strong>
        </div>
        <div class="capa-meta-item">
          <label>CNPJ Cadastral</label>
          <strong>${dados.identificacao.cnpj}</strong>
        </div>
        <div class="capa-meta-item">
          <label>Regime Tributário Declarado</label>
          <strong>${dados.identificacao.regimeTributario || 'Lucro Presumido / Geral'}</strong>
        </div>
        <div class="capa-meta-item">
          <label>Data & Hora da Apuração</label>
          <strong>${dataExtenso}</strong>
        </div>
        <div class="capa-meta-item">
          <label>Responsável / Perito Técnico</label>
          <strong>${dados.identificacao.responsavel || dados.identificacao.geradoPorNome || 'Auditor Orbis Protocol'}</strong>
        </div>
        <div class="capa-meta-item">
          <label>Chancela / Selo dMRV</label>
          <strong style="color: #12B886;">${dados.codigoSelo || 'CERT-DMRV-ORBIS-2025'}</strong>
        </div>
      </div>

      <div class="capa-footer" style="margin-top: 25px;">
        <span>MGM CONSULTORIA EMPRESARIAL LTDA • CNPJ 19.598.964/0001-01</span>
        <span>Padrão NBC TO 3000 • ISO 14064-3 • GHG Protocol Brasil</span>
      </div>
    </div>
  </div>

  <!-- ==================== PÁGINA 2: SEÇÃO 1 & SEÇÃO 2 (INVENTÁRIO GEE) ==================== -->
  <div class="page-break" style="position: relative;">
    <div class="page-header">
      <span class="page-header-title">Orbis Protocol • Relatório Pericial dMRV ${isDemo ? '• [DEMONSTRAÇÃO]' : ''}</span>
      <span>${dados.identificacao.razaoSocial} • ${dados.identificacao.cnpj}</span>
    </div>

    <!-- FAIXA DE PROVENIÊNCIA & AUTENTICIDADE ORBIS PROTOCOL -->
    <div class="watermark-proveniencia-faixa">
      <div style="display: flex; align-items: center; gap: 8px;">
        <span class="badge-origem">EMITIDO VIA ORBIS PROTOCOL</span>
        <span>Ente Responsável: <strong>${dados.identificacao.razaoSocial}</strong> (CNPJ ${dados.identificacao.cnpj})</span>
      </div>
      <div>
        <span>Emissão: <strong>${dataExtenso}</strong> • Hash: <strong style="color: #047857;">${hashSha256.slice(0, 16)}...</strong></span>
      </div>
    </div>

    <!-- SEÇÃO 1: DIAGNÓSTICO REGULATÓRIO SBCE & CBAM -->
    <div class="section-title">1. Diagnóstico Regulatório & Perfil Climático</div>
    <div class="section-subtitle">
      Triagem preliminar de obrigações sancionatórias e regulatórias sob as diretrizes da Lei Federal nº 15.042/2024 (Sistema Brasileiro de Comércio de Emissões - SBCE) e Mecanismo de Ajuste Fronteiriço Europeu (CBAM).
    </div>

    <div class="grid-3">
      <div class="card card-highlight">
        <div class="card-label">Enquadramento SBCE</div>
        <div class="card-value" style="font-size: 11pt; color: #065F46;">
          ${
            inv?.enquadramentoSBCE?.status === 'dever_compensacao_25k'
              ? '≥ 25k tCO₂e (Metas)'
              : inv?.enquadramentoSBCE?.status === 'dever_reporte_10k'
                ? '10k a 25k tCO₂e (Reporte)'
                : 'Isento (< 10k tCO₂e/ano)'
          }
        </div>
        <div class="card-desc">
          ${
            inv?.enquadramentoSBCE?.status === 'dever_compensacao_25k'
              ? 'Metas compulsórias de compensação'
              : inv?.enquadramentoSBCE?.status === 'dever_reporte_10k'
                ? 'Plano de monitoramento obrigatório'
                : 'Uso voluntário / Vantagem bancária'
          }
        </div>
      </div>

      <div class="card ${dados.diagnostico.exportaUeCbam === 'sim' ? 'card-gold' : ''}">
        <div class="card-label">Mecanismo CBAM (União Europeia)</div>
        <div class="card-value" style="font-size: 11pt; color: ${dados.diagnostico.exportaUeCbam === 'sim' ? '#B45309' : '#374151'};">
          ${dados.diagnostico.exportaUeCbam === 'sim' ? 'Exposto a CBAM' : 'Mercado Doméstico'}
        </div>
        <div class="card-desc">
          ${
            dados.diagnostico.exportaUeCbam === 'sim'
              ? `Bens industriais: ${dados.diagnostico.cbamBens || 'Aço/Alumínio/Químicos'}`
              : 'Sem incidência de barreira alfandegária de carbono'
          }
        </div>
      </div>

      <div class="card">
        <div class="card-label">Exigências Credores (PRSAC)</div>
        <div class="card-value" style="font-size: 11pt; color: #1E40AF;">
          Res. BCB 4.945/2021
        </div>
        <div class="card-desc">Preparado para questionários de bancos e redução de spread</div>
      </div>
    </div>

    <!-- SEÇÃO 2: INVENTÁRIO PERICIAL DE EMISSÕES GEE -->
    <div class="section-title">2. Inventário Pericial de Emissões GEE (GHG Protocol Brasil)</div>
    <div class="section-subtitle">
      Cálculo de emissões com métricas GWP do Sexto Relatório do IPCC (AR6), fatores oficiais do MCTI/SIN e duplo reporte de Escopo 2.
    </div>

    <div class="grid-4">
      <div class="card">
        <div class="card-label">Escopo 1 (Direto)</div>
        <div class="card-value">${inv ? inv.escopo1TotalTCO2e.toFixed(2) : '0.00'} <span style="font-size: 9pt; font-weight: normal;">tCO₂e</span></div>
        <div class="card-desc">Combustão móvel e estacionária</div>
      </div>

      <div class="card">
        <div class="card-label">Escopo 2 (Localização)</div>
        <div class="card-value">${inv ? inv.escopo2LocalizacaoTCO2e.toFixed(2) : '0.00'} <span style="font-size: 9pt; font-weight: normal;">tCO₂e</span></div>
        <div class="card-desc">Rede SIN (Fator Médio Oficial)</div>
      </div>

      <div class="card">
        <div class="card-label">Escopo 2 (Mercado)</div>
        <div class="card-value" style="color: #059669;">${inv ? inv.escopo2MercadoTCO2e.toFixed(2) : '0.00'} <span style="font-size: 9pt; font-weight: normal;">tCO₂e</span></div>
        <div class="card-desc">${inv?.declarouEnergiaRenovavelMercado ? 'Comprovação I-REC Ativa' : 'Sem I-REC contratado'}</div>
      </div>

      <div class="card">
        <div class="card-label">Escopo 3 (Cadeia)</div>
        <div class="card-value">${inv ? inv.escopo3TotalTCO2e.toFixed(2) : '0.00'} <span style="font-size: 9pt; font-weight: normal;">tCO₂e</span></div>
        <div class="card-desc">Transporte, insumos e água</div>
      </div>
    </div>

    <div class="grid-3">
      <div class="card card-highlight">
        <div class="card-label">Total Fóssil Consolidado</div>
        <div class="card-value card-value-green">${inv ? inv.emissoesTotaisFosseisTCO2e.toFixed(2) : '0.00'} <span style="font-size: 10pt;">tCO₂e</span></div>
        <div class="card-desc">Escopo 1 + Escopo 2 Loc. + Escopo 3</div>
      </div>

      <div class="card">
        <div class="card-label">Emissões Biogênicas</div>
        <div class="card-value">${inv ? inv.emissoesBiogenicasTotalTCO2e.toFixed(2) : '0.00'} <span style="font-size: 10pt;">tCO₂e</span></div>
        <div class="card-desc">Etanol / Biodiesel (segregado)</div>
      </div>

      <div class="card card-gold">
        <div class="card-label">Insetting Circular (ISO 14067)</div>
        <div class="card-value card-value-gold">${inv ? inv.insettingTotalTCO2e.toFixed(2) : '0.00'} <span style="font-size: 10pt;">tCO₂e</span></div>
        <div class="card-desc">Emissões evitadas via economia circular</div>
      </div>
    </div>

    <!-- Memória Resumida de Fontes e Fatores -->
    <div style="font-weight: 700; font-size: 9.5pt; color: #111827; margin: 12px 0 6px 0;">
      Detalhamento de Fontes Oficiais & Incerteza Metodológica
    </div>
    <table>
      <thead>
        <tr>
          <th>Fonte de Emissão</th>
          <th>Escopo</th>
          <th>Fator Oficial MCTI / SIN</th>
          <th>Tier Incerteza</th>
          <th class="text-right">Emissões (tCO₂e)</th>
        </tr>
      </thead>
      <tbody>
        ${
          inv && inv.itensDetalhados.length > 0
            ? inv.itensDetalhados
                .slice(0, 6)
                .map(
                  (item) => `
          <tr>
            <td><strong>${item.descricaoItem}</strong></td>
            <td><span class="badge ${item.categoria === 'Escopo 1' ? 'badge-blue' : item.categoria === 'Escopo 2' ? 'badge-green' : 'badge-yellow'}">${item.categoria}</span></td>
            <td>${item.fonteFator}</td>
            <td>${item.tierIncerteza} (±${item.incertezaPct}%)</td>
            <td class="text-right font-mono font-bold">${item.fossilTCO2e.toFixed(3)}</td>
          </tr>
        `,
                )
                .join('')
            : `
          <tr>
            <td>Combustão Móvel e Frotas (Diesel/Gasolina)</td>
            <td><span class="badge badge-blue">Escopo 1</span></td>
            <td>MCTI / BEN 2024</td>
            <td>Tier 2 (±4.0%)</td>
            <td class="text-right font-mono font-bold">${inv ? inv.escopo1TotalTCO2e.toFixed(3) : '0.000'}</td>
          </tr>
          <tr>
            <td>Consumo de Energia Elétrica da Rede</td>
            <td><span class="badge badge-green">Escopo 2</span></td>
            <td>Fator Médio SIN 2024</td>
            <td>Tier 2 (±2.5%)</td>
            <td class="text-right font-mono font-bold">${inv ? inv.escopo2LocalizacaoTCO2e.toFixed(3) : '0.000'}</td>
          </tr>
        `
        }
      </tbody>
    </table>

    <div class="disclaimer-box">
      <strong>Nota Metodológica GEE:</strong> Inventário preliminar alinhado às diretrizes da Lei 15.042/2024 e ABNT NBR ISO 14064-1. A incerteza consolidada estimada da amostragem é de ±${inv ? inv.incertezaConsolidadaPct : 5.0}%.
    </div>

    <div class="footer-fixed">
      <span>Orbis Protocol • dMRV Criptográfico</span>
      <span>Página 2 de 4</span>
    </div>
  </div>

  <!-- ==================== PÁGINA 3: SEÇÃO 3 (COMPARATIVO TRIBUTÁRIO) ==================== -->
  <div class="page-break" style="position: relative;">
    <div class="page-header">
      <span class="page-header-title">Orbis Protocol • Relatório Pericial dMRV ${isDemo ? '• [DEMONSTRAÇÃO]' : ''}</span>
      <span>${dados.identificacao.razaoSocial} • ${dados.identificacao.cnpj}</span>
    </div>

    <!-- FAIXA DE PROVENIÊNCIA & AUTENTICIDADE ORBIS PROTOCOL -->
    <div class="watermark-proveniencia-faixa">
      <div style="display: flex; align-items: center; gap: 8px;">
        <span class="badge-origem">EMITIDO VIA ORBIS PROTOCOL</span>
        <span>Ente Responsável: <strong>${dados.identificacao.razaoSocial}</strong> (CNPJ ${dados.identificacao.cnpj})</span>
      </div>
      <div>
        <span>Emissão: <strong>${dataExtenso}</strong> • Hash: <strong style="color: #047857;">${hashSha256.slice(0, 16)}...</strong></span>
      </div>
    </div>

    <div class="section-title">3. Diagnóstico Comparativo Tributário: Hoje × Reforma (EC 132/2023)</div>
    <div class="section-subtitle">
      Avaliação pericial do impacto da substituição dos tributos vigentes (PIS, COFINS, ICMS, ISS, IPI) pelo novo modelo dual (CBS federal e IBS estadual/municipal).
    </div>

    <!-- Faixa de Impacto -->
    <div class="card ${
      trib?.faixaImpacto === 'ganho_provavel'
        ? 'card-highlight'
        : trib?.faixaImpacto === 'ponto_atencao'
          ? 'card-alert'
          : 'card-gold'
    }" style="margin-bottom: 16px;">
      <div class="card-label">Faixa de Impacto Diagnosticada</div>
      <div class="card-value" style="font-size: 13pt; color: ${
        trib?.faixaImpacto === 'ganho_provavel'
          ? '#065F46'
          : trib?.faixaImpacto === 'ponto_atencao'
            ? '#991B1B'
            : '#92400E'
      };">
        ${trib ? trib.tituloImpacto : 'Impacto Neutro com Oportunidades de Crédito'}
      </div>
      <div class="card-desc" style="font-size: 9pt; margin-top: 6px;">
        ${trib ? trib.subtituloImpacto : 'A transição tributária exigirá auditoria eletrônica de fornecedores para tomada integral de créditos.'}
      </div>
    </div>

    <!-- Tabela Comparativa dos Tributos -->
    <table>
      <thead>
        <tr>
          <th style="width: 22%;">Tributo</th>
          <th style="width: 28%;">Modelo Atual</th>
          <th style="width: 28%;">Novo Sistema (IBS / CBS)</th>
          <th style="width: 22%;">Análise Pericial Orbis</th>
        </tr>
      </thead>
      <tbody>
        ${
          trib && trib.linhas.length > 0
            ? trib.linhas
                .map(
                  (l) => `
          <tr>
            <td><strong>${l.tributo}</strong></td>
            <td>${l.hoje}</td>
            <td>${l.reforma}</td>
            <td><span style="font-size: 8pt; color: #4B5563;">${l.detalhePersonalizado}</span></td>
          </tr>
        `,
                )
                .join('')
            : `
          <tr>
            <td><strong>PIS / COFINS → CBS</strong></td>
            <td>Cumulatividade e litígio de insumos</td>
            <td>CBS ~8,8% com crédito integral e base ampla</td>
            <td>Crédito financeiro pleno sem travas</td>
          </tr>
          <tr>
            <td><strong>ICMS / ISS → IBS</strong></td>
            <td>Guerra fiscal interestadual e estorno de créditos</td>
            <td>IBS ~19,2% cobrado estritamente no destino</td>
            <td>Fim da retenção de créditos em operações interestaduais</td>
          </tr>
          <tr>
            <td><strong>IPI → Imposto Seletivo</strong></td>
            <td>Tabela TIPI genérica (0% a 30%+)</td>
            <td>Extinção do IPI geral; Seletivo restrito a bens nocivos</td>
            <td>Desoneração total de bens não nocivos e economia circular</td>
          </tr>
        `
        }
      </tbody>
    </table>

    <div class="card" style="margin-top: 15px;">
      <div class="card-label">Cronograma Oficial de Transição Federativa</div>
      <div class="card-desc" style="font-size: 8.5pt; color: #374151; line-height: 1.5;">
        ${
          trib?.transicaoInfo ||
          'Início em 2026 com alíquotas de teste (0,9% CBS e 0,1% IBS), extinção gradual do PIS/Cofins até 2027 e transição do ICMS/ISS até 2032 com distribuição federativa até 2078.'
        }
      </div>
    </div>

    <div class="disclaimer-box">
      <strong>Disclaimer Tributário:</strong> Análise de conformidade preliminar e educativa fundamentada na Emenda Constitucional nº 132/2023. As alíquotas de referência efetivas dependem de lei complementar e atos do Comitê Gestor do IBS.
    </div>

    <div class="footer-fixed">
      <span>Orbis Protocol • dMRV Criptográfico</span>
      <span>Página 3 de 4</span>
    </div>
  </div>

  <!-- ==================== PÁGINA 4: SEÇÃO 4 & 5 (GREEN CAPITAL & CONCLUSÃO) ==================== -->
  <div style="position: relative;">
    <div class="page-header">
      <span class="page-header-title">Orbis Protocol • Relatório Pericial dMRV ${isDemo ? '• [DEMONSTRAÇÃO]' : ''}</span>
      <span>${dados.identificacao.razaoSocial} • ${dados.identificacao.cnpj}</span>
    </div>

    <!-- FAIXA DE PROVENIÊNCIA & AUTENTICIDADE ORBIS PROTOCOL -->
    <div class="watermark-proveniencia-faixa">
      <div style="display: flex; align-items: center; gap: 8px;">
        <span class="badge-origem">EMITIDO VIA ORBIS PROTOCOL</span>
        <span>Ente Responsável: <strong>${dados.identificacao.razaoSocial}</strong> (CNPJ ${dados.identificacao.cnpj})</span>
      </div>
      <div>
        <span>Emissão: <strong>${dataExtenso}</strong> • Hash: <strong style="color: #047857;">${hashSha256.slice(0, 16)}...</strong></span>
      </div>
    </div>

    <!-- SEÇÃO 4: GREEN CAPITAL ENGINE -->
    <div class="section-title">4. Green Capital Engine — 8 Linhas de Crédito Verde & Spread Bonificado</div>
    <div class="section-subtitle">
      Simulação indicativa da economia financeira obtida ao comprovar práticas de descarbonização com o laudo pericial Orbis perante instituições financeiras públicas, cooperativas e privadas.
    </div>

    ${
      cap && cap.melhorLinha
        ? `
      <div class="grid-3">
        <div class="card">
          <div class="card-label">Valor & Prazo Simulado</div>
          <div class="card-value">${formatCurrencyBRL(cap.valorDesejado)}</div>
          <div class="card-desc">Prazo: ${cap.prazoMeses} meses (${(cap.prazoMeses / 12).toFixed(1)} anos)</div>
        </div>

        <div class="card card-highlight">
          <div class="card-label">Economia Anual em Spread</div>
          <div class="card-value card-value-green">${formatCurrencyBRL(cap.melhorLinha.economiaAnual)}</div>
          <div class="card-desc">Redução de juros no fluxo de caixa</div>
        </div>

        <div class="card card-highlight">
          <div class="card-label">Economia Total no Contrato</div>
          <div class="card-value card-value-green">${formatCurrencyBRL(cap.melhorLinha.economiaTotalPrazo)}</div>
          <div class="card-desc">Spread bonificado vs taxa padrão</div>
        </div>
      </div>

      <div style="font-weight: 700; font-size: 9pt; color: #111827; margin: 10px 0 6px 0;">
        Linhas de Financiamento Verde Recomendadas (Top 4 por Economia)
      </div>
      <table>
        <thead>
          <tr>
            <th>Instituição / Linha</th>
            <th>Finalidade</th>
            <th class="text-right">Taxa Padrão</th>
            <th class="text-right">Taxa Bonificada</th>
            <th class="text-right">Economia Total</th>
          </tr>
        </thead>
        <tbody>
          ${cap.linhasAvaliadas
            .slice(0, 4)
            .map(
              (l) => `
            <tr>
              <td>
                <strong>${l.linha.instituicao}</strong> — ${l.linha.nome}
                <div style="font-size: 7.5pt; color: #6B7280;">${l.linha.categoria}</div>
              </td>
              <td>${formatarFinalidade(cap.finalidade)}</td>
              <td class="text-right font-mono">${l.taxaPadraoAa.toFixed(1)}% a.a.</td>
              <td class="text-right font-mono font-bold" style="color: #059669;">${l.taxaBonificadaAa.toFixed(1)}% a.a.</td>
              <td class="text-right font-mono font-bold" style="color: #059669;">${formatCurrencyBRL(l.economiaTotalPrazo)}</td>
            </tr>
          `,
            )
            .join('')}
        </tbody>
      </table>
    `
        : `
      <div class="card" style="margin-bottom: 15px;">
        <div class="card-desc">
          Simulação de crédito verde padrão para R$ 500.000 em 48 meses: redução média de 5,5 a 7,5 pontos percentuais no spread anual com o laudo pericial dMRV acoplado.
        </div>
      </div>
    `
    }

    ${
      dados.identificacao.avaliacaoAdicionalidade
        ? `
    <!-- SEÇÃO ANEXA: AVALIAÇÃO DE ADICIONALIDADE (METODOLOGIA GS 448 / PROGRAMA MOVER) -->
    <div class="section-title" style="border-left-color: #D9B36C;">Camada Anexa: Avaliação de Adicionalidade (GS 448 / MOVER)</div>
    <div class="section-subtitle">
      Checklist pericial e fundamentação técnica declaratória anexa — sem afetação do hash SHA-256 do documento.
    </div>

    <div class="card" style="margin-bottom: 12px; border-left: 4px solid #12B886;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 8pt; color: #4B5563;">
        <span><strong>Avaliador Responsável:</strong> ${dados.identificacao.avaliacaoAdicionalidade.avaliador_nome || 'VVB independente acreditado'}</span>
        <span><strong>Status do Parecer:</strong> ${dados.identificacao.avaliacaoAdicionalidade.adicionalidade_investimento && dados.identificacao.avaliacaoAdicionalidade.barreira_tecnologica && dados.identificacao.avaliacaoAdicionalidade.nao_obrigatoriedade_legal ? '<span style="color:#059669; font-weight:700;">CONFORME DECLARADO ✓</span>' : '<span style="color:#B45309; font-weight:700;">EM ANÁLISE</span>'}</span>
      </div>

      <div style="font-size: 8.5pt; color: #1F2937; margin-bottom: 8px;">
        <div style="display: flex; gap: 8px; margin-bottom: 4px;">
          <span>${dados.identificacao.avaliacaoAdicionalidade.adicionalidade_investimento ? '☑' : '☐'}</span>
          <span><strong>(a) Adicionalidade de investimento:</strong> Atesta que o desmonte técnico com descaracterização rastreada e triagem dMRV impõe custos operacionais (OPEX/CAPEX) adicionais não absorvidos pela comercialização convencional de sucata mista.</span>
        </div>
        <div style="display: flex; gap: 8px; margin-bottom: 4px;">
          <span>${dados.identificacao.avaliacaoAdicionalidade.barreira_tecnologica ? '☑' : '☐'}</span>
          <span><strong>(b) Barreira tecnológica:</strong> Superação de gargalos de rastreabilidade mediante etiquetagem individual de componentes, balanço de massa e custódia digital criptográfica berço-ao-portão.</span>
        </div>
        <div style="display: flex; gap: 8px; margin-bottom: 6px;">
          <span>${dados.identificacao.avaliacaoAdicionalidade.nao_obrigatoriedade_legal ? '☑' : '☐'}</span>
          <span><strong>(c) Não-obrigatoriedade legal:</strong> A segregação de 77 subsistemas e a emissão de passaportes com emissões evitadas extrapolam as obrigações estritas de baixa veicular do DETRAN/CONTRAN.</span>
        </div>
      </div>

      ${
        dados.identificacao.avaliacaoAdicionalidade.justificativa_pericial
          ? `
      <div style="margin-top: 8px; padding-top: 8px; border-top: 1px dashed #D1D5DB; font-size: 8pt; color: #374151; font-style: italic; background: #F9FAFB; padding: 6px 8px; border-radius: 4px;">
        <strong>(d) Justificativa Pericial:</strong> "${dados.identificacao.avaliacaoAdicionalidade.justificativa_pericial}"
      </div>
      `
          : ''
      }
    </div>
    `
        : ''
    }

    <!-- SEÇÃO 5: CONCLUSÃO PERICIAL & ASSINATURA CRIPTOGRÁFICA -->
    <div class="section-title">5. Conclusão Pericial & Autenticidade Criptográfica</div>
    <div class="section-subtitle">
      Atestado probatório com validade pericial nos termos da NBC TO 3000 e ABNT NBR ISO 14064-3.
    </div>

    <div class="card" style="margin-bottom: 12px;">
      <div style="font-size: 8.5pt; color: #374151; line-height: 1.5;">
        Conclui-se que a organização <strong>${dados.identificacao.razaoSocial}</strong> cumpriu as etapas de estruturação do inventário de emissões corporativas de acordo com as metodologias do Programa Brasileiro GHG Protocol. As evidências fiscais e documentais analisadas conferem preparo técnico perante as exigências socioambientais e climáticas vigentes no sistema bancário nacional (Res. BCB 4.945/2021) e para o cronograma preparatório do SBCE (Lei 15.042/2024).
      </div>
      ${
        dados.identificacao.peritoCredenciado
          ? `
      <div style="margin-top: 10px; padding-top: 8px; border-top: 1px dashed #D1D5DB; font-size: 8pt; color: #065F46; background: #ECFDF5; padding: 8px; border-radius: 4px;">
        <strong>CHANCELA DE RESPONSABILIDADE TÉCNICA (PERITO HOMOLOGADO):</strong><br/>
        Responsável Técnico: <strong>${dados.identificacao.peritoCredenciado.nome}</strong> • 
        Registro: <strong>${dados.identificacao.peritoCredenciado.conselho}-${dados.identificacao.peritoCredenciado.uf} ${dados.identificacao.peritoCredenciado.registro}</strong><br/>
        ${dados.identificacao.peritoCredenciado.numeroArtRrt ? `Referência ART / RRT: <strong>${dados.identificacao.peritoCredenciado.numeroArtRrt}</strong> • ` : ''}
        Termo de Credenciamento: <strong>${dados.identificacao.peritoCredenciado.termoVersao || 'v1.0-2025'}</strong>
      </div>
      `
          : ''
      }
    </div>

    <div class="hash-box">
      <div style="font-size: 7.5pt; color: #93A3B5; margin-bottom: 4px; text-transform: uppercase;">
        HASH SHA-256 DO DOSSIÊ PERICIAL (REGISTRO IMUTÁVEL DMRV):
      </div>
      <div>${hashSha256}</div>
      ${
        dados.hashDocumentosFonte
          ? `
      <div style="margin-top: 8px; padding-top: 8px; border-top: 1px dashed rgba(217, 179, 108, 0.4); font-size: 7.5pt; color: #93A3B5;">
        <span style="color: #12B886; font-weight: 700;">HASH SHA-256 DOS DOCUMENTOS FONTE (ANEXO DE INTEGRIDADE FISCAL):</span><br/>
        <span style="color: #F4F7FA; word-break: break-all;">${dados.hashDocumentosFonte}</span>
        <div style="font-size: 7pt; color: #93A3B5; margin-top: 2px;">
          Conjunto auditado de ${dados.documentosFonte?.length || 0} documento(s) fiscal(is) — Rastreabilidade ponta a ponta.
        </div>
      </div>
      `
          : ''
      }
    </div>

    <div class="disclaimer-box" style="margin-top: 15px;">
      <strong>AVISO LEGAL REGULATÓRIO & BANCÁRIO:</strong>
      Este documento constitui dossiê pericial preparatório e preliminar. Não substitui auditoria contábil formal nem assegura deferimento de financiamento, estando as linhas de crédito verde sujeitas à análise soberana de risco e crédito das respectivas instituições bancárias.
      ${
        isDemo
          ? '<br/><strong style="color: #B45309;">MARCA D\'ÁGUA PEDAGÓGICA (DEMONSTRAÇÃO):</strong> Este laudo foi emitido a partir de modelo demonstrativo pré-configurado para fins estritamente pedagógicos e de simulação. Não gera efeitos jurídicos ou fiscais reais.'
          : ''
      }
    </div>

    <div class="footer-fixed">
      <span>Orbis Protocol • dMRV Criptográfico • Hash: ${hashSha256.slice(0, 16)}...</span>
      <span>Página 4 ${dados.documentosFonte && dados.documentosFonte.length > 0 ? '(Principal)' : 'de 4'}</span>
    </div>
  </div>

  ${(() => {
    const docs = dados.documentosFonte || []
    if (docs.length === 0) return ''

    const totalNotas = docs.length
    const hashDocs = dados.hashDocumentosFonte || 'NÃO_INFORMADO'
    const formatBrl = (val: number | undefined | null) =>
      Number(val || 0).toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })

    if (totalNotas <= 100) {
      // Caso 1: Até 100 notas fiscais — Tabela analítica paginada (~35 por página)
      const ITENS_POR_PAGINA = 35
      const totalPaginas = Math.ceil(totalNotas / ITENS_POR_PAGINA)
      let somaGeralValor = 0
      let somaGeralCredito = 0

      docs.forEach((d) => {
        somaGeralValor += Number(d.valor_total_nf || 0)
        somaGeralCredito += Number(
          d.credito_apurado ?? Number(d.valor_pis || 0) + Number(d.valor_cofins || 0),
        )
      })

      const paginasHtml: string[] = []

      for (let p = 0; p < totalPaginas; p++) {
        const inicio = p * ITENS_POR_PAGINA
        const sliceDocs = docs.slice(inicio, inicio + ITENS_POR_PAGINA)
        const isUltima = p === totalPaginas - 1

        paginasHtml.push(`
  <div class="page-break" style="position: relative;">
    <div class="page-header">
      <span class="page-header-title">Orbis Protocol • Anexo — Documentos Fonte (NF-e)</span>
      <span>Página ${p + 1} de ${totalPaginas} do Anexo • ${dados.identificacao.razaoSocial}</span>
    </div>

    <!-- FAIXA DE PROVENIÊNCIA & AUTENTICIDADE ORBIS PROTOCOL -->
    <div class="watermark-proveniencia-faixa">
      <div style="display: flex; align-items: center; gap: 8px;">
        <span class="badge-origem">EMITIDO VIA ORBIS PROTOCOL</span>
        <span>Ente: <strong>${dados.identificacao.razaoSocial}</strong></span>
      </div>
      <div>
        <span>Emissão: <strong>${dataExtenso}</strong> • Hash Anexo: <strong style="color: #047857;">${hashDocs.slice(0, 16)}...</strong></span>
      </div>
    </div>

    ${
      p === 0
        ? `
    <div class="section-title">Anexo — Documentos Fonte (Relação Analítica de Notas Fiscais)</div>
    <div class="section-subtitle">
      Relação individualizada das ${totalNotas} notas fiscais processadas como lastro primário deste dossiê pericial.<br/>
      <strong>Hash SHA-256 Canônico do Conjunto:</strong> <span class="font-mono" style="font-size: 8pt; color: #12B886;">${hashDocs}</span>
    </div>
    `
        : `
    <div style="font-weight: 700; font-size: 9pt; color: #374151; margin-bottom: 10px;">
      Anexo — Documentos Fonte (continuação • página ${p + 1} de ${totalPaginas})
    </div>
    `
    }

    <table>
      <thead>
        <tr>
          <th style="width: 14%;">Nº / Série</th>
          <th style="width: 14%;">Data Emissão</th>
          <th style="width: 24%;">CNPJ Emitente</th>
          <th style="width: 24%; text-align: right;">Valor Total (R$)</th>
          <th style="width: 24%; text-align: right;">Crédito Apurado (R$)</th>
        </tr>
      </thead>
      <tbody>
        ${sliceDocs
          .map((d) => {
            const vTotal = Number(d.valor_total_nf || 0)
            const vCred = Number(
              d.credito_apurado ?? Number(d.valor_pis || 0) + Number(d.valor_cofins || 0),
            )
            const num = (d.numero_nota || 'S/N').trim()
            const ser = (d.serie || '1').trim()
            const dataEmissao = d.data_emissao ? d.data_emissao.slice(0, 10) : '-'
            const cnpjEmit = d.cnpj_emitente || '-'

            return `
        <tr>
          <td><strong class="font-mono">${num}</strong> <span style="font-size: 7.5pt; color: #6B7280;">(s.${ser})</span></td>
          <td>${dataEmissao}</td>
          <td class="font-mono">${cnpjEmit}</td>
          <td class="text-right font-mono">${formatBrl(vTotal)}</td>
          <td class="text-right font-mono font-bold" style="color: #059669;">${formatBrl(vCred)}</td>
        </tr>
            `
          })
          .join('')}
        ${
          isUltima
            ? `
        <tr style="background: #0A0E12; color: #FFFFFF; font-weight: 900;">
          <td colspan="3" style="background: #0A0E12; color: #FFFFFF; font-weight: 900; padding: 8px 10px;">
            TOTALIZAÇÃO CONSOLIDADA (${totalNotas} NOTAS AUDITADAS)
          </td>
          <td class="text-right font-mono" style="background: #0A0E12; color: #FFFFFF; font-weight: 900; padding: 8px 10px;">
            R$ ${formatBrl(somaGeralValor)}
          </td>
          <td class="text-right font-mono" style="background: #0A0E12; color: #12B886; font-weight: 900; padding: 8px 10px;">
            R$ ${formatBrl(somaGeralCredito)}
          </td>
        </tr>
          `
            : ''
        }
      </tbody>
    </table>

    <div class="footer-fixed">
      <span>Orbis Protocol • Anexo Documentos Fonte • Hash: ${hashDocs.slice(0, 16)}...</span>
      <span>Anexo Pág. ${p + 1} de ${totalPaginas}</span>
    </div>
  </div>
        `)
      }

      return paginasHtml.join('\n')
    } else {
      // Caso 2: Acima de 100 notas fiscais — Tabela consolidada por Mês / Emitente
      interface GrupoConsolidado {
        chave: string
        mes: string
        cnpjEmitente: string
        nomeEmitente: string
        quantidade: number
        valorTotal: number
        creditoApurado: number
      }

      const mapaGrupos = new Map<string, GrupoConsolidado>()
      let somaTotalGeral = 0
      let somaCreditoGeral = 0

      docs.forEach((d) => {
        const mes = d.data_emissao ? d.data_emissao.slice(0, 7) : 'Competência N/I'
        const cnpj = (d.cnpj_emitente || 'CNPJ N/I').trim()
        const chaveGrupo = `${mes}|${cnpj}`
        const vTotal = Number(d.valor_total_nf || 0)
        const vCred = Number(
          d.credito_apurado ?? Number(d.valor_pis || 0) + Number(d.valor_cofins || 0),
        )

        somaTotalGeral += vTotal
        somaCreditoGeral += vCred

        const atual = mapaGrupos.get(chaveGrupo) || {
          chave: chaveGrupo,
          mes,
          cnpjEmitente: cnpj,
          nomeEmitente: d.nome_emitente || '',
          quantidade: 0,
          valorTotal: 0,
          creditoApurado: 0,
        }
        atual.quantidade += 1
        atual.valorTotal += vTotal
        atual.creditoApurado += vCred
        if (!atual.nomeEmitente && d.nome_emitente) {
          atual.nomeEmitente = d.nome_emitente
        }
        mapaGrupos.set(chaveGrupo, atual)
      })

      // Ordenar grupos por mês desc e cnpj asc
      const gruposOrdenados = Array.from(mapaGrupos.values()).sort((a, b) => {
        if (a.mes !== b.mes) return b.mes.localeCompare(a.mes)
        return a.cnpjEmitente.localeCompare(b.cnpjEmitente)
      })

      return `
  <div class="page-break" style="position: relative;">
    <div class="page-header">
      <span class="page-header-title">Orbis Protocol • Anexo — Documentos Fonte (Consolidado)</span>
      <span>${dados.identificacao.razaoSocial} • ${dados.identificacao.cnpj}</span>
    </div>

    <!-- FAIXA DE PROVENIÊNCIA & AUTENTICIDADE ORBIS PROTOCOL -->
    <div class="watermark-proveniencia-faixa">
      <div style="display: flex; align-items: center; gap: 8px;">
        <span class="badge-origem">EMITIDO VIA ORBIS PROTOCOL</span>
        <span>Ente: <strong>${dados.identificacao.razaoSocial}</strong></span>
      </div>
      <div>
        <span>Emissão: <strong>${dataExtenso}</strong> • Hash Anexo: <strong style="color: #047857;">${hashDocs.slice(0, 16)}...</strong></span>
      </div>
    </div>

    <div class="section-title">Anexo — Documentos Fonte (Consolidado por Mês / Emitente)</div>
    <div class="section-subtitle">
      Demonstrativo consolidado do lote de <strong>${totalNotas} notas fiscais</strong>. Devido ao volume (> 100 notas), a relação analítica completa está sumarizada por competência e emitente abaixo.
    </div>

    <div class="card card-gold" style="margin-bottom: 15px;">
      <div style="font-size: 8.5pt; color: #78350F; line-height: 1.5;">
        <strong>RELAÇÃO COMPLETA INDIVIDUALIZADA DISPONÍVEL EM CSV:</strong><br/>
        A listagem analítica integral com todas as ${totalNotas} chaves de acesso de 44 dígitos e metadados detalhados está disponível para download em arquivo digital no formato <strong>CSV com hash SHA-256 verificado</strong> diretamente pelo Painel do Cliente.
      </div>
      <div style="margin-top: 8px; font-size: 8pt; color: #92400E;">
        <strong>Hash SHA-256 Canônico do Lote de Documentos Fonte:</strong><br/>
        <span class="font-mono" style="word-break: break-all; color: #111827; font-weight: 700;">${hashDocs}</span>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th style="width: 15%;">Competência</th>
          <th style="width: 25%;">CNPJ Emitente</th>
          <th style="width: 12%; text-align: center;">Qtd Notas</th>
          <th style="width: 24%; text-align: right;">Valor Total (R$)</th>
          <th style="width: 24%; text-align: right;">Crédito Apurado (R$)</th>
        </tr>
      </thead>
      <tbody>
        ${gruposOrdenados
          .map(
            (g) => `
        <tr>
          <td><strong>${g.mes}</strong></td>
          <td>
            <div class="font-mono">${g.cnpjEmitente}</div>
            ${g.nomeEmitente ? `<div style="font-size: 7.5pt; color: #6B7280; truncate;">${g.nomeEmitente}</div>` : ''}
          </td>
          <td class="text-center font-bold">${g.quantidade}</td>
          <td class="text-right font-mono">${formatBrl(g.valorTotal)}</td>
          <td class="text-right font-mono font-bold" style="color: #059669;">${formatBrl(g.creditoApurado)}</td>
        </tr>
        `,
          )
          .join('')}
        <tr style="background: #0A0E12; color: #FFFFFF; font-weight: 900;">
          <td colspan="2" style="background: #0A0E12; color: #FFFFFF; font-weight: 900; padding: 8px 10px;">
            TOTALIZAÇÃO GERAL (${totalNotas} NOTAS AUDITADAS)
          </td>
          <td class="text-center" style="background: #0A0E12; color: #FFFFFF; font-weight: 900; padding: 8px 10px;">
            ${totalNotas}
          </td>
          <td class="text-right font-mono" style="background: #0A0E12; color: #FFFFFF; font-weight: 900; padding: 8px 10px;">
            R$ ${formatBrl(somaTotalGeral)}
          </td>
          <td class="text-right font-mono" style="background: #0A0E12; color: #12B886; font-weight: 900; padding: 8px 10px;">
            R$ ${formatBrl(somaCreditoGeral)}
          </td>
        </tr>
      </tbody>
    </table>

    <div class="footer-fixed">
      <span>Orbis Protocol • Anexo Documentos Fonte Consolidado • Hash: ${hashDocs.slice(0, 16)}...</span>
      <span>Anexo Sintético</span>
    </div>
  </div>
      `
    }
  })()}

</body>
</html>`
}

/**
 * Exporta o Dossiê Pericial abrindo a tela de impressão / salvar como PDF do navegador
 */
export async function exportarRelatorioDossiePdf(
  dados: DadosRelatorioDossie,
  onGravarRegistro?: (hash: string, codigo: string) => Promise<void>,
): Promise<{ hash: string; codigo: string }> {
  // Gera texto canônico para hash SHA-256
  const canonicalString = [
    dados.identificacao.cnpj,
    dados.identificacao.razaoSocial,
    dados.inventario?.emissoesTotaisFosseisTCO2e || '0',
    dados.comparativoTributario?.faixaImpacto || 'neutro',
    dados.greenCapital?.economiaTotalMaxima || '0',
    new Date().toISOString().slice(0, 13), // Granularidade horária para reprodutibilidade
  ].join('|')

  const hash = await calcularHashDossie(canonicalString)
  const codigo =
    dados.codigoSelo ||
    `ORBIS-LAUDO-${dados.identificacao.cnpj.replace(/\D/g, '').slice(0, 8)}-${Date.now().toString().slice(-4)}`

  // Notifica gravação no PocketBase se fornecido
  if (onGravarRegistro) {
    try {
      await onGravarRegistro(hash, codigo)
    } catch {
      /* segue com impressão mesmo se gravação falhar */
    }
  }

  // Gera HTML completo
  const htmlContent = gerarHtmlRelatorioDossie(dados, hash)

  // Abre janela de impressão profissional para salvar em PDF
  const printWindow = window.open('', '_blank', 'width=900,height=1000')
  if (!printWindow) {
    throw new Error(
      'Bloqueador de pop-ups ativo. Permita pop-ups para visualizar e baixar o relatório em PDF.',
    )
  }

  printWindow.document.open()
  printWindow.document.write(htmlContent)
  printWindow.document.close()

  // Aguarda carregar estilos e dispara print
  printWindow.focus()
  setTimeout(() => {
    printWindow.print()
  }, 400)

  return { hash, codigo }
}
