import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Compass,
  ArrowRight,
  ShieldCheck,
  Recycle,
  Sparkles,
  Car,
  Receipt,
  Layers,
  HelpCircle,
  Building2,
  FileCheck2,
  Cpu,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react'
import { SecaoTresEixosNarrativos } from '@/components/hub-solucoes/SecaoTresEixosNarrativos'
import { SecaoCircularidadeDpp } from '@/components/hub-solucoes/SecaoCircularidadeDpp'
import { ModalFormularioOrbisLpf } from '@/components/FormularioOrbisLpf'

export interface RamoDecisao {
  id: string
  pergunta: string
  subtexto: string
  icone: React.ElementType
  solucaoRecomendada: {
    titulo: string
    descricao: string
    caminho: string
    cta: string
    badge?: string
    isLpf?: boolean
  }
}

export const RAMOS_ARVORE_DECISAO: RamoDecisao[] = [
  {
    id: 'residuos-reciclagem',
    pergunta: 'Sua empresa recicla ou gera resíduo industrial?',
    subtexto:
      'Gere lastro probatório para rastreabilidade de massas, atendimento ao PNRS e comprovação fiscal.',
    icone: Recycle,
    solucaoRecomendada: {
      titulo: 'Logística Reversa & Balanço de Massa (PNRS)',
      descricao:
        'Infraestrutura de prova documental sob o Decreto 11.413/2023 com rastreio de frações, balanço auditável e documentos para órgãos de controle. Sem promessa de créditos sem evidência.',
      caminho: '/solucoes#logistica-reversa',
      cta: 'Ver estrutura de Logística Reversa',
      badge: 'Em estruturação',
    },
  },
  {
    id: 'metais-criticos',
    pergunta: 'Compra ou processa aço, alumínio, cobre ou polímeros?',
    subtexto:
      'Comprove o prêmio de origem urbana para terras raras, cobre e metais nobres com passaporte imutável.',
    icone: Cpu,
    solucaoRecomendada: {
      titulo: 'Mineração Urbana & Materiais Críticos (Passaporte DCP)',
      descricao:
        'Prova documental de origem urbana e desmonte REEE/VFV com Passaporte Digital de Produto (DCP), hash SHA-256 e blindagem contra receptação qualificada.',
      caminho: '/materiais-criticos',
      cta: 'Acessar Passaporte DCP',
      badge: 'DCP',
    },
  },
  {
    id: 'mover-cdverde',
    pergunta: 'Precisa atender o Programa MOVER ou CDVerde?',
    subtexto:
      'Centros de desmontagem veicular, montadoras e frotistas sob as regras da Lei Federal 14.902/2024.',
    icone: Car,
    solucaoRecomendada: {
      titulo: 'Descarbonização via MOVER & Case CDVerde',
      descricao:
        'Rastreabilidade completa de peças verdes e baterias de tração com baixa no DETRAN, passaporte QR Code e alinhamento com a metodologia GS 448 para emissão de créditos via VVB independente.',
      caminho: '/mover',
      cta: 'Conhecer Programa MOVER',
      badge: 'Lei 14.902',
    },
  },
  {
    id: 'reforma-tributaria',
    pergunta: 'Precisa comprovar conformidade tributária na reforma (IBS/CBS/IVA)?',
    subtexto:
      'Antecipe o impacto do IVA dual da LC 214/2025 e audite a intensidade carbônica da sua nota fiscal.',
    icone: Receipt,
    solucaoRecomendada: {
      titulo: 'Orbis LPF — Leitura Pré-Faturamento & Diagnóstico',
      descricao:
        'Leitura antecipada da intensidade de carbono antes do faturamento, com apuração de créditos e situação tributária em relação à reforma — produto central: pegada de carbono das notas.',
      caminho: '/diagnostico',
      cta: 'Calcular pegada e situação tributária',
      badge: 'Oferta piloto',
      isLpf: true,
    },
  },
]

import { useSeo } from '@/hooks/useSeo'

export default function SolucoesIndex() {
  useSeo({
    title: 'Hub de Soluções e Árvore de Decisão — Orbis Protocol',
    description:
      'Infraestrutura probatória e dMRV: escolha a solução exata para sua empresa entre descarbonização, rastreabilidade fiscal e circularidade.',
  })

  const [ramoAtivoId, setRamoAtivoId] = useState<string>('residuos-reciclagem')
  const [modalLpfAberto, setModalLpfAberto] = useState(false)

  const ramoAtivo =
    RAMOS_ARVORE_DECISAO.find((r) => r.id === ramoAtivoId) || RAMOS_ARVORE_DECISAO[0]

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0A1628] text-slate-900 dark:text-[#F8FAFC] transition-colors">
      {/* 1. HERO COM ÁRVORE DE DECISÃO */}
      <section
        id="arvore-decisao"
        aria-label="Árvore de decisão de soluções"
        className="py-14 sm:py-20 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0A1628] relative overflow-hidden"
      >
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 relative z-10">
          {/* Header da Árvore */}
          <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-400 text-xs font-mono font-semibold uppercase tracking-wider mb-4">
              <Compass className="w-3.5 h-3.5 stroke-[1.8]" />
              ÁRVORE DE DECISÃO DO ORBIS PROTOCOL
            </div>
            <h1 className="font-heading font-black text-2xl sm:text-4xl md:text-5xl text-slate-900 dark:text-white tracking-tight mb-4">
              Qual é o desafio da sua empresa?
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
              Em vez de um catálogo disperso de links, selecione abaixo a realidade operacional da
              sua organização para ser direcionado à solução exata de prova documental e
              rastreabilidade.
            </p>
          </div>

          {/* Grid de Perguntas-Ramo (Interativas) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {RAMOS_ARVORE_DECISAO.map((ramo) => {
              const Icone = ramo.icone
              const isSelected = ramo.id === ramoAtivo.id

              return (
                <button
                  key={ramo.id}
                  type="button"
                  onClick={() => setRamoAtivoId(ramo.id)}
                  aria-pressed={isSelected}
                  className={`p-5 rounded-2xl text-left transition-all flex flex-col justify-between min-h-[160px] border ${
                    isSelected
                      ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-500 shadow-md ring-2 ring-emerald-500/30 dark:ring-emerald-400/20'
                      : 'bg-white dark:bg-[#0E1A2E] border-slate-200 dark:border-slate-800 hover:border-emerald-400/60 dark:hover:border-slate-700 shadow-xs'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                          isSelected
                            ? 'bg-emerald-600 text-white dark:bg-emerald-500 dark:text-slate-950'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        <Icone className="w-4 h-4 stroke-[2]" />
                      </div>
                      {isSelected && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-emerald-700 dark:text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Selecionado
                        </span>
                      )}
                    </div>
                    <h2 className="font-heading font-bold text-sm text-slate-900 dark:text-white leading-snug">
                      {ramo.pergunta}
                    </h2>
                  </div>

                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 line-clamp-2">
                    {ramo.subtexto}
                  </p>
                </button>
              )
            })}
          </div>

          {/* Resolução do Ramo Ativo (Painel Destacado) */}
          <div className="p-6 sm:p-10 rounded-3xl bg-slate-900 text-white dark:bg-[#0E1A2E] dark:text-[#F8FAFC] border border-slate-800 dark:border-slate-700 shadow-xl transition-all">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-3 max-w-3xl">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                    Solução Recomendada
                  </span>
                  {ramoAtivo.solucaoRecomendada.badge && (
                    <span className="text-[11px] font-mono font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      {ramoAtivo.solucaoRecomendada.badge}
                    </span>
                  )}
                </div>

                <h3 className="font-heading font-black text-xl sm:text-2xl md:text-3xl text-white tracking-tight">
                  {ramoAtivo.solucaoRecomendada.titulo}
                </h3>

                <p className="text-xs sm:text-sm text-slate-300 dark:text-[#94A3B8] leading-relaxed">
                  {ramoAtivo.solucaoRecomendada.descricao}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
                {ramoAtivo.solucaoRecomendada.isLpf && (
                  <button
                    type="button"
                    onClick={() => setModalLpfAberto(true)}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold bg-white text-slate-950 hover:bg-slate-100 transition-all text-xs sm:text-sm shadow-md min-h-[44px]"
                  >
                    <span>Solicitar Leitura Gratuita (LPF)</span>
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                  </button>
                )}

                <Link
                  to={ramoAtivo.solucaoRecomendada.caminho}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold bg-emerald-600 text-white hover:bg-emerald-500 transition-all text-xs sm:text-sm shadow-md min-h-[44px]"
                >
                  <span>{ramoAtivo.solucaoRecomendada.cta}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. REUTILIZAÇÃO DOS COMPONENTES PRONTOS DE SRC/COMPONENTS/HUB-SOLUCOES */}
      {/* Seção 1: Os 3 Eixos Narrativos (Descarbonização, Tributário, Circularidade) */}
      <SecaoTresEixosNarrativos
        id="tres-eixos"
        exibirHeader={true}
        exibirBlocoLogisticaReversa={true}
      />

      {/* Seção 2: Circularidade e Passaporte Digital de Produto (DPP) */}
      <SecaoCircularidadeDpp id="circularidade-dpp" />

      {/* 3. VITRINE DE PÁGINAS-FILHAS DO HUB SOLUÇÕES */}
      <section
        id="todas-solucoes"
        aria-label="Catálogo das soluções da infraestrutura"
        className="py-16 md:py-24 bg-slate-100/60 dark:bg-[#070D18] border-t border-slate-200 dark:border-slate-800"
      >
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
            <div>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-700 dark:text-[#059669] block mb-2">
                PÁGINAS DO HUB
              </span>
              <h2 className="font-heading font-black text-2xl sm:text-3xl text-slate-900 dark:text-white">
                Todas as Soluções & Portais Especializados
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-[#94A3B8] mt-1 max-w-2xl">
                Acesse diretamente as páginas-filhas com aprofundamento metodológico, casos
                operacionais e especificações técnicas de cada segmento.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* 1. Programa MOVER */}
            <Link
              to="/mover"
              className="p-6 rounded-2xl bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-slate-800 hover:border-emerald-500/60 dark:hover:border-emerald-500/60 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-[10px] font-mono uppercase font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-900">
                    Lei 14.902/2024
                  </span>
                  <Car className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition-colors" />
                </div>
                <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white mb-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  Programa MOVER
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Rastreabilidade e comprovação para desmontagem veicular, substituição reciclado ×
                  virgem e requisitos de MRV.
                </p>
              </div>
              <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                <span>Ver página do MOVER</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            {/* 2. Mineração Urbana & Materiais Críticos */}
            <Link
              to="/materiais-criticos"
              className="p-6 rounded-2xl bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-slate-800 hover:border-emerald-500/60 dark:hover:border-emerald-500/60 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-[10px] font-mono uppercase font-bold text-amber-700 dark:text-[#D9B36C] bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-900">
                    Passaporte DCP
                  </span>
                  <Cpu className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition-colors" />
                </div>
                <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white mb-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  Materiais Críticos Recuperados
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Comprovação pericial de origem urbana para terras raras (NdFeB), metais nobres
                  (Au/Pd) e cobre com Passaporte Digital.
                </p>
              </div>
              <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                <span>Acessar Passaporte DCP</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            {/* 3. Passaporte Digital de Produto (DCP público) */}
            <Link
              to="/dcp"
              className="p-6 rounded-2xl bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-slate-800 hover:border-emerald-500/60 dark:hover:border-emerald-500/60 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-[10px] font-mono uppercase font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                    em estruturação
                  </span>
                  <ShieldCheck className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition-colors" />
                </div>
                <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white mb-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  Passaporte Digital de Produto (DCP)
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Identidade digital pública de materiais e componentes circulares com prova SHA-256
                  canônica e consulta pública por QR Code.
                </p>
              </div>
              <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                <span>Ver demonstração pública</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            {/* 4. Portal Corporativo */}
            <Link
              to="/corporativo"
              className="p-6 rounded-2xl bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-slate-800 hover:border-emerald-500/60 dark:hover:border-emerald-500/60 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-[10px] font-mono uppercase font-bold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-900">
                    Modo Corporativo
                  </span>
                  <Building2 className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition-colors" />
                </div>
                <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white mb-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  Portal Corporativo
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Tour guiado com 12 notas fiscais reais simuladas, extrato analítico de emissões,
                  apuração de IBS/CBS e laudo técnico.
                </p>
              </div>
              <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                <span>Abrir demonstração interativa</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            {/* 5. Case CDVerde */}
            <Link
              to="/case-cdverde"
              className="p-6 rounded-2xl bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-slate-800 hover:border-emerald-500/60 dark:hover:border-emerald-500/60 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-[10px] font-mono uppercase font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-900">
                    Estudo de Caso
                  </span>
                  <Recycle className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition-colors" />
                </div>
                <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white mb-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  Case CDVerde
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Estudo de caso pioneiro em rastreabilidade de peças verdes de desmontagem
                  veicular, baixa no DETRAN e segunda vida de baterias.
                </p>
              </div>
              <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                <span>Ler estudo de caso</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            {/* 6. Cadeias Produtivas */}
            <Link
              to="/cadeias-produtivas"
              className="p-6 rounded-2xl bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-slate-800 hover:border-emerald-500/60 dark:hover:border-emerald-500/60 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-[10px] font-mono uppercase font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                    15 Setores
                  </span>
                  <Layers className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition-colors" />
                </div>
                <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white mb-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  Cadeias Produtivas
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Parâmetros técnicos, fatores oficiais e regras setoriais validadas para
                  siderurgia, cimento, químico, agro, papel e mais.
                </p>
              </div>
              <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                <span>Ver os 15 protocolos</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            {/* 7. Radar Semanal */}
            <Link
              to="/radar-semanal"
              className="p-6 rounded-2xl bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-slate-800 hover:border-emerald-500/60 dark:hover:border-emerald-500/60 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-[10px] font-mono uppercase font-bold text-amber-700 dark:text-[#D9B36C] bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-900">
                    Serviço Pago
                  </span>
                  <Compass className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition-colors" />
                </div>
                <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white mb-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  Radar Semanal
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Inteligência regulatória executiva por faixa de CNPJs. Resumo direto do Diário
                  Oficial com prazos práticos e ações imediatas.
                </p>
              </div>
              <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                <span>Ver planos de assinatura</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            {/* 8. Central do Radar */}
            <Link
              to="/central-radar"
              className="p-6 rounded-2xl bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-slate-800 hover:border-emerald-500/60 dark:hover:border-emerald-500/60 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-[10px] font-mono uppercase font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                    Acervo Completo
                  </span>
                  <FileCheck2 className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition-colors" />
                </div>
                <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white mb-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  Central do Radar
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Pesquisa avançada em todas as edições já publicadas, filtros por segmento e gestão
                  de leitura semanal para assinantes.
                </p>
              </div>
              <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                <span>Consultar edições</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            {/* 9. Entrada em estruturação: Logística Reversa */}
            <div
              id="logistica-reversa"
              className="p-6 rounded-2xl bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between scroll-mt-28"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-[10px] font-mono uppercase font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-900">
                    em estruturação
                  </span>
                  <Layers className="w-4 h-4 text-slate-400" />
                </div>
                <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white mb-2">
                  Logística Reversa (PNRS)
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Rastreabilidade documental para o Decreto 11.413/2023: balanço de massa auditável
                  e comprovação de frações prioritárias sem promessa de produto ou prazo.
                </p>
              </div>
              <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
                <Link
                  to="/diagnostico"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline min-h-[44px]"
                >
                  <span>Consultar equipe técnica</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Modal LPF */}
      <ModalFormularioOrbisLpf isOpen={modalLpfAberto} onClose={() => setModalLpfAberto(false)} />
    </div>
  )
}
