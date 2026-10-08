import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireRole?:
    | 'master'
    | 'admin'
    | 'perito'
    | 'adminOrPerito'
    | 'parceiro'
    | 'adminOrFinanceiro'
    | 'parceiroOrAdmin'
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requireRole }) => {
  const {
    isAuthenticated,
    isLoading,
    isAdminOrPerito,
    role,
    isMaster,
    isFinanceiroLeitor,
    isAdmin,
    user,
  } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] bg-[#0A0E12] text-[#F4F7FA]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#12B886]" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // 1. Bloqueio de Cliente Suspenso (cliente_acesso_status === 'suspenso')
  // Aplicável a clientes (inclusive cliente_acp); administradores e gestor master nunca são bloqueados por esta regra.
  const clienteAcessoStatus = (user as any)?.cliente_acesso_status
  const isClientRole = role === 'cliente' || role === 'cliente_acp' || (!isAdmin && !isMaster)
  if (clienteAcessoStatus === 'suspenso' && isClientRole && !isAdmin && !isMaster) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-background px-4 py-16">
        <div className="max-w-md w-full p-8 rounded-2xl bg-card border border-destructive/40 text-center space-y-4 shadow-2xl">
          <div className="w-16 h-16 mx-auto rounded-full bg-destructive/10 border border-destructive/30 flex items-center justify-center text-destructive text-2xl font-bold">
            🛡️
          </div>
          <span className="px-3 py-1 rounded-full bg-destructive/20 text-destructive text-[10px] font-mono font-bold uppercase tracking-wider inline-block">
            Conta Suspensa • Acesso Restrito
          </span>
          <h2 className="text-xl font-heading font-black text-foreground">
            Acesso à Conta Suspenso
          </h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Seu acesso às funcionalidades operacionais da plataforma <strong>Orbis Protocol</strong>{' '}
            foi temporariamente suspenso pela administração de governança. Para regularizar sua
            conta institucional, entre em contato com nosso time de atendimento.
          </p>
          <div className="p-3 rounded-lg bg-muted/40 border border-border text-[11px] text-muted-foreground text-left space-y-1 font-mono">
            <div>
              • Conta: <strong className="text-foreground">{user?.email}</strong>
            </div>
            <div>
              • Situação: <strong className="text-destructive">Suspenso</strong>
            </div>
            <div>
              • Suporte Oficial:{' '}
              <a
                href="mailto:suporte@orbis-protocol.com"
                className="text-primary hover:underline font-bold"
              >
                suporte@orbis-protocol.com
              </a>
            </div>
          </div>
          <div className="pt-2 flex flex-col sm:flex-row gap-2">
            <a
              href="mailto:suporte@orbis-protocol.com?subject=Regulariza%C3%A7%C3%A3o%20de%20Acesso%20-%20Conta%20Suspensa"
              className="flex-1 py-2.5 rounded-xl bg-destructive text-destructive-foreground hover:opacity-90 text-xs font-bold transition-all text-center"
            >
              Falar com o Suporte
            </a>
            <button
              type="button"
              onClick={() => window.location.replace('/')}
              className="flex-1 py-2.5 rounded-xl bg-muted hover:bg-muted/80 text-xs font-bold text-foreground transition-all"
            >
              Página Inicial
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Contas Gestão com aprovação pendente: sem acesso à área interna até validação pelo master
  const statusAprovacao = (user as any)?.status_aprovacao
  const isGestao = role === 'admin' || role === 'controller' || role === 'financeiro'
  if (isGestao && statusAprovacao === 'pendente' && !isMaster) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-[#0A0E12] px-4 py-16">
        <div className="max-w-md w-full p-8 rounded-2xl bg-[#111820] border border-[#D9B36C]/40 text-center space-y-4 shadow-2xl">
          <div className="w-16 h-16 mx-auto rounded-full bg-[#D9B36C]/10 border border-[#D9B36C]/30 flex items-center justify-center text-[#D9B36C] text-2xl font-bold">
            ⏳
          </div>
          <span className="px-3 py-1 rounded-full bg-[#D9B36C]/20 text-[#D9B36C] text-[10px] font-mono font-bold uppercase tracking-wider inline-block">
            Perfil Gestão • Pendente de Aprovação
          </span>
          <h2 className="text-xl font-heading font-black text-[#F4F7FA]">
            Acesso em Análise pelo Gestor Master
          </h2>
          <p className="text-xs text-[#93A3B5] leading-relaxed">
            Sua conta corporativa com perfil <strong>Gestão</strong> foi criada com sucesso, mas
            requer validação formal e homologação exclusiva pelo <strong>Gestor Master</strong> da
            plataforma antes de acessar a área interna e consoles.
          </p>
          <div className="p-3 rounded-lg bg-[#0A0E12] border border-[rgba(244,247,250,0.08)] text-[11px] text-[#93A3B5] text-left space-y-1">
            <div>
              • E-mail: <strong className="text-[#F4F7FA]">{user?.email}</strong>
            </div>
            <div>
              • Status: <strong className="text-[#D9B36C]">Aguardando Homologação</strong>
            </div>
            <div>• Notificação: Você receberá liberação assim que o master avaliar o perfil.</div>
          </div>
          <button
            type="button"
            onClick={() => window.location.replace('/')}
            className="w-full py-2.5 rounded-xl bg-[#16202B] hover:bg-[#12B886] hover:text-[#0A0E12] text-xs font-bold text-[#F4F7FA] transition-all"
          >
            Voltar à Página Inicial
          </button>
        </div>
      </div>
    )
  }

  if (requireRole === 'master' && !isMaster) {
    return <Navigate to="/admin" replace />
  }

  if (requireRole === 'adminOrPerito' && !isAdminOrPerito) {
    return <Navigate to="/painel" replace />
  }

  if (
    requireRole === 'admin' &&
    !isMaster &&
    role !== 'admin' &&
    role !== 'controller' &&
    role !== 'financeiro' &&
    !isFinanceiroLeitor
  ) {
    return <Navigate to="/painel" replace />
  }

  if (
    requireRole === 'adminOrFinanceiro' &&
    !isMaster &&
    !isAdmin &&
    role !== 'controller' &&
    role !== 'financeiro' &&
    !isFinanceiroLeitor
  ) {
    return <Navigate to="/painel" replace />
  }

  if (requireRole === 'parceiro' && role !== 'parceiro') {
    return <Navigate to="/painel" replace />
  }

  if (requireRole === 'parceiroOrAdmin' && role !== 'parceiro' && !isAdmin) {
    return <Navigate to="/painel" replace />
  }

  if (requireRole === 'perito' && role !== 'perito' && !isAdmin) {
    return <Navigate to="/painel" replace />
  }

  return <>{children}</>
}
