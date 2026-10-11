import { describe, it, expect } from 'vitest'
import {
  gerarDossieEscopo3Cliente,
  ETIQUETA_CARBONO_EVITADO_CANONICA,
} from '../dossieEscopo3Service'

describe('dossieEscopo3Service', () => {
  it('gera dossiê com titularidade da claim clara para adquirente (Cat 1) ou montadora (Cat 12)', async () => {
    const dossie = await gerarDossieEscopo3Cliente({
      cnpjAdquirente: '12.345.678/0001-90',
      razaoSocialAdquirente: 'Indústria Automotiva Brasil S.A.',
      lotesPreCarregados: [
        {
          id: 'lote-123',
          cdv_codigo: 'CDV-LOTE-2024-01',
          veiculo_marca: 'Volkswagen',
          veiculo_modelo: 'Gol 1.0',
          veiculo_ano: 2018,
          peso_total_kg: 950,
          total_co2e_bruto_kg: 2071,
          total_co2e_evitado_kg: 620,
          total_pecas: 10,
        } as any,
      ],
    })

    expect(dossie.titularidadeClaim.categoria1).toContain(
      'pertence integral e exclusivamente à empresa adquirente',
    )
    expect(dossie.titularidadeClaim.categoria12).toContain('pertence à montadora')
    expect(dossie.titularidadeClaim.declaracaoCdv).toContain('NÃO reivindicam nem vendem redução')
    expect(dossie.titularidadeClaim.registroUsoUnico).toContain('RETIRED_FOR_INSETTING')
    expect(dossie.titularidadeClaim.registroUsoUnico).toContain('12.345.678/0001-90')
  })

  it('inclui a etiqueta canônica exata do carbono evitado', async () => {
    expect(ETIQUETA_CARBONO_EVITADO_CANONICA).toBe(
      'preliminar — não substitui laudo pericial, não é crédito negociável, não é ativo do SBCE',
    )

    const dossie = await gerarDossieEscopo3Cliente({
      cnpjAdquirente: '00.000.000/0001-00',
      razaoSocialAdquirente: 'Empresa Teste',
    })

    expect(dossie.etiquetaEvitado).toBe(
      'preliminar — não substitui laudo pericial, não é crédito negociável, não é ativo do SBCE',
    )
    expect(dossie.hashIntegridadeSha256).toBeDefined()
    expect(dossie.hashIntegridadeSha256?.length).toBe(64)
  })
})
