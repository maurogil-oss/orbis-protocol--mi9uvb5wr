import React from 'react'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, vi } from 'vitest'
import { NumerosVerificaveisSection } from '@/components/NumerosVerificaveisSection'

// Mock do metricasHomeService para controlar os retornos nos testes
vi.mock('@/services/metricasHomeService', () => ({
  obterNumerosVerificaveis: vi.fn().mockResolvedValue({
    selosEmitidos: 42,
    lastrosEmitidos: 5,
    manifestosSinir: 0,
    pecasRastreadas: 120,
    consultasDpp: 300,
    carregando: false,
    erro: false,
  }),
}))

describe('NumerosVerificaveisSection Component', () => {
  it('renderiza o cabeçalho da seção com o novo texto de introdução', async () => {
    render(
      <MemoryRouter>
        <NumerosVerificaveisSection />
      </MemoryRouter>,
    )

    expect(screen.getByText('NÚMEROS VERIFICÁVEIS')).toBeDefined()
    expect(
      screen.getByText(
        'Números consultáveis em tempo real na infraestrutura PocketBase; registros de demonstração identificados.',
      ),
    ).toBeDefined()
  })

  it('renderiza os 3 cards do ambiente demo com títulos, subtítulos e badges "Demo"', async () => {
    render(
      <MemoryRouter>
        <NumerosVerificaveisSection />
      </MemoryRouter>,
    )

    // 1. Atestados Orbis Emitidos
    expect(screen.getByText('Atestados Orbis Emitidos')).toBeDefined()
    expect(
      screen.getByText(
        'Atestados de Conformidade Orbis (com ART/RRT) com hash canônico, no ambiente demo',
      ),
    ).toBeDefined()

    // 2. Peças no Ambiente Demo
    expect(screen.getByText('Peças no Ambiente Demo')).toBeDefined()
    expect(
      screen.getByText(
        'Componentes automotivos catalogados com DPP e CO2e evitado, no ambiente demo',
      ),
    ).toBeDefined()

    // 3. Consultas no Ambiente Demo
    expect(screen.getByText('Consultas no Ambiente Demo')).toBeDefined()
    expect(
      screen.getByText(
        'Auditorias públicas e conferências dpp_consultas registradas, no ambiente demo',
      ),
    ).toBeDefined()

    // Badges "Demo" presentes nos 3 cards demo
    const badgesDemo = screen.getAllByText('Demo')
    expect(badgesDemo.length).toBe(3)
  })

  it('mantém os cards de Lastros e Manifestos com status Ativo / Em homologação', async () => {
    render(
      <MemoryRouter>
        <NumerosVerificaveisSection />
      </MemoryRouter>,
    )

    // Lastros de Circularidade (volume = 5 > 0 => Ativo)
    expect(screen.getByText('Lastros de Circularidade')).toBeDefined()
    expect(screen.getByText('Ativo')).toBeDefined()

    // Manifestos MTR-SINIR (volume = 0 => Em homologação)
    expect(screen.getByText('Manifestos MTR-SINIR')).toBeDefined()
    expect(screen.getByText('Em homologação')).toBeDefined()
  })

  it('não utiliza termos proibidos como Selo Oficial ou Certificado no componente', () => {
    const { container } = render(
      <MemoryRouter>
        <NumerosVerificaveisSection />
      </MemoryRouter>,
    )

    expect(container.textContent).not.toContain('Selos Oficiais Emitidos')
    expect(container.textContent).not.toContain('Selo Oficial')
  })
})
