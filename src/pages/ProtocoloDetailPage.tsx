import React from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { getProtocoloBySlug, LISTA_PROTOCOLOS_SETORIAIS } from '@/data/protocolosSetoriais'
import {
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  FileCheck2,
  Scale,
  FileText,
  TrendingDown,
  Layers,
  Sparkles,
  CheckCircle2,
  Calendar,
  Building,
  HelpCircle,
  ExternalLink,
  ChevronRight,
} from 'lucide-react'

export default function ProtocoloDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()

  const protocolo = slug ? getProtocoloBySlug(slug) : undefined

  if (!protocolo) {
    return (
      <div className="min-h-screen py-20 bg-[#0A0E12] text-[#F4F7FA] flex items-center justify-center">
        <div className="max-w-md mx-auto text-center px-4">
          <HelpCircle className="w-12 h-12 text-[#D9B36C] mx-auto mb-4" />
          <h1 className="font-heading font-extrabold text-2xl text-[#F4F7FA] mb-2">
            Protocolo Setorial Não Localizado
          </h1>
          <p className="text-xs text-[#93A3B5] mb-6">
            O protocolo "{slug}" não consta entre as 15 cadeias produtivas homologadas na plataforma
            Orbis Protocol.
          </p>
          <Link
            to="/solucoes/cadeias-produtivas"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs bg-[#12B886] text-[#0A0E12]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Ver os 15 Protocolos Homologados</span>
          </Link>
        </div>
      </div>
    )
  }

  // Busca outros protocolos recomendados
  const outrosProtocolos = LISTA_PROTOCOLOS_SETORIAIS.filter(
    (p) => p.slug !== protocolo.slug,
  ).slice(0, 3)

  return (
    <div className="min-h-screen py-12 md:py-20 bg-[#0A0E12] text-[#F4F7FA]">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        {/* Breadcrumb Navigation */}
        <div className="mb-8 flex items-center gap-2 text-xs text-[#93A3B5]">
          <Link to="/" className="hover:text-[#12B886] transition-colors">
            Início
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-[#93A3B5]/50" />
          <Link
            to="/solucoes/cadeias-produtivas"
            className="hover:text-[#12B886] transition-colors"
          >
            15 Protocolos Setoriais
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-[#93A3B5]/50" />
          <span className="text-[#12B886] font-semibold">{protocolo.nome}</span>
        </div>

        {/* Hero Section do Protocolo */}
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-[#111820] via-[#16202B] to-[#0D131A] border border-[#12B886]/40 shadow-2xl mb-12 relative overflow-hidden">
          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0A0E12]/80 border border-[#12B886]/50 text-[#12B886] text-xs font-semibold tracking-wider uppercase mb-5">
              <ShieldCheck className="w-4 h-4 text-[#12B886]" />
              PROTOCOLO SETORIAL HOMOLOGADO dMRV
            </div>

            <h1 className="font-heading font-black text-2xl sm:text-4xl md:text-5xl text-[#F4F7FA] tracking-tight mb-4 leading-tight">
              {protocolo.nome}
            </h1>

            <p className="text-base sm:text-lg text-[#D9B36C] font-medium mb-4 leading-relaxed">
              {protocolo.tagline}
            </p>

            <p className="text-xs sm:text-sm text-[#93A3B5] leading-relaxed mb-8 max-w-2xl">
              {protocolo.descricao}
            </p>

            {/* CTAs de Conversão */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <Link
                to="/diagnostico"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider bg-[#12B886] text-[#0A0E12] hover:bg-[#0CA678] transition-all shadow-emerald-glow"
              >
                <span>Iniciar Diagnóstico Deste Setor</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              {isAuthenticated ? (
                <Link
                  to="/painel"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-xs font-semibold border border-[rgba(244,247,250,0.2)] text-[#F4F7FA] hover:border-[#12B886] hover:bg-[#16202B] transition-all"
                >
                  <Building className="w-4 h-4 text-[#12B886]" />
                  <span>Acessar Meu Painel do Cliente</span>
                </Link>
              ) : (
                <Link
                  to="/radar-regulatorio"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-xs font-semibold border border-[rgba(244,247,250,0.2)] text-[#F4F7FA] hover:border-[#12B886] hover:bg-[#16202B] transition-all"
                >
                  <Calendar className="w-4 h-4 text-[#D9B36C]" />
                  <span>Ver Prazos no Radar Regulatório</span>
                </Link>
              )}
            </div>
          </div>

          <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 pointer-events-none flex items-center justify-center">
            <ShieldCheck className="w-96 h-96 text-[#12B886]" />
          </div>
        </div>

        {/* 3 Colunas de Indicadores Principais */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="p-6 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.1)]">
            <span className="text-[10px] uppercase font-mono font-bold text-[#D9B36C] block mb-2">
              REGULAMENTAÇÃO INCIDENTE
            </span>
            <div className="font-heading font-bold text-base text-[#F4F7FA] mb-2">
              {protocolo.regulamentacao}
            </div>
            <p className="text-xs text-[#93A3B5] leading-relaxed">
              Normas mandatórias e voluntárias que orientam a auditoria técnica e a chancela do
              laudo.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.1)]">
            <span className="text-[10px] uppercase font-mono font-bold text-[#12B886] block mb-2">
              FATORES DE EMISSÃO CURADOS
            </span>
            <div className="font-heading font-bold text-base text-[#F4F7FA] mb-2">
              {protocolo.fatorEmissao}
            </div>
            <p className="text-xs text-[#93A3B5] leading-relaxed">
              Bases oficiais aplicadas pelo motor pericial com rastreamento de incerteza Tier 1 /
              Tier 2.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.1)]">
            <span className="text-[10px] uppercase font-mono font-bold text-[#3B82F6] block mb-2">
              TIPO DE LAUDO EMITIDO
            </span>
            <div className="font-heading font-bold text-base text-[#F4F7FA] mb-2">
              {protocolo.tipoLaudo}
            </div>
            <p className="text-xs text-[#93A3B5] leading-relaxed">
              Peça pericial acoplada com ART/RRT de perito e hash imutável SHA-256.
            </p>
          </div>
        </div>

        {/* BLOCO 1: ENQUADRAMENTO LEGAL ESPECÍFICO */}
        <div className="mb-14">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 rounded-xl bg-[#12B886]/10 border border-[#12B886]/30 text-[#12B886]">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-heading font-extrabold text-xl sm:text-2xl text-[#F4F7FA]">
                1. Enquadramento Legal Específico da Cadeia
              </h2>
              <p className="text-xs sm:text-sm text-[#93A3B5]">
                Legislações federais, internacionais e limiares setoriais aplicáveis a este
                segmento.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {protocolo.enquadramentoLegal.map((item, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.08)] hover:border-[#12B886]/40 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="font-mono text-xs font-bold text-[#12B886]">{item.norma}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#16202B] text-[#D9B36C] border border-[#D9B36C]/30">
                      {item.abrangencia}
                    </span>
                  </div>

                  <h3 className="font-heading font-bold text-sm text-[#F4F7FA] mb-2">
                    {item.titulo}
                  </h3>
                  <p className="text-xs text-[#93A3B5] leading-relaxed mb-4">{item.detalhe}</p>
                </div>

                <div className="pt-3 border-t border-[rgba(244,247,250,0.06)] flex items-center justify-between text-[11px]">
                  <span className="text-[#93A3B5]">Data-Chave / Marco:</span>
                  <span className="font-semibold text-[#F4F7FA] font-mono">{item.dataChave}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* BLOCO 2: EVIDÊNCIAS DE CAPTURA EXIGIDAS */}
        <div className="mb-14">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 rounded-xl bg-[#D9B36C]/10 border border-[#D9B36C]/30 text-[#D9B36C]">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-heading font-extrabold text-xl sm:text-2xl text-[#F4F7FA]">
                2. Evidências de Captura Exigidas para o Laudo
              </h2>
              <p className="text-xs sm:text-sm text-[#93A3B5]">
                Documentação fiscal, operacional e ambiental necessária para instrução probatória no
                Orbis Protocol.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {protocolo.evidenciasCaptura.map((cat, idx) => (
              <div
                key={idx}
                className="p-6 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.08)] flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-[#D9B36C]">
                      CATEGORIA {idx + 1}
                    </span>
                    <span
                      className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                        cat.obrigatorio
                          ? 'bg-[#12B886]/20 text-[#12B886] border border-[#12B886]/40'
                          : 'bg-[#16202B] text-[#93A3B5]'
                      }`}
                    >
                      {cat.obrigatorio ? 'Obrigatório' : 'Complementar'}
                    </span>
                  </div>

                  <h3 className="font-heading font-bold text-sm text-[#F4F7FA] mb-4">
                    {cat.categoria}
                  </h3>

                  <ul className="space-y-2.5">
                    {cat.documentos.map((doc, dIdx) => (
                      <li key={dIdx} className="flex items-start gap-2 text-xs text-[#93A3B5]">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#12B886] shrink-0 mt-0.5" />
                        <span className="leading-snug">{doc}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* BLOCO 3: RESULTADO PERICIAL ESPERADO & FATORES PECULIARES */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          {/* Resultado Pericial Esperado */}
          <div className="p-8 rounded-3xl bg-[#111820] border border-[#12B886]/30 space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-[#12B886]/10 text-[#12B886]">
                <FileCheck2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-heading font-extrabold text-lg text-[#F4F7FA]">
                  3. Resultado Pericial Esperado
                </h3>
                <span className="text-xs text-[#93A3B5]">
                  O que a organização recebe no laudo final
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.08)]">
              <span className="text-[10px] font-mono text-[#D9B36C] uppercase block mb-1">
                INTENSIDADE MÉDIA ESPERADA
              </span>
              <span className="font-heading font-bold text-sm text-[#12B886]">
                {protocolo.resultadoPericial.tco2ePorUnidade}
              </span>
            </div>

            <div className="space-y-3">
              <span className="text-xs font-bold text-[#F4F7FA] uppercase tracking-wider block">
                Entregas do Dossiê Pericial:
              </span>
              <ul className="space-y-2">
                {protocolo.resultadoPericial.entregas.map((ent, eIdx) => (
                  <li key={eIdx} className="flex items-start gap-2 text-xs text-[#93A3B5]">
                    <CheckCircle2 className="w-4 h-4 text-[#12B886] shrink-0 mt-0.5" />
                    <span>{ent}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-3 pt-2 border-t border-[rgba(244,247,250,0.08)]">
              <span className="text-xs font-bold text-[#F4F7FA] uppercase tracking-wider block">
                Elegibilidade a Linhas Verdes (Green Capital Engine):
              </span>
              <ul className="space-y-1.5 text-xs text-[#93A3B5]">
                {protocolo.resultadoPericial.elegibilidadeLinhasVerdes.map((lin, lIdx) => (
                  <li key={lIdx} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#D9B36C]" />
                    <span>{lin}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-3 pt-2 border-t border-[rgba(244,247,250,0.08)]">
              <span className="text-xs font-bold text-[#F4F7FA] uppercase tracking-wider block">
                Impacto da Reforma Tributária (IBS / CBS / Seletivo):
              </span>
              <ul className="space-y-1.5 text-xs text-[#93A3B5]">
                {protocolo.resultadoPericial.beneficiosTributarios.map((ben, bIdx) => (
                  <li key={bIdx} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#12B886]" />
                    <span>{ben}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Fatores de Emissão Peculiares da Cadeia */}
          <div className="p-8 rounded-3xl bg-[#111820] border border-[rgba(244,247,250,0.12)] space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-[#3B82F6]/10 text-[#3B82F6]">
                <TrendingDown className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-heading font-extrabold text-lg text-[#F4F7FA]">
                  4. Fatores de Emissão Peculiares do Setor
                </h3>
                <span className="text-xs text-[#93A3B5]">
                  Parâmetros específicos incorporados ao motor dMRV
                </span>
              </div>
            </div>

            <div className="space-y-4">
              {protocolo.fatoresPeculiares.map((fat, fIdx) => (
                <div
                  key={fIdx}
                  className="p-4 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.08)] space-y-2"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#F4F7FA]">{fat.parametro}</span>
                    <span className="font-mono text-[#12B886] font-bold">{fat.fator}</span>
                  </div>
                  <div className="text-[11px] text-[#93A3B5] leading-relaxed">{fat.observacao}</div>
                  <div className="flex items-center justify-between text-[10px] text-[#93A3B5]/80 pt-1 border-t border-[rgba(244,247,250,0.05)]">
                    <span>Fonte: {fat.fonte}</span>
                    <span className="font-mono">Unidade: {fat.unidade}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 rounded-xl bg-[#070A0D] border border-[#12B886]/20 text-xs text-[#93A3B5] leading-relaxed">
              <strong className="text-[#12B886] block mb-1">
                Integração com Documentos Fiscais:
              </strong>
              O motor Orbis dMRV correlaciona automaticamente os códigos NCM e CFOP das notas
              fiscais importadas aos fatores acima, gerando a memória pericial pronta para
              auditoria.
            </div>
          </div>
        </div>

        {/* NAVEGAÇÃO ENTRE OUTROS PROTOCOLOS */}
        <div className="pt-10 border-t border-[rgba(244,247,250,0.1)]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#D9B36C] block">
                EXPLORAR O CATÁLOGO
              </span>
              <h4 className="font-heading font-extrabold text-xl text-[#F4F7FA]">
                Outros Protocolos Homologados
              </h4>
            </div>
            <Link
              to="/solucoes/cadeias-produtivas"
              className="text-xs font-bold text-[#12B886] hover:underline flex items-center gap-1"
            >
              <span>Ver os 15 Protocolos Completos</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {outrosProtocolos.map((p) => (
              <Link
                key={p.slug}
                to={`/protocolos/${p.slug}`}
                className="p-5 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.08)] hover:border-[#12B886] transition-all group"
              >
                <span className="text-[10px] uppercase font-mono text-[#D9B36C] block mb-1">
                  PROTOCOLO SETORIAL
                </span>
                <h5 className="font-heading font-bold text-sm text-[#F4F7FA] group-hover:text-[#12B886] transition-colors mb-1">
                  {p.nome}
                </h5>
                <p className="text-xs text-[#93A3B5] line-clamp-2 leading-relaxed">{p.tagline}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
