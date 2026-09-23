/**
 * ENDPOINT DE GOVERNANÇA: LIBERAÇÃO / SUSPENSÃO DE ACESSO DE PARCEIRO
 *
 * Rota: POST /backend/v1/admin/parceiro-acesso
 *
 * Exclusivo para: admin e financeiro (papel com permissão de edição)
 * Bloqueado para: financeiro_leitor (somente leitura), cliente, parceiro, público
 *
 * Registra evento no audit_log: quem liberou, quando, para quem e status anterior/novo.
 */

routerAdd(
  'POST',
  '/backend/v1/admin/parceiro-acesso',
  (e) => {
    try {
      const auth = e.auth
      if (!auth) {
        return e.json(401, { error: 'Autenticação necessária.' })
      }

      const role = auth.getString('role')
      // financeiro_leitor não pode liberar/suspender acessos; somente master, admin ou gestor financeiro
      if (role !== 'master' && role !== 'admin' && role !== 'financeiro') {
        return e.json(403, {
          error:
            'Acesso negado. A liberação/suspensão de acessos de parceiros é exclusiva de administradores, gestores master e gestores financeiros. Leitores financeiros possuem acesso apenas para visualização.',
        })
      }

      const body = e.requestInfo().body || {}
      const targetUserId = String(body.user_id || '').trim()
      const novoStatus = String(body.status || '')
        .trim()
        .toLowerCase()
      const motivo = String(body.motivo || '').trim()

      if (!targetUserId) {
        return e.badRequestError('ID do usuário parceiro é obrigatório.')
      }

      if (novoStatus !== 'pendente' && novoStatus !== 'liberado' && novoStatus !== 'suspenso') {
        return e.badRequestError("Status inválido. Deve ser 'pendente', 'liberado' ou 'suspenso'.")
      }

      let targetUser
      try {
        targetUser = $app.findFirstRecordByData('_pb_users_auth_', 'id', targetUserId)
      } catch (_) {
        return e.notFoundError('Usuário parceiro não encontrado.')
      }

      const statusAnt = targetUser.getString('parceiro_acesso_status') || 'pendente'
      targetUser.set('parceiro_acesso_status', novoStatus)
      $app.save(targetUser)

      // Registra explicitamente o evento no audit_log com quem liberou, quando e para quem
      const auditCol = $app.findCollectionByNameOrId('audit_log')
      const log = new Record(auditCol)
      log.set('acao', 'parceiro_acesso_decisao_painel')
      log.set('entidade', 'users')
      log.set('entidade_id', targetUserId)
      log.set('ator_id', auth.id)
      log.set('ator_email', auth.getString('email'))
      log.set('papel', role)
      log.set('detalhes', {
        operador_nome: auth.getString('name') || auth.getString('email'),
        operador_email: auth.getString('email'),
        operador_papel: role,
        parceiro_user_id: targetUserId,
        parceiro_email: targetUser.getString('email'),
        parceiro_nome: targetUser.getString('name'),
        cliente_codigo: targetUser.getString('cliente_codigo'),
        status_anterior: statusAnt,
        novo_status: novoStatus,
        motivo: motivo || 'Decisão pelo Painel de Clientes da Controladoria',
        timestamp: new Date().toISOString(),
      })
      log.set(
        'ip',
        e.requestInfo().headers['x-forwarded-for'] || e.requestInfo().headers['x-real-ip'] || '',
      )
      $app.save(log)

      // Atualiza o registro em parceiros correspondente
      try {
        const pCol = $app.findCollectionByNameOrId('parceiros')
        let pRec
        try {
          pRec = $app.findFirstRecordByData('parceiros', 'usuario', targetUserId)
        } catch (_) {}

        if (pRec) {
          if (novoStatus === 'liberado') {
            pRec.set('status', 'ativo')
          } else if (novoStatus === 'suspenso') {
            pRec.set('status', 'suspenso')
          } else {
            pRec.set('status', 'inativo')
          }
          $app.save(pRec)
        }
      } catch (eParc) {
        console.log('Aviso ao sincronizar status na coleção parceiros:', eParc)
      }

      return e.json(200, {
        sucesso: true,
        novo_status: novoStatus,
        mensagem: `Acesso do parceiro ${targetUser.getString('email')} atualizado para ${novoStatus.toUpperCase()} com auditoria.`,
      })
    } catch (err) {
      return e.json(500, {
        error: err.message || 'Falha ao atualizar status de acesso do parceiro.',
      })
    }
  },
  $apis.requireAuth(),
)
