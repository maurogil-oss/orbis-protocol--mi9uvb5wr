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
} from '@/services/dmrvEmissoesService'

export function PainelDmrvEmissoesEvitadas() {
  const { user } = useAuth()
  const [dados, setDados] = useState<DadosDmrvEmpresa | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [exportando, setExportando] = useState(false)
  const [hashGerado, setHashGerado] = useState<string | null>(null)

  const carregar = async () => {
    setCarregando(true)
    try {
      const info = await carregarDadosDmrvEmpresa(user?.cnpj)
      setDados(info)
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
    carregar()
  }, [user])

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
      {/* Topo do Painel dMRV */}
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

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={carregar}
            disabled={carregando}
            className="gap-1.5 text-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${carregando ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button
            size="sm"
            onClick={handleExportarCsv}
            disabled={exportando}
            className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <FileSpreadsheet className="h-4 w-4" />
            {exportando ? 'Exportando...' : 'Exportar Relatório dMRV (CSV/PDF)'}
          </Button>
        </div>
      </div>

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
          <strong>{dados.emissao_anual_tco2e.toFixed(2)} tCO₂e/ano</strong> (Limiares legais: 10.000
          tCO₂e reporte / 25.000 tCO₂e compensação)
        </div>
      </div>

      {/* CARDS DE RESUMO dMRV */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* 1. CO2e Evitado */}
        <Card className="p-4 bg-emerald-500/10 border-emerald-500/30">
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

        {/* 2. Massa Reciclada */}
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

        {/* 3. Peças / Ativos Rastreáveis */}
        <Card className="p-4 bg-muted/40 border-border">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
            Peças com Selo DPP
          </span>
          <div className="text-2xl font-black font-mono text-primary mt-1">
            {dados.total_pecas_reaproveitadas}
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">
            Itens catalogados com rastreabilidade
          </p>
        </Card>

        {/* 4. Lotes Processados */}
        <Card className="p-4 bg-muted/40 border-border">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
            Lotes CDV Fechados
          </span>
          <div className="text-2xl font-black font-mono text-foreground mt-1">
            {dados.total_lotes_processados}
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">
            Veículos com despoluição atendida
          </p>
        </Card>
      </div>

      {/* SÉRIE TEMPORAL DE CO2e EVITADO & MASSA DESVIADA */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-emerald-500" />
                Série Temporal de Descarbonização (Últimos 6 Meses)
              </CardTitle>
              <CardDescription className="text-xs">
                Evolução mensal acumulada de emissões evitadas e massa valorizada conforme o GHG
                Protocol.
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
            Cada relatório gerado recebe prova SHA-256 persistida no banco com garantia de auditoria
            e conformidade.
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
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-foreground">
                {dados.relatorios_anteriores.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-muted-foreground text-xs">
                      Nenhum relatório dMRV emitido recentemente. Use o botão "Exportar Relatório
                      dMRV" acima.
                    </td>
                  </tr>
                ) : (
                  dados.relatorios_anteriores.map((r) => (
                    <tr key={r.id} className="hover:bg-muted/40 transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-foreground">{r.titulo}</td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-muted-foreground">
                        {new Date(r.created).toLocaleString('pt-BR')}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {Number(r.total_co2e_evitado_kg || 0).toLocaleString('pt-BR')} kg
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-[10px] text-primary truncate max-w-[140px]">
                        {r.hash_sha256}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
