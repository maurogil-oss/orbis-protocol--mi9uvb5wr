/**
 * AUDITORIA DE REPRODUÇÃO F6 — SIMULAÇÃO DO REVISOR INDEPENDENTE (TECPAR)
 * Norma de Referência: DM-ORB-001 v1.1 §6.3, §7
 *
 * REGRAS METODOLÓGICAS DE REPRODUÇÃO EXTERNA:
 * 1. REIMPLEMENTAÇÃO DO ZERO: Não importa funções de cálculo do motor de produção (`cdvEngineV2`),
 *    simulando estritamente um revisor/auditor externo independente que lê a especificação técnica DM-ORB-001 v1.1.
 * 2. EQUAÇÃO FUNDAMENTAL (§6.3):
 *      Evitado_peça = floor(Q × FE_ref × L_i × DF − PE_peça)
 *    com DF = 0,30, L_i = 1,0, arredondamento floor em 2 casas decimais no evitado e ceil nas emissões de projeto (PE).
 * 3. INCERTEZA DO LOTE POR QUADRATURA (ISO/IEC 98-3 / GUM):
 *      Incerteza_lote = √(Σ(E_peça × u_FE)² + (E_lote × u_massa)²)
 *    com u_massa = 1,0% (0,01) para pesagem com balança calibrada.
 * 4. DESTINAÇÃO DOCUMENTAL OBRIGATÓRIA (§0.3):
 *    Apenas peças com destinação comprovada (NF-e de venda / MTR de reciclagem) somam no claim confirmado.
 *    Peças sem destinação documental (ex.: em estoque) permanecem como claim potencial.
 * 5. LOTE DE DEMONSTRAÇÃO GOL (3 PEÇAS):
 *    - Capô Dianteiro: aço 10,0 kg, FE 2,18 kgCO₂e/kg, u_FE 3,5%, NF-e 1234 -> Claim Confirmado
 *    - Alternador/Estator: cobre 2,5 kg, FE 5,40 kgCO₂e/kg, u_FE 4,5%, MTR 4410 -> Claim Confirmado
 *    - Parachoque dianteiro: polímeros 4,0 kg, FE 1,90 kgCO₂e/kg, u_FE 5,0%, em estoque -> Claim Potencial
 */

import { describe, it, expect } from 'vitest'
import { calcularLoteOrbisV2, LoteInputV2 } from '../cdvEngineV2'

// ============================================================================
// REIMPLEMENTAÇÃO INDEPENDENTE DO REVISOR TECPAR (ZERO IMPORTS DE CÁLCULO)
// ============================================================================

interface PecaAuditoriaTecpar {
  sku: string
  descricao: string
  material: 'aco' | 'cobre' | 'polimeros'
  peso_kg: number
  fe_ref: number
  u_fe: number
  destinacao_status: 'vendida' | 'reciclada' | 'estoque'
  documento_tipo?: 'nfe' | 'mtr'
  documento_numero?: string
}

interface LoteAuditoriaTecpar {
  cdv_nome: string
  cdv_cnpj: string
  veiculo_modelo: string
  baixa_detran: string
  tara_fonte: 'balanca_calibrada'
  df: number
  li: number
  pe_lote_kg: number
  pecas: PecaAuditoriaTecpar[]
}

interface ResultadoPecaTecpar {
  sku: string
  descricao: string
  evitado_bruto: number
  pe_alocado: number
  evitado_liquido: number
  status_claim: 'confirmado' | 'potencial'
  u_fe: number
}

interface ResultadoLoteTecpar {
  pecas: ResultadoPecaTecpar[]
  total_bruto: number
  total_liquido: number
  confirmado: number
  potencial: number
  incerteza_absoluta_kg: number
  incerteza_relativa_pct: number
}

/**
 * Funções auxiliares de arredondamento prescritas pelo DM-ORB-001 v1.1 §7:
 * - Emissões evitadas: Math.floor(x * 100) / 100 (conservador, nunca trunca para cima)
 * - Emissões de projeto: Math.ceil(x * 100) / 100 (conservador, deduções máximas)
 * - Arredondamento métrico padrão de apresentação: Math.round(x * 100) / 100
 */
function floor2Tecpar(valor: number): number {
  return Math.floor(valor * 100) / 100
}

function ceil2Tecpar(valor: number): number {
  return Math.ceil(valor * 100) / 100
}

function round2Tecpar(valor: number): number {
  return Math.round(valor * 100) / 100
}

/**
 * Reimplementação independente do procedimento §6.3 / §7 da Metodologia Orbis
 */
function auditarLoteTecparIndependente(lote: LoteAuditoriaTecpar): ResultadoLoteTecpar {
  const massaTotal = lote.pecas.reduce((acc, p) => acc + p.peso_kg, 0)
  const peLoteCeil = ceil2Tecpar(lote.pe_lote_kg)

  const pecasResult: ResultadoPecaTecpar[] = []
  let somaBruto = 0
  let somaLiquido = 0
  let somaConfirmado = 0
  let somaPotencial = 0
  let somaQuadradosPecas = 0

  for (const peca of lote.pecas) {
    // Alocação de PE proporcional à massa (se houver)
    let pePeca = 0
    if (peLoteCeil > 0 && massaTotal > 0) {
      pePeca = ceil2Tecpar((peLoteCeil / massaTotal) * peca.peso_kg)
    }

    // Equação fundamental §6.3:
    // Evitado_bruto = Q × FE_ref × L_i × DF
    const evitadoBruto = peca.peso_kg * peca.fe_ref * lote.li * lote.df
    // Evitado_líquido = floor(Evitado_bruto - PE_peça)
    const evitadoLiquido = floor2Tecpar(Math.max(0, evitadoBruto - pePeca))

    const isConfirmado =
      (peca.destinacao_status === 'vendida' || peca.destinacao_status === 'reciclada') &&
      Boolean(peca.documento_numero)

    const statusClaim: 'confirmado' | 'potencial' = isConfirmado ? 'confirmado' : 'potencial'

    if (isConfirmado) {
      somaConfirmado += evitadoLiquido
    } else {
      somaPotencial += evitadoLiquido
    }

    somaBruto += evitadoBruto
    somaLiquido += evitadoLiquido

    // Quadratura por peça: (E_peça × u_FE)²
    somaQuadradosPecas += Math.pow(evitadoLiquido * peca.u_fe, 2)

    pecasResult.push({
      sku: peca.sku,
      descricao: peca.descricao,
      evitado_bruto: round2Tecpar(evitadoBruto),
      pe_alocado: pePeca,
      evitado_liquido: evitadoLiquido,
      status_claim: statusClaim,
      u_fe: peca.u_fe,
    })
  }

  // Incerteza do Lote por Quadratura (§7):
  // Incerteza_lote = √(Σ(E_peça × u_FE)² + (E_lote × u_massa)²)
  // u_massa = 1,0% (0,01) para balança calibrada
  const uMassa = 0.01
  const evitadoTotalLote = floor2Tecpar(somaLiquido)
  const termoMassa = Math.pow(evitadoTotalLote * uMassa, 2)
  const incertezaAbsoluta = round2Tecpar(Math.sqrt(somaQuadradosPecas + termoMassa))
  const incertezaRelativa =
    evitadoTotalLote > 0 ? round2Tecpar((incertezaAbsoluta / evitadoTotalLote) * 100) : 0

  return {
    pecas: pecasResult,
    total_bruto: floor2Tecpar(somaBruto),
    total_liquido: evitadoTotalLote,
    confirmado: floor2Tecpar(somaConfirmado),
    potencial: floor2Tecpar(somaPotencial),
    incerteza_absoluta_kg: incertezaAbsoluta,
    incerteza_relativa_pct: incertezaRelativa,
  }
}

// ============================================================================
// SUÍTE DE TESTES DE AUDITORIA DE REPRODUÇÃO F6 (TECPAR)
// ============================================================================

describe('Auditoria de Reprodução F6 — Perícia Independente Tecpar (DM-ORB-001 v1.1)', () => {
  // Dados oficiais do Lote Gol de demonstração (3 peças)
  const dadosLoteDemonstracao: LoteAuditoriaTecpar = {
    cdv_nome: 'CDVerde Centro de Desmontagem Veicular',
    cdv_cnpj: '76.123.456/0001-12',
    veiculo_modelo: 'Volkswagen Gol 1.6 8V Total Flex',
    baixa_detran: 'PR-BX-2026-991204',
    tara_fonte: 'balanca_calibrada',
    df: 0.3,
    li: 1.0,
    pe_lote_kg: 0,
    pecas: [
      {
        sku: 'PART-GOL-CAPO-01',
        descricao: 'Capô Dianteiro',
        material: 'aco',
        peso_kg: 10.0,
        fe_ref: 2.18,
        u_fe: 0.035, // 3,5%
        destinacao_status: 'vendida',
        documento_tipo: 'nfe',
        documento_numero: '1234',
      },
      {
        sku: 'PART-GOL-ESTAT-01',
        descricao: 'Alternador/Estator',
        material: 'cobre',
        peso_kg: 2.5,
        fe_ref: 5.4,
        u_fe: 0.045, // 4,5%
        destinacao_status: 'reciclada',
        documento_tipo: 'mtr',
        documento_numero: '4410',
      },
      {
        sku: 'PART-GOL-PARAC-01',
        descricao: 'Parachoque dianteiro',
        material: 'polimeros',
        peso_kg: 4.0,
        fe_ref: 1.9,
        u_fe: 0.05, // 5,0%
        destinacao_status: 'estoque', // Sem NF-e / MTR -> Claim Potencial
      },
    ],
  }

  // 1. Verificação da Reimplementação Manual Independente (Tecpar)
  it('1. Reimplementação Tecpar: calcula exatamente os valores esperados do DM-ORB-001 v1.1', () => {
    const auditoria = auditarLoteTecparIndependente(dadosLoteDemonstracao)

    // Valores peça a peça:
    // Capô: 10.0 × 2.18 × 1.0 × 0.30 = 6.54 kgCO₂e
    expect(auditoria.pecas[0].evitado_bruto).toBe(6.54)
    expect(auditoria.pecas[0].evitado_liquido).toBe(6.54)
    expect(auditoria.pecas[0].status_claim).toBe('confirmado')

    // Alternador/Estator: 2.5 × 5.40 × 1.0 × 0.30 = 4.05 kgCO₂e
    expect(auditoria.pecas[1].evitado_bruto).toBe(4.05)
    expect(auditoria.pecas[1].evitado_liquido).toBe(4.05)
    expect(auditoria.pecas[1].status_claim).toBe('confirmado')

    // Parachoque: 4.0 × 1.90 × 1.0 × 0.30 = 2.28 kgCO₂e
    expect(auditoria.pecas[2].evitado_bruto).toBe(2.28)
    expect(auditoria.pecas[2].evitado_liquido).toBe(2.28)
    expect(auditoria.pecas[2].status_claim).toBe('potencial')

    // Consolidado do lote:
    // Confirmado = 6.54 + 4.05 = 10.59 kgCO₂e
    expect(auditoria.confirmado).toBe(10.59)

    // Potencial = 2.28 kgCO₂e
    expect(auditoria.potencial).toBe(2.28)

    // Total líquido = 6.54 + 4.05 + 2.28 = 12.87 kgCO₂e
    expect(auditoria.total_liquido).toBe(12.87)

    // Incerteza do lote por quadratura:
    // u1 = 6.54 × 0.035 = 0.2289 -> u1² = 0.05239521
    // u2 = 4.05 × 0.045 = 0.18225 -> u2² = 0.0332150625
    // u3 = 2.28 × 0.050 = 0.114 -> u3² = 0.012996
    // u_massa = 12.87 × 0.01 = 0.1287 -> u_massa² = 0.01656369
    // soma = 0.1151699625 -> √soma = 0.339367... -> round2 = 0.34
    // u_pct = (0.34 / 12.87) * 100 = 2.6418... -> round2 = 2.64%
    expect(auditoria.incerteza_absoluta_kg).toBe(0.34)
    expect(auditoria.incerteza_relativa_pct).toBe(2.64)
  })

  // 2. Confronto Direto Revisor Tecpar vs Motor de Produção cdvEngineV2
  it('2. Confronto Motor vs Revisor: Saída do motor calcularLoteOrbisV2 coincide perfeitamente com a reprodução', () => {
    // Configurar entrada para o motor de produção
    const inputMotor: LoteInputV2 = {
      cdv: {
        nome: dadosLoteDemonstracao.cdv_nome,
        cnpj: dadosLoteDemonstracao.cdv_cnpj,
      },
      veiculo_doador: {
        marca_modelo: dadosLoteDemonstracao.veiculo_modelo,
        baixa_detran: dadosLoteDemonstracao.baixa_detran,
        tara_fonte: 'pesado', // Tara pesada/aferida -> u_massa = 0.01 (1%)
      },
      pecas: [
        {
          sku: 'PART-GOL-CAPO-01',
          descricao: 'Capô Dianteiro',
          material: 'aço',
          peso_kg: 10.0,
        },
        {
          sku: 'PART-GOL-ESTAT-01',
          descricao: 'Alternador/Estator',
          material: 'cobre',
          peso_kg: 2.5,
        },
        {
          sku: 'PART-GOL-PARAC-01',
          descricao: 'Parachoque dianteiro',
          material: 'polímeros',
          peso_kg: 4.0,
        },
      ],
      destinacao: [
        {
          sku: 'PART-GOL-CAPO-01',
          status: 'vendida',
          evidencia: { tipo: 'nfe', numero: '1234' },
        },
        {
          sku: 'PART-GOL-ESTAT-01',
          status: 'reciclada',
          evidencia: { tipo: 'mtr', numero: '4410' },
        },
        {
          sku: 'PART-GOL-PARAC-01',
          status: 'estoque', // Sem evidência de destinação documental final
        },
      ],
      df_config: 0.3,
      li_config: 1.0,
    }

    const resultadoMotor = calcularLoteOrbisV2(inputMotor)
    const reproducaoTecpar = auditarLoteTecparIndependente(dadosLoteDemonstracao)

    // Confronto Peça a Peça (tolerância máxima de 0.01 para arredondamentos)
    for (let i = 0; i < dadosLoteDemonstracao.pecas.length; i++) {
      const pecaMotor = resultadoMotor.pecas_detalhes[i]
      const pecaTecpar = reproducaoTecpar.pecas[i]

      expect(pecaMotor.sku).toBe(pecaTecpar.sku)
      expect(Math.abs(pecaMotor.evitado_bruto_kg - pecaTecpar.evitado_bruto)).toBeLessThanOrEqual(
        0.01,
      )
      expect(pecaMotor.evitado_liquido_kg).toBe(pecaTecpar.evitado_liquido)
      expect(pecaMotor.status_claim).toBe(pecaTecpar.status_claim)
    }

    // Confronto Consolidado do Lote
    expect(resultadoMotor.evitado_confirmado_kg).toBe(reproducaoTecpar.confirmado)
    expect(resultadoMotor.evitado_confirmado_kg).toBe(10.59)

    expect(resultadoMotor.evitado_potencial_kg).toBe(reproducaoTecpar.potencial)
    expect(resultadoMotor.evitado_potencial_kg).toBe(2.28)

    expect(resultadoMotor.evitado_liquido_kg).toBe(reproducaoTecpar.total_liquido)
    expect(resultadoMotor.evitado_liquido_kg).toBe(12.87)

    expect(resultadoMotor.incerteza_kg).toBe(reproducaoTecpar.incerteza_absoluta_kg)
    expect(resultadoMotor.incerteza_kg).toBe(0.34)

    expect(resultadoMotor.incerteza_pct).toBe(reproducaoTecpar.incerteza_relativa_pct)
    expect(resultadoMotor.incerteza_pct).toBe(2.64)
  })

  // 3. Regra de Segregação de Claim (§0.3): Peça sem destinação documental não pode somar no confirmado
  it('3. Regra de Segregação de Claim: parachoque em estoque (2,28 kg) fica no potencial e NÃO entra no claim confirmado', () => {
    const inputMotor: LoteInputV2 = {
      cdv: { nome: 'CDV Demo', cnpj: '76.123.456/0001-12' },
      veiculo_doador: {
        marca_modelo: 'Gol 1.6',
        baixa_detran: 'PR-BX-2026-991204',
      },
      pecas: [
        {
          sku: 'PART-GOL-PARAC-01',
          descricao: 'Parachoque dianteiro',
          material: 'polímeros',
          peso_kg: 4.0,
        },
      ],
      destinacao: [
        {
          sku: 'PART-GOL-PARAC-01',
          status: 'estoque', // Peça apenas armazenada
        },
      ],
    }

    const resultado = calcularLoteOrbisV2(inputMotor)

    expect(resultado.pecas_detalhes[0].status_claim).toBe('potencial')
    expect(resultado.evitado_confirmado_kg).toBe(0.0)
    expect(resultado.evitado_potencial_kg).toBe(2.28)
    expect(resultado.evitado_liquido_kg).toBe(2.28)
  })

  // 4. Teste de Sensibilidade a Fatores e Parâmetros Regulatórios do DM-ORB-001 v1.1
  it('4. Validação de Fatores Oficiais: fatores 2.18, 5.40 e 1.90 e incertezas 3.5%, 4.5% e 5.0% aplicados com fidelidade', () => {
    const reproducao = auditarLoteTecparIndependente(dadosLoteDemonstracao)

    // Capô
    expect(reproducao.pecas[0].evitado_liquido).toBe(6.54)
    expect(reproducao.pecas[0].u_fe).toBe(0.035)

    // Estator Cobre
    expect(reproducao.pecas[1].evitado_liquido).toBe(4.05)
    expect(reproducao.pecas[1].u_fe).toBe(0.045)

    // Parachoque Polímeros
    expect(reproducao.pecas[2].evitado_liquido).toBe(2.28)
    expect(reproducao.pecas[2].u_fe).toBe(0.05)
  })
})
