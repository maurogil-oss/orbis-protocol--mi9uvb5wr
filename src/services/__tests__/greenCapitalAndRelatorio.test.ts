import { describe, it, expect } from 'vitest'
import {
  LINHAS_CREDITO_VERDE,
  simularGreenCapitalEngine,
  formatarFinalidade,
} from '../greenCapitalEngine'
import { calcularHashDossie, gerarHtmlRelatorioDossie } from '../relatorioLaudoPdf'

describe('Orbis Green Capital Engine — 8 Linhas de Crédito Verde', () => {
  it('deve conter exatamente as 8 linhas de crédito verde originais catalogadas', () => {
    expect(LINHAS_CREDITO_VERDE).toHaveLength(8)

    const ids = LINHAS_CREDITO_VERDE.map((l) => l.id)
    expect(ids).toContain('bndes_fundo_clima')
    expect(ids).toContain('brde_dossie_verde')
    expect(ids).toContain('fomento_parana_verde')
    expect(ids).toContain('bb_pronampe_verde')
    expect(ids).toContain('santander_sll')
    expect(ids).toContain('sicredi_agro_associados')
    expect(ids).toContain('sicredi_circularidade')
    expect(ids).toContain('itau_frotas_verdes')
  })

  it('cada linha deve ter taxa bonificada inferior à taxa padrão de mercado', () => {
    for (const linha of LINHAS_CREDITO_VERDE) {
      expect(linha.taxaBonificadaVerdeAa).toBeLessThan(linha.taxaPadraoMercadoAa)
      expect(linha.exigenciasDocumentais.length).toBeGreaterThan(0)
      expect(linha.evidenciasQueOrbisAtende.length).toBeGreaterThan(0)
      expect(linha.criteriosEnquadramento.length).toBeGreaterThan(0)
    }
  })

  it('deve simular economia de spread anual e total no prazo de financiamento', () => {
    const res = simularGreenCapitalEngine({
      valorDesejado: 500000,
      prazoMeses: 48,
      finalidade: 'eficiencia_energetica',
      temInventarioOrbis: true,
      emissoesTotaisTCO2e: 450,
    })

    expect(res.valorDesejado).toBe(500000)
    expect(res.prazoMeses).toBe(48)
    expect(res.totalLinhasCompativeis).toBeGreaterThan(0)
    expect(res.melhorLinha).not.toBeNull()

    if (res.melhorLinha) {
      expect(res.melhorLinha.economiaTotalPrazo).toBeGreaterThan(0)
      expect(res.melhorLinha.economiaAnual).toBeGreaterThan(0)
      expect(res.melhorLinha.parcelaMensalBonificada).toBeLessThan(
        res.melhorLinha.parcelaMensalPadrao,
      )
      expect(res.melhorLinha.diferencaSpreadPontos).toBeGreaterThan(3)
    }

    expect(res.disclaimer).toContain('Simulação indicativa')
  })

  it('deve filtrar linhas incompatíveis com valores fora da faixa ou finalidade diversa', () => {
    const res = simularGreenCapitalEngine({
      valorDesejado: 25000000, // R$ 25M (exclui linhas de pequeno porte)
      prazoMeses: 60,
      finalidade: 'frota_eletrica_gas',
    })

    const bndes = res.linhasAvaliadas.find((l) => l.linha.id === 'bndes_fundo_clima')
    expect(bndes?.compativel).toBe(true)

    const fomentoPr = res.linhasAvaliadas.find((l) => l.linha.id === 'fomento_parana_verde')
    expect(fomentoPr?.compativel).toBe(false) // Teto R$ 3M
  })

  it('deve formatar os títulos de finalidade de investimento em pt-BR', () => {
    expect(formatarFinalidade('eficiencia_energetica')).toContain('Eficiência Energética')
    expect(formatarFinalidade('economia_circular')).toContain('Economia Circular')
    expect(formatarFinalidade('frota_eletrica_gas')).toContain('Frota Elétrica')
  })
})

describe('Relatório Pericial em PDF & Hash Criptográfico', () => {
  it('deve gerar hash SHA-256 reprodutível e estruturado', async () => {
    const hash = await calcularHashDossie('ORBIS|19598964000101|TESTE')
    expect(hash).toBeDefined()
    expect(typeof hash).toBe('string')
    expect(hash.length).toBeGreaterThan(10)
  })

  it('deve montar HTML do relatório do dossiê com todas as seções periciais e disclaimers', () => {
    const html = gerarHtmlRelatorioDossie(
      {
        identificacao: {
          razaoSocial: 'Metalúrgica Sustentável Brasil Ltda',
          cnpj: '12.345.678/0001-90',
          responsavel: 'Eng. Roberto Santos',
          regimeTributario: 'Lucro Real',
        },
        diagnostico: {
          enquadramentoSbceTexto: 'Isento (< 10k tCO2e)',
          statusSbce: 'isento_monitoramento',
          exportaUeCbam: 'sim',
          cbamBens: 'Aço e Ferro Fundido',
        },
        hashIntegridade: 'ORBIS-SHA256-TESTE-1234',
        codigoSelo: 'ORBIS-SELO-2025-001',
      },
      'ORBIS-SHA256-TESTE-1234',
    )

    expect(html).toContain('Metalúrgica Sustentável Brasil Ltda')
    expect(html).toContain('12.345.678/0001-90')
    expect(html).toContain('1. Diagnóstico Regulatório & Perfil Climático')
    expect(html).toContain('2. Inventário Pericial de Emissões GEE')
    expect(html).toContain('3. Diagnóstico Comparativo Tributário')
    expect(html).toContain('4. Green Capital Engine')
    expect(html).toContain('5. Conclusão Pericial & Autenticidade Criptográfica')
    expect(html).toContain('ORBIS-SHA256-TESTE-1234')
    expect(html).toContain('Lei Federal nº 15.042/2024')
    expect(html).toContain('AVISO LEGAL REGULATÓRIO & BANCÁRIO')
  })
})
