import React from 'react'
import { AcpSlide } from './AcpSlide'

const TOTAL = 7

interface Fase {
  fase: string
  titulo: string
  build: string
  itens: string[]
  preRequisitos: string[]
  goNoGo: string
  cor: string
}

const fases: Fase[] = [
  {
    fase: 'Fase 1',
    titulo: 'Imediata — sem código',
    build: 'Sem build',
    cor: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    itens: [
      'Acordo comercial ACP assinado (escopo e comissão)',
      'Cupons/links de indicação de afiliado ativados na estrutura existente',
      'Divulgação nos canais da ACP (newsletter, eventos, consultoria ao associado)',
      'Venda dos planos existentes com cobrança manual (PIX/boleto enquanto PagBank pendente)',
    ],
    preRequisitos: [
      'Aprovação dos valores por porte pela diretoria',
      'Percentual de comissão definido',
    ],
    goNoGo: 'Go: acordo assinado + 1ª divulgação feita. No-go: valores indefinidos.',
  },
  {
    fase: 'Fase 2',
    titulo: 'Pequeno build',
    build: 'Pequeno',
    cor: 'bg-blue-50 border-blue-200 text-blue-700',
    itens: [
      'Página de destino dedicada aos associados ACP',
      'Cupom de afiliado com rastreamento de conversão',
      'Onboarding guiado do associado (primeiro diagnóstico + carga documental pelos modelos)',
    ],
    preRequisitos: [
      'Fase 1 validada: demanda real comprovada pelo canal',
      'Decisão de identidade visual da página conjunta',
    ],
    goNoGo: 'Go: ≥ 10 assinaturas ativas via ACP. No-go: conversão < 2% dos indicados.',
  },
  {
    fase: 'Fase 3',
    titulo: 'Médio build',
    build: 'Médio',
    cor: 'bg-amber-50 border-amber-200 text-amber-700',
    itens: [
      'Produto Enquadramento (versão tributário-regulatória)',
      'Mapa de Responsabilidades por porte/atividade',
      'Reuniões de aconselhamento com pauta automática das pendências',
      'Portal do contador (perfil dedicado, multi-empresa)',
    ],
    preRequisitos: [
      'Base de associados ativa suficientemente grande para justificar o build',
      'Priorização contra outras frentes de produto',
    ],
    goNoGo: 'Go: demanda declarada por ≥ 20 associados. No-go: churn alto na base inicial.',
  },
  {
    fase: 'Fase 4',
    titulo: 'Quando a credencial chegar',
    build: 'Integração de cobrança',
    cor: 'bg-slate-100 border-slate-300 text-slate-700',
    itens: [
      'PagBank ativo para cobrança automática recorrente',
      'Migração das assinaturas da cobrança manual para automática',
      'Conciliação automática das comissões ACP',
    ],
    preRequisitos: ['Credencial PagBank emitida e homologada em ambiente de teste'],
    goNoGo: 'Go: credencial ativa + testes de transação aprovados.',
  },
]

export const Slide5Roadmap: React.FC = () => (
  <AcpSlide
    id={5}
    total={TOTAL}
    badge="ROADMAP SUGERIDO"
    title="Quatro fases, cada uma com critério de go/no-go"
    subtitle="A sequência protege o caixa e a engenharia: só se constrói a fase seguinte quando a anterior valida demanda. Nenhum build começa sem o critério de go atendido."
    footnote="Pré-requisitos e critérios de go/no-go são hipóteses de trabalho — a serem validados com a ACP"
  >
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-5">
      {fases.map((f) => (
        <div key={f.fase} className={`p-5 sm:p-6 rounded-xl border space-y-3 ${f.cor}`}>
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-bold text-base sm:text-lg">
              {f.fase} — {f.titulo}
            </h3>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-white border border-current/30">
              Build: {f.build}
            </span>
          </div>
          <ul className="space-y-1.5 text-sm">
            {f.itens.map((i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-current shrink-0" />
                <span className="leading-relaxed">{i}</span>
              </li>
            ))}
          </ul>
          <div className="text-xs space-y-1 border-t border-current/20 pt-3">
            <p className="leading-relaxed">
              <strong>Pré-requisitos:</strong> {f.preRequisitos.join(' ')}
            </p>
            <p className="leading-relaxed font-semibold">{f.goNoGo}</p>
          </div>
        </div>
      ))}
    </div>
  </AcpSlide>
)
