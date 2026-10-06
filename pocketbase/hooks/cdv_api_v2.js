/**
 * API v2 CDV & Verificador de Claims / Dedup Inter-CDVs
 *
 * Endpoints implementados:
 * 1. POST /backend/v2/cdv/lotes
 *    - Ingestão com motor DM-ORB-001 v1.1
 *    - Dedup inter-CDVs: chave = chassi + sku + data_baixa
 *    - Se conflito com outro CDV -> HTTP 409 CONFLITO_DE_CUSTODIA
 *    - Snapshot congelado de fatores por peça
 *    - Suporte a fluidos (R-134a) e PE_lote
 *
 * 2. GET /backend/v2/cdv/claim/:chassi
 *    - Registro público de claims por chassi (consulta pública de custódia sem dados sensíveis - LGPD)
 */

routerAdd('POST', '/backend/v2/cdv/lotes', (e) => {
  const body = e.requestInfo().body || {}
  const apiKeyHeader =
    e.requestInfo().headers['x-api-key'] || e.requestInfo().headers['X-API-Key'] || ''

  if (!apiKeyHeader || !apiKeyHeader.trim()) {
    return e.json(401, {
      sucesso: false,
      erro: 'Chave de API ausente. Informe o header X-API-Key para autenticar o CDV remetente na API v2.',
    })
  }

  // 1. Validar autenticação
  const keyHash = $security.sha256(String(apiKeyHeader).trim())
  let keyRec
  try {
    keyRec = $app.findFirstRecordByData('cdv_api_keys', 'chave_hash', keyHash)
  } catch (_) {
    return e.json(401, {
      sucesso: false,
      erro: 'Chave de API inválida ou revogada para o CDV remetente.',
    })
  }

  if (!keyRec.getBool('ativa')) {
    return e.json(401, {
      sucesso: false,
      erro: 'Esta chave de API está desativada.',
    })
  }

  // Rate limit
  const now = new Date()
  const lastUseStr = keyRec.getString('ultimo_uso')
  let requestsWindowCount = 1
  if (lastUseStr) {
    const lastUse = new Date(lastUseStr)
    const diffMs = now - lastUse
    if (diffMs < 60000) {
      requestsWindowCount = keyRec.getInt('requests_count_1min') || 0
      if (requestsWindowCount > 60) {
        return e.json(429, {
          sucesso: false,
          erro: 'Limite de 60 requisições por minuto excedido.',
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

  // 2. Validação básica de payload
  if (!body || typeof body !== 'object') {
    return e.json(400, {
      sucesso: false,
      erro: 'Payload JSON inválido. Envie um objeto com cdv, veiculo_doador e pecas.',
    })
  }

  const cdvInfo = body.cdv || {}
  const veiculoInfo = body.veiculo_doador || {}
  const pecasList = Array.isArray(body.pecas) ? body.pecas : []
  const destinacaoList = Array.isArray(body.destinacao) ? body.destinacao : []

  if (!veiculoInfo.baixa_detran || !veiculoInfo.marca_modelo || pecasList.length === 0) {
    return e.json(400, {
      sucesso: false,
      erro: 'Payload incompleto. Campos obrigatórios: cdv, veiculo_doador (marca_modelo, baixa_detran) e pecas (array não vazio).',
    })
  }

  const cdvNome = cdvInfo.nome || keyRec.getString('cdv_nome')
  const cdvCnpj = String(cdvInfo.cnpj || keyRec.getString('cdv_cnpj')).trim()
  const cdvCodigo = cdvInfo.codigo || keyRec.getString('cdv_codigo')
  const chassiRaw = veiculoInfo.chassi ? String(veiculoInfo.chassi).trim() : ''
  const baixaDetranNorm = String(veiculoInfo.baixa_detran).toUpperCase().trim()

  // 3. DEDUP INTER-CDVS (§2.3)
  // Chave canônica = chassi + sku_peça + data_baixa
  // Antes de emitir o selo e persistir, consultar registro de claims. Se outro CDV já reivindicou -> 409 CONFLITO_DE_CUSTODIA
  const claimsCol = $app.findCollectionByNameOrId('cdv_claims')
  const conflitos = []

  for (let i = 0; i < pecasList.length; i++) {
    const item = pecasList[i] || {}
    const sku = String(item.sku || '').trim()
    if (!sku) continue

    const chaveDedup = `${chassiRaw.toUpperCase()}_${sku.toUpperCase()}_${baixaDetranNorm}`
    try {
      const claimExistente = $app.findFirstRecordByData('cdv_claims', 'chave_dedup', chaveDedup)
      const claimCnpj = claimExistente.getString('cdv_cnpj')
      if (claimCnpj && claimCnpj !== cdvCnpj) {
        conflitos.push({
          sku,
          chassi: chassiRaw,
          chave_dedup: chaveDedup,
          detentor_vigente: claimCnpj,
          hash_claim_existente: claimExistente.getString('hash_claim'),
          status: 'conflito_inter_cdv',
        })
      }
    } catch (_) {
      // Nenhum claim prévio registrado -> ok
    }
  }

  if (conflitos.length > 0) {
    return e.json(409, {
      sucesso: false,
      erro: 'CONFLITO_DE_CUSTODIA: Uma ou mais peças deste lote já possuem claim ativo registrado por outro Centro de Desmontagem Veicular.',
      conflitos,
      detalhe:
        'Conforme o §2.3 e §5.3 do DM-ORB-001 v1.1, a custódia ambiental sobre o chassi e componentes é exclusiva do primeiro detentor com baixa DETRAN atestada.',
    })
  }

  // 4. Parâmetros do motor de cálculo v2 (§1)
  const df = typeof body.df_config === 'number' ? body.df_config : 0.3
  const li = typeof body.li_config === 'number' ? body.li_config : 1.0

  const fatoresCo2e = {
    aco: { fe: 2.18, u_fe: 0.035, fonte: 'worldsteel 2025 (GHG 2024: 2,18 tCO₂e/t)', tier: 'T3' },
    aluminio: {
      fe: 14.4,
      u_fe: 0.04,
      fonte:
        'International Aluminium Institute (IAI 2024 Emissions Intensity; 14,4 tCO₂e/t Al fallback global)',
      tier: 'T3',
    },
    cobre: {
      fe: 4.1,
      u: 0.045,
      fonte:
        'International Copper Association (ICA), Estudo Global LCI/LCA cradle-to-gate de cobre primário refinado (média global)',
      tier: 'T3',
    },
    polimeros: {
      fe: 1.9,
      u_fe: 0.05,
      fonte: 'PlasticsEurope Eco-profiles 2023 (PP at gate)',
      tier: 'T2',
    },
    outros: {
      fe: 1.5,
      u_fe: 0.1,
      fonte: 'Orbis dMRV Baseline Conservadora (Apêndice B)',
      tier: 'T1',
    },
  }

  // Emissões de projeto PE_lote
  let peLoteTotal = 0
  const energiaInfo = body.energia_cdv_competencia || {}
  const kwhMes = Number(energiaInfo.kwh_mes) || 0
  const dieselLitros = Number(energiaInfo.combustiveis_litros?.diesel_s10) || 0
  if (kwhMes > 0 || dieselLitros > 0) {
    peLoteTotal = Math.ceil(kwhMes * 0.0486 + dieselLitros * 2.295)
  }

  // Mapa de destinações
  const mapaDest = {}
  for (let d of destinacaoList) {
    if (d && d.sku) {
      mapaDest[String(d.sku).trim()] = d
    }
  }

  // Máscara única do chassi (§4): ex: 93YBB05U0GJ***711
  let chassiMascarado = chassiRaw
  if (chassiRaw.length >= 11) {
    const wmiVds = chassiRaw.slice(0, 8)
    const fim = chassiRaw.slice(-3)
    chassiMascarado = `${wmiVds}***${fim}`
  } else if (chassiRaw.length > 4) {
    chassiMascarado = chassiRaw.slice(0, chassiRaw.length - 4) + '***' + chassiRaw.slice(-2)
  }

  // Criar lote
  const lotesCol = $app.findCollectionByNameOrId('cdv_lotes')
  const pecasCol = $app.findCollectionByNameOrId('cdv_pecas')

  const loteRec = new Record(lotesCol)
  loteRec.set('cdv_nome', cdvNome)
  loteRec.set('cdv_cnpj', cdvCnpj)
  loteRec.set('cdv_codigo', cdvCodigo)
  loteRec.set('api_key_hash', keyHash)
  loteRec.set('veiculo_marca_modelo', String(veiculoInfo.marca_modelo))
  loteRec.set('veiculo_chassi', chassiMascarado)
  loteRec.set('veiculo_placa', veiculoInfo.placa ? String(veiculoInfo.placa).toUpperCase() : '')
  loteRec.set('veiculo_baixa_detran', baixaDetranNorm)
  loteRec.set(
    'veiculo_seguradora',
    veiculoInfo.seguradora_sinistro ? String(veiculoInfo.seguradora_sinistro) : '',
  )
  loteRec.set('origem_envio', body.origem || 'erp')
  loteRec.set('payload_bruto_json', body)

  const anoCorrente = new Date().getFullYear()
  const gerarSeloUnico = () => {
    let tentativas = 0
    while (tentativas < 10) {
      const numero = Math.floor(100000 + Math.random() * 900000)
      const candidato = `PR-SEAL-${anoCorrente}-${numero}`
      try {
        $app.findFirstRecordByData('cdv_pecas', 'selo_dpp', candidato)
      } catch (_) {
        return candidato
      }
      tentativas++
    }
    return `PR-SEAL-${anoCorrente}-${Date.now().toString().slice(-6)}`
  }

  let totalPesoKg = 0
  let somaEvitadoBruto = 0
  let somaEvitadoLiquido = 0
  let somaEvitadoConfirmado = 0
  let somaQuadradosIncerteza = 0

  let t1Total = 0
  let t2Total = 0
  let t3Total = 0
  let t4Total = 0

  const pecasProcessadas = []
  const fatoresSnapshot = []
  const claimsEmitidos = []

  // Calcular massa total recuperada
  let massaTotalPecas = 0
  for (let p of pecasList) {
    const w = Number(p.peso_kg) || 0
    if (w > 0) massaTotalPecas += w
  }

  for (let i = 0; i < pecasList.length; i++) {
    const item = pecasList[i] || {}
    const sku = String(item.sku || '').trim()
    const desc = String(item.descricao || '').trim()
    const pesoKg = Number(item.peso_kg) || 0
    if (!sku || !desc || pesoKg <= 0) continue

    // Rateio de PE
    let pePeca = 0
    if (peLoteTotal > 0 && massaTotalPecas > 0) {
      pePeca = Math.ceil((peLoteTotal / massaTotalPecas) * pesoKg * 100) / 100
    }
    if (item.recondicionamento && item.recondicionamento.energia_kwh) {
      pePeca = Math.ceil((pePeca + Number(item.recondicionamento.energia_kwh) * 0.0486) * 100) / 100
    }

    // Material
    const matLower = String(item.material || '').toLowerCase()
    let categoria = 'outros'
    if (
      matLower.includes('aço') ||
      matLower.includes('aco') ||
      matLower.includes('ferro') ||
      matLower.includes('metal')
    ) {
      categoria = 'aco'
    } else if (matLower.includes('alum')) {
      categoria = 'aluminio'
    } else if (matLower.includes('cobre')) {
      categoria = 'cobre'
    } else if (matLower.includes('poli') || matLower.includes('plast')) {
      categoria = 'polimeros'
    }

    const fatorInfo = fatoresCo2e[categoria] || fatoresCo2e.outros
    const evitadoBrutoPeca = pesoKg * fatorInfo.fe * li * df
    const evitadoLiquidoPeca = Math.floor(Math.max(0, evitadoBrutoPeca - pePeca) * 100) / 100

    // Destinação
    const dest = mapaDest[sku]
    const temDestinacao =
      !!dest && (dest.status === 'vendida' || dest.status === 'reciclada') && !!dest.evidencia

    if (temDestinacao) {
      somaEvitadoConfirmado += evitadoLiquidoPeca
    }

    somaEvitadoBruto += evitadoBrutoPeca
    somaEvitadoLiquido += evitadoLiquidoPeca
    totalPesoKg += pesoKg
    somaQuadradosIncerteza += Math.pow(evitadoLiquidoPeca * fatorInfo.u_fe, 2)

    if (fatorInfo.tier === 'T3') t3Total += evitadoLiquidoPeca
    else if (fatorInfo.tier === 'T2') t2Total += evitadoLiquidoPeca
    else t1Total += evitadoLiquidoPeca

    const selo = gerarSeloUnico()
    const canonicalStr = `${selo}|${sku}|${desc}|${pesoKg.toFixed(2)}|${evitadoLiquidoPeca.toFixed(2)}|${baixaDetranNorm}|${cdvCnpj}`
    const sha256 = $security.sha256(canonicalStr)

    // Gravar peça
    const recPeca = new Record(pecasCol)
    recPeca.set('lote', loteRec.id)
    recPeca.set('sku_interno', sku)
    recPeca.set('selo_dpp', selo)
    recPeca.set('descricao_peca', desc)
    recPeca.set('categoria_material', categoria)
    recPeca.set('material_declarado', item.material || '')
    recPeca.set('peso_kg', pesoKg)
    recPeca.set('ncm', item.ncm || '')
    recPeca.set('fator_co2e_kg', fatorInfo.fe)
    recPeca.set('co2e_evitado_kg', evitadoLiquidoPeca)
    recPeca.set('hash_sha256', sha256)
    recPeca.set(
      'responsavel_crea',
      item.responsavel_crea || cdvInfo.responsavel_crea || 'CREA a designar',
    )
    recPeca.set('cdv_origem', cdvCodigo)
    recPeca.set('cdv_cnpj', cdvCnpj)
    recPeca.set('status', 'ativo')
    recPeca.set('veiculo_marca_modelo', String(veiculoInfo.marca_modelo))
    recPeca.set('veiculo_chassi_mascarado', chassiMascarado)
    recPeca.set('veiculo_baixa_detran', baixaDetranNorm)
    $app.save(recPeca)

    // Registrar claim na cdv_claims para proteção contra conflito futuro
    const chaveDedup = `${chassiRaw.toUpperCase()}_${sku.toUpperCase()}_${baixaDetranNorm}`
    const claimHash = $security.sha256(`CLAIM|${chaveDedup}|${cdvCnpj}|${selo}|${sha256}`)
    const recClaim = new Record(claimsCol)
    recClaim.set('chave_dedup', chaveDedup)
    recClaim.set('chassi', chassiRaw)
    recClaim.set('sku', sku)
    recClaim.set('data_baixa', baixaDetranNorm)
    recClaim.set('cdv_cnpj', cdvCnpj)
    recClaim.set('cdv_nome', cdvNome)
    recClaim.set('lote_id', loteRec.id)
    recClaim.set('selo_dpp', selo)
    recClaim.set('hash_claim', claimHash)
    recClaim.set('status', temDestinacao ? 'confirmado' : 'potencial')
    recClaim.set('destinacao_tipo', dest?.status || 'pendente')
    $app.save(recClaim)

    claimsEmitidos.push({
      sku,
      status: temDestinacao ? 'confirmado' : 'potencial',
      hash_claim: claimHash,
    })

    fatoresSnapshot.push({
      sku,
      fator: fatorInfo.fe,
      fonte: fatorInfo.fonte,
      vigencia: '2025-01-01/2025-12-31',
    })

    pecasProcessadas.push({
      sku,
      selo_dpp: selo,
      peso_kg: pesoKg,
      evitado_liquido_kg: evitadoLiquidoPeca,
      status_claim: temDestinacao ? 'confirmado' : 'potencial',
      hash_sha256: sha256,
    })
  }

  // 5. Refrigerantes (R-134a GWP 1530; R-1234yf GWP 0.50 conforme IPCC AR6 WG1 Tab. 7.15 / 7.SM.7)
  let evitadoRefrigerante = 0
  const fluidos = veiculoInfo.fluidos || []
  for (let f of fluidos) {
    if (!f) continue
    const tipoNorm = String(f.tipo)
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
    const m = Number(f.massa_kg) || 0
    if (m <= 0) continue

    let gwp = 0
    if (tipoNorm === 'r134a') {
      gwp = 1530
    } else if (tipoNorm === 'r1234yf') {
      gwp = 0.5
    }

    if (gwp > 0) {
      evitadoRefrigerante += Math.floor(m * gwp * 1.0 * 100) / 100
    }
  }

  const evitadoLiquidoTotal = Math.floor((somaEvitadoLiquido + evitadoRefrigerante) * 100) / 100
  const evitadoConfirmadoTotal =
    Math.floor((somaEvitadoConfirmado + evitadoRefrigerante) * 100) / 100

  // Incerteza
  const uMassa = veiculoInfo.tara_fonte === 'estimado' ? 0.1 : 0.01
  const termoMassa = Math.pow(evitadoLiquidoTotal * uMassa, 2)
  const incertezaAbsoluta = Math.round(Math.sqrt(somaQuadradosIncerteza + termoMassa) * 100) / 100
  const incertezaPct =
    evitadoLiquidoTotal > 0 ? Math.round((incertezaAbsoluta / evitadoLiquidoTotal) * 1000) / 10 : 0

  // Finalizar lote
  loteRec.set('status', 'processado')
  loteRec.set('total_pecas', pecasProcessadas.length)
  loteRec.set('total_peso_kg', Math.round(totalPesoKg * 100) / 100)
  loteRec.set('total_co2e_evitado_kg', evitadoLiquidoTotal)
  $app.save(loteRec)

  return e.json(201, {
    sucesso: true,
    lote_id: loteRec.id,
    calculo: {
      versao_metodologia: 'DM-ORB-001-v1.1',
      evitado_bruto_kg: Math.floor(somaEvitadoBruto * 100) / 100,
      pe_lote_kg: peLoteTotal,
      evitado_liquido_kg: evitadoLiquidoTotal,
      evitado_confirmado_kg: evitadoConfirmadoTotal,
      evitado_refrigerante_kg: evitadoRefrigerante,
      incerteza_pct: incertezaPct,
      incerteza_kg: incertezaAbsoluta,
      tiers: {
        T1: Math.floor(t1Total * 100) / 100,
        T2: Math.floor(t2Total * 100) / 100,
        T3: Math.floor(t3Total * 100) / 100,
        T4: Math.floor(t4Total * 100) / 100,
      },
      segregacao: {
        fossil_kg: evitadoLiquidoTotal,
        biogenico_kg: 0,
        total_kg: evitadoLiquidoTotal,
      },
      df_aplicado: df,
      li_aplicado: li,
      fatores_snapshot: fatoresSnapshot,
    },
    claims: claimsEmitidos,
    dedup: {
      verificado: true,
      conflitos: [],
    },
    pecas: pecasProcessadas,
  })
})

/**
 * Consulta pública de claims por chassi (registro público de custódia - sem dados pessoais LGPD)
 * Endpoint: GET /backend/v2/verificador/claim/:chassi
 */
routerAdd('GET', '/backend/v2/verificador/claim/{chassi}', (e) => {
  const chassiParam = e.request.pathValue('chassi') || ''
  const chassiClean = String(chassiParam).trim().toUpperCase()

  if (!chassiClean) {
    return e.json(400, {
      sucesso: false,
      erro: 'Informe o chassi para consulta no registro público de claims.',
    })
  }

  let claims = []
  try {
    claims = $app.findRecordsByFilter('cdv_claims', `chassi = "${chassiClean}"`, '-created', 50, 0)
  } catch (_) {
    claims = []
  }

  const publicClaims = claims.map((c) => ({
    sku: c.getString('sku'),
    selo_dpp: c.getString('selo_dpp'),
    detentor_cnpj_mascarado: c.getString('cdv_cnpj')
      ? c.getString('cdv_cnpj').slice(0, 8) + '****/??'
      : 'DETENTOR HOMOLOGADO',
    status: c.getString('status'),
    hash_claim: c.getString('hash_claim'),
    data_registro: c.getString('created'),
  }))

  return e.json(200, {
    sucesso: true,
    chassi_consultado: chassiClean,
    total_claims_ativos: publicClaims.length,
    claims: publicClaims,
    nota_lgpd:
      'Registro público de custódia dMRV conforme DM-ORB-001 v1.1 §5.3 e §8. Dados pessoais protegidos pela LGPD.',
  })
})
