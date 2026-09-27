import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  cleanCNPJ,
  isValidCNPJ,
  formatTelefone,
  isSituacaoAtiva,
  fetchOpenCNPJ,
  consultarCNPJ,
} from '../cnpj'

describe('Serviço OpenCNPJ e Validador de CNPJ', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('valida dígitos verificadores oficiais de CNPJs válidos e rejeita inválidos', () => {
    // Banco do Brasil
    expect(isValidCNPJ('00.000.000/0001-91')).toBe(true)
    expect(isValidCNPJ('00000000000191')).toBe(true)
    // Petrobras
    expect(isValidCNPJ('33.000.167/0001-01')).toBe(true)

    // Dígitos repetidos
    expect(isValidCNPJ('00000000000000')).toBe(false)
    expect(isValidCNPJ('11111111111111')).toBe(false)

    // DV errado
    expect(isValidCNPJ('00.000.000/0001-90')).toBe(false)
    expect(isValidCNPJ('12345678901234')).toBe(false)
  })

  it('limpa caracteres de formatação do CNPJ', () => {
    expect(cleanCNPJ('00.000.000/0001-91')).toBe('00000000000191')
    expect(cleanCNPJ('33.000.167/0001-01')).toBe('33000167000101')
  })

  it('formata telefones com DDD adequadamente', () => {
    expect(formatTelefone('41', '988887777')).toBe('(41) 98888-7777')
    expect(formatTelefone('11', '33334444')).toBe('(11) 3333-4444')
  })

  it('detecta situação cadastral ativa e inativa', () => {
    expect(isSituacaoAtiva('Ativa')).toBe(true)
    expect(isSituacaoAtiva('ATIVA')).toBe(true)
    expect(isSituacaoAtiva('02')).toBe(true)
    expect(isSituacaoAtiva('BAIXADA')).toBe(false)
    expect(isSituacaoAtiva('INAPTA')).toBe(false)
    expect(isSituacaoAtiva('SUSPENSA')).toBe(false)
  })

  it('processa o payload retornado pela API OpenCNPJ', async () => {
    const mockOpenPayload = {
      cnpj: '00000000000191',
      razao_social: 'BANCO DO BRASIL SA',
      nome_fantasia: 'DIRECAO GERAL',
      situacao_cadastral: 'Ativa',
      data_situacao_cadastral: '2005-11-03',
      cnae_principal: '6422100',
      cnaes_secundarios: ['6499999'],
      cnaes: [
        {
          codigo: '6422100',
          descricao: 'Bancos múltiplos, com carteira comercial',
          is_principal: true,
        },
      ],
      tipo_logradouro: 'PRAÇA',
      logradouro: 'QUINZE DE NOVEMBRO',
      numero: '123',
      bairro: 'CENTRO',
      municipio: 'BRASILIA',
      uf: 'DF',
      cep: '70073901',
      telefones: [{ ddd: '61', numero: '34939000', is_fax: false }],
      porte_empresa: 'Demais',
      opcao_simples: 'N',
    }

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockOpenPayload,
    } as Response)

    const dados = await fetchOpenCNPJ('00000000000191')
    expect(dados.razao_social).toBe('BANCO DO BRASIL SA')
    expect(dados.fonte).toBe('opencnpj')
    expect(dados.ativa).toBe(true)
    expect(dados.cnae_fiscal).toBe('6422100')
    expect(dados.cnae_fiscal_descricao).toBe('Bancos múltiplos, com carteira comercial')
    expect(dados.logradouro).toContain('PRAÇA QUINZE DE NOVEMBRO')
    expect(dados.ddd_telefone).toBe('(61) 3493-9000')
  })

  it('faz fallback para BrasilAPI caso OpenCNPJ falhe com erro de conexão', async () => {
    // 1º fetch (OpenCNPJ) falha com erro de rede
    vi.spyOn(globalThis, 'fetch')
      .mockRejectedValueOnce(new Error('Network error on OpenCNPJ'))
      // 2º fetch (proxy backend) falha
      .mockRejectedValueOnce(new Error('Proxy error'))
      // 3º fetch (BrasilAPI) sucede
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          cnpj: '00000000000191',
          razao_social: 'BANCO DO BRASIL SA',
          descricao_situacao_cadastral: 'ATIVA',
          cnae_fiscal: 6422100,
          cnae_fiscal_descricao: 'Bancos múltiplos',
          logradouro: 'PRACA QUINZE',
          numero: '123',
          municipio: 'BRASILIA',
          uf: 'DF',
          porte: 'DEMAIS',
        }),
      } as Response)

    const dados = await consultarCNPJ('00.000.000/0001-91')
    expect(dados.razao_social).toBe('BANCO DO BRASIL SA')
    expect(dados.fonte).toBe('brasilapi')
  })
})
