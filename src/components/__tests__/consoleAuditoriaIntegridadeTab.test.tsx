import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import React from 'react'
import { ConsoleAuditoriaIntegridadeTab } from '../ConsoleAuditoriaIntegridadeTab'
import { executarAuditoriaIntegridade } from '@/services/auditoriaIntegridadeService'
import pb from '@/lib/pocketbase/client'

describe('ConsoleAuditoriaIntegridadeTab - Verificações Periciais e Laudo', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('calcula e reconcilia dados matemáticos, fatores, hashes e higiene corretamente no serviço', async () => {
    // Mock do banco PocketBase com casos de teste específicos
    vi.spyOn(pb.collection('cdv_lotes'), 'getFullList').mockResolvedValue([
      {
        id: 'lote-1-auto',
        cdv_codigo: 'SANDBOX-AUTOMOTIVA',
        cdv_nome: 'Desmanche Demo',
        total_peso_kg: 100,
        total_co2e_evitado_kg: 218,
        origem: 'sintetico',
        veiculo_chassi: 'CHASSI123',
        veiculo_baixa_detran: 'SYN-BX-1234',
        payload_bruto_json: JSON.stringify({
          hashSha256: 'a'.repeat(64),
          segmento: 'automotiva',
        }),
      },
      {
        id: 'lote-2-quimica',
        cdv_codigo: 'SANDBOX-QUIMICA',
        cdv_nome: 'Química Demo',
        total_peso_kg: 50,
        total_co2e_evitado_kg: 0,
        origem: 'sintetico',
        veiculo_chassi: '', // correto (sem dados veiculares)
        veiculo_baixa_detran: '',
        payload_bruto_json: JSON.stringify({
          hashSha256: 'b'.repeat(64),
          segmento: 'quimica',
        }),
      },
    ] as any)

    vi.spyOn(pb.collection('cdv_pecas'), 'getFullList').mockResolvedValue([
      {
        id: 'peca-1',
        lote: 'lote-1-auto',
        peso_kg: 100,
        fator_co2e_kg: 2.18,
        co2e_evitado_kg: 218,
        categoria_material: 'aco',
        descricao_peca: 'Capô Aço',
        hash_sha256: 'a'.repeat(64),
      },
      {
        id: 'peca-2',
        lote: 'lote-2-quimica',
        peso_kg: 50,
        fator_co2e_kg: 0,
        co2e_evitado_kg: 0,
        categoria_material: 'outros',
        descricao_peca: 'Minerais Nobres em estruturação',
        hash_sha256: 'b'.repeat(64),
      },
    ] as any)

    vi.spyOn(pb.collection('emissoes_inventario'), 'getFullList').mockResolvedValue([
      {
        id: 'inv-1',
        cnpj: '11.222.333/0001-44',
        origem: 'sintetico',
        escopo1_total_tco2e: 10,
        escopo2_localizacao_tco2e: 5,
        escopo3_total_tco2e: 15,
        emissoes_totais_tco2e: 30, // 10 + 5 + 15 = 30 (exato)
        laudo_detalhes_json: JSON.stringify({ segmento: 'automotiva' }),
      },
    ] as any)

    vi.spyOn(pb.collection('selos'), 'getFullList').mockResolvedValue([
      {
        id: 'selo-1',
        codigo_selo: 'ORB-2026-TESTE',
        empresa: 'Empresa Teste',
        hash_integridade: 'c'.repeat(64),
      },
    ] as any)

    const resultado = await executarAuditoriaIntegridade('auditor.teste@orbis.com')

    expect(resultado.totalVerificacoes).toBe(12)
    expect(resultado.totalAlertas).toBe(0) // todos conformes
    expect(resultado.itens.reconciliacaoMatematicaLotes.status).toBe('ok')
    expect(resultado.itens.reconciliacaoMatematicaInventarios.status).toBe('ok')
    expect(resultado.itens.consistenciaFatorPecas.status).toBe('ok')
    expect(resultado.itens.integridadeProbatariaLotes.status).toBe('ok')
    expect(resultado.itens.higieneMateriaisCatalogados.status).toBe('ok')
    expect(resultado.itens.higieneInventariosDuplicados.status).toBe('ok')
    expect(resultado.itens.higieneCamposVeicularesNaoVeiculares.status).toBe('ok')
    expect(resultado.itens.auditoriaFatoresLegadosCobre.status).toBe('ok')
    expect(resultado.itens.auditoriaChavesAcessoDuplicadas.status).toBe('ok')
    expect(resultado.itens.auditoriaLotesOrfaos.status).toBe('ok')
  })

  it('detecta anomalias e gera alertas quando há divergências na base', async () => {
    // 1. Lote com soma divergente das peças
    // 2. Peça concreto gravada como 'outros'
    // 3. Lote químico com chassi fake preenchido
    // 4. Inventário com escopos somando diferente do total
    vi.spyOn(pb.collection('cdv_lotes'), 'getFullList').mockResolvedValue([
      {
        id: 'lote-div',
        cdv_codigo: 'SANDBOX-AGRO',
        cdv_nome: 'Agro Lote',
        total_peso_kg: 500, // divergente
        total_co2e_evitado_kg: 100,
        origem: 'sintetico',
        veiculo_chassi: 'FAKE-CHASSI', // ANOMALIA: lote agro com chassi fake
        veiculo_baixa_detran: 'SYN-BX-999',
        payload_bruto_json: JSON.stringify({
          hashSha256: 'curto', // ANOMALIA: hash inválido
          segmento: 'agro',
        }),
      },
    ] as any)

    vi.spyOn(pb.collection('cdv_pecas'), 'getFullList').mockResolvedValue([
      {
        id: 'peca-anomala',
        lote: 'lote-div',
        peso_kg: 200, // soma 200 != 500
        fator_co2e_kg: 0.12,
        co2e_evitado_kg: 24, // 200 * 0.12 = 24
        categoria_material: 'outros', // ANOMALIA: concreto gravado como outros
        descricao_peca: 'Agregado Reciclado de Concreto RCD',
        hash_sha256: 'curto',
      },
    ] as any)

    vi.spyOn(pb.collection('emissoes_inventario'), 'getFullList').mockResolvedValue([
      {
        id: 'inv-dup-1',
        cnpj: '11.222.333/0001-44',
        origem: 'sintetico',
        escopo1_total_tco2e: 10,
        escopo2_localizacao_tco2e: 5,
        escopo3_total_tco2e: 15,
        emissoes_totais_tco2e: 999, // ANOMALIA: 10 + 5 + 15 != 999
        laudo_detalhes_json: JSON.stringify({ segmento: 'agro' }),
      },
      {
        id: 'inv-dup-2',
        cnpj: '11.222.333/0001-44',
        origem: 'sintetico',
        escopo1_total_tco2e: 10,
        escopo2_localizacao_tco2e: 5,
        escopo3_total_tco2e: 15,
        emissoes_totais_tco2e: 30,
        laudo_detalhes_json: JSON.stringify({ segmento: 'agro' }), // ANOMALIA: duplicado com inv-dup-1
      },
    ] as any)

    vi.spyOn(pb.collection('selos'), 'getFullList').mockResolvedValue([])

    const resultado = await executarAuditoriaIntegridade('auditor.teste@orbis.com')

    expect(resultado.totalAlertas).toBeGreaterThan(0)
    expect(resultado.itens.reconciliacaoMatematicaLotes.status).toBe('alerta')
    expect(resultado.itens.reconciliacaoMatematicaInventarios.status).toBe('alerta')
    expect(resultado.itens.integridadeProbatariaLotes.status).toBe('alerta')
    expect(resultado.itens.higieneMateriaisCatalogados.status).toBe('alerta')
    expect(resultado.itens.higieneInventariosDuplicados.status).toBe('alerta')
    expect(resultado.itens.higieneCamposVeicularesNaoVeiculares.status).toBe('alerta')
  })

  it('renderiza os cards e lista de verificações na UI da aba de auditoria', async () => {
    vi.spyOn(pb.collection('cdv_lotes'), 'getFullList').mockResolvedValue([])
    vi.spyOn(pb.collection('cdv_pecas'), 'getFullList').mockResolvedValue([])
    vi.spyOn(pb.collection('emissoes_inventario'), 'getFullList').mockResolvedValue([])
    vi.spyOn(pb.collection('selos'), 'getFullList').mockResolvedValue([])

    render(<ConsoleAuditoriaIntegridadeTab />)

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /Auditoria de Integridade & Higiene dMRV/i }),
      ).toBeInTheDocument()
    })

    expect(screen.getByTestId('btn-executar-auditoria')).toBeInTheDocument()
    expect(screen.getByTestId('btn-imprimir-laudo-integridade')).toBeInTheDocument()
    expect(screen.getByText(/Testes Executados/i)).toBeInTheDocument()
    expect(screen.getByText(/Apontamentos \/ Alertas/i)).toBeInTheDocument()
    expect(screen.getByText(/Aviso Legal e de Limitação de Escopo Pericial/i)).toBeInTheDocument()
  })
})
