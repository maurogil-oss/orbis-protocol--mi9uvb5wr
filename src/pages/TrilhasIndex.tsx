import React from 'react'
import { Link } from 'react-router-dom'
import { TRILHAS_DATA } from '@/data/trilhas'
import {
  ShieldCheck,
  ArrowRight,
  Car,
  TrendingDown,
  FileCheck2,
  Lock,
  CheckCircle2,
  BookOpen,
} from 'lucide-react'

export default function TrilhasIndex() {
  const trilhasList = Object.values(TRILHAS_DATA)

  const getTrilhaIcon = (slug: string) => {
    switch (slug) {
      case 'mover':
        return Car
      case 'sbce-financas-verdes':
        return TrendingDown
      case 'peritos-tecnicos':
        return FileCheck2
      case 'mineracao':
        return ShieldCheck
      default:
        return BookOpen
    }
  }

  return (
    <div className="min-h-screen py-12 md:py-20 bg-[#0A0E12]">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="max-w-3xl mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#111820] border border-[#12B886]/40 text-[#12B886] text-xs font-semibold tracking-wider uppercase mb-4">
            <ShieldCheck className="w-4 h-4 text-[#12B886]" />
            CAPACITAÇÃO & HABILITAÇÃO REGULATÓRIA
          </div>
          <h1 className="font-heading font-extrabold text-2xl sm:text-4xl md:text-5xl text-[#F4F7FA] tracking-wide mb-4">
            ESCOLHA A TRILHA DE ENTRADA NO PROTOCOLO
          </h1>
          <p className="text-base sm:text-lg text-[#93A3B5] leading-relaxed">
            Ambientes desenhados sob medida para os requisitos de cada cadeia produtiva, perfil
            regulatório e categoria profissional. Selecione sua trilha para acessar a metodologia,
            módulos de capacitação e modelos operacionais.
          </p>
        </div>
        {/* Trilhas Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {trilhasList.map((trilha) => {
            const Icon = getTrilhaIcon(trilha.slug)
            return (
              <div
                key={trilha.slug}
                className="flex flex-col justify-between p-8 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.12)] hover:border-[#12B886] transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 group"
              >
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <span className="text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-[#16202B] text-[#D9B36C] border border-[#D9B36C]/30">
                      {trilha.lei}
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-[#16202B] border border-[rgba(244,247,250,0.12)] flex items-center justify-center text-[#12B886] group-hover:bg-[#12B886]/20 transition-all">
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>

                  <h2 className="font-heading font-bold text-xl text-[#F4F7FA] mb-3 group-hover:text-[#12B886] transition-colors leading-snug">
                    {trilha.titulo}
                  </h2>

                  <p className="text-xs text-[#93A3B5] mb-5 leading-relaxed">{trilha.subtitulo}</p>

                  <div className="space-y-2 mb-6">
                    {trilha.destaques.map((item, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs text-[#F4F7FA]">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#12B886] shrink-0 mt-0.5" />
                        <span className="text-[#93A3B5]">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-5 border-t border-[rgba(244,247,250,0.08)] flex flex-col gap-2">
                  <Link
                    to={`/trilhas/${trilha.slug}`}
                    className="w-full text-center py-3 rounded-xl font-bold bg-[#12B886] text-[#0A0E12] hover:bg-[#0CA678] transition-all flex items-center justify-center gap-2 shadow-emerald-glow"
                  >
                    <span>Explorar Trilha</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>

                  {trilha.linkAuditor && (
                    <div className="flex flex-col gap-2">
                      <Link
                        to="/credenciamento"
                        className="w-full text-center py-2 rounded-xl text-xs font-semibold bg-[#16202B] border border-[#12B886]/40 text-[#12B886] hover:bg-[#12B886] hover:text-[#0A0E12] transition-all flex items-center justify-center gap-1.5"
                      >
                        <span>Credenciamento de Perito (ART/RRT)</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                      <Link
                        to="/console-do-auditor"
                        className="w-full text-center py-2 rounded-xl text-xs font-semibold border border-[rgba(244,247,250,0.2)] text-[#D9B36C] hover:border-[#D9B36C] hover:bg-[#16202B] transition-all flex items-center justify-center gap-1.5"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span>Acessar Console do Auditor</span>
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
        {/* Bloco de Acesso Rápido aos 15 Protocolos Setoriais */}
        <div className="mt-16 p-8 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.12)]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <span className="text-[10px] uppercase font-mono font-bold text-[#D9B36C] block mb-1">
                CONHECIMENTO TÉCNICO APLICADO
              </span>
              <h3 className="font-heading font-extrabold text-xl text-[#F4F7FA]">
                Os 15 Protocolos Setoriais Homologados dMRV
              </h3>
            </div>
            <Link
              to="/solucoes/cadeias-produtivas"
              className="text-xs font-semibold text-[#12B886] hover:underline flex items-center gap-1"
            >
              <span>Ver catálogo completo</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {[
              { slug: 'agro', nome: 'Agro & Grãos' },
              { slug: 'siderurgia', nome: 'Siderurgia & Aço' },
              { slug: 'cimento', nome: 'Cimento & Concreto' },
              { slug: 'energia', nome: 'Energia & Biogás' },
              { slug: 'quimica', nome: 'Química & Petroquímica' },
              { slug: 'logistica', nome: 'Logística & Transporte' },
              { slug: 'textil', nome: 'Têxtil & Calçados' },
              { slug: 'mineracao', nome: 'Mineração & Terras Raras' },
              { slug: 'automotiva', nome: 'Automotiva & CDVs' },
              { slug: 'alimentos', nome: 'Alimentos & Bebidas' },
              { slug: 'papel', nome: 'Papel & Celulose' },
              { slug: 'plasticos', nome: 'Plásticos & Reciclagem' },
              { slug: 'farmaceutica', nome: 'Farmacêutica & Cosmética' },
              { slug: 'construcao', nome: 'Construção Civil' },
              { slug: 'varejo', nome: 'Comércio & Serviços' },
            ].map((item) => (
              <Link
                key={item.slug}
                to={`/protocolos/${item.slug}`}
                className="p-3 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.08)] hover:border-[#12B886] text-xs font-medium text-[#F4F7FA] hover:text-[#12B886] transition-colors"
              >
                {item.nome}
              </Link>
            ))}
          </div>
        </div>{' '}
      </div>
    </div>
  )
}
