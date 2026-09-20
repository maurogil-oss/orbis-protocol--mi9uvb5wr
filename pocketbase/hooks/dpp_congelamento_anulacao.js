/**
 * HOOK CENTRAL: CONGELAMENTO PÓS-EMISSÃO E ANULAÇÃO FORMAL DE DOCUMENTOS DPP
 *
 * Itens 2 e 5:
 * 1. onRecordUpdate / onRecordDelete para:
 *    - cdv_pecas
 *    - cdv_lotes
 *    - dpp_destinacao_final
 *    Rejeitar exclusão ou alteração de dados de registros já emitidos (com hash/DPP emitido).
 *    Permite apenas marcação formal de status = 'anulado' por admin.
 *
 * 2. Endpoint exclusivo de anulação formal:
 *    routerAdd('POST', '/backend/v1/dpp/anular', ...)
 *    Exige admin, motivo obrigatório, grava no audit_log e marca status 'anulado'.
 */

// 1. Endpoint formal de anulação exclusiva para Admin
routerAdd(
  'POST',
  '/backend/v1/dpp/anular',
  (e) => {
    try {
      const auth = e.auth
      if (!auth || auth.getString('role') !== 'admin') {
        return e.json(403, {
          error: 'Acesso negado: apenas administradores podem formalizar anulação de DPP.',
        })
      }

      const body = e.requestInfo().body || {}
      const tipo = String(body.tipo || '').trim() // 'peca' | 'lote' | 'destinacao' | 'selo' | 'lastro'
      const id = String(body.id || '').trim()
      const motivo = String(body.motivo || '').trim()

      if (!tipo || !id) {
        return e.badRequestError(
          'Tipo (peca, lote, destinacao, selo, lastro) e ID são obrigatórios.',
        )
      }

      if (!motivo || motivo.length < 10) {
        return e.badRequestError('O motivo da anulação é obrigatório (mínimo 10 caracteres).')
      }

      const agora = new Date().toISOString()
      const adminEmail = auth.getString('email') || 'admin'
      const adminId = auth.id
      const clientIp =
        e.requestInfo().headers['x-forwarded-for'] || e.requestInfo().headers['x-real-ip'] || ''

      let collectionName = ''
      if (tipo === 'peca') collectionName = 'cdv_pecas'
      else if (tipo === 'lote') collectionName = 'cdv_lotes'
      else if (tipo === 'destinacao') collectionName = 'dpp_destinacao_final'
      else if (tipo === 'selo') collectionName = 'selos'
      else if (tipo === 'lastro') collectionName = 'lastro_circularidade'
      else {
        return e.badRequestError('Tipo inválido para anulação.')
      }

      const rec = $app.findFirstRecordByData(collectionName, 'id', id)
      if (!rec) {
        return e.notFoundError('Registro não localizado para anulação.')
      }

      const statusAtual = rec.getString('status')
      if (statusAtual === 'anulado' || statusAtual === 'revogado') {
        return e.badRequestError('O registro já se encontra formalmente anulado/revogado.')
      }

      // Atualiza o registro como anulado/revogado
      if (collectionName === 'selos') {
        rec.set('status', 'revogado')
      } else {
        rec.set('status', 'anulado')
        try {
          rec.set('motivo_anulacao', motivo)
          rec.set('anulado_em', agora)
          rec.set('anulado_por', adminEmail)
        } catch (_) {}
      }

      $app.save(rec)

      // Gravação append-only no audit_log
      try {
        const auditCol = $app.findCollectionByNameOrId('audit_log')
        const log = new Record(auditCol)
        log.set('acao', 'dpp_anulacao_formal')
        log.set('entidade', collectionName)
        log.set('entidade_id', id)
        log.set('ator_id', adminId)
        log.set('ator_email', adminEmail)
        log.set('papel', 'admin')
        log.set('detalhes', {
          tipo: tipo,
          identificador:
            rec.getString('codigo_lastro') ||
            rec.getString('selo_dpp') ||
            rec.getString('codigo_selo') ||
            rec.getString('veiculo_chassi') ||
            id,
          motivo: motivo,
          status_anterior: statusAtual,
          novo_status: collectionName === 'selos' ? 'revogado' : 'anulado',
          timestamp: agora,
        })
        log.set('ip', clientIp)
        $app.save(log)
      } catch (eAudit) {
        console.log('Erro ao gravar audit_log na anulação:', eAudit)
      }

      return e.json(200, {
        sucesso: true,
        mensagem:
          'Registro formalmente anulado. O documento permanecerá auditável com status ANULADO.',
        id: rec.id,
        status: rec.getString('status'),
        anulado_em: agora,
        anulado_por: adminEmail,
      })
    } catch (err) {
      return e.json(500, { error: err.message || 'Erro ao anular registro DPP.' })
    }
  },
  $apis.requireAuth(),
)

// 2. Trava de integridade antes da atualização (beforeUpdate):
// Rejeita qualquer mutação em registros cdv_pecas que já possuam hash_sha256 emitido,
// EXCETO se a única mudança for a marcação de anulação (status = 'anulado').
onRecordUpdate((e) => {
  const rec = e.record
  const orig = rec.original()
  if (!orig) return

  const hashOriginal = orig.getString('hash_sha256')
  const statusOriginal = orig.getString('status')
  const novoStatus = rec.getString('status')

  // Se já tinha hash emitido:
  if (hashOriginal && hashOriginal.trim() !== '') {
    // Se o registro original já estava anulado, não pode mudar mais nada!
    if (statusOriginal === 'anulado') {
      throw new BadRequestError('Registro já anulado é estritamente imutável.')
    }

    // Se estiver mudando para anulado, permite registrar o status e os metadados de anulação
    if (novoStatus === 'anulado') {
      return
    }

    // Se estiver tentando alterar dados estruturais da peça emitida
    const camposProtegidos = [
      'selo_dpp',
      'sku_interno',
      'peso_kg',
      'fator_co2e_kg',
      'co2e_evitado_kg',
      'hash_sha256',
      'veiculo_chassi_mascarado',
      'veiculo_baixa_detran',
      'cdv_cnpj',
      'categoria_material',
    ]

    for (const c of camposProtegidos) {
      if (rec.get(c) !== orig.get(c)) {
        throw new BadRequestError(
          `Violação de Congelamento Pós-Emissão: o campo "${c}" de peça DPP emitida não pode ser alterado. Utilize o caminho formal de anulação.`,
        )
      }
    }
  }
}, 'cdv_pecas')

// Trava antes de deletar cdv_pecas
onRecordDelete((e) => {
  const rec = e.record
  const hash = rec.getString('hash_sha256')
  if (hash && hash.trim() !== '') {
    throw new BadRequestError(
      'Violação de Governança: peças DPP com hash/selo emitido não podem ser excluídas do banco de dados. Utilize o caminho formal de anulação.',
    )
  }
}, 'cdv_pecas')

// Trava antes de deletar cdv_lotes
onRecordDelete((e) => {
  const rec = e.record
  const status = rec.getString('status')
  if (status === 'processado' || status === 'anulado') {
    throw new BadRequestError(
      'Violação de Governança: lotes veiculares processados não podem ser excluídos. Utilize o caminho formal de anulação.',
    )
  }
}, 'cdv_lotes')

// Trava antes de deletar dpp_destinacao_final
onRecordDelete((e) => {
  const rec = e.record
  const hash = rec.getString('hash_sha256')
  if (hash && hash.trim() !== '') {
    throw new BadRequestError(
      'Violação de Governança: evidências de destinação final com hash emitido não podem ser excluídas. Utilize o caminho formal de anulação.',
    )
  }
}, 'dpp_destinacao_final')

// Trava antes de deletar ou alterar indevidamente lastro_circularidade
onRecordUpdate((e) => {
  const rec = e.record
  const orig = rec.original()
  if (!orig) return

  const hashOriginal = orig.getString('hash_sha256')
  const statusOriginal = orig.getString('status')
  const novoStatus = rec.getString('status')

  if (hashOriginal && hashOriginal.trim() !== '') {
    if (statusOriginal === 'anulado') {
      throw new BadRequestError('Documento de Lastro já anulado é estritamente imutável.')
    }

    if (novoStatus === 'anulado') {
      return
    }

    const camposProtegidos = [
      'codigo_lastro',
      'hash_sha256',
      'cnpj_emissor',
      'entidade_gestora_alvo',
      'massa_total_lr_obrigatoria_kg',
      'periodo_inicio',
      'periodo_fim',
      'aviso_legal',
    ]

    for (const c of camposProtegidos) {
      if (rec.get(c) !== orig.get(c)) {
        throw new BadRequestError(
          `Violação de Governança: o campo "${c}" de Lastro de Circularidade emitido não pode ser alterado. Utilize o caminho formal de anulação com justificativa.`,
        )
      }
    }
  }
}, 'lastro_circularidade')

onRecordDelete((e) => {
  throw new BadRequestError(
    'Violação de Governança: Documentos de Lastro de Circularidade emitidos são imutáveis e não podem ser excluídos. Utilize o fluxo formal de anulação administrativa.',
  )
}, 'lastro_circularidade')
