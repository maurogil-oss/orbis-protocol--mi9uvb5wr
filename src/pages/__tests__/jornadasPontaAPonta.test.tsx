import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'

import Layout from '@/components/Layout'
import Index from '@/pages/Index'
import SolucoesIndex from '@/pages/SolucoesIndex'
import TrilhasIndex from '@/pages/TrilhasIndex'
import ProtocoloIndexPage from '@/pages/ProtocoloIndexPage'
import Diagnostico from '@/pages/Diagnostico'
import RegistroPage from '@/pages/RegistroPage'
import Login from '@/pages/Login'
import PainelCliente from '@/pages/PainelCliente'
import Verificador from '@/pages/Verificador'
import AreaParceiroPage from '@/pages/AreaParceiroPage'
import AdminConsolePage from '@/pages/AdminConsolePage'
import { ConsoleGovernancaMasterTab } from '@/components/ConsoleGovernancaMasterTab'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import pb from '@/lib/pocketbase/client'
import * as adminConsoleService from '@/services/adminConsoleService'

// Mock compartilhado de autenticação
let mockAuthState: {
  user: any
  token: string
  isAuthenticated: boolean
  isLoading: boolean
  role: string
  isMaster: boolean
  isAdmin: boolean
  isAdminOrPerito: boolean
  isFinanceiroLeitor: boolean
  isFinanceiro: boolean
  isController: boolean
  isClienteAcp: boolean
  isParceiro: boolean
  isGestaoPendente: boolean
  login: ReturnType<typeof vi.fn>
  logout: ReturnType<typeof vi.fn>
  refreshAuth: ReturnType<typeof vi.fn>
}

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockAuthState,
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

// Mock de PocketBase client
vi.mock('@/lib/pocketbase/client', () => ({
  default: {
    collection: vi.fn(),
    authStore: {
      record: null,
      token: '',
      model: null,
      onChange: vi.fn(() => () => {}),
      clear: vi.fn(),
    },
    baseUrl: 'http://localhost:8090',
    send: vi.fn(),
  },
}))

describe('Rodada 6 — Teste das 5 Jornadas Ponta a Ponta (E2E)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.alert = vi.fn()
    mockAuthState = {
      user: null,
      token: '',
      isAuthenticated: false,
      isLoading: false,
      role: 'cliente',
      isMaster: false,
      isAdmin: false,
      isAdminOrPerito: false,
      isFinanceiroLeitor: false,
      isFinanceiro: false,
      isController: false,
      isClienteAcp: false,
      isParceiro: false,
      isGestaoPendente: false,
      login: vi.fn().mockResolvedValue({ success: true }),
      logout: vi.fn(),
      refreshAuth: vi.fn(),
    }
    ;(pb.authStore as any).record = null
  })

  // =========================================================================
  // JORNADA 1: Visitante
  // / → hubs (/solucoes, /trilhas, /protocolo) → /diagnostico → /registro
  // =========================================================================
  describe('Jornada 1: Visitante (Início → Hubs → Diagnóstico → Registro)', () => {
    it('percorre a esteira pública do visitante com navegação entre hubs e CTA final para /registro', async () => {
      // 1. Visitante abre a Home (/)
      const { unmount } = render(
        <MemoryRouter initialEntries={['/']}>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Index />} />
              <Route path="/solucoes" element={<SolucoesIndex />} />
              <Route path="/trilhas" element={<TrilhasIndex />} />
              <Route path="/protocolo" element={<ProtocoloIndexPage />} />
              <Route path="/diagnostico" element={<Diagnostico />} />
              <Route path="/registro" element={<RegistroPage />} />
            </Route>
          </Routes>
        </MemoryRouter>,
      )

      // Na Home: cabeçalho contém os 3 hubs, o CTA "Iniciar Diagnóstico" e link "Entrar"
      const header = screen.getByRole('banner')
      expect(header.querySelector('a[href="/solucoes"]')).not.toBeNull()
      expect(header.querySelector('a[href="/trilhas"]')).not.toBeNull()
      expect(header.querySelector('a[href="/protocolo"]')).not.toBeNull()
      expect(header.querySelector('a[href="/diagnostico"]')?.textContent).toContain(
        'Iniciar Diagnóstico',
      )

      unmount()

      // 2. Visitante navega pelos hubs: /solucoes
      const renderSolucoes = render(
        <MemoryRouter initialEntries={['/solucoes']}>
          <SolucoesIndex />
        </MemoryRouter>,
      )
      expect(screen.getByText(/Portfólio Integrado de Soluções/i)).toBeDefined()
      // Hub de Soluções exibe soluções canônicas e CTA
      expect(screen.getByText(/Bureau ACP de Conformidade/i)).toBeDefined()
      renderSolucoes.unmount()

      // 3. Visitante abre /trilhas
      const renderTrilhas = render(
        <MemoryRouter initialEntries={['/trilhas']}>
          <TrilhasIndex />
        </MemoryRouter>,
      )
      expect(screen.getByText(/Trilhas de Formação & Habilitação/i)).toBeDefined()
      renderTrilhas.unmount()

      // 4. Visitante abre /protocolo
      const renderProtocolo = render(
        <MemoryRouter initialEntries={['/protocolo']}>
          <ProtocoloIndexPage />
        </MemoryRouter>,
      )
      expect(screen.getByText(/O Protocolo Orbis/i)).toBeDefined()
      renderProtocolo.unmount()

      // 5. Visitante acessa /diagnostico
      const renderDiag = render(
        <MemoryRouter initialEntries={['/diagnostico']}>
          <Diagnostico />
        </MemoryRouter>,
      )
      expect(screen.getByText(/DIAGNÓSTICO REGULATÓRIO SBCE & DESCARBONIZAÇÃO/i)).toBeDefined()
      renderDiag.unmount()

      // 6. Visitante conclui o funil em /registro
      render(
        <MemoryRouter initialEntries={['/registro']}>
          <RegistroPage />
        </MemoryRouter>,
      )
      expect(screen.getByRole('heading', { name: /CRIAR SUA CONTA/i })).toBeDefined()
      expect(screen.getByText(/Trial de 15 Dias sem Cartão/i)).toBeDefined()
      expect(screen.getByText(/Cliente \/ Empresa/i)).toBeDefined()
    })
  })

  // =========================================================================
  // JORNADA 2: Cliente
  // login → redirect por papel → /painel com bloco "Meus Documentos" (Dossiê de Escopo 3 presente)
  // =========================================================================
  describe('Jornada 2: Cliente (Login → Redirect por Papel → /painel com "Meus Documentos" e Dossiê de Escopo 3)', () => {
    it('autentica como cliente, redireciona para /painel e visualiza bloco Meus Documentos com Dossiê de Escopo 3', async () => {
      ;(pb.authStore as any).record = {
        id: 'usr-cliente-real',
        role: 'cliente',
        email: 'diretoria@industria.com.br',
        name: 'Indústria Paranaense S.A.',
        status_aprovacao: 'aprovado',
      }
      mockAuthState.login = vi.fn().mockImplementation(async () => {
        mockAuthState.isAuthenticated = true
        mockAuthState.role = 'cliente'
        mockAuthState.user = {
          id: 'usr-cliente-real',
          email: 'diretoria@industria.com.br',
          name: 'Indústria Paranaense S.A.',
          role: 'cliente',
        }
        return { success: true }
      })

      // Mock das coleções consultadas pelo PainelCliente
      vi.mocked(pb.collection).mockImplementation((colName: string) => {
        if (colName === 'leads_diagnostico') {
          return {
            getList: vi.fn().mockResolvedValue({
              items: [
                {
                  id: 'lead-1',
                  cnpj: '76.123.456/0001-00',
                  razao_social: 'Indústria Paranaense S.A.',
                  status: 'concluido',
                  regime_tributario: 'lucro_real',
                },
              ],
              totalItems: 1,
            }),
          } as any
        }
        if (colName === 'selos') {
          return {
            getList: vi.fn().mockResolvedValue({
              items: [
                {
                  id: 'selo-1',
                  codigo_selo: 'ORB-2026-IND-001',
                  empresa: 'Indústria Paranaense S.A.',
                  cnpj: '76.123.456/0001-00',
                  status: 'ativo',
                },
              ],
              totalItems: 1,
            }),
          } as any
        }
        if (colName === 'nfe_upload') {
          return {
            getFullList: vi.fn().mockResolvedValue([
              {
                id: 'nfe-1',
                numero_nota: '157',
                serie: '1',
                valor_total_nf: 25000,
                valor_icms: 3000,
                valor_pis: 412.5,
                valor_cofins: 1900,
                qtd_itens: 4,
              },
            ]),
          } as any
        }
        if (colName === 'cdv_lotes') {
          return {
            getFullList: vi.fn().mockResolvedValue([]),
          } as any
        }
        if (colName === 'users') {
          return {
            getOne: vi.fn().mockResolvedValue({
              id: 'usr-cliente-real',
              licenca_camada: 'trial',
              trial_tipo: 'trial_15d_5notas',
              trial_notas_limite: 5,
              trial_notas_consumidas: 1,
            }),
          } as any
        }
        return {
          getList: vi.fn().mockResolvedValue({ items: [], totalItems: 0 }),
          getFullList: vi.fn().mockResolvedValue([]),
        } as any
      })

      // 1. Tela de Login com submissão
      render(
        <MemoryRouter initialEntries={['/login']}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/painel" element={<PainelCliente />} />
          </Routes>
        </MemoryRouter>,
      )

      const emailInput = screen.getByPlaceholderText(/seu\.email@empresa\.com\.br/i)
      const senhaInput = screen.getByPlaceholderText('••••••••')
      const submitBtn = screen.getByRole('button', { name: /Entrar no Sistema/i })

      fireEvent.change(emailInput, { target: { value: 'diretoria@industria.com.br' } })
      fireEvent.change(senhaInput, { target: { value: 'SenhaCliente@2026' } })
      fireEvent.click(submitBtn)

      // 2. Redirect automático pós-login para /painel
      await waitFor(() => {
        expect(screen.getByText(/MEUS DOCUMENTOS & LAUDOS dMRV/i)).toBeDefined()
      })

      // 3. Verificação do Bloco "Meus Documentos"
      expect(screen.getByText(/Hub Consolidado de Entregáveis/i)).toBeDefined()
      expect(screen.getByText(/5 documentos estruturados/i)).toBeDefined()

      // Produto central: Extrato por Nota Fiscal
      expect(screen.getByText(/Extrato por Nota Fiscal \(Pegada de Carbono\)/i)).toBeDefined()

      // Atestado Orbis com ART/RRT (termo canônico)
      expect(screen.getByText(/Atestado de Conformidade Orbis \(com ART\/RRT\)/i)).toBeDefined()

      // Dossiê de Escopo 3 deve estar PRESENTE e destacado
      expect(screen.getByText(/DOSSIÊ DE ESCOPO 3 \(INSETTING CIRCULAR\)/i)).toBeDefined()
      expect(
        screen.getByText(/Dossiê Técnico de Escopo 3 • Lastro em Notas & Peças/i),
      ).toBeDefined()
      expect(screen.getByRole('button', { name: /Abrir Dossiê de Escopo 3/i })).toBeDefined()
    })
  })

  // =========================================================================
  // JORNADA 3: Comprador
  // "Verificar Atestado" no cabeçalho → /verificador → CTA de diagnóstico pós-resultado
  // =========================================================================
  describe('Jornada 3: Comprador (Cabeçalho "Verificar Atestado" → /verificador → CTA de Diagnóstico)', () => {
    it('comprador clica em "Verificar Atestado" no cabeçalho, consulta lote/selo e visualiza CTA de diagnóstico após o resultado', async () => {
      mockAuthState.isAuthenticated = false
      mockAuthState.user = null

      const mockGetFirst = vi.fn().mockResolvedValue({
        id: 'selo-comp-1',
        codigo_selo: 'ORB-2026-VAL-999',
        empresa: 'Fornecedor Sustentável Ltda',
        cnpj: '12.345.678/0001-90',
        status: 'valido',
        data_emissao: '2026-01-15T00:00:00Z',
        data_validade: '2027-01-15T00:00:00Z',
        perito_responsavel: 'Dr. Engenheiro Pericial CREA-PR',
        art_rrt_numero: 'ART-PR-2026-78901',
        hash_laudo_sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      })
      const mockGetFullList = vi.fn().mockResolvedValue([])

      vi.mocked(pb.collection).mockReturnValue({
        getFirstListItem: mockGetFirst,
        getFullList: mockGetFullList,
      } as any)

      render(
        <MemoryRouter initialEntries={['/']}>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<div data-testid="pagina-home">Home Orbis</div>} />
              <Route path="/verificador" element={<Verificador />} />
              <Route
                path="/diagnostico"
                element={<div data-testid="pagina-diag">Diagnóstico</div>}
              />
            </Route>
          </Routes>
        </MemoryRouter>,
      )

      // 1. Link permanente e fixo no cabeçalho: "Verificar Atestado"
      const linkVerificador = screen.getByRole('link', { name: /Verificar Atestado/i })
      expect(linkVerificador).toBeDefined()
      expect(linkVerificador.getAttribute('href')).toBe('/verificador')

      fireEvent.click(linkVerificador)

      // 2. Página /verificador renderizada
      await waitFor(() => {
        expect(screen.getByText(/VERIFICADOR PÚBLICO DE LAUDOS E SELOS/i)).toBeDefined()
      })

      // 3. Comprador insere o código do atestado/selo
      const input = screen.getByPlaceholderText(/Ex\.: ORB-2024-0001/i)
      const btnVerificar = screen.getByRole('button', { name: /Verificar Selo/i })

      fireEvent.change(input, { target: { value: 'ORB-2026-VAL-999' } })
      fireEvent.click(btnVerificar)

      // 4. CTA de diagnóstico pós-resultado exibido para o comprador visitante
      await waitFor(() => {
        expect(screen.getByTestId('cta-diagnostico-verificador')).toBeDefined()
      })

      const ctaBlock = screen.getByTestId('cta-diagnostico-verificador')
      expect(ctaBlock.textContent).toContain('Seu fornecedor já comprova descarbonização')
      expect(ctaBlock.textContent).toContain('preliminar — não substitui laudo pericial')

      const linkDiagnostico = ctaBlock.querySelector('a[href="/diagnostico"]')
      expect(linkDiagnostico).not.toBeNull()
      expect(linkDiagnostico?.textContent).toContain('Iniciar diagnóstico')
    })
  })

  // =========================================================================
  // JORNADA 4: Parceiro
  // login → /parceiro → link co-branded ?ref=ORB-PAR-XXXX → /registro com origem gravada
  // =========================================================================
  describe('Jornada 4: Parceiro (Login → /parceiro → Link Co-branded ?ref=ORB-PAR-XXXX → /registro com Origem Gravada)', () => {
    it('parceiro acessa seu painel, obtém o link co-branded e o lead se registra gravando radar_ref_origem', async () => {
      // 1. Configuração da sessão do parceiro
      mockAuthState.isAuthenticated = true
      mockAuthState.role = 'parceiro'
      mockAuthState.isParceiro = true
      mockAuthState.user = {
        id: 'usr-parceiro-acp',
        name: 'Consultoria Verde Parceira',
        email: 'contato@consultoriaverde.com.br',
        role: 'parceiro',
        cliente_codigo: 'ORB-PAR-4321',
        parceiro_acesso_status: 'liberado',
      }

      const mockParceiroRecord = {
        id: 'parc-rec-4321',
        codigo_parceiro: 'ORB-PAR-4321',
        nome: 'Consultoria Verde Parceira',
        cpf_cnpj: '99.888.777/0001-66',
        contato: 'contato@consultoriaverde.com.br',
        percentual_comissao: 15,
        status: 'ativo',
        usuario: 'usr-parceiro-acp',
        documento_fiscal_validado: true,
      }

      vi.mocked(pb.collection).mockImplementation((colName: string) => {
        if (colName === 'parceiros') {
          return {
            getFirstListItem: vi.fn().mockResolvedValue(mockParceiroRecord),
          } as any
        }
        if (colName === 'comissoes') {
          return {
            getFullList: vi.fn().mockResolvedValue([]),
          } as any
        }
        if (colName === 'cobrancas') {
          return {
            getFullList: vi.fn().mockResolvedValue([]),
          } as any
        }
        return {} as any
      })

      // Renderiza /parceiro
      const renderParceiro = render(
        <MemoryRouter initialEntries={['/parceiro']}>
          <AreaParceiroPage />
        </MemoryRouter>,
      )

      await waitFor(() => {
        expect(screen.getByText('Consultoria Verde Parceira')).toBeDefined()
        expect(screen.getByText('ORB-PAR-4321')).toBeDefined()
      })

      // Link de indicação co-branded ?ref=ORB-PAR-4321 visível
      expect(screen.getByText(/\?ref=ORB-PAR-4321/i)).toBeDefined()
      expect(screen.getByText(/Cadastro \/ Trial \(\/registro\?ref=\)/i)).toBeDefined()

      renderParceiro.unmount()

      // 2. Agora o Lead clica no link co-branded /registro?ref=ORB-PAR-4321
      mockAuthState.isAuthenticated = false
      mockAuthState.user = null
      mockAuthState.role = 'cliente'
      mockAuthState.isParceiro = false

      const mockUserCreate = vi.fn().mockResolvedValue({
        id: 'novo-lead-indicado-1',
        email: 'empresa.indicada@gmail.com',
        role: 'cliente',
        status_aprovacao: 'aprovado',
      })

      vi.mocked(pb.collection).mockReturnValue({
        create: mockUserCreate,
        requestVerification: vi.fn().mockResolvedValue(true),
      } as any)

      render(
        <MemoryRouter initialEntries={['/registro?ref=ORB-PAR-4321']}>
          <RegistroPage />
        </MemoryRouter>,
      )

      // Preenche formulário de registro
      const nomeInput = screen.getByPlaceholderText(/Maria Silva ou Indústria Alfa Ltda/i)
      const emailInput = screen.getByPlaceholderText(/seu\.email@empresa\.com\.br/i)
      const senhaInputs = screen.getAllByPlaceholderText(/••••••••|Ex: SenhaForte2026/i)
      const checkboxTermo = screen.getByRole('checkbox')

      fireEvent.change(nomeInput, { target: { value: 'Empresa Indicada Ltda' } })
      fireEvent.change(emailInput, { target: { value: 'empresa.indicada@gmail.com' } })
      fireEvent.change(senhaInputs[0], { target: { value: 'SenhaForte#2026' } })
      fireEvent.change(senhaInputs[1], { target: { value: 'SenhaForte#2026' } })
      fireEvent.click(checkboxTermo)

      const submitBtn = screen.getByRole('button', { name: /Criar Conta de Cliente/i })
      fireEvent.click(submitBtn)

      // 3. Origem gravada com o ref do parceiro
      await waitFor(() => {
        expect(mockUserCreate).toHaveBeenCalledWith(
          expect.objectContaining({
            email: 'empresa.indicada@gmail.com',
            radar_ref_origem: 'ORB-PAR-4321',
            role: 'cliente',
            status_aprovacao: 'aprovado',
          }),
        )
      })
    })
  })

  // =========================================================================
  // JORNADA 5: Gestão
  // login → /admin → validação de cadastro pendente restrita ao gestor master
  // =========================================================================
  describe('Jornada 5: Gestão (Login → /admin → Validação de Cadastro Pendente Restrita ao Gestor Master)', () => {
    it('admin comum é impedido de aprovar cadastros, enquanto o gestor master valida e homologa a conta pendente', async () => {
      // 1. Caso com Admin Comum (NÃO Master)
      mockAuthState.isAuthenticated = true
      mockAuthState.role = 'admin'
      mockAuthState.isAdmin = true
      mockAuthState.isMaster = false
      mockAuthState.user = {
        id: 'usr-admin-comum',
        name: 'Operador Admin',
        email: 'admin.operacional@orbis-protocol.com',
        role: 'admin',
        status_aprovacao: 'aprovado',
      }

      const { unmount: unmountAdmin } = render(
        <MemoryRouter initialEntries={['/admin']}>
          <ConsoleGovernancaMasterTab usuarios={[]} onAtualizar={vi.fn()} />
        </MemoryRouter>,
      )

      // Admin comum recebe tela de acesso restrito ao gestor master
      expect(screen.getByText(/Acesso Restrito ao Gestor Master/i)).toBeDefined()
      expect(
        screen.getByText(
          /Esta aba é restrita exclusivamente ao papel master para governança formal/i,
        ),
      ).toBeDefined()
      expect(screen.queryByText(/Fila de Contas Gestão Pendentes/i)).toBeNull()

      unmountAdmin()

      // 2. Caso com Gestor Master
      mockAuthState.role = 'master'
      mockAuthState.isMaster = true
      mockAuthState.isAdmin = true
      mockAuthState.user = {
        id: 'usr-gestor-master',
        name: 'Mauro Gil Gestor Master',
        email: 'mauro@orbisprotocol.org',
        role: 'master',
        status_aprovacao: 'aprovado',
      }

      const mockUsuarios = [
        {
          id: 'user-gestao-aguardando',
          name: 'Candidato a Auditoria',
          email: 'candidato.gestao@empresa.com.br',
          role: 'admin',
          status_aprovacao: 'pendente',
          created: '2026-04-01T12:00:00Z',
        },
      ]

      const onAtualizarMock = vi.fn()
      const spyAprovar = vi
        .spyOn(adminConsoleService, 'aprovarRecusarContaGestaoMaster')
        .mockResolvedValue({
          sucesso: true,
          mensagem: 'Conta homologada com sucesso.',
        })

      render(
        <MemoryRouter initialEntries={['/admin?tab=governanca']}>
          <ConsoleGovernancaMasterTab usuarios={mockUsuarios} onAtualizar={onAtualizarMock} />
        </MemoryRouter>,
      )

      // Gestor Master tem acesso à Fila de Contas Gestão Pendentes
      expect(screen.getByText(/Painel de Governança Master/i)).toBeDefined()
      expect(screen.getByText(/Fila de Contas Gestão Pendentes/i)).toBeDefined()
      expect(screen.getByText('Candidato a Auditoria')).toBeDefined()
      expect(screen.getByText('candidato.gestao@empresa.com.br')).toBeDefined()

      // Ação de aprovar presente exclusivamente para o master
      const btnAprovar = screen.getByRole('button', { name: /Aprovar/i })
      fireEvent.click(btnAprovar)

      // Modal de homologação
      expect(screen.getByText(/Homologar Conta de Gestão/i)).toBeDefined()
      const btnConfirmar = screen.getByRole('button', { name: /Confirmar Decisão/i })
      fireEvent.click(btnConfirmar)

      // Confere chamada do serviço de governança com auditoria
      await waitFor(() => {
        expect(spyAprovar).toHaveBeenCalledWith(
          expect.objectContaining({
            userId: 'user-gestao-aguardando',
            decisao: 'aprovar',
            novoPapel: 'admin',
          }),
        )
      })
    })

    it('conta Gestão com status_aprovacao="pendente" é bloqueada pelo ProtectedRoute até liberação do Master', () => {
      mockAuthState.isAuthenticated = true
      mockAuthState.role = 'admin'
      mockAuthState.isMaster = false
      mockAuthState.isAdmin = true
      mockAuthState.user = {
        id: 'usr-pendente-bloqueado',
        email: 'gestor.pendente@empresa.com.br',
        role: 'admin',
        status_aprovacao: 'pendente',
      }

      render(
        <MemoryRouter initialEntries={['/admin']}>
          <ProtectedRoute requireRole="admin">
            <div data-testid="conteudo-admin-protegido">Console Administrativo Secreto</div>
          </ProtectedRoute>
        </MemoryRouter>,
      )

      // Não exibe o conteúdo protegido do console
      expect(screen.queryByTestId('conteudo-admin-protegido')).toBeNull()

      // Exibe a tela de aviso de homologação pelo gestor master
      expect(
        screen.getByRole('heading', { name: /Acesso em Análise pelo Gestor Master/i }),
      ).toBeDefined()
      expect(screen.getByText(/Perfil Gestão • Pendente de Aprovação/i)).toBeDefined()
      expect(screen.getByText(/gestor\.pendente@empresa\.com\.br/i)).toBeDefined()
    })
  })
})
