/**
 * ENDPOINT DE CONTROLE: SUSPENSÃO E REATIVAÇÃO DE CONTAS CLIENTE
 *
 * Rota: POST /backend/v1/admin/cliente-acesso
 *
 * Autorizado para: master e admin
 * Bloqueado para: cliente, parceiro, perito, financeiro_leitor, público
 *
 * Ação:
 * - Suspender ou Reativar conta cliente (cliente_acesso_status = 'ativo' | 'suspenso')
 * - Suspensão EXIGE motivo obrigatório (mínimo 5 caracteres)
 * - Grava evento 'cliente_suspenso' ou 'cliente_reativado' no audit_log com motivo,
 *   status anterior, quem realizou (operador), e-mail e dados do cliente.
 */

routerAdd(
  'POST',
  '/backend/v1/admin/cliente-acesso',
  (e) => {
    try {
      const auth = e.auth
      if (!auth) {
        return e.json(401, { error: 'Autenticação necessária.' })
      }

      const role = auth.getString('role')
      if (role !== 'master' && role !== 'admin') {
        return e.json(403, {
          error:
            'Acesso negado: A suspensão ou reativação de contas cliente é restrita aos papéis Gestor Master e Administrador.',
        })
      }

      const body = e.requestInfo().body || {}
      const targetUserId = String(body.user_id || '').trim()
      const novoStatus = String(body.status || '')
        .trim()
        .toLowerCase() // 'ativo' | 'suspenso'
      const motivo = String(body.motivo || '').trim()

      if (!targetUserId) {
        return e.badRequestError('ID do usuário cliente é obrigatório.')
      }

      if (novoStatus !== 'ativo' && novoStatus !== 'suspenso') {
        return e.badRequestError("Status inválido. Deve ser 'ativo' ou 'suspenso'.")
      }

      // Proteção anti-travamento: Operador não pode suspender a própria conta
      if (auth.id === targetUserId) {
        return e.badRequestError('Operação inválida: Não é permitido suspender a própria conta.')
      }

      // Se for suspensão, o motivo é obrigatório (mínimo 5 caracteres)
      if (novoStatus === 'suspenso' && (!motivo || motivo.length < 5)) {
        return e.badRequestError(
          'Motivo obrigatório para suspensão de conta cliente (mínimo 5 caracteres).',
        )
      }

      let targetUser
      try {
        targetUser = $app.findFirstRecordByData('_pb_users_auth_', 'id', targetUserId)
      } catch (_) {
        return e.notFoundError('Usuário não localizado no sistema.')
      }

      const targetRole = targetUser.getString('role')
      // Proteção: não permite suspender contas master
      if (targetRole === 'master') {
        return e.badRequestError(
          'Operação inválida: A conta do Gestor Master não pode ser suspensa.',
        )
      }

      const statusAnterior = targetUser.getString('cliente_acesso_status') || 'ativo'
      targetUser.set('cliente_acesso_status', novoStatus)
      $app.save(targetUser)

      // Gravação explícita no audit_log: 'cliente_suspenso' ou 'cliente_reativado'
      const acaoLog = novoStatus === 'suspenso' ? 'cliente_suspenso' : 'cliente_reativado'
      const timestampIso = new Date().toISOString()
      let clientIp = '127.0.0.1'
      try {
        const info = e.requestInfo()
        if (info && info.headers) {
          const fwd =
            info.headers['x-forwarded-for'] || info.headers['x-real-ip'] || info.remoteIP || ''
          clientIp = String(fwd).split(',')[0].trim() || '127.0.0.1'
        }
      } catch (_) {}

      try {
        const auditCol = $app.findCollectionByNameOrId('audit_log')
        if (auditCol) {
          const log = new Record(auditCol)

          let previousHash = 'GENESIS_HASH_CLIENTE_ACESSO_ORBIS_2026'
          try {
            const ultimos = $app.findRecordsByFilter('audit_log', 'id != ""', '-created', 1, 0)
            if (ultimos && ultimos.length > 0) {
              const u = ultimos[0]
              const d = u.get('detalhes') || {}
              previousHash = (d && d.chain_hash) || u.getString('hash_sha256') || u.id
            }
          } catch (_) {}

          const canonicalStr = `${acaoLog}|${targetUserId}|${auth.id}|${statusAnterior}|${novoStatus}|${timestampIso}|${previousHash}`
          const chainHash = $security.sha256(canonicalStr)

          log.set('acao', acaoLog)
          log.set('entidade', 'users')
          log.set('entidade_id', targetUserId)
          log.set('ator_id', auth.id)
          log.set('ator_email', auth.getString('email'))
          log.set('papel', role)
          log.set('ip', clientIp)
          log.set('detalhes', {
            operador_id: auth.id,
            operador_email: auth.getString('email'),
            operador_papel: role,
            cliente_id: targetUserId,
            cliente_email: targetUser.getString('email'),
            cliente_nome: targetUser.getString('name'),
            cliente_role: targetRole,
            cliente_codigo: targetUser.getString('cliente_codigo'),
            status_anterior: statusAnterior,
            novo_status: novoStatus,
            motivo:
              motivo ||
              (novoStatus === 'ativo'
                ? 'Reativação solicitada via Console Admin'
                : 'Suspensão de conta'),
            timestamp: timestampIso,
            previous_hash: previousHash,
            chain_hash: chainHash,
          })
          $app.save(log)
        }
      } catch (errAudit) {
        console.log('[cliente_acesso] Erro ao gravar evento em audit_log:', errAudit)
      }

      return e.json(200, {
        sucesso: true,
        novo_status: novoStatus,
        status_anterior: statusAnterior,
        mensagem:
          novoStatus === 'suspenso'
            ? `Conta de ${targetUser.getString('email')} suspensa com sucesso. Registro gravado no audit_log.`
            : `Conta de ${targetUser.getString('email')} reativada com sucesso. Registro gravado no audit_log.`,
      })
    } catch (err) {
      return e.json(500, {
        error: err.message || 'Falha ao alterar status de acesso da conta cliente.',
      })
    }
  },
  $apis.requireAuth(),
)
