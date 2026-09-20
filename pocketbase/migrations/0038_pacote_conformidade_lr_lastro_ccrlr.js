/**
 * MIGRATION 0038: PACOTE DE CONFORMIDADE — LR DECRETO 11.413/2023,
 * CERTIFICAÇÃO DE LASTRO DE CIRCULARIDADE E CCRLR INTEROPERABILIDADE SINIR
 *
 * 1. Campo de taxonomia LR Decreto 11.413/2023 em:
 *    - dpp_destinacao_final: lr_decreto_11413 (sujeito_lr_11413 vs convencional), lr_categoria (oluc/baterias/pneus/oleos_lubrificantes/embalagens/convencional)
 *    - cdv_pecas: lr_decreto_11413 (sujeito_lr_11413 vs convencional), lr_categoria (baterias/pneus/oleos_lubrificantes/embalagens/convencional)
 *    - Retroalimentação defensiva de dados existentes via SQL / script.
 *
 * 2. Nova coleção: lastro_circularidade
 *    - Documento oficial de "Lastro de Circularidade" por período / Entidade Gestora-alvo
 *    - Prova criptográfica SHA-256 e QR verificável com página pública de conferência
 *    - Nomenclatura estrita: "lastro", nunca "certificado de reciclagem" (aviso legal obrigatório)
 *    - Campos de anulação formal (status, motivo_anulacao, anulado_em, anulado_por)
 *
 * 3. Nova coleção: ccrlr_manifestos_sinir
 *    - Acúmulo de massa reciclada/destinada por categoria de resíduo alimentado pelos manifestos MTR-SINIR
 *    - "Pronto para o SINIR" para subsidiar emissão do CCRLR pela Entidade Gestora credenciada
 */

migrate(
  (app) => {
    // -------------------------------------------------------------
    // 1. Atualizar dpp_destinacao_final com campos de taxonomia LR
    // -------------------------------------------------------------
    try {
      const colDest = app.findCollectionByNameOrId('dpp_destinacao_final')
      if (!colDest.fields.getByName('lr_decreto_11413')) {
        colDest.fields.add(
          new SelectField({
            name: 'lr_decreto_11413',
            values: ['sujeito_lr_11413', 'convencional'],
            maxSelect: 1,
            required: false,
          }),
        )
      }
      if (!colDest.fields.getByName('lr_categoria')) {
        colDest.fields.add(
          new SelectField({
            name: 'lr_categoria',
            values: [
              'oluc',
              'baterias',
              'pneus',
              'oleos_lubrificantes',
              'embalagens',
              'aco',
              'aluminio',
              'cobre',
              'polimeros',
              'outros',
            ],
            maxSelect: 1,
            required: false,
          }),
        )
      }
      app.save(colDest)
    } catch (e) {
      console.log('[Migration 0038] Aviso ao atualizar dpp_destinacao_final:', e)
    }

    // -------------------------------------------------------------
    // 2. Atualizar cdv_pecas com campos de taxonomia LR
    // -------------------------------------------------------------
    try {
      const colPecas = app.findCollectionByNameOrId('cdv_pecas')
      if (!colPecas.fields.getByName('lr_decreto_11413')) {
        colPecas.fields.add(
          new SelectField({
            name: 'lr_decreto_11413',
            values: ['sujeito_lr_11413', 'convencional'],
            maxSelect: 1,
            required: false,
          }),
        )
      }
      if (!colPecas.fields.getByName('lr_categoria')) {
        colPecas.fields.add(
          new SelectField({
            name: 'lr_categoria',
            values: [
              'oluc',
              'baterias',
              'pneus',
              'oleos_lubrificantes',
              'embalagens',
              'aco',
              'aluminio',
              'cobre',
              'polimeros',
              'outros',
            ],
            maxSelect: 1,
            required: false,
          }),
        )
      }
      app.save(colPecas)
    } catch (e) {
      console.log('[Migration 0038] Aviso ao atualizar cdv_pecas:', e)
    }

    // -------------------------------------------------------------
    // 3. Criar coleção lastro_circularidade
    // -------------------------------------------------------------
    try {
      const usersId = '_pb_users_auth_'
      const lastroCol = new Collection({
        name: 'lastro_circularidade',
        type: 'base',
        // listRule e viewRule públicas para permitir conferência pública no mesmo padrão do passaporte
        listRule: '',
        viewRule: '',
        // mutações administrativas autenticadas
        createRule: "@request.auth.id != ''",
        updateRule: "@request.auth.id != ''",
        deleteRule: null, // Proibido deletar; anulação apenas via fluxo formal
        fields: [
          { name: 'codigo_lastro', type: 'text', required: true },
          { name: 'titulo', type: 'text', required: true },
          {
            name: 'usuario',
            type: 'relation',
            collectionId: usersId,
            required: false,
            maxSelect: 1,
          },
          { name: 'cnpj_emissor', type: 'text', required: true },
          { name: 'razao_social_emissor', type: 'text', required: true },
          { name: 'entidade_gestora_alvo', type: 'text', required: true },
          { name: 'cnpj_entidade_gestora', type: 'text', required: false },
          { name: 'periodo_inicio', type: 'text', required: true },
          { name: 'periodo_fim', type: 'text', required: true },
          { name: 'ano_base', type: 'number', required: false },
          // Totalizadores de massa segregados (frações obrigatórias Decreto 11.413/2023)
          { name: 'massa_oluc_kg', type: 'number', required: false },
          { name: 'massa_baterias_kg', type: 'number', required: false },
          { name: 'massa_pneus_kg', type: 'number', required: false },
          { name: 'massa_oleos_lubrificantes_kg', type: 'number', required: false },
          { name: 'massa_embalagens_kg', type: 'number', required: false },
          { name: 'massa_total_lr_obrigatoria_kg', type: 'number', required: true },
          // Totalizador de metais e convencionais (para separação estrita)
          { name: 'massa_metais_convencionais_kg', type: 'number', required: false },
          { name: 'total_manifestos_mtr', type: 'number', required: false },
          { name: 'co2e_evitado_total_kg', type: 'number', required: false },
          // Criptografia e Verificação Pública
          { name: 'hash_sha256', type: 'text', required: true },
          { name: 'qr_code_url', type: 'text', required: false },
          {
            name: 'status',
            type: 'select',
            values: ['emitido', 'anulado'],
            maxSelect: 1,
            required: true,
          },
          { name: 'aviso_legal', type: 'text', required: true },
          { name: 'detalhes_json', type: 'json', required: false },
          // Metadados de Anulação Formal
          { name: 'motivo_anulacao', type: 'text', required: false },
          { name: 'anulado_em', type: 'text', required: false },
          { name: 'anulado_por', type: 'text', required: false },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE UNIQUE INDEX idx_lastro_codigo ON lastro_circularidade (codigo_lastro)',
          'CREATE INDEX idx_lastro_cnpj ON lastro_circularidade (cnpj_emissor)',
          'CREATE INDEX idx_lastro_status ON lastro_circularidade (status)',
          'CREATE INDEX idx_lastro_hash ON lastro_circularidade (hash_sha256)',
        ],
      })
      app.save(lastroCol)
    } catch (e) {
      console.log('[Migration 0038] Aviso ao criar lastro_circularidade:', e)
    }

    // -------------------------------------------------------------
    // 4. Criar coleção ccrlr_manifestos_sinir (interoperabilidade SINIR)
    // -------------------------------------------------------------
    try {
      const usersId = '_pb_users_auth_'
      const destId = app.findCollectionByNameOrId('dpp_destinacao_final').id
      const ccrlrCol = new Collection({
        name: 'ccrlr_manifestos_sinir',
        type: 'base',
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule: "@request.auth.id != ''",
        updateRule: "@request.auth.id != ''",
        deleteRule: null,
        fields: [
          { name: 'numero_manifesto_mtr', type: 'text', required: true },
          {
            name: 'destinacao_final',
            type: 'relation',
            collectionId: destId,
            required: false,
            maxSelect: 1,
          },
          {
            name: 'usuario',
            type: 'relation',
            collectionId: usersId,
            required: false,
            maxSelect: 1,
          },
          { name: 'cnpj_gerador', type: 'text', required: true },
          { name: 'razao_social_gerador', type: 'text', required: true },
          { name: 'cnpj_destinador', type: 'text', required: true },
          { name: 'razao_social_destinador', type: 'text', required: true },
          { name: 'nf_destinador', type: 'text', required: false },
          {
            name: 'categoria_residuo_sinir',
            type: 'select',
            values: [
              'oluc',
              'baterias_chumbo_acido',
              'pneus_inserviveis',
              'oleos_lubrificantes',
              'embalagens_contaminadas',
              'metais_ferrosos',
              'metais_nao_ferrosos',
              'polimeros_plasticos',
              'outros',
            ],
            maxSelect: 1,
            required: true,
          },
          {
            name: 'lr_decreto_11413',
            type: 'select',
            values: ['sujeito_lr_11413', 'convencional'],
            maxSelect: 1,
            required: true,
          },
          { name: 'quantidade_massa_kg', type: 'number', required: true },
          { name: 'data_recebimento_destinador', type: 'text', required: false },
          { name: 'codigo_ibama_residuo', type: 'text', required: false },
          {
            name: 'status_sinir',
            type: 'select',
            values: [
              'pronto_para_o_sinir',
              'submetido_entidade_gestora',
              'homologado_ccrlr',
              'anulado',
            ],
            maxSelect: 1,
            required: true,
          },
          { name: 'entidade_gestora_alvo', type: 'text', required: false },
          { name: 'hash_sha256', type: 'text', required: true },
          { name: 'observacoes', type: 'text', required: false },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE UNIQUE INDEX idx_ccrlr_mtr ON ccrlr_manifestos_sinir (numero_manifesto_mtr)',
          'CREATE INDEX idx_ccrlr_cnpj_ger ON ccrlr_manifestos_sinir (cnpj_gerador)',
          'CREATE INDEX idx_ccrlr_categoria ON ccrlr_manifestos_sinir (categoria_residuo_sinir)',
          'CREATE INDEX idx_ccrlr_status ON ccrlr_manifestos_sinir (status_sinir)',
        ],
      })
      app.save(ccrlrCol)
    } catch (e) {
      console.log('[Migration 0038] Aviso ao criar ccrlr_manifestos_sinir:', e)
    }

    // -------------------------------------------------------------
    // 5. Retroalimentação defensiva de dpp_destinacao_final e cdv_pecas
    // -------------------------------------------------------------
    try {
      // 5.1 dpp_destinacao_final: se tipo_fluxo ou camada indicar OLUC, bateria, pneus, fluidos
      app
        .db()
        .newQuery(`
        UPDATE dpp_destinacao_final
        SET lr_decreto_11413 = 'sujeito_lr_11413',
            lr_categoria = CASE
              WHEN LOWER(tipo_fluxo) LIKE '%oleo%' OR LOWER(tipo_fluxo) LIKE '%rlo%' THEN 'oluc'
              WHEN LOWER(tipo_fluxo) LIKE '%bateria%' THEN 'baterias'
              WHEN LOWER(tipo_fluxo) LIKE '%pneu%' THEN 'pneus'
              WHEN LOWER(tipo_fluxo) LIKE '%fluido%' THEN 'oleos_lubrificantes'
              ELSE 'oluc'
            END
        WHERE (camada = 'camada_1_gate' OR camada = 'camada_2_oleo_rlo')
           OR LOWER(tipo_fluxo) LIKE '%bateria%'
           OR LOWER(tipo_fluxo) LIKE '%pneu%'
           OR LOWER(tipo_fluxo) LIKE '%oleo%'
           OR LOWER(tipo_fluxo) LIKE '%rlo%'
      `)
        .execute()

      app
        .db()
        .newQuery(`
        UPDATE dpp_destinacao_final
        SET lr_decreto_11413 = 'convencional',
            lr_categoria = CASE
              WHEN LOWER(tipo_fluxo) LIKE '%aco%' OR LOWER(tipo_fluxo) LIKE '%carcaca%' THEN 'aco'
              WHEN LOWER(tipo_fluxo) LIKE '%aluminio%' THEN 'aluminio'
              WHEN LOWER(tipo_fluxo) LIKE '%cobre%' THEN 'cobre'
              WHEN LOWER(tipo_fluxo) LIKE '%polimero%' OR LOWER(tipo_fluxo) LIKE '%plastico%' THEN 'polimeros'
              ELSE 'outros'
            END
        WHERE (camada = 'camada_3_reciclagem')
          AND (lr_decreto_11413 IS NULL OR lr_decreto_11413 = '')
      `)
        .execute()

      // 5.2 cdv_pecas: metais convencionais e polímeros
      app
        .db()
        .newQuery(`
        UPDATE cdv_pecas
        SET lr_decreto_11413 = 'convencional',
            lr_categoria = CASE
              WHEN categoria_material = 'aco' THEN 'aco'
              WHEN categoria_material = 'aluminio' THEN 'aluminio'
              WHEN categoria_material = 'cobre' THEN 'cobre'
              WHEN categoria_material = 'polimeros' THEN 'polimeros'
              ELSE 'outros'
            END
        WHERE (lr_decreto_11413 IS NULL OR lr_decreto_11413 = '')
      `)
        .execute()
    } catch (e) {
      console.log('[Migration 0038] Aviso na retroalimentação de dados:', e)
    }
  },
  (app) => {
    try {
      const colLastro = app.findCollectionByNameOrId('lastro_circularidade')
      app.delete(colLastro)
    } catch (_) {}
    try {
      const colCcrlr = app.findCollectionByNameOrId('ccrlr_manifestos_sinir')
      app.delete(colCcrlr)
    } catch (_) {}
  },
)
