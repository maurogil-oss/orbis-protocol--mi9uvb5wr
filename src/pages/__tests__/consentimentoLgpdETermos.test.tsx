/**
 * consentimentoLgpdETermos.test.tsx
 * Testes unitários e de integração de componentes da Etapa 5 Peça 5a:
 * 1. Links públicos e renderização das páginas /privacidade e /termos
 * 2. Bloqueio de cadastro em RegistroPage sem checkbox de consentimento
 * 3. Bloqueio de ativação em ConviteAcpPage sem checkbox de consentimento
 * 4. Registro formal de data/hora, versão da política e versão dos termos
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import RegistroPage from '@/pages/RegistroPage'
import ConviteAcpPage from '@/pages/ConviteAcpPage'
import TermosUsoPage from '@/pages/TermosUsoPage'
import Privacidade from '@/pages/Privacidade'
import pb from '@/lib/pocketbase/client'
import * as acpConvitesService from '@/services/acpConvitesService'
import {
  VERSAO_DOCUMENTO_LGPD_ATUAL,
  VERSAO_TERMOS_USO_ATUAL,
  VERSAO_CONSENTIMENTO_CADASTRO,
  verificarConsentimentoLgpd,
} from '@/services/termoConsentimentoService'

// Mock do hook useAuth
const mockLogin = vi.fn().mockResolvedValue({ success: true })
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    login: mockLogin,
  }),
}))

describe('Etapa 5, Peça 5a — Política de Privacidade, Termos de Uso e Consentimento LGPD', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('1. Constantes de versão estão unificadas e válidas', () => {
    expect(VERSAO_DOCUMENTO_LGPD_ATUAL).toMatch(/^v1\.\d/)
    expect(VERSAO_TERMOS_USO_ATUAL).toMatch(/^v1\.\d/)
    expect(VERSAO_CONSENTIMENTO_CADASTRO).toContain(VERSAO_DOCUMENTO_LGPD_ATUAL)
    expect(VERSAO_CONSENTIMENTO_CADASTRO).toContain(VERSAO_TERMOS_USO_ATUAL)
  })

  it('2. Página /privacidade renderiza texto com LGPD, direitos do titular e DPO', () => {
    render(
      <MemoryRouter initialEntries={['/privacidade']}>
        <Routes>
          <Route path="/privacidade" element={<Privacidade />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(
      screen.getByRole('heading', { name: /Política de Privacidade e Proteção de Dados/i }),
    ).toBeInTheDocument()
    expect(screen.getByText(new RegExp(VERSAO_DOCUMENTO_LGPD_ATUAL, 'i'))).toBeInTheDocument()
    expect(screen.getByText(/MGM CONSULTORIA EMPRESARIAL LTDA/i)).toBeInTheDocument()
    expect(screen.getByText(/19\.598\.964\/0001-01/i)).toBeInTheDocument()
    expect(screen.getByText(/Canal do Encarregado \(DPO\)/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Termos de Uso/i })).toBeInTheDocument()
  })

  it('3. Página /termos renderiza rótulo ESTIMATIVA, limites metodológicos e sem créditos', () => {
    render(
      <MemoryRouter initialEntries={['/termos']}>
        <Routes>
          <Route path="/termos" element={<TermosUsoPage />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(
      screen.getByRole('heading', { name: /Termos de Uso e Condições da Plataforma/i }),
    ).toBeInTheDocument()
    expect(screen.getByText(new RegExp(VERSAO_TERMOS_USO_ATUAL, 'i'))).toBeInTheDocument()
    expect(screen.getAllByText(/ESTIMATIVA dMRV/i).length).toBeGreaterThan(0)
    expect(
      screen.getByText(/A plataforma NÃO emite créditos de carbono negociáveis/i),
    ).toBeInTheDocument()
    expect(screen.getByText(/Atestado Orbis|validado\/confirmado/i)).toBeInTheDocument()
  })

  it('4. Cadastro de usuário em RegistroPage bloqueia envio se checkbox LGPD não estiver marcado', async () => {
    const createSpy = vi
      .spyOn(pb.collection('users'), 'create')
      .mockResolvedValue({ id: 'user_123' } as any)

    render(
      <MemoryRouter initialEntries={['/registro']}>
        <Routes>
          <Route path="/registro" element={<RegistroPage />} />
        </Routes>
      </MemoryRouter>,
    )

    // Preenche campos válidos
    const nomeInput = screen.getByLabelText(/Nome Completo ou Razão Social/i)
    const emailInput = screen.getByLabelText(/E-mail Corporativo/i)
    const passwordInput = screen.getByLabelText(/^Criar Senha/i)
    const passwordConfirmInput = screen.getByLabelText(/Confirmar Senha/i)

    fireEvent.change(nomeInput, { target: { value: 'Eco Reciclagem Curitiba Ltda' } })
    fireEvent.change(emailInput, { target: { value: 'contato@ecocuritiba.com.br' } })
    fireEvent.change(passwordInput, { target: { value: 'Orbis#2026Protocol' } })
    fireEvent.change(passwordConfirmInput, { target: { value: 'Orbis#2026Protocol' } })

    const submitBtn = screen.getByRole('button', { name: /Criar Conta e Iniciar Avaliação/i })
    fireEvent.click(submitBtn)

    // Deve falhar pois o checkbox não foi marcado
    await waitFor(() => {
      expect(
        screen.getByText(/É necessário concordar com os Termos de Uso e Política de Privacidade/i),
      ).toBeInTheDocument()
    })
    expect(createSpy).not.toHaveBeenCalled()

    // Agora marca o checkbox de consentimento
    const termoCheckbox = screen.getByRole('checkbox', {
      name: /Consentimento Obrigatório/i,
    })
    fireEvent.click(termoCheckbox)
    expect(termoCheckbox).toBeChecked()

    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(createSpy).toHaveBeenCalledTimes(1)
    })

    const payloadEnviado = createSpy.mock.calls[0][0] as any
    expect(payloadEnviado.email).toBe('contato@ecocuritiba.com.br')
    expect(payloadEnviado.lgpd_termo_versao).toBe(VERSAO_CONSENTIMENTO_CADASTRO)
    expect(payloadEnviado.lgpd_consentimento_data_hora).toBeDefined()
    expect(payloadEnviado.lgpd_consentimento_ip).toBe('origem_web_cadastro')
  })

  it('5. Fluxo de convite ACP (/convite/:token) exige checkbox e grava versão e consentimento', async () => {
    vi.spyOn(acpConvitesService, 'validarTokenConviteAcp').mockResolvedValueOnce({
      valido: true,
      convite: {
        id: 'c1',
        token: 'token_acp_teste_123',
        empresa_nome: 'Metalúrgica Paraná SA',
        email: 'diretoria@metalurgicapr.com.br',
        cnpj: '12.345.678/0001-90',
        status: 'pendente',
        expira_em: new Date(Date.now() + 86400000).toISOString(),
      },
    })

    const aceitarSpy = vi.spyOn(acpConvitesService, 'aceitarConviteAcp').mockResolvedValueOnce({
      success: true,
      mensagem: 'Cadastro ACP concluído com sucesso.',
      usuario: {
        id: 'u_acp_1',
        email: 'diretoria@metalurgicapr.com.br',
        name: 'Metalúrgica Paraná SA',
        role: 'cliente_acp',
        cliente_codigo: 'ORB-ACP-8821',
      },
    })

    render(
      <MemoryRouter initialEntries={['/convite/token_acp_teste_123']}>
        <Routes>
          <Route path="/convite/:token" element={<ConviteAcpPage />} />
        </Routes>
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByText(/Adesão de Empresa Associada/i)).toBeInTheDocument()
      expect(screen.getByDisplayValue('Metalúrgica Paraná SA')).toBeInTheDocument()
    })

    // Preenche senhas
    const senhaInput = screen.getByLabelText(/^Criar Senha de Acesso/i)
    const confirmarInput = screen.getByLabelText(/Confirmar Senha/i)

    fireEvent.change(senhaInput, { target: { value: 'SenhaForte#2026' } })
    fireEvent.change(confirmarInput, { target: { value: 'SenhaForte#2026' } })

    const botaoAtivar = screen.getByRole('button', { name: /Concluir Cadastro e Ativar Piloto/i })
    expect(botaoAtivar).toBeDisabled() // Desabilitado enquanto checkbox não estiver marcado

    const termoCheckbox = screen.getByRole('checkbox', {
      name: /Consentimento Obrigatório LGPD/i,
    })
    fireEvent.click(termoCheckbox)
    expect(termoCheckbox).toBeChecked()
    expect(botaoAtivar).not.toBeDisabled()

    fireEvent.click(botaoAtivar)

    await waitFor(() => {
      expect(aceitarSpy).toHaveBeenCalledTimes(1)
    })

    const payload = aceitarSpy.mock.calls[0][0]
    expect(payload.termo_aceito).toBe(true)
    expect(payload.lgpd_versao).toBe(VERSAO_CONSENTIMENTO_CADASTRO)
    expect(payload.password).toBe('SenhaForte#2026')
  })

  it('6. Helper verificarConsentimentoLgpd valida corretamente registros existentes', () => {
    const semAceite = verificarConsentimentoLgpd(null)
    expect(semAceite.possuiConsentimento).toBe(false)
    expect(semAceite.pendenteAtualizacao).toBe(true)

    const comAceite = verificarConsentimentoLgpd({
      lgpd_termo_versao: VERSAO_DOCUMENTO_LGPD_ATUAL,
      lgpd_consentimento_data_hora: new Date().toISOString(),
    })
    expect(comAceite.possuiConsentimento).toBe(true)
    expect(comAceite.pendenteAtualizacao).toBe(false)
  })
})
