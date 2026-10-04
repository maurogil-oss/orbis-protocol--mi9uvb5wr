import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import React from 'react'
import { PainelDmrvEmissoesEvitadas } from '../PainelDmrvEmissoesEvitadas'
import * as dmrvService from '@/services/dmrvEmissoesService'

describe('PainelDmrvEmissoesEvitadas - Alternância Sandbox vs Produção', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('renderiza modo Produção por padrão e alterna para Sandbox (Demonstração) exibindo badge e dados isolados', async () => {
    const spyCarregar = vi
      .spyOn(dmrvService, 'carregarDadosDmrvEmpresa')
      .mockImplementation(async (_cnpj, filtroOrigem) => {
        if (filtroOrigem === 'sintetico') {
          return {
            cnpj: '00.000.000/0001-91',
            origem_filtro: 'sintetico' as const,
            total_co2e_evitado_kg: 8450.5,
            total_massa_reciclada_kg: 4200.0,
            total_pecas_reaproveitadas: 15,
            total_lotes_processados: 2,
            emissao_anual_tco2e: 120.0,
            escopo1_tco2e: 30.0,
            escopo2_tco2e: 15.0,
            escopo3_tco2e: 75.0,
            serie_temporal: [
              { mes: 'Jan/26', co2e_evitado_kg: 4200, massa_kg: 2100 },
              { mes: 'Fev/26', co2e_evitado_kg: 4250.5, massa_kg: 2100 },
            ],
            relatorios_anteriores: [],
          }
        }

        return {
          cnpj: '00.000.000/0001-91',
          origem_filtro: 'producao' as const,
          total_co2e_evitado_kg: 12450.8,
          total_massa_reciclada_kg: 7850.0,
          total_pecas_reaproveitadas: 48,
          total_lotes_processados: 3,
          emissao_anual_tco2e: 450.5,
          escopo1_tco2e: 120.2,
          escopo2_tco2e: 45.3,
          escopo3_tco2e: 285.0,
          serie_temporal: [
            { mes: 'Jan/26', co2e_evitado_kg: 6200, massa_kg: 3900 },
            { mes: 'Fev/26', co2e_evitado_kg: 6250.8, massa_kg: 3950 },
          ],
          relatorios_anteriores: [],
        }
      })

    render(<PainelDmrvEmissoesEvitadas />)

    // Inicialmente carrega produção
    await waitFor(() => {
      expect(screen.getByText(/Painel dMRV de Emissões Evitadas/i)).toBeInTheDocument()
    })

    expect(spyCarregar).toHaveBeenCalledWith(expect.any(String), 'producao', expect.anything())
    expect(screen.getByText(/12\.450,8/)).toBeInTheDocument()
    // Badge de demonstração não deve estar visível no modo de produção
    expect(
      screen.queryByText(/Visualização de Dados Sintéticos do Ambiente de Sandbox/i),
    ).not.toBeInTheDocument()

    // Alterna para Sandbox (Demonstração)
    const btnSandbox = screen.getByRole('button', { name: /Sandbox \(Demonstração\)/i })
    fireEvent.click(btnSandbox)

    await waitFor(() => {
      expect(spyCarregar).toHaveBeenCalledWith(expect.any(String), 'sintetico', expect.anything())
    })

    // Deve exibir o aviso de sandbox e badges de demonstração
    expect(
      screen.getByText(/Visualização de Dados Sintéticos do Ambiente de Sandbox/i),
    ).toBeInTheDocument()
    expect(screen.getAllByText(/Demonstração/i).length).toBeGreaterThan(0)
    expect(screen.getByText(/8\.450,5/)).toBeInTheDocument()
  })
})
