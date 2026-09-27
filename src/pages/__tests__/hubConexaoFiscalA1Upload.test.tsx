import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { HubConexaoFiscal } from '@/components/HubConexaoFiscal'
import * as infosimplesService from '@/services/infosimplesService'

// Mock de services
vi.mock('@/services/infosimplesService', () => ({
  obterStatusCertificadoA1: vi.fn(),
  salvarConfigCertificadoA1: vi.fn(),
  revogarCertificadoA1: vi.fn(),
}))

vi.mock('@/services/spedService', () => ({
  listarImportacoesSped: vi.fn().mockResolvedValue([]),
  salvarImportacaoSped: vi.fn(),
  parseSpedTxt: vi.fn(),
}))

describe('HubConexaoFiscal: Modelo 3 - Custódia A1 com upload .pfx, aceite direto e validade', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('permite selecionar Modelo 3 e exibe formulário com campo de upload .pfx e checkbox de aceite', async () => {
    vi.mocked(infosimplesService.obterStatusCertificadoA1).mockResolvedValue(null)

    render(
      <HubConexaoFiscal
        usuarioId="usr-test-123"
        cnpjEmpresa="12.345.678/0001-90"
        razaoSocial="MGM Agro Reciclagem Ltda"
      />,
    )

    // Clica no card do Modelo 3
    const cardModelo3 = screen.getByText(/Certificado A1 Direto \/ Gateway DF-e/i)
    fireEvent.click(cardModelo3)

    // Verifica que o formulário está visível
    expect(
      screen.getByText(/Custódia Segura de Certificado A1 \(\.pfx\) & Sigilo Fiscal/i),
    ).toBeDefined()

    // Verifica campo de upload de .pfx
    expect(screen.getByText(/Arquivo do Certificado Digital A1 \(\.pfx ou \.p12\)/i)).toBeDefined()
    expect(screen.getByText(/Clique para selecionar o arquivo \.pfx ou \.p12/i)).toBeDefined()

    // Verifica checkbox de aceite direto do termo
    const checkboxes = screen.getAllByRole('checkbox')
    expect(checkboxes.length).toBeGreaterThanOrEqual(1)
    const checkboxTermo = checkboxes[0]
    expect((checkboxTermo as HTMLInputElement).checked).toBe(false)

    // Usuário clica diretamente na caixa de checkbox sem precisar abrir o modal
    fireEvent.click(checkboxTermo)
    expect((checkboxTermo as HTMLInputElement).checked).toBe(true)
  })

  it('valida formato .pfx/.p12 ao selecionar arquivo e exibe mensagem de erro para extensões inválidas', async () => {
    vi.mocked(infosimplesService.obterStatusCertificadoA1).mockResolvedValue(null)

    const { container } = render(
      <HubConexaoFiscal
        usuarioId="usr-test-123"
        cnpjEmpresa="12.345.678/0001-90"
        razaoSocial="MGM Agro Reciclagem Ltda"
      />,
    )

    fireEvent.click(screen.getByText(/Certificado A1 Direto \/ Gateway DF-e/i))

    // Input de arquivo do .pfx
    const fileInput = container.querySelector(
      'input[type="file"][accept*=".pfx"]',
    ) as HTMLInputElement
    expect(fileInput).toBeDefined()

    // Tenta anexar um arquivo com extensão incorreta (.pdf)
    const arquivoInvalido = new File(['dados'], 'contrato.pdf', { type: 'application/pdf' })
    fireEvent.change(fileInput, { target: { files: [arquivoInvalido] } })

    expect(
      await screen.findByText(
        /Formato inválido\. O arquivo do certificado ICP-Brasil deve ter extensão \.pfx ou \.p12\./i,
      ),
    ).toBeDefined()
  })

  it('permite upload de arquivo .pfx válido, marcação direta do checkbox e submissão com arquivo base64', async () => {
    vi.mocked(infosimplesService.obterStatusCertificadoA1).mockResolvedValue(null)
    vi.mocked(infosimplesService.salvarConfigCertificadoA1).mockResolvedValue({
      sucesso: true,
      mensagem: 'Certificado A1 aceito e custodiado sob Termo de Responsabilidade e Sigilo Fiscal.',
      certificado_id: 'cert-123',
      cnpj_titular: '12345678000190',
      arquivo_pfx: 'certificado_mgm.pfx',
      validade_certificado: '2027-02-12T00:00:00.000Z',
    })

    const { container } = render(
      <HubConexaoFiscal
        usuarioId="usr-test-123"
        cnpjEmpresa="12.345.678/0001-90"
        razaoSocial="MGM Agro Reciclagem Ltda"
      />,
    )

    fireEvent.click(screen.getByText(/Certificado A1 Direto \/ Gateway DF-e/i))

    // Preenche senha
    const senhaInput = screen.getByPlaceholderText(/••••••••••••/i)
    fireEvent.change(senhaInput, { target: { value: 'MGM@Cert2027' } })

    // Anexa arquivo .pfx válido
    const fileInput = container.querySelector(
      'input[type="file"][accept*=".pfx"]',
    ) as HTMLInputElement
    const arquivoValido = new File(['CONTEUDO_PFX_MOCK_ICP_BRASIL'], 'certificado_mgm.pfx', {
      type: 'application/x-pkcs12',
    })
    fireEvent.change(fileInput, { target: { files: [arquivoValido] } })

    // Espera leitura do arquivo e exibição do nome do arquivo carregado
    await waitFor(() => {
      expect(screen.getByText('certificado_mgm.pfx')).toBeDefined()
    })

    // Marca o checkbox de aceite diretamente sem passar pelo modal
    const checkboxTermo = screen.getByRole('checkbox')
    fireEvent.click(checkboxTermo)

    // Submete o formulário
    const submitBtn = screen.getByRole('button', {
      name: /Assinar Termo e Iniciar Custódia Segura/i,
    })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(infosimplesService.salvarConfigCertificadoA1).toHaveBeenCalledWith(
        expect.objectContaining({
          cnpj_titular: '12.345.678/0001-90',
          razao_social: 'MGM Agro Reciclagem Ltda',
          senha: 'MGM@Cert2027',
          termo_lgpd_aceito: true,
          arquivo_nome: 'certificado_mgm.pfx',
        }),
      )
    })
  })

  it('exibe data de validade formatada (DD/MM/AAAA) e arquivo .pfx no card de status quando certificado estiver ativo', async () => {
    vi.mocked(infosimplesService.obterStatusCertificadoA1).mockResolvedValue({
      id: 'cert-mgm-01',
      cnpj_titular: '12.345.678/0001-90',
      razao_social: 'MGM Agro Reciclagem Ltda',
      ativo: true,
      status_custodia: 'ativo',
      termo_versao: 'v2026-01',
      termo_lgpd_aceito: true,
      data_aceite_lgpd: '2026-03-01T12:00:00Z',
      consentimento_ip: '187.50.120.45',
      consentimento_data_hora: '2026-03-01T12:00:00Z',
      arquivo_pfx: 'certificado_mgm_certisign.pfx',
      validade_certificado: '2027-02-12T23:59:59.000Z',
    })

    render(
      <HubConexaoFiscal
        usuarioId="usr-test-123"
        cnpjEmpresa="12.345.678/0001-90"
        razaoSocial="MGM Agro Reciclagem Ltda"
      />,
    )

    // Clica no Modelo 3
    fireEvent.click(screen.getByText(/Certificado A1 Direto \/ Gateway DF-e/i))

    await waitFor(() => {
      // Card de status ativo
      expect(
        screen.getByText(/Certificado A1 Ativo sob Custódia Criptografada AES-256/i),
      ).toBeDefined()
      // Exibição da validade formatada "Válido até 12/02/2027"
      expect(screen.getByText(/Válido até 12\/02\/2027/i)).toBeDefined()
      // Exibição do nome do arquivo .pfx custodiado
      expect(screen.getByText('certificado_mgm_certisign.pfx')).toBeDefined()
    })
  })

  it('exibe alerta de atenção e badge quando certificado estiver a menos de 90 dias do vencimento', async () => {
    // Data futura a ~30 dias
    const daqui30Dias = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

    vi.mocked(infosimplesService.obterStatusCertificadoA1).mockResolvedValue({
      id: 'cert-mgm-expirando',
      cnpj_titular: '12.345.678/0001-90',
      razao_social: 'MGM Agro Reciclagem Ltda',
      ativo: true,
      status_custodia: 'ativo',
      termo_versao: 'v2026-01',
      termo_lgpd_aceito: true,
      arquivo_pfx: 'certificado_quase_vencendo.pfx',
      validade_certificado: daqui30Dias.toISOString(),
    })

    render(
      <HubConexaoFiscal
        usuarioId="usr-test-123"
        cnpjEmpresa="12.345.678/0001-90"
        razaoSocial="MGM Agro Reciclagem Ltda"
      />,
    )

    fireEvent.click(screen.getByText(/Certificado A1 Direto \/ Gateway DF-e/i))

    await waitFor(() => {
      expect(screen.getByText(/Vence em 30 dias|Vence em 29 dias|Vence em 31 dias/i)).toBeDefined()
      expect(screen.getByText(/Atenção: Certificado próximo do vencimento/i)).toBeDefined()
    })
  })
})
