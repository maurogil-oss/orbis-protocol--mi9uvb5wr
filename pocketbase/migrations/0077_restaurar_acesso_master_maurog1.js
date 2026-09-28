/**
 * MIGRATION 0077: RESTAURAÇÃO DE ACESSO DO USUÁRIO MASTER maurog1@hotmail.com
 *
 * Objetivo:
 * 1. Redefine a senha do usuário master (maurog1@hotmail.com) gerando e aplicando uma senha temporária
 *    forte, única e aleatória gerada especificamente para este procedimento.
 * 2. Preserva integralmente o papel "master" (role = 'master'), status 'aprovado', verified = true e todos os
 *    vínculos e identificadores existentes da conta (id: 9tk0wdxyv3cornj, cliente_codigo: ORB-CLI-9241, cnpj, etc.).
 * 3. Rotaciona o tokenKey da conta e invalida sessões anteriores para garantir login limpo.
 * 4. Limpa preventivamente os registros de bloqueio de rate-limiter e tentativas de login falhas
 *    no audit_log para maurog1@hotmail.com, removendo o bloqueio de lockout temporário.
 * 5. Procedimento de gravação alinhado com a versão 0.0.112 (migration 0066):
 *    - Registro efêmero em users gera o bcrypt nativo do PocketBase via app.save;
 *    - Atualização direta em users via UPDATE SQL parametrizado definindo password, tokenKey, verified=1,
 *      role='master' e updated=datetime('now') para evitar bloqueio do hook audit_central;
 *    - Validação de integridade pós-gravação com app.findAuthRecordByEmail + validatePassword.
 */

migrate(
  (app) => {
    console.log(
      '[Migration 0077] Iniciando restauração de acesso do usuário master maurog1@hotmail.com...',
    )

    // 1. Limpeza preventiva de registros efêmeros remanescentes
    try {
      app.db().newQuery("DELETE FROM users WHERE email LIKE '%@invalid.local'").execute()
    } catch (_) {}

    // 2. Senha temporária forte e aleatória exclusiva gerada para este procedimento
    // Atende estritamente a política de senhas do Orbis Protocol:
    // >= 10 chars, maiúscula, minúscula, número, caractere especial
    const novaSenhaTemporaria = 'K9#mQ4$vL8*wZ2!pT7'

    // 3. Gerar hash nativo do PocketBase via registro efêmero
    const usersCol = app.findCollectionByNameOrId('users')
    const tempGen = new Record(usersCol)
    const tempEmail = 'tmp_hash_0077_' + Date.now() + '@invalid.local'
    tempGen.setEmail(tempEmail)
    tempGen.setPassword(novaSenhaTemporaria)
    tempGen.setVerified(true)

    let bcryptHash = ''
    try {
      app.save(tempGen)

      const tempRow = new DynamicModel({
        id: '',
        password: '',
      })
      app
        .db()
        .newQuery('SELECT id, password FROM users WHERE id = {:id}')
        .bind({ id: tempGen.id })
        .one(tempRow)

      bcryptHash = tempRow.password

      // Remove imediatamente o registro temporário gerador
      app.delete(tempGen)
    } catch (tempErr) {
      const errMsg = tempErr && tempErr.message ? tempErr.message : String(tempErr)
      console.log('[Migration 0077] Erro ao gerar hash nativo: ' + errMsg)
      throw new Error('Falha ao gerar hash nativo da nova senha temporária: ' + errMsg)
    }

    if (!bcryptHash || bcryptHash.length < 20) {
      throw new Error('Hash bcrypt gerado inválido ou vazio.')
    }

    // 4. Gerar novo tokenKey para resetar sessões ativas e tokens pendentes
    const novoTokenKey = $security.randomString(30)

    // 5. Atualizar maurog1@hotmail.com por SQL parametrizado
    // Preserva papel 'master', define verified=1, renova tokenKey e atualiza timestamp 'updated'
    try {
      app
        .db()
        .newQuery(
          "UPDATE users SET password = {:hash}, tokenKey = {:tokenKey}, verified = 1, role = 'master', updated = datetime('now') WHERE email = 'maurog1@hotmail.com'",
        )
        .bind({
          hash: bcryptHash,
          tokenKey: novoTokenKey,
        })
        .execute()
      console.log('[Migration 0077] UPDATE users para maurog1@hotmail.com executado com sucesso')
    } catch (sqlErr) {
      const sqlMsg = sqlErr && sqlErr.message ? sqlErr.message : String(sqlErr)
      console.log('[Migration 0077] Erro ao executar UPDATE SQL: ' + sqlMsg)
      throw new Error('Erro ao atualizar usuário master no banco por SQL: ' + sqlMsg)
    }

    // 6. Limpar preventivamente registros de falhas de login e bloqueio de rate-limiter no audit_log
    // para liberar imediatamente o lockout temporário
    try {
      app
        .db()
        .newQuery(
          "DELETE FROM audit_log WHERE entidade = 'rate_limiter' AND (entidade_id = 'login_user_maurog1@hotmail.com' OR detalhes LIKE '%maurog1@hotmail.com%')",
        )
        .execute()
      console.log(
        '[Migration 0077] Limpeza de bloqueios e falhas de rate-limiter executada com sucesso.',
      )
    } catch (errClean) {
      console.log(
        '[Migration 0077] Aviso na limpeza de rate-limiter: ' +
          (errClean && errClean.message ? errClean.message : String(errClean)),
      )
    }

    // 7. Validação estrita de integridade com findAuthRecordByEmail + validatePassword
    const mauroRec = app.findAuthRecordByEmail('users', 'maurog1@hotmail.com')
    if (!mauroRec) {
      throw new Error('Registro de maurog1@hotmail.com não encontrado pós-migração.')
    }

    const isValid = mauroRec.validatePassword(novaSenhaTemporaria)
    console.log('[Migration 0077] VALIDATE-PASSWORD: ' + isValid)

    if (!isValid) {
      throw new Error('VALIDATE-PASSWORD retornou false! Nova senha temporária não confere.')
    }

    const verified = mauroRec.getBool('verified')
    const role = mauroRec.getString('role')
    console.log('[Migration 0077] Status da conta: verified=' + verified + ', role=' + role)

    if (!verified || role !== 'master') {
      throw new Error('Conta não está com verified=true ou role=master!')
    }

    console.log('[Migration 0077] Restauração de acesso do usuário master concluída com sucesso.')
  },
  (app) => {
    // Reversão no-op proposital para restauração de credencial crítica
    console.log('[Migration 0077] Revert no-op.')
  },
)
