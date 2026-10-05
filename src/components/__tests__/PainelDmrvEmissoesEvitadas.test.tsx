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

  it('permite clicar em um card de KPI para abrir o modal de Drill-Down e navegar nas abas', async () => {
    vi.spyOn(dmrvService, 'carregarDadosDmrvEmpresa').mockResolvedValueOnce({
      cnpj: '33.000.168/0001-09',
      origem_filtro: 'producao' as const,
      total_co2e_evitado_kg: 89311.22,
      total_massa_reciclada_kg: 40000.0,
      total_pecas_reaproveitadas: 150,
      total_lotes_processados: 10,
      emissao_anual_tco2e: 150.0,
      escopo1_tco2e: 40.0,
      escopo2_tco2e: 30.0,
      escopo3_tco2e: 80.0,
      serie_temporal: [{ mes: 'Jan/26', co2e_evitado_kg: 89311.22, massa_kg: 40000.0 }],
      relatorios_anteriores: [],
      protocoloDominanteSlug: 'automotiva',
      protocoloDominanteNome: 'Automotiva & Desmanches Sustentáveis (CDV)',
      kpiCards: [
        {
          id: 'co2e_evitado',
          rotulo: 'CO₂e Evitado Total',
          valorFormatado: '89.311,2',
          valorNumerico: 89311.22,
          unidade: 'kg',
          legenda: 'Evitação de produção primária de aço, alumínio e cobre (MOVER)',
          natureza: 'gravada',
        },
        {
          id: 'kpi_pos2',
          rotulo: 'Massa Reciclada / Desviada',
          valorFormatado: '40.000',
          valorNumerico: 40000,
          unidade: 'kg',
          legenda: 'Balanço ponderal rastreado',
          natureza: 'gravada',
        },
        {
          id: 'kpi_pos3',
          rotulo: 'Peças com Selo DPP',
          valorFormatado: '150',
          valorNumerico: 150,
          unidade: 'peças',
          legenda: 'Peças catalogadas',
          natureza: 'gravada',
        },
        {
          id: 'kpi_pos4',
          rotulo: 'Lotes CDV Fechados',
          valorFormatado: '10',
          valorNumerico: 10,
          unidade: 'lotes',
          legenda: 'Veículos com despoluição atendida',
          natureza: 'gravada',
        },
      ],
      relatorioEstratificado: {
        geradoEmIso: new Date().toISOString(),
        cnpjTitular: '33.000.168/0001-09',
        origemFiltro: 'producao',
        protocoloDominanteSlug: 'automotiva',
        protocoloDominanteNome: 'Automotiva & Desmanches Sustentáveis (CDV)',
        kpiCards: [],
        porProtocolo: [
          {
            protocoloSlug: 'automotiva',
            protocoloNome: 'Automotiva & Desmanches Sustentáveis (CDV)',
            co2e_evitado_kg: 89311.22,
            massa_kg: 40000,
            total_pecas: 150,
            total_lotes: 10,
            percentualCo2e: 100,
            percentualMassa: 100,
          },
        ],
        porFatorMaterial: [
          {
            chave: 'mat_aco',
            nomeMaterial: 'Aço Laminado / Estampado',
            categoriaMaterial: 'cdv_materiais',
            peso_kg: 40000,
            fator_co2e_kg: 2.18,
            co2e_evitado_kg: 87200,
            fonteFator: 'worldsteel 2024 / DM-ORB-001',
            possuiFatorOficial: true,
            statusRastreabilidade: 'com_fator_atribuido',
            totalPecas: 150,
          },
        ],
        porLoteDocumento: [
          {
            loteId: 'lote-123',
            cdvCodigo: 'CDV-MOOCA-001',
            cdvNome: 'CDV Verde Mooca',
            cdvCnpj: '33.000.168/0001-09',
            protocoloSlug: 'automotiva',
            protocoloNome: 'Automotiva & Desmanches Sustentáveis (CDV)',
            tipoDocumento: 'NF-e',
            documentoOrigem: 'NF-e 552109',
            dataIso: '2025-01-20',
            totalPecas: 15,
            peso_kg: 4000,
            co2e_evitado_kg: 8720,
            hashSha256: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
            pecasSemFatorCount: 0,
          },
        ],
        totaisConferencia: {
          co2e_evitado_kg: 89311.22,
          massa_kg: 40000,
          total_pecas: 150,
          total_lotes: 10,
          massa_sem_co2e_kg: 0,
          pecas_sem_co2e: 0,
        },
      },
    })

    render(<PainelDmrvEmissoesEvitadas />)

    await waitFor(() => {
      expect(screen.getByText('89.311,2')).toBeInTheDocument()
    })

    // Clica no card de CO2e evitado para abrir o drill-down
    const cardEl = screen.getByRole('button', {
      name: /drill-down para co₂e evitado total/i,
    })
    fireEvent.click(cardEl)

    // Modal de Drill-Down deve abrir exibindo os 3 níveis navegáveis
    await waitFor(() => {
      expect(screen.getByText(/Drill-Down & Traçabilidade Completa dMRV/i)).toBeInTheDocument()
      expect(screen.getByText(/1\. Por Protocolo/i)).toBeInTheDocument()
      expect(screen.getByText(/2\. Por Fator & Material/i)).toBeInTheDocument()
      expect(screen.getByText(/3\. Por Lote & Documento/i)).toBeInTheDocument()
    })

    // Navega para Fator & Material
    const tabFator = screen.getByText(/2\. Por Fator & Material/i)
    fireEvent.click(tabFator)
    expect(screen.getByText('Aço Laminado / Estampado')).toBeInTheDocument()
    expect(screen.getByText('worldsteel 2024 / DM-ORB-001')).toBeInTheDocument()

    // Navega para Lote & Documento
    const tabLote = screen.getByText(/3\. Por Lote & Documento/i)
    fireEvent.click(tabLote)
    expect(screen.getByText('NF-e 552109')).toBeInTheDocument()
    expect(
      screen.getByText(/9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08/),
    ).toBeInTheDocument()
  })

  it('permite alternar a vertical no dropdown "Vertical em foco" e recalcula os cards e dados da vertical', async () => {
    const spyCarregar = vi.spyOn(dmrvService, 'carregarDadosDmrvEmpresa')

    spyCarregar.mockImplementation(async (_cnpj, _origem, vertical) => {
      if (vertical === 'agro') {
        return {
          cnpj: '33.000.168/0001-09',
          origem_filtro: 'sintetico' as const,
          total_co2e_evitado_kg: 0,
          total_massa_reciclada_kg: 15000.0,
          total_pecas_reaproveitadas: 5,
          total_lotes_processados: 2,
          emissao_anual_tco2e: 50.0,
          escopo1_tco2e: 10.0,
          escopo2_tco2e: 5.0,
          escopo3_tco2e: 35.0,
          serie_temporal: [{ mes: 'Fev/26', co2e_evitado_kg: 0, massa_kg: 15000 }],
          relatorios_anteriores: [],
          protocoloDominanteSlug: 'agro',
          protocoloDominanteNome: 'Agro & Biomassa Sustentável',
          verticaisDisponiveis: [
            {
              slug: 'automotiva',
              nome: 'Automotiva & Desmanches Sustentáveis (CDV)',
              totalLotes: 5,
            },
            { slug: 'agro', nome: 'Agro & Biomassa Sustentável', totalLotes: 2 },
          ],
          kpiCards: [
            {
              id: 'co2e_evitado',
              rotulo: 'CO₂e Evitado Total',
              valorFormatado: '0,0',
              valorNumerico: 0,
              unidade: 'kg',
              legenda: 'Em estruturação de catálogo — zero crédito',
              natureza: 'gravada',
            },
            {
              id: 'kpi_pos2',
              rotulo: 'Massa Agro Rastreada',
              valorFormatado: '15.000',
              valorNumerico: 15000,
              unidade: 'kg',
              legenda: 'Grãos e biomassa com rastreabilidade territorial',
              natureza: 'gravada',
            },
            {
              id: 'kpi_pos3',
              rotulo: 'Cargas Catalogadas',
              valorFormatado: '5',
              valorNumerico: 5,
              unidade: 'cargas',
              legenda: 'Cargas com comprovação de origem',
              natureza: 'gravada',
            },
            {
              id: 'kpi_pos4',
              rotulo: 'Lotes Agro Fechados',
              valorFormatado: '2',
              valorNumerico: 2,
              unidade: 'lotes',
              legenda: 'Lotes agrícolas processados',
              natureza: 'gravada',
            },
          ],
        }
      }

      // Default (automotiva)
      return {
        cnpj: '33.000.168/0001-09',
        origem_filtro: 'sintetico' as const,
        total_co2e_evitado_kg: 25000.0,
        total_massa_reciclada_kg: 12000.0,
        total_pecas_reaproveitadas: 40,
        total_lotes_processados: 5,
        emissao_anual_tco2e: 80.0,
        escopo1_tco2e: 20.0,
        escopo2_tco2e: 10.0,
        escopo3_tco2e: 50.0,
        serie_temporal: [{ mes: 'Jan/26', co2e_evitado_kg: 25000, massa_kg: 12000 }],
        relatorios_anteriores: [],
        protocoloDominanteSlug: 'automotiva',
        protocoloDominanteNome: 'Automotiva & Desmanches Sustentáveis (CDV)',
        verticaisDisponiveis: [
          { slug: 'automotiva', nome: 'Automotiva & Desmanches Sustentáveis (CDV)', totalLotes: 5 },
          { slug: 'agro', nome: 'Agro & Biomassa Sustentável', totalLotes: 2 },
        ],
        kpiCards: [
          {
            id: 'co2e_evitado',
            rotulo: 'CO₂e Evitado Total',
            valorFormatado: '25.000,0',
            valorNumerico: 25000,
            unidade: 'kg',
            legenda: 'Evitação de produção primária automotiva',
            natureza: 'gravada',
          },
          {
            id: 'kpi_pos2',
            rotulo: 'Massa Reciclada / Desviada',
            valorFormatado: '12.000',
            valorNumerico: 12000,
            unidade: 'kg',
            legenda: 'Balanço de massa comprovado',
            natureza: 'gravada',
          },
          {
            id: 'kpi_pos3',
            rotulo: 'Peças com Selo DPP',
            valorFormatado: '40',
            valorNumerico: 40,
            unidade: 'peças',
            legenda: 'Peças catalogadas',
            natureza: 'gravada',
          },
          {
            id: 'kpi_pos4',
            rotulo: 'Lotes CDV Fechados',
            valorFormatado: '5',
            valorNumerico: 5,
            unidade: 'lotes',
            legenda: 'Veículos com despoluição atendida',
            natureza: 'gravada',
          },
        ],
      }
    })

    render(<PainelDmrvEmissoesEvitadas />)

    // Aguarda carregar dados iniciais (automotiva)
    await waitFor(() => {
      expect(screen.getByText('Lotes CDV Fechados')).toBeInTheDocument()
      expect(screen.getByText('25.000,0')).toBeInTheDocument()
    })

    // Localiza o seletor de vertical em foco
    const seletorVertical = screen.getByTestId('seletor-vertical-foco')
    expect(seletorVertical).toBeInTheDocument()

    // Troca para agro
    fireEvent.change(seletorVertical, { target: { value: 'agro' } })

    // Aguarda os cards recalcularem para os rótulos e unidades canônicas do Agro
    await waitFor(() => {
      expect(screen.getByText('Massa Agro Rastreada')).toBeInTheDocument()
      expect(screen.getByText('Lotes Agro Fechados')).toBeInTheDocument()
      expect(screen.getByText('Cargas Catalogadas')).toBeInTheDocument()
      expect(screen.queryByText('Lotes CDV Fechados')).not.toBeInTheDocument()
    })
  })
})
