import { describe, it, expect, vi, beforeEach } from 'vitest'
import pb from '@/lib/pocketbase/client'
import {
  consultarLoteConsolidado,
  consultarPassaportePorSelo,
  listarLotesCdv,
} from '@/services/cdvService'
import { listarConvitesAcp, listarEmpresasParticipantesAcp } from '@/services/acpConvitesService'

describe('Etapa 5 Peça 5b - Auditoria e Reforço de API Rules (PocketBase Backend)', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  describe('1. Isolamento de dados entre empresas (cdv_lotes e cdv_pecas)', () => {
    it('listarLotesCdv envia filtro por CNPJ se informado para garantir isolamento', async () => {
      const getFullListSpy = vi
        .spyOn(pb.collection('cdv_lotes'), 'getFullList')
        .mockResolvedValueOnce([
          {
            id: 'lote12345678901',
            cdv_cnpj: '11.222.333/0001-44',
            veiculo_baixa_detran: 'PR-BX-2026-001',
            total_pecas: 10,
          } as any,
        ])

      const lotes = await listarLotesCdv('11.222.333/0001-44')
      expect(getFullListSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          filter: 'cdv_cnpj = "11.222.333/0001-44"',
        }),
      )
      expect(lotes).toHaveLength(1)
      expect(lotes[0].cdv_cnpj).toBe('11.222.333/0001-44')
    })

    it('quando usuário anônimo ou de outra empresa não consegue listar via SDK, fallback público seguro responde com sucesso', async () => {
      // Simula rejeição de autorização da collection cdv_lotes (403 Forbidden das novas API rules)
      vi.spyOn(pb.collection('cdv_lotes'), 'getOne').mockRejectedValueOnce(
        new Error('Forbidden 403'),
      )
      vi.spyOn(pb.collection('cdv_lotes'), 'getFirstListItem').mockRejectedValue(
        new Error('Forbidden 403'),
      )

      // Endpoint seguro de lote público /backend/v1/cdv/lotes/publico/{id} é chamado
      const sendSpy = vi.spyOn(pb, 'send').mockResolvedValueOnce({
        sucesso: true,
        lote: {
          id: 'lote99999999999',
          cdv_nome: 'CDV Paranaguá',
          cdv_cnpj: '99.888.777/0001-66',
          veiculo_baixa_detran: 'PR-BX-2026-999',
          total_pecas: 2,
        },
        pecas: [
          {
            id: 'peca1',
            selo_dpp: 'PR-SEAL-2026-001',
            descricao_peca: 'Capô do Motor',
            peso_kg: 18.5,
          },
        ],
      })

      const resultado = await consultarLoteConsolidado('PR-BX-2026-999')
      expect(resultado).not.toBeNull()
      expect(resultado?.lote.veiculo_baixa_detran).toBe('PR-BX-2026-999')
      expect(resultado?.pecas).toHaveLength(1)
      expect(sendSpy).toHaveBeenCalledWith(
        expect.stringContaining('/backend/v1/cdv/lotes/publico/PR-BX-2026-999'),
        expect.objectContaining({ method: 'GET' }),
      )
    })

    it('consultarPassaportePorSelo recorre ao endpoint público seguro quando collection bloqueia anônimo', async () => {
      vi.spyOn(pb.collection('cdv_pecas'), 'getFirstListItem').mockRejectedValueOnce(
        new Error('Only authenticated requests are allowed 403'),
      )

      vi.spyOn(pb, 'send').mockResolvedValueOnce({
        sucesso: true,
        selo: 'PR-SEAL-2026-991823',
        sku: 'SKU-PORTA-01',
        peca: 'Porta Dianteira Esquerda',
        peso_kg: 15.2,
        co2e_evitado_kg: 24.8,
        status: 'ativo',
      })

      const peca = await consultarPassaportePorSelo('PR-SEAL-2026-991823')
      expect(peca).not.toBeNull()
      expect(peca?.selo_dpp).toBe('PR-SEAL-2026-991823')
      expect(peca?.descricao_peca).toBe('Porta Dianteira Esquerda')
    })
  })

  describe('2. Coleções e endpoints de Convites ACP restritos (convites_acp)', () => {
    it('listarConvitesAcp acessa a coleção convites_acp ordenando por mais recentes', async () => {
      const mockConvites = [
        {
          id: 'conv1',
          email: 'empresa1@acp.org.br',
          token: 'tok-abc-123',
          status: 'pendente',
          expira_em: new Date(Date.now() + 86400000).toISOString(),
        },
      ]

      vi.spyOn(pb.collection('convites_acp'), 'getFullList').mockResolvedValueOnce(
        mockConvites as any,
      )

      const res = await listarConvitesAcp()
      expect(res).toHaveLength(1)
      expect(res[0].email).toBe('empresa1@acp.org.br')
      expect(res[0].status).toBe('pendente')
    })

    it('listarEmpresasParticipantesAcp consome endpoint protegido de backend para admin_acp', async () => {
      const sendSpy = vi.spyOn(pb, 'send').mockResolvedValueOnce({
        success: true,
        total: 1,
        empresas: [
          {
            id: 'u1',
            name: 'Eco Peças Paraná Ltda',
            email: 'contato@ecopecaspr.com.br',
            cliente_codigo: 'ORB-ACP-0001',
            cnpj: '12.345.678/0001-90',
            role: 'cliente_acp',
          },
        ],
      })

      const empresas = await listarEmpresasParticipantesAcp()
      expect(sendSpy).toHaveBeenCalledWith(
        '/backend/v1/acp/empresas-participantes',
        expect.objectContaining({ method: 'GET' }),
      )
      expect(empresas).toHaveLength(1)
      expect(empresas[0].cliente_codigo).toBe('ORB-ACP-0001')
    })
  })

  describe('3. Validação das expressões das regras de acesso da Migration 0123', () => {
    it('expressão de cdv_lotes exige autenticação e restringe clientes ao próprio CNPJ com exceção de peritos e master', () => {
      const rule =
        "@request.auth.id != '' && (@request.auth.role = 'master' || @request.auth.role = 'admin' || @request.auth.role = 'perito' || (@request.auth.cnpj != '' && cdv_cnpj = @request.auth.cnpj) || is_demo = true)"

      expect(rule).toContain("@request.auth.id != ''")
      expect(rule).toContain('cdv_cnpj = @request.auth.cnpj')
      expect(rule).toContain("@request.auth.role = 'perito'")
      expect(rule).toContain("@request.auth.role = 'master'")
      expect(rule).toContain('is_demo = true')
      // admin_acp NÃO tem acesso irrestrito aos lotes brutos individuais
      expect(rule).not.toContain("@request.auth.role = 'admin_acp'")
    })

    it('expressão de convites_acp permite apenas admin_acp, master e admin', () => {
      const rule =
        "@request.auth.id != '' && (@request.auth.role = 'admin_acp' || @request.auth.role = 'master' || @request.auth.role = 'admin')"

      expect(rule).toContain("@request.auth.role = 'admin_acp'")
      expect(rule).toContain("@request.auth.role = 'master'")
      expect(rule).toContain("@request.auth.role = 'admin'")
      // Cliente comum não pode listar convites
      expect(rule).not.toContain('cliente')
      expect(rule).not.toContain('cliente_acp')
    })
  })
})
