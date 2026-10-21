import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'
import { RelatorioExecutivoPrintModal } from '../RelatorioExecutivoPrintModal'
import type { DadosPainelResultados } from '@/services/painelResultadosService'

describe('RelatorioExecutivoPrintModal — Visualização e Impressão A4 Executiva de 1 Página', () => {
  const mockDados: DadosPainelResultados = {
    cnpjEmpresa: '44.555.666/0001-77',
    nomeEmpresa: 'Beta Circular Soluções Ambientais',
    possuiEmpresaAssociada: true,
    periodoMeses: 3,
    kpis: {
      lotesEmColeta: 1,
      lotesValidadosConfirmados: 6,
      massaRecuperadaKg: 18200,
      massaRecuperadaToneladas: 18.2,
      co2eConfirmadoTotalKg: 40500,
      co2eConfirmadoTotalTco2e: 40.5,
      documentosAtestadosEmitidos: 6,
      documentosRelatoriosPreliminares: 1,
      pendenciasColetaEmAberto: 0,
      tendencias: {
        lotesEmColeta: {
          valorAtualMes: 1,
          valorMesAnterior: 2,
          diferencaAbsoluta: -1,
          percentualVariacao: -50,
          direcao: 'baixa',
          rotuloVariacao: '-50,0%',
        },
        lotesValidadosConfirmados: {
          valorAtualMes: 6,
          valorMesAnterior: 5,
          diferencaAbsoluta: 1,
          percentualVariacao: 20,
          direcao: 'alta',
          rotuloVariacao: '+20,0%',
        },
        massaRecuperadaKg: {
          valorAtualMes: 18200,
          valorMesAnterior: 15000,
          diferencaAbsoluta: 3200,
          percentualVariacao: 21.3,
          direcao: 'alta',
          rotuloVariacao: '+21,3%',
        },
        co2eConfirmadoTotalKg: {
          valorAtualMes: 40500,
          valorMesAnterior: 33000,
          diferencaAbsoluta: 7500,
          percentualVariacao: 22.7,
          direcao: 'alta',
          rotuloVariacao: '+22,7%',
        },
        documentosEmitidos: {
          valorAtualMes: 6,
          valorMesAnterior: 6,
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
          rotuloVariacao: 'Zero',
        },
      },
    },
    evolucaoMensal: [
      {
        mesChave: '2026-02',
        mesRotulo: 'fev/26',
        massaKg: 5000,
        co2eConfirmadoKg: 11000,
        co2eConfirmadoTco2e: 11.0,
        lotesCount: 2,
      },
      {
        mesChave: '2026-03',
        mesRotulo: 'mar/26',
        massaKg: 6200,
        co2eConfirmadoKg: 14000,
        co2eConfirmadoTco2e: 14.0,
        lotesCount: 2,
      },
      {
        mesChave: '2026-04',
        mesRotulo: 'abr/26',
        massaKg: 7000,
        co2eConfirmadoKg: 15500,
        co2eConfirmadoTco2e: 15.5,
        lotesCount: 2,
      },
    ],
    quebraPorMaterial: [
      {
        categoria: 'aco',
        nomeExibicao: 'Aço / Ferrosos',
        pesoKg: 12500,
        percentualPeso: 68.7,
        co2eConfirmadoKg: 27250,
        percentualCo2e: 67.3,
      },
      {
        categoria: 'aluminio',
        nomeExibicao: 'Alumínio',
        pesoKg: 3200,
        percentualPeso: 17.6,
        co2eConfirmadoKg: 9900,
        percentualCo2e: 24.4,
      },
      {
        categoria: 'cobre',
        nomeExibicao: 'Cobre / Fios',
        pesoKg: 1000,
        percentualPeso: 5.5,
        co2eConfirmadoKg: 1700,
        percentualCo2e: 4.2,
      },
      {
        categoria: 'polimeros',
        nomeExibicao: 'Polímeros / Plásticos',
        pesoKg: 1500,
        percentualPeso: 8.2,
        co2eConfirmadoKg: 1650,
        percentualCo2e: 4.1,
      },
    ],
    statusConformidade: {
      lotesComAtestadoAtivo: 6,
      lotesEmColeta: 1,
      lotesComPendencias: 0,
      lotesAnuladosOuRejeitados: 0,
      totalLotes: 7,
    },
    statusDossie: [
      {
        statusChave: 'em_coleta',
        rotulo: 'Em Coleta',
        quantidade: 1,
        cor: '#F59E0B',
        percentual: 14.3,
      },
      {
        statusChave: 'validado',
        rotulo: 'Validado',
        quantidade: 6,
        cor: '#3B82F6',
        percentual: 85.7,
      },
      {
        statusChave: 'confirmado',
        rotulo: 'Confirmado',
        quantidade: 6,
        cor: '#6366F1',
        percentual: 85.7,
      },
      {
        statusChave: 'atestado',
        rotulo: 'Atestado Orbis',
        quantidade: 6,
        cor: '#10B981',
        percentual: 85.7,
      },
    ],
    totalPecasRastreadas: 95,
  }

  const mockEmpresaContexto = {
    cnpj: '44.555.666/0001-77',
    nome: 'Beta Circular Soluções Ambientais',
  }

  it('não renderiza nada quando aberto=false', () => {
    const { container } = render(
      <RelatorioExecutivoPrintModal
        aberto={false}
        onClose={() => {}}
        dados={mockDados}
        periodoSelecionado={3}
        empresaContexto={mockEmpresaContexto}
      />,
    )
    expect(container.firstChild).toBeNull()
  })

  it('renderiza todos os componentes exigidos para apresentação executiva ao banco/conselho', () => {
    const originalPrint = window.print
    window.print = vi.fn()
    const handleClose = vi.fn()

    render(
      <RelatorioExecutivoPrintModal
        aberto={true}
        onClose={handleClose}
        dados={mockDados}
        periodoSelecionado={3}
        empresaContexto={mockEmpresaContexto}
      />,
    )

    // 1. Identificação corporativa e CNPJ estritamente isolado
    expect(screen.getByText('Beta Circular Soluções Ambientais')).toBeInTheDocument()
    expect(screen.getByText('44.555.666/0001-77')).toBeInTheDocument()
    expect(screen.getByText(/Período Ativo: 3 meses/i)).toBeInTheDocument()
    expect(screen.getByText(/Centro de Desmonte/i)).toBeInTheDocument()

    // 2. Os 6 KPIs com valores e tendências
    expect(screen.getByText('18,20')).toBeInTheDocument() // Toneladas de massa
    expect(screen.getByText('40,50')).toBeInTheDocument() // tCO2e confirmado
    expect(screen.getByText('+21,3%')).toBeInTheDocument() // Tendência da massa
    expect(screen.getByText('+22,7%')).toBeInTheDocument() // Tendência do CO2e

    // 3. Composição de materiais (massa & %)
    expect(screen.getByText('68,7%')).toBeInTheDocument()
    expect(screen.getByText('17,6%')).toBeInTheDocument()
    expect(screen.getByText('5,5%')).toBeInTheDocument()
    expect(screen.getByText('8,2%')).toBeInTheDocument()

    // 4. Resumo por status do dossiê com contagens e cores
    expect(screen.getByText('14,3%')).toBeInTheDocument()
    expect(screen.getAllByText('85,7%').length).toBeGreaterThanOrEqual(1)

    // 5. Gráfico e tabela de evolução mensal
    expect(screen.getByTestId('grafico-print-barras-mensais')).toBeInTheDocument()
    expect(screen.getByText('fev/26')).toBeInTheDocument()
    expect(screen.getByText('mar/26')).toBeInTheDocument()
    expect(screen.getByText('abr/26')).toBeInTheDocument()

    // 6. Rodapé com nota mandatória e menção ao Atestado Orbis
    expect(screen.getByText(/a plataforma apura o CO₂e dos lotes e/i)).toBeInTheDocument()
    expect(screen.getByText(/NÃO emite créditos de carbono/i)).toBeInTheDocument()
    expect(screen.getByText(/Atestado Orbis dMRV/i)).toBeInTheDocument()

    // 7. Regra Opção B: sem exposição de catálogo de fatores
    expect(screen.queryByText(/kgCO2e\/kg/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/Fator de Emissão/i)).not.toBeInTheDocument()

    // 8. Clique no botão de imprimir
    fireEvent.click(screen.getByTestId('btn-disparar-print'))
    expect(window.print).toHaveBeenCalledTimes(1)

    window.print = originalPrint
  })
})
