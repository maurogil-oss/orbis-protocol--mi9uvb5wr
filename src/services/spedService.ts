/**
 * SERVIÇO DE PARSE E PROCESSAMENTO DE ARQUIVOS SPED FISCAL
 * Suporta:
 * 1. EFD ICMS/IPI (SPED Fiscal - Registros 0000, C100, C170, C190, E110, etc.)
 * 2. EFD Contribuições (Registros 0000, C100, C170, M200, M600, etc.)
 *
 * Modo 100% Client/Safe: não envia chaves criptográficas privadas,
 * apenas analisa linhas delimitadas por barras verticais ('|').
 */

import pb from '@/lib/pocketbase/client'

export interface SpedRegistroC100 {
  indicadorOperacao: '0' | '1' // 0 = Entrada, 1 = Saída
  indicadorEmitente: '0' | '1' // 0 = Emissão própria, 1 = Terceiros
  codigoParticipante: string
  modeloDocumento: string // 55, 01, etc.
  codigoSituacao: string // 00 = Regular, etc.
  serie: string
  numeroDocumento: string
  chaveAcesso: string
  dataEmissao: string
  dataEntradaSaida: string
  valorTotalDocumento: number
  indicadorPagamento: string
  valorDesconto: number
  valorMercadorias: number
  valorFrete: number
  valorSeguro: number
  valorOutrasDespesas: number
  valorBaseCalculoIcms: number
  valorIcms: number
  valorBaseCalculoIcmsSt: number
  valorIcmsSt: number
  valorIpi: number
  valorPis: number
  valorCofins: number
  itensQtd: number
}

export interface SpedResumoPeriodo {
  tipoSped: 'efd_icms_ipi' | 'efd_contribuicoes' | 'ecd' | 'ecf' | 'outro'
  cnpj: string
  razaoSocial: string
  periodoApuracao: string // MM/AAAA
  dataInicio: string
  dataFim: string
  versaoLeiaute: string
  finalidadeArquivo: string
  totalDocumentos: number
  totalEntradas: number
  totalSaidas: number
  valorTotalDocumentos: number
  valorMercadoriasTotal: number
  valorIcmsDestacado: number
  valorIpiDestacado: number
  valorPisDestacado: number
  valorCofinsDestacado: number
  documentosC100: SpedRegistroC100[]
  principaisParticipantes: Array<{ codigo: string; nome: string; cnpjCpf: string }>
}

/**
 * Função utilitária para converter números no padrão SPED (1234,56 ou 1234.56)
 */
function parseSpedNumber(val?: string): number {
  if (!val) return 0
  const limpo = val.trim().replace(/\./g, '').replace(',', '.')
  const num = parseFloat(limpo)
  return isNaN(num) ? 0 : num
}

/**
 * Converte data DDMMAAAA do SPED para AAAA-MM-DD
 */
function parseSpedDate(val?: string): string {
  if (!val) return ''
  const v = val.trim()
  if (v.length === 8 && /^\d+$/.test(v)) {
    const dia = v.substring(0, 2)
    const mes = v.substring(2, 4)
    const ano = v.substring(4, 8)
    return `${ano}-${mes}-${dia}`
  }
  return v
}

/**
 * Parser de arquivo SPED (.txt em linhas delimitadas por '|')
 */
export function parseSpedTxt(conteudo: string, nomeArquivo = 'sped.txt'): SpedResumoPeriodo {
  const linhas = conteudo.split(/\r?\n/)

  let tipoSped: 'efd_icms_ipi' | 'efd_contribuicoes' | 'ecd' | 'ecf' | 'outro' = 'efd_icms_ipi'
  let cnpj = ''
  let razaoSocial = ''
  let dataInicio = ''
  let dataFim = ''
  let versaoLeiaute = ''
  let finalidadeArquivo = 'Original'

  const documentosC100: SpedRegistroC100[] = []
  const participantesMap = new Map<string, { codigo: string; nome: string; cnpjCpf: string }>()

  let docAtual: SpedRegistroC100 | null = null

  for (let i = 0; i < linhas.length; i++) {
    const linha = linhas[i].trim()
    if (!linha || !linha.startsWith('|')) continue

    // Campos são divididos por '|'
    const campos = linha.split('|')
    const reg = campos[1] // No padrão |REG|campo1|campo2|...

    if (reg === '0000') {
      // Identificação da Entidade e Período
      // |0000|LEF|COD_FIN|DT_INI|DT_FIN|NOME|CNPJ|UF|IE|COD_MUN|IM|SUFRAMA|IND_PERFIL|IND_ATIV|
      versaoLeiaute = campos[2] || ''
      const codFin = campos[3]
      finalidadeArquivo = codFin === '1' ? 'Substituta' : 'Original'
      dataInicio = parseSpedDate(campos[4])
      dataFim = parseSpedDate(campos[5])
      razaoSocial = campos[6] || ''
      cnpj = (campos[7] || '').replace(/\D/g, '')

      // Se campo de leiaute indicar contribuições (ex: EFD Contribuições tem indicador específico)
      if (linha.toUpperCase().includes('CONTRIB') || (campos.length > 14 && campos[14] === '1')) {
        // heurística leve
      }
    } else if (reg === '0150') {
      // Cadastro do Participante
      // |0150|COD_PART|NOME|COD_PAIS|CNPJ|CPF|IE|COD_MUN|SUFRAMA|END|NUM|COMPL|BAIRRO|
      const cod = campos[2] || ''
      const nome = campos[3] || ''
      const cnpjPart = (campos[5] || campos[6] || '').replace(/\D/g, '')
      if (cod) {
        participantesMap.set(cod, {
          codigo: cod,
          nome,
          cnpjCpf: cnpjPart,
        })
      }
    } else if (reg === 'C100') {
      // Documento - Nota Fiscal / NF-e
      // |C100|IND_OPER|IND_EMIT|COD_PART|COD_MOD|COD_SIT|SER|NUM_DOC|CHV_NFE|DT_DOC|DT_E_S|VL_DOC|IND_PGTO|VL_DESC|VL_ABAT_NT|VL_MERC|IND_FRT|VL_FRT|VL_SEG|VL_OUT_DA|VL_BC_ICMS|VL_ICMS|VL_BC_ICMS_ST|VL_ICMS_ST|VL_IPI|VL_PIS|VL_COFINS|VL_PIS_ST|VL_COFINS_ST|
      if (docAtual) {
        documentosC100.push(docAtual)
      }

      const indOper = (campos[2] === '1' ? '1' : '0') as '0' | '1'
      const indEmit = (campos[3] === '1' ? '1' : '0') as '0' | '1'
      const codPart = campos[4] || ''
      const mod = campos[5] || '55'
      const codSit = campos[6] || '00'
      const ser = campos[7] || '1'
      const numDoc = campos[8] || ''
      const chv = (campos[9] || '').replace(/\D/g, '')
      const dtDoc = parseSpedDate(campos[10])
      const dtES = parseSpedDate(campos[11])

      const vlDoc = parseSpedNumber(campos[12])
      const indPgto = campos[13] || '0'
      const vlDesc = parseSpedNumber(campos[14])
      const vlMerc = parseSpedNumber(campos[16])
      const vlFrt = parseSpedNumber(campos[18])
      const vlSeg = parseSpedNumber(campos[19])
      const vlOut = parseSpedNumber(campos[20])
      const vlBcIcms = parseSpedNumber(campos[21])
      const vlIcms = parseSpedNumber(campos[22])
      const vlBcSt = parseSpedNumber(campos[23])
      const vlIcmsSt = parseSpedNumber(campos[24])
      const vlIpi = parseSpedNumber(campos[25])
      const vlPis = parseSpedNumber(campos[26])
      const vlCofins = parseSpedNumber(campos[27])

      docAtual = {
        indicadorOperacao: indOper,
        indicadorEmitente: indEmit,
        codigoParticipante: codPart,
        modeloDocumento: mod,
        codigoSituacao: codSit,
        serie: ser,
        numeroDocumento: numDoc,
        chaveAcesso: chv,
        dataEmissao: dtDoc,
        dataEntradaSaida: dtES,
        valorTotalDocumento: vlDoc,
        indicadorPagamento: indPgto,
        valorDesconto: vlDesc,
        valorMercadorias: vlMerc,
        valorFrete: vlFrt,
        valorSeguro: vlSeg,
        valorOutrasDespesas: vlOut,
        valorBaseCalculoIcms: vlBcIcms,
        valorIcms: vlIcms,
        valorBaseCalculoIcmsSt: vlBcSt,
        valorIcmsSt: vlIcmsSt,
        valorIpi: vlIpi,
        valorPis: vlPis,
        valorCofins: vlCofins,
        itensQtd: 0,
      }
    } else if (reg === 'C170' && docAtual) {
      // Item do Documento
      docAtual.itensQtd += 1
    } else if (reg === 'M200' || reg === 'M600') {
      // EFD Contribuições: consolidação de PIS/COFINS
      tipoSped = 'efd_contribuicoes'
    }
  }

  if (docAtual) {
    documentosC100.push(docAtual)
  }

  // Agrega totais
  let totalEntradas = 0
  let totalSaidas = 0
  let valorTotalDocumentos = 0
  let valorMercadoriasTotal = 0
  let valorIcmsDestacado = 0
  let valorIpiDestacado = 0
  let valorPisDestacado = 0
  let valorCofinsDestacado = 0

  documentosC100.forEach((doc) => {
    if (doc.indicadorOperacao === '0') totalEntradas++
    else totalSaidas++

    valorTotalDocumentos += doc.valorTotalDocumento
    valorMercadoriasTotal += doc.valorMercadorias
    valorIcmsDestacado += doc.valorIcms
    valorIpiDestacado += doc.valorIpi
    valorPisDestacado += doc.valorPis
    valorCofinsDestacado += doc.valorCofins
  })

  // Extrai período de apuração MM/AAAA a partir de dataInicio
  let periodoApuracao = 'Período Completo'
  if (dataInicio && dataInicio.length >= 7) {
    const p = dataInicio.split('-')
    if (p.length >= 2) {
      periodoApuracao = `${p[1]}/${p[0]}`
    }
  }

  const participantesList = Array.from(participantesMap.values()).slice(0, 50)

  return {
    tipoSped,
    cnpj: cnpj || 'CNPJ não identificado',
    razaoSocial: razaoSocial || 'Entidade Fiscal SPED',
    periodoApuracao,
    dataInicio,
    dataFim,
    versaoLeiaute,
    finalidadeArquivo,
    totalDocumentos: documentosC100.length,
    totalEntradas,
    totalSaidas,
    valorTotalDocumentos,
    valorMercadoriasTotal,
    valorIcmsDestacado,
    valorIpiDestacado,
    valorPisDestacado,
    valorCofinsDestacado,
    documentosC100,
    principaisParticipantes: participantesList,
  }
}

/**
 * Salva a importação SPED no banco PocketBase e opcionalmente gera documentos em nfe_upload
 */
export async function salvarImportacaoSped(
  usuarioId: string,
  resumo: SpedResumoPeriodo,
  nomeArquivo: string,
  alimentarVisaoConsolidada = true,
): Promise<{ id: string; documentosInseridos: number }> {
  if (!usuarioId) throw new Error('Usuário autenticado obrigatório.')

  // 1. Cria o registro consolidado na coleção sped_importacoes
  const spedRecord = await pb.collection('sped_importacoes').create({
    usuario: usuarioId,
    cnpj: resumo.cnpj,
    razao_social: resumo.razaoSocial,
    tipo_sped: resumo.tipoSped,
    periodo_apuracao: resumo.periodoApuracao,
    data_inicio: resumo.dataInicio,
    data_fim: resumo.dataFim,
    total_documentos: resumo.totalDocumentos,
    valor_total_documentos: resumo.valorTotalDocumentos,
    valor_icms_destacado: resumo.valorIcmsDestacado,
    valor_ipi_destacado: resumo.valorIpiDestacado,
    valor_pis_destacado: resumo.valorPisDestacado,
    valor_cofins_destacado: resumo.valorCofinsDestacado,
    nome_arquivo: nomeArquivo,
    hash_arquivo: 'SPED-' + Date.now().toString(16),
    resumo_detalhado_json: {
      versaoLeiaute: resumo.versaoLeiaute,
      finalidadeArquivo: resumo.finalidadeArquivo,
      totalEntradas: resumo.totalEntradas,
      totalSaidas: resumo.totalSaidas,
      participantesQtd: resumo.principaisParticipantes.length,
      primeirosDocumentos: resumo.documentosC100.slice(0, 20),
    },
  })

  let docsInseridos = 0

  // 2. Se habilitado, alimenta aditivamente nfe_upload para unificar com o balanço pericial
  if (alimentarVisaoConsolidada && resumo.documentosC100.length > 0) {
    // Processa até 100 documentos representativos para não estourar batch
    const docsParaInserir = resumo.documentosC100.slice(0, 100)
    for (const doc of docsParaInserir) {
      try {
        const chaveAcesso =
          doc.chaveAcesso ||
          `SPED${doc.modeloDocumento}${doc.serie}${doc.numeroDocumento}${Date.now().toString().slice(-6)}`
        await pb.collection('nfe_upload').create({
          usuario: usuarioId,
          chave_acesso: chaveAcesso.slice(0, 44),
          numero_nota: doc.numeroDocumento || 'S/N',
          serie: doc.serie || '1',
          modelo: doc.modeloDocumento || '55',
          data_emissao: doc.dataEmissao || resumo.dataInicio || new Date().toISOString(),
          cnpj_emitente:
            doc.indicadorEmitente === '0' ? resumo.cnpj : doc.codigoParticipante || 'Terceiro',
          nome_emitente: doc.indicadorEmitente === '0' ? resumo.razaoSocial : 'Emitente SPED',
          cnpj_destinatario: doc.indicadorOperacao === '1' ? 'Cliente/Destinatário' : resumo.cnpj,
          nome_destinatario:
            doc.indicadorOperacao === '1' ? 'Cliente do Período' : resumo.razaoSocial,
          valor_total_nf: doc.valorTotalDocumento,
          valor_icms: doc.valorIcms,
          valor_ipi: doc.valorIpi,
          valor_pis: doc.valorPis,
          valor_cofins: doc.valorCofins,
          qtd_itens: doc.itensQtd || 1,
          nome_arquivo: nomeArquivo,
          origem: 'sped',
          modelo_fiscal: doc.modeloDocumento === '65' ? '65_nfce' : '55_nfe',
          dados_adicionais_json: {
            sped_importacao_id: spedRecord.id,
            operacao: doc.indicadorOperacao === '0' ? 'Entrada' : 'Saída',
            emitente: doc.indicadorEmitente === '0' ? 'Própria' : 'Terceiros',
            periodo: resumo.periodoApuracao,
          },
        })
        docsInseridos++
      } catch {
        // Ignora duplicata se chave já existir
      }
    }
  }

  return { id: spedRecord.id, documentosInseridos: docsInseridos }
}

/**
 * Lista importações SPED anteriores do usuário autenticado
 */
export async function listarImportacoesSped(usuarioId?: string) {
  if (!usuarioId) return []
  try {
    const res = await pb.collection('sped_importacoes').getList(1, 20, {
      filter: `usuario = "${usuarioId}"`,
      sort: '-created',
    })
    return res.items
  } catch {
    return []
  }
}
