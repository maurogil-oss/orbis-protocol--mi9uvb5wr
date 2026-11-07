migrate(
  (app) => {
    let col
    try {
      col = app.findCollectionByNameOrId('fatores_emissao')
    } catch {
      col = new Collection({
        name: 'fatores_emissao',
        type: 'base',
        listRule: '@request.auth.id != ""',
        viewRule: '@request.auth.id != ""',
        createRule: '@request.auth.role = "master"',
        updateRule: '@request.auth.role = "master"',
        deleteRule: '@request.auth.role = "master"',
      })
    }

    // Campos essenciais e versionados pedidos na Etapa 3 Peça 3b:
    // fonte, ano, escopo, geografia, unidade, validade
    const camposTexto = [
      'codigo',
      'material',
      'descricao',
      'fonte',
      'escopo',
      'geografia',
      'unidade',
      'validade',
      'versao',
      'tier',
      'categoria',
      'origem',
    ]

    for (const campo of camposTexto) {
      if (!col.fields.getByName(campo)) {
        col.fields.add(
          new TextField({
            name: campo,
          }),
        )
      }
    }

    if (!col.fields.getByName('ano')) {
      col.fields.add(
        new NumberField({
          name: 'ano',
        }),
      )
    }

    if (!col.fields.getByName('fator')) {
      col.fields.add(
        new NumberField({
          name: 'fator',
        }),
      )
    }

    if (!col.fields.getByName('incerteza_pct')) {
      col.fields.add(
        new NumberField({
          name: 'incerteza_pct',
        }),
      )
    }

    if (!col.fields.getByName('bloqueado_atestado')) {
      col.fields.add(
        new BoolField({
          name: 'bloqueado_atestado',
        }),
      )
    }

    if (!col.fields.getByName('indicativo')) {
      col.fields.add(
        new BoolField({
          name: 'indicativo',
        }),
      )
    }

    if (!col.fields.getByName('metadados_json')) {
      col.fields.add(
        new JSONField({
          name: 'metadados_json',
        }),
      )
    }

    // Regras de acesso: somente autenticados leem; apenas role='master' grava (Opção B - blindagem)
    col.listRule = '@request.auth.id != ""'
    col.viewRule = '@request.auth.id != ""'
    col.createRule = '@request.auth.role = "master"'
    col.updateRule = '@request.auth.role = "master"'
    col.deleteRule = '@request.auth.role = "master"'

    // Índice composto opcional para busca rápida por código e versão
    col.indexes = [
      'CREATE INDEX IF NOT EXISTS idx_fatores_codigo ON fatores_emissao (codigo)',
      'CREATE INDEX IF NOT EXISTS idx_fatores_escopo ON fatores_emissao (escopo)',
      'CREATE INDEX IF NOT EXISTS idx_fatores_versao ON fatores_emissao (versao)',
    ]

    app.save(col)

    // Seed dos fatores canônicos já existentes (preservando valores do catálogo DM-ORB-001)
    const fatoresIniciais = [
      {
        codigo: 'mat-aco',
        material: 'Aço Laminado / Estampado',
        descricao: 'Portas, capôs, para-lamas, tampas traseiras e chapas estampadas',
        fator: 2.18,
        unidade: 'kgCO2e/kg',
        incerteza_pct: 3.5,
        tier: 'T3',
        fonte: 'worldsteel Association, Sustainability Indicators Report 2025 (2,18 tCO2e/t)',
        ano: 2024,
        escopo: 'Escopo 3 Cat. 1 / Insetting',
        geografia: 'Global (worldsteel)',
        validade: '2025-01-01 a 2026-12-31',
        versao: 'v2025.2',
        categoria: 'cdv_materiais',
        bloqueado_atestado: false,
        indicativo: false,
      },
      {
        codigo: 'mat-aluminio',
        material: 'Alumínio Primário Automotivo (Fallback Global)',
        descricao: 'Rodas de liga leve, blocos de motor, cabeçotes e braços de suspensão',
        fator: 14.4,
        unidade: 'kgCO2e/kg',
        incerteza_pct: 4.0,
        tier: 'T3',
        fonte: 'International Aluminium Institute (IAI 2024 Data Release, cradle-to-gate)',
        ano: 2024,
        escopo: 'Escopo 3 Cat. 1 / Insetting',
        geografia: 'Global (IAI)',
        validade: '2025-01-01 a 2026-12-31',
        versao: 'v2025.2',
        categoria: 'cdv_materiais',
        bloqueado_atestado: false,
        indicativo: false,
      },
      {
        codigo: 'mat-aluminio-regional-br',
        material: 'Alumínio Primário Cenário Regional BR (Matriz Hidrelétrica)',
        descricao: 'Cenário regional indicativo, vedado para atestados (§7 DM-ORB-001)',
        fator: 10.0,
        unidade: 'kgCO2e/kg',
        incerteza_pct: 8.0,
        tier: 'T2',
        fonte: 'IAI Aluminium Carbon Footprint FAQs (matriz hidrelétrica regional BR)',
        ano: 2024,
        escopo: 'Escopo 3 Cat. 1 / Insetting',
        geografia: 'Brasil (Regional Hidrelétrico)',
        validade: '2025-01-01 a 2026-12-31',
        versao: 'v2025.2-indicativo',
        categoria: 'cdv_materiais',
        bloqueado_atestado: true,
        indicativo: true,
      },
      {
        codigo: 'mat-cobre',
        material: 'Cobre / Bobinamentos Elétricos',
        descricao: 'Fiações de chicotes, bobinas de alternadores e motores de arranque',
        fator: 4.1,
        unidade: 'kgCO2e/kg',
        incerteza_pct: 4.5,
        tier: 'T3',
        fonte: 'International Copper Association (ICA 2024 LCI/LCA study)',
        ano: 2024,
        escopo: 'Escopo 3 Cat. 1 / Insetting',
        geografia: 'Global (ICA)',
        validade: '2025-01-01 a 2026-12-31',
        versao: 'v2025.2',
        categoria: 'cdv_materiais',
        bloqueado_atestado: false,
        indicativo: false,
      },
      {
        codigo: 'mat-polimeros',
        material: 'Polímeros Automotivos (PP / EPDM / ABS)',
        descricao: 'Parachoques termoplásticos, forros de porta e carcaças plásticas',
        fator: 1.9,
        unidade: 'kgCO2e/kg',
        incerteza_pct: 5.0,
        tier: 'T2',
        fonte: 'PlasticsEurope Eco-profiles (PCR ISO 14025, declared unit 1 kg resina)',
        ano: 2023,
        escopo: 'Escopo 3 Cat. 1 / Insetting',
        geografia: 'Europa / Internacional',
        validade: '2025-01-01 a 2026-12-31',
        versao: 'v2025.2',
        categoria: 'cdv_materiais',
        bloqueado_atestado: false,
        indicativo: false,
      },
      {
        codigo: 'comb-diesel-s10',
        material: 'Óleo Diesel S-10 Comercial',
        descricao: 'Queima em frotas próprias e geradores estacionários',
        fator: 2.603,
        unidade: 'kgCO2e/L',
        incerteza_pct: 3.0,
        tier: 'T2',
        fonte: 'Programa Brasileiro GHG Protocol / MCTI / ANP',
        ano: 2024,
        escopo: 'Escopo 1',
        geografia: 'Brasil',
        validade: '2025-01-01 a 2025-12-31',
        versao: 'v2025.2',
        categoria: 'combustiveis',
        bloqueado_atestado: false,
        indicativo: false,
      },
      {
        codigo: 'energia-sin-eletricidade',
        material: 'Eletricidade Rede SIN',
        descricao: 'Fator médio do Sistema Interligado Nacional (Localização)',
        fator: 0.085,
        unidade: 'kgCO2e/kWh',
        incerteza_pct: 2.0,
        tier: 'T3',
        fonte: 'MCTI / SIN Fator Médio Anual Oficial',
        ano: 2024,
        escopo: 'Escopo 2',
        geografia: 'Brasil (SIN)',
        validade: '2025-01-01 a 2025-12-31',
        versao: 'v2025.2',
        categoria: 'energia_eletrica',
        bloqueado_atestado: false,
        indicativo: false,
      },
    ]

    for (const item of fatoresIniciais) {
      try {
        const existente = app.findFirstRecordByFilter(
          'fatores_emissao',
          `codigo = "${item.codigo}" && versao = "${item.versao}"`,
        )
        if (!existente) {
          const record = new Record(col)
          for (const [key, value] of Object.entries(item)) {
            record.set(key, value)
          }
          record.set('origem', 'seed_dm_orb_001')
          app.save(record)
        }
      } catch {
        // Ignora caso findFirst falhe por ausência
      }
    }
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('fatores_emissao')
      app.delete(col)
    } catch {
      // Ignora se não existir
    }
  },
)
