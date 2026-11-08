/**
 * painelAcpIndicadoresAgregados.test.tsx
 * Teste do componente de Indicadores Agregados e da página /painel-acp (Peça 4d)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import PainelAcpPage from '../PainelAcpPage'
import * as acpIndicadoresService from '@/services/acpIndicadoresService'

// Mock do hook useAuth com papel admin_acp
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: 'usr_admin_acp_1',
      email: 'gestao@acp.org.br',
      role: 'admin_acp',
      name: 'Gestor ACP',
    },
    logout: vi.fn(),
  }),
}))

describe('PainelAcpPage - Seção de Indicadores Agregados (Peça 4d)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.print = vi.fn()
  })

  it('1. exibe estado vazio honesto "em estruturação" quando não há dados na base', async () => {
    vi.spyOn(acpIndicadoresService, 'obterIndicadoresAgregadosAcp').mockResolvedValueOnce({
      totalEmpresasAtivas: 0,
      totalLotesNotas: 0,
      totalItensApurados: 0,
      totalItensCalculados: 0,
      totalItensNaoCalculados: 0,
      emissoesTotaisTco2e: null,
      emissoesEvitadasTco2e: null,
      protecaoAntiDeducaoAtiva: false,
      semDados: true,
      calculadoEm: new Date().toISOString(),
    })

    render(
      <MemoryRouter initialEntries={['/painel-acp']}>
        <Routes>
          <Route path="/painel-acp" element={<PainelAcpPage />} />
        </Routes>
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(
        screen.getByText(/INDICADORES AGREGADOS DAS EMPRESAS PARTICIPANTES/i),
      ).toBeInTheDocument()
      expect(screen.getByText(/Indicadores da Carteira em Estruturação/i)).toBeInTheDocument()
      expect(
        screen.getByText(/Ainda não há notas fiscais ou lotes dMRV apurados/i),
      ).toBeInTheDocument()
      expect(screen.getByText(/0 empresa\(s\) vinculada\(s\)/i)).toBeInTheDocument()
    })
  })

  it('2. exibe cards e tabela agregada anonimizada quando há dados com k-anonimato >= 3', async () => {
    vi.spyOn(acpIndicadoresService, 'obterIndicadoresAgregadosAcp').mockResolvedValueOnce({
      totalEmpresasAtivas: 5,
      totalLotesNotas: 20,
      totalItensApurados: 150,
      totalItensCalculados: 130,
      totalItensNaoCalculados: 20,
      emissoesTotaisTco2e: 78.432,
      emissoesEvitadasTco2e: 12.5,
      protecaoAntiDeducaoAtiva: false,
      semDados: false,
      calculadoEm: new Date().toISOString(),
    })

    render(
      <MemoryRouter initialEntries={['/painel-acp']}>
        <Routes>
          <Route path="/painel-acp" element={<PainelAcpPage />} />
        </Routes>
      </MemoryRouter>,
    )

    await waitFor(() => {
      // Cards principais
      expect(screen.getByText('5')).toBeInTheDocument()
      expect(screen.getByText('20')).toBeInTheDocument()
      expect(screen.getByText('150')).toBeInTheDocument()
      expect(screen.getByText(/130 calc\./i)).toBeInTheDocument()
      expect(screen.getByText(/20 não calc\./i)).toBeInTheDocument()
      expect(screen.getByText(/78,432/i)).toBeInTheDocument()
      expect(screen.getByText(/ESTIMATIVA • dMRV/i)).toBeInTheDocument()

      // Tabela agregada
      expect(screen.getByText(/Balanço Agregado e Anonimizado da Carteira/i)).toBeInTheDocument()
      expect(
        screen.getByText(
          /Nenhum dado pessoal, CNPJ ou razão social de empresa individual é listado/i,
        ),
      ).toBeInTheDocument()
    })
  })

  it('3. oculta emissões e exibe aviso de sigilo quando há menos de 3 empresas ativas (< 3)', async () => {
    vi.spyOn(acpIndicadoresService, 'obterIndicadoresAgregadosAcp').mockResolvedValueOnce({
      totalEmpresasAtivas: 2,
      totalLotesNotas: 6,
      totalItensApurados: 40,
      totalItensCalculados: 35,
      totalItensNaoCalculados: 5,
      emissoesTotaisTco2e: null,
      emissoesEvitadasTco2e: null,
      protecaoAntiDeducaoAtiva: true,
      semDados: false,
      calculadoEm: new Date().toISOString(),
    })

    render(
      <MemoryRouter initialEntries={['/painel-acp']}>
        <Routes>
          <Route path="/painel-acp" element={<PainelAcpPage />} />
        </Routes>
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(
        screen.getByText(/Blindagem de Sigilo: Anti-Reidentificação por Dedução Ativa/i),
      ).toBeInTheDocument()
      expect(screen.getByText(/Sob Sigilo \(< 3 emp\.\)/i)).toBeInTheDocument()
      expect(screen.getByText(/\[Omitido - Anti-dedução\]/i)).toBeInTheDocument()
    })
  })

  it('4. dispara window.print() ao clicar no botão "Exportar PDF"', async () => {
    vi.spyOn(acpIndicadoresService, 'obterIndicadoresAgregadosAcp').mockResolvedValueOnce({
      totalEmpresasAtivas: 4,
      totalLotesNotas: 10,
      totalItensApurados: 80,
      totalItensCalculados: 70,
      totalItensNaoCalculados: 10,
      emissoesTotaisTco2e: 25.1,
      emissoesEvitadasTco2e: 0,
      protecaoAntiDeducaoAtiva: false,
      semDados: false,
      calculadoEm: new Date().toISOString(),
    })

    render(
      <MemoryRouter initialEntries={['/painel-acp']}>
        <Routes>
          <Route path="/painel-acp" element={<PainelAcpPage />} />
        </Routes>
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Exportar PDF/i })).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: /Exportar PDF/i }))
    expect(window.print).toHaveBeenCalledTimes(1)
  })

  it('5. dispara geração de CSV ao clicar no botão "Exportar CSV"', async () => {
    const spyCsv = vi.spyOn(acpIndicadoresService, 'baixarArquivoCsv').mockImplementation(() => {})

    vi.spyOn(acpIndicadoresService, 'obterIndicadoresAgregadosAcp').mockResolvedValueOnce({
      totalEmpresasAtivas: 4,
      totalLotesNotas: 10,
      totalItensApurados: 80,
      totalItensCalculados: 70,
      totalItensNaoCalculados: 10,
      emissoesTotaisTco2e: 25.1,
      emissoesEvitadasTco2e: 0,
      protecaoAntiDeducaoAtiva: false,
      semDados: false,
      calculadoEm: new Date().toISOString(),
    })

    render(
      <MemoryRouter initialEntries={['/painel-acp']}>
        <Routes>
          <Route path="/painel-acp" element={<PainelAcpPage />} />
        </Routes>
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Exportar CSV/i })).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: /Exportar CSV/i }))
    expect(spyCsv).toHaveBeenCalledTimes(1)
  })
})
