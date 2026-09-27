import { describe, it, expect } from 'vitest'
import { validarSenhaForte, avaliarRegrasSenha } from '../passwordPolicy'

describe('passwordPolicy - Regra de Senha Forte da Plataforma Orbis Protocol', () => {
  it('deve reprovar senha com menos de 10 caracteres', () => {
    const res = validarSenhaForte('Ab1!cd')
    expect(res.valida).toBe(false)
    expect(res.erros).toContain('mínimo de 10 caracteres')
  })

  it('deve reprovar senha sem letra maiúscula', () => {
    const res = validarSenhaForte('senhasemalta123!')
    expect(res.valida).toBe(false)
    expect(res.erros.some((e) => e.includes('maiúscula'))).toBe(true)
  })

  it('deve reprovar senha sem letra minúscula', () => {
    const res = validarSenhaForte('SENHASEMBAIXA123!')
    expect(res.valida).toBe(false)
    expect(res.erros.some((e) => e.includes('minúscula'))).toBe(true)
  })

  it('deve reprovar senha sem números', () => {
    const res = validarSenhaForte('SenhaSemNumero!')
    expect(res.valida).toBe(false)
    expect(res.erros.some((e) => e.includes('número'))).toBe(true)
  })

  it('deve reprovar senha sem símbolo ou caractere especial', () => {
    const res = validarSenhaForte('SenhaSemSimbolo123')
    expect(res.valida).toBe(false)
    expect(res.erros.some((e) => e.includes('símbolo'))).toBe(true)
  })

  it('deve aprovar senha com todos os requisitos (mín 10, maiúscula, minúscula, número e símbolo)', () => {
    const res = validarSenhaForte('OrbisProtocol@2026')
    expect(res.valida).toBe(true)
    expect(res.erros).toHaveLength(0)
    expect(res.forca).toBe('forte')
    expect(res.pontos).toBe(5)
  })

  it('avaliarRegrasSenha deve retornar booleans discriminados por regra', () => {
    const regras = avaliarRegrasSenha('Abc12!')
    expect(regras.min10).toBe(false)
    expect(regras.maiuscula).toBe(true)
    expect(regras.minuscula).toBe(true)
    expect(regras.numero).toBe(true)
    expect(regras.simbolo).toBe(true)
  })
})
