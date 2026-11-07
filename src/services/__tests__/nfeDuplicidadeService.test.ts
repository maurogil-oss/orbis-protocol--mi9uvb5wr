import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  verificarDuplicidadeNfe,
  formatarDataImportacao,
  buildMensagemDuplicidade,
} from '@/services/nfeDuplicidadeService'
import pb from '@/lib/pocketbase/client'

describe('nfeDuplicidadeService — Bloqueio de Duplicidade de NF-e no Produto de Pegada', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('formata datas de importação corretamente para exibição amigável', () => {
    expect(formatarDataImportacao('2026-03-15 14:20:00.000Z')).toBe('15/03/2026')
    expect(formatarDataImportacao('2026-11-07')).toBe('07/11/2026')
    expect(formatarDataImportacao('')).toBe('data não identificada')
    expect(formatarDataImportacao(undefined)).toBe('data não identificada')
  })

  it('constrói a mensagem clara ao usuário contendo a data da importação anterior e número da nota', () => {
    const msgComNota = buildMensagemDuplicidade('15/03/2026', '1045')
    expect(msgComNota).toBe(
      'Esta nota (Nota nº 1045) já foi importada em 15/03/2026 — importação bloqueada por duplicidade.',
    )

    const msgSemNota = buildMensagemDuplicidade('10/01/2026')
    expect(msgSemNota).toBe(
      'Esta nota já foi importada em 10/01/2026 — importação bloqueada por duplicidade.',
    )
  })

  it('retorna duplicada = false quando chave_acesso não é informada ou é vazia', async () => {
    const res1 = await verificarDuplicidadeNfe(undefined)
    expect(res1.duplicada).toBe(false)

    const res2 = await verificarDuplicidadeNfe('')
    expect(res2.duplicada).toBe(false)

    const res3 = await verificarDuplicidadeNfe('   ')
    expect(res3.duplicada).toBe(false)
  })

  it('permite importação de nova nota (chave não existente → 404)', async () => {
    const chaveNova = '41260300000000000191550010000010451000010450'

    vi.spyOn(pb, 'collection').mockReturnValue({
      getFirstListItem: vi.fn().mockRejectedValue({
        status: 404,
        message: 'The requested resource was not found.',
      }),
    } as any)

    const res = await verificarDuplicidadeNfe(chaveNova)

    expect(res.duplicada).toBe(false)
    expect(res.idExistente).toBeUndefined()
    expect(res.mensagem).toBeUndefined()
  })

  it('rejeita importação duplicada quando a mesma chave já existe (retorna mensagem clara com a data)', async () => {
    const chaveExistente = '41260300000000000191550010000010451000010450'
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    vi.spyOn(pb, 'collection').mockReturnValue({
      getFirstListItem: vi.fn().mockResolvedValue({
        id: 'rec_nfe_12345',
        chave_acesso: chaveExistente,
        numero_nota: '1045',
        created: '2026-03-15 10:30:00.000Z',
      }),
    } as any)

    const res = await verificarDuplicidadeNfe(chaveExistente)

    expect(res.duplicada).toBe(true)
    expect(res.idExistente).toBe('rec_nfe_12345')
    expect(res.dataImportacao).toBe('15/03/2026')
    expect(res.numeroNota).toBe('1045')
    expect(res.mensagem).toContain(
      'Esta nota (Nota nº 1045) já foi importada em 15/03/2026 — importação bloqueada por duplicidade.',
    )
    expect(warnSpy).toHaveBeenCalled()

    warnSpy.mockRestore()
  })

  it('limpa pontuação/máscara da chave antes de consultar duplicidade', async () => {
    const chaveFormatada = '41.2603.00.000.000/0001-91-55-001-000001045-1-00001045-0'
    const chaveLimpaEsperada = '41260300000000000191550010000010451000010450'

    const mockGetFirstListItem = vi.fn().mockResolvedValue({
      id: 'rec_existente_99',
      chave_acesso: chaveLimpaEsperada,
      numero_nota: '1045',
      created: '2026-02-20',
    })

    vi.spyOn(pb, 'collection').mockReturnValue({
      getFirstListItem: mockGetFirstListItem,
    } as any)

    const res = await verificarDuplicidadeNfe(chaveFormatada)

    expect(mockGetFirstListItem).toHaveBeenCalledWith(
      `chave_acesso = "${chaveLimpaEsperada}"`,
      expect.anything(),
    )
    expect(res.duplicada).toBe(true)
  })

  it('fluxo sequencial: primeira importação passa, segunda importação da mesma chave é rejeitada', async () => {
    const chaveTeste = '41260300000000000191550010000099991000099990'
    const dbSimulado = new Map<string, any>()

    const mockCollection = {
      getFirstListItem: vi.fn().mockImplementation(async (filter: string) => {
        for (const [chave, rec] of dbSimulado.entries()) {
          if (filter.includes(chave)) return rec
        }
        const err: any = new Error('Not found')
        err.status = 404
        throw err
      }),
    }
    vi.spyOn(pb, 'collection').mockReturnValue(mockCollection as any)

    // 1ª importação: não existe no banco
    const primeira = await verificarDuplicidadeNfe(chaveTeste)
    expect(primeira.duplicada).toBe(false)

    // Simula a gravação no banco
    dbSimulado.set(chaveTeste, {
      id: 'nfe_primeiro_upload',
      chave_acesso: chaveTeste,
      numero_nota: '9999',
      created: '2026-04-01 08:00:00.000Z',
    })

    // 2ª importação da mesma chave: deve ser rejeitada com erro de duplicidade
    const segunda = await verificarDuplicidadeNfe(chaveTeste)
    expect(segunda.duplicada).toBe(true)
    expect(segunda.mensagem).toContain(
      'Esta nota (Nota nº 9999) já foi importada em 01/04/2026 — importação bloqueada por duplicidade.',
    )

    // 3ª importação com chave DIFERENTE: deve passar
    const chaveOutra = '35260300000000000191550010000088881000088880'
    const terceira = await verificarDuplicidadeNfe(chaveOutra)
    expect(terceira.duplicada).toBe(false)
  })
})
