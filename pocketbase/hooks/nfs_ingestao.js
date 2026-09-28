routerAdd('POST', '/backend/v1/nfs/lotes', (e) => {
  const reqInfo = e.requestInfo()
  const body = reqInfo.body || {}
  const apiKeyHeader = reqInfo.headers['x-api-key'] || reqInfo.headers['X-API-Key'] || ''

  if (!apiKeyHeader || !String(apiKeyHeader).trim()) {
    return e.json(401, {
      sucesso: false,
      erro: 'Chave de API ausente. Informe o header X-API-Key para autenticar a empresa remetente.',
    })
  }

  // 1. Validar chave contra empresa_api_keys_nfs (hash SHA-256)
  const keyHash = $security.sha256(String(apiKeyHeader).trim())
  let keyRec
  try {
    keyRec = $app.findFirstRecordByData('empresa_api_keys_nfs', 'chave_hash', keyHash)
  } catch (_) {
    return e.json(401, {
      sucesso: false,
      erro: 'Chave de API inválida ou inexistente para ingestão de NFs.',
    })
  }

  if (!keyRec.getBool('ativa')) {
    return e.json(401, {
      sucesso: false,
      erro: 'Esta chave de API está revogada/desativada. Gere uma nova chave no Hub de Conexão Fiscal.',
    })
  }

  // 2. Rate limit: 60 requisições por minuto por chave
  const now = new Date()
  const lastUseStr = keyRec.getString('ultimo_uso')
  let requestsWindowCount = 1
  if (lastUseStr) {
    const lastUse = new Date(lastUseStr)
    const diffMs = now - lastUse
    if (diffMs < 60000) {
      requestsWindowCount = keyRec.getInt('requests_count_1min') || 0
      if (requestsWindowCount >= 60) {
        return e.json(429, {
          sucesso: false,
          erro: 'Limite de 60 lotes por minuto excedido para esta chave de API. Tente novamente em instantes.',
        })
      }
      requestsWindowCount++
    } else {
      requestsWindowCount = 1
    }
  }
  keyRec.set('requests_count_1min', requestsWindowCount)
  keyRec.set('ultimo_uso', now.toISOString())
  $app.save(keyRec)

  // 3. Validação do payload
  if (!body || typeof body !== 'object') {
    return e.json(400, {
      sucesso: false,
      erro: 'Payload JSON inválido. Envie um objeto com a propriedade "lote" ou "documentos" contendo a lista de XMLs.',
    })
  }

  // Formato flexível do lote: array sob `documentos`, `lote`, `nfs` ou `xmls`
  const listaDocumentos = Array.isArray(body.documentos)
    ? body.documentos
    : Array.isArray(body.lote)
      ? body.lote
      : Array.isArray(body.nfs)
        ? body.nfs
        : Array.isArray(body.xmls)
          ? body.xmls
          : []

  if (listaDocumentos.length === 0) {
    return e.json(400, {
      sucesso: false,
      erro: 'O lote não contém nenhum documento. Forneça uma lista de XMLs de NF-e no atributo "documentos" (máx. 100 por lote).',
      payload_exemplo: {
        documentos: [
          {
            xml: '<nfeProc xmlns="http://www.portalfiscal.inf.br/nfe">...</nfeProc>',
            nome_arquivo: 'NFe_exemplo.xml',
          },
        ],
      },
    })
  }

  if (listaDocumentos.length > 100) {
    return e.json(400, {
      sucesso: false,
      erro: 'Limite de 100 documentos por lote excedido. Divida seu envio em múltiplos lotes.',
    })
  }

  const chaveCnpjVinculado = String(keyRec.getString('cnpj_vinculado') || '').replace(/\D/g, '')
  const usuarioId = keyRec.getString('usuario')

  // Helpers internos para extração de tags XML em JS puro
  const extractTag = (xml, tagName) => {
    if (!xml) return ''
    const re = new RegExp(
      '<(?:[a-zA-Z0-9_]+:)?' +
        tagName +
        '[^>]*>([\\s\\S]*?)<\\/(?:[a-zA-Z0-9_]+:)?' +
        tagName +
        '>',
      'i',
    )
    const match = xml.match(re)
    return match ? match[1].trim() : ''
  }

  const extractBlock = (xml, tagName) => {
    if (!xml) return ''
    const re = new RegExp(
      '<(?:[a-zA-Z0-9_]+:)?' +
        tagName +
        '[^>]*>([\\s\\S]*?)<\\/(?:[a-zA-Z0-9_]+:)?' +
        tagName +
        '>',
      'i',
    )
    const match = xml.match(re)
    return match ? match[1] : ''
  }

  const extractAllBlocks = (xml, tagName) => {
    if (!xml) return []
    const re = new RegExp(
      '<(?:[a-zA-Z0-9_]+:)?' +
        tagName +
        '[^>]*>([\\s\\S]*?)<\\/(?:[a-zA-Z0-9_]+:)?' +
        tagName +
        '>',
      'gi',
    )
    const results = []
    let m
    while ((m = re.exec(xml)) !== null) {
      results.push(m[1])
    }
    return results
  }

  const parseNumber = (val) => {
    if (!val) return 0
    const clean = String(val).replace(',', '.').trim()
    const n = parseFloat(clean)
    return isNaN(n) ? 0 : n
  }

  const calcularDVMod11 = (base43) => {
    let soma = 0
    let peso = 2
    for (let i = base43.length - 1; i >= 0; i--) {
      soma += parseInt(base43.charAt(i), 10) * peso
      peso++
      if (peso > 9) peso = 2
    }
    const resto = soma % 11
    let dvEsperado = 11 - resto
    if (resto === 0 || resto === 1 || dvEsperado >= 10) {
      dvEsperado = 0
    }
    return dvEsperado
  }

  const detectarCombustivel = (desc, ncm) => {
    const d = (desc || '').toLowerCase()
    const n = (ncm || '').trim()
    if (
      n.indexOf('27101921') === 0 ||
      n.indexOf('27101922') === 0 ||
      d.indexOf('diesel') !== -1 ||
      d.indexOf('s-10') !== -1 ||
      d.indexOf('s10') !== -1
    ) {
      return 'diesel'
    }
    if (n.indexOf('27101259') === 0 || d.indexOf('gasolina') !== -1) {
      return 'gasolina'
    }
    if (n.indexOf('2207') === 0 || d.indexOf('etanol') !== -1 || d.indexOf('alcool') !== -1) {
      return 'etanol'
    }
    if (
      n.indexOf('27111910') === 0 ||
      d.indexOf('glp') !== -1 ||
      d.indexOf('botijao') !== -1 ||
      d.indexOf('gas liquefeito') !== -1
    ) {
      return 'glp'
    }
    if (n.indexOf('27112100') === 0 || d.indexOf('gnv') !== -1 || d.indexOf('gas natural') !== -1) {
      return 'gnv'
    }
    return null
  }

  const nfeCol = $app.findCollectionByNameOrId('nfe_upload')
  const aceitos = []
  const rejeitados = []

  for (let i = 0; i < listaDocumentos.length; i++) {
    const item = listaDocumentos[i]
    // Suporte tanto para string XML direta quanto objeto { xml, nome_arquivo }
    let rawXml = ''
    let nomeArquivo = `NF_API_${i + 1}.xml`

    if (typeof item === 'string') {
      rawXml = item.trim()
    } else if (item && typeof item === 'object') {
      rawXml = String(item.xml || item.conteudo || item.content || '').trim()
      if (item.nome_arquivo || item.filename) {
        nomeArquivo = String(item.nome_arquivo || item.filename)
      }
    }

    if (!rawXml) {
      rejeitados.push({
        indice: i,
        nome_arquivo: nomeArquivo,
        erro: 'Conteúdo XML vazio ou inválido.',
      })
      continue
    }

    // Verificar se possui estrutura de NF-e / NFC-e (<infNFe>)
    const infNFeBlock = extractBlock(rawXml, 'infNFe')
    if (!infNFeBlock && rawXml.indexOf('infNFe') === -1) {
      rejeitados.push({
        indice: i,
        nome_arquivo: nomeArquivo,
        erro: 'Documento não é um XML de NF-e/NFC-e válido (tag <infNFe> não encontrada).',
      })
      continue
    }

    // Extrair chave de acesso: do atributo Id de <infNFe> ou da tag <chNFe>
    let chaveAcesso = ''
    const matchId = rawXml.match(/<infNFe[^>]*Id=["'](?:NFe)?(\d{44})["']/i)
    if (matchId) {
      chaveAcesso = matchId[1]
    } else {
      const chTag = extractTag(rawXml, 'chNFe')
      if (chTag && chTag.replace(/\D/g, '').length === 44) {
        chaveAcesso = chTag.replace(/\D/g, '')
      }
    }

    if (!chaveAcesso || chaveAcesso.length !== 44) {
      rejeitados.push({
        indice: i,
        nome_arquivo: nomeArquivo,
        erro: 'Chave de acesso de 44 dígitos não encontrada no XML.',
      })
      continue
    }

    // Validação DV módulo 11
    const base43 = chaveAcesso.slice(0, 43)
    const dvInformado = parseInt(chaveAcesso.charAt(43), 10)
    const dvEsperado = calcularDVMod11(base43)
    if (dvEsperado !== dvInformado) {
      rejeitados.push({
        indice: i,
        chave_acesso: chaveAcesso,
        nome_arquivo: nomeArquivo,
        erro:
          'Chave de acesso inválida — DV módulo 11 não confere (informado: ' +
          dvInformado +
          ', esperado: ' +
          dvEsperado +
          ').',
      })
      continue
    }

    // Extrair emitente e destinatário
    const emitBlock = extractBlock(rawXml, 'emit')
    const destBlock = extractBlock(rawXml, 'dest')
    const cnpjEmitente = extractTag(emitBlock, 'CNPJ') || extractTag(emitBlock, 'CPF')
    const nomeEmitente = extractTag(emitBlock, 'xNome') || extractTag(emitBlock, 'xFant')
    const cnpjDestinatario = extractTag(destBlock, 'CNPJ') || extractTag(destBlock, 'CPF')
    const nomeDestinatario = extractTag(destBlock, 'xNome') || extractTag(destBlock, 'xFant')

    // REGRA DE SIGILO FISCAL:
    // O CNPJ vinculado à chave de API DEVE ser compatível com a nota (deve ser o emitente OU destinatário).
    // Uma empresa não pode enviar NFs de terceiros não relacionados a ela.
    const cleanEmit = String(cnpjEmitente).replace(/\D/g, '')
    const cleanDest = String(cnpjDestinatario).replace(/\D/g, '')

    if (chaveCnpjVinculado) {
      const compativel =
        cleanEmit === chaveCnpjVinculado ||
        cleanDest === chaveCnpjVinculado ||
        (cleanEmit.length === 14 &&
          chaveCnpjVinculado.length === 14 &&
          cleanEmit.slice(0, 8) === chaveCnpjVinculado.slice(0, 8)) ||
        (cleanDest.length === 14 &&
          chaveCnpjVinculado.length === 14 &&
          cleanDest.slice(0, 8) === chaveCnpjVinculado.slice(0, 8))

      if (!compativel) {
        rejeitados.push({
          indice: i,
          chave_acesso: chaveAcesso,
          nome_arquivo: nomeArquivo,
          cnpj_emitente: cnpjEmitente,
          cnpj_destinatario: cnpjDestinatario,
          cnpj_chave: chaveCnpjVinculado,
          erro:
            'Violação de sigilo fiscal: o CNPJ da nota fiscal (emitente: ' +
            (cnpjEmitente || '—') +
            ', destinatário: ' +
            (cnpjDestinatario || '—') +
            ') não coincide com o CNPJ vinculado à chave de API (' +
            chaveCnpjVinculado +
            '). Uma empresa não pode enviar NFs de terceiros.',
        })
        continue
      }
    }

    // Deduplicação: verificação de duplicidade por chave e hash
    const hashChave = $security.sha256(chaveAcesso)
    let duplicada = false
    try {
      const existeHash = $app.findFirstRecordByData('nfe_upload', 'hash_chave', hashChave)
      if (existeHash) duplicada = true
    } catch (_) {}

    if (!duplicada) {
      try {
        const existeChave = $app.findFirstRecordByData('nfe_upload', 'chave_acesso', chaveAcesso)
        if (existeChave) duplicada = true
      } catch (_) {}
    }

    if (duplicada) {
      rejeitados.push({
        indice: i,
        chave_acesso: chaveAcesso,
        nome_arquivo: nomeArquivo,
        motivo: 'duplicidade',
        erro: 'Documento fiscal já importado anteriormente na plataforma (duplicidade detectada).',
      })
      continue
    }

    // Extrair dados fiscais da nota
    const ideBlock = extractBlock(rawXml, 'ide')
    const modelo = extractTag(ideBlock, 'mod') || '55'
    const serie = extractTag(ideBlock, 'serie') || '1'
    const numeroNota = extractTag(ideBlock, 'nNF') || ''
    const dataEmissao =
      extractTag(ideBlock, 'dhEmi') || extractTag(ideBlock, 'dEmi') || new Date().toISOString()

    const icmsTotBlock = extractBlock(rawXml, 'ICMSTot')
    const valorTotalNF = parseNumber(extractTag(icmsTotBlock, 'vNF') || extractTag(rawXml, 'vNF'))
    const valorIcms = parseNumber(extractTag(icmsTotBlock, 'vICMS'))
    const valorIpi = parseNumber(extractTag(icmsTotBlock, 'vIPI') || extractTag(rawXml, 'vIPI'))
    const valorPis = parseNumber(extractTag(icmsTotBlock, 'vPIS'))
    const valorCofins = parseNumber(extractTag(icmsTotBlock, 'vCOFINS'))

    // Totalizadores IBS / CBS
    const vIBSTot = parseNumber(extractTag(rawXml, 'vIBSTot') || extractTag(rawXml, 'vIBS'))
    const vCBSTot = parseNumber(extractTag(rawXml, 'vCBSTot') || extractTag(rawXml, 'vCBS'))

    // Itens da nota
    const detList = extractAllBlocks(rawXml, 'det')
    const resumoItens = []
    let combustivelTipo = null
    let combustivelLitros = 0
    let somaIbsItens = 0
    let somaCbsItens = 0

    for (let d = 0; d < detList.length; d++) {
      const detXml = detList[d]
      const prodXml = extractBlock(detXml, 'prod')
      const descItem = extractTag(prodXml, 'xProd')
      const ncmItem = extractTag(prodXml, 'NCM')
      const qtdItem = parseNumber(extractTag(prodXml, 'qCom'))
      const valorItem = parseNumber(extractTag(prodXml, 'vProd'))

      // Detectar combustível fóssil
      const comb = detectarCombustivel(descItem, ncmItem)
      if (comb) {
        combustivelTipo = comb
        combustivelLitros += qtdItem
      }

      // IBS / CBS no item
      const vIbsItem = parseNumber(extractTag(detXml, 'vIBS'))
      const vCbsItem = parseNumber(extractTag(detXml, 'vCBS'))
      if (vIbsItem > 0) somaIbsItens += vIbsItem
      if (vCbsItem > 0) somaCbsItens += vCbsItem

      if (d < 15) {
        resumoItens.push({
          numeroItem: d + 1,
          codigo: extractTag(prodXml, 'cProd'),
          descricao: descItem,
          ncm: ncmItem,
          unidade: extractTag(prodXml, 'uCom') || 'UN',
          quantidade: qtdItem,
          valorUnitario: parseNumber(extractTag(prodXml, 'vUnCom')),
          valorTotal: valorItem,
        })
      }
    }

    const valorIbsFinal = vIBSTot > 0 ? vIBSTot : somaIbsItens
    const valorCbsFinal = vCBSTot > 0 ? vCBSTot : somaCbsItens
    const temIbsCbs = valorIbsFinal > 0 || valorCbsFinal > 0

    // Persistir em nfe_upload
    const nfeRec = new Record(nfeCol)
    nfeRec.set('usuario', usuarioId)
    nfeRec.set('chave_acesso', chaveAcesso)
    nfeRec.set('hash_chave', hashChave)
    nfeRec.set('numero_nota', numeroNota)
    nfeRec.set('serie', serie)
    nfeRec.set('modelo', modelo)
    nfeRec.set('modelo_fiscal', modelo === '65' ? '65_nfce' : '55_nfe')
    nfeRec.set('data_emissao', dataEmissao)
    nfeRec.set('cnpj_emitente', cnpjEmitente)
    nfeRec.set('nome_emitente', nomeEmitente)
    nfeRec.set('cnpj_destinatario', cnpjDestinatario)
    nfeRec.set('nome_destinatario', nomeDestinatario)
    nfeRec.set('valor_total_nf', valorTotalNF)
    nfeRec.set('valor_icms', valorIcms)
    nfeRec.set('valor_ipi', valorIpi)
    nfeRec.set('valor_pis', valorPis)
    nfeRec.set('valor_cofins', valorCofins)
    nfeRec.set('qtd_itens', detList.length)
    nfeRec.set('resumo_itens_json', resumoItens)
    nfeRec.set('nome_arquivo', nomeArquivo)
    nfeRec.set('origem', 'api_nfs')

    if (combustivelTipo) {
      nfeRec.set('combustivel_tipo', combustivelTipo)
      nfeRec.set('combustivel_litros', combustivelLitros)
    }

    nfeRec.set('dados_adicionais_json', {
      origem_integracao: 'api_nfs_v1',
      chave_api_prefixo: keyRec.getString('chave_prefixo'),
      valor_ibs_total: valorIbsFinal,
      valor_cbs_total: valorCbsFinal,
      tem_destaque_ibs_cbs: temIbsCbs,
      total_itens: detList.length,
    })

    try {
      $app.save(nfeRec)
      aceitos.push({
        indice: i,
        nfe_id: nfeRec.id,
        chave_acesso: chaveAcesso,
        numero_nota: numeroNota,
        serie: serie,
        data_emissao: dataEmissao,
        cnpj_emitente: cnpjEmitente,
        cnpj_destinatario: cnpjDestinatario,
        valor_total: valorTotalNF,
        valor_pis: valorPis,
        valor_cofins: valorCofins,
        valor_icms: valorIcms,
        qtd_itens: detList.length,
        combustivel_detectado: combustivelTipo
          ? { tipo: combustivelTipo, litros: combustivelLitros }
          : null,
      })
    } catch (saveErr) {
      rejeitados.push({
        indice: i,
        chave_acesso: chaveAcesso,
        nome_arquivo: nomeArquivo,
        erro:
          'Falha ao salvar registro no banco de dados: ' + (saveErr.message || 'Erro desconhecido'),
      })
    }
  }

  const statusFinalLote =
    rejeitados.length === 0 ? 'processado' : aceitos.length > 0 ? 'parcial' : 'rejeitado'

  // 4. Registro de auditoria das chamadas
  const resumoLote = {
    total_recebidos: listaDocumentos.length,
    total_aceitos: aceitos.length,
    total_rejeitados: rejeitados.length,
    status: statusFinalLote,
    timestamp: now.toISOString(),
    cnpj_vinculado: chaveCnpjVinculado,
  }

  // Grava na coleção nfs_api_lotes_log
  let logId = ''
  try {
    const logCol = $app.findCollectionByNameOrId('nfs_api_lotes_log')
    const logRec = new Record(logCol)
    if (usuarioId) logRec.set('usuario', usuarioId)
    logRec.set('cnpj_vinculado', chaveCnpjVinculado)
    logRec.set('api_key_hash', keyHash)
    logRec.set('total_recebidos', listaDocumentos.length)
    logRec.set('total_aceitos', aceitos.length)
    logRec.set('total_rejeitados', rejeitados.length)
    logRec.set('status', statusFinalLote)
    logRec.set(
      'ip_origem',
      reqInfo.headers['x-forwarded-for'] || reqInfo.headers['x-real-ip'] || 'remote',
    )
    logRec.set('resumo_processamento_json', {
      aceitos_resumo: aceitos.map((a) => ({ chave: a.chave_acesso, valor: a.valor_total })),
      rejeitados_resumo: rejeitados,
    })
    $app.save(logRec)
    logId = logRec.id
  } catch (logErr) {
    console.warn('[nfs_ingestao] Aviso ao salvar nfs_api_lotes_log:', logErr && logErr.message)
  }

  // Grava também no audit_log da plataforma (central) sem abortar em caso de erro
  try {
    const auditCol = $app.findCollectionByNameOrId('audit_log')
    const auditRec = new Record(auditCol)
    auditRec.set('acao', 'api_nfs_lote_ingerido')
    auditRec.set('entidade', 'nfe_upload')
    auditRec.set('entidade_id', logId || 'lote_nfs')
    auditRec.set('ator_id', usuarioId || 'api_key_nfs')
    auditRec.set('ator_email', 'api-nfs@' + (chaveCnpjVinculado || 'orbis-protocol.com'))
    auditRec.set('papel', 'api_integracao')
    auditRec.set('detalhes', resumoLote)
    auditRec.set('ip', reqInfo.headers['x-forwarded-for'] || 'remote')
    $app.save(auditRec)
  } catch (auditErr) {
    console.warn('[nfs_ingestao] Aviso ao salvar audit_log:', auditErr && auditErr.message)
  }

  // 5. Resposta estruturada
  return e.json(201, {
    sucesso: aceitos.length > 0,
    status: statusFinalLote,
    lote_id: logId,
    cnpj_vinculado: chaveCnpjVinculado,
    total_recebidos: listaDocumentos.length,
    total_aceitos: aceitos.length,
    total_rejeitados: rejeitados.length,
    documentos_aceitos: aceitos,
    rejeicoes: rejeitados,
  })
})
