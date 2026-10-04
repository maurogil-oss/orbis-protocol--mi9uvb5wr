import {
  DollarSign,
  Users,
  Activity,
  Layers,
  ShoppingBag,
  CreditCard,
  Percent,
  Award,
  ShieldCheck,
  Leaf,
  FileCheck2,
  SlidersHorizontal,
  ShieldAlert,
  Compass,
  Sparkles,
  History,
  Mail,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react'

export type AdminTab =
  | 'receita'
  | 'radar_semanal'
  | 'clientes'
  | 'uso'
  | 'custos'
  | 'produtos'
  | 'assinaturas'
  | 'comissoes'
  | 'peritos'
  | 'honorarios_peritos'
  | 'auditoria'
  | 'auditoria_integridade'
  | 'lastro_conformidade'
  | 'ccrlr_sinir'
  | 'dmrv_todas_empresas'
  | 'historico_consultas'
  | 'reativacao'
  | 'sandbox'
  | 'configuracoes'
  | 'governanca'
  | 'parametros_negocio'

export type AdminGroupId = 'financeiro' | 'operacional' | 'dmrv_prova' | 'governanca'

export interface AdminTabDefinition {
  id: AdminTab
  label: string
  icon: LucideIcon
  badge?: string
  isMasterOnly?: boolean
  description?: string
}

export interface AdminGroupDefinition {
  id: AdminGroupId
  label: string
  icon: LucideIcon
  description: string
  isMasterOnly?: boolean
  tabs: AdminTabDefinition[]
}

/**
 * Definição centralizada dos 4 grupos de navegação do Console Administrativo:
 * - Financeiro: Receita & Cobranças, Assinaturas, Produtos & Preços, Comissões & Parceiros, Honorários de Peritos, Custos Operacionais, Radar Semanal
 * - Operacional: Clientes, Reativação, Uso da Plataforma, Rede Pericial & Conselhos, Sandbox de Ingestão, Histórico de Consultas, Lastro Circularidade, CCRLR & SINIR
 * - dMRV & Prova: Emissões Evitadas (SBCE), Auditoria de Integridade, Auditoria & Trilha Imutável
 * - Governança: Governança & MOVER, Governança Master (Acessos & Papéis), Parâmetros do Negócio
 *
 * NOTA DE DECISÃO DE PRODUTO:
 * - "Radar Semanal" posicionado em Financeiro (junto de Produtos & Preços / Assinaturas / Receita), visto ser um produto de assinatura paga faturável.
 * - "Reativação" posicionado em Operacional (ao lado de Clientes e Uso da Plataforma), sendo uma campanha operacional de retenção e reativação de contas.
 *
 * REMOÇÃO DE NUMERAÇÃO:
 * - Todos os prefixos "1.", "2.", ... "16." foram removidos dos rótulos.
 * - Todos os identificadores de abas (`id`) e aliases de deep links continuam idênticos e 100% retrocompatíveis.
 */
export const ADMIN_NAV_GROUPS: AdminGroupDefinition[] = [
  {
    id: 'financeiro',
    label: 'Financeiro',
    icon: DollarSign,
    description: 'Receitas, cobranças PIX, assinaturas, produtos, comissões e custos',
    tabs: [
      {
        id: 'receita',
        label: 'Receita & Cobranças',
        icon: DollarSign,
        description: 'Gestão de faturamento, liquidação PIX e emissão de NFS-e',
      },
      {
        id: 'assinaturas',
        label: 'Assinaturas',
        icon: CreditCard,
        description: 'Planos ativos, recorrências e ciclos de cobrança',
      },
      {
        id: 'produtos',
        label: 'Produtos & Preços',
        icon: ShoppingBag,
        description: 'Catálogo de serviços cobráveis e tabela de contingência',
      },
      {
        id: 'comissoes',
        label: 'Comissões & Parceiros',
        icon: Percent,
        description: 'Apuração e quitação de repasses para parceiros e brokers',
      },
      {
        id: 'honorarios_peritos',
        label: 'Honorários de Peritos',
        icon: DollarSign,
        description: 'Tabela referencial de mercado e remuneração técnica',
      },
      {
        id: 'custos',
        label: 'Custos Operacionais',
        icon: TrendingUp,
        description: 'Consumo de APIs pagas (InfoSimples, SERPRO, etc.)',
      },
      {
        id: 'radar_semanal',
        label: 'Radar Semanal',
        icon: Compass,
        description: 'Assinantes pagos, digests e faixas de CNPJs',
      },
    ],
  },
  {
    id: 'operacional',
    label: 'Operacional',
    icon: Users,
    description: 'Clientes mestres, consumo, peritos, ingestão, histórico e lastros',
    tabs: [
      {
        id: 'clientes',
        label: 'Clientes',
        icon: Users,
        description: 'Base de contas cadastradas e leads do diagnóstico',
      },
      {
        id: 'reativacao',
        label: 'Reativação',
        icon: Mail,
        description: 'Campanhas defensivas e régua de reativação 30/60 dias',
      },
      {
        id: 'uso',
        label: 'Uso da Plataforma',
        icon: Activity,
        description: 'Volume de emissão de passaportes, lotes e revisões',
      },
      {
        id: 'peritos',
        label: 'Rede Pericial & Conselhos',
        icon: Award,
        description: 'Credenciamento, validação de ARTs e habilitações',
      },
      {
        id: 'sandbox',
        label: 'Sandbox de Ingestão',
        icon: Sparkles,
        badge: 'Novo',
        description: 'Geração e validação de massas de dados sintéticos',
      },
      {
        id: 'historico_consultas',
        label: 'Histórico de Consultas',
        icon: History,
        description: 'Trilha temporal unificada de consultas públicas e DPPs',
      },
      {
        id: 'lastro_conformidade',
        label: 'Lastro Circularidade',
        icon: FileCheck2,
        description: 'Conformidade com o Decreto 11.413 e comprovação de lastro',
      },
      {
        id: 'ccrlr_sinir',
        label: 'CCRLR & SINIR',
        icon: Layers,
        description: 'Interoperabilidade com o SINIR e certificados de destinação',
      },
    ],
  },
  {
    id: 'dmrv_prova',
    label: 'dMRV & Prova',
    icon: Leaf,
    description: 'Cálculo de descarbonização, integridade de hashes e trilha imutável',
    tabs: [
      {
        id: 'dmrv_todas_empresas',
        label: 'Emissões Evitadas (SBCE)',
        icon: Leaf,
        description: 'Consolidação setorial de descarbonização e GHG Protocol',
      },
      {
        id: 'auditoria_integridade',
        label: 'Auditoria de Integridade',
        icon: ShieldCheck,
        description: 'Verificação criptográfica de integridade de registros dMRV',
      },
      {
        id: 'auditoria',
        label: 'Auditoria & Trilha Imutável',
        icon: ShieldCheck,
        description: 'Logs append-only de ações, liquidações e governança',
      },
    ],
  },
  {
    id: 'governanca',
    label: 'Governança',
    icon: SlidersHorizontal,
    description: 'Parâmetros regulatórios (MOVER), permissões e parâmetros do negócio',
    isMasterOnly: false, // O grupo é visível para admin/master, mas as abas internas master-only são filtradas por papel
    tabs: [
      {
        id: 'configuracoes',
        label: 'Governança & MOVER',
        icon: SlidersHorizontal,
        description: 'Catálogo ampliado MOVER e escopo da Res. CONTRAN 611',
      },
      {
        id: 'governanca',
        label: 'Governança Master',
        icon: ShieldAlert,
        isMasterOnly: true,
        description: 'Validação de cadastros internos e alteração de papéis',
      },
      {
        id: 'parametros_negocio',
        label: 'Parâmetros do Negócio',
        icon: SlidersHorizontal,
        isMasterOnly: true,
        description: 'Configurações de Four-Eyes, margens e regras de contingência',
      },
    ],
  },
]

/**
 * Mapeamento de deep links legados ou alternativos para a aba canônica.
 * Suporta formatos curtos, com números e grafias alternativas.
 */
export const TAB_DEEP_LINK_ALIASES: Record<string, AdminTab> = {
  // Canônicos
  receita: 'receita',
  radar_semanal: 'radar_semanal',
  clientes: 'clientes',
  uso: 'uso',
  custos: 'custos',
  produtos: 'produtos',
  assinaturas: 'assinaturas',
  comissoes: 'comissoes',
  peritos: 'peritos',
  honorarios_peritos: 'honorarios_peritos',
  auditoria: 'auditoria',
  auditoria_integridade: 'auditoria_integridade',
  lastro_conformidade: 'lastro_conformidade',
  ccrlr_sinir: 'ccrlr_sinir',
  dmrv_todas_empresas: 'dmrv_todas_empresas',
  historico_consultas: 'historico_consultas',
  reativacao: 'reativacao',
  sandbox: 'sandbox',
  configuracoes: 'configuracoes',
  governanca: 'governanca',
  parametros_negocio: 'parametros_negocio',

  // Aliases populares / documentados no prompt
  dmrv: 'dmrv_todas_empresas',
  emissoes: 'dmrv_todas_empresas',
  emissoes_evitadas: 'dmrv_todas_empresas',
  sbce: 'dmrv_todas_empresas',
  radar: 'radar_semanal',
  honorarios: 'honorarios_peritos',
  lastro: 'lastro_conformidade',
  sinir: 'ccrlr_sinir',
  ccrlr: 'ccrlr_sinir',
  historico: 'historico_consultas',
  mover: 'configuracoes',
  master: 'governanca',
  parametros: 'parametros_negocio',

  // Numéricos retrocompatíveis (1 a 16)
  '1': 'receita',
  '2': 'clientes',
  '3': 'uso',
  '4': 'custos',
  '5': 'produtos',
  '6': 'assinaturas',
  '7': 'comissoes',
  '8': 'peritos',
  '9': 'auditoria',
  '10': 'lastro_conformidade',
  '11': 'ccrlr_sinir',
  '12': 'dmrv_todas_empresas',
  '13': 'historico_consultas',
  '14': 'configuracoes',
  '15': 'governanca',
  '16': 'parametros_negocio',
}

/**
 * Localiza qual grupo contém a aba informada.
 */
export function getGroupByTab(tabId: AdminTab): AdminGroupId {
  for (const group of ADMIN_NAV_GROUPS) {
    if (group.tabs.some((t) => t.id === tabId)) {
      return group.id
    }
  }
  return 'financeiro'
}

/**
 * Retorna os grupos filtrados de acordo com os privilégios do usuário.
 * Se o usuário não for master, abas master-only são removidas.
 * Se um grupo ficar sem abas visíveis, ele é omitido por completo.
 */
export function getVisibleGroups(isMaster: boolean): AdminGroupDefinition[] {
  return ADMIN_NAV_GROUPS.map((group) => {
    const visibleTabs = group.tabs.filter((t) => !t.isMasterOnly || isMaster)
    return {
      ...group,
      tabs: visibleTabs,
    }
  }).filter((group) => group.tabs.length > 0 && (!group.isMasterOnly || isMaster))
}

/**
 * Lista plana de abas visíveis (para compatibilidade e buscas rápidas).
 */
export function getVisibleTabs(isMaster: boolean): AdminTabDefinition[] {
  const groups = getVisibleGroups(isMaster)
  return groups.flatMap((g) => g.tabs)
}

/**
 * Resolve o parâmetro de URL ?tab=... para uma aba válida considerando privilégios.
 */
export function resolveInitialTab(
  qTab: string | null | undefined,
  isMaster: boolean,
): { tab: AdminTab; group: AdminGroupId } {
  if (qTab) {
    const normalized = qTab.trim().toLowerCase()
    const resolved = TAB_DEEP_LINK_ALIASES[normalized]
    if (resolved) {
      // Se for aba restrita a master e o usuário não for master, fallback seguro
      if ((resolved === 'governanca' || resolved === 'parametros_negocio') && !isMaster) {
        return { tab: 'receita', group: 'financeiro' }
      }
      return { tab: resolved, group: getGroupByTab(resolved) }
    }
  }

  // Fallback padrão: master inicia em governanca (como já fazia), demais em receita
  if (isMaster) {
    return { tab: 'governanca', group: 'governanca' }
  }
  return { tab: 'receita', group: 'financeiro' }
}
