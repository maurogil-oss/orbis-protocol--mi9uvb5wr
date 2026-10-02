import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Scale,
  ShieldCheck,
  Lock,
  Layers,
  Search,
  Filter,
  Info,
  ExternalLink,
  ChevronRight,
  BookOpen,
  ArrowRight,
  Flame,
  Zap,
  Truck,
  Recycle,
  Sparkles,
  FileCheck,
  CheckCircle2,
  Calendar,
  Download,
  AlertTriangle,
  FileText,
  HelpCircle,
  Copy,
  Check,
  ShieldAlert,
  Database,
  Calculator,
} from 'lucide-react'
import {
  CATALOGO_FATORES_CO2E,
  METADADOS_CATALOGO_FATORES,
  GWP_IPCC_AR6_OFICIAL,
  type FatorCatalogoItem,
} from '@/services/catalogoFatoresOficiais'
import {
  FATORES_MATERIAIS_V2,
  GWP_AR6_R134A,
  DF_REFRIGERANTE_PADRAO,
  VERSAO_METODOLOGIA_CDV_V2,
} from '@/services/cdvEngineV2'

export default function FatoresEmissaoPublicoPage() {
  const [abaAtiva, setAbaAtiva] = useState<'documento' | 'catalogo' | 'calculadora'>('documento')
  const [busca, setBusca] = useState('')
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>('todos')
  const [tierFiltro, setTierFiltro] = useState<string>('todos')
  const [mostrarAr6Gwp, setMostrarAr6Gwp] = useState(false)
  const [copiouChave, setCopiouChave] = useState(false)

  // Itens filtrados para o catálogo
  const fatoresFiltrados = useMemo(() => {
    return CATALOGO_FATORES_CO2E.filter((item) => {
      if (categoriaFiltro !== 'todos' && item.categoria !== categoriaFiltro) {
        return false
      }
      if (tierFiltro !== 'todos' && item.tierIncerteza !== tierFiltro) {
        return false
      }
      if (!busca.trim()) return true
      const termo = busca.toLowerCase().trim()
      return (
        item.nomeMaterial.toLowerCase().includes(termo) ||
        item.descricao.toLowerCase().includes(termo) ||
        item.fonteOficial.toLowerCase().includes(termo) ||
        item.normaPadrao.toLowerCase().includes(termo) ||
        item.unidade.toLowerCase().includes(termo)
      )
    })
  }, [busca, categoriaFiltro, tierFiltro])

  const categorias = [
    { id: 'todos', label: 'Todos os Fatores', icon: Layers },
    { id: 'cdv_materiais', label: 'Desmontagem CDV (DPP)', icon: Recycle },
    { id: 'combustiveis', label: 'Combustíveis (Escopo 1)', icon: Flame },
    { id: 'energia_eletrica', label: 'Eletricidade (Escopo 2)', icon: Zap },
    { id: 'transporte_logistica', label: 'Transporte & Frete', icon: Truck },
    { id: 'utilidades_residuos', label: 'Utilidades & Insetting', icon: Sparkles },
  ]

  const formatarValorFator = (item: FatorCatalogoItem) => {
    const valor = item.valorFator
    if (valor === 0) return '0,00'
    if (Math.abs(valor) < 0.01) {
      return valor.toLocaleString('pt-BR', { minimumFractionDigits: 4, maximumFractionDigits: 4 })
    }
    return valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 3 })
  }

  const exportarCatalogoCsv = () => {
    const headers = [
      'ID',
      'Categoria',
      'Material / Insumo',
      'Fator CO2e',
      'Unidade',
      'Tipo de Impacto',
      'Fonte Metodológica',
      'Norma de Referência',
      'Ano Base',
      'Tier Incerteza',
      'Incerteza Padrao (%)',
      'Versão Catálogo',
      'Regra Snapshot',
    ]

    const linhas = CATALOGO_FATORES_CO2E.map((f) => [
      `"${f.id}"`,
      `"${f.categoria}"`,
      `"${f.nomeMaterial.replace(/"/g, '""')}"`,
      `"${f.valorFator}"`,
      `"${f.unidade}"`,
      `"${f.tipoImpacto}"`,
      `"${f.fonteOficial.replace(/"/g, '""')}"`,
      `"${f.normaPadrao.replace(/"/g, '""')}"`,
      `"${f.anoReferencia}"`,
      `"${f.tierIncerteza}"`,
      `"±${f.incertezaPct}%"`,
      `"${METADADOS_CATALOGO_FATORES.versao}"`,
      `"Congelado no documento na emissão"`,
    ])

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(';'), ...linhas.map((l) => l.join(';'))].join('\n')

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute(
      'download',
      `orbis_catalogo_fatores_co2e_${METADADOS_CATALOGO_FATORES.versao}.csv`,
    )
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const copiarChaveDedupExemplo = () => {
    navigator.clipboard?.writeText('9BWAA05U0DP***204_PART-GOL-CAPO-01_PR-BX-2026-991204')
    setCopiouChave(true)
    setTimeout(() => setCopiouChave(false), 2000)
  }

  return (
    <div className="min-h-screen py-8 md:py-14 bg-[#0A0E12] text-[#F4F7FA]">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 space-y-10">
        {/* Top Breadcrumb & Status Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[rgba(244,247,250,0.08)] pb-4">
          <div className="flex items-center gap-2 text-xs font-mono text-[#93A3B5]">
            <Link to="/" className="hover:text-[#12B886] transition-colors">
              Orbis Protocol
            </Link>
            <ChevronRight className="w-3.5 h-3.5 opacity-40" />
            <Link to="/radar-regulatorio" className="hover:text-[#12B886] transition-colors">
              Governança dMRV
            </Link>
            <ChevronRight className="w-3.5 h-3.5 opacity-40" />
            <span className="text-[#12B886] font-semibold">
              Documento Metodológico DM-ORB-001 v1.1
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-[#12B886]/15 border border-[#12B886]/40 text-[#12B886] text-[11px] font-mono font-bold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#12B886] animate-pulse" />
              {VERSAO_METODOLOGIA_CDV_V2} • VIGÊNCIA ATIVA
            </span>
            <button
              onClick={exportarCatalogoCsv}
              className="px-3 py-1 rounded-lg bg-[#16202B] hover:bg-[#12B886]/20 border border-[rgba(244,247,250,0.15)] text-xs text-[#F4F7FA] hover:text-[#12B886] transition-all flex items-center gap-1.5 font-mono"
              title="Baixar fatores em CSV para auditoria"
            >
              <Download className="w-3.5 h-3.5 text-[#12B886]" />
              <span>Exportar CSV</span>
            </button>
          </div>
        </div>

        {/* HERO INSTITUCIONAL DO DOCUMENTO METODOLÓGICO */}
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-[#111820] via-[#111820] to-[#16202B] border border-[#12B886]/40 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#12B886]/5 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-4xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#16202B] border border-[#12B886]/40 text-[#12B886] text-xs font-mono font-bold uppercase tracking-wider">
              <Scale className="w-3.5 h-3.5 text-[#12B886]" />
              <span>Documento Normativo Público • DM-ORB-001 v1.1</span>
            </div>

            <h1 className="font-heading font-black text-3xl sm:text-5xl text-[#F4F7FA] tracking-tight">
              Metodologia de Quantificação de Emissões Evitadas na Desmontagem Veicular
            </h1>

            <p className="text-base sm:text-lg text-[#12B886] font-medium leading-relaxed">
              Especificação técnica formal do motor dMRV Orbis v2: critérios de elegibilidade,
              equações de baseline, regime de incerteza em quadratura, segregação fóssil/biogênica e
              deduplicação inter-CDVs.
            </p>

            <p className="text-sm sm:text-base text-[#93A3B5] leading-relaxed">
              O presente documento rege as apurações públicas em passaportes digitais de produto
              (DPP), dossiês de elegibilidade do Programa MOVER (Lei nº 14.902/2024) e laudos
              periciais com ART/RRT. Todo cálculo executado pela API e motor segue estritamente as
              fórmulas, prazos de snapshot e travas aqui estabelecidos.
            </p>

            {/* Metadados Técnicos em Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
              <div className="p-3.5 rounded-xl bg-[#0A0E12]/80 border border-[rgba(244,247,250,0.08)]">
                <span className="text-[10px] uppercase font-mono text-[#93A3B5] flex items-center gap-1">
                  <FileCheck className="w-3 h-3 text-[#12B886]" />
                  Código Metodológico
                </span>
                <span className="font-mono text-xs sm:text-sm font-bold text-[#12B886]">
                  {VERSAO_METODOLOGIA_CDV_V2}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-[#0A0E12]/80 border border-[rgba(244,247,250,0.08)]">
                <span className="text-[10px] uppercase font-mono text-[#93A3B5] flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-[#D9B36C]" />
                  Data de Vigência
                </span>
                <span className="font-mono text-xs font-bold text-[#D9B36C]">
                  {METADADOS_CATALOGO_FATORES.dataVigencia}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-[#0A0E12]/80 border border-[rgba(244,247,250,0.08)]">
                <span className="text-[10px] uppercase font-mono text-[#93A3B5] flex items-center gap-1">
                  <Lock className="w-3 h-3 text-[#3B82F6]" />
                  Regra de Snapshot
                </span>
                <span className="font-mono text-xs font-bold text-[#3B82F6]">
                  Prospectiva Imutável
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-[#0A0E12]/80 border border-[rgba(244,247,250,0.08)]">
                <span className="text-[10px] uppercase font-mono text-[#93A3B5] flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-[#F4F7FA]" />
                  Status Regulatório
                </span>
                <span className="font-mono text-xs font-bold text-[#F4F7FA]">SBCE / MOVER</span>
              </div>
            </div>
          </div>
        </div>

        {/* NAVEGAÇÃO ENTRE ABAS PRINCIPAIS */}
        <div className="flex border-b border-[rgba(244,247,250,0.1)] gap-2 overflow-x-auto">
          <button
            onClick={() => setAbaAtiva('documento')}
            className={`px-4 py-3 text-xs sm:text-sm font-heading font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition-all ${
              abaAtiva === 'documento'
                ? 'border-[#12B886] text-[#12B886]'
                : 'border-transparent text-[#93A3B5] hover:text-[#F4F7FA]'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Texto Integral DM-ORB-001 v1.1</span>
          </button>

          <button
            onClick={() => setAbaAtiva('catalogo')}
            className={`px-4 py-3 text-xs sm:text-sm font-heading font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition-all ${
              abaAtiva === 'catalogo'
                ? 'border-[#12B886] text-[#12B886]'
                : 'border-transparent text-[#93A3B5] hover:text-[#F4F7FA]'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Catálogo Curado de Fatores ({CATALOGO_FATORES_CO2E.length})</span>
          </button>

          <button
            onClick={() => setAbaAtiva('calculadora')}
            className={`px-4 py-3 text-xs sm:text-sm font-heading font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition-all ${
              abaAtiva === 'calculadora'
                ? 'border-[#12B886] text-[#12B886]'
                : 'border-transparent text-[#93A3B5] hover:text-[#F4F7FA]'
            }`}
          >
            <Calculator className="w-4 h-4" />
            <span>Apêndices & Memória de Cálculo (DEMO)</span>
          </button>
        </div>

        {/* ========================================================= */}
        {/* ABA 1: TEXTO INTEGRAL DO DOCUMENTO METODOLÓGICO DM-ORB-001 v1.1 */}
        {/* ========================================================= */}
        {abaAtiva === 'documento' && (
          <div className="space-y-10">
            {/* ÍNDICE RÁPIDO DO DOCUMENTO */}
            <div className="p-6 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.1)]">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#12B886] font-bold block mb-3">
                Sumário do Documento Metodológico DM-ORB-001 v1.1
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                <a
                  href="#sec-1"
                  className="p-2 rounded-lg bg-[#0A0E12] hover:bg-[#16202B] text-[#93A3B5] hover:text-[#12B886] transition-colors flex items-center gap-1.5 font-mono"
                >
                  <span>§1</span>
                  <span className="truncate">Objetivo, Gatilho SBCE & Art. 6</span>
                </a>
                <a
                  href="#sec-3a"
                  className="p-2 rounded-lg bg-[#0A0E12] hover:bg-[#16202B] text-[#93A3B5] hover:text-[#12B886] transition-colors flex items-center gap-1.5 font-mono"
                >
                  <span>§3-A</span>
                  <span className="truncate">5 Condições de Aplicabilidade</span>
                </a>
                <a
                  href="#sec-51"
                  className="p-2 rounded-lg bg-[#0A0E12] hover:bg-[#16202B] text-[#93A3B5] hover:text-[#12B886] transition-colors flex items-center gap-1.5 font-mono"
                >
                  <span>§5.1</span>
                  <span className="truncate">Classificação de Materiais</span>
                </a>
                <a
                  href="#sec-53"
                  className="p-2 rounded-lg bg-[#0A0E12] hover:bg-[#16202B] text-[#93A3B5] hover:text-[#12B886] transition-colors flex items-center gap-1.5 font-mono"
                >
                  <span>§5.3</span>
                  <span className="truncate">Dedup Inter-CDVs & HTTP 409</span>
                </a>
                <a
                  href="#sec-61"
                  className="p-2 rounded-lg bg-[#0A0E12] hover:bg-[#16202B] text-[#93A3B5] hover:text-[#12B886] transition-colors flex items-center gap-1.5 font-mono"
                >
                  <span>§6.1</span>
                  <span className="truncate">Refrigerantes R-134a & GWP AR6</span>
                </a>
                <a
                  href="#sec-63"
                  className="p-2 rounded-lg bg-[#0A0E12] hover:bg-[#16202B] text-[#93A3B5] hover:text-[#12B886] transition-colors flex items-center gap-1.5 font-mono"
                >
                  <span>§6.3</span>
                  <span className="truncate">Fórmula de Baseline do Motor</span>
                </a>
                <a
                  href="#sec-7"
                  className="p-2 rounded-lg bg-[#0A0E12] hover:bg-[#16202B] text-[#93A3B5] hover:text-[#12B886] transition-colors flex items-center gap-1.5 font-mono"
                >
                  <span>§7</span>
                  <span className="truncate">Regime de Incerteza T1–T4</span>
                </a>
                <a
                  href="#sec-8"
                  className="p-2 rounded-lg bg-[#0A0E12] hover:bg-[#16202B] text-[#93A3B5] hover:text-[#12B886] transition-colors flex items-center gap-1.5 font-mono"
                >
                  <span>§8</span>
                  <span className="truncate">Registro Verificável de Custódia</span>
                </a>
                <a
                  href="#sec-9"
                  className="p-2 rounded-lg bg-[#0A0E12] hover:bg-[#16202B] text-[#93A3B5] hover:text-[#12B886] transition-colors flex items-center gap-1.5 font-mono"
                >
                  <span>§9</span>
                  <span className="truncate">Atestado Orbis vs Certificadora VVB</span>
                </a>
                <a
                  href="#sec-10"
                  className="p-2 rounded-lg bg-[#0A0E12] hover:bg-[#16202B] text-[#93A3B5] hover:text-[#12B886] transition-colors flex items-center gap-1.5 font-mono"
                >
                  <span>§10</span>
                  <span className="truncate">Poder de Ajuste & Não-Retroatividade</span>
                </a>
                <a
                  href="#apendice-b"
                  className="p-2 rounded-lg bg-[#0A0E12] hover:bg-[#16202B] text-[#93A3B5] hover:text-[#12B886] transition-colors flex items-center gap-1.5 font-mono"
                >
                  <span>Ap. B</span>
                  <span className="truncate">Citação de Fontes & Status</span>
                </a>
                <a
                  href="#apendice-e"
                  className="p-2 rounded-lg bg-[#0A0E12] hover:bg-[#16202B] text-[#93A3B5] hover:text-[#12B886] transition-colors flex items-center gap-1.5 font-mono"
                >
                  <span>Ap. E</span>
                  <span className="truncate">Glossário das 8 Métricas</span>
                </a>
              </div>
            </div>

            {/* SEÇÃO 1: OBJETIVO E ESCOPO RESTROITO */}
            <section
              id="sec-1"
              className="p-8 rounded-3xl bg-[#111820] border border-[rgba(244,247,250,0.1)] space-y-4"
            >
              <div className="flex items-center gap-2 text-[#12B886] text-xs font-mono font-bold uppercase">
                <BookOpen className="w-4 h-4" />
                <span>Seção 1 • Fundamentação e Escopo Normativo</span>
              </div>
              <h2 className="font-heading font-extrabold text-2xl text-[#F4F7FA]">
                §1. Objetivo, Escopo Restrito e Cláusula de Gatilho SBCE / Artigo 6
              </h2>
              <div className="space-y-3 text-sm text-[#93A3B5] leading-relaxed">
                <p>
                  <strong className="text-[#F4F7FA]">1.1 Objetivo:</strong> O presente documento
                  metodológico estabelece os critérios objetivos, premissas de conservadorismo e
                  equações matemáticas para quantificação, registro e monitoramento dMRV (digital
                  Measurement, Reporting and Verification) de emissões de gases de efeito estufa
                  (GEE) evitadas decorrentes da recuperação, desmontagem técnica e reinserção de
                  peças e materiais automotivos em Centros de Desmontagem Veicular (CDVs)
                  credenciados.
                </p>
                <p>
                  <strong className="text-[#F4F7FA]">1.2 Escopo Restrito:</strong> A aplicação desta
                  metodologia é estritamente restrita a fluxos de desmontagem que satisfaçam
                  cumulativamente a totalidade das condições de aplicabilidade estabelecidas no
                  §3-A. Nenhum lote, componente ou material que descumpra qualquer dos requisitos do
                  §3-A será admitido pelo motor de cálculo ou receberá chancela dMRV.
                </p>
                <div className="p-4 rounded-xl bg-[#0A0E12] border border-[#D9B36C]/40 space-y-2">
                  <div className="flex items-center gap-2 text-[#D9B36C] font-mono text-xs font-bold uppercase">
                    <ShieldAlert className="w-4 h-4 shrink-0" />
                    <span>
                      Cláusula de Gatilho Regulatório — SBCE e Artigo 6 do Acordo de Paris
                    </span>
                  </div>
                  <p className="text-xs text-[#93A3B5] leading-relaxed">
                    <strong className="text-[#F4F7FA]">1.3 Cláusula de Gatilho:</strong> Os
                    registros gerados sob este documento constituem infraestrutura de prova
                    documental e comprovação pericial de insetting circular. Em estrita observância
                    à Lei Federal nº 15.042/2024 (Sistema Brasileiro de Comércio de Emissões de GEE
                    — SBCE) e às diretrizes do Artigo 6 do Acordo de Paris, qualquer conversão,
                    fungibilidade externa ou transação destes registros como créditos de
                    descarbonização ou permissões de emissão fica{' '}
                    <strong className="text-[#D9B36C]">
                      expressamente condicionada à validação e verificação independente por
                      Organismo de Verificação e Validação (VVB) credenciado
                    </strong>{' '}
                    pela autoridade climática nacional competente ou entidade de acreditação oficial
                    (INMETRO / UNFCCC).
                  </p>
                </div>
              </div>
            </section>

            {/* SEÇÃO 3-A: 5 CONDIÇÕES DE APLICABILIDADE */}
            <section
              id="sec-3a"
              className="p-8 rounded-3xl bg-[#111820] border border-[#12B886]/30 space-y-4"
            >
              <div className="flex items-center gap-2 text-[#12B886] text-xs font-mono font-bold uppercase">
                <CheckCircle2 className="w-4 h-4" />
                <span>Seção 3-A • Critérios Mandatórios de Elegibilidade</span>
              </div>
              <h2 className="font-heading font-extrabold text-2xl text-[#F4F7FA]">
                §3-A. As Cinco Condições Cumulativas de Aplicabilidade
              </h2>
              <p className="text-sm text-[#93A3B5]">
                O motor Orbis v2 executa checagem algorítmica destas 5 condições antes de qualquer
                confirmação de claim:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                {/* Condição 1 */}
                <div className="p-5 rounded-2xl bg-[#0A0E12] border border-[rgba(244,247,250,0.1)] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-[#12B886]">CONDIÇÃO (i)</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#12B886]/10 text-[#12B886] border border-[#12B886]/30">
                      Mandatória
                    </span>
                  </div>
                  <h3 className="font-heading font-bold text-sm text-[#F4F7FA]">
                    Destinação Documentada Obrigatória
                  </h3>
                  <p className="text-xs text-[#93A3B5] leading-relaxed">
                    Para que uma peça tenha seu claim classificado como{' '}
                    <strong className="text-[#12B886]">CONFIRMADO</strong>, é obrigatória a
                    vinculação de evidência fiscal e ambiental de saída definitiva — NF-e de venda
                    comercial (chave de 44 dígitos) ou Manifesto de Transporte de Resíduos
                    (MTR/SINIR). Peças em estoque permanecem como{' '}
                    <strong className="text-[#D9B36C]">CLAIM POTENCIAL</strong> e são segregadas do
                    saldo líquido confirmado.
                  </p>
                </div>

                {/* Condição 2 */}
                <div className="p-5 rounded-2xl bg-[#0A0E12] border border-[rgba(244,247,250,0.1)] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-[#12B886]">
                      CONDIÇÃO (ii)
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#12B886]/10 text-[#12B886] border border-[#12B886]/30">
                      Massa &gt; 1%
                    </span>
                  </div>
                  <h3 className="font-heading font-bold text-sm text-[#F4F7FA]">
                    Dado Medido para Itens Relevantes
                  </h3>
                  <p className="text-xs text-[#93A3B5] leading-relaxed">
                    Todo componente cuja massa individual represente mais de{' '}
                    <strong className="text-[#F4F7FA]">1,0% da massa total do lote</strong> deve
                    obrigatoriamente possuir medição direta de massa via instrumento calibrado
                    (balança rastreável com certificado metrológico válido) associado à evidência
                    fotográfica ou tara fiscal.
                  </p>
                </div>

                {/* Condição 3 */}
                <div className="p-5 rounded-2xl bg-[#0A0E12] border border-[rgba(244,247,250,0.1)] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-[#12B886]">
                      CONDIÇÃO (iii)
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#12B886]/10 text-[#12B886] border border-[#12B886]/30">
                      Conservadorismo
                    </span>
                  </div>
                  <h3 className="font-heading font-bold text-sm text-[#F4F7FA]">
                    Conservadorismo em Toda Direção Incerta
                  </h3>
                  <p className="text-xs text-[#93A3B5] leading-relaxed">
                    Havendo dúvida na identificação de liga, especificação de polímero ou fronteira
                    de projeto, o motor aplica compulsoriamente a alternativa de{' '}
                    <strong className="text-[#F4F7FA]">menor benefício de carbono</strong> (piso de
                    emissão evitada) e{' '}
                    <strong className="text-[#F4F7FA]">
                      maior penalidade de emissões de projeto (PE)
                    </strong>
                    , eliminando o risco de inflação metodológica.
                  </p>
                </div>

                {/* Condição 4 */}
                <div className="p-5 rounded-2xl bg-[#0A0E12] border border-[rgba(244,247,250,0.1)] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-[#12B886]">
                      CONDIÇÃO (iv)
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#12B886]/10 text-[#12B886] border border-[#12B886]/30">
                      Anti-Duplicidade
                    </span>
                  </div>
                  <h3 className="font-heading font-bold text-sm text-[#F4F7FA]">
                    Vedação Absoluta de Dupla Contagem Inter-CDVs
                  </h3>
                  <p className="text-xs text-[#93A3B5] leading-relaxed">
                    É categoricamente vedada a coexistência de dois claims ativos sobre o mesmo
                    chassi e componente. A plataforma rejeita com código HTTP 409 qualquer submissão
                    concorrente sobre veículo já atestado por outro estabelecimento.
                  </p>
                </div>

                {/* Condição 5 (Full Width) */}
                <div className="p-5 rounded-2xl bg-[#0A0E12] border border-[rgba(244,247,250,0.1)] space-y-2 md:col-span-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-[#12B886]">CONDIÇÃO (v)</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#12B886]/10 text-[#12B886] border border-[#12B886]/30">
                      Fronteira ISO 14040
                    </span>
                  </div>
                  <h3 className="font-heading font-bold text-sm text-[#F4F7FA]">
                    Fronteira Declarada Berço-ao-Portão (Cradle-to-Gate)
                  </h3>
                  <p className="text-xs text-[#93A3B5] leading-relaxed">
                    A fronteira do sistema abrange desde a entrada do veículo sinistrado ou em fim
                    de vida no pátio do CDV, despoluição de fluidos obrigatória (CONAMA 267/2000),
                    desmontagem, triagem, estocagem, eventual recondicionamento elétrico/mecânico
                    até o portão de expedição comercial (gate). Emissões da fase de uso posterior
                    pelo comprador e reciclagem pós-reúso ficam fora da fronteira imediata do DPP.
                  </p>
                </div>
              </div>
            </section>

            {/* SEÇÃO 5.1: CLASSIFICAÇÃO DE MATERIAIS */}
            <section
              id="sec-51"
              className="p-8 rounded-3xl bg-[#111820] border border-[rgba(244,247,250,0.1)] space-y-4"
            >
              <div className="flex items-center gap-2 text-[#12B886] text-xs font-mono font-bold uppercase">
                <Recycle className="w-4 h-4" />
                <span>Seção 5.1 • Catálogo Físico e Matriz de Materiais</span>
              </div>
              <h2 className="font-heading font-extrabold text-2xl text-[#F4F7FA]">
                §5.1 Classificação de Materiais e Regra Conservadora para Peças Mistas
              </h2>
              <p className="text-sm text-[#93A3B5] leading-relaxed">
                A taxonomia física do DM-ORB-001 v1.1 espelha exatamente a estrutura do motor de
                cálculo v2 e da API v2 da plataforma, dividida em 5 categorias oficiais de
                materiais:
              </p>

              {/* Tabela de Materiais Oficial 1:1 */}
              <div className="overflow-x-auto rounded-xl border border-[rgba(244,247,250,0.1)] bg-[#0A0E12]">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-[rgba(244,247,250,0.1)] bg-[#16202B] text-[#93A3B5] font-mono text-[10px] uppercase">
                    <tr>
                      <th className="py-3 px-4">Material (Chave API)</th>
                      <th className="py-3 px-4">Nome Normativo</th>
                      <th className="py-3 px-4 text-right">FE_ref (kgCO₂e/kg)</th>
                      <th className="py-3 px-4 text-center">Incerteza u_FE</th>
                      <th className="py-3 px-4 text-center">Tier</th>
                      <th className="py-3 px-4">Status da Fonte</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[rgba(244,247,250,0.06)] text-[#F4F7FA]">
                    {Object.values(FATORES_MATERIAIS_V2).map((item) => (
                      <tr key={item.material} className="hover:bg-[#16202B]/40 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-[#12B886]">
                          {item.material}
                        </td>
                        <td className="py-3 px-4 font-medium">{item.nome}</td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-[#12B886]">
                          {item.fe_ref.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-center font-mono text-[#D9B36C]">
                          ±{(item.u_fe * 100).toFixed(1)}%
                        </td>
                        <td className="py-3 px-4 text-center font-mono">{item.tier}</td>
                        <td className="py-3 px-4 text-[11px] text-[#93A3B5]">
                          {item.pendente_verificacao ? (
                            <span className="text-[#D9B36C] font-mono">
                              [Pendente de verificação de fonte]
                            </span>
                          ) : (
                            <span className="text-[#12B886] font-mono">Curado dMRV</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="p-4 rounded-xl bg-[#0A0E12] border border-[#12B886]/30 space-y-2">
                <span className="text-xs font-mono font-bold text-[#12B886] uppercase block">
                  Regra Conservadora para Peças Mistas sem Laudo de Decomposição
                </span>
                <p className="text-xs text-[#93A3B5] leading-relaxed">
                  Quando uma peça automotiva for composta por múltiplos materiais (ex.: portas com
                  chaparia de aço e forração plástica, ou alternador com carcaça de alumínio e
                  bobinamento de cobre) e o CDV{' '}
                  <strong className="text-[#F4F7FA]">
                    não apresentar laudo laboratorial ou decomposição percentual explícita
                  </strong>{' '}
                  no payload, o motor aplica compulsoriamente a{' '}
                  <strong className="text-[#12B886]">
                    regra do menor fator da composição provável
                  </strong>{' '}
                  (conforme executado pela função{' '}
                  <code className="text-[#12B886] font-mono">
                    obterFatorConservadorParaPecaMista
                  </code>
                  ). Por exemplo: numa peça mista entre aço (2,85) e polímeros (1,90), adota-se 1,90
                  kgCO₂e/kg para a massa total até que haja prova em contrário.
                </p>
              </div>
            </section>

            {/* SEÇÃO 5.3: DEDUP INTER-CDVS */}
            <section
              id="sec-53"
              className="p-8 rounded-3xl bg-[#111820] border border-[rgba(244,247,250,0.1)] space-y-4"
            >
              <div className="flex items-center gap-2 text-[#3B82F6] text-xs font-mono font-bold uppercase">
                <Lock className="w-4 h-4" />
                <span>Seção 5.3 • Integridade Criptográfica de Custódia</span>
              </div>
              <h2 className="font-heading font-extrabold text-2xl text-[#F4F7FA]">
                §5.3 Deduplicação Inter-CDVs, Chave Canônica e Consulta Pública LGPD
              </h2>
              <div className="space-y-3 text-sm text-[#93A3B5] leading-relaxed">
                <p>
                  Para assegurar a unicidade de custódia ambiental e mitigar vetores de dupla
                  apropriação entre estabelecimentos recicladores, a plataforma mantém a coleção
                  pública <code className="text-[#12B886] font-mono">cdv_claims</code> indexada por
                  uma chave de deduplicação exclusiva e determinística:
                </p>

                {/* Bloco de Chave Canônica */}
                <div className="p-4 rounded-xl bg-[#0A0E12] border border-[#3B82F6]/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono text-[#3B82F6] font-bold uppercase">
                      Chave Canônica de Deduplicação Inter-CDV
                    </span>
                    <button
                      onClick={copiarChaveDedupExemplo}
                      className="px-2 py-1 rounded bg-[#16202B] hover:bg-[#3B82F6]/20 text-[10px] font-mono text-[#F4F7FA] flex items-center gap-1 transition-colors"
                    >
                      {copiouChave ? (
                        <Check className="w-3 h-3 text-[#12B886]" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                      <span>{copiouChave ? 'Copiado' : 'Copiar Exemplo'}</span>
                    </button>
                  </div>
                  <pre className="font-mono text-xs sm:text-sm text-[#12B886] bg-[#111820] p-3 rounded-lg overflow-x-auto">
                    CHASSI + "_" + SKU + "_" + DATA_BAIXA_DETRAN
                  </pre>
                  <p className="text-[11px] text-[#93A3B5]">
                    Exemplo normalizado:{' '}
                    <code className="text-[#F4F7FA] font-mono">
                      9BWAA05U0DP***204_PART-GOL-CAPO-01_PR-BX-2026-991204
                    </code>
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="p-4 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.06)] space-y-2">
                    <strong className="text-xs font-mono font-bold text-[#EF4444] block uppercase">
                      Rejeição HTTP 409 CONFLITO_DE_CUSTODIA
                    </strong>
                    <p className="text-xs text-[#93A3B5] leading-relaxed">
                      Caso outro CDV submeta um lote contendo uma peça cujo chassi e baixa DETRAN já
                      pertençam a um claim registrado previamente por outro CNPJ, a API v2 aborta
                      imediatamente a gravação com o status{' '}
                      <strong className="text-[#EF4444] font-mono">409 CONFLITO_DE_CUSTODIA</strong>
                      , garantindo a primazia do primeiro detentor com baixa documentada.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.06)] space-y-2">
                    <strong className="text-xs font-mono font-bold text-[#12B886] block uppercase">
                      Consulta Pública e Proteção LGPD
                    </strong>
                    <p className="text-xs text-[#93A3B5] leading-relaxed">
                      Qualquer terceiro, comprador ou auditor pode consultar o histórico de custódia
                      na rota pública{' '}
                      <code className="text-[#12B886] font-mono">
                        /backend/v2/verificador/claim/:chassi
                      </code>
                      . Os dados societários e cadastrais de proprietários anteriores são ofuscados
                      em estrita observância à Lei Geral de Proteção de Dados (Lei nº 13.709/2018).
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* SEÇÃO 6.1: FATORES E REFRIGERANTE R-134a */}
            <section
              id="sec-61"
              className="p-8 rounded-3xl bg-[#111820] border border-[rgba(244,247,250,0.1)] space-y-4"
            >
              <div className="flex items-center gap-2 text-[#12B886] text-xs font-mono font-bold uppercase">
                <Sparkles className="w-4 h-4" />
                <span>Seção 6.1 • Gases de Efeito Estufa e Drenagem de Climatização</span>
              </div>
              <h2 className="font-heading font-extrabold text-2xl text-[#F4F7FA]">
                §6.1 Fatores Consolidados em CO₂e e Tratamento Mandatório do R-134a
              </h2>
              <div className="space-y-3 text-sm text-[#93A3B5] leading-relaxed">
                <p>
                  <strong className="text-[#F4F7FA]">Consolidação em CO₂e sem Duplo GWP:</strong> Os
                  fatores aplicados pelo motor já consolidam a cesta de GEE da norma (CO₂, CH₄, N₂O)
                  expressos diretamente em quilogramas de CO₂ equivalente (kgCO₂e), sendo
                  expressamente vedada a multiplicação repetida ou sobreposição de taxas de
                  aquecimento global em etapas subsequentes da cadeia.
                </p>

                <div className="p-5 rounded-2xl bg-[#0A0E12] border border-[#12B886]/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-[#12B886] uppercase">
                      Fluxo de Gás Refrigerante Veicular R-134a (HFC-134a)
                    </span>
                    <span className="font-mono text-[11px] text-[#D9B36C]">
                      GWP = {GWP_AR6_R134A}
                    </span>
                  </div>
                  <p className="text-xs text-[#93A3B5] leading-relaxed">
                    A climatização veicular constitui um ponto crítico de emissão fugitiva na
                    despoluição. O DM-ORB-001 v1.1 e o motor adotam como métrica de potencial de
                    aquecimento global em 100 anos o valor{' '}
                    <strong className="text-[#12B886] font-mono">GWP = 1.530</strong>, extraído do{' '}
                    <strong className="text-[#F4F7FA]">
                      IPCC Sexto Relatório de Avaliação (AR6 WG1 Capítulo 7, Tabela 7.15, incluindo
                      feedbacks climáticos de carbono)
                    </strong>
                    .
                  </p>
                  <div className="p-3 rounded-lg bg-[#111820] border border-[rgba(244,247,250,0.06)] font-mono text-xs text-[#12B886]">
                    Evitado_refrigerante = Massa_R134a_kg × 1.530 × DF_refrig (onde DF_refrig ={' '}
                    {DF_REFRIGERANTE_PADRAO.toFixed(1)})
                  </div>
                  <div className="p-3 rounded-lg bg-[#111820] border border-[#D9B36C]/30 text-xs text-[#93A3B5]">
                    <strong className="text-[#D9B36C]">
                      Declaração Mandatória de Subestimação Conservadora:
                    </strong>{' '}
                    Caso o lote veicular não apresente comprovante de drenagem técnica (com peso e
                    MTR de recolhimento), o benefício do gás refrigerante é fixado em{' '}
                    <strong className="text-[#F4F7FA]">0,00 kgCO₂e</strong> com a declaração
                    expressa:
                    <em className="text-[#D9B36C] block mt-1">
                      &quot;Refrigerante não capturado no gate de despoluição — evitado subestimado
                      por conservativeness.&quot;
                    </em>
                  </div>
                </div>
              </div>
            </section>

            {/* SEÇÃO 6.3: PROCEDIMENTO DE BASELINE E FÓRMULA DO MOTOR */}
            <section
              id="sec-63"
              className="p-8 rounded-3xl bg-[#111820] border border-[rgba(244,247,250,0.1)] space-y-4"
            >
              <div className="flex items-center gap-2 text-[#12B886] text-xs font-mono font-bold uppercase">
                <Scale className="w-4 h-4" />
                <span>Seção 6.3 & Apêndice C • Procedimento e Fórmula de Baseline</span>
              </div>
              <h2 className="font-heading font-extrabold text-2xl text-[#F4F7FA]">
                §6.3 Procedimento de Baseline do Motor v2 (DM-ORB-001 v1.1)
              </h2>
              <div className="space-y-4 text-sm text-[#93A3B5] leading-relaxed">
                <p>
                  O cálculo executado pelo motor{' '}
                  <code className="text-[#12B886] font-mono">cdvEngineV2.ts</code> para cada
                  componente desmontado segue rigorosamente a equação prescritiva:
                </p>

                {/* Fórmula Central em Destaque */}
                <div className="p-6 rounded-2xl bg-[#0A0E12] border-2 border-[#12B886] text-center space-y-3">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-[#93A3B5]">
                    Equação Fundamental de Emissão Evitada por Peça
                  </span>
                  <div className="font-mono text-xl sm:text-2xl font-black text-[#12B886] py-2">
                    Evitado_peça = (Q × FE_ref × L_i × DF) − PE_peça
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[11px] font-mono text-[#93A3B5] pt-2 border-t border-[rgba(244,247,250,0.06)]">
                    <div className="p-2 rounded bg-[#111820]">
                      <strong className="text-[#12B886] block">Q</strong> Massa medida (kg)
                    </div>
                    <div className="p-2 rounded bg-[#111820]">
                      <strong className="text-[#12B886] block">FE_ref</strong> Fator primário
                      (kgCO₂e/kg)
                    </div>
                    <div className="p-2 rounded bg-[#111820]">
                      <strong className="text-[#12B886] block">L_i = 1,0</strong> Reúso funcional
                    </div>
                    <div className="p-2 rounded bg-[#111820]">
                      <strong className="text-[#12B886] block">DF = 0,30</strong> Deslocamento
                      (VMR0007)
                    </div>
                    <div className="p-2 rounded bg-[#111820] col-span-2 sm:col-span-1">
                      <strong className="text-[#EF4444] block">PE_peça</strong> Emissão projeto
                      alocada
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.06)] space-y-2">
                    <h3 className="text-xs font-mono font-bold text-[#F4F7FA] uppercase">
                      Parâmetro DF = 0,30 (Fator de Deslocamento Conservador)
                    </h3>
                    <p className="text-xs text-[#93A3B5] leading-relaxed">
                      Em aderência às diretrizes da metodologia conservadora VMR0007 e análises
                      setoriais de substituição de mercado, adota-se o piso fixo de{' '}
                      <strong className="text-[#12B886] font-mono">DF = 0,30</strong>. Isto
                      significa que, mesmo na reposição completa de uma peça virgem, reconhece-se
                      apenas 30% do potencial teórico de descarbonização, absorvendo eventuais
                      perdas elásticas de mercado e efeito rebote (rebound effect).
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.06)] space-y-2">
                    <h3 className="text-xs font-mono font-bold text-[#F4F7FA] uppercase">
                      Parâmetro L_i = 1,0 (Fator de Vida Útil Restante)
                    </h3>
                    <p className="text-xs text-[#93A3B5] leading-relaxed">
                      O parâmetro de vida útil restante é calibrado em{' '}
                      <strong className="text-[#12B886] font-mono">L_i = 1,0</strong> para reúso
                      funcional imediato atestado pelo responsável técnico (CREA/CFT). A metodologia
                      proíbe elevação deste multiplicador acima de 1,0 sem estudo setorial revisado
                      por pares e chancela de VVB.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* SEÇÃO 7: REGIME DE INCERTEZA T1–T4 */}
            <section
              id="sec-7"
              className="p-8 rounded-3xl bg-[#111820] border border-[rgba(244,247,250,0.1)] space-y-4"
            >
              <div className="flex items-center gap-2 text-[#D9B36C] text-xs font-mono font-bold uppercase">
                <AlertTriangle className="w-4 h-4" />
                <span>Seção 7 • Propagação de Incerteza e QA-QC</span>
              </div>
              <h2 className="font-heading font-extrabold text-2xl text-[#F4F7FA]">
                §7. Regime de Incerteza T1–T4, Soma em Quadratura e Regras de Arredondamento
              </h2>
              <div className="space-y-4 text-sm text-[#93A3B5] leading-relaxed">
                <p>
                  O motor Orbis v2 abandona simplificações ad hoc e implementa a propagação formal
                  de incerteza por{' '}
                  <strong className="text-[#F4F7FA]">soma em quadratura (quadrature sum)</strong>{' '}
                  conforme o Guia ISO/IEC 98-3 (GUM - Guide to the Expression of Uncertainty in
                  Measurement):
                </p>

                {/* Fórmula da Incerteza em Quadratura */}
                <div className="p-5 rounded-2xl bg-[#0A0E12] border border-[#D9B36C]/40 space-y-2 text-center">
                  <span className="text-[11px] font-mono uppercase text-[#D9B36C] font-bold">
                    Equação de Incerteza Consolidada do Lote
                  </span>
                  <div className="font-mono text-base sm:text-lg font-bold text-[#F4F7FA] py-1 overflow-x-auto">
                    Incerteza_lote = √ [ Σ (Evitado_peça × u_FE)² + (Evitado_lote × u_massa)² ]
                  </div>
                  <p className="text-xs text-[#93A3B5]">
                    Onde <strong className="text-[#12B886]">u_massa = ±1,0% (0,01)</strong> para
                    pesagem com balança calibrada ou{' '}
                    <strong className="text-[#D9B36C]">u_massa = ±10,0% (0,10)</strong> quando a
                    tara for estimada por proxy.
                  </p>
                </div>

                {/* Tiers T1 a T4 */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
                  <div className="p-3.5 rounded-xl bg-[#0A0E12] border border-[#12B886]/30">
                    <span className="font-mono text-xs font-bold text-[#12B886] block">
                      TIER 1 (T1)
                    </span>
                    <span className="text-xs font-semibold text-[#F4F7FA] block mt-1">
                      Medição Direta de Alta Precisão
                    </span>
                    <span className="text-[11px] text-[#93A3B5] block mt-1">
                      Balança aferida + laudo espectrográfico
                    </span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-[#0A0E12] border border-[#3B82F6]/30">
                    <span className="font-mono text-xs font-bold text-[#3B82F6] block">
                      TIER 2 (T2)
                    </span>
                    <span className="text-xs font-semibold text-[#F4F7FA] block mt-1">
                      Fatores Setoriais Oficiais
                    </span>
                    <span className="text-[11px] text-[#93A3B5] block mt-1">
                      PlasticsEurope, PBGHG nacional
                    </span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-[#0A0E12] border border-[#D9B36C]/30">
                    <span className="font-mono text-xs font-bold text-[#D9B36C] block">
                      TIER 3 (T3)
                    </span>
                    <span className="text-xs font-semibold text-[#F4F7FA] block mt-1">
                      Associações Internacionais
                    </span>
                    <span className="text-[11px] text-[#93A3B5] block mt-1">
                      WorldSteel, IAI, ICA (primários)
                    </span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.1)]">
                    <span className="font-mono text-xs font-bold text-[#93A3B5] block">
                      TIER 4 (T4)
                    </span>
                    <span className="text-xs font-semibold text-[#F4F7FA] block mt-1">
                      Estimativa de Piso
                    </span>
                    <span className="text-[11px] text-[#93A3B5] block mt-1">
                      Pesagem estimada ou composição proxy
                    </span>
                  </div>
                </div>

                {/* Regras de Arredondamento Conservadoras */}
                <div className="p-4 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.08)] space-y-2">
                  <h3 className="text-xs font-mono font-bold text-[#F4F7FA] uppercase">
                    Regras de Arredondamento Assimétricas do Motor
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-[#93A3B5]">
                    <div className="p-2.5 rounded-lg bg-[#111820]">
                      <strong className="text-[#12B886] font-mono block">
                        FLOOR em 2 Casas para Emissões Evitadas:
                      </strong>
                      Evitado líquido ={' '}
                      <code className="text-[#12B886] font-mono">Math.floor(x * 100) / 100</code>.
                      Nunca trunca para cima; garante que nenhuma fração de quilograma seja
                      superestimada.
                    </div>
                    <div className="p-2.5 rounded-lg bg-[#111820]">
                      <strong className="text-[#EF4444] font-mono block">
                        CEIL em 2 Casas para Emissões de Projeto (PE):
                      </strong>
                      Emissões de projeto ={' '}
                      <code className="text-[#EF4444] font-mono">Math.ceil(x * 100) / 100</code>.
                      Assegura a dedução máxima de custos operacionais do CDV (energia elétrica e
                      combustíveis).
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* SEÇÃO 8: REGISTRO VERIFICÁVEL DE CUSTÓDIA */}
            <section
              id="sec-8"
              className="p-8 rounded-3xl bg-[#111820] border border-[rgba(244,247,250,0.1)] space-y-4"
            >
              <div className="flex items-center gap-2 text-[#12B886] text-xs font-mono font-bold uppercase">
                <Database className="w-4 h-4" />
                <span>Seção 8 • Vocabulário Oficial e Arquitetura de Registro</span>
              </div>
              <h2 className="font-heading font-extrabold text-2xl text-[#F4F7FA]">
                §8. Registro Verificável de Custódia — dMRV Orbis
              </h2>
              <div className="space-y-3 text-sm text-[#93A3B5] leading-relaxed">
                <p>
                  <strong className="text-[#F4F7FA]">Vocabulário Técnico Padronizado:</strong> A
                  denominação oficial do registro emitido pela plataforma é{' '}
                  <strong className="text-[#12B886]">
                    &quot;Registro Verificável de Custódia — dMRV Orbis&quot;
                  </strong>
                  . Fica vedada a utilização de termos como &quot;Certificado de Carbono&quot; ou
                  &quot;Crédito Registrado&quot; na ausência de processo de validação por VVB
                  externo.
                </p>
                <p>
                  Cada lote processado gera um registro público imutável contendo o selo canônico (
                  <code className="text-[#12B886] font-mono">PR-SEAL-AAAA-NNNNNN</code>), o hash
                  SHA-256 da cadeia de custódia, a identificação criptográfica da baixa DETRAN e o
                  status de confirmação documental do claim.
                </p>
              </div>
            </section>

            {/* SEÇÃO 9: ATESTADO ORBIS vs VVB CREDENCIADO */}
            <section
              id="sec-9"
              className="p-8 rounded-3xl bg-[#111820] border border-[#12B886]/30 space-y-4"
            >
              <div className="flex items-center gap-2 text-[#12B886] text-xs font-mono font-bold uppercase">
                <ShieldCheck className="w-4 h-4" />
                <span>Seção 9 • Governança, Papéis e Delimitação Institucional</span>
              </div>
              <h2 className="font-heading font-extrabold text-2xl text-[#F4F7FA]">
                §9. Não Somos Certificadora: Atestado de Conformidade Orbis (com ART/RRT) ≠
                Verificação ISO 14064-3
              </h2>
              <div className="space-y-3 text-sm text-[#93A3B5] leading-relaxed">
                <div className="p-4 rounded-xl bg-[#0A0E12] border border-[#EF4444]/40 text-xs space-y-2">
                  <div className="flex items-center gap-2 text-[#EF4444] font-mono font-bold uppercase">
                    <ShieldAlert className="w-4 h-4" />
                    <span>Delimitação Regulatória Expressa</span>
                  </div>
                  <p className="leading-relaxed text-[#93A3B5]">
                    <strong className="text-[#F4F7FA]">
                      A Orbis Protocol NÃO é entidade certificadora climática
                    </strong>
                    . A plataforma atua exclusivamente como infraestrutura tecnológica de prova
                    documental, telemetria dMRV e custódia criptográfica de dados de desmontagem e
                    descarbonização.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="p-4 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.06)] space-y-2">
                    <span className="text-xs font-mono font-bold text-[#12B886] uppercase block">
                      Atestado de Conformidade Orbis (com ART/RRT)
                    </span>
                    <p className="text-xs text-[#93A3B5] leading-relaxed">
                      Instrumento técnico-pericial assinado por perito ou engenheiro legalmente
                      habilitado junto ao respectivo Conselho de Classe (CREA/CAU/CFT), atestando a
                      exatidão da contabilidade física de massas, o cumprimento das regras do
                      DM-ORB-001 v1.1 e a idoneidade das notas fiscais e manifestos MTR apresentados
                      pelo CDV.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.06)] space-y-2">
                    <span className="text-xs font-mono font-bold text-[#D9B36C] uppercase block">
                      Verificação Externa VVB (ISO 14064-3)
                    </span>
                    <p className="text-xs text-[#93A3B5] leading-relaxed">
                      Auditoria de terceira parte conduzida por Organismo de Verificação e Validação
                      (VVB) independente credenciado.{' '}
                      <strong className="text-[#F4F7FA]">
                        Qualquer emissão de créditos de carbono, no âmbito do SBCE ou mercado
                        voluntário internacional, decorre exclusivamente de relatório favorável
                        emitido por VVB independente credenciado
                      </strong>
                      , sendo o Atestado Orbis o substrato comprobatório da auditoria.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* SEÇÃO 10: COMPETÊNCIA DE AJUSTE E NÃO-RETROATIVIDADE */}
            <section
              id="sec-10"
              className="p-8 rounded-3xl bg-[#111820] border border-[rgba(244,247,250,0.1)] space-y-4"
            >
              <div className="flex items-center gap-2 text-[#12B886] text-xs font-mono font-bold uppercase">
                <Lock className="w-4 h-4" />
                <span>Seção 10 • Governança Metodológica e Segurança Jurídica</span>
              </div>
              <h2 className="font-heading font-extrabold text-2xl text-[#F4F7FA]">
                §10. Competência de Ajuste Metodológico, Poder de Redução e Snapshot Prospectivo
              </h2>
              <div className="space-y-4 text-sm text-[#93A3B5] leading-relaxed">
                <div className="p-4 rounded-xl bg-[#0A0E12] border border-[#D9B36C]/40 space-y-2">
                  <span className="text-xs font-mono font-bold text-[#D9B36C] uppercase block">
                    Poder de Redução do Resultado Divulgado
                  </span>
                  <p className="text-xs text-[#93A3B5] leading-relaxed">
                    O Comitê Técnico Metodológico da Orbis detém a prerrogativa permanente de{' '}
                    <strong className="text-[#F4F7FA]">REDUZIR</strong> os fatores de emissão ou o
                    resultado evitado divulgado de qualquer família de materiais, caso novos
                    inventários de ciclo de vida (ACV) oficiais ou estudos empíricos indiquem
                    conservadorismo insuficiente na versão vigente. O ajuste retroativo para maior é
                    terminantemente proibido.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#0A0E12] border border-[#12B886]/30 space-y-2">
                  <span className="text-xs font-mono font-bold text-[#12B886] uppercase block">
                    Snapshot Prospectivo Imutável (Garantia de Não-Retroatividade)
                  </span>
                  <p className="text-xs text-[#93A3B5] leading-relaxed">
                    O conjunto de fatores aplicado a cada peça ou lote é congelado (
                    <em className="text-[#F4F7FA]">snapshot criptográfico</em>) no momento exato da
                    emissão do DPP e incorporado ao hash SHA-256 do lote.
                    <strong className="text-[#12B886]">
                      {' '}
                      Lotes fechados não recalculam retroativamente
                    </strong>{' '}
                    caso o catálogo seja atualizado no futuro, exceto na hipótese excepcional de
                    erro material cabalmente demonstrado em processo de auditoria pericial formal.
                  </p>
                </div>
              </div>
            </section>

            {/* APÊNDICE B: CITAÇÃO DE FONTES COM STATUS EXPLÍCITO */}
            <section
              id="apendice-b"
              className="p-8 rounded-3xl bg-[#111820] border border-[rgba(244,247,250,0.1)] space-y-4"
            >
              <div className="flex items-center gap-2 text-[#D9B36C] text-xs font-mono font-bold uppercase">
                <BookOpen className="w-4 h-4" />
                <span>Apêndice B • Rastreabilidade Completa de Fontes e Citações</span>
              </div>
              <h2 className="font-heading font-extrabold text-2xl text-[#F4F7FA]">
                Apêndice B: Citação de Fontes Oficiais e Status de Validação
              </h2>
              <p className="text-sm text-[#93A3B5]">
                Em estrita observância à verdade pericial e transparência técnica, a tabela abaixo
                discrimina a fundamentação bibliográfica e declara honestamente os fatores mantidos
                com status provisório sob investigação:
              </p>

              <div className="space-y-3 pt-2">
                <div className="p-4 rounded-xl bg-[#0A0E12] border border-[#D9B36C]/40 space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <strong className="text-[#F4F7FA] font-mono">
                      Aço Laminado / Estampado: 2,85 kgCO₂e/kg (Tier 3)
                    </strong>
                    <span className="px-2 py-0.5 rounded bg-[#D9B36C]/20 text-[#D9B36C] font-mono text-[10px]">
                      [Pendente de verificação de fonte]
                    </span>
                  </div>
                  <p className="text-[#93A3B5]">
                    Citação preliminar: WorldSteel Association / IED / MCTI 2024.
                    <span className="block mt-1 text-[#D9B36C]">
                      Nota honesta de auditoria: O valor de 2,85 kgCO₂e/kg encontra-se mantido sob
                      status formal &quot;[Pendente de verificação de fonte]&quot; enquanto a média
                      global de rota primária por alto-forno/coque orbita em torno de 1,9 tCO₂e/t.
                      Não são inventadas fontes ou páginas sem confirmação documental.
                    </span>
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#0A0E12] border border-[#D9B36C]/40 space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <strong className="text-[#F4F7FA] font-mono">
                      Alumínio Primário Automotivo: 8,20 kgCO₂e/kg (Tier 3)
                    </strong>
                    <span className="px-2 py-0.5 rounded bg-[#D9B36C]/20 text-[#D9B36C] font-mono text-[10px]">
                      [Pendente de verificação de fonte]
                    </span>
                  </div>
                  <p className="text-[#93A3B5]">
                    Citação preliminar: International Aluminium Institute (IAI 2023).
                    <span className="block mt-1 text-[#D9B36C]">
                      Nota honesta de auditoria: A média global primária de refino eletrolítico da
                      bauxita (IAI) é de aproximadamente 16,6 kgCO₂e/kg. O fator de 8,20 kgCO₂e/kg
                      permanece como piso ultraconservador adotado provisoriamente sob status
                      &quot;[Pendente de verificação de fonte]&quot;.
                    </span>
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#0A0E12] border border-[#D9B36C]/40 space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <strong className="text-[#F4F7FA] font-mono">
                      Cobre / Bobinamentos Elétricos: 5,40 kgCO₂e/kg (Tier 3)
                    </strong>
                    <span className="px-2 py-0.5 rounded bg-[#D9B36C]/20 text-[#D9B36C] font-mono text-[10px]">
                      [Pendente de verificação de fonte]
                    </span>
                  </div>
                  <p className="text-[#93A3B5]">
                    Citação preliminar: International Copper Association (ICA 2023 Life Cycle
                    Assessment Report).
                    <span className="block mt-1 text-[#D9B36C]">
                      Nota honesta de auditoria: Mantido com status explícito &quot;[Pendente de
                      verificação de fonte]&quot; até conclusão da conferência dos dados de catodo
                      eletrorefinado versus matriz energética regional.
                    </span>
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#0A0E12] border border-[#D9B36C]/40 space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <strong className="text-[#F4F7FA] font-mono">
                      Polímeros Automotivos (PP/EPDM/ABS): 1,90 kgCO₂e/kg (Tier 2)
                    </strong>
                    <span className="px-2 py-0.5 rounded bg-[#D9B36C]/20 text-[#D9B36C] font-mono text-[10px]">
                      [Pendente de verificação de fonte]
                    </span>
                  </div>
                  <p className="text-[#93A3B5]">
                    Citação preliminar: PlasticsEurope LCA Dataset 2023 (Eco-profiles).
                    <span className="block mt-1 text-[#D9B36C]">
                      Nota honesta de auditoria: Dataset representativo da indústria química
                      europeia adotado provisoriamente sob status &quot;[Pendente de verificação de
                      fonte]&quot; em face da ausência de dataset ACV nacional curado para
                      termoplásticos automotivos.
                    </span>
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#0A0E12] border border-[#12B886]/40 space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <strong className="text-[#F4F7FA] font-mono">
                      Outros Materiais (Estimativa Conservadora): 1,50 kgCO₂e/kg (Tier 1)
                    </strong>
                    <span className="px-2 py-0.5 rounded bg-[#12B886]/20 text-[#12B886] font-mono text-[10px]">
                      Curado dMRV
                    </span>
                  </div>
                  <p className="text-[#93A3B5]">
                    Derivação direta no DM-ORB-001 v1.1: média harmônica ponderada de insumos
                    industriais secundários com margem de segurança conservadora de 25% para evitar
                    superestimação em peças compostas ou não identificadas.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#0A0E12] border border-[#12B886]/40 space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <strong className="text-[#F4F7FA] font-mono">
                      Fluido Refrigerante R-134a: 1.530 kgCO₂e/kg (Tier 3)
                    </strong>
                    <span className="px-2 py-0.5 rounded bg-[#12B886]/20 text-[#12B886] font-mono text-[10px]">
                      Oficial IPCC AR6
                    </span>
                  </div>
                  <p className="text-[#93A3B5]">
                    Citação completa: IPCC AR6 WG1 Capítulo 7, Tabela 7.15 (GWP 100 anos com
                    feedbacks de carbono = 1.530). Fator de deslocamento DF_refrig = 1,0 quando
                    comprovada a despoluição e destinação ambiental.
                  </p>
                </div>
              </div>
            </section>

            {/* APÊNDICE E: GLOSSÁRIO DAS 8 MÉTRICAS */}
            <section
              id="apendice-e"
              className="p-8 rounded-3xl bg-[#111820] border border-[#12B886]/30 space-y-4"
            >
              <div className="flex items-center gap-2 text-[#12B886] text-xs font-mono font-bold uppercase">
                <HelpCircle className="w-4 h-4" />
                <span>Apêndice E (Novo) • Glossário Metodológico Formal</span>
              </div>
              <h2 className="font-heading font-extrabold text-2xl text-[#F4F7FA]">
                Apêndice E: Glossário das 8 Métricas, Unidades e Convenção de Sinal
              </h2>
              <p className="text-sm text-[#93A3B5]">
                Definições inequívocas para operadores de CDVs, integradores de ERPs e peritos
                auditores:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                {/* Métrica 1 */}
                <div className="p-4 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.06)] space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-[#12B886]">
                      1. Evitado Bruto (kgCO₂e)
                    </span>
                    <span className="text-[10px] font-mono text-[#93A3B5]">
                      Q × FE_ref × L_i × DF
                    </span>
                  </div>
                  <p className="text-xs text-[#93A3B5] leading-relaxed">
                    Soma teórica do benefício de deslocamento de materiais virgens de todas as peças
                    elegíveis, antes da dedução das emissões de projeto do CDV.
                  </p>
                </div>

                {/* Métrica 2 */}
                <div className="p-4 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.06)] space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-[#EF4444]">
                      2. Emissão de Projeto PE (kgCO₂e)
                    </span>
                    <span className="text-[10px] font-mono text-[#93A3B5]">Energia + Diesel</span>
                  </div>
                  <p className="text-xs text-[#93A3B5] leading-relaxed">
                    Emissões de Escopo 1 e 2 geradas pelo CDV na desmontagem (faturas elétricas e
                    combustíveis de pátio), arredondadas com CEIL e rateadas proporcionalmente à
                    massa recuperada.
                  </p>
                </div>

                {/* Métrica 3 */}
                <div className="p-4 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.06)] space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-[#12B886]">
                      3. Evitado Líquido (kgCO₂e)
                    </span>
                    <span className="text-[10px] font-mono text-[#93A3B5]">max(0, Bruto − PE)</span>
                  </div>
                  <p className="text-xs text-[#93A3B5] leading-relaxed">
                    Resultado líquido positivo de descarbonização do lote, computado com FLOOR em 2
                    casas decimais. Sinal adotado no motor: valor estritamente positivo (com
                    exibição visual -kgCO₂e na interface).
                  </p>
                </div>

                {/* Métrica 4 */}
                <div className="p-4 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.06)] space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-[#12B886]">
                      4. Evitado Confirmado (kgCO₂e)
                    </span>
                    <span className="text-[10px] font-mono text-[#93A3B5]">NF-e / MTR</span>
                  </div>
                  <p className="text-xs text-[#93A3B5] leading-relaxed">
                    Fração do evitado líquido cujas peças já possuem destinação final comprovada por
                    documento fiscal ou ambiental definitivo de saída do CDV.
                  </p>
                </div>

                {/* Métrica 5 */}
                <div className="p-4 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.06)] space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-[#D9B36C]">
                      5. Evitado Potencial (kgCO₂e)
                    </span>
                    <span className="text-[10px] font-mono text-[#93A3B5]">Em Estoque</span>
                  </div>
                  <p className="text-xs text-[#93A3B5] leading-relaxed">
                    Fração do evitado líquido correspondente a peças em estoque no CDV que ainda não
                    tiveram sua venda ou reinserção concluída documentalmente.
                  </p>
                </div>

                {/* Métrica 6 */}
                <div className="p-4 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.06)] space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-[#3B82F6]">
                      6. Evitado Refrigerante (kgCO₂e)
                    </span>
                    <span className="text-[10px] font-mono text-[#93A3B5]">m_R134a × 1.530</span>
                  </div>
                  <p className="text-xs text-[#93A3B5] leading-relaxed">
                    Benefício da contenção e recuperação do gás R-134a drenado do circuito de
                    ar-condicionado, nulo caso não haja comprovação física da drenagem.
                  </p>
                </div>

                {/* Métrica 7 */}
                <div className="p-4 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.06)] space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-[#D9B36C]">
                      7. Incerteza Consolidada (kg / %)
                    </span>
                    <span className="text-[10px] font-mono text-[#93A3B5]">Soma em Quadratura</span>
                  </div>
                  <p className="text-xs text-[#93A3B5] leading-relaxed">
                    Erro absoluto e relativo do lote apurado por propagação quadrática dos erros de
                    pesagem (u_massa) e dos fatores metodológicos (u_FE).
                  </p>
                </div>

                {/* Métrica 8 */}
                <div className="p-4 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.06)] space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-[#F4F7FA]">
                      8. Segregação Fóssil / Biogênica
                    </span>
                    <span className="text-[10px] font-mono text-[#93A3B5]">
                      100% Fóssil / 0% Bio
                    </span>
                  </div>
                  <p className="text-xs text-[#93A3B5] leading-relaxed">
                    Declaração mandatória em 3 colunas: todo evitado na desmontagem veicular é
                    alocado em carbono fóssil (metais e derivados petroquímicos), sendo a parcela
                    biogênica formalmente fixada em 0,00 kgCO₂e.
                  </p>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* ========================================================= */}
        {/* ABA 2: CATÁLOGO DE FATORES INTERATIVO */}
        {/* ========================================================= */}
        {abaAtiva === 'catalogo' && (
          <div className="space-y-6">
            {/* NOTA METODOLÓGICA DE CONGELAMENTO & RESERVA PRÉ-LAUDO */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-6 rounded-2xl bg-[#111820] border border-[#12B886]/30 space-y-3">
                <div className="flex items-center gap-2.5 text-[#12B886]">
                  <Lock className="w-5 h-5" />
                  <h3 className="font-heading font-bold text-sm uppercase tracking-wider text-[#F4F7FA]">
                    Congelamento Criptográfico (Snapshot na Emissão)
                  </h3>
                </div>
                <p className="text-xs text-[#93A3B5] leading-relaxed">
                  {METADADOS_CATALOGO_FATORES.notaSnapshotCongelamento}
                </p>
                <div className="p-2.5 rounded-lg bg-[#0A0E12] border border-[rgba(244,247,250,0.06)] flex items-center gap-2 text-[11px] font-mono text-[#12B886]">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>Garantia de Não-Retroatividade: relatórios emitidos são imutáveis.</span>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-[#111820] border border-[#D9B36C]/30 space-y-3">
                <div className="flex items-center gap-2.5 text-[#D9B36C]">
                  <ShieldCheck className="w-5 h-5" />
                  <h3 className="font-heading font-bold text-sm uppercase tracking-wider text-[#F4F7FA]">
                    Reserva Metodológica Pré-Laudo (Padrão da Casa)
                  </h3>
                </div>
                <p className="text-xs text-[#93A3B5] leading-relaxed">
                  {METADADOS_CATALOGO_FATORES.reservaPreLaudo}
                </p>
                <div className="p-2.5 rounded-lg bg-[#0A0E12] border border-[rgba(244,247,250,0.06)] flex items-center gap-2 text-[11px] font-mono text-[#D9B36C]">
                  <Info className="w-3.5 h-3.5 shrink-0" />
                  <span>Conformidade estrita: sem alegações mercadológicas sem laudo formal.</span>
                </div>
              </div>
            </div>

            {/* BARRA DE FILTROS & BUSCA */}
            <div className="p-6 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.1)] space-y-4">
              <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-[#93A3B5] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    placeholder="Buscar por material, fonte oficial (WorldSteel, IAI...), unidade ou norma..."
                    className="w-full bg-[#0A0E12] border border-[rgba(244,247,250,0.15)] rounded-xl pl-10 pr-4 py-2.5 text-xs text-[#F4F7FA] placeholder-[#93A3B5] focus:outline-none focus:border-[#12B886] transition-all font-mono"
                  />
                  {busca && (
                    <button
                      onClick={() => setBusca('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#93A3B5] hover:text-[#F4F7FA]"
                    >
                      Limpar
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Filter className="w-4 h-4 text-[#93A3B5]" />
                  <span className="text-xs font-mono text-[#93A3B5]">Incerteza:</span>
                  <select
                    value={tierFiltro}
                    onChange={(e) => setTierFiltro(e.target.value)}
                    aria-label="Filtrar por nível de incerteza (Tier)"
                    className="bg-[#0A0E12] border border-[rgba(244,247,250,0.15)] rounded-xl px-3 py-2 text-xs text-[#F4F7FA] focus:outline-none focus:border-[#12B886] font-mono"
                  >
                    <option value="todos">Todos os Tiers</option>
                    <option value="Tier 3">Tier 3 (Alta precisão / ACV específica)</option>
                    <option value="Tier 2">Tier 2 (Fatores nacionais / PBGHG)</option>
                    <option value="Tier 1">Tier 1 (Fatores médios / spend-based)</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[rgba(244,247,250,0.06)]">
                {categorias.map((cat) => {
                  const Icon = cat.icon
                  const isSelected = categoriaFiltro === cat.id
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setCategoriaFiltro(cat.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-all ${
                        isSelected
                          ? 'bg-[#12B886] text-[#0A0E12] font-bold shadow-emerald-glow'
                          : 'bg-[#0A0E12] text-[#93A3B5] hover:text-[#F4F7FA] hover:bg-[#16202B] border border-[rgba(244,247,250,0.08)]'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{cat.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* TABELA DE FATORES */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-heading font-extrabold text-lg text-[#F4F7FA] flex items-center gap-2">
                  <span>Fatores Vigentes no Catálogo</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-[#16202B] text-[#12B886] font-mono">
                    {fatoresFiltrados.length} encontrados
                  </span>
                </h2>
                <span className="text-xs text-[#93A3B5] font-mono hidden sm:inline">
                  Base oficial dMRV • Versão {METADADOS_CATALOGO_FATORES.versao}
                </span>
              </div>

              {/* Tabela Desktop */}
              <div className="hidden md:block overflow-x-auto rounded-2xl border border-[rgba(244,247,250,0.1)] bg-[#111820] shadow-xl">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-[rgba(244,247,250,0.1)] bg-[#0A0E12]/80 text-[#93A3B5] uppercase font-mono text-[10px] tracking-wider">
                    <tr>
                      <th className="py-3.5 px-4">Material / Insumo</th>
                      <th className="py-3.5 px-4 text-right">Fator Aplicado</th>
                      <th className="py-3.5 px-4">Unidade</th>
                      <th className="py-3.5 px-4">Fonte Oficial</th>
                      <th className="py-3.5 px-4">Norma / Ano</th>
                      <th className="py-3.5 px-4 text-center">Tier & Incerteza</th>
                      <th className="py-3.5 px-4">Impacto / Tipo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[rgba(244,247,250,0.06)] text-[#F4F7FA]">
                    {fatoresFiltrados.map((item) => (
                      <tr key={item.id} className="hover:bg-[#16202B]/60 transition-colors group">
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-[#F4F7FA] group-hover:text-[#12B886] transition-colors">
                            {item.nomeMaterial}
                          </div>
                          <div className="text-[11px] text-[#93A3B5] line-clamp-1 max-w-sm">
                            {item.descricao}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-black text-base text-[#12B886]">
                          {formatarValorFator(item)}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-xs text-[#93A3B5]">
                          {item.unidade}
                        </td>
                        <td className="py-3.5 px-4 font-medium text-[#F4F7FA]">
                          {item.fonteOficial}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="text-[11px] text-[#93A3B5]">{item.normaPadrao}</div>
                          <div className="text-[10px] font-mono text-[#D9B36C]">
                            Ref: {item.anoReferencia}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="inline-block px-2 py-0.5 rounded-full bg-[#0A0E12] border border-[rgba(244,247,250,0.1)] text-[10px] font-mono text-[#F4F7FA]">
                            {item.tierIncerteza} (±{item.incertezaPct}%)
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          {item.tipoImpacto === 'emissao_evitada' && (
                            <span className="px-2 py-0.5 rounded bg-[#12B886]/15 border border-[#12B886]/40 text-[#12B886] font-mono text-[10px] font-bold">
                              Emissão Evitada
                            </span>
                          )}
                          {item.tipoImpacto === 'credito_insetting' && (
                            <span className="px-2 py-0.5 rounded bg-[#3B82F6]/15 border border-[#3B82F6]/40 text-[#3B82F6] font-mono text-[10px] font-bold">
                              Insetting Circular
                            </span>
                          )}
                          {item.tipoImpacto === 'emissao_direta' && (
                            <span className="px-2 py-0.5 rounded bg-[#D9B36C]/15 border border-[#D9B36C]/40 text-[#D9B36C] font-mono text-[10px] font-bold">
                              Escopo 1 (Direta)
                            </span>
                          )}
                          {item.tipoImpacto === 'emissao_indireta' && (
                            <span className="px-2 py-0.5 rounded bg-purple-500/15 border border-purple-500/40 text-purple-300 font-mono text-[10px] font-bold">
                              {item.id.includes('energia') ? 'Escopo 2' : 'Escopo 3'}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Cards Mobile */}
              <div className="md:hidden space-y-3">
                {fatoresFiltrados.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl bg-[#111820] border border-[rgba(244,247,250,0.1)] space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-heading font-bold text-sm text-[#F4F7FA]">
                          {item.nomeMaterial}
                        </h4>
                        <span className="text-[10px] font-mono text-[#93A3B5] block">
                          {item.categoria.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-black text-lg text-[#12B886] block">
                          {formatarValorFator(item)}
                        </span>
                        <span className="text-[10px] font-mono text-[#93A3B5]">{item.unidade}</span>
                      </div>
                    </div>
                    <p className="text-xs text-[#93A3B5] leading-relaxed">{item.descricao}</p>
                    <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-[rgba(244,247,250,0.06)]">
                      <div>
                        <span className="text-[10px] uppercase font-mono text-[#93A3B5] block">
                          Fonte Oficial:
                        </span>
                        <span className="font-semibold text-[#F4F7FA]">{item.fonteOficial}</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-mono text-[#93A3B5] block">
                          Incerteza:
                        </span>
                        <span className="font-mono text-[#D9B36C]">
                          {item.tierIncerteza} (±{item.incertezaPct}%)
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* SEÇÃO GWP 100 ANOS IPCC AR6 */}
            <div className="p-6 sm:p-8 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.1)] space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-heading font-extrabold text-xl text-[#F4F7FA]">
                    Métricas GWP do IPCC AR6 (Sixth Assessment Report)
                  </h3>
                  <p className="text-xs text-[#93A3B5]">
                    Potenciais de Aquecimento Global em horizonte de 100 anos com feedbacks
                    climáticos.
                  </p>
                </div>
                <button
                  onClick={() => setMostrarAr6Gwp(!mostrarAr6Gwp)}
                  className="text-xs font-mono text-[#12B886] hover:underline"
                >
                  {mostrarAr6Gwp ? 'Ocultar Detalhes' : 'Ver Tabela Completa'}
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.08)]">
                  <span className="text-[10px] font-mono text-[#93A3B5] block">
                    CO₂ (Dióxido de Carbono)
                  </span>
                  <span className="font-mono text-base font-bold text-[#F4F7FA]">GWP = 1</span>
                  <span className="text-[10px] text-[#93A3B5] block">Referência de base</span>
                </div>
                <div className="p-3.5 rounded-xl bg-[#0A0E12] border border-[#D9B36C]/40">
                  <span className="text-[10px] font-mono text-[#D9B36C] block">CH₄ Fóssil</span>
                  <span className="font-mono text-base font-bold text-[#D9B36C]">GWP = 29,8</span>
                  <span className="text-[10px] text-[#93A3B5] block">Com feedbacks AR6</span>
                </div>
                <div className="p-3.5 rounded-xl bg-[#0A0E12] border border-[#12B886]/40">
                  <span className="text-[10px] font-mono text-[#12B886] block">CH₄ Biogênico</span>
                  <span className="font-mono text-base font-bold text-[#12B886]">GWP = 27,2</span>
                  <span className="text-[10px] text-[#93A3B5] block">Sem carbono fóssil</span>
                </div>
                <div className="p-3.5 rounded-xl bg-[#0A0E12] border border-purple-500/40">
                  <span className="text-[10px] font-mono text-purple-300 block">
                    N₂O (Óxido Nitroso)
                  </span>
                  <span className="font-mono text-base font-bold text-purple-300">GWP = 273</span>
                  <span className="text-[10px] text-[#93A3B5] block">Tempo vida 109 anos</span>
                </div>
              </div>

              {mostrarAr6Gwp && (
                <div className="mt-4 pt-4 border-t border-[rgba(244,247,250,0.08)] space-y-3">
                  <div className="overflow-x-auto rounded-xl border border-[rgba(244,247,250,0.08)] bg-[#0A0E12]">
                    <table className="w-full text-left text-xs">
                      <thead className="border-b border-[rgba(244,247,250,0.08)] text-[#93A3B5] font-mono text-[10px] uppercase">
                        <tr>
                          <th className="py-2.5 px-3">Gás de Efeito Estufa</th>
                          <th className="py-2.5 px-3">Fórmula Química</th>
                          <th className="py-2.5 px-3 text-right">GWP 100 (AR6)</th>
                          <th className="py-2.5 px-3">Tempo de Vida na Atmosfera</th>
                          <th className="py-2.5 px-3">Fonte Normativa</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[rgba(244,247,250,0.04)] text-[#F4F7FA]">
                        {GWP_IPCC_AR6_OFICIAL.gases.map((g) => (
                          <tr key={g.formula}>
                            <td className="py-2.5 px-3 font-medium">{g.gas}</td>
                            <td className="py-2.5 px-3 font-mono text-[#12B886]">{g.formula}</td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-[#D9B36C]">
                              {g.gwp}
                            </td>
                            <td className="py-2.5 px-3 text-[#93A3B5]">{g.vidaAtmosfericaAnos}</td>
                            <td className="py-2.5 px-3 text-[11px] text-[#93A3B5]">{g.fonte}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* ABA 3: APÊNDICES & MEMÓRIA DE CÁLCULO DEMONSTRATIVA */}
        {/* ========================================================= */}
        {abaAtiva === 'calculadora' && (
          <div className="space-y-8">
            {/* APÊNDICE D: MEMÓRIA DE CÁLCULO DO LOTE DEMONSTRATIVO */}
            <div className="p-8 rounded-3xl bg-[#111820] border border-[rgba(244,247,250,0.1)] space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-[#12B886] uppercase">
                      Apêndice D • Simulação Formal
                    </span>
                    <span className="px-2 py-0.5 rounded bg-[#F59E0B]/20 border border-[#F59E0B] text-[#F59E0B] font-mono text-[10px] font-bold">
                      (DEMO) LOTE DEMONSTRATIVO
                    </span>
                  </div>
                  <h2 className="font-heading font-extrabold text-2xl text-[#F4F7FA]">
                    Memória de Cálculo de Lote Demonstrativo conforme Motor v2
                  </h2>
                </div>
                <Link
                  to="/passaporte/lote/demo"
                  className="px-4 py-2 rounded-xl bg-[#16202B] hover:bg-[#12B886]/20 border border-[#12B886]/40 text-xs font-mono text-[#12B886] flex items-center gap-1.5 transition-colors"
                >
                  <span>Ver DPP do Lote Demo</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>

              <p className="text-sm text-[#93A3B5] leading-relaxed">
                A memória de cálculo abaixo exemplifica a execução do motor Orbis v2 sobre um
                veículo doador típico (ex.: VW Gol 1.6 com baixa DETRAN{' '}
                <code className="text-[#12B886] font-mono">PR-BX-2026-991204 (DEMO)</code>),
                ilustrando o comportamento prescritivo da dedução de PE, drenagem de R-134a,
                conferência de destinação e cálculo de incerteza em quadratura.
              </p>

              {/* Tabela do Lote Demonstrativo */}
              <div className="overflow-x-auto rounded-xl border border-[rgba(244,247,250,0.1)] bg-[#0A0E12]">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-[rgba(244,247,250,0.1)] bg-[#16202B] text-[#93A3B5] font-mono text-[10px] uppercase">
                    <tr>
                      <th className="py-3 px-3">SKU / Peça</th>
                      <th className="py-3 px-3">Material</th>
                      <th className="py-3 px-3 text-right">Peso (kg)</th>
                      <th className="py-3 px-3 text-right">FE_ref</th>
                      <th className="py-3 px-3 text-right">Bruto (kg)</th>
                      <th className="py-3 px-3 text-right">PE (kg)</th>
                      <th className="py-3 px-3 text-right">Líquido (kg)</th>
                      <th className="py-3 px-3 text-center">Destinação</th>
                      <th className="py-3 px-3 text-center">Status Claim</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[rgba(244,247,250,0.06)] text-[#F4F7FA] font-mono text-[11px]">
                    <tr className="hover:bg-[#16202B]/40">
                      <td className="py-2.5 px-3 font-semibold text-[#F4F7FA]">
                        PART-GOL-CAPO-01 (Capô Motor)
                      </td>
                      <td className="py-2.5 px-3 text-[#93A3B5]">Aço (2,85)</td>
                      <td className="py-2.5 px-3 text-right">10,0</td>
                      <td className="py-2.5 px-3 text-right">2,85</td>
                      <td className="py-2.5 px-3 text-right text-[#93A3B5]">8,55</td>
                      <td className="py-2.5 px-3 text-right text-[#EF4444]">0,00</td>
                      <td className="py-2.5 px-3 text-right font-bold text-[#12B886]">8,55</td>
                      <td className="py-2.5 px-3 text-center text-[#12B886]">NF-e 1234</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="px-2 py-0.5 rounded bg-[#12B886]/15 text-[#12B886] text-[10px] font-bold">
                          CONFIRMADO
                        </span>
                      </td>
                    </tr>
                    <tr className="hover:bg-[#16202B]/40">
                      <td className="py-2.5 px-3 font-semibold text-[#F4F7FA]">
                        PART-GOL-RODA-01 (Roda Liga Leve)
                      </td>
                      <td className="py-2.5 px-3 text-[#93A3B5]">Alumínio (8,20)</td>
                      <td className="py-2.5 px-3 text-right">8,0</td>
                      <td className="py-2.5 px-3 text-right">8,20</td>
                      <td className="py-2.5 px-3 text-right text-[#93A3B5]">19,68</td>
                      <td className="py-2.5 px-3 text-right text-[#EF4444]">0,00</td>
                      <td className="py-2.5 px-3 text-right font-bold text-[#12B886]">19,68</td>
                      <td className="py-2.5 px-3 text-center text-[#12B886]">NF-e 1235</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="px-2 py-0.5 rounded bg-[#12B886]/15 text-[#12B886] text-[10px] font-bold">
                          CONFIRMADO
                        </span>
                      </td>
                    </tr>
                    <tr className="hover:bg-[#16202B]/40">
                      <td className="py-2.5 px-3 font-semibold text-[#F4F7FA]">
                        PART-GOL-ESTAT-01 (Estator Alternador)
                      </td>
                      <td className="py-2.5 px-3 text-[#93A3B5]">Cobre (5,40)</td>
                      <td className="py-2.5 px-3 text-right">2,5</td>
                      <td className="py-2.5 px-3 text-right">5,40</td>
                      <td className="py-2.5 px-3 text-right text-[#93A3B5]">4,05</td>
                      <td className="py-2.5 px-3 text-right text-[#EF4444]">0,00</td>
                      <td className="py-2.5 px-3 text-right font-bold text-[#12B886]">4,05</td>
                      <td className="py-2.5 px-3 text-center text-[#12B886]">MTR 4410</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="px-2 py-0.5 rounded bg-[#12B886]/15 text-[#12B886] text-[10px] font-bold">
                          CONFIRMADO
                        </span>
                      </td>
                    </tr>
                    <tr className="hover:bg-[#16202B]/40">
                      <td className="py-2.5 px-3 font-semibold text-[#F4F7FA]">
                        PART-GOL-PARAC-01 (Parachoque Dianteiro)
                      </td>
                      <td className="py-2.5 px-3 text-[#93A3B5]">Polímeros (1,90)</td>
                      <td className="py-2.5 px-3 text-right">4,0</td>
                      <td className="py-2.5 px-3 text-right">1,90</td>
                      <td className="py-2.5 px-3 text-right text-[#93A3B5]">2,28</td>
                      <td className="py-2.5 px-3 text-right text-[#EF4444]">0,00</td>
                      <td className="py-2.5 px-3 text-right font-bold text-[#12B886]">2,28</td>
                      <td className="py-2.5 px-3 text-center text-[#D9B36C]">Em Estoque</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="px-2 py-0.5 rounded bg-[#D9B36C]/15 text-[#D9B36C] text-[10px] font-bold">
                          POTENCIAL
                        </span>
                      </td>
                    </tr>
                    <tr className="hover:bg-[#16202B]/40">
                      <td className="py-2.5 px-3 font-semibold text-[#F4F7FA]">
                        FLUID-R134A (Carga Climatização)
                      </td>
                      <td className="py-2.5 px-3 text-[#93A3B5]">R-134a (GWP 1530)</td>
                      <td className="py-2.5 px-3 text-right">0,5</td>
                      <td className="py-2.5 px-3 text-right">1.530</td>
                      <td className="py-2.5 px-3 text-right text-[#93A3B5]">765,00</td>
                      <td className="py-2.5 px-3 text-right text-[#EF4444]">0,00</td>
                      <td className="py-2.5 px-3 text-right font-bold text-[#12B886]">765,00</td>
                      <td className="py-2.5 px-3 text-center text-[#12B886]">MTR GÁS</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="px-2 py-0.5 rounded bg-[#12B886]/15 text-[#12B886] text-[10px] font-bold">
                          CONFIRMADO
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Consolidado do Lote Demo */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl bg-[#0A0E12] border border-[#12B886]/40">
                  <span className="text-[10px] font-mono text-[#93A3B5] block">
                    Total Evitado Líquido
                  </span>
                  <span className="font-mono text-base font-bold text-[#12B886]">
                    799,56 kgCO₂e
                  </span>
                  <span className="text-[10px] text-[#93A3B5] block">Floor 2 casas</span>
                </div>
                <div className="p-3.5 rounded-xl bg-[#0A0E12] border border-[#12B886]/40">
                  <span className="text-[10px] font-mono text-[#12B886] block">
                    Claim Confirmado
                  </span>
                  <span className="font-mono text-base font-bold text-[#12B886]">
                    797,28 kgCO₂e
                  </span>
                  <span className="text-[10px] text-[#93A3B5] block">Com NF-e / MTR</span>
                </div>
                <div className="p-3.5 rounded-xl bg-[#0A0E12] border border-[#D9B36C]/40">
                  <span className="text-[10px] font-mono text-[#D9B36C] block">
                    Claim Potencial
                  </span>
                  <span className="font-mono text-base font-bold text-[#D9B36C]">2,28 kgCO₂e</span>
                  <span className="text-[10px] text-[#93A3B5] block">Parachoque em estoque</span>
                </div>
                <div className="p-3.5 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.1)]">
                  <span className="text-[10px] font-mono text-[#93A3B5] block">
                    Incerteza do Lote (Quadratura)
                  </span>
                  <span className="font-mono text-base font-bold text-[#F4F7FA]">
                    ±17,25 kg (±2,2%)
                  </span>
                  <span className="text-[10px] text-[#93A3B5] block">u_massa = 1,0%</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* BLOCO DE INTEGRAÇÃO API & LINKS RELACIONADOS */}
        {/* ========================================================= */}
        <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-r from-[#111820] to-[#16202B] border border-[#12B886]/30 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 text-xs font-bold text-[#12B886] uppercase font-mono">
              <Sparkles className="w-4 h-4 text-[#12B886]" />
              <span>Integração Automatizada via REST API v2</span>
            </div>
            <h3 className="font-heading font-extrabold text-xl text-[#F4F7FA]">
              Consuma o DM-ORB-001 v1.1 e deduplique lotes pelo seu ERP
            </h3>
            <p className="text-xs text-[#93A3B5] leading-relaxed">
              Os fatores deste documento e o algoritmo de deduplicação inter-CDVs com trava HTTP 409
              são executados em tempo real na rota{' '}
              <code className="text-[#12B886] font-mono">/backend/v1/cdv/lotes</code> e na API v2.
              Consulte a documentação técnica para payloads JSON completos e webhooks B2B.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <Link
              to="/api-docs-cdv"
              className="px-6 py-3 rounded-xl font-bold text-xs bg-[#12B886] text-[#0A0E12] hover:bg-[#0CA678] transition-all flex items-center justify-center gap-2 shadow-emerald-glow"
            >
              <span>Ver Documentação da API</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/verificador"
              className="px-5 py-3 rounded-xl font-semibold text-xs border border-[rgba(244,247,250,0.2)] text-[#F4F7FA] hover:border-[#12B886] hover:text-[#12B886] transition-all flex items-center justify-center gap-2 bg-[#0A0E12]"
            >
              <CheckCircle2 className="w-4 h-4 text-[#12B886]" />
              <span>Verificar Selos & DPP</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
