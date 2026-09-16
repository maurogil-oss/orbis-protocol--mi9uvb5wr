/* Main App Component - Handles routing (using react-router-dom), query client and other providers */
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AuthProvider } from '@/contexts/AuthContext'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import Layout from './components/Layout'

// Pages
import Index from './pages/Index'
import Diagnostico from './pages/Diagnostico'
import TrilhasIndex from './pages/TrilhasIndex'
import TrilhaDetail from './pages/TrilhaDetail'
import SolucoesIndex from './pages/SolucoesIndex'
import BureauACP from './pages/BureauACP'
import PortalCorporativo from './pages/PortalCorporativo'
import CaseCDVerde from './pages/CaseCDVerde'
import CadeiasProdutivasPage from './pages/CadeiasProdutivasPage'
import ProtocoloDetailPage from './pages/ProtocoloDetailPage'
import CredenciamentoPage from './pages/CredenciamentoPage'
import Financeiro from './pages/Financeiro'
import Verificador from './pages/Verificador'
import Login from './pages/Login'
import PainelCliente from './pages/PainelCliente'
import ConsoleAuditor from './pages/ConsoleAuditor'
import TestCatalog from './pages/TestCatalog'
import Privacidade from './pages/Privacidade'
import Planos from './pages/Planos'
import Capital from './pages/Capital'
import RadarRegulatorio from './pages/RadarRegulatorio'
import PassaportePublicoPage from './pages/PassaportePublicoPage'
import PassaporteFornecedorPublicoPage from './pages/PassaporteFornecedorPublicoPage'
import CanalTitularPage from './pages/CanalTitularPage'
import CheckoutPage from './pages/CheckoutPage'
import NotFound from './pages/NotFound'

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Routes>
          <Route element={<Layout />}>
            {/* Public Routes */}
            <Route path="/" element={<Index />} />
            <Route path="/radar-regulatorio" element={<RadarRegulatorio />} />
            <Route path="/diagnostico" element={<Diagnostico />} />
            <Route path="/trilhas" element={<TrilhasIndex />} />
            <Route path="/trilhas/:slug" element={<TrilhaDetail />} />
            <Route path="/solucoes" element={<SolucoesIndex />} />
            <Route path="/solucoes/bureau-acp" element={<BureauACP />} />
            <Route path="/bureau" element={<BureauACP />} />
            <Route path="/solucoes/portal-corporativo" element={<PortalCorporativo />} />
            <Route path="/solucoes/case-cdverde" element={<CaseCDVerde />} />
            <Route path="/solucoes/cadeias-produtivas" element={<CadeiasProdutivasPage />} />
            <Route path="/protocolos/:slug" element={<ProtocoloDetailPage />} />
            <Route path="/credenciamento" element={<CredenciamentoPage />} />
            <Route path="/verificador" element={<Verificador />} />
            <Route path="/passaporte/:selo" element={<PassaportePublicoPage />} />
            <Route
              path="/passaporte-fornecedor/:token"
              element={<PassaporteFornecedorPublicoPage />}
            />
            <Route path="/titular-dados" element={<CanalTitularPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/checkout/:cobrancaId" element={<CheckoutPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/teste" element={<TestCatalog />} />
            <Route path="/privacidade" element={<Privacidade />} />
            <Route path="/planos" element={<Planos />} />

            {/* Protected Routes (Require Authentication) */}
            <Route
              path="/capital"
              element={
                <ProtectedRoute>
                  <Capital />
                </ProtectedRoute>
              }
            />
            <Route
              path="/financeiro"
              element={
                <ProtectedRoute>
                  <Financeiro />
                </ProtectedRoute>
              }
            />
            <Route
              path="/painel"
              element={
                <ProtectedRoute>
                  <PainelCliente />
                </ProtectedRoute>
              }
            />
            <Route
              path="/console-do-auditor"
              element={
                <ProtectedRoute requireRole="adminOrPerito">
                  <ConsoleAuditor />
                </ProtectedRoute>
              }
            />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </TooltipProvider>
    </AuthProvider>
  </BrowserRouter>
)

export default App
