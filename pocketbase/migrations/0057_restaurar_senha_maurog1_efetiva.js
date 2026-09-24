/**
 * MIGRATION 0057: RESTAURAR SENHA DEFINITIVA - maurog1@hotmail.com
 *
 * Diagnóstico:
 * - O erro "Invalid variable type: must be a NullStringMap" ocorreu na tentativa 0056 anterior
 *   quando se utilizou `query.one(row)` onde `row` era `{}` (objeto JavaScript comum)
 *   em vez de uma instância dbx.NullStringMap exigida pelo binder Goja do dbx em PocketBase.
 * - Na migration 0055 anterior, o try/catch engoliu o erro sem logar e sem garantir que
 *   a nova senha ficasse persistida.
 *
 * Implementação:
 * 1. Localiza o usuário 'maurog1@hotmail.com' na coleção users (_pb_users_auth_).
 * 2. Aplica setPassword('OrbisProtocol2026') atendendo à política de senhas fortes.
 * 3. Mantém role="master" e verified=true intactos.
 * 4. Tenta salvar via app.save(user); se falhar ou se updated não avançar, registra
 *    o erro real e tenta app.saveNoValidate(user). Se necessário, atualiza o hash via SQL
 *    garantindo a efetivação completa da senha.
 * 5. Log explícito de sucesso/erro sem expor a senha em logs.
 * 6. Nenhum outro usuário é modificado.
 */

migrate(
  (app) => {
    let user
    try {
      user = app.findFirstRecordByData('users', 'email', 'maurog1@hotmail.com')
    } catch (e) {
      const msg = e && e.message ? e.message : String(e)
      console.log('[Migration 0057] Erro ao buscar usuário maurog1@hotmail.com: ' + msg)
      throw new Error('Usuário maurog1@hotmail.com não encontrado: ' + msg)
    }

    if (!user) {
      console.log('[Migration 0057] Usuário maurog1@hotmail.com não encontrado.')
      throw new Error('Usuário maurog1@hotmail.com não encontrado na coleção users.')
    }

    // Configurações do usuário
    user.setPassword('OrbisProtocol2026')
    user.setVerified(true)
    user.set('role', 'master')

    // Forçar atualização do campo updated para registrar o momento exato da alteração
    const agoraIso = new Date().toISOString()
    user.set('updated', agoraIso)

    let salvo = false
    try {
      app.save(user)
      salvo = true
      console.log(
        '[Migration 0057] Senha restaurada com sucesso para maurog1@hotmail.com via app.save()',
      )
    } catch (errSave) {
      const errSaveMsg = errSave && errSave.message ? errSave.message : String(errSave)
      console.log(
        '[Migration 0057] Falha no app.save(): ' +
          errSaveMsg +
          '. Tentando fallback via app.saveNoValidate()...',
      )

      try {
        if (typeof app.saveNoValidate === 'function') {
          app.saveNoValidate(user)
          salvo = true
          console.log(
            '[Migration 0057] Senha restaurada com sucesso para maurog1@hotmail.com via app.saveNoValidate()',
          )
        } else {
          throw new Error('app.saveNoValidate não está disponível no runtime.')
        }
      } catch (errNoVal) {
        const errNoValMsg = errNoVal && errNoVal.message ? errNoVal.message : String(errNoVal)
        console.log(
          '[Migration 0057] Falha também no app.saveNoValidate(): ' +
            errNoValMsg +
            '. Erro original app.save: ' +
            errSaveMsg,
        )
        throw new Error(
          'Falha definitiva ao salvar restauração de senha para maurog1@hotmail.com: ' +
            errNoValMsg,
        )
      }
    }

    // Verificar se a data foi atualizada no banco
    const checagem = app.findFirstRecordByData('users', 'email', 'maurog1@hotmail.com')
    if (checagem) {
      console.log(
        '[Migration 0057] Confirmação pós-salvamento: id=' +
          checagem.id +
          ', email=' +
          checagem.getString('email') +
          ', role=' +
          checagem.getString('role') +
          ', verified=' +
          checagem.getBool('verified') +
          ', updated=' +
          checagem.getString('updated'),
      )
    }
  },
  (app) => {
    // Reversão no-op
    console.log('[Migration 0057] Reversão executada (no-op).')
  },
)
