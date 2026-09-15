export interface Trilha {
  slug: string
  lei: string
  titulo: string
  subtitulo: string
  descricao: string
  publico: string
  destaques: string[]
  objetivos: string[]
  modulos: {
    numero: string
    titulo: string
    duracao: string
    conteudo: string
    requerLogin: boolean
  }[]
  linkAuditor?: boolean
}

export const TRILHAS_DATA: Record<string, Trilha> = {
  mover: {
    slug: 'mover',
    lei: 'Lei 14.902/2024',
    titulo: 'Mobilidade Verde & Programa MOVER',
    subtitulo:
      'Rastreabilidade de economia circular para fabricantes, sistemistas, concessionárias e CDVs DETRAN.',
    descricao:
      'Capacitação completa e protocolo técnico para habilitação de incentivos fiscais de IPI através de rastreabilidade de peças reaproveitadas, Passaporte Digital de Produto (DPP) e governança de desmanches credenciados pelo DETRAN.',
    publico:
      'Centros de Desmontagem Veicular (CDV), Montadoras, Sistemistas de Autopeças, Recicladores e Oficinas.',
    destaques: [
      'Passaporte Digital de Produto (DPP) & Selo DETRAN',
      'Habilitação e auditoria de créditos financeiros de IPI',
      'Case Integrado CDVerde: peças de reúso e desmanche legal',
      'Rastreio de baterias elétricas automotivas (2ª Vida)',
    ],
    objetivos: [
      'Implementar rotina de inventário com rastreio QR Code por peça desmontada',
      'Validar o Passaporte Digital de Produto em conformidade com as diretrizes do MDIC',
      'Apurar índice de reciclabilidade e comprovar créditos financeiros do MOVER',
      'Gerar dossiê técnico de conformidade para auditoria da Receita Federal',
    ],
    modulos: [
      {
        numero: 'Módulo 01',
        titulo: 'Fundamentos da Lei 14.902/2024 e Requisitos do MOVER',
        duracao: '45 min',
        conteudo:
          'Visão geral da legislação do Programa Mobilidade Verde e Inovação. Requisitos de descarbonização do berço ao túmulo, metas de eficiência energética e benefícios tributários previstos para a cadeia automotiva nacional.',
        requerLogin: false,
      },
      {
        numero: 'Módulo 02',
        titulo: 'Estruturação do Passaporte Digital de Produto (DPP)',
        duracao: '60 min',
        conteudo:
          'Metodologia para atribuição de identidade digital criptográfica a componentes automotivos. Associação de dados de procedência, testes de bancada e histórico de uso veicular.',
        requerLogin: true,
      },
      {
        numero: 'Módulo 03',
        titulo: 'Operação de CDVs Credenciados & Selo DETRAN',
        duracao: '90 min',
        conteudo:
          'Fluxo operacional de recepção de Veículos em Fim de Vida (VFV), descontaminação de fluidos, catalogação de peças de reúso e integração com sistemas estaduais do DETRAN.',
        requerLogin: true,
      },
      {
        numero: 'Módulo 04',
        titulo: 'Auditoria de Créditos de IPI & Laudo Probatório',
        duracao: '75 min',
        conteudo:
          'Cálculo de alíquotas diferenciadas e crédito financeiro de IPI gerado pelo índice de circularidade. Emissão de laudo técnico chancelado para compensação tributária.',
        requerLogin: true,
      },
    ],
  },
  'sbce-financas-verdes': {
    slug: 'sbce-financas-verdes',
    lei: 'Lei 15.042/2024',
    titulo: 'Mercado SBCE & Finanças Verdes',
    subtitulo:
      'Contabilidade de carbono e alíquotas reguladas SBCE, mitigação tributária CBAM para exportação e captação bancária verde.',
    descricao:
      'Guia definitivo para CFOs, gestores de compliance e auditores sobre o Sistema Brasileiro de Comércio de Emissões de GEE, conformidade com IFRS S1/S2 e captação de crédito verde com spread reduzido.',
    publico:
      'Indústrias de Grande Porte, Exportadores para a União Europeia, Gestores Financeiros e Tesourarias.',
    destaques: [
      'Dossiê Verde para redução de spread (Bancos Públicos e Cooperativas)',
      'Gateway CBAM União Europeia: deduza tributo pago no BR',
      'Relatórios prontos para IFRS S2, GHG Protocol e Resolução CVM 244',
      'Cálculo de Cotas Brasileiras de Emissão (CBE)',
    ],
    objetivos: [
      'Estruturar o inventário corporativo de Escopo 1, 2 e 3 conforme GHG Protocol Brasil',
      'Calcular o impacto financeiro da Lei 15.042/2024 no planejamento tributário anual',
      'Construir a declaração para o mecanismo de fronteira de carbono europeu (CBAM)',
      'Habilitar a empresa aos descontos de spread bancário regulados pela Resolução Bacen 4.945',
    ],
    modulos: [
      {
        numero: 'Módulo 01',
        titulo: 'Arquitetura do SBCE: Lei 15.042/2024 e o Novo Mercado de Carbono',
        duracao: '50 min',
        conteudo:
          'Estrutura institucional do SBCE, limites de emissão acima de 10.000 tCO2e e 25.000 tCO2e, funcionamento das Cotas Brasileiras de Emissão (CBE) e Certificados de Redução Verificada de Emissões (CRVE).',
        requerLogin: false,
      },
      {
        numero: 'Módulo 02',
        titulo: 'Mecanismo de Ajuste Fronteiriço CBAM (União Europeia)',
        duracao: '80 min',
        conteudo:
          'Como exportadores de aço, alumínio, cimento, fertilizantes e químicos devem apurar e comprovar emissões incorporadas, evitando bitributação na aduana europeia.',
        requerLogin: true,
      },
      {
        numero: 'Módulo 03',
        titulo: 'Normas IFRS S1/S2 e Resolução CVM 244',
        duracao: '60 min',
        conteudo:
          'Demonstrações financeiras climáticas: conciliação entre riscos climáticos físicos, riscos de transição e as métricas contábeis auditáveis exigidas pelo mercado de capitais.',
        requerLogin: true,
      },
      {
        numero: 'Módulo 04',
        titulo: 'Dossiê Bancário Bacen 4.945 & Redução de Spread',
        duracao: '60 min',
        conteudo:
          'Passo a passo para estruturação do Dossiê Verde e negociação de taxas diferenciadas em linhas de BNDES, Banco do Brasil, Caixa e cooperativas de crédito (Sicredi/Sicoob).',
        requerLogin: true,
      },
    ],
  },
  'peritos-tecnicos': {
    slug: 'peritos-tecnicos',
    lei: 'NBC TO 3000 & ART TÉCNICA',
    titulo: 'Peritos Técnicos & Auditores Habilitados',
    subtitulo:
      'Credenciamento para profissionais habilitados (CREA, CRC, CONPEJ, OAB) com chancela pericial e emissão de laudos com fé pública.',
    descricao:
      'Trilha voltada a peritos contábeis, engenheiros avaliadores e auditores independentes que desejam atuar no ecossistema Orbis Protocol emitindo laudos técnicos dMRV com ART acoplada e remuneração profissional por perícia.',
    publico: 'Engenheiros CREA, Contadores/Auditores CRC, Advogados OAB e Peritos Judiciais.',
    destaques: [
      'Emissão de laudos periciais auditados vs não-auditados',
      'Anotação de Responsabilidade Técnica (ART/RRT) acoplada',
      'Remuneração por perícia e certificação no protocolo',
      'Acesso exclusivo ao Console do Auditor',
    ],
    objetivos: [
      'Dominar o padrão de laudo técnico probatório adotado pelo Orbis Protocol',
      'Conectar sua ART/RRT aos atestados digitais emitidos pela plataforma',
      'Utilizar o Console do Auditor para validar diagnósticos submetidos por clientes',
      'Credenciar seu registro de conselho no banco nacional de peritos dMRV',
    ],
    modulos: [
      {
        numero: 'Módulo 01',
        titulo: 'Normas Periciais: NBC TO 3000 e ABNT ISO 14064-3',
        duracao: '45 min',
        conteudo:
          'Padrões de asseguração limitada e razoável em dados ambientais e tributários. Deveres éticos, responsabilidade civil e valor probatório perante o Poder Judiciário e Fisco.',
        requerLogin: false,
      },
      {
        numero: 'Módulo 02',
        titulo: 'Ingestão e Verificação de Dados Fiscais (SPED/NF-e)',
        duracao: '70 min',
        conteudo:
          'Rotinas de conferência de CFOPs de insumos, fatores de emissão oficiais MCTI e conciliação de estoques de carbono e resíduos industriais.',
        requerLogin: true,
      },
      {
        numero: 'Módulo 03',
        titulo: 'Emissão de Laudos & Acoplamento da ART/RRT',
        duracao: '60 min',
        conteudo:
          'Assinatura digital padrão ICP-Brasil, geração do selo criptográfico e protocolo formal de entrega pericial para instrução de processos administrativos e judiciais.',
        requerLogin: true,
      },
      {
        numero: 'Módulo 04',
        titulo: 'Operação do Console do Auditor & Honorários',
        duracao: '50 min',
        conteudo:
          'Navegação pela fila de diagnósticos do Orbis Protocol, atribuição de pareceres, emissão de diligências ao cliente e liquidação dos honorários periciais.',
        requerLogin: true,
      },
    ],
    linkAuditor: true,
  },
}
