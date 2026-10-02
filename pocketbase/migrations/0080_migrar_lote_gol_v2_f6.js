migrate(
  (app) => {
    // -------------------------------------------------------------------------
    // ACHADO 1: Migração do Lote Gol PR-BX-2026-991204 (id: h1dpr8wniludemh) para o motor v2
    // Metodologia DM-ORB-001 v1.1: Evitado = floor(Q * FE_ref * L_i * DF - PE)
    // DF = 0,30, L_i = 1,0, PE = 0.
    // Dossiê de Auditoria F6 (Tecpar):
    // 1. Capô Dianteiro: aço, Q = 10,0 kg, FE = 2,18 -> evitado 6,54 kgCO2e, Claim CONFIRMADO (NF-e 1234)
    // 2. Alternador: cobre, Q = 2,5 kg, FE = 5,40 -> evitado 4,05 kgCO2e, Claim CONFIRMADO (MTR 4410)
    // 3. Parachoque Dianteiro: polímeros, Q = 4,0 kg, FE = 1,90 -> evitado 2,28 kgCO2e, Claim POTENCIAL (Estoque)
    // Totais do Lote: Total = 12,87 kgCO2e (Confirmado 10,59 kgCO2e, Potencial 2,28 kgCO2e)
    // -------------------------------------------------------------------------

    const loteId = 'h1dpr8wniludemh'
    let loteRec
    try {
      loteRec = app.findFirstRecordByData('cdv_lotes', 'id', loteId)
    } catch (_) {
      try {
        loteRec = app.findFirstRecordByData(
          'cdv_lotes',
          'veiculo_baixa_detran',
          'PR-BX-2026-991204',
        )
      } catch (err) {
        console.warn('[0080] Lote Gol não encontrado:', err)
        return
      }
    }

    if (!loteRec) return

    const pecasConfig = [
      {
        id: 'asnhwudquj0bt3n',
        sku: 'PART-SND-CAPO-01',
        selo: 'PR-SEAL-2026-991823',
        desc: 'Capô Dianteiro Original com Vedação Acústica',
        cat: 'aco',
        mat: 'Aço Laminado Automotivo',
        peso: 10.0,
        fator: 2.18,
        evitado: 6.54,
        ncm: '8708.29.99',
        claimStatus: 'confirmado',
        destinacaoTipo: 'vendida',
        destinacaoEvidencia: 'NF-e 1234',
      },
      {
        id: '5a10a0b63fbkolg',
        sku: 'PART-SND-ALT-02',
        selo: 'PR-SEAL-2026-991824',
        desc: 'Alternador 90A com Bobinamento de Cobre',
        cat: 'cobre',
        mat: 'Cobre / Alumínio Elétrico',
        peso: 2.5,
        fator: 5.4,
        evitado: 4.05,
        ncm: '8511.50.10',
        claimStatus: 'confirmado',
        destinacaoTipo: 'reciclada',
        destinacaoEvidencia: 'MTR 4410',
      },
      {
        id: 'nen49ipzsxas2fn',
        sku: 'PART-SND-PARA-03',
        selo: 'PR-SEAL-2026-991825',
        desc: 'Parachoque Dianteiro Termoplástico Injetado',
        cat: 'polimeros',
        mat: 'Polipropileno Automotivo (PP/EPDM)',
        peso: 4.0,
        fator: 1.9,
        evitado: 2.28,
        ncm: '8708.10.00',
        claimStatus: 'potencial',
        destinacaoTipo: 'estoque',
        destinacaoEvidencia: '',
      },
    ]

    const baixaNorm = 'PR-BX-2026-991204'
    const cnpjNorm = '76.123.456/0001-12'
    const cdvNome = 'CDVerde Centro de Desmontagem Veicular'
    const chassiRaw = '9BWAA05U0DP999204'

    const claimsCol = app.findCollectionByNameOrId('cdv_claims')

    for (const item of pecasConfig) {
      let pecaRec
      try {
        pecaRec = app.findFirstRecordByData('cdv_pecas', 'id', item.id)
      } catch (_) {
        try {
          pecaRec = app.findFirstRecordByData('cdv_pecas', 'selo_dpp', item.selo)
        } catch (_) {}
      }

      const pesoFormatted = item.peso.toFixed(2)
      const evitadoFormatted = item.evitado.toFixed(2)
      // Canonical format: "${selo}|${sku}|${desc}|${peso.toFixed(2)}|${evitado.toFixed(2)}|${baixa}|${cnpj}"
      const canonicalStr = `${item.selo}|${item.sku}|${item.desc}|${pesoFormatted}|${evitadoFormatted}|${baixaNorm}|${cnpjNorm}`
      const hashSha = $security.sha256(canonicalStr)

      if (pecaRec) {
        pecaRec.set('peso_kg', item.peso)
        pecaRec.set('fator_co2e_kg', item.fator)
        pecaRec.set('co2e_evitado_kg', item.evitado)
        pecaRec.set('hash_sha256', hashSha)
        try {
          app.save(pecaRec)
        } catch (err) {
          console.warn('[0080] Fallback SQL para salvar peca ' + item.id + ':', err)
          app
            .db()
            .newQuery(
              `UPDATE cdv_pecas 
               SET peso_kg = {:peso}, 
                   fator_co2e_kg = {:fator}, 
                   co2e_evitado_kg = {:evitado}, 
                   hash_sha256 = {:hash} 
               WHERE id = {:id}`,
            )
            .bind({
              peso: item.peso,
              fator: item.fator,
              evitado: item.evitado,
              hash: hashSha,
              id: pecaRec.id,
            })
            .execute()
        }
      }

      // Criar ou atualizar claim correspondente em cdv_claims
      const chaveDedup = `${chassiRaw.toUpperCase()}_${item.sku.toUpperCase()}_${baixaNorm}`
      const claimHash = $security.sha256(`CLAIM|${chaveDedup}|${cnpjNorm}|${item.selo}|${hashSha}`)

      let claimRec
      try {
        claimRec = app.findFirstRecordByData('cdv_claims', 'chave_dedup', chaveDedup)
      } catch (_) {
        claimRec = new Record(claimsCol)
        claimRec.set('chave_dedup', chaveDedup)
        claimRec.set('chassi', chassiRaw)
        claimRec.set('sku', item.sku)
        claimRec.set('data_baixa', baixaNorm)
        claimRec.set('cdv_cnpj', cnpjNorm)
        claimRec.set('cdv_nome', cdvNome)
        claimRec.set('lote_id', loteRec.id)
        claimRec.set('selo_dpp', item.selo)
      }

      claimRec.set('hash_claim', claimHash)
      claimRec.set('status', item.claimStatus)
      claimRec.set('destinacao_tipo', item.destinacaoTipo)
      claimRec.set('destinacao_evidencia', item.destinacaoEvidencia)

      try {
        app.save(claimRec)
      } catch (errSaveClaim) {
        console.warn('[0080] Fallback SQL para cdv_claims:', errSaveClaim)
        try {
          app
            .db()
            .newQuery(
              `INSERT OR REPLACE INTO cdv_claims (id, chave_dedup, chassi, sku, data_baixa, cdv_cnpj, cdv_nome, lote_id, selo_dpp, hash_claim, status, destinacao_tipo, destinacao_evidencia, created, updated)
               VALUES (
                 COALESCE((SELECT id FROM cdv_claims WHERE chave_dedup = {:chave}), {:newId}),
                 {:chave}, {:chassi}, {:sku}, {:baixa}, {:cnpj}, {:nome}, {:loteId}, {:selo}, {:hashClaim}, {:status}, {:tipo}, {:evidencia},
                 datetime('now'), datetime('now')
               )`,
            )
            .bind({
              chave: chaveDedup,
              newId: $security.randomString(15),
              chassi: chassiRaw,
              sku: item.sku,
              baixa: baixaNorm,
              cnpj: cnpjNorm,
              nome: cdvNome,
              loteId: loteRec.id,
              selo: item.selo,
              hashClaim: claimHash,
              status: item.claimStatus,
              tipo: item.destinacaoTipo,
              evidencia: item.destinacaoEvidencia,
            })
            .execute()
        } catch (eSql) {
          console.warn('[0080] Falha no fallback SQL do claim:', eSql)
        }
      }
    }

    // Atualizar cdv_lotes (Total: 12.87 kgCO2e, Total peso: 16.5 kg)
    loteRec.set('total_co2e_evitado_kg', 12.87)
    loteRec.set('total_peso_kg', 16.5)
    let payload = {}
    try {
      payload = loteRec.get('payload_bruto_json') || {}
      if (typeof payload === 'string') payload = JSON.parse(payload)
    } catch (_) {
      payload = {}
    }
    payload.versao_metodologia = 'DM-ORB-001-v1.1'
    payload.df = 0.3
    payload.li = 1.0
    payload.total_co2e_evitado_kg = 12.87
    payload.evitado_confirmado_kg = 10.59
    payload.evitado_potencial_kg = 2.28
    payload.incerteza_pct = 2.64
    payload.incerteza_kg = 0.34
    loteRec.set('payload_bruto_json', payload)

    try {
      app.save(loteRec)
    } catch (errLote) {
      console.warn('[0080] Fallback SQL para lote:', errLote)
      app
        .db()
        .newQuery(
          `UPDATE cdv_lotes 
           SET total_co2e_evitado_kg = 12.87, 
               total_peso_kg = 16.5 
           WHERE id = {:id}`,
        )
        .bind({ id: loteRec.id })
        .execute()
    }
  },
  (app) => {
    // Reversão opcional para o estado anterior v1
    try {
      const lote = app.findFirstRecordByData('cdv_lotes', 'id', 'h1dpr8wniludemh')
      lote.set('total_co2e_evitado_kg', 76.63)
      lote.set('total_peso_kg', 23.5)
      app.save(lote)
    } catch (_) {}
  },
)
