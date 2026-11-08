/**
 * MIGRATION 0121: COLEÇÃO CONVITES_ACP PARA EMPRESAS ASSOCIADAS
 *
 * 1. Cria a coleção 'convites_acp':
 *    - token (text, required, unique) - uuid/hash de convite
 *    - empresa_nome (text, required) - Razão Social / Nome da Empresa
 *    - cnpj (text, opcional) - CNPJ opcional da associada
 *    - email (email, required) - E-mail de destino do convite
 *    - status (select: 'pendente', 'usado', 'expirado', 'cancelado', default: 'pendente')
 *    - expira_em (date, required) - Data limite (padrão 7 dias)
 *    - usado_em (date, opcional) - Data em que o cadastro foi concluído
 *    - usuario_criado (relation users, opcional) - Conta criada a partir deste convite
 *    - criado_por (relation users, opcional) - admin_acp ou master que gerou o convite
 *    - observacoes (text, opcional) - Notas ou identificadores ACP adicionais
 *    - created, updated (autodate)
 *
 * 2. Regras de Acesso:
 *    - list/view: admin_acp, admin ou master podem ver todos;
 *                 leitura pública pontual pelo token ocorre via hook backend seguro /backend/v1/acp/convites/validar/{token}
 *    - create/update/delete: admin_acp, admin ou master (ou gerenciado via hook seguro)
 */

migrate(
  (app) => {
    try {
      let usersColId = '_pb_users_auth_'
      try {
        const uCol = app.findCollectionByNameOrId('_pb_users_auth_')
        if (uCol) usersColId = uCol.id
      } catch (_) {}

      // Cria a coleção convites_acp
      const convitesCol = new Collection({
        name: 'convites_acp',
        type: 'base',
        // list / view para administradores da ACP, admin e master
        listRule:
          "@request.auth.id != '' && (@request.auth.role = 'admin_acp' || @request.auth.role = 'admin' || @request.auth.role = 'master')",
        viewRule:
          "@request.auth.id != '' && (@request.auth.role = 'admin_acp' || @request.auth.role = 'admin' || @request.auth.role = 'master')",
        createRule:
          "@request.auth.id != '' && (@request.auth.role = 'admin_acp' || @request.auth.role = 'admin' || @request.auth.role = 'master')",
        updateRule:
          "@request.auth.id != '' && (@request.auth.role = 'admin_acp' || @request.auth.role = 'admin' || @request.auth.role = 'master')",
        deleteRule:
          "@request.auth.id != '' && (@request.auth.role = 'admin_acp' || @request.auth.role = 'admin' || @request.auth.role = 'master')",
        fields: [
          { name: 'token', type: 'text', required: true },
          { name: 'empresa_nome', type: 'text', required: true },
          { name: 'cnpj', type: 'text' },
          { name: 'email', type: 'email', required: true },
          {
            name: 'status',
            type: 'select',
            required: true,
            values: ['pendente', 'usado', 'expirado', 'cancelado'],
            maxSelect: 1,
          },
          { name: 'expira_em', type: 'date', required: true },
          { name: 'usado_em', type: 'date' },
          {
            name: 'usuario_criado',
            type: 'relation',
            collectionId: usersColId,
            maxSelect: 1,
            cascadeDelete: false,
          },
          {
            name: 'criado_por',
            type: 'relation',
            collectionId: usersColId,
            maxSelect: 1,
            cascadeDelete: false,
          },
          { name: 'observacoes', type: 'text' },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE UNIQUE INDEX idx_convites_acp_token ON convites_acp (token)',
          'CREATE INDEX idx_convites_acp_status_email ON convites_acp (status, email)',
        ],
      })

      app.save(convitesCol)
      console.log('[Migration 0121] Coleção convites_acp criada com sucesso.')
    } catch (err) {
      console.log('[Migration 0121] Aviso ao criar convites_acp:', err)
    }
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('convites_acp')
      if (col) {
        app.delete(col)
      }
    } catch (_) {}
  },
)
