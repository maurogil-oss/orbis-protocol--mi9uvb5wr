/**
 * HOOK CENTRAL: AUDITORIA APPEND-ONLY (audit_log) NOS MOMENTOS-CHAVE
 *
 * Registra eventos em audit_log para:
 * 1. Mudança de papel de usuário (users onRecordUpdate)
 * 2. Suspensão / reativação de assinante (users onRecordUpdate)
 * 3. Criação / edição de preço em servicos_catalogo (onRecordCreate / onRecordUpdate)
 * 4. Alteração de dados bancários de parceiro (parceiros onRecordUpdate)
 * 5. Pagamento de comissão (comissoes onRecordUpdate)
 * 6. Aprovação / rejeição / suspensão de credenciamento pericial (perito_credenciamentos onRecordUpdate)
 * 7. Decisões do Dossiê MOVER (mover_vpas onRecordUpdate)
 * 8. Emissão de selos e DPP (selos onRecordCreate)
 * 9. Solicitação e conclusão de redefinição de senha
 */

// 1. users: mudança de papel e status de assinatura
onRecordUpdate((e) => {
  const rec = e.record
  const orig = rec.original()
  if (!orig) return

  const auditCol = $app.findCollectionByNameOrId('audit_log')

  // Mudança de papel de usuário
  if (rec.getString('role') !== orig.getString('role')) {
    const log = new Record(auditCol)
    log.set('acao', 'usuario_mudanca_papel')
    log.set('entidade', 'users')
    log.set('entidade_id', rec.id)
    log.set('ator_id', 'sistema_admin')
    log.set('ator_email', rec.getString('email'))
    log.set('papel', rec.getString('role'))
    log.set('detalhes', {
      papel_anterior: orig.getString('role'),
      novo_papel: rec.getString('role'),
      user_email: rec.getString('email'),
      user_nome: rec.getString('name'),
    })
    $app.save(log)
  }

  // Suspensão / reativação / alteração de status de assinatura
  if (rec.getString('assinatura_status') !== orig.getString('assinatura_status')) {
    const log = new Record(auditCol)
    log.set('acao', 'assinatura_status_alterado')
    log.set('entidade', 'users')
    log.set('entidade_id', rec.id)
    log.set('ator_id', 'sistema_admin')
    log.set('ator_email', rec.getString('email'))
    log.set('papel', rec.getString('role'))
    log.set('detalhes', {
      status_anterior: orig.getString('assinatura_status'),
      novo_status: rec.getString('assinatura_status'),
      plano: rec.getString('plano_ativo'),
      user_email: rec.getString('email'),
    })
    $app.save(log)
  }
}, 'users')

// 2. servicos_catalogo: criação e edição de preços
onRecordCreate((e) => {
  try {
    const rec = e.record
    const auditCol = $app.findCollectionByNameOrId('audit_log')
    const log = new Record(auditCol)
    log.set('acao', 'catalogo_servico_criado')
    log.set('entidade', 'servicos_catalogo')
    log.set('entidade_id', rec.id)
    log.set('ator_id', 'admin')
    log.set('ator_email', 'admin@orbisprotocol.org')
    log.set('papel', 'admin')
    log.set('detalhes', {
      servico_id: rec.getString('servico_id'),
      nome: rec.getString('nome'),
      preco: rec.getFloat('preco'),
      tipo: rec.getString('tipo'),
      ativo: rec.getBool('ativo'),
    })
    $app.save(log)
  } catch (_) {}
}, 'servicos_catalogo')

onRecordUpdate((e) => {
  try {
    const rec = e.record
    const orig = rec.original()
    if (!orig) return

    const precoAnt = orig.getFloat('preco')
    const precoNovo = rec.getFloat('preco')
    const ativoAnt = orig.getBool('ativo')
    const ativoNovo = rec.getBool('ativo')

    if (precoAnt !== precoNovo || ativoAnt !== ativoNovo) {
      const auditCol = $app.findCollectionByNameOrId('audit_log')
      const log = new Record(auditCol)
      log.set('acao', 'catalogo_servico_alterado')
      log.set('entidade', 'servicos_catalogo')
      log.set('entidade_id', rec.id)
      log.set('ator_id', 'admin')
      log.set('ator_email', 'admin@orbisprotocol.org')
      log.set('papel', 'admin')
      log.set('detalhes', {
        servico_id: rec.getString('servico_id'),
        nome: rec.getString('nome'),
        preco_anterior: precoAnt,
        preco_novo: precoNovo,
        ativo_anterior: ativoAnt,
        ativo_novo: ativoNovo,
      })
      $app.save(log)
    }
  } catch (_) {}
}, 'servicos_catalogo')

// 3. parceiros: alteração de dados bancários e validação fiscal
onRecordUpdate((e) => {
  try {
    const rec = e.record
    const orig = rec.original()
    if (!orig) return

    const chavePixAnt = orig.getString('chave_pix')
    const chavePixNova = rec.getString('chave_pix')
    const contaAnt = orig.getString('conta')
    const contaNova = rec.getString('conta')
    const docValAnt = orig.getBool('documento_fiscal_validado')
    const docValNova = rec.getBool('documento_fiscal_validado')

    if (chavePixAnt !== chavePixNova || contaAnt !== contaNova || docValAnt !== docValNova) {
      const auditCol = $app.findCollectionByNameOrId('audit_log')
      const log = new Record(auditCol)
      log.set('acao', 'parceiro_dados_bancarios_ou_fiscais_alterados')
      log.set('entidade', 'parceiros')
      log.set('entidade_id', rec.id)
      log.set('ator_id', 'admin_ou_parceiro')
      log.set('ator_email', rec.getString('contato') || '')
      log.set('papel', 'parceiro/admin')
      log.set('detalhes', {
        codigo_parceiro: rec.getString('codigo_parceiro'),
        nome: rec.getString('nome'),
        chave_pix_alterada: chavePixAnt !== chavePixNova,
        conta_alterada: contaAnt !== contaNova,
        doc_fiscal_validado_anterior: docValAnt,
        doc_fiscal_validado_novo: docValNova,
      })
      $app.save(log)
    }
  } catch (_) {}
}, 'parceiros')

// 4. comissoes: pagamento de comissão
onRecordUpdate((e) => {
  try {
    const rec = e.record
    const orig = rec.original()
    if (!orig) return

    if (orig.getString('status') !== 'paga' && rec.getString('status') === 'paga') {
      const auditCol = $app.findCollectionByNameOrId('audit_log')
      const log = new Record(auditCol)
      log.set('acao', 'comissao_paga')
      log.set('entidade', 'comissoes')
      log.set('entidade_id', rec.id)
      log.set('ator_id', 'admin')
      log.set('ator_email', 'admin@orbisprotocol.org')
      log.set('papel', 'admin')
      log.set('detalhes', {
        valor: rec.getFloat('valor'),
        parceiro_id: rec.getString('parceiro_id'),
        cobranca_id: rec.getString('cobranca_id'),
        comprovante: rec.getString('comprovante'),
        data_pagamento: rec.getString('data_pagamento'),
      })
      $app.save(log)
    }
  } catch (_) {}
}, 'comissoes')

// 5. perito_credenciamentos: aprovação, rejeição, suspensão, validade ART
onRecordUpdate((e) => {
  try {
    const rec = e.record
    const orig = rec.original()
    if (!orig) return

    const statusAnt = orig.getString('status')
    const statusNovo = rec.getString('status')
    const artValAnt = orig.getString('validade_art')
    const artValNova = rec.getString('validade_art')

    if (statusAnt !== statusNovo || artValAnt !== artValNova) {
      const auditCol = $app.findCollectionByNameOrId('audit_log')
      const log = new Record(auditCol)
      log.set(
        'acao',
        statusAnt !== statusNovo ? `perito_${statusNovo}` : 'perito_validade_art_atualizada',
      )
      log.set('entidade', 'perito_credenciamentos')
      log.set('entidade_id', rec.id)
      log.set('ator_id', rec.getString('aprovado_por') || 'auditor')
      log.set('ator_email', rec.getString('email_corporativo'))
      log.set('papel', 'auditor')
      log.set('detalhes', {
        nome: rec.getString('nome_completo'),
        registro: `${rec.getString('conselho_tipo')} ${rec.getString('registro_profissional')}/${rec.getString('registro_uf')}`,
        status_anterior: statusAnt,
        status_novo: statusNovo,
        validade_art_anterior: artValAnt,
        validade_art_nova: artValNova,
        observacao: rec.getString('observacao_auditor') || rec.getString('motivo_suspensao') || '',
      })
      $app.save(log)
    }
  } catch (_) {}
}, 'perito_credenciamentos')

// 6. mover_vpas: decisões de estágio e selo MOVER
onRecordUpdate((e) => {
  try {
    const rec = e.record
    const orig = rec.original()
    if (!orig) return

    const estagioAnt = orig.getString('estagio')
    const estagioNovo = rec.getString('estagio')
    const seloAnt = orig.getString('status_selo_cdv_conforme')
    const seloNovo = rec.getString('status_selo_cdv_conforme')

    if (estagioAnt !== estagioNovo || seloAnt !== seloNovo) {
      const auditCol = $app.findCollectionByNameOrId('audit_log')
      const log = new Record(auditCol)
      log.set('acao', 'mover_vpa_decisao_alterada')
      log.set('entidade', 'mover_vpas')
      log.set('entidade_id', rec.id)
      log.set('ator_id', 'auditor_mover')
      log.set('ator_email', 'mover@orbisprotocol.org')
      log.set('papel', 'admin/auditor')
      log.set('detalhes', {
        codigo_vpa: rec.getString('codigo_vpa'),
        cdv_nome: rec.getString('cdv_nome'),
        estagio_anterior: estagioAnt,
        estagio_novo: estagioNovo,
        selo_conforme_anterior: seloAnt,
        selo_conforme_novo: seloNovo,
      })
      $app.save(log)
    }
  } catch (_) {}
}, 'mover_vpas')

// 7. selos: emissão
onRecordCreate((e) => {
  try {
    const rec = e.record
    const auditCol = $app.findCollectionByNameOrId('audit_log')
    const log = new Record(auditCol)
    log.set('acao', 'selo_emitido')
    log.set('entidade', 'selos')
    log.set('entidade_id', rec.id)
    log.set('ator_id', 'sistema')
    log.set('ator_email', 'dmrv@orbisprotocol.org')
    log.set('papel', 'sistema')
    log.set('detalhes', {
      codigo_selo: rec.getString('codigo_selo'),
      empresa: rec.getString('empresa'),
      cnpj: rec.getString('cnpj'),
      hash_integridade: rec.getString('hash_integridade'),
      data_validade: rec.getString('data_validade'),
    })
    $app.save(log)
  } catch (_) {}
}, 'selos')

// 8. lastro_circularidade: emissão de Lastro de Circularidade
onRecordCreate((e) => {
  try {
    const rec = e.record
    const auditCol = $app.findCollectionByNameOrId('audit_log')
    const log = new Record(auditCol)
    log.set('acao', 'lastro_circularidade_emitido')
    log.set('entidade', 'lastro_circularidade')
    log.set('entidade_id', rec.id)
    log.set('ator_id', rec.getString('usuario') || 'sistema')
    log.set('ator_email', rec.getString('cnpj_emissor') || 'emissor@orbisprotocol.org')
    log.set('papel', 'emissor')
    log.set('detalhes', {
      codigo_lastro: rec.getString('codigo_lastro'),
      entidade_gestora_alvo: rec.getString('entidade_gestora_alvo'),
      cnpj_emissor: rec.getString('cnpj_emissor'),
      periodo_inicio: rec.getString('periodo_inicio'),
      periodo_fim: rec.getString('periodo_fim'),
      massa_total_lr_obrigatoria_kg: rec.getFloat('massa_total_lr_obrigatoria_kg'),
      massa_metais_convencionais_kg: rec.getFloat('massa_metais_convencionais_kg'),
      hash_sha256: rec.getString('hash_sha256'),
    })
    $app.save(log)
  } catch (_) {}
}, 'lastro_circularidade')
