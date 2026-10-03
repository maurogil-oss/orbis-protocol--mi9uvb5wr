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
  login: (
    email: string,
    password: string,
  ) => Promise<{
    success: boolean
    error?: string
    isEmailNotFound?: boolean
    status?: number
  }>
  logout: () => void
  refreshAuth: () => void
  requestPasswordReset: (email: string) => Promise<{
    success: boolean
    error?: string
    isEmailNotFound?: boolean
    status?: number
  }>
  confirmPasswordReset: (
    token: string,
    password: string,
    passwordConfirm?: string,
  ) => Promise<{ success: boolean; error?: string; status?: number }>
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
    } catch (err: any) {
      const status = err?.status || err?.response?.status || err?.data?.code || 0
      const isEmailNotFound = status === 404

      // Se for 404 (conta/identidade não encontrada no PocketBase),
      // retornamos o aviso específico e amigável solicitado pelo usuário, com a flag isEmailNotFound: true
      if (isEmailNotFound) {
        return {
          success: false,
          isEmailNotFound: true,
          status: 404,
          error:
            'Não encontramos uma conta com este e-mail. Confira se o endereço foi digitado corretamente (atenção a letras e números parecidos, como "gil" e "g1").',
        }
      }

      // Se o backend retornou mensagem específica (ex.: bloqueio ou rate-limit), preserva se relevante, senão usa mensagem de credenciais
      const message =
        err?.response?.message ||
        err?.message ||
        'Credenciais inválidas ou limite temporário de tentativas excedido. Por favor, tente novamente mais tarde.'

      return {
        success: false,
        isEmailNotFound: false,
        status: status || 400,
        error: message.includes('Failed to authenticate')
          ? 'Credenciais inválidas ou limite temporário de tentativas excedido. Por favor, tente novamente mais tarde.'
          : message,
      }
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
      return { success: true, isEmailNotFound: false }
    } catch (err: any) {
      const status = err?.status || err?.response?.status || err?.data?.code || 0
      const isEmailNotFound = status === 404
      const message = isEmailNotFound
        ? 'Não encontramos uma conta com este e-mail. Confira se o endereço foi digitado corretamente (atenção a letras e números parecidos, como "gil" e "g1").'
        : err instanceof Error
          ? err.message
          : 'Falha ao solicitar redefinição de senha.'
      return { success: false, error: message, isEmailNotFound, status }
    }
  }

  const confirmPasswordReset = async (
    token: string,
    password: string,
    passwordConfirm?: string,
  ) => {
    const trimmedToken = String(token || '').trim()
    const finalPasswordConfirm = passwordConfirm !== undefined ? passwordConfirm : password

    if (!trimmedToken) {
      return {
        success: false,
        error: 'Token de redefinição ausente ou inválido. Solicite um novo link de recuperação.',
      }
    }

    try {
      const res = await pb
        .collection('users')
        .confirmPasswordReset(trimmedToken, password, finalPasswordConfirm)

      // PocketBase retorna true ou status 204/200 (em SDK PocketBase v0.36 confirmPasswordReset retorna boolean)
      if (res === false) {
        return {
          success: false,
          error:
            'O servidor recusou a redefinição de senha. O link pode ter expirado ou a senha não cumpre a política.',
        }
      }
      return { success: true }
    } catch (err: any) {
      console.error('[AuthContext] Erro ao executar confirmPasswordReset:', err)

      const status = err?.status || err?.response?.status || err?.data?.code || 0

      // Mensagem direta de campo do PocketBase
      const fieldError =
        err?.data?.data?.password?.message ||
        err?.data?.data?.passwordConfirm?.message ||
        err?.data?.data?.token?.message ||
        err?.response?.data?.password?.message ||
        err?.response?.data?.passwordConfirm?.message ||
        err?.response?.data?.token?.message

      if (fieldError) {
        return { success: false, error: fieldError, status }
      }

      // Mensagens customizadas ou do hook server-side (ex: BadRequestError)
      const message = err?.data?.message || err?.response?.message || err?.message || ''

      if (
        status === 400 ||
        message.toLowerCase().includes('token') ||
        message.toLowerCase().includes('invalid')
      ) {
        return {
          success: false,
          status,
          error:
            message ||
            'Link de redefinição expirado ou inválido (código 400). Por favor, solicite um novo link de recuperação.',
        }
      }

      if (
        status === 0 ||
        err?.name === 'TypeError' ||
        message.includes('Failed to fetch') ||
        message.includes('NetworkError')
      ) {
        return {
          success: false,
          status,
          error:
            'Erro de conexão ao comunicar com o servidor. Verifique sua rede e tente novamente.',
        }
      }

      return {
        success: false,
        status,
        error:
          message ||
          'Não foi possível redefinir a senha. O link pode ter expirado ou a solicitação foi recusada pelo servidor.',
      }
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
