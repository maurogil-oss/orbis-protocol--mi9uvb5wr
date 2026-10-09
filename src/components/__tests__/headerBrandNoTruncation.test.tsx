import React from 'react'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect } from 'vitest'
import Layout from '@/components/Layout'

describe('Header Brand Integrity & Non-Truncation (Mobile ~360px & Desktop)', () => {
  it('exibe o nome da marca completo "ORBIS.PROTOCOL" sem reticências ou classe truncate', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/']}>
        <Layout />
      </MemoryRouter>,
    )

    // O link da marca no header
    const brandLink = screen.getByTitle('Orbis Protocol')
    expect(brandLink).toBeDefined()

    // O texto do logotipo
    const logoBrandText = container.querySelector(
      'header a[title="Orbis Protocol"] span.font-heading',
    )
    expect(logoBrandText).not.toBeNull()
    expect(logoBrandText?.textContent).toBe('ORBIS.PROTOCOL')
    expect(logoBrandText?.textContent).not.toContain('…')
    expect(logoBrandText?.textContent).not.toContain('...')
    // NUNCA deve conter a classe truncate
    expect(logoBrandText?.className).not.toContain('truncate')
    // Deve conter whitespace-nowrap para impedir quebras bizarras
    expect(logoBrandText?.className).toContain('whitespace-nowrap')
  })

  it('exibe a tagline institucional "Economia Circular — dMRV" completa sem truncamento', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/']}>
        <Layout />
      </MemoryRouter>,
    )

    const headerTagline = container.querySelector('header a[title="Orbis Protocol"] span.uppercase')
    expect(headerTagline).not.toBeNull()
    expect(headerTagline?.textContent?.trim()).toBe('Economia Circular — dMRV')
    expect(headerTagline?.textContent).toContain('— dMRV')
    expect(headerTagline?.textContent).not.toContain('…')
    expect(headerTagline?.textContent).not.toContain('...')
    // NUNCA deve conter a classe truncate
    expect(headerTagline?.className).not.toContain('truncate')
    expect(headerTagline?.className).toContain('whitespace-nowrap')
  })

  it('mantém actions mobile (ThemeToggle compacto + Hamburger) sem overflow e acessíveis', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/']}>
        <Layout />
      </MemoryRouter>,
    )

    const mobileActions = container.querySelector('header .lg\\:hidden.flex.items-center')
    expect(mobileActions).not.toBeNull()
    expect(mobileActions?.className).toContain('shrink-0')

    const themeToggleBtn = mobileActions?.querySelector('button[title*="Mudar para tema"]')
    expect(themeToggleBtn).not.toBeNull()

    const hamburgerBtn = screen.getByRole('button', { name: /abrir menu/i })
    expect(hamburgerBtn).toBeDefined()
  })
})
