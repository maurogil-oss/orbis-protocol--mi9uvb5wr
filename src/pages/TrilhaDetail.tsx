import React, { useState } from 'react'
import { useParams, Link, Navigate } from 'react-router-dom'
import { TRILHAS_DATA } from '@/data/trilhas'
import { useAuth } from '@/contexts/AuthContext'
import {
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Lock,
  Clock,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  FileText,
  UserCheck,
} from 'lucide-react'

export default function TrilhaDetail() {
  const { slug } = useParams<{ slug: string }>()
  const trilha = slug ? TRILHAS_DATA[slug] : null
  const { isAuthenticated } = useAuth()

  // Accordion state
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  if (!trilha) {
    return <Navigate to="/trilhas" replace />
  }

  const toggleAccordion = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx)
  }

  return (
    <div className="min-h-screen py-12 md:py-20 bg-[#0A0E12]">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        {/* Navigation Breadcrumb */}
        <div className="mb-6">
          <Link
            to="/trilhas"
            className="inline-flex items-center gap-2 text-xs font-semibold text-[#93A3B5] hover:text-[#12B886] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Voltar para todas as trilhas</span>
          </Link>
        </div>

        {/* Trilha Header Banner */}
        <div className="p-8 sm:p-10 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.12)] mb-10 shadow-2xl relative overflow-hidden">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#16202B] border border-[#D9B36C]/40 text-[#D9B36C] text-xs font-bold tracking-wider uppercase mb-4">
              <ShieldCheck className="w-3.5 h-3.5 text-[#D9B36C]" />
              {trilha.lei}
            </div>

            <h1 className="font-heading font-extrabold text-2xl sm:text-4xl text-[#F4F7FA] tracking-wide mb-3">
              {trilha.titulo}
            </h1>

            <p className="text-base sm:text-lg text-[#12B886] font-medium mb-4">
              {trilha.subtitulo}
            </p>

            <p className="text-sm text-[#93A3B5] leading-relaxed mb-6">{trilha.descricao}</p>

            <div className="flex flex-wrap items-center gap-4 text-xs text-[#93A3B5] border-t border-[rgba(244,247,250,0.08)] pt-4">
              <div>
                <strong className="text-[#F4F7FA]">Público Alvo:</strong> {trilha.publico}
              </div>
            </div>
          </div>
        </div>

        {/* Two-column layout: Objectives & Modules */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Modules Accordion (Col 1..8) */}
          <div className="lg:col-span-8 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-heading font-bold text-xl text-[#F4F7FA]">
                MÓDULOS DE CAPACITAÇÃO E IMPLEMENTAÇÃO
              </h2>
              <span className="text-xs text-[#93A3B5]">
                {trilha.modulos.length} módulos disponíveis
              </span>
            </div>

            <div className="space-y-3">
              {trilha.modulos.map((mod, idx) => {
                const isOpen = openIndex === idx
                const isLocked = mod.requerLogin && !isAuthenticated

                return (
                  <div
                    key={idx}
                    className="rounded-xl border border-[rgba(244,247,250,0.12)] bg-[#111820] overflow-hidden transition-all scroll-mt-28"
                  >
                    <button
                      type="button"
                      onClick={() => toggleAccordion(idx)}
                      className="w-full p-5 text-left flex items-center justify-between gap-4 hover:bg-[#16202B] transition-colors scroll-mt-28"
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-xs font-mono font-bold px-2 py-1 rounded bg-[#0A0E12] text-[#12B886] border border-[#12B886]/30">
                          {mod.numero}
                        </span>
                        <div>
                          <h3 className="font-heading font-bold text-base text-[#F4F7FA]">
                            {mod.titulo}
                          </h3>
                          <div className="flex items-center gap-3 text-xs text-[#93A3B5] mt-1">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              {mod.duracao}
                            </span>
                            {mod.requerLogin && (
                              <span className="flex items-center gap-1 text-[#D9B36C]">
                                <Lock className="w-3 h-3" />
                                Requer Login
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-[#93A3B5]">
                        {isOpen ? (
                          <ChevronUp className="w-5 h-5" />
                        ) : (
                          <ChevronDown className="w-5 h-5" />
                        )}
                      </div>
                    </button>

                    {isOpen && (
                      <div className="p-5 pt-2 border-t border-[rgba(244,247,250,0.06)] bg-[#0D1217]">
                        {isLocked ? (
                          <div className="p-4 rounded-lg bg-[#111820] border border-[#D9B36C]/30 text-center space-y-3">
                            <Lock className="w-6 h-6 text-[#D9B36C] mx-auto" />
                            <p className="text-xs text-[#F4F7FA] font-medium">
                              O conteúdo detalhado deste módulo técnico é restrito a usuários
                              cadastrados.
                            </p>
                            <Link
                              to="/login"
                              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-[#12B886] text-[#0A0E12]"
                            >
                              Fazer Login para Desbloquear
                            </Link>
                          </div>
                        ) : (
                          <div className="text-sm text-[#93A3B5] leading-relaxed space-y-3">
                            <p>{mod.conteudo}</p>
                            <div className="pt-2 flex items-center gap-3">
                              <span className="inline-flex items-center gap-1.5 text-xs text-[#12B886] font-semibold">
                                <CheckCircle2 className="w-4 h-4" />
                                Material didático e modelos probatórios habilitados
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Sidebar Objectives & Action (Col 9..12) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="p-6 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.12)]">
              <h3 className="font-heading font-bold text-base text-[#F4F7FA] mb-4">
                OBJETIVOS DA TRILHA
              </h3>
              <div className="space-y-3 mb-6">
                {trilha.objetivos.map((obj, i) => (
                  <div key={i} className="flex items-start gap-2.5 text-xs text-[#93A3B5]">
                    <CheckCircle2 className="w-4 h-4 text-[#12B886] shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{obj}</span>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-[rgba(244,247,250,0.08)] flex flex-col gap-3">
                <Link
                  to="/diagnostico"
                  className="w-full text-center py-3 rounded-xl font-bold bg-[#12B886] text-[#0A0E12] hover:bg-[#0CA678] transition-all shadow-emerald-glow text-sm"
                >
                  Auditar Meu CNPJ Nesta Trilha
                </Link>

                {trilha.linkAuditor && (
                  <Link
                    to="/console-do-auditor"
                    className="w-full text-center py-2.5 rounded-xl text-xs font-semibold border border-[#D9B36C] text-[#D9B36C] hover:bg-[#D9B36C]/10 transition-all flex items-center justify-center gap-2"
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>Ir para o Console do Auditor</span>
                  </Link>
                )}
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-[#0D1217] border border-[rgba(244,247,250,0.08)] text-xs text-[#93A3B5] space-y-3">
              <span className="font-semibold text-[#F4F7FA] block">
                Chancela e Emissão de Laudos:
              </span>
              <p>
                Os certificados e relatórios gerados a partir desta trilha contam com hash único e
                assinatura digital válida perante órgãos fiscalizadores federais e auditores
                independentes.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
