import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import FatoresComparativoDemoPage from '../FatoresComparativoDemoPage'

describe('FatoresComparativoDemoPage (/demo/fatores-comparativo)', () => {
  it('deve renderizar a página com a matriz de fatores comparativos Orbis vs. mercado real', () => {
    render(
      <MemoryRouter initialEntries={['/demo/fatores-comparativo']}>
        <FatoresComparativoDemoPage />
      </MemoryRouter>,
    )

    // Título e escopo
    expect(screen.getByText(/Fatores Orbis vs. Mercado Real/i)).toBeDefined()
    expect(screen.getByText(/Anexo Técnico Demo • Material Interno & Pericial/i)).toBeDefined()

    // Comparativos essenciais exigidos
    // Aço: 2,18 vs Gerdau 0,85
    expect(screen.getByText(/Aço Laminado \/ Estampado/i)).toBeDefined()
    expect(screen.getByText(/worldsteel Association/i)).toBeDefined()
    expect(screen.getByText(/Gerdau \(Rota Scrap\/EAF Nacional\) ~0,85 kgCO₂e\/kg/i)).toBeDefined()

    // Alumínio: 14,40 vs Hydro 14,8 / 0,52
    expect(screen.getByText(/Alumínio Primário Automotivo/i)).toBeDefined()
    expect(
      screen.getByText(/International Aluminium Institute \(IAI 2024 Data Release\)/i),
    ).toBeDefined()
    expect(
      screen.getByText(/Hydro Alumínio Primário Global 14,8 \/ Alumínio Reciclado Circular ~0,52/i),
    ).toBeDefined()

    // Cobre: 4,10 vs CopperMark
    expect(screen.getByText(/Cobre \/ Bobinamentos Elétricos/i)).toBeDefined()
    expect(
      screen.getByText(/International Copper Association \(ICA 2024 LCI\/LCA Global\)/i),
    ).toBeDefined()
    expect(screen.getByText(/CopperMark \/ Estudo Ecoinvent 3.9/i)).toBeDefined()

    // Polímeros: 1,90 com flag pendente
    expect(screen.getByText(/Polímeros Automotivos \(PP \/ EPDM \/ ABS\)/i)).toBeDefined()
    expect(screen.getByText(/Pendente de Verificação de Fonte Adicional/i)).toBeDefined()

    // Refrigerantes AR6
    expect(screen.getByText(/Gás Refrigerante R-134a \(HFC-134a Recuperado\)/i)).toBeDefined()
    expect(screen.getByText(/Gás Refrigerante R-1234yf \(HFO-1234yf Recuperado\)/i)).toBeDefined()

    // Eletricidade SIN
    expect(screen.getByText(/Eletricidade Rede SIN \(Localização MCTI\)/i)).toBeDefined()
  })

  it('deve exibir a seção de CO₂e evitado no mercado com Schneider Electric e eureciclo e o diferencial Orbis', () => {
    render(
      <MemoryRouter initialEntries={['/demo/fatores-comparativo']}>
        <FatoresComparativoDemoPage />
      </MemoryRouter>,
    )

    expect(screen.getByText(/Schneider Electric/i)).toBeDefined()
    expect(screen.getByText(/eureciclo/i)).toBeDefined()
    expect(screen.getByText(/O Diferencial Crítico da Orbis Protocol/i)).toBeDefined()
    expect(
      screen.getByText(
        /prova documental unitária com hash criptográfico SHA-256 por peça e por lote/i,
      ),
    ).toBeDefined()
  })

  it('deve conter a resposta ao auditor sobre o uso do fator global conservador em vez do produtor nacional (§7 DM-ORB-001 v1.1)', () => {
    render(
      <MemoryRouter initialEntries={['/demo/fatores-comparativo']}>
        <FatoresComparativoDemoPage />
      </MemoryRouter>,
    )

    expect(
      screen.getByText(
        /Por que a Orbis utiliza fatores globais médios em vez da intensidade de carbono do produtor nacional\?/i,
      ),
    ).toBeDefined()
    expect(
      screen.getByText(
        /hierarquia metodológica estabelecida na Seção 7 da Diretriz DM-ORB-001 v1.1/i,
      ),
    ).toBeDefined()
    expect(screen.getByText(/Nível 1 • Default Conservador Citável/i)).toBeDefined()
    expect(screen.getByText(/Nível 2 • Substituição por EPD \/ LCI com ART/i)).toBeDefined()
  })
})
