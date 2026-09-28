migrate(
  (app) => {
    try {
      const rec = app.findFirstRecordByData('servicos_catalogo', 'servico_id', 'diagnostico')
      rec.set(
        'descricao',
        'Primeiro resultado prévio validado por CNPJ com Hash de integridade criptográfica dMRV e Atestado Orbis.',
      )
      app.save(rec)
    } catch (_) {
      // Caso não encontre por data, tenta update via SQL
      try {
        app
          .db()
          .newQuery(
            "UPDATE servicos_catalogo SET descricao = 'Primeiro resultado prévio validado por CNPJ com Hash de integridade criptográfica dMRV e Atestado Orbis.' WHERE servico_id = 'diagnostico'",
          )
          .execute()
      } catch (err) {
        console.warn('Erro ao atualizar servicos_catalogo na migracao 0076:', err)
      }
    }
  },
  (app) => {
    try {
      const rec = app.findFirstRecordByData('servicos_catalogo', 'servico_id', 'diagnostico')
      rec.set(
        'descricao',
        'Primeiro resultado prévio validado por CNPJ com Hash de integridade criptográfica dMRV e Selo Oficial.',
      )
      app.save(rec)
    } catch (_) {}
  },
)
