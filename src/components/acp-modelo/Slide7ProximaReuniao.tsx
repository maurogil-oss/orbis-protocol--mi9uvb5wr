import React from 'react'
import { ClipboardList, CalendarCheck2, Users2 } from 'lucide-react'
import { AcpSlide } from './AcpSlide'

const TOTAL = 7

const decisoes = [
  {
    numero: '1',
    titulo: 'Valores finais por porte',
    detalhe:
      'Aprovar (ou ajustar) os valores propostos: MEI gratuito/simbólico, Pequenas R$ 59/mês, Médias R$ 149/mês, Grandes R$ 249/mês e/ou Bureau R$ 7.800.',
  },
  {
    numero: '2',
    titulo: 'Percentual de comissão da ACP',
    detalhe:
      'Definir o percentual de indicação (hipótese: 10% no 1º ano recorrente, 5% renovatório) e se incide sobre renovação e upgrades.',
  },
  {
    numero: '3',
    titulo: 'Quem factura — Orbis × ACP',
    detalhe:
      'Definir se o Orbis cobra o associado diretamente e repassa comissão (recomendado), ou se a ACP factura e repassa royalty. Impacta tributação e conciliação.',
  },
  {
    numero: '4',
    titulo: 'Materiais de divulgação',
    detalhe:
      'Definir quem produz (Orbis fornece, ACP aprova): apresentação para associados, e-mail de lançamento, peças para newsletter e eventos — todos com a terminologia blindada.',
  },
  {
    numero: '5',
    titulo: 'Data de lançamento',
    detalhe:
      'Definir data da Fase 1 e agenda de divulgação da ACP (evento, newsletter, consultoria), com meta inicial de assinaturas.',
  },
]

export const Slide7ProximaReuniao: React.FC = () => (
  <AcpSlide
    id={7}
    total={TOTAL}
    badge="PRÓXIMA REUNIÃO"
    title="Checklist do que decidir com a ACP"
    subtitle="Cinco decisões desbloqueiam a Fase 1. Sugestão: reunião única com a diretoria da ACP com este checklist como pauta."
    footnote="Este documento é insumo da reunião — nada aqui está fechado até a aprovação das duas partes"
  >
    <div className="space-y-3">
      {decisoes.map((d) => (
        <div
          key={d.numero}
          className="flex items-start gap-4 p-4 sm:p-5 rounded-xl bg-slate-50 border border-slate-200"
        >
          <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold text-sm flex items-center justify-center shrink-0">
            {d.numero}
          </div>
          <div className="space-y-1 min-w-0">
            <h3 className="font-bold text-sm sm:text-base text-slate-900">{d.titulo}</h3>
            <p className="text-sm text-slate-600 leading-relaxed">{d.detalhe}</p>
          </div>
        </div>
      ))}
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-2">
        <ClipboardList className="w-4.5 h-4.5 text-emerald-700" />
        <p className="text-xs text-slate-600 leading-relaxed">
          <strong className="text-slate-800">Antes da reunião:</strong> enviar este documento à
          diretoria da ACP com 5 dias úteis de antecedência.
        </p>
      </div>
      <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-2">
        <CalendarCheck2 className="w-4.5 h-4.5 text-blue-700" />
        <p className="text-xs text-slate-600 leading-relaxed">
          <strong className="text-slate-800">Na reunião:</strong> decidir os 5 itens e registrar ata
          com responsáveis e prazos.
        </p>
      </div>
      <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-2">
        <Users2 className="w-4.5 h-4.5 text-slate-700" />
        <p className="text-xs text-slate-600 leading-relaxed">
          <strong className="text-slate-800">Depois:</strong> versionar este documento (v1.1) com as
          decisões e liberar a Fase 1.
        </p>
      </div>
    </div>
  </AcpSlide>
)
