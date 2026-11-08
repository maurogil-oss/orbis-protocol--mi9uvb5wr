/**
 * ConviteAcpPage.tsx
 * Fluxo de cadastro de empresas associadas via link de convite exclusivo da ACP.
 *
 * Rotas: /convite/:token ou /convite?token=...
 *
 * Estados:
 * - Carregando / validando
 * - Convite inválido ou não encontrado
 * - Convite usado (recusa com mensagem clara)
 * - Convite expirado (recusa com mensagem clara)
 * - Convite válido: formulário pré-preenchido com nome e e-mail da empresa,
 *   solicitando senha forte e dados adicionais, com aceite do Termo de Adesão ACP.
 * - Sucesso: conta criada com papel cliente_acp (prefixo ORB-ACP), login automático e redirect para /painel.
 */

import React, { useEffect, useState } from 'react'
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom'
import {
  validarTokenConviteAcp,
  aceitarConviteAcp,
  ValidacaoConviteAcpResposta,
} from '@/services/acpConvitesService'
import { obterConfigCobrandingAcp, CobrandingAcpConfig } from '@/services/platformSettingsService'
import { useAuth } from '@/contexts/AuthContext'
import { useSeo } from '@/hooks/useSeo'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  ShieldCheck,
  Building2,
  Mail,
  Lock,
  User,
  AlertTriangle,
  XCircle,
  Clock,
  CheckCircle2,
  ArrowRight,
  ExternalLink,
  Loader2,
  FileCheck2,
} from 'lucide-react'

export default function ConviteAcpPage() {
  useSeo({
    title: 'Convite Associada ACP — Orbis Protocol',
    description:
      'Cadastro de empresa associada à Associação Comercial do Paraná na plataforma Orbis Protocol.',
  })

  const { token: paramToken } = useParams<{ token?: string }>()
  const [searchParams] = useSearchParams()
  const token = (paramToken || searchParams.get('token') || '').trim()

  const navigate = useNavigate()
  const { login } = useAuth()

  const [cobranding, setCobranding] = useState<CobrandingAcpConfig>({
    ativo: false,
    texto: 'em parceria com a Associação Comercial do Paraná',
    logoUrl: 'https://img.usecurling.com/i?q=parana&color=solid-black',
  })
  const [carregando, setCarregando] = useState<boolean>(true)
  const [validacao, setValidacao] = useState<ValidacaoConviteAcpResposta | null>(null)

  // Formulário
  const [nomeResponsavel, setNomeResponsavel] = useState<string>('')
  const [cnpj, setCnpj] = useState<string>('')
  const [senha, setSenha] = useState<string>('')
  const [confirmarSenha, setConfirmarSenha] = useState<string>('')
  const [termoAceito, setTermoAceito] = useState<boolean>(false)

  // Submissão
  const [enviando, setEnviando] = useState<boolean>(false)
  const [erroSubmissao, setErroSubmissao] = useState<string | null>(null)
  const [sucesso, setSucesso] = useState<boolean>(false)
  const [codigoClienteGerado, setCodigoClienteGerado] = useState<string | null>(null)

  // Carrega co-branding
  useEffect(() => {
    let ativo = true
    const carregar = async () => {
      try {
        const cfg = await obterConfigCobrandingAcp()
        if (ativo) setCobranding(cfg)
      } catch {
        // Fallback já presente no estado inicial
      }
    }
    carregar()
    const handleCoBrand = () => {
      carregar()
    }
    window.addEventListener('orbis_acp_cobranding_change', handleCoBrand)
    return () => {
      ativo = false
      window.removeEventListener('orbis_acp_cobranding_change', handleCoBrand)
    }
  }, [])

  // Valida o token
  useEffect(() => {
    let ativo = true

    async function validar() {
      if (!token) {
        if (ativo) {
          setValidacao({
            valido: false,
            motivo: 'Nenhum token de convite foi informado na URL.',
          })
          setCarregando(false)
        }
        return
      }

      setCarregando(true)
      try {
        const resp = await validarTokenConviteAcp(token)
        if (ativo) {
          setValidacao(resp)
          if (resp.valido && resp.convite?.cnpj) {
            setCnpj(resp.convite.cnpj)
          }
        }
      } catch (err: any) {
        if (ativo) {
          setValidacao({
            valido: false,
            motivo: err?.message || 'Falha ao validar o convite ACP.',
          })
        }
      } finally {
        if (ativo) setCarregando(false)
      }
    }

    validar()
    return () => {
      ativo = false
    }
  }, [token])

  // Submissão do cadastro
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErroSubmissao(null)

    if (!senha || senha.length < 8) {
      setErroSubmissao('A senha de acesso deve possuir pelo menos 8 caracteres.')
      return
    }

    if (senha !== confirmarSenha) {
      setErroSubmissao('A confirmação da senha não confere.')
      return
    }

    if (!termoAceito) {
      setErroSubmissao('É necessário aceitar os Termos de Adesão do Piloto ACP / Orbis Protocol.')
      return
    }

    setEnviando(true)
    try {
      const resp = await aceitarConviteAcp({
        token,
        password: senha,
        nome_responsavel: nomeResponsavel.trim(),
        cnpj: cnpj.trim(),
      })

      setSucesso(true)
      setCodigoClienteGerado(resp.usuario?.cliente_codigo || 'ORB-ACP')

      // Login automático
      if (validacao?.convite?.email) {
        try {
          await login(validacao.convite.email, senha)
          setTimeout(() => {
            navigate('/painel')
          }, 2200)
        } catch (_) {
          // Se o auto-login falhar por política, redireciona para login
        }
      }
    } catch (err: any) {
      setErroSubmissao(err?.message || 'Erro ao processar o cadastro via convite.')
    } finally {
      setEnviando(false)
    }
  }

  // Visual do logo ACP
  const acpLogoUrl =
    cobranding.logoUrl ||
    'https://img.usecurling.com/i?q=handshake&color=solid-black&shape=lineal-color'

  return (
    <div className="min-h-[85vh] bg-gradient-to-b from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 py-12 px-4 sm:px-6 lg:px-8 flex flex-col justify-center items-center">
      <div className="w-full max-w-xl space-y-6">
        {/* Cabeçalho Co-Branded */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full px-4 py-1.5 shadow-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              Orbis Protocol
            </span>
            <span className="text-slate-300 dark:text-slate-700">✕</span>
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
              <img
                src={acpLogoUrl}
                alt="ACP"
                className="w-4 h-4 object-contain inline-block"
                onError={(e) => {
                  ;(e.currentTarget as HTMLElement).style.display = 'none'
                }}
              />
              Associação Comercial do Paraná
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            Adesão de Empresa Associada
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
            {cobranding.texto || 'em parceria com a Associação Comercial do Paraná'}
          </p>
        </div>

        {/* 1. Estado Carregando */}
        {carregando && (
          <Card className="border-slate-200 dark:border-slate-800 shadow-md">
            <CardContent className="py-12 flex flex-col items-center justify-center space-y-4 text-center">
              <Loader2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400 animate-spin" />
              <div className="space-y-1">
                <p className="font-medium text-slate-900 dark:text-white">
                  Validando link de convite exclusivo...
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Verificando integridade criptográfica e validade do vínculo ACP.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 2. Estado Sucesso Concluído */}
        {!carregando && sucesso && (
          <Card className="border-emerald-200 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-lg">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/60 flex items-center justify-center text-emerald-600 dark:text-emerald-300 mb-2">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <CardTitle className="text-xl text-emerald-900 dark:text-emerald-100">
                Cadastro ACP Concluído com Sucesso!
              </CardTitle>
              <CardDescription className="text-emerald-700 dark:text-emerald-300 text-sm">
                Sua empresa foi vinculada ao convênio da Associação Comercial do Paraná.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-center pt-2">
              <div className="p-3.5 bg-white dark:bg-slate-900 rounded-lg border border-emerald-200 dark:border-emerald-800 text-left space-y-1.5">
                <div className="flex justify-between items-center text-xs text-slate-500">
                  <span>Código de Associada Orbis:</span>
                  <Badge
                    variant="outline"
                    className="font-mono text-emerald-700 dark:text-emerald-300"
                  >
                    {codigoClienteGerado}
                  </Badge>
                </div>
                <div className="flex justify-between items-center text-xs text-slate-500">
                  <span>Papel na Plataforma:</span>
                  <Badge className="bg-emerald-600 text-white">cliente_acp</Badge>
                </div>
                <div className="flex justify-between items-center text-xs text-slate-500">
                  <span>Benefício Ativo:</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    Trial Piloto ACP 15 dias / 5 notas dMRV
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-400">
                Redirecionando automaticamente para o seu painel de controle...
              </p>

              <div className="pt-2 flex flex-col sm:flex-row gap-2">
                <Button
                  onClick={() => navigate('/painel')}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  Acessar Painel Agora
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate('/login')}
                  className="w-full sm:w-auto"
                >
                  Ir para Login
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 3. Estado Inválido / Usado / Expirado */}
        {!carregando && !sucesso && validacao && !validacao.valido && (
          <Card className="border-red-200 dark:border-red-900/60 shadow-md">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto w-12 h-12 rounded-full bg-red-100 dark:bg-red-950 flex items-center justify-center text-red-600 dark:text-red-400 mb-2">
                {validacao.status === 'expirado' ? (
                  <Clock className="w-6 h-6" />
                ) : validacao.status === 'usado' ? (
                  <CheckCircle2 className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                ) : (
                  <XCircle className="w-6 h-6" />
                )}
              </div>
              <CardTitle className="text-lg text-slate-900 dark:text-white">
                {validacao.status === 'usado'
                  ? 'Convite Já Utilizado'
                  : validacao.status === 'expirado'
                    ? 'Convite Expirado'
                    : 'Link de Convite Não Reconhecido'}
              </CardTitle>
              <CardDescription className="text-sm text-slate-600 dark:text-slate-400">
                {validacao.motivo || 'Este convite não está mais apto para realização de cadastro.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-2">
              <Alert className="bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-200">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle className="text-xs font-semibold">Como prosseguir?</AlertTitle>
                <AlertDescription className="text-xs space-y-1">
                  <p>
                    Se você já concluiu o cadastro anteriormente, acesse a plataforma com seu e-mail
                    e senha na tela de login.
                  </p>
                  <p>
                    Caso precise de um novo link, solicite à administração da ACP ou ao gestor do
                    piloto.
                  </p>
                </AlertDescription>
              </Alert>

              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <Button asChild className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                  <Link to="/login">Acessar Tela de Login</Link>
                </Button>
                <Button asChild variant="outline" className="w-full sm:w-auto">
                  <Link to="/solucoes/bureau-acp">Conhecer o Bureau ACP</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 4. Estado Válido: Formulário de Conclusão */}
        {!carregando && !sucesso && validacao && validacao.valido && validacao.convite && (
          <Card className="border-slate-200 dark:border-slate-800 shadow-md">
            <CardHeader className="space-y-1.5 pb-4">
              <div className="flex items-center justify-between">
                <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200 dark:border-blue-800 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Convite Exclusivo ACP
                </Badge>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Validade:{' '}
                  {new Date(validacao.convite.expira_em).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                  })}
                </span>
              </div>
              <CardTitle className="text-xl text-slate-900 dark:text-white">
                Finalizar Cadastro da Associada
              </CardTitle>
              <CardDescription className="text-xs text-slate-600 dark:text-slate-400">
                Os dados institucionais abaixo foram emitidos pela curadoria da ACP. Complete sua
                senha corporativa para ativar o acesso.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Dados da Empresa (Somente Leitura do Convite) */}
                <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2.5">
                  <div>
                    <Label className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5" />
                      Razão Social / Empresa Associada:
                    </Label>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white mt-0.5">
                      {validacao.convite.empresa_nome}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        E-mail de Acesso:
                      </span>
                      <span className="font-mono text-slate-800 dark:text-slate-200">
                        {validacao.convite.email}
                      </span>
                    </div>
                    {validacao.convite.cnpj ? (
                      <div>
                        <span className="text-slate-500 dark:text-slate-400">CNPJ Vinculado:</span>
                        <span className="font-mono text-slate-800 dark:text-slate-200 block">
                          {validacao.convite.cnpj}
                        </span>
                      </div>
                    ) : (
                      <div>
                        <span className="text-slate-500 dark:text-slate-400">CNPJ:</span>
                        <span className="text-slate-400 italic block">Informar abaixo</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Nome do Responsável */}
                <div className="space-y-1.5">
                  <Label htmlFor="nomeResponsavel" className="text-xs flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-slate-500" />
                    Nome do Responsável Técnico / Operacional
                  </Label>
                  <Input
                    id="nomeResponsavel"
                    type="text"
                    placeholder="Ex: Carlos Eduardo Silva"
                    value={nomeResponsavel}
                    onChange={(e) => setNomeResponsavel(e.target.value)}
                    className="text-sm"
                  />
                  <p className="text-[11px] text-slate-500">
                    Opcional. Se omitido, o nome da própria empresa será adotado no perfil.
                  </p>
                </div>

                {/* CNPJ se não veio no convite */}
                {!validacao.convite.cnpj && (
                  <div className="space-y-1.5">
                    <Label htmlFor="cnpjEmpresa" className="text-xs flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-slate-500" />
                      CNPJ da Empresa (opcional)
                    </Label>
                    <Input
                      id="cnpjEmpresa"
                      type="text"
                      placeholder="00.000.000/0000-00"
                      value={cnpj}
                      onChange={(e) => setCnpj(e.target.value)}
                      className="text-sm font-mono"
                    />
                  </div>
                )}

                {/* Senha e Confirmação */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1.5">
                    <Label htmlFor="senhaAcesso" className="text-xs flex items-center gap-1">
                      <Lock className="w-3.5 h-3.5 text-slate-500" />
                      Criar Senha de Acesso
                    </Label>
                    <Input
                      id="senhaAcesso"
                      type="password"
                      placeholder="Mínimo 8 caracteres"
                      value={senha}
                      onChange={(e) => setSenha(e.target.value)}
                      required
                      minLength={8}
                      className="text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="confirmarSenha" className="text-xs flex items-center gap-1">
                      <Lock className="w-3.5 h-3.5 text-slate-500" />
                      Confirmar Senha
                    </Label>
                    <Input
                      id="confirmarSenha"
                      type="password"
                      placeholder="Repita a senha"
                      value={confirmarSenha}
                      onChange={(e) => setConfirmarSenha(e.target.value)}
                      required
                      minLength={8}
                      className="text-sm"
                    />
                  </div>
                </div>

                {/* Termo de Adesão ACP */}
                <div className="pt-2">
                  <label className="flex items-start gap-2.5 p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={termoAceito}
                      onChange={(e) => setTermoAceito(e.target.checked)}
                      className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      Declaro que a empresa <strong>{validacao.convite.empresa_nome}</strong> é
                      associada ativa da <strong>Associação Comercial do Paraná (ACP)</strong> e
                      concorda com os{' '}
                      <Link
                        to="/termos"
                        target="_blank"
                        className="text-emerald-600 dark:text-emerald-400 underline inline-flex items-center gap-0.5"
                      >
                        Termos de Uso
                        <ExternalLink className="w-2.5 h-2.5 inline" />
                      </Link>{' '}
                      e a Política de Prova Documental do Piloto ACP.
                    </span>
                  </label>
                </div>

                {/* Alerta de Erro */}
                {erroSubmissao && (
                  <Alert variant="destructive" className="py-2.5 text-xs">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle className="text-xs font-semibold">
                      Não foi possível concluir
                    </AlertTitle>
                    <AlertDescription className="text-xs">{erroSubmissao}</AlertDescription>
                  </Alert>
                )}

                {/* Botão de Conclusão */}
                <div className="pt-2">
                  <Button
                    type="submit"
                    disabled={enviando || !termoAceito}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5"
                  >
                    {enviando ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Ativando Acesso Vinculado ACP...
                      </>
                    ) : (
                      <>
                        <FileCheck2 className="w-4 h-4 mr-2" />
                        Concluir Cadastro e Ativar Piloto
                      </>
                    )}
                  </Button>
                </div>

                <div className="text-center pt-2">
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Acesso protegido com credencial criptográfica SHA-256 e trilha de auditoria
                    vinculada ao convênio ACP.
                  </p>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Rodapé de apoio */}
        <div className="text-center text-xs text-slate-500 dark:text-slate-500 space-y-1">
          <p>
            Dúvidas sobre o piloto ACP? Contate{' '}
            <a
              href="mailto:contato@orbisprotocol.org"
              className="underline text-slate-700 dark:text-slate-300"
            >
              contato@orbisprotocol.org
            </a>{' '}
            ou a câmara setorial da ACP.
          </p>
          <p>Orbis Protocol — Infraestrutura de Prova Documental da Economia Circular</p>
        </div>
      </div>
    </div>
  )
}
