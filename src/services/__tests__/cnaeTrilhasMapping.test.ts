import { describe, it, expect } from 'vitest'
import { normalizarCNAE, sugerirTrilhaPorCNAE } from '../cnaeTrilhasMapping'

describe('Mapeamento Inteligente de CNAE para Trilhas e Protocolos', () => {
  it('normaliza códigos de CNAE com pontuação', () => {
    expect(normalizarCNAE('45.30-7/04')).toBe('4530704')
    expect(normalizarCNAE('01.11-3/01')).toBe('0111301')
    expect(normalizarCNAE(null)).toBe('')
    expect(normalizarCNAE(undefined)).toBe('')
  })

  it('mapeia CNAE de desmanche / CDV (4530704) para trilha MOVER e protocolo automotiva', () => {
    const sugestao = sugerirTrilhaPorCNAE('45.30-7/04')
    expect(sugestao).not.toBeNull()
    expect(sugestao?.trilhaSlug).toBe('mover')
    expect(sugestao?.protocoloSlug).toBe('automotiva')
    expect(sugestao?.nomeSegmento).toContain('Automotiva')
    expect(sugestao?.categoriaProfissionalSugerida).toContain('CDV')
  })

  it('mapeia CNAE de reciclagem / recuperação de materiais (3831901) para Mineração Urbana', () => {
    const sugestao = sugerirTrilhaPorCNAE('38.31-9/01')
    expect(sugestao).not.toBeNull()
    expect(sugestao?.trilhaSlug).toBe('mineracao')
    expect(sugestao?.protocoloSlug).toBe('materiais-criticos-recuperados')
    expect(sugestao?.destaquesRegulatorios).toContain(
      'Política Nacional de Resíduos Sólidos (Lei 12.305/2010)',
    )
  })

  it('mapeia CNAE de cultivo agrícola / grãos (0111301) para protocolo agro e SBCE', () => {
    const sugestao = sugerirTrilhaPorCNAE('01.11-3/01')
    expect(sugestao).not.toBeNull()
    expect(sugestao?.trilhaSlug).toBe('sbce-financas-verdes')
    expect(sugestao?.protocoloSlug).toBe('agro')
    expect(sugestao?.destaquesRegulatorios.some((d) => d.includes('EUDR'))).toBe(true)
  })

  it('mapeia CNAE de fabricação de concreto / cimento (2330305) para protocolo cimento', () => {
    const sugestao = sugerirTrilhaPorCNAE('23.30-3/05')
    expect(sugestao).not.toBeNull()
    expect(sugestao?.protocoloSlug).toBe('cimento')
    expect(sugestao?.trilhaSlug).toBe('sbce-financas-verdes')
  })

  it('mapeia CNAE de transporte rodoviário de cargas (4930202) para protocolo logistica', () => {
    const sugestao = sugerirTrilhaPorCNAE('4930202')
    expect(sugestao).not.toBeNull()
    expect(sugestao?.protocoloSlug).toBe('logistica')
  })

  it('mapeia CNAE de contabilidade / auditoria (6920601) para trilha peritos-tecnicos', () => {
    const sugestao = sugerirTrilhaPorCNAE('6920601')
    expect(sugestao).not.toBeNull()
    expect(sugestao?.trilhaSlug).toBe('peritos-tecnicos')
    expect(sugestao?.categoriaProfissionalSugerida).toContain('CRC')
  })

  it('faz fallback para CNAEs secundários quando o principal for genérico', () => {
    // Principal genérico de holdings/consultoria (não mapeado especificamente)
    // Secundário: desmanche 4530704
    const sugestao = sugerirTrilhaPorCNAE('8299799', [{ codigo: '4530704' }, { codigo: '6810202' }])
    expect(sugestao).not.toBeNull()
    expect(sugestao?.trilhaSlug).toBe('mover')
    expect(sugestao?.descricaoSugestao).toContain('4530704')
  })

  it('retorna null silenciosamente e sem erro quando o CNAE não estiver no mapa alvo', () => {
    const sugestao = sugerirTrilhaPorCNAE('9602501') // Cabeleireiros
    expect(sugestao).toBeNull()
  })
})
