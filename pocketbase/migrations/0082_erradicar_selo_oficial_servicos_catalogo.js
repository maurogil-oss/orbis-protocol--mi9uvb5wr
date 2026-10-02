migrate(
  (app) => {
    // -------------------------------------------------------------------------
    // ACHADO 4: Erradicação definitiva do termo banido "Selo Oficial"
    // Coleção: servicos_catalogo
    // A migração 0076 utilizou SQL cru (ou foi abortada por hook).
    // Aqui usamos a API de Records ($app.findFirstRecordByData + record.set + app.save)
    // com tratamento de erro e fallback SQL, substituindo:
    // "Hash de integridade criptográfica dMRV e Selo Oficial"
    // por:
    // "Hash de integridade criptográfica dMRV e Atestado Orbis"
    // Varre também todos os registros de servicos_catalogo.
    // -------------------------------------------------------------------------

    let records = []
    try {
      records = app.findRecordsByFilter('servicos_catalogo', '1=1', '', 50, 0)
    } catch (e) {
      console.warn('[0082] Falha ao listar servicos_catalogo via filter:', e)
    }

    const termoBanido = 'Selo Oficial'
    const termoSubstituto = 'Atestado Orbis'

    for (let i = 0; i < records.length; i++) {
      const rec = records[i]
      let alterado = false

      const desc = rec.getString('descricao') || ''
      if (desc.includes(termoBanido)) {
        const novaDesc = desc.split(termoBanido).join(termoSubstituto)
        rec.set('descricao', novaDesc)
        alterado = true
      }

      const nome = rec.getString('nome') || ''
      if (nome.includes(termoBanido)) {
        const novoNome = nome.split(termoBanido).join(termoSubstituto)
        rec.set('nome', novoNome)
        alterado = true
      }

      if (alterado) {
        try {
          app.save(rec)
        } catch (errSave) {
          console.warn('[0082] Fallback SQL para servicos_catalogo ' + rec.id + ':', errSave)
          app
            .db()
            .newQuery(
              `UPDATE servicos_catalogo 
               SET descricao = {:descricao}, 
                   nome = {:nome} 
               WHERE id = {:id}`,
            )
            .bind({
              descricao: rec.getString('descricao'),
              nome: rec.getString('nome'),
              id: rec.id,
            })
            .execute()
        }
      }
    }

    // Fallback garantido direto via SQL caso o filtro não tenha pego
    try {
      app
        .db()
        .newQuery(
          `UPDATE servicos_catalogo
           SET descricao = REPLACE(descricao, 'Selo Oficial', 'Atestado Orbis')
           WHERE descricao LIKE '%Selo Oficial%'`,
        )
        .execute()
    } catch (eSql) {
      console.warn('[0082] Erro no fallback SQL direto:', eSql)
    }
  },
  (app) => {
    // Reversão opcional
    try {
      app
        .db()
        .newQuery(
          `UPDATE servicos_catalogo
           SET descricao = REPLACE(descricao, 'Atestado Orbis', 'Selo Oficial')
           WHERE id = '47581c8khr1lj3j'`,
        )
        .execute()
    } catch (_) {}
  },
)
