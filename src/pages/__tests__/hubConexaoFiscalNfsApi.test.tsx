import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { HubConexaoFiscal } from '@/components/HubConexaoFiscal'
import * as nfsApiService from '@/services/nfsApiService'
import * as infosimplesService from '@/services/infosimplesService'

vi.mock('@/services/infosimplesService', () => ({
  obterStatusCertificadoA1: vi.fn().mockResolvedValue(null),
  salvarConfigCertificadoA1: vi.fn(),
  revogarCertificadoA1: vi.fn(),
}))

vi.mock('@/services/spedService', () => ({
  listarImportacoesSped: vi.fn().mockResolvedValue([]),
  salvarImportacaoSped: vi.fn(),
  parseSpedTxt: vi.fn(),
}))

vi.mock('@/services/nfsApiService', () => ({
  obterOuCriarApiKeyNfs: vi.fn(),
  regenerarApiKeyNfs: vi.fn(),
  revogarApiKeyNfs: vi.fn(),
  listarApiKeysNfs: vi.fn().mockResolvedValue([]),
  listarLogsLotesNfs: vi.fn().mockResolvedValue([]),
  enviarLoteNfsApi: vi.fn(),
}))

describe('HubConexaoFiscal — Modelo 4: API de NFs', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('exibe o card do Modelo 4 (API de NFs) no comparativo com badge NOVO', async () => {
    render(
      <MemoryRouter>
        <HubConexaoFiscal
          usuarioId="usr-123"
          cnpjEmpresa="12.345.678/0001-90"
          razaoSocial="MGM Agro Reciclagem Ltda"
        />
      </MemoryRouter>,
    )

    expect(screen.getByText(/HUB DE CONEXÃO FISCAL ACP • 4 ROTAS DE INTEGRAÇÃO/i)).toBeDefined()
    expect(screen.getByText(/API de NFs \(ERP Direto\)/i)).toBeDefined()
    expect(screen.getByText(/NOVO • MODELO 4/i)).toBeDefined()
  })

  it('permite selecionar Modelo 4 e exibe detalhes da API, instruções de ERP e botão de gerar chave', async () => {
    render(
      <MemoryRouter>
        <HubConexaoFiscal
          usuarioId="usr-123"
          cnpjEmpresa="12.345.678/0001-90"
          razaoSocial="MGM Agro Reciclagem Ltda"
        />
      </MemoryRouter>,
    )

    // Clica no card do Modelo 4
    fireEvent.click(screen.getByText(/API de NFs \(ERP Direto\)/i))

    expect(screen.getByText(/API de NFs — Integração Direta com o ERP da Empresa/i)).toBeDefined()
    expect(screen.getByText(/Credencial de Acesso da Empresa \(X-API-Key\)/i)).toBeDefined()
    expect(screen.getByText(/Exemplo Mínimo de Chamada \(cURL \/ HTTP\)/i)).toBeDefined()
    expect(screen.getByText(/Gerar Chave de API de NFs/i)).toBeDefined()
  })

  it('gera chave de API ao clicar no botão e exibe a chave completa com aviso e botão de copiar', async () => {
    vi.mocked(nfsApiService.obterOuCriarApiKeyNfs).mockResolvedValue({
      chaveCompleta: 'orb_nfs_live_abcdef12345678901234567890abcdef',
      record: {
        id: 'key-1',
        usuario: 'usr-123',
        empresa_nome: 'MGM Agro Reciclagem Ltda',
        cnpj_vinculado: '12345678000190',
        chave_prefixo: 'orb_nfs_live_',
        chave_hash: 'hash-mock',
        chave_mascarada: 'orb_nfs_live_...abcdef',
        ativa: true,
        created: '2026-03-20T10:00:00Z',
        updated: '2026-03-20T10:00:00Z',
      },
    })

    render(
      <MemoryRouter>
        <HubConexaoFiscal
          usuarioId="usr-123"
          cnpjEmpresa="12.345.678/0001-90"
          razaoSocial="MGM Agro Reciclagem Ltda"
        />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByText(/API de NFs \(ERP Direto\)/i))

    const btnGerar = screen.getByRole('button', { name: /Gerar Chave de API de NFs/i })
    fireEvent.click(btnGerar)

    await waitFor(() => {
      expect(screen.getByText('orb_nfs_live_abcdef12345678901234567890abcdef')).toBeDefined()
      expect(screen.getByText(/Chave de API Gerada — Guarde com Segurança/i)).toBeDefined()
      expect(screen.getByRole('button', { name: /Copiar Chave/i })).toBeDefined()
    })
  })

  it('permite revogar chave de API com confirmação window.confirm', async () => {
    vi.mocked(nfsApiService.listarApiKeysNfs).mockResolvedValue([
      {
        id: 'key-1',
        usuario: 'usr-123',
        empresa_nome: 'MGM Agro Reciclagem Ltda',
        cnpj_vinculado: '12345678000190',
        chave_prefixo: 'orb_nfs_live_',
        chave_hash: 'hash-mock',
        chave_mascarada: 'orb_nfs_live_...abcdef',
        ativa: true,
        created: '2026-03-20T10:00:00Z',
        updated: '2026-03-20T10:00:00Z',
      },
    ])

    vi.spyOn(window, 'confirm').mockReturnValue(true)

    render(
      <MemoryRouter>
        <HubConexaoFiscal
          usuarioId="usr-123"
          cnpjEmpresa="12.345.678/0001-90"
          razaoSocial="MGM Agro Reciclagem Ltda"
        />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByText(/API de NFs \(ERP Direto\)/i))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Revogar Chave/i })).toBeDefined()
    })

    const btnRevogar = screen.getByRole('button', { name: /Revogar Chave/i })
    fireEvent.click(btnRevogar)

    await waitFor(() => {
      expect(nfsApiService.revogarApiKeyNfs).toHaveBeenCalledWith(
        'key-1',
        expect.stringContaining('Revogação manual'),
      )
    })
  })
})
