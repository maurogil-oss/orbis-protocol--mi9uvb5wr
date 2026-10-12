import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  formatarPeritoComMascaramentoPadrao,
  resolverExibicaoPerito,
  buscarConsentimentoAtivoPerito,
  registrarConsentimentoPerito,
  revogarConsentimentoPerito,
  VERSAO_TERMO_CONSENTIMENTO_LGPD,
  ConsentimentoPeritoRecord,
} from '../consentimentoPeritoService'
import pb from '@/lib/pocketbase/client'

vi.mock('@/lib/pocketbase/client', () => {
  return {
    default: {
      collection: vi.fn(),
      authStore: {
        model: {
          id: 'user_perito_123',
          email: 'perito@orbis-protocol.com',
          name: 'Eng. Roberto Silva',
        },
      },
    },
  }
})

describe('Serviço de Consentimento LGPD do Perito (Mascarado vs Revelado vs Revogado)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('(i) formatarPeritoComMascaramentoPadrao e resolverExibicaoPerito sem consentimento', () => {
    it('deve mascarar os dados por padrão com nota de minimização (Art. 6º, III LGPD)', () => {
      const exibicao = resolverExibicaoPerito(
        'CREA-SP 182.940/D - Eng. Roberto Silva (ART 2026/0014829)',
        null,
      )

      expect(exibicao.mascarado).toBe(true)
      expect(exibicao.consentimentoValido).toBe(false)
      // O nome completo jamais deve aparecer no texto quando mascarado
      expect(exibicao.textoFormatado).not.toContain('Roberto Silva')
      expect(exibicao.dadosCompletos).toBeUndefined()
      // Deve conter o padrão minimizado institucional
      expect(exibicao.textoFormatado).toContain('Eng. Responsável')
      expect(exibicao.textoFormatado).toContain('CREA-SP')
      expect(exibicao.textoFormatado).toContain('***.940/D')
      expect(exibicao.notaLgpd).toContain('Art. 6º, III')
      expect(exibicao.notaLgpd).toContain('Minimização')
    })

    it('formatarPeritoComMascaramentoPadrao deve aceitar string customizada e mascarar números e nomes', () => {
      const mascarado = formatarPeritoComMascaramentoPadrao(
        'CREA-MG 45.678/D - Eng. Ana Costa - ART 998877',
      )
      expect(mascarado).not.toContain('Ana Costa')
      expect(mascarado).toContain('CREA-MG')
      expect(mascarado).toContain('***')
      expect(mascarado).toContain('ART ***')
    })

    it('quando perito original for indefinido, deve retornar padrão anônimo seguro', () => {
      const padrao = formatarPeritoComMascaramentoPadrao(undefined)
      expect(padrao).toBe('Eng. Responsável • ART ***-SP')
    })
  })

  describe('(ii) com consentimento ativo', () => {
    const mockConsentimentoAtivo: ConsentimentoPeritoRecord = {
      id: 'consent_123',
      usuario: 'user_perito_123',
      nome_completo: 'Dr. Roberto Carlos da Silva',
      conselho_tipo: 'CREA',
      registro_profissional: '182.940/D',
      registro_uf: 'SP',
      numero_art_rrt: 'ART 2026/0014829',
      termo_versao: VERSAO_TERMO_CONSENTIMENTO_LGPD,
      termo_aceito_em: '2026-03-30T10:00:00.000Z',
      status: 'ativo',
      created: '2026-03-30T10:00:00.000Z',
      updated: '2026-03-30T10:00:00.000Z',
    }

    it('deve revelar o nome completo e dados de registro com nota de consentimento', () => {
      const exibicao = resolverExibicaoPerito(undefined, mockConsentimentoAtivo)

      expect(exibicao.mascarado).toBe(false)
      expect(exibicao.consentimentoValido).toBe(true)
      expect(exibicao.dadosCompletos?.nome).toBe('Dr. Roberto Carlos da Silva')
      expect(exibicao.dadosCompletos?.registro).toBe('182.940/D')
      expect(exibicao.dadosCompletos?.art).toBe('ART 2026/0014829')
      expect(exibicao.textoFormatado).toContain('Dr. Roberto Carlos da Silva')
      expect(exibicao.textoFormatado).toContain('CREA-SP 182.940/D')
      expect(exibicao.textoFormatado).toContain('ART ART 2026/0014829')
      expect(exibicao.notaLgpd).toContain('consentimento formal do responsável técnico')
      expect(exibicao.notaLgpd).toContain('Art. 7º, I da LGPD')
    })

    it('buscarConsentimentoAtivoPerito deve retornar o consentimento quando a API retornar status=ativo', async () => {
      const mockGetList = vi.fn().mockResolvedValue({
        items: [mockConsentimentoAtivo],
      })
      ;(pb.collection as any).mockReturnValue({
        getList: mockGetList,
      })

      const resultado = await buscarConsentimentoAtivoPerito({ usuarioId: 'user_perito_123' })
      expect(mockGetList).toHaveBeenCalledWith(1, 1, {
        filter: "status = 'ativo' && usuario = 'user_perito_123'",
        sort: '-created',
      })
      expect(resultado).not.toBeNull()
      expect(resultado?.nome_completo).toBe('Dr. Roberto Carlos da Silva')
    })
  })

  describe('(iii) consentimento revogado volta automaticamente ao mascaramento', () => {
    it('buscarConsentimentoAtivoPerito deve retornar null se a busca não encontrar registro ativo', async () => {
      const mockGetList = vi.fn().mockResolvedValue({
        items: [], // Nulo após revogação
      })
      ;(pb.collection as any).mockReturnValue({
        getList: mockGetList,
      })

      const resultado = await buscarConsentimentoAtivoPerito({ usuarioId: 'user_perito_123' })
      expect(resultado).toBeNull()

      // Com resultado nulo, o resolverExibicaoPerito volta a mascarar imediatamente
      const exibicao = resolverExibicaoPerito('CREA-SP 182.940/D - Eng. Roberto Silva', resultado)
      expect(exibicao.mascarado).toBe(true)
      expect(exibicao.consentimentoValido).toBe(false)
      expect(exibicao.textoFormatado).not.toContain('Roberto Silva')
      expect(exibicao.notaLgpd).toContain('Art. 6º, III')
    })

    it('revogarConsentimentoPerito deve chamar update no backend marcando status=revogado e revogado_em', async () => {
      const mockUpdate = vi.fn().mockResolvedValue({
        id: 'consent_123',
        status: 'revogado',
        revogado_em: '2026-03-30T12:00:00.000Z',
        observacao: 'Revogação voluntária pelo perito',
      })
      ;(pb.collection as any).mockReturnValue({
        update: mockUpdate,
      })

      const revogado = await revogarConsentimentoPerito(
        'consent_123',
        'Revogação voluntária pelo perito',
      )
      expect(mockUpdate).toHaveBeenCalledWith(
        'consent_123',
        expect.objectContaining({
          status: 'revogado',
          observacao: 'Revogação voluntária pelo perito',
        }),
      )
      expect(revogado.status).toBe('revogado')
    })

    it('registrarConsentimentoPerito deve validar versão LGPD-PERITO-v1.0 e status ativo', async () => {
      const mockCreate = vi.fn().mockResolvedValue({
        id: 'consent_novo',
        status: 'ativo',
        termo_versao: VERSAO_TERMO_CONSENTIMENTO_LGPD,
        nome_completo: 'Dra. Maria Souza',
      })
      ;(pb.collection as any).mockReturnValue({
        create: mockCreate,
      })

      const criado = await registrarConsentimentoPerito({
        nomeCompleto: 'Dra. Maria Souza',
        registroProfissional: '998877/D',
        conselhoTipo: 'CREA',
        registroUf: 'RJ',
      })

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          nome_completo: 'Dra. Maria Souza',
          termo_versao: 'LGPD-PERITO-v1.0',
          status: 'ativo',
        }),
      )
      expect(criado.status).toBe('ativo')
    })
  })
})
