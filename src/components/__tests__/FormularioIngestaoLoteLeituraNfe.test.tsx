import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { FormularioIngestaoLoteLeituraNfe } from '../FormularioIngestaoLoteLeituraNfe'
import * as leitorService from '@/services/leitorNotaFiscalService'

describe('FormularioIngestaoLoteLeituraNfe Componente', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('1. Renderiza o formulário vazio inicialmente com gravação bloqueada até confirmação humana', () => {
    render(<FormularioIngestaoLoteLeituraNfe />)

    expect(
      screen.getByText(/Coleta do Lote • Pré-preenchimento por Leitura de Nota Fiscal/i),
    ).toBeInTheDocument()
    expect(screen.getByText(/Gravação bloqueada até confirmação humana/i)).toBeInTheDocument()
    expect(screen.getByTestId('btn-confirmar-lote')).toBeInTheDocument()

    const inputNota = screen.getByTestId('input-numero-nota') as HTMLInputElement
    expect(inputNota.value).toBe('')
  })

  it('2. Extração bem-sucedida gera sugestões visuais sem salvar nada no lote automaticamente', async () => {
    vi.spyOn(leitorService, 'lerNotaFiscalParaSugestao').mockResolvedValue({
      sucesso_leitura: true,
      degradacao_graciosa: false,
      fonte: 'agente_nativo',
      agente: 'triador-ingestao-cdv',
      confianca: 'alta',
      tipo_documento: 'DANFE',
      dados_sugeridos: {
        numero_nota: '155',
        serie: '1',
        data_emissao: '2026-03-11',
        emitente_razao_social: 'Pan Urania Indústria',
        emitente_cnpj: '61.123.456/0001-99',
        destinatario_razao_social: 'Centro de Desmonte dMRV',
        destinatario_cnpj_cpf: '76.987.654/0001-11',
        descricao_material: 'Alternador com bobinamento de cobre',
        peso_liquido_kg: 5.2,
        peso_bruto_kg: 5.5,
        valor_total: 820.0,
        itens: [
          {
            descricao: 'Alternador 90A',
            ncm: '8511.50.10',
            peso_kg: 5.2,
            valor_total: 820.0,
            categoria_sugerida: 'cobre',
          },
        ],
      },
      alertas: [],
      mensagem_operador: 'Valores extraídos. Revise e confirme.',
    })

    const onLoteConfirmadoMock = vi.fn()

    render(
      <FormularioIngestaoLoteLeituraNfe
        onLoteConfirmado={onLoteConfirmadoMock}
        usuarioAtual={{
          nome: 'Perito Dr. Mauro',
          email: 'mauro.gil@orbisprotocol.com',
        }}
      />,
    )

    // Simula anexo de arquivo
    const file = new File(['mock content'], 'nota_155.pdf', { type: 'application/pdf' })
    const inputFileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    fireEvent.change(inputFileInput, { target: { files: [file] } })

    // Aguarda processamento e exibição das sugestões
    await waitFor(() => {
      expect(screen.getByTestId('aviso-sucesso-leitura')).toBeInTheDocument()
    })

    // Os campos são preenchidos como sugestões
    const inputNota = screen.getByTestId('input-numero-nota') as HTMLInputElement
    expect(inputNota.value).toBe('155')

    // Badges visuais de "sugerido pela leitura da nota fiscal" aparecem nos campos
    expect(screen.getByTestId('badge-sugestao-numero_nota')).toBeInTheDocument()
    expect(screen.getByTestId('badge-sugestao-emitente_razao_social')).toBeInTheDocument()

    // Regra inegociável: NADA foi salvo/confirmado ainda no banco/callback
    expect(onLoteConfirmadoMock).not.toHaveBeenCalled()
  })

  it('3. Confirmação humana explícita aciona a gravação com metadados de auditoria completos', async () => {
    vi.spyOn(leitorService, 'lerNotaFiscalParaSugestao').mockResolvedValue({
      sucesso_leitura: true,
      degradacao_graciosa: false,
      fonte: 'agente_nativo',
      agente: 'triador-ingestao-cdv',
      dados_sugeridos: {
        numero_nota: '155',
        serie: '1',
        data_emissao: '2026-03-11',
        emitente_razao_social: 'Pan Urania Indústria',
        emitente_cnpj: '61.123.456/0001-99',
        destinatario_razao_social: 'Centro de Desmonte dMRV',
        destinatario_cnpj_cpf: '76.987.654/0001-11',
        descricao_material: 'Alternador com bobinamento de cobre',
        peso_liquido_kg: 5.2,
        peso_bruto_kg: 5.5,
        valor_total: 820.0,
      },
    })

    const onLoteConfirmadoMock = vi.fn()

    render(
      <FormularioIngestaoLoteLeituraNfe
        onLoteConfirmado={onLoteConfirmadoMock}
        usuarioAtual={{
          nome: 'Eng. Marcelo Brandão',
          email: 'marcelo.brandao@cdverde.com.br',
        }}
      />,
    )

    const file = new File(['mock content'], 'nota_155.pdf', { type: 'application/pdf' })
    const inputFileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    fireEvent.change(inputFileInput, { target: { files: [file] } })

    await waitFor(() => {
      expect(screen.getByTestId('aviso-sucesso-leitura')).toBeInTheDocument()
    })

    // Operador altera a descrição manualmente
    const inputDesc = screen.getByTestId('input-descricao-material')
    fireEvent.change(inputDesc, {
      target: { value: 'Alternador com bobinamento de cobre verificado no checklist' },
    })

    // Operador clica em "Confirmar e Salvar no Lote"
    const btnConfirmar = screen.getByTestId('btn-confirmar-lote')
    fireEvent.click(btnConfirmar)

    // Agora sim o callback é chamado com metadados de auditoria
    expect(onLoteConfirmadoMock).toHaveBeenCalledTimes(1)
    const loteEnviado = onLoteConfirmadoMock.mock.calls[0][0]

    expect(loteEnviado.numero_nota).toBe('155')
    expect(loteEnviado.descricao_material).toBe(
      'Alternador com bobinamento de cobre verificado no checklist',
    )
    expect(loteEnviado.auditoria.confirmado_por.nome).toBe('Eng. Marcelo Brandão')
    expect(loteEnviado.auditoria.confirmado_por.email).toBe('marcelo.brandao@cdverde.com.br')
    expect(loteEnviado.auditoria.campos['numero_nota'].origem).toBe('leitura_automatica')

    // Painel de auditoria confirmada deve ser renderizado
    expect(screen.getByTestId('painel-auditoria-confirmada')).toBeInTheDocument()
  })

  it('4. Degradação graciosa: se a leitura falhar, exibe aviso e mantém preenchimento manual sem erro', async () => {
    vi.spyOn(leitorService, 'lerNotaFiscalParaSugestao').mockResolvedValue({
      sucesso_leitura: false,
      degradacao_graciosa: true,
      motivo: 'Documento escaneado ilegível.',
      mensagem_aviso: 'Não foi possível ler o documento — preenchimento manual.',
      dados_sugeridos: null,
    })

    render(<FormularioIngestaoLoteLeituraNfe />)

    const file = new File(['corrupted content'], 'ilegivel.pdf', { type: 'application/pdf' })
    const inputFileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    fireEvent.change(inputFileInput, { target: { files: [file] } })

    await waitFor(() => {
      expect(screen.getByTestId('aviso-degradacao-graciosa')).toBeInTheDocument()
    })

    expect(
      screen.getByText(/Não foi possível ler o documento — preenchimento manual\./i),
    ).toBeInTheDocument()

    // O formulário continua operacional para entrada manual
    const inputNota = screen.getByTestId('input-numero-nota') as HTMLInputElement
    fireEvent.change(inputNota, { target: { value: '999' } })
    expect(inputNota.value).toBe('999')
  })
})
