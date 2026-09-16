import { describe, it, expect } from 'vitest'
import { parseSpedTxt } from '../spedService'

describe('SPED Service Parser (Modelo 2)', () => {
  it('deve fazer o parse correto de um arquivo SPED Fiscal EFD ICMS/IPI', () => {
    const conteudoSpedExemplo = `
|0000|018|0|01012026|31012026|EMPRESA EXEMPLO INDUSTRIAL LTDA|12345678000195|PR|12345678|4106902|||A|0|
|0150|FORN01|FORNECEDOR DE MATERIAIS SA|1058|98765432000109||123456|4106902||RUA DAS INDUSTRIAS|100||CENTRO|
|C100|0|1|FORN01|55|00|1|102030|41260198765432000109550010001020301001020301|05012026|06012026|50000,00|1|0,00||50000,00|0|0,00|0,00|0,00|50000,00|9000,00|0,00|0,00|2500,00|825,00|3800,00|||
|C170|1|ACO LAMINADO RECICLADO|100|KG|10000,00|0,00|0|000|5102|72041000|||50000,00|18,00|9000,00|0,00|0,00|0,00|00|50000,00|5,00|2500,00|01|50000,00|1,65||825,00|01|50000,00|7,60||3800,00||
|C100|1|0|FORN01|55|00|1|5001|41260112345678000195550010000050011000005001|15012026|15012026|20000,00|0|0,00||20000,00|0|0,00|0,00|0,00|20000,00|3600,00|0,00|0,00|1000,00|330,00|1520,00|||
|C170|1|PECA AUTOMOTIVA REUTILIZADA|10|UN|2000,00|0,00|0|000|5102|87082999|||20000,00|18,00|3600,00|0,00|0,00|0,00|00|20000,00|5,00|1000,00|01|20000,00|1,65||330,00|01|20000,00|7,60||1520,00||
|9999|7|
    `.trim()

    const resultado = parseSpedTxt(conteudoSpedExemplo, 'SPED_01_2026.txt')

    expect(resultado.cnpj).toBe('12345678000195')
    expect(resultado.razaoSocial).toBe('EMPRESA EXEMPLO INDUSTRIAL LTDA')
    expect(resultado.periodoApuracao).toBe('01/2026')
    expect(resultado.totalDocumentos).toBe(2)
    expect(resultado.totalEntradas).toBe(1)
    expect(resultado.totalSaidas).toBe(1)
    expect(resultado.valorTotalDocumentos).toBe(70000)
    expect(resultado.valorIcmsDestacado).toBe(12600)
    expect(resultado.valorIpiDestacado).toBe(3500)
    expect(resultado.valorPisDestacado).toBe(1155)
    expect(resultado.valorCofinsDestacado).toBe(5320)
    expect(resultado.documentosC100[0].chaveAcesso).toBe(
      '41260198765432000109550010001020301001020301',
    )
    expect(resultado.documentosC100[0].itensQtd).toBe(1)
  })

  it('deve identificar arquivo vazio ou com apenas delimitadores sem quebrar', () => {
    const resultado = parseSpedTxt('|9999|1|', 'vazio.txt')
    expect(resultado.totalDocumentos).toBe(0)
    expect(resultado.valorTotalDocumentos).toBe(0)
  })
})
