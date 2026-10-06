/**
 * HOOK DE PURGE DA BASE SANDBOX / DEMO
 *
 * Exclusivo para perfis admin / gestor master.
 * Permite:
 * 1. GET /backend/v1/sandbox/purge-count -> Conta registros elegíveis para expurgo (is_demo = true OU origem = 'sintetico')
 * 2. POST /backend/v1/sandbox/purge-execute -> Executa a exclusão definitiva em lote, mantendo intocados lotes reais
 *    (como Volkswagen Gol ID h1dpr8wniludemh, is_demo: false).
 */

routerAdd(
  'GET',
  '/backend/v1/sandbox/purge-count',
  (e) => {
    try {
      const auth = e.auth
      if (!auth) {
        return e.json(401, { error: 'Autenticação necessária.' })
      }
      const role = String(auth.getString('role') || '').toLowerCase()
      if (role !== 'admin' && role !== 'master') {
        return e.json(403, {
          error: 'Acesso negado: apenas administradores podem consultar dados de expurgo Sandbox.',
        })
      }

      // 1. Contar cdv_lotes demo/sintético
      let totalLotesDemo = 0
      try {
        const lotes = $app.findRecordsByFilter(
          'cdv_lotes',
          "is_demo = true || origem = 'sintetico'",
          '',
          1000,
          0,
        )
        totalLotesDemo = lotes.length
      } catch (err) {
        console.log('Erro ao contar cdv_lotes demo:', err)
      }

      // 2. Contar cdv_pecas demo/sintético
      let totalPecasDemo = 0
      try {
        const pecas = $app.findRecordsByFilter(
          'cdv_pecas',
          "is_demo = true || origem = 'sintetico'",
          '',
          5000,
          0,
        )
        totalPecasDemo = pecas.length
      } catch (err) {
        console.log('Erro ao contar cdv_pecas demo:', err)
      }

      // 3. Contar selos demo/sintético
      let totalSelosDemo = 0
      try {
        const selos = $app.findRecordsByFilter(
          'selos',
          "is_demo = true || origem = 'sintetico'",
          '',
          5000,
          0,
        )
        totalSelosDemo = selos.length
      } catch (err) {
        console.log('Erro ao contar selos demo:', err)
      }

      // 4. Contar emissoes_inventario demo/sintético se existir
      let totalEmissoesDemo = 0
      try {
        const emissoes = $app.findRecordsByFilter(
          'emissoes_inventario',
          "is_demo = true || origem = 'sintetico'",
          '',
          1000,
          0,
        )
        totalEmissoesDemo = emissoes.length
      } catch (_) {}

      return e.json(200, {
        sucesso: true,
        lotes: totalLotesDemo,
        pecas: totalPecasDemo,
        selos: totalSelosDemo,
        emissoes: totalEmissoesDemo,
        total: totalLotesDemo + totalPecasDemo + totalSelosDemo + totalEmissoesDemo,
      })
    } catch (err) {
      return e.json(500, { error: err.message || 'Erro ao contar registros Sandbox.' })
    }
  },
  $apis.requireAuth(),
)

routerAdd(
  'POST',
  '/backend/v1/sandbox/purge-execute',
  (e) => {
    try {
      const auth = e.auth
      if (!auth) {
        return e.json(401, { error: 'Autenticação necessária.' })
      }
      const role = String(auth.getString('role') || '').toLowerCase()
      if (role !== 'admin' && role !== 'master') {
        return e.json(403, {
          error: 'Acesso negado: apenas administradores podem executar expurgo do Sandbox.',
        })
      }

      const body = e.requestInfo().body || {}
      const confirmacao = String(body.confirmacao || '')
        .trim()
        .toUpperCase()
      if (confirmacao !== 'EXPURGAR-SANDBOX') {
        return e.badRequestError(
          'Confirmação inválida. Digite exatamente EXPURGAR-SANDBOX para autorizar a exclusão.',
        )
      }

      const adminEmail = auth.getString('email') || 'admin'
      const adminId = auth.id
      let excluidosLotes = 0
      let excluidosPecas = 0
      let excluidosSelos = 0
      let excluidosEmissoes = 0

      // 1. Excluir peças demo/sintético
      try {
        const pecas = $app.findRecordsByFilter(
          'cdv_pecas',
          "is_demo = true || origem = 'sintetico'",
          '',
          5000,
          0,
        )
        for (const p of pecas) {
          // Segurança absoluta: nunca deletar se is_demo for falso e origem não for sintetico
          if (p.getBool('is_demo') || p.getString('origem') === 'sintetico') {
            $app.delete(p)
            excluidosPecas++
          }
        }
      } catch (errPecas) {
        console.log('Erro ao excluir pecas demo:', errPecas)
      }

      // 2. Excluir selos demo/sintético
      try {
        const selos = $app.findRecordsByFilter(
          'selos',
          "is_demo = true || origem = 'sintetico'",
          '',
          5000,
          0,
        )
        for (const s of selos) {
          if (s.getBool('is_demo') || s.getString('origem') === 'sintetico') {
            $app.delete(s)
            excluidosSelos++
          }
        }
      } catch (errSelos) {
        console.log('Erro ao excluir selos demo:', errSelos)
      }

      // 3. Excluir lotes demo/sintético
      try {
        const lotes = $app.findRecordsByFilter(
          'cdv_lotes',
          "is_demo = true || origem = 'sintetico'",
          '',
          1000,
          0,
        )
        for (const l of lotes) {
          // Proteção estrita adicional: nunca tocar em lotes reais (como Volkswagen Gol)
          if (l.getBool('is_demo') || l.getString('origem') === 'sintetico') {
            $app.delete(l)
            excluidosLotes++
          }
        }
      } catch (errLotes) {
        console.log('Erro ao excluir lotes demo:', errLotes)
      }

      // 4. Excluir emissoes_inventario demo/sintético
      try {
        const emissoes = $app.findRecordsByFilter(
          'emissoes_inventario',
          "is_demo = true || origem = 'sintetico'",
          '',
          1000,
          0,
        )
        for (const em of emissoes) {
          if (em.getBool('is_demo') || em.getString('origem') === 'sintetico') {
            $app.delete(em)
            excluidosEmissoes++
          }
        }
      } catch (_) {}

      // 5. Registrar no audit_log
      try {
        const auditCol = $app.findCollectionByNameOrId('audit_log')
        const log = new Record(auditCol)
        log.set('acao', 'sandbox_purge_demo')
        log.set('entidade', 'sandbox')
        log.set('entidade_id', 'purge_batch')
        log.set('ator_id', adminId)
        log.set('ator_email', adminEmail)
        log.set('papel', role)
        log.set('detalhes', {
          excluidos_lotes: excluidosLotes,
          excluidos_pecas: excluidosPecas,
          excluidos_selos: excluidosSelos,
          excluidos_emissoes: excluidosEmissoes,
          timestamp: new Date().toISOString(),
        })
        $app.save(log)
      } catch (eAudit) {
        console.log('Erro ao registrar audit_log do purge:', eAudit)
      }

      return e.json(200, {
        sucesso: true,
        mensagem: `Expurgo concluído: ${excluidosLotes} lotes, ${excluidosPecas} peças e ${excluidosSelos} selos excluídos.`,
        lotes: excluidosLotes,
        pecas: excluidosPecas,
        selos: excluidosSelos,
        emissoes: excluidosEmissoes,
      })
    } catch (err) {
      return e.json(500, { error: err.message || 'Erro ao executar expurgo do Sandbox.' })
    }
  },
  $apis.requireAuth(),
)
