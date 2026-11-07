import React from 'react'
import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react'
import { AcpSlide } from './AcpSlide'

const TOTAL = 7

interface Opcao {
  letra: string
  nome: string
  resumo: string
  custo: string
  prazo: string
  risco: string
  pros: string[]
  contras: string[]
  recomendacao?: string
}

const opcoes: Opcao[] = [
  {
    letra: 'a',
    nome: 'Uso direto da plataforma (sem integração)',
    resumo:
      'Cada associado cria sua própria conta no Orbis; a ACP atua como canal de indicação com link/cupom de afiliado.',
    custo: 'Zero de engenharia',
    prazo: 'Imediato',
    risco: 'Baixíssimo',
    pros: [
      'Custo zero e início imediato — funciona hoje',
      'Estrutura de afiliados/comissões já existe na plataforma',
      'Aprendizado de preço por porte antes de investir em integração',
    ],
    contras: [
      'Conversão depende da força do canal ACP em divulgar',
      'Sem visão consolidada para a ACP do que os associados usam',
    ],
    recomendacao: 'RECOMENDADO COMO PONTO DE PARTIDA — Fase 1 do roadmap.',
  },
  {
    letra: 'b',
    nome: 'API ligando os sistemas da ACP ao Orbis',
    resumo:
      'Se a ACP tiver sistema próprio de associados (cadastro, faturamento), integra via API: criação de contas, provisionamento e conciliação de comissões.',
    custo: 'Médio (engenharia dedicada)',
    prazo: 'Semanas a meses, conforme escopo',
    risco: 'Médio (manutenção de integração entre partes)',
    pros: [
      'Onboarding automático do associado a partir do sistema da ACP',
      'Comissão calculada e conciliada sem esforço manual',
      'A API pública do Orbis já existe em parte (Verificador e API de CDVs)',
    ],
    contras: [
      'Depende de documentação e cooperação técnica do sistema da ACP',
      'Custo de manutenção contínua entre dois sistemas',
    ],
    recomendacao:
      'EVOLUIR PARA ESTA OPÇÃO SOMENTE se a ACP trouxer volume que justifique (ex.: dezenas de assinaturas/mês).',
  },
  {
    letra: 'c',
    nome: 'White-label / portal da ACP',
    resumo: 'Plataforma rodando com a marca da ACP, como produto próprio da entidade.',
    custo: 'Alto (desenvolvimento + marca + suporte)',
    prazo: 'Meses',
    risco: 'Alto (risco de marca e governança de produto)',
    pros: ['Máxima apropriação da marca pela ACP', 'Potencial de licença/anuidade maior'],
    contras: [
      'Custo alto antes de validar demanda',
      'Dilui a marca Orbis e complica a evolução do produto único',
      'Risco de promessas de marca da entidade sobre produto em evolução',
    ],
  },
  {
    letra: 'd',
    nome: 'Operação manual pelo Bureau',
    resumo:
      'O time Orbis/Bureau opera a plataforma em nome do associado — modelo serviço, como o Bureau ACP (R$ 7.800) já faz hoje.',
    custo: 'Custo operacional por cliente (não de código)',
    prazo: 'Imediato',
    risco: 'Baixo código, escala limitada por gente',
    pros: [
      'Já existe em produção (produto "Bureau ACP (Corporativo)")',
      'Ideal para grandes e para casos complexos',
      'Gera receita imediata sem build',
    ],
    contras: ['Não escala para a cauda de pequenos/MEI', 'Margem limitada pelo time humano'],
    recomendacao: 'MANTER para o segmento Grandes.',
  },
]

const custoCor: Record<string, string> = {
  'Zero de engenharia': 'text-emerald-700',
  'Médio (engenharia dedicada)': 'text-amber-700',
  'Alto (desenvolvimento + marca + suporte)': 'text-red-700',
  'Custo operacional por cliente (não de código)': 'text-blue-700',
}

export const Slide4AnaliseTecnica: React.FC = () => (
  <AcpSlide
    id={4}
    total={TOTAL}
    badge="ANÁLISE TÉCNICA — O CAMINHO CORRETO"
    title="API ligando ao nosso sistema ou uso direto?"
    subtitle="A pergunta central respondida com honestidade: comparar as quatro formas de levar o Orbis aos associados, com custo, prazo, risco e recomendação fundamentada."
    footnote="Estado atual que fundamenta a recomendação: PagBank (credencial pendente) • API pública parcial (Verificador, API de CDVs) • afiliados/comissões já operantes"
  >
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-5">
      {opcoes.map((o) => (
        <div
          key={o.letra}
          className={`p-5 sm:p-6 rounded-xl border space-y-3 ${
            o.recomendacao ? 'border-emerald-300 bg-emerald-50/40' : 'border-slate-200 bg-white'
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-bold text-base sm:text-lg text-slate-900">
              ({o.letra}) {o.nome}
            </h3>
            {o.recomendacao && (
              <span className="shrink-0 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-600 text-white">
                RECOMENDADO
              </span>
            )}
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">{o.resumo}</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-mono">
            <span className={custoCor[o.custo] ?? 'text-slate-600'}>Custo: {o.custo}</span>
            <span className="text-slate-600">Prazo: {o.prazo}</span>
            <span className="text-slate-600">Risco: {o.risco}</span>
          </div>
          <ul className="space-y-1.5 text-xs sm:text-sm text-slate-600">
            {o.pros.map((p) => (
              <li key={p} className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{p}</span>
              </li>
            ))}
            {o.contras.map((c) => (
              <li key={c} className="flex items-start gap-2">
                {o.recomendacao ? (
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                )}
                <span className="leading-relaxed">{c}</span>
              </li>
            ))}
          </ul>
          {o.recomendacao && (
            <p className="text-xs font-semibold text-emerald-800 border-t border-emerald-200 pt-3">
              {o.recomendacao}
            </p>
          )}
        </div>
      ))}
    </div>

    <div className="p-4 sm:p-5 rounded-xl bg-slate-900 text-slate-100 text-sm leading-relaxed">
      <strong className="text-emerald-400">Recomendação fundamentada:</strong> partir de (a) agora —
      canal de indicação com comissão ACP e cupons, custo zero e validação imediata de demanda.
      Evoluir para (b) API somente quando o volume justificar a engenharia. Manter (d) Bureau para
      grandes contas. Descartar (c) white-label nesta fase: alto custo e risco de marca antes da
      prova de demanda.
    </div>
  </AcpSlide>
)
