/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    // 1. Cria a coleção consentimentos_perito para governança LGPD do perito técnico
    // RLS:
    // listRule: público ("") para permitir conferência no Passaporte e Verificador se há consentimento ativo
    // viewRule: público ("")
    // createRule: perito autenticado (@request.auth.id != '')
    // updateRule: proprietário do registro (@request.auth.id != '' && (usuario = @request.auth.id || perito_credenciamento.usuario = @request.auth.id))
    // deleteRule: proprietário do registro (@request.auth.id != '' && (usuario = @request.auth.id || perito_credenciamento.usuario = @request.auth.id))
    try {
      if (app.hasTable('consentimentos_perito')) {
        return
      }
    } catch (_) {}

    let peritoCredColId = null
    try {
      peritoCredColId = app.findCollectionByNameOrId('perito_credenciamentos').id
    } catch (_) {}

    const fields = [
      {
        name: 'usuario',
        type: 'relation',
        collectionId: '_pb_users_auth_',
        cascadeDelete: false,
        maxSelect: 1,
        required: false,
      },
    ]

    if (peritoCredColId) {
      fields.push({
        name: 'perito_credenciamento',
        type: 'relation',
        collectionId: peritoCredColId,
        cascadeDelete: false,
        maxSelect: 1,
        required: false,
      })
    }

    fields.push(
      { name: 'nome_completo', type: 'text', required: true },
      { name: 'conselho_tipo', type: 'text', required: false },
      { name: 'registro_profissional', type: 'text', required: true },
      { name: 'registro_uf', type: 'text', required: false },
      { name: 'numero_art_rrt', type: 'text', required: false },
      { name: 'documento_identificacao', type: 'text', required: false },
      { name: 'termo_versao', type: 'text', required: true },
      { name: 'termo_aceito_em', type: 'date', required: true },
      {
        name: 'status',
        type: 'select',
        required: true,
        values: ['ativo', 'revogado'],
        maxSelect: 1,
      },
      { name: 'revogado_em', type: 'date', required: false },
      { name: 'ip_registro', type: 'text', required: false },
      { name: 'observacao', type: 'text', required: false },
      { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
      { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
    )

    const collection = new Collection({
      name: 'consentimentos_perito',
      type: 'base',
      listRule: '',
      viewRule: '',
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != '' && usuario = @request.auth.id",
      deleteRule: "@request.auth.id != '' && usuario = @request.auth.id",
      fields,
      indexes: [],
    })

    app.save(collection)
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('consentimentos_perito')
      app.delete(col)
    } catch (_) {}
  },
)
