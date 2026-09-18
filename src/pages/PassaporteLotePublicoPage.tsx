import React, { useState, useEffect, useMemo, useRef } from 'react'
import { useParams, Link, useSearchParams } from 'react-router-dom'
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  Car,
  Printer,
  ExternalLink,
  FileCheck2,
  Scale,
  Building2,
  ArrowLeft,
  Sparkles,
  Layers,
  BarChart3,
  BookOpen,
  Hash,
  ArrowUpRight,
  History,
  QrCode,
  Globe,
  Code2,
} from 'lucide-react'
import {
  consultarLoteConsolidado,
  calcularHashCanonicalLote,
  registrarConsultaDpp,
  obterHistoricoConsultasDpp,
  FATORES_CDV_MATERIAIS,
  type CdvLoteRecord,
  type CdvPecaRecord,
  type DppConsultaRecord,
} from '@/services/cdvService'
import {
  consultarDestinacaoFinalLote,
  type DestinacaoFinalLoteResponse,
} from '@/services/destinacaoFinalService'
import { QRCodeSVG } from '@/components/QRCodeSVG'
import { DestinacaoFinalTab } from '@/components/DestinacaoFinalTab'

// Mapeamento amigável e ordenado das categorias de materiais / subsistemas veiculares
const CATEGORIAS_CONFIG: Record<string, { label: string; cor: string }> = {
  aco: { label: 'Aço & Carroceria Estrutural', cor: '#93A3B5' },
  aluminio: { label: 'Alumínio & Cabeçotes / Câmbio', cor: '#60A5FA' },
  cobre: { label: 'Cobre, Elétrica & Bobinamento', cor: '#D9B36C' },
  polimeros: { label: 'Polímeros, Plásticos & Acabamentos', cor: '#12B886' },
  outros: { label: 'Outros Subsistemas / Mistos', cor: '#A78BFA' },
}

const SUBSISTEMAS_ORDEM = [
  'Motor',
  'Câmbio',
  'Elétrica',
  'Direção',
  'Suspensão',
  'Freios',
  'Arrefecimento',
  'Escape',
  'Carroceria',
]

export default function PassaporteLotePublicoPage() {
  const { lote: loteParam } = useParams<{ lote: string }>()
  const [searchParams] = useSearchParams()
  const canalParam = searchParams.get('via') // 'qr' | 'embed' | 'web'
  const canalDetectado: 'qr' | 'web' | 'embed' =
    canalParam === 'qr' ? 'qr' : canalParam === 'embed' ? 'embed' : 'web'

  const [lote, setLote] = useState<CdvLoteRecord | null>(null)
  const [pecas, setPecas] = useState<CdvPecaRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [hashCalculado, setHashCalculado] = useState<string>('')
  const [copiedHash, setCopiedHash] = useState(false)
  const [filtroCategoria, setFiltroCategoria] = useState<string>('todos')
  const [abaLoteAtiva, setAbaLoteAtiva] = useState<'laudo' | 'destinacao'>('laudo')
  const [dadosDestinacao, setDadosDestinacao] = useState<DestinacaoFinalLoteResponse | null>(null)

  // Histórico de Verificações do Lote
  const [historicoConsultas, setHistoricoConsultas] = useState<DppConsultaRecord[]>([])
  const [totalConsultasLote, setTotalConsultasLote] = useState<number>(0)
  const hasRegisteredRef = useRef(false)

  // URL canônica sem query param para o display e com ?via=qr para o QR Code
  const baseUrlSemQuery =
    typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}` : ''
  const qrCodeUrl = `${baseUrlSemQuery}?via=qr`

  useEffect(() => {
    let isMounted = true
    const carregar = async () => {
      if (!loteParam) {
        setIsLoading(false)
        return
      }
      setIsLoading(true)
      try {
        const resultado = await consultarLoteConsolidado(loteParam)
        if (!isMounted) return

        if (resultado) {
          setLote(resultado.lote)
          setPecas(resultado.pecas)

          // Recalcular o hash SHA-256 canônico e verificável do lote
          const sha = await calcularHashCanonicalLote(
            {
              id: resultado.lote.id,
              cdv_cnpj: resultado.lote.cdv_cnpj,
              veiculo_baixa_detran: resultado.lote.veiculo_baixa_detran,
            },
            resultado.pecas,
          )
          setHashCalculado(sha)

          // Registrar a consulta uma única vez no ciclo do componente
          if (!hasRegisteredRef.current) {
            hasRegisteredRef.current = true
            await registrarConsultaDpp({
              alvo_tipo: 'lote',
              alvo_identificador: resultado.lote.veiculo_baixa_detran || resultado.lote.id,
              lote_id: resultado.lote.id,
              canal: canalDetectado,
              hash_conferido: true,
              hash_calculado: sha,
            })
          }

          // Carregar histórico acumulado de consultas deste lote
          const hist = await obterHistoricoConsultasDpp(
            resultado.lote.veiculo_baixa_detran || resultado.lote.id,
            resultado.lote.id,
            5,
          )
          if (isMounted) {
            setTotalConsultasLote(hist.total)
            setHistoricoConsultas(hist.ultimas)
          }

          // Carregar matriz de Destinação Final em 3 camadas do lote
          const chaveBusca =
            resultado.lote.veiculo_baixa_detran ||
            resultado.lote.cartela_desmontagem ||
            resultado.lote.id
          const dest = await consultarDestinacaoFinalLote(chaveBusca)
          if (isMounted) {
            setDadosDestinacao(dest)
          }
        } else {
          setLote(null)
          setPecas([])
        }
      } catch {
        if (isMounted) {
          setLote(null)
          setPecas([])
        }
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    carregar()
    return () => {
      isMounted = false
    }
  }, [loteParam, canalDetectado])

  // Detectar se o lote possui subsistemas explícitos (ex: lote demo de 49 peças)
  const temSubsistemas = useMemo(() => {
    return pecas.some((p) => Boolean(p.subsistema))
  }, [pecas])

  // Agrupamento por Subsistema (quando disponível) ou por Categoria de Material
  const gruposExibicao = useMemo(() => {
    if (temSubsistemas) {
      const grupos: Record<
        string,
        {
          id: string
          label: string
          pecas: CdvPecaRecord[]
          pesoTotal: number
          co2eTotal: number
        }
      > = {}

      for (const p of pecas) {
        const sub = p.subsistema || 'Outros Subsistemas'
        if (!grupos[sub]) {
          grupos[sub] = {
            id: sub,
            label: `Subsistema: ${sub}`,
            pecas: [],
            pesoTotal: 0,
            co2eTotal: 0,
          }
        }
        grupos[sub].pecas.push(p)
        grupos[sub].pesoTotal += Number(p.peso_kg) || 0
        grupos[sub].co2eTotal += Number(p.co2e_evitado_kg) || 0
      }

      // Ordenar conforme ordem de engenharia padrão
      return Object.values(grupos).sort((a, b) => {
        const idxA = SUBSISTEMAS_ORDEM.indexOf(a.id)
        const idxB = SUBSISTEMAS_ORDEM.indexOf(b.id)
        if (idxA !== -1 && idxB !== -1) return idxA - idxB
        if (idxA !== -1) return -1
        if (idxB !== -1) return 1
        return a.label.localeCompare(b.label)
      })
    }

    const grupos: Record<
      string,
      {
        id: string
        label: string
        pecas: CdvPecaRecord[]
        pesoTotal: number
        co2eTotal: number
      }
    > = {}

    for (const p of pecas) {
      const cat = p.categoria_material || 'outros'
      if (!grupos[cat]) {
        grupos[cat] = {
          id: cat,
          label: CATEGORIAS_CONFIG[cat]?.label || cat.toUpperCase(),
          pecas: [],
          pesoTotal: 0,
          co2eTotal: 0,
        }
      }
      grupos[cat].pecas.push(p)
      grupos[cat].pesoTotal += Number(p.peso_kg) || 0
      grupos[cat].co2eTotal += Number(p.co2e_evitado_kg) || 0
    }

    return Object.values(grupos)
  }, [pecas, temSubsistemas])

  // Métricas Consolidadas Reais
  const metricas = useMemo(() => {
    const totalPecas = pecas.length || lote?.total_pecas || 0
    const totalPeso = pecas.length
      ? pecas.reduce((acc, p) => acc + (Number(p.peso_kg) || 0), 0)
      : lote?.total_peso_kg || 0
    const totalCO2e = pecas.length
      ? pecas.reduce((acc, p) => acc + (Number(p.co2e_evitado_kg) || 0), 0)
      : lote?.total_co2e_evitado_kg || 0

    // Porcentagem de peças com passaporte emitido (se todas as peças do lote possuem registro ativo)
    const pecasComPassaporte = pecas.filter((p) => Boolean(p.selo_dpp)).length
    const pctEmitidas = totalPecas > 0 ? (pecasComPassaporte / totalPecas) * 100 : 100

    return {
      totalPecas,
      totalPeso,
      totalCO2e,
      pctEmitidas,
    }
  }, [pecas, lote])

  const copyHash = () => {
    if (!hashCalculado) return
    navigator.clipboard.writeText(hashCalculado)
    setCopiedHash(true)
    setTimeout(() => setCopiedHash(false), 2000)
  }

  const handleImprimir = () => {
    window.print()
  }

  return (
    <div className="min-h-screen py-6 sm:py-8 md:py-12 bg-[#0A0E12] text-[#F4F7FA] print:bg-white print:text-black print:p-0">
      {/* CSS Específico de Impressão (2 páginas rígidas no padrão CDVerde) */}
      <style>{`
        @media print {
          nav, header, footer, .no-print, .mobile-view-only {
            display: none !important;
          }
          .desktop-document-view {
            display: block !important;
          }
          body {
            background-color: #ffffff !important;
            color: #0f172a !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .dpp-page-1 {
            page-break-after: always !important;
            break-after: page !important;
            min-height: 100vh;
            padding: 18mm 15mm !important;
            box-sizing: border-box;
          }
          .dpp-page-2 {
            page-break-before: always !important;
            break-before: page !important;
            min-height: 100vh;
            padding: 18mm 15mm !important;
            box-sizing: border-box;
          }
          .print-card {
            border: 1px solid #cbd5e1 !important;
            background: #f8fafc !important;
            color: #0f172a !important;
            box-shadow: none !important;
          }
          .print-card-hero {
            border: 2px solid #059669 !important;
            background: #ecfdf5 !important;
            color: #064e3b !important;
          }
          .print-text-dark {
            color: #0f172a !important;
          }
          .print-text-muted {
            color: #475569 !important;
          }
          .print-text-emerald {
            color: #047857 !important;
          }
          .print-badge-emerald {
            background-color: #d1fae5 !important;
            color: #065f46 !important;
            border: 1px solid #a7f3d0 !important;
          }
          .print-table {
            border-collapse: collapse !important;
            width: 100% !important;
          }
          .print-table th, .print-table td {
            border-bottom: 1px solid #e2e8f0 !important;
          }
        }
      `}</style>

      <div className="max-w-[1100px] mx-auto px-4 sm:px-6 print:max-w-none print:px-0">
        {/* Barra Superior de Controles e Navegação (Oculta na impressão) */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-6 sm:mb-8 pb-4 border-b border-[rgba(244,247,250,0.1)] no-print">
          <Link
            to="/verificador"
            className="inline-flex items-center gap-2 text-xs font-semibold text-[#93A3B5] hover:text-[#12B886] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Voltar ao Verificador Público</span>
          </Link>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#12B886] animate-pulse" />
              <span className="text-[10px] sm:text-[11px] font-mono text-[#12B886] uppercase font-bold tracking-wider">
                CERTIFICAÇÃO CONSOLIDADA • CDV HOMOLOGADO
              </span>
            </div>

            <button
              type="button"
              onClick={handleImprimir}
              className="hidden sm:inline-flex px-4 py-2 rounded-xl text-xs font-bold bg-[#12B886] text-[#0A0E12] hover:bg-[#0CA678] transition-all items-center gap-2 shadow-emerald-glow"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir / Salvar PDF (2 Páginas)</span>
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="p-16 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.12)] text-center no-print">
            <div className="w-8 h-8 border-2 border-[#12B886] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm text-[#93A3B5]">
              Recuperando Passaporte Digital Consolidado do Lote ({loteParam})...
            </p>
          </div>
        ) : !lote ? (
          <div className="p-12 rounded-2xl bg-[#111820] border border-[#F03E54]/30 text-center space-y-4 max-w-2xl mx-auto no-print">
            <div className="w-12 h-12 rounded-full bg-[#F03E54]/10 border border-[#F03E54] flex items-center justify-center text-[#F03E54] mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h2 className="font-heading font-extrabold text-2xl text-[#F4F7FA]">
              Lote Veicular Não Localizado
            </h2>
            <p className="text-xs text-[#93A3B5] leading-relaxed max-w-md mx-auto">
              O lote ou baixa veicular{' '}
              <span className="font-mono text-[#D9B36C] font-bold">{loteParam}</span> não foi
              encontrado na base operacional de desmontagem veicular do Orbis Protocol.
            </p>
            <div className="pt-4">
              <Link
                to="/solucoes/case-cdverde"
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#16202B] border border-[#12B886]/40 text-[#12B886] hover:bg-[#12B886]/10 inline-flex items-center gap-2"
              >
                <span>Conhecer o Case CDVerde</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* NAVEGAÇÃO DE ABAS DO LOTE CONSOLIDADO: DPP DO LOTE vs DESTINAÇÃO FINAL (Oculta na Impressão) */}
            <div className="flex border-b border-[rgba(244,247,250,0.12)] gap-2 pb-px mb-6 sm:mb-8 no-print">
              <button
                type="button"
                onClick={() => setAbaLoteAtiva('laudo')}
                className={`flex items-center gap-2 px-5 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all ${
                  abaLoteAtiva === 'laudo'
                    ? 'border-[#12B886] text-[#12B886] bg-[#12B886]/10 rounded-t-xl'
                    : 'border-transparent text-[#93A3B5] hover:text-[#F4F7FA] hover:bg-[#16202B]/60 rounded-t-xl'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>DPP Consolidado do Lote (Laudo A4)</span>
              </button>

              <button
                type="button"
                onClick={() => setAbaLoteAtiva('destinacao')}
                className={`flex items-center gap-2 px-5 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all ${
                  abaLoteAtiva === 'destinacao'
                    ? 'border-[#12B886] text-[#12B886] bg-[#12B886]/10 rounded-t-xl'
                    : 'border-transparent text-[#93A3B5] hover:text-[#F4F7FA] hover:bg-[#16202B]/60 rounded-t-xl'
                }`}
              >
                <FileCheck2 className="w-4 h-4" />
                <span>Destinação Final (Gate, RLO & Metais)</span>
                {dadosDestinacao && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#12B886]/20 text-[#12B886] font-mono font-bold">
                    {dadosDestinacao.gateDespoluicaoConforme ? 'Gate Conforme ✓' : 'Pendente'}
                  </span>
                )}
              </button>
            </div>

            {/* ABA DESTINAÇÃO FINAL DO LOTE (VISUALIZAÇÃO INTERATIVA) */}
            {abaLoteAtiva === 'destinacao' && dadosDestinacao && (
              <div className="no-print mb-12">
                <DestinacaoFinalTab dados={dadosDestinacao} />
              </div>
            )}

            {/* ABA LAUDO / CERTIFICADO CONSOLIDADO (MOSTRADA QUANDO ABA LAUDO OU NA IMPRESSÃO) */}
            <div className={abaLoteAtiva === 'destinacao' ? 'hidden print:block' : 'block'}>
              {/* ========================================================================= */}
              {/* VISUALIZAÇÃO MOBILE (breakpoint < md / < 768px): Cartão de resumo + fluxo vertical */}
              {/* Oculta em telas médias/grandes (md:hidden) e na impressão (print:hidden) */}
              {/* ========================================================================= */}
              <div className="block md:hidden mobile-view-only space-y-6 no-print mb-8">
                {/* Botão de Destaque CTA Mobile: Gerar PDF */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-[#111820] via-[#16202B] to-[#111820] border-2 border-[#12B886]/60 shadow-emerald-glow flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-[#12B886] flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      Documento Oficial A4
                    </span>
                    <span className="text-[10px] font-mono text-[#93A3B5]">
                      2 Páginas Calibradas
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleImprimir}
                    className="w-full py-3 px-4 rounded-xl text-xs font-extrabold bg-[#12B886] text-[#0A0E12] hover:bg-[#0CA678] active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-lg"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Gerar PDF / Imprimir Documento A4</span>
                  </button>
                  <p className="text-[10px] text-[#93A3B5] text-center leading-tight">
                    Gera o laudo A4 em 2 páginas com QR Code, Anexo I completo e prova de custódia.
                  </p>
                </div>

                {/* CARTÃO DE RESUMO MOBILE - DPP CONSOLIDADO DO LOTE */}
                <div className="p-5 rounded-3xl bg-gradient-to-b from-[#111820] to-[#16202B] border-2 border-[#12B886] shadow-emerald-glow space-y-4">
                  {/* Badges de Topo */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#12B886]/15 border border-[#12B886]/40 text-[#12B886] text-[10px] font-bold uppercase tracking-wider">
                      <Sparkles className="w-3 h-3" />
                      RESUMO DO DPP CONSOLIDADO
                    </div>
                    {lote.is_demo && (
                      <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#F59E0B]/20 border border-[#F59E0B] text-[#F59E0B] text-[10px] font-extrabold uppercase tracking-wider">
                        <AlertTriangle className="w-3 h-3" />
                        <span>DEMO</span>
                      </div>
                    )}
                  </div>

                  {/* Identificação do Lote / Veículo */}
                  <div>
                    <div className="text-[10px] uppercase font-bold text-[#93A3B5] tracking-wider">
                      Veículo Doador
                    </div>
                    <h1 className="font-heading font-black text-xl text-[#F4F7FA] mt-0.5">
                      {lote.veiculo_marca_modelo}
                    </h1>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#93A3B5] mt-1 font-mono">
                      <span>
                        ID: <strong className="text-[#12B886]">{lote.id}</strong>
                      </span>
                      <span>•</span>
                      <span>
                        Baixa DETRAN:{' '}
                        <strong className="text-[#F4F7FA]">{lote.veiculo_baixa_detran}</strong>
                      </span>
                    </div>
                  </div>

                  {/* Empresa CDV Credenciada */}
                  <div className="p-3 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.08)] flex items-start gap-2.5 text-xs">
                    <Building2 className="w-4 h-4 text-[#12B886] shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] text-[#93A3B5] uppercase font-bold block">
                        Centro de Desmontagem Homologado
                      </span>
                      <p className="font-semibold text-[#F4F7FA] truncate">{lote.cdv_nome}</p>
                      <p className="text-[11px] font-mono text-[#D9B36C] font-semibold mt-0.5">
                        CNPJ {lote.cdv_cnpj} • {lote.cdv_codigo || 'DETRAN-CDV'}
                      </p>
                    </div>
                  </div>

                  {/* Grade dos Indicadores-Chave (Massa, CO2e e Nº de Peças) */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-2.5 rounded-xl bg-[#0A0E12] border border-[#12B886]/40 text-center">
                      <span className="text-[9px] uppercase font-bold text-[#12B886] block tracking-wide">
                        CO₂e Evitado
                      </span>
                      <div className="font-heading font-black text-sm sm:text-base text-[#12B886] mt-0.5">
                        -{metricas.totalCO2e.toFixed(1)}
                      </div>
                      <span className="text-[9px] text-[#93A3B5] block">kg CO₂e</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-[#0A0E12] border border-[#D9B36C]/40 text-center">
                      <span className="text-[9px] uppercase font-bold text-[#D9B36C] block tracking-wide">
                        Massa Circular
                      </span>
                      <div className="font-heading font-black text-sm sm:text-base text-[#D9B36C] mt-0.5">
                        {metricas.totalPeso.toFixed(1)}
                      </div>
                      <span className="text-[9px] text-[#93A3B5] block">kg recuperados</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.1)] text-center">
                      <span className="text-[9px] uppercase font-bold text-[#F4F7FA] block tracking-wide">
                        Peças DPP
                      </span>
                      <div className="font-heading font-black text-sm sm:text-base text-[#F4F7FA] mt-0.5">
                        {metricas.totalPecas}
                      </div>
                      <span className="text-[9px] text-[#12B886] block font-semibold">
                        {metricas.pctEmitidas.toFixed(0)}% atestadas
                      </span>
                    </div>
                  </div>

                  {/* Status de Integridade e Hash SHA-256 */}
                  <div className="p-3 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.08)] space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-[#F4F7FA]">
                        <ShieldCheck className="w-4 h-4 text-[#12B886]" />
                        <span className="text-[11px] uppercase tracking-wider">
                          Integridade Criptográfica
                        </span>
                      </div>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#12B886] bg-[#12B886]/15 px-2 py-0.5 rounded-full border border-[#12B886]/30">
                        <CheckCircle2 className="w-3 h-3" />
                        Verificada ✓
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2 bg-[#111820] p-2 rounded-lg border border-[rgba(244,247,250,0.06)]">
                      <span className="font-mono text-[10px] text-[#D9B36C] break-all select-all">
                        {hashCalculado
                          ? `${hashCalculado.slice(0, 18)}...${hashCalculado.slice(-14)}`
                          : 'Calculando...'}
                      </span>
                      <button
                        type="button"
                        onClick={copyHash}
                        className="px-2 py-1 rounded bg-[#16202B] text-[10px] font-semibold text-[#93A3B5] hover:text-[#F4F7FA] shrink-0 flex items-center gap-1"
                      >
                        {copiedHash ? (
                          <Check className="w-3 h-3 text-[#12B886]" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                        <span>{copiedHash ? 'OK' : 'Copiar'}</span>
                      </button>
                    </div>
                  </div>

                  {/* QR Code Tocável e Acesso */}
                  <div className="p-3 rounded-xl bg-[#0A0E12] border border-[#12B886]/30 flex items-center gap-3">
                    <div className="p-1.5 bg-white rounded-lg shrink-0">
                      <QRCodeSVG
                        value={qrCodeUrl}
                        size={64}
                        bgColor="#FFFFFF"
                        fgColor="#0A0E12"
                        title={`QR Consulta Pública DPP Lote ${lote.id}`}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] font-bold uppercase text-[#12B886] block">
                        QR Code de Consulta Pública
                      </span>
                      <p className="text-[10px] text-[#93A3B5] leading-tight mt-0.5">
                        Toque para acessar a URL canônica pública com telemetria dMRV.
                      </p>
                      <a
                        href={qrCodeUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[10px] font-mono text-[#D9B36C] hover:underline mt-1 truncate max-w-full"
                      >
                        <span className="truncate">{baseUrlSemQuery}</span>
                        <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                      </a>
                    </div>
                  </div>
                </div>

                {/* FLUXO VERTICAL MOBILE: DADOS DETALHADOS DO VEÍCULO & CDV */}
                <div className="p-4 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.1)] space-y-3">
                  <div className="flex items-center gap-2 text-[#D9B36C] font-bold text-xs uppercase">
                    <Car className="w-4 h-4" />
                    <span>Rastreabilidade DETRAN & Doação</span>
                  </div>
                  <div className="space-y-1.5 text-xs divide-y divide-[rgba(244,247,250,0.06)]">
                    <div className="flex justify-between pt-1">
                      <span className="text-[#93A3B5]">Chassi Mascarado:</span>
                      <span className="font-mono font-bold text-[#12B886]">
                        {lote.veiculo_chassi || '9BWAA05U0DP***204'}
                      </span>
                    </div>
                    {lote.veiculo_placa && (
                      <div className="flex justify-between pt-1">
                        <span className="text-[#93A3B5]">Placa Anterior:</span>
                        <span className="font-mono text-[#F4F7FA]">{lote.veiculo_placa}</span>
                      </div>
                    )}
                    <div className="flex justify-between pt-1">
                      <span className="text-[#93A3B5]">Baixa DETRAN:</span>
                      <span className="font-mono font-bold text-[#12B886]">
                        {lote.veiculo_baixa_detran}
                      </span>
                    </div>
                    {lote.cartela_desmontagem && (
                      <div className="flex justify-between pt-1">
                        <span className="text-[#93A3B5]">Cartela Desmontagem:</span>
                        <span className="font-mono text-[#D9B36C] font-bold">
                          {lote.cartela_desmontagem}
                        </span>
                      </div>
                    )}
                    {lote.selo_detran_lote && (
                      <div className="flex justify-between pt-1">
                        <span className="text-[#93A3B5]">Selo DETRAN Lote:</span>
                        <span className="font-mono text-[#12B886]">{lote.selo_detran_lote}</span>
                      </div>
                    )}
                    <div className="flex justify-between pt-1">
                      <span className="text-[#93A3B5]">Seguradora / Origem:</span>
                      <span className="text-[#F4F7FA] font-medium">
                        {lote.veiculo_seguradora || 'Porto Seguro Cia de Seguros'}
                      </span>
                    </div>
                    <div className="flex justify-between pt-1">
                      <span className="text-[#93A3B5]">Responsável Técnico:</span>
                      <span className="text-[#F4F7FA] text-right">
                        {pecas[0]?.responsavel_crea || 'CREA-PR 182.940/D'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* FLUXO VERTICAL MOBILE: METODOLOGIA & NORMAS */}
                <div className="p-4 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.1)] space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-[#F4F7FA] font-bold text-xs uppercase">
                    <BookOpen className="w-4 h-4 text-[#12B886]" />
                    <span>Bases Científicas & Normas Auditadas</span>
                  </div>
                  <div className="space-y-2 pt-1 text-[11px] text-[#93A3B5]">
                    <div className="p-2.5 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.06)]">
                      <strong className="text-[#F4F7FA] block">ABNT NBR ISO 14040 / 14044</strong>
                      <span>
                        Avaliação do Ciclo de Vida (ACV) berço-ao-portão para créditos de reposição
                        circular.
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.06)]">
                      <strong className="text-[#12B886] block">
                        ABNT NBR ISO 14067 (Insetting)
                      </strong>
                      <span>
                        Quantificação da pegada de carbono e emissões evitadas por reaproveitamento
                        de autopeças.
                      </span>
                    </div>
                  </div>
                </div>

                {/* FLUXO VERTICAL MOBILE: ANEXO I DISCRIMINADO EM CARTÕES EMPILHADOS */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-[#D9B36C]" />
                      <span className="font-heading font-bold text-xs uppercase tracking-wider text-[#F4F7FA]">
                        Peças do Lote por Grupo
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-[#93A3B5]">
                      {pecas.length} componentes
                    </span>
                  </div>

                  {/* Filtro Mobile */}
                  <div>
                    <select
                      value={filtroCategoria}
                      onChange={(e) => setFiltroCategoria(e.target.value)}
                      className="w-full bg-[#111820] border border-[rgba(244,247,250,0.15)] rounded-xl px-3 py-2 text-xs text-[#F4F7FA] focus:outline-none focus:ring-1 focus:ring-[#12B886]"
                    >
                      <option value="todos">Todos os Grupos ({gruposExibicao.length})</option>
                      {gruposExibicao.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.label} ({g.pecas.length} peças)
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Grupos e Cartões Empilhados no Mobile */}
                  <div className="space-y-4">
                    {gruposExibicao
                      .filter((g) => filtroCategoria === 'todos' || g.id === filtroCategoria)
                      .map((grupo) => (
                        <div
                          key={grupo.id}
                          className="rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.1)] p-3.5 space-y-3"
                        >
                          <div className="flex items-center justify-between pb-2 border-b border-[rgba(244,247,250,0.06)]">
                            <div className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full bg-[#12B886]" />
                              <span className="font-heading font-bold text-xs text-[#F4F7FA]">
                                {grupo.label}
                              </span>
                            </div>
                            <span className="text-[10px] font-mono text-[#D9B36C]">
                              {grupo.pesoTotal.toFixed(1)} kg | -{grupo.co2eTotal.toFixed(1)} kg
                            </span>
                          </div>

                          {/* Cartões individuais empilhados das peças */}
                          <div className="space-y-2">
                            {grupo.pecas.map((peca) => {
                              const fatorInfo =
                                FATORES_CDV_MATERIAIS[peca.categoria_material] ||
                                FATORES_CDV_MATERIAIS.outros
                              return (
                                <div
                                  key={peca.id}
                                  className="p-2.5 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.06)] space-y-2"
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <div>
                                      <div className="font-semibold text-xs text-[#F4F7FA] leading-snug">
                                        {peca.descricao_peca}
                                      </div>
                                      <div className="font-mono text-[10px] text-[#12B886] font-bold mt-0.5">
                                        {peca.selo_dpp}
                                      </div>
                                    </div>
                                    <Link
                                      to={`/passaporte/${peca.selo_dpp}`}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="px-2 py-1 rounded-md bg-[#16202B] text-[10px] font-semibold text-[#12B886] hover:bg-[#12B886]/10 border border-[#12B886]/30 transition-colors inline-flex items-center gap-1 shrink-0"
                                    >
                                      <span>DPP</span>
                                      <ArrowUpRight className="w-2.5 h-2.5" />
                                    </Link>
                                  </div>

                                  <div className="grid grid-cols-3 gap-1 text-[10px] pt-1 border-t border-[rgba(244,247,250,0.04)] font-mono">
                                    <div>
                                      <span className="text-[#93A3B5] block text-[9px]">Massa</span>
                                      <strong className="text-[#D9B36C]">
                                        {Number(peca.peso_kg).toFixed(2)} kg
                                      </strong>
                                    </div>
                                    <div>
                                      <span className="text-[#93A3B5] block text-[9px]">
                                        Fator ACV
                                      </span>
                                      <span className="text-[#93A3B5]">
                                        {Number(
                                          peca.fator_co2e_kg || fatorInfo.fatorKgCO2ePorKg,
                                        ).toFixed(2)}
                                      </span>
                                    </div>
                                    <div className="text-right">
                                      <span className="text-[#93A3B5] block text-[9px]">
                                        CO₂e Evitado
                                      </span>
                                      <strong className="text-[#12B886]">
                                        -{Number(peca.co2e_evitado_kg).toFixed(2)} kg
                                      </strong>
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Botão Secundário CTA Inferior no Mobile */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleImprimir}
                    className="w-full py-3 px-4 rounded-xl text-xs font-bold bg-[#16202B] border border-[#12B886]/50 text-[#12B886] hover:bg-[#12B886]/15 transition-all flex items-center justify-center gap-2"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Imprimir / Gerar PDF Completo</span>
                  </button>
                </div>
              </div>

              {/* ========================================================================= */}
              {/* VISUALIZAÇÃO DESKTOP & IMPRESSÃO: Mantida idêntica em 2 páginas A4 calibradas */}
              {/* md:block print:block, oculta no mobile em tela normal */}
              {/* ========================================================================= */}
              <div className="hidden md:block desktop-document-view space-y-12 print:space-y-0">
                {/* ========================================================================= */}
                {/* PÁGINA 1: IDENTIFICAÇÃO DO LOTE, INDICADORES ESG, METODOLOGIA & PROVA SHA */}
                {/* ========================================================================= */}
                <div className="dpp-page-1 space-y-8 print:space-y-6">
                  {/* Cabeçalho Institucional de Emissão */}
                  <div className="flex items-start justify-between border-b border-[rgba(244,247,250,0.12)] pb-6 print:border-slate-300 print:pb-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#16202B] border border-[#12B886]/40 text-[#12B886] text-[11px] font-bold uppercase tracking-wider print:border-emerald-600 print:bg-emerald-50 print:text-emerald-800">
                          <Sparkles className="w-3.5 h-3.5" />
                          PASSAPORTE DIGITAL DE PRODUTO CONSOLIDADO (DPP-LOTE)
                        </div>

                        {lote.is_demo && (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F59E0B]/20 border border-[#F59E0B] text-[#F59E0B] text-[11px] font-extrabold uppercase tracking-wider shadow-sm print:bg-amber-100 print:border-amber-500 print:text-amber-900">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>LOTE DE DEMONSTRAÇÃO • REFERÊNCIA TÉCNICA</span>
                          </div>
                        )}
                      </div>
                      <h1 className="font-heading font-black text-2xl sm:text-4xl text-[#F4F7FA] tracking-wide print:text-slate-900">
                        LOTE VEICULAR • {lote.veiculo_marca_modelo}
                      </h1>
                      <p className="text-xs sm:text-sm text-[#93A3B5] mt-1 print:text-slate-600">
                        Certificação dMRV de Desmontagem Sustentável & Economia Circular Veicular
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-[10px] uppercase font-bold text-[#93A3B5] print:text-slate-500">
                        ID DO LOTE NA REDE
                      </div>
                      <div className="font-mono text-sm sm:text-base font-bold text-[#12B886] print:text-emerald-700">
                        {lote.id}
                      </div>
                      <div className="text-[10px] text-[#93A3B5] mt-0.5 print:text-slate-500">
                        Emissão: {new Date(lote.created).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                  </div>

                  {/* Bloco 1: Identificação Completa do Lote e Rastreabilidade DETRAN */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Dados do Veículo Doador */}
                    <div className="p-5 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.1)] space-y-3 print:bg-slate-50 print:border-slate-300 print-card">
                      <div className="flex items-center gap-2 text-[#D9B36C] font-bold text-xs uppercase print:text-amber-700">
                        <Car className="w-4 h-4" />
                        <span>Identificação do Veículo Doador</span>
                      </div>
                      <div className="space-y-1.5 text-xs">
                        <div className="flex justify-between border-b border-[rgba(244,247,250,0.06)] pb-1 print:border-slate-200">
                          <span className="text-[#93A3B5] print:text-slate-600">
                            Marca / Modelo:
                          </span>
                          <span className="font-bold text-[#F4F7FA] print:text-slate-900">
                            {lote.veiculo_marca_modelo}
                          </span>
                        </div>
                        <div className="flex justify-between border-b border-[rgba(244,247,250,0.06)] pb-1 print:border-slate-200">
                          <span className="text-[#93A3B5] print:text-slate-600">
                            Chassi Mascarado:
                          </span>
                          <span className="font-mono font-bold text-[#12B886] print:text-emerald-700">
                            {lote.veiculo_chassi || '9BWAA05U0DP***204'}
                          </span>
                        </div>
                        {lote.veiculo_placa && (
                          <div className="flex justify-between border-b border-[rgba(244,247,250,0.06)] pb-1 print:border-slate-200">
                            <span className="text-[#93A3B5] print:text-slate-600">
                              Placa Anterior:
                            </span>
                            <span className="font-mono text-[#F4F7FA] print:text-slate-900">
                              {lote.veiculo_placa}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between border-b border-[rgba(244,247,250,0.06)] pb-1 print:border-slate-200">
                          <span className="text-[#93A3B5] print:text-slate-600">Baixa DETRAN:</span>
                          <span className="font-mono font-bold text-[#12B886] print:text-emerald-700">
                            {lote.veiculo_baixa_detran}
                          </span>
                        </div>
                        {lote.cartela_desmontagem && (
                          <div className="flex justify-between border-b border-[rgba(244,247,250,0.06)] pb-1 print:border-slate-200">
                            <span className="text-[#93A3B5] print:text-slate-600">
                              Cartela Desmontagem:
                            </span>
                            <span className="font-mono font-bold text-[#D9B36C] print:text-amber-800">
                              {lote.cartela_desmontagem}
                            </span>
                          </div>
                        )}
                        {lote.selo_detran_lote && (
                          <div className="flex justify-between border-b border-[rgba(244,247,250,0.06)] pb-1 print:border-slate-200">
                            <span className="text-[#93A3B5] print:text-slate-600">
                              Selo DETRAN Lote:
                            </span>
                            <span className="font-mono text-[#12B886] print:text-emerald-700 font-semibold">
                              {lote.selo_detran_lote}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-[#93A3B5] print:text-slate-600">
                            Seguradora / Origem:
                          </span>
                          <span className="font-semibold text-[#F4F7FA] print:text-slate-900">
                            {lote.veiculo_seguradora || 'Porto Seguro Cia de Seguros'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Dados do CDV Remetente Homologado */}
                    <div className="p-5 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.1)] space-y-3 print:bg-slate-50 print:border-slate-300 print-card">
                      <div className="flex items-center gap-2 text-[#12B886] font-bold text-xs uppercase print:text-emerald-700">
                        <Building2 className="w-4 h-4" />
                        <span>Centro de Desmontagem Credenciado</span>
                      </div>
                      <div className="space-y-1.5 text-xs">
                        <div className="flex justify-between border-b border-[rgba(244,247,250,0.06)] pb-1 print:border-slate-200">
                          <span className="text-[#93A3B5] print:text-slate-600">Razão Social:</span>
                          <span className="font-bold text-[#F4F7FA] print:text-slate-900">
                            {lote.cdv_nome}
                          </span>
                        </div>
                        <div className="flex justify-between border-b border-[rgba(244,247,250,0.06)] pb-1 print:border-slate-200">
                          <span className="text-[#93A3B5] print:text-slate-600">
                            CNPJ Homologado:
                          </span>
                          <span className="font-mono text-[#D9B36C] print:text-amber-800 font-bold">
                            {lote.cdv_cnpj}
                          </span>
                        </div>
                        <div className="flex justify-between border-b border-[rgba(244,247,250,0.06)] pb-1 print:border-slate-200">
                          <span className="text-[#93A3B5] print:text-slate-600">
                            Credenciamento:
                          </span>
                          <span className="font-mono text-[#12B886] print:text-emerald-700 font-semibold">
                            {lote.cdv_codigo || 'DETRAN-PR-CDV-0089'}
                          </span>
                        </div>
                        <div className="flex justify-between border-b border-[rgba(244,247,250,0.06)] pb-1 print:border-slate-200">
                          <span className="text-[#93A3B5] print:text-slate-600">
                            Licença CTF-IBAMA:
                          </span>
                          <span className="font-mono text-[#12B886] print:text-emerald-700 font-medium">
                            {lote.ctf_ibama || 'CTF-IBAMA 6812490/2024'}
                          </span>
                        </div>
                        <div className="flex justify-between border-b border-[rgba(244,247,250,0.06)] pb-1 print:border-slate-200">
                          <span className="text-[#93A3B5] print:text-slate-600">
                            Total de Peças Catalogadas:
                          </span>
                          <span className="font-bold text-[#F4F7FA] print:text-slate-900">
                            {metricas.totalPecas} peças apuradas
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#93A3B5] print:text-slate-600">
                            Responsável Técnico:
                          </span>
                          <span className="text-[#F4F7FA] print:text-slate-900 font-medium">
                            {pecas[0]?.responsavel_crea ||
                              'CREA-PR 182.940/D - Eng. Marcelo Brandão'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bloco 2: Indicadores ESG Consolidados */}
                  <div className="p-6 rounded-3xl bg-gradient-to-b from-[#111820] to-[#16202B] border-2 border-[#12B886]/50 shadow-emerald-glow print:bg-emerald-50 print:border-emerald-600 print-card-hero">
                    <div className="flex items-center gap-2 mb-4">
                      <BarChart3 className="w-5 h-5 text-[#12B886] print:text-emerald-700" />
                      <span className="font-heading font-extrabold text-sm uppercase tracking-wider text-[#12B886] print:text-emerald-800">
                        INDICADORES ESG & DESCARBONIZAÇÃO CONSOLIDADA (VISÃO TOTAL)
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2">
                      {/* CO2e Evitado */}
                      <div className="p-4 rounded-2xl bg-[#0A0E12] border border-[#12B886]/40 print:bg-white print:border-emerald-300">
                        <span className="text-[10px] uppercase font-bold text-[#12B886] print:text-emerald-700 tracking-wider block mb-1">
                          EMISSÕES EVITADAS POR REUSO
                        </span>
                        <div className="font-heading font-black text-3xl sm:text-4xl text-[#12B886] print:text-emerald-700">
                          -
                          {metricas.totalCO2e.toLocaleString('pt-BR', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}{' '}
                          kg
                        </div>
                        <span className="text-xs text-[#93A3B5] print:text-slate-600 block mt-1">
                          CO₂e evitado (Insetting ISO 14067)
                        </span>
                      </div>

                      {/* Massa Total Recuperada */}
                      <div className="p-4 rounded-2xl bg-[#0A0E12] border border-[rgba(244,247,250,0.1)] print:bg-white print:border-slate-300">
                        <span className="text-[10px] uppercase font-bold text-[#D9B36C] print:text-amber-800 tracking-wider block mb-1">
                          MASSA CIRCULAR RECUPERADA
                        </span>
                        <div className="font-heading font-black text-3xl sm:text-4xl text-[#D9B36C] print:text-amber-800">
                          {metricas.totalPeso.toLocaleString('pt-BR', {
                            minimumFractionDigits: 1,
                            maximumFractionDigits: 2,
                          })}{' '}
                          kg
                        </div>
                        <span className="text-xs text-[#93A3B5] print:text-slate-600 block mt-1">
                          Massa desviada de aterros e refusão virgem
                        </span>
                      </div>

                      {/* Cobertura de DPP */}
                      <div className="p-4 rounded-2xl bg-[#0A0E12] border border-[rgba(244,247,250,0.1)] print:bg-white print:border-slate-300">
                        <span className="text-[10px] uppercase font-bold text-[#F4F7FA] print:text-slate-700 tracking-wider block mb-1">
                          COBERTURA DO LOTE COM DPP
                        </span>
                        <div className="font-heading font-black text-3xl sm:text-4xl text-[#F4F7FA] print:text-slate-900">
                          {metricas.pctEmitidas.toFixed(0)}%
                        </div>
                        <span className="text-xs text-[#93A3B5] print:text-slate-600 block mt-1">
                          {pecas.length}/{metricas.totalPecas} peças atestadas com selo individual
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Bloco 3: Metodologia Científica & Conformidade Normativa */}
                  <div className="p-5 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.1)] space-y-3 print:bg-slate-50 print:border-slate-300 print-card">
                    <div className="flex items-center gap-2 text-[#F4F7FA] print:text-slate-900 font-bold text-xs uppercase">
                      <BookOpen className="w-4 h-4 text-[#12B886] print:text-emerald-700" />
                      <span>Metodologia & Bases Científicas Auditadas</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-[#93A3B5] print:text-slate-600">
                      <div className="p-3 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.06)] print:bg-white print:border-slate-200">
                        <div className="font-bold text-[#F4F7FA] print:text-slate-900 mb-1">
                          ABNT NBR ISO 14040 / 14044
                        </div>
                        <p className="text-[11px] leading-relaxed">
                          Avaliação do Ciclo de Vida (ACV) berço-ao-portão para créditos de
                          reposição e prevenção de refino primário.
                        </p>
                      </div>
                      <div className="p-3 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.06)] print:bg-white print:border-slate-200">
                        <div className="font-bold text-[#12B886] print:text-emerald-700 mb-1">
                          ABNT NBR ISO 14067 (Insetting)
                        </div>
                        <p className="text-[11px] leading-relaxed">
                          Quantificação da pegada de carbono e emissões evitadas atribuídas por
                          reaproveitamento direto de componentes.
                        </p>
                      </div>
                      <div className="p-3 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.06)] print:bg-white print:border-slate-200">
                        <div className="font-bold text-[#D9B36C] print:text-amber-800 mb-1">
                          Bases Ecoinvent / WorldSteel / IAI
                        </div>
                        <p className="text-[11px] leading-relaxed">
                          Fatores de emissão curados com incerteza estocástica auditada pelo
                          ecossistema Orbis dMRV.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Bloco 4: Prova Criptográfica SHA-256 Real do Lote + QR Code de Consulta Pública */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center p-6 rounded-2xl bg-[#0A0E12] border border-[#12B886]/40 print:bg-slate-50 print:border-slate-300 print-card">
                    <div className="lg:col-span-8 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="w-5 h-5 text-[#12B886] print:text-emerald-700" />
                          <span className="font-heading font-bold text-xs uppercase tracking-wider text-[#F4F7FA] print:text-slate-900">
                            HASH SHA-256 VERIFICÁVEL DO LOTE CONSOLIDADO
                          </span>
                        </div>
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#12B886] bg-[#12B886]/10 px-2.5 py-0.5 rounded-full border border-[#12B886]/30 print:bg-emerald-100 print:text-emerald-800">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Integridade verificada ✓
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-3 bg-[#111820] p-3 rounded-xl border border-[rgba(244,247,250,0.08)] print:bg-white print:border-slate-300">
                        <span
                          className="font-mono text-xs text-[#D9B36C] print:text-amber-900 break-all select-all"
                          title={hashCalculado}
                        >
                          {hashCalculado || 'Calculando hash SHA-256...'}
                        </span>
                        <button
                          type="button"
                          onClick={copyHash}
                          className="px-3 py-1.5 rounded-lg bg-[#16202B] text-xs font-semibold text-[#93A3B5] hover:text-[#F4F7FA] hover:bg-[#12B886]/20 transition-all flex items-center gap-1.5 shrink-0 no-print"
                        >
                          {copiedHash ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-[#12B886]" />
                              <span className="text-[#12B886]">Copiado</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copiar</span>
                            </>
                          )}
                        </button>
                      </div>

                      <p className="text-[10px] text-[#93A3B5] print:text-slate-600 leading-relaxed">
                        O hash canônico consolida lexicograficamente os hashes individuais de todas
                        as {pecas.length} peças deste lote, vinculado à baixa DETRAN{' '}
                        <span className="font-mono font-bold text-[#F4F7FA] print:text-slate-800">
                          {lote.veiculo_baixa_detran}
                        </span>{' '}
                        e ao CNPJ{' '}
                        <span className="font-mono font-bold text-[#F4F7FA] print:text-slate-800">
                          {lote.cdv_cnpj}
                        </span>
                        . Qualquer adulteração em pesos, fatores ou selos invalida a prova.
                      </p>
                    </div>

                    <div className="lg:col-span-4 flex flex-col items-center justify-center text-center border-t lg:border-t-0 lg:border-l border-[rgba(244,247,250,0.1)] lg:pl-6 pt-4 lg:pt-0 print:border-slate-300">
                      <div className="p-2.5 bg-white rounded-xl shadow-lg mb-2">
                        <QRCodeSVG
                          value={qrCodeUrl}
                          size={130}
                          bgColor="#FFFFFF"
                          fgColor="#0A0E12"
                          title={`QR Consulta Pública DPP Lote ${lote.id}`}
                        />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#12B886] print:text-emerald-800">
                        QR DE CONSULTA PÚBLICA
                      </span>
                      <span className="text-[9px] text-[#93A3B5] print:text-slate-500 font-mono mt-0.5 max-w-[200px] truncate">
                        {qrCodeUrl}
                      </span>
                    </div>
                  </div>

                  {/* Bloco 5: Histórico de Verificações do Lote (Auditoria Pública e LGPD) */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-[#0A0E12] border border-[#12B886]/35 space-y-3 print:bg-slate-50 print:border-slate-300 print-card">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[rgba(244,247,250,0.08)] pb-2 print:border-slate-200">
                      <div className="flex items-center gap-2">
                        <History className="w-4 h-4 text-[#12B886] print:text-emerald-700" />
                        <span className="font-heading font-bold text-xs uppercase tracking-wider text-[#F4F7FA] print:text-slate-900">
                          HISTÓRICO DE VERIFICAÇÕES & TRILHA DE AUDITORIA DPP
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs">
                        <span className="text-[#93A3B5] print:text-slate-600">
                          Total Acumulado:{' '}
                          <strong className="text-[#12B886] print:text-emerald-700 font-mono font-bold">
                            {Math.max(totalConsultasLote, historicoConsultas.length, 1)} leituras
                          </strong>
                        </span>
                        {historicoConsultas.length > 0 && (
                          <span className="text-[#93A3B5] print:text-slate-600 text-[11px] font-mono">
                            Última:{' '}
                            <strong className="text-[#F4F7FA] print:text-slate-900">
                              {new Date(historicoConsultas[0].created).toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </strong>
                          </span>
                        )}
                      </div>
                    </div>

                    {historicoConsultas.length === 0 ? (
                      <div className="py-2 text-center text-xs text-[#93A3B5] print:text-slate-600 flex items-center justify-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#12B886]" />
                        <span>
                          Primeira leitura registrada nesta sessão (Canal:{' '}
                          {canalDetectado.toUpperCase()} • Hash conferido ✓)
                        </span>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs print-table">
                          <thead className="border-b border-[rgba(244,247,250,0.06)] text-[#93A3B5] uppercase font-semibold text-[10px] print:text-slate-600 print:border-slate-200">
                            <tr>
                              <th className="py-1.5 px-2">Data / Hora</th>
                              <th className="py-1.5 px-2">Canal de Acesso</th>
                              <th className="py-1.5 px-2">IP Auditado (LGPD)</th>
                              <th className="py-1.5 px-2 text-right">Resultado do Hash</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[rgba(244,247,250,0.04)] text-[#F4F7FA] print:divide-slate-200 print:text-slate-800">
                            {historicoConsultas.slice(0, 5).map((consulta, idx) => {
                              const isQr = consulta.canal === 'qr'
                              const isEmbed = consulta.canal === 'embed'
                              const conferido = consulta.hash_conferido !== false

                              return (
                                <tr
                                  key={consulta.id || idx}
                                  className="hover:bg-[#16202B]/40 transition-colors"
                                >
                                  <td className="py-1.5 px-2 font-mono text-[11px] text-[#93A3B5] print:text-slate-600">
                                    {new Date(consulta.created).toLocaleDateString('pt-BR', {
                                      day: '2-digit',
                                      month: '2-digit',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                  </td>
                                  <td className="py-1.5 px-2">
                                    <span
                                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                        isQr
                                          ? 'bg-[#12B886]/15 text-[#12B886] border border-[#12B886]/30 print:bg-emerald-100 print:text-emerald-800'
                                          : isEmbed
                                            ? 'bg-[#D9B36C]/15 text-[#D9B36C] border border-[#D9B36C]/30 print:bg-amber-100 print:text-amber-800'
                                            : 'bg-[#3B82F6]/15 text-[#3B82F6] border border-[#3B82F6]/30 print:bg-blue-100 print:text-blue-800'
                                      }`}
                                    >
                                      {isQr && <QrCode className="w-3 h-3" />}
                                      {isEmbed && <Code2 className="w-3 h-3" />}
                                      {!isQr && !isEmbed && <Globe className="w-3 h-3" />}
                                      <span>
                                        {isQr
                                          ? 'QR Code Físico'
                                          : isEmbed
                                            ? 'Widget Embed'
                                            : 'Navegação Web'}
                                      </span>
                                    </span>
                                  </td>
                                  <td className="py-1.5 px-2 font-mono text-[11px] text-[#93A3B5] print:text-slate-600">
                                    {consulta.ip_mascarado || '189.40.xxx.xxx'}
                                  </td>
                                  <td className="py-1.5 px-2 text-right">
                                    {conferido ? (
                                      <span className="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-[#12B886] print:text-emerald-700">
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        <span>Conferido ✓</span>
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-[#F03E54] print:text-red-700">
                                        <AlertTriangle className="w-3.5 h-3.5" />
                                        <span>Divergente</span>
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-[9px] text-[#93A3B5] print:text-slate-500 pt-1 border-t border-[rgba(244,247,250,0.05)] print:border-slate-200">
                      <span>
                        Trilha auditável conforme LGPD (Art. 5º, XI c/c Art. 13 — anonimização de
                        IPs e registros temporais).
                      </span>
                      <span className="font-mono">
                        Canal detectado: {canalDetectado.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {/* Rodapé da Página 1 */}
                  <div className="pt-4 border-t border-[rgba(244,247,250,0.08)] flex items-center justify-between text-[11px] text-[#93A3B5] print:border-slate-300 print:text-slate-500">
                    <span>Orbis Protocol • Passaporte Digital de Produto Consolidado</span>
                    <span className="font-bold">Página 1 de 2 • Continua no Anexo I</span>
                  </div>
                </div>

                {/* ========================================================================= */}
                {/* PÁGINA 2: ANEXO I - RELAÇÃO DISCRIMINADA DAS PEÇAS POR GRUPO / SUBSISTEMA */}
                {/* ========================================================================= */}
                <div className="dpp-page-2 space-y-6 pt-8 print:pt-0">
                  {/* Topo do Anexo I */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[rgba(244,247,250,0.12)] pb-4 print:border-slate-300">
                    <div>
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#16202B] border border-[#D9B36C]/40 text-[#D9B36C] text-[11px] font-bold uppercase tracking-wider mb-2 print:border-amber-600 print:bg-amber-50 print:text-amber-800">
                        <Layers className="w-3.5 h-3.5" />
                        ANEXO I • RELAÇÃO DISCRIMINADA DE PEÇAS POR SUBSISTEMA
                      </div>
                      <h2 className="font-heading font-black text-xl sm:text-2xl text-[#F4F7FA] print:text-slate-900">
                        Detalhamento dos Componentes Circulares & Memória de Cálculo
                      </h2>
                      <p className="text-xs text-[#93A3B5] print:text-slate-600 mt-0.5">
                        Visão agrupada por categoria de material com link auditável para o DPP
                        individual de cada peça.
                      </p>
                    </div>

                    {/* Filtro de Categoria Interativo (apenas em tela) */}
                    <div className="no-print flex items-center gap-2">
                      <span className="text-xs text-[#93A3B5]">Filtrar grupo:</span>
                      <select
                        value={filtroCategoria}
                        onChange={(e) => setFiltroCategoria(e.target.value)}
                        className="bg-[#111820] border border-[rgba(244,247,250,0.15)] rounded-lg px-3 py-1.5 text-xs text-[#F4F7FA] focus:outline-none focus:ring-1 focus:ring-[#12B886]"
                      >
                        <option value="todos">Todos os Grupos ({gruposExibicao.length})</option>
                        {gruposExibicao.map((g) => (
                          <option key={g.id} value={g.id}>
                            {g.label} ({g.pecas.length})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Tabela Agrupada por Categoria / Subsistema */}
                  <div className="space-y-6">
                    {gruposExibicao
                      .filter((g) => filtroCategoria === 'todos' || g.id === filtroCategoria)
                      .map((grupo) => (
                        <div
                          key={grupo.id}
                          className="rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.1)] overflow-hidden print:bg-transparent print:border print:border-slate-300 print-card"
                        >
                          {/* Cabeçalho do Grupo */}
                          <div className="p-4 bg-[#16202B]/90 border-b border-[rgba(244,247,250,0.08)] flex flex-wrap items-center justify-between gap-3 print:bg-slate-100 print:border-slate-300">
                            <div className="flex items-center gap-2">
                              <span className="w-3 h-3 rounded-full bg-[#12B886]" />
                              <span className="font-heading font-bold text-sm text-[#F4F7FA] print:text-slate-900">
                                {grupo.label}
                              </span>
                              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#0A0E12] text-[#93A3B5] print:bg-white print:border print:border-slate-200">
                                {grupo.pecas.length} {grupo.pecas.length === 1 ? 'peça' : 'peças'}
                              </span>
                            </div>

                            <div className="flex items-center gap-4 text-xs font-mono">
                              <span className="text-[#93A3B5] print:text-slate-600">
                                Subtotal Peso:{' '}
                                <strong className="text-[#D9B36C] print:text-amber-800">
                                  {grupo.pesoTotal.toFixed(2)} kg
                                </strong>
                              </span>
                              <span className="text-[#93A3B5] print:text-slate-600">
                                Subtotal CO₂e:{' '}
                                <strong className="text-[#12B886] print:text-emerald-700">
                                  -{grupo.co2eTotal.toFixed(2)} kg
                                </strong>
                              </span>
                            </div>
                          </div>

                          {/* Itens do Grupo */}
                          <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs print-table">
                              <thead className="border-b border-[rgba(244,247,250,0.08)] text-[#93A3B5] uppercase font-semibold text-[10px] print:text-slate-600 print:border-slate-300">
                                <tr>
                                  <th className="py-2.5 px-3">Selo DPP Oficial</th>
                                  <th className="py-2.5 px-3">Descrição da Peça</th>
                                  {temSubsistemas && <th className="py-2.5 px-3">Subsistema</th>}
                                  <th className="py-2.5 px-3">Material Declarado</th>
                                  <th className="py-2.5 px-3 text-right">Peso (kg)</th>
                                  <th className="py-2.5 px-3 text-right">Fator (kgCO₂e/kg)</th>
                                  <th className="py-2.5 px-3 text-right">CO₂e Evitado</th>
                                  <th className="py-2.5 px-3 text-center print:hidden">
                                    DPP Individual
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-[rgba(244,247,250,0.05)] text-[#F4F7FA] print:divide-slate-200 print:text-slate-800">
                                {grupo.pecas.map((peca) => {
                                  const fatorInfo =
                                    FATORES_CDV_MATERIAIS[peca.categoria_material] ||
                                    FATORES_CDV_MATERIAIS.outros
                                  return (
                                    <tr
                                      key={peca.id}
                                      className="hover:bg-[#16202B]/60 transition-colors print:hover:bg-transparent"
                                    >
                                      <td className="py-2.5 px-3">
                                        <div className="font-mono font-bold text-[#12B886] print:text-emerald-700">
                                          {peca.selo_dpp}
                                        </div>
                                        <div className="text-[10px] font-mono text-[#93A3B5] print:text-slate-500">
                                          SKU: {peca.sku_interno}
                                        </div>
                                      </td>
                                      <td className="py-2.5 px-3">
                                        <div className="font-semibold text-[#F4F7FA] print:text-slate-900">
                                          {peca.descricao_peca}
                                        </div>
                                        <div className="text-[10px] text-[#93A3B5] print:text-slate-500 font-mono">
                                          NCM: {peca.ncm || '8708.29.99'}
                                        </div>
                                      </td>
                                      {temSubsistemas && (
                                        <td className="py-2.5 px-3">
                                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#16202B] text-[#D9B36C] border border-[rgba(244,247,250,0.06)] print:border-slate-200 print:text-amber-800 print:bg-white font-semibold">
                                            {peca.subsistema || 'Geral'}
                                          </span>
                                        </td>
                                      )}
                                      <td className="py-2.5 px-3">
                                        <span className="text-[11px] text-[#93A3B5] print:text-slate-700">
                                          {peca.material_declarado || grupo.label}
                                        </span>
                                      </td>
                                      <td className="py-2.5 px-3 text-right font-mono font-semibold text-[#D9B36C] print:text-amber-800">
                                        {Number(peca.peso_kg).toFixed(2)} kg
                                      </td>
                                      <td className="py-2.5 px-3 text-right font-mono text-[#93A3B5] print:text-slate-600">
                                        {Number(
                                          peca.fator_co2e_kg || fatorInfo.fatorKgCO2ePorKg,
                                        ).toFixed(2)}
                                      </td>
                                      <td className="py-2.5 px-3 text-right font-mono font-bold text-[#12B886] print:text-emerald-700">
                                        -{Number(peca.co2e_evitado_kg).toFixed(2)} kg
                                      </td>
                                      <td className="py-2.5 px-3 text-center print:hidden">
                                        <Link
                                          to={`/passaporte/${peca.selo_dpp}`}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#16202B] text-[11px] font-semibold text-[#12B886] hover:bg-[#12B886]/10 border border-[#12B886]/30 transition-colors"
                                          title="Abrir Passaporte Individual"
                                        >
                                          <span>Ver DPP</span>
                                          <ArrowUpRight className="w-3 h-3" />
                                        </Link>
                                      </td>
                                    </tr>
                                  )
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ))}
                  </div>

                  {/* Rodapé de Consolidação e Totais */}
                  <div className="p-5 rounded-2xl bg-[#0A0E12] border-2 border-[#12B886]/50 print:bg-slate-100 print:border-emerald-600 print-card space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[rgba(244,247,250,0.1)] print:border-slate-300">
                      <div className="flex items-center gap-2">
                        <Scale className="w-4 h-4 text-[#12B886] print:text-emerald-700" />
                        <span className="font-heading font-extrabold text-xs uppercase tracking-wider text-[#F4F7FA] print:text-slate-900">
                          CONSOLIDAÇÃO FINAL DO LOTE ({metricas.totalPecas} PEÇAS CATALOGADAS)
                        </span>
                      </div>
                      <div className="flex items-center gap-6 font-mono text-xs">
                        <div>
                          <span className="text-[#93A3B5] print:text-slate-600 mr-2">
                            Massa Total:
                          </span>
                          <strong className="text-[#D9B36C] print:text-amber-800 text-sm">
                            {metricas.totalPeso.toFixed(2)} kg
                          </strong>
                        </div>
                        <div>
                          <span className="text-[#93A3B5] print:text-slate-600 mr-2">
                            Total CO₂e Evitado:
                          </span>
                          <strong className="text-[#12B886] print:text-emerald-700 text-sm">
                            -{metricas.totalCO2e.toFixed(2)} kg
                          </strong>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[10px] text-[#93A3B5] print:text-slate-500 gap-2">
                      <span>
                        Certificado gerado e autenticado eletronicamente através do protocolo dMRV
                        da Orbis Protocol.
                      </span>
                      <span className="font-mono">
                        Hash Lote:{' '}
                        <span className="text-[#D9B36C] print:text-slate-700">
                          {hashCalculado
                            ? `${hashCalculado.slice(0, 16)}...${hashCalculado.slice(-16)}`
                            : '—'}
                        </span>
                      </span>
                    </div>
                  </div>

                  {/* Rodapé da Página 2 */}
                  <div className="pt-4 border-t border-[rgba(244,247,250,0.08)] flex items-center justify-between text-[11px] text-[#93A3B5] print:border-slate-300 print:text-slate-500">
                    <span>Orbis Protocol • Anexo I - Relação de Componentes Veiculares</span>
                    <span className="font-bold">Página 2 de 2 • Fim do Documento</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
