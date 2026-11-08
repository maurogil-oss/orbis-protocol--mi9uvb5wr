migrate((app) => {
  const usersCol = app.findCollectionByNameOrId('users')

  if (!usersCol.fields.getByName('lgpd_termo_versao')) {
    usersCol.fields.add(
      new TextField({
        name: 'lgpd_termo_versao',
        required: false,
      }),
    )
  }

  if (!usersCol.fields.getByName('lgpd_consentimento_data_hora')) {
    usersCol.fields.add(
      new TextField({
        name: 'lgpd_consentimento_data_hora',
        required: false,
      }),
    )
  }

  if (!usersCol.fields.getByName('lgpd_consentimento_ip')) {
    usersCol.fields.add(
      new TextField({
        name: 'lgpd_consentimento_ip',
        required: false,
      }),
    )
  }

  app.save(usersCol)
}, (app) => {
  const usersCol = app.findCollectionByNameOrId('users')

  if (usersCol.fields.getByName('lgpd_termo_versao')) {
    usersCol.fields.removeByName('lgpd_termo_versao')
  }
  if (usersCol.fields.getByName('lgpd_consentimento_data_hora')) {
    usersCol.fields.removeByName('lgpd_consentimento_data_hora')
  }
  if (usersCol.fields.getByName('lgpd_consentimento_ip')) {
    usersCol.fields.removeByName('lgpd_consentimento_ip')
  }

  app.save(usersCol)
})
