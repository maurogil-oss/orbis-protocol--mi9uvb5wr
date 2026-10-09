import React from 'react'
import {
  Utensils,
  AlertCircle,
  HelpCircle,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react'
import {
  PerguntasSegmentoAlimentacao,
  INSUMOS_ALIMENTACAO_OPCOES,
  ENERGIA_ALIMENTACAO_OPCOES,
  RESIDUOS_ALIMENTACAO_OPCOES,
} from '@/services/diagnosticoSegmentosService'

interface Props {
  dados: PerguntasSegmentoAlimentacao
  onChange: (dados: PerguntasSegmentoAlimentacao) => void
}

export function FormularioSegmentoAlimentacao({ dados, onChange }: Props) {
  const toggleInsumo = (id: string) => {
    const exists = dados.principais_insumos.includes(id)
    const novos = exists
      ? dados.principais_insumos.filter((item) => item !== id)
      : [...dados.principais_insumos, id]
    onChange({ ...dados, principais_insumos: novos })
  }

  const toggleEnergia = (id: string) => {
    const exists = dados.fontes_energia.includes(id)
    const novos = exists
      ? dados.fontes_energia.filter((item) => item !== id)
      : [...dados.fontes_energia, id]
    onChange({ ...dados, fontes_energia: novos })
  }

  const toggleResiduo = (id: string) => {
    const exists = dados.residuos_gerados.includes(id)
    const novos = exists
      ? dados.residuos_gerados.filter((item) => item !== id)
      : [...dados.residuos_gerados, id]
    onChange({ ...dados, residuos_gerados: novos })
  }

  return (
    <div className="space-y-6 pt-2 animate-fade-in border-t border-[rgba(244,247,250,0.1)] mt-6">
      <div className="flex items-center justify-between gap-3 p-3.5 rounded-xl bg-emerald-500/10 border border-[#12B886]/40">
        <div className="flex items-center gap-2.5">
          <Utensils className="w-5 h-5 text-[#12B886] shrink-0" />
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#12B886] block">
              Trilha Flagship: Alimentação, Food Service & Delivery
            </span>
            <span className="text-[11px] text-[#93A3B5]">
              Questionário calibrado para restaurantes, bares, lanchonetes e entregas.
            </span>
          </div>
        </div>
        <span className="px-2 py-0.5 rounded bg-[#12B886]/20 text-[#12B886] text-[10px] font-bold uppercase">
          Ativo
        </span>
      </div>

      {/* Tipo de Estabelecimento */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-[#93A3B5] mb-2">
          Tipo de Estabelecimento *
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {[
            { id: 'restaurante', rotulo: 'Restaurante / Buffet' },
            { id: 'bar', rotulo: 'Bar / Choperia' },
            { id: 'lanchonete', rotulo: 'Lanchonete / Fast-food' },
            { id: 'delivery', rotulo: 'Delivery / Dark Kitchen' },
            { id: 'padaria', rotulo: 'Padaria / Confeitaria' },
            { id: 'refeicoes_coletivas', rotulo: 'Cozinha Industrial' },
          ].map((tipo) => (
            <button
              key={tipo.id}
              type="button"
              onClick={() =>
                onChange({
                  ...dados,
                  tipo_estabelecimento:
                    tipo.id as PerguntasSegmentoAlimentacao['tipo_estabelecimento'],
                })
              }
              className={`p-2.5 rounded-lg text-xs font-medium border text-left transition-all ${
                dados.tipo_estabelecimento === tipo.id
                  ? 'bg-[#12B886]/20 border-[#12B886] text-[#F4F7FA]'
                  : 'bg-[#0A0E12] border-[rgba(244,247,250,0.12)] text-[#93A3B5] hover:text-[#F4F7FA]'
              }`}
            >
              {tipo.rotulo}
            </button>
          ))}
        </div>
      </div>

      {/* Porte: Funcionários e Faturamento */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#93A3B5] mb-1.5">
            Porte por Equipe / Funcionários
          </label>
          <select
            value={dados.porte_funcionarios}
            onChange={(e) =>
              onChange({
                ...dados,
                porte_funcionarios: e.target
                  .value as PerguntasSegmentoAlimentacao['porte_funcionarios'],
              })
            }
            className="w-full px-3 py-2.5 rounded-lg bg-[#0A0E12] border border-[rgba(244,247,250,0.15)] text-[#F4F7FA] text-xs focus:ring-2 focus:ring-[#12B886]"
          >
            <option value="1_a_4">1 a 4 colaboradores (Micro/Familiar)</option>
            <option value="5_a_15">5 a 15 colaboradores (Pequeno)</option>
            <option value="16_a_50">16 a 50 colaboradores (Médio)</option>
            <option value="acima_50">Mais de 50 colaboradores (Grande / Rede)</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#93A3B5] mb-1.5">
            Faturamento Médio Mensal
          </label>
          <select
            value={dados.porte_faturamento_mensal}
            onChange={(e) =>
              onChange({
                ...dados,
                porte_faturamento_mensal: e.target
                  .value as PerguntasSegmentoAlimentacao['porte_faturamento_mensal'],
              })
            }
            className="w-full px-3 py-2.5 rounded-lg bg-[#0A0E12] border border-[rgba(244,247,250,0.15)] text-[#F4F7FA] text-xs focus:ring-2 focus:ring-[#12B886]"
          >
            <option value="ate_30k">Até R$ 30.000 / mês (MEI / Micro)</option>
            <option value="30k_a_100k">R$ 30.000 a R$ 100.000 / mês</option>
            <option value="100k_a_300k">R$ 100.000 a R$ 300.000 / mês</option>
            <option value="acima_300k">Acima de R$ 300.000 / mês</option>
          </select>
        </div>
      </div>

      {/* Principais Insumos Adquiridos */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-[#93A3B5] mb-1.5">
          Principais Insumos e Materiais Adquiridos via Nota Fiscal
        </label>
        <p className="text-[11px] text-[#93A3B5]/80 mb-2">
          Selecione os insumos mais representativos na sua operação de cozinha e salão:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {INSUMOS_ALIMENTACAO_OPCOES.map((insumo) => {
            const checked = dados.principais_insumos.includes(insumo.id)
            return (
              <label
                key={insumo.id}
                onClick={() => toggleInsumo(insumo.id)}
                className={`flex items-center gap-2.5 p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                  checked
                    ? 'bg-[#12B886]/15 border-[#12B886] text-[#F4F7FA]'
                    : 'bg-[#0A0E12] border-[rgba(244,247,250,0.1)] text-[#93A3B5] hover:border-[rgba(244,247,250,0.2)]'
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => {}}
                  className="rounded text-[#12B886] focus:ring-[#12B886] bg-[#111820]"
                />
                <span>{insumo.label}</span>
              </label>
            )
          })}
        </div>
      </div>

      {/* Fontes de Energia e Cocção */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-[#93A3B5] mb-1.5">
          Fontes de Energia Utilizadas
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {ENERGIA_ALIMENTACAO_OPCOES.map((eng) => {
            const checked = dados.fontes_energia.includes(eng.id)
            return (
              <label
                key={eng.id}
                onClick={() => toggleEnergia(eng.id)}
                className={`flex items-center gap-2.5 p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                  checked
                    ? 'bg-[#12B886]/15 border-[#12B886] text-[#F4F7FA]'
                    : 'bg-[#0A0E12] border-[rgba(244,247,250,0.1)] text-[#93A3B5] hover:border-[rgba(244,247,250,0.2)]'
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => {}}
                  className="rounded text-[#12B886] focus:ring-[#12B886] bg-[#111820]"
                />
                <span>{eng.label}</span>
              </label>
            )
          })}
        </div>
      </div>

      {/* Resíduos Gerados */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-[#93A3B5] mb-1.5">
          Resíduos Gerados na Operação
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {RESIDUOS_ALIMENTACAO_OPCOES.map((res) => {
            const checked = dados.residuos_gerados.includes(res.id)
            return (
              <label
                key={res.id}
                onClick={() => toggleResiduo(res.id)}
                className={`flex items-center gap-2.5 p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                  checked
                    ? 'bg-[#12B886]/15 border-[#12B886] text-[#F4F7FA]'
                    : 'bg-[#0A0E12] border-[rgba(244,247,250,0.1)] text-[#93A3B5] hover:border-[rgba(244,247,250,0.2)]'
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => {}}
                  className="rounded text-[#12B886] focus:ring-[#12B886] bg-[#111820]"
                />
                <span>{res.label}</span>
              </label>
            )
          })}
        </div>
      </div>

      {/* Origem e Logística Reversa (PNRS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#93A3B5] mb-1.5">
            Origem dos Principais Insumos
          </label>
          <select
            value={dados.origem_insumos}
            onChange={(e) =>
              onChange({
                ...dados,
                origem_insumos: e.target.value as PerguntasSegmentoAlimentacao['origem_insumos'],
              })
            }
            className="w-full px-3 py-2.5 rounded-lg bg-[#0A0E12] border border-[rgba(244,247,250,0.15)] text-[#F4F7FA] text-xs focus:ring-2 focus:ring-[#12B886]"
          >
            <option value="predominante_local_regional">
              Predominante local / regional (&lt; 200 km)
            </option>
            <option value="mista">Mista (Local + Distribuidoras Estaduais)</option>
            <option value="predominante_nacional_distante">
              Predominante de outros estados / longa distância
            </option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#93A3B5] mb-1.5">
            Logística Reversa de Embalagens (PNRS)
          </label>
          <select
            value={dados.logistica_reversa_embalagens}
            onChange={(e) =>
              onChange({
                ...dados,
                logistica_reversa_embalagens: e.target
                  .value as PerguntasSegmentoAlimentacao['logistica_reversa_embalagens'],
              })
            }
            className="w-full px-3 py-2.5 rounded-lg bg-[#0A0E12] border border-[rgba(244,247,250,0.15)] text-[#F4F7FA] text-xs focus:ring-2 focus:ring-[#12B886]"
          >
            <option value="possui_coleta_ou_parceria">
              Possui coleta seletiva / parceria com cooperativa ou coletor
            </option>
            <option value="em_estruturacao">Em estruturação técnica preliminar</option>
            <option value="nao_possui">Ainda não possui iniciativa formal</option>
          </select>
        </div>
      </div>
    </div>
  )
}
