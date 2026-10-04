import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ConsoleHistoricoConsultasTab } from '@/components/ConsoleHistoricoConsultasTab'
import * as historicoService from '@/services/historicoConsultasService'

// Mock dos serviços de busca
vi.mock('@/services/historicoConsultasService', async (importOriginal) => {
  const actual = await importOriginal<typeof historicoService>()
  return {
    ...actual,
    carregarDadosHistoricoConsultas: vi.fn(),
  }
})

describe('ConsoleHistoricoConsultasTab Component', () => {
  const mockDadosCarregados = {
    nfeList: [
      {
        id: 'nfe-1',
        chave_acesso: '35260111222333000199550010000012341234567890',
        numero_nota: '1234',
        cnpj_emitente: '11.222.333/0001-99',
        nome_emitente: 'Empresa Alpha Ltda',
        created: '2025-05-10T10:00:00Z',
        origem: 'upload',
      },
    ],
    infosimplesList: [
      {
        id: 'info-1',
        chave_acesso: '35260111222333000199550010000012341234567890',
        tipo_consulta: 'nfe_completa_sefaz',
        status: 'sucesso',
        custo_creditos: 1.5,
        created: '2025-05-11T12:00:00Z',
        mensagem_retorno: 'Consulta autorizada',
      },
    ],
    cdvList: [
      {
        id: 'cdv-1',
        cdv_codigo: 'LOTE-CDV-100',
        cdv_cnpj: '22.333.444/0001-88',
        cdv_nome: 'CDV Central',
        veiculo_marca_modelo: 'Fiat Uno 2015',
        total_pecas: 49,
        created: '2025-05-12T14:00:00Z',
        status: 'processado',
      },
    ],
    relatoriosList: [
      {
        id: 'rel-1',
        codigo_verificacao: 'VRF-ABC-123',
        cnpj: '11.222.333/0001-99',
        razao_social: 'Empresa Alpha Ltda',
        tipo_relatorio: 'dossie_completo_pericial',
        hash_sha256: '9988aabbccddeeff',
        assinado_icp_brasil: true,
        created: '2025-05-13T16:00:00Z',
      },
    ],
    clientesOpcoes: [
      { cnpj: '11.222.333/0001-99', nome: 'Empresa Alpha Ltda' },
      { cnpj: '22.333.444/0001-88', nome: 'CDV Central' },
    ],
    usuariosOpcoes: [{ id: 'usr-1', nome: 'Operador 1', email: 'op1@empresa.com' }],
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(historicoService.carregarDadosHistoricoConsultas).mockResolvedValue(
      mockDadosCarregados,
    )
  })

  it('renderiza o componente, carrega dados e exibe métricas no topo', async () => {
    render(<ConsoleHistoricoConsultasTab />)

    await waitFor(() => {
      expect(screen.getByTestId('console-historico-consultas-tab')).toBeDefined()
    })

    // Total de consultas: 4 (1 nfe, 1 info, 1 cdv, 1 relatorio)
    await waitFor(() => {
      const cardTotal = screen.getByTestId('card-metrica-total-consultas')
      expect(cardTotal.textContent).toContain('4')
    })

    // Custo de créditos InfoSimples: 1,50
    const cardCreditos = screen.getByTestId('card-metrica-total-creditos')
    expect(cardCreditos.textContent).toContain('1,50')

    // Contagem por tipo
    expect(screen.getByTestId('card-metrica-nfe-upload').textContent).toContain('1')
    expect(screen.getByTestId('card-metrica-infosimples').textContent).toContain('1')
    expect(screen.getByTestId('card-metrica-cdv-lotes').textContent).toContain('1')
    expect(screen.getByTestId('card-metrica-relatorios').textContent).toContain('1')
  })

  it('permite filtrar por cliente (CNPJ) e recalcula métricas e itens da tabela', async () => {
    render(<ConsoleHistoricoConsultasTab />)

    await waitFor(() => {
      expect(screen.getByTestId('tabela-historico-consultas')).toBeDefined()
    })

    const selectCliente = screen.getByTestId('select-filtro-cliente')
    fireEvent.change(selectCliente, { target: { value: '22.333.444/0001-88' } })

    await waitFor(() => {
      // CDV Central possui apenas 1 lote
      const cardTotal = screen.getByTestId('card-metrica-total-consultas')
      expect(cardTotal.textContent).toContain('1')
    })

    expect(screen.getByText('LOTE-CDV-100')).toBeDefined()
    expect(screen.queryByText('VRF-ABC-123')).toBeNull()
  })

  it('permite abrir o modal de detalhes e fechar', async () => {
    render(<ConsoleHistoricoConsultasTab />)

    await waitFor(() => {
      expect(screen.getByTestId('btn-detalhes-info-info-1')).toBeDefined()
    })

    const btnDetalhes = screen.getByTestId('btn-detalhes-info-info-1')
    fireEvent.click(btnDetalhes)

    await waitFor(() => {
      expect(screen.getByTestId('modal-detalhes-consulta')).toBeDefined()
    })

    expect(screen.getByText(/Consumo de Créditos InfoSimples:/i)).toBeDefined()
    expect(screen.getByText(/1.5 créditos/i)).toBeDefined()

    // Fechar modal
    const btnFechar = screen.getByTestId('btn-fechar-modal-detalhes')
    fireEvent.click(btnFechar)

    await waitFor(() => {
      expect(screen.queryByTestId('modal-detalhes-consulta')).toBeNull()
    })
  })

  it('exibe estado vazio amigável quando nenhum registro atende ao filtro', async () => {
    render(<ConsoleHistoricoConsultasTab />)

    await waitFor(() => {
      expect(screen.getByTestId('input-busca-historico')).toBeDefined()
    })

    const inputBusca = screen.getByTestId('input-busca-historico')
    fireEvent.change(inputBusca, { target: { value: 'TEXTO_INEXISTENTE_99999' } })

    await waitFor(() => {
      expect(screen.getByTestId('estado-vazio-historico')).toBeDefined()
    })

    expect(
      screen.getByText(/Nenhuma consulta localizada para os filtros selecionados/i),
    ).toBeDefined()
  })
})
