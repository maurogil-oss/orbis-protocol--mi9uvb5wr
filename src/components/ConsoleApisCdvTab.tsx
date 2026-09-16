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
  enviarLoteCdvApi,
  listarTodasConsultasDpp,
  type CdvApiKeyRecord,
  type CdvLoteRecord,
  type CdvPecaRecord,
  type DppConsultaRecord,
  type IngestaoLoteInput,
  type IngestaoLoteResponse,
} from '@/services/cdvService'
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
  const [isLoadingPecas, setIsLoadingPecas] = useState(false)
  const [pecaParaEtiqueta, setPecaParaEtiqueta] = useState<CdvPecaRecord | null>(null)

  // Consultas de Auditoria de DPPs
  const [consultasDpp, setConsultasDpp] = useState<DppConsultaRecord[]>([])
  const [isLoadingConsultas, setIsLoadingConsultas] = useState(true)

  // Testador em Tempo Real
  const payloadExemploInicial: IngestaoLoteInput = {
    cdv: {
      nome: cdvNome || 'CDVerde Centro de Desmontagem Veicular',
      cnpj: cdvCnpj || '76.123.456/0001-12',
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
        cdvCnpj: cdvCnpj || '76.123.456/0001-12',
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

    carregarChave()
    carregarLotes()
    carregarConsultas()
  }, [cdvCnpj])

  const handleRegenerarChave = async () => {
    if (!confirm('Deseja realmente gerar uma nova chave de API? A chave anterior será revogada.'))
      return
    setIsGerandoChave(true)
    try {
      const res = await regenerarApiKeyCdv(
        cdvCnpj || '76.123.456/0001-12',
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
    if (!pecasDoLote[loteId]) {
      setIsLoadingPecas(true)
      try {
        const pecas = await listarPecasPorLote(loteId)
        setPecasDoLote((prev) => ({ ...prev, [loteId]: pecas }))
      } catch {
        /* intentionally ignored */
      } finally {
        setIsLoadingPecas(false)
      }
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

  const curlExemplo = `curl -X POST "${window.location.origin}/backend/v1/cdv/lotes" \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: ${chaveParaEnvio}" \\
  -d '${payloadJsonStr.replace(/\n/g, '').replace(/\s+/g, ' ')}'`

  return (
    <div className="space-y-8 animate-fade-in">
      {/* 1. PAINEL DE CREDENCIAIS & CHAVE DE API DO CDV */}
      <div className="p-6 sm:p-8 rounded-2xl bg-[#111820] border border-[#12B886]/40 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#16202B] border border-[#12B886]/30 flex items-center justify-center text-[#12B886]">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-heading font-bold text-lg text-[#F4F7FA]">
                CONSOLE DE APIS • INGESTÃO DE LOTES CDV
              </h2>
              <p className="text-xs text-[#93A3B5]">
                Autentique seu ERP ou e-commerce para emissão automática de Passaportes Digitais de
                Peça (DPP).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRegenerarChave}
              disabled={isGerandoChave}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#16202B] border border-[rgba(244,247,250,0.15)] text-[#F4F7FA] hover:border-[#12B886] flex items-center gap-1.5 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isGerandoChave ? 'animate-spin' : ''}`} />
              <span>{isGerandoChave ? 'Regenerando...' : 'Regenerar Chave'}</span>
            </button>
          </div>
        </div>

        {/* Chave de API & Endpoint Info */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-8 p-4 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.08)] space-y-2">
            <span className="text-[10px] uppercase font-bold text-[#93A3B5] block">
              Sua Chave de API Ativa (Header &quot;X-API-Key&quot;):
            </span>
            <div className="flex items-center justify-between gap-3 bg-[#111820] p-2.5 rounded-lg border border-[#12B886]/30">
              <span className="font-mono text-xs text-[#12B886] font-bold truncate">
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
                className="px-2.5 py-1 rounded bg-[#16202B] text-xs font-semibold text-[#93A3B5] hover:text-[#F4F7FA] hover:bg-[#12B886]/20 transition-all flex items-center gap-1 shrink-0"
              >
                {copiedKey ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#12B886]" />
                    <span className="text-[#12B886]">Copiada!</span>
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
              Chave criptografada com hash SHA-256 no banco de dados. Nunca exponha sua chave em
              repositórios públicos.
            </p>
          </div>

          <div className="lg:col-span-4 p-4 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.08)] flex flex-col justify-between text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-[#D9B36C] block mb-1">
                Endpoint REST de Ingestão:
              </span>
              <div className="font-mono text-[11px] text-[#F4F7FA] bg-[#111820] p-1.5 rounded border border-[rgba(244,247,250,0.1)] truncate">
                POST /backend/v1/cdv/lotes
              </div>
            </div>
            <div className="pt-2 text-[10px] text-[#93A3B5] flex justify-between border-t border-[rgba(244,247,250,0.06)] mt-2">
              <span>CDV: {cdvCodigo || 'DETRAN-PR-CDV-0089'}</span>
              <span className="text-[#12B886] font-bold">Status: Online ✓</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. DASHBOARD DE TOTALIZADORES CDV */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.1)] shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase font-bold text-[#93A3B5]">Lotes Recebidos</span>
            <Layers className="w-4 h-4 text-[#12B886]" />
          </div>
          <div className="font-heading font-black text-2xl text-[#F4F7FA]">
            {metricas.totalLotes}
          </div>
          <span className="text-[10px] text-[#93A3B5] mt-1 block">Veículos processados</span>
        </div>

        <div className="p-5 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.1)] shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase font-bold text-[#93A3B5]">Peças com DPP</span>
            <FileCode className="w-4 h-4 text-[#3B82F6]" />
          </div>
          <div className="font-heading font-black text-2xl text-[#3B82F6]">
            {metricas.totalPecas}
          </div>
          <span className="text-[10px] text-[#93A3B5] mt-1 block">Selos únicos gerados</span>
        </div>

        <div className="p-5 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.1)] shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase font-bold text-[#93A3B5]">Desvio de Sucata</span>
            <Truck className="w-4 h-4 text-[#D9B36C]" />
          </div>
          <div className="font-heading font-black text-2xl text-[#D9B36C]">
            {metricas.totalPesoKg.toLocaleString('pt-BR')} kg
          </div>
          <span className="text-[10px] text-[#93A3B5] mt-1 block">Total em peso reaproveitado</span>
        </div>

        <div className="p-5 rounded-2xl bg-[#111820] border border-[#12B886]/40 shadow-lg bg-gradient-to-br from-[#111820] to-[#16202B]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase font-bold text-[#12B886]">
              Total CO₂e Evitado
            </span>
            <Leaf className="w-4 h-4 text-[#12B886]" />
          </div>
          <div className="font-heading font-black text-2xl text-[#12B886]">
            {metricas.totalCo2eKg.toLocaleString('pt-BR')} kg
          </div>
          <span className="text-[10px] text-[#12B886]/80 mt-1 block font-semibold">
            Insetting ISO 14067 apurado
          </span>
        </div>
      </div>

      {/* 2.1 PAINEL CENTRAL DE AUDITORIA DE CONSULTAS DPP (ARQUIVO CENTRAL CDV) */}
      <div className="p-6 sm:p-8 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.12)] shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#16202B] border border-[#12B886]/30 flex items-center justify-center text-[#12B886]">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-base text-[#F4F7FA]">
                ARQUIVO CENTRAL DE AUDITORIA & VERIFICAÇÕES DPP
              </h3>
              <p className="text-xs text-[#93A3B5]">
                Rastreabilidade de leituras de passaportes (lote consolidado e individuais) por
                canal (QR Code × Web × Embed) e validação de hash SHA-256.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-[#12B886] bg-[#12B886]/10 px-3 py-1 rounded-full border border-[#12B886]/30 font-bold">
              {metricasConsultas.total} leituras auditadas
            </span>
          </div>
        </div>

        {/* 4 Cards de Métricas de Canais */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          <div className="p-4 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.08)]">
            <div className="flex items-center justify-between text-[#12B886] mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider">Canal QR Code</span>
              <QrCode className="w-4 h-4" />
            </div>
            <div className="text-xl font-heading font-black text-[#F4F7FA]">
              {metricasConsultas.qr}
            </div>
            <span className="text-[10px] text-[#93A3B5] block mt-0.5">
              Leituras físicas via etiqueta
            </span>
          </div>

          <div className="p-4 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.08)]">
            <div className="flex items-center justify-between text-[#3B82F6] mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider">
                Canal Web Direto
              </span>
              <Globe className="w-4 h-4" />
            </div>
            <div className="text-xl font-heading font-black text-[#F4F7FA]">
              {metricasConsultas.web}
            </div>
            <span className="text-[10px] text-[#93A3B5] block mt-0.5">
              Navegação no portal público
            </span>
          </div>

          <div className="p-4 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.08)]">
            <div className="flex items-center justify-between text-[#D9B36C] mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider">
                Canal Widget Embed
              </span>
              <Code2 className="w-4 h-4" />
            </div>
            <div className="text-xl font-heading font-black text-[#F4F7FA]">
              {metricasConsultas.embed}
            </div>
            <span className="text-[10px] text-[#93A3B5] block mt-0.5">
              Cliques via catálogo e-commerce
            </span>
          </div>

          <div className="p-4 rounded-xl bg-[#0A0E12] border border-[#12B886]/40">
            <div className="flex items-center justify-between text-[#12B886] mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider">
                Integridade de Hash
              </span>
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div className="text-xl font-heading font-black text-[#12B886]">
              {metricasConsultas.total > 0
                ? `${Math.round((metricasConsultas.conferidos / metricasConsultas.total) * 100)}%`
                : '100%'}
            </div>
            <span className="text-[10px] text-[#93A3B5] block mt-0.5">
              {metricasConsultas.conferidos} conferidos ✓{' '}
              {metricasConsultas.divergentes > 0 ? `| ${metricasConsultas.divergentes} div.` : ''}
            </span>
          </div>
        </div>

        {/* 5 Últimas Consultas com IP Mascarado conforme LGPD */}
        <div className="pt-2">
          <span className="text-[11px] font-mono text-[#93A3B5] uppercase block mb-2 font-bold">
            Últimas leituras registradas no CDV (IPs anonimizados conforme LGPD):
          </span>
          {consultasDpp.length === 0 ? (
            <div className="text-center py-4 bg-[#0A0E12] rounded-xl border border-[rgba(244,247,250,0.06)] text-xs text-[#93A3B5]">
              Nenhuma leitura de DPP registrada até o momento. Acesse a página pública de um lote ou
              escaneie um QR Code para iniciar o registro.
            </div>
          ) : (
            <div className="overflow-x-auto bg-[#0A0E12] rounded-xl border border-[rgba(244,247,250,0.08)]">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-[rgba(244,247,250,0.08)] text-[#93A3B5] uppercase font-semibold text-[10px]">
                  <tr>
                    <th className="py-2 px-3">Data / Hora</th>
                    <th className="py-2 px-3">Alvo / Identificador</th>
                    <th className="py-2 px-3">Tipo</th>
                    <th className="py-2 px-3">Canal</th>
                    <th className="py-2 px-3">IP Mascarado (LGPD)</th>
                    <th className="py-2 px-3 text-right">Hash SHA-256</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[rgba(244,247,250,0.05)] text-[#F4F7FA]">
                  {consultasDpp.slice(0, 5).map((item) => (
                    <tr key={item.id} className="hover:bg-[#16202B]/40 transition-colors">
                      <td className="py-2 px-3 font-mono text-[11px] text-[#93A3B5]">
                        {new Date(item.created).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-2 px-3 font-mono font-bold text-[#12B886]">
                        {item.alvo_identificador}
                      </td>
                      <td className="py-2 px-3">
                        <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#16202B] text-[#93A3B5]">
                          {item.alvo_tipo === 'selo' ? 'Peça' : 'Lote'}
                        </span>
                      </td>
                      <td className="py-2 px-3">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                            item.canal === 'qr'
                              ? 'bg-[#12B886]/15 text-[#12B886]'
                              : item.canal === 'embed'
                                ? 'bg-[#D9B36C]/15 text-[#D9B36C]'
                                : 'bg-[#3B82F6]/15 text-[#3B82F6]'
                          }`}
                        >
                          {item.canal === 'qr' && <QrCode className="w-3 h-3" />}
                          {item.canal === 'embed' && <Code2 className="w-3 h-3" />}
                          {item.canal === 'web' && <Globe className="w-3 h-3" />}
                          <span>{item.canal}</span>
                        </span>
                      </td>
                      <td className="py-2 px-3 font-mono text-[11px] text-[#93A3B5]">
                        {item.ip_mascarado || '189.40.xxx.xxx'}
                      </td>
                      <td className="py-2 px-3 text-right">
                        {item.hash_conferido !== false ? (
                          <span className="inline-flex items-center gap-1 text-[#12B886] font-bold font-mono text-[11px]">
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
      <div className="p-6 sm:p-8 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.12)] shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-[#12B886]" />
            <h3 className="font-heading font-bold text-base text-[#F4F7FA]">
              TESTADOR EM TEMPO REAL (DISPARAR POST /backend/v1/cdv/lotes)
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => copyToClip(curlExemplo, setCopiedCurl)}
              className="text-xs text-[#93A3B5] hover:text-[#12B886] flex items-center gap-1 font-mono"
            >
              {copiedCurl ? (
                <span className="text-[#12B886]">cURL Copiado!</span>
              ) : (
                <>
                  <Code2 className="w-3.5 h-3.5" />
                  <span>Copiar cURL</span>
                </>
              )}
            </button>
          </div>
        </div>
        <p className="text-xs text-[#93A3B5] mb-4">
          Edite o JSON abaixo para simular o envio de um lote com veículo doador e array de peças. O
          endpoint calculará os fatores de emissão evitada, gerará os selos e hashes SHA-256 e
          retornará os DPPs criados.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Editor JSON */}
          <div className="lg:col-span-7 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#93A3B5] font-mono text-[11px]">
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
              className="w-full p-3 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.15)] text-[#12B886] font-mono text-xs focus:outline-none focus:ring-1 focus:ring-[#12B886] leading-relaxed"
            />
            <div className="flex items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2 flex-1">
                <span className="text-xs text-[#93A3B5] font-mono">X-API-Key:</span>
                <input
                  type="text"
                  value={chaveParaEnvio}
                  onChange={(e) => setChaveParaEnvio(e.target.value)}
                  className="flex-1 px-3 py-1.5 rounded-lg bg-[#0A0E12] border border-[rgba(244,247,250,0.15)] text-xs text-[#F4F7FA] font-mono"
                  placeholder="Informe a chave de API..."
                />
              </div>
              <button
                type="button"
                onClick={handleDispararTeste}
                disabled={isDisparando}
                className="px-5 py-2.5 rounded-xl font-bold text-xs bg-[#12B886] text-[#0A0E12] hover:bg-[#0CA678] transition-all flex items-center gap-2 shadow-emerald-glow disabled:opacity-50 shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isDisparando ? 'Processando Lote...' : 'Disparar Ingestão'}</span>
              </button>
            </div>
          </div>

          {/* Resposta do Endpoint */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-2">
            <span className="text-[#93A3B5] font-mono text-[11px]">
              Resposta da API (HTTP 201 Created):
            </span>
            <div className="flex-1 p-3 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.15)] overflow-y-auto max-h-[380px] font-mono text-xs text-[#F4F7FA]">
              {erroTeste ? (
                <div className="p-3 rounded-lg bg-[#F03E54]/10 border border-[#F03E54]/30 text-xs text-[#F03E54] flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{erroTeste}</span>
                </div>
              ) : respostaTeste ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-[rgba(244,247,250,0.1)]">
                    <span className="text-[#12B886] font-bold">Sucesso: true</span>
                    <span className="text-[#D9B36C]">Lote: {respostaTeste.lote_id}</span>
                  </div>
                  <div className="text-[11px] text-[#93A3B5]">
                    Peças criadas:{' '}
                    <strong className="text-[#F4F7FA]">{respostaTeste.total_pecas_criadas}</strong>{' '}
                    | Peso:{' '}
                    <strong className="text-[#F4F7FA]">{respostaTeste.total_peso_kg} kg</strong> |
                    CO₂e:{' '}
                    <strong className="text-[#12B886]">
                      -{respostaTeste.total_co2e_evitado_kg} kg
                    </strong>
                  </div>
                  <pre className="text-[10px] text-[#93A3B5] overflow-x-auto leading-relaxed">
                    {JSON.stringify(respostaTeste, null, 2)}
                  </pre>
                </div>
              ) : (
                <div className="text-center py-16 text-[#93A3B5] text-xs">
                  Envie a requisição para visualizar o resultado em tempo real.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 4. HISTÓRICO DE LOTES & DRILL-DOWN PARA PEÇAS / DPP */}
      <div className="p-6 sm:p-8 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.12)] shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-[#12B886]" />
            <h3 className="font-heading font-bold text-base text-[#F4F7FA]">
              HISTÓRICO DE LOTES INGERIDOS & DRILL-DOWN DE PEÇAS
            </h3>
          </div>
          <span className="text-xs font-mono text-[#93A3B5]">{lotes.length} lotes registrados</span>
        </div>

        {isLoadingLotes ? (
          <div className="text-center py-8 text-xs text-[#93A3B5]">
            Carregando histórico de lotes...
          </div>
        ) : lotes.length === 0 ? (
          <div className="text-center py-8 border border-dashed border-[rgba(244,247,250,0.1)] rounded-xl text-xs text-[#93A3B5]">
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
                  className="rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.08)] overflow-hidden transition-all"
                >
                  {/* Cabeçalho do Lote */}
                  <div
                    onClick={() => handleToggleLote(lote.id)}
                    className="p-4 cursor-pointer hover:bg-[#16202B]/60 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-[#12B886] shrink-0" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-[#93A3B5] shrink-0" />
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-[#F4F7FA]">
                            {lote.veiculo_marca_modelo}
                          </span>
                          <span className="font-mono text-xs text-[#12B886] bg-[#12B886]/10 px-2 py-0.5 rounded border border-[#12B886]/30">
                            {lote.veiculo_baixa_detran}
                          </span>
                        </div>
                        <div className="text-[11px] text-[#93A3B5] mt-0.5">
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
                            <span className="text-[10px] text-[#93A3B5] block uppercase">
                              Peças
                            </span>
                            <span className="font-bold text-[#F4F7FA]">
                              {lote.total_pecas} itens
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-[#93A3B5] block uppercase">
                              Peso Total
                            </span>
                            <span className="font-bold text-[#D9B36C]">
                              {lote.total_peso_kg} kg
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-[#12B886] block uppercase font-bold">
                              CO₂e Evitado
                            </span>
                            <span className="font-bold text-[#12B886] font-heading text-sm">
                              -{lote.total_co2e_evitado_kg} kg
                            </span>
                          </div>

                          {/* Consultas deste lote */}
                          <div className="p-1.5 px-2.5 rounded-lg bg-[#111820] border border-[rgba(244,247,250,0.1)] text-[11px]">
                            <span className="text-[9px] text-[#93A3B5] block uppercase font-bold">
                              Verificações DPP
                            </span>
                            <div className="flex items-center gap-1.5 font-mono">
                              <strong className="text-[#12B886]">{loteStats.total}</strong>
                              <span className="text-[10px] text-[#93A3B5]">
                                (QR: {loteStats.qr} • Web: {loteStats.web} • Emb: {loteStats.embed})
                              </span>
                            </div>
                          </div>

                          <span className="px-2 py-0.5 rounded-full bg-[#12B886]/20 text-[#12B886] text-[10px] font-bold uppercase">
                            {lote.status}
                          </span>
                          <a
                            href={`/passaporte-lote/${lote.id}`}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="px-2.5 py-1 rounded-lg bg-[#12B886]/10 hover:bg-[#12B886]/20 text-[#12B886] border border-[#12B886]/30 font-bold text-[11px] inline-flex items-center gap-1.5 transition-colors"
                            title="Abrir DPP Consolidado do Lote"
                          >
                            <span>DPP Consolidado do Lote</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      )
                    })()}
                  </div>

                  {/* Drill-down de Peças do Lote */}
                  {isExpanded && (
                    <div className="p-4 bg-[#111820] border-t border-[rgba(244,247,250,0.08)]">
                      <div className="flex items-center justify-between mb-3 text-xs text-[#93A3B5]">
                        <div className="flex items-center gap-2">
                          <span className="font-bold uppercase tracking-wider text-[#F4F7FA] text-[11px]">
                            Passaportes Digitais Emitidos para este Lote ({pecas.length} DPPs)
                          </span>
                          <a
                            href={`/passaporte-lote/${lote.id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] text-[#12B886] hover:underline font-semibold"
                          >
                            <span>(Abrir DPP Consolidado Imprimível)</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                        <span className="text-[11px] font-mono">
                          Lote ID: {lote.id} • {new Date(lote.created).toLocaleDateString('pt-BR')}
                        </span>
                      </div>

                      {isLoadingPecas && pecas.length === 0 ? (
                        <div className="text-center py-4 text-xs text-[#93A3B5]">
                          Carregando peças...
                        </div>
                      ) : pecas.length === 0 ? (
                        <div className="text-center py-4 text-xs text-[#93A3B5]">
                          Nenhuma peça listada para este lote.
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs">
                            <thead className="border-b border-[rgba(244,247,250,0.1)] text-[#93A3B5] uppercase font-semibold">
                              <tr>
                                <th className="py-2 px-3">Selo DPP</th>
                                <th className="py-2 px-3">SKU</th>
                                <th className="py-2 px-3">Descrição da Peça</th>
                                <th className="py-2 px-3">Material</th>
                                <th className="py-2 px-3 text-right">Peso</th>
                                <th className="py-2 px-3 text-right">CO₂e Evitado</th>
                                <th className="py-2 px-3 text-center">Ações</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[rgba(244,247,250,0.06)] text-[#F4F7FA]">
                              {pecas.map((peca) => (
                                <tr
                                  key={peca.id}
                                  className="hover:bg-[#16202B]/60 transition-colors"
                                >
                                  <td className="py-2.5 px-3">
                                    <span className="font-mono font-bold text-[#12B886]">
                                      {peca.selo_dpp}
                                    </span>
                                  </td>
                                  <td className="py-2.5 px-3 font-mono text-[11px] text-[#93A3B5]">
                                    {peca.sku_interno}
                                  </td>
                                  <td className="py-2.5 px-3 font-medium">{peca.descricao_peca}</td>
                                  <td className="py-2.5 px-3">
                                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-[#16202B] text-[#D9B36C]">
                                      {peca.categoria_material}
                                    </span>
                                  </td>
                                  <td className="py-2.5 px-3 text-right font-mono">
                                    {peca.peso_kg} kg
                                  </td>
                                  <td className="py-2.5 px-3 text-right font-mono font-bold text-[#12B886]">
                                    -{peca.co2e_evitado_kg} kg
                                  </td>
                                  <td className="py-2.5 px-3 text-center">
                                    <div className="flex items-center justify-center gap-2">
                                      <a
                                        href={`/passaporte/${peca.selo_dpp}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="p-1 rounded text-[#93A3B5] hover:text-[#12B886] hover:bg-[#12B886]/10 transition-colors"
                                        title="Abrir Passaporte Público (DPP)"
                                      >
                                        <ExternalLink className="w-3.5 h-3.5" />
                                      </a>
                                      <button
                                        type="button"
                                        onClick={() => setPecaParaEtiqueta(peca)}
                                        className="p-1 rounded text-[#93A3B5] hover:text-[#D9B36C] hover:bg-[#D9B36C]/10 transition-colors"
                                        title="Imprimir Etiqueta com QR Code"
                                      >
                                        <Printer className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* 5. DOCUMENTAÇÃO DO WIDGET DE EMBED */}
      <div className="p-6 sm:p-8 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.1)] space-y-4">
        <div className="flex items-center gap-2">
          <Code2 className="w-5 h-5 text-[#12B886]" />
          <h3 className="font-heading font-bold text-base text-[#F4F7FA]">
            COMO INSTALAR O WIDGET DE SELO ECOLÓGICO NO SEU E-COMMERCE
          </h3>
        </div>
        <p className="text-xs text-[#93A3B5] leading-relaxed">
          Para exibir o selo de autenticidade circular e emissões evitadas diretamente na página de
          produto da sua loja virtual, insira o código HTML e o script público:
        </p>

        <div className="p-4 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.1)] space-y-3 font-mono text-xs">
          <div>
            <span className="text-[10px] text-[#93A3B5] uppercase block mb-1">
              1. Tag HTML na página do produto:
            </span>
            <div className="text-[#12B886] bg-[#111820] p-2.5 rounded-lg border border-[rgba(244,247,250,0.08)] overflow-x-auto">
              &lt;div class=&quot;orbis-eco-seal&quot; data-seal=&quot;PR-SEAL-2026-991823&quot;
              data-co2=&quot;41.33kg&quot;&gt;🌱 Peça Circular: -41.33kg CO₂e&lt;/div&gt;
            </div>
          </div>

          <div>
            <span className="text-[10px] text-[#93A3B5] uppercase block mb-1">
              2. Script de inicialização (antes de fechar &lt;/body&gt;):
            </span>
            <div className="text-[#D9B36C] bg-[#111820] p-2.5 rounded-lg border border-[rgba(244,247,250,0.08)] overflow-x-auto">
              &lt;script src=&quot;{window.location.origin}/orbis-cdv-embed.js&quot;
              async&gt;&lt;/script&gt;
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-[#12B886]">
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
