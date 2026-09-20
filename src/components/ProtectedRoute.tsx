import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireRole?: 'admin' | 'perito' | 'adminOrPerito' | 'parceiro' | 'adminOrFinanceiro'
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requireRole }) => {
  const { isAuthenticated, isLoading, isAdminOrPerito, role, isFinanceiroLeitor, isAdmin } =
    useAuth()
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

  if (requireRole === 'adminOrPerito' && !isAdminOrPerito) {
    return <Navigate to="/painel" replace />
  }

  if (requireRole === 'admin' && role !== 'admin' && !isFinanceiroLeitor) {
    return <Navigate to="/painel" replace />
  }

  if (requireRole === 'adminOrFinanceiro' && !isAdmin && !isFinanceiroLeitor) {
    return <Navigate to="/painel" replace />
  }

  if (requireRole === 'parceiro' && role !== 'parceiro' && role !== 'admin') {
    // Permite checar vínculo dentro da página /parceiro se autenticado
  }

  if (requireRole === 'perito' && role !== 'perito' && role !== 'admin') {
    return <Navigate to="/painel" replace />
  }

  return <>{children}</>
}
