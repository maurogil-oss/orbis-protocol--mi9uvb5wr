import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  VERSAO_DOCUMENTO_LGPD_ATUAL,
  CONTATO_CONTROLADOR_LGPD,
  verificarConsentimentoLgpd,
  registrarConsentimentoUsuario,
} from '../termoConsentimentoService'
import pb from '@/lib/pocketbase/client'

vi.mock('@/lib/pocketbase/client', () => ({
  default: {
    collection: vi.fn(),
    send: vi.fn(),
  },
}))

describe('termoConsentimentoService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deve ter versão e dados do controlador honestos e sem invenção de DPO', () => {
    expect(VERSAO_DOCUMENTO_LGPD_ATUAL).toBe('v1.0 — 2026-02')
    expect(CONTATO_CONTROLADOR_LGPD.emailContato).toBe('contato@orbis-protocol.com')
    expect(CONTATO_CONTROLADOR_LGPD.dpoDefinicaoPendente).toBe(true)
  })

  it('verificarConsentimentoLgpd deve indicar pendente se usuário for nulo ou sem campos', () => {
    const resNulo = verificarConsentimentoLgpd(null)
    expect(resNulo.possuiConsentimento).toBe(false)
    expect(resNulo.pendenteAtualizacao).toBe(true)

    const resVazio = verificarConsentimentoLgpd({
      lgpd_termo_versao: '',
      lgpd_consentimento_data_hora: '',
    })
    expect(resVazio.possuiConsentimento).toBe(false)
    expect(resVazio.pendenteAtualizacao).toBe(true)
  })

  it('verificarConsentimentoLgpd deve indicar consentimento ativo quando campos existirem', () => {
    const resAtivo = verificarConsentimentoLgpd({
      lgpd_termo_versao: 'v1.0 — 2026-02',
      lgpd_consentimento_data_hora: '2026-02-15T10:00:00.000Z',
    })
    expect(resAtivo.possuiConsentimento).toBe(true)
    expect(resAtivo.pendenteAtualizacao).toBe(false)
    expect(resAtivo.versaoRegistrada).toBe('v1.0 — 2026-02')
  })

  it('registrarConsentimentoUsuario deve chamar update no PocketBase e registrar audit_log', async () => {
    const mockUpdate = vi.fn().mockResolvedValue({ id: 'user_123' })
    const mockCollection = vi.fn().mockReturnValue({ update: mockUpdate })
    ;(pb.collection as any) = mockCollection
    ;(pb.send as any) = vi.fn().mockResolvedValue({ sucesso: true })

    const res = await registrarConsentimentoUsuario({
      userId: 'user_123',
      userEmail: 'empresa@teste.com',
      origem: 'cadastro',
    })

    expect(res.sucesso).toBe(true)
    expect(res.versao).toBe(VERSAO_DOCUMENTO_LGPD_ATUAL)
    expect(mockUpdate).toHaveBeenCalledWith(
      'user_123',
      expect.objectContaining({
        lgpd_termo_versao: VERSAO_DOCUMENTO_LGPD_ATUAL,
      }),
    )
  })
})
