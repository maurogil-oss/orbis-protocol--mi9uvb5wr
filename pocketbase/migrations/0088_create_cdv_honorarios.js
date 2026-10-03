/**
 * MIGRATION 0088: COLEÇÃO CDV_HONORARIOS (TABELA DE HONORÁRIOS DE PERITOS CONFIGURÁVEL)
 *
 * Requisito: Módulo de Honorários de Peritos configurável
 * "sobre o valor dos honorários, temos que ter uma forma de ajustar o valor conforme o mercado,
 * e como temos tipos de peritos precisamos ter uma forma que permita este modelo."
 *
 * 1. Cria coleção cdv_honorarios:
 *    - tipo_perito (select: CREA, CAU, CFT, CRC, CRQ, CRBio, OUTRO)
 *    - tipo_laudo (text / select: laudo_lote_cdverde, atestado_orbis_verificacao, auditoria_f6_reproducao, parecer_sbce, inventario_ghg_dmrv)
 *    - titulo_laudo (text, nome descritivo para exibição pública)
 *    - valor_base (number, BRL)
 *    - unidade (text: "por laudo", "por lote", "por hora", "por parecer")
 *    - vigencia_inicio (text / date)
 *    - vigencia_fim (text, opcional)
 *    - ativo (bool, opcional, padrão false/true)
 *    - observacoes (text)
 *    - atualizado_por (relation -> users, opcional)
 *    - created, updated (autodate)
 *
 * 2. Regras de Acesso (RLS):
 *    - listRule: "" (leitura pública da tabela vigente)
 *    - viewRule: "" (leitura pública)
 *    - createRule: "@request.auth.id != '' && (@request.auth.role = 'master' || @request.auth.role = 'admin')"
 *    - updateRule: "@request.auth.id != '' && (@request.auth.role = 'master' || @request.auth.role = 'admin')"
 *    - deleteRule: "@request.auth.id != '' && (@request.auth.role = 'master' || @request.auth.role = 'admin')"
 *
 * 3. Seed inicial idempotente com a tabela de honorários de referência de mercado.
 */

migrate(
  (app) => {
    let col
    try {
      col = app.findCollectionByNameOrId('cdv_honorarios')
    } catch (_) {
      const usersColId = '_pb_users_auth_'

      col = new Collection({
        name: 'cdv_honorarios',
        type: 'base',
        listRule: '',
        viewRule: '',
        createRule:
          "@request.auth.id != '' && (@request.auth.role = 'master' || @request.auth.role = 'admin')",
        updateRule:
          "@request.auth.id != '' && (@request.auth.role = 'master' || @request.auth.role = 'admin')",
        deleteRule:
          "@request.auth.id != '' && (@request.auth.role = 'master' || @request.auth.role = 'admin')",
        fields: [
          {
            name: 'tipo_perito',
            type: 'select',
            required: true,
            values: ['CREA', 'CAU', 'CFT', 'CRC', 'CRQ', 'CRBio', 'OUTRO'],
            maxSelect: 1,
          },
          {
            name: 'tipo_laudo',
            type: 'text',
            required: true,
          },
          {
            name: 'titulo_laudo',
            type: 'text',
            required: true,
          },
          {
            name: 'valor_base',
            type: 'number',
            required: true,
            min: 0,
          },
          {
            name: 'unidade',
            type: 'text',
            required: true,
          },
          {
            name: 'vigencia_inicio',
            type: 'text',
            required: true,
          },
          {
            name: 'vigencia_fim',
            type: 'text',
          },
          {
            name: 'ativo',
            type: 'bool',
          },
          {
            name: 'observacoes',
            type: 'text',
          },
          {
            name: 'atualizado_por',
            type: 'relation',
            collectionId: usersColId,
            maxSelect: 1,
            cascadeDelete: false,
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
        indexes: [
          'CREATE INDEX idx_cdv_honorarios_vigencia ON cdv_honorarios (ativo, tipo_perito, tipo_laudo)',
        ],
      })
      app.save(col)
    }

    // Seed inicial idempotente de honorários de mercado
    try {
      const count = app.countRecords('cdv_honorarios')
      if (count === 0) {
        let masterUser = null
        try {
          masterUser = app.findAuthRecordByEmail('_pb_users_auth_', 'maurog1@hotmail.com')
        } catch (_) {}

        const honorariosCol = app.findCollectionByNameOrId('cdv_honorarios')
        const hojeIso = new Date().toISOString().slice(0, 10)

        const seeds = [
          {
            tipo_perito: 'CREA',
            tipo_laudo: 'laudo_lote_cdverde',
            titulo_laudo: 'Laudo Pericial de Lote CDVerde (Desmontagem & Circularidade)',
            valor_base: 850.0,
            unidade: 'por lote',
            vigencia_inicio: '2025-01-01',
            ativo: true,
            observacoes:
              'Aferição física e documental de peças desmontadas, rastreabilidade QR Code e ART acoplada.',
          },
          {
            tipo_perito: 'CREA',
            tipo_laudo: 'atestado_orbis_verificacao',
            titulo_laudo: 'Atestado Orbis (com ART/RRT) — Verificação dMRV e Conformidade',
            valor_base: 1450.0,
            unidade: 'por laudo',
            vigencia_inicio: '2025-01-01',
            ativo: true,
            observacoes:
              'Verificação pericial de balanço de massa, fatores de emissão oficiais e anotação de responsabilidade técnica.',
          },
          {
            tipo_perito: 'CREA',
            tipo_laudo: 'auditoria_f6_reproducao',
            titulo_laudo: 'Auditoria F6 — Reprodução de Cálculo Metodológico e Amostragem',
            valor_base: 2200.0,
            unidade: 'por lote',
            vigencia_inicio: '2025-01-01',
            ativo: true,
            observacoes:
              'Reprodução analítica independente sem motor proprietário conforme DM-ORB-001 v1.1 §6.3.',
          },
          {
            tipo_perito: 'CRC',
            tipo_laudo: 'atestado_orbis_verificacao',
            titulo_laudo: 'Atestado Orbis Contábil — Inventário GHG e Conformidade Tributária',
            valor_base: 1250.0,
            unidade: 'por laudo',
            vigencia_inicio: '2025-01-01',
            ativo: true,
            observacoes:
              'Conciliação contábil-fiscal SPED/NF-e, créditos tributários de circularidade e conformidade NBC TO 3000.',
          },
          {
            tipo_perito: 'CFT',
            tipo_laudo: 'laudo_lote_cdverde',
            titulo_laudo: 'Laudo Pericial de Lote CDVerde (Técnico Industrial TRT)',
            valor_base: 650.0,
            unidade: 'por lote',
            vigencia_inicio: '2025-01-01',
            ativo: true,
            observacoes:
              'Aferição técnica mecânica/automotiva e rastreabilidade no pátio com Termo de Responsabilidade Técnica (TRT).',
          },
          {
            tipo_perito: 'CRQ',
            tipo_laudo: 'atestado_orbis_verificacao',
            titulo_laudo: 'Atestado Orbis — Descontaminação de Fluidos & Emissões Fugitivas',
            valor_base: 1100.0,
            unidade: 'por laudo',
            vigencia_inicio: '2025-01-01',
            ativo: true,
            observacoes:
              'Validação de recuperação de gases halogenados (R-134a/R-1234yf), descarte de óleos perigosos e ART química.',
          },
          {
            tipo_perito: 'CAU',
            tipo_laudo: 'atestado_orbis_verificacao',
            titulo_laudo: 'Atestado Orbis — Avaliação de Adequação de Instalações e Galpões CDV',
            valor_base: 1350.0,
            unidade: 'por laudo',
            vigencia_inicio: '2025-01-01',
            ativo: true,
            observacoes:
              'Inspeção arquitetônica de pisos impermeabilizados, bacias de contenção e áreas de segregação com RRT.',
          },
        ]

        for (const s of seeds) {
          const rec = new Record(honorariosCol)
          rec.set('tipo_perito', s.tipo_perito)
          rec.set('tipo_laudo', s.tipo_laudo)
          rec.set('titulo_laudo', s.titulo_laudo)
          rec.set('valor_base', s.valor_base)
          rec.set('unidade', s.unidade)
          rec.set('vigencia_inicio', s.vigencia_inicio)
          rec.set('vigencia_fim', '')
          rec.set('ativo', s.ativo)
          rec.set('observacoes', s.observacoes)
          if (masterUser) {
            rec.set('atualizado_por', masterUser.id)
          }
          app.save(rec)
        }
      }
    } catch (eSeed) {
      console.log('[0088] Aviso ao semear cdv_honorarios:', eSeed)
    }
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('cdv_honorarios')
      app.delete(col)
    } catch (_) {}
  },
)
