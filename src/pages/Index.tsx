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
      corBadge:
        'bg-emerald-50 dark:bg-[#059669]/15 text-[#059669] border border-emerald-200 dark:border-[#059669]/40',
      bordaHover: 'hover:border-[#059669]',
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
      corBadge:
        'bg-emerald-50 dark:bg-[#059669]/15 text-[#059669] border border-emerald-200 dark:border-[#059669]/40',
      bordaHover: 'hover:border-[#059669]',
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
      corBadge:
        'bg-emerald-50 dark:bg-[#059669]/15 text-[#059669] border border-emerald-200 dark:border-[#059669]/40',
      bordaHover: 'hover:border-[#059669]',
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
      corIcon: 'text-[#059669]',
      bordaCard: 'border-[#059669]/30',
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
      corIcon: 'text-[#059669]',
      bordaCard: 'border-[#059669]/30',
    },
  ]

  return (
    <div className="flex flex-col w-full overflow-x-hidden bg-background text-foreground">
      {/* 1. HERO SECTION REDESENHADO: fundo slate-50, título grafite forte, um único acento esmeralda, globo Orbis em traço fino (estética B3 / Bloomberg ESG) */}
      <section className="relative overflow-hidden pt-16 pb-24 md:pt-28 md:pb-36 bg-slate-50 dark:bg-[#0A1628] border-b border-slate-200/80 dark:border-slate-800/80">
        {/* Glow suave e sutil no modo escuro */}
        <div className="hidden dark:block absolute top-0 left-1/2 -translate-x-1/2 w-[1100px] max-w-full h-[520px] linear-glow-combined pointer-events-none opacity-85" />
        <div className="hidden dark:block absolute top-20 right-10 w-[420px] h-[420px] linear-glow-emerald pointer-events-none opacity-70" />
        <div className="hidden dark:block absolute bottom-0 left-10 w-[400px] h-[300px] linear-glow-gold pointer-events-none opacity-60" />

        {/* Gradiente sutil corporativo no modo claro */}
        <div className="dark:hidden absolute inset-0 bg-radial from-emerald-500/5 via-transparent to-transparent pointer-events-none" />

        {/* Anel orbital sutil de fundo girando suavemente no centro-direita */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-30 dark:opacity-40">
          <OrbisOrbitalRing size={680} showCore={false} strokeWidth={0.8} glow={false} />
        </div>

        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 relative z-10">
          <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
            {/* Eyebrow rebaixado na hierarquia com pill de segurança */}
            <div className="inline-flex items-center gap-2 px-3 sm:px-3.5 py-1.5 rounded-full bg-white dark:bg-[#0E1A2E]/90 border border-slate-200 dark:border-slate-800 text-emerald-700 dark:text-[#059669] text-[10px] sm:text-xs font-mono font-semibold tracking-normal sm:tracking-wider uppercase mb-6 shadow-xs backdrop-blur-md max-w-full">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-[#059669] shrink-0" />
              <span className="whitespace-normal text-center break-words">
                INFRAESTRUTURA DE COMPROVAÇÃO E RASTREABILIDADE
              </span>
            </div>

            {/* Headline Principal: Título grafite forte slate-900 com acento esmeralda corporativo */}
            <h1 className="font-heading font-black text-[1.65rem] xs:text-2xl sm:text-5xl md:text-6xl text-slate-900 dark:text-[#F8FAFC] tracking-tight leading-[1.12] sm:leading-[1.08] mb-6 max-w-4xl w-full break-words [overflow-wrap:anywhere]">
              Lemos cada nota fiscal da sua cadeia e geramos a{' '}
              <span className="text-emerald-600 dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-r dark:from-[#059669] dark:via-[#2563EB] dark:to-[#D9B36C] break-words [overflow-wrap:anywhere]">
                prova de descarbonização
              </span>
            </h1>

            {/* Sub-headline Linear: pequena, espaçada, elegante */}
            <p className="font-heading text-sm sm:text-base md:text-lg text-slate-600 dark:text-[#94A3B8] font-semibold tracking-[0.08em] uppercase mb-8">
              Prova documental da economia circular para descarbonização verificável e conformidade
              regulatória (Lei 15.042/2024, SBCE)
            </p>

            {/* Descrição em parágrafo */}
            <p className="text-sm sm:text-base md:text-lg text-slate-600 dark:text-[#94A3B8] leading-relaxed max-w-2xl mb-10 font-normal">
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
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-xl text-sm font-bold bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-[#2563EB] dark:text-white dark:hover:bg-blue-600 hover:-translate-y-0.5 active:translate-y-0 transition-all shadow-md dark:shadow-sm"
              >
                <span>Iniciar Diagnóstico</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              {/* CTAs Secundários Discretos */}
              <a
                href="#eixos-narrativos"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-medium border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-[#F8FAFC] hover:border-emerald-500/40 dark:hover:border-[#2563EB]/40 hover:bg-white dark:hover:bg-[#0E1A2E] hover:-translate-y-0.5 transition-all bg-white/80 dark:bg-transparent"
              >
                <span>Conhecer o Protocolo</span>
              </a>

              <Link
                to="/registro"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-medium border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-[#F8FAFC] hover:border-emerald-500/40 dark:hover:border-[#2563EB]/40 hover:bg-white dark:hover:bg-[#0E1A2E] hover:-translate-y-0.5 transition-all bg-white/80 dark:bg-transparent"
              >
                <span>Criar conta</span>
              </Link>
            </div>

            {/* Proposta de Comercialização: Trial 15 dias sem cartão com 5 notas */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs sm:text-sm text-slate-600 dark:text-[#94A3B8] max-w-2xl">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-[#059669]/15 border border-emerald-200 dark:border-[#059669]/40 text-emerald-800 dark:text-[#10B981] font-semibold text-xs">
                <span>✦ Trial de 15 dias sem cartão</span>
                <span className="opacity-60">•</span>
                <span>Limite de 5 notas iniciais</span>
              </span>
              <span className="text-slate-500 dark:text-[#94A3B8]">
                Pegada de carbono como produto central + situação tributária da empresa em relação à
                reforma tributária.
              </span>
            </div>

            {/* Emblema/globo Orbis em traço fino */}
            <div className="mt-14 sm:mt-16 flex flex-col items-center gap-4">
              <div className="relative flex items-center justify-center">
                {/* Anel orbital em linha fina girando devagar ao redor */}
                <OrbisOrbitalRing
                  size={120}
                  showCore={false}
                  glow={false}
                  strokeWidth={0.8}
                  className="absolute"
                />
                {/* Globo oficial com traço refinado */}
                <div className="p-3 rounded-full bg-white dark:bg-[#0E1A2E]/90 border border-slate-200 dark:border-slate-800 shadow-md dark:shadow-2xl relative z-10 hover:border-emerald-500/50 dark:hover:border-[#059669]/50 transition-colors">
                  <OrbisGlobe size={52} />
                </div>
              </div>
              <span className="text-[11px] uppercase tracking-[0.25em] text-slate-500 dark:text-[#94A3B8] font-mono font-semibold">
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
        className="py-20 md:py-28 bg-slate-50 dark:bg-gradient-to-b dark:from-[#0A1628] dark:via-[#0E1A2E] dark:to-[#0A1628] border-y border-slate-200/80 dark:border-slate-800/80 relative overflow-hidden scroll-mt-24"
      >
        <div className="hidden dark:block absolute top-0 right-1/4 w-[600px] h-[300px] linear-glow-emerald pointer-events-none opacity-70" />
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 relative z-10">
          <div className="p-8 sm:p-12 md:p-14 rounded-3xl bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-2xl relative hover:border-emerald-600/40 dark:hover:border-[#059669]/40 transition-all">
            <div className="max-w-4xl">
              {/* Selo / Eyebrow */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 dark:bg-[#111827] border border-emerald-200 dark:border-slate-800 text-emerald-800 dark:text-[#059669] text-xs font-mono font-bold tracking-wider uppercase mb-5">
                <span>◆ METODOLOGIA EXCLUSIVA ORBIS</span>
              </div>

              {/* Título e Subtítulo */}
              <h2 className="font-heading font-black text-2xl sm:text-4xl text-slate-900 dark:text-[#F8FAFC] tracking-tight mb-2 leading-tight">
                ORBIS LPF — Leitura Pré-Faturamento
              </h2>
              <p className="text-base sm:text-xl font-semibold text-emerald-700 dark:text-[#059669] mb-6">
                Auditoria Fiscal de Carbono Pré-Faturamento
              </p>

              {/* Frase de impacto */}
              <div className="p-5 sm:p-6 rounded-2xl bg-slate-50 dark:bg-[#0A1628] border-l-2 border-emerald-600 dark:border-[#059669] border-slate-200 dark:border-slate-800 mb-6">
                <p className="font-heading text-lg sm:text-2xl font-bold text-slate-900 dark:text-[#F8FAFC] tracking-wide">
                  &ldquo;Sua exportação, precificada em carbono antes de faturar.&rdquo;
                </p>
              </div>

              {/* Corpo de texto institucional */}
              <div className="space-y-4 text-sm sm:text-base text-slate-600 dark:text-[#94A3B8] leading-relaxed mb-6 font-normal">
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
                <p className="font-semibold text-slate-900 dark:text-[#F8FAFC]">
                  Você negocia com o número na mão. Não meses depois.
                </p>
              </div>

              {/* Linha de público */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0A1628] border border-slate-200 dark:border-slate-800 mb-4 text-xs sm:text-sm text-slate-600 dark:text-[#94A3B8]">
                <strong className="text-amber-700 dark:text-[#D9B36C] font-semibold block sm:inline mr-2">
                  Público-alvo:
                </strong>
                <span>
                  Para siderúrgicas, fundições, agroindústrias, desmanches e montadoras com
                  exportação ou exposição a critérios de intensidade de carbono.
                </span>
              </div>

              {/* Estado declarado */}
              <div className="mb-8">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium bg-slate-100 dark:bg-[#111827] text-slate-600 dark:text-[#94A3B8] border border-slate-200 dark:border-slate-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 dark:bg-[#D9B36C]" />
                  <span>[Estado: metodologia em estruturação — oferta piloto]</span>
                </span>
              </div>

              {/* CTA primário e microcopy */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex flex-col items-start gap-2">
                  <button
                    type="button"
                    onClick={scrollToLpfForm}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-xl text-sm font-bold bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-[#2563EB] dark:text-white dark:hover:bg-blue-600 hover:-translate-y-0.5 transition-all shadow-sm"
                  >
                    <span>Solicitar primeira leitura gratuita</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <span className="text-xs text-slate-500 dark:text-[#94A3B8] pl-1 font-mono">
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
      <section className="py-20 md:py-28 bg-white dark:bg-[#0A1628] relative">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-mono font-semibold uppercase tracking-[0.2em] text-amber-700 dark:text-[#D9B36C] block mb-2">
              ACESSO DIRECIONADO
            </span>
            <h2 className="font-heading font-black text-2xl sm:text-4xl text-slate-900 dark:text-[#F8FAFC] tracking-tight mb-4">
              COMO VOCÊ SE CONECTA AO ORBIS PROTOCOL?
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-[#94A3B8] leading-relaxed">
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
                  className={`flex flex-col justify-between p-6 sm:p-7 rounded-2xl bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md ${papel.bordaHover} hover:bg-slate-50 dark:hover:bg-[#111827] transition-all duration-300 hover:-translate-y-1 group`}
                >
                  <div>
                    {/* Contêiner de ícone monocromático fino discreto (Item 4) */}
                    <div className="flex items-center justify-between mb-6">
                      <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-[#0A1628] border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-600 dark:text-[#94A3B8] group-hover:text-emerald-600 dark:group-hover:text-[#059669] group-hover:border-emerald-500/40 dark:group-hover:border-[#059669]/40 transition-all">
                        <Icon className="w-5 h-5 stroke-[1.5]" />
                      </div>
                      <span
                        className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${papel.corBadge}`}
                      >
                        {papel.rotulo}
                      </span>
                    </div>

                    <h3 className="font-heading font-bold text-lg text-slate-900 dark:text-[#F8FAFC] mb-1 group-hover:text-emerald-600 dark:group-hover:text-[#059669] transition-colors">
                      {papel.rotulo}
                    </h3>
                    <p className="text-xs font-medium text-amber-700 dark:text-[#D9B36C] mb-3">
                      {papel.subtitulo}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-[#94A3B8] leading-relaxed mb-5 font-normal">
                      {papel.descricao}
                    </p>

                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0A1628] border border-slate-200/80 dark:border-slate-800 text-xs text-slate-600 dark:text-[#94A3B8] mb-6">
                      <span className="text-slate-900 dark:text-[#F8FAFC] font-semibold block mb-0.5">
                        Diferencial:
                      </span>
                      {papel.beneficio}
                    </div>
                  </div>

                  <Link
                    to={destino}
                    state={{ papel: papel.papelParam, role: papel.targetRole }}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-bold bg-slate-100 dark:bg-[#111827] border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-[#F8FAFC] group-hover:bg-emerald-600 group-hover:text-white dark:group-hover:bg-[#2563EB] dark:group-hover:text-white group-hover:border-emerald-600 dark:group-hover:border-[#2563EB] transition-all"
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
        className="py-20 md:py-28 bg-slate-50 dark:bg-gradient-to-b dark:from-[#0A1628] dark:via-[#0E1A2E] dark:to-[#0A1628] border-y border-slate-200/80 dark:border-slate-800/80 scroll-mt-24"
      >
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-mono font-semibold uppercase tracking-[0.2em] text-emerald-700 dark:text-[#059669] block mb-2">
              ARQUITETURA DE VALOR
            </span>
            <h2 className="font-heading font-black text-2xl sm:text-4xl text-slate-900 dark:text-[#F8FAFC] tracking-tight mb-4">
              OS 3 EIXOS NARRATIVOS DO ORBIS PROTOCOL
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-[#94A3B8] leading-relaxed">
              Integração técnica entre compromissos climáticos, incentivos fiscais e rastreio de
              materiais para mitigar riscos e gerar valor financeiro real.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {eixosNarrativos.map((eixo) => (
              <div
                key={eixo.id}
                className={`p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#0E1A2E] border ${eixo.bordaCard} flex flex-col justify-between shadow-xs hover:shadow-md dark:shadow-none hover:border-slate-400 dark:hover:border-slate-700 transition-all duration-300 hover:-translate-y-1`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-amber-700 dark:text-[#D9B36C]">
                      {eixo.tag}
                    </span>
                  </div>

                  <h3 className="font-heading font-black text-xl sm:text-2xl text-slate-900 dark:text-[#F8FAFC] mb-2 leading-tight">
                    {eixo.titulo}
                  </h3>

                  <div className="inline-block px-3 py-1 rounded-lg bg-slate-100 dark:bg-[#111827] text-xs font-mono text-slate-600 dark:text-[#94A3B8] mb-5 border border-slate-200 dark:border-slate-800">
                    {eixo.badgeNorma}
                  </div>

                  <p className="text-xs sm:text-sm font-semibold text-emerald-700 dark:text-[#059669] mb-5">
                    {eixo.destaque}
                  </p>

                  <ul className="space-y-3 mb-8">
                    {eixo.itens.map((it, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2.5 text-xs text-slate-600 dark:text-[#94A3B8]"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-[#059669] shrink-0 mt-0.5 stroke-[1.5]" />
                        <span className="leading-relaxed">{it}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                  <Link
                    to={eixo.linkUrl}
                    className="inline-flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-[#059669] hover:text-emerald-800 dark:hover:text-[#059669]/80 transition-colors"
                  >
                    <span>{eixo.linkTexto}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Bloco Institucional Adicional: Logística Reversa — em estruturação */}
          <div className="mt-10 p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-slate-800 shadow-xs hover:border-emerald-500/40 dark:hover:border-[#059669]/40 transition-all duration-300">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-3 max-w-3xl">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-amber-700 dark:text-[#D9B36C]">
                    INFRAESTRUTURA DE PROVA
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-slate-100 dark:bg-[#111827] text-slate-600 dark:text-[#94A3B8] border border-slate-200 dark:border-slate-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 dark:bg-[#D9B36C]" />
                    Em estruturação
                  </span>
                </div>

                <h3 className="font-heading font-extrabold text-xl sm:text-2xl text-slate-900 dark:text-[#F8FAFC] leading-tight">
                  Logística Reversa — em estruturação
                </h3>

                <p className="text-xs sm:text-sm text-slate-600 dark:text-[#94A3B8] leading-relaxed">
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
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-xs sm:text-sm font-semibold bg-slate-100 dark:bg-[#111827] border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-[#F8FAFC] hover:bg-emerald-600 hover:text-white dark:hover:bg-[#2563EB] dark:hover:text-white hover:border-emerald-600 dark:hover:border-[#2563EB] transition-all"
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
      <section className="py-20 md:py-28 bg-white dark:bg-[#0A1628] relative overflow-hidden">
        <div className="hidden dark:block absolute top-1/2 right-0 w-[500px] h-[300px] linear-glow-emerald pointer-events-none" />

        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 relative z-10">
          <div className="p-8 sm:p-12 rounded-3xl bg-slate-50 dark:bg-[#0E1A2E] border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-2xl relative overflow-hidden hover:border-emerald-600/40 dark:hover:border-[#059669]/40 transition-all">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7 space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-[#059669]/10 border border-emerald-200 dark:border-[#059669]/30 text-emerald-700 dark:text-[#059669] text-xs font-semibold uppercase tracking-wider">
                  <Cpu className="w-3.5 h-3.5 stroke-[1.5]" />
                  <span>Passaporte Digital de Produto & Lastro de Circularidade</span>
                </div>

                <h2 className="font-heading font-black text-2xl sm:text-3xl md:text-4xl text-slate-900 dark:text-[#F8FAFC] leading-tight tracking-tight">
                  CIRCULARIDADE COM PROVA CRIPTOGRÁFICA DE ORIGEM E DESTINAÇÃO
                </h2>

                <p className="text-sm sm:text-base text-slate-600 dark:text-[#94A3B8] leading-relaxed">
                  Conectamos a baixa oficial de veículos no DETRAN, balanço de massa, emissões de
                  CO2e evitadas e destinação final em integração com o SINIR. Sem declarações
                  corporativas vazias.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="p-3.5 rounded-xl bg-white dark:bg-[#0A1628] border border-slate-200 dark:border-slate-800 flex items-start gap-2.5 shadow-xs">
                    <QrCode className="w-4 h-4 text-emerald-600 dark:text-[#059669] shrink-0 mt-0.5 stroke-[1.5]" />
                    <div className="text-xs">
                      <span className="font-bold text-slate-900 dark:text-[#F8FAFC] block">
                        QR Code Dinâmico
                      </span>
                      <span className="text-slate-600 dark:text-[#94A3B8]">
                        Acesso público instantâneo por peça e por lote veicular
                      </span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white dark:bg-[#0A1628] border border-slate-200 dark:border-slate-800 flex items-start gap-2.5 shadow-xs">
                    <Lock className="w-4 h-4 text-amber-600 dark:text-[#D9B36C] shrink-0 mt-0.5 stroke-[1.5]" />
                    <div className="text-xs">
                      <span className="font-bold text-slate-900 dark:text-[#F8FAFC] block">
                        Lastro Inviolável
                      </span>
                      <span className="text-slate-600 dark:text-[#94A3B8]">
                        Hash SHA-256 canônico gerado sob o Decreto 11.413/2023
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 pt-4">
                  {/* Link direto para Passaporte de Produto */}
                  <Link
                    to="/passaporte-lote/PR-BX-2026-1240105"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-xs sm:text-sm font-bold bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-[#2563EB] dark:text-white dark:hover:bg-blue-600 hover:-translate-y-0.5 transition-all shadow-sm"
                  >
                    <span>Abrir Passaporte de Produto (DPP)</span>
                    <ExternalLink className="w-4 h-4" />
                  </Link>

                  {/* Link direto para Verificador público de selos e lastros */}
                  <Link
                    to="/verificador"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-xs sm:text-sm font-semibold border border-amber-300 dark:border-[#D9B36C]/60 text-amber-700 dark:text-[#D9B36C] hover:bg-amber-600 hover:text-white dark:hover:bg-[#D9B36C] dark:hover:text-[#0A1628] transition-all bg-white dark:bg-[#0E1A2E]"
                  >
                    <Search className="w-4 h-4 stroke-[1.5]" />
                    <span>Verificador Público de Selos & Lastros</span>
                  </Link>
                </div>
              </div>

              {/* Prévia interativa do Passaporte */}
              <div className="lg:col-span-5">
                <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#0A1628] border border-emerald-300 dark:border-[#059669]/30 shadow-md dark:shadow-xl space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-[11px] font-mono text-emerald-700 dark:text-[#059669] font-bold">
                      DEMO OPERACIONAL • CDVERDE
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 dark:bg-[#059669]/20 text-emerald-800 dark:text-[#059669] font-mono">
                      DECRETO 11.413
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="text-xs text-slate-500 dark:text-[#94A3B8]">
                      Lote de Desmontagem Veicular:
                    </div>
                    <div className="font-heading font-bold text-sm text-slate-900 dark:text-[#F8FAFC]">
                      Renault Clio Authentique 1.0 16V Hi-Flex
                    </div>
                    <div className="text-[11px] font-mono text-amber-700 dark:text-[#D9B36C]">
                      Baixa DETRAN: PR-BX-2026-1240105
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#111827] text-center border border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] text-slate-500 dark:text-[#94A3B8] uppercase block">
                        CO2e Evitado
                      </span>
                      <span className="font-heading font-black text-sm text-emerald-700 dark:text-[#059669]">
                        1.584,81 kg
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#111827] text-center border border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] text-slate-500 dark:text-[#94A3B8] uppercase block">
                        Peças Rastreáveis
                      </span>
                      <span className="font-heading font-black text-sm text-slate-900 dark:text-[#F8FAFC]">
                        49 componentes
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 text-[11px] text-slate-500 dark:text-[#94A3B8] flex items-center justify-between">
                    <Link
                      to="/solucoes/case-cdverde"
                      className="text-emerald-700 dark:text-[#059669] hover:underline inline-flex items-center gap-1"
                    >
                      <span>Ler estudo de caso completo</span>
                      <ChevronRight className="w-3 h-3" />
                    </Link>
                    <Link
                      to="/verificador"
                      className="text-amber-700 dark:text-[#D9B36C] hover:underline"
                    >
                      Auditar hash →
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Card de Materiais Críticos Recuperados */}
            <div className="mt-8 pt-8 border-t border-slate-200 dark:border-slate-800">
              <div className="p-6 sm:p-7 rounded-2xl bg-white dark:bg-[#0A1628] border border-amber-300 dark:border-[#D9B36C]/40 hover:border-emerald-500 dark:hover:border-[#059669] transition-all flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xs">
                <div className="space-y-2 max-w-3xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-mono font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-amber-50 dark:bg-[#111827] text-amber-700 dark:text-[#D9B36C] border border-amber-200 dark:border-[#D9B36C]/30">
                      MINERAÇÃO URBANA & REEE
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-50 dark:bg-[#111827] text-emerald-700 dark:text-[#059669] border border-emerald-200 dark:border-[#059669]/30">
                      <Sparkles className="w-3 h-3 text-emerald-600 dark:text-[#059669] stroke-[1.5]" />
                      Passaporte DCP
                    </span>
                  </div>

                  <h3 className="font-heading font-bold text-xl text-slate-900 dark:text-[#F8FAFC]">
                    Materiais Críticos Recuperados
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-600 dark:text-[#94A3B8] leading-relaxed">
                    Prova de origem urbana para terras raras, metais nobres e cobre recuperados de
                    e-waste e veículos.
                  </p>
                </div>

                <div className="shrink-0">
                  <Link
                    to="/materiais-criticos"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs sm:text-sm font-bold bg-slate-100 dark:bg-[#111827] border border-slate-200 dark:border-[#D9B36C]/50 text-slate-800 dark:text-[#D9B36C] hover:bg-emerald-600 hover:text-white dark:hover:bg-[#D9B36C] dark:hover:text-[#0A1628] transition-all"
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
      <section className="py-20 md:py-28 relative overflow-hidden bg-slate-50 dark:bg-gradient-to-b dark:from-[#0A1628] dark:via-[#0E1A2E] dark:to-[#0A1628] border-t border-slate-200/80 dark:border-slate-800/80">
        {/* Glow suave e anel orbital no CTA final (Item 3) */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-20 dark:opacity-30">
          <OrbisOrbitalRing size={520} showCore={false} glow={false} strokeWidth={0.8} />
        </div>

        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 relative z-10">
          <div className="p-8 sm:p-14 rounded-3xl bg-white dark:bg-gradient-to-r dark:from-[#0E1A2E] dark:via-[#111827] dark:to-[#0E1A2E] border border-slate-200 dark:border-slate-800 relative overflow-hidden flex flex-col lg:flex-row items-center justify-between gap-8 shadow-sm dark:shadow-2xl hover:border-emerald-500/40 dark:hover:border-[#059669]/40 transition-colors">
            <div className="max-w-2xl space-y-3">
              <span className="text-xs font-mono font-bold uppercase tracking-[0.2em] text-emerald-700 dark:text-[#059669] block">
                AUDITORIA INSTANTÂNEA
              </span>
              <h2 className="font-heading font-black text-2xl sm:text-3xl md:text-4xl text-slate-900 dark:text-[#F8FAFC] tracking-tight">
                PRONTO PARA AUDITAR E CERTIFICAR SEU CNPJ?
              </h2>
              <p className="text-sm sm:text-base text-slate-600 dark:text-[#94A3B8] leading-relaxed">
                Inicie o diagnóstico em 4 etapas, teste com nossos modelos pré-carregados e
                visualize sua qualificação ambiental, tributária e emissão do Atestado Orbis (com
                ART/RRT).
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0 w-full lg:w-auto">
              <Link
                to="/diagnostico"
                className="w-full sm:w-auto text-center px-7 py-3.5 rounded-xl text-sm font-bold bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-[#2563EB] dark:text-white dark:hover:bg-blue-600 hover:-translate-y-0.5 transition-all shadow-sm"
              >
                Iniciar Diagnóstico
              </Link>
              <Link
                to="/registro"
                className="w-full sm:w-auto text-center px-6 py-3.5 rounded-xl text-sm font-semibold bg-slate-100 dark:bg-[#111827] border border-slate-200 dark:border-[#2563EB]/50 text-slate-800 dark:text-[#F8FAFC] hover:bg-emerald-600 hover:text-white dark:hover:bg-[#2563EB] dark:hover:text-white hover:-translate-y-0.5 transition-all"
              >
                Criar Conta
              </Link>
              <Link
                to="/verificador"
                className="w-full sm:w-auto text-center px-5 py-3.5 rounded-xl text-sm font-semibold border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-[#94A3B8] hover:border-amber-500 hover:text-amber-700 dark:hover:border-[#D9B36C] dark:hover:text-[#D9B36C] hover:-translate-y-0.5 transition-all"
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
