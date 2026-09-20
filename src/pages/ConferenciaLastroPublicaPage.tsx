import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Building2,
  Scale,
  FileCheck2,
  Copy,
  Check,
  ArrowLeft,
  QrCode,
  Info,
  ExternalLink,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { QRCodeSVG } from '@/components/QRCodeSVG'
import {
  consultarLastroPublico,
  type LastroCircularidadeRecord,
} from '@/services/lastroCcrlrService'

export function ConferenciaLastroPublicaPage() {
  const { codigoOuId } = useParams<{ codigoOuId: string }>()
  const [lastro, setLastro] = useState<LastroCircularidadeRecord | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [copiado, setCopiado] = useState(false)

  useEffect(() => {
    async function carregar() {
      if (!codigoOuId) {
        setErro('Código de lastro não informado.')
        setCarregando(false)
        return
      }

      setCarregando(true)
      try {
        const doc = await consultarLastroPublico(codigoOuId)
        if (doc) {
          setLastro(doc)
        } else {
          setErro('Documento de Lastro de Circularidade não encontrado ou código inválido.')
        }
      } catch (e: any) {
        setErro('Falha ao consultar lastro na rede.')
      } finally {
        setCarregando(false)
      }
    }
    carregar()
  }, [codigoOuId])

  const copiarHash = () => {
    if (!lastro?.hash_sha256) return
    navigator.clipboard.writeText(lastro.hash_sha256)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  if (carregando) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mb-4" />
        <p className="text-sm text-muted-foreground font-mono">
          Consultando lastro criptográfico na rede Orbis...
        </p>
      </div>
    )
  }

  if (erro || !lastro) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <Card className="max-w-md w-full border-destructive/40 shadow-lg">
          <CardHeader className="text-center">
            <ShieldAlert className="h-12 w-12 text-destructive mx-auto mb-2" />
            <CardTitle className="text-xl">Lastro Não Localizado</CardTitle>
            <CardDescription className="text-sm">
              {erro || 'Código de verificação inexistente no livro-razão imutável.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button asChild variant="outline" size="sm">
              <Link to="/">Voltar ao Início</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const isAnulado = lastro.status === 'anulado'
  const qrUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/conferencia-lastro/${lastro.codigo_lastro}`
      : `https://orbisprotocol.org/conferencia-lastro/${lastro.codigo_lastro}`

  return (
    <div className="min-h-screen bg-background text-foreground py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Barra superior de navegação */}
        <div className="flex items-center justify-between">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="gap-1.5 text-xs text-muted-foreground"
          >
            <Link to="/">
              <ArrowLeft className="h-4 w-4" />
              Portal Orbis Protocol
            </Link>
          </Button>

          <Badge variant="outline" className="font-mono text-xs border-primary/40 text-primary">
            Conferência Pública de Lastro dMRV
          </Badge>
        </div>

        {/* ALERTA CRÍTICO SE DOCUMENTO ANULADO */}
        {isAnulado && (
          <div className="p-5 rounded-2xl bg-destructive/15 border-2 border-destructive text-destructive space-y-2 shadow-lg animate-in fade-in">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-6 w-6 shrink-0" />
              <h2 className="text-lg font-bold uppercase tracking-wider">
                DOCUMENTO ANULADO — SEM VALIDADE TÉCNICA OU JURÍDICA
              </h2>
            </div>
            <p className="text-xs leading-relaxed opacity-90">
              Este Lastro de Circularidade foi formalmente anulado pela administração pericial do
              sistema através de procedimento auditável em conformidade com as regras de governança
              da plataforma.
            </p>
            {lastro.motivo_anulacao && (
              <div className="p-3 rounded-lg bg-destructive/20 border border-destructive/30 text-xs mt-2">
                <strong>Justificativa da Anulação:</strong> {lastro.motivo_anulacao}
                {lastro.anulado_em && (
                  <div className="text-[11px] font-mono mt-1 opacity-80">
                    Data da anulação: {new Date(lastro.anulado_em).toLocaleString('pt-BR')} •
                    Operador: {lastro.anulado_por || 'admin'}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* CARTÃO PRINCIPAL DO LASTRO */}
        <Card
          className={`border-2 shadow-xl ${isAnulado ? 'border-destructive/40 opacity-90' : 'border-primary/40'}`}
        >
          <CardHeader className="bg-muted/40 border-b border-border pb-6">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    variant={isAnulado ? 'destructive' : 'default'}
                    className="font-mono text-xs uppercase"
                  >
                    {isAnulado ? 'Documento Anulado' : 'Lastro Verificado & Ativo'}
                  </Badge>
                  <Badge
                    variant="outline"
                    className="text-xs border-amber-500/40 text-amber-600 dark:text-amber-400 font-semibold"
                  >
                    Decreto Federal nº 11.413/2023
                  </Badge>
                </div>
                <CardTitle className="text-2xl sm:text-3xl font-black tracking-tight">
                  {lastro.titulo}
                </CardTitle>
                <CardDescription className="text-xs font-mono text-muted-foreground">
                  Código Canônico:{' '}
                  <span className="font-bold text-foreground">{lastro.codigo_lastro}</span>
                </CardDescription>
              </div>

              {/* QR Code Interativo */}
              <div className="shrink-0 p-3 bg-white rounded-xl shadow-md border border-border flex flex-col items-center">
                <QRCodeSVG value={qrUrl} size={100} />
                <span className="text-[9px] font-mono font-bold text-neutral-800 mt-1 uppercase tracking-tighter">
                  QR Verificável
                </span>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-6 space-y-6">
            {/* AVISO LEGAL OBRIGATÓRIO (NOMENCLATURA ESTRITA: LASTRO, NUNCA CCRLR) */}
            <div className="p-4 rounded-xl bg-amber-500/10 border-2 border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs leading-relaxed space-y-1">
              <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-[11px] text-amber-800 dark:text-amber-300">
                <Info className="h-4 w-4 shrink-0" />
                <span>Aviso Legal Regulatório Obrigatório (Decreto Federal nº 11.413/2023)</span>
              </div>
              <p className="text-[11px]">{lastro.aviso_legal}</p>
            </div>

            {/* METADADOS DO EMISSOR E ENTIDADE GESTORA */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-border bg-card space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <Building2 className="h-4 w-4 text-primary" />
                  <span>Empresa Emissora do Lastro</span>
                </div>
                <div className="font-bold text-base text-foreground">
                  {lastro.razao_social_emissor}
                </div>
                <div className="text-xs font-mono text-muted-foreground">
                  CNPJ: {lastro.cnpj_emissor}
                </div>
              </div>

              <div className="p-4 rounded-xl border border-border bg-card space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <FileCheck2 className="h-4 w-4 text-primary" />
                  <span>Entidade Gestora Homologada Destino</span>
                </div>
                <div className="font-bold text-base text-foreground">
                  {lastro.entidade_gestora_alvo}
                </div>
                <div className="text-xs text-muted-foreground">
                  Período de Apuração:{' '}
                  <span className="font-mono font-bold text-foreground">
                    {lastro.periodo_inicio} até {lastro.periodo_fim}
                  </span>
                </div>
              </div>
            </div>

            {/* TOTALIZADORES DE MASSA SEGREGADA (LR OBRIGATÓRIA vs METAIS CONVENCIONAIS) */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Scale className="h-4 w-4 text-primary" />
                Segregação Obrigatória de Massas (Art. 33 PNRS & Dec. 11.413/2023)
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {/* 1. Massa Total de LR Obrigatória */}
                <div className="p-4 rounded-xl bg-amber-500/10 border-2 border-amber-500/40 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-amber-700 dark:text-amber-400 tracking-wider block">
                    Fração Obrigatória Decreto 11.413
                  </span>
                  <div className="text-2xl font-black font-mono text-amber-700 dark:text-amber-300">
                    {Number(lastro.massa_total_lr_obrigatoria_kg || 0).toLocaleString('pt-BR', {
                      minimumFractionDigits: 1,
                      maximumFractionDigits: 2,
                    })}{' '}
                    <span className="text-xs font-normal">kg</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    OLUC, Baterias, Pneus e Lubrificantes comprovados
                  </p>
                </div>

                {/* 2. Massa de Metais Convencionais */}
                <div className="p-4 rounded-xl bg-muted/50 border border-border space-y-1">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
                    Metais Convencionais (Segregados)
                  </span>
                  <div className="text-2xl font-black font-mono text-foreground">
                    {Number(lastro.massa_metais_convencionais_kg || 0).toLocaleString('pt-BR', {
                      minimumFractionDigits: 1,
                      maximumFractionDigits: 2,
                    })}{' '}
                    <span className="text-xs font-normal">kg</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Aço, Alumínio, Cobre e Sucata Ferrosa
                  </p>
                </div>

                {/* 3. Descarbonização e Manifestos */}
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/40 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400 tracking-wider block">
                    Manifestos MTR & Carbono Evitado
                  </span>
                  <div className="text-2xl font-black font-mono text-emerald-700 dark:text-emerald-300">
                    {Number(lastro.co2e_evitado_total_kg || 0).toLocaleString('pt-BR', {
                      minimumFractionDigits: 1,
                      maximumFractionDigits: 2,
                    })}{' '}
                    <span className="text-xs font-normal">kg CO₂e</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    {lastro.total_manifestos_mtr || 0} manifestos MTR-SINIR vinculados
                  </p>
                </div>
              </div>
            </div>

            {/* DETALHAMENTO DAS FRAÇÕES OBRIGATÓRIAS */}
            <div className="p-4 rounded-xl border border-border bg-card space-y-3">
              <span className="text-xs font-semibold text-foreground uppercase tracking-wider block">
                Composição das Frações Sujeitas ao Decreto 11.413/2023
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-2.5 rounded-lg bg-muted/40 border border-border">
                  <span className="text-[10px] text-muted-foreground block">
                    OLUC (Óleo Usado):
                  </span>
                  <strong className="text-sm font-mono text-foreground">
                    {Number(lastro.massa_oluc_kg || 0).toFixed(1)} kg
                  </strong>
                </div>
                <div className="p-2.5 rounded-lg bg-muted/40 border border-border">
                  <span className="text-[10px] text-muted-foreground block">
                    Baterias Chumbo-Ácido:
                  </span>
                  <strong className="text-sm font-mono text-foreground">
                    {Number(lastro.massa_baterias_kg || 0).toFixed(1)} kg
                  </strong>
                </div>
                <div className="p-2.5 rounded-lg bg-muted/40 border border-border">
                  <span className="text-[10px] text-muted-foreground block">
                    Pneus Inservíveis:
                  </span>
                  <strong className="text-sm font-mono text-foreground">
                    {Number(lastro.massa_pneus_kg || 0).toFixed(1)} kg
                  </strong>
                </div>
                <div className="p-2.5 rounded-lg bg-muted/40 border border-border">
                  <span className="text-[10px] text-muted-foreground block">
                    Fluidos & Lubrificantes:
                  </span>
                  <strong className="text-sm font-mono text-foreground">
                    {Number(lastro.massa_oleos_lubrificantes_kg || 0).toFixed(1)} kg
                  </strong>
                </div>
              </div>
            </div>

            {/* PROVA CRIPTOGRÁFICA SHA-256 */}
            <div className="p-4 rounded-xl bg-muted/60 border border-border space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-foreground">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-500" />
                  Hash Criptográfico SHA-256 Canônico
                </span>
                <span className="text-[10px] font-mono text-muted-foreground">
                  Auditável e Imutável
                </span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-background p-3 rounded-lg border border-border font-mono text-xs">
                <span className="text-primary break-all select-all">{lastro.hash_sha256}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copiarHash}
                  className="shrink-0 h-8 gap-1.5 text-xs"
                >
                  {copiado ? (
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                  {copiado ? 'Copiado' : 'Copiar Hash'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
