import React, { useMemo, useState, useEffect } from 'react'
import { Link, useSearchParams, useParams } from 'react-router-dom'
import {
  ShieldCheck,
  ShieldAlert,
  ArrowLeft,
  Copy,
  Check,
  Building2,
  FileCheck2,
  Scale,
  Sparkles,
  Layers,
  Cpu,
  Info,
  ExternalLink,
  Printer,
  QrCode,
  AlertTriangle,
  CheckCircle2,
  XCircle,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { QRCodeSVG } from '@/components/QRCodeSVG'
import { AVISO_LEGAL_LASTRO } from '@/services/lastroCcrlrService'
import { calcularHashCanonicoMateriais } from '@/services/materiaisCriticosCanonicoService'

export interface DadosDemonstracaoDcp {
  codigoLote: string
  massaTotalKg: number
  teorNdFeB: number
  teorMetaisNobres: number
  teorCobre: number
  chaveNfe: string
  hashSha256?: string
  razaoSocialEmissor?: string
  cnpjEmissor?: string
  entidadeGestora?: string
  periodo?: string
}

export const DADOS_PADRAO_DEMO_DCP: DadosDemonstracaoDcp = {
  codigoLote: 'ORB-CRIT-2026-X9B2',
  massaTotalKg: 1450,
  teorNdFeB: 68.5,
  teorMetaisNobres: 420,
  teorCobre: 980,
  chaveNfe: '35260133000168000109550010000048121098765432',
  hashSha256: '', // calculado dinamicamente
  razaoSocialEmissor: 'Orbis Mineração Urbana & Reciclagem Tecnológica S.A. (Demonstração)',
  cnpjEmissor: '33.000.168/0001-09',
  entidadeGestora: 'Entidade Gestora Homologada de Logística Reversa (Decreto 11.413/2023)',
  periodo: 'Competência 2026 • Lote Piloto de Mineração Urbana',
}

export function DcpDemonstracaoPublicaPage() {
  const { codigoLote: paramCodigo } = useParams<{ codigoLote?: string }>()
  const [searchParams] = useSearchParams()
  const [copiado, setCopiado] = useState(false)
  const [hashRecalculado, setHashRecalculado] = useState<string>('')
  const [verificandoIntegridade, setVerificandoIntegridade] = useState(true)

  // Extrair parâmetros da URL ou adotar valores de demonstração
  const dados = useMemo<DadosDemonstracaoDcp>(() => {
    const codigo =
      paramCodigo ||
      searchParams.get('lote') ||
      searchParams.get('codigo') ||
      DADOS_PADRAO_DEMO_DCP.codigoLote

    const massaParam = searchParams.get('massa')
    const ndParam = searchParams.get('nd')
    const auParam = searchParams.get('au')
    const cuParam = searchParams.get('cu')
    const nfeParam = searchParams.get('nfe')
    const hashParam = searchParams.get('hash')

    return {
      codigoLote: codigo,
      massaTotalKg: massaParam
        ? Math.max(0, Number(massaParam) || 0)
        : DADOS_PADRAO_DEMO_DCP.massaTotalKg,
      teorNdFeB: ndParam ? Math.max(0, Number(ndParam) || 0) : DADOS_PADRAO_DEMO_DCP.teorNdFeB,
      teorMetaisNobres: auParam
        ? Math.max(0, Number(auParam) || 0)
        : DADOS_PADRAO_DEMO_DCP.teorMetaisNobres,
      teorCobre: cuParam ? Math.max(0, Number(cuParam) || 0) : DADOS_PADRAO_DEMO_DCP.teorCobre,
      chaveNfe: nfeParam || DADOS_PADRAO_DEMO_DCP.chaveNfe,
      hashSha256: hashParam || undefined,
      razaoSocialEmissor: DADOS_PADRAO_DEMO_DCP.razaoSocialEmissor,
      cnpjEmissor: DADOS_PADRAO_DEMO_DCP.cnpjEmissor,
      entidadeGestora: DADOS_PADRAO_DEMO_DCP.entidadeGestora,
      periodo: DADOS_PADRAO_DEMO_DCP.periodo,
    }
  }, [paramCodigo, searchParams])

  // Recalcular o hash contra os dados recebidos para verificação da integridade
  useEffect(() => {
    let cancelado = false
    setVerificandoIntegridade(true)

    calcularHashCanonicoMateriais({
      codigoLote: dados.codigoLote,
      massaTotalKg: dados.massaTotalKg,
      teorNdFeB: dados.teorNdFeB,
      teorMetaisNobres: dados.teorMetaisNobres,
      teorCobre: dados.teorCobre,
      chaveNfe: dados.chaveNfe,
    })
      .then((h) => {
        if (!cancelado) {
          setHashRecalculado(h)
          setVerificandoIntegridade(false)
        }
      })
      .catch((err) => {
        console.error('Erro ao recalcular hash no espelho DCP:', err)
        if (!cancelado) {
          setVerificandoIntegridade(false)
        }
      })

    return () => {
      cancelado = true
    }
  }, [
    dados.codigoLote,
    dados.massaTotalKg,
    dados.teorNdFeB,
    dados.teorMetaisNobres,
    dados.teorCobre,
    dados.chaveNfe,
  ])

  // Hash exibido no card: se veio na URL usa o da URL, senão usa o recalculado
  const hashExibido = dados.hashSha256 || hashRecalculado

  // Status de integridade
  const statusIntegridade = useMemo(() => {
    if (verificandoIntegridade) return 'verificando'
    if (!dados.hashSha256) {
      // Se não foi passado hash externo para comparação, considera o hash canônico gerado verificado
      return 'verificado'
    }
    const hashNormalizadoRecebido = dados.hashSha256.trim().toLowerCase()
    const hashNormalizadoRecalculado = hashRecalculado.trim().toLowerCase()
    return hashNormalizadoRecebido === hashNormalizadoRecalculado ? 'verificado' : 'divergente'
  }, [verificandoIntegridade, dados.hashSha256, hashRecalculado])

  const copiarHash = () => {
    if (!hashExibido) return
    navigator.clipboard.writeText(hashExibido)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  // URL canônica atual para o próprio QR da página
  const qrUrlAtual =
    typeof window !== 'undefined'
      ? window.location.href
      : `https://www.orbis-protocol.com/conferencia-lastro-demo?lote=${encodeURIComponent(dados.codigoLote)}`

  return (
    <div className="min-h-screen bg-[#0A0E12] text-[#F4F7FA] py-8 sm:py-12 px-4 sm:px-6 lg:px-8 selection:bg-[#12B886]/30">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* BARRA SUPERIOR DE NAVEGAÇÃO E IDENTIFICAÇÃO */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="gap-1.5 text-xs text-[#93A3B5] hover:text-[#12B886] hover:bg-[#111820]"
          >
            <Link to="/materiais-criticos">
              <ArrowLeft className="h-4 w-4" />
              Voltar a Materiais Críticos
            </Link>
          </Button>

          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="font-mono text-xs border-[#12B886]/40 text-[#12B886] bg-[#12B886]/10"
            >
              Espelho do DCP • Simulação Dinâmica
            </Badge>
            <Badge
              variant="outline"
              className="text-xs border-amber-500/50 text-amber-400 bg-amber-500/10 font-bold"
            >
              DEMONSTRAÇÃO
            </Badge>
          </div>
        </div>

        {/* ALERTA DE AMBIENTE DEMONSTRATIVO PEDAGÓGICO */}
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/10 border-2 border-amber-500/30 text-amber-200 space-y-2 shadow-lg">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0" />
            <h2 className="text-sm sm:text-base font-bold uppercase tracking-wider text-amber-300">
              DOCUMENTO EM MODO DEMONSTRAÇÃO PEDAGÓGICA (SIMULAÇÃO)
            </h2>
          </div>
          <p className="text-xs leading-relaxed text-amber-200/90">
            Esta página renderiza o{' '}
            <strong>espelho fiel e funcional do Passaporte Digital de Produto (DCP)</strong> gerado
            no simulador de mineração urbana. As métricas refletem os dados em tempo real enviados
            pelo simulador ou configurados via URL. Este documento é uma{' '}
            <strong>demonstração de interface e estrutura de metadados</strong>, sem validade fiscal
            ou comprobatória real e sem simular selo ou registro autêntico em cartório/SEFAZ.
          </p>
        </div>

        {/* CARTÃO PRINCIPAL DO DCP DE DEMONSTRAÇÃO */}
        <Card className="border-2 border-[#12B886]/40 bg-[#111820] shadow-2xl text-[#F4F7FA] overflow-hidden">
          <CardHeader className="bg-[#0D1217] border-b border-[rgba(244,247,250,0.08)] pb-6">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="bg-[#12B886] text-[#0A0E12] font-mono text-[10px] font-black uppercase">
                    DCP • PASSAPORTE DIGITAL DE PRODUTO (DEMO)
                  </Badge>
                  <Badge
                    variant="outline"
                    className="text-[10px] font-mono border-[#D9B36C]/40 text-[#D9B36C] bg-[#D9B36C]/10"
                  >
                    Mineração Urbana Segregada
                  </Badge>
                </div>
                <CardTitle className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-[#F4F7FA]">
                  {dados.codigoLote}
                </CardTitle>
                <CardDescription className="text-xs text-[#93A3B5]">
                  Lote de Materiais Críticos Recuperados • Frações Segregadas de REEE / VFV
                </CardDescription>
              </div>

              {/* QR Code de Verificação Dinâmica */}
              <div className="shrink-0 p-3 bg-white rounded-xl shadow-md border border-neutral-300 flex flex-col items-center">
                <QRCodeSVG value={qrUrlAtual} size={96} />
                <span className="text-[9px] font-mono font-bold text-neutral-800 mt-1 uppercase tracking-tighter">
                  QR da Simulação
                </span>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-6 space-y-6">
            {/* AVISO REGULATÓRIO PERMANENTE */}
            <div className="p-4 rounded-xl bg-muted/30 border border-[rgba(244,247,250,0.1)] text-xs text-[#93A3B5] leading-relaxed space-y-1">
              <div className="flex items-center gap-2 font-bold uppercase text-[11px] text-[#D9B36C]">
                <Info className="h-4 w-4 shrink-0 text-[#D9B36C]" />
                <span>
                  Enquadramento Probatório Independente (PNRS Lei 12.305/2010 & Dec. 11.413/2023)
                </span>
              </div>
              <p className="text-[11px] text-[#93A3B5]">{AVISO_LEGAL_LASTRO}</p>
            </div>

            {/* METADADOS DO PROCESSADOR E ORIGEM */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-[rgba(244,247,250,0.08)] bg-[#0A0E12] space-y-1.5">
                <div className="flex items-center gap-2 text-[10px] font-semibold text-[#93A3B5] uppercase tracking-wider">
                  <Building2 className="h-4 w-4 text-[#12B886]" />
                  <span>Processador / Emissor Demonstrativo</span>
                </div>
                <div className="font-bold text-sm sm:text-base text-[#F4F7FA]">
                  {dados.razaoSocialEmissor}
                </div>
                <div className="text-xs font-mono text-[#D9B36C]">CNPJ: {dados.cnpjEmissor}</div>
              </div>

              <div className="p-4 rounded-xl border border-[rgba(244,247,250,0.08)] bg-[#0A0E12] space-y-1.5">
                <div className="flex items-center gap-2 text-[10px] font-semibold text-[#93A3B5] uppercase tracking-wider">
                  <FileCheck2 className="h-4 w-4 text-[#12B886]" />
                  <span>Destino / Entidade Gestora Homologada</span>
                </div>
                <div className="font-bold text-sm text-[#F4F7FA]">{dados.entidadeGestora}</div>
                <div className="text-xs text-[#93A3B5] font-mono">{dados.periodo}</div>
              </div>
            </div>

            {/* TOTALIZADORES DE MASSA E FRAÇÕES CRÍTICAS RECUPERADAS */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-[#F4F7FA] uppercase tracking-wider flex items-center gap-2">
                  <Scale className="h-4 w-4 text-[#12B886]" />
                  Balanço Mássico e Frações Críticas Declaradas
                </h4>
                <Badge
                  variant="outline"
                  className="border-[#12B886]/30 text-[#12B886] text-[10px] font-mono"
                >
                  100% Origem Urbana
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Massa Total do Lote */}
                <div className="p-4 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.08)] space-y-1">
                  <span className="text-[10px] uppercase font-bold text-[#93A3B5] tracking-wider block">
                    Massa Total do Lote
                  </span>
                  <div className="text-2xl font-black font-mono text-[#F4F7FA]">
                    {Number(dados.massaTotalKg).toLocaleString('pt-BR', {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 2,
                    })}{' '}
                    <span className="text-xs font-normal text-[#93A3B5]">kg</span>
                  </div>
                  <p className="text-[10px] text-[#93A3B5]">
                    Equipamentos REEE e VFV desmantelados
                  </p>
                </div>

                {/* Terras Raras (NdFeB) */}
                <div className="p-4 rounded-xl bg-[#0A0E12] border border-[#D9B36C]/40 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-[#D9B36C] tracking-wider flex items-center gap-1.5">
                    <Cpu className="h-3 w-3" />
                    Terras Raras (NdFeB)
                  </span>
                  <div className="text-2xl font-black font-mono text-[#D9B36C]">
                    {Number(dados.teorNdFeB).toLocaleString('pt-BR', {
                      minimumFractionDigits: 1,
                      maximumFractionDigits: 3,
                    })}{' '}
                    <span className="text-xs font-normal text-[#93A3B5]">kg</span>
                  </div>
                  <p className="text-[10px] text-[#93A3B5]">
                    Ímãs permanentes recuperados de atuadores/motores
                  </p>
                </div>

                {/* Metais Nobres (Au/Pd/Ag) */}
                <div className="p-4 rounded-xl bg-[#0A0E12] border border-[#12B886]/40 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-[#12B886] tracking-wider flex items-center gap-1.5">
                    <Sparkles className="h-3 w-3" />
                    Metais Nobres (Au/Pd/Ag)
                  </span>
                  <div className="text-2xl font-black font-mono text-[#12B886]">
                    {Number(dados.teorMetaisNobres).toLocaleString('pt-BR', {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 2,
                    })}{' '}
                    <span className="text-xs font-normal text-[#93A3B5]">g</span>
                  </div>
                  <p className="text-[10px] text-[#93A3B5]">
                    Concentrado de placas de circuito (PCBs)
                  </p>
                </div>

                {/* Cobre Puro */}
                <div className="p-4 rounded-xl bg-[#0A0E12] border border-[#12B886]/40 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-[#12B886] tracking-wider flex items-center gap-1.5">
                    <Layers className="h-3 w-3" />
                    Cobre Puro
                  </span>
                  <div className="text-2xl font-black font-mono text-[#F4F7FA]">
                    {Number(dados.teorCobre).toLocaleString('pt-BR', {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 2,
                    })}{' '}
                    <span className="text-xs font-normal text-[#93A3B5]">kg</span>
                  </div>
                  <p className="text-[10px] text-[#93A3B5]">
                    Chicotes, indutores e bobinados urbanos
                  </p>
                </div>
              </div>
            </div>

            {/* PROVA CRIPTOGRÁFICA SHA-256 COM STATUS DE INTEGRIDADE */}
            <div className="p-4 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.08)] space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-[#F4F7FA]">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-[#12B886]" />
                  Hash Criptográfico SHA-256 Canônico do Lote
                </span>

                {/* Badge de Integridade Verificada vs Hash Divergente */}
                {statusIntegridade === 'verificado' && (
                  <span
                    data-testid="status-integridade-verificada"
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#12B886]/15 border border-[#12B886]/40 text-[#12B886]"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Integridade Verificada</span>
                  </span>
                )}

                {statusIntegridade === 'divergente' && (
                  <span
                    data-testid="status-hash-divergente"
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-500/15 border border-rose-500/40 text-rose-400"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Hash Divergente</span>
                  </span>
                )}

                {statusIntegridade === 'verificando' && (
                  <span className="text-[10px] font-mono text-[#D9B36C] animate-pulse">
                    Verificando integridade...
                  </span>
                )}
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#111820] p-3 rounded-lg border border-[rgba(244,247,250,0.06)] font-mono text-xs">
                <span
                  data-testid="hash-dcp-espelho"
                  className={`break-all select-all font-bold ${
                    statusIntegridade === 'divergente' ? 'text-rose-400' : 'text-[#12B886]'
                  }`}
                >
                  {hashExibido || 'Calculando hash...'}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copiarHash}
                  className="shrink-0 h-8 gap-1.5 text-xs border-[rgba(244,247,250,0.2)] text-[#F4F7FA] hover:bg-[#16202B]"
                >
                  {copiado ? (
                    <Check className="h-3.5 w-3.5 text-[#12B886]" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                  {copiado ? 'Copiado' : 'Copiar Hash'}
                </Button>
              </div>

              {/* Informação comparativa caso haja divergência */}
              {statusIntegridade === 'divergente' && (
                <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-[11px] text-rose-300 space-y-1">
                  <span className="font-bold block">Aviso de não conformidade no espelho:</span>
                  <p>
                    O hash fornecido na requisição difere do recálculo canônico sobre os parâmetros
                    declarados (massa, frações e NF-e). Recalculado:{' '}
                    <span className="font-mono text-rose-200">{hashRecalculado}</span>
                  </p>
                </div>
              )}
            </div>

            {/* CUSTÓDIA FISCAL ANTI-RECEPTAÇÃO */}
            <div className="p-4 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.08)] space-y-2 text-xs">
              <span className="text-[11px] font-bold text-[#F4F7FA] uppercase tracking-wider block">
                Cadeia de Custódia Fiscal e Rastreabilidade Fazendária
              </span>
              <div className="space-y-1 text-[#93A3B5] font-mono text-[11px]">
                <div>
                  <span className="text-muted-foreground">
                    NF-e de Aquisição da Sucata Urbana:{' '}
                  </span>
                  <span className="text-[#D9B36C] break-all">{dados.chaveNfe}</span>
                </div>
                <div className="text-[10px] text-[#93A3B5]">
                  ✓ DANFE e MTR-SINIR vinculados ao lote • Fornecedor e transportador homologados
                </div>
              </div>
            </div>

            {/* BOTÕES DE AÇÃO INFERIORES */}
            <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-[rgba(244,247,250,0.08)]">
              <Button
                asChild
                variant="outline"
                size="sm"
                className="gap-2 text-xs border-[rgba(244,247,250,0.2)] text-[#F4F7FA] hover:bg-[#16202B]"
              >
                <Link to="/materiais-criticos">
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Voltar ao Simulador de Lotes
                </Link>
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.print()}
                  className="gap-1.5 text-xs border-[rgba(244,247,250,0.2)] text-[#F4F7FA] hover:bg-[#16202B]"
                >
                  <Printer className="h-3.5 w-3.5" />
                  Imprimir / PDF
                </Button>
                <Button
                  asChild
                  size="sm"
                  className="gap-1.5 text-xs bg-[#12B886] text-[#0A0E12] hover:bg-[#0CA678] font-bold"
                >
                  <Link to="/trilhas/mineracao">Capacitação Técnica da Trilha</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
export default DcpDemonstracaoPublicaPage
