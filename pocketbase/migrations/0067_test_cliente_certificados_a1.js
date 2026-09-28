migrate(
  (app) => {
    // Teste de gravação ponta a ponta com normalização de datas no formato PB v0.36
    const certCol = app.findCollectionByNameOrId('cliente_certificados_a1')
    const user = app.findFirstRecordByData('_pb_users_auth_', 'email', 'maurog1@hotmail.com')

    // Formato obrigatório PocketBase v0.36: "YYYY-MM-DD HH:mm:ss.000Z"
    const validadePb = '2027-09-28 12:00:00.000Z'
    const aceitePb = '2026-09-28 12:00:00.000Z'

    const testRec = new Record(certCol)
    testRec.set('usuario', user.id)
    testRec.set('cnpj_titular', '19598964000100')
    testRec.set('razao_social', 'EMPRESA TESTE CUSTODIA A1 LTDA')
    testRec.set('validade_certificado', validadePb)
    testRec.set('ativo', true)
    testRec.set('termo_lgpd_aceito', true)
    testRec.set('data_aceite_lgpd', aceitePb)
    testRec.set('termo_versao', 'v2026-01')
    testRec.set('consentimento_ip', '127.0.0.1')
    testRec.set('consentimento_data_hora', aceitePb)
    testRec.set('status_custodia', 'ativo')

    // Grava o registro de teste
    app.save(testRec)
    console.log('[MIGRATION TEST] Gravou registro com sucesso, id:', testRec.id)

    // Verifica que foi salvo e recupera
    const salvo = app.findFirstRecordByData('cliente_certificados_a1', 'id', testRec.id)
    console.log(
      '[MIGRATION TEST] Recuperou registro salvo com validade:',
      salvo.getString('validade_certificado'),
    )

    // Imediatamente remove o registro de teste conforme requisito (f)
    app.delete(salvo)
    console.log('[MIGRATION TEST] Registro de teste removido com sucesso.')
  },
  () => {},
)
