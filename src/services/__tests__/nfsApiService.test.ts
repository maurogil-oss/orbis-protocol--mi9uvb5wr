import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  obterOuCriarApiKeyNfs,
  regenerarApiKeyNfs,
  revogarApiKeyNfs,
  listarApiKeysNfs,
  listarLogsLotesNfs,
  enviarLoteNfsApi,
} from '@/services/nfsApiService'
import pb from '@/lib/pocketbase/client'

describe('nfsApiService — Gestão de Chaves e Ingestão de NFs', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('gera nova chave de API com prefixo orb_nfs_live_ e formato mascarado', async () => {
    const mockCreated = {
      id: 'key_123',
      usuario: 'usr_456',
      empresa_nome: 'MGM Agro Reciclagem Ltda',
      cnpj_vinculado: '12345678000190',
      chave_prefixo: 'orb_nfs_live_',
      chave_hash: 'hash_sha256_mock',
      chave_mascarada: 'orb_nfs_live_...123456',
      ativa: true,
      created: '2026-03-20T10:00:00Z',
      updated: '2026-03-20T10:00:00Z',
    }

    vi.spyOn(pb, 'collection').mockReturnValue({
      getFirstListItem: vi.fn().mockRejectedValue(new Error('not found')),
      create: vi.fn().mockResolvedValue(mockCreated),
    } as any)

    const resultado = await obterOuCriarApiKeyNfs({
      empresaNome: 'MGM Agro Reciclagem Ltda',
      cnpj: '12.345.678/0001-90',
      usuarioId: 'usr_456',
    })

    expect(resultado.chaveCompleta).toBeDefined()
    expect(resultado.chaveCompleta?.startsWith('orb_nfs_live_')).toBe(true)
    expect(resultado.record.id).toBe('key_123')
    expect(resultado.record.ativa).toBe(true)
  })

  it('revoga chave de API atualizando campo ativa para false', async () => {
    const mockUpdated = {
      id: 'key_123',
      ativa: false,
      data_revogacao: '2026-03-20T12:00:00Z',
      motivo_revogacao: 'Revogação manual de teste',
    }

    vi.spyOn(pb, 'collection').mockReturnValue({
      update: vi.fn().mockResolvedValue(mockUpdated),
    } as any)

    const revogada = await revogarApiKeyNfs('key_123', 'Revogação manual de teste')
    expect(revogada.ativa).toBe(false)
    expect(revogada.motivo_revogacao).toBe('Revogação manual de teste')
  })

  it('regenera chave revogando anteriores e emitindo nova', async () => {
    const mockAnteriores = [{ id: 'key_antiga', ativa: true }]
    const mockNova = {
      id: 'key_nova',
      empresa_nome: 'MGM Agro Reciclagem Ltda',
      cnpj_vinculado: '12345678000190',
      chave_prefixo: 'orb_nfs_live_',
      chave_hash: 'hash_sha256_nova',
      chave_mascarada: 'orb_nfs_live_...654321',
      ativa: true,
    }

    vi.spyOn(pb, 'collection').mockReturnValue({
      getFullList: vi.fn().mockResolvedValue(mockAnteriores),
      update: vi.fn().mockResolvedValue({ id: 'key_antiga', ativa: false }),
      create: vi.fn().mockResolvedValue(mockNova),
    } as any)

    const res = await regenerarApiKeyNfs({
      empresaNome: 'MGM Agro Reciclagem Ltda',
      cnpj: '12.345.678/0001-90',
      usuarioId: 'usr_456',
    })

    expect(res.novaChave).toBeDefined()
    expect(res.novaChave.startsWith('orb_nfs_live_')).toBe(true)
    expect(res.record.id).toBe('key_nova')
  })

  it('envia lote de XMLs para /backend/v1/nfs/lotes com header X-API-Key', async () => {
    const mockResposta = {
      sucesso: true,
      status: 'processado',
      lote_id: 'lote_abc123',
      cnpj_vinculado: '12345678000190',
      total_recebidos: 1,
      total_aceitos: 1,
      total_rejeitados: 0,
      documentos_aceitos: [
        {
          indice: 0,
          nfe_id: 'nfe_rec_1',
          chave_acesso: '35240212345678000190550010000001231000001234',
          numero_nota: '123',
          serie: '1',
          data_emissao: '2026-03-20T10:00:00Z',
          cnpj_emitente: '12345678000190',
          cnpj_destinatario: '98765432000110',
          valor_total: 1000,
          valor_pis: 16.5,
          valor_cofins: 76,
          valor_icms: 180,
          qtd_itens: 1,
        },
      ],
      rejeicoes: [],
    }

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 201,
      json: vi.fn().mockResolvedValue(mockResposta),
    } as any)

    const resultado = await enviarLoteNfsApi('orb_nfs_live_testkey12345', {
      documentos: [
        {
          xml: '<nfeProc xmlns="http://www.portalfiscal.inf.br/nfe"><NFe>...</NFe></nfeProc>',
          nome_arquivo: 'teste.xml',
        },
      ],
    })

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/backend/v1/nfs/lotes'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'X-API-Key': 'orb_nfs_live_testkey12345',
        }),
      }),
    )
    expect(resultado.sucesso).toBe(true)
    expect(resultado.total_aceitos).toBe(1)
  })
})
