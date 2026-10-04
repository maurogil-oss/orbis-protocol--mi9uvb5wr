import { useState } from 'react'
import {
  DollarSign,
  ShieldAlert,
  Printer,
  FileSpreadsheet,
  AlertTriangle,
  Info,
  CheckCircle2,
  Layers,
  ArrowRight,
  TrendingUp,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/hooks/use-toast'
import {
  TEXTO_ROTULO_ONIPRESENTE,
  exportarSimuladorReferencialCsv,
  type SimuladorReferencialResultado,
} from '@/services/simuladorReferencialService'
import { SimuladorReferencialPrintModal } from './SimuladorReferencialPrintModal'

interface SimuladorReferencialSectionProps {
  simulacao: SimuladorReferencialResultado
}

export function SimuladorReferencialSection({ simulacao }: SimuladorReferencialSectionProps) {
  const [modalPrintAberto, setModalPrintAberto] = useState(false)
  const [exportandoCsv, setExportandoCsv] = useState(false)

  const handleExportarCsv = () => {
    setExportandoCsv(true)
    try {
      const res = exportarSimuladorReferencialCsv(simulacao)
      const a = document.createElement('a')
      a.href = res.url
      a.download = res.nomeArquivo
      a.click()

      toast({
        title: 'Simulação Referencial Exportada (CSV)',
        description: `Arquivo gerado com o rótulo de isenção obrigatório e parâmetros metodológicos.`,
      })
    } catch {
      toast({
        title: 'Erro na exportação',
        description: 'Falha ao gerar arquivo CSV da simulação referencial.',
        variant: 'destructive',
      })
    } finally {
      setExportandoCsv(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in" data-testid="simulador-referencial-container">
      {/* 1. RÓTULO ONIPRESENTE NO TOPO DA SEÇÃO */}
      <div className="p-4 sm:p-5 rounded-2xl border-2 border-amber-500/60 bg-amber-500/10 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
            <span className="font-mono font-black text-xs sm:text-sm uppercase tracking-wider">
              {TEXTO_ROTULO_ONIPRESENTE}
            </span>
          </div>
          <Badge
            variant="outline"
            className="border-amber-500/50 text-amber-700 dark:text-amber-300 bg-background/50 text-[10px] font-mono font-bold uppercase self-start sm:self-auto"
          >
            Uso Interno de Prospecção
          </Badge>
        </div>
        <p className="text-xs leading-relaxed opacity-95">
          A <strong>Orbis Protocol é infraestrutura de prova documental</strong> — ela{' '}
          <strong>NÃO emite créditos de carbono</strong>. Este simulador é uma ferramenta interna de
          conversa comercial: apresenta a <strong>ordem de grandeza do potencial financeiro</strong>{' '}
          do CO₂e evitado, sem qualquer validade comercial, fiscal ou regulatória.
        </p>
      </div>

      {/* CABEÇALHO DO SIMULADOR COM AÇÕES */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-card border border-border shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge
              variant="outline"
              className="border-primary/40 text-primary text-xs font-semibold"
            >
              Potencial Referencial (Informativo)
            </Badge>
            <Badge variant="secondary" className="text-xs font-mono">
              Visão:{' '}
              {simulacao.origemFiltro === 'sintetico'
                ? 'Sandbox (Demonstração)'
                : 'Produção (Dados Reais)'}
            </Badge>
            <span className="text-xs text-muted-foreground font-mono">
              CNPJ: {simulacao.cnpjTitular}
            </span>
          </div>
          <h3 className="text-lg sm:text-xl font-bold tracking-tight">
            Simulador de Potencial Financeiro Referencial (US$ 5–25/tCO₂e)
          </h3>
          <p className="text-xs text-muted-foreground max-w-2xl leading-relaxed">
            Estimativa calculada sobre{' '}
            <strong>
              {simulacao.totalTco2eElegivel.toLocaleString('pt-BR', { minimumFractionDigits: 3 })}{' '}
              tCO₂e elegíveis
            </strong>{' '}
            (apenas itens com fator homologado no catálogo DM-ORB-001). Exibição obrigatória em
            faixa mín–máx.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setModalPrintAberto(true)}
            className="gap-1.5 text-xs border-amber-500/40 hover:bg-amber-500/10"
            title="Abrir versão de impressão com marca d'água pericial e ressalvas"
          >
            <Printer className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
            <span>Imprimir / PDF com Marca d'Água</span>
          </Button>

          <Button
            size="sm"
            onClick={handleExportarCsv}
            disabled={exportandoCsv}
            className="gap-1.5 text-xs bg-amber-600 hover:bg-amber-700 text-slate-950 font-bold"
          >
            <FileSpreadsheet className="h-4 w-4" />
            {exportandoCsv ? 'Gerando...' : 'Exportar Simulação (CSV)'}
          </Button>
        </div>
      </div>

      {/* 2. CARDS PRINCIPAIS: TOTAL ELEGÍVEL + FAIXAS DE PREÇO (USD & BRL) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Volume de tCO2e Elegível */}
        <Card className="border-emerald-500/30 bg-emerald-500/5">
          <CardHeader className="pb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              CO₂e Evitado Elegível (Fator Oficial)
            </span>
            <CardTitle className="text-2xl sm:text-3xl font-black font-mono text-emerald-700 dark:text-emerald-300">
              {simulacao.totalTco2eElegivel.toLocaleString('pt-BR', {
                minimumFractionDigits: 3,
                maximumFractionDigits: 3,
              })}{' '}
              <span className="text-xs font-normal text-muted-foreground">tCO₂e</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-xs text-muted-foreground">
            <div>
              Equivalente a{' '}
              <strong className="text-foreground font-mono">
                {simulacao.totalCo2eElegivelKg.toLocaleString('pt-BR')} kgCO₂e
              </strong>
            </div>
            <div className="text-[11px]">
              Massa elegível: {simulacao.totalMassaElegivelKg.toLocaleString('pt-BR')} kg (
              {simulacao.totalPecasElegiveis} itens)
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Faixa de Preço em Dólar (US$) */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Potencial Referencial em Dólar (US$)
              </span>
              <Badge
                variant="outline"
                className="text-[9px] font-mono border-amber-500/40 text-amber-600 dark:text-amber-400"
              >
                US$ 5–25/tCO₂e
              </Badge>
            </div>
            <CardTitle
              className="text-2xl sm:text-3xl font-black font-mono text-foreground"
              data-testid="simulador-faixa-usd"
            >
              {simulacao.faixaUsd.formatado}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-xs">
            <div className="font-mono text-[11px] text-amber-700 dark:text-amber-400 font-semibold">
              {TEXTO_ROTULO_ONIPRESENTE}
            </div>
            <p className="text-[10px] text-muted-foreground">
              Cálculo transparente: {simulacao.totalTco2eElegivel.toFixed(3)} t × US$ 5 a US$ 25
            </p>
          </CardContent>
        </Card>

        {/* Card 3: Faixa de Preço em Reais (R$) com Câmbio Declarado */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Equivalente Aproximado em Reais (R$)
              </span>
              <Badge variant="outline" className="text-[9px] font-mono">
                PTAX R$ 5,75
              </Badge>
            </div>
            <CardTitle
              className="text-2xl sm:text-3xl font-black font-mono text-foreground"
              data-testid="simulador-faixa-brl"
            >
              {simulacao.faixaBrl.formatado}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-xs">
            <div className="font-mono text-[11px] text-amber-700 dark:text-amber-400 font-semibold">
              {TEXTO_ROTULO_ONIPRESENTE}
            </div>
            <p className="text-[10px] text-muted-foreground">
              Premissa cambial declarada no código (Banco Central PTAX)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 3. PREMISSA METODOLÓGICA VISÍVEL NA TELA (REGRA Nº 2) */}
      <div className="p-4 rounded-xl bg-muted/40 border border-border text-xs space-y-2">
        <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-[11px] text-muted-foreground">
          <Info className="w-4 h-4 text-primary shrink-0" />
          <span>Premissas Metodológicas Transparentes e Fontes Citadas</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-muted-foreground text-[11px] leading-relaxed">
          <div className="space-y-1">
            <div>
              <strong className="text-foreground">Faixa de Preço de Referência:</strong> US${' '}
              {simulacao.premissas.precoFaixaMinUsd.toFixed(2)} a US${' '}
              {simulacao.premissas.precoFaixaMaxUsd.toFixed(2)} / tCO₂e.
            </div>
            <div>
              <strong className="text-foreground">Fonte da Faixa:</strong>{' '}
              {simulacao.premissas.fontePreco}.
            </div>
          </div>
          <div className="space-y-1">
            <div>
              <strong className="text-foreground">Câmbio de Conversão:</strong> R${' '}
              {simulacao.premissas.cambioBrl.toFixed(2)} / US$ 1,00 (
              {simulacao.premissas.fonteCambio}).
            </div>
            <div>
              <strong className="text-foreground">Critério de Elegibilidade:</strong> Somente
              materiais com fator oficial homologado no catálogo DM-ORB-001 v1.1.
            </div>
          </div>
        </div>
      </div>

      {/* 4. DECOMPOSIÇÃO POR PROTOCOLO SETORIAL COM UNIDADES CANÔNICAS */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="space-y-0.5">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Layers className="h-4 w-4 text-primary" />
                Decomposição por Protocolo Setorial (Unidades Canônicas)
              </CardTitle>
              <CardDescription className="text-xs">
                Valores mínimos e máximos calculados segmento a segmento conforme as unidades
                oficiais do catálogo.
              </CardDescription>
            </div>
            <span className="text-[10px] font-mono text-muted-foreground">
              {simulacao.decomposicaoPorProtocolo.length} protocolo(s) ativo(s)
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-muted/40 text-[10px] font-semibold text-muted-foreground uppercase">
                <tr>
                  <th className="py-2.5 px-3">Protocolo Setorial</th>
                  <th className="py-2.5 px-3 text-right">Volume Canônico</th>
                  <th className="py-2.5 px-3 text-right">tCO₂e Elegível</th>
                  <th className="py-2.5 px-3 text-right">Faixa US$ (mín–máx)</th>
                  <th className="py-2.5 px-3 text-right">Faixa R$ (PTAX 5,75)</th>
                  <th className="py-2.5 px-3 text-center">Status / Rótulo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-foreground font-mono text-[11px]">
                {simulacao.decomposicaoPorProtocolo.map((p) => (
                  <tr key={p.protocoloSlug} className="hover:bg-muted/40 transition-colors">
                    <td className="py-2.5 px-3 font-sans font-semibold">
                      <div className="flex items-center gap-1.5">
                        <span>{p.protocoloNome}</span>
                        {p.premisaBadge && (
                          <Badge
                            variant="outline"
                            className="text-[9px] font-mono px-1 py-0 h-4 border-emerald-500/40 text-emerald-600 dark:text-emerald-400"
                          >
                            {p.premisaBadge}
                          </Badge>
                        )}
                      </div>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {p.totalLotes} lote(s) • {p.totalPecasElegiveis} itens
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {p.quantidadeCanonicaFormatada}{' '}
                      <span className="font-sans text-[10px] text-muted-foreground">
                        {p.unidadeCanonica}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                      {p.tco2eElegivel.toLocaleString('pt-BR', { minimumFractionDigits: 3 })} t
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-foreground">
                      US$ {p.valorMinimoUsd.toFixed(2)} – US$ {p.valorMaximoUsd.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-foreground">
                      R$ {p.valorMinimoBrl.toFixed(2)} – R$ {p.valorMaximoBrl.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-center font-sans">
                      <span
                        className="text-[9px] font-bold text-amber-700 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/30 inline-block"
                        title={TEXTO_ROTULO_ONIPRESENTE}
                      >
                        Sem validade • Não negociável
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* 5. FRAÇÕES E MATERIAIS EXCLUÍDOS DA SIMULAÇÃO (REGRA Nº 4) */}
      <Card className="border-amber-500/30 bg-amber-500/5">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="space-y-0.5">
              <CardTitle className="text-base font-bold flex items-center gap-2 text-amber-900 dark:text-amber-200">
                <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                Frações & Materiais Excluídos da Simulação (Regra de Blindagem nº 4)
              </CardTitle>
              <CardDescription className="text-xs text-amber-800/80 dark:text-amber-300/80">
                Apenas materiais com fator oficial homologado entram no cálculo. Frações em
                estruturação de catálogo (ouro, paládio, prata, terras raras e itens sem fator)
                ficam estritamente <strong>fora do cálculo</strong> e estão explicadas abaixo. Nunca
                somem silenciosamente.
              </CardDescription>
            </div>
            <Badge
              variant="outline"
              className="border-amber-500/40 text-amber-800 dark:text-amber-300 font-mono text-xs"
            >
              {simulacao.exclusoes.length} grupo(s) excluído(s)
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-xl border border-amber-500/20 bg-background/60">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-muted/40 text-[10px] font-semibold text-muted-foreground uppercase">
                <tr>
                  <th className="py-2.5 px-3">Fração / Material Rastreado</th>
                  <th className="py-2.5 px-3 text-right">Massa Rastreada</th>
                  <th className="py-2.5 px-3 text-right">Itens</th>
                  <th className="py-2.5 px-3">Motivo da Exclusão</th>
                  <th className="py-2.5 px-3 text-center">Status no Catálogo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-foreground font-mono text-[11px]">
                {simulacao.exclusoes.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-4 text-center font-sans text-xs text-muted-foreground"
                    >
                      Nenhuma fração excluída — todos os materiais do lote possuem fator oficial
                      homologado no catálogo DM-ORB-001.
                    </td>
                  </tr>
                ) : (
                  simulacao.exclusoes.map((ex) => (
                    <tr key={ex.chave} className="hover:bg-muted/30 transition-colors">
                      <td className="py-2.5 px-3 font-sans font-semibold text-foreground">
                        {ex.materialOuDescricao}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold">
                        {ex.massaKg.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} kg
                      </td>
                      <td className="py-2.5 px-3 text-right">{ex.totalItens}</td>
                      <td className="py-2.5 px-3 font-sans text-[11px] text-amber-800 dark:text-amber-300">
                        {ex.motivoExclusao}
                      </td>
                      <td className="py-2.5 px-3 text-center font-sans">
                        <Badge
                          variant="outline"
                          className="text-[9px] font-mono border-amber-500/40 text-amber-700 dark:text-amber-400 bg-amber-500/10"
                        >
                          {ex.statusCatalogo}
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* 6. RECONCILIAÇÃO PERICIAL DO SIMULADOR (MESMA DISCIPLINA DO RELATÓRIO ESTRATIFICADO) */}
      <div className="p-4 rounded-xl border border-border bg-muted/30 space-y-2">
        <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider">
          <span className="flex items-center gap-2 text-foreground">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            Reconciliação Auditável do Simulador com a Origem dMRV
          </span>
          <Badge
            variant="outline"
            className="border-emerald-500/40 text-emerald-600 dark:text-emerald-400 font-mono text-[10px] font-bold"
          >
            {simulacao.reconciliacao.somaBatePerfeitamente ? '100% CONFORME' : 'DIVERGÊNCIA'}
          </Badge>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono pt-1">
          <div>
            <span className="text-[10px] text-muted-foreground block uppercase">
              CO₂e Bruto de Origem
            </span>
            <strong className="text-foreground">
              {simulacao.reconciliacao.co2eTotalOrigemKg.toLocaleString('pt-BR')} kg
            </strong>
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground block uppercase">
              CO₂e Elegível no Simulador
            </span>
            <strong className="text-emerald-600 dark:text-emerald-400">
              {simulacao.reconciliacao.co2eElegivelSimuladorKg.toLocaleString('pt-BR')} kg
            </strong>
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground block uppercase">
              CO₂e Excluído (Fator 0)
            </span>
            <strong className="text-foreground">
              {simulacao.reconciliacao.co2eExcluidoKg.toLocaleString('pt-BR')} kg
            </strong>
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground block uppercase">
              Massa Excluída Total
            </span>
            <strong className="text-amber-700 dark:text-amber-400">
              {simulacao.totalMassaExcluidaKg.toLocaleString('pt-BR')} kg
            </strong>
          </div>
        </div>
      </div>

      {/* Modal de Impressão e PDF com Marca d'Água */}
      <SimuladorReferencialPrintModal
        aberto={modalPrintAberto}
        onClose={() => setModalPrintAberto(false)}
        simulacao={simulacao}
      />
    </div>
  )
}
