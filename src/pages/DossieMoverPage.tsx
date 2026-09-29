import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  ShieldCheck,
  AlertCircle,
  Copy,
  Check,
  FileText,
  Lock,
  Layers,
  Search,
  ExternalLink,
  RefreshCw,
  Award,
  ChevronRight,
  FileCheck2,
  BookOpen,
  Calendar,
  Filter,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import {
  listarMoverVpas,
  listarMoverEvidencias,
  MoverVpaRecord,
  MoverEvidenciaRecord,
  RESERVA_METODOLOGICA_PRE_LAUDO,
  DECLARACAO_PIONEIRISMO_DEFENSAVEL,
  TEXTO_MATRIZ_DUPLA_CONTAGEM,
  BASELINE_REGIONAL_STATUS,
} from '@/services/moverService'
import { SecaoAvaliacaoAdicionalidade } from '@/components/SecaoAvaliacaoAdicionalidade'
import { obterMoverAmpliadoHabilitado } from '@/services/platformSettingsService'

export function DossieMoverPage() {
  const { user } = useAuth()
  const [vpas, setVpas] = useState<MoverVpaRecord[]>([])
  const [evidencias, setEvidencias] = useState<MoverEvidenciaRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [copiadoHash, setCopiadoHash] = useState<string | null>(null)
  const [filtroCategoria, setFiltroCategoria] = useState<string>('todos')
  const [termoBusca, setTermoBusca] = useState('')
  const [moverHabilitado, setMoverHabilitado] = useState(true)
  const [loteReferenciaId, setLoteReferenciaId] = useState('c1jz14hgmf7n13i')

  useEffect(() => {
    carregarDados()
  }, [])

  const carregarDados = async () => {
    setIsLoading(true)
    try {
      const [vpaList, evidList, hab] = await Promise.all([
        listarMoverVpas(),
        listarMoverEvidencias(),
        obterMoverAmpliadoHabilitado(),
      ])
      setVpas(vpaList)
      setEvidencias(evidList)
      setMoverHabilitado(hab)
    } catch {
      /* fallback controlado */
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopiar = (hash: string, id: string) => {
    navigator.clipboard.writeText(hash)
    setCopiadoHash(id)
    setTimeout(() => setCopiadoHash(null), 3000)
  }

  const evidenciasFiltradas = evidencias.filter((e) => {
    const matchCat = filtroCategoria === 'todos' || e.categoria === filtroCategoria
    const matchBusca =
      e.titulo.toLowerCase().includes(termoBusca.toLowerCase()) ||
      e.codigo_documento.toLowerCase().includes(termoBusca.toLowerCase()) ||
      e.hash_sha256.toLowerCase().includes(termoBusca.toLowerCase())
    return matchCat && matchBusca
  })

  return (
    <div className="min-h-screen py-10 md:py-16 bg-slate-50 dark:bg-[#0A0E12] text-slate-900 dark:text-[#F4F7FA] transition-colors">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 space-y-10">
        {/* Banner Superior de Reserva Metodológica e Status de Auditoria */}
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-[#16202B]/80 border border-[#D9B36C]/40 text-xs text-amber-900 dark:text-[#D9B36C] flex items-start gap-3 shadow-lg">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-[#D9B36C] mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold uppercase tracking-wider block">
              Área Restrita • Dossiê Probatório do Projeto (Metodologia GS 448 & Lei 14.902/2024)
            </span>
            <p className="text-slate-600 dark:text-[#93A3B5] leading-relaxed">
              {RESERVA_METODOLOGICA_PRE_LAUDO}
            </p>
          </div>
        </div>

        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-[rgba(244,247,250,0.1)] pb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-[#16202B] border border-[#12B886]/40 text-[#12B886] text-xs font-bold uppercase tracking-wider mb-2">
              <Lock className="w-3.5 h-3.5 text-[#12B886]" />
              CAMADA 3 • AMBIENTE AUTENTICADO DE GOVERNANÇA
            </div>
            <h1 className="font-heading font-extrabold text-2xl sm:text-4xl text-slate-900 dark:text-[#F4F7FA]">
              DOSSIÊ DO PROJETO MOVER (GS 448)
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-[#93A3B5] mt-1 max-w-3xl">
              Repositório institucional e probatório para validação por VVB (Validation and
              Verification Body — Organismo de Validação e Verificação). Status real de VPAs,
              modelagem de linha de base, matriz de salvaguarda de dupla contagem e ledger de
              evidências com hash SHA-256 canônico.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={carregarDados}
              className="p-2.5 rounded-lg bg-white dark:bg-[#16202B] border border-slate-200 dark:border-[rgba(244,247,250,0.15)] text-slate-600 dark:text-[#93A3B5] hover:text-slate-900 dark:hover:text-[#F4F7FA] transition-colors"
              title="Atualizar dados do dossiê"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <Link
              to="/mover"
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-[rgba(244,247,250,0.2)] text-slate-900 dark:text-[#F4F7FA] hover:border-[#12B886] hover:text-[#12B886] transition-all text-xs uppercase font-bold tracking-wider bg-white dark:bg-[#111820]"
            >
              Página Pública /mover
            </Link>
          </div>
        </div>

        {/* SEÇÃO INTEGRADA: AVALIAÇÃO DE ADICIONALIDADE PERICIAL (MOVER / GS 448) */}
        <SecaoAvaliacaoAdicionalidade
          loteId={loteReferenciaId}
          moverHabilitado={moverHabilitado}
          forceExibir={true}
          readOnly={false}
        />

        {/* 1. SEÇÃO STATUS DAS VPAs (ÁREAS DE PROJETO VOLUNTÁRIO) */}
        <section className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#111820] border border-slate-200 dark:border-[rgba(244,247,250,0.12)] space-y-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-[rgba(244,247,250,0.08)] pb-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#12B886] block">
                Áreas de Projeto Voluntário
              </span>
              <h2 className="font-heading font-extrabold text-xl sm:text-2xl text-slate-900 dark:text-[#F4F7FA] mt-1">
                STATUS DOS VPAs (VOLUNTARY PROJECT ACTIVITIES)
              </h2>
            </div>
            <span className="text-[11px] font-mono text-amber-800 dark:text-[#D9B36C] bg-amber-50 dark:bg-[#D9B36C]/10 px-3 py-1 rounded border border-amber-200 dark:border-[#D9B36C]/30 self-start sm:self-auto">
              Estado Honesto • Sem Dados Fictícios
            </span>
          </div>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-[#93A3B5] leading-relaxed">
            As Áreas de Projeto Voluntário (VPAs) representam as Centrais de Desmontagem Veicular
            (CDVs) individuais que alimentam o programa agrupado sob a metodologia GS 448. O
            programa encontra-se em estágio inicial transparente:
          </p>

          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-[rgba(244,247,250,0.08)] bg-slate-50 dark:bg-[#0A0E12]">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-[rgba(244,247,250,0.08)] bg-slate-100/70 dark:bg-[#16202B]/60 text-slate-600 dark:text-[#93A3B5]">
                  <th className="py-3 px-4 font-semibold">Código VPA</th>
                  <th className="py-3 px-4 font-semibold">Título / Identificação</th>
                  <th className="py-3 px-4 font-semibold">CDV Operador</th>
                  <th className="py-3 px-4 font-semibold">UF</th>
                  <th className="py-3 px-4 font-semibold">Estágio Atual</th>
                  <th className="py-3 px-4 font-semibold">Selo CDV Conforme</th>
                  <th className="py-3 px-4 font-semibold text-right">Hash SHA-256</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-[rgba(244,247,250,0.05)] text-slate-900 dark:text-[#F4F7FA]">
                {vpas.map((vpa) => (
                  <tr
                    key={vpa.id}
                    className="hover:bg-slate-100/60 dark:hover:bg-[#16202B]/30 transition-colors"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-amber-700 dark:text-[#D9B36C]">
                      {vpa.codigo_vpa}
                    </td>
                    <td className="py-3 px-4 font-medium">
                      <div>{vpa.titulo}</div>
                      {vpa.observacoes && (
                        <div className="text-[11px] text-slate-500 dark:text-[#93A3B5] mt-0.5 line-clamp-1">
                          {vpa.observacoes}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-[#93A3B5]">{vpa.cdv_nome}</td>
                    <td className="py-3 px-4 font-mono">{vpa.uf || 'BR'}</td>
                    <td className="py-3 px-4">
                      {vpa.estagio === 'aberto_candidatos' && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-50 dark:bg-[#3B82F6]/15 text-blue-700 dark:text-[#3B82F6] border border-blue-200 dark:border-[#3B82F6]/30">
                          Cadastro Aberto — Aguardando Candidatos
                        </span>
                      )}
                      {vpa.estagio === 'identificada' && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-50 dark:bg-[#D9B36C]/15 text-amber-800 dark:text-[#D9B36C] border border-amber-200 dark:border-[#D9B36C]/30">
                          Identificada
                        </span>
                      )}
                      {vpa.estagio === 'em_due_diligence' && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-50 dark:bg-[#12B886]/15 text-emerald-700 dark:text-[#12B886] border border-emerald-200 dark:border-[#12B886]/30">
                          Em Due Diligence
                        </span>
                      )}
                      {vpa.estagio === 'em_estruturacao' && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-50 dark:bg-[#F59E0B]/15 text-amber-800 dark:text-[#F59E0B] border border-amber-200 dark:border-[#F59E0B]/30">
                          Em Estruturação
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {vpa.status_selo_cdv_conforme === 'obtido' ? (
                        <span className="text-[#12B886] font-bold">✓ Obtido</span>
                      ) : (
                        <span className="text-amber-700 dark:text-[#D9B36C] font-semibold">
                          Pendente
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleCopiar(vpa.hash_sha256, vpa.id)}
                        className="px-2 py-1 rounded bg-slate-100 dark:bg-[#16202B] hover:bg-slate-200 dark:hover:bg-[#1f2d3d] text-slate-600 dark:text-[#93A3B5] hover:text-slate-900 dark:hover:text-[#F4F7FA] font-mono text-[10px] inline-flex items-center gap-1"
                        title={vpa.hash_sha256}
                      >
                        {copiadoHash === vpa.id ? (
                          <Check className="w-3 h-3 text-[#12B886]" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                        <span>{vpa.hash_sha256.slice(0, 10)}...</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* 2. SEÇÃO DE BASELINE REGIONAL (ESTUDO PENDENTE) */}
        <section className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#111820] border border-slate-200 dark:border-[rgba(244,247,250,0.12)] space-y-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-[rgba(244,247,250,0.08)] pb-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-[#D9B36C] block">
                Linha de Base Regional (GS 448)
              </span>
              <h2 className="font-heading font-extrabold text-xl sm:text-2xl text-slate-900 dark:text-[#F4F7FA] mt-1">
                {BASELINE_REGIONAL_STATUS.titulo}
              </h2>
            </div>
            <span className="px-3 py-1 rounded-full bg-amber-50 dark:bg-[#D9B36C]/15 border border-amber-200 dark:border-[#D9B36C]/40 text-amber-800 dark:text-[#D9B36C] font-mono text-xs font-bold self-start sm:self-auto">
              Status: {BASELINE_REGIONAL_STATUS.status}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0A0E12] border border-slate-200 dark:border-[rgba(244,247,250,0.08)] space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-[#F4F7FA]">
              <BookOpen className="w-4 h-4 text-[#12B886]" />
              <span>Responsável Metodológico Planejado:</span>
              <span className="text-amber-700 dark:text-[#D9B36C] font-semibold">
                {BASELINE_REGIONAL_STATUS.responsavel_planejado}
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-[#93A3B5] leading-relaxed">
              {BASELINE_REGIONAL_STATUS.resumo_metodologico}
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="font-heading font-bold text-sm text-slate-900 dark:text-[#F4F7FA] uppercase tracking-wide">
              Entregáveis Previstos no Termo de Referência:
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {BASELINE_REGIONAL_STATUS.entregaveis_previstos.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0A0E12] border border-slate-200 dark:border-[rgba(244,247,250,0.06)] flex items-start gap-3"
                >
                  <span className="w-5 h-5 rounded bg-slate-200 dark:bg-[#16202B] text-[#12B886] font-mono text-xs flex items-center justify-center flex-shrink-0">
                    {idx + 1}
                  </span>
                  <span className="text-xs text-slate-600 dark:text-[#93A3B5] leading-snug">
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-100 dark:bg-[#070A0D] border-l-4 border-[#3B82F6] text-xs text-slate-600 dark:text-[#93A3B5]">
            <strong className="text-[#3B82F6] block mb-0.5">Nota de Governança:</strong>
            {BASELINE_REGIONAL_STATUS.aviso_transparencia}
          </div>
        </section>

        {/* 3. SEÇÃO MATRIZ DE DUPLA CONTAGEM & ATRIBUIÇÃO DE TITULARIDADE */}
        <section className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#111820] border border-slate-200 dark:border-[rgba(244,247,250,0.12)] space-y-6 shadow-sm">
          <div className="border-b border-slate-200 dark:border-[rgba(244,247,250,0.08)] pb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-[#12B886] block">
              Integridade Regulatória & Blindagem Jurídica
            </span>
            <h2 className="font-heading font-extrabold text-xl sm:text-2xl text-slate-900 dark:text-[#F4F7FA] mt-1">
              {TEXTO_MATRIZ_DUPLA_CONTAGEM.titulo}
            </h2>
            <div className="text-xs font-mono text-amber-700 dark:text-[#D9B36C] mt-1">
              Normas de Referência: {TEXTO_MATRIZ_DUPLA_CONTAGEM.normas_referencia}
            </div>
          </div>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-[#93A3B5] leading-relaxed">
            {TEXTO_MATRIZ_DUPLA_CONTAGEM.sumario}
          </p>

          {/* Cláusula Formal em Destaque */}
          <div className="p-5 rounded-xl bg-slate-50 dark:bg-[#0A0E12] border border-[#12B886]/40 shadow-inner space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#12B886]">
              <ShieldCheck className="w-4 h-4 text-[#12B886]" />
              Declaração Formal de Titularidade (Cláusula Regulatória Padrão)
            </div>
            <p className="text-xs sm:text-sm text-slate-800 dark:text-[#F4F7FA] leading-relaxed italic bg-white dark:bg-[#111820]/60 p-3 rounded-lg border border-slate-200 dark:border-[rgba(244,247,250,0.06)] font-serif">
              "{TEXTO_MATRIZ_DUPLA_CONTAGEM.clausula_titularidade}"
            </p>
            <span className="text-[11px] text-slate-500 dark:text-[#93A3B5] block">
              * Redação de alinhamento jurídico preliminar, em processo de homologação consultiva.
            </span>
          </div>

          {/* 4 Mecanismos de Controle */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {TEXTO_MATRIZ_DUPLA_CONTAGEM.mecanismos_controle.map((m, i) => (
              <div
                key={i}
                className="p-4 rounded-xl bg-slate-50 dark:bg-[#0A0E12] border border-slate-200 dark:border-[rgba(244,247,250,0.08)] space-y-1.5"
              >
                <h4 className="font-heading font-bold text-sm text-slate-900 dark:text-[#F4F7FA] flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#12B886]" />
                  {m.mecanismo}
                </h4>
                <p className="text-xs text-slate-600 dark:text-[#93A3B5] leading-relaxed">
                  {m.descricao}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* 4. SEÇÃO REPOSITÓRIO DE EVIDÊNCIAS PROBATÓRIAS (COM HASH SHA-256) */}
        <section className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#111820] border border-slate-200 dark:border-[rgba(244,247,250,0.12)] space-y-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-[rgba(244,247,250,0.08)] pb-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#12B886] block">
                Cadeia de Custódia Imutável
              </span>
              <h2 className="font-heading font-extrabold text-xl sm:text-2xl text-slate-900 dark:text-[#F4F7FA] mt-1">
                REPOSITÓRIO DE EVIDÊNCIAS & LEDGER CRIPTOGRÁFICO
              </h2>
              <p className="text-xs text-slate-600 dark:text-[#93A3B5] mt-1">
                Lista oficial de peças técnicas, minutas e passaportes públicos (DPP) com hashes
                verificáveis.
              </p>
            </div>

            {/* Filtros rápidos por categoria */}
            <div className="flex flex-wrap items-center gap-2">
              {[
                { id: 'todos', label: 'Todos' },
                { id: 'metodologia', label: 'Metodologia' },
                { id: 'balanco_massa', label: 'Balanço de Massa' },
                { id: 'dupla_contagem', label: 'Dupla Contagem' },
              ].map((c) => (
                <button
                  key={c.id}
                  onClick={() => setFiltroCategoria(c.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    filtroCategoria === c.id
                      ? 'bg-[#12B886] text-[#0A0E12]'
                      : 'bg-slate-100 dark:bg-[#16202B] text-slate-600 dark:text-[#93A3B5] hover:text-slate-900 dark:hover:text-[#F4F7FA]'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Barra de Busca de Evidências */}
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 dark:text-[#93A3B5] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={termoBusca}
              onChange={(e) => setTermoBusca(e.target.value)}
              placeholder="Buscar por código, título ou hash SHA-256..."
              className="w-full pl-9 pr-4 py-2 rounded-lg bg-slate-50 dark:bg-[#0A0E12] border border-slate-300 dark:border-[rgba(244,247,250,0.15)] text-xs text-slate-900 dark:text-[#F4F7FA] focus:outline-none focus:ring-2 focus:ring-[#12B886]"
            />
          </div>

          {/* Cards de Evidências Mobile-First */}
          <div className="space-y-3">
            {evidenciasFiltradas.length === 0 ? (
              <div className="text-center py-12 text-xs text-slate-500 dark:text-[#93A3B5]">
                Nenhuma evidência localizada com os filtros selecionados.
              </div>
            ) : (
              evidenciasFiltradas.map((evid) => (
                <div
                  key={evid.id}
                  className="p-4 sm:p-5 rounded-xl bg-slate-50 dark:bg-[#0A0E12] border border-slate-200 dark:border-[rgba(244,247,250,0.08)] hover:border-[#12B886]/40 transition-all space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-[rgba(244,247,250,0.06)] pb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-amber-700 dark:text-[#D9B36C] bg-white dark:bg-[#16202B] px-2 py-0.5 rounded border border-slate-200 dark:border-transparent">
                        {evid.codigo_documento}
                      </span>
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-[#12B886]/10 text-[#12B886]">
                        {evid.categoria.replace('_', ' ')}
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-[#93A3B5]">
                        {evid.tipo_documento}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-slate-500 dark:text-[#93A3B5]">
                        Data: {evid.data_documento || '2026-03-01'}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                          evid.status_validacao === 'auditado_dmrv'
                            ? 'bg-emerald-50 dark:bg-[#12B886]/15 text-emerald-700 dark:text-[#12B886]'
                            : 'bg-amber-50 dark:bg-[#D9B36C]/15 text-amber-800 dark:text-[#D9B36C]'
                        }`}
                      >
                        {evid.status_validacao === 'auditado_dmrv' ? 'Auditado dMRV' : 'Pré-Laudo'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-heading font-bold text-sm text-slate-900 dark:text-[#F4F7FA]">
                      {evid.titulo}
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-[#93A3B5] mt-1 leading-relaxed">
                      {evid.descricao}
                    </p>
                  </div>

                  {/* Hash SHA-256 e Botão de Cópia */}
                  <div className="pt-2 border-t border-slate-200 dark:border-[rgba(244,247,250,0.05)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2 max-w-xl">
                      <span className="text-[10px] text-slate-500 dark:text-[#93A3B5] uppercase font-bold flex-shrink-0">
                        SHA-256:
                      </span>
                      <span className="font-mono text-[11px] text-[#12B886] truncate">
                        {evid.hash_sha256}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <button
                        onClick={() => handleCopiar(evid.hash_sha256, evid.id)}
                        className="px-3 py-1.5 rounded-lg bg-white dark:bg-[#16202B] border border-slate-200 dark:border-[rgba(244,247,250,0.15)] text-slate-600 dark:text-[#93A3B5] hover:text-slate-900 dark:hover:text-[#F4F7FA] text-xs flex items-center gap-1.5 transition-all shadow-sm"
                      >
                        {copiadoHash === evid.id ? (
                          <Check className="w-3.5 h-3.5 text-[#12B886]" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                        <span>{copiadoHash === evid.id ? 'Copiado!' : 'Copiar Hash'}</span>
                      </button>

                      {evid.link_publico && (
                        <Link
                          to={evid.link_publico}
                          className="px-3 py-1.5 rounded-lg bg-[#12B886] text-[#0A0E12] font-bold text-xs uppercase hover:bg-[#0CA678] inline-flex items-center gap-1 shadow-emerald-glow"
                        >
                          <span>Acessar</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

export default DossieMoverPage
