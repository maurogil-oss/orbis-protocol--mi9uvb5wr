import React from 'react'
import { Scale, Users, CalendarClock, UserCog, FileUp } from 'lucide-react'
import { AcpSlide } from './AcpSlide'

const TOTAL = 7

interface ProdutoReg {
  icon: typeof Scale
  nome: string
  escopo: string
  pacote: string
  existe: string
  novo: string
  esforco: 'Pequeno' | 'Médio' | 'Grande'
}

const produtos: ProdutoReg[] = [
  {
    icon: Scale,
    nome: '(a) Enquadramento',
    escopo:
      'Diagnóstico da situação tributária e regulatória do associado: regime tributário (informado pela empresa), licenças, obrigações setoriais e pendências cadastrais — com recomendação de encaminhamento.',
    pacote: 'Todos os pacotes; versão completa nos pacotes Pequenas/Médias/Grandes',
    existe: 'Funil de diagnóstico por CNPJ já existe e é gratuito na plataforma.',
    novo: 'Versão "enquadramento empresarial" com foco tributário-regulatório e relatório de encaminhamento.',
    esforco: 'Pequeno',
  },
  {
    icon: Users,
    nome: '(b) Responsabilidades',
    escopo:
      'Mapa de responsabilidades legais por porte e atividade (CNAE): o que o sócio, o administrador e o responsável técnico devem cumprir — ambiental, trabalhista, tributária e regulatória.',
    pacote: 'Pequenas, Médias e Grandes',
    existe: 'Diagnóstico e trilhas por segmento já classificam obrigações por atividade.',
    novo: 'Geração do mapa consolidado por porte/atividade, com trilha de evidência documental por responsabilidade.',
    esforco: 'Médio',
  },
  {
    icon: CalendarClock,
    nome: '(c) Reuniões de aconselhamento',
    escopo:
      'Agenda recorrente consultiva (mensal/trimestral) com pauta baseada no diagnóstico e nas pendências do associado — diferencial dos pacotes Médio e Grande.',
    pacote: 'Médias (trimestral) e Grandes (mensal)',
    existe: 'Pendências por respondente e Console já organizam o que precisa de ação.',
    novo: 'Agendamento, pauta automática gerada das pendências e registro de atas no dossiê do associado.',
    esforco: 'Médio',
  },
  {
    icon: UserCog,
    nome: '(d) Contador como aliado',
    escopo:
      'Produto/canal para o contador da empresa associada: acesso próprio, visão dos documentos da empresa e upload direto conforme os modelos da plataforma.',
    pacote: 'Médias e Grandes (incluso); opcional pago para Pequenas',
    existe: 'Papéis/permissões, upload de documentos e pendências por respondente já existem.',
    novo: 'Perfil "Contador" dedicado com multi-empresa e notificações de pendência.',
    esforco: 'Médio',
  },
  {
    icon: FileUp,
    nome: '(e) Carga documental conforme modelos',
    escopo:
      'O associado carrega seus documentos usando os modelos/templates da plataforma (contratos, licenças, notas, laudos), alimentando o dossiê probatório e o Atestado Orbis.',
    pacote: 'Todos os pacotes (volume por porte)',
    existe:
      'Upload de documentos, modelos e leitura assistida de NF (opcional) já operam na plataforma.',
    novo: 'Pacote de modelos "Conformidade Empresarial" específico para o associado ACP, com checklist guiado.',
    esforco: 'Pequeno',
  },
]

const esforcoCor = {
  Pequeno: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Médio: 'bg-amber-50 text-amber-700 border-amber-200',
  Grande: 'bg-red-50 text-red-700 border-red-200',
} as const

export const Slide3Regulamentacao: React.FC = () => (
  <AcpSlide
    id={3}
    total={TOTAL}
    badge="PRODUTOS DE REGULAMENTAÇÃO EMPRESARIAL"
    title="A novidade pedida: regularizar a situação empresarial do associado"
    subtitle="Descritos como proposta de produto (não implementados nesta fase). Cada item indica o escopo, em qual pacote entra, o que a plataforma JÁ tem, o que seria NOVO e o esforço estimado de construção."
    footnote="A situação tributária é sempre INFORMADA pela empresa — a plataforma nunca é fonte central de dado tributário"
  >
    <div className="space-y-4">
      {produtos.map(({ icon: Icon, nome, escopo, pacote, existe, novo, esforco }) => (
        <div
          key={nome}
          className="p-5 sm:p-6 rounded-xl border border-slate-200 bg-slate-50 space-y-3"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-700 shrink-0">
                <Icon className="w-4.5 h-4.5" />
              </div>
              <h3 className="font-bold text-base sm:text-lg text-slate-900">{nome}</h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full text-[11px] font-mono bg-white text-slate-600 border border-slate-200">
                {pacote}
              </span>
              <span
                className={`px-2.5 py-1 rounded-full text-[11px] font-mono font-bold border ${esforcoCor[esforco]}`}
              >
                Esforço: {esforco}
              </span>
            </div>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">{escopo}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <p className="p-2.5 rounded-lg bg-white border border-slate-200 text-slate-600 leading-relaxed">
              <strong className="text-slate-800">Já existe:</strong> {existe}
            </p>
            <p className="p-2.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-900 leading-relaxed">
              <strong>Seria novo:</strong> {novo}
            </p>
          </div>
        </div>
      ))}
    </div>
  </AcpSlide>
)
