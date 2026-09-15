import React, { useState, useEffect } from 'react'
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
  ArrowRight,
  TrendingDown,
  Building,
  CreditCard,
  Layers,
  ChevronRight,
  ExternalLink,
} from 'lucide-react'

import type { RecordModel } from 'pocketbase'

interface LeadDiagnostico extends RecordModel {
  cnpj: string
  razao_social: string
  status: 'novo' | 'em_analise' | 'concluido'
  regime_tributario: string
  categoria_profissional: string
  vinculo_institucional: string
  usuario?: string
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
  const [isLoading, setIsLoading] = useState(true)

  // 5 Steps of Methodology Progress
  const etapasMetodologia = [
    { num: '01', label: 'Diagnóstico Setorial', concluido: true },
    { num: '02', label: 'Fatores Oficiais MCTI', concluido: true },
    { num: '03', label: 'Ingestão SPED/NF-e', concluido: true },
    { num: '04', label: 'Emissão de Laudos', concluido: false },
    { num: '05', label: 'Selo Oficial Concedido', concluido: false },
  ]

  const loadData = async () => {
    setIsLoading(true)
    try {
      // Find leads for this user or first lead
      const leadsList = await pb.collection('leads_diagnostico').getList<LeadDiagnostico>(1, 10, {
        sort: '-created',
      })
      setLeads(leadsList.items)

      // Find seals
      const selosList = await pb.collection('selos').getList<SeloRecord>(1, 5, {
        sort: '-created',
      })
      setSelos(selosList.items)
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

  const currentLead = leads[0]
  const currentSelo = selos[0]

  return (
    <div className="min-h-screen py-12 md:py-20 bg-[#0A0E12]">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10 pb-6 border-b border-[rgba(244,247,250,0.1)]">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#111820] border border-[#12B886]/40 text-[#12B886] text-xs font-semibold tracking-wider uppercase mb-3">
              <ShieldCheck className="w-4 h-4" />
              PAINEL DO CLIENTE • AMBIENTE AUTENTICADO
            </div>
            <h1 className="font-heading font-extrabold text-2xl sm:text-4xl text-[#F4F7FA]">
              VISÃO GERAL DO PROTOCOLO
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

        {/* 1. PROGRESSO DO DIAGNÓSTICO (5 ETAPAS) */}
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
              60% CONCLUÍDO
            </span>
          </div>

          {/* Steps Timeline Grid */}
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

        {/* 2. GRID: SELO OBTIDO & LAUDOS EMITIDOS */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-10">
          {/* Selo Card (Col 1..5) */}
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
                  Selo oficial em fase de emissão final.
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

          {/* Documentos & Laudos Emitidos (Col 6..12) */}
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
                  tipo: 'Conformidade SBCE (Lei 15.042/2024)',
                  data: '15/09/2024',
                  status: 'Homologado',
                  art: 'ART-CREA/CRC 2024-9481',
                },
                {
                  titulo: 'Dossiê Verde para Spread Bancário',
                  tipo: 'Resolução Bacen 4.945 / PRSAC',
                  data: '10/09/2024',
                  status: 'Válido',
                  art: 'Conforme Diretrizes Bacen',
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

        {/* 3. ATALHO AO FINANCEIRO */}
        <div className="p-6 rounded-2xl bg-gradient-to-r from-[#111820] via-[#16202B] to-[#111820] border border-[rgba(244,247,250,0.12)] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h4 className="font-heading font-bold text-base text-[#F4F7FA]">
              PRECISA EXPANDIR O VOLUME DE NF-E AUDITADAS?
            </h4>
            <p className="text-xs text-[#93A3B5] mt-0.5">
              Faça upgrade para o plano Corporativo e tenha ingestão contínua com conector
              SAP/Totvs.
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
