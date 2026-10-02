migrate(
  (app) => {
    // -------------------------------------------------------------------------
    // ACHADO 2: Migração do Lote Clio Demo c1jz14hgmf7n13i para o motor v2
    // Metodologia DM-ORB-001 v1.1:
    // Evitado = floor(Q * FE_ref * L_i * DF - PE) com DF = 0,30, L_i = 1,0, PE = 0.
    // Fatores v2:
    // - Aço: 2,18 (worldsteel 2025)
    // - Alumínio: 14,40 (IAI 2024 global default)
    // - Cobre: 5,40 (ICA/CopperMark 2024)
    // - Polímeros: 1,90 (PlasticsEurope)
    // - Outros: 1,50
    // Recalcular evitado por peça com floor2, recomputar hashes canônicos,
    // atualizar total do lote e payload.
    // -------------------------------------------------------------------------

    const loteId = 'c1jz14hgmf7n13i'
    let loteRec
    try {
      loteRec = app.findFirstRecordByData('cdv_lotes', 'id', loteId)
    } catch (_) {
      try {
        loteRec = app.findFirstRecordByData(
          'cdv_lotes',
          'veiculo_baixa_detran',
          'PR-BX-2026-1240105',
        )
      } catch (err) {
        console.warn('[0081] Lote Clio demo não encontrado:', err)
        return
      }
    }

    if (!loteRec) return

    const pecas = app.findRecordsByFilter(
      'cdv_pecas',
      `lote = '${loteRec.id}'`,
      'catalogo_numero',
      150,
      0,
    )

    const fatoresV2 = {
      aco: 2.18,
      aluminio: 14.4,
      cobre: 5.4,
      polimeros: 1.9,
      outros: 1.5,
    }

    const df = 0.3
    const li = 1.0
    const floor2 = (v) => Math.floor(v * 100) / 100

    let somaCo2eTotal = 0
    let somaPesoTotal = 0

    const baixaNorm = loteRec.getString('veiculo_baixa_detran') || 'PR-BX-2026-1240105'
    const cnpjNorm = loteRec.getString('cdv_cnpj') || '76.123.456/0001-00'

    for (let i = 0; i < pecas.length; i++) {
      const p = pecas[i]
      const cat = p.getString('categoria_material') || 'outros'
      const fator = fatoresV2[cat] !== undefined ? fatoresV2[cat] : 1.5
      const peso = Number(p.get('peso_kg')) || 0

      // Cálculo v2 com DF=0,30 e L_i=1,0
      const evitadoBruto = peso * fator * li * df
      const evitado = floor2(evitadoBruto)

      somaCo2eTotal += evitado
      somaPesoTotal += peso

      const selo = p.getString('selo_dpp')
      const sku = p.getString('sku_interno')
      const desc = p.getString('descricao_peca')
      const pesoStr = peso.toFixed(2)
      const evitadoStr = evitado.toFixed(2)

      const canonicalStr = `${selo}|${sku}|${desc}|${pesoStr}|${evitadoStr}|${baixaNorm}|${cnpjNorm}`
      const hashSha = $security.sha256(canonicalStr)

      p.set('fator_co2e_kg', fator)
      p.set('co2e_evitado_kg', evitado)
      p.set('hash_sha256', hashSha)

      try {
        app.save(p)
      } catch (errPeca) {
        console.warn(`[0081] Fallback SQL para peça ${p.id}:`, errPeca)
        app
          .db()
          .newQuery(
            `UPDATE cdv_pecas 
             SET fator_co2e_kg = {:fator}, 
                 co2e_evitado_kg = {:evitado}, 
                 hash_sha256 = {:hash} 
             WHERE id = {:id}`,
          )
          .bind({
            fator: fator,
            evitado: evitado,
            hash: hashSha,
            id: p.id,
          })
          .execute()
      }
    }

    const totalCo2eFinal = floor2(somaCo2eTotal)
    const totalPesoFinal = Math.round(somaPesoTotal * 100) / 100

    loteRec.set('total_co2e_evitado_kg', totalCo2eFinal)
    loteRec.set('total_peso_kg', totalPesoFinal)

    let payload = {}
    try {
      payload = loteRec.get('payload_bruto_json') || {}
      if (typeof payload === 'string') payload = JSON.parse(payload)
    } catch (_) {
      payload = {}
    }
    payload.versao_metodologia = 'DM-ORB-001-v1.1'
    payload.df = df
    payload.li = li
    payload.total_co2e_evitado_kg = totalCo2eFinal
    payload.total_peso_kg = totalPesoFinal
    loteRec.set('payload_bruto_json', payload)

    try {
      app.save(loteRec)
    } catch (errLote) {
      console.warn('[0081] Fallback SQL para lote Clio:', errLote)
      app
        .db()
        .newQuery(
          `UPDATE cdv_lotes 
           SET total_co2e_evitado_kg = {:co2e}, 
               total_peso_kg = {:peso} 
           WHERE id = {:id}`,
        )
        .bind({
          co2e: totalCo2eFinal,
          peso: totalPesoFinal,
          id: loteRec.id,
        })
        .execute()
    }
  },
  (app) => {
    // Reversão
    try {
      const lote = app.findFirstRecordByData('cdv_lotes', 'id', 'c1jz14hgmf7n13i')
      lote.set('total_co2e_evitado_kg', 1584.81)
      app.save(lote)
    } catch (_) {}
  },
)
