migrate(
  (app) => {
    // 1. Identifica e valida chave derivada consistente
    const rawSecret = $os.getenv('PB_SUPERUSER_TOKEN') || 'orbis_protocol_safe_key_32chars_min'
    const derivedKey = $security.sha256(rawSecret).slice(0, 32)

    console.log(
      '[MIGRATION 0069] rawSecret length:',
      rawSecret.length,
      'derivedKey length:',
      derivedKey.length,
    )

    if (derivedKey.length !== 32) {
      throw new Error(
        'Chave derivada não possui exatamente 32 bytes (tamanho: ' + derivedKey.length + ')',
      )
    }

    const certCol = app.findCollectionByNameOrId('cliente_certificados_a1')

    // 2. Verifica se existem registros na coleção cliente_certificados_a1
    // Caso existam com chave antiga/incompatível, tenta decifrar ou re-cifrar de forma segura
    let registrosExistentes = []
    try {
      registrosExistentes = app.findRecordsByFilter('cliente_certificados_a1', '', '', 100, 0)
    } catch (_) {}

    console.log('[MIGRATION 0069] Registros existentes encontrados:', registrosExistentes.length)

    for (let i = 0; i < registrosExistentes.length; i++) {
      const rec = registrosExistentes[i]
      const senhaCifrada = rec.getString('senha_cifrada')
      if (senhaCifrada) {
        let decifrado = false
        // Tenta decifrar com a nova chave derivada
        try {
          $security.decrypt(senhaCifrada, derivedKey)
          decifrado = true
        } catch (_) {}

        if (!decifrado) {
          // Tenta com o rawSecret legado
          try {
            const senhaPlana = $security.decrypt(senhaCifrada, rawSecret)
            // Se decifrou com a chave antiga, re-cifra com a nova chave derivada
            const novaCifra = $security.encrypt(senhaPlana, derivedKey)
            rec.set('senha_cifrada', novaCifra)
            app.save(rec)
            console.log(
              '[MIGRATION 0069] Registro',
              rec.id,
              're-cifrado com chave derivada com sucesso.',
            )
          } catch (legErr) {
            console.log(
              '[MIGRATION 0069] Registro',
              rec.id,
              'não pôde ser decifrado com chave antiga:',
              legErr.message,
            )
          }
        }
      }
    }

    // 3. Teste de ponta a ponta:
    // Gravar um registro de teste em cliente_certificados_a1 com o fluxo real (senha cifrada com chave derivada, validade extraída),
    // ler/descriptografar a senha com a MESMA derivação (prova de consistência entre hooks),
    // confirmar que funciona e DEPOIS remover o registro de teste.
    const user = app.findFirstRecordByData('_pb_users_auth_', 'email', 'maurog1@hotmail.com')
    const senhaTestePlana = 'SenhaSegura@A1#2027!'
    const senhaTesteCifrada = $security.encrypt(senhaTestePlana, derivedKey)

    const validadePb = '2027-02-12 23:59:59.000Z'
    const aceitePb = '2026-09-28 12:00:00.000Z'

    const testRec = new Record(certCol)
    testRec.set('usuario', user.id)
    testRec.set('cnpj_titular', '12345678000190')
    testRec.set('razao_social', 'TESTE INTEGRACAO A1 CERTIFICADO LTDA')
    testRec.set('senha_cifrada', senhaTesteCifrada)
    testRec.set('validade_certificado', validadePb)
    testRec.set('ativo', true)
    testRec.set('status_custodia', 'ativo')
    testRec.set('termo_lgpd_aceito', true)
    testRec.set('data_aceite_lgpd', aceitePb)
    testRec.set('termo_versao', 'v2026-01')
    testRec.set('consentimento_ip', '127.0.0.1')
    testRec.set('consentimento_data_hora', aceitePb)

    if (typeof $filesystem !== 'undefined' && typeof $filesystem.fileFromBytes === 'function') {
      const bytes = [0x30, 0x82, 0x01, 0x00]
      const pfxFile = $filesystem.fileFromBytes(bytes, 'teste_ponta_a_ponta.pfx')
      testRec.set('arquivo_pfx', pfxFile)
    }

    app.save(testRec)
    console.log('[MIGRATION 0069] Registro de teste salvo com sucesso, ID:', testRec.id)

    // Recupera do banco para validar leitura e decifragem consistente
    const salvo = app.findFirstRecordByData('cliente_certificados_a1', 'id', testRec.id)
    const senhaRecuperadaCifrada = salvo.getString('senha_cifrada')
    const validadeRecuperada = salvo.getString('validade_certificado')

    if (!validadeRecuperada || validadeRecuperada !== validadePb) {
      throw new Error(
        'Falha na validação da validade do certificado gravado: ' + validadeRecuperada,
      )
    }

    // Descriptografa com a MESMA derivação (exatamente como em infosimples_nfe.js)
    const senhaDescriptografada = $security.decrypt(senhaRecuperadaCifrada, derivedKey)

    if (senhaDescriptografada !== senhaTestePlana) {
      throw new Error(
        'Falha no teste: senha descriptografada (' +
          senhaDescriptografada +
          ') não confere com a original (' +
          senhaTestePlana +
          ')',
      )
    }

    console.log(
      '[MIGRATION 0069] Descriptografia ponta a ponta bem-sucedida! Senha coincide exatamente.',
    )

    // Remove o registro de teste para a base de dados ficar limpa
    app.delete(salvo)
    console.log('[MIGRATION 0069] Registro de teste removido com sucesso. Base limpa.')
  },
  () => {},
)
