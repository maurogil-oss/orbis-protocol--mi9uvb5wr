import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  normalizarNfeUpload,
  normalizarInfosimples,
  normalizarCdvLote,
  normalizarRelatorioExportado,
  consolidarLinhaDoTempo,
  filtrarLinhaDoTempo,
  calcularMetricasHistorico,
  exportarHistoricoConsultasCsv,
} from '@/services/historicoConsultasService'

describe('historicoConsultasService - Agregação e Normalização das 4 Coleções', () => {
  const mockNfeReal = {
    id: 'nfe001',
    chave_acesso: '35260111222333000199550010000012341234567890',
    numero_nota: '1234',
    cnpj_emitente: '11.222.333/0001-99',
    nome_emitente: 'Auto Peças Circular Ltda',
    valor_total_nf: 15400.5,
    created: '2025-05-10T14:30:00.000Z',
    origem: 'upload',
    expand: {
      usuario: {
        id: 'usr-1',
        name: 'Operador Fiscal',
        email: 'fiscal@circular.com.br',
        cnpj: '11.222.333/0001-99',
      },
    },
  }

  const mockNfeSandbox = {
    id: 'nfe-sand',
    chave_acesso: 'SANDBOX-35260111222333000199550010000012341234567890',
    numero_nota: '9999',
    cnpj_emitente: '11.222.333/0001-99',
    nome_emitente: 'Auto Peças Circular Ltda',
    valor_total_nf: 500,
    created: '2025-05-10T15:00:00.000Z',
    origem: 'sintetico',
  }

  const mockInfosimples = {
    id: 'info001',
    chave_acesso: '35260111222333000199550010000012341234567890',
    tipo_consulta: 'nfe_completa_sefaz',
    status: 'sucesso',
    custo_creditos: 1.25,
    created: '2025-05-11T10:00:00.000Z',
    expand: {
      usuario: {
        id: 'usr-1',
        name: 'Operador Fiscal',
        email: 'fiscal@circular.com.br',
        cnpj: '11.222.333/0001-99',
      },
    },
    codigo_retorno: 200,
    mensagem_retorno: 'Consulta SEFAZ autorizada com sucesso',
  }

  const mockCdvLote = {
    id: 'cdv001',
    cdv_codigo: 'LOTE-CDV-2025-089',
    cdv_cnpj: '22.333.444/0001-88',
    cdv_nome: 'Desmonte Ecológico São Paulo',
    veiculo_marca_modelo: 'VW Gol 1.0 2018',
    total_pecas: 49,
    total_peso_kg: 850,
    total_co2e_evitado_kg: 1250.4,
    status: 'processado',
    created: '2025-05-12T09:15:00.000Z',
  }

  const mockRelatorioExportado = {
    id: 'rel001',
    codigo_verificacao: 'VRF-2025-998811',
    cnpj: '11.222.333/0001-99',
    razao_social: 'Auto Peças Circular Ltda',
    tipo_relatorio: 'dossie_completo_pericial',
    hash_sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    assinado_icp_brasil: true,
    created: '2025-05-13T16:45:00.000Z',
    gerado_por_nome: 'Eng. Mauro Gil (Perito)',
  }

  it('normaliza corretamente registro de nfe_upload', () => {
    const item = normalizarNfeUpload(mockNfeReal)
    expect(item.id).toBe('nfe-nfe001')
    expect(item.tipo).toBe('nfe_upload')
    expect(item.referencia).toBe(mockNfeReal.chave_acesso)
    expect(item.empresaCnpj).toBe('11.222.333/0001-99')
    expect(item.isSandbox).toBe(false)
    expect(item.statusVariante).toBe('sucesso')
  })

  it('detecta se o registro de nfe_upload é sandbox/sintético', () => {
    const item = normalizarNfeUpload(mockNfeSandbox)
    expect(item.isSandbox).toBe(true)
  })

  it('normaliza corretamente registro de infosimples_consultas com custo de créditos', () => {
    const item = normalizarInfosimples(mockInfosimples)
    expect(item.id).toBe('info-info001')
    expect(item.tipo).toBe('infosimples')
    expect(item.custoCreditos).toBe(1.25)
    expect(item.statusVariante).toBe('sucesso')
    expect(item.referencia).toBe(mockInfosimples.chave_acesso)
  })

  it('normaliza cdv_lotes e relatorios_exportados', () => {
    const lote = normalizarCdvLote(mockCdvLote)
    expect(lote.tipo).toBe('cdv_lote')
    expect(lote.referencia).toBe('LOTE-CDV-2025-089')
    expect(lote.empresaCnpj).toBe('22.333.444/0001-88')

    const laudo = normalizarRelatorioExportado(mockRelatorioExportado)
    expect(laudo.tipo).toBe('relatorio_exportado')
    expect(laudo.referencia).toBe('VRF-2025-998811')
    expect(laudo.statusRotulo).toContain('Assinado ICP-Brasil')
    expect(laudo.dadosCompletos.hash_sha256).toBe(mockRelatorioExportado.hash_sha256)
  })

  it('consolida e ordena cronologicamente (mais recente primeiro) as 4 coleções', () => {
    const unificados = consolidarLinhaDoTempo(
      [mockNfeReal],
      [mockInfosimples],
      [mockCdvLote],
      [mockRelatorioExportado],
    )

    expect(unificados.length).toBe(4)
    // 13/05 (relatório) > 12/05 (lote) > 11/05 (infosimples) > 10/05 (nfe)
    expect(unificados[0].tipo).toBe('relatorio_exportado')
    expect(unificados[1].tipo).toBe('cdv_lote')
    expect(unificados[2].tipo).toBe('infosimples')
    expect(unificados[3].tipo).toBe('nfe_upload')
  })

  it('filtra consultas reais por padrão (exclui registros sintéticos/sandbox)', () => {
    const unificados = consolidarLinhaDoTempo(
      [mockNfeReal, mockNfeSandbox],
      [mockInfosimples],
      [mockCdvLote],
      [mockRelatorioExportado],
    )

    const filtradosReais = filtrarLinhaDoTempo(unificados, { origemModo: 'reais' })
    expect(filtradosReais.some((i) => i.id === 'nfe-nfe-sand')).toBe(false)
    expect(filtradosReais.length).toBe(4)

    const filtradosSandbox = filtrarLinhaDoTempo(unificados, { origemModo: 'sandbox' })
    expect(filtradosSandbox.length).toBe(1)
    expect(filtradosSandbox[0].id).toBe('nfe-nfe-sand')
  })

  it('filtra por cliente / CNPJ específico', () => {
    const unificados = consolidarLinhaDoTempo(
      [mockNfeReal],
      [mockInfosimples],
      [mockCdvLote],
      [mockRelatorioExportado],
    )

    // CNPJ do desmonte CDV: 22.333.444/0001-88
    const filtradosCdv = filtrarLinhaDoTempo(unificados, {
      clienteCnpj: '22333444000188',
      origemModo: 'todos',
    })
    expect(filtradosCdv.length).toBe(1)
    expect(filtradosCdv[0].tipo).toBe('cdv_lote')

    // CNPJ da Circular: 11.222.333/0001-99
    const filtradosCircular = filtrarLinhaDoTempo(unificados, {
      clienteCnpj: '11.222.333/0001-99',
      origemModo: 'todos',
    })
    expect(filtradosCircular.length).toBe(3)
  })

  it('filtra por tipo de consulta e por período de datas', () => {
    const unificados = consolidarLinhaDoTempo(
      [mockNfeReal],
      [mockInfosimples],
      [mockCdvLote],
      [mockRelatorioExportado],
    )

    const apenasInfo = filtrarLinhaDoTempo(unificados, {
      tipo: 'infosimples',
      origemModo: 'todos',
    })
    expect(apenasInfo.length).toBe(1)
    expect(apenasInfo[0].tipo).toBe('infosimples')

    const periodo = filtrarLinhaDoTempo(unificados, {
      dataInicio: '2025-05-11',
      dataFim: '2025-05-12',
      origemModo: 'todos',
    })
    // Deve incluir apenas 11/05 (infosimples) e 12/05 (cdv_lote)
    expect(periodo.length).toBe(2)
    expect(periodo.map((p) => p.tipo)).toEqual(['cdv_lote', 'infosimples'])
  })

  it('calcula totalizadores com precisão: total de consultas, total de créditos e contagem por tipo', () => {
    const infoExtra = {
      ...mockInfosimples,
      id: 'info002',
      custo_creditos: 2.5,
    }

    const unificados = consolidarLinhaDoTempo(
      [mockNfeReal],
      [mockInfosimples, infoExtra],
      [mockCdvLote],
      [mockRelatorioExportado],
    )

    const metricas = calcularMetricasHistorico(unificados)

    expect(metricas.totalConsultas).toBe(5)
    expect(metricas.totalCreditosInfosimples).toBe(3.75) // 1.25 + 2.5
    expect(metricas.contagemPorTipo.nfe_upload).toBe(1)
    expect(metricas.contagemPorTipo.infosimples).toBe(2)
    expect(metricas.contagemPorTipo.cdv_lote).toBe(1)
    expect(metricas.contagemPorTipo.relatorio_exportado).toBe(1)
  })

  it('gera CSV no padrão correto do Console com cabeçalhos e formatação', () => {
    const unificados = consolidarLinhaDoTempo(
      [mockNfeReal],
      [mockInfosimples],
      [mockCdvLote],
      [mockRelatorioExportado],
    )

    const { conteudoCsv, nomeArquivo, totalRegistros } = exportarHistoricoConsultasCsv(unificados)

    expect(totalRegistros).toBe(4)
    expect(nomeArquivo).toMatch(/historico_consultas_orbis_\d{4}-\d{2}-\d{2}\.csv/)
    expect(conteudoCsv).toContain(
      'Tipo de Consulta;Referência;Data/Hora;Status;Custo Créditos InfoSimples',
    )
    expect(conteudoCsv).toContain('1,25')
    expect(conteudoCsv).toContain('35260111222333000199550010000012341234567890')
    expect(conteudoCsv).toContain('VRF-2025-998811')
    expect(conteudoCsv).toContain('LOTE-CDV-2025-089')
  })
})
