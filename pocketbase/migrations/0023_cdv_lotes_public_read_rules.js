migrate(
  (app) => {
    // 1. Atualizar cdv_lotes: leitura pública (list e view vazias ""), escrita restrita a autenticados
    const lotesCol = app.findCollectionByNameOrId('cdv_lotes')
    lotesCol.listRule = ''
    lotesCol.viewRule = ''
    // Garantir que gravação permaneça protegida
    lotesCol.createRule = "@request.auth.id != ''"
    lotesCol.updateRule = "@request.auth.id != ''"
    lotesCol.deleteRule = "@request.auth.id != ''"
    app.save(lotesCol)

    // 2. Atualizar cdv_pecas: garantir leitura pública (list e view vazias ""), escrita restrita a autenticados
    const pecasCol = app.findCollectionByNameOrId('cdv_pecas')
    pecasCol.listRule = ''
    pecasCol.viewRule = ''
    pecasCol.createRule = "@request.auth.id != ''"
    pecasCol.updateRule = "@request.auth.id != ''"
    pecasCol.deleteRule = "@request.auth.id != ''"
    app.save(pecasCol)
  },
  (app) => {
    try {
      const lotesCol = app.findCollectionByNameOrId('cdv_lotes')
      lotesCol.listRule = "@request.auth.id != ''"
      lotesCol.viewRule = "@request.auth.id != ''"
      app.save(lotesCol)
    } catch (_) {}

    try {
      const pecasCol = app.findCollectionByNameOrId('cdv_pecas')
      pecasCol.listRule = ''
      pecasCol.viewRule = ''
      app.save(pecasCol)
    } catch (_) {}
  },
)
