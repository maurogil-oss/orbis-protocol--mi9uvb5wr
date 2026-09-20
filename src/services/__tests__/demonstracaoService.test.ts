import { describe, it, expect } from 'vitest'
import { isValidCNPJ, cleanCNPJ } from '../cnpj'
import {
  EMPRESAS_MODELO_DEMONSTRACAO,
  isCnpjDemonstracao,
  obterModeloDemonstracao,
  obterModeloDemonstracaoPorRaiz,
  converterModeloParaDadosCNPJ,
} from '../demonstracaoService'

describe('Base Demonstrativa Pedagógica - CNPJs e Algoritmo Oficial Receita Federal', () => {
  it('deve conter exatamente os 4 modelos pedagógicos de demonstração', () => {
    expect(EMPRESAS_MODELO_DEMONSTRACAO).toHaveLength(4)
  })

  it('todos os 4 CNPJs corrigidos devem ser matematicamente válidos segundo isValidCNPJ', () => {
    const cnpjsEsperados = [
      '76.123.456/0001-00',
      '14.882.310/0001-91',
      '43.904.740/0001-65',
      '18.394.029/0001-60',
    ]

    for (let i = 0; i < EMPRESAS_MODELO_DEMONSTRACAO.length; i++) {
      const modelo = EMPRESAS_MODELO_DEMONSTRACAO[i]
      expect(modelo.cnpj).toBe(cnpjsEsperados[i])
      expect(modelo.cnpjLimpo).toBe(cleanCNPJ(cnpjsEsperados[i]))

      // Verificação estrita pelo algoritmo oficial da Receita (pesos 5..2 e 6..2)
      expect(isValidCNPJ(modelo.cnpj)).toBe(true)
      expect(isValidCNPJ(modelo.cnpjLimpo)).toBe(true)
    }
  })

  it('deve manter proporção de 2 Lucro Presumido e 2 Lucro Real', () => {
    const presumido = EMPRESAS_MODELO_DEMONSTRACAO.filter(
      (m) => m.regime_tributario === 'Lucro Presumido',
    )
    const real = EMPRESAS_MODELO_DEMONSTRACAO.filter((m) => m.regime_tributario === 'Lucro Real')

    expect(presumido).toHaveLength(2)
    expect(real).toHaveLength(2)
  })

  it('isCnpjDemonstracao deve reconhecer os 4 CNPJs tanto formatados quanto limpos', () => {
    expect(isCnpjDemonstracao('76.123.456/0001-00')).toBe(true)
    expect(isCnpjDemonstracao('76123456000100')).toBe(true)
    expect(isCnpjDemonstracao('14.882.310/0001-91')).toBe(true)
    expect(isCnpjDemonstracao('14882310000191')).toBe(true)
    expect(isCnpjDemonstracao('43.904.740/0001-65')).toBe(true)
    expect(isCnpjDemonstracao('43904740000165')).toBe(true)
    expect(isCnpjDemonstracao('18.394.029/0001-60')).toBe(true)
    expect(isCnpjDemonstracao('18394029000160')).toBe(true)

    // CNPJ aleatório ou não cadastrado
    expect(isCnpjDemonstracao('11.222.333/0001-81')).toBe(false)
  })

  it('obterModeloDemonstracao deve retornar o modelo correto', () => {
    const modelo1 = obterModeloDemonstracao('76.123.456/0001-00')
    expect(modelo1).not.toBeNull()
    expect(modelo1?.id).toBe('demo-lp-1')
    expect(modelo1?.razao_social).toBe('Empresa Demonstrativa — Lucro Presumido Ltda.')
    expect(modelo1?.regime_tributario).toBe('Lucro Presumido')

    const modelo2 = obterModeloDemonstracao('14.882.310/0001-91')
    expect(modelo2).not.toBeNull()
    expect(modelo2?.id).toBe('demo-lr-1')
    expect(modelo2?.regime_tributario).toBe('Lucro Real')
  })

  it('obterModeloDemonstracaoPorRaiz deve sugerir o modelo correto para DVs incorretos ou antigos', () => {
    // CNPJ antigo que travava o diagnóstico com DV -12 ou -49
    const sugestao1 = obterModeloDemonstracaoPorRaiz('76.123.456/0001-12')
    expect(sugestao1).not.toBeNull()
    expect(sugestao1?.cnpj).toBe('76.123.456/0001-00')

    const sugestao2 = obterModeloDemonstracaoPorRaiz('14.882.310/0001-81')
    expect(sugestao2).not.toBeNull()
    expect(sugestao2?.cnpj).toBe('14.882.310/0001-91')

    const sugestao3 = obterModeloDemonstracaoPorRaiz('43.904.740/0001-81')
    expect(sugestao3).not.toBeNull()
    expect(sugestao3?.cnpj).toBe('43.904.740/0001-65')

    const sugestao4 = obterModeloDemonstracaoPorRaiz('18.394.029/0001-44')
    expect(sugestao4).not.toBeNull()
    expect(sugestao4?.cnpj).toBe('18.394.029/0001-60')

    // Raiz desconhecida não sugere nada
    expect(obterModeloDemonstracaoPorRaiz('99.999.999/0001-00')).toBeNull()
  })

  it('converterModeloParaDadosCNPJ deve preencher a estrutura de dados sem consultar a Receita', () => {
    const modelo = EMPRESAS_MODELO_DEMONSTRACAO[0]
    const dados = converterModeloParaDadosCNPJ(modelo)

    expect(dados.cnpj).toBe('76123456000100')
    expect(dados.razao_social).toBe('Empresa Demonstrativa — Lucro Presumido Ltda.')
    expect(dados.situacao_cadastral).toBe('2')
    expect(dados.descricao_situacao_cadastral).toContain('ATIVA')
    expect(dados.regime_tributario_sugerido).toBe('Lucro Presumido')
  })
})
