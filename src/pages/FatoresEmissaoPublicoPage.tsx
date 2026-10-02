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
  Clock,
  Download,
} from 'lucide-react'
import {
  CATALOGO_FATORES_CO2E,
  METADADOS_CATALOGO_FATORES,
  GWP_IPCC_AR6_OFICIAL,
  type FatorCatalogoItem,
} from '@/services/catalogoFatoresOficiais'

export default function FatoresEmissaoPublicoPage() {
  const [busca, setBusca] = useState('')
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>('todos')
  const [tierFiltro, setTierFiltro] = useState<string>('todos')
  const [mostrarAr6Gwp, setMostrarAr6Gwp] = useState(false)

  // Itens filtrados
  const fatoresFiltrados = useMemo(() => {
    return CATALOGO_FATORES_CO2E.filter((item) => {
      // Filtro categoria
      if (categoriaFiltro !== 'todos' && item.categoria !== categoriaFiltro) {
        return false
      }
      // Filtro tier
      if (tierFiltro !== 'todos' && item.tierIncerteza !== tierFiltro) {
        return false
      }
      // Busca textual
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

  return (
    <div className="min-h-screen py-10 md:py-16 bg-[#0A0E12] text-[#F4F7FA]">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 space-y-12">
        {/* Breadcrumb / Top Bar */}
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
            <span className="text-[#12B886] font-semibold">Catálogo Oficial de Fatores</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-[#12B886]/15 border border-[#12B886]/40 text-[#12B886] text-[11px] font-mono font-bold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#12B886] animate-pulse" />
              CATÁLOGO {METADADOS_CATALOGO_FATORES.versao} • VIGÊNCIA ATIVA
            </span>
            <button
              onClick={exportarCatalogoCsv}
              className="px-3 py-1 rounded-lg bg-[#16202B] hover:bg-[#12B886]/20 border border-[rgba(244,247,250,0.15)] text-xs text-[#F4F7FA] hover:text-[#12B886] transition-all flex items-center gap-1.5 font-mono"
              title="Baixar tabela em CSV para auditoria"
            >
              <Download className="w-3.5 h-3.5 text-[#12B886]" />
              <span>Exportar CSV</span>
            </button>
          </div>
        </div>

        {/* 1. HERO INSTITUCIONAL DO CATÁLOGO DE FATORES */}
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-[#111820] via-[#111820] to-[#16202B] border border-[#12B886]/40 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#12B886]/5 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-4xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#16202B] border border-[#12B886]/40 text-[#12B886] text-xs font-mono font-bold uppercase tracking-wider">
              <Scale className="w-3.5 h-3.5 text-[#12B886]" />
              <span>Transparência Metodológica Pública • Bloco 4 dMRV</span>
            </div>

            <h1 className="font-heading font-black text-3xl sm:text-5xl text-[#F4F7FA] tracking-tight">
              Catálogo Oficial de Fatores CO₂e
            </h1>

            <p className="text-base sm:text-lg text-[#12B886] font-medium leading-relaxed">
              Base curada de fatores de emissão primária, insetting circular e descarbonização
              aplicados pelo motor da plataforma aos passaportes de produtos (DPP), inventários GHG
              e relatórios fiscais.
            </p>

            <p className="text-sm sm:text-base text-[#93A3B5] leading-relaxed">
              Em total alinhamento com as diretrizes do SBCE (Lei Federal nº 15.042/2024), Programa
              MOVER (Lei nº 14.902/2024), Diretiva Europeia ELV (2000/53/EC) e os padrões
              reconhecidos internacionalmente (WorldSteel, IAI, ICA, PlasticsEurope e IPCC AR6).
            </p>

            {/* Metadados Técnicos em Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
              <div className="p-3.5 rounded-xl bg-[#0A0E12]/80 border border-[rgba(244,247,250,0.08)]">
                <span className="text-[10px] uppercase font-mono text-[#93A3B5] flex items-center gap-1">
                  <FileCheck className="w-3 h-3 text-[#12B886]" />
                  Versão do Catálogo
                </span>
                <span className="font-mono text-sm font-bold text-[#12B886]">
                  {METADADOS_CATALOGO_FATORES.versao}
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
                  Regra Snapshot
                </span>
                <span className="font-mono text-xs font-bold text-[#3B82F6]">
                  Congelado na Emissão
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-[#0A0E12]/80 border border-[rgba(244,247,250,0.08)]">
                <span className="text-[10px] uppercase font-mono text-[#93A3B5] flex items-center gap-1">
                  <Layers className="w-3 h-3 text-[#F4F7FA]" />
                  Fatores Curados
                </span>
                <span className="font-mono text-xs font-bold text-[#F4F7FA]">
                  {CATALOGO_FATORES_CO2E.length} Fatores Oficiais
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. NOTA METODOLÓGICA DE CONGELAMENTO (SNAPSHOT) & RESERVA PRÉ-LAUDO */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card 1: Snapshot Imutável */}
          <div className="p-6 rounded-2xl bg-[#111820] border border-[#12B886]/30 space-y-3 relative overflow-hidden">
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

          {/* Card 2: Reserva Pré-Laudo */}
          <div className="p-6 rounded-2xl bg-[#111820] border border-[#D9B36C]/30 space-y-3 relative overflow-hidden">
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

        {/* 3. BARRA DE FILTROS & BUSCA INTERATIVA */}
        <div className="p-6 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.1)] space-y-4">
          <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
            {/* Campo de Busca */}
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

            {/* Filtro de Tier */}
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

          {/* Categorias em Pílulas */}
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

        {/* 4. TABELA RESPONSIVA / CARDS EM DISPOSITIVOS MÓVEIS */}
        <section className="space-y-4">
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

          {fatoresFiltrados.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.1)] space-y-3">
              <Search className="w-8 h-8 text-[#93A3B5] mx-auto opacity-50" />
              <p className="text-sm font-semibold text-[#F4F7FA]">
                Nenhum fator encontrado para os filtros selecionados
              </p>
              <p className="text-xs text-[#93A3B5]">
                Tente buscar por termos mais genéricos ou limpar o filtro de busca.
              </p>
              <button
                onClick={() => {
                  setBusca('')
                  setCategoriaFiltro('todos')
                  setTierFiltro('todos')
                }}
                className="px-4 py-2 rounded-lg bg-[#12B886] text-[#0A0E12] font-bold text-xs"
              >
                Redefinir Filtros
              </button>
            </div>
          ) : (
            <>
              {/* VISUALIZAÇÃO DESKTOP: TABELA COMPLETA */}
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

                        <td className="py-3.5 px-4 text-right">
                          <span
                            className={`font-mono font-black text-base ${
                              item.valorFator < 0
                                ? 'text-[#3B82F6]'
                                : item.valorFator === 0
                                  ? 'text-[#12B886]'
                                  : 'text-[#12B886]'
                            }`}
                          >
                            {formatarValorFator(item)}
                          </span>
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

              {/* VISUALIZAÇÃO MOBILE: CARDS RESPONSIVOS */}
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

                    <div className="p-2 rounded-lg bg-[#0A0E12] border border-[rgba(244,247,250,0.06)] text-[11px] text-[#93A3B5] leading-normal">
                      <strong className="text-[#F4F7FA]">Fundamentação:</strong>{' '}
                      {item.detalheTecnico}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>

        {/* 5. GWP 100 ANOS - IPCC AR6 (SIXTH ASSESSMENT REPORT) */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#16202B] border border-[#12B886]/30 flex items-center justify-center text-[#12B886]">
                <Scale className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-heading font-extrabold text-xl text-[#F4F7FA]">
                  Métricas GWP do IPCC AR6 (Sixth Assessment Report)
                </h3>
                <p className="text-xs text-[#93A3B5]">
                  Potenciais de Aquecimento Global em horizonte de 100 anos com feedbacks
                  climáticos.
                </p>
              </div>
            </div>

            <button
              onClick={() => setMostrarAr6Gwp(!mostrarAr6Gwp)}
              className="text-xs font-mono text-[#12B886] hover:underline"
            >
              {mostrarAr6Gwp ? 'Ocultar Detalhes' : 'Ver Tabela Completa'}
            </button>
          </div>

          <div className="p-6 sm:p-8 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.1)] space-y-4">
            <p className="text-xs text-[#93A3B5] leading-relaxed">
              O motor de emissões da Orbis Protocol utiliza obrigatoriamente as métricas do{' '}
              <strong className="text-[#F4F7FA]">IPCC Sexto Relatório de Avaliação (AR6)</strong>{' '}
              para consolidação de tCO₂e, alinhado às diretrizes do SBCE (Lei nº 15.042/2024) e
              conformidade de reporte corporativo no Brasil:
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.08)]">
                <span className="text-[10px] font-mono text-[#93A3B5] block">
                  CO₂ (Dióxido de Carbono)
                </span>
                <span className="font-mono text-base font-bold text-[#F4F7FA]">GWP = 1</span>
                <span className="text-[10px] text-[#93A3B5] block">Referência de base</span>
              </div>

              <div className="p-3.5 rounded-xl bg-[#0A0E12] border border-[#D9B36C]/40">
                <span className="text-[10px] font-mono text-[#D9B36C] block">
                  CH₄ Fóssil (Metano Fóssil)
                </span>
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
                <span className="text-[10px] text-[#93A3B5] block">Tempo de vida 109 anos</span>
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
        </section>

        {/* 6. CONEXÃO COM API E DOCUMENTAÇÃO TÉCNICA */}
        <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-r from-[#111820] to-[#16202B] border border-[#12B886]/30 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 text-xs font-bold text-[#12B886] uppercase font-mono">
              <Sparkles className="w-4 h-4 text-[#12B886]" />
              <span>Integração Automatizada via REST API v1</span>
            </div>
            <h3 className="font-heading font-extrabold text-xl text-[#F4F7FA]">
              Consuma o catálogo e envie lotes pelo seu ERP
            </h3>
            <p className="text-xs text-[#93A3B5] leading-relaxed">
              Os fatores deste catálogo são aplicados em tempo de ingestão na rota{' '}
              <code className="text-[#12B886] font-mono">/backend/v1/cdv/lotes</code>. Veja a
              especificação completa de campos, payloads e webhook B2B.
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
