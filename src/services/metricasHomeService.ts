import pb from '@/lib/pocketbase/client'

export interface NumerosVerificaveisData {
  selosEmitidos: number
  lastrosEmitidos: number
  manifestosSinir: number
  pecasRastreadas: number
  consultasDpp: number
  carregando: boolean
  erro: boolean
}

/**
 * Consulta contagens REAIS agregadas diretamente do backend PocketBase.
 * Sem dados fictícios em nenhuma hipótese.
 */
export async function obterNumerosVerificaveis(): Promise<NumerosVerificaveisData> {
  try {
    const [selosRes, lastrosRes, manifestosRes, pecasRes, consultasRes] = await Promise.allSettled([
      // 1. Selos emitidos (ativos/emitidos)
      pb.collection('selos').getList(1, 1, { fields: 'id' }),
      // 2. Documentos de lastro de circularidade
      pb.collection('lastro_circularidade').getList(1, 1, { fields: 'id' }),
      // 3. Manifestos MTR-SINIR registrados
      pb.collection('ccrlr_manifestos_sinir').getList(1, 1, { fields: 'id' }),
      // 4. Peças rastreadas (cdv_pecas)
      pb.collection('cdv_pecas').getList(1, 1, { fields: 'id' }),
      // 5. Consultas de verificação (dpp_consultas)
      pb.collection('dpp_consultas').getList(1, 1, { fields: 'id' }),
    ])

    const selosEmitidos = selosRes.status === 'fulfilled' ? selosRes.value.totalItems : 0
    const lastrosEmitidos = lastrosRes.status === 'fulfilled' ? lastrosRes.value.totalItems : 0
    const manifestosSinir =
      manifestosRes.status === 'fulfilled' ? manifestosRes.value.totalItems : 0
    const pecasRastreadas = pecasRes.status === 'fulfilled' ? pecasRes.value.totalItems : 0
    const consultasDpp = consultasRes.status === 'fulfilled' ? consultasRes.value.totalItems : 0

    return {
      selosEmitidos,
      lastrosEmitidos,
      manifestosSinir,
      pecasRastreadas,
      consultasDpp,
      carregando: false,
      erro: false,
    }
  } catch (err) {
    console.error('Erro ao buscar contagens reais do backend:', err)
    return {
      selosEmitidos: 0,
      lastrosEmitidos: 0,
      manifestosSinir: 0,
      pecasRastreadas: 0,
      consultasDpp: 0,
      carregando: false,
      erro: true,
    }
  }
}
