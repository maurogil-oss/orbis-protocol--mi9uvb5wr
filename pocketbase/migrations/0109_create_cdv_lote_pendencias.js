/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    // 1. Cria a coleção cdv_lote_pendencias para gestão de respondentes com pendências atribuídas na coleta do lote
    // Permite que equipes multidisciplinares do cliente (fiscal de pátio, desmonte, escritório, engenharia)
    // acompanhem o status de preenchimento/coleta de documentos e evidências de cada lote.
    try {
      if (app.hasTable('cdv_lote_pendencias')) {
        return
      }
    } catch (_) {}

    const cdvLotesCol = app.findCollectionByNameOrId('cdv_lotes')

    const fields = [
      {
        name: 'lote',
        type: 'relation',
        collectionId: cdvLotesCol.id,
        cascadeDelete: true,
        maxSelect: 1,
        required: true,
      },
      { name: 'titulo', type: 'text', required: true },
      { name: 'descricao', type: 'text', required: false },
      {
        name: 'tipo_pendencia',
        type: 'select',
        required: false,
        values: [
          'nota_fiscal_destinador',
          'foto_pesagem',
          'art_responsavel_tecnico',
          'baixa_detran',
          'mtr_sinir',
          'termo_descontaminacao',
          'laudo_pericial',
          'outro',
        ],
        maxSelect: 1,
      },
      { name: 'respondente_nome', type: 'text', required: true },
      { name: 'respondente_email', type: 'email', required: true },
      { name: 'respondente_papel', type: 'text', required: false },
      {
        name: 'status',
        type: 'select',
        required: true,
        values: ['pendente', 'preenchida', 'cancelada'],
        maxSelect: 1,
      },
      { name: 'data_atribuicao', type: 'text', required: false },
      { name: 'data_resolucao', type: 'text', required: false },
      { name: 'resolvido_por_nome', type: 'text', required: false },
      { name: 'resolvido_por_email', type: 'text', required: false },
      { name: 'comprovante_documento_ref', type: 'text', required: false },
      { name: 'observacao_resolucao', type: 'text', required: false },
      { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
      { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
    ]

    const collection = new Collection({
      name: 'cdv_lote_pendencias',
      type: 'base',
      listRule: '',
      viewRule: '',
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields,
      indexes: [],
    })

    app.save(collection)
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('cdv_lote_pendencias')
      app.delete(col)
    } catch (_) {}
  },
)
