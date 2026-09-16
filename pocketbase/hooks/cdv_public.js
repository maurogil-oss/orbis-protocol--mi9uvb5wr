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
