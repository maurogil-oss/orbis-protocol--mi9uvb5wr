import React, { useState, useEffect } from 'react'
import pb from '@/lib/pocketbase/client'
import { useRealtime } from '@/hooks/use-realtime'
import {
  ShieldCheck,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Building,
  Calendar,
  FileCheck2,
  QrCode,
  Sparkles,
  ArrowRight,
} from 'lucide-react'

import type { RecordModel } from 'pocketbase'

interface SeloRecord extends RecordModel {
  codigo_selo: string
  empresa: string
  cnpj: string
  status: 'ativo' | 'expirado' | 'revogado'
  data_emissao: string
  data_validade: string
}

export default function Verificador() {
  const [codigoInput, setCodigoInput] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [seloEncontrado, setSeloEncontrado] = useState<SeloRecord | null>(null)
  const [hasSearched, setHasSearched] = useState(false)
  const [todosSelos, setTodosSelos] = useState<SeloRecord[]>([])

  // Load initial list of known active seals
  const loadSelos = async () => {
    try {
      const records = await pb.collection('selos').getFullList<SeloRecord>({
        sort: '-created',
      })
      setTodosSelos(records)
    } catch {
      /* intentionally ignored */
    }
  }

  useEffect(() => {
    loadSelos()
  }, [])

  // Realtime updates for selos collection
  useRealtime<SeloRecord>('selos', (data) => {
    if (data.action === 'create') {
      setTodosSelos((prev) => [data.record, ...prev])
    } else if (data.action === 'update') {
      setTodosSelos((prev) => prev.map((s) => (s.id === data.record.id ? data.record : s)))
      // Update currently viewed seal if it was changed
      if (seloEncontrado && seloEncontrado.id === data.record.id) {
        setSeloEncontrado(data.record)
      }
    } else if (data.action === 'delete') {
      setTodosSelos((prev) => prev.filter((s) => s.id !== data.record.id))
      if (seloEncontrado && seloEncontrado.id === data.record.id) {
        setSeloEncontrado(null)
      }
    }
  })

  const handleSearch = async (e?: React.FormEvent, customCode?: string) => {
    if (e) e.preventDefault()
    const targetCode = (customCode !== undefined ? customCode : codigoInput).trim().toUpperCase()

    if (!targetCode) return

    setIsSearching(true)
    setHasSearched(true)

    try {
      const record = await pb
        .collection('selos')
        .getFirstListItem<SeloRecord>(`codigo_selo ~ '${targetCode}' || cnpj ~ '${targetCode}'`)
      setSeloEncontrado(record)
    } catch (_) {
      setSeloEncontrado(null)
    } finally {
      setIsSearching(false)
    }
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '—'
    try {
      const d = new Date(dateStr)
      return d.toLocaleDateString('pt-BR')
    } catch (_) {
      return dateStr
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ativo':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#12B886]/20 text-[#12B886] font-bold text-xs uppercase border border-[#12B886]/40">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Válido / Ativo
          </span>
        )
      case 'expirado':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F7B84B]/20 text-[#F7B84B] font-bold text-xs uppercase border border-[#F7B84B]/40">
            <AlertTriangle className="w-3.5 h-3.5" />
            Expirado
          </span>
        )
      case 'revogado':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F03E54]/20 text-[#F03E54] font-bold text-xs uppercase border border-[#F03E54]/40">
            <XCircle className="w-3.5 h-3.5" />
            Revogado / Inválido
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#93A3B5]/20 text-[#93A3B5] text-xs">
            {status}
          </span>
        )
    }
  }

  return (
    <div className="min-h-screen py-12 md:py-20 bg-[#0A0E12]">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="max-w-3xl mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#111820] border border-[#12B886]/40 text-[#12B886] text-xs font-semibold tracking-wider uppercase mb-4">
            <ShieldCheck className="w-4 h-4 text-[#12B886]" />
            PORTAL PÚBLICO DE TRANSPARÊNCIA
          </div>
          <h1 className="font-heading font-extrabold text-2xl sm:text-4xl md:text-5xl text-[#F4F7FA] tracking-wide mb-4">
            VERIFICADOR PÚBLICO DE SELOS
          </h1>
          <p className="text-base sm:text-lg text-[#93A3B5] leading-relaxed">
            Consulte a autenticidade e validade jurídica de qualquer Selo Oficial Orbis Protocol
            emitido para comprovação de descarbonização, enquadramento ao SBCE e créditos do
            Programa MOVER.
          </p>
        </div>

        {/* Verification Form Card */}
        <div className="p-8 sm:p-10 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.12)] mb-12 shadow-2xl max-w-3xl">
          <form onSubmit={handleSearch} className="space-y-4">
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#93A3B5]">
              Código do Selo ou CNPJ da Empresa:
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-[#93A3B5]" />
                <input
                  type="text"
                  value={codigoInput}
                  onChange={(e) => setCodigoInput(e.target.value)}
                  placeholder="Ex.: ORB-2024-0001 ou 76.123.456/0001-12"
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.15)] text-[#F4F7FA] placeholder-[#93A3B5]/50 focus:outline-none focus:ring-2 focus:ring-[#12B886]"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={isSearching}
                className="px-8 py-3.5 rounded-xl font-bold bg-[#12B886] text-[#0A0E12] hover:bg-[#0CA678] transition-all shadow-emerald-glow flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSearching ? 'Verificando...' : 'Verificar Selo'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>

          {/* Quick Click examples */}
          <div className="mt-6 pt-5 border-t border-[rgba(244,247,250,0.08)]">
            <span className="text-xs text-[#93A3B5] mr-2">Exemplos cadastrados para teste:</span>
            <div className="flex flex-wrap gap-2 mt-2">
              {['ORB-2024-0001', 'ORB-2024-0002', 'ORB-2024-0003'].map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => {
                    setCodigoInput(code)
                    handleSearch(undefined, code)
                  }}
                  className="px-3 py-1 rounded-lg bg-[#16202B] border border-[rgba(244,247,250,0.1)] text-xs text-[#12B886] hover:border-[#12B886] transition-colors font-mono"
                >
                  {code}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Verification Result Card */}
        {hasSearched && (
          <div className="max-w-3xl mb-16 animate-fade-in">
            {seloEncontrado ? (
              <div className="p-8 rounded-2xl bg-gradient-to-b from-[#111820] to-[#16202B] border-2 border-[#12B886] shadow-emerald-glow space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[rgba(244,247,250,0.1)]">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#D9B36C] block mb-1">
                      REGISTRO CRIPTOGRÁFICO dMRV
                    </span>
                    <h2 className="font-heading font-extrabold text-2xl text-[#F4F7FA]">
                      {seloEncontrado.codigo_selo}
                    </h2>
                  </div>
                  <div>{getStatusBadge(seloEncontrado.status)}</div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
                  <div>
                    <span className="text-[#93A3B5] block mb-1 uppercase font-semibold">
                      Razão Social / Titular:
                    </span>
                    <div className="text-sm font-bold text-[#F4F7FA]">{seloEncontrado.empresa}</div>
                  </div>

                  <div>
                    <span className="text-[#93A3B5] block mb-1 uppercase font-semibold">
                      CNPJ Auditado:
                    </span>
                    <div className="text-sm font-mono text-[#D9B36C]">{seloEncontrado.cnpj}</div>
                  </div>

                  <div>
                    <span className="text-[#93A3B5] block mb-1 uppercase font-semibold">
                      Data de Emissão:
                    </span>
                    <div className="text-sm text-[#F4F7FA]">
                      {formatDate(seloEncontrado.data_emissao)}
                    </div>
                  </div>

                  <div>
                    <span className="text-[#93A3B5] block mb-1 uppercase font-semibold">
                      Validade do Selo:
                    </span>
                    <div className="text-sm font-semibold text-[#12B886]">
                      {formatDate(seloEncontrado.data_validade)}
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.08)] flex items-center justify-between text-xs text-[#93A3B5]">
                  <span className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#12B886]" />
                    Chancela dMRV Orbis Protocol • Registro Permanente em Banco de Dados
                  </span>
                  <span className="text-[11px] font-mono text-[#93A3B5]">
                    ID: {seloEncontrado.id}
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-8 rounded-2xl bg-[#111820] border border-[#F03E54]/30 text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-[#F03E54]/10 border border-[#F03E54] flex items-center justify-center text-[#F03E54] mx-auto">
                  <XCircle className="w-7 h-7" />
                </div>
                <h3 className="font-heading font-bold text-lg text-[#F4F7FA]">
                  Esse selo não foi encontrado em nossos registros.
                </h3>
                <p className="text-xs text-[#93A3B5] max-w-md mx-auto">
                  Verifique se o código foi digitado corretamente ou se o CNPJ consultado possui um
                  protocolo de certificação concluído.
                </p>
              </div>
            )}
          </div>
        )}

        {/* List of currently active registered seals */}
        <div className="p-8 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.12)]">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-heading font-bold text-lg text-[#F4F7FA]">
                SELOS OFICIAIS RECENTES (EM TEMPO REAL)
              </h3>
              <p className="text-xs text-[#93A3B5]">
                Atualização instantânea via realtime PocketBase.
              </p>
            </div>
            <span className="text-xs font-mono px-2.5 py-1 rounded bg-[#16202B] text-[#12B886]">
              {todosSelos.length} registrados
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[rgba(244,247,250,0.1)] text-[#93A3B5] uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">Código</th>
                  <th className="py-3 px-4">Empresa</th>
                  <th className="py-3 px-4">CNPJ</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Validade</th>
                  <th className="py-3 px-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(244,247,250,0.06)] text-[#F4F7FA]">
                {todosSelos.map((s) => (
                  <tr key={s.id} className="hover:bg-[#16202B]/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-[#12B886]">
                      {s.codigo_selo}
                    </td>
                    <td className="py-3 px-4 font-medium">{s.empresa}</td>
                    <td className="py-3 px-4 font-mono text-[#93A3B5]">{s.cnpj}</td>
                    <td className="py-3 px-4">{getStatusBadge(s.status)}</td>
                    <td className="py-3 px-4 text-[#93A3B5]">{formatDate(s.data_validade)}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => {
                          setCodigoInput(s.codigo_selo)
                          handleSearch(undefined, s.codigo_selo)
                          window.scrollTo({ top: 300, behavior: 'smooth' })
                        }}
                        className="text-xs text-[#12B886] hover:underline font-semibold"
                      >
                        Consultar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
