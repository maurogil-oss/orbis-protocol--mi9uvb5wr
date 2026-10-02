routerAdd('POST', '/backend/v1/cdv/lotes', (e) => {
  const body = e.requestInfo().body || {}
  const apiKeyHeader =
    e.requestInfo().headers['x-api-key'] || e.requestInfo().headers['X-API-Key'] || ''

  if (!apiKeyHeader || !apiKeyHeader.trim()) {
    return e.json(401, {
      sucesso: false,
      erro: 'Chave de API ausente. Informe o header X-API-Key para autenticar o CDV remetente.',
    })
  }

  // 1. Validar a chave contra a base de chaves (hash SHA-256)
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
      erro: 'Esta chave de API está desativada. Gere uma nova no Console de APIs do Painel do Cliente.',
    })
  }

  // 2. Rate limit simples (máx. 60 lotes por minuto por chave de API)
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

  // 3. Payload obrigatório
  if (!body || typeof body !== 'object') {
    return e.json(400, {
      sucesso: false,
      erro: 'Payload JSON inválido. Envie um objeto com cdv, veiculo_doador e pecas.',
    })
  }

  const cdvInfo = body.cdv || {}
  const veiculoInfo = body.veiculo_doador || {}
  const pecasList = Array.isArray(body.pecas) ? body.pecas : []

  if (!veiculoInfo.baixa_detran || !veiculoInfo.marca_modelo || pecasList.length === 0) {
    return e.json(400, {
      sucesso: false,
      erro: 'Payload incompleto. Campos obrigatórios: cdv, veiculo_doador (marca_modelo, baixa_detran) e pecas (array não vazio).',
      payload_exemplo: {
        cdv: { nome: 'CDVerde', cnpj: '76.123.456/0001-12', codigo: 'DETRAN-PR-CDV-0089' },
        veiculo_doador: {
          marca_modelo: 'Volkswagen Gol 1.6 8V',
          chassi: '9BWAA05U0DP999204',
          placa: 'BAX-9912',
          baixa_detran: 'PR-BX-2026-991204',
          seguradora_sinistro: 'Porto Seguro',
        },
        pecas: [
          {
            sku: 'PART-SND-CAPO-01',
            descricao: 'Capô',
            material: 'Aço',
            peso_kg: 14.5,
            ncm: '8708.29.99',
          },
        ],
      },
    })
  }

  // 4. Criar registro do lote e processar peças
  const lotesCol = $app.findCollectionByNameOrId('cdv_lotes')
  const pecasCol = $app.findCollectionByNameOrId('cdv_pecas')

  const cdvNome = cdvInfo.nome || keyRec.getString('cdv_nome')
  const cdvCnpj = cdvInfo.cnpj || keyRec.getString('cdv_cnpj')
  const cdvCodigo = cdvInfo.codigo || keyRec.getString('cdv_codigo')

  const chassiRaw = veiculoInfo.chassi ? String(veiculoInfo.chassi).trim() : ''
  // Mascarar o chassi exibindo apenas os 4 últimos dígitos
  const chassiMascarado =
    chassiRaw.length > 6
      ? chassiRaw.slice(0, chassiRaw.length - 6).replace(/[0-9A-Z]/g, '*') + chassiRaw.slice(-6)
      : chassiRaw

  const anoCorrente = new Date().getFullYear()

  // Fatores de emissão evitada por material (curados)
  const fatoresCo2e = {
    aco: 2.18, // kg CO2e/kg — worldsteel 2025 (GHG 2024)
    aluminio: 14.4, // kg CO2e/kg — Alumínio primário fallback global, IAI 2024
    cobre: 5.4, // kg CO2e/kg — Cobre catódico, ICA/CopperMark 2024
    polimeros: 1.9, // kg CO2e/kg — Polipropileno virgem, PlasticsEurope 2023
  }
  const fatorConservador = 1.5 // kg CO2e/kg estimativa conservadora p/ materiais não listados

  const loteRec = new Record(lotesCol)
  loteRec.set('cdv_nome', cdvNome)
  loteRec.set('cdv_cnpj', cdvCnpj)
  loteRec.set('cdv_codigo', cdvCodigo)
  loteRec.set('api_key_hash', keyHash)
  loteRec.set('veiculo_marca_modelo', String(veiculoInfo.marca_modelo))
  loteRec.set('veiculo_chassi', chassiMascarado)
  loteRec.set('veiculo_placa', veiculoInfo.placa ? String(veiculoInfo.placa).toUpperCase() : '')
  loteRec.set('veiculo_baixa_detran', String(veiculoInfo.baixa_detran).toUpperCase())
  loteRec.set(
    'veiculo_seguradora',
    veiculoInfo.seguradora_sinistro ? String(veiculoInfo.seguradora_sinistro) : '',
  )
  loteRec.set('origem_envio', body.origem || 'erp')
  loteRec.set('payload_bruto_json', body)

  const errosPorItem = []
  const pecasCriadas = []
  let totalPesoKg = 0
  let totalCo2eKg = 0
  let pecasOk = 0

  // Garante unicidade de selo PR-SEAL-{ano}-{6 dígitos}
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

  for (let i = 0; i < pecasList.length; i++) {
    const item = pecasList[i] || {}
    const sku = item.sku ? String(item.sku).trim() : ''
    const descricao = item.descricao ? String(item.descricao).trim() : ''
    const pesoKg = Number(item.peso_kg)
    const ncmRaw = item.ncm ? String(item.ncm).trim() : ''
    const materialRaw = item.material ? String(item.material).trim() : ''

    if (!sku || !descricao) {
      errosPorItem.push({
        indice: i,
        sku: sku || '—',
        erro: 'SKU e descrição da peça são obrigatórios.',
      })
      continue
    }
    if (isNaN(pesoKg) || pesoKg <= 0 || pesoKg > 5000) {
      errosPorItem.push({
        indice: i,
        sku,
        erro: 'peso_kg deve ser um número positivo (máx. 5000 kg).',
      })
      continue
    }
    if (ncmRaw && !/^[0-9]{4}\.?[0-9]{2}\.?[0-9]{2}$/.test(ncmRaw.replace(/\./g, '.'))) {
      errosPorItem.push({
        indice: i,
        sku,
        erro: 'Formato de NCM inválido. Use 0000.00.00 ou 00000000.',
      })
      continue
    }
    const ncmNormalizado = ncmRaw.replace(/\./g, '')
    if (ncmNormalizado && ncmNormalizado.length !== 8) {
      errosPorItem.push({ indice: i, sku, erro: 'NCM deve conter 8 dígitos.' })
      continue
    }
    const ncmFinal = ncmRaw
      ? `${ncmNormalizado.slice(0, 4)}.${ncmNormalizado.slice(4, 6)}.${ncmNormalizado.slice(6)}`
      : ''

    // Classificação do material dominante para aplicar o fator correto
    const matLower = materialRaw.toLowerCase()
    let categoria = 'outros'
    if (
      matLower.includes('aço') ||
      matLower.includes('aco') ||
      matLower.includes('ferro') ||
      matLower.includes('metal') ||
      matLower.includes('lâmina')
    )
      categoria = 'aco'
    else if (matLower.includes('alum') || matLower.includes('alumin')) categoria = 'aluminio'
    else if (matLower.includes('cobre')) categoria = 'cobre'
    else if (
      matLower.includes('poli') ||
      matLower.includes('plast') ||
      matLower.includes('borracha') ||
      matLower.includes('polipropileno')
    )
      categoria = 'polimeros'

    let fatorAplicado = fatoresCo2e[categoria]
    let incerto = false
    if (categoria === 'outros' || fatorAplicado === undefined) {
      fatorAplicado = fatorConservador
      incerto = true
    }

    const co2eEvitadoKg = Number((pesoKg * fatorAplicado).toFixed(2))
    const selo = gerarSeloUnico()

    // Hash SHA-256 de autenticidade
    const baixaNorm = String(veiculoInfo.baixa_detran).toUpperCase().trim()
    const cnpjNorm = String(cdvCnpj).trim()
    const canonicalStr = `${selo}|${sku}|${descricao}|${pesoKg.toFixed(2)}|${co2eEvitadoKg.toFixed(2)}|${baixaNorm}|${cnpjNorm}`
    const sha256 = $security.sha256(canonicalStr)

    const recPeca = new Record(pecasCol)
    recPeca.set('lote', loteRec.id)
    recPeca.set('sku_interno', sku)
    recPeca.set('selo_dpp', selo)
    recPeca.set('descricao_peca', descricao)
    recPeca.set('categoria_material', categoria)
    recPeca.set('material_declarado', materialRaw)
    recPeca.set('peso_kg', pesoKg)
    recPeca.set('ncm', ncmFinal)
    recPeca.set('fator_co2e_kg', fatorAplicado)
    recPeca.set('co2e_evitado_kg', co2eEvitadoKg)
    recPeca.set('hash_sha256', sha256)
    recPeca.set(
      'responsavel_crea',
      item.responsavel_crea || cdvInfo.responsavel_crea || 'CREA a designar pelo CDV',
    )
    recPeca.set('cdv_origem', cdvCodigo)
    recPeca.set('cdv_cnpj', cdvCnpj)
    recPeca.set('status', 'ativo')
    recPeca.set('veiculo_marca_modelo', String(veiculoInfo.marca_modelo))
    recPeca.set('veiculo_chassi_mascarado', chassiMascarado)
    recPeca.set('veiculo_baixa_detran', baixaNorm)
    recPeca.set(
      'veiculo_seguradora',
      veiculoInfo.seguradora_sinistro ? String(veiculoInfo.seguradora_sinistro) : '',
    )

    try {
      $app.save(recPeca)
      pecasOk++
      totalPesoKg += pesoKg
      totalCo2eKg += co2eEvitadoKg
      pecasCriadas.push({
        indice: i,
        sku_interno: sku,
        selo_dpp: selo,
        descricao: descricao,
        peso_kg: pesoKg,
        material_categoria: categoria,
        fator_aplicado: fatorAplicado,
        incerteza_material: incerto,
        ncm: ncmFinal,
        co2e_evitado_kg: co2eEvitadoKg,
        hash_sha256: sha256,
        passaporte_url: `/passaporte/${selo}`,
      })
    } catch (errItem) {
      errosPorItem.push({
        indice: i,
        sku,
        erro: errItem.message || 'Falha ao persistir a peça do DPP.',
      })
    }
  }

  // Finalizar lote com totalizadores
  loteRec.set(
    'status',
    errosPorItem.length === 0 ? 'processado' : pecasOk > 0 ? 'parcial' : 'rejeitado',
  )
  loteRec.set('total_pecas', pecasOk)
  loteRec.set('total_peso_kg', Number(totalPesoKg.toFixed(2)))
  loteRec.set('total_co2e_evitado_kg', Number(totalCo2eKg.toFixed(2)))
  $app.save(loteRec)

  return e.json(201, {
    sucesso: pecasOk > 0,
    lote_id: loteRec.id,
    cdv_origem: cdvCodigo,
    veiculo_doador: {
      marca_modelo: String(veiculoInfo.marca_modelo),
      baixa_detran: String(veiculoInfo.baixa_detran).toUpperCase(),
      chassi_mascarado: chassiMascarado,
      seguradora_sinistro: veiculoInfo.seguradora_sinistro || null,
    },
    total_processado: pecasList.length,
    total_pecas_criadas: pecasOk,
    total_peso_kg: Number(totalPesoKg.toFixed(2)),
    total_co2e_evitado_kg: Number(totalCo2eKg.toFixed(2)),
    pecas: pecasCriadas,
    erros_por_item: errosPorItem,
  })
})
