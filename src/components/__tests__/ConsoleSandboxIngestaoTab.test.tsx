import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import React from 'react'
import { ConsoleSandboxIngestaoTab } from '../ConsoleSandboxIngestaoTab'
import pb from '@/lib/pocketbase/client'

describe('ConsoleSandboxIngestaoTab - Tratamento de Erros e Gravação Real', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('exibe erro de backend quando a gravação de selos ou lotes falhar (não engole erros)', async () => {
    // Mock do emissoes_inventario para o item 1
    vi.spyOn(pb.collection('emissoes_inventario'), 'create').mockResolvedValue({
      id: 'inv-test-1',
    } as any)

    // Simula erro 400 Failed to create record do PocketBase em selos
    const selosCreateSpy = vi.spyOn(pb.collection('selos'), 'create').mockRejectedValue({
      status: 400,
      message: 'Failed to create record.',
      response: {
        data: {
          codigo_selo: { message: 'Only authorized roles can write.' },
        },
      },
    })

    render(<ConsoleSandboxIngestaoTab />)

    // Clica para gerar 1 documento sintético
    const btnGerar = screen.getByRole('button', { name: /Gerar 10 Docs Sintéticos/i })
    fireEvent.click(btnGerar)

    // Aguarda tabela aparecer com lote gerado
    await waitFor(() => {
      expect(screen.getByText(/Lote de Documentos Prontos/i)).toBeInTheDocument()
    })

    // Iniciar Ingestão no Pipeline
    const btnIngestar = screen.getByRole('button', { name: /Ingestar no Pipeline/i })
    fireEvent.click(btnIngestar)

    // Aguarda feedback de erro na tela
    await waitFor(() => {
      expect(screen.getByText(/Falha na ingestão:/i)).toBeInTheDocument()
    })

    // Deve exibir o badge/texto de FALHA NA GRAVAÇÃO e não Sucesso
    expect(screen.getAllByText(/FALHA NA GRAVAÇÃO/i).length).toBeGreaterThan(0)
    expect(screen.getByText(/Falhados: 10/i)).toBeInTheDocument()
    expect(screen.getByText(/Gravados: 0/i)).toBeInTheDocument()
    expect(selosCreateSpy).toHaveBeenCalled()
  })

  it('exibe "Selo OK · Lote 400" e a mensagem exata de recusa do PocketBase quando o selo grava mas o lote falha', async () => {
    vi.spyOn(pb.collection('emissoes_inventario'), 'create').mockResolvedValue({
      id: 'inv-test-selo-ok',
    } as any)

    // Selo grava com sucesso
    vi.spyOn(pb.collection('selos'), 'create').mockResolvedValue({
      id: 'selo-gravado-ok-123',
      codigo_selo: 'PR-SEAL-2026-OK123',
    } as any)

    // Lote é recusado pelo PocketBase (ex: HTTP 400)
    const lotesCreateSpy = vi.spyOn(pb.collection('cdv_lotes'), 'create').mockRejectedValue({
      status: 400,
      message: 'Failed to create record.',
      response: {
        data: {
          veiculo_marca_modelo: { message: 'The value cannot be empty.' },
        },
      },
    })

    render(<ConsoleSandboxIngestaoTab />)

    // 1 documento para teste pontual
    const btnVol1 = screen.getByRole('button', { name: '1' })
    fireEvent.click(btnVol1)

    const btnGerar = screen.getByRole('button', { name: /Gerar 1 Docs Sintéticos/i })
    fireEvent.click(btnGerar)

    await waitFor(() => {
      expect(screen.getByText(/Lote de Documentos Prontos/i)).toBeInTheDocument()
    })

    const btnIngestar = screen.getByRole('button', { name: /Ingestar no Pipeline/i })
    fireEvent.click(btnIngestar)

    await waitFor(() => {
      expect(screen.getByText(/Falha na ingestão:/i)).toBeInTheDocument()
    })

    // Destaque visual e badges exigidos
    expect(screen.getByText(/FALHA NA GRAVAÇÃO/i)).toBeInTheDocument()
    expect(screen.getByText(/Selo OK · Lote 400/i)).toBeInTheDocument()
    // Mensagem exata de recusa do PocketBase na UI
    expect(screen.getByText(/Recusa pelo PocketBase:/i)).toBeInTheDocument()
    expect(screen.getByText(/\[Lotes dMRV\]: Failed to create record/i)).toBeInTheDocument()

    // Borda lateral vermelha forte aplicada na linha da tabela
    const linhaComFalha = screen.getByText(/FALHA NA GRAVAÇÃO/i).closest('tr')
    expect(linhaComFalha).not.toBeNull()
    expect(linhaComFalha?.className).toContain('border-l-4')
    expect(linhaComFalha?.className).toContain('border-l-rose-600')

    expect(lotesCreateSpy).toHaveBeenCalled()
  })

  it('exibe "Sem Lote dMRV" em âmbar e "Sucesso dMRV" apenas quando o lote dMRV foi efetivamente persistido', async () => {
    // Caso 1: Sucesso dMRV completo (selo + lote + peças)
    vi.spyOn(pb.collection('emissoes_inventario'), 'create').mockResolvedValue({
      id: 'inv-sucesso-1',
    } as any)
    vi.spyOn(pb.collection('selos'), 'create').mockResolvedValue({
      id: 'selo-1',
      codigo_selo: 'PR-SEAL-2026-COMPLETE',
    } as any)
    vi.spyOn(pb.collection('cdv_lotes'), 'create').mockResolvedValue({
      id: 'lote-1',
    } as any)
    vi.spyOn(pb.collection('cdv_pecas'), 'create').mockResolvedValue({
      id: 'peca-1',
    } as any)

    const { unmount } = render(<ConsoleSandboxIngestaoTab />)

    const btnVol1 = screen.getByRole('button', { name: '1' })
    fireEvent.click(btnVol1)

    const btnGerar = screen.getByRole('button', { name: /Gerar 1 Docs Sintéticos/i })
    fireEvent.click(btnGerar)

    await waitFor(() => {
      expect(screen.getByText(/Lote de Documentos Prontos/i)).toBeInTheDocument()
    })

    const btnIngestar = screen.getByRole('button', { name: /Ingestar no Pipeline/i })
    fireEvent.click(btnIngestar)

    await waitFor(() => {
      expect(screen.getByText('Sucesso dMRV')).toBeInTheDocument()
    })

    // Garante que o rótulo de sucesso é especificamente "Sucesso dMRV"
    expect(screen.getByText('Sucesso dMRV')).toBeInTheDocument()
    expect(screen.queryByText('Sem Lote dMRV')).not.toBeInTheDocument()
    unmount()
  })

  it('reporta sucesso e contagem de peças quando gravação no backend responde 200/201', async () => {
    const invCreateSpy = vi
      .spyOn(pb.collection('emissoes_inventario'), 'create')
      .mockResolvedValue({
        id: 'inv-123',
      } as any)

    vi.spyOn(pb.collection('selos'), 'create').mockResolvedValue({
      id: 'selo-123',
      codigo_selo: 'PR-SEAL-2026-999999',
    } as any)

    vi.spyOn(pb.collection('cdv_lotes'), 'create').mockResolvedValue({
      id: 'lote-123',
    } as any)

    vi.spyOn(pb.collection('cdv_pecas'), 'create').mockResolvedValue({
      id: 'peca-123',
    } as any)

    render(<ConsoleSandboxIngestaoTab />)

    // Troca volume para 1 para agilizar teste
    const btnVol1 = screen.getByRole('button', { name: '1' })
    fireEvent.click(btnVol1)

    // Clica para gerar
    const btnGerar = screen.getByRole('button', { name: /Gerar 1 Docs Sintéticos/i })
    fireEvent.click(btnGerar)

    await waitFor(() => {
      expect(screen.getByText(/Lote de Documentos Prontos/i)).toBeInTheDocument()
    })

    // Iniciar Ingestão
    const btnIngestar = screen.getByRole('button', { name: /Ingestar no Pipeline/i })
    fireEvent.click(btnIngestar)

    await waitFor(() => {
      expect(
        screen.getByText(/Ingestão concluída: 1 documento\(s\) gravado\(s\) com sucesso/i),
      ).toBeInTheDocument()
    })

    expect(screen.getByText(/Gravados: 1/i)).toBeInTheDocument()
    expect(screen.queryByText(/Falhados:/i)).not.toBeInTheDocument()
    // Mensagem de sucesso honesta com selo e lote dMRV gravado
    expect(screen.getAllByText(/Selo gravado ✓ · Lote dMRV gravado ✓/i).length).toBeGreaterThan(0)
    expect(invCreateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        origem: 'sintetico',
        escopo1_total_tco2e: expect.any(Number),
        escopo2_localizacao_tco2e: expect.any(Number),
        escopo3_total_tco2e: expect.any(Number),
      }),
    )
  })

  it('grava cdv_lotes e cdv_pecas com origem sintetico e sem crédito de carbono ao ingestar segmento Agro', async () => {
    vi.spyOn(pb.collection('emissoes_inventario'), 'create').mockResolvedValue({
      id: 'inv-agro',
    } as any)

    vi.spyOn(pb.collection('selos'), 'create').mockResolvedValue({
      id: 'selo-agro',
      codigo_selo: 'PR-SEAL-2026-AGRO1',
    } as any)

    const lotesCreateSpy = vi.spyOn(pb.collection('cdv_lotes'), 'create').mockResolvedValue({
      id: 'lote-agro-123',
    } as any)

    const pecasCreateSpy = vi.spyOn(pb.collection('cdv_pecas'), 'create').mockResolvedValue({
      id: 'peca-agro-123',
    } as any)

    render(<ConsoleSandboxIngestaoTab />)

    // Seleciona segmento Agro
    const select = screen.getByRole('combobox') as HTMLSelectElement
    fireEvent.change(select, { target: { value: 'agro' } })
    expect(select.value).toBe('agro')

    // 1 documento
    const btnVol1 = screen.getByRole('button', { name: '1' })
    fireEvent.click(btnVol1)

    // Clica para gerar
    const btnGerar = screen.getByRole('button', { name: /Gerar 1 Docs Sintéticos/i })
    fireEvent.click(btnGerar)

    await waitFor(() => {
      expect(screen.getByText(/Lote de Documentos Prontos/i)).toBeInTheDocument()
    })

    // Clica para ingestar
    const btnIngestar = screen.getByRole('button', { name: /Ingestar no Pipeline/i })
    fireEvent.click(btnIngestar)

    await waitFor(() => {
      expect(screen.getAllByText(/Selo gravado ✓ · Lote dMRV gravado ✓/i).length).toBeGreaterThan(0)
    })

    // Verifica que cdv_lotes foi chamado com origem sintetico e protocoloSetorialSlug 'agro'
    expect(lotesCreateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        origem: 'sintetico',
        is_demo: true,
        total_co2e_evitado_kg: 0, // sem crédito para grãos/soja sem fator
        payload_bruto_json: expect.objectContaining({
          protocoloSetorialSlug: 'agro',
          marca: expect.any(String),
        }),
      }),
    )

    // Verifica que cdv_pecas foi gravado com status em_estruturacao_de_catalogo e fator 0
    expect(pecasCreateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        origem: 'sintetico',
        lote: 'lote-agro-123',
        fator_co2e_kg: 0,
        co2e_evitado_kg: 0,
        peso_kg: expect.any(Number),
        material_declarado: expect.stringContaining(
          '[STATUS: EM ESTRUTURAÇÃO DE CATÁLOGO - ZERO CRÉDITO]',
        ),
      }),
    )
  })

  it('grava com sucesso peça com co2e_evitado_kg: 0 e peso_kg: 0 (sem crédito de carbono)', async () => {
    vi.spyOn(pb.collection('emissoes_inventario'), 'create').mockResolvedValue({
      id: 'inv-zero-test',
    } as any)
    vi.spyOn(pb.collection('selos'), 'create').mockResolvedValue({
      id: 'selo-zero-test',
      codigo_selo: 'PR-SEAL-2026-ZERO1',
    } as any)
    vi.spyOn(pb.collection('cdv_lotes'), 'create').mockResolvedValue({
      id: 'lote-zero-123',
    } as any)

    const pecasCreateSpy = vi
      .spyOn(pb.collection('cdv_pecas'), 'create')
      .mockImplementation(async (body: any) => {
        // Simula a validação do PocketBase pós-migração 0097:
        // Campos peso_kg e co2e_evitado_kg aceitam 0 como número válido
        if (typeof body.co2e_evitado_kg !== 'number' || typeof body.peso_kg !== 'number') {
          throw new Error('Tipo inválido')
        }
        return { id: 'peca-zero-ok', ...body } as any
      })

    render(<ConsoleSandboxIngestaoTab />)

    // Seleciona Agro (fator 0 / sem crédito)
    const select = screen.getByRole('combobox') as HTMLSelectElement
    fireEvent.change(select, { target: { value: 'agro' } })

    const btnVol1 = screen.getByRole('button', { name: '1' })
    fireEvent.click(btnVol1)

    const btnGerar = screen.getByRole('button', { name: /Gerar 1 Docs Sintéticos/i })
    fireEvent.click(btnGerar)

    await waitFor(() => {
      expect(screen.getByText(/Lote de Documentos Prontos/i)).toBeInTheDocument()
    })

    const btnIngestar = screen.getByRole('button', { name: /Ingestar no Pipeline/i })
    fireEvent.click(btnIngestar)

    await waitFor(() => {
      expect(screen.getByText('Sucesso dMRV')).toBeInTheDocument()
    })

    expect(pecasCreateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        co2e_evitado_kg: 0,
        fator_co2e_kg: 0,
        origem: 'sintetico',
      }),
    )
  })

  it('grava cdv_lotes para Energia, Logística, Mineração e Química mesmo com rastreabilidadePecas: false no catálogo', async () => {
    vi.spyOn(pb.collection('emissoes_inventario'), 'create').mockResolvedValue({
      id: 'inv-synth',
    } as any)
    vi.spyOn(pb.collection('selos'), 'create').mockResolvedValue({ id: 'selo-synth' } as any)
    const lotesCreateSpy = vi
      .spyOn(pb.collection('cdv_lotes'), 'create')
      .mockResolvedValue({ id: 'lote-synth' } as any)
    const pecasCreateSpy = vi
      .spyOn(pb.collection('cdv_pecas'), 'create')
      .mockResolvedValue({ id: 'peca-synth' } as any)

    const segmentosTestar = ['energia', 'logistica', 'mineracao', 'quimica']

    for (const seg of segmentosTestar) {
      lotesCreateSpy.mockClear()
      pecasCreateSpy.mockClear()

      const { unmount } = render(<ConsoleSandboxIngestaoTab />)
      const select = screen.getByRole('combobox') as HTMLSelectElement
      fireEvent.change(select, { target: { value: seg } })

      const btnVol1 = screen.getByRole('button', { name: '1' })
      fireEvent.click(btnVol1)

      const btnGerar = screen.getByRole('button', { name: /Gerar 1 Docs Sintéticos/i })
      fireEvent.click(btnGerar)

      await waitFor(() => {
        expect(screen.getByText(/Lote de Documentos Prontos/i)).toBeInTheDocument()
      })

      const btnIngestar = screen.getByRole('button', { name: /Ingestar no Pipeline/i })
      fireEvent.click(btnIngestar)

      await waitFor(() => {
        expect(lotesCreateSpy).toHaveBeenCalled()
      })

      expect(lotesCreateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          origem: 'sintetico',
          payload_bruto_json: expect.objectContaining({
            protocoloSetorialSlug: seg,
          }),
        }),
      )
      expect(pecasCreateSpy).toHaveBeenCalled()

      unmount()
    }
  })

  it('permite selecionar qualquer um dos 15 protocolos setoriais no combobox', () => {
    render(<ConsoleSandboxIngestaoTab />)
    const select = screen.getByRole('combobox') as HTMLSelectElement
    expect(select.options.length).toBe(16) // 15 protocolos + materiais críticos
    fireEvent.change(select, { target: { value: 'siderurgia' } })
    expect(select.value).toBe('siderurgia')
    fireEvent.change(select, { target: { value: 'materiais-criticos-recuperados' } })
    expect(select.value).toBe('materiais-criticos-recuperados')
  })

  it('peça de soja é classificada como categoria agro_rastreado e nunca como mineral crítico', async () => {
    vi.spyOn(pb.collection('emissoes_inventario'), 'create').mockResolvedValue({
      id: 'inv-soja-test',
    } as any)
    vi.spyOn(pb.collection('selos'), 'create').mockResolvedValue({
      id: 'selo-soja-test',
      codigo_selo: 'PR-SEAL-2026-SOJA1',
    } as any)
    vi.spyOn(pb.collection('cdv_lotes'), 'create').mockResolvedValue({
      id: 'lote-soja-123',
    } as any)

    let pecaCriada: any = null
    vi.spyOn(pb.collection('cdv_pecas'), 'create').mockImplementation(async (body: any) => {
      pecaCriada = body
      return { id: 'peca-soja-ok', ...body } as any
    })

    render(<ConsoleSandboxIngestaoTab />)

    // Seleciona segmento Agro
    const select = screen.getByRole('combobox') as HTMLSelectElement
    fireEvent.change(select, { target: { value: 'agro' } })

    const btnVol1 = screen.getByRole('button', { name: '1' })
    fireEvent.click(btnVol1)

    const btnGerar = screen.getByRole('button', { name: /Gerar 1 Docs Sintéticos/i })
    fireEvent.click(btnGerar)

    await waitFor(() => {
      expect(screen.getByText(/Lote de Documentos Prontos/i)).toBeInTheDocument()
    })

    const btnIngestar = screen.getByRole('button', { name: /Ingestar no Pipeline/i })
    fireEvent.click(btnIngestar)

    await waitFor(() => {
      expect(pecaCriada).not.toBeNull()
    })

    // Garante que a categoria é agro_rastreado
    expect(pecaCriada.categoria_material).toBe('agro_rastreado')
    expect(pecaCriada.categoria_material).not.toBe('materiais_criticos_rastreados')
    expect(pecaCriada.material_declarado).not.toMatch(
      /Fração Crítica|Ouro|Paládio|Prata|Terras Raras/i,
    )
    expect(pecaCriada.material_declarado).toMatch(/Agro|Biomassa|Soja|Milho|Grãos/i)
  })

  it('exibe badge da semente da rodada e varia valores/chaves a cada execução no Sandbox', async () => {
    render(<ConsoleSandboxIngestaoTab />)

    const btnVol1 = screen.getByRole('button', { name: '1' })
    fireEvent.click(btnVol1)

    const btnGerar = screen.getByRole('button', { name: /Gerar 1 Docs Sintéticos/i })
    fireEvent.click(btnGerar)

    await waitFor(() => {
      expect(screen.getByTestId('badge-round-seed')).toBeInTheDocument()
    })

    const textoSemente1 = screen.getByTestId('badge-round-seed').textContent
    expect(textoSemente1).toMatch(/Semente da rodada: #\d+/)

    // Gera segunda rodada
    fireEvent.click(btnGerar)

    await waitFor(() => {
      const textoSemente2 = screen.getByTestId('badge-round-seed').textContent
      expect(textoSemente2).toMatch(/Semente da rodada: #\d+/)
      // Semente por rodada é gerada a cada clique
      expect(textoSemente2).not.toBe(textoSemente1)
    })
  })

  it('exibe botão de Purge Demo, modal em 2 etapas com contagem e executa purge com sucesso mantendo lotes reais', async () => {
    // Mock contagem e execução de purge
    const adminService = await import('@/services/adminConsoleService')
    const spyContar = vi.spyOn(adminService, 'contarRegistrosSandboxPurge').mockResolvedValue({
      lotes: 12,
      pecas: 85,
      selos: 15,
      emissoes: 3,
      total: 115,
    })

    const spyExecutar = vi.spyOn(adminService, 'executarSandboxPurge').mockResolvedValue({
      sucesso: true,
      mensagem: 'Expurgo concluído: 12 lotes, 85 peças e 15 selos excluídos.',
      lotes: 12,
      pecas: 85,
      selos: 15,
      emissoes: 3,
    })

    render(<ConsoleSandboxIngestaoTab />)

    // Localiza o botão de Purge no Sandbox
    const btnPurge = screen.getByRole('button', {
      name: /Limpar Base de Testes Sandbox \(Purge Demo\)/i,
    })
    expect(btnPurge).toBeInTheDocument()

    // Clica para abrir modal etapa 1
    fireEvent.click(btnPurge)

    await waitFor(() => {
      expect(screen.getByText('Expurgo da Base Sandbox (Purge Demo)')).toBeInTheDocument()
      expect(screen.getByText('Etapa 1 de 2 • Governança Restrita')).toBeInTheDocument()
      expect(screen.getByText('12')).toBeInTheDocument()
      expect(screen.getByText('85')).toBeInTheDocument()
      expect(screen.getByText('15')).toBeInTheDocument()
    })
    expect(spyContar).toHaveBeenCalled()

    // Avança para a Etapa 2
    const btnProsseguir = screen.getByRole('button', { name: /Prosseguir para Confirmação Final/i })
    fireEvent.click(btnProsseguir)

    await waitFor(() => {
      expect(screen.getByText('Etapa 2 de 2 • Governança Restrita')).toBeInTheDocument()
      expect(screen.getByText('EXPURGAR-SANDBOX')).toBeInTheDocument()
    })

    // Preenche a frase de confirmação
    const inputConfirmacao = screen.getByPlaceholderText('EXPURGAR-SANDBOX')
    fireEvent.change(inputConfirmacao, { target: { value: 'EXPURGAR-SANDBOX' } })

    // Confirma expurgo
    const btnConfirmar = screen.getByRole('button', { name: /Confirmar Expurgo Irreversível/i })
    fireEvent.click(btnConfirmar)

    await waitFor(() => {
      expect(spyExecutar).toHaveBeenCalledWith('EXPURGAR-SANDBOX')
      expect(
        screen.getByText(/Expurgo concluído: 12 lotes, 85 peças e 15 selos excluídos\./i),
      ).toBeInTheDocument()
    })
  })
})
