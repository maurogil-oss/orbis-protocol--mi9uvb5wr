import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import React from 'react'
import { MemoryRouter } from 'react-router-dom'
import PainelResultadosPage from '../PainelResultadosPage'
import * as AuthContextModule from '@/contexts/AuthContext'
import * as painelService from '@/services/painelResultadosService'

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}))

vi.mock('@/services/painelResultadosService', async () => {
  const actual = await vi.importActual<any>('@/services/painelResultadosService')
  return {
    ...actual,
    carregarDadosPainelResultadosEmpresa: vi.fn(),
  }
})

describe('PainelResultadosPage — Componente e Comportamento', () => {
  const mockCarregarDados = vi.mocked(painelService.carregarDadosPainelResultadosEmpresa)

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renderiza o estado vazio seguro quando o usuário não possui empresa vinculada', async () => {
    vi.mocked(AuthContextModule.useAuth).mockReturnValue({
      user: { id: 'usr-perito', name: 'Dr. Perito Externo', email: 'perito@orbis.test' } as any,
      role: 'perito',
      token: 'fake-token',
      isAuthenticated: true,
      isLoading: false,
      isMaster: false,
      isAdmin: false,
      isFinanceiro: false,
      isFinanceiroLeitor: false,
      isController: false,
      isClienteAcp: false,
      isParceiro: false,
      isAdminOrPerito: true,
      isGestaoPendente: false,
      login: vi.fn(),
      logout: vi.fn(),
      refreshAuth: vi.fn(),
      requestPasswordReset: vi.fn(),
      confirmPasswordReset: vi.fn(),
      requestVerification: vi.fn(),
      confirmVerification: vi.fn(),
    })

    mockCarregarDados.mockResolvedValue({
      cnpjEmpresa: '',
      nomeEmpresa: 'Perito Externo Sem CNPJ',
      possuiEmpresaAssociada: false,
      kpis: {
        lotesEmColeta: 0,
        lotesValidadosConfirmados: 0,
        massaRecuperadaKg: 0,
        massaRecuperadaToneladas: 0,
        co2eConfirmadoTotalKg: 0,
        co2eConfirmadoTotalTco2e: 0,
        documentosAtestadosEmitidos: 0,
        documentosRelatoriosPreliminares: 0,
        pendenciasColetaEmAberto: 0,
      },
      evolucaoMensal: [],
      quebraPorMaterial: [],
      statusConformidade: {
        lotesComAtestadoAtivo: 0,
        lotesEmColeta: 0,
        lotesComPendencias: 0,
        lotesAnuladosOuRejeitados: 0,
        totalLotes: 0,
      },
      totalPecasRastreadas: 0,
    })

    render(
      <MemoryRouter>
        <PainelResultadosPage />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('estado-vazio-sem-empresa')).toBeInTheDocument()
    })

    expect(
      screen.getByText(/Privacidade Absoluta • Nenhuma Empresa Associada ao Usuário/i),
    ).toBeInTheDocument()
    expect(screen.queryByTestId('kpi-massa-recuperada')).not.toBeInTheDocument()
  })

  it('renderiza KPIs executivos, quebra por material e evolução quando usuário possui empresa associada', async () => {
    vi.mocked(AuthContextModule.useAuth).mockReturnValue({
      user: {
        id: 'usr-cliente',
        name: 'Gestor Alfa',
        email: 'gestor@desmonte.test',
        cnpj: '12.345.678/0001-90',
        empresa_nome: 'Desmonte Alfa Ltda',
      } as any,
      role: 'cliente',
      token: 'fake-token',
      isAuthenticated: true,
      isLoading: false,
      isMaster: false,
      isAdmin: false,
      isFinanceiro: false,
      isFinanceiroLeitor: false,
      isController: false,
      isClienteAcp: false,
      isParceiro: false,
      isAdminOrPerito: false,
      isGestaoPendente: false,
      login: vi.fn(),
      logout: vi.fn(),
      refreshAuth: vi.fn(),
      requestPasswordReset: vi.fn(),
      confirmPasswordReset: vi.fn(),
      requestVerification: vi.fn(),
      confirmVerification: vi.fn(),
    })

    mockCarregarDados.mockResolvedValue({
      cnpjEmpresa: '12.345.678/0001-90',
      nomeEmpresa: 'Desmonte Alfa Ltda',
      possuiEmpresaAssociada: true,
      kpis: {
        lotesEmColeta: 2,
        lotesValidadosConfirmados: 5,
        massaRecuperadaKg: 12500,
        massaRecuperadaToneladas: 12.5,
        co2eConfirmadoTotalKg: 28400,
        co2eConfirmadoTotalTco2e: 28.4,
        documentosAtestadosEmitidos: 5,
        documentosRelatoriosPreliminares: 3,
        pendenciasColetaEmAberto: 1,
      },
      evolucaoMensal: [
        {
          mesChave: '2026-04',
          mesRotulo: 'abr/26',
          massaKg: 12500,
          co2eConfirmadoKg: 28400,
          co2eConfirmadoTco2e: 28.4,
          lotesCount: 5,
        },
      ],
      quebraPorMaterial: [
        {
          categoria: 'aco',
          nomeExibicao: 'Aço Estrutural / Laminado',
          pesoKg: 8500,
          percentualPeso: 68,
          co2eConfirmadoKg: 18530,
          percentualCo2e: 65.2,
        },
        {
          categoria: 'aluminio',
          nomeExibicao: 'Alumínio Automotivo',
          pesoKg: 1500,
          percentualPeso: 12,
          co2eConfirmadoKg: 6200,
          percentualCo2e: 21.8,
        },
      ],
      statusConformidade: {
        lotesComAtestadoAtivo: 5,
        lotesEmColeta: 2,
        lotesComPendencias: 1,
        lotesAnuladosOuRejeitados: 0,
        totalLotes: 7,
      },
      totalPecasRastreadas: 84,
    })

    render(
      <MemoryRouter>
        <PainelResultadosPage />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('kpi-lotes-confirmados')).toBeInTheDocument()
    })

    // KPIs renderizados
    expect(screen.getByTestId('kpi-lotes-em-coleta')).toHaveTextContent('2')
    expect(screen.getByTestId('kpi-lotes-confirmados')).toHaveTextContent('5')
    expect(screen.getByTestId('kpi-massa-recuperada')).toHaveTextContent('12.500')
    expect(screen.getByTestId('kpi-co2e-confirmado')).toHaveTextContent('28,40')
    expect(screen.getByTestId('kpi-pendencias-aberto')).toHaveTextContent('1')

    // Terminologia obrigatória presente
    expect(screen.getByText(/Centro de Desmonte/i)).toBeInTheDocument()
    expect(screen.getAllByText(/validado\/confirmado/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Atestado Orbis/i).length).toBeGreaterThan(0)

    // Quebra por material sem fatores
    expect(screen.getByTestId('secao-distribuicao-materiais')).toBeInTheDocument()
    expect(screen.getByText('Aço Estrutural / Laminado')).toBeInTheDocument()

    // Regra Opção B: sem coluna ou menção a catálogo de fatores na tabela
    expect(screen.queryByText(/Fator de Emissão \(kgCO2e\/kg\)/i)).not.toBeInTheDocument()

    // Status de conformidade
    expect(screen.getByTestId('secao-status-conformidade')).toBeInTheDocument()
  })
})
