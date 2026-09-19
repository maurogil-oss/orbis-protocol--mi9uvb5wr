migrate(
  (app) => {
    // 1. Fechar regras de criação/escrita anônimas em leads_diagnostico
    // Gravação pública apenas via hook autenticado server-side /backend/v1/lead-diagnostico-submit
    // Criação direta no SDK restrita a autenticados (ou superusuário/hook)
    try {
      const colLeads = app.findCollectionByNameOrId('leads_diagnostico')
      colLeads.createRule = "@request.auth.id != ''"
      colLeads.updateRule =
        "@request.auth.id != '' && (usuario = @request.auth.id || @request.auth.role = 'admin' || @request.auth.role = 'perito')"
      colLeads.deleteRule =
        "@request.auth.id != '' && (usuario = @request.auth.id || @request.auth.role = 'admin' || @request.auth.role = 'perito')"
      app.save(colLeads)
    } catch (err) {
      console.log('Aviso ao atualizar regras de leads_diagnostico:', err)
    }

    // 2. Fechar regras de criação direta anônima em lgpd_solicitacoes
    // Canal formal de titulares restringe create direto a autenticados; hooks server-side criam livremente via $app.save()
    try {
      const colLgpd = app.findCollectionByNameOrId('lgpd_solicitacoes')
      colLgpd.createRule = "@request.auth.id != ''"
      colLgpd.updateRule =
        "@request.auth.id != '' && (@request.auth.role = 'admin' || @request.auth.role = 'perito')"
      colLgpd.deleteRule =
        "@request.auth.id != '' && (@request.auth.role = 'admin' || @request.auth.role = 'perito')"
      app.save(colLgpd)
    } catch (err) {
      console.log('Aviso ao atualizar regras de lgpd_solicitacoes:', err)
    }

    // 3. Fechar regras de criação anônima em dpp_consultas
    // Gravação apenas via hook autenticado /backend/v1/cdv/consultas com IP mascarado
    // Leitura permanece pública (listRule e viewRule vazias "") para auditoria transparente de verificações
    try {
      const colDpp = app.findCollectionByNameOrId('dpp_consultas')
      colDpp.listRule = ''
      colDpp.viewRule = ''
      colDpp.createRule = "@request.auth.id != ''"
      colDpp.updateRule = "@request.auth.id != ''"
      colDpp.deleteRule = "@request.auth.id != ''"
      app.save(colDpp)
    } catch (err) {
      console.log('Aviso ao atualizar regras de dpp_consultas:', err)
    }

    // 4. Garantir que coleções públicas essenciais mantenham leitura pública (listRule / viewRule = "")
    // e escrita restrita: selos, cdv_lotes, cdv_pecas, dpp_destinacao_final, corporativo_demo, hashes_competencia, lgpd_retencoes
    const publicReadCollections = [
      'selos',
      'cdv_lotes',
      'cdv_pecas',
      'dpp_destinacao_final',
      'corporativo_demo',
      'hashes_competencia',
      'lgpd_retencoes',
    ]

    for (const colName of publicReadCollections) {
      try {
        const col = app.findCollectionByNameOrId(colName)
        col.listRule = ''
        col.viewRule = ''
        if (col.createRule === '') {
          col.createRule = "@request.auth.id != ''"
        }
        if (col.updateRule === '') {
          col.updateRule = "@request.auth.id != ''"
        }
        if (col.deleteRule === '') {
          col.deleteRule = "@request.auth.id != ''"
        }
        app.save(col)
      } catch (err) {
        console.log(`Aviso ao atualizar regras públicas da coleção ${colName}:`, err)
      }
    }

    // 5. Renomear no banco o registro demo de leads_diagnostico ID 'vg4otk9b7td0hq9' (CNPJ 18.394.029/0001-88)
    // Razão Social: "CDV Modelo — Demonstração Operacional (Credenciado DETRAN)"
    // E-mail: "contato@cdvmodelo.com.br"
    try {
      app
        .db()
        .newQuery(
          `UPDATE leads_diagnostico
           SET razao_social = {:novaRazao}, email = {:novoEmail}
           WHERE id = {:id} OR cnpj = {:cnpj}`,
        )
        .bind({
          novaRazao: 'CDV Modelo — Demonstração Operacional (Credenciado DETRAN)',
          novoEmail: 'contato@cdvmodelo.com.br',
          id: 'vg4otk9b7td0hq9',
          cnpj: '18.394.029/0001-88',
        })
        .execute()
    } catch (dbErr) {
      console.log('Erro ao atualizar registro demo de leads_diagnostico no banco:', dbErr)
    }
  },
  (app) => {
    // Reverter regras se necessário
  },
)
