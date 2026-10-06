import { describe, it, expect } from 'vitest'
import {
  avaliarEstadoLicenca,
  LIMITE_NOTAS_TRIAL_PADRAO,
  DURACAO_DIAS_TRIAL_PADRAO,
  UsuarioLicencaInput,
} from '../licencaService'

describe('licencaService — Modelo de Comercialização', () => {
  it('garante parâmetros constantes: trial de 15 dias e limite exato de 5 notas iniciais', () => {
    expect(DURACAO_DIAS_TRIAL_PADRAO).toBe(15)
    expect(LIMITE_NOTAS_TRIAL_PADRAO).toBe(5)
  })

  it('avalia usuário não autenticado como cadastro gratuito com diagnóstico do CNPJ liberado sem valores de nota', () => {
    const estado = avaliarEstadoLicenca(null)

    expect(estado.camada).toBe('free_cadastro')
    expect(estado.isFreeCadastro).toBe(true)
    expect(estado.podeVerDiagnosticoCnpjCompleto).toBe(true)
    expect(estado.podeImportarNovasNotas).toBe(false)
    expect(estado.podeVerPegadaPorNota).toBe(false)
    expect(estado.podeVerSituacaoTributariaPorNota).toBe(false)
  })

  it('avalia cadastro gratuito explícito sem notas permitidas e sem valores de nota', () => {
    const user: UsuarioLicencaInput = {
      id: 'usr_free',
      licenca_camada: 'free_cadastro',
    }

    const estado = avaliarEstadoLicenca(user)

    expect(estado.camada).toBe('free_cadastro')
    expect(estado.podeVerDiagnosticoCnpjCompleto).toBe(true)
    expect(estado.podeImportarNovasNotas).toBe(false)
    expect(estado.podeVerPegadaPorNota).toBe(false)
  })

  it('avalia trial ativo de 15 dias com 5 notas iniciais', () => {
    const agora = new Date()
    const fim = new Date(agora.getTime() + 10 * 24 * 60 * 60 * 1000) // restam 10 dias

    const user: UsuarioLicencaInput = {
      id: 'usr_trial',
      role: 'cliente',
      licenca_camada: 'trial',
      trial_tipo: 'trial_15d_5notas',
      trial_inicio: agora.toISOString(),
      trial_fim: fim.toISOString(),
      trial_notas_limite: 5,
      trial_notas_consumidas: 2,
    }

    const estado = avaliarEstadoLicenca(user, 2)

    expect(estado.isTrial).toBe(true)
    expect(estado.trialAtivo).toBe(true)
    expect(estado.bloqueioSuaveAtivo).toBe(false)
    expect(estado.notasLimite).toBe(5)
    expect(estado.notasConsumidas).toBe(2)
    expect(estado.notasRestantes).toBe(3)
    expect(estado.diasRestantesTrial).toBeGreaterThanOrEqual(9)
    expect(estado.podeImportarNovasNotas).toBe(true)
    expect(estado.podeVerPegadaPorNota).toBe(true) // Produto central
    expect(estado.podeVerSituacaoTributariaPorNota).toBe(true) // Plus atração
    expect(estado.podeEmitirLaudoPericialCompleto).toBe(false) // Reservado ao plano
  })

  it('aplica BLOQUEIO SUAVE quando o usuário atinge o limite de 5 notas consumidas no trial', () => {
    const agora = new Date()
    const fim = new Date(agora.getTime() + 10 * 24 * 60 * 60 * 1000)

    const user: UsuarioLicencaInput = {
      id: 'usr_trial_cheio',
      role: 'cliente',
      licenca_camada: 'trial',
      trial_tipo: 'trial_15d_5notas',
      trial_inicio: agora.toISOString(),
      trial_fim: fim.toISOString(),
      trial_notas_limite: 5,
      trial_notas_consumidas: 5,
    }

    const estado = avaliarEstadoLicenca(user, 5)

    expect(estado.trialEsgotadoPorNotas).toBe(true)
    expect(estado.bloqueioSuaveAtivo).toBe(true)
    expect(estado.motivoBloqueio).toBe('limite_notas_atingido')
    expect(estado.podeImportarNovasNotas).toBe(false) // Bloqueia novas importações
    expect(estado.podeVerPegadaPorNota).toBe(true) // Preserva acesso aos resultados anteriores (suave!)
    expect(estado.notasRestantes).toBe(0)
  })

  it('aplica BLOQUEIO SUAVE quando o trial expira por tempo (15 dias decorridos)', () => {
    const passado = new Date(Date.now() - 16 * 24 * 60 * 60 * 1000)
    const fimPassado = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)

    const user: UsuarioLicencaInput = {
      id: 'usr_trial_expirado',
      role: 'cliente',
      licenca_camada: 'trial',
      trial_tipo: 'trial_15d_5notas',
      trial_inicio: passado.toISOString(),
      trial_fim: fimPassado.toISOString(),
      trial_notas_limite: 5,
      trial_notas_consumidas: 3,
    }

    const estado = avaliarEstadoLicenca(user, 3)

    expect(estado.trialExpiradoPorTempo).toBe(true)
    expect(estado.bloqueioSuaveAtivo).toBe(true)
    expect(estado.motivoBloqueio).toBe('dias_expirados')
    expect(estado.diasRestantesTrial).toBe(0)
    expect(estado.podeImportarNovasNotas).toBe(false) // Não permite novas notas
    expect(estado.podeVerPegadaPorNota).toBe(true) // Não derruba sessão e preserva dados anteriores
  })

  it('avalia plano contratado com acesso contínuo ilimitado e laudos probatórios completos', () => {
    const user: UsuarioLicencaInput = {
      id: 'usr_plano',
      role: 'cliente',
      plano_ativo: 'Plano Essencial dMRV',
      assinatura_status: 'ativa',
      licenca_camada: 'plano_contratado',
    }

    const estado = avaliarEstadoLicenca(user, 42)

    expect(estado.isPlanoContratado).toBe(true)
    expect(estado.bloqueioSuaveAtivo).toBe(false)
    expect(estado.podeImportarNovasNotas).toBe(true)
    expect(estado.podeEmitirLaudoPericialCompleto).toBe(true)
    expect(estado.podeVerPegadaPorNota).toBe(true)
    expect(estado.podeVerSituacaoTributariaPorNota).toBe(true)
    expect(estado.notasLimite).toBeGreaterThan(1000)
  })

  it('concede acesso de plano ilimitado para papéis de governança master, admin e perito', () => {
    const masterUser: UsuarioLicencaInput = {
      id: 'usr_master',
      role: 'master',
    }
    const peritoUser: UsuarioLicencaInput = {
      id: 'usr_perito',
      role: 'perito',
    }

    expect(avaliarEstadoLicenca(masterUser).isPlanoContratado).toBe(true)
    expect(avaliarEstadoLicenca(peritoUser).isPlanoContratado).toBe(true)
  })
})
