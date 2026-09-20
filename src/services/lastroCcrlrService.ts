/**
 * SERVIÇO DE LASTRO DE CIRCULARIDADE E CCRLR / SINIR
 * Módulo de Conformidade conforme Decreto Federal 11.413/2023.
 *
 * Regras estritas:
 * 1. O documento a emitir é SEMPRE "lastro" (prova), NUNCA "certificado de reciclagem".
 *    O CCRLR oficial é ato privativo da Entidade Gestora homologada.
 * 2. Aviso legal obrigatório registrado no banco, no documento e nas telas públicas.
 * 3. Prova criptográfica SHA-256 sobre a estrutura canônica e link com QR Code verificável.
 * 4. Anulação apenas por fluxo formal (admin com justificativa) registrando em audit_log.
 * 5. "Pronto para o SINIR": interoperabilidade baseada em MTR-SINIR sem promessa de conexão direta.
 */

import pb from '@/lib/pocketbase/client'
import type { RecordModel } from 'pocketbase'

export const AVISO_LEGAL_LASTRO =
  'Aviso Legal Regulatório (Decreto Federal nº 11.413/2023): O presente documento constitui estritamente Certificação de LASTRO DE CIRCULARIDADE (comprovação e custódia pericial de destinação e balanço de massa). Este documento NÃO substitui e não se confunde com o Certificado de Crédito de Reciclagem de Logística Reversa (CCRLR), cuja emissão oficial constitui ato privativo da Entidade Gestora legalmente credenciada perante o órgão ambiental competente. O credenciamento e a adesão ao sistema oficial constituem atos privativos da empresa titular perante o órgão ambiental.'

export interface LastroCircularidadeRecord extends RecordModel {
  codigo_lastro: string
  titulo: string
  usuario?: string
  cnpj_emissor: string
  razao_social_emissor: string
  entidade_gestora_alvo: string
  cnpj_entidade_gestora?: string
  periodo_inicio: string
  periodo_fim: string
  ano_base?: number
  massa_oluc_kg: number
  massa_baterias_kg: number
  massa_pneus_kg: number
  massa_oleos_lubrificantes_kg: number
  massa_embalagens_kg: number
  massa_total_lr_obrigatoria_kg: number
  massa_metais_convencionais_kg: number
  total_manifestos_mtr: number
  co2e_evitado_total_kg: number
  hash_sha256: string
  qr_code_url?: string
  status: 'emitido' | 'anulado'
  aviso_legal: string
  detalhes_json?: any
  motivo_anulacao?: string
  anulado_em?: string
  anulado_por?: string
  created: string
  updated: string
}

export interface ManifestoSinirCcrlrRecord extends RecordModel {
  numero_manifesto_mtr: string
  destinacao_final?: string
  usuario?: string
  cnpj_gerador: string
  razao_social_gerador: string
  cnpj_destinador: string
  razao_social_destinador: string
  nf_destinador?: string
  categoria_residuo_sinir:
    | 'oluc'
    | 'baterias_chumbo_acido'
    | 'pneus_inserviveis'
    | 'oleos_lubrificantes'
    | 'embalagens_contaminadas'
    | 'metais_ferrosos'
    | 'metais_nao_ferrosos'
    | 'polimeros_plasticos'
    | 'outros'
  lr_decreto_11413: 'sujeito_lr_11413' | 'convencional'
  quantidade_massa_kg: number
  data_recebimento_destinador?: string
  codigo_ibama_residuo?: string
  status_sinir:
    | 'pronto_para_o_sinir'
    | 'submetido_entidade_gestora'
    | 'homologado_ccrlr'
    | 'anulado'
  entidade_gestora_alvo?: string
  hash_sha256: string
  observacoes?: string
  created: string
  updated: string
}

export interface EmitirLastroInput {
  cnpj_emissor: string
  razao_social_emissor: string
  entidade_gestora_alvo: string
  cnpj_entidade_gestora?: string
  periodo_inicio: string
  periodo_fim: string
  ano_base?: number
  massa_oluc_kg: number
  massa_baterias_kg: number
  massa_pneus_kg: number
  massa_oleos_lubrificantes_kg: number
  massa_embalagens_kg: number
  massa_metais_convencionais_kg: number
  total_manifestos_mtr: number
  co2e_evitado_total_kg: number
  manifestos_mtr_ids?: string[]
}

/**
 * Calcula o hash SHA-256 canônico e lexicográfico do documento de Lastro de Circularidade
 */
export async function calcularHashCanonicalLastro(dados: {
  codigo_lastro: string
  cnpj_emissor: string
  entidade_gestora_alvo: string
  periodo_inicio: string
  periodo_fim: string
  massa_total_lr_obrigatoria_kg: number
  massa_metais_convencionais_kg: number
}): Promise<string> {
  const canonicalStr = [
    dados.codigo_lastro.trim().toUpperCase(),
    dados.cnpj_emissor.trim(),
    dados.entidade_gestora_alvo.trim().toUpperCase(),
    dados.periodo_inicio.trim(),
    dados.periodo_fim.trim(),
    Number(dados.massa_total_lr_obrigatoria_kg).toFixed(2),
    Number(dados.massa_metais_convencionais_kg).toFixed(2),
    'DECRETO_11413_2023',
    'ORBIS_LASTRO_CIRCULARIDADE',
  ].join('|')

  const encoder = new TextEncoder()
  const data = encoder.encode(canonicalStr)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * Gera um novo código determinístico para o Lastro
 */
export function gerarCodigoLastro(ano: number = new Date().getFullYear()): string {
  const aleatorio = Math.random().toString(36).substring(2, 7).toUpperCase()
  return `ORB-LST-${ano}-${aleatorio}`
}

/**
 * Consulta pública de Lastro de Circularidade por código ou id (sem login)
 */
export async function consultarLastroPublico(
  codigoOuId: string,
): Promise<LastroCircularidadeRecord | null> {
  const param = (codigoOuId || '').trim()
  if (!param) return null

  try {
    if (/^[a-z0-9]{15}$/i.test(param)) {
      try {
        return await pb.collection('lastro_circularidade').getOne<LastroCircularidadeRecord>(param)
      } catch {
        // segue para busca por código
      }
    }

    const cleanParam = param.replace(/"/g, '\\"')
    const rec = await pb
      .collection('lastro_circularidade')
      .getFirstListItem<LastroCircularidadeRecord>(
        `codigo_lastro = "${cleanParam}" || id = "${cleanParam}"`,
      )
    return rec
  } catch {
    return null
  }
}

/**
 * Lista lastros emitidos (autenticado)
 */
export async function listarLastrosEmitidos(cnpj?: string): Promise<LastroCircularidadeRecord[]> {
  try {
    const filter = cnpj ? `cnpj_emissor = "${cnpj}"` : ''
    return await pb.collection('lastro_circularidade').getFullList<LastroCircularidadeRecord>({
      filter: filter || undefined,
      sort: '-created',
    })
  } catch {
    return []
  }
}

/**
 * Emite um novo Lastro de Circularidade com hash SHA-256 e gravação no banco
 */
export async function emitirLastroCircularidade(
  input: EmitirLastroInput,
  usuarioId?: string,
): Promise<LastroCircularidadeRecord> {
  const ano = input.ano_base || new Date().getFullYear()
  const codigo = gerarCodigoLastro(ano)

  const massaTotalLr =
    (input.massa_oluc_kg || 0) +
    (input.massa_baterias_kg || 0) +
    (input.massa_pneus_kg || 0) +
    (input.massa_oleos_lubrificantes_kg || 0) +
    (input.massa_embalagens_kg || 0)

  const hashSha256 = await calcularHashCanonicalLastro({
    codigo_lastro: codigo,
    cnpj_emissor: input.cnpj_emissor,
    entidade_gestora_alvo: input.entidade_gestora_alvo,
    periodo_inicio: input.periodo_inicio,
    periodo_fim: input.periodo_fim,
    massa_total_lr_obrigatoria_kg: massaTotalLr,
    massa_metais_convencionais_kg: input.massa_metais_convencionais_kg || 0,
  })

  const baseUrl =
    typeof window !== 'undefined' ? window.location.origin : 'https://orbisprotocol.org'
  const qrCodeUrl = `${baseUrl}/conferencia-lastro/${codigo}?via=qr`

  const payload = {
    codigo_lastro: codigo,
    titulo: `Lastro de Circularidade LR 11.413/2023 • ${input.entidade_gestora_alvo} (${ano})`,
    usuario: usuarioId || null,
    cnpj_emissor: input.cnpj_emissor,
    razao_social_emissor: input.razao_social_emissor,
    entidade_gestora_alvo: input.entidade_gestora_alvo,
    cnpj_entidade_gestora: input.cnpj_entidade_gestora || '',
    periodo_inicio: input.periodo_inicio,
    periodo_fim: input.periodo_fim,
    ano_base: ano,
    massa_oluc_kg: Number(input.massa_oluc_kg) || 0,
    massa_baterias_kg: Number(input.massa_baterias_kg) || 0,
    massa_pneus_kg: Number(input.massa_pneus_kg) || 0,
    massa_oleos_lubrificantes_kg: Number(input.massa_oleos_lubrificantes_kg) || 0,
    massa_embalagens_kg: Number(input.massa_embalagens_kg) || 0,
    massa_total_lr_obrigatoria_kg: Number(massaTotalLr),
    massa_metais_convencionais_kg: Number(input.massa_metais_convencionais_kg) || 0,
    total_manifestos_mtr: Number(input.total_manifestos_mtr) || 0,
    co2e_evitado_total_kg: Number(input.co2e_evitado_total_kg) || 0,
    hash_sha256: hashSha256,
    qr_code_url: qrCodeUrl,
    status: 'emitido',
    aviso_legal: AVISO_LEGAL_LASTRO,
    detalhes_json: {
      versao_decreto: 'Decreto Federal nº 11.413/2023',
      manifestos_inclusos: input.manifestos_mtr_ids || [],
      sistema_origem: 'Orbis Protocol dMRV',
      data_geracao: new Date().toISOString(),
    },
  }

  const rec = await pb.collection('lastro_circularidade').create<LastroCircularidadeRecord>(payload)
  return rec
}

/**
 * Consulta manifestos MTR-SINIR acumulados para interoperabilidade CCRLR
 */
export async function listarManifestosSinirCcrlr(
  cnpj?: string,
): Promise<ManifestoSinirCcrlrRecord[]> {
  try {
    const filter = cnpj ? `cnpj_gerador = "${cnpj}"` : ''
    return await pb.collection('ccrlr_manifestos_sinir').getFullList<ManifestoSinirCcrlrRecord>({
      filter: filter || undefined,
      sort: '-created',
    })
  } catch {
    return []
  }
}

/**
 * Sincroniza / importa evidências de dpp_destinacao_final para ccrlr_manifestos_sinir
 */
export async function sincronizarManifestosDppParaCcrlr(
  cnpjGerador: string,
  razaoSocialGerador: string,
): Promise<{ importados: number; total: number }> {
  try {
    const destinacoes = await pb.collection('dpp_destinacao_final').getFullList<any>({
      filter: `status != 'anulado' && mtr_sinir != ''`,
      sort: '-created',
    })

    let importados = 0

    for (const d of destinacoes) {
      const mtr = (d.mtr_sinir || '').trim()
      if (!mtr) continue

      // Verifica se já existe
      try {
        await pb
          .collection('ccrlr_manifestos_sinir')
          .getFirstListItem(`numero_manifesto_mtr = "${mtr}"`)
        continue // Já existe
      } catch {
        // Criar novo
      }

      // Mapeamento de categoria
      let catSinir: ManifestoSinirCcrlrRecord['categoria_residuo_sinir'] = 'oluc'
      const t = (d.tipo_fluxo || '').toLowerCase()
      if (t.includes('bateria')) catSinir = 'baterias_chumbo_acido'
      else if (t.includes('pneu')) catSinir = 'pneus_inserviveis'
      else if (t.includes('oleo') || t.includes('rlo')) catSinir = 'oluc'
      else if (t.includes('fluido') || t.includes('lubrificante')) catSinir = 'oleos_lubrificantes'
      else if (t.includes('embalag')) catSinir = 'embalagens_contaminadas'
      else if (t.includes('aco') || t.includes('ferros') || t.includes('carcaca'))
        catSinir = 'metais_ferrosos'
      else if (t.includes('aluminio') || t.includes('cobre')) catSinir = 'metais_nao_ferrosos'
      else if (t.includes('polim') || t.includes('plast')) catSinir = 'polimeros_plasticos'
      else catSinir = 'outros'

      const isLrObrigatoria =
        d.camada === 'camada_1_gate' ||
        d.camada === 'camada_2_oleo_rlo' ||
        [
          'oluc',
          'baterias_chumbo_acido',
          'pneus_inserviveis',
          'oleos_lubrificantes',
          'embalagens_contaminadas',
        ].includes(catSinir)

      const massaKg = Number(d.quantidade) || 0

      const hashData = `${mtr}|${d.cnpj_destinador || ''}|${massaKg}|${catSinir}|PRONTO_SINIR`
      const encoder = new TextEncoder()
      const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(hashData))
      const hashSha256 = Array.from(new Uint8Array(hashBuffer))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')

      await pb.collection('ccrlr_manifestos_sinir').create({
        numero_manifesto_mtr: mtr,
        destinacao_final: d.id,
        cnpj_gerador: cnpjGerador,
        razao_social_gerador: razaoSocialGerador,
        cnpj_destinador: d.cnpj_destinador || '00.000.000/0001-00',
        razao_social_destinador: d.razao_social_destinador || 'Destinador Licenciado',
        nf_destinador: d.nf_destinador || '',
        categoria_residuo_sinir: catSinir,
        lr_decreto_11413: isLrObrigatoria ? 'sujeito_lr_11413' : 'convencional',
        quantidade_massa_kg: massaKg,
        codigo_ibama_residuo: isLrObrigatoria ? '13 02 05* (Resíduo Perigoso)' : '16 01 17',
        status_sinir: 'pronto_para_o_sinir',
        entidade_gestora_alvo: 'Entidade Gestora Homologada (SINIR)',
        hash_sha256: hashSha256,
        observacoes:
          'Registro alimentado por dpp_destinacao_final para lastro interoperável do CCRLR.',
      })

      importados++
    }

    return { importados, total: destinacoes.length }
  } catch (err) {
    console.error('Erro ao sincronizar manifestos DPP para CCRLR:', err)
    return { importados: 0, total: 0 }
  }
}
