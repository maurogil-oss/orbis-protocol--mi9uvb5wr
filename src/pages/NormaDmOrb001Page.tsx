import { useState, useMemo } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { BreadcrumbOrbis } from '@/components/BreadcrumbOrbis'
import {
  registrarDownloadNorma,
  TERMO_USO_NORMA_DM_ORB_001,
} from '@/services/normaDownloadsService'
import {
  CATALOGO_FATORES_CO2E,
  METADADOS_CATALOGO_FATORES,
  GWP_IPCC_AR6_OFICIAL,
} from '@/services/catalogoFatoresOficiais'
import {
  FATORES_MATERIAIS_V2,
  GWP_AR6_R134A,
  GWP_AR6_R1234YF,
  DF_REFRIGERANTE_PADRAO,
  VERSAO_METODOLOGIA_CDV_V2,
} from '@/services/cdvEngineV2'
import {
  Scale,
  ShieldCheck,
  Lock,
  Download,
  FileText,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
  Recycle,
  Sparkles,
  ShieldAlert,
  FileCheck,
  Calendar,
  Layers,
  Database,
  ExternalLink,
  Info,
  Check,
  Copy,
  Printer,
} from 'lucide-react'

import { useSeo } from '@/hooks/useSeo'

export default function NormaDmOrb001Page() {
  useSeo({
    title: 'Norma Metodológica DM-ORB-001 v1.1 — Orbis Protocol',
    description:
      'Diretriz técnica integral de quantificação dMRV, equações de baseline, incerteza analítica por quadratura e custódia pericial.',
  })

  const { user, isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  const [termoAceito, setTermoAceito] = useState(false)
  const [baixandoDoc, setBaixandoDoc] = useState(false)
  const [baixandoCsv, setBaixandoCsv] = useState(false)
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null)
  const [erroDownload, setErroDownload] = useState<string | null>(null)
  const [copiouChave, setCopiouChave] = useState(false)

  const userEmail = user?.email || 'titular@orbis-protocol.com'
  const userNome = (user as any)?.name || 'Titular da Conta'

  // Se não autenticado, redireciona para login preservando returnUrl
  if (!isLoading && !isAuthenticated) {
    return <Navigate to={`/login?returnUrl=${encodeURIComponent(location.pathname)}`} replace />
  }

  const copiarChaveDedupExemplo = () => {
    navigator.clipboard?.writeText('9BWAA05U0DP***204_PART-GOL-CAPO-01_PR-BX-2026-991204')
    setCopiouChave(true)
    setTimeout(() => setCopiouChave(false), 2000)
  }

  // Download do CSV Completo (Camada 2: com contextos de aplicação, normas e notas técnicas completas)
  const handleDownloadCsvCompleto = async () => {
    setErroDownload(null)
    setMensagemSucesso(null)

    if (!termoAceito) {
      setErroDownload(
        'Marque o checkbox de compromisso de confidencialidade antes de realizar o download.',
      )
      return
    }

    setBaixandoCsv(true)
    try {
      const res = await registrarDownloadNorma({
        userId: user?.id,
        userEmail,
        userNome,
        tipoDownload: 'csv_completo',
        termoAceito: true,
        versaoNorma: 'v1.1',
      })

      if (!res.success) {
        setErroDownload(res.error || 'Não foi possível registrar o download.')
        setBaixandoCsv(false)
        return
      }

      // Monta CSV Completo da Camada 2
      const headers = [
        'ID',
        'Categoria',
        'Codigo Material',
        'Material / Insumo',
        'Fator CO2e',
        'Unidade',
        'Incerteza Padrao (%)',
        'Tier Incerteza',
        'Fonte Metodologica',
        'Ano Base',
        'Norma de Referencia',
        'Tipo de Impacto',
        'Pendente Verificacao',
        'Permite Substituicao EPD',
        'Contexto de Aplicacao e Detalhe Tecnico',
        'Versao Catalogo',
        'Regra Snapshot',
        'Licenciado Para (Conta)',
        'Data Registro Download',
      ]

      const linhas = CATALOGO_FATORES_CO2E.map((f) => [
        `"${f.id}"`,
        `"${f.categoria}"`,
        `"${f.codigoMaterial}"`,
        `"${(f.nomeMaterial || '').replace(/"/g, '""')}"`,
        `"${f.valorFator}"`,
        `"${f.unidade}"`,
        `"±${f.incertezaPct ?? (f.incertezaRelativaUfe * 100).toFixed(1)}%"`,
        `"${f.tierIncerteza || f.tier}"`,
        `"${f.fonteOficial.replace(/"/g, '""')}"`,
        `"${f.anoReferencia}"`,
        `"${(f.normaPadrao || '').replace(/"/g, '""')}"`,
        `"${f.tipoImpacto || ''}"`,
        `"${f.pendenteVerificacao ? 'SIM' : 'NAO'}"`,
        `"${f.permiteEpdSubstituicao ? 'SIM' : 'NAO'}"`,
        `"${(f.detalheTecnico || f.descricao || '').replace(/"/g, '""')}"`,
        `"${METADADOS_CATALOGO_FATORES.versao}"`,
        `"Congelado no documento na emissao"`,
        `"${userEmail}"`,
        `"${new Date().toISOString()}"`,
      ])

      const csvContent =
        'data:text/csv;charset=utf-8,\uFEFF' +
        [headers.join(';'), ...linhas.map((l) => l.join(';'))].join('\n')

      const encodedUri = encodeURI(csvContent)
      const link = document.createElement('a')
      link.setAttribute('href', encodedUri)
      link.setAttribute(
        'download',
        `DM-ORB-001_v1.1_catalogo_fatores_completo_${userEmail.replace(/[^a-zA-Z0-9]/g, '_')}.csv`,
      )
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      setMensagemSucesso(
        'Download do CSV Completo registrado com sucesso sob sua custódia institucional.',
      )
    } catch (err: any) {
      setErroDownload(err?.message || 'Erro inesperado ao gerar CSV completo.')
    } finally {
      setBaixandoCsv(false)
    }
  }

  // Impressão / Exportação PDF do documento integral com marca d'água / cabeçalho e rodapé
  const handleBaixarDocumentoIntegral = async () => {
    setErroDownload(null)
    setMensagemSucesso(null)

    if (!termoAceito) {
      setErroDownload(
        'Marque o checkbox de compromisso de confidencialidade antes de exportar o documento integral.',
      )
      return
    }

    setBaixandoDoc(true)
    try {
      const res = await registrarDownloadNorma({
        userId: user?.id,
        userEmail,
        userNome,
        tipoDownload: 'norma_integral',
        termoAceito: true,
        versaoNorma: 'v1.1',
      })

      if (!res.success) {
        setErroDownload(res.error || 'Não foi possível registrar o download.')
        setBaixandoDoc(false)
        return
      }

      setMensagemSucesso('Registro de acesso gerado. Preparando renderização do documento...')
      // Dispara print/PDF nativo do browser com a marca de autoria visível
      setTimeout(() => {
        window.print()
      }, 350)
    } catch (err: any) {
      setErroDownload(err?.message || 'Erro inesperado ao registrar documento.')
    } finally {
      setBaixandoDoc(false)
    }
  }

  return (
    <div className="min-h-screen py-8 md:py-14 bg-slate-50 dark:bg-[#0A1628] text-slate-900 dark:text-[#F8FAFC] transition-colors">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 space-y-8">
        {/* Breadcrumb e Status */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-[rgba(244,247,250,0.08)] pb-4 print:hidden">
          <BreadcrumbOrbis
            items={[
              { label: 'Protocolo', href: '/protocolo' },
              { label: 'Norma DM-ORB-001 v1.1 (Acesso Restrito)' },
            ]}
          />
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-700 dark:text-emerald-400 text-[11px] font-mono font-bold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              DM-ORB-001 v1.1 • ACESSO CONDICIONADO
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-700 dark:text-blue-300 text-[11px] font-mono">
              Conta: {userEmail}
            </span>
          </div>
        </div>

        {/* MARCA DE AUTORIA & LICENCIAMENTO (TOPO - MANDATÓRIA) */}
        <div
          data-testid="marca-licenca-topo"
          className="p-3.5 rounded-xl bg-amber-500/10 dark:bg-amber-950/30 border border-amber-500/40 text-amber-900 dark:text-amber-200 text-xs font-mono flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 shadow-xs"
        >
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <strong className="font-bold">
              DM-ORB-001 v1.1 — Documento protegido — Licenciado para: {userEmail}
            </strong>
          </div>
          <span className="text-[10px] text-amber-800 dark:text-amber-300">
            Acesso individual restrito • Proibida reprodução comercial
          </span>
        </div>

        {/* HERO DA NORMA */}
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-white via-slate-50 to-white dark:from-[#0E1A2E] dark:via-[#111827] dark:to-[#0E1A2E] border border-emerald-300 dark:border-[#059669]/40 shadow-2xl relative overflow-hidden">
          <div className="max-w-4xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-[#16202B] border border-emerald-500/40 text-emerald-700 dark:text-emerald-400 text-xs font-mono font-bold uppercase tracking-wider">
              <Scale className="w-3.5 h-3.5" />
              <span>Especificação Técnica Completa • Norma DM-ORB-001 v1.1</span>
            </div>
            <h1 className="font-heading font-black text-3xl sm:text-5xl text-slate-900 dark:text-[#F4F7FA] tracking-tight">
              Norma Metodológica DM-ORB-001 (Versão Integral v1.1)
            </h1>
            <p className="text-base sm:text-lg text-emerald-700 dark:text-[#12B886] font-medium leading-relaxed">
              Equações completas de baseline, formulação matemática da incerteza por soma em
              quadratura (Tiers 1 a 4), regras de decisão prescritivas e catálogo pleno com
              fallbacks.
            </p>
            <p className="text-sm text-slate-600 dark:text-[#93A3B5] leading-relaxed">
              Este documento integra a Camada 2 (Acesso Condicionado) da governança Orbis Protocol.
              O acesso integral é concedido para consulta e avaliação técnica pelo titular da conta
              autenticada.
            </p>

            {/* Metadados Técnicos */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
              <div className="p-3.5 rounded-xl bg-white dark:bg-[#0A1628]/80 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] uppercase font-mono text-slate-500 dark:text-[#93A3B5] flex items-center gap-1">
                  <FileCheck className="w-3 h-3 text-emerald-600 dark:text-[#12B886]" />
                  Código Normativo
                </span>
                <span className="font-mono text-xs sm:text-sm font-bold text-emerald-700 dark:text-[#12B886]">
                  DM-ORB-001 v1.1
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-white dark:bg-[#0A1628]/80 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] uppercase font-mono text-slate-500 dark:text-[#93A3B5] flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-amber-600 dark:text-[#D9B36C]" />
                  Vigência
                </span>
                <span className="font-mono text-xs font-bold text-amber-700 dark:text-[#D9B36C]">
                  {METADADOS_CATALOGO_FATORES.dataVigencia}
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-white dark:bg-[#0A1628]/80 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] uppercase font-mono text-slate-500 dark:text-[#93A3B5] flex items-center gap-1">
                  <Lock className="w-3 h-3 text-blue-600 dark:text-[#3B82F6]" />
                  Nível de Proteção
                </span>
                <span className="font-mono text-xs font-bold text-blue-700 dark:text-[#3B82F6]">
                  Camada 2 (Logado)
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-white dark:bg-[#0A1628]/80 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] uppercase font-mono text-slate-500 dark:text-[#93A3B5] flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-slate-600 dark:text-[#F4F7FA]" />
                  Prova Documental
                </span>
                <span className="font-mono text-xs font-bold text-slate-900 dark:text-[#F4F7FA]">
                  cdv_downloads_norma
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* TERMO DE USO E PAINEL DE DOWNLOADS (CAMADA 2) */}
        <section
          aria-label="Termo de Uso e Download Seguro"
          className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#0E1A2E] border-2 border-emerald-500/40 shadow-xl space-y-6 print:hidden"
        >
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-200 dark:border-slate-800">
            <ShieldAlert className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div>
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                TERMO DE CONFIDENCIALIDADE & CUSTÓDIA
              </span>
              <h2 className="font-heading font-black text-lg sm:text-xl text-slate-900 dark:text-white">
                Condições de Acesso à Metodologia DM-ORB-001
              </h2>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-[#0A1628] border border-amber-300 dark:border-[#D9B36C]/40 text-xs text-amber-950 dark:text-amber-200 space-y-2">
            <p className="leading-relaxed font-medium">&quot;{TERMO_USO_NORMA_DM_ORB_001}&quot;</p>
            <p className="text-[11px] text-amber-800 dark:text-amber-300">
              Ao assinalar a opção abaixo, sua identificação (usuário {userNome}, e-mail {userEmail}{' '}
              e timestamp) será lavrada de forma perene no registro documental de custódia da
              plataforma.
            </p>
          </div>

          {/* Checkbox Obrigatório */}
          <label className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 dark:bg-[#111827] border border-slate-200 dark:border-slate-800 cursor-pointer hover:border-emerald-500/60 transition-colors">
            <input
              type="checkbox"
              id="termo-aceito-checkbox"
              checked={termoAceito}
              onChange={(e) => setTermoAceito(e.target.checked)}
              className="mt-1 w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
            />
            <span className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed">
              <strong>Declaro ciência e compromisso:</strong> Li e concordo com os termos de uso
              restrito da norma DM-ORB-001 v1.1. Estou ciente de que cada download é documentado e
              que é vedada a reprodução comercial ou reutilização para desenvolvimento de motores
              concorrentes.
            </span>
          </label>

          {/* Mensagens de Feedback */}
          {erroDownload && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/40 text-rose-700 dark:text-rose-400 text-xs font-medium">
              {erroDownload}
            </div>
          )}
          {mensagemSucesso && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/40 text-emerald-700 dark:text-emerald-400 text-xs font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{mensagemSucesso}</span>
            </div>
          )}

          {/* Ações de Download */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
            <button
              type="button"
              onClick={handleBaixarDocumentoIntegral}
              disabled={baixandoDoc}
              className="flex-1 py-3.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md disabled:opacity-50"
            >
              <Printer className="w-4 h-4" />
              <span>
                {baixandoDoc ? 'Registrando...' : 'Baixar Documento Integral (PDF / Impressão)'}
              </span>
            </button>

            <button
              type="button"
              onClick={handleDownloadCsvCompleto}
              disabled={baixandoCsv}
              className="flex-1 py-3.5 px-5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-[#16202B] dark:hover:bg-[#1F2E3E] text-white border border-slate-300 dark:border-slate-700 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 font-mono"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>{baixandoCsv ? 'Gerando CSV...' : 'Baixar CSV Completo do Catálogo'}</span>
            </button>
          </div>
        </section>

        {/* ========================================================= */}
        {/* CORPO DO TEXTO INTEGRAL DA NORMA DM-ORB-001 v1.1 */}
        {/* ========================================================= */}
        <article className="space-y-8">
          {/* Seção 1: Objetivo e Cláusula de Gatilho */}
          <section className="p-8 rounded-3xl bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-[#12B886] text-xs font-mono font-bold uppercase">
              <BookOpen className="w-4 h-4" />
              <span>Seção 1 • Fundamentação e Escopo Normativo</span>
            </div>
            <h2 className="font-heading font-extrabold text-2xl text-slate-900 dark:text-[#F4F7FA]">
              §1. Objetivo, Escopo Restrito e Cláusula de Gatilho SBCE / Artigo 6
            </h2>
            <div className="space-y-3 text-sm text-slate-600 dark:text-[#93A3B5] leading-relaxed">
              <p>
                <strong className="text-slate-900 dark:text-[#F4F7FA]">1.1 Objetivo:</strong> O
                presente documento metodológico estabelece os critérios objetivos, premissas de
                conservadorismo e equações matemáticas para quantificação, registro e monitoramento
                dMRV de emissões de GEE evitadas decorrentes da recuperação, desmontagem e
                reinserção de peças e materiais automotivos em CDVs.
              </p>
              <p>
                <strong className="text-slate-900 dark:text-[#F4F7FA]">1.2 Escopo Restrito:</strong>{' '}
                A aplicação é restrita aos fluxos que satisfaçam as condições do §3-A. Nenhum lote
                que descumpra os requisitos receberá chancela pericial.
              </p>
              <div className="p-4 rounded-xl bg-amber-50 dark:bg-[#0A1628] border border-amber-300 dark:border-[#D9B36C]/40 space-y-2">
                <span className="font-mono text-xs font-bold text-amber-800 dark:text-[#D9B36C] uppercase flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4" />
                  1.3 Cláusula de Gatilho Regulatório — SBCE e Artigo 6
                </span>
                <p className="text-xs text-slate-700 dark:text-[#93A3B5] leading-relaxed">
                  Os registros constituem infraestrutura de prova documental. Qualquer transação
                  como crédito de carbono fica{' '}
                  <strong>
                    expressamente condicionada à validação por Organismo de Verificação e Validação
                    (VVB) credenciado
                  </strong>
                  .
                </p>
              </div>
            </div>
          </section>

          {/* Seção 3-A: As Cinco Condições Cumulativas */}
          <section className="p-8 rounded-3xl bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-[#12B886] text-xs font-mono font-bold uppercase">
              <CheckCircle2 className="w-4 h-4" />
              <span>Seção 3-A • Critérios Mandatórios de Elegibilidade</span>
            </div>
            <h2 className="font-heading font-extrabold text-2xl text-slate-900 dark:text-[#F4F7FA]">
              §3-A. As Cinco Condições Cumulativas de Aplicabilidade
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0A1628] border border-slate-200 dark:border-slate-800 space-y-1.5">
                <strong className="text-xs font-mono font-bold text-emerald-700 dark:text-[#12B886] block">
                  (i) Destinação Documentada Obrigatória
                </strong>
                <p className="text-xs text-slate-600 dark:text-[#93A3B5]">
                  Claim confirmado exclusivamente com NF-e de saída (chave de 44 dígitos) ou
                  MTR/SINIR. Peças em estoque são claim potencial.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0A1628] border border-slate-200 dark:border-slate-800 space-y-1.5">
                <strong className="text-xs font-mono font-bold text-emerald-700 dark:text-[#12B886] block">
                  (ii) Dado Medido para Itens Relevantes
                </strong>
                <p className="text-xs text-slate-600 dark:text-[#93A3B5]">
                  Componentes com massa &gt; 1,0% do lote exigem medição direta com balança
                  calibrada e rastreabilidade.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0A1628] border border-slate-200 dark:border-slate-800 space-y-1.5">
                <strong className="text-xs font-mono font-bold text-emerald-700 dark:text-[#12B886] block">
                  (iii) Conservadorismo em Toda Direção Incerta
                </strong>
                <p className="text-xs text-slate-600 dark:text-[#93A3B5]">
                  Dúvida de composição aplica o menor fator de emissão evitada e maior penalidade de
                  projeto (PE).
                </p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0A1628] border border-slate-200 dark:border-slate-800 space-y-1.5">
                <strong className="text-xs font-mono font-bold text-emerald-700 dark:text-[#12B886] block">
                  (iv) Vedação Absoluta de Dupla Contagem Inter-CDVs
                </strong>
                <p className="text-xs text-slate-600 dark:text-[#93A3B5]">
                  Chave canônica única impede colisão e a plataforma rejeita tentativas com HTTP
                  409.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0A1628] border border-slate-200 dark:border-slate-800 space-y-1.5 md:col-span-2">
                <strong className="text-xs font-mono font-bold text-emerald-700 dark:text-[#12B886] block">
                  (v) Fronteira Declarada Berço-ao-Portão (Cradle-to-Gate)
                </strong>
                <p className="text-xs text-slate-600 dark:text-[#93A3B5]">
                  Compreende entrada do veículo sinistrado, despoluição de fluidos (CONAMA 267/340),
                  desmontagem e expedição no gate.
                </p>
              </div>
            </div>
          </section>

          {/* Seção 5.3: Deduplicação e HTTP 409 */}
          <section className="p-8 rounded-3xl bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-blue-600 dark:text-[#3B82F6] text-xs font-mono font-bold uppercase">
              <Lock className="w-4 h-4" />
              <span>Seção 5.3 • Integridade Criptográfica de Custódia</span>
            </div>
            <h2 className="font-heading font-extrabold text-2xl text-slate-900 dark:text-[#F4F7FA]">
              §5.3 Deduplicação Inter-CDVs, Chave Canônica e Consulta Pública LGPD
            </h2>
            <div className="p-4 rounded-xl bg-blue-50 dark:bg-[#0A1628] border border-blue-200 dark:border-[#2563EB]/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono text-blue-700 dark:text-[#3B82F6] font-bold uppercase">
                  Chave Canônica de Deduplicação Inter-CDV
                </span>
                <button
                  onClick={copiarChaveDedupExemplo}
                  className="px-2 py-1 rounded bg-slate-200 dark:bg-[#16202B] text-[10px] font-mono text-slate-700 dark:text-[#F4F7FA] flex items-center gap-1"
                >
                  {copiouChave ? (
                    <Check className="w-3 h-3 text-emerald-500" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                  <span>{copiouChave ? 'Copiado' : 'Copiar Exemplo'}</span>
                </button>
              </div>
              <pre className="font-mono text-xs sm:text-sm text-emerald-700 dark:text-[#059669] bg-white dark:bg-[#111827] p-3 rounded-lg overflow-x-auto border border-slate-200 dark:border-slate-800">
                CHASSI + &quot;_&quot; + SKU + &quot;_&quot; + DATA_BAIXA_DETRAN
              </pre>
            </div>
          </section>

          {/* Seção 5.4: Governança de Reivindicação Única */}
          <section className="p-8 rounded-3xl bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-[#12B886] text-xs font-mono font-bold uppercase">
              <ShieldAlert className="w-4 h-4" />
              <span>Seção 5.4 • Governança de Reivindicação Única & Integridade dMRV</span>
            </div>
            <h2 className="font-heading font-extrabold text-2xl text-slate-900 dark:text-[#F4F7FA]">
              §5.4 Regra de Governança de Reivindicação Única e Vedação à Dupla Contabilidade do
              CO₂e Evitado
            </h2>
            <div className="space-y-3 text-sm text-slate-600 dark:text-[#93A3B5] leading-relaxed">
              <p>
                <strong>5.4.1 Reivindicação Única:</strong> O benefício de evitado pertence
                exclusivamente ao detentor da prova documental de transformação.
              </p>
              <p>
                <strong>5.4.2 Segregação Gerador vs Processador:</strong> O gerador originário que
                aliena o veículo inservível transfere a elegibilidade pericial.
              </p>
              <p>
                <strong>5.4.3 Bloqueio Automatizado:</strong> Colisão de documento fiscal ou hash
                comuta o status para <code>conflito_reivindicacao</code> e zera o indicador evitado
                (0,00 kgCO₂e).
              </p>
            </div>
          </section>

          {/* Seção 6.1: Fluidos Refrigerantes R-134a e R-1234yf */}
          <section className="p-8 rounded-3xl bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-[#12B886] text-xs font-mono font-bold uppercase">
              <Sparkles className="w-4 h-4" />
              <span>Seção 6.1 • Gases de Efeito Estufa e Drenagem de Climatização</span>
            </div>
            <h2 className="font-heading font-extrabold text-2xl text-slate-900 dark:text-[#F4F7FA]">
              §6.1 Fatores Consolidados em CO₂e e Tratamento Mandatório do R-134a e R-1234yf
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0A1628] border border-emerald-300 dark:border-emerald-800 space-y-2">
                <span className="font-mono text-xs font-bold text-emerald-700 dark:text-[#12B886]">
                  R-134a (HFC-134a) • GWP = {GWP_AR6_R134A}
                </span>
                <p className="text-xs text-slate-600 dark:text-[#93A3B5]">
                  IPCC AR6 WG1 Tab. 7.15 (GWP 1.530 com feedbacks). DF_refrig ={' '}
                  {DF_REFRIGERANTE_PADRAO.toFixed(1)}.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0A1628] border border-blue-300 dark:border-blue-800 space-y-2">
                <span className="font-mono text-xs font-bold text-blue-700 dark:text-[#3B82F6]">
                  R-1234yf (HFO-1234yf) • GWP = {GWP_AR6_R1234YF.toFixed(2)}
                </span>
                <p className="text-xs text-slate-600 dark:text-[#93A3B5]">
                  IPCC AR6 WG1 Tab. 7.SM.7 (GWP 0,501; valor conservador adotado 0,50 kgCO₂e/kg).
                </p>
              </div>
            </div>
          </section>

          {/* ========================================================= */}
          {/* SEÇÃO 6.3: EQUAÇÕES DE BASELINE COMPLETAS DO MOTOR V2 */}
          {/* ========================================================= */}
          <section className="p-8 rounded-3xl bg-white dark:bg-[#0E1A2E] border-2 border-emerald-500 shadow-xl space-y-6">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-[#12B886] text-xs font-mono font-bold uppercase">
              <Scale className="w-4 h-4" />
              <span>Seção 6.3 & Apêndice C • Procedimento e Equações Completas de Baseline</span>
            </div>
            <h2 className="font-heading font-extrabold text-2xl sm:text-3xl text-slate-900 dark:text-[#F4F7FA]">
              §6.3 Procedimento de Baseline do Motor v2 (DM-ORB-001 v1.1)
            </h2>
            <p className="text-sm text-slate-600 dark:text-[#93A3B5] leading-relaxed">
              O cálculo executado pelo motor{' '}
              <code className="text-emerald-600 font-mono">cdvEngineV2.ts</code> para cada
              componente desmontado obedece à equação prescritiva integral:
            </p>

            {/* Equação Fundamental */}
            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-[#0A1628] border-2 border-emerald-500 text-center space-y-3">
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-[#93A3B5]">
                Equação Fundamental de Emissão Evitada por Peça
              </span>
              <div className="font-mono text-xl sm:text-2xl font-black text-emerald-600 dark:text-[#12B886] py-2">
                Evitado_peça = (Q × FE_ref × L_i × DF) − PE_peça
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[11px] font-mono text-slate-600 dark:text-[#93A3B5] pt-2 border-t border-slate-200 dark:border-slate-800">
                <div className="p-2 rounded bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800">
                  <strong className="text-emerald-600 dark:text-[#12B886] block">Q</strong> Massa
                  medida (kg)
                </div>
                <div className="p-2 rounded bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800">
                  <strong className="text-emerald-600 dark:text-[#12B886] block">FE_ref</strong>{' '}
                  Fator primário
                </div>
                <div className="p-2 rounded bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800">
                  <strong className="text-emerald-600 dark:text-[#12B886] block">L_i = 1,0</strong>{' '}
                  Reúso funcional
                </div>
                <div className="p-2 rounded bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800">
                  <strong className="text-emerald-600 dark:text-[#12B886] block">DF = 0,30</strong>{' '}
                  Deslocamento
                </div>
                <div className="p-2 rounded bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 col-span-2 sm:col-span-1">
                  <strong className="text-rose-600 dark:text-[#EF4444] block">PE_peça</strong>{' '}
                  Emissão projeto
                </div>
              </div>
            </div>

            {/* Parâmetros Prescritivos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-600 dark:text-[#93A3B5]">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0A1628] border border-slate-200 dark:border-slate-800 space-y-2">
                <h3 className="font-mono font-bold text-slate-900 dark:text-[#F4F7FA] uppercase">
                  Parâmetro DF = 0,30 (Fator de Deslocamento Conservador)
                </h3>
                <p leading-relaxed>
                  Em aderência às diretrizes da metodologia VMR0007 e análises setoriais de
                  substituição, adota-se o piso fixo de <strong>DF = 0,30</strong>. Mesmo na
                  reposição de peça virgem, reconhece-se apenas 30% do potencial de descarbonização,
                  absorvendo perdas elásticas de mercado.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0A1628] border border-slate-200 dark:border-slate-800 space-y-2">
                <h3 className="font-mono font-bold text-slate-900 dark:text-[#F4F7FA] uppercase">
                  Parâmetro L_i = 1,0 (Fator de Vida Útil Restante)
                </h3>
                <p leading-relaxed>
                  O parâmetro de vida útil restante é calibrado em <strong>L_i = 1,0</strong> para
                  reúso funcional imediato atestado pelo responsável técnico com ART/RRT. É vedada
                  elevação acima de 1,0 sem estudo VVB.
                </p>
              </div>
            </div>
          </section>

          {/* ========================================================= */}
          {/* SEÇÃO 7: REGIME DE INCERTEZA EM QUADRATURA E TIERS 1–4 */}
          {/* ========================================================= */}
          <section className="p-8 rounded-3xl bg-white dark:bg-[#0E1A2E] border-2 border-amber-500/50 shadow-xl space-y-6">
            <div className="flex items-center gap-2 text-amber-600 dark:text-[#D9B36C] text-xs font-mono font-bold uppercase">
              <AlertTriangle className="w-4 h-4" />
              <span>Seção 7 • Propagação de Incerteza e Formulação Matemática</span>
            </div>
            <h2 className="font-heading font-extrabold text-2xl sm:text-3xl text-slate-900 dark:text-[#F4F7FA]">
              §7. Regime de Incerteza T1–T4, Soma em Quadratura e Regras de Arredondamento
            </h2>
            <p className="text-sm text-slate-600 dark:text-[#93A3B5] leading-relaxed">
              O motor Orbis v2 implementa a propagação formal de incerteza por{' '}
              <strong className="text-slate-900 dark:text-[#F4F7FA]">
                soma em quadratura (quadrature sum)
              </strong>{' '}
              conforme o Guia ISO/IEC 98-3 (GUM - Guide to the Expression of Uncertainty in
              Measurement):
            </p>

            {/* Equação da Incerteza em Quadratura */}
            <div className="p-5 rounded-2xl bg-amber-50 dark:bg-[#0A1628] border border-amber-300 dark:border-[#D9B36C]/40 space-y-2 text-center">
              <span className="text-[11px] font-mono uppercase text-amber-800 dark:text-[#D9B36C] font-bold">
                Equação de Incerteza Consolidada do Lote
              </span>
              <div className="font-mono text-base sm:text-lg font-bold text-slate-900 dark:text-[#F4F7FA] py-1 overflow-x-auto">
                Incerteza_lote = √ [ Σ (Evitado_peça × u_FE)² + (Evitado_lote × u_massa)² ]
              </div>
              <p className="text-xs text-slate-600 dark:text-[#93A3B5]">
                Onde <strong className="text-emerald-600">u_massa = ±1,0% (0,01)</strong> para
                pesagem com balança calibrada ou{' '}
                <strong className="text-amber-600">u_massa = ±10,0% (0,10)</strong> quando a tara
                for estimada por proxy.
              </p>
            </div>

            {/* Tiers T1 a T4 Detalhados */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0A1628] border border-emerald-500/40">
                <span className="font-mono text-xs font-bold text-emerald-600 dark:text-[#12B886] block">
                  TIER 1 (T1)
                </span>
                <span className="text-xs font-semibold text-slate-900 dark:text-[#F4F7FA] block mt-1">
                  Medição Direta de Alta Precisão
                </span>
                <span className="text-[11px] text-slate-500 dark:text-[#93A3B5] block mt-1">
                  Balança aferida + laudo espectrográfico
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0A1628] border border-blue-500/40">
                <span className="font-mono text-xs font-bold text-blue-600 dark:text-[#3B82F6] block">
                  TIER 2 (T2)
                </span>
                <span className="text-xs font-semibold text-slate-900 dark:text-[#F4F7FA] block mt-1">
                  Fatores Setoriais Oficiais
                </span>
                <span className="text-[11px] text-slate-500 dark:text-[#93A3B5] block mt-1">
                  PlasticsEurope, PBGHG nacional
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0A1628] border border-amber-500/40">
                <span className="font-mono text-xs font-bold text-amber-600 dark:text-[#D9B36C] block">
                  TIER 3 (T3)
                </span>
                <span className="text-xs font-semibold text-slate-900 dark:text-[#F4F7FA] block mt-1">
                  Associações Internacionais
                </span>
                <span className="text-[11px] text-slate-500 dark:text-[#93A3B5] block mt-1">
                  WorldSteel, IAI, ICA (primários)
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0A1628] border border-slate-300 dark:border-slate-700">
                <span className="font-mono text-xs font-bold text-slate-600 dark:text-[#93A3B5] block">
                  TIER 4 (T4)
                </span>
                <span className="text-xs font-semibold text-slate-900 dark:text-[#F4F7FA] block mt-1">
                  Estimativa de Piso
                </span>
                <span className="text-[11px] text-slate-500 dark:text-[#93A3B5] block mt-1">
                  Pesagem estimada ou composição proxy
                </span>
              </div>
            </div>

            {/* Regras Arredondamento Floor/Ceil */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0A1628] border border-slate-200 dark:border-slate-800 space-y-2">
              <h3 className="text-xs font-mono font-bold text-slate-900 dark:text-[#F4F7FA] uppercase">
                Regras de Arredondamento Assimétricas do Motor
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600 dark:text-[#93A3B5]">
                <div className="p-2.5 rounded-lg bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800">
                  <strong className="text-emerald-600 dark:text-[#12B886] font-mono block">
                    FLOOR em 2 Casas para Emissões Evitadas:
                  </strong>
                  Evitado líquido = <code>Math.floor(x * 100) / 100</code>. Nunca trunca para cima.
                </div>
                <div className="p-2.5 rounded-lg bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800">
                  <strong className="text-rose-600 dark:text-[#EF4444] font-mono block">
                    CEIL em 2 Casas para Emissões de Projeto (PE):
                  </strong>
                  Emissões de projeto = <code>Math.ceil(x * 100) / 100</code>. Assegura a dedução
                  máxima de custos operacionais.
                </div>
              </div>
            </div>
          </section>

          {/* Seção 8: Registro Verificável de Custódia */}
          <section className="p-8 rounded-3xl bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-[#12B886] text-xs font-mono font-bold uppercase">
              <Database className="w-4 h-4" />
              <span>Seção 8 • Vocabulário Oficial e Arquitetura de Registro</span>
            </div>
            <h2 className="font-heading font-extrabold text-2xl text-slate-900 dark:text-[#F4F7FA]">
              §8. Registro Verificável de Custódia — dMRV Orbis
            </h2>
            <p className="text-sm text-slate-600 dark:text-[#93A3B5] leading-relaxed">
              A denominação oficial do registro emitido pela plataforma é{' '}
              <strong className="text-emerald-600 dark:text-[#12B886]">
                &quot;Registro Verificável de Custódia — dMRV Orbis&quot;
              </strong>
              . Fica vedada a utilização de termos como &quot;Certificado de Carbono&quot; na
              ausência de validação VVB.
            </p>
          </section>

          {/* Seção 9: Não Somos Certificadora */}
          <section className="p-8 rounded-3xl bg-white dark:bg-[#0E1A2E] border border-emerald-500/30 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-[#12B886] text-xs font-mono font-bold uppercase">
              <ShieldCheck className="w-4 h-4" />
              <span>Seção 9 • Governança e Delimitação Institucional</span>
            </div>
            <h2 className="font-heading font-extrabold text-2xl text-slate-900 dark:text-[#F4F7FA]">
              §9. Não Somos Certificadora: Atestado de Conformidade Orbis (com ART/RRT) ≠
              Verificação ISO 14064-3
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-600 dark:text-[#93A3B5]">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0A1628] border border-slate-200 dark:border-slate-800 space-y-1.5">
                <span className="font-mono font-bold text-emerald-600 dark:text-[#12B886] block">
                  Atestado de Conformidade Orbis (com ART/RRT)
                </span>
                <p>
                  Instrumento técnico-pericial assinado por perito legalmente habilitado
                  (CREA/CAU/CFT), atestando a exatidão da contabilidade física e idoneidade
                  documental.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0A1628] border border-slate-200 dark:border-slate-800 space-y-1.5">
                <span className="font-mono font-bold text-amber-600 dark:text-[#D9B36C] block">
                  Verificação Externa VVB (ISO 14064-3)
                </span>
                <p>
                  Auditoria de terceira parte por Organismo credenciado. Qualquer emissão de crédito
                  decorre exclusivamente de parecer de VVB independente.
                </p>
              </div>
            </div>
          </section>

          {/* Seção 10: Snapshot Prospectivo */}
          <section className="p-8 rounded-3xl bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-[#12B886] text-xs font-mono font-bold uppercase">
              <Lock className="w-4 h-4" />
              <span>Seção 10 • Governança Metodológica e Segurança Jurídica</span>
            </div>
            <h2 className="font-heading font-extrabold text-2xl text-slate-900 dark:text-[#F4F7FA]">
              §10. Competência de Ajuste Metodológico, Poder de Redução e Snapshot Prospectivo
            </h2>
            <div className="space-y-3 text-sm text-slate-600 dark:text-[#93A3B5] leading-relaxed">
              <p>
                <strong>Poder de Redução:</strong> O Comitê Técnico detém prerrogativa permanente de{' '}
                <strong className="text-slate-900 dark:text-[#F4F7FA]">REDUZIR</strong> os fatores
                divulgados para preservar o conservadorismo.
              </p>
              <p>
                <strong>Snapshot Prospectivo Imutável:</strong> Lotes fechados não recalculam
                retroativamente caso o catálogo seja calibrado no futuro.
              </p>
            </div>
          </section>

          {/* Apêndice B: Citação de Fontes */}
          <section className="p-8 rounded-3xl bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-amber-600 dark:text-[#D9B36C] text-xs font-mono font-bold uppercase">
              <BookOpen className="w-4 h-4" />
              <span>Apêndice B • Rastreabilidade Completa de Fontes e Citações</span>
            </div>
            <h2 className="font-heading font-extrabold text-2xl text-slate-900 dark:text-[#F4F7FA]">
              Apêndice B: Citação de Fontes Oficiais e Status de Validação
            </h2>
            <div className="space-y-3 text-xs text-slate-600 dark:text-[#93A3B5]">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0A1628] border border-slate-200 dark:border-slate-800">
                <strong className="text-slate-900 dark:text-[#F4F7FA] font-mono block">
                  Aço Laminado / Estampado: 2,18 kgCO₂e/kg (Tier 3) — worldsteel 2025
                </strong>
                <span>
                  Média global ponderada cobrindo 51% da produção mundial (rotas BF-BOF, scrap-EAF,
                  DRI-EAF).
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0A1628] border border-slate-200 dark:border-slate-800">
                <strong className="text-slate-900 dark:text-[#F4F7FA] font-mono block">
                  Alumínio Primário: 14,40 kgCO₂e/kg (Fallback Global IAI 2024, Tier 3)
                </strong>
                <span>
                  Cenário regional BR hidrelétrico (~10,00) indicativo e condicionado a evidência
                  documental.
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0A1628] border border-slate-200 dark:border-slate-800">
                <strong className="text-slate-900 dark:text-[#F4F7FA] font-mono block">
                  Cobre / Bobinamentos: 4,10 kgCO₂e/kg (Tier 3) — ICA 2024
                </strong>
                <span>
                  Estudo Global LCI/LCA da International Copper Association para cobre primário
                  refinado.
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0A1628] border border-slate-200 dark:border-slate-800">
                <strong className="text-slate-900 dark:text-[#F4F7FA] font-mono block">
                  Polímeros (PP/EPDM/ABS): 1,90 kgCO₂e/kg • [Pendente de verificação de fonte]
                </strong>
                <span>
                  PlasticsEurope Eco-profiles; ponta conservadora inferior da classe termoplástica.
                </span>
              </div>
            </div>
          </section>

          {/* Apêndice E: Glossário */}
          <section className="p-8 rounded-3xl bg-white dark:bg-[#0E1A2E] border border-emerald-500/30 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-[#12B886] text-xs font-mono font-bold uppercase">
              <Layers className="w-4 h-4" />
              <span>Apêndice E • Glossário Metodológico das 8 Métricas</span>
            </div>
            <h2 className="font-heading font-extrabold text-2xl text-slate-900 dark:text-[#F4F7FA]">
              Apêndice E: Glossário das 8 Métricas, Unidades e Convenção de Sinal
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-600 dark:text-[#93A3B5]">
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-[#0A1628] border border-slate-200 dark:border-slate-800">
                <strong className="text-emerald-600 dark:text-[#12B886] font-mono block">
                  1. Evitado Bruto:
                </strong>{' '}
                Q × FE_ref × L_i × DF
              </div>
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-[#0A1628] border border-slate-200 dark:border-slate-800">
                <strong className="text-rose-600 dark:text-[#EF4444] font-mono block">
                  2. Emissão Projeto (PE):
                </strong>{' '}
                Faturas elétricas e combustíveis rateados
              </div>
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-[#0A1628] border border-slate-200 dark:border-slate-800">
                <strong className="text-emerald-600 dark:text-[#12B886] font-mono block">
                  3. Evitado Líquido:
                </strong>{' '}
                max(0, Bruto − PE) com FLOOR em 2 casas
              </div>
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-[#0A1628] border border-slate-200 dark:border-slate-800">
                <strong className="text-emerald-600 dark:text-[#12B886] font-mono block">
                  4. Evitado Confirmado:
                </strong>{' '}
                Fração amparada em NF-e/MTR definitivo
              </div>
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-[#0A1628] border border-slate-200 dark:border-slate-800">
                <strong className="text-amber-600 dark:text-[#D9B36C] font-mono block">
                  5. Evitado Potencial:
                </strong>{' '}
                Peças em estoque pendentes de venda
              </div>
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-[#0A1628] border border-slate-200 dark:border-slate-800">
                <strong className="text-blue-600 dark:text-[#3B82F6] font-mono block">
                  6. Evitado Refrigerante:
                </strong>{' '}
                Drenagem comprovada de R-134a / R-1234yf
              </div>
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-[#0A1628] border border-slate-200 dark:border-slate-800">
                <strong className="text-amber-600 dark:text-[#D9B36C] font-mono block">
                  7. Incerteza Consolidada:
                </strong>{' '}
                Propagação quadrática u_FE e u_massa
              </div>
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-[#0A1628] border border-slate-200 dark:border-slate-800">
                <strong className="text-slate-900 dark:text-[#F4F7FA] font-mono block">
                  8. Segregação Fóssil/Bio:
                </strong>{' '}
                100% fóssil / 0% biogênico na desmontagem
              </div>
            </div>
          </section>
        </article>

        {/* MARCA DE AUTORIA & LICENCIAMENTO (RODAPÉ - MANDATÓRIA) */}
        <div
          data-testid="marca-licenca-rodape"
          className="p-3.5 rounded-xl bg-amber-500/10 dark:bg-amber-950/30 border border-amber-500/40 text-amber-900 dark:text-amber-200 text-xs font-mono flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 shadow-xs"
        >
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <strong className="font-bold">
              DM-ORB-001 v1.1 — Documento protegido — Licenciado para: {userEmail}
            </strong>
          </div>
          <span className="text-[10px] text-amber-800 dark:text-amber-300">
            Orbis Protocol • Custódia Criptográfica
          </span>
        </div>
      </div>
    </div>
  )
}
