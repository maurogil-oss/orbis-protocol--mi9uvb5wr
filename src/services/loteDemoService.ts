/**
 * Helper para detecção de lotes de demonstração didática / pedagógica no Orbis Protocol.
 *
 * Lotes didáticos:
 * - Flag is_demo === true ou isDemo === true
 * - IDs ou códigos conhecidos: 'vrtclotew292022' (VERTEC) ou 'h1dpr8wniludemh' (Gol)
 * - Baixa DETRAN de teste: 'PR-BX-2026-991204'
 */

export const IDS_LOTES_DEMO = ['vrtclotew292022', 'h1dpr8wniludemh'] as const
export const BAIXA_TESTE_DEMO = 'PR-BX-2026-991204'
export const CODIGOS_DEMO = [
  'VERTEC-IW29-2022',
  'PR-BX-2026-991204',
  'vrtclotew292022',
  'h1dpr8wniludemh',
] as const

export const TEXTO_AVISO_LOTE_DEMO =
  'EXEMPLO DIDÁTICO — material de demonstração, não constitui prova documental de operação real'

export interface ObjetoLoteLike {
  id?: string | null
  codigo?: string | null
  codigo_lote?: string | null
  veiculo_baixa_detran?: string | null
  baixa_detran?: string | null
  is_demo?: boolean | null
  isDemo?: boolean | null
  [key: string]: any
}

/**
 * Detecta se o lote ou identificador corresponde a um modelo didático/demonstração.
 */
export function isLoteDemo(loteOrId?: ObjetoLoteLike | string | null): boolean {
  if (!loteOrId) return false

  if (typeof loteOrId === 'string') {
    const limpo = loteOrId.trim()
    if (!limpo) return false
    if (IDS_LOTES_DEMO.includes(limpo as any)) return true
    if (limpo === BAIXA_TESTE_DEMO) return true
    if (limpo === 'VERTEC-IW29-2022') return true
    return false
  }

  const obj = loteOrId
  if (obj.is_demo === true || obj.isDemo === true) {
    return true
  }

  const id = (obj.id || '').trim()
  if (id && IDS_LOTES_DEMO.includes(id as any)) {
    return true
  }

  const codigo = (obj.codigo || obj.codigo_lote || '').trim()
  if (
    codigo &&
    (codigo === 'VERTEC-IW29-2022' ||
      IDS_LOTES_DEMO.includes(codigo as any) ||
      codigo === BAIXA_TESTE_DEMO)
  ) {
    return true
  }

  const baixa = (obj.veiculo_baixa_detran || obj.baixa_detran || '').trim()
  if (baixa && baixa === BAIXA_TESTE_DEMO) {
    return true
  }

  return false
}
