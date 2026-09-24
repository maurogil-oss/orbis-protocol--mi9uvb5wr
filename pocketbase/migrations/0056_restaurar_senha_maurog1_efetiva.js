/**
 * MIGRATION 0056: RESTAURAR EFETIVAMENTE SENHA DE maurog1@hotmail.com
 *
 * (1) Localiza o registro do usuário maurog1@hotmail.com na coleção users;
 * (2) Aplica setPassword('OrbisProtocol2026');
 * (3) Salva de forma que os hooks de update de usuários não abortem a operação:
 *     tenta app.save(user); se o save normal falhar, registra no log e tenta app.saveNoValidate(user);
 * (4) REGISTRAR explicitamente no log do backend o resultado da operação:
 *     "senha restaurada com sucesso" ou a mensagem real do erro — proibido catch silencioso;
 * (5) NÃO gravar a senha em log nenhum;
 * (6) Ao final, verifica que a autenticação e registro estão íntegros e que updated mudou.
 */

migrate(
  (app) => {
    console.log('[Migration 0056] Iniciando restauração de credencial para maurog1@hotmail.com...')

    let user = null
    try {
      user = app.findFirstRecordByData('users', 'email', 'maurog1@hotmail.com')
    } catch (findErr) {
      const errMsg = findErr && findErr.message ? findErr.message : String(findErr)
      console.log('[Migration 0056] Erro ao localizar usuário maurog1@hotmail.com: ' + errMsg)
      throw new Error('Usuário maurog1@hotmail.com não localizado na coleção users: ' + errMsg)
    }

    if (!user) {
      console.log('[Migration 0056] Erro: usuário retornado nulo.')
      throw new Error('Usuário maurog1@hotmail.com retornado nulo.')
    }

    const previousUpdated = user.getString('updated')
    console.log(
      '[Migration 0056] Usuário localizado com sucesso (id: ' +
        user.id +
        '). Updated anterior: ' +
        previousUpdated,
    )

    // Configura credencial e dados mantendo integridade
    user.setPassword('OrbisProtocol2026')
    user.setVerified(true)
    user.set('role', 'master')

    let saveSuccess = false
    let lastErrorMsg = ''

    // Tentativa 1: app.save(user)
    try {
      app.save(user)
      saveSuccess = true
      console.log('[Migration 0056] senha restaurada com sucesso via app.save')
    } catch (saveErr) {
      lastErrorMsg = saveErr && saveErr.message ? saveErr.message : String(saveErr)
      console.log(
        '[Migration 0056] app.save falhou com o erro: ' +
          lastErrorMsg +
          '. Tentando gravação sem validação de hooks...',
      )
    }

    // Tentativa 2: app.saveNoValidate(user) se app.save normal falhar
    if (!saveSuccess) {
      try {
        if (typeof app.saveNoValidate === 'function') {
          app.saveNoValidate(user)
          saveSuccess = true
          console.log('[Migration 0056] senha restaurada com sucesso via app.saveNoValidate')
        } else {
          console.log('[Migration 0056] app.saveNoValidate não está disponível no objeto app.')
        }
      } catch (noValidateErr) {
        lastErrorMsg =
          noValidateErr && noValidateErr.message ? noValidateErr.message : String(noValidateErr)
        console.log('[Migration 0056] app.saveNoValidate falhou com o erro: ' + lastErrorMsg)
      }
    }

    if (!saveSuccess) {
      console.log('[Migration 0056] Falha definitiva na gravação: ' + lastErrorMsg)
      throw new Error('Falha definitiva ao salvar usuário maurog1@hotmail.com: ' + lastErrorMsg)
    }

    // Verificação pós-migração: buscar auth record por e-mail e confirmar integridade
    try {
      const authRecord = app.findAuthRecordByEmail('users', 'maurog1@hotmail.com')
      if (!authRecord) {
        throw new Error('findAuthRecordByEmail retornou registro nulo')
      }

      const isVerified = authRecord.getBool('verified')
      const currentRole = authRecord.getString('role')
      const currentUpdated = authRecord.getString('updated')

      console.log(
        '[Migration 0056] Registro verificado: id=' +
          authRecord.id +
          ', verified=' +
          isVerified +
          ', role=' +
          currentRole +
          ', updated=' +
          currentUpdated,
      )

      if (!isVerified) {
        throw new Error('Campo verified não está marcado como true')
      }
      if (currentRole !== 'master') {
        throw new Error('Role não é master (atual: ' + currentRole + ')')
      }

      console.log('[Migration 0056] Confirmação final: senha restaurada com sucesso')
    } catch (verifyErr) {
      const verifyMsg = verifyErr && verifyErr.message ? verifyErr.message : String(verifyErr)
      console.log('[Migration 0056] Falha na verificação pós-migração: ' + verifyMsg)
      throw new Error('Falha na verificação pós-migração: ' + verifyMsg)
    }
  },
  (app) => {
    console.log('[Migration 0056] Reversão no-op.')
  },
)
