migrate(
  (app) => {
    // Atualizar leads_diagnostico existentes para terem faixas calculadas e diversificadas
    // permitindo ver os critérios de prioridade claramente no Console do Auditor
    try {
      // 1. Distribuidora de Alimentos: Lucro Presumido -> Ponto de atenção
      app
        .db()
        .newQuery(`
        UPDATE leads_diagnostico 
        SET faixa_impacto_tributario = 'ponto_atencao',
            faixa_emissoes = 'abaixo_10k',
            enquadramento_sbce = 'Abaixo de 10.000 tCO2e/ano',
            exporta_ue_cbam = 'nao'
        WHERE cnpj = '76.123.456/0001-12'
      `)
        .execute()

      // 2. Metalúrgica Confiança: Lucro Real + Exportador UE (CBAM) + Acima de 25k -> Prioridade Máxima
      app
        .db()
        .newQuery(`
        UPDATE leads_diagnostico 
        SET faixa_impacto_tributario = 'ganho_provavel',
            faixa_emissoes = 'acima_25k',
            enquadramento_sbce = 'Acima de 25.000 tCO2e/ano (Metas SBCE)',
            exporta_ue_cbam = 'sim',
            cbam_bens = 'Aço e Produtos Metalúrgicos'
        WHERE cnpj = '14.882.310/0001-44'
      `)
        .execute()

      // 3. Expresso Verde: Lucro Real + Entre 10k e 25k (Reporte)
      app
        .db()
        .newQuery(`
        UPDATE leads_diagnostico 
        SET faixa_impacto_tributario = 'neutro',
            faixa_emissoes = 'entre_10k_25k',
            enquadramento_sbce = 'Entre 10.000 e 25.000 tCO2e/ano (Reporte)',
            exporta_ue_cbam = 'nao'
        WHERE cnpj = '43.904.740/0001-44'
      `)
        .execute()

      // 4. Renova Peças CDV: Lucro Presumido + MOVER
      app
        .db()
        .newQuery(`
        UPDATE leads_diagnostico 
        SET faixa_impacto_tributario = 'ganho_provavel',
            faixa_emissoes = 'abaixo_10k',
            enquadramento_sbce = 'Abaixo de 10.000 tCO2e/ano',
            exporta_ue_cbam = 'nao'
        WHERE cnpj = '18.394.029/0001-88'
      `)
        .execute()

      // 5. MGM Prime: Simples Nacional
      app
        .db()
        .newQuery(`
        UPDATE leads_diagnostico 
        SET faixa_impacto_tributario = 'neutro',
            faixa_emissoes = 'abaixo_10k',
            enquadramento_sbce = 'Abaixo de 10.000 tCO2e/ano',
            exporta_ue_cbam = 'nao'
        WHERE cnpj = '19.598.964/0001-01'
      `)
        .execute()
    } catch (_) {}
  },
  (app) => {},
)
