migrate(
  (app) => {
    // 1. Coleção cdv_lotes
    try {
      app.findCollectionByNameOrId('cdv_lotes')
    } catch (_) {
      const lotesCol = new Collection({
        name: 'cdv_lotes',
        type: 'base',
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule: "@request.auth.id != ''",
        updateRule: "@request.auth.id != ''",
        deleteRule: "@request.auth.id != ''",
        fields: [
          { name: 'cdv_nome', type: 'text', required: true },
          { name: 'cdv_cnpj', type: 'text', required: true },
          { name: 'cdv_codigo', type: 'text' }, // Ex.: DETRAN-PR-CDV-0089
          { name: 'api_key_hash', type: 'text' }, // Hash SHA-256 da chave usada
          { name: 'veiculo_marca_modelo', type: 'text', required: true },
          { name: 'veiculo_chassi', type: 'text' },
          { name: 'veiculo_placa', type: 'text' },
          { name: 'veiculo_baixa_detran', type: 'text', required: true }, // Ex.: PR-BX-2026-991204
          { name: 'veiculo_seguradora', type: 'text' },
          {
            name: 'origem_envio',
            type: 'select',
            values: ['erp', 'ecommerce', 'manual_api', 'planilha'],
            maxSelect: 1,
          },
          {
            name: 'status',
            type: 'select',
            values: ['processado', 'parcial', 'rejeitado'],
            maxSelect: 1,
          },
          { name: 'total_pecas', type: 'number', onlyInt: true },
          { name: 'total_peso_kg', type: 'number' },
          { name: 'total_co2e_evitado_kg', type: 'number' },
          { name: 'payload_bruto_json', type: 'json' },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_cdv_lotes_cnpj ON cdv_lotes (cdv_cnpj)',
          'CREATE INDEX idx_cdv_lotes_baixa ON cdv_lotes (veiculo_baixa_detran)',
        ],
      })
      app.save(lotesCol)
    }

    const lotesColSaved = app.findCollectionByNameOrId('cdv_lotes')

    // 2. Coleção cdv_pecas
    try {
      app.findCollectionByNameOrId('cdv_pecas')
    } catch (_) {
      const pecasCol = new Collection({
        name: 'cdv_pecas',
        type: 'base',
        listRule: '', // Público para permitir consulta/verificação do passaporte e widget
        viewRule: '', // Público para permitir consulta do passaporte individual
        createRule: "@request.auth.id != ''",
        updateRule: "@request.auth.id != ''",
        deleteRule: "@request.auth.id != ''",
        fields: [
          {
            name: 'lote',
            type: 'relation',
            required: true,
            collectionId: lotesColSaved.id,
            cascadeDelete: true,
            maxSelect: 1,
          },
          { name: 'sku_interno', type: 'text', required: true },
          { name: 'selo_dpp', type: 'text', required: true }, // Ex: PR-SEAL-2026-991823
          { name: 'descricao_peca', type: 'text', required: true },
          {
            name: 'categoria_material',
            type: 'select',
            values: ['aco', 'aluminio', 'cobre', 'polimeros', 'outros'],
            maxSelect: 1,
          },
          { name: 'material_declarado', type: 'text' },
          { name: 'peso_kg', type: 'number', required: true },
          { name: 'ncm', type: 'text' },
          { name: 'fator_co2e_kg', type: 'number' },
          { name: 'co2e_evitado_kg', type: 'number', required: true },
          { name: 'hash_sha256', type: 'text', required: true },
          { name: 'responsavel_crea', type: 'text' },
          { name: 'cdv_origem', type: 'text' }, // Ex.: DETRAN-PR-CDV-0089
          { name: 'cdv_cnpj', type: 'text' },
          {
            name: 'status',
            type: 'select',
            values: ['ativo', 'reutilizado', 'descartado'],
            maxSelect: 1,
          },
          { name: 'veiculo_marca_modelo', type: 'text' },
          { name: 'veiculo_chassi_mascarado', type: 'text' },
          { name: 'veiculo_baixa_detran', type: 'text' },
          { name: 'veiculo_seguradora', type: 'text' },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE UNIQUE INDEX idx_cdv_pecas_selo ON cdv_pecas (selo_dpp)',
          'CREATE INDEX idx_cdv_pecas_lote ON cdv_pecas (lote)',
          'CREATE INDEX idx_cdv_pecas_cnpj ON cdv_pecas (cdv_cnpj)',
        ],
      })
      app.save(pecasCol)
    }

    // 3. Coleção cdv_api_keys (para gestão e validação de chaves no backend e no Console de APIs)
    try {
      app.findCollectionByNameOrId('cdv_api_keys')
    } catch (_) {
      const keysCol = new Collection({
        name: 'cdv_api_keys',
        type: 'base',
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule: "@request.auth.id != ''",
        updateRule: "@request.auth.id != ''",
        deleteRule: "@request.auth.id != ''",
        fields: [
          { name: 'cdv_nome', type: 'text', required: true },
          { name: 'cdv_cnpj', type: 'text', required: true },
          { name: 'cdv_codigo', type: 'text' },
          { name: 'chave_prefixo', type: 'text', required: true }, // Ex: orb_cdv_live_...
          { name: 'chave_hash', type: 'text', required: true }, // SHA-256 da chave
          { name: 'chave_mascarada', type: 'text' },
          { name: 'ativa', type: 'bool' },
          { name: 'ultimo_uso', type: 'date' },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_cdv_keys_cnpj ON cdv_api_keys (cdv_cnpj)',
          'CREATE INDEX idx_cdv_keys_hash ON cdv_api_keys (chave_hash)',
        ],
      })
      app.save(keysCol)
    }

    // 4. Seed da chave demo e lote inicial para o CDV de teste (DETRAN-PR-CDV-0089)
    try {
      const keysCol = app.findCollectionByNameOrId('cdv_api_keys')
      const demoCnpj = '76.123.456/0001-12'
      const demoKeyRaw = 'orb_cdv_live_detran_pr_0089_demo_key'
      const demoKeyHash = $security.sha256(demoKeyRaw)

      let keyRecord
      try {
        keyRecord = app.findFirstRecordByData('cdv_api_keys', 'cdv_cnpj', demoCnpj)
      } catch (_) {
        keyRecord = new Record(keysCol)
        keyRecord.set('cdv_nome', 'CDVerde Centro de Desmontagem Veicular')
        keyRecord.set('cdv_cnpj', demoCnpj)
        keyRecord.set('cdv_codigo', 'DETRAN-PR-CDV-0089')
        keyRecord.set('chave_prefixo', 'orb_cdv_live_')
        keyRecord.set('chave_hash', demoKeyHash)
        keyRecord.set('chave_mascarada', 'orb_cdv_live_...0089')
        keyRecord.set('ativa', true)
        app.save(keyRecord)
      }

      // Seed do Lote e Peças de Exemplo pedidos no briefing:
      // Veículo "Volkswagen Gol 1.6 8V", chassi mascarado, baixa PR-BX-2026-991204, seguradora Porto Seguro / Sinistro Total
      // Capô 14,5 kg Aço -> -41,33 kg CO2e (14.5 * 2.85 = 41.325 -> 41.33)
      // Alternador 5,2 kg Cobre/Alumínio -> 5.2 * 5.40 = 28.08 kg CO2e
      // Parachoque 3,8 kg Polímeros -> 3.8 * 1.90 = 7.22 kg CO2e
      // Total CO2e evitado = 41.33 + 28.08 + 7.22 = 76.63 kg CO2e (ou 222.9 kg no histórico ampliado)
      const lotesCol = app.findCollectionByNameOrId('cdv_lotes')
      const pecasCol = app.findCollectionByNameOrId('cdv_pecas')

      let demoLote
      try {
        demoLote = app.findFirstRecordByData(
          'cdv_lotes',
          'veiculo_baixa_detran',
          'PR-BX-2026-991204',
        )
      } catch (_) {
        demoLote = new Record(lotesCol)
        demoLote.set('cdv_nome', 'CDVerde Centro de Desmontagem Veicular')
        demoLote.set('cdv_cnpj', demoCnpj)
        demoLote.set('cdv_codigo', 'DETRAN-PR-CDV-0089')
        demoLote.set('api_key_hash', demoKeyHash)
        demoLote.set('veiculo_marca_modelo', 'Volkswagen Gol 1.6 8V Total Flex')
        demoLote.set('veiculo_chassi', '9BWAA05U0DP***204')
        demoLote.set('veiculo_placa', 'BAX-9912')
        demoLote.set('veiculo_baixa_detran', 'PR-BX-2026-991204')
        demoLote.set('veiculo_seguradora', 'Porto Seguro Cia de Seguros')
        demoLote.set('origem_envio', 'erp')
        demoLote.set('status', 'processado')
        demoLote.set('total_pecas', 3)
        demoLote.set('total_peso_kg', 23.5)
        demoLote.set('total_co2e_evitado_kg', 76.63)
        demoLote.set('payload_bruto_json', {
          cdv: { nome: 'CDVerde', cnpj: demoCnpj, codigo: 'DETRAN-PR-CDV-0089' },
          veiculo: {
            modelo: 'Volkswagen Gol 1.6 8V',
            baixa: 'PR-BX-2026-991204',
            seguradora: 'Porto Seguro',
          },
        })
        app.save(demoLote)

        const pecasSeed = [
          {
            sku: 'PART-SND-CAPO-01',
            selo: 'PR-SEAL-2026-991823',
            descricao: 'Capô Dianteiro Original com Vedação Acústica',
            categoria: 'aco',
            material: 'Aço Laminado Automotivo',
            peso: 14.5,
            ncm: '8708.29.99',
            fator: 2.85,
            co2e: 41.33,
            crea: 'CREA-PR 182.940/D - Eng. Marcelo Brandão',
          },
          {
            sku: 'PART-SND-ALT-02',
            selo: 'PR-SEAL-2026-991824',
            descricao: 'Alternador 90A com Bobinamento de Cobre',
            categoria: 'cobre',
            material: 'Cobre / Alumínio Elétrico',
            peso: 5.2,
            ncm: '8511.50.10',
            fator: 5.4,
            co2e: 28.08,
            crea: 'CREA-PR 182.940/D - Eng. Marcelo Brandão',
          },
          {
            sku: 'PART-SND-PARA-03',
            selo: 'PR-SEAL-2026-991825',
            descricao: 'Parachoque Dianteiro Termoplástico Injetado',
            categoria: 'polimeros',
            material: 'Polipropileno Automotivo (PP/EPDM)',
            peso: 3.8,
            ncm: '8708.10.00',
            fator: 1.9,
            co2e: 7.22,
            crea: 'CREA-PR 182.940/D - Eng. Marcelo Brandão',
          },
        ]

        for (const p of pecasSeed) {
          const canonicalStr = `${p.selo}|${p.sku}|${p.peso}|${p.co2e}|PR-BX-2026-991204|DETRAN-PR-CDV-0089`
          const sha = $security.sha256(canonicalStr)

          const recPeca = new Record(pecasCol)
          recPeca.set('lote', demoLote.id)
          recPeca.set('sku_interno', p.sku)
          recPeca.set('selo_dpp', p.selo)
          recPeca.set('descricao_peca', p.descricao)
          recPeca.set('categoria_material', p.categoria)
          recPeca.set('material_declarado', p.material)
          recPeca.set('peso_kg', p.peso)
          recPeca.set('ncm', p.ncm)
          recPeca.set('fator_co2e_kg', p.fator)
          recPeca.set('co2e_evitado_kg', p.co2e)
          recPeca.set('hash_sha256', sha)
          recPeca.set('responsavel_crea', p.crea)
          recPeca.set('cdv_origem', 'DETRAN-PR-CDV-0089')
          recPeca.set('cdv_cnpj', demoCnpj)
          recPeca.set('status', 'ativo')
          recPeca.set('veiculo_marca_modelo', 'Volkswagen Gol 1.6 8V Total Flex')
          recPeca.set('veiculo_chassi_mascarado', '9BWAA05U0DP***204')
          recPeca.set('veiculo_baixa_detran', 'PR-BX-2026-991204')
          recPeca.set('veiculo_seguradora', 'Porto Seguro Cia de Seguros')
          app.save(recPeca)
        }
      }
    } catch (_) {}
  },
  (app) => {
    try {
      const keysCol = app.findCollectionByNameOrId('cdv_api_keys')
      app.delete(keysCol)
    } catch (_) {}
    try {
      const pecasCol = app.findCollectionByNameOrId('cdv_pecas')
      app.delete(pecasCol)
    } catch (_) {}
    try {
      const lotesCol = app.findCollectionByNameOrId('cdv_lotes')
      app.delete(lotesCol)
    } catch (_) {}
  },
)
