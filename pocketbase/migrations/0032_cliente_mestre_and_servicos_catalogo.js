/**
 * MIGRATION 0032: CADASTRO-MESTRE DE CLIENTE & SERVICOS_CATALOGO
 *
 * (1) Adiciona campos em users:
 *     - cliente_codigo: text (formato ORB-CLI-XXXX gerado na primeira contratação)
 *     - cnpj: text
 *     - plano_ativo: text
 *     - assinatura_status: text
 *     - assinatura_renovacao: text
 *     - retroalimentar contas existentes a partir de leads/cobranças
 *
 * (2) Cria coleção servicos_catalogo:
 *     - nome: text (required)
 *     - servico_id: text (required, unique)
 *     - descricao: text
 *     - preco: number (required)
 *     - tipo: select ['avulso', 'recorrente'] (required)
 *     - ativo: bool
 *     - ordem: number
 *     - RLS: list/view público ("") para /planos e /checkout poderem ler preços; escrita apenas admin
 *     - Popula os 3 produtos reais: Essencial R$ 490 (avulso), MOVER R$ 2.850 (avulso), Corporativo R$ 7.800 (recorrente)
 */

migrate(
  (app) => {
    // 1. Atualizar users
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
    if (!usersCol.fields.getByName('cliente_codigo')) {
      usersCol.fields.add(new TextField({ name: 'cliente_codigo' }))
    }
    if (!usersCol.fields.getByName('cnpj')) {
      usersCol.fields.add(new TextField({ name: 'cnpj' }))
    }
    if (!usersCol.fields.getByName('plano_ativo')) {
      usersCol.fields.add(new TextField({ name: 'plano_ativo' }))
    }
    if (!usersCol.fields.getByName('assinatura_status')) {
      usersCol.fields.add(new TextField({ name: 'assinatura_status' }))
    }
    if (!usersCol.fields.getByName('assinatura_renovacao')) {
      usersCol.fields.add(new TextField({ name: 'assinatura_renovacao' }))
    }
    app.save(usersCol)

    // Retroalimentar contas existentes a partir de leads_diagnostico / cobrancas
    try {
      const usersList = app.findRecordsByFilter('users', 'id != ""', 'created', 100, 0)
      for (const u of usersList) {
        let changed = false
        // Se ainda não tem cliente_codigo, gerar
        if (!u.getString('cliente_codigo')) {
          const randSuffix = Math.floor(1000 + Math.random() * 9000)
          u.set('cliente_codigo', `ORB-CLI-${randSuffix}`)
          changed = true
        }

        // Tentar obter CNPJ a partir de leads_diagnostico associado a este usuario
        if (!u.getString('cnpj')) {
          try {
            const lead = app.findFirstRecordByData('leads_diagnostico', 'usuario', u.id)
            if (lead && lead.getString('cnpj')) {
              u.set('cnpj', lead.getString('cnpj'))
              changed = true
            }
          } catch (_) {}
        }

        // Se for admin maurog1@hotmail.com e não tem cnpj, associar da MGM
        if (u.getString('email') === 'maurog1@hotmail.com' && !u.getString('cnpj')) {
          u.set('cnpj', '19.598.964/0001-01')
          u.set('plano_ativo', 'corporativo')
          u.set('assinatura_status', 'ativa')
          u.set('assinatura_renovacao', '2027-03-01')
          changed = true
        }

        if (changed) {
          app.save(u)
        }
      }
    } catch (err) {
      console.log('Aviso retroalimentacao users:', err)
    }

    // 2. Criar coleção servicos_catalogo
    try {
      app.findCollectionByNameOrId('servicos_catalogo')
    } catch (_) {
      const catalogoCol = new Collection({
        name: 'servicos_catalogo',
        type: 'base',
        listRule: '', // Público para exibição em /planos e /checkout
        viewRule: '', // Público
        createRule: "@request.auth.id != '' && @request.auth.role = 'admin'",
        updateRule: "@request.auth.id != '' && @request.auth.role = 'admin'",
        deleteRule: "@request.auth.id != '' && @request.auth.role = 'admin'",
        fields: [
          { name: 'nome', type: 'text', required: true },
          { name: 'servico_id', type: 'text', required: true },
          { name: 'descricao', type: 'text' },
          { name: 'preco', type: 'number', required: true },
          {
            name: 'tipo',
            type: 'select',
            required: true,
            values: ['avulso', 'recorrente'],
            maxSelect: 1,
          },
          { name: 'ativo', type: 'bool' },
          { name: 'ordem', type: 'number', onlyInt: true },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE UNIQUE INDEX idx_servicos_cat_id ON servicos_catalogo (servico_id)',
          'CREATE INDEX idx_servicos_cat_ordem ON servicos_catalogo (ordem)',
        ],
      })
      app.save(catalogoCol)

      // Seed dos 3 produtos reais
      const produtosReais = [
        {
          nome: 'Diagnóstico Orbis (Essencial)',
          servico_id: 'diagnostico',
          descricao:
            'Primeiro resultado prévio validado por CNPJ com Hash de integridade criptográfica dMRV e Selo Oficial.',
          preco: 490,
          tipo: 'avulso',
          ativo: true,
          ordem: 1,
        },
        {
          nome: 'Laudo Pericial com ART (MOVER)',
          servico_id: 'laudo_pericial',
          descricao:
            'Chancela de perito homologado com ART/RRT acoplada, laudo NBC TO 3000 do CFC e dossiê para créditos MOVER.',
          preco: 2850,
          tipo: 'avulso',
          ativo: true,
          ordem: 2,
        },
        {
          nome: 'Bureau ACP (Corporativo)',
          servico_id: 'assinatura_bureau',
          descricao:
            'Gestão contínua, passaportes do fornecedor com revelação seletiva, dossiê contínuo BRDE/fomento e curva MAC.',
          preco: 7800,
          tipo: 'recorrente',
          ativo: true,
          ordem: 3,
        },
      ]

      for (const prod of produtosReais) {
        try {
          app.findFirstRecordByData('servicos_catalogo', 'servico_id', prod.servico_id)
        } catch (_) {
          const rec = new Record(catalogoCol)
          rec.set('nome', prod.nome)
          rec.set('servico_id', prod.servico_id)
          rec.set('descricao', prod.descricao)
          rec.set('preco', prod.preco)
          rec.set('tipo', prod.tipo)
          rec.set('ativo', prod.ativo)
          rec.set('ordem', prod.ordem)
          app.save(rec)
        }
      }
    }
  },
  (app) => {
    try {
      const cat = app.findCollectionByNameOrId('servicos_catalogo')
      app.delete(cat)
    } catch (_) {}
  },
)
