import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { RevisorExternoF6Page } from '../RevisorExternoF6Page';

describe('FRENTE A — Pacote do Revisor Externo (/revisor-f6)', () => {
  it('renderiza o cabeçalho oficial da auditoria cega DM-ORB-001 v1.1', () => {
    render(
      <BrowserRouter>
        <RevisorExternoF6Page />
      </BrowserRouter>
    );

    expect(screen.getByText(/DM-ORB-001 v1.1 • AUDITORIA CEGA DE RECÁLCULO/i)).toBeInTheDocument();
    expect(screen.getByText(/Dossiê Pericial do Revisor Independente/i)).toBeInTheDocument();
    expect(screen.getByText(/Lote em Auditoria:/i)).toBeInTheDocument();
  });

  it('apresenta os dados de entrada das 3 peças do lote VW Gol', () => {
    render(
      <BrowserRouter>
        <RevisorExternoF6Page />
      </BrowserRouter>
    );

    // 1. Capô dianteiro (aço, 10,0 kg, destinada via NF-e 1234)
    expect(screen.getByText(/Capô dianteiro automotivo/i)).toBeInTheDocument();
    expect(screen.getByText(/10.00 kg/i)).toBeInTheDocument();
    expect(screen.getByText(/NF-e 1234/i)).toBeInTheDocument();

    // 2. Alternador/estator (cobre, 2,5 kg, destinada via MTR 4410)
    expect(screen.getByText(/Alternador \/ Estator com enrolamento de cobre/i)).toBeInTheDocument();
    expect(screen.getByText(/2.50 kg/i)).toBeInTheDocument();
    expect(screen.getByText(/MTR 4410/i)).toBeInTheDocument();

    // 3. Parachoque dianteiro (polímeros, 4,0 kg, em estoque sem destinação)
    expect(screen.getByText(/Parachoque dianteiro plástico \/ polímeros/i)).toBeInTheDocument();
    expect(screen.getByText(/4.00 kg/i)).toBeInTheDocument();
    expect(screen.getByText(/Em estoque \(sem destinação\)/i)).toBeInTheDocument();
  });

  it('CRÍTICO: não contém o número esperado (12,87) nem valores calculados pelo motor de emissões', () => {
    const { container } = render(
      <BrowserRouter>
        <RevisorExternoF6Page />
      </BrowserRouter>
    );

    const textoCompleto = container.textContent || '';

    // Proibido conter 12,87 (resultado esperado da soma confirmada do motor)
    expect(textoCompleto).not.toContain('12,87');
    expect(textoCompleto).not.toContain('12.87');

    // Fatores de emissão do DM devem estar presentes
    expect(textoCompleto).toContain('2,18');
    expect(textoCompleto).toContain('5,40');
    expect(textoCompleto).toContain('1,90');
    expect(textoCompleto).toContain('0,30'); // DF
  });

  it('contém a folha de respostas e o termo de atestado pericial', () => {
    render(
      <BrowserRouter>
        <RevisorExternoF6Page />
      </BrowserRouter>
    );

    expect(screen.getByText(/Folha de Resposta e Julgamento Pericial/i)).toBeInTheDocument();
    expect(screen.getByText(/Atestado de Conformidade Orbis \(com ART\/RRT vinculada\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Parecer Pericial de Divergência/i)).toBeInTheDocument();
  });
});
