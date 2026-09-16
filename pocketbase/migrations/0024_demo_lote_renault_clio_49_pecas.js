migrate(
  (app) => {
    // 1. Adicionar campos em cdv_lotes se ainda não existirem:
    // is_demo (bool), cartela_desmontagem (text), ctf_ibama (text), selo_detran_lote (text)
    const lotesCol = app.findCollectionByNameOrId('cdv_lotes')

    if (!lotesCol.fields.getByName('is_demo')) {
      lotesCol.fields.add(new BoolField({ name: 'is_demo' }))
    }
    if (!lotesCol.fields.getByName('cartela_desmontagem')) {
      lotesCol.fields.add(new TextField({ name: 'cartela_desmontagem' }))
    }
    if (!lotesCol.fields.getByName('ctf_ibama')) {
      lotesCol.fields.add(new TextField({ name: 'ctf_ibama' }))
    }
    if (!lotesCol.fields.getByName('selo_detran_lote')) {
      lotesCol.fields.add(new TextField({ name: 'selo_detran_lote' }))
    }
    app.save(lotesCol)

    // 2. Adicionar campo subsistema em cdv_pecas se ainda não existir
    const pecasCol = app.findCollectionByNameOrId('cdv_pecas')
    if (!pecasCol.fields.getByName('subsistema')) {
      pecasCol.fields.add(new TextField({ name: 'subsistema' }))
    }
    app.save(pecasCol)

    // 3. Criar Lote Demo Renault Clio
    // Idempotência: verificar se lote com cartela 12401050711 já existe
    const demoCartela = '12401050711'
    const demoBaixa = 'PR-BX-2026-1240105'
    const demoCnpj = '76.123.456/0001-12'
    const demoCdvCodigo = 'DETRAN-PR-CDV-0089'
    const demoCdvNome = 'CDVerde Centro de Desmontagem Veicular'
    const demoCtfIbama = 'CTF-IBAMA 6812490/2024'
    const demoSeloDetran = 'DETRAN-PR-DESM-2026-12401'
    const demoModelo = 'Renault Clio Authentique 1.0 16V Hi-Flex'
    const demoChassi = '93YBB05U0GJ***711'
    const demoPlaca = 'AYK-7110'
    const demoSeguradora = 'Porto Seguro Cia de Seguros (Sinistro PT)'
    const demoOrigem = 'erp'
    const demoCrea = 'CREA-PR 182.940/D - Eng. Marcelo Brandão'

    let demoLoteRecord
    try {
      demoLoteRecord = app.findFirstRecordByData('cdv_lotes', 'cartela_desmontagem', demoCartela)
    } catch (_) {
      try {
        demoLoteRecord = app.findFirstRecordByData('cdv_lotes', 'veiculo_baixa_detran', demoBaixa)
      } catch (_) {
        demoLoteRecord = new Record(lotesCol)
        demoLoteRecord.set('cdv_nome', demoCdvNome)
        demoLoteRecord.set('cdv_cnpj', demoCnpj)
        demoLoteRecord.set('cdv_codigo', demoCdvCodigo)
        demoLoteRecord.set('veiculo_marca_modelo', demoModelo)
        demoLoteRecord.set('veiculo_chassi', demoChassi)
        demoLoteRecord.set('veiculo_placa', demoPlaca)
        demoLoteRecord.set('veiculo_baixa_detran', demoBaixa)
        demoLoteRecord.set('veiculo_seguradora', demoSeguradora)
        demoLoteRecord.set('origem_envio', demoOrigem)
        demoLoteRecord.set('status', 'processado')
        demoLoteRecord.set('total_pecas', 49)
        demoLoteRecord.set('total_peso_kg', 480.0)
        demoLoteRecord.set('total_co2e_evitado_kg', 2097.02)
        demoLoteRecord.set('is_demo', true)
        demoLoteRecord.set('cartela_desmontagem', demoCartela)
        demoLoteRecord.set('ctf_ibama', demoCtfIbama)
        demoLoteRecord.set('selo_detran_lote', demoSeloDetran)
        demoLoteRecord.set('payload_bruto_json', {
          tipo: 'lote_demonstracao_dpp_consolidado',
          cartela_desmontagem: demoCartela,
          ctf_ibama: demoCtfIbama,
          selo_detran: demoSeloDetran,
          referencia_pdf: 'CDVerde / DPP Consolidado Automotivo',
          cdv: {
            nome: demoCdvNome,
            cnpj: demoCnpj,
            codigo: demoCdvCodigo,
            ibama: demoCtfIbama,
          },
          veiculo: {
            modelo: demoModelo,
            chassi: demoChassi,
            placa: demoPlaca,
            baixa: demoBaixa,
            seguradora: demoSeguradora,
          },
        })
        app.save(demoLoteRecord)
      }
    }

    // 4. Relação das 49 peças discriminadas por subsistema
    // Motor (8), Câmbio (4), Elétrica (6), Direção (3), Suspensão (6), Freios (4), Arrefecimento (4), Escape (3), Carroceria (11) = 49 peças
    // Total Peso: 480.00 kg | Total CO2e: 2097.02 kgCO2e
    const pecasData = [
      // --- MOTOR (8 peças) ---
      {
        sub: 'Motor',
        sku: 'CLIO-MOT-01',
        selo: 'PR-SEAL-2026-000101',
        desc: 'Bloco do Motor 1.0 16V D4D com Mancais',
        cat: 'aco',
        mat: 'Ferro Fundido / Aço Estrutural',
        peso: 42.0,
        fator: 2.85,
        co2e: 119.7,
        ncm: '8409.91.12',
      },
      {
        sub: 'Motor',
        sku: 'CLIO-MOT-02',
        selo: 'PR-SEAL-2026-000102',
        desc: 'Cabeçote 16V em Liga de Alumínio Usinado',
        cat: 'aluminio',
        mat: 'Alumínio Primário Automotivo',
        peso: 16.5,
        fator: 8.2,
        co2e: 135.3,
        ncm: '8409.91.14',
      },
      {
        sub: 'Motor',
        sku: 'CLIO-MOT-03',
        selo: 'PR-SEAL-2026-000103',
        desc: 'Virabrequim Forjado em Aço Carbono',
        cat: 'aco',
        mat: 'Aço Forjado de Alta Resistência',
        peso: 13.0,
        fator: 2.85,
        co2e: 37.05,
        ncm: '8483.10.19',
      },
      {
        sub: 'Motor',
        sku: 'CLIO-MOT-04',
        selo: 'PR-SEAL-2026-000104',
        desc: 'Comando de Válvulas Admissão e Escape (Par)',
        cat: 'aco',
        mat: 'Aço Laminado Tratado Termicamente',
        peso: 6.8,
        fator: 2.85,
        co2e: 19.38,
        ncm: '8483.10.90',
      },
      {
        sub: 'Motor',
        sku: 'CLIO-MOT-05',
        selo: 'PR-SEAL-2026-000105',
        desc: 'Cárter de Óleo em Liga de Alumínio Estampado',
        cat: 'aluminio',
        mat: 'Alumínio Primário Automotivo',
        peso: 4.2,
        fator: 8.2,
        co2e: 34.44,
        ncm: '8409.91.90',
      },
      {
        sub: 'Motor',
        sku: 'CLIO-MOT-06',
        selo: 'PR-SEAL-2026-000106',
        desc: 'Coletor de Admissão em Polímero Técnico',
        cat: 'polimeros',
        mat: 'Poliamida Reforçada (PA66-GF30)',
        peso: 3.5,
        fator: 1.9,
        co2e: 6.65,
        ncm: '8409.91.90',
      },
      {
        sub: 'Motor',
        sku: 'CLIO-MOT-07',
        selo: 'PR-SEAL-2026-000107',
        desc: 'Volante do Motor Bimassa em Ferro Fundido/Aço',
        cat: 'aco',
        mat: 'Aço Estrutural Balanceado',
        peso: 9.8,
        fator: 2.85,
        co2e: 27.93,
        ncm: '8483.50.10',
      },
      {
        sub: 'Motor',
        sku: 'CLIO-MOT-08',
        selo: 'PR-SEAL-2026-000108',
        desc: 'Bomba de Óleo e Conjunto de Engrenagens',
        cat: 'aluminio',
        mat: 'Liga de Alumínio Fundido',
        peso: 2.4,
        fator: 8.2,
        co2e: 19.68,
        ncm: '8413.30.10',
      },

      // --- CÂMBIO (4 peças) ---
      {
        sub: 'Câmbio',
        sku: 'CLIO-CAM-01',
        selo: 'PR-SEAL-2026-000109',
        desc: 'Carcaça da Caixa de Câmbio Manual JB1 Alumínio',
        cat: 'aluminio',
        mat: 'Alumínio Primário Automotivo',
        peso: 18.0,
        fator: 8.2,
        co2e: 147.6,
        ncm: '8708.40.90',
      },
      {
        sub: 'Câmbio',
        sku: 'CLIO-CAM-02',
        selo: 'PR-SEAL-2026-000110',
        desc: 'Conjunto de Engrenagens e Eixo Primário/Secundário',
        cat: 'aco',
        mat: 'Aço Cementado e Retificado',
        peso: 15.6,
        fator: 2.85,
        co2e: 44.46,
        ncm: '8708.40.80',
      },
      {
        sub: 'Câmbio',
        sku: 'CLIO-CAM-03',
        selo: 'PR-SEAL-2026-000111',
        desc: 'Diferencial Completo com Coroa e Pinhão',
        cat: 'aco',
        mat: 'Aço Carbono Forjado',
        peso: 11.2,
        fator: 2.85,
        co2e: 31.92,
        ncm: '8708.50.99',
      },
      {
        sub: 'Câmbio',
        sku: 'CLIO-CAM-04',
        selo: 'PR-SEAL-2026-000112',
        desc: 'Garfo Seletor e Varetas de Trambulador',
        cat: 'aco',
        mat: 'Aço Estampado Automotivo',
        peso: 2.8,
        fator: 2.85,
        co2e: 7.98,
        ncm: '8708.40.90',
      },

      // --- ELÉTRICA (6 peças) ---
      {
        sub: 'Elétrica',
        sku: 'CLIO-ELE-01',
        selo: 'PR-SEAL-2026-000113',
        desc: 'Alternador 90A com Bobinamento de Cobre Eletrolítico',
        cat: 'cobre',
        mat: 'Cobre Eletrolítico / Rotor Bobinado',
        peso: 5.6,
        fator: 5.4,
        co2e: 30.24,
        ncm: '8511.50.10',
      },
      {
        sub: 'Elétrica',
        sku: 'CLIO-ELE-02',
        selo: 'PR-SEAL-2026-000114',
        desc: 'Motor de Partida 1.1kW com Estator em Cobre',
        cat: 'cobre',
        mat: 'Cobre / Alumínio Elétrico',
        peso: 4.8,
        fator: 5.4,
        co2e: 25.92,
        ncm: '8511.40.00',
      },
      {
        sub: 'Elétrica',
        sku: 'CLIO-ELE-03',
        selo: 'PR-SEAL-2026-000115',
        desc: 'Chicote Elétrico Principal do Vão do Motor',
        cat: 'cobre',
        mat: 'Cobre Puro / Encapamento Polimérico',
        peso: 7.2,
        fator: 5.4,
        co2e: 38.88,
        ncm: '8544.30.00',
      },
      {
        sub: 'Elétrica',
        sku: 'CLIO-ELE-04',
        selo: 'PR-SEAL-2026-000116',
        desc: 'Módulo de Injeção Eletrônica ECU Siemens Sirius',
        cat: 'outros',
        mat: 'PCB / Componentes Eletrônicos / Alumínio',
        peso: 1.2,
        fator: 1.5,
        co2e: 1.8,
        ncm: '9032.89.29',
      },
      {
        sub: 'Elétrica',
        sku: 'CLIO-ELE-05',
        selo: 'PR-SEAL-2026-000117',
        desc: 'Conjunto de Bobina de Ignição e Cabos Supressores',
        cat: 'cobre',
        mat: 'Cobre Eletrolítico / Silicone Isolante',
        peso: 1.9,
        fator: 5.4,
        co2e: 10.26,
        ncm: '8511.30.20',
      },
      {
        sub: 'Elétrica',
        sku: 'CLIO-ELE-06',
        selo: 'PR-SEAL-2026-000118',
        desc: 'Painel de Instrumentos Analógico/Digital com PCB',
        cat: 'polimeros',
        mat: 'Polímeros Automotivos (ABS/PMMA) / Placas',
        peso: 2.1,
        fator: 1.9,
        co2e: 3.99,
        ncm: '9029.20.10',
      },

      // --- DIREÇÃO (3 peças) ---
      {
        sub: 'Direção',
        sku: 'CLIO-DIR-01',
        selo: 'PR-SEAL-2026-000119',
        desc: 'Caixa de Direção Hidráulica com Pinhão e Cremalheira',
        cat: 'aco',
        mat: 'Aço Estrutural / Carcaça Alumínio',
        peso: 7.5,
        fator: 2.85,
        co2e: 21.38,
        ncm: '8708.94.81',
      },
      {
        sub: 'Direção',
        sku: 'CLIO-DIR-02',
        selo: 'PR-SEAL-2026-000120',
        desc: 'Bomba Hidráulica de Direção em Liga Leve',
        cat: 'aluminio',
        mat: 'Liga de Alumínio Usinado',
        peso: 3.2,
        fator: 8.2,
        co2e: 26.24,
        ncm: '8413.60.19',
      },
      {
        sub: 'Direção',
        sku: 'CLIO-DIR-03',
        selo: 'PR-SEAL-2026-000121',
        desc: 'Coluna de Direção Articulada com Junta Universal',
        cat: 'aco',
        mat: 'Aço Laminado Automotivo',
        peso: 4.8,
        fator: 2.85,
        co2e: 13.68,
        ncm: '8708.94.83',
      },

      // --- SUSPENSÃO (6 peças) ---
      {
        sub: 'Suspensão',
        sku: 'CLIO-SUS-01',
        selo: 'PR-SEAL-2026-000122',
        desc: 'Quadro Subchassi Dianteiro (Agregado da Suspensão)',
        cat: 'aco',
        mat: 'Aço Estrutural Estampado Soldado',
        peso: 19.5,
        fator: 2.85,
        co2e: 55.58,
        ncm: '8708.80.00',
      },
      {
        sub: 'Suspensão',
        sku: 'CLIO-SUS-02',
        selo: 'PR-SEAL-2026-000123',
        desc: 'Eixo Traseiro com Barra de Torção Integrada',
        cat: 'aco',
        mat: 'Aço Estrutural Tubular Tratado',
        peso: 22.0,
        fator: 2.85,
        co2e: 62.7,
        ncm: '8708.50.80',
      },
      {
        sub: 'Suspensão',
        sku: 'CLIO-SUS-03',
        selo: 'PR-SEAL-2026-000124',
        desc: 'Par de Molas Helicoidais Dianteiras em Aço Mola',
        cat: 'aco',
        mat: 'Aço Especial Mola SAE 5160',
        peso: 7.8,
        fator: 2.85,
        co2e: 22.23,
        ncm: '7320.20.10',
      },
      {
        sub: 'Suspensão',
        sku: 'CLIO-SUS-04',
        selo: 'PR-SEAL-2026-000125',
        desc: 'Par de Molas Helicoidais Traseiras em Aço Mola',
        cat: 'aco',
        mat: 'Aço Especial Mola SAE 5160',
        peso: 6.4,
        fator: 2.85,
        co2e: 18.24,
        ncm: '7320.20.10',
      },
      {
        sub: 'Suspensão',
        sku: 'CLIO-SUS-05',
        selo: 'PR-SEAL-2026-000126',
        desc: 'Bandejas / Braços Oscilantes Dianteiros (Par)',
        cat: 'aco',
        mat: 'Aço Estampado Automotivo',
        peso: 5.6,
        fator: 2.85,
        co2e: 15.96,
        ncm: '8708.80.00',
      },
      {
        sub: 'Suspensão',
        sku: 'CLIO-SUS-06',
        selo: 'PR-SEAL-2026-000127',
        desc: 'Manga de Eixo Dianteira com Cubo e Rolamento (Par)',
        cat: 'aco',
        mat: 'Aço Forjado de Alta Tenacidade',
        peso: 8.2,
        fator: 2.85,
        co2e: 23.37,
        ncm: '8708.80.00',
      },

      // --- FREIOS (4 peças) ---
      {
        sub: 'Freios',
        sku: 'CLIO-FRE-01',
        selo: 'PR-SEAL-2026-000128',
        desc: 'Discos de Freio Ventilados Dianteiros (Par)',
        cat: 'aco',
        mat: 'Ferro Fundido Nodular / Aço Carbono',
        peso: 10.4,
        fator: 2.85,
        co2e: 29.64,
        ncm: '8708.30.90',
      },
      {
        sub: 'Freios',
        sku: 'CLIO-FRE-02',
        selo: 'PR-SEAL-2026-000129',
        desc: 'Pinças de Freio Hidráulico com Êmbolo (Par)',
        cat: 'aluminio',
        mat: 'Alumínio / Ferro Fundido Usinado',
        peso: 5.8,
        fator: 8.2,
        co2e: 47.56,
        ncm: '8708.30.19',
      },
      {
        sub: 'Freios',
        sku: 'CLIO-FRE-03',
        selo: 'PR-SEAL-2026-000130',
        desc: 'Tambores de Freio Traseiro com Sapatas (Par)',
        cat: 'aco',
        mat: 'Ferro Fundido Automotivo',
        peso: 9.6,
        fator: 2.85,
        co2e: 27.36,
        ncm: '8708.30.90',
      },
      {
        sub: 'Freios',
        sku: 'CLIO-FRE-04',
        selo: 'PR-SEAL-2026-000131',
        desc: 'Servofreio Hidrovácuo com Cilindro Mestre Duplo',
        cat: 'aco',
        mat: 'Aço Estampado / Alumínio Hidráulico',
        peso: 4.2,
        fator: 2.85,
        co2e: 11.97,
        ncm: '8708.30.90',
      },

      // --- ARREFECIMENTO (4 peças) ---
      {
        sub: 'Arrefecimento',
        sku: 'CLIO-ARR-01',
        selo: 'PR-SEAL-2026-000132',
        desc: 'Radiador de Água com Colmeia de Alumínio Brasado',
        cat: 'aluminio',
        mat: 'Alumínio Brasado Alta Condutividade',
        peso: 3.9,
        fator: 8.2,
        co2e: 31.98,
        ncm: '8708.91.00',
      },
      {
        sub: 'Arrefecimento',
        sku: 'CLIO-ARR-02',
        selo: 'PR-SEAL-2026-000133',
        desc: 'Condensador do Ar Condicionado em Alumínio Microcanal',
        cat: 'aluminio',
        mat: 'Alumínio Primário Automotivo',
        peso: 3.4,
        fator: 8.2,
        co2e: 27.88,
        ncm: '8418.99.00',
      },
      {
        sub: 'Arrefecimento',
        sku: 'CLIO-ARR-03',
        selo: 'PR-SEAL-2026-000134',
        desc: 'Conjunto Eletroventilador e Defletor Termoplástico',
        cat: 'polimeros',
        mat: 'Polipropileno com Carga Mineral (PP-M20)',
        peso: 2.8,
        fator: 1.9,
        co2e: 5.32,
        ncm: '8414.59.10',
      },
      {
        sub: 'Arrefecimento',
        sku: 'CLIO-ARR-04',
        selo: 'PR-SEAL-2026-000135',
        desc: 'Reservatório de Expansão com Mangueiras EPDM',
        cat: 'polimeros',
        mat: 'Polipropileno Translúcido e Borracha EPDM',
        peso: 1.6,
        fator: 1.9,
        co2e: 3.04,
        ncm: '3926.90.90',
      },

      // --- ESCAPE (3 peças) ---
      {
        sub: 'Escape',
        sku: 'CLIO-ESC-01',
        selo: 'PR-SEAL-2026-000136',
        desc: 'Coletor de Escape Tubular em Aço Inox / Aço Carbono',
        cat: 'aco',
        mat: 'Aço Estrutural Resistente a Altas Temperaturas',
        peso: 5.2,
        fator: 2.85,
        co2e: 14.82,
        ncm: '8409.91.90',
      },
      {
        sub: 'Escape',
        sku: 'CLIO-ESC-02',
        selo: 'PR-SEAL-2026-000137',
        desc: 'Tubo Intermediário com Abafador de Expansão',
        cat: 'aco',
        mat: 'Aço Galvanizado Automotivo',
        peso: 6.8,
        fator: 2.85,
        co2e: 19.38,
        ncm: '8708.92.00',
      },
      {
        sub: 'Escape',
        sku: 'CLIO-ESC-03',
        selo: 'PR-SEAL-2026-000138',
        desc: 'Silencioso Traseiro com Ponteira em Chapa Dupla',
        cat: 'aco',
        mat: 'Aço Aluminizado Automotivo',
        peso: 7.4,
        fator: 2.85,
        co2e: 21.09,
        ncm: '8708.92.00',
      },

      // --- CARROCERIA (11 peças) ---
      {
        sub: 'Carroceria',
        sku: 'CLIO-CAR-01',
        selo: 'PR-SEAL-2026-000139',
        desc: 'Capô Dianteiro em Chapa de Aço Estampada com Manta',
        cat: 'aco',
        mat: 'Aço Laminado Automotivo Estampado',
        peso: 15.2,
        fator: 2.85,
        co2e: 43.32,
        ncm: '8708.29.99',
      },
      {
        sub: 'Carroceria',
        sku: 'CLIO-CAR-02',
        selo: 'PR-SEAL-2026-000140',
        desc: 'Tampa Traseira (Porta-Malas) com Vigia e Trava',
        cat: 'aco',
        mat: 'Aço Laminado Automotivo',
        peso: 14.5,
        fator: 2.85,
        co2e: 41.33,
        ncm: '8708.29.99',
      },
      {
        sub: 'Carroceria',
        sku: 'CLIO-CAR-03',
        selo: 'PR-SEAL-2026-000141',
        desc: 'Porta Dianteira Esquerda Completa com Vidro e Máquina',
        cat: 'aco',
        mat: 'Aço Laminado Estrutural Automotivo',
        peso: 18.2,
        fator: 2.85,
        co2e: 51.87,
        ncm: '8708.29.99',
      },
      {
        sub: 'Carroceria',
        sku: 'CLIO-CAR-04',
        selo: 'PR-SEAL-2026-000142',
        desc: 'Porta Dianteira Direita Completa com Vidro e Máquina',
        cat: 'aco',
        mat: 'Aço Laminado Estrutural Automotivo',
        peso: 18.2,
        fator: 2.85,
        co2e: 51.87,
        ncm: '8708.29.99',
      },
      {
        sub: 'Carroceria',
        sku: 'CLIO-CAR-05',
        selo: 'PR-SEAL-2026-000143',
        desc: 'Porta Traseira Esquerda com Guarnições',
        cat: 'aco',
        mat: 'Aço Laminado Estrutural Automotivo',
        peso: 16.5,
        fator: 2.85,
        co2e: 47.03,
        ncm: '8708.29.99',
      },
      {
        sub: 'Carroceria',
        sku: 'CLIO-CAR-06',
        selo: 'PR-SEAL-2026-000144',
        desc: 'Porta Traseira Direita com Guarnições',
        cat: 'aco',
        mat: 'Aço Laminado Estrutural Automotivo',
        peso: 16.5,
        fator: 2.85,
        co2e: 47.03,
        ncm: '8708.29.99',
      },
      {
        sub: 'Carroceria',
        sku: 'CLIO-CAR-07',
        selo: 'PR-SEAL-2026-000145',
        desc: 'Paralama Dianteiro Esquerdo Estampado',
        cat: 'aco',
        mat: 'Aço Laminado Automotivo',
        peso: 4.8,
        fator: 2.85,
        co2e: 13.68,
        ncm: '8708.29.99',
      },
      {
        sub: 'Carroceria',
        sku: 'CLIO-CAR-08',
        selo: 'PR-SEAL-2026-000146',
        desc: 'Paralama Dianteiro Direito Estampado',
        cat: 'aco',
        mat: 'Aço Laminado Automotivo',
        peso: 4.8,
        fator: 2.85,
        co2e: 13.68,
        ncm: '8708.29.99',
      },
      {
        sub: 'Carroceria',
        sku: 'CLIO-CAR-09',
        selo: 'PR-SEAL-2026-000147',
        desc: 'Parachoque Dianteiro Termoplástico Injetado',
        cat: 'polimeros',
        mat: 'Polipropileno Automotivo (PP/EPDM)',
        peso: 4.2,
        fator: 1.9,
        co2e: 7.98,
        ncm: '8708.10.00',
      },
      {
        sub: 'Carroceria',
        sku: 'CLIO-CAR-10',
        selo: 'PR-SEAL-2026-000148',
        desc: 'Parachoque Traseiro Termoplástico Injetado',
        cat: 'polimeros',
        mat: 'Polipropileno Automotivo (PP/EPDM)',
        peso: 4.6,
        fator: 1.9,
        co2e: 8.74,
        ncm: '8708.10.00',
      },
      {
        sub: 'Carroceria',
        sku: 'CLIO-CAR-11',
        selo: 'PR-SEAL-2026-000149',
        desc: 'Alma de Aço Reforço Estrutural do Parachoque',
        cat: 'aco',
        mat: 'Aço Ultra Alta Resistência (UHSS)',
        peso: 5.5,
        fator: 2.85,
        co2e: 15.68,
        ncm: '8708.10.00',
      },
    ]

    // Inserir as 49 peças de forma idempotente
    for (const p of pecasData) {
      let pecaRecord
      try {
        pecaRecord = app.findFirstRecordByData('cdv_pecas', 'selo_dpp', p.selo)
      } catch (_) {
        pecaRecord = new Record(pecasCol)
      }

      // Canônico determinístico conforme padrão da plataforma:
      // selo_dpp|sku_interno|descricao_peca|peso_kg.toFixed(2)|co2e_evitado_kg.toFixed(2)|baixaNorm|cnpjNorm
      const pesoFormatted = Number(p.peso).toFixed(2)
      const co2eFormatted = Number(p.co2e).toFixed(2)
      const canonicalStr = `${p.selo}|${p.sku}|${p.desc}|${pesoFormatted}|${co2eFormatted}|${demoBaixa}|${demoCnpj}`
      const sha = $security.sha256(canonicalStr)

      pecaRecord.set('lote', demoLoteRecord.id)
      pecaRecord.set('sku_interno', p.sku)
      pecaRecord.set('selo_dpp', p.selo)
      pecaRecord.set('descricao_peca', p.desc)
      pecaRecord.set('categoria_material', p.cat)
      pecaRecord.set('material_declarado', p.mat)
      pecaRecord.set('peso_kg', p.peso)
      pecaRecord.set('ncm', p.ncm)
      pecaRecord.set('fator_co2e_kg', p.fator)
      pecaRecord.set('co2e_evitado_kg', p.co2e)
      pecaRecord.set('hash_sha256', sha)
      pecaRecord.set('responsavel_crea', demoCrea)
      pecaRecord.set('cdv_origem', demoCdvCodigo)
      pecaRecord.set('cdv_cnpj', demoCnpj)
      pecaRecord.set('status', 'ativo')
      pecaRecord.set('veiculo_marca_modelo', demoModelo)
      pecaRecord.set('veiculo_chassi_mascarado', demoChassi)
      pecaRecord.set('veiculo_baixa_detran', demoBaixa)
      pecaRecord.set('veiculo_seguradora', demoSeguradora)
      pecaRecord.set('subsistema', p.sub)

      app.save(pecaRecord)
    }
  },
  (app) => {
    // Reverter lote demo e peças vinculadas
    const demoCartela = '12401050711'
    try {
      const lote = app.findFirstRecordByData('cdv_lotes', 'cartela_desmontagem', demoCartela)
      // Excluir peças associadas
      const pecas = app.findRecordsByFilter('cdv_pecas', `lote = '${lote.id}'`, '', 100, 0)
      for (const p of pecas) {
        try {
          app.delete(p)
        } catch (_) {}
      }
      app.delete(lote)
    } catch (_) {}
  },
)
