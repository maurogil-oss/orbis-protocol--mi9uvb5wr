import {
  Printer,
  X,
  ShieldAlert,
  AlertTriangle,
  Layers,
  DollarSign,
  CheckCircle2,
  Info,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  TEXTO_ROTULO_ONIPRESENTE,
  type SimuladorReferencialResultado,
} from '@/services/simuladorReferencialService'

interface SimuladorReferencialPrintModalProps {
  aberto: boolean
  onClose: () => void
  simulacao: SimuladorReferencialResultado | null
}

export function SimuladorReferencialPrintModal({
  aberto,
  onClose,
  simulacao,
}: SimuladorReferencialPrintModalProps) {
  if (!aberto || !simulacao) return null

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
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm overflow-y-auto flex items-start justify-center p-2 sm:p-6 print:p-0 print:bg-white print:fixed-none">
      <div className="bg-white text-slate-900 w-full max-w-5xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-4 print:my-0 print:border-none print:shadow-none print:max-w-none print:rounded-none relative">
        {/* Barra de Ações Superior (Oculta na impressão) */}
        <div className="bg-slate-950 text-white px-6 py-4 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-400" />
            <span className="font-bold text-sm tracking-wide">
              Visualização de Exportação • Simulador Referencial de Potencial de Crédito
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={handlePrint}
              size="sm"
              className="bg-amber-600 hover:bg-amber-700 text-slate-950 font-bold gap-1.5 text-xs shadow-sm"
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

        {/* MARCA D'ÁGUA OBRIGATÓRIA ONIPRESENTE (ESTILIZADA PARA TELA E IMPRESSÃO) */}
        <div
          aria-hidden="true"
          className="pointer-events-none select-none absolute inset-0 z-10 flex items-center justify-center overflow-hidden opacity-[0.06] print:opacity-[0.09]"
        >
          <div className="transform -rotate-45 text-center font-black tracking-widest text-slate-900 uppercase text-4xl sm:text-6xl leading-tight border-8 border-dashed border-slate-900 p-8">
            SIMULAÇÃO REFERENCIAL
            <br />
            SEM VALIDADE • NÃO EMISSÍVEL • NÃO NEGOCIÁVEL
            <br />
            ORBIS PROTOCOL — PROVA DOCUMENTAL
          </div>
        </div>

        {/* Folha do Relatório */}
        <div className="p-8 sm:p-12 space-y-8 bg-white print:p-8 print:text-black relative z-20">
          {/* FAIXA SUPERIOR DE AVISO LEGAL OBRIGATÓRIO */}
          <div className="p-4 rounded-xl border-2 border-amber-500 bg-amber-50 text-amber-950 space-y-1">
            <div className="flex items-center gap-2 font-black uppercase tracking-wider text-xs">
              <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0" />
              <span>{TEXTO_ROTULO_ONIPRESENTE}</span>
            </div>
            <p className="text-[11px] leading-relaxed text-amber-900">
              Esta folha apresenta exclusivamente ordem de grandeza referencial do potencial
              financeiro do CO₂e evitado. A{' '}
              <strong>Orbis Protocol é infraestrutura de prova documental</strong> e{' '}
              <strong>NÃO emite créditos de carbono</strong>. Os valores calculados abaixo não
              constituem ativo financeiro, promessa de retorno, nem possuem validade jurídica ou
              transacional perante o SBCE ou mercado voluntário.
            </p>
          </div>

          {/* CABEÇALHO */}
          <div className="border-b-2 border-slate-900 pb-6 flex flex-col sm:flex-row justify-between items-start gap-4">
            <div className="space-y-1.5">
              <span className="font-mono text-xs font-bold tracking-widest text-emerald-800 uppercase">
                ORBIS PROTOCOL • CONSOLE ADMINISTRATIVO (dMRV)
              </span>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-950 uppercase">
                Simulador Referencial de Potencial de Crédito
              </h1>
              <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
                Ferramenta interna de parametrização e prospecção com cliente. Cálculo transparente
                sobre <strong>tCO₂e evitado com fator oficial homologado</strong> no catálogo
                DM-ORB-001.
              </p>
            </div>

            <div className="text-right font-mono text-xs text-slate-600 space-y-1 shrink-0">
              <div>
                Gerado em: <strong>{dataFormatada}</strong>
              </div>
              <div>
                CNPJ Titular: <strong>{simulacao.cnpjTitular}</strong>
              </div>
              <div>
                Ambiente:{' '}
                <strong>
                  {simulacao.origemFiltro === 'sintetico'
                    ? 'Sandbox (Demonstração)'
                    : 'Produção (Dados Reais)'}
                </strong>
              </div>
            </div>
          </div>

          {/* CARDS COM FAIXAS DE VALOR (SEMPRE COMO FAIXA MÍN - MÁX) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono font-bold uppercase text-slate-700">
              <span>Potencial de Valor Consolidado (Premissa Metodológica Declarada)</span>
              <span className="text-[10px] text-amber-800">Sempre em faixa (mín–máx)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-xl border-2 border-emerald-600 bg-emerald-50/50 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-900 block">
                  tCO₂e Elegível (Fator Oficial)
                </span>
                <div className="text-2xl font-black font-mono text-emerald-900">
                  {simulacao.totalTco2eElegivel.toLocaleString('pt-BR', {
                    minimumFractionDigits: 3,
                    maximumFractionDigits: 3,
                  })}{' '}
                  <span className="text-xs font-normal">tCO₂e</span>
                </div>
                <p className="text-[10px] text-emerald-800">
                  {simulacao.totalCo2eElegivelKg.toLocaleString('pt-BR')} kgCO₂e com fator
                  homologado
                </p>
              </div>

              <div className="p-4 rounded-xl border-2 border-slate-900 bg-slate-50 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700 block">
                    Faixa de Valor Referencial (US$)
                  </span>
                  <span className="text-[9px] font-mono font-bold text-amber-800 bg-amber-100 px-1 py-0.5 rounded">
                    US$ 5–25/t
                  </span>
                </div>
                <div className="text-2xl font-black font-mono text-slate-950">
                  {simulacao.faixaUsd.formatado}
                </div>
                <p className="text-[10px] text-slate-600">{TEXTO_ROTULO_ONIPRESENTE}</p>
              </div>

              <div className="p-4 rounded-xl border-2 border-slate-900 bg-slate-50 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700 block">
                    Faixa de Valor Aproximada (R$)
                  </span>
                  <span className="text-[9px] font-mono font-bold text-slate-700 bg-slate-200 px-1 py-0.5 rounded">
                    PTAX R$ 5,75
                  </span>
                </div>
                <div className="text-2xl font-black font-mono text-slate-950">
                  {simulacao.faixaBrl.formatado}
                </div>
                <p className="text-[10px] text-slate-600">{TEXTO_ROTULO_ONIPRESENTE}</p>
              </div>
            </div>
          </div>

          {/* TABELA DE DECOMPOSIÇÃO POR PROTOCOLO SETORIAL */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-300 pb-1">
              <h2 className="text-sm font-bold uppercase tracking-wide text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-700" />
                Decomposição por Protocolo Setorial (Unidades Canônicas)
              </h2>
              <span className="text-[11px] font-mono text-slate-600">
                {simulacao.decomposicaoPorProtocolo.length} protocolo(s)
              </span>
            </div>

            <table className="w-full text-left text-xs border border-slate-200">
              <thead className="bg-slate-100 text-[10px] font-bold text-slate-700 uppercase border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Protocolo Setorial</th>
                  <th className="py-2.5 px-3 text-right">Volume Canônico</th>
                  <th className="py-2.5 px-3 text-right">tCO₂e Elegível</th>
                  <th className="py-2.5 px-3 text-right">Faixa US$ (5–25/t)</th>
                  <th className="py-2.5 px-3 text-right">Faixa R$ (PTAX 5,75)</th>
                  <th className="py-2.5 px-3 text-center">Status / Rótulo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
                {simulacao.decomposicaoPorProtocolo.map((p) => (
                  <tr key={p.protocoloSlug}>
                    <td className="py-2.5 px-3 font-sans font-semibold text-slate-900">
                      <div>{p.protocoloNome}</div>
                      {p.premisaBadge && (
                        <span className="text-[9px] font-mono text-emerald-800 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200">
                          {p.premisaBadge}
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {p.quantidadeCanonicaFormatada}{' '}
                      <span className="font-sans text-[10px] text-slate-600">
                        {p.unidadeCanonica}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-emerald-800">
                      {p.tco2eElegivel.toLocaleString('pt-BR', { minimumFractionDigits: 3 })} t
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-950">
                      US$ {p.valorMinimoUsd.toFixed(2)} – US$ {p.valorMaximoUsd.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-950">
                      R$ {p.valorMinimoBrl.toFixed(2)} – R$ {p.valorMaximoBrl.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-center font-sans">
                      <span className="text-[9px] font-bold text-amber-900 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-300 block">
                        Sem validade / Não negociável
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* TABELA DE FRAÇÕES EXCLUÍDAS */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-amber-300 pb-1">
              <h2 className="text-sm font-bold uppercase tracking-wide text-amber-950 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                Frações & Materiais Excluídos da Simulação (Regra de Blindagem nº 4)
              </h2>
              <span className="text-[11px] font-mono text-amber-900">
                {simulacao.exclusoes.length} item(ns) excluído(s)
              </span>
            </div>

            <p className="text-[11px] text-slate-600">
              Apenas materiais com fator oficial homologado entram na simulação. Frações em
              estruturação (ouro, paládio, prata, terras raras e materiais com fator zero) ficam
              estritamente <strong>fora do cálculo</strong> e estão listadas abaixo com
              justificativa metodológica — nenhuma fração é omitida silenciosamente.
            </p>

            <table className="w-full text-left text-xs border border-amber-200">
              <thead className="bg-amber-50 text-[10px] font-bold text-amber-900 uppercase border-b border-amber-200">
                <tr>
                  <th className="py-2 px-3">Fração / Material Rastreado</th>
                  <th className="py-2 px-3 text-right">Massa (kg)</th>
                  <th className="py-2 px-3 text-right">Itens</th>
                  <th className="py-2 px-3">Motivo da Exclusão</th>
                  <th className="py-2 px-3 text-center">Status no Catálogo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-100 font-mono text-[11px]">
                {simulacao.exclusoes.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-4 text-center font-sans text-xs text-slate-500">
                      Nenhum material excluído — todos os itens do lote possuem fator oficial
                      homologado.
                    </td>
                  </tr>
                ) : (
                  simulacao.exclusoes.map((ex) => (
                    <tr key={ex.chave}>
                      <td className="py-2 px-3 font-sans font-semibold text-slate-900">
                        {ex.materialOuDescricao}
                      </td>
                      <td className="py-2 px-3 text-right">
                        {ex.massaKg.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}
                      </td>
                      <td className="py-2 px-3 text-right">{ex.totalItens}</td>
                      <td className="py-2 px-3 font-sans text-[10px] text-amber-950">
                        {ex.motivoExclusao}
                      </td>
                      <td className="py-2 px-3 text-center font-sans">
                        <span className="text-[9px] font-mono font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-300">
                          {ex.statusCatalogo}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* SOMA DE RECONCILIAÇÃO PERICIAL */}
          <div className="p-4 rounded-xl border-2 border-slate-900 bg-slate-50 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-900">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                Reconciliação Auditável com o dMRV
              </span>
              <span className="font-mono text-emerald-800 font-black">
                {simulacao.reconciliacao.somaBatePerfeitamente
                  ? '100% RECONCILIADO'
                  : 'DIVERGÊNCIA'}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono pt-1">
              <div>
                <span className="text-[10px] text-slate-500 block uppercase">
                  CO₂e Bruto de Origem
                </span>
                <strong>
                  {simulacao.reconciliacao.co2eTotalOrigemKg.toLocaleString('pt-BR')} kg
                </strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block uppercase">
                  CO₂e Elegível no Simulador
                </span>
                <strong className="text-emerald-800">
                  {simulacao.reconciliacao.co2eElegivelSimuladorKg.toLocaleString('pt-BR')} kg
                </strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block uppercase">
                  CO₂e Excluído (Fator 0)
                </span>
                <strong>{simulacao.reconciliacao.co2eExcluidoKg.toLocaleString('pt-BR')} kg</strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block uppercase">
                  Massa Excluída Total
                </span>
                <strong className="text-amber-800">
                  {simulacao.totalMassaExcluidaKg.toLocaleString('pt-BR')} kg
                </strong>
              </div>
            </div>
          </div>

          {/* PÁGINA / SEÇÃO DE RESSALVAS METODOLÓGICAS COMPLETAS */}
          <div className="p-5 rounded-xl border border-slate-300 bg-slate-50/70 space-y-3 text-xs text-slate-700">
            <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-slate-900">
              <Info className="w-4 h-4 text-primary shrink-0" />
              <span>Ressalvas Metodológicas, Premissas & Fontes Oficiais Citadas</span>
            </div>
            <ul className="list-disc pl-5 space-y-1.5 text-[11px] leading-relaxed">
              <li>
                <strong>Faixa de Preço (US$ 5,00 a US$ 25,00/tCO₂e):</strong>{' '}
                {simulacao.premissas.fontePreco}. A exibição em faixa reflete a volatilidade dos
                mercados voluntários e a ausência de cotação única no SBCE (Lei 15.042/2024).
              </li>
              <li>
                <strong>Câmbio de Referência:</strong> {simulacao.premissas.fonteCambio}. Aplicado
                unicamente para conveniência indicativa em moeda nacional.
              </li>
              <li>
                <strong>Catálogo de Fatores:</strong> Fatores curados do catálogo DM-ORB-001 v1.1
                (worldsteel 2024 para aço, IAI 2024 para alumínio primário, CopperMark/ICA para
                cobre, PlasticsEurope para polímeros e IPCC AR6 para fluidos refrigerantes).
              </li>
              <li>
                <strong>Isenção Institucional:</strong> {simulacao.premissas.avisoLegal}
              </li>
            </ul>
          </div>

          {/* RODAPÉ */}
          <div className="border-t border-slate-300 pt-4 flex flex-col sm:flex-row justify-between items-center text-[10px] text-slate-500 font-mono gap-2">
            <div>ORBIS PROTOCOL • SIMULADOR REFERENCIAL DE POTENCIAL (CONSOLE DMRV)</div>
            <div className="font-bold text-amber-900">{TEXTO_ROTULO_ONIPRESENTE}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
