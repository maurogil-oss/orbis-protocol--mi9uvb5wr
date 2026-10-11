import React from 'react'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom'
import { describe, it, expect } from 'vitest'
import { RedirectPreserveQuery } from '@/App'

function LocationProbe({ testId = 'location-display' }: { testId?: string }) {
  const location = useLocation()
  return (
    <div data-testid={testId}>
      <span data-testid="pathname">{location.pathname}</span>
      <span data-testid="search">{location.search}</span>
      <span data-testid="hash">{location.hash}</span>
    </div>
  )
}

describe('Rodada 6 — RedirectPreserveQuery: 6 Redirects com Replace, Preservando Query String e Hash', () => {
  const renderRedirectRoutes = (initialEntry: string) => {
    return render(
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          {/* 1. /bureau -> /solucoes/bureau-acp */}
          <Route path="/bureau" element={<RedirectPreserveQuery to="/solucoes/bureau-acp" />} />
          <Route path="/solucoes/bureau-acp" element={<LocationProbe testId="dest-bureau" />} />

          {/* 2. /cadastro -> /registro */}
          <Route path="/cadastro" element={<RedirectPreserveQuery to="/registro" />} />
          <Route path="/registro" element={<LocationProbe testId="dest-registro" />} />

          {/* 3. /financeiro -> /planos */}
          <Route path="/financeiro" element={<RedirectPreserveQuery to="/planos" />} />
          <Route path="/planos" element={<LocationProbe testId="dest-planos" />} />

          {/* 4. /educacao/painel -> /escolas/painel */}
          <Route path="/educacao/painel" element={<RedirectPreserveQuery to="/escolas/painel" />} />
          <Route path="/escolas/painel" element={<LocationProbe testId="dest-escolas-painel" />} />

          {/* 5. /demo -> /demo/orientada */}
          <Route path="/demo" element={<RedirectPreserveQuery to="/demo/orientada" />} />
          <Route path="/demo/orientada" element={<LocationProbe testId="dest-demo" />} />

          {/* 6. /orbis-educacao -> /educacao */}
          <Route path="/orbis-educacao" element={<RedirectPreserveQuery to="/educacao" />} />
          <Route path="/educacao" element={<LocationProbe testId="dest-educacao" />} />
        </Routes>
      </MemoryRouter>,
    )
  }

  describe('1. /bureau -> /solucoes/bureau-acp', () => {
    it('redireciona caminho simples', () => {
      renderRedirectRoutes('/bureau')
      expect(screen.getByTestId('dest-bureau')).toBeDefined()
      expect(screen.getByTestId('pathname').textContent).toBe('/solucoes/bureau-acp')
      expect(screen.getByTestId('search').textContent).toBe('')
      expect(screen.getByTestId('hash').textContent).toBe('')
    })

    it('preserva parâmetros de consulta e hash', () => {
      renderRedirectRoutes('/bureau?origem=menu&campanha=acp2026#vantagens')
      expect(screen.getByTestId('dest-bureau')).toBeDefined()
      expect(screen.getByTestId('pathname').textContent).toBe('/solucoes/bureau-acp')
      expect(screen.getByTestId('search').textContent).toBe('?origem=menu&campanha=acp2026')
      expect(screen.getByTestId('hash').textContent).toBe('#vantagens')
    })
  })

  describe('2. /cadastro -> /registro', () => {
    it('redireciona caminho simples', () => {
      renderRedirectRoutes('/cadastro')
      expect(screen.getByTestId('dest-registro')).toBeDefined()
      expect(screen.getByTestId('pathname').textContent).toBe('/registro')
      expect(screen.getByTestId('search').textContent).toBe('')
      expect(screen.getByTestId('hash').textContent).toBe('')
    })

    it('preserva query de indicação de parceiro (ex.: ?ref=ORB-PAR-1234) e hash', () => {
      renderRedirectRoutes('/cadastro?ref=ORB-PAR-1234&origem=link_parceiro#formulario')
      expect(screen.getByTestId('dest-registro')).toBeDefined()
      expect(screen.getByTestId('pathname').textContent).toBe('/registro')
      expect(screen.getByTestId('search').textContent).toBe(
        '?ref=ORB-PAR-1234&origem=link_parceiro',
      )
      expect(screen.getByTestId('hash').textContent).toBe('#formulario')
    })
  })

  describe('3. /financeiro -> /planos', () => {
    it('redireciona caminho simples', () => {
      renderRedirectRoutes('/financeiro')
      expect(screen.getByTestId('dest-planos')).toBeDefined()
      expect(screen.getByTestId('pathname').textContent).toBe('/planos')
      expect(screen.getByTestId('search').textContent).toBe('')
      expect(screen.getByTestId('hash').textContent).toBe('')
    })

    it('preserva parâmetros de ciclo/upgrade e hash de seção', () => {
      renderRedirectRoutes('/financeiro?ciclo=anual&upgrade=true#tabela-precos')
      expect(screen.getByTestId('dest-planos')).toBeDefined()
      expect(screen.getByTestId('pathname').textContent).toBe('/planos')
      expect(screen.getByTestId('search').textContent).toBe('?ciclo=anual&upgrade=true')
      expect(screen.getByTestId('hash').textContent).toBe('#tabela-precos')
    })
  })

  describe('4. /educacao/painel -> /escolas/painel', () => {
    it('redireciona caminho simples', () => {
      renderRedirectRoutes('/educacao/painel')
      expect(screen.getByTestId('dest-escolas-painel')).toBeDefined()
      expect(screen.getByTestId('pathname').textContent).toBe('/escolas/painel')
      expect(screen.getByTestId('search').textContent).toBe('')
      expect(screen.getByTestId('hash').textContent).toBe('')
    })

    it('preserva query com id da escola e hash de aba', () => {
      renderRedirectRoutes('/educacao/painel?escola_id=esc-987#turmas')
      expect(screen.getByTestId('dest-escolas-painel')).toBeDefined()
      expect(screen.getByTestId('pathname').textContent).toBe('/escolas/painel')
      expect(screen.getByTestId('search').textContent).toBe('?escola_id=esc-987')
      expect(screen.getByTestId('hash').textContent).toBe('#turmas')
    })
  })

  describe('5. /demo -> /demo/orientada', () => {
    it('redireciona caminho simples', () => {
      renderRedirectRoutes('/demo')
      expect(screen.getByTestId('dest-demo')).toBeDefined()
      expect(screen.getByTestId('pathname').textContent).toBe('/demo/orientada')
      expect(screen.getByTestId('search').textContent).toBe('')
      expect(screen.getByTestId('hash').textContent).toBe('')
    })

    it('preserva parâmetros de caso e hash', () => {
      renderRedirectRoutes('/demo?caso=cdverde&modo=interativo#painel-dmrv')
      expect(screen.getByTestId('dest-demo')).toBeDefined()
      expect(screen.getByTestId('pathname').textContent).toBe('/demo/orientada')
      expect(screen.getByTestId('search').textContent).toBe('?caso=cdverde&modo=interativo')
      expect(screen.getByTestId('hash').textContent).toBe('#painel-dmrv')
    })
  })

  describe('6. /orbis-educacao -> /educacao', () => {
    it('redireciona caminho simples', () => {
      renderRedirectRoutes('/orbis-educacao')
      expect(screen.getByTestId('dest-educacao')).toBeDefined()
      expect(screen.getByTestId('pathname').textContent).toBe('/educacao')
      expect(screen.getByTestId('search').textContent).toBe('')
      expect(screen.getByTestId('hash').textContent).toBe('')
    })

    it('preserva parâmetros de público e hash', () => {
      renderRedirectRoutes('/orbis-educacao?segmento=publica&uf=PR#modulo-alunos')
      expect(screen.getByTestId('dest-educacao')).toBeDefined()
      expect(screen.getByTestId('pathname').textContent).toBe('/educacao')
      expect(screen.getByTestId('search').textContent).toBe('?segmento=publica&uf=PR')
      expect(screen.getByTestId('hash').textContent).toBe('#modulo-alunos')
    })
  })
})
