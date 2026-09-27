import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { OrbisGlobe } from '@/components/OrbisGlobe'
import { OrbisOrbitalRing, OrbisSectionDivider } from '@/components/OrbisOrbitalRing'
import { PlatformProofScreenshots } from '@/components/PlatformProofScreenshots'
import { NumerosVerificaveisSection } from '@/components/NumerosVerificaveisSection'
import { FormularioOrbisLpf, ModalFormularioOrbisLpf } from '@/components/FormularioOrbisLpf'
import {
  ShieldCheck,
  ArrowRight,
  ChevronRight,
  ExternalLink,
  Sparkles,
  Building2,
  ShoppingCart,
  UserCheck,
  CheckCircle2,
  Cpu,
  Search,
  QrCode,
  Lock,
} from 'lucide-react'

export default function Index() {
  const [modalLpfAberto, setModalLpfAberto] = useState(false)

  const scrollToLpfForm = () => {
    const el = document.getElementById('formulario-leitura-gratuita')
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
    } else {
      setModalLpfAberto(true)
    }
  }

  // Bloco de entrada por papel
  // Rótulos exatos: 'Sou empresa', 'Sou comprador', 'Sou perito', 'Sou cliente ACP'
  const papeisEntrada = [
    {
      rotulo: 'Sou empresa',
      subtitulo: 'Indústrias, manufatura, geradores de emissões e frotas corporativas',
      papelParam: 'empresa',
      targetRole: 'cliente',
      descricao:
        'Diagnóstico SBCE por CNPJ, inventário GHG Escopos 1, 2 e 3 e importação automatizada de SPED/NF-e.',
      beneficio: 'Mitigação de risco regulatório e laudo pericial auditável',
      icon: Building2,
      corBadge: 'bg-[#12B886]/10 text-[#12B886] border border-[#12B886]/30',
      bordaHover: 'hover:border-[#12B886]',
    },
    {
      rotulo: 'Sou comprador',
      subtitulo: 'Grandes corporações, compras sustentáveis e gestores de suprimentos',
      papelParam: 'comprador',
      targetRole: 'cliente',
      descricao:
        'Conferência do Passaporte Digital de Produto dos fornecedores, lastro de reciclagem e relatórios IFRS S1/S2.',
      beneficio: 'Rastreabilidade de Escopo 3 sem risco de greenwashing',
      icon: ShoppingCart,
      corBadge: 'bg-[#12B886]/10 text-[#12B886] border border-[#12B886]/30',
      bordaHover: 'hover:border-[#12B886]',
    },
    {
      rotulo: 'Sou perito',
      subtitulo: 'Engenheiros CREA, contadores CRC e auditores independentes de carbono',
      papelParam: 'perito',
      targetRole: 'perito',
      descricao:
        'Chancela pericial de inventários, validação NBC TO 3000 do CFC e vinculação direta de ART/RRT homologada.',
      beneficio: 'Credenciamento profissional remunerado na rede Orbis',
      icon: UserCheck,
      corBadge: 'bg-[#12B886]/10 text-[#12B886] border border-[#12B886]/30',
      bordaHover: 'hover:border-[#12B886]',
    },
    {
      rotulo: 'Sou cliente ACP',
      subtitulo: 'Empresas associadas à Associação Comercial do Paraná e rede ACP',
      papelParam: 'acp',
      targetRole: 'cliente_acp',
      descricao:
        'Identificador corporativo ORB-ACP-XXXX com entrada direta no Painel ACP / dMRV sem passar pelo funil prévio.',
      beneficio: 'Acesso prioritário a linhas de crédito verde e bureau contínuo',
      icon: Sparkles,
      corBadge: 'bg-[#D9B36C]/10 text-[#D9B36C] border border-[#D9B36C]/30',
      bordaHover: 'hover:border-[#D9B36C]',
    },
  ]

  // 3 Eixos Narrativos
  const eixosNarrativos = [
    {
      id: 'descarbonizacao',
      tag: 'EIXO 1 • DESCARBONIZAÇÃO',
      titulo: 'SBCE, IFRS S1-S2 & dMRV Digital',
      badgeNorma: 'Lei 15.042/2024 • Resolução CVM 244/2026',
      destaque: 'Auditoria digital contínua de carbono (dMRV)',
      itens: [
        'Enquadramento automático nos limiares do SBCE (reporte a partir de 10.000 tCO2e/ano e metas obrigatórias acima de 25.000 tCO2e/ano).',
        'Inventário de GEE nos Escopos 1, 2 e 3 com fatores oficiais de emissão (MCTI, IPCC AR6, SIN) e taxonomia GHG Protocol.',
        'Divulgações de sustentabilidade e clima elaboradas segundo os padrões globais IFRS S1/S2 — hoje de adoção voluntária no Brasil (Resolução CVM 244/2026) e cada vez mais exigidas por bancos, fundos de pensão e seguradoras na concessão de crédito e investimento.',
        'Eliminação do greenwashing por meio de hashes SHA-256 canônicos e chancela de peritos com ART/RRT acoplada.',
      ],
      linkTexto: 'Calcular enquadramento SBCE',
      linkUrl: '/diagnostico',
      corIcon: 'text-[#12B886]',
      bordaCard: 'border-[#12B886]/30',
    },
    {
      id: 'tributaria',
      tag: 'EIXO 2 • CONFORMIDADE TRIBUTÁRIA',
      titulo: 'Lei 15.042/2024 & Programa MOVER',
      badgeNorma: 'Lei 14.902/2024 • Reforma Tributária (EC 132/2023)',
      destaque: 'Enquadramento tributário e previsão do impacto da reforma',
      itens: [
        'Governança fiscal robusta para habilitação aos incentivos fiscais e créditos financeiros do Programa MOVER (Mobilidade Verde e Inovação).',
        'Interoperabilidade com notas fiscais eletrônicas (NF-e/SPED) diretamente da SEFAZ para apuração de créditos e fatores tributários.',
        'Diagnóstico do Imposto Seletivo e futura transição para a CBS/IBS da Reforma Tributária com simulação de impacto financeiro.',
        'Geração de dossiês probatórios defensáveis perante auditorias fiscais, bancos de fomento (BRDE/BNDES) e agências reguladoras.',
      ],
      linkTexto: 'Conhecer dossiê MOVER',
      linkUrl: '/mover',
      corIcon: 'text-[#D9B36C]',
      bordaCard: 'border-[#D9B36C]/30',
    },
    {
      id: 'circularidade',
      tag: 'EIXO 3 • CIRCULARIDADE',
      titulo: 'Decreto 11.413/2023 & Passaporte de Produto',
      badgeNorma: 'Decreto Federal 11.413/2023 • Logística Reversa',
      destaque: 'Lastro probatório e balanço de massa',
      itens: [
        'Comprovação de logística reversa e conformidade com o Decreto 11.413/2023 para frações prioritárias (óleos lubrificantes/OLUC, baterias, pneus e embalagens).',
        'Passaporte Digital de Produto (DPP) peça a peça com QR Code dinâmico e rastreabilidade da baixa do DETRAN até o destinador final.',
        'Emissão formal de Lastro de Circularidade segregado de metais e materiais convencionais, vedando simulações sem comprovação física.',
        'Interoperabilidade com manifestos MTR-SINIR para emissão e homologação de CCRLR junto a entidades gestoras credenciadas.',
      ],
      linkTexto: 'Explorar Passaporte Digital',
      linkUrl: '/passaporte-lote/PR-BX-2026-1240105',
      corIcon: 'text-[#12B886]',
      bordaCard: 'border-[#12B886]/30',
    },
  ]

  return (
    <div className="flex flex-col w-full overflow-x-hidden bg-[#0A0E12] text-[#F4F7FA]">
      {/* 1. HERO SECTION NO ESTILO LINEAR (Minimalismo com acento, dark-first, glow esmeralda/dourado e anel orbital) */}
      <section className="relative overflow-hidden pt-16 pb-24 md:pt-28 md:pb-36 border-b border-[rgba(244,247,250,0.06)]">
        {/* Glow suave e sutil em gradiente verde-esmeralda e dourado champagne sem fotos */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1100px] max-w-full h-[520px] linear-glow-combined pointer-events-none" />
        <div className="absolute top-20 right-10 w-[420px] h-[420px] linear-glow-emerald pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-[400px] h-[300px] linear-glow-gold pointer-events-none" />

        {/* Anel orbital sutil de fundo girando suavemente no centro-direita */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-40">
          <OrbisOrbitalRing size={680} showCore={false} strokeWidth={0.8} glow={false} />
        </div>

        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 relative z-10">
          <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
            {/* Top Pill de Segurança / Eyebrow discreto */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#111820]/90 border border-[rgba(244,247,250,0.12)] text-[#12B886] text-xs font-mono font-semibold tracking-wider uppercase mb-8 shadow-sm backdrop-blur-md">
              <ShieldCheck className="w-3.5 h-3.5 text-[#12B886]" />
              <span>ORBIS PROTOCOL • AUDIT GRADE dMRV</span>
            </div>

            {/* Headline Principal - Hierarquia Linear: curta, pesada, impacto tipográfico */}
            <h1 className="font-heading font-black text-3xl sm:text-5xl md:text-6xl text-[#F4F7FA] tracking-tight leading-[1.08] mb-6">
              INFRAESTRUTURA DE COMPROVAÇÃO E{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#12B886] via-[#27C08C] to-[#D9B36C]">
                RASTREABILIDADE
              </span>
            </h1>

            {/* Sub-headline Linear: pequena, espaçada, elegante */}
            <p className="font-heading text-sm sm:text-base md:text-lg text-[#93A3B5] font-semibold tracking-[0.08em] uppercase mb-8">
              para Descarbonização, Governança Tributária e Circularidade
            </p>

            {/* Descrição em parágrafo */}
            <p className="text-sm sm:text-base md:text-lg text-[#93A3B5] leading-relaxed max-w-2xl mb-10 font-normal">
              A plataforma que transforma notas fiscais e dados operacionais em prova: cálculo da
              pegada de carbono, laudos periciais de descarbonização, conformidade tributária e
              passaportes digitais de produto verificáveis — facilitando o controle da sua empresa,
              com documentos prontos para envio aos órgãos de controle, à sua contabilidade e a
              instituições financeiras.
            </p>

            {/* CTAs do Hero: 1 Primário em destaque + Secundários discretos com elevação suave */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 w-full sm:w-auto">
              {/* CTA Primário Único */}
              <Link
                to="/diagnostico"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-xl text-sm font-bold bg-[#12B886] text-[#0A0E12] hover:bg-[#0CA678] hover:-translate-y-0.5 active:translate-y-0 transition-all shadow-emerald-glow"
              >
                <span>Iniciar Diagnóstico</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              {/* CTAs Secundários Discretos */}
              <a
                href="#eixos-narrativos"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-medium border border-[rgba(244,247,250,0.12)] text-[#93A3B5] hover:text-[#F4F7FA] hover:border-[#12B886]/40 hover:bg-[#111820] hover:-translate-y-0.5 transition-all"
              >
                <span>Conhecer o Protocolo</span>
              </a>

              <Link
                to="/registro"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-medium border border-[rgba(244,247,250,0.12)] text-[#93A3B5] hover:text-[#F4F7FA] hover:border-[#12B886]/40 hover:bg-[#111820] hover:-translate-y-0.5 transition-all"
              >
                <span>Criar conta</span>
              </Link>
            </div>

            {/* Linha discreta "Novo:" logo abaixo dos CTAs do Hero */}
            <div className="mt-5 flex items-center justify-center gap-2 text-xs sm:text-sm text-[#93A3B5]">
              <span className="text-[#D9B36C] font-semibold">Novo:</span>
              <Link
                to="/materiais-criticos"
                className="inline-flex items-center gap-1 text-[#12B886] hover:underline transition-colors"
              >
                <span>Passaporte Digital de Materiais Críticos Recuperados</span>
                <ArrowRight className="w-3.5 h-3.5 inline" />
              </Link>
            </div>

            {/* Emblema/anel orbital Orbis recorrente no Hero girando devagar */}
            <div className="mt-14 sm:mt-16 flex flex-col items-center gap-4">
              <div className="relative flex items-center justify-center">
                {/* Anel orbital em linha fina girando devagar ao redor */}
                <OrbisOrbitalRing
                  size={120}
                  showCore={false}
                  glow={true}
                  strokeWidth={1}
                  className="absolute"
                />
                {/* Globo oficial transparente centralizado */}
                <div className="p-3 rounded-full bg-[#111820]/90 border border-[rgba(244,247,250,0.12)] shadow-2xl relative z-10 hover:border-[#12B886]/50 transition-colors">
                  <OrbisGlobe size={52} />
                </div>
              </div>
              <span className="text-[11px] uppercase tracking-[0.25em] text-[#93A3B5] font-mono font-semibold">
                Auditoria & Rastreabilidade Confiável
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* DIVISOR ORBITAL RECORRENTE ESTILO LINEAR */}
      <OrbisSectionDivider label="dMRV ENGINE" />

      {/* 2. SEÇÃO DE PROVA COM SCREENSHOTS REAIS DA PLATAFORMA (Linear Frame: Central de Radar, Verificador de Selos, Passaporte Digital) */}
      <PlatformProofScreenshots />

      {/* DIVISOR ORBITAL RECORRENTE ESTILO LINEAR */}
      <OrbisSectionDivider label="MÉTRICAS VERIFICÁVEIS" />

      {/* 3. NÚMEROS VERIFICÁVEIS (Máximo de 3 números acima da dobra / estilo Linear com dados reais) */}
      <NumerosVerificaveisSection />

      {/* DIVISOR ORBITAL RECORRENTE ESTILO LINEAR */}
      <OrbisSectionDivider label="ORBIS LPF" />

      {/* 4. SEÇÃO DE DESTAQUE: ORBIS LPF — Leitura Pré-Faturamento */}
      <section
        id="orbis-lpf-destaque"
        className="py-20 md:py-28 bg-[#0D1217] border-y border-[rgba(244,247,250,0.06)] relative overflow-hidden scroll-mt-24"
      >
        <div className="absolute top-0 right-1/4 w-[600px] h-[300px] linear-glow-emerald pointer-events-none" />
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 relative z-10">
          <div className="p-8 sm:p-12 md:p-14 rounded-3xl bg-[#111820] border border-[rgba(244,247,250,0.12)] shadow-2xl relative hover:border-[#12B886]/40 transition-all">
            <div className="max-w-4xl">
              {/* Selo / Eyebrow */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#16202B] border border-[rgba(244,247,250,0.12)] text-[#12B886] text-xs font-mono font-bold tracking-wider uppercase mb-5">
                <span>◆ METODOLOGIA EXCLUSIVA ORBIS</span>
              </div>

              {/* Título e Subtítulo */}
              <h2 className="font-heading font-black text-2xl sm:text-4xl text-[#F4F7FA] tracking-tight mb-2 leading-tight">
                ORBIS LPF — Leitura Pré-Faturamento
              </h2>
              <p className="text-base sm:text-xl font-semibold text-[#12B886] mb-6">
                Auditoria Fiscal de Carbono Pré-Faturamento
              </p>

              {/* Frase de impacto */}
              <div className="p-5 sm:p-6 rounded-2xl bg-[#0A0E12] border-l-2 border-[#12B886] border-[rgba(244,247,250,0.08)] mb-6">
                <p className="font-heading text-lg sm:text-2xl font-bold text-[#F4F7FA] tracking-wide">
                  &ldquo;Sua exportação, precificada em carbono antes de faturar.&rdquo;
                </p>
              </div>

              {/* Corpo de texto institucional */}
              <div className="space-y-4 text-sm sm:text-base text-[#93A3B5] leading-relaxed mb-6 font-normal">
                <p>
                  Hoje, a indústria descobre a intensidade de carbono do seu produto meses depois do
                  embarque — quando a consultoria entrega o inventário, a receita já faturou e o
                  custo aduaneiro já está definido pela pior hipótese: o valor-padrão aplicado na
                  ausência de prova.
                </p>
                <p>
                  O Orbis inverte a ordem. No momento do pedido de venda, calculamos a intensidade
                  de carbono estimada do lote, com o cálculo da pegada de carbono e a âncora
                  probatória em registro criptográfico — entregando um documento verificável, pronto
                  para envio ao importador.
                </p>
                <p className="font-semibold text-[#F4F7FA]">
                  Você negocia com o número na mão. Não meses depois.
                </p>
              </div>

              {/* Linha de público */}
              <div className="p-4 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.08)] mb-4 text-xs sm:text-sm text-[#93A3B5]">
                <strong className="text-[#D9B36C] font-semibold block sm:inline mr-2">
                  Público-alvo:
                </strong>
                <span>
                  Para siderúrgicas, fundições, agroindústrias, desmanches e montadoras com
                  exportação ou exposição a critérios de intensidade de carbono.
                </span>
              </div>

              {/* Estado declarado */}
              <div className="mb-8">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium bg-[#16202B] text-[#93A3B5] border border-[rgba(244,247,250,0.12)]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#D9B36C]" />
                  <span>[Estado: metodologia em estruturação — oferta piloto]</span>
                </span>
              </div>

              {/* CTA primário e microcopy */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex flex-col items-start gap-2">
                  <button
                    type="button"
                    onClick={scrollToLpfForm}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-xl text-sm font-bold bg-[#12B886] text-[#0A0E12] hover:bg-[#0CA678] hover:-translate-y-0.5 transition-all shadow-emerald-glow"
                  >
                    <span>Solicitar primeira leitura gratuita</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <span className="text-xs text-[#93A3B5] pl-1 font-mono">
                    1 leitura por CNPJ. Sem compromisso.
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Formulário integrado da Leitura Gratuita com respiro */}
          <div className="mt-12 sm:mt-16">
            <FormularioOrbisLpf id="formulario-leitura-gratuita" />
          </div>
        </div>
      </section>

      {/* Modal de contingência para formulário */}
      <ModalFormularioOrbisLpf isOpen={modalLpfAberto} onClose={() => setModalLpfAberto(false)} />

      {/* DIVISOR ORBITAL RECORRENTE ESTILO LINEAR */}
      <OrbisSectionDivider label="PORTAIS DE ACESSO" />

      {/* 5. BLOCO DE ENTRADA POR PAPEL (Ícones monocromáticos finos em contêineres discretos) */}
      <section className="py-20 md:py-28 bg-[#0A0E12] relative">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-mono font-semibold uppercase tracking-[0.2em] text-[#D9B36C] block mb-2">
              ACESSO DIRECIONADO
            </span>
            <h2 className="font-heading font-black text-2xl sm:text-4xl text-[#F4F7FA] tracking-tight mb-4">
              COMO VOCÊ SE CONECTA AO ORBIS PROTOCOL?
            </h2>
            <p className="text-sm sm:text-base text-[#93A3B5] leading-relaxed">
              Selecione o seu papel para acessar a plataforma com o fluxo de credenciamento e
              recursos adequados à sua atuação.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {papeisEntrada.map((papel, idx) => {
              const Icon = papel.icon
              const destino = `/registro?papel=${papel.papelParam}`

              return (
                <div
                  key={idx}
                  className={`flex flex-col justify-between p-6 sm:p-7 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.1)] ${papel.bordaHover} hover:bg-[#16202B] transition-all duration-300 hover:-translate-y-1 group`}
                >
                  <div>
                    {/* Contêiner de ícone monocromático fino discreto (Item 4) */}
                    <div className="flex items-center justify-between mb-6">
                      <div className="w-11 h-11 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.1)] flex items-center justify-center text-[#93A3B5] group-hover:text-[#12B886] group-hover:border-[#12B886]/40 transition-all">
                        <Icon className="w-5 h-5 stroke-[1.5]" />
                      </div>
                      <span
                        className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${papel.corBadge}`}
                      >
                        {papel.rotulo}
                      </span>
                    </div>

                    <h3 className="font-heading font-bold text-lg text-[#F4F7FA] mb-1 group-hover:text-[#12B886] transition-colors">
                      {papel.rotulo}
                    </h3>
                    <p className="text-xs font-medium text-[#D9B36C] mb-3">{papel.subtitulo}</p>
                    <p className="text-sm text-[#93A3B5] leading-relaxed mb-5 font-normal">
                      {papel.descricao}
                    </p>

                    <div className="p-3 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.06)] text-xs text-[#93A3B5] mb-6">
                      <span className="text-[#F4F7FA] font-semibold block mb-0.5">
                        Diferencial:
                      </span>
                      {papel.beneficio}
                    </div>
                  </div>

                  <Link
                    to={destino}
                    state={{ papel: papel.papelParam, role: papel.targetRole }}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-bold bg-[#16202B] border border-[rgba(244,247,250,0.12)] text-[#F4F7FA] group-hover:bg-[#12B886] group-hover:text-[#0A0E12] group-hover:border-[#12B886] transition-all"
                  >
                    <span>Entrar como {papel.rotulo}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* DIVISOR ORBITAL RECORRENTE ESTILO LINEAR */}
      <OrbisSectionDivider label="3 EIXOS DE CONFORMIDADE" />

      {/* 6. OS 3 EIXOS NARRATIVOS (Linear Hierarchy: Descarbonização, Tributária, Circularidade) */}
      <section
        id="eixos-narrativos"
        className="py-20 md:py-28 bg-[#0D1217] border-y border-[rgba(244,247,250,0.06)] scroll-mt-24"
      >
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-mono font-semibold uppercase tracking-[0.2em] text-[#12B886] block mb-2">
              ARQUITETURA DE VALOR
            </span>
            <h2 className="font-heading font-black text-2xl sm:text-4xl text-[#F4F7FA] tracking-tight mb-4">
              OS 3 EIXOS NARRATIVOS DO ORBIS PROTOCOL
            </h2>
            <p className="text-sm sm:text-base text-[#93A3B5] leading-relaxed">
              Integração técnica entre compromissos climáticos, incentivos fiscais e rastreio de
              materiais para mitigar riscos e gerar valor financeiro real.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {eixosNarrativos.map((eixo) => (
              <div
                key={eixo.id}
                className={`p-6 sm:p-8 rounded-2xl bg-[#111820] border ${eixo.bordaCard} flex flex-col justify-between hover:border-[rgba(244,247,250,0.3)] transition-all duration-300 hover:-translate-y-1`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#D9B36C]">
                      {eixo.tag}
                    </span>
                  </div>

                  <h3 className="font-heading font-black text-xl sm:text-2xl text-[#F4F7FA] mb-2 leading-tight">
                    {eixo.titulo}
                  </h3>

                  <div className="inline-block px-3 py-1 rounded-lg bg-[#16202B] text-xs font-mono text-[#93A3B5] mb-5 border border-[rgba(244,247,250,0.08)]">
                    {eixo.badgeNorma}
                  </div>

                  <p className="text-xs sm:text-sm font-semibold text-[#12B886] mb-5">
                    {eixo.destaque}
                  </p>

                  <ul className="space-y-3 mb-8">
                    {eixo.itens.map((it, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-xs text-[#93A3B5]">
                        <CheckCircle2 className="w-4 h-4 text-[#12B886] shrink-0 mt-0.5 stroke-[1.5]" />
                        <span className="leading-relaxed">{it}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-4 border-t border-[rgba(244,247,250,0.08)]">
                  <Link
                    to={eixo.linkUrl}
                    className="inline-flex items-center gap-2 text-xs font-bold text-[#12B886] hover:text-[#0CA678] transition-colors"
                  >
                    <span>{eixo.linkTexto}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Bloco Institucional Adicional: Logística Reversa — em estruturação */}
          <div className="mt-10 p-6 sm:p-8 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.12)] hover:border-[#12B886]/40 transition-all duration-300">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-3 max-w-3xl">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#D9B36C]">
                    INFRAESTRUTURA DE PROVA
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-[#16202B] text-[#93A3B5] border border-[rgba(244,247,250,0.15)]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#D9B36C]" />
                    Em estruturação
                  </span>
                </div>

                <h3 className="font-heading font-extrabold text-xl sm:text-2xl text-[#F4F7FA] leading-tight">
                  Logística Reversa — em estruturação
                </h3>

                <p className="text-xs sm:text-sm text-[#93A3B5] leading-relaxed">
                  Estendemos nossa infraestrutura de prova documental à logística reversa (PNRS /
                  Decreto 11.413/2023): rastreabilidade de lotes de material, balanço de massa
                  auditável e documentos prontos para envio a órgãos de controle e entidades
                  gestoras. Na mesma lógica, a infraestrutura Orbis está preparada para dados
                  verificáveis de natureza e biodiversidade, à medida que os padrões IFRS incorporam
                  o tema nas divulgações corporativas.
                </p>
              </div>

              <div className="shrink-0 pt-2 md:pt-0">
                <Link
                  to="/diagnostico"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-xs sm:text-sm font-semibold bg-[#16202B] border border-[rgba(244,247,250,0.2)] text-[#F4F7FA] hover:bg-[#12B886] hover:text-[#0A0E12] hover:border-[#12B886] transition-all"
                >
                  <span>Fale com a equipe</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* DIVISOR ORBITAL RECORRENTE ESTILO LINEAR */}
      <OrbisSectionDivider label="CIRCULARIDADE & DPP" />

      {/* 7. BLOCO DEDICADO DE CIRCULARIDADE COM PROVA CRIPTOGRÁFICA */}
      <section className="py-20 md:py-28 bg-[#0A0E12] relative overflow-hidden">
        <div className="absolute top-1/2 right-0 w-[500px] h-[300px] linear-glow-emerald pointer-events-none" />

        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 relative z-10">
          <div className="p-8 sm:p-12 rounded-3xl bg-[#111820] border border-[rgba(244,247,250,0.12)] shadow-2xl relative overflow-hidden hover:border-[#12B886]/40 transition-all">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7 space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#12B886]/10 border border-[#12B886]/30 text-[#12B886] text-xs font-semibold uppercase tracking-wider">
                  <Cpu className="w-3.5 h-3.5 stroke-[1.5]" />
                  <span>Passaporte Digital de Produto & Lastro de Circularidade</span>
                </div>

                <h2 className="font-heading font-black text-2xl sm:text-3xl md:text-4xl text-[#F4F7FA] leading-tight tracking-tight">
                  CIRCULARIDADE COM PROVA CRIPTOGRÁFICA DE ORIGEM E DESTINAÇÃO
                </h2>

                <p className="text-sm sm:text-base text-[#93A3B5] leading-relaxed">
                  Conectamos a baixa oficial de veículos no DETRAN, balanço de massa, emissões de
                  CO2e evitadas e destinação final homologada no SINIR. Sem declarações corporativas
                  vazias.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="p-3.5 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.08)] flex items-start gap-2.5">
                    <QrCode className="w-4 h-4 text-[#12B886] shrink-0 mt-0.5 stroke-[1.5]" />
                    <div className="text-xs">
                      <span className="font-bold text-[#F4F7FA] block">QR Code Dinâmico</span>
                      <span className="text-[#93A3B5]">
                        Acesso público instantâneo por peça e por lote veicular
                      </span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.08)] flex items-start gap-2.5">
                    <Lock className="w-4 h-4 text-[#D9B36C] shrink-0 mt-0.5 stroke-[1.5]" />
                    <div className="text-xs">
                      <span className="font-bold text-[#F4F7FA] block">Lastro Inviolável</span>
                      <span className="text-[#93A3B5]">
                        Hash SHA-256 canônico gerado sob o Decreto 11.413/2023
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 pt-4">
                  {/* Link direto para Passaporte de Produto */}
                  <Link
                    to="/passaporte-lote/PR-BX-2026-1240105"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-xs sm:text-sm font-bold bg-[#12B886] text-[#0A0E12] hover:bg-[#0CA678] hover:-translate-y-0.5 transition-all shadow-emerald-glow"
                  >
                    <span>Abrir Passaporte de Produto (DPP)</span>
                    <ExternalLink className="w-4 h-4" />
                  </Link>

                  {/* Link direto para Verificador público de selos e lastros */}
                  <Link
                    to="/verificador"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-xs sm:text-sm font-semibold border border-[#D9B36C]/60 text-[#D9B36C] hover:bg-[#D9B36C] hover:text-[#0A0E12] transition-all bg-[#111820]"
                  >
                    <Search className="w-4 h-4 stroke-[1.5]" />
                    <span>Verificador Público de Selos & Lastros</span>
                  </Link>
                </div>
              </div>

              {/* Prévia interativa do Passaporte */}
              <div className="lg:col-span-5">
                <div className="p-5 sm:p-6 rounded-2xl bg-[#0A0E12] border border-[#12B886]/30 shadow-xl space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-[rgba(244,247,250,0.08)]">
                    <span className="text-[11px] font-mono text-[#12B886] font-bold">
                      DEMO OPERACIONAL • CDVERDE
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-[#12B886]/20 text-[#12B886] font-mono">
                      DECRETO 11.413
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="text-xs text-[#93A3B5]">Lote de Desmontagem Veicular:</div>
                    <div className="font-heading font-bold text-sm text-[#F4F7FA]">
                      Renault Clio Authentique 1.0 16V Hi-Flex
                    </div>
                    <div className="text-[11px] font-mono text-[#D9B36C]">
                      Baixa DETRAN: PR-BX-2026-1240105
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <div className="p-2.5 rounded-lg bg-[#16202B] text-center">
                      <span className="text-[10px] text-[#93A3B5] uppercase block">
                        CO2e Evitado
                      </span>
                      <span className="font-heading font-black text-sm text-[#12B886]">
                        1.584,81 kg
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-[#16202B] text-center">
                      <span className="text-[10px] text-[#93A3B5] uppercase block">
                        Peças Rastreáveis
                      </span>
                      <span className="font-heading font-black text-sm text-[#F4F7FA]">
                        49 componentes
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 text-[11px] text-[#93A3B5] flex items-center justify-between">
                    <Link
                      to="/solucoes/case-cdverde"
                      className="text-[#12B886] hover:underline inline-flex items-center gap-1"
                    >
                      <span>Ler estudo de caso completo</span>
                      <ChevronRight className="w-3 h-3" />
                    </Link>
                    <Link to="/verificador" className="text-[#D9B36C] hover:underline">
                      Auditar hash →
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Card de Materiais Críticos Recuperados */}
            <div className="mt-8 pt-8 border-t border-[rgba(244,247,250,0.08)]">
              <div className="p-6 sm:p-7 rounded-2xl bg-[#0A0E12] border border-[#D9B36C]/40 hover:border-[#12B886] transition-all flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2 max-w-3xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-mono font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-[#16202B] text-[#D9B36C] border border-[#D9B36C]/30">
                      MINERAÇÃO URBANA & REEE
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-[#16202B] text-[#12B886] border border-[#12B886]/30">
                      <Sparkles className="w-3 h-3 text-[#12B886] stroke-[1.5]" />
                      Passaporte DCP
                    </span>
                  </div>

                  <h3 className="font-heading font-bold text-xl text-[#F4F7FA]">
                    Materiais Críticos Recuperados
                  </h3>

                  <p className="text-xs sm:text-sm text-[#93A3B5] leading-relaxed">
                    Prova de origem urbana para terras raras, metais nobres e cobre recuperados de
                    e-waste e veículos.
                  </p>
                </div>

                <div className="shrink-0">
                  <Link
                    to="/materiais-criticos"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs sm:text-sm font-bold bg-[#16202B] border border-[#D9B36C]/50 text-[#D9B36C] hover:bg-[#D9B36C] hover:text-[#0A0E12] transition-all"
                  >
                    <span>Acessar Passaporte DCP</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. SECTION: CTA FINAL COM ANEL ORBITAL NO ESTILO LINEAR */}
      <section className="py-20 md:py-28 relative overflow-hidden bg-[#070A0D] border-t border-[rgba(244,247,250,0.08)]">
        {/* Glow suave e anel orbital no CTA final (Item 3) */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-30">
          <OrbisOrbitalRing size={520} showCore={false} glow={true} strokeWidth={0.8} />
        </div>

        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 relative z-10">
          <div className="p-8 sm:p-14 rounded-3xl bg-gradient-to-r from-[#111820] via-[#16202B] to-[#111820] border border-[rgba(244,247,250,0.12)] relative overflow-hidden flex flex-col lg:flex-row items-center justify-between gap-8 shadow-2xl hover:border-[#12B886]/40 transition-colors">
            <div className="max-w-2xl space-y-3">
              <span className="text-xs font-mono font-bold uppercase tracking-[0.2em] text-[#12B886] block">
                AUDITORIA INSTANTÂNEA
              </span>
              <h2 className="font-heading font-black text-2xl sm:text-3xl md:text-4xl text-[#F4F7FA] tracking-tight">
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
                className="w-full sm:w-auto text-center px-7 py-3.5 rounded-xl text-sm font-bold bg-[#12B886] text-[#0A0E12] hover:bg-[#0CA678] hover:-translate-y-0.5 transition-all shadow-emerald-glow"
              >
                Iniciar Diagnóstico
              </Link>
              <Link
                to="/registro"
                className="w-full sm:w-auto text-center px-6 py-3.5 rounded-xl text-sm font-semibold bg-[#16202B] border border-[#12B886]/50 text-[#12B886] hover:bg-[#12B886] hover:text-[#0A0E12] hover:-translate-y-0.5 transition-all"
              >
                Criar Conta
              </Link>
              <Link
                to="/verificador"
                className="w-full sm:w-auto text-center px-5 py-3.5 rounded-xl text-sm font-semibold border border-[rgba(244,247,250,0.15)] text-[#93A3B5] hover:border-[#D9B36C] hover:text-[#D9B36C] hover:-translate-y-0.5 transition-all"
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
