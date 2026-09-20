import { useState, useEffect } from 'react'
import {
  FileCheck2,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Scale,
  Download,
  PlusCircle,
  Eye,
  RefreshCw,
  ExternalLink,
  Ban,
  Building2,
  Calendar,
  Layers,
  Sparkles,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { toast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/AuthContext'
import pb from '@/lib/pocketbase/client'
import {
  listarLastrosEmitidos,
  emitirLastroCircularidade,
  AVISO_LEGAL_LASTRO,
  type LastroCircularidadeRecord,
} from '@/services/lastroCcrlrService'
import { anularDocumentoDpp } from '@/services/auditService'

export function GerenciadorLastrosTab() {
  const { user } = useAuth()
  const [lastros, setLastros] = useState<LastroCircularidadeRecord[]>([])
  const [carregando, setCarregando] = useState(true)
  const [modalNovoAberto, setModalNovoAberto] = useState(false)
  const [modalAnularAberto, setModalAnularAberto] = useState(false)
  const [lastroSelecionado, setLastroSelecionado] = useState<LastroCircularidadeRecord | null>(null)
  const [motivoAnulacao, setMotivoAnulacao] = useState('')
  const [anulando, setAnulando] = useState(false)
  const [emitindo, setEmitindo] = useState(false)

  // Formulário de novo Lastro
  const [entidadeGestora, setEntidadeGestora] = useState(
    'Entidade Gestora Nacional de Logística Reversa',
  )
  const [cnpjEntidadeGestora, setCnpjEntidadeGestora] = useState('12.345.678/0001-90')
  const [periodoInicio, setPeriodoInicio] = useState('01/01/2026')
  const [periodoFim, setPeriodoFim] = useState('31/12/2026')
  const [massaOluc, setMassaOluc] = useState('480.5')
  const [massaBaterias, setMassaBaterias] = useState('1250.0')
  const [massaPneus, setMassaPneus] = useState('2100.0')
  const [massaFluidos, setMassaFluidos] = useState('320.0')
  const [massaMetaisConvencionais, setMassaMetaisConvencionais] = useState('18450.0')
  const [totalManifestos, setTotalManifestos] = useState('14')
  const [co2eEvitado, setCo2eEvitado] = useState('8640.0')

  const carregar = async () => {
    setCarregando(true)
    try {
      const lista = await listarLastrosEmitidos()
      setLastros(lista)
    } catch {
      toast({
        title: 'Erro ao carregar lastros',
        description: 'Não foi possível carregar a lista de lastros de circularidade.',
        variant: 'destructive',
      })
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregar()
  }, [])

  const handleEmitirLastro = async (e: React.FormEvent) => {
    e.preventDefault()
    setEmitindo(true)
    try {
      const cnpjEmissor = user?.cnpj || '33.000.168/0001-09'
      const razaoSocialEmissor =
        user?.nome_empresa || user?.name || 'Orbis Soluções Circulares S.A.'

      const novo = await emitirLastroCircularidade(
        {
          cnpj_emissor: cnpjEmissor,
          razao_social_emissor: razaoSocialEmissor,
          entidade_gestora_alvo: entidadeGestora,
          cnpj_entidade_gestora: cnpjEntidadeGestora,
          periodo_inicio: periodoInicio,
          periodo_fim: periodoFim,
          ano_base: 2026,
          massa_oluc_kg: parseFloat(massaOluc) || 0,
          massa_baterias_kg: parseFloat(massaBaterias) || 0,
          massa_pneus_kg: parseFloat(massaPneus) || 0,
          massa_oleos_lubrificantes_kg: parseFloat(massaFluidos) || 0,
          massa_embalagens_kg: 0,
          massa_metais_convencionais_kg: parseFloat(massaMetaisConvencionais) || 0,
          total_manifestos_mtr: parseInt(totalManifestos, 10) || 0,
          co2e_evitado_total_kg: parseFloat(co2eEvitado) || 0,
        },
        user?.id,
      )

      toast({
        title: 'Lastro de Circularidade Emitido com Sucesso!',
        description: `Código gerado: ${novo.codigo_lastro} com hash SHA-256 e QR verificável.`,
      })

      setModalNovoAberto(false)
      carregar()
    } catch (err: any) {
      toast({
        title: 'Erro na emissão do Lastro',
        description: err?.message || 'Falha ao gravar registro no livro-razão imutável.',
        variant: 'destructive',
      })
    } finally {
      setEmitindo(false)
    }
  }

  const handleConfirmarAnulacao = async () => {
    if (!lastroSelecionado) return
    if (!motivoAnulacao || motivoAnulacao.length < 10) {
      toast({
        title: 'Justificativa insuficiente',
        description:
          'A justificativa de anulação deve possuir no mínimo 10 caracteres para fins periciais.',
        variant: 'destructive',
      })
      return
    }

    setAnulando(true)
    try {
      await anularDocumentoDpp({
        tipo: 'lastro' as any,
        id: lastroSelecionado.id,
        motivo: motivoAnulacao,
      })

      toast({
        title: 'Documento Anulado Formalmente',
        description: `O Lastro ${lastroSelecionado.codigo_lastro} foi anulado e registrado no audit_log.`,
      })

      setModalAnularAberto(false)
      setMotivoAnulacao('')
      setLastroSelecionado(null)
      carregar()
    } catch (err: any) {
      toast({
        title: 'Erro na anulação',
        description: err?.message || 'Não foi possível concluir a anulação formal.',
        variant: 'destructive',
      })
    } finally {
      setAnulando(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Topo do Módulo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-card border border-border shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="border-amber-500/40 text-amber-600 dark:text-amber-400 text-xs font-semibold"
            >
              Módulo 2 • Decreto Federal nº 11.413/2023
            </Badge>
            <Badge variant="secondary" className="text-xs">
              Lastro Criptográfico SHA-256
            </Badge>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
            Certificação de Lastro de Circularidade
          </h2>
          <p className="text-xs text-muted-foreground max-w-2xl leading-relaxed">
            Consolidação da massa confirmada de frações de Logística Reversa obrigatória (OLUC,
            baterias, pneus, óleos) por período e Entidade Gestora-alvo, estritamente segregada de
            metais convencionais.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={carregar}
            disabled={carregando}
            className="gap-1.5 text-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${carregando ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button
            size="sm"
            onClick={() => setModalNovoAberto(true)}
            className="gap-1.5 text-xs bg-amber-600 hover:bg-amber-700 text-white"
          >
            <PlusCircle className="h-4 w-4" />
            Emitir Novo Lastro
          </Button>
        </div>
      </div>

      {/* AVISO LEGAL PERMANENTE */}
      <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-900 dark:text-amber-200 leading-relaxed flex items-start gap-2.5">
        <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div>
          <strong className="block text-amber-800 dark:text-amber-300 font-bold uppercase text-[10px] mb-0.5">
            Aviso Legal de Nomenclatura Estrita (Decreto 11.413/2023)
          </strong>
          <span>{AVISO_LEGAL_LASTRO}</span>
        </div>
      </div>

      {/* Lista de Lastros Emitidos */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold">
          <span>DOCUMENTOS DE LASTRO EMITIDOS ({lastros.length})</span>
          <span>IMUTABILIDADE & AUDITORIA</span>
        </div>

        {lastros.length === 0 && !carregando && (
          <Card className="p-8 text-center border-dashed">
            <FileCheck2 className="h-10 w-10 text-muted-foreground mx-auto mb-2 opacity-50" />
            <h3 className="font-semibold text-sm">Nenhum Lastro Emitido Ainda</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
              Clique em "Emitir Novo Lastro" para consolidar as frações de LR obrigatória apuradas
              com base nos manifestos MTR-SINIR.
            </p>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {lastros.map((l) => {
            const anulado = l.status === 'anulado'
            return (
              <Card
                key={l.id}
                className={`border-2 transition-all ${anulado ? 'border-destructive/40 bg-destructive/5' : 'border-border hover:border-primary/40'}`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Badge
                          variant={anulado ? 'destructive' : 'default'}
                          className="text-[10px] uppercase font-mono"
                        >
                          {anulado ? 'Anulado Formalmente' : 'Emitido & Válido'}
                        </Badge>
                        <span className="text-xs font-mono font-bold text-foreground">
                          {l.codigo_lastro}
                        </span>
                      </div>
                      <CardTitle className="text-base font-bold line-clamp-1">{l.titulo}</CardTitle>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                      className="h-8 px-2 text-xs gap-1 text-primary hover:text-primary"
                    >
                      <a
                        href={`/conferencia-lastro/${l.codigo_lastro}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Público
                      </a>
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4 text-xs">
                  <div className="grid grid-cols-2 gap-2 p-2.5 rounded-lg bg-muted/40 border border-border">
                    <div>
                      <span className="text-[10px] text-muted-foreground block">
                        Entidade Gestora:
                      </span>
                      <strong className="text-foreground line-clamp-1">
                        {l.entidade_gestora_alvo}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Período:</span>
                      <strong className="text-foreground">
                        {l.periodo_inicio} a {l.periodo_fim}
                      </strong>
                    </div>
                  </div>

                  {/* Massas Segregadas */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30">
                      <span className="text-[10px] text-amber-700 dark:text-amber-400 font-bold block">
                        LR Dec. 11.413 (Obrigatória):
                      </span>
                      <div className="text-base font-black font-mono text-amber-700 dark:text-amber-300">
                        {Number(l.massa_total_lr_obrigatoria_kg || 0).toLocaleString('pt-BR', {
                          minimumFractionDigits: 1,
                        })}{' '}
                        kg
                      </div>
                    </div>
                    <div className="p-2 rounded-lg bg-muted/60 border border-border">
                      <span className="text-[10px] text-muted-foreground font-semibold block">
                        Metais Convencionais:
                      </span>
                      <div className="text-base font-black font-mono text-foreground">
                        {Number(l.massa_metais_convencionais_kg || 0).toLocaleString('pt-BR', {
                          minimumFractionDigits: 1,
                        })}{' '}
                        kg
                      </div>
                    </div>
                  </div>

                  {/* Prova Criptográfica SHA-256 */}
                  <div className="p-2 rounded-lg bg-muted/40 border border-border font-mono text-[10px] space-y-0.5">
                    <span className="text-muted-foreground block">Hash SHA-256:</span>
                    <div className="truncate text-primary select-all font-bold">
                      {l.hash_sha256}
                    </div>
                  </div>

                  {anulado && l.motivo_anulacao && (
                    <div className="p-2 rounded bg-destructive/10 border border-destructive/20 text-destructive text-[11px]">
                      <strong>Motivo da anulação:</strong> {l.motivo_anulacao}
                    </div>
                  )}

                  {/* Ações Administrativas */}
                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <span className="text-[10px] text-muted-foreground">
                      Emissão: {new Date(l.created).toLocaleDateString('pt-BR')}
                    </span>

                    {!anulado && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setLastroSelecionado(l)
                          setModalAnularAberto(true)
                        }}
                        className="h-7 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/30 gap-1"
                      >
                        <Ban className="h-3 w-3" />
                        Anular Lastro
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* MODAL: EMISSÃO DE NOVO LASTRO */}
      <Dialog open={modalNovoAberto} onOpenChange={setModalNovoAberto}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <FileCheck2 className="h-5 w-5 text-amber-600" />
              Emitir Certificação de Lastro de Circularidade
            </DialogTitle>
            <DialogDescription className="text-xs">
              Conforme o Decreto Federal nº 11.413/2023. O documento gerado possui hash SHA-256
              determinístico e QR verificável.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleEmitirLastro} className="space-y-4 text-xs pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Entidade Gestora-Alvo</Label>
                <Input
                  value={entidadeGestora}
                  onChange={(e) => setEntidadeGestora(e.target.value)}
                  placeholder="Ex: Entidade Gestora de Reciclagem"
                  required
                />
              </div>
              <div>
                <Label className="text-xs">CNPJ da Entidade Gestora</Label>
                <Input
                  value={cnpjEntidadeGestora}
                  onChange={(e) => setCnpjEntidadeGestora(e.target.value)}
                  placeholder="00.000.000/0001-00"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Início do Período de Apuração</Label>
                <Input
                  value={periodoInicio}
                  onChange={(e) => setPeriodoInicio(e.target.value)}
                  placeholder="DD/MM/AAAA"
                  required
                />
              </div>
              <div>
                <Label className="text-xs">Fim do Período de Apuração</Label>
                <Input
                  value={periodoFim}
                  onChange={(e) => setPeriodoFim(e.target.value)}
                  placeholder="DD/MM/AAAA"
                  required
                />
              </div>
            </div>

            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 space-y-3">
              <span className="font-bold text-amber-800 dark:text-amber-300 block text-xs">
                Frações Sujeitas à LR Obrigatória (Decreto 11.413/2023)
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div>
                  <Label className="text-[11px]">OLUC (kg)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={massaOluc}
                    onChange={(e) => setMassaOluc(e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-[11px]">Baterias (kg)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={massaBaterias}
                    onChange={(e) => setMassaBaterias(e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-[11px]">Pneus (kg)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={massaPneus}
                    onChange={(e) => setMassaPneus(e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-[11px]">Fluidos (kg)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={massaFluidos}
                    onChange={(e) => setMassaFluidos(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">Metais Convencionais (kg)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={massaMetaisConvencionais}
                  onChange={(e) => setMassaMetaisConvencionais(e.target.value)}
                  placeholder="Aço, alumínio, sucata"
                />
              </div>
              <div>
                <Label className="text-xs">Manifestos MTR-SINIR (Total)</Label>
                <Input
                  type="number"
                  value={totalManifestos}
                  onChange={(e) => setTotalManifestos(e.target.value)}
                  placeholder="Qtd. manifestos"
                />
              </div>
              <div>
                <Label className="text-xs">CO₂e Evitado Total (kg)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={co2eEvitado}
                  onChange={(e) => setCo2eEvitado(e.target.value)}
                />
              </div>
            </div>

            <div className="p-3 rounded-lg bg-muted/60 border border-border text-[11px] text-muted-foreground leading-relaxed">
              <strong>Aviso Legal Vinculante:</strong> Este documento emitido constitui estritamente
              Certificação de LASTRO de Circularidade e destinação pericial. A emissão do CCRLR
              oficial é ato privativo da Entidade Gestora homologada perante o órgão ambiental.
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setModalNovoAberto(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={emitindo}
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                {emitindo ? 'Gerando Criptografia SHA-256...' : 'Confirmar e Emitir Lastro'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL: ANULAÇÃO FORMAL DE LASTRO COM AUDIT_LOG */}
      <Dialog open={modalAnularAberto} onOpenChange={setModalAnularAberto}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive text-base">
              <Ban className="h-5 w-5" />
              Anulação Formal de Lastro de Circularidade
            </DialogTitle>
            <DialogDescription className="text-xs">
              Procedimento administrativo pericial com registro append-only imutável no audit_log.
            </DialogDescription>
          </DialogHeader>

          {lastroSelecionado && (
            <div className="space-y-3 text-xs pt-1">
              <div className="p-2.5 rounded-lg bg-muted/60 border border-border space-y-1">
                <span className="text-[10px] text-muted-foreground block">
                  Documento Selecionado:
                </span>
                <strong className="text-foreground block">{lastroSelecionado.codigo_lastro}</strong>
                <span className="text-muted-foreground text-[11px] block">
                  {lastroSelecionado.titulo}
                </span>
              </div>

              <div>
                <Label className="text-xs font-semibold">
                  Justificativa da Anulação (Obrigatória • min. 10 caracteres)
                </Label>
                <textarea
                  className="w-full mt-1.5 p-2 rounded-lg bg-background border border-border text-xs focus:outline-none focus:ring-1 focus:ring-destructive min-h-[90px]"
                  placeholder="Descreva o motivo formal da anulação pericial..."
                  value={motivoAnulacao}
                  onChange={(e) => setMotivoAnulacao(e.target.value)}
                />
              </div>

              <div className="p-2 rounded bg-destructive/10 text-destructive text-[11px]">
                Atenção: Uma vez anulado, a página pública exibirá o aviso formal de anulação e o
                registro será congelado de modo permanente.
              </div>

              <DialogFooter className="pt-2">
                <Button variant="outline" size="sm" onClick={() => setModalAnularAberto(false)}>
                  Voltar
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleConfirmarAnulacao}
                  disabled={anulando || motivoAnulacao.length < 10}
                >
                  {anulando ? 'Processando Anulação...' : 'Confirmar Anulação'}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
