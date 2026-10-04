import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import PreferenciasEmailPage from '../PreferenciasEmailPage'
import * as reativacaoService from '@/services/reativacaoService'

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    user: null,
  })),
}))

describe('PreferenciasEmailPage - Descadastro e Opt-out Público', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('exibe alerta de identificador de conta ausente se não houver uid nem token na URL', async () => {
    render(
      <MemoryRouter initialEntries={['/preferencias']}>
        <Routes>
          <Route path="/preferencias" element={<PreferenciasEmailPage />} />
        </Routes>
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByText(/Identificador de conta ausente/i)).toBeInTheDocument()
    })
  })

  it('carrega dados da conta por token público e permite confirmar opt-out', async () => {
    vi.spyOn(reativacaoService, 'consultarOptOutPublico').mockResolvedValue({
      sucesso: true,
      token_valido: true,
      email_mascarado: 'cl***@empresa.com.br',
      nome: 'Empresa Teste',
      opt_out: false,
    })

    const mockConfirmar = vi.spyOn(reativacaoService, 'confirmarOptOutPublico').mockResolvedValue({
      sucesso: true,
      opt_out: true,
      data: '2026-03-20T10:00:00Z',
      email: 'cliente@empresa.com.br',
      mensagem: 'Descadastro realizado com sucesso.',
    })

    render(
      <MemoryRouter initialEntries={['/preferencias?uid=u123&token=tokenvalido']}>
        <Routes>
          <Route path="/preferencias" element={<PreferenciasEmailPage />} />
        </Routes>
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByText('Empresa Teste')).toBeInTheDocument()
      expect(screen.getByTestId('status-inscrito')).toBeInTheDocument()
    })

    const btnOptOut = screen.getByTestId('btn-confirmar-optout')
    fireEvent.click(btnOptOut)

    await waitFor(() => {
      expect(mockConfirmar).toHaveBeenCalledWith('u123', 'tokenvalido', false)
      expect(screen.getByTestId('optout-sucesso-alerta')).toBeInTheDocument()
      expect(screen.getByTestId('status-descadastrado')).toBeInTheDocument()
    })
  })

  it('exibe botão de reativação se a conta já estiver descadastrada e permite reverter opt-out', async () => {
    vi.spyOn(reativacaoService, 'consultarOptOutPublico').mockResolvedValue({
      sucesso: true,
      token_valido: true,
      email_mascarado: 'cl***@empresa.com.br',
      nome: 'Empresa Teste',
      opt_out: true,
      opt_out_data: '2026-03-10T12:00:00Z',
    })

    const mockConfirmar = vi.spyOn(reativacaoService, 'confirmarOptOutPublico').mockResolvedValue({
      sucesso: true,
      opt_out: false,
      data: '2026-03-20T10:00:00Z',
      email: 'cliente@empresa.com.br',
      mensagem: 'Preferência restabelecida.',
    })

    render(
      <MemoryRouter initialEntries={['/preferencias?uid=u123&token=tokenvalido']}>
        <Routes>
          <Route path="/preferencias" element={<PreferenciasEmailPage />} />
        </Routes>
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('status-descadastrado')).toBeInTheDocument()
    })

    const btnReativar = screen.getByTestId('btn-reverter-optout')
    fireEvent.click(btnReativar)

    await waitFor(() => {
      expect(mockConfirmar).toHaveBeenCalledWith('u123', 'tokenvalido', true)
      expect(screen.getByTestId('optout-sucesso-alerta')).toBeInTheDocument()
      expect(screen.getByTestId('status-inscrito')).toBeInTheDocument()
    })
  })
})
