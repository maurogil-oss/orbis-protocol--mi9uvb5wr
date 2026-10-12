import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import App from '@/App'

describe('Blindagem de Rotas Protegidas e Vitrine /teste (Auditoria UX)', () => {
  it('redireciona rota /demo/fatores-comparativo para /login quando não autenticado', () => {
    window.history.pushState({}, '', '/demo/fatores-comparativo')
    render(<App />)

    // Redireciona para login e preserva redirect query
    expect(window.location.pathname).toBe('/login')
    expect(window.location.search).toContain('redirect=%2Fdemo%2Ffatores-comparativo')
  })

  it('redireciona rota /corporativo para /login quando não autenticado', () => {
    window.history.pushState({}, '', '/corporativo')
    render(<App />)

    expect(window.location.pathname).toBe('/login')
    expect(window.location.search).toContain('redirect=%2Fcorporativo')
  })

  it('redireciona rota /corporativo/dcp para /login quando não autenticado', () => {
    window.history.pushState({}, '', '/corporativo/dcp')
    render(<App />)

    expect(window.location.pathname).toBe('/login')
    expect(window.location.search).toContain('redirect=%2Fcorporativo%2Fdcp')
  })

  it('redireciona rota /teste para /login quando não autenticado', () => {
    window.history.pushState({}, '', '/teste')
    render(<App />)

    expect(window.location.pathname).toBe('/login')
    expect(window.location.search).toContain('redirect=%2Fteste')
  })
})
