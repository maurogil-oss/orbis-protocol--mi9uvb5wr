/**
 * conviteAcpFluxo.test.tsx
 * Teste de renderização e fluxo da página /convite/:token
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import ConviteAcpPage from '../ConviteAcpPage'
import * as acpConvitesService from '@/services/acpConvitesService'

// Mock do hook useAuth
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    login: vi.fn(),
  }),
}))

describe('ConviteAcpPage Component (Peça 4c)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('1. deve exibir mensagem de erro clara quando o convite já foi utilizado', async () => {
    vi.spyOn(acpConvitesService, 'validarTokenConviteAcp').mockResolvedValueOnce({
      valido: false,
      motivo: 'Este convite já foi utilizado para cadastro de empresa associada.',
    })

    render(
      <MemoryRouter initialEntries={['/convite/token_usado_123']}>
        <Routes>
          <Route path="/convite/:token" element={<ConviteAcpPage />} />
        </Routes>
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByText(/Link de Convite Não Disponível/i)).toBeInTheDocument()
      expect(screen.getByText(/Este convite já foi utilizado para cadastro/i)).toBeInTheDocument()
    })
  })

  it('2. deve exibir mensagem de erro clara quando o convite estiver expirado', async () => {
    vi.spyOn(acpConvitesService, 'validarTokenConviteAcp').mockResolvedValueOnce({
      valido: false,
      motivo: 'Este convite expirou o prazo limite de validade. Solicite um novo à ACP.',
    })

    render(
      <MemoryRouter initialEntries={['/convite/token_expirado_456']}>
        <Routes>
          <Route path="/convite/:token" element={<ConviteAcpPage />} />
        </Routes>
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByText(/Link de Convite Não Disponível/i)).toBeInTheDocument()
      expect(screen.getByText(/expirou o prazo limite/i)).toBeInTheDocument()
    })
  })

  it('3. deve carregar formulário com dados pré-preenchidos quando o convite for válido', async () => {
    vi.spyOn(acpConvitesService, 'validarTokenConviteAcp').mockResolvedValueOnce({
      valido: true,
      convite: {
        id: 'c1',
        token: 'token_valido_999',
        empresa_nome: 'Distribuidora Paranaense Ltda',
        email: 'contato@distribuidorapr.com.br',
        cnpj: '33.444.555/0001-66',
        status: 'pendente',
        expira_em: new Date(Date.now() + 86400000).toISOString(),
      },
    })

    render(
      <MemoryRouter initialEntries={['/convite/token_valido_999']}>
        <Routes>
          <Route path="/convite/:token" element={<ConviteAcpPage />} />
        </Routes>
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByText(/Adesão de Empresa Associada/i)).toBeInTheDocument()
      expect(screen.getByDisplayValue('Distribuidora Paranaense Ltda')).toBeInTheDocument()
      expect(screen.getByDisplayValue('contato@distribuidorapr.com.br')).toBeInTheDocument()
      expect(screen.getByDisplayValue('33.444.555/0001-66')).toBeInTheDocument()
      expect(screen.getByText(/Concluir Cadastro e Ativar Piloto/i)).toBeInTheDocument()
    })
  })
})
