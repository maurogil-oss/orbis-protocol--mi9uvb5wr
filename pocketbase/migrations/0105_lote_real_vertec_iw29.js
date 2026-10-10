migrate(
  (app) => {
    // -------------------------------------------------------------------------
    // MIGRATION 0105: GRAVAÇÃO DO LOTE REAL CONSOLIDADO VERTEC / PAN URANIA IW29
    // E SUAS 2 PEÇAS COM RASTREABILIDADE DOCUMENTAL (NFs 157 / 158)
    //
    // Dados apurados a partir da ficha técnica Pan Urania IW29:
    // - Painel sanduíche termoacústico autoportante IW29 50mm (15,6 kg/m²)
    // - Área faturada: 136,80 m² (152 painéis de 0,90 m²)
    // - Peso total apurado: 2.134,08 kg
    // - Peça 1: Chapas de aço (0,5 mm perfurada + 0,7 mm sólida), 1.288,66 kg, FE = 2,18 -> Evitado = 842,78 kgCO2e
    // - Peça 2: Núcleo lã de rocha 50 mm (~124 kg/m³), 845,42 kg, FE = 1,50 (proxy) -> Evitado = 380,44 kgCO2e
    // - Total CO2e evitado = 1.223,22 kgCO2e (Bruto 4.077,42 kgCO2e com DF=0,30)
    // -------------------------------------------------------------------------

    // 1. Atualizar schema de cdv_pecas se necessário para aceitar 'la_de_rocha' em categoria_material
    try {
      const pecasCol = app.findCollectionByNameOrId('cdv_pecas')
      const catField = pecasCol.fields.getByName('categoria_material')
      if (catField && Array.isArray(catField.values)) {
        if (!catField.values.includes('la_de_rocha')) {
          catField.values = [
            'aco',
            'aluminio',
            'cobre',
            'polimeros',
            'concreto',
            'agro_rastreado',
            'la_de_rocha',
            'outros',
          ]
          app.save(pecasCol)
          console.log(
            '[Migration 0105] categoria_material em cdv_pecas atualizado com la_de_rocha.',
          )
        }
      }
    } catch (errCol) {
      console.warn(
        '[Migration 0105] Aviso ao verificar/atualizar categoria_material em cdv_pecas:',
        errCol,
      )
    }

    // 2. Gravação do lote real em cdv_lotes
    const loteId = 'vrtclotew292022'
    const cdvCodigo = 'VERTEC-IW29-2022'
    const cdvCnpj = '03.366.187/0001-30'
    const cdvNome = 'Pan Urania / VERTEC Engenheiros Associados Ltda'
    const veiculoModelo = 'Painel Sanduíche Termoacústico Pan Urania IW29 (NFs 157/158)'
    const origem = 'importado_manual_com_documento'
    const totalPecas = 152
    const totalPesoKg = 2134.08
    const totalCo2eEvitadoKg = 1223.22

    const payloadBruto = {
      tipo: 'lote_industrial_documental_consolidado',
      nfs: ['157', '158'],
      datas: ['2022-08-02', '2022-08-03'],
      area_total_m2: 136.8,
      faturamento_total: 30862.65,
      ncm: '7308.90.90',
      codigo_produto: 'P3/0160 PANZ10/050 C73F',
      ficha: 'IW29 50mm',
      etiqueta: 'preliminar — não substitui laudo pericial',
      flags_auditoria: [
        '[CONFIRMADO — ficha técnica Pan Urania IW29]: peso próprio 15,6 kg/m², chapas 0,5/0,7 mm, lã de rocha 50 mm.',
        '[Hipótese residual — confirmar com fabricante]: correspondência exata entre o código comercial da NF (PANZ10/050 C73F) e a configuração IW29 da ficha.',
        '[Lacuna de catálogo — Pendente de verificação de fonte]: lã de rocha usa proxy 1,50 kgCO₂e/kg (Tier 1 ±10%).',
      ],
      metricas_derivadas: {
        total_co2e_bruto_kg: 4077.42,
        total_co2e_evitado_kg: 1223.22,
        df_aplicado: 0.3,
        intensidade_co2e_por_real: 0.0396,
        intensidade_co2e_por_m2: 8.9417,
        intensidade_bruta_kg_por_m2: 29.8057,
        intensidade_bruta_kg_por_real: 0.1321,
      },
      documento_comprovatorio: {
        catalogo_referencia: 'Pan Urania Uran Sound Insulation Wall IW29',
        propriedades: {
          largura_mm: 450,
          espessura_mm: 50,
          peso_proprio_kg_m2: 15.6,
          isolamento_rw_db: 29,
          chapas: 'interior 0,5 mm perfurada / exterior 0,7 mm sólida',
          reacao_fogo: 'A1 Euroclass (EN 13501-1)',
        },
      },
    }

    const payloadJsonStr = JSON.stringify(payloadBruto)

    // Inserção ou atualização do lote via SQL direto para evitar abort de hooks
    app
      .db()
      .newQuery(
        `INSERT INTO cdv_lotes (
          id, cdv_nome, cdv_cnpj, cdv_codigo, veiculo_marca_modelo,
          origem, is_demo, total_pecas, total_peso_kg, total_co2e_evitado_kg,
          status, payload_bruto_json, created, updated
        ) VALUES (
          {:id}, {:cdv_nome}, {:cdv_cnpj}, {:cdv_codigo}, {:veiculo_marca_modelo},
          {:origem}, 0, {:total_pecas}, {:total_peso_kg}, {:total_co2e_evitado_kg},
          'processado', {:payload_bruto_json}, datetime('now'), datetime('now')
        )
        ON CONFLICT(id) DO UPDATE SET
          cdv_nome = {:cdv_nome},
          cdv_cnpj = {:cdv_cnpj},
          cdv_codigo = {:cdv_codigo},
          veiculo_marca_modelo = {:veiculo_marca_modelo},
          origem = {:origem},
          is_demo = 0,
          total_pecas = {:total_pecas},
          total_peso_kg = {:total_peso_kg},
          total_co2e_evitado_kg = {:total_co2e_evitado_kg},
          status = 'processado',
          payload_bruto_json = {:payload_bruto_json},
          updated = datetime('now')`,
      )
      .bind({
        id: loteId,
        cdv_nome: cdvNome,
        cdv_cnpj: cdvCnpj,
        cdv_codigo: cdvCodigo,
        veiculo_marca_modelo: veiculoModelo,
        origem: origem,
        total_pecas: totalPecas,
        total_peso_kg: totalPesoKg,
        total_co2e_evitado_kg: totalCo2eEvitadoKg,
        payload_bruto_json: payloadJsonStr,
      })
      .execute()

    console.log(
      '[Migration 0105] Lote VERTEC gravado com sucesso em cdv_lotes (id: ' + loteId + ').',
    )

    // 3. Gravação das 2 peças vinculadas ao lote pelo campo `lote`
    const pecasData = [
      {
        id: 'vrtcpcaacoiw291',
        sku: 'VERTEC-IW29-ACO',
        selo_dpp: 'BR-ORB-2022-PANU-01',
        descricao: 'Chapas de Aço (0,5 mm perfurada + 0,7 mm sólida)',
        categoria: 'aco',
        material_declarado: 'Aço Laminado Galvanizado Estrutural (0,5mm perfurada + 0,7mm sólida)',
        peso_kg: 1288.66,
        fator: 2.18,
        co2e_evitado: 842.78,
        ncm: '7308.90.90',
        subsistema: 'Chapas Metálicas Autoportantes',
      },
      {
        id: 'vrtcpcaldriw292',
        sku: 'VERTEC-IW29-LDR',
        selo_dpp: 'BR-ORB-2022-PANU-02',
        descricao: 'Núcleo Lã de Rocha 50 mm (~124 kg/m³)',
        categoria: 'la_de_rocha',
        material_declarado: 'Lã de Rocha Basáltica Mineral 50mm (~124 kg/m³)',
        peso_kg: 845.42,
        fator: 1.5,
        co2e_evitado: 380.44,
        ncm: '6806.10.00',
        subsistema: 'Núcleo Isolante Termoacústico',
      },
    ]

    for (const p of pecasData) {
      const canonicalStr = `${p.selo_dpp}|${p.sku}|${p.descricao}|${p.peso_kg.toFixed(2)}|${p.co2e_evitado.toFixed(2)}|${cdvCodigo}|${cdvCnpj}`
      const hashSha = $security.sha256(canonicalStr)

      app
        .db()
        .newQuery(
          `INSERT INTO cdv_pecas (
            id, lote, sku_interno, selo_dpp, descricao_peca,
            categoria_material, material_declarado, peso_kg, ncm,
            fator_co2e_kg, co2e_evitado_kg, hash_sha256, cdv_origem,
            cdv_cnpj, status, origem, subsistema, created, updated
          ) VALUES (
            {:id}, {:lote}, {:sku}, {:selo}, {:descricao},
            {:categoria}, {:material_declarado}, {:peso}, {:ncm},
            {:fator}, {:co2e_evitado}, {:hash}, {:cdv_origem},
            {:cdv_cnpj}, 'ativo', {:origem}, {:subsistema}, datetime('now'), datetime('now')
          )
          ON CONFLICT(id) DO UPDATE SET
            lote = {:lote},
            sku_interno = {:sku},
            selo_dpp = {:selo},
            descricao_peca = {:descricao},
            categoria_material = {:categoria},
            material_declarado = {:material_declarado},
            peso_kg = {:peso},
            ncm = {:ncm},
            fator_co2e_kg = {:fator},
            co2e_evitado_kg = {:co2e_evitado},
            hash_sha256 = {:hash},
            cdv_origem = {:cdv_origem},
            cdv_cnpj = {:cdv_cnpj},
            status = 'ativo',
            origem = {:origem},
            subsistema = {:subsistema},
            updated = datetime('now')`,
        )
        .bind({
          id: p.id,
          lote: loteId,
          sku: p.sku,
          selo: p.selo_dpp,
          descricao: p.descricao,
          categoria: p.categoria,
          material_declarado: p.material_declarado,
          peso: p.peso_kg,
          ncm: p.ncm,
          fator: p.fator,
          co2e_evitado: p.co2e_evitado,
          hash: hashSha,
          cdv_origem: cdvCodigo,
          cdv_cnpj: cdvCnpj,
          origem: origem,
          subsistema: p.subsistema,
        })
        .execute()

      console.log(
        '[Migration 0105] Peça VERTEC gravada com sucesso: ' + p.sku + ' (' + p.selo_dpp + ').',
      )
    }
  },
  (app) => {
    try {
      app.db().newQuery("DELETE FROM cdv_pecas WHERE lote = 'vrtclotew292022'").execute()
      app.db().newQuery("DELETE FROM cdv_lotes WHERE id = 'vrtclotew292022'").execute()
    } catch (_) {}
  },
)
