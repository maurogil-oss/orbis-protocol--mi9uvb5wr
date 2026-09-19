import React from 'react'
import { Link } from 'react-router-dom'
import { OrbisGlobe } from '@/components/OrbisGlobe'
import { OrbisLogo } from '@/components/OrbisLogo'
import {
  ShieldCheck,
  CheckCircle2,
  Award,
  CreditCard,
  Car,
  TrendingDown,
  FileCheck2,
  Lock,
  ArrowRight,
} from 'lucide-react'

export default function TestCatalog() {
  return (
    <div className="min-h-screen py-12 md:py-20 bg-[#0A0E12]">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        <div className="mb-10 pb-6 border-b border-[rgba(244,247,250,0.1)]">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#111820] border border-[#12B886]/40 text-[#12B886] text-xs font-semibold tracking-wider uppercase mb-3">
            <ShieldCheck className="w-4 h-4" />
            CATÁLOGO DE COMPONENTES & VALIDAÇÃO VISUAL
          </div>
          <h1 className="font-heading font-extrabold text-3xl sm:text-4xl text-[#F4F7FA]">
            SISTEMA DE DESIGN ORBIS PROTOCOL
          </h1>
          <p className="text-sm text-[#93A3B5] mt-1">
            Visualização de logotipo oficial transparente, paleta de cores (#0A0E12, #12B886,
            #D9B36C), tipografia, botões e cards.
          </p>
        </div>

        {/* 1. LOGO OFICIAL & EMBLEMA */}
        <section className="mb-12 p-8 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.12)]">
          <h2 className="font-heading font-bold text-lg text-[#F4F7FA] mb-6">
            1. LOGO OFICIAL & EMBLEMA TRANSPARENTE
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-6 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.08)]">
              <span className="text-xs uppercase text-[#93A3B5] font-semibold block mb-4">
                Logo Completa Oficial (Transparente / Alta Definição)
              </span>
              <div className="py-4 flex items-center justify-center">
                <OrbisLogo variant="full" height={56} />
              </div>
            </div>

            <div className="p-6 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.08)]">
              <span className="text-xs uppercase text-[#93A3B5] font-semibold block mb-4">
                Emblema Circular (Globo, Folha e Aro Metálico)
              </span>
              <div className="flex flex-wrap items-center justify-around gap-4 py-2">
                <div className="flex flex-col items-center gap-2">
                  <OrbisGlobe size={32} />
                  <span className="text-[10px] text-[#93A3B5]">32px</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <OrbisGlobe size={48} />
                  <span className="text-[10px] text-[#93A3B5]">48px</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <OrbisGlobe size={64} />
                  <span className="text-[10px] text-[#93A3B5]">64px</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <OrbisGlobe size={80} />
                  <span className="text-[10px] text-[#93A3B5]">80px</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 2. BOTÕES & INTERAÇÕES */}
        <section className="mb-12 p-8 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.12)]">
          <h2 className="font-heading font-bold text-lg text-[#F4F7FA] mb-6">
            2. BOTÕES & ESTADOS DE FOCO
          </h2>
          <div className="flex flex-wrap items-center gap-4">
            <button className="px-6 py-3 rounded-xl font-bold bg-[#12B886] text-[#0A0E12] hover:bg-[#0CA678] hover:scale-[1.02] transition-all shadow-emerald-glow text-sm">
              Botão Primário (#12B886)
            </button>
            <button className="px-6 py-3 rounded-xl font-semibold border border-[rgba(244,247,250,0.35)] text-[#F4F7FA] hover:border-[#12B886] hover:text-[#12B886] transition-all text-sm">
              Botão Contorno
            </button>
            <button className="px-6 py-3 rounded-xl font-bold bg-[#D9B36C] text-[#0A0E12] hover:bg-[#C49B4E] transition-all shadow-gold-glow text-sm">
              Botão Ouro Dourado
            </button>
            <button className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#16202B] text-[#93A3B5] border border-[rgba(244,247,250,0.1)]">
              Botão Neutro / Tag
            </button>
          </div>
        </section>

        {/* 3. PALETA DE CORES */}
        <section className="mb-12 p-8 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.12)]">
          <h2 className="font-heading font-bold text-lg text-[#F4F7FA] mb-6">
            3. PALETA DE CORES OFICIAIS
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4 text-xs font-mono">
            <div className="p-4 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.1)]">
              <div className="font-bold text-[#F4F7FA]">#0A0E12</div>
              <div className="text-[10px] text-[#93A3B5] mt-1">Fundo Principal</div>
            </div>
            <div className="p-4 rounded-xl bg-[#111820] border border-[rgba(244,247,250,0.2)]">
              <div className="font-bold text-[#F4F7FA]">#111820</div>
              <div className="text-[10px] text-[#93A3B5] mt-1">Cards Elevados</div>
            </div>
            <div className="p-4 rounded-xl bg-[#16202B]">
              <div className="font-bold text-[#F4F7FA]">#16202B</div>
              <div className="text-[10px] text-[#93A3B5] mt-1">Hover & Inputs</div>
            </div>
            <div className="p-4 rounded-xl bg-[#12B886] text-[#0A0E12] font-bold">
              <div>#12B886</div>
              <div className="text-[10px] mt-1">Verde-Esmeralda (ESG)</div>
            </div>
            <div className="p-4 rounded-xl bg-[#D9B36C] text-[#0A0E12] font-bold">
              <div>#D9B36C</div>
              <div className="text-[10px] mt-1">Dourado-Champagne</div>
            </div>
            <div className="p-4 rounded-xl bg-[#F03E54] text-[#F4F7FA] font-bold">
              <div>#F03E54</div>
              <div className="text-[10px] mt-1">Erro / Revogado</div>
            </div>
          </div>
        </section>

        {/* 4. ATALHOS PARA TODAS AS ROTAS */}
        <section className="p-8 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.12)]">
          <h2 className="font-heading font-bold text-lg text-[#F4F7FA] mb-6">
            4. MAPA COMPLETO DE ROTAS DO APLICATIVO
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
            {[
              { path: '/', label: 'Landing Institucional (/)' },
              { path: '/diagnostico', label: 'Funil por CNPJ (/diagnostico)' },
              { path: '/trilhas', label: 'Lista de Trilhas (/trilhas)' },
              { path: '/mover', label: 'Espaço MOVER (/mover)' },
              { path: '/dossie-mover', label: 'Dossiê do Projeto MOVER (/dossie-mover) [Auth]' },
              { path: '/trilhas/mover', label: 'Trilha MOVER (/trilhas/mover)' },
              {
                path: '/trilhas/sbce-financas-verdes',
                label: 'Trilha SBCE (/trilhas/sbce-financas-verdes)',
              },
              {
                path: '/trilhas/peritos-tecnicos',
                label: 'Trilha Peritos (/trilhas/peritos-tecnicos)',
              },
              { path: '/solucoes', label: 'Hub de Soluções (/solucoes)' },
              { path: '/solucoes/bureau-acp', label: 'Bureau ACP (/solucoes/bureau-acp)' },
              {
                path: '/solucoes/portal-corporativo',
                label: 'Portal Corporativo (/solucoes/portal-corporativo)',
              },
              { path: '/solucoes/case-cdverde', label: 'Case CDVerde (/solucoes/case-cdverde)' },
              {
                path: '/solucoes/cadeias-produtivas',
                label: '15 Cadeias (/solucoes/cadeias-produtivas)',
              },
              { path: '/financeiro', label: 'Portal Financeiro (/financeiro)' },
              { path: '/verificador', label: 'Verificador de Selos (/verificador)' },
              { path: '/painel', label: 'Painel do Cliente [Auth] (/painel)' },
              {
                path: '/console-do-auditor',
                label: 'Console do Auditor [Auth] (/console-do-auditor)',
              },
              { path: '/login', label: 'Página de Login (/login)' },
            ].map((r) => (
              <Link
                key={r.path}
                to={r.path}
                className="p-3 rounded-lg bg-[#0A0E12] border border-[rgba(244,247,250,0.08)] hover:border-[#12B886] hover:text-[#12B886] transition-colors flex items-center justify-between"
              >
                <span>{r.label}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
