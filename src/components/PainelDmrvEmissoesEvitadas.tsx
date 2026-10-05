import { useState, useEffect } from 'react'
import {
  TrendingDown,
  Scale,
  ShieldCheck,
  Download,
  Building2,
  Calendar,
  Layers,
  Leaf,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Info,
  Clock,
  ArrowUpRight,
  RefreshCw,
  Hash,
  PenLine,
  Award,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/AuthContext'
import {
  carregarDadosDmrvEmpresa,
  exportarRelatorioDmrvCsv,
  classificarSbce,
  type DadosDmrvEmpresa,
  type FiltroOrigemDmrv,
  type CardKpiRenderizavel,
} from '@/services/dmrvEmissoesService'
import { obterStatusCertificadoA1, type CertificadoA1Status } from '@/services/infosimplesService'
import { ModalAssinaturaLaudo } from '@/components/ModalAssinaturaLaudo'
import { DrillDownDmrvModal } from '@/components/DrillDownDmrvModal'
import { RelatorioEstratificadoPrintModal } from '@/components/RelatorioEstratificadoPrintModal'
import { SimuladorReferencialSection } from '@/components/SimuladorReferencialSection'
import { Sparkles, Printer, ExternalLink, Calculator, FileText } from 'lucide-react'

interface PainelDmrvEmissoesEvitadasProps {
  /**
   * Quando true, habilita a aba do Simulador Referencial de Potencial de Crédito.
   * Regra nº 5: O simulador é estritamente exclusivo do Console Administrativo (/admin).
   */
  permitirSimulador?: boolean
}

export function PainelDmrvEmissoesEvitadas({
  permitirSimulador = true,
}: PainelDmrvEmissoesEvitadasProps) {
  const { user } = useAuth()
  const [filtroOrigem, setFiltroOrigem] = useState<FiltroOrigemDmrv>('producao')
  const [verticalSelecionada, setVerticalSelecionada] = useState<string>('')
  const [dados, setDados] = useState<DadosDmrvEmpresa | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [exportando, setExportando] = useState(false)
  const [hashGerado, setHashGerado] = useState<string | null>(null)
  const [statusA1, setStatusA1] = useState<CertificadoA1Status | null>(null)
  const [modalAssinaturaAberto, setModalAssinaturaAberto] = useState(false)
  const [laudoSelecionado, setLaudoSelecionado] = useState<{
    id: string
    titulo?: string
    codigo_verificacao?: string
    hash_sha256?: string
    tipo_relatorio?: string
  } | null>(null)

  // Estado do Drill-Down e do Modal de Impressão
  const [cardDrillDownSelecionado, setCardDrillDownSelecionado] =
    useState<CardKpiRenderizavel | null>(null)
  const [modalDrillDownAberto, setModalDrillDownAberto] = useState(false)
  const [modalPrintAberto, setModalPrintAberto] = useState(false)

  // Sub-aba interna do painel: Prova Documental (dMRV) vs Potencial Referencial (Informativo)
  const [subAbaAtiva, setSubAbaAtiva] = useState<'dmrv_documental' | 'potencial_referencial'>(
    'dmrv_documental',
  )

  const carregar = async (
    origemAtual: FiltroOrigemDmrv = filtroOrigem,
    verticalAtual: string = verticalSelecionada,
  ) => {
    setCarregando(true)
    try {
      const info = await carregarDadosDmrvEmpresa(
        user?.cnpj,
        origemAtual,
        verticalAtual || undefined,
      )
      setDados(info)
      // Se não havia vertical selecionada explicitamente, adotar o protocolo dominante como padrão
      if (!verticalAtual && info.protocoloDominanteSlug) {
        setVerticalSelecionada(info.protocoloDominanteSlug)
      }
    } catch {
      toast({
        title: 'Erro ao carregar dados dMRV',
        description: 'Falha ao consolidar métricas de emissões evitadas para a sua empresa.',
        variant: 'destructive',
      })
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    // Ao alternar filtro Real/Sandbox, resetar vertical explicitada para recalcular dominante da nova origem
    setVerticalSelecionada('')
    carregar(filtroOrigem, '')
  }, [user, filtroOrigem])

  const handleTrocarVertical = (novoSlug: string) => {
    setVerticalSelecionada(novoSlug)
    carregar(filtroOrigem, novoSlug)
  }

  // Tarefa 2: Carrega o status da custódia A1 ativa do cliente para habilitar assinatura ICP-Brasil
  useEffect(() => {
    const carregarStatusA1 = async () => {
      try {
        const st = await obterStatusCertificadoA1(user?.id)
        setStatusA1(st)
      } catch {
        setStatusA1(null)
      }
    }
    if (user?.id) carregarStatusA1()
  }, [user?.id])

  const custodiaA1Ativa =
    Boolean(statusA1) && statusA1?.status_custodia === 'ativo' && statusA1?.ativo === true
  const handleExportarCsv = async () => {
    if (!dados) return
    setExportando(true)
    try {
      const res = await exportarRelatorioDmrvCsv(dados, user?.id)
      setHashGerado(res.hash)

      const a = document.createElement('a')
      a.href = res.url
      a.download = res.nomeArquivo
      a.click()

      toast({
        title: 'Relatório dMRV Exportado com Sucesso!',
        description: `Hash registrado no livro-razão relatorios_exportados: ${res.hash.slice(0, 16)}...`,
      })
      carregar()
    } catch (e: any) {
      toast({
        title: 'Erro na exportação',
        description: e?.message || 'Falha ao gerar relatório dMRV formatado.',
        variant: 'destructive',
      })
    } finally {
      setExportando(false)
    }
  }

  if (carregando || !dados) {
    return (
      <div className="p-8 text-center space-y-3">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
        <p className="text-xs text-muted-foreground font-mono">
          Consolidando série temporal dMRV e inventário GHG Protocol...
        </p>
      </div>
    )
  }

  const sbce = classificarSbce(dados.emissao_anual_tco2e)

  return (
    <div className="space-y-6">
      {/* Topo do Painel dMRV com Seletor Real/Sandbox */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-card border border-border shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge
              variant="outline"
              className="border-emerald-500/40 text-emerald-600 dark:text-emerald-400 text-xs font-semibold"
            >
              dMRV Digital • GHG Protocol
            </Badge>
            <Badge variant="secondary" className="text-xs font-mono">
              Enquadramento SBCE Ativo
            </Badge>
            {filtroOrigem === 'sintetico' && (
              <Badge
                variant="outline"
                className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 text-xs font-mono font-bold uppercase"
              >
                Demonstração
              </Badge>
            )}
            <span className="text-xs text-muted-foreground font-mono">CNPJ: {dados.cnpj}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
            Painel dMRV de Emissões Evitadas & Descarbonização
          </h2>
          <p className="text-xs text-muted-foreground max-w-2xl leading-relaxed">
            Painel autenticado exclusivo por empresa. Monitoramento, Relato e Verificação (MRV) com
            série temporal de CO₂e evitado, balanço ponderal, inventário dos Escopos 1, 2 e 3 e
            conformidade com o SBCE.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 shrink-0 flex-wrap">
          {/* Seletor Real (Produção) vs Sandbox (Demonstração) */}
          <div className="inline-flex rounded-xl p-1 bg-muted/60 border border-border">
            <button
              type="button"
              onClick={() => setFiltroOrigem('producao')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                filtroOrigem === 'producao'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Dados Reais (Produção)
            </button>
            <button
              type="button"
              onClick={() => setFiltroOrigem('sintetico')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                filtroOrigem === 'sintetico'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Sparkles className="w-3 h-3" />
              <span>Sandbox (Demonstração)</span>
            </button>
          </div>

          {/* Seletor de Vertical em Foco */}
          {dados.verticaisDisponiveis && dados.verticaisDisponiveis.length > 0 && (
            <div className="flex items-center gap-1.5 bg-muted/60 border border-border rounded-xl px-2.5 py-1 text-xs">
              <label
                htmlFor="seletor-vertical-foco"
                className="text-[11px] font-semibold text-muted-foreground whitespace-nowrap"
              >
                Vertical em foco:
              </label>
              <select
                id="seletor-vertical-foco"
                data-testid="seletor-vertical-foco"
                value={verticalSelecionada || dados.protocoloDominanteSlug || ''}
                onChange={(e) => handleTrocarVertical(e.target.value)}
                className="bg-transparent text-xs font-bold text-foreground border-none outline-none cursor-pointer pr-1 py-0.5"
              >
                {dados.verticaisDisponiveis.map((v) => (
                  <option key={v.slug} value={v.slug} className="bg-popover text-foreground">
                    {v.nome} ({v.totalLotes} lote{v.totalLotes === 1 ? '' : 's'})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => carregar(filtroOrigem)}
              disabled={carregando}
              className="gap-1.5 text-xs"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${carregando ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setModalPrintAberto(true)}
              className="gap-1.5 text-xs"
              title="Abrir versão para impressão / PDF formal do relatório estratificado"
            >
              <Printer className="h-3.5 w-3.5 text-primary" />
              <span>Imprimir / PDF</span>
            </Button>
            <Button
              size="sm"
              onClick={handleExportarCsv}
              disabled={exportando}
              className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <FileSpreadsheet className="h-4 w-4" />
              {exportando ? 'Exportando...' : 'Exportar Relatório dMRV (CSV)'}
            </Button>
          </div>
        </div>
      </div>

      {/* SELETOR DE SUB-ABAS: PROVA DOCUMENTAL (dMRV) vs POTENCIAL REFERENCIAL (REGRA DE SEPARAÇÃO Nº 3) */}
      {permitirSimulador && (
        <div className="flex items-center gap-2 border-b border-border pb-2">
          <Button
            variant={subAbaAtiva === 'dmrv_documental' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setSubAbaAtiva('dmrv_documental')}
            className={`gap-2 text-xs font-bold ${
              subAbaAtiva === 'dmrv_documental'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>1. Prova Documental dMRV (Auditoria & SBCE)</span>
          </Button>

          <Button
            variant={subAbaAtiva === 'potencial_referencial' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setSubAbaAtiva('potencial_referencial')}
            className={`gap-2 text-xs font-bold ${
              subAbaAtiva === 'potencial_referencial'
                ? 'bg-amber-600 hover:bg-amber-700 text-slate-950 font-black shadow-sm'
                : 'text-amber-700 dark:text-amber-400 hover:bg-amber-500/10'
            }`}
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>2. Potencial Referencial (Simulador US$ 5–25/t)</span>
            <Badge
              variant="outline"
              className="text-[9px] font-mono border-amber-500/50 text-amber-800 dark:text-amber-200 bg-amber-500/10 px-1 py-0 h-4"
            >
              Informativo
            </Badge>
          </Button>
        </div>
      )}

      {/* CONTEÚDO CONDICIONAL CONFORME SUB-ABA SELECIONADA */}
      {subAbaAtiva === 'potencial_referencial' &&
      permitirSimulador &&
      dados.simuladorReferencial ? (
        <SimuladorReferencialSection simulacao={dados.simuladorReferencial} />
      ) : (
        <>
          {/* Tarja informativa de Sandbox quando filtroOrigem === 'sintetico' */}
          {filtroOrigem === 'sintetico' && (
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border-2 border-amber-500/40 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <strong className="font-bold uppercase tracking-wide">
                    Visualização de Dados Sintéticos do Ambiente de Sandbox
                  </strong>
                  <Badge className="bg-amber-500 text-slate-950 text-[10px] font-mono font-bold uppercase">
                    Demonstração
                  </Badge>
                </div>
                <p className="leading-relaxed opacity-90">
                  Estes valores foram gerados no gerador nativo do Sandbox de Ingestão e possuem
                  marcação permanente{' '}
                  <code className="font-mono bg-white/70 dark:bg-black/30 px-1 py-0.5 rounded">
                    origem = 'sintetico'
                  </code>
                  . Eles <strong>não representam ativos de carbono reais</strong>, não geram lastro
                  transacionável e ficam estritamente isolados das consultas e métricas públicas da
                  plataforma.
                </p>
              </div>
            </div>
          )}

          {/* ENQUADRAMENTO REGULATÓRIO SBCE */}
          <div
            className={`p-4 rounded-xl border-2 space-y-2 ${
              sbce.categoria === 'compensacao_25k'
                ? 'bg-destructive/10 border-destructive/40 text-destructive'
                : sbce.categoria === 'dever_reporte_10k'
                  ? 'bg-amber-500/10 border-amber-500/40 text-amber-900 dark:text-amber-200'
                  : 'bg-emerald-500/10 border-emerald-500/40 text-emerald-900 dark:text-emerald-200'
            }`}
          >
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-xs">
                <ShieldCheck className="h-4 w-4 shrink-0" />
                <span>
                  Sistema Brasileiro de Comércio de Emissões (SBCE) • Diagnóstico de Enquadramento
                </span>
              </div>
              <Badge variant="outline" className="text-xs font-mono font-bold bg-background/50">
                {sbce.rotulo.split('—')[0].trim()}
              </Badge>
            </div>
            <p className="text-xs leading-relaxed">{sbce.descricao}</p>
            <div className="text-[11px] font-mono pt-1 opacity-90">
              Emissões Anuais Apuradas:{' '}
              <strong>{dados.emissao_anual_tco2e.toFixed(2)} tCO₂e/ano</strong> (Limiares legais:
              10.000 tCO₂e reporte / 25.000 tCO₂e compensação)
            </div>
          </div>

          {/* IDENTIFICAÇÃO DO PROTOCOLO SETORIAL DOMINANTE */}
          {dados.protocoloDominanteNome && (
            <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted/40 border border-border text-xs">
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-muted-foreground">
                  Protocolo Dominante do Lote:
                </span>
                <Badge variant="outline" className="font-mono text-[11px] font-bold">
                  {dados.protocoloDominanteNome}
                </Badge>
              </div>
              <span className="text-[11px] text-muted-foreground hidden sm:inline">
                Unidades canônicas do catálogo setorial
              </span>
            </div>
          )}

          {/* CARDS DE RESUMO dMRV (MÉTRICAS POR PROTOCOLO SETORIAL) — CLICÁVEIS PARA DRILL-DOWN */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
              <span className="font-semibold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-primary" />
                Indicadores Chave do Catálogo Setorial (Clique para Drill-Down & Traçabilidade)
              </span>
              <span className="hidden sm:inline font-mono text-[10px] text-emerald-600 dark:text-emerald-400">
                Reconciliação 100% auditável
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {dados.kpiCards && dados.kpiCards.length === 4 ? (
                dados.kpiCards.map((card, idx) => {
                  const isCarbono = idx === 0
                  return (
                    <Card
                      key={card.id}
                      onClick={() => {
                        setCardDrillDownSelecionado(card)
                        setModalDrillDownAberto(true)
                      }}
                      className={`p-4 cursor-pointer transition-all hover:scale-[1.01] hover:shadow-md relative group select-none ${
                        isCarbono
                          ? 'bg-emerald-500/10 border-emerald-500/30 hover:border-emerald-500/60'
                          : 'bg-muted/40 border-border hover:border-primary/50'
                      }`}
                      role="button"
                      tabIndex={0}
                      aria-label={`Drill-down para ${card.rotulo}: ${card.valorFormatado} ${card.unidade}`}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          setCardDrillDownSelecionado(card)
                          setModalDrillDownAberto(true)
                        }
                      }}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider block truncate ${
                            isCarbono
                              ? 'text-emerald-700 dark:text-emerald-400'
                              : 'text-muted-foreground'
                          }`}
                          title={card.rotulo}
                        >
                          {card.rotulo}
                        </span>
                        <div className="flex items-center gap-1">
                          {card.destaqueBadge && (
                            <Badge
                              variant="outline"
                              className="text-[9px] font-mono px-1 py-0 h-4 border-emerald-500/40 text-emerald-600 dark:text-emerald-400"
                            >
                              {card.destaqueBadge}
                            </Badge>
                          )}
                          <ExternalLink className="w-3 h-3 text-muted-foreground opacity-40 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                      <div
                        className={`text-2xl font-black font-mono mt-1 ${
                          isCarbono
                            ? 'text-emerald-700 dark:text-emerald-300'
                            : idx === 2
                              ? 'text-primary'
                              : 'text-foreground'
                        }`}
                      >
                        {card.valorFormatado}{' '}
                        <span className="text-xs font-normal text-muted-foreground">
                          {card.unidade}
                        </span>
                      </div>
                      <p
                        className="text-[10px] text-muted-foreground mt-1 line-clamp-2"
                        title={card.legenda}
                      >
                        {card.legenda}
                      </p>
                      <div className="mt-2 pt-2 border-t border-border/50 flex items-center justify-between text-[10px] text-muted-foreground group-hover:text-primary transition-colors">
                        <span className="font-semibold uppercase tracking-wider">
                          Ver estratificação
                        </span>
                        <span>→</span>
                      </div>
                    </Card>
                  )
                })
              ) : (
                <>
                  {/* Fallback caso os cards canônicos ainda não tenham sido gerados */}
                  <Card
                    onClick={() => {
                      if (dados.kpiCards?.[0]) {
                        setCardDrillDownSelecionado(dados.kpiCards[0])
                        setModalDrillDownAberto(true)
                      }
                    }}
                    className="p-4 bg-emerald-500/10 border-emerald-500/30 cursor-pointer"
                  >
                    <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">
                      CO₂e Evitado Total
                    </span>
                    <div className="text-2xl font-black font-mono text-emerald-700 dark:text-emerald-300 mt-1">
                      {dados.total_co2e_evitado_kg.toLocaleString('pt-BR', {
                        minimumFractionDigits: 1,
                        maximumFractionDigits: 1,
                      })}{' '}
                      kg
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      ≈ {(dados.total_co2e_evitado_kg / 1000).toFixed(2)} tCO₂e abatidas do Escopo 3
                    </p>
                  </Card>

                  <Card className="p-4 bg-muted/40 border-border">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                      Massa Reciclada / Desviada
                    </span>
                    <div className="text-2xl font-black font-mono text-foreground mt-1">
                      {dados.total_massa_reciclada_kg.toLocaleString('pt-BR', {
                        minimumFractionDigits: 1,
                        maximumFractionDigits: 1,
                      })}{' '}
                      kg
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Balanço de massa comprovado com MTR
                    </p>
                  </Card>

                  <Card className="p-4 bg-muted/40 border-border">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                      Itens com DPP
                    </span>
                    <div className="text-2xl font-black font-mono text-primary mt-1">
                      {dados.total_pecas_reaproveitadas}
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Itens catalogados com rastreabilidade
                    </p>
                  </Card>

                  <Card className="p-4 bg-muted/40 border-border">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                      Lotes Fechados
                    </span>
                    <div className="text-2xl font-black font-mono text-foreground mt-1">
                      {dados.total_lotes_processados}
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Lotes com comprovação de conformidade
                    </p>
                  </Card>
                </>
              )}
            </div>
          </div>

          {/* SÉRIE TEMPORAL DE CO2e EVITADO & MASSA DESVIADA */}
          <Card className="border-border">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <TrendingDown className="h-4 w-4 text-emerald-500" />
                    Série Temporal de Descarbonização (Datas Reais dos Lotes)
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Evolução mensal agregada a partir da data de criação e processamento real dos
                    lotes, em conformidade com o GHG Protocol e SBCE.
                  </CardDescription>
                </div>
                <Badge variant="outline" className="text-xs font-mono">
                  dMRV Auditável
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                {dados.serie_temporal.map((st) => (
                  <div
                    key={st.mes}
                    className="p-3 rounded-xl bg-muted/40 border border-border text-center space-y-1"
                  >
                    <span className="text-[10px] font-mono font-bold text-muted-foreground block">
                      {st.mes}
                    </span>
                    <div className="text-sm font-black font-mono text-emerald-600 dark:text-emerald-400">
                      {st.co2e_evitado_kg.toLocaleString('pt-BR')} kg
                    </div>
                    <div className="text-[10px] font-mono text-muted-foreground">
                      {st.massa_kg.toLocaleString('pt-BR')} kg resíduo
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* DETALHAMENTO DE ESCOPOS GHG PROTOCOL (1, 2 e 3) */}
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Leaf className="h-4 w-4 text-primary" />
                Inventário Corporativo GHG Protocol (Escopos 1, 2 e 3)
              </CardTitle>
              <CardDescription className="text-xs">
                Dados vinculados ao módulo emissoes_inventario para cruzamento com o perfil de
                sustentabilidade.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-card border border-border space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
                    <span>Escopo 1 (Diretas)</span>
                    <span className="font-mono text-primary font-bold">
                      {dados.escopo1_tco2e.toFixed(1)} tCO₂e
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Combustão móvel e estacionária de frotas e geradores próprios.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-card border border-border space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
                    <span>Escopo 2 (Energia)</span>
                    <span className="font-mono text-primary font-bold">
                      {dados.escopo2_tco2e.toFixed(1)} tCO₂e
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Eletricidade adquirida do Sistema Interligado Nacional (SIN).
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-card border border-border space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
                    <span>Escopo 3 (Cadeia)</span>
                    <span className="font-mono text-primary font-bold">
                      {dados.escopo3_tco2e.toFixed(1)} tCO₂e
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Bens adquiridos, transporte terceirizado e destinação de resíduos.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* HISTÓRICO DE RELATÓRIOS EXPORTADOS COM HASH */}
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Hash className="h-4 w-4 text-primary" />
                Trilha Imutável de Relatórios dMRV Exportados (relatorios_exportados)
              </CardTitle>
              <CardDescription className="text-xs">
                Cada relatório gerado recebe prova SHA-256 persistida no banco com garantia de
                auditoria e conformidade.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-border bg-muted/40 text-[10px] font-semibold text-muted-foreground uppercase">
                    <tr>
                      <th className="py-2.5 px-3">Título / Descrição</th>
                      <th className="py-2.5 px-3">Data Emissão</th>
                      <th className="py-2.5 px-3 text-right">CO₂e Evitado</th>
                      <th className="py-2.5 px-3 text-right">Hash SHA-256</th>
                      <th className="py-2.5 px-3 text-right">Assinatura ICP-Brasil</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border text-foreground">
                    {dados.relatorios_anteriores.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-muted-foreground text-xs">
                          Nenhum relatório dMRV emitido recentemente. Use o botão "Exportar
                          Relatório dMRV" acima.
                        </td>
                      </tr>
                    ) : (
                      dados.relatorios_anteriores.map((r: any) => (
                        <tr key={r.id} className="hover:bg-muted/40 transition-colors">
                          <td className="py-2.5 px-3 font-semibold text-foreground">
                            <div>{r.titulo}</div>
                            {r.assinado_icp_brasil && r.assinatura_digital_json && (
                              <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
                                Titular: {r.assinatura_digital_json.titular_nome} (
                                {r.assinatura_digital_json.cnpj_titular})
                              </div>
                            )}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-[11px] text-muted-foreground">
                            {new Date(r.created).toLocaleString('pt-BR')}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            {Number(r.total_co2e_evitado_kg || 0).toLocaleString('pt-BR')} kg
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-[10px] text-primary truncate max-w-[140px]">
                            {r.hash_sha256}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            {custodiaA1Ativa ? (
                              r.assinado_icp_brasil ? (
                                <Badge
                                  variant="outline"
                                  className="text-[10px] font-bold border-emerald-500/50 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 gap-1"
                                  title="Documento com assinatura digital baseada em certificado ICP-Brasil e-CNPJ A1 sob custódia do titular e prova criptográfica SHA-256"
                                >
                                  <Award className="w-3 h-3" />
                                  Assinatura Digital e-CNPJ A1 ICP-Brasil
                                </Badge>
                              ) : (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setLaudoSelecionado({
                                      id: r.id,
                                      titulo: r.titulo,
                                      codigo_verificacao: r.codigo_verificacao,
                                      hash_sha256: r.hash_sha256,
                                      tipo_relatorio: r.tipo_relatorio,
                                    })
                                    setModalAssinaturaAberto(true)
                                  }}
                                  className="h-7 px-2.5 text-[10px] font-bold border-emerald-500/50 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 gap-1"
                                >
                                  <PenLine className="w-3 h-3" />
                                  Assinar com ICP-Brasil
                                </Button>
                              )
                            ) : (
                              <span
                                className="text-[10px] text-muted-foreground"
                                title="Custódia A1 não ativa para esta conta"
                              >
                                —
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Modal de Assinatura Digital ICP-Brasil (Tarefa 2) */}
          <ModalAssinaturaLaudo
            aberto={modalAssinaturaAberto}
            onClose={() => setModalAssinaturaAberto(false)}
            relatorio={laudoSelecionado}
            cnpjCustodia={statusA1?.cnpj_titular}
            razaoCustodia={statusA1?.razao_social}
            onAssinaturaConcluida={() => {
              carregar()
            }}
          />

          {/* Modal de Drill-Down em 3 Níveis */}
          <DrillDownDmrvModal
            aberto={modalDrillDownAberto}
            onClose={() => setModalDrillDownAberto(false)}
            cardAtivo={cardDrillDownSelecionado}
            relatorio={dados.relatorioEstratificado || null}
            onAbrirImpressao={() => {
              setModalDrillDownAberto(false)
              setModalPrintAberto(true)
            }}
            onExportarCsv={handleExportarCsv}
          />

          {/* Modal de Impressão / PDF do Relatório Estratificado */}
          <RelatorioEstratificadoPrintModal
            aberto={modalPrintAberto}
            onClose={() => setModalPrintAberto(false)}
            relatorio={dados.relatorioEstratificado || null}
          />
        </>
      )}
    </div>
  )
}
