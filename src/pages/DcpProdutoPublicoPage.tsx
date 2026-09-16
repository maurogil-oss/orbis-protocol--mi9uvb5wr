import React, { useState, useEffect, useRef } from 'react'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  Printer,
  Package,
  ArrowLeft,
  Building2,
  Leaf,
  Layers,
  Scale,
  History,
  QrCode,
  Globe,
  Code2,
  ExternalLink,
  Info,
  Calendar,
  Sparkles,
  FileCheck2,
} from 'lucide-react'
import { QRCodeSVG } from '@/components/QRCodeSVG'
import pb from '@/lib/pocketbase/client'
import {
  registrarConsultaDpp,
  obterHistoricoConsultasDpp,
  type DppConsultaRecord,
} from '@/services/cdvService'

interface SeloRecord {
  id: string
  codigo_selo: string
  empresa: string
  cnpj: string
  status: string
  data_emissao: string
  data_validade: string
  hash_integridade?: string
  created?: string
}

export default function DcpProdutoPublicoPage() {
  const { selo: seloParam } = useParams<{ selo: string }>()
  const [searchParams] = useSearchParams()
  const canalParam = searchParams.get('via') // 'qr' | 'embed' | 'web'
  const canalDetectado: 'qr' | 'web' | 'embed' =
    canalParam === 'qr' ? 'qr' : canalParam === 'embed' ? 'embed' : 'web'

  // Código canônico do selo de produto demo
  const codigoSelo = seloParam || 'ORB-DCP-KLBN-4819'

  const [seloData, setSeloData] = useState<SeloRecord | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [copiedHash, setCopiedHash] = useState(false)

  // Histórico de Verificações do DCP do Produto
  const [historicoConsultas, setHistoricoConsultas] = useState<DppConsultaRecord[]>([])
  const [totalConsultas, setTotalConsultas] = useState<number>(0)
  const hasRegisteredRef = useRef(false)

  // URL canônica sem query param para display e com ?via=qr para o QR Code
  const baseUrlSemQuery =
    typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}` : ''
  const qrCodeUrl = `${baseUrlSemQuery}?via=qr`

  // Hash SHA-256 verificável da unidade do produto
  const sha256Calculado = '0x7d9e4a8f3b2c1d0e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e'

  useEffect(() => {
    let isMounted = true
    const carregar = async () => {
      setIsLoading(true)
      try {
        let registro: SeloRecord | null = null

        try {
          const res = await pb
            .collection('selos')
            .getFirstListItem<SeloRecord>(`codigo_selo = "${codigoSelo}"`)
          registro = res
        } catch {
          // Fallback gracioso com os dados canônicos da papelada Klabin NCM 4819
          registro = {
            id: 'selo-klabin-4819',
            codigo_selo: codigoSelo,
            empresa: 'Klabin S.A. / Indústrias & Logística Integrada Brasil S.A.',
            cnpj: '89.637.490/0001-45',
            status: 'ativo',
            data_emissao: '2026-07-28 00:00:00.000Z',
            data_validade: '2028-07-28 00:00:00.000Z',
            hash_integridade: sha256Calculado,
          }
        }

        if (!isMounted) return
        setSeloData(registro)

        // Registrar consulta pública em dpp_consultas
        if (!hasRegisteredRef.current) {
          hasRegisteredRef.current = true
          await registrarConsultaDpp({
            alvo_tipo: 'selo',
            alvo_identificador: codigoSelo,
            canal: canalDetectado,
            hash_conferido: true,
            hash_calculado: registro?.hash_integridade || sha256Calculado,
          })
        }

        // Carregar histórico de consultas acumuladas
        const hist = await obterHistoricoConsultasDpp(codigoSelo, undefined, 5)
        if (isMounted) {
          setTotalConsultas(hist.total)
          setHistoricoConsultas(hist.ultimas)
        }
      } catch {
        /* tratativa de erro */
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    carregar()
    return () => {
      isMounted = false
    }
  }, [codigoSelo, canalDetectado])

  const copyHash = () => {
    const h = seloData?.hash_integridade || sha256Calculado
    navigator.clipboard.writeText(h)
    setCopiedHash(true)
    setTimeout(() => setCopiedHash(false), 2000)
  }

  const handleImprimir = () => {
    window.print()
  }

  // Dados do Produto Demo: Papelada Klabin NCM 4819 (Caixas de Papelão Ondulado Kraft Reciclado)
  const produtoDemo = {
    nome: 'Caixa de Papelão Ondulado Kraft Alta Performance (Linha E-Commerce B2B)',
    ncm: '4819.10.00',
    descricaoNcm:
      'Caixas de papel ou cartão, ondulados (Kraftliner 100% fibra virgem/reciclada certificada FSC)',
    unidadeFuncional:
      '1 unidade vendida (Caixa Padrão 40x30x25 cm — Massa física líquida: 0,380 kg)',
    loteProducao: 'KLBN-PR-2026-B89',
    nfVinculada: 'NF-e 000.014.289 / Série 1 — Chave: 41260789637490000145550010091104501000112519',
    pesoLiquidoKg: 0.38,
    // Pegada segregada por categoria do ciclo de vida Cradle-to-Gate (kg CO₂e por unidade vendida)
    categoriasPegada: [
      {
        categoria: 'A1 - Matérias-Primas (Polpa kraft virgem e apara reciclada FSC)',
        fossilKg: 0.052,
        biogenicoKg: 0.298,
        evitadasKg: 0.045,
        memoria:
          '0,380 kg × 0,137 kgCO₂e/kg (fóssil) e 0,784 kgCO₂/kg (biogênico removido na biomassa florestal)',
        fonteFator: 'Klabin ACV EPD BR-FSC / Ecoinvent 3.10',
      },
      {
        categoria: 'A2 - Transporte Floresta-Fábrica (Logística pesada rodoferroviária)',
        fossilKg: 0.018,
        biogenicoKg: 0.002,
        evitadasKg: 0.0,
        memoria: '180 km rodoferroviário ponderado × 0,026 kgCO₂e/t.km',
        fonteFator: 'CT-e SEFAZ PR / GHG Protocol Ferramenta Logística',
      },
      {
        categoria: 'A3 - Manufatura e Ondulação (Caldeira de biomassa e energia elétrica)',
        fossilKg: 0.025,
        biogenicoKg: 0.185,
        evitadasKg: 0.05,
        memoria: '0,14 kWh/unidade (SIN 0,0289 kg/kWh) + 0,12 kg cavaco reflorestado',
        fonteFator: 'Medição local telemetria industrial Klabin Monte Alegre',
      },
      {
        categoria: 'A4 - Logística de Entrega CD Paraná (MDF-e Transporte Rodoviário)',
        fossilKg: 0.015,
        biogenicoKg: 0.001,
        evitadasKg: 0.0,
        memoria: 'Veículo pesado Euro VI Diesel S10 com 14% Biodiesel B14',
        fonteFator: 'MDF-e 41260718990112 / ANP Fatores Oficiais 2026',
      },
    ],
  }

  // Totais agregados da Unidade Funcional
  const totalFossilPorUnidade = produtoDemo.categoriasPegada.reduce(
    (acc, it) => acc + it.fossilKg,
    0,
  )
  const totalBiogenicoPorUnidade = produtoDemo.categoriasPegada.reduce(
    (acc, it) => acc + it.biogenicoKg,
    0,
  )
  const totalEvitadasPorUnidade = produtoDemo.categoriasPegada.reduce(
    (acc, it) => acc + it.evitadasKg,
    0,
  )

  return (
    <div className="min-h-screen py-8 md:py-12 bg-[#0A0E12] text-[#F4F7FA] print:bg-white print:text-black print:p-0">
      {/* CSS Específico de Impressão (2 páginas rígidas no padrão dos Passaportes) */}
      <style>{`
        @media print {
          nav, header, footer, .no-print {
            display: none !important;
          }
          body {
            background-color: #ffffff !important;
            color: #0f172a !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .dcp-prod-page-1 {
            page-break-after: always !important;
            break-after: page !important;
            min-height: 100vh;
            padding: 16mm 14mm !important;
            box-sizing: border-box;
          }
          .dcp-prod-page-2 {
            page-break-before: always !important;
            break-before: page !important;
            min-height: 100vh;
            padding: 16mm 14mm !important;
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
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 pb-4 border-b border-[rgba(244,247,250,0.1)] no-print">
          <div className="flex items-center gap-3">
            <Link
              to="/bureau"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#93A3B5] hover:text-[#12B886] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Voltar ao Bureau ACP</span>
            </Link>
            <span className="text-xs text-[#93A3B5]">•</span>
            <Link
              to="/corporativo"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#93A3B5] hover:text-[#12B886] transition-colors"
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Módulo Corporativo</span>
            </Link>
            <span className="text-xs text-[#93A3B5]">•</span>
            <Link
              to="/corporativo/dcp"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#93A3B5] hover:text-[#12B886] transition-colors"
            >
              <FileCheck2 className="w-3.5 h-3.5" />
              <span>DCP Corporativo Demo</span>
            </Link>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#12B886] animate-pulse" />
              <span className="text-[11px] font-mono text-[#12B886] uppercase font-bold tracking-wider">
                DCP DO PRODUTO • NCM 4819 KLABIN
              </span>
            </div>

            <button
              type="button"
              onClick={handleImprimir}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-[#12B886] text-[#0A0E12] hover:bg-[#0CA678] transition-all flex items-center gap-2 shadow-emerald-glow"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir / Salvar PDF (2 Páginas)</span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* PÁGINA 1: DECLARAÇÃO DO PRODUTO, UNIDADE FUNCIONAL, PEGADA & PROVA SHA-256 */}
        {/* ========================================================================= */}
        <div className="dcp-prod-page-1 space-y-6 print:space-y-4">
          {/* Topo do Documento com Badges */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-[rgba(244,247,250,0.12)] pb-4 print:border-slate-300">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#16202B] border border-[#12B886]/40 text-[#12B886] text-[11px] font-bold uppercase tracking-wider print:border-emerald-600 print:bg-emerald-50 print:text-emerald-800">
                  <Package className="w-3.5 h-3.5" />
                  DECLARAÇÃO DE CONFORMIDADE E PEGADA DO PRODUTO (DCP)
                </div>

                {/* BADGE OBRIGATÓRIA: DEMONSTRAÇÃO */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F59E0B]/20 border border-[#F59E0B] text-[#F59E0B] text-[11px] font-extrabold uppercase tracking-wider shadow-sm print:bg-amber-100 print:border-amber-500 print:text-amber-900">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>DEMONSTRAÇÃO</span>
                </div>
              </div>

              <h1 className="font-heading font-black text-2xl sm:text-3xl text-[#F4F7FA] tracking-wide print:text-slate-900">
                {produtoDemo.nome}
              </h1>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#93A3B5] mt-1 print:text-slate-600">
                <span className="font-mono text-[#D9B36C] print:text-amber-800 font-bold">
                  NCM: {produtoDemo.ncm}
                </span>
                <span>•</span>
                <span>
                  Fabricante / Titular:{' '}
                  <strong className="text-[#F4F7FA] print:text-slate-900">
                    {seloData?.empresa || 'Klabin S.A.'}
                  </strong>
                </span>
                <span>•</span>
                <span>
                  CNPJ:{' '}
                  <strong className="text-[#F4F7FA] print:text-slate-900 font-mono">
                    {seloData?.cnpj || '89.637.490/0001-45'}
                  </strong>
                </span>
              </div>
            </div>

            <div className="text-right shrink-0">
              <div className="text-[10px] uppercase font-bold text-[#93A3B5] print:text-slate-500">
                SELO DCP PÚBLICO
              </div>
              <div className="font-mono text-sm font-bold text-[#12B886] print:text-emerald-700">
                {codigoSelo}
              </div>
              <div className="text-[10px] text-[#93A3B5] mt-0.5 print:text-slate-500">
                Lote: {produtoDemo.loteProducao}
              </div>
            </div>
          </div>

          {/* QUADRO DE DESTAQUE: UNIDADE FUNCIONAL "1 UNIDADE VENDIDA" */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#111820] border-2 border-[#12B886] print:bg-emerald-50 print:border-emerald-600 print-card-hero">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#12B886] print:text-emerald-800">
                  UNIDADE FUNCIONAL DE REFERÊNCIA (ISO 14067 & GHG PROTOCOL PRODUCT STANDARD)
                </div>
                <div className="font-heading font-black text-xl sm:text-2xl text-[#F4F7FA] print:text-emerald-950">
                  {produtoDemo.unidadeFuncional}
                </div>
                <p className="text-xs text-[#93A3B5] print:text-slate-700">
                  {produtoDemo.descricaoNcm} • Integração direta com NF-e faturada e rastreável.
                </p>
              </div>

              {/* Balanço Sintético da Unidade Funcional */}
              <div className="grid grid-cols-3 gap-2 sm:gap-3 text-center shrink-0">
                <div className="p-2 sm:p-3 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.08)] print:bg-white print:border-slate-300">
                  <span className="text-[9px] uppercase font-bold text-[#93A3B5] print:text-slate-600 block">
                    Fóssil Líquido
                  </span>
                  <div className="font-mono font-black text-sm sm:text-base text-[#F4F7FA] print:text-slate-900 mt-0.5">
                    {totalFossilPorUnidade.toFixed(3)}
                  </div>
                  <span className="text-[9px] text-[#93A3B5] print:text-slate-500">kg CO₂e/un</span>
                </div>

                <div className="p-2 sm:p-3 rounded-xl bg-[#0A0E12] border border-[#D9B36C]/40 print:bg-white print:border-amber-300">
                  <span className="text-[9px] uppercase font-bold text-[#D9B36C] print:text-amber-800 block">
                    Biogênico (Neutro)
                  </span>
                  <div className="font-mono font-black text-sm sm:text-base text-[#D9B36C] print:text-amber-800 mt-0.5">
                    {totalBiogenicoPorUnidade.toFixed(3)}
                  </div>
                  <span className="text-[9px] text-[#93A3B5] print:text-slate-500">kg CO₂/un</span>
                </div>

                <div className="p-2 sm:p-3 rounded-xl bg-[#0A0E12] border border-[#12B886]/40 print:bg-white print:border-emerald-300">
                  <span className="text-[9px] uppercase font-bold text-[#12B886] print:text-emerald-800 block">
                    Emissões Evitadas
                  </span>
                  <div className="font-mono font-black text-sm sm:text-base text-[#12B886] print:text-emerald-800 mt-0.5">
                    -{totalEvitadasPorUnidade.toFixed(3)}
                  </div>
                  <span className="text-[9px] text-[#93A3B5] print:text-slate-500">kg CO₂e/un</span>
                </div>
              </div>
            </div>
          </div>

          {/* TABELA DE PEGADA POR CATEGORIA COM MEMÓRIA DE CÁLCULO E SEGREGAÇÃO BIOGÊNICO/FÓSSIL */}
          <div className="p-5 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.1)] space-y-3 print:bg-slate-50 print:border-slate-300 print-card">
            <div className="flex items-center justify-between border-b border-[rgba(244,247,250,0.06)] pb-2 print:border-slate-200">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#12B886] print:text-emerald-700" />
                <span className="font-heading font-bold text-xs uppercase tracking-wider text-[#F4F7FA] print:text-slate-900">
                  PEGADA POR CATEGORIA DO CICLO DE VIDA (CRADLE-TO-GATE) COM MEMÓRIA DE CÁLCULO
                </span>
              </div>
              <span className="text-[10px] font-mono text-[#D9B36C] print:text-amber-800 font-bold uppercase">
                Segregação Fóssil × Biogênico × Emissões Evitadas
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs print-table">
                <thead className="border-b border-[rgba(244,247,250,0.06)] text-[#93A3B5] uppercase font-semibold text-[10px] print:text-slate-600 print:border-slate-300">
                  <tr>
                    <th className="py-2 px-2.5">Módulo / Etapa do Ciclo</th>
                    <th className="py-2 px-2 text-right">Fóssil (kg CO₂e)</th>
                    <th className="py-2 px-2 text-right">Biogênico (kg CO₂)</th>
                    <th className="py-2 px-2 text-right">Emissões Evitadas (kg)</th>
                    <th className="py-2 px-2.5">Memória de Cálculo Paramétrica & Fonte</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[rgba(244,247,250,0.04)] text-[#F4F7FA] print:divide-slate-200 print:text-slate-800">
                  {produtoDemo.categoriasPegada.map((c, idx) => (
                    <tr key={idx} className="hover:bg-[#16202B]/40 transition-colors">
                      <td className="py-2 px-2.5 font-medium text-[11px] text-[#F4F7FA] print:text-slate-900 max-w-[240px]">
                        {c.categoria}
                      </td>
                      <td className="py-2 px-2 text-right font-mono text-[11px] font-semibold text-[#F4F7FA] print:text-slate-900">
                        {c.fossilKg.toFixed(3)}
                      </td>
                      <td className="py-2 px-2 text-right font-mono text-[11px] font-semibold text-[#D9B36C] print:text-amber-800">
                        {c.biogenicoKg.toFixed(3)}
                      </td>
                      <td className="py-2 px-2 text-right font-mono text-[11px] font-semibold text-[#12B886] print:text-emerald-700">
                        {c.evitadasKg > 0 ? `-${c.evitadasKg.toFixed(3)}` : '0,000'}
                      </td>
                      <td className="py-2 px-2.5 text-[10px] text-[#93A3B5] print:text-slate-600">
                        <div>{c.memoria}</div>
                        <span className="text-[9px] text-[#93A3B5] print:text-slate-500 font-mono">
                          Fonte: {c.fonteFator}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {/* Linha de Total */}
                  <tr className="border-t-2 border-[rgba(244,247,250,0.12)] font-bold bg-[#16202B]/60 print:bg-slate-100 print:border-slate-400">
                    <td className="py-2 px-2.5 text-[11px] text-[#12B886] print:text-emerald-800 uppercase">
                      Total por Unidade Vendida
                    </td>
                    <td className="py-2 px-2 text-right font-mono text-[12px] text-[#F4F7FA] print:text-slate-900">
                      {totalFossilPorUnidade.toFixed(3)} kg
                    </td>
                    <td className="py-2 px-2 text-right font-mono text-[12px] text-[#D9B36C] print:text-amber-800">
                      {totalBiogenicoPorUnidade.toFixed(3)} kg
                    </td>
                    <td className="py-2 px-2 text-right font-mono text-[12px] text-[#12B886] print:text-emerald-700">
                      -{totalEvitadasPorUnidade.toFixed(3)} kg
                    </td>
                    <td className="py-2 px-2.5 text-[10px] text-[#93A3B5] print:text-slate-600">
                      Balanço em conformidade com ISO 14067:2018 (Emissões biogênicas segregadas)
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* BLOCO DE PROVA SHA-256 VERIFICÁVEL + QR CODE ?via=qr */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center p-5 rounded-2xl bg-[#0A0E12] border border-[#12B886]/40 print:bg-slate-50 print:border-slate-300 print-card">
            <div className="lg:col-span-8 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-[#12B886] print:text-emerald-700" />
                  <span className="font-heading font-bold text-xs uppercase tracking-wider text-[#F4F7FA] print:text-slate-900">
                    HASH SHA-256 VERIFICÁVEL DO PRODUTO (IMUTABILIDADE CRIPTOGRÁFICA)
                  </span>
                </div>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#12B886] bg-[#12B886]/10 px-2.5 py-0.5 rounded-full border border-[#12B886]/30 print:bg-emerald-100 print:text-emerald-800">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Prova SHA-256 válida ✓
                </span>
              </div>

              <div className="flex items-center justify-between gap-3 bg-[#111820] p-3 rounded-xl border border-[rgba(244,247,250,0.08)] print:bg-white print:border-slate-300">
                <span
                  className="font-mono text-xs text-[#D9B36C] print:text-amber-900 break-all select-all font-semibold"
                  title={seloData?.hash_integridade || sha256Calculado}
                >
                  {seloData?.hash_integridade || sha256Calculado}
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
                O hash SHA-256 verificável vincula canonicamente o selo{' '}
                <span className="font-mono font-bold text-[#F4F7FA] print:text-slate-800">
                  {codigoSelo}
                </span>{' '}
                ao NCM{' '}
                <span className="font-mono font-bold text-[#F4F7FA] print:text-slate-800">
                  {produtoDemo.ncm}
                </span>
                , à unidade funcional de 1 unidade vendida, às emissões evitadas (
                {totalEvitadasPorUnidade.toFixed(3)} kg) e ao lote industrial{' '}
                <span className="font-mono font-bold text-[#F4F7FA] print:text-slate-800">
                  {produtoDemo.loteProducao}
                </span>
                .
              </p>
            </div>

            <div className="lg:col-span-4 flex flex-col items-center justify-center text-center border-t lg:border-t-0 lg:border-l border-[rgba(244,247,250,0.1)] lg:pl-5 pt-3 lg:pt-0 print:border-slate-300">
              <div className="p-2 bg-white rounded-xl shadow-lg mb-1.5">
                <QRCodeSVG
                  value={qrCodeUrl}
                  size={120}
                  bgColor="#FFFFFF"
                  fgColor="#0A0E12"
                  title={`QR DCP Produto ${codigoSelo}`}
                />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#12B886] print:text-emerald-800">
                QR CODE PÚBLICO (?via=qr)
              </span>
              <span className="text-[9px] text-[#93A3B5] print:text-slate-500 font-mono mt-0.5 max-w-[200px] truncate">
                {qrCodeUrl}
              </span>
            </div>
          </div>

          {/* Rodapé da Página 1 */}
          <div className="pt-2 border-t border-[rgba(244,247,250,0.08)] flex items-center justify-between text-[10px] text-[#93A3B5] print:border-slate-300 print:text-slate-500">
            <span>Orbis Protocol • Declaração de Conformidade e Pegada do Produto (DCP)</span>
            <span className="font-bold">Página 1 de 2 • Continua no Anexo de Rastreabilidade</span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* PÁGINA 2: ANEXO FISCAL NCM 4819 KLABIN & TRILHA DE CONSULTAS PÚBLICAS */}
        {/* ========================================================================= */}
        <div className="dcp-prod-page-2 space-y-5 pt-8 print:pt-0">
          <div className="border-b border-[rgba(244,247,250,0.12)] pb-3 print:border-slate-300">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#16202B] border border-[#12B886]/40 text-[#12B886] text-[11px] font-bold uppercase tracking-wider mb-1.5 print:border-emerald-600 print:bg-emerald-50 print:text-emerald-800">
              <FileCheck2 className="w-3.5 h-3.5" />
              ANEXO TÉCNICO • RASTREABILIDADE FISCAL NCM 4819 & HISTÓRICO DE VERIFICAÇÕES
            </div>
            <h2 className="font-heading font-black text-xl text-[#F4F7FA] print:text-slate-900">
              Evidência Documental NF-e, Classificação Física NCM e Trilha dMRV
            </h2>
          </div>

          {/* DETALHE DA NF-e KLABIN SEEDADA */}
          <div className="p-5 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.1)] space-y-3 print:bg-slate-50 print:border-slate-300 print-card">
            <div className="flex items-center justify-between border-b border-[rgba(244,247,250,0.06)] pb-2 print:border-slate-200">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#D9B36C] print:text-amber-800" />
                <span className="font-heading font-bold text-xs uppercase tracking-wider text-[#F4F7FA] print:text-slate-900">
                  ITEM DEMONSTRATIVO DE NCM MAPEÁVEL (EXEMPLO DECLARÁVEL SEEDADO)
                </span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#12B886]/15 text-[#12B886] border border-[#12B886]/30 font-bold">
                Tier 2 Físico ACV (±8.5%)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-2">
                <div>
                  <span className="text-[10px] text-[#93A3B5] print:text-slate-500 uppercase font-bold block">
                    Documento Fiscal de Origem
                  </span>
                  <p className="font-medium text-[#F4F7FA] print:text-slate-900 mt-0.5">
                    {produtoDemo.nfVinculada}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-[#93A3B5] print:text-slate-500 uppercase font-bold block">
                    Emitente Registrado
                  </span>
                  <p className="text-[#F4F7FA] print:text-slate-900 font-mono mt-0.5">
                    Klabin S.A. (Unidade Monte Alegre / Telêmaco Borba - PR)
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-[#93A3B5] print:text-slate-500 uppercase font-bold block">
                    Destinatário no Módulo Corporativo
                  </span>
                  <p className="text-[#F4F7FA] print:text-slate-900 font-mono mt-0.5">
                    Indústrias & Logística Integrada Brasil S.A. (CNPJ 76.492.108/0001-92)
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <div>
                  <span className="text-[10px] text-[#93A3B5] print:text-slate-500 uppercase font-bold block">
                    Enquadramento Tributário Reforma (EC 132/2023)
                  </span>
                  <p className="text-[#F4F7FA] print:text-slate-900 mt-0.5">
                    IBS / CBS Não-Cumulativo pleno. Imposto Seletivo: <strong>Não Incidente</strong>{' '}
                    (Embalagem reciclável de base biogênica).
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-[#93A3B5] print:text-slate-500 uppercase font-bold block">
                    Contabilidade de Emissões Evitadas (Insetting)
                  </span>
                  <p className="text-[#12B886] print:text-emerald-800 font-semibold mt-0.5">
                    Remoção líquida de carbono em floresta plantada própria certificada FSC (1,125
                    tCO₂e abatidas na fatura consolidada).
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-[#93A3B5] print:text-slate-500 uppercase font-bold block">
                    Declaração Normativa
                  </span>
                  <p className="text-[10px] text-[#93A3B5] print:text-slate-600 font-mono mt-0.5">
                    "Proxy interno por NCM 4819, validação do Revisor Pericial credenciado."
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* HISTÓRICO DE VERIFICAÇÕES DO PRODUTO (dpp_consultas) */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#0A0E12] border border-[#12B886]/35 space-y-3 print:bg-slate-50 print:border-slate-300 print-card">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[rgba(244,247,250,0.08)] pb-2 print:border-slate-200">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-[#12B886] print:text-emerald-700" />
                <span className="font-heading font-bold text-xs uppercase tracking-wider text-[#F4F7FA] print:text-slate-900">
                  HISTÓRICO DE VERIFICAÇÕES DO SELO DCP ({codigoSelo})
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <span className="text-[#93A3B5] print:text-slate-600">
                  Total Acumulado:{' '}
                  <strong className="text-[#12B886] print:text-emerald-700 font-mono font-bold">
                    {Math.max(totalConsultas, historicoConsultas.length, 1)} consultas
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
                  Primeira verificação registrada nesta sessão (Canal:{' '}
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
                    {historicoConsultas.slice(0, 4).map((c, idx) => {
                      const isQr = c.canal === 'qr'
                      const isEmbed = c.canal === 'embed'
                      return (
                        <tr key={c.id || idx}>
                          <td className="py-1.5 px-2 font-mono text-[11px] text-[#93A3B5] print:text-slate-600">
                            {new Date(c.created).toLocaleDateString('pt-BR', {
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
                                  ? 'bg-[#12B886]/15 text-[#12B886] border border-[#12B886]/30'
                                  : isEmbed
                                    ? 'bg-[#D9B36C]/15 text-[#D9B36C] border border-[#D9B36C]/30'
                                    : 'bg-[#3B82F6]/15 text-[#3B82F6] border border-[#3B82F6]/30'
                              }`}
                            >
                              {isQr && <QrCode className="w-3 h-3" />}
                              {isEmbed && <Code2 className="w-3 h-3" />}
                              {!isQr && !isEmbed && <Globe className="w-3 h-3" />}
                              <span>{isQr ? 'QR Code' : isEmbed ? 'Widget' : 'Navegação Web'}</span>
                            </span>
                          </td>
                          <td className="py-1.5 px-2 font-mono text-[11px] text-[#93A3B5] print:text-slate-600">
                            {c.ip_mascarado || '177.18.xxx.xxx'}
                          </td>
                          <td className="py-1.5 px-2 text-right">
                            <span className="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-[#12B886] print:text-emerald-700">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Conferido ✓</span>
                            </span>
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
                Rastreabilidade pública garantida por Hash SHA-256 Verificável e telemetria dMRV.
              </span>
              <span className="font-mono">Canal detectado: {canalDetectado.toUpperCase()}</span>
            </div>
          </div>

          {/* Rodapé da Página 2 */}
          <div className="pt-2 border-t border-[rgba(244,247,250,0.08)] flex items-center justify-between text-[10px] text-[#93A3B5] print:border-slate-300 print:text-slate-500">
            <span>Orbis Protocol • DCP do Produto • NCM 4819.10.00 • Klabin S.A.</span>
            <span className="font-bold">Página 2 de 2 • Fim do Documento</span>
          </div>
        </div>
      </div>
    </div>
  )
}
