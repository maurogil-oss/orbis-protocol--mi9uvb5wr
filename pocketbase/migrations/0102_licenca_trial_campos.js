/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')

    // 1. trial_tipo: select 'trial_15d_5notas' | 'nenhum'
    if (!usersCol.fields.getByName('trial_tipo')) {
      usersCol.fields.add(
        new SelectField({
          name: 'trial_tipo',
          values: ['trial_15d_5notas', 'nenhum'],
          maxSelect: 1,
        }),
      )
    }

    // 2. trial_inicio: text (ISO datetime)
    if (!usersCol.fields.getByName('trial_inicio')) {
      usersCol.fields.add(new TextField({ name: 'trial_inicio' }))
    }

    // 3. trial_fim: text (ISO datetime de expiração dos 15 dias)
    if (!usersCol.fields.getByName('trial_fim')) {
      usersCol.fields.add(new TextField({ name: 'trial_fim' }))
    }

    // 4. trial_notas_limite: number (padrão 5 notas)
    if (!usersCol.fields.getByName('trial_notas_limite')) {
      usersCol.fields.add(
        new NumberField({
          name: 'trial_notas_limite',
          onlyInt: true,
          min: 0,
        }),
      )
    }

    // 5. trial_notas_consumidas: number (contador de notas ingeridas)
    if (!usersCol.fields.getByName('trial_notas_consumidas')) {
      usersCol.fields.add(
        new NumberField({
          name: 'trial_notas_consumidas',
          onlyInt: true,
          min: 0,
        }),
      )
    }

    // 6. licenca_camada: select 'free_cadastro' | 'trial' | 'plano_contratado'
    if (!usersCol.fields.getByName('licenca_camada')) {
      usersCol.fields.add(
        new SelectField({
          name: 'licenca_camada',
          values: ['free_cadastro', 'trial', 'plano_contratado'],
          maxSelect: 1,
        }),
      )
    }

    app.save(usersCol)
  },
  (app) => {
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
    const fieldsToRemove = [
      'trial_tipo',
      'trial_inicio',
      'trial_fim',
      'trial_notas_limite',
      'trial_notas_consumidas',
      'licenca_camada',
    ]

    fieldsToRemove.forEach((f) => {
      const field = usersCol.fields.getByName(f)
      if (field) {
        usersCol.fields.removeByName(f)
      }
    })

    app.save(usersCol)
  },
)
