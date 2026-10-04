/**
 * MIGRATION 0095: CAMPANHA DE REATIVAÇÃO POR E-MAIL E PREFERÊNCIAS DE OPT-OUT
 *
 * 1. Adiciona campos de controle de opt-out na coleção 'users':
 *    - opt_out_reativacao (bool, opcional)
 *    - opt_out_reativacao_data (text, opcional — data ISO do descadastro)
 *
 * 2. Cria a coleção 'reativacao_envios' para deduplicação, auditoria e acompanhamento:
 *    - usuario (relation -> users, obrigatório, maxSelect 1)
 *    - toque (select: 'd30' | 'd60', obrigatório)
 *    - data_envio (text / date)
 *    - status (select: 'enviado' | 'falha', obrigatório)
 *    - destinatario_email (email / text)
 *    - dados_conta_json (json — snapshot de NFs, lotes, laudos pendentes no momento do envio)
 *    - mensagem_erro (text)
 *    - reativou (bool — indica se houve atividade posterior ao envio)
 *    - data_reativacao (text)
 *    - created, updated (autodate)
 */

migrate(
  (app) => {
    // 1. Atualizar coleção users com campos de opt-out
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
    if (!usersCol.fields.getByName('opt_out_reativacao')) {
      usersCol.fields.add(
        new BoolField({
          name: 'opt_out_reativacao',
          required: false,
        }),
      )
    }
    if (!usersCol.fields.getByName('opt_out_reativacao_data')) {
      usersCol.fields.add(
        new TextField({
          name: 'opt_out_reativacao_data',
          required: false,
        }),
      )
    }
    app.save(usersCol)

    // 2. Criar coleção reativacao_envios
    const reativacaoCol = new Collection({
      name: 'reativacao_envios',
      type: 'base',
      listRule:
        "@request.auth.id != '' && (@request.auth.role = 'admin' || @request.auth.role = 'master' || @request.auth.role = 'controller' || usuario = @request.auth.id)",
      viewRule:
        "@request.auth.id != '' && (@request.auth.role = 'admin' || @request.auth.role = 'master' || @request.auth.role = 'controller' || usuario = @request.auth.id)",
      createRule:
        "@request.auth.id != '' && (@request.auth.role = 'admin' || @request.auth.role = 'master' || @request.auth.role = 'controller')",
      updateRule:
        "@request.auth.id != '' && (@request.auth.role = 'admin' || @request.auth.role = 'master' || @request.auth.role = 'controller')",
      deleteRule: "@request.auth.id != '' && (@request.auth.role = 'master')",
      fields: [
        {
          name: 'usuario',
          type: 'relation',
          required: true,
          collectionId: '_pb_users_auth_',
          cascadeDelete: false,
          maxSelect: 1,
        },
        {
          name: 'toque',
          type: 'select',
          required: true,
          values: ['d30', 'd60'],
          maxSelect: 1,
        },
        {
          name: 'data_envio',
          type: 'text',
          required: false,
        },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: ['enviado', 'falha'],
          maxSelect: 1,
        },
        {
          name: 'destinatario_email',
          type: 'text',
          required: false,
        },
        {
          name: 'dados_conta_json',
          type: 'json',
          required: false,
        },
        {
          name: 'mensagem_erro',
          type: 'text',
          required: false,
        },
        {
          name: 'reativou',
          type: 'bool',
          required: false,
        },
        {
          name: 'data_reativacao',
          type: 'text',
          required: false,
        },
        {
          name: 'created',
          type: 'autodate',
          onCreate: true,
          onUpdate: false,
        },
        {
          name: 'updated',
          type: 'autodate',
          onCreate: true,
          onUpdate: true,
        },
      ],
      indexes: [
        'CREATE INDEX idx_reativacao_usuario ON reativacao_envios (usuario)',
        'CREATE INDEX idx_reativacao_toque ON reativacao_envios (toque)',
        'CREATE INDEX idx_reativacao_status ON reativacao_envios (status)',
        'CREATE INDEX idx_reativacao_created ON reativacao_envios (created DESC)',
      ],
    })
    app.save(reativacaoCol)
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('reativacao_envios')
      app.delete(col)
    } catch (_) {}

    try {
      const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
      usersCol.fields.removeByName('opt_out_reativacao')
      usersCol.fields.removeByName('opt_out_reativacao_data')
      app.save(usersCol)
    } catch (_) {}
  },
)
