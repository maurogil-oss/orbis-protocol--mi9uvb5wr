routerAdd('POST', '/backend/v1/infosimples/revogar-certificado-a1', (e) => {
  try {
    const authRecord = e.auth
    if (!authRecord) {
      return e.json(401, {
        sucesso: false,
        erro: 'Autenticação necessária para revogar certificado digital.',
      })
    }

    const body = e.requestInfo().body || {}
    const motivo = body.motivo ? String(body.motivo).trim() : 'Revogação voluntária pelo titular'

    let certRec = null
    try {
      certRec = $app.findFirstRecordByData('cliente_certificados_a1', 'usuario', authRecord.id)
    } catch (_) {}

    if (!certRec) {
      return e.badRequestError('Nenhum certificado A1 registrado para este usuário.')
    }

    const agoraIso = new Date().toISOString()
    const reqInfo = e.requestInfo()
    const clientIp =
      reqInfo.headers['x-forwarded-for'] ||
      reqInfo.headers['x-real-ip'] ||
      reqInfo.remoteIP ||
      '127.0.0.1'

    // Zeramento de chave imediato: limpa senha cifrada e arquivo pfx, inativa custódia
    certRec.set('ativo', false)
    certRec.set('status_custodia', 'revogado')
    certRec.set('senha_cifrada', '') // Zeramento de chave
    certRec.set('arquivo_pfx', null) // Limpeza de arquivo do cofre
    certRec.set('data_revogacao', agoraIso)
    certRec.set('motivo_revogacao', motivo)
    $app.save(certRec)

    // Registra evento de auditoria em lgpd_solicitacoes (categoria revogação)
    try {
      const lgpdCol = $app.findCollectionByNameOrId('lgpd_solicitacoes')
      const solRec = new Record(lgpdCol)
      const protocolo =
        'REV-A1-' +
        Date.now().toString(36).toUpperCase() +
        '-' +
        $security.randomString(4).toUpperCase()
      solRec.set('protocolo', protocolo)
      solRec.set('tipo_pedido', 'revogacao_consentimento')
      solRec.set(
        'nome_titular',
        certRec.getString('razao_social') || authRecord.getString('name') || 'Titular',
      )
      solRec.set('email_titular', authRecord.getString('email') || 'titular@orbisprotocol.org')
      solRec.set('cpf_cnpj_titular', certRec.getString('cnpj_titular'))
      solRec.set(
        'descricao',
        'Revogação instantânea de custódia do Certificado A1. Zeramento de chave criptográfica e remoção de arquivo executados com sucesso via IP: ' +
          String(clientIp).split(',')[0].trim() +
          '. Motivo: ' +
          motivo,
      )
      solRec.set('status', 'atendido')
      solRec.set('prazo_legal_dias', 0)
      solRec.set('data_limite_resposta', agoraIso)
      solRec.set('hash_protocolo', $security.sha256(protocolo + agoraIso))
      solRec.set(
        'resposta_encarregado',
        'Zeramento imediato de chaves concluído nos servidores do Bureau ACP / Orbis.',
      )
      solRec.set('atendido_por', 'Sistema Automatizado de Revogação Criptográfica')
      $app.save(solRec)
    } catch (_) {}

    return e.json(200, {
      sucesso: true,
      mensagem:
        'Custódia do Certificado A1 revogada com sucesso. Chaves criptográficas zeradas e arquivo eliminado dos servidores.',
      data_revogacao: agoraIso,
      status_custodia: 'revogado',
    })
  } catch (err) {
    return e.json(500, {
      sucesso: false,
      erro: err.message || 'Erro ao processar revogação do certificado A1.',
    })
  }
})
