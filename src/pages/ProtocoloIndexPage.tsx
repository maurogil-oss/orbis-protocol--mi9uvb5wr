import React from 'react'
import { Link } from 'react-router-dom'
import {
  Scale,
  ShieldCheck,
  FileText,
  FileCode,
  Terminal,
  Database,
  ArrowRight,
  Info,
  CheckCircle2,
  Lock,
  Compass,
  AlertTriangle,
  ChevronRight,
  Calculator,
  Search,
} from 'lucide-react'

export interface DestinoProtocolo {
  titulo: string
  subtitulo: string
  descricao: string
  caminho: string
  badge: string
  icone: React.ElementType
}

export const DESTINOS_PROTOCOLO: DestinoProtocolo[] = [
  {
    titulo: 'Metodologia & Fatores Oficiais (DM-ORB-001)',
    subtitulo: 'Especificação técnica v1.2 do motor dMRV e catálogo curado de fatores.',
    descricao:
      'Texto integral da norma DM-ORB-001, equações de baseline, regime de incerteza em quadratura (Tiers 1 a 4), GWP do IPCC AR6 e catálogo oficial exportável em CSV.',
    caminho: '/fatores',
    badge: 'DM-ORB-001 v1.2',
    icone: Scale,
  },
  {
    titulo: 'Consultar Atestado (Verificador Público)',
    subtitulo: 'Auditoria criptográfica de autenticidade de laudos e passaportes emitidos.',
    descricao:
      'Validação pública instantânea de qualquer hash SHA-256 e código de atestado, sem necessidade de login. Consulta aberta para compradores, bancos e auditores.',
    caminho: '/verificador',
    badge: 'SHA-256 Público',
    icone: ShieldCheck,
  },
  {
    titulo: 'Radar Regulatório',
    subtitulo: 'Calendário de prazos da reforma tributária, marco do SBCE e diretrizes ESG.',
    descricao:
      'Acompanhamento normativo contínuo dos marcos vigentes: LC 214/2025, Lei 15.042/2024 (SBCE), Lei 14.902/2024 (MOVER), Resolução CVM 244/2026 e IFRS S1/S2.',
    caminho: '/radar-regulatorio',
    badge: 'Normas Oficiais',
    icone: Compass,
  },
  {
    titulo: 'API de Ingestão CDV v2 (Documentação Técnica)',
    subtitulo: 'Especificação de integração de lotes de desmontagem veicular.',
    descricao:
      'Contrato REST completo, autenticação por Header X-API-Key, rate-limiting de 60 lotes/min, payloads cURL e tratamento de HTTP 409 para duplicidade de chassis.',
    caminho: '/api-docs-cdv',
    badge: 'REST v2',
    icone: Terminal,
  },
  {
    titulo: 'API de NFs v1 (Documentação ERP)',
    subtitulo: 'Recepção automatizada de XMLs de NF-e/NFC-e diretamente do faturamento.',
    descricao:
      'Ingestão contínua de documentos fiscais sem upload manual, validação estrita de CNPJ vinculado para sigilo fiscal e apuração instantânea de créditos.',
    caminho: '/api-docs-nfs',
    badge: 'REST v1',
    icone: FileCode,
  },
]

export default function ProtocoloIndexPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0A1628] text-slate-900 dark:text-[#F8FAFC] transition-colors">
      {/* 1. HERO INSTITUCIONAL DO HUB PROTOCOLO */}
      <section
        aria-label="Apresentação do Hub Protocolo"
        className="py-14 sm:py-20 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0A1628] relative overflow-hidden"
      >
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-400 text-xs font-mono font-semibold uppercase tracking-wider mb-4">
              <Scale className="w-3.5 h-3.5 stroke-[1.8]" />
              HUB METODOLÓGICO & REGULATÓRIO
            </div>
            <h1 className="font-heading font-black text-2xl sm:text-4xl md:text-5xl text-slate-900 dark:text-white tracking-tight mb-4">
              O Protocolo Orbis
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
              Toda a fundação técnica, referências científicas, equações de baseline e
              especificações de integração do motor analítico dMRV reunidas em um único ponto.
            </p>
          </div>

          {/* 2. RESUMO LEIGO DA METODOLOGIA (Em Linguagem Simples) */}
          <div className="p-6 sm:p-10 rounded-3xl bg-slate-900 text-white dark:bg-[#0E1A2E] dark:text-[#F8FAFC] border border-slate-800 dark:border-slate-700 shadow-xl space-y-6">
            <div className="flex items-center gap-2.5 pb-4 border-b border-slate-800 dark:border-slate-800">
              <Info className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-emerald-400 block">
                  TRANSPARÊNCIA SEM JARGÕES
                </span>
                <h2 className="font-heading font-black text-lg sm:text-2xl text-white">
                  Como calculamos a pegada e por que ela é defensável
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs sm:text-sm text-slate-300 dark:text-slate-300 leading-relaxed">
              {/* Bloco 1: A partir das notas */}
              <div className="space-y-2 p-4 rounded-2xl bg-slate-800/60 dark:bg-slate-900/60 border border-slate-700/60">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold font-mono text-sm">
                  1
                </div>
                <h3 className="font-heading font-bold text-base text-white">
                  A partir das notas reais, não de estimativas
                </h3>
                <p>
                  O produto central é a <strong>pegada de carbono das notas fiscais</strong>. Em vez
                  de estimativas setoriais genéricas, lemos os dados reais de cada item na NF-e/SPED
                  (NCM, peso líquido, insumos e energia), cruzando insumo por insumo com o motor de
                  cálculo.
                </p>
              </div>

              {/* Bloco 2: De onde vêm os fatores */}
              <div className="space-y-2 p-4 rounded-2xl bg-slate-800/60 dark:bg-slate-900/60 border border-slate-700/60">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold font-mono text-sm">
                  2
                </div>
                <h3 className="font-heading font-bold text-base text-white">
                  De onde vêm os fatores de emissão
                </h3>
                <p>
                  Usamos bases científicas e oficiais públicas: <strong>IPCC AR6</strong> (GWP de
                  100 anos), matriz do <strong>SIN / MCTI</strong> para energia elétrica brasileira,
                  tabela oficial <strong>IAI 2024</strong> (alumínio 14,40),{' '}
                  <strong>worldsteel</strong> (aço 2,18) e<strong> ICA</strong> (cobre 4,10).
                  Fatores pendentes de auditoria regional carregam flag transparente.
                </p>
              </div>

              {/* Bloco 3: Evitado é preliminar */}
              <div className="space-y-2 p-4 rounded-2xl bg-slate-800/60 dark:bg-slate-900/60 border border-slate-700/60">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold font-mono text-sm">
                  3
                </div>
                <h3 className="font-heading font-bold text-base text-white">
                  O &quot;evitado&quot; é indicador preliminar
                </h3>
                <p>
                  O carbono evitado calculado pelo motor é um{' '}
                  <strong className="text-amber-300">indicador preliminar de eco-eficiência</strong>
                  . Ele <strong>não constitui crédito de carbono negociável</strong> nem ativo do
                  SBCE. A emissão de créditos, caso ocorra, segue exclusivamente via organismo
                  validador independente (VVB) formalmente contratado.
                </p>
              </div>
            </div>

            {/* Aviso Canônico */}
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1 leading-relaxed">
                <strong className="text-amber-300 block font-bold">
                  Compromisso com o rigor pericial e legal:
                </strong>
                <span>
                  O Orbis Protocol emite o{' '}
                  <strong>Atestado de Conformidade Orbis (com ART/RRT)</strong> acoplada por perito
                  técnico legalmente habilitado. Não vendemos nem prometemos certificações
                  fantasiosas. A chancela pericial assegura defesa formal perante auditorias
                  fiscais, bancos e compradores da cadeia de suprimentos.
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. GRID DAS PÁGINAS-FILHAS DO PROTOCOLO */}
      <section
        id="paginas-protocolo"
        aria-label="Páginas do Hub Protocolo"
        className="py-16 md:py-24 bg-slate-100/60 dark:bg-[#070D18]"
      >
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="mb-10">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-700 dark:text-[#059669] block mb-2">
              DOCUMENTOS & FERRAMENTAS
            </span>
            <h2 className="font-heading font-black text-2xl sm:text-3xl text-slate-900 dark:text-white">
              Páginas de Metodologia, Verificação e APIs
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-[#94A3B8] mt-1 max-w-2xl">
              Navegue pelas especificações metodológicas, ferramentas públicas de consulta e
              documentações técnicas de integração do protocolo.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {DESTINOS_PROTOCOLO.map((destino) => {
              const Icone = destino.icone

              return (
                <Link
                  key={destino.caminho}
                  to={destino.caminho}
                  className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-slate-800 hover:border-emerald-500/60 dark:hover:border-emerald-500/60 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900">
                        {destino.badge}
                      </span>
                      <Icone className="w-5 h-5 text-slate-400 group-hover:text-emerald-600 transition-colors" />
                    </div>

                    <h3 className="font-heading font-bold text-lg sm:text-xl text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      {destino.titulo}
                    </h3>

                    <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                      {destino.subtitulo}
                    </p>

                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {destino.descricao}
                    </p>
                  </div>

                  <div className="pt-5 mt-5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                    <span>Acessar documento</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </section>
    </div>
  )
}
