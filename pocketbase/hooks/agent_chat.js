routerAdd('POST', '/backend/v1/agent-chat', (e) => {
  try {
    const body = e.requestInfo().body || {}
    const message = body.message ? String(body.message).trim() : ''
    if (!message) {
      return e.badRequestError('O campo message é obrigatório.')
    }

    // Identificar usuário autenticado ou usar o usuário de serviço anônimo
    let userId = e.auth ? e.auth.id : null
    if (!userId) {
      try {
        const anonUser = $app.findAuthRecordByEmail('users', 'visitante-ia@orbisprotocol.com')
        userId = anonUser.id
      } catch (_) {
        return e.json(500, { error: 'Usuário de atendimento não configurado no backend.' })
      }
    }

    const conversationId = body.conversation_id ? String(body.conversation_id) : null

    const result = $ai.agent('assistente-orbis').chat({
      user_id: userId,
      conversation_id: conversationId,
      message: message,
    })

    return e.json(200, {
      conversation_id: result.conversation_id,
      content: result.content,
      message_id: result.message_id,
      citations: result.citations || [],
    })
  } catch (err) {
    if (err instanceof SkipAiConfigError) {
      return e.json(503, { error: 'Serviço de IA temporariamente indisponível (configuração).' })
    }
    if (err instanceof SkipAiAgentsError) {
      const status = err.status || 400
      return e.json(status, {
        error: status >= 500 ? 'Falha na execução do agente de IA.' : err.message,
      })
    }
    if (err instanceof SkipAiError) {
      const status = err.status || 502
      return e.json(status, {
        error: status >= 500 ? 'Serviço de IA temporariamente indisponível.' : err.message,
      })
    }
    return e.json(500, { error: err.message || 'Erro interno ao consultar assistente.' })
  }
})
