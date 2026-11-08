routerAdd('GET', '/backend/v1/cdv/pecas/{selo}', (e) => {
  const seloParam = e.request.pathValue('selo') || ''
  const seloUpper = String(seloParam).trim().toUpperCase()

  if (!seloUpper) {
    return e.json(400, {
      sucesso: false,
      erro: 'Informe o selo DPP da peça (ex: PR-SEAL-2026-991823).',
    })
  }

  let pecaRec
  try {
    pecaRec = $app.findFirstRecordByData('cdv_pecas', 'selo_dpp', seloUpper)
  } catch (_) {
    return e.json(404, {
      sucesso: false,
      erro: 'Passaporte Digital da Peça (DPP) não encontrado para o selo informado.',
      selo: seloUpper,
    })
  }

  // Resposta pública mínima para o widget e verificação rápida
  return e.json(200, {
    sucesso: true,
    selo: pecaRec.getString('selo_dpp'),
    sku: pecaRec.getString('sku_interno'),
    peca: pecaRec.getString('descricao_peca'),
    categoria_material: pecaRec.getString('categoria_material'),
    material: pecaRec.getString('material_declarado'),
    peso_kg: pecaRec.getFloat('peso_kg'),
    ncm: pecaRec.getString('ncm'),
    co2e_evitado_kg: pecaRec.getFloat('co2e_evitado_kg'),
    fator_co2e_kg: pecaRec.getFloat('fator_co2e_kg'),
    veiculo_doador: {
      marca_modelo: pecaRec.getString('veiculo_marca_modelo'),
      chassi_mascarado: pecaRec.getString('veiculo_chassi_mascarado'),
      baixa_detran: pecaRec.getString('veiculo_baixa_detran'),
      seguradora_sinistro: pecaRec.getString('veiculo_seguradora'),
    },
    cdv_origem: pecaRec.getString('cdv_origem'),
    cdv_cnpj: pecaRec.getString('cdv_cnpj'),
    responsavel_crea: pecaRec.getString('responsavel_crea'),
    hash_sha256: pecaRec.getString('hash_sha256'),
    status: pecaRec.getString('status'),
    data_emissao: pecaRec.getString('created'),
    passaporte_url: `/passaporte/${pecaRec.getString('selo_dpp')}`,
    widget_snippet: `<div class="orbis-eco-seal" data-seal="${pecaRec.getString('selo_dpp')}" data-co2="${pecaRec.getFloat('co2e_evitado_kg')}kg">🌱 Peça Circular: -${pecaRec.getFloat('co2e_evitado_kg')}kg CO₂e</div>`,
  })
})

/**
 * Consulta pública autenticada por hash ou chave de lote no Verificador / Passaporte Consolidado
 * Permite que o Verificador Público e a tela de Passaporte Público de Lote consultem um lote específico
 * por identificador (ID, baixa DETRAN, cartela de desmontagem ou selo) sem abrir a listagem irrestrita da coleção.
 */
routerAdd('GET', '/backend/v1/cdv/lotes/publico/{identificador}', (e) => {
  const rawId = (e.request.pathValue('identificador') || '').trim()
  if (!rawId) {
    return e.json(400, { sucesso: false, erro: 'Identificador do lote ausente.' })
  }

  let loteRec = null

  // 1. Tenta por ID
  if (/^[a-z0-9]{15}$/i.test(rawId)) {
    try {
      loteRec = $app.findRecordById('cdv_lotes', rawId)
    } catch (_) {}
  }

  // 2. Se não encontrou por ID, busca por veiculo_baixa_detran ou cartela_desmontagem ou cdv_codigo
  if (!loteRec) {
    try {
      loteRec = $app.findFirstRecordByData('cdv_lotes', 'veiculo_baixa_detran', rawId)
    } catch (_) {}
  }

  if (!loteRec) {
    try {
      loteRec = $app.findFirstRecordByData('cdv_lotes', 'cartela_desmontagem', rawId)
    } catch (_) {}
  }

  if (!loteRec) {
    try {
      loteRec = $app.findFirstRecordByData('cdv_lotes', 'cdv_codigo', rawId)
    } catch (_) {}
  }

  if (!loteRec) {
    return e.json(404, { sucesso: false, erro: 'Lote não encontrado.' })
  }

  // Busca as peças vinculadas ao lote
  const pecasRecords = $app.findRecordsByFilter(
    'cdv_pecas',
    `lote = "${loteRec.id}"`,
    'categoria_material,descricao_peca',
    500,
    0,
  )

  const pecas = pecasRecords.map((p) => ({
    id: p.id,
    lote: p.getString('lote'),
    sku_interno: p.getString('sku_interno'),
    selo_dpp: p.getString('selo_dpp'),
    descricao_peca: p.getString('descricao_peca'),
    categoria_material: p.getString('categoria_material'),
    material_declarado: p.getString('material_declarado'),
    peso_kg: p.getFloat('peso_kg'),
    ncm: p.getString('ncm'),
    fator_co2e_kg: p.getFloat('fator_co2e_kg'),
    co2e_evitado_kg: p.getFloat('co2e_evitado_kg'),
    hash_sha256: p.getString('hash_sha256'),
    responsavel_crea: p.getString('responsavel_crea'),
    cdv_origem: p.getString('cdv_origem'),
    cdv_cnpj: p.getString('cdv_cnpj'),
    status: p.getString('status'),
    veiculo_marca_modelo: p.getString('veiculo_marca_modelo'),
    veiculo_chassi_mascarado: p.getString('veiculo_chassi_mascarado'),
    veiculo_baixa_detran: p.getString('veiculo_baixa_detran'),
    veiculo_seguradora: p.getString('veiculo_seguradora'),
    subsistema: p.getString('subsistema'),
    origem: p.getString('origem'),
    created: p.getString('created'),
    updated: p.getString('updated'),
  }))

  return e.json(200, {
    sucesso: true,
    lote: {
      id: loteRec.id,
      cdv_nome: loteRec.getString('cdv_nome'),
      cdv_cnpj: loteRec.getString('cdv_cnpj'),
      cdv_codigo: loteRec.getString('cdv_codigo'),
      veiculo_marca_modelo: loteRec.getString('veiculo_marca_modelo'),
      veiculo_chassi: loteRec.getString('veiculo_chassi'),
      veiculo_placa: loteRec.getString('veiculo_placa'),
      veiculo_baixa_detran: loteRec.getString('veiculo_baixa_detran'),
      veiculo_seguradora: loteRec.getString('veiculo_seguradora'),
      origem_envio: loteRec.getString('origem_envio'),
      status: loteRec.getString('status'),
      total_pecas: loteRec.getInt('total_pecas'),
      total_peso_kg: loteRec.getFloat('total_peso_kg'),
      total_co2e_evitado_kg: loteRec.getFloat('total_co2e_evitado_kg'),
      is_demo: loteRec.getBool('is_demo'),
      cartela_desmontagem: loteRec.getString('cartela_desmontagem'),
      ctf_ibama: loteRec.getString('ctf_ibama'),
      selo_detran_lote: loteRec.getString('selo_detran_lote'),
      origem: loteRec.getString('origem'),
      created: loteRec.getString('created'),
      updated: loteRec.getString('updated'),
    },
    pecas,
  })
})
