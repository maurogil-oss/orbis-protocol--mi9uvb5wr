routerAdd('GET', '/backend/v1/bureau/passaporte/{token}', (e) => {
  try {
    const token = e.requestInfo().pathParams.token
      ? String(e.requestInfo().pathParams.token).trim()
      : ''

    if (!token) {
      return e.badRequestError('Token do passaporte é obrigatório.')
    }

    let passaporte = null
    try {
      passaporte = $app.findFirstRecordByData('fornecedores_passaportes', 'token_consulta', token)
    } catch (_) {}

    if (!passaporte || !passaporte.getBool('ativo')) {
      return e.notFoundError('Passaporte do Fornecedor não encontrado ou inativo.')
    }

    const config = passaporte.get('config_revelacao_json') || {}

    // FILTRO ESTRITO DE REVELAÇÃO SELETIVA:
    // Nunca retornar preços de venda unitários, margens de lucro ou faturamento/clientes privados.
    // Apenas os blocos expressamente autorizados na config são projetados na resposta pública.
    const respostaPublica = {
      empresa_nome: passaporte.getString('empresa_nome'),
      empresa_cnpj: passaporte.getString('empresa_cnpj'),
      setor_atuacao: passaporte.getString('setor_atuacao'),
      data_inventario_origem: passaporte.getString('data_inventario_origem'),
      hash_integridade: passaporte.getString('hash_integridade'),
      token_consulta: passaporte.getString('token_consulta'),
      banner_confianca: 'Dados periciais verificados — Orbis Protocol (dMRV & NBC TO 3000)',
      data_consulta_utc: new Date().toISOString(),
    }

    if (config.mostrar_kg_co2e_produzido !== false) {
      respostaPublica.kg_co2e_por_kg_produzido = passaporte.getFloat('kg_co2e_por_kg_produzido')
      respostaPublica.peso_produzido_kg_ano = passaporte.getFloat('peso_produzido_kg_ano')
      respostaPublica.emissoes_totais_tco2e = passaporte.getFloat('emissoes_totais_tco2e')
    }

    if (config.mostrar_score_esg !== false) {
      respostaPublica.score_esg = passaporte.getFloat('score_esg')
    }

    if (config.mostrar_matriz_gri !== false) {
      respostaPublica.matriz_gri = passaporte.get('matriz_gri_json')
    }

    if (config.mostrar_certidoes !== false) {
      respostaPublica.certidoes = passaporte.get('certidoes_json')
    }

    if (config.mostrar_curva_mac !== false) {
      respostaPublica.curva_mac = passaporte.get('curva_mac_json')
    }

    if (config.mostrar_dossie_elegibilidade !== false) {
      respostaPublica.dossie_elegibilidade = passaporte.get('dossie_elegibilidade_json')
    }

    return e.json(200, respostaPublica)
  } catch (err) {
    return e.json(500, { error: err.message || 'Erro ao consultar Passaporte do Fornecedor.' })
  }
})
