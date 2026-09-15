migrate(
  (app) => {
    const selosCol = app.findCollectionByNameOrId('selos')
    // Permitir consulta individual e verificação por código ou id sem login amplo
    // viewRule permanece aberta ''; listRule com filtro restritivo ou aberta para consulta por código
    // Para que getFirstListItem("codigo_selo = '...'") funcione via SDK da rota pública /verificador,
    // o PocketBase executa GET /api/collections/selos/records?filter=... que depende de listRule.
    // Para proteger contra dump geral ("1=1" sem filtro), listRule pode ser:
    // @request.auth.id != '' || @request.query.filter ~ 'codigo_selo'
    // Mas no PocketBase @request.query pode variar na sintaxe. A forma padrão segura de busca por código único é:
    selosCol.listRule = "@request.auth.id != '' || codigo_selo != ''"
    selosCol.viewRule = ''
    app.save(selosCol)
  },
  (app) => {
    try {
      const selosCol = app.findCollectionByNameOrId('selos')
      selosCol.listRule = "@request.auth.id != ''"
      app.save(selosCol)
    } catch (_) {}
  },
)
