import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  ShieldCheck,
  ChevronRight,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Calculator,
  Scale,
  FileCheck2,
  Car,
  FileText,
  CheckCircle2,
  ExternalLink,
  Layers,
  Lock,
  Download,
  Building2,
  Compass,
  FileCode2,
  BarChart3,
  RefreshCw,
  QrCode,
  BadgeCheck,
} from 'lucide-react'
import { DOSSIE_DEFAULT_FALLBACK, NOTAS_DEFAULT_FALLBACK } from '@/services/corporativoService'
import { consultarLoteConsolidado, CdvLoteRecord, CdvPecaRecord } from '@/services/cdvService'
import { SecaoAvaliacaoAdicionalidade } from '@/components/SecaoAvaliacaoAdicionalidade'
import { QRCodeSVG } from '@/components/QRCodeSVG'
import { registrarInicioDemonstracao } from '@/services/demoAuditService'
import { exportarDemonstracaoOrientadaPdf } from '@/services/relatorioLaudoPdf'
import { useToast } from '@/hooks/use-toast'

interface EtapaGuia {
  id: number
  slug: string
  titulo: string
  rotuloCurto: string
  descricaoCurta: string
  icon: React.ComponentType<{ className?: string }>
}

const ETAPAS: EtapaGuia[] = [
  {
    id: 1,
    slug: 'boas-vindas',
    titulo: 'O que o Orbis Protocol faz',
    rotuloCurto: 'Boas-vindas',
    descricaoCurta: 'Transforma notas fiscais e dados operacionais em prova técnica auditável.',
    icon: Sparkles,
  },
  {
    id: 2,
    slug: 'motor-calculo',
    titulo: 'Cálculo da pegada de carbono',
    rotuloCurto: 'Motor de Cálculo',
    descricaoCurta:
      'Fatores oficiais e segregação técnica rigorosa entre emissões fósseis e biogênicas.',
    icon: Calculator,
  },
  {
    id: 3,
    slug: 'laudos-conformidade',
    titulo: 'Laudos periciais e conformidade tributária',
    rotuloCurto: 'Conformidade & SBCE',
    descricaoCurta:
      'Dossiê com 12 notas fiscais e enquadramento sob a Lei 15.042/2024 e o IVA dual.',
    icon: Scale,
  },
  {
    id: 4,
    slug: 'rastreabilidade-cdv-mover',
    titulo: 'Rastreabilidade veicular (CDV / MOVER)',
    rotuloCurto: 'Rastreabilidade CDV',
    descricaoCurta:
      'Lote demo Renault Clio (77 peças: CONTRAN 611 + MOVER) e selo DPP com SHA-256.',
    icon: Car,
  },
  {
    id: 5,
    slug: 'documentos-prontos',
    titulo: 'Documentos prontos para envio',
    rotuloCurto: 'Documentos Prontos',
    descricaoCurta:
      'Laudo pericial e relatórios prontos para órgãos de controle, contabilidade e bancos.',
    icon: FileText,
  },
  {
    id: 6,
    slug: 'encerramento-cta',
    titulo: 'Próximos passos e contratação',
    rotuloCurto: 'Encerramento',
    descricaoCurta:
      'Inicie seu diagnóstico com CNPJ real ou consulte os planos e serviços oficiais.',
    icon: BadgeCheck,
  },
]

export default function ModoDemonstracaoOrientadaPage() {
  const [etapaAtiva, setEtapaAtiva] = useState<number>(1)

  // Estado dos dados do Lote Renault Clio Demo (PR-BX-2026-1240105)
  const [loteClio, setLoteClio] = useState<CdvLoteRecord | null>(null)
  const [pecasClio, setPecasClio] = useState<CdvPecaRecord[]>([])
  const [loadingClio, setLoadingClio] = useState<boolean>(true)
  const [abaPecas, setAbaPecas] = useState<'611' | 'mover'>('611')

  // Simulador interativo da Etapa 2 (Motor de Cálculo)
  const [simTipo, setSimTipo] = useState<'diesel' | 'eletricidade' | 'etanol'>('diesel')
  const [simQtd, setSimQtd] = useState<number>(1000)

  // Estado da exportação do relatório em PDF
  const [exportandoPdf, setExportandoPdf] = useState<boolean>(false)
  const { toast } = useToast()

  // Registra início de telemetria da demonstração anônima no backend PocketBase
  useEffect(() => {
    registrarInicioDemonstracao({
      etapaInicial: 1,
      etapaNome: 'Boas-vindas',
      origemUrl: typeof window !== 'undefined' ? window.location.href : '/demo',
    }).catch(() => {
      /* non-blocking */
    })
  }, [])

  // Carrega lote de demonstração oficial Renault Clio
  useEffect(() => {
    let active = true
    setLoadingClio(true)
    consultarLoteConsolidado('PR-BX-2026-1240105')
      .then((res) => {
        if (!active) return
        if (res) {
          setLoteClio(res.lote)
          setPecasClio(res.pecas)
        }
      })
      .catch((err) => {
        console.warn('[Orbis Demo] Não foi possível carregar lote Clio do backend:', err)
      })
      .finally(() => {
        if (active) setLoadingClio(false)
      })
    return () => {
      active = false
    }
  }, [])

  // Separação de peças do lote Clio
  const pecas611 = pecasClio.filter((p) => !p.catalogo_numero || p.catalogo_numero <= 49)
  const pecasMover = pecasClio.filter((p) => p.catalogo_numero && p.catalogo_numero > 49)

  // Cálculos do simulador da etapa 2
  const calcSimulador = () => {
    if (simTipo === 'diesel') {
      // GHG Protocol BR 2025: Fóssil 2.670 kgCO2e/L, Biogênico (B14) 0.357 kgCO2/L
      const fossilKg = simQtd * 2.67
      const bioKg = simQtd * 0.357
      return {
        fatorTexto: '2,670 kg CO₂e/L (Fóssil) + 0,357 kg CO₂/L (B14 Biogênico)',
        fonte: 'GHG Protocol Brasil v2025.1 / ANP / IPCC AR6',
        fossilKg,
        fossilTon: fossilKg / 1000,
        bioKg,
        bioTon: bioKg / 1000,
        unidade: 'Litros (Diesel B S10)',
        tier: 'Tier 3 (Dados Primários de Abastecimento)',
      }
    }
    if (simTipo === 'etanol') {
      // Etanol Hidratado Comum: Fóssil 0.420 kgCO2e/L, Biogênico 1.520 kgCO2/L
      const fossilKg = simQtd * 0.42
      const bioKg = simQtd * 1.52
      return {
        fatorTexto: '0,420 kg CO₂e/L (Fóssil) + 1,520 kg CO₂/L (Biogênico)',
        fonte: 'GHG Protocol Brasil v2025.1 / Ministério da Agricultura',
        fossilKg,
        fossilTon: fossilKg / 1000,
        bioKg,
        bioTon: bioKg / 1000,
        unidade: 'Litros (Etanol Hidratado)',
        tier: 'Tier 3 (Cupom NFC-e / NF-e)',
      }
    }
    // Eletricidade SIN
    // Fator médio SIN MCTI 2025: 0.0289 kgCO2e/kWh (100% fóssil na margem de operação)
    const fossilKg = simQtd * 0.0289
    const bioKg = 0
    return {
      fatorTexto: '0,0289 kg CO₂e/kWh (Base Localização SIN MCTI)',
      fonte: 'MCTI / Sistema Interligado Nacional (Média Mensal 2025)',
      fossilKg,
      fossilTon: fossilKg / 1000,
      bioKg,
      bioTon: 0,
      unidade: 'kWh (Rede Elétrica Concessionária)',
      tier: 'Tier 3 (Fatura Concessionária NF3e)',
    }
  }

  const simResult = calcSimulador()

  // Mudança de etapa com scroll suave ao topo do conteúdo
  const irParaEtapa = (num: number) => {
    setEtapaAtiva(num)
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 120, behavior: 'smooth' })
    }
  }

  const progressoPercent = Math.round((etapaAtiva / ETAPAS.length) * 100)
  const etapaAtualObj = ETAPAS.find((e) => e.id === etapaAtiva) || ETAPAS[0]

  const handleExportarDemonstracaoPdf = async () => {
    try {
      setExportandoPdf(true)
      const resultado = await exportarDemonstracaoOrientadaPdf({
        loteClio: {
          marcaModelo: loteClio?.marca_modelo || 'Renault Clio Authentique 1.0 16V Hi-Flex',
          baixaDetran: loteClio?.identificador || 'PR-BX-2026-1240105',
          placa: loteClio?.placa || 'AYK-7110',
          cartelaDesmontagem: loteClio?.cartela_desmontagem || '12401050711',
          totalPecas: loteClio?.total_pecas || (pecasClio.length > 0 ? pecasClio.length : 77),
          totalPesoKg: loteClio?.total_peso_kg || 437.7,
          totalCo2eEvitadoKg: loteClio?.total_co2e_evitado_kg || 629.4,
          cdvNome: loteClio?.cdv_nome || 'Centro de Desmontagem Veicular Modelo Ltda.',
          cdvCnpj: loteClio?.cdv_cnpj || '28.149.882/0001-40',
          pecas611Count: pecas611.length > 0 ? pecas611.length : 49,
          pecasMoverCount: pecasMover.length > 0 ? pecasMover.length : 28,
        },
        simulador: {
          tipoCombustivel: simTipo,
          quantidade: simQtd,
          unidade: simResult.unidade,
          fatorTexto: simResult.fatorTexto,
          fonteOficial: simResult.fonte,
          tierIncerteza: simResult.tier,
          fossilTon: simResult.fossilTon,
          fossilKg: simResult.fossilKg,
          bioTon: simResult.bioTon,
          bioKg: simResult.bioKg,
        },
        dossie: {
          razaoSocial: DOSSIE_DEFAULT_FALLBACK.razaoSocial,
          cnpj: DOSSIE_DEFAULT_FALLBACK.cnpj,
          totalNotas: NOTAS_DEFAULT_FALLBACK.length,
          emissoesTotaisTco2e: DOSSIE_DEFAULT_FALLBACK.totalEmissoesTco2e,
          escopo1Tco2e: DOSSIE_DEFAULT_FALLBACK.escopo1Tco2e,
          escopo2Tco2e: DOSSIE_DEFAULT_FALLBACK.escopo2Tco2e,
          escopo3Tco2e: DOSSIE_DEFAULT_FALLBACK.escopo3Tco2e,
          hashFechamento:
            DOSSIE_DEFAULT_FALLBACK.hashFechamentoCompetencia ||
            '0x8f4b29a7e3c12948bb92ff78201a0bc45d61e93f91823ab12c98d7ef2049ba12',
          enquadramentoSbceTexto: 'Isento (< 10.000 tCO₂e/ano)',
          statusSbce: 'isento',
        },
      })

      toast({
        title: 'Demonstração exportada com sucesso',
        description: `Documento oficial gerado com hash SHA-256 ${resultado.hash.slice(0, 16)}...`,
      })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao exportar demonstração em PDF'
      toast({
        title: 'Não foi possível exportar o PDF',
        description: msg,
        variant: 'destructive',
      })
    } finally {
      setExportandoPdf(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0E12] text-[#F4F7FA] pb-24">
      {/* 1. BARRA DE PROGRESSO FIXA NO TOPO */}
      <div className="sticky top-20 z-30 bg-[#0A0E12] border-b border-[rgba(244,247,250,0.08)] shadow-[0_4px_30px_rgba(0,0,0,0.4)]">
        <div className="w-full h-1.5 bg-[#16202B]">
          <div
            className="h-full bg-gradient-to-r from-[#12B886] via-[#20c997] to-[#D9B36C] transition-all duration-300"
            style={{ width: `${progressoPercent}%` }}
          />
        </div>

        <div className="max-w-[1320px] mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <span className="px-2.5 py-0.5 rounded-full bg-[#12B886]/15 border border-[#12B886]/30 text-[#12B886] font-mono font-bold uppercase tracking-wider text-[11px]">
              Modo Demonstração Comercial
            </span>
            <span className="text-[#93A3B5] hidden sm:inline">•</span>
            <span className="text-[#93A3B5] hidden sm:inline">
              Etapa <strong className="text-[#12B886]">{etapaAtiva}</strong> de {ETAPAS.length}:{' '}
              <span className="text-[#F4F7FA] font-medium">{etapaAtualObj.rotuloCurto}</span>
            </span>
          </div>

          {/* Controles Anterior / Próximo compactos no topo e botão de exportação */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleExportarDemonstracaoPdf}
              disabled={exportandoPdf}
              title="Exportar documento oficial da demonstração em PDF com as 6 etapas e hash SHA-256"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#D9B36C]/15 border border-[#D9B36C]/40 text-[#D9B36C] hover:bg-[#D9B36C] hover:text-[#0A0E12] font-semibold transition-all text-xs disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5 shrink-0" />
              <span>{exportandoPdf ? 'Gerando PDF...' : 'Exportar Demonstração (PDF)'}</span>
            </button>

            <div className="h-4 w-px bg-[rgba(244,247,250,0.12)] hidden sm:block" />

            <button
              type="button"
              disabled={etapaAtiva === 1}
              onClick={() => irParaEtapa(etapaAtiva - 1)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[rgba(244,247,250,0.15)] text-[#93A3B5] hover:text-[#F4F7FA] hover:bg-[#16202B] disabled:opacity-30 disabled:pointer-events-none transition-all font-medium text-xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Anterior</span>
            </button>

            <span className="font-mono text-[#D9B36C] font-semibold px-1">{progressoPercent}%</span>

            {etapaAtiva < ETAPAS.length ? (
              <button
                type="button"
                onClick={() => irParaEtapa(etapaAtiva + 1)}
                className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-lg bg-[#12B886] text-[#0A0E12] hover:bg-[#0CA678] font-semibold transition-all text-xs shadow-emerald-glow"
              >
                <span>Próximo</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <Link
                to="/diagnostico"
                className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-lg bg-[#12B886] text-[#0A0E12] hover:bg-[#0CA678] font-bold transition-all text-xs shadow-emerald-glow"
              >
                <span>Iniciar Diagnóstico</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* 2. HEADER DA DEMONSTRAÇÃO */}
      <div className="max-w-[1320px] mx-auto px-4 sm:px-6 pt-8 pb-4">
        <div className="p-6 rounded-2xl bg-gradient-to-r from-[#111820] via-[#16202B] to-[#0D1217] border border-[rgba(244,247,250,0.12)] shadow-2xl relative overflow-hidden">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2 max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D9B36C]/10 border border-[#D9B36C]/30 text-[#D9B36C] text-xs font-semibold">
                <Compass className="w-3.5 h-3.5" />
                <span>Tour Comercial Autoguiado • Acesso Aberto e Público</span>
              </div>
              <h1 className="font-heading font-black text-2xl sm:text-3xl text-[#F4F7FA] tracking-wide">
                Modo Demonstração Orientada • Orbis Protocol
              </h1>
              <p className="text-sm text-[#93A3B5] leading-relaxed">
                Apresentação completa das capacidades técnicas e probatórias da plataforma, sem
                exigir login. Acompanhe a esteira que transforma documentos fiscais, notas de
                insumos e desmontagem veicular em lastro auditável, laudos técnicos e passaportes
                digitais verificáveis.
              </p>
            </div>

            <div className="flex flex-row lg:flex-col gap-3 shrink-0">
              <button
                type="button"
                onClick={handleExportarDemonstracaoPdf}
                disabled={exportandoPdf}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-[#D9B36C] text-[#0A0E12] hover:bg-[#c49f57] transition-all text-center shadow-md disabled:opacity-60"
              >
                <Download className="w-4 h-4" />
                <span>
                  {exportandoPdf ? 'Gerando Documento...' : 'Exportar Demonstração (PDF)'}
                </span>
              </button>
              <Link
                to="/diagnostico"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-[#12B886] text-[#0A0E12] hover:bg-[#0CA678] transition-all shadow-emerald-glow text-center"
              >
                <span>Iniciar Diagnóstico Grátis</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/planos"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-[#111820] border border-[rgba(244,247,250,0.2)] text-[#F4F7FA] hover:border-[#12B886] hover:text-[#12B886] transition-all text-center"
              >
                <span>Ver Planos & Tabela</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 3. LAYOUT PRINCIPAL: TRILHA LATERAL + CONTEÚDO DA ETAPA */}
      <div className="max-w-[1320px] mx-auto px-4 sm:px-6 pt-4">
        {/* Seletor Mobile / Colapsável de Etapas */}
        <div className="lg:hidden mb-6 p-3 rounded-xl bg-[#111820] border border-[rgba(244,247,250,0.1)]">
          <div className="text-xs font-semibold text-[#93A3B5] uppercase tracking-wider mb-2 flex items-center justify-between">
            <span>Trilha de Etapas ({etapaAtiva}/6)</span>
            <span className="text-[#12B886] font-mono">{progressoPercent}%</span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
            {ETAPAS.map((et) => {
              const Icon = et.icon
              const isAtiva = et.id === etapaAtiva
              const isConcluida = et.id < etapaAtiva
              return (
                <button
                  key={et.id}
                  type="button"
                  onClick={() => irParaEtapa(et.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap border shrink-0 transition-all ${
                    isAtiva
                      ? 'bg-[#12B886] text-[#0A0E12] border-[#12B886] font-bold'
                      : isConcluida
                        ? 'bg-[#16202B] text-[#12B886] border-[#12B886]/40'
                        : 'bg-[#0D1217] text-[#93A3B5] border-[rgba(244,247,250,0.1)]'
                  }`}
                >
                  <span className="font-mono">{et.id}.</span>
                  <Icon className="w-3.5 h-3.5" />
                  <span>{et.rotuloCurto}</span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* TRILHA LATERAL DESKTOP (STICKY) */}
          <aside className="hidden lg:block lg:col-span-4 sticky top-36 space-y-3">
            <div className="p-4 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.12)] shadow-xl">
              <div className="px-2 pb-3 mb-2 border-b border-[rgba(244,247,250,0.08)] flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#12B886] flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5" />
                  Trilha da Demonstração
                </span>
                <span className="text-xs font-mono text-[#D9B36C]">
                  {etapaAtiva} de {ETAPAS.length}
                </span>
              </div>

              <div className="space-y-1.5">
                {ETAPAS.map((et) => {
                  const Icon = et.icon
                  const isAtiva = et.id === etapaAtiva
                  const isConcluida = et.id < etapaAtiva

                  return (
                    <button
                      key={et.id}
                      type="button"
                      onClick={() => irParaEtapa(et.id)}
                      className={`w-full p-3 rounded-xl border text-left transition-all flex items-start gap-3 group ${
                        isAtiva
                          ? 'bg-[#12B886]/10 border-[#12B886] text-[#F4F7FA] shadow-md shadow-[#12B886]/10'
                          : isConcluida
                            ? 'bg-[#0D1217] border-[#12B886]/30 text-[#93A3B5] hover:border-[#12B886]/60 hover:text-[#F4F7FA]'
                            : 'bg-[#0D1217] border-[rgba(244,247,250,0.06)] text-[#93A3B5]/80 hover:border-[rgba(244,247,250,0.2)] hover:text-[#F4F7FA]'
                      }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0 transition-colors ${
                          isAtiva
                            ? 'bg-[#12B886] text-[#0A0E12]'
                            : isConcluida
                              ? 'bg-[#12B886]/20 text-[#12B886]'
                              : 'bg-[#16202B] text-[#93A3B5]'
                        }`}
                      >
                        {isConcluida ? <CheckCircle2 className="w-4 h-4 text-[#12B886]" /> : et.id}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div
                          className={`text-xs font-bold leading-tight ${
                            isAtiva ? 'text-[#12B886]' : 'text-[#F4F7FA] group-hover:text-[#12B886]'
                          }`}
                        >
                          {et.titulo}
                        </div>
                        <div className="text-[11px] text-[#93A3B5] mt-1 line-clamp-2 leading-relaxed">
                          {et.descricaoCurta}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>

              {/* Informação regulatória compacta */}
              <div className="mt-4 pt-4 border-t border-[rgba(244,247,250,0.08)] px-2 space-y-2">
                <div className="text-[11px] text-[#93A3B5] flex items-center gap-1.5 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#12B886]" />
                  <span>Metodologia auditada dMRV</span>
                </div>
                <p className="text-[10px] text-[#93A3B5]/80 leading-normal">
                  Padrões GHG Protocol v2025.1, IPCC AR6 (GWP100), ISO 14067 e Lei 15.042/2024
                  (SBCE).
                </p>
              </div>
            </div>

            {/* Banner de apoio comercial */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-[#16202B] to-[#111820] border border-[#D9B36C]/30 text-xs text-[#93A3B5] space-y-2">
              <span className="font-semibold text-[#D9B36C] uppercase tracking-wider text-[10px]">
                Apresentação Comercial
              </span>
              <p className="text-[11px] leading-relaxed">
                Use este roteiro para demonstrações a clientes, conselhos de administração, comitês
                de sustentabilidade e auditorias externas.
              </p>
              <Link
                to="/planos"
                className="text-[#12B886] hover:underline font-semibold block text-[11px] pt-1"
              >
                Conhecer opções de assinatura corporativa →
              </Link>
            </div>
          </aside>

          {/* CONTEÚDO CENTRAL DA ETAPA ATIVA */}
          <main className="lg:col-span-8 space-y-6">
            {/* ========================================================================= */}
            {/* ETAPA 1: BOAS-VINDAS — O QUE O ORBIS PROTOCOL FAZ                         */}
            {/* ========================================================================= */}
            {etapaAtiva === 1 && (
              <div className="space-y-6 animate-in fade-in-50 duration-300">
                <div className="p-6 sm:p-8 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.12)] shadow-xl space-y-6">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#12B886]">
                    <Sparkles className="w-4 h-4" />
                    <span>Etapa 1 de 6 • Discurso Oficial e Proposta de Valor</span>
                  </div>

                  <h2 className="font-heading font-black text-2xl sm:text-3xl text-[#F4F7FA] tracking-wide">
                    A plataforma que transforma notas fiscais e dados operacionais em prova técnica
                  </h2>

                  <p className="text-base text-[#F4F7FA]/90 leading-relaxed">
                    O <strong>Orbis Protocol</strong> é a infraestrutura de auditoria e
                    rastreabilidade digital (dMRV) desenvolvida para a transição climática e
                    tributária brasileira. Nossa missão é simples e rigorosa:
                  </p>

                  {/* Citação do Discurso Oficial */}
                  <div className="p-5 rounded-xl bg-[#16202B] border-l-4 border-[#12B886] text-sm text-[#F4F7FA] leading-relaxed italic">
                    &ldquo;A Orbis é plataforma de auditoria e rastreabilidade; nossas entregas são
                    o cálculo da pegada de carbono, laudos periciais de descarbonização,
                    conformidade tributária e passaportes digitais de produto verificáveis —
                    facilitando o controle da sua empresa, com documentos prontos para envio aos
                    órgãos de controle, à sua contabilidade e a instituições financeiras.&rdquo;
                  </div>

                  {/* 4 Pilares Fundamentais */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div className="p-4 rounded-xl bg-[#0D1217] border border-[rgba(244,247,250,0.08)] space-y-2">
                      <div className="w-8 h-8 rounded-lg bg-[#12B886]/10 text-[#12B886] flex items-center justify-center font-bold">
                        1
                      </div>
                      <h3 className="text-sm font-bold text-[#F4F7FA]">
                        Pegada de Carbono Auditável
                      </h3>
                      <p className="text-xs text-[#93A3B5] leading-relaxed">
                        Ingestão direta de NF-e (mod. 55), CT-e (mod. 57), NF3e (mod. 66) e SPED com
                        segregação inequívoca entre parcelas fósseis e biogênicas (IPCC AR6).
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-[#0D1217] border border-[rgba(244,247,250,0.08)] space-y-2">
                      <div className="w-8 h-8 rounded-lg bg-[#D9B36C]/10 text-[#D9B36C] flex items-center justify-center font-bold">
                        2
                      </div>
                      <h3 className="text-sm font-bold text-[#F4F7FA]">
                        Conformidade & Reforma Tributária
                      </h3>
                      <p className="text-xs text-[#93A3B5] leading-relaxed">
                        Enquadramento automatizado sob a Lei 15.042/2024 (SBCE) e simulação do IVA
                        dual (IBS/CBS - LC 214/2025) com não cumulatividade plena de créditos
                        tributários.
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-[#0D1217] border border-[rgba(244,247,250,0.08)] space-y-2">
                      <div className="w-8 h-8 rounded-lg bg-[#12B886]/10 text-[#12B886] flex items-center justify-center font-bold">
                        3
                      </div>
                      <h3 className="text-sm font-bold text-[#F4F7FA]">
                        Rastreabilidade & Passaporte Digital
                      </h3>
                      <p className="text-xs text-[#93A3B5] leading-relaxed">
                        Selo e passaporte digital de produto (DPP) com ancoragem canônica SHA-256 e
                        QR code público para cada peça, lote veicular ou lote industrial auditado.
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-[#0D1217] border border-[rgba(244,247,250,0.08)] space-y-2">
                      <div className="w-8 h-8 rounded-lg bg-[#D9B36C]/10 text-[#D9B36C] flex items-center justify-center font-bold">
                        4
                      </div>
                      <h3 className="text-sm font-bold text-[#F4F7FA]">
                        Documentos Prontos para Envio
                      </h3>
                      <p className="text-xs text-[#93A3B5] leading-relaxed">
                        Relatórios técnicos estruturados em PDF para contabilidade, compliance
                        bancário (Green Capital) e fiscalizações regulatórias sem retrabalho manual.
                      </p>
                    </div>
                  </div>

                  {/* Nota de Governança e Transparência */}
                  <div className="p-4 rounded-xl bg-[#16202B]/60 border border-[rgba(244,247,250,0.08)] flex items-start gap-3 text-xs text-[#93A3B5]">
                    <ShieldCheck className="w-5 h-5 text-[#12B886] shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-[#F4F7FA]">Compromisso de Verdade Técnica:</strong> O
                      Orbis Protocol opera sob padrões internacionais de asseguração (ISAE 3000 /
                      NBC TO 3000). Créditos de carbono, quando aplicáveis, constituem potencial a
                      ser verificado e emitido por organismo validador independente (VVB) acreditado
                      segundo a metodologia técnica aplicável (como a GS 448).
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* ETAPA 2: CÁLCULO DA PEGADA DE CARBONO — MOTOR DE CÁLCULO                  */}
            {/* ========================================================================= */}
            {etapaAtiva === 2 && (
              <div className="space-y-6 animate-in fade-in-50 duration-300">
                <div className="p-6 sm:p-8 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.12)] shadow-xl space-y-6">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#12B886]">
                    <Calculator className="w-4 h-4" />
                    <span>Etapa 2 de 6 • Motor dMRV & Metodologia IPCC AR6</span>
                  </div>

                  <h2 className="font-heading font-black text-2xl sm:text-3xl text-[#F4F7FA] tracking-wide">
                    Motor de cálculo com segregação fóssil × biogênico
                  </h2>

                  <p className="text-sm text-[#93A3B5] leading-relaxed">
                    Diferente de calculadoras genéricas, o motor do Orbis Protocol segrega
                    estritamente o carbono fóssil (que impacta a atmosfera) do carbono biogênico
                    (ciclo natural de curto prazo, ex.: biodiesel B14 no diesel ou etanol na cana).
                    Isso garante conformidade com o GHG Protocol Brasil e impede riscos de
                    greenwashing em auditorias.
                  </p>

                  {/* Simulador Interativo do Motor */}
                  <div className="p-5 rounded-2xl bg-[#0D1217] border border-[#12B886]/30 space-y-5">
                    <div className="flex items-center justify-between border-b border-[rgba(244,247,250,0.08)] pb-3">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#12B886] flex items-center gap-2">
                        <BarChart3 className="w-4 h-4" />
                        Simulação Interativa do Motor em Tempo Real
                      </span>
                      <span className="text-[11px] font-mono text-[#D9B36C]">GWP100 AR6</span>
                    </div>

                    {/* Seleção de Combustível / Insumo */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <button
                        type="button"
                        onClick={() => {
                          setSimTipo('diesel')
                          setSimQtd(2150)
                        }}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          simTipo === 'diesel'
                            ? 'bg-[#12B886]/15 border-[#12B886] text-[#F4F7FA]'
                            : 'bg-[#111820] border-[rgba(244,247,250,0.08)] text-[#93A3B5] hover:border-[rgba(244,247,250,0.2)]'
                        }`}
                      >
                        <div className="text-xs font-bold text-[#F4F7FA]">Diesel B S10</div>
                        <div className="text-[11px] text-[#93A3B5]">Combustão Móvel Frota</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setSimTipo('etanol')
                          setSimQtd(1100)
                        }}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          simTipo === 'etanol'
                            ? 'bg-[#12B886]/15 border-[#12B886] text-[#F4F7FA]'
                            : 'bg-[#111820] border-[rgba(244,247,250,0.08)] text-[#93A3B5] hover:border-[rgba(244,247,250,0.2)]'
                        }`}
                      >
                        <div className="text-xs font-bold text-[#F4F7FA]">Etanol Hidratado</div>
                        <div className="text-[11px] text-[#93A3B5]">Biocombustível Flex</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setSimTipo('eletricidade')
                          setSimQtd(6420)
                        }}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          simTipo === 'eletricidade'
                            ? 'bg-[#12B886]/15 border-[#12B886] text-[#F4F7FA]'
                            : 'bg-[#111820] border-[rgba(244,247,250,0.08)] text-[#93A3B5] hover:border-[rgba(244,247,250,0.2)]'
                        }`}
                      >
                        <div className="text-xs font-bold text-[#F4F7FA]">Eletricidade (SIN)</div>
                        <div className="text-[11px] text-[#93A3B5]">Escopo 2 Concessionária</div>
                      </button>
                    </div>

                    {/* Campo de Quantidade */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-[#93A3B5] flex justify-between">
                        <span>Quantidade declarada no documento fiscal:</span>
                        <strong className="text-[#F4F7FA] font-mono">
                          {simQtd.toLocaleString('pt-BR')} {simResult.unidade.split(' ')[0]}
                        </strong>
                      </label>
                      <input
                        type="range"
                        min={100}
                        max={10000}
                        step={50}
                        value={simQtd}
                        onChange={(e) => setSimQtd(Number(e.target.value))}
                        className="w-full accent-[#12B886] cursor-pointer"
                      />
                    </div>

                    {/* Resultado da Segregação */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-[#111820] border border-[rgba(244,247,250,0.08)]">
                      <div className="space-y-1 border-b sm:border-b-0 sm:border-r border-[rgba(244,247,250,0.08)] pb-3 sm:pb-0 sm:pr-4">
                        <div className="text-[11px] uppercase tracking-wider font-bold text-[#F03E54] flex items-center gap-1.5">
                          <span>Emissão Fóssil (Escopo 1/2)</span>
                        </div>
                        <div className="text-2xl font-mono font-black text-[#F4F7FA]">
                          {simResult.fossilTon.toFixed(3)}{' '}
                          <span className="text-xs text-[#93A3B5] font-normal">tCO₂e</span>
                        </div>
                        <div className="text-xs text-[#93A3B5]">
                          {simResult.fossilKg.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}{' '}
                          kgCO₂e fóssil (computa no SBCE / limiares)
                        </div>
                      </div>

                      <div className="space-y-1 sm:pl-2">
                        <div className="text-[11px] uppercase tracking-wider font-bold text-[#12B886] flex items-center gap-1.5">
                          <span>Emissão Biogênica (Reporte Separado)</span>
                        </div>
                        <div className="text-2xl font-mono font-black text-[#12B886]">
                          {simResult.bioTon.toFixed(3)}{' '}
                          <span className="text-xs text-[#93A3B5] font-normal">tCO₂</span>
                        </div>
                        <div className="text-xs text-[#93A3B5]">
                          {simResult.bioKg.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}{' '}
                          kgCO₂ biogênico (ciclo neutro da biomassa)
                        </div>
                      </div>
                    </div>

                    {/* Metadados do Fator Oficial */}
                    <div className="text-xs text-[#93A3B5] space-y-1 font-mono pt-1">
                      <div>
                        Fator aplicado:{' '}
                        <strong className="text-[#F4F7FA]">{simResult.fatorTexto}</strong>
                      </div>
                      <div>
                        Fonte oficial: <span className="text-[#12B886]">{simResult.fonte}</span>
                      </div>
                      <div>
                        Tier de Incerteza: <span className="text-[#D9B36C]">{simResult.tier}</span>
                      </div>
                    </div>
                  </div>

                  {/* 15 Protocolos Setoriais */}
                  <div className="p-4 rounded-xl bg-[#16202B] border border-[rgba(244,247,250,0.08)] flex items-center justify-between gap-4">
                    <div className="text-xs text-[#93A3B5]">
                      O catálogo oficial do Orbis integra{' '}
                      <strong className="text-[#F4F7FA]">
                        15 Protocolos Setoriais homologados
                      </strong>
                      , cobrindo transporte, química, cimento, agropecuária, papel & celulose e
                      desmontagem veicular.
                    </div>
                    <Link
                      to="/fatores"
                      className="text-xs font-semibold text-[#12B886] hover:underline shrink-0 flex items-center gap-1"
                    >
                      <span>Ver Catálogo de Fatores</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* ETAPA 3: LAUDOS PERICIAIS E CONFORMIDADE TRIBUTÁRIA                       */}
            {/* ========================================================================= */}
            {etapaAtiva === 3 && (
              <div className="space-y-6 animate-in fade-in-50 duration-300">
                <div className="p-6 sm:p-8 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.12)] shadow-xl space-y-6">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#12B886]">
                    <Scale className="w-4 h-4" />
                    <span>Etapa 3 de 6 • Reforma Tributária & SBCE (Lei 15.042/2024)</span>
                  </div>

                  <h2 className="font-heading font-black text-2xl sm:text-3xl text-[#F4F7FA] tracking-wide">
                    Dossiê com 12 notas fiscais e enquadramento legal
                  </h2>

                  <p className="text-sm text-[#93A3B5] leading-relaxed">
                    Veja como a plataforma processa um lote completo de 12 documentos fiscais de uma
                    empresa industrial (
                    <strong className="text-[#F4F7FA]">
                      {DOSSIE_DEFAULT_FALLBACK.razaoSocial}
                    </strong>
                    , CNPJ {DOSSIE_DEFAULT_FALLBACK.cnpj}). A plataforma classifica cada item e
                    calcula automaticamente os limites do SBCE e os créditos do IVA dual.
                  </p>

                  {/* Resumo do Dossiê */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl bg-[#0D1217] border border-[rgba(244,247,250,0.08)]">
                      <div className="text-[11px] text-[#93A3B5] uppercase font-bold">
                        Emissões Totais Consolidadas
                      </div>
                      <div className="text-xl font-mono font-black text-[#12B886] mt-1">
                        1.420,3 <span className="text-xs text-[#93A3B5]">tCO₂e/ano</span>
                      </div>
                      <div className="text-[11px] text-[#93A3B5] mt-1">
                        Escopo 1 (480,2t) • Escopo 2 (310,6t) • Escopo 3 (629,5t)
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-[#0D1217] border border-[rgba(244,247,250,0.08)]">
                      <div className="text-[11px] text-[#93A3B5] uppercase font-bold">
                        Enquadramento SBCE
                      </div>
                      <div className="text-base font-bold text-[#D9B36C] mt-1">
                        Abaixo do Limiar Obrigatório
                      </div>
                      <div className="text-[11px] text-[#93A3B5] mt-1">
                        &lt; 10.000 tCO₂e (Isento de monitoramento forçado pela Lei 15.042/2024)
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-[#0D1217] border border-[rgba(244,247,250,0.08)]">
                      <div className="text-[11px] text-[#93A3B5] uppercase font-bold">
                        Incentivo Tributário (IVA Dual)
                      </div>
                      <div className="text-base font-bold text-[#12B886] mt-1">
                        Não Cumulatividade Plena
                      </div>
                      <div className="text-[11px] text-[#93A3B5] mt-1">
                        Aproveitamento de créditos de IBS e CBS sobre energia, combustíveis e
                        insumos
                      </div>
                    </div>
                  </div>

                  {/* Amostra das 12 Notas Fiscais Demonstrativas */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#F4F7FA] flex items-center gap-1.5">
                        <FileCode2 className="w-4 h-4 text-[#12B886]" />
                        Amostra Auditada (10 Modelos Fiscais SEFAZ)
                      </span>
                      <span className="text-xs text-[#93A3B5] font-mono">12 Documentos</span>
                    </div>

                    <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                      {NOTAS_DEFAULT_FALLBACK.slice(0, 6).map((nota) => (
                        <div
                          key={nota.id}
                          className="p-3 rounded-xl bg-[#0D1217] border border-[rgba(244,247,250,0.06)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                        >
                          <div className="space-y-0.5">
                            <div className="font-bold text-[#F4F7FA] flex items-center gap-2">
                              <span>{nota.titulo}</span>
                              <span className="px-1.5 py-0.5 rounded bg-[#16202B] text-[10px] font-mono text-[#D9B36C]">
                                {nota.modeloFormatado}
                              </span>
                            </div>
                            <div className="text-[11px] text-[#93A3B5]">
                              {nota.razaoSocialParceiro} • Doc: {nota.numeroDocumento} • Qtd:{' '}
                              {nota.quantidadeDeclarada}
                            </div>
                          </div>

                          <div className="flex items-center gap-4 shrink-0 font-mono text-right">
                            <div>
                              <div className="text-[#F03E54] font-semibold">
                                {nota.fossilKgCo2e.toLocaleString('pt-BR')} kg
                              </div>
                              <div className="text-[10px] text-[#93A3B5]">Fóssil</div>
                            </div>
                            {nota.biogenicoKgCo2 > 0 && (
                              <div>
                                <div className="text-[#12B886] font-semibold">
                                  {nota.biogenicoKgCo2.toLocaleString('pt-BR')} kg
                                </div>
                                <div className="text-[10px] text-[#93A3B5]">Biogênico</div>
                              </div>
                            )}
                            <div className="px-2 py-1 rounded bg-[#12B886]/10 text-[#12B886] font-sans font-bold text-[10px]">
                              {nota.tierIncerteza}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Hash de Integridade Pericial */}
                  <div className="p-4 rounded-xl bg-[#16202B] border border-[rgba(244,247,250,0.08)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div>
                      <div className="text-[11px] uppercase tracking-wider text-[#93A3B5] font-semibold">
                        Hash SHA-256 de Fechamento de Competência
                      </div>
                      <div className="font-mono text-[#D9B36C] break-all text-[11px] mt-0.5">
                        {DOSSIE_DEFAULT_FALLBACK.hashFechamentoCompetencia}
                      </div>
                    </div>
                    <Link
                      to="/corporativo"
                      className="inline-flex items-center gap-1 text-[#12B886] hover:underline font-semibold shrink-0"
                    >
                      <span>Ver Tour Corporativo Completo</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* ETAPA 4: RASTREABILIDADE VEICULAR (CDV / MOVER)                            */}
            {/* ========================================================================= */}
            {etapaAtiva === 4 && (
              <div className="space-y-6 animate-in fade-in-50 duration-300">
                <div className="p-6 sm:p-8 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.12)] shadow-xl space-y-6">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#12B886]">
                    <Car className="w-4 h-4" />
                    <span>Etapa 4 de 6 • Rastreabilidade Veicular & Programa MOVER</span>
                  </div>

                  <h2 className="font-heading font-black text-2xl sm:text-3xl text-[#F4F7FA] tracking-wide">
                    Lote demo Renault Clio com selo DPP e 77 peças
                  </h2>

                  <p className="text-sm text-[#93A3B5] leading-relaxed">
                    O Orbis Protocol é pioneiro na tokenização probatória de centros de desmontagem
                    veicular (CDVs credenciados). Abaixo, você confere o lote real de demonstração
                    rastreado sob a baixa DETRAN{' '}
                    <strong className="text-[#12B886]">PR-BX-2026-1240105</strong>, com suas 77
                    peças divididas entre o rol oficial do CONTRAN 611 e os novos componentes do
                    Programa MOVER.
                  </p>

                  {/* Cartão do Lote Demo Clio */}
                  {loadingClio ? (
                    <div className="p-8 rounded-xl bg-[#0D1217] text-center text-xs text-[#93A3B5] flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-[#12B886]" />
                      <span>Carregando metadados do lote Renault Clio...</span>
                    </div>
                  ) : loteClio ? (
                    <div className="p-5 rounded-2xl bg-[#0D1217] border border-[#12B886]/30 space-y-5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[rgba(244,247,250,0.08)]">
                        <div>
                          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-[#12B886]/15 text-[#12B886] text-[10px] font-bold uppercase tracking-wider mb-1">
                            <span>Lote de Demonstração Homologado</span>
                            <span>•</span>
                            <span>CNPJ 76.123.456/0001-00</span>
                          </div>
                          <h3 className="font-heading font-bold text-lg text-[#F4F7FA]">
                            {loteClio.veiculo_marca_modelo}
                          </h3>
                          <div className="text-xs text-[#93A3B5] font-mono mt-1">
                            Baixa DETRAN: {loteClio.veiculo_baixa_detran} • Placa:{' '}
                            {loteClio.veiculo_placa} • Cartela: {loteClio.cartela_desmontagem}
                          </div>
                        </div>

                        {/* QR Code Real do Passaporte do Lote */}
                        <div className="flex items-center gap-3 shrink-0 p-2.5 rounded-xl bg-[#111820] border border-[rgba(244,247,250,0.1)]">
                          <QRCodeSVG
                            value={`${typeof window !== 'undefined' ? window.location.origin : ''}/passaporte-lote/${loteClio.veiculo_baixa_detran}`}
                            size={56}
                          />
                          <div className="text-left text-[11px] font-mono">
                            <div className="text-[#D9B36C] font-bold">SELO DPP</div>
                            <div className="text-[10px] text-[#93A3B5]">SHA-256 Canônico</div>
                            <Link
                              to={`/passaporte-lote/${loteClio.veiculo_baixa_detran}`}
                              target="_blank"
                              className="text-[10px] text-[#12B886] hover:underline flex items-center gap-0.5 mt-0.5 font-sans"
                            >
                              <span>Abrir passaporte</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </Link>
                          </div>
                        </div>
                      </div>

                      {/* KPIs do Lote */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                        <div className="p-3 rounded-xl bg-[#111820]">
                          <div className="text-[10px] uppercase font-bold text-[#93A3B5]">
                            Peças Rastreáveis
                          </div>
                          <div className="text-lg font-mono font-black text-[#12B886]">
                            {loteClio.total_pecas || 77}
                          </div>
                          <div className="text-[10px] text-[#93A3B5]">49 CONTRAN + 28 MOVER</div>
                        </div>

                        <div className="p-3 rounded-xl bg-[#111820]">
                          <div className="text-[10px] uppercase font-bold text-[#93A3B5]">
                            Massa Reutilizável
                          </div>
                          <div className="text-lg font-mono font-black text-[#F4F7FA]">
                            {loteClio.total_peso_kg || 437.7} kg
                          </div>
                          <div className="text-[10px] text-[#93A3B5]">
                            Aço, Alumínio e Polímeros
                          </div>
                        </div>

                        <div className="p-3 rounded-xl bg-[#111820]">
                          <div className="text-[10px] uppercase font-bold text-[#93A3B5]">
                            CO₂e Evitado
                          </div>
                          <div className="text-lg font-mono font-black text-[#12B886]">
                            {loteClio.total_co2e_evitado_kg
                              ? (loteClio.total_co2e_evitado_kg / 1000).toFixed(2)
                              : '1,58'}{' '}
                            t
                          </div>
                          <div className="text-[10px] text-[#93A3B5]">Substituição de Virgem</div>
                        </div>

                        <div className="p-3 rounded-xl bg-[#111820]">
                          <div className="text-[10px] uppercase font-bold text-[#93A3B5]">
                            Status Probatório
                          </div>
                          <div className="text-xs font-bold text-[#D9B36C] mt-1">
                            DETRAN Homologado
                          </div>
                          <div className="text-[10px] text-[#93A3B5]">CTF-IBAMA 6812490</div>
                        </div>
                      </div>

                      {/* Duas Abas de Peças: CONTRAN 611 e MOVER */}
                      <div className="space-y-3 pt-2">
                        <div className="flex items-center justify-between border-b border-[rgba(244,247,250,0.08)] pb-2">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setAbaPecas('611')}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                abaPecas === '611'
                                  ? 'bg-[#12B886] text-[#0A0E12]'
                                  : 'bg-[#111820] text-[#93A3B5] hover:text-[#F4F7FA]'
                              }`}
                            >
                              Aba 1: Peças CONTRAN 611 (49 itens)
                            </button>
                            <button
                              type="button"
                              onClick={() => setAbaPecas('mover')}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                abaPecas === 'mover'
                                  ? 'bg-[#D9B36C] text-[#0A0E12]'
                                  : 'bg-[#111820] text-[#93A3B5] hover:text-[#F4F7FA]'
                              }`}
                            >
                              Aba 2: Rol Ampliado MOVER (28 itens)
                            </button>
                          </div>
                          <span className="text-xs text-[#93A3B5] font-mono">
                            {abaPecas === '611' ? pecas611.length : pecasMover.length} peças
                          </span>
                        </div>

                        {/* Lista com scroll das peças */}
                        <div className="space-y-1.5 max-h-[260px] overflow-y-auto pr-1">
                          {(abaPecas === '611' ? pecas611 : pecasMover)
                            .slice(0, 8)
                            .map((p, idx) => (
                              <div
                                key={p.id || idx}
                                className="p-2.5 rounded-lg bg-[#111820] border border-[rgba(244,247,250,0.05)] flex items-center justify-between text-xs font-mono"
                              >
                                <div className="flex items-center gap-2.5 truncate">
                                  <span className="text-[#12B886] font-bold">
                                    #{p.catalogo_numero || idx + 1}
                                  </span>
                                  <span className="text-[#F4F7FA] font-sans font-medium truncate">
                                    {p.descricao_peca}
                                  </span>
                                  <span className="text-[10px] text-[#93A3B5] hidden sm:inline">
                                    ({p.categoria_material || 'aço'})
                                  </span>
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                  <span className="text-[#93A3B5]">{p.peso_kg || 2.5} kg</span>
                                  <span className="text-[#12B886] font-semibold">
                                    {p.co2e_evitado_kg ? p.co2e_evitado_kg.toFixed(2) : '3.80'}{' '}
                                    kgCO₂e
                                  </span>
                                  <span className="px-1.5 py-0.5 rounded bg-[#16202B] text-[10px] text-[#D9B36C]">
                                    {p.selo_dpp || 'DPP-CLIO-OK'}
                                  </span>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>

                      {/* Seção de Avaliação de Adicionalidade (Art. 7º Lei 15.042/2024) */}
                      <div className="pt-3 border-t border-[rgba(244,247,250,0.08)]">
                        <SecaoAvaliacaoAdicionalidade
                          loteId={loteClio.id}
                          forceExibir={true}
                          readOnly={true}
                        />
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* ETAPA 5: DOCUMENTOS PRONTOS PARA ENVIO                                    */}
            {/* ========================================================================= */}
            {etapaAtiva === 5 && (
              <div className="space-y-6 animate-in fade-in-50 duration-300">
                <div className="p-6 sm:p-8 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.12)] shadow-xl space-y-6">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#12B886]">
                    <FileText className="w-4 h-4" />
                    <span>Etapa 5 de 6 • Entregáveis & Compliance Estruturado</span>
                  </div>

                  <h2 className="font-heading font-black text-2xl sm:text-3xl text-[#F4F7FA] tracking-wide">
                    Documentos prontos para envio a órgãos de controle, contabilidade e bancos
                  </h2>

                  <p className="text-sm text-[#93A3B5] leading-relaxed">
                    O maior gargalo das empresas não é calcular emissões, mas comprovar os números
                    perante auditores, agentes fiscais e gerentes de crédito bancário. Os relatórios
                    do Orbis Protocol são gerados com assinatura pericial, hash SHA-256 e padrão
                    contábil auditável.
                  </p>

                  {/* 3 Entregáveis Principais */}
                  <div className="space-y-4">
                    <div className="p-5 rounded-xl bg-[#0D1217] border border-[rgba(244,247,250,0.08)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs font-bold text-[#12B886] uppercase tracking-wider">
                          <CheckCircle2 className="w-4 h-4 text-[#12B886]" />
                          <span>Para Órgãos de Controle & Fiscalização Ambiental</span>
                        </div>
                        <h3 className="text-base font-bold text-[#F4F7FA]">
                          Laudo Pericial de Descarbonização (Dossier dMRV)
                        </h3>
                        <p className="text-xs text-[#93A3B5] max-w-xl">
                          Inventário completo com memória de cálculo, fatores MCTI/IPCC, registro de
                          ART e hash canônico para comprovação no SBCE e órgãos estaduais.
                        </p>
                      </div>

                      <div className="shrink-0">
                        <Link
                          to="/corporativo"
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[#16202B] border border-[#12B886]/40 text-[#12B886] hover:bg-[#12B886] hover:text-[#0A0E12] transition-all"
                        >
                          <span>Visualizar Modelo</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>

                    <div className="p-5 rounded-xl bg-[#0D1217] border border-[rgba(244,247,250,0.08)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs font-bold text-[#D9B36C] uppercase tracking-wider">
                          <CheckCircle2 className="w-4 h-4 text-[#D9B36C]" />
                          <span>Para sua Contabilidade & Auditoria Externa (CRC / Big Four)</span>
                        </div>
                        <h3 className="text-base font-bold text-[#F4F7FA]">
                          Dossiê de Fechamento de Competência & SPED
                        </h3>
                        <p className="text-xs text-[#93A3B5] max-w-xl">
                          Demonstrativo de conciliação fiscal entre o SPED Fiscal / EFD
                          Contribuições e as notas de despesa operacional, com trilha probatória
                          ISAE 3000.
                        </p>
                      </div>

                      <div className="shrink-0">
                        <Link
                          to="/solucoes/portal-corporativo"
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[#16202B] border border-[#D9B36C]/40 text-[#D9B36C] hover:bg-[#D9B36C] hover:text-[#0A0E12] transition-all"
                        >
                          <span>Ver Portal IFRS</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>

                    <div className="p-5 rounded-xl bg-[#0D1217] border border-[rgba(244,247,250,0.08)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs font-bold text-[#12B886] uppercase tracking-wider">
                          <CheckCircle2 className="w-4 h-4 text-[#12B886]" />
                          <span>Para Instituições Financeiras & Linhas Verdes</span>
                        </div>
                        <h3 className="text-base font-bold text-[#F4F7FA]">
                          Parecer Green Capital Engine (8 Linhas de Crédito)
                        </h3>
                        <p className="text-xs text-[#93A3B5] max-w-xl">
                          Simulação e dossiê de elegibilidade técnica para redução de spread em
                          linhas ESG do BNDES, Pronaf Verde e Financiamento Sustentável.
                        </p>
                      </div>

                      <div className="shrink-0">
                        <Link
                          to="/capital"
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[#16202B] border border-[#12B886]/40 text-[#12B886] hover:bg-[#12B886] hover:text-[#0A0E12] transition-all"
                        >
                          <span>Simular Linhas</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  </div>

                  {/* Verificador Público de Autenticidade */}
                  <div className="p-4 rounded-xl bg-[#16202B] border border-[rgba(244,247,250,0.08)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3">
                      <QrCode className="w-6 h-6 text-[#12B886] shrink-0" />
                      <div>
                        <strong className="text-[#F4F7FA]">
                          Verificador Público 100% Gratuito:
                        </strong>{' '}
                        Qualquer auditor, fiscal ou parceiro comercial pode validar um laudo gerado
                        pela Orbis digitando seu hash ou escaneando o QR code no /verificador.
                      </div>
                    </div>
                    <Link
                      to="/verificador"
                      className="text-[#12B886] hover:underline font-semibold shrink-0"
                    >
                      Acessar Verificador →
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* ETAPA 6: ENCERRAMENTO COM CTA 'INICIAR DIAGNÓSTICO' E LINK /PLANOS        */}
            {/* ========================================================================= */}
            {etapaAtiva === 6 && (
              <div className="space-y-6 animate-in fade-in-50 duration-300">
                <div className="p-6 sm:p-10 rounded-2xl bg-gradient-to-br from-[#111820] via-[#16202B] to-[#0D1217] border-2 border-[#12B886] shadow-2xl space-y-8 text-center sm:text-left">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#12B886]/20 text-[#12B886] text-xs font-bold uppercase tracking-wider mx-auto sm:mx-0">
                    <BadgeCheck className="w-4 h-4" />
                    <span>Demonstração Concluída com Sucesso</span>
                  </div>

                  <div className="space-y-3">
                    <h2 className="font-heading font-black text-2xl sm:text-4xl text-[#F4F7FA] tracking-wide">
                      Pronto para colocar sua empresa em conformidade climática e tributária?
                    </h2>
                    <p className="text-base text-[#93A3B5] max-w-2xl leading-relaxed">
                      Você conheceu a esteira do Orbis Protocol: do upload de notas fiscais ao laudo
                      pericial pronto para bancos e órgãos de controle. Agora, dê o próximo passo
                      com o CNPJ real da sua organização.
                    </p>
                  </div>

                  {/* Dois CTAs Principais */}
                  <div className="flex flex-col sm:flex-row items-center gap-4 pt-2 justify-center sm:justify-start">
                    <Link
                      to="/diagnostico"
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-sm font-extrabold bg-[#12B886] text-[#0A0E12] hover:bg-[#0CA678] hover:scale-[1.02] transition-all shadow-emerald-glow"
                    >
                      <span>Iniciar Diagnóstico</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>

                    <Link
                      to="/planos"
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-sm font-bold bg-[#111820] border-2 border-[#D9B36C] text-[#D9B36C] hover:bg-[#D9B36C] hover:text-[#0A0E12] transition-all"
                    >
                      <span>Ver Planos & Tabela de Preços</span>
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>

                  {/* Resumo de Garantias Comerciais */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-[rgba(244,247,250,0.08)] text-left text-xs text-[#93A3B5]">
                    <div className="space-y-1">
                      <div className="font-bold text-[#F4F7FA]">Sem Compromisso Inicial</div>
                      <p className="text-[11px] leading-relaxed">
                        O diagnóstico inicial de enquadramento SBCE e impacto do IVA dual é 100%
                        gratuito.
                      </p>
                    </div>

                    <div className="space-y-1">
                      <div className="font-bold text-[#F4F7FA]">Emissão de Nota Fiscal & PIX</div>
                      <p className="text-[11px] leading-relaxed">
                        Contratação direta via PIX com NFS-e emitida pela prefeitura e ativação
                        imediata.
                      </p>
                    </div>

                    <div className="space-y-1">
                      <div className="font-bold text-[#F4F7FA]">Apoio Especializado</div>
                      <p className="text-[11px] leading-relaxed">
                        Rede de peritos credenciados (CREA/CRC/CRQ) para laudos assinados com ART.
                      </p>
                    </div>
                  </div>

                  {/* Reiniciar Tour */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => irParaEtapa(1)}
                      className="text-xs text-[#93A3B5] hover:text-[#12B886] underline transition-colors"
                    >
                      ↺ Rever a demonstração desde o início
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* BOTÕES DE NAVEGAÇÃO INFERIORES */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-[#111820] border border-[rgba(244,247,250,0.08)]">
              <button
                type="button"
                disabled={etapaAtiva === 1}
                onClick={() => irParaEtapa(etapaAtiva - 1)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium text-[#93A3B5] hover:text-[#F4F7FA] hover:bg-[#16202B] disabled:opacity-30 disabled:pointer-events-none transition-all"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Etapa anterior</span>
              </button>

              <span className="text-xs text-[#93A3B5] hidden sm:inline">
                Etapa <strong className="text-[#12B886]">{etapaAtiva}</strong> de {ETAPAS.length}
              </span>

              {etapaAtiva < ETAPAS.length ? (
                <button
                  type="button"
                  onClick={() => irParaEtapa(etapaAtiva + 1)}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-bold bg-[#12B886] text-[#0A0E12] hover:bg-[#0CA678] transition-all shadow-emerald-glow"
                >
                  <span>Próxima etapa</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <Link
                  to="/diagnostico"
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-bold bg-[#12B886] text-[#0A0E12] hover:bg-[#0CA678] transition-all shadow-emerald-glow"
                >
                  <span>Iniciar Diagnóstico</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
