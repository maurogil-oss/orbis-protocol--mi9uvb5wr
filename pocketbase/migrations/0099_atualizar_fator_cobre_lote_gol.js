migrate(
  (app) => {
    // -------------------------------------------------------------------------
    // Atualização do Fator de Cobre para 4,10 kgCO2e/kg (ICA 2024 LCI/LCA)
    // Lote de Referência Gol (id: h1dpr8wniludemh / baixa: PR-BX-2026-991204)
    // Peça do Alternador/Estator (id: 5a10a0b63fbkolg / selo: PR-SEAL-2026-991824)
    // Recálculo pericial:
    // - Alternador: 2,5 kg × 4,10 × 1,0 × 0,30 = 3,07 kgCO2e (era 4,05)
    // - Capô: 6,54 kgCO2e (confirmado)
    // - Parachoque: 2,28 kgCO2e (potencial)
    // - Total confirmado = 6,54 + 3,07 = 9,61 kgCO2e
    // - Total lote = 6,54 + 3,07 + 2,28 = 11,89 kgCO2e
    // - Incerteza do lote: ±0,31 kgCO2e (±2,64% / ±2,61%)
    //
    // Padrão do projeto: usar UPDATE via SQL cru para não disparar hooks de auditoria
    // que abortam app.save dentro de migrações.
    // -------------------------------------------------------------------------

    const baixaNorm = 'PR-BX-2026-991204'
    const cnpjNorm = '76.123.456/0001-12'
    const chassiRaw = '9BWAA05U0DP999204'
    const seloAlt = 'PR-SEAL-2026-991824'
    const skuAlt = 'PART-SND-ALT-02'
    const descAlt = 'Alternador 90A com Bobinamento de Cobre'
    const pesoAlt = 2.5
    const novoFatorCobre = 4.1
    const novoEvitadoAlt = 3.07

    // 1. Recalcular canonical string e hash SHA-256 da peça do alternador
    // Formato: "${selo}|${sku}|${desc}|${peso.toFixed(2)}|${evitado.toFixed(2)}|${baixa}|${cnpj}"
    const canonicalStr = `${seloAlt}|${skuAlt}|${descAlt}|${pesoAlt.toFixed(2)}|${novoEvitadoAlt.toFixed(2)}|${baixaNorm}|${cnpjNorm}`
    const novoHashSha = $security.sha256(canonicalStr)

    // 2. Atualizar a peça do alternador em cdv_pecas via SQL cru
    app
      .db()
      .newQuery(
        `UPDATE cdv_pecas
         SET fator_co2e_kg = {:fator},
             co2e_evitado_kg = {:evitado},
             hash_sha256 = {:hash}
         WHERE id = '5a10a0b63fbkolg' OR selo_dpp = {:selo}`,
      )
      .bind({
        fator: novoFatorCobre,
        evitado: novoEvitadoAlt,
        hash: novoHashSha,
        selo: seloAlt,
      })
      .execute()

    // 3. Atualizar claim correspondente em cdv_claims via SQL cru
    const chaveDedupAlt = `${chassiRaw.toUpperCase()}_${skuAlt.toUpperCase()}_${baixaNorm}`
    const novoClaimHash = $security.sha256(
      `CLAIM|${chaveDedupAlt}|${cnpjNorm}|${seloAlt}|${novoHashSha}`,
    )

    app
      .db()
      .newQuery(
        `UPDATE cdv_claims
         SET hash_claim = {:hashClaim}
         WHERE chave_dedup = {:chave} OR selo_dpp = {:selo}`,
      )
      .bind({
        hashClaim: novoClaimHash,
        chave: chaveDedupAlt,
        selo: seloAlt,
      })
      .execute()

    // 4. Atualizar o lote Gol em cdv_lotes (id: h1dpr8wniludemh)
    // Atualiza total_co2e_evitado_kg = 11.89
    app
      .db()
      .newQuery(
        `UPDATE cdv_lotes
         SET total_co2e_evitado_kg = 11.89
         WHERE id = 'h1dpr8wniludemh' OR veiculo_baixa_detran = {:baixa}`,
      )
      .bind({
        baixa: baixaNorm,
      })
      .execute()
  },
  (app) => {
    // Reversão para os valores anteriores
    const baixaNorm = 'PR-BX-2026-991204'
    const cnpjNorm = '76.123.456/0001-12'
    const chassiRaw = '9BWAA05U0DP999204'
    const seloAlt = 'PR-SEAL-2026-991824'
    const skuAlt = 'PART-SND-ALT-02'
    const descAlt = 'Alternador 90A com Bobinamento de Cobre'
    const pesoAlt = 2.5
    const fatorAntigo = 5.4
    const evitadoAntigo = 4.05

    const canonicalStr = `${seloAlt}|${skuAlt}|${descAlt}|${pesoAlt.toFixed(2)}|${evitadoAntigo.toFixed(2)}|${baixaNorm}|${cnpjNorm}`
    const hashAntigo = $security.sha256(canonicalStr)

    app
      .db()
      .newQuery(
        `UPDATE cdv_pecas
         SET fator_co2e_kg = {:fator},
             co2e_evitado_kg = {:evitado},
             hash_sha256 = {:hash}
         WHERE id = '5a10a0b63fbkolg' OR selo_dpp = {:selo}`,
      )
      .bind({
        fator: fatorAntigo,
        evitado: evitadoAntigo,
        hash: hashAntigo,
        selo: seloAlt,
      })
      .execute()

    const chaveDedupAlt = `${chassiRaw.toUpperCase()}_${skuAlt.toUpperCase()}_${baixaNorm}`
    const claimHashAntigo = $security.sha256(
      `CLAIM|${chaveDedupAlt}|${cnpjNorm}|${seloAlt}|${hashAntigo}`,
    )

    app
      .db()
      .newQuery(
        `UPDATE cdv_claims
         SET hash_claim = {:hashClaim}
         WHERE chave_dedup = {:chave} OR selo_dpp = {:selo}`,
      )
      .bind({
        hashClaim: claimHashAntigo,
        chave: chaveDedupAlt,
        selo: seloAlt,
      })
      .execute()

    app
      .db()
      .newQuery(
        `UPDATE cdv_lotes
         SET total_co2e_evitado_kg = 12.87
         WHERE id = 'h1dpr8wniludemh' OR veiculo_baixa_detran = {:baixa}`,
      )
      .bind({
        baixa: baixaNorm,
      })
      .execute()
  },
)
