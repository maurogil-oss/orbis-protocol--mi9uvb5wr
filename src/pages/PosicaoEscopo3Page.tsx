import React from 'react'
import { Link } from 'react-router-dom'
import {
  Layers,
  ShieldCheck,
  Lock,
  FileCheck2,
  AlertTriangle,
  ArrowRight,
  Database,
  Building2,
  Truck,
  CheckCircle2,
  FileText,
  Scale,
} from 'lucide-react'
import { BreadcrumbOrbis } from '@/components/BreadcrumbOrbis'
import { useSeo } from '@/hooks/useSeo'

export default function PosicaoEscopo3Page() {
  useSeo({
    title: 'Escopo 3 e insetting — quem reivindica o quê | Orbis Protocol',
    description:
      'Posição técnica sobre Escopo 3, insetting circular, matriz de titularidade de claims, guarda de uso único RETIRED_FOR_INSETTING e o Dossiê de Escopo 3 da Orbis Protocol.',
  })

  return (
    <div className="min-h-screen py-8 md:py-14 bg-slate-50 dark:bg-[#0A1628] text-slate-900 dark:text-[#F8FAFC] transition-colors">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 space-y-10">
        {/* Top Breadcrumb */}
        <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
          <BreadcrumbOrbis
            items={[
              { label: 'Protocolo', href: '/protocolo' },
              { label: 'Escopo 3 e insetting — quem reivindica o quê' },
            ]}
          />
        </div>

        {/* 1. HERO INSTITUCIONAL */}
        <section
          aria-label="Apresentação de Escopo 3 e Insetting"
          className="p-6 sm:p-10 rounded-3xl bg-slate-900 text-white dark:bg-[#0E1A2E] dark:text-[#F8FAFC] border border-slate-800 dark:border-slate-700 shadow-xl relative overflow-hidden"
        >
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-mono font-semibold uppercase tracking-wider">
              <Layers className="w-3.5 h-3.5" />
              GOVERNANÇA DE CADEIA DE SUPRIMENTOS
            </div>

            <h1 className="font-heading font-black text-2xl sm:text-4xl md:text-5xl text-white tracking-tight leading-tight">
              Escopo 3 e insetting — quem reivindica o quê
            </h1>

            <p className="text-base sm:text-lg text-emerald-300 font-medium leading-relaxed">
              Insetting é redução real dentro da própria cadeia de valor. Não exige Verra nem Gold
              Standard porque não gera instrumentos negociáveis entre estranhos: é contabilidade
              corporativa de inventário segundo o GHG Protocol e a ISO 14064-1.
            </p>

            <p className="text-xs sm:text-sm text-slate-300 dark:text-slate-300 leading-relaxed">
              O desafio central das corporações não é inventar novos créditos, mas ter certeza
              absoluta sobre quem tem o direito de relatar o abatimento, como evitar a dupla
              contagem e como auditar o dado primário que entra no inventário corporativo.
            </p>
          </div>
        </section>

        {/* 2. O QUE É INSETTING CIRCULAR (GHG Protocol Scope 3 & ISO 14064-1) */}
        <section
          aria-label="Conceito e Fundamento Normativo do Insetting"
          className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-slate-800 shadow-sm space-y-5"
        >
          <div>
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block mb-1">
              FUNDAMENTAÇÃO METODOLÓGICA
            </span>
            <h2 className="font-heading font-black text-xl sm:text-2xl text-slate-900 dark:text-white">
              Por que o insetting circular não exige registro externo de crédito
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            <div className="space-y-3">
              <p>
                O termo <strong>insetting</strong> designa ações de descarbonização e regeneração
                implementadas diretamente dentro dos limites da cadeia de valor da própria empresa,
                em oposição ao <em>offsetting</em> (compensação externa com projetos desvinculados
                da operação).
              </p>
              <p>
                As normas que regem o reporte corporativo global —{' '}
                <strong>GHG Protocol Corporate Value Chain (Scope 3) Standard</strong> e{' '}
                <strong>ABNT NBR ISO 14064-1</strong> — estabelecem que quando uma organização
                compra um insumo reciclado ou componente circular, o carbono incorporado desse
                insumo substitui o fator da matéria-prima virgem na sua contabilidade de inventário.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center gap-2 font-mono text-xs font-bold text-slate-900 dark:text-white uppercase">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Regras Claras de Contabilidade de Inventário</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Essa substituição <strong>não cria um ativo transacionável</strong>; ela apenas
                altera a intensidade de carbono do produto final ou do inventário corporativo
                reportado pela empresa. Portanto, ela não requer registro voluntário internacional
                (tipo Verra ou Gold Standard), pois não há instrumento financeiro circulando entre
                partes alheias à cadeia produtiva.
              </p>
            </div>
          </div>
        </section>

        {/* 3. MATRIZ DE TITULARIDADE (A PEÇA CENTRAL E HONESTA) */}
        <section
          aria-label="Matriz de Titularidade de Claims de Escopo 3"
          className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-slate-800 shadow-sm space-y-6"
        >
          <div>
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400 block mb-1">
              A PEÇA CENTRAL DA GOVERNANÇA
            </span>
            <h2 className="font-heading font-black text-xl sm:text-2xl text-slate-900 dark:text-white">
              Matriz de Titularidade: quem reporta e quem reivindica o quê
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1">
              A regra de ouro da integridade climática: a redução de Escopo 3 é reivindicada por
              quem reporta o inventário corporativo. O fornecedor não vende nem declara a redução
              como crédito.
            </p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-heading font-bold uppercase tracking-wider text-[11px]">
                  <th className="p-3 sm:p-4">Agente da Cadeia</th>
                  <th className="p-3 sm:p-4">Papel no Inventário de GEE</th>
                  <th className="p-3 sm:p-4">Categoria do GHG Protocol</th>
                  <th className="p-3 sm:p-4">O Que Pode Declarar / Reivindicar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {/* Linha 1: Compradora / Manufatura */}
                <tr className="bg-white dark:bg-[#0E1A2E] hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors">
                  <td className="p-3 sm:p-4 font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>Empresa Compradora (Montadora / Indústria / Seguradora)</span>
                  </td>
                  <td className="p-3 sm:p-4">
                    Adquire o material ou componente circular e o incorpora à sua produção ou rede
                    de reparo.
                  </td>
                  <td className="p-3 sm:p-4 font-mono text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                    Escopo 3 • Categoria 1 (Bens e Serviços Adquiridos)
                  </td>
                  <td className="p-3 sm:p-4 font-medium text-slate-900 dark:text-white">
                    <strong>Reivindica o abate no inventário:</strong> declara a menor pegada de
                    carbono incorporada nas suas compras no CDP, GRI e CVM 193.
                  </td>
                </tr>

                {/* Linha 2: Montadora / Fim de Vida */}
                <tr className="bg-slate-50/50 dark:bg-slate-900/20 hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors">
                  <td className="p-3 sm:p-4 font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                    <span>Montadora (Gestão de Frota / Fim de Vida)</span>
                  </td>
                  <td className="p-3 sm:p-4">
                    Comprova o desmonte técnico e a circularização dos veículos fabricados ao final
                    do ciclo de uso.
                  </td>
                  <td className="p-3 sm:p-4 font-mono text-xs font-semibold text-blue-700 dark:text-blue-400">
                    Escopo 3 • Categoria 12 (Tratamento de Fim de Vida de Produtos Vendidos)
                  </td>
                  <td className="p-3 sm:p-4 font-medium text-slate-900 dark:text-white">
                    <strong>Reivindica circularidade e desvio de aterro:</strong> comprova metas do
                    Programa MOVER e taxas de reciclabilidade exigidas por lei.
                  </td>
                </tr>

                {/* Linha 3: Fornecedor (CDV / Reciclador) */}
                <tr className="bg-white dark:bg-[#0E1A2E] hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors">
                  <td className="p-3 sm:p-4 font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    <Truck className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                    <span>Fornecedor (CDV / Reciclador / Sucateiro)</span>
                  </td>
                  <td className="p-3 sm:p-4">
                    Executa o desmanche, triagem, pesagem, descontaminação e faturamento fiscal.
                  </td>
                  <td className="p-3 sm:p-4 font-mono text-xs text-slate-500 dark:text-slate-400">
                    Não reporta categoria compradora (ele é a fonte do insumo)
                  </td>
                  <td className="p-3 sm:p-4 font-medium text-slate-900 dark:text-white">
                    <strong className="text-amber-700 dark:text-amber-400">
                      NÃO reivindica nem vende a redução:
                    </strong>{' '}
                    seu benefício é o <strong>argumento comercial</strong> de fornecer matéria-prima
                    ou peça com intensidade comprovadamente menor, com prova documental auditável.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* 4. GUARDA DE DUPLA CONTABILIDADE E USO ÚNICO (RETIRED_FOR_INSETTING) */}
        <section
          aria-label="Guarda de Uso Único e Registro RETIRED_FOR_INSETTING"
          className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-slate-800 shadow-sm space-y-5"
        >
          <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-mono text-xs font-bold uppercase tracking-wider">
            <Lock className="w-4 h-4" />
            <span>Integridade Contábil • Mecanismo Anti-Dupla Contagem</span>
          </div>

          <h2 className="font-heading font-black text-xl sm:text-2xl text-slate-900 dark:text-white">
            Uso único: a guarda criptográfica de dupla contagem
          </h2>

          <div className="space-y-3 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            <p>
              O maior risco de reputação em sustentabilidade é a alegação duplicada (quando dois
              agentes usam o mesmo lote físico de material reciclado para justificar suas metas
              climáticas).
            </p>
            <p>
              Para blindar os relatórios das compradoras, a plataforma Orbis implementa uma regra
              técnica imutável: quando uma empresa compradora declara o abate em seu relatório e
              emite o dossiê correspondente, o registro do lote ou da peça é marcado
              irreversivelmente com o status{' '}
              <strong className="font-mono text-emerald-700 dark:text-emerald-400">
                RETIRED_FOR_INSETTING
              </strong>
              .
            </p>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 text-white dark:bg-slate-950 border border-slate-800 font-mono text-xs space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-[11px] pb-2 border-b border-slate-800">
              <span>Status no Registro de Integridade Orbis</span>
              <span className="text-emerald-400 font-bold">RETIRED_FOR_INSETTING</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              &quot;A claim é estritamente única. Ao ser vinculada ao CNPJ da adquirente na
              competência declarada, nenhuma outra entidade física ou jurídica poderá reutilizar o
              identificador, o chassi ou o peso correspondente para fins de inventário de Escopo
              3.&quot;
            </p>
          </div>
        </section>

        {/* 5. O QUE A ORBIS ENTREGA: DOSSIÊ DE ESCOPO 3 */}
        <section
          aria-label="Componentes do Dossiê de Escopo 3"
          className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-slate-800 shadow-sm space-y-6"
        >
          <div>
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block mb-1">
              PACOTE PROBATÓRIO CORPORATIVO
            </span>
            <h2 className="font-heading font-black text-xl sm:text-2xl text-slate-900 dark:text-white">
              O que a Orbis entrega: o &quot;Dossiê de Escopo 3&quot;
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1">
              Estrutura técnica entregue à auditoria da compradora para justificar o lançamento nas
              Categorias 1 e 12 do GHG Protocol.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Bloco 1: Dado Primário */}
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2">
              <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400">
                Item 1
              </span>
              <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-white">
                Dado primário rastreado
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Chassi, número da peça, tonelagem real e chave de acesso da NF-e de lastro fiscal
                que comprova a circulação física da mercadoria.
              </p>
            </div>

            {/* Bloco 2: Fatores DM-ORB-001 com transparência */}
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2">
              <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400">
                Item 2
              </span>
              <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-white">
                Fatores oficiais curados
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Fatores do DM-ORB-001: <strong>IAI 14,40</strong> (alumínio),{' '}
                <strong>worldsteel 2,18</strong> (aço) e <strong>ICA 4,10</strong> (cobre).
                Polímeros carregam com transparência a flag oficial &quot;pendente de verificação de
                fonte&quot;.
              </p>
            </div>

            {/* Bloco 3: Cadeia de Custódia */}
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2">
              <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-400">
                Item 3
              </span>
              <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-white">
                Cadeia de custódia SHA-256
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Hash criptográfico gerado sobre os dados brutos e verificável publicamente na rota{' '}
                <Link
                  to="/verificador"
                  className="text-emerald-700 dark:text-emerald-400 underline font-semibold"
                >
                  /verificador
                </Link>
                , sem necessidade de login.
              </p>
            </div>

            {/* Bloco 4: Declaração de Titularidade */}
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2">
              <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400">
                Item 4
              </span>
              <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-white">
                Declaração de titularidade
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Termo expresso de atribuição exclusiva da claim à empresa adquirente e registro de
                uso único (aposentadoria para insetting).
              </p>
            </div>
          </div>
        </section>

        {/* 6. HONESTIDADE SOBRE VERIFICAÇÃO INDEPENDENTE (ISO 14064-3 / ART) */}
        <section
          aria-label="Honestidade sobre Níveis de Verificação e Auditoria"
          className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4"
        >
          <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-mono text-xs font-bold uppercase tracking-wider">
            <AlertTriangle className="w-4 h-4" />
            <span>Honestidade com o Auditor de Terceira Parte</span>
          </div>

          <h2 className="font-heading font-black text-xl sm:text-2xl text-slate-900 dark:text-white">
            Auditoria interna (Audit Grade) não substitui verificação independente
          </h2>

          <div className="space-y-3 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            <p>
              A montadora ou grande corporação assume perante o mercado e os reguladores (CVM 193,
              IFRS S2, CDP, SEC) a total responsabilidade pelas alegações de sustentabilidade
              publicadas no seu relatório anual. O auditor dela exige verificação externa
              independente segundo a norma <strong>ABNT NBR ISO 14064-3</strong>.
            </p>
            <p>A Orbis posiciona com clareza o seu escopo:</p>
            <ul className="space-y-2 list-disc list-inside">
              <li>
                <strong>Primeiro Nível (Atendido pela Orbis):</strong> fornecemos dados primários em
                padrão de auditoria (<em>Audit Grade</em>), memória de cálculo transparente e o{' '}
                <strong>Atestado de Conformidade Orbis (com ART/RRT)</strong> acoplada por perito
                técnico credenciado (CREA/CAU), com responsabilidade técnica civil e penal
                identificável.
              </li>
              <li>
                <strong>Segundo Nível (Auditor Externo da Empresa):</strong> quando a empresa
                submete seu inventário consolidado a uma empresa de auditoria independente (Big Four
                ou VVB), o auditor examina o Dossiê de Escopo 3 fornecido pela Orbis como evidência
                primária auditável da cadeia de valor.
              </li>
            </ul>
          </div>
        </section>

        {/* 7. PRODUTO COMERCIAL: O QUE FATURAMOS */}
        <section
          aria-label="Modelo Comercial e Entregáveis da Orbis"
          className="p-6 sm:p-8 rounded-3xl bg-slate-900 text-white dark:bg-[#0E1A2E] border border-slate-800 space-y-4"
        >
          <div className="flex items-center gap-2 text-emerald-400 font-mono text-xs font-bold uppercase tracking-wider">
            <Scale className="w-4 h-4" />
            <span>Modelo Comercial do Orbis Protocol</span>
          </div>

          <h2 className="font-heading font-black text-xl sm:text-2xl text-white">
            O que faturamos: MRV + prova documental (pegada por nota)
          </h2>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            O faturamento da plataforma Orbis incide sobre o{' '}
            <strong>
              serviço de dMRV e prova documental da pegada de carbono das notas fiscais
            </strong>
            . O <em>Dossiê de Escopo 3</em> é o empacotamento corporativo dessa apuração para
            atendimento às áreas de compras sustentáveis e sustentabilidade corporativa.
          </p>

          <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-slate-300 space-y-1">
            <strong className="text-emerald-400 block font-bold">
              Cláusula expressa de integridade comercial:
            </strong>
            <p>
              Nunca chamamos nosso produto de &quot;certificado de redução de carbono&quot; nem
              prometemos &quot;ponte automática para Verra&quot;. Faturamos inteligência de dados,
              cálculo pericial e garantia documental de integridade.
            </p>
          </div>
        </section>

        {/* 8. CROSS-LINK COM A PÁGINA 1 (CRÉDITO DE CARBONO) */}
        <section
          aria-label="Aprofundamento Recomendado"
          className="p-6 sm:p-8 rounded-3xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        >
          <div className="space-y-1">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              DOCUMENTO COMPLEMENTAR
            </span>
            <h3 className="font-heading font-bold text-base sm:text-lg text-slate-900 dark:text-white">
              Deseja conhecer nossa posição sobre créditos de mercado voluntário?
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
              Leia nossa declaração direta sobre por que a Orbis não emite créditos de carbono, a
              situação real do Verra S3S e o FAQ de conformidade.
            </p>
          </div>

          <Link
            to="/posicao-credito-carbono"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-bold text-xs sm:text-sm whitespace-nowrap transition-colors min-h-[44px] shadow-sm"
          >
            <span>Posição sobre crédito de carbono</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </section>

        {/* Aviso informativo de conformidade */}
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed text-center sm:text-left">
          Conteúdo informativo sobre posicionamento público da Orbis Protocol. Não constitui oferta,
          garantia de resultado nem aconselhamento jurídico, contábil ou financeiro — decisões de
          reporte devem ser validadas com os assessores responsáveis da empresa.
        </p>

        {/* 9. NAVEGAÇÃO DE VOLTA AO HUB */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800 text-xs">
          <Link
            to="/protocolo"
            className="text-slate-600 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-400 font-semibold inline-flex items-center gap-1 min-h-[44px]"
          >
            ← Voltar ao Hub Protocolo
          </Link>
          <Link
            to="/fatores"
            className="text-slate-600 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-400 font-semibold inline-flex items-center gap-1 min-h-[44px]"
          >
            Ver Metodologia & Fatores (DM-ORB-001) →
          </Link>
        </div>
      </div>
    </div>
  )
}
