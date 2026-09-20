import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import RegistroPage from '@/pages/RegistroPage'
import AreaParceiroPage from '@/pages/AreaParceiroPage'
import { atualizarStatusAcessoParceiro } from '@/services/parceirosService'
import pb from '@/lib/pocketbase/client'

// Mock do AuthContext
let mockAuthState = {
  user: null as any,
  token: '',
  isAuthenticated: false,
  isLoading: false,
  role: 'cliente',
  isAdminOrPerito: false,
  isFinanceiroLeitor: false,
  isClienteAcp: false,
  isParceiro: false,
  isAdmin: false,
  login: vi.fn(),
  logout: vi.fn(),
  refreshAuth: vi.fn(),
}

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockAuthState,
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

// Mock do PocketBase SDK
vi.mock('@/lib/pocketbase/client', () => {
  return {
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
  }
})

describe('Pacote: Acesso do parceiro ao próprio painel financeiro', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuthState = {
      user: null,
      token: '',
      isAuthenticated: false,
      isLoading: false,
      role: 'cliente',
      isAdminOrPerito: false,
      isFinanceiroLeitor: false,
      isClienteAcp: false,
      isParceiro: false,
      isAdmin: false,
      login: vi.fn().mockResolvedValue({ success: true }),
      logout: vi.fn(),
      refreshAuth: vi.fn(),
    }
  })

  // 1. Registro como Parceiro gera role 'parceiro' e parceiro_acesso_status='pendente'
  it('registro como Parceiro gera payload com role="parceiro" e parceiro_acesso_status="pendente"', async () => {
    const mockCreate = vi.fn().mockResolvedValue({
      id: 'parceiro-usr-1',
      cliente_codigo: 'ORB-PAR-1234',
      role: 'parceiro',
      parceiro_acesso_status: 'pendente',
    })

    vi.mocked(pb.collection).mockReturnValue({
      create: mockCreate,
    } as any)

    render(
      <MemoryRouter initialEntries={['/registro?papel=parceiro']}>
        <RegistroPage />
      </MemoryRouter>,
    )

    // Preenche campos
    const nomeInput = screen.getByPlaceholderText(/Consultoria Verde/i)
    const emailInput = screen.getByPlaceholderText(/seu\.email@empresa\.com\.br/i)
    const senhas = screen.getAllByPlaceholderText(/••••••••/i)
    const checkboxTermo = screen.getByRole('checkbox')

    fireEvent.change(nomeInput, { target: { value: 'EcoParceiro Consultoria' } })
    fireEvent.change(emailInput, { target: { value: 'contato@ecoparceiro.com.br' } })
    fireEvent.change(senhas[0], { target: { value: 'SenhaParceiro2026' } })
    fireEvent.change(senhas[1], { target: { value: 'SenhaParceiro2026' } })
    fireEvent.click(checkboxTermo)

    const submitBtn = screen.getByRole('button', { name: /Criar Conta de Parceiro/i })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledWith({
        email: 'contato@ecoparceiro.com.br',
        password: 'SenhaParceiro2026',
        passwordConfirm: 'SenhaParceiro2026',
        name: 'EcoParceiro Consultoria',
        role: 'parceiro',
        parceiro_acesso_status: 'pendente',
      })
      expect(mockAuthState.login).toHaveBeenCalledWith(
        'contato@ecoparceiro.com.br',
        'SenhaParceiro2026',
      )
    })
  })

  // 2. Parceiro pendente ou suspenso não vê dados financeiros — vê APENAS aviso "Cadastro em homologação pela controladoria"
  it('parceiro com status pendente vê APENAS o aviso de homologação e nenhum dado financeiro da casa', async () => {
    mockAuthState.isAuthenticated = true
    mockAuthState.role = 'parceiro'
    mockAuthState.isParceiro = true
    mockAuthState.user = {
      id: 'parceiro-usr-2',
      name: 'Parceiro Em Análise',
      email: 'analise@parceiro.com.br',
      role: 'parceiro',
      cliente_codigo: 'ORB-PAR-5566',
      parceiro_acesso_status: 'pendente',
    }

    render(
      <MemoryRouter initialEntries={['/parceiro-painel']}>
        <AreaParceiroPage />
      </MemoryRouter>,
    )

    // Deve exibir o aviso de homologação
    expect(
      screen.getByRole('heading', { name: /Cadastro em homologação pela controladoria/i }),
    ).toBeDefined()
    expect(screen.getByText('ORB-PAR-5566')).toBeDefined()
    expect(screen.getByText(/Pendente de Aprovação/i)).toBeDefined()

    // NÃO deve exibir métricas financeiras, saldo, extrato nem dados de comissão
    expect(screen.queryByText(/Saldo a Receber/i)).toBeNull()
    expect(screen.queryByText(/Total Repassado/i)).toBeNull()
    expect(screen.queryByText(/Extrato de Comissões & Repasses/i)).toBeNull()
    expect(screen.queryByText(/Vendas Indicadas/i)).toBeNull()
  })

  it('parceiro com status suspenso também é bloqueado e vê aviso com status Suspenso', async () => {
    mockAuthState.isAuthenticated = true
    mockAuthState.role = 'parceiro'
    mockAuthState.isParceiro = true
    mockAuthState.user = {
      id: 'parceiro-usr-3',
      name: 'Parceiro Suspenso',
      email: 'suspenso@parceiro.com.br',
      role: 'parceiro',
      cliente_codigo: 'ORB-PAR-9988',
      parceiro_acesso_status: 'suspenso',
    }

    render(
      <MemoryRouter initialEntries={['/parceiro-painel']}>
        <AreaParceiroPage />
      </MemoryRouter>,
    )

    expect(
      screen.getByRole('heading', { name: /Cadastro em homologação pela controladoria/i }),
    ).toBeDefined()
    expect(screen.getByText(/Suspenso/i)).toBeDefined()
    expect(screen.queryByText(/Saldo a Receber/i)).toBeNull()
  })

  // 3. Parceiro liberado vê SOMENTE as próprias comissões e dados
  it('parceiro liberado vê somente as próprias comissões (saldo, snapshot de percentual, status fiscal)', async () => {
    mockAuthState.isAuthenticated = true
    mockAuthState.role = 'parceiro'
    mockAuthState.isParceiro = true
    mockAuthState.user = {
      id: 'parceiro-usr-4',
      name: 'Parceiro Liberado VIP',
      email: 'vip@parceiro.com.br',
      role: 'parceiro',
      cliente_codigo: 'ORB-PAR-7777',
      parceiro_acesso_status: 'liberado',
    }

    // Mock das chamadas do PocketBase para o parceiro logado
    const mockParceiroRecord = {
      id: 'rec-parc-777',
      codigo_parceiro: 'ORB-PAR-7777',
      nome: 'Parceiro Liberado VIP',
      cpf_cnpj: '12.345.678/0001-90',
      contato: 'vip@parceiro.com.br',
      percentual_comissao: 15,
      banco: '341 - Itaú',
      agencia: '1234',
      conta: '56789-0',
      chave_pix: '12.345.678/0001-90',
      status: 'ativo',
      usuario: 'parceiro-usr-4',
      tipo_documentacao: 'NFSe_pj',
      documento_fiscal_url: 'https://docs.orbisprotocol.org/nfse-777.pdf',
      documento_fiscal_validado: true,
      created: '2026-03-01T00:00:00Z',
      updated: '2026-03-01T00:00:00Z',
    }

    const mockMinhasComissoes = [
      {
        id: 'com-1',
        cobranca_id: 'cob-100',
        parceiro_id: 'rec-parc-777',
        base_calculo: 5000,
        percentual_aplicado: 15,
        valor: 750,
        status: 'calculada',
        created: '2026-03-10T00:00:00Z',
      },
      {
        id: 'com-2',
        cobranca_id: 'cob-101',
        parceiro_id: 'rec-parc-777',
        base_calculo: 10000,
        percentual_aplicado: 15,
        valor: 1500,
        status: 'paga',
        data_pagamento: '2026-03-15T00:00:00Z',
        comprovante: 'PIX-E2E-20260315-777',
        created: '2026-03-11T00:00:00Z',
      },
    ]

    const mockVendas = [
      {
        id: 'cob-100',
        tomador_nome: 'Cliente Alpha Ltda',
        tomador_cpf_cnpj: '00.111.222/0001-33',
        servico_nome: 'Laudo Pericial dMRV',
        valor: 5000,
        status: 'pago',
        created: '2026-03-10T00:00:00Z',
      },
    ]

    vi.mocked(pb.collection).mockImplementation((colName: string) => {
      if (colName === 'parceiros') {
        return {
          getFirstListItem: vi.fn().mockResolvedValue(mockParceiroRecord),
          update: vi.fn().mockResolvedValue(mockParceiroRecord),
        } as any
      }
      if (colName === 'comissoes') {
        return {
          getFullList: vi.fn().mockResolvedValue(mockMinhasComissoes),
        } as any
      }
      if (colName === 'cobrancas') {
        return {
          getFullList: vi.fn().mockResolvedValue(mockVendas),
        } as any
      }
      return {} as any
    })

    render(
      <MemoryRouter initialEntries={['/parceiro-painel']}>
        <AreaParceiroPage />
      </MemoryRouter>,
    )

    // Aguarda carregar dados
    await waitFor(() => {
      expect(screen.getByText('Parceiro Liberado VIP')).toBeDefined()
      expect(screen.getByText('ORB-PAR-7777')).toBeDefined()
    })

    // Deve exibir saldo a receber e total repassado
    expect(screen.getByText('Saldo a Receber')).toBeDefined()
    expect(screen.getByText('Total Repassado')).toBeDefined()

    // Valores calculados: R$ 750,00 a receber e R$ 1.500,00 repassado
    expect(screen.getByText(/750,00/)).toBeDefined()
    expect(screen.getByText(/1\.500,00/)).toBeDefined()

    // Percentual snapshot congelado: 15%
    expect(screen.getAllByText(/15%/).length).toBeGreaterThanOrEqual(1)

    // Status fiscal validado
    expect(screen.getByText(/Homologado pela Controladoria/i)).toBeDefined()

    // Comprovante de repasse visível
    expect(screen.getByText('PIX-E2E-20260315-777')).toBeDefined()
  })

  // 4. Teste de permissão: admin/financeiro liberam/suspendem acesso de parceiro com auditoria
  it('serviço atualizarStatusAcessoParceiro envia POST para /backend/v1/admin/parceiro-acesso', async () => {
    vi.mocked(pb.send).mockResolvedValue({
      sucesso: true,
      novo_status: 'liberado',
      mensagem: 'Acesso do parceiro atualizado com sucesso.',
    })

    const res = await atualizarStatusAcessoParceiro(
      'user-target-123',
      'liberado',
      'Aprovado pelo CFO',
    )

    expect(pb.send).toHaveBeenCalledWith('/backend/v1/admin/parceiro-acesso', {
      method: 'POST',
      body: {
        user_id: 'user-target-123',
        status: 'liberado',
        motivo: 'Aprovado pelo CFO',
      },
    })
    expect(res.sucesso).toBe(true)
    expect(res.novo_status).toBe('liberado')
  })
})
