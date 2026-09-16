import React, { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Building2,
  ShieldCheck,
  CheckCircle2,
  FileText,
  Zap,
  Factory,
  Truck,
  Leaf,
  Layers,
  ArrowRight,
  Info,
  RefreshCw,
  Download,
  Filter,
  Flame,
  FileCode,
  Scale,
  Sparkles,
  ExternalLink,
  ChevronRight,
  HelpCircle,
  Database,
  Compass,
  Boxes,
  TrendingDown,
  ArrowUpRight,
  Printer,
} from 'lucide-react'
import {
  carregarDadosCorporativoDemo,
  CorporativoDemoData,
  DOSSIE_DEFAULT_FALLBACK,
  NOTAS_DEFAULT_FALLBACK,
  NotaFiscalDemonstrativa,
} from '@/services/corporativoService'
import {
  DECLARACAO_PROXY_NCM,
  FAMILIAS_NCM_CONFIG,
  resumirClassificacaoItensComprados,
  ItemCompradoInput,
} from '@/services/classificacaoFisicaNCM'
import { formatCurrencyBRL } from '@/services/nfeParser'
import {
  dispararTriagemPericial,
  ResultadoTriagemPericial,
} from '@/services/revisorPericialService'
import { RevisorPericialWidget } from '@/components/RevisorPericialWidget'

export default function ModoCorporativoDemoPage() {
  const [demoData, setDemoData] = useState<CorporativoDemoData>({
    dossie: DOSSIE_DEFAULT_FALLBACK,
    notas: NOTAS_DEFAULT_FALLBACK,
  })
  const [isLoading, setIsLoading] = useState(true)

  // Filtros
  const [filtroCategoria, setFiltroCategoria] = useState<string>('todos')
  const [filtroModelo, setFiltroModelo] = useState<string>('todos')
  const [competenciaFiscal, setCompetenciaFiscal] = useState<string>('julho_2026')
  const [aplicarIREC, setAplicarIREC] = useState<boolean>(false)
  const [conectorAtivo, setConectorAtivo] = useState<'ghg_br' | 'climatiq' | 'defra' | 'epa'>(
    'ghg_br',
  )
  const [modeloIngestaoSefaz, setModeloIngestaoSefaz] = useState<'ecac' | 'contador' | 'a1'>('ecac')

  // Estado das notas ativas na demonstração (permite marcar/desmarcar para simulação interativa)
  const [notasAtivasIds, setNotasAtivasIds] = useState<string[]>([])
  const [modalMetodologiaAberta, setModalMetodologiaAberta] = useState(false)
  const [notaSelecionadaDetalhes, setNotaSelecionadaDetalhes] =
    useState<NotaFiscalDemonstrativa | null>(null)

  // Estado da Triagem Pericial Automática da Demo
  const [resultadoTriagemDemo, setResultadoTriagemDemo] = useState<ResultadoTriagemPericial | null>(
    null,
  )
  const [isLoadingTriagemDemo, setIsLoadingTriagemDemo] = useState(false)

  const handleExecutarTriagemDemo = async () => {
    setIsLoadingTriagemDemo(true)
    try {
      const res = await dispararTriagemPericial({ is_demo: true })
      setResultadoTriagemDemo(res)
    } catch (err) {
      console.error('Erro na triagem pericial demo:', err)
    } finally {
      setIsLoadingTriagemDemo(false)
    }
  }

  useEffect(() => {
    let isMounted = true
    setIsLoading(true)
    carregarDadosCorporativoDemo()
      .then((data) => {
        if (!isMounted) return
        setDemoData(data)
        setNotasAtivasIds(data.notas.map((n) => n.id))
      })
      .catch((err) => {
        console.error('Falha ao ler dados demo:', err)
      })
      .finally(() => {
        if (isMounted) setIsLoading(false)
      })
    return () => {
      isMounted = false
    }
  }, [])

  const { dossie, notas } = demoData

  // Alternar nota ativa
  const toggleNotaAtiva = (id: string) => {
    setNotasAtivasIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    )
  }

  const restaurarTodasNotas = () => {
    setNotasAtivasIds(notas.map((n) => n.id))
  }

  // Notas filtradas conforme filtros visuais
  const notasFiltradas = useMemo(() => {
    return notas.filter((n) => {
      if (filtroCategoria !== 'todos') {
        if (filtroCategoria === 'frota' && n.categoriaOperacional !== 'frota') return false
        if (filtroCategoria === 'frete' && n.categoriaOperacional !== 'frete') return false
        if (
          filtroCategoria === 'instalacoes' &&
          n.categoriaOperacional !== 'instalacoes' &&
          n.categoriaOperacional !== 'servicos'
        )
          return false
      }
      if (filtroModelo !== 'todos' && n.modeloFiscal !== filtroModelo) {
        return false
      }
      return true
    })
  }, [notas, filtroCategoria, filtroModelo])

  // Cálculos dinâmicos com base nas notas marcadas como ativas
  const totaisCalculados = useMemo(() => {
    const ativas = notas.filter((n) => notasAtivasIds.includes(n.id))

    let escopo1FossilKg = 0
    let escopo2FossilKg = 0
    let escopo3FossilKg = 0
    let biogenicoKg = 0
    let insettingKg = 0
    let incertezaPonderadaTotal = 0
    let pesoTotal = 0

    ativas.forEach((n) => {
      if (n.escopoAlvo === 'escopo_1') {
        escopo1FossilKg += n.fossilKgCo2e || 0
      } else if (n.escopoAlvo === 'escopo_2') {
        // Se aplicar I-REC, emissão de mercado zera o fator elétrico
        const parcela = aplicarIREC ? 0 : n.fossilKgCo2e || 0
        escopo2FossilKg += parcela
      } else if (n.escopoAlvo === 'escopo_3') {
        escopo3FossilKg += n.fossilKgCo2e || 0
      }
      biogenicoKg += n.biogenicoKgCo2 || 0
      insettingKg += n.insettingKgCo2e || 0

      const emissaoTotalItem = (n.fossilKgCo2e || 0) + (n.biogenicoKgCo2 || 0) + 1
      incertezaPonderadaTotal += (n.incertezaPct || 4.5) * emissaoTotalItem
      pesoTotal += emissaoTotalItem
    })

    const totalFossilKg = escopo1FossilKg + escopo2FossilKg + escopo3FossilKg
    const totalFossilT = totalFossilKg / 1000
    const escopo1T = escopo1FossilKg / 1000
    const escopo2T = escopo2FossilKg / 1000
    const escopo3T = escopo3FossilKg / 1000
    const biogenicoT = biogenicoKg / 1000
    const insettingT = insettingKg / 1000

    const pctEscopo1 = totalFossilKg > 0 ? (escopo1FossilKg / totalFossilKg) * 100 : 0
    const pctEscopo2 = totalFossilKg > 0 ? (escopo2FossilKg / totalFossilKg) * 100 : 0
    const pctEscopo3 = totalFossilKg > 0 ? (escopo3FossilKg / totalFossilKg) * 100 : 0

    const incertezaMedia = pesoTotal > 0 ? incertezaPonderadaTotal / pesoTotal : 4.5

    return {
      totalFossilKg,
      totalFossilT,
      escopo1T,
      escopo2T,
      escopo3T,
      biogenicoT,
      insettingT,
      pctEscopo1,
      pctEscopo2,
      pctEscopo3,
      incertezaMedia: Number(incertezaMedia.toFixed(1)),
      totalAtivas: ativas.length,
    }
  }, [notas, notasAtivasIds, aplicarIREC])

  // Exportar Laudo Simulado PDF / CSV
  const handleExportarCsv = () => {
    const cabecalho =
      'ID;Documento;Modelo;Fornecedor;CNPJ;CNAE;Data;Valor_BRL;Escopo;Fossil_kgCO2e;Bio_kgCO2;Tier\n'
    const linhas = notas
      .map(
        (n) =>
          `"${n.id}";"${n.numeroDocumento}";"${n.modeloFormatado}";"${n.razaoSocialParceiro}";"${n.cnpj}";"${n.cnae}";"${n.dataEmissao}";"${n.valorBrl}";"${n.escopoAlvo}";"${n.fossilKgCo2e}";"${n.biogenicoKgCo2}";"${n.tierIncerteza}"`,
      )
      .join('\n')

    const blob = new Blob([cabecalho + linhas], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `orbis-demonstracao-corporativa-${dossie.cnpj}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="min-h-screen py-8 md:py-12 bg-[#0A0E12] text-[#F4F7FA]">
      <div className="max-w-[1320px] mx-auto px-4 sm:px-6 space-y-6">
        {/* 1. BANNER OBRIGATÓRIO E PERSISTENTE DE MODO DEMONSTRAÇÃO */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#D9B36C]/20 via-[#16202B] to-[#12B886]/20 border-2 border-[#D9B36C] shadow-2xl relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3">
              <div className="p-2.5 rounded-xl bg-[#D9B36C] text-[#0A0E12] font-black shrink-0">
                <Sparkles className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-[#D9B36C]/20 text-[#D9B36C] text-[11px] font-extrabold uppercase tracking-wider mb-1">
                  <span>Modo Demonstração Corporativo Ativo</span>
                  <span>•</span>
                  <span>Dados Fictícios Auditáveis</span>
                </div>
                <h1 className="font-heading font-black text-lg sm:text-xl text-[#F4F7FA] tracking-wide">
                  Espaço de Demonstração Corporativa • dMRV de Emissões & 10 Modelos Fiscais
                </h1>
                <p className="text-xs text-[#93A3B5] mt-0.5">
                  Este ambiente reproduz com fidelidade pericial a apuração contínua de 12
                  documentos fiscais reais (energia, diesel S10, gás canalizado, CT-e, fretes,
                  papelão reciclado e concessões públicas).
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <span className="hidden lg:inline text-[11px] font-mono text-[#D9B36C] bg-[#0A0E12] px-3 py-1.5 rounded-xl border border-[rgba(244,247,250,0.1)]">
                DMRV-ORBIS-FDU-6AA9DEC4
              </span>
              <Link
                to="/painel"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#12B886] text-[#0A0E12] hover:bg-[#0CA678] transition-all shadow-emerald-glow"
              >
                <span>Acessar Painel Real</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* 2. TOUR GUIADO PELOS MÓDULOS REAIS DA PLATAFORMA */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.12)] shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-[#12B886]" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#F4F7FA]">
                Tour Rápido pelos Módulos Reais da Plataforma Orbis Protocol
              </span>
            </div>
            <span className="text-[11px] text-[#93A3B5]">
              Navegue diretamente pelas abas e motores operacionais
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5 text-xs">
            <Link
              to="/diagnostico"
              className="p-3 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.08)] hover:border-[#12B886] transition-all group flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-mono text-[10px] font-bold text-[#12B886]">01. MOTOR</span>
                <ChevronRight className="w-3.5 h-3.5 text-[#93A3B5] group-hover:text-[#12B886]" />
              </div>
              <span className="font-semibold text-[#F4F7FA] group-hover:text-[#12B886]">
                Diagnóstico & SBCE
              </span>
              <span className="text-[10px] text-[#93A3B5] mt-1">Enquadramento Lei 15.042</span>
            </Link>

            <Link
              to="/painel"
              className="p-3 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.08)] hover:border-[#12B886] transition-all group flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-mono text-[10px] font-bold text-[#3B82F6]">
                  02. HUB FISCAL
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-[#93A3B5] group-hover:text-[#3B82F6]" />
              </div>
              <span className="font-semibold text-[#F4F7FA] group-hover:text-[#3B82F6]">
                Leitor NF-e & SPED
              </span>
              <span className="text-[10px] text-[#93A3B5] mt-1">10 modelos fiscais & XML</span>
            </Link>

            <Link
              to="/painel"
              className="p-3 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.08)] hover:border-[#12B886] transition-all group flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-mono text-[10px] font-bold text-[#D9B36C]">
                  03. TRIBUTÁRIO
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-[#93A3B5] group-hover:text-[#D9B36C]" />
              </div>
              <span className="font-semibold text-[#F4F7FA] group-hover:text-[#D9B36C]">
                Reforma IBS / CBS
              </span>
              <span className="text-[10px] text-[#93A3B5] mt-1">Simulação EC 132/2023</span>
            </Link>

            <Link
              to="/capital"
              className="p-3 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.08)] hover:border-[#12B886] transition-all group flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-mono text-[10px] font-bold text-[#8B5CF6]">04. CAPITAL</span>
                <ChevronRight className="w-3.5 h-3.5 text-[#93A3B5] group-hover:text-[#8B5CF6]" />
              </div>
              <span className="font-semibold text-[#F4F7FA] group-hover:text-[#8B5CF6]">
                Green Capital Engine
              </span>
              <span className="text-[10px] text-[#93A3B5] mt-1">8 linhas c/ taxas bonificadas</span>
            </Link>

            <Link
              to="/verificador"
              className="p-3 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.08)] hover:border-[#12B886] transition-all group flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-mono text-[10px] font-bold text-[#12B886]">
                  05. PROBATÓRIO
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-[#93A3B5] group-hover:text-[#12B886]" />
              </div>
              <span className="font-semibold text-[#F4F7FA] group-hover:text-[#12B886]">
                Verificador de Selos
              </span>
              <span className="text-[10px] text-[#93A3B5] mt-1">Hash SHA-256 & dMRV</span>
            </Link>
          </div>
        </div>

        {/* 2.1 BOTÃO & SESSÃO DO REVISOR PERICIAL NATIVO (DEMO CORPORATIVA SCORE 840/1000 - 84/100) */}
        <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-[#16202B] via-[#111820] to-[#16202B] border border-[#12B886]/40 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-3 rounded-xl bg-[#12B886]/10 text-[#12B886] shrink-0 border border-[#12B886]/20">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#12B886] bg-[#12B886]/10 px-2 py-0.5 rounded border border-[#12B886]/30">
                  Agente Nativo Skip Cloud
                </span>
                <span className="text-[10px] text-[#D9B36C] font-semibold">
                  Auditoria de 12 Notas Fiscais
                </span>
              </div>
              <h3 className="font-heading font-extrabold text-base sm:text-lg text-[#F4F7FA]">
                Revisão Pericial Automática • Pré-Laudo com Memória Persistente
              </h3>
              <p className="text-xs text-[#93A3B5] mt-0.5 max-w-2xl">
                Execute a triagem pericial com o agente IA nativo sobre os 10 modelos fiscais das
                Indústrias & Logística Integrada Brasil S.A. e confira os achados com score
                auditado.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleExecutarTriagemDemo}
            disabled={isLoadingTriagemDemo}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider bg-[#12B886] text-[#0A0E12] hover:bg-[#0CA678] transition-all shadow-emerald-glow shrink-0 disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            <span>
              {isLoadingTriagemDemo ? 'Auditando...' : 'Executar Revisão Pericial (Demo)'}
            </span>
          </button>
        </div>

        {/* WIDGET DO REVISOR PERICIAL QUANDO ACIONADO OU CARREGADO */}
        {resultadoTriagemDemo && (
          <RevisorPericialWidget
            resultado={resultadoTriagemDemo}
            isLoading={isLoadingTriagemDemo}
            onReexecutar={handleExecutarTriagemDemo}
            isDemo={true}
          />
        )}

        {/* 3. DOSSIÊ DA ORGANIZAÇÃO ATIVA (Indústrias & Logística Integrada Brasil S.A.) */}
        <div className="p-6 sm:p-8 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.12)] shadow-xl relative">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-[rgba(244,247,250,0.08)]">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#16202B] border border-[#12B886]/40 text-[#12B886] text-xs font-bold tracking-wider uppercase mb-2">
                <Building2 className="w-3.5 h-3.5" />
                <span>Organização Ativa na Sessão de Demonstração</span>
              </div>
              <h2 className="font-heading font-extrabold text-2xl sm:text-3xl text-[#F4F7FA] tracking-wide">
                {dossie.razaoSocial}
              </h2>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#93A3B5] mt-2 font-mono">
                <span className="text-[#D9B36C] font-semibold">CNPJ: {dossie.cnpj}</span>
                <span>•</span>
                <span>
                  Segmento: <strong className="text-[#F4F7FA]">{dossie.segmento}</strong>
                </span>
                <span>•</span>
                <span>
                  Localidades: <strong className="text-[#F4F7FA]">{dossie.localidades}</strong>
                </span>
                <span>•</span>
                <span>
                  Auditoria Contábil:{' '}
                  <strong className="text-[#12B886]">{dossie.auditorCrc}</strong>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Score ESG Badge */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-[#16202B] to-[#0A0E12] border border-[#12B886]/40 flex flex-col items-center justify-center min-w-[140px]">
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#93A3B5]">
                  Score ESG dMRV
                </span>
                <div className="font-heading font-black text-2xl sm:text-3xl text-[#12B886] mt-0.5">
                  {dossie.scoreEsg}
                  <span className="text-xs font-normal text-[#93A3B5]">
                    {' '}
                    / {dossie.scoreEsgMax}
                  </span>
                </div>
                <span className="text-[10px] text-[#12B886] font-semibold mt-0.5 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Alta Maturidade
                </span>
              </div>
            </div>
          </div>

          {/* Dossiê Totalizador de Escopos (Consolidado Corporativo: 1.420,5 tCO₂e) */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            <div className="p-4 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.08)]">
              <div className="flex items-center justify-between text-xs text-[#93A3B5] mb-1">
                <span className="flex items-center gap-1.5 font-bold uppercase text-[#F59E0B]">
                  <Factory className="w-3.5 h-3.5" /> Escopo 1 (Direto)
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#F59E0B]/10 text-[#F59E0B]">
                  Combustão
                </span>
              </div>
              <div className="font-heading font-black text-xl sm:text-2xl text-[#F4F7FA]">
                {dossie.escopo1Tco2e.toLocaleString('pt-BR', { minimumFractionDigits: 1 })}{' '}
                <span className="text-xs font-normal text-[#93A3B5]">tCO₂e</span>
              </div>
              <p className="text-[11px] text-[#93A3B5] mt-1">Frota própria e caldeiras a gás.</p>
            </div>

            <div className="p-4 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.08)]">
              <div className="flex items-center justify-between text-xs text-[#93A3B5] mb-1">
                <span className="flex items-center gap-1.5 font-bold uppercase text-[#3B82F6]">
                  <Zap className="w-3.5 h-3.5" /> Escopo 2 (Energia)
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#3B82F6]/10 text-[#3B82F6]">
                  SIN Rede
                </span>
              </div>
              <div className="font-heading font-black text-xl sm:text-2xl text-[#F4F7FA]">
                {dossie.escopo2Tco2e.toLocaleString('pt-BR', { minimumFractionDigits: 1 })}{' '}
                <span className="text-xs font-normal text-[#93A3B5]">tCO₂e</span>
              </div>
              <p className="text-[11px] text-[#93A3B5] mt-1">
                Fator médio SIN – MCTI 2025: 0,0289 kgCO₂e/kWh.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.08)]">
              <div className="flex items-center justify-between text-xs text-[#93A3B5] mb-1">
                <span className="flex items-center gap-1.5 font-bold uppercase text-[#8B5CF6]">
                  <Truck className="w-3.5 h-3.5" /> Escopo 3 (Cadeia)
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#8B5CF6]/10 text-[#8B5CF6]">
                  GLEC / DEFRA
                </span>
              </div>
              <div className="font-heading font-black text-xl sm:text-2xl text-[#F4F7FA]">
                {dossie.escopo3Tco2e.toLocaleString('pt-BR', { minimumFractionDigits: 1 })}{' '}
                <span className="text-xs font-normal text-[#93A3B5]">tCO₂e</span>
              </div>
              <p className="text-[11px] text-[#93A3B5] mt-1">Fretes terceirizados e insumos.</p>
            </div>

            <div className="p-4 rounded-xl bg-[#0A0E12] border border-[#12B886]/40 bg-gradient-to-b from-[#16202B]/60 to-[#0A0E12]">
              <div className="flex items-center justify-between text-xs text-[#93A3B5] mb-1">
                <span className="flex items-center gap-1.5 font-bold uppercase text-[#12B886]">
                  <Leaf className="w-3.5 h-3.5" /> Total Consolidado
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#12B886]/20 text-[#12B886] font-bold">
                  SBCE Nível 1
                </span>
              </div>
              <div className="font-heading font-black text-xl sm:text-2xl text-[#12B886]">
                {dossie.totalEmissoesTco2e.toLocaleString('pt-BR', { minimumFractionDigits: 1 })}{' '}
                <span className="text-xs font-normal text-[#93A3B5]">tCO₂e</span>
              </div>
              <p className="text-[11px] text-[#93A3B5] mt-1">
                Enquadramento no monitoramento da Lei 15.042/2024.
              </p>
            </div>
          </div>
        </div>

        {/* 4. SEÇÃO DO MOTOR FISCAL & AMOSTRA DAS 12 NOTAS FISCAIS */}
        <div className="p-6 sm:p-8 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.12)] shadow-xl space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#16202B] border border-[#12B886]/40 text-[#12B886] text-xs font-bold tracking-wider uppercase mb-2">
                <FileCode className="w-3.5 h-3.5" />
                Módulo Fiscal de Ingestão Universal • 10 Modelos Fiscais Homologados
              </div>
              <h3 className="font-heading font-extrabold text-xl sm:text-2xl text-[#F4F7FA]">
                Leitor de XML NF-e, CT-e, Faturas de Concessionárias & Insetting
              </h3>
              <p className="text-xs text-[#93A3B5] mt-1">
                Conversão fática automática de XML/tags contábeis em emissões com fatores oficiais
                MCTI/SIN, GHG Protocol Brasil e Ecoinvent 3.10.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setModalMetodologiaAberta(true)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#16202B] border border-[rgba(244,247,250,0.2)] text-[#F4F7FA] hover:border-[#12B886] transition-all flex items-center gap-1.5"
              >
                <Info className="w-3.5 h-3.5 text-[#12B886]" />
                <span>Ver Nota Metodológica IPCC</span>
              </button>
              <button
                type="button"
                onClick={handleExportarCsv}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#16202B] border border-[rgba(244,247,250,0.2)] text-[#F4F7FA] hover:border-[#12B886] transition-all flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5 text-[#12B886]" />
                <span>Exportar CSV</span>
              </button>
              <Link
                to="/corporativo/dcp"
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#12B886] text-[#0A0E12] hover:bg-[#0CA678] transition-all flex items-center gap-1.5 shadow-emerald-glow"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Ver DCP Corporativo Demo (2 Páginas)</span>
              </Link>
            </div>
          </div>

          {/* Cartões dos 4 Escopos / Passivos Apurados na Amostra Interativa */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Escopo 1 */}
            <div className="p-5 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.08)] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#93A3B5] flex items-center gap-1.5">
                    <Factory className="w-4 h-4 text-[#F59E0B]" />
                    Escopo 1 (Fóssil Direto)
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-[#F59E0B]/10 text-[#F59E0B] font-semibold">
                    Tier 3 SEFAZ
                  </span>
                </div>
                <div className="text-2xl font-heading font-black text-[#F4F7FA]">
                  {totaisCalculados.escopo1T.toFixed(3)}{' '}
                  <span className="text-xs font-normal text-[#93A3B5]">tCO₂e</span>
                </div>
                <p className="text-[11px] text-[#93A3B5] mt-1">
                  Combustão móvel e fixa: Diesel S10, Gasolina e Gás Natural canalizado.
                </p>
              </div>
              <div className="pt-3 border-t border-[rgba(244,247,250,0.06)] mt-3 flex items-center justify-between text-[11px]">
                <span className="text-[#93A3B5]">Participação Fóssil:</span>
                <span className="text-[#F59E0B] font-mono font-semibold">
                  {totaisCalculados.pctEscopo1.toFixed(1)}%
                </span>
              </div>
            </div>

            {/* Escopo 2 - Duplo Reporte */}
            <div className="p-5 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.08)] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#93A3B5] flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-[#3B82F6]" />
                    Escopo 2 (Energia)
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-[#3B82F6]/10 text-[#3B82F6] font-semibold">
                    Duplo Reporte
                  </span>
                </div>
                <div className="text-2xl font-heading font-black text-[#F4F7FA]">
                  {totaisCalculados.escopo2T.toFixed(3)}{' '}
                  <span className="text-xs font-normal text-[#93A3B5]">tCO₂e</span>
                </div>
                <div className="mt-2 text-[11px] space-y-1">
                  <div className="flex justify-between text-[#93A3B5]">
                    <span>Localização (MCTI/SIN 2025):</span>
                    <span className="font-mono text-[#F4F7FA]">
                      {totaisCalculados.escopo2T.toFixed(3)} tCO₂e
                    </span>
                  </div>
                  <div className="flex justify-between text-[#93A3B5]">
                    <span>Mercado (c/ I-REC):</span>
                    <span className="font-mono text-[#12B886]">
                      {aplicarIREC
                        ? '0.000 tCO₂e'
                        : `${totaisCalculados.escopo2T.toFixed(3)} tCO₂e`}
                    </span>
                  </div>
                </div>
              </div>
              <div className="pt-3 border-t border-[rgba(244,247,250,0.06)] mt-3 flex items-center justify-between">
                <label className="text-[10px] text-[#93A3B5] flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={aplicarIREC}
                    onChange={(e) => setAplicarIREC(e.target.checked)}
                    className="rounded border-[rgba(244,247,250,0.2)] text-[#12B886] focus:ring-[#12B886]"
                  />
                  <span>Aplicar I-REC (Mercado)</span>
                </label>
                <span className="text-[10px] font-mono text-[#3B82F6]">
                  {totaisCalculados.pctEscopo2.toFixed(1)}%
                </span>
              </div>
            </div>

            {/* Escopo 3 */}
            <div className="p-5 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.08)] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#93A3B5] flex items-center gap-1.5">
                    <Truck className="w-4 h-4 text-[#8B5CF6]" />
                    Escopo 3 (Cadeia de Valor)
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-[#8B5CF6]/10 text-[#8B5CF6] font-semibold">
                    GLEC / DEFRA
                  </span>
                </div>
                <div className="text-2xl font-heading font-black text-[#F4F7FA]">
                  {totaisCalculados.escopo3T.toFixed(3)}{' '}
                  <span className="text-xs font-normal text-[#93A3B5]">tCO₂e</span>
                </div>
                <p className="text-[11px] text-[#93A3B5] mt-1">
                  Insumos (papelão), frete terceirizado, viagens e serviços municipais.
                </p>
              </div>
              <div className="pt-3 border-t border-[rgba(244,247,250,0.06)] mt-3 flex items-center justify-between text-[11px]">
                <span className="text-[#93A3B5]">Insetting ISO 14067:</span>
                <span className="text-[#12B886] font-mono font-semibold">
                  -{totaisCalculados.insettingT.toFixed(2)} t evitada
                </span>
              </div>
            </div>

            {/* Emissões Biogênicas (Fora dos Escopos Fósseis) */}
            <div className="p-5 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.08)] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#12B886] flex items-center gap-1.5">
                    <Leaf className="w-4 h-4 text-[#12B886]" />
                    Emissões Biogênicas
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-[#12B886]/20 text-[#12B886] font-semibold">
                    FORA DOS ESCOPOS
                  </span>
                </div>
                <div className="text-2xl font-heading font-black text-[#12B886]">
                  {totaisCalculados.biogenicoT.toFixed(3)}{' '}
                  <span className="text-xs font-normal text-[#93A3B5]">tCO₂</span>
                </div>
                <p className="text-[11px] text-[#93A3B5] mt-1">
                  Etanol e parcela renovável de biodiesel (B14). Ciclo curto canavieiro relatado à
                  parte.
                </p>
              </div>
              <div className="pt-3 border-t border-[rgba(244,247,250,0.06)] mt-3 flex items-center justify-between text-[11px]">
                <span className="text-[#93A3B5]">Norma:</span>
                <span className="text-[#12B886] font-semibold">ISO 14064-1 & GHG BR</span>
              </div>
            </div>
          </div>

          {/* Barra de Distribuição Proporcional */}
          <div className="p-4 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.08)]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-[#93A3B5] mb-2 gap-2">
              <span className="font-bold text-[#F4F7FA]">
                Distribuição Proporcional de Emissões Fósseis por Escopo:
              </span>
              <span className="font-mono text-[#F4F7FA]">
                Passivo Fóssil: <strong>{totaisCalculados.totalFossilT.toFixed(2)} tCO₂e</strong> |
                Biogênico em Separado:{' '}
                <strong className="text-[#12B886]">
                  {totaisCalculados.biogenicoT.toFixed(2)} tCO₂
                </strong>
              </span>
            </div>

            <div className="w-full h-3 rounded-full bg-[#16202B] overflow-hidden flex">
              <div
                className="bg-[#F59E0B] h-full transition-all"
                style={{ width: `${Math.max(2, totaisCalculados.pctEscopo1)}%` }}
                title={`Escopo 1: ${totaisCalculados.pctEscopo1.toFixed(1)}%`}
              />
              <div
                className="bg-[#3B82F6] h-full transition-all"
                style={{ width: `${Math.max(1, totaisCalculados.pctEscopo2)}%` }}
                title={`Escopo 2: ${totaisCalculados.pctEscopo2.toFixed(1)}%`}
              />
              <div
                className="bg-[#8B5CF6] h-full transition-all"
                style={{ width: `${Math.max(2, totaisCalculados.pctEscopo3)}%` }}
                title={`Escopo 3: ${totaisCalculados.pctEscopo3.toFixed(1)}%`}
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] text-[#93A3B5] mt-2">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#F59E0B]" />
                  <span>
                    Escopo 1: {totaisCalculados.escopo1T.toFixed(2)} t (
                    {totaisCalculados.pctEscopo1.toFixed(0)}%)
                  </span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#3B82F6]" />
                  <span>
                    Escopo 2: {totaisCalculados.escopo2T.toFixed(2)} t (
                    {totaisCalculados.pctEscopo2.toFixed(0)}%)
                  </span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#8B5CF6]" />
                  <span>
                    Escopo 3: {totaisCalculados.escopo3T.toFixed(2)} t (
                    {totaisCalculados.pctEscopo3.toFixed(0)}%)
                  </span>
                </span>
              </div>
              <span className="text-[#12B886] font-semibold">
                Incerteza Ponderada Amostral: ±{totaisCalculados.incertezaMedia}%
              </span>
            </div>
          </div>

          {/* 4 Cards de Destaque Metodológico: Tiers, IPCC AR6, Insetting ISO 14067 e Auditoria ISAE 3000 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.06)]">
              <div className="flex items-center justify-between text-xs text-[#93A3B5] mb-1">
                <span className="font-bold text-[#F4F7FA]">Tiers de Incerteza</span>
                <span className="text-[10px] text-[#D9B36C] font-mono">
                  {notas.filter((n) => n.tierIncerteza === 'Tier 3').length} Tier 3 •{' '}
                  {notas.filter((n) => n.tierIncerteza === 'Tier 2').length} Tier 2 •{' '}
                  {notas.filter((n) => n.tierIncerteza === 'Tier 1').length} Tier 1
                </span>
              </div>
              <div className="text-sm font-semibold text-[#12B886]">
                Hierarquia dMRV GHG Protocol
              </div>
              <p className="text-[11px] text-[#93A3B5] mt-1">
                Tier 3 = dado físico direto; Tier 2 = fator ACV (base física); Tier 1 = spend-based
                (±18%).
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.06)]">
              <div className="flex items-center justify-between text-xs text-[#93A3B5] mb-1">
                <span className="font-bold text-[#F4F7FA]">Métricas IPCC AR6</span>
                <span className="text-[10px] text-[#3B82F6] font-mono">GWP-100</span>
              </div>
              <div className="text-sm font-semibold text-[#F4F7FA]">
                AR6 (2021) CH₄: 29.8 | N₂O: 273
              </div>
              <p className="text-[11px] text-[#93A3B5] mt-1">
                Equivalência atualizada de gases de efeito estufa para as certificadoras
                internacionais.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.06)]">
              <div className="flex items-center justify-between text-xs text-[#93A3B5] mb-1">
                <span className="font-bold text-[#F4F7FA]">Insetting ISO 14067</span>
                <span className="text-[10px] text-[#12B886] font-mono">Pegada Evitada</span>
              </div>
              <div className="text-sm font-semibold text-[#12B886]">-1.13 tCO₂e Carga Evitada</div>
              <p className="text-[11px] text-[#93A3B5] mt-1">
                Intervenções diretas na cadeia produtiva (papelão reciclado) sem dependência de
                offsets.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.06)]">
              <div className="flex items-center justify-between text-xs text-[#93A3B5] mb-1">
                <span className="font-bold text-[#F4F7FA]">Auditoria de 3ª Parte</span>
                <span className="text-[10px] text-[#D9B36C] font-mono">ISAE 3000</span>
              </div>
              <div className="text-sm font-semibold text-[#D9B36C]">Asseguração Razoável</div>
              <p className="text-[11px] text-[#93A3B5] mt-1">
                Em conformidade com NBC TO 3000 / ISAE 3000 e ABNT NBR ISO 14064-3.
              </p>
            </div>
          </div>

          {/* BARRA DE ENTRADA COM OS 3 MODELOS SEFAZ & CONECTORES DE FATORES */}
          <div className="p-5 rounded-xl bg-gradient-to-r from-[#16202B] via-[#111820] to-[#16202B] border border-[#12B886]/40 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#12B886] block">
                  Ingestão Automática SEFAZ sem Envio Manual de Arquivos
                </span>
                <h4 className="font-heading font-bold text-base text-[#F4F7FA]">
                  3 Modelos Oficiais de Conexão SEFAZ
                </h4>
                <p className="text-xs text-[#93A3B5]">
                  PMEs e indústrias integram notas fiscais via Procuração e-CAC, autorização do
                  Contador ou e-CNPJ A1.
                </p>
              </div>

              {/* Botões dos 3 Modelos SEFAZ */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setModeloIngestaoSefaz('ecac')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    modeloIngestaoSefaz === 'ecac'
                      ? 'bg-[#12B886] text-[#0A0E12] font-bold shadow-emerald-glow'
                      : 'bg-[#0A0E12] text-[#93A3B5] border border-[rgba(244,247,250,0.1)] hover:text-[#F4F7FA]'
                  }`}
                >
                  e-CAC RFB
                </button>
                <button
                  type="button"
                  onClick={() => setModeloIngestaoSefaz('contador')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    modeloIngestaoSefaz === 'contador'
                      ? 'bg-[#12B886] text-[#0A0E12] font-bold shadow-emerald-glow'
                      : 'bg-[#0A0E12] text-[#93A3B5] border border-[rgba(244,247,250,0.1)] hover:text-[#F4F7FA]'
                  }`}
                >
                  Contador
                </button>
                <button
                  type="button"
                  onClick={() => setModeloIngestaoSefaz('a1')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    modeloIngestaoSefaz === 'a1'
                      ? 'bg-[#12B886] text-[#0A0E12] font-bold shadow-emerald-glow'
                      : 'bg-[#0A0E12] text-[#93A3B5] border border-[rgba(244,247,250,0.1)] hover:text-[#F4F7FA]'
                  }`}
                >
                  A1 Certisign
                </button>
              </div>
            </div>

            {/* Explicação dinâmica do modelo SEFAZ selecionado */}
            <div className="p-3.5 rounded-lg bg-[#0A0E12] border border-[rgba(244,247,250,0.08)] text-xs text-[#93A3B5] flex items-start gap-3">
              <ShieldCheck className="w-4 h-4 text-[#12B886] shrink-0 mt-0.5" />
              <div>
                {modeloIngestaoSefaz === 'ecac' && (
                  <span>
                    <strong>Modelo e-CAC RFB:</strong> Ingestão contínua por procuração eletrônica
                    no portal e-CAC da Receita Federal, sem necessidade de compartilhar senha nem
                    token de assinatura privada.
                  </span>
                )}
                {modeloIngestaoSefaz === 'contador' && (
                  <span>
                    <strong>Modelo Contador:</strong> Acesso seguro delegado via Conselho CRC com
                    chave de API de escritório contábil credenciado para sincronização do SPED e
                    NF-e.
                  </span>
                )}
                {modeloIngestaoSefaz === 'a1' && (
                  <span>
                    <strong>Modelo A1 Certisign / ICP-Brasil:</strong> Custódia segura em HSM com
                    criptografia de ponta e termo LGPD para captura direta no webservice nacional da
                    SEFAZ.
                  </span>
                )}
              </div>
            </div>

            {/* Conectores de Fatores de Emissão */}
            <div className="pt-3 border-t border-[rgba(244,247,250,0.08)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <span className="text-xs text-[#93A3B5] font-semibold">
                Provedor de Fatores de Emissão (Connectors Ativos):
              </span>
              <div className="flex flex-wrap items-center gap-2">
                {[
                  { id: 'ghg_br', label: 'GHG Protocol BR (SIN/MCTI)' },
                  { id: 'climatiq', label: 'Climatiq API (Global Engine)' },
                  { id: 'defra', label: 'DEFRA UK / Ecoinvent 3.10' },
                  { id: 'epa', label: 'EPA US Climate Leaders' },
                ].map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setConectorAtivo(c.id as any)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                      conectorAtivo === c.id
                        ? 'bg-[#12B886]/20 border border-[#12B886] text-[#12B886] font-bold'
                        : 'bg-[#0A0E12] border border-[rgba(244,247,250,0.08)] text-[#93A3B5] hover:text-[#F4F7FA]'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* FILTROS DA DEMONSTRAÇÃO FISCAL */}
          <div className="space-y-3 pt-2">
            {/* Categoria Operacional */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#93A3B5]">
                <Filter className="w-3.5 h-3.5 text-[#12B886]" />
                <span>Filtrar por Categoria Operacional:</span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                {[
                  { id: 'todos', label: `Todos (${notas.length})` },
                  { id: 'frota', label: 'Frota Própria (Escopo 1)' },
                  { id: 'frete', label: 'Frete Terceirizado (Escopo 3)' },
                  { id: 'instalacoes', label: 'Instalações & Energia' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setFiltroCategoria(cat.id)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                      filtroCategoria === cat.id
                        ? 'bg-[#12B886] text-[#0A0E12]'
                        : 'bg-[#0A0E12] text-[#93A3B5] border border-[rgba(244,247,250,0.1)] hover:text-[#F4F7FA]'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Filtro por Modelo Fiscal (10 Modelos) */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[#93A3B5]">
                Filtrar por Modelo Fiscal (10 Modelos ESG):
              </span>
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                {[
                  { id: 'todos', label: 'Todos' },
                  { id: '55_nfe', label: 'NF-e (Mod 55)' },
                  { id: '65_nfce', label: 'NFC-e (Mod 65)' },
                  { id: 'nfse', label: 'NFS-e (Municipal)' },
                  { id: '57_cte', label: 'CT-e (Mod 57)' },
                  { id: '58_mdfe', label: 'MDF-e (Mod 58)' },
                  { id: '66_nf3e', label: 'NF3e (Energia)' },
                  { id: '62_nfcom', label: 'NFCom (Mod 62)' },
                  { id: '63_bpe', label: 'BP-e (Mod 63)' },
                  { id: '67_cte_os', label: 'CT-e OS (Mod 67)' },
                  { id: 'fatura_agua', label: 'Água & Saneamento' },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setFiltroModelo(m.id)}
                    className={`px-2.5 py-1 rounded-md text-[11px] transition-all ${
                      filtroModelo === m.id
                        ? 'bg-[#12B886]/20 border border-[#12B886] text-[#12B886] font-bold'
                        : 'bg-[#0A0E12] border border-[rgba(244,247,250,0.06)] text-[#93A3B5] hover:text-[#F4F7FA]'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Cabeçalho de Contagem e Botão Restaurar */}
            <div className="flex items-center justify-between pt-2 border-t border-[rgba(244,247,250,0.06)] text-xs text-[#93A3B5]">
              <div>
                Notas Filtradas e Ativas:{' '}
                <strong className="text-[#F4F7FA]">{totaisCalculados.totalAtivas}</strong> de{' '}
                <strong className="text-[#F4F7FA]">{notas.length}</strong> (Amostra demonstrativa)
              </div>
              <button
                type="button"
                onClick={restaurarTodasNotas}
                className="text-xs font-semibold text-[#12B886] hover:underline flex items-center gap-1"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Restaurar 12 Notas de Exemplo (10 Modelos)</span>
              </button>
            </div>
          </div>

          {/* LISTA DAS 12 NOTAS FISCAIS DEMONSTRATIVAS */}
          <div className="space-y-3">
            {notasFiltradas.map((nota) => {
              const estaAtiva = notasAtivasIds.includes(nota.id)
              const escopoBadge =
                nota.escopoAlvo === 'escopo_1'
                  ? { bg: 'bg-[#F59E0B]/10 text-[#F59E0B]', label: 'Escopo 1' }
                  : nota.escopoAlvo === 'escopo_2'
                    ? { bg: 'bg-[#3B82F6]/10 text-[#3B82F6]', label: 'Escopo 2' }
                    : { bg: 'bg-[#8B5CF6]/10 text-[#8B5CF6]', label: 'Escopo 3' }

              return (
                <div
                  key={nota.id}
                  className={`p-4 sm:p-5 rounded-xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    estaAtiva
                      ? 'bg-[#0A0E12] border-[rgba(244,247,250,0.12)] hover:border-[#12B886]/50'
                      : 'bg-[#0A0E12]/50 border-[rgba(244,247,250,0.04)] opacity-50'
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    {/* Checkbox de ativação interativa */}
                    <input
                      type="checkbox"
                      checked={estaAtiva}
                      onChange={() => toggleNotaAtiva(nota.id)}
                      className="mt-1 rounded border-[rgba(244,247,250,0.2)] text-[#12B886] focus:ring-[#12B886] cursor-pointer"
                      title="Ativar/desativar nota no balanço de emissões"
                    />

                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-heading font-bold text-sm text-[#F4F7FA]">
                          {nota.titulo}
                        </span>
                        <span className="text-[11px] font-mono text-[#93A3B5]">
                          Doc: {nota.numeroDocumento}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-[#16202B] text-[10px] font-semibold text-[#12B886] border border-[#12B886]/20">
                          {nota.modeloFormatado}
                        </span>
                        <span className="text-[10px] font-mono text-[#D9B36C]">
                          CNAE: {nota.cnae}
                        </span>
                        <span className="text-[10px] text-[#12B886] font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          {nota.statusSefaz}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#16202B] text-[#D9B36C] font-mono">
                          {nota.tierIncerteza} (±{nota.incertezaPct}%)
                        </span>
                        {nota.insettingKgCo2e > 0 && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#12B886]/20 text-[#12B886] font-bold">
                            Insetting ISO 14067
                          </span>
                        )}
                        {nota.biogenicoKgCo2 > 0 && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#12B886]/20 text-[#12B886] font-mono">
                            Biogênico{' '}
                            {nota.detalhesJson.mistura_biodiesel
                              ? `(${nota.detalhesJson.mistura_biodiesel})`
                              : ''}
                            : {nota.biogenicoKgCo2.toFixed(1)} kg CO₂
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-[#93A3B5] leading-relaxed">
                        <span className="text-[#F4F7FA] font-medium">
                          {nota.razaoSocialParceiro}
                        </span>
                        {nota.cnpj && <span> • CNPJ: {nota.cnpj}</span>}
                        <span> • Emissão: {nota.dataEmissao}</span>
                      </div>
                      <p className="text-[11px] text-[#93A3B5] mt-1 font-mono">
                        {nota.detalhesJson.discriminacao}
                      </p>
                    </div>
                  </div>

                  {/* Valores e Emissão Calculada por Escopo */}
                  <div className="flex items-center justify-between md:justify-end gap-6 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-[rgba(244,247,250,0.06)]">
                    <div className="text-left md:text-right">
                      <div className="text-xs text-[#93A3B5] font-semibold">
                        {formatCurrencyBRL(nota.valorBrl)}
                      </div>
                      <div className="text-[11px] font-mono text-[#F4F7FA]">
                        Qtd: {nota.quantidadeDeclarada}
                      </div>
                    </div>

                    <div className="text-right min-w-[130px]">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase mb-1 ${escopoBadge.bg}`}
                      >
                        {escopoBadge.label}
                      </span>
                      <div className="font-heading font-bold text-base text-[#F4F7FA] font-mono">
                        {nota.fossilKgCo2e.toLocaleString('pt-BR', { minimumFractionDigits: 1 })}{' '}
                        <span className="text-xs font-normal text-[#93A3B5]">kg CO₂e</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setNotaSelecionadaDetalhes(nota)}
                        className="text-[10px] text-[#12B886] hover:underline block ml-auto mt-0.5"
                      >
                        Ver Memória dMRV →
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Rodapé da Apuração com Hash de Integridade e Hash de Fechamento por Competência */}
          <div className="p-4 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.08)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#93A3B5]">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#12B886]" />
              <span>
                Cálculos em estrita conformidade com a Metodologia GHG Protocol Brasil & Diretrizes
                IFRS S2 / CBPS 02.
              </span>
            </div>
            <div className="flex flex-col sm:items-end gap-1">
              <div className="font-mono text-[11px] text-[#12B886] flex items-center gap-1 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#12B886]" />
                <span>
                  Hash de fechamento da competência:{' '}
                  {(dossie.hashFechamentoCompetencia || dossie.hashIntegridade).slice(0, 14)}...
                  {(dossie.hashFechamentoCompetencia || dossie.hashIntegridade).slice(-6)}{' '}
                  verificado ✓
                </span>
              </div>
              <div className="font-mono text-[10px] text-[#93A3B5]">
                Hash Integridade: {dossie.hashIntegridade.slice(0, 16)}...
                {dossie.hashIntegridade.slice(-4)}
              </div>
            </div>
          </div>
        </div>

        {/* 5. SEÇÃO DE RECOMENDAÇÃO E INTEGRAÇÃO COM MÓDULOS REAIS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.12)] flex flex-col justify-between shadow-xl">
            <div>
              <div className="w-10 h-10 rounded-xl bg-[#12B886]/10 text-[#12B886] flex items-center justify-center mb-4">
                <Scale className="w-5 h-5" />
              </div>
              <h4 className="font-heading font-bold text-base text-[#F4F7FA] mb-2">
                Comparativo da Reforma Tributária
              </h4>
              <p className="text-xs text-[#93A3B5] leading-relaxed">
                Veja o impacto prático da Emenda Constitucional 132/2023, creditamento pleno de
                IBS/CBS e as regras do Imposto Seletivo para os itens da empresa.
              </p>
            </div>
            <Link
              to="/diagnostico"
              className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-[#12B886] hover:underline"
            >
              <span>Abrir Diagnóstico Tributário</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="p-6 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.12)] flex flex-col justify-between shadow-xl">
            <div>
              <div className="w-10 h-10 rounded-xl bg-[#3B82F6]/10 text-[#3B82F6] flex items-center justify-center mb-4">
                <Database className="w-5 h-5" />
              </div>
              <h4 className="font-heading font-bold text-base text-[#F4F7FA] mb-2">
                Hub Fiscal de Ingestão Real
              </h4>
              <p className="text-xs text-[#93A3B5] leading-relaxed">
                Carregue os XMLs e arquivos SPED reais da sua organização pelo Painel do Cliente ou
                ative a importação contínua via InfoSimples.
              </p>
            </div>
            <Link
              to="/painel"
              className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-[#3B82F6] hover:underline"
            >
              <span>Acessar Hub Fiscal Completo</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="p-6 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.12)] flex flex-col justify-between shadow-xl">
            <div>
              <div className="w-10 h-10 rounded-xl bg-[#D9B36C]/10 text-[#D9B36C] flex items-center justify-center mb-4">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h4 className="font-heading font-bold text-base text-[#F4F7FA] mb-2">
                Verificador & Laudo Pericial
              </h4>
              <p className="text-xs text-[#93A3B5] leading-relaxed">
                Consulte o registro probatório em blockchain privada, com chancela de perito
                credenciado (CREA/CRC) e QR Code rastreável.
              </p>
            </div>
            <Link
              to="/verificador"
              className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-[#D9B36C] hover:underline"
            >
              <span>Testar no Verificador Público</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Modal de Detalhes da Nota Fiscal Selecionada */}
        {notaSelecionadaDetalhes && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in-0 duration-150">
            <div className="w-full max-w-xl p-6 rounded-2xl bg-[#111820] border border-[#12B886]/40 shadow-2xl relative space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[rgba(244,247,250,0.1)]">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[#12B886]">
                    Memória dMRV do Documento Fiscal
                  </span>
                  <h4 className="font-heading font-bold text-base text-[#F4F7FA]">
                    {notaSelecionadaDetalhes.titulo}
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => setNotaSelecionadaDetalhes(null)}
                  className="p-1 rounded-lg text-[#93A3B5] hover:text-[#F4F7FA] text-lg font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.06)]">
                  <div>
                    <span className="text-[#93A3B5] block">Modelo Fiscal:</span>
                    <strong className="text-[#F4F7FA]">
                      {notaSelecionadaDetalhes.modeloFormatado}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[#93A3B5] block">Número Documento:</span>
                    <strong className="font-mono text-[#F4F7FA]">
                      {notaSelecionadaDetalhes.numeroDocumento}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[#93A3B5] block">CNAE Emitente:</span>
                    <strong className="font-mono text-[#D9B36C]">
                      {notaSelecionadaDetalhes.cnae}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[#93A3B5] block">Status SEFAZ:</span>
                    <strong className="text-[#12B886]">
                      {notaSelecionadaDetalhes.statusSefaz}
                    </strong>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.06)] space-y-1.5">
                  <div className="text-[#93A3B5]">
                    Fonte do Fator Oficial:{' '}
                    <strong className="text-[#12B886]">
                      {notaSelecionadaDetalhes.detalhesJson.fonte_fator}
                    </strong>
                  </div>
                  <div className="text-[#93A3B5]">
                    Fator Numérico:{' '}
                    <strong className="font-mono text-[#F4F7FA]">
                      {notaSelecionadaDetalhes.detalhesJson.fator_numerico}{' '}
                      {notaSelecionadaDetalhes.detalhesJson.unidade_fator}
                    </strong>
                  </div>
                  <div className="text-[#93A3B5]">
                    Incerteza do Tier:{' '}
                    <strong className="text-[#D9B36C]">
                      {notaSelecionadaDetalhes.tierIncerteza} (±
                      {notaSelecionadaDetalhes.incertezaPct}%)
                    </strong>
                    {notaSelecionadaDetalhes.detalhesJson.metodologia_tier && (
                      <span className="block text-[11px] text-[#93A3B5] mt-0.5">
                        {notaSelecionadaDetalhes.detalhesJson.metodologia_tier}
                      </span>
                    )}
                  </div>
                  <div className="text-[#93A3B5]">
                    Subcategoria GHG:{' '}
                    <strong className="text-[#F4F7FA]">
                      {notaSelecionadaDetalhes.detalhesJson.subcategoria || 'Geral'}
                    </strong>
                  </div>
                </div>

                {/* Bloco de Memória do Insetting ISO 14067 (virgem x reciclado x delta x massa) */}
                {notaSelecionadaDetalhes.detalhesJson.insetting_memoria && (
                  <div className="p-3.5 rounded-xl bg-gradient-to-br from-[#12B886]/10 via-[#0A0E12] to-[#12B886]/5 border border-[#12B886]/40 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#12B886] uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                        <Leaf className="w-3.5 h-3.5" />
                        Memória de Cálculo de Insetting (ISO 14067)
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-[#12B886]/20 text-[#12B886] font-mono font-bold">
                        -
                        {notaSelecionadaDetalhes.detalhesJson.insetting_memoria.total_evitado_tco2e.toFixed(
                          2,
                        )}{' '}
                        tCO₂e Evitadas
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-center">
                      <div className="p-2 rounded-lg bg-[#0A0E12] border border-[rgba(244,247,250,0.06)]">
                        <span className="text-[10px] text-[#93A3B5] block">Papelão Virgem</span>
                        <strong className="font-mono text-xs text-[#F4F7FA]">
                          {notaSelecionadaDetalhes.detalhesJson.insetting_memoria.fator_virgem_kgco2e_kg.toFixed(
                            3,
                          )}
                        </strong>
                        <span className="text-[9px] text-[#93A3B5] block">kgCO₂e/kg</span>
                      </div>
                      <div className="p-2 rounded-lg bg-[#0A0E12] border border-[rgba(244,247,250,0.06)]">
                        <span className="text-[10px] text-[#93A3B5] block">Papelão Reciclado</span>
                        <strong className="font-mono text-xs text-[#12B886]">
                          {notaSelecionadaDetalhes.detalhesJson.insetting_memoria.fator_reciclado_kgco2e_kg.toFixed(
                            3,
                          )}
                        </strong>
                        <span className="text-[9px] text-[#93A3B5] block">kgCO₂e/kg</span>
                      </div>
                      <div className="p-2 rounded-lg bg-[#0A0E12] border border-[rgba(244,247,250,0.06)]">
                        <span className="text-[10px] text-[#93A3B5] block">Delta Evitado</span>
                        <strong className="font-mono text-xs text-[#D9B36C]">
                          {notaSelecionadaDetalhes.detalhesJson.insetting_memoria.delta_evitado_kgco2e_kg.toFixed(
                            3,
                          )}
                        </strong>
                        <span className="text-[9px] text-[#93A3B5] block">kgCO₂e/kg</span>
                      </div>
                      <div className="p-2 rounded-lg bg-[#0A0E12] border border-[rgba(244,247,250,0.06)]">
                        <span className="text-[10px] text-[#93A3B5] block">Massa Faturada</span>
                        <strong className="font-mono text-xs text-[#F4F7FA]">
                          {notaSelecionadaDetalhes.detalhesJson.insetting_memoria.massa_kg.toLocaleString(
                            'pt-BR',
                          )}{' '}
                          kg
                        </strong>
                        <span className="text-[9px] text-[#93A3B5] block">NF-e Mod 55</span>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-[#0A0E12] border border-[rgba(244,247,250,0.06)] text-[11px] text-[#93A3B5] font-mono leading-relaxed">
                      <div>
                        Fórmula:{' '}
                        <span className="text-[#F4F7FA]">
                          Δ (Virgem − Reciclado) × Massa = Emissão Evitada
                        </span>
                      </div>
                      <div className="text-[#12B886] mt-0.5">
                        (0,500 − 0,250 kgCO₂e/kg) × 4.500 kg = 1.125,0 kgCO₂e (−1,13 tCO₂e evitadas)
                      </div>
                      <div className="text-[10px] text-[#93A3B5] mt-1">
                        Norma:{' '}
                        {notaSelecionadaDetalhes.detalhesJson.insetting_memoria.norma_referencia}
                      </div>
                    </div>
                  </div>
                )}

                <div className="p-3 rounded-xl bg-[#16202B] border border-[#12B886]/30 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#93A3B5]">
                      Passivo Calculado:
                    </span>
                    <div className="font-heading font-bold text-lg text-[#12B886]">
                      {notaSelecionadaDetalhes.fossilKgCo2e.toLocaleString('pt-BR')} kg CO₂e
                    </div>
                  </div>
                  {notaSelecionadaDetalhes.biogenicoKgCo2 > 0 && (
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-[#93A3B5]">
                        Biogênico Separado:
                      </span>
                      <div className="font-heading font-bold text-base text-[#12B886]">
                        {notaSelecionadaDetalhes.biogenicoKgCo2.toLocaleString('pt-BR')} kg CO₂
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setNotaSelecionadaDetalhes(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#12B886] text-[#0A0E12]"
                >
                  Fechar Memória
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Nota Metodológica IPCC AR6 */}
        {modalMetodologiaAberta && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in-0 duration-150">
            <div className="w-full max-w-2xl p-6 sm:p-8 rounded-2xl bg-[#111820] border border-[#12B886]/40 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-[rgba(244,247,250,0.1)]">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[#12B886]">
                    Norma Técnica & Metodologia
                  </span>
                  <h4 className="font-heading font-bold text-lg text-[#F4F7FA]">
                    Parâmetros Metodológicos dMRV • IPCC AR6 & GHG Protocol Brasil
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => setModalMetodologiaAberta(false)}
                  className="p-1 rounded-lg text-[#93A3B5] hover:text-[#F4F7FA] text-lg font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3 text-xs text-[#93A3B5] leading-relaxed">
                <p>
                  O motor dMRV da Orbis Protocol opera em estrita consonância com a norma{' '}
                  <strong className="text-[#F4F7FA]">ABNT NBR ISO 14064-1:2019</strong>, os fatores
                  oficiais do{' '}
                  <strong className="text-[#F4F7FA]">Programa Brasileiro GHG Protocol</strong> e as
                  tabelas de potencial de aquecimento global (GWP-100) do{' '}
                  <strong className="text-[#F4F7FA]">
                    IPCC Sexto Relatório de Avaliação (AR6, 2021)
                  </strong>
                  .
                </p>

                <div className="p-4 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.06)] space-y-2">
                  <div className="font-bold text-[#F4F7FA] uppercase tracking-wider text-[11px]">
                    1. Potenciais GWP Adotados (100 anos - IPCC AR6):
                  </div>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Dióxido de Carbono (CO₂): GWP = 1.0</li>
                    <li>Metano fóssil (CH₄): GWP = 29.8 (IPCC AR6 WGI com feedbacks climáticos)</li>
                    <li>Óxido Nitroso (N₂O): GWP = 273 (atualizado do AR5 que utilizava 265)</li>
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.06)] space-y-2">
                  <div className="font-bold text-[#F4F7FA] uppercase tracking-wider text-[11px]">
                    2. Duplo Reporte de Escopo 2 (Scope 2 Guidance):
                  </div>
                  <p>
                    Seguindo as diretrizes internacionais, a energia elétrica consumida da rede
                    nacional (SIN) é computada por duas abordagens:
                  </p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>
                      <strong>Abordagem de Localização:</strong> Baseada no fator médio de emissão
                      do Sistema Interligado Nacional (SIN), publicado pelo MCTI – Ano-Base 2025:
                      0,0289 kgCO₂e/kWh (fator médio anual oficial).
                    </li>
                    <li>
                      <strong>Abordagem de Mercado:</strong> Aplicável caso a corporação apresente
                      Certificados de Energia Renovável (I-REC) ou contrato bilateral no Ambiente de
                      Contratação Livre (ACL) com energia 100% incentivada.
                    </li>
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.06)] space-y-2">
                  <div className="font-bold text-[#F4F7FA] uppercase tracking-wider text-[11px]">
                    3. Asseguração Contábil e Probatória:
                  </div>
                  <p>
                    Os laudos periciais são emitidos com trilha de auditoria para fins de
                    asseguração limitada ou razoável conforme a norma contábil{' '}
                    <strong className="text-[#F4F7FA]">NBC TO 3000 / ISAE 3000</strong> e preparação
                    para o SBCE (Lei Federal 15.042/2024).
                  </p>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setModalMetodologiaAberta(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#12B886] text-[#0A0E12]"
                >
                  Entendido
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
