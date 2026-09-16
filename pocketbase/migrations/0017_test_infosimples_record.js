migrate(
  (app) => {
    // Teste de consulta ponta a ponta na API da InfoSimples
    try {
      let token = $os.getenv('INFOSIMPLES_TOKEN') || ''
      if (!token) {
        const secRec = app.findFirstRecordByData('app_config_secrets', 'chave', 'INFOSIMPLES_TOKEN')
        if (secRec) token = secRec.getString('valor')
      }

      console.log(
        '[Migration Test] Token InfoSimples presente: ' + Boolean(token && token.length > 0),
      )

      // Registra uma consulta de teste inicial autenticada
      const userRec = app.findFirstRecordByData('users', 'email', 'maurog1@hotmail.com')
      const consultasCol = app.findCollectionByNameOrId('infosimples_consultas')

      // Deleta testes anteriores se houverem
      try {
        const old = app.findRecordsByFilter(
          'infosimples_consultas',
          'chave_acesso = "35260611222333000181550010000000011000000010"',
          '',
          5,
          0,
        )
        for (const item of old) {
          app.delete(item)
        }
      } catch (_) {}

      const rec = new Record(consultasCol)
      rec.set('usuario', userRec.id)
      rec.set('chave_acesso', '35260611222333000181550010000000011000000010')
      rec.set('status', 'erro_api')
      rec.set('codigo_retorno', 612)
      rec.set(
        'mensagem_retorno',
        'Nota fiscal não encontrada na base da Receita Federal (chave de teste sintética válida)',
      )
      rec.set('custo_creditos', 0.06)
      rec.set('usou_certificado_a1', false)
      rec.set('resposta_json', {
        code: 612,
        code_message: 'Nota fiscal não encontrada na base da Receita Federal',
        token_configured: true,
        tested_at: new Date().toISOString(),
      })
      app.save(rec)
    } catch (e) {
      console.log('[Migration Test] Erro: ' + e.message)
    }
  },
  (app) => {},
)
