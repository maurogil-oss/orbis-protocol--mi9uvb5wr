/**
 * Mapeador Inteligente de CNAE para Trilhas Regulatórias e Protocolos Setoriais
 * Orbis Protocol — Conformidade Climática, Tributária & ESG
 *
 * Mapeia os principais CNAEs-alvo da plataforma para:
 * 1. Trilha regulatória educacional/capacitação (src/data/trilhas.ts)
 * 2. Protocolo setorial pericial (src/data/protocolosSetoriais.ts)
 * 3. Sugestão automática de enquadramento institucional e incentivos (ex.: MOVER, SBCE, EUDR, PNRS)
 */

export interface SugestaoTrilhaCNAE {
  trilhaSlug?: 'mover' | 'sbce-financas-verdes' | 'mineracao' | 'peritos-tecnicos'
  protocoloSlug?: string
  protocoloNome?: string
  nomeSegmento: string
  descricaoSugestao: string
  destaquesRegulatorios: string[]
  vinculoInstitucionalSugerido?: string
  categoriaProfissionalSugerida?: string
}

export interface MapeamentoCNAERegra {
  prefixos: string[] // Ex.: ['01', '02', '03'] ou códigos específicos ['4520', '4530', '38319']
  sugestao: SugestaoTrilhaCNAE
}

// Catálogo curado das regras de enquadramento por prefixos CNAE (divisão de 2 dígitos ou classe de 4/5 dígitos)
const REGRAS_CNAE: MapeamentoCNAERegra[] = [
  // 1. Desmonte Veicular / CDVs / Autopeças / Fabricação Automotiva -> Trilha MOVER & Protocolo Automotiva
  {
    prefixos: [
      '4520001', // Serviços de manutenção e reparação mecânica de veículos
      '4530703', // Comércio a varejo de peças e acessórios novos para veículos
      '4530704', // Comércio a varejo de peças e acessórios usados para veículos (Desmanche / CDV)
      '4530705', // Comércio por atacado de peças e acessórios usados para veículos
      '4511101', // Comércio a varejo de automóveis, camionetas e utilitários novos
      '4511102', // Comércio a varejo de automóveis, camionetas e utilitários usados
      '29107', // Fabricação de automóveis, camionetas e utilitários
      '29204', // Fabricação de caminhões e ônibus
      '29301', // Fabricação de cabines, carrocerias e reboques
      '29417', // Fabricação de peças e acessórios para o sistema motor de veículos
      '29425', // Fabricação de outras peças e acessórios para veículos
      '29433', // Fabricação de peças e acessórios para os sistemas de marcha e transmissão
      '29441', // Fabricação de peças e acessórios para o sistema de freios
      '29450', // Fabricação de material elétrico e eletrônico para veículos
      '29492', // Fabricação de outras peças e acessórios para veículos automotores
      '29506', // Recondicionamento e recuperação de motores para veículos
      '4541205', // Comércio a varejo de peças e acessórios usados para motocicletas
      '4541206', // Comércio a varejo de peças e acessórios novos para motocicletas
      '45421', // Representantes comerciais e agentes do comércio de motocicletas e peças
      '45439', // Manutenção e reparação de motocicletas e motonetas
      '45', // Genérico comércio e reparação de veículos
      '29', // Divisão 29: Fabricação de veículos automotores
    ],
    sugestao: {
      trilhaSlug: 'mover',
      protocoloSlug: 'automotiva',
      protocoloNome: 'Indústria Automotiva, CDV & Autopeças',
      nomeSegmento: 'Cadeia Automotiva & Desmontagem Veicular (CDV)',
      descricaoSugestao:
        'Sua atividade está elegível aos incentivos fiscais de IPI do Programa MOVER (Lei 14.902/2024), rastreamento com Passaporte Digital de Produto (DPP) e índice de reciclabilidade.',
      destaquesRegulatorios: [
        'Programa MOVER (Lei 14.902/2024)',
        'Passaporte Digital de Produto (DPP) & Selo DETRAN',
        'Incentivos e Créditos Financeiros de IPI',
      ],
      vinculoInstitucionalSugerido: 'Cadeia Automotiva / CDV (Programa MOVER)',
      categoriaProfissionalSugerida: 'Centro de Desmontagem Veicular (CDV / Desmanche Credenciado)',
    },
  },

  // 2. Reciclagem Especializada / Resíduos Eletrônicos / Mineração Urbana -> Trilha Mineração & Protocolo Materiais Críticos
  {
    prefixos: [
      '3831901', // Recuperação de sucatas de alumínio
      '3831999', // Recuperação de materiais metálicos, exceto alumínio
      '3832700', // Recuperação de materiais plásticos
      '3839401', // Descontaminação e outros serviços de gestão de resíduos
      '3839499', // Recuperação de materiais não especificados anteriormente (REEE / baterias)
      '2441501', // Metalurgia dos metais preciosos (ouro, prata, platina)
      '2441502', // Usinagem e ligas de metais preciosos
      '2443100', // Metalurgia do cobre
      '2449199', // Metalurgia de outros metais não-ferrosos e terras raras
      '383', // Recuperação de materiais
      '382', // Tratamento e disposição de resíduos
      '381', // Coleta de resíduos
    ],
    sugestao: {
      trilhaSlug: 'mineracao',
      protocoloSlug: 'materiais-criticos-recuperados',
      protocoloNome: 'Mineração Urbana & Materiais Críticos Recuperados',
      nomeSegmento: 'Economia Circular, Reciclagem & Mineração Urbana',
      descricaoSugestao:
        'Sua empresa opera na recuperação de frações nobres e economia circular. Sugerimos a trilha de Mineração Urbana com comprovação pericial PNRS, balanço de massa e emissão de DCP criptográfico para terras raras, cobre e metais preciosos.',
      destaquesRegulatorios: [
        'Política Nacional de Resíduos Sólidos (Lei 12.305/2010)',
        'Passaporte Digital de Produto (DCP) com hash SHA-256',
        'Blindagem fiscal e custódia documental anti-receptação',
      ],
      vinculoInstitucionalSugerido: 'Mercado Nacional (Bahia, SP, Brasil)',
    },
  },

  // 3. Agronegócio, Pecuária, Grãos, Florestal -> Protocolo Agro & Trilha SBCE / Finanças Verdes
  {
    prefixos: [
      '01', // Agricultura, pecuária e serviços relacionados
      '02', // Silvicultura e exploração florestal
      '03', // Pesca e aquicultura
      '101', // Frigoríficos e abate de animais
      '104', // Fabricação de óleos e gorduras vegetais
      '106', // Moagem e produtos de grãos
      '108', // Torrefação de café
      '011', // Cultivo de cereais e grãos
      '012', // Horticultura
      '013', // Cultivo de plantas lavoura permanente
      '014', // Pecuária
      '015', // Produção mista
    ],
    sugestao: {
      trilhaSlug: 'sbce-financas-verdes',
      protocoloSlug: 'agro',
      protocoloNome: 'Agronegócio, Grãos & Pecuária Sustentável',
      nomeSegmento: 'Agronegócio & Cadeia Agroindustrial',
      descricaoSugestao:
        'Identificamos atuação agropecuária ou agroindustrial. Sugerimos o protocolo de Agronegócio com rastreabilidade antidesmatamento EUDR (UE 2023/1115), balanço de carbono no solo e qualificação para CPR Verde e Pronaf Bioeconomia.',
      destaquesRegulatorios: [
        'Regulamento Antidesmatamento Europeu (EUDR 2023/1115)',
        'Linhas de Financiamento Verde e CPR-Verde (BNDES/BB)',
        'Mensuração de Escopo 1 (N2O fertilizantes, diesel agrícola)',
      ],
      vinculoInstitucionalSugerido: 'Mercado Nacional (Bahia, SP, Brasil)',
    },
  },

  // 4. Cimento, Concreto, Cerâmica e Minerais Não-Metálicos -> Protocolo Cimento / Construção
  {
    prefixos: [
      '23206', // Fabricação de cimento
      '23303', // Fabricação de artefatos de concreto, cimento e fibrocimento
      '2330301', // Fabricação de estruturas pré-moldadas de concreto
      '2330302', // Fabricação de artefatos de cimento para uso na construção
      '2330305', // Preparação de massa de concreto e argamassa para construção
      '23419', // Fabricação de produtos cerâmicos refratários
      '23427', // Fabricação de produtos cerâmicos não-refratários para uso estrutural
      '23915', // Britamento, moagem e outros tratamentos de pedras
      '23991', // Fabricação de outros produtos de minerais não-metálicos
      '23', // Fabricação de produtos de minerais não-metálicos
      '412', // Construção de edifícios
      '42', // Obras de infraestrutura
      '43', // Serviços especializados para construção
    ],
    sugestao: {
      trilhaSlug: 'sbce-financas-verdes',
      protocoloSlug: 'cimento',
      protocoloNome: 'Cimento, Concreto & Construção Civil',
      nomeSegmento: 'Indústria Cimenteira, Concreteiras & Construção',
      descricaoSugestao:
        'Atividade de alta intensidade carbônica sujeita a metas setoriais do SBCE (Lei 15.042/2024) ou fronteiras CBAM. Sugerimos auditoria de fator clínquer/cimento, coprocessamento e descarbonatação.',
      destaquesRegulatorios: [
        'SBCE Lei 15.042/2024 (Teto de 25.000 tCO2e/ano)',
        'Mecanismo de Ajuste Fronteiriço CBAM (UE 2023/956)',
        'Coprocessamento de resíduos (Resolução CONAMA 499/2020)',
      ],
      vinculoInstitucionalSugerido: 'Mercado Nacional (Bahia, SP, Brasil)',
    },
  },

  // 5. Energia Renovável, Biocombustíveis & Geração -> Protocolo Energia
  {
    prefixos: [
      '3511501', // Geração de energia elétrica
      '3511502', // Atividades de coordenação e controle da operação da geração
      '3512300', // Transmissão de energia elétrica
      '3513100', // Comércio atacadista de energia elétrica
      '3514000', // Distribuição de energia elétrica
      '3520401', // Produção de gás; processamento de gás natural
      '3520402', // Distribuição de combustíveis gasosos por redes urbanas
      '1931400', // Fabricação de álcool / etanol
      '1932200', // Fabricação de biocombustíveis, exceto álcool (biodiesel)
      '35', // Eletricidade, gás e outras utilidades
      '19', // Fabricação de coque, produtos derivados do petróleo e biocombustíveis
    ],
    sugestao: {
      trilhaSlug: 'sbce-financas-verdes',
      protocoloSlug: 'energia',
      protocoloNome: 'Energia Renovável, Biocombustíveis & Biogás',
      nomeSegmento: 'Energia Limpa, Biometano & Biocombustíveis',
      descricaoSugestao:
        'Identificamos atuação em energia ou combustíveis. Sugerimos o enquadramento de descarbonização energética, elegibilidade a CBIOs (RenovaBio) e certificação I-REC de Escopo 2.',
      destaquesRegulatorios: [
        'Créditos de Descarbonização RenovaBio (Lei 13.576/2017)',
        'Certificação de Rastreabilidade I-REC & Escopo 2',
        'Mercado Livre de Energia e Fundo Clima BNDES',
      ],
      vinculoInstitucionalSugerido: 'Mercado Nacional (Bahia, SP, Brasil)',
    },
  },

  // 6. Transporte & Logística de Cargas -> Protocolo Logística
  {
    prefixos: [
      '49302', // Transporte rodoviário de carga
      '4930201', // Transporte rodoviário de carga intermunicipal/interestadual
      '4930202', // Transporte rodoviário de carga municipal
      '4930203', // Transporte rodoviário de produtos perigosos
      '49116', // Transporte ferroviário de carga
      '50114', // Transporte marítimo de cabotagem
      '50122', // Transporte marítimo de longo curso
      '51200', // Transporte aéreo de carga
      '52117', // Armazenamento e carga/descarga
      '52508', // Agenciamento de carga
      '49', // Transporte terrestre
      '50', // Transporte aquaviário
      '51', // Transporte aéreo
      '52', // Armazenamento e atividades auxiliares dos transportes
    ],
    sugestao: {
      trilhaSlug: 'sbce-financas-verdes',
      protocoloSlug: 'logistica',
      protocoloNome: 'Logística, Frotas & Transporte de Cargas',
      nomeSegmento: 'Logística & Transporte Pesado',
      descricaoSugestao:
        'Operação em transportes e frotas sujeita a monitoramento de diesel, pegada por TKU (tonelada-quilômetro útil) e demanda crescente de clientes por dados de Escopo 3.',
      destaquesRegulatorios: [
        'Diretrizes Globais GLEC & GHG Protocol Escopo 3',
        'Consumo de Diesel S10 / Mistura Biodiesel B14',
        'Programa Despoluir da Confederação Nacional do Transporte',
      ],
      vinculoInstitucionalSugerido: 'Mercado Nacional (Bahia, SP, Brasil)',
    },
  },

  // 7. Siderurgia e Metalurgia Básica -> Protocolo Siderurgia
  {
    prefixos: [
      '2411300', // Produção de ferro-gusa
      '2412100', // Produção de ferroligas
      '2421100', // Produção de semi-acabados de aço
      '2422901', // Produção de laminados planos de aço
      '2423701', // Produção de tubos de aço sem costura
      '2424501', // Produção de arames de aço
      '2431800', // Tubos e canos de ferro e aço
      '24', // Metalurgia básica
      '25', // Fabricação de produtos de metal
    ],
    sugestao: {
      trilhaSlug: 'sbce-financas-verdes',
      protocoloSlug: 'siderurgia',
      protocoloNome: 'Siderurgia & Aço Verde',
      nomeSegmento: 'Siderurgia, Metalurgia & Aciarias',
      descricaoSugestao:
        'Indústria siderúrgica com alta exposição ao CBAM europeu e teto compulsório do SBCE. Sugerimos apuração de emissões de alto-forno, uso de bio-redutores e percentual de sucata reciclada.',
      destaquesRegulatorios: [
        'CBAM União Europeia (Regulamento 2023/956)',
        'SBCE Lei 15.042/2024 (Regime Compulsório > 25k tCO2e)',
        'Créditos presumidos de IBS/CBS e bio-redutores florestais',
      ],
      vinculoInstitucionalSugerido: 'Mercado Nacional (Bahia, SP, Brasil)',
    },
  },

  // 8. Serviços Periciais, Contabilidade, Engenharia, Advocacia -> Trilha Peritos Técnicos
  {
    prefixos: [
      '69206', // Atividades de contabilidade, consultoria e auditoria contábil e tributária
      '69117', // Atividades jurídicas (advocacia)
      '71120', // Serviços de engenharia
      '71197', // Atividades técnicas relacionadas à engenharia e arquitetura
      '74901', // Atividades profissionais, científicas e técnicas não especificadas
      '70204', // Consultoria em gestão empresarial
    ],
    sugestao: {
      trilhaSlug: 'peritos-tecnicos',
      protocoloSlug: 'varejo',
      protocoloNome: 'Serviços Especializados & Perícias Técnicas',
      nomeSegmento: 'Perícia, Auditoria Contábil, Engenharia ou Advocacia',
      descricaoSugestao:
        'Identificamos perfil pericial ou de auditoria técnica. Você é elegível para se credenciar como Perito Técnico Homologado no Orbis Protocol com chancela ART/CRC e remuneração profissional por laudo dMRV.',
      destaquesRegulatorios: [
        'Normas Periciais NBC TO 3000 e ABNT ISO 14064-3',
        'Acoplamento de ART (CREA) ou Certidão de Perito CRC',
        'Acesso prioritário ao Console do Auditor',
      ],
      vinculoInstitucionalSugerido: 'Mercado Nacional (Bahia, SP, Brasil)',
      categoriaProfissionalSugerida: 'Contador / Auditor Independente (CRC)',
    },
  },
]

/**
 * Normaliza código CNAE para busca limpa (somente dígitos)
 */
export function normalizarCNAE(cnae: string | number | undefined | null): string {
  if (cnae === undefined || cnae === null) return ''
  return String(cnae).replace(/\D/g, '')
}

/**
 * Identifica a sugestão regulatória com base no CNAE principal ou secundários da empresa
 *
 * @param cnaePrincipal - Código numérico ou string do CNAE principal (ex.: "45.30-7-04" ou "4530704")
 * @param cnaesSecundarios - Lista opcional de CNAEs secundários retornados pela Receita Federal
 * @returns SugestaoTrilhaCNAE encontrada ou null se nenhuma regra fizer match (sem erro)
 */
export function sugerirTrilhaPorCNAE(
  cnaePrincipal?: string | number | null,
  cnaesSecundarios?: Array<string | number | { codigo?: string | number }>,
): SugestaoTrilhaCNAE | null {
  const codPrincipal = normalizarCNAE(cnaePrincipal)
  if (!codPrincipal) return null

  // 1. Tenta match prioritário no CNAE principal
  for (const regra of REGRAS_CNAE) {
    for (const prefixo of regra.prefixos) {
      if (codPrincipal.startsWith(prefixo)) {
        return regra.sugestao
      }
    }
  }

  // 2. Se o principal não deu match, verifica os secundários caso existam
  if (Array.isArray(cnaesSecundarios) && cnaesSecundarios.length > 0) {
    for (const item of cnaesSecundarios) {
      const codSecundario =
        typeof item === 'object' && item !== null && 'codigo' in item
          ? normalizarCNAE(item.codigo)
          : normalizarCNAE(item as string | number)

      if (!codSecundario) continue

      for (const regra of REGRAS_CNAE) {
        for (const prefixo of regra.prefixos) {
          if (codSecundario.startsWith(prefixo)) {
            return {
              ...regra.sugestao,
              descricaoSugestao: `Identificamos a atividade secundária (CNAE ${codSecundario}) relevante para conformidade: ${regra.sugestao.descricaoSugestao}`,
            }
          }
        }
      }
    }
  }

  return null
}
