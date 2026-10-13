/**
 * REGISTRO VERSIONADO DE REVISÕES DA DIRETRIZ TÉCNICA DM-ORB-001
 *
 * Norma Metodológica Interna de Quantificação e Custódia dMRV — Orbis Protocol.
 * Define o histórico documental de alterações, justificativas periciais e governança de vigência.
 *
 * RESTRIÇÃO DE BLINDAGEM: Não expõe valores numéricos dos fatores de emissão nesta camada pública.
 */

export interface AlteracaoNorma {
  item: string
  descricao: string
  justificativa: string
  referenciaSecao?: string
}

export interface RevisaoNormaDmOrb001 {
  versao: string
  dataVigencia: string
  dataPublicacao: string
  titulo: string
  resumo: string
  status: 'vigente' | 'historico' | 'preliminar'
  alteracoes: AlteracaoNorma[]
  responsavelTecnico?: string
}

export const HISTORICO_REVISOES_DM_ORB_001: RevisaoNormaDmOrb001[] = [
  {
    versao: 'v1.1',
    dataVigencia: '01/10/2026',
    dataPublicacao: '15/01/2025',
    titulo: 'Incerteza Declarada, Governança de Provedoria e Restrição de Fatores Indicativos',
    resumo:
      'Aprimoramento das salvaguardas periciais para alinhamento às exigências do painel técnico simulado Tecpar e à rastreabilidade de dados primários. Formaliza a incerteza declarada por fator, metadados estritos de proveniência versionada (autor/fonte primária, versão de registro, data de publicação, fronteira berço-ao-portão) e a trava de bloqueio de fatores indicativos para emissão do Atestado de Conformidade Orbis.',
    status: 'vigente',
    responsavelTecnico: 'Comitê Técnico Metodológico Orbis Protocol / Auditoria dMRV',
    alteracoes: [
      {
        item: 'Incerteza declarada formal por fator de emissão',
        descricao:
          'Inclusão da margem de incerteza declarada explícita (ex.: ±3,5% aço worldsteel, ±4,0% alumínio IAI, ±4,5% cobre ICA) com propagação em quadratura.',
        justificativa:
          'Garantir aderência estrita ao ISO 14064-1 e dar consistência matemática ao intervalo de confiança exibido no Atestado de Conformidade Orbis e no Verificador.',
        referenciaSecao: '§4 e §6',
      },
      {
        item: 'Bloqueio estrito de fatores indicativos para Atestado de Conformidade',
        descricao:
          'Criação da flag bloqueadoAtestado para fatores exploratórios ou regionais não-padronizados (ex.: cenário regional BR hidrelétrico), vedando sua utilização na emissão de Atestados.',
        justificativa:
          'Evitar a emissão inadvertida de peças com valor probatório ancoradas em fontes não-primárias ou médias preliminares, assegurando integridade pericial.',
        referenciaSecao: '§7 (Hierarquia de Fatores)',
      },
      {
        item: 'Metadados canônicos de proveniência versionada',
        descricao:
          'Estruturação dos campos autorFontePrimaria, versao, dataPublicacao e fronteira do ciclo de vida em cada registro do catálogo de fatores.',
        justificativa:
          'Assegurar auditabilidade independente por Organismos de Verificação e Validação (VVB) e viabilizar conferência de integridade de ponta a ponta.',
        referenciaSecao: '§3 e §5',
      },
      {
        item: 'Preservação de terminologia pública e centros de desmonte',
        descricao:
          'Padronização obrigatória das designações institucionais "Atestado de Conformidade Orbis" e "Centro de Desmonte" em todos os documentos e exposições públicas.',
        justificativa:
          'Alinhamento aos limites de atuação da infraestrutura como custodiante documental, vedando termos como certificação ou homologação sem respaldo externo.',
        referenciaSecao: '§1 e §2',
      },
    ],
  },
  {
    versao: 'v1.0',
    dataVigencia: '01/01/2025',
    dataPublicacao: '01/01/2025',
    titulo: 'Edição Inicial — Arquitetura de Custódia dMRV e Baseline de Descarbonização',
    resumo:
      'Instituição formal da metodologia de quantificação de emissões evitadas para materiais automotivos recuperados em Centros de Desmonte, estabelecendo a custódia criptográfica prospectiva (snapshot imutável em hash SHA-256) e a fórmula canônica de baseline berço-ao-portão.',
    status: 'historico',
    responsavelTecnico: 'Comitê Técnico Metodológico Orbis Protocol',
    alteracoes: [
      {
        item: 'Estruturação da fórmula de baseline e emissões evitadas',
        descricao:
          'Definição da modelagem berço-ao-portão para aço, alumínio, cobre e polímeros substituídos por peças e materiais pós-consumo.',
        justificativa:
          'Padronizar o cálculo de emissões evitadas para descarbonização veicular da economia circular.',
        referenciaSecao: '§6',
      },
      {
        item: 'Mecanismo de snapshot prospectivo imutável (hash SHA-256)',
        descricao:
          'Congelamento dos fatores e parâmetros no momento exato de processamento de cada lote, tornando revisões metodológicas futuras estritamente prospectivas.',
        justificativa:
          'Impedir alterações retroativas em laudos e assegurar segurança jurídica e pericial permanente.',
        referenciaSecao: '§5',
      },
      {
        item: 'Blindagem pública de catálogo de fatores',
        descricao:
          'Separação entre governança pública de referências canônicas (sem valores) e exibição detalhada com valores restrita a lotes verificados e perfil master.',
        justificativa:
          'Proteger a propriedade metodológica e evitar o descolamento de fatores da sua devida custódia de pesagem e lastro fiscal.',
        referenciaSecao: '§8',
      },
    ],
  },
]

export const REVISAO_VIGENTE_DM_ORB_001 =
  HISTORICO_REVISOES_DM_ORB_001.find((r) => r.status === 'vigente') ||
  HISTORICO_REVISOES_DM_ORB_001[0]
