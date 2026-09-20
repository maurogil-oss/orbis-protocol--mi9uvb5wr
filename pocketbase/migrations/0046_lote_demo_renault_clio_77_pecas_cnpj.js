migrate(
  (app) => {
    // 1. Atualizar cdv_lotes para o lote demo Renault Clio c1jz14hgmf7n13i
    // Garantir cdv_cnpj = "76.123.456/0001-00", is_demo: true, veiculo_baixa_detran: "PR-BX-2026-1240105"
    const loteId = 'c1jz14hgmf7n13i'
    let loteRec
    try {
      loteRec = app.findFirstRecordByData('cdv_lotes', 'id', loteId)
    } catch (_) {
      try {
        loteRec = app.findFirstRecordByData(
          'cdv_lotes',
          'veiculo_baixa_detran',
          'PR-BX-2026-1240105',
        )
      } catch (err) {
        console.log('[0046] Lote demo nao encontrado:', err)
        return
      }
    }

    if (!loteRec) return

    // Atualizar lote diretamente via SQL bruto
    app
      .db()
      .newQuery(
        `UPDATE cdv_lotes 
         SET cdv_cnpj = '76.123.456/0001-00', 
             is_demo = 1,
             veiculo_baixa_detran = 'PR-BX-2026-1240105'
         WHERE id = {:id}`,
      )
      .bind({ id: loteRec.id })
      .execute()

    // 2. Atualizar as 49 peças existentes (1 a 49) do lote c1jz14hgmf7n13i via raw SQL
    // Atualiza catalogo_numero, situacao_checklist e cdv_cnpj
    const situacoesEspeciais611 = {
      20: 'aguardando_avaliacao',
      24: 'inservivel',
      28: 'inservivel',
      35: 'aguardando_avaliacao',
      41: 'aguardando_avaliacao',
      46: 'nao_aplicavel_ausente',
      49: 'nao_aplicavel_ausente',
    }

    const pecasExistentes = app.findRecordsByFilter(
      'cdv_pecas',
      `lote = '${loteRec.id}'`,
      'created',
      100,
      0,
    )

    for (let i = 0; i < pecasExistentes.length; i++) {
      const p = pecasExistentes[i]
      const num = i + 1
      const sit = situacoesEspeciais611[num] || 'etiquetada'

      app
        .db()
        .newQuery(
          `UPDATE cdv_pecas 
           SET cdv_cnpj = '76.123.456/0001-00', 
               catalogo_numero = {:num}, 
               situacao_checklist = {:sit} 
           WHERE id = {:id}`,
        )
        .bind({ num: num, sit: sit, id: p.id })
        .execute()
    }

    // 3. Cadastrar as peças restantes de 50 a 77 para o lote c1jz14hgmf7n13i:
    // Peças 50 a 77 do catálogo oficial MOVER (28 peças adicionais)
    // ~6 leituras nas peças MOVER 50-77 (com situações variadas: etiquetada, inservivel, aguardando_avaliacao, nao_aplicavel_ausente)
    const pecasCol = app.findCollectionByNameOrId('cdv_pecas')
    const itensMover = [
      {
        num: 50,
        sub: 'Climatização',
        desc: 'Compressor do Ar-Condicionado Automotivo',
        cat: 'aluminio',
        mat: 'Alumínio Usinado / Aço Estrutural',
        peso: 5.8,
        fator: 8.2,
        co2e: 47.56,
        ncm: '8414.30.91',
        sit: 'aguardando_avaliacao', // Leitura 1 MOVER
      },
      {
        num: 51,
        sub: 'Climatização',
        desc: 'Válvula de Expansão Térmica do Ar-Condicionado',
        cat: 'aluminio',
        mat: 'Alumínio / Latão Termostático',
        peso: 0.35,
        fator: 8.2,
        co2e: 2.87,
        ncm: '8481.80.99',
        sit: 'nao_desmontada',
      },
      {
        num: 52,
        sub: 'Climatização',
        desc: 'Evaporador da Caixa de Ar Interna',
        cat: 'aluminio',
        mat: 'Alumínio Brasado Automotivo',
        peso: 1.8,
        fator: 8.2,
        co2e: 14.76,
        ncm: '8418.99.00',
        sit: 'nao_desmontada',
      },
      {
        num: 53,
        sub: 'Climatização',
        desc: 'Caixa de Ventilação e Climatização Interna (HVAC)',
        cat: 'polimeros',
        mat: 'Polipropileno Automotivo (PP)',
        peso: 3.2,
        fator: 1.9,
        co2e: 6.08,
        ncm: '8415.90.90',
        sit: 'nao_desmontada',
      },
      {
        num: 54,
        sub: 'Segurança Passiva',
        desc: 'Módulo do Airbag do Motorista (Volante)',
        cat: 'outros',
        mat: 'Alumínio / Pirotécnico / Polímeros',
        peso: 1.2,
        fator: 1.5,
        co2e: 1.8,
        ncm: '8708.95.10',
        sit: 'inservivel', // Leitura 2 MOVER
      },
      {
        num: 55,
        sub: 'Segurança Passiva',
        desc: 'Módulo do Airbag do Passageiro (Painel)',
        cat: 'outros',
        mat: 'Alumínio / Pirotécnico / Polímeros',
        peso: 2.1,
        fator: 1.5,
        co2e: 3.15,
        ncm: '8708.95.20',
        sit: 'inservivel', // Leitura 3 MOVER
      },
      {
        num: 56,
        sub: 'Segurança Passiva',
        desc: 'Módulos de Airbag de Cortina / Laterais (Par)',
        cat: 'outros',
        mat: 'Módulos Infladores Pirotécnicos',
        peso: 1.6,
        fator: 1.5,
        co2e: 2.4,
        ncm: '8708.95.90',
        sit: 'nao_aplicavel_ausente', // Leitura 4 MOVER
      },
      {
        num: 57,
        sub: 'Segurança Passiva',
        desc: 'Central Eletrônica de Disparo dos Airbags (SRS)',
        cat: 'outros',
        mat: 'PCB / Alumínio / Conectores Dourados',
        peso: 0.45,
        fator: 1.5,
        co2e: 0.68,
        ncm: '9032.89.29',
        sit: 'nao_desmontada',
      },
      {
        num: 58,
        sub: 'Segurança Passiva',
        desc: 'Cintos de Segurança Dianteiros com Pré-tensionadores (Par)',
        cat: 'aco',
        mat: 'Aço Estrutural / Fita Poliéster Alta Tenacidade',
        peso: 2.8,
        fator: 2.85,
        co2e: 7.98,
        ncm: '8708.21.00',
        sit: 'inservivel',
      },
      {
        num: 59,
        sub: 'Segurança Passiva',
        desc: 'Cintos de Segurança Traseiros com Retratores (Conjunto)',
        cat: 'aco',
        mat: 'Aço Laminado / Fitas Poliéster',
        peso: 2.5,
        fator: 2.85,
        co2e: 7.13,
        ncm: '8708.21.00',
        sit: 'nao_desmontada',
      },
      {
        num: 60,
        sub: 'Combustível',
        desc: 'Tanque de Combustível em Polietileno de Alta Densidade (HDPE)',
        cat: 'polimeros',
        mat: 'Polietileno de Alta Densidade (HDPE Coextrusado)',
        peso: 6.8,
        fator: 1.9,
        co2e: 12.92,
        ncm: '8708.29.99',
        sit: 'etiquetada', // Leitura 5 MOVER
      },
      {
        num: 61,
        sub: 'Combustível',
        desc: 'Módulo da Bomba de Combustível e Boia Medidora',
        cat: 'polimeros',
        mat: 'Polímeros Automotivos / Cobre',
        peso: 1.1,
        fator: 1.9,
        co2e: 2.09,
        ncm: '8413.30.20',
        sit: 'nao_desmontada',
      },
      {
        num: 62,
        sub: 'Combustível',
        desc: 'Filtro de Carvão Ativado (Cânister de Emissões Evaporativas)',
        cat: 'polimeros',
        mat: 'Polipropileno com Carga de Carvão Ativado',
        peso: 0.95,
        fator: 1.9,
        co2e: 1.81,
        ncm: '8421.39.90',
        sit: 'nao_desmontada',
      },
      {
        num: 63,
        sub: 'Combustível',
        desc: 'Flauta Distribuidora e Bicos Injetores de Combustível',
        cat: 'aco',
        mat: 'Aço Inox / Bobinamentos Cobre',
        peso: 1.4,
        fator: 2.85,
        co2e: 3.99,
        ncm: '8409.91.90',
        sit: 'nao_desmontada',
      },
      {
        num: 64,
        sub: 'Vidros',
        desc: 'Vidro do Parabrisa Laminado com Serigrafia',
        cat: 'outros',
        mat: 'Vidro Laminado de Segurança c/ PVB',
        peso: 11.5,
        fator: 1.5,
        co2e: 17.25,
        ncm: '7007.21.00',
        sit: 'nao_desmontada',
      },
      {
        num: 65,
        sub: 'Vidros',
        desc: 'Vidro Vigia Traseiro com Desembaçador Térmico',
        cat: 'outros',
        mat: 'Vidro Temperado com Filetes de Prata Térmica',
        peso: 6.2,
        fator: 1.5,
        co2e: 9.3,
        ncm: '7007.11.00',
        sit: 'nao_desmontada',
      },
      {
        num: 66,
        sub: 'Vidros',
        desc: 'Vidros Laterais das Quatro Portas (Jogo)',
        cat: 'outros',
        mat: 'Vidros Temperados Automotivos',
        peso: 9.8,
        fator: 1.5,
        co2e: 14.7,
        ncm: '7007.11.00',
        sit: 'nao_desmontada',
      },
      {
        num: 67,
        sub: 'Interior',
        desc: 'Bancos Dianteiros com Trilhos e Ajustes (Par)',
        cat: 'aco',
        mat: 'Armação de Aço Estrutural / Espuma PU',
        peso: 17.5,
        fator: 2.85,
        co2e: 49.88,
        ncm: '9401.20.00',
        sit: 'etiquetada', // Leitura 6 MOVER
      },
      {
        num: 68,
        sub: 'Interior',
        desc: 'Banco Traseiro Bipartido com Encostos',
        cat: 'aco',
        mat: 'Estrutura em Aço / Espuma Poliuretano',
        peso: 12.0,
        fator: 2.85,
        co2e: 34.2,
        ncm: '9401.20.00',
        sit: 'nao_desmontada',
      },
      {
        num: 69,
        sub: 'Interior',
        desc: 'Painel Central / Tabelier Completo com Difusores',
        cat: 'polimeros',
        mat: 'Polipropileno / ABS Texturizado',
        peso: 7.5,
        fator: 1.9,
        co2e: 14.25,
        ncm: '8708.29.99',
        sit: 'nao_desmontada',
      },
      {
        num: 70,
        sub: 'Interior',
        desc: 'Console Central e Alavanca do Freio de Estacionamento',
        cat: 'polimeros',
        mat: 'ABS Injetado / Aço Mecânico',
        peso: 2.2,
        fator: 1.9,
        co2e: 4.18,
        ncm: '8708.29.99',
        sit: 'nao_desmontada',
      },
      {
        num: 71,
        sub: 'Interior',
        desc: 'Forros de Porta Termomoldados com Puxadores (Jogo)',
        cat: 'polimeros',
        mat: 'Fibras Vegetais Termomoldadas / Polipropileno',
        peso: 4.8,
        fator: 1.9,
        co2e: 9.12,
        ncm: '8708.29.99',
        sit: 'nao_desmontada',
      },
      {
        num: 72,
        sub: 'Iluminação',
        desc: 'Farol Dianteiro Principal Esquerdo em Policarbonato',
        cat: 'polimeros',
        mat: 'Policarbonato (PC) Anti-UV / BMC Refletor',
        peso: 1.9,
        fator: 1.9,
        co2e: 3.61,
        ncm: '8512.20.11',
        sit: 'nao_desmontada',
      },
      {
        num: 73,
        sub: 'Iluminação',
        desc: 'Farol Dianteiro Principal Direito em Policarbonato',
        cat: 'polimeros',
        mat: 'Policarbonato (PC) Anti-UV / BMC Refletor',
        peso: 1.9,
        fator: 1.9,
        co2e: 3.61,
        ncm: '8512.20.11',
        sit: 'nao_desmontada',
      },
      {
        num: 74,
        sub: 'Iluminação',
        desc: 'Lanterna Traseira Esquerda Bicolor',
        cat: 'polimeros',
        mat: 'PMMA Acrílico / ABS Carcaça',
        peso: 1.1,
        fator: 1.9,
        co2e: 2.09,
        ncm: '8512.20.22',
        sit: 'nao_desmontada',
      },
      {
        num: 75,
        sub: 'Iluminação',
        desc: 'Lanterna Traseira Direita Bicolor',
        cat: 'polimeros',
        mat: 'PMMA Acrílico / ABS Carcaça',
        peso: 1.1,
        fator: 1.9,
        co2e: 2.09,
        ncm: '8512.20.22',
        sit: 'nao_desmontada',
      },
      {
        num: 76,
        sub: 'Rodas',
        desc: 'Jogo de Rodas de Liga Leve ou Aço Estampado (4 Unidades)',
        cat: 'aco',
        mat: 'Aço Estrutural Estampado Soldado',
        peso: 26.0,
        fator: 2.85,
        co2e: 74.1,
        ncm: '8708.70.90',
        sit: 'etiquetada', // Leitura 7 MOVER
      },
      {
        num: 77,
        sub: 'Rodas',
        desc: 'Roda Sobressalente (Estepe) com Pneu Sujeito à LR 11.413',
        cat: 'aco',
        mat: 'Roda de Aço com Pneu Radial 165/70 R13',
        peso: 11.8,
        fator: 2.85,
        co2e: 33.63,
        ncm: '8708.70.90',
        sit: 'aguardando_avaliacao',
      },
    ]

    for (const item of itensMover) {
      const selo = `PR-SEAL-2026-0001${String(item.num).padStart(2, '0')}`
      let pecaRec
      try {
        pecaRec = app.findFirstRecordByData('cdv_pecas', 'selo_dpp', selo)
      } catch (_) {
        pecaRec = new Record(pecasCol)
      }

      const sku = `CLIO-MOV-${String(item.num).padStart(2, '0')}`
      const pesoFormatted = Number(item.peso).toFixed(2)
      const co2eFormatted = Number(item.co2e).toFixed(2)
      const baixaNorm = 'PR-BX-2026-1240105'
      const cnpjNorm = '76.123.456/0001-00'
      const canonicalStr = `${selo}|${sku}|${item.desc}|${pesoFormatted}|${co2eFormatted}|${baixaNorm}|${cnpjNorm}`

      pecaRec.set('lote', loteRec.id)
      pecaRec.set('sku_interno', sku)
      pecaRec.set('selo_dpp', selo)
      pecaRec.set('descricao_peca', item.desc)
      pecaRec.set('categoria_material', item.cat)
      pecaRec.set('material_declarado', item.mat)
      pecaRec.set('peso_kg', item.peso)
      pecaRec.set('ncm', item.ncm)
      pecaRec.set('fator_co2e_kg', item.fator)
      pecaRec.set('co2e_evitado_kg', item.co2e)
      pecaRec.set('hash_sha256', $security.sha256(canonicalStr))
      pecaRec.set('responsavel_crea', 'CREA-PR 182.940/D - Eng. Marcelo Brandão')
      pecaRec.set('cdv_origem', 'DETRAN-PR-CDV-0089')
      pecaRec.set('cdv_cnpj', '76.123.456/0001-00')
      pecaRec.set('status', 'ativo')
      pecaRec.set('veiculo_marca_modelo', 'Renault Clio Authentique 1.0 16V Hi-Flex')
      pecaRec.set('veiculo_chassi_mascarado', '93YBB05U0GJ***711')
      pecaRec.set('veiculo_baixa_detran', 'PR-BX-2026-1240105')
      pecaRec.set('veiculo_seguradora', 'Porto Seguro Cia de Seguros (Sinistro PT)')
      pecaRec.set('subsistema', item.sub)
      pecaRec.set('catalogo_numero', item.num)
      pecaRec.set('situacao_checklist', item.sit)

      app.save(pecaRec)
    }

    // 4. Reconciliar lote com 77 peças totais
    app
      .db()
      .newQuery(
        `UPDATE cdv_lotes 
         SET total_pecas = (SELECT count(*) FROM cdv_pecas WHERE lote = {:id}) 
         WHERE id = {:id}`,
      )
      .bind({ id: loteRec.id })
      .execute()
  },
  (app) => {
    // Reversão
    try {
      for (let num = 50; num <= 77; num++) {
        const selo = `PR-SEAL-2026-0001${String(num).padStart(2, '0')}`
        try {
          const p = app.findFirstRecordByData('cdv_pecas', 'selo_dpp', selo)
          app.delete(p)
        } catch (_) {}
      }
    } catch (_) {}
  },
)
