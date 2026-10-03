migrate(
  (app) => {
    // 4cpsxjak7q5nw5y é um lead temporário gerado em teste local com o mesmo CNPJ
    // Removemos ou atualizamos o duplicado 4cpsxjak7q5nw5y para permitir que o lead original de seed 8dylxnx99ovsaip receba 76.123.456/0001-00
    try {
      const leadDup = app.findFirstRecordByData('leads_diagnostico', 'id', '4cpsxjak7q5nw5y')
      if (leadDup) {
        app.delete(leadDup)
      }
    } catch (_) {
      try {
        app.db().newQuery("DELETE FROM leads_diagnostico WHERE id = '4cpsxjak7q5nw5y'").execute()
      } catch (_) {}
    }

    // Agora atualizamos 8dylxnx99ovsaip sem violar UNIQUE
    try {
      const rec = app.findFirstRecordByData('leads_diagnostico', 'id', '8dylxnx99ovsaip')
      rec.set('cnpj', '76.123.456/0001-00')
      app.save(rec)
    } catch (e1) {
      console.log('[0086] app.save lead 8dylxnx99ovsaip:', e1)
      try {
        app
          .db()
          .newQuery(
            "UPDATE leads_diagnostico SET cnpj = '76.123.456/0001-00' WHERE id = '8dylxnx99ovsaip'",
          )
          .execute()
      } catch (e2) {
        console.log('[0086] sql update lead 8dylxnx99ovsaip:', e2)
      }
    }
  },
  (app) => {
    try {
      app
        .db()
        .newQuery(
          "UPDATE leads_diagnostico SET cnpj = '76.123.456/0001-12' WHERE id = '8dylxnx99ovsaip'",
        )
        .execute()
    } catch (_) {}
  },
)
