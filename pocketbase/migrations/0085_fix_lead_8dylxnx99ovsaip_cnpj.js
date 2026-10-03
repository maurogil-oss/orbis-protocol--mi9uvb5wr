migrate(
  (app) => {
    try {
      const rec = app.findFirstRecordByData('leads_diagnostico', 'id', '8dylxnx99ovsaip')
      rec.set('cnpj', '76.123.456/0001-00')
      app.save(rec)
    } catch (e1) {
      console.log('[0085] app.save leads 8dylxnx99ovsaip erro:', e1)
      try {
        app
          .db()
          .newQuery(
            "UPDATE leads_diagnostico SET cnpj = '76.123.456/0001-00' WHERE id = '8dylxnx99ovsaip'",
          )
          .execute()
      } catch (e2) {
        console.log('[0085] SQL update leads erro:', e2)
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
