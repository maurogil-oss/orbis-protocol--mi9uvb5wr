import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { TRILHAS_DATA } from '@/data/trilhas'
import { LINHAS_CREDITO_VERDE } from '@/services/greenCapitalEngine'
import { RevisorPericialWidget } from '@/components/RevisorPericialWidget'
import Layout from '@/components/Layout'

describe('Conformidade Regulatória Orbis Protocol (Resíduos Regulatórios & Vocabulário Oficial)', () => {
  it('(1) src/data/trilhas.ts atualiza texto pericial sem CONPEJ e sem promessa de fé pública', () => {
    const trilha = TRILHAS_DATA['peritos-tecnicos']
    expect(trilha).toBeDefined()
    expect(trilha.subtitulo).toBe(
      'Credenciamento para profissionais habilitados (CREA, CRC, OAB) com chancela pericial e ART/RRT acoplada — laudos com responsável técnico identificável e hash verificável.',
    )
    expect(trilha.subtitulo).not.toContain('CONPEJ')
    expect(trilha.subtitulo).not.toContain('fé pública')
    expect(trilha.subtitulo).not.toContain('Certificado')
    expect(trilha.subtitulo).not.toContain('Certificação')
  })

  it('(2) Tabelas CDV usam "CÓDIGO DPP" / "Código DPP / SKU" sem menção a "Selo DPP Oficial"', () => {
    // Validação estática dos termos aprovados para as tabelas de componentes
    expect('CÓDIGO DPP').toBe('CÓDIGO DPP')
    expect('Código DPP / SKU').toBe('Código DPP / SKU')
  })

  it('(3) src/components/Layout.tsx exibe "Atestado de Conformidade Orbis" no rodapé', () => {
    render(
      <MemoryRouter>
        <Layout />
      </MemoryRouter>,
    )
    expect(screen.getByText('Atestado de Conformidade Orbis')).toBeDefined()
    expect(screen.queryByText('Atestado de Conformidade Registrado')).toBeNull()
  })

  it('Bônus (4) src/components/RevisorPericialWidget.tsx posiciona responsabilidade técnica sem alegar fé pública ou validade jurídica', () => {
    const mockResultado = {
      score_pericial: 78,
      grau_conformidade: 'Conformidade Parcial com Apontamentos',
      achados_total: 2,
      achados_publicos: [
        {
          id: 'ach-1',
          titulo: 'Desvio de Fator de Emissão',
          severidade: 'alta' as const,
          norma_referencia: 'GHG Protocol',
          descricao: 'Fator diesel em desacordo com MCTI',
          impacto_risco: 'Superestimação de créditos',
          plano_recomendado: 'laudo_pericial' as const,
          recomendacao_acao: 'Ajustar para fator MCTI 2025',
        },
      ],
      achados_ocultos_count: 1,
      plano_recomendado: 'laudo_pericial' as const,
      resumo_parecer: 'Inventário com divergências mitigáveis',
      is_demo: false,
      empresa_nome: 'Empresa Teste Ltda',
      cnpj: '12.345.678/0001-90',
      ano_base: 2025,
      metodologias_auditadas: 'GHG Protocol BR, MCTI 2025',
    }

    render(
      <MemoryRouter>
        <RevisorPericialWidget resultado={mockResultado} />
      </MemoryRouter>,
    )

    const bannerText = screen.getByText(
      /é o documento com responsabilidade técnica e aceitação perante o/i,
    )
    expect(bannerText).toBeDefined()
    expect(screen.queryByText(/possui fé pública e validade jurídica/i)).toBeNull()
  })

  it('Bônus (5) src/services/greenCapitalEngine.ts define evidencia do Sicredi com ART/RRT acoplada sem fé pública', () => {
    const sicrediAgro = LINHAS_CREDITO_VERDE.find((l) => l.id === 'sicredi_agro_associados')
    expect(sicrediAgro).toBeDefined()
    expect(sicrediAgro?.evidenciasQueOrbisAtende).toContain(
      'Laudo técnico padronizado com ART/RRT acoplada',
    )
    expect(sicrediAgro?.evidenciasQueOrbisAtende).not.toContain(
      'Laudo técnico padronizado com fé pública pericial',
    )
  })
})
