/**
 * MIGRATION 0033: PARCEIROS, COMISSOES & COBRANCAS PARCEIRO_ID
 *
 * (3) Criar coleção parceiros:
 *     - codigo_parceiro: text (formato ORB-PAR-XXXX)
 *     - nome: text (required)
 *     - cpf_cnpj: text (required)
 *     - contato: text (email/telefone)
 *     - percentual_comissao: number (ex: 10 para 10%)
 *     - banco: text
 *     - agencia: text
 *     - conta: text
 *     - chave_pix: text
 *     - status: select ['ativo', 'inativo', 'suspenso']
 *     - usuario: relation -> users (opcional, para login do parceiro no /parceiro)
 *     - RLS: list/view restrita a admin ou se usuario = @request.auth.id
 *
 * (4) Criar coleção comissoes:
 *     - cobranca_id: relation -> cobrancas (ou texto com id da cobranca)
 *     - parceiro_id: relation -> parceiros
 *     - base_calculo: number
 *     - percentual_aplicado: number (percentual congelado na criação)
 *     - valor: number
 *     - status: select ['calculada', 'paga']
 *     - data_pagamento: text
 *     - comprovante: text
 *     - RLS: list/view restrita a admin ou parceiro_id.usuario = @request.auth.id
 *
 * (5) Adicionar em cobrancas:
 *     - parceiro_id: relation -> parceiros (opcional)
 *     - codigo_indicacao: text (ex: ORB-PAR-XXXX vindo de ?ref=ORB-PAR-XXXX)
 */

migrate(
  (app) => {
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')

    // 1. Criar coleção parceiros
    let parceirosCol
    try {
      parceirosCol = app.findCollectionByNameOrId('parceiros')
    } catch (_) {
      parceirosCol = new Collection({
        name: 'parceiros',
        type: 'base',
        listRule:
          "@request.auth.id != '' && (@request.auth.role = 'admin' || usuario = @request.auth.id)",
        viewRule:
          "@request.auth.id != '' && (@request.auth.role = 'admin' || usuario = @request.auth.id)",
        createRule: "@request.auth.id != '' && @request.auth.role = 'admin'",
        updateRule:
          "@request.auth.id != '' && (@request.auth.role = 'admin' || usuario = @request.auth.id)",
        deleteRule: "@request.auth.id != '' && @request.auth.role = 'admin'",
        fields: [
          { name: 'codigo_parceiro', type: 'text', required: true },
          { name: 'nome', type: 'text', required: true },
          { name: 'cpf_cnpj', type: 'text', required: true },
          { name: 'contato', type: 'text' },
          { name: 'percentual_comissao', type: 'number', required: true },
          { name: 'banco', type: 'text' },
          { name: 'agencia', type: 'text' },
          { name: 'conta', type: 'text' },
          { name: 'chave_pix', type: 'text' },
          {
            name: 'status',
            type: 'select',
            required: true,
            values: ['ativo', 'inativo', 'suspenso'],
            maxSelect: 1,
          },
          {
            name: 'usuario',
            type: 'relation',
            required: false,
            collectionId: usersCol.id,
            cascadeDelete: false,
            maxSelect: 1,
          },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE UNIQUE INDEX idx_parceiros_codigo ON parceiros (codigo_parceiro)',
          'CREATE INDEX idx_parceiros_usuario ON parceiros (usuario)',
          'CREATE INDEX idx_parceiros_status ON parceiros (status)',
        ],
      })
      app.save(parceirosCol)
    }

    // 2. Adicionar parceiro_id e codigo_indicacao em cobrancas
    const cobrancasCol = app.findCollectionByNameOrId('cobrancas')
    if (!cobrancasCol.fields.getByName('parceiro_id')) {
      cobrancasCol.fields.add(
        new RelationField({
          name: 'parceiro_id',
          required: false,
          collectionId: parceirosCol.id,
          cascadeDelete: false,
          maxSelect: 1,
        }),
      )
    }
    if (!cobrancasCol.fields.getByName('codigo_indicacao')) {
      cobrancasCol.fields.add(new TextField({ name: 'codigo_indicacao' }))
    }
    app.save(cobrancasCol)

    // 3. Criar coleção comissoes
    try {
      app.findCollectionByNameOrId('comissoes')
    } catch (_) {
      const comissoesCol = new Collection({
        name: 'comissoes',
        type: 'base',
        listRule:
          "@request.auth.id != '' && (@request.auth.role = 'admin' || parceiro_id.usuario = @request.auth.id)",
        viewRule:
          "@request.auth.id != '' && (@request.auth.role = 'admin' || parceiro_id.usuario = @request.auth.id)",
        createRule: "@request.auth.id != '' && @request.auth.role = 'admin'",
        updateRule: "@request.auth.id != '' && @request.auth.role = 'admin'",
        deleteRule: "@request.auth.id != '' && @request.auth.role = 'admin'",
        fields: [
          {
            name: 'cobranca_id',
            type: 'relation',
            required: true,
            collectionId: cobrancasCol.id,
            cascadeDelete: false,
            maxSelect: 1,
          },
          {
            name: 'parceiro_id',
            type: 'relation',
            required: true,
            collectionId: parceirosCol.id,
            cascadeDelete: false,
            maxSelect: 1,
          },
          { name: 'base_calculo', type: 'number', required: true },
          { name: 'percentual_aplicado', type: 'number', required: true },
          { name: 'valor', type: 'number', required: true },
          {
            name: 'status',
            type: 'select',
            required: true,
            values: ['calculada', 'paga'],
            maxSelect: 1,
          },
          { name: 'data_pagamento', type: 'text' },
          { name: 'comprovante', type: 'text' },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_comissoes_cobranca ON comissoes (cobranca_id)',
          'CREATE INDEX idx_comissoes_parceiro ON comissoes (parceiro_id)',
          'CREATE INDEX idx_comissoes_status ON comissoes (status)',
        ],
      })
      app.save(comissoesCol)
    }

    // 4. Inserir parceiro institucional exemplo (ACP Paraná / Fomento Verde)
    try {
      const pCol = app.findCollectionByNameOrId('parceiros')
      const pCode = 'ORB-PAR-1001'
      try {
        app.findFirstRecordByData('parceiros', 'codigo_parceiro', pCode)
      } catch (_) {
        const adminUser = app.findAuthRecordByEmail('_pb_users_auth_', 'maurog1@hotmail.com')
        const rec = new Record(pCol)
        rec.set('codigo_parceiro', pCode)
        rec.set('nome', 'Rede de Afiliados ACP Paraná & Peritos')
        rec.set('cpf_cnpj', '76.123.456/0001-99')
        rec.set('contato', 'parcerias@orbisprotocol.org')
        rec.set('percentual_comissao', 10) // 10%
        rec.set('banco', '001 - Banco do Brasil')
        rec.set('agencia', '1234-5')
        rec.set('conta', '98765-4')
        rec.set('chave_pix', 'parcerias@orbisprotocol.org')
        rec.set('status', 'ativo')
        rec.set('usuario', adminUser.id)
        app.save(rec)
      }
    } catch (eSeed) {
      console.log('Aviso seed parceiro:', eSeed)
    }
  },
  (app) => {
    try {
      const c = app.findCollectionByNameOrId('comissoes')
      app.delete(c)
    } catch (_) {}
    try {
      const p = app.findCollectionByNameOrId('parceiros')
      app.delete(p)
    } catch (_) {}
  },
)
