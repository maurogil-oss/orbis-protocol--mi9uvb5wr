import { Link } from 'react-router-dom'
import {
  FileText,
  ShieldCheck,
  AlertTriangle,
  Scale,
  Lock,
  ArrowRight,
  ExternalLink,
  CheckCircle2,
  HelpCircle,
  Building2,
  Flame,
} from 'lucide-react'
import {
  VERSAO_TERMOS_USO_ATUAL,
  DATA_VIGENCIA_TERMOS_ATUAL,
  VERSAO_DOCUMENTO_LGPD_ATUAL,
  CONTATO_CONTROLADOR_LGPD,
} from '@/services/termoConsentimentoService'
import { useSeo } from '@/hooks/useSeo'

/**
 * Termos de Uso e Condições Gerais da Plataforma Orbis Protocol.
 * Reflete rigorosamente a posição do produto:
 * - Infraestrutura dMRV de prova documental e reconciliação fiscal (NF-e/itens).
 * - Rótulo ESTIMATIVA e limitações metodológicas (não emite créditos de carbono e não substitui certificação de terceira parte).
 * - Rótulos auditáveis: "validado/confirmado", "Atestado Orbis" (proibido "Certificação", "Selo Oficial", "homologado").
 * - Referência cruzada à Política de Privacidade LGPD (/privacidade).
 */
export default function TermosUsoPage() {
  useSeo({
    title: 'Termos de Uso — Orbis Protocol',
    description:
      'Condições gerais de uso, limitações metodológicas dMRV, responsabilidades e política de prova documental da plataforma Orbis Protocol.',
  })

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0A1628] text-slate-800 dark:text-[#F4F7FA] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Cabeçalho */}
        <div className="border-b border-slate-200 dark:border-slate-800 pb-6 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
            <Scale className="w-3.5 h-3.5" />
            <span>Documento Regulatório e Contratual dMRV</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Termos de Uso e Condições da Plataforma
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
            <span>
              Versão Vigente:{' '}
              <strong className="text-slate-800 dark:text-slate-200 font-mono">
                {VERSAO_TERMOS_USO_ATUAL}
              </strong>
            </span>
            <span>•</span>
            <span>
              Vigência:{' '}
              <strong className="text-slate-800 dark:text-slate-200">
                {DATA_VIGENCIA_TERMOS_ATUAL}
              </strong>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5 inline" />
              Conformidade LGPD vinculada ({VERSAO_DOCUMENTO_LGPD_ATUAL})
            </span>
          </div>
        </div>

        {/* Quadro de Destaque da Posição do Produto */}
        <div className="p-5 rounded-xl border border-amber-300 dark:border-amber-700/60 bg-amber-50/70 dark:bg-amber-950/20 space-y-2">
          <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-bold text-sm">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>Declaração Fundamental de Natureza e Limitações Metodológicas</span>
          </div>
          <p className="text-xs sm:text-sm text-amber-800 dark:text-amber-300 leading-relaxed">
            A plataforma <strong>Orbis Protocol</strong> é uma infraestrutura tecnológica de{' '}
            <strong>prova documental e dMRV</strong> (digital Measurement, Reporting &amp;
            Verification) para economia circular, logística reversa e descarbonização de cadeias de
            suprimento. <strong>A plataforma NÃO emite créditos de carbono negociáveis</strong>,{' '}
            <strong>NÃO substitui certificadoras regulatórias</strong> e todos os cálculos de
            emissões evitadas ou pegada de carbono são explicitamente identificados com o rótulo{' '}
            <span className="font-mono px-1 py-0.5 rounded bg-amber-200/80 dark:bg-amber-900/60 font-semibold">
              ESTIMATIVA dMRV
            </span>
            , apurados segundo a norma técnica proprietária DM-ORB-001 e fatores de emissão oficiais
            rastreáveis.
          </p>
        </div>

        {/* Seções dos Termos */}
        <div className="bg-white dark:bg-[#0E1A2E] rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-8 shadow-sm">
          {/* 1. Objeto e Escopo do Serviço */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="text-emerald-600 dark:text-emerald-400">1.</span>
              Objeto e Escopo dos Serviços
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              O Orbis Protocol disponibiliza ambiente de software em nuvem (SaaS) voltado a:
            </p>
            <ul className="list-disc list-inside text-sm text-slate-600 dark:text-slate-300 space-y-1.5 pl-2">
              <li>
                Leitura, conferência e reconciliação fiscal de arquivos XML/DANFE de Notas Fiscais
                Eletrônicas (NF-e) de desmonte veicular, sucatas metálicas e materiais recicláveis;
              </li>
              <li>
                Geração de <strong>Atestados Orbis de Participação</strong> e passaportes digitais
                de lote, com hash criptográfico SHA-256 auditável;
              </li>
              <li>
                Painéis analíticos agregados para associações parceiras (como a Associação Comercial
                do Paraná — ACP), sob estrita regra de privacidade diferencial e anonimização
                (mínimo de 3 empresas participantes para exibição de métricas agregadas);
              </li>
              <li>
                Estimativa indicativa de emissões de CO₂e evitadas pelo reaproveitamento de
                materiais, atribuídas aos centros de desmonte e adquirentes cadastrados.
              </li>
            </ul>
          </section>

          {/* 2. Rótulos Públicos e Proibições Terminológicas */}
          <section className="space-y-3 border-t border-slate-100 dark:border-slate-800/80 pt-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="text-emerald-600 dark:text-emerald-400">2.</span>
              Rótulos Oficiais e Proibições Terminológicas
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Para preservar a segurança jurídica das empresas participantes e combater práticas de
              greenwashing, o uso da plataforma sujeita-se às seguintes diretrizes terminológicas
              estritas:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-3.5 rounded-lg border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/20 text-xs space-y-1">
                <span className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Rótulos Autorizados:
                </span>
                <p className="text-slate-600 dark:text-slate-300">
                  &ldquo;Atestado Orbis&rdquo;, &ldquo;validado/confirmado&rdquo;, &ldquo;Centro de
                  Desmonte Credenciado&rdquo;, &ldquo;Estimativa dMRV de Emissões Evitadas&rdquo;,
                  &ldquo;Prova Documental da Economia Circular&rdquo;.
                </p>
              </div>

              <div className="p-3.5 rounded-lg border border-red-200 dark:border-red-900/60 bg-red-50/50 dark:bg-red-950/20 text-xs space-y-1">
                <span className="font-bold text-red-800 dark:text-red-300 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Rótulos Proibidos (Vedação Absoluta):
                </span>
                <p className="text-slate-600 dark:text-slate-300">
                  É expressamente vedado ao Usuário referir-se aos relatórios como
                  &ldquo;Certificação Oficial&rdquo;, &ldquo;Selo Oficial&rdquo;, &ldquo;Crédito de
                  Carbono Homologado&rdquo; ou reivindicar homologação de órgão estatal sem o
                  respectivo laudo específico de autoridade externa competente.
                </p>
              </div>
            </div>
          </section>

          {/* 3. Cadastro, Veracidade e Proteção de Credenciais */}
          <section className="space-y-3 border-t border-slate-100 dark:border-slate-800/80 pt-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="text-emerald-600 dark:text-emerald-400">3.</span>
              Cadastro, Veracidade das Informações e Credenciais
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              O acesso à plataforma exige cadastro formal com CNPJ, e-mail corporativo válido e
              senha robusta (mínimo de 8 caracteres). O Usuário declara que:
            </p>
            <ul className="list-disc list-inside text-sm text-slate-600 dark:text-slate-300 space-y-1.5 pl-2">
              <li>
                Possui poderes de representação legítimos da pessoa jurídica indicada ou atua como
                responsável técnico credenciado;
              </li>
              <li>
                Todos os documentos fiscais (XMLs de NF-e) e laudos submetidos são autênticos,
                emitidos junto à SEFAZ competente e livres de adulteração;
              </li>
              <li>
                Não compartilhará suas credenciais de acesso com terceiros não autorizados, sendo
                integralmente responsável por qualquer operação realizada sob sua conta;
              </li>
              <li>
                Certificados digitais A1 eventualmente utilizados para leitura automática de NF-e
                são processados exclusivamente em memória volátil de curta duração para fins de
                consulta na SEFAZ,{' '}
                <strong>nunca sendo armazenados em texto puro ou exportados</strong>.
              </li>
            </ul>
          </section>

          {/* 4. Limitação de Responsabilidade e Metodologia dMRV */}
          <section className="space-y-3 border-t border-slate-100 dark:border-slate-800/80 pt-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="text-emerald-600 dark:text-emerald-400">4.</span>
              Limitação de Responsabilidade e Incerteza Metodológica
            </h2>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
              <p>
                Os fatores de emissão adotados (worldsteel para aço 2,18 tCO₂e/t; IAI 2024 para
                alumínio 14,40 tCO₂e/t; ICA para cobre 4,10 tCO₂e/t; fatores regionais brasileiros e
                setoriais) constituem parâmetros médios de literatura científica internacional e
                padrões GHG Protocol.
              </p>
              <p>
                Em decorrência das variações naturais de ligas, rotas de reciclagem e fontes
                energéticas regionais, todos os cálculos admitem margem de incerteza estimada
                (habitualmente na faixa de ±2,5% a ±5,0% em lotes auditados), expressa formalmente
                nos passaportes técnicos.
              </p>
              <p className="font-semibold text-slate-800 dark:text-slate-200">
                A Operadora e a Associação Comercial do Paraná (ACP) não respondem por decisões de
                investimento, compensações regulatórias fiscais perante a Receita Federal ou
                reivindicações contratuais privadas realizadas sem auditoria independente prévia do
                adquirente.
              </p>
            </div>
          </section>

          {/* 5. Vínculo ao Piloto ACP e Regras Anti-Dedução */}
          <section className="space-y-3 border-t border-slate-100 dark:border-slate-800/80 pt-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="text-emerald-600 dark:text-emerald-400">5.</span>
              Adesão ao Piloto ACP e Proteção de Dados Concorrenciais
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Empresas cadastradas via convite da Associação Comercial do Paraná (papel{' '}
              <code className="text-xs font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-emerald-600 dark:text-emerald-400">
                cliente_acp
              </code>
              ) usufruem do programa piloto de 15 dias e franquia de 5 notas fiscais processadas. Em
              contrapartida à participação setorial:
            </p>
            <ul className="list-disc list-inside text-sm text-slate-600 dark:text-slate-300 space-y-1.5 pl-2">
              <li>
                Os indicadores agregados exibidos no Painel ACP obedecem à regra de{' '}
                <strong>anonimização por agregação mínima</strong> (nenhuma métrica de emissões é
                exibida publicamente sem ao menos 3 empresas participantes ativas na amostra);
              </li>
              <li>
                Não são expostos faturamentos, volumes específicos por item nem fornecedores de uma
                empresa a outras associadas concorrentes;
              </li>
              <li>
                A ACP atua como entidade articuladora setorial e parceira institucional, sem acesso
                individualizado a segredos industriais ou margens comerciais das empresas
                participantes.
              </li>
            </ul>
          </section>

          {/* 6. Proteção de Dados e Privacidade (LGPD) */}
          <section className="space-y-3 border-t border-slate-100 dark:border-slate-800/80 pt-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="text-emerald-600 dark:text-emerald-400">6.</span>
              Proteção de Dados Pessoais e Conformidade LGPD
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              O tratamento de dados pessoais (nome, e-mail, telefone corporativo, cargo e IP de
              acesso) é regido integralmente pela nossa{' '}
              <Link
                to="/privacidade"
                className="text-emerald-600 dark:text-emerald-400 underline font-semibold inline-flex items-center gap-1"
              >
                Política de Privacidade
                <ExternalLink className="w-3 h-3 inline" />
              </Link>
              , em estrito cumprimento à Lei Geral de Proteção de Dados Pessoais (Lei 13.709/2018).
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              O consentimento para tratamento desses dados, bem como o aceite destes Termos de Uso,
              é colhido mediante <strong>checkbox obrigatório</strong> no momento do cadastro e fica
              registrado com data/hora em padrão ISO UTC, identificador de versão documental e
              endereço IP de origem.
            </p>
          </section>

          {/* 7. Propriedade Intelectual e Proteção de Segredos */}
          <section className="space-y-3 border-t border-slate-100 dark:border-slate-800/80 pt-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="text-emerald-600 dark:text-emerald-400">7.</span>
              Propriedade Intelectual e Segredos de Negócio (Opção B)
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              A arquitetura do motor dMRV, a metodologia DM-ORB-001, a biblioteca de NCMs
              reconciliados e a tabela de fatores de emissão constituem propriedade intelectual
              exclusiva da Controladora.
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Sob a <strong>Opção B de blindagem pericial</strong>, o Usuário concorda que os
              fatores numéricos internos são apresentados de forma contextualizada nos laudos e
              passaportes vinculados ao hash da nota, não sendo permitida a raspagem sistemática
              (scraping), engenharia reversa ou reprodução comercial não autorizada do catálogo
              fechado de fatores.
            </p>
          </section>

          {/* 8. Foro e Disposições Gerais */}
          <section className="space-y-3 border-t border-slate-100 dark:border-slate-800/80 pt-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="text-emerald-600 dark:text-emerald-400">8.</span>
              Foro Competente e Disposições Finais
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Estes Termos de Uso são regidos pelas leis da República Federativa do Brasil. Para
              dirimir quaisquer controvérsias decorrentes deste contrato, fica eleito o Foro Central
              da Comarca da Região Metropolitana de Curitiba, Estado do Paraná, com renúncia
              expressa a qualquer outro, por mais privilegiado que seja.
            </p>
            <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 space-y-1">
              <p>
                <strong>Controladora Contratual:</strong> {CONTATO_CONTROLADOR_LGPD.razaoSocial} —
                CNPJ {CONTATO_CONTROLADOR_LGPD.cnpj}
              </p>
              <p>
                <strong>Canal Oficial de Atendimento:</strong>{' '}
                <a
                  href={`mailto:${CONTATO_CONTROLADOR_LGPD.emailContato}`}
                  className="underline text-emerald-600 dark:text-emerald-400"
                >
                  {CONTATO_CONTROLADOR_LGPD.emailContato}
                </a>{' '}
                ou{' '}
                <a
                  href={`mailto:${CONTATO_CONTROLADOR_LGPD.canalDpo}`}
                  className="underline text-emerald-600 dark:text-emerald-400"
                >
                  {CONTATO_CONTROLADOR_LGPD.canalDpo}
                </a>
              </p>
            </div>
          </section>

          {/* Botões de Ação Inferiores */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <Link
              to="/privacidade"
              className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              <span>Ler Política de Privacidade LGPD</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            <div className="flex items-center gap-3">
              <Link
                to="/registro"
                className="px-4 py-2 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
              >
                Criar Conta na Plataforma
              </Link>
              <Link
                to="/login"
                className="px-4 py-2 rounded-lg text-xs font-medium border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Acessar Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
