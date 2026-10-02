import React, { useState } from 'react'
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  FileCheck2,
  Scale,
  Building2,
  Sparkles,
  Layers,
  Flame,
  Droplets,
  Recycle,
  Info,
  ExternalLink,
  Lock,
  ShieldAlert,
} from 'lucide-react'
import type {
  DestinacaoFinalLoteResponse,
  CamadaDestinacaoGrupo,
  ItemDestinacaoFinal,
} from '@/services/destinacaoFinalService'

interface DestinacaoFinalTabProps {
  dados: DestinacaoFinalLoteResponse
  isModoIndividual?: boolean
  seloIndividual?: string
  descricaoPeca?: string
}

export function DestinacaoFinalTab({
  dados,
  isModoIndividual = false,
  seloIndividual,
  descricaoPeca,
}: DestinacaoFinalTabProps) {
  const [copiedHashId, setCopiedHashId] = useState<string | null>(null)
  const [camadaAtivaFiltro, setCamadaAtivaFiltro] = useState<'todas' | '1' | '2' | '3'>('todas')

  const copyToClipboard = (text: string, id: string) => {
    if (!text) return
    navigator.clipboard.writeText(text)
    setCopiedHashId(id)
    setTimeout(() => setCopiedHashId(null), 2000)
  }

  const { camada1, camada2, camada3 } = dados.camadas

  return (
    <div className="space-y-8 animate-fade-in text-slate-900 dark:text-[#F8FAFC]">
      {/* CABEÇALHO DA SEÇÃO / ABA DESTINAÇÃO FINAL */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-gradient-to-b dark:from-[#0E1A2E] dark:to-[#111827] border-2 border-emerald-500/30 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 pb-6 border-b border-slate-200 dark:border-slate-800">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-[#111827] border border-emerald-300 dark:border-[#059669]/40 text-emerald-700 dark:text-[#059669] text-xs font-bold uppercase tracking-wider">
                <Recycle className="w-3.5 h-3.5" />
                DESTINAÇÃO FINAL HOMOLOGADA • MATRIZ EM 3 CAMADAS
              </span>
              {dados.is_demo && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-[#F59E0B]/20 border border-amber-300 dark:border-[#F59E0B] text-amber-700 dark:text-[#F59E0B] text-[10px] font-extrabold uppercase tracking-wider">
                  <AlertTriangle className="w-3 h-3" />
                  DADOS DEMO REALISTAS
                </span>
              )}
            </div>

            <h2 className="font-heading font-black text-2xl sm:text-3xl text-slate-900 dark:text-[#F8FAFC] tracking-wide">
              {isModoIndividual
                ? `Destinação Final & Cadeia de Despoluição do Veículo Doador`
                : `Destinação Final & Cadeia de Custódia do Lote`}
            </h2>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-[#94A3B8] max-w-3xl leading-relaxed">
              {isModoIndividual ? (
                <>
                  Esta peça (
                  <strong className="text-emerald-700 dark:text-[#059669] font-mono">
                    {seloIndividual}
                  </strong>{' '}
                  — {descricaoPeca}) integra um veículo cuja desmontagem cumpriu o gate mandatório
                  de despoluição e a destinação final de carcaça e fluidos.
                </>
              ) : (
                <>
                  Matriz regulatória integrada: gate de conformidade (baterias, pneus e fluidos),
                  logística reversa de óleo lubrificante usado (RLO) e claim principal de reciclagem
                  com notas fiscais de destinação.
                </>
              )}
            </p>
          </div>

          {/* Destaque Status do Gate de Despoluição */}
          <div className="shrink-0 p-4 rounded-2xl bg-slate-50 dark:bg-[#0A1628] border border-emerald-500/30 dark:border-slate-800 min-w-[240px]">
            <span className="text-[10px] uppercase font-bold text-slate-600 dark:text-[#94A3B8] tracking-wider block mb-1">
              Status do Gate de Despoluição
            </span>
            {dados.gateDespoluicaoConforme ? (
              <div className="flex items-center gap-2 text-emerald-700 dark:text-[#059669]">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <div>
                  <div className="font-heading font-black text-sm uppercase">
                    CONFORME • COMPROVADO
                  </div>
                  <div className="text-[10px] text-slate-600 dark:text-[#94A3B8]">
                    ELV / CONAMA 401 / PNRS
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-amber-600 dark:text-[#F59E0B]">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <div>
                  <div className="font-heading font-black text-sm uppercase">
                    DESPOLUIÇÃO PENDENTE
                  </div>
                  <div className="text-[10px] text-slate-600 dark:text-[#94A3B8]">
                    Aguardando MTR/NF
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Destaque do Balanço de Massa do Veículo Doador (% RRR e Diretiva ELV) */}
        {dados.balancoMassa && (
          <div className="mt-6 p-4 rounded-2xl bg-slate-50 dark:bg-[#0A1628] border-2 border-emerald-500/30 dark:border-slate-800 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Scale className="w-4 h-4 text-emerald-600 dark:text-[#059669]" />
                <span className="font-heading font-extrabold text-xs uppercase tracking-wider text-slate-900 dark:text-[#F8FAFC]">
                  Balanço de Massa do Veículo Doador (Curbside{' '}
                  {dados.balancoMassa.massaEstimadaVeiculoKg} kg)
                </span>
              </div>
              <span className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-700 dark:text-[#059669] bg-emerald-50 dark:bg-[#059669]/10 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-[#059669]/30">
                Taxa de Valorização: {dados.balancoMassa.percentualValorizacaoTotalPct.toFixed(1)}%
                RRR
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-[#059669] block">
                  Reúso Circular
                </span>
                <div className="font-mono font-bold text-sm text-slate-900 dark:text-[#F8FAFC]">
                  {dados.balancoMassa.massaCircularRecuperadaKg.toFixed(1)} kg
                </div>
                <span className="text-[10px] text-slate-600 dark:text-[#94A3B8] font-mono">
                  {dados.balancoMassa.percentualReusoPct.toFixed(1)}%
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] uppercase font-bold text-blue-600 dark:text-[#60A5FA] block">
                  Destinação Final
                </span>
                <div className="font-mono font-bold text-sm text-slate-900 dark:text-[#F8FAFC]">
                  {dados.balancoMassa.massaDestinacaoFinalTotalKg.toFixed(1)} kg
                </div>
                <span className="text-[10px] text-slate-600 dark:text-[#94A3B8] font-mono">
                  {dados.balancoMassa.percentualReciclagemDestinacaoPct.toFixed(1)}%
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-900 dark:text-[#F8FAFC] block">
                  Diretiva ELV (85%)
                </span>
                <div className="font-mono font-bold text-sm text-emerald-700 dark:text-[#059669]">
                  {dados.balancoMassa.atingiuMetaReusoReciclagem
                    ? 'Meta Atingida ✓'
                    : 'Em Progresso'}
                </div>
                <span className="text-[10px] text-slate-600 dark:text-[#94A3B8] font-mono">
                  Meta 95% Val:{' '}
                  {dados.balancoMassa.atingiuMetaValorizacaoTotal ? 'Sim ✓' : 'Parcial'}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-600 dark:text-[#94A3B8] block">
                  Perdas / Processo
                </span>
                <div className="font-mono font-bold text-sm text-slate-600 dark:text-[#94A3B8]">
                  {dados.balancoMassa.massaPerdasProcessoKg.toFixed(1)} kg
                </div>
                <span className="text-[10px] text-slate-600 dark:text-[#94A3B8] font-mono">
                  {dados.balancoMassa.percentualPerdasPct.toFixed(1)}%
                </span>
              </div>
            </div>

            {/* Barra */}
            <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-[#111827] overflow-hidden flex">
              {dados.balancoMassa.itens.map((item) => (
                <div
                  key={item.categoria}
                  style={{
                    width: `${item.percentual}%`,
                    backgroundColor: item.cor,
                  }}
                  className="h-full"
                  title={`${item.rotulo}: ${item.percentual.toFixed(1)}%`}
                />
              ))}
            </div>

            <p className="text-[9px] text-slate-600 dark:text-[#94A3B8] leading-relaxed">
              {dados.balancoMassa.reservaPreLaudo}
            </p>
          </div>
        )}

        {/* Resumo das 3 Camadas no Banner */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0A1628] border border-emerald-500/20 dark:border-slate-800">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-bold text-emerald-700 dark:text-[#059669] flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                Camada 1: Gate
              </span>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-100 dark:bg-[#059669]/10 text-emerald-800 dark:text-[#059669]">
                Pré-requisito
              </span>
            </div>
            <div className="font-heading font-bold text-sm text-slate-900 dark:text-[#F8FAFC]">
              Bateria, Pneus & Fluidos
            </div>
            <p className="text-[11px] text-slate-600 dark:text-[#94A3B8] mt-1 leading-snug">
              Sem claim de carbono. Condicionante de integridade legal do lote.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0A1628] border border-amber-300/40 dark:border-slate-800">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-bold text-amber-700 dark:text-[#D9B36C] flex items-center gap-1.5">
                <Droplets className="w-4 h-4" />
                Camada 2: Óleo RLO
              </span>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-amber-100 dark:bg-[#D9B36C]/10 text-amber-800 dark:text-[#D9B36C]">
                Estimativa
              </span>
            </div>
            <div className="font-heading font-bold text-sm text-slate-900 dark:text-[#F8FAFC]">
              Rerrefino Industrial
            </div>
            <p className="text-[11px] text-slate-600 dark:text-[#94A3B8] mt-1 leading-snug">
              -{camada2.totalCo2eEvitadoKg.toFixed(2)} kg CO₂e evitado (sujeito a validação do VVB).
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0A1628] border border-emerald-500/30 dark:border-slate-800">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-bold text-emerald-700 dark:text-[#059669] flex items-center gap-1.5">
                <Flame className="w-4 h-4" />
                Camada 3: Metais
              </span>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-100 dark:bg-[#059669]/15 text-emerald-800 dark:text-[#059669] font-bold">
                Claim Principal
              </span>
            </div>
            <div className="font-heading font-bold text-sm text-slate-900 dark:text-[#F8FAFC]">
              Carcaça & Catalisadores
            </div>
            <p className="text-[11px] text-slate-600 dark:text-[#94A3B8] mt-1 leading-snug">
              -{camada3.totalCo2eEvitadoKg.toFixed(2)} kg CO₂e comprovado via NF do reciclador.
            </p>
          </div>
        </div>

        {/* Filtros de Visualização Rápida */}
        <div className="flex flex-wrap items-center gap-2 pt-6 border-t border-slate-200 dark:border-slate-800 mt-6">
          <span className="text-xs text-slate-600 dark:text-[#94A3B8] mr-2">Filtrar camada:</span>
          <button
            type="button"
            onClick={() => setCamadaAtivaFiltro('todas')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              camadaAtivaFiltro === 'todas'
                ? 'bg-emerald-600 text-white dark:bg-[#2563EB]'
                : 'bg-slate-100 dark:bg-[#111827] text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-[#F8FAFC]'
            }`}
          >
            Todas as 3 Camadas
          </button>
          <button
            type="button"
            onClick={() => setCamadaAtivaFiltro('1')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              camadaAtivaFiltro === '1'
                ? 'bg-emerald-600 text-white dark:bg-[#2563EB]'
                : 'bg-slate-100 dark:bg-[#111827] text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-[#F8FAFC]'
            }`}
          >
            Camada 1: Gate de Despoluição
          </button>
          <button
            type="button"
            onClick={() => setCamadaAtivaFiltro('2')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              camadaAtivaFiltro === '2'
                ? 'bg-amber-600 text-white dark:bg-[#D9B36C] dark:text-[#0E1A2E]'
                : 'bg-slate-100 dark:bg-[#111827] text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-[#F8FAFC]'
            }`}
          >
            Camada 2: Óleo RLO (Estimativa)
          </button>
          <button
            type="button"
            onClick={() => setCamadaAtivaFiltro('3')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              camadaAtivaFiltro === '3'
                ? 'bg-emerald-600 text-white dark:bg-[#2563EB]'
                : 'bg-slate-100 dark:bg-[#111827] text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-[#F8FAFC]'
            }`}
          >
            Camada 3: Metais & Reciclagem (Claim)
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* CAMADA 1: GATE DE DESPOLUIÇÃO */}
      {/* ========================================================================= */}
      {(camadaAtivaFiltro === 'todas' || camadaAtivaFiltro === '1') && (
        <section className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#0E1A2E] border-2 border-slate-200 dark:border-slate-800 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-[#111827] border border-emerald-300 dark:border-[#059669]/40 text-emerald-700 dark:text-[#059669] text-[11px] font-bold uppercase tracking-wider mb-2">
                <ShieldCheck className="w-3.5 h-3.5" />
                CAMADA 1 • PRÉ-REQUISITO MANDATÓRIO
              </div>
              <h3 className="font-heading font-black text-xl sm:text-2xl text-slate-900 dark:text-[#F8FAFC]">
                Gate de Despoluição Veicular (Depollution Gate)
              </h3>
              <p className="text-xs text-slate-600 dark:text-[#94A3B8] mt-1">
                Bateria, pneus e fluidos como condicionante essencial de conformidade ambiental do
                lote.
              </p>
            </div>

            <div className="text-right shrink-0">
              <span className="text-[10px] font-mono uppercase text-slate-500 dark:text-[#94A3B8] block">
                Impacto em Carbono
              </span>
              <span className="text-xs font-bold text-slate-600 dark:text-[#94A3B8] bg-slate-100 dark:bg-[#0A1628] px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-800 inline-block mt-0.5">
                0,00 kg (Não gera claim positivo)
              </span>
            </div>
          </div>

          {/* Base Legal e Reserva Pré-Laudo da Camada 1 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0A1628] border border-slate-200 dark:border-slate-800 space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-[#059669] tracking-wider block">
                Bases Legais Vinculantes
              </span>
              <p className="text-[11px] text-slate-900 dark:text-[#F8FAFC] font-medium leading-relaxed">
                {camada1.baseLegalPadrao}
              </p>
              <p className="text-[10px] text-slate-600 dark:text-[#94A3B8]">
                Atendimento aos requisitos de drenagem estanque e destinação em plantas licenciadas
                pelos órgãos estaduais do SISNAMA.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0A1628] border border-amber-300/40 dark:border-slate-800 space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-amber-700 dark:text-[#D9B36C] tracking-wider block flex items-center gap-1">
                <Info className="w-3.5 h-3.5" />
                Reserva Metodológica Pré-Laudo
              </span>
              <p className="text-[11px] text-slate-600 dark:text-[#94A3B8] leading-relaxed">
                {camada1.reservaPreLaudo}
              </p>
            </div>
          </div>

          {/* Tabela de Itens da Camada 1 */}
          <div className="space-y-4">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-[#94A3B8]">
              Evidências Fiscais & Manifestos de Transporte (MTR / SINIR)
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-[#94A3B8] uppercase font-semibold text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Fluxo / Material</th>
                    <th className="py-2.5 px-3">Taxonomia Decreto 11.413/2023</th>
                    <th className="py-2.5 px-3">Qtd / Massa</th>
                    <th className="py-2.5 px-3">MTR / SINIR</th>
                    <th className="py-2.5 px-3">NF do Destinador</th>
                    <th className="py-2.5 px-3">Destinador Licenciado</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-3 text-right">Hash SHA-256</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-900 dark:text-[#F8FAFC]">
                  {camada1.itens.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50 dark:hover:bg-[#111827]/60 transition-colors"
                    >
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-900 dark:text-[#F8FAFC]">
                          {item.titulo}
                        </div>
                        <div className="text-[10px] text-slate-600 dark:text-[#94A3B8] leading-snug">
                          {item.descricao_material}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-[#D9B36C]/15 text-amber-700 dark:text-[#D9B36C] border border-amber-300 dark:border-[#D9B36C]/40">
                          <ShieldAlert className="w-3 h-3 text-amber-600 dark:text-[#D9B36C]" />
                          Sujeito à LR Dec. 11.413
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-amber-700 dark:text-[#D9B36C] whitespace-nowrap">
                        {item.quantidade} {item.unidade}
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-mono text-[11px] text-emerald-700 dark:text-[#059669] font-semibold bg-emerald-50 dark:bg-[#059669]/10 px-2 py-0.5 rounded border border-emerald-300 dark:border-[#059669]/20">
                          {item.mtr_sinir}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-mono text-[11px] text-slate-900 dark:text-[#F8FAFC]">
                          {item.nf_destinador}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-[11px]">
                        <div className="font-medium text-slate-900 dark:text-[#F8FAFC]">
                          {item.razao_social_destinador}
                        </div>
                        <div className="font-mono text-[10px] text-slate-500 dark:text-[#94A3B8]">
                          CNPJ: {item.cnpj_destinador} {dados.is_demo ? '(DEMO)' : ''}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-[#059669] bg-emerald-50 dark:bg-[#059669]/15 px-2 py-0.5 rounded-full border border-emerald-300 dark:border-[#059669]/30">
                          <CheckCircle2 className="w-3 h-3" />
                          Comprovado
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => copyToClipboard(item.hash_sha256, item.id)}
                          className="inline-flex items-center gap-1 font-mono text-[10px] text-slate-600 dark:text-[#94A3B8] hover:text-emerald-700 dark:hover:text-[#059669] bg-slate-100 dark:bg-[#0A1628] px-2 py-1 rounded border border-slate-200 dark:border-slate-800"
                          title={`Hash SHA-256: ${item.hash_sha256}`}
                        >
                          {copiedHashId === item.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600 dark:text-[#059669]" />
                              <span className="text-emerald-700 dark:text-[#059669]">OK</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>{item.hash_sha256.slice(0, 10)}...</span>
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* CAMADA 2: ÓLEO USADO (RLO) -> RERREFINADOR (ESTIMATIVA) */}
      {/* ========================================================================= */}
      {(camadaAtivaFiltro === 'todas' || camadaAtivaFiltro === '2') && (
        <section className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#0E1A2E] border-2 border-amber-300 dark:border-[#D9B36C]/40 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-[#111827] border border-amber-300 dark:border-[#D9B36C]/40 text-amber-700 dark:text-[#D9B36C] text-[11px] font-bold uppercase tracking-wider mb-2">
                <Droplets className="w-3.5 h-3.5" />
                CAMADA 2 • LOGÍSTICA REVERSA RLO
              </div>
              <h3 className="font-heading font-black text-xl sm:text-2xl text-slate-900 dark:text-[#F8FAFC]">
                Óleo Lubrificante Usado ou Contaminado (RLO) & Rerrefino
              </h3>
              <p className="text-xs text-slate-600 dark:text-[#94A3B8] mt-1">
                Destinação de cárter ao rerrefinador industrial com emissões evitadas sinalizadas
                obrigatoriamente como estimativa.
              </p>
            </div>

            <div className="text-right shrink-0 p-3 rounded-xl bg-slate-50 dark:bg-[#0A1628] border border-amber-300 dark:border-[#D9B36C]/40">
              <span className="text-[10px] font-mono uppercase text-amber-700 dark:text-[#D9B36C] font-bold block">
                CO₂e Evitado Estimado
              </span>
              <div className="font-heading font-black text-2xl text-amber-700 dark:text-[#D9B36C]">
                -{camada2.totalCo2eEvitadoKg.toFixed(2)} kg
              </div>
              <span className="text-[9px] text-slate-500 dark:text-[#94A3B8] block uppercase font-mono">
                Sinalizado como Estimativa
              </span>
            </div>
          </div>

          {/* Reserva Rigorosa de Estimativa da Camada 2 */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#0A1628] border-2 border-amber-300 dark:border-[#D9B36C]/50 space-y-2">
            <div className="flex items-center gap-2 text-amber-700 dark:text-[#D9B36C] font-bold text-xs uppercase">
              <AlertTriangle className="w-4 h-4" />
              <span>Reserva Metodológica Obrigatória: Estimativa Sujeita a Validação do VVB</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-[#94A3B8] leading-relaxed">
              {camada2.reservaPreLaudo}
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] font-mono text-amber-700 dark:text-[#D9B36C]">
              <span>Base Regulamentar: {camada2.baseLegalPadrao}</span>
            </div>
          </div>

          {/* Tabela de RLO */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-[#94A3B8] uppercase font-semibold text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Fluxo RLO</th>
                  <th className="py-2.5 px-3">Taxonomia Decreto 11.413/2023</th>
                  <th className="py-2.5 px-3">Volume Coletado</th>
                  <th className="py-2.5 px-3">MTR / SINIR</th>
                  <th className="py-2.5 px-3">NF do Rerrefinador</th>
                  <th className="py-2.5 px-3">Rerrefinador Autorizado</th>
                  <th className="py-2.5 px-3 text-right">CO₂e Evitado (Estimativa)</th>
                  <th className="py-2.5 px-3 text-right">Hash SHA-256</th>
                </tr>{' '}
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-900 dark:text-[#F8FAFC]">
                {camada2.itens.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50 dark:hover:bg-[#111827]/60 transition-colors"
                  >
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-900 dark:text-[#F8FAFC]">
                        {item.titulo}
                      </div>
                      <div className="text-[10px] text-slate-600 dark:text-[#94A3B8]">
                        {item.descricao_material}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-[#D9B36C]/15 text-amber-700 dark:text-[#D9B36C] border border-amber-300 dark:border-[#D9B36C]/40">
                        <ShieldAlert className="w-3 h-3 text-amber-600 dark:text-[#D9B36C]" />
                        Sujeito à LR Dec. 11.413 (OLUC)
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-amber-700 dark:text-[#D9B36C] whitespace-nowrap">
                      {item.quantidade} {item.unidade}
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-mono text-[11px] text-emerald-700 dark:text-[#059669] font-semibold bg-emerald-50 dark:bg-[#059669]/10 px-2 py-0.5 rounded border border-emerald-300 dark:border-[#059669]/20">
                        {item.mtr_sinir}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-mono text-[11px] text-slate-900 dark:text-[#F8FAFC]">
                        {item.nf_destinador}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-[11px]">
                      <div className="font-medium text-slate-900 dark:text-[#F8FAFC]">
                        {item.razao_social_destinador}
                      </div>
                      <div className="font-mono text-[10px] text-slate-500 dark:text-[#94A3B8]">
                        CNPJ: {item.cnpj_destinador} {dados.is_demo ? '(DEMO)' : ''}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="font-mono font-bold text-amber-700 dark:text-[#D9B36C]">
                        -{item.co2e_evitado_kg.toFixed(2)} kg
                      </div>
                      <span className="inline-block text-[9px] uppercase px-1.5 py-0.2 rounded bg-amber-100 dark:bg-[#D9B36C]/20 text-amber-800 dark:text-[#D9B36C] border border-amber-300 dark:border-[#D9B36C]/30 font-semibold">
                        Estimativa
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => copyToClipboard(item.hash_sha256, item.id)}
                        className="inline-flex items-center gap-1 font-mono text-[10px] text-slate-600 dark:text-[#94A3B8] hover:text-emerald-700 dark:hover:text-[#059669] bg-slate-100 dark:bg-[#0A1628] px-2 py-1 rounded border border-slate-200 dark:border-slate-800"
                        title={`Hash SHA-256: ${item.hash_sha256}`}
                      >
                        {copiedHashId === item.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600 dark:text-[#059669]" />
                            <span className="text-emerald-700 dark:text-[#059669]">OK</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>{item.hash_sha256.slice(0, 10)}...</span>
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* CAMADA 3: METAIS / CARCAÇA / CATALISADORES (CLAIM PRINCIPAL) */}
      {/* ========================================================================= */}
      {(camadaAtivaFiltro === 'todas' || camadaAtivaFiltro === '3') && (
        <section className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#0E1A2E] border-2 border-emerald-500/30 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-[#111827] border border-emerald-300 dark:border-[#059669]/40 text-emerald-700 dark:text-[#059669] text-[11px] font-bold uppercase tracking-wider mb-2">
                <Flame className="w-3.5 h-3.5" />
                CAMADA 3 • CLAIM PRINCIPAL DE CARBONO EVITADO
              </div>
              <h3 className="font-heading font-black text-xl sm:text-2xl text-slate-900 dark:text-[#F8FAFC]">
                Metais, Carcaça & Catalisadores (Reciclagem em Aciaria)
              </h3>
              <p className="text-xs text-slate-600 dark:text-[#94A3B8] mt-1">
                Lastro de descarbonização do lote suportado por notas fiscais eletrônicas de entrada
                em reciclador siderúrgico.
              </p>
            </div>

            <div className="text-right shrink-0 p-3 rounded-xl bg-slate-50 dark:bg-[#0A1628] border border-emerald-500/30 dark:border-slate-800">
              <span className="text-[10px] font-mono uppercase text-emerald-700 dark:text-[#059669] font-bold block">
                Claim Principal de Reciclagem
              </span>
              <div className="font-heading font-black text-3xl text-emerald-700 dark:text-[#059669]">
                -{camada3.totalCo2eEvitadoKg.toFixed(2)} kg
              </div>
              <span className="text-[9px] text-slate-500 dark:text-[#94A3B8] block uppercase font-mono">
                CO₂e Evitado Comprovado
              </span>
            </div>
          </div>

          {/* Reserva Pré-Laudo da Camada 3 */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0A1628] border border-emerald-500/20 dark:border-slate-800 space-y-1.5 text-xs">
            <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-[#059669] tracking-wider block">
              Metodologia de Descarbonização Berço-ao-Portão & Reserva Pré-Laudo
            </span>
            <p className="text-[11px] text-slate-600 dark:text-[#94A3B8] leading-relaxed">
              {camada3.reservaPreLaudo}
            </p>
            <div className="text-[10px] font-mono text-amber-700 dark:text-[#D9B36C]">
              Normas de Referência: {camada3.baseLegalPadrao}
            </div>
          </div>

          {/* Tabela de Reciclagem de Metais */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-[#94A3B8] uppercase font-semibold text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Fração Reciclada</th>
                  <th className="py-2.5 px-3">Taxonomia Decreto 11.413/2023</th>
                  <th className="py-2.5 px-3">Massa Aferida</th>
                  <th className="py-2.5 px-3">MTR / SINIR</th>
                  <th className="py-2.5 px-3">NF do Reciclador</th>
                  <th className="py-2.5 px-3">Reciclador Homologado</th>
                  <th className="py-2.5 px-3 text-right">CO₂e Evitado</th>
                  <th className="py-2.5 px-3 text-right">Hash SHA-256</th>
                </tr>{' '}
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-900 dark:text-[#F8FAFC]">
                {camada3.itens.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50 dark:hover:bg-[#111827]/60 transition-colors"
                  >
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-900 dark:text-[#F8FAFC]">
                        {item.titulo}
                      </div>
                      <div className="text-[10px] text-slate-600 dark:text-[#94A3B8]">
                        {item.descricao_material}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 dark:bg-[#111827] text-slate-600 dark:text-[#94A3B8] border border-slate-200 dark:border-slate-800">
                        Metal Convencional
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-amber-700 dark:text-[#D9B36C] whitespace-nowrap">
                      {item.quantidade} {item.unidade}
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-mono text-[11px] text-emerald-700 dark:text-[#059669] font-semibold bg-emerald-50 dark:bg-[#059669]/10 px-2 py-0.5 rounded border border-emerald-300 dark:border-[#059669]/20">
                        {item.mtr_sinir}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-mono text-[11px] text-emerald-700 dark:text-[#059669] font-bold">
                        {item.nf_destinador}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-[11px]">
                      <div className="font-medium text-slate-900 dark:text-[#F8FAFC]">
                        {item.razao_social_destinador}
                      </div>
                      <div className="font-mono text-[10px] text-slate-500 dark:text-[#94A3B8]">
                        CNPJ: {item.cnpj_destinador} {dados.is_demo ? '(DEMO)' : ''}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-sm text-emerald-700 dark:text-[#059669]">
                      -{item.co2e_evitado_kg.toFixed(2)} kg
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => copyToClipboard(item.hash_sha256, item.id)}
                        className="inline-flex items-center gap-1 font-mono text-[10px] text-slate-600 dark:text-[#94A3B8] hover:text-emerald-700 dark:hover:text-[#059669] bg-slate-100 dark:bg-[#0A1628] px-2 py-1 rounded border border-slate-200 dark:border-slate-800"
                        title={`Hash SHA-256: ${item.hash_sha256}`}
                      >
                        {copiedHashId === item.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600 dark:text-[#059669]" />
                            <span className="text-emerald-700 dark:text-[#059669]">OK</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>{item.hash_sha256.slice(0, 10)}...</span>
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* CONSOLIDAÇÃO GERAL & CLÁUSULA DE RESERVA PRÉ-LAUDO */}
      {/* ========================================================================= */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#0A1628] border-2 border-emerald-500/30 dark:border-slate-800 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-emerald-600 dark:text-[#059669]" />
            <span className="font-heading font-extrabold text-sm uppercase tracking-wider text-slate-900 dark:text-[#F8FAFC]">
              INTEGRIDADE CRIPTOGRÁFICA DA DESTINAÇÃO FINAL
            </span>
          </div>
          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 dark:text-[#059669] bg-emerald-50 dark:bg-[#059669]/15 px-3 py-1 rounded-full border border-emerald-300 dark:border-[#059669]/30">
            <CheckCircle2 className="w-4 h-4" />
            Integridade verificada ✓
          </span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 dark:bg-[#0E1A2E] p-3 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-mono text-slate-600 dark:text-[#94A3B8] block uppercase">
              Hash SHA-256 Canônico Consolidado da Destinação Final
            </span>
            <span className="font-mono text-xs text-amber-700 dark:text-[#D9B36C] break-all select-all">
              {dados.hashGeralDestinacao}
            </span>
          </div>
          <button
            type="button"
            onClick={() => copyToClipboard(dados.hashGeralDestinacao, 'hash-geral-dest')}
            className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-[#111827] text-xs font-semibold text-slate-700 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-[#F8FAFC] hover:bg-emerald-50 dark:hover:bg-[#059669]/20 transition-all flex items-center gap-1.5 shrink-0"
          >
            {copiedHashId === 'hash-geral-dest' ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-[#059669]" />
                <span className="text-emerald-700 dark:text-[#059669]">Copiado</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copiar Hash</span>
              </>
            )}
          </button>
        </div>

        <p className="text-[10px] text-slate-600 dark:text-[#94A3B8] leading-relaxed">
          {dados.reservaGeralPreLaudo}
        </p>
      </div>
    </div>
  )
}
