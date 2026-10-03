import React from 'react'
import '@testing-library/jest-dom/vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { TabelaPublicaHonorariosSection } from '@/components/TabelaPublicaHonorariosSection'
import * as honorariosService from '@/services/honorariosService'

// Mock do AuthContext
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'test-user', email: 'perito@teste.com', role: 'perito' },
    isAuthenticated: true,
  }),
}))

describe('TabelaPublicaHonorariosSection & Módulo de Honorários de Peritos', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renderiza os honorários vigentes carregados do backend com valores reais e conselhos', async () => {
    const mockHonorarios: honorariosService.CdvHonorarioRecord[] = [
      {
        id: 'hon-1',
        tipo_perito: 'CREA',
        tipo_laudo: 'laudo_lote_cdverde',
        titulo_laudo: 'Laudo Pericial de Lote CDVerde (Desmontagem & Circularidade)',
        valor_base: 850.0,
        unidade: 'por lote',
        vigencia_inicio: '2025-01-01',
        ativo: true,
        observacoes: 'Aferição física e documental com ART.',
        created: '2025-01-01T00:00:00Z',
        updated: '2025-01-01T00:00:00Z',
      },
      {
        id: 'hon-2',
        tipo_perito: 'CRC',
        tipo_laudo: 'atestado_orbis_verificacao',
        titulo_laudo: 'Atestado Orbis Contábil — Inventário GHG e Conformidade Tributária',
        valor_base: 1250.0,
        unidade: 'por laudo',
        vigencia_inicio: '2025-01-01',
        ativo: true,
        observacoes: 'Conciliação contábil-fiscal.',
        created: '2025-01-01T00:00:00Z',
        updated: '2025-01-01T00:00:00Z',
      },
    ]

    vi.spyOn(honorariosService, 'listarHonorariosVigentes').mockResolvedValue(mockHonorarios)

    render(
      <MemoryRouter>
        <TabelaPublicaHonorariosSection />
      </MemoryRouter>,
    )

    // Aguarda carregar dados
    await waitFor(() => {
      expect(
        screen.getByText('Laudo Pericial de Lote CDVerde (Desmontagem & Circularidade)'),
      ).toBeInTheDocument()
    })

    // Valida valores formatados
    expect(screen.getByText(/850,00/)).toBeInTheDocument()
    expect(screen.getByText(/1\.250,00/)).toBeInTheDocument()

    // Valida conselhos
    expect(screen.getByText('CREA')).toBeInTheDocument()
    expect(screen.getByText('CRC')).toBeInTheDocument()

    // Valida seção de ART / RRT obrigatória e seguro
    expect(screen.getAllByText(/ART \/ RRT Obrigatória/i).length).toBeGreaterThan(0)
    expect(screen.getByText('Responsabilidade Técnica e Seguro Profissional')).toBeInTheDocument()
    expect(screen.getByText(/Termo de Credenciamento Pericial/i)).toBeInTheDocument()
    expect(screen.getByText(/em definição/i)).toBeInTheDocument()
  })

  it('exibe fallback "Sob consulta" quando não houver registro cadastrado ou valor for zero', async () => {
    const mockHonorariosIncompletos: honorariosService.CdvHonorarioRecord[] = [
      {
        id: 'hon-zero',
        tipo_perito: 'CRBio',
        tipo_laudo: 'auditoria_especial_bioma',
        titulo_laudo: 'Auditoria Especial de Bioma e Regeneração',
        valor_base: 0,
        unidade: 'por parecer',
        vigencia_inicio: '2025-01-01',
        ativo: true,
        observacoes: 'Projeto complexo de alta especificidade ecológica.',
        created: '2025-01-01T00:00:00Z',
        updated: '2025-01-01T00:00:00Z',
      },
    ]

    vi.spyOn(honorariosService, 'listarHonorariosVigentes').mockResolvedValue(
      mockHonorariosIncompletos,
    )

    render(
      <MemoryRouter>
        <TabelaPublicaHonorariosSection />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByText('Auditoria Especial de Bioma e Regeneração')).toBeInTheDocument()
    })

    // Deve exibir Sob consulta para valor 0
    expect(screen.getByText('Sob consulta')).toBeInTheDocument()

    // Texto de esclarecimento da matriz sob consulta presente
    expect(
      screen.getByText(/Para combinações de laudos e conselhos específicos sem valor tabelado/i),
    ).toBeInTheDocument()
  })

  it('respeita terminologia obrigatória: Atestado Orbis e ausência de Selo Oficial ou Certificação como substituto', async () => {
    render(
      <MemoryRouter>
        <TabelaPublicaHonorariosSection />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByText('Remuneração por Perícia & Laudo Técnico')).toBeInTheDocument()
    })

    const bodyText = document.body.textContent || ''
    expect(bodyText).not.toContain('Selo Oficial')
    expect(bodyText).not.toContain('Certificado Oficial')
  })
})
