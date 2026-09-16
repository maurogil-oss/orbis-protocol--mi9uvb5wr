import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { CADEIAS_PRODUTIVAS, CadeiaProdutiva } from '@/data/cadeias'
import {
  ShieldCheck,
  Building2,
  FileSpreadsheet,
  Car,
  Layers,
  ArrowRight,
  Sparkles,
  X,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react'

export default function SolucoesIndex() {
  const [selectedCadeia, setSelectedCadeia] = useState<CadeiaProdutiva | null>(null)

  const blocosPrincipais = [
    {
      tag: 'ACP + IBESG',
      titulo: 'Bureau ACP Paraná',
      subtitulo: 'Sustentabilidade acessível para empresas do comércio e serviços do Paraná.',
      descricao:
        'Diagnóstico rápido, qualificação tributária subsidiada para associados da Associação Comercial do Paraná e emissão de Selo Oficial para vitrines e websites.',
      link: '/solucoes/bureau-acp',
      ctaText: 'Ver Detalhes do Bureau ACP',
    },
    {
      tag: 'IFRS S2 / SPED',
      titulo: 'Portal Corporativo',
      subtitulo: 'Preparação documental e conciliação de emissões corporativas para indústrias.',
      descricao:
        'Ambiente enterprise com preparação para conector ERP e ingestão de documentos fiscais (em roadmap), automatizando conciliações de emissões com base na matriz do SIN/MCTI.',
      link: '/solucoes/portal-corporativo',
      ctaText: 'Acesso Corporativo (Gestor)',
    },
    {
      tag: 'VEÍCULOS • PEÇAS • BATERIAS',
      titulo: 'Case CDVerde • Desmontagem Veicular',
      subtitulo:
        'Rastreabilidade completa de desmontagem VFV, peças verdes reaproveitadas e baterias elétricas.',
      descricao:
        'Plataforma homologada para CDVs DETRAN com emissão do Passaporte Digital de Produto (DPP), rastreio por QR Code inviolável e lastro para redução de IPI no Programa MOVER.',
      link: '/solucoes/case-cdverde',
      ctaText: 'Ver Detalhes do Case CDVerde',
    },
    {
      tag: '15 SETORES ATENDIDOS',
      titulo: 'Catálogo de Cadeias Produtivas',
      subtitulo:
        'Regras, fatores oficiais e parâmetros técnicos para os 15 principais setores da economia.',
      descricao:
        'Consulte os fatores oficiais, diretrizes regulatórias e tipos de laudos entregues para Agro, Siderurgia, Cimento, Energia, Têxtil, Química e mais.',
      link: '/solucoes/cadeias-produtivas',
      ctaText: 'Conhecer os 15 Protocolos',
    },
  ]

  return (
    <div className="min-h-screen py-12 md:py-20 bg-[#0A0E12]">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="max-w-3xl mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#111820] border border-[#12B886]/40 text-[#12B886] text-xs font-semibold tracking-wider uppercase mb-4">
            <ShieldCheck className="w-4 h-4 text-[#12B886]" />
            APLICAÇÕES CONSOLIDADAS NO MERCADO
          </div>
          <h1 className="font-heading font-extrabold text-2xl sm:text-4xl md:text-5xl text-[#F4F7FA] tracking-wide mb-4">
            HUB DE SOLUÇÕES & PORTAIS DO ECOSSISTEMA
          </h1>
          <p className="text-base sm:text-lg text-[#93A3B5] leading-relaxed">
            Conheça os portais operacionais e estudos de caso desenvolvidos pelo Orbis Protocol para
            atender desde pequenas empresas associadas a grandes grupos industriais e cadeias
            reguladas.
          </p>
        </div>

        {/* 4 Main Solution Blocks Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
          {blocosPrincipais.map((bloco, idx) => (
            <div
              key={idx}
              className="flex flex-col justify-between p-8 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.12)] hover:border-[#12B886] transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 group"
            >
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-[#16202B] text-[#D9B36C] border border-[#D9B36C]/30 inline-block mb-4">
                  {bloco.tag}
                </span>

                <h2 className="font-heading font-bold text-2xl text-[#F4F7FA] mb-2 group-hover:text-[#12B886] transition-colors">
                  {bloco.titulo}
                </h2>

                <p className="text-sm font-medium text-[#12B886] mb-4">{bloco.subtitulo}</p>

                <p className="text-xs sm:text-sm text-[#93A3B5] leading-relaxed mb-6">
                  {bloco.descricao}
                </p>
              </div>

              <div className="pt-5 border-t border-[rgba(244,247,250,0.08)]">
                <Link
                  to={bloco.link}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold bg-[#12B886] text-[#0A0E12] hover:bg-[#0CA678] transition-all shadow-emerald-glow text-sm"
                >
                  <span>{bloco.ctaText}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Grid of 15 Productive Chains preview */}
        <div className="p-8 sm:p-10 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.12)]">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#D9B36C] block mb-2">
                CATÁLOGO DE SETORES
              </span>
              <h3 className="font-heading font-extrabold text-2xl sm:text-3xl text-[#F4F7FA]">
                15 CADEIAS PRODUTIVAS MAPEADAS
              </h3>
            </div>
            <Link
              to="/solucoes/cadeias-produtivas"
              className="inline-flex items-center gap-1.5 text-sm text-[#12B886] font-semibold hover:underline"
            >
              <span>Ver parâmetros e regras completas</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5">
            {CADEIAS_PRODUTIVAS.map((cadeia) => (
              <Link
                key={cadeia.id}
                to={`/protocolos/${cadeia.id}`}
                className="p-4 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.1)] hover:border-[#12B886] hover:bg-[#16202B] transition-all text-left group flex flex-col justify-between"
              >
                <div>
                  <div className="text-xs font-semibold text-[#F4F7FA] group-hover:text-[#12B886] transition-colors leading-snug">
                    {cadeia.nome}
                  </div>
                  <div className="text-[10px] text-[#93A3B5] mt-1 line-clamp-1">
                    {cadeia.fatorEmissao}
                  </div>
                </div>
                <div className="mt-2 text-[10px] text-[#12B886] font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                  <span>Protocolo</span>
                  <ArrowRight className="w-2.5 h-2.5" />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Modal for Sector Description */}
        {selectedCadeia && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setSelectedCadeia(null)}
            />

            <div className="relative w-full max-w-xl bg-[#111820] border border-[#12B886]/40 rounded-2xl p-6 sm:p-8 shadow-2xl z-10 animate-fade-in space-y-5">
              <div className="flex items-start justify-between pb-4 border-b border-[rgba(244,247,250,0.1)]">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#D9B36C] block mb-1">
                    SETOR HOMOLOGADO
                  </span>
                  <h3 className="font-heading font-bold text-xl text-[#F4F7FA]">
                    {selectedCadeia.nome}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedCadeia(null)}
                  className="p-1.5 text-[#93A3B5] hover:text-[#F4F7FA]"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4 text-xs text-[#93A3B5]">
                <div>
                  <strong className="text-[#F4F7FA] block mb-1">Descrição Técnica:</strong>
                  <p className="leading-relaxed">{selectedCadeia.descricao}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-lg bg-[#0A0E12] border border-[rgba(244,247,250,0.08)]">
                  <div>
                    <span className="text-[#12B886] font-semibold block">Regulamentação:</span>
                    <span>{selectedCadeia.regulamentacao}</span>
                  </div>
                  <div>
                    <span className="text-[#D9B36C] font-semibold block">Fatores Oficiais:</span>
                    <span>{selectedCadeia.fatorEmissao}</span>
                  </div>
                </div>

                <div>
                  <strong className="text-[#F4F7FA] block mb-2">
                    Principais Indicadores Aferidos:
                  </strong>
                  <ul className="space-y-1">
                    {selectedCadeia.principaisIndicadores.map((ind, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#12B886]" />
                        <span>{ind}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-2">
                  <strong className="text-[#F4F7FA] block mb-1">Tipo de Laudo Emitido:</strong>
                  <span className="text-[#12B886] font-medium">{selectedCadeia.tipoLaudo}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-[rgba(244,247,250,0.1)] flex flex-wrap justify-end gap-2.5">
                <Link
                  to={`/protocolos/${selectedCadeia.id}`}
                  className="px-4 py-2.5 rounded-lg text-xs font-bold border border-[#12B886] text-[#12B886] hover:bg-[#12B886] hover:text-[#0A0E12] transition-colors flex items-center gap-1.5"
                >
                  <span>Ver Protocolo Aprofundado</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <Link
                  to="/diagnostico"
                  className="px-5 py-2.5 rounded-lg text-xs font-bold bg-[#12B886] text-[#0A0E12] hover:bg-[#0CA678]"
                >
                  Auditar Meu CNPJ
                </Link>
                <button
                  onClick={() => setSelectedCadeia(null)}
                  className="px-3.5 py-2.5 rounded-lg text-xs font-semibold border border-[rgba(244,247,250,0.2)] text-[#F4F7FA]"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
