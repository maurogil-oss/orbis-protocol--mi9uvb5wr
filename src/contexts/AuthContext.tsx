import React, { createContext, useContext, useEffect, useState } from 'react'
import type { AuthRecord } from 'pocketbase'
import pb from '@/lib/pocketbase/client'

interface AuthContextType {
  user: AuthRecord | null
  token: string
  isAuthenticated: boolean
  isLoading: boolean
  role: 'admin' | 'perito' | 'cliente' | 'financeiro_leitor' | 'cliente_acp' | 'parceiro' | string
  isAdminOrPerito: boolean
  isFinanceiroLeitor: boolean
  isClienteAcp: boolean
  isParceiro: boolean
  isAdmin: boolean
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
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'E-mail ou senha inválidos'
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
      await pb.collection('users').confirmPasswordReset(token, password, password)
      return { success: true }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Token inválido ou expirado.'
      return { success: false, error: message }
    }
  }

  const role = (user as any)?.role || 'cliente'
  const isAdmin = role === 'admin'
  const isFinanceiroLeitor = role === 'financeiro_leitor'
  const isClienteAcp = role === 'cliente_acp'
  const isParceiro = role === 'parceiro'
  const isAdminOrPerito = role === 'admin' || role === 'perito'

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        role,
        isAdmin,
        isFinanceiroLeitor,
        isClienteAcp,
        isParceiro,
        isAdminOrPerito,
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
