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

    // Permite especificar o agente alvo (default: assistente-orbis; suporta triador-ingestao-cdv e revisor-pericial)
    const agentSlug = body.agent ? String(body.agent).trim() : 'assistente-orbis'
    const conversationId = body.conversation_id ? String(body.conversation_id) : null

    const result = $ai.agent(agentSlug).chat({
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

// Rota dedicada de triagem de documento/lote para o agente nativo "triador-ingestao-cdv"
// Recebe documento fiscal / lote antes da gravação e retorna propostas de categoria e anomalias
routerAdd('POST', '/backend/v1/cdv/triagem', (e) => {
  try {
    const body = e.requestInfo().body || {}
    const documento = body.documento || body.lote || body

    let userId = e.auth ? e.auth.id : null
    if (!userId) {
      try {
        const anonUser = $app.findAuthRecordByEmail('users', 'visitante-ia@orbisprotocol.com')
        userId = anonUser.id
      } catch (_) {
        return e.json(500, { error: 'Usuário de atendimento não configurado no backend.' })
      }
    }

    // Montar prompt estruturado com os dados do documento para o agente
    const promptTriagem = `Realize a triagem técnica prévia de ingestão do seguinte documento/lote:
${JSON.stringify(documento, null, 2)}

Diretrizes obrigatórias:
1. Proponha a categoria de material (enum: aco, aluminio, cobre, polimeros, concreto, agro_rastreado, outros) para cada item com justificativa técnica.
2. Identifique anomalias antes da gravação:
   - Chave de acesso duplicada no mesmo dia (consulte coleções cdv_lotes, selos).
   - Massa total ou unitária fora da faixa plausível do segmento.
   - CNPJ inválido ou suspeito.
   - Campos obrigatórios faltantes (peso <= 0, descrição vazia).
   - Tentativa indevida de classificar agro como "Fração Crítica (Ouro/Paládio/Prata/Terras Raras)" — soja e grãos devem ser "agro_rastreado" com CO2e = 0.
3. NUNCA calcule ou decida valores de CO2e, hashes ou assinaturas (isso é do motor determinístico).
4. Responda ESTRITAMENTE em formato JSON conforme o schema contratual.`

    let agentContent = ''
    try {
      const result = $ai.agent('triador-ingestao-cdv').chat({
        user_id: userId,
        message: promptTriagem,
      })
      agentContent = result.content || ''
    } catch (agentErr) {
      console.log('[Triador Ingestão CDV] Aviso chamada agente IA:', agentErr)
    }

    // Parse do JSON da resposta do agente
    let parsed = null
    if (agentContent) {
      try {
        const jsonMatch = agentContent.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0])
        }
      } catch (parseErr) {
        console.log('[Triador Ingestão CDV] Erro de parse JSON do agente:', parseErr)
      }
    }

    // Se o agente respondeu com sucesso estruturado
    if (parsed && typeof parsed.aprovado_para_ingestao === 'boolean') {
      return e.json(200, {
        sucesso: true,
        fonte: 'agente_nativo',
        triagem: parsed,
      })
    }

    // Contingência determinística resiliente (não-bloqueante)
    // Se o modelo falhar ou timeout, gera triagem baseada em regras determinísticas
    const anomalias = []
    const classificacao = []

    const chave = String(documento.chaveAcesso || documento.chave_acesso || '')
    if (chave && chave.length !== 44) {
      anomalias.push({
        codigo: 'CHAVE_INVALIDA',
        severidade: 'alta',
        descricao: 'Chave de acesso não possui 44 dígitos regulamentares.',
        campo_afetado: 'chaveAcesso',
        sugestao_correcao: 'Verifique os 44 dígitos da NF-e / CT-e.',
      })
    }

    const cnpj = String(documento.cnpjEmitente || documento.cnpj || '').replace(/\D/g, '')
    if (cnpj && cnpj.length !== 14) {
      anomalias.push({
        codigo: 'CNPJ_INVALIDO',
        severidade: 'alta',
        descricao: 'CNPJ do emitente não possui 14 dígitos válidos.',
        campo_afetado: 'cnpjEmitente',
        sugestao_correcao: 'Forneça um CNPJ corporativo válido.',
      })
    }

    const itens = documento.itens || documento.pecas || []
    if (!itens || itens.length === 0) {
      anomalias.push({
        codigo: 'LOTE_SEM_PECAS',
        severidade: 'critica',
        descricao: 'Documento/lote sem itens ou peças informadas.',
        campo_afetado: 'itens',
        sugestao_correcao: 'Inclua ao menos um item ou peça no lote.',
      })
    } else {
      itens.forEach((it, idx) => {
        const peso = Number(it.pesoKg || it.peso_kg || 0)
        const desc = String(it.xProd || it.descricao_peca || it.descricao || '')

        if (peso <= 0) {
          anomalias.push({
            codigo: 'CAMPO_OBRIGATORIO_FALTANTE',
            severidade: 'alta',
            descricao: `Item #${idx + 1} (${desc || 'sem nome'}) possui peso nulo ou menor igual a zero.`,
            campo_afetado: `itens[${idx}].pesoKg`,
            sugestao_correcao: 'Declare o peso unitário em kg maior que zero.',
          })
        }

        const descLower = desc.toLowerCase()
        let cat = 'outros'
        let justificativa = 'Classificação geral do catálogo'
        let obs = 'Sem crédito de carbono direto'

        if (
          descLower.includes('soja') ||
          descLower.includes('grão') ||
          descLower.includes('grao') ||
          descLower.includes('milho')
        ) {
          cat = 'agro_rastreado'
          justificativa = 'Biomassa e grãos agrícolas em estruturação de catálogo'
          obs = 'Agro rastreado com CO2e = 0 por design'
        } else if (
          descLower.includes('cobre') ||
          descLower.includes('chicote') ||
          descLower.includes('alternador')
        ) {
          cat = 'cobre'
          justificativa = 'Bobinamento elétrico / metal condutor'
          obs = 'Fator ICA 2024 (4,10 kgCO2e/kg) sem flag'
        } else if (
          descLower.includes('aço') ||
          descLower.includes('aco') ||
          descLower.includes('porta') ||
          descLower.includes('capô')
        ) {
          cat = 'aco'
          justificativa = 'Estamparia ferrosa / estrutura metálica'
          obs = 'Fator worldsteel 2025 (2,18 kgCO2e/kg) sem flag'
        } else if (
          descLower.includes('aluminio') ||
          descLower.includes('alumínio') ||
          descLower.includes('roda')
        ) {
          cat = 'aluminio'
          justificativa = 'Liga leve / carcaça metálica'
          obs = 'Fator IAI 2024 (14,40 kgCO2e/kg) sem flag'
        } else if (
          descLower.includes('parachoque') ||
          descLower.includes('painel') ||
          descLower.includes('polimero')
        ) {
          cat = 'polimeros'
          justificativa = 'Termoplástico de engenharia (PP/EPDM/ABS)'
          obs = 'Fator 1,90 kgCO2e/kg com flag [Pendente de verificação de fonte]'
        } else if (descLower.includes('concreto') || descLower.includes('rcd')) {
          cat = 'concreto'
          justificativa = 'Resíduo mineral de construção civil'
          obs = 'Fator CONAMA 307 (0,12 kgCO2e/kg)'
        }

        classificacao.push({
          item_index: idx,
          descricao: desc,
          categoria_material: cat,
          justificativa: justificativa,
          fator_referencia: null,
          observacao_metodologica: obs,
        })
      })
    }

    const temBloqueante = anomalias.some((a) => a.severidade === 'critica')
    const nivelRisco = temBloqueante ? 'bloqueante' : anomalias.length > 0 ? 'medio' : 'baixo'

    return e.json(200, {
      sucesso: true,
      fonte: 'motor_contingencia',
      triagem: {
        aprovado_para_ingestao: !temBloqueante,
        nivel_risco: nivelRisco,
        resumo_triagem:
          'Triagem preliminar baseada em regras paramétricas de contingência do Orbis Protocol.',
        classificacao_proposta: classificacao,
        anomalias_detectadas: anomalias,
      },
    })
  } catch (err) {
    console.log('[Triador Ingestão CDV] Erro no endpoint /backend/v1/cdv/triagem:', err)
    return e.json(500, { error: err.message || 'Erro interno na triagem de ingestão.' })
  }
})
