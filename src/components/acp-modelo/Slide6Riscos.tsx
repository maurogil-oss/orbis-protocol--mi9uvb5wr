import React from 'react'
import { ShieldAlert, ShieldCheck, Ban } from 'lucide-react'
import { AcpSlide } from './AcpSlide'

const TOTAL = 7

const riscos = [
  {
    nome: 'Dependência de canal',
    descricao:
      'Se a ACP for o único canal deste segmento, a interrupção da parceria interrompe a aquisição. Mitigação: manter canais próprios ativos em paralelo e contratos com prazo e renovação definidos.',
  },
  {
    nome: 'Ciclo comercial de associação',
    descricao:
      'A relação do associado é com a entidade; renovação de anuidade da ACP pode derrubar assinaturas em lote. Mitigação: contratos diretos Orbis × associado, com a ACP comissionada pela indicação.',
  },
  {
    nome: 'Expectativa de "certificação"',
    descricao:
      'Associados podem esperar selo regulatório ou crédito de carbono — o que a plataforma não fornece. Mitigação: materiais comerciais com a terminologia blindada abaixo, revisados antes de publicar.',
  },
]

const permitidos = [
  'Centro de Desmonte',
  'validado/confirmado',
  'Atestado Orbis',
  'Selo Comercial ORBIS/IBESG (somente fachada institucional)',
]

const proibidos = [
  '"certificação"',
  '"selo oficial"',
  '"homologado"',
  'prometer emissão ou obtenção de créditos de carbono',
]

export const Slide6Riscos: React.FC = () => (
  <AcpSlide
    id={6}
    total={TOTAL}
    badge="RISCOS E BLINDAGEM"
    title="Riscos da parceria e regras de posicionamento obrigatórias"
    subtitle="A parceria ACP só avança com o posicionamento preservado: o Orbis é infraestrutura de prova documental dMRV — apura CO₂e e NÃO emite créditos de carbono."
    footnote="Terminologia blindada — vale para todos os materiais da parceria, em qualquer canal"
  >
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {riscos.map((r) => (
        <div key={r.nome} className="p-5 rounded-xl bg-red-50 border border-red-200 space-y-2">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
            <h3 className="font-bold text-sm text-red-800">{r.nome}</h3>
          </div>
          <p className="text-xs text-red-900/80 leading-relaxed">{r.descricao}</p>
        </div>
      ))}
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="p-5 rounded-xl bg-emerald-50 border border-emerald-200 space-y-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4.5 h-4.5 text-emerald-700" />
          <h3 className="font-bold text-sm text-emerald-800">
            Rótulos públicos PERMITIDOS (exclusivamente)
          </h3>
        </div>
        <ul className="space-y-1.5 text-sm text-emerald-900">
          {permitidos.map((p) => (
            <li key={p} className="flex items-start gap-2">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0" />
              <span className="leading-relaxed">{p}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="p-5 rounded-xl bg-slate-100 border border-slate-300 space-y-3">
        <div className="flex items-center gap-2">
          <Ban className="w-4.5 h-4.5 text-slate-700" />
          <h3 className="font-bold text-sm text-slate-800">PROIBIDO usar em qualquer material</h3>
        </div>
        <ul className="space-y-1.5 text-sm text-slate-700">
          {proibidos.map((p) => (
            <li key={p} className="flex items-start gap-2">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-slate-500 shrink-0" />
              <span className="leading-relaxed">{p}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>

    <div className="p-4 sm:p-5 rounded-xl bg-blue-50 border border-blue-200 text-sm text-blue-900 leading-relaxed space-y-1">
      <p>
        <strong>Tributo:</strong> a situação tributária é sempre INFORMADA pela empresa — a
        plataforma nunca é a fonte central do dado tributário.
      </p>
      <p>
        <strong>Trial:</strong> 15 dias sem cartão, com limite de 5 notas e bloqueio suave — regra
        comum a todos os pacotes desta proposta.
      </p>
    </div>
  </AcpSlide>
)
