migrate(
  (app) => {
    // 1. Adicionar campo 'adicionalidade_json' na coleção 'cdv_lotes'
    // Armazena a avaliação de adicionalidade técnica/pericial anexada ao lote:
    // {
    //   adicionalidade_investimento: boolean,
    //   barreira_tecnologica: boolean,
    //   nao_obrigatoriedade_legal: boolean,
    //   justificativa_pericial: string,
    //   data_avaliacao?: string,
    //   avaliador_identificador?: string
    // }
    try {
      const lotesCol = app.findCollectionByNameOrId('cdv_lotes')
      if (!lotesCol.fields.getByName('adicionalidade_json')) {
        lotesCol.fields.add(new JSONField({ name: 'adicionalidade_json' }))
        app.save(lotesCol)
      }
    } catch (err) {
      console.log('[0047] Aviso ao adicionar adicionalidade_json em cdv_lotes:', err)
    }

    // 2. Criar tabela/coleção auxiliar 'cdv_adicionalidade' para persistência direta
    // mesmo quando o lote for somente-leitura ou para consultas granulares independentes
    if (!app.hasTable('cdv_adicionalidade')) {
      try {
        const adicCol = new Collection({
          name: 'cdv_adicionalidade',
          type: 'base',
          listRule: '',
          viewRule: '',
          createRule: '',
          updateRule: '',
          deleteRule: "@request.auth.id != '' && @request.auth.role = 'admin'",
          fields: [
            { name: 'lote_id', type: 'text', required: true },
            { name: 'veiculo_baixa_detran', type: 'text' },
            { name: 'cdv_cnpj', type: 'text' },
            { name: 'adicionalidade_investimento', type: 'bool' },
            { name: 'barreira_tecnologica', type: 'bool' },
            { name: 'nao_obrigatoriedade_legal', type: 'bool' },
            { name: 'justificativa_pericial', type: 'text' },
            { name: 'avaliador_nome', type: 'text' },
            { name: 'avaliador_registro', type: 'text' },
            { name: 'data_declaracao', type: 'text' },
            { name: 'hash_declaracao', type: 'text' },
            { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
            { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
          ],
          indexes: [
            'CREATE UNIQUE INDEX idx_cdv_adic_lote ON cdv_adicionalidade (lote_id)',
            'CREATE INDEX idx_cdv_adic_baixa ON cdv_adicionalidade (veiculo_baixa_detran)',
          ],
        })
        app.save(adicCol)
      } catch (errAdic) {
        console.log('[0047] Aviso ao criar colecao cdv_adicionalidade:', errAdic)
      }
    }

    // 3. Seed inicial de avaliação de adicionalidade para o lote de demonstração Renault Clio (c1jz14hgmf7n13i)
    // Estado pericial preliminar conforme requisitos metodológicos GS 448
    try {
      const loteClio = app.findFirstRecordByData('cdv_lotes', 'id', 'c1jz14hgmf7n13i')
      if (loteClio) {
        const dadosAdicDemo = {
          adicionalidade_investimento: true,
          barreira_tecnologica: true,
          nao_obrigatoriedade_legal: true,
          justificativa_pericial:
            'A atividade de desmonte técnico com descaracterização rastreada, descontaminação integral de fluidos e inventário digital berço-ao-portão demanda custos adicionais operacionais de mão de obra especializada e infraestrutura de rastreabilidade dMRV não remunerados pela venda convencional de sucata mista ferrosa. Há clara barreira tecnológica superada pela adoção de etiquetagem criptográfica de peças verdes e rastreamento de balanço de massa curbside. Adicionalmente, inexiste obrigatoriedade legal compulsória no ordenamento jurídico nacional para a segregação de 77 subsistemas catalogados e quantificação de emissões evitadas para além da baixa cadastral pura no sistema DETRAN.',
          data_avaliacao: '2026-03-15T10:00:00.000Z',
          avaliador_nome: 'VVB independente acreditado',
          status_parecer: 'conforme_declarado',
        }

        app
          .db()
          .newQuery(
            `UPDATE cdv_lotes 
             SET adicionalidade_json = {:adic} 
             WHERE id = {:id}`,
          )
          .bind({
            adic: JSON.stringify(dadosAdicDemo),
            id: loteClio.id,
          })
          .execute()

        // Grava também na tabela cdv_adicionalidade para espelhamento
        const adicCol = app.findCollectionByNameOrId('cdv_adicionalidade')
        try {
          const recExistente = app.findFirstRecordByData(
            'cdv_adicionalidade',
            'lote_id',
            loteClio.id,
          )
          if (!recExistente) {
            const rec = new Record(adicCol)
            rec.set('lote_id', loteClio.id)
            rec.set('veiculo_baixa_detran', loteClio.getString('veiculo_baixa_detran'))
            rec.set('cdv_cnpj', loteClio.getString('cdv_cnpj'))
            rec.set('adicionalidade_investimento', true)
            rec.set('barreira_tecnologica', true)
            rec.set('nao_obrigatoriedade_legal', true)
            rec.set('justificativa_pericial', dadosAdicDemo.justificativa_pericial)
            rec.set('avaliador_nome', 'VVB independente acreditado')
            rec.set('data_declaracao', '2026-03-15')
            app.save(rec)
          }
        } catch (_) {}
      }
    } catch (errSeed) {
      console.log('[0047] Seed adicionalidade clio ignorado ou ja aplicado:', errSeed)
    }
  },
  (app) => {
    try {
      const adicCol = app.findCollectionByNameOrId('cdv_adicionalidade')
      app.delete(adicCol)
    } catch (_) {}
  },
)
