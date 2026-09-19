/**
 * MIGRATION 0034: AUDITORIA DE LIQUIDACAO, DOCUMENTACAO FISCAL DE PARCEIROS E RETROALIMENTACAO DEFENSIVA
 *
 * (1) cobrancas:
 *     - liquidado_por: text (id e nome do admin responsável)
 *     - liquidado_em: text (data/hora ISO da liquidação manual)
 *     - liquidacao_justificativa: text (justificativa obrigatória da liquidação)
 *     - liquidacao_comprovante_ref: text (nº doc / comprovante / chave PIX)
 *     - origem_preco: text ('catalogo' | 'contingencia')
 *     - divergencia_preco: bool
 *     - ciclo_recorrencia: text (ex: '2026-04')
 *
 * (2) parceiros:
 *     - tipo_documentacao: select ['RPA', 'NFSe_pj']
 *     - documento_fiscal_url: text (URL ou arquivo do RPA / NFS-e anexado)
 *     - documento_fiscal_validado: bool (apenas admin pode validar)
 *
 * (3) users:
 *     - retroalimentação defensiva:
 *       contas com role cliente que tenham CNPJ em leads_diagnostico recebem o CNPJ
 *       contas sem relação recebem assinatura_status = 'n/a'
 */

migrate(
  (app) => {
    // 1. Atualizar cobrancas
    const cobrancasCol = app.findCollectionByNameOrId('cobrancas')
    if (!cobrancasCol.fields.getByName('liquidado_por')) {
      cobrancasCol.fields.add(new TextField({ name: 'liquidado_por' }))
    }
    if (!cobrancasCol.fields.getByName('liquidado_em')) {
      cobrancasCol.fields.add(new TextField({ name: 'liquidado_em' }))
    }
    if (!cobrancasCol.fields.getByName('liquidacao_justificativa')) {
      cobrancasCol.fields.add(new TextField({ name: 'liquidacao_justificativa' }))
    }
    if (!cobrancasCol.fields.getByName('liquidacao_comprovante_ref')) {
      cobrancasCol.fields.add(new TextField({ name: 'liquidacao_comprovante_ref' }))
    }
    if (!cobrancasCol.fields.getByName('origem_preco')) {
      cobrancasCol.fields.add(new TextField({ name: 'origem_preco' }))
    }
    if (!cobrancasCol.fields.getByName('divergencia_preco')) {
      cobrancasCol.fields.add(new BoolField({ name: 'divergencia_preco' }))
    }
    if (!cobrancasCol.fields.getByName('ciclo_recorrencia')) {
      cobrancasCol.fields.add(new TextField({ name: 'ciclo_recorrencia' }))
    }
    app.save(cobrancasCol)

    // 2. Atualizar parceiros
    const parceirosCol = app.findCollectionByNameOrId('parceiros')
    if (!parceirosCol.fields.getByName('tipo_documentacao')) {
      parceirosCol.fields.add(
        new SelectField({
          name: 'tipo_documentacao',
          values: ['RPA', 'NFSe_pj'],
          maxSelect: 1,
        }),
      )
    }
    if (!parceirosCol.fields.getByName('documento_fiscal_url')) {
      parceirosCol.fields.add(new TextField({ name: 'documento_fiscal_url' }))
    }
    if (!parceirosCol.fields.getByName('documento_fiscal_validado')) {
      parceirosCol.fields.add(new BoolField({ name: 'documento_fiscal_validado' }))
    }
    app.save(parceirosCol)

    // 3. Retroalimentação defensiva de users
    try {
      const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
      const allUsers = app.findRecordsByFilter('_pb_users_auth_', 'id != ""', 'created', 200, 0)

      for (const u of allUsers) {
        let changed = false

        // Se CNPJ estiver em branco e usuário tiver role cliente/outro
        if (!u.getString('cnpj')) {
          // Buscar em leads_diagnostico por usuario = u.id ou email
          try {
            const lead = app.findFirstRecordByData('leads_diagnostico', 'usuario', u.id)
            if (lead && lead.getString('cnpj')) {
              u.set('cnpj', lead.getString('cnpj'))
              changed = true
            }
          } catch (_) {
            try {
              const leadEmail = app.findFirstRecordByData(
                'leads_diagnostico',
                'email',
                u.getString('email'),
              )
              if (leadEmail && leadEmail.getString('cnpj')) {
                u.set('cnpj', leadEmail.getString('cnpj'))
                changed = true
              }
            } catch (_) {}
          }

          // Se ainda sem CNPJ, buscar em cobrancas associadas
          if (!u.getString('cnpj')) {
            try {
              const cob = app.findFirstRecordByData('cobrancas', 'usuario', u.id)
              if (cob && cob.getString('tomador_cpf_cnpj')) {
                u.set('cnpj', cob.getString('tomador_cpf_cnpj'))
                changed = true
              }
            } catch (_) {}
          }
        }

        // Se não tiver assinatura_status preenchido e não tiver plano ativo nem cobrança
        if (!u.getString('assinatura_status')) {
          let temCobranca = false
          try {
            const c = app.findFirstRecordByData('cobrancas', 'usuario', u.id)
            if (c) temCobranca = true
          } catch (_) {}

          if (!temCobranca && !u.getString('plano_ativo')) {
            u.set('assinatura_status', 'n/a')
            changed = true
          }
        }

        if (changed) {
          app.save(u)
        }
      }
    } catch (eRetro) {
      console.log('Aviso retroalimentacao migration 0034:', eRetro)
    }
  },
  (app) => {
    // Revert opcional
  },
)
