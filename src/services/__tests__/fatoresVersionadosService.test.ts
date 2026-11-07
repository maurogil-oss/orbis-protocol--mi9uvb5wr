import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  parseCsvFatoresEmissao,
  criarSnapshotFator,
  obterFatorComSnapshot,
  MODELO_EXEMPLO_CSV_FATORES,
  CABECALHO_CSV_FATORES_PADRAO,
} from '../fatoresVersionadosService'
import pb from '@/lib/pocketbase/client'

describe('Serviço de Fatores de Emissão Versionados com Importação CSV (Etapa 3 Peça 3b)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Validação e Parser de CSV de Fatores', () => {
    it('1. Importa CSV válido preenchendo todos os campos versionados exigidos (fonte, ano, escopo, geografia, unidade, validade)', () => {
      const csvValido = `${CABECALHO_CSV_FATORES_PADRAO}
mat-teste-aco;Aço EAF 2024;1.85;kgCO2e/kg;worldsteel Scrap Route LCA;2024;Escopo 3 Cat. 1;Global;2025-01-01 a 2026-12-31;v2025.2;3.5;T3;Aço laminado via forno elétrico`

      const resultado = parseCsvFatoresEmissao(csvValido)

      expect(resultado.sucesso).toBe(true)
      expect(resultado.totalAceitas).toBe(1)
      expect(resultado.totalRecusadas).toBe(0)
      expect(resultado.fatoresValidos.length).toBe(1)

      const fator = resultado.fatoresValidos[0]
      expect(fator.codigo).toBe('mat-teste-aco')
      expect(fator.material).toBe('Aço EAF 2024')
      expect(fator.fator).toBe(1.85)
      expect(fator.unidade).toBe('kgCO2e/kg')
      expect(fator.fonte).toBe('worldsteel Scrap Route LCA')
      expect(fator.ano).toBe(2024)
      expect(fator.escopo).toBe('Escopo 3 Cat. 1')
      expect(fator.geografia).toBe('Global')
      expect(fator.validade).toBe('2025-01-01 a 2026-12-31')
      expect(fator.versao).toBe('v2025.2')
      expect(fator.incerteza_pct).toBe(3.5)
      expect(fator.tier).toBe('T3')
    })

    it('2. Rejeita CSV com modelo exemplo fornecido sem erros', () => {
      const resultado = parseCsvFatoresEmissao(MODELO_EXEMPLO_CSV_FATORES)
      expect(resultado.sucesso).toBe(true)
      expect(resultado.totalAceitas).toBe(3)
      expect(resultado.totalRecusadas).toBe(0)
      expect(resultado.fatoresValidos[0].fonte).toContain('worldsteel')
      expect(resultado.fatoresValidos[1].fonte).toContain('IAI')
      expect(resultado.fatoresValidos[2].fonte).toContain('PBGHG')
    })

    it('3. REGRA DE OURO ACP: Linha de CSV sem fonte (campo vazio) é terminantemente recusada com erro claro', () => {
      const csvSemFonte = `${CABECALHO_CSV_FATORES_PADRAO}
mat-valido;Aço Valido;2.18;kgCO2e/kg;worldsteel 2024;2024;Escopo 3;Global;2025-01-01;v2025.2;3.5;T3;com fonte
mat-invalido;Material Fantasma;5.50;kgCO2e/kg;;2024;Escopo 3;Global;2025-01-01;v2025.2;5.0;T1;sem fonte informada`

      const resultado = parseCsvFatoresEmissao(csvSemFonte)

      // A linha 3 (mat-invalido) deve ter sido recusada
      expect(resultado.sucesso).toBe(false)
      expect(resultado.totalAceitas).toBe(1)
      expect(resultado.totalRecusadas).toBe(1)
      expect(resultado.erros.length).toBe(1)

      const erro = resultado.erros[0]
      expect(erro.linhaNumero).toBe(3)
      expect(erro.campo).toBe('fonte')
      expect(erro.motivo).toMatch(/Campo "fonte" está vazio/i)
      expect(erro.motivo).toMatch(
        /Nenhum fator de emissão pode ser registrado sem fonte homologada/i,
      )

      // Garante que o material sem fonte NÃO entrou na lista de válidos
      const codigosValidos = resultado.fatoresValidos.map((f) => f.codigo)
      expect(codigosValidos).toContain('mat-valido')
      expect(codigosValidos).not.toContain('mat-invalido')
    })

    it('4. Recusa CSV se coluna obrigatória "fonte" não constar no cabeçalho', () => {
      const csvSemColunaFonte = `codigo;material;fator;unidade;ano;escopo;validade
mat-1;Teste;1.0;kgCO2e/kg;2024;Escopo 1;2025`

      const resultado = parseCsvFatoresEmissao(csvSemColunaFonte)

      expect(resultado.sucesso).toBe(false)
      expect(resultado.fatoresValidos.length).toBe(0)
      expect(resultado.erros[0].campo).toBe('fonte')
      expect(resultado.erros[0].motivo).toMatch(/Coluna obrigatória "fonte" ausente/i)
    })

    it('5. Recusa linha com valor de fator numérico inválido ou negativo', () => {
      const csvFatorNegativo = `${CABECALHO_CSV_FATORES_PADRAO}
mat-neg;Aço Negativo;-1.5;kgCO2e/kg;worldsteel 2024;2024;Escopo 3;Global;2025-01-01;v2025.2;3.5;T3;detalhe`

      const resultado = parseCsvFatoresEmissao(csvFatorNegativo)

      expect(resultado.sucesso).toBe(false)
      expect(resultado.totalRecusadas).toBe(1)
      expect(resultado.erros[0].campo).toBe('fator')
      expect(resultado.erros[0].motivo).toMatch(/inválido ou negativo/i)
    })
  })

  describe('Princípio de Anti-Retroatividade do Snapshot', () => {
    it('6. Garante que o snapshot gerado no momento do cálculo congela fonte, ano, versão e valor imutavelmente', () => {
      const fatorOriginal = {
        codigo: 'mat-aco',
        versao: 'v2025.2',
        fator: 2.18,
        unidade: 'kgCO2e/kg',
        fonte: 'worldsteel Association 2024 (2,18 tCO2e/t)',
        ano: 2024,
        escopo: 'Escopo 3 Cat. 1',
        geografia: 'Global (worldsteel)',
        validade: '2025-01-01 a 2026-12-31',
        tier: 'T3',
        incerteza_pct: 3.5,
      }

      const snapshot = criarSnapshotFator(fatorOriginal)

      expect(snapshot.codigoFator).toBe('mat-aco')
      expect(snapshot.versaoFator).toBe('v2025.2')
      expect(snapshot.valorFator).toBe(2.18)
      expect(snapshot.fonteFator).toBe('worldsteel Association 2024 (2,18 tCO2e/t)')
      expect(snapshot.anoReferencia).toBe(2024)
      expect(snapshot.validadeFator).toBe('2025-01-01 a 2026-12-31')
      expect(snapshot.dataSnapshotIso).toBeDefined()
      expect(snapshot.hashSnapshot).toContain('mat-aco')
      expect(snapshot.hashSnapshot).toContain('2.18')

      // Simula atualização prospectiva do catálogo para uma versão futura (ex: 2026 com novo valor)
      const fatorFuturoAtualizado = {
        ...fatorOriginal,
        versao: 'v2026.1',
        fator: 1.95,
        fonte: 'worldsteel Association 2025 Data Release (1,95 tCO2e/t)',
        ano: 2025,
      }

      const novoSnapshotFuturo = criarSnapshotFator(fatorFuturoAtualizado)

      // O snapshot do item anterior PERMANECE 2.18 v2025.2 intacto
      expect(snapshot.valorFator).toBe(2.18)
      expect(snapshot.versaoFator).toBe('v2025.2')
      expect(snapshot.anoReferencia).toBe(2024)

      // O novo cálculo prospectivo usa os dados novos
      expect(novoSnapshotFuturo.valorFator).toBe(1.95)
      expect(novoSnapshotFuturo.versaoFator).toBe('v2026.1')
      expect(novoSnapshotFuturo.anoReferencia).toBe(2025)
      expect(snapshot.hashSnapshot).not.toBe(novoSnapshotFuturo.hashSnapshot)
    })
  })

  describe('Consulta de Fator Canônico e Fallback', () => {
    it('7. Retorna fator com snapshot a partir do catálogo canônico quando não houver conexão de rede', async () => {
      vi.spyOn(pb, 'collection').mockReturnValue({
        getFirstListItem: vi.fn().mockRejectedValue(new Error('Network offline')),
      } as any)

      const resultado = await obterFatorComSnapshot('mat-aco')

      expect(resultado).not.toBeNull()
      expect(resultado?.fator.fator).toBe(2.18)
      expect(resultado?.fator.fonte).toContain('worldsteel')
      expect(resultado?.snapshot.valorFator).toBe(2.18)
      expect(resultado?.snapshot.codigoFator).toBe('aco')
    })
  })
})
