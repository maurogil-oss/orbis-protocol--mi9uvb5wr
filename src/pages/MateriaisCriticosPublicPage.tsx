import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  ShieldCheck,
  Layers,
  FileCheck2,
  Lock,
  ArrowRight,
  Cpu,
  Sparkles,
  QrCode,
  Scale,
  CheckCircle2,
  Building2,
  FileText,
  AlertTriangle,
  ChevronRight,
  Database,
  Hash,
  Mail,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { QRCodeSVG } from '@/components/QRCodeSVG'
import { AVISO_LEGAL_LASTRO } from '@/services/lastroCcrlrService'
import { calcularHashCanonicoMateriais } from '@/services/materiaisCriticosCanonicoService'

export default function MateriaisCriticosPublicPage() {
  // Simulador rápido de DCP por lote para demonstração pública
  const [loteCodigo, setLoteCodigo] = useState('ORB-CRIT-2026-X9B2')
  const [massaTotal, setMassaTotal] = useState('1450')
  const [teorNdFeB, setTeorNdFeB] = useState('68.5')
  const [teorMetaisNobres, setTeorMetaisNobres] = useState('420')
  const [teorCobre, setTeorCobre] = useState('980')
  const [chaveNfeExemplo, setChaveNfeExemplo] = useState(
    '3526 0133 0001 6800 0109 5500 1000 0048 1210 9876 5432',
  )
  const [hashSha256, setHashSha256] = useState<string>('')
  const [calculandoHash, setCalculandoHash] = useState(false)

  const baseUrl =
    typeof window !== 'undefined' ? window.location.origin : 'https://www.orbis-protocol.com'

  // Recalcula o hash SHA-256 canônico a cada edição no simulador
  useEffect(() => {
    let cancelado = false
    setCalculandoHash(true)

    calcularHashCanonicoMateriais({
      codigoLote: loteCodigo,
      massaTotalKg: massaTotal,
      teorNdFeB,
      teorMetaisNobres,
      teorCobre,
      chaveNfe: chaveNfeExemplo,
    })
      .then((h) => {
        if (!cancelado) {
          setHashSha256(h)
          setCalculandoHash(false)
        }
      })
      .catch((err) => {
        console.error('Erro ao calcular hash canônico de materiais:', err)
        if (!cancelado) {
          setCalculandoHash(false)
        }
      })

    return () => {
      cancelado = true
    }
  }, [loteCodigo, massaTotal, teorNdFeB, teorMetaisNobres, teorCobre, chaveNfeExemplo])

  // URL dinâmica para a visualização pública funcional do DCP de demonstração
  // Atualiza em tempo real com lote, massas, teores, chave fiscal e hash dinâmico
  const demoUrlParams = new URLSearchParams({
    lote: loteCodigo || 'ORB-CRIT-2026-X9B2',
    massa: massaTotal || '1450',
    nd: teorNdFeB || '68.5',
    au: teorMetaisNobres || '420',
    cu: teorCobre || '980',
    nfe: chaveNfeExemplo.replace(/\s+/g, ''),
    hash: hashSha256 || 'calculando...',
    via: 'qr',
  })
  const demoUrl = `${baseUrl}/conferencia-lastro-demo?${demoUrlParams.toString()}`

  return (
    <div className="min-h-screen bg-[#0A0E12] text-[#F4F7FA] selection:bg-[#12B886]/30">
      {/* 1. HERO INSTITUCIONAL */}
      <section className="relative pt-12 pb-16 md:pt-20 md:pb-24 border-b border-[rgba(244,247,250,0.08)] overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(18,184,134,0.15),rgba(255,255,255,0))]" />
        <div className="relative max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#111820] border border-[#12B886]/40 text-[#12B886] text-xs font-semibold tracking-wider uppercase mb-6">
            <Layers className="w-3.5 h-3.5 text-[#12B886]" />
            MINERAÇÃO URBANA & MATERIAIS CRÍTICOS RECUPERADOS
          </div>

          <h1 className="font-heading font-extrabold text-2xl sm:text-4xl text-[#F4F7FA] tracking-tight max-w-4xl mb-6 leading-tight">
            Valor = Prêmio de Origem Urbana + Rastreabilidade Criptográfica + Compliance Fiscal e
            PNRS
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-[#93A3B5] max-w-3xl leading-relaxed mb-8">
            Infraestrutura probatória independente para comprovação pericial de origem estritamente
            urbana, custódia documental anti-receptação e emissão do Passaporte Digital de Produto
            (DCP) por lote segregado com hash SHA-256 e QR Code público.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              asChild
              className="bg-[#12B886] hover:bg-[#0CA678] text-[#0A0E12] font-bold px-6 py-3 rounded-xl shadow-emerald-glow"
            >
              <Link to="/trilhas/mineracao" className="flex items-center gap-2">
                <span>Capacitação na Trilha Mineração Urbana</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="border-[rgba(244,247,250,0.2)] text-[#F4F7FA] hover:bg-[#16202B] hover:border-[#12B886]/50 px-6 py-3 rounded-xl"
            >
              <Link
                to="/protocolos/materiais-criticos-recuperados"
                className="flex items-center gap-2"
              >
                <span>Ver Protocolo Setorial</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>

          {/* Destaque das 3 Frações Principais */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-12 pt-8 border-t border-[rgba(244,247,250,0.08)]">
            <div className="p-4 rounded-xl bg-[#111820] border border-[rgba(244,247,250,0.12)]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono uppercase text-[#D9B36C] font-semibold">
                  Fração 01
                </span>
                <Cpu className="w-4 h-4 text-[#D9B36C]" />
              </div>
              <h4 className="font-bold text-sm text-[#F4F7FA] mb-1">Terras Raras (NdFeB)</h4>
              <p className="text-xs text-[#93A3B5] leading-relaxed">
                Ímãs permanentes de neodímio-ferro-boro recuperados de discos rígidos (HDDs),
                atuadores e motores elétricos.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#111820] border border-[rgba(244,247,250,0.12)]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono uppercase text-[#12B886] font-semibold">
                  Fração 02
                </span>
                <Sparkles className="w-4 h-4 text-[#12B886]" />
              </div>
              <h4 className="font-bold text-sm text-[#F4F7FA] mb-1">
                Metais Nobres (Au / Pd / Ag)
              </h4>
              <p className="text-xs text-[#93A3B5] leading-relaxed">
                Concentrados de ouro, paládio e prata originados do processamento mecânico de placas
                de circuito impresso (PCBs).
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#111820] border border-[rgba(244,247,250,0.12)]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono uppercase text-[#12B886] font-semibold">
                  Fração 03
                </span>
                <Layers className="w-4 h-4 text-[#12B886]" />
              </div>
              <h4 className="font-bold text-sm text-[#F4F7FA] mb-1">
                Cobre Puro de Alta Qualidade
              </h4>
              <p className="text-xs text-[#93A3B5] leading-relaxed">
                Cobre de alta condutividade extraído de fios elétricos, bobinados, chicotes
                automotivos e indutores urbanos.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. OS TRÊS PILARES DO VALOR PROBATÓRIO */}
      <section className="py-14 md:py-20 border-b border-[rgba(244,247,250,0.08)]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="max-w-2xl mb-10">
            <span className="text-xs font-mono font-bold text-[#D9B36C] uppercase tracking-wider block mb-2">
              EQUAÇÃO DE VALOR DE MERCADO
            </span>
            <h2 className="font-heading font-extrabold text-2xl sm:text-4xl text-[#F4F7FA] tracking-tight">
              A Tripla Garantia Exigida por Refinarias e Indústrias Compradoras
            </h2>
            <p className="text-sm sm:text-base text-[#93A3B5] mt-3">
              O comprador internacional e a indústria de base não compram apenas a massa física;
              exigem segurança jurídica contra receptação e compliance socioambiental irrefutável.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-[#111820] border-[rgba(244,247,250,0.12)]">
              <CardHeader className="pb-3">
                <div className="w-10 h-10 rounded-lg bg-[#12B886]/10 border border-[#12B886]/30 flex items-center justify-center text-[#12B886] mb-3">
                  <Building2 className="w-5 h-5" />
                </div>
                <CardTitle className="text-lg font-bold text-[#F4F7FA]">
                  1. Prêmio de Origem Urbana
                </CardTitle>
                <CardDescription className="text-xs text-[#93A3B5]">
                  Diferenciação probatória versus extração primária ou mineração ilegal
                </CardDescription>
              </CardHeader>
              <CardContent className="text-xs text-[#93A3B5] space-y-2 leading-relaxed">
                <p>
                  Atestação pericial de que a matéria-prima decorre exclusivamente do desmonte de
                  equipamentos eletroeletrônicos (REEE) e veículos em fim de vida (VFV), eliminando
                  riscos de invasão de terras públicas, terras indígenas ou garimpo ilegal.
                </p>
                <div className="p-2.5 rounded-lg bg-[#0A0E12] border border-[rgba(244,247,250,0.08)] text-[11px] text-[#12B886]">
                  ✓ Atendimento pleno à Lei 12.305/2010 (PNRS) e diretrizes da ANM/CONAMA.
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#111820] border-[rgba(244,247,250,0.12)]">
              <CardHeader className="pb-3">
                <div className="w-10 h-10 rounded-lg bg-[#D9B36C]/10 border border-[#D9B36C]/30 flex items-center justify-center text-[#D9B36C] mb-3">
                  <Hash className="w-5 h-5" />
                </div>
                <CardTitle className="text-lg font-bold text-[#F4F7FA]">
                  2. Rastreabilidade Criptográfica
                </CardTitle>
                <CardDescription className="text-xs text-[#93A3B5]">
                  Passaporte Digital de Produto (DCP) por lote com prova SHA-256
                </CardDescription>
              </CardHeader>
              <CardContent className="text-xs text-[#93A3B5] space-y-2 leading-relaxed">
                <p>
                  Cada lote processado recebe uma identidade digital canônica contendo balanço de
                  massa, teores estimados das frações, identificador do processador e chaves
                  fiscais.
                </p>
                <div className="p-2.5 rounded-lg bg-[#0A0E12] border border-[rgba(244,247,250,0.08)] text-[11px] text-[#D9B36C]">
                  ✓ Verificação pública instantânea via QR Code sem necessidade de login.
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#111820] border-[rgba(244,247,250,0.12)]">
              <CardHeader className="pb-3">
                <div className="w-10 h-10 rounded-lg bg-[#12B886]/10 border border-[#12B886]/30 flex items-center justify-center text-[#12B886] mb-3">
                  <FileText className="w-5 h-5" />
                </div>
                <CardTitle className="text-lg font-bold text-[#F4F7FA]">
                  3. Compliance Fiscal Anti-Receptação
                </CardTitle>
                <CardDescription className="text-xs text-[#93A3B5]">
                  Vínculo com NF-e 44 dígitos, DANFE e manifesto de transporte
                </CardDescription>
              </CardHeader>
              <CardContent className="text-xs text-[#93A3B5] space-y-2 leading-relaxed">
                <p>
                  Blindagem jurídica contra autuações por receptação qualificada de cabos e sucata:
                  conferência da NF-e de entrada, validação do fornecedor, transportador homologado
                  e segregação física no pátio.
                </p>
                <div className="p-2.5 rounded-lg bg-[#0A0E12] border border-[rgba(244,247,250,0.08)] text-[11px] text-[#12B886]">
                  ✓ Dossiê pronto para envio perante fiscalizações fazendárias e ambientais.
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* 3. SIMULADOR DO DCP POR LOTE COM QR CODE PÚBLICO */}
      <section className="py-14 md:py-20 border-b border-[rgba(244,247,250,0.08)] bg-[#0D1217]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="max-w-2xl mb-8">
            <span className="text-xs font-mono font-bold text-[#12B886] uppercase tracking-wider block mb-2">
              DEMONSTRAÇÃO DO PASSAPORTE DIGITAL DE PRODUTO (DCP)
            </span>
            <h2 className="font-heading font-extrabold text-2xl sm:text-4xl text-[#F4F7FA] tracking-tight">
              Estrutura Canônica de um Lote Segregado
            </h2>
            <p className="text-sm text-[#93A3B5] mt-2">
              Teste a composição de um lote e visualize o espelho público que acompanha a carga
              física até a refinaria ou indústria de destino.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Controles do Lote */}
            <div className="lg:col-span-6 p-6 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.12)] space-y-4 text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-[rgba(244,247,250,0.08)]">
                <span className="font-bold text-[#F4F7FA]">
                  Parâmetros do Lote de Mineração Urbana
                </span>
                <Badge
                  variant="outline"
                  className="border-[#12B886]/40 text-[#12B886] font-mono text-[10px]"
                >
                  Simulação Interativa
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-[11px]">Identificador do Lote</Label>
                  <Input
                    className="font-mono text-xs"
                    value={loteCodigo}
                    onChange={(e) => setLoteCodigo(e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-[11px]">Massa Total do Lote (kg)</Label>
                  <Input
                    type="number"
                    className="font-mono text-xs"
                    value={massaTotal}
                    onChange={(e) => setMassaTotal(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5 p-3 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.08)]">
                <div>
                  <Label className="text-[10px] text-[#D9B36C]">NdFeB (kg)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    className="font-mono text-xs mt-1"
                    value={teorNdFeB}
                    onChange={(e) => setTeorNdFeB(e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-[10px] text-[#12B886]">Au/Pd/Ag (g)</Label>
                  <Input
                    type="number"
                    step="1"
                    className="font-mono text-xs mt-1"
                    value={teorMetaisNobres}
                    onChange={(e) => setTeorMetaisNobres(e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-[10px] text-[#12B886]">Cobre Puro (kg)</Label>
                  <Input
                    type="number"
                    step="1"
                    className="font-mono text-xs mt-1"
                    value={teorCobre}
                    onChange={(e) => setTeorCobre(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label className="text-[11px]">
                  Chave NF-e de Aquisição de Sucata Urbana (44 dígitos)
                </Label>
                <Input
                  className="font-mono text-xs mt-1 text-[#93A3B5]"
                  value={chaveNfeExemplo}
                  onChange={(e) => setChaveNfeExemplo(e.target.value)}
                />
              </div>

              <div className="p-3 rounded-lg bg-muted/40 border border-border text-[11px] text-[#93A3B5] space-y-1">
                <span className="font-semibold text-[#F4F7FA] block">
                  Metodologia Berço-ao-Portão:
                </span>
                <p>
                  O cálculo da pegada de carbono utiliza dados verificáveis (consumo elétrico de
                  fragmentação, transporte por t.km e balanço de massa). Dossiê técnico estruturado
                  pronto para envio a parceiro metodológico a ser contratado e aos compradores
                  industriais.
                </p>
              </div>
            </div>

            {/* Espelho do DCP (Card Público) */}
            <div className="lg:col-span-6 p-6 rounded-2xl bg-[#111820] border-2 border-[#12B886]/40 shadow-xl space-y-4 text-xs relative">
              <div className="flex items-start justify-between gap-3 pb-3 border-b border-[rgba(244,247,250,0.08)]">
                <div>
                  <div className="flex items-center gap-1.5">
                    <Badge className="bg-[#12B886] text-[#0A0E12] font-mono text-[10px] font-bold">
                      DCP • PASSAPORTE DIGITAL DE PRODUTO
                    </Badge>
                    <Badge
                      variant="outline"
                      className="border-amber-500/40 text-amber-400 font-mono text-[9px]"
                    >
                      DEMO
                    </Badge>
                  </div>
                  <h3 className="font-mono font-bold text-base text-[#F4F7FA] mt-1">
                    {loteCodigo}
                  </h3>
                  <span className="text-[11px] text-[#93A3B5]">
                    Lote de Materiais Críticos Recuperados • Mineração Urbana
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-white shrink-0 flex flex-col items-center">
                  <QRCodeSVG value={demoUrl} size={64} />
                  <span className="text-[8px] font-mono font-bold text-neutral-800 mt-0.5 uppercase tracking-tighter">
                    QR Demo
                  </span>
                </div>
              </div>

              {/* Botão de Acesso Direto à Demonstração Pública */}
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#0A0E12] border border-[#12B886]/30">
                <span className="text-[11px] text-[#93A3B5]">
                  Escaneie o QR Code ao lado ou abra a verificação pública da simulação:
                </span>
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="h-7 px-2.5 text-[11px] border-[#12B886]/40 text-[#12B886] hover:bg-[#12B886]/10 shrink-0 ml-2"
                >
                  <Link
                    to={`/conferencia-lastro-demo?${demoUrlParams.toString()}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span>Abrir Espelho</span>
                    <ArrowRight className="w-3 h-3 ml-1" />
                  </Link>
                </Button>
              </div>

              {/* Grid de frações no DCP */}
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2.5 rounded-lg bg-[#0A0E12] border border-[rgba(244,247,250,0.08)]">
                  <span className="text-muted-foreground block text-[10px]">
                    Massa Total do Lote:
                  </span>
                  <span className="text-base font-bold font-mono text-[#F4F7FA]">
                    {massaTotal} kg
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#0A0E12] border border-[rgba(244,247,250,0.08)]">
                  <span className="text-muted-foreground block text-[10px]">Origem Declarada:</span>
                  <span className="text-xs font-semibold text-[#12B886]">
                    100% Urbana (REEE / VFV)
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-[#12B886]/10 border border-[#12B886]/20 space-y-1 text-[11px]">
                <span className="font-bold text-[#12B886] block text-[10px] uppercase tracking-wider">
                  Frações Críticas Segregadas Registradas:
                </span>
                <div className="grid grid-cols-3 gap-2 pt-1 font-mono">
                  <div>
                    <span className="text-muted-foreground text-[10px] block">NdFeB:</span>
                    <strong className="text-foreground">{teorNdFeB} kg</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-[10px] block">Au/Pd/Ag:</span>
                    <strong className="text-[#D9B36C]">{teorMetaisNobres} g</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-[10px] block">Cobre Puro:</span>
                    <strong className="text-foreground">{teorCobre} kg</strong>
                  </div>
                </div>
              </div>

              {/* Hash canônico dinâmico */}
              <div className="p-2.5 rounded-lg bg-[#0A0E12] border border-[rgba(244,247,250,0.08)] font-mono text-[10px] space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground block">Hash SHA-256 Canônico:</span>
                  {calculandoHash && (
                    <span className="text-[9px] text-[#D9B36C] animate-pulse">recalculando...</span>
                  )}
                </div>
                <div
                  data-testid="hash-sha256-display"
                  className="truncate text-[#12B886] select-all font-bold"
                >
                  {hashSha256 || 'Calculando hash...'}
                </div>
              </div>

              {/* Compliance fiscal */}
              <div className="p-2.5 rounded-lg bg-[#0A0E12] border border-[rgba(244,247,250,0.08)] text-[10px] text-[#93A3B5] space-y-0.5">
                <span className="text-[#F4F7FA] font-semibold block">
                  Cadeia de Custódia Fiscal:
                </span>
                <span className="font-mono truncate block text-[9px] text-[#D9B36C]">
                  NF-e: {chaveNfeExemplo}
                </span>
                <span>DANFE arquivado • Transportador licenciado conferido</span>
              </div>

              <div className="pt-2 flex items-center justify-between text-[10px] text-muted-foreground">
                <span>Conformidade PNRS (Lei 12.305/2010)</span>
                <Badge variant="outline" className="border-[#12B886]/40 text-[#12B886] text-[9px]">
                  Pronto para Envio
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. POSICIONAMENTO E RELAÇÃO COM COMPRADORES INDUSTRIAIS */}
      <section className="py-14 md:py-20 border-b border-[rgba(244,247,250,0.08)]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="max-w-3xl mb-10">
            <span className="text-xs font-mono font-bold text-[#D9B36C] uppercase tracking-wider block mb-2">
              PADRÃO DE RELACIONAMENTO B2B
            </span>
            <h2 className="font-heading font-extrabold text-2xl sm:text-4xl text-[#F4F7FA] tracking-tight">
              Acesso a Refinarias e Indústrias Compradoras de Materiais Críticos
            </h2>
            <p className="text-sm sm:text-base text-[#93A3B5] mt-3 leading-relaxed">
              Compradores globais e refinarias especializadas exigem dossiês técnicos prontos para
              envio, com parâmetros de integridade documental antes de autorizar o descarregamento
              das cargas de materiais críticos.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.12)] space-y-3 text-xs leading-relaxed">
              <h3 className="font-heading font-bold text-base text-[#F4F7FA] flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#12B886]" />
                Cálculo da Pegada de Carbono com Dados Verificáveis
              </h3>
              <p className="text-[#93A3B5]">
                A plataforma consolida o consumo elétrico de processamento, quilometragem de
                transporte da sucata e rendimento mássico em um memorial de cálculo transparente
                berço-ao-portão.
              </p>
              <p className="text-[#93A3B5]">
                A modelagem é estruturada segundo a ABNT ISO 14067 com parâmetros prontos para
                submissão a parceiro metodológico a ser contratado, viabilizando o reporte de Scope
                3 com integridade.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.12)] space-y-3 text-xs leading-relaxed">
              <h3 className="font-heading font-bold text-base text-[#F4F7FA] flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-[#D9B36C]" />
                Dossiê Técnico Completo e Pronto para Envio
              </h3>
              <p className="text-[#93A3B5]">
                Exportação de relatório técnico em PDF chancelado e payload JSON estruturado,
                acompanhado do selo QR Code de validação pública instantânea para aposição em
                tambores, bombonas e pallets.
              </p>
              <p className="text-[#93A3B5]">
                Atesta formalmente a inexistência de mistura com minério de extração primária e
                assegura que a transação cumpriu todos os requisitos tributários e fiscais da SEFAZ.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. AVISO LEGAL PERMANENTE VINCULANTE */}
      <section className="py-10 bg-[#070A0D]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 leading-relaxed flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <strong className="block text-amber-300 font-bold uppercase text-[11px]">
                Aviso Legal Vinculante — Infraestrutura Probatória Independente
              </strong>
              <p className="text-amber-200/90 text-xs">{AVISO_LEGAL_LASTRO}</p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. CTA FINAL COM BOTÃO "FALAR COM O TIME" EM DESTAQUE DOURADO E ESPAÇAMENTO GENEROSO */}
      <section className="py-16 md:py-24 text-center border-t border-[rgba(244,247,250,0.08)] bg-gradient-to-b from-[#0A0E12] via-[#0D1217] to-[#0A0E12]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#111820] border border-[#D9B36C]/40 text-[#D9B36C] text-xs font-semibold tracking-wider uppercase">
            <Sparkles className="w-3.5 h-3.5 text-[#D9B36C]" />
            ENGENHARIA & COMPLIANCE DE MATERIAIS CRÍTICOS
          </div>

          <h2 className="font-heading font-extrabold text-2xl sm:text-4xl text-[#F4F7FA] tracking-tight">
            Inicie a Estruturação do Seu Lote de Mineração Urbana
          </h2>
          <p className="text-sm sm:text-base text-[#93A3B5] leading-relaxed max-w-2xl mx-auto">
            Acesse a capacitação técnica dedicada, execute o diagnóstico por CNPJ ou converse
            diretamente com nosso time técnico de rastreabilidade e compliance.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 pt-4">
            {/* Botão Falar com o time (Dourado #D9B36C, gap-4 sm:gap-6, espaçamento generoso) */}
            <a
              href="mailto:contato@orbis-protocol.com?subject=Interesse%20em%20Materiais%20Cr%C3%ADticos%20Recuperados"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl font-bold bg-[#D9B36C] text-[#0A0E12] hover:bg-[#C9A25B] hover:scale-[1.02] transition-all shadow-md text-sm"
            >
              <Mail className="w-4 h-4 text-[#0A0E12]" />
              <span>Falar com o time</span>
            </a>

            <Button
              asChild
              className="bg-[#12B886] hover:bg-[#0CA678] text-[#0A0E12] font-bold px-6 py-3.5 rounded-xl shadow-emerald-glow text-sm"
            >
              <Link to="/trilhas/mineracao" className="flex items-center gap-2">
                <span>Capacitação Trilha Mineração Urbana</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              className="border-[rgba(244,247,250,0.25)] text-[#F4F7FA] hover:bg-[#16202B] hover:border-[#12B886]/50 px-6 py-3.5 rounded-xl text-sm"
            >
              <Link to="/diagnostico">Diagnóstico por CNPJ</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
