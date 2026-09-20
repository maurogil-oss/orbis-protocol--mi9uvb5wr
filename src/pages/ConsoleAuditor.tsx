import React, { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import pb from '@/lib/pocketbase/client'
import { useAuth } from '@/contexts/AuthContext'
import { useRealtime } from '@/hooks/use-realtime'
import {
  ShieldCheck,
  FileCheck2,
  Award,
  Clock,
  Search,
  RefreshCw,
  AlertTriangle,
  Globe2,
  Sparkles,
  Bot,
  Flame,
  CheckCircle,
  Eye,
  Mail,
  Phone,
  Building2,
  FileText,
  UserCheck,
  Download,
  Coins,
  Trash2,
} from 'lucide-react'
import { simularGreenCapitalEngine } from '@/services/greenCapitalEngine'
import { exportarRelatorioDossiePdf } from '@/services/relatorioLaudoPdf'
import { calcularComparativoTributario } from '@/services/tributosReforma'

import type { RecordModel } from 'pocketbase'

interface LeadDiagnostico extends RecordModel {
  cnpj: string
  razao_social: string
  responsavel: string
  categoria_profissional: string
  conselho: string
  vinculo_institucional: string
  regime_tributario: string
  status: 'novo' | 'em_analise' | 'concluido'
  email: string
  whatsapp: string
  faixa_emissoes?: string
  enquadramento_sbce?: string
  exporta_ue_cbam?: string
  cbam_bens?: string
  faixa_impacto_tributario?: 'ganho_provavel' | 'neutro' | 'ponto_atencao'
  origem?: 'funil' | 'agente_ia' | 'portal'
  visto_auditor?: boolean
  consentimento_data_hora?: string
  consentimento_ip?: string
  termo_versao?: string
}

export default function ConsoleAuditor() {
  const { user } = useAuth()
  const [leads, setLeads] = useState<LeadDiagnostico[]>([])
  const [selosCount, setSelosCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  // Filtros
  const [statusFilter, setStatusFilter] = useState<'todos' | 'novo' | 'em_analise' | 'concluido'>(
    'todos',
  )
  const [faixaImpactoFilter, setFaixaImpactoFilter] = useState<string>('todos')
  const [exportadorFilter, setExportadorFilter] = useState<string>('todos')
  const [sbceFilter, setSbceFilter] = useState<string>('todos')
  const [origemFilter, setOrigemFilter] = useState<string>('todos')
  const [searchQuery, setSearchQuery] = useState('')
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  // Modal / Detalhes de um lead selecionado
  const [selectedLead, setSelectedLead] = useState<LeadDiagnostico | null>(null)
  const [isExportandoLeadPdf, setIsExportandoLeadPdf] = useState(false)

  // Sub-aba do Console: leads vs lgpd vs credenciamentos
  const [activeTab, setActiveTab] = useState<'leads' | 'lgpd' | 'credenciamentos'>('leads')
  const [solicitacoesLgpd, setSolicitacoesLgpd] = useState<any[]>([])
  const [credenciamentos, setCredenciamentos] = useState<any[]>([])
  const [filtroCredenciamento, setFiltroCredenciamento] = useState<string>('todos')
  const [isProcessandoCred, setIsProcessandoCred] = useState<string | null>(null)
  const [politicasLgpd, setPoliticasLgpd] = useState<any[]>([])
  const [isDescartando, setIsDescartando] = useState(false)
  const [descarteResultado, setDescarteResultado] = useState<string | null>(null)
  const [filtroStatusLgpd, setFiltroStatusLgpd] = useState<string>('todos')

  const loadData = async () => {
    setIsLoading(true)
    try {
      const records = await pb.collection('leads_diagnostico').getFullList<LeadDiagnostico>({
        filter: 'demonstracao != true',
        sort: '-created',
      })
      setLeads(records)

      const totalSelos = await pb.collection('selos').getList(1, 1)
      setSelosCount(totalSelos.totalItems)

      try {
        const sols = await pb.collection('lgpd_solicitacoes').getFullList({ sort: '-created' })
        setSolicitacoesLgpd(sols)
      } catch {
        /* intentionally ignored */
      }

      try {
        const pols = await pb.collection('lgpd_retencoes').getFullList({ sort: 'prazo_meses' })
        setPoliticasLgpd(pols)
      } catch {
        /* intentionally ignored */
      }

      try {
        const creds = await pb
          .collection('perito_credenciamentos')
          .getFullList({ sort: '-created' })
        setCredenciamentos(creds)
      } catch {
        /* intentionally ignored */
      }
    } catch {
      /* intentionally ignored */
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Realtime updates on leads_diagnostico
  useRealtime<LeadDiagnostico>('leads_diagnostico', (data) => {
    if (data.action === 'create') {
      if (!data.record.demonstracao) {
        setLeads((prev) => [data.record, ...prev])
      }
    } else if (data.action === 'update') {
      if (data.record.demonstracao) {
        setLeads((prev) => prev.filter((item) => item.id !== data.record.id))
      } else {
        setLeads((prev) => prev.map((item) => (item.id === data.record.id ? data.record : item)))
      }
    } else if (data.action === 'delete') {
      setLeads((prev) => prev.filter((item) => item.id !== data.record.id))
    }
  })

  // Update lead status
  const handleUpdateStatus = async (
    leadId: string,
    newStatus: 'novo' | 'em_analise' | 'concluido',
  ) => {
    setUpdatingId(leadId)
    try {
      const updated = await pb.collection('leads_diagnostico').update<LeadDiagnostico>(leadId, {
        status: newStatus,
        visto_auditor: true,
      })
      setLeads((prev) => prev.map((l) => (l.id === leadId ? updated : l)))
      if (selectedLead?.id === leadId) setSelectedLead(updated)
    } catch {
      /* intentionally ignored */
    } finally {
      setUpdatingId(null)
    }
  }

  // Gerar e Exportar Laudo Pericial do Cliente selecionado
  const handleExportarLaudoCliente = async (lead: LeadDiagnostico) => {
    setIsExportandoLeadPdf(true)
    try {
      // Comparativo Tributário do Lead
      const comparativo = calcularComparativoTributario({
        regime_tributario: lead.regime_tributario,
        categoria_profissional: lead.categoria_profissional,
        vinculo_institucional: lead.vinculo_institucional,
        faixa_emissoes: lead.faixa_emissoes,
        exporta_ue_cbam: lead.exporta_ue_cbam,
        cbam_bens: lead.cbam_bens,
        razao_social: lead.razao_social,
      })

      // Simulação Green Capital para o porte/perfil do lead
      const simulacao = simularGreenCapitalEngine({
        valorDesejado: 500000,
        prazoMeses: 48,
        finalidade: 'eficiencia_energetica',
        regimeTributario: lead.regime_tributario,
      })

      await exportarRelatorioDossiePdf(
        {
          identificacao: {
            razaoSocial: lead.razao_social,
            cnpj: lead.cnpj,
            responsavel: lead.responsavel,
            categoriaProfissional: lead.categoria_profissional,
            conselho: lead.conselho,
            email: lead.email,
            whatsapp: lead.whatsapp,
            regimeTributario: lead.regime_tributario,
            vinculoInstitucional: lead.vinculo_institucional,
            geradoPorNome: user?.name || user?.email || 'Perito Auditor',
            geradoPorRole: 'perito',
            demonstracao: Boolean(lead.demonstracao),
          },
          diagnostico: {
            enquadramentoSbceTexto: lead.enquadramento_sbce,
            exportaUeCbam: lead.exporta_ue_cbam,
            cbamBens: lead.cbam_bens,
            faixaEmissoes: lead.faixa_emissoes,
          },
          comparativoTributario: comparativo,
          greenCapital: simulacao,
        },
        async (hash, codigo) => {
          if (user?.id) {
            await pb.collection('relatorios_exportados').create({
              usuario: user.id,
              cnpj: lead.cnpj,
              razao_social: lead.razao_social,
              tipo_relatorio: 'dossie_completo_pericial',
              codigo_verificacao: codigo,
              hash_sha256: hash,
              gerado_por_nome: user.name || user.email,
              gerado_por_role: 'perito',
              metadados_json: { peritoAcao: 'emissao_laudo_console_auditor', leadId: lead.id },
            })
          }
        },
      )
    } catch (err: any) {
      alert(err.message || 'Erro ao gerar laudo em PDF.')
    } finally {
      setIsExportandoLeadPdf(false)
    }
  }

  // Ações da aba LGPD: Atualizar status de solicitação do titular
  const handleAtualizarStatusLgpd = async (solId: string, novoStatus: string) => {
    try {
      const resp = prompt(
        'Resposta do Encarregado / Justificativa:',
        'Atendido conforme registro pericial.',
      )
      const updated = await pb.collection('lgpd_solicitacoes').update(solId, {
        status: novoStatus,
        resposta_encarregado: resp || '',
        atendido_por: user?.name || user?.email || 'Encarregado DPO',
      })
      setSolicitacoesLgpd((prev) => prev.map((s) => (s.id === solId ? updated : s)))
    } catch (err: any) {
      alert(err.message || 'Erro ao atualizar solicitação LGPD.')
    }
  }

  // Disparar rotina de descarte server-side
  const handleDispararDescarte = async () => {
    if (
      !confirm(
        'Deseja realmente disparar a rotina server-side de expurgo e anonimização de cadastros vencidos (> 24 meses)?',
      )
    ) {
      return
    }
    setIsDescartando(true)
    setDescarteResultado(null)
    try {
      const res = await fetch(`${pb.baseUrl}/backend/v1/lgpd/descarte-vencidos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: pb.authStore.token,
        },
      })
      const data = await res.json()
      if (res.ok) {
        setDescarteResultado(data.mensagem + ` (Total anonimizados: ${data.total_processados})`)
        loadData()
      } else {
        alert(data.error || 'Erro ao disparar rotina.')
      }
    } catch (err: any) {
      alert(err.message || 'Erro de conexão.')
    } finally {
      setIsDescartando(false)
    }
  }

  // Marcar como visto pelo auditor
  const handleToggleVisto = async (leadId: string, currentVisto: boolean) => {
    try {
      const updated = await pb.collection('leads_diagnostico').update<LeadDiagnostico>(leadId, {
        visto_auditor: !currentVisto,
      })
      setLeads((prev) => prev.map((l) => (l.id === leadId ? updated : l)))
      if (selectedLead?.id === leadId) setSelectedLead(updated)
    } catch {
      /* intentionally ignored */
    }
  }

  // ORDENAÇÃO PRIORIZADA CONFORME SOLICITADO:
  // No topo:
  // (a) Faixa de impacto "Ponto de atenção" (ponto_atencao)
  // (b) Exportadores para a UE (exporta_ue_cbam === 'sim')
  // Em seguida os demais, ordenados por data mais recente
  const sortedAndFilteredLeads = useMemo(() => {
    const filtered = leads.filter((item) => {
      const matchesStatus = statusFilter === 'todos' || item.status === statusFilter

      const matchesFaixa =
        faixaImpactoFilter === 'todos' || item.faixa_impacto_tributario === faixaImpactoFilter

      const matchesExportador =
        exportadorFilter === 'todos' ||
        (exportadorFilter === 'sim' && item.exporta_ue_cbam === 'sim') ||
        (exportadorFilter === 'nao' && item.exporta_ue_cbam !== 'sim')

      const matchesSbce =
        sbceFilter === 'todos' ||
        (sbceFilter === 'acima_25k' && item.faixa_emissoes === 'acima_25k') ||
        (sbceFilter === '10k_25k' && item.faixa_emissoes === 'entre_10k_25k') ||
        (sbceFilter === 'abaixo_10k' && item.faixa_emissoes === 'abaixo_10k')

      const matchesOrigem =
        origemFilter === 'todos' ||
        (origemFilter === 'agente_ia' && item.origem === 'agente_ia') ||
        (origemFilter === 'funil' && (item.origem === 'funil' || !item.origem))

      const matchesSearch =
        item.razao_social.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.cnpj.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.responsavel && item.responsavel.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.email && item.email.toLowerCase().includes(searchQuery.toLowerCase()))

      return (
        matchesStatus &&
        matchesFaixa &&
        matchesExportador &&
        matchesSbce &&
        matchesOrigem &&
        matchesSearch
      )
    })

    // Algoritmo de Priorização:
    // Rank 1: Ponto de atenção E Exportador UE (peso 30)
    // Rank 2: Ponto de atenção (peso 20)
    // Rank 3: Exportador UE (peso 15)
    // Rank 4: Emissão > 25k (peso 5)
    // Rank 5: Demais (peso 0)
    return filtered.sort((a, b) => {
      const getPriorityScore = (l: LeadDiagnostico) => {
        let score = 0
        if (l.faixa_impacto_tributario === 'ponto_atencao') score += 20
        if (l.exporta_ue_cbam === 'sim') score += 15
        if (l.faixa_emissoes === 'acima_25k') score += 5
        return score
      }

      const scoreA = getPriorityScore(a)
      const scoreB = getPriorityScore(b)

      if (scoreA !== scoreB) {
        return scoreB - scoreA // Maior prioridade no topo
      }

      // Desempate por data de criação mais recente
      return new Date(b.created).getTime() - new Date(a.created).getTime()
    })
  }, [
    leads,
    statusFilter,
    faixaImpactoFilter,
    exportadorFilter,
    sbceFilter,
    origemFilter,
    searchQuery,
  ])

  // Contagens para o topo
  const countPontoAtencao = leads.filter(
    (l) => l.faixa_impacto_tributario === 'ponto_atencao',
  ).length
  const countExportadores = leads.filter((l) => l.exporta_ue_cbam === 'sim').length
  const countAgenteIA = leads.filter((l) => l.origem === 'agente_ia').length
  const countNaoVistos = leads.filter((l) => !l.visto_auditor && l.status === 'novo').length

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'novo':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-[#12B886]/10 text-[#12B886] font-semibold text-[10px] uppercase border border-[#12B886]/30">
            Novo
          </span>
        )
      case 'em_analise':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-[#F7B84B]/20 text-[#F7B84B] font-semibold text-[10px] uppercase border border-[#F7B84B]/40">
            Em Análise
          </span>
        )
      case 'concluido':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-[#27C08C]/20 text-[#27C08C] font-semibold text-[10px] uppercase border border-[#27C08C]/40">
            Concluído
          </span>
        )
      default:
        return <span>{status}</span>
    }
  }

  const getImpactoBadge = (faixa?: string) => {
    switch (faixa) {
      case 'ponto_atencao':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#F03E54]/20 text-[#F03E54] font-bold text-[10px] uppercase border border-[#F03E54]/40">
            <AlertTriangle className="w-3 h-3" />
            Ponto de Atenção
          </span>
        )
      case 'ganho_provavel':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#12B886]/20 text-[#12B886] font-bold text-[10px] uppercase border border-[#12B886]/40">
            <Award className="w-3 h-3" />
            Ganho Provável
          </span>
        )
      case 'neutro':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#D9B36C]/20 text-[#D9B36C] font-bold text-[10px] uppercase border border-[#D9B36C]/40">
            Neutro / Adaptativo
          </span>
        )
    }
  }

  return (
    <div className="min-h-screen py-12 md:py-20 bg-[#0A0E12]">
      <div className="max-w-[1300px] mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-[rgba(244,247,250,0.1)]">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#111820] border border-[#D9B36C]/40 text-[#D9B36C] text-xs font-semibold tracking-wider uppercase mb-3">
              <ShieldCheck className="w-4 h-4 text-[#D9B36C]" />
              AMBIENTE PERICIAL • NBC TO 3000 & ART • PAINEL DO AUDITOR
            </div>
            <h1 className="font-heading font-extrabold text-2xl sm:text-4xl text-[#F4F7FA]">
              PAINEL DE LEADS PRIORIZADOS & AUDITORIA
            </h1>
            <p className="text-xs sm:text-sm text-[#93A3B5] mt-1">
              Perito Conectado:{' '}
              <strong className="text-[#F4F7FA]">{user?.name || user?.email}</strong> (Acesso
              restrito a Peritos e Administradores)
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadData}
              className="p-2.5 rounded-lg bg-[#16202B] border border-[rgba(244,247,250,0.15)] text-[#93A3B5] hover:text-[#F4F7FA]"
              title="Atualizar dados"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <Link
              to="/bureau"
              className="px-4 py-2.5 rounded-lg text-xs font-semibold bg-[#16202B] border border-[#12B886]/40 text-[#12B886] hover:bg-[#12B886] hover:text-[#0A0E12] transition-colors"
            >
              Cockpit Bureau ACP
            </Link>
            <Link
              to="/trilhas/peritos-tecnicos"
              className="px-4 py-2.5 rounded-lg text-xs font-semibold bg-[#16202B] border border-[rgba(244,247,250,0.15)] text-[#D9B36C] hover:border-[#D9B36C]"
            >
              Normas da Trilha
            </Link>
          </div>
        </div>

        {/* NAVEGAÇÃO DE ABAS: LEADS vs LGPD */}
        <div className="flex items-center gap-2 mb-8 border-b border-[rgba(244,247,250,0.1)] pb-4">
          <button
            onClick={() => setActiveTab('leads')}
            className={`px-5 py-2.5 rounded-lg text-xs font-bold transition-all uppercase tracking-wider flex items-center gap-2 ${
              activeTab === 'leads'
                ? 'bg-[#12B886] text-[#0A0E12] shadow-emerald-glow'
                : 'text-[#93A3B5] hover:text-[#F4F7FA] hover:bg-[#111820]'
            }`}
          >
            <FileCheck2 className="w-4 h-4" />
            <span>Fila de Leads & Diagnósticos ({leads.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('lgpd')}
            className={`px-5 py-2.5 rounded-lg text-xs font-bold transition-all uppercase tracking-wider flex items-center gap-2 ${
              activeTab === 'lgpd'
                ? 'bg-[#12B886] text-[#0A0E12] shadow-emerald-glow'
                : 'text-[#93A3B5] hover:text-[#F4F7FA] hover:bg-[#111820]'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Gestão LGPD & Canal do Titular ({solicitacoesLgpd.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('credenciamentos')}
            className={`px-5 py-2.5 rounded-lg text-xs font-bold transition-all uppercase tracking-wider flex items-center gap-2 ${
              activeTab === 'credenciamentos'
                ? 'bg-[#12B886] text-[#0A0E12] shadow-emerald-glow'
                : 'text-[#93A3B5] hover:text-[#F4F7FA] hover:bg-[#111820]'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Credenciamentos ART/RRT ({credenciamentos.length})</span>
          </button>
        </div>

        {activeTab === 'credenciamentos' ? (
          /* ABA CREDENCIAMENTOS DE PERITO: FILA DE HOMOLOGAÇÃO ART/RRT */
          <div className="space-y-6 animate-fade-in">
            <div className="p-6 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.12)] space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] font-bold uppercase text-[#12B886] block">
                    Homologação Pericial • CREA / CRC / CRQ
                  </span>
                  <h2 className="font-heading font-extrabold text-xl text-[#F4F7FA]">
                    FILA DE CREDENCIAMENTO DE PERITOS TÉCNICOS
                  </h2>
                  <p className="text-xs text-[#93A3B5] mt-1">
                    Conferência documental de ART/RRT. Ao aprovar, o usuário recebe perfil pericial
                    e instrução para login.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs text-[#93A3B5]">Filtro:</span>
                  <select
                    value={filtroCredenciamento}
                    onChange={(e) => setFiltroCredenciamento(e.target.value)}
                    className="px-3 py-1.5 rounded-lg bg-[#0A0E12] border border-[rgba(244,247,250,0.15)] text-xs text-[#F4F7FA]"
                  >
                    <option value="todos">Todos ({credenciamentos.length})</option>
                    <option value="pendente">Pendentes Primeiro</option>
                    <option value="aprovado">Aprovados</option>
                    <option value="rejeitado">Rejeitados</option>
                  </select>
                </div>
              </div>

              {credenciamentos.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-[rgba(244,247,250,0.15)] rounded-xl bg-[#0A0E12]">
                  <Award className="w-10 h-10 text-[#93A3B5] mx-auto mb-2 opacity-50" />
                  <p className="text-xs text-[#93A3B5]">
                    Nenhum credenciamento de perito registrado.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {credenciamentos
                    .filter(
                      (c) => filtroCredenciamento === 'todos' || c.status === filtroCredenciamento,
                    )
                    .sort((a, b) => {
                      if (a.status === 'pendente' && b.status !== 'pendente') return -1
                      if (b.status === 'pendente' && a.status !== 'pendente') return 1
                      return new Date(b.created).getTime() - new Date(a.created).getTime()
                    })
                    .map((c) => (
                      <div
                        key={c.id}
                        className="p-5 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.1)] hover:border-[rgba(244,247,250,0.25)] space-y-3 text-xs"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[rgba(244,247,250,0.06)] pb-3">
                          <div className="flex items-center gap-3">
                            <span className="font-heading font-bold text-sm text-[#F4F7FA]">
                              {c.nome_completo}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-[#16202B] text-[#D9B36C] font-mono text-[10px] font-bold">
                              {c.conselho_tipo}-{c.registro_uf} {c.registro_profissional}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                                c.status === 'aprovado'
                                  ? 'bg-[#12B886]/20 text-[#12B886] border border-[#12B886]/40'
                                  : c.status === 'rejeitado'
                                    ? 'bg-[#F03E54]/20 text-[#F03E54] border border-[#F03E54]/40'
                                    : 'bg-[#D9B36C]/20 text-[#D9B36C] border border-[#D9B36C]/40'
                              }`}
                            >
                              {c.status}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-[11px]">
                          <div>
                            <span className="text-[#93A3B5] block">CPF:</span>
                            <span className="font-mono text-[#F4F7FA]">{c.cpf}</span>
                          </div>
                          <div>
                            <span className="text-[#93A3B5] block">E-mail:</span>
                            <a
                              href={`mailto:${c.email_corporativo}`}
                              className="text-[#12B886] underline"
                            >
                              {c.email_corporativo}
                            </a>
                          </div>
                          <div>
                            <span className="text-[#93A3B5] block">Telefone:</span>
                            <span className="text-[#F4F7FA]">{c.telefone}</span>
                          </div>
                          <div>
                            <span className="text-[#93A3B5] block">ART / RRT:</span>
                            <span className="font-mono text-[#D9B36C] font-semibold">
                              {c.numero_art_rrt || 'Não informado'}
                            </span>
                          </div>
                        </div>

                        {/* Áreas de Atuação e Arquivo ART */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[rgba(244,247,250,0.06)] text-[11px]">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[#93A3B5]">Áreas Setoriais:</span>
                            {Array.isArray(c.areas_atuacao) &&
                              c.areas_atuacao.map((area: string, aIdx: number) => (
                                <span
                                  key={aIdx}
                                  className="px-1.5 py-0.5 rounded bg-[#16202B] text-[#93A3B5] text-[10px]"
                                >
                                  {area}
                                </span>
                              ))}
                          </div>

                          <div className="flex items-center gap-2">
                            {c.documento_art_pdf && (
                              <a
                                href={`${pb.baseUrl}/api/files/perito_credenciamentos/${c.id}/${c.documento_art_pdf}`}
                                target="_blank"
                                rel="noreferrer"
                                className="px-3 py-1 rounded bg-[#16202B] border border-[rgba(244,247,250,0.15)] text-[#12B886] hover:underline flex items-center gap-1"
                              >
                                <FileCheck2 className="w-3.5 h-3.5" />
                                <span>Ver Documento ART/RRT</span>
                              </a>
                            )}
                          </div>
                        </div>

                        {/* Ações do Auditor */}
                        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#111820] p-3 rounded-xl">
                          <div className="text-[10px] text-[#93A3B5]">
                            Termo: <strong>{c.termo_versao}</strong> • Aceite:{' '}
                            {c.consentimento_data_hora?.slice(0, 16)}
                            {c.observacao_auditor && (
                              <div className="text-[#D9B36C] mt-0.5">
                                Obs: {c.observacao_auditor}
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            {c.status !== 'aprovado' && (
                              <button
                                type="button"
                                disabled={isProcessandoCred === c.id}
                                onClick={async () => {
                                  setIsProcessandoCred(c.id)
                                  try {
                                    await pb.collection('perito_credenciamentos').update(c.id, {
                                      status: 'aprovado',
                                      aprovado_por: user?.email || 'auditor_orbis',
                                      data_decisao: new Date().toISOString(),
                                      observacao_auditor:
                                        'Credenciamento homologado com ART/RRT deferida.',
                                    })
                                    alert(
                                      `Credenciamento aprovado! O perito pode agora acessar com ${c.email_corporativo}.`,
                                    )
                                    loadData()
                                  } catch (err: any) {
                                    alert(err.message || 'Erro ao aprovar')
                                  } finally {
                                    setIsProcessandoCred(null)
                                  }
                                }}
                                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#12B886] text-[#0A0E12] hover:bg-[#0CA678] disabled:opacity-50"
                              >
                                {isProcessandoCred === c.id ? 'Aprovando...' : 'Aprovar Perito'}
                              </button>
                            )}

                            {c.status !== 'rejeitado' && (
                              <button
                                type="button"
                                disabled={isProcessandoCred === c.id}
                                onClick={async () => {
                                  const mot = prompt(
                                    'Motivo da rejeição:',
                                    'Documentação divergente ou ART vencida.',
                                  )
                                  if (!mot) return
                                  setIsProcessandoCred(c.id)
                                  try {
                                    await pb.collection('perito_credenciamentos').update(c.id, {
                                      status: 'rejeitado',
                                      observacao_auditor: mot,
                                      aprovado_por: user?.email || 'auditor_orbis',
                                      data_decisao: new Date().toISOString(),
                                    })
                                    loadData()
                                  } catch (err: any) {
                                    alert(err.message || 'Erro ao rejeitar')
                                  } finally {
                                    setIsProcessandoCred(null)
                                  }
                                }}
                                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#16202B] text-[#F03E54] hover:bg-[#202C3A] disabled:opacity-50"
                              >
                                Rejeitar
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        ) : activeTab === 'lgpd' ? (
          /* ABA LGPD: SOLICITAÇÕES DO ART. 18 E POLÍTICAS DE RETENÇÃO */
          <div className="space-y-8 animate-fade-in">
            {/* Banner de Feedback de Descarte */}
            {descarteResultado && (
              <div className="p-4 rounded-xl bg-[#12B886]/10 border border-[#12B886]/40 text-xs text-[#12B886] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  <span>{descarteResultado}</span>
                </div>
                <button
                  onClick={() => setDescarteResultado(null)}
                  className="text-xs underline text-[#93A3B5] hover:text-[#F4F7FA]"
                >
                  Fechar
                </button>
              </div>
            )}

            {/* Painel de Políticas de Retenção e Gatilho de Descarte */}
            <div className="p-6 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.12)] space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] font-bold uppercase text-[#D9B36C] block">
                    Garantia de Governança & Retenção Probatória
                  </span>
                  <h2 className="font-heading font-extrabold text-xl text-[#F4F7FA]">
                    POLÍTICAS DE RETENÇÃO CATALOGADAS (LGPD_RETENCOES)
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={handleDispararDescarte}
                  disabled={isDescartando}
                  className="px-5 py-2.5 rounded-xl font-bold bg-[#F03E54]/20 border border-[#F03E54]/50 text-[#F03E54] hover:bg-[#F03E54] hover:text-white transition-all text-xs flex items-center gap-2 shrink-0 disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>
                    {isDescartando
                      ? 'Processando expurgo...'
                      : 'Disparar Rotina de Descarte (> 24m)'}
                  </span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {politicasLgpd.map((p) => (
                  <div
                    key={p.id}
                    className="p-4 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.08)] text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#F4F7FA]">{p.tipo_dado}</span>
                      <span className="px-2 py-0.5 rounded bg-[#12B886]/10 text-[#12B886] font-mono font-bold text-[10px]">
                        {p.prazo_meses} meses
                      </span>
                    </div>
                    <p className="text-[11px] text-[#93A3B5]">{p.descricao_dado}</p>
                    <div className="pt-2 text-[10px] text-[#D9B36C]">
                      Base: {p.artigo_legal || p.base_legal}
                    </div>
                    {p.ultimo_expurgo && (
                      <div className="text-[9px] text-[#93A3B5]">
                        Último expurgo: {p.ultimo_expurgo}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Fila de Solicitações do Titular (Art. 18) */}
            <div className="p-6 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.12)] space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] font-bold uppercase text-[#12B886] block">
                    Canal do Titular • Art. 18 da LGPD
                  </span>
                  <h2 className="font-heading font-extrabold text-xl text-[#F4F7FA]">
                    FILA DE SOLICITAÇÕES DO TITULAR (PRAZO LEGAL 15 DIAS)
                  </h2>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#93A3B5]">Status:</span>
                  <select
                    value={filtroStatusLgpd}
                    onChange={(e) => setFiltroStatusLgpd(e.target.value)}
                    className="px-3 py-1.5 rounded-lg bg-[#0A0E12] border border-[rgba(244,247,250,0.15)] text-xs text-[#F4F7FA]"
                  >
                    <option value="todos">Todos ({solicitacoesLgpd.length})</option>
                    <option value="recebido">Recebidos</option>
                    <option value="em_analise">Em Análise</option>
                    <option value="atendido">Atendidos</option>
                    <option value="recusado">Recusados</option>
                  </select>
                </div>
              </div>

              {solicitacoesLgpd.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-[rgba(244,247,250,0.15)] rounded-xl bg-[#0A0E12]">
                  <ShieldCheck className="w-10 h-10 text-[#93A3B5] mx-auto mb-2 opacity-50" />
                  <p className="text-xs text-[#93A3B5]">
                    Nenhuma solicitação de titular registrada no momento.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {solicitacoesLgpd
                    .filter((s) => filtroStatusLgpd === 'todos' || s.status === filtroStatusLgpd)
                    .map((s) => (
                      <div
                        key={s.id}
                        className="p-4 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.1)] hover:border-[rgba(244,247,250,0.25)] space-y-3 text-xs"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[rgba(244,247,250,0.06)] pb-2">
                          <div className="flex items-center gap-3">
                            <span className="font-mono font-bold text-[#D9B36C]">
                              {s.protocolo}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-[#16202B] text-[#F4F7FA] uppercase text-[10px] font-semibold">
                              {s.tipo_pedido?.replace(/_/g, ' ')}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-[#93A3B5]">
                              Limite legal:{' '}
                              <strong className="text-[#12B886]">{s.data_limite_resposta}</strong>{' '}
                              (15 dias)
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                s.status === 'atendido'
                                  ? 'bg-[#12B886]/20 text-[#12B886]'
                                  : s.status === 'recusado'
                                    ? 'bg-[#F03E54]/20 text-[#F03E54]'
                                    : 'bg-[#D9B36C]/20 text-[#D9B36C]'
                              }`}
                            >
                              {s.status}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                          <div>
                            <span className="text-[#93A3B5] block">Titular:</span>
                            <strong className="text-[#F4F7FA]">{s.nome_titular}</strong>
                          </div>
                          <div>
                            <span className="text-[#93A3B5] block">E-mail:</span>
                            <a
                              href={`mailto:${s.email_titular}`}
                              className="text-[#12B886] underline"
                            >
                              {s.email_titular}
                            </a>
                          </div>
                          <div>
                            <span className="text-[#93A3B5] block">CPF/CNPJ:</span>
                            <span className="font-mono text-[#D9B36C]">{s.cpf_cnpj_titular}</span>
                          </div>
                        </div>

                        <div className="p-2.5 rounded bg-[#111820] text-[#93A3B5] text-[11px] leading-relaxed">
                          <strong className="text-[#F4F7FA] block mb-0.5">
                            Descrição do Requerimento:
                          </strong>
                          {s.descricao}
                        </div>

                        {s.resposta_encarregado && (
                          <div className="p-2.5 rounded bg-[#12B886]/10 border border-[#12B886]/20 text-[#12B886] text-[11px]">
                            <strong>Resposta do DPO ({s.atendido_por || 'Encarregado'}):</strong>{' '}
                            {s.resposta_encarregado}
                          </div>
                        )}

                        <div className="flex items-center justify-end gap-2 pt-1">
                          {s.status !== 'atendido' && (
                            <button
                              type="button"
                              onClick={() => handleAtualizarStatusLgpd(s.id, 'atendido')}
                              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#12B886] text-[#0A0E12] hover:bg-[#0CA678]"
                            >
                              Marcar Atendido
                            </button>
                          )}
                          {s.status !== 'em_analise' && s.status !== 'atendido' && (
                            <button
                              type="button"
                              onClick={() => handleAtualizarStatusLgpd(s.id, 'em_analise')}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#16202B] text-[#D9B36C] hover:bg-[#202C3A]"
                            >
                              Em Análise
                            </button>
                          )}
                          {s.status !== 'recusado' && (
                            <button
                              type="button"
                              onClick={() => handleAtualizarStatusLgpd(s.id, 'recusado')}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#16202B] text-[#F03E54] hover:bg-[#202C3A]"
                            >
                              Recusar Pedido
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* ABA LEADS: FILTRO, CARDS E TABELA EXISTENTES */
          <>
            {/* 1. CARDS DE PRIORIDADE / TRIAGEM PERICIAL */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
              <div className="p-5 rounded-2xl bg-[#111820] border border-[#F03E54]/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#F03E54]">
                    Ponto de Atenção
                  </span>
                  <AlertTriangle className="w-4 h-4 text-[#F03E54]" />
                </div>
                <div className="font-heading font-black text-2xl sm:text-3xl text-[#F4F7FA]">
                  {countPontoAtencao}
                </div>
                <span className="text-[10px] text-[#93A3B5] mt-1 block">
                  Prioridade máxima na reforma tributária
                </span>
              </div>

              <div className="p-5 rounded-2xl bg-[#111820] border border-[#12B886]/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#12B886]">
                    Exportadores CBAM (UE)
                  </span>
                  <Globe2 className="w-4 h-4 text-[#12B886]" />
                </div>
                <div className="font-heading font-black text-2xl sm:text-3xl text-[#12B886]">
                  {countExportadores}
                </div>
                <span className="text-[10px] text-[#93A3B5] mt-1 block">
                  Comércio exterior e fronteira de carbono
                </span>
              </div>

              <div className="p-5 rounded-2xl bg-[#111820] border border-[#D9B36C]/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#D9B36C]">
                    Origem Agente IA
                  </span>
                  <Bot className="w-4 h-4 text-[#D9B36C]" />
                </div>
                <div className="font-heading font-black text-2xl sm:text-3xl text-[#D9B36C]">
                  {countAgenteIA}
                </div>
                <span className="text-[10px] text-[#93A3B5] mt-1 block">
                  Pré-qualificados via chat inteligente
                </span>
              </div>

              <div className="p-5 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.12)]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#93A3B5]">
                    Leads Não Vistos
                  </span>
                  <Eye className="w-4 h-4 text-[#F7B84B]" />
                </div>
                <div className="font-heading font-black text-2xl sm:text-3xl text-[#F4F7FA]">
                  {countNaoVistos}
                </div>
                <span className="text-[10px] text-[#93A3B5] mt-1 block">
                  Aguardando primeira leitura
                </span>
              </div>
            </div>

            {/* 2. TABELA PRINCIPAL DE LEADS PRIORIZADOS */}
            <div className="p-6 sm:p-8 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.12)] shadow-xl mb-10">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
                <div>
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-[#D9B36C]" />
                    <h2 className="font-heading font-bold text-lg text-[#F4F7FA]">
                      FILA PRIORIZADA DE LEADS & DIAGNÓSTICOS
                    </h2>
                  </div>
                  <p className="text-xs text-[#93A3B5] mt-0.5">
                    Ordenado automaticamente com{' '}
                    <strong className="text-[#F03E54]">Ponto de atenção</strong> e{' '}
                    <strong className="text-[#12B886]">Exportadores UE (CBAM)</strong> no topo.
                  </p>
                </div>

                {/* Search Bar */}
                <div className="relative w-full lg:w-72">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#93A3B5]" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar empresa, CNPJ, responsável..."
                    className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#0A0E12] border border-[rgba(244,247,250,0.12)] text-xs text-[#F4F7FA] placeholder-[#93A3B5]/60 focus:outline-none focus:ring-1 focus:ring-[#12B886]"
                  />
                </div>
              </div>

              {/* Filtros em Linha */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 mb-6 p-3 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.08)] text-xs">
                {/* Filtro Status */}
                <div>
                  <label className="block text-[10px] uppercase font-bold text-[#93A3B5] mb-1">
                    Status
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="w-full px-2 py-1.5 rounded bg-[#111820] border border-[rgba(244,247,250,0.12)] text-[#F4F7FA] text-xs"
                  >
                    <option value="todos">Todos os status</option>
                    <option value="novo">Novo</option>
                    <option value="em_analise">Em Análise</option>
                    <option value="concluido">Concluído</option>
                  </select>
                </div>

                {/* Filtro Impacto */}
                <div>
                  <label className="block text-[10px] uppercase font-bold text-[#93A3B5] mb-1">
                    Faixa Reforma
                  </label>
                  <select
                    value={faixaImpactoFilter}
                    onChange={(e) => setFaixaImpactoFilter(e.target.value)}
                    className="w-full px-2 py-1.5 rounded bg-[#111820] border border-[rgba(244,247,250,0.12)] text-[#F4F7FA] text-xs"
                  >
                    <option value="todos">Todas as faixas</option>
                    <option value="ponto_atencao">Ponto de Atenção</option>
                    <option value="ganho_provavel">Ganho Provável</option>
                    <option value="neutro">Neutro / Adaptação</option>
                  </select>
                </div>

                {/* Filtro Exportador CBAM */}
                <div>
                  <label className="block text-[10px] uppercase font-bold text-[#93A3B5] mb-1">
                    Exportador UE (CBAM)
                  </label>
                  <select
                    value={exportadorFilter}
                    onChange={(e) => setExportadorFilter(e.target.value)}
                    className="w-full px-2 py-1.5 rounded bg-[#111820] border border-[rgba(244,247,250,0.12)] text-[#F4F7FA] text-xs"
                  >
                    <option value="todos">Todos</option>
                    <option value="sim">Sim (Exporta UE)</option>
                    <option value="nao">Não</option>
                  </select>
                </div>

                {/* Filtro SBCE */}
                <div>
                  <label className="block text-[10px] uppercase font-bold text-[#93A3B5] mb-1">
                    Limiar SBCE
                  </label>
                  <select
                    value={sbceFilter}
                    onChange={(e) => setSbceFilter(e.target.value)}
                    className="w-full px-2 py-1.5 rounded bg-[#111820] border border-[rgba(244,247,250,0.12)] text-[#F4F7FA] text-xs"
                  >
                    <option value="todos">Todos os limiares</option>
                    <option value="acima_25k">&gt; 25.000 tCO₂e (Compensação)</option>
                    <option value="10k_25k">10k a 25k tCO₂e (Reporte)</option>
                    <option value="abaixo_10k">&lt; 10.000 tCO₂e</option>
                  </select>
                </div>

                {/* Filtro Origem */}
                <div>
                  <label className="block text-[10px] uppercase font-bold text-[#93A3B5] mb-1">
                    Origem
                  </label>
                  <select
                    value={origemFilter}
                    onChange={(e) => setOrigemFilter(e.target.value)}
                    className="w-full px-2 py-1.5 rounded bg-[#111820] border border-[rgba(244,247,250,0.12)] text-[#F4F7FA] text-xs"
                  >
                    <option value="todos">Todas origens</option>
                    <option value="agente_ia">Agente IA</option>
                    <option value="funil">Funil Web</option>
                  </select>
                </div>
              </div>

              {/* Tabela de Leads */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-[rgba(244,247,250,0.1)] text-[#93A3B5] uppercase font-semibold">
                    <tr>
                      <th className="py-3 px-3">Empresa / Contato</th>
                      <th className="py-3 px-3">CNPJ / Regime</th>
                      <th className="py-3 px-3">Impacto Reforma</th>
                      <th className="py-3 px-3">Limiar SBCE & CBAM</th>
                      <th className="py-3 px-3">Origem & Status</th>
                      <th className="py-3 px-3 text-right">Ações Periciais</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[rgba(244,247,250,0.06)] text-[#F4F7FA]">
                    {sortedAndFilteredLeads.map((item) => {
                      const isTopPriority =
                        item.faixa_impacto_tributario === 'ponto_atencao' ||
                        item.exporta_ue_cbam === 'sim'

                      return (
                        <tr
                          key={item.id}
                          className={`hover:bg-[#16202B]/60 transition-colors ${
                            isTopPriority ? 'bg-[#16202B]/30' : ''
                          } ${!item.visto_auditor && item.status === 'novo' ? 'font-semibold' : ''}`}
                        >
                          {/* Empresa e Contato */}
                          <td className="py-3.5 px-3">
                            <div className="flex items-center gap-2">
                              {!item.visto_auditor && (
                                <span
                                  className="w-2 h-2 rounded-full bg-[#12B886] shrink-0"
                                  title="Lead novo / não visto pelo auditor"
                                />
                              )}
                              <div>
                                <div
                                  className="font-bold text-[#F4F7FA] hover:text-[#12B886] cursor-pointer flex items-center gap-1.5"
                                  onClick={() => setSelectedLead(item)}
                                >
                                  <span>{item.razao_social}</span>
                                  {isTopPriority && (
                                    <span className="px-1.5 py-0.2 rounded bg-[#F03E54]/20 text-[#F03E54] text-[9px] font-bold uppercase">
                                      Prioritário
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-[#93A3B5] flex items-center gap-3 mt-0.5">
                                  {item.responsavel && (
                                    <span className="flex items-center gap-1">
                                      <UserCheck className="w-3 h-3 text-[#D9B36C]" />
                                      {item.responsavel}
                                    </span>
                                  )}
                                  {item.email && (
                                    <span className="flex items-center gap-1 text-[#93A3B5]">
                                      <Mail className="w-3 h-3" />
                                      {item.email}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* CNPJ e Regime Declarado */}
                          <td className="py-3.5 px-3">
                            <div className="font-mono text-[#D9B36C] font-semibold">
                              {item.cnpj}
                            </div>
                            <div className="text-[10px] text-[#93A3B5]">
                              Regime:{' '}
                              <strong className="text-[#F4F7FA]">
                                {item.regime_tributario || 'A confirmar'}
                              </strong>
                            </div>
                            {item.categoria_profissional && (
                              <div
                                className="text-[10px] text-[#93A3B5]/80 truncate max-w-[160px]"
                                title={item.categoria_profissional}
                              >
                                {item.categoria_profissional}
                              </div>
                            )}
                          </td>

                          {/* Faixa de Impacto Tributário */}
                          <td className="py-3.5 px-3">
                            {getImpactoBadge(item.faixa_impacto_tributario)}
                            <span className="block text-[10px] text-[#93A3B5] mt-1 truncate max-w-[160px]">
                              {item.vinculo_institucional}
                            </span>
                          </td>

                          {/* SBCE e CBAM */}
                          <td className="py-3.5 px-3">
                            <div className="text-[11px]">
                              {item.faixa_emissoes === 'acima_25k' && (
                                <span className="text-[#F03E54] font-semibold flex items-center gap-1">
                                  <Flame className="w-3 h-3" />
                                  &gt; 25k tCO₂e (Metas SBCE)
                                </span>
                              )}
                              {item.faixa_emissoes === 'entre_10k_25k' && (
                                <span className="text-[#D9B36C] font-semibold">
                                  10k–25k tCO₂e (Reporte)
                                </span>
                              )}
                              {item.faixa_emissoes === 'abaixo_10k' && (
                                <span className="text-[#12B886]">&lt; 10k tCO₂e</span>
                              )}
                              {!item.faixa_emissoes && (
                                <span className="text-[#93A3B5]">Triagem pendente</span>
                              )}
                            </div>

                            {item.exporta_ue_cbam === 'sim' ? (
                              <span className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded bg-[#12B886]/20 text-[#12B886] text-[10px] font-bold">
                                <Globe2 className="w-3 h-3" />
                                CBAM UE {item.cbam_bens ? `(${item.cbam_bens})` : ''}
                              </span>
                            ) : (
                              <span className="text-[10px] text-[#93A3B5]">Mercado Interno</span>
                            )}
                          </td>

                          {/* Origem e Status */}
                          <td className="py-3.5 px-3">
                            <div className="flex items-center gap-1.5 mb-1">
                              {item.origem === 'agente_ia' ? (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#D9B36C]/20 text-[#D9B36C] font-bold text-[9px] uppercase border border-[#D9B36C]/40">
                                  <Bot className="w-2.5 h-2.5" />
                                  Agente IA
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#16202B] text-[#93A3B5] text-[9px] uppercase">
                                  Funil Web
                                </span>
                              )}
                            </div>
                            <div>{getStatusBadge(item.status)}</div>
                          </td>

                          {/* Ações */}
                          <td className="py-3.5 px-3 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                onClick={() => handleExportarLaudoCliente(item)}
                                disabled={isExportandoLeadPdf}
                                className="px-2.5 py-1 rounded bg-[#12B886]/10 text-[#12B886] hover:bg-[#12B886] hover:text-[#0A0E12] transition-colors text-[11px] border border-[#12B886]/30 font-semibold flex items-center gap-1"
                                title="Gerar laudo pericial em PDF para entrega ao cliente"
                              >
                                <Download className="w-3 h-3" />
                                <span>PDF</span>
                              </button>

                              <button
                                onClick={() => setSelectedLead(item)}
                                className="px-2.5 py-1 rounded bg-[#16202B] text-[#F4F7FA] hover:bg-[#12B886] hover:text-[#0A0E12] transition-colors text-[11px] border border-[rgba(244,247,250,0.15)] font-semibold"
                                title="Ver detalhes completos do diagnóstico"
                              >
                                Detalhes
                              </button>

                              {item.status !== 'concluido' ? (
                                <button
                                  disabled={updatingId === item.id}
                                  onClick={() => handleUpdateStatus(item.id, 'concluido')}
                                  className="px-2.5 py-1 rounded bg-[#12B886]/10 text-[#12B886] hover:bg-[#12B886] hover:text-[#0A0E12] transition-colors text-[11px] font-semibold border border-[#12B886]/30 disabled:opacity-50"
                                >
                                  Homologar
                                </button>
                              ) : (
                                <button
                                  disabled={updatingId === item.id}
                                  onClick={() => handleUpdateStatus(item.id, 'em_analise')}
                                  className="px-2.5 py-1 rounded bg-[#16202B] text-[#93A3B5] hover:text-[#F4F7FA] transition-colors text-[11px] border border-[rgba(244,247,250,0.1)] disabled:opacity-50"
                                >
                                  Reabrir
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}

                    {sortedAndFilteredLeads.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-10 text-center text-[#93A3B5]">
                          Nenhum diagnóstico encontrado com os filtros selecionados.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 3. MODAL DE DETALHES COMPLETOS DO LEAD SELECIONADO */}
            {selectedLead && (
              <div className="fixed inset-0 z-50 bg-[#0A0E12]/80 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-[#111820] border border-[rgba(244,247,250,0.15)] rounded-2xl max-w-2xl w-full p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto shadow-2xl">
                  <div className="flex items-start justify-between border-b border-[rgba(244,247,250,0.1)] pb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs text-[#D9B36C] font-semibold">
                          CNPJ: {selectedLead.cnpj}
                        </span>
                        {selectedLead.origem === 'agente_ia' && (
                          <span className="px-2 py-0.5 rounded bg-[#D9B36C]/20 text-[#D9B36C] text-[10px] font-bold uppercase">
                            Capturado via Agente IA
                          </span>
                        )}
                      </div>
                      <h3 className="font-heading font-extrabold text-xl text-[#F4F7FA]">
                        {selectedLead.razao_social}
                      </h3>
                    </div>
                    <button
                      onClick={() => setSelectedLead(null)}
                      className="px-3 py-1 rounded-lg bg-[#16202B] text-[#93A3B5] hover:text-[#F4F7FA] text-xs"
                    >
                      Fechar
                    </button>
                  </div>

                  {/* Informações de Contato e Responsável */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="p-3.5 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.08)] space-y-1.5">
                      <span className="text-[10px] font-bold uppercase text-[#93A3B5] block">
                        Dados do Solicitante
                      </span>
                      <div className="text-[#F4F7FA] font-semibold">
                        {selectedLead.responsavel || 'Não informado'}
                      </div>
                      <div className="text-[#93A3B5]">{selectedLead.categoria_profissional}</div>
                      {selectedLead.conselho && (
                        <div className="text-[#D9B36C] font-mono">{selectedLead.conselho}</div>
                      )}
                    </div>

                    <div className="p-3.5 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.08)] space-y-1.5">
                      <span className="text-[10px] font-bold uppercase text-[#93A3B5] block">
                        Canais de Contato
                      </span>
                      <div className="flex items-center gap-2 text-[#F4F7FA]">
                        <Mail className="w-3.5 h-3.5 text-[#12B886]" />
                        <a href={`mailto:${selectedLead.email}`} className="hover:underline">
                          {selectedLead.email || 'Não informado'}
                        </a>
                      </div>
                      <div className="flex items-center gap-2 text-[#F4F7FA]">
                        <Phone className="w-3.5 h-3.5 text-[#12B886]" />
                        <a href={`tel:${selectedLead.whatsapp}`} className="hover:underline">
                          {selectedLead.whatsapp || 'Não informado'}
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Enquadramentos Regulatórios */}
                  <div className="p-4 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.08)] space-y-3 text-xs">
                    <span className="text-[10px] font-bold uppercase text-[#D9B36C] block">
                      Enquadramento Fiscal & Climático
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <span className="text-[#93A3B5] block">Regime Tributário:</span>
                        <strong className="text-[#F4F7FA]">{selectedLead.regime_tributario}</strong>
                      </div>
                      <div>
                        <span className="text-[#93A3B5] block">Vínculo Institucional:</span>
                        <strong className="text-[#F4F7FA]">
                          {selectedLead.vinculo_institucional}
                        </strong>
                      </div>
                      <div>
                        <span className="text-[#93A3B5] block">Limiar de Emissões (SBCE):</span>
                        <strong className="text-[#D9B36C]">
                          {selectedLead.enquadramento_sbce ||
                            selectedLead.faixa_emissoes ||
                            'Pendente'}
                        </strong>
                      </div>
                      <div>
                        <span className="text-[#93A3B5] block">Exportação para a UE (CBAM):</span>
                        <strong className="text-[#12B886]">
                          {selectedLead.exporta_ue_cbam === 'sim'
                            ? `Sim (${selectedLead.cbam_bens || 'bens industriais'})`
                            : 'Não exporta'}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Trilha de Consentimento LGPD Completa */}
                  <div className="p-4 rounded-xl bg-[#0A0E12] border border-[#12B886]/30 space-y-2 text-xs">
                    <div className="flex items-center gap-1.5 text-[#12B886] font-semibold text-[11px] uppercase tracking-wider">
                      <ShieldCheck className="w-4 h-4 text-[#12B886]" />
                      <span>Trilha de Consentimento LGPD (Auditoria Probatória)</span>
                    </div>
                    <div className="bg-[#111820] p-3 rounded-lg border border-[rgba(244,247,250,0.08)] text-[#93A3B5] space-y-1 text-xs">
                      <div>
                        <strong className="text-[#F4F7FA]">Consentimento:</strong> aceito em{' '}
                        <span className="text-[#12B886]">
                          {selectedLead.consentimento_data_hora
                            ? new Date(selectedLead.consentimento_data_hora).toLocaleString(
                                'pt-BR',
                                { timeZone: 'UTC' },
                              ) + ' UTC'
                            : selectedLead.created
                              ? new Date(selectedLead.created).toLocaleString('pt-BR')
                              : 'Data de criação do lead'}
                        </span>{' '}
                        • IP{' '}
                        <span className="font-mono text-[#D9B36C]">
                          {selectedLead.consentimento_ip || '127.0.0.1 (Origem Auditada)'}
                        </span>{' '}
                        • termo{' '}
                        <span className="font-mono text-[#F4F7FA]">
                          {selectedLead.termo_versao || 'v2026-01'}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#93A3B5]/80 pt-1 border-t border-[rgba(244,247,250,0.05)]">
                        Finalidade: análise preliminar de elegibilidade tributária, triagem de
                        emissões e emissão do protocolo pericial (Art. 7º, I e V da Lei
                        13.709/2018).
                      </div>
                    </div>
                  </div>

                  {/* Botões do Modal */}
                  <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-[rgba(244,247,250,0.1)]">
                    <button
                      type="button"
                      onClick={() =>
                        handleToggleVisto(selectedLead.id, !!selectedLead.visto_auditor)
                      }
                      className="w-full sm:w-auto px-4 py-2 rounded-lg text-xs font-semibold bg-[#16202B] text-[#93A3B5] hover:text-[#F4F7FA] border border-[rgba(244,247,250,0.1)] flex items-center justify-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>
                        {selectedLead.visto_auditor ? 'Marcar como não lido' : 'Marcar como visto'}
                      </span>
                    </button>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={() => handleExportarLaudoCliente(selectedLead)}
                        disabled={isExportandoLeadPdf}
                        className="w-full sm:w-auto px-4 py-2.5 rounded-lg text-xs font-bold bg-[#12B886] text-[#0A0E12] hover:bg-[#0CA678] transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Exportar Laudo PDF</span>
                      </button>

                      {selectedLead.status !== 'concluido' ? (
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(selectedLead.id, 'concluido')}
                          className="w-full sm:w-auto px-5 py-2.5 rounded-lg text-xs font-bold bg-[#16202B] border border-[#12B886] text-[#12B886] hover:bg-[#12B886] hover:text-[#0A0E12] transition-colors"
                        >
                          Homologar
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(selectedLead.id, 'em_analise')}
                          className="w-full sm:w-auto px-5 py-2.5 rounded-lg text-xs font-semibold bg-[#16202B] text-[#93A3B5] hover:text-[#F4F7FA] border border-[rgba(244,247,250,0.1)]"
                        >
                          Reabrir
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
