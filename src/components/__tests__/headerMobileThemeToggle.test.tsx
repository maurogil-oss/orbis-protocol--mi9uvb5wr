import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import Layout from '@/components/Layout'
import { ThemeToggle } from '@/components/ThemeToggle'

describe('ThemeToggle & Mobile Header (Samsung ~360px)', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.classList.remove('dark')
  })

  afterEach(() => {
    localStorage.clear()
    document.documentElement.classList.remove('dark')
  })

  it('ThemeToggle renderiza com size="compact" e classes reduzidas para mobile', () => {
    render(<ThemeToggle size="compact" />)
    const button = screen.getByRole('button', { name: /mudar para tema escuro/i })
    expect(button).toBeDefined()
    expect(button.className).toContain('p-1.5')
    expect(button.className).toContain('rounded-lg')
    expect(button.className).toContain('shrink-0')

    // Ícone da lua em modo claro
    const svgIcon = button.querySelector('svg')
    expect(svgIcon).not.toBeNull()
    expect(svgIcon?.getAttribute('class')).toContain('w-3.5')
    expect(svgIcon?.getAttribute('class')).toContain('h-3.5')
  })

  it('ThemeToggle padrão renderiza com p-2 e w-4 h-4', () => {
    render(<ThemeToggle />)
    const button = screen.getByRole('button', { name: /mudar para tema escuro/i })
    expect(button.className).toContain('p-2')
    expect(button.className).toContain('rounded-xl')

    const svgIcon = button.querySelector('svg')
    expect(svgIcon?.getAttribute('class')).toContain('w-4')
    expect(svgIcon?.getAttribute('class')).toContain('h-4')
  })

  it('ThemeToggle alterna entre claro e escuro mantendo acessibilidade e persistência', () => {
    render(<ThemeToggle />)
    const button = screen.getByRole('button', { name: /mudar para tema escuro/i })

    // Clica para ativar o dark mode
    fireEvent.click(button)
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(localStorage.getItem('orbis-theme')).toBe('dark')
    expect(button.getAttribute('aria-label')).toBe('Mudar para tema claro')

    // Clica novamente para voltar ao light mode
    fireEvent.click(button)
    expect(document.documentElement.classList.contains('dark')).toBe(false)
    expect(localStorage.getItem('orbis-theme')).toBe('light')
    expect(button.getAttribute('aria-label')).toBe('Mudar para tema escuro')
  })

  it('Header mobile contém logo, ThemeToggle compacto e botão hamburger sem colisão', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/']}>
        <Layout />
      </MemoryRouter>,
    )

    // Logotipo no header
    const brandLink = screen.getByTitle('Orbis Protocol')
    expect(brandLink).toBeDefined()
    expect(brandLink.className).toContain('shrink')

    // Título ORBIS.PROTOCOL
    expect(screen.getByText(/ORBIS/i)).toBeDefined()

    // Logotipo e tagline NUNCA devem ter a classe 'truncate' no cabeçalho
    const logoBrandText = screen.getByText(/ORBIS/i).closest('span')
    expect(logoBrandText?.className).not.toContain('truncate')
    expect(logoBrandText?.className).toContain('whitespace-nowrap')

    const headerTagline = screen.getAllByText('Economia Circular — dMRV')[0]
    expect(headerTagline.className).not.toContain('truncate')
    expect(headerTagline.className).toContain('whitespace-nowrap')

    // Botão hamburger sempre visível e com aria-label correto
    const hamburgerBtn = screen.getByRole('button', { name: /abrir menu/i })
    expect(hamburgerBtn).toBeDefined()
    expect(hamburgerBtn.className).toContain('shrink-0')

    // Bloco mobile actions (lg:hidden) agrupa ThemeToggle e Hamburger com shrink-0
    const mobileActions = container.querySelector('.lg\\:hidden.flex.items-center')
    expect(mobileActions).not.toBeNull()
    expect(mobileActions?.className).toContain('shrink-0')
    expect(mobileActions?.className).toContain('gap-1')

    // Dentro do bloco mobile actions há o ThemeToggle compacto
    const mobileToggle = mobileActions?.querySelector('button[title*="Mudar para tema"]')
    expect(mobileToggle).not.toBeNull()
    expect(mobileToggle?.className).toContain('p-1.5')

    // Clicar no hamburger abre o drawer
    fireEvent.click(hamburgerBtn)
    expect(screen.getByRole('button', { name: /fechar menu/i })).toBeDefined()
  })

  it('ThemeToggle e Hamburger preservam contraste em tema claro e escuro', () => {
    const { container, rerender } = render(
      <MemoryRouter initialEntries={['/']}>
        <Layout />
      </MemoryRouter>,
    )

    const mobileActions = container.querySelector('.lg\\:hidden.flex.items-center')
    const mobileToggle = mobileActions?.querySelector('button[title*="Mudar para tema"]')
    const hamburgerBtn = screen.getByRole('button', { name: /abrir menu/i })

    // No tema claro: bg-white, text-slate-500 / text-slate-800
    expect(mobileToggle?.className).toContain('bg-white')
    expect(mobileToggle?.className).toContain('text-slate-500')
    expect(hamburgerBtn.className).toContain('text-slate-800')

    // No tema escuro: dark:bg-[#0E1A2E], dark:text-[#94A3B8] / dark:text-[#F8FAFC]
    expect(mobileToggle?.className).toContain('dark:bg-[#0E1A2E]')
    expect(mobileToggle?.className).toContain('dark:text-[#94A3B8]')
    expect(hamburgerBtn.className).toContain('dark:text-[#F8FAFC]')
  })
})
