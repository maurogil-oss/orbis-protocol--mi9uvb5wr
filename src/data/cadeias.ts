export interface CadeiaProdutiva {
  id: string
  nome: string
  icone: string
  fatorEmissao: string
  regulamentacao: string
  descricao: string
  principaisIndicadores: string[]
  tipoLaudo: string
}

export const CADEIAS_PRODUTIVAS: CadeiaProdutiva[] = [
  {
    id: 'agro',
    nome: 'Agronegócio & Grãos',
    icone: 'Sprout',
    fatorEmissao: 'Metano entérico, N2O fertilizantes e diesel agrícola',
    regulamentacao: 'Plano ABC+, Protocolo Carne Baixo Carbono e Lei 15.042',
    descricao:
      'Rastreabilidade de cadeias de soja, milho, pecuária de corte e leite. Mensuração de carbono no solo, emissões biogênicas e comprovação de compliance contra desmatamento (EUDR).',
    principaisIndicadores: [
      'tCO2e/ha por safra',
      'Balanço de Carbono no Solo',
      'Rastreio de defensivos e sementes',
    ],
    tipoLaudo: 'Laudo Pericial de Produção Sustentável & Aptidão Exportadora',
  },
  {
    id: 'siderurgia',
    nome: 'Siderurgia & Aço Verde',
    icone: 'Flame',
    fatorEmissao: 'Coque de carvão mineral, bio-redutores e energia elétrica',
    regulamentacao: 'CBAM União Europeia, ISO 14064 e SBCE',
    descricao:
      'Auditoria de altos-fornos, aciarias e laminação. Identificação de uso de carvão vegetal de florestas plantadas, hidrogênio verde e reciclagem de sucata ferrosa.',
    principaisIndicadores: [
      'tCO2e/t de aço bruto',
      'Índice de sucata reciclada',
      'Emissões incorporadas CBAM',
    ],
    tipoLaudo: 'Declaração Probatória de Emissões Incorporadas CBAM',
  },
  {
    id: 'cimento',
    nome: 'Cimento & Concreto',
    icone: 'Box',
    fatorEmissao: 'Descarbonatação do calcário e combustão de clínquer',
    regulamentacao: 'Roadmap de Transição Climática da Indústria de Cimento (SNIC)',
    descricao:
      'Rastreio do fator clínquer/cimento, coprocessamento de resíduos industriais em fornos rotativos e incorporação de pozolanas e escórias de alto-forno.',
    principaisIndicadores: [
      'kg CO2/t cimento',
      'Taxa de substituição térmica',
      'Fator clínquer/cimento (%)',
    ],
    tipoLaudo: 'Laudo de Coprocessamento e Eficiência de Clínquer',
  },
  {
    id: 'energia',
    nome: 'Energia Renovável & Biogás',
    icone: 'Zap',
    fatorEmissao: 'Fator médio da matriz do SIN / MCTI e deslocamento fóssil',
    regulamentacao: 'RECs (I-REC), RenovaBio e Mercado Livre de Energia',
    descricao:
      'Certificação de usinas solares, eólicas, PCHs e plantas de biometano. Emissão de atestados de origem e cálculo de emissões evitadas para consumidores industriais.',
    principaisIndicadores: ['MWh gerado renovável', 'tCO2e evitadas', 'Garantia de Origem I-REC'],
    tipoLaudo: 'Atestado de Descarbonização Energética de Escopo 2',
  },
  {
    id: 'quimica',
    nome: 'Indústria Química & Petroquímica',
    icone: 'FlaskConical',
    fatorEmissao: 'Consumo de gás natural, reações de craqueamento e nafta',
    regulamentacao: 'Atuação Responsável (ABIQUIM) e SBCE',
    descricao:
      'Monitoramento de rotas de síntese química, recuperação de calor, eficiência de catalisadores e introdução de insumos de base biológica e química verde.',
    principaisIndicadores: [
      'Emissões por tonelada de intermediário',
      'Consumo térmico específico',
      'Eficiência de matéria-prima',
    ],
    tipoLaudo: 'Relatório Técnico de Intensidade Carbônica Industrial',
  },
  {
    id: 'logistica',
    nome: 'Logística & Transporte de Cargas',
    icone: 'Truck',
    fatorEmissao: 'Óleo diesel S10/S500, Biodiesel B14 e combustível marítimo',
    regulamentacao: 'Programa Despoluir (CNT), Diretrizes GLEC e GHG Protocol Escopo 3',
    descricao:
      'Rastreamento de frotas pesadas rodoviárias, cabotagem e transporte ferroviário. Apuração de emissões por tonelada-quilômetro útil (TKU) e telemetria fiscal.',
    principaisIndicadores: [
      'g CO2e / TKU',
      'Consumo específico de diesel',
      '% Mistura de biocombustíveis',
    ],
    tipoLaudo: 'Laudo Pericial de Logística de Baixo Carbono (Escopo 3)',
  },
  {
    id: 'textil',
    nome: 'Têxtil, Confecção & Calçados',
    icone: 'Scissors',
    fatorEmissao: 'Tingimento, caldeiras a biomassa e matérias sintéticas',
    regulamentacao: 'ABVTEX, Selo Algodão Brasileiro Responsável (ABR)',
    descricao:
      'Rastreio do fio do algodão certificado, controle de efluentes hídricos no beneficiamento têxtil e logística reversa de resíduos de corte e aparas.',
    principaisIndicadores: [
      'Litros d’água / kg tecido',
      'Índice de fibras recicladas',
      'Rastreabilidade de cadeia fornecedora',
    ],
    tipoLaudo: 'Atestado de Rastreabilidade de Cadeia Têxtil e Hídrica',
  },
  {
    id: 'mineracao',
    nome: 'Mineração & Minerais Críticos',
    icone: 'Pickaxe',
    fatorEmissao: 'Frota pesada de lavra aberta, britagem e explosivos',
    regulamentacao: 'Normas ANM, Padrões IRMA e Lei 15.042',
    descricao:
      'Inventário completo de lavra de minério de ferro, bauxita, lítio e terras raras. Eletrificação de caminhões fora-de-estrada e segurança de barragens.',
    principaisIndicadores: [
      'tCO2e/t ROM',
      'Consumo elétrico por tonelada britada',
      'Gestão de rejeitos estéreis',
    ],
    tipoLaudo: 'Laudo de Sustentabilidade Operacional da Lavra',
  },
  {
    id: 'automotiva',
    nome: 'Indústria Automotiva & Autopeças',
    icone: 'Car',
    fatorEmissao: 'Estamparia, pintura robotizada e soldagem industrial',
    regulamentacao: 'Programa MOVER (Lei 14.902/2024) e DPP Detran',
    descricao:
      'Governança da cadeia de suprimentos de montadoras. Apuração do índice de reciclabilidade veicular, desmontagem credenciada e concessão de incentivos de IPI.',
    principaisIndicadores: [
      'Índice de Reciclabilidade (%)',
      'Créditos IPI apurados',
      'Passaporte Digital de Peças',
    ],
    tipoLaudo: 'Dossiê Técnico Probatório MOVER / IPI (Exclusivo CDVs e Montadoras)',
  },
  {
    id: 'alimentos',
    nome: 'Alimentos & Bebidas',
    icone: 'UtensilsCrossed',
    fatorEmissao: 'Refrigeração industrial (gases fluorados) e caldeiras',
    regulamentacao: 'SIF / MAPA, ISO 22000 e GHG Protocol',
    descricao:
      'Auditoria de frigoríficos, laticínios, cervejarias e processadoras de alimentos. Rastreabilidade de perdas térmicas, efluentes biológicos e embalagens pós-consumo.',
    principaisIndicadores: [
      'kg CO2e por lote produzido',
      'Fuga de fluidos refrigerantes',
      'Eficiência de caldeiras a vapor',
    ],
    tipoLaudo: 'Certificado de Conformidade Sanitário-Ambiental',
  },
  {
    id: 'papel',
    nome: 'Papel & Celulose',
    icone: 'Trees',
    fatorEmissao: 'Lixívia negra, caldeiras de recuperação e biomassa florestal',
    regulamentacao: 'Certificação FSC / PEFC, Resolução Conama e SBCE',
    descricao:
      'Balanço neutro ou negativo de carbono em maciços de eucalipto e pinus. Auditoria da queima de biomassa renovável e cogeração elétrica excedentária para o SIN.',
    principaisIndicadores: [
      'Remoções florestais líquidas',
      'Geração de energia excedentária',
      'Consumo de alvejantes',
    ],
    tipoLaudo: 'Laudo Pericial de Carbono Biogênico Florestal',
  },
  {
    id: 'plasticos',
    nome: 'Plásticos & Polímeros',
    icone: 'Recycle',
    fatorEmissao: 'Injeção, extrusão e consumo de resinas fósseis',
    regulamentacao: 'Plano Nacional de Resíduos Sólidos (PNRS) e Créditos de Reciclagem',
    descricao:
      'Comprovação da introdução de resina pós-consumo reciclada (PCR) em linhas industriais, certificação de reciclagem mecânica e créditos de logística reversa.',
    principaisIndicadores: [
      '% PCR incorporado',
      'Consumo de energia por kg injetado',
      'Créditos de reciclagem emitidos',
    ],
    tipoLaudo: 'Atestado de Circularidade de Polímeros & PNRS',
  },
  {
    id: 'farmaceutica',
    nome: 'Indústria Farmacêutica & Cosmética',
    icone: 'Stethoscope',
    fatorEmissao: 'Salas limpas com HVAC contínuo e solventes industriais',
    regulamentacao: 'Anvisa RDC 658/2022 e Protocolos ESG Pharma',
    descricao:
      'Rastreabilidade de princípios ativos (IFAs), descarte certificado de medicamentos vencidos e eficiência energética de sistemas de esterilização e filtração HEPA.',
    principaisIndicadores: [
      'Consumo HVAC / m²',
      'Gestão de resíduos classe 1',
      'Rastreio de solventes voláteis',
    ],
    tipoLaudo: 'Laudo de Auditoria ESG Hospitalar & Farmacêutico',
  },
  {
    id: 'construcao',
    nome: 'Construção Civil & Infraestrutura',
    icone: 'Hammer',
    fatorEmissao: 'Transporte de terraplanagem, aço, concreto e resíduos (RCD)',
    regulamentacao: 'Certificação LEED, AQUA-HQE e PBQP-H',
    descricao:
      'Mensuração do carbono embutido na fase de obra. Destinação de resíduos da construção civil para britagem de agregados reciclados e redução de perdas de cimento.',
    principaisIndicadores: [
      'tCO2e por m² construído',
      'Taxa de desvio de aterro de RCD',
      'Consumo de agregados reciclados',
    ],
    tipoLaudo: 'Atestado de Baixo Carbono para Canteiros de Obra',
  },
  {
    id: 'varejo',
    nome: 'Comércio Varejista & Serviços',
    icone: 'ShoppingBag',
    fatorEmissao: 'Ar-condicionado central, iluminação e logística de entrega urbana',
    regulamentacao: 'Diretrizes ACP / IBESG e Novo IVA',
    descricao:
      'Adequação ágil para pequenas e médias empresas do setor comercial. Selo Oficial de Sustentabilidade para vitrines e lojas com redução de spread em bancos parceiros.',
    principaisIndicadores: [
      'Eficiência energética kWh/m²',
      'Logística reversa de embalagens',
      'Score ESG simplificado',
    ],
    tipoLaudo: 'Selo Oficial de Conformidade para Comércio & Serviços',
  },
]
