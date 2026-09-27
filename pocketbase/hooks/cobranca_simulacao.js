routerAdd(
  'POST',
  '/backend/v1/cobranca/confirmar-simulacao',
  (e) => {
    try {
      const body = e.requestInfo().body || {}
      const cobrancaId = body.cobranca_id ? String(body.cobranca_id).trim() : ''
      const justificativa = body.justificativa ? String(body.justificativa).trim() : ''
      const comprovanteRef = body.comprovante_ref ? String(body.comprovante_ref).trim() : ''
      const confirmacaoDupla = Boolean(body.confirmacao_dupla)

      if (!cobrancaId) {
        return e.badRequestError('ID da cobrança é obrigatório.')
      }

      const cobranca = $app.findCollectionByNameOrId('cobrancas')
      const rec = $app.findFirstRecordByData('cobrancas', 'id', cobrancaId)

      // Trilha de Auditoria e Quatro Olhos:
      // Se for liquidação iniciada por admin ou com parâmetros de auditoria
      const valorNum = rec.getFloat('valor') || 0
      const isDivergente =
        rec.getBool('divergencia_preco') || rec.getString('origem_preco') === 'contingencia'

      // Se vier de liquidação manual (onde se passa justificativa ou pelo admin)
      if (justificativa || body.is_manual) {
        if (!justificativa) {
          return e.badRequestError('Justificativa é obrigatória para liquidação manual.')
        }
        if (!comprovanteRef) {
          return e.badRequestError('Referência do comprovante (nº doc/PIX) é obrigatória.')
        }
      }

      // Obter limite de four-eyes da coleção business_settings (com fallback para 5000)
      let limiteFourEyes = 5000
      try {
        const bRecords = $app.findRecordsByFilter('business_settings', 'id != ""', '-created', 1, 0)
        if (bRecords && bRecords.length > 0) {
          const lim = bRecords[0].getFloat('limite_four_eyes')
          if (typeof lim === 'number' && !isNaN(lim) && lim >= 0) {
            limiteFourEyes = lim
          }
        }
      } catch (_) {}

      // Cobranças acima do limite four-eyes configurado exigem dupla confirmação explícita
      if (valorNum > limiteFourEyes && !confirmacaoDupla && body.is_manual) {
        return e.badRequestError(
          'Cobranças com valor acima de R$ ' +
            limiteFourEyes.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) +
            ' exigem dupla confirmação (Regra de Quatro Olhos).',
        )
      }

      let adminId = ''
      let adminNome = ''
      if (e.auth && e.auth.id) {
        adminId = e.auth.id
        adminNome = e.auth.getString('name') || e.auth.getString('email') || 'Administrador'
      } else {
        adminNome = body.liquidado_por || 'Sistema / Operador Autorizado'
      }

      rec.set('status', 'pago')
      rec.set('data_pagamento', new Date().toISOString())
      rec.set('liquidado_por', adminNome + (adminId ? ` (${adminId})` : ''))
      rec.set('liquidado_em', new Date().toISOString())
      if (justificativa) {
        rec.set('liquidacao_justificativa', justificativa)
      }
      if (comprovanteRef) {
        rec.set('liquidacao_comprovante_ref', comprovanteRef)
      }

      // Atualizar cadastro do usuário cliente (cliente_codigo, plano_ativo, etc.)
      try {
        const uId = rec.getString('usuario')
        if (uId) {
          const uRec = $app.findFirstRecordByData('users', 'id', uId)
          if (uRec) {
            let uChanged = false
            if (!uRec.getString('cliente_codigo')) {
              const randSuffix = Math.floor(1000 + Math.random() * 9000)
              const role = uRec.getString('role')
              const prefix = role === 'cliente_acp' ? 'ORB-ACP-' : 'ORB-CLI-'
              uRec.set('cliente_codigo', `${prefix}${randSuffix}`)
              uChanged = true
            }
            if (rec.getString('tomador_cpf_cnpj') && !uRec.getString('cnpj')) {
              uRec.set('cnpj', rec.getString('tomador_cpf_cnpj'))
              uChanged = true
            }
            uRec.set('plano_ativo', rec.getString('servico_id'))
            uRec.set('assinatura_status', 'ativa')
            const dataRenovacao = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
              .toISOString()
              .split('T')[0]
            uRec.set('assinatura_renovacao', dataRenovacao)
            uChanged = true
            $app.save(uRec)
          }
        }
      } catch (eUser) {
        console.log('Aviso ao atualizar user no pagamento:', eUser)
      }

      // Gerar comissão se houver parceiro associado
      try {
        const parceiroId = rec.getString('parceiro_id')
        if (parceiroId) {
          // Verificar se já existe comissão para esta cobrança
          let comissaoExistente = null
          try {
            comissaoExistente = $app.findFirstRecordByData('comissoes', 'cobranca_id', rec.id)
          } catch (_) {}

          if (!comissaoExistente) {
            const parceiroRec = $app.findFirstRecordByData('parceiros', 'id', parceiroId)
            if (parceiroRec && parceiroRec.getString('status') === 'ativo') {
              // Busca percentual de comissão: se o parceiro tiver valor específico cadastrado, usa; senão usa business_settings
              let pct = parceiroRec.getFloat('percentual_comissao') || 0
              if (pct <= 0) {
                try {
                  const bRecs = $app.findRecordsByFilter(
                    'business_settings',
                    'id != ""',
                    '-created',
                    1,
                    0,
                  )
                  if (bRecs && bRecs.length > 0) {
                    const pConfig = bRecs[0].getFloat('comissao_parceiro_percent')
                    if (typeof pConfig === 'number' && pConfig > 0) pct = pConfig
                  }
                } catch (_) {}
              }
              if (pct <= 0) pct = 10
              const base = rec.getFloat('valor') || 0
              const valComissao = Number(((base * pct) / 100).toFixed(2))

              const comissoesCol = $app.findCollectionByNameOrId('comissoes')
              const comissaoRec = new Record(comissoesCol)
              comissaoRec.set('cobranca_id', rec.id)
              comissaoRec.set('parceiro_id', parceiroRec.id)
              comissaoRec.set('base_calculo', base)
              comissaoRec.set('percentual_aplicado', pct) // Percentual congelado na criação
              comissaoRec.set('valor', valComissao)
              comissaoRec.set('status', 'calculada')
              $app.save(comissaoRec)
            }
          }
        }
      } catch (eCom) {
        console.log('Aviso ao calcular comissão:', eCom)
      }

      // Verificar segredo de emissão de NFS-e (Focus NFe)
      const focusToken = $os.getenv('FOCUSNFE_TOKEN') || ''
      if (focusToken && focusToken.trim() !== '') {
        // Provedor Focus NFe configurado
        rec.set('nfse_status', 'emitida')
        rec.set('nfse_numero', 'NFS-' + String(Math.floor(100000 + Math.random() * 900000)))
        rec.set('nfse_serie', 'E')
        rec.set('nfse_verificacao', $security.randomString(8).toUpperCase())
        rec.set('nfse_url', 'https://focusnfe.com.br/danfe/homologacao/demo.pdf')
      } else {
        // Modo Degradação NFS-e: sem segredo, marca "nfse_pendente_configuracao"
        rec.set('nfse_status', 'nfse_pendente_configuracao')
        rec.set('nfse_numero', 'PEND-CONF')
        rec.set('nfse_serie', 'U')
        rec.set('nfse_verificacao', 'AGUARDANDO_FOCUSNFE_TOKEN')
        rec.set('nfse_url', '')
      }

      $app.save(rec)

      // Gravação centralizada no audit_log da liquidação (incluindo quatro-olhos se aplicável)
      try {
        const auditCol = $app.findCollectionByNameOrId('audit_log')
        const log = new Record(auditCol)
        log.set('acao', body.is_manual ? 'cobranca_liquidacao_manual' : 'cobranca_liquidada')
        log.set('entidade', 'cobrancas')
        log.set('entidade_id', rec.id)
        log.set('ator_id', adminId || 'sistema')
        log.set('ator_email', adminNome)
        log.set('papel', 'admin')
        log.set('detalhes', {
          txid: rec.getString('txid'),
          servico: rec.getString('servico_nome'),
          valor: rec.getFloat('valor'),
          tomador: rec.getString('tomador_nome'),
          tomador_cnpj: rec.getString('tomador_cpf_cnpj'),
          justificativa: justificativa,
          comprovante_ref: comprovanteRef,
          confirmacao_dupla: confirmacaoDupla,
          quatro_olhos_aplicado: valorNum > limiteFourEyes,
          limite_four_eyes_aplicado: limiteFourEyes,
          divergente: isDivergente,
          nfse_status: rec.getString('nfse_status'),
        })
        log.set(
          'ip',
          e.requestInfo().headers['x-forwarded-for'] || e.requestInfo().headers['x-real-ip'] || '',
        )
        $app.save(log)
      } catch (eAudit) {
        console.log('Erro ao gravar audit_log na liquidacao:', eAudit)
      }

      return e.json(200, {
        id: rec.id,
        status: rec.getString('status'),
        valor: rec.getFloat('valor'),
        data_pagamento: rec.getString('data_pagamento'),
        liquidado_por: rec.getString('liquidado_por'),
        liquidado_em: rec.getString('liquidado_em'),
        liquidacao_justificativa: rec.getString('liquidacao_justificativa'),
        liquidacao_comprovante_ref: rec.getString('liquidacao_comprovante_ref'),
        nfse_status: rec.getString('nfse_status'),
        nfse_numero: rec.getString('nfse_numero'),
        nfse_serie: rec.getString('nfse_serie'),
        nfse_verificacao: rec.getString('nfse_verificacao'),
        nfse_url: rec.getString('nfse_url'),
      })
    } catch (err) {
      return e.json(500, { error: err.message || 'Erro ao confirmar liquidação de cobrança.' })
    }
  },
  $apis.requireAuth(),
)
