migrate(
  (app) => {
    // 1. Colecao platform_settings
    // Campos: chave unica, valor, atualizado_por, atualizado_em
    // Regras: leitura publica, escrita so admin
    if (!app.hasTable('platform_settings')) {
      const settingsCol = new Collection({
        name: 'platform_settings',
        type: 'base',
        listRule: '',
        viewRule: '',
        createRule: "@request.auth.id != '' && @request.auth.role = 'admin'",
        updateRule: "@request.auth.id != '' && @request.auth.role = 'admin'",
        deleteRule: "@request.auth.id != '' && @request.auth.role = 'admin'",
        fields: [
          { name: 'chave', type: 'text', required: true },
          { name: 'valor', type: 'text', required: true },
          { name: 'atualizado_por', type: 'text' },
          { name: 'atualizado_em', type: 'text' },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: ['CREATE UNIQUE INDEX idx_platform_settings_chave ON platform_settings (chave)'],
      })
      app.save(settingsCol)

      // Seed mover_ampliado_habilitado = 'false'
      try {
        app.findFirstRecordByData('platform_settings', 'chave', 'mover_ampliado_habilitado')
      } catch (_) {
        const record = new Record(settingsCol)
        record.set('chave', 'mover_ampliado_habilitado')
        record.set('valor', 'false')
        record.set('atualizado_por', 'sistema_migracao')
        record.set('atualizado_em', new Date().toISOString())
        app.save(record)
      }
    }

    // 2. Adicionar campos novos em cdv_pecas:
    // catalogo_numero (number opcional)
    // situacao_checklist (select 'etiquetada'|'nao_desmontada'|'inservivel'|'nao_aplicavel_ausente'|'aguardando_avaliacao')
    const pecasCol = app.findCollectionByNameOrId('cdv_pecas')
    if (!pecasCol.fields.getByName('catalogo_numero')) {
      pecasCol.fields.add(new NumberField({ name: 'catalogo_numero', onlyInt: true }))
    }
    if (!pecasCol.fields.getByName('situacao_checklist')) {
      pecasCol.fields.add(
        new SelectField({
          name: 'situacao_checklist',
          values: [
            'etiquetada',
            'nao_desmontada',
            'inservivel',
            'nao_aplicavel_ausente',
            'aguardando_avaliacao',
          ],
          maxSelect: 1,
        }),
      )
    }
    app.save(pecasCol)

    // 3. Colecao cdv_pecas_catalogo com os 77 registros do checklist:
    // Campos: numero (int unico), nome_peca (text), origem (select '611_vigente'|'ampliada_mover'), subsistema (text), item_seguranca (bool), notas (text)
    // Regras: leitura publica, escrita so admin
    if (!app.hasTable('cdv_pecas_catalogo')) {
      const catCol = new Collection({
        name: 'cdv_pecas_catalogo',
        type: 'base',
        listRule: '',
        viewRule: '',
        createRule: "@request.auth.id != '' && @request.auth.role = 'admin'",
        updateRule: "@request.auth.id != '' && @request.auth.role = 'admin'",
        deleteRule: "@request.auth.id != '' && @request.auth.role = 'admin'",
        fields: [
          { name: 'numero', type: 'number', required: true, onlyInt: true },
          { name: 'nome_peca', type: 'text', required: true },
          {
            name: 'origem',
            type: 'select',
            required: true,
            values: ['611_vigente', 'ampliada_mover'],
            maxSelect: 1,
          },
          { name: 'subsistema', type: 'text', required: true },
          { name: 'item_seguranca', type: 'bool' },
          { name: 'notas', type: 'text' },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE UNIQUE INDEX idx_cdv_pecas_catalogo_numero ON cdv_pecas_catalogo (numero)',
        ],
      })
      app.save(catCol)
    }

    const catalogoCol = app.findCollectionByNameOrId('cdv_pecas_catalogo')

    // 77 Registros: 49 '611_vigente' e 28 'ampliada_mover'
    const itensCatalogo = [
      // ------------------------------------------------------------------------
      // 49 PECAS CONTRAN 611/2016 VIGENTE (itens de seguranca marcados com true)
      // ------------------------------------------------------------------------
      // MOTOR (8 itens)
      {
        numero: 1,
        nome: 'Bloco do Motor com Mancais',
        origem: '611_vigente',
        sub: 'Motor',
        seguranca: false,
        notas: 'Lista parametrizável pelo parceiro metodológico.',
      },
      {
        numero: 2,
        nome: 'Cabeçote do Motor Usinado',
        origem: '611_vigente',
        sub: 'Motor',
        seguranca: false,
        notas: 'Lista parametrizável pelo parceiro metodológico.',
      },
      {
        numero: 3,
        nome: 'Virabrequim / Árvore de Manivelas',
        origem: '611_vigente',
        sub: 'Motor',
        seguranca: false,
        notas: 'Lista parametrizável pelo parceiro metodológico.',
      },
      {
        numero: 4,
        nome: 'Comando de Válvulas Admissão e Escape',
        origem: '611_vigente',
        sub: 'Motor',
        seguranca: false,
        notas: 'Lista parametrizável pelo parceiro metodológico.',
      },
      {
        numero: 5,
        nome: 'Cárter de Óleo do Motor',
        origem: '611_vigente',
        sub: 'Motor',
        seguranca: false,
        notas: 'Lista parametrizável pelo parceiro metodológico.',
      },
      {
        numero: 6,
        nome: 'Coletor de Admissão',
        origem: '611_vigente',
        sub: 'Motor',
        seguranca: false,
        notas: 'Lista parametrizável pelo parceiro metodológico.',
      },
      {
        numero: 7,
        nome: 'Volante do Motor Bimassa / Convencional',
        origem: '611_vigente',
        sub: 'Motor',
        seguranca: false,
        notas: 'Lista parametrizável pelo parceiro metodológico.',
      },
      {
        numero: 8,
        nome: 'Bomba de Óleo e Engrenagens',
        origem: '611_vigente',
        sub: 'Motor',
        seguranca: false,
        notas: 'Lista parametrizável pelo parceiro metodológico.',
      },

      // CAMBIO E TRANSMISSAO (4 itens)
      {
        numero: 9,
        nome: 'Carcaça da Caixa de Câmbio / Transmissão',
        origem: '611_vigente',
        sub: 'Câmbio',
        seguranca: false,
        notas: 'Lista parametrizável pelo parceiro metodológico.',
      },
      {
        numero: 10,
        nome: 'Conjunto de Engrenagens e Eixos Primário/Secundário',
        origem: '611_vigente',
        sub: 'Câmbio',
        seguranca: false,
        notas: 'Lista parametrizável pelo parceiro metodológico.',
      },
      {
        numero: 11,
        nome: 'Diferencial com Coroa e Pinhão',
        origem: '611_vigente',
        sub: 'Câmbio',
        seguranca: false,
        notas: 'Lista parametrizável pelo parceiro metodológico.',
      },
      {
        numero: 12,
        nome: 'Garfo Seletor e Varetas de Trambulador',
        origem: '611_vigente',
        sub: 'Câmbio',
        seguranca: false,
        notas: 'Lista parametrizável pelo parceiro metodológico.',
      },

      // ELETRICA E ELETRONICA (6 itens)
      {
        numero: 13,
        nome: 'Alternador com Bobinamento de Cobre',
        origem: '611_vigente',
        sub: 'Elétrica',
        seguranca: false,
        notas: 'Lista parametrizável pelo parceiro metodológico.',
      },
      {
        numero: 14,
        nome: 'Motor de Partida / Arranque',
        origem: '611_vigente',
        sub: 'Elétrica',
        seguranca: false,
        notas: 'Lista parametrizável pelo parceiro metodológico.',
      },
      {
        numero: 15,
        nome: 'Chicote Elétrico Principal do Vão do Motor',
        origem: '611_vigente',
        sub: 'Elétrica',
        seguranca: false,
        notas: 'Lista parametrizável pelo parceiro metodológico.',
      },
      {
        numero: 16,
        nome: 'Módulo de Injeção Eletrônica (ECU)',
        origem: '611_vigente',
        sub: 'Elétrica',
        seguranca: false,
        notas: 'Lista parametrizável pelo parceiro metodológico.',
      },
      {
        numero: 17,
        nome: 'Conjunto de Bobina de Ignição e Cabos',
        origem: '611_vigente',
        sub: 'Elétrica',
        seguranca: false,
        notas: 'Lista parametrizável pelo parceiro metodológico.',
      },
      {
        numero: 18,
        nome: 'Painel de Instrumentos Analógico / Digital',
        origem: '611_vigente',
        sub: 'Elétrica',
        seguranca: false,
        notas: 'Lista parametrizável pelo parceiro metodológico.',
      },

      // DIRECAO (3 itens - Caixa de direcao e Item de Seguranca conforme Res. 611 art. 4º)
      {
        numero: 19,
        nome: 'Caixa de Direção Hidráulica / Mecânica / Elétrica',
        origem: '611_vigente',
        sub: 'Direção',
        seguranca: true,
        notas:
          'Item de segurança conforme Res. CONTRAN 611/2016 Art. 4º. Destinação restrita a recondicionamento/reciclagem. Lista parametrizável pelo parceiro metodológico.',
      },
      {
        numero: 20,
        nome: 'Bomba de Direção Hidráulica',
        origem: '611_vigente',
        sub: 'Direção',
        seguranca: false,
        notas: 'Lista parametrizável pelo parceiro metodológico.',
      },
      {
        numero: 21,
        nome: 'Coluna de Direção Articulada',
        origem: '611_vigente',
        sub: 'Direção',
        seguranca: false,
        notas: 'Lista parametrizável pelo parceiro metodológico.',
      },

      // SUSPENSAO (6 itens - Amortecedores e Eixo Traseiro com notas especificas)
      {
        numero: 22,
        nome: 'Quadro Subchassi Dianteiro (Agregado da Suspensão)',
        origem: '611_vigente',
        sub: 'Suspensão',
        seguranca: false,
        notas: 'Lista parametrizável pelo parceiro metodológico.',
      },
      {
        numero: 23,
        nome: 'Eixo Traseiro com Barra de Torção Integrada',
        origem: '611_vigente',
        sub: 'Suspensão',
        seguranca: false,
        notas:
          'Eixo traseiro (enquadramento pendente quanto à restrição integral de segurança versus recondicionamento técnico). Lista parametrizável pelo parceiro metodológico.',
      },
      {
        numero: 24,
        nome: 'Conjunto de Amortecedores Dianteiros',
        origem: '611_vigente',
        sub: 'Suspensão',
        seguranca: true,
        notas:
          'Item de segurança conforme Res. CONTRAN 611/2016 Art. 4º. Lista parametrizável pelo parceiro metodológico.',
      },
      {
        numero: 25,
        nome: 'Conjunto de Amortecedores Traseiros',
        origem: '611_vigente',
        sub: 'Suspensão',
        seguranca: true,
        notas:
          'Item de segurança conforme Res. CONTRAN 611/2016 Art. 4º. Lista parametrizável pelo parceiro metodológico.',
      },
      {
        numero: 26,
        nome: 'Bandejas e Braços Oscilantes Dianteiros (Par)',
        origem: '611_vigente',
        sub: 'Suspensão',
        seguranca: false,
        notas: 'Lista parametrizável pelo parceiro metodológico.',
      },
      {
        numero: 27,
        nome: 'Manga de Eixo Dianteira com Cubo e Rolamento (Par)',
        origem: '611_vigente',
        sub: 'Suspensão',
        seguranca: false,
        notas: 'Lista parametrizável pelo parceiro metodológico.',
      },

      // FREIOS (4 itens - Discos, Pastilhas, Cilindro Mestre, Servofreio = Itens de Seguranca)
      {
        numero: 28,
        nome: 'Discos e Pastilhas de Freio Dianteiro (Par)',
        origem: '611_vigente',
        sub: 'Freios',
        seguranca: true,
        notas:
          'Item de segurança conforme Res. CONTRAN 611/2016 Art. 4º. Destinação restrita a reciclagem. Lista parametrizável pelo parceiro metodológico.',
      },
      {
        numero: 29,
        nome: 'Pinças de Freio Hidráulico com Êmbolos (Par)',
        origem: '611_vigente',
        sub: 'Freios',
        seguranca: false,
        notas:
          'Carcaça de pinça passível de recondicionamento técnico. Lista parametrizável pelo parceiro metodológico.',
      },
      {
        numero: 30,
        nome: 'Tambores de Freio Traseiro com Sapatas (Par)',
        origem: '611_vigente',
        sub: 'Freios',
        seguranca: false,
        notas: 'Lista parametrizável pelo parceiro metodológico.',
      },
      {
        numero: 31,
        nome: 'Servofreio Hidrovácuo e Cilindro Mestre Duplo',
        origem: '611_vigente',
        sub: 'Freios',
        seguranca: true,
        notas:
          'Item de segurança conforme Res. CONTRAN 611/2016 Art. 4º (Cilindro Mestre). Lista parametrizável pelo parceiro metodológico.',
      },

      // ARREFECIMENTO E CLIMATIZACAO (4 itens)
      {
        numero: 32,
        nome: 'Radiador de Água do Motor em Alumínio Brasado',
        origem: '611_vigente',
        sub: 'Arrefecimento',
        seguranca: false,
        notas: 'Lista parametrizável pelo parceiro metodológico.',
      },
      {
        numero: 33,
        nome: 'Condensador do Ar-Condicionado em Alumínio',
        origem: '611_vigente',
        sub: 'Arrefecimento',
        seguranca: false,
        notas: 'Lista parametrizável pelo parceiro metodológico.',
      },
      {
        numero: 34,
        nome: 'Conjunto Eletroventilador e Defletor Termoplástico',
        origem: '611_vigente',
        sub: 'Arrefecimento',
        seguranca: false,
        notas: 'Lista parametrizável pelo parceiro metodológico.',
      },
      {
        numero: 35,
        nome: 'Reservatório de Expansão e Mangueiras EPDM',
        origem: '611_vigente',
        sub: 'Arrefecimento',
        seguranca: false,
        notas: 'Lista parametrizável pelo parceiro metodológico.',
      },

      // ESCAPAMENTO (3 itens)
      {
        numero: 36,
        nome: 'Coletor de Escape Tubular',
        origem: '611_vigente',
        sub: 'Escape',
        seguranca: false,
        notas: 'Lista parametrizável pelo parceiro metodológico.',
      },
      {
        numero: 37,
        nome: 'Tubo Intermediário de Escape com Abafador',
        origem: '611_vigente',
        sub: 'Escape',
        seguranca: false,
        notas: 'Lista parametrizável pelo parceiro metodológico.',
      },
      {
        numero: 38,
        nome: 'Silencioso Traseiro com Ponteira de Escape',
        origem: '611_vigente',
        sub: 'Escape',
        seguranca: false,
        notas: 'Lista parametrizável pelo parceiro metodológico.',
      },

      // CARROCERIA EXTERNA (11 itens)
      {
        numero: 39,
        nome: 'Capô Dianteiro em Chapa de Aço Estampada',
        origem: '611_vigente',
        sub: 'Carroceria',
        seguranca: false,
        notas: 'Lista parametrizável pelo parceiro metodológico.',
      },
      {
        numero: 40,
        nome: 'Tampa Traseira do Porta-Malas com Vigia',
        origem: '611_vigente',
        sub: 'Carroceria',
        seguranca: false,
        notas: 'Lista parametrizável pelo parceiro metodológico.',
      },
      {
        numero: 41,
        nome: 'Porta Dianteira Esquerda Completa',
        origem: '611_vigente',
        sub: 'Carroceria',
        seguranca: false,
        notas: 'Lista parametrizável pelo parceiro metodológico.',
      },
      {
        numero: 42,
        nome: 'Porta Dianteira Direita Completa',
        origem: '611_vigente',
        sub: 'Carroceria',
        seguranca: false,
        notas: 'Lista parametrizável pelo parceiro metodológico.',
      },
      {
        numero: 43,
        nome: 'Porta Traseira Esquerda Completa',
        origem: '611_vigente',
        sub: 'Carroceria',
        seguranca: false,
        notas: 'Lista parametrizável pelo parceiro metodológico.',
      },
      {
        numero: 44,
        nome: 'Porta Traseira Direita Completa',
        origem: '611_vigente',
        sub: 'Carroceria',
        seguranca: false,
        notas: 'Lista parametrizável pelo parceiro metodológico.',
      },
      {
        numero: 45,
        nome: 'Paralama Dianteiro Esquerdo Estampado',
        origem: '611_vigente',
        sub: 'Carroceria',
        seguranca: false,
        notas: 'Lista parametrizável pelo parceiro metodológico.',
      },
      {
        numero: 46,
        nome: 'Paralama Dianteiro Direito Estampado',
        origem: '611_vigente',
        sub: 'Carroceria',
        seguranca: false,
        notas: 'Lista parametrizável pelo parceiro metodológico.',
      },
      {
        numero: 47,
        nome: 'Parachoque Dianteiro Termoplástico Injetado',
        origem: '611_vigente',
        sub: 'Carroceria',
        seguranca: false,
        notas: 'Lista parametrizável pelo parceiro metodológico.',
      },
      {
        numero: 48,
        nome: 'Parachoque Traseiro Termoplástico Injetado',
        origem: '611_vigente',
        sub: 'Carroceria',
        seguranca: false,
        notas: 'Lista parametrizável pelo parceiro metodológico.',
      },
      {
        numero: 49,
        nome: 'Alma de Aço Reforço Estrutural do Parachoque',
        origem: '611_vigente',
        sub: 'Carroceria',
        seguranca: false,
        notas: 'Lista parametrizável pelo parceiro metodológico.',
      },

      // ------------------------------------------------------------------------
      // 28 PECAS AMPLIADAS PROGRAMA MOVER (Rastreabilidade circular em validacao)
      // ------------------------------------------------------------------------
      // CLIMATIZACAO E FLUIDOS (com ressalva tecnica do compressor)
      {
        numero: 50,
        nome: 'Compressor do Ar-Condicionado Automotivo',
        origem: 'ampliada_mover',
        sub: 'Climatização',
        seguranca: false,
        notas:
          'Ressalva do compressor do ar-condicionado (a validar quanto à retenção de fluidos HFC/PAG e descontaminação de circuito fechado). Lista parametrizável pelo parceiro metodológico.',
      },
      {
        numero: 51,
        nome: 'Válvula de Expansão Térmica do Ar-Condicionado',
        origem: 'ampliada_mover',
        sub: 'Climatização',
        seguranca: false,
        notas: 'Lista parametrizável pelo parceiro metodológico.',
      },
      {
        numero: 52,
        nome: 'Evaporador da Caixa de Ar Interna',
        origem: 'ampliada_mover',
        sub: 'Climatização',
        seguranca: false,
        notas: 'Lista parametrizável pelo parceiro metodológico.',
      },
      {
        numero: 53,
        nome: 'Caixa de Ventilação e Climatização Interna (HVAC)',
        origem: 'ampliada_mover',
        sub: 'Climatização',
        seguranca: false,
        notas: 'Lista parametrizável pelo parceiro metodológico.',
      },

      // SISTEMA DE SEGURANCA PASSIVA (Itens de Seguranca com destinacao obrigatoria a reciclagem/neutralizacao)
      {
        numero: 54,
        nome: 'Módulo do Airbag do Motorista (Volante)',
        origem: 'ampliada_mover',
        sub: 'Segurança Passiva',
        seguranca: true,
        notas:
          'Item de segurança conforme Res. CONTRAN 611/2016 Art. 4º (sistema de air bags). Rastreabilidade ampliada para neutralização e reciclagem de componentes pirotécnicos. Lista parametrizável pelo parceiro metodológico.',
      },
      {
        numero: 55,
        nome: 'Módulo do Airbag do Passageiro (Painel)',
        origem: 'ampliada_mover',
        sub: 'Segurança Passiva',
        seguranca: true,
        notas:
          'Item de segurança conforme Res. CONTRAN 611/2016 Art. 4º. Lista parametrizável pelo parceiro metodológico.',
      },
      {
        numero: 56,
        nome: 'Módulos de Airbag de Cortina / Laterais (Par)',
        origem: 'ampliada_mover',
        sub: 'Segurança Passiva',
        seguranca: true,
        notas:
          'Item de segurança conforme Res. CONTRAN 611/2016 Art. 4º. Lista parametrizável pelo parceiro metodológico.',
      },
      {
        numero: 57,
        nome: 'Central Eletrônica de Disparo dos Airbags (SRS)',
        origem: 'ampliada_mover',
        sub: 'Segurança Passiva',
        seguranca: true,
        notas:
          'Item de segurança conforme Res. CONTRAN 611/2016 Art. 4º. Lista parametrizável pelo parceiro metodológico.',
      },
      {
        numero: 58,
        nome: 'Cintos de Segurança Dianteiros com Pré-tensionadores (Par)',
        origem: 'ampliada_mover',
        sub: 'Segurança Passiva',
        seguranca: true,
        notas:
          'Item de segurança conforme Res. CONTRAN 611/2016 Art. 4º (cintos de segurança e subsistemas). Lista parametrizável pelo parceiro metodológico.',
      },
      {
        numero: 59,
        nome: 'Cintos de Segurança Traseiros com Retratores (Conjunto)',
        origem: 'ampliada_mover',
        sub: 'Segurança Passiva',
        seguranca: true,
        notas:
          'Item de segurança conforme Res. CONTRAN 611/2016 Art. 4º. Lista parametrizável pelo parceiro metodológico.',
      },

      // SISTEMAS DE ALIMENTACAO, COMBUSTIVEL E CONTROLE DE POLUICAO
      {
        numero: 60,
        nome: 'Tanque de Combustível em Polietileno de Alta Densidade (HDPE)',
        origem: 'ampliada_mover',
        sub: 'Combustível',
        seguranca: false,
        notas:
          'Rastreabilidade de polímeros técnicos e descontaminação de hidrocarbonetos. Lista parametrizável pelo parceiro metodológico.',
      },
      {
        numero: 61,
        nome: 'Módulo da Bomba de Combustível e Boia Medidora',
        origem: 'ampliada_mover',
        sub: 'Combustível',
        seguranca: false,
        notas: 'Lista parametrizável pelo parceiro metodológico.',
      },
      {
        numero: 62,
        nome: 'Filtro de Carvão Ativado (Cânister de Emissões Evaporativas)',
        origem: 'ampliada_mover',
        sub: 'Combustível',
        seguranca: false,
        notas:
          'Controle de emissões fugitivas (PROCONVE). Lista parametrizável pelo parceiro metodológico.',
      },
      {
        numero: 63,
        nome: 'Flauta Distribuidora e Bicos Injetores de Combustível',
        origem: 'ampliada_mover',
        sub: 'Combustível',
        seguranca: false,
        notas: 'Lista parametrizável pelo parceiro metodológico.',
      },

      // VIDROS E ACABAMENTOS ESTRUTURAIS
      {
        numero: 64,
        nome: 'Vidro do Parabrisa Laminado com Serigrafia',
        origem: 'ampliada_mover',
        sub: 'Vidros',
        seguranca: true,
        notas:
          'Item de segurança conforme Res. CONTRAN 611/2016 Art. 4º (vidros com gravação de chassi). Destinação para reciclagem mineral. Lista parametrizável pelo parceiro metodológico.',
      },
      {
        numero: 65,
        nome: 'Vidro Vigia Traseiro com Desembaçador Térmico',
        origem: 'ampliada_mover',
        sub: 'Vidros',
        seguranca: true,
        notas:
          'Item de segurança com gravação de chassi. Destinação restrita a reciclagem. Lista parametrizável pelo parceiro metodológico.',
      },
      {
        numero: 66,
        nome: 'Vidros Laterais das Quatro Portas (Jogo)',
        origem: 'ampliada_mover',
        sub: 'Vidros',
        seguranca: true,
        notas:
          'Item de segurança com gravação de chassi. Destinação restrita a reciclagem. Lista parametrizável pelo parceiro metodológico.',
      },

      // INTERIOR, ASSENTOS E GUANICOES
      {
        numero: 67,
        nome: 'Bancos Dianteiros com Trilhos e Ajustes (Par)',
        origem: 'ampliada_mover',
        sub: 'Interior',
        seguranca: false,
        notas:
          'Reaproveitamento de espumas poliuretano e estruturas de aço. Lista parametrizável pelo parceiro metodológico.',
      },
      {
        numero: 68,
        nome: 'Banco Traseiro Bipartido com Encostos',
        origem: 'ampliada_mover',
        sub: 'Interior',
        seguranca: false,
        notas: 'Lista parametrizável pelo parceiro metodológico.',
      },
      {
        numero: 69,
        nome: 'Painel Central / Tabelier Completo com Difusores',
        origem: 'ampliada_mover',
        sub: 'Interior',
        seguranca: false,
        notas: 'Lista parametrizável pelo parceiro metodológico.',
      },
      {
        numero: 70,
        nome: 'Console Central e Alavanca do Freio de Estacionamento',
        origem: 'ampliada_mover',
        sub: 'Interior',
        seguranca: false,
        notas: 'Lista parametrizável pelo parceiro metodológico.',
      },
      {
        numero: 71,
        nome: 'Forros de Porta Termomoldados com Puxadores (Jogo)',
        origem: 'ampliada_mover',
        sub: 'Interior',
        seguranca: false,
        notas: 'Lista parametrizável pelo parceiro metodológico.',
      },

      // ILUMINACAO E SINALIZACAO EXTERNA
      {
        numero: 72,
        nome: 'Farol Dianteiro Principal Esquerdo em Policarbonato',
        origem: 'ampliada_mover',
        sub: 'Iluminação',
        seguranca: false,
        notas: 'Lista parametrizável pelo parceiro metodológico.',
      },
      {
        numero: 73,
        nome: 'Farol Dianteiro Principal Direito em Policarbonato',
        origem: 'ampliada_mover',
        sub: 'Iluminação',
        seguranca: false,
        notas: 'Lista parametrizável pelo parceiro metodológico.',
      },
      {
        numero: 74,
        nome: 'Lanterna Traseira Esquerda Bicolor',
        origem: 'ampliada_mover',
        sub: 'Iluminação',
        seguranca: false,
        notas: 'Lista parametrizável pelo parceiro metodológico.',
      },
      {
        numero: 75,
        nome: 'Lanterna Traseira Direita Bicolor',
        origem: 'ampliada_mover',
        sub: 'Iluminação',
        seguranca: false,
        notas: 'Lista parametrizável pelo parceiro metodológico.',
      },

      // RODAS E MOVIMENTACAO
      {
        numero: 76,
        nome: 'Jogo de Rodas de Liga Leve ou Aço Estampado (4 Unidades)',
        origem: 'ampliada_mover',
        sub: 'Rodas',
        seguranca: false,
        notas:
          'Desvio de sucata de alumínio/aço de alto valor circular. Lista parametrizável pelo parceiro metodológico.',
      },
      {
        numero: 77,
        nome: 'Roda Sobressalente (Estepe) com Pneu Sujeito à LR 11.413',
        origem: 'ampliada_mover',
        sub: 'Rodas',
        seguranca: false,
        notas:
          'Pneu integrado à cadeia de logística reversa obrigatória Decreto 11.413/2023. Lista parametrizável pelo parceiro metodológico.',
      },
    ]

    // Insercao idempotente dos 77 itens
    for (const item of itensCatalogo) {
      let rec
      try {
        rec = app.findFirstRecordByData('cdv_pecas_catalogo', 'numero', item.numero)
      } catch (_) {
        rec = new Record(catalogoCol)
      }
      rec.set('numero', item.numero)
      rec.set('nome_peca', item.nome)
      rec.set('origem', item.origem)
      rec.set('subsistema', item.sub)
      rec.set('item_seguranca', item.seguranca)
      rec.set('notas', item.notas)
      app.save(rec)
    }
  },
  (app) => {
    // Reversao
    try {
      const colCat = app.findCollectionByNameOrId('cdv_pecas_catalogo')
      app.delete(colCat)
    } catch (_) {}

    try {
      const colSet = app.findCollectionByNameOrId('platform_settings')
      app.delete(colSet)
    } catch (_) {}
  },
)
