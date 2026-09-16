import React from 'react'
import { Link } from 'react-router-dom'
import {
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Building2,
  Car,
  FileCheck,
  Lock,
} from 'lucide-react'

export default function Planos() {
  const planos = [
    {
      id: 'essencial',
      nome: 'Plano Essencial',
      indicacao: 'Pequenas e Médias Empresas (PME)',
      descricao:
        'Diagnóstico preliminar e protocolo de conformidade para atendimento a fornecedores e bancos credores.',
      precoApenas: 'A partir de R$ 980 / ano',
      destaques: [
        'Diagnóstico anual preliminar por CNPJ',
        'Emissão do Selo Oficial Orbis Protocol dMRV',
        'Atestado preparatório para exigências ESG bancárias (Res. BCB 4.945/2021)',
        'Suporte técnico via e-mail e comunidade',
        'Ingestão real de XML NF-e (Mod. 55/65) com apuração de créditos tributários ativos',
      ],
      ctaText: 'Fazer Diagnóstico Preliminar',
      popular: false,
    },
    {
      id: 'profissional',
      nome: 'Plano MOVER & Descarbonização',
      indicacao: 'Exclusivo Segmento Automotivo & CDVs DETRAN',
      descricao:
        'Auditoria preparatória para incentivos de IPI do Programa MOVER e Passaporte Digital de Produto (DPP).',
      precoApenas: 'Sob Consulta Técnica',
      destaques: [
        'Tudo do plano Essencial',
        'Dossiê preparatório para créditos do Programa MOVER (Lei 14.902/2024)',
        'Passaporte Digital de Produto (DPP) para peças reaproveitadas',
        'Laudo pericial preliminar com ART técnica acoplada',
        'Ingestão de XML de NF-e e conciliação de créditos de PIS/Cofins, ICMS e IPI',
        'Atendimento especializado para desmanches credenciados',
      ],
      ctaText: 'Diagnóstico para Setor Automotivo',
      popular: true,
    },
    {
      id: 'corporativo',
      nome: 'Plano Corporativo & SBCE',
      indicacao: 'Indústrias Reguladas & Grandes Exportadores',
      descricao:
        'Preparação contábil para o mercado regulado SBCE (Lei 15.042/2024), reporte IFRS voluntário e gateway CBAM.',
      precoApenas: 'Proposta Customizada',
      destaques: [
        'Tudo do plano Profissional',
        'Gestão multi-CNPJ e filiais corporativas',
        'Reporte voluntário IFRS S1/S2 (Res. CVM 193) com preparação para asseguração',
        'Avaliação de impacto aos limiares do SBCE (> 10k e > 25k tCO₂e)',
        'Dossiê técnico preparatório para mecanismo de fronteira CBAM (UE)',
        'Auditor técnico dedicado dMRV',
      ],
      ctaText: 'Solicitar Diagnóstico Corporativo',
      popular: false,
    },
  ]

  return (
    <div className="min-h-screen py-12 md:py-20 bg-[#0A0E12]">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="max-w-3xl mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#111820] border border-[#12B886]/40 text-[#12B886] text-xs font-semibold tracking-wider uppercase mb-4">
            <ShieldCheck className="w-4 h-4 text-[#12B886]" />
            SOLUÇÕES & PLANOS CORPORATIVOS
          </div>
          <h1 className="font-heading font-extrabold text-2xl sm:text-4xl md:text-5xl text-[#F4F7FA] tracking-wide mb-4">
            PLANOS DE ADESÃO & CERTIFICAÇÃO
          </h1>
          <p className="text-base sm:text-lg text-[#93A3B5] leading-relaxed">
            Conheça as modalidades de certificação pericial dMRV da plataforma Orbis Protocol.
            Inicie pelo diagnóstico gratuito do seu CNPJ para receber uma proposta técnica sob
            medida.
          </p>
        </div>

        {/* Informative Protected Area Notice */}
        <div className="mb-10 p-4 rounded-xl bg-[#16202B] border border-[rgba(244,247,250,0.1)] flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5 text-[#93A3B5]">
            <Lock className="w-4 h-4 text-[#D9B36C] shrink-0" />
            <span>
              O ambiente de contratação direta, checkout e histórico de faturas é restrito a
              usuários autenticados no{' '}
              <strong className="text-[#F4F7FA]">Módulo Financeiro Protegido</strong>.
            </span>
          </div>
          <Link
            to="/financeiro"
            className="text-[#12B886] hover:underline font-semibold shrink-0 ml-3"
          >
            Acessar Financeiro →
          </Link>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {planos.map((p) => (
            <div
              key={p.id}
              className={`rounded-2xl p-8 flex flex-col justify-between transition-all relative ${
                p.popular
                  ? 'bg-gradient-to-b from-[#111820] to-[#16202B] border-2 border-[#12B886] shadow-emerald-glow'
                  : 'bg-[#111820] border border-[rgba(244,247,250,0.12)] hover:border-[rgba(244,247,250,0.25)]'
              }`}
            >
              {p.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-[#12B886] text-[#0A0E12] text-[10px] font-bold uppercase tracking-wider">
                  SETOR AUTOMOTIVO & CDVs
                </span>
              )}

              <div>
                <div className="mb-4">
                  <span className="text-[11px] font-bold text-[#D9B36C] uppercase tracking-wider block mb-1">
                    {p.indicacao}
                  </span>
                  <h3 className="font-heading font-extrabold text-xl text-[#F4F7FA]">{p.nome}</h3>
                  <p className="text-xs text-[#93A3B5] mt-2 leading-relaxed">{p.descricao}</p>
                </div>

                <div className="py-4 border-y border-[rgba(244,247,250,0.08)] mb-6">
                  <span className="text-sm font-semibold text-[#12B886] block">
                    {p.precoApenas}
                  </span>
                  <span className="text-[11px] text-[#93A3B5]/70 block mt-0.5">
                    Definido após conferência de porte e complexidade fiscal
                  </span>
                </div>

                <div className="space-y-3 mb-8">
                  <span className="text-xs font-semibold text-[#F4F7FA] uppercase tracking-wider block">
                    O que está incluído:
                  </span>
                  {p.destaques.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-[#93A3B5]">
                      <CheckCircle2 className="w-4 h-4 text-[#12B886] shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Link
                  to="/checkout"
                  className="w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 bg-[#12B886] text-[#0A0E12] hover:bg-[#0CA678] transition-all shadow-emerald-glow"
                >
                  <span>Contratar via PIX (R$ 490 / R$ 2.850 / R$ 7.800)</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/diagnostico"
                  className="w-full py-2.5 rounded-xl font-semibold text-xs text-[#93A3B5] hover:text-[#F4F7FA] border border-[rgba(244,247,250,0.12)] hover:border-[#12B886]/40 flex items-center justify-center gap-1.5 transition-all"
                >
                  <span>{p.ctaText}</span>
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA Banner */}
        <div className="p-8 sm:p-10 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.12)] flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <h3 className="font-heading font-extrabold text-xl sm:text-2xl text-[#F4F7FA]">
              Dúvidas sobre o enquadramento tributário da sua empresa?
            </h3>
            <p className="text-xs sm:text-sm text-[#93A3B5] max-w-xl">
              Nossa equipe técnica analisa seu CNAE, faturamento e cadeia de valor para indicar a
              trilha regulatória preparatória mais eficiente para o SBCE ou Programa MOVER.
            </p>
          </div>
          <Link
            to="/diagnostico"
            className="px-8 py-3.5 rounded-xl font-bold bg-[#12B886] text-[#0A0E12] hover:bg-[#0CA678] transition-all shadow-emerald-glow flex items-center gap-2 shrink-0 text-xs sm:text-sm uppercase tracking-wider"
          >
            <span>Fazer Diagnóstico Gratuito</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}
