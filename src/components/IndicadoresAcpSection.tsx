import { useState, useEffect } from 'react'
import {
  TrendingDown,
  Building2,
  FileSpreadsheet,
  Printer,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  Layers,
  Sparkles,
  BarChart3,
  HelpCircle,
  CheckCircle2,
  Lock,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  obterIndicadoresAgregadosAcp,
  gerarCsvIndicadoresAcp,
  baixarArquivoCsv,
  IndicadoresAcpAgregados,
  MINIMO_EMPRESAS_ANTI_DEDUCAO,
} from '@/services/acpIndicadoresService'

export function IndicadoresAcpSection() {
  const [indicadores, setIndicadores] = useState<IndicadoresAcpAgregados | null>(null)
  const [carregando, setCarregando] = useState(true)

  const carregarDados = async () => {
    setCarregando(true)
    try {
      const res = await obterIndicadoresAgregadosAcp()
      setIndicadores(res)
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregarDados()
  }, [])

  const handleExportarCsv = () => {
    if (!indicadores) return
    const csv = gerarCsvIndicadoresAcp(indicadores)
    const dataHora = new Date().toISOString().slice(0, 10)
    baixarArquivoCsv(csv, `relatorio-agregado-acp-${dataHora}.csv`)
  }

  const handleExportarPdf = () => {
    // Mesma técnica nativa window.print() de /modelo-acp e /proposta-reminera
    window.print()
  }

  return (
    <div className="space-y-4 print:space-y-4">
      {/* Estilos específicos de impressão para exportação em PDF limpa */}
      <style>{`
        @media print {
          nav, header, footer, .no-print, .gestao-convites-bloco {
            display: none !important;
          }
          body, main {
            background: white !important;
            color: #0f172a !important;
            padding: 0 !important;
          }
          .print-full-width {
            max-width: 100% !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .print-card-border {
            border: 1px solid #cbd5e1 !important;
            box-shadow: none !important;
            break-inside: avoid;
          }
        }
      `}</style>

      {/* Cabeçalho da Seção */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <TrendingDown className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <div>
            <h2 className="font-heading font-extrabold text-base sm:text-lg uppercase tracking-wider text-slate-900 dark:text-[#F8FAFC]">
              INDICADORES AGREGADOS DAS EMPRESAS PARTICIPANTES
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Consolidação técnica anonimizada • Opção B (sem valores unitários de fatores) • dMRV
            </p>
          </div>
        </div>

        {/* Botões de Ação e Exportação */}
        <div className="flex flex-wrap items-center gap-2 no-print">
          <Button
            variant="outline"
            size="sm"
            onClick={carregarDados}
            disabled={carregando}
            className="text-xs h-8 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
            title="Atualizar indicadores"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${carregando ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportarCsv}
            disabled={carregando || !indicadores}
            className="text-xs h-8 bg-white dark:bg-[#0E1A2E] border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 shadow-sm"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
            Exportar CSV
          </Button>

          <Button
            size="sm"
            onClick={handleExportarPdf}
            disabled={carregando || !indicadores}
            className="text-xs h-8 bg-blue-600 hover:bg-blue-700 text-white shadow-sm font-semibold"
          >
            <Printer className="w-3.5 h-3.5 mr-1.5" />
            Exportar PDF
          </Button>
        </div>
      </div>

      {/* Conteúdo Principal */}
      {carregando ? (
        <Card className="p-8 text-center bg-white dark:bg-[#0E1A2E] border-slate-200 dark:border-slate-800">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-600 mb-2" />
          <p className="text-xs text-slate-500">Consolidando indicadores anonimizados da ACP...</p>
        </Card>
      ) : !indicadores || indicadores.semDados ? (
        /* Estado Vazio Honesto — "Em estruturação" */
        <Card className="p-8 sm:p-10 text-center bg-white dark:bg-[#0E1A2E] border-dashed border-slate-300 dark:border-slate-700">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto border border-blue-200 dark:border-blue-800 mb-4">
            <BarChart3 className="w-7 h-7" />
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <h3 className="font-heading font-extrabold text-base sm:text-lg text-slate-900 dark:text-[#F8FAFC]">
              Indicadores da Carteira em Estruturação
            </h3>
            <p className="text-xs text-slate-600 dark:text-[#94A3B8] leading-relaxed">
              Ainda não há notas fiscais ou lotes dMRV apurados pelas empresas associadas
              cadastradas. Nenhum dado sintético ou número fictício é exibido para preservar o rigor
              documental e pericial.
            </p>
          </div>
          <div className="pt-4 flex flex-wrap items-center justify-center gap-2 text-[11px] text-slate-500">
            <Badge variant="outline" className="text-slate-600 dark:text-slate-400">
              {indicadores?.totalEmpresasAtivas || 0} empresa(s) vinculada(s)
            </Badge>
            <Badge variant="outline" className="text-slate-600 dark:text-slate-400">
              0 lotes / notas importados
            </Badge>
            <Badge variant="outline" className="text-slate-600 dark:text-slate-400">
              Aguardando primeira ingestão
            </Badge>
          </div>
        </Card>
      ) : (
        /* Seção com dados agregados reais */
        <div className="space-y-4 print-full-width">
          {/* Alerta de Proteção Anti-Dedução (se < 3 empresas) */}
          {indicadores.protecaoAntiDeducaoAtiva && (
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-700/50 flex items-start gap-3 print-card-border">
              <Lock className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <span className="font-bold text-amber-900 dark:text-amber-200 uppercase tracking-wide block">
                  Blindagem de Sigilo: Anti-Reidentificação por Dedução Ativa
                </span>
                <p className="text-amber-800 dark:text-amber-300 leading-relaxed">
                  A carteira possui atualmente{' '}
                  <strong>{indicadores.totalEmpresasAtivas} empresa(s) participante(s)</strong>{' '}
                  (abaixo do limite mínimo de{' '}
                  <strong>{MINIMO_EMPRESAS_ANTI_DEDUCAO} empresas</strong>). As métricas de emissão
                  em toneladas de CO₂e são temporariamente omitidas do total consolidado para evitar
                  que uma empresa deduza os dados da outra. Contagens de documentos e itens seguem
                  visíveis.
                </p>
              </div>
            </div>
          )}

          {/* Cards de Métricas Principais (4 colunas) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Card 1: Empresas Participantes */}
            <Card className="bg-white dark:bg-[#0E1A2E] border-slate-200 dark:border-slate-800 shadow-sm print-card-border">
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-1">
                  <span className="font-semibold uppercase tracking-wider text-[11px]">
                    Empresas Ativas
                  </span>
                  <Building2 className="w-4 h-4 text-blue-600" />
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900 dark:text-[#F8FAFC]">
                  {indicadores.totalEmpresasAtivas}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Vinculadas ao convênio ACP
                </div>
              </CardContent>
            </Card>

            {/* Card 2: Total de Lotes e Notas Fiscais */}
            <Card className="bg-white dark:bg-[#0E1A2E] border-slate-200 dark:border-slate-800 shadow-sm print-card-border">
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-1">
                  <span className="font-semibold uppercase tracking-wider text-[11px]">
                    Lotes / Notas Ingeridas
                  </span>
                  <Layers className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900 dark:text-[#F8FAFC]">
                  {indicadores.totalLotesNotas}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Documentos fiscais processados
                </div>
              </CardContent>
            </Card>

            {/* Card 3: Itens Calculados vs Não Calculados */}
            <Card className="bg-white dark:bg-[#0E1A2E] border-slate-200 dark:border-slate-800 shadow-sm print-card-border">
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-1">
                  <span className="font-semibold uppercase tracking-wider text-[11px]">
                    Itens Apurados
                  </span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900 dark:text-[#F8FAFC]">
                  {indicadores.totalItensApurados}
                </div>
                <div className="flex items-center gap-1.5 text-[11px] mt-1 font-mono">
                  <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                    {indicadores.totalItensCalculados} calc.
                  </span>
                  <span className="text-slate-400">•</span>
                  <span className="text-amber-700 dark:text-amber-400 font-bold">
                    {indicadores.totalItensNaoCalculados} não calc.
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Card 4: Emissões Totais Consolidadas */}
            <Card className="bg-white dark:bg-[#0E1A2E] border-slate-200 dark:border-slate-800 shadow-sm print-card-border">
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-1">
                  <span className="font-semibold uppercase tracking-wider text-[11px]">
                    Emissões Consolidadas
                  </span>
                  <Sparkles className="w-4 h-4 text-blue-500" />
                </div>
                {indicadores.protecaoAntiDeducaoAtiva ? (
                  <div className="py-1">
                    <span className="px-2.5 py-1 rounded bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 font-mono text-xs font-bold uppercase inline-block">
                      Sob Sigilo (&lt; 3 emp.)
                    </span>
                  </div>
                ) : (
                  <div className="text-2xl sm:text-3xl font-extrabold font-mono text-blue-700 dark:text-blue-400">
                    {(indicadores.emissoesTotaisTco2e || 0).toLocaleString('pt-BR', {
                      minimumFractionDigits: 3,
                      maximumFractionDigits: 3,
                    })}{' '}
                    <span className="text-xs font-sans text-slate-500">tCO₂e</span>
                  </div>
                )}
                <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 uppercase font-bold tracking-wider">
                  ESTIMATIVA • dMRV
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabela Resumo Consolidada (Sem identificador de empresa individual) */}
          <Card className="bg-white dark:bg-[#0E1A2E] border-slate-200 dark:border-slate-800 shadow-sm print-card-border">
            <CardHeader className="py-3 px-4 border-b border-slate-100 dark:border-slate-800/80">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold text-slate-900 dark:text-[#F8FAFC]">
                    Balanço Agregado e Anonimizado da Carteira
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500">
                    Nenhum dado pessoal, CNPJ ou razão social de empresa individual é listado
                  </CardDescription>
                </div>
                <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300 text-[10px]">
                  Anonimização Ativa
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-2.5 px-4">Indicador Consolidado</th>
                    <th className="py-2.5 px-4">Valor Apurado</th>
                    <th className="py-2.5 px-4">Regra Metodológica / Conformidade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  <tr>
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-[#F8FAFC]">
                      Empresas Associadas Participantes
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-[#F8FAFC]">
                      {indicadores.totalEmpresasAtivas}
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      Contas ativas com papel <code>cliente_acp</code> vinculadas à ACP
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-[#F8FAFC]">
                      Lotes e Notas Fiscais Importadas
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-[#F8FAFC]">
                      {indicadores.totalLotesNotas}
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      Documentos com chave de acesso SEFAZ e validação de duplicidade
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-[#F8FAFC]">
                      Itens com Fator Mapeado (Calculados)
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-emerald-700 dark:text-emerald-400">
                      {indicadores.totalItensCalculados}
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      Classificados segundo tabela canônica DM-ORB-001 v1.1
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-[#F8FAFC]">
                      Itens sem Fator Mapeado (Não Calculados)
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-amber-700 dark:text-amber-400">
                      {indicadores.totalItensNaoCalculados}
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      Contribuição 0,00 kgCO₂e — sem substituição nem fallback silencioso
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-[#F8FAFC]">
                      Emissões Totais Estimadas
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-blue-700 dark:text-blue-400">
                      {indicadores.protecaoAntiDeducaoAtiva ? (
                        <span className="text-amber-600">[Omitido - Anti-dedução]</span>
                      ) : (
                        `${(indicadores.emissoesTotaisTco2e || 0).toFixed(3)} tCO₂e`
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      Rótulo obrigatório <strong>ESTIMATIVA • dMRV</strong> sob a Opção B
                    </td>
                  </tr>
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* Notas de Rigor Científico e Limitações Metodológicas */}
          <div className="p-4 rounded-xl bg-slate-100 dark:bg-[#111827] border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 space-y-1.5 print-card-border">
            <div className="flex items-center gap-2 font-bold uppercase text-slate-800 dark:text-slate-200 text-xs">
              <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Garantias de Privacidade e Conformidade Metodológica
            </div>
            <p>
              • <strong>Anonimização Absoluta:</strong> Esta visão agrega apenas grandezas métricas
              e contagens. Nenhum operador ou visualizador da ACP tem acesso a dados
              individualizados de outras empresas, respeitando o Artigo 13 da LGPD e as normas
              antitruste de cooperação setorial.
            </p>
            <p>
              • <strong>Blindagem Opção B:</strong> Nenhum multiplicador ou valor numérico de fator
              de emissão é exposto nos cálculos ou relatórios exportados.
            </p>
            <p>
              • <strong>Regra de K-Anonimato (Anti-Dedução):</strong> A emissão consolidada é
              mantida em sigilo enquanto a base contar com menos de 3 associados ativos com
              documentos importados.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
