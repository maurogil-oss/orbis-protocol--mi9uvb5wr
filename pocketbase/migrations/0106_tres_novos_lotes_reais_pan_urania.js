migrate(
  (app) => {
    // -------------------------------------------------------------------------
    // MIGRATION 0106: GRAVAÇÃO DE 3 NOVOS LOTES REAIS PAN URANIA (SEGUNDO CONJUNTO DE DANFEs)
    // Emitente comum: PAN URANIA SISTEMAS DE PAINEIS PARA CONST PRE-FABRICADA LTDA
    // CNPJ Emitente: 17.024.577/0001-36 | São Caetano do Sul/SP
    //
    // LOTE A: NF-e 153 (26/08/2021) -> TRATA SOLUCOES ACUSTICAS EIRELI, CNPJ 07.495.598/0001-86, São Paulo/SP
    //   - Painel Parete Mec PU 11800x1000x50 RAL9002 (16 un x 11,8 m² = 188,80 m²)
    //   - Miolo de PU (Poliuretano) declarado no código P1PAN NCM/050
    //   - Massa total: 2.171,20 kg (Aço: 1.888,00 kg @ 2,18 | PU: 283,20 kg @ 1,90 [Pendente])
    //   - Evitado: 1.396,57 kgCO2e | Bruto: 4.655,27 kgCO2e (DF=0,30)
    //
    // LOTE B: NF-e 154 (13/09/2021) -> EVERISOL INDUSTRIA E COMERCIO LTDA, CNPJ 42.426.025/0001-00, Pirassununga/SP
    //   - Três itens: 80mm (100,80 m²), 50mm (3,60 m²), 50mm (27,00 m²) -> Total 131,40 m² (68 un)
    //   - Código PANMFL (hipótese lã mineral/rocha com flag de auditoria, incerta)
    //   - Massa total: 1.890,72 kg (Aço: 1.488,48 kg @ 2,18 | Lã: 402,24 kg @ 1,50 [Pendente])
    //   - Evitado: 1.153,91 kgCO2e | Bruto: 3.846,39 kgCO2e (DF=0,30)
    //
    // LOTE C: NF-e 155 (04/11/2021) -> MT SOLUCOES LTDA, CNPJ 05.099.636/0001-56, Mococa/SP
    //   - 139 un x 0,9 m² = 125,10 m² | P3/0160 PANZ10/050 C73F (mesmo código do lote VERTEC IW29)
    //   - Ficha técnica IW29 direta: 15,60 kg/m² -> Massa total: 1.951,56 kg (Aço 60,38% 1.178,35 kg | Lã 39,62% 773,21 kg)
    //   - Evitado: 1.118,52 kgCO2e | Bruto: 3.728,40 kgCO2e (DF=0,30)
    // -------------------------------------------------------------------------

    const lotes = [
      // =======================================================================
      // LOTE A: NF-e 153 -> TRATA SOLUCOES ACUSTICAS
      // =======================================================================
      {
        id: 'panu153trata21',
        cdv_nome: 'Pan Urania / TRATA SOLUCOES ACUSTICAS EIRELI',
        cdv_cnpj: '07.495.598/0001-86',
        cdv_codigo: 'PANU-NFE153-2021',
        veiculo_marca_modelo: 'Painel Termoacústico PU 50mm Pan Urania P1PAN (NF 153)',
        origem: 'importado_manual_com_documento',
        total_pecas: 16,
        total_peso_kg: 2171.2,
        total_co2e_evitado_kg: 1396.57,
        payload_bruto: {
          tipo: 'lote_industrial_documental_nfe_real',
          numero_nfe: '153',
          serie: '1',
          data_emissao: '2021-08-26',
          chave_acesso: '35210817024577000136550010000001531080520000',
          protocolo_autorizacao: '135210987310009 - 26/08/2021 11:38',
          emitente: {
            razao_social: 'PAN URANIA SISTEMAS DE PAINEIS PARA CONST PRE-FABRICADA LTDA',
            cnpj: '17.024.577/0001-36',
            municipio: 'Sao Caetano do Sul',
            uf: 'SP',
          },
          destinatario: {
            razao_social: 'TRATA SOLUCOES ACUSTICAS EIRELI',
            cnpj: '07.495.598/0001-86',
            municipio: 'Sao Paulo',
            uf: 'SP',
            endereco: 'RUA TAMAINDE, 275 - VILA NOVA MANCHESTER - CEP 03444-000',
          },
          produtos: [
            {
              codigo: 'P1PANNCM/050',
              descricao: 'PANNELLI PARETE MEC PU 11800X1000X50 RAL9002',
              ncm: '7308.90.90',
              cfop: '5102',
              unidade: 'UN',
              quantidade: 16,
              valor_unitario: 1785.72,
              valor_total: 28571.52,
              dimensoes: '11800x1000x50 mm (1,18 x 1,00 m = 11,8 m²/un)',
              metragem_total_m2: 188.8,
            },
          ],
          valores_fiscais: {
            valor_produtos: 28571.52,
            base_calculo_icms: 28571.52,
            valor_icms: 5142.87,
            valor_ipi: 1428.58,
            valor_total_nota: 30000.1,
          },
          etiqueta: 'preliminar — não substitui laudo pericial',
          flags_auditoria: [
            '[CONFIRMADO — NF-e 153]: metragem total 188,80 m² (16 un de 11,8 m²), valor produtos R$ 28.571,52, total R$ 30.000,10, NCM 7308.90.90.',
            '[CONFIRMADO — declaração produto]: Miolo de PU (poliuretano) declarado no próprio código comercial (P1PAN NCM/050 PANNELLI PARETE MEC PU 11800X1000X50).',
            '[Hipótese de decomposição mássica]: painel sanduíche 50 mm com chapa de aço 0,5/0,5 mm (10,00 kg/m² de aço) e núcleo de poliuretano expandido (densidade ~30 kg/m³ = 1,50 kg/m²; total 11,50 kg/m²). Registrado com flag de auditoria.',
            '[Lacuna de catálogo — Pendente de verificação de fonte]: polímeros (PU) utiliza fator proxy 1,90 kgCO₂e/kg (PlasticsEurope / catálogo Orbis v2025.2 [Pendente de verificação de fonte]).',
          ],
          metricas_derivadas: {
            area_total_m2: 188.8,
            faturamento_total: 30000.1,
            valor_produtos: 28571.52,
            total_co2e_bruto_kg: 4655.27,
            total_co2e_evitado_kg: 1396.57,
            df_aplicado: 0.3,
            intensidade_co2e_por_real: 0.04655,
            intensidade_co2e_por_m2: 7.397,
            intensidade_bruta_kg_por_m2: 24.657,
            intensidade_bruta_kg_por_real: 0.15517,
          },
        },
        pecas: [
          {
            id: 'panu153pcaaco1',
            sku: 'PANU-153-ACO-PU50',
            selo_dpp: 'BR-ORB-2021-PANU-153-01',
            descricao: 'Chapas de Aço Galvanizado Parete MEC 50mm (188,80 m²)',
            categoria: 'aco',
            material_declarado: 'Aço Laminado Galvanizado Estrutural (0,5mm faces)',
            peso_kg: 1888.0,
            fator: 2.18,
            co2e_evitado: 1234.75,
            ncm: '7308.90.90',
            subsistema: 'Chapas Metálicas Autoportantes',
          },
          {
            id: 'panu153pcapu2',
            sku: 'PANU-153-POL-PU50',
            selo_dpp: 'BR-ORB-2021-PANU-153-02',
            descricao: 'Núcleo Isolante de Poliuretano (PU) 50mm (188,80 m²)',
            categoria: 'polimeros',
            material_declarado: 'Poliuretano Expandido Rígido (PU) ~30 kg/m³',
            peso_kg: 283.2,
            fator: 1.9,
            co2e_evitado: 161.42,
            ncm: '3921.13.00',
            subsistema: 'Núcleo Isolante Polimérico',
          },
        ],
      },

      // =======================================================================
      // LOTE B: NF-e 154 -> EVERISOL INDUSTRIA E COMERCIO
      // =======================================================================
      {
        id: 'panu154everi21',
        cdv_nome: 'Pan Urania / EVERISOL INDUSTRIA E COMERCIO LTDA',
        cdv_cnpj: '42.426.025/0001-00',
        cdv_codigo: 'PANU-NFE154-2021',
        veiculo_marca_modelo: 'Painéis Termoacústicos PANMFL 80mm/50mm Pan Urania (NF 154)',
        origem: 'importado_manual_com_documento',
        total_pecas: 68,
        total_peso_kg: 1890.72,
        total_co2e_evitado_kg: 1153.91,
        payload_bruto: {
          tipo: 'lote_industrial_documental_nfe_real',
          numero_nfe: '154',
          serie: '1',
          data_emissao: '2021-09-13',
          chave_acesso: '35210917024577000136550010000001541030050869',
          protocolo_autorizacao: '135211061713695 - 13/09/2021 10:32',
          emitente: {
            razao_social: 'PAN URANIA SISTEMAS DE PAINEIS PARA CONST PRE-FABRICADA LTDA',
            cnpj: '17.024.577/0001-36',
            municipio: 'Sao Caetano do Sul',
            uf: 'SP',
          },
          destinatario: {
            razao_social: 'EVERISOL INDUSTRIA E COMERCIO LTDA',
            cnpj: '42.426.025/0001-00',
            municipio: 'Pirassununga',
            uf: 'SP',
            endereco: 'RUA JOAQUIM PROCOPIO DE ARAUJO, 2581 - CENTRO - CEP 13631-020',
          },
          produtos: [
            {
              codigo: 'P2/0176',
              descricao: 'PANMFL/080 C73X-C73L 0450X4000x80 mm',
              ncm: '7308.90.90',
              cfop: '5102',
              unidade: 'UN',
              quantidade: 56,
              valor_unitario: 629.2563,
              valor_total: 35238.35,
              dimensoes: '0450x4000x80 mm (1,80 m²/un)',
              metragem_total_m2: 100.8,
            },
            {
              codigo: 'P2/0171',
              descricao: 'PANMFL/050 C73X-C73L 0450x4000x50 mm',
              ncm: '7308.90.90',
              cfop: '5102',
              unidade: 'UN',
              quantidade: 2,
              valor_unitario: 448.164,
              valor_total: 896.33,
              dimensoes: '0450x4000x50 mm (1,80 m²/un)',
              metragem_total_m2: 3.6,
            },
            {
              codigo: 'P2/0170',
              descricao: 'PANMFL/050 C73X-C73L 0450x6000x50 mm',
              ncm: '7308.90.90',
              cfop: '5102',
              unidade: 'UN',
              quantidade: 10,
              valor_unitario: 672.246,
              valor_total: 6722.46,
              dimensoes: '0450x6000x50 mm (2,70 m²/un)',
              metragem_total_m2: 27.0,
            },
          ],
          valores_fiscais: {
            valor_produtos: 42857.14,
            base_calculo_icms: 42857.14,
            valor_icms: 7714.28,
            valor_ipi: 2142.86,
            valor_total_nota: 45000.0,
          },
          etiqueta: 'preliminar — não substitui laudo pericial',
          flags_auditoria: [
            '[CONFIRMADO — NF-e 154]: 3 itens totalizando 68 un, 131,40 m² (100,80 m² 80mm + 30,60 m² 50mm), valor produtos R$ 42.857,14, total R$ 45.000,00, NCM 7308.90.90.',
            '[HIPÓTESE DE AUDITORIA — identificação PANMFL]: código PANMFL é incerto na ausência de ficha técnica específica do fabricante. Assume-se como hipótese mineral wool/lã de rocha ou lã de vidro com flag de auditoria explícita (não fato confirmado).',
            '[Hipótese de decomposição mássica]: painel 50 mm (30,60 m²) com 10,80 kg/m² de aço e 2,00 kg/m² de lã mineral (densidade ~40 kg/m³; total 12,80 kg/m²); painel 80 mm (100,80 m²) com 11,50 kg/m² de aço e 3,40 kg/m² de lã mineral (densidade ~42,5 kg/m³; total 14,90 kg/m²). Registrado com flag.',
            '[Lacuna de catálogo — Pendente de verificação de fonte]: núcleo mineral usa proxy 1,50 kgCO₂e/kg (Tier 1 ±10% [Pendente de verificação de fonte]).',
          ],
          metricas_derivadas: {
            area_total_m2: 131.4,
            faturamento_total: 45000.0,
            valor_produtos: 42857.14,
            total_co2e_bruto_kg: 3846.39,
            total_co2e_evitado_kg: 1153.91,
            df_aplicado: 0.3,
            intensidade_co2e_por_real: 0.02564,
            intensidade_co2e_por_m2: 8.7816,
            intensidade_bruta_kg_por_m2: 29.2724,
            intensidade_bruta_kg_por_real: 0.08548,
          },
        },
        pecas: [
          {
            id: 'panu154pcaaco1',
            sku: 'PANU-154-ACO-MFL',
            selo_dpp: 'BR-ORB-2021-PANU-154-01',
            descricao: 'Chapas de Aço Galvanizado PANMFL 80mm/50mm (131,40 m²)',
            categoria: 'aco',
            material_declarado: 'Aço Laminado Galvanizado Estrutural (chapas C73X-C73L)',
            peso_kg: 1488.48,
            fator: 2.18,
            co2e_evitado: 973.47,
            ncm: '7308.90.90',
            subsistema: 'Chapas Metálicas Autoportantes',
          },
          {
            id: 'panu154pcald2',
            sku: 'PANU-154-LDR-MFL',
            selo_dpp: 'BR-ORB-2021-PANU-154-02',
            descricao: 'Núcleo Isolante Mineral PANMFL (Hipótese Lã de Rocha 80/50mm)',
            categoria: 'la_de_rocha',
            material_declarado: 'Lã Mineral/Rocha (Hipótese não confirmada por ficha técnica)',
            peso_kg: 402.24,
            fator: 1.5,
            co2e_evitado: 180.44,
            ncm: '6806.10.00',
            subsistema: 'Núcleo Isolante Mineral',
          },
        ],
      },

      // =======================================================================
      // LOTE C: NF-e 155 -> MT SOLUCOES LTDA
      // =======================================================================
      {
        id: 'panu155mtsol21',
        cdv_nome: 'Pan Urania / MT SOLUCOES LTDA',
        cdv_cnpj: '05.099.636/0001-56',
        cdv_codigo: 'PANU-NFE155-2021',
        veiculo_marca_modelo: 'Painel Termoacústico Pan Urania IW29 50mm (NF 155)',
        origem: 'importado_manual_com_documento',
        total_pecas: 139,
        total_peso_kg: 1951.56,
        total_co2e_evitado_kg: 1118.52,
        payload_bruto: {
          tipo: 'lote_industrial_documental_nfe_real',
          numero_nfe: '155',
          serie: '1',
          data_emissao: '2021-11-04',
          chave_acesso: '35211117024577000136550010000001551030050860',
          protocolo_autorizacao: '135211303934135 - 04/11/2021 11:00',
          emitente: {
            razao_social: 'PAN URANIA SISTEMAS DE PAINEIS PARA CONST PRE-FABRICADA LTDA',
            cnpj: '17.024.577/0001-36',
            municipio: 'Sao Caetano do Sul',
            uf: 'SP',
          },
          destinatario: {
            razao_social: 'MT SOLUCOES LTDA',
            cnpj: '05.099.636/0001-56',
            municipio: 'Mococa',
            uf: 'SP',
            endereco: 'ROD SP-340, S/N - KM 268-5 CONJUNTO HABITACIONAL - CEP 13737-627',
          },
          produtos: [
            {
              codigo: 'P3/0160',
              descricao: 'PANZ10/050 C73F - 0300x3000x50',
              ncm: '7308.90.90',
              cfop: '5102',
              unidade: 'UN',
              quantidade: 139,
              valor_unitario: 160.0,
              valor_total: 22240.0,
              dimensoes: '0300x3000x50 mm (0,90 m²/un)',
              metragem_total_m2: 125.1,
            },
          ],
          valores_fiscais: {
            valor_produtos: 22240.0,
            base_calculo_icms: 23352.0,
            valor_icms: 4203.36,
            valor_ipi: 1112.0,
            valor_total_nota: 23352.0,
          },
          etiqueta: 'preliminar — não substitui laudo pericial',
          flags_auditoria: [
            '[CONFIRMADO — NF-e 155]: 139 un x 0,90 m² = 125,10 m², valor produtos R$ 22.240,00, total R$ 23.352,00, CFOP 5102 "Mercadoria destinada a Consumidor Final".',
            '[CONFIRMADO — ficha técnica Pan Urania IW29 direta]: mesmo código de produto do lote VERTEC-IW29-2022 (P3/0160 PANZ10/050 C73F); peso próprio 15,60 kg/m² (aço 9,42 kg/m² = 60,38% / lã de rocha 6,18 kg/m² = 39,62%).',
            '[Hipótese residual — confirmar com fabricante]: correspondência entre código comercial PANZ10/050 C73F e a configuração IW29 mantida idêntica ao lote VERTEC.',
            '[Lacuna de catálogo — Pendente de verificação de fonte]: lã de rocha usa proxy 1,50 kgCO₂e/kg (Tier 1 ±10% [Pendente de verificação de fonte]).',
          ],
          metricas_derivadas: {
            area_total_m2: 125.1,
            faturamento_total: 23352.0,
            valor_produtos: 22240.0,
            total_co2e_bruto_kg: 3728.4,
            total_co2e_evitado_kg: 1118.52,
            df_aplicado: 0.3,
            intensidade_co2e_por_real: 0.0479,
            intensidade_co2e_por_m2: 8.941,
            intensidade_bruta_kg_por_m2: 29.803,
            intensidade_bruta_kg_por_real: 0.15966,
          },
          documento_comprovatorio: {
            catalogo_referencia: 'Pan Urania Uran Sound Insulation Wall IW29',
            propriedades: {
              largura_mm: 300,
              comprimento_mm: 3000,
              espessura_mm: 50,
              peso_proprio_kg_m2: 15.6,
              chapas: 'interior 0,5 mm perfurada / exterior 0,7 mm sólida',
              densidade_la_rocha_aprox_kg_m3: 124,
            },
          },
        },
        pecas: [
          {
            id: 'panu155pcaaco1',
            sku: 'PANU-155-ACO-IW29',
            selo_dpp: 'BR-ORB-2021-PANU-155-01',
            descricao: 'Chapas de Aço Galvanizado IW29 50mm (125,10 m²)',
            categoria: 'aco',
            material_declarado:
              'Aço Laminado Galvanizado Estrutural (0,5mm perfurada + 0,7mm sólida)',
            peso_kg: 1178.35,
            fator: 2.18,
            co2e_evitado: 770.64,
            ncm: '7308.90.90',
            subsistema: 'Chapas Metálicas Autoportantes',
          },
          {
            id: 'panu155pcald2',
            sku: 'PANU-155-LDR-IW29',
            selo_dpp: 'BR-ORB-2021-PANU-155-02',
            descricao: 'Núcleo Lã de Rocha 50 mm IW29 (~124 kg/m³)',
            categoria: 'la_de_rocha',
            material_declarado: 'Lã de Rocha Basáltica Mineral 50mm (~124 kg/m³)',
            peso_kg: 773.21,
            fator: 1.5,
            co2e_evitado: 347.88,
            ncm: '6806.10.00',
            subsistema: 'Núcleo Isolante Termoacústico',
          },
        ],
      },
    ]

    for (const lt of lotes) {
      const payloadJsonStr = JSON.stringify(lt.payload_bruto)

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
          id: lt.id,
          cdv_nome: lt.cdv_nome,
          cdv_cnpj: lt.cdv_cnpj,
          cdv_codigo: lt.cdv_codigo,
          veiculo_marca_modelo: lt.veiculo_marca_modelo,
          origem: lt.origem,
          total_pecas: lt.total_pecas,
          total_peso_kg: lt.total_peso_kg,
          total_co2e_evitado_kg: lt.total_co2e_evitado_kg,
          payload_bruto_json: payloadJsonStr,
        })
        .execute()

      console.log(
        '[Migration 0106] Lote real ' +
          lt.cdv_codigo +
          ' gravado em cdv_lotes (id: ' +
          lt.id +
          ').',
      )

      for (const p of lt.pecas) {
        const canonicalStr = `${p.selo_dpp}|${p.sku}|${p.descricao}|${p.peso_kg.toFixed(2)}|${p.co2e_evitado.toFixed(2)}|${lt.cdv_codigo}|${lt.cdv_cnpj}`
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
            lote: lt.id,
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
            cdv_origem: lt.cdv_codigo,
            cdv_cnpj: lt.cdv_cnpj,
            origem: lt.origem,
            subsistema: p.subsistema,
          })
          .execute()

        console.log(
          '[Migration 0106] Peça gravada com sucesso: ' + p.sku + ' (' + p.selo_dpp + ').',
        )
      }
    }
  },
  (app) => {
    try {
      const lotesIds = ['panu153trata21', 'panu154everi21', 'panu155mtsol21']
      for (const id of lotesIds) {
        app.db().newQuery('DELETE FROM cdv_pecas WHERE lote = {:id}').bind({ id }).execute()
        app.db().newQuery('DELETE FROM cdv_lotes WHERE id = {:id}').bind({ id }).execute()
      }
    } catch (_) {}
  },
)
