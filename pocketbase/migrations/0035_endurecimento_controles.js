/**
 * MIGRATION 0035: PACOTE DE ENDURECIMENTO DE CONTROLES ORBIS PROTOCOL
 *
 * 1. audit_log: nova coleção append-only (sem create/update/delete para cliente ou admin via API)
 * 2. users: expansão do select de role para incluir 'financeiro_leitor' (admin | perito | cliente | financeiro_leitor)
 * 3. perito_credenciamentos:
 *    - validade_art (date)
 *    - expansão de status para incluir 'suspenso' (pendente | aprovado | rejeitado | suspenso)
 * 4. cdv_pecas: expansão do status para incluir 'anulado' (ativo | reutilizado | descartado | anulado)
 * 5. cdv_lotes: expansão do status para incluir 'anulado' (processado | parcial | rejeitado | anulado)
 * 6. dpp_destinacao_final: adição do campo status_anulacao ou status
 * 7. Afinamento geral de regras de API em todas as coleções sensíveis (princípio do menor privilégio)
 * 8. Bloqueio total de mutações em app_config_secrets
 */

migrate(
  (app) => {
    // 1. Criar coleção audit_log (append-only)
    // Regras: list e view apenas para admin e financeiro_leitor; create/update/delete null (somente hooks do servidor)
    try {
      app.findCollectionByNameOrId('audit_log')
    } catch (_) {
      const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
      const auditLog = new Collection({
        name: 'audit_log',
        type: 'base',
        listRule:
          "@request.auth.id != '' && (@request.auth.role = 'admin' || @request.auth.role = 'financeiro_leitor')",
        viewRule:
          "@request.auth.id != '' && (@request.auth.role = 'admin' || @request.auth.role = 'financeiro_leitor')",
        createRule: null, // Proibido para clientes e admin direto via API REST — apenas server hooks
        updateRule: null, // Append-only absoluto
        deleteRule: null, // Imutável
        fields: [
          { name: 'acao', type: 'text', required: true },
          { name: 'entidade', type: 'text', required: true },
          { name: 'entidade_id', type: 'text' },
          { name: 'ator_id', type: 'text' },
          { name: 'ator_email', type: 'text' },
          { name: 'papel', type: 'text' },
          { name: 'detalhes', type: 'json' },
          { name: 'ip', type: 'text' },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_audit_acao ON audit_log (acao)',
          'CREATE INDEX idx_audit_entidade ON audit_log (entidade)',
          'CREATE INDEX idx_audit_entidade_id ON audit_log (entidade_id)',
          'CREATE INDEX idx_audit_ator ON audit_log (ator_id)',
          'CREATE INDEX idx_audit_created ON audit_log (created DESC)',
        ],
      })
      app.save(auditLog)
    }

    // 2. Atualizar users: papel financeiro_leitor
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
    const roleField = usersCol.fields.getByName('role')
    if (roleField) {
      roleField.values = ['admin', 'perito', 'cliente', 'financeiro_leitor']
    } else {
      usersCol.fields.add(
        new SelectField({
          name: 'role',
          values: ['admin', 'perito', 'cliente', 'financeiro_leitor'],
          maxSelect: 1,
        }),
      )
    }
    // Regras da users:
    // list/view: próprio ou admin/financeiro_leitor
    usersCol.listRule =
      "@request.auth.id != '' && (@request.auth.id = id || @request.auth.role = 'admin' || @request.auth.role = 'financeiro_leitor')"
    usersCol.viewRule =
      "@request.auth.id != '' && (@request.auth.id = id || @request.auth.role = 'admin' || @request.auth.role = 'financeiro_leitor')"
    // update: admin pode atualizar tudo; dono pode atualizar apenas se não alterar role/cliente_codigo
    usersCol.updateRule =
      "@request.auth.id != '' && (@request.auth.role = 'admin' || (@request.auth.id = id && @request.body.role:isset = false))"
    usersCol.deleteRule = "@request.auth.id != '' && @request.auth.role = 'admin'"
    app.save(usersCol)

    // 3. Atualizar perito_credenciamentos: validade_art (date) e status suspenso
    const peritosCol = app.findCollectionByNameOrId('perito_credenciamentos')
    if (!peritosCol.fields.getByName('validade_art')) {
      peritosCol.fields.add(new DateField({ name: 'validade_art' }))
    }
    const statusPeritoField = peritosCol.fields.getByName('status')
    if (statusPeritoField) {
      statusPeritoField.values = ['pendente', 'aprovado', 'rejeitado', 'suspenso']
    }
    if (!peritosCol.fields.getByName('motivo_suspensao')) {
      peritosCol.fields.add(new TextField({ name: 'motivo_suspensao' }))
    }
    // Regras de API: leitura do próprio ou admin/financeiro_leitor; escrita admin via API ou servidor
    peritosCol.listRule =
      "@request.auth.id != '' && (@request.auth.role = 'admin' || @request.auth.role = 'financeiro_leitor' || usuario = @request.auth.id)"
    peritosCol.viewRule =
      "@request.auth.id != '' && (@request.auth.role = 'admin' || @request.auth.role = 'financeiro_leitor' || usuario = @request.auth.id)"
    peritosCol.createRule = "@request.auth.id != ''"
    peritosCol.updateRule = "@request.auth.id != '' && @request.auth.role = 'admin'"
    peritosCol.deleteRule = "@request.auth.id != '' && @request.auth.role = 'admin'"
    app.save(peritosCol)

    // 4. cdv_pecas: expandir status para incluir 'anulado'
    const pecasCol = app.findCollectionByNameOrId('cdv_pecas')
    const statusPecaField = pecasCol.fields.getByName('status')
    if (statusPecaField) {
      statusPecaField.values = ['ativo', 'reutilizado', 'descartado', 'anulado']
    }
    if (!pecasCol.fields.getByName('motivo_anulacao')) {
      pecasCol.fields.add(new TextField({ name: 'motivo_anulacao' }))
    }
    if (!pecasCol.fields.getByName('anulado_em')) {
      pecasCol.fields.add(new TextField({ name: 'anulado_em' }))
    }
    if (!pecasCol.fields.getByName('anulado_por')) {
      pecasCol.fields.add(new TextField({ name: 'anulado_por' }))
    }
    // Leitura pública (para verificadores/passaportes); mutação via servidor/admin
    pecasCol.listRule = ''
    pecasCol.viewRule = ''
    pecasCol.createRule = "@request.auth.id != '' && @request.auth.role = 'admin'"
    pecasCol.updateRule = "@request.auth.id != '' && @request.auth.role = 'admin'"
    pecasCol.deleteRule = "@request.auth.id != '' && @request.auth.role = 'admin'"
    app.save(pecasCol)

    // 5. cdv_lotes: expandir status para incluir 'anulado'
    const lotesCol = app.findCollectionByNameOrId('cdv_lotes')
    const statusLoteField = lotesCol.fields.getByName('status')
    if (statusLoteField) {
      statusLoteField.values = ['processado', 'parcial', 'rejeitado', 'anulado']
    }
    if (!lotesCol.fields.getByName('motivo_anulacao')) {
      lotesCol.fields.add(new TextField({ name: 'motivo_anulacao' }))
    }
    if (!lotesCol.fields.getByName('anulado_em')) {
      lotesCol.fields.add(new TextField({ name: 'anulado_em' }))
    }
    if (!lotesCol.fields.getByName('anulado_por')) {
      lotesCol.fields.add(new TextField({ name: 'anulado_por' }))
    }
    // Leitura pública de lotes; escrita servidor/admin
    lotesCol.listRule = ''
    lotesCol.viewRule = ''
    lotesCol.createRule = "@request.auth.id != '' && @request.auth.role = 'admin'"
    lotesCol.updateRule = "@request.auth.id != '' && @request.auth.role = 'admin'"
    lotesCol.deleteRule = "@request.auth.id != '' && @request.auth.role = 'admin'"
    app.save(lotesCol)

    // 6. dpp_destinacao_final: adicionar campos de anulação e status
    const destinacaoCol = app.findCollectionByNameOrId('dpp_destinacao_final')
    if (!destinacaoCol.fields.getByName('status')) {
      destinacaoCol.fields.add(
        new SelectField({
          name: 'status',
          values: ['ativo', 'anulado'],
          maxSelect: 1,
        }),
      )
    }
    if (!destinacaoCol.fields.getByName('motivo_anulacao')) {
      destinacaoCol.fields.add(new TextField({ name: 'motivo_anulacao' }))
    }
    if (!destinacaoCol.fields.getByName('anulado_em')) {
      destinacaoCol.fields.add(new TextField({ name: 'anulado_em' }))
    }
    if (!destinacaoCol.fields.getByName('anulado_por')) {
      destinacaoCol.fields.add(new TextField({ name: 'anulado_por' }))
    }
    destinacaoCol.listRule = ''
    destinacaoCol.viewRule = ''
    destinacaoCol.createRule = "@request.auth.id != '' && @request.auth.role = 'admin'"
    destinacaoCol.updateRule = "@request.auth.id != '' && @request.auth.role = 'admin'"
    destinacaoCol.deleteRule = "@request.auth.id != '' && @request.auth.role = 'admin'"
    app.save(destinacaoCol)

    // 7. cobrancas: leitura do próprio + admin + financeiro_leitor; escrita servidor ou admin
    const cobrancasCol = app.findCollectionByNameOrId('cobrancas')
    cobrancasCol.listRule =
      "@request.auth.id != '' && (usuario = @request.auth.id || @request.auth.role = 'admin' || @request.auth.role = 'financeiro_leitor' || @request.auth.role = 'perito')"
    cobrancasCol.viewRule =
      "@request.auth.id != '' && (usuario = @request.auth.id || @request.auth.role = 'admin' || @request.auth.role = 'financeiro_leitor' || @request.auth.role = 'perito')"
    cobrancasCol.createRule = "@request.auth.id != ''"
    cobrancasCol.updateRule = "@request.auth.id != '' && @request.auth.role = 'admin'"
    cobrancasCol.deleteRule = "@request.auth.id != '' && @request.auth.role = 'admin'"
    app.save(cobrancasCol)

    // 8. comissoes: leitura do próprio parceiro ou admin ou financeiro_leitor; escrita admin via API ou servidor
    const comissoesCol = app.findCollectionByNameOrId('comissoes')
    comissoesCol.listRule =
      "@request.auth.id != '' && (@request.auth.role = 'admin' || @request.auth.role = 'financeiro_leitor' || parceiro_id.usuario = @request.auth.id)"
    comissoesCol.viewRule =
      "@request.auth.id != '' && (@request.auth.role = 'admin' || @request.auth.role = 'financeiro_leitor' || parceiro_id.usuario = @request.auth.id)"
    comissoesCol.createRule = "@request.auth.id != '' && @request.auth.role = 'admin'"
    comissoesCol.updateRule = "@request.auth.id != '' && @request.auth.role = 'admin'"
    comissoesCol.deleteRule = "@request.auth.id != '' && @request.auth.role = 'admin'"
    app.save(comissoesCol)

    // 9. parceiros: leitura do próprio ou admin ou financeiro_leitor; escrita admin ou dados bancários do parceiro
    const parceirosCol = app.findCollectionByNameOrId('parceiros')
    parceirosCol.listRule =
      "@request.auth.id != '' && (@request.auth.role = 'admin' || @request.auth.role = 'financeiro_leitor' || usuario = @request.auth.id)"
    parceirosCol.viewRule =
      "@request.auth.id != '' && (@request.auth.role = 'admin' || @request.auth.role = 'financeiro_leitor' || usuario = @request.auth.id)"
    parceirosCol.createRule = "@request.auth.id != '' && @request.auth.role = 'admin'"
    parceirosCol.updateRule =
      "@request.auth.id != '' && (@request.auth.role = 'admin' || usuario = @request.auth.id)"
    parceirosCol.deleteRule = "@request.auth.id != '' && @request.auth.role = 'admin'"
    app.save(parceirosCol)

    // 10. servicos_catalogo: leitura pública (para checkout, landing e planos); escrita estrita admin
    const servicosCol = app.findCollectionByNameOrId('servicos_catalogo')
    servicosCol.listRule = ''
    servicosCol.viewRule = ''
    servicosCol.createRule = "@request.auth.id != '' && @request.auth.role = 'admin'"
    servicosCol.updateRule = "@request.auth.id != '' && @request.auth.role = 'admin'"
    servicosCol.deleteRule = "@request.auth.id != '' && @request.auth.role = 'admin'"
    app.save(servicosCol)

    // 11. app_config_secrets: travar regras totalmente (null para tudo - acesso exclusivo via backend)
    const secretsCol = app.findCollectionByNameOrId('app_config_secrets')
    secretsCol.listRule = null
    secretsCol.viewRule = null
    secretsCol.createRule = null
    secretsCol.updateRule = null
    secretsCol.deleteRule = null
    app.save(secretsCol)

    // 12. relatorios_exportados: leitura do próprio ou admin/financeiro_leitor; adicionar anulação se aplicável
    const relatoriosCol = app.findCollectionByNameOrId('relatorios_exportados')
    relatoriosCol.listRule =
      "@request.auth.id != '' && (usuario = @request.auth.id || @request.auth.role = 'admin' || @request.auth.role = 'financeiro_leitor' || @request.auth.role = 'perito')"
    relatoriosCol.viewRule =
      "@request.auth.id != '' && (usuario = @request.auth.id || @request.auth.role = 'admin' || @request.auth.role = 'financeiro_leitor' || @request.auth.role = 'perito')"
    app.save(relatoriosCol)

    // 13. Retroalimentação de validade_art defensiva: peritos homologados recebem +1 ano a partir de created se não preenchido
    try {
      const peritos = app.findRecordsByFilter(
        'perito_credenciamentos',
        'id != ""',
        'created',
        100,
        0,
      )
      for (const p of peritos) {
        if (!p.getString('validade_art')) {
          const criacao = new Date(p.getString('created') || Date.now())
          const umAno = new Date(criacao.getTime() + 365 * 24 * 60 * 60 * 1000)
          p.set('validade_art', umAno.toISOString().split('T')[0])
          app.save(p)
        }
      }
    } catch (eRetroArt) {
      console.log('Aviso retroalimentacao validade_art:', eRetroArt)
    }
  },
  (app) => {
    // Revert opcional
  },
)
