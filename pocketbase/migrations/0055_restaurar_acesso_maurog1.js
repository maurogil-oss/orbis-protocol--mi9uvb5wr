/**
 * MIGRATION 0055: RESTAURAR ACESSO DO USUÁRIO maurog1@hotmail.com
 *
 * - Localiza o registro de maurog1@hotmail.com na coleção users (_pb_users_auth_)
 * - Define a senha temporária 'OrbisProtocol2026' via setPassword diretamente no registro
 * - Mantém verified=true e role="master" intactos
 * - Sem registrar a senha em logs
 * - Não altera nenhum outro usuário
 */

migrate(
  (app) => {
    try {
      const user = app.findFirstRecordByData('users', 'email', 'maurog1@hotmail.com')
      if (!user) {
        return
      }

      // Define a senha temporária atendendo à política de senha forte
      user.setPassword('OrbisProtocol2026')
      user.setVerified(true)
      user.set('role', 'master')

      app.save(user)
    } catch (_) {
      // Caso não encontre ou ocorra exceção, trata silenciosamente sem vazar dados
    }
  },
  (app) => {
    // Reversão no-op — não remove credencial nem desfaz restauração
  },
)
