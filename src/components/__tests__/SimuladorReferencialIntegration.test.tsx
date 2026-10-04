import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { PainelDmrvEmissoesEvitadas } from '../PainelDmrvEmissoesEvitadas'
import { SimuladorReferencialSection } from '../SimuladorReferencialSection'
import { SimuladorReferencialPrintModal } from '../SimuladorReferencialPrintModal'
import {
  calcularSimuladorReferencial,
  TEXTO_ROTULO_ONIPRESENTE,
} from '@/services/simuladorReferencialService'
import * as dmrvService from '@/services/dmrvEmissoesService'

// Mock do hook useAuth
vi.mock('@contexts/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: 'user-001',
      email: 'gestor@orbis.test',
      cnpj: '33.000.168/0001-09',
      role: 'admin',
    },
  }),
}))

// Mock de infoSimples
vi.mock('@/services/infosimplesService', () => ({
  obterStatusCertificadoA1: vi.fn().mockResolvedValue(null),
}))

describe('Painel dMRV — Integração do Simulador Referencial e Isolamento', () => {
  const mockSimulacao = calcularSimuladorReferencial({
    lotes: [
      {
        id: 'lote-demo',
        cdv_codigo: 'CDV-DEMO-001',
        protocolo: 'automotiva',
        total_peso_kg: 200,
        total_co2e_evitado_kg: 400,
        total_pecas: 2,
      },
    ],
    pecas: [
      {
        id: 'peca-01',
        lote: 'lote-demo',
        protocolo: 'automotiva',
        descricao_peca: 'Aço Laminado',
        material_declarado: 'Aço',
        peso_kg: 100,
        fator_co2e_kg: 1.89,
        co2e_evitado_kg: 189,
      },
      {
        id: 'peca-02',
        lote: 'lote-demo',
        protocolo: 'automotiva',
        descricao_peca: 'Fração de Paládio Rastreada',
        material_declarado: 'Paládio',
        categoria_material: 'materiais_criticos_rastreados',
        peso_kg: 0.1,
        fator_co2e_kg: 0,
        co2e_evitado_kg: 0,
        statusCalculo: 'em_estruturacao_de_catalogo',
      },
    ],
    cnpj: '33.000.168/0001-09',
    origem: 'producao',
  })

  it('Regra 1: rótulo de isenção onipresente é renderizado no SimuladorReferencialSection', () => {
    render(<SimuladorReferencialSection simulacao={mockSimulacao} />)

    // O rótulo deve aparecer em destaque no componente
    const elementosRotulo = screen.getAllByText(new RegExp(TEXTO_ROTULO_ONIPRESENTE, 'i'))
    expect(elementosRotulo.length).toBeGreaterThanOrEqual(1)
  })

  it('Regra 2: valores de potencial são exibidos estritamente como faixa mín–máx', () => {
    render(<SimuladorReferencialSection simulacao={mockSimulacao} />)

    const cardUsd = screen.getByTestId('simulador-faixa-usd')
    expect(cardUsd.textContent).toContain('US$')
    expect(cardUsd.textContent).toContain('–')

    const cardBrl = screen.getByTestId('simulador-faixa-brl')
    expect(cardBrl.textContent).toContain('R$')
    expect(cardBrl.textContent).toContain('–')
  })

  it('Regra 3: relatório estratificado não ganha valores financeiros; simulador é sub-aba separada', async () => {
    vi.spyOn(dmrvService, 'carregarDadosDmrvEmpresa').mockResolvedValue({
      cnpj: '33.000.168/0001-09',
      origem_filtro: 'producao',
      total_co2e_evitado_kg: 189,
      total_massa_reciclada_kg: 100,
      total_pecas_reaproveitadas: 1,
      total_lotes_processados: 1,
      emissao_anual_tco2e: 10.5,
      escopo1_tco2e: 2.0,
      escopo2_tco2e: 1.0,
      escopo3_tco2e: 7.5,
      serie_temporal: [{ mes: 'Mar/26', co2e_evitado_kg: 189, massa_kg: 100 }],
      relatorios_anteriores: [],
      simuladorReferencial: mockSimulacao,
    })

    render(<PainelDmrvEmissoesEvitadas permitirSimulador={true} />)

    // Por padrão abre na sub-aba 1 (Prova Documental dMRV)
    expect(await screen.findByText(/1\. Prova Documental dMRV/i)).toBeInTheDocument()
    expect(screen.getByText(/2\. Potencial Referencial/i)).toBeInTheDocument()

    // O container do simulador não deve estar visível na sub-aba 1
    expect(screen.queryByTestId('simulador-referencial-container')).not.toBeInTheDocument()

    // Clicar na sub-aba do simulador
    const botaoSimulador = screen.getByText(/2\. Potencial Referencial/i)
    fireEvent.click(botaoSimulador)

    // Agora o simulador deve ser exibido com seu rótulo
    expect(await screen.findByTestId('simulador-referencial-container')).toBeInTheDocument()
  })

  it('Regra 5: nenhuma tela pública exibe o simulador (permitirSimulador=false oculta totalmente)', async () => {
    vi.spyOn(dmrvService, 'carregarDadosDmrvEmpresa').mockResolvedValue({
      cnpj: '33.000.168/0001-09',
      origem_filtro: 'producao',
      total_co2e_evitado_kg: 189,
      total_massa_reciclada_kg: 100,
      total_pecas_reaproveitadas: 1,
      total_lotes_processados: 1,
      emissao_anual_tco2e: 10.5,
      escopo1_tco2e: 2.0,
      escopo2_tco2e: 1.0,
      escopo3_tco2e: 7.5,
      serie_temporal: [{ mes: 'Mar/26', co2e_evitado_kg: 189, massa_kg: 100 }],
      relatorios_anteriores: [],
      simuladorReferencial: mockSimulacao,
    })

    render(<PainelDmrvEmissoesEvitadas permitirSimulador={false} />)

    // Aguarda carregar dados
    await screen.findByText(/Painel dMRV de Emissões Evitadas/i)

    // Garantir que nenhum botão ou menção do simulador aparece quando desabilitado
    expect(screen.queryByText(/2\. Potencial Referencial/i)).not.toBeInTheDocument()
    expect(screen.queryByTestId('simulador-referencial-container')).not.toBeInTheDocument()
  })

  it('Modal de impressão/PDF renderiza marca dágua de isenção e ressalvas metodológicas', () => {
    render(
      <SimuladorReferencialPrintModal aberto={true} onClose={() => {}} simulacao={mockSimulacao} />,
    )

    // Verifica que a marca dágua pericial existe no DOM
    expect(screen.getAllByText(/SIMULAÇÃO REFERENCIAL/i).length).toBeGreaterThanOrEqual(1)
    expect(
      screen.getAllByText(/SEM VALIDADE • NÃO EMISSÍVEL • NÃO NEGOCIÁVEL/i).length,
    ).toBeGreaterThanOrEqual(1)
    expect(
      screen.getByText(/Ressalvas Metodológicas, Premissas & Fontes Oficiais Citadas/i),
    ).toBeInTheDocument()
  })
})
