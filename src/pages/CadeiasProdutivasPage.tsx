import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { CADEIAS_PRODUTIVAS, CadeiaProdutiva } from '@/data/cadeias'
import { ShieldCheck, CheckCircle2, ArrowRight, ArrowLeft, X, Search, Sparkles } from 'lucide-react'

export default function CadeiasProdutivasPage() {
  const [busca, setBusca] = useState('')
  const [selectedCadeia, setSelectedCadeia] = useState<CadeiaProdutiva | null>(null)

  const filtradas = CADEIAS_PRODUTIVAS.filter(
    (c) =>
      c.nome.toLowerCase().includes(busca.toLowerCase()) ||
      c.regulamentacao.toLowerCase().includes(busca.toLowerCase()) ||
      c.descricao.toLowerCase().includes(busca.toLowerCase()),
  )

  return (
    <div className="min-h-screen py-12 md:py-20 bg-[#0A0E12]">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        <div className="mb-6">
          <Link
            to="/solucoes"
            className="inline-flex items-center gap-2 text-xs font-semibold text-[#93A3B5] hover:text-[#12B886] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Voltar para Hub de Soluções</span>
          </Link>
        </div>

        {/* Header */}
        <div className="max-w-3xl mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#111820] border border-[#12B886]/40 text-[#12B886] text-xs font-semibold tracking-wider uppercase mb-4">
            <ShieldCheck className="w-4 h-4 text-[#12B886]" />
            CATÁLOGO SETORIAL HOMOLOGADO
          </div>
          <h1 className="font-heading font-extrabold text-2xl sm:text-4xl text-[#F4F7FA] tracking-wide mb-3">
            REGRAS & PARÂMETROS PARA 15 CADEIAS PRODUTIVAS
          </h1>
          <p className="text-sm sm:text-base text-[#93A3B5] leading-relaxed">
            Consulte os fatores oficiais, diretrizes regulatórias e tipos de laudos entregues pelo
            Orbis Protocol para os 15 setores produtivos atendidos. Clique sobre qualquer setor para
            abrir a ficha técnica detalhada.
          </p>
        </div>

        {/* Filter Input */}
        <div className="max-w-md mb-8 relative">
          <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#93A3B5]" />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Filtrar por nome, regulamentação ou atividade..."
            className="w-full pl-11 pr-4 py-3 rounded-xl bg-[#111820] border border-[rgba(244,247,250,0.12)] text-[#F4F7FA] placeholder-[#93A3B5]/60 focus:outline-none focus:ring-2 focus:ring-[#12B886] text-sm"
          />
        </div>

        {/* Grid of 15 Chains */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {filtradas.map((cadeia) => (
            <div
              key={cadeia.id}
              onClick={() => setSelectedCadeia(cadeia)}
              className="p-6 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.12)] hover:border-[#12B886] hover:bg-[#16202B] transition-all cursor-pointer flex flex-col justify-between group hover:shadow-xl hover:-translate-y-1"
            >
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#D9B36C] block mb-2">
                  SETOR HOMOLOGADO
                </span>
                <h2 className="font-heading font-bold text-lg text-[#F4F7FA] group-hover:text-[#12B886] transition-colors mb-2">
                  {cadeia.nome}
                </h2>
                <p className="text-xs text-[#93A3B5] leading-relaxed mb-4 line-clamp-3">
                  {cadeia.descricao}
                </p>
                <div className="p-2.5 rounded-lg bg-[#0A0E12] border border-[rgba(244,247,250,0.06)] text-[11px] text-[#93A3B5] space-y-1">
                  <div>
                    <strong className="text-[#12B886]">Fator Oficial:</strong> {cadeia.fatorEmissao}
                  </div>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-[rgba(244,247,250,0.08)] flex items-center justify-between text-xs text-[#12B886] font-semibold">
                <span>Ver ficha rápida</span>
                <Link
                  to={`/protocolos/${cadeia.id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="px-2.5 py-1 rounded bg-[#12B886]/10 hover:bg-[#12B886] hover:text-[#0A0E12] transition-colors flex items-center gap-1 font-bold"
                >
                  <span>Protocolo Completo</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Detail Modal */}
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
