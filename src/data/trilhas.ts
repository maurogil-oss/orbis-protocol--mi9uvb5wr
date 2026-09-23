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
      'Rastreabilidade de economia circular exclusiva para fabricantes de veículos, sistemistas de autopeças e Centrais de Desmontagem de Veículos (CDVs DETRAN).',
    descricao:
      'Capacitação preparatória e protocolo técnico para habilitação de incentivos fiscais de IPI — restritos por lei a fabricantes/importadores automotivos e CDVs credenciados — via rastreabilidade de peças reaproveitadas, Passaporte Digital de Produto (DPP) e governança técnica.',
    publico:
      'Centros de Desmontagem Veicular (CDV), Fabricantes/Montadoras de Veículos, Sistemistas de Autopeças e Recicladores Automotivos.',
    destaques: [
      'Passaporte Digital de Produto (DPP) & Selo DETRAN para CDVs',
      'Auditoria preparatória para créditos financeiros de IPI do MOVER',
      'Case Integrado CDVerde: peças de reúso automotivo e desmanche legal',
      'Rastreio de baterias elétricas automotivas (2ª Vida)',
    ],
    objetivos: [
      'Implementar rotina de inventário com rastreio QR Code por peça desmontada em CDVs',
      'Validar o Passaporte Digital de Produto em conformidade com as diretrizes do MDIC',
      'Apurar índice de reciclabilidade e preparar comprovação para créditos de IPI do MOVER no segmento automotivo',
      'Gerar dossiê técnico de conformidade preparatória para auditoria da Receita Federal',
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
      'Preparação contábil para o SBCE (Lei 15.042/2024), mitigação tributária CBAM para exportação e atendimento às exigências ESG de credores.',
    descricao:
      'Guia definitivo para CFOs, gestores de compliance e auditores sobre o Sistema Brasileiro de Comércio de Emissões de GEE (Lei 15.042/2024), reporte voluntário IFRS S1/S2 (Resolução CVM 193) e preparação para exigências socioambientais de instituições financeiras (Resolução BCB 4.945/2021).',
    publico:
      'Indústrias com potencial emissor, Exportadores para a União Europeia, Gestores Financeiros e Tesourarias.',
    destaques: [
      'Green Capital Engine: 8 linhas de crédito verde e spread bonificado',
      'Preparação para exigências ESG de credores e redução de spread (Res. BCB 4.945/2021)',
      'Gateway preparatório CBAM União Europeia: comprovação de emissões incorporadas',
      'Reporte voluntário IFRS S1/S2 (Res. CVM 193) com preparação para asseguração',
      'Estimativa preliminar de Cotas Brasileiras de Emissão (CBE)',
    ],
    objetivos: [
      'Estruturar o inventário corporativo de Escopo 1, 2 e 3 conforme GHG Protocol Brasil',
      'Avaliar a prontidão para a Lei 15.042/2024 (limiares de 10.000 e 25.000 tCO2e)',
      'Construir documentação técnica para o mecanismo de fronteira europeu (CBAM)',
      'Preparar dossiê técnico para atender às exigências ESG de instituições financeiras (Res. BCB 4.945/2021)',
    ],
    modulos: [
      {
        numero: 'Módulo 01',
        titulo: 'Arquitetura do SBCE: Lei 15.042/2024 e o Novo Mercado de Carbono',
        duracao: '50 min',
        conteudo:
          'Estrutura institucional do SBCE (Lei 15.042/2024), limiares de reporte (>10.000 tCO2e) e de compensação (>25.000 tCO2e), funcionamento preliminar das Cotas Brasileiras de Emissão (CBE).',
        requerLogin: false,
      },
      {
        numero: 'Módulo 02',
        titulo: 'Mecanismo de Ajuste Fronteiriço CBAM (União Europeia)',
        duracao: '80 min',
        conteudo:
          'Como exportadores de aço, alumínio, cimento, fertilizantes e hidrogênio devem apurar emissões incorporadas e emitir declarações técnicas preparatórias para aduanas europeias.',
        requerLogin: true,
      },
      {
        numero: 'Módulo 03',
        titulo: 'Reporte Voluntário IFRS S1/S2 e Resolução CVM 193',
        duracao: '60 min',
        conteudo:
          'Demonstrações financeiras climáticas voluntárias: orientações da Resolução CVM 193 e esclarecimentos da CVM quanto ao cronograma de asseguração e preparação de métricas auditáveis.',
        requerLogin: true,
      },
      {
        numero: 'Módulo 04',
        titulo: 'Preparação para Exigências ESG de Credores (Res. BCB 4.945/2021)',
        duracao: '60 min',
        conteudo:
          'Como estruturar o dossiê socioambiental e climático para atender às políticas PRSAC das instituições financeiras, qualificando a empresa a spreads e linhas verdes de crédito.',
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
          'Diagnóstico documental e preparação para ingestão e conferência de CFOPs fiscais, fatores de emissão oficiais MCTI e conciliação de estoques de carbono (em implantação no roadmap).',
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
  mineracao: {
    slug: 'mineracao',
    lei: 'Lei 12.305/2010 (PNRS) / CONAMA / ANM',
    titulo: 'Mineração Urbana & Materiais Críticos Recuperados',
    subtitulo:
      'Infraestrutura probatória e custódia pericial de origem urbana para terras raras (NdFeB), metais nobres (Au/Pd/Ag) e cobre de alta pureza.',
    descricao:
      'Protocolo técnico para recicladores industriais, beneficiadores e processadores de resíduos eletrônicos (REEE) e veículos em fim de vida (VFV). Estruturação de prova documental de origem estritamente urbana, compliance fiscal de entrada e saída (NF-e, DANFE, transportador), prevenção contra receptação e emissão do Passaporte Digital de Produto (DCP) por lote segregado com hash SHA-256 e QR Code público.',
    publico:
      'Recicladores de Eletroeletrônicos (REEE), Refinarias e Processadores de Sucata Nobre, CDVs com Segregação Especializada e Gestores de Logística Reversa PNRS.',
    destaques: [
      'Prova documental de origem urbana e não-extrativa (PNRS / CONAMA)',
      'Cadeia de custódia fiscal e física anti-receptação (chave NF-e 44 dígitos)',
      'Emissão do DCP por lote com hash SHA-256 e QR Code verificável',
      'Metodologia berço-ao-portão para cálculo da pegada de carbono com dados verificáveis',
      'Dossiê pronto para envio a refinarias e indústrias compradoras de materiais críticos',
    ],
    objetivos: [
      'Estabelecer a cadeia de custódia documental inviolável desde a sucata urbana até a fração pura concentrada',
      'Emitir o Passaporte Digital de Produto (DCP) de cada lote com frações de NdFeB, metais preciosos e cobre',
      'Garantir conformidade integral com a Lei 12.305/2010 (PNRS) e diretrizes da ANM/CONAMA',
      'Consolidar o cálculo da pegada de carbono berço-ao-portão com dados verificáveis para compradores industriais',
    ],
    modulos: [
      {
        numero: 'Módulo 01',
        titulo: 'Fundamentos da Mineração Urbana e Marco Regulatório',
        duracao: '45 min',
        conteudo:
          'Conceituação de mineração urbana versus extração primária. Marco regulatório da Política Nacional de Resíduos Sólidos (Lei 12.305/2010), resoluções CONAMA e diretrizes da Agência Nacional de Mineração (ANM) para aproveitamento de frações estratégicas.',
        requerLogin: false,
      },
      {
        numero: 'Módulo 02',
        titulo: 'Segurança Jurídica, Cadeia de Custódia e Compliance Fiscal (NF-e)',
        duracao: '60 min',
        conteudo:
          'Blindagem contra receptação: conferência de 44 dígitos de NF-e de aquisição, DANFE, manifesto de transporte, qualificação do fornecedor e segregação física no pátio de processamento.',
        requerLogin: true,
      },
      {
        numero: 'Módulo 03',
        titulo: 'Emissão do DCP de Lote e Hashing Criptográfico SHA-256',
        duracao: '75 min',
        conteudo:
          'Procedimento operacional de consolidação de lote segregado (terras raras NdFeB, ouro/paládio/prata em PCBs e cobre de alta pureza), registro de balanço de massa, cálculo do hash canônico e geração do QR Code público de conferência.',
        requerLogin: true,
      },
      {
        numero: 'Módulo 04',
        titulo: 'Cálculo da Pegada de Carbono Verificável e Relação com Compradores',
        duracao: '60 min',
        conteudo:
          'Metodologia de pegada de carbono berço-ao-portão (cradle-to-gate) com dados verificáveis, parâmetros de transporte e energia de processamento; montagem do dossiê técnico pronto para envio a refinarias e indústrias compradoras de materiais críticos.',
        requerLogin: true,
      },
    ],
  },
}
