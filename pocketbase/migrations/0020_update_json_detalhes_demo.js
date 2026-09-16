migrate(
  (app) => {
    // Atualizar os campos detalhes_json via SQL direto e record API com JSON stringificado para o SQLite/PocketBase
    const novoDetalhesDossie = JSON.stringify({
      segmento: 'Manufatura, Logística & Cadeia de Suprimentos',
      localidades: 'Curitiba - PR & São Paulo - SP',
      auditor_crc: 'CRC PR-048.910/O-4',
      auditor_responsavel: 'Dr. Valmor C. Menezes (Auditor Independente Ibracon/CFC)',
      score_esg: 840,
      score_esg_max: 1000,
      escopo1_tco2e: 480.2,
      escopo2_tco2e: 310.6,
      escopo3_tco2e: 629.5,
      total_emissoes_tco2e: 1420.3,
      amostra_12_notas_fossil_tco2e: 12.71,
      amostra_12_notas_biogenico_tco2e: 2.44,
      amostra_12_notas_insetting_tco2e: 1.13,
      hash_integridade: '0x8f4b29a7e3c12948bb92ff78201a0bc45d61e93f91823ab12c',
      padrao_asseguracao: 'ISAE 3000 / NBC TO 3000 (Asseguração Limitada a Razoável)',
      versao_metodologia: 'GHG Protocol Brasil v2025.1 / IPCC AR6 (GWP100)',
      gwp_ar6: { ch4: 27.2, n2o: 273 },
      duplo_reporte: {
        localizacao_sin_fator: 0.0289, // Fator médio SIN - MCTI 2025 (kgCO₂e/kWh)
        mercado_irec_fator: 0.0,
      },
    })

    const novoDetalhesNota1 = JSON.stringify({
      discriminacao: 'Energia Elétrica Ativa - Fornecimento Fático Mercado Cativo / TUSD',
      fonte_fator: 'Fator médio SIN – MCTI 2025: 0,0289 kgCO₂e/kWh',
      fator_numerico: 0.0289,
      ano_base: '2025',
      unidade_fator: 'kg CO₂e/kWh',
      duplo_reporte: {
        localizacao_kg: 185.5,
        mercado_irec_kg: 0.0,
      },
      subcategoria: 'Eletricidade de Rede (Geração Externa)',
      ncm: '2716.00.00',
    })

    const novoDetalhesNota2 = JSON.stringify({
      discriminacao: 'Óleo Diesel B S10 - Abastecimento em Base de Frotas Próprias',
      fonte_fator:
        'GHG Protocol BR 2025 (Fator Fóssil 2,670 kgCO₂e/L + Parcela Biodiesel B14: 0,357 kgCO₂/L)',
      fator_numerico: 2.67,
      unidade_fator: 'kg CO₂e/L',
      combustivel_tipo: 'diesel',
      subcategoria: 'Combustão Móvel - Frota Própria Pesada',
      ncm: '2710.19.21',
      mistura_biodiesel: 'B14',
      biogenico_fator_numerico: 0.357,
    })

    const novoDetalhesNota4 = JSON.stringify({
      discriminacao: 'Caixas de Papelão Ondulado Recicláveis com Insetting ISO 14067',
      fonte_fator:
        'ISO 14067:2018 / Ecoinvent 3.10 (0,250 kgCO₂e/kg matéria reciclada vs 0,500 kgCO₂e/kg virgem)',
      fator_numerico: 0.25,
      insetting_evitado_kg: 1125.0,
      unidade_fator: 'kg CO₂e/kg',
      subcategoria: 'Bens e Serviços Comprados (Cadeia Upstream)',
      ncm: '4819.10.00',
      insetting_memoria: {
        massa_kg: 4500,
        fator_virgem_kgco2e_kg: 0.5,
        fator_reciclado_kgco2e_kg: 0.25,
        delta_evitado_kgco2e_kg: 0.25,
        total_evitado_kgco2e: 1125.0,
        total_evitado_tco2e: 1.13,
        norma_referencia: 'ISO 14067:2018 / GHG Protocol Corporate Standard (Scope 3 Upstream)',
      },
    })

    const novoDetalhesNota7 = JSON.stringify({
      discriminacao: 'NFS-e de Serviços Técnicos de Calibração e Manutenção Preventiva de Planta',
      fonte_fator: 'DEFRA UK / Ecoinvent 3.10 (0,0150 kgCO₂e por R$ gasto em serviços técnicos)',
      fator_numerico: 0.015,
      unidade_fator: 'kg CO₂e/R$',
      subcategoria: 'Serviços Terceirizados & Manutenção Predial',
      metodologia_tier: 'Tier 3 (Spending-based / Gasto financeiro R$ - DEFRA/Ecoinvent 3.10)',
    })

    const novoDetalhesNota12 = JSON.stringify({
      discriminacao:
        'NFCom Modelo 62 - Conectividade de Fibra Óptica e Telecomunicações Corporativas',
      fonte_fator: 'EPA Climate Leaders / DEFRA Telecom (0,0120 kgCO₂e por R$ serviço telecom)',
      fator_numerico: 0.012,
      unidade_fator: 'kg CO₂e/R$',
      subcategoria: 'Serviços de Telecomunicação Corporativa e Nuvem',
      metodologia_tier: 'Tier 3 (Spending-based / Gasto financeiro R$ - EPA/DEFRA Telecom)',
    })

    // Executar updates usando app.db().newQuery para garantir atualização atômica e correta dos JSONs no SQLite
    app
      .db()
      .newQuery(
        'UPDATE corporativo_demo SET detalhes_json = {:dj}, valor_brl = 1420300 WHERE slug = "dossie-industrias-logistica-brasil"',
      )
      .bind({ dj: novoDetalhesDossie })
      .execute()

    app
      .db()
      .newQuery(
        'UPDATE corporativo_demo SET fossil_kg_co2e = 185.5, detalhes_json = {:dj} WHERE slug = "nota-01-copel-nf3e"',
      )
      .bind({ dj: novoDetalhesNota1 })
      .execute()

    app
      .db()
      .newQuery(
        'UPDATE corporativo_demo SET biogenico_kg_co2 = 768.0, detalhes_json = {:dj} WHERE slug = "nota-02-diesel-s10-nfe"',
      )
      .bind({ dj: novoDetalhesNota2 })
      .execute()

    app
      .db()
      .newQuery(
        'UPDATE corporativo_demo SET detalhes_json = {:dj} WHERE slug = "nota-04-klabin-papelao-insetting"',
      )
      .bind({ dj: novoDetalhesNota4 })
      .execute()

    app
      .db()
      .newQuery(
        'UPDATE corporativo_demo SET tier_incerteza = "Tier 3", incerteza_pct = 22.0, detalhes_json = {:dj} WHERE slug = "nota-07-manutencao-industrial-nfse"',
      )
      .bind({ dj: novoDetalhesNota7 })
      .execute()

    app
      .db()
      .newQuery(
        'UPDATE corporativo_demo SET tier_incerteza = "Tier 3", incerteza_pct = 20.0, detalhes_json = {:dj} WHERE slug = "nota-12-claro-nfcom-telecom"',
      )
      .bind({ dj: novoDetalhesNota12 })
      .execute()
  },
  (app) => {
    // Reverter
    app
      .db()
      .newQuery(
        'UPDATE corporativo_demo SET fossil_kg_co2e = 385.2 WHERE slug = "nota-01-copel-nf3e"',
      )
      .execute()
    app
      .db()
      .newQuery(
        'UPDATE corporativo_demo SET biogenico_kg_co2 = 387.0 WHERE slug = "nota-02-diesel-s10-nfe"',
      )
      .execute()
    app
      .db()
      .newQuery(
        'UPDATE corporativo_demo SET tier_incerteza = "Tier 2", incerteza_pct = 12.0 WHERE slug = "nota-07-manutencao-industrial-nfse"',
      )
      .execute()
    app
      .db()
      .newQuery(
        'UPDATE corporativo_demo SET tier_incerteza = "Tier 2", incerteza_pct = 10.0 WHERE slug = "nota-12-claro-nfcom-telecom"',
      )
      .execute()
  },
)
