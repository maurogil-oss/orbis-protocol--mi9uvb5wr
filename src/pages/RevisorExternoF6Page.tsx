import React, { useState } from 'react';
import {
  FileCheck2,
  Printer,
  ShieldCheck,
  Scale,
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Calculator,
  CheckCircle2,
  ClipboardPen,
  Copy,
  Check,
  ExternalLink,
  Info,
  Car,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

/**
 * PACOTE DO REVISOR EXTERNO — AUDITORIA CEGA F6
 * Metodologia: DM-ORB-001 v1.1
 *
 * CRÍTICO (Regra de Auditoria Cega):
 * Este pacote NÃO PODE conter o valor total esperado pelo motor (ex: 12,87 kgCO2e)
 * nem os subtotais calculados pelo motor de emissões.
 * Ele contém exclusivamente os dados de ENTRADA do lote, o texto integral da metodologia,
 * as equações e parâmetros normativos, e a folha de resposta para o revisor independente
 * executar a conferência manual/paramétrica.
 */

interface PecaEntradaLote {
  item: number;
  descricao: string;
  material: 'Aço automotivo (reaproveitamento)' | 'Cobre / chicotes elétricos' | 'Polímeros automotivos / parachoque';
  massaKg: number;
  statusDestinacao: 'Destinada via NF-e' | 'Destinada via MTR' | 'Em estoque (sem destinação)';
  documentoSuporte: string;
  classificacaoClaim: 'CONFIRMADO' | 'POTENCIAL';
}

const DADOS_ENTRADA_GOL: PecaEntradaLote[] = [
  {
    item: 1,
    descricao: 'Capô dianteiro automotivo',
    material: 'Aço automotivo (reaproveitamento)',
    massaKg: 10.0,
    statusDestinacao: 'Destinada via NF-e',
    documentoSuporte: 'NF-e 1234 (venda de peça reusável)',
    classificacaoClaim: 'CONFIRMADO',
  },
  {
    item: 2,
    descricao: 'Alternador / Estator com enrolamento de cobre',
    material: 'Cobre / chicotes elétricos',
    massaKg: 2.5,
    statusDestinacao: 'Destinada via MTR',
    documentoSuporte: 'MTR 4410 (Manifesto de Transporte de Resíduos / Destinação)',
    classificacaoClaim: 'CONFIRMADO',
  },
  {
    item: 3,
    descricao: 'Parachoque dianteiro plástico / polímeros',
    material: 'Polímeros automotivos / parachoque',
    massaKg: 4.0,
    statusDestinacao: 'Em estoque (sem destinação)',
    documentoSuporte: 'Controle de pátio interno (sem NF-e / MTR de saída)',
    classificacaoClaim: 'POTENCIAL',
  },
];

export function RevisorExternoF6Page() {
  const [copiado, setCopiado] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const copiarLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  return (
    <div className="min-h-screen py-8 md:py-14 bg-slate-50 dark:bg-[#0A1628] text-slate-900 dark:text-[#F8FAFC] transition-colors print:bg-white print:text-black print:py-2">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-8 print:space-y-4">
        {/* Barra superior de identificação & ações de impressão */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-slate-800 shadow-sm print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-[#111827] text-blue-600 dark:text-[#2563EB] border border-blue-200 dark:border-blue-900/40">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-heading font-bold text-sm tracking-tight text-slate-900 dark:text-[#F8FAFC]">
                  Orbis Protocol — Pacote do Revisor Externo
                </span>
                <Badge variant="outline" className="text-[10px] uppercase font-mono border-blue-300 dark:border-blue-800 text-blue-700 dark:text-blue-400">
                  Auditoria F6 Cega
                </Badge>
              </div>
              <p className="text-xs text-slate-500 dark:text-[#94A3B8]">
                Protocolo restrito para revisão independente por pares e auditores técnicos credenciados
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={copiarLink}
              className="text-xs h-9 bg-white dark:bg-[#111827] border-slate-200 dark:border-slate-800 text-slate-700 dark:text-[#F8FAFC]"
            >
              {copiado ? <Check className="w-3.5 h-3.5 mr-1 text-emerald-600 dark:text-[#059669]" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
              {copiado ? 'Link Copiado' : 'Copiar Link'}
            </Button>
            <Button
              onClick={handlePrint}
              size="sm"
              className="text-xs h-9 bg-blue-600 hover:bg-blue-700 dark:bg-[#2563EB] dark:hover:bg-blue-600 text-white font-semibold shadow-sm"
            >
              <Printer className="w-3.5 h-3.5 mr-1.5" />
              Imprimir / Salvar PDF
            </Button>
          </div>
        </div>

        {/* Cabeçalho Oficial do Pacote */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-slate-800 shadow-sm print:border-black print:p-4">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-[#111827] border border-blue-200 dark:border-blue-900/40 text-blue-700 dark:text-blue-400 text-xs font-mono font-bold">
                <FileCheck2 className="w-3.5 h-3.5" />
                DM-ORB-001 v1.1 • AUDITORIA CEGA DE RECÁLCULO
              </div>
              <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-slate-900 dark:text-[#F8FAFC] tracking-tight">
                Dossiê Pericial do Revisor Independente
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-[#94A3B8] max-w-3xl leading-relaxed">
                Este instrumento fornece a especificação metodológica integral, os parâmetros de cálculo auditados,
                os dados brutos de entrada do Lote Piloto de Referência (VW Gol) e a folha de respostas padronizada.
                O revisor deve calcular manualmente ou programaticamente os valores de emissão evitada e incerteza,
                confrontando o resultado exclusivamente através de seu parecer final.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-[#111827] border border-amber-200 dark:border-amber-900/40 text-xs space-y-1.5 shrink-0 max-w-xs">
              <div className="flex items-center gap-1.5 font-bold text-amber-800 dark:text-amber-400">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                Aviso de Auditoria Cega
              </div>
              <p className="text-[11px] text-amber-900 dark:text-amber-300 leading-snug">
                Conforme norma de auditoria independente, este pacote não divulga os subtotais ou o total acumulado
                gerado pelo motor do sistema, eliminando viés de confirmação no recálculo pericial.
              </p>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
            <div>
              <span className="text-slate-500 dark:text-[#94A3B8] block text-[11px]">Metodologia Base:</span>
              <span className="font-bold text-slate-800 dark:text-[#F8FAFC]">DM-ORB-001 v1.1</span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-[#94A3B8] block text-[11px]">Lote em Auditoria:</span>
              <span className="font-bold text-slate-800 dark:text-[#F8FAFC]">VW Gol 1.0 (3 peças)</span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-[#94A3B8] block text-[11px]">Enquadramento:</span>
              <span className="font-bold text-slate-800 dark:text-[#F8FAFC]">Mover / SBCE Art. 4º</span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-[#94A3B8] block text-[11px]">Classificação:</span>
              <span className="font-bold text-slate-800 dark:text-[#F8FAFC]">Nível 1 (Pares Técnicos)</span>
            </div>
          </div>
        </div>

        {/* Bloco de Abas ou Seções */}
        <Tabs defaultValue="entrada" className="w-full space-y-6">
          <TabsList className="grid grid-cols-4 w-full bg-slate-200/70 dark:bg-[#0E1A2E] p-1 rounded-2xl border border-slate-200 dark:border-slate-800 print:hidden">
            <TabsTrigger value="entrada" className="text-xs font-semibold py-2.5 rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-[#111827] data-[state=active]:text-blue-600 dark:data-[state=active]:text-[#2563EB]">
              1. Dados de Entrada
            </TabsTrigger>
            <TabsTrigger value="instrucoes" className="text-xs font-semibold py-2.5 rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-[#111827] data-[state=active]:text-blue-600 dark:data-[state=active]:text-[#2563EB]">
              2. Equações e Regras (§6.3)
            </TabsTrigger>
            <TabsTrigger value="metodologia" className="text-xs font-semibold py-2.5 rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-[#111827] data-[state=active]:text-blue-600 dark:data-[state=active]:text-[#2563EB]">
              3. Metodologia DM-ORB-001
            </TabsTrigger>
            <TabsTrigger value="folha" className="text-xs font-semibold py-2.5 rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-[#111827] data-[state=active]:text-blue-600 dark:data-[state=active]:text-[#2563EB]">
              4. Folha de Resposta
            </TabsTrigger>
          </TabsList>

          {/* ABA 1: DADOS DE ENTRADA DO LOTE VW GOL */}
          <TabsContent value="entrada" className="space-y-6">
            <Card className="bg-white dark:bg-[#0E1A2E] border-slate-200 dark:border-slate-800 shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-heading font-bold text-slate-900 dark:text-[#F8FAFC] flex items-center gap-2">
                      <Car className="w-5 h-5 text-blue-600 dark:text-[#2563EB]" />
                      Dados Brutos de Entrada — Lote de Teste VW Gol
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-600 dark:text-[#94A3B8]">
                      Amostra de 3 componentes automotivos desmontados e triados no Centro de Desmanche Veicular (CDV).
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="font-mono text-xs">
                    LOTE-AUDIT-GOL-01
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-100/70 dark:bg-[#111827] text-slate-600 dark:text-[#94A3B8] font-mono uppercase text-[10px] border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="p-3">Item</th>
                        <th className="p-3">Descrição da Peça</th>
                        <th className="p-3">Material Predominante</th>
                        <th className="p-3 text-right">Massa Bruta (Q)</th>
                        <th className="p-3">Status de Destinação</th>
                        <th className="p-3">Documento de Suporte</th>
                        <th className="p-3">Classificação Regulatória</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {DADOS_ENTRADA_GOL.map((peca) => (
                        <tr key={peca.item} className="hover:bg-slate-50 dark:hover:bg-[#111827]/60 transition-colors">
                          <td className="p-3 font-mono font-bold text-slate-700 dark:text-slate-300">
                            #{peca.item}
                          </td>
                          <td className="p-3 font-semibold text-slate-900 dark:text-[#F8FAFC]">
                            {peca.descricao}
                          </td>
                          <td className="p-3 text-slate-700 dark:text-slate-300">
                            {peca.material}
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-blue-600 dark:text-blue-400">
                            {peca.massaKg.toFixed(2)} kg
                          </td>
                          <td className="p-3">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${
                              peca.statusDestinacao.includes('NF-e') || peca.statusDestinacao.includes('MTR')
                                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50'
                                : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50'
                            }`}>
                              {peca.statusDestinacao}
                            </span>
                          </td>
                          <td className="p-3 font-mono text-[11px] text-slate-600 dark:text-[#94A3B8]">
                            {peca.documentoSuporte}
                          </td>
                          <td className="p-3">
                            <Badge className={
                              peca.classificacaoClaim === 'CONFIRMADO'
                                ? 'bg-emerald-600 text-white dark:bg-[#059669]'
                                : 'bg-amber-600 text-white dark:bg-amber-600'
                            }>
                              Claim {peca.classificacaoClaim}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-[#111827] border border-blue-200 dark:border-slate-800 space-y-2 text-xs">
                  <div className="flex items-center gap-2 font-bold text-blue-900 dark:text-blue-300">
                    <Info className="w-4 h-4 text-blue-600 dark:text-[#2563EB]" />
                    Premissas de Rastreabilidade Operacional
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-[#94A3B8] leading-relaxed">
                    <li>O lote provém de veículo em fim de vida devidamente baixado junto ao Detran (VW Gol 1.0, placa de referência auditada).</li>
                    <li>As massas foram aferidas em balança rodoviária / de bancada calibrada conforme exigência do §5.2 do DM-ORB-001.</li>
                    <li>As evidências fiscais e operacionais (chave da NF-e e número do MTR SINIR) foram previamente homologadas no verificador de lastro.</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ABA 2: INSTRUÇÕES E EQUAÇÕES PASSO A PASSO (§6.3) */}
          <TabsContent value="instrucoes" className="space-y-6">
            <Card className="bg-white dark:bg-[#0E1A2E] border-slate-200 dark:border-slate-800 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-heading font-bold text-slate-900 dark:text-[#F8FAFC] flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-blue-600 dark:text-[#2563EB]" />
                  Protocolo de Recálculo Passo a Passo — DM-ORB-001 §6.3
                </CardTitle>
                <CardDescription className="text-xs text-slate-600 dark:text-[#94A3B8]">
                  Equações oficiais, fatores de referência de berço ao portão (cradle-to-gate) e regras de incerteza por quadratura.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 text-xs text-slate-700 dark:text-[#94A3B8]">
                {/* 1. Equação Central */}
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-[#111827] border border-slate-200 dark:border-slate-800 space-y-3">
                  <span className="font-heading font-bold text-sm text-slate-900 dark:text-[#F8FAFC] block">
                    1. Equação Central de Emissão Evitada por Componente (§6.3)
                  </span>
                  <div className="p-4 rounded-xl bg-white dark:bg-[#0A1628] border border-slate-200 dark:border-slate-800 font-mono text-sm sm:text-base text-blue-700 dark:text-blue-400 font-bold overflow-x-auto text-center">
                    Evitado (kgCO₂e) = Q × FE_ref × L_i × DF − PE
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-2">
                    <div>
                      <strong className="text-slate-900 dark:text-[#F8FAFC]">Q:</strong> Massa líquida do material no componente (kg).
                    </div>
                    <div>
                      <strong className="text-slate-900 dark:text-[#F8FAFC]">FE_ref:</strong> Fator de emissão da matéria-prima virgem substituída (kgCO₂e/kg).
                    </div>
                    <div>
                      <strong className="text-slate-900 dark:text-[#F8FAFC]">L_i:</strong> Fator de vida residual útil remanescente. Norma fixa <span className="font-mono font-bold text-slate-900 dark:text-[#F8FAFC]">L_i = 1,0</span> para peças testadas e aptas a reuso.
                    </div>
                    <div>
                      <strong className="text-slate-900 dark:text-[#F8FAFC]">DF:</strong> Fator de Desconto por degradação/processamento (§6.3.2). Norma fixa conservadoramente <span className="font-mono font-bold text-slate-900 dark:text-[#F8FAFC]">DF = 0,30</span> (ou seja, aproveitamento líquido de 30% da energia incorporada).
                    </div>
                    <div>
                      <strong className="text-slate-900 dark:text-[#F8FAFC]">PE:</strong> Penalidade de reprocessamento / emissões operacionais de desmontagem. No cenário padrão, <span className="font-mono font-bold text-slate-900 dark:text-[#F8FAFC]">PE = 0,00</span> kgCO₂e.
                    </div>
                  </div>
                </div>

                {/* 2. Tabela de Fatores de Referência */}
                <div className="space-y-3">
                  <span className="font-heading font-bold text-sm text-slate-900 dark:text-[#F8FAFC] block">
                    2. Fatores de Emissão de Referência Homologados (DM-ORB-001 Tabela 2)
                  </span>
                  <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-100/70 dark:bg-[#111827] font-mono text-[10px] uppercase">
                        <tr>
                          <th className="p-3">Material</th>
                          <th className="p-3 text-right">FE_ref (kgCO₂e/kg)</th>
                          <th className="p-3 text-right">Incerteza Paramétrica (u_i)</th>
                          <th className="p-3">Fonte Bibliográfica Oficial</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                        <tr>
                          <td className="p-3 font-semibold text-slate-900 dark:text-[#F8FAFC]">Aço automotivo estampado</td>
                          <td className="p-3 text-right font-mono font-bold text-blue-600 dark:text-blue-400">2,18</td>
                          <td className="p-3 text-right font-mono">± 3,5%</td>
                          <td className="p-3 text-slate-600 dark:text-[#94A3B8]">World Steel Association (2023) — Cradle-to-gate automotive steel</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-semibold text-slate-900 dark:text-[#F8FAFC]">Cobre eletrolítico / fios</td>
                          <td className="p-3 text-right font-mono font-bold text-blue-600 dark:text-blue-400">5,40</td>
                          <td className="p-3 text-right font-mono">± 4,0%</td>
                          <td className="p-3 text-slate-600 dark:text-[#94A3B8]">International Copper Association (ICA 2022) — Primary copper cathode</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-semibold text-slate-900 dark:text-[#F8FAFC]">Polímeros técnicos / plásticos</td>
                          <td className="p-3 text-right font-mono font-bold text-blue-600 dark:text-blue-400">1,90</td>
                          <td className="p-3 text-right font-mono">± 5,0%</td>
                          <td className="p-3 text-slate-600 dark:text-[#94A3B8]">PlasticsEurope (2022) — Eco-profile automotive polypropylene / ABS blend</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 3. Regra de Segregação de Claims (§8) */}
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-[#111827] border border-slate-200 dark:border-slate-800 space-y-3">
                  <span className="font-heading font-bold text-sm text-slate-900 dark:text-[#F8FAFC] block">
                    3. Regra de Segregação Regulatória: Claim Confirmado vs. Claim Potencial (§8)
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-white dark:bg-[#0A1628] border border-emerald-200 dark:border-emerald-900/40 space-y-2">
                      <div className="flex items-center gap-1.5 font-bold text-emerald-800 dark:text-emerald-400 text-xs">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-[#059669]" />
                        Claim Confirmado (Elegível a Atestado de Conformidade Orbis)
                      </div>
                      <p className="text-[11px] leading-relaxed">
                        Exige comprovação inequívoca de destinação final efetiva:
                        venda mediante NF-e com chave autorizada pela SEFAZ ou manifesto MTR no SINIR baixado pelo destinador final licenciado.
                        Apenas componentes nessa condição compõem o <strong>Total Confirmado</strong> do dossiê.
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-white dark:bg-[#0A1628] border border-amber-200 dark:border-amber-900/40 space-y-2">
                      <div className="flex items-center gap-1.5 font-bold text-amber-800 dark:text-amber-400 text-xs">
                        <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                        Claim Potencial (Em estoque / Não comprovado)
                      </div>
                      <p className="text-[11px] leading-relaxed">
                        Componentes desmontados e estocados sem documento fiscal de saída ou sem MTR permanecem em reserva técnica como <strong>Claim Potencial</strong>.
                        São estritamente <strong>proibidos</strong> de soma ao balanço auditado final para fins de SBCE/MOVER até a juntada da NF-e/MTR correspondente.
                      </p>
                    </div>
                  </div>
                </div>

                {/* 4. Propagação de Incerteza (§7) */}
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-[#111827] border border-slate-200 dark:border-slate-800 space-y-3">
                  <span className="font-heading font-bold text-sm text-slate-900 dark:text-[#F8FAFC] block">
                    4. Incerteza por Combinação em Quadratura (§7 - ISO 14064-1 e GUM)
                  </span>
                  <p className="leading-relaxed">
                    A incerteza absoluta combinada do lote (u_total) para grandezas independentes e somadas é calculada pela raiz quadrada da soma dos quadrados das incertezas absolutas de cada item confirmado:
                  </p>
                  <div className="p-3 rounded-xl bg-white dark:bg-[#0A1628] border border-slate-200 dark:border-slate-800 font-mono text-center text-slate-900 dark:text-[#F8FAFC]">
                    u_total = √( ∑ (u_i × Evitado_i)² )
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    A incerteza percentual do claim confirmado é dada por: <span className="font-mono font-bold">U_relativa (%) = (u_total / Total_Confirmado) × 100</span>.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ABA 3: TEXTO INTEGRAL DA METODOLOGIA DM-ORB-001 v1.1 */}
          <TabsContent value="metodologia" className="space-y-6">
            <Card className="bg-white dark:bg-[#0E1A2E] border-slate-200 dark:border-slate-800 shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-heading font-bold text-slate-900 dark:text-[#F8FAFC] flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-blue-600 dark:text-[#2563EB]" />
                      DM-ORB-001 v1.1 — Norma Integral Publicada
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-600 dark:text-[#94A3B8]">
                      Espelho exato do padrão metodológico publicado em /fatores e submetido aos órgãos de controle.
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="font-mono text-xs">
                    NORMA V1.1
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 text-xs text-slate-700 dark:text-[#94A3B8] leading-relaxed">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#111827] border border-slate-200 dark:border-slate-800 space-y-4">
                  <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-[#F8FAFC]">
                    1. Objetivo e Âmbito de Aplicação
                  </h3>
                  <p>
                    A norma DM-ORB-001 estabelece os critérios técnicos, a fronteira de inventário (cradle-to-gate) e a formulação matemática para a quantificação de emissões de gases de efeito estufa (GEE) evitadas pela recirculação de peças, componentes e matérias-primas críticas provenientes de veículos em fim de vida útil (VFV) em Centros de Desmanche Veicular (CDV) credenciados.
                  </p>

                  <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-[#F8FAFC] pt-2">
                    2. Princípio da Adicionalidade e Linha de Base
                  </h3>
                  <p>
                    A linha de base conservadora assume que o descarte irregular ou a destruição sem triagem técnica acarreta a demanda por nova matéria-prima virgem na cadeia de suprimentos automobilística. A recirculação com prova pericial de integridade mecânica desloca a extração e a fundição primária intensiva em energia.
                  </p>

                  <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-[#F8FAFC] pt-2">
                    3. Equação Geral de Cálculo (§6.3)
                  </h3>
                  <p>
                    Para cada componente ou material <span className="font-mono">i</span>, a emissão evitada é apurada por:
                  </p>
                  <pre className="p-3 rounded-lg bg-white dark:bg-[#0A1628] font-mono text-blue-600 dark:text-blue-400 border border-slate-200 dark:border-slate-800">
                    Evitado_i (kgCO₂e) = Q_i × FE_ref,i × L_i × DF_i − PE_i
                  </pre>
                  <p>
                    Onde <span className="font-mono">DF_i = 0,30</span> representa o fator de abatimento conservador (derating factor) que desconta perdas logísticas, dispersão e energia reativa; <span className="font-mono">L_i = 1,00</span> para itens periciados; e <span className="font-mono">PE_i = 0,00</span> salvo quando há remanufatura mecânica externa.
                  </p>

                  <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-[#F8FAFC] pt-2">
                    4. Critérios de Prova e Vedação de Dupla Contagem
                  </h3>
                  <p>
                    Em consonância com o Decreto Federal nº 11.413/2023, a Política Nacional de Resíduos Sólidos (Lei 12.305/2010) e a Lei 15.042/2024 (SBCE), nenhum crédito ou atestado pode ser expedido sobre lastro não apoiado em NF-e autorizada ou MTR validado. A expressão &quot;Selo Oficial&quot; é vedada institucionalmente, sendo exigida a denominação &quot;Atestado de Conformidade Orbis (com ART/RRT)&quot;.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ABA 4: FOLHA DE RESPOSTAS PARA O REVISOR (AUDITORIA CEGA) */}
          <TabsContent value="folha" className="space-y-6">
            <Card className="bg-white dark:bg-[#0E1A2E] border-slate-200 dark:border-slate-800 shadow-sm print:border-black">
              <CardHeader className="print:pb-2">
                <CardTitle className="text-lg font-heading font-bold text-slate-900 dark:text-[#F8FAFC] flex items-center gap-2">
                  <ClipboardPen className="w-5 h-5 text-blue-600 dark:text-[#2563EB]" />
                  Folha de Resposta e Julgamento Pericial
                </CardTitle>
                <CardDescription className="text-xs text-slate-600 dark:text-[#94A3B8]">
                  Espaço oficial para anotação dos cálculos independentes do revisor e verificação de conformidade.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 text-xs">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#111827] border border-slate-200 dark:border-slate-800 space-y-3 print:bg-white print:border-black">
                  <span className="font-heading font-bold text-slate-900 dark:text-[#F8FAFC] block">
                    Dados do Revisor Pericial Independente:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 print:grid-cols-3">
                    <div className="border-b border-slate-300 dark:border-slate-700 py-1 print:border-black">
                      <span className="text-[10px] text-slate-500 dark:text-[#94A3B8] block">Nome do Revisor / Perito:</span>
                      <span className="text-slate-400 dark:text-slate-600 italic">____________________________________</span>
                    </div>
                    <div className="border-b border-slate-300 dark:border-slate-700 py-1 print:border-black">
                      <span className="text-[10px] text-slate-500 dark:text-[#94A3B8] block">CREA / CAU / CRQ / Registro:</span>
                      <span className="text-slate-400 dark:text-slate-600 italic">____________________________________</span>
                    </div>
                    <div className="border-b border-slate-300 dark:border-slate-700 py-1 print:border-black">
                      <span className="text-[10px] text-slate-500 dark:text-[#94A3B8] block">Data da Auditoria:</span>
                      <span className="text-slate-400 dark:text-slate-600 italic">_____ / _____ / 202___</span>
                    </div>
                  </div>
                </div>

                {/* Grade de Apuração Independente */}
                <div className="space-y-2">
                  <span className="font-heading font-bold text-slate-900 dark:text-[#F8FAFC] block">
                    A. Apuração de Emissão Evitada por Peça (Auditoria Cega — Preenchimento Manual)
                  </span>
                  <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 print:border-black">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-100/70 dark:bg-[#111827] font-mono text-[10px] uppercase border-b border-slate-200 dark:border-slate-800 print:border-black print:bg-slate-100">
                        <tr>
                          <th className="p-2.5">Item</th>
                          <th className="p-2.5">Componente</th>
                          <th className="p-2.5 text-center">Massa (Q)</th>
                          <th className="p-2.5 text-center">FE_ref</th>
                          <th className="p-2.5 text-center">DF</th>
                          <th className="p-2.5 text-center bg-blue-50/50 dark:bg-blue-950/20 font-bold">Evitado Calculado (kgCO₂e)</th>
                          <th className="p-2.5 text-center">Status Claim</th>
                          <th className="p-2.5 text-center">Entra no Total Confirmado?</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800 print:divide-black">
                        <tr>
                          <td className="p-3 font-mono font-bold">#1</td>
                          <td className="p-3 font-semibold">Capô dianteiro (Aço)</td>
                          <td className="p-3 text-center font-mono">10,0 kg</td>
                          <td className="p-3 text-center font-mono">2,18</td>
                          <td className="p-3 text-center font-mono">0,30</td>
                          <td className="p-3 text-center bg-blue-50/50 dark:bg-blue-950/20 border-l border-r border-slate-200 dark:border-slate-800 print:border-black">
                            <span className="text-slate-400 dark:text-slate-600 font-mono"> [ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ] </span>
                          </td>
                          <td className="p-3 text-center">NF-e 1234</td>
                          <td className="p-3 text-center font-bold text-emerald-600 dark:text-[#059669]"> ( &nbsp; ) SIM &nbsp;&nbsp; ( &nbsp; ) NÃO </td>
                        </tr>
                        <tr>
                          <td className="p-3 font-mono font-bold">#2</td>
                          <td className="p-3 font-semibold">Alternador/Estator (Cobre)</td>
                          <td className="p-3 text-center font-mono">2,5 kg</td>
                          <td className="p-3 text-center font-mono">5,40</td>
                          <td className="p-3 text-center font-mono">0,30</td>
                          <td className="p-3 text-center bg-blue-50/50 dark:bg-blue-950/20 border-l border-r border-slate-200 dark:border-slate-800 print:border-black">
                            <span className="text-slate-400 dark:text-slate-600 font-mono"> [ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ] </span>
                          </td>
                          <td className="p-3 text-center">MTR 4410</td>
                          <td className="p-3 text-center font-bold text-emerald-600 dark:text-[#059669]"> ( &nbsp; ) SIM &nbsp;&nbsp; ( &nbsp; ) NÃO </td>
                        </tr>
                        <tr>
                          <td className="p-3 font-mono font-bold">#3</td>
                          <td className="p-3 font-semibold">Parachoque (Polímeros)</td>
                          <td className="p-3 text-center font-mono">4,0 kg</td>
                          <td className="p-3 text-center font-mono">1,90</td>
                          <td className="p-3 text-center font-mono">0,30</td>
                          <td className="p-3 text-center bg-blue-50/50 dark:bg-blue-950/20 border-l border-r border-slate-200 dark:border-slate-800 print:border-black">
                            <span className="text-slate-400 dark:text-slate-600 font-mono"> [ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ] </span>
                          </td>
                          <td className="p-3 text-center">Em estoque</td>
                          <td className="p-3 text-center font-bold text-amber-600"> ( &nbsp; ) SIM &nbsp;&nbsp; ( &nbsp; ) NÃO </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Totais e Incerteza */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#111827] border border-slate-200 dark:border-slate-800 space-y-3 print:bg-white print:border-black">
                    <span className="font-heading font-bold text-slate-900 dark:text-[#F8FAFC] block">
                      B. Balanço Consolidado do Revisor
                    </span>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center py-1 border-b border-slate-200 dark:border-slate-800 print:border-black">
                        <span>Total Evitado CONFIRMADO apurado:</span>
                        <span className="font-mono font-bold">________________ kgCO₂e</span>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b border-slate-200 dark:border-slate-800 print:border-black">
                        <span>Total Evitado POTENCIAL apurado:</span>
                        <span className="font-mono font-bold">________________ kgCO₂e</span>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b border-slate-200 dark:border-slate-800 print:border-black">
                        <span>Incerteza Combinada Relativa (± %):</span>
                        <span className="font-mono font-bold">________________ %</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#111827] border border-slate-200 dark:border-slate-800 space-y-3 print:bg-white print:border-black">
                    <span className="font-heading font-bold text-slate-900 dark:text-[#F8FAFC] block">
                      C. Parecer Pericial de Divergência
                    </span>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2">
                        <input type="checkbox" className="rounded" />
                        <span>Cálculos periciais convergem 100% com as equações do DM-ORB-001.</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="checkbox" className="rounded" />
                        <span>Identificada discrepância metodológica ou paramétrica (detalhar abaixo).</span>
                      </label>
                      <div className="pt-2">
                        <span className="text-[10px] text-slate-500 block">Observações do Revisor:</span>
                        <div className="h-16 border border-slate-300 dark:border-slate-700 rounded-lg p-2 print:border-black"></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Assinatura do Revisor */}
                <div className="mt-8 pt-8 border-t border-slate-300 dark:border-slate-700 text-center space-y-2 print:border-black">
                  <div className="max-w-xs mx-auto border-b border-slate-400 dark:border-slate-600 print:border-black pt-6"></div>
                  <p className="font-bold text-slate-800 dark:text-[#F8FAFC]">
                    Assinatura do Revisor Pericial Independente
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-[#94A3B8]">
                    Atestado de Conformidade Orbis (com ART/RRT vinculada)
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default RevisorExternoF6Page;
