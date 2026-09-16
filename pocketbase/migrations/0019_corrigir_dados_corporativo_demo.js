migrate(
  (app) => {
    // Atualizar os registros da demonstração corporativa na coleção corporativo_demo
    // 1. Dossiê consolidado:
    //    Escopo 2 recalculado: 310.8 - 0.2 = 310.6 tCO₂e
    //    Total consolidado: 480.2 + 310.6 + 629.5 = 1420.3 tCO₂e
    //    Amostra 12 notas fóssil: 12.71 tCO₂e (12.7103 t)
    //    Amostra 12 notas biogênico: 2.44 tCO₂e (2440 kg = 768 + 1672)
    //    Amostra 12 notas insetting: 1.13 tCO₂e (1125 kg)
    //    Score ESG permanece 840 / 1000
    try {
      const dossieRec = app.findFirstRecordByData(
        'corporativo_demo',
        'slug',
        'dossie-industrias-logistica-brasil',
      )
      const dj = dossieRec.get('detalhes_json') || {}
      dj.escopo2_tco2e = 310.6
      dj.total_emissoes_tco2e = 1420.3
      dj.amostra_12_notas_fossil_tco2e = 12.71
      dj.amostra_12_notas_biogenico_tco2e = 2.44
      dj.amostra_12_notas_insetting_tco2e = 1.13
      dj.duplo_reporte = {
        localizacao_sin_fator: 0.0289, // Fator médio SIN - MCTI 2025 (kgCO₂e/kWh)
        mercado_irec_fator: 0.0,
      }
      dossieRec.set('detalhes_json', dj)
      dossieRec.set('valor_brl', 1420300)
      app.save(dossieRec)
    } catch (e) {
      console.log('Aviso ao atualizar dossiê corporativo demo:', e)
    }

    // 2. Nota 1 (Copel NF3e, Modelo 66, 6.420 kWh):
    //    Fator atualizado para MCTI 2025: 0,0289 kgCO₂e/kWh
    //    Emissão recalculada: 6.420 * 0.0289 = 185.5 kgCO₂e
    //    Fonte explicitando ano-base: "Fator médio SIN – MCTI 2025: 0,0289 kgCO₂e/kWh"
    try {
      const n1 = app.findFirstRecordByData('corporativo_demo', 'slug', 'nota-01-copel-nf3e')
      n1.set('fossil_kg_co2e', 185.5)
      const dj1 = n1.get('detalhes_json') || {}
      dj1.fonte_fator = 'Fator médio SIN – MCTI 2025: 0,0289 kgCO₂e/kWh'
      dj1.fator_numerico = 0.0289
      dj1.ano_base = '2025'
      dj1.duplo_reporte = {
        localizacao_kg: 185.5,
        mercado_irec_kg: 0.0,
      }
      n1.set('detalhes_json', dj1)
      app.save(n1)
    } catch (e) {
      console.log('Aviso ao atualizar nota-01:', e)
    }

    // 3. Nota 2 (Diesel B S10, NF-e Mod 55, 2.150 L):
    //    Biogênico coerente com B14: 2.150 L * 14% * 2.55 kgCO₂/L ≈ 768.0 kgCO₂
    //    Fóssil inalterado: 5.740,5 kgCO₂e
    try {
      const n2 = app.findFirstRecordByData('corporativo_demo', 'slug', 'nota-02-diesel-s10-nfe')
      n2.set('biogenico_kg_co2', 768.0)
      const dj2 = n2.get('detalhes_json') || {}
      dj2.fonte_fator =
        'GHG Protocol BR 2025 (Fator Fóssil 2,670 kgCO₂e/L + Parcela Biodiesel B14: 0,357 kgCO₂/L)'
      dj2.mistura_biodiesel = 'B14'
      dj2.biogenico_fator_numerico = 0.357
      n2.set('detalhes_json', dj2)
      app.save(n2)
    } catch (e) {
      console.log('Aviso ao atualizar nota-02:', e)
    }

    // 4. Nota 4 (Klabin Papelão Ondulado, Mod 55, 4.500 kg):
    //    Memória do Insetting ISO 14067 (virgem x reciclado x delta x massa = 1.125,0 kgCO₂e evitadas)
    //    Intensidade virgem: 0,500 kgCO₂e/kg | Reciclado: 0,250 kgCO₂e/kg | Delta: 0,250 kgCO₂e/kg
    //    Delta (0,250) * 4.500 kg = 1.125,0 kgCO₂e evitadas (1,13 tCO₂e)
    try {
      const n4 = app.findFirstRecordByData(
        'corporativo_demo',
        'slug',
        'nota-04-klabin-papelao-insetting',
      )
      const dj4 = n4.get('detalhes_json') || {}
      dj4.fonte_fator =
        'ISO 14067:2018 / Ecoinvent 3.10 (0,250 kgCO₂e/kg matéria reciclada vs 0,500 kgCO₂e/kg virgem)'
      dj4.insetting_memoria = {
        massa_kg: 4500,
        fator_virgem_kgco2e_kg: 0.5,
        fator_reciclado_kgco2e_kg: 0.25,
        delta_evitado_kgco2e_kg: 0.25,
        total_evitado_kgco2e: 1125.0,
        total_evitado_tco2e: 1.13,
        norma_referencia: 'ISO 14067:2018 / GHG Protocol Corporate Standard (Scope 3 Upstream)',
      }
      n4.set('detalhes_json', dj4)
      app.save(n4)
    } catch (e) {
      console.log('Aviso ao atualizar nota-04:', e)
    }

    // 5. Taxonomia de Tiers para Notas por Gasto Financeiro (R$):
    //    - Nota 7 (TechServices NFS-e, R$ 8.400, 126 kg): Tier 3 (±22.0%), DEFRA/Ecoinvent spending-based
    //    - Nota 12 (Claro NFCom, R$ 2.400, 28,8 kg): Tier 3 (±20.0%), EPA/DEFRA spending-based
    try {
      const n7 = app.findFirstRecordByData(
        'corporativo_demo',
        'slug',
        'nota-07-manutencao-industrial-nfse',
      )
      n7.set('tier_incerteza', 'Tier 3')
      n7.set('incerteza_pct', 22.0)
      const dj7 = n7.get('detalhes_json') || {}
      dj7.metodologia_tier = 'Tier 3 (Spending-based / Gasto financeiro R$ - DEFRA/Ecoinvent 3.10)'
      n7.set('detalhes_json', dj7)
      app.save(n7)
    } catch (e) {
      console.log('Aviso ao atualizar nota-07:', e)
    }

    try {
      const n12 = app.findFirstRecordByData(
        'corporativo_demo',
        'slug',
        'nota-12-claro-nfcom-telecom',
      )
      n12.set('tier_incerteza', 'Tier 3')
      n12.set('incerteza_pct', 20.0)
      const dj12 = n12.get('detalhes_json') || {}
      dj12.metodologia_tier = 'Tier 3 (Spending-based / Gasto financeiro R$ - EPA/DEFRA Telecom)'
      n12.set('detalhes_json', dj12)
      app.save(n12)
    } catch (e) {
      console.log('Aviso ao atualizar nota-12:', e)
    }
  },
  (app) => {
    // Reverter para os valores anteriores caso necessário
    try {
      const dossieRec = app.findFirstRecordByData(
        'corporativo_demo',
        'slug',
        'dossie-industrias-logistica-brasil',
      )
      const dj = dossieRec.get('detalhes_json') || {}
      dj.escopo2_tco2e = 310.8
      dj.total_emissoes_tco2e = 1420.5
      dj.amostra_12_notas_fossil_tco2e = 12.91
      dj.amostra_12_notas_biogenico_tco2e = 2.06
      dj.duplo_reporte = { localizacao_sin_fator: 0.06, mercado_irec_fator: 0.0 }
      dossieRec.set('detalhes_json', dj)
      app.save(dossieRec)
    } catch (_) {}

    try {
      const n1 = app.findFirstRecordByData('corporativo_demo', 'slug', 'nota-01-copel-nf3e')
      n1.set('fossil_kg_co2e', 385.2)
      app.save(n1)
    } catch (_) {}

    try {
      const n2 = app.findFirstRecordByData('corporativo_demo', 'slug', 'nota-02-diesel-s10-nfe')
      n2.set('biogenico_kg_co2', 387.0)
      app.save(n2)
    } catch (_) {}

    try {
      const n7 = app.findFirstRecordByData(
        'corporativo_demo',
        'slug',
        'nota-07-manutencao-industrial-nfse',
      )
      n7.set('tier_incerteza', 'Tier 2')
      n7.set('incerteza_pct', 12.0)
      app.save(n7)
    } catch (_) {}

    try {
      const n12 = app.findFirstRecordByData(
        'corporativo_demo',
        'slug',
        'nota-12-claro-nfcom-telecom',
      )
      n12.set('tier_incerteza', 'Tier 2')
      n12.set('incerteza_pct', 10.0)
      app.save(n12)
    } catch (_) {}
  },
)
