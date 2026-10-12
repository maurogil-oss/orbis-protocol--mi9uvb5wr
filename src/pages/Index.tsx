import React from 'react'
import { Link } from 'react-router-dom'
import { OrbisOrbitalRing, OrbisSectionDivider } from '@/components/OrbisOrbitalRing'
import { CardAtestadoHero } from '@/components/CardAtestadoHero'
import { SecaoComoFuncionaEtapas } from '@/components/SecaoComoFuncionaEtapas'
import { PlatformProofScreenshots } from '@/components/PlatformProofScreenshots'
import { NumerosVerificaveisSection } from '@/components/NumerosVerificaveisSection'
import { FormularioOrbisLpf } from '@/components/FormularioOrbisLpf'
import { SecaoPerfilAbas } from '@/components/SecaoPerfilAbas'
import { ListaRegulatoriaFixa } from '@/components/ListaRegulatoriaFixa'
import { ArrowRight, CheckCircle2, ChevronRight, Layers } from 'lucide-react'
import { useSeo } from '@/hooks/useSeo'

export default function Index() {
  useSeo({
    title: 'Orbis Protocol — Prova Documental da Economia Circular | dMRV',
    description:
      'Cada nota fiscal da sua cadeia vira prova de descarbonização. Prova documental para descarbonização verificável, auditoria dMRV e conformidade regulatória.',
  })
  return (
    <div className="flex flex-col w-full overflow-x-hidden bg-background text-foreground">
      {/* 1. HERO SECTION: Em duas colunas (Texto à esquerda + Card Ilustrativo à direita) */}
      <section
        aria-label="Apresentação do Orbis Protocol: Pegada de carbono a partir da NF-e"
        className="relative overflow-hidden pt-12 pb-16 md:pt-20 md:pb-24 bg-slate-50 dark:bg-[#0A1628] border-b border-slate-200/80 dark:border-slate-800/80"
      >
        {/* Glow suave e sutil no modo escuro */}
        <div className="hidden dark:block absolute top-0 left-1/2 -translate-x-1/2 w-[1100px] max-w-full h-[520px] linear-glow-combined pointer-events-none opacity-85" />
        <div className="hidden dark:block absolute top-20 right-10 w-[420px] h-[420px] linear-glow-emerald pointer-events-none opacity-70" />
        <div className="hidden dark:block absolute bottom-0 left-10 w-[400px] h-[300px] linear-glow-gold pointer-events-none opacity-60" />

        {/* Gradiente sutil corporativo no modo claro */}
        <div className="dark:hidden absolute inset-0 bg-radial from-emerald-500/5 via-transparent to-transparent pointer-events-none" />

        {/* Anel orbital sutil de fundo girando suavemente */}
        <div className="absolute top-1/2 right-1/4 -translate-y-1/2 pointer-events-none opacity-20 dark:opacity-30">
          <OrbisOrbitalRing size={680} showCore={false} strokeWidth={0.8} glow={false} />
        </div>

        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* COLUNA ESQUERDA: Textos institucionais e CTAs */}
            <div className="lg:col-span-7 flex flex-col items-start text-left">
              {/* Eyebrow */}
              <p className="text-emerald-700 dark:text-[#059669] text-xs sm:text-sm font-semibold tracking-normal mb-4 sm:mb-5">
                Pegada de carbono a partir da NF-e
              </p>

              {/* Headline Principal */}
              <h1 className="font-heading font-black text-3xl xs:text-4xl sm:text-5xl lg:text-[3.25rem] text-slate-900 dark:text-[#F8FAFC] tracking-tight leading-[1.12] sm:leading-[1.08] mb-5 max-w-2xl break-words">
                Cada nota fiscal da sua cadeia vira{' '}
                <span className="text-emerald-600 dark:text-[#059669]">
                  prova de descarbonização.
                </span>
              </h1>

              {/* Parágrafo curto */}
              <p className="text-base sm:text-lg text-slate-600 dark:text-[#94A3B8] leading-relaxed max-w-xl mb-8 font-normal">
                Conectamos suas NF-e e SPED, calculamos a pegada de carbono e entregamos um
                documento verificável — pronto para órgãos de controle, sua contabilidade e
                instituições financeiras.
              </p>

              {/* CTAs do Hero */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 sm:gap-4 w-full sm:w-auto">
                <Link
                  to="/diagnostico"
                  className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl text-sm font-bold bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-[#059669] dark:hover:bg-emerald-600 hover:-translate-y-0.5 active:translate-y-0 transition-all shadow-md min-h-[44px]"
                >
                  <span>Iniciar diagnóstico gratuito</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <a
                  href="#como-funciona"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 rounded-xl transition-all min-h-[44px]"
                >
                  <span>Ver como funciona</span>
                </a>
              </div>

              {/* Linha de confiança */}
              <p className="mt-6 text-xs sm:text-sm text-slate-500 dark:text-[#94A3B8]">
                15 dias de teste, sem cartão. Até 5 notas na avaliação.
              </p>
            </div>

            {/* COLUNA DIREITA: Cartão ilustrativo do Atestado de Conformidade Orbis */}
            <div className="lg:col-span-5 w-full flex justify-center lg:justify-end">
              <CardAtestadoHero />
            </div>
          </div>
        </div>
      </section>

      {/* NOVA SEÇÃO: Da nota fiscal ao documento verificável (3 etapas) */}
      <SecaoComoFuncionaEtapas id="como-funciona" />

      {/* 2. SEÇÃO DE PERFIL EM ABAS (Empresa, Comprador, Perito, Associado ACP) */}
      <SecaoPerfilAbas id="perfis-orbis" />

      {/* 3. LISTA REGULATÓRIA FIXA (Substitui marquee) */}
      <ListaRegulatoriaFixa />

      {/* DIVISOR ORBITAL ESTILO LINEAR */}
      <OrbisSectionDivider label="PROVA & INTERFACES" />

      {/* 4. SEÇÃO DE PROVA UNIFICADA: Screenshots Reais + Exemplo de Atestado Orbis */}
      <PlatformProofScreenshots id="prova-documental" />

      {/* DIVISOR ORBITAL ESTILO LINEAR */}
      <OrbisSectionDivider label="MÉTRICAS VERIFICÁVEIS" />

      {/* 5. SEÇÃO DE CREDIBILIDADE: Números Verificáveis fundidos ao Caso Real VERTEC */}
      <NumerosVerificaveisSection id="credibilidade-caso-vertec" />

      {/* DIVISOR ORBITAL ESTILO LINEAR */}
      <OrbisSectionDivider label="ORBIS LPF" />

      {/* 6. ORBIS LPF COMPACTADA EM DUAS COLUNAS: Texto à esquerda + Formulário à direita */}
      <section
        id="orbis-lpf-destaque"
        aria-label="Orbis LPF - Leitura Pré-Faturamento"
        className="py-16 md:py-24 bg-slate-50 dark:bg-gradient-to-b dark:from-[#0A1628] dark:via-[#0E1A2E] dark:to-[#0A1628] border-y border-slate-200/80 dark:border-slate-800/80 relative overflow-hidden scroll-mt-24"
      >
        <div className="hidden dark:block absolute top-0 right-1/4 w-[600px] h-[300px] linear-glow-emerald pointer-events-none opacity-70" />
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 relative z-10">
          <div className="p-6 sm:p-10 md:p-12 rounded-3xl bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-2xl relative hover:border-emerald-600/40 dark:hover:border-[#059669]/40 transition-all">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
              {/* Coluna Esquerda: Texto compacto de impacto + contexto + aviso único de piloto */}
              <div className="lg:col-span-6 space-y-5">
                {/* Eyebrow */}
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-[#111827] border border-emerald-200 dark:border-slate-800 text-emerald-800 dark:text-[#059669] text-xs font-mono font-bold tracking-wider uppercase">
                  <span>◆ METODOLOGIA EXCLUSIVA ORBIS</span>
                </div>

                {/* Título e Subtítulo */}
                <div>
                  <h2 className="font-heading font-black text-2xl sm:text-3xl md:text-4xl text-slate-900 dark:text-[#F8FAFC] tracking-tight leading-tight">
                    ORBIS LPF — Leitura Pré-Faturamento
                  </h2>
                  <p className="text-sm sm:text-base font-semibold text-emerald-700 dark:text-[#059669] mt-1">
                    Auditoria Fiscal de Carbono Pré-Faturamento
                  </p>
                </div>

                {/* Frase de impacto */}
                <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-[#0A1628] border-l-2 border-emerald-600 dark:border-[#059669] border-slate-200 dark:border-slate-800">
                  <p className="font-heading text-base sm:text-xl font-bold text-slate-900 dark:text-[#F8FAFC] tracking-wide">
                    &ldquo;Sua exportação, precificada em carbono antes de faturar.&rdquo;
                  </p>
                </div>

                {/* Parágrafo conciso */}
                <div className="space-y-3 text-xs sm:text-sm text-slate-600 dark:text-[#94A3B8] leading-relaxed font-normal">
                  <p>
                    Hoje, a indústria descobre a intensidade de carbono do seu produto meses depois
                    do embarque — quando o custo aduaneiro já está definido pela pior hipótese. O
                    Orbis inverte a ordem: calculamos a intensidade estimada do lote no momento do
                    pedido de venda, com pegada apurada e âncora probatória criptográfica para envio
                    ao importador.
                  </p>
                  <p className="font-semibold text-slate-900 dark:text-[#F8FAFC]">
                    Você negocia com o número na mão. Não meses depois.
                  </p>
                </div>

                {/* Linha de público-alvo */}
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0A1628] border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-[#94A3B8]">
                  <strong className="text-amber-700 dark:text-[#D9B36C] font-semibold mr-1">
                    Público-alvo:
                  </strong>
                  <span>
                    Siderúrgicas, fundições, agroindústrias, desmanches e exportadores com exposição
                    a critérios de carbono.
                  </span>
                </div>

                {/* Itens do que você recebe */}
                <div className="space-y-2 pt-1 text-xs text-slate-700 dark:text-slate-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-[#059669] shrink-0" />
                    <span>Intensidade de carbono estimada do lote por unidade exportada</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-[#059669] shrink-0" />
                    <span>Comparativo de custo: cenário sem prova vs. com dossiê defensável</span>
                  </div>
                </div>

                {/* Aviso Piloto: ÚNICA aparição na home conforme diretriz */}
                <div className="pt-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium bg-slate-100 dark:bg-[#111827] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-[#059669]" />
                    <span>Programa piloto · 1 leitura por CNPJ</span>
                  </span>
                </div>
              </div>

              {/* Coluna Direita: Formulário de 3 campos já visível sem rolagem */}
              <div className="lg:col-span-6 w-full">
                <FormularioOrbisLpf
                  id="formulario-leitura-gratuita"
                  tituloVisivel={false}
                  className="shadow-md"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. FAIXA FINA DE LINKS: Substitui as seções expandidas dos 3 Eixos e Circularidade/DPP,
          apontando para os futuros hubs de Soluções com links discretos e acessíveis */}
      <section
        id="solucoes-hub-links"
        aria-label="Soluções e Pilares Estratégicos Orbis"
        className="py-6 sm:py-7 bg-slate-100/70 dark:bg-[#0A1628] border-b border-slate-200 dark:border-slate-800 transition-colors"
      >
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-[#059669]/15 text-emerald-800 dark:text-[#059669] text-xs font-mono font-semibold uppercase tracking-wider border border-emerald-200 dark:border-[#059669]/30">
                <Layers className="w-3 h-3" />
                <span>Soluções Especializadas</span>
              </span>
              <span className="text-xs text-slate-600 dark:text-[#94A3B8] hidden sm:inline">
                Acesse os hubs aprofundados da plataforma:
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs sm:text-sm font-semibold">
              <Link
                to="/diagnostico"
                className="inline-flex items-center gap-1 text-slate-700 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-[#059669] transition-colors py-1"
              >
                <span>Descarbonização & SBCE</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </Link>
              <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">•</span>
              <Link
                to="/mover"
                className="inline-flex items-center gap-1 text-slate-700 dark:text-slate-300 hover:text-amber-700 dark:hover:text-[#D9B36C] transition-colors py-1"
              >
                <span>Conformidade Tributária & MOVER</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </Link>
              <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">•</span>
              <Link
                to="/passaporte-lote/PR-BX-2026-1240105"
                className="inline-flex items-center gap-1 text-slate-700 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-[#059669] transition-colors py-1"
              >
                <span>Circularidade & Passaporte DPP</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </Link>
              <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">•</span>
              <Link
                to="/solucoes"
                className="inline-flex items-center gap-1 text-emerald-700 dark:text-[#059669] hover:underline font-bold py-1"
              >
                <span>Ver Hub Soluções</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 8. CTA FINAL COM ANEL ORBITAL */}
      <section className="py-20 md:py-28 relative overflow-hidden bg-slate-50 dark:bg-gradient-to-b dark:from-[#0A1628] dark:via-[#0E1A2E] dark:to-[#0A1628]">
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
                PRONTO PARA AUDITAR E EMITIR O ATESTADO DO SEU CNPJ?
              </h2>
              <p className="text-sm sm:text-base text-slate-600 dark:text-[#94A3B8] leading-relaxed">
                Inicie o diagnóstico em 4 etapas, teste com nossos modelos fiscais pré-carregados e
                visualize sua qualificação ambiental, tributária e emissão do Atestado Orbis (com
                ART/RRT).
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0 w-full lg:w-auto">
              <Link
                to="/diagnostico"
                className="w-full sm:w-auto text-center px-7 py-3.5 rounded-xl text-sm font-bold bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-[#2563EB] dark:text-white dark:hover:bg-blue-600 hover:-translate-y-0.5 transition-all shadow-sm min-h-[44px] flex items-center justify-center"
              >
                <span>Iniciar Diagnóstico</span>
              </Link>
              <Link
                to="/registro"
                className="w-full sm:w-auto text-center px-6 py-3.5 rounded-xl text-sm font-semibold bg-slate-100 dark:bg-[#111827] border border-slate-200 dark:border-[#2563EB]/50 text-slate-800 dark:text-[#F8FAFC] hover:bg-emerald-600 hover:text-white dark:hover:bg-[#2563EB] dark:hover:text-white hover:-translate-y-0.5 transition-all min-h-[44px] flex items-center justify-center"
              >
                <span>Criar Conta</span>
              </Link>
              <Link
                to="/verificador"
                className="w-full sm:w-auto text-center px-5 py-3.5 rounded-xl text-sm font-semibold border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-[#94A3B8] hover:border-amber-500 hover:text-amber-700 dark:hover:border-[#D9B36C] dark:hover:text-[#D9B36C] hover:-translate-y-0.5 transition-all min-h-[44px] flex items-center justify-center"
              >
                <span>Verificar Atestado</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
