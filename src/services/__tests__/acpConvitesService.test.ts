/**
 * acpConvitesService.test.ts
 * Suíte de testes unitários para a Peça 4c do Piloto ACP:
 * - Geração de convites com link único
 * - Validação de convite pendente, usado e expirado
 * - Cadastro de empresa associada com papel cliente_acp e vínculo ACP
 * - Rejeição segura de convites inválidos, usados ou expirados
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  criarConviteAcp,
  validarTokenConviteAcp,
  aceitarConviteAcp,
  listarConvitesAcp,
  listarEmpresasParticipantesAcp,
} from '../acpConvitesService'
import pb from '@/lib/pocketbase/client'

// Mock do cliente PocketBase
vi.mock('@/lib/pocketbase/client', () => {
  return {
    default: {
      send: vi.fn(),
      collection: vi.fn(),
      authStore: {
        token: 'mock-token',
        record: { id: 'admin-acp-id', role: 'admin_acp' },
        save: vi.fn(),
      },
    },
  }
})

describe('acpConvitesService (Peça 4c — Convites ACP e Cadastro Vinculado)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('1. deve gerar convite com token único e URL para a empresa associada', async () => {
    const mockToken = 'tok_acp_unit_123456789'
    vi.mocked(pb.send).mockResolvedValueOnce({
      success: true,
      convite: {
        id: 'conv_1',
        token: mockToken,
        empresa_nome: 'Metalúrgica Curitiba S/A',
        email: 'diretoria@metalcuritiba.com.br',
        cnpj: '12.345.678/0001-90',
        status: 'pendente',
        expira_em: new Date(Date.now() + 7 * 86400000).toISOString(),
        created: new Date().toISOString(),
      },
      linkConvite: `http://localhost:3000/convite/${mockToken}`,
    })

    const resultado = await criarConviteAcp({
      empresa_nome: 'Metalúrgica Curitiba S/A',
      email: 'diretoria@metalcuritiba.com.br',
      cnpj: '12.345.678/0001-90',
      dias_validade: 7,
    })

    expect(pb.send).toHaveBeenCalledWith(
      '/backend/v1/acp/convites',
      expect.objectContaining({
        method: 'POST',
        body: expect.objectContaining({
          empresa_nome: 'Metalúrgica Curitiba S/A',
          email: 'diretoria@metalcuritiba.com.br',
        }),
      }),
    )

    expect(resultado.success).toBe(true)
    expect(resultado.convite.token).toBe(mockToken)
    expect(resultado.linkConvite).toContain(mockToken)
    expect(resultado.convite.status).toBe('pendente')
  })

  it('2. deve validar com sucesso um convite pendente dentro do prazo', async () => {
    const mockToken = 'tok_valido_789'
    vi.mocked(pb.send).mockResolvedValueOnce({
      valido: true,
      convite: {
        id: 'c1',
        token: mockToken,
        empresa_nome: 'Auto Peças Londrina Ltda',
        email: 'contato@autopecasld.com.br',
        cnpj: '98.765.432/0001-10',
        status: 'pendente',
        expira_em: new Date(Date.now() + 86400000).toISOString(),
        created: new Date().toISOString(),
      },
    })

    const validacao = await validarTokenConviteAcp(mockToken)

    expect(pb.send).toHaveBeenCalledWith(
      expect.stringContaining(`/backend/v1/acp/convites/validar/${mockToken}`),
      expect.objectContaining({ method: 'GET' }),
    )
    expect(validacao.valido).toBe(true)
    expect(validacao.convite?.empresa_nome).toBe('Auto Peças Londrina Ltda')
  })

  it('3. deve recusar convite já usado com mensagem clara', async () => {
    const mockToken = 'tok_ja_usado'
    vi.mocked(pb.send).mockResolvedValueOnce({
      valido: false,
      motivo: 'Este convite já foi utilizado para cadastro de empresa associada.',
    })

    const validacao = await validarTokenConviteAcp(mockToken)

    expect(validacao.valido).toBe(false)
    expect(validacao.motivo).toContain('já foi utilizado')
  })

  it('4. deve recusar convite expirado com mensagem clara', async () => {
    const mockToken = 'tok_expirado_999'
    vi.mocked(pb.send).mockResolvedValueOnce({
      valido: false,
      motivo: 'Este convite expirou o prazo limite de validade. Solicite um novo à ACP.',
    })

    const validacao = await validarTokenConviteAcp(mockToken)

    expect(validacao.valido).toBe(false)
    expect(validacao.motivo).toContain('expirou')
  })

  it('5. deve realizar o cadastro com sucesso associando ao papel cliente_acp', async () => {
    const mockToken = 'tok_para_aceite_001'
    vi.mocked(pb.send).mockResolvedValueOnce({
      success: true,
      mensagem: 'Empresa associada cadastrada com sucesso e vinculada à ACP.',
      user: {
        id: 'user_acp_1',
        email: 'fiscal@empresa-pr.com.br',
        name: 'Indústria Paranaense de Plásticos',
        role: 'cliente_acp',
        cliente_codigo: 'ORB-ACP-1234',
        parceiro_codigo: 'ACP-PR',
      },
      tokenAuth: 'mock_jwt_auth_123',
    })

    const cadastro = await aceitarConviteAcp({
      token: mockToken,
      password: 'SenhaForte123!',
      nome_responsavel: 'João da Silva',
      cnpj: '11.222.333/0001-44',
    })

    expect(pb.send).toHaveBeenCalledWith(
      '/backend/v1/acp/convites/aceitar',
      expect.objectContaining({
        method: 'POST',
        body: expect.objectContaining({
          token: mockToken,
          password: 'SenhaForte123!',
        }),
      }),
    )
    expect(cadastro.success).toBe(true)
    expect(cadastro.usuario?.role).toBe('cliente_acp')
    expect(cadastro.usuario?.cliente_codigo).toContain('ORB-ACP')
  })

  it('6. deve listar convites gerados para o Painel ACP', async () => {
    vi.mocked(pb.send).mockResolvedValueOnce({
      items: [
        {
          id: 'c1',
          token: 'tok_1',
          empresa_nome: 'Empresa 1',
          email: 'e1@teste.com',
          status: 'pendente',
          expira_em: new Date().toISOString(),
          created: new Date().toISOString(),
        },
        {
          id: 'c2',
          token: 'tok_2',
          empresa_nome: 'Empresa 2',
          email: 'e2@teste.com',
          status: 'usado',
          expira_em: new Date().toISOString(),
          created: new Date().toISOString(),
        },
      ],
    })

    const convites = await listarConvitesAcp()
    expect(convites).toHaveLength(2)
    expect(convites[0].empresa_nome).toBe('Empresa 1')
    expect(convites[1].status).toBe('usado')
  })

  it('7. deve listar empresas associadas já cadastradas (participantes ACP)', async () => {
    vi.mocked(pb.send).mockResolvedValueOnce({
      items: [
        {
          id: 'u1',
          name: 'Empresa Associada Alfa',
          email: 'alfa@teste.com',
          role: 'cliente_acp',
          cliente_codigo: 'ORB-ACP-888',
          created: new Date().toISOString(),
        },
      ],
    })

    const participantes = await listarEmpresasParticipantesAcp()
    expect(participantes).toHaveLength(1)
    expect(participantes[0].role).toBe('cliente_acp')
    expect(participantes[0].cliente_codigo).toBe('ORB-ACP-888')
  })
})
