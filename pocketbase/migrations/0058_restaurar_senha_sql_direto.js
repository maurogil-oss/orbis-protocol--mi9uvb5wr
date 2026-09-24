/**
 * MIGRATION 0058: RESTAURAR ACESSO DO USUÁRIO maurog1@hotmail.com VIA SQL DIRETO
 *
 * TENTATIVA Nº 3 (FINAL):
 * 1. Localiza o registro alvo na coleção 'users'.
 * 2. Computa o hash bcrypt via rec.setPassword('OrbisProtocol2026') em memória e extrai via rec.getString('password').
 *    Se vier vazio, fallback via registro descartável na coleção users, deletado logo em seguida.
 * 3. Grava por SQL DIRETO (bypassa hooks e validações do app.save):
 *    UPDATE users SET password = '<HASH>', updated = datetime('now') WHERE email = 'maurog1@hotmail.com'
 * 4. Verifica na mesma transação: rebusca registro, valida senha com validatePassword('OrbisProtocol2026'),
 *    confere verified=true e role='master'.
 * 5. Não loga a senha em claro.
 * 6. Down é no-op.
 */

migrate(
  (app) => {
    // 1. Localizar o registro alvo
    let user = null
    try {
      user = app.findFirstRecordByData('users', 'email', 'maurog1@hotmail.com')
    } catch (findErr) {
      const errMsg = findErr && findErr.message ? findErr.message : String(findErr)
      console.log('[Migration 0058] Erro ao localizar usuário maurog1@hotmail.com: ' + errMsg)
      throw new Error('Usuário maurog1@hotmail.com não localizado na coleção users: ' + errMsg)
    }

    if (!user) {
      console.log('[Migration 0058] Erro: usuário retornado nulo.')
      throw new Error('Usuário maurog1@hotmail.com não encontrado na coleção users.')
    }

    const userId = user.id
    const userUpdated = user.getString('updated')
    console.log('[Migration 0058] usuário localizado, id=' + userId + ', updated=' + userUpdated)

    // 2. Gerar hash da senha SEM salvar o registro alvo via app.save()
    user.setPassword('OrbisProtocol2026')
    let passwordHash = user.getString('password')

    // Fallback: se rec.getString('password') vier vazio, usa registro temporário descartável
    if (!passwordHash) {
      console.log(
        '[Migration 0058] rec.getString("password") em memória veio vazio. Iniciando fallback com registro temporário...',
      )
      const usersCol = app.findCollectionByNameOrId('users')
      const tempUser = new Record(usersCol)
      tempUser.setEmail('temp-hash-gen+58@invalid.local')
      tempUser.setPassword('OrbisProtocol2026')
      tempUser.setVerified(true)
      tempUser.set('name', 'Temp Hash Generator')
      tempUser.set('role', 'cliente')

      try {
        app.save(tempUser)
        passwordHash = tempUser.getString('password')
        try {
          app.delete(tempUser)
        } catch (delErr) {
          console.log(
            '[Migration 0058] Aviso ao deletar registro temporário de hash: ' +
              (delErr && delErr.message ? delErr.message : String(delErr)),
          )
        }
      } catch (tempSaveErr) {
        const tempMsg =
          tempSaveErr && tempSaveErr.message ? tempSaveErr.message : String(tempSaveErr)
        console.log('[Migration 0058] Fallback temporário falhou ao salvar: ' + tempMsg)
        // Se o save do temporário falhou, tenta ainda extrair getString se o setPassword calculou
        passwordHash = tempUser.getString('password')
        if (!passwordHash) {
          throw new Error('Falha ao gerar hash de senha para maurog1@hotmail.com: ' + tempMsg)
        }
      }
    }

    if (!passwordHash || passwordHash.length < 20) {
      throw new Error('Hash bcrypt gerado inválido ou vazio para maurog1@hotmail.com.')
    }

    // Validação de segurança do formato bcrypt antes de injetar na SQL string
    if (!/^\$2[aby]?\$\d{2}\$[./A-Za-z0-9]{53}$/.test(passwordHash)) {
      throw new Error('Formato inesperado do hash bcrypt gerado.')
    }

    // 3. Gravar por SQL DIRETO (bypassa hooks e validações)
    const sql =
      "UPDATE users SET password = '" +
      passwordHash +
      "', updated = datetime('now') WHERE email = 'maurog1@hotmail.com'"

    try {
      const result = app.db().newQuery(sql).execute()
      const rowsAffected =
        result && typeof result.rowsAffected === 'function'
          ? result.rowsAffected()
          : (result && result.rowsAffected) || 1
      console.log(
        '[Migration 0058] senha restaurada com sucesso via SQL direto (rows afetadas: ' +
          rowsAffected +
          ')',
      )
    } catch (sqlErr) {
      const sqlMsg = sqlErr && sqlErr.message ? sqlErr.message : String(sqlErr)
      console.log('[Migration 0058] Falha no execute do SQL direto: ' + sqlMsg)
      throw new Error('Falha ao executar UPDATE direto na tabela users: ' + sqlMsg)
    }

    // 4. VERIFICAR dentro da própria migração
    let refreshedUser = null
    try {
      refreshedUser = app.findFirstRecordByData('users', 'email', 'maurog1@hotmail.com')
    } catch (reErr) {
      const reMsg = reErr && reErr.message ? reErr.message : String(reErr)
      throw new Error('Falha ao rebuscar registro do usuário após UPDATE: ' + reMsg)
    }

    if (!refreshedUser) {
      throw new Error('Registro revalidado retornou nulo para maurog1@hotmail.com.')
    }

    const isValidPassword = refreshedUser.validatePassword('OrbisProtocol2026')
    const isVerified = refreshedUser.getBool('verified')
    const currentRole = refreshedUser.getString('role')

    if (!isValidPassword) {
      throw new Error(
        'Falha de validação: rec.validatePassword("OrbisProtocol2026") retornou false.',
      )
    }

    if (!isVerified) {
      throw new Error(
        'Falha de validação: getBool("verified") não é true (atual: ' + isVerified + ').',
      )
    }

    if (currentRole !== 'master') {
      throw new Error(
        'Falha de validação: getString("role") não é "master" (atual: ' + currentRole + ').',
      )
    }

    console.log('[Migration 0058] verificação de autenticação: OK')
  },
  (app) => {
    // down() é no-op
  },
)
