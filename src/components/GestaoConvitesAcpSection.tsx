/**
 * GestaoConvitesAcpSection.tsx
 * Subcomponente de Gestão de Convites e Empresas Associadas Vinculadas para o Painel ACP.
 *
 * Funcionalidades:
 * 1. Formulário de geração de convite (Nome da empresa, e-mail, CNPJ opcional, validade em dias)
 * 2. Cópia rápida do link único gerado (/convite/{token}) com feedback visual
 * 3. Aviso transparente sobre infraestrutura de e-mail (copiável; envio SMTP registrado como pendência do ambiente)
 * 4. Tabela de convites gerados com badges de status (pendente / usado / expirado / cancelado)
 * 5. Tabela/Cards de empresas associadas participantes já cadastradas (papel cliente_acp, prefixo ORB-ACP)
 */

import React, { useState, useEffect } from 'react'
import {
  criarConviteAcp,
  listarConvitesAcp,
  listarEmpresasParticipantesAcp,
  ConviteAcpItem,
  EmpresaParticipanteAcp,
} from '@/services/acpConvitesService'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  UserPlus,
  Copy,
  Check,
  Building2,
  Mail,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Users,
  ShieldCheck,
  ExternalLink,
  Info,
  Calendar,
} from 'lucide-react'

export function GestaoConvitesAcpSection() {
  // Estado do formulário de criação
  const [empresaNome, setEmpresaNome] = useState('')
  const [email, setEmail] = useState('')
  const [cnpj, setCnpj] = useState('')
  const [diasValidade, setDiasValidade] = useState<number>(7)
  const [observacoes, setObservacoes] = useState('')

  // Estado operacional
  const [gerando, setGerando] = useState(false)
  const [ultimoLinkGerado, setUltimoLinkGerado] = useState<string | null>(null)
  const [linkCopiado, setLinkCopiado] = useState(false)
  const [erroCriacao, setErroCriacao] = useState<string | null>(null)
  const [sucessoCriacao, setSucessoCriacao] = useState<string | null>(null)

  // Listagens
  const [convites, setConvites] = useState<ConviteAcpItem[]>([])
  const [participantes, setParticipantes] = useState<EmpresaParticipanteAcp[]>([])
  const [carregandoDados, setCarregandoDados] = useState(false)
  const [tokenCopiadoId, setTokenCopiadoId] = useState<string | null>(null)

  // Aba ativa interna
  const [abaAtiva, setAbaAtiva] = useState<'gerar' | 'convites' | 'participantes'>('gerar')

  const carregarTudo = async () => {
    setCarregandoDados(true)
    try {
      const [listaConvites, listaPart] = await Promise.all([
        listarConvitesAcp(),
        listarEmpresasParticipantesAcp(),
      ])
      setConvites(listaConvites)
      setParticipantes(listaPart)
    } catch (err) {
      console.log('[GestaoConvitesAcpSection] Erro ao carregar dados:', err)
    } finally {
      setCarregandoDados(false)
    }
  }

  useEffect(() => {
    carregarTudo()
  }, [])

  const handleCriarConvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setErroCriacao(null)
    setSucessoCriacao(null)

    if (!empresaNome.trim()) {
      setErroCriacao('Informe a Razão Social ou Nome da Empresa associada.')
      return
    }

    if (!email.trim() || !email.includes('@')) {
      setErroCriacao('Informe um e-mail válido para envio do link.')
      return
    }

    setGerando(true)
    try {
      const resp = await criarConviteAcp({
        empresa_nome: empresaNome,
        email,
        cnpj,
        dias_validade: diasValidade,
        observacoes,
      })

      setUltimoLinkGerado(resp.linkConvite)
      setSucessoCriacao(`Convite gerado com sucesso para "${empresaNome}". Link pronto para cópia.`)
      // Limpa campos
      setEmpresaNome('')
      setEmail('')
      setCnpj('')
      setObservacoes('')
      // Atualiza listagem em background
      carregarTudo()
    } catch (err: any) {
      setErroCriacao(err?.message || 'Falha ao gerar convite ACP.')
    } finally {
      setGerando(false)
    }
  }

  const copiarParaTransferencia = async (texto: string, id?: string) => {
    try {
      await navigator.clipboard.writeText(texto)
      if (id) {
        setTokenCopiadoId(id)
        setTimeout(() => setTokenCopiadoId(null), 2000)
      } else {
        setLinkCopiado(true)
        setTimeout(() => setLinkCopiado(false), 2000)
      }
    } catch (_) {
      // Fallback
      const ta = document.createElement('textarea')
      ta.value = texto
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      if (id) {
        setTokenCopiadoId(id)
        setTimeout(() => setTokenCopiadoId(null), 2000)
      } else {
        setLinkCopiado(true)
        setTimeout(() => setLinkCopiado(false), 2000)
      }
    }
  }

  const renderBadgeStatus = (status: ConviteAcpItem['status']) => {
    switch (status) {
      case 'pendente':
        return (
          <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400 border-amber-300 dark:border-amber-800 flex items-center gap-1 text-[11px]">
            <Clock className="w-3 h-3" />
            Pendente
          </Badge>
        )
      case 'usado':
        return (
          <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800 flex items-center gap-1 text-[11px]">
            <CheckCircle2 className="w-3 h-3" />
            Usado / Cadastrado
          </Badge>
        )
      case 'expirado':
        return (
          <Badge className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700 flex items-center gap-1 text-[11px]">
            <Clock className="w-3 h-3 text-slate-400" />
            Expirado
          </Badge>
        )
      case 'cancelado':
        return (
          <Badge className="bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-400 border-red-300 dark:border-red-800 flex items-center gap-1 text-[11px]">
            <XCircle className="w-3 h-3" />
            Cancelado
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho da Seção */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="font-heading font-bold text-lg text-slate-900 dark:text-[#F8FAFC]">
              Convite & Adesão de Empresas Associadas (Peça 4c)
            </h2>
          </div>
          <p className="text-xs text-slate-600 dark:text-[#94A3B8] mt-0.5">
            Geração de links de convite criptográficos, controle de expiração e vinculação ao papel{' '}
            <code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[11px] text-blue-600 dark:text-blue-400">
              cliente_acp
            </code>
            .
          </p>
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={carregarTudo}
            disabled={carregandoDados}
            className="text-xs h-8"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${carregandoDados ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Navegação por Abas Internas */}
      <div className="flex flex-wrap gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
        <button
          onClick={() => setAbaAtiva('gerar')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
            abaAtiva === 'gerar'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-[#94A3B8] hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <UserPlus className="w-3.5 h-3.5" />
          Gerar Novo Convite
        </button>
        <button
          onClick={() => setAbaAtiva('convites')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
            abaAtiva === 'convites'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-[#94A3B8] hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          Convites Emitidos
          <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 dark:bg-slate-700/60 font-mono">
            {convites.length}
          </span>
        </button>
        <button
          onClick={() => setAbaAtiva('participantes')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
            abaAtiva === 'participantes'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-[#94A3B8] hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          Empresas Participantes
          <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 dark:bg-slate-700/60 font-mono">
            {participantes.length}
          </span>
        </button>
      </div>

      {/* ABA 1: GERAR NOVO CONVITE */}
      {abaAtiva === 'gerar' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0E1A2E] shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold text-slate-900 dark:text-[#F8FAFC]">
                Emissão de Convite para Empresa Associada
              </CardTitle>
              <CardDescription className="text-xs text-slate-600 dark:text-[#94A3B8]">
                O convite gerado é único, de uso único e expira automaticamente após o período
                definido. A empresa receberá o papel exclusivo{' '}
                <strong className="text-slate-900 dark:text-white">cliente_acp</strong>.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleCriarConvite} className="space-y-4">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="empresaNome"
                    className="text-xs font-semibold flex items-center gap-1"
                  >
                    <Building2 className="w-3.5 h-3.5 text-blue-600" />
                    Razão Social / Nome da Empresa Associada *
                  </Label>
                  <Input
                    id="empresaNome"
                    type="text"
                    placeholder="Ex: Indústria Metalúrgica Paraná Ltda"
                    value={empresaNome}
                    onChange={(e) => setEmpresaNome(e.target.value)}
                    required
                    className="text-xs sm:text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="conviteEmail"
                      className="text-xs font-semibold flex items-center gap-1"
                    >
                      <Mail className="w-3.5 h-3.5 text-blue-600" />
                      E-mail Corporativo de Contato *
                    </Label>
                    <Input
                      id="conviteEmail"
                      type="email"
                      placeholder="diretoria@empresa.com.br"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="text-xs sm:text-sm font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label
                      htmlFor="conviteCnpj"
                      className="text-xs font-semibold flex items-center gap-1"
                    >
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      CNPJ da Associada (opcional)
                    </Label>
                    <Input
                      id="conviteCnpj"
                      type="text"
                      placeholder="00.000.000/0001-00"
                      value={cnpj}
                      onChange={(e) => setCnpj(e.target.value)}
                      className="text-xs sm:text-sm font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="diasValidade"
                      className="text-xs font-semibold flex items-center gap-1"
                    >
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      Validade do Convite (dias)
                    </Label>
                    <select
                      id="diasValidade"
                      value={diasValidade}
                      onChange={(e) => setDiasValidade(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs sm:text-sm text-slate-900 dark:text-white"
                    >
                      <option value={3}>3 dias corridos</option>
                      <option value={7}>7 dias corridos (padrão sugerido)</option>
                      <option value={15}>15 dias corridos</option>
                      <option value={30}>30 dias corridos</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="conviteObs" className="text-xs font-semibold">
                      Observações / Câmara Setorial
                    </Label>
                    <Input
                      id="conviteObs"
                      type="text"
                      placeholder="Ex: Câmara de Sustentabilidade / Grupo Automotivo"
                      value={observacoes}
                      onChange={(e) => setObservacoes(e.target.value)}
                      className="text-xs sm:text-sm"
                    />
                  </div>
                </div>

                {erroCriacao && (
                  <Alert variant="destructive" className="py-2 text-xs">
                    <AlertTriangle className="w-4 h-4" />
                    <AlertTitle className="text-xs font-semibold">Aviso</AlertTitle>
                    <AlertDescription className="text-xs">{erroCriacao}</AlertDescription>
                  </Alert>
                )}

                {sucessoCriacao && (
                  <Alert className="py-2 text-xs bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <AlertTitle className="text-xs font-semibold">Sucesso</AlertTitle>
                    <AlertDescription className="text-xs">{sucessoCriacao}</AlertDescription>
                  </Alert>
                )}

                <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                  <Button
                    type="submit"
                    disabled={gerando}
                    className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs h-9 px-5"
                  >
                    {gerando ? 'Gerando Token...' : 'Gerar Link de Convite Único'}
                  </Button>
                </div>
              </form>

              {/* Bloco de Exibição do Link Gerado */}
              {ultimoLinkGerado && (
                <div className="mt-5 p-4 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-blue-600" />
                      Link de Cadastro da Associada Gerado:
                    </span>
                    <Badge variant="outline" className="text-[10px] border-blue-300 text-blue-700">
                      Uso Único
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2">
                    <Input
                      readOnly
                      value={ultimoLinkGerado}
                      className="text-xs font-mono bg-white dark:bg-slate-900 select-all"
                    />
                    <Button
                      type="button"
                      onClick={() => copiarParaTransferencia(ultimoLinkGerado)}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-9 px-3 shrink-0"
                    >
                      {linkCopiado ? (
                        <>
                          <Check className="w-3.5 h-3.5 mr-1" />
                          Copiado!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 mr-1" />
                          Copiar Link
                        </>
                      )}
                    </Button>
                  </div>

                  <p className="text-[11px] text-blue-800 dark:text-blue-300/80 leading-relaxed">
                    Envie este link diretamente à empresa associada por e-mail, WhatsApp ou ofício.
                    Ao acessar, os dados institucionais serão carregados automaticamente e ela
                    definirá sua senha.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Coluna Lateral Informativa & Registro de Pendência de Envio Automático */}
          <div className="space-y-4">
            <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0E1A2E] shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold text-slate-900 dark:text-[#F8FAFC] flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-blue-600" />
                  Regras de Vínculo & Segurança
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs text-slate-600 dark:text-[#94A3B8] leading-relaxed">
                <p>
                  • <strong>Papel Automático:</strong> O usuário criado recebe papel{' '}
                  <code className="text-blue-600 dark:text-blue-400 font-mono">cliente_acp</code>{' '}
                  com código único prefixado por{' '}
                  <code className="text-emerald-600 dark:text-emerald-400 font-mono">ORB-ACP-</code>
                  .
                </p>
                <p>
                  • <strong>Impossível Adivinhar:</strong> O token é composto por 32 caracteres
                  criptográficos + hash SHA-256 do lote temporal.
                </p>
                <p>
                  • <strong>Privacidade:</strong> A administração da ACP não possui acesso à senha
                  criada pela empresa; apenas ao e-mail, razão social e status do vínculo.
                </p>
              </CardContent>
            </Card>

            <Alert className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/60 text-amber-900 dark:text-amber-300">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <AlertTitle className="text-xs font-semibold">
                Envio Transacional de E-mail
              </AlertTitle>
              <AlertDescription className="text-xs space-y-1">
                <p>
                  O link gerado deve ser <strong>copiado e enviado manualmente</strong> neste
                  momento.
                </p>
                <p className="text-[11px] text-amber-800 dark:text-amber-400">
                  O servidor SMTP de produção depende das credenciais de host da ACP/Orbis
                  configuradas no ambiente. Registrado como melhoria para disparo automático de
                  e-mail na próxima fase.
                </p>
              </AlertDescription>
            </Alert>
          </div>
        </div>
      )}

      {/* ABA 2: LISTAGEM DE CONVITES EMITIDOS */}
      {abaAtiva === 'convites' && (
        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0E1A2E] shadow-sm">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold text-slate-900 dark:text-[#F8FAFC]">
                Histórico de Convites Emitidos
              </CardTitle>
              <CardDescription className="text-xs text-slate-600 dark:text-[#94A3B8]">
                Acompanhamento em tempo real de tokens pendentes, utilizados ou expirados.
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-xs">
              Total: {convites.length}
            </Badge>
          </CardHeader>

          <CardContent>
            {convites.length === 0 ? (
              <div className="py-10 text-center text-slate-500 text-xs">
                Nenhum convite emitido até o momento. Utilize a aba &quot;Gerar Novo Convite&quot;.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold">
                      <th className="py-2.5 px-3">Empresa Associada</th>
                      <th className="py-2.5 px-3">E-mail / CNPJ</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Expira Em</th>
                      <th className="py-2.5 px-3">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                    {convites.map((c) => {
                      const linkCompleto = `${window.location.origin}/convite/${c.token}`
                      const isCopiado = tokenCopiadoId === c.id

                      return (
                        <tr
                          key={c.id}
                          className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors"
                        >
                          <td className="py-3 px-3">
                            <span className="font-semibold text-slate-900 dark:text-[#F8FAFC] block">
                              {c.empresa_nome}
                            </span>
                            {c.observacoes && (
                              <span className="text-[11px] text-slate-500 block truncate max-w-xs">
                                {c.observacoes}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 font-mono text-[11px] text-slate-700 dark:text-slate-300">
                            <div>{c.email}</div>
                            {c.cnpj && <div className="text-slate-500">{c.cnpj}</div>}
                          </td>
                          <td className="py-3 px-3">{renderBadgeStatus(c.status)}</td>
                          <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                            {new Date(c.expira_em).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                            })}
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-1.5">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => copiarParaTransferencia(linkCompleto, c.id)}
                                className="h-7 text-[11px] px-2"
                                title="Copiar link do convite"
                              >
                                {isCopiado ? (
                                  <>
                                    <Check className="w-3 h-3 text-emerald-600 mr-1" />
                                    Copiado
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3 mr-1" />
                                    Link
                                  </>
                                )}
                              </Button>
                              <a
                                href={linkCompleto}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
                                title="Abrir link em nova aba"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ABA 3: LISTA DE EMPRESAS PARTICIPANTES */}
      {abaAtiva === 'participantes' && (
        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0E1A2E] shadow-sm">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold text-slate-900 dark:text-[#F8FAFC]">
                Empresas Associadas Participantes (Cadastradas)
              </CardTitle>
              <CardDescription className="text-xs text-slate-600 dark:text-[#94A3B8]">
                Empresas com contas ativas vinculadas ao convênio da ACP (papel cliente_acp).
              </CardDescription>
            </div>
            <Badge className="bg-emerald-600 text-white text-xs">
              Ativas: {participantes.length}
            </Badge>
          </CardHeader>

          <CardContent>
            {participantes.length === 0 ? (
              <div className="py-10 text-center text-slate-500 text-xs">
                Nenhuma empresa associada cadastrada ainda. Os cadastros aparecem aqui assim que um
                convite for aceito.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold">
                      <th className="py-2.5 px-3">Empresa / Razão Social</th>
                      <th className="py-2.5 px-3">Código ACP</th>
                      <th className="py-2.5 px-3">E-mail</th>
                      <th className="py-2.5 px-3">CNPJ</th>
                      <th className="py-2.5 px-3">Data de Adesão</th>
                      <th className="py-2.5 px-3">Papel</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                    {participantes.map((p) => (
                      <tr
                        key={p.id}
                        className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors"
                      >
                        <td className="py-3 px-3 font-semibold text-slate-900 dark:text-[#F8FAFC]">
                          {p.name}
                        </td>
                        <td className="py-3 px-3 font-mono text-emerald-700 dark:text-emerald-400 font-bold">
                          {p.cliente_codigo || 'ORB-ACP'}
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-700 dark:text-slate-300">
                          {p.email}
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-600 dark:text-slate-400">
                          {p.cnpj || '—'}
                        </td>
                        <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                          {new Date(p.created).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="py-3 px-3">
                          <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800 text-[10px]">
                            {p.role}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
