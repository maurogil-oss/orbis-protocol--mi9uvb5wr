import { describe, it, expect } from 'vitest'
import {
  agregarDadosPainelResultados,
  exportarPainelResultadosCsv,
  normalizarCategoriaMaterialPainel,
  normalizarCnpj,
  type InputAgregacaoPainel,
} from '../painelResultadosService'
import type { CdvLoteRecord, CdvPecaRecord } from '@/services/cdvService'
import type { CdvLotePendenciaRecord } from '@/services/cdvPendenciasService'

describe('painelResultadosService — Agregação e Regras de Negócio', () => {
  const cnpjEmpresaA = '12.345.678/0001-90'
  const cnpjEmpresaB = '98.765.432/0001-10'

  const mockLotes: CdvLoteRecord[] = [
    {
      id: 'lote-1',
      codigo_lote: 'LOT-2026-001',
      cdv_cnpj: cnpjEmpresaA,
      cdv_nome: 'Desmonte Alfa Ltda',
      status: 'processado',
      total_peso_kg: 1000,
      total_co2e_evitado_kg: 2200,
      created: '2026-04-10T10:00:00.000Z',
    } as any,
    {
      id: 'lote-2',
      codigo_lote: 'LOT-2026-002',
      cdv_cnpj: cnpjEmpresaA,
      cdv_nome: 'Desmonte Alfa Ltda',
      status: 'em_processamento',
      total_peso_kg: 500,
      total_co2e_evitado_kg: 1100,
      created: '2026-04-15T12:00:00.000Z',
    } as any,
    {
      id: 'lote-3-outro-cnpj',
      codigo_lote: 'LOT-2026-999',
      cdv_cnpj: cnpjEmpresaB, // OUTRO CNPJ (PRIVACIDADE ABSOLUTA)
      cdv_nome: 'Desmonte Beta S/A',
      status: 'processado',
      total_peso_kg: 50000,
      total_co2e_evitado_kg: 99999,
      created: '2026-04-20T12:00:00.000Z',
    } as any,
  ]

  const mockPecas: CdvPecaRecord[] = [
    {
      id: 'peca-1',
      lote: 'lote-1',
      categoria_material: 'aco',
      peso_kg: 700,
      co2e_evitado_kg: 1526,
      status: 'ativo',
    } as any,
    {
      id: 'peca-2',
      lote: 'lote-1',
      categoria_material: 'aluminio',
      peso_kg: 200,
      co2e_evitado_kg: 500,
      status: 'ativo',
    } as any,
    {
      id: 'peca-3',
      lote: 'lote-2',
      categoria_material: 'cobre',
      peso_kg: 100,
      co2e_evitado_kg: 174,
      status: 'ativo',
    } as any,
    {
      id: 'peca-4-vazada-cnpj-b',
      lote: 'lote-3-outro-cnpj',
      categoria_material: 'aco',
      peso_kg: 99999,
      co2e_evitado_kg: 999999,
      status: 'ativo',
    } as any,
  ]

  const mockPendencias: CdvLotePendenciaRecord[] = [
    {
      id: 'pend-1',
      lote: 'lote-2',
      status: 'pendente',
      motivo: 'Foto da etiqueta do motor ausente',
    } as any,
    {
      id: 'pend-2-outro-cnpj',
      lote: 'lote-3-outro-cnpj',
      status: 'pendente',
      motivo: 'Certidão pendente empresa B',
    } as any,
  ]

  it('deve agregar KPIs e evolução respeitando estritamente o CNPJ da empresa logada (Privacidade Absoluta)', () => {
    const input: InputAgregacaoPainel = {
      cnpjEmpresa: cnpjEmpresaA,
      nomeEmpresa: 'Desmonte Alfa Ltda',
      lotes: mockLotes,
      pecas: mockPecas,
      pendencias: mockPendencias,
      selosAtestados: [
        { cnpj: cnpjEmpresaA, status: 'ativo' },
        { cnpj: cnpjEmpresaB, status: 'ativo' }, // Não pode contar
      ],
      relatoriosExportados: [
        { cnpj: cnpjEmpresaA, status: 'concluido' },
        { cnpj: cnpjEmpresaA, status: 'concluido' },
        { cnpj: cnpjEmpresaB, status: 'concluido' }, // Não pode contar
      ],
    }

    const resultado = agregarDadosPainelResultados(input)

    expect(resultado.possuiEmpresaAssociada).toBe(true)
    // Lotes da Empresa A: lote-1 (processado, 1000kg, 2200 co2e) + lote-2 (em_processamento, 500kg, 1100 co2e)
    expect(resultado.kpis.lotesValidadosConfirmados).toBe(1)
    expect(resultado.kpis.lotesEmColeta).toBe(1)
    expect(resultado.kpis.massaRecuperadaKg).toBe(1500)
    expect(resultado.kpis.massaRecuperadaToneladas).toBe(1.5)
    expect(resultado.kpis.co2eConfirmadoTotalKg).toBe(3300)
    expect(resultado.kpis.co2eConfirmadoTotalTco2e).toBe(3.3)

    // Documentos
    expect(resultado.kpis.documentosAtestadosEmitidos).toBe(1)
    expect(resultado.kpis.documentosRelatoriosPreliminares).toBe(2)

    // Pendências: apenas a do lote-2 da Empresa A
    expect(resultado.kpis.pendenciasColetaEmAberto).toBe(1)

    // Nenhum dado do lote-3 (Empresa B) foi incluído
    expect(resultado.statusConformidade.totalLotes).toBe(2)
  })

  it('quando o usuário não tiver empresa associada (ex: perito externo), deve retornar estado seguro vazio sem vazar dados', () => {
    const input: InputAgregacaoPainel = {
      cnpjEmpresa: null,
      nomeEmpresa: 'Perito Externo Sem CNPJ',
      lotes: mockLotes,
      pecas: mockPecas,
      pendencias: mockPendencias,
    }

    const resultado = agregarDadosPainelResultados(input)

    expect(resultado.possuiEmpresaAssociada).toBe(false)
    expect(resultado.kpis.massaRecuperadaKg).toBe(0)
    expect(resultado.kpis.co2eConfirmadoTotalKg).toBe(0)
    expect(resultado.kpis.lotesValidadosConfirmados).toBe(0)
    expect(resultado.kpis.lotesEmColeta).toBe(0)
    expect(resultado.statusConformidade.totalLotes).toBe(0)
  })

  it('deve realizar quebra por material SEM exibir catálogo de fatores (Regra Opção B)', () => {
    const input: InputAgregacaoPainel = {
      cnpjEmpresa: cnpjEmpresaA,
      nomeEmpresa: 'Desmonte Alfa',
      lotes: mockLotes,
      pecas: mockPecas,
      pendencias: mockPendencias,
    }

    const resultado = agregarDadosPainelResultados(input)
    const categorias = resultado.quebraPorMaterial.map((m) => m.categoria)

    expect(categorias).toContain('aco')
    expect(categorias).toContain('aluminio')
    expect(categorias).toContain('cobre')
    expect(categorias).toContain('polimeros')
    expect(categorias).toContain('outros')

    // Verifica que as propriedades são de resultado (peso e co2e), não fatores de catálogo
    for (const item of resultado.quebraPorMaterial) {
      expect((item as any).fator_emissao).toBeUndefined()
      expect((item as any).fator_referencia).toBeUndefined()
      expect(typeof item.pesoKg).toBe('number')
      expect(typeof item.percentualPeso).toBe('number')
      expect(typeof item.co2eConfirmadoKg).toBe('number')
      expect(typeof item.percentualCo2e).toBe('number')
    }
  })

  it('deve exportar CSV executivo com delimitador ponto-e-vírgula e terminologia pública correta', () => {
    const input: InputAgregacaoPainel = {
      cnpjEmpresa: cnpjEmpresaA,
      nomeEmpresa: 'Desmonte Alfa',
      lotes: mockLotes,
      pecas: mockPecas,
      pendencias: mockPendencias,
    }

    const resultado = agregarDadosPainelResultados(input)
    const { conteudoCsv, nomeArquivo } = exportarPainelResultadosCsv(resultado)

    expect(nomeArquivo).toContain('painel_resultados_orbis_')
    expect(conteudoCsv.startsWith('\uFEFF')).toBe(true) // BOM UTF-8

    // Terminologia obrigatória
    expect(conteudoCsv).toContain('Centro de Desmonte')
    expect(conteudoCsv).toContain('validado/confirmado')
    expect(conteudoCsv).toContain('Atestado Orbis')
    expect(conteudoCsv).toContain('CO2e Confirmado')
    expect(conteudoCsv).toContain('A plataforma nao emite creditos de carbono')

    // Proibições terminológicas
    expect(conteudoCsv).not.toContain('CDVerde')
    expect(conteudoCsv).not.toContain('Selo Oficial')
    expect(conteudoCsv).not.toContain('Certificação')
    expect(conteudoCsv).not.toContain('Certificado')
  })

  it('normalização de CNPJ e categorias de materiais', () => {
    expect(normalizarCnpj(' 12.345.678/0001-90 ')).toBe('12345678000190')
    expect(normalizarCategoriaMaterialPainel('Aço Carbono')).toBe('aco')
    expect(normalizarCategoriaMaterialPainel('ALUMÍNIO')).toBe('aluminio')
    expect(normalizarCategoriaMaterialPainel('Cobre')).toBe('cobre')
    expect(normalizarCategoriaMaterialPainel('Plásticos Técnicos')).toBe('polimeros')
    expect(normalizarCategoriaMaterialPainel('Concreto Reciclado')).toBe('outros')
  })
})
