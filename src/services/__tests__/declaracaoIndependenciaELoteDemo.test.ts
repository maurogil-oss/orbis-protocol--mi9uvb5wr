import { describe, expect, it } from 'vitest'
import {
  MAPA_DECLARACAO_INDEPENDENCIA,
  resolverDeclaracaoIndependencia,
  TEXTO_DECLARACAO_NAO_REGISTRADA,
} from '../consentimentoPeritoService'
import { isLoteDemo, TEXTO_AVISO_LOTE_DEMO } from '../loteDemoService'

describe('resolverDeclaracaoIndependencia (Peça 2 — Tecpar)', () => {
  it('retorna o texto correto para terceiro_independente', () => {
    expect(resolverDeclaracaoIndependencia('terceiro_independente')).toBe(
      'Terceiro independente sem vínculo societário ou empregatício',
    )
  })

  it('retorna o texto correto para vinculo_empregaticio', () => {
    expect(resolverDeclaracaoIndependencia('vinculo_empregaticio')).toBe(
      'Vínculo empregatício com o cliente',
    )
  })

  it('retorna o texto correto para outro_vinculo', () => {
    expect(resolverDeclaracaoIndependencia('outro_vinculo')).toBe('Outro vínculo declarado')
  })

  it('anexa observacao opcional quando informada', () => {
    const resultado = resolverDeclaracaoIndependencia(
      'terceiro_independente',
      'ART 1234567890 vinculada',
    )
    expect(resultado).toContain('Terceiro independente')
    expect(resultado).toContain('ART 1234567890 vinculada')
  })

  it('retorna "não registrada na emissão" quando vazio, null ou undefined (lote antigo)', () => {
    expect(resolverDeclaracaoIndependencia(undefined)).toBe(TEXTO_DECLARACAO_NAO_REGISTRADA)
    expect(resolverDeclaracaoIndependencia(null)).toBe(TEXTO_DECLARACAO_NAO_REGISTRADA)
    expect(resolverDeclaracaoIndependencia('')).toBe(TEXTO_DECLARACAO_NAO_REGISTRADA)
    expect(resolverDeclaracaoIndependencia('   ')).toBe(TEXTO_DECLARACAO_NAO_REGISTRADA)
  })

  it('nunca inventa valor fora do mapa: aceita apenas os 3 tipos canônicos ou o texto de fallback', () => {
    expect(Object.keys(MAPA_DECLARACAO_INDEPENDENCIA).sort()).toEqual([
      'outro_vinculo',
      'terceiro_independente',
      'vinculo_empregaticio',
    ])
    // Valor desconhecido é devolvido literal (não inventado), mas campo ausente SEMPRE cai no fallback
    expect(resolverDeclaracaoIndependencia('outro_valor_livre')).toBe('outro_valor_livre')
    expect(resolverDeclaracaoIndependencia('não registrada na emissão')).toBe(
      TEXTO_DECLARACAO_NAO_REGISTRADA,
    )
  })
})

describe('isLoteDemo (Peça 2 — Tecpar)', () => {
  it('detecta lote VERTEC (vrtclotew292022) por id', () => {
    expect(isLoteDemo({ id: 'vrtclotew292022' })).toBe(true)
    expect(isLoteDemo('vrtclotew292022')).toBe(true)
  })

  it('detecta lote Gol (h1dpr8wniludemh) por id', () => {
    expect(isLoteDemo({ id: 'h1dpr8wniludemh' })).toBe(true)
    expect(isLoteDemo('h1dpr8wniludemh')).toBe(true)
  })

  it('detecta flag is_demo/isDemo true mesmo sem id conhecido', () => {
    expect(isLoteDemo({ id: 'lote-qualquer', is_demo: true })).toBe(true)
    expect(isLoteDemo({ id: 'lote-qualquer', isDemo: true })).toBe(true)
  })

  it('detecta baixa de teste PR-BX-2026-991204', () => {
    expect(isLoteDemo({ id: 'outro-lote', veiculo_baixa_detran: 'PR-BX-2026-991204' })).toBe(true)
    expect(isLoteDemo({ id: 'outro-lote', baixa_detran: 'PR-BX-2026-991204' })).toBe(true)
    expect(isLoteDemo('PR-BX-2026-991204')).toBe(true)
  })

  it('detecta código canônico VERTEC-IW29-2022', () => {
    expect(isLoteDemo({ id: 'x', codigo_lote: 'VERTEC-IW29-2022' })).toBe(true)
  })

  it('retorna false para lote real', () => {
    expect(isLoteDemo({ id: 'c1jz14hgmf7n13i', is_demo: false })).toBe(false)
    expect(isLoteDemo({ id: 'c1jz14hgmf7n13i', veiculo_baixa_detran: 'PR-BX-2026-777777' })).toBe(
      false,
    )
    expect(isLoteDemo('c1jz14hgmf7n13i')).toBe(false)
    expect(isLoteDemo(null)).toBe(false)
    expect(isLoteDemo(undefined)).toBe(false)
    expect(isLoteDemo('')).toBe(false)
  })

  it('exporta texto de aviso padronizado para o badge didático', () => {
    expect(TEXTO_AVISO_LOTE_DEMO).toBe(
      'EXEMPLO DIDÁTICO — material de demonstração, não constitui prova documental de operação real',
    )
  })
})
