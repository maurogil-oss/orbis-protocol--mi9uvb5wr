import { Link } from 'react-router-dom'
import { BreadcrumbOrbis } from '@/components/BreadcrumbOrbis'
import {
  Scale,
  ShieldCheck,
  Lock,
  Layers,
  BookOpen,
  ArrowRight,
  Sparkles,
  FileCheck,
  CheckCircle2,
  ExternalLink,
  HelpCircle,
  FileText,
  Search,
  History,
  GitCommit,
  Calendar,
  AlertCircle,
} from 'lucide-react'
import { HISTORICO_REVISOES_DM_ORB_001 } from '@/data/historicoNormaDmOrb001'

interface ReferenciaCanonica {
  id: string
  sigla: string
  nome: string
  organizacao: string
  foco: string
  descricao: string
  anoOuEdicao: string
  tipo: 'Internacional' | 'Nacional' | 'Setorial'
  linkExterno?: string
  linkInterno?: string
}

const REFERENCIAS_CANONICAS: ReferenciaCanonica[] = [
  {
    id: 'ipcc-ar6',
    sigla: 'IPCC AR6',
    nome: 'Sixth Assessment Report (WG1 Capítulo 7)',
    organizacao: 'Intergovernmental Panel on Climate Change (IPCC)',
    foco: 'Métricas GWP-100 e gases refrigerantes automotivos',
    descricao:
      'Referencial internacional para potenciais de aquecimento global (GWP-100) com feedbacks climáticos para gases refrigerantes de climatização veicular (HFC-134a, HFO-1234yf) e gases de efeito estufa da cesta de Paris.',
    anoOuEdicao: 'AR6 WG1 (2021/2023)',
    tipo: 'Internacional',
    linkExterno: 'https://www.ipcc.ch/report/ar6/wg1/',
  },
  {
    id: 'worldsteel',
    sigla: 'worldsteel',
    nome: 'Sustainability Indicators',
    organizacao: 'World Steel Association',
    foco: 'Intensidade de emissões berço-ao-portão do aço bruto',
    descricao:
      'Coleta global de dados de intensidade de emissões de GEE (CO₂ data collection) com base em médias ponderadas de rotas de produção siderúrgica (BF-BOF, scrap-EAF e DRI-EAF).',
    anoOuEdicao: 'Edição 2024/2025',
    tipo: 'Internacional',
    linkExterno: 'https://worldsteel.org/wider-sustainability/sustainability-indicators/',
  },
  {
    id: 'iai-2024',
    sigla: 'IAI 2024',
    nome: 'Primary Aluminium Greenhouse Gas Emissions Intensity',
    organizacao: 'International Aluminium Institute (IAI)',
    foco: 'Intensidade de emissões berço-ao-portão de alumínio primário',
    descricao:
      'Indicadores globais de intensidade de emissão de GEE para alumínio primário berço-ao-portão (eletricidade, processos, PFCs, energia térmica e insumos auxiliares).',
    anoOuEdicao: 'Emissão 2024',
    tipo: 'Internacional',
    linkExterno:
      'https://international-aluminium.org/statistics/greenhouse-gas-emissions-intensity-primary-aluminium/',
  },
  {
    id: 'ica',
    sigla: 'ICA',
    nome: 'Global Life Cycle Assessment & LCI of Refined Copper',
    organizacao: 'International Copper Association',
    foco: 'Inventário de ciclo de vida berço-ao-portão do cobre refinado',
    descricao:
      'Inventário global de ciclo de vida (LCI/LCA) para cátodos e refino de cobre, alinhado aos padrões internacionais de avaliação de ciclo de vida ISO 14040/14044.',
    anoOuEdicao: 'Estudo Global 2024',
    tipo: 'Internacional',
    linkExterno: 'https://copperalliance.org/',
  },
  {
    id: 'ghg-protocol',
    sigla: 'GHG Protocol',
    nome: 'Corporate Value Chain (Scope 3) Standard',
    organizacao: 'WRI / WBCSD',
    foco: 'Escopo 3 — Categorias 1 (Bens e Serviços Adquiridos) e 12 (Fim de Vida)',
    descricao:
      'Padrão canônico para quantificação e relato corporativo de emissões indiretas de cadeia de valor, cobrindo aquisição de insumos reciclados e tratamento de fim de vida.',
    anoOuEdicao: 'Scope 3 Standard',
    tipo: 'Internacional',
    linkExterno: 'https://ghgprotocol.org/standards/scope-3-standard',
  },
  {
    id: 'iso-14064-1',
    sigla: 'ISO 14064-1',
    nome: 'Gases de Efeito Estufa — Especificação e Orientação para Inventários Organizacionais',
    organizacao: 'International Organization for Standardization (ISO)',
    foco: 'Quantificação e relato de emissões diretas e remoções/evitados',
    descricao:
      'Norma internacional que estabelece princípios e requisitos para elaboração, desenvolvimento, gestão e relato de inventários de emissões de GEE de organizações.',
    anoOuEdicao: 'ISO 14064-1:2018',
    tipo: 'Internacional',
    linkExterno: 'https://www.iso.org/standard/66453.html',
  },
  {
    id: 'lei-15042',
    sigla: 'Lei 15.042/2024',
    nome: 'Sistema Brasileiro de Comércio de Emissões de GEE (SBCE)',
    organizacao: 'Presidência da República / Congresso Nacional',
    foco: 'Marco legal do mercado regulado brasileiro de emissões',
    descricao:
      'Marco regulatório federal que institui o SBCE, disciplinando limites de emissões, governança de relatos corporativos e critérios para instrumentos econômicos climáticos.',
    anoOuEdicao: 'Lei Federal nº 15.042/2024',
    tipo: 'Nacional',
  },
  {
    id: 'lei-14902',
    sigla: 'Lei 14.902/2024',
    nome: 'Programa Mobilidade Verde e Inovação (Programa MOVER)',
    organizacao: 'Ministério do Desenvolvimento, Indústria, Comércio e Serviços (MDIC)',
    foco: 'Descarbonização veicular do berço ao túmulo e reciclabilidade',
    descricao:
      'Legislação federal que estabelece requisitos de sustentabilidade, medição berço-ao-túmulo da pegada de carbono automotiva e estímulos à circularidade na cadeia automotiva nacional.',
    anoOuEdicao: 'Lei Federal nº 14.902/2024',
    tipo: 'Nacional',
  },
  {
    id: 'ifrs-s1-s2',
    sigla: 'IFRS S1 / S2',
    nome: 'Normas Globais de Divulgação de Sustentabilidade e Clima',
    organizacao: 'International Sustainability Standards Board (ISSB)',
    foco: 'Relato financeiro de riscos climáticos e descarbonização de escopo 1, 2 e 3',
    descricao:
      'Diretrizes contábeis globais adotadas pelo marco regulatório brasileiro (CVM) para reporte auditável de riscos, metas e indicadores climáticos em cadeias produtivas.',
    anoOuEdicao: 'IFRS S1 / IFRS S2 (2023)',
    tipo: 'Internacional',
    linkExterno: 'https://www.ifrs.org/issued-standards/sustainability-reporting-standards/',
  },
  {
    id: 'pnrs',
    sigla: 'PNRS — Lei 12.305/2010',
    nome: 'Política Nacional de Resíduos Sólidos',
    organizacao: 'Governo Federal / MMA',
    foco: 'Logística reversa, rastreabilidade MTR/SINIR e responsabilidade compartilhada',
    descricao:
      'Marco legal de gestão de resíduos sólidos no Brasil, estabelecendo logística reversa obrigatória, custódia documental com MTR e tratamento prioritário de resíduos e peças pós-consumo.',
    anoOuEdicao: 'Lei Federal nº 12.305/2010',
    tipo: 'Nacional',
  },
  {
    id: 'dm-orb-001',
    sigla: 'Diretriz Técnica DM-ORB-001 v1.1',
    nome: 'Documento Metodológico Interno de Quantificação e Custódia dMRV',
    organizacao: 'Comitê Técnico Metodológico Orbis Protocol',
    foco: 'Arquitetura de cálculo, critérios de elegibilidade, incerteza em quadratura e deduplicação',
    descricao:
      'Especificação técnica protegida que rege a apuração matemática, snapshots criptográficos prospectivos, fronteiras berço-ao-portão e regras de integridade pericial aplicadas a cada lote.',
    anoOuEdicao: 'Versão 1.1 (Norma Restrita)',
    tipo: 'Setorial',
    linkInterno: '/norma-dm-orb-001',
  },
]

import { useSeo } from '@/hooks/useSeo'

export default function FatoresEmissaoPublicoPage() {
  useSeo({
    title: 'Métricas e Referências Canônicas — Orbis Protocol',
    description:
      'Governança metodológica e referências canônicas de fatores de emissão aplicados na quantificação dMRV e prova documental.',
  })

  return (
    <div className="min-h-screen py-8 md:py-14 bg-slate-50 dark:bg-[#0A1628] text-slate-900 dark:text-[#F8FAFC] transition-colors">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 space-y-10">
        {/* Top Breadcrumb */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
          <BreadcrumbOrbis
            items={[
              { label: 'Protocolo', href: '/protocolo' },
              { label: 'Métricas e Referências' },
            ]}
          />
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-[#059669]/15 border border-emerald-300 dark:border-[#059669]/40 text-emerald-800 dark:text-[#12B886] text-xs font-mono font-bold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-[#12B886] animate-pulse" />
              FONTES PRIMÁRIAS CANÔNICAS
            </span>
          </div>
        </div>

        {/* HERO INSTITUCIONAL */}
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-white via-slate-50 to-white dark:from-[#0E1A2E] dark:via-[#111827] dark:to-[#0E1A2E] border border-slate-200 dark:border-slate-800 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-4xl space-y-5">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-[#111827] border border-emerald-300 dark:border-[#059669]/40 text-emerald-700 dark:text-[#12B886] text-xs font-mono font-bold uppercase tracking-wider">
              <Scale className="w-3.5 h-3.5" />
              <span>Governança Metodológica & Transparência Técnica</span>
            </div>

            <h1 className="font-heading font-black text-3xl sm:text-5xl text-slate-900 dark:text-[#F8FAFC] tracking-tight">
              Métricas e Referências
            </h1>

            <p className="text-base sm:text-lg text-emerald-800 dark:text-[#12B886] font-medium leading-relaxed">
              A Orbis Protocol aplica fatores de emissão de fontes primárias reconhecidas
              internacionalmente e alinhadas às diretrizes regulatórias e normativas mais rigorosas
              de descarbonização.
            </p>

            <p className="text-sm sm:text-base text-slate-600 dark:text-[#94A3B8] leading-relaxed">
              Os fatores aplicados a cada lote são divulgados exclusivamente no resultado do
              Verificador, vinculados ao hash SHA-256 do documento e congelados no momento do
              processamento (snapshot prospectivo imutável). Essa sistemática assegura
              rastreabilidade pericial ponta a ponta sem divulgar réguas descontextualizadas da
              custódia documental.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3">
              <div className="p-3.5 rounded-xl bg-white dark:bg-[#0A1628] border border-slate-200 dark:border-slate-800 shadow-sm">
                <span className="text-[11px] uppercase font-mono text-slate-500 dark:text-[#94A3B8] flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-[#12B886]" />
                  Fontes Primárias
                </span>
                <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-[#F8FAFC] block mt-1">
                  Reconhecidas Internacionalmente
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-white dark:bg-[#0A1628] border border-slate-200 dark:border-slate-800 shadow-sm">
                <span className="text-[11px] uppercase font-mono text-slate-500 dark:text-[#94A3B8] flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-blue-600 dark:text-[#3B82F6]" />
                  Vínculo Criptográfico
                </span>
                <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-[#F8FAFC] block mt-1">
                  Hash SHA-256 por Lote
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-white dark:bg-[#0A1628] border border-slate-200 dark:border-slate-800 shadow-sm">
                <span className="text-[11px] uppercase font-mono text-slate-500 dark:text-[#94A3B8] flex items-center gap-1.5">
                  <FileCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-[#12B886]" />
                  Instrumento Pericial
                </span>
                <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-[#F8FAFC] block mt-1">
                  Atestado Orbis (com ART/RRT)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* AVISO DISCRETO: CATÁLOGO PERICIAL COM VALORES É RESTRITO */}
        <div className="p-6 rounded-2xl bg-slate-100 dark:bg-[#0E1A2E] border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-slate-900 dark:text-[#F8FAFC]">
              <Lock className="w-4 h-4 text-emerald-600 dark:text-[#12B886]" />
              <span className="font-heading font-bold text-sm">
                Catálogo Pericial com Valores Numéricos é Restrito
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-[#94A3B8] max-w-2xl leading-relaxed">
              A régua completa com valores numéricos de fatores de emissão, incertezas e equações de
              baseline é disponibilizada no resultado de cada lote atestado mediante validação do
              hash no Verificador ou no acesso à documentação técnica restrita.
            </p>
          </div>
          <Link
            to="/verificador"
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs font-mono flex items-center gap-2 transition-all shadow-sm shrink-0"
          >
            <Search className="w-4 h-4" />
            <span>Consultar no Verificador</span>
          </Link>
        </div>

        {/* GRADE DAS REFERÊNCIAS CANÔNICAS */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-heading font-extrabold text-2xl text-slate-900 dark:text-[#F8FAFC]">
                Referências Canônicas e Padrões Aplicados
              </h2>
              <p className="text-xs text-slate-600 dark:text-[#94A3B8]">
                Bases bibliográficas, regulatórias e normativas que orientam a quantificação dMRV da
                Orbis Protocol
              </p>
            </div>
            <span className="text-xs font-mono text-slate-500 dark:text-[#94A3B8]">
              {REFERENCIAS_CANONICAS.length} referências
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {REFERENCIAS_CANONICAS.map((ref) => (
              <div
                key={ref.id}
                className="p-6 rounded-2xl bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2.5 py-0.5 rounded-md bg-emerald-50 dark:bg-[#059669]/15 border border-emerald-200 dark:border-[#059669]/40 text-emerald-800 dark:text-[#12B886] font-mono text-xs font-bold">
                      {ref.sigla}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-[#111827] text-slate-600 dark:text-[#94A3B8]">
                      {ref.tipo} • {ref.anoOuEdicao}
                    </span>
                  </div>

                  <h3 className="font-heading font-bold text-base text-slate-900 dark:text-[#F8FAFC]">
                    {ref.nome}
                  </h3>

                  <div className="text-[11px] font-mono text-emerald-700 dark:text-[#12B886]">
                    {ref.organizacao}
                  </div>

                  <p className="text-xs text-slate-600 dark:text-[#94A3B8] leading-relaxed">
                    {ref.descricao}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-[11px] font-mono text-slate-500 dark:text-[#94A3B8] truncate max-w-[240px]">
                    {ref.foco}
                  </span>
                  {ref.linkInterno ? (
                    <Link
                      to={ref.linkInterno}
                      className="text-emerald-700 dark:text-[#12B886] hover:underline font-mono text-[11px] font-bold flex items-center gap-1 shrink-0"
                    >
                      <span>Acessar Norma</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  ) : ref.linkExterno ? (
                    <a
                      href={ref.linkExterno}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-700 dark:text-[#12B886] hover:underline font-mono text-[11px] font-bold flex items-center gap-1 shrink-0"
                    >
                      <span>Fonte Oficial</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500">
                      Legislação Federal
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* DIRETRIZ TÉCNICA DM-ORB-001 EM DESTAQUE */}
        <div className="p-8 rounded-3xl bg-white dark:bg-[#0E1A2E] border-2 border-emerald-500/40 shadow-lg space-y-4">
          <div className="flex items-center gap-2 text-emerald-700 dark:text-[#12B886] text-xs font-mono font-bold uppercase">
            <BookOpen className="w-4 h-4" />
            <span>Diretriz Técnica Restrita • Documento Normativo Orbis</span>
          </div>

          <div className="space-y-2">
            <h2 className="font-heading font-extrabold text-2xl text-slate-900 dark:text-[#F8FAFC]">
              Diretriz Técnica DM-ORB-001 v1.1
            </h2>
            <p className="text-sm text-slate-600 dark:text-[#94A3B8] leading-relaxed">
              A formulação matemática completa, as equações de baseline de cada família material, o
              regime de propagação de incerteza em quadratura e as travas de integridade pericial
              estão formalizados na Diretriz Técnica DM-ORB-001 v1.1. O acesso à norma integral
              exige autenticação e aceite de confidencialidade técnica.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2">
            <div className="text-xs text-slate-500 dark:text-[#94A3B8] flex items-center gap-1.5 font-mono">
              <Lock className="w-3.5 h-3.5 text-emerald-600 dark:text-[#12B886]" />
              <span>Acesso restrito para usuários cadastrados com perfil técnico ou pericial</span>
            </div>
            <Link
              to="/norma-dm-orb-001"
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs font-mono flex items-center justify-center gap-2 transition-all shadow-sm shrink-0"
            >
              <span>Acessar Diretriz DM-ORB-001</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* HISTÓRICO DE REVISÕES DA NORMA DM-ORB-001 */}
        <div
          id="historico-revisoes"
          className="p-8 rounded-3xl bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-slate-800 shadow-sm space-y-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-5">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-[#12B886] text-xs font-mono font-bold uppercase tracking-wider">
                <History className="w-4 h-4" />
                <span>Governança Versionada • Registro de Revisões</span>
              </div>
              <h2 className="font-heading font-black text-2xl text-slate-900 dark:text-[#F8FAFC]">
                Histórico de Revisões da Norma DM-ORB-001
              </h2>
              <p className="text-xs text-slate-600 dark:text-[#94A3B8]">
                Controle cronológico de alterações metodológicas, justificativas técnicas periciais
                e congelamento de vigência.
              </p>
            </div>
            <span className="self-start sm:self-auto px-3 py-1 rounded-full bg-slate-100 dark:bg-[#111827] text-slate-700 dark:text-slate-300 font-mono text-xs font-semibold border border-slate-200 dark:border-slate-800 flex items-center gap-1.5">
              <GitCommit className="w-3.5 h-3.5 text-emerald-600 dark:text-[#12B886]" />
              {HISTORICO_REVISOES_DM_ORB_001.length} versões registradas
            </span>
          </div>

          <div className="space-y-6">
            {HISTORICO_REVISOES_DM_ORB_001.map((rev) => {
              const isVigente = rev.status === 'vigente'
              return (
                <div
                  key={rev.versao}
                  className={`p-6 sm:p-7 rounded-2xl border transition-all ${
                    isVigente
                      ? 'bg-emerald-50/40 dark:bg-[#059669]/5 border-emerald-500/50 shadow-md ring-1 ring-emerald-500/20'
                      : 'bg-slate-50/60 dark:bg-[#0A1628]/60 border-slate-200 dark:border-slate-800'
                  }`}
                >
                  {/* Cabeçalho da revisão */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span
                        className={`px-3 py-1 rounded-md font-mono text-xs font-black tracking-wide ${
                          isVigente
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        Versão {rev.versao}
                      </span>
                      {isVigente ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-[#059669]/20 text-emerald-800 dark:text-[#12B886] font-mono text-[11px] font-bold border border-emerald-300 dark:border-[#059669]/40 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Vigente
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono text-[11px] font-medium border border-slate-200 dark:border-slate-700">
                          Histórica
                        </span>
                      )}
                      <span className="text-xs font-mono text-slate-500 dark:text-[#94A3B8] flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        Vigência: {rev.dataVigencia}
                      </span>
                    </div>

                    {rev.responsavelTecnico && (
                      <span className="text-[11px] font-mono text-slate-500 dark:text-[#94A3B8]">
                        {rev.responsavelTecnico}
                      </span>
                    )}
                  </div>

                  {/* Título e Resumo da revisão */}
                  <div className="space-y-2 mb-5">
                    <h3 className="font-heading font-bold text-lg text-slate-900 dark:text-[#F8FAFC]">
                      {rev.titulo}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-[#94A3B8] leading-relaxed">
                      {rev.resumo}
                    </p>
                  </div>

                  {/* Lista detalhada das alterações */}
                  <div className="space-y-3 pt-3 border-t border-slate-200/70 dark:border-slate-800/80">
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block">
                      Detalhamento das Alterações e Justificativas Periciais:
                    </span>
                    <div className="grid grid-cols-1 gap-3">
                      {rev.alteracoes.map((alt, idx) => (
                        <div
                          key={idx}
                          className="p-3.5 rounded-xl bg-white dark:bg-[#0E1A2E] border border-slate-200/80 dark:border-slate-800 text-xs space-y-1.5"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="font-heading font-bold text-slate-900 dark:text-[#F8FAFC] flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              {alt.item}
                            </span>
                            {alt.referenciaSecao && (
                              <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-[#111827] text-slate-600 dark:text-[#94A3B8] font-mono text-[10px]">
                                Ref. {alt.referenciaSecao}
                              </span>
                            )}
                          </div>
                          <p className="text-slate-600 dark:text-[#94A3B8] leading-relaxed">
                            <strong className="text-slate-800 dark:text-slate-200">
                              O que mudou:
                            </strong>{' '}
                            {alt.descricao}
                          </p>
                          <p className="text-emerald-800 dark:text-[#12B886] leading-relaxed">
                            <strong className="text-emerald-900 dark:text-[#34D399]">
                              Por quê:
                            </strong>{' '}
                            {alt.justificativa}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0A1628] border border-slate-200 dark:border-slate-800 flex items-start gap-3 text-xs text-slate-600 dark:text-[#94A3B8]">
            <AlertCircle className="w-4 h-4 text-emerald-600 dark:text-[#12B886] shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Princípio de Imutabilidade Prospectiva:</strong> Alterações normativas possuem
              efeito estritamente prospectivo a partir da data de vigência de cada revisão. Nenhum
              laudo, lote dMRV ou Atestado de Conformidade Orbis emitido sob a vigência anterior tem
              seus cálculos retroagidos ou recalculados, preservando a imutabilidade pericial
              congelada no hash SHA-256 de origem.
            </p>
          </div>
        </div>

        {/* DELIMITAÇÃO INSTITUCIONAL E TERMINOLOGIA CANÔNICA */}
        <div className="p-8 rounded-3xl bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-emerald-700 dark:text-[#12B886] text-xs font-mono font-bold uppercase">
            <ShieldCheck className="w-4 h-4" />
            <span>Delimitação Institucional e Governança Pericial</span>
          </div>

          <h2 className="font-heading font-extrabold text-xl text-slate-900 dark:text-[#F8FAFC]">
            Infraestrutura de Prova Documental e Atestado Orbis
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-600 dark:text-[#94A3B8] leading-relaxed">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0A1628] border border-slate-200 dark:border-slate-800 space-y-2">
              <span className="font-mono font-bold text-slate-900 dark:text-[#F8FAFC] block uppercase">
                Atestado de Conformidade Orbis (com ART/RRT)
              </span>
              <p>
                Instrumento técnico-pericial subscrito por engenheiro ou perito legalmente
                habilitado junto ao respectivo Conselho Profissional (CREA/CAU/CFT), com emissão de
                Anotação de Responsabilidade Técnica (ART/RRT). Atesta a idoneidade documental do
                lote, a pesagem física e a conformidade metodológica com a Diretriz DM-ORB-001.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0A1628] border border-slate-200 dark:border-slate-800 space-y-2">
              <span className="font-mono font-bold text-slate-900 dark:text-[#F8FAFC] block uppercase">
                Verificação Independente e Mercado Regulado
              </span>
              <p>
                A Orbis Protocol atua como infraestrutura de dMRV e custódia criptográfica de dados.
                Eventual emissão de créditos ou transação em mercados regulados (como o SBCE sob a
                Lei 15.042/2024) depende de auditoria de terceira parte conduzida por Organismo de
                Verificação e Validação (VVB) credenciado, sendo o Atestado Orbis o substrato
                probatório documental.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
