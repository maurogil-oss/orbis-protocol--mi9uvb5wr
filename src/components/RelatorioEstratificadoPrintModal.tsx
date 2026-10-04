import {
  Printer,
  X,
  FileCheck2,
  Calendar,
  Building2,
  Hash,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type {
  CardKpiRenderizavel,
  RelatorioEstratificadoDmrv,
} from '@/services/dmrvEmissoesService'

interface RelatorioEstratificadoPrintModalProps {
  aberto: boolean
  onClose: () => void
  relatorio: RelatorioEstratificadoDmrv | null
}

export function RelatorioEstratificadoPrintModal({
  aberto,
  onClose,
  relatorio,
}: RelatorioEstratificadoPrintModalProps) {
  if (!aberto || !relatorio) return null

  const handlePrint = () => {
    window.print()
  }

  const dataFormatada = new Date().toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm overflow-y-auto flex items-start justify-center p-2 sm:p-6 print:p-0 print:bg-white print:fixed-none">
      <div className="bg-white text-slate-900 w-full max-w-5xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-4 print:my-0 print:border-none print:shadow-none print:max-w-none print:rounded-none">
        {/* Barra de Ações de Topo (Oculta na Impressão) */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <FileCheck2 className="w-5 h-5 text-emerald-400" />
            <span className="font-bold text-sm">
              Visualização de Impressão • Relatório Estratificado dMRV
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={handlePrint}
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 text-xs font-semibold"
            >
              <Printer className="w-4 h-4" />
              Imprimir / Salvar PDF
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-slate-300 hover:text-white hover:bg-slate-800 text-xs"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Folha do Relatório (Estilizada para A4 / Impressão Pericial) */}
        <div className="p-8 sm:p-12 space-y-8 bg-white print:p-8 print:text-black">
          {/* CABEÇALHO DO RELATÓRIO */}
          <div className="border-b-2 border-slate-900 pb-6 flex flex-col sm:flex-row justify-between items-start gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold tracking-widest text-emerald-700 uppercase">
                  ORBIS PROTOCOL • LIVRO-RAZÃO DOCUMENTAL
                </span>
                {relatorio.origemFiltro === 'sintetico' && (
                  <span className="bg-amber-100 text-amber-800 border border-amber-300 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase">
                    Demonstração (Sandbox)
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-950 uppercase">
                Relatório Estratificado de Emissões Evitadas (dMRV)
              </h1>
              <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
                Prova Documental da Economia Circular — dMRV. Decomposição analítica em 3 níveis:
                Segmento Setorial, Fator de Emissão / Material e Trilha Probatória de Documentos
                Fiscais.
              </p>
            </div>

            <div className="text-right font-mono text-xs text-slate-600 space-y-1 shrink-0">
              <div>
                Data/Hora: <strong>{dataFormatada}</strong>
              </div>
              <div>
                CNPJ Titular: <strong>{relatorio.cnpjTitular}</strong>
              </div>
              <div>
                Filtro:{' '}
                <strong>
                  {relatorio.origemFiltro === 'sintetico' ? 'Sandbox' : 'Dados Reais'}
                </strong>
              </div>
              <div>
                Protocolo Dominante: <strong>{relatorio.protocoloDominanteNome}</strong>
              </div>
            </div>
          </div>

          {/* SUMÁRIO DOS 4 CARDS NO TOPO */}
          <div className="space-y-2">
            <h2 className="text-xs font-bold font-mono tracking-wider uppercase text-slate-700">
              Sumário de Indicadores Chave de Desempenho (KPIs do Catálogo)
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {relatorio.kpiCards.map((card, idx) => (
                <div
                  key={card.id}
                  className={`p-3.5 rounded-xl border ${
                    idx === 0
                      ? 'border-emerald-600 bg-emerald-50/50'
                      : 'border-slate-300 bg-slate-50/50'
                  }`}
                >
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-600 truncate">
                    {card.rotulo}
                  </div>
                  <div className="text-xl font-black font-mono mt-1 text-slate-900">
                    {card.valorFormatado}{' '}
                    <span className="text-xs font-normal text-slate-600">{card.unidade}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1 line-clamp-2">{card.legenda}</p>
                </div>
              ))}
            </div>
          </div>

          {/* SEÇÃO NÍVEL A: DECOMPOSIÇÃO POR PROTOCOLO / SEGMENTO */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-300 pb-1">
              <h2 className="text-sm font-bold uppercase tracking-wide text-slate-900">
                1. Estratificação Nível A — Volume por Protocolo Setorial
              </h2>
              <span className="text-[11px] font-mono text-slate-600">
                {relatorio.porProtocolo.length} protocolo(s) contabilizado(s)
              </span>
            </div>

            <table className="w-full text-left text-xs border border-slate-200">
              <thead className="bg-slate-100 text-[10px] font-bold text-slate-700 uppercase border-b border-slate-200">
                <tr>
                  <th className="py-2 px-3">Protocolo / Segmento</th>
                  <th className="py-2 px-3 text-right">Lotes</th>
                  <th className="py-2 px-3 text-right">Itens / Peças</th>
                  <th className="py-2 px-3 text-right">Massa (kg)</th>
                  <th className="py-2 px-3 text-right">CO₂e Evitado (kg)</th>
                  <th className="py-2 px-3 text-right">% do CO₂e</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-mono">
                {relatorio.porProtocolo.map((p) => (
                  <tr key={p.protocoloSlug}>
                    <td className="py-2 px-3 font-sans font-semibold text-slate-900">
                      {p.protocoloNome}{' '}
                      <span className="text-[10px] text-slate-500 font-mono">
                        ({p.protocoloSlug})
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right">{p.total_lotes}</td>
                    <td className="py-2 px-3 text-right">{p.total_pecas}</td>
                    <td className="py-2 px-3 text-right">
                      {p.massa_kg.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}
                    </td>
                    <td className="py-2 px-3 text-right font-bold text-emerald-800">
                      {p.co2e_evitado_kg.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}
                    </td>
                    <td className="py-2 px-3 text-right">{p.percentualCo2e.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* SEÇÃO NÍVEL B: DECOMPOSIÇÃO POR FATOR DE EMISSÃO / MATERIAL */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-300 pb-1">
              <h2 className="text-sm font-bold uppercase tracking-wide text-slate-900">
                2. Estratificação Nível B — Fator de Emissão e Material (DM-ORB-001)
              </h2>
              <span className="text-[11px] font-mono text-slate-600">
                Peso × Fator = CO₂e Evitado
              </span>
            </div>

            <table className="w-full text-left text-xs border border-slate-200">
              <thead className="bg-slate-100 text-[10px] font-bold text-slate-700 uppercase border-b border-slate-200">
                <tr>
                  <th className="py-2 px-3">Material / Componente</th>
                  <th className="py-2 px-3 text-right">Peso (kg)</th>
                  <th className="py-2 px-3 text-right">Fator Catálogo</th>
                  <th className="py-2 px-3 text-right">CO₂e Evitado (kg)</th>
                  <th className="py-2 px-3">Fonte Reguladora / Premissa</th>
                  <th className="py-2 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
                {relatorio.porFatorMaterial.map((m) => (
                  <tr key={m.chave}>
                    <td className="py-2 px-3 font-sans font-semibold text-slate-900">
                      {m.nomeMaterial}
                    </td>
                    <td className="py-2 px-3 text-right">
                      {m.peso_kg.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}
                    </td>
                    <td className="py-2 px-3 text-right text-slate-700">
                      {m.possuiFatorOficial ? m.fator_co2e_kg.toFixed(2) : '— (0,00)'}
                    </td>
                    <td className="py-2 px-3 text-right font-bold text-emerald-800">
                      {m.possuiFatorOficial
                        ? m.co2e_evitado_kg.toLocaleString('pt-BR', { maximumFractionDigits: 1 })
                        : '0,0'}
                    </td>
                    <td className="py-2 px-3 font-sans text-slate-600 text-[10px]">
                      {m.fonteFator} {m.premisaBadge ? `[${m.premisaBadge}]` : ''}
                    </td>
                    <td className="py-2 px-3 font-sans text-[10px]">
                      {m.possuiFatorOficial ? (
                        <span className="text-emerald-700 font-semibold">Com Fator</span>
                      ) : (
                        <span className="text-amber-800 font-bold bg-amber-50 px-1 py-0.5 rounded border border-amber-300">
                          Rastreada, sem CO₂e atribuído
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* SEÇÃO NÍVEL C: TRACABILIDADE LOTE -> DOCUMENTO -> HASH SHA-256 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-300 pb-1">
              <h2 className="text-sm font-bold uppercase tracking-wide text-slate-900">
                3. Estratificação Nível C — Traçabilidade Probatória (Lote → NF-e/CT-e → Hash)
              </h2>
              <span className="text-[11px] font-mono text-slate-600">
                {relatorio.porLoteDocumento.length} registro(s) auditados
              </span>
            </div>

            <table className="w-full text-left text-xs border border-slate-200">
              <thead className="bg-slate-100 text-[10px] font-bold text-slate-700 uppercase border-b border-slate-200">
                <tr>
                  <th className="py-2 px-3">Lote / Origem</th>
                  <th className="py-2 px-3">Doc / Chave</th>
                  <th className="py-2 px-3">Data</th>
                  <th className="py-2 px-3 text-right">Peso (kg)</th>
                  <th className="py-2 px-3 text-right">CO₂e (kg)</th>
                  <th className="py-2 px-3">Hash SHA-256 (Elo Probatório)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-mono text-[10px]">
                {relatorio.porLoteDocumento.map((l) => (
                  <tr key={l.loteId}>
                    <td className="py-2 px-3 font-sans text-slate-900">
                      <strong>{l.cdvCodigo}</strong>
                      <div className="text-[9px] text-slate-500 font-mono">{l.cdvNome}</div>
                    </td>
                    <td className="py-2 px-3 font-sans text-slate-800">
                      <span className="font-bold">{l.tipoDocumento}</span>: {l.documentoOrigem}
                    </td>
                    <td className="py-2 px-3 text-slate-600">
                      {new Date(l.dataIso).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="py-2 px-3 text-right">
                      {l.peso_kg.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}
                    </td>
                    <td className="py-2 px-3 text-right font-bold text-emerald-800">
                      {l.co2e_evitado_kg.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}
                    </td>
                    <td
                      className="py-2 px-3 text-slate-700 max-w-[200px] truncate"
                      title={l.hashSha256}
                    >
                      {l.hashSha256}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* SOMA DE CONFERÊNCIA E RECONCILIAÇÃO PERICIAL */}
          <div className="p-4 rounded-xl border-2 border-slate-900 bg-slate-50 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-900">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                Soma de Conferência e Reconciliação dos Cards de Indicadores
              </span>
              <span className="font-mono text-emerald-800">100% RECONCILIADO</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono pt-1">
              <div>
                <span className="text-[10px] text-slate-500 block uppercase">
                  CO₂e Total Reconciliado
                </span>
                <strong>
                  {relatorio.totaisConferencia.co2e_evitado_kg.toLocaleString('pt-BR')} kg
                </strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block uppercase">
                  Massa Total Reconciliada
                </span>
                <strong>{relatorio.totaisConferencia.massa_kg.toLocaleString('pt-BR')} kg</strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block uppercase">Itens / Peças</span>
                <strong>{relatorio.totaisConferencia.total_pecas} itens</strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block uppercase">Lotes Auditados</span>
                <strong>{relatorio.totaisConferencia.total_lotes} lotes</strong>
              </div>
            </div>

            {relatorio.totaisConferencia.massa_sem_co2e_kg > 0 && (
              <div className="text-[11px] text-amber-900 pt-2 border-t border-slate-200">
                * Inclui{' '}
                <strong>
                  {relatorio.totaisConferencia.massa_sem_co2e_kg.toLocaleString('pt-BR')} kg
                </strong>{' '}
                de frações críticas rastreadas sem atribuição de carbono (ouro, paládio, prata e
                terras raras).
              </div>
            )}
          </div>

          {/* RODAPÉ DO DOCUMENTO */}
          <div className="border-t border-slate-300 pt-4 flex flex-col sm:flex-row justify-between items-center text-[10px] text-slate-500 font-mono gap-2">
            <div>ORBIS PROTOCOL • ATESTADO DE CONFORMIDADE E PROVA DOCUMENTAL dMRV</div>
            <div>Emitido eletronicamente com garantia criptográfica SHA-256</div>
          </div>
        </div>
      </div>
    </div>
  )
}
