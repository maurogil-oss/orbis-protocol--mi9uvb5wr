import React from 'react'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect } from 'vitest'
import { OrbisGlobe } from '@/components/OrbisGlobe'
import { OrbisOrbitalRing, OrbisSectionDivider } from '@/components/OrbisOrbitalRing'
import { PlatformProofScreenshots } from '@/components/PlatformProofScreenshots'
import { AssistenteOrbisWidget } from '@/components/AssistenteOrbisWidget'
import { BalancoMassaVeiculoSection } from '@/components/BalancoMassaVeiculoSection'
import {
  DEMO_DESTINACAO_CLIO,
  estruturarCamadasDestinacao,
} from '@/services/destinacaoFinalService'

describe('Fase 1 Tema Claro/Escuro na Home e Componentes Principais', () => {
  it('renderiza OrbisGlobe com classes duplas claro/escuro e traço com contraste visível', () => {
    const { container } = render(<OrbisGlobe size={48} />)
    const globe = container.firstChild as HTMLElement
    expect(globe).toBeDefined()
    // Contraste do halo para claro/escuro
    expect(container.innerHTML).toContain('dark:bg-[#12B886]/25')
    expect(container.innerHTML).toContain('border-slate-300/70')
  })

  it('renderiza OrbisOrbitalRing e OrbisSectionDivider com traço grafite no claro e preservação no escuro', () => {
    const { container: ringContainer } = render(<OrbisOrbitalRing size={64} showCore />)
    expect(ringContainer.innerHTML).toContain('stroke-[url(#orbitalGradientEmeraldLight)]')
    expect(ringContainer.innerHTML).toContain('dark:stroke-[url(#orbitalGradientEmerald)]')
    expect(ringContainer.innerHTML).toContain('stroke-slate-400/40')

    const { container: dividerContainer } = render(<OrbisSectionDivider label="DIVISOR DE PROVA" />)
    expect(screen.getByText('DIVISOR DE PROVA')).toBeDefined()
    expect(dividerContainer.innerHTML).toContain('via-slate-300')
    expect(dividerContainer.innerHTML).toContain('dark:via-[rgba(244,247,250,0.08)]')
    expect(dividerContainer.innerHTML).toContain('text-slate-700')
    expect(dividerContainer.innerHTML).toContain('dark:text-[#93A3B5]/80')
  })

  it('renderiza PlatformProofScreenshots com título, moldura e abas adaptados para claro e escuro', () => {
    render(<PlatformProofScreenshots />)
    expect(screen.getByText('INTERFACES REAIS DO PROTOCOLO')).toBeDefined()
    expect(screen.getByText('PROVA REAL EM PRODUÇÃO')).toBeDefined()
    expect(screen.getByText('Central de Radar')).toBeDefined()
    expect(screen.getByText('Verificador de Selos')).toBeDefined()
    expect(screen.getByText('Passaporte Digital')).toBeDefined()

    const heading = screen.getByText('INTERFACES REAIS DO PROTOCOLO')
    expect(heading.className).toContain('text-slate-900')
    expect(heading.className).toContain('dark:text-[#F4F7FA]')
  })

  it('renderiza AssistenteOrbisWidget no tema claro/escuro com texto de contraste legível', () => {
    render(
      <MemoryRouter>
        <AssistenteOrbisWidget />
      </MemoryRouter>,
    )
    expect(screen.getByText('Assistente Orbis')).toBeDefined()
    expect(screen.getByText('Pré-qualificação IA')).toBeDefined()
  })

  it('renderiza BalancoMassaVeiculoSection com classes duplas claro/escuro e contraste nos indicadores', () => {
    const lote = estruturarCamadasDestinacao(DEMO_DESTINACAO_CLIO, {
      id: 'demo-clio',
      baixa: 'BX-2025-001',
      modelo: 'Renault Clio 1.0 16V 2012',
    })
    render(<BalancoMassaVeiculoSection balanco={lote.balancoMassa} />)
    expect(screen.getByText(/Balanço de Massa & Taxa de Valorização Circular/i)).toBeDefined()
    expect(screen.getByText('INDICADOR OFICIAL • BALANÇO DE MASSA DO VEÍCULO DOADOR')).toBeDefined()
    expect(screen.getByText('Massa Estimada (Curbside)')).toBeDefined()

    // O container principal deve ter classes duplas
    const heading = screen.getByText(/Balanço de Massa & Taxa de Valorização Circular/i)
    expect(heading.className).toContain('text-slate-900')
    expect(heading.className).toContain('dark:text-[#F4F7FA]')
  })
})
