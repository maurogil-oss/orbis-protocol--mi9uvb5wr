import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import FatoresEmissaoPublicoPage from '../FatoresEmissaoPublicoPage'
import { METADADOS_CATALOGO_FATORES } from '@/services/catalogoFatoresOficiais'
import { VERSAO_METODOLOGIA_CDV_V2 } from '@/services/cdvEngineV2'

describe('Página Pública /fatores - DM-ORB-001 v1.1', () => {
  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <FatoresEmissaoPublicoPage />
      </BrowserRouter>,
    )
  }

  it('deve renderizar o título principal, versão metodológica v1.1 e badges normativas', () => {
    renderComponent()

    expect(
      screen.getByText(
        /Metodologia de Quantificação de Emissões Evitadas na Desmontagem Veicular/i,
      ),
    ).not.toBeNull()
    expect(screen.getAllByText(new RegExp(VERSAO_METODOLOGIA_CDV_V2, 'i')).length).toBeGreaterThan(
      0,
    )
    expect(screen.getByText(METADADOS_CATALOGO_FATORES.dataVigencia)).not.toBeNull()
    expect(screen.getByText(/Prospectiva Imutável/i)).not.toBeNull()
  })

  it('deve apresentar as seções nucleares do DM-ORB-001 v1.1 no texto formal', () => {
    renderComponent()

    // §1: Gatilho SBCE e Artigo 6
    expect(
      screen.getByText(/§1\. Objetivo, Escopo Restrito e Cláusula de Gatilho SBCE \/ Artigo 6/i),
    ).not.toBeNull()
    expect(screen.getByText(/Lei Federal nº 15\.042\/2024/i)).not.toBeNull()
    expect(screen.getByText(/Artigo 6 do Acordo de Paris/i)).not.toBeNull()

    // §3-A: As 5 condições de aplicabilidade
    expect(
      screen.getByText(/§3-A\. As Cinco Condições Cumulativas de Aplicabilidade/i),
    ).not.toBeNull()
    expect(screen.getByText(/Destinação Documentada Obrigatória/i)).not.toBeNull()
    expect(screen.getByText(/Dado Medido para Itens Relevantes/i)).not.toBeNull()
    expect(screen.getByText(/Conservadorismo em Toda Direção Incerta/i)).not.toBeNull()
    expect(screen.getByText(/Vedação Absoluta de Dupla Contagem Inter-CDVs/i)).not.toBeNull()
    expect(screen.getByText(/Fronteira Declarada Berço-ao-Portão/i)).not.toBeNull()

    // §5.1: Classificação de materiais e menor fator para peça mista
    expect(
      screen.getByText(/§5\.1 Classificação de Materiais e Regra Conservadora para Peças Mistas/i),
    ).not.toBeNull()
    expect(screen.getByText(/regra do menor fator da composição provável/i)).not.toBeNull()

    // §5.3: Deduplicação e HTTP 409
    expect(
      screen.getByText(/§5\.3 Deduplicação Inter-CDVs, Chave Canônica e Consulta Pública LGPD/i),
    ).not.toBeNull()
    expect(screen.getByText(/CHASSI \+ "_" \+ SKU \+ "_" \+ DATA_BAIXA_DETRAN/i)).not.toBeNull()
    expect(screen.getByText(/HTTP 409 CONFLITO_DE_CUSTODIA/i)).not.toBeNull()
    expect(screen.getByText(/\/backend\/v2\/verificador\/claim\/:chassi/i)).not.toBeNull()

    // §6.1: R-134a, GWP 1530 e DF 1.0
    expect(
      screen.getByText(/§6\.1 Fatores Consolidados em CO₂e e Tratamento Mandatório do R-134a/i),
    ).not.toBeNull()
    expect(screen.getAllByText(/1\.530/i).length).toBeGreaterThan(0)
    expect(screen.getByText(/Refrigerante não capturado no gate de despoluição/i)).not.toBeNull()

    // §6.3: Fórmula de baseline com DF 0.30 e Li 1.0
    expect(screen.getByText(/§6\.3 Procedimento de Baseline do Motor v2/i)).not.toBeNull()
    expect(screen.getByText(/Evitado_peça = \(Q × FE_ref × L_i × DF\) − PE_peça/i)).not.toBeNull()
    expect(screen.getByText(/DF = 0,30/i)).not.toBeNull()
    expect(screen.getByText(/L_i = 1,0/i)).not.toBeNull()

    // §7: Regime de Incerteza T1 a T4 e regras floor/ceil
    expect(
      screen.getByText(
        /§7\. Regime de Incerteza T1–T4, Soma em Quadratura e Regras de Arredondamento/i,
      ),
    ).not.toBeNull()
    expect(
      screen.getByText(
        /Incerteza_lote = √ \[ Σ \(Evitado_peça × u_FE\)² \+ \(Evitado_lote × u_massa\)² \]/i,
      ),
    ).not.toBeNull()
    expect(screen.getByText(/FLOOR em 2 Casas para Emissões Evitadas/i)).not.toBeNull()
    expect(screen.getByText(/CEIL em 2 Casas para Emissões de Projeto \(PE\)/i)).not.toBeNull()

    // §8: Vocabulário Registro Verificável de Custódia
    expect(screen.getByText(/§8\. Registro Verificável de Custódia — dMRV Orbis/i)).not.toBeNull()

    // §9: Não somos certificadora
    expect(
      screen.getByText(
        /§9\. Não Somos Certificadora: Atestado de Conformidade Orbis \(com ART\/RRT\) ≠ Verificação ISO 14064-3/i,
      ),
    ).not.toBeNull()

    // §10: Competência de ajuste e não retroatividade
    expect(
      screen.getByText(
        /§10\. Competência de Ajuste Metodológico, Poder de Redução e Snapshot Prospectivo/i,
      ),
    ).not.toBeNull()
    expect(screen.getByText(/Poder de Redução do Resultado Divulgado/i)).not.toBeNull()
    expect(screen.getByText(/Lotes fechados não recalculam retroativamente/i)).not.toBeNull()

    // Apêndice B e E
    expect(
      screen.getByText(/Apêndice B: Citação de Fontes Oficiais e Status de Validação/i),
    ).not.toBeNull()
    expect(screen.getByText(/Verificado worldsteel 2025/i)).not.toBeNull()
    expect(screen.getByText(/Verificado IAI 2023 \/ Revisão de Magnitude/i)).not.toBeNull()
    expect(screen.getByText(/Verificado CopperMark 2024 \/ ICA/i)).not.toBeNull()
    expect(screen.getByText(/Verificado PlasticsEurope Eco-profiles/i)).not.toBeNull()
    expect(screen.getByText(/Derivação Interna Conservadora/i)).not.toBeNull()
    expect(
      screen.getByText(/Apêndice E: Glossário das 8 Métricas, Unidades e Convenção de Sinal/i),
    ).not.toBeNull()
  })

  it('deve alternar para a aba do Catálogo de Fatores e permitir busca interativa', () => {
    renderComponent()

    const btnAbaCatalogo = screen.getByRole('button', { name: /Catálogo Curado de Fatores/i })
    fireEvent.click(btnAbaCatalogo)

    expect(screen.getByText(/Congelamento Criptográfico/i)).not.toBeNull()
    expect(screen.getByText(/Reserva Metodológica Pré-Laudo/i)).not.toBeNull()

    // Busca interativa
    const inputBusca = screen.getByPlaceholderText(/Buscar por material/i)
    fireEvent.change(inputBusca, { target: { value: 'cobre' } })

    expect(screen.getAllByText(/Cobre \/ Bobinamentos Elétricos/i).length).toBeGreaterThan(0)
  })

  it('deve expandir a tabela do IPCC AR6 dentro da aba de catálogo', () => {
    renderComponent()

    const btnAbaCatalogo = screen.getByRole('button', { name: /Catálogo Curado de Fatores/i })
    fireEvent.click(btnAbaCatalogo)

    const btnVerTabela = screen.getByText('Ver Tabela Completa')
    fireEvent.click(btnVerTabela)

    expect(screen.getByText('Dióxido de Carbono (CO₂)')).not.toBeNull()
    expect(screen.getByText('Hexafluoreto de Enxofre (SF₆)')).not.toBeNull()
  })

  it('deve alternar para a aba de Calculadora/Apêndices e exibir a memória de cálculo do lote demonstrativo (DEMO)', () => {
    renderComponent()

    const btnAbaCalculadora = screen.getByRole('button', {
      name: /Apêndices & Memória de Cálculo/i,
    })
    fireEvent.click(btnAbaCalculadora)

    expect(
      screen.getByText(/Memória de Cálculo de Lote Demonstrativo conforme Motor v2/i),
    ).not.toBeNull()
    expect(screen.getByText('(DEMO) LOTE DEMONSTRATIVO')).not.toBeNull()
    expect(screen.getByText('PART-GOL-CAPO-01 (Capô Motor)')).not.toBeNull()
    expect(screen.getByText('PART-GOL-RODA-01 (Roda Liga Leve)')).not.toBeNull()
    expect(screen.getByText('FLUID-R134A (Carga Climatização)')).not.toBeNull()
    expect(screen.getByText('817,71 kgCO₂e')).not.toBeNull()
  })

  it('deve conter links para a documentação da API e verificador de selos', () => {
    renderComponent()

    const linkApi = screen.getByRole('link', { name: /Ver Documentação da API/i })
    expect(linkApi.getAttribute('href')).toBe('/api-docs-cdv')

    const linkVerificador = screen.getByRole('link', { name: /Verificar Selos & DPP/i })
    expect(linkVerificador.getAttribute('href')).toBe('/verificador')
  })
})
