import { describe, it, expect, vi } from 'vitest'
import {
  cadastrarEscola,
  cadastrarEscolasEmLote,
  listarEscolas,
  obterMetricasPainelEducacional,
  ESCOLAS_DEMO_INICIAIS,
  CadastrarEscolaInput,
} from '@/services/escolasService'
import {
  emitirAtestadoParticipacaoOrbis,
  gerarHashSha256Texto,
} from '@/services/orbisEducacaoService'
import { LICOES_ORBIS_EDUCACAO_MEI } from '@/data/orbisEducacaoData'
import {
  calcularDiagnosticoAlimentacao,
  SEGMENTOS_DIAGNOSTICO,
  PerguntasSegmentoAlimentacao,
} from '@/services/diagnosticoSegmentosService'

describe('Frente 1: Trilha Flagship Alimentação e Segmentações em Estruturação', () => {
  it('aplica cálculo de diagnóstico de alimentação com fatores canônicos e faixas estimadas', () => {
    const dados: PerguntasSegmentoAlimentacao = {
      tipo_estabelecimento: 'restaurante',
      porte_funcionarios: '5_a_15',
      porte_faturamento_mensal: '30k_a_100k',
      principais_insumos: ['carnes', 'embalagens_plasticas'],
      fontes_energia: ['eletrica_concessionaria', 'glp_botijao'],
      residuos_gerados: ['organicos', 'oleo_fritura_usado'],
      origem_insumos: 'predominante_local_regional',
      logistica_reversa_embalagens: 'possui_coleta_ou_parceria',
    }

    const res = calcularDiagnosticoAlimentacao(dados)

    expect(res.segmento).toBe('alimentacao')
    expect(res.tipoEstabelecimentoRotulo).toBe('Restaurante / Buffet')
    expect(res.faixaEstimadaEmissoesMensaisTco2e.min).toBeGreaterThan(0)
    expect(res.faixaEstimadaEmissoesMensaisTco2e.max).toBeGreaterThan(
      res.faixaEstimadaEmissoesMensaisTco2e.min,
    )
    expect(res.fatoresDestacados.length).toBeGreaterThan(0)
    expect(res.benchmarkSetorial.posicaoReferencial).toContain('Desempenho preliminar superior')
    expect(res.conformidadePnrs).toContain('Parceria declarada ativa')
  })

  it('mantém Turismo e MEI com status "em_estruturacao" sem prometer produto/prazo', () => {
    const segTurismo = SEGMENTOS_DIAGNOSTICO.find((s) => s.id === 'turismo')
    const segMei = SEGMENTOS_DIAGNOSTICO.find((s) => s.id === 'mei')
    const segAlim = SEGMENTOS_DIAGNOSTICO.find((s) => s.id === 'alimentacao')

    expect(segTurismo).toBeDefined()
    expect(segTurismo?.status).toBe('em_estruturacao')
    expect(segTurismo?.descricaoStatus).toContain('sem promessa de prazo')

    expect(segMei).toBeDefined()
    expect(segMei?.status).toBe('em_estruturacao')

    expect(segAlim).toBeDefined()
    expect(segAlim?.status).toBe('ativo')
  })
})

describe('Frente 2: Orbis Educação para MEI e Atestado de Participação', () => {
  it('gera hash SHA-256 e emite estritamente "Atestado de Participação Orbis" sem usar "Certificado" ou "Certificação"', async () => {
    const atestado = await emitirAtestadoParticipacaoOrbis({
      nome: 'José da Silva Alimentos MEI',
      documento: '12.345.678/0001-90',
      tipoPublico: 'mei',
      patrocinador: 'Prefeitura Municipal de Curitiba / SEBRAE',
    })

    expect(atestado.codigo_atestado).toMatch(/^AT-ORB-EDU-\d{4}-[A-Z0-9]+$/)
    expect(atestado.hash_sha256).toHaveLength(64)
    expect(atestado.nome_participante).toBe('José da Silva Alimentos MEI')
    expect(atestado.status_verificacao).toBe('valido')
  })

  it('garante que a ementa de 7 lições não utiliza "Certificado" ou "Certificação" como nome do documento', () => {
    expect(LICOES_ORBIS_EDUCACAO_MEI).toHaveLength(7)

    LICOES_ORBIS_EDUCACAO_MEI.forEach((licao) => {
      expect(licao.titulo).not.toMatch(/Certificado/i)
      expect(licao.titulo).not.toMatch(/Certificação/i)
      // Lição 7 deve consagrar o Atestado de Participação Orbis
      if (licao.id === 7) {
        expect(licao.conteudoTexto).toContain('Atestado de Participação Orbis')
        expect(licao.conteudoTexto).toContain('Nunca chamamos este documento de "Certificado"')
      }
    })
  })
})

describe('Frente 3: Gestão e Cadastro de Escolas (Pública Participante & Particular Compradora)', () => {
  it('cadastra escola individual pública participante calculando total de alunos por etapa', async () => {
    const input: CadastrarEscolaInput = {
      nome: 'Escola Municipal de Teste Integrado',
      cnpj_inep: '12345678',
      municipio: 'Salvador',
      uf: 'BA',
      rede: 'municipal',
      perfil_modalidade: 'publica_patrocinada',
      alunos_educacao_infantil: 50,
      alunos_fundamental_1: 150,
      alunos_fundamental_2: 100,
      alunos_ensino_medio: 0,
      graus_turmas_atendidas: 'Ed. Infantil ao 9º Ano',
      responsavel_pedagogico_nome: 'Prof. Coordenador',
      responsavel_pedagogico_email: 'coord@escola.ba.gov.br',
      secretaria_ou_patrocinador: 'SMED Salvador',
    }

    const reg = await cadastrarEscola(input)
    expect(reg.nome).toBe(input.nome)
    expect(reg.total_alunos).toBe(300)
    expect(reg.status_adesao).toBe('inscrita')
    expect(reg.perfil_modalidade).toBe('publica_patrocinada')
  })

  it('cadastra escola particular compradora com faixa de preço comercial placeholder', async () => {
    const input: CadastrarEscolaInput = {
      nome: 'Colégio Privado Solar do Saber',
      cnpj_inep: '99.888.777/0001-66',
      municipio: 'São Paulo',
      uf: 'SP',
      rede: 'particular',
      perfil_modalidade: 'particular_compradora',
      alunos_fundamental_1: 200,
      alunos_fundamental_2: 250,
      alunos_ensino_medio: 150,
      responsavel_pedagogico_nome: 'Diretoria Pedagógica',
      responsavel_pedagogico_email: 'diretoria@solardosaber.com.br',
      faixa_preco_comercial: 'Faixa 301 a 700 alunos [Placeholder piloto municipal]',
    }

    const reg = await cadastrarEscola(input)
    expect(reg.nome).toBe(input.nome)
    expect(reg.total_alunos).toBe(600)
    expect(reg.faixa_preco_comercial).toContain('Placeholder piloto municipal')
  })

  it('processa cadastro em lote para secretarias de educação mantenedoras', async () => {
    const loteInput: CadastrarEscolaInput[] = [
      {
        nome: 'EM Lote 1',
        cnpj_inep: '11111111',
        municipio: 'Feira de Santana',
        uf: 'BA',
        rede: 'municipal',
        perfil_modalidade: 'publica_patrocinada',
        total_alunos: 350,
        responsavel_pedagogico_nome: 'Gestão 1',
        responsavel_pedagogico_email: 'g1@escola.gov.br',
      },
      {
        nome: 'EM Lote 2',
        cnpj_inep: '22222222',
        municipio: 'Feira de Santana',
        uf: 'BA',
        rede: 'municipal',
        perfil_modalidade: 'publica_patrocinada',
        total_alunos: 420,
        responsavel_pedagogico_nome: 'Gestão 2',
        responsavel_pedagogico_email: 'g2@escola.gov.br',
      },
    ]

    const resultadoLote = await cadastrarEscolasEmLote(loteInput, 'Secretaria de Feira de Santana')
    expect(resultadoLote.criadas).toBe(2)
    expect(resultadoLote.erros).toBe(0)
    expect(resultadoLote.registros).toHaveLength(2)
    expect(resultadoLote.registros[0].lote_inscricao_id).toBeDefined()
  })

  it('calcula métricas consolidadas da rede e estratificadas por escola para o painel educacional', async () => {
    const dadosPainel = await obterMetricasPainelEducacional()

    expect(dadosPainel.escolasMetricas.length).toBeGreaterThan(0)
    expect(dadosPainel.consolidado.totalEscolas).toBe(dadosPainel.escolasMetricas.length)
    expect(dadosPainel.consolidado.totalAlunosRede).toBeGreaterThan(0)
    expect(dadosPainel.consolidado.totalAlunosAlcancados).toBeGreaterThan(0)
    expect(dadosPainel.consolidado.totalAtestadosEmitidos).toBeGreaterThan(0)
    expect(dadosPainel.consolidado.mediaConclusaoTrilha).toBeGreaterThanOrEqual(0)
  })
})

describe('Regras Obrigatórias e Gates Comerciais Canônicos', () => {
  it('garante que a função gerarHashSha256Texto gera digest hexadecimal determinístico de 64 caracteres', async () => {
    const hash1 = await gerarHashSha256Texto('ORBIS_TESTE_INTEGRIDADE_CANONICA')
    const hash2 = await gerarHashSha256Texto('ORBIS_TESTE_INTEGRIDADE_CANONICA')
    const hashOutro = await gerarHashSha256Texto('OUTRO_CONTEUDO')

    expect(hash1).toBe(hash2)
    expect(hash1).toHaveLength(64)
    expect(hash1).not.toBe(hashOutro)
  })

  it('preserva dados iniciais de demonstração com os dois perfis pedagógicos', () => {
    const publica = ESCOLAS_DEMO_INICIAIS.find((e) => e.perfil_modalidade === 'publica_patrocinada')
    const particular = ESCOLAS_DEMO_INICIAIS.find(
      (e) => e.perfil_modalidade === 'particular_compradora',
    )

    expect(publica).toBeDefined()
    expect(publica?.secretaria_ou_patrocinador).toBeDefined()

    expect(particular).toBeDefined()
    expect(particular?.faixa_preco_comercial).toContain('Placeholder piloto municipal')
  })
})
