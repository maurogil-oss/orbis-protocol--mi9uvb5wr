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
      periodoMeses: 12,
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
      statusDossie: [
        {
          statusChave: 'em_coleta',
          rotulo: 'Em Coleta',
          quantidade: 0,
          cor: '#F59E0B',
          percentual: 0,
        },
        {
          statusChave: 'validado',
          rotulo: 'Validado',
          quantidade: 0,
          cor: '#3B82F6',
          percentual: 0,
        },
        {
          statusChave: 'confirmado',
          rotulo: 'Confirmado',
          quantidade: 0,
          cor: '#6366F1',
          percentual: 0,
        },
        {
          statusChave: 'atestado',
          rotulo: 'Atestado Orbis',
          quantidade: 0,
          cor: '#10B981',
          percentual: 0,
        },
      ],
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
      periodoMeses: 12,
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
        tendencias: {
          lotesEmColeta: {
            valorAtualMes: 2,
            valorMesAnterior: 1,
            diferencaAbsoluta: 1,
            percentualVariacao: 100,
            direcao: 'alta',
            rotuloVariacao: '+100,0% vs mês ant.',
          },
          lotesValidadosConfirmados: {
            valorAtualMes: 5,
            valorMesAnterior: 4,
            diferencaAbsoluta: 1,
            percentualVariacao: 25,
            direcao: 'alta',
            rotuloVariacao: '+25,0% vs mês ant.',
          },
          massaRecuperadaKg: {
            valorAtualMes: 12500,
            valorMesAnterior: 10000,
            diferencaAbsoluta: 2500,
            percentualVariacao: 25,
            direcao: 'alta',
            rotuloVariacao: '+25,0% vs mês ant.',
          },
          co2eConfirmadoTotalKg: {
            valorAtualMes: 28400,
            valorMesAnterior: 22000,
            diferencaAbsoluta: 6400,
            percentualVariacao: 29.1,
            direcao: 'alta',
            rotuloVariacao: '+29,1% vs mês ant.',
          },
          documentosEmitidos: {
            valorAtualMes: 5,
            valorMesAnterior: 5,
            diferencaAbsoluta: 0,
            percentualVariacao: 0,
            direcao: 'neutro',
            rotuloVariacao: 'Estável vs mês ant.',
          },
          pendenciasColetaEmAberto: {
            valorAtualMes: 1,
            valorMesAnterior: 2,
            diferencaAbsoluta: -1,
            percentualVariacao: -50,
            direcao: 'baixa',
            rotuloVariacao: '-50,0% vs mês ant.',
          },
        },
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
          nomeExibicao: 'Aço / Ferrosos',
          pesoKg: 8500,
          percentualPeso: 68,
          co2eConfirmadoKg: 18530,
          percentualCo2e: 65.2,
        },
        {
          categoria: 'aluminio',
          nomeExibicao: 'Alumínio',
          pesoKg: 1500,
          percentualPeso: 12,
          co2eConfirmadoKg: 6200,
          percentualCo2e: 21.8,
        },
        {
          categoria: 'cobre',
          nomeExibicao: 'Cobre / Fios',
          pesoKg: 500,
          percentualPeso: 4,
          co2eConfirmadoKg: 1200,
          percentualCo2e: 4.2,
        },
        {
          categoria: 'polimeros',
          nomeExibicao: 'Polímeros / Plásticos',
          pesoKg: 1000,
          percentualPeso: 8,
          co2eConfirmadoKg: 1400,
          percentualCo2e: 4.9,
        },
        {
          categoria: 'outros',
          nomeExibicao: 'Outros Materiais',
          pesoKg: 1000,
          percentualPeso: 8,
          co2eConfirmadoKg: 1070,
          percentualCo2e: 3.9,
        },
      ],
      statusConformidade: {
        lotesComAtestadoAtivo: 5,
        lotesEmColeta: 2,
        lotesComPendencias: 1,
        lotesAnuladosOuRejeitados: 0,
        totalLotes: 7,
      },
      statusDossie: [
        {
          statusChave: 'em_coleta',
          rotulo: 'Em Coleta',
          quantidade: 2,
          cor: '#F59E0B',
          percentual: 28.6,
        },
        {
          statusChave: 'validado',
          rotulo: 'Validado',
          quantidade: 5,
          cor: '#3B82F6',
          percentual: 71.4,
        },
        {
          statusChave: 'confirmado',
          rotulo: 'Confirmado',
          quantidade: 5,
          cor: '#6366F1',
          percentual: 71.4,
        },
        {
          statusChave: 'atestado',
          rotulo: 'Atestado Orbis',
          quantidade: 5,
          cor: '#10B981',
          percentual: 71.4,
        },
      ],
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

    // 1. Filtro de período no topo (3 / 6 / 12 meses)
    expect(screen.getByTestId('filtro-periodo-container')).toBeInTheDocument()
    expect(screen.getByTestId('filtro-periodo-3m')).toBeInTheDocument()
    expect(screen.getByTestId('filtro-periodo-6m')).toBeInTheDocument()
    expect(screen.getByTestId('filtro-periodo-12m')).toBeInTheDocument()

    // 2. KPIs renderizados com indicadores de tendência vs mês anterior
    expect(screen.getByTestId('kpi-lotes-em-coleta')).toHaveTextContent('2')
    expect(screen.getByTestId('kpi-lotes-confirmados')).toHaveTextContent('5')
    expect(screen.getByTestId('kpi-massa-recuperada')).toHaveTextContent('12.500')
    expect(screen.getByTestId('kpi-co2e-confirmado')).toHaveTextContent('28,40')
    expect(screen.getByTestId('kpi-pendencias-aberto')).toHaveTextContent('1')
    expect(screen.getAllByTestId(/tendencia-badge-/).length).toBeGreaterThanOrEqual(5)

    // 3. Gráfico de barras mensais comparativas (massa × CO₂e lado a lado)
    expect(screen.getByTestId('secao-barras-comparativas-mensais')).toBeInTheDocument()
    expect(screen.getByTestId('grafico-barras-lado-a-lado')).toBeInTheDocument()

    // 4. Gráfico de rosca (donut) colorido por material com percentuais exibidos
    expect(screen.getByTestId('secao-grafico-donut-materiais')).toBeInTheDocument()
    expect(screen.getByTestId('donut-material-aco')).toHaveTextContent('68,0%')
    expect(screen.getByTestId('donut-material-aluminio')).toHaveTextContent('12,0%')
    expect(screen.getByTestId('donut-material-cobre')).toHaveTextContent('4,0%')

    // 5. Gráfico de barras por status do dossiê (em coleta, validado, confirmado, atestado)
    expect(screen.getByTestId('secao-grafico-status-dossie')).toBeInTheDocument()
    expect(screen.getByTestId('status-dossie-em_coleta')).toBeInTheDocument()
    expect(screen.getByTestId('status-dossie-validado')).toBeInTheDocument()
    expect(screen.getByTestId('status-dossie-confirmado')).toBeInTheDocument()
    expect(screen.getByTestId('status-dossie-atestado')).toBeInTheDocument()

    // Terminologia obrigatória presente
    expect(screen.getByText(/Centro de Desmonte/i)).toBeInTheDocument()
    expect(screen.getAllByText(/validado\/confirmado/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Atestado Orbis/i).length).toBeGreaterThan(0)

    // Regra Opção B: sem coluna ou menção a catálogo de fatores na tabela
    expect(screen.queryByText(/Fator de Emissão \(kgCO2e\/kg\)/i)).not.toBeInTheDocument()

    // Nota obrigatória de que a plataforma apura o CO2e dos lotes e NÃO emite créditos
    expect(screen.getAllByText(/NÃO emite créditos de carbono/i).length).toBeGreaterThan(0)

    // Botão "Exportar PDF executivo" presente ao lado do CSV
    const btnPdf = screen.getByTestId('btn-exportar-pdf-executivo')
    expect(btnPdf).toBeInTheDocument()
    expect(btnPdf).toHaveTextContent(/Exportar PDF executivo/i)
    expect(screen.getByTestId('btn-exportar-csv')).toBeInTheDocument()
  })

  it('abre o modal de PDF executivo de 1 página A4 com dados da empresa e dispara window.print()', async () => {
    const originalPrint = window.print
    window.print = vi.fn()

    vi.mocked(AuthContextModule.useAuth).mockReturnValue({
      user: {
        id: 'usr-cliente',
        name: 'Gestor Alfa',
        cnpj: '12.345.678/0001-90',
        razao_social: 'Desmonte Alfa Ltda',
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
      periodoMeses: 6,
      kpis: {
        lotesEmColeta: 3,
        lotesValidadosConfirmados: 8,
        massaRecuperadaKg: 15400,
        massaRecuperadaToneladas: 15.4,
        co2eConfirmadoTotalKg: 33800,
        co2eConfirmadoTotalTco2e: 33.8,
        documentosAtestadosEmitidos: 8,
        documentosRelatoriosPreliminares: 2,
        pendenciasColetaEmAberto: 0,
        tendencias: {
          lotesEmColeta: {
            valorAtualMes: 3,
            valorMesAnterior: 2,
            diferencaAbsoluta: 1,
            percentualVariacao: 50,
            direcao: 'alta',
            rotuloVariacao: '+50,0%',
          },
          lotesValidadosConfirmados: {
            valorAtualMes: 8,
            valorMesAnterior: 6,
            diferencaAbsoluta: 2,
            percentualVariacao: 33.3,
            direcao: 'alta',
            rotuloVariacao: '+33,3%',
          },
          massaRecuperadaKg: {
            valorAtualMes: 15400,
            valorMesAnterior: 12000,
            diferencaAbsoluta: 3400,
            percentualVariacao: 28.3,
            direcao: 'alta',
            rotuloVariacao: '+28,3%',
          },
          co2eConfirmadoTotalKg: {
            valorAtualMes: 33800,
            valorMesAnterior: 26000,
            diferencaAbsoluta: 7800,
            percentualVariacao: 30,
            direcao: 'alta',
            rotuloVariacao: '+30,0%',
          },
          documentosEmitidos: {
            valorAtualMes: 8,
            valorMesAnterior: 8,
            diferencaAbsoluta: 0,
            percentualVariacao: 0,
            direcao: 'neutro',
            rotuloVariacao: 'Estável',
          },
          pendenciasColetaEmAberto: {
            valorAtualMes: 0,
            valorMesAnterior: 0,
            diferencaAbsoluta: 0,
            percentualVariacao: 0,
            direcao: 'neutro',
            rotuloVariacao: '0',
          },
        },
      },
      evolucaoMensal: [
        {
          mesChave: '2026-03',
          mesRotulo: 'mar/26',
          massaKg: 7000,
          co2eConfirmadoKg: 15000,
          co2eConfirmadoTco2e: 15.0,
          lotesCount: 4,
        },
        {
          mesChave: '2026-04',
          mesRotulo: 'abr/26',
          massaKg: 8400,
          co2eConfirmadoKg: 18800,
          co2eConfirmadoTco2e: 18.8,
          lotesCount: 4,
        },
      ],
      quebraPorMaterial: [
        {
          categoria: 'aco',
          nomeExibicao: 'Aço / Ferrosos',
          pesoKg: 11000,
          percentualPeso: 71.4,
          co2eConfirmadoKg: 23980,
          percentualCo2e: 70.9,
        },
        {
          categoria: 'aluminio',
          nomeExibicao: 'Alumínio',
          pesoKg: 2400,
          percentualPeso: 15.6,
          co2eConfirmadoKg: 7420,
          percentualCo2e: 22.0,
        },
        {
          categoria: 'cobre',
          nomeExibicao: 'Cobre / Fios',
          pesoKg: 1000,
          percentualPeso: 6.5,
          co2eConfirmadoKg: 1400,
          percentualCo2e: 4.1,
        },
        {
          categoria: 'polimeros',
          nomeExibicao: 'Polímeros / Plásticos',
          pesoKg: 1000,
          percentualPeso: 6.5,
          co2eConfirmadoKg: 1000,
          percentualCo2e: 3.0,
        },
      ],
      statusConformidade: {
        lotesComAtestadoAtivo: 8,
        lotesEmColeta: 3,
        lotesComPendencias: 0,
        lotesAnuladosOuRejeitados: 0,
        totalLotes: 11,
      },
      statusDossie: [
        {
          statusChave: 'em_coleta',
          rotulo: 'Em Coleta',
          quantidade: 3,
          cor: '#F59E0B',
          percentual: 27.3,
        },
        {
          statusChave: 'validado',
          rotulo: 'Validado',
          quantidade: 8,
          cor: '#3B82F6',
          percentual: 72.7,
        },
        {
          statusChave: 'confirmado',
          rotulo: 'Confirmado',
          quantidade: 8,
          cor: '#6366F1',
          percentual: 72.7,
        },
        {
          statusChave: 'atestado',
          rotulo: 'Atestado Orbis',
          quantidade: 8,
          cor: '#10B981',
          percentual: 72.7,
        },
      ],
      totalPecasRastreadas: 120,
    })

    render(
      <MemoryRouter>
        <PainelResultadosPage />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('btn-exportar-pdf-executivo')).toBeInTheDocument()
    })

    // Clica no botão para abrir a pré-visualização do PDF executivo
    fireEvent.click(screen.getByTestId('btn-exportar-pdf-executivo'))

    expect(screen.getByTestId('modal-pdf-executivo')).toBeInTheDocument()
    expect(screen.getByTestId('folha-a4-executiva')).toBeInTheDocument()

    // Valida elementos do PDF executivo:
    // 1. Cabeçalho com identificação da empresa (CNPJ e Razão Social) e período
    expect(screen.getAllByText('12.345.678/0001-90').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Desmonte Alfa Ltda').length).toBeGreaterThan(0)
    expect(screen.getByText(/Painel Executivo de Descarbonização/i)).toBeInTheDocument()

    // 2. Os 6 KPIs com valores
    expect(screen.getAllByText('15,40').length).toBeGreaterThan(0) // Massa em toneladas
    expect(screen.getAllByText('33,80').length).toBeGreaterThan(0) // CO2e em tCO2e

    // 3. Rosca por material e percentuais
    expect(screen.getByText('71,4%')).toBeInTheDocument()
    expect(screen.getByText('15,6%')).toBeInTheDocument()

    // 4. Resumo por status do dossiê com contagem e percentual
    expect(screen.getByText(/Resumo por Status do Dossiê dos Lotes/i)).toBeInTheDocument()
    expect(screen.getByText('27,3%')).toBeInTheDocument()
    expect(screen.getAllByText('72,7%').length).toBeGreaterThanOrEqual(1)

    // 5. Gráfico mensal / tabela de evolução mensal
    expect(screen.getByTestId('grafico-print-barras-mensais')).toBeInTheDocument()

    // 6. Rodapé mandatório com aviso e menção ao Atestado Orbis
    expect(screen.getAllByText(/a plataforma apura o CO₂e dos lotes e/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/NÃO emite créditos de carbono/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Atestado Orbis dMRV/i).length).toBeGreaterThan(0)

    // 7. Regra Opção B: sem fatores expostos
    expect(screen.queryByText(/Fator de Emissão \(kgCO2e\/kg\)/i)).not.toBeInTheDocument()

    // 8. Disparo do print
    const btnDispararPrint = screen.getByTestId('btn-disparar-print')
    fireEvent.click(btnDispararPrint)
    expect(window.print).toHaveBeenCalledTimes(1)

    window.print = originalPrint
  })
})
