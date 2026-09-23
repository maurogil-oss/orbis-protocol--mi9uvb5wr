/**
 * ENDPOINT DE GOVERNANÇA EXCLUSIVO DO GESTOR MASTER
 *
 * Rota 1: POST /backend/v1/master/aprovar-gestao
 * - Aprovar ou recusar conta com perfil Gestão pendente de aprovação
 * - Se aprovado, define role definitivo ('admin', 'controller', 'financeiro', 'financeiro_leitor') e status_aprovacao = 'aprovado'
 * - Se recusado, define status_aprovacao = 'rejeitado'
 * - Grava na trilha audit_log com quem fez (master), quando e alvo
 *
 * Rota 2: POST /backend/v1/master/alterar-papel
 * - Alterar o papel de qualquer usuário (exceto promover a 'master' — regra estrita: master só via banco)
 * - Grava na trilha audit_log
 *
 * Exclusivo para: papel 'master'
 * Bloqueado categoricamente para: admin comum, financeiro, financeiro_leitor, controller, perito, cliente, público.
 */

routerAdd(
  'POST',
  '/backend/v1/master/aprovar-gestao',
  (e) => {
    try {
      const auth = e.auth
      if (!auth) {
        return e.json(401, { error: 'Autenticação necessária.' })
      }

      const operadorRole = auth.getString('role')
      if (operadorRole !== 'master') {
        return e.json(403, {
          error:
            'Acesso restrito: APENAS o papel Gestor Master possui autorização para aprovar ou recusar contas de Gestão. Administradores comuns operam o Console mas não possuem privilégios de governança de acessos.',
        })
      }

      const body = e.requestInfo().body || {}
      const targetUserId = String(body.user_id || '').trim()
      const decisao = String(body.decisao || '')
        .trim()
        .toLowerCase() // 'aprovar' | 'recusar'
      const roleDefinido = String(body.novo_papel || 'admin')
        .trim()
        .toLowerCase()
      const justificativa = String(body.justificativa || '').trim()

      if (!targetUserId) {
        return e.badRequestError('ID do usuário é obrigatório.')
      }

      if (decisao !== 'aprovar' && decisao !== 'recusar') {
        return e.badRequestError("Decisão inválida. Deve ser 'aprovar' ou 'recusar'.")
      }

      // Regra de segurança: NUNCA conceder papel 'master' via endpoint/interface
      if (roleDefinido === 'master') {
        return e.badRequestError(
          "Violação de segurança: O papel 'master' NUNCA pode ser concedido pela interface ou APIs. Apenas operação direta no banco de dados.",
        )
      }

      let targetUser
      try {
        targetUser = $app.findFirstRecordByData('_pb_users_auth_', 'id', targetUserId)
      } catch (_) {
        return e.notFoundError('Usuário não localizado no sistema.')
      }

      const roleAnterior = targetUser.getString('role')
      const statusAnterior = targetUser.getString('status_aprovacao') || 'pendente'

      if (decisao === 'aprovar') {
        targetUser.set('status_aprovacao', 'aprovado')
        // Atribui o papel de gestão designado (ex: admin, controller, financeiro, financeiro_leitor)
        const papeisPermitidos = [
          'admin',
          'controller',
          'financeiro',
          'financeiro_leitor',
          'perito',
          'cliente',
          'cliente_acp',
          'parceiro',
        ]
        if (papeisPermitidos.indexOf(roleDefinido) !== -1) {
          targetUser.set('role', roleDefinido)
        } else {
          targetUser.set('role', 'admin')
        }
      } else {
        targetUser.set('status_aprovacao', 'rejeitado')
      }

      $app.save(targetUser)

      // Gravação explícita e rica no audit_log
      const auditCol = $app.findCollectionByNameOrId('audit_log')
      const log = new Record(auditCol)
      log.set(
        'acao',
        decisao === 'aprovar' ? 'master_aprovou_conta_gestao' : 'master_recusou_conta_gestao',
      )
      log.set('entidade', 'users')
      log.set('entidade_id', targetUserId)
      log.set('ator_id', auth.id)
      log.set('ator_email', auth.getString('email'))
      log.set('papel', 'master')
      log.set('detalhes', {
        master_nome: auth.getString('name') || auth.getString('email'),
        master_email: auth.getString('email'),
        alvo_user_id: targetUserId,
        alvo_email: targetUser.getString('email'),
        alvo_nome: targetUser.getString('name'),
        decisao: decisao,
        status_aprovacao_anterior: statusAnterior,
        novo_status_aprovacao: targetUser.getString('status_aprovacao'),
        papel_anterior: roleAnterior,
        novo_papel: targetUser.getString('role'),
        justificativa: justificativa || 'Decisão pelo Painel de Governança do Gestor Master',
        timestamp: new Date().toISOString(),
      })
      log.set(
        'ip',
        e.requestInfo().headers['x-forwarded-for'] || e.requestInfo().headers['x-real-ip'] || '',
      )
      $app.save(log)

      return e.json(200, {
        sucesso: true,
        decisao: decisao,
        status_aprovacao: targetUser.getString('status_aprovacao'),
        novo_papel: targetUser.getString('role'),
        mensagem:
          decisao === 'aprovar'
            ? `Conta de Gestão para ${targetUser.getString('email')} aprovada com papel '${targetUser.getString('role')}'. Trilha de auditoria registrada.`
            : `Conta de Gestão para ${targetUser.getString('email')} recusada pelo Gestor Master. Trilha de auditoria registrada.`,
      })
    } catch (err) {
      return e.json(500, {
        error: err.message || 'Falha ao processar governança de conta de gestão.',
      })
    }
  },
  $apis.requireAuth(),
)

routerAdd(
  'POST',
  '/backend/v1/master/alterar-papel',
  (e) => {
    try {
      const auth = e.auth
      if (!auth) {
        return e.json(401, { error: 'Autenticação necessária.' })
      }

      const operadorRole = auth.getString('role')
      if (operadorRole !== 'master') {
        return e.json(403, {
          error:
            'Acesso negado: Apenas o gestor master pode alterar papéis de usuários. Administradores comuns operam o Console sem alterar papéis.',
        })
      }

      const body = e.requestInfo().body || {}
      const targetUserId = String(body.user_id || '').trim()
      const novoPapel = String(body.novo_papel || '')
        .trim()
        .toLowerCase()
      const justificativa = String(body.justificativa || '').trim()

      if (!targetUserId || !novoPapel) {
        return e.badRequestError('ID do usuário e novo papel são obrigatórios.')
      }

      // Regra de segurança inegociável: NUNCA promover a master por interface ou endpoint
      if (novoPapel === 'master') {
        return e.badRequestError(
          "Violação de segurança: O papel 'master' NUNCA pode ser atribuído pela interface ou chamadas HTTP. Apenas inserção/migração manual direta no banco.",
        )
      }

      const papeisValidos = [
        'admin',
        'controller',
        'perito',
        'cliente',
        'financeiro',
        'financeiro_leitor',
        'cliente_acp',
        'parceiro',
      ]
      if (papeisValidos.indexOf(novoPapel) === -1) {
        return e.badRequestError(
          `Papel '${novoPapel}' inválido. Valores aceitos: ${papeisValidos.join(', ')}`,
        )
      }

      let targetUser
      try {
        targetUser = $app.findFirstRecordByData('_pb_users_auth_', 'id', targetUserId)
      } catch (_) {
        return e.notFoundError('Usuário não localizado no sistema.')
      }

      const papelAnterior = targetUser.getString('role')
      if (papelAnterior === 'master') {
        return e.badRequestError(
          'O papel do usuário Gestor Master atual não pode ser rebaixado por este endpoint.',
        )
      }

      targetUser.set('role', novoPapel)
      $app.save(targetUser)

      // Gravar na trilha de auditoria
      const auditCol = $app.findCollectionByNameOrId('audit_log')
      const log = new Record(auditCol)
      log.set('acao', 'master_alterou_papel_usuario')
      log.set('entidade', 'users')
      log.set('entidade_id', targetUserId)
      log.set('ator_id', auth.id)
      log.set('ator_email', auth.getString('email'))
      log.set('papel', 'master')
      log.set('detalhes', {
        master_nome: auth.getString('name') || auth.getString('email'),
        master_email: auth.getString('email'),
        alvo_user_id: targetUserId,
        alvo_email: targetUser.getString('email'),
        alvo_nome: targetUser.getString('name'),
        papel_anterior: papelAnterior,
        novo_papel: novoPapel,
        justificativa: justificativa || 'Governança de papéis pelo Gestor Master',
        timestamp: new Date().toISOString(),
      })
      log.set(
        'ip',
        e.requestInfo().headers['x-forwarded-for'] || e.requestInfo().headers['x-real-ip'] || '',
      )
      $app.save(log)

      return e.json(200, {
        sucesso: true,
        novo_papel: novoPapel,
        mensagem: `Papel de ${targetUser.getString('email')} alterado de '${papelAnterior}' para '${novoPapel}'. Trilha de auditoria registrada.`,
      })
    } catch (err) {
      return e.json(500, { error: err.message || 'Falha ao alterar papel do usuário.' })
    }
  },
  $apis.requireAuth(),
)
