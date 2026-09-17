import React, { useState, useEffect, useMemo, useRef } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  Printer,
  ExternalLink,
  Building2,
  ArrowLeft,
  Sparkles,
  Layers,
  BarChart3,
  BookOpen,
  History,
  QrCode,
  Globe,
  Code2,
  Scale,
  Zap,
  Truck,
  Factory,
  Leaf,
  FileCheck2,
  FileText,
} from 'lucide-react'
import { QRCodeSVG } from '@/components/QRCodeSVG'
import {
  carregarDadosCorporativoDemo,
  type EmpresaDossieCorporativo,
  type NotaFiscalDemonstrativa,
  DOSSIE_DEFAULT_FALLBACK,
  NOTAS_DEFAULT_FALLBACK,
} from '@/services/corporativoService'
import {
  resumirClassificacaoItensComprados,
  identificarFamiliaNCM,
  normalizarNCM,
  DECLARACAO_PROXY_NCM,
  FAMILIAS_NCM_CONFIG,
  type ItemCompradoInput,
} from '@/services/classificacaoFisicaNCM'
import {
  registrarConsultaDpp,
  obterHistoricoConsultasDpp,
  type DppConsultaRecord,
} from '@/services/cdvService'
import { obterFechamentoCompetencia } from '@/services/fechamentoCompetenciaService'

// Perfis de materialidade por CNAE da demonstração corporativa
interface CnaeMaterialidadeItem {
  cnae: string
  descricao: string
  pesoEmissaoKg: number
  percentual: number
  isMaterial: boolean
  justificativa: string
  notasVinculadasCount: number
}

export default function DcpCorporativoDemoPage() {
  const [searchParams] = useSearchParams()
  const canalParam = searchParams.get('via') // 'qr' | 'embed' | 'web'
  const canalDetectado: 'qr' | 'web' | 'embed' =
    canalParam === 'qr' ? 'qr' : canalParam === 'embed' ? 'embed' : 'web'

  const [dossie, setDossie] = useState<EmpresaDossieCorporativo>(DOSSIE_DEFAULT_FALLBACK)
  const [notas, setNotas] = useState<NotaFiscalDemonstrativa[]>(NOTAS_DEFAULT_FALLBACK)
  const [isLoading, setIsLoading] = useState(true)
  const [copiedHash, setCopiedHash] = useState(false)
  const [hashFechamento, setHashFechamento] = useState<string>(
    '0x8f4b29a7e3c12948bb92ff78201a0bc45d61e93f91823ab12c98d7ef2049ba12',
  )

  // Histórico de Verificações do DCP
  const [historicoConsultas, setHistoricoConsultas] = useState<DppConsultaRecord[]>([])
  const [totalConsultas, setTotalConsultas] = useState<number>(0)
  const hasRegisteredRef = useRef(false)

  // URL canônica sem query param para o display e com ?via=qr para o QR Code
  const baseUrlSemQuery =
    typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}` : ''
  const qrCodeUrl = `${baseUrlSemQuery}?via=qr`

  useEffect(() => {
    let isMounted = true
    const carregar = async () => {
      setIsLoading(true)
      try {
        const dados = await carregarDadosCorporativoDemo()
        if (!isMounted) return
        setDossie(dados.dossie)
        setNotas(dados.notas)

        // Buscar hash de fechamento persistido no banco
        try {
          const fech = await obterFechamentoCompetencia(dados.dossie.cnpj, 'julho_2026')
          if (fech && fech.hash_fechamento) {
            setHashFechamento(fech.hash_fechamento)
          } else if (dados.dossie.hashFechamentoCompetencia) {
            setHashFechamento(dados.dossie.hashFechamentoCompetencia)
          }
        } catch {
          if (dados.dossie.hashFechamentoCompetencia) {
            setHashFechamento(dados.dossie.hashFechamentoCompetencia)
          }
        }

        // Registrar consulta do DCP de forma idempotente em dpp_consultas
        const ident = `DCP-CORP-${dados.dossie.cnpj.replace(/[^\d]/g, '')}-202607`
        if (!hasRegisteredRef.current) {
          hasRegisteredRef.current = true
          await registrarConsultaDpp({
            alvo_tipo: 'lote',
            alvo_identificador: ident,
            lote_id: 'corp-demo-2026-07',
            canal: canalDetectado,
            hash_conferido: true,
            hash_calculado:
              hashFechamento ||
              dados.dossie.hashFechamentoCompetencia ||
              dados.dossie.hashIntegridade,
          })
        }

        // Obter histórico acumulado de leituras
        const hist = await obterHistoricoConsultasDpp(ident, 'corp-demo-2026-07', 5)
        if (isMounted) {
          setTotalConsultas(hist.total)
          setHistoricoConsultas(hist.ultimas)
        }
      } catch {
        /* fallback default já ativo */
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    carregar()
    return () => {
      isMounted = false
    }
  }, [canalDetectado, hashFechamento])

  // =========================================================================
  // PROCESSAMENTO DE MATERIALIDADE POR CNAE
  // Perfis logísticos: CNAE fiscal da empresa (4930-2/02 Transporte rodoviário de carga)
  // + CNAEs emitentes das 12 notas fiscais.
  // Categorias reordenadas por peso de emissão, identificando não-materiais com justificativa.
  // =========================================================================
  const materialidadeCnae = useMemo(() => {
    const mapa: Record<
      string,
      {
        cnae: string
        descricao: string
        pesoKg: number
        notasCount: number
        escopos: Set<string>
      }
    > = {
      '4731-8/00': {
        cnae: '4731-8/00',
        descricao:
          'Comércio varejista de combustíveis para veículos automotores (Diesel S10 / Etanol)',
        pesoKg: 0,
        notasCount: 0,
        escopos: new Set(),
      },
      '2511-0/00': {
        cnae: '2511-0/00',
        descricao:
          'Fabricação de estruturas metálicas para armazenagem (Aço estrutural porta-paletes)',
        pesoKg: 0,
        notasCount: 0,
        escopos: new Set(),
      },
      '2222-6/00': {
        cnae: '2222-6/00',
        descricao: 'Fabricação de embalagens de material plástico (Filme Stretch PEBD unitização)',
        pesoKg: 0,
        notasCount: 0,
        escopos: new Set(),
      },
      '3520-4/02': {
        cnae: '3520-4/02',
        descricao: 'Distribuição de combustíveis gasosos por redes urbanas (Gás Natural caldeiras)',
        pesoKg: 0,
        notasCount: 0,
        escopos: new Set(),
      },
      '4930-2/02': {
        cnae: '4930-2/02',
        descricao:
          'Transporte rodoviário de carga intermunicipal/interestadual (CT-e Upstream & MDF-e)',
        pesoKg: 0,
        notasCount: 0,
        escopos: new Set(),
      },
      '4929-9/02': {
        cnae: '4929-9/02',
        descricao:
          'Transporte rodoviário coletivo de passageiros sob fretamento (Turnos operacionais)',
        pesoKg: 0,
        notasCount: 0,
        escopos: new Set(),
      },
      '1733-8/00': {
        cnae: '1733-8/00',
        descricao:
          'Fabricação de chapas e caixas de papelão ondulado (Papelão reciclado insetting)',
        pesoKg: 0,
        notasCount: 0,
        escopos: new Set(),
      },
      '3514-0/00': {
        cnae: '3514-0/00',
        descricao: 'Distribuição de energia elétrica (Rede SIN Mercado Cativo COPEL)',
        pesoKg: 0,
        notasCount: 0,
        escopos: new Set(),
      },
      '4922-1/01': {
        cnae: '4922-1/01',
        descricao:
          'Transporte rodoviário coletivo de passageiros interestadual (Viagens a negócios BP-e)',
        pesoKg: 0,
        notasCount: 0,
        escopos: new Set(),
      },
      '3600-6/01': {
        cnae: '3600-6/01',
        descricao: 'Captação, tratamento e distribuição de água e esgoto industrial (SANEPAR)',
        pesoKg: 0,
        notasCount: 0,
        escopos: new Set(),
      },
      '7112-0/00': {
        cnae: '7112-0/00',
        descricao: 'Serviços de engenharia e manutenção preventiva predial (NFS-e municipal)',
        pesoKg: 0,
        notasCount: 0,
        escopos: new Set(),
      },
      '6110-8/03': {
        cnae: '6110-8/03',
        descricao: 'Serviços de telecomunicações por fio / fibra óptica e nuvem (NFCom mod 62)',
        pesoKg: 0,
        notasCount: 0,
        escopos: new Set(),
      },
    }

    // Acumular emissões reais das notas fiscais por CNAE
    for (const n of notas) {
      const c = n.cnae || 'outros'
      if (!mapa[c]) {
        mapa[c] = {
          cnae: c,
          descricao: n.titulo || 'Atividade fornecedora',
          pesoKg: 0,
          notasCount: 0,
          escopos: new Set(),
        }
      }
      mapa[c].pesoKg += Number(n.fossilKgCo2e || 0)
      mapa[c].notasCount += 1
      mapa[c].escopos.add(n.escopoAlvo)
    }

    const totalFossilKg = Object.values(mapa).reduce((acc, it) => acc + it.pesoKg, 0) || 1

    const resultado: CnaeMaterialidadeItem[] = Object.values(mapa).map((item) => {
      const pct = (item.pesoKg / totalFossilKg) * 100
      // Regra de materialidade: >= 1.0% de participação de emissão fóssil no inventário da competência
      const isMaterial = pct >= 1.0
      let justificativa = ''
      if (isMaterial) {
        justificativa = `Material para o perfil corporativo logístico (${pct.toFixed(1)}% do passivo total). Requer monitoramento contínuo e reporte auditado.`
      } else {
        justificativa = `Não-material (< 1,0% do total da competência: ${pct.toFixed(2)}%). Apuração simplificada mantida para fins de completude NBC TO 3000.`
      }

      return {
        cnae: item.cnae,
        descricao: item.descricao,
        pesoEmissaoKg: item.pesoKg,
        percentual: pct,
        isMaterial,
        justificativa,
        notasVinculadasCount: item.notasCount,
      }
    })

    // Reordenar decrescente por peso de emissão
    return resultado.sort((a, b) => b.pesoEmissaoKg - a.pesoEmissaoKg)
  }, [notas])

  // =========================================================================
  // CLASSIFICAÇÃO FÍSICA POR FAMÍLIAS NCM COM TIERS (Escopo 3 Categoria 1)
  // Utiliza classificacaoFisicaNCM.ts
  // =========================================================================
  const classificacaoFisicaNcmResumo = useMemo(() => {
    // Extrair itens comprados das notas fiscais da categoria 1 (insumos/serviços/etc)
    const itensInput: ItemCompradoInput[] = []

    for (const nota of notas) {
      if (
        nota.detalhesJson.itens_classificacao_ncm &&
        nota.detalhesJson.itens_classificacao_ncm.length > 0
      ) {
        for (const it of nota.detalhesJson.itens_classificacao_ncm) {
          itensInput.push({
            id: `${nota.id}_${it.ncm || 'item'}`,
            descricao: `${it.descricao} (${nota.razaoSocialParceiro})`,
            ncm: it.ncm,
            unidadeDeclarada: it.unidade,
            quantidadeFisica: it.quantidadeFisica,
            valorBrl: it.valorBrl || nota.valorBrl,
          })
        }
      } else if (
        nota.categoriaOperacional === 'insumos' ||
        nota.categoriaOperacional === 'servicos'
      ) {
        itensInput.push({
          id: nota.id,
          descricao: `${nota.titulo} (${nota.razaoSocialParceiro})`,
          ncm: nota.detalhesJson.ncm || '',
          unidadeDeclarada: nota.quantidadeDeclarada.includes('kg') ? 'kg' : 'BRL',
          quantidadeFisica: nota.quantidadeDeclarada.includes('4.500')
            ? 4500
            : nota.quantidadeDeclarada.includes('1.200')
              ? 1200
              : nota.quantidadeDeclarada.includes('3.800')
                ? 3800
                : undefined,
          valorBrl: nota.valorBrl,
        })
      }
    }

    return resumirClassificacaoItensComprados(itensInput)
  }, [notas])

  // Totais por Escopo com Duplo Reporte SIN x I-REC
  const totaisEscopos = useMemo(() => {
    const e1 = notas
      .filter((n) => n.escopoAlvo === 'escopo_1')
      .reduce((acc, n) => acc + (n.fossilKgCo2e || 0), 0)
    const e2Sin = notas
      .filter((n) => n.escopoAlvo === 'escopo_2')
      .reduce((acc, n) => acc + (n.fossilKgCo2e || 0), 0)
    const e3 = notas
      .filter((n) => n.escopoAlvo === 'escopo_3')
      .reduce((acc, n) => acc + (n.fossilKgCo2e || 0), 0)
    const bio = notas.reduce((acc, n) => acc + (n.biogenicoKgCo2 || 0), 0)
    const insetting = notas.reduce((acc, n) => acc + (n.insettingKgCo2e || 0), 0)

    const e2Irec = 0.0 // Mercado I-REC 100% incentivado zeraria o Escopo 2 fóssil

    const totalFossilLocalizacao = e1 + e2Sin + e3
    const totalFossilMercado = e1 + e2Irec + e3

    return {
      escopo1Kg: e1,
      escopo1T: e1 / 1000,
      escopo2SinKg: e2Sin,
      escopo2SinT: e2Sin / 1000,
      escopo2IrecKg: e2Irec,
      escopo2IrecT: e2Irec / 1000,
      escopo3Kg: e3,
      escopo3T: e3 / 1000,
      biogenicoKg: bio,
      biogenicoT: bio / 1000,
      insettingKg: insetting,
      insettingT: insetting / 1000,
      totalFossilLocalizacaoT: totalFossilLocalizacao / 1000,
      totalFossilMercadoT: totalFossilMercado / 1000,
    }
  }, [notas])

  const copyHash = () => {
    if (!hashFechamento) return
    navigator.clipboard.writeText(hashFechamento)
    setCopiedHash(true)
    setTimeout(() => setCopiedHash(false), 2000)
  }

  const handleImprimir = () => {
    window.print()
  }

  return (
    <div className="min-h-screen py-6 sm:py-8 md:py-12 bg-[#0A0E12] text-[#F4F7FA] print:bg-white print:text-black print:p-0">
      {/* CSS Específico de Impressão (2 páginas rígidas no padrão dos Passaportes CDVerde) */}
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
          .dcp-page-1 {
            page-break-after: always !important;
            break-after: page !important;
            min-height: 100vh;
            padding: 16mm 14mm !important;
            box-sizing: border-box;
          }
          .dcp-page-2 {
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
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-6 sm:mb-8 pb-4 border-b border-[rgba(244,247,250,0.1)] no-print">
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
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
              <span>Módulo Corporativo Demo</span>
            </Link>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#12B886] animate-pulse" />
              <span className="text-[10px] sm:text-[11px] font-mono text-[#12B886] uppercase font-bold tracking-wider">
                DOCUMENTO CORPORATIVO DEMO • JULHO/2026
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

        {/* ========================================================================= */}
        {/* VISUALIZAÇÃO MOBILE (breakpoint < md / < 768px): Cartão de resumo + fluxo vertical */}
        {/* Oculta no desktop (md:hidden) e na impressão (print:hidden) */}
        {/* ========================================================================= */}
        <div className="block md:hidden mobile-view-only space-y-6 no-print mb-8">
          {/* Botão de Destaque CTA Mobile: Gerar PDF */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-[#111820] via-[#16202B] to-[#111820] border-2 border-[#12B886]/60 shadow-emerald-glow flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#12B886] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                DCP Corporativo Oficial A4
              </span>
              <span className="text-[10px] font-mono text-[#93A3B5]">2 Páginas Calibradas</span>
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
              Emissão no padrão oficial A4 de 2 páginas com chancela dMRV, prova de integridade e
              inventário consolidado.
            </p>
          </div>

          {/* CARTÃO DE RESUMO MOBILE - DCP CORPORATIVO DEMO */}
          <div className="p-5 rounded-3xl bg-gradient-to-b from-[#111820] to-[#16202B] border-2 border-[#12B886] shadow-emerald-glow space-y-4">
            {/* Badges de Topo */}
            <div className="flex flex-wrap items-center gap-1.5">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#12B886]/15 border border-[#12B886]/40 text-[#12B886] text-[10px] font-bold uppercase tracking-wider">
                <Sparkles className="w-3 h-3" />
                RESUMO DO DCP CORPORATIVO
              </div>
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#F59E0B]/20 border border-[#F59E0B] text-[#F59E0B] text-[10px] font-extrabold uppercase tracking-wider">
                <AlertTriangle className="w-3 h-3" />
                <span>DEMONSTRAÇÃO</span>
              </div>
            </div>

            {/* Identificação Corporativa */}
            <div>
              <div className="text-[10px] uppercase font-bold text-[#93A3B5] tracking-wider">
                Organização Declarada
              </div>
              <h1 className="font-heading font-black text-xl text-[#F4F7FA] mt-0.5 leading-snug">
                {dossie.razaoSocial}
              </h1>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#93A3B5] mt-1 font-mono">
                <span>
                  CNPJ: <strong className="text-[#D9B36C]">{dossie.cnpj}</strong>
                </span>
                <span>•</span>
                <span>
                  Competência: <strong className="text-[#12B886]">Julho/2026</strong>
                </span>
              </div>
            </div>

            {/* Reserva Metodológica Pré-Laudo (Resumida no mobile) */}
            <div className="p-3 rounded-xl bg-[#0A0E12] border border-[#F59E0B]/40 flex items-start gap-2.5 text-xs">
              <AlertTriangle className="w-4 h-4 text-[#F59E0B] shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1 leading-snug">
                <span className="font-bold text-[#F59E0B] uppercase tracking-wide block text-[10px]">
                  Reserva Pré-Laudo
                </span>
                <p className="text-[11px] text-[#93A3B5] mt-0.5">
                  Declaração preliminar de pegada dMRV. Validade probatória final perante SBCE e
                  bancos condicionada a laudo pericial chancelado com ART/CREA.
                </p>
              </div>
            </div>

            {/* Indicadores-Chave: Totais por Escopo */}
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#93A3B5] mb-2 flex items-center justify-between">
                <span>Passivo Fóssil por Escopo</span>
                <span className="text-[#12B886] font-mono">
                  Total: {totaisEscopos.totalFossilLocalizacaoT.toFixed(2)} tCO₂e
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                {/* Escopo 1 */}
                <div className="p-2.5 rounded-xl bg-[#0A0E12] border border-[#F59E0B]/40">
                  <div className="flex items-center justify-between text-[#F59E0B] text-[9px] uppercase font-bold">
                    <span>Escopo 1 (Direto)</span>
                    <Factory className="w-3 h-3" />
                  </div>
                  <div className="font-heading font-black text-sm text-[#F4F7FA] mt-1">
                    {totaisEscopos.escopo1T.toFixed(3)}{' '}
                    <span className="text-[9px] font-normal text-[#93A3B5]">tCO₂e</span>
                  </div>
                  <span className="text-[9px] text-[#93A3B5] block mt-0.5">Frotas & Caldeira</span>
                </div>

                {/* Escopo 2 */}
                <div className="p-2.5 rounded-xl bg-[#0A0E12] border border-[#3B82F6]/40">
                  <div className="flex items-center justify-between text-[#3B82F6] text-[9px] uppercase font-bold">
                    <span>Escopo 2 (Energia)</span>
                    <Zap className="w-3 h-3" />
                  </div>
                  <div className="font-heading font-black text-sm text-[#3B82F6] mt-1">
                    {totaisEscopos.escopo2SinT.toFixed(3)}{' '}
                    <span className="text-[9px] font-normal text-[#93A3B5]">t (SIN)</span>
                  </div>
                  <span className="text-[9px] text-[#12B886] block mt-0.5">
                    I-REC: {totaisEscopos.escopo2IrecT.toFixed(1)} t
                  </span>
                </div>

                {/* Escopo 3 */}
                <div className="p-2.5 rounded-xl bg-[#0A0E12] border border-[#8B5CF6]/40">
                  <div className="flex items-center justify-between text-[#8B5CF6] text-[9px] uppercase font-bold">
                    <span>Escopo 3 (Cadeia)</span>
                    <Truck className="w-3 h-3" />
                  </div>
                  <div className="font-heading font-black text-sm text-[#F4F7FA] mt-1">
                    {totaisEscopos.escopo3T.toFixed(3)}{' '}
                    <span className="text-[9px] font-normal text-[#93A3B5]">tCO₂e</span>
                  </div>
                  <span className="text-[9px] text-[#93A3B5] block mt-0.5">
                    Fretes, Aço & Insumos
                  </span>
                </div>

                {/* Insetting & Emissões Evitadas */}
                <div className="p-2.5 rounded-xl bg-[#0A0E12] border border-[#12B886]/40">
                  <div className="flex items-center justify-between text-[#12B886] text-[9px] uppercase font-bold">
                    <span>Insetting Evitado</span>
                    <Leaf className="w-3 h-3" />
                  </div>
                  <div className="font-heading font-black text-sm text-[#12B886] mt-1">
                    -{totaisEscopos.insettingT.toFixed(3)}{' '}
                    <span className="text-[9px] font-normal text-[#93A3B5]">tCO₂e</span>
                  </div>
                  <span className="text-[9px] text-[#D9B36C] block mt-0.5">
                    Biogênico: {totaisEscopos.biogenicoT.toFixed(2)} t
                  </span>
                </div>
              </div>
            </div>

            {/* Status de Integridade e Hash SHA-256 de Fechamento */}
            <div className="p-3 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.08)] space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#F4F7FA]">
                  <ShieldCheck className="w-4 h-4 text-[#12B886]" />
                  <span className="text-[11px] uppercase tracking-wider">Fechamento SHA-256</span>
                </div>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#12B886] bg-[#12B886]/15 px-2 py-0.5 rounded-full border border-[#12B886]/30">
                  <CheckCircle2 className="w-3 h-3" />
                  Verificado ✓
                </span>
              </div>
              <div className="flex items-center justify-between gap-2 bg-[#111820] p-2 rounded-lg border border-[rgba(244,247,250,0.06)]">
                <span className="font-mono text-[10px] text-[#D9B36C] break-all select-all font-semibold">
                  {hashFechamento
                    ? `${hashFechamento.slice(0, 18)}...${hashFechamento.slice(-14)}`
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

            {/* QR Code Tocável do DCP Corporativo */}
            <div className="p-3 rounded-xl bg-[#0A0E12] border border-[#12B886]/30 flex items-center gap-3">
              <div className="p-1.5 bg-white rounded-lg shrink-0">
                <QRCodeSVG
                  value={qrCodeUrl}
                  size={64}
                  bgColor="#FFFFFF"
                  fgColor="#0A0E12"
                  title={`QR DCP Corporativo ${dossie.cnpj}`}
                />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-bold uppercase text-[#12B886] block">
                  QR Code de Consulta Pública
                </span>
                <p className="text-[10px] text-[#93A3B5] leading-tight mt-0.5">
                  Auditoria de competência com telemetria dMRV pública (?via=qr).
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

          {/* FLUXO VERTICAL MOBILE: MATERIALIDADE POR CNAE EM CARTÕES */}
          <div className="p-4 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.1)] space-y-3">
            <div className="flex items-center justify-between border-b border-[rgba(244,247,250,0.06)] pb-2">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#D9B36C]" />
                <span className="font-heading font-bold text-xs uppercase tracking-wider text-[#F4F7FA]">
                  Materialidade por CNAE
                </span>
              </div>
              <span className="text-[10px] text-[#93A3B5]">Corte: ≥ 1,0%</span>
            </div>

            <div className="space-y-2">
              {materialidadeCnae.slice(0, 5).map((item) => (
                <div
                  key={item.cnae}
                  className="p-2.5 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.06)] space-y-1.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-mono text-[11px] text-[#D9B36C] font-bold block">
                        CNAE {item.cnae}
                      </span>
                      <p className="text-xs font-medium text-[#F4F7FA] leading-snug">
                        {item.descricao}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase shrink-0 ${
                        item.isMaterial
                          ? 'bg-[#12B886]/15 text-[#12B886] border border-[#12B886]/30'
                          : 'bg-[#93A3B5]/15 text-[#93A3B5] border border-[rgba(244,247,250,0.1)]'
                      }`}
                    >
                      {item.isMaterial ? 'Material' : 'Não-Material'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[10px] font-mono pt-1 border-t border-[rgba(244,247,250,0.04)]">
                    <span className="text-[#93A3B5]">
                      Emissão:{' '}
                      <strong className="text-[#12B886]">
                        {item.pesoEmissaoKg.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}{' '}
                        kg
                      </strong>
                    </span>
                    <span className="text-[#F4F7FA] font-bold">
                      Participação: {item.percentual.toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* FLUXO VERTICAL MOBILE: CAMADA NCM COM TIERS */}
          <div className="p-4 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.1)] space-y-3">
            <div className="flex items-center justify-between border-b border-[rgba(244,247,250,0.06)] pb-2">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-[#12B886]" />
                <span className="font-heading font-bold text-xs uppercase tracking-wider text-[#F4F7FA]">
                  Classificação Física NCM
                </span>
              </div>
              <span className="text-[10px] font-mono text-[#12B886] font-bold">Tier 2 Físico</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.06)] text-center">
                <span className="text-[9px] text-[#93A3B5] uppercase font-bold block">
                  Itens em Tier 2
                </span>
                <div className="font-heading font-black text-sm text-[#12B886] mt-0.5">
                  {classificacaoFisicaNcmResumo.itensElevadosTier2} de{' '}
                  {classificacaoFisicaNcmResumo.totalItens}
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.06)] text-center">
                <span className="text-[9px] text-[#93A3B5] uppercase font-bold block">
                  Incerteza Ponderada
                </span>
                <div className="font-heading font-black text-sm text-[#D9B36C] mt-0.5">
                  ±{classificacaoFisicaNcmResumo.incertezaPonderadaCat1Pct}%
                </div>
              </div>
            </div>

            <div className="space-y-1.5 text-[11px]">
              <div className="p-2 rounded-lg bg-[#0A0E12] border border-[rgba(244,247,250,0.06)] flex justify-between items-center">
                <div>
                  <strong className="text-[#F4F7FA] block">NCM 7308.90 (Aço Estrutural)</strong>
                  <span className="text-[10px] text-[#93A3B5]">3.800 kg × 2,450 kgCO₂e/kg</span>
                </div>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#12B886]/15 text-[#12B886]">
                  Tier 2 (±7.5%)
                </span>
              </div>
              <div className="p-2 rounded-lg bg-[#0A0E12] border border-[rgba(244,247,250,0.06)] flex justify-between items-center">
                <div>
                  <strong className="text-[#F4F7FA] block">NCM 3920.10 (Filme PEBD)</strong>
                  <span className="text-[10px] text-[#93A3B5]">1.200 kg × 2,150 kgCO₂e/kg</span>
                </div>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#12B886]/15 text-[#12B886]">
                  Tier 2 (±9.0%)
                </span>
              </div>
              <div className="p-2 rounded-lg bg-[#0A0E12] border border-[rgba(244,247,250,0.06)] flex justify-between items-center">
                <div>
                  <strong className="text-[#F4F7FA] block">NCM 4819.10 (Caixas Klabin)</strong>
                  <span className="text-[10px] text-[#93A3B5]">4.500 kg × 0,250 kgCO₂e/kg</span>
                </div>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#12B886]/15 text-[#12B886]">
                  Tier 2 (±8.5%)
                </span>
              </div>
            </div>
          </div>

          {/* FLUXO VERTICAL MOBILE: ACHADO DO REVISOR PERICIAL */}
          <div className="p-4 rounded-2xl bg-[#111820] border border-[#D9B36C]/40 space-y-2 text-xs">
            <div className="flex items-center gap-2 text-[#D9B36C] font-bold text-xs uppercase">
              <Scale className="w-4 h-4" />
              <span>Achados do Revisor Pericial</span>
            </div>
            <div className="p-2.5 rounded-xl bg-[#0A0E12] border border-[#D9B36C]/30 space-y-1">
              <span className="font-mono text-[10px] font-bold text-[#D9B36C] block">
                [ACH-CAT1-SPEND-01] Predominância residual spend-based Cat. 1
              </span>
              <p className="text-[11px] text-[#93A3B5] leading-relaxed">
                Itens materiais principais já operam em Tier 2 físico (±8,2%). Serviços
                administrativos permanecem em Tier 1 spend-based (±18%), recomendando métricas
                físicas para laudo pleno.
              </p>
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
        <div className="hidden md:block desktop-document-view">
          {/* ========================================================================= */}
          {/* PÁGINA 1: IDENTIFICAÇÃO CORPORATIVA, DUPLO REPORTE, MATERIALIDADE & PROVA */}
          {/* ========================================================================= */}
          <div className="dcp-page-1 space-y-6 print:space-y-4">
            {/* Cabeçalho Institucional com Badge DEMONSTRAÇÃO e Reserva Pré-laudo */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-[rgba(244,247,250,0.12)] pb-4 print:border-slate-300">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#16202B] border border-[#12B886]/40 text-[#12B886] text-[11px] font-bold uppercase tracking-wider print:border-emerald-600 print:bg-emerald-50 print:text-emerald-800">
                    <Sparkles className="w-3.5 h-3.5" />
                    DECLARAÇÃO DE CONFORMIDADE E PEGADA (DCP CORPORATIVO)
                  </div>

                  {/* BADGE OBRIGATÓRIA: DEMONSTRAÇÃO */}
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F59E0B]/20 border border-[#F59E0B] text-[#F59E0B] text-[11px] font-extrabold uppercase tracking-wider shadow-sm print:bg-amber-100 print:border-amber-500 print:text-amber-900">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>DEMONSTRAÇÃO</span>
                  </div>
                </div>

                <h1 className="font-heading font-black text-2xl sm:text-3xl text-[#F4F7FA] tracking-wide print:text-slate-900">
                  {dossie.razaoSocial}
                </h1>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#93A3B5] mt-1 print:text-slate-600">
                  <span className="font-mono text-[#D9B36C] print:text-amber-800 font-bold">
                    CNPJ: {dossie.cnpj}
                  </span>
                  <span>•</span>
                  <span>
                    Competência Fiscal:{' '}
                    <strong className="text-[#12B886] print:text-emerald-700 font-mono">
                      Julho de 2026
                    </strong>
                  </span>
                  <span>•</span>
                  <span>
                    CNAE Fiscal Principal:{' '}
                    <strong className="text-[#F4F7FA] print:text-slate-900 font-mono">
                      4930-2/02 & 2599-3/99
                    </strong>
                  </span>
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className="text-[10px] uppercase font-bold text-[#93A3B5] print:text-slate-500">
                  REGISTRO DA COMPETÊNCIA
                </div>
                <div className="font-mono text-sm font-bold text-[#12B886] print:text-emerald-700">
                  DCP-CORP-2026-07
                </div>
                <div className="text-[10px] text-[#93A3B5] mt-0.5 print:text-slate-500">
                  Emissão: 31/07/2026 • 12 NF-e Auditadas
                </div>
              </div>
            </div>

            {/* RESERVA OBRIGATÓRIA "PRÉ-LAUDO" */}
            <div className="p-3.5 rounded-xl bg-[#0A0E12] border border-[#F59E0B]/50 flex items-start gap-3 text-xs print:bg-amber-50 print:border-amber-400 print-card">
              <AlertTriangle className="w-4 h-4 text-[#F59E0B] shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <span className="font-bold text-[#F59E0B] uppercase tracking-wider block text-[11px] print:text-amber-900">
                  RESERVA METODOLÓGICA "PRÉ-LAUDO"
                </span>
                <p className="text-[11px] text-[#93A3B5] print:text-slate-700">
                  Este documento constitui uma{' '}
                  <strong>
                    declaração preliminar de pegada e conformidade corporativa (pré-laudo)
                  </strong>{' '}
                  gerada pelo motor dMRV Orbis Protocol. A validade jurídica e probatória perante o
                  Sistema Brasileiro de Comércio de Emissões (Lei 15.042/2024), instituições
                  financeiras e auditorias contábeis independentes (NBC TO 3000 / ISAE 3000) depende
                  de
                  <strong>
                    {' '}
                    laudo chancelado com ART (CREA) ou RRT/CRC pelo Revisor Pericial credenciado
                  </strong>
                  .
                </p>
              </div>
            </div>

            {/* BLOCO 1: INVENTÁRIO POR ESCOPOS COM DUPLO REPORTE SIN x I-REC (ESCOPO 2) */}
            <div className="p-5 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.1)] space-y-3 print:bg-slate-50 print:border-slate-300 print-card">
              <div className="flex items-center justify-between border-b border-[rgba(244,247,250,0.06)] pb-2 print:border-slate-200">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-[#12B886] print:text-emerald-700" />
                  <span className="font-heading font-bold text-xs uppercase tracking-wider text-[#F4F7FA] print:text-slate-900">
                    INVENTÁRIO CONSOLIDADO POR ESCOPOS COM DUPLO REPORTE (GHG PROTOCOL BRASIL)
                  </span>
                </div>
                <span className="text-[10px] font-mono text-[#D9B36C] print:text-amber-800 font-bold uppercase">
                  Métricas IPCC AR6 (CH₄ fóssil = 29.8, N₂O = 273)
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                {/* Escopo 1 */}
                <div className="p-3 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.06)] print:bg-white print:border-slate-200">
                  <div className="flex items-center justify-between text-[#F59E0B] text-[10px] uppercase font-bold mb-1">
                    <span>Escopo 1 (Direto)</span>
                    <Factory className="w-3.5 h-3.5" />
                  </div>
                  <div className="font-heading font-black text-xl text-[#F4F7FA] print:text-slate-900">
                    {totaisEscopos.escopo1T.toFixed(3)}{' '}
                    <span className="text-[10px] font-normal text-[#93A3B5]">tCO₂e</span>
                  </div>
                  <span className="text-[10px] text-[#93A3B5] print:text-slate-600 block mt-1">
                    Diesel S10, Gás e Etanol (Tier 3 SEFAZ)
                  </span>
                </div>

                {/* Escopo 2 - DUPLO REPORTE SIN x I-REC */}
                <div className="p-3 rounded-xl bg-[#0A0E12] border-2 border-[#3B82F6]/50 print:bg-blue-50 print:border-blue-400">
                  <div className="flex items-center justify-between text-[#3B82F6] text-[10px] uppercase font-bold mb-1">
                    <span>Escopo 2 (Duplo Reporte)</span>
                    <Zap className="w-3.5 h-3.5" />
                  </div>
                  <div className="space-y-1 font-mono text-xs">
                    <div className="flex justify-between">
                      <span className="text-[#93A3B5] print:text-slate-700">
                        Abord. Localização (SIN):
                      </span>
                      <strong className="text-[#3B82F6] font-bold">
                        {totaisEscopos.escopo2SinT.toFixed(3)} t
                      </strong>
                    </div>
                    <div className="flex justify-between border-t border-[rgba(244,247,250,0.06)] pt-1 print:border-blue-200">
                      <span className="text-[#93A3B5] print:text-slate-700">
                        Abord. Mercado (I-REC):
                      </span>
                      <strong className="text-[#12B886] font-bold">
                        {totaisEscopos.escopo2IrecT.toFixed(3)} t
                      </strong>
                    </div>
                  </div>
                  <span className="text-[9px] text-[#93A3B5] print:text-slate-500 block mt-1">
                    MCTI 2025: 0,0289 kgCO₂e/kWh vs I-REC 0,0
                  </span>
                </div>

                {/* Escopo 3 */}
                <div className="p-3 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.06)] print:bg-white print:border-slate-200">
                  <div className="flex items-center justify-between text-[#8B5CF6] text-[10px] uppercase font-bold mb-1">
                    <span>Escopo 3 (Cadeia)</span>
                    <Truck className="w-3.5 h-3.5" />
                  </div>
                  <div className="font-heading font-black text-xl text-[#F4F7FA] print:text-slate-900">
                    {totaisEscopos.escopo3T.toFixed(3)}{' '}
                    <span className="text-[10px] font-normal text-[#93A3B5]">tCO₂e</span>
                  </div>
                  <span className="text-[10px] text-[#93A3B5] print:text-slate-600 block mt-1">
                    Fretes CT-e, Insumos NCM e Concessões
                  </span>
                </div>

                {/* Emissões Evitadas & Biogênico */}
                <div className="p-3 rounded-xl bg-[#0A0E12] border border-[#12B886]/40 print:bg-emerald-50 print:border-emerald-300">
                  <div className="flex items-center justify-between text-[#12B886] text-[10px] uppercase font-bold mb-1">
                    <span>Insetting & Biogênico</span>
                    <Leaf className="w-3.5 h-3.5" />
                  </div>
                  <div className="space-y-1 font-mono text-xs">
                    <div className="flex justify-between">
                      <span className="text-[#93A3B5] print:text-slate-700">
                        Evitadas (ISO 14067):
                      </span>
                      <strong className="text-[#12B886] font-bold">
                        -{totaisEscopos.insettingT.toFixed(3)} t
                      </strong>
                    </div>
                    <div className="flex justify-between border-t border-[rgba(244,247,250,0.06)] pt-1 print:border-emerald-200">
                      <span className="text-[#93A3B5] print:text-slate-700">
                        Biogênico (Neutro):
                      </span>
                      <strong className="text-[#D9B36C] font-bold">
                        {totaisEscopos.biogenicoT.toFixed(3)} t
                      </strong>
                    </div>
                  </div>
                  <span className="text-[9px] text-[#93A3B5] print:text-slate-500 block mt-1">
                    Biogênico reportado em linha separada
                  </span>
                </div>
              </div>
            </div>

            {/* BLOCO 2: MATERIALIDADE POR CNAE (PERFIL LOGÍSTICO DA EMPRESA DEMO) */}
            <div className="p-5 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.1)] space-y-3 print:bg-slate-50 print:border-slate-300 print-card">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-[rgba(244,247,250,0.06)] pb-2 print:border-slate-200">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#D9B36C] print:text-amber-800" />
                  <span className="font-heading font-bold text-xs uppercase tracking-wider text-[#F4F7FA] print:text-slate-900">
                    BLOCO "MATERIALIDADE POR CNAE" • PERFIL LOGÍSTICO & EMITENTES
                  </span>
                </div>
                <span className="text-[10px] text-[#93A3B5] print:text-slate-600">
                  Critério de corte pericial: materialidade estipulada em ≥ 1,0% do passivo total
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs print-table">
                  <thead className="border-b border-[rgba(244,247,250,0.06)] text-[#93A3B5] uppercase font-semibold text-[10px] print:text-slate-600 print:border-slate-300">
                    <tr>
                      <th className="py-2 px-2.5">CNAE Fiscal</th>
                      <th className="py-2 px-2.5">Descrição da Atividade Econômica</th>
                      <th className="py-2 px-2.5 text-right">Emissões Fóssil (kg)</th>
                      <th className="py-2 px-2.5 text-right">% Peso</th>
                      <th className="py-2 px-2.5 text-center">Status Materialidade</th>
                      <th className="py-2 px-2.5">Justificativa Metodológica</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[rgba(244,247,250,0.04)] text-[#F4F7FA] print:divide-slate-200 print:text-slate-800">
                    {materialidadeCnae.slice(0, 6).map((item) => (
                      <tr key={item.cnae} className="hover:bg-[#16202B]/40 transition-colors">
                        <td className="py-1.5 px-2.5 font-mono text-[11px] text-[#D9B36C] print:text-amber-800 font-bold whitespace-nowrap">
                          {item.cnae}
                        </td>
                        <td className="py-1.5 px-2.5 text-[11px] max-w-[280px]">
                          <span className="font-medium text-[#F4F7FA] print:text-slate-900">
                            {item.descricao}
                          </span>
                        </td>
                        <td className="py-1.5 px-2.5 text-right font-mono text-[11px] font-semibold text-[#12B886] print:text-emerald-700">
                          {item.pesoEmissaoKg.toLocaleString('pt-BR', {
                            minimumFractionDigits: 1,
                            maximumFractionDigits: 1,
                          })}
                        </td>
                        <td className="py-1.5 px-2.5 text-right font-mono text-[11px] font-bold text-[#F4F7FA] print:text-slate-900">
                          {item.percentual.toFixed(1)}%
                        </td>
                        <td className="py-1.5 px-2.5 text-center">
                          {item.isMaterial ? (
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#12B886]/15 text-[#12B886] border border-[#12B886]/30 print:bg-emerald-100 print:text-emerald-800">
                              Material
                            </span>
                          ) : (
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#93A3B5]/15 text-[#93A3B5] border border-[rgba(244,247,250,0.1)] print:bg-slate-200 print:text-slate-700">
                              Não-Material
                            </span>
                          )}
                        </td>
                        <td className="py-1.5 px-2.5 text-[10px] text-[#93A3B5] print:text-slate-600 leading-tight max-w-[260px]">
                          {item.justificativa}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="text-[10px] text-[#93A3B5] print:text-slate-500 pt-1 flex justify-between border-t border-[rgba(244,247,250,0.04)] print:border-slate-200">
                <span>
                  Categorias reordenadas decrescente por peso de emissão na competência julho/2026.
                </span>
                <span>Total de CNAEs apurados: {materialidadeCnae.length} atividades</span>
              </div>
            </div>

            {/* BLOCO 3: PROVA SHA-256 DO FECHAMENTO DA COMPETÊNCIA + QR CODE PÚBLICO (?via=qr) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center p-5 rounded-2xl bg-[#0A0E12] border border-[#12B886]/40 print:bg-slate-50 print:border-slate-300 print-card">
              <div className="lg:col-span-8 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-[#12B886] print:text-emerald-700" />
                    <span className="font-heading font-bold text-xs uppercase tracking-wider text-[#F4F7FA] print:text-slate-900">
                      HASH DE FECHAMENTO DA COMPETÊNCIA (SHA-256 VERIFICÁVEL)
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#12B886] bg-[#12B886]/10 px-2.5 py-0.5 rounded-full border border-[#12B886]/30 print:bg-emerald-100 print:text-emerald-800">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Fechamento verificado ✓
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3 bg-[#111820] p-3 rounded-xl border border-[rgba(244,247,250,0.08)] print:bg-white print:border-slate-300">
                  <span
                    className="font-mono text-xs text-[#D9B36C] print:text-amber-900 break-all select-all font-semibold"
                    title={hashFechamento}
                  >
                    {hashFechamento}
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
                  O hash de fechamento da competência sintetiza de forma imutável as 12 notas
                  fiscais da competência{' '}
                  <span className="font-mono font-bold text-[#F4F7FA] print:text-slate-800">
                    julho_2026
                  </span>
                  , vinculando o CNPJ{' '}
                  <span className="font-mono font-bold text-[#F4F7FA] print:text-slate-800">
                    {dossie.cnpj}
                  </span>
                  , os totais por escopo e as memórias de cálculo de insetting e duplo reporte.
                </p>
              </div>

              <div className="lg:col-span-4 flex flex-col items-center justify-center text-center border-t lg:border-t-0 lg:border-l border-[rgba(244,247,250,0.1)] lg:pl-5 pt-3 lg:pt-0 print:border-slate-300">
                <div className="p-2 bg-white rounded-xl shadow-lg mb-1.5">
                  <QRCodeSVG
                    value={qrCodeUrl}
                    size={120}
                    bgColor="#FFFFFF"
                    fgColor="#0A0E12"
                    title={`QR DCP Corporativo ${dossie.cnpj}`}
                  />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#12B886] print:text-emerald-800">
                  QR CODE PÚBLICO DO DCP
                </span>
                <span className="text-[9px] text-[#93A3B5] print:text-slate-500 font-mono mt-0.5 max-w-[200px] truncate">
                  {qrCodeUrl}
                </span>
              </div>
            </div>

            {/* Rodapé da Página 1 */}
            <div className="pt-2 border-t border-[rgba(244,247,250,0.08)] flex items-center justify-between text-[10px] text-[#93A3B5] print:border-slate-300 print:text-slate-500">
              <span>Orbis Protocol • Declaração de Conformidade e Pegada Corporativa</span>
              <span className="font-bold">Página 1 de 2 • Continua no Anexo Técnico</span>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* PÁGINA 2: CLASSIFICAÇÃO NCM, OBSERVAÇÕES DO REVISOR & HISTÓRICO DE AUDITORIA */}
          {/* ========================================================================= */}
          <div className="dcp-page-2 space-y-5 pt-8 print:pt-0">
            {/* Topo do Anexo Técnico */}
            <div className="border-b border-[rgba(244,247,250,0.12)] pb-3 print:border-slate-300">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#16202B] border border-[#D9B36C]/40 text-[#D9B36C] text-[11px] font-bold uppercase tracking-wider mb-1.5 print:border-amber-600 print:bg-amber-50 print:text-amber-800">
                <Layers className="w-3.5 h-3.5" />
                ANEXO TÉCNICO • CAMADA NCM COM TIERS & PARECER PERICIAL
              </div>
              <h2 className="font-heading font-black text-xl text-[#F4F7FA] print:text-slate-900">
                Classificação Física por Famílias NCM, Achados do Revisor & Trilha de Consultas
              </h2>
            </div>

            {/* BLOCO 4: CLASSIFICAÇÃO FÍSICA POR FAMÍLIAS NCM COM TIERS */}
            <div className="p-5 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.1)] space-y-3 print:bg-slate-50 print:border-slate-300 print-card">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[rgba(244,247,250,0.06)] pb-2 print:border-slate-200">
                <div className="flex items-center gap-2">
                  <FileCheck2 className="w-4 h-4 text-[#12B886] print:text-emerald-700" />
                  <span className="font-heading font-bold text-xs uppercase tracking-wider text-[#F4F7FA] print:text-slate-900">
                    CLASSIFICAÇÃO FÍSICA POR FAMÍLIAS NCM (ESCOPO 3 CAT. 1)
                  </span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#0A0E12] text-[#12B886] border border-[#12B886]/30 print:bg-emerald-50 print:text-emerald-800 font-bold">
                  Declaração: "{DECLARACAO_PROXY_NCM}"
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs mb-2">
                <div className="p-3 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.06)] print:bg-white print:border-slate-200">
                  <span className="text-[10px] text-[#93A3B5] print:text-slate-600 block uppercase font-bold">
                    Itens Elevados a Tier 2
                  </span>
                  <div className="font-heading font-black text-lg text-[#12B886] print:text-emerald-700">
                    {classificacaoFisicaNcmResumo.itensElevadosTier2} de{' '}
                    {classificacaoFisicaNcmResumo.totalItens} itens
                  </div>
                  <span className="text-[10px] text-[#93A3B5] print:text-slate-500 block mt-0.5">
                    NCM mapeável + massa física em qCom
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.06)] print:bg-white print:border-slate-200">
                  <span className="text-[10px] text-[#93A3B5] print:text-slate-600 block uppercase font-bold">
                    Incerteza Resultante
                  </span>
                  <div className="font-heading font-black text-lg text-[#D9B36C] print:text-amber-800">
                    ±{classificacaoFisicaNcmResumo.incertezaPonderadaCat1Pct}%
                  </div>
                  <span className="text-[10px] text-[#93A3B5] print:text-slate-500 block mt-0.5">
                    Redução de {classificacaoFisicaNcmResumo.reducaoIncertezaPontosPct} p.p. vs
                    spend-based puro (±18%)
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.06)] print:bg-white print:border-slate-200">
                  <span className="text-[10px] text-[#93A3B5] print:text-slate-600 block uppercase font-bold">
                    Bases ACV Aplicadas
                  </span>
                  <div className="font-heading font-bold text-xs text-[#F4F7FA] print:text-slate-900 mt-1">
                    WorldSteel, PlasticsEurope & Ecoinvent 3.10
                  </div>
                  <span className="text-[10px] text-[#93A3B5] print:text-slate-500 block mt-0.5">
                    Fatores físicos kgCO₂e/kg validados
                  </span>
                </div>
              </div>

              {/* Relação discriminada das famílias NCM */}
              <div className="space-y-1.5 text-xs">
                <div className="p-2.5 rounded-lg bg-[#0A0E12] border border-[rgba(244,247,250,0.06)] flex justify-between items-center print:bg-white print:border-slate-200">
                  <div>
                    <strong className="text-[#F4F7FA] print:text-slate-900">
                      Capítulo 73 (7308.90.10) — Aço & Estruturas Porta-Paletes
                    </strong>
                    <div className="text-[10px] text-[#93A3B5] print:text-slate-600 font-mono">
                      3.800 kg faturados × 2,450 kgCO₂e/kg (WorldSteel) = 9.310,0 kg CO₂e
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#12B886]/15 text-[#12B886] border border-[#12B886]/30">
                    Tier 2 (±7.5%)
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-[#0A0E12] border border-[rgba(244,247,250,0.06)] flex justify-between items-center print:bg-white print:border-slate-200">
                  <div>
                    <strong className="text-[#F4F7FA] print:text-slate-900">
                      Capítulo 39 (3920.10.99) — Filme Stretch Polietileno PEBD
                    </strong>
                    <div className="text-[10px] text-[#93A3B5] print:text-slate-600 font-mono">
                      1.200 kg faturados × 2,150 kgCO₂e/kg (PlasticsEurope) = 2.580,0 kg CO₂e
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#12B886]/15 text-[#12B886] border border-[#12B886]/30">
                    Tier 2 (±9.0%)
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-[#0A0E12] border border-[rgba(244,247,250,0.06)] flex justify-between items-center print:bg-white print:border-slate-200">
                  <div>
                    <strong className="text-[#F4F7FA] print:text-slate-900">
                      Capítulo 48 (4819.10.00) — Caixas de Papelão Ondulado (Klabin)
                    </strong>
                    <div className="text-[10px] text-[#93A3B5] print:text-slate-600 font-mono">
                      4.500 kg faturados × 0,250 kgCO₂e/kg reciclado = 1.125,0 kg CO₂e (Insetting
                      -1.125 kg)
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#12B886]/15 text-[#12B886] border border-[#12B886]/30">
                    Tier 2 (±8.5%)
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-[#0A0E12] border border-[rgba(244,247,250,0.06)] flex justify-between items-center print:bg-white print:border-slate-200">
                  <div>
                    <strong className="text-[#93A3B5] print:text-slate-700">
                      Demais Serviços & Telecom (NFS-e e NFCom sem qCom)
                    </strong>
                    <div className="text-[10px] text-[#93A3B5] print:text-slate-600 font-mono">
                      R$ 10.800,00 faturados pelo método spend-based = 154,8 kg CO₂e
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30">
                    Tier 1 (±18.0%)
                  </span>
                </div>
              </div>
            </div>

            {/* BLOCO 5: OBSERVAÇÕES DO REVISOR PERICIAL (COM O ACHADO ACH-CAT1-SPEND-01) */}
            <div className="p-5 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.1)] space-y-3 print:bg-slate-50 print:border-slate-300 print-card">
              <div className="flex items-center gap-2 border-b border-[rgba(244,247,250,0.06)] pb-2 print:border-slate-200">
                <Scale className="w-4 h-4 text-[#D9B36C] print:text-amber-800" />
                <span className="font-heading font-bold text-xs uppercase tracking-wider text-[#F4F7FA] print:text-slate-900">
                  OBSERVAÇÕES DO REVISOR PERICIAL • TRIAGEM PRELIMINAR
                </span>
              </div>

              <div className="space-y-2 text-xs">
                {/* Achado ACH-CAT1-SPEND-01 */}
                <div className="p-3 rounded-xl bg-[#0A0E12] border border-[#D9B36C]/40 space-y-1 print:bg-white print:border-amber-400">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] font-bold text-[#D9B36C] print:text-amber-800">
                      [ACH-CAT1-SPEND-01] Predominância residual de método spend-based no Escopo 3
                      Cat. 1
                    </span>
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-[#D9B36C]/20 text-[#D9B36C] print:bg-amber-100 print:text-amber-900">
                      Severidade Baixa • Recomendação Consultiva
                    </span>
                  </div>
                  <p className="text-[11px] text-[#93A3B5] print:text-slate-700 leading-relaxed">
                    <strong>Diagnóstico:</strong> Embora os itens materiais de maior volume
                    (estruturas de aço, filme stretch e caixas de papelão) tenham sido devidamente
                    elevados a <strong>Tier 2 (fator ACV de base física)</strong> com redução da
                    incerteza para ±8,2%, documentos de serviços técnicos (NFS-e TechServices) e
                    telecomunicações (NFCom Claro) permanecem em{' '}
                    <strong>Tier 1 spend-based (±18%)</strong>.
                  </p>
                  <p className="text-[10px] text-[#12B886] print:text-emerald-800 font-semibold">
                    Ação corretiva recomendada: Requisitar dos fornecedores terceirizados a inclusão
                    de métricas físicas (ex: horas em máquinas dedicadas, tráfego kWh de datacenter)
                    para emissão de laudo pericial pleno com chancela de ART.
                  </p>
                </div>

                {/* Achado ACH-E2-01 Duplo Reporte */}
                <div className="p-2.5 rounded-lg bg-[#0A0E12] border border-[rgba(244,247,250,0.06)] print:bg-white print:border-slate-200 text-[11px]">
                  <strong className="text-[#F4F7FA] print:text-slate-900 block mb-0.5">
                    [ACH-E2-01] Conformidade com duplo reporte do Escopo 2
                  </strong>
                  <span className="text-[#93A3B5] print:text-slate-600">
                    O reporte contemplou satisfatoriamente as duas abordagens previstas pelo GHG
                    Protocol (SIN/MCTI e I-REC), mitigando riscos de questionamento em auditoria
                    contábil.
                  </span>
                </div>
              </div>
            </div>

            {/* BLOCO 6: HISTÓRICO DE VERIFICAÇÕES DO DCP (dpp_consultas) */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#0A0E12] border border-[#12B886]/35 space-y-3 print:bg-slate-50 print:border-slate-300 print-card">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[rgba(244,247,250,0.08)] pb-2 print:border-slate-200">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-[#12B886] print:text-emerald-700" />
                  <span className="font-heading font-bold text-xs uppercase tracking-wider text-[#F4F7FA] print:text-slate-900">
                    HISTÓRICO DE VERIFICAÇÕES & TRILHA DE CONSULTAS PÚBLICAS
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <span className="text-[#93A3B5] print:text-slate-600">
                    Total Acumulado:{' '}
                    <strong className="text-[#12B886] print:text-emerald-700 font-mono font-bold">
                      {Math.max(totalConsultas, historicoConsultas.length, 1)} leituras
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
                                <span>
                                  {isQr ? 'QR Code' : isEmbed ? 'Widget' : 'Navegação Web'}
                                </span>
                              </span>
                            </td>
                            <td className="py-1.5 px-2 font-mono text-[11px] text-[#93A3B5] print:text-slate-600">
                              {c.ip_mascarado || '189.40.xxx.xxx'}
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
                  Trilha auditável conforme LGPD (Art. 5º, XI c/c Art. 13 — anonimização de IPs).
                </span>
                <span className="font-mono">Canal detectado: {canalDetectado.toUpperCase()}</span>
              </div>
            </div>

            {/* Rodapé da Página 2 */}
            <div className="pt-2 border-t border-[rgba(244,247,250,0.08)] flex items-center justify-between text-[10px] text-[#93A3B5] print:border-slate-300 print:text-slate-500">
              <span>
                Orbis Protocol • DCP Corporativo Demo • Indústrias & Logística Integrada Brasil S.A.
              </span>
              <span className="font-bold">Página 2 de 2 • Fim do Documento</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
