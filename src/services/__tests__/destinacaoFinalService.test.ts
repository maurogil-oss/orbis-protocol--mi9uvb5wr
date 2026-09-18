import { describe, it, expect } from 'vitest'
import {
  consultarDestinacaoFinalLote,
  DEMO_DESTINACAO_CLIO,
  DEMO_DESTINACAO_GOL,
  calcularHashCanonicalDestinacao,
} from '../destinacaoFinalService'

describe('Serviço de Destinação Final do DPP (3 Camadas)', () => {
  it('deve estruturar corretamente os dados do Lote Demo Clio (PR-BX-2026-1240105)', async () => {
    const dados = await consultarDestinacaoFinalLote('PR-BX-2026-1240105')
    expect(dados).not.toBeNull()
    if (!dados) return

    expect(dados.veiculo_baixa_detran).toBe('PR-BX-2026-1240105')
    expect(dados.is_demo).toBe(true)
    expect(dados.gateDespoluicaoConforme).toBe(true)

    // Camada 1: Gate de Despoluição (Bateria, Pneus, Fluidos)
    const { camada1, camada2, camada3 } = dados.camadas
    expect(camada1.numero).toBe(1)
    expect(camada1.isGate).toBe(true)
    expect(camada1.totalCo2eEvitadoKg).toBe(0) // Não gera claim positivo
    expect(camada1.baseLegalPadrao).toContain('Diretiva ELV')
    expect(camada1.baseLegalPadrao).toContain('CONAMA 401/2008')
    expect(camada1.baseLegalPadrao).toContain('PNRS')
    expect(camada1.reservaPreLaudo).toContain('Reserva Pré-Laudo')
    expect(camada1.itens.length).toBeGreaterThanOrEqual(3)

    // Bateria presente
    const bateria = camada1.itens.find((i) => i.tipo_fluxo.includes('bateria'))
    expect(bateria).toBeDefined()
    expect(bateria?.mtr_sinir).toContain('MTR-SINIR')
    expect(bateria?.nf_destinador).toContain('NF-e')

    // Pneus presentes
    const pneus = camada1.itens.find((i) => i.tipo_fluxo.includes('pneu'))
    expect(pneus).toBeDefined()
    expect(pneus?.mtr_sinir).toContain('MTR-SINIR')

    // Fluidos presentes
    const fluidos = camada1.itens.find((i) => i.tipo_fluxo.includes('fluido'))
    expect(fluidos).toBeDefined()
    expect(fluidos?.mtr_sinir).toContain('MTR-SINIR')

    // Camada 2: Óleo RLO -> Rerrefinador (Estimativa)
    expect(camada2.numero).toBe(2)
    expect(camada2.isEstimativa).toBe(true)
    expect(camada2.totalCo2eEvitadoKg).toBeGreaterThan(0)
    expect(camada2.baseLegalPadrao).toContain('ANP')
    expect(camada2.baseLegalPadrao).toContain('CONAMA 362/2005')
    expect(camada2.reservaPreLaudo).toContain('ESTIMATIVA')
    expect(camada2.reservaPreLaudo).toContain('VVB')

    // Camada 3: Metais / Carcaça / Catalisadores (Claim Principal)
    expect(camada3.numero).toBe(3)
    expect(camada3.isClaimPrincipal).toBe(true)
    expect(camada3.totalCo2eEvitadoKg).toBeGreaterThan(500)
    expect(camada3.baseLegalPadrao).toContain('ISO 14040')
    expect(camada3.reservaPreLaudo).toContain('Reserva Pré-Laudo')

    // Hashes SHA-256 e sem menção indevida a terceiros institucionais sem contrato
    expect(dados.hashGeralDestinacao).toBeDefined()
    for (const item of [...camada1.itens, ...camada2.itens, ...camada3.itens]) {
      expect(item.hash_sha256).toHaveLength(64)
      expect(item.razao_social_destinador).not.toContain('SENAI')
      expect(item.razao_social_destinador).not.toContain('Renova Ecopeças')
    }
  })

  it('deve estruturar corretamente os dados do Lote Demo Gol (PR-BX-2026-991204)', async () => {
    const dados = await consultarDestinacaoFinalLote('PR-BX-2026-991204')
    expect(dados).not.toBeNull()
    if (!dados) return

    expect(dados.veiculo_baixa_detran).toBe('PR-BX-2026-991204')
    expect(dados.gateDespoluicaoConforme).toBe(true)
    expect(dados.camadas.camada1.itens.length).toBe(3)
    expect(dados.camadas.camada2.isEstimativa).toBe(true)
    expect(dados.camadas.camada3.isClaimPrincipal).toBe(true)
  })

  it('deve calcular hash SHA-256 determinístico para strings de destinação', async () => {
    const hash1 = await calcularHashCanonicalDestinacao('MTR-SINIR-TESTE|NF-123|14.8kg')
    const hash2 = await calcularHashCanonicalDestinacao('MTR-SINIR-TESTE|NF-123|14.8kg')
    const hash3 = await calcularHashCanonicalDestinacao('MTR-SINIR-TESTE|NF-999|14.8kg')

    expect(hash1).toHaveLength(64)
    expect(hash1).toBe(hash2)
    expect(hash1).not.toBe(hash3)
  })
})
