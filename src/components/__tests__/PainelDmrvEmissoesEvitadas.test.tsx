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

  it('renderiza os cards com vocabulário setorial específico do segmento Têxtil sem termos de veículos', async () => {
    vi.spyOn(dmrvService, 'carregarDadosDmrvEmpresa').mockResolvedValueOnce({
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
      serie_temporal: [{ mes: 'Jan/26', co2e_evitado_kg: 4200, massa_kg: 2100 }],
      relatorios_anteriores: [],
      protocoloDominanteSlug: 'textil',
      protocoloDominanteNome: 'Têxtil, Confecção & Calçados Sustentáveis',
      kpiCards: [
        {
          id: 'co2e_evitado',
          rotulo: 'CO₂e Evitado Total',
          valorFormatado: '8.450,5',
          valorNumerico: 8450.5,
          unidade: 'kg',
          legenda: 'Abatimento por reaproveitamento de fibras e polímeros têxteis',
          natureza: 'gravada',
        },
        {
          id: 'kpi_pos2',
          rotulo: 'Resíduo Têxtil Desviado',
          valorFormatado: '4.200',
          valorNumerico: 4200,
          unidade: 'kg',
          legenda: 'Aparas de algodão, poliéster reciclado e tecidos desviados de aterro',
          natureza: 'gravada',
        },
        {
          id: 'kpi_pos3',
          rotulo: 'Itens & Peças com Selo DPP',
          valorFormatado: '15',
          valorNumerico: 15,
          unidade: 'itens',
          legenda: 'Fardos, rolos e peças catalogadas com rastreabilidade da fibra',
          natureza: 'gravada',
        },
        {
          id: 'kpi_pos4',
          rotulo: 'Lotes Têxteis Fechados',
          valorFormatado: '2',
          valorNumerico: 2,
          unidade: 'lotes',
          legenda: 'Remessas têxteis com conformidade ABVTEX/ABR comprovada',
          natureza: 'gravada',
        },
      ],
    })

    render(<PainelDmrvEmissoesEvitadas />)

    await waitFor(() => {
      expect(screen.getByText('Resíduo Têxtil Desviado')).toBeInTheDocument()
      expect(screen.getByText('Lotes Têxteis Fechados')).toBeInTheDocument()
      expect(
        screen.getByText('Remessas têxteis com conformidade ABVTEX/ABR comprovada'),
      ).toBeInTheDocument()
      // Garante a ausência total de vocabulário de veículos no segmento têxtil
      expect(screen.queryByText('Veículos com despoluição atendida')).not.toBeInTheDocument()
      expect(screen.queryByText('Lotes CDV Fechados')).not.toBeInTheDocument()
    })
  })

  it('renderiza os cards canônicos do CDV automotivo com vocabulário de veículos mantido', async () => {
    vi.spyOn(dmrvService, 'carregarDadosDmrvEmpresa').mockResolvedValueOnce({
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
      serie_temporal: [{ mes: 'Jan/26', co2e_evitado_kg: 6200, massa_kg: 3900 }],
      relatorios_anteriores: [],
      protocoloDominanteSlug: 'automotiva',
      protocoloDominanteNome: 'Automotiva & Desmanches Sustentáveis (CDV)',
      kpiCards: [
        {
          id: 'co2e_evitado',
          rotulo: 'CO₂e Evitado Total',
          valorFormatado: '12.450,8',
          valorNumerico: 12450.8,
          unidade: 'kg',
          legenda: 'Evitação de produção primária de aço, alumínio e cobre (MOVER)',
          natureza: 'gravada',
        },
        {
          id: 'kpi_pos2',
          rotulo: 'Massa Reciclada / Desviada',
          valorFormatado: '7.850',
          valorNumerico: 7850,
          unidade: 'kg',
          legenda: 'Balanço de massa comprovado com MTR e baixa veicular',
          natureza: 'gravada',
        },
        {
          id: 'kpi_pos3',
          rotulo: 'Peças com Selo DPP',
          valorFormatado: '48',
          valorNumerico: 48,
          unidade: 'peças',
          legenda: 'Itens automotivos catalogados com rastreabilidade',
          natureza: 'gravada',
        },
        {
          id: 'kpi_pos4',
          rotulo: 'Lotes CDV Fechados',
          valorFormatado: '3',
          valorNumerico: 3,
          unidade: 'lotes',
          legenda: 'Veículos com despoluição atendida',
          natureza: 'gravada',
        },
      ],
    })

    render(<PainelDmrvEmissoesEvitadas />)

    await waitFor(() => {
      expect(screen.getByText('Peças com Selo DPP')).toBeInTheDocument()
      expect(screen.getByText('Lotes CDV Fechados')).toBeInTheDocument()
      expect(screen.getByText('Veículos com despoluição atendida')).toBeInTheDocument()
    })
  })
})
