import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import FatoresEmissaoPublicoPage from '../FatoresEmissaoPublicoPage'
import { METADADOS_CATALOGO_FATORES } from '@/services/catalogoFatoresOficiais'

describe('Página Pública /fatores (Bloco 4)', () => {
  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <FatoresEmissaoPublicoPage />
      </BrowserRouter>,
    )
  }

  it('deve renderizar o título principal, versão do catálogo e badges de vigência', () => {
    renderComponent()

    expect(screen.getByText('Catálogo Oficial de Fatores CO₂e')).not.toBeNull()
    expect(screen.getByText(METADADOS_CATALOGO_FATORES.versao)).not.toBeNull()
    expect(screen.getByText(METADADOS_CATALOGO_FATORES.dataVigencia)).not.toBeNull()
    expect(screen.getByText(/Congelamento Criptográfico/i)).not.toBeNull()
    expect(screen.getByText(/Reserva Metodológica Pré-Laudo/i)).not.toBeNull()
  })

  it('deve exibir os materiais principais de CDV e suas fontes (WorldSteel, IAI, ICA, PlasticsEurope)', () => {
    renderComponent()

    expect(screen.getAllByText(/Aço Laminado \/ Estampado/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/WorldSteel/i).length).toBeGreaterThan(0)

    expect(screen.getAllByText(/Alumínio Primário Automotivo/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/IAI/i).length).toBeGreaterThan(0)

    expect(screen.getAllByText(/Cobre \/ Bobinamentos Elétricos/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/ICA/i).length).toBeGreaterThan(0)

    expect(screen.getAllByText(/PlasticsEurope/i).length).toBeGreaterThan(0)
  })

  it('deve permitir busca interativa por texto no catálogo', () => {
    renderComponent()

    const inputBusca = screen.getByPlaceholderText(/Buscar por material/i)
    fireEvent.change(inputBusca, { target: { value: 'cobre' } })

    expect(screen.getAllByText(/Cobre \/ Bobinamentos Elétricos/i).length).toBeGreaterThan(0)
  })

  it('deve permitir expandir a tabela completa do IPCC AR6', () => {
    renderComponent()

    const btnVerTabela = screen.getByText('Ver Tabela Completa')
    fireEvent.click(btnVerTabela)

    expect(screen.getByText('Dióxido de Carbono (CO₂)')).not.toBeNull()
    expect(screen.getByText('Hexafluoreto de Enxofre (SF₆)')).not.toBeNull()
  })

  it('deve conter links para a documentação da API e verificador de selos', () => {
    renderComponent()

    const linkApi = screen.getByRole('link', { name: /Ver Documentação da API/i })
    expect(linkApi.getAttribute('href')).toBe('/api-docs-cdv')

    const linkVerificador = screen.getByRole('link', { name: /Verificar Selos & DPP/i })
    expect(linkVerificador.getAttribute('href')).toBe('/verificador')
  })
})
