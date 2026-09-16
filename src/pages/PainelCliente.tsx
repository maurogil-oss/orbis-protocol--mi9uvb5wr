import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import pb from '@/lib/pocketbase/client'
import { useAuth } from '@/contexts/AuthContext'
import { useRealtime } from '@/hooks/use-realtime'
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  FileText,
  Award,
  CreditCard,
  Scale,
  UploadCloud,
  FileCode,
  Trash2,
  AlertCircle,
  HelpCircle,
  ExternalLink,
  Receipt,
  FileCheck,
} from 'lucide-react'
import {
  calcularComparativoTributario,
  ResultadoComparativoTributario,
} from '@/services/tributosReforma'
import { ComparativoTributarioView } from '@/components/ComparativoTributarioView'
import { parseNFeXML, formatCurrencyBRL } from '@/services/nfeParser'

import type { RecordModel } from 'pocketbase'

interface LeadDiagnostico extends RecordModel {
  cnpj: string
  razao_social: string
  status: 'novo' | 'em_analise' | 'concluido'
  regime_tributario: string
  categoria_profissional: string
  vinculo_institucional: string
  usuario?: string
  faixa_emissoes?: string
  enquadramento_sbce?: string
  exporta_ue_cbam?: string
  cbam_bens?: string
  comparativo_tributario_json?: any
}

interface NFeUploadRecord extends RecordModel {
  usuario: string
  chave_acesso: string
  numero_nota: string
  serie: string
  modelo: string
  data_emissao: string
  cnpj_emitente: string
  nome_emitente: string
  cnpj_destinatario: string
  nome_destinatario: string
  valor_total_nf: number
  valor_icms: number
  valor_ipi: number
  valor_pis: number
  valor_cofins: number
  qtd_itens: number
  nome_arquivo: string
}

interface SeloRecord extends RecordModel {
  codigo_selo: string
  empresa: string
  cnpj: string
  status: string
  data_emissao: string
  data_validade: string
}

export default function PainelCliente() {
  const { user } = useAuth()
  const [leads, setLeads] = useState<LeadDiagnostico[]>([])
  const [selos, setSelos] = useState<SeloRecord[]>([])
  const [nfeList, setNfeList] = useState<NFeUploadRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Upload state
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  // Metodologia 5 Etapas
  const etapasMetodologia = [
    { num: '01', label: 'Diagnóstico Setorial', concluido: true },
    { num: '02', label: 'Fatores Oficiais MCTI', concluido: true },
    { num: '03', label: 'Ingestão Ativa NF-e (Mod. 55/65)', concluido: nfeList.length > 0 },
    { num: '04', label: 'Emissão de Laudos', concluido: false },
    { num: '05', label: 'Selo Oficial Concedido', concluido: false },
  ]

  const loadData = async () => {
    setIsLoading(true)
    try {
      const leadsList = await pb.collection('leads_diagnostico').getList<LeadDiagnostico>(1, 10, {
        sort: '-created',
      })
      setLeads(leadsList.items)

      const selosList = await pb.collection('selos').getList<SeloRecord>(1, 5, {
        sort: '-created',
      })
      setSelos(selosList.items)

      // Buscar NF-e enviadas pelo usuário
      if (user?.id) {
        const nfeRecords = await pb.collection('nfe_upload').getFullList<NFeUploadRecord>({
          filter: `usuario = "${user.id}"`,
          sort: '-created',
        })
        setNfeList(nfeRecords)
      }
    } catch {
      /* intentionally ignored */
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [user])

  // Realtime updates for leads
  useRealtime<LeadDiagnostico>('leads_diagnostico', (data) => {
    if (data.action === 'create') {
      setLeads((prev) => [data.record, ...prev])
    } else if (data.action === 'update') {
      setLeads((prev) => prev.map((l) => (l.id === data.record.id ? data.record : l)))
    }
  })

  // Realtime updates for nfe_upload
  useRealtime<NFeUploadRecord>('nfe_upload', (data) => {
    if (data.action === 'create') {
      setNfeList((prev) => [data.record, ...prev])
    } else if (data.action === 'delete') {
      setNfeList((prev) => prev.filter((item) => item.id !== data.record.id))
    }
  })

  // Processamento e Upload de arquivos XML NF-e
  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    if (!user?.id) {
      setUploadError('Você precisa estar autenticado para enviar notas fiscais.')
      return
    }

    setIsUploading(true)
    setUploadError(null)
    setUploadSuccess(null)

    let successCount = 0
    const errors: string[] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]

      // Limitar a arquivos XML de até 2MB
      if (!file.name.toLowerCase().endsWith('.xml')) {
        errors.push(`${file.name}: não é um arquivo .xml`)
        continue
      }
      if (file.size > 2 * 1024 * 1024) {
        errors.push(`${file.name}: excede o limite máximo de 2 MB`)
        continue
      }

      try {
        const xmlText = await file.text()
        const parsed = parseNFeXML(xmlText, file.name)

        // Grava no PocketBase
        await pb.collection('nfe_upload').create({
          usuario: user.id,
          chave_acesso: parsed.chaveAcesso,
          numero_nota: parsed.numeroNota,
          serie: parsed.serie,
          modelo: parsed.modelo,
          data_emissao: parsed.dataEmissao,
          cnpj_emitente: parsed.cnpjEmitente,
          nome_emitente: parsed.nomeEmitente,
          cnpj_destinatario: parsed.cnpjDestinatario,
          nome_destinatario: parsed.nomeDestinatario,
          valor_total_nf: parsed.valorTotalNF,
          valor_icms: parsed.valorIcms,
          valor_ipi: parsed.valorIpi,
          valor_pis: parsed.valorPis,
          valor_cofins: parsed.valorCofins,
          qtd_itens: parsed.qtdItens,
          resumo_itens_json: parsed.itens.slice(0, 15), // Primeiros 15 itens
          nome_arquivo: file.name,
        })

        successCount++
      } catch (err: any) {
        errors.push(`${file.name}: ${err.message || 'Erro ao processar XML'}`)
      }
    }

    setIsUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''

    if (successCount > 0) {
      setUploadSuccess(
        `${successCount} nota(s) fiscal(is) processada(s) e incorporada(s) com sucesso!`,
      )
      // Recarrega lista
      loadData()
    }
    if (errors.length > 0) {
      setUploadError(errors.join(' | '))
    }
  }

  // Excluir nota fiscal enviada
  const handleDeleteNfe = async (id: string) => {
    if (!confirm('Deseja realmente remover esta nota fiscal da apuração?')) return
    try {
      await pb.collection('nfe_upload').delete(id)
      setNfeList((prev) => prev.filter((item) => item.id !== id))
    } catch {
      /* intentionally ignored */
    }
  }

  const currentLead = leads[0]
  const currentSelo = selos[0]

  // Totais agregados das notas fiscais enviadas
  const totaisNfe = nfeList.reduce(
    (acc, curr) => {
      acc.totalNotas += 1
      acc.somaValorTotal += curr.valor_total_nf || 0
      acc.somaPisCofins += (curr.valor_pis || 0) + (curr.valor_cofins || 0)
      acc.somaIcms += curr.valor_icms || 0
      acc.somaIpi += curr.valor_ipi || 0
      return acc
    },
    { totalNotas: 0, somaValorTotal: 0, somaPisCofins: 0, somaIcms: 0, somaIpi: 0 },
  )

  // Se houver notas reais, injetamos no cálculo comparativo
  const comparativoCalculado = currentLead
    ? calcularComparativoTributario({
        regime_tributario: currentLead.regime_tributario,
        categoria_profissional: currentLead.categoria_profissional,
        vinculo_institucional: currentLead.vinculo_institucional,
        faixa_emissoes: currentLead.faixa_emissoes,
        exporta_ue_cbam: currentLead.exporta_ue_cbam,
        cbam_bens: currentLead.cbam_bens,
        razao_social: currentLead.razao_social,
        dadosNFeReais:
          totaisNfe.totalNotas > 0
            ? {
                totalNotas: totaisNfe.totalNotas,
                periodoResumo: `apuradas na conta`,
                somaValorTotal: totaisNfe.somaValorTotal,
                somaPisCofins: totaisNfe.somaPisCofins,
                somaIcms: totaisNfe.somaIcms,
                somaIpi: totaisNfe.somaIpi,
              }
            : undefined,
      })
    : null

  return (
    <div className="min-h-screen py-12 md:py-20 bg-[#0A0E12]">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6">
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10 pb-6 border-b border-[rgba(244,247,250,0.1)]">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#111820] border border-[#12B886]/40 text-[#12B886] text-xs font-semibold tracking-wider uppercase mb-3">
              <ShieldCheck className="w-4 h-4" />
              PAINEL DO CLIENTE • AMBIENTE AUTENTICADO
            </div>
            <h1 className="font-heading font-extrabold text-2xl sm:text-4xl text-[#F4F7FA]">
              VISÃO GERAL DO PROTOCOLO & CRÉDITOS FISCAIS
            </h1>
            <p className="text-xs sm:text-sm text-[#93A3B5] mt-1">
              Organização:{' '}
              <strong className="text-[#F4F7FA]">
                {currentLead?.razao_social || 'Empresa Cadastrada'}
              </strong>{' '}
              ({currentLead?.cnpj || 'CNPJ em análise'})
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/diagnostico"
              className="px-4 py-2.5 rounded-lg text-xs font-semibold bg-[#16202B] border border-[rgba(244,247,250,0.15)] text-[#F4F7FA] hover:border-[#12B886]"
            >
              Novo CNPJ
            </Link>
            <Link
              to="/financeiro"
              className="px-5 py-2.5 rounded-lg text-xs font-bold bg-[#12B886] text-[#0A0E12] hover:bg-[#0CA678] shadow-emerald-glow flex items-center gap-1.5"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Gerenciar Assinatura</span>
            </Link>
          </div>
        </div>

        {/* 1. MÓDULO DE INGESTÃO REAL DE XML NF-e */}
        <div className="p-6 sm:p-8 rounded-2xl bg-[#111820] border border-[#12B886]/30 mb-10 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-[#12B886]" />
                <h2 className="font-heading font-bold text-lg text-[#F4F7FA]">
                  INGESTÃO DE NOTAS FISCAIS ELETRÔNICAS (XML NF-E MOD. 55 / NFC-E MOD. 65)
                </h2>
              </div>
              <p className="text-xs text-[#93A3B5] mt-1">
                Envie seus arquivos XML para substituir as estimativas preliminares por créditos
                fiscais reais apurados no comparativo tributário (PIS/Cofins, ICMS e IPI).
              </p>
            </div>

            {/* Input de arquivo */}
            <div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFilesSelected}
                accept=".xml,text/xml"
                multiple
                className="hidden"
                id="nfe-file-input"
              />
              <button
                type="button"
                disabled={isUploading}
                onClick={() => fileInputRef.current?.click()}
                className="px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider bg-[#12B886] text-[#0A0E12] hover:bg-[#0CA678] transition-all shadow-emerald-glow flex items-center gap-2 disabled:opacity-50"
              >
                <UploadCloud className="w-4 h-4" />
                <span>{isUploading ? 'Processando XMLs...' : 'Importar XML NF-e'}</span>
              </button>
            </div>
          </div>

          {/* Feedback de erro/sucesso */}
          {uploadError && (
            <div className="mb-4 p-3 rounded-lg bg-[#F03E54]/10 border border-[#F03E54]/30 text-xs text-[#F03E54] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{uploadError}</span>
            </div>
          )}
          {uploadSuccess && (
            <div className="mb-4 p-3 rounded-lg bg-[#12B886]/10 border border-[#12B886]/30 text-xs text-[#12B886] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{uploadSuccess}</span>
            </div>
          )}

          {/* Resumo dos Créditos Apurados */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 p-4 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.08)]">
            <div>
              <span className="text-[10px] uppercase font-bold text-[#93A3B5] block mb-0.5">
                Notas Ingeridas
              </span>
              <span className="text-xl font-heading font-black text-[#F4F7FA]">
                {totaisNfe.totalNotas}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-[#12B886] block mb-0.5">
                PIS/Cofins Real
              </span>
              <span className="text-xl font-heading font-black text-[#12B886]">
                {formatCurrencyBRL(totaisNfe.somaPisCofins)}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-[#D9B36C] block mb-0.5">
                ICMS Destacado
              </span>
              <span className="text-xl font-heading font-black text-[#D9B36C]">
                {formatCurrencyBRL(totaisNfe.somaIcms)}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-[#93A3B5] block mb-0.5">
                IPI Apurado
              </span>
              <span className="text-xl font-heading font-black text-[#F4F7FA]">
                {formatCurrencyBRL(totaisNfe.somaIpi)}
              </span>
            </div>
          </div>

          {/* Lista de Notas Processadas */}
          {nfeList.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-[rgba(244,247,250,0.1)] text-[#93A3B5] uppercase font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">Nota / Emissão</th>
                    <th className="py-2.5 px-3">Emitente</th>
                    <th className="py-2.5 px-3">Destinatário</th>
                    <th className="py-2.5 px-3 text-right">Valor Total</th>
                    <th className="py-2.5 px-3 text-right">Créd. PIS/Cofins</th>
                    <th className="py-2.5 px-3 text-right">ICMS</th>
                    <th className="py-2.5 px-3 text-center">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[rgba(244,247,250,0.06)] text-[#F4F7FA]">
                  {nfeList.map((item) => (
                    <tr key={item.id} className="hover:bg-[#16202B]/40 transition-colors">
                      <td className="py-2.5 px-3">
                        <div className="font-mono font-semibold text-[#12B886]">
                          NF-e nº {item.numero_nota || 'S/N'} (Série {item.serie || '1'})
                        </div>
                        <div className="text-[10px] text-[#93A3B5]">
                          {item.data_emissao
                            ? item.data_emissao.slice(0, 10)
                            : 'Data não informada'}{' '}
                          • Mod. {item.modelo}
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        <div
                          className="font-semibold truncate max-w-[150px]"
                          title={item.nome_emitente}
                        >
                          {item.nome_emitente || 'Não informado'}
                        </div>
                        <div className="text-[10px] font-mono text-[#93A3B5]">
                          {item.cnpj_emitente}
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="truncate max-w-[150px]" title={item.nome_destinatario}>
                          {item.nome_destinatario || 'Consumidor'}
                        </div>
                        <div className="text-[10px] font-mono text-[#93A3B5]">
                          {item.cnpj_destinatario}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-semibold">
                        {formatCurrencyBRL(item.valor_total_nf || 0)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-[#12B886] font-semibold">
                        {formatCurrencyBRL((item.valor_pis || 0) + (item.valor_cofins || 0))}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-[#D9B36C]">
                        {formatCurrencyBRL(item.valor_icms || 0)}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleDeleteNfe(item.id)}
                          className="p-1 rounded text-[#93A3B5] hover:text-[#F03E54] hover:bg-[#F03E54]/10 transition-colors"
                          title="Remover nota fiscal"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-6 border border-dashed border-[rgba(244,247,250,0.12)] rounded-xl text-xs text-[#93A3B5] bg-[#0A0E12]">
              <FileCode className="w-8 h-8 text-[#93A3B5]/40 mx-auto mb-2" />
              Nenhum XML de NF-e importado ainda. Clique em &quot;Importar XML NF-e&quot; para
              carregar suas notas e apurar créditos reais.
            </div>
          )}
        </div>

        {/* 2. COMPARATIVO DA REFORMA TRIBUTÁRIA ATUALIZADO COM CRÉDITOS REAIS */}
        {currentLead && comparativoCalculado && (
          <div className="p-8 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.12)] mb-10 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-[#12B886]" />
                <h2 className="font-heading font-bold text-lg text-[#F4F7FA]">
                  DIAGNÓSTICO TRIBUTÁRIO • REFORMA EC 132/2023 (IBS/CBS)
                </h2>
              </div>
              {totaisNfe.totalNotas > 0 && (
                <span className="px-3 py-1 rounded-full bg-[#12B886]/10 text-[#12B886] font-bold text-xs uppercase border border-[#12B886]/30 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Alimentado com {totaisNfe.totalNotas} NF-e reais
                </span>
              )}
            </div>
            <ComparativoTributarioView
              comparativo={comparativoCalculado}
              regimeDeclarado={currentLead.regime_tributario}
              exportaUE={currentLead.exporta_ue_cbam === 'sim'}
              cbamBens={currentLead.cbam_bens}
              enquadramentoSBCE={currentLead.enquadramento_sbce}
              modoRevisao={true}
            />
          </div>
        )}

        {/* 3. PROGRESSO DO DIAGNÓSTICO (5 ETAPAS) */}
        <div className="p-8 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.12)] mb-10 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-heading font-bold text-lg text-[#F4F7FA]">
                ESTEIRA DE CERTIFICAÇÃO & DESCARBONIZAÇÃO (5 FASES)
              </h2>
              <p className="text-xs text-[#93A3B5]">
                Acompanhe o status do seu laudo probatório e homologação de selo.
              </p>
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#12B886]/10 text-[#12B886] border border-[#12B886]/30">
              {nfeList.length > 0 ? '60% CONCLUÍDO' : '40% CONCLUÍDO'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {etapasMetodologia.map((etapa, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-xl border flex flex-col justify-between ${
                  etapa.concluido
                    ? 'bg-[#12B886]/10 border-[#12B886] text-[#F4F7FA]'
                    : idx === 3
                      ? 'bg-[#D9B36C]/10 border-[#D9B36C] text-[#F4F7FA]'
                      : 'bg-[#0A0E12] border-[rgba(244,247,250,0.1)] text-[#93A3B5]'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="font-heading font-bold text-base text-[#12B886]">
                    {etapa.num}
                  </span>
                  {etapa.concluido ? (
                    <CheckCircle2 className="w-4 h-4 text-[#12B886]" />
                  ) : idx === 3 ? (
                    <Clock className="w-4 h-4 text-[#D9B36C] animate-pulse" />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-[#93A3B5]/40" />
                  )}
                </div>
                <div>
                  <div className="text-xs font-semibold leading-tight mb-1">{etapa.label}</div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[#93A3B5]">
                    {etapa.concluido ? 'Concluído' : idx === 3 ? 'Em Análise Pericial' : 'Pendente'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 4. GRID: SELO OBTIDO & LAUDOS EMITIDOS */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-10">
          <div className="lg:col-span-5 p-8 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.12)] flex flex-col justify-between shadow-xl">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Award className="w-6 h-6 text-[#D9B36C]" />
                <h3 className="font-heading font-bold text-lg text-[#F4F7FA]">
                  SELO OFICIAL CONCEDIDO
                </h3>
              </div>

              {currentSelo ? (
                <div className="p-6 rounded-xl bg-gradient-to-b from-[#16202B] to-[#0A0E12] border border-[#12B886] space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-wider text-[#93A3B5] font-semibold">
                      Chancela dMRV
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-[#12B886]/20 text-[#12B886] text-[10px] font-bold uppercase">
                      Ativo
                    </span>
                  </div>

                  <div>
                    <div className="font-heading font-black text-2xl text-[#12B886] tracking-wider">
                      {currentSelo.codigo_selo}
                    </div>
                    <div className="text-xs text-[#F4F7FA] font-medium mt-1">
                      {currentSelo.empresa}
                    </div>
                    <div className="text-[11px] font-mono text-[#D9B36C]">
                      CNPJ: {currentSelo.cnpj}
                    </div>
                  </div>

                  <div className="text-[11px] text-[#93A3B5] border-t border-[rgba(244,247,250,0.08)] pt-3 flex justify-between">
                    <span>Validade até:</span>
                    <span className="text-[#F4F7FA] font-semibold">
                      {new Date(currentSelo.data_validade).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-6 rounded-xl bg-[#0A0E12] border border-dashed border-[rgba(244,247,250,0.15)] text-center text-xs text-[#93A3B5]">
                  Selo oficial em fase de emissão final após conferência das notas e balanço de
                  emissões.
                </div>
              )}
            </div>

            <div className="pt-6">
              <Link
                to="/verificador"
                className="w-full py-3 rounded-xl text-xs font-semibold border border-[rgba(244,247,250,0.2)] text-[#F4F7FA] hover:border-[#12B886] hover:text-[#12B886] transition-all flex items-center justify-center gap-2"
              >
                <span>Consultar no Verificador Público</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          <div className="lg:col-span-7 p-8 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.12)] shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#12B886]" />
                <h3 className="font-heading font-bold text-lg text-[#F4F7FA]">
                  LAUDOS PERICIAIS & DOCUMENTOS EMITIDOS
                </h3>
              </div>
              <span className="text-xs font-mono text-[#93A3B5]">3 documentos</span>
            </div>

            <div className="space-y-3">
              {[
                {
                  titulo: 'Laudo Pericial Preliminar de Descarbonização',
                  tipo: 'Preparatório para o SBCE (Lei 15.042/2024)',
                  data: '15/09/2024',
                  status: 'Homologado',
                  art: 'ART-CREA/CRC 2024-9481',
                },
                {
                  titulo: 'Dossiê Verde para Spread Bancário',
                  tipo: 'Preparação para Exigências ESG de Credores (Res. BCB 4.945/2021)',
                  data: '10/09/2024',
                  status: 'Válido',
                  art: 'Diretrizes PRSAC Instituições Financeiras',
                },
                {
                  titulo: 'Passaporte Digital de Produto (DPP)',
                  tipo: 'Programa MOVER (Lei 14.902/2024)',
                  data: '02/09/2024',
                  status: 'Emitido',
                  art: 'Selo DETRAN Vinculado',
                },
              ].map((doc, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.1)] hover:border-[#12B886]/40 transition-all flex items-center justify-between gap-4"
                >
                  <div>
                    <h4 className="text-xs font-semibold text-[#F4F7FA] mb-0.5">{doc.titulo}</h4>
                    <div className="flex items-center gap-3 text-[11px] text-[#93A3B5]">
                      <span>{doc.tipo}</span>
                      <span>•</span>
                      <span className="text-[#D9B36C]">{doc.art}</span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="inline-block px-2 py-0.5 rounded bg-[#12B886]/20 text-[#12B886] font-bold text-[10px] uppercase">
                      {doc.status}
                    </span>
                    <span className="block text-[10px] text-[#93A3B5] mt-1">{doc.data}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 5. ATALHO AO FINANCEIRO */}
        <div className="p-6 rounded-2xl bg-gradient-to-r from-[#111820] via-[#16202B] to-[#111820] border border-[rgba(244,247,250,0.12)] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h4 className="font-heading font-bold text-base text-[#F4F7FA]">
              PRECISA DE GOVERNANÇA AVANÇADA E SUPORTE A SPED/NF-E EM LOTE?
            </h4>
            <p className="text-xs text-[#93A3B5] mt-0.5">
              Conheça os planos Corporativos com preparação para ERPs e suporte pericial dMRV.
            </p>
          </div>
          <Link
            to="/financeiro"
            className="px-6 py-2.5 rounded-xl text-xs font-bold bg-[#12B886] text-[#0A0E12] hover:bg-[#0CA678] shrink-0"
          >
            Acessar Planos & Faturamento
          </Link>
        </div>
      </div>
    </div>
  )
}
