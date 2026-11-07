import { describe, it, expect } from 'vitest'
import {
  construirMemoriaHipotesesLote,
  normalizarDadosComplementaresLote,
  DadosComplementaresLoteInput,
} from '../loteComplementarService'

describe('loteComplementarService - Suíte de Testes Unitários (Etapa 3, Peça 3c)', () => {
  describe('Caso 1: Lote com todos os campos complementares preenchidos', () => {
    it('não gera nenhuma hipótese de campo ausente quando transporte, origem e material estão preenchidos', () => {
      const inputCompleto: DadosComplementaresLoteInput = {
        transporte_distancia_km: 180,
        transporte_modal: 'rodoviario',
        origem_cidade: 'Curitiba',
        origem_uf: 'PR',
        tipo_material_predominante: 'aco',
      }

      const memoria = construirMemoriaHipotesesLote(inputCompleto)

      expect(memoria.temTransporteDeclarado).toBe(true)
      expect(memoria.temOrigemDeclarada).toBe(true)
      expect(memoria.temMaterialDeclarado).toBe(true)
      expect(memoria.distanciaKm).toBe(180)
      expect(memoria.modal).toBe('rodoviario')
      expect(memoria.origemTexto).toBe('Curitiba / PR')
      expect(memoria.materialSlug).toBe('aco')
      expect(memoria.materialRotulo).toBe('Aço / Ferrosos')

      // Todos os itens de hipótese gerados devem ter status "informado"
      const itensNaoInformados = memoria.hipoteses.filter((h) => h.status === 'nao_informado')
      expect(itensNaoInformados).toHaveLength(0)

      // Nenhum texto deve acusar campo ausente ou omitido
      for (const item of memoria.hipoteses) {
        expect(item.status).toBe('informado')
        expect(item.hipoteseTexto).not.toMatch(/não informado/i)
        expect(item.hipoteseTexto).not.toMatch(/não especificado/i)
        expect(item.hipoteseTexto).not.toMatch(/desconsiderado/i)
      }
    })

    it('aceita variações válidas de modal (ferroviario, hidroviario) e formatos de número', () => {
      const inputFerrovia: DadosComplementaresLoteInput = {
        transporte_distancia_km: '350,5',
        transporte_modal: 'ferrovia',
        origem_cidade: 'Paranaguá',
        origem_uf: 'PR',
        tipo_material_predominante: 'aluminio',
      }

      const memoria = construirMemoriaHipotesesLote(inputFerrovia)

      expect(memoria.temTransporteDeclarado).toBe(true)
      expect(memoria.distanciaKm).toBe(350.5)
      expect(memoria.modal).toBe('ferroviario')
      expect(memoria.materialSlug).toBe('aluminio')
      expect(memoria.hipoteses.filter((h) => h.status === 'nao_informado')).toHaveLength(0)
    })
  })

  describe('Caso 2: Campos em branco geram hipóteses textuais sem inventar NENHUM número', () => {
    it('quando todos os campos estão nulos ou vazios, gera hipóteses periciais para transporte, origem e material', () => {
      const inputVazio: DadosComplementaresLoteInput = {
        transporte_distancia_km: null,
        transporte_modal: null,
        origem_cidade: null,
        origem_uf: null,
        tipo_material_predominante: null,
      }

      const memoria = construirMemoriaHipotesesLote(inputVazio)

      expect(memoria.temTransporteDeclarado).toBe(false)
      expect(memoria.temOrigemDeclarada).toBe(false)
      expect(memoria.temMaterialDeclarado).toBe(false)
      expect(memoria.distanciaKm).toBeNull()
      expect(memoria.modal).toBeNull()
      expect(memoria.origemTexto).toBeNull()
      expect(memoria.materialSlug).toBeNull()

      // Deve ter gerado 3 hipóteses declaradas como 'nao_informado'
      const hipotesesNaoInformadas = memoria.hipoteses.filter((h) => h.status === 'nao_informado')
      expect(hipotesesNaoInformadas).toHaveLength(3)

      const hipoTransporte = memoria.hipoteses.find((h) => h.campo === 'transporte_consolidado')
      expect(hipoTransporte).toBeDefined()
      expect(hipoTransporte?.valorDeclarado).toBeNull()
      expect(hipoTransporte?.hipoteseTexto).toContain(
        'Transporte não informado — hipótese: componente de transporte desconsiderado nesta apuração preliminar.',
      )
      expect(hipoTransporte?.impactoCalculo).toContain(
        'Nenhum valor fictício de distância ou frete foi imputado',
      )

      const hipoOrigem = memoria.hipoteses.find((h) => h.campo === 'origem')
      expect(hipoOrigem).toBeDefined()
      expect(hipoOrigem?.valorDeclarado).toBeNull()
      expect(hipoOrigem?.hipoteseTexto).toContain(
        'Origem geográfica (cidade/UF) não informada — hipótese: procede do domicílio cadastral do emitente fiscal da NF-e.',
      )

      const hipoMaterial = memoria.hipoteses.find((h) => h.campo === 'tipo_material')
      expect(hipoMaterial).toBeDefined()
      expect(hipoMaterial?.valorDeclarado).toBeNull()
      expect(hipoMaterial?.hipoteseTexto).toContain(
        'Tipo de material predominante não especificado — hipótese: classificação individual item a item via NCM e descrição da NF-e.',
      )

      // Regra anti-invenção estrita: nenhuma hipótese de campo ausente inventa números de distância, rota ou fator
      for (const h of hipotesesNaoInformadas) {
        expect(h.valorDeclarado).toBeNull()
        // O texto consolidado para campos ausentes não deve conter valores numéricos arbitrários
        expect(h.hipoteseTexto).not.toMatch(/\b\d+(\.\d+)?\s*(km|tkm|kg|tCO2e)\b/i)
      }
    })

    it('quando input é undefined ou objeto vazio, comporta-se identicamente sem quebrar', () => {
      const memoriaNull = construirMemoriaHipotesesLote(null)
      const memoriaUndefined = construirMemoriaHipotesesLote(undefined)
      const memoriaObjVazio = construirMemoriaHipotesesLote({})

      expect(memoriaNull.hipoteses).toHaveLength(3)
      expect(memoriaUndefined.hipoteses).toHaveLength(3)
      expect(memoriaObjVazio.hipoteses).toHaveLength(3)
      expect(memoriaNull.distanciaKm).toBeNull()
      expect(memoriaUndefined.distanciaKm).toBeNull()
      expect(memoriaObjVazio.distanciaKm).toBeNull()
    })

    it('quando apenas distância é informada sem modal, suspende cálculo e não inventa modal padrão', () => {
      const memoria = construirMemoriaHipotesesLote({
        transporte_distancia_km: 120,
        transporte_modal: null,
      })

      const hipoModal = memoria.hipoteses.find((h) => h.campo === 'transporte_modal')
      expect(hipoModal).toBeDefined()
      expect(hipoModal?.status).toBe('nao_informado')
      expect(hipoModal?.hipoteseTexto).toContain(
        'Modal de transporte não informado — hipótese: modalidade indeterminada; emissão de transporte não calculada',
      )
      expect(hipoModal?.impactoCalculo).toContain('cálculo de tkm e CO2e logístico suspenso')
    })

    it('quando apenas modal é informado sem distância, suspende cálculo e não inventa km padrão', () => {
      const memoria = construirMemoriaHipotesesLote({
        transporte_distancia_km: null,
        transporte_modal: 'rodoviario',
      })

      const hipoDist = memoria.hipoteses.find((h) => h.campo === 'transporte_distancia_km')
      expect(hipoDist).toBeDefined()
      expect(hipoDist?.status).toBe('nao_informado')
      expect(hipoDist?.hipoteseTexto).toContain(
        'distância em km não informada — hipótese: percurso logístico desconsiderado',
      )
      expect(hipoDist?.impactoCalculo).toContain('Sem acréscimo de emissão fóssil de transporte')
    })
  })

  describe('Caso 3: Opção B - nenhuma hipótese pode conter valor de fator de emissão', () => {
    const casosInput: Array<{ nome: string; input?: DadosComplementaresLoteInput | null }> = [
      { nome: 'todos nulos', input: null },
      { nome: 'todos vazios', input: {} },
      {
        nome: 'totalmente preenchido',
        input: {
          transporte_distancia_km: 250,
          transporte_modal: 'rodoviario',
          origem_cidade: 'São Paulo',
          origem_uf: 'SP',
          tipo_material_predominante: 'aco',
        },
      },
      {
        nome: 'apenas transporte informado',
        input: {
          transporte_distancia_km: 50,
          transporte_modal: 'hidroviario',
        },
      },
      {
        nome: 'apenas origem informada',
        input: {
          origem_cidade: 'Belo Horizonte',
          origem_uf: 'MG',
        },
      },
      {
        nome: 'apenas material informado',
        input: {
          tipo_material_predominante: 'cobre',
        },
      },
    ]

    casosInput.forEach(({ nome, input }) => {
      it(`garante que nenhuma hipótese exibe valores numéricos de fatores de emissão (${nome})`, () => {
        const memoria = construirMemoriaHipotesesLote(input)

        // Valores numéricos conhecidos de fatores da metodologia DM-ORB-001 (e.g., 2.18, 14.40, 4.10, etc.)
        const valoresFatoresProibidos = [
          '2,18',
          '2.18',
          '14,40',
          '14.40',
          '14,4',
          '14.4',
          '4,10',
          '4.10',
          '4,1',
          '4.1',
          'kgCO2',
          'kg CO2',
          'tCO2',
          't CO2',
          'gCO2',
          'g CO2',
          'fator de emissão =',
          'fator =',
        ]

        for (const hipo of memoria.hipoteses) {
          const textoCompleto = `${hipo.hipoteseTexto} ${hipo.impactoCalculo} ${hipo.valorDeclarado ?? ''}`

          for (const valorProibido of valoresFatoresProibidos) {
            expect(textoCompleto.toLowerCase()).not.toContain(valorProibido.toLowerCase())
          }

          // Nenhuma unidade de emissão de fator (e.g. kgCO2e/kg ou tCO2e/tkm) deve estar presente nas hipóteses
          expect(textoCompleto).not.toMatch(/\b(kg|t)\s*co2e?\s*\/\s*(kg|t|tkm)\b/i)
        }

        // Também valida no texto consolidado do laudo
        const textoLaudo = memoria.textoConsolidadoLaudo.toLowerCase()
        for (const valorProibido of valoresFatoresProibidos) {
          expect(textoLaudo).not.toContain(valorProibido.toLowerCase())
        }
      })
    })
  })

  describe('Função utilitária normalizarDadosComplementaresLote', () => {
    it('normaliza distâncias formatadas com vírgula ou string e descarta números negativos', () => {
      expect(
        normalizarDadosComplementaresLote({
          transporte_distancia_km: '150,75',
        }).transporte_distancia_km,
      ).toBe(150.75)

      expect(
        normalizarDadosComplementaresLote({
          transporte_distancia_km: -10,
        }).transporte_distancia_km,
      ).toBeNull()

      expect(
        normalizarDadosComplementaresLote({
          transporte_distancia_km: 'invalido',
        }).transporte_distancia_km,
      ).toBeNull()
    })

    it('normaliza UF válida em caixa alta e descarta UF inválida', () => {
      expect(
        normalizarDadosComplementaresLote({
          origem_uf: 'pr',
        }).origem_uf,
      ).toBe('PR')

      expect(
        normalizarDadosComplementaresLote({
          origem_uf: 'XX',
        }).origem_uf,
      ).toBeNull()
    })

    it('normaliza aliases de materiais e modais', () => {
      const norm = normalizarDadosComplementaresLote({
        transporte_modal: 'RODOVIA',
        tipo_material_predominante: 'AÇO',
      })
      expect(norm.transporte_modal).toBe('rodoviario')
      expect(norm.tipo_material_predominante).toBe('aco')
    })
  })
})
