import React from 'react'
import {
  Printer,
  X,
  ShieldCheck,
  Building2,
  Calendar,
  Clock,
  CheckCircle2,
  Scale,
  Leaf,
  FileText,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  PieChart as PieChartIcon,
  BarChart3,
  Layers,
} from 'lucide-react'
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts'
import { Button } from '@/components/ui/button'
import type { DadosPainelResultados } from '@/services/painelResultadosService'

interface RelatorioExecutivoPrintModalProps {
  aberto: boolean
  onClose: () => void
  dados: DadosPainelResultados | null
  periodoSelecionado: 3 | 6 | 12
  empresaContexto: {
    cnpj: string | null
    nome: string | null
  }
}

const CORES_MATERIAIS: Record<string, string> = {
  aco: '#2563EB',
  aluminio: '#06B6D4',
  cobre: '#F97316',
  polimeros: '#8B5CF6',
  outros: '#64748B',
}

export function RelatorioExecutivoPrintModal({
  aberto,
  onClose,
  dados,
  periodoSelecionado,
  empresaContexto,
}: RelatorioExecutivoPrintModalProps) {
  if (!aberto || !dados) return null

  const handlePrint = () => {
    window.print()
  }

  const dataGeracao = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  const renderTendencia = (
    tendencia?: {
      direcao: 'alta' | 'baixa' | 'neutro'
      rotuloVariacao: string
    },
    inverter = false,
  ) => {
    if (!tendencia) return null
    const { direcao, rotuloVariacao } = tendencia
    let isPositivo = direcao === 'alta'
    if (inverter) {
      isPositivo = direcao === 'baixa'
    }

    if (direcao === 'neutro') {
      return (
        <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold text-slate-500 bg-slate-100 px-1 py-0.2 rounded">
          <Minus className="w-2.5 h-2.5" />
          <span>{rotuloVariacao}</span>
        </span>
      )
    }

    if (isPositivo) {
      return (
        <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-1 py-0.2 rounded">
          {direcao === 'alta' ? (
            <TrendingUp className="w-2.5 h-2.5 text-emerald-700" />
          ) : (
            <TrendingDown className="w-2.5 h-2.5 text-emerald-700" />
          )}
          <span>{rotuloVariacao}</span>
        </span>
      )
    }

    return (
      <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold text-rose-800 bg-rose-50 border border-rose-200 px-1 py-0.2 rounded">
        {direcao === 'baixa' ? (
          <TrendingDown className="w-2.5 h-2.5 text-rose-700" />
        ) : (
          <TrendingUp className="w-2.5 h-2.5 text-rose-700" />
        )}
        <span>{rotuloVariacao}</span>
      </span>
    )
  }

  return (
    <div
      data-testid="modal-pdf-executivo"
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs overflow-y-auto flex items-start justify-center p-2 sm:p-4 print:p-0 print:bg-white print:fixed print:inset-0 print:overflow-visible print:z-auto"
    >
      {/* Estilos específicos de impressão A4 de página única */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 6mm;
          }
          html, body {
            background-color: #ffffff !important;
            color: #0f172a !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            width: 100% !important;
            height: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: hidden !important;
          }
          /* Oculta tudo que não for a folha executiva */
          header, nav, footer, .no-print {
            display: none !important;
          }
          .pagina-a4-executiva {
            width: 100% !important;
            max-width: 100% !important;
            height: 98vh !important;
            max-height: 98vh !important;
            margin: 0 auto !important;
            padding: 4mm !important;
            box-shadow: none !important;
            border: none !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            page-break-after: avoid !important;
            break-after: avoid !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
          }
        }
      `}</style>

      <div className="bg-white text-slate-900 w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-2 print:my-0 print:border-none print:shadow-none print:max-w-none print:rounded-none">
        {/* BARRA SUPERIOR DE AÇÕES (OCULTA NO PRINT) */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between no-print print:hidden">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <div className="font-bold text-sm tracking-wide flex items-center gap-2">
                <span>Visão Executiva • Reunião com Banco / Conselho</span>
                <span className="text-[10px] font-mono uppercase bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/40">
                  1 Página A4
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Layout compacto calibrado para impressão direta ou gravação em PDF (A4).
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              data-testid="btn-disparar-print"
              onClick={handlePrint}
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 text-xs font-bold shadow-xs cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir / Salvar PDF</span>
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-slate-300 hover:text-white hover:bg-slate-800 text-xs"
              title="Fechar pré-visualização"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* FOLHA A4 COMPACTA DE UMA PÁGINA (Fundo branco corporativo preservado no print) */}
        <div
          data-testid="folha-a4-executiva"
          className="pagina-a4-executiva bg-white text-slate-900 p-5 sm:p-7 space-y-3.5 print:p-2 print:space-y-2 text-xs"
        >
          {/* 1. CABEÇALHO COM IDENTIFICAÇÃO DA EMPRESA, PERÍODO E DATA DE GERAÇÃO */}
          <div className="border-b-2 border-slate-900 pb-2.5 flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] font-bold tracking-widest text-emerald-700 uppercase">
                  ORBIS PROTOCOL • DM-ORB-001 v1.1
                </span>
                <span className="text-[10px] font-bold text-slate-600 bg-slate-100 border border-slate-300 px-1.5 py-0.2 rounded uppercase">
                  Relatório Executivo
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-950 uppercase font-heading leading-tight">
                Painel Executivo de Descarbonização
              </h1>
              <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-700">
                <span className="inline-flex items-center gap-1 font-semibold text-slate-900">
                  <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{empresaContexto.nome || dados.nomeEmpresa || 'Empresa Cadastrada'}</span>
                </span>
                {empresaContexto.cnpj && (
                  <>
                    <span className="text-slate-400">•</span>
                    <span className="font-mono">
                      CNPJ:{' '}
                      <strong className="text-slate-900 font-bold">
                        {empresaContexto.cnpj || dados.cnpjEmpresa}
                      </strong>
                    </span>
                  </>
                )}
                <span className="text-slate-400">•</span>
                <span className="text-emerald-700 font-semibold">Centro de Desmonte</span>
              </div>
            </div>

            <div className="text-right font-mono text-[10px] text-slate-600 space-y-0.5 shrink-0">
              <div className="inline-flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 font-bold text-slate-800">
                <Calendar className="w-3 h-3 text-emerald-600" />
                <span>Período Ativo: {periodoSelecionado} meses</span>
              </div>
              <div>
                Emissão: <strong>{dataGeracao}</strong>
              </div>
              <div className="text-[9px] text-slate-500">
                Documento Confidencial • Conselho & Bancos
              </div>
            </div>
          </div>

          {/* 2. OS 6 KPIS COM SEUS VALORES E TENDÊNCIAS */}
          <div className="space-y-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-600 flex items-center justify-between">
              <span>Indicadores-Chave Consolidados (Balanço de Massa & CO₂e)</span>
              <span className="font-mono text-[9px] text-slate-500">Mês atual vs anterior</span>
            </div>
            <div className="grid grid-cols-6 gap-2">
              {/* KPI 1: Lotes em Coleta */}
              <div className="p-2 rounded-lg border border-slate-200 bg-slate-50/70 flex flex-col justify-between">
                <div className="text-[9px] font-semibold text-slate-600 flex items-center justify-between">
                  <span className="truncate">Lotes Coleta</span>
                  <Clock className="w-3 h-3 text-amber-500 shrink-0" />
                </div>
                <div className="text-base font-black font-mono text-slate-900 my-0.5">
                  {dados.kpis.lotesEmColeta}
                </div>
                <div className="pt-1 border-t border-slate-200/60 flex items-center justify-between">
                  <span className="text-[8px] text-slate-500">Triagem</span>
                  {renderTendencia(dados.kpis.tendencias?.lotesEmColeta)}
                </div>
              </div>

              {/* KPI 2: Lotes Validados */}
              <div className="p-2 rounded-lg border border-slate-200 bg-slate-50/70 flex flex-col justify-between">
                <div className="text-[9px] font-semibold text-slate-600 flex items-center justify-between">
                  <span className="truncate">Validados</span>
                  <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                </div>
                <div className="text-base font-black font-mono text-emerald-700 my-0.5">
                  {dados.kpis.lotesValidadosConfirmados}
                </div>
                <div className="pt-1 border-t border-slate-200/60 flex items-center justify-between">
                  <span className="text-[8px] text-slate-500">Confirmado</span>
                  {renderTendencia(dados.kpis.tendencias?.lotesValidadosConfirmados)}
                </div>
              </div>

              {/* KPI 3: Massa Recuperada */}
              <div className="p-2 rounded-lg border border-slate-200 bg-slate-50/70 flex flex-col justify-between">
                <div className="text-[9px] font-semibold text-slate-600 flex items-center justify-between">
                  <span className="truncate">Massa Total</span>
                  <Scale className="w-3 h-3 text-blue-500 shrink-0" />
                </div>
                <div className="text-base font-black font-mono text-slate-900 my-0.5 truncate">
                  {dados.kpis.massaRecuperadaToneladas.toFixed(2).replace('.', ',')}{' '}
                  <span className="text-[10px] font-normal">t</span>
                </div>
                <div className="pt-1 border-t border-slate-200/60 flex items-center justify-between">
                  <span className="text-[8px] text-slate-500 font-mono">
                    {dados.kpis.massaRecuperadaKg.toLocaleString('pt-BR', {
                      maximumFractionDigits: 0,
                    })}{' '}
                    kg
                  </span>
                  {renderTendencia(dados.kpis.tendencias?.massaRecuperadaKg)}
                </div>
              </div>

              {/* KPI 4: CO₂e Confirmado */}
              <div className="p-2 rounded-lg border border-emerald-300 bg-emerald-50/50 flex flex-col justify-between">
                <div className="text-[9px] font-semibold text-emerald-900 flex items-center justify-between">
                  <span className="truncate">CO₂e Total</span>
                  <Leaf className="w-3 h-3 text-emerald-600 shrink-0" />
                </div>
                <div className="text-base font-black font-mono text-emerald-800 my-0.5 truncate">
                  {dados.kpis.co2eConfirmadoTotalTco2e.toFixed(2).replace('.', ',')}{' '}
                  <span className="text-[10px] font-normal">tCO₂e</span>
                </div>
                <div className="pt-1 border-t border-emerald-200 flex items-center justify-between">
                  <span className="text-[8px] text-emerald-800 font-mono">
                    {dados.kpis.co2eConfirmadoTotalKg.toLocaleString('pt-BR', {
                      maximumFractionDigits: 0,
                    })}{' '}
                    kg
                  </span>
                  {renderTendencia(dados.kpis.tendencias?.co2eConfirmadoTotalKg)}
                </div>
              </div>

              {/* KPI 5: Documentos Emitidos */}
              <div className="p-2 rounded-lg border border-slate-200 bg-slate-50/70 flex flex-col justify-between">
                <div className="text-[9px] font-semibold text-slate-600 flex items-center justify-between">
                  <span className="truncate">Documentos</span>
                  <FileText className="w-3 h-3 text-purple-500 shrink-0" />
                </div>
                <div className="text-base font-black font-mono text-slate-900 my-0.5">
                  {dados.kpis.documentosAtestadosEmitidos}{' '}
                  <span className="text-[9px] text-emerald-700 font-normal">atest.</span>
                </div>
                <div className="pt-1 border-t border-slate-200/60 flex items-center justify-between">
                  <span className="text-[8px] text-slate-500 font-mono">
                    {dados.kpis.documentosRelatoriosPreliminares} prelim.
                  </span>
                  {renderTendencia(dados.kpis.tendencias?.documentosEmitidos)}
                </div>
              </div>

              {/* KPI 6: Pendências de Coleta */}
              <div className="p-2 rounded-lg border border-slate-200 bg-slate-50/70 flex flex-col justify-between">
                <div className="text-[9px] font-semibold text-slate-600 flex items-center justify-between">
                  <span className="truncate">Pendências</span>
                  <AlertTriangle
                    className={`w-3 h-3 shrink-0 ${
                      dados.kpis.pendenciasColetaEmAberto > 0 ? 'text-rose-500' : 'text-slate-400'
                    }`}
                  />
                </div>
                <div
                  className={`text-base font-black font-mono my-0.5 ${
                    dados.kpis.pendenciasColetaEmAberto > 0 ? 'text-rose-600' : 'text-slate-900'
                  }`}
                >
                  {dados.kpis.pendenciasColetaEmAberto}
                </div>
                <div className="pt-1 border-t border-slate-200/60 flex items-center justify-between">
                  <span className="text-[8px] text-slate-500 truncate">
                    {dados.kpis.pendenciasColetaEmAberto === 0 ? 'Regular' : 'Aguardando'}
                  </span>
                  {renderTendencia(dados.kpis.tendencias?.pendenciasColetaEmAberto, true)}
                </div>
              </div>
            </div>
          </div>

          {/* 3. BLOCO DO MEIO: ROSCA POR MATERIAL + RESUMO POR STATUS DO DOSSIÊ */}
          <div className="grid grid-cols-2 gap-3">
            {/* 3A: ROSCA POR MATERIAL COM PERCENTUAIS */}
            <div className="p-3 rounded-xl border border-slate-200 bg-white flex flex-col justify-between space-y-2">
              <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                <span className="font-bold text-slate-900 flex items-center gap-1 text-[11px]">
                  <PieChartIcon className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Composição por Material (Massa & %)</span>
                </span>
                <span className="font-mono text-[10px] text-slate-500">
                  Total: {dados.kpis.massaRecuperadaToneladas.toFixed(1).replace('.', ',')} t
                </span>
              </div>

              <div className="flex items-center gap-3">
                {/* SVG DONUT COM RECHARTS */}
                <div className="w-24 h-24 shrink-0 relative flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={dados.quebraPorMaterial}
                        dataKey="pesoKg"
                        nameKey="nomeExibicao"
                        innerRadius={24}
                        outerRadius={42}
                        paddingAngle={2}
                        stroke="#ffffff"
                        strokeWidth={1.5}
                        isAnimationActive={false}
                      >
                        {dados.quebraPorMaterial.map((entry) => (
                          <Cell
                            key={`cell-donut-print-${entry.categoria}`}
                            fill={CORES_MATERIAIS[entry.categoria] || '#64748B'}
                          />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                    <span className="text-[7px] uppercase text-slate-400 font-bold leading-none">
                      Massa
                    </span>
                    <span className="text-[10px] font-black font-mono text-slate-800 leading-none mt-0.5">
                      {dados.kpis.massaRecuperadaToneladas.toFixed(1).replace('.', ',')}t
                    </span>
                  </div>
                </div>

                {/* LEGENDA COMPACTA COM VALORES E % */}
                <div className="flex-1 space-y-1 text-[10px]">
                  {dados.quebraPorMaterial.map((item) => {
                    const cor = CORES_MATERIAIS[item.categoria] || '#64748B'
                    return (
                      <div
                        key={`print-material-${item.categoria}`}
                        className="flex items-center justify-between py-0.5 px-1.5 rounded bg-slate-50 border border-slate-100"
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: cor }}
                          />
                          <span className="font-semibold text-slate-800 truncate">
                            {item.nomeExibicao}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 font-mono shrink-0">
                          <span className="text-slate-500">
                            {item.pesoKg.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} kg
                          </span>
                          <span
                            className="font-bold text-[9px] px-1 rounded"
                            style={{ color: cor, backgroundColor: `${cor}15` }}
                          >
                            {item.percentualPeso.toFixed(1).replace('.', ',')}%
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="text-[9px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-100">
                <span>Rastreabilidade de insumos</span>
                <span className="font-medium text-slate-700">
                  Regra Opção B: sem exposição de fatores
                </span>
              </div>
            </div>

            {/* 3B: RESUMO POR STATUS DO DOSSIÊ (ÂMBAR / AZUL / ÍNDIGO / VERDE) */}
            <div className="p-3 rounded-xl border border-slate-200 bg-white flex flex-col justify-between space-y-2">
              <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                <span className="font-bold text-slate-900 flex items-center gap-1 text-[11px]">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Resumo por Status do Dossiê dos Lotes</span>
                </span>
                <span className="font-mono text-[10px] text-slate-500">
                  {dados.statusConformidade.totalLotes} lote(s)
                </span>
              </div>

              <div className="space-y-2 py-0.5">
                {dados.statusDossie.map((item) => (
                  <div key={`print-status-${item.statusChave}`} className="space-y-0.5">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-bold text-slate-800 flex items-center gap-1.5">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: item.cor }}
                        />
                        <span>{item.rotulo}</span>
                      </span>
                      <div className="font-mono text-[10px] flex items-center gap-1.5">
                        <strong className="text-slate-900 font-bold">
                          {item.quantidade} lote{item.quantidade === 1 ? '' : 's'}
                        </strong>
                        <span className="text-slate-500">
                          ({item.percentual.toFixed(1).replace('.', ',')}%)
                        </span>
                      </div>
                    </div>
                    {/* Barra de progresso com cor estritamente preservada */}
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        style={{
                          width: `${Math.max(item.percentual, item.quantidade > 0 ? 4 : 0)}%`,
                          backgroundColor: item.cor,
                        }}
                        className="h-full rounded-full"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="text-[9px] text-slate-500 bg-slate-50 p-1.5 rounded border border-slate-100 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span className="leading-tight">
                  Status de conformidade documental: <strong>validado/confirmado</strong> sob
                  protocolo DM-ORB-001.
                </span>
              </div>
            </div>
          </div>

          {/* 4. GRÁFICO MENSAL MASSA × CO₂e COMPARATIVO */}
          <div className="p-3 rounded-xl border border-slate-200 bg-white space-y-2">
            <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
              <div>
                <span className="font-bold text-slate-900 flex items-center gap-1.5 text-[11px]">
                  <BarChart3 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Comparativo Mensal: Massa Recuperada (kg) × CO₂e Confirmado (kgCO₂e)</span>
                </span>
              </div>
              <div className="flex items-center gap-3 text-[10px] font-semibold">
                <span className="inline-flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-xs bg-blue-500 inline-block" />
                  <span className="text-slate-700">Massa (kg)</span>
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500 inline-block" />
                  <span className="text-slate-700">CO₂e (kgCO₂e)</span>
                </span>
              </div>
            </div>

            {/* GRÁFICO SVG RECHARTS COMPACTO */}
            <div className="w-full h-36 pt-1" data-testid="grafico-print-barras-mensais">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={dados.evolucaoMensal}
                  margin={{ top: 5, right: 10, left: -10, bottom: 0 }}
                  barGap={2}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis
                    dataKey="mesRotulo"
                    tick={{ fill: '#475569', fontSize: 9 }}
                    tickLine={{ stroke: '#cbd5e1' }}
                    axisLine={{ stroke: '#cbd5e1' }}
                  />
                  <YAxis
                    tick={{ fill: '#475569', fontSize: 9 }}
                    tickLine={{ stroke: '#cbd5e1' }}
                    axisLine={{ stroke: '#cbd5e1' }}
                    tickFormatter={(val) =>
                      val >= 1000 ? `${(val / 1000).toFixed(1)}k` : `${val}`
                    }
                  />
                  <Bar
                    dataKey="massaKg"
                    name="Massa (kg)"
                    fill="#3B82F6"
                    radius={[2, 2, 0, 0]}
                    maxBarSize={24}
                    isAnimationActive={false}
                  />
                  <Bar
                    dataKey="co2eConfirmadoKg"
                    name="CO₂e Confirmado (kg)"
                    fill="#10B981"
                    radius={[2, 2, 0, 0]}
                    maxBarSize={24}
                    isAnimationActive={false}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* TABELA SINTÉTICA DE REFORÇO CASO IMPRESSÃO NÃO EXIBA SVG */}
            <div className="overflow-x-auto pt-1">
              <table className="w-full text-left text-[9px] font-mono border-t border-slate-100">
                <thead>
                  <tr className="text-slate-500 uppercase">
                    <th className="py-1">Mês</th>
                    {dados.evolucaoMensal.map((m) => (
                      <th key={`th-${m.mesChave}`} className="py-1 text-right px-1">
                        {m.mesRotulo}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="py-0.5 text-blue-700 font-bold">Massa (kg)</td>
                    {dados.evolucaoMensal.map((m) => (
                      <td
                        key={`td-m-${m.mesChave}`}
                        className="py-0.5 text-right px-1 text-slate-800"
                      >
                        {m.massaKg.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-0.5 text-emerald-700 font-bold">CO₂e (kg)</td>
                    {dados.evolucaoMensal.map((m) => (
                      <td
                        key={`td-c-${m.mesChave}`}
                        className="py-0.5 text-right px-1 font-bold text-emerald-800"
                      >
                        {m.co2eConfirmadoKg.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* 5. RODAPÉ INSTITUCIONAL MANDATÓRIO */}
          <div className="pt-2 border-t-2 border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-2 text-[9px] text-slate-600">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-emerald-600 shrink-0" />
              <span>
                <strong>Aviso Mandatório:</strong> A plataforma apura o CO₂e dos lotes e{' '}
                <strong className="text-slate-900">NÃO emite créditos de carbono</strong>.
              </span>
            </div>
            <div className="flex items-center gap-2 font-mono text-[9px]">
              <span>Prova Documental da Economia Circular — dMRV</span>
              <span>•</span>
              <strong className="text-emerald-800">Atestado Orbis dMRV</strong>
              <span>•</span>
              <span>DM-ORB-001 v1.1</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
