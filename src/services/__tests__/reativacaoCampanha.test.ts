import { describe, it, expect } from 'vitest'
import {
  calcularInatividadeUsuario,
  calcularMetricasReativacao,
  exportarEnviosReativacaoCsv,
  ReativacaoEnvioRecord,
} from '../reativacaoService'

describe('Serviço de Campanha de Reativação por E-mail', () => {
  const agora = new Date()

  const criarDataPassada = (diasAtras: number) => {
    return new Date(agora.getTime() - diasAtras * 24 * 60 * 60 * 1000).toISOString()
  }

  it('identifica corretamente usuário ativo (< 30 dias de inatividade) como não elegível a toques', () => {
    const user = {
      id: 'u1',
      email: 'ativo@empresa.com',
      name: 'Empresa Ativa',
      cnpj: '11.111.111/0001-11',
    }
    const nfes = [{ id: 'nf1', usuario: 'u1', created: criarDataPassada(5) }]

    const resultado = calcularInatividadeUsuario(user, nfes, [], [], [])
    expect(resultado.diasInatividade).toBe(5)
    expect(resultado.toqueElegivel).toBeNull()
    expect(resultado.snapshot.nfe_consultadas).toBe(1)
  })

  it('identifica usuário inativo há 35 dias como elegível para Toque D30 com snapshot fiel da conta', () => {
    const user = {
      id: 'u2',
      email: 'inativo30@empresa.com',
      name: 'Empresa D30',
      cnpj: '22.222.222/0001-22',
    }
    const nfes = [
      { id: 'nf1', usuario: 'u2', created: criarDataPassada(35) },
      { id: 'nf2', usuario: 'u2', created: criarDataPassada(40) },
    ]
    const infos = [{ id: 'info1', usuario: 'u2', created: criarDataPassada(45) }]
    const lotes = [{ id: 'lote1', cdv_cnpj: '22222222000122', created: criarDataPassada(50) }]
    const relatorios: any[] = [] // 0 laudos exportados -> laudo pendente detectado

    const resultado = calcularInatividadeUsuario(user, nfes, infos, lotes, relatorios)
    expect(resultado.diasInatividade).toBe(35)
    expect(resultado.toqueElegivel).toBe('d30')
    expect(resultado.snapshot.nfe_consultadas).toBe(2)
    expect(resultado.snapshot.infosimples_consultas).toBe(1)
    expect(resultado.snapshot.lotes_cdv).toBe(1)
    expect(resultado.snapshot.laudos_exportados).toBe(0)
    expect(resultado.snapshot.laudos_pendentes).toBe(1)
  })

  it('identifica usuário inativo há 70 dias como elegível para Toque D60 (valor regulatório)', () => {
    const user = {
      id: 'u3',
      email: 'inativo60@empresa.com',
      name: 'Empresa D60',
      cnpj: '33.333.333/0001-33',
    }
    const nfes = [{ id: 'nf1', usuario: 'u3', created: criarDataPassada(70) }]
    const relatorios = [
      { id: 'rel1', usuario: 'u3', assinado_icp_brasil: true, created: criarDataPassada(75) },
    ]

    const resultado = calcularInatividadeUsuario(user, nfes, [], [], relatorios)
    expect(resultado.diasInatividade).toBe(70)
    expect(resultado.toqueElegivel).toBe('d60')
    expect(resultado.snapshot.laudos_exportados).toBe(1)
    expect(resultado.snapshot.laudos_assinados_icp).toBe(1)
  })

  it('respeita o opt-out do usuário e deduplica envios nos últimos 30 dias', () => {
    const userOptOut = {
      id: 'u4',
      email: 'optout@empresa.com',
      name: 'Empresa OptOut',
      cnpj: '44.444.444/0001-44',
      opt_out_reativacao: true,
      opt_out_reativacao_data: criarDataPassada(10),
    }

    const nfes = [{ id: 'nf1', usuario: 'u4', created: criarDataPassada(45) }]
    const resultadoOpt = calcularInatividadeUsuario(userOptOut, nfes, [], [], [])
    expect(resultadoOpt.optOut).toBe(true)

    // Teste de deduplicação (já enviado há 12 dias)
    const enviosAnteriores: ReativacaoEnvioRecord[] = [
      {
        id: 'env1',
        usuario: 'u4',
        toque: 'd30',
        data_envio: criarDataPassada(12).split('T')[0],
        status: 'enviado',
        destinatario_email: 'optout@empresa.com',
        dados_conta_json: resultadoOpt.snapshot,
        created: criarDataPassada(12),
        updated: criarDataPassada(12),
      },
    ]

    const resultadoDedup = calcularInatividadeUsuario(
      userOptOut,
      nfes,
      [],
      [],
      [],
      enviosAnteriores,
    )
    expect(resultadoDedup.jaEnviadoUltimos30d).toBe(true)
  })

  it('detecta reativação de usuário se houver nova atividade registrada após o envio do e-mail', () => {
    const user = {
      id: 'u5',
      email: 'reativou@empresa.com',
      name: 'Empresa Voltou',
      cnpj: '55.555.555/0001-55',
    }
    // Envio ocorreu há 20 dias
    const envios: ReativacaoEnvioRecord[] = [
      {
        id: 'env5',
        usuario: 'u5',
        toque: 'd30',
        data_envio: criarDataPassada(20).split('T')[0],
        status: 'enviado',
        destinatario_email: 'reativou@empresa.com',
        dados_conta_json: {} as any,
        created: criarDataPassada(20),
        updated: criarDataPassada(20),
      },
    ]

    // Usuário subiu nova NF há 5 dias (após os 20 dias do envio)
    const nfes = [{ id: 'nf_nova', usuario: 'u5', created: criarDataPassada(5) }]

    const resultado = calcularInatividadeUsuario(user, nfes, [], [], [], envios)
    expect(resultado.reativouAposUltimoEnvio).toBe(true)
  })

  it('calcula métricas consolidadas, contagem de gatilhos e taxa de retorno corretamente', () => {
    const elegibilidades = [
      {
        usuarioId: 'u1',
        nome: 'U1',
        email: 'u1@teste.com',
        cnpj: '',
        diasInatividade: 35,
        ultimaAtividadeData: '',
        toqueElegivel: 'd30' as const,
        optOut: false,
        jaEnviadoUltimos30d: false,
        snapshot: {} as any,
        reativouAposUltimoEnvio: false,
      },
      {
        usuarioId: 'u2',
        nome: 'U2',
        email: 'u2@teste.com',
        cnpj: '',
        diasInatividade: 65,
        ultimaAtividadeData: '',
        toqueElegivel: 'd60' as const,
        optOut: false,
        jaEnviadoUltimos30d: false,
        snapshot: {} as any,
        reativouAposUltimoEnvio: true, // Reativou!
      },
      {
        usuarioId: 'u3',
        nome: 'U3',
        email: 'u3@teste.com',
        cnpj: '',
        diasInatividade: 40,
        ultimaAtividadeData: '',
        toqueElegivel: 'd30' as const,
        optOut: true, // Opt-out
        jaEnviadoUltimos30d: false,
        snapshot: {} as any,
        reativouAposUltimoEnvio: false,
      },
    ]

    const envios: ReativacaoEnvioRecord[] = [
      {
        id: 'env1',
        usuario: 'u1',
        toque: 'd30',
        data_envio: '2026-03-01',
        status: 'enviado',
        destinatario_email: 'u1@teste.com',
        dados_conta_json: {} as any,
        created: '2026-03-01T10:00:00Z',
        updated: '2026-03-01T10:00:00Z',
      },
      {
        id: 'env2',
        usuario: 'u2',
        toque: 'd60',
        data_envio: '2026-03-02',
        status: 'enviado',
        destinatario_email: 'u2@teste.com',
        dados_conta_json: {} as any,
        created: '2026-03-02T10:00:00Z',
        updated: '2026-03-02T10:00:00Z',
      },
      {
        id: 'env3',
        usuario: 'uX',
        toque: 'd30',
        data_envio: '2026-03-03',
        status: 'falha',
        destinatario_email: 'falha@teste.com',
        dados_conta_json: {} as any,
        mensagem_erro: 'SMTP timeout',
        created: '2026-03-03T10:00:00Z',
        updated: '2026-03-03T10:00:00Z',
      },
    ]

    const metricas = calcularMetricasReativacao(elegibilidades, envios)
    expect(metricas.totalUsuariosAvaliados).toBe(3)
    expect(metricas.gatilhoD30Count).toBe(1) // u3 tem opt-out
    expect(metricas.gatilhoD60Count).toBe(1)
    expect(metricas.totalEnviadosD30).toBe(1)
    expect(metricas.totalEnviadosD60).toBe(1)
    expect(metricas.totalFalhas).toBe(1)
    expect(metricas.totalOptOutsAtivos).toBe(1)
    expect(metricas.usuariosReativadosCount).toBe(1) // u2
    expect(metricas.taxaRetornoPercentual).toBe(50) // 1 de 2 usuários com envio com sucesso
  })

  it('exporta histórico de envios para formato CSV com cabeçalhos padronizados e BOM UTF-8', () => {
    const envios: ReativacaoEnvioRecord[] = [
      {
        id: 'rec12345',
        usuario: 'u1',
        toque: 'd30',
        data_envio: '2026-03-15',
        status: 'enviado',
        destinatario_email: 'contato@cliente.com.br',
        dados_conta_json: {
          nfe_consultadas: 14,
          infosimples_consultas: 2,
          lotes_cdv: 3,
          laudos_exportados: 1,
          laudos_assinados_icp: 1,
          laudos_pendentes: 0,
          ultima_atividade_data: '2026-02-10T12:00:00Z',
          dias_inatividade: 33,
          ultimo_lote_data_formatada: '10/02/2026',
        },
        reativou: true,
        created: '2026-03-15T08:00:00Z',
        updated: '2026-03-15T08:00:00Z',
      },
    ]

    const { conteudoCsv, nomeArquivo, totalRegistros } = exportarEnviosReativacaoCsv(envios)
    expect(totalRegistros).toBe(1)
    expect(nomeArquivo).toContain('campanha_reativacao_orbis_')
    expect(conteudoCsv.startsWith('\uFEFF')).toBe(true)
    expect(conteudoCsv).toContain('ID Envio;Data/Hora Envio;Toque')
    expect(conteudoCsv).toContain('"rec12345"')
    expect(conteudoCsv).toContain('"contato@cliente.com.br"')
    expect(conteudoCsv).toContain('14;3;1;33;SIM')
  })
})
