import React, { createContext, useContext, useEffect, useState } from 'react'
import type { AuthRecord } from 'pocketbase'
import pb from '@/lib/pocketbase/client'

interface AuthContextType {
  user: AuthRecord | null
  token: string
  isAuthenticated: boolean
  isLoading: boolean
  role:
    | 'master'
    | 'admin'
    | 'controller'
    | 'perito'
    | 'cliente'
    | 'financeiro'
    | 'financeiro_leitor'
    | 'cliente_acp'
    | 'parceiro'
    | string
  isMaster: boolean
  isAdminOrPerito: boolean
  isFinanceiroLeitor: boolean
  isFinanceiro: boolean
  isController: boolean
  isClienteAcp: boolean
  isParceiro: boolean
  isAdmin: boolean
  isGestaoPendente: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  refreshAuth: () => void
  requestPasswordReset: (email: string) => Promise<{ success: boolean; error?: string }>
  confirmPasswordReset: (
    token: string,
    password: string,
  ) => Promise<{ success: boolean; error?: string }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthRecord | null>(pb.authStore.record)
  const [token, setToken] = useState<string>(pb.authStore.token)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  useEffect(() => {
    setUser(pb.authStore.record)
    setToken(pb.authStore.token)
    setIsLoading(false)

    const unsubscribe = pb.authStore.onChange((newToken, newModel) => {
      setToken(newToken)
      setUser(newModel as AuthRecord | null)
    })

    return () => {
      unsubscribe()
    }
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const authData = await pb.collection('users').authWithPassword(email, password)
      setUser(authData.record)
      setToken(authData.token)
      return { success: true }
    } catch (_err: unknown) {
      // Mensagem SEMPRE genérica para proteção contra enumeração e força bruta
      const message =
        'Credenciais inválidas ou limite temporário de tentativas excedido. Por favor, tente novamente mais tarde.'
      return { success: false, error: message }
    }
  }

  const logout = () => {
    pb.authStore.clear()
    setUser(null)
    setToken('')
  }

  const refreshAuth = () => {
    setUser(pb.authStore.record)
    setToken(pb.authStore.token)
  }

  const requestPasswordReset = async (email: string) => {
    try {
      await pb.collection('users').requestPasswordReset(email)
      return { success: true }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Falha ao solicitar redefinição de senha.'
      return { success: false, error: message }
    }
  }

  const confirmPasswordReset = async (token: string, password: string) => {
    try {
      const res = await pb.collection('users').confirmPasswordReset(token, password, password)
      // PocketBase retorna true ou status 204/200; se falhar ou se não for true (em SDK PocketBase v0.36 confirmPasswordReset retorna boolean)
      if (res === false) {
        return {
          success: false,
          error:
            'O servidor recusou a redefinição de senha. O link pode ter expirado ou a senha não cumpre a política.',
        }
      }
      return { success: true }
    } catch (err: any) {
      // Extrair mensagem detalhada caso venha de erro de validação do hook/backend
      const backendMsg =
        err?.data?.data?.password?.message ||
        err?.data?.data?.passwordConfirm?.message ||
        err?.data?.message ||
        err?.message ||
        'Não foi possível redefinir a senha. O link pode ter expirado ou a senha foi recusada pelo servidor.'
      return { success: false, error: backendMsg }
    }
  }

  const role = (user as any)?.role || 'cliente'
  const isMaster = role === 'master'
  const isAdmin = role === 'admin' || role === 'master'
  const isFinanceiro = role === 'financeiro'
  const isFinanceiroLeitor = role === 'financeiro_leitor'
  const isController = role === 'controller'
  const isClienteAcp = role === 'cliente_acp'
  const isParceiro = role === 'parceiro'
  const isAdminOrPerito = isMaster || role === 'admin' || role === 'perito'
  const statusAprovacao = (user as any)?.status_aprovacao
  const isGestaoPendente =
    statusAprovacao === 'pendente' &&
    (role === 'admin' || role === 'controller' || role === 'financeiro')

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        role,
        isMaster,
        isAdmin,
        isFinanceiro,
        isFinanceiroLeitor,
        isController,
        isClienteAcp,
        isParceiro,
        isAdminOrPerito,
        isGestaoPendente,
        login,
        logout,
        refreshAuth,
        requestPasswordReset,
        confirmPasswordReset,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
