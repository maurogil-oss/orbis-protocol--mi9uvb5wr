/**
 * acpIndicadoresService.test.ts
 * Testes unitários para o serviço de indicadores agregados e anonimizáveis da ACP (Peça 4d).
 * Cobre:
 * 1. Agregação com base vazia (estado honesto "Em estruturação").
 * 2. Agregação com k-anonimato ativo (< 3 empresas participantes): emissões omitidas para anti-dedução.
 * 3. Agregação com >= 3 empresas participantes: emissões agregadas liberadas sob o rótulo ESTIMATIVA.
 * 4. Contagem precisa de itens calculados vs itens não calculados.
 * 5. Anonimização estrita: nenhuma razão social, CNPJ individual ou e-mail de empresa aparece no CSV gerado.
 * 6. Blindagem Opção B: nenhum valor numérico de fator unitário exposto.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import pb from '@/lib/pocketbase/client'
import {
  obterIndicadoresAgregadosAcp,
  gerarCsvIndicadoresAcp,
  IndicadoresAcpAgregados,
  MINIMO_EMPRESAS_ANTI_DEDUCAO,
} from '../acpIndicadoresService'

describe('Piloto ACP - Peça 4d: Indicadores Agregados e Anonimizáveis', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('1. retorna estado vazio honesto (semDados=true) quando não há empresas ou notas', async () => {
    // Simula 0 empresas participantes
    vi.spyOn(pb.collection('users'), 'getFullList').mockResolvedValueOnce([])

    const res = await obterIndicadoresAgregadosAcp()

    expect(res.semDados).toBe(true)
    expect(res.totalEmpresasAtivas).toBe(0)
    expect(res.totalLotesNotas).toBe(0)
    expect(res.totalItensApurados).toBe(0)
    expect(res.emissoesTotaisTco2e).toBeNull()
    expect(res.protecaoAntiDeducaoAtiva).toBe(false)
  })

  it('2. ativa proteção anti-dedução quando há menos de 3 empresas participantes (< 3)', async () => {
    // Simula 2 empresas
    vi.spyOn(pb.collection('users'), 'getFullList').mockResolvedValueOnce([
      { id: 'user_1', role: 'cliente_acp', cliente_codigo: 'ORB-ACP-101' },
      { id: 'user_2', role: 'cliente_acp', cliente_codigo: 'ORB-ACP-102' },
    ] as any)

    // Simula 2 notas com itens apurados
    vi.spyOn(pb.collection('nfe_upload'), 'getFullList').mockResolvedValueOnce([
      {
        id: 'nfe_1',
        usuario: 'user_1',
        valor_total_nf: 5000,
        resumo_itens_json: [
          { descricao: 'Aço Laminado', quantidadeFisica: 1000, naoCalculado: false },
          { descricao: 'Parafuso Avulso', quantidadeFisica: 10, naoCalculado: true },
        ],
      },
      {
        id: 'nfe_2',
        usuario: 'user_2',
        valor_total_nf: 8000,
        resumo_itens_json: [
          { descricao: 'Alumínio Fundido', quantidadeFisica: 500, naoCalculado: false },
        ],
      },
    ] as any)

    const res = await obterIndicadoresAgregadosAcp()

    expect(res.totalEmpresasAtivas).toBe(2)
    expect(res.totalEmpresasAtivas).toBeLessThan(MINIMO_EMPRESAS_ANTI_DEDUCAO)
    expect(res.protecaoAntiDeducaoAtiva).toBe(true)
    // Emissões devem ser OMITIDAS (null) para impedir dedução por subtração
    expect(res.emissoesTotaisTco2e).toBeNull()
    // Contagens de documentos e itens continuam transparentes
    expect(res.totalLotesNotas).toBe(2)
    expect(res.totalItensApurados).toBe(3)
    expect(res.totalItensCalculados).toBe(2)
    expect(res.totalItensNaoCalculados).toBe(1)
  })

  it('3. libera cálculo de emissões agregadas quando há 3 ou mais empresas (k-anonimato >= 3)', async () => {
    // Simula 3 empresas
    vi.spyOn(pb.collection('users'), 'getFullList').mockResolvedValueOnce([
      { id: 'user_1', role: 'cliente_acp' },
      { id: 'user_2', role: 'cliente_acp' },
      { id: 'user_3', role: 'cliente_acp' },
    ] as any)

    // Simula notas fiscais
    vi.spyOn(pb.collection('nfe_upload'), 'getFullList').mockResolvedValueOnce([
      {
        id: 'nfe_1',
        usuario: 'user_1',
        combustivel_tipo: 'diesel',
        combustivel_litros: 1000,
        resumo_itens_json: [
          { descricao: 'Óleo Diesel B S10', quantidadeFisica: 1000, naoCalculado: false },
        ],
      },
      {
        id: 'nfe_2',
        usuario: 'user_2',
        resumo_itens_json: [
          { descricao: 'Item Genérico', quantidadeFisica: 50, naoCalculado: true },
        ],
      },
    ] as any)

    const res = await obterIndicadoresAgregadosAcp()

    expect(res.totalEmpresasAtivas).toBe(3)
    expect(res.protecaoAntiDeducaoAtiva).toBe(false)
    expect(res.emissoesTotaisTco2e).not.toBeNull()
    expect(typeof res.emissoesTotaisTco2e).toBe('number')
    expect(res.totalItensCalculados).toBe(1)
    expect(res.totalItensNaoCalculados).toBe(1)
  })

  it('4. gera CSV estritamente anonimizado sem nomes, CNPJs individuais ou fatores unitários', () => {
    const dadosMock: IndicadoresAcpAgregados = {
      totalEmpresasAtivas: 4,
      totalLotesNotas: 12,
      totalItensApurados: 120,
      totalItensCalculados: 100,
      totalItensNaoCalculados: 20,
      emissoesTotaisTco2e: 45.85,
      emissoesEvitadasTco2e: 8.2,
      protecaoAntiDeducaoAtiva: false,
      semDados: false,
      calculadoEm: new Date('2026-11-08T12:00:00Z').toISOString(),
    }

    const csv = gerarCsvIndicadoresAcp(dadosMock)

    // Contém título institucional e métricas agregadas
    expect(csv).toContain('RELATÓRIO CONSOLIDADO DE INDICADORES AGREGADOS — PILOTO ACP')
    expect(csv).toContain('Empresas Associadas Participantes;4;')
    expect(csv).toContain('Lotes e Notas Fiscais Importadas;12;')
    expect(csv).toContain('Total de Itens Apurados;120;')
    expect(csv).toContain('Itens Calculados (Com Fator DM-ORB-001);100;')
    expect(csv).toContain('Itens Não Calculados;20;')
    expect(csv).toContain('45,850')
    expect(csv).toContain('ESTIMATIVA • dMRV')

    // Garantia de anonimização: sem CNPJs, nomes de empresas ou e-mails individuais
    expect(csv).not.toMatch(/\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}/)
    expect(csv).not.toContain('@')
    expect(csv).not.toContain('Ltda')
    expect(csv).not.toContain('S.A.')

    // Garantia Opção B: sem vazamento numérico de fatores
    expect(csv).toContain('Blindagem Opção B: Nenhum valor unitário de fator de emissão é exposto')
  })

  it('5. no CSV gerado com < 3 empresas, substitui emissões por rótulo [PROTEGIDO] (anti-dedução)', () => {
    const dadosMockProtegido: IndicadoresAcpAgregados = {
      totalEmpresasAtivas: 2,
      totalLotesNotas: 5,
      totalItensApurados: 30,
      totalItensCalculados: 25,
      totalItensNaoCalculados: 5,
      emissoesTotaisTco2e: null,
      emissoesEvitadasTco2e: null,
      protecaoAntiDeducaoAtiva: true,
      semDados: false,
      calculadoEm: new Date('2026-11-08T12:00:00Z').toISOString(),
    }

    const csv = gerarCsvIndicadoresAcp(dadosMockProtegido)

    expect(csv).toContain('[PROTEGIDO]')
    expect(csv).toContain('Menos de 3 empresas participantes (regra anti-dedução ativa')
    expect(csv).not.toContain('45,850')
  })
})
