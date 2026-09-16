migrate(
  (app) => {
    // 1. Atualizar regras de acesso de hashes_competencia para leitura pública (view e list) de fechamentos registrados
    // Permitir consulta pública anônima pelo CNPJ/competência
    try {
      const colHashes = app.findCollectionByNameOrId('hashes_competencia')
      colHashes.listRule = ''
      colHashes.viewRule = ''
      app.save(colHashes)
    } catch (err) {
      console.log('Erro ao atualizar regras de hashes_competencia:', err)
    }

    // 2. Atualizar regras de acesso de dpp_consultas para permitir leitura de consultas registradas (pública para históricos de verificação)
    try {
      const colDpp = app.findCollectionByNameOrId('dpp_consultas')
      colDpp.listRule = ''
      colDpp.viewRule = ''
      app.save(colDpp)
    } catch (err) {
      console.log('Erro ao atualizar regras de dpp_consultas:', err)
    }

    // 3. Atualizar regras de acesso de selos e corporativo_demo garantindo leitura pública completa
    try {
      const colSelos = app.findCollectionByNameOrId('selos')
      colSelos.listRule = ''
      colSelos.viewRule = ''
      app.save(colSelos)
    } catch (err) {
      console.log('Erro ao atualizar regras de selos:', err)
    }

    try {
      const colCorp = app.findCollectionByNameOrId('corporativo_demo')
      colCorp.listRule = ''
      colCorp.viewRule = ''
      app.save(colCorp)
    } catch (err) {
      console.log('Erro ao atualizar regras de corporativo_demo:', err)
    }

    // 4. Seeder do hash de fechamento da competência julho_2026 para a empresa demo Indústrias & Logística Integrada Brasil S.A.
    // CNPJ: 76.492.108/0001-92
    try {
      const adminUser = app.findFirstRecordByData('_pb_users_auth_', 'email', 'maurog1@hotmail.com')
      const userId = adminUser ? adminUser.id : 'admin'

      const existing = app.findRecordsByFilter(
        'hashes_competencia',
        'cnpj = "76.492.108/0001-92" && competencia = "julho_2026"',
        '-created',
        1,
        0,
      )

      if (!existing || existing.length === 0) {
        const colHashes = app.findCollectionByNameOrId('hashes_competencia')
        const rec = new Record(colHashes)
        rec.set('usuario', userId)
        rec.set('cnpj', '76.492.108/0001-92')
        rec.set('competencia', 'julho_2026')
        rec.set(
          'hash_fechamento',
          '0x8f4b29a7e3c12948bb92ff78201a0bc45d61e93f91823ab12c98d7ef2049ba12',
        )
        rec.set('total_notas', 12)
        rec.set('chaves_inclusas', [
          '41260776483817000120660010048921021000289014',
          '41260704112980000131550010012048811000357018',
          '41260700452190000177550010004129001000200012',
          '41260789637490000145550010091104501000112519',
          '35260761293440000181550010014421001000258013',
          '31260717332901000114550010003189051000931015',
          '41260705340890000118570010000893121000151216',
          '41260711450982000190650010035412001000046217',
          '41260718990112000165000012026008412100001261',
          '41260778583190000109630010001428901000015911',
          '41260703712449000152670010000384111000144310',
          '41260776484013000145000010009482011000014415',
        ])
        rec.set('data_fechamento', '2026-07-31T23:59:59.000Z')
        app.save(rec)
      }
    } catch (hashErr) {
      console.log('Aviso ao seedar hash de fechamento:', hashErr)
    }

    // 5. Seeder de selo demo de produto: ORB-DCP-KLBN-4819 se ainda não existir
    try {
      const existingSelo = app.findRecordsByFilter(
        'selos',
        'codigo_selo = "ORB-DCP-KLBN-4819"',
        '-created',
        1,
        0,
      )

      if (!existingSelo || existingSelo.length === 0) {
        const colSelos = app.findCollectionByNameOrId('selos')
        const seloRec = new Record(colSelos)
        seloRec.set('codigo_selo', 'ORB-DCP-KLBN-4819')
        seloRec.set('empresa', 'Klabin S.A. / Indústrias & Logística Integrada Brasil S.A.')
        seloRec.set('cnpj', '89.637.490/0001-45')
        seloRec.set('status', 'ativo')
        seloRec.set('data_emissao', '2026-07-28 00:00:00.000Z')
        seloRec.set('data_validade', '2028-07-28 00:00:00.000Z')
        seloRec.set(
          'hash_integridade',
          '7d9e4a8f3b2c1d0e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e',
        )
        app.save(seloRec)
      }
    } catch (seloErr) {
      console.log('Aviso ao seedar selo demo produto:', seloErr)
    }
  },
  (app) => {
    // Reverter regras se necessário
  },
)
