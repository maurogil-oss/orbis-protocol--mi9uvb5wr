import React from 'react'
import { Link } from 'react-router-dom'
import {
  ShieldCheck,
  Building2,
  Users,
  Compass,
  FileCheck2,
  Mail,
  ExternalLink,
  ChevronRight,
  Sparkles,
  AlertCircle,
  Award,
  Layers,
  ArrowRight,
  Info,
} from 'lucide-react'

export default function EquipePage() {
  return (
    <div className="min-h-screen py-10 md:py-16 bg-slate-50 dark:bg-[#0A1628] text-slate-900 dark:text-[#F8FAFC] transition-colors">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 space-y-12">
        {/* Breadcrumb / Top Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-500 dark:text-[#94A3B8]">
            <Link
              to="/"
              className="hover:text-emerald-600 dark:hover:text-[#059669] transition-colors"
            >
              Orbis Protocol
            </Link>
            <ChevronRight className="w-3.5 h-3.5 opacity-40" />
            <span className="text-emerald-600 dark:text-[#059669] font-semibold">
              Estrutura Operacional & Governança
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-[#059669]/15 border border-emerald-300 dark:border-[#059669]/40 text-emerald-700 dark:text-[#059669] text-[11px] font-mono font-bold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-[#059669] animate-pulse" />
              Operação Ativa • MGM Consultoria
            </span>
          </div>
        </div>

        {/* Hero Institucional */}
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-white via-slate-50 to-white dark:from-[#0E1A2E] dark:via-[#111827] dark:to-[#0E1A2E] border border-emerald-300 dark:border-[#059669]/40 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-[#16202B] border border-emerald-300 dark:border-[#059669]/40 text-emerald-700 dark:text-[#059669] text-xs font-mono font-bold uppercase tracking-wider">
              <Building2 className="w-3.5 h-3.5 text-emerald-600 dark:text-[#059669]" />
              <span>Transparência Institucional & Governança B2B</span>
            </div>

            <h1 className="font-heading font-black text-3xl sm:text-5xl text-slate-900 dark:text-[#F8FAFC] tracking-tight">
              Quem opera o Orbis Protocol
            </h1>

            <p className="text-base sm:text-lg text-emerald-700 dark:text-[#059669] font-medium leading-relaxed">
              Infraestrutura tecnológica de prova documental, dados auditáveis (dMRV) e governança
              pericial independente.
            </p>

            <p className="text-sm sm:text-base text-slate-600 dark:text-[#94A3B8] leading-relaxed">
              A plataforma é operada institucionalmente pela{' '}
              <strong className="text-slate-900 dark:text-[#F8FAFC]">
                MGM Consultoria Empresarial Ltda
              </strong>{' '}
              (CNPJ{' '}
              <span className="font-mono font-bold text-amber-700 dark:text-[#D9B36C]">
                19.598.964/0001-01
              </span>
              ). O Orbis Protocol atua estritamente como{' '}
              <strong>infraestrutura de prova documental probatória</strong> para mensuração,
              cálculo conservador e custódia de dados —{' '}
              <strong>não é emissor nem originador de créditos de carbono</strong>.
            </p>

            <div className="pt-2 flex flex-wrap gap-2 text-xs">
              <span className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-[#111827] text-slate-700 dark:text-[#94A3B8] border border-slate-200 dark:border-slate-800 font-mono">
                CNPJ: 19.598.964/0001-01
              </span>
              <span className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-[#111827] text-slate-700 dark:text-[#94A3B8] border border-slate-200 dark:border-slate-800">
                Sede: Curitiba / PR
              </span>
              <span className="px-3 py-1 rounded-lg bg-emerald-50 dark:bg-[#059669]/10 text-emerald-700 dark:text-[#059669] border border-emerald-200 dark:border-[#059669]/30 font-medium">
                Papel: Operadora de Tecnologia & dMRV
              </span>
            </div>
          </div>
        </div>

        {/* Posicionamento Claro & Honestidade Pública */}
        <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 text-xs sm:text-sm text-slate-600 dark:text-[#94A3B8] leading-relaxed">
          <div className="flex items-center gap-3 pb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-[#D9B36C]/10 border border-amber-200 dark:border-[#D9B36C]/30 flex items-center justify-center text-amber-700 dark:text-[#D9B36C]">
              <Info className="w-4 h-4" />
            </div>
            <h2 className="font-heading font-bold text-base text-slate-900 dark:text-[#F8FAFC]">
              Posicionamento Institucional & Princípios de Integridade
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0A1628] border border-slate-200 dark:border-slate-800 space-y-2">
              <strong className="text-slate-900 dark:text-[#F8FAFC] text-xs font-heading font-bold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-600 dark:bg-[#059669]" />
                O que o Orbis Protocol faz
              </strong>
              <ul className="space-y-1.5 text-xs list-disc list-inside text-slate-600 dark:text-[#94A3B8]">
                <li>Infraestrutura digital de prova documental e cálculo rastreável (dMRV).</li>
                <li>
                  Emissão do Atestado de Conformidade Orbis com ART/RRT de perito credenciado.
                </li>
                <li>Armazenamento de hashes SHA-256 em trilha probatória imutável.</li>
                <li>
                  Leitura antecipada de pegada tributária e de carbono via Orbis LPF e SPED/NF-e.
                </li>
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0A1628] border border-slate-200 dark:border-slate-800 space-y-2">
              <strong className="text-slate-900 dark:text-[#F8FAFC] text-xs font-heading font-bold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-600 dark:bg-[#D9B36C]" />
                O que o Orbis Protocol NÃO faz
              </strong>
              <ul className="space-y-1.5 text-xs list-disc list-inside text-slate-600 dark:text-[#94A3B8]">
                <li>Não é órgão certificador ou homologador externo.</li>
                <li>
                  Não emite créditos de carbono transacionáveis sem validação de VVB credenciado.
                </li>
                <li>Não substitui o papel do CREA, CAU, CFT ou órgãos reguladores ambientais.</li>
                <li>
                  Não gera "selos oficiais" governamentais — atua na esfera probatória privada.
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Papéis de Atuação / Estrutura Operacional (Sem Pessoas Fictícias) */}
        <section className="space-y-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-emerald-600 dark:text-[#059669] font-bold">
              <Users className="w-4 h-4" />
              <span>Estrutura de Atuação</span>
            </div>
            <h2 className="font-heading font-black text-2xl sm:text-3xl text-slate-900 dark:text-[#F8FAFC] mt-1">
              Papéis Operacionais & Responsabilidades
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-[#94A3B8] max-w-2xl mt-1">
              A governança da plataforma é estruturada por papéis auditáveis, garantindo segregação
              de funções entre a operadora tecnológica, a rede técnica credenciada e os canais
              comerciais.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Card 1: Governança e Gestão Master */}
            <div className="p-6 rounded-2xl bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-[#059669]/10 border border-emerald-200 dark:border-[#059669]/30 flex items-center justify-center text-emerald-700 dark:text-[#059669]">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-mono uppercase font-bold text-emerald-700 dark:text-[#059669] px-2 py-0.5 rounded bg-emerald-50 dark:bg-[#059669]/10 border border-emerald-200 dark:border-[#059669]/30">
                    Operação Central
                  </span>
                  <h3 className="font-heading font-bold text-lg text-slate-900 dark:text-[#F8FAFC] pt-1">
                    Governança e Gestão Master
                  </h3>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-[#94A3B8] leading-relaxed">
                  Operada pela equipe interna da MGM Consultoria. Responsável exclusiva pela
                  aprovação e validação de novos cadastros corporativos, governança de papéis de
                  usuários (Gestor Master), controle de integridade da base de dados e custódia da
                  chave institucional.
                </p>
                <div className="pt-2 text-xs text-slate-500 dark:text-[#94A3B8] space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-600 dark:text-[#059669] font-bold">✓</span>
                    <span>Segregação estrita de privilégios de acesso</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-600 dark:text-[#059669] font-bold">✓</span>
                    <span>Auditoria centralizada com log imutável de ações master</span>
                  </div>
                </div>
              </div>

              {/* Bloco discreto para inclusão futura dos nomes/biografias reais */}
              {/* TODO: Incluir foto, nome e mini-bio dos membros da Governança Master assim que os dados forem fornecidos formalmente pela MGM */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-400 dark:text-[#94A3B8]/60 flex items-center gap-2 italic">
                <span>Identificação institucional formalizada no CNPJ 19.598.964/0001-01</span>
              </div>
            </div>

            {/* Card 2: Coordenação Técnica & Perícia Credenciada */}
            <div className="p-6 rounded-2xl bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-[#2563EB]/10 border border-blue-200 dark:border-[#2563EB]/30 flex items-center justify-center text-blue-600 dark:text-[#60A5FA]">
                  <FileCheck2 className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-mono uppercase font-bold text-blue-700 dark:text-[#60A5FA] px-2 py-0.5 rounded bg-blue-50 dark:bg-[#2563EB]/10 border border-blue-200 dark:border-[#2563EB]/30">
                    Rede Independente
                  </span>
                  <h3 className="font-heading font-bold text-lg text-slate-900 dark:text-[#F8FAFC] pt-1">
                    Coordenação Técnica & Perícia Independente
                  </h3>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-[#94A3B8] leading-relaxed">
                  Rede de peritos técnicos, engenheiros ambientais e contadores credenciados com
                  emissão de Anotação de Responsabilidade Técnica (ART via CREA), RRT (CAU) ou TRT
                  (CFT). Cada laudo ou atestado pericial é assinado pelo profissional habilitado com
                  fé pública.
                </p>
                <div className="pt-2 text-xs text-slate-500 dark:text-[#94A3B8] space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-blue-600 dark:text-[#60A5FA] font-bold">✓</span>
                    <span>Responsabilidade técnica individual via ART/RRT/TRT</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-blue-600 dark:text-[#60A5FA] font-bold">✓</span>
                    <span>Tabela pública de honorários com teto por porte</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                <Link
                  to="/credenciamento"
                  className="text-xs font-semibold text-blue-600 dark:text-[#60A5FA] hover:underline flex items-center gap-1"
                >
                  <span>Portal de Credenciamento Pericial</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <Link
                  to="/trilhas/peritos-tecnicos"
                  className="text-xs text-slate-500 dark:text-[#94A3B8] hover:text-slate-800 dark:hover:text-white"
                >
                  Ver Trilha →
                </Link>
              </div>
            </div>

            {/* Card 3: Suporte e Atendimento Comercial */}
            <div className="p-6 rounded-2xl bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-[#059669]/10 border border-emerald-200 dark:border-[#059669]/30 flex items-center justify-center text-emerald-700 dark:text-[#059669]">
                  <Mail className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-mono uppercase font-bold text-emerald-700 dark:text-[#059669] px-2 py-0.5 rounded bg-emerald-50 dark:bg-[#059669]/10 border border-emerald-200 dark:border-[#059669]/30">
                    Canais Oficiais
                  </span>
                  <h3 className="font-heading font-bold text-lg text-slate-900 dark:text-[#F8FAFC] pt-1">
                    Suporte & Contato Comercial
                  </h3>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-[#94A3B8] leading-relaxed">
                  Canais institucionais operados pela equipe de atendimento aos clientes,
                  integradores de ERP e parceiros setoriais para dúvidas sobre emissão de notas
                  fiscais, APIs, assinaturas e faturamento.
                </p>
                <div className="pt-2 text-xs space-y-2">
                  <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#0A1628] border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-slate-500 dark:text-[#94A3B8]">
                      Comercial & Novos Negócios:
                    </span>
                    <a
                      href="mailto:contato@orbis-protocol.com"
                      className="font-mono text-emerald-700 dark:text-[#059669] font-bold hover:underline"
                    >
                      contato@orbis-protocol.com
                    </a>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#0A1628] border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-slate-500 dark:text-[#94A3B8]">
                      Suporte Técnico & APIs:
                    </span>
                    <a
                      href="mailto:suporte@orbis-protocol.com"
                      className="font-mono text-emerald-700 dark:text-[#059669] font-bold hover:underline"
                    >
                      suporte@orbis-protocol.com
                    </a>
                  </div>
                </div>
              </div>

              {/* TODO: Inserir fotos e nomes dos analistas responsáveis por atendimento quando formalizados */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-400 dark:text-[#94A3B8]/60">
                Atendimento de segunda a sexta, 9h às 18h (horário de Brasília)
              </div>
            </div>

            {/* Card 4: Parcerias Institucionais & Caminho Metodológico */}
            <div className="p-6 rounded-2xl bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-[#D9B36C]/10 border border-amber-200 dark:border-[#D9B36C]/30 flex items-center justify-center text-amber-700 dark:text-[#D9B36C]">
                  <Compass className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-mono uppercase font-bold text-amber-800 dark:text-[#D9B36C] px-2 py-0.5 rounded bg-amber-50 dark:bg-[#D9B36C]/10 border border-amber-200 dark:border-[#D9B36C]/30">
                    Articulação Setorial
                  </span>
                  <h3 className="font-heading font-bold text-lg text-slate-900 dark:text-[#F8FAFC] pt-1">
                    Parcerias & Caminho Metodológico
                  </h3>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-[#94A3B8] leading-relaxed">
                  Articulação com entidades associativas e câmaras setoriais (convênio comercial com
                  a Associação Comercial do Paraná — ACP) para difusão de passaportes de
                  fornecedores e sustentabilidade para PMEs associadas.
                </p>
                <div className="pt-2 text-xs text-slate-500 dark:text-[#94A3B8] space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-amber-700 dark:text-[#D9B36C] font-bold">•</span>
                    <span>Parceria ACP como canal comercial e de difusão PME</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-amber-700 dark:text-[#D9B36C] font-bold">•</span>
                    <span>Alinhamento metodológico com o padrão DM-ORB-001 v1.1</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                <Link
                  to="/solucoes/bureau-acp"
                  className="text-xs font-semibold text-amber-700 dark:text-[#D9B36C] hover:underline flex items-center gap-1"
                >
                  <span>Conhecer o Bureau ACP</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <Link
                  to="/fatores"
                  className="text-xs text-slate-500 dark:text-[#94A3B8] hover:text-slate-800 dark:hover:text-white"
                >
                  Metodologia DM-ORB →
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Bloco de Transparência Regulatória & Estado Honesto do Programa */}
        <section className="p-8 sm:p-10 rounded-3xl bg-slate-900 text-white dark:bg-[#0E1A2E] border border-slate-800 dark:border-slate-700 shadow-xl space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-amber-400 block">
                Transparência Regulatória
              </span>
              <h2 className="font-heading font-black text-xl sm:text-2xl text-[#F8FAFC]">
                Estado Honesto do Programa (Auditoria Contínua)
              </h2>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-slate-300 dark:text-[#94A3B8] leading-relaxed">
            Em estrita observância aos pareceres de conformidade e integridade da plataforma,
            apresentamos o status real e documentado de cada aspecto institucional:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#F8FAFC]">Organismo VVB</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold">
                  Em seleção
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                O Organismo de Verificação e Validação (VVB independente credenciado) encontra-se em
                processo de seleção e homologação formal. Nenhum nome é divulgado prematuramente.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#F8FAFC]">
                  Cobertura Securitária (E&O)
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold">
                  Em definição
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                A apólice corporativa contra Erros e Omissões (E&O / Responsabilidade Civil
                Profissional) está em estruturação junto a seguradoras especializadas. A
                responsabilidade técnica primária recai sobre o perito signatário via ART/RRT.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#F8FAFC]">Parceria ACP</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                  Canal comercial
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                A Associação Comercial do Paraná atua como canal comercial e parceiro de difusão
                para seus associados, disponibilizando condições exclusivas no Bureau ACP para
                cadeias de valor PME.
              </p>
            </div>
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400 border-t border-slate-800/80">
            <span>Deseja atuar como perito independente da rede Orbis Protocol?</span>
            <div className="flex items-center gap-3">
              <Link
                to="/credenciamento"
                className="text-emerald-400 hover:text-emerald-300 font-semibold underline flex items-center gap-1"
              >
                <span>Solicitar credenciamento técnico</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <span className="text-slate-600">•</span>
              <Link to="/trilhas/peritos-tecnicos" className="text-slate-300 hover:text-white">
                Ver syllabus e trilha
              </Link>
            </div>
          </div>
        </section>

        {/* CTA Final */}
        <div className="p-8 rounded-3xl bg-gradient-to-r from-emerald-900/40 via-slate-900 to-slate-900 dark:from-[#0E1A2E] dark:via-[#111827] dark:to-[#0E1A2E] border border-emerald-500/30 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1 max-w-xl">
            <h3 className="font-heading font-extrabold text-lg sm:text-xl text-slate-900 dark:text-[#F8FAFC]">
              Fale com a equipe do Orbis Protocol
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-[#94A3B8]">
              Agende uma reunião institucional, tire dúvidas sobre enquadramento no SBCE e
              integração de ERP ou solicite credenciamento de perito.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <a
              href="mailto:contato@orbis-protocol.com"
              className="px-5 py-3 rounded-xl font-bold text-xs bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-[#2563EB] dark:hover:bg-blue-600 transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              <Mail className="w-4 h-4" />
              <span>Enviar Mensagem</span>
            </a>
            <Link
              to="/diagnostico"
              className="px-5 py-3 rounded-xl font-semibold text-xs border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-[#F8FAFC] hover:bg-slate-100 dark:hover:bg-[#16202B] transition-all flex items-center justify-center gap-2"
            >
              <span>Diagnóstico Inicial</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
