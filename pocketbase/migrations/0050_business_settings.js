/**
 * MIGRATION 0050: COLEÇÃO BUSINESS_SETTINGS (PARÂMETROS DO NEGÓCIO)
 *
 * 1. Cria coleção business_settings:
 *    - limite_four_eyes (number, min: 0)
 *    - comissao_acp_percent (number, min: 0, max: 100)
 *    - comissao_parceiro_percent (number, min: 0, max: 100)
 *    - precos_planos (json: { diagnostico: number, laudo_pericial: number, assinatura_bureau: number })
 *    - atualizado_por (relation -> users, opcional)
 *    - atualizado_em (text / timestamp ISO)
 *    - created, updated (autodate)
 *
 * 2. Regras de Acesso (RLS):
 *    - listRule & viewRule: master, admin, controller (controller somente leitura)
 *    - createRule, updateRule, deleteRule: apenas master
 *
 * 3. Seed inicial idempotente com os valores atuais vigentes no código:
 *    - limite_four_eyes: 5000
 *    - comissao_acp_percent: 10
 *    - comissao_parceiro_percent: 10
 *    - precos_planos: { diagnostico: 490, laudo_pericial: 2850, assinatura_bureau: 7800 }
 *    - atualizado_por: usuário maurog1@hotmail.com (master) se existir
 */

migrate(
  (app) => {
    let col
    try {
      col = app.findCollectionByNameOrId('business_settings')
    } catch (_) {
      const usersColId = '_pb_users_auth_'

      col = new Collection({
        name: 'business_settings',
        type: 'base',
        // list/view: master, admin, controller
        listRule:
          "@request.auth.id != '' && (@request.auth.role = 'master' || @request.auth.role = 'admin' || @request.auth.role = 'controller')",
        viewRule:
          "@request.auth.id != '' && (@request.auth.role = 'master' || @request.auth.role = 'admin' || @request.auth.role = 'controller')",
        // create/update/delete: estritamente master
        createRule: "@request.auth.id != '' && @request.auth.role = 'master'",
        updateRule: "@request.auth.id != '' && @request.auth.role = 'master'",
        deleteRule: "@request.auth.id != '' && @request.auth.role = 'master'",
        fields: [
          {
            name: 'limite_four_eyes',
            type: 'number',
            required: true,
            min: 0,
          },
          {
            name: 'comissao_acp_percent',
            type: 'number',
            required: true,
            min: 0,
            max: 100,
          },
          {
            name: 'comissao_parceiro_percent',
            type: 'number',
            required: true,
            min: 0,
            max: 100,
          },
          {
            name: 'precos_planos',
            type: 'json',
            required: true,
          },
          {
            name: 'atualizado_por',
            type: 'relation',
            collectionId: usersColId,
            maxSelect: 1,
            cascadeDelete: false,
          },
          {
            name: 'atualizado_em',
            type: 'text',
          },
          {
            name: 'created',
            type: 'autodate',
            onCreate: true,
            onUpdate: false,
          },
          {
            name: 'updated',
            type: 'autodate',
            onCreate: true,
            onUpdate: true,
          },
        ],
      })
      app.save(col)
    }

    // Seed inicial idempotente
    try {
      const count = app.countRecords('business_settings')
      if (count === 0) {
        let masterUser = null
        try {
          masterUser = app.findAuthRecordByEmail('_pb_users_auth_', 'maurog1@hotmail.com')
        } catch (_) {}

        const bCol = app.findCollectionByNameOrId('business_settings')
        const rec = new Record(bCol)
        rec.set('limite_four_eyes', 5000)
        rec.set('comissao_acp_percent', 10)
        rec.set('comissao_parceiro_percent', 10)
        rec.set('precos_planos', {
          diagnostico: 490,
          laudo_pericial: 2850,
          assinatura_bureau: 7800,
        })
        if (masterUser) {
          rec.set('atualizado_por', masterUser.id)
        }
        rec.set('atualizado_em', new Date().toISOString())
        app.save(rec)
      }
    } catch (eSeed) {
      console.log('Aviso ao semear business_settings:', eSeed)
    }
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('business_settings')
      app.delete(col)
    } catch (_) {}
  },
)
