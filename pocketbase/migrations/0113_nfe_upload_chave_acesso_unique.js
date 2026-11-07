migrate(
  (app) => {
    // Deduplica registros por chave_acesso preenchida (mantém o mais antigo)
    app
      .db()
      .newQuery(`
    DELETE FROM nfe_upload
    WHERE chave_acesso IS NOT NULL
      AND TRIM(chave_acesso) != ''
      AND id NOT IN (
        SELECT MIN(id) FROM nfe_upload
        WHERE chave_acesso IS NOT NULL AND TRIM(chave_acesso) != ''
        GROUP BY chave_acesso
      )
  `)
      .execute()

    const col = app.findCollectionByNameOrId('nfe_upload')
    // Remove índice não-único antigo se existir
    try {
      col.removeIndex('idx_nfe_chave')
    } catch (_e) {
      // ignora se não existir
    }
    // Cria índice UNIQUE sobre chave_acesso apenas para chaves não vazias
    col.addIndex('idx_nfe_upload_chave_acesso_unique', true, 'chave_acesso', "chave_acesso != ''")
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('nfe_upload')
    try {
      col.removeIndex('idx_nfe_upload_chave_acesso_unique')
    } catch (_e) {
      // ignora se já removido
    }
    col.addIndex('idx_nfe_chave', false, 'chave_acesso', '')
    app.save(col)
  },
)
