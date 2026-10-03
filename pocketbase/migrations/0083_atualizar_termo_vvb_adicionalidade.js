migrate(
  (app) => {
    const novoTextoAvaliador =
      'Autoavaliação pericial pré-VVB concluída — validação por VVB acreditado pendente (em seleção)'

    // 1. Atualizar registros existentes na coleção cdv_adicionalidade
    try {
      const recordsAdic = app.findRecordsByFilter(
        'cdv_adicionalidade',
        'avaliador_nome ~ "VVB" || avaliador_nome ~ "Autoavaliação"',
        '',
        100,
        0,
      )
      for (const rec of recordsAdic) {
        rec.set('avaliador_nome', novoTextoAvaliador)
        try {
          app.save(rec)
        } catch (saveErr) {
          console.log('[0083] Fallback SQL para salvar rec cdv_adicionalidade:', saveErr)
          app
            .db()
            .newQuery('UPDATE cdv_adicionalidade SET avaliador_nome = {:nome} WHERE id = {:id}')
            .bind({ nome: novoTextoAvaliador, id: rec.id })
            .execute()
        }
      }
    } catch (errFilter) {
      console.log(
        '[0083] cdv_adicionalidade findRecordsByFilter ignorado ou tabela vazia:',
        errFilter,
      )
    }

    // 2. Atualizar campo adicionalidade_json no lote Clio c1jz14hgmf7n13i em cdv_lotes
    try {
      const loteClio = app.findFirstRecordByData('cdv_lotes', 'id', 'c1jz14hgmf7n13i')
      if (loteClio) {
        let adicObj = {}
        try {
          const raw = loteClio.get('adicionalidade_json')
          if (typeof raw === 'string') {
            adicObj = JSON.parse(raw)
          } else if (raw && typeof raw === 'object') {
            adicObj = raw
          }
        } catch (_) {}

        adicObj.avaliador_nome = novoTextoAvaliador
        loteClio.set('adicionalidade_json', adicObj)

        try {
          app.save(loteClio)
        } catch (saveLoteErr) {
          console.log('[0083] Fallback SQL para salvar lote Clio:', saveLoteErr)
          app
            .db()
            .newQuery('UPDATE cdv_lotes SET adicionalidade_json = {:adic} WHERE id = {:id}')
            .bind({ adic: JSON.stringify(adicObj), id: loteClio.id })
            .execute()
        }
      }
    } catch (errLote) {
      console.log('[0083] Lote Clio nao encontrado ou erro ao carregar:', errLote)
    }

    // 3. Garantir espelhamento na coleção cdv_adicionalidade para o lote c1jz14hgmf7n13i
    try {
      if (app.hasTable('cdv_adicionalidade')) {
        const adicCol = app.findCollectionByNameOrId('cdv_adicionalidade')
        try {
          const recExistente = app.findFirstRecordByData(
            'cdv_adicionalidade',
            'lote_id',
            'c1jz14hgmf7n13i',
          )
          recExistente.set('avaliador_nome', novoTextoAvaliador)
          try {
            app.save(recExistente)
          } catch (eSave) {
            app
              .db()
              .newQuery('UPDATE cdv_adicionalidade SET avaliador_nome = {:nome} WHERE id = {:id}')
              .bind({ nome: novoTextoAvaliador, id: recExistente.id })
              .execute()
          }
        } catch (_) {
          // Se não existia o registro na coleção cdv_adicionalidade, cria
          try {
            const loteClio = app.findFirstRecordByData('cdv_lotes', 'id', 'c1jz14hgmf7n13i')
            const rec = new Record(adicCol)
            rec.set('lote_id', 'c1jz14hgmf7n13i')
            rec.set(
              'veiculo_baixa_detran',
              loteClio ? loteClio.getString('veiculo_baixa_detran') : 'PR-BX-2026-1240105',
            )
            rec.set('cdv_cnpj', '76.123.456/0001-00')
            rec.set('adicionalidade_investimento', true)
            rec.set('barreira_tecnologica', true)
            rec.set('nao_obrigatoriedade_legal', true)
            rec.set(
              'justificativa_pericial',
              'A atividade de desmonte técnico com descaracterização rastreada, descontaminação integral de fluidos e inventário digital berço-ao-portão demanda custos adicionais operacionais de mão de obra especializada e infraestrutura de rastreabilidade dMRV não remunerados pela venda convencional de sucata mista ferrosa. Há clara barreira tecnológica superada pela adoção de etiquetagem criptográfica de peças verdes e rastreamento de balanço de massa curbside. Adicionalmente, inexiste obrigatoriedade legal compulsória no ordenamento jurídico nacional para a segregação de 77 subsistemas catalogados e quantificação de emissões evitadas para além da baixa cadastral pura no sistema DETRAN.',
            )
            rec.set('avaliador_nome', novoTextoAvaliador)
            rec.set('data_declaracao', '2026-03-15')
            app.save(rec)
          } catch (criaErr) {
            console.log('[0083] Criacao de espelho em cdv_adicionalidade:', criaErr)
          }
        }
      }
    } catch (errGeral) {
      console.log('[0083] Erro em garantia de espelhamento:', errGeral)
    }
  },
  (app) => {
    // Reverter texto se necessário
    const textoAntigo = 'VVB independente acreditado'
    try {
      app
        .db()
        .newQuery(
          'UPDATE cdv_adicionalidade SET avaliador_nome = {:nome} WHERE lote_id = "c1jz14hgmf7n13i"',
        )
        .bind({ nome: textoAntigo })
        .execute()
    } catch (_) {}
  },
)
