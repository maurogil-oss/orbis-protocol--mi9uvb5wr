migrate(
  (app) => {
    // Backfill da data de validade do certificado A1 da MGM Consultoria Empresarial Ltda
    // ID do registro: 89zwr2bc6sowcts
    // Validade confirmada: 12/02/2027 (AC Certisign RFB G5)
    // PocketBase v0.36 date format: "YYYY-MM-DD HH:mm:ss.000Z"
    try {
      app
        .db()
        .newQuery(
          'UPDATE cliente_certificados_a1 SET validade_certificado = {:validade} WHERE id = {:id}',
        )
        .bind({
          validade: '2027-02-12 00:00:00.000Z',
          id: '89zwr2bc6sowcts',
        })
        .execute()
      console.log(
        '[migration 0073] Backfill validade_certificado concluído para o registro 89zwr2bc6sowcts.',
      )
    } catch (err) {
      console.error(
        '[migration 0073] Erro ao atualizar validade_certificado:',
        err ? err.message : err,
      )
      throw err
    }
  },
  (app) => {
    try {
      app
        .db()
        .newQuery("UPDATE cliente_certificados_a1 SET validade_certificado = '' WHERE id = {:id}")
        .bind({
          id: '89zwr2bc6sowcts',
        })
        .execute()
    } catch (_) {}
  },
)
