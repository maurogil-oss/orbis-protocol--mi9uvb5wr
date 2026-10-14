import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  obterConfiguracaoEmpresa,
  salvarLeituraAssistidaEmpresa,
  normalizarCnpj,
  _limparMemoriaConfiguracaoEmpresa,
} from '../empresaConfigService'

describe('empresaConfigService', () => {
  beforeEach(() => {
    _limparMemoriaConfiguracaoEmpresa()
    vi.clearAllMocks()
  })

  it('1. normalizarCnpj remove pontuações e caracteres não numéricos', () => {
    expect(normalizarCnpj('12.345.678/0001-90')).toBe('12345678000190')
    expect(normalizarCnpj('')).toBe('')
    expect(normalizarCnpj(undefined)).toBe('')
  })

  it('2. Se a configuração não existir para a empresa, trata como ativa (default: true) e degrada graciosamente', async () => {
    const config = await obterConfiguracaoEmpresa('99.999.999/0001-99', 'Empresa Nova')
    expect(config.leituraAssistidaAtiva).toBe(true)
    expect(config.empresaCnpj).toBe('99.999.999/0001-99')
    expect(config.empresaNome).toBe('Empresa Nova')
  })

  it('3. Salvar configuração desativando leitura assistida registra data e responsável', async () => {
    const salvo = await salvarLeituraAssistidaEmpresa({
      empresaCnpj: '11.222.333/0001-44',
      empresaNome: 'CDV Exemplo',
      leituraAssistidaAtiva: false,
      responsavelNomeOuEmail: 'gestor.master@orbisprotocol.com',
    })

    expect(salvo.leituraAssistidaAtiva).toBe(false)
    expect(salvo.empresaCnpj).toBe('11.222.333/0001-44')
    expect(salvo.alteradaPor).toBe('gestor.master@orbisprotocol.com')
    expect(salvo.alteradaEm).toBeDefined()

    // Ao consultar novamente pelo CNPJ formatado ou limpo, retorna a configuração desativada com auditoria
    const consultado = await obterConfiguracaoEmpresa('11222333000144')
    expect(consultado.leituraAssistidaAtiva).toBe(false)
    expect(consultado.alteradaPor).toBe('gestor.master@orbisprotocol.com')
    expect(consultado.alteradaEm).toBe(salvo.alteradaEm)
  })

  it('4. Reativar leitura assistida atualiza a auditoria com o novo responsável', async () => {
    await salvarLeituraAssistidaEmpresa({
      empresaCnpj: '11.222.333/0001-44',
      leituraAssistidaAtiva: false,
      responsavelNomeOuEmail: 'gestor.anterior@orbisprotocol.com',
    })

    const reativado = await salvarLeituraAssistidaEmpresa({
      empresaCnpj: '11.222.333/0001-44',
      leituraAssistidaAtiva: true,
      responsavelNomeOuEmail: 'admin.novo@orbisprotocol.com',
    })

    expect(reativado.leituraAssistidaAtiva).toBe(true)
    expect(reativado.alteradaPor).toBe('admin.novo@orbisprotocol.com')
  })
})
