migrate(
  (app) => {
    // 1. Atualizar registros em selos
    // dg75puw2r0j1fxs: 76.123.456/0001-12 -> 76.123.456/0001-00
    // 1u0ajxjmmxzh6n9: 14.882.310/0001-44 -> 14.882.310/0001-91
    // 9p9ej59wugqzqwh: 43.904.740/0001-44 -> 43.904.740/0001-65
    const selosUpdates = [
      { id: 'dg75puw2r0j1fxs', cnpj: '76.123.456/0001-00' },
      { id: '1u0ajxjmmxzh6n9', cnpj: '14.882.310/0001-91' },
      { id: '9p9ej59wugqzqwh', cnpj: '43.904.740/0001-65' },
    ]

    for (const item of selosUpdates) {
      try {
        const rec = app.findFirstRecordByData('selos', 'id', item.id)
        rec.set('cnpj', item.cnpj)
        try {
          app.save(rec)
        } catch (saveErr) {
          console.log('[0084] Fallback SQL selos:', item.id, saveErr)
          app
            .db()
            .newQuery('UPDATE selos SET cnpj = {:cnpj} WHERE id = {:id}')
            .bind({ cnpj: item.cnpj, id: item.id })
            .execute()
        }
      } catch (err) {
        console.log('[0084] Selo nao encontrado ou erro:', item.id, err)
        // Tentativa de update por SQL direto caso falhe o find
        try {
          app
            .db()
            .newQuery('UPDATE selos SET cnpj = {:cnpj} WHERE id = {:id}')
            .bind({ cnpj: item.cnpj, id: item.id })
            .execute()
        } catch (_) {}
      }
    }

    // 2. Atualizar registros em leads_diagnostico
    // 8dylxnx99ovsaip: 76.123.456/0001-12 -> 76.123.456/0001-00
    // ajv5jk1idy49y3u: 14.882.310/0001-44 -> 14.882.310/0001-91
    // q96ci8jivn42hr2: 43.904.740/0001-44 -> 43.904.740/0001-65
    const leadsUpdates = [
      { id: '8dylxnx99ovsaip', cnpj: '76.123.456/0001-00' },
      { id: 'ajv5jk1idy49y3u', cnpj: '14.882.310/0001-91' },
      { id: 'q96ci8jivn42hr2', cnpj: '43.904.740/0001-65' },
    ]

    for (const item of leadsUpdates) {
      try {
        const rec = app.findFirstRecordByData('leads_diagnostico', 'id', item.id)
        rec.set('cnpj', item.cnpj)
        app.save(rec)
      } catch (err) {
        console.log('[0084] Fallback SQL leads_diagnostico:', item.id, err)
        try {
          app
            .db()
            .newQuery('UPDATE leads_diagnostico SET cnpj = {:cnpj} WHERE id = {:id}')
            .bind({ cnpj: item.cnpj, id: item.id })
            .execute()
        } catch (_) {}
      }
    }

    // Garantir update explícito via SQL também caso app.save tenha sofrido veto silencioso
    for (const item of leadsUpdates) {
      try {
        app
          .db()
          .newQuery('UPDATE leads_diagnostico SET cnpj = {:cnpj} WHERE id = {:id}')
          .bind({ cnpj: item.cnpj, id: item.id })
          .execute()
      } catch (_) {}
    }
  },
  (app) => {
    // Reverter para os valores anteriores caso necessário
    try {
      app
        .db()
        .newQuery(
          'UPDATE selos SET cnpj = "76.123.456/0001-12" WHERE id = "dg75puw2r0j1fxs";' +
            'UPDATE selos SET cnpj = "14.882.310/0001-44" WHERE id = "1u0ajxjmmxzh6n9";' +
            'UPDATE selos SET cnpj = "43.904.740/0001-44" WHERE id = "9p9ej59wugqzqwh";',
        )
        .execute()
      app
        .db()
        .newQuery(
          'UPDATE leads_diagnostico SET cnpj = "76.123.456/0001-12" WHERE id = "8dylxnx99ovsaip";' +
            'UPDATE leads_diagnostico SET cnpj = "14.882.310/0001-44" WHERE id = "ajv5jk1idy49y3u";' +
            'UPDATE leads_diagnostico SET cnpj = "43.904.740/0001-44" WHERE id = "q96ci8jivn42hr2";',
        )
        .execute()
    } catch (_) {}
  },
)
