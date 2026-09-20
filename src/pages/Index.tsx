import React from 'react'
import { Link } from 'react-router-dom'
import { OrbisGlobe } from '@/components/OrbisGlobe'
import {
  ShieldCheck,
  ArrowRight,
  Database,
  FileCheck,
  TrendingDown,
  Layers,
  ChevronRight,
  Sparkles,
  ExternalLink,
  Award,
  BarChart3,
  CheckCircle2,
  Lock,
  Boxes,
  ScrollText,
  Search,
} from 'lucide-react'

export default function Index() {
  const pilares = [
    {
      icon: ShieldCheck,
      tag: 'ANTIFRAUDE TRIBUTÁRIA',
      title: 'Comprovação sem Greenwashing',
      desc: 'Evidências técnicas e atestados probatórios baseados em notas fiscais oficiais (SEFAZ) e dados primários de campo, eliminando declarações corporativas sem lastro.',
    },
    {
      icon: Database,
      tag: 'RASTREIO DE EXTREMO A EXTREMO',
      title: 'Rastreabilidade Completa',
      desc: 'Acompanhamento sequencial de cada nota fiscal, lote de insumo, transporte e destinação de resíduos ao longo de toda a cadeia de fornecedores e clientes.',
    },
    {
      icon: TrendingDown,
      tag: 'EFICIÊNCIA FINANCEIRA',
      title: 'Sustentabilidade & Caixa',
      desc: 'Métricas de carbono (GHG Protocol Escopos 1, 2 e 3), eficiência de recursos e cálculo de economia fiscal e redução de taxas em financiamentos bancários.',
    },
    {
      icon: Layers,
      tag: 'PADRONIZAÇÃO GLOBAL',
      title: 'Dados Oficiais e Padronizados',
      desc: 'Calibração preparatória com diretrizes do IPCC, normas ABNT ISO 14064, matriz energética oficial do SIN/MCTI e alinhamento à Lei 15.042/2024 (SBCE).',
    },
  ]

  const passos = [
    {
      step: '01',
      title: 'Diagnóstico Setorial',
      desc: 'Mapeamento das atividades produtivas, identificação de fatores críticos de impacto e enquadramento na cadeia aplicável.',
    },
    {
      step: '02',
      title: 'Fatores Oficiais',
      desc: 'Aplicação automática de fatores de emissão oficiais e reconhecidos (MCTI, IPCC, SIN, ABNT) para o setor e localização.',
    },
    {
      step: '03',
      title: 'Ingestão & Validação',
      desc: 'Diagnóstico documental, preparação para ingestão de dados fiscais (SPED/NF-e em implantação) e verificação técnica de consistência pericial.',
    },
    {
      step: '04',
      title: 'Emissão de Laudos',
      desc: 'Geração de relatórios técnicos completos e laudos periciais com lastro probatório para auditorias e compliance regulatório.',
    },
    {
      step: '05',
      title: 'Selo Oficial',
      desc: 'Concessão de selo digital verificável com QR Code dinâmico, atestando autenticidade para rótulos, clientes e investidores.',
    },
  ]

  const regulamentacoesCards = [
    {
      lei: 'Lei 15.042/2024',
      nome: 'Diretrizes do Sistema Brasileiro de Comércio de Emissões (SBCE)',
      impacto:
        'Preparação documental e inventários técnicos alinhados aos limiares do SBCE (reporte a partir de 10.000 tCO2e/ano e metas acima de 25.000 tCO2e/ano).',
    },
    {
      lei: 'Lei 14.902/2024',
      nome: 'Programa MOVER (Automotivo & CDV)',
      impacto:
        'Créditos de IPI específicos para montadoras, importadores e Centrais de Desmontagem de Veículos (CDVs DETRAN) via Passaporte Digital de Produto.',
    },
    {
      lei: 'Resolução CVM 193 / IFRS S1 & S2',
      nome: 'Divulgação Climática Voluntária e Asseguração',
      impacto:
        'Reporte voluntário IFRS S1/S2 (Res. CVM 193) com preparação para asseguração e governança de sustentabilidade para o mercado de capitais.',
    },
    {
      lei: 'Resolução BCB 4.945/2021',
      nome: 'Exigências ESG de Credores e Instituições Financeiras',
      impacto:
        'Preparação para as exigências da Política PRSAC aplicadas pelos bancos credores, viabilizando melhores condições de financiamento verde.',
    },
  ]

  return (
    <div className="flex flex-col w-full overflow-x-hidden">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28 bg-[#0A0E12] border-b border-[rgba(244,247,250,0.08)]">
        {/* Subtle Ambient Radial Glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] max-w-full h-[360px] bg-gradient-to-b from-[#D9B36C]/10 via-[#12B886]/10 to-transparent blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[500px] max-w-full h-[300px] bg-[#12B886]/10 blur-[120px] pointer-events-none" />

        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 relative z-10">
          <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
            {/* Top Security Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#111820] border border-[#12B886]/40 text-[#12B886] text-xs font-semibold tracking-wider uppercase mb-8 shadow-sm">
              <ShieldCheck className="w-4 h-4 text-[#12B886]" />
              <span>ORBIS PROTOCOL • AUDIT GRADE dMRV</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#12B886]/20 text-[#12B886]">
                ATIVO
              </span>
            </div>

            {/* Main Hero Headline */}
            <h1 className="font-heading font-extrabold text-3xl sm:text-5xl md:text-6xl text-[#F4F7FA] tracking-[0.03em] leading-[1.1] mb-6">
              INFRAESTRUTURA DE COMPROVAÇÃO E{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#12B886] via-[#27C08C] to-[#D9B36C]">
                RASTREABILIDADE
              </span>
            </h1>

            {/* Sub-headline */}
            <p className="font-heading text-lg sm:text-xl md:text-2xl text-[#93A3B5] font-semibold tracking-wide mb-6">
              para Descarbonização e Governança Tributária
            </p>

            {/* Paragraph Description */}
            <p className="text-base sm:text-lg text-[#93A3B5] leading-relaxed max-w-2xl mb-10">
              A plataforma que transforma notas fiscais e dados operacionais em{' '}
              <strong className="text-[#F4F7FA] font-semibold">
                laudos periciais de descarbonização
              </strong>
              , <strong className="text-[#F4F7FA] font-semibold">conformidade tributária</strong> e{' '}
              <strong className="text-[#F4F7FA] font-semibold">selos de sustentabilidade</strong>{' '}
              aceitos por grandes clientes e pelo sistema financeiro (bancos públicos e privados).
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
              <Link
                to="/diagnostico"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-base font-bold bg-[#12B886] text-[#0A0E12] hover:bg-[#0CA678] hover:scale-[1.02] transition-all shadow-emerald-glow"
              >
                <span>Iniciar Diagnóstico por CNPJ</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                to="/registro"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-4 rounded-xl text-base font-semibold border border-[#12B886]/60 text-[#12B886] hover:bg-[#12B886] hover:text-[#0A0E12] transition-all bg-[#111820]/80 shadow-sm"
              >
                <span>Criar Conta Gratuita</span>
              </Link>
              <a
                href="#o-que-e"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl text-sm font-semibold border border-[rgba(244,247,250,0.2)] text-[#93A3B5] hover:border-[#F4F7FA] hover:text-[#F4F7FA] transition-all bg-[#111820]/40"
              >
                <span>Conhecer o Protocolo</span>
              </a>
            </div>

            {/* Rotating Emblem in Hero */}
            <div className="mt-16 flex flex-col items-center gap-3">
              <div className="p-3.5 rounded-full bg-[#111820]/90 border border-[#12B886]/40 shadow-2xl relative group">
                <div className="absolute inset-0 rounded-full bg-[#12B886]/20 blur-md group-hover:scale-125 transition-transform" />
                <OrbisGlobe size={72} />
              </div>
              <span className="text-xs uppercase tracking-[0.2em] text-[#93A3B5] font-semibold">
                Auditoria & Rastreabilidade Confiável
              </span>
              <div className="w-1.5 h-6 rounded-full bg-[#12B886]/40 animate-pulse mt-2" />
            </div>
          </div>
        </div>
      </section>

      {/* 2. SECTION: O QUE É O ORBIS PROTOCOL */}
      <section id="o-que-e" className="py-20 md:py-28 bg-[#0A0E12] relative scroll-mt-32">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#D9B36C] block mb-2">
              ARQUITETURA INTEGRADA
            </span>
            <h2 className="font-heading font-extrabold text-2xl sm:text-4xl text-[#F4F7FA] tracking-wide mb-4">
              O QUE É O ORBIS PROTOCOL
            </h2>
            <p className="text-base sm:text-lg text-[#93A3B5] leading-relaxed">
              O Orbis Protocol é a infraestrutura tecnológica que padroniza comprovação e
              rastreabilidade para cadeias produtivas globais e regionais. Conectamos diagnósticos
              independentes, fatores oficiais de cálculo reconhecidos internacionalmente, laudos
              técnicos auditáveis e a emissão de selos de sustentabilidade invioláveis.
            </p>
          </div>

          {/* 4 Pillars Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {pilares.map((pilar, idx) => {
              const Icon = pilar.icon
              return (
                <div
                  key={idx}
                  className="group relative flex flex-col p-6 rounded-xl bg-[#111820] border border-[rgba(244,247,250,0.12)] hover:border-[#12B886] hover:bg-[#16202B] transition-all duration-300 hover:shadow-2xl hover:-translate-y-1"
                >
                  <div className="w-12 h-12 rounded-lg bg-[#16202B] border border-[rgba(244,247,250,0.12)] flex items-center justify-center mb-5 text-[#12B886] group-hover:scale-110 group-hover:bg-[#12B886]/10 transition-all">
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-[11px] font-bold tracking-wider uppercase text-[#D9B36C] mb-2 block">
                    {pilar.tag}
                  </span>
                  <h3 className="font-heading font-bold text-lg text-[#F4F7FA] mb-3 group-hover:text-[#12B886] transition-colors">
                    {pilar.title}
                  </h3>
                  <p className="text-sm text-[#93A3B5] leading-relaxed flex-1">{pilar.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* 3. SECTION: METODOLOGIA (5 PASSOS) */}
      <section className="py-20 md:py-28 bg-[#0D1217] border-y border-[rgba(244,247,250,0.08)]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#12B886] block mb-2">
              METODOLOGIA PROBATÓRIA
            </span>
            <h2 className="font-heading font-extrabold text-2xl sm:text-4xl text-[#F4F7FA] tracking-wide mb-4">
              COMO FUNCIONA O ORBIS PROTOCOL
            </h2>
            <p className="text-base sm:text-lg text-[#93A3B5]">
              Da identificação do CNPJ à emissão de atestados auditáveis aceitos por grandes
              compradores e pelo sistema financeiro.
            </p>
          </div>

          {/* Timeline */}
          <div className="relative">
            {/* Desktop connecting line */}
            <div className="hidden lg:block absolute top-1/4 left-10 right-10 h-0.5 bg-gradient-to-r from-[#12B886]/20 via-[#12B886] to-[#D9B36C]/40 -z-0" />

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 relative z-10">
              {passos.map((passo, idx) => (
                <div
                  key={idx}
                  className="flex flex-col p-6 rounded-xl bg-[#111820] border border-[rgba(244,247,250,0.12)] hover:border-[#12B886]/60 transition-all hover:-translate-y-1"
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-heading font-black text-3xl text-transparent bg-clip-text bg-gradient-to-b from-[#12B886] to-[#12B886]/30">
                      {passo.step}
                    </span>
                    <span className="text-[10px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded bg-[#16202B] text-[#93A3B5]">
                      FASE {passo.step}
                    </span>
                  </div>
                  <h3 className="font-heading font-bold text-base text-[#F4F7FA] mb-2">
                    {passo.title}
                  </h3>
                  <p className="text-xs text-[#93A3B5] leading-relaxed">{passo.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 4. SECTION: REGULAMENTAÇÕES EM DESTAQUE */}
      <section className="py-20 md:py-28 bg-[#0A0E12]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#D9B36C] block mb-2">
                SEGURANÇA JURÍDICA & COMPLIANCE
              </span>
              <h2 className="font-heading font-extrabold text-2xl sm:text-4xl text-[#F4F7FA]">
                MARCO REGULATÓRIO INTEGRADO
              </h2>
            </div>
            <Link
              to="/trilhas"
              className="inline-flex items-center gap-1.5 text-sm text-[#12B886] font-semibold hover:underline"
            >
              <span>Ver todas as trilhas regulatórias</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {regulamentacoesCards.map((reg, idx) => (
              <div
                key={idx}
                className="p-6 rounded-xl bg-[#111820] border border-[rgba(244,247,250,0.12)] flex flex-col justify-between hover:border-[rgba(244,247,250,0.25)] transition-all"
              >
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-[#16202B] text-[#12B886] text-xs font-bold tracking-wider uppercase mb-3">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#12B886]" />
                    {reg.lei}
                  </div>
                  <h3 className="font-heading font-bold text-lg text-[#F4F7FA] mb-2">{reg.nome}</h3>
                  <p className="text-sm text-[#93A3B5] leading-relaxed">{reg.impacto}</p>
                </div>
                <div className="mt-5 pt-4 border-t border-[rgba(244,247,250,0.08)] flex items-center justify-between text-xs text-[#93A3B5]">
                  <span className="text-[#D9B36C] font-semibold">Exigência ativa</span>
                  <span>Impacto Fiscal & Spread</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. SECTION: CTAs E CAMINHOS RÁPIDOS */}
      <section className="py-16 bg-gradient-to-b from-[#111820] to-[#0A0E12] border-t border-[rgba(244,247,250,0.12)]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="p-8 sm:p-12 rounded-2xl bg-gradient-to-r from-[#111820] via-[#16202B] to-[#111820] border border-[#12B886]/40 relative overflow-hidden flex flex-col lg:flex-row items-center justify-between gap-8 shadow-2xl">
            <div className="max-w-2xl">
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#12B886] block mb-2">
                AUDITORIA INSTANTÂNEA
              </span>
              <h2 className="font-heading font-extrabold text-2xl sm:text-3xl md:text-4xl text-[#F4F7FA] mb-3">
                PRONTO PARA AUDITAR E CERTIFICAR SEU CNPJ?
              </h2>
              <p className="text-sm sm:text-base text-[#93A3B5] leading-relaxed">
                Inicie o diagnóstico em 4 etapas, teste com nossos modelos pré-carregados e
                visualize sua qualificação ambiental, tributária e emissão do Selo Oficial.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0 w-full lg:w-auto">
              <Link
                to="/diagnostico"
                className="w-full sm:w-auto text-center px-7 py-3.5 rounded-xl text-sm font-bold bg-[#12B886] text-[#0A0E12] hover:bg-[#0CA678] hover:scale-[1.02] transition-all shadow-emerald-glow"
              >
                Iniciar Diagnóstico
              </Link>
              <Link
                to="/registro"
                className="w-full sm:w-auto text-center px-6 py-3.5 rounded-xl text-sm font-semibold bg-[#16202B] border border-[#12B886]/60 text-[#12B886] hover:bg-[#12B886] hover:text-[#0A0E12] transition-all"
              >
                Criar Conta
              </Link>
              <Link
                to="/verificador"
                className="w-full sm:w-auto text-center px-5 py-3.5 rounded-xl text-sm font-semibold border border-[rgba(244,247,250,0.2)] text-[#93A3B5] hover:border-[#D9B36C] hover:text-[#D9B36C] transition-all"
              >
                Verificar Selo
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
