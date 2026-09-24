migrate(
  (app) => {
    // Limpeza preventiva de eventuais usuários temporários criados em migrações anteriores
    try {
      app.db().newQuery("DELETE FROM users WHERE email LIKE '%@invalid.local'").execute()
    } catch (_) {}

    // 1. Gerar o hash da senha criando um registro efêmero de usuário
    const usersCol = app.findCollectionByNameOrId('users')
    const tempGen = new Record(usersCol)
    tempGen.setEmail('temp_gen_hash@invalid.local')
    tempGen.setPassword('OrbisProtocol2026')
    app.save(tempGen)

    // 2. Extrair o hash bcrypt persistido na coluna 'password' via DynamicModel
    const tempRow = new DynamicModel({
      password: '',
    })
    app
      .db()
      .newQuery("SELECT password FROM users WHERE email = 'temp_gen_hash@invalid.local'")
      .one(tempRow)
    const bcryptHash = tempRow.password

    // Excluir o registro temporário gerador
    try {
      app.delete(tempGen)
    } catch (_) {}

    if (!bcryptHash || bcryptHash.length < 20) {
      throw new Error('Falha ao gerar bcryptHash: ' + bcryptHash)
    }

    // 3. Atualizar a coluna password diretamente no banco via SQL para o usuário maurog1@hotmail.com
    app
      .db()
      .newQuery("UPDATE users SET password = {:hash} WHERE email = 'maurog1@hotmail.com'")
      .bind({ hash: bcryptHash })
      .execute()

    // Log obrigatório da execução do SQL
    console.log('RESTORE-PASSWORD: SQL executado')

    // Verificação com findAuthRecordByEmail + validatePassword
    const rec = app.findAuthRecordByEmail('users', 'maurog1@hotmail.com')
    const ok = rec.validatePassword('OrbisProtocol2026')
    console.log('VALIDATE-PASSWORD: ' + ok)

    if (!ok) {
      throw new Error('VALIDATE-PASSWORD falhou — migração NÃO efetiva')
    }

    // Remoção de usuários temporários de teste
    try {
      app.db().newQuery("DELETE FROM users WHERE email LIKE '%@invalid.local'").execute()
    } catch (_) {}
  },
  (app) => {
    // Operação irreversível intencional (redefinição de senha para restauração de acesso)
  },
)
