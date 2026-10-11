import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  FileText,
  ShieldCheck,
  Download,
  ExternalLink,
  Layers,
  Sparkles,
  Car,
  QrCode,
  Radio,
  Clock,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react'
import {
  gerarDossieEscopo3Cliente,
  DossieEscopo3Data,
  ETIQUETA_CARBONO_EVITADO_CANONICA,
} from '@/services/dossieEscopo3Service'
import { QRCodeSVG } from '@/components/QRCodeSVG'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { CdvLoteRecord } from '@/services/cdvService'

interface MeusDocumentosHubProps {
  cnpj: string
  razaoSocial: string
  codigoAtestado?: string
  totalNotas: number
  onExportarLaudoPdf: () => void
  isExportandoPdf: boolean
  lotesCdv?: CdvLoteRecord[]
}

export function MeusDocumentosHub({
  cnpj,
  razaoSocial,
  codigoAtestado,
  totalNotas,
  onExportarLaudoPdf,
  isExportandoPdf,
  lotesCdv,
}: MeusDocumentosHubProps) {
  const [dossieEscopo3, setDossieEscopo3] = useState<DossieEscopo3Data | null>(null)
  const [modalEscopo3Aberto, setModalEscopo3Aberto] = useState(false)
  const [carregandoDossie, setCarregandoDossie] = useState(false)

  useEffect(() => {
    let ativo = true
    setCarregandoDossie(true)
    gerarDossieEscopo3Cliente({
      cnpjAdquirente: cnpj,
      razaoSocialAdquirente: razaoSocial,
      lotesPreCarregados: lotesCdv,
    })
      .then((res) => {
        if (ativo) setDossieEscopo3(res)
      })
      .catch((e) => console.error('Erro ao gerar Dossiê Escopo 3:', e))
      .finally(() => {
        if (ativo) setCarregandoDossie(false)
      })
    return () => {
      ativo = false
    }
  }, [cnpj, razaoSocial, lotesCdv])

  const codigoAtestadoEfetivo = codigoAtestado || 'ORB-2025-0891-CONF'
  const urlVerificador = `${typeof window !== 'undefined' ? window.location.origin : 'https://www.orbis-protocol.com'}/verificador?hash=${encodeURIComponent(codigoAtestadoEfetivo)}`

  return (
    <div className="space-y-6">
      {/* CABEÇALHO DO BLOCO MEUS DOCUMENTOS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-6 rounded-2xl bg-white dark:bg-[#111820] border border-slate-200 dark:border-[rgba(244,247,250,0.12)] shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-[#12B886] border border-emerald-300 dark:border-emerald-800">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-[#12B886]/10 text-[#12B886] font-mono">
                Hub Consolidado de Entregáveis
              </span>
              <span className="text-[10px] text-slate-500 dark:text-[#93A3B5] font-mono">
                5 documentos estruturados
              </span>
            </div>
            <h2 className="font-heading font-extrabold text-xl text-slate-900 dark:text-[#F4F7FA] mt-1">
              MEUS DOCUMENTOS & LAUDOS dMRV
            </h2>
            <p className="text-xs text-slate-600 dark:text-[#93A3B5]">
              Repositório canônico com prova documental, atestados rastreáveis e conformidade
              regulatória.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onExportarLaudoPdf}
          disabled={isExportandoPdf}
          className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#12B886] text-[#0A0E12] hover:bg-[#0CA678] transition-all shadow-emerald-glow flex items-center justify-center gap-2 disabled:opacity-50 shrink-0"
        >
          <Download className="w-4 h-4" />
          <span>{isExportandoPdf ? 'Exportando PDF...' : 'Baixar Pacote Completo (PDF)'}</span>
        </button>
      </div>

      {/* GRADE DOS 5 ENTREGÁVEIS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* 1. EXTRATO POR NOTA FISCAL (PRODUTO CENTRAL) */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#111820] border border-slate-200 dark:border-[rgba(244,247,250,0.1)] hover:border-[#12B886]/40 transition-all flex flex-col justify-between shadow-sm">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-[#12B886]">
                <Layers className="w-4 h-4" />
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 dark:bg-[#12B886]/20 text-[#12B886] font-bold uppercase">
                Produto Central
              </span>
            </div>
            <div>
              <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-[#F4F7FA]">
                Extrato por Nota Fiscal (Pegada de Carbono)
              </h3>
              <p className="text-xs text-slate-600 dark:text-[#93A3B5] mt-1">
                Informação rápida e consistente de emissões diretas e incorporadas por nota e
                produto (DM-ORB-001 v1.1).
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#0A0E12] border border-slate-200 dark:border-slate-800 text-[11px] font-mono text-slate-700 dark:text-[#CBD5E1] flex justify-between">
              <span>Notas processadas:</span>
              <strong className="text-emerald-700 dark:text-[#12B886]">{totalNotas} NFs</strong>
            </div>
          </div>
          <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onExportarLaudoPdf}
              className="w-full py-2 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-[#16202B] hover:bg-emerald-50 dark:hover:bg-[#12B886]/10 text-slate-700 dark:text-[#F4F7FA] hover:text-[#12B886] transition-colors flex items-center justify-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Gerar Relatório de Notas</span>
            </button>
          </div>
        </div>

        {/* 2. LAUDO PERICIAL & ATESTADO ORBIS COM ART/RRT */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#111820] border border-slate-200 dark:border-[rgba(244,247,250,0.1)] hover:border-[#12B886]/40 transition-all flex flex-col justify-between shadow-sm">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-[#D9B36C]">
                <ShieldCheck className="w-4 h-4" />
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-100 dark:bg-[#D9B36C]/20 text-amber-800 dark:text-[#D9B36C] font-bold uppercase">
                ART/RRT Vinculada
              </span>
            </div>
            <div>
              <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-[#F4F7FA]">
                Atestado de Conformidade Orbis (com ART/RRT)
              </h3>
              <p className="text-xs text-slate-600 dark:text-[#93A3B5] mt-1">
                Laudo pericial com hash SHA-256 e validação pública direta via Verificador.
              </p>
            </div>

            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-[#0A0E12] border border-slate-200 dark:border-slate-800">
              <div className="p-1 rounded bg-white">
                <QRCodeSVG value={urlVerificador} size={42} />
              </div>
              <div className="text-[10px] font-mono truncate">
                <span className="text-slate-500 dark:text-[#93A3B5] block">
                  Código do Atestado:
                </span>
                <strong className="text-emerald-700 dark:text-[#12B886] truncate block">
                  {codigoAtestadoEfetivo}
                </strong>
              </div>
            </div>
          </div>
          <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
            <Link
              to={`/verificador?hash=${encodeURIComponent(codigoAtestadoEfetivo)}`}
              className="w-full py-2 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-[#16202B] hover:bg-emerald-50 dark:hover:bg-[#12B886]/10 text-slate-700 dark:text-[#F4F7FA] hover:text-[#12B886] transition-colors flex items-center justify-center gap-1.5"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Conferir no Verificador Público</span>
            </Link>
          </div>
        </div>

        {/* 3. DOSSIÊ MOVER & DOSSIÊ DE CAPITAL */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#111820] border border-slate-200 dark:border-[rgba(244,247,250,0.1)] hover:border-[#12B886]/40 transition-all flex flex-col justify-between shadow-sm">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400">
                <Car className="w-4 h-4" />
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 font-bold uppercase">
                Programa Federal
              </span>
            </div>
            <div>
              <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-[#F4F7FA]">
                Dossiê MOVER & Capital Verde
              </h3>
              <p className="text-xs text-slate-600 dark:text-[#93A3B5] mt-1">
                Conformidade com a Lei 14.902/2024 (Programa MOVER) e esteira de crédito para 8
                linhas bancárias (PRSAC).
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#0A0E12] border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-[#93A3B5]">
              Passaporte DPP e redução de spread via Res. BCB 4.945/2021.
            </div>
          </div>
          <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
            <Link
              to="/dossie-mover"
              className="flex-1 py-2 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-[#16202B] hover:bg-blue-50 dark:hover:bg-blue-950 text-slate-700 dark:text-[#F4F7FA] hover:text-blue-600 transition-colors text-center"
            >
              Dossiê MOVER
            </Link>
            <Link
              to="/capital"
              className="flex-1 py-2 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-[#16202B] hover:bg-blue-50 dark:hover:bg-blue-950 text-slate-700 dark:text-[#F4F7FA] hover:text-blue-600 transition-colors text-center"
            >
              Linhas Capital
            </Link>
          </div>
        </div>

        {/* 4. RADAR SEMANAL (HISTÓRICO DE EDIÇÕES) */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#111820] border border-slate-200 dark:border-[rgba(244,247,250,0.1)] hover:border-[#12B886]/40 transition-all flex flex-col justify-between shadow-sm">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-400">
                <Radio className="w-4 h-4" />
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 font-bold uppercase">
                Inteligência Semanal
              </span>
            </div>
            <div>
              <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-[#F4F7FA]">
                Radar Semanal de Regulação & SBCE
              </h3>
              <p className="text-xs text-slate-600 dark:text-[#93A3B5] mt-1">
                Acompanhamento contínuo de atos da Lei 15.042/2024, CBAM e transição IBS/CBS com
                histórico de edições.
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#0A0E12] border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-[#93A3B5]">
              Edições semanais curadas para diretores tributários e de sustentabilidade.
            </div>
          </div>
          <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
            <Link
              to="/central-radar"
              className="w-full py-2 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-[#16202B] hover:bg-purple-50 dark:hover:bg-purple-950 text-slate-700 dark:text-[#F4F7FA] hover:text-purple-600 transition-colors flex items-center justify-center gap-1.5"
            >
              <Radio className="w-3.5 h-3.5" />
              <span>Acessar Central de Edições</span>
            </Link>
          </div>
        </div>

        {/* 5. DOSSIÊ DE ESCOPO 3 (NOVO - Lotes Reais cdv_lotes/cdv_pecas + Titularidade + Etiqueta) */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-white via-white to-emerald-50/50 dark:from-[#111820] dark:via-[#111820] dark:to-[#0A1628] border-2 border-emerald-500/40 hover:border-emerald-500 transition-all flex flex-col justify-between shadow-md md:col-span-2 lg:col-span-2">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-[#12B886]">
                  <Sparkles className="w-4 h-4" />
                </span>
                <span className="font-mono text-xs font-bold text-emerald-700 dark:text-[#12B886]">
                  NOVO • DOSSIÊ DE ESCOPO 3 (INSETTING CIRCULAR)
                </span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-600 text-white font-bold uppercase tracking-wider">
                Auditoria cdv_lotes/cdv_pecas
              </span>
            </div>

            <div>
              <h3 className="font-heading font-extrabold text-base text-slate-900 dark:text-[#F4F7FA]">
                Dossiê Técnico de Escopo 3 • Lastro em Notas & Peças
              </h3>
              <p className="text-xs text-slate-600 dark:text-[#93A3B5] mt-1 leading-relaxed">
                Demonstrativo de carbono incorporado evitado ancorado no catálogo{' '}
                <strong>DM-ORB-001 v1.1</strong>. A titularidade da claim pertence integralmente à
                empresa adquirente (Categoria 1) ou montadora (Categoria 12); o CDV/reciclador não
                reivindica nem vende redução.
              </p>
            </div>

            {/* Etiqueta Canônica Obrigatória */}
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-[11px] text-amber-900 dark:text-amber-200 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-semibold uppercase text-[10px] tracking-wider text-amber-800 dark:text-amber-300">
                  Etiqueta Canônica de Prova Documental:
                </strong>
                <span>"{ETIQUETA_CARBONO_EVITADO_CANONICA}"</span>
              </div>
            </div>

            {/* Resumo Consolidado dos Lotes do Cliente */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#0A0E12] border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-500 dark:text-[#93A3B5] block">
                  Lotes Inclusos
                </span>
                <strong className="text-sm font-heading font-bold text-slate-900 dark:text-white">
                  {dossieEscopo3?.resumoConsolidado.totalLotes || 1} lote(s)
                </strong>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#0A0E12] border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-500 dark:text-[#93A3B5] block">
                  Massa Circular
                </span>
                <strong className="text-sm font-heading font-bold text-slate-900 dark:text-white">
                  {(dossieEscopo3?.resumoConsolidado.massaTotalKg || 0).toLocaleString('pt-BR')} kg
                </strong>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#0A0E12] border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-emerald-600 dark:text-[#12B886] block">
                  Carbono Evitado
                </span>
                <strong className="text-sm font-heading font-bold text-emerald-700 dark:text-[#12B886]">
                  {(dossieEscopo3?.resumoConsolidado.co2eEvitadoTotalKg || 0).toLocaleString(
                    'pt-BR',
                  )}{' '}
                  kgCO₂e
                </strong>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#0A0E12] border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-500 dark:text-[#93A3B5] block">
                  Guarda Duplicidade
                </span>
                <strong className="text-[11px] font-mono text-slate-800 dark:text-slate-200 block truncate">
                  RETIRED_FOR_INSETTING
                </strong>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <span className="text-[11px] text-slate-500 dark:text-[#93A3B5] font-mono">
              Hash:{' '}
              {dossieEscopo3?.hashIntegridadeSha256
                ? `${dossieEscopo3.hashIntegridadeSha256.slice(0, 16)}...`
                : 'calculando...'}
            </span>
            <div className="flex items-center gap-2">
              <Link
                to="/posicao-escopo-3"
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-[#93A3B5] hover:text-[#12B886] transition-colors"
              >
                Ver Posição Técnica
              </Link>
              <button
                type="button"
                onClick={() => setModalEscopo3Aberto(true)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#12B886] text-[#0A0E12] hover:bg-[#0CA678] transition-all shadow-emerald-glow flex items-center gap-1.5"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Abrir Dossiê de Escopo 3</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL DETALHADO DO DOSSIÊ DE ESCOPO 3 */}
      <Dialog open={modalEscopo3Aberto} onOpenChange={setModalEscopo3Aberto}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-[#0A1628] text-slate-900 dark:text-[#F8FAFC] border border-slate-200 dark:border-slate-800">
          <DialogHeader>
            <div className="flex items-center gap-2 text-xs font-mono text-emerald-600 dark:text-[#12B886] uppercase font-bold">
              <Sparkles className="w-4 h-4" />
              <span>Dossiê dMRV de Escopo 3 • Orbis Protocol</span>
            </div>
            <DialogTitle className="font-heading font-extrabold text-xl text-slate-900 dark:text-white">
              Demonstrativo de Emissões Incorporadas & Insetting Circular
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-600 dark:text-[#94A3B8]">
              Documento pericial preparado para auditoria GHG Protocol Scope 3 e reporte de
              sustentabilidade corporativa.
            </DialogDescription>
          </DialogHeader>

          {dossieEscopo3 && (
            <div className="space-y-6 text-xs mt-3">
              {/* BLOCO DE IDENTIFICAÇÃO E TITULARIDADE */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0E1A2E] border border-slate-200 dark:border-slate-800 space-y-3">
                <h4 className="font-heading font-bold text-sm text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  1. Matriz de Titularidade da Claim de Redução
                </h4>
                <div className="space-y-2 text-slate-700 dark:text-[#CBD5E1] leading-relaxed">
                  <p>
                    <strong className="text-slate-900 dark:text-white">
                      Escopo 3 • Categoria 1 (Bens e Serviços Adquiridos):
                    </strong>{' '}
                    {dossieEscopo3.titularidadeClaim.categoria1}
                  </p>
                  <p>
                    <strong className="text-slate-900 dark:text-white">
                      Escopo 3 • Categoria 12 (Fim de Vida de Produtos):
                    </strong>{' '}
                    {dossieEscopo3.titularidadeClaim.categoria12}
                  </p>
                  <p className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 font-medium">
                    <strong>Declaração do Reciclador / CDV:</strong>{' '}
                    {dossieEscopo3.titularidadeClaim.declaracaoCdv}
                  </p>
                  <p className="font-mono text-[11px] text-amber-700 dark:text-amber-400">
                    Registro de Uso Único:{' '}
                    <strong>{dossieEscopo3.titularidadeClaim.registroUsoUnico}</strong>
                  </p>
                </div>
              </div>

              {/* ETIQUETA OBRIGATÓRIA */}
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs">
                <strong>Etiqueta Obrigatória do Carbono Evitado:</strong>
                <p className="italic mt-1 font-mono text-[11px]">
                  "{dossieEscopo3.etiquetaEvitado}"
                </p>
              </div>

              {/* LOTES E PEÇAS AUDITADAS (cdv_lotes e cdv_pecas) */}
              <div className="space-y-3">
                <h4 className="font-heading font-bold text-sm text-slate-900 dark:text-white uppercase tracking-wider">
                  2. Lotes e Peças Vinculadas (cdv_lotes / cdv_pecas)
                </h4>
                <div className="space-y-3">
                  {dossieEscopo3.lotes.map((lote) => (
                    <div
                      key={lote.loteId}
                      className="p-4 rounded-xl bg-slate-50 dark:bg-[#0E1A2E] border border-slate-200 dark:border-slate-800 space-y-2"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                        <div>
                          <span className="font-mono font-bold text-xs text-emerald-700 dark:text-[#12B886]">
                            {lote.cdvCodigo}
                          </span>
                          <h5 className="font-semibold text-slate-900 dark:text-white text-xs">
                            {lote.veiculoDescricao}
                          </h5>
                        </div>
                        <div className="text-right text-[11px] font-mono text-slate-500 dark:text-[#94A3B8]">
                          <div>Massa: {lote.massaTotalKg.toLocaleString('pt-BR')} kg</div>
                          <div className="text-emerald-700 dark:text-[#12B886] font-bold">
                            Evitado: {lote.co2eEvitadoKg.toLocaleString('pt-BR')} kgCO₂e
                          </div>
                        </div>
                      </div>

                      {lote.pecasPrincipais && lote.pecasPrincipais.length > 0 && (
                        <div className="pt-2">
                          <span className="text-[10px] font-mono uppercase text-slate-500 dark:text-[#94A3B8] block mb-1">
                            Amostra de Peças Rastreáveis no Lote:
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px]">
                            {lote.pecasPrincipais.map((p, idx) => (
                              <div
                                key={idx}
                                className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#0A1220] border border-slate-200 dark:border-slate-800 flex justify-between items-center"
                              >
                                <span className="truncate max-w-[180px]">{p.nome}</span>
                                <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold shrink-0">
                                  {p.pesoKg}kg ({p.co2eEvitadoKg.toFixed(1)} kgCO₂e)
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* REFERÊNCIAS NORMATIVAS E ASSINATURA */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0E1A2E] border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-[#94A3B8] space-y-1">
                <div>
                  <strong>Metodologia Aplicada:</strong> {dossieEscopo3.metodologiaReferencia}
                </div>
                <div>
                  <strong>Data de Emissão:</strong>{' '}
                  {new Date(dossieEscopo3.geradoEm).toLocaleString('pt-BR')}
                </div>
                <div className="font-mono break-all text-[10px] pt-1">
                  <strong>Hash Canônico SHA-256:</strong> {dossieEscopo3.hashIntegridadeSha256}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalEscopo3Aberto(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
                >
                  Fechar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setModalEscopo3Aberto(false)
                    onExportarLaudoPdf()
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#12B886] text-[#0A0E12] hover:bg-[#0CA678] flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Exportar Laudo Completo</span>
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
