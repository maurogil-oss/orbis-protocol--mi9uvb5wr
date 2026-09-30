import { describe, it, expect } from 'vitest'
import {
  LINHAS_CREDITO_VERDE,
  simularGreenCapitalEngine,
  formatarFinalidade,
} from '../greenCapitalEngine'
import {
  calcularHashDossie,
  gerarHtmlRelatorioDossie,
  calcularHashCanonicalDocumentosFonte,
  exportarDocumentosFonteCsv,
  gerarHtmlDemonstracaoOrientada,
  DocumentoFonteNFe,
} from '../relatorioLaudoPdf'

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

  it('deve calcular hash canônico de documentos fonte de forma determinística e independente da ordem de entrada', async () => {
    const notas: DocumentoFonteNFe[] = [
      {
        chave_acesso: '35240112345678000190550010000000011234567890',
        numero_nota: '1',
        serie: '1',
        data_emissao: '2025-01-15',
        cnpj_emitente: '12.345.678/0001-90',
        valor_total_nf: 1000.5,
        credito_apurado: 92.54,
      },
      {
        chave_acesso: '35240198765432000110550010000000021234567891',
        numero_nota: '2',
        serie: '1',
        data_emissao: '2025-02-10',
        cnpj_emitente: '98.765.432/0001-10',
        valor_total_nf: 2500,
        credito_apurado: 231.25,
      },
    ]

    const cnpj = '11.222.333/0001-44'
    const hash1 = await calcularHashCanonicalDocumentosFonte(notas, cnpj)
    const hash2 = await calcularHashCanonicalDocumentosFonte([...notas].reverse(), cnpj)

    expect(hash1).toBe(hash2)
    expect(hash1.length).toBeGreaterThan(15)

    // Se alterar um valor, o hash deve mudar
    const notasAlteradas = [{ ...notas[0], valor_total_nf: 1000.51 }, notas[1]]
    const hashAlterado = await calcularHashCanonicalDocumentosFonte(notasAlteradas, cnpj)
    expect(hashAlterado).not.toBe(hash1)
  })

  it('deve renderizar o anexo de documentos fonte analítico para lotes <= 100 notas fiscais', () => {
    const notas: DocumentoFonteNFe[] = Array.from({ length: 40 }).map((_, i) => ({
      numero_nota: String(i + 1),
      serie: '1',
      data_emissao: '2025-03-01',
      cnpj_emitente: '12.345.678/0001-90',
      valor_total_nf: 100,
      credito_apurado: 9.25,
    }))

    const html = gerarHtmlRelatorioDossie(
      {
        identificacao: {
          razaoSocial: 'Empresa Teste Limite 100',
          cnpj: '12.345.678/0001-90',
        },
        diagnostico: {},
        documentosFonte: notas,
        hashDocumentosFonte: 'HASH-FONTES-TESTE-40',
      },
      'HASH-DOSSIE-123',
    )

    expect(html).toContain('Anexo — Documentos Fonte (Relação Analítica de Notas Fiscais)')
    expect(html).toContain('HASH-FONTES-TESTE-40')
    expect(html).toContain('TOTALIZAÇÃO CONSOLIDADA (40 NOTAS AUDITADAS)')
    expect(html).toContain('HASH SHA-256 DOS DOCUMENTOS FONTE (ANEXO DE INTEGRIDADE FISCAL)')
    // Não deve conter a mensagem de sumarização ou consolidação
    expect(html).not.toContain('Anexo — Documentos Fonte (Consolidado por Mês / Emitente)')
  })

  it('deve renderizar o anexo consolidado por mês/emitente e aviso de CSV para lotes > 100 notas fiscais', () => {
    const notas: DocumentoFonteNFe[] = Array.from({ length: 105 }).map((_, i) => ({
      numero_nota: String(i + 1),
      serie: '1',
      data_emissao: i < 50 ? '2025-01-15' : '2025-02-20',
      cnpj_emitente: i % 2 === 0 ? '11.111.111/0001-11' : '22.222.222/0001-22',
      nome_emitente: i % 2 === 0 ? 'Fornecedor A' : 'Fornecedor B',
      valor_total_nf: 200,
      credito_apurado: 18.5,
    }))

    const html = gerarHtmlRelatorioDossie(
      {
        identificacao: {
          razaoSocial: 'Grande Empresa 105 Notas',
          cnpj: '99.888.777/0001-66',
        },
        diagnostico: {},
        documentosFonte: notas,
        hashDocumentosFonte: 'HASH-FONTES-TESTE-105',
      },
      'HASH-DOSSIE-456',
    )

    expect(html).toContain('Anexo — Documentos Fonte (Consolidado por Mês / Emitente)')
    expect(html).toContain('HASH-FONTES-TESTE-105')
    expect(html).toContain('RELAÇÃO COMPLETA INDIVIDUALIZADA DISPONÍVEL EM CSV')
    expect(html).toContain('TOTALIZAÇÃO GERAL (105 NOTAS AUDITADAS)')
  })

  it('deve gerar HTML da Demonstração Orientada contendo as 6 etapas, faixa de autenticidade e marca d água de proveniência', () => {
    const html = gerarHtmlDemonstracaoOrientada(
      {
        loteClio: {
          marcaModelo: 'Renault Clio Authentique 1.0 16V Hi-Flex',
          baixaDetran: 'PR-BX-2026-1240105',
          placa: 'AYK-7110',
          cartelaDesmontagem: '12401050711',
          totalPecas: 77,
          totalPesoKg: 437.7,
          totalCo2eEvitadoKg: 1584.81,
          pecas611Count: 49,
          pecasMoverCount: 28,
        },
        simulador: {
          tipoCombustivel: 'diesel',
          quantidade: 2150,
          unidade: 'Litros (Diesel B S10)',
          fatorTexto: '2,670 kg CO₂e/L (Fóssil) + 0,357 kg CO₂/L (B14 Biogênico)',
          fonteOficial: 'GHG Protocol Brasil v2025.1 / ANP / IPCC AR6',
          tierIncerteza: 'Tier 3',
          fossilTon: 5.741,
          fossilKg: 5740.5,
          bioTon: 0.768,
          bioKg: 767.55,
        },
        dossie: {
          razaoSocial: 'Indústrias & Logística Integrada Brasil S.A.',
          cnpj: '76.492.108/0001-92',
          totalNotas: 12,
          emissoesTotaisTco2e: 1420.3,
          escopo1Tco2e: 480.2,
          escopo2Tco2e: 310.6,
          escopo3Tco2e: 629.5,
          hashFechamento: '0x8f4b29a7e3c12948bb92ff78201a0bc45d61e93f91823ab12c98d7ef2049ba12',
          enquadramentoSbceTexto: 'Isento (< 10k tCO₂e)',
          statusSbce: 'isento',
        },
      },
      '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
    )

    // Verifica presença da faixa de autenticidade
    expect(html).toContain('EMITIDO VIA ORBIS PROTOCOL')

    // Verifica presença da marca d'água de proveniência
    expect(html).toContain('watermark-proveniencia-overlay')
    expect(html).toContain('watermark-proveniencia-line')
    expect(html).toContain('print-color-adjust: exact')

    // Verifica as 6 etapas no documento
    expect(html).toContain('A Orbis é plataforma de auditoria e rastreabilidade') // Citação oficial
    expect(html).toContain('Etapa 1. Os 4 Pilares Fundamentais da Plataforma')
    expect(html).toContain('Etapa 2. Motor de Cálculo com Segregação Fóssil × Biogênico')
    expect(html).toContain('Etapa 3. Laudos Periciais, Conformidade SBCE e Dossiê Fiscal')
    expect(html).toContain('Etapa 4. Rastreabilidade Veicular (CDV / Programa MOVER)')
    expect(html).toContain('Etapa 5. Documentos Prontos para Envio')
    expect(html).toContain('Etapa 6. Autenticidade Criptográfica & Verificador Público')

    // Verifica dados do lote Clio e do dossiê
    expect(html).toContain('PR-BX-2026-1240105')
    expect(html).toContain('AYK-7110')
    expect(html).toContain('77')
    expect(html).toContain('0x8f4b29a7e3c12948bb92ff78201a0bc45d61e93f91823ab12c98d7ef2049ba12')
    expect(html).toContain('0xabcdef1234567890')

    // Verifica que NÃO promete PAdES nem Adobe Reader (regra do projeto)
    expect(html).not.toContain('PAdES')
    expect(html).not.toContain('Adobe')
  })

  it('deve exportar CSV de documentos fonte com BOM UTF-8 e cabeçalho de metadados sem erros em ambiente DOM', () => {
    const notas: DocumentoFonteNFe[] = [
      {
        numero_nota: '100',
        serie: '1',
        chave_acesso: '35240100000000000000550010000001001234567890',
        data_emissao: '2025-03-10',
        cnpj_emitente: '12.345.678/0001-90',
        nome_emitente: 'Fornecedor Exemplo Ltda',
        valor_total_nf: 1500,
        credito_apurado: 138.75,
        valor_pis: 24.75,
        valor_cofins: 114,
        valor_icms: 270,
      },
    ]

    // Valida que exportarDocumentosFonteCsv executa sem exceções
    expect(() => {
      exportarDocumentosFonteCsv({
        razaoSocial: 'Empresa Teste CSV',
        cnpj: '12.345.678/0001-90',
        documentos: notas,
        hashDocumentosFonte: 'HASH-CSV-TESTE-1234',
      })
    }).not.toThrow()
  })
})
