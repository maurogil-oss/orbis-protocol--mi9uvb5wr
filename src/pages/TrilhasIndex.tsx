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
  GraduationCap,
  Sparkles,
  School,
  Layers,
} from 'lucide-react'
import { useSeo } from '@/hooks/useSeo'

export default function TrilhasIndex() {
  useSeo({
    title: 'Trilhas de Formação & Habilitação — Orbis Protocol',
    description:
      'Ambientes estruturados para cada perfil regulatório, categoria profissional e rede de ensino no Orbis Protocol.',
  })
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
    <div className="min-h-screen py-12 md:py-20 bg-slate-50 dark:bg-[#0A1628] text-slate-900 dark:text-[#F8FAFC] transition-colors">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="max-w-3xl mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-400 text-xs font-mono font-semibold uppercase tracking-wider mb-4">
            <ShieldCheck className="w-4 h-4 stroke-[1.8]" />
            CAPACITAÇÃO & HABILITAÇÃO REGULATÓRIA
          </div>
          <h1 className="font-heading font-black text-2xl sm:text-4xl md:text-5xl text-slate-900 dark:text-white tracking-tight mb-4">
            Trilhas de Formação & Habilitação
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
            Ambientes estruturados para cada perfil regulatório, categoria profissional e rede de
            ensino. Selecione sua trilha para acessar capacitação, modelos periciais e programas
            educacionais.
          </p>
        </div>

        {/* SEÇÃO DESTAQUE: ORBIS EDUCAÇÃO (Trilha de Capacitação e Formação Técnica) */}
        <div className="mb-14 p-6 sm:p-10 rounded-3xl bg-slate-900 text-white dark:bg-[#0E1A2E] dark:text-[#F8FAFC] border border-slate-800 dark:border-slate-700 shadow-xl">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3 max-w-3xl">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-mono font-bold uppercase tracking-wider border border-emerald-500/40">
                  <GraduationCap className="w-3.5 h-3.5" />
                  FORMAÇÃO CIDADÃ & ESCOLAR
                </span>
                <span className="text-[11px] font-mono font-semibold uppercase px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40">
                  Trilha de Capacitação e Formação Técnica
                </span>
              </div>

              <h2 className="font-heading font-black text-xl sm:text-3xl text-white tracking-tight">
                Orbis Educação — Sustentabilidade nas Escolas
              </h2>

              <p className="text-xs sm:text-sm text-slate-300 dark:text-slate-300 leading-relaxed">
                Programa educacional com material didático completo para o Ensino Fundamental II e
                Médio. As escolas contam com cadastro próprio na plataforma (número de alunos, graus
                de ensino) e escolas particulares podem contratar diretamente o programa para
                integrar a cultura da economia circular e medição real de carbono na comunidade
                escolar.
              </p>

              <div className="flex items-center gap-4 pt-2 text-xs text-slate-400">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Alinhado à BNCC
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Contratação direta ou B2B2C
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Painel de engajamento
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
              <Link
                to="/educacao"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold bg-emerald-600 text-white hover:bg-emerald-500 transition-all text-xs sm:text-sm shadow-md min-h-[44px]"
              >
                <span>Conhecer Orbis Educação</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/escolas/cadastro"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold bg-white/10 text-white hover:bg-white/20 transition-all text-xs border border-white/20 min-h-[44px]"
              >
                <School className="w-4 h-4 text-emerald-400" />
                <span>Credenciar Escola</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Trilhas Cards Grid */}
        <div className="mb-6">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block mb-1">
            HABILITAÇÕES TÉCNICAS & REGULATÓRIAS
          </span>
          <h2 className="font-heading font-black text-xl sm:text-2xl text-slate-900 dark:text-white">
            Trilhas Profissionais Disponíveis
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {trilhasList.map((trilha) => {
            const Icon = getTrilhaIcon(trilha.slug)
            return (
              <div
                key={trilha.slug}
                className="flex flex-col justify-between p-8 rounded-2xl bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-slate-800 hover:border-emerald-500/60 dark:hover:border-emerald-500/60 transition-all duration-300 hover:shadow-xl group"
              >
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <span className="text-[11px] font-mono font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      {trilha.lei}
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-50 dark:group-hover:bg-emerald-950/40 transition-all">
                      <Icon className="w-5 h-5 stroke-[2]" />
                    </div>
                  </div>

                  <h3 className="font-heading font-bold text-xl text-slate-900 dark:text-white mb-3 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors leading-snug">
                    {trilha.titulo}
                  </h3>

                  <p className="text-xs text-slate-600 dark:text-slate-300 mb-5 leading-relaxed">
                    {trilha.subtitulo}
                  </p>

                  <div className="space-y-2 mb-6">
                    {trilha.destaques.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-5 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2">
                  <Link
                    to={`/trilhas/${trilha.slug}`}
                    className="w-full text-center py-3 rounded-xl font-bold bg-emerald-600 text-white hover:bg-emerald-500 transition-all flex items-center justify-center gap-2 shadow-xs min-h-[44px]"
                  >
                    <span>Explorar Trilha</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>

                  {trilha.linkAuditor && (
                    <div className="flex flex-col gap-2">
                      <Link
                        to="/credenciamento"
                        className="w-full text-center py-2.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-slate-700 transition-all flex items-center justify-center gap-1.5 min-h-[44px]"
                      >
                        <span>Credenciamento de Perito (ART/RRT)</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                      <Link
                        to="/console-do-auditor"
                        className="w-full text-center py-2.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center justify-center gap-1.5 min-h-[44px]"
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
        <div className="mt-16 p-8 rounded-2xl bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <span className="text-[10px] uppercase font-mono font-bold text-amber-700 dark:text-[#D9B36C] block mb-1">
                CONHECIMENTO TÉCNICO APLICADO
              </span>
              <h3 className="font-heading font-extrabold text-xl text-slate-900 dark:text-white">
                Os 15 Protocolos Setoriais Validados dMRV
              </h3>
            </div>
            <Link
              to="/cadeias-produtivas"
              className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1 min-h-[44px]"
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
                className="p-3 rounded-xl bg-slate-50 dark:bg-[#0A1628] border border-slate-200 dark:border-slate-800 hover:border-emerald-500 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors"
              >
                {item.nome}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
