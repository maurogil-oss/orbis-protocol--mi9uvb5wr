migrate(
  (app) => {
    // 1. Atualizar coleção users: adicionar campo role
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
    if (!usersCol.fields.getByName('role')) {
      usersCol.fields.add(
        new SelectField({
          name: 'role',
          values: ['admin', 'perito', 'cliente'],
          maxSelect: 1,
        }),
      )
      app.save(usersCol)
    }

    // Set role = 'admin' para maurog1@hotmail.com e 'cliente' default para os demais
    app
      .db()
      .newQuery("UPDATE users SET role = 'admin' WHERE email = 'maurog1@hotmail.com'")
      .execute()
    app.db().newQuery("UPDATE users SET role = 'cliente' WHERE role IS NULL OR role = ''").execute()

    // 2. Atualizar coleção leads_diagnostico:
    // Novos campos de triagem de emissões e CBAM
    const leadsCol = app.findCollectionByNameOrId('leads_diagnostico')

    if (!leadsCol.fields.getByName('consumo_energia')) {
      leadsCol.fields.add(new TextField({ name: 'consumo_energia' }))
    }
    if (!leadsCol.fields.getByName('frota_propria')) {
      leadsCol.fields.add(
        new SelectField({
          name: 'frota_propria',
          values: ['sim', 'nao'],
          maxSelect: 1,
        }),
      )
    }
    if (!leadsCol.fields.getByName('inventario_ghg')) {
      leadsCol.fields.add(
        new SelectField({
          name: 'inventario_ghg',
          values: ['sim', 'nao', 'em_andamento'],
          maxSelect: 1,
        }),
      )
    }
    if (!leadsCol.fields.getByName('iso_14001')) {
      leadsCol.fields.add(
        new SelectField({
          name: 'iso_14001',
          values: ['sim', 'nao'],
          maxSelect: 1,
        }),
      )
    }
    if (!leadsCol.fields.getByName('faixa_emissoes')) {
      leadsCol.fields.add(
        new SelectField({
          name: 'faixa_emissoes',
          values: ['abaixo_10k', 'entre_10k_25k', 'acima_25k', 'nao_sei_calcular'],
          maxSelect: 1,
        }),
      )
    }
    if (!leadsCol.fields.getByName('enquadramento_sbce')) {
      leadsCol.fields.add(new TextField({ name: 'enquadramento_sbce' }))
    }
    if (!leadsCol.fields.getByName('exporta_ue_cbam')) {
      leadsCol.fields.add(
        new SelectField({
          name: 'exporta_ue_cbam',
          values: ['sim', 'nao'],
          maxSelect: 1,
        }),
      )
    }
    if (!leadsCol.fields.getByName('cbam_bens')) {
      leadsCol.fields.add(new TextField({ name: 'cbam_bens' }))
    }

    // Atualizar Regras de Acesso de leads_diagnostico:
    // create público ('') para permitir diagnóstico anônimo
    // list e view restritos ao dono do lead ou admin/perito
    // update e delete restritos ao dono do lead ou admin/perito
    leadsCol.createRule = ''
    leadsCol.listRule =
      "@request.auth.id != '' && (usuario = @request.auth.id || @request.auth.role = 'admin' || @request.auth.role = 'perito')"
    leadsCol.viewRule =
      "@request.auth.id != '' && (usuario = @request.auth.id || @request.auth.role = 'admin' || @request.auth.role = 'perito')"
    leadsCol.updateRule =
      "@request.auth.id != '' && (usuario = @request.auth.id || @request.auth.role = 'admin' || @request.auth.role = 'perito')"
    leadsCol.deleteRule =
      "@request.auth.id != '' && (usuario = @request.auth.id || @request.auth.role = 'admin' || @request.auth.role = 'perito')"

    app.save(leadsCol)

    // 3. Atualizar coleção selos: adicionar hash_integridade e ajustar regras
    const selosCol = app.findCollectionByNameOrId('selos')
    if (!selosCol.fields.getByName('hash_integridade')) {
      selosCol.fields.add(new TextField({ name: 'hash_integridade' }))
    }

    // Regras selos: view pública por código/id; list restrita a autenticados para evitar dump geral da base
    selosCol.listRule = "@request.auth.id != ''"
    selosCol.viewRule = ''
    selosCol.createRule =
      "@request.auth.id != '' && (@request.auth.role = 'admin' || @request.auth.role = 'perito')"
    selosCol.updateRule =
      "@request.auth.id != '' && (@request.auth.role = 'admin' || @request.auth.role = 'perito')"
    selosCol.deleteRule =
      "@request.auth.id != '' && (@request.auth.role = 'admin' || @request.auth.role = 'perito')"

    app.save(selosCol)

    // 4. Calcular e preencher o hash_integridade para os 3 selos existentes
    try {
      const selos = app.findRecordsByFilter('selos', '1=1', 'created', 10, 0)
      for (let s of selos) {
        const canonical =
          s.getString('codigo_selo').trim().toUpperCase() +
          '|' +
          s.getString('empresa').trim() +
          '|' +
          s.getString('cnpj').trim() +
          '|' +
          s.getString('status') +
          '|' +
          s.getString('data_emissao') +
          '|' +
          s.getString('data_validade')
        const hash = $security.sha256(canonical)
        s.set('hash_integridade', hash)
        app.save(s)
      }
    } catch (_) {}
  },
  (app) => {
    // Reversão
    try {
      const selosCol = app.findCollectionByNameOrId('selos')
      selosCol.listRule = ''
      selosCol.viewRule = ''
      app.save(selosCol)
    } catch (_) {}

    try {
      const leadsCol = app.findCollectionByNameOrId('leads_diagnostico')
      leadsCol.listRule = ''
      leadsCol.viewRule = ''
      app.save(leadsCol)
    } catch (_) {}
  },
)
