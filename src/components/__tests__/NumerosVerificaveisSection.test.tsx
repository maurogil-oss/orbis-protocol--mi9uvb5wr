import React from 'react'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect } from 'vitest'
import { NumerosVerificaveisSection } from '@/components/NumerosVerificaveisSection'

describe('NumerosVerificaveisSection Component (Caso Real VERTEC)', () => {
  it('renderiza o cabeçalho do caso real VERTEC em produção', () => {
    render(
      <MemoryRouter>
        <NumerosVerificaveisSection />
      </MemoryRouter>,
    )

    const tituloCaso = screen.getByText('CASO REAL DE PRODUÇÃO: LOTE VERTEC')
    expect(tituloCaso).toBeDefined()
    expect(tituloCaso.className).not.toContain('text-ellipsis')
    expect(tituloCaso.className).not.toContain('overflow-hidden')
    expect(tituloCaso.className).toContain('text-[clamp(')
    expect(screen.getByText(/VERTEC-IW29-2022/)).toBeDefined()
    expect(screen.getByText(/Pan Urania \(NFs 157 e 158\)/)).toBeDefined()
  })

  it('renderiza os 4 dados reais apurados do lote VERTEC', () => {
    render(
      <MemoryRouter>
        <NumerosVerificaveisSection />
      </MemoryRouter>,
    )

    // 152 painéis
    expect(screen.getByText('152 painéis')).toBeDefined()
    // 4.077 kgCO₂e
    expect(screen.getByText('4.077 kgCO₂e')).toBeDefined()
    // 1.223 kgCO₂e evitado preliminar
    expect(screen.getByText('1.223 kgCO₂e')).toBeDefined()
    expect(screen.getByText('evitado preliminar')).toBeDefined()
    // Atestado Orbis com ART/RRT
    expect(screen.getByText('Com ART/RRT')).toBeDefined()
  })

  it('renderiza o badge Real de origem', () => {
    render(
      <MemoryRouter>
        <NumerosVerificaveisSection />
      </MemoryRouter>,
    )

    expect(screen.getByText('Real')).toBeDefined()
  })

  it('não utiliza termos proibidos como Selo Oficial ou Certificado no componente', () => {
    const { container } = render(
      <MemoryRouter>
        <NumerosVerificaveisSection />
      </MemoryRouter>,
    )

    expect(container.textContent).not.toContain('Selos Oficiais Emitidos')
    expect(container.textContent).not.toContain('Selo Oficial')
    expect(container.textContent).not.toContain('Certificação')
    expect(container.textContent).not.toContain('Certificado')
  })
})
