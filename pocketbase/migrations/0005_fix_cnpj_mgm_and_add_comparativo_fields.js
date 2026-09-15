migrate(
  (app) => {
    const leadsCol = app.findCollectionByNameOrId('leads_diagnostico')

    // 1. Atualizar o CNPJ de teste da MGM na tabela leads_diagnostico
    // Se existir registro com o CNPJ antigo 19.958.964/0001-01, atualiza para 19.598.964/0001-01
    try {
      const oldRec = app.findFirstRecordByData('leads_diagnostico', 'cnpj', '19.958.964/0001-01')
      oldRec.set('cnpj', '19.598.964/0001-01')
      app.save(oldRec)
    } catch (_) {
      // Se não houver com o CNPJ antigo, assegura que o novo exista
      try {
        app.findFirstRecordByData('leads_diagnostico', 'cnpj', '19.598.964/0001-01')
      } catch (__) {
        let adminUserId = ''
        try {
          const adminUser = app.findAuthRecordByEmail('_pb_users_auth_', 'maurog1@hotmail.com')
          adminUserId = adminUser.id
        } catch (___) {}

        const rec = new Record(leadsCol)
        rec.set('cnpj', '19.598.964/0001-01')
        rec.set('razao_social', 'Comércio & Serviços Varejistas Prime Ltda (MGM)')
        rec.set('email', 'diretoria@mgmconsultoria.com.br')
        rec.set('whatsapp', '(41) 99876-0011')
        rec.set('responsavel', 'Mauro Gilberto')
        rec.set('categoria_profissional', 'Contador / Auditor Independente (CRC)')
        rec.set('conselho', 'CRC-PR 054812')
        rec.set('vinculo_institucional', 'Associado ACP (Paraná)')
        rec.set('regime_tributario', 'Simples Nacional')
        rec.set('status', 'concluido')
        if (adminUserId) {
          rec.set('usuario', adminUserId)
        }
        app.save(rec)
      }
    }

    // 2. Adicionar campos para o comparativo tributário da Reforma Tributária (EC 132/2023 + LC)
    // Campos: faixa_impacto_tributario, comparativo_tributario_json
    if (!leadsCol.fields.getByName('faixa_impacto_tributario')) {
      leadsCol.fields.add(
        new SelectField({
          name: 'faixa_impacto_tributario',
          values: ['ganho_provavel', 'neutro', 'ponto_atencao'],
          maxSelect: 1,
        }),
      )
    }

    if (!leadsCol.fields.getByName('comparativo_tributario_json')) {
      leadsCol.fields.add(
        new JSONField({
          name: 'comparativo_tributario_json',
        }),
      )
    }

    app.save(leadsCol)
  },
  (app) => {
    // Reversão
    try {
      const rec = app.findFirstRecordByData('leads_diagnostico', 'cnpj', '19.598.964/0001-01')
      rec.set('cnpj', '19.958.964/0001-01')
      app.save(rec)
    } catch (_) {}
  },
)
