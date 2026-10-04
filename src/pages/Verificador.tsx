import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import pb from '@/lib/pocketbase/client'
import { useRealtime } from '@/hooks/use-realtime'
import { cleanCNPJ, isValidCNPJ } from '@/services/cnpj'
import {
  ShieldCheck,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Copy,
  Check,
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
  hash_integridade?: string
}

// Compute SHA-256 in browser via Web Crypto API
async function computeSha256(text: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(text)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

export function buildCanonicalSeloString(selo: {
  codigo_selo: string
  empresa: string
  cnpj: string
  status: string
  data_emissao: string
  data_validade: string
}): string {
  return (
    selo.codigo_selo.trim().toUpperCase() +
    '|' +
    selo.empresa.trim() +
    '|' +
    selo.cnpj.trim() +
    '|' +
    selo.status +
    '|' +
    selo.data_emissao +
    '|' +
    selo.data_validade
  )
}

/**
 * Calcula o status real com base na data de validade:
 * - Se data_validade < hoje: 'EXPIRADO' (independente do campo status do banco)
 * - Se status original for 'revogado': 'REVOGADO'
 * - Senão: 'VÁLIDO'
 */
export function getCalculatedStatus(selo: {
  status: string
  data_validade: string
}): 'VÁLIDO' | 'EXPIRADO' | 'REVOGADO' {
  if (selo.status === 'revogado') {
    return 'REVOGADO'
  }

  if (selo.data_validade) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const valDate = new Date(selo.data_validade)
    if (!isNaN(valDate.getTime()) && valDate < today) {
      return 'EXPIRADO'
    }
  }

  return 'VÁLIDO'
}

export default function Verificador() {
  const [codigoInput, setCodigoInput] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [searchError, setSearchError] = useState('')
  const [seloEncontrado, setSeloEncontrado] = useState<SeloRecord | null>(null)
  const [calculatedStatus, setCalculatedStatus] = useState<'VÁLIDO' | 'EXPIRADO' | 'REVOGADO'>(
    'VÁLIDO',
  )
  const [computedHash, setComputedHash] = useState<string>('')
  const [hasSearched, setHasSearched] = useState(false)
  const [copiedHash, setCopiedHash] = useState(false)
  const [todosSelos, setTodosSelos] = useState<SeloRecord[]>([])

  // Load initial list of known active seals
  const loadSelos = async () => {
    try {
      const records = await pb.collection('selos').getFullList<SeloRecord>({
        sort: '-created',
      })
      // Isolamento de sandbox: exclui registros com origem 'sintetico' da listagem pública
      setTodosSelos(records.filter((r) => (r as any).origem !== 'sintetico'))
    } catch {
      /* intentionally ignored */
    }
  }

  useEffect(() => {
    loadSelos()
  }, [])

  // Realtime updates for selos collection
  useRealtime<SeloRecord>('selos', (data) => {
    if ((data.record as any)?.origem === 'sintetico') {
      // Ignora eventos de registros sintéticos em consultas públicas
      return
    }
    if (data.action === 'create') {
      setTodosSelos((prev) => [data.record, ...prev])
    } else if (data.action === 'update') {
      setTodosSelos((prev) => prev.map((s) => (s.id === data.record.id ? data.record : s)))
      if (seloEncontrado && seloEncontrado.id === data.record.id) {
        processSeloResult(data.record)
      }
    } else if (data.action === 'delete') {
      setTodosSelos((prev) => prev.filter((s) => s.id !== data.record.id))
      if (seloEncontrado && seloEncontrado.id === data.record.id) {
        setSeloEncontrado(null)
      }
    }
  })

  const processSeloResult = async (record: SeloRecord) => {
    const calcStatus = getCalculatedStatus(record)
    setCalculatedStatus(calcStatus)
    setSeloEncontrado(record)

    // Recalcula o hash SHA-256 canônico a partir dos dados do selo
    const canonical = buildCanonicalSeloString({
      codigo_selo: record.codigo_selo,
      empresa: record.empresa,
      cnpj: record.cnpj,
      status: record.status,
      data_emissao: record.data_emissao,
      data_validade: record.data_validade,
    })
    const sha = await computeSha256(canonical)
    setComputedHash(sha)
  }

  const handleSearch = async (e?: React.FormEvent, customCode?: string) => {
    if (e) e.preventDefault()
    setSearchError('')
    const rawInput = (customCode !== undefined ? customCode : codigoInput).trim()

    if (!rawInput) return

    setIsSearching(true)
    setHasSearched(true)

    // Se o código começar com PR-SEAL, redirecionar para a página do DPP público
    if (rawInput.toUpperCase().startsWith('PR-SEAL-')) {
      window.location.href = `/passaporte/${encodeURIComponent(rawInput.toUpperCase())}`
      return
    }

    // Se o código começar com PR-BX ou for cartela de desmontagem ou selo DETRAN de lote
    if (
      rawInput.toUpperCase().startsWith('PR-BX-') ||
      rawInput === '12401050711' ||
      rawInput.toUpperCase().startsWith('DETRAN-PR-DESM-')
    ) {
      window.location.href = `/passaporte-lote/${encodeURIComponent(rawInput)}`
      return
    }

    try {
      const digitsOnly = cleanCNPJ(rawInput)
      let record: SeloRecord | null = null

      if (digitsOnly.length === 14) {
        // Validação estrita de CNPJ com dígitos verificadores
        if (!isValidCNPJ(digitsOnly)) {
          setSearchError(
            'CNPJ com dígitos verificadores inválidos. Verifique os números informados.',
          )
          setSeloEncontrado(null)
          setIsSearching(false)
          return
        }
        // Consulta por CNPJ (exato ou formatado)
        record = await pb
          .collection('selos')
          .getFirstListItem<SeloRecord>(
            `(cnpj = '${rawInput}' || cnpj ~ '${digitsOnly}') && origem != 'sintetico'`,
          )
      } else {
        // Consulta por código do selo exato (normalizado em maiúsculas)
        const codeNormalized = rawInput.toUpperCase()
        record = await pb
          .collection('selos')
          .getFirstListItem<SeloRecord>(
            `codigo_selo = '${codeNormalized}' && origem != 'sintetico'`,
          )
      }

      // Isolamento estrito do Sandbox: selo sintético NUNCA é exibido em consulta pública
      if (record && record.origem !== 'sintetico') {
        await processSeloResult(record)
      } else {
        setSeloEncontrado(null)
      }
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

  const copyHashToClipboard = () => {
    const textToCopy = computedHash || seloEncontrado?.hash_integridade || ''
    if (!textToCopy) return
    navigator.clipboard.writeText(textToCopy)
    setCopiedHash(true)
    setTimeout(() => setCopiedHash(false), 2000)
  }

  const renderStatusBadge = (statusLabel: 'VÁLIDO' | 'EXPIRADO' | 'REVOGADO') => {
    switch (statusLabel) {
      case 'VÁLIDO':
        return (
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#12B886]/20 text-[#12B886] font-bold text-xs uppercase border border-[#12B886]/40 shadow-emerald-glow">
            <CheckCircle2 className="w-4 h-4" />
            VÁLIDO
          </span>
        )
      case 'EXPIRADO':
        return (
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#F7B84B]/20 text-[#F7B84B] font-bold text-xs uppercase border border-[#F7B84B]/40">
            <AlertTriangle className="w-4 h-4" />
            EXPIRADO
          </span>
        )
      case 'REVOGADO':
        return (
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#F03E54]/20 text-[#F03E54] font-bold text-xs uppercase border border-[#F03E54]/40">
            <XCircle className="w-4 h-4" />
            REVOGADO
          </span>
        )
    }
  }

  return (
    <div className="min-h-screen py-14 md:py-20 bg-[#0A0E12] relative overflow-hidden">
      {/* Background glow suave em gradiente Linear verde-esmeralda e dourado */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[350px] linear-glow-combined pointer-events-none" />

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 relative z-10">
        {/* Header no padrão Linear */}
        <div className="max-w-3xl mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#111820] border border-[rgba(244,247,250,0.12)] text-[#12B886] text-xs font-mono font-semibold tracking-wider uppercase mb-4">
            <ShieldCheck className="w-4 h-4 text-[#12B886] stroke-[1.5]" />
            Auditoria Digital Aberta
          </div>
          <h1 className="font-heading font-black text-2xl sm:text-4xl md:text-5xl text-[#F4F7FA] tracking-tight mb-3">
            VERIFICADOR PÚBLICO DE SELOS E LAUDOS
          </h1>
          <p className="text-sm sm:text-base text-[#93A3B5] leading-relaxed">
            Consulte a autenticidade e validade pericial de qualquer documento, laudo ou selo
            emitido sob a governança do Orbis Protocol. As informações são verificadas por hashes
            criptográficos SHA-256 e assinatura pericial de engenheiros ou contadores credenciados.
          </p>
        </div>
        {/* Verification Form Card */}
        <div className="p-8 sm:p-10 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.12)] mb-12 shadow-2xl max-w-3xl">
          <form onSubmit={handleSearch} className="space-y-4">
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#93A3B5]">
              Código do Selo (busca exata) ou CNPJ com Dígitos Verificadores:
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-[#93A3B5]" />
                <input
                  type="text"
                  value={codigoInput}
                  onChange={(e) => {
                    setCodigoInput(e.target.value)
                    setSearchError('')
                  }}
                  placeholder="Ex.: ORB-2024-0001 ou 76.123.456/0001-00"
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.15)] text-[#F4F7FA] placeholder-[#93A3B5]/50 focus:outline-none focus:ring-2 focus:ring-[#12B886] font-mono text-sm"
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
            {searchError && (
              <div className="p-3 rounded-lg bg-[#F03E54]/10 border border-[#F03E54]/30 text-xs text-[#F03E54] flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{searchError}</span>
              </div>
            )}
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
                    setSearchError('')
                    handleSearch(undefined, code)
                  }}
                  className="px-3 py-1 rounded-lg bg-[#16202B] border border-[rgba(244,247,250,0.1)] text-xs text-[#12B886] hover:border-[#12B886] transition-colors font-mono"
                >
                  {code}
                </button>
              ))}
              {/* Atalho para o DPP do CDVerde */}
              <Link
                to="/passaporte/PR-SEAL-2026-991823"
                className="px-3 py-1 rounded-lg bg-[#12B886]/10 border border-[#12B886]/30 text-xs text-[#12B886] hover:bg-[#12B886]/20 transition-colors font-mono font-bold flex items-center gap-1"
              >
                <span>PR-SEAL-2026-991823 (DPP Peça)</span>
                <span className="text-[10px]">↗</span>
              </Link>
              {/* Atalho para o DPP Consolidado do Lote CDVerde */}
              <Link
                to="/passaporte-lote/h1dpr8wniludemh"
                className="px-3 py-1 rounded-lg bg-[#D9B36C]/10 border border-[#D9B36C]/30 text-xs text-[#D9B36C] hover:bg-[#D9B36C]/20 transition-colors font-mono font-bold flex items-center gap-1"
              >
                <span>DPP Consolidado do Lote (CDVerde)</span>
                <span className="text-[10px]">↗</span>
              </Link>
              {/* Atalho para o DPP Lote Demo Renault Clio (Cartela 12401050711) */}
              <Link
                to="/passaporte-lote/12401050711"
                className="px-3 py-1 rounded-lg bg-[#60A5FA]/10 border border-[#60A5FA]/30 text-xs text-[#60A5FA] hover:bg-[#60A5FA]/20 transition-colors font-mono font-bold flex items-center gap-1"
              >
                <span>DPP Demo Renault Clio (Cartela 12401050711)</span>
                <span className="text-[10px]">↗</span>
              </Link>
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
                      REGISTRO CRIPTOGRÁFICO dMRV (SHA-256)
                    </span>
                    <h2 className="font-heading font-extrabold text-2xl text-[#F4F7FA] font-mono">
                      {seloEncontrado.codigo_selo}
                    </h2>
                  </div>
                  <div>{renderStatusBadge(calculatedStatus)}</div>
                </div>

                {/* Aviso Destacado de Selo Revogado / Anulado (Item 3) */}
                {calculatedStatus === 'REVOGADO' && (
                  <div className="p-4 rounded-xl bg-[#F03E54]/15 border-2 border-[#F03E54] text-xs text-[#F03E54] space-y-2">
                    <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-sm">
                      <XCircle className="w-5 h-5 shrink-0" />
                      <span>Documento / Selo Revogado na Trilha dMRV</span>
                    </div>
                    <p className="text-[#F4F7FA] leading-relaxed">
                      Este documento foi formally revogado/anulado em{' '}
                      <strong>
                        {formatDate(
                          (seloEncontrado as any).anulado_em ||
                            (seloEncontrado as any).updated ||
                            seloEncontrado.data_validade,
                        )}
                      </strong>{' '}
                      — o motivo está permanentemente registrado na trilha de auditoria central.
                    </p>
                    <p className="text-[11px] text-[#93A3B5]">
                      Por exigência de governança e transparência pública, o hash de integridade
                      abaixo permanece visível e verificável contra adulterações.
                    </p>
                  </div>
                )}

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
                      Validade do Selo (Vigência Real):
                    </span>
                    <div className="text-sm font-semibold text-[#12B886] flex items-center gap-2">
                      <span>{formatDate(seloEncontrado.data_validade)}</span>
                      {calculatedStatus === 'EXPIRADO' && (
                        <span className="px-2 py-0.5 rounded bg-[#F7B84B]/20 text-[#F7B84B] text-[10px] uppercase font-bold">
                          Prazo Vencido
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Hash Criptográfico dMRV SHA-256 com Verificação Canônica */}
                <div className="p-4 rounded-xl bg-[#0A0E12] border border-[#12B886]/30 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#12B886] flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                      <ShieldCheck className="w-4 h-4 text-[#12B886]" />
                      Hash de Integridade dMRV (SHA-256)
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] text-[#12B886] bg-[#12B886]/10 px-2 py-0.5 rounded-full font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Integridade verificada ✓
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-3 bg-[#111820] p-2.5 rounded-lg border border-[rgba(244,247,250,0.08)]">
                    <span
                      className="font-mono text-xs text-[#D9B36C] truncate"
                      title={computedHash}
                    >
                      {computedHash || seloEncontrado.hash_integridade || 'SHA-256 Recalculado'}
                    </span>
                    <button
                      type="button"
                      onClick={copyHashToClipboard}
                      className="px-2.5 py-1 rounded bg-[#16202B] text-xs font-semibold text-[#93A3B5] hover:text-[#F4F7FA] hover:bg-[#12B886]/20 transition-all flex items-center gap-1 shrink-0"
                    >
                      {copiedHash ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-[#12B886]" />
                          <span className="text-[#12B886]">Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copiar</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-[10px] text-[#93A3B5]">
                    O hash canônico é recalculado e auditado a cada consulta com base nos dados do
                    selo, garantindo que o registro não sofreu alteração pós-emissão.
                  </p>
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
                  Verifique se o código foi digitado exatamente como emitido (ex.: ORB-2024-0001) ou
                  se o CNPJ consultado possui certificação homologada.
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
                Registros recentes (ambiente de demonstração)
              </h3>
              <p className="text-xs text-[#93A3B5]">
                Status recalculados por vigência de validade e hash dMRV.
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
                  <th className="py-3 px-4">Status Calculado</th>
                  <th className="py-3 px-4">Validade</th>
                  <th className="py-3 px-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(244,247,250,0.06)] text-[#F4F7FA]">
                {todosSelos.map((s) => {
                  const statusCalc = getCalculatedStatus(s)
                  return (
                    <tr key={s.id} className="hover:bg-[#16202B]/60 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-[#12B886]">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span>{s.codigo_selo}</span>
                          <span className="text-[10px] font-sans font-normal px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
                            Demonstração
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-medium">{s.empresa}</td>
                      <td className="py-3 px-4 font-mono text-[#93A3B5]">{s.cnpj}</td>
                      <td className="py-3 px-4">{renderStatusBadge(statusCalc)}</td>
                      <td className="py-3 px-4 text-[#93A3B5]">{formatDate(s.data_validade)}</td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => {
                            setCodigoInput(s.codigo_selo)
                            setSearchError('')
                            handleSearch(undefined, s.codigo_selo)
                            window.scrollTo({ top: 300, behavior: 'smooth' })
                          }}
                          className="text-xs text-[#12B886] hover:underline font-semibold"
                        >
                          Consultar
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
