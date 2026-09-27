/**
 * HOOK & CRON DIÁRIO DE ASSINATURAS RECORRENTES & INADIMPLÊNCIA (Item 6)
 *
 * (a) Gera cobrança do mês seguinte (D+1 da renovação) se não existir pendente/paga para o ciclo
 * (b) Marca como 'vencida' (expirada) cobrança pendente com mais de 7 dias de atraso
 * (c) Atualiza users.assinatura_status ('inadimplente' se vencida, 'ativa' se quitada)
 *
 * Registra cronAdd('0 4 * * *') [diário às 04:00 AM]
 * e routerAdd('POST', '/backend/v1/assinaturas/verificar-ciclo') para execução on-demand ao abrir o painel.
 */

// Execução on-demand chamada pelo painel ou cron
routerAdd('POST', '/backend/v1/assinaturas/verificar-ciclo', (e) => {
  try {
    // Exigir token de autorização interno (variável de ambiente INTERNAL_CRON_TOKEN ou PB_SUPERUSER_TOKEN)
    // OU autenticação de administrador/master
    const info = e.requestInfo()
    const headers = info ? info.headers || {} : {}
    const internalTokenEnv = (
      $os.getenv('INTERNAL_CRON_TOKEN') ||
      $os.getenv('PB_SUPERUSER_TOKEN') ||
      ''
    ).trim()
    const headerToken = (headers['x-internal-token'] || headers['x-cron-token'] || '').trim()

    let autorizado = false

    // 1. Autorização via token de ambiente interno
    if (internalTokenEnv && headerToken && headerToken === internalTokenEnv) {
      autorizado = true
    }

    // 2. Autorização via usuário logado com papel admin ou master
    if (!autorizado && e.auth) {
      const role = e.auth.getString('role')
      if (role === 'admin' || role === 'master' || (e.hasSuperuserAuth && e.hasSuperuserAuth())) {
        autorizado = true
      }
    }

    if (!autorizado) {
      return e.json(403, {
        error:
          'Acesso não autorizado. Endpoint reservado para rotina de cron interna ou administradores.',
      })
    }
    const hoje = new Date()
    const hojeIso = hoje.toISOString().split('T')[0]
    let cobrancasGeradas = 0
    let cobrancasVencidas = 0
    let usersAtualizados = 0

    // 1. Obter valor vigente de Bureau ACP no catálogo
    let valorBureau = 7800
    let nomeBureau = 'Bureau ACP (Corporativo)'
    try {
      const catRec = $app.findFirstRecordByData(
        'servicos_catalogo',
        'servico_id',
        'assinatura_bureau',
      )
      if (catRec && catRec.getBool('ativo')) {
        valorBureau = catRec.getFloat('preco') || 7800
        nomeBureau = catRec.getString('nome') || nomeBureau
      }
    } catch (_) {}

    // 2. Localizar usuários com plano assinatura_bureau ou assinaturas ativas/inadimplentes
    const users = $app.findRecordsByFilter(
      'users',
      'plano_ativo = "assinatura_bureau" || plano_ativo = "corporativo"',
      'created',
      500,
      0,
    )

    const cobrancasCol = $app.findCollectionByNameOrId('cobrancas')

    for (const u of users) {
      const uId = u.id
      const dataRenovacaoStr = u.getString('assinatura_renovacao') || ''
      let dataRenovacao = null
      if (dataRenovacaoStr) {
        dataRenovacao = new Date(dataRenovacaoStr)
      }

      // Ciclo atual em formato YYYY-MM
      const anoAtual = hoje.getFullYear()
      const mesAtual = String(hoje.getMonth() + 1).padStart(2, '0')
      const cicloAtual = `${anoAtual}-${mesAtual}`

      // Verificar cobranças deste usuário
      let cobrancasUsuario = []
      try {
        cobrancasUsuario = $app.findRecordsByFilter(
          'cobrancas',
          `usuario = "${uId}" && servico_id = "assinatura_bureau"`,
          '-created',
          50,
          0,
        )
      } catch (_) {}

      let temPendenteVencida = false
      let temPendenteNormal = false
      let temPagaCiclo = false

      for (const cob of cobrancasUsuario) {
        const status = cob.getString('status')
        const createdStr = cob.getString('created')
        const cicloCob = cob.getString('ciclo_recorrencia')

        if (cicloCob === cicloAtual && status === 'pago') {
          temPagaCiclo = true
        }

        if (status === 'pendente' || status === 'pendente_simulacao') {
          const criacao = new Date(createdStr)
          const diffDias = Math.floor((hoje.getTime() - criacao.getTime()) / (1000 * 60 * 60 * 24))

          // Mais de 7 dias de atraso -> marcar como expirado/vencido
          if (diffDias > 7) {
            cob.set('status', 'expirado')
            $app.save(cob)
            cobrancasVencidas += 1
            temPendenteVencida = true
          } else {
            temPendenteNormal = true
          }
        }
      }

      // (a) Gerar cobrança do mês seguinte em D+1 da renovação quando não existir pendente/paga daquele ciclo
      const dMaisUm = dataRenovacao ? new Date(dataRenovacao.getTime() + 24 * 60 * 60 * 1000) : null
      const ehAposRenovacao = dMaisUm && hoje >= dMaisUm

      if ((ehAposRenovacao || !dataRenovacao) && !temPagaCiclo && !temPendenteNormal) {
        // Gerar nova cobrança recorrente
        const novaCob = new Record(cobrancasCol)
        novaCob.set('usuario', uId)
        novaCob.set('servico_id', 'assinatura_bureau')
        novaCob.set('servico_nome', `${nomeBureau} - Ciclo ${cicloAtual}`)
        novaCob.set('valor', valorBureau)
        novaCob.set('status', 'pendente_simulacao')
        novaCob.set('ciclo_recorrencia', cicloAtual)
        novaCob.set('origem_preco', 'catalogo')
        novaCob.set('divergencia_preco', false)
        novaCob.set('tomador_nome', u.getString('name') || 'Assinante Corporativo')
        novaCob.set('tomador_cpf_cnpj', u.getString('cnpj') || '00.000.000/0000-00')
        novaCob.set('tomador_email', u.getString('email'))
        novaCob.set('provider', 'pagbank')

        const txidGerado = 'TXID-REC-' + $security.randomString(14).toUpperCase()
        novaCob.set('txid', txidGerado)

        const fakePixPayload = `00020126580014br.gov.bcb.pix0136${txidGerado}520400005303986540${valorBureau.toFixed(2)}5802BR5925MGM CONSULTORIA EMPRESARI6008CURITIBA62070503***6304BEEF`
        novaCob.set('qr_code_payload', fakePixPayload)

        const hash = $security.sha256(
          `${txidGerado}|${u.getString('cnpj')}|${valorBureau}|assinatura_bureau|${cicloAtual}`,
        )
        novaCob.set('hash_integridade', hash)

        $app.save(novaCob)
        cobrancasGeradas += 1

        // Calcular próxima data de renovação (D+30)
        const proxRenovacao = new Date(hoje.getTime() + 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0]
        u.set('assinatura_renovacao', proxRenovacao)
        $app.save(u)
      }

      // (c) Atualizar assinatura_status do usuário: 'inadimplente' se houver cobrança vencida sem quitada; 'ativa' se quitada
      let novoStatus = u.getString('assinatura_status') || 'ativa'
      if (temPendenteVencida && !temPagaCiclo) {
        novoStatus = 'inadimplente'
      } else if (temPagaCiclo) {
        novoStatus = 'ativa'
      }

      if (novoStatus !== u.getString('assinatura_status')) {
        u.set('assinatura_status', novoStatus)
        $app.save(u)
        usersAtualizados += 1
      }
    }

    // (d) Verificação e suspensão automática de peritos com ART vencida (Item 4)
    let peritosSuspensos = 0
    try {
      const peritos = $app.findRecordsByFilter(
        'perito_credenciamentos',
        'status = "aprovado"',
        'created',
        500,
        0,
      )
      const auditCol = $app.findCollectionByNameOrId('audit_log')

      for (const p of peritos) {
        const valArtStr = p.getString('validade_art')
        if (valArtStr) {
          const valArt = new Date(valArtStr)
          if (hoje > valArt) {
            p.set('status', 'suspenso')
            p.set(
              'motivo_suspensao',
              `ART/RRT vencida em ${valArtStr}. Suspensão automática pelo job de integridade operacional.`,
            )
            $app.save(p)
            peritosSuspensos += 1

            // Registrar no audit_log append-only
            try {
              const log = new Record(auditCol)
              log.set('acao', 'perito_art_vencida_suspensao')
              log.set('entidade', 'perito_credenciamentos')
              log.set('entidade_id', p.id)
              log.set('ator_id', 'job_cron_04h')
              log.set('ator_email', 'suporte@orbis-protocol.com')
              log.set('papel', 'sistema')
              log.set('detalhes', {
                perito_nome: p.getString('nome_completo'),
                registro: `${p.getString('conselho_tipo')} ${p.getString('registro_profissional')}/${p.getString('registro_uf')}`,
                numero_art_rrt: p.getString('numero_art_rrt'),
                validade_art: valArtStr,
                data_suspensao: hojeIso,
                motivo: 'ART/RRT vencida',
              })
              $app.save(log)
            } catch (_) {}
          }
        }
      }
    } catch (ePerito) {
      console.log('Erro ao checar ART de peritos no endpoint:', ePerito)
    }

    return e.json(200, {
      sucesso: true,
      data_verificacao: hojeIso,
      cobrancas_geradas: cobrancasGeradas,
      cobrancas_vencidas: cobrancasVencidas,
      users_atualizados: usersAtualizados,
      peritos_suspensos: peritosSuspensos,
    })
  } catch (err) {
    return e.json(500, { error: err.message || 'Erro ao verificar ciclos de assinatura.' })
  }
})

// Cron diário às 04:00 da manhã
cronAdd('recorrencia_diaria_orbis', '0 4 * * *', () => {
  try {
    const hoje = new Date()
    const hojeIso = hoje.toISOString().split('T')[0]
    let valorBureau = 7800
    let nomeBureau = 'Bureau ACP (Corporativo)'
    try {
      const catRec = $app.findFirstRecordByData(
        'servicos_catalogo',
        'servico_id',
        'assinatura_bureau',
      )
      if (catRec && catRec.getBool('ativo')) {
        valorBureau = catRec.getFloat('preco') || 7800
        nomeBureau = catRec.getString('nome') || nomeBureau
      }
    } catch (_) {}

    const users = $app.findRecordsByFilter(
      'users',
      'plano_ativo = "assinatura_bureau" || plano_ativo = "corporativo"',
      'created',
      500,
      0,
    )
    const cobrancasCol = $app.findCollectionByNameOrId('cobrancas')

    for (const u of users) {
      const uId = u.id
      const dataRenovacaoStr = u.getString('assinatura_renovacao') || ''
      let dataRenovacao = null
      if (dataRenovacaoStr) {
        dataRenovacao = new Date(dataRenovacaoStr)
      }

      const anoAtual = hoje.getFullYear()
      const mesAtual = String(hoje.getMonth() + 1).padStart(2, '0')
      const cicloAtual = `${anoAtual}-${mesAtual}`

      let cobrancasUsuario = []
      try {
        cobrancasUsuario = $app.findRecordsByFilter(
          'cobrancas',
          `usuario = "${uId}" && servico_id = "assinatura_bureau"`,
          '-created',
          50,
          0,
        )
      } catch (_) {}

      let temPendenteVencida = false
      let temPendenteNormal = false
      let temPagaCiclo = false

      for (const cob of cobrancasUsuario) {
        const status = cob.getString('status')
        const createdStr = cob.getString('created')
        const cicloCob = cob.getString('ciclo_recorrencia')

        if (cicloCob === cicloAtual && status === 'pago') {
          temPagaCiclo = true
        }

        if (status === 'pendente' || status === 'pendente_simulacao') {
          const criacao = new Date(createdStr)
          const diffDias = Math.floor((hoje.getTime() - criacao.getTime()) / (1000 * 60 * 60 * 24))
          if (diffDias > 7) {
            cob.set('status', 'expirado')
            $app.save(cob)
            temPendenteVencida = true
          } else {
            temPendenteNormal = true
          }
        }
      }

      const dMaisUm = dataRenovacao ? new Date(dataRenovacao.getTime() + 24 * 60 * 60 * 1000) : null
      const ehAposRenovacao = dMaisUm && hoje >= dMaisUm

      if ((ehAposRenovacao || !dataRenovacao) && !temPagaCiclo && !temPendenteNormal) {
        const novaCob = new Record(cobrancasCol)
        novaCob.set('usuario', uId)
        novaCob.set('servico_id', 'assinatura_bureau')
        novaCob.set('servico_nome', `${nomeBureau} - Ciclo ${cicloAtual}`)
        novaCob.set('valor', valorBureau)
        novaCob.set('status', 'pendente_simulacao')
        novaCob.set('ciclo_recorrencia', cicloAtual)
        novaCob.set('origem_preco', 'catalogo')
        novaCob.set('divergencia_preco', false)
        novaCob.set('tomador_nome', u.getString('name') || 'Assinante Corporativo')
        novaCob.set('tomador_cpf_cnpj', u.getString('cnpj') || '00.000.000/0000-00')
        novaCob.set('tomador_email', u.getString('email'))
        novaCob.set('provider', 'pagbank')

        const txidGerado = 'TXID-REC-' + $security.randomString(14).toUpperCase()
        novaCob.set('txid', txidGerado)

        const fakePixPayload = `00020126580014br.gov.bcb.pix0136${txidGerado}520400005303986540${valorBureau.toFixed(2)}5802BR5925MGM CONSULTORIA EMPRESARI6008CURITIBA62070503***6304BEEF`
        novaCob.set('qr_code_payload', fakePixPayload)

        const hash = $security.sha256(
          `${txidGerado}|${u.getString('cnpj')}|${valorBureau}|assinatura_bureau|${cicloAtual}`,
        )
        novaCob.set('hash_integridade', hash)
        $app.save(novaCob)

        const proxRenovacao = new Date(hoje.getTime() + 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0]
        u.set('assinatura_renovacao', proxRenovacao)
        $app.save(u)
      }

      let novoStatus = u.getString('assinatura_status') || 'ativa'
      if (temPendenteVencida && !temPagaCiclo) {
        novoStatus = 'inadimplente'
      } else if (temPagaCiclo) {
        novoStatus = 'ativa'
      }

      if (novoStatus !== u.getString('assinatura_status')) {
        u.set('assinatura_status', novoStatus)
        $app.save(u)
      }
    }

    // (d) Suspensão automática de perito com ART vencida (Item 4)
    try {
      const peritos = $app.findRecordsByFilter(
        'perito_credenciamentos',
        'status = "aprovado"',
        'created',
        500,
        0,
      )
      const auditCol = $app.findCollectionByNameOrId('audit_log')

      for (const p of peritos) {
        const valArtStr = p.getString('validade_art')
        if (valArtStr) {
          const valArt = new Date(valArtStr)
          if (hoje > valArt) {
            p.set('status', 'suspenso')
            p.set(
              'motivo_suspensao',
              `ART/RRT vencida em ${valArtStr}. Suspensão automática pelo job de integridade operacional.`,
            )
            $app.save(p)

            try {
              const log = new Record(auditCol)
              log.set('acao', 'perito_art_vencida_suspensao')
              log.set('entidade', 'perito_credenciamentos')
              log.set('entidade_id', p.id)
              log.set('ator_id', 'job_cron_04h')
              log.set('ator_email', 'suporte@orbis-protocol.com')
              log.set('papel', 'sistema')
              log.set('detalhes', {
                perito_nome: p.getString('nome_completo'),
                registro: `${p.getString('conselho_tipo')} ${p.getString('registro_profissional')}/${p.getString('registro_uf')}`,
                numero_art_rrt: p.getString('numero_art_rrt'),
                validade_art: valArtStr,
                data_suspensao: hojeIso,
                motivo: 'ART/RRT vencida',
              })
              $app.save(log)
            } catch (_) {}
          }
        }
      }
    } catch (ePeritoCron) {
      console.log('Erro ao checar ART de peritos no cron:', ePeritoCron)
    }
  } catch (errCron) {
    console.log('Erro no cron de recorrencia:', errCron)
  }
})
