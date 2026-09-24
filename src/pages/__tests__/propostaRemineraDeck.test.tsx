import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import App from '@/App'
import PropostaRemineraPage from '@/pages/PropostaRemineraPage'

describe('Proposta Comercial Reminera / Metal Carbon Hub', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.print = vi.fn()
    window.HTMLElement.prototype.scrollIntoView = vi.fn()
  })

  it('renderiza os 10 slides numerados na página PropostaRemineraPage', () => {
    render(
      <MemoryRouter>
        <PropostaRemineraPage />
      </MemoryRouter>,
    )

    // Verifica que todos os 10 slides existem por seus seletores de ID
    for (let i = 1; i <= 10; i++) {
      const slideEl = document.getElementById(`slide-${i}`)
      expect(slideEl).not.toBeNull()
    }

    // Verifica indicadores de paginação nos rodapés dos slides
    expect(screen.getByText('Slide 01 / 10')).toBeDefined()
    expect(screen.getByText('Slide 02 / 10')).toBeDefined()
    expect(screen.getByText('Slide 03 / 10')).toBeDefined()
    expect(screen.getByText('Slide 04 / 10')).toBeDefined()
    expect(screen.getByText('Slide 05 / 10')).toBeDefined()
    expect(screen.getByText('Slide 06 / 10')).toBeDefined()
    expect(screen.getByText('Slide 07 / 10')).toBeDefined()
    expect(screen.getByText('Slide 08 / 10')).toBeDefined()
    expect(screen.getByText('Slide 09 / 10')).toBeDefined()
    expect(screen.getByText('Slide 10 / 10')).toBeDefined()
  })

  it('exibe a capa com título, subtítulo e referência à Metal Carbon Hub / Reminera', () => {
    render(
      <MemoryRouter>
        <PropostaRemineraPage />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { level: 1, name: /Proposta de Parceria/i })).toBeDefined()
    expect(screen.getByText(/Metal Carbon Hub \/ Reminera/i, { selector: 'strong' })).toBeDefined()
    expect(screen.getByText(/Fazenda Rio Grande \/ PR/i)).toBeDefined()
    expect(screen.getByText(/Zero Waste to Landfill/i)).toBeDefined()
    expect(screen.getByText(/SRA Complementado/i)).toBeDefined()
  })

  it('endereça as 3 dores no Slide 3 e não ataca o sistema SRA no Slide 2', () => {
    render(
      <MemoryRouter>
        <PropostaRemineraPage />
      </MemoryRouter>,
    )

    // Slide 2: posicionamento de complemento ao SRA
    expect(screen.getByText(/Vocês dominam a operação física/i)).toBeDefined()
    expect(screen.getByText(/não é substituir nem competir com o SRA/i)).toBeDefined()
    expect(screen.getByText(/SRA — Rastreamento Operacional/i)).toBeDefined()

    // Slide 3: as 3 dores
    expect(screen.getByText(/Os 3 gargalos que travam margem e compliance/i)).toBeDefined()
    expect(screen.getByText(/Comprovação de Origem Legal e Baixa Veicular/i)).toBeDefined()
    expect(screen.getByText(/Sucata Vendida como Commodity Genérica/i)).toBeDefined()
    expect(screen.getByText(/Auditoria de Destruição de Gases Refrigerantes/i)).toBeDefined()
  })

  it('cobre os 5 módulos e a visão de evolução com a citação verbatim exata', () => {
    render(
      <MemoryRouter>
        <PropostaRemineraPage />
      </MemoryRouter>,
    )

    // Módulo 1: Passaporte Digital de Aço Secundário
    expect(
      screen.getByRole('heading', { level: 2, name: /Passaporte Digital de Aço Secundário/i }),
    ).toBeDefined()
    expect(screen.getByText(/30 a 60 Dias de Operação Assistida/i)).toBeDefined()

    // Módulo 2: Selo de Logística Reversa Auditada
    expect(
      screen.getByRole('heading', {
        level: 2,
        name: /Selo de Logística Reversa Auditada \(via ACP-PR\)/i,
      }),
    ).toBeDefined()

    // Módulo 3: Manifesto digital CDV -> Reminera
    expect(
      screen.getByRole('heading', { level: 2, name: /Manifesto Digital CDV → Reminera/i }),
    ).toBeDefined()
    expect(screen.getByText(/Checklist de 77 Peças/i)).toBeDefined()

    // Módulo 4: dMRV de Gases Refrigerantes
    expect(
      screen.getByRole('heading', { level: 2, name: /dMRV de Gases Refrigerantes/i }),
    ).toBeDefined()
    expect(screen.getByText(/R-134a \(HFC\)/i)).toBeDefined()

    // Módulo 5: Materiais Críticos Recuperados
    expect(
      screen.getByRole('heading', {
        level: 2,
        name: /Passaporte Digital de Materiais Críticos Recuperados/i,
      }),
    ).toBeDefined()
    expect(screen.getByText(/Terras Raras \(Neodímio\)/i)).toBeDefined()

    // Slide 9: Visão de Evolução (Carbono -> Cadeia -> Natureza)
    expect(
      screen.getByRole('heading', {
        level: 2,
        name: /Visão de Evolução: Carbono → Cadeia → Natureza/i,
      }),
    ).toBeDefined()

    // Frase verbatim oficial da plataforma
    const citacaoExata =
      'Estendemos nossa infraestrutura de prova documental à logística reversa (PNRS / Decreto 11.413/2023): rastreabilidade de lotes de material, balanço de massa auditável e documentos prontos para envio a órgãos de controle e entidades gestoras. Na mesma lógica, a infraestrutura Orbis está preparada para dados verificáveis de natureza e biodiversidade, à medida que os padrões IFRS incorporam o tema nas divulgações corporativas.'

    expect(screen.getByText(new RegExp(citacaoExata))).toBeDefined()

    // Slide 10: Próximos passos e citação de encerramento
    expect(screen.getByText(/O gargalo do novo ciclo ESG não é medir — é provar/i)).toBeDefined()
    expect(screen.getByText(/contato@orbis-protocol.com/i)).toBeDefined()
  })

  it('respeita regras de discurso: sem promessa de crédito de carbono, sem nomes de compradoras vedadas', () => {
    const { container } = render(
      <MemoryRouter>
        <PropostaRemineraPage />
      </MemoryRouter>,
    )

    const text = container.textContent || ''

    // Não deve prometer créditos de carbono
    expect(text).not.toContain('geramos créditos de carbono')
    expect(text).not.toContain('geração de créditos de carbono')
    expect(text).not.toContain('venda de créditos de carbono')

    // Deve ressaltar que VVB ainda não está contratado
    expect(text).toContain('VVB acreditado, ainda não contratado')

    // Não deve citar montadoras/compradoras específicas vedadas
    expect(text).not.toContain('Gerdau')
    expect(text).not.toContain('Electrolux')
    expect(text).not.toContain('Aperam')
  })

  it('permite exportação chamando window.print() ao clicar no botão de exportar', () => {
    render(
      <MemoryRouter>
        <PropostaRemineraPage />
      </MemoryRouter>,
    )

    const printBtns = screen.getAllByRole('button', { name: /Exportar PDF/i })
    expect(printBtns.length).toBeGreaterThanOrEqual(1)

    fireEvent.click(printBtns[0])
    expect(window.print).toHaveBeenCalledTimes(1)
  })

  it('é acessível via rota /proposta-reminera no App router', () => {
    render(
      <MemoryRouter initialEntries={['/proposta-reminera']}>
        <App />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { level: 1, name: /Proposta de Parceria/i })).toBeDefined()
  })
})
