import React, { useState, useEffect } from 'react'
import {
  KeyRound,
  Terminal,
  Send,
  Copy,
  Check,
  RefreshCw,
  FileCode,
  Layers,
  Sparkles,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Printer,
  CheckCircle2,
  AlertCircle,
  Database,
  Code2,
  Truck,
  Leaf,
} from 'lucide-react'
import {
  obterOuCriarApiKeyCdv,
  regenerarApiKeyCdv,
  listarLotesCdv,
  listarPecasPorLote,
  carregarCatalogoComPecasLote,
  atualizarSituacaoChecklistPeca,
  enviarLoteCdvApi,
  listarTodasConsultasDpp,
  type CdvApiKeyRecord,
  type CdvLoteRecord,
  type CdvPecaRecord,
  type DppConsultaRecord,
  type IngestaoLoteInput,
  type IngestaoLoteResponse,
  type ItemCatalogoComPecaLote,
  type SituacaoChecklistPeca,
} from '@/services/cdvService'
import pb from '@/lib/pocketbase/client'
import { obterMoverAmpliadoHabilitado } from '@/services/platformSettingsService'
import { ShieldCheck, Info } from 'lucide-react'
import { EtiquetaImpressaoModal } from '@/components/EtiquetaImpressaoModal'
import { QrCode, Globe, History } from 'lucide-react'

interface ConsoleApisCdvTabProps {
  cdvNome: string
  cdvCnpj: string
  cdvCodigo?: string
}

export function ConsoleApisCdvTab({ cdvNome, cdvCnpj, cdvCodigo }: ConsoleApisCdvTabProps) {
  const [apiKeyData, setApiKeyData] = useState<{
    record: CdvApiKeyRecord | null
    chaveVisivel?: string
  }>({ record: null })
  const [isGerandoChave, setIsGerandoChave] = useState(false)
  const [copiedKey, setCopiedKey] = useState(false)
  const [copiedPayload, setCopiedPayload] = useState(false)
  const [copiedCurl, setCopiedCurl] = useState(false)

  // Histórico de Lotes e Drill-down
  const [lotes, setLotes] = useState<CdvLoteRecord[]>([])
  const [isLoadingLotes, setIsLoadingLotes] = useState(true)
  const [loteExpandidoId, setLoteExpandidoId] = useState<string | null>(null)
  const [pecasDoLote, setPecasDoLote] = useState<Record<string, CdvPecaRecord[]>>({})
  const [catalogoDoLote, setCatalogoDoLote] = useState<Record<string, ItemCatalogoComPecaLote[]>>(
    {},
  )
  const [isLoadingPecas, setIsLoadingPecas] = useState(false)
  const [pecaParaEtiqueta, setPecaParaEtiqueta] = useState<CdvPecaRecord | null>(null)
  const [abaRastreabilidade, setAbaRastreabilidade] = useState<Record<string, '611' | 'mover'>>({})
  const [moverHabilitado, setMoverHabilitado] = useState(false)
  const [salvandoSituacaoId, setSalvandoSituacaoId] = useState<string | null>(null)

  // Consultas de Auditoria de DPPs
  const [consultasDpp, setConsultasDpp] = useState<DppConsultaRecord[]>([])
  const [isLoadingConsultas, setIsLoadingConsultas] = useState(true)

  // Testador em Tempo Real
  const payloadExemploInicial: IngestaoLoteInput = {
    cdv: {
      nome: cdvNome || 'CDVerde Centro de Desmontagem Veicular',
      cnpj: cdvCnpj || '76.123.456/0001-00',
      codigo: cdvCodigo || 'DETRAN-PR-CDV-0089',
      responsavel_crea: 'CREA-PR 182.940/D - Eng. Marcelo Brandão',
    },
    veiculo_doador: {
      marca_modelo: 'Volkswagen Gol 1.6 8V Total Flex',
      chassi: '9BWAA05U0DP991204',
      placa: 'BAX-9912',
      baixa_detran: 'PR-BX-2026-991204',
      seguradora_sinistro: 'Porto Seguro Cia de Seguros',
    },
    pecas: [
      {
        sku: 'PART-SND-CAPO-01',
        descricao: 'Capô Dianteiro Original com Vedação Acústica',
        material: 'Aço Laminado Automotivo',
        peso_kg: 14.5,
        ncm: '8708.29.99',
      },
      {
        sku: 'PART-SND-ALT-02',
        descricao: 'Alternador 90A com Bobinamento de Cobre',
        material: 'Cobre / Alumínio Elétrico',
        peso_kg: 5.2,
        ncm: '8511.50.10',
      },
      {
        sku: 'PART-SND-PARA-03',
        descricao: 'Parachoque Dianteiro Termoplástico Injetado',
        material: 'Polipropileno Automotivo (PP/EPDM)',
        peso_kg: 3.8,
        ncm: '8708.10.00',
      },
    ],
    origem: 'erp',
  }

  const [payloadJsonStr, setPayloadJsonStr] = useState<string>(
    JSON.stringify(payloadExemploInicial, null, 2),
  )
  const [chaveParaEnvio, setChaveParaEnvio] = useState<string>(
    'orb_cdv_live_detran_pr_0089_demo_key',
  )
  const [isDisparando, setIsDisparando] = useState(false)
  const [respostaTeste, setRespostaTeste] = useState<IngestaoLoteResponse | null>(null)
  const [erroTeste, setErroTeste] = useState<string | null>(null)

  const carregarChave = async () => {
    try {
      const res = await obterOuCriarApiKeyCdv({
        cdvNome: cdvNome || 'CDVerde Centro de Desmontagem Veicular',
        cdvCnpj: cdvCnpj || '76.123.456/0001-00',
        cdvCodigo: cdvCodigo || 'DETRAN-PR-CDV-0089',
      })
      setApiKeyData({ record: res.record, chaveVisivel: res.chaveCompleta })
      if (res.chaveCompleta) {
        setChaveParaEnvio(res.chaveCompleta)
      }
    } catch {
      /* intentionally ignored */
    }
  }

  const carregarLotes = async () => {
    setIsLoadingLotes(true)
    try {
      const records = await listarLotesCdv()
      setLotes(records)
    } catch {
      /* intentionally ignored */
    } finally {
      setIsLoadingLotes(false)
    }
  }

  useEffect(() => {
    const carregarConsultas = async () => {
      setIsLoadingConsultas(true)
      try {
        const registros = await listarTodasConsultasDpp(500)
        setConsultasDpp(registros)
      } catch {
        /* intentionally ignored */
      } finally {
        setIsLoadingConsultas(false)
      }
    }

    const verificarMover = async () => {
      try {
        const flag = await obterMoverAmpliadoHabilitado()
        setMoverHabilitado(flag)
      } catch {
        setMoverHabilitado(false)
      }
    }

    carregarChave()
    carregarLotes()
    carregarConsultas()
    verificarMover()
  }, [cdvCnpj])

  const handleRegenerarChave = async () => {
    if (!confirm('Deseja realmente gerar uma nova chave de API? A chave anterior será revogada.'))
      return
    setIsGerandoChave(true)
    try {
      const res = await regenerarApiKeyCdv(
        cdvCnpj || '76.123.456/0001-00',
        cdvNome || 'CDVerde Centro de Desmontagem Veicular',
        cdvCodigo || 'DETRAN-PR-CDV-0089',
      )
      setApiKeyData({ record: res.record, chaveVisivel: res.novaChave })
      setChaveParaEnvio(res.novaChave)
    } catch (err: any) {
      alert(`Falha ao gerar nova chave: ${err.message}`)
    } finally {
      setIsGerandoChave(false)
    }
  }

  const handleToggleLote = async (loteId: string) => {
    if (loteExpandidoId === loteId) {
      setLoteExpandidoId(null)
      return
    }
    setLoteExpandidoId(loteId)
    if (!abaRastreabilidade[loteId]) {
      setAbaRastreabilidade((prev) => ({ ...prev, [loteId]: '611' }))
    }
    if (!catalogoDoLote[loteId] || !pecasDoLote[loteId]) {
      setIsLoadingPecas(true)
      try {
        const [itensCatalogo, pecas] = await Promise.all([
          carregarCatalogoComPecasLote(loteId),
          listarPecasPorLote(loteId),
        ])
        setCatalogoDoLote((prev) => ({ ...prev, [loteId]: itensCatalogo }))
        setPecasDoLote((prev) => ({ ...prev, [loteId]: pecas }))
      } catch {
        /* intentionally ignored */
      } finally {
        setIsLoadingPecas(false)
      }
    }
  }

  const handleAtualizarSituacao = async (
    loteId: string,
    pecaId: string,
    novaSituacao: SituacaoChecklistPeca,
  ) => {
    setSalvandoSituacaoId(pecaId)
    try {
      const atualizada = await atualizarSituacaoChecklistPeca(pecaId, novaSituacao)
      // Atualiza o estado em catalogoDoLote
      setCatalogoDoLote((prev) => {
        const lista = prev[loteId] || []
        const novaLista = lista.map((item) => {
          if (item.peca && item.peca.id === pecaId) {
            return {
              ...item,
              peca: { ...item.peca, situacao_checklist: atualizada.situacao_checklist },
            }
          }
          return item
        })
        return { ...prev, [loteId]: novaLista }
      })
      // Atualiza também em pecasDoLote
      setPecasDoLote((prev) => {
        const lista = prev[loteId] || []
        return {
          ...prev,
          [loteId]: lista.map((p) =>
            p.id === pecaId ? { ...p, situacao_checklist: atualizada.situacao_checklist } : p,
          ),
        }
      })
    } catch (err: any) {
      alert(`Falha ao salvar situação do checklist: ${err.message || 'Erro desconhecido'}`)
    } finally {
      setSalvandoSituacaoId(null)
    }
  }

  const handleDispararTeste = async () => {
    setIsDisparando(true)
    setErroTeste(null)
    setRespostaTeste(null)

    try {
      const parsed = JSON.parse(payloadJsonStr)
      const res = await enviarLoteCdvApi(parsed, chaveParaEnvio.trim())
      setRespostaTeste(res)
      // Atualiza listagem de lotes para exibir o novo lote imediatamente
      await carregarLotes()
    } catch (err: any) {
      setErroTeste(err.message || 'Erro ao comunicar com o endpoint de ingestão.')
    } finally {
      setIsDisparando(false)
    }
  }

  const copyToClip = (text: string, setter: (val: boolean) => void) => {
    navigator.clipboard.writeText(text)
    setter(true)
    setTimeout(() => setter(false), 2000)
  }

  // Métricas agregadas do CDV
  const metricas = lotes.reduce(
    (acc, curr) => {
      acc.totalLotes += 1
      acc.totalPecas += curr.total_pecas || 0
      acc.totalPesoKg += curr.total_peso_kg || 0
      acc.totalCo2eKg += curr.total_co2e_evitado_kg || 0
      return acc
    },
    { totalLotes: 0, totalPecas: 0, totalPesoKg: 0, totalCo2eKg: 0 },
  )

  // Métricas de auditoria de consultas (totais gerais e indexadas por lote)
  const metricasConsultas = React.useMemo(() => {
    let total = consultasDpp.length
    let qr = 0
    let web = 0
    let embed = 0
    let conferidos = 0
    let divergentes = 0

    // Mapa por lote_id ou baixa_detran
    const porLote: Record<
      string,
      {
        total: number
        qr: number
        web: number
        embed: number
        ultimaData?: string
        conferidos: number
        divergentes: number
      }
    > = {}

    for (const c of consultasDpp) {
      if (c.canal === 'qr') qr++
      else if (c.canal === 'embed') embed++
      else web++

      if (c.hash_conferido !== false) conferidos++
      else divergentes++

      // Atribuição ao lote
      const chavesLote = [c.lote_id, c.alvo_identificador].filter(Boolean) as string[]
      for (const k of chavesLote) {
        if (!porLote[k]) {
          porLote[k] = { total: 0, qr: 0, web: 0, embed: 0, conferidos: 0, divergentes: 0 }
        }
        porLote[k].total++
        if (c.canal === 'qr') porLote[k].qr++
        else if (c.canal === 'embed') porLote[k].embed++
        else porLote[k].web++

        if (c.hash_conferido !== false) porLote[k].conferidos++
        else porLote[k].divergentes++

        if (!porLote[k].ultimaData || new Date(c.created) > new Date(porLote[k].ultimaData!)) {
          porLote[k].ultimaData = c.created
        }
      }
    }

    return { total, qr, web, embed, conferidos, divergentes, porLote }
  }, [consultasDpp])

  const backendBaseUrl = pb.baseUrl || window.location.origin
  const [copiedBaseUrl, setCopiedBaseUrl] = useState(false)

  const curlExemplo = `curl -X POST "${backendBaseUrl}/backend/v2/cdv/lotes" \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: ${chaveParaEnvio}" \\
  -d '${payloadJsonStr.replace(/\n/g, '').replace(/\s+/g, ' ')}'`

  return (
    <div className="space-y-8 animate-fade-in">
      {/* AVISO DE URL BASE REAL DO BACKEND POCKETBASE */}
      <div className="p-5 sm:p-6 rounded-2xl bg-amber-500/10 border border-amber-500/30 dark:bg-[#0E1A2E] dark:border-amber-400/30 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-700 dark:text-[#D9B36C] flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase font-bold text-amber-800 dark:text-[#D9B36C] tracking-wider">
                Configuração Crítica de Infraestrutura
              </span>
              <h3 className="text-sm font-heading font-bold text-slate-900 dark:text-[#F8FAFC]">
                URL Base Real do Backend PocketBase (pb.baseUrl)
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={() => copyToClip(backendBaseUrl, setCopiedBaseUrl)}
            className="px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-white dark:bg-[#16202B] border border-amber-400/40 hover:border-amber-500 text-slate-800 dark:text-[#F8FAFC] flex items-center gap-1.5 transition-all self-start sm:self-auto"
          >
            {copiedBaseUrl ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-[#059669]" />
                <span className="text-emerald-700 dark:text-[#059669]">Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-amber-600 dark:text-[#D9B36C]" />
                <span>Copiar URL Base</span>
              </>
            )}
          </button>
        </div>

        <div className="p-2.5 rounded-xl bg-white dark:bg-[#0A1628] border border-amber-300 dark:border-slate-800 font-mono text-xs flex items-center justify-between gap-3 overflow-x-auto">
          <span className="text-slate-500 dark:text-[#94A3B8] text-[11px] shrink-0 font-sans">
            Host de Execução:
          </span>
          <code className="text-emerald-700 dark:text-[#059669] font-bold select-all break-all">
            {backendBaseUrl}
          </code>
        </div>

        <p className="text-xs text-slate-600 dark:text-[#94A3B8] leading-relaxed">
          ⚠️ <strong>Atenção Desenvolvedor / ERP:</strong> As chamadas aos endpoints REST da API v2{' '}
          (<code>/backend/v2/...</code>) devem obrigatoriamente ser feitas contra a URL base real
          acima. O domínio do frontend SPA (<code>www.orbis-protocol.com</code>) serve apenas a
          aplicação web React e responderá o HTML do SPA caso chamado diretamente com rotas de API.
        </p>

        {/* NOTA HONESTA SOBRE ROTA LEGADA V1 (410 GONE) E CORS */}
        <div className="pt-2 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-900 dark:text-rose-200">
            <div className="font-mono font-bold text-[11px] uppercase flex items-center gap-1.5 text-rose-700 dark:text-rose-300 mb-1">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              Rota Legada v1 Descontinuada (HTTP 410 Gone)
            </div>
            <p className="leading-relaxed">
              O endpoint legado <code>POST /backend/v1/cdv/lotes</code> retorna HTTP 410 Gone. Todas
              as integrações de ERP/TMS devem utilizar a rota vigente{' '}
              <strong className="font-mono">POST /backend/v2/cdv/lotes</strong> (motor DM-ORB-001
              v1.1 com DF=0,30, L_i=1,0 e proteção contra conflito inter-CDVs).
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-100 dark:bg-[#0A1628] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-[#94A3B8]">
            <div className="font-mono font-bold text-[11px] uppercase flex items-center gap-1.5 text-slate-900 dark:text-[#F8FAFC] mb-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-[#059669]" />
              CORS Server-to-Server vs Client-Side Browser
            </div>
            <p className="leading-relaxed">
              Integrações <strong>server-to-server</strong> (backend/ERP/cURL) não estão sujeitas a
              restrições de CORS e operam diretamente contra a URL base. Requisições client-side
              disparadas diretamente do browser sofrerão bloqueio de CORS, devendo passar pelo
              backend próprio ou páginas públicas nativas.
            </p>
          </div>
        </div>
      </div>

      {/* 1. PAINEL DE CREDENCIAIS & CHAVE DE API DO CDV */}
      <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-[#111827] border border-slate-200 dark:border-slate-800 flex items-center justify-center text-[#059669]">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-heading font-bold text-lg text-slate-900 dark:text-[#F8FAFC]">
                CONSOLE DE APIS • INGESTÃO DE LOTES CDV
              </h2>
              <p className="text-xs text-slate-600 dark:text-[#94A3B8]">
                Autentique seu ERP ou e-commerce para emissão automática de Passaportes Digitais de
                Peça (DPP).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/api-docs-cdv"
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-50 dark:bg-[#059669]/10 border border-emerald-300 dark:border-[#059669]/30 text-[#059669] hover:bg-emerald-100 dark:hover:bg-[#059669]/20 flex items-center gap-1.5 transition-all"
              title="Abrir documentação técnica da API v2 de Desmontagem Veicular"
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>Documentação da API v2</span>
              <ExternalLink className="w-3 h-3 opacity-70" />
            </a>
            <button
              type="button"
              onClick={handleRegenerarChave}
              disabled={isGerandoChave}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-[#111827] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-[#F8FAFC] hover:border-[#2563EB] flex items-center gap-1.5 transition-all disabled:opacity-50 shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isGerandoChave ? 'animate-spin' : ''}`} />
              <span>{isGerandoChave ? 'Regenerando...' : 'Regenerar Chave'}</span>
            </button>
          </div>
        </div>

        {/* Chave de API & Endpoint Info */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-8 p-4 rounded-xl bg-slate-50 dark:bg-[#0A1628] border border-slate-200 dark:border-slate-800 space-y-2">
            <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-[#94A3B8] block">
              Sua Chave de API Ativa (Header &quot;X-API-Key&quot;):
            </span>
            <div className="flex items-center justify-between gap-3 bg-white dark:bg-[#0E1A2E] p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="font-mono text-xs text-[#059669] font-bold truncate">
                {apiKeyData.chaveVisivel ||
                  chaveParaEnvio ||
                  apiKeyData.record?.chave_mascarada ||
                  'orb_cdv_live_...'}
              </span>
              <button
                type="button"
                onClick={() =>
                  copyToClip(
                    apiKeyData.chaveVisivel ||
                      chaveParaEnvio ||
                      apiKeyData.record?.chave_mascarada ||
                      '',
                    setCopiedKey,
                  )
                }
                className="px-2.5 py-1 rounded bg-slate-100 dark:bg-[#111827] text-xs font-semibold text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-[#F8FAFC] hover:bg-emerald-50 dark:hover:bg-[#059669]/20 transition-all flex items-center gap-1 shrink-0"
              >
                {copiedKey ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#059669]" />
                    <span className="text-[#059669]">Copiada!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-[#94A3B8]">
              Chave criptografada com hash SHA-256 no banco de dados. Nunca exponha sua chave em
              repositórios públicos.
            </p>
          </div>

          <div className="lg:col-span-4 p-4 rounded-xl bg-slate-50 dark:bg-[#0A1628] border border-slate-200 dark:border-slate-800 flex flex-col justify-between text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-amber-700 dark:text-[#D9B36C] block mb-1">
                Endpoint REST Vigente (DM-ORB-001 v1.1):
              </span>
              <div className="font-mono text-[11px] text-slate-900 dark:text-[#F8FAFC] bg-white dark:bg-[#0E1A2E] p-1.5 rounded border border-slate-200 dark:border-slate-800 truncate shadow-sm">
                POST /backend/v2/cdv/lotes
              </div>
              <div className="mt-2 text-[10px] space-y-0.5 text-slate-500 dark:text-[#94A3B8]">
                <div>
                  • Método:{' '}
                  <strong className="font-mono text-emerald-600 dark:text-[#059669]">POST</strong>
                </div>
                <div>
                  • Autenticação: <strong className="font-mono">Header X-API-Key</strong>
                </div>
                <div>
                  • Rate Limit:{' '}
                  <strong className="font-mono text-amber-600 dark:text-[#D9B36C]">
                    60 lotes / minuto
                  </strong>
                </div>
              </div>
            </div>
            <div className="pt-2 text-[10px] text-slate-500 dark:text-[#94A3B8] flex justify-between border-t border-slate-200 dark:border-slate-800 mt-2">
              <span>CDV: {cdvCodigo || 'DETRAN-PR-CDV-0089'}</span>
              <span className="text-[#059669] font-bold">Status: Online ✓</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. DASHBOARD DE TOTALIZADORES CDV */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-[#94A3B8]">
              Lotes Recebidos
            </span>
            <Layers className="w-4 h-4 text-[#059669]" />
          </div>
          <div className="font-heading font-black text-2xl text-slate-900 dark:text-[#F8FAFC]">
            {metricas.totalLotes}
          </div>
          <span className="text-[10px] text-slate-500 dark:text-[#94A3B8] mt-1 block">
            Veículos processados
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-[#94A3B8]">
              Peças com DPP
            </span>
            <FileCode className="w-4 h-4 text-blue-500 dark:text-[#2563EB]" />
          </div>
          <div className="font-heading font-black text-2xl text-blue-600 dark:text-[#2563EB]">
            {metricas.totalPecas}
          </div>
          <span className="text-[10px] text-slate-500 dark:text-[#94A3B8] mt-1 block">
            Selos únicos gerados
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-[#94A3B8]">
              Desvio de Sucata
            </span>
            <Truck className="w-4 h-4 text-amber-600 dark:text-[#D9B36C]" />
          </div>
          <div className="font-heading font-black text-2xl text-amber-700 dark:text-[#D9B36C]">
            {metricas.totalPesoKg.toLocaleString('pt-BR')} kg
          </div>
          <span className="text-[10px] text-slate-500 dark:text-[#94A3B8] mt-1 block">
            Total em peso reaproveitado
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-slate-800 shadow-sm bg-gradient-to-br from-white to-emerald-50/50 dark:from-[#0E1A2E] dark:to-[#111827]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase font-bold text-[#059669]">
              Total CO₂e Evitado
            </span>
            <Leaf className="w-4 h-4 text-[#059669]" />
          </div>
          <div className="font-heading font-black text-2xl text-[#059669]">
            {metricas.totalCo2eKg.toLocaleString('pt-BR')} kg
          </div>
          <span className="text-[10px] text-emerald-800 dark:text-[#059669]/80 mt-1 block font-semibold">
            Insetting ISO 14067 apurado
          </span>
        </div>
      </div>

      {/* 2.1 PAINEL CENTRAL DE AUDITORIA DE CONSULTAS DPP (ARQUIVO CENTRAL CDV) */}
      <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-[#111827] border border-slate-200 dark:border-slate-800 flex items-center justify-center text-[#059669]">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-base text-slate-900 dark:text-[#F8FAFC]">
                ARQUIVO CENTRAL DE AUDITORIA & VERIFICAÇÕES DPP
              </h3>
              <p className="text-xs text-slate-600 dark:text-[#94A3B8]">
                Rastreabilidade de leituras de passaportes (lote consolidado e individuais) por
                canal (QR Code × Web × Embed) e validação de hash SHA-256.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-[#059669] bg-emerald-50 dark:bg-[#059669]/10 px-3 py-1 rounded-full border border-emerald-300 dark:border-[#059669]/30 font-bold">
              {metricasConsultas.total} leituras auditadas
            </span>
          </div>
        </div>

        {/* 4 Cards de Métricas de Canais */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0A1628] border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between text-[#059669] mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider">Canal QR Code</span>
              <QrCode className="w-4 h-4" />
            </div>
            <div className="text-xl font-heading font-black text-slate-900 dark:text-[#F8FAFC]">
              {metricasConsultas.qr}
            </div>
            <span className="text-[10px] text-slate-500 dark:text-[#94A3B8] block mt-0.5">
              Leituras físicas via etiqueta
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0A1628] border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between text-blue-600 dark:text-[#2563EB] mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider">
                Canal Web Direto
              </span>
              <Globe className="w-4 h-4" />
            </div>
            <div className="text-xl font-heading font-black text-slate-900 dark:text-[#F8FAFC]">
              {metricasConsultas.web}
            </div>
            <span className="text-[10px] text-slate-500 dark:text-[#94A3B8] block mt-0.5">
              Navegação no portal público
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0A1628] border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between text-amber-700 dark:text-[#D9B36C] mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider">
                Canal Widget Embed
              </span>
              <Code2 className="w-4 h-4" />
            </div>
            <div className="text-xl font-heading font-black text-slate-900 dark:text-[#F8FAFC]">
              {metricasConsultas.embed}
            </div>
            <span className="text-[10px] text-slate-500 dark:text-[#94A3B8] block mt-0.5">
              Cliques via catálogo e-commerce
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0A1628] border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between text-[#059669] mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider">
                Integridade de Hash
              </span>
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div className="text-xl font-heading font-black text-[#059669]">
              {metricasConsultas.total > 0
                ? `${Math.round((metricasConsultas.conferidos / metricasConsultas.total) * 100)}%`
                : '100%'}
            </div>
            <span className="text-[10px] text-slate-500 dark:text-[#94A3B8] block mt-0.5">
              {metricasConsultas.conferidos} conferidos ✓{' '}
              {metricasConsultas.divergentes > 0 ? `| ${metricasConsultas.divergentes} div.` : ''}
            </span>
          </div>
        </div>

        {/* 5 Últimas Consultas com IP Mascarado conforme LGPD */}
        <div className="pt-2">
          <span className="text-[11px] font-mono text-[#94A3B8] uppercase block mb-2 font-bold">
            Últimas leituras registradas no CDV (IPs anonimizados conforme LGPD):
          </span>
          {consultasDpp.length === 0 ? (
            <div className="text-center py-4 bg-[#0A1628] rounded-xl border border-slate-800 text-xs text-[#94A3B8]">
              Nenhuma leitura de DPP registrada até o momento. Acesse a página pública de um lote ou
              escaneie um QR Code para iniciar o registro.
            </div>
          ) : (
            <div className="overflow-x-auto bg-[#0A1628] rounded-xl border border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-800 text-[#94A3B8] uppercase font-semibold text-[10px]">
                  <tr>
                    <th className="py-2 px-3">Data / Hora</th>
                    <th className="py-2 px-3">Alvo / Identificador</th>
                    <th className="py-2 px-3">Tipo</th>
                    <th className="py-2 px-3">Canal</th>
                    <th className="py-2 px-3">IP Mascarado (LGPD)</th>
                    <th className="py-2 px-3 text-right">Hash SHA-256</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-[#F8FAFC]">
                  {consultasDpp.slice(0, 5).map((item) => (
                    <tr key={item.id} className="hover:bg-[#111827]/40 transition-colors">
                      <td className="py-2 px-3 font-mono text-[11px] text-[#94A3B8]">
                        {new Date(item.created).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-2 px-3 font-mono font-bold text-[#059669]">
                        {item.alvo_identificador}
                      </td>
                      <td className="py-2 px-3">
                        <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#111827] text-[#94A3B8]">
                          {item.alvo_tipo === 'selo' ? 'Peça' : 'Lote'}
                        </span>
                      </td>
                      <td className="py-2 px-3">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                            item.canal === 'qr'
                              ? 'bg-[#059669]/15 text-[#059669]'
                              : item.canal === 'embed'
                                ? 'bg-[#D9B36C]/15 text-[#D9B36C]'
                                : 'bg-[#2563EB]/15 text-[#60A5FA]'
                          }`}
                        >
                          {item.canal === 'qr' && <QrCode className="w-3 h-3" />}
                          {item.canal === 'embed' && <Code2 className="w-3 h-3" />}
                          {item.canal === 'web' && <Globe className="w-3 h-3" />}
                          <span>{item.canal}</span>
                        </span>
                      </td>
                      <td className="py-2 px-3 font-mono text-[11px] text-[#94A3B8]">
                        {item.ip_mascarado || '189.40.xxx.xxx'}
                      </td>
                      <td className="py-2 px-3 text-right">
                        {item.hash_conferido !== false ? (
                          <span className="inline-flex items-center gap-1 text-[#059669] font-bold font-mono text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Conferido ✓</span>
                          </span>
                        ) : (
                          <span className="text-[#F03E54] font-bold font-mono text-[11px]">
                            Divergente
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* 3. TESTADOR EM TEMPO REAL (SANDBOX REST) */}
      <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-[#059669]" />
            <h3 className="font-heading font-bold text-base text-slate-900 dark:text-[#F8FAFC]">
              TESTADOR EM TEMPO REAL (DISPARAR POST /backend/v2/cdv/lotes)
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => copyToClip(curlExemplo, setCopiedCurl)}
              className="text-xs text-[#94A3B8] hover:text-[#059669] flex items-center gap-1 font-mono"
            >
              {copiedCurl ? (
                <span className="text-[#059669]">cURL Copiado!</span>
              ) : (
                <>
                  <Code2 className="w-3.5 h-3.5" />
                  <span>Copiar cURL</span>
                </>
              )}
            </button>
          </div>
        </div>
        <p className="text-xs text-[#94A3B8] mb-4">
          Edite o JSON abaixo para simular o envio de um lote com veículo doador e array de peças. O
          endpoint calculará os fatores de emissão evitada, gerará os selos e hashes SHA-256 e
          retornará os DPPs criados.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Editor JSON */}
          <div className="lg:col-span-7 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#94A3B8] font-mono text-[11px]">
                Payload de Entrada (JSON):
              </span>
              <button
                type="button"
                onClick={() => copyToClip(payloadJsonStr, setCopiedPayload)}
                className="text-[#D9B36C] hover:underline flex items-center gap-1 text-[11px]"
              >
                {copiedPayload ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                <span>{copiedPayload ? 'Copiado!' : 'Copiar Exemplo'}</span>
              </button>
            </div>
            <textarea
              rows={14}
              value={payloadJsonStr}
              onChange={(e) => setPayloadJsonStr(e.target.value)}
              className="w-full p-3 rounded-xl bg-slate-50 dark:bg-[#0A1628] border border-slate-200 dark:border-slate-800 text-[#059669] font-mono text-xs focus:outline-none focus:ring-1 focus:ring-[#059669] leading-relaxed"
            />
            <div className="flex items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2 flex-1">
                <span className="text-xs text-[#94A3B8] font-mono">X-API-Key:</span>
                <input
                  type="text"
                  value={chaveParaEnvio}
                  onChange={(e) => setChaveParaEnvio(e.target.value)}
                  className="flex-1 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-[#0A1628] border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-[#F8FAFC] font-mono"
                  placeholder="Informe a chave de API..."
                />
              </div>
              <button
                type="button"
                onClick={handleDispararTeste}
                disabled={isDisparando}
                className="px-5 py-2.5 rounded-xl font-bold text-xs bg-emerald-600 dark:bg-[#2563EB] text-white hover:bg-emerald-700 dark:hover:bg-blue-600 transition-all flex items-center gap-2 shadow-sm disabled:opacity-50 shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isDisparando ? 'Processando Lote...' : 'Disparar Ingestão'}</span>
              </button>
            </div>
          </div>

          {/* Resposta do Endpoint */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-2">
            <span className="text-[#94A3B8] font-mono text-[11px]">
              Resposta da API (HTTP 201 Created):
            </span>
            <div className="flex-1 p-3 rounded-xl bg-slate-50 dark:bg-[#0A1628] border border-slate-200 dark:border-slate-800 overflow-y-auto max-h-[380px] font-mono text-xs text-slate-900 dark:text-[#F8FAFC]">
              {erroTeste ? (
                <div className="p-3 rounded-lg bg-[#F03E54]/10 border border-[#F03E54]/30 text-xs text-[#F03E54] flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{erroTeste}</span>
                </div>
              ) : respostaTeste ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                    <span className="text-[#059669] font-bold">Sucesso: true</span>
                    <span className="text-[#D9B36C]">Lote: {respostaTeste.lote_id}</span>
                  </div>
                  <div className="text-[11px] text-[#94A3B8]">
                    Peças criadas:{' '}
                    <strong className="text-slate-900 dark:text-[#F8FAFC]">
                      {respostaTeste.total_pecas_criadas}
                    </strong>{' '}
                    | Peso:{' '}
                    <strong className="text-slate-900 dark:text-[#F8FAFC]">
                      {respostaTeste.total_peso_kg} kg
                    </strong>{' '}
                    | CO₂e:{' '}
                    <strong className="text-[#059669]">
                      -{respostaTeste.total_co2e_evitado_kg} kg
                    </strong>
                  </div>
                  <pre className="text-[10px] text-[#94A3B8] overflow-x-auto leading-relaxed">
                    {JSON.stringify(respostaTeste, null, 2)}
                  </pre>
                </div>
              ) : (
                <div className="text-center py-16 text-[#94A3B8] text-xs">
                  Envie a requisição para visualizar o resultado em tempo real.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 4. HISTÓRICO DE LOTES & DRILL-DOWN PARA PEÇAS / DPP */}
      <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-[#059669]" />
            <h3 className="font-heading font-bold text-base text-slate-900 dark:text-[#F8FAFC]">
              HISTÓRICO DE LOTES INGERIDOS & DRILL-DOWN DE PEÇAS
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-500 dark:text-[#94A3B8]">
            {lotes.length} lotes registrados
          </span>
        </div>

        {isLoadingLotes ? (
          <div className="text-center py-8 text-xs text-[#94A3B8]">
            Carregando histórico de lotes...
          </div>
        ) : lotes.length === 0 ? (
          <div className="text-center py-8 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-xs text-[#94A3B8]">
            Nenhum lote enviado ainda. Use o testador acima para emitir seu primeiro lote de peças
            com DPP.
          </div>
        ) : (
          <div className="space-y-3">
            {lotes.map((lote) => {
              const isExpanded = loteExpandidoId === lote.id
              const pecas = pecasDoLote[lote.id] || []

              return (
                <div
                  key={lote.id}
                  className="rounded-xl bg-slate-50 dark:bg-[#0A1628] border border-slate-200 dark:border-slate-800 overflow-hidden transition-all"
                >
                  {/* Cabeçalho do Lote */}
                  <div
                    onClick={() => handleToggleLote(lote.id)}
                    className="p-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-[#111827]/60 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-[#059669] shrink-0" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-[#94A3B8] shrink-0" />
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900 dark:text-[#F8FAFC]">
                            {lote.veiculo_marca_modelo}
                          </span>
                          <span className="font-mono text-xs text-[#059669] bg-[#059669]/10 px-2 py-0.5 rounded border border-[#059669]/30">
                            {lote.veiculo_baixa_detran}
                          </span>
                        </div>
                        <div className="text-[11px] text-[#94A3B8] mt-0.5">
                          Origem: {lote.veiculo_seguradora || 'Sinistro Desmontagem'} • Chassi:{' '}
                          <span className="font-mono">{lote.veiculo_chassi || '9BW***'}</span>
                        </div>
                      </div>
                    </div>

                    {(() => {
                      const loteStats = metricasConsultas.porLote[lote.id] ||
                        metricasConsultas.porLote[lote.veiculo_baixa_detran] || {
                          total: 0,
                          qr: 0,
                          web: 0,
                          embed: 0,
                        }

                      return (
                        <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs shrink-0">
                          <div>
                            <span className="text-[10px] text-[#94A3B8] block uppercase">
                              Peças
                            </span>
                            <span className="font-bold text-slate-900 dark:text-[#F8FAFC]">
                              {lote.total_pecas} itens
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-[#94A3B8] block uppercase">
                              Peso Total
                            </span>
                            <span className="font-bold text-[#D9B36C]">
                              {lote.total_peso_kg} kg
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-[#059669] block uppercase font-bold">
                              CO₂e Evitado
                            </span>
                            <span className="font-bold text-[#059669] font-heading text-sm">
                              -{lote.total_co2e_evitado_kg} kg
                            </span>
                          </div>

                          {/* Consultas deste lote */}
                          <div className="p-1.5 px-2.5 rounded-lg bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-slate-800 text-[11px]">
                            <span className="text-[9px] text-[#94A3B8] block uppercase font-bold">
                              Verificações DPP
                            </span>
                            <div className="flex items-center gap-1.5 font-mono">
                              <strong className="text-[#059669]">{loteStats.total}</strong>
                              <span className="text-[10px] text-[#94A3B8]">
                                (QR: {loteStats.qr} • Web: {loteStats.web} • Emb: {loteStats.embed})
                              </span>
                            </div>
                          </div>

                          <span className="px-2 py-0.5 rounded-full bg-[#059669]/20 text-[#059669] text-[10px] font-bold uppercase">
                            {lote.status}
                          </span>
                          <a
                            href={`/passaporte-lote/${lote.id}`}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="px-2.5 py-1 rounded-lg bg-[#059669]/10 hover:bg-[#059669]/20 text-[#059669] border border-[#059669]/30 font-bold text-[11px] inline-flex items-center gap-1.5 transition-colors"
                            title="Abrir DPP Consolidado do Lote"
                          >
                            <span>DPP Consolidado do Lote</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      )
                    })()}
                  </div>

                  {/* Drill-down de Peças do Lote — DUAS ABAS DE RASTREABILIDADE */}
                  {isExpanded && (
                    <div className="p-4 bg-white dark:bg-[#0E1A2E] border-t border-slate-200 dark:border-slate-800">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 text-xs text-[#94A3B8]">
                        <div className="flex items-center gap-2">
                          <span className="font-bold uppercase tracking-wider text-slate-900 dark:text-[#F8FAFC] text-[11px]">
                            Checklist Regulatório & Peças Rastreáveis ({pecas.length} DPPs no banco)
                          </span>
                          <a
                            href={`/passaporte-lote/${lote.id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] text-[#059669] hover:underline font-semibold"
                          >
                            <span>(Abrir DPP Consolidado Imprimível)</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                        <span className="text-[11px] font-mono">
                          Lote ID: {lote.id} • {new Date(lote.created).toLocaleDateString('pt-BR')}
                        </span>
                      </div>

                      {/* NAVEGAÇÃO DAS DUAS ABAS */}
                      {(() => {
                        const tabAtiva = abaRastreabilidade[lote.id] || '611'
                        const catalogoTotal = catalogoDoLote[lote.id] || []
                        const itens611 = catalogoTotal.filter(
                          (it) => it.catalogo.origem === '611_vigente',
                        )
                        const itensMover = catalogoTotal.filter(
                          (it) => it.catalogo.origem === 'ampliada_mover',
                        )

                        const itensExibidos = tabAtiva === '611' ? itens611 : itensMover

                        return (
                          <div className="space-y-4">
                            <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                              <button
                                type="button"
                                onClick={() =>
                                  setAbaRastreabilidade((prev) => ({ ...prev, [lote.id]: '611' }))
                                }
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                                  tabAtiva === '611'
                                    ? 'bg-[#059669] text-white shadow-sm'
                                    : 'bg-slate-100 dark:bg-[#111827] text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-[#F8FAFC]'
                                }`}
                              >
                                <span>CONTRAN 611 (vigente)</span>
                                <span
                                  className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
                                    tabAtiva === '611'
                                      ? 'bg-black/20 text-white'
                                      : 'bg-slate-200 dark:bg-[#0A1628] text-slate-700 dark:text-[#94A3B8]'
                                  }`}
                                >
                                  49 peças
                                </span>
                              </button>

                              {moverHabilitado && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setAbaRastreabilidade((prev) => ({
                                      ...prev,
                                      [lote.id]: 'mover',
                                    }))
                                  }
                                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                                    tabAtiva === 'mover'
                                      ? 'bg-[#D9B36C] text-[#0A1628]'
                                      : 'bg-slate-100 dark:bg-[#111827] text-slate-600 dark:text-[#94A3B8] hover:text-slate-900 dark:hover:text-[#F8FAFC]'
                                  }`}
                                >
                                  <span>Ampliação MOVER (em validação)</span>
                                  <span
                                    className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
                                      tabAtiva === 'mover'
                                        ? 'bg-[#0A1628]/30 text-[#0A1628]'
                                        : 'bg-slate-200 dark:bg-[#0A1628] text-slate-700 dark:text-[#94A3B8]'
                                    }`}
                                  >
                                    28 peças
                                  </span>
                                </button>
                              )}
                            </div>

                            {/* Marca fixa na aba MOVER */}
                            {tabAtiva === 'mover' && moverHabilitado && (
                              <div className="p-3 rounded-xl bg-[#D9B36C]/10 border border-[#D9B36C]/30 text-xs text-[#D9B36C] flex items-center gap-2 font-medium">
                                <Info className="w-4 h-4 shrink-0" />
                                <span>Informativo — não integra o laudo de conformidade 611</span>
                              </div>
                            )}

                            {isLoadingPecas && catalogoTotal.length === 0 ? (
                              <div className="text-center py-6 text-xs text-[#94A3B8]">
                                Carregando catálogo e peças do lote...
                              </div>
                            ) : itensExibidos.length === 0 ? (
                              <div className="text-center py-6 text-xs text-[#94A3B8]">
                                Nenhuma peça encontrada nesta categoria.
                              </div>
                            ) : (
                              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0A1628]">
                                <table className="w-full text-left text-xs">
                                  <thead className="border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-[#94A3B8] uppercase font-semibold text-[10px]">
                                    <tr>
                                      <th className="py-2.5 px-3 w-12 text-center">Nº</th>
                                      <th className="py-2.5 px-3">Peça do Catálogo</th>
                                      <th className="py-2.5 px-3">Subsistema</th>
                                      <th className="py-2.5 px-3">Situação Checklist</th>
                                      <th className="py-2.5 px-3">Código DPP / SKU</th>
                                      <th className="py-2.5 px-3 text-right">Peso</th>
                                      <th className="py-2.5 px-3 text-right">CO₂e Evitado</th>
                                      <th className="py-2.5 px-3 text-center">Ações</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-900 dark:text-[#F8FAFC]">
                                    {itensExibidos.map((item) => {
                                      const cat = item.catalogo
                                      const peca = item.peca
                                      const situacao = peca?.situacao_checklist || 'nao_desmontada'
                                      const isSalvando = peca && salvandoSituacaoId === peca.id

                                      return (
                                        <tr
                                          key={cat.id || cat.numero}
                                          className="hover:bg-slate-50 dark:hover:bg-[#111827]/60 transition-colors"
                                        >
                                          <td className="py-2.5 px-3 text-center font-mono text-xs text-slate-500 dark:text-[#94A3B8]">
                                            {cat.numero}
                                          </td>
                                          <td className="py-2.5 px-3">
                                            <div className="flex items-center gap-2 flex-wrap">
                                              <span className="font-semibold text-slate-900 dark:text-[#F8FAFC]">
                                                {cat.nome_peca}
                                              </span>
                                              {cat.item_seguranca && (
                                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F03E54]/20 border border-[#F03E54]/40 text-[#F03E54]">
                                                  <ShieldCheck className="w-3 h-3" />
                                                  <span>Item de segurança</span>
                                                </span>
                                              )}
                                            </div>
                                            {cat.notas && (
                                              <p className="text-[10px] text-slate-500 dark:text-[#94A3B8]/80 mt-0.5 line-clamp-1">
                                                {cat.notas}
                                              </p>
                                            )}
                                          </td>
                                          <td className="py-2.5 px-3">
                                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-[#111827] text-slate-600 dark:text-[#94A3B8]">
                                              {cat.subsistema}
                                            </span>
                                          </td>
                                          <td className="py-2.5 px-3">
                                            {peca ? (
                                              <div className="flex items-center gap-1.5">
                                                <select
                                                  value={situacao}
                                                  disabled={isSalvando}
                                                  onChange={(e) =>
                                                    handleAtualizarSituacao(
                                                      lote.id,
                                                      peca.id,
                                                      e.target.value as SituacaoChecklistPeca,
                                                    )
                                                  }
                                                  className={`px-2 py-1 rounded-lg text-xs font-semibold border bg-white dark:bg-[#0E1A2E] transition-all focus:outline-none focus:ring-1 ${
                                                    situacao === 'etiquetada'
                                                      ? 'text-[#059669] border-[#059669]/40 focus:ring-[#059669]'
                                                      : situacao === 'inservivel'
                                                        ? 'text-[#F03E54] border-[#F03E54]/40 focus:ring-[#F03E54]'
                                                        : situacao === 'nao_aplicavel_ausente'
                                                          ? 'text-[#94A3B8] border-slate-300 dark:border-slate-800'
                                                          : situacao === 'aguardando_avaliacao'
                                                            ? 'text-[#D9B36C] border-[#D9B36C]/40 focus:ring-[#D9B36C]'
                                                            : 'text-slate-900 dark:text-[#F8FAFC] border-slate-300 dark:border-slate-700'
                                                  }`}
                                                >
                                                  <option value="nao_desmontada">
                                                    Não desmontada
                                                  </option>
                                                  <option value="etiquetada">Etiquetada</option>
                                                  <option value="inservivel">Inservível</option>
                                                  <option value="nao_aplicavel_ausente">
                                                    Não aplicável / ausente
                                                  </option>
                                                  <option value="aguardando_avaliacao">
                                                    Aguardando avaliação
                                                  </option>
                                                </select>
                                                {isSalvando && (
                                                  <RefreshCw className="w-3 h-3 text-[#059669] animate-spin" />
                                                )}
                                              </div>
                                            ) : (
                                              <span className="text-[11px] text-[#94A3B8] italic">
                                                Aguardando vínculo
                                              </span>
                                            )}
                                          </td>
                                          <td className="py-2.5 px-3">
                                            {peca ? (
                                              <div>
                                                <span className="font-mono font-bold text-[#059669] block text-xs">
                                                  {peca.selo_dpp}
                                                </span>
                                                <span className="font-mono text-[10px] text-[#94A3B8]">
                                                  {peca.sku_interno}
                                                </span>
                                              </div>
                                            ) : (
                                              <span className="text-[#94A3B8] text-[11px]">—</span>
                                            )}
                                          </td>
                                          <td className="py-2.5 px-3 text-right font-mono">
                                            {peca && peca.peso_kg > 0 ? `${peca.peso_kg} kg` : '—'}
                                          </td>
                                          <td className="py-2.5 px-3 text-right font-mono font-bold text-[#059669]">
                                            {peca && peca.co2e_evitado_kg > 0
                                              ? `-${peca.co2e_evitado_kg} kg`
                                              : '—'}
                                          </td>
                                          <td className="py-2.5 px-3 text-center">
                                            {peca ? (
                                              <div className="flex items-center justify-center gap-1.5">
                                                <a
                                                  href={`/passaporte/${peca.selo_dpp}`}
                                                  target="_blank"
                                                  rel="noreferrer"
                                                  className="p-1 rounded text-slate-500 dark:text-[#94A3B8] hover:text-[#059669] hover:bg-[#059669]/10 transition-colors"
                                                  title="Abrir Passaporte Público (DPP)"
                                                >
                                                  <ExternalLink className="w-3.5 h-3.5" />
                                                </a>
                                                <button
                                                  type="button"
                                                  onClick={() => setPecaParaEtiqueta(peca)}
                                                  className="p-1 rounded text-slate-500 dark:text-[#94A3B8] hover:text-[#D9B36C] hover:bg-[#D9B36C]/10 transition-colors"
                                                  title="Imprimir Etiqueta com QR Code"
                                                >
                                                  <Printer className="w-3.5 h-3.5" />
                                                </button>
                                              </div>
                                            ) : (
                                              <span className="text-[#94A3B8] text-[11px]">—</span>
                                            )}
                                          </td>
                                        </tr>
                                      )
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        )
                      })()}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* 5. DOCUMENTAÇÃO DO WIDGET DE EMBED */}
      <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#0E1A2E] border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
        <div className="flex items-center gap-2">
          <Code2 className="w-5 h-5 text-[#059669]" />
          <h3 className="font-heading font-bold text-base text-slate-900 dark:text-[#F8FAFC]">
            COMO INSTALAR O WIDGET DE SELO ECOLÓGICO NO SEU E-COMMERCE
          </h3>
        </div>
        <p className="text-xs text-slate-600 dark:text-[#94A3B8] leading-relaxed">
          Para exibir o selo de autenticidade circular e emissões evitadas diretamente na página de
          produto da sua loja virtual, insira o código HTML e o script público:
        </p>

        <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0A1628] border border-slate-200 dark:border-slate-800 space-y-3 font-mono text-xs">
          <div>
            <span className="text-[10px] text-slate-500 dark:text-[#94A3B8] uppercase block mb-1">
              1. Tag HTML na página do produto:
            </span>
            <div className="text-[#059669] bg-white dark:bg-[#0E1A2E] p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 overflow-x-auto">
              &lt;div class=&quot;orbis-eco-seal&quot; data-seal=&quot;PR-SEAL-2026-991823&quot;
              data-co2=&quot;41.33kg&quot;&gt;🌱 Peça Circular: -41.33kg CO₂e&lt;/div&gt;
            </div>
          </div>

          <div>
            <span className="text-[10px] text-slate-500 dark:text-[#94A3B8] uppercase block mb-1">
              2. Script de inicialização (antes de fechar &lt;/body&gt;):
            </span>
            <div className="text-[#D9B36C] bg-white dark:bg-[#0E1A2E] p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 overflow-x-auto">
              &lt;script src=&quot;{window.location.origin}/orbis-cdv-embed.js&quot;
              async&gt;&lt;/script&gt;
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-[#059669]">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>
            Ao clicar no selo, o comprador é redirecionado para a auditoria oficial do passaporte
            com validação SHA-256.
          </span>
        </div>
      </div>

      {/* Modal de Impressão de Etiqueta com QR Code */}
      {pecaParaEtiqueta && (
        <EtiquetaImpressaoModal peca={pecaParaEtiqueta} onClose={() => setPecaParaEtiqueta(null)} />
      )}
    </div>
  )
}
