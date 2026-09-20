import { useState, useEffect } from 'react'
import {
  FileText,
  ShieldCheck,
  ShieldAlert,
  Download,
  RefreshCw,
  Building2,
  Calendar,
  Layers,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ArrowUpRight,
  Filter,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/AuthContext'
import {
  listarManifestosSinirCcrlr,
  sincronizarManifestosDppParaCcrlr,
  type ManifestoSinirCcrlrRecord,
} from '@/services/lastroCcrlrService'

export function CcrlrSinirInteroperabilidadeTab() {
  const { user } = useAuth()
  const [manifestos, setManifestos] = useState<ManifestoSinirCcrlrRecord[]>([])
  const [carregando, setCarregando] = useState(true)
  const [sincronizando, setSincronizando] = useState(false)
  const [filtroCategoria, setFiltroCategoria] = useState<string>('todas')

  const carregar = async () => {
    setCarregando(true)
    try {
      const lista = await listarManifestosSinirCcrlr()
      setManifestos(lista)
    } catch {
      toast({
        title: 'Erro ao carregar manifestos',
        description: 'Falha ao buscar dados de interoperabilidade do CCRLR/SINIR.',
        variant: 'destructive',
      })
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregar()
  }, [])

  const handleSincronizarDpp = async () => {
    setSincronizando(true)
    try {
      const cnpj = user?.cnpj || '33.000.168/0001-09'
      const razao = user?.nome_empresa || user?.name || 'Empresa Titular dMRV'

      const res = await sincronizarManifestosDppParaCcrlr(cnpj, razao)
      toast({
        title: 'Sincronização Concluída',
        description: `${res.importados} novos manifestos MTR-SINIR consolidados para o relatório de lastro CCRLR.`,
      })
      carregar()
    } catch {
      toast({
        title: 'Falha na sincronização',
        description: 'Não foi possível carregar os manifestos de destinação final.',
        variant: 'destructive',
      })
    } finally {
      setSincronizando(false)
    }
  }

  // Exportar relatório de lastro CCRLR
  const handleExportarRelatorioCcrlr = () => {
    if (manifestos.length === 0) {
      toast({
        title: 'Sem registros para exportar',
        description: 'Sincronize primeiro os manifestos de destinação final.',
        variant: 'destructive',
      })
      return
    }

    const linhas = [
      'ORBIS PROTOCOL • RELATÓRIO DE LASTRO DE RECICLAGEM (PRONTO PARA O SINIR)',
      'Aviso Legal: O presente relatório consolida lastro para emissão oficial do CCRLR pela Entidade Gestora homologada. Não constitui o certificado final.',
      `Gerado em:;${new Date().toISOString()}`,
      `CNPJ Gerador:;${user?.cnpj || '33.000.168/0001-09'}`,
      '',
      'Numero MTR SINIR;Categoria Residuo;Classificacao LR Dec 11.413;Massa (kg);Destinador CNPJ;Destinador Razao;Status Interoperabilidade;Hash SHA-256',
      ...manifestos.map((m) =>
        [
          m.numero_manifesto_mtr,
          m.categoria_residuo_sinir,
          m.lr_decreto_11413,
          m.quantidade_massa_kg,
          m.cnpj_destinador,
          `"${m.razao_social_destinador}"`,
          m.status_sinir,
          m.hash_sha256,
        ].join(';'),
      ),
    ]

    const blob = new Blob([linhas.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Relatorio_Lastro_CCRLR_SINIR_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)

    toast({
      title: 'Relatório de Lastro Exportado!',
      description: 'Documento pronto para envio à Entidade Gestora emitente do CCRLR oficial.',
    })
  }

  // Estatísticas acumuladas
  const manifestosFiltrados = manifestos.filter((m) =>
    filtroCategoria === 'todas' ? true : m.categoria_residuo_sinir === filtroCategoria,
  )

  const totalMassaObrigatoria = manifestos
    .filter((m) => m.lr_decreto_11413 === 'sujeito_lr_11413')
    .reduce((acc, cur) => acc + (cur.quantidade_massa_kg || 0), 0)

  const totalMassaConvencional = manifestos
    .filter((m) => m.lr_decreto_11413 === 'convencional')
    .reduce((acc, cur) => acc + (cur.quantidade_massa_kg || 0), 0)

  return (
    <div className="space-y-6">
      {/* Topo do Módulo CCRLR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-card border border-border shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="border-blue-500/40 text-blue-600 dark:text-blue-400 text-xs font-semibold"
            >
              Módulo 3 • Interoperabilidade SINIR
            </Badge>
            <Badge
              variant="secondary"
              className="text-xs bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
            >
              Pronto para o SINIR
            </Badge>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
            Módulo CCRLR & Acúmulo de Massa SINIR
          </h2>
          <p className="text-xs text-muted-foreground max-w-2xl leading-relaxed">
            Acúmulo de massa reciclada e destinada por categoria de resíduo alimentado pelos
            manifestos MTR-SINIR já registrados em destinação final. Gera relatório de lastro no
            padrão exigido pela Entidade Gestora.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSincronizarDpp}
            disabled={sincronizando}
            className="gap-1.5 text-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${sincronizando ? 'animate-spin' : ''}`} />
            Sincronizar MTRs DPP
          </Button>
          <Button
            size="sm"
            onClick={handleExportarRelatorioCcrlr}
            disabled={manifestos.length === 0}
            className="gap-1.5 text-xs bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <Download className="h-4 w-4" />
            Exportar para Entidade Gestora
          </Button>
        </div>
      </div>

      {/* RESSALVA REGULATÓRIA OBRIGATÓRIA */}
      <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30 text-xs text-blue-900 dark:text-blue-200 leading-relaxed flex items-start gap-2.5">
        <ShieldAlert className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
        <div>
          <strong className="block text-blue-800 dark:text-blue-300 font-bold uppercase text-[10px] mb-0.5">
            Nota de Interoperabilidade & Credenciamento Regulatório
          </strong>
          <span>
            A plataforma Orbis Protocol entrega dados e lastro técnico{' '}
            <strong>"pronto para o SINIR"</strong>. A plataforma não promete e não realiza conexão
            automatizada oficial com os servidores do Ministério do Meio Ambiente / SINIR: o
            credenciamento formal e a submissão dos manifestos constituem atos privativos e
            exclusivos da empresa titular perante o órgão ambiental competente e perante a
            respectiva Entidade Gestora.
          </span>
        </div>
      </div>

      {/* Cards de Métricas Acumuladas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="p-4 bg-muted/30 border-border">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
            Total Manifestos MTR
          </span>
          <div className="text-2xl font-black font-mono text-foreground mt-1">
            {manifestos.length}
          </div>
          <span className="text-[10px] text-muted-foreground">Rastreados no banco de dados</span>
        </Card>

        <Card className="p-4 bg-amber-500/10 border-amber-500/30">
          <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider block">
            Massa LR Decreto 11.413 (Obrigatória)
          </span>
          <div className="text-2xl font-black font-mono text-amber-700 dark:text-amber-300 mt-1">
            {totalMassaObrigatoria.toLocaleString('pt-BR', { minimumFractionDigits: 1 })} kg
          </div>
          <span className="text-[10px] text-muted-foreground">
            OLUC, Baterias, Pneus e Lubrificantes
          </span>
        </Card>

        <Card className="p-4 bg-muted/50 border-border">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
            Metais Convencionais (Segregados)
          </span>
          <div className="text-2xl font-black font-mono text-foreground mt-1">
            {totalMassaConvencional.toLocaleString('pt-BR', { minimumFractionDigits: 1 })} kg
          </div>
          <span className="text-[10px] text-muted-foreground">
            Aço, alumínio e carcaça prensada
          </span>
        </Card>
      </div>

      {/* Tabela de Manifestos com Interoperabilidade SINIR */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Manifestos MTR-SINIR Acumulados ({manifestosFiltrados.length})
          </span>

          {/* Filtro de Categoria SINIR */}
          <div className="flex items-center gap-1.5 bg-muted/40 p-1 rounded-lg border border-border">
            <span className="text-[10px] text-muted-foreground px-1.5">Filtro:</span>
            <Button
              variant={filtroCategoria === 'todas' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setFiltroCategoria('todas')}
              className="h-6 text-[10px] px-2"
            >
              Todos
            </Button>
            <Button
              variant={filtroCategoria === 'oluc' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setFiltroCategoria('oluc')}
              className="h-6 text-[10px] px-2"
            >
              OLUC
            </Button>
            <Button
              variant={filtroCategoria === 'baterias_chumbo_acido' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setFiltroCategoria('baterias_chumbo_acido')}
              className="h-6 text-[10px] px-2"
            >
              Baterias
            </Button>
            <Button
              variant={filtroCategoria === 'pneus_inserviveis' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setFiltroCategoria('pneus_inserviveis')}
              className="h-6 text-[10px] px-2"
            >
              Pneus
            </Button>
            <Button
              variant={filtroCategoria === 'metais_ferrosos' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setFiltroCategoria('metais_ferrosos')}
              className="h-6 text-[10px] px-2"
            >
              Metais
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-border text-muted-foreground uppercase font-semibold text-[10px] bg-muted/40">
              <tr>
                <th className="py-2.5 px-3">Manifesto MTR-SINIR</th>
                <th className="py-2.5 px-3">Categoria SINIR</th>
                <th className="py-2.5 px-3">Taxonomia Dec. 11.413</th>
                <th className="py-2.5 px-3 text-right">Massa (kg)</th>
                <th className="py-2.5 px-3">Destinador Licenciado</th>
                <th className="py-2.5 px-3 text-center">Status SINIR</th>
                <th className="py-2.5 px-3 text-right">Hash SHA-256</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-foreground">
              {manifestosFiltrados.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-muted-foreground text-xs">
                    Nenhum manifesto sincronizado ainda. Clique no botão "Sincronizar MTRs DPP"
                    acima.
                  </td>
                </tr>
              )}
              {manifestosFiltrados.map((m) => (
                <tr key={m.id} className="hover:bg-muted/40 transition-colors">
                  <td className="py-3 px-3 font-mono font-bold text-primary">
                    {m.numero_manifesto_mtr}
                  </td>
                  <td className="py-3 px-3">
                    <span className="font-medium text-foreground block capitalize">
                      {m.categoria_residuo_sinir.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {m.codigo_ibama_residuo || 'IBAMA'}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    {m.lr_decreto_11413 === 'sujeito_lr_11413' ? (
                      <Badge className="text-[9px] bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/40">
                        LR Dec. 11.413
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[9px] text-muted-foreground">
                        Metal Convencional
                      </Badge>
                    )}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-foreground whitespace-nowrap">
                    {Number(m.quantidade_massa_kg).toLocaleString('pt-BR', {
                      minimumFractionDigits: 1,
                    })}{' '}
                    kg
                  </td>
                  <td className="py-3 px-3 text-[11px]">
                    <div className="font-semibold text-foreground line-clamp-1">
                      {m.razao_social_destinador}
                    </div>
                    <div className="font-mono text-[10px] text-muted-foreground">
                      CNPJ: {m.cnpj_destinador}
                    </div>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                      <CheckCircle2 className="h-3 w-3" />
                      Pronto p/ SINIR
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-[10px] text-muted-foreground truncate max-w-[120px]">
                    {m.hash_sha256}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
