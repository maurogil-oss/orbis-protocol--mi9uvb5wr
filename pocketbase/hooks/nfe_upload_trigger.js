onRecordCreate((e) => {
  // 1. Verificação de evento ou indicação de cancelamento nos campos
  const flags = e.record.get('flags_revisao') || []
  const dadosAdic = e.record.get('dados_adicionais_json') || {}

  // Se o frontend ou integração sinalizou cancelamento da NF-e
  if (
    dadosAdic.cancelada === true ||
    dadosAdic.evento_cancelamento ||
    (Array.isArray(flags) &&
      flags.some(
        (f) =>
          typeof f === 'string' &&
          f.toLowerCase().includes('cancelad') &&
          !f.toLowerCase().includes('não cancelad'),
      ))
  ) {
    throw new BadRequestError('NF-e cancelada na SEFAZ — não pode ser usada na pegada de carbono.')
  }

  // 2. Verificação de CFOP de devolução:
  // Se todos os itens da nota forem exclusivamente devolução (ou a nota for natureza de devolução)
  // e houver flags de itens de devolução, higieniza flags_revisao
  const itens = e.record.get('resumo_itens_json')
  if (Array.isArray(itens) && itens.length > 0) {
    let qtdDevolucoes = 0
    let valorDevolucao = 0
    for (let i = 0; i < itens.length; i++) {
      const it = itens[i]
      const cfop = String(it.cfop || '').replace(/\D/g, '')
      const isDev =
        /^[123567]2\d{2}$/.test(cfop) ||
        [
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
        ].indexOf(cfop) >= 0

      if (isDev) {
        qtdDevolucoes++
        valorDevolucao += Number(it.valorTotal || it.valor_total || 0)
        it.isDevolucao = true
        it.motivoExclusaoCfop = 'CFOP ' + cfop + ' (devolução) — não compõe a pegada'
      }
    }

    if (qtdDevolucoes > 0) {
      // Atualiza dados_adicionais_json para registrar a exclusão
      dadosAdic.itens_devolucao_excluidos_qtd = qtdDevolucoes
      dadosAdic.valor_devolucao_excluido = valorDevolucao
      try {
        e.record.set('dados_adicionais_json', dadosAdic)
      } catch (_) {}
    }
  }

  const chave = e.record.getString('chave_acesso')
  if (!chave) {
    e.next()
    return
  }

  const chaveLimpa = chave.replace(/\D/g, '')

  // Se for chave completa de 44 dígitos (NF-e, CT-e, NFC-e, etc.), validação de DV Módulo 11
  if (chaveLimpa.length === 44) {
    const base43 = chaveLimpa.slice(0, 43)
    const dvInformado = parseInt(chaveLimpa.charAt(43), 10)
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

    if (dvEsperado !== dvInformado) {
      throw new BadRequestError(
        'Chave de acesso inválida — DV módulo 11 não confere (informado: ' +
          dvInformado +
          ', esperado: ' +
          dvEsperado +
          ').',
      )
    }

    // Calcula e armazena hash SHA-256 se o campo existir
    const hashChave = $security.sha256(chaveLimpa)
    try {
      e.record.set('hash_chave', hashChave)
    } catch (_) {}

    // Deduplicação: verifica se já existe nota com a mesma chave ou mesmo hash
    try {
      const existente = $app.findFirstRecordByData('nfe_upload', 'chave_acesso', chaveLimpa)
      if (existente && existente.id !== e.record.id) {
        const dataAnterior =
          existente.getString('created') || existente.getString('data_emissao') || ''
        const dataFormatada = dataAnterior ? dataAnterior.slice(0, 10) : 'data anterior'
        throw new BadRequestError(
          'Esta nota já foi importada em ' +
            dataFormatada +
            ' — importação bloqueada por duplicidade.',
        )
      }
    } catch (err) {
      if (err instanceof BadRequestError) throw err
    }
  }

  e.next()
}, 'nfe_upload')
