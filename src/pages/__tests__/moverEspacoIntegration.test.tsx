import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import MoverPublicPage from '../MoverPublicPage'
import DossieMoverPage from '../DossieMoverPage'
import BureauACP from '../BureauACP'
import {
  DECLARACAO_PIONEIRISMO_DEFENSAVEL,
  RESERVA_METODOLOGICA_PRE_LAUDO,
  OS_QUATRO_PAPEIS_PROGRAMA,
  listarMoverVpas,
  listarMoverEvidencias,
} from '@/services/moverService'

// Mock do AuthContext para testar páginas protegidas
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'usr-admin-test', email: 'auditor@orbisprotocol.org', name: 'Auditor Chefe' },
    isAuthenticated: true,
    isAdminOrPerito: true,
    logout: vi.fn(),
  }),
}))

describe('Espaço MOVER — Camadas 1, 2 e 3 (Regras e Alinhamento Metodológico)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('Camada 1 (/mover): expande siglas VPA, VVB e MRV na primeira ocorrência e afirma alinhamento GS 448', async () => {
    render(
      <MemoryRouter initialEntries={['/mover']}>
        <Routes>
          <Route path="/mover" element={<MoverPublicPage />} />
        </Routes>
      </MemoryRouter>,
    )

    // 1. Siglas expandidas
    expect(
      screen.getAllByText(
        /VVB \(Validation and Verification Body — Organismo de Validação e Verificação\)/i,
      ).length,
    ).toBeGreaterThan(0)
    expect(
      screen.getAllByText(/MRV \(Monitoramento, Relato e Verificação\)/i).length,
    ).toBeGreaterThan(0)
    expect(
      screen.getAllByText(/VPA \(Voluntary Project Activity — Área de Projeto Voluntário\)/i)
        .length,
    ).toBeGreaterThan(0)

    // 2. Alinhamento GS 448
    expect(screen.getAllByText(/ALINHAMENTO À METODOLOGIA GS 448/i).length).toBeGreaterThan(0)
    expect(screen.getByText(/Nota de Alinhamento Metodológico \(Aviso Legal\):/i)).not.toBeNull()

    // 3. Pioneirismo defensável
    expect(
      screen.getAllByText(/Estruturada para atender aos requisitos da metodologia GS 448/i).length,
    ).toBeGreaterThan(0)
    expect(
      screen.getAllByText(
        /A Orbis está estruturando a cadeia completa de validação com entidade independentemente acreditada/i,
      ).length,
    ).toBeGreaterThan(0)

    // 4. Os 4 papéis separados com "instituto de pesquisa e inovação a ser contratado — negociação em curso"
    expect(
      screen.getAllByText(
        /instituto de pesquisa e inovação a ser contratado — negociação em curso/i,
      ).length,
    ).toBeGreaterThan(0)
    expect(screen.getAllByText(/Em definição/i).length).toBeGreaterThan(0)

    // 5. Reserva pré-laudo
    expect(
      screen.getAllByText(/Estimativa pré-laudo, sujeita a validação por VVB/i).length,
    ).toBeGreaterThan(0)

    // 6. Botão de cópia do hash canônico
    const copiarBtn = screen.getByRole('button', { name: /Copiar Hash/i })
    expect(copiarBtn).not.toBeNull()
  })

  it('Camada 2 (Cockpit Bureau ACP): aba Programa Carbono com card de elegibilidade e reserva pré-laudo', async () => {
    render(
      <MemoryRouter initialEntries={['/bureau']}>
        <Routes>
          <Route path="/bureau" element={<BureauACP />} />
        </Routes>
      </MemoryRouter>,
    )

    // Botão da aba Programa Carbono
    const abaCarbonoBtn = await screen.findByRole('button', {
      name: /Programa Carbono • CDVs/i,
    })
    expect(abaCarbonoBtn).not.toBeNull()

    // Alternar para a aba Programa Carbono
    fireEvent.click(abaCarbonoBtn)

    // Card de elegibilidade CDV Conforme e métricas
    expect(
      await screen.findByText(/MONITORAMENTO DE CDVs & ELEGIBILIDADE AO PROGRAMA CARBONO/i),
    ).not.toBeNull()
    expect(screen.getAllByText(/Selo CDV Conforme/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Status: Obtido/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Volume VFV Declarado/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Emissões Evitadas \(Estimativa\)/i).length).toBeGreaterThan(0)
    expect(
      screen.getAllByText(/Composição de Materiais & Fatores de Substituição \(GS 448\)/i).length,
    ).toBeGreaterThan(0)
    expect(screen.getAllByText(/Sujeito a validação do VVB/i).length).toBeGreaterThan(0)
  })

  it('Camada 3 (Dossiê do Projeto /dossie-mover): VPAs em estados honestos, baseline pendente, matriz de dupla contagem e evidências', async () => {
    render(
      <MemoryRouter initialEntries={['/dossie-mover']}>
        <Routes>
          <Route path="/dossie-mover" element={<DossieMoverPage />} />
        </Routes>
      </MemoryRouter>,
    )

    // 1. Título e cabeçalho da Camada 3
    expect(await screen.findByText(/DOSSIÊ DO PROJETO MOVER \(GS 448\)/i)).not.toBeNull()

    // 2. Status dos VPAs com estado honesto (aberto a candidatos)
    expect(screen.getByText(/STATUS DOS VPAs \(VOLUNTARY PROJECT ACTIVITIES\)/i)).not.toBeNull()
    expect(screen.getAllByText(/Cadastro Aberto — Aguardando Candidatos/i).length).toBeGreaterThan(
      0,
    )

    // 3. Baseline regional com estudo pendente de contratação
    expect(screen.getByText(/Estudo de Baseline Regional Brasileiro \(GS 448\)/i)).not.toBeNull()
    expect(screen.getAllByText(/Estudo pendente de contratação/i).length).toBeGreaterThan(0)

    // 4. Matriz de dupla contagem e declaração formal de titularidade
    expect(
      screen.getByText(/Matriz de Salvaguarda contra Dupla Contagem e Atribuição de Titularidade/i),
    ).not.toBeNull()
    expect(
      screen.getByText(/Declaração Formal de Titularidade \(Cláusula Regulatória Padrão\)/i),
    ).not.toBeNull()
    expect(
      screen.getAllByText(
        /A titularidade do benefício ambiental e do potencial de créditos de carbono/i,
      ).length,
    ).toBeGreaterThan(0)

    // 5. Repositório de evidências com hashes SHA-256
    expect(screen.getByText(/REPOSITÓRIO DE EVIDÊNCIAS & LEDGER CRIPTOGRÁFICO/i)).not.toBeNull()
    expect(screen.getAllByText(/SHA-256:/i).length).toBeGreaterThan(0)
  })
})
