routerAdd('GET', '/backend/v1/cnpj/{cnpj}', (e) => {
  try {
    let rawCnpj = ''
    if (e.request && typeof e.request.pathValue === 'function') {
      rawCnpj = e.request.pathValue('cnpj') || ''
    } else if (e.requestInfo && typeof e.requestInfo === 'function') {
      const info = e.requestInfo()
      rawCnpj = (info.pathParams && info.pathParams.cnpj) || ''
    }
    rawCnpj = String(rawCnpj).trim()
    const digits = rawCnpj.replace(/\D/g, '')

    if (digits.length !== 14) {
      return e.json(400, {
        sucesso: false,
        error: 'CNPJ deve conter 14 dígitos numéricos.',
      })
    }

    // 1. Tenta OpenCNPJ (api.opencnpj.org) — primário e sem credencial
    let openCnpjRes = null
    try {
      openCnpjRes = $http.send({
        url: 'https://api.opencnpj.org/' + digits,
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'User-Agent': 'OrbisProtocol/1.0 (conformidade@orbis-protocol.com)',
        },
        timeout: 10,
      })
    } catch (httpErr) {
      // Ignora timeout/rede de OpenCNPJ
    }

    if (openCnpjRes && openCnpjRes.statusCode === 200 && openCnpjRes.json) {
      const data = openCnpjRes.json
      if (data && (data.razao_social || data.cnpj)) {
        return e.json(200, {
          sucesso: true,
          fonte: 'opencnpj',
          dados: data,
        })
      }
    } else if (openCnpjRes && openCnpjRes.statusCode === 404) {
      return e.json(404, {
        sucesso: false,
        error: 'CNPJ não encontrado na base pública da Receita Federal.',
        codigo: 404,
      })
    }

    // 2. Fallback: BrasilAPI
    let brasilRes = null
    try {
      brasilRes = $http.send({
        url: 'https://brasilapi.com.br/api/cnpj/v1/' + digits,
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'User-Agent': 'OrbisProtocol/1.0',
        },
        timeout: 10,
      })
    } catch (_) {}

    if (brasilRes && brasilRes.statusCode === 200 && brasilRes.json) {
      return e.json(200, {
        sucesso: true,
        fonte: 'brasilapi',
        dados: brasilRes.json,
      })
    } else if (brasilRes && brasilRes.statusCode === 404) {
      return e.json(404, {
        sucesso: false,
        error: 'CNPJ não encontrado na Receita Federal.',
        codigo: 404,
      })
    }

    // 3. Fallback: Minha Receita
    let minhaRes = null
    try {
      minhaRes = $http.send({
        url: 'https://minhareceita.org/' + digits,
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'User-Agent': 'OrbisProtocol/1.0',
        },
        timeout: 10,
      })
    } catch (_) {}

    if (minhaRes && minhaRes.statusCode === 200 && minhaRes.json) {
      return e.json(200, {
        sucesso: true,
        fonte: 'minhareceita',
        dados: minhaRes.json,
      })
    }

    // Se todas as fontes falharem por timeout ou indisponibilidade externa
    return e.json(502, {
      sucesso: false,
      error: 'Provedores públicos temporariamente indisponíveis. Preenchimento manual liberado.',
    })
  } catch (err) {
    return e.json(500, {
      sucesso: false,
      error: err.message || 'Erro inesperado na consulta do CNPJ.',
    })
  }
})
