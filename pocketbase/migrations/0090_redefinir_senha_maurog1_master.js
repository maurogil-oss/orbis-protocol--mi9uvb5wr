/**
 * MIGRATION 0090: REDEFINIÇÃO DE SENHA DO USUÁRIO MASTER - maurog1@hotmail.com
 *
 * Objetivo:
 * 1. Redefine a senha do usuário master (maurog1@hotmail.com, id: 9tk0wdxyv3cornj)
 *    para '@Maurogil2026' (com o @ inicial, exatamente como solicitado pelo usuário).
 * 2. Política de senha satisfeita:
 *    - Mínimo de 10 caracteres (tem 14)
 *    - Pelo menos 1 letra maiúscula ('M')
 *    - Pelo menos 1 letra minúscula ('a', 'u', 'r', 'o', 'g', 'i', 'l')
 *    - Pelo menos 1 número ('2', '0', '2', '6')
 *    - Pelo menos 1 caractere especial ('@')
 * 3. Mecanismo de hash nativo:
 *    - Cria um registro temporário efêmero em users com setPassword('@Maurogil2026')
 *      para que o PocketBase gere o hash bcrypt nativo via app.save(tempGen).
 *    - Lê a coluna password gerada e remove imediatamente o registro efêmero.
 * 4. Gotcha do projeto:
 *    - UPDATE em users via SQL direto parametrizado (definindo password, tokenKey, verified=1,
 *      role='master', updated=datetime('now')) para evitar abortos de hooks (audit_central) em migrações
 *      e garantir que o timestamp 'updated' reflita a alteração imediata.
 * 5. Limpa preventivamente bloqueios e tentativas de rate-limiter no audit_log para maurog1@hotmail.com.
 * 6. Validação de integridade pós-gravação com app.findAuthRecordByEmail + validatePassword('@Maurogil2026').
 */

migrate(
  (app) => {
    console.log(
      '[Migration 0090] Iniciando redefinição de senha para o usuário master maurog1@hotmail.com...',
    )

    // 1. Limpeza preventiva de eventuais registros efêmeros remanescentes
    try {
      app.db().newQuery("DELETE FROM users WHERE email LIKE '%@invalid.local'").execute()
    } catch (_) {}

    const novaSenhaDesejada = '@Maurogil2026'

    // 2. Criar registro efêmero para gerar hash nativo seguro do PocketBase
    const usersCol = app.findCollectionByNameOrId('users')
    const tempGen = new Record(usersCol)
    const tempEmail = 'tmp_hash_0090_' + Date.now() + '@invalid.local'
    tempGen.setEmail(tempEmail)
    tempGen.setPassword(novaSenhaDesejada)
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
      console.log('[Migration 0090] Erro ao gerar hash nativo: ' + errMsg)
      throw new Error('Falha ao gerar hash nativo da nova senha do master: ' + errMsg)
    }

    if (!bcryptHash || bcryptHash.length < 20) {
      throw new Error('Hash bcrypt gerado inválido ou vazio.')
    }

    // 3. Rotacionar tokenKey para renovar sessões e invalidar tokens anteriores
    const novoTokenKey = $security.randomString(30)

    // 4. Atualizar maurog1@hotmail.com por SQL parametrizado
    // Preserva papel 'master', status_aprovacao='aprovado', verified=1, tokenKey e atualiza 'updated'
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
      console.log('[Migration 0090] UPDATE users para maurog1@hotmail.com executado com sucesso.')
    } catch (sqlErr) {
      const sqlMsg = sqlErr && sqlErr.message ? sqlErr.message : String(sqlErr)
      console.log('[Migration 0090] Erro ao executar UPDATE SQL: ' + sqlMsg)
      throw new Error('Erro ao atualizar usuário master no banco por SQL: ' + sqlMsg)
    }

    // 5. Limpeza de rate-limiter e lockout preventivo no audit_log
    try {
      app
        .db()
        .newQuery(
          "DELETE FROM audit_log WHERE entidade = 'rate_limiter' AND (entidade_id = 'login_user_maurog1@hotmail.com' OR entidade_id LIKE '%maurog1@hotmail.com%' OR detalhes LIKE '%maurog1@hotmail.com%')",
        )
        .execute()
      console.log(
        '[Migration 0090] Limpeza preventiva de lockout e rate-limiter concluída com sucesso.',
      )
    } catch (cleanErr) {
      console.log(
        '[Migration 0090] Aviso na limpeza de rate-limiter: ' +
          (cleanErr && cleanErr.message ? cleanErr.message : String(cleanErr)),
      )
    }

    // 6. Validação estrita de integridade com findAuthRecordByEmail + validatePassword
    const mauroRec = app.findAuthRecordByEmail('users', 'maurog1@hotmail.com')
    if (!mauroRec) {
      throw new Error('Registro de maurog1@hotmail.com não encontrado pós-migração.')
    }

    const isValid = mauroRec.validatePassword(novaSenhaDesejada)
    console.log('[Migration 0090] VALIDATE-PASSWORD: ' + isValid)

    if (!isValid) {
      throw new Error(
        'VALIDATE-PASSWORD retornou false! Nova senha temporária @Maurogil2026 não confere.',
      )
    }

    const verified = mauroRec.getBool('verified')
    const role = mauroRec.getString('role')
    console.log('[Migration 0090] Status da conta: verified=' + verified + ', role=' + role)

    if (!verified || role !== 'master') {
      throw new Error('Conta não está com verified=true ou role=master!')
    }

    console.log(
      '[Migration 0090] Senha do usuário master maurog1@hotmail.com redefinida e validada com sucesso!',
    )
  },
  (app) => {
    console.log('[Migration 0090] Revert no-op.')
  },
)
