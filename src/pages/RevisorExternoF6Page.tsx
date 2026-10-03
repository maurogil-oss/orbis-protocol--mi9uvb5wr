import React, { useState } from 'react'
import { Link } from 'react-router-dom'
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
  Lock,
  Eye,
  EyeOff,
  UserCheck,
  FileSignature,
  FileText,
  BadgeAlert,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { OrbisLogo, OrbisOfficialGlobe } from '@/components/OrbisLogo'

/**
 * PACOTE DO REVISOR EXTERNO — AUDITORIA DE REPRODUÇÃO F6
 * Metodologia: DM-ORB-001 v1.1 §6.3, §7
 *
 * ESTRUTURA DO DOSSIÊ:
 * 1. Capa + Instruções Cegas + Termo de Declaração de Independência Simples
 * 2. Dossiê do Revisor:
 *    (a) Texto metodológico (§6.3, arredondamentos, regra de claim potencial, regra de peça mista, incerteza em quadratura)
 *    (b) Tabela completa dos dados de entrada do lote Gol real (veículo, tara e fonte, peças, estado, destinação, evidência)
 *    (c) Tabela de fatores aplicáveis com citação completa de fonte
 *    (d) Espaço em branco para o revisor registrar o recálculo passo a passo e o valor final com incerteza
 * 3. Seção de Conferência (Rotulada "ABRIR SOMENTE APÓS CONCLUIR O RECÁLCULO" com trava/revelação)
 *    - Resultado esperado do lote (12,87 kgCO₂e ±2,64%, capô 6,54, alternador 4,05, parachoque 2,28 potencial)
 *    - Passo a passo de verificação e critério de aceite (tolerância zero até a segunda casa decimal, apenas arredondamento)
 * 4. Rodapé institucional com referência cruzada ao DM v1.1 em /fatores e ao verificador público de selos
 */

interface PecaEntradaLote {
  item: number
  sku: string
  descricao: string
  material: string
  massaKg: number
  estadoUso: string
  tier: 'Tier 1' | 'Tier 2' | 'Tier 3'
  statusDestinacao: string
  documentoSuporte: string
  classificacaoClaim: 'CONFIRMADO' | 'POTENCIAL'
}

const DADOS_ENTRADA_GOL: PecaEntradaLote[] = [
  {
    item: 1,
    sku: 'PART-GOL-CAPO-01',
    descricao: 'Capô dianteiro automotivo estampado',
    material: 'Aço automotivo (reaproveitamento)',
    massaKg: 10.0,
    estadoUso: 'Íntegro / reuso funcional imediato (L_i = 1,0)',
    tier: 'Tier 3',
    statusDestinacao: 'Destinada via NF-e (venda)',
    documentoSuporte: 'NF-e 1234 (venda de peça reusável com chave SEFAZ)',
    classificacaoClaim: 'CONFIRMADO',
  },
  {
    item: 2,
    sku: 'PART-GOL-ESTAT-01',
    descricao: 'Alternador / Estator com enrolamento de cobre eletrolítico',
    material: 'Cobre / chicotes elétricos',
    massaKg: 2.5,
    estadoUso: 'Rebobinável / desmontado para segregação nobre',
    tier: 'Tier 3',
    statusDestinacao: 'Destinada via MTR (reciclagem)',
    documentoSuporte: 'MTR 4410 (Manifesto de Transporte de Resíduos SINIR / Destinação)',
    classificacaoClaim: 'CONFIRMADO',
  },
  {
    item: 3,
    sku: 'PART-GOL-PARAC-01',
    descricao: 'Parachoque dianteiro termoplástico (PP/EPDM blend)',
    material: 'Polímeros automotivos / parachoque',
    massaKg: 4.0,
    estadoUso: 'Triado em pátio, armazenado em estoque',
    tier: 'Tier 2',
    statusDestinacao: 'Em estoque (sem destinação documental)',
    documentoSuporte: 'Controle de pátio interno (sem NF-e de venda ou MTR de saída)',
    classificacaoClaim: 'POTENCIAL',
  },
]

export function RevisorExternoF6Page() {
  const [copiado, setCopiado] = useState(false)
  const [secaoConferenciaAberta, setSecaoConferenciaAberta] = useState(false)
  const [declaracaoCiente, setDeclaracaoCiente] = useState(false)

  const handlePrint = () => {
    window.print()
  }

  const copiarLink = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  return (
    <div className="revisor-f6-root min-h-screen py-6 md:py-12 bg-slate-50 dark:bg-[#0A1628] text-slate-900 dark:text-[#F8FAFC] transition-colors print:bg-white print:text-black print:py-2">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-8 print:space-y-4">
        {/* ============================================================== */}
        {/* BARRA SUPERIOR DE AÇÕES (Oculta na impressão) */}
        {/* ============================================================== */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-slate-800 shadow-sm print:hidden">
          <div className="flex items-center gap-3">
            <OrbisOfficialGlobe size={32} />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-heading font-bold text-sm tracking-tight text-slate-900 dark:text-[#F8FAFC]">
                  Orbis Protocol — Pacote do Revisor Externo
                </span>
                <Badge
                  variant="outline"
                  className="text-[10px] uppercase font-mono border-blue-300 dark:border-blue-800 text-blue-700 dark:text-blue-400"
                >
                  Auditoria F6
                </Badge>
              </div>
              <p className="text-xs text-slate-500 dark:text-[#94A3B8]">
                Procedimento cego de reprodução pericial independente (DM-ORB-001 v1.1 §6.3 / §7)
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
              {copiado ? (
                <Check className="w-3.5 h-3.5 mr-1 text-emerald-600 dark:text-[#059669]" />
              ) : (
                <Copy className="w-3.5 h-3.5 mr-1" />
              )}
              {copiado ? 'Link Copiado' : 'Copiar Link Direto'}
            </Button>
            <Button
              onClick={handlePrint}
              size="sm"
              className="text-xs h-9 bg-emerald-600 hover:bg-emerald-700 dark:bg-[#059669] dark:hover:bg-emerald-600 text-white font-semibold shadow-sm"
            >
              <Printer className="w-3.5 h-3.5 mr-1.5" />
              Imprimir / Salvar PDF
            </Button>
          </div>
        </div>

        {/* ============================================================== */}
        {/* PARTE 1: CAPA + INSTRUÇÕES CEGAS + DECLARAÇÃO DE INDEPENDÊNCIA */}
        {/* ============================================================== */}
        <div className="p-6 sm:p-10 rounded-3xl bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-slate-800 shadow-sm print:border-black print:p-4 space-y-6">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800 print:border-black">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-[#111827] border border-blue-200 dark:border-blue-900/40 text-blue-700 dark:text-blue-400 text-xs font-mono font-bold">
                <FileCheck2 className="w-3.5 h-3.5" />
                DM-ORB-001 v1.1 • PACOTE DE AUDITORIA DE REPRODUÇÃO EXTERNA (F6)
              </div>
              <h1 className="text-2xl sm:text-4xl font-heading font-black text-slate-900 dark:text-[#F8FAFC] tracking-tight">
                Dossiê do Revisor Pericial Independente
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-[#94A3B8] max-w-3xl leading-relaxed">
                Instrumento formal emitido pela Orbis Protocol para envio a revisores humanos,
                peritos judiciais, engenheiros habilitados (CREA/CFT) e organismos de verificação de
                terceira parte (VVB/Tecpar). Destinado à conferência analítica da quantificação de
                emissões evitadas e incerteza associada.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-[#111827] border border-amber-200 dark:border-amber-900/40 text-xs space-y-2 shrink-0 max-w-sm">
              <div className="flex items-center gap-1.5 font-bold text-amber-800 dark:text-amber-400">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                Protocolo de Auditoria Cega
              </div>
              <p className="text-[11px] text-amber-900 dark:text-amber-300 leading-snug">
                <strong>INSTRUÇÃO CEGA MANDATÓRIA:</strong> O revisor deve conduzir seu recálculo
                utilizando exclusivamente os dados de entrada (§2) e a metodologia prescritiva
                (§2a), respondendo o valor encontrado na Folha de Resposta <strong>ANTES</strong> de
                consultar a Seção 3 (Conferência). É estritamente vedado abrir a seção de
                conferência antes de finalizar a apuração independente.
              </p>
            </div>
          </div>

          {/* Metadados Técnicos do Pacote */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono pt-2">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#111827] border border-slate-200 dark:border-slate-800">
              <span className="text-slate-500 dark:text-[#94A3B8] block text-[10px] uppercase">
                Metodologia Vigente
              </span>
              <span className="font-bold text-slate-900 dark:text-[#F8FAFC] text-sm">
                DM-ORB-001 v1.1
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#111827] border border-slate-200 dark:border-slate-800">
              <span className="text-slate-500 dark:text-[#94A3B8] block text-[10px] uppercase">
                Lote Piloto Auditado
              </span>
              <span className="font-bold text-slate-900 dark:text-[#F8FAFC] text-sm">
                VW Gol 1.6 (3 peças)
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#111827] border border-slate-200 dark:border-slate-800">
              <span className="text-slate-500 dark:text-[#94A3B8] block text-[10px] uppercase">
                Data de Emissão
              </span>
              <span className="font-bold text-slate-900 dark:text-[#F8FAFC] text-sm">
                Março de 2026
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#111827] border border-slate-200 dark:border-slate-800">
              <span className="text-slate-500 dark:text-[#94A3B8] block text-[10px] uppercase">
                Enquadramento Legal
              </span>
              <span className="font-bold text-slate-900 dark:text-[#F8FAFC] text-sm">
                SBCE / MOVER / PNRS
              </span>
            </div>
          </div>

          {/* Termo de Declaração de Independência do Revisor */}
          <div className="p-5 sm:p-6 rounded-2xl bg-slate-50 dark:bg-[#111827] border border-slate-200 dark:border-slate-800 space-y-4 print:bg-white print:border-black">
            <div className="flex items-center gap-2 text-slate-900 dark:text-[#F8FAFC] font-heading font-bold text-sm">
              <UserCheck className="w-4 h-4 text-emerald-600 dark:text-[#059669]" />
              Termo de Declaração de Independência e Ausência de Acesso Prévio
            </div>
            <p className="text-xs text-slate-600 dark:text-[#94A3B8] leading-relaxed">
              O revisor abaixo assinado declara, sob as penas da lei e do código de ética de seu
              respectivo conselho profissional, que: (1) não teve acesso prévio ao código-fonte do
              motor de cálculo da plataforma (
              <code className="font-mono text-slate-800 dark:text-slate-200">cdvEngineV2.ts</code>);
              (2) não consultou a Seção 3 deste dossiê antes de concluir de forma autônoma o
              recálculo dos valores evitados por peça e consolidado; (3) conduziu sua apuração com
              estrita independência funcional e técnica; e (4) não possui conflito de interesses
              societário, comercial ou familiar com o CDV doador ou com a desenvolvedora da
              plataforma Orbis Protocol.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2 print:grid-cols-4 text-xs font-mono">
              <div className="p-2.5 rounded-lg bg-white dark:bg-[#0A1628] border border-slate-200 dark:border-slate-800 print:border-black">
                <span className="text-[10px] text-slate-500 dark:text-[#94A3B8] block">
                  Nome Completo do Revisor:
                </span>
                <span className="text-slate-400 dark:text-slate-600 italic block mt-1">
                  ___________________________
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-white dark:bg-[#0A1628] border border-slate-200 dark:border-slate-800 print:border-black">
                <span className="text-[10px] text-slate-500 dark:text-[#94A3B8] block">
                  Vínculo Institucional / Empresa:
                </span>
                <span className="text-slate-400 dark:text-slate-600 italic block mt-1">
                  ___________________________
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-white dark:bg-[#0A1628] border border-slate-200 dark:border-slate-800 print:border-black">
                <span className="text-[10px] text-slate-500 dark:text-[#94A3B8] block">
                  Registro de Classe (CREA/CFT/CRQ):
                </span>
                <span className="text-slate-400 dark:text-slate-600 italic block mt-1">
                  ___________________________
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-white dark:bg-[#0A1628] border border-slate-200 dark:border-slate-800 print:border-black">
                <span className="text-[10px] text-slate-500 dark:text-[#94A3B8] block">
                  Data da Assinatura:
                </span>
                <span className="text-slate-400 dark:text-slate-600 italic block mt-1">
                  ____ / ____ / 202___
                </span>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-200 dark:border-slate-800 print:border-black text-xs">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="termo-independencia-check"
                  checked={declaracaoCiente}
                  onChange={(e) => setDeclaracaoCiente(e.target.checked)}
                  className="rounded border-slate-300 dark:border-slate-700 text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                />
                <label
                  htmlFor="termo-independencia-check"
                  className="text-slate-700 dark:text-[#F8FAFC] font-medium cursor-pointer select-none text-[11px] sm:text-xs"
                >
                  Confirmo que recebi este pacote para auditoria cega e declaro ausência de acesso
                  ao resultado esperado antes do recálculo.
                </label>
              </div>
              <div className="text-slate-500 dark:text-[#94A3B8] text-[11px] font-mono print:hidden">
                Status:{' '}
                {declaracaoCiente ? (
                  <span className="text-emerald-600 dark:text-[#059669] font-bold">
                    Termo Aceito
                  </span>
                ) : (
                  <span className="text-amber-600">Pendente de assinatura</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* PARTE 2: DOSSIÊ DO REVISOR (ABAS/SEÇÕES METODOLOGIA + ENTRADA + FOLHA) */}
        {/* ============================================================== */}
        <div className="space-y-6">
          <Tabs defaultValue="dados-entrada" className="w-full space-y-6">
            <TabsList className="grid grid-cols-2 md:grid-cols-4 w-full bg-slate-200/70 dark:bg-[#0E1A2E] p-1 rounded-2xl border border-slate-200 dark:border-slate-800 print:hidden">
              <TabsTrigger
                value="dados-entrada"
                className="text-xs font-semibold py-2.5 rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-[#111827] data-[state=active]:text-emerald-600 dark:data-[state=active]:text-[#059669]"
              >
                1. Dados de Entrada (Lote Gol)
              </TabsTrigger>
              <TabsTrigger
                value="metodologia-regras"
                className="text-xs font-semibold py-2.5 rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-[#111827] data-[state=active]:text-emerald-600 dark:data-[state=active]:text-[#059669]"
              >
                2. Metodologia & Fórmulas (§6.3)
              </TabsTrigger>
              <TabsTrigger
                value="fatores-fontes"
                className="text-xs font-semibold py-2.5 rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-[#111827] data-[state=active]:text-emerald-600 dark:data-[state=active]:text-[#059669]"
              >
                3. Catálogo de Fatores Oficiais
              </TabsTrigger>
              <TabsTrigger
                value="folha-respostas"
                className="text-xs font-semibold py-2.5 rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-[#111827] data-[state=active]:text-emerald-600 dark:data-[state=active]:text-[#059669]"
              >
                4. Folha de Resposta do Revisor
              </TabsTrigger>
            </TabsList>

            {/* SUB-ABA 1: DADOS DE ENTRADA DO LOTE GOL */}
            <TabsContent value="dados-entrada" className="space-y-6">
              <Card className="bg-white dark:bg-[#0E1A2E] border-slate-200 dark:border-slate-800 shadow-sm">
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <CardTitle className="text-lg font-heading font-bold text-slate-900 dark:text-[#F8FAFC] flex items-center gap-2">
                        <Car className="w-5 h-5 text-emerald-600 dark:text-[#059669]" />
                        Tabela de Dados Brutos de Entrada — Lote Gol Real
                      </CardTitle>
                      <CardDescription className="text-xs text-slate-600 dark:text-[#94A3B8]">
                        Identificação física do veículo desmontado, credenciamento do
                        estabelecimento e componentes elegíveis.
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="font-mono text-xs w-fit">
                      ID: LOTE-AUDIT-GOL-REAL-01
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Bloco de Dados do Veículo e CDV */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-[#111827] border border-slate-200 dark:border-slate-800 text-xs">
                    <div>
                      <span className="text-slate-500 dark:text-[#94A3B8] block text-[10px] font-mono uppercase">
                        CDV Titular
                      </span>
                      <strong className="text-slate-900 dark:text-[#F8FAFC]">
                        CDVerde Centro de Desmontagem Veicular
                      </strong>
                      <span className="text-[11px] text-slate-500 block font-mono">
                        CNPJ: 76.123.456/0001-00
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-[#94A3B8] block text-[10px] font-mono uppercase">
                        Veículo Doador
                      </span>
                      <strong className="text-slate-900 dark:text-[#F8FAFC]">
                        Volkswagen Gol 1.6 8V Total Flex
                      </strong>
                      <span className="text-[11px] text-slate-500 block font-mono">
                        Ano/Mod: 2012 / Renavam: Auditado
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-[#94A3B8] block text-[10px] font-mono uppercase">
                        Baixa DETRAN Homologada
                      </span>
                      <strong className="text-slate-900 dark:text-[#F8FAFC] font-mono">
                        PR-BX-2026-991204
                      </strong>
                      <span className="text-[11px] text-emerald-600 dark:text-[#059669] block font-mono">
                        Status: Baixa Definitiva VFV
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-[#94A3B8] block text-[10px] font-mono uppercase">
                        Tara e Fonte de Pesagem
                      </span>
                      <strong className="text-slate-900 dark:text-[#F8FAFC] font-mono">
                        Balança Calibrada (Aferida)
                      </strong>
                      <span className="text-[11px] text-blue-600 dark:text-blue-400 block font-mono">
                        u_massa = ±1,0% (0,01)
                      </span>
                    </div>
                  </div>

                  {/* Tabela de Componentes */}
                  <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-100/70 dark:bg-[#111827] text-slate-600 dark:text-[#94A3B8] font-mono uppercase text-[10px] border-b border-slate-200 dark:border-slate-800">
                        <tr>
                          <th className="p-3">Item / SKU</th>
                          <th className="p-3">Descrição da Peça</th>
                          <th className="p-3">Material Predominante</th>
                          <th className="p-3 text-right">Massa (Q)</th>
                          <th className="p-3">Estado / L_i</th>
                          <th className="p-3">Tier</th>
                          <th className="p-3">Status de Destinação</th>
                          <th className="p-3">Evidência Documental</th>
                          <th className="p-3">Classificação do Claim</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                        {DADOS_ENTRADA_GOL.map((peca) => (
                          <tr
                            key={peca.item}
                            className="hover:bg-slate-50 dark:hover:bg-[#111827]/60 transition-colors"
                          >
                            <td className="p-3 font-mono">
                              <span className="font-bold text-slate-900 dark:text-[#F8FAFC]">
                                #{peca.item}
                              </span>
                              <span className="block text-[10px] text-slate-500">{peca.sku}</span>
                            </td>
                            <td className="p-3 font-semibold text-slate-900 dark:text-[#F8FAFC]">
                              {peca.descricao}
                            </td>
                            <td className="p-3 text-slate-700 dark:text-slate-300">
                              {peca.material}
                            </td>
                            <td className="p-3 text-right font-mono font-bold text-emerald-600 dark:text-[#059669]">
                              {peca.massaKg.toFixed(2)} kg
                            </td>
                            <td className="p-3 text-[11px] text-slate-600 dark:text-[#94A3B8]">
                              {peca.estadoUso}
                            </td>
                            <td className="p-3 font-mono font-bold text-blue-600 dark:text-blue-400">
                              {peca.tier}
                            </td>
                            <td className="p-3">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${
                                  peca.statusDestinacao.includes('NF-e') ||
                                  peca.statusDestinacao.includes('MTR')
                                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50'
                                    : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50'
                                }`}
                              >
                                {peca.statusDestinacao}
                              </span>
                            </td>
                            <td className="p-3 font-mono text-[11px] text-slate-600 dark:text-[#94A3B8]">
                              {peca.documentoSuporte}
                            </td>
                            <td className="p-3">
                              <Badge
                                className={
                                  peca.classificacaoClaim === 'CONFIRMADO'
                                    ? 'bg-emerald-600 text-white dark:bg-[#059669]'
                                    : 'bg-amber-600 text-white dark:bg-amber-600'
                                }
                              >
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
                      Condições de Fronteira e Parâmetros Específicos do Lote
                    </div>
                    <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-[#94A3B8] leading-relaxed">
                      <li>
                        <strong>Fator de Desconto por Deslocamento (DF):</strong> Fixado em{' '}
                        <strong>0,30</strong> (30% de reconhecimento de benefício sobre material
                        primário virgem substituído), conforme metodologia conservadora VMR0007.
                      </li>
                      <li>
                        <strong>Fator de Vida Útil Residual (L_i):</strong> Fixado em{' '}
                        <strong>1,0</strong> para peças aprovadas em checklist pericial de
                        desmontagem.
                      </li>
                      <li>
                        <strong>Emissões do Projeto (PE_lote):</strong> Lote piloto não declarou
                        consumo pontual com rateio de energia do CDV nesta competência, sendo
                        adotado <strong>PE = 0,00 kgCO₂e</strong>.
                      </li>
                      <li>
                        <strong>Fluido Refrigerante (R-134a):</strong> Não computado neste lote de 3
                        peças mecânicas (evitado de fluido nulo, subestimado por conservadorismo).
                      </li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* SUB-ABA 2: TEXTO METODOLÓGICO & FÓRMULAS (§6.3) */}
            <TabsContent value="metodologia-regras" className="space-y-6">
              <Card className="bg-white dark:bg-[#0E1A2E] border-slate-200 dark:border-slate-800 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-heading font-bold text-slate-900 dark:text-[#F8FAFC] flex items-center gap-2">
                    <Calculator className="w-5 h-5 text-emerald-600 dark:text-[#059669]" />
                    Formulações Prescritivas da Metodologia DM-ORB-001 v1.1 (§6.3 e §7)
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-600 dark:text-[#94A3B8]">
                    Todas as equações, regras de arredondamento assimétrico, regras de segregação de
                    claim e fórmulas de incerteza por quadratura.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 text-xs text-slate-700 dark:text-[#94A3B8]">
                  {/* 1. Equação Central */}
                  <div className="p-5 rounded-2xl bg-slate-50 dark:bg-[#111827] border border-slate-200 dark:border-slate-800 space-y-3">
                    <span className="font-heading font-bold text-sm text-slate-900 dark:text-[#F8FAFC] block">
                      1. Equação Central de Emissão Evitada por Peça (§6.3)
                    </span>
                    <div className="p-4 rounded-xl bg-white dark:bg-[#0A1628] border border-slate-200 dark:border-slate-800 font-mono text-sm sm:text-base text-emerald-700 dark:text-[#059669] font-bold overflow-x-auto text-center">
                      Evitado_líquido_peça = floor( (Q × FE_ref × L_i × DF) − PE_peça )
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs pt-2">
                      <div className="p-2.5 rounded-lg bg-white dark:bg-[#0A1628] border border-slate-200 dark:border-slate-800">
                        <strong className="text-slate-900 dark:text-[#F8FAFC]">Q:</strong> Massa
                        líquida do material na peça (kg).
                      </div>
                      <div className="p-2.5 rounded-lg bg-white dark:bg-[#0A1628] border border-slate-200 dark:border-slate-800">
                        <strong className="text-slate-900 dark:text-[#F8FAFC]">FE_ref:</strong>{' '}
                        Fator de emissão berço-ao-portão do insumo virgem (kgCO₂e/kg).
                      </div>
                      <div className="p-2.5 rounded-lg bg-white dark:bg-[#0A1628] border border-slate-200 dark:border-slate-800">
                        <strong className="text-slate-900 dark:text-[#F8FAFC]">L_i:</strong> Fator
                        de vida útil restante (1,0 para peças íntegras reusáveis).
                      </div>
                      <div className="p-2.5 rounded-lg bg-white dark:bg-[#0A1628] border border-slate-200 dark:border-slate-800">
                        <strong className="text-slate-900 dark:text-[#F8FAFC]">DF:</strong> Fator de
                        deslocamento conservador (DF = 0,30 VMR0007).
                      </div>
                      <div className="p-2.5 rounded-lg bg-white dark:bg-[#0A1628] border border-slate-200 dark:border-slate-800">
                        <strong className="text-slate-900 dark:text-[#F8FAFC]">PE_peça:</strong>{' '}
                        Emissões do projeto alocadas (ceil2 nas deduções).
                      </div>
                      <div className="p-2.5 rounded-lg bg-white dark:bg-[#0A1628] border border-slate-200 dark:border-slate-800">
                        <strong className="text-slate-900 dark:text-[#F8FAFC]">floor(...):</strong>{' '}
                        Arredondamento para baixo em 2 casas decimais.
                      </div>
                    </div>
                  </div>

                  {/* 2. Regras de Arredondamento Assimétrico */}
                  <div className="p-5 rounded-2xl bg-slate-50 dark:bg-[#111827] border border-slate-200 dark:border-slate-800 space-y-3">
                    <span className="font-heading font-bold text-sm text-slate-900 dark:text-[#F8FAFC] block">
                      2. Regras de Arredondamento Assimétrico e Conservador (§7)
                    </span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-3.5 rounded-xl bg-white dark:bg-[#0A1628] border border-emerald-200 dark:border-emerald-900/40 space-y-1">
                        <strong className="text-emerald-700 dark:text-[#059669] font-mono text-xs block">
                          FLOOR em 2 casas decimais no EVITADO:
                        </strong>
                        <p className="text-[11px] leading-relaxed">
                          <code className="font-mono">Math.floor(x * 100) / 100</code> — Emissões
                          evitadas nunca são truncadas ou arredondadas para cima, impedindo inflação
                          indevida de benefícios climáticos.
                        </p>
                      </div>
                      <div className="p-3.5 rounded-xl bg-white dark:bg-[#0A1628] border border-rose-200 dark:border-rose-900/40 space-y-1">
                        <strong className="text-rose-700 dark:text-rose-400 font-mono text-xs block">
                          CEIL em 2 casas decimais nas EMISSÕES DE PROJETO (PE):
                        </strong>
                        <p className="text-[11px] leading-relaxed">
                          <code className="font-mono">Math.ceil(x * 100) / 100</code> — Custos de
                          energia, diesel e desmontagem são sempre majorados para cima, garantindo
                          deduções máximas de projeto.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 3. Regra de Destinação e Segregação de Claim */}
                  <div className="p-5 rounded-2xl bg-slate-50 dark:bg-[#111827] border border-slate-200 dark:border-slate-800 space-y-3">
                    <span className="font-heading font-bold text-sm text-slate-900 dark:text-[#F8FAFC] block">
                      3. Regra Mandatória de Destinação: Claim Confirmado vs. Claim Potencial (§0.3
                      e §8)
                    </span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 rounded-xl bg-white dark:bg-[#0A1628] border border-emerald-200 dark:border-emerald-900/40 space-y-2">
                        <div className="flex items-center gap-1.5 font-bold text-emerald-800 dark:text-emerald-400 text-xs">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-[#059669]" />
                          Claim Confirmado (Comprova Destinação Efetiva)
                        </div>
                        <p className="text-[11px] leading-relaxed">
                          Apenas peças com NF-e de venda autorizada na SEFAZ ou manifesto MTR no
                          SINIR baixado compõem o <strong>Total Evitado Confirmado</strong>. Somente
                          esse valor pode compor lastro para Atestado de Conformidade Orbis.
                        </p>
                      </div>
                      <div className="p-4 rounded-xl bg-white dark:bg-[#0A1628] border border-amber-200 dark:border-amber-900/40 space-y-2">
                        <div className="flex items-center gap-1.5 font-bold text-amber-800 dark:text-amber-400 text-xs">
                          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                          Claim Potencial (Peça sem destinação / Em estoque)
                        </div>
                        <p className="text-[11px] leading-relaxed">
                          Peças desmontadas sem documento fiscal de saída permanecem estritamente
                          como <strong>Claim Potencial</strong>. É terminantemente{' '}
                          <strong>proibido somar peças potenciais ao claim confirmado</strong> para
                          fins de SBCE/MOVER.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 4. Regra de Peça Mista e Incerteza por Quadratura */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-5 rounded-2xl bg-slate-50 dark:bg-[#111827] border border-slate-200 dark:border-slate-800 space-y-2">
                      <span className="font-heading font-bold text-sm text-slate-900 dark:text-[#F8FAFC] block">
                        4. Regra de Peça Mista sem Decomposição (§5.1 e §2.5d)
                      </span>
                      <p className="text-[11px] leading-relaxed">
                        Quando uma peça é composta por mais de um material e não possui laudo
                        analítico de proporção, adota-se obrigatoriamente o fator do{' '}
                        <strong>material de menor fator de emissão (mais conservador)</strong> entre
                        todos os possíveis para a massa integral da peça.
                      </p>
                    </div>

                    <div className="p-5 rounded-2xl bg-slate-50 dark:bg-[#111827] border border-slate-200 dark:border-slate-800 space-y-2">
                      <span className="font-heading font-bold text-sm text-slate-900 dark:text-[#F8FAFC] block">
                        5. Incerteza do Lote por Quadratura (§7 - ISO/IEC 98-3 / GUM)
                      </span>
                      <div className="p-2.5 rounded-lg bg-white dark:bg-[#0A1628] font-mono text-[11px] text-center border border-slate-200 dark:border-slate-800">
                        Incerteza_lote (kg) = √ [ ∑ (E_peça × u_FE)² + (E_lote × u_massa)² ]
                      </div>
                      <p className="text-[11px] leading-relaxed">
                        Onde <code className="font-mono">u_massa = 0,01 (1,0%)</code> para balança
                        calibrada e{' '}
                        <code className="font-mono">
                          Incerteza_relativa (%) = (Incerteza_kg / E_lote) × 100
                        </code>
                        , arredondada em 2 casas normais (<code className="font-mono">round2</code>
                        ).
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* SUB-ABA 3: TABELA DE FATORES APLICÁVEIS E FONTES COMPLETAS */}
            <TabsContent value="fatores-fontes" className="space-y-6">
              <Card className="bg-white dark:bg-[#0E1A2E] border-slate-200 dark:border-slate-800 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-heading font-bold text-slate-900 dark:text-[#F8FAFC] flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-emerald-600 dark:text-[#059669]" />
                    Catálogo de Fatores Oficiais Homologados no Lote Gol (DM-ORB-001 Apêndice B)
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-600 dark:text-[#94A3B8]">
                    Citação formal completa das fontes internacionais e nacionais reconhecidas com
                    seus respectivos tiers e incertezas paramétricas.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-100/70 dark:bg-[#111827] text-slate-600 dark:text-[#94A3B8] font-mono uppercase text-[10px] border-b border-slate-200 dark:border-slate-800">
                        <tr>
                          <th className="p-3">Material de Referência</th>
                          <th className="p-3 text-right">FE_ref (kgCO₂e/kg)</th>
                          <th className="p-3 text-right">Incerteza (u_FE)</th>
                          <th className="p-3">Tier</th>
                          <th className="p-3">Citação Completa de Fonte e Norma</th>
                          <th className="p-3">Status no Catálogo</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                        <tr>
                          <td className="p-3 font-semibold text-slate-900 dark:text-[#F8FAFC]">
                            Aço automotivo estampado / chapas
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-emerald-600 dark:text-[#059669]">
                            2,18
                          </td>
                          <td className="p-3 text-right font-mono text-slate-700 dark:text-slate-300">
                            ± 3,5% (0,035)
                          </td>
                          <td className="p-3 font-mono font-bold text-blue-600">Tier 3</td>
                          <td className="p-3 text-slate-600 dark:text-[#94A3B8] text-[11px]">
                            worldsteel Association, &quot;Sustainability Indicators Report
                            2025&quot; (Indicador 1a GHG emissions intensity 2024 = 2,18 tCO₂e/t aço
                            bruto; média ponderada global BF-BOF, scrap-EAF e DRI-EAF; Escopos 1, 2
                            e 3 Categoria 1). Ajustado conservadoramente de 2,85 para 2,18.
                          </td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                              Homologado worldsteel
                            </span>
                          </td>
                        </tr>
                        <tr>
                          <td className="p-3 font-semibold text-slate-900 dark:text-[#F8FAFC]">
                            Cobre eletrolítico / fios e bobinas
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-emerald-600 dark:text-[#059669]">
                            5,40
                          </td>
                          <td className="p-3 text-right font-mono text-slate-700 dark:text-slate-300">
                            ± 4,5% (0,045)
                          </td>
                          <td className="p-3 font-mono font-bold text-blue-600">Tier 3</td>
                          <td className="p-3 text-slate-600 dark:text-[#94A3B8] text-[11px]">
                            CopperMark &quot;Decarbonizing the Copper Sector&quot; (2024, base
                            International Copper Association - ICA, rota pirometalúrgica de catodo
                            de cobre berço-ao-portão 5,3 tCO₂e/t + margem conservadora de refino e
                            trefilação elétrica = 5,40 kgCO₂e/kg).
                          </td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                              Homologado CopperMark/ICA
                            </span>
                          </td>
                        </tr>
                        <tr>
                          <td className="p-3 font-semibold text-slate-900 dark:text-[#F8FAFC]">
                            Polímeros automotivos (PP / ABS / EPDM)
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-emerald-600 dark:text-[#059669]">
                            1,90
                          </td>
                          <td className="p-3 text-right font-mono text-slate-700 dark:text-slate-300">
                            ± 5,0% (0,050)
                          </td>
                          <td className="p-3 font-mono font-bold text-blue-600">Tier 2</td>
                          <td className="p-3 text-slate-600 dark:text-[#94A3B8] text-[11px]">
                            PlasticsEurope Eco-profiles (PCR ISO 14025, declared unit 1 kg resina at
                            gate). Faixa da literatura 1,91 a 5,70 kgCO₂e/kg; adota-se o piso
                            inferior mais conservador (1,90 kgCO₂e/kg para polipropileno virgem).
                          </td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                              Homologado PlasticsEurope
                            </span>
                          </td>
                        </tr>
                        <tr>
                          <td className="p-3 font-semibold text-slate-900 dark:text-[#F8FAFC]">
                            Alumínio primário (Fallback Global)
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-emerald-600 dark:text-[#059669]">
                            14,40
                          </td>
                          <td className="p-3 text-right font-mono text-slate-700 dark:text-slate-300">
                            ± 4,0% (0,040)
                          </td>
                          <td className="p-3 font-mono font-bold text-blue-600">Tier 3</td>
                          <td className="p-3 text-slate-600 dark:text-[#94A3B8] text-[11px]">
                            International Aluminium Institute (IAI 2024) — Primary Aluminium GHG
                            Intensity (14,4 tCO₂e/t Al berço-ao-portão). Nota: Não presente no lote
                            Gol de 3 peças, mantido aqui como referência do catálogo vigente.
                          </td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                              Referência Catálogo
                            </span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <p className="text-[11px] text-slate-500 dark:text-[#94A3B8] leading-relaxed">
                    * Todos os fatores aplicados contam com snapshot criptográfico imutável gravado
                    no laudo. Alterações futuras no catálogo possuem vigência estritamente
                    prospectiva, jamais recalculando retroativamente lotes emitidos no passado (§10
                    DM-ORB-001).
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            {/* SUB-ABA 4: FOLHA DE RESPOSTA DO REVISOR (ESPAÇO EM BRANCO) */}
            <TabsContent value="folha-respostas" className="space-y-6">
              <Card className="bg-white dark:bg-[#0E1A2E] border-slate-200 dark:border-slate-800 shadow-sm print:border-black">
                <CardHeader>
                  <CardTitle className="text-lg font-heading font-bold text-slate-900 dark:text-[#F8FAFC] flex items-center gap-2">
                    <ClipboardPen className="w-5 h-5 text-emerald-600 dark:text-[#059669]" />
                    Folha de Resposta e Memória de Recálculo do Revisor Independente
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-600 dark:text-[#94A3B8]">
                    Espaço reservado para o revisor registrar passo a passo suas contas, os
                    subtotais por peça e o consolidado antes de confrontar com a Seção 3.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 text-xs">
                  {/* Tabela de Preenchimento Peça a Peça */}
                  <div className="space-y-2">
                    <span className="font-heading font-bold text-slate-900 dark:text-[#F8FAFC] block">
                      A. Apuração Passo a Passo por Componente (Preenchimento Manual do Revisor)
                    </span>
                    <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 print:border-black">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-slate-100/70 dark:bg-[#111827] font-mono text-[10px] uppercase border-b border-slate-200 dark:border-slate-800 print:bg-slate-100 print:border-black">
                          <tr>
                            <th className="p-3">Item</th>
                            <th className="p-3">Componente / Material</th>
                            <th className="p-3 text-center">Massa (Q)</th>
                            <th className="p-3 text-center">FE_ref</th>
                            <th className="p-3 text-center">DF</th>
                            <th className="p-3 text-center bg-blue-50/50 dark:bg-blue-950/20 font-bold border-l border-r border-slate-200 dark:border-slate-800 print:border-black">
                              Evitado Apurado (kgCO₂e)
                            </th>
                            <th className="p-3 text-center">Destinação</th>
                            <th className="p-3 text-center">Soma no Total Confirmado?</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800 print:divide-black">
                          <tr>
                            <td className="p-3 font-mono font-bold">#1</td>
                            <td className="p-3 font-semibold">Capô dianteiro (Aço 2,18)</td>
                            <td className="p-3 text-center font-mono">10,0 kg</td>
                            <td className="p-3 text-center font-mono">2,18</td>
                            <td className="p-3 text-center font-mono">0,30</td>
                            <td className="p-3 text-center bg-blue-50/40 dark:bg-blue-950/20 font-mono border-l border-r border-slate-200 dark:border-slate-800 print:border-black">
                              <span className="text-slate-400 dark:text-slate-600">
                                [
                                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                                ]
                              </span>
                            </td>
                            <td className="p-3 text-center font-mono text-[11px]">NF-e 1234</td>
                            <td className="p-3 text-center font-bold text-emerald-600 dark:text-[#059669]">
                              ( &nbsp; ) SIM &nbsp;&nbsp; ( &nbsp; ) NÃO
                            </td>
                          </tr>
                          <tr>
                            <td className="p-3 font-mono font-bold">#2</td>
                            <td className="p-3 font-semibold">Alternador/Estator (Cobre 5,40)</td>
                            <td className="p-3 text-center font-mono">2,5 kg</td>
                            <td className="p-3 text-center font-mono">5,40</td>
                            <td className="p-3 text-center font-mono">0,30</td>
                            <td className="p-3 text-center bg-blue-50/40 dark:bg-blue-950/20 font-mono border-l border-r border-slate-200 dark:border-slate-800 print:border-black">
                              <span className="text-slate-400 dark:text-slate-600">
                                [
                                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                                ]
                              </span>
                            </td>
                            <td className="p-3 text-center font-mono text-[11px]">MTR 4410</td>
                            <td className="p-3 text-center font-bold text-emerald-600 dark:text-[#059669]">
                              ( &nbsp; ) SIM &nbsp;&nbsp; ( &nbsp; ) NÃO
                            </td>
                          </tr>
                          <tr>
                            <td className="p-3 font-mono font-bold">#3</td>
                            <td className="p-3 font-semibold">
                              Parachoque dianteiro (Polímeros 1,90)
                            </td>
                            <td className="p-3 text-center font-mono">4,0 kg</td>
                            <td className="p-3 text-center font-mono">1,90</td>
                            <td className="p-3 text-center font-mono">0,30</td>
                            <td className="p-3 text-center bg-blue-50/40 dark:bg-blue-950/20 font-mono border-l border-r border-slate-200 dark:border-slate-800 print:border-black">
                              <span className="text-slate-400 dark:text-slate-600">
                                [
                                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                                ]
                              </span>
                            </td>
                            <td className="p-3 text-center font-mono text-[11px]">Em estoque</td>
                            <td className="p-3 text-center font-bold text-amber-600">
                              ( &nbsp; ) SIM &nbsp;&nbsp; ( &nbsp; ) NÃO
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Totais do Revisor e Memória Livre */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#111827] border border-slate-200 dark:border-slate-800 space-y-3 print:bg-white print:border-black">
                      <span className="font-heading font-bold text-slate-900 dark:text-[#F8FAFC] block">
                        B. Balanço Consolidado do Revisor Independente
                      </span>
                      <div className="space-y-2.5">
                        <div className="flex justify-between items-center py-1 border-b border-slate-200 dark:border-slate-800 print:border-black">
                          <span>1. Total Evitado CONFIRMADO apurado:</span>
                          <span className="font-mono font-bold">________________ kgCO₂e</span>
                        </div>
                        <div className="flex justify-between items-center py-1 border-b border-slate-200 dark:border-slate-800 print:border-black">
                          <span>2. Total Evitado POTENCIAL apurado:</span>
                          <span className="font-mono font-bold">________________ kgCO₂e</span>
                        </div>
                        <div className="flex justify-between items-center py-1 border-b border-slate-200 dark:border-slate-800 print:border-black">
                          <span>3. Total Geral Líquido do Lote (1 + 2):</span>
                          <span className="font-mono font-bold">________________ kgCO₂e</span>
                        </div>
                        <div className="flex justify-between items-center py-1 border-b border-slate-200 dark:border-slate-800 print:border-black">
                          <span>4. Incerteza Absoluta Combinada (kg):</span>
                          <span className="font-mono font-bold">± ________________ kgCO₂e</span>
                        </div>
                        <div className="flex justify-between items-center py-1 border-b border-slate-200 dark:border-slate-800 print:border-black">
                          <span>5. Incerteza Relativa do Lote (%):</span>
                          <span className="font-mono font-bold">± ________________ %</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#111827] border border-slate-200 dark:border-slate-800 space-y-3 print:bg-white print:border-black">
                      <span className="font-heading font-bold text-slate-900 dark:text-[#F8FAFC] block">
                        C. Espaço em Branco para Memória de Cálculo e Anotações
                      </span>
                      <p className="text-[11px] text-slate-500 dark:text-[#94A3B8]">
                        Utilize este espaço para detalhar o passo a passo da propagação de incerteza
                        em quadratura (u1², u2², u3², u_massa²) ou observações paramétricas:
                      </p>
                      <div className="h-40 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-3 bg-white dark:bg-[#0A1628] print:border-black print:h-48 text-[11px] font-mono text-slate-400">
                        {/* Linhas pontilhadas para anotação manuscrita em impressão */}
                        <div className="border-b border-slate-200 dark:border-slate-800 pb-2 mb-2">
                          Linha 1:{' '}
                        </div>
                        <div className="border-b border-slate-200 dark:border-slate-800 pb-2 mb-2">
                          Linha 2:{' '}
                        </div>
                        <div className="border-b border-slate-200 dark:border-slate-800 pb-2 mb-2">
                          Linha 3:{' '}
                        </div>
                        <div>Linha 4: </div>
                      </div>
                    </div>
                  </div>

                  {/* Parecer de Divergência e Assinatura */}
                  <div className="p-5 rounded-2xl bg-slate-50 dark:bg-[#111827] border border-slate-200 dark:border-slate-800 space-y-3 print:bg-white print:border-black">
                    <span className="font-heading font-bold text-slate-900 dark:text-[#F8FAFC] block">
                      D. Parecer Final e Assinatura do Revisor Independente
                    </span>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          className="rounded border-slate-300 dark:border-slate-700 text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                        />
                        <span>
                          Declaro que os cálculos periciais reproduzem com fidelidade estrita as
                          formulações do DM-ORB-001 v1.1.
                        </span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          className="rounded border-slate-300 dark:border-slate-700 text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                        />
                        <span>
                          Identifiquei divergência material acima do limite de tolerância de
                          arredondamento.
                        </span>
                      </label>
                    </div>

                    <div className="mt-6 pt-6 border-t border-slate-300 dark:border-slate-700 text-center space-y-2 print:border-black">
                      <div className="max-w-xs mx-auto border-b border-slate-400 dark:border-slate-600 print:border-black pt-6"></div>
                      <p className="font-bold text-slate-800 dark:text-[#F8FAFC]">
                        Assinatura do Revisor Pericial Independente
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-[#94A3B8]">
                        Atestado de Conformidade Orbis (com ART/RRT vinculada) • Verificação de
                        Reprodução F6
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* ============================================================== */}
        {/* PARTE 3: SEÇÃO DE CONFERÊNCIA (COM TRAVA DE REVELAÇÃO) */}
        {/* ============================================================== */}
        <div
          id="secao-conferencia-f6"
          className="p-6 sm:p-10 rounded-3xl bg-white dark:bg-[#0E1A2E] border-2 border-emerald-500/60 dark:border-[#059669]/60 shadow-xl print:border-black space-y-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800 print:border-black">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-xs font-mono font-bold">
                <ShieldCheck className="w-3.5 h-3.5" />
                SEÇÃO DE CONFERÊNCIA OFICIAL • AUDITORIA F6
              </div>
              <h2 className="text-xl sm:text-2xl font-heading font-black text-slate-900 dark:text-[#F8FAFC]">
                Gabarito Oficial de Reprodução e Critério de Aceite Pericial
              </h2>
              <p className="text-xs text-slate-500 dark:text-[#94A3B8]">
                <strong>ATENÇÃO REVISOR:</strong> ABRIR SOMENTE APÓS CONCLUIR O RECÁLCULO
                INDEPENDENTE NA FOLHA DE RESPOSTA.
              </p>
            </div>

            <div className="print:hidden">
              <Button
                variant={secaoConferenciaAberta ? 'outline' : 'default'}
                size="sm"
                onClick={() => setSecaoConferenciaAberta(!secaoConferenciaAberta)}
                className={
                  secaoConferenciaAberta
                    ? 'text-xs h-9 bg-slate-100 dark:bg-[#111827] text-slate-700 dark:text-[#F8FAFC] border-slate-300 dark:border-slate-700'
                    : 'text-xs h-9 bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-emerald-glow'
                }
              >
                {secaoConferenciaAberta ? (
                  <>
                    <EyeOff className="w-3.5 h-3.5 mr-1.5" />
                    Ocultar Gabarito de Conferência
                  </>
                ) : (
                  <>
                    <Eye className="w-3.5 h-3.5 mr-1.5" />
                    Abrir Gabarito de Conferência
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* CONTEÚDO REVELADO OU OCULTO COM BLUR */}
          <div
            className={secaoConferenciaAberta ? 'space-y-6 block' : 'space-y-6 print:block hidden'}
          >
            {/* Cards com Resultados Oficiais do Motor */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-[#111827] border border-emerald-200 dark:border-emerald-800/60 space-y-1">
                <span className="text-[10px] font-mono text-emerald-800 dark:text-emerald-400 block uppercase font-bold">
                  Total Líquido do Lote
                </span>
                <span className="text-2xl font-heading font-black text-emerald-700 dark:text-[#059669]">
                  12,87 kgCO₂e
                </span>
                <span className="text-[10px] text-slate-500 dark:text-[#94A3B8] block">
                  Soma de todas as 3 peças (floor2)
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-[#111827] border border-emerald-200 dark:border-emerald-800/60 space-y-1">
                <span className="text-[10px] font-mono text-emerald-800 dark:text-emerald-400 block uppercase font-bold">
                  Claim Confirmado
                </span>
                <span className="text-2xl font-heading font-black text-emerald-700 dark:text-[#059669]">
                  10,59 kgCO₂e
                </span>
                <span className="text-[10px] text-slate-500 dark:text-[#94A3B8] block">
                  Capô (6,54) + Alternador (4,05)
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-[#111827] border border-amber-200 dark:border-amber-800/60 space-y-1">
                <span className="text-[10px] font-mono text-amber-800 dark:text-amber-400 block uppercase font-bold">
                  Claim Potencial
                </span>
                <span className="text-2xl font-heading font-black text-amber-700 dark:text-amber-400">
                  2,28 kgCO₂e
                </span>
                <span className="text-[10px] text-slate-500 dark:text-[#94A3B8] block">
                  Parachoque em estoque (fora do confirmado)
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-[#111827] border border-blue-200 dark:border-blue-800/60 space-y-1">
                <span className="text-[10px] font-mono text-blue-800 dark:text-blue-400 block uppercase font-bold">
                  Incerteza do Lote (GUM)
                </span>
                <span className="text-2xl font-heading font-black text-blue-700 dark:text-blue-400">
                  ± 2,64%
                </span>
                <span className="text-[10px] text-slate-500 dark:text-[#94A3B8] block">
                  ± 0,34 kgCO₂e (quadratura c/ balança 1%)
                </span>
              </div>
            </div>

            {/* Passo a Passo de Verificação Detalhado */}
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-[#111827] border border-slate-200 dark:border-slate-800 space-y-4 text-xs">
              <span className="font-heading font-bold text-sm text-slate-900 dark:text-[#F8FAFC] block">
                Memória Oficial de Cálculo Passo a Passo (Gabarito Analítico)
              </span>

              <div className="space-y-3 font-mono text-[11px]">
                <div className="p-3 rounded-xl bg-white dark:bg-[#0A1628] border border-slate-200 dark:border-slate-800">
                  <strong className="text-slate-900 dark:text-[#F8FAFC] block">
                    Peça 1 (Capô dianteiro — Aço, NF-e 1234):
                  </strong>
                  <div className="text-emerald-700 dark:text-[#059669] pt-1">
                    Evitado = 10,0 kg × 2,18 kgCO₂e/kg × 1,0 (L_i) × 0,30 (DF) − 0,00 (PE) = 6,54
                    kgCO₂e
                  </div>
                  <div className="text-slate-500 text-[10px] pt-0.5">
                    Status: NF-e 1234 autorizada → Claim CONFIRMADO (6,54 kgCO₂e). Termo de
                    incerteza: u1 = 6,54 × 0,035 = 0,2289 kg → u1² = 0,052395
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white dark:bg-[#0A1628] border border-slate-200 dark:border-slate-800">
                  <strong className="text-slate-900 dark:text-[#F8FAFC] block">
                    Peça 2 (Alternador/Estator — Cobre, MTR 4410):
                  </strong>
                  <div className="text-emerald-700 dark:text-[#059669] pt-1">
                    Evitado = 2,5 kg × 5,40 kgCO₂e/kg × 1,0 (L_i) × 0,30 (DF) − 0,00 (PE) = 4,05
                    kgCO₂e
                  </div>
                  <div className="text-slate-500 text-[10px] pt-0.5">
                    Status: MTR 4410 baixado → Claim CONFIRMADO (4,05 kgCO₂e). Termo de incerteza:
                    u2 = 4,05 × 0,045 = 0,18225 kg → u2² = 0,033215
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white dark:bg-[#0A1628] border border-slate-200 dark:border-slate-800">
                  <strong className="text-slate-900 dark:text-[#F8FAFC] block">
                    Peça 3 (Parachoque dianteiro — Polímeros, Em Estoque):
                  </strong>
                  <div className="text-amber-700 dark:text-amber-400 pt-1">
                    Evitado = 4,0 kg × 1,90 kgCO₂e/kg × 1,0 (L_i) × 0,30 (DF) − 0,00 (PE) = 2,28
                    kgCO₂e
                  </div>
                  <div className="text-slate-500 text-[10px] pt-0.5">
                    Status: Em estoque sem NF-e/MTR → Claim POTENCIAL (2,28 kgCO₂e, NÃO entra no
                    confirmado). Termo: u3 = 2,28 × 0,050 = 0,114 kg → u3² = 0,012996
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white dark:bg-[#0A1628] border border-slate-200 dark:border-slate-800">
                  <strong className="text-slate-900 dark:text-[#F8FAFC] block">
                    Consolidação do Lote e Propagação de Incerteza (ISO/IEC 98-3):
                  </strong>
                  <div className="text-slate-700 dark:text-slate-300 pt-1 space-y-1">
                    <div>
                      • Total Confirmado = 6,54 + 4,05 = <strong>10,59 kgCO₂e</strong>
                    </div>
                    <div>
                      • Total Geral Líquido = 6,54 + 4,05 + 2,28 = <strong>12,87 kgCO₂e</strong>
                    </div>
                    <div>• Termo de tara balança = (12,87 × 0,01)² = 0,1287² = 0,016564</div>
                    <div>
                      • Soma dos quadrados = 0,052395 + 0,033215 + 0,012996 + 0,016564 = 0,115170
                    </div>
                    <div>
                      • Incerteza absoluta = √0,115170 ={' '}
                      <strong>0,339367... kg ≈ 0,34 kgCO₂e</strong>
                    </div>
                    <div>
                      • Incerteza relativa = (0,34 / 12,87) × 100 ={' '}
                      <strong>2,6418...% ≈ ± 2,64%</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Critério de Aceite Pericial */}
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 space-y-2">
                <div className="flex items-center gap-2 font-bold text-emerald-800 dark:text-emerald-400">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-[#059669]" />
                  Critério Estrito de Aceite Pericial (DM-ORB-001 v1.1 §7.3)
                </div>
                <p className="text-slate-700 dark:text-slate-300 text-[11px] leading-relaxed">
                  O recálculo do revisor é considerado em{' '}
                  <strong>PLENA CONFORMIDADE METODOLÓGICA</strong> quando apresentar{' '}
                  <strong>zero divergência analítica até a segunda casa decimal</strong> em todos os
                  itens (Capô = 6,54, Alternador = 4,05, Parachoque = 2,28, Total = 12,87 kgCO₂e,
                  Incerteza = ±2,64%). Divergências pontuais são admitidas exclusivamente se
                  decorrentes de regras aritméticas de truncamento diferentes de{' '}
                  <code className="font-mono">Math.floor</code> vs{' '}
                  <code className="font-mono">Math.round</code> na segunda casa (tolerância máxima
                  absoluta de ± 0,01 kgCO₂e).
                </p>
              </div>
            </div>
          </div>

          {/* Aviso se a seção estiver oculta na tela */}
          {!secaoConferenciaAberta && (
            <div className="p-6 rounded-2xl bg-slate-100 dark:bg-[#111827] text-center space-y-2 border border-dashed border-slate-300 dark:border-slate-700 print:hidden">
              <Lock className="w-6 h-6 mx-auto text-amber-600 dark:text-amber-400" />
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Seção Oculta para Garantir a Auditoria Cega
              </p>
              <p className="text-[11px] text-slate-500 dark:text-[#94A3B8] max-w-md mx-auto">
                Conclua o preenchimento da Folha de Resposta antes de clicar em &quot;Abrir Gabarito
                de Conferência&quot;. Na versão impressa, esta seção segue como folha separada para
                abertura posterior.
              </p>
            </div>
          )}
        </div>

        {/* ============================================================== */}
        {/* PARTE 4: RODAPÉ INSTITUCIONAL COM REFERÊNCIA CRUZADA */}
        {/* ============================================================== */}
        <footer className="p-6 rounded-3xl bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-[#94A3B8] space-y-4 print:border-black print:p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4 print:border-black">
            <div className="flex items-center gap-2.5">
              <OrbisLogo variant="full" height={24} alt="Orbis Protocol" />
              <span className="text-[11px] font-mono border-l border-slate-300 dark:border-slate-700 pl-2.5">
                Infraestrutura dMRV de Custódia Probatória B2B
              </span>
            </div>
            <div className="flex items-center gap-3 font-mono text-[11px]">
              <span className="text-emerald-600 dark:text-[#059669] font-bold">
                DM-ORB-001 v1.1
              </span>
              <span>•</span>
              <span>Auditoria F6 Reproduzida</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-[11px] leading-relaxed">
            <div>
              <strong className="text-slate-900 dark:text-[#F8FAFC] block mb-1">
                Documento Metodológico de Referência:
              </strong>
              <p>
                Texto integral, fórmulas de baseline e catálogo de fatores publicado em{' '}
                <Link
                  to="/fatores"
                  className="text-emerald-600 dark:text-[#059669] underline font-mono hover:text-emerald-700"
                >
                  orbis-protocol.com/fatores
                </Link>
                .
              </p>
            </div>

            <div>
              <strong className="text-slate-900 dark:text-[#F8FAFC] block mb-1">
                Verificador Público de Selos & DPP:
              </strong>
              <p>
                Consulte o lastro documental e a autenticidade de atestados com ART em{' '}
                <Link
                  to="/verificador"
                  className="text-emerald-600 dark:text-[#059669] underline font-mono hover:text-emerald-700"
                >
                  orbis-protocol.com/verificador
                </Link>
                .
              </p>
            </div>

            <div>
              <strong className="text-slate-900 dark:text-[#F8FAFC] block mb-1">
                Garantia de Não-Retroatividade:
              </strong>
              <p>
                Todo laudo emitido possui snapshot imutável em hash SHA-256 (§10). Data de emissão
                deste pacote: Março de 2026.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}

export default RevisorExternoF6Page
