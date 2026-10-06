import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ShieldCheck,
  Printer,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Database,
  ArrowLeft,
  Info,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  executarAuditoriaIntegridade,
  imprimirLaudoIntegridadeHtml,
  type LaudoIntegridadeResultado,
} from '@/services/auditoriaIntegridadeService'

export default function LaudoIntegridadeDemoPage() {
  const [carregando, setCarregando] = useState(true)
  const [laudo, setLaudo] = useState<LaudoIntegridadeResultado | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  const executarAuditoria = async () => {
    setCarregando(true)
    setErro(null)
    try {
      const res = await executarAuditoriaIntegridade('demo-auditor@orbis-protocol.com')
      setLaudo(res)
    } catch (e: any) {
      setErro(e?.message || 'Falha ao executar auditoria pericial de integridade.')
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    executarAuditoria()
  }, [])

  const itensLista = laudo ? Object.values(laudo.itens) : []

  return (
    <div className="min-h-screen bg-[#0A1628] text-[#F4F7FA] pb-24">
      {/* Header Superior Fixo de Navegação Demo */}
      <div className="border-b border-[rgba(244,247,250,0.08)] bg-[#0E1A2E]/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-[1320px] mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              to="/demo"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#93A3B5] hover:text-[#12B886] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar à Demonstração Geral</span>
            </Link>
            <span className="text-xs text-[#93A3B5]">•</span>
            <span className="px-2.5 py-0.5 rounded-full bg-[#D9B36C]/15 border border-[#D9B36C]/30 text-[#D9B36C] font-mono text-[11px] font-bold uppercase tracking-wider">
              Anexo Técnico Pericial • Demonstração Geral
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={executarAuditoria}
              disabled={carregando}
              className="gap-1.5 text-xs border-[rgba(244,247,250,0.12)] text-[#F4F7FA] hover:bg-[#16202B]"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${carregando ? 'animate-spin' : ''}`} />
              Reexecutar Auditoria
            </Button>
            {laudo && (
              <Button
                size="sm"
                onClick={() => imprimirLaudoIntegridadeHtml(laudo)}
                className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Printer className="h-3.5 w-3.5" />
                Imprimir Laudo Pericial (PDF)
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-[1320px] mx-auto px-4 sm:px-6 pt-8 space-y-8 animate-in fade-in duration-300">
        {/* CABEÇALHO DO LAUDO */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold uppercase tracking-wider">
            <ShieldCheck className="h-3.5 w-3.5" />
            Laudo Pericial Automatizado • Integridade & Higiene dMRV
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            Laudo de Integridade da Base dMRV
          </h1>
          <p className="text-sm text-muted-foreground max-w-3xl leading-relaxed">
            Relatório técnico pericial executado sobre a base de dados em tempo real. Avalia
            reconciliação contábil-matemática (massa e CO₂e), consistência criptográfica de hashes
            SHA-256, unicidade de chaves de acesso NF-e de 44 dígitos, ausência de lotes/peças
            órfãos e histórico de transição de fatores oficiais (como o fator de cobre 4,10 vs 5,40
            legado).
          </p>
        </div>

        {/* CARREGANDO OU ERRO */}
        {carregando && (
          <Card className="border-border">
            <CardContent className="py-12 flex flex-col items-center justify-center text-center space-y-3">
              <RefreshCw className="h-8 w-8 text-primary animate-spin" />
              <p className="text-sm font-medium">
                Executando varredura pericial de integridade sobre todas as coleções dMRV...
              </p>
              <p className="text-xs text-muted-foreground">
                Cruzando cdv_lotes, cdv_pecas, selos e emissoes_inventario.
              </p>
            </CardContent>
          </Card>
        )}

        {erro && !carregando && (
          <Card className="border-destructive/50 bg-destructive/5">
            <CardContent className="py-6 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-bold text-destructive">Falha na Auditoria</h3>
                <p className="text-xs text-muted-foreground mt-1">{erro}</p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={executarAuditoria}
                  className="mt-3 text-xs"
                >
                  Tentar Novamente
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {laudo && !carregando && (
          <>
            {/* CARDS RESUMO */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border-border">
                <CardHeader className="p-4 pb-2">
                  <CardDescription className="text-xs uppercase font-semibold">
                    Data da Auditoria
                  </CardDescription>
                  <CardTitle className="text-lg font-bold">
                    {new Date(laudo.geradoEmIso).toLocaleDateString('pt-BR')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 text-xs text-muted-foreground font-mono">
                  {new Date(laudo.geradoEmIso).toLocaleTimeString('pt-BR')}
                </CardContent>
              </Card>

              <Card className="border-border">
                <CardHeader className="p-4 pb-2">
                  <CardDescription className="text-xs uppercase font-semibold">
                    Verificações Executadas
                  </CardDescription>
                  <CardTitle className="text-2xl font-black text-primary">
                    {laudo.totalVerificacoes}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 text-xs text-muted-foreground">
                  Trilhas e regras periciais ativas
                </CardContent>
              </Card>

              <Card className="border-border">
                <CardHeader className="p-4 pb-2">
                  <CardDescription className="text-xs uppercase font-semibold">
                    Conformes (OK)
                  </CardDescription>
                  <CardTitle className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                    {laudo.totalVerificacoes - laudo.totalAlertas}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 text-xs text-muted-foreground">
                  Sem inconsistência detectada
                </CardContent>
              </Card>

              <Card className="border-border">
                <CardHeader className="p-4 pb-2">
                  <CardDescription className="text-xs uppercase font-semibold">
                    Apontamentos / Alertas
                  </CardDescription>
                  <CardTitle
                    className={`text-2xl font-black ${
                      laudo.totalAlertas === 0
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    {laudo.totalAlertas}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 text-xs text-muted-foreground">
                  {laudo.totalAlertas === 0 ? 'Base 100% íntegra' : 'Requer atenção pericial'}
                </CardContent>
              </Card>
            </div>

            {/* AVISO DO ESTADO REAL DA BASE */}
            <div className="p-4 rounded-xl border border-border bg-card/60 flex items-start gap-3 text-xs leading-relaxed text-muted-foreground">
              <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <div>
                <strong className="text-foreground">Critério de Honestidade Pericial:</strong> Este
                laudo reflete o estado real da base conectada sem mascaramento. Conforme as regras
                da plataforma, divergências detectadas em lotes de demonstração anteriores (como
                peças criadas com fatores legados antes da unificação do catálogo) são apontadas
                explicitamente no relatório analítico para auditoria, preservando a imutabilidade do
                histórico.
              </div>
            </div>

            {/* LISTA DETALHADA DAS VERIFICAÇÕES */}
            <div className="space-y-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Quadro de Verificações Periciais
              </h2>

              <div className="space-y-3">
                {itensLista.map((item) => {
                  const isOk = item.status === 'ok'
                  return (
                    <Card
                      key={item.id}
                      className={`border transition-all ${
                        isOk ? 'border-border' : 'border-amber-500/40 bg-amber-500/[0.02]'
                      }`}
                    >
                      <CardHeader className="p-4 pb-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            {isOk ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            ) : (
                              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                            )}
                            <CardTitle className="text-sm font-bold">{item.titulo}</CardTitle>
                          </div>
                          <Badge
                            variant="outline"
                            className={`text-[11px] font-semibold ${
                              isOk
                                ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                                : 'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400'
                            }`}
                          >
                            {isOk
                              ? 'OK • CONFORME'
                              : `ALERTA (${item.totalInconformidades} INCONFORMIDADES)`}
                          </Badge>
                        </div>
                        <CardDescription className="text-xs pt-1">{item.descricao}</CardDescription>
                      </CardHeader>

                      <CardContent className="p-4 pt-2 space-y-3 text-xs">
                        <div className="flex items-center gap-4 text-muted-foreground text-[11px]">
                          <span>
                            Registros verificados:{' '}
                            <strong className="text-foreground">{item.totalVerificados}</strong>
                          </span>
                          <span>•</span>
                          <span>
                            Inconformidades:{' '}
                            <strong
                              className={
                                isOk
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : 'text-amber-600 dark:text-amber-400'
                              }
                            >
                              {item.totalInconformidades}
                            </strong>
                          </span>
                        </div>

                        {/* TABELA DE REGISTROS AFETADOS QUANDO HOUVER */}
                        {!isOk && item.registrosAfetados.length > 0 && (
                          <div className="overflow-x-auto rounded-lg border border-border mt-2">
                            <table className="w-full text-left text-[11px] font-sans">
                              <thead className="bg-muted/50 text-muted-foreground uppercase text-[10px] font-bold">
                                <tr>
                                  <th className="p-2.5">Identificador</th>
                                  <th className="p-2.5">Detalhes da Divergência</th>
                                  <th className="p-2.5">Esperado</th>
                                  <th className="p-2.5">Encontrado</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-border">
                                {item.registrosAfetados.slice(0, 8).map((r, idx) => (
                                  <tr key={idx} className="hover:bg-muted/30">
                                    <td className="p-2.5 font-mono font-medium max-w-[200px] truncate">
                                      {r.identificador}
                                    </td>
                                    <td className="p-2.5 text-muted-foreground max-w-sm">
                                      {r.detalhes}
                                    </td>
                                    <td className="p-2.5 font-mono text-emerald-600 dark:text-emerald-400">
                                      {r.valorEsperado || '-'}
                                    </td>
                                    <td className="p-2.5 font-mono text-amber-600 dark:text-amber-400">
                                      {r.valorEncontrado || '-'}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                            {item.registrosAfetados.length > 8 && (
                              <div className="p-2 text-center text-[10px] text-muted-foreground bg-muted/20">
                                ... e mais {item.registrosAfetados.length - 8} registros listados no
                                sistema.
                              </div>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>

            {/* SEÇÃO INFORMATIVA DE GOVERNANÇA */}
            <Card className="border-border bg-card">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Database className="h-4 w-4 text-primary" />
                  Governança & Escopo da Auditoria dMRV
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-1 text-xs text-muted-foreground space-y-2 leading-relaxed">
                <p>
                  As verificações executadas neste painel implementam as diretrizes de integridade
                  contábil e documental exigidas pelas normas ABNT NBR ISO 14064-3 (Validação e
                  Verificação de Afirmações de GEE), NBC TO 3000 (Asseguração Diferente de Auditoria
                  Contábil) e as regras do Programa MOVER (Decreto nº 11.977/2024 e Portarias MDIC).
                </p>
                <p>
                  <strong>Nomenclatura Oficial:</strong> Toda a documentação gerada pelo Orbis
                  Protocol opera sob a nomenclatura formal de{' '}
                  <em>Atestado de Conformidade Orbis (com ART/RRT)</em>, não constituindo chancela
                  estatal nem substituto de auditoria externa de terceira parte independente sem o
                  devido processo de validação por VVB acreditado.
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}
