import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import Diagnostico from '../Diagnostico'
import * as cnpjService from '@/services/cnpj'

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    login: vi.fn().mockResolvedValue({ success: true }),
    user: null,
  }),
}))

describe('Diagnostico — Integração OpenCNPJ e Sugestão Regulatória', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('renderiza o formulário com o botão de consulta e micro-textos explicativos', () => {
    render(
      <MemoryRouter>
        <Diagnostico />
      </MemoryRouter>,
    )

    expect(screen.getByText(/DIAGNÓSTICO & QUALIFICAÇÃO TRIBUTÁRIA POR CNPJ/i)).toBeDefined()
    expect(screen.getByRole('button', { name: /Consultar/i })).toBeDefined()
    expect(
      screen.getByText(/Usaremos seu CNPJ para identificar sua empresa e sugerir sua trilha/i),
    ).toBeDefined()
    expect(
      screen.getByText(/Identifica a pessoa jurídica na emissão do laudo técnico/i),
    ).toBeDefined()
  })

  it('exibe dados enriquecidos e sugestão de trilha quando o CNPJ é consultado', async () => {
    vi.spyOn(cnpjService, 'consultarCNPJ').mockResolvedValueOnce({
      cnpj: '45307040000190',
      razao_social: 'AUTO PECAS E DESMANCHE MODELO LTDA',
      ativa: true,
      descricao_situacao_cadastral: 'ATIVA',
      cnae_fiscal: '4530704',
      cnae_fiscal_descricao: 'Comércio a varejo de peças e acessórios usados para veículos',
      porte: 'Empresa de Pequeno Porte',
      logradouro: 'AV INDUSTRIAL',
      numero: '500',
      bairro: 'DISTRITO INDUSTRIAL',
      municipio: 'CURITIBA',
      uf: 'PR',
      ddd_telefone: '(41) 3333-2222',
      email: 'contato@desmanche.com.br',
      fonte: 'opencnpj',
    })

    const user = userEvent.setup()

    render(
      <MemoryRouter>
        <Diagnostico />
      </MemoryRouter>,
    )

    const cnpjInput = screen.getByPlaceholderText('00.000.000/0000-00')
    const consultBtn = screen.getByRole('button', { name: /Consultar/i })

    // Digita um CNPJ válido (Banco do Brasil 00.000.000/0001-91)
    await user.type(cnpjInput, '00.000.000/0001-91')
    await user.click(consultBtn)

    await waitFor(() => {
      expect(screen.getByText(/Dados Oficiais Obtidos via OpenCNPJ/i)).toBeDefined()
    })

    expect(screen.getByText(/Trilha Regulatória Sugerida para seu CNAE/i)).toBeDefined()
    expect(screen.getByText(/Cadeia Automotiva & Desmontagem Veicular \(CDV\)/i)).toBeDefined()
    expect(screen.getByText(/Programa MOVER \(Lei 14.902\/2024\)/i)).toBeDefined()
  })

  it('exibe alerta amigável e não-bloqueante se a empresa estiver com situação inativa/baixada', async () => {
    vi.spyOn(cnpjService, 'consultarCNPJ').mockResolvedValueOnce({
      cnpj: '00000000000191',
      razao_social: 'EMPRESA SUSPENSA LTDA',
      ativa: false,
      descricao_situacao_cadastral: 'SUSPENSA',
      cnae_fiscal: '0111301',
      cnae_fiscal_descricao: 'Cultivo de soja',
      porte: 'Demais',
      fonte: 'opencnpj',
    })

    const user = userEvent.setup()

    render(
      <MemoryRouter>
        <Diagnostico />
      </MemoryRouter>,
    )

    const cnpjInput = screen.getByPlaceholderText('00.000.000/0000-00')
    const consultBtn = screen.getByRole('button', { name: /Consultar/i })

    await user.type(cnpjInput, '00.000.000/0001-91')
    await user.click(consultBtn)

    await waitFor(() => {
      expect(screen.getByText(/Atenção à Situação Cadastral/i)).toBeDefined()
    })

    expect(screen.getByText(/SUSPENSA/i)).toBeDefined()
    expect(screen.getByText(/Você pode prosseguir normalmente com o diagnóstico/i)).toBeDefined()
  })

  it('mantém o formulário utilizável no modo manual se a consulta falhar ou sofrer timeout', async () => {
    vi.spyOn(cnpjService, 'consultarCNPJ').mockRejectedValueOnce(
      new Error('Provedor temporariamente indisponível.'),
    )

    const user = userEvent.setup()

    render(
      <MemoryRouter>
        <Diagnostico />
      </MemoryRouter>,
    )

    const cnpjInput = screen.getByPlaceholderText('00.000.000/0000-00')
    const consultBtn = screen.getByRole('button', { name: /Consultar/i })

    await user.type(cnpjInput, '00.000.000/0001-91')
    await user.click(consultBtn)

    await waitFor(() => {
      expect(screen.getByText(/Consulta automática não concluída/i)).toBeDefined()
    })

    expect(screen.getByText(/O formulário segue liberado para digitação manual/i)).toBeDefined()

    // O campo de Razão Social continua interativo e permitindo avanço
    const razaoInput = screen.getByPlaceholderText(
      /Ex.: Indústria e Comércio Brasil S.A./i,
    ) as HTMLInputElement
    await user.type(razaoInput, 'Minha Empresa Manual S.A.')
    expect(razaoInput.value).toBe('Minha Empresa Manual S.A.')
  })
})
