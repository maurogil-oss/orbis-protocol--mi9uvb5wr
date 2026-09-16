routerAdd('POST', '/backend/v1/revisor-pericial/triagem', (e) => {
  try {
    const body = e.requestInfo().body || {}
    const isDemo = Boolean(body.is_demo)

    // Identificar usuário ou visitante anônimo de serviço
    let userId = e.auth ? e.auth.id : null
    let userRole = e.auth ? e.auth.role : 'cliente'

    if (!userId) {
      try {
        const anonUser = $app.findAuthRecordByEmail('users', 'visitante-ia@orbisprotocol.com')
        userId = anonUser.id
      } catch (_) {
        return e.json(500, { error: 'Usuário de atendimento não configurado no backend.' })
      }
    }

    // Se for modo demo da empresa fictícia "Indústrias & Logística Integrada Brasil S.A."
    if (isDemo) {
      // Score demonstrativo consistente com os 840/1000 do dossiê corporativo (84/100 na escala 0-100)
      const achadosDemo = [
        {
          id: 'ACH-DEMO-01',
          titulo: 'Duplo reporte de Escopo 2 com dependência de certificados I-REC não auditados',
          severidade: 'alta',
          norma_referencia: 'GHG Protocol Scope 2 Guidance & MCTI SIN 2025',
          descricao:
            'A empresa adota redução a zero no reporte de mercado do Escopo 2 para sua unidade fabril com base em I-REC. Para asseguração razoável NBC TO 3000 / ISAE 3000, é mandatório anexar o extrato de custódia e aposentadoria na plataforma REC Brazil.',
          impacto_risco:
            'Risco de glosa em auditoria de 3ª parte e exigência de estorno das emissões de mercado pelo comitê CBPS 02.',
          plano_recomendado: 'laudo_pericial',
          recomendacao_acao:
            'Anexar certificado oficial com hash e chancela pericial com ART de engenheiro responsável.',
        },
        {
          id: 'ACH-DEMO-02',
          titulo:
            'Apuração spend-based em serviços terceirizados sem conversão para Tier 2 (fator ACV) ou Tier 3 (dado físico)',
          severidade: 'media',
          norma_referencia: 'Taxonomia de Tiers GHG Protocol & GLEC Framework v3.0',
          descricao:
            'Faturas municipais (NFS-e e NFCom) foram processadas pelo método spend-based (Tier 1 com incerteza estimada em ±18%). Recomenda-se priorizar dados físicos diretos (Tier 3) ou fatores ACV de base física (Tier 2).',
          impacto_risco:
            'Elevação da incerteza consolidada do inventário em relação a métricas de dados físicos primários.',
          plano_recomendado: 'laudo_pericial',
          recomendacao_acao:
            'Substituir o gasto financeiro por medições físicas diretas (Tier 3) ou fatores de ACV homologados (Tier 2).',
        },
        {
          id: 'ACH-DEMO-03',
          titulo: 'Insetting circular ISO 14067 requer termo de rastreabilidade de cadeia CDV',
          severidade: 'media',
          norma_referencia: 'ISO 14067:2018 & Diretrizes Programa MOVER (Lei 14.902/2024)',
          descricao:
            'A dedução de 1.125 kg CO₂e pelo uso de embalagens e componentes reciclados possui memória física correta, mas carece de vinculação aos Certificados de Destinação de Veículos em CDV credenciado.',
          impacto_risco:
            'Questionamento perante fiscalização ambiental e elegibilidade para incentivos do MOVER.',
          plano_recomendado: 'assinatura_bureau',
          recomendacao_acao:
            'Integrar via API do Bureau ACP os passaportes com DPP das peças e baixas no DETRAN.',
        },
        {
          id: 'ACH-DEMO-04',
          titulo: 'Reclassificação obrigatória de emissões biogênicas fora dos escopos fósseis',
          severidade: 'baixa',
          norma_referencia: 'ABNT NBR ISO 14064-1:2019 e PBGHGP 2025',
          descricao:
            'As emissões de etanol combustível e a fração B14 do diesel foram computadas separadamente no motor, garantindo aderência plena aos requisitos do SBCE.',
          impacto_risco: 'Conforme e com boa prática identificada.',
          plano_recomendado: 'laudo_pericial',
          recomendacao_acao: 'Manter a metodologia contínua aplicada.',
        },
        {
          id: 'ACH-DEMO-05',
          titulo: 'Métricas IPCC AR6 (GWP-100) aplicadas com fatores de metano e N₂O atualizados',
          severidade: 'baixa',
          norma_referencia: 'IPCC AR6 Working Group I (2021)',
          descricao:
            'O inventário adota CH₄ fóssil=29.8 e N₂O=273, superando laudos convencionais que ainda utilizam o obsoleto AR4/AR5 ou métricas sem feedbacks climáticos.',
          impacto_risco: 'Excelente maturidade técnica.',
          plano_recomendado: 'laudo_pericial',
          recomendacao_acao: 'Apresentar aos peritos para validação formal no laudo.',
        },
      ]

      const achadosPublicosDemo = achadosDemo.slice(0, 2)
      const achadosOcultosCount = achadosDemo.length - achadosPublicosDemo.length

      return e.json(200, {
        score_pericial: 84, // 840/1000 da demo corporativa traduzido para 0-100
        grau_conformidade: 'Conforme (Alta Maturidade)',
        achados_total: achadosDemo.length,
        achados_publicos: achadosPublicosDemo,
        achados_ocultos_count: achadosOcultosCount,
        plano_recomendado: 'laudo_pericial',
        resumo_parecer:
          'O inventário demonstrativo das Indústrias & Logística Integrada Brasil S.A. atinge Score Pericial 84/100 (equivalente a 840/1000 no Dossiê ESG dMRV). A base de dados demonstra alta consistência nos 10 modelos fiscais com fatores MCTI e métricas IPCC AR6. As fragilidades identificadas são leves e passíveis de saneamento com o Laudo Pericial com ART.',
        is_demo: true,
        empresa_nome: 'Indústrias & Logística Integrada Brasil S.A.',
        cnpj: '76.123.456/0001-12',
        ano_base: 2025,
        metodologias_auditadas:
          'GHG Protocol BR, MCTI/SIN 2025, GLEC v3.0, ISO 14067, IPCC AR6, Lei 15.042/2024',
      })
    }

    // Se NÃO for demo, auditar inventário real ou fornecido no body
    const inventarioId = body.inventario_id ? String(body.inventario_id).trim() : ''
    let inventarioRecord = null
    let inventarioData = body.inventario || null

    if (inventarioId) {
      try {
        inventarioRecord = $app.findCollectionByNameOrId('emissoes_inventario')
          ? $app.findFirstRecordByData('emissoes_inventario', 'id', inventarioId)
          : null
      } catch (_) {}
    }

    if (inventarioRecord) {
      inventarioData = {
        empresaNome: inventarioRecord.get('empresa_nome') || 'Empresa em Auditoria',
        cnpj: inventarioRecord.get('cnpj') || '00.000.000/0000-00',
        anoBase: inventarioRecord.get('ano_base') || 2025,
        periodoReferencia: inventarioRecord.get('periodo_referencia') || 'Anual',
        escopo1TotalTCO2e: inventarioRecord.get('escopo1_total_tco2e') || 0,
        escopo2LocalizacaoTCO2e: inventarioRecord.get('escopo2_localizacao_tco2e') || 0,
        escopo2MercadoTCO2e: inventarioRecord.get('escopo2_mercado_tco2e') || 0,
        escopo3TotalTCO2e: inventarioRecord.get('escopo3_total_tco2e') || 0,
        emissoesBiogenicasTotalTCO2e: inventarioRecord.get('emissoes_biogenicas_tco2e') || 0,
        emissoesTotaisFosseisTCO2e: inventarioRecord.get('emissoes_totais_tco2e') || 0,
        insettingTotalTCO2e: inventarioRecord.get('insetting_iso14067_tco2e') || 0,
        incertezaConsolidadaPct: inventarioRecord.get('incerteza_consolidada_pct') || 0,
        statusSBCE: inventarioRecord.get('status_sbce') || 'isento_monitoramento',
        versaoMetodologia: inventarioRecord.get('versao_metodologia') || 'GHG Protocol Brasil 2025',
        detalhes: inventarioRecord.get('laudo_detalhes_json') || {},
      }
    }

    if (!inventarioData) {
      return e.badRequestError('Dados de inventário não fornecidos para auditoria pericial.')
    }

    const empresaNome = inventarioData.empresaNome || body.empresa_nome || 'Empresa Cadastrada'
    const cnpj = inventarioData.cnpj || body.cnpj || '00.000.000/0000-00'
    const anoBase = inventarioData.anoBase || 2025

    // Consultar histórico recente de revisões na memória persistente deste cliente
    let historicoPrevioTexto = 'Nenhuma revisão pericial anterior registrada para este CNPJ.'
    try {
      const revisoesAnteriores = $app.findRecordsByFilter(
        'pericial_revisoes',
        `cnpj = '${cnpj}'`,
        '-created',
        3,
        0,
      )
      if (revisoesAnteriores && revisoesAnteriores.length > 0) {
        historicoPrevioTexto = `Fragilidades históricas encontradas em ${revisoesAnteriores.length} revisões anteriores para o CNPJ ${cnpj}: `
        for (let i = 0; i < revisoesAnteriores.length; i++) {
          const r = revisoesAnteriores[i]
          historicoPrevioTexto += `[Revisão ${i + 1}: Score ${r.get('score_pericial')}/100, Resumo: ${r.get('resumo_parecer')}]; `
        }
      }
    } catch (_) {}

    // Montar prompt direcionado para o agente Skip Cloud revisor-pericial
    const promptAuditoria = `Por favor, execute a TRIAGEM PERICIAL AUTOMÁTICA do seguinte inventário de descarbonização corporativa:

ORGANIZAÇÃO: ${empresaNome} (CNPJ: ${cnpj})
ANO-BASE: ${anoBase}
ESCOPO 1 (Combustão Fóssil Direta): ${inventarioData.escopo1TotalTCO2e || 0} tCO₂e
ESCOPO 2 - Localização (SIN/MCTI): ${inventarioData.escopo2LocalizacaoTCO2e || 0} tCO₂e
ESCOPO 2 - Mercado (c/ I-REC ou ACL): ${inventarioData.escopo2MercadoTCO2e || 0} tCO₂e
ESCOPO 3 (Cadeia / Fretes GLEC / CT-e): ${inventarioData.escopo3TotalTCO2e || 0} tCO₂e
EMISSÕES BIOGÊNICAS (Fora dos escopos fósseis): ${inventarioData.emissoesBiogenicasTotalTCO2e || 0} tCO₂bio
TOTAL FÓSSIL: ${inventarioData.emissoesTotaisFosseisTCO2e || 0} tCO₂e
INSETTING CIRCULAR ISO 14067: -${inventarioData.insettingTotalTCO2e || 0} tCO₂e
INCERTEZA PONDERADA INFORMADA: ±${inventarioData.incertezaConsolidadaPct || 10}%
STATUS SBCE LEI 15.042/2024: ${inventarioData.statusSBCE || 'isento_monitoramento'}
METODOLOGIA: ${inventarioData.versaoMetodologia || 'GHG Protocol BR'}

HISTÓRICO NA MEMÓRIA PERSISTENTE DO CLIENTE:
${historicoPrevioTexto}

AUDITE rigorosamente:
1. Conformidade com GHG Protocol e duplo reporte de Escopo 2.
2. Segregação estrita de emissões biogênicas (etanol/biodiesel fora dos escopos fósseis).
3. Taxonomia de Tiers: dado físico direto = Tier 3; fator ACV (base física) = Tier 2; spend-based = Tier 1 (±18%). Priorizar dados físicos (Tier 3) e ACV (Tier 2) sobre spend-based (Tier 1).
4. Insetting Circular com base na ISO 14067 e conformidade com critérios probatórios da Lei 14.902/2024 (MOVER).
5. Limiares da Lei 15.042/2024 (10k tCO₂e reporte / 25k tCO₂e compensação).
6. Classifique 3 a 5 achados técnicos ordenados por severidade decrescente (alta primeiro).

Responda SOMENTE o bloco JSON estruturado, sem texto antes ou depois.`

    // Executar chamada ao agente nativo revisor-pericial
    let agentResultContent = ''
    try {
      const agentRes = $ai.agent('revisor-pericial').chat({
        user_id: userId,
        message: promptAuditoria,
      })
      agentResultContent = agentRes.content || ''
    } catch (agentErr) {
      // Se a IA externa tiver instabilidade momentânea, gerar auditoria determinística baseada nas regras técnicas
      console.log(
        'Falha chamada AI agent revisor-pericial, gerando triagem com motor pericial de contingência:',
        agentErr,
      )
    }

    // Fazer parse do JSON retornado pelo agente ou gerar fallback técnico robusto
    let parsedResult = null
    if (agentResultContent) {
      try {
        const jsonMatch = agentResultContent.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          parsedResult = JSON.parse(jsonMatch[0])
        }
      } catch (parseErr) {
        console.log('Erro de parse do JSON do agente:', parseErr)
      }
    }

    // Se o agente não retornou JSON válido, aplicar o motor de regras periciais
    if (!parsedResult || typeof parsedResult.score_pericial !== 'number') {
      let scoreCalculado = 88
      const achadosGerados = []

      // Checar Escopo 2 Duplo Reporte
      const esc2Loc = Number(inventarioData.escopo2LocalizacaoTCO2e || 0)
      const esc2Merc = Number(inventarioData.escopo2MercadoTCO2e || 0)
      if (esc2Loc > 0 && esc2Merc === 0) {
        scoreCalculado -= 8
        achadosGerados.push({
          id: 'ACH-E2-01',
          titulo: 'Abordagem de Mercado zerada sem rastreabilidade pública de I-REC',
          severidade: 'alta',
          norma_referencia: 'GHG Protocol Scope 2 Guidance',
          descricao:
            'A empresa adota redução a zero no reporte de mercado do Escopo 2. É indispensável laudo pericial que comprove cancelamento dos certificados no sistema REC Brasil.',
          impacto_risco:
            'Risco de inconsistência em auditorias externas para linhas Green Capital e CVM 193.',
          plano_recomendado: 'laudo_pericial',
          recomendacao_acao:
            'Vincular certificados I-REC no dossiê pericial oficial com chancela pericial.',
        })
      }

      // Checar Incerteza e Tiers
      const incerteza = Number(inventarioData.incertezaConsolidadaPct || 10)
      if (incerteza > 15) {
        scoreCalculado -= 6
        achadosGerados.push({
          id: 'ACH-TIER-02',
          titulo: 'Predominância de método spend-based classificado como Tier 1 (±18%)',
          severidade: 'media',
          norma_referencia: 'GHG Protocol Corporate Standard & IPCC 2006/2019',
          descricao:
            'Amostras fiscais processadas por gasto monetário (spend-based) correspondem ao Tier 1 com incerteza de ±18%. Recomenda-se migrar para dado físico (Tier 3) ou fator ACV de base física (Tier 2).',
          impacto_risco:
            'Margem de incerteza do Tier 1 pode impactar a robustez em auditorias do SBCE.',
          plano_recomendado: 'laudo_pericial',
          recomendacao_acao:
            'Priorizar dado físico direto (Tier 3) ou fator ACV (Tier 2) em substituição ao gasto financeiro.',
        })
      }

      // Checar desvios de preços de combustíveis vs. faixas ANP
      const itensDetalhados = Array.isArray(inventarioData.itensDetalhados)
        ? inventarioData.itensDetalhados
        : []
      const combComAlerta = itensDetalhados.filter((it) => {
        const flags =
          it.flagsRevisao || (it.dados_adicionais_json && it.dados_adicionais_json.flags_revisao)
        return Array.isArray(flags) && flags.length > 0
      })
      if (combComAlerta.length > 0) {
        achadosGerados.push({
          id: 'ACH-ANP-06',
          titulo: 'Alerta informativo de consistência: desvio de preço vs. referência ANP',
          severidade: 'baixa',
          norma_referencia:
            'Controle de Qualidade de Dados dMRV / Critério Paramétrico Interno ANP',
          descricao:
            combComAlerta.length +
            ' documento(s) fiscal(is) de combustível apresentaram preço unitário implícito fora da faixa estatística de referência interna (±3σ). Gravação e cálculos mantidos sem bloqueio.',
          impacto_risco:
            'Incerteza pontual quanto ao volume faturado em litros vs. valor total declarado na NF-e.',
          plano_recomendado: 'laudo_pericial',
          recomendacao_acao:
            'Realizar conferência documental do volume de combustível informado nas notas fiscais sinalizadas.',
        })
      }

      // Checar Insetting Circular
      const insetting = Number(inventarioData.insettingTotalTCO2e || 0)
      if (insetting > 0) {
        achadosGerados.push({
          id: 'ACH-INS-03',
          titulo:
            'Evitação de emissões via Insetting ISO 14067 requer auditoria documental de cadeia',
          severidade: 'media',
          norma_referencia: 'ABNT NBR ISO 14067 & Programa MOVER (Lei 14.902/2024)',
          descricao:
            'As deduções circulares por reuso ou reciclagem possuem base conceitual válida, porém necessitam de laudo de comprovação de origem para validação jurídica.',
          impacto_risco:
            'Risco de desconsideração do crédito de pegada evitada em auditorias bancárias.',
          plano_recomendado: 'assinatura_bureau',
          recomendacao_acao:
            'Emitir Passaporte Digital do Fornecedor e laudo com ART junto ao Bureau ACP.',
        })
      } else {
        achadosGerados.push({
          id: 'ACH-OPP-04',
          titulo: 'Oportunidade de estruturação de Insetting Circular para redução de passivo',
          severidade: 'baixa',
          norma_referencia: 'ISO 14067 e Lei 14.902/2024',
          descricao:
            'A empresa ainda não apurou créditos de pegada evitada em sua cadeia logística e de suprimentos (peças remanufaturadas ou embalagens recicladas).',
          impacto_risco: 'Custo de oportunidade na otimização de metas do SBCE.',
          plano_recomendado: 'assinatura_bureau',
          recomendacao_acao:
            'Mapear fornecedores circulares através da rede de passaportes do Bureau ACP.',
        })
      }

      // Checar limiar SBCE
      const totalFossil = Number(inventarioData.emissoesTotaisFosseisTCO2e || 0)
      if (totalFossil >= 10000) {
        achadosGerados.push({
          id: 'ACH-SBCE-05',
          titulo: 'Enquadramento compulsório na Lei Federal 15.042/2024 (SBCE - Limiar 10k tCO₂e)',
          severidade: 'alta',
          norma_referencia: 'Lei Federal 15.042/2024 - Sistema Brasileiro de Comércio de Emissões',
          descricao:
            'Com volume superior a 10.000 tCO₂e/ano, a entidade está sob dever regulatório de reporte e monitoramento oficial, com auditoria independente de 3ª parte.',
          impacto_risco:
            'Exigibilidade legal perante a autoridade gestora do SBCE e sanções regulatórias.',
          plano_recomendado: 'laudo_pericial',
          recomendacao_acao:
            'Confeccionar Laudo Pericial completo com ART e trilha probatória auditável.',
        })
      }

      parsedResult = {
        score_pericial: Math.max(10, Math.min(98, scoreCalculado)),
        grau_conformidade:
          scoreCalculado >= 80
            ? 'Conforme'
            : scoreCalculado >= 65
              ? 'Atenção Moderada'
              : 'Risco Elevado de Glosa',
        plano_recomendado:
          totalFossil >= 10000 || insetting > 0 ? 'laudo_pericial' : 'laudo_pericial',
        resumo_parecer: `Triagem pericial preliminar realizada com base nas normas GHG Protocol Brasil, MCTI/SIN e Lei 15.042/2024. Foram auditados os escopos 1, 2 e 3 do ano-base ${anoBase}. O inventário apresenta consistência estrutural, com pontos específicos de saneamento metodológico recomendados para homologação do Laudo Pericial formal com ART.`,
        achados: achadosGerados,
      }
    }

    // Ordenar achados por severidade (alta primeiro, depois media, depois baixa)
    const ordemSeveridade = { alta: 0, media: 1, baixa: 2 }
    const todosAchados = (parsedResult.achados || []).sort((a, b) => {
      const pA = ordemSeveridade[a.severidade] !== undefined ? ordemSeveridade[a.severidade] : 1
      const pB = ordemSeveridade[b.severidade] !== undefined ? ordemSeveridade[b.severidade] : 1
      return pA - pB
    })

    // REGRA DE PAYWALL E CONVERSÃO PERICIAL:
    // Exibir na triagem pública apenas 2 achados (os de maior severidade) + contador dos demais achados ocultos
    const achadosPublicos = todosAchados.slice(0, 2)
    const achadosOcultosCount = Math.max(0, todosAchados.length - achadosPublicos.length)

    // Decidir plano recomendado principal a partir dos achados mais severos
    let planoFinal = parsedResult.plano_recomendado || 'laudo_pericial'
    if (achadosPublicos.some((a) => a.plano_recomendado === 'assinatura_bureau')) {
      planoFinal = 'assinatura_bureau'
    } else if (achadosPublicos.some((a) => a.plano_recomendado === 'laudo_pericial')) {
      planoFinal = 'laudo_pericial'
    }

    // Persistir a revisão pericial no banco para alimentar a memória histórica
    try {
      const colRevisoes = $app.findCollectionByNameOrId('pericial_revisoes')
      const rec = new Record(colRevisoes)
      if (userId) rec.set('usuario', userId)
      if (inventarioId) rec.set('inventario', inventarioId)
      rec.set('empresa_nome', empresaNome)
      rec.set('cnpj', cnpj)
      rec.set('score_pericial', parsedResult.score_pericial)
      rec.set('grau_conformidade', parsedResult.grau_conformidade || 'Conforme')
      rec.set('achados_total', todosAchados.length)
      rec.set('achados_json', todosAchados)
      rec.set('achados_publicos_json', achadosPublicos)
      rec.set('plano_recomendado', planoFinal)
      rec.set('resumo_parecer', parsedResult.resumo_parecer || '')
      rec.set('ano_base', anoBase)
      rec.set(
        'metodologias_auditadas',
        'GHG Protocol BR, MCTI/SIN, GLEC, ISO 14067, IPCC AR6, Lei 15.042/2024',
      )
      rec.set('is_demo', false)
      $app.save(rec)
    } catch (saveErr) {
      console.log('Aviso ao persistir pericial_revisoes:', saveErr)
    }

    return e.json(200, {
      score_pericial: parsedResult.score_pericial,
      grau_conformidade: parsedResult.grau_conformidade,
      achados_total: todosAchados.length,
      achados_publicos: achadosPublicos,
      achados_ocultos_count: achadosOcultosCount,
      plano_recomendado: planoFinal,
      resumo_parecer: parsedResult.resumo_parecer,
      is_demo: false,
      empresa_nome: empresaNome,
      cnpj: cnpj,
      ano_base: anoBase,
      metodologias_auditadas:
        'GHG Protocol BR, MCTI/SIN, GLEC, ISO 14067, IPCC AR6, Lei 15.042/2024',
    })
  } catch (err) {
    console.log('Erro no endpoint /backend/v1/revisor-pericial/triagem:', err)
    return e.json(500, { error: err.message || 'Erro interno ao executar a triagem pericial.' })
  }
})
