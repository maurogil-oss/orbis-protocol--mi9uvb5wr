import { describe, it, expect } from 'vitest'
import schemaJson from '@/lib/pocketbase/schema.json'
import {
  gerarLoteSintetico,
  SEGMENTOS_SANDBOX_CATALOGO,
  type SegmentoSandbox,
} from '@/services/sandboxSyntheticGenerator'
import { ConsoleSandboxIngestaoTab } from '@/components/ConsoleSandboxIngestaoTab'

describe('cdv_pecas categoria_material schema alignment', () => {
  const cdvPecasSchema = (schemaJson as any).collections.find((c: any) => c.name === 'cdv_pecas')
  const catField = cdvPecasSchema?.fields.find((f: any) => f.name === 'categoria_material')

  it('o campo categoria_material de cdv_pecas existe no schema PocketBase e contém agro_rastreado', () => {
    expect(cdvPecasSchema).toBeDefined()
    expect(catField).toBeDefined()
    expect(catField.type).toBe('select')
    expect(catField.selectValues).toContain('agro_rastreado')
    expect(catField.selectValues).toEqual([
      'aco',
      'aluminio',
      'cobre',
      'polimeros',
      'concreto',
      'agro_rastreado',
      'outros',
    ])
  })

  it('todos os itens gerados pelo gerador sintético de todos os 16 segmentos produzem categoria_material válida no schema', async () => {
    const permitidas = new Set(catField.selectValues as string[])

    for (const seg of SEGMENTOS_SANDBOX_CATALOGO) {
      const lote = await gerarLoteSintetico({
        segmento: seg.chave,
        quantidade: 2,
        usarCnpjAlfanumerico: false,
      })

      expect(lote.length).toBeGreaterThan(0)

      for (const doc of lote) {
        expect(doc.itens.length).toBeGreaterThan(0)
        for (const item of doc.itens) {
          // Se o item tiver categoriaMaterial explicita no gerador, ela deve ser permitida
          if (item.categoriaMaterial) {
            expect(
              permitidas.has(item.categoriaMaterial),
              `Item ${item.xProd} no segmento ${seg.chave} possui categoriaMaterial "${item.categoriaMaterial}" que não está no schema de cdv_pecas`,
            ).toBe(true)
          }
        }
      }
    }
  })

  it('itens do lote do segmento agro são marcados com agro_rastreado', async () => {
    const loteAgro = await gerarLoteSintetico({
      segmento: 'agro',
      quantidade: 1,
      usarCnpjAlfanumerico: false,
    })

    expect(loteAgro.length).toBe(1)
    const doc = loteAgro[0]
    expect(doc.itens.length).toBeGreaterThan(0)
    for (const item of doc.itens) {
      expect(item.categoriaMaterial).toBe('agro_rastreado')
    }
  })
})
