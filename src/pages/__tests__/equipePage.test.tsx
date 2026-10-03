import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import EquipePage from '../EquipePage'

describe('Página Pública /equipe - Governança Institucional e Responsabilidade Técnica', () => {
  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <EquipePage />
      </BrowserRouter>,
    )
  }

  it('deve renderizar a estrutura principal com título institucional e CNPJ da mantenedora', () => {
    renderComponent()

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: /Governança Institucional e Responsabilidade Técnica/i,
      }),
    ).not.toBeNull()

    // Mantenedora e CNPJ
    expect(screen.getAllByText(/MGM Consultoria Empresarial Ltda/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/19\.598\.964\/0001-01/i).length).toBeGreaterThan(0)
  })

  it('deve listar os 4 papéis institucionais sem inventar nomes ou fotos de terceiros', () => {
    renderComponent()

    expect(screen.getByText('Direção Executiva e Relações Institucionais')).not.toBeNull()
    expect(screen.getByText('Responsabilidade Técnica e Engenharia Ambiental')).not.toBeNull()
    expect(screen.getByText('Arquitetura de Software e Criptografia')).not.toBeNull()
    expect(screen.getByText('Perícia e Auditoria de Conformidade')).not.toBeNull()

    // Titular institucional da mantenedora
    expect(
      screen.getAllByText(/Mauro Gil \(MGM Consultoria Empresarial Ltda\)/i).length,
    ).toBeGreaterThan(0)
    expect(screen.getByText(/Corpo Técnico Credenciado \(CREA\/CRQ\)/i)).not.toBeNull()
    expect(screen.getByText(/Equipe de Engenharia Orbis Protocol/i)).not.toBeNull()
    expect(screen.getByText(/Peritos Judiciais e Auditores Independentes/i)).not.toBeNull()
  })

  it('deve exibir a matriz de governança técnica com as 4 competências fundamentais', () => {
    renderComponent()

    expect(screen.getByText('Validação de Metodologia dMRV')).not.toBeNull()
    expect(screen.getByText('Custódia e Emissão de Atestados')).not.toBeNull()
    expect(screen.getByText('Auditoria Externa e Revisor F6')).not.toBeNull()
    expect(screen.getByText('Segurança e LGPD')).not.toBeNull()
  })

  it('deve apresentar as garantias de independência e governança pericial', () => {
    renderComponent()

    expect(screen.getByText('Segregação de Funções')).not.toBeNull()
    expect(screen.getByText('Sem Remuneração por Volume de Créditos')).not.toBeNull()
    expect(screen.getByText('Trilha Imutável em Append-Only')).not.toBeNull()
    expect(screen.getByText('Código Aberto para Verificação')).not.toBeNull()
  })

  it('deve fornecer botões de contato com e-mails oficiais Titan/HostGator e canais institucionais', () => {
    renderComponent()

    expect(screen.getByText('contato@orbis-protocol.com')).not.toBeNull()
    expect(screen.getByText('suporte@orbis-protocol.com')).not.toBeNull()
    expect(screen.getByText('Mauro Gil')).not.toBeNull()

    const linkContato = screen.getByRole('link', { name: /Falar com a Governança/i })
    expect(linkContato.getAttribute('href')).toBe('mailto:contato@orbis-protocol.com')

    const linkCanalTitular = screen.getByRole('link', { name: /Canal do Titular \(LGPD\)/i })
    expect(linkCanalTitular.getAttribute('href')).toBe('/canal-titular')
  })

  it('não deve conter termos vedados como Selo Oficial, Certificado/Certificação, homologado ou superlativos', () => {
    const { container } = renderComponent()
    const text = container.textContent || ''

    expect(text).not.toMatch(/Selo Oficial/i)
    expect(text).not.toMatch(/Certificado/i)
    expect(text).not.toMatch(/Certificação/i)
    expect(text).not.toMatch(/homologad/i)
    expect(text).not.toMatch(/maior rede/i)
    expect(text).not.toMatch(/1ª infraestrutura/i)
  })
})
