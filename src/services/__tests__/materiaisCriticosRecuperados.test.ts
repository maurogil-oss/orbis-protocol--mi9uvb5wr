import { describe, it, expect } from 'vitest'
import { calcularHashCanonicalLastro, AVISO_LEGAL_LASTRO } from '../lastroCcrlrService'
import { TRILHAS_DATA } from '../../data/trilhas'
import { PROTOCOLOS_SETORIAIS } from '../../data/protocolosSetoriais'

describe('Módulo de Materiais Críticos Recuperados & Mineração Urbana', () => {
  it('contém a trilha de mineração urbana com Lei 12.305/2010 e 4 módulos de capacitação estruturados', () => {
    const trilha = TRILHAS_DATA['mineracao']
    expect(trilha).toBeDefined()
    expect(trilha.lei).toContain('12.305/2010')
    expect(trilha.titulo).toBe('Mineração Urbana & Materiais Críticos Recuperados')
    expect(trilha.modulos.length).toBe(4)

    // Tempos especificados no plano
    expect(trilha.modulos[0].duracao).toBe('45 min')
    expect(trilha.modulos[1].duracao).toBe('60 min')
    expect(trilha.modulos[2].duracao).toBe('75 min')
    expect(trilha.modulos[3].duracao).toBe('60 min')

    // Discurso regulatório proibindo promessa de créditos de carbono
    const textoCompleto = JSON.stringify(trilha)
    expect(textoCompleto).not.toContain('crédito de carbono')
    expect(textoCompleto).not.toContain('Gerdau')
    expect(textoCompleto).not.toContain('Electrolux')
    expect(textoCompleto).not.toContain('SENAI')
  })

  it('contém o protocolo setorial materiais-criticos-recuperados com DCP e frações registradas', () => {
    const proto = PROTOCOLOS_SETORIAIS['materiais-criticos-recuperados']
    expect(proto).toBeDefined()
    expect(proto.tipoLaudo).toBe(
      'Passaporte Digital de Produto (DCP) — Lote de Materiais Críticos Recuperados',
    )
    expect(proto.nome).toContain('Materiais Críticos Recuperados')

    // Verificação das frações no protocolo
    const desc = proto.descricao
    expect(desc).toContain('NdFeB')
    expect(desc).toContain('ouro, paládio e prata')
    expect(desc).toContain('cobre de alta pureza')

    // Regras de discurso público
    const protoStr = JSON.stringify(proto)
    expect(protoStr).not.toContain('créditos de carbono no solo')
    expect(protoStr).toContain('sem emissão de créditos de carbono')
    expect(protoStr).toContain('refinarias e indústrias compradoras de materiais críticos')
    expect(protoStr).toContain('parceiro metodológico a ser contratado')
    expect(protoStr).not.toContain('Gerdau')
    expect(protoStr).not.toContain('Electrolux')
  })

  it('calcula hash SHA-256 canônico para lote segregado com chave NF-e e identificador do processador', async () => {
    const dadosLote = {
      codigo_lastro: 'ORB-CRIT-2026-LOTE01',
      cnpj_emissor: '33.000.168/0001-09',
      entidade_gestora_alvo: 'Refinarias e Indústrias Compradoras',
      periodo_inicio: '01/01/2026',
      periodo_fim: '31/03/2026',
      massa_total_lr_obrigatoria_kg: 0,
      massa_metais_convencionais_kg: 0,
      massa_materiais_criticos_kg: 1500.0,
      teor_terras_raras_kg: 72.5,
      teor_metais_nobres_g: 450.0,
      teor_cobre_recuperado_kg: 950.0,
      tipo_lastro_segregado: 'segregado_materiais_criticos_recuperados' as const,
      chaves_nfe: ['35260133000168000109550010000048121098765432'],
      identificador_processador: 'RECICLADOR_URBANO_SP',
    }

    const hash1 = await calcularHashCanonicalLastro(dadosLote)
    const hash2 = await calcularHashCanonicalLastro(dadosLote)

    expect(hash1).toBeDefined()
    expect(hash1.length).toBe(64)
    expect(hash1).toBe(hash2)

    // Modificação em qualquer teor ou chave deve alterar o hash
    const hashModificado = await calcularHashCanonicalLastro({
      ...dadosLote,
      teor_terras_raras_kg: 72.6,
    })
    expect(hashModificado).not.toBe(hash1)
  })

  it('contém aviso legal vinculante sobre infraestrutura probatória e vedação de crédito de carbono', () => {
    expect(AVISO_LEGAL_LASTRO).toContain('INFRAESTRUTURA PROBATÓRIA')
    expect(AVISO_LEGAL_LASTRO).toContain('NÃO constitui crédito de carbono')
    expect(AVISO_LEGAL_LASTRO).toContain('refinarias/indústrias compradoras de materiais críticos')
    expect(AVISO_LEGAL_LASTRO).toContain('parceiro metodológico a ser contratado')
  })
})
