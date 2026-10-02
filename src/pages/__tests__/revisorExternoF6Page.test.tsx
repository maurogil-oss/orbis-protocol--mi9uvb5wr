import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'
import { BrowserRouter } from 'react-router-dom'
import { RevisorExternoF6Page } from '../RevisorExternoF6Page'

describe('Pacote do Revisor Externo da Auditoria de Reprodução F6 (/auditoria-f6)', () => {
  it('1. Renderiza a capa com o cabeçalho oficial, instruções cegas e dados do lote', () => {
    render(
      <BrowserRouter>
        <RevisorExternoF6Page />
      </BrowserRouter>,
    )

    expect(
      screen.getByText(/DM-ORB-001 v1.1 • PACOTE DE AUDITORIA DE REPRODUÇÃO EXTERNA \(F6\)/i),
    ).not.toBeNull()
    expect(screen.getByText(/Dossiê do Revisor Pericial Independente/i)).not.toBeNull()
    expect(screen.getByText(/Protocolo de Auditoria Cega/i)).not.toBeNull()
    expect(screen.getByText(/Lote Piloto Auditado/i)).not.toBeNull()
    expect(screen.getByText(/VW Gol 1.6 \(3 peças\)/i)).not.toBeNull()
  })

  it('2. Apresenta o Termo de Declaração de Independência com campos e checkbox', () => {
    render(
      <BrowserRouter>
        <RevisorExternoF6Page />
      </BrowserRouter>,
    )

    expect(
      screen.getByText(/Termo de Declaração de Independência e Ausência de Acesso Prévio/i),
    ).not.toBeNull()
    expect(screen.getByText(/Nome Completo do Revisor:/i)).not.toBeNull()
    expect(screen.getByText(/Vínculo Institucional \/ Empresa:/i)).not.toBeNull()
    expect(screen.getByText(/Registro de Classe \(CREA\/CFT\/CRQ\):/i)).not.toBeNull()

    const checkbox = screen.getByRole('checkbox', {
      name: /Confirmo que recebi este pacote para auditoria cega/i,
    }) as HTMLInputElement
    expect(checkbox).not.toBeNull()
    expect(checkbox.checked).toBe(false)

    fireEvent.click(checkbox)
    expect(checkbox.checked).toBe(true)
    expect(screen.getByText(/Termo Aceito/i)).not.toBeNull()
  })

  it('3. Apresenta a tabela completa dos dados de entrada do lote Gol real (3 peças)', () => {
    render(
      <BrowserRouter>
        <RevisorExternoF6Page />
      </BrowserRouter>,
    )

    // Dados do veículo e CDV
    expect(screen.getByText(/CDVerde Centro de Desmontagem Veicular/i)).not.toBeNull()
    expect(screen.getByText(/PR-BX-2026-991204/i)).not.toBeNull()
    expect(screen.getByText(/Balança Calibrada \(Aferida\)/i)).not.toBeNull()

    // 1. Capô dianteiro (aço, 10,0 kg, destinada via NF-e 1234)
    expect(screen.getByText(/PART-GOL-CAPO-01/i)).not.toBeNull()
    expect(screen.getByText(/Capô dianteiro automotivo estampado/i)).not.toBeNull()
    expect(screen.getByText(/10.00 kg/i)).not.toBeNull()
    expect(screen.getByText(/NF-e 1234/i)).not.toBeNull()
    expect(screen.getByText(/Claim CONFIRMADO/i)).not.toBeNull()

    // 2. Alternador/estator (cobre, 2,5 kg, destinada via MTR 4410)
    expect(screen.getByText(/PART-GOL-ESTAT-01/i)).not.toBeNull()
    expect(
      screen.getByText(/Alternador \/ Estator com enrolamento de cobre eletrolítico/i),
    ).not.toBeNull()
    expect(screen.getByText(/2.50 kg/i)).not.toBeNull()
    expect(screen.getByText(/MTR 4410/i)).not.toBeNull()

    // 3. Parachoque dianteiro (polímeros, 4,0 kg, em estoque sem destinação)
    expect(screen.getByText(/PART-GOL-PARAC-01/i)).not.toBeNull()
    expect(
      screen.getByText(/Parachoque dianteiro termoplástico \(PP\/EPDM blend\)/i),
    ).not.toBeNull()
    expect(screen.getByText(/4.00 kg/i)).not.toBeNull()
    expect(screen.getByText(/Em estoque \(sem destinação documental\)/i)).not.toBeNull()
    expect(screen.getByText(/Claim POTENCIAL/i)).not.toBeNull()
  })

  it('4. Contém a seção de conferência com controle de revelação (gabarito 12,87 kgCO₂e ±2,64%)', () => {
    render(
      <BrowserRouter>
        <RevisorExternoF6Page />
      </BrowserRouter>,
    )

    expect(
      screen.getByText(/Gabarito Oficial de Reprodução e Critério de Aceite Pericial/i),
    ).not.toBeNull()
    expect(
      screen.getByText(
        /ABRIR SOMENTE APÓS CONCLUIR O RECÁLCULO INDEPENDENTE NA FOLHA DE RESPOSTA/i,
      ),
    ).not.toBeNull()

    // Botão de abrir gabarito
    const botaoAbrir = screen.getByRole('button', { name: /Abrir Gabarito de Conferência/i })
    expect(botaoAbrir).not.toBeNull()

    // Clicar para abrir a conferência
    fireEvent.click(botaoAbrir)

    // Valores oficiais agora visíveis
    expect(screen.getByText('12,87 kgCO₂e')).not.toBeNull()
    expect(screen.getByText('10,59 kgCO₂e')).not.toBeNull()
    expect(screen.getByText('2,28 kgCO₂e')).not.toBeNull()
    expect(screen.getByText('± 2,64%')).not.toBeNull()
    expect(screen.getByText(/Critério Estrito de Aceite Pericial/i)).not.toBeNull()
  })

  it('5. Rodapé contém referência cruzada ao DM v1.1 em /fatores e ao verificador', () => {
    render(
      <BrowserRouter>
        <RevisorExternoF6Page />
      </BrowserRouter>,
    )

    expect(screen.getByText(/orbis-protocol\.com\/fatores/i)).not.toBeNull()
    expect(screen.getByText(/orbis-protocol\.com\/verificador/i)).not.toBeNull()
    expect(screen.getByText(/Auditoria F6 Reproduzida/i)).not.toBeNull()
  })
})
