import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import pb from '@/lib/pocketbase/client'
import { useAuth } from '@/contexts/AuthContext'
import { useRealtime } from '@/hooks/use-realtime'
import {
  ShieldCheck,
  FileCheck2,
  Users,
  Award,
  AlertCircle,
  Clock,
  CheckCircle2,
  Lock,
  ArrowUpRight,
  Filter,
  Search,
  RefreshCw,
} from 'lucide-react'

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
}

export default function ConsoleAuditor() {
  const { user } = useAuth()
  const [leads, setLeads] = useState<LeadDiagnostico[]>([])
  const [selosCount, setSelosCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<'todos' | 'novo' | 'em_analise' | 'concluido'>(
    'todos',
  )
  const [searchQuery, setSearchQuery] = useState('')
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const loadData = async () => {
    setIsLoading(true)
    try {
      const records = await pb.collection('leads_diagnostico').getFullList<LeadDiagnostico>({
        sort: '-created',
      })
      setLeads(records)

      const totalSelos = await pb.collection('selos').getList(1, 1)
      setSelosCount(totalSelos.totalItems)
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
      setLeads((prev) => [data.record, ...prev])
    } else if (data.action === 'update') {
      setLeads((prev) => prev.map((item) => (item.id === data.record.id ? data.record : item)))
    } else if (data.action === 'delete') {
      setLeads((prev) => prev.filter((item) => item.id !== data.record.id))
    }
  })

  // Update lead status (e.g. from 'novo' to 'em_analise' or 'concluido')
  const handleUpdateStatus = async (
    leadId: string,
    newStatus: 'novo' | 'em_analise' | 'concluido',
  ) => {
    setUpdatingId(leadId)
    try {
      const updated = await pb.collection('leads_diagnostico').update<LeadDiagnostico>(leadId, {
        status: newStatus,
      })
      setLeads((prev) => prev.map((l) => (l.id === leadId ? updated : l)))
    } catch {
      /* intentionally ignored */
    } finally {
      setUpdatingId(null)
    }
  }

  // Filtered Leads
  const filteredLeads = leads.filter((item) => {
    const matchesStatus = statusFilter === 'todos' || item.status === statusFilter
    const matchesSearch =
      item.razao_social.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.cnpj.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.responsavel && item.responsavel.toLowerCase().includes(searchQuery.toLowerCase()))
    return matchesStatus && matchesSearch
  })

  const countEmAnalise = leads.filter(
    (l) => l.status === 'em_analise' || l.status === 'novo',
  ).length
  const countConcluidos = leads.filter((l) => l.status === 'concluido').length

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

  return (
    <div className="min-h-screen py-12 md:py-20 bg-[#0A0E12]">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10 pb-6 border-b border-[rgba(244,247,250,0.1)]">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#111820] border border-[#D9B36C]/40 text-[#D9B36C] text-xs font-semibold tracking-wider uppercase mb-3">
              <ShieldCheck className="w-4 h-4 text-[#D9B36C]" />
              AMBIENTE PERICIAL • NBC TO 3000 & ART
            </div>
            <h1 className="font-heading font-extrabold text-2xl sm:text-4xl text-[#F4F7FA]">
              CONSOLE DO AUDITOR & PERITO TÉCNICO
            </h1>
            <p className="text-xs sm:text-sm text-[#93A3B5] mt-1">
              Perito Conectado:{' '}
              <strong className="text-[#F4F7FA]">{user?.name || user?.email}</strong> (Registro
              Nacional dMRV)
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadData}
              className="p-2.5 rounded-lg bg-[#16202B] border border-[rgba(244,247,250,0.15)] text-[#93A3B5] hover:text-[#F4F7FA]"
              title="Atualizar dados"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <Link
              to="/trilhas/peritos-tecnicos"
              className="px-4 py-2.5 rounded-lg text-xs font-semibold bg-[#16202B] border border-[rgba(244,247,250,0.15)] text-[#D9B36C] hover:border-[#D9B36C]"
            >
              Normas da Trilha
            </Link>
          </div>
        </div>

        {/* 1. MÉTRICAS PERICIAIS CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
          <div className="p-6 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.12)]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#93A3B5]">
                Diagnósticos em Análise
              </span>
              <div className="w-9 h-9 rounded-lg bg-[#16202B] flex items-center justify-center text-[#F7B84B]">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="font-heading font-black text-3xl sm:text-4xl text-[#F4F7FA]">
              {countEmAnalise}
            </div>
            <span className="text-[11px] text-[#93A3B5] mt-1 block">
              Aguardando parecer técnico pericial
            </span>
          </div>

          <div className="p-6 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.12)]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#93A3B5]">
                Laudos Emitidos & Concluídos
              </span>
              <div className="w-9 h-9 rounded-lg bg-[#16202B] flex items-center justify-center text-[#12B886]">
                <FileCheck2 className="w-4 h-4" />
              </div>
            </div>
            <div className="font-heading font-black text-3xl sm:text-4xl text-[#12B886]">
              {countConcluidos}
            </div>
            <span className="text-[11px] text-[#93A3B5] mt-1 block">
              Comprovados com fé pública e ART
            </span>
          </div>

          <div className="p-6 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.12)]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#93A3B5]">
                Selos Ativos Homologados
              </span>
              <div className="w-9 h-9 rounded-lg bg-[#16202B] flex items-center justify-center text-[#D9B36C]">
                <Award className="w-4 h-4" />
              </div>
            </div>
            <div className="font-heading font-black text-3xl sm:text-4xl text-[#D9B36C]">
              {selosCount}
            </div>
            <span className="text-[11px] text-[#93A3B5] mt-1 block">
              Consultáveis no verificador público
            </span>
          </div>
        </div>

        {/* 2. TABELA DE REGISTROS DE LEADS / DIAGNÓSTICOS */}
        <div className="p-8 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.12)] shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="font-heading font-bold text-lg text-[#F4F7FA]">
                FILA DE DIAGNÓSTICOS POR CNPJ (`leads_diagnostico`)
              </h2>
              <p className="text-xs text-[#93A3B5]">
                Registros persistidos e sincronizados em tempo real via PocketBase.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#93A3B5]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar CNPJ ou empresa..."
                  className="pl-9 pr-3 py-1.5 rounded-lg bg-[#0A0E12] border border-[rgba(244,247,250,0.12)] text-xs text-[#F4F7FA] placeholder-[#93A3B5]/60 focus:outline-none focus:ring-1 focus:ring-[#12B886]"
                />
              </div>

              {/* Status Filters */}
              <div className="flex items-center gap-1 bg-[#0A0E12] p-1 rounded-lg border border-[rgba(244,247,250,0.1)] text-xs">
                {(['todos', 'novo', 'em_analise', 'concluido'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-3 py-1 rounded-md text-[11px] font-medium transition-colors uppercase ${
                      statusFilter === st
                        ? 'bg-[#12B886] text-[#0A0E12] font-bold'
                        : 'text-[#93A3B5] hover:text-[#F4F7FA]'
                    }`}
                  >
                    {st === 'todos' ? 'Todos' : st === 'em_analise' ? 'Em Análise' : st}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[rgba(244,247,250,0.1)] text-[#93A3B5] uppercase font-semibold">
                <tr>
                  <th className="py-3 px-3">Empresa / Razão Social</th>
                  <th className="py-3 px-3">CNPJ</th>
                  <th className="py-3 px-3">Responsável & Conselho</th>
                  <th className="py-3 px-3">Vínculo / Regime</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Alterar Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(244,247,250,0.06)] text-[#F4F7FA]">
                {filteredLeads.map((item) => (
                  <tr key={item.id} className="hover:bg-[#16202B]/60 transition-colors">
                    <td className="py-3.5 px-3">
                      <div className="font-semibold text-[#F4F7FA]">{item.razao_social}</div>
                      <div className="text-[11px] text-[#93A3B5]">{item.email}</div>
                    </td>
                    <td className="py-3.5 px-3 font-mono text-[#D9B36C]">{item.cnpj}</td>
                    <td className="py-3.5 px-3">
                      <div>{item.responsavel || '—'}</div>
                      <div className="text-[10px] text-[#93A3B5]">
                        {item.categoria_profissional} {item.conselho ? `(${item.conselho})` : ''}
                      </div>
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="text-[11px]">{item.vinculo_institucional}</div>
                      <span className="text-[10px] text-[#93A3B5] font-mono">
                        {item.regime_tributario}
                      </span>
                    </td>
                    <td className="py-3.5 px-3">{getStatusBadge(item.status)}</td>
                    <td className="py-3.5 px-3 text-right">
                      <div className="inline-flex items-center gap-1">
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
                ))}
                {filteredLeads.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-[#93A3B5]">
                      Nenhum diagnóstico encontrado com os filtros selecionados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
