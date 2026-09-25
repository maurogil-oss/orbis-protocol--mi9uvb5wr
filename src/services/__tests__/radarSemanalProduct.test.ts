import { describe, it, expect } from 'vitest'
import {
  PLANOS_RADAR_SEMANAL,
  verificarAcessoRadar,
  AVISO_LEGAL_RADAR,
} from '@/services/radarSemanalService'

describe('Radar Semanal - Regras de Negócio e Precificação por Faixa de CNPJs', () => {
  it('deve ter exatamente os planos por faixa de CNPJs especificados', () => {
    expect(PLANOS_RADAR_SEMANAL).toHaveLength(4)

    const p1 = PLANOS_RADAR_SEMANAL.find((p) => p.id === '1_cnpj')
    expect(p1).toBeDefined()
    expect(p1?.precoMensal).toBe(59)
    expect(p1?.precoTexto).toBe('R$ 59/mês')

    const p5 = PLANOS_RADAR_SEMANAL.find((p) => p.id === 'ate_5_cnpjs')
    expect(p5).toBeDefined()
    expect(p5?.precoMensal).toBe(149)
    expect(p5?.precoTexto).toBe('R$ 149/mês')

    const p30 = PLANOS_RADAR_SEMANAL.find((p) => p.id === 'ate_30_cnpjs')
    expect(p30).toBeDefined()
    expect(p30?.precoMensal).toBe(249)
    expect(p30?.precoTexto).toBe('R$ 249/mês')

    const pCorp = PLANOS_RADAR_SEMANAL.find((p) => p.id === 'acima_30_sob_consulta')
    expect(pCorp).toBeDefined()
    expect(pCorp?.precoMensal).toBeNull()
    expect(pCorp?.precoTexto).toBe('Sob consulta')
  })

  it('deve conter as regras de licença corretas para 1 CNPJ e Multi-CNPJs', () => {
    const p1 = PLANOS_RADAR_SEMANAL.find((p) => p.id === '1_cnpj')!
    expect(p1.regraLicenca.toLowerCase()).toContain('uso exclusivo interno')

    const p30 = PLANOS_RADAR_SEMANAL.find((p) => p.id === 'ate_30_cnpjs')!
    expect(p30.regraLicenca.toLowerCase()).toContain(
      'repasse de informativos expressamente permitido',
    )
  })

  it('deve validar permissões de acesso: admin sempre tem acesso', () => {
    const adminUser = { role: 'admin' }
    const res = verificarAcessoRadar(adminUser)
    expect(res.temAcesso).toBe(true)
    expect(res.motivo).toBe('admin')
  })

  it('deve validar trial ativo dentro dos 15 dias', () => {
    const futuro = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString()
    const trialUser = {
      role: 'cliente',
      radar_acesso_status: 'trial',
      radar_trial_fim: futuro,
      radar_plano_faixa: '1_cnpj',
    }
    const res = verificarAcessoRadar(trialUser)
    expect(res.temAcesso).toBe(true)
    expect(res.motivo).toBe('trial_ativo')
    expect(res.diasRestantesTrial).toBeGreaterThan(0)
  })

  it('deve barrar trial expirado', () => {
    const passado = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    const trialExpirado = {
      role: 'cliente',
      radar_acesso_status: 'trial',
      radar_trial_fim: passado,
    }
    const res = verificarAcessoRadar(trialExpirado)
    expect(res.temAcesso).toBe(false)
    expect(res.motivo).toBe('trial_expirado')
  })

  it('deve barrar usuário comum sem trial ou assinatura', () => {
    const usuarioSemNada = { role: 'cliente', radar_acesso_status: 'nenhum' }
    const res = verificarAcessoRadar(usuarioSemNada)
    expect(res.temAcesso).toBe(false)
    expect(res.motivo).toBe('sem_acesso')
  })

  it('deve conter rodapé informativo padronizado sem prometer crédito de carbono', () => {
    expect(AVISO_LEGAL_RADAR).toContain('não substitui assessoria jurídica ou contábil')
    expect(AVISO_LEGAL_RADAR).not.toContain('crédito de carbono')
  })
})
