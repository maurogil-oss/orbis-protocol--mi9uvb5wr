import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import NormaDmOrb001Page from '../NormaDmOrb001Page'
import FatoresEmissaoPublicoPage from '../FatoresEmissaoPublicoPage'
import * as AuthContextModule from '@/contexts/AuthContext'
import * as NormaDownloadsModule from '@/services/normaDownloadsService'

// Mock dos serviços
vi.mock('@/services/normaDownloadsService', async () => {
  const actual = await vi.importActual<typeof import('@/services/normaDownloadsService')>(
    '@/services/normaDownloadsService',
  )
  return {
    ...actual,
    registrarDownloadNorma: vi.fn(),
  }
})

describe('Arquitetura de 3 Camadas - Governança Metodológica', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Camada 1: Página Pública /fatores', () => {
    it('deve manter públicos os valores dos fatores, unidades, fontes e incertezas', () => {
      render(
        <MemoryRouter initialEntries={['/fatores']}>
          <Routes>
            <Route path="/fatores" element={<FatoresEmissaoPublicoPage />} />
          </Routes>
        </MemoryRouter>,
      )

      // Alterna para o catálogo de fatores
      const btnCatalogo = screen.getByRole('button', { name: /Catálogo Curado de Fatores/i })
      fireEvent.click(btnCatalogo)

      // Confirma que os valores e fontes canônicos estão públicos
      expect(screen.getAllByText(/Alumínio Primário/i).length).toBeGreaterThan(0)
      expect(screen.getAllByText(/14,40/i).length).toBeGreaterThan(0)
      expect(screen.getAllByText(/IAI/i).length).toBeGreaterThan(0)

      expect(screen.getAllByText(/Aço Laminado \/ Estampado/i).length).toBeGreaterThan(0)
      expect(screen.getAllByText(/2,18/i).length).toBeGreaterThan(0)
      expect(screen.getAllByText(/worldsteel/i).length).toBeGreaterThan(0)

      expect(screen.getAllByText(/Cobre \/ Bobinamentos Elétricos/i).length).toBeGreaterThan(0)
      expect(screen.getAllByText(/4,10/i).length).toBeGreaterThan(0)
      expect(screen.getAllByText(/ICA/i).length).toBeGreaterThan(0)

      // Polímeros com flag mantida
      expect(screen.getAllByText(/Pendente de verificação de fonte/i).length).toBeGreaterThan(0)
    })

    it('NÃO deve exibir no corpo público as equações de baseline completas nem fórmula de incerteza em quadratura', () => {
      render(
        <MemoryRouter initialEntries={['/fatores']}>
          <Routes>
            <Route path="/fatores" element={<FatoresEmissaoPublicoPage />} />
          </Routes>
        </MemoryRouter>,
      )

      // Equações do motor e incerteza não devem estar no HTML público
      expect(screen.queryByText(/Evitado_peça = \(Q × FE_ref × L_i × DF\) − PE_peça/i)).toBeNull()
      expect(
        screen.queryByText(
          /Incerteza_lote = √ \[ Σ \(Evitado_peça × u_FE\)² \+ \(Evitado_lote × u_massa\)² \]/i,
        ),
      ).toBeNull()

      // Deve exibir CTA explícito para /norma-dm-orb-001
      const linkNorma = screen.getByRole('link', { name: /Acessar Norma Completa/i })
      expect(linkNorma.getAttribute('href')).toBe('/norma-dm-orb-001')
    })

    it('botão de exportação do CSV público exporta a versão resumida', () => {
      render(
        <MemoryRouter initialEntries={['/fatores']}>
          <Routes>
            <Route path="/fatores" element={<FatoresEmissaoPublicoPage />} />
          </Routes>
        </MemoryRouter>,
      )

      const btnCatalogo = screen.getByRole('button', { name: /Catálogo Curado de Fatores/i })
      fireEvent.click(btnCatalogo)

      const btnExportar = screen.getByRole('button', { name: /Exportar CSV Público/i })
      expect(btnExportar).not.toBeNull()
    })
  })

  describe('Camada 2: Página Protegida /norma-dm-orb-001', () => {
    it('deve redirecionar usuário não autenticado para /login com returnUrl', () => {
      vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        role: 'publico',
        login: vi.fn(),
        logout: vi.fn(),
        token: null,
      } as any)

      render(
        <MemoryRouter initialEntries={['/norma-dm-orb-001']}>
          <Routes>
            <Route path="/norma-dm-orb-001" element={<NormaDmOrb001Page />} />
            <Route path="/login" element={<div>Página de Login de Teste</div>} />
          </Routes>
        </MemoryRouter>,
      )

      expect(screen.getByText('Página de Login de Teste')).not.toBeNull()
    })

    it('usuário autenticado visualiza a norma completa e marcas de autoria com seu e-mail', () => {
      vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
        user: { id: 'usr-123', email: 'auditor@empresa.com.br', name: 'Dr. Auditor' },
        isAuthenticated: true,
        isLoading: false,
        role: 'usuario',
      } as any)

      render(
        <MemoryRouter initialEntries={['/norma-dm-orb-001']}>
          <Routes>
            <Route path="/norma-dm-orb-001" element={<NormaDmOrb001Page />} />
          </Routes>
        </MemoryRouter>,
      )

      // Verifica marcas de autoria e licenciamento
      expect(screen.getByTestId('marca-licenca-topo')).not.toBeNull()
      expect(screen.getByTestId('marca-licenca-rodape')).not.toBeNull()
      expect(
        screen.getAllByText(/Licenciado para: auditor@empresa.com.br/i).length,
      ).toBeGreaterThan(0)

      // Na Camada 2 a norma completa é exibida
      expect(screen.getByText(/Evitado_peça = \(Q × FE_ref × L_i × DF\) − PE_peça/i)).not.toBeNull()
      expect(
        screen.getByText(
          /Incerteza_lote = √ \[ Σ \(Evitado_peça × u_FE\)² \+ \(Evitado_lote × u_massa\)² \]/i,
        ),
      ).not.toBeNull()
      expect(screen.getByText(/TIER 1 \(T1\)/i)).not.toBeNull()
      expect(screen.getByText(/TIER 4 \(T4\)/i)).not.toBeNull()
    })

    it('bloqueia o download se o checkbox de confidencialidade não for assinalado', async () => {
      vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
        user: { id: 'usr-123', email: 'auditor@empresa.com.br', name: 'Dr. Auditor' },
        isAuthenticated: true,
        isLoading: false,
        role: 'usuario',
      } as any)

      render(
        <MemoryRouter initialEntries={['/norma-dm-orb-001']}>
          <Routes>
            <Route path="/norma-dm-orb-001" element={<NormaDmOrb001Page />} />
          </Routes>
        </MemoryRouter>,
      )

      const btnDownloadCsv = screen.getByRole('button', {
        name: /Baixar CSV Completo do Catálogo/i,
      })
      fireEvent.click(btnDownloadCsv)

      expect(
        screen.getByText(
          /Marque o checkbox de compromisso de confidencialidade antes de realizar o download/i,
        ),
      ).not.toBeNull()
      expect(NormaDownloadsModule.registrarDownloadNorma).not.toHaveBeenCalled()
    })

    it('registra download e permite baixar quando o termo de uso é aceito', async () => {
      vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
        user: { id: 'usr-123', email: 'auditor@empresa.com.br', name: 'Dr. Auditor' },
        isAuthenticated: true,
        isLoading: false,
        role: 'usuario',
      } as any)

      vi.mocked(NormaDownloadsModule.registrarDownloadNorma).mockResolvedValue({
        success: true,
        id: 'rec-001',
      })

      render(
        <MemoryRouter initialEntries={['/norma-dm-orb-001']}>
          <Routes>
            <Route path="/norma-dm-orb-001" element={<NormaDmOrb001Page />} />
          </Routes>
        </MemoryRouter>,
      )

      // Marca o checkbox obrigatório
      const checkbox = screen.getByRole('checkbox')
      fireEvent.click(checkbox)
      expect((checkbox as HTMLInputElement).checked).toBe(true)

      const btnDownloadCsv = screen.getByRole('button', {
        name: /Baixar CSV Completo do Catálogo/i,
      })
      fireEvent.click(btnDownloadCsv)

      await waitFor(() => {
        expect(NormaDownloadsModule.registrarDownloadNorma).toHaveBeenCalledWith({
          userId: 'usr-123',
          userEmail: 'auditor@empresa.com.br',
          userNome: 'Dr. Auditor',
          tipoDownload: 'csv_completo',
          termoAceito: true,
          versaoNorma: 'v1.1',
        })
      })

      expect(
        screen.getByText(
          /Download do CSV Completo registrado com sucesso sob sua custódia institucional/i,
        ),
      ).not.toBeNull()
    })
  })
})
