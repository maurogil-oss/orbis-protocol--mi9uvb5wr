/**
 * MIGRATION 0055: RESTAURAÇÃO DEFINITIVA DE SENHA - maurog1@hotmail.com
 *
 * Gera o hash da senha temporária "OrbisProtocol2026" usando o mecanismo nativo
 * do PocketBase (via registro descartável com setPassword) e grava o resultado
 * por SQL direto na tabela users para o registro maurog1@hotmail.com:
 * - SEM app.save no registro de maurog1 e SEM passar pelos hooks de update (audit_central).
 * - Log explícito do resultado ("senha restaurada com sucesso" ou mensagem real de erro).
 * - NUNCA loga a senha em claro.
 * - Verificação final dentro do backend via findAuthRecordByEmail + record.validatePassword()
 *   logando "VALIDATE-PASSWORD: true" ou "VALIDATE-PASSWORD: false".
 * - Mantém verified=true e role=master do maurog1 intactos.
 * - Limpa o usuário de teste test-block@orbisprotocol.org caso ainda exista.
 */

migrate(
  (app) => {
    console.log('[Migration 0055] Iniciando restauração de senha para maurog1@hotmail.com...')

    // 1. Limpeza do usuário de teste descartável da Etapa 2 se ainda existir
    try {
      const testUser = app.findAuthRecordByEmail('users', 'test-block@orbisprotocol.org')
      if (testUser) {
        app.delete(testUser)
        console.log('[Migration 0055] Usuário de teste descartável removido com sucesso.')
      }
    } catch (_) {}

    // 2. Obter hash seguro gerado nativamente pelo PocketBase
    const usersCol = app.findCollectionByNameOrId('users')
    const tempUser = new Record(usersCol)
    const tempEmail = 'tmp_hash_' + Date.now() + '@invalid.local'
    tempUser.setEmail(tempEmail)
    tempUser.setPassword('OrbisProtocol2026')
    tempUser.setVerified(true)

    let passwordHash = ''
    try {
      app.save(tempUser)

      const row = new DynamicModel({
        id: '',
        password: '',
      })
      app.db().newQuery('SELECT id, password FROM users WHERE id = {:id}')
        .bind({ id: tempUser.id })
        .one(row)

      passwordHash = row.password

      app.delete(tempUser)
    } catch (tempErr) {
      const errMsg = tempErr && tempErr.message ? tempErr.message : String(tempErr)
      console.log('[Migration 0055] Erro ao gerar hash nativo: ' + errMsg)
      throw new Error('Falha ao gerar hash nativo para senha: ' + errMsg)
    }

    if (!passwordHash || passwordHash.length < 20) {
      console.log('[Migration 0055] Hash de senha inválido ou não extraído.')
      throw new Error('Hash de senha gerado inválido ou vazio.')
    }

    // 3. Atualizar maurog1@hotmail.com por SQL direto
    let updateOk = false
    try {
      app.db().newQuery(
        "UPDATE users SET password = {:hash}, verified = 1, role = 'master', updated = datetime('now') WHERE email = 'maurog1@hotmail.com'"
      ).bind({ hash: passwordHash }).execute()
      updateOk = true
      console.log('[Migration 0055] senha restaurada com sucesso via SQL direto')
    } catch (sqlErr) {
      const sqlMsg = sqlErr && sqlErr.message ? sqlErr.message : String(sqlErr)
      console.log('[Migration 0055] Erro ao executar SQL direto: ' + sqlMsg)
      throw new Error('Erro ao atualizar senha no banco por SQL direto: ' + sqlMsg)
    }

    // 4. Verificação final via findAuthRecordByEmail + record.validatePassword
    try {
      const mauroRecord = app.findAuthRecordByEmail('users', 'maurog1@hotmail.com')
      if (!mauroRecord) {
        console.log('[Migration 0055] Registro de maurog1@hotmail.com não localizado após atualização.')
        throw new Error('Registro não localizado pós-atualização.')
      }

      const isValid = mauroRecord.validatePassword('OrbisProtocol2026')
      console.log('VALIDATE-PASSWORD: ' + (isValid ? 'true' : 'false'))

      const verified = mauroRecord.getBool('verified')
      const role = mauroRecord.getString('role')
      console.log('[Migration 0055] Verificação atributos: verified=' + verified + ', role=' + role)

      if (!isValid) {
        throw new Error('VALIDATE-PASSWORD retornou false após a restauração.')
      }
      if (!verified) {
        throw new Error('Atributo verified não está true após a restauração.')
      }
      if (role !== 'master') {
        throw new Error("Atributo role não é 'master' após a restauração.")
      }

      console.log('[Migration 0055] Validação concluída com sucesso total.')
    } catch (verifyErr) {
      const vMsg = verifyErr && verifyErr.message ? verifyErr.message : String(verifyErr)
      console.log('[Migration 0055] Falha na verificação pós-atualização: ' + vMsg)
      throw new Error('Falha na verificação pós-atualização: ' + vMsg)
    }
  },
  (app) => {
    // Reversão no-op
    console.log('[Migration 0055] Reversão executada (no-op).')
  }
)
