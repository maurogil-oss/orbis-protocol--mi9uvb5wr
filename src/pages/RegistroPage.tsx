import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import pb from '@/lib/pocketbase/client'
import { OrbisGlobe } from '@/components/OrbisGlobe'
import {
  ShieldCheck,
  Lock,
  Mail,
  User,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Building2,
  Award,
  Sparkles,
  Info,
} from 'lucide-react'

import { useSearchParams } from 'react-router-dom'
import { validarSenhaForte } from '@/lib/passwordPolicy'

export type PerfilRole = 'cliente' | 'perito' | 'cliente_acp' | 'parceiro' | 'gestao'

export default function RegistroPage() {
  const [searchParams] = useSearchParams()
  const location = useLocation()

  // Determinar role inicial via query param (?papel=... ou ?role=...) ou state de navegação
  const getInitialRole = (): PerfilRole => {
    const rawPapel =
      (location.state as any)?.papel ||
      (location.state as any)?.role ||
      searchParams.get('papel') ||
      searchParams.get('role') ||
      searchParams.get('perfil')

    if (!rawPapel) return 'cliente'
    const lower = String(rawPapel).toLowerCase().trim()
    if (lower === 'acp' || lower === 'cliente_acp' || lower === 'cliente-acp') return 'cliente_acp'
    if (lower === 'perito') return 'perito'
    if (lower === 'parceiro' || lower === 'afiliado') return 'parceiro'
    if (lower === 'gestao' || lower === 'admin' || lower === 'gestor') return 'gestao'
    return 'cliente'
  }

  const [role, setRole] = useState<PerfilRole>(getInitialRole)
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [termoAceite, setTermoAceite] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sucesso, setSucesso] = useState(false)

  const { login } = useAuth()
  const navigate = useNavigate()
  const from = (location.state as any)?.from?.pathname

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const cleanNome = nome.trim()
    const cleanEmail = email.trim().toLowerCase()

    if (!cleanNome) {
      setError('Por favor, informe seu nome completo ou razão social.')
      return
    }

    if (!cleanEmail) {
      setError('Por favor, informe um e-mail válido.')
      return
    }

    const valSenha = validarSenhaForte(password)
    if (!valSenha.valida) {
      setError(valSenha.mensagem)
      return
    }

    if (password !== passwordConfirm) {
      setError('A confirmação de senha não confere com a senha informada.')
      return
    }

    if (!termoAceite) {
      setError('É necessário concordar com os Termos de Uso e Política de Privacidade.')
      return
    }

    setIsLoading(true)

    try {
      // Captura ref de indicação e plano_faixa do radar se houver na URL ou localStorage
      const refParam =
        searchParams.get('ref') || localStorage.getItem('orbis_radar_ref') || undefined
      const planoFaixaParam = searchParams.get('plano_faixa') || undefined
      const origemParam = searchParams.get('origem') || undefined

      const ehFluxoRadar = origemParam === 'radar_semanal' || Boolean(planoFaixaParam)

      // 1. Cria usuário na collection users com role selecionado
      // Se for perfil 'gestao', é criado como role 'admin' porém com status_aprovacao = 'pendente'
      // O papel 'master' NUNCA pode ser solicitado ou atribuído aqui
      const dbRole = role === 'gestao' ? 'admin' : role
      const isGestaoPerfil = role === 'gestao'

      // Se for do fluxo do Radar Semanal, ativa trial de 15 dias sem cartão
      const agora = new Date()
      const dataTrialFim = ehFluxoRadar
        ? new Date(agora.getTime() + 15 * 24 * 60 * 60 * 1000).toISOString()
        : undefined

      await pb.collection('users').create({
        email: cleanEmail,
        password,
        passwordConfirm,
        name: cleanNome,
        role: dbRole,
        parceiro_acesso_status: role === 'parceiro' ? 'pendente' : undefined,
        status_aprovacao: isGestaoPerfil ? 'pendente' : 'aprovado',
        radar_acesso_status: ehFluxoRadar ? 'trial' : 'nenhum',
        radar_plano_faixa: planoFaixaParam || (ehFluxoRadar ? '1_cnpj' : 'nenhum'),
        radar_trial_fim: dataTrialFim,
        radar_ref_origem: refParam,
      })

      // 2. Autentica automaticamente
      const authRes = await login(cleanEmail, password)

      if (!authRes.success) {
        throw new Error(
          authRes.error || 'Conta criada, mas houve falha ao autenticar automaticamente.',
        )
      }

      setSucesso(true)

      // 3. Redirecionamento condicional ao perfil
      setTimeout(() => {
        if (isGestaoPerfil) {
          // Usuário de gestão pendente de aprovação: vai para a rota protegida que exibe o bloqueio formal
          navigate('/admin', { replace: true })
        } else if (from) {
          navigate(from, { replace: true })
        } else if (role === 'parceiro') {
          // Parceiro vai direto ao seu painel financeiro (/parceiro-painel)
          navigate('/parceiro-painel', { replace: true })
        } else if (role === 'perito') {
          // Perito vai direto ao credenciamento para homologar ART/RRT
          navigate('/credenciamento', { replace: true })
        } else if (role === 'cliente_acp') {
          // Cliente ACP vai direto à área autenticada do painel (sem funil de diagnóstico)
          navigate('/painel', { replace: true })
        } else if (ehFluxoRadar) {
          // Se veio do produto Radar Semanal, vai para a Central do Radar
          navigate('/central-radar', { replace: true })
        } else {
          // Cliente comum vai ao seu painel
          navigate('/painel', { replace: true })
        }
      }, 900)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao criar conta. Tente novamente.'
      // Tratamento amigável para e-mail já em uso
      if (
        typeof msg === 'string' &&
        (msg.toLowerCase().includes('email') ||
          msg.toLowerCase().includes('unique') ||
          msg.toLowerCase().includes('already'))
      ) {
        setError('Este e-mail já está cadastrado. Tente entrar com sua senha ou use outro e-mail.')
      } else {
        setError(msg)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen py-12 md:py-20 flex items-center justify-center bg-[#0A0E12] px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-4xl p-6 sm:p-10 md:p-12 rounded-2xl bg-[#111820] border border-[rgba(244,247,250,0.12)] shadow-2xl relative">
        {/* Glow de fundo */}
        <div className="absolute top-0 right-1/4 w-72 h-72 bg-[#12B886]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Cabeçalho */}
        <div className="flex flex-col items-center text-center mb-8 relative z-10">
          <div className="relative mb-3">
            <div className="absolute inset-0 rounded-full bg-[#12B886]/25 blur-lg scale-125" />
            <OrbisGlobe size={52} className="relative z-10" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#16202B] border border-[#12B886]/30 text-[#12B886] text-[11px] font-semibold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            Cadastro na Plataforma Orbis
          </div>
          <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-[#F4F7FA]">
            CRIAR SUA CONTA
          </h1>
          <p className="text-xs sm:text-sm text-[#93A3B5] mt-1 max-w-lg">
            Acesso permanente ao cálculo da pegada de carbono, laudos periciais dMRV, passaportes
            verificáveis e documentos prontos para envio.
          </p>
        </div>

        {/* Banner de Erro */}
        {error && (
          <div
            role="alert"
            className="p-3.5 mb-6 rounded-lg bg-[#F03E54]/10 border border-[#F03E54]/30 text-xs sm:text-sm text-[#F03E54] flex items-center gap-2.5"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Banner de Sucesso */}
        {sucesso && (
          <div className="p-4 mb-6 rounded-lg bg-[#12B886]/15 border border-[#12B886] text-xs sm:text-sm text-[#12B886] flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <div>
              <p className="font-semibold">Conta criada e autenticada com sucesso!</p>
              <p className="text-[11px] text-[#93A3B5] mt-0.5">
                Redirecionando para{' '}
                {role === 'gestao'
                  ? 'validação formal pelo Gestor Master'
                  : role === 'perito'
                    ? 'o Credenciamento Pericial'
                    : role === 'cliente_acp'
                      ? 'seu Painel ACP / dMRV'
                      : role === 'parceiro'
                        ? 'o Painel Financeiro do Parceiro'
                        : 'seu Painel'}
                ...
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
          {/* Seletor de Perfil (Role) */}
          <div className="space-y-3">
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#93A3B5]">
              Escolha seu Perfil de Acesso *
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {/* Opção Cliente */}
              <button
                type="button"
                onClick={() => setRole('cliente')}
                className={`p-4 sm:p-5 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between gap-3 min-h-[140px] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#12B886] ${
                  role === 'cliente'
                    ? 'bg-[#12B886]/15 border-[#12B886] shadow-emerald-glow'
                    : 'bg-[#0A0E12] border-[rgba(244,247,250,0.1)] hover:border-[rgba(244,247,250,0.25)] hover:bg-[#0E141B]'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <div
                    className={`p-2.5 rounded-xl shrink-0 transition-colors ${
                      role === 'cliente'
                        ? 'bg-[#12B886] text-[#0A0E12]'
                        : 'bg-[#16202B] text-[#93A3B5]'
                    }`}
                  >
                    <Building2 className="w-5 h-5" />
                  </div>
                  {role === 'cliente' && (
                    <CheckCircle2 className="w-4 h-4 text-[#12B886] shrink-0" />
                  )}
                </div>
                <div className="min-w-0">
                  <span className="font-heading font-bold text-sm sm:text-base text-[#F4F7FA] block leading-snug">
                    Cliente / Empresa
                  </span>
                  <p className="text-xs text-[#93A3B5] leading-relaxed mt-1">
                    Empresas, compradores, frotas e indústrias.
                  </p>
                </div>
              </button>

              {/* Opção Cliente ACP */}
              <button
                type="button"
                onClick={() => setRole('cliente_acp')}
                className={`p-4 sm:p-5 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between gap-3 min-h-[140px] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D9B36C] ${
                  role === 'cliente_acp'
                    ? 'bg-[#D9B36C]/15 border-[#D9B36C] shadow-lg shadow-[#D9B36C]/15'
                    : 'bg-[#0A0E12] border-[rgba(244,247,250,0.1)] hover:border-[rgba(244,247,250,0.25)] hover:bg-[#0E141B]'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <div
                    className={`p-2.5 rounded-xl shrink-0 transition-colors ${
                      role === 'cliente_acp'
                        ? 'bg-[#D9B36C] text-[#0A0E12]'
                        : 'bg-[#16202B] text-[#93A3B5]'
                    }`}
                  >
                    <Sparkles className="w-5 h-5" />
                  </div>
                  {role === 'cliente_acp' && (
                    <CheckCircle2 className="w-4 h-4 text-[#D9B36C] shrink-0" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-heading font-bold text-sm sm:text-base text-[#F4F7FA] leading-snug">
                      Cliente ACP
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-[#D9B36C]/20 text-[#D9B36C] font-mono font-bold tracking-wider">
                      PARANÁ
                    </span>
                  </div>
                  <p className="text-xs text-[#93A3B5] leading-relaxed mt-1">
                    Associados ACP com código exclusivo ORB-ACP e acesso direto.
                  </p>
                </div>
              </button>

              {/* Opção Perito */}
              <button
                type="button"
                onClick={() => setRole('perito')}
                className={`p-4 sm:p-5 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between gap-3 min-h-[140px] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#12B886] ${
                  role === 'perito'
                    ? 'bg-[#12B886]/15 border-[#12B886] shadow-emerald-glow'
                    : 'bg-[#0A0E12] border-[rgba(244,247,250,0.1)] hover:border-[rgba(244,247,250,0.25)] hover:bg-[#0E141B]'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <div
                    className={`p-2.5 rounded-xl shrink-0 transition-colors ${
                      role === 'perito'
                        ? 'bg-[#12B886] text-[#0A0E12]'
                        : 'bg-[#16202B] text-[#93A3B5]'
                    }`}
                  >
                    <Award className="w-5 h-5" />
                  </div>
                  {role === 'perito' && (
                    <CheckCircle2 className="w-4 h-4 text-[#12B886] shrink-0" />
                  )}
                </div>
                <div className="min-w-0">
                  <span className="font-heading font-bold text-sm sm:text-base text-[#F4F7FA] block leading-snug">
                    Perito Técnico
                  </span>
                  <p className="text-xs text-[#93A3B5] leading-relaxed mt-1">
                    Engenheiros CREA, contadores CRC e auditores dMRV.
                  </p>
                </div>
              </button>

              {/* Opção Parceiro */}
              <button
                type="button"
                onClick={() => setRole('parceiro')}
                className={`p-4 sm:p-5 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between gap-3 min-h-[140px] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#12B886] ${
                  role === 'parceiro'
                    ? 'bg-[#12B886]/20 border-[#12B886] shadow-lg shadow-[#12B886]/15'
                    : 'bg-[#0A0E12] border-[rgba(244,247,250,0.1)] hover:border-[rgba(244,247,250,0.25)] hover:bg-[#0E141B]'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <div
                    className={`p-2.5 rounded-xl shrink-0 transition-colors ${
                      role === 'parceiro'
                        ? 'bg-[#12B886] text-[#0A0E12]'
                        : 'bg-[#16202B] text-[#93A3B5]'
                    }`}
                  >
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  {role === 'parceiro' && (
                    <CheckCircle2 className="w-4 h-4 text-[#12B886] shrink-0" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-heading font-bold text-sm sm:text-base text-[#F4F7FA] leading-snug">
                      Parceiro
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-[#12B886]/20 text-[#12B886] font-mono font-bold tracking-wider">
                      ORB-PAR
                    </span>
                  </div>
                  <p className="text-xs text-[#93A3B5] leading-relaxed mt-1">
                    Afiliados, consultores e distribuidores de soluções ESG.
                  </p>
                </div>
              </button>

              {/* Opção Gestão (Pendente de Aprovação pelo Master) */}
              <button
                type="button"
                onClick={() => setRole('gestao')}
                className={`p-4 sm:p-5 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between gap-3 min-h-[140px] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6] md:col-span-2 lg:col-span-1 ${
                  role === 'gestao'
                    ? 'bg-[#3B82F6]/20 border-[#3B82F6] shadow-lg shadow-[#3B82F6]/15'
                    : 'bg-[#0A0E12] border-[rgba(244,247,250,0.1)] hover:border-[rgba(244,247,250,0.25)] hover:bg-[#0E141B]'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <div
                    className={`p-2.5 rounded-xl shrink-0 transition-colors ${
                      role === 'gestao'
                        ? 'bg-[#3B82F6] text-[#0A0E12]'
                        : 'bg-[#16202B] text-[#93A3B5]'
                    }`}
                  >
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  {role === 'gestao' && (
                    <CheckCircle2 className="w-4 h-4 text-[#3B82F6] shrink-0" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-heading font-bold text-sm sm:text-base text-[#F4F7FA] leading-snug">
                      Gestão
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-[#D9B36C]/20 text-[#D9B36C] font-mono font-bold tracking-wider">
                      REQUER VALIDAÇÃO
                    </span>
                  </div>
                  <p className="text-xs text-[#93A3B5] leading-relaxed mt-1">
                    Equipe interna. Fica pendente até aprovação formal pelo Gestor Master.
                  </p>
                </div>
              </button>
            </div>

            {/* Explicação contextual sobre o perfil escolhido */}
            <div className="mt-3 p-3.5 sm:p-4 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.08)] flex items-start gap-3 text-xs text-[#93A3B5]">
              <Info className="w-4 h-4 text-[#12B886] shrink-0 mt-0.5" />
              <span className="leading-relaxed">
                {role === 'gestao'
                  ? 'Como Gestão, sua conta é cadastrada com status "pendente de aprovação" e não possui acesso à área interna até validação formal. APENAS o Gestor Master pode homologar seu acesso e definir seu papel específico no Console (Admin, Controller, Financeiro ou Leitor). O papel Master nunca é concedido por cadastro ou interface.'
                  : role === 'parceiro'
                    ? 'Como Parceiro, sua conta receberá identificador exclusivo com prefixo ORB-PAR-XXXX e vínculo automático ao módulo fiscal/financeiro. Enquanto o cadastro aguarda liberação pela controladoria, seu painel exibirá o status de homologação.'
                    : role === 'perito'
                      ? 'Como Perito Técnico, após criar sua conta você completará o credenciamento com número de ART/RRT e conselho regional para emitir laudos chancelados.'
                      : role === 'cliente_acp'
                        ? 'Como Cliente ACP, sua conta receberá identificador exclusivo com prefixo ORB-ACP-XXXX e acesso direto ao Painel Corporativo e dMRV, sem necessidade de passar pelo funil prévio.'
                        : 'Como Cliente, você terá acesso imediato ao painel, importação de NF-e/SPED, diagnóstico SBCE e contratação de serviços.'}
              </span>
            </div>
          </div>

          {/* Nome / Responsável */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#93A3B5] mb-1.5">
              {role === 'perito'
                ? 'Nome Completo do Perito *'
                : role === 'parceiro'
                  ? 'Nome do Parceiro / Razão Social *'
                  : 'Nome Completo ou Razão Social *'}
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#93A3B5]" />
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder={
                  role === 'perito'
                    ? 'Dr. Eng. Carlos Mendonça'
                    : role === 'parceiro'
                      ? 'Consultoria Verde & Associados ou João Santos'
                      : 'Maria Silva ou Indústria Alfa Ltda'
                }
                className="w-full pl-10 pr-4 py-3 rounded-lg bg-[#0A0E12] border border-[rgba(244,247,250,0.15)] text-[#F4F7FA] placeholder-[#93A3B5]/40 focus:outline-none focus:ring-2 focus:ring-[#12B886] text-sm"
                required
              />
            </div>
          </div>

          {/* E-mail Corporativo */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#93A3B5] mb-1.5">
              E-mail Corporativo *
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#93A3B5]" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu.email@empresa.com.br"
                className="w-full pl-10 pr-4 py-3 rounded-lg bg-[#0A0E12] border border-[rgba(244,247,250,0.15)] text-[#F4F7FA] placeholder-[#93A3B5]/40 focus:outline-none focus:ring-2 focus:ring-[#12B886] text-sm"
                required
              />
            </div>
          </div>

          {/* Senha e Confirmação de Senha */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#93A3B5] mb-1.5">
                Senha (mín. 10 caracteres, A-Z, a-z, 0-9) *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#93A3B5]" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Ex: SenhaForte2026"
                  minLength={10}
                  className="w-full pl-10 pr-4 py-3 rounded-lg bg-[#0A0E12] border border-[rgba(244,247,250,0.15)] text-[#F4F7FA] placeholder-[#93A3B5]/40 focus:outline-none focus:ring-2 focus:ring-[#12B886] text-sm"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#93A3B5] mb-1.5">
                Confirmar Senha *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#93A3B5]" />
                <input
                  type="password"
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  placeholder="••••••••"
                  minLength={8}
                  className="w-full pl-10 pr-4 py-3 rounded-lg bg-[#0A0E12] border border-[rgba(244,247,250,0.15)] text-[#F4F7FA] placeholder-[#93A3B5]/40 focus:outline-none focus:ring-2 focus:ring-[#12B886] text-sm"
                  required
                />
              </div>
            </div>
          </div>

          {/* Aceite dos Termos */}
          <label className="flex items-start gap-3 p-3 rounded-xl bg-[#0A0E12] border border-[rgba(244,247,250,0.1)] cursor-pointer">
            <input
              type="checkbox"
              checked={termoAceite}
              onChange={(e) => setTermoAceite(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded text-[#12B886] focus:ring-0 border-[rgba(244,247,250,0.2)] bg-[#111820]"
            />
            <span className="text-xs text-[#93A3B5] leading-relaxed">
              Declaro que li e concordo com os{' '}
              <Link to="/privacidade" className="text-[#12B886] hover:underline" target="_blank">
                Termos de Uso e Política de Privacidade
              </Link>{' '}
              da infraestrutura dMRV do Orbis Protocol (LGPD Art. 7º/18).
            </span>
          </label>

          {/* Botão de Submissão */}
          <button
            type="submit"
            disabled={isLoading || sucesso}
            className="w-full py-3.5 rounded-xl font-bold bg-[#12B886] text-[#0A0E12] hover:bg-[#0CA678] hover:scale-[1.01] transition-all shadow-emerald-glow flex items-center justify-center gap-2 disabled:opacity-50 text-sm uppercase tracking-wider"
          >
            {isLoading ? (
              <span>Criando conta e autenticando...</span>
            ) : (
              <>
                <span>
                  Criar Conta de{' '}
                  {role === 'gestao'
                    ? 'Gestão (Pendente de Validação)'
                    : role === 'perito'
                      ? 'Perito'
                      : role === 'parceiro'
                        ? 'Parceiro'
                        : role === 'cliente_acp'
                          ? 'Cliente ACP'
                          : 'Cliente'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Link claro para Login existente */}
        <div className="mt-8 pt-6 border-t border-[rgba(244,247,250,0.1)] text-center text-xs text-[#93A3B5] flex flex-col sm:flex-row items-center justify-center gap-2">
          <span>Já tem uma conta cadastrada?</span>
          <Link
            to="/login"
            className="text-[#12B886] font-bold hover:underline inline-flex items-center gap-1"
          >
            <span>Já tenho conta → Entrar</span>
          </Link>
        </div>

        {/* Informação adicional sobre o diagnóstico */}
        <div className="mt-4 text-center">
          <Link
            to="/diagnostico"
            className="text-[11px] text-[#93A3B5]/80 hover:text-[#12B886] transition-colors"
          >
            Quer apenas simular sem cadastro prévio? Faça um diagnóstico por CNPJ →
          </Link>
        </div>
      </div>
    </div>
  )
}
