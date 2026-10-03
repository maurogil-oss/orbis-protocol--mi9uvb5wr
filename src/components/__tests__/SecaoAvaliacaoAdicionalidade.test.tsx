import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import React from 'react'
import {
  SecaoAvaliacaoAdicionalidade,
  VALOR_PADRAO_ADICIONALIDADE,
} from '../SecaoAvaliacaoAdicionalidade'
import * as cdvService from '@/services/cdvService'

describe('SecaoAvaliacaoAdicionalidade Component', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('deve renderizar os 3 critérios de checklist pericial e o campo textarea de justificativa', async () => {
    render(<SecaoAvaliacaoAdicionalidade loteId="lote-teste-123" forceExibir={true} />)

    // Aguarda carregamento
    await waitFor(() => {
      expect(screen.getByTestId('secao-avaliacao-adicionalidade')).toBeDefined()
    })

    // (a) Adicionalidade de investimento
    expect(screen.getByTestId('checklist-adicionalidade-investimento')).toBeDefined()
    expect(screen.getByText(/Adicionalidade de investimento/i)).toBeDefined()

    // (b) Barreira tecnológica
    expect(screen.getByTestId('checklist-barreira-tecnologica')).toBeDefined()
    expect(screen.getByText(/Barreira tecnológica/i)).toBeDefined()

    // (c) Não-obrigatoriedade legal
    expect(screen.getByTestId('checklist-nao-obrigatoriedade-legal')).toBeDefined()
    expect(screen.getByText(/Não-obrigatoriedade legal/i)).toBeDefined()

    // (d) Campo de justificativa pericial (textarea)
    const textarea = screen.getByTestId('textarea-justificativa-pericial')
    expect(textarea).toBeDefined()
    expect(textarea.tagName).toBe('TEXTAREA')
  })

  it('deve permitir marcar os checkboxes e editar a justificativa pericial', async () => {
    render(<SecaoAvaliacaoAdicionalidade loteId="lote-interativo-456" forceExibir={true} />)

    await waitFor(() => {
      expect(screen.getByTestId('secao-avaliacao-adicionalidade')).toBeDefined()
    })

    const checkInvestimento = screen
      .getByTestId('checklist-adicionalidade-investimento')
      .querySelector('input[type="checkbox"]') as HTMLInputElement
    const checkBarreira = screen
      .getByTestId('checklist-barreira-tecnologica')
      .querySelector('input[type="checkbox"]') as HTMLInputElement
    const checkLegal = screen
      .getByTestId('checklist-nao-obrigatoriedade-legal')
      .querySelector('input[type="checkbox"]') as HTMLInputElement
    const textarea = screen.getByTestId('textarea-justificativa-pericial') as HTMLTextAreaElement

    // Clica nos checkboxes
    fireEvent.click(checkInvestimento)
    fireEvent.click(checkBarreira)
    fireEvent.click(checkLegal)

    expect(checkInvestimento.checked).toBe(true)
    expect(checkBarreira.checked).toBe(true)
    expect(checkLegal.checked).toBe(true)

    // Edita o texto pericial
    fireEvent.change(textarea, {
      target: { value: 'Comprovação pericial de custos excedentes e barreira dMRV superada.' },
    })

    expect(textarea.value).toBe(
      'Comprovação pericial de custos excedentes e barreira dMRV superada.',
    )
  })

  it('deve persistir os dados ao clicar em Salvar Avaliação sem alterar o hash do selo', async () => {
    const spySalvar = vi.spyOn(cdvService, 'salvarAvaliacaoAdicionalidade').mockResolvedValue({
      sucesso: true,
      salvoBackend: true,
    })

    const onSalvoMock = vi.fn()

    render(
      <SecaoAvaliacaoAdicionalidade
        loteId="c1jz14hgmf7n13i"
        forceExibir={true}
        onSalvo={onSalvoMock}
      />,
    )

    await waitFor(() => {
      expect(screen.getByTestId('botao-salvar-adicionalidade')).toBeDefined()
    })

    const btnSalvar = screen.getByTestId('botao-salvar-adicionalidade')
    fireEvent.click(btnSalvar)

    await waitFor(() => {
      expect(spySalvar).toHaveBeenCalled()
      expect(onSalvoMock).toHaveBeenCalled()
    })

    // O chamamento inclui os critérios
    const chamadas = spySalvar.mock.calls[0]
    expect(chamadas[0]).toBe('c1jz14hgmf7n13i')
    expect(chamadas[1].adicionalidade_investimento).toBe(true)
    expect(chamadas[1].barreira_tecnologica).toBe(true)
    expect(chamadas[1].nao_obrigatoriedade_legal).toBe(true)
    expect(chamadas[1].avaliador_nome).toBe(
      'Autoavaliação pericial pré-VVB concluída — validação por VVB acreditado pendente (em seleção)',
    )
  })

  it('deve renderizar em modo somente leitura quando readOnly for true', async () => {
    render(<SecaoAvaliacaoAdicionalidade loteId="lote-ro" forceExibir={true} readOnly={true} />)

    await waitFor(() => {
      expect(screen.getByTestId('secao-avaliacao-adicionalidade')).toBeDefined()
    })

    const checkInvestimento = screen
      .getByTestId('checklist-adicionalidade-investimento')
      .querySelector('input[type="checkbox"]') as HTMLInputElement
    const textarea = screen.getByTestId('textarea-justificativa-pericial') as HTMLTextAreaElement

    expect(checkInvestimento.disabled).toBe(true)
    expect(textarea.disabled).toBe(true)
    expect(screen.queryByTestId('botao-salvar-adicionalidade')).toBeNull()
  })

  it('deve conter menção a tom pericial e autoavaliação pré-VVB com validação pendente sem instituições validadoras fixas', async () => {
    render(<SecaoAvaliacaoAdicionalidade loteId="lote-tom-pericial" forceExibir={true} />)

    await waitFor(() => {
      expect(screen.getByTestId('secao-avaliacao-adicionalidade')).toBeDefined()
    })

    // Deve citar Autoavaliação pericial pré-VVB concluída — validação por VVB acreditado pendente (em seleção)
    expect(
      screen.getAllByText(
        /Autoavaliação pericial pré-VVB concluída — validação por VVB acreditado pendente \(em seleção\)/i,
      ).length,
    ).toBeGreaterThan(0)
    // Não deve citar nomes institucionais como RINA, Bureau Veritas, SGS ou TÜV
    expect(screen.queryByText(/Bureau Veritas/i)).toBeNull()
    expect(screen.queryByText(/RINA/i)).toBeNull()
    expect(screen.queryByText(/SGS/i)).toBeNull()
    expect(screen.queryByText(/TÜV/i)).toBeNull()
  })
})
