/**
 * Serviço de Orbis Educação: MEI, Escolas e Atestado de Participação Orbis
 * Integrado com a infraestrutura de selos e hashes verificáveis da plataforma.
 */

import pb from '@/lib/pocketbase/client'

export interface DadosInscricaoMEI {
  nome: string
  cpf_ou_cnpj: string
  email: string
  whatsapp: string
  municipio: string
  uf: string
  patrocinador?: string
}

export interface RegistroAtestadoParticipacao {
  codigo_atestado: string
  hash_sha256: string
  nome_participante: string
  documento_identificador: string
  tipo_publico: 'mei' | 'escola_aluno' | 'escola_turma' | 'gestor_escolar'
  escola_nome?: string
  turma_grau?: string
  data_emissao: string
  status_verificacao: 'valido'
}

/**
 * Gera hash SHA-256 determinístico no navegador (Web Crypto API)
 */
export async function gerarHashSha256Texto(texto: string): Promise<string> {
  const enc = new TextEncoder()
  const data = enc.encode(texto)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Cria ou atualiza participante da trilha Orbis Educação MEI
 */
export async function registrarInscricaoMEI(dados: DadosInscricaoMEI) {
  const docLimpo = dados.cpf_ou_cnpj.replace(/\D/g, '')

  const payload = {
    tipo_publico: 'mei',
    nome_participante: dados.nome.trim(),
    documento_identificador: docLimpo,
    email: dados.email.trim().toLowerCase(),
    whatsapp: dados.whatsapp.trim(),
    municipio: dados.municipio.trim(),
    uf: dados.uf.trim().toUpperCase(),
    patrocinador_entidade: dados.patrocinador || 'Prefeitura / SEBRAE / Iniciativa Orbis B2B2C',
    progresso_licoes_concluidas: 0,
    total_licoes: 7,
    percentual_conclusao: 0,
    status_trilha: 'inscrito',
  }

  try {
    const existing = await pb
      .collection('educacao_participantes')
      .getFirstListItem(`documento_identificador='${docLimpo}'`)
    return await pb.collection('educacao_participantes').update(existing.id, payload)
  } catch {
    try {
      return await pb.collection('educacao_participantes').create(payload)
    } catch (e) {
      // Retorna objeto fallback funcional local se offline/unauthenticated
      return {
        id: `local_mei_${Date.now()}`,
        ...payload,
      }
    }
  }
}

/**
 * Emite o Atestado de Participação Orbis ao concluir a trilha
 * Reutiliza a infraestrutura de selos verificáveis da plataforma (coleção selos + hash sha256)
 */
export async function emitirAtestadoParticipacaoOrbis(params: {
  nome: string
  documento: string
  tipoPublico: 'mei' | 'escola_aluno' | 'escola_turma' | 'gestor_escolar'
  escolaNome?: string
  turmaGrau?: string
  patrocinador?: string
}): Promise<RegistroAtestadoParticipacao> {
  const timestamp = new Date().toISOString()
  const randomSuffix = Math.random().toString(36).substring(2, 7).toUpperCase()
  const codigoAtestado = `AT-ORB-EDU-${new Date().getFullYear()}-${randomSuffix}`

  // Texto canônico de lastro para hash
  const canonicalString = [
    'ORBIS_EDUCACAO_ATESTADO_PARTICIPACAO',
    codigoAtestado,
    params.nome.toUpperCase(),
    params.documento,
    params.tipoPublico,
    params.escolaNome || 'AUTONOMO_MEI',
    params.turmaGrau || 'GERAL',
    timestamp,
    'VALIDADE_DOC_VERIFICAVEL_HASH_SHA256',
  ].join('|')

  const hashSha256 = await gerarHashSha256Texto(canonicalString)

  // 1. Grava na coleção 'selos' da plataforma para permitir busca no /verificador
  try {
    await pb.collection('selos').create({
      codigo_selo: codigoAtestado,
      tipo_documento: 'atestado_participacao',
      tipo: 'atestado_participacao',
      categoria: 'educacional',
      modelo: 'atestado_participacao_orbis',
      status: 'ativo',
      hash_sha256: hashSha256,
      entidade_nome: params.nome,
      documento_referencia: params.documento,
      metadados: {
        tipoPublico: params.tipoPublico,
        escolaNome: params.escolaNome,
        turmaGrau: params.turmaGrau,
        patrocinador: params.patrocinador,
        dataEmissao: timestamp,
        avisoLegal:
          'Atestado de Participação Orbis emitido sem promessa de crédito de carbono ou benefício fiscal.',
      },
    })
  } catch (errSelos) {
    console.warn('[Orbis Educacao] Aviso ao persistir em selos:', errSelos)
  }

  // 2. Atualiza ou cria na coleção 'educacao_participantes'
  try {
    const docLimpo = params.documento.replace(/\D/g, '')
    const part = await pb
      .collection('educacao_participantes')
      .getFirstListItem(`documento_identificador='${docLimpo}'`)
    await pb.collection('educacao_participantes').update(part.id, {
      progresso_licoes_concluidas: 7,
      percentual_conclusao: 100,
      status_trilha: 'concluido',
      codigo_atestado: codigoAtestado,
      hash_sha256: hashSha256,
      data_conclusao: timestamp,
    })
  } catch (_) {
    // Continua mesmo se offline
  }

  return {
    codigo_atestado: codigoAtestado,
    hash_sha256: hashSha256,
    nome_participante: params.nome,
    documento_identificador: params.documento,
    tipo_publico: params.tipoPublico,
    escola_nome: params.escolaNome,
    turma_grau: params.turmaGrau,
    data_emissao: timestamp,
    status_verificacao: 'valido',
  }
}
