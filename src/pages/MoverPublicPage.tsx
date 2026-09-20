import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  ArrowRight,
  Sparkles,
  FileText,
  Car,
  Recycle,
  Scale,
  Award,
  Layers,
  ExternalLink,
  ChevronRight,
  TrendingDown,
  Building2,
  Lock,
} from 'lucide-react'
import {
  RESERVA_METODOLOGICA_PRE_LAUDO,
  DECLARACAO_PIONEIRISMO_DEFENSAVEL,
  OS_QUATRO_PAPEIS_PROGRAMA,
} from '@/services/moverService'

export function MoverPublicPage() {
  const [copiado, setCopiado] = useState(false)
  const canonicalHashPublico = '4b2e56cf988df0a1ca5d844c8c7f938fae5c3e03889104faee13fef7946927d3'

  const handleCopiarHash = () => {
    navigator.clipboard.writeText(canonicalHashPublico)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 3000)
  }

  return (
    <div className="min-h-screen py-10 md:py-16 bg-[#0A0E12] text-[#F4F7FA]">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 space-y-12">
        {/* Banner Superior de Reserva Metodológica Obrigatória */}
        <div className="p-4 rounded-xl bg-[#16202B]/80 border border-[#D9B36C]/40 text-xs text-[#D9B36C] flex items-start gap-3 shadow-lg">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-[#D9B36C] mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold uppercase tracking-wider block">
              Reserva Metodológica Permanente & Transparência Institucional
            </span>
            <p className="text-[#93A3B5] leading-relaxed">{RESERVA_METODOLOGICA_PRE_LAUDO}</p>
          </div>
        </div>

        {/* Hero Section */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#111820] via-[#0D131A] to-[#0A0E12] border border-[rgba(244,247,250,0.12)] p-6 sm:p-10 md:p-14 shadow-2xl">
          <div className="max-w-3xl space-y-5">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#16202B] border border-[#12B886]/40 text-[#12B886] text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-[#12B886]" />
              ESPAÇO MOVER • LEI FEDERAL 14.902/2024 & METODOLOGIA GS 448
            </div>

            <h1 className="font-heading font-black text-2xl sm:text-4xl md:text-5xl leading-tight text-[#F4F7FA]">
              RASTREABILIDADE E COMPROVAÇÃO PARA DESMONTAGEM VEICULAR — PROGRAMA MOVER
            </h1>

            {/* Destaque do Pioneirismo Defensável com sigla VVB expandida na primeira ocorrência */}
            <div className="p-4 rounded-xl bg-[#12B886]/10 border border-[#12B886]/30 text-xs sm:text-sm text-[#F4F7FA] leading-relaxed space-y-2">
              <div className="flex items-center gap-2 font-bold text-[#12B886] uppercase tracking-wide">
                <ShieldCheck className="w-4 h-4 text-[#12B886]" />
                1ª infraestrutura brasileira de dados alinhada à metodologia GS 448 — emissão de
                créditos, quando houver, exclusivamente via VVB independente
              </div>
              <p className="text-[#93A3B5]">
                A Orbis está estruturando a cadeia completa de validação com entidade
                independentemente acreditada — hoje entregamos a rastreabilidade e a prova
                documental que esse processo exige; a emissão de créditos, quando ocorrer, seguirá
                exclusivamente via organismo validador independente.
              </p>
            </div>

            <p className="text-sm sm:text-base text-[#93A3B5] leading-relaxed">
              O Orbis Protocol atende às diretrizes da metodologia{' '}
              <strong className="text-[#F4F7FA]">GS 448</strong> em sua camada de software,
              garantindo o alinhamento de fatores de substituição reciclado × virgem, requisitos de
              rastreabilidade física de peças e governança de{' '}
              <strong className="text-[#F4F7FA]">MRV (Monitoramento, Relato e Verificação)</strong>.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              {/* Única CTA primária verde de conversão */}
              <Link
                to="/solucoes/case-cdverde"
                className="px-6 py-3.5 rounded-xl bg-[#12B886] text-[#0A0E12] font-bold text-xs sm:text-sm uppercase tracking-wider hover:bg-[#0CA678] transition-all shadow-emerald-glow inline-flex items-center gap-2"
              >
                <span>Conhecer o case operacional</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              {/* Ação secundária neutra */}
              <Link
                to="/dossie-mover"
                className="px-6 py-3.5 rounded-xl border border-[rgba(244,247,250,0.2)] text-[#F4F7FA] font-medium text-xs sm:text-sm tracking-wider hover:bg-[#16202B] hover:border-[rgba(244,247,250,0.35)] transition-all bg-[#0A0E12] inline-flex items-center gap-2"
              >
                <Lock className="w-4 h-4 text-[#D9B36C]" />
                <span>Acessar dossiê técnico</span>
              </Link>
            </div>
          </div>
        </section>

        {/* 1. Alinhamento Metodológico GS 448 (Sem Falsa Certificação) */}
        <section className="p-6 sm:p-8 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.12)] space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[rgba(244,247,250,0.08)] pb-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#12B886] block">
                Rigor Científico & Conformidade Metodológica
              </span>
              <h2 className="font-heading font-extrabold text-xl sm:text-2xl text-[#F4F7FA] mt-1">
                ALINHAMENTO À METODOLOGIA GS 448
              </h2>
            </div>
            <span className="px-3 py-1 rounded-full bg-[#16202B] border border-[#3B82F6]/40 text-[#3B82F6] font-mono text-xs font-bold self-start sm:self-auto">
              Metodologia GS 448 • Versão V2.1
            </span>
          </div>

          <div className="prose prose-invert max-w-none text-xs sm:text-sm text-[#93A3B5] leading-relaxed space-y-4">
            <p>
              A metodologia <strong>GS 448</strong> define critérios para quantificação de reduções
              de emissões decorrentes de atividades de reciclagem e reaproveitamento de materiais em
              fim de vida. A plataforma Orbis Protocol foi desenhada para atender rigorosamente aos
              critérios dessa norma, aplicando:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.08)] space-y-2">
                <div className="w-8 h-8 rounded-lg bg-[#12B886]/10 text-[#12B886] flex items-center justify-center font-bold">
                  1
                </div>
                <h4 className="font-heading font-bold text-sm text-[#F4F7FA]">
                  Fatores de Substituição (Reciclado × Virgem)
                </h4>
                <p className="text-xs text-[#93A3B5] leading-relaxed">
                  Desconto metódico entre a intensidade carbônica da produção primária brasileira
                  (aço, alumínio, polímeros) e o reprocessamento de insumos secundários do desmonte.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.08)] space-y-2">
                <div className="w-8 h-8 rounded-lg bg-[#D9B36C]/10 text-[#D9B36C] flex items-center justify-center font-bold">
                  2
                </div>
                <h4 className="font-heading font-bold text-sm text-[#F4F7FA]">
                  Rastreabilidade e Cadeia de Custódia
                </h4>
                <p className="text-xs text-[#93A3B5] leading-relaxed">
                  Passaporte Digital de Peça (DPP) com QR Code inviolável, vínculo com baixa no
                  DETRAN e MTR-SINIR oficial da destinação de sucatas e resíduos.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.08)] space-y-2">
                <div className="w-8 h-8 rounded-lg bg-[#3B82F6]/10 text-[#3B82F6] flex items-center justify-center font-bold">
                  3
                </div>
                <h4 className="font-heading font-bold text-sm text-[#F4F7FA]">
                  Governança dMRV Digital
                </h4>
                <p className="text-xs text-[#93A3B5] leading-relaxed">
                  Monitoramento contínuo em tempo real sem planilhas editáveis, com chave
                  criptográfica SHA-256 canônica verificável publicamente por qualquer autoridade.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-[#070A0D] border-l-4 border-[#D9B36C] text-xs text-[#93A3B5]">
              <strong className="text-[#D9B36C] block mb-0.5">
                Nota de Alinhamento Metodológico (Aviso Legal):
              </strong>
              O Orbis Protocol é uma provedora de infraestrutura de dados e dMRV alinhada aos
              requisitos da GS 448. A plataforma não é credenciadora nem certificadora. A validação
              do projeto e a emissão de créditos, quando houver, serão conduzidas exclusivamente por
              um <strong>VVB acreditado independente</strong> a ser formalmente contratado.
            </div>
          </div>
        </section>

        {/* 2. Governança: Separação Estrita dos 4 Papéis */}
        <section className="p-6 sm:p-8 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.12)] space-y-6">
          <div className="border-b border-[rgba(244,247,250,0.08)] pb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-[#D9B36C] block">
              Governança Institucional & Separação de Funções
            </span>
            <h2 className="font-heading font-extrabold text-xl sm:text-2xl text-[#F4F7FA] mt-1">
              OS 4 PAPÉIS DO PROGRAMA DE CRÉDITOS
            </h2>
            <p className="text-xs sm:text-sm text-[#93A3B5] mt-1">
              Para assegurar imparcialidade, prevenção de conflito de interesses e conformidade com
              as melhores práticas internacionais de integridade de carbono:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {OS_QUATRO_PAPEIS_PROGRAMA.map((item, idx) => (
              <div
                key={idx}
                className="p-5 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.1)] flex flex-col justify-between space-y-3"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span
                      className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border"
                      style={{
                        color: item.cor,
                        borderColor: `${item.cor}40`,
                        backgroundColor: `${item.cor}15`,
                      }}
                    >
                      Papel {idx + 1}
                    </span>
                    <span className="text-[11px] font-mono text-[#D9B36C]">{item.status}</span>
                  </div>
                  <h3 className="font-heading font-bold text-base text-[#F4F7FA]">{item.papel}</h3>
                  <div className="text-xs text-[#12B886] font-semibold">{item.entidade}</div>
                  <p className="text-xs text-[#93A3B5] leading-relaxed">{item.atribuicao}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 3. Hash SHA-256 Canônico Público da Camada 1 */}
        <section className="p-6 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.12)] space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#12B886] block">
                Integridade Criptográfica Imutável
              </span>
              <h3 className="font-heading font-bold text-sm text-[#F4F7FA]">
                HASH SHA-256 CANÔNICO DO DESENHO METODOLÓGICO GS 448
              </h3>
            </div>
            <button
              onClick={handleCopiarHash}
              className="px-3.5 py-1.5 rounded-lg bg-[#16202B] border border-[rgba(244,247,250,0.15)] text-[#93A3B5] hover:text-[#F4F7FA] text-xs flex items-center gap-1.5 self-start sm:self-auto transition-all"
            >
              {copiado ? (
                <Check className="w-3.5 h-3.5 text-[#12B886]" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              <span>{copiado ? 'Copiado!' : 'Copiar Hash'}</span>
            </button>
          </div>

          <div className="p-3 rounded-lg bg-[#0A0E12] border border-[rgba(244,247,250,0.06)] font-mono text-xs text-[#12B886] break-all select-all">
            {canonicalHashPublico}
          </div>
          <p className="text-[11px] text-[#93A3B5]">
            Consolidação matemática do escopo, regras de baseline e parâmetros de substituição
            declarados na v0.0.41 do protocolo.
          </p>
        </section>

        {/* 4. Chamada de Ação (CTA): Credencie seu CDV como VPA */}
        <section className="p-8 sm:p-10 rounded-2xl bg-gradient-to-r from-[#111820] via-[#16202B] to-[#111820] border border-[#12B886]/40 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] font-bold uppercase bg-[#12B886]/15 text-[#12B886] border border-[#12B886]/30">
              <Car className="w-3.5 h-3.5" />
              CADASTRO ABERTO PARA CENTRAIS DE DESMONTAGEM
            </span>
            <h3 className="font-heading font-extrabold text-xl sm:text-2xl text-[#F4F7FA]">
              QUALIFIQUE SEU CDV COMO VPA (VOLUNTARY PROJECT ACTIVITY — ÁREA DE PROJETO VOLUNTÁRIO)
            </h3>
            <p className="text-xs sm:text-sm text-[#93A3B5] leading-relaxed">
              CDVs credenciados pelo DETRAN com volume comprovado de VFV (Veículos em Fim de Vida) e
              rastreabilidade fiscal podem se candidatar ao programa piloto. O Selo CDV Conforme é o
              pré-requisito de conformidade do projeto.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto flex-shrink-0">
            {/* Única CTA primária verde de conversão */}
            <Link
              to="/diagnostico"
              className="px-6 py-3.5 rounded-xl bg-[#12B886] text-[#0A0E12] font-bold text-xs uppercase tracking-wider hover:bg-[#0CA678] text-center shadow-emerald-glow transition-all"
            >
              Iniciar diagnóstico por CNPJ
            </Link>
            {/* Ação secundária neutra */}
            <Link
              to="/bureau"
              className="px-6 py-3.5 rounded-xl border border-[rgba(244,247,250,0.2)] text-[#F4F7FA] font-medium text-xs tracking-wider hover:bg-[#1F2C3A] hover:border-[rgba(244,247,250,0.35)] text-center bg-[#16202B] transition-all"
            >
              Acessar cockpit Bureau
            </Link>
          </div>
        </section>
      </div>
    </div>
  )
}

export default MoverPublicPage
