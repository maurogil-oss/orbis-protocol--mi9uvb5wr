import React from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, ArrowRight } from 'lucide-react'

export interface EixoNarrativoItem {
  id: string
  tag: string
  titulo: string
  badgeNorma: string
  destaque: string
  itens: string[]
  linkTexto: string
  linkUrl: string
  corIcon: string
  bordaCard: string
}

export const EIXOS_NARRATIVOS_DEFAULT: EixoNarrativoItem[] = [
  {
    id: 'descarbonizacao',
    tag: 'EIXO 1 | DESCARBONIZAÇÃO',
    titulo: 'SBCE, IFRS S1-S2 & dMRV Digital',
    badgeNorma: 'Lei 15.042/2024 | Resolução CVM 244/2026',
    destaque: 'Auditoria digital contínua de carbono (dMRV)',
    itens: [
      'Enquadramento automático nos limiares do SBCE (reporte a partir de 10.000 tCO2e/ano e metas obrigatórias acima de 25.000 tCO2e/ano).',
      'Diferencial de intensidade real: a Orbis apura pelo dado real da NF-e insumo por insumo, com CO₂e por nota e por R$ faturado, superando estimativas genéricas.',
      'Inventário de GEE nos Escopos 1, 2 e 3 com fatores oficiais de emissão (MCTI, IPCC AR6, SIN) e taxonomia GHG Protocol.',
      'Divulgações de sustentabilidade e clima elaboradas segundo os padrões globais IFRS S1/S2 — hoje de adoção voluntária no Brasil (Resolução CVM 244/2026) e cada vez mais exigidas por bancos, fundos de pensão e seguradoras na concessão de crédito e investimento.',
      'Eliminação do greenwashing por meio de hashes SHA-256 canônicos e chancela de peritos com ART/RRT acoplada.',
    ],
    linkTexto: 'Calcular enquadramento SBCE',
    linkUrl: '/diagnostico',
    corIcon: 'text-[#059669]',
    bordaCard: 'border-[#059669]/30',
  },
  {
    id: 'tributaria',
    tag: 'EIXO 2 | CONFORMIDADE TRIBUTÁRIA',
    titulo: 'Lei 15.042/2024 & Programa MOVER',
    badgeNorma: 'Lei 14.902/2024 | Reforma Tributária (EC 132/2023)',
    destaque: 'Enquadramento tributário e previsão do impacto da reforma',
    itens: [
      'Governança fiscal robusta para habilitação aos incentivos fiscais e créditos financeiros do Programa MOVER (Mobilidade Verde e Inovação).',
      'Interoperabilidade com notas fiscais eletrônicas (NF-e/SPED) diretamente da SEFAZ para apuração de créditos e fatores tributários.',
      'Diagnóstico do Imposto Seletivo e futura transição para a CBS/IBS da Reforma Tributária com simulação de impacto financeiro.',
      'Geração de dossiês probatórios defensáveis perante auditorias fiscais, bancos de fomento (BRDE/BNDES) e agências reguladoras.',
    ],
    linkTexto: 'Conhecer dossiê MOVER',
    linkUrl: '/mover',
    corIcon: 'text-[#D9B36C]',
    bordaCard: 'border-[#D9B36C]/30',
  },
  {
    id: 'circularidade',
    tag: 'EIXO 3 | CIRCULARIDADE',
    titulo: 'Decreto 11.413/2023 & Passaporte de Produto',
    badgeNorma: 'Decreto Federal 11.413/2023 | Logística Reversa',
    destaque: 'Lastro probatório e balanço de massa',
    itens: [
      'Comprovação de logística reversa e conformidade com o Decreto 11.413/2023 para frações prioritárias (óleos lubrificantes/OLUC, baterias, pneus e embalagens).',
      'Passaporte Digital de Produto (DPP) peça a peça com QR Code dinâmico e rastreabilidade da baixa do DETRAN até o destinador final.',
      'Emissão formal de Lastro de Circularidade segregado de metais e materiais convencionais, vedando simulações sem comprovação física.',
      'Interoperabilidade com manifestos MTR-SINIR para emissão e homologação de CCRLR junto a entidades gestoras credenciadas.',
    ],
    linkTexto: 'Explorar Passaporte Digital',
    linkUrl: '/passaporte-lote/PR-BX-2026-1240105',
    corIcon: 'text-[#059669]',
    bordaCard: 'border-[#059669]/30',
  },
]

export interface SecaoTresEixosNarrativosProps {
  id?: string
  className?: string
  exibirHeader?: boolean
  exibirBlocoLogisticaReversa?: boolean
}

/**
 * Componente modularizado da Seção dos 3 Eixos Narrativos do Orbis Protocol.
 * Preparado como conteúdo reutilizável do futuro hub "Soluções".
 */
export function SecaoTresEixosNarrativos({
  id = 'eixos-narrativos',
  className = '',
  exibirHeader = true,
  exibirBlocoLogisticaReversa = true,
}: SecaoTresEixosNarrativosProps) {
  return (
    <section
      id={id}
      aria-label="Os 3 Eixos Narrativos do Orbis Protocol"
      className={`py-20 md:py-28 bg-slate-50 dark:bg-gradient-to-b dark:from-[#0A1628] dark:via-[#0E1A2E] dark:to-[#0A1628] border-y border-slate-200/80 dark:border-slate-800/80 scroll-mt-24 ${className}`}
    >
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        {exibirHeader && (
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-mono font-semibold uppercase tracking-[0.2em] text-emerald-700 dark:text-[#059669] block mb-2">
              ARQUITETURA DE VALOR
            </span>
            <h2 className="font-heading font-black text-2xl sm:text-4xl text-slate-900 dark:text-[#F8FAFC] tracking-tight mb-4">
              OS 3 EIXOS NARRATIVOS DO ORBIS PROTOCOL
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-[#94A3B8] leading-relaxed">
              Integração técnica entre compromissos climáticos, incentivos fiscais e rastreio de
              materiais para mitigar riscos e gerar valor financeiro real.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {EIXOS_NARRATIVOS_DEFAULT.map((eixo) => (
            <div
              key={eixo.id}
              className={`p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#0E1A2E] border ${eixo.bordaCard} flex flex-col justify-between shadow-xs hover:shadow-md dark:shadow-none hover:border-slate-400 dark:hover:border-slate-700 transition-all duration-300 hover:-translate-y-1`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-700 dark:text-[#D9B36C]">
                    {eixo.tag}
                  </span>
                </div>

                <h3 className="font-heading font-black text-xl sm:text-2xl text-slate-900 dark:text-[#F8FAFC] mb-2 leading-tight">
                  {eixo.titulo}
                </h3>

                <div className="inline-block px-3 py-1 rounded-lg bg-slate-100 dark:bg-[#111827] text-xs font-mono text-slate-600 dark:text-[#94A3B8] mb-5 border border-slate-200 dark:border-slate-800">
                  {eixo.badgeNorma}
                </div>

                <p className="text-xs sm:text-sm font-semibold text-emerald-700 dark:text-[#059669] mb-5">
                  {eixo.destaque}
                </p>

                <ul className="space-y-3 mb-8">
                  {eixo.itens.map((it, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-2.5 text-xs text-slate-600 dark:text-[#94A3B8]"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-[#059669] shrink-0 mt-0.5 stroke-[1.5]" />
                      <span className="leading-relaxed">{it}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <Link
                  to={eixo.linkUrl}
                  className="inline-flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-[#059669] hover:text-emerald-800 dark:hover:text-[#059669]/80 transition-colors"
                >
                  <span>{eixo.linkTexto}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>

        {exibirBlocoLogisticaReversa && (
          <div className="mt-10 p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-slate-800 shadow-xs hover:border-emerald-500/40 dark:hover:border-[#059669]/40 transition-all duration-300">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-3 max-w-3xl">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-700 dark:text-[#D9B36C]">
                    INFRAESTRUTURA DE PROVA
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-slate-100 dark:bg-[#111827] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-[#059669]" />
                    PNRS & Circularidade
                  </span>
                </div>

                <h3 className="font-heading font-extrabold text-xl sm:text-2xl text-slate-900 dark:text-[#F8FAFC] leading-tight">
                  Logística Reversa e Governança Circular
                </h3>

                <p className="text-xs sm:text-sm text-slate-600 dark:text-[#94A3B8] leading-relaxed">
                  Estendemos nossa infraestrutura de prova documental à logística reversa (PNRS /
                  Decreto 11.413/2023): rastreabilidade de lotes de material, balanço de massa
                  auditável e documentos prontos para envio a órgãos de controle e entidades
                  gestoras. Na mesma lógica, a infraestrutura Orbis está preparada para dados
                  verificáveis de natureza e biodiversidade, à medida que os padrões IFRS incorporam
                  o tema nas divulgações corporativas.
                </p>
              </div>

              <div className="shrink-0 pt-2 md:pt-0">
                <Link
                  to="/diagnostico"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-xs sm:text-sm font-semibold bg-slate-100 dark:bg-[#111827] border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-[#F8FAFC] hover:bg-emerald-600 hover:text-white dark:hover:bg-[#2563EB] dark:hover:text-white hover:border-emerald-600 dark:hover:border-[#2563EB] transition-all"
                >
                  <span>Fale com a equipe</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
