import React, { useState, useEffect } from 'react'
import {
  CdvHonorarioRecord,
  TipoPerito,
  listarHonorariosVigentes,
} from '@/services/honorariosService'
import {
  DollarSign,
  ShieldAlert,
  FileCheck2,
  HelpCircle,
  Building2,
  Award,
  Sparkles,
} from 'lucide-react'

const TIPOS_PERITO_ORDENADOS: { id: TipoPerito; nome: string; sigla: string }[] = [
  { id: 'CREA', nome: 'Engenharia & Agronomia', sigla: 'CREA' },
  { id: 'CAU', nome: 'Arquitetura & Urbanismo', sigla: 'CAU' },
  { id: 'CFT', nome: 'Técnicos Industriais', sigla: 'CFT' },
  { id: 'CRC', nome: 'Contabilidade & Auditoria', sigla: 'CRC' },
  { id: 'CRQ', nome: 'Química Industrial', sigla: 'CRQ' },
]

export const TabelaPublicaHonorariosSection: React.FC = () => {
  const [honorarios, setHonorarios] = useState<CdvHonorarioRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [peritoSelecionado, setPeritoSelecionado] = useState<string>('todos')

  useEffect(() => {
    listarHonorariosVigentes()
      .then((records) => setHonorarios(records))
      .catch((err) => {
        console.warn('Erro ao carregar honorários públicos:', err)
      })
      .finally(() => setLoading(false))
  }, [])

  const honorariosFiltrados = honorarios.filter((h) => {
    if (peritoSelecionado === 'todos') return true
    return h.tipo_perito === peritoSelecionado
  })

  // Agrupamento para consulta por tipo de laudo
  const laudosUnicos = Array.from(new Set(honorarios.map((h) => h.tipo_laudo)))

  return (
    <div className="space-y-8 my-10" id="honorarios-periciais">
      {/* Header do Módulo Público */}
      <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#111820] border border-slate-200 dark:border-[rgba(244,247,250,0.12)] shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-[#12B886]/10 border border-emerald-300 dark:border-[#12B886]/40 text-[#12B886] text-xs font-semibold tracking-wider uppercase">
              <DollarSign className="w-3.5 h-3.5 text-[#12B886]" />
              TABELA PÚBLICA DE HONORÁRIOS PERICIAIS VIGENTE
            </div>
            <h2 className="font-heading font-black text-2xl sm:text-3xl text-slate-900 dark:text-[#F4F7FA]">
              Remuneração por Perícia & Laudo Técnico
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-[#93A3B5] leading-relaxed">
              Tabela oficial de honorários praticada pela rede de peritos credenciados do Orbis
              Protocol. Os valores são ajustáveis conforme o mercado e a categoria profissional do
              perito, garantindo previsibilidade e conformidade ética perante os conselhos de
              classe.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0A0E12] border border-slate-200 dark:border-slate-800 text-xs space-y-1 sm:min-w-[240px]">
            <span className="text-[10px] text-slate-500 dark:text-[#93A3B5] uppercase block font-mono">
              Status da Tabela
            </span>
            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-[#12B886] font-bold text-sm">
              <Sparkles className="w-4 h-4" />
              <span>Valores Reais Vigentes</span>
            </div>
            <span className="text-[10px] text-slate-500 dark:text-[#93A3B5] block">
              Atualizada diretamente pelo Console de Gestão
            </span>
          </div>
        </div>

        {/* Filtro rápido por Conselho */}
        <div className="mt-6 pt-6 border-t border-slate-200 dark:border-[rgba(244,247,250,0.08)] flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-600 dark:text-[#93A3B5] mr-2">
            Filtrar por Conselho:
          </span>
          <button
            type="button"
            onClick={() => setPeritoSelecionado('todos')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              peritoSelecionado === 'todos'
                ? 'bg-[#12B886] text-[#0A0E12] font-bold shadow-sm'
                : 'bg-slate-100 dark:bg-[#0A0E12] text-slate-600 dark:text-[#93A3B5] hover:text-slate-900 dark:hover:text-[#F4F7FA]'
            }`}
          >
            Todos os Conselhos
          </button>
          {TIPOS_PERITO_ORDENADOS.map((tp) => (
            <button
              key={tp.id}
              type="button"
              onClick={() => setPeritoSelecionado(tp.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                peritoSelecionado === tp.id
                  ? 'bg-[#12B886] text-[#0A0E12] font-bold shadow-sm'
                  : 'bg-slate-100 dark:bg-[#0A0E12] text-slate-600 dark:text-[#93A3B5] hover:text-slate-900 dark:hover:text-[#F4F7FA]'
              }`}
            >
              {tp.sigla}
            </button>
          ))}
        </div>
      </div>

      {/* Tabela Responsiva de Honorários */}
      <div className="rounded-2xl bg-white dark:bg-[#111820] border border-slate-200 dark:border-[rgba(244,247,250,0.1)] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 dark:bg-[#0D1217] text-slate-600 dark:text-[#93A3B5] uppercase text-[10px] border-b border-slate-200 dark:border-[rgba(244,247,250,0.08)]">
              <tr>
                <th className="p-4">Tipo de Perito / Conselho</th>
                <th className="p-4">Tipo de Laudo & Descrição Técnica</th>
                <th className="p-4">Honorário Base (BRL)</th>
                <th className="p-4">Unidade</th>
                <th className="p-4">Vigência</th>
                <th className="p-4">Responsabilidade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[rgba(244,247,250,0.05)]">
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="p-8 text-center text-xs text-slate-500 dark:text-[#93A3B5]"
                  >
                    Carregando tabela oficial de honorários...
                  </td>
                </tr>
              ) : honorariosFiltrados.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="p-8 text-center text-xs text-slate-500 dark:text-[#93A3B5]"
                  >
                    Nenhum honorário tabelado para este filtro.{' '}
                    <span className="text-[#D9B36C] font-semibold">Sob consulta</span> junto à
                    auditoria central.
                  </td>
                </tr>
              ) : (
                honorariosFiltrados.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50 dark:hover:bg-[#16202B]/50 transition-colors"
                  >
                    <td className="p-4 whitespace-nowrap">
                      <span className="px-2.5 py-1 rounded-md text-[11px] font-mono font-bold uppercase bg-blue-50 dark:bg-[#3B82F6]/20 text-blue-700 dark:text-[#3B82F6] border border-blue-200 dark:border-[#3B82F6]/30">
                        {item.tipo_perito}
                      </span>
                    </td>
                    <td className="p-4">
                      <strong className="text-slate-900 dark:text-[#F4F7FA] block text-sm mb-0.5">
                        {item.titulo_laudo}
                      </strong>
                      <p className="text-slate-600 dark:text-[#93A3B5] text-xs leading-relaxed max-w-xl">
                        {item.observacoes || 'Aferição documental e emissão com chancela técnica.'}
                      </p>
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      {item.valor_base > 0 ? (
                        <span className="font-heading font-black text-base text-[#12B886]">
                          R${' '}
                          {Number(item.valor_base).toLocaleString('pt-BR', {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      ) : (
                        <span className="font-bold text-[#D9B36C] text-xs px-2 py-1 rounded bg-[#D9B36C]/10 border border-[#D9B36C]/30">
                          Sob consulta
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-slate-600 dark:text-[#93A3B5] font-mono text-xs whitespace-nowrap">
                      {item.unidade}
                    </td>
                    <td className="p-4 font-mono text-[11px] text-slate-600 dark:text-[#93A3B5] whitespace-nowrap">
                      Desde {item.vigencia_inicio}
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      <span className="text-[10px] uppercase font-bold text-slate-700 dark:text-[#F4F7FA] flex items-center gap-1">
                        <FileCheck2 className="w-3.5 h-3.5 text-[#12B886]" />
                        ART / RRT Obrigatória
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Rodapé da Tabela: Matriz Sob Consulta */}
        <div className="p-4 bg-slate-50 dark:bg-[#0D1217] border-t border-slate-200 dark:border-[rgba(244,247,250,0.08)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-600 dark:text-[#93A3B5]">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-[#D9B36C] shrink-0" />
            <span>
              Para combinações de laudos e conselhos específicos sem valor tabelado, o honorário é
              definido <strong className="text-slate-900 dark:text-[#F4F7FA]">Sob consulta</strong>{' '}
              conforme complexidade do escopo pericial e volume de amostragem.
            </span>
          </div>
          <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 shrink-0">
            DM-ORB-001 v1.1 • NBC TO 3000
          </span>
        </div>
      </div>

      {/* SEÇÃO CURTA: RESPONSABILIDADE TÉCNICA E COBERTURA SECURITÁRIA */}
      <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#111820] border border-amber-300 dark:border-[#D9B36C]/40 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-[#D9B36C]/10 text-amber-700 dark:text-[#D9B36C]">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-heading font-black text-lg text-slate-900 dark:text-[#F4F7FA]">
              Responsabilidade Técnica e Seguro Profissional
            </h3>
            <p className="text-xs text-slate-600 dark:text-[#93A3B5]">
              Transparência regulatória e governança de responsabilidade civil pericial
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-600 dark:text-[#93A3B5] leading-relaxed">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0A0E12] border border-slate-200 dark:border-slate-800 space-y-2">
            <strong className="text-slate-900 dark:text-[#F4F7FA] block text-sm flex items-center gap-1.5">
              <FileCheck2 className="w-4 h-4 text-[#12B886]" />
              Anotação de Responsabilidade Técnica (ART / RRT)
            </strong>
            <p>
              Todo laudo técnico emitido no ecossistema Orbis Protocol deve obrigatoriamente possuir
              a Anotação de Responsabilidade Técnica (ART no CREA, TRT no CFT ou RRT no CAU)
              acoplada ao corpo do documento, identificando o perito responsável e garantindo valor
              probatório autônomo perante o Poder Judiciário e órgãos ambientais.
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              A responsabilidade pelo conteúdo do laudo, amostragem e diligências in loco recai
              sobre o profissional signatário, conforme definido no Termo de Credenciamento
              Pericial.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0A0E12] border border-slate-200 dark:border-slate-800 space-y-2">
            <strong className="text-slate-900 dark:text-[#F4F7FA] block text-sm flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-[#D9B36C]" />
              Cobertura Securitária (E&O / Responsabilidade Civil)
            </strong>
            <p>
              As responsabilidades das partes estão estritamente definidas no{' '}
              <strong className="text-slate-900 dark:text-[#F4F7FA]">
                Termo de Credenciamento Pericial
              </strong>
              . A cobertura securitária corporativa contra Erros e Omissões (E&O / Seguro de
              Responsabilidade Civil Profissional) está atualmente{' '}
              <span className="text-[#D9B36C] font-semibold">em definição</span> junto a seguradoras
              parceiras do setor.
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              A plataforma adota transparência regulatória integral, sem prometer apólices de
              cobertura ainda não formalizadas no comitê de riscos.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
