import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  Scale,
  ShieldCheck,
  HelpCircle,
  ArrowRight,
  Layers,
  CheckCircle2,
  XCircle,
  Compass,
  FileCheck2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { BreadcrumbOrbis } from '@/components/BreadcrumbOrbis'
import { useSeo } from '@/hooks/useSeo'

interface FaqItem {
  pergunta: string
  resposta: string
}

const FAQS_CREDITO_CARBONO: FaqItem[] = [
  {
    pergunta: 'Esse documento vale como crédito de carbono?',
    resposta:
      'Não. O documento gerado pela Orbis é uma prova documental da economia circular e compõe o Atestado de Conformidade Orbis (com ART/RRT), curto Atestado Orbis. Ele comprova o dado primário de massa e a eco-eficiência calculada com base na rastreabilidade fiscal (NF-e/SPED) e em fatores de inventário reconhecidos. Ele não é um crédito transacionável em bolsas voluntárias nem ativo financeiro do SBCE.',
  },
  {
    pergunta: 'Posso vender o carbono evitado do meu lote?',
    resposta:
      'Não como crédito de carbono autônomo. O fornecedor de material circular (reciclador, centro de desmonte ou transformador) não comercializa reduções de carbono como ativos separados. O valor gerado permanece incorporado no próprio produto físico: o fornecedor entrega uma peça ou matéria-prima circular com intensidade de carbono comprovadamente menor, permitindo ao comprador corporativo reduzir suas emissões de Escopo 3.',
  },
  {
    pergunta: 'O que falta para virar crédito de carbono de mercado?',
    resposta:
      'Faltam uma metodologia específica e aprovada para reciclagem/circularidade em padrão internacional (como Verra ou Gold Standard), a formalização de um Documento de Concepção do Projeto (PDD), a contratação de um Organismo de Validação e Verificação (VVB) credenciado e o registro formal em plataforma pública com prevenção contra dupla contagem. Atualmente, o mercado voluntário não possui metodologia ativa em larga escala para peças e desmonte automotivo.',
  },
  {
    pergunta: 'Quem valida os cálculos e dados hoje?',
    resposta:
      'A rastreabilidade dos dados primários (notas fiscais, chassis, manifestos e fatores oficiais do DM-ORB-001) é assegurada criptograficamente por hash SHA-256 no verificador público. No nível pericial, peritos técnicos habilitados (engenheiros com CREA emitindo ART ou arquitetos com CAU emitindo RRT) assinam o Atestado Orbis. Para fins corporativos de inventário (GHG Protocol e ISO 14064-1), os dados alimentam o relatório da empresa compradora, que é submetido à sua própria auditoria independente de sustentabilidade.',
  },
  {
    pergunta: 'A Orbis pretende emitir créditos no futuro se as metodologias forem aprovadas?',
    resposta:
      'Não temos promessa de prazo nem mudaremos nosso modelo estrutural. A Orbis se posiciona como infraestrutura perene de prova documental e dMRV da economia circular. Se um padrão voluntário ou o SBCE abrir metodologias aplicáveis e um cliente decidir registrar um projeto externo, a Orbis atuará exclusivamente como a camada de dados primários e evidências auditáveis que alimentará a certificadora e o VVB contratados pelo cliente.',
  },
]

export default function PosicaoCreditoCarbonoPage() {
  useSeo({
    title: 'Carbono evitado e crédito de carbono — nossa posição | Orbis Protocol',
    description:
      'Posição pública da Orbis Protocol: por que não emitimos nem comercializamos créditos de carbono, a distinção entre crédito voluntário e eco-eficiência e o papel da prova documental dMRV.',
  })

  const [faqAberto, setFaqAberto] = useState<number | null>(null)

  const toggleFaq = (idx: number) => {
    setFaqAberto((atual) => (atual === idx ? null : idx))
  }

  return (
    <div className="min-h-screen py-8 md:py-14 bg-slate-50 dark:bg-[#0A1628] text-slate-900 dark:text-[#F8FAFC] transition-colors">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 space-y-10">
        {/* Top Breadcrumb */}
        <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
          <BreadcrumbOrbis
            items={[
              { label: 'Protocolo', href: '/protocolo' },
              { label: 'Carbono evitado e crédito de carbono — nossa posição' },
            ]}
          />
        </div>

        {/* 1. DECLARAÇÃO DIRETA NO TOPO (Compromisso Institucional) */}
        <section
          aria-label="Declaração Direta e Compromisso Institucional"
          className="p-6 sm:p-10 rounded-3xl bg-slate-900 text-white dark:bg-[#0E1A2E] dark:text-[#F8FAFC] border border-slate-800 dark:border-slate-700 shadow-xl relative overflow-hidden"
        >
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-semibold uppercase tracking-wider">
              <Scale className="w-3.5 h-3.5" />
              DECLARAÇÃO PÚBLICA DE POSIÇÃO INSTITUCIONAL
            </div>

            <h1 className="font-heading font-black text-2xl sm:text-4xl md:text-5xl text-white tracking-tight leading-tight">
              Carbono evitado e crédito de carbono — nossa posição
            </h1>

            <p className="text-base sm:text-lg text-emerald-300 font-medium leading-relaxed">
              A Orbis NÃO emite, não registra e não comercializa créditos de carbono. Somos
              infraestrutura de prova documental (dMRV) da economia circular.
            </p>

            <p className="text-xs sm:text-sm text-slate-300 dark:text-slate-300 leading-relaxed">
              Nosso papel técnico e tecnológico é fornecer substrato probatório irrefutável com dado
              primário rastreado a partir de notas fiscais reais, cálculo transparente de balanço de
              massa e registro criptográfico imutável. Recusamos expressamente qualquer promessa de
              conversão automática em ativos de mercado voluntário.
            </p>
          </div>
        </section>

        {/* 2. ETIQUETA OBRIGATÓRIA: INDICADOR PRELIMINAR */}
        <section
          aria-label="Aviso Mandatório de Indicador Preliminar"
          className="p-5 sm:p-6 rounded-2xl bg-amber-500/10 border-2 border-amber-500/40 text-amber-950 dark:text-amber-200 space-y-2"
        >
          <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <span>Etiqueta Obrigatória de Conformidade Regulatória</span>
          </div>
          <div className="p-3 rounded-xl bg-white/70 dark:bg-slate-900/60 border border-amber-400/50 text-slate-800 dark:text-slate-100 font-mono text-xs sm:text-sm font-semibold">
            preliminar — não substitui laudo pericial, não é crédito negociável, não é ativo do SBCE
          </div>
          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed pt-1">
            O valor de emissões evitadas computado pela plataforma é um{' '}
            <strong className="text-slate-900 dark:text-white">
              indicador preliminar de eco-eficiência
            </strong>
            . Ele quantifica a intensidade comparativa entre a rota de manufatura virgem e a rota de
            reaproveitamento circular segundo a metodologia DM-ORB-001. A formalização probatória
            ocorre exclusivamente por meio do{' '}
            <strong className="text-slate-900 dark:text-white">
              Atestado de Conformidade Orbis (com ART/RRT)
            </strong>
            , curto <strong className="text-slate-900 dark:text-white">Atestado Orbis</strong>,
            emitido por perito técnico credenciado.
          </p>
        </section>

        {/* 3. DIFERENÇA DIDÁTICA: CRÉDITO DE MERCADO VS. REDUÇÃO NA CADEIA DE VALOR */}
        <section
          aria-label="Diferença Didática entre Instrumentos de Carbono"
          className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-slate-800 shadow-sm space-y-6"
        >
          <div>
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block mb-1">
              SEM JARGÃO EXCESSIVO
            </span>
            <h2 className="font-heading font-black text-xl sm:text-2xl text-slate-900 dark:text-white">
              Crédito de carbono vs. eco-eficiência na cadeia de valor
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1">
              Entenda de forma transparente a distinção entre instrumentos financeiros negociáveis e
              a contabilidade climática de inventário corporativo.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Cartão 1: Mercado Voluntário */}
            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 uppercase">
                  Instrumento Negociável
                </span>
                <XCircle className="w-5 h-5 text-slate-400 shrink-0" />
              </div>
              <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white">
                Crédito de carbono (mercado voluntário / SBCE)
              </h3>
              <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-2 leading-relaxed list-disc list-inside">
                <li>
                  <strong>Ativo negociável entre terceiros:</strong> pode ser comprado, vendido e
                  aposentado por agentes que não têm vínculo operacional com o projeto de origem.
                </li>
                <li>
                  <strong>Registro centralizado obrigatório:</strong> exige submissão a registros
                  internacionais formais (ex.: Verra, Gold Standard) ou ao registro nacional do SBCE
                  (Lei nº 15.042/2024).
                </li>
                <li>
                  <strong>Risco severo de dupla contagem:</strong> se um crédito é vendido no
                  mercado, quem gerou a redução física não pode mais declarar essa redução em seu
                  inventário corporativo sob pena de fraude climática.
                </li>
                <li>
                  <strong>Processo moroso e oneroso:</strong> exige contratação de auditoria de
                  validação e verificação independente (VVB) com custos que costumam inviabilizar
                  lotes industriais de pequeno e médio porte.
                </li>
              </ul>
            </div>

            {/* Cartão 2: Redução na Cadeia de Valor */}
            <div className="p-6 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 uppercase">
                  Onde a Orbis Atua
                </span>
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              </div>
              <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white">
                Eco-eficiência e redução na cadeia de valor (Insetting)
              </h3>
              <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-2 leading-relaxed list-disc list-inside">
                <li>
                  <strong>Contabilidade de inventário real:</strong> regulada pelas normas técnicas{' '}
                  <strong>GHG Protocol Corporate</strong> e <strong>ABNT NBR ISO 14064-1</strong>.
                </li>
                <li>
                  <strong>Vínculo direto na compra do material:</strong> o benefício climático
                  acompanha o insumo circular e abate diretamente a pegada de Escopo 3 do comprador
                  corporativo (montadora, siderúrgica, fabricante).
                </li>
                <li>
                  <strong>Não gera instrumento especulativo:</strong> não há criação de moeda ou
                  token vendável a estranhos. O benefício é apurado e declarado no balanço
                  socioambiental da própria empresa.
                </li>
                <li>
                  <strong>Prova documental primária:</strong> sustentada em notas fiscais
                  eletrônicas, laudo pericial com ART/RRT e rastreabilidade criptográfica de cadeia
                  de custódia.
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* 4. SITUAÇÃO REAL DO MERCADO: VERRA S3S E A PONTE */}
        <section
          aria-label="Situação Real do Mercado e Verra S3S"
          className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-slate-800 shadow-sm space-y-5"
        >
          <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 font-mono text-xs font-bold uppercase tracking-wider">
            <Compass className="w-4 h-4" />
            <span>Panorama Normativo Internacional • Verra Scope 3 Standard (S3S)</span>
          </div>

          <h2 className="font-heading font-black text-xl sm:text-2xl text-slate-900 dark:text-white">
            Situação real do mercado: por que não prometemos créditos de reciclagem
          </h2>

          <div className="space-y-3 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            <p>
              Em 2026, a Verra estruturou o programa internacional{' '}
              <strong>Verra Scope 3 Standard (S3S)</strong>, voltado para certificar ações
              climáticas em cadeias de suprimento e emitir Scope 3 Units (S3Us). No entanto, a{' '}
              <strong>
                Versão 1.0 (V1) do programa contempla exclusivamente metodologias para agricultura e
                concreto
              </strong>
              .
            </p>
            <p>
              O segmento de{' '}
              <strong>
                materiais circulares, reciclagem industrial e desmontagem veicular ainda não possui
                metodologia própria homologada pelo S3S
              </strong>
              . Diante desse fato regulatório concreto, o Orbis Protocol adota uma postura de máxima
              probidade: <strong>não prometemos crédito de reciclagem nem geração de S3U</strong>.
            </p>
          </div>

          {/* Quando faz sentido buscar registro externo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
              <span className="font-heading font-bold text-xs uppercase text-slate-900 dark:text-white block mb-1">
                Quando NÃO faz sentido buscar registro externo:
              </span>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Quando o objetivo corporativo é comprovar redução de emissões no relatório anual
                ESG, atender metas do Programa MOVER, demonstrar eco-eficiência perante clientes
                corporativos ou instruir auditorias da CVM 193 / IFRS S2. Nesses casos, o Atestado
                Orbis com ART/RRT e o Dossiê de Escopo 3 foram desenhados para atender ao GHG
                Protocol sem custos desnecessários de certificadoras externas.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
              <span className="font-heading font-bold text-xs uppercase text-slate-900 dark:text-white block mb-1">
                Quando faz sentido buscar registro externo:
              </span>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Quando a empresa decide estruturar um projeto de investimento com o propósito
                explícito de negociar ativos no mercado financeiro voluntário ou compensar
                obrigações compulsórias em mecanismos regulados (como SBCE ou CBAM). Se e quando
                surgirem metodologias homologadas, o Orbis fornecerá a camada de dados primários e
                rastreabilidade que o auditor VVB exigirá.
              </p>
            </div>
          </div>
        </section>

        {/* 5. FAQ CURTO E TRANSPARENTE */}
        <section
          aria-label="Perguntas Frequentes sobre Crédito de Carbono"
          className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-slate-800 shadow-sm space-y-6"
        >
          <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-mono text-xs font-bold uppercase tracking-wider">
            <HelpCircle className="w-4 h-4" />
            <span>FAQ de Posicionamento Público</span>
          </div>

          <div>
            <h2 className="font-heading font-black text-xl sm:text-2xl text-slate-900 dark:text-white">
              Perguntas frequentes — respostas honestas, sem promessa de prazo
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1">
              Esclarecimentos diretos sobre validade, titularidade e procedimentos de auditoria.
            </p>
          </div>

          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {FAQS_CREDITO_CARBONO.map((faq, idx) => {
              const estaAberto = faqAberto === idx

              return (
                <div key={idx} className="py-4">
                  <button
                    type="button"
                    onClick={() => toggleFaq(idx)}
                    aria-expanded={estaAberto}
                    className="w-full flex items-center justify-between text-left gap-4 font-heading font-bold text-sm sm:text-base text-slate-900 dark:text-white hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors py-2 min-h-[44px]"
                  >
                    <span>{faq.pergunta}</span>
                    {estaAberto ? (
                      <ChevronUp className="w-5 h-5 text-emerald-600 shrink-0" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-400 shrink-0" />
                    )}
                  </button>

                  {estaAberto && (
                    <div className="pt-2 pb-3 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed animate-in fade-in-0 duration-150">
                      {faq.resposta}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </section>

        {/* 6. CROSS-LINK COM A PÁGINA 2 (ESCOPO 3 E INSETTING) */}
        <section
          aria-label="Aprofundamento Recomendado"
          className="p-6 sm:p-8 rounded-3xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        >
          <div className="space-y-1">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" />
              APROFUNDAMENTO TÉCNICO
            </span>
            <h3 className="font-heading font-bold text-base sm:text-lg text-slate-900 dark:text-white">
              Quer entender como a redução é reivindicada na prática?
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
              Conheça a <strong>Matriz de Titularidade de Escopo 3</strong>, a trava de uso único e
              o que a Orbis entrega no Dossiê de Escopo 3 para compradoras corporativas.
            </p>
          </div>

          <Link
            to="/posicao-escopo-3"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm whitespace-nowrap transition-colors min-h-[44px] shadow-sm"
          >
            <span>Escopo 3 e insetting</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </section>

        {/* Aviso informativo de conformidade */}
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed text-center sm:text-left">
          Conteúdo informativo sobre posicionamento público da Orbis Protocol. Não constitui oferta,
          garantia de resultado nem aconselhamento jurídico, contábil ou financeiro — decisões de
          reporte devem ser validadas com os assessores responsáveis da empresa.
        </p>

        {/* 7. NAVEGAÇÃO DE VOLTA AO HUB */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800 text-xs">
          <Link
            to="/protocolo"
            className="text-slate-600 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-400 font-semibold inline-flex items-center gap-1 min-h-[44px]"
          >
            ← Voltar ao Hub Protocolo
          </Link>
          <Link
            to="/verificador"
            className="text-slate-600 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-400 font-semibold inline-flex items-center gap-1 min-h-[44px]"
          >
            Consultar atestado no verificador →
          </Link>
        </div>
      </div>
    </div>
  )
}
