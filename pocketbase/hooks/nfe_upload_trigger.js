onRecordCreate((e) => {
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
