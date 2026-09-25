import { describe, it, expect } from 'vitest'
import {
  PROTOCOLOS_SETORIAIS,
  LISTA_PROTOCOLOS_SETORIAIS,
  getProtocoloBySlug,
} from '../../data/protocolosSetoriais'

describe('Protocolos Setoriais: Biocombustíveis, Biometano e Arquitetura CBIO -> CGOB -> CS-SAF', () => {
  const protocoloEnergia = PROTOCOLOS_SETORIAIS.energia

  it('posiciona a arquitetura CBIO (2017) -> CGOB (2026) -> CS-SAF (2026) na seção de biocombustíveis e biometano', () => {
    expect(protocoloEnergia).toBeDefined()
    expect(protocoloEnergia.slug).toBe('energia')

    const desc = protocoloEnergia.descricao
    // Verifica a menção da evolução temporal da mesma arquitetura
    expect(desc).toContain('CBIO (2017')
    expect(desc).toContain('CGOB (2026')
    expect(desc).toContain('CS-SAF')
    expect(desc).toContain('Decreto 13.094/2026')
    expect(desc).toContain('book and claim')
    expect(desc).toContain('mesma arquitetura de atributos ambientais')

    // Verifica o posicionamento da Orbis como infraestrutura dMRV de prova de integridade
    expect(desc).toContain('infraestrutura dMRV de prova de integridade e rastreabilidade')
    expect(desc).toContain('dupla contagem')
    expect(desc).toContain('custódia documental')
  })

  it('respeita as travas permanentes: NÃO se apresenta como emissor, NÃO promete emissão de certificados/créditos e NÃO cita instituições sem acordo', () => {
    const textoCompletoEnergia = JSON.stringify(protocoloEnergia).toLowerCase()

    // Regras permanentes: Orbis não é emissora de certificados nem créditos
    expect(textoCompletoEnergia).toContain('sem emitir certificados')
    expect(textoCompletoEnergia).not.toContain('emitimos certificados')
    expect(textoCompletoEnergia).not.toContain('emitimos créditos')
    expect(textoCompletoEnergia).not.toContain('emissão de certificados pela orbis')
    expect(textoCompletoEnergia).not.toContain('nossos créditos de carbono')
    expect(textoCompletoEnergia).not.toContain('nossos certificados de sustentabilidade')
    expect(textoCompletoEnergia).not.toContain('parceria oficial com a b3')
    expect(textoCompletoEnergia).not.toContain('parceria oficial com anp')
    expect(textoCompletoEnergia).not.toContain('parceria com a anac')

    // Confirma tom de "infraestrutura de prova"
    expect(textoCompletoEnergia).toContain('infraestrutura dmrv de prova')
  })

  it('enquadramento legal de energia inclui RenovaBio, Combustível do Futuro (CGOB) e ProBioQAV (CS-SAF)', () => {
    const enquadramentos = protocoloEnergia.enquadramentoLegal
    const temRenovaBio = enquadramentos.some(
      (e) => e.norma.includes('13.576/2017') && e.titulo.includes('CBIOs'),
    )
    const temCgob = enquadramentos.some(
      (e) => e.norma.includes('14.993/2024') && e.titulo.includes('CGOB'),
    )
    const temCssaf = enquadramentos.some(
      (e) => e.norma.includes('13.094/2026') && e.titulo.includes('CS-SAF'),
    )

    expect(temRenovaBio).toBe(true)
    expect(temCgob).toBe(true)
    expect(temCssaf).toBe(true)
  })

  it('evidências de captura cobrem cadeia de custódia e prova de não-duplicação de atributos ambientais', () => {
    const evidenciasBio = protocoloEnergia.evidenciasCaptura.find((c) =>
      c.categoria.includes('Biometano'),
    )
    expect(evidenciasBio).toBeDefined()
    expect(evidenciasBio?.documentos.some((d) => d.includes('CGOB'))).toBe(true)
    expect(evidenciasBio?.documentos.some((d) => d.includes('cadeia de custódia'))).toBe(true)
    expect(evidenciasBio?.documentos.some((d) => d.includes('não-duplicação'))).toBe(true)
  })

  it('getProtocoloBySlug retorna o protocolo energia atualizado', () => {
    const p = getProtocoloBySlug('energia')
    expect(p).toBeDefined()
    expect(p?.nome).toBe('Energia Renovável & Biogás')
    expect(p?.principaisIndicadores).toContain(
      'Unicidade de lastro documental e prevenção de dupla contagem de atributos',
    )
  })
})
