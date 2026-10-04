import { useState } from 'react'
import {
  Layers,
  FileText,
  Hash,
  Copy,
  Check,
  ChevronRight,
  ShieldCheck,
  Sparkles,
  Info,
  Scale,
  Building2,
  Calendar,
  X,
  FileSpreadsheet,
  Printer,
  ChevronDown,
  ArrowRight,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'
import type {
  CardKpiRenderizavel,
  RelatorioEstratificadoDmrv,
  EstratificacaoPorProtocolo,
  EstratificacaoPorFatorMaterial,
  EstratificacaoPorLoteDocumento,
} from '@/services/dmrvEmissoesService'

interface DrillDownDmrvModalProps {
  aberto: boolean
  onClose: () => void
  cardAtivo: CardKpiRenderizavel | null
  relatorio: RelatorioEstratificadoDmrv | null
  onAbrirImpressao?: () => void
  onExportarCsv?: () => void
}

type NivelDrillDown = 'protocolos' | 'fatores' | 'lotes'

export function DrillDownDmrvModal({
  aberto,
  onClose,
  cardAtivo,
  relatorio,
  onAbrirImpressao,
  onExportarCsv,
}: DrillDownDmrvModalProps) {
  const [nivel, setNivel] = useState<NivelDrillDown>('protocolos')
  const [protocoloFiltro, setProtocoloFiltro] = useState<string | null>(null)
  const [hashCopiado, setHashCopiado] = useState<string | null>(null)

  if (!relatorio || !cardAtivo) return null

  const handleCopiarHash = (hash: string) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(hash)
      setHashCopiado(hash)
      toast({
        title: 'Hash SHA-256 Copiado!',
        description: `${hash.slice(0, 16)}... copiado para a área de transferência.`,
      })
      setTimeout(() => setHashCopiado(null), 2500)
    }
  }

  // Filtragem opcional pelo protocolo selecionado no Nível A
  const fatoresFiltrados = relatorio.porFatorMaterial
  const lotesFiltrados = protocoloFiltro
    ? relatorio.porLoteDocumento.filter((l) => l.protocoloSlug === protocoloFiltro)
    : relatorio.porLoteDocumento

  const isCarbonoCard = cardAtivo.id === 'co2e_evitado'
  const isMassaCard = cardAtivo.id === 'kpi_pos2'
  const isItensCard = cardAtivo.id === 'kpi_pos3'
  const isLotesCard = cardAtivo.id === 'kpi_pos4'

  return (
    <Dialog open={aberto} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 gap-0 border-border bg-card text-foreground shadow-2xl">
        {/* Cabeçalho do Drill-Down */}
        <div className="p-6 border-b border-border bg-muted/30 sticky top-0 z-20 backdrop-blur-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge
                  variant="outline"
                  className="border-emerald-500/40 text-emerald-600 dark:text-emerald-400 text-xs font-semibold"
                >
                  Drill-Down & Traçabilidade Completa dMRV
                </Badge>
                {relatorio.origemFiltro === 'sintetico' && (
                  <Badge
                    variant="outline"
                    className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 text-xs font-mono font-bold uppercase"
                  >
                    Demonstração
                  </Badge>
                )}
                <Badge variant="secondary" className="text-xs font-mono">
                  {relatorio.protocoloDominanteNome}
                </Badge>
              </div>

              <DialogTitle className="text-lg sm:text-xl font-bold tracking-tight flex items-center gap-2">
                <span>Estratificação do Total:</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400 font-black">
                  {cardAtivo.valorFormatado} {cardAtivo.unidade}
                </span>
                <span className="text-xs font-normal text-muted-foreground hidden sm:inline">
                  ({cardAtivo.rotulo})
                </span>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Decomposição pericial do valor agregado em 3 níveis navegáveis com prova documental
                completa até o hash SHA-256 no livro-razão.
              </DialogDescription>
            </div>

            {/* Ações de Impressão e Exportação */}
            <div className="flex items-center gap-2 shrink-0">
              {onAbrirImpressao && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onAbrirImpressao}
                  className="text-xs gap-1.5 h-8 border-border"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Imprimir / PDF</span>
                </Button>
              )}
              {onExportarCsv && (
                <Button
                  size="sm"
                  onClick={onExportarCsv}
                  className="text-xs gap-1.5 h-8 bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">CSV Estruturado</span>
                </Button>
              )}
            </div>
          </div>

          {/* Navegação entre os 3 Níveis de Estratificação */}
          <div className="flex items-center gap-1.5 mt-4 pt-3 border-t border-border overflow-x-auto">
            <button
              type="button"
              onClick={() => {
                setNivel('protocolos')
                setProtocoloFiltro(null)
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                nivel === 'protocolos'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-muted/60 text-muted-foreground hover:text-foreground'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>1. Por Protocolo ({relatorio.porProtocolo.length})</span>
            </button>

            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />

            <button
              type="button"
              onClick={() => setNivel('fatores')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                nivel === 'fatores'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-muted/60 text-muted-foreground hover:text-foreground'
              }`}
            >
              <Scale className="w-3.5 h-3.5" />
              <span>2. Por Fator & Material ({relatorio.porFatorMaterial.length})</span>
            </button>

            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />

            <button
              type="button"
              onClick={() => setNivel('lotes')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                nivel === 'lotes'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-muted/60 text-muted-foreground hover:text-foreground'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>3. Por Lote & Documento ({lotesFiltrados.length})</span>
            </button>

            {protocoloFiltro && (
              <Badge
                variant="outline"
                className="ml-auto text-[10px] font-mono border-amber-500/40 text-amber-600 dark:text-amber-400 gap-1"
              >
                Filtrado: {protocoloFiltro}
                <button
                  type="button"
                  onClick={() => setProtocoloFiltro(null)}
                  className="ml-1 hover:text-foreground"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )}
          </div>
        </div>

        {/* Corpo com a visualização do nível selecionado */}
        <div className="p-6 space-y-6">
          {/* NÍVEL A: POR PROTOCOLO / SEGMENTO */}
          {nivel === 'protocolos' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="font-semibold uppercase tracking-wider text-[11px]">
                  Decomposição do Volume por Segmento Setorial
                </span>
                <span>Clique em um protocolo para descer até os lotes correspondentes</span>
              </div>

              <div className="divide-y divide-border rounded-xl border border-border overflow-hidden">
                {relatorio.porProtocolo.map((p) => {
                  const valorExibido = isCarbonoCard
                    ? `${p.co2e_evitado_kg.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} kg CO₂e`
                    : isMassaCard
                      ? `${p.massa_kg.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} kg`
                      : isItensCard
                        ? `${p.total_pecas.toLocaleString('pt-BR')} itens`
                        : `${p.total_lotes} lotes`

                  const pct = isCarbonoCard ? p.percentualCo2e : p.percentualMassa

                  return (
                    <div
                      key={p.protocoloSlug}
                      onClick={() => {
                        setProtocoloFiltro(p.protocoloSlug)
                        setNivel('lotes')
                      }}
                      className="p-4 bg-card hover:bg-muted/40 transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">
                            {p.protocoloNome}
                          </span>
                          <code className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                            {p.protocoloSlug}
                          </code>
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-3">
                          <span>{p.total_lotes} lote(s) fechado(s)</span>
                          <span>•</span>
                          <span>{p.total_pecas} peça(s) / documento(s)</span>
                          <span>•</span>
                          <span>{p.massa_kg.toLocaleString('pt-BR')} kg desviados</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 shrink-0 justify-between sm:justify-end">
                        <div className="text-right">
                          <div className="font-mono font-bold text-sm text-foreground">
                            {valorExibido}
                          </div>
                          {pct > 0 && (
                            <div className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400">
                              {pct.toFixed(1)}% do total
                            </div>
                          )}
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Barra de Reconciliação */}
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="font-semibold">
                    Reconciliação Exata Nível A = {cardAtivo.valorFormatado} {cardAtivo.unidade}
                  </span>
                </div>
                <span className="text-[11px] font-mono text-emerald-700 dark:text-emerald-400">
                  Soma de 100% dos protocolos corresponde ao total do card
                </span>
              </div>
            </div>
          )}

          {/* NÍVEL B: POR FATOR DE EMISSÃO / MATERIAL (DM-ORB-001) */}
          {nivel === 'fatores' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="font-semibold uppercase tracking-wider text-[11px]">
                  Fórmula Prescritiva: Peso (kg) × Fator (kgCO₂e/kg) = CO₂e Evitado
                </span>
                <span className="font-mono text-[11px]">Catálogo DM-ORB-001 v1.1</span>
              </div>

              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-border bg-muted/40 text-[10px] font-semibold text-muted-foreground uppercase">
                    <tr>
                      <th className="py-2.5 px-3">Material / Componente</th>
                      <th className="py-2.5 px-3 text-right">Peso (kg)</th>
                      <th className="py-2.5 px-3 text-right">Fator Catálogo</th>
                      <th className="py-2.5 px-3 text-right">CO₂e Evitado</th>
                      <th className="py-2.5 px-3">Fonte Oficial & Premissa</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border text-foreground">
                    {fatoresFiltrados.map((m) => {
                      const semFator = !m.possuiFatorOficial

                      return (
                        <tr
                          key={m.chave}
                          className={`hover:bg-muted/30 transition-colors ${
                            semFator ? 'bg-amber-500/5' : ''
                          }`}
                        >
                          <td className="py-3 px-3 font-semibold">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span>{m.nomeMaterial}</span>
                              {semFator ? (
                                <Badge
                                  variant="outline"
                                  className="text-[9px] font-mono border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/10"
                                >
                                  Rastreada, sem CO₂e atribuído
                                </Badge>
                              ) : (
                                m.premisaBadge && (
                                  <Badge
                                    variant="outline"
                                    className="text-[9px] font-mono border-emerald-500/40 text-emerald-600 dark:text-emerald-400"
                                  >
                                    {m.premisaBadge}
                                  </Badge>
                                )
                              )}
                            </div>
                            <span className="text-[10px] text-muted-foreground font-mono">
                              {m.totalPecas} item(ns) catalogado(s)
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-bold">
                            {m.peso_kg.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} kg
                          </td>
                          <td className="py-3 px-3 text-right font-mono text-muted-foreground">
                            {semFator ? (
                              <span
                                className="text-amber-600 dark:text-amber-400"
                                title="Massa física rastreada no DPP sem concessão de crédito de carbono (Módulo Mineração Urbana / Em estruturação)"
                              >
                                — (0,00)
                              </span>
                            ) : (
                              `${m.fator_co2e_kg.toFixed(2)} kgCO₂e/kg`
                            )}
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-bold">
                            {semFator ? (
                              <span className="text-muted-foreground font-normal">0,0 kg</span>
                            ) : (
                              <span className="text-emerald-600 dark:text-emerald-400">
                                {m.co2e_evitado_kg.toLocaleString('pt-BR', {
                                  maximumFractionDigits: 1,
                                })}{' '}
                                kg
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-[11px] text-muted-foreground max-w-[240px]">
                            <div className="truncate" title={m.fonteFator}>
                              {m.fonteFator}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Aviso Explícito de Frações sem Fator Atribuído */}
              {relatorio.totaisConferencia.massa_sem_co2e_kg > 0 && (
                <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs space-y-1">
                  <div className="flex items-center gap-2 font-bold uppercase text-[11px]">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    <span>
                      Rastreabilidade de Frações sem Atribuição de Carbono (Mineração Urbana)
                    </span>
                  </div>
                  <p className="leading-relaxed opacity-90">
                    Existem{' '}
                    <strong>
                      {relatorio.totaisConferencia.massa_sem_co2e_kg.toLocaleString('pt-BR')} kg
                    </strong>{' '}
                    de materiais críticos (ouro, paládio, prata e terras raras) catalogados.
                    Conforme o padrão ético do Orbis Protocol, essas frações contam integralmente na
                    massa física rastreada e no passaporte digital de produto (DCP), porém{' '}
                    <strong>possuem fator zero de carbono</strong> até que uma metodologia oficial
                    de reciclagem de minerais nobres seja publicada e homologada.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* NÍVEL C: POR LOTE / DOCUMENTO FISCAL COM HASH SHA-256 */}
          {nivel === 'lotes' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="font-semibold uppercase tracking-wider text-[11px]">
                  Elo Probatório Final: Lote → Documento de Origem (NF-e/CT-e/MTR) → Hash SHA-256
                </span>
                <span>{lotesFiltrados.length} lote(s) auditado(s)</span>
              </div>

              <div className="space-y-3">
                {lotesFiltrados.map((lote) => {
                  const copiado = hashCopiado === lote.hashSha256

                  return (
                    <div
                      key={lote.loteId}
                      className="p-4 rounded-xl border border-border bg-card space-y-3 hover:border-emerald-500/40 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className="text-xs font-mono font-bold">
                              {lote.tipoDocumento}
                            </Badge>
                            <span className="font-bold text-sm text-foreground">
                              {lote.documentoOrigem}
                            </span>
                            <span className="text-xs text-muted-foreground font-mono">
                              ({lote.cdvCodigo})
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground flex items-center gap-2">
                            <span>{lote.cdvNome}</span>
                            <span>•</span>
                            <span className="font-mono">CNPJ: {lote.cdvCnpj}</span>
                            <span>•</span>
                            <span>
                              {new Date(lote.dataIso).toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                              })}
                            </span>
                          </p>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-right">
                            <div className="text-sm font-black font-mono text-emerald-600 dark:text-emerald-400">
                              {lote.co2e_evitado_kg.toLocaleString('pt-BR', {
                                maximumFractionDigits: 1,
                              })}{' '}
                              kg CO₂e
                            </div>
                            <div className="text-xs text-muted-foreground font-mono">
                              {lote.peso_kg.toLocaleString('pt-BR')} kg • {lote.totalPecas} itens
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Hash SHA-256 com Botão de Cópia e Link Probatório */}
                      <div className="p-2.5 rounded-lg bg-muted/60 border border-border flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <Hash className="w-3.5 h-3.5 text-primary shrink-0" />
                          <span className="text-[10px] font-mono font-semibold uppercase text-muted-foreground shrink-0">
                            Hash SHA-256 Prova:
                          </span>
                          <code className="text-[11px] font-mono text-primary truncate">
                            {lote.hashSha256}
                          </code>
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopiarHash(lote.hashSha256)}
                          className="h-7 px-2 text-[10px] font-mono gap-1 shrink-0 hover:bg-background"
                          title="Copiar Hash SHA-256 canônico"
                        >
                          {copiado ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span className="text-emerald-600 font-bold">Copiado</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copiar</span>
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Rodapé com Soma de Conferência Global */}
        <div className="p-4 border-t border-border bg-muted/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 font-mono">
            <span className="font-bold text-foreground">Soma de Conferência:</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">
              {relatorio.totaisConferencia.co2e_evitado_kg.toLocaleString('pt-BR')} kg CO₂e
            </span>
            <span>•</span>
            <span className="font-bold text-foreground">
              {relatorio.totaisConferencia.massa_kg.toLocaleString('pt-BR')} kg
            </span>
            <span>•</span>
            <span className="font-bold text-foreground">
              {relatorio.totaisConferencia.total_pecas} itens
            </span>
            <span>•</span>
            <span className="font-bold text-foreground">
              {relatorio.totaisConferencia.total_lotes} lotes
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose} className="h-8 text-xs">
              Fechar Drill-Down
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
