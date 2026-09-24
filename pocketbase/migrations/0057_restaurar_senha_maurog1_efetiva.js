/**
 * MIGRATION 0057: RESTAURAÇÃO DEFINITIVA DE SENHA - maurog1@hotmail.com
 *
 * (1) Diagnóstico da causa raiz:
 *     - O erro "Invalid variable type: must be a NullStringMap" na tentativa anterior ocorreu
 *       pelo uso de app.db().newQuery(...).one(row) passando um objeto JS comum ({}) como
 *       parâmetro de var pointer do Go/Goja dbx, que exige um tipo dbx.NullStringMap.
 *     - A migração 0055 anterior suprimia qualquer erro via try/catch silencioso e não validava
 *       a efetivação do save.
 *
 * (2) Requisitos atendidos nesta migração:
 *     - Localiza o usuário 'maurog1@hotmail.com' na coleção users (_pb_users_auth_).
 *     - Aplica user.setPassword('OrbisProtocol2026') (senha forte >= 10 chars com maiúscula,
 *       minúscula e número, compatível com o hook password_policy).
 *     - Mantém verified=true e role='master' intactos.
 *     - Executa app.save(user); se falhar, loga o erro real e tenta fallback via app.saveNoValidate(user).
 *     - Sem catch silencioso: emite log explícito no backend do sucesso ou erro real.
 *     - A senha NUNCA é impressa nos logs.
 *     - Nenhum outro registro de usuário é afetado.
 */

migrate(
  (app) => {
    let user
    try {
      user = app.findFirstRecordByData('users', 'email', 'maurog1@hotmail.com')
    } catch (errFind) {
      const msg = errFind && errFind.message ? errFind.message : String(errFind)
      console.log('[Migration 0057] Erro ao localizar usuário maurog1@hotmail.com: ' + msg)
      throw new Error('Usuário maurog1@hotmail.com não localizado na coleção users: ' + msg)
    }

    if (!user) {
      console.log('[Migration 0057] Usuário maurog1@hotmail.com não encontrado.')
      throw new Error('Usuário maurog1@hotmail.com não encontrado na coleção users.')
    }

    // Aplicar a nova credencial e preservar os privilégios de Governança Master
    user.setPassword('OrbisProtocol2026')
    user.setVerified(true)
    user.set('role', 'master')

    let sucesso = false
    try {
      app.save(user)
      sucesso = true
      console.log(
        '[Migration 0057] senha restaurada com sucesso para maurog1@hotmail.com via app.save()',
      )
    } catch (saveErr) {
      const saveErrMsg = saveErr && saveErr.message ? saveErr.message : String(saveErr)
      console.log(
        '[Migration 0057] app.save() reportou erro ao persistir usuário: ' +
          saveErrMsg +
          '. Tentando fallback via app.saveNoValidate()...',
      )

      try {
        if (typeof app.saveNoValidate === 'function') {
          app.saveNoValidate(user)
          sucesso = true
          console.log(
            '[Migration 0057] senha restaurada com sucesso para maurog1@hotmail.com via app.saveNoValidate()',
          )
        } else {
          throw new Error('Método app.saveNoValidate não está disponível no contexto da migração.')
        }
      } catch (noValErr) {
        const noValErrMsg = noValErr && noValErr.message ? noValErr.message : String(noValErr)
        console.log('[Migration 0057] Falha crítica também no app.saveNoValidate(): ' + noValErrMsg)
        throw new Error(
          'Falha definitiva ao salvar restauração de senha para maurog1@hotmail.com: ' +
            noValErrMsg +
            ' | Erro original app.save: ' +
            saveErrMsg,
        )
      }
    }

    if (!sucesso) {
      throw new Error('Não foi possível persistir a nova senha de maurog1@hotmail.com.')
    }
  },
  (app) => {
    // Reversão no-op: não remover credencial nem bloquear o acesso restaurado
    console.log('[Migration 0057] Reversão executada (no-op).')
  },
)
