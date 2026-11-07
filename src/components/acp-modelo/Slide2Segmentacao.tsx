import React from 'react'
import { Store, Building, Building2, Landmark } from 'lucide-react'
import { AcpSlide } from './AcpSlide'

const TOTAL = 7

interface Pacote {
  icon: typeof Store
  segmento: string
  produto: string
  preco: string
  publico: string
  dor: string
  inclui: string[]
  utilidade: string
}

const pacotes: Pacote[] = [
  {
    icon: Store,
    segmento: 'MEI / Micro',
    produto: '"Meu Enquadramento"',
    preco: 'Gratuito ou simbólico (proposto)',
    publico: 'MEIs e microempresas associadas à ACP',
    dor: 'Não sabe se está enquadrado corretamente; vive com medo de multa e autuação.',
    inclui: [
      'Diagnóstico simplificado de situação empresarial pelo CNPJ (funil gratuito já existente)',
      'Enquadramento tributário e regulatório (situação INFORMADA pela empresa, nunca central)',
      'Checklist de obrigações por porte/atividade',
    ],
    utilidade:
      'Porta de entrada da parceria ACP: gera cadastro qualificado na plataforma e trilha natural de upgrade quando a empresa cresce.',
  },
  {
    icon: Building,
    segmento: 'Pequenas',
    produto: 'Assinatura Essencial + "Conformidade Empresarial"',
    preco: 'R$ 59/mês (até 10 CNPJs) — proposto',
    publico: 'Pequenas empresas com até 10 CNPJs',
    dor: 'Clientes grandes e bancos começam a pedir dados ambientais que a empresa não sabe produzir.',
    inclui: [
      'Tudo do plano Essencial existente',
      'Pacote Conformidade Empresarial: enquadramento, responsabilidades e documentos carregados conforme os modelos da plataforma',
      'Atestado Orbis verificável para apresentar a clientes',
    ],
    utilidade:
      'Comprovar descarbonização a banco/conselho e atender às primeiras exigências de clientes maiores sem contratar consultoria externa.',
  },
  {
    icon: Building2,
    segmento: 'Médias',
    produto: 'Assinatura Profissional + Aconselhamento + Contador',
    preco: 'R$ 149/mês (11–50 CNPJs) — proposto',
    publico: 'Médias empresas, often múltiplas filiais',
    dor: 'Conformidade dispersa entre sócios, contador e operação; nada consolidado para auditoria.',
    inclui: [
      'Tudo do plano Profissional existente',
      'Reuniões de aconselhamento periódicas (mensal/trimestral) com agenda consultiva',
      'Canal com o contador da empresa: acesso próprio e upload de documentos pelos modelos',
    ],
    utilidade:
      'Conformidade Lei 15.042/2024 e IFRS S2 em evolução contínua, com o contador integrado ao mesmo dossiê documental.',
  },
  {
    icon: Landmark,
    segmento: 'Grandes',
    produto: 'Assinatura Corporativo e/ou Bureau ACP',
    preco: 'R$ 249/mês (51+ CNPJs) e/ou Bureau R$ 7.800 — proposto',
    publico: 'Grandes empresas e grupos com cadeia de fornecedores',
    dor: 'Pressão de escopo 3: precisa que a cadeia comprove práticas, não apenas declare boas intenções.',
    inclui: [
      'Tudo do plano Corporativo existente',
      'Gestão de cadeia fornecedora com passaportes de fornecedor e revelação seletiva',
      'Dossiê BRDE/Fomento e curva MAC para priorizar investimentos de descarbonização',
    ],
    utilidade:
      'Res. BCB 4.945 e requisitos ESG de financiamento atendidos com prova documental, não com declaração.',
  },
]

export const Slide2Segmentacao: React.FC = () => (
  <AcpSlide
    id={2}
    total={TOTAL}
    badge="SEGMENTAÇÃO DOS ASSOCIADOS"
    title="Quatro pacotes, um por porte"
    subtitle="Cada pacote combina uma assinatura existente da plataforma com camadas de serviço. Valores PROPOSTOS — sujeitos a aprovação conjunta Orbis × ACP."
    footnote="Regras comerciais comuns: trial de 15 dias sem cartão • limite de 5 notas com bloqueio suave • cancelamento sem multa • upgrade imediato, downgrade no ciclo seguinte • PIX/crédito/débito via PagBank (credencial pendente)"
  >
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-5">
      {pacotes.map(({ icon: Icon, segmento, produto, preco, publico, dor, inclui, utilidade }) => (
        <div
          key={segmento}
          className="p-5 sm:p-6 rounded-xl border border-slate-200 bg-white space-y-3 flex flex-col"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 shrink-0">
                <Icon className="w-4.5 h-4.5" />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-base text-slate-900 truncate">{segmento}</h3>
                <p className="text-xs text-slate-500 truncate">{publico}</p>
              </div>
            </div>
            <span className="shrink-0 px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              {preco}
            </span>
          </div>

          <p className="text-sm font-semibold text-slate-800">{produto}</p>
          <p className="text-xs text-slate-500 leading-relaxed">
            <strong className="text-slate-700">Dor principal:</strong> {dor}
          </p>

          <ul className="space-y-1.5 text-sm text-slate-600">
            {inclui.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0" />
                <span className="leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>

          <p className="text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
            <strong className="text-emerald-700">Utilidade real:</strong> {utilidade}
          </p>
        </div>
      ))}
    </div>

    <div className="p-4 sm:p-5 rounded-xl bg-blue-50 border border-blue-200 text-sm text-blue-900 leading-relaxed">
      <strong>Comissão sugerida para a ACP:</strong> percentual de indicação sobre a primeira
      assinatura e recorrente enquanto durar a relação, pela estrutura de afiliados/comissões já
      configurável na plataforma. Hipótese de trabalho: <strong>10% no 1º ano</strong> (recorrente
      mensal) e <strong>5% renovatório</strong> — valor final a decidir na próxima reunião.
    </div>
  </AcpSlide>
)
