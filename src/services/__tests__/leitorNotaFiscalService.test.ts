import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  lerNotaFiscalParaSugestao,
  construirRegistroAuditoriaLote,
  type DadosNotaFiscalSugeridos,
} from '../leitorNotaFiscalService'

describe('leitorNotaFiscalService - Leitura de NF-e e Pré-preenchimento', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('1. Extração bem-sucedida via agente nativo retorna sugestões estruturadas completas', async () => {
    const dadosMock: DadosNotaFiscalSugeridos = {
      numero_nota: '154',
      serie: '1',
      data_emissao: '2026-03-10',
      emitente_razao_social: 'Pan Urania S/A Indústria e Comércio',
      emitente_cnpj: '61.123.456/0001-99',
      destinatario_razao_social: 'Centro de Desmonte Paranaense dMRV',
      destinatario_cnpj_cpf: '76.987.654/0001-11',
      descricao_material: 'Capô de aço estampado e parachoque de polipropileno',
      peso_liquido_kg: 18.3,
      peso_bruto_kg: 20.0,
      valor_total: 1850.5,
      itens: [
        {
          descricao: 'Capô dianteiro',
          ncm: '8708.29.99',
          peso_kg: 14.5,
          valor_total: 1200.0,
          categoria_sugerida: 'aco',
        },
        {
          descricao: 'Parachoque',
          ncm: '8708.10.00',
          peso_kg: 3.8,
          valor_total: 650.5,
          categoria_sugerida: 'polimeros',
        },
      ],
    }

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        sucesso_leitura: true,
        degradacao_graciosa: false,
        fonte: 'agente_nativo',
        agente: 'triador-ingestao-cdv',
        documento_arquivo: 'danfe_154.pdf',
        confianca: 'alta',
        tipo_documento: 'DANFE',
        dados_sugeridos: dadosMock,
        alertas: [],
        mensagem_operador: 'Dados extraídos com sucesso.',
      }),
    } as any)

    const fakeFile = new File(['%PDF-1.4 mock content'], 'danfe_154.pdf', {
      type: 'application/pdf',
    })

    const res = await lerNotaFiscalParaSugestao({ arquivo: fakeFile })

    expect(res.sucesso_leitura).toBe(true)
    expect(res.degradacao_graciosa).toBe(false)
    expect(res.agente).toBe('triador-ingestao-cdv')
    expect(res.dados_sugeridos).not.toBeNull()
    expect(res.dados_sugeridos?.numero_nota).toBe('154')
    expect(res.dados_sugeridos?.emitente_cnpj).toBe('61.123.456/0001-99')
    expect(res.dados_sugeridos?.peso_liquido_kg).toBe(18.3)
    expect(res.dados_sugeridos?.itens?.length).toBe(2)
  })

  it('2. Degradação graciosa em caso de documento ilegível ou status 422/500', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        sucesso_leitura: false,
        degradacao_graciosa: true,
        motivo: 'Documento escaneado sem OCR.',
        mensagem_aviso: 'Não foi possível ler o documento — preenchimento manual.',
        dados_sugeridos: null,
      }),
    } as any)

    const fakeFile = new File(['scanned blank image'], 'doc_escaneado.pdf', {
      type: 'application/pdf',
    })

    const res = await lerNotaFiscalParaSugestao({ arquivo: fakeFile })

    expect(res.sucesso_leitura).toBe(false)
    expect(res.degradacao_graciosa).toBe(true)
    expect(res.dados_sugeridos).toBeNull()
    expect(res.mensagem_aviso).toBe('Não foi possível ler o documento — preenchimento manual.')
  })

  it('3. Degradação graciosa quando fetch rejeita com erro de rede / timeout (nunca explode exceção)', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error or connection timeout'))

    const res = await lerNotaFiscalParaSugestao({
      nomeArquivo: 'teste_timeout.pdf',
      textoOuXml: 'teste',
    })

    expect(res.sucesso_leitura).toBe(false)
    expect(res.degradacao_graciosa).toBe(true)
    expect(res.dados_sugeridos).toBeNull()
    expect(res.mensagem_aviso).toContain('Não foi possível ler o documento — preenchimento manual')
  })

  it('4. Construção do envelope de auditoria permanente: grava procedência e dados do confirmador humano', () => {
    const valoresFinais: DadosNotaFiscalSugeridos = {
      numero_nota: '154',
      serie: '1',
      data_emissao: '2026-03-10',
      emitente_razao_social: 'Pan Urania S/A',
      emitente_cnpj: '61.123.456/0001-99',
      destinatario_razao_social: 'Centro de Desmonte Sul',
      destinatario_cnpj_cpf: '76.987.654/0001-11',
      descricao_material: 'Peças automotivas revisadas',
      peso_liquido_kg: 18.3,
      peso_bruto_kg: 20.0,
      valor_total: 1850.5,
      itens: [],
    }

    const sugestoesOriginais: DadosNotaFiscalSugeridos = {
      ...valoresFinais,
      descricao_material: 'Sucata mista sem triagem', // Operador alterou para 'Peças automotivas revisadas'
    }

    const loteAuditado = construirRegistroAuditoriaLote({
      valoresFinais,
      sugestoesOriginais,
      usuarioConfirmador: {
        nome: 'Eng. Marcelo Brandão',
        email: 'marcelo.brandao@cdverde.com.br',
      },
      documentoRef: 'danfe_154_pan_urania.pdf',
      fonteLeitura: 'triador-ingestao-cdv',
    })

    // Validação da auditoria
    expect(loteAuditado.auditoria).toBeDefined()
    expect(loteAuditado.auditoria.confirmado_por.nome).toBe('Eng. Marcelo Brandão')
    expect(loteAuditado.auditoria.confirmado_por.email).toBe('marcelo.brandao@cdverde.com.br')
    expect(loteAuditado.auditoria.documento_lido_ref).toBe('danfe_154_pan_urania.pdf')
    expect(loteAuditado.auditoria.fonte_leitura).toBe('triador-ingestao-cdv')

    // Campo número da nota veio de leitura automática
    const campoNumeroNota = loteAuditado.auditoria.campos['numero_nota']
    expect(campoNumeroNota.origem).toBe('leitura_automatica')
    expect(campoNumeroNota.confirmado_por_nome).toBe('Eng. Marcelo Brandão')
    expect(campoNumeroNota.valor_sugerido_original).toBe('154')

    // Campo alterado pelo humano mantém metadados de quem confirmou
    const campoDesc = loteAuditado.auditoria.campos['descricao_material']
    expect(campoDesc.confirmado_por_nome).toBe('Eng. Marcelo Brandão')
    expect(loteAuditado.descricao_material).toBe('Peças automotivas revisadas')
  })
})
