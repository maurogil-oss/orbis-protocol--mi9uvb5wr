import { describe, it, expect } from 'vitest'
import {
  calcularHashCanonicalLastro,
  gerarCodigoLastro,
  AVISO_LEGAL_LASTRO,
} from '../lastroCcrlrService'
import { classificarSbce } from '../dmrvEmissoesService'

describe('Pacote de Conformidade • Lastro de Circularidade & dMRV', () => {
  it('gera código determinístico de lastro com prefixo ORB-LST', () => {
    const codigo = gerarCodigoLastro(2026)
    expect(codigo).toMatch(/^ORB-LST-2026-[A-Z0-9]{5}$/)
  })

  it('calcula hash SHA-256 canônico consistente para o lastro', async () => {
    const dados = {
      codigo_lastro: 'ORB-LST-2026-TEST1',
      cnpj_emissor: '33.000.168/0001-09',
      entidade_gestora_alvo: 'Entidade Gestora Nacional',
      periodo_inicio: '01/01/2026',
      periodo_fim: '31/12/2026',
      massa_total_lr_obrigatoria_kg: 4150.5,
      massa_metais_convencionais_kg: 18400.0,
    }

    const hash1 = await calcularHashCanonicalLastro(dados)
    const hash2 = await calcularHashCanonicalLastro(dados)

    expect(hash1).toBeDefined()
    expect(hash1.length).toBe(64)
    expect(hash1).toBe(hash2)
  })

  it('contém aviso legal obrigatório com menção ao Decreto 11.413/2023 e vedação de substituição do CCRLR', () => {
    expect(AVISO_LEGAL_LASTRO).toContain('Decreto Federal nº 11.413/2023')
    expect(AVISO_LEGAL_LASTRO).toContain('LASTRO DE CIRCULARIDADE')
    expect(AVISO_LEGAL_LASTRO).toContain(
      'NÃO substitui e não se confunde com o Certificado de Crédito de Reciclagem',
    )
    expect(AVISO_LEGAL_LASTRO).toContain('Entidade Gestora')
  })

  it('classifica corretamente os limiares do SBCE (isento, reporte 10k, compensação 25k)', () => {
    const isento = classificarSbce(8500)
    expect(isento.categoria).toBe('isento')

    const reporte = classificarSbce(15000)
    expect(reporte.categoria).toBe('dever_reporte_10k')

    const compensacao = classificarSbce(32000)
    expect(compensacao.categoria).toBe('compensacao_25k')
  })
})
