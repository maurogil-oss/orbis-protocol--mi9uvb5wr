import React from 'react'
import { Building2, ShieldCheck, FileCheck2, Handshake } from 'lucide-react'
import { AcpSlide } from './AcpSlide'

const TOTAL = 7

const destaques = [
  {
    icon: ShieldCheck,
    titulo: 'Parceria existente',
    texto:
      'A ACP Paraná & Peritos já figura como parceira/afiliada com comissão configurável, e o produto "Bureau ACP (Corporativo)" de R$ 7.800 já está no catálogo comercial da plataforma.',
  },
  {
    icon: FileCheck2,
    titulo: 'O que o associado recebe',
    texto:
      'Prova documental dMRV: pegada de carbono apurada por nota fiscal (CO₂e por nota e por R$ faturado), Atestado Orbis verificável por terceiros e Passaporte de fornecedor.',
  },
  {
    icon: Building2,
    titulo: 'Tese comercial',
    texto:
      'Os associados ACP já têm a relação de confiança com a entidade. O Orbis entra como benefício concreto: transformar obrigações (Lei 15.042/2024, IFRS S2, Res. BCB 4.945) em vantagem comercial documentada.',
  },
  {
    icon: Handshake,
    titulo: 'Modelo de canal',
    texto:
      'Fase 1 sem código: indicação com link/cupom de afiliado, comissionamento pela estrutura que já existe. Fase 2+: página dedicada, onboarding guiado e produtos de regulamentação empresarial.',
  },
]

export const Slide1SumarioExecutivo: React.FC = () => (
  <AcpSlide
    id={1}
    total={TOTAL}
    badge="SUMÁRIO EXECUTIVO"
    title="Levar o Orbis Protocol aos associados da ACP"
    subtitle="O que se propõe: abrir a plataforma Orbis Protocol (prova documental dMRV, pegada de carbono por nota, Atestado Orbis) às empresas associadas da Associação Comercial do Paraná — pequenas, médias, grandes e MEI — aproveitando a parceria já firmada entre as instituições."
    footnote="Proposta sujeita a aprovação — valores e condições são hipóteses de trabalho"
  >
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-5">
      {destaques.map(({ icon: Icon, titulo, texto }) => (
        <div
          key={titulo}
          className="p-5 sm:p-6 rounded-xl bg-slate-50 border border-slate-200 space-y-2"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 shrink-0">
              <Icon className="w-4.5 h-4.5" />
            </div>
            <h3 className="font-bold text-base text-slate-900">{titulo}</h3>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">{texto}</p>
        </div>
      ))}
    </div>

    <div className="p-4 sm:p-5 rounded-xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-900 leading-relaxed">
      <strong>Resultado esperado da Fase 1 (sem código):</strong> primeiras dez assinaturas ativas
      via canal ACP em 90 dias, validando preço por porte e comissão, antes de qualquer investimento
      de engenharia em integração ou white-label.
    </div>
  </AcpSlide>
)
