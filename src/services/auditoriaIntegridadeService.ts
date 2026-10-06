import pb from '@/lib/pocketbase/client'

export interface ItemAuditoria {
  id: string
  titulo: string
  descricao: string
  status: 'ok' | 'alerta'
  totalVerificados: number
  totalInconformidades: number
  registrosAfetados: {
    id: string
    identificador: string
    detalhes: string
    valorEsperado?: string | number
    valorEncontrado?: string | number
  }[]
}

export interface LaudoIntegridadeResultado {
  geradoEmIso: string
  auditorResponsavel: string
  totalVerificacoes: number
  totalAlertas: number
  itens: {
    reconciliacaoMatematicaLotes: ItemAuditoria
    reconciliacaoMatematicaInventarios: ItemAuditoria
    consistenciaFatorPecas: ItemAuditoria
    pecasRastreadasSemCo2e: ItemAuditoria
    integridadeProbatariaLotes: ItemAuditoria
    integridadeProbatariaSelos: ItemAuditoria
    higieneMateriaisCatalogados: ItemAuditoria
    higieneInventariosDuplicados: ItemAuditoria
    higieneCamposVeicularesNaoVeiculares: ItemAuditoria
    auditoriaFatoresLegadosCobre: ItemAuditoria
    auditoriaChavesAcessoDuplicadas: ItemAuditoria
    auditoriaLotesOrfaos: ItemAuditoria
  }
}

const TOLERANCIA_MATEMATICA = 0.05 // tolerância de arredondamento

export async function executarAuditoriaIntegridade(
  auditorEmail: string = 'auditoria.interna@orbis-protocol.com',
): Promise<LaudoIntegridadeResultado> {
  // 1. Busca em lote eficiente de todas as coleções necessárias
  const [lotes, pecas, inventarios, selos] = await Promise.all([
    pb.collection('cdv_lotes').getFullList({ sort: '-created' }),
    pb.collection('cdv_pecas').getFullList({ sort: '-created' }),
    pb.collection('emissoes_inventario').getFullList({ sort: '-created' }),
    pb.collection('selos').getFullList({ sort: '-created' }),
  ])

  // Agrupar peças por lote
  const pecasPorLote = new Map<string, any[]>()
  for (const peca of pecas) {
    const loteId = peca.lote
    if (!pecasPorLote.has(loteId)) {
      pecasPorLote.set(loteId, [])
    }
    pecasPorLote.get(loteId)!.push(peca)
  }

  // -------------------------------------------------------------
  // VERIFICAÇÃO 1.A: Reconciliação matemática dos Lotes
  // Para cada lote com peças, soma das peças = totais do lote (massa e co2e)
  // -------------------------------------------------------------
  const afetadosLotes: ItemAuditoria['registrosAfetados'] = []
  let lotesComPecasCount = 0

  for (const lote of lotes) {
    const pecasDoLote = pecasPorLote.get(lote.id)
    if (!pecasDoLote || pecasDoLote.length === 0) continue
    lotesComPecasCount++

    const somaMassa = pecasDoLote.reduce((acc, p) => acc + Number(p.peso_kg || 0), 0)
    const somaCo2e = pecasDoLote.reduce((acc, p) => acc + Number(p.co2e_evitado_kg || 0), 0)
    const loteMassa = Number(lote.total_peso_kg || 0)
    const loteCo2e = Number(lote.total_co2e_evitado_kg || 0)

    const difMassa = Math.abs(somaMassa - loteMassa)
    const difCo2e = Math.abs(somaCo2e - loteCo2e)

    if (difMassa > TOLERANCIA_MATEMATICA || difCo2e > TOLERANCIA_MATEMATICA) {
      afetadosLotes.push({
        id: lote.id,
        identificador: lote.cdv_codigo || lote.veiculo_baixa_detran || lote.id,
        detalhes: `Divergência: Massa (Lote: ${loteMassa.toFixed(2)} kg vs Peças: ${somaMassa.toFixed(2)} kg); CO₂e (Lote: ${loteCo2e.toFixed(2)} kg vs Peças: ${somaCo2e.toFixed(2)} kg)`,
        valorEsperado: `Massa: ${somaMassa.toFixed(2)}kg | CO₂e: ${somaCo2e.toFixed(2)}kg`,
        valorEncontrado: `Massa: ${loteMassa.toFixed(2)}kg | CO₂e: ${loteCo2e.toFixed(2)}kg`,
      })
    }
  }

  const reconciliacaoMatematicaLotes: ItemAuditoria = {
    id: 'rec_mat_lotes',
    titulo: 'Reconciliação Matemática: Peças vs Totais do Lote',
    descricao:
      'Garante que a soma de massa (kg) e CO₂e evitado (kg) de cada peça cadastrada corresponda perfeitamente aos totais consolidados no lote.',
    status: afetadosLotes.length === 0 ? 'ok' : 'alerta',
    totalVerificados: lotesComPecasCount,
    totalInconformidades: afetadosLotes.length,
    registrosAfetados: afetadosLotes,
  }

  // -------------------------------------------------------------
  // VERIFICAÇÃO 1.B: Reconciliação matemática dos Inventários
  // escopo1 + escopo2 + escopo3 = emissoes_totais_tco2e
  // -------------------------------------------------------------
  const afetadosInventarios: ItemAuditoria['registrosAfetados'] = []

  for (const inv of inventarios) {
    const e1 = Number(inv.escopo1_total_tco2e || 0)
    const e2 = Number(inv.escopo2_localizacao_tco2e ?? inv.escopo2_mercado_tco2e ?? 0)
    const e3 = Number(inv.escopo3_total_tco2e || 0)
    const somaEscopos = e1 + e2 + e3
    const totais = Number(inv.emissoes_totais_tco2e || 0)

    if (Math.abs(somaEscopos - totais) > TOLERANCIA_MATEMATICA) {
      afetadosInventarios.push({
        id: inv.id,
        identificador: `${inv.empresa_nome || 'Empresa'} (${inv.cnpj || 'Sem CNPJ'}) - Ano ${inv.ano_base || ''}`,
        detalhes: `Soma Escopos (${somaEscopos.toFixed(2)} tCO₂e) ≠ Total Registrado (${totais.toFixed(2)} tCO₂e)`,
        valorEsperado: `${somaEscopos.toFixed(2)} tCO₂e`,
        valorEncontrado: `${totais.toFixed(2)} tCO₂e`,
      })
    }
  }

  const reconciliacaoMatematicaInventarios: ItemAuditoria = {
    id: 'rec_mat_inventarios',
    titulo: 'Reconciliação GHG: Escopos 1, 2 e 3 vs Total de Emissões',
    descricao:
      'Verifica a identidade contábil do inventário de emissões (Escopo 1 + Escopo 2 + Escopo 3 = Total tCO₂e).',
    status: afetadosInventarios.length === 0 ? 'ok' : 'alerta',
    totalVerificados: inventarios.length,
    totalInconformidades: afetadosInventarios.length,
    registrosAfetados: afetadosInventarios,
  }

  // -------------------------------------------------------------
  // VERIFICAÇÃO 2.A: Consistência de fator das Peças
  // co2e_evitado_kg da peça = massa × fator_co2e_kg
  // -------------------------------------------------------------
  const afetadosFator: ItemAuditoria['registrosAfetados'] = []
  const pecasSemCo2e: ItemAuditoria['registrosAfetados'] = []
  let pecasComFatorCount = 0

  for (const peca of pecas) {
    const massa = Number(peca.peso_kg || 0)
    const fator = Number(peca.fator_co2e_kg || 0)
    const co2eGravado = Number(peca.co2e_evitado_kg || 0)

    if (fator === 0 && co2eGravado === 0) {
      pecasSemCo2e.push({
        id: peca.id,
        identificador: `${peca.sku_interno || peca.selo_dpp || peca.id} - ${peca.descricao_peca}`,
        detalhes: `Material: ${peca.material_declarado || 'N/D'} | Categoria: ${peca.categoria_material} | Massa: ${massa} kg`,
      })
      continue
    }

    pecasComFatorCount++
    const co2eEsperado = massa * fator
    if (Math.abs(co2eEsperado - co2eGravado) > TOLERANCIA_MATEMATICA) {
      afetadosFator.push({
        id: peca.id,
        identificador: `${peca.sku_interno || peca.selo_dpp || peca.id} - ${peca.descricao_peca}`,
        detalhes: `Massa ${massa} kg × Fator ${fator} = ${co2eEsperado.toFixed(3)} kg ≠ Gravado ${co2eGravado.toFixed(3)} kg`,
        valorEsperado: `${co2eEsperado.toFixed(3)} kg`,
        valorEncontrado: `${co2eGravado.toFixed(3)} kg`,
      })
    }
  }

  const consistenciaFatorPecas: ItemAuditoria = {
    id: 'consist_fator_pecas',
    titulo: 'Consistência do Fator de Emissão: co2e_evitado = massa × fator',
    descricao:
      'Garante a acurácia dos cálculos de carbono evitado em nível unitário para cada peça desmontada/rastreada.',
    status: afetadosFator.length === 0 ? 'ok' : 'alerta',
    totalVerificados: pecasComFatorCount,
    totalInconformidades: afetadosFator.length,
    registrosAfetados: afetadosFator,
  }

  const pecasRastreadasSemCo2e: ItemAuditoria = {
    id: 'pecas_sem_co2e_rastreadas',
    titulo: 'Rastreabilidade Especial: Peças Rastradas sem CO₂e Atribuído',
    descricao:
      'Materiais nobres/críticos em estruturação metodológica (ouro, prata, terras raras) ou itens sem emissão de crédito.',
    status: 'ok', // Informativo / Rastreabilidade
    totalVerificados: pecasSemCo2e.length,
    totalInconformidades: 0,
    registrosAfetados: pecasSemCo2e,
  }

  // -------------------------------------------------------------
  // VERIFICAÇÃO 3.A: Integridade Probatória dos Lotes
  // Presença de Hash SHA-256 e formato válido (64 caracteres hex ou padrão estruturado)
  // -------------------------------------------------------------
  const afetadosHashLotes: ItemAuditoria['registrosAfetados'] = []

  for (const lote of lotes) {
    let hashEncontrado = ''
    try {
      if (lote.payload_bruto_json) {
        const p =
          typeof lote.payload_bruto_json === 'string'
            ? JSON.parse(lote.payload_bruto_json)
            : lote.payload_bruto_json
        if (p?.hashSha256) hashEncontrado = String(p.hashSha256)
      }
    } catch {
      /* ignore */
    }

    if (!hashEncontrado) {
      // Verificar se as peças desse lote têm hash SHA-256
      const pecasDoLote = pecasPorLote.get(lote.id) || []
      const pecaComHash = pecasDoLote.find((p) => p.hash_sha256 && p.hash_sha256.length >= 32)
      if (pecaComHash) hashEncontrado = pecaComHash.hash_sha256
    }

    const isValido =
      hashEncontrado.length === 64 ||
      (hashEncontrado.startsWith('ORB-') && hashEncontrado.length >= 16)

    if (!hashEncontrado || !isValido) {
      afetadosHashLotes.push({
        id: lote.id,
        identificador: lote.cdv_codigo || lote.id,
        detalhes: hashEncontrado
          ? `Hash em formato não canônico: "${hashEncontrado}"`
          : 'Lote sem nenhum hash criptográfico registrado',
        valorEsperado: 'Hash SHA-256 hex de 64 caracteres ou padrão canônico ORB',
        valorEncontrado: hashEncontrado || '(ausente)',
      })
    }
  }

  const integridadeProbatariaLotes: ItemAuditoria = {
    id: 'integ_hash_lotes',
    titulo: 'Integridade Probatória: Lotes com Hash Criptográfico Válido',
    descricao:
      'Garante que todo lote possua evidência criptográfica indelével (SHA-256 ou carimbo canônico) para auditoria pericial.',
    status: afetadosHashLotes.length === 0 ? 'ok' : 'alerta',
    totalVerificados: lotes.length,
    totalInconformidades: afetadosHashLotes.length,
    registrosAfetados: afetadosHashLotes,
  }

  // -------------------------------------------------------------
  // VERIFICAÇÃO 3.B: Integridade Probatória dos Selos
  // Selos com hash_integridade presente e válido
  // -------------------------------------------------------------
  const afetadosSelos: ItemAuditoria['registrosAfetados'] = []

  for (const selo of selos) {
    const hash = (selo.hash_integridade || '').trim()
    const isValido = hash.length >= 32

    if (!hash || !isValido) {
      afetadosSelos.push({
        id: selo.id,
        identificador: `${selo.codigo_selo} - ${selo.empresa}`,
        detalhes: hash ? `Hash incompleto (${hash.length} chars)` : 'Selo sem hash_integridade',
        valorEsperado: 'Hash SHA-256 de 64 caracteres hex',
        valorEncontrado: hash || '(vazio)',
      })
    }
  }

  const integridadeProbatariaSelos: ItemAuditoria = {
    id: 'integ_selos_hash',
    titulo: 'Integridade dos Selos Emitidos: Hash Criptográfico Presente',
    descricao:
      'Confere a custódia pericial dos selos da plataforma vinculados a atestados de conformidade.',
    status: afetadosSelos.length === 0 ? 'ok' : 'alerta',
    totalVerificados: selos.length,
    totalInconformidades: afetadosSelos.length,
    registrosAfetados: afetadosSelos,
  }

  // -------------------------------------------------------------
  // VERIFICAÇÃO 4.A: Higiene - Peças com 'outros' que deveriam ter material catalogado
  // (ex: concreto, aco, cobre, etc)
  // -------------------------------------------------------------
  const afetadosPecasOutros: ItemAuditoria['registrosAfetados'] = []

  for (const peca of pecas) {
    if (peca.categoria_material === 'outros') {
      const desc = `${peca.descricao_peca || ''} ${peca.material_declarado || ''}`.toLowerCase()
      let materialCatalogado = ''

      if (desc.includes('concreto') || desc.includes('rcd') || desc.includes('cimento')) {
        materialCatalogado = 'concreto'
      } else if (desc.includes('aço') || desc.includes('aco')) {
        materialCatalogado = 'aco'
      } else if (desc.includes('aluminio') || desc.includes('alumínio')) {
        materialCatalogado = 'aluminio'
      } else if (desc.includes('cobre')) {
        materialCatalogado = 'cobre'
      } else if (
        desc.includes('polimero') ||
        desc.includes('polímero') ||
        desc.includes('plastico') ||
        desc.includes('plástico')
      ) {
        materialCatalogado = 'polimeros'
      }

      if (materialCatalogado) {
        afetadosPecasOutros.push({
          id: peca.id,
          identificador: `${peca.sku_interno || peca.selo_dpp || peca.id} - ${peca.descricao_peca}`,
          detalhes: `Peça gravada como 'outros', mas descrição indica material canônico: '${materialCatalogado}'`,
          valorEsperado: materialCatalogado,
          valorEncontrado: 'outros',
        })
      }
    }
  }

  const higieneMateriaisCatalogados: ItemAuditoria = {
    id: 'higiene_pecas_outros',
    titulo: "Higiene: Peças Gravadas como 'Outros' com Material Catalogado",
    descricao:
      "Detecta peças salvas com categoria genérica 'outros' cuja descrição textual pertence a uma categoria canônica do catálogo (ex: Concreto/RCD, Aço, Alumínio).",
    status: afetadosPecasOutros.length === 0 ? 'ok' : 'alerta',
    totalVerificados: pecas.length,
    totalInconformidades: afetadosPecasOutros.length,
    registrosAfetados: afetadosPecasOutros,
  }

  // -------------------------------------------------------------
  // VERIFICAÇÃO 4.B: Higiene - Inventários Duplicados
  // Mesmo cnpj + segmento + origem
  // -------------------------------------------------------------
  const mapaInventarios = new Map<string, any[]>()
  for (const inv of inventarios) {
    const cnpj = inv.cnpj || ''
    const origem = inv.origem || 'manual'
    let segmento = ''
    try {
      const raw =
        typeof inv.laudo_detalhes_json === 'string'
          ? JSON.parse(inv.laudo_detalhes_json)
          : inv.laudo_detalhes_json
      segmento = raw?.segmento || ''
    } catch {
      /* ignore */
    }
    const chave = `${cnpj}|${segmento}|${origem}`
    if (!mapaInventarios.has(chave)) mapaInventarios.set(chave, [])
    mapaInventarios.get(chave)!.push(inv)
  }

  const afetadosDuplicados: ItemAuditoria['registrosAfetados'] = []
  mapaInventarios.forEach((lista, chave) => {
    if (lista.length > 1) {
      const [cnpj, segmento, origem] = chave.split('|')
      afetadosDuplicados.push({
        id: lista.map((i) => i.id).join(', '),
        identificador: `CNPJ ${cnpj} • Segmento "${segmento || 'padrão'}" • Origem: ${origem}`,
        detalhes: `${lista.length} inventários duplicados encontrados para a mesma chave cadastral`,
        valorEsperado: 'Exatamente 1 inventário por CNPJ/Segmento/Origem',
        valorEncontrado: `${lista.length} registros`,
      })
    }
  })

  const higieneInventariosDuplicados: ItemAuditoria = {
    id: 'higiene_inv_duplicados',
    titulo: 'Higiene: Inventários GHG Duplicados (CNPJ + Segmento + Origem)',
    descricao:
      'Garante que não existam múltiplos inventários sintéticos ou duplicados para a mesma unidade e exercício fiscal.',
    status: afetadosDuplicados.length === 0 ? 'ok' : 'alerta',
    totalVerificados: inventarios.length,
    totalInconformidades: afetadosDuplicados.length,
    registrosAfetados: afetadosDuplicados,
  }

  // -------------------------------------------------------------
  // VERIFICAÇÃO 4.C: Higiene - Lotes Não-Veiculares com Campos Veiculares
  // -------------------------------------------------------------
  const afetadosVeicularesEmNaoVeiculares: ItemAuditoria['registrosAfetados'] = []

  for (const lote of lotes) {
    let segmento = ''
    try {
      if (lote.payload_bruto_json) {
        const p =
          typeof lote.payload_bruto_json === 'string'
            ? JSON.parse(lote.payload_bruto_json)
            : lote.payload_bruto_json
        segmento = p?.segmento || p?.protocoloSetorialSlug || ''
      }
    } catch {
      /* ignore */
    }

    const isAutomotiva =
      segmento === 'automotiva' ||
      (lote.cdv_codigo && lote.cdv_codigo.includes('AUTOMOTIVA')) ||
      (lote.origem !== 'sintetico' && lote.veiculo_baixa_detran)

    // Se é declaradamente não-veicular sintético
    if (lote.origem === 'sintetico' && !isAutomotiva) {
      const temChassi = Boolean(lote.veiculo_chassi && lote.veiculo_chassi.trim() !== '')
      const temBaixa = Boolean(lote.veiculo_baixa_detran && lote.veiculo_baixa_detran.trim() !== '')
      const temPlaca = Boolean(lote.veiculo_placa && lote.veiculo_placa.trim() !== '')

      if (temChassi || temBaixa || temPlaca) {
        afetadosVeicularesEmNaoVeiculares.push({
          id: lote.id,
          identificador: `${lote.cdv_codigo || lote.id} - ${lote.cdv_nome}`,
          detalhes: `Segmento não-veicular (${segmento || 'outro'}) com dados veiculares preenchidos: Chassi="${lote.veiculo_chassi || ''}", Baixa="${lote.veiculo_baixa_detran || ''}"`,
          valorEsperado: 'Campos veiculares vazios para segmentos industriais não-veiculares',
          valorEncontrado: `Chassi: ${lote.veiculo_chassi || '-'} | Baixa: ${lote.veiculo_baixa_detran || '-'}`,
        })
      }
    }
  }

  const higieneCamposVeicularesNaoVeiculares: ItemAuditoria = {
    id: 'higiene_campos_veiculares',
    titulo: 'Higiene: Segmentos Não-Veiculares com Campos Veiculares Preenchidos',
    descricao:
      'Garante que lotes de mineração urbana, construção civil, agro ou fármaco não tenham Chassi ou Baixa DETRAN fakes injetados.',
    status: afetadosVeicularesEmNaoVeiculares.length === 0 ? 'ok' : 'alerta',
    totalVerificados: lotes.length,
    totalInconformidades: afetadosVeicularesEmNaoVeiculares.length,
    registrosAfetados: afetadosVeicularesEmNaoVeiculares,
  }

  const todasVerificacoes = [
    reconciliacaoMatematicaLotes,
    reconciliacaoMatematicaInventarios,
    consistenciaFatorPecas,
    pecasRastreadasSemCo2e,
    integridadeProbatariaLotes,
    integridadeProbatariaSelos,
    higieneMateriaisCatalogados,
    higieneInventariosDuplicados,
    higieneCamposVeicularesNaoVeiculares,
  ]

  // -------------------------------------------------------------
  // VERIFICAÇÃO 5.A: Fatores Antigos / Legados (Ex: cobre 5,40 remanescente)
  // O fator canônico de cobre é 4,10 kgCO2e/kg (ICA 2024). Fator 5,40 é legado revogado.
  // -------------------------------------------------------------
  const afetadosFatoresLegados: ItemAuditoria['registrosAfetados'] = []
  let totalPecasCobreVerificadas = 0

  for (const peca of pecas) {
    if (peca.categoria_material === 'cobre') {
      totalPecasCobreVerificadas++
      const fator = Number(peca.fator_co2e_kg || 0)
      if (Math.abs(fator - 5.4) < 0.01) {
        afetadosFatoresLegados.push({
          id: peca.id,
          identificador: `${peca.selo_dpp || peca.sku_interno || peca.id} - ${peca.descricao_peca}`,
          detalhes: `Peça de cobre registrada com fator legado revogado 5,40 kgCO₂e/kg (lote: ${peca.lote})`,
          valorEsperado: '4,10 kgCO₂e/kg (ICA 2024 oficial)',
          valorEncontrado: `${fator.toFixed(2)} kgCO₂e/kg`,
        })
      }
    }
  }

  const auditoriaFatoresLegadosCobre: ItemAuditoria = {
    id: 'fator_legado_cobre_540',
    titulo: 'Auditoria de Fatores Oficiais: Fator de Cobre Legado 5,40 Remanescente',
    descricao:
      'Garante a transição pericial dos fatores de emissão. Detecta peças de cobre que ainda utilizam o fator revogado 5,40 em vez do fator canônico 4,10 kgCO₂e/kg (ICA 2024 LCI/LCA).',
    status: afetadosFatoresLegados.length === 0 ? 'ok' : 'alerta',
    totalVerificados: totalPecasCobreVerificadas,
    totalInconformidades: afetadosFatoresLegados.length,
    registrosAfetados: afetadosFatoresLegados,
  }

  // -------------------------------------------------------------
  // VERIFICAÇÃO 5.B: Duplicidade de Chaves de Acesso NF-e / CT-e
  // Identifica se a mesma chave de acesso fiscal de 44 dígitos foi usada em múltiplos lotes
  // -------------------------------------------------------------
  const mapaChavesLotes = new Map<string, any[]>()
  for (const lote of lotes) {
    let chave = ''
    try {
      if (lote.payload_bruto_json) {
        const p =
          typeof lote.payload_bruto_json === 'string'
            ? JSON.parse(lote.payload_bruto_json)
            : lote.payload_bruto_json
        chave = String(p?.chaveAcesso || p?.chave_acesso || '').trim()
      }
    } catch {
      /* ignore */
    }
    if (chave && chave.length === 44) {
      if (!mapaChavesLotes.has(chave)) mapaChavesLotes.set(chave, [])
      mapaChavesLotes.get(chave)!.push(lote)
    }
  }

  const afetadosChavesDuplicadas: ItemAuditoria['registrosAfetados'] = []
  let totalChavesVerificadas = 0
  mapaChavesLotes.forEach((lista, chave) => {
    totalChavesVerificadas++
    if (lista.length > 1) {
      afetadosChavesDuplicadas.push({
        id: lista.map((l) => l.id).join(', '),
        identificador: `Chave: ${chave}`,
        detalhes: `A mesma chave fiscal de 44 dígitos está vinculada a ${lista.length} lotes distintos: [${lista.map((l) => l.cdv_codigo || l.id).join(', ')}]`,
        valorEsperado: 'Exatamente 1 lote por chave fiscal (princípio da não-cumulatividade)',
        valorEncontrado: `${lista.length} lotes`,
      })
    }
  })

  const auditoriaChavesAcessoDuplicadas: ItemAuditoria = {
    id: 'chaves_acesso_duplicadas',
    titulo: 'Auditoria de Chaves Fiscais: Duplicidade de Chave de Acesso (44 dígitos)',
    descricao:
      'Garante que nenhuma nota fiscal ou CT-e seja contabilizada em mais de um lote, evitando risco de dupla contagem de lastro.',
    status: afetadosChavesDuplicadas.length === 0 ? 'ok' : 'alerta',
    totalVerificados: totalChavesVerificadas,
    totalInconformidades: afetadosChavesDuplicadas.length,
    registrosAfetados: afetadosChavesDuplicadas,
  }

  // -------------------------------------------------------------
  // VERIFICAÇÃO 5.C: Lotes Órfãos (Lotes sem peças e Peças sem lote)
  // -------------------------------------------------------------
  const lotesIdsSet = new Set(lotes.map((l) => l.id))
  const afetadosOrfaos: ItemAuditoria['registrosAfetados'] = []

  // Peças sem lote válido no banco
  for (const peca of pecas) {
    if (!peca.lote || !lotesIdsSet.has(peca.lote)) {
      afetadosOrfaos.push({
        id: peca.id,
        identificador: `Peça: ${peca.selo_dpp || peca.sku_interno || peca.id}`,
        detalhes: `Peça aponta para lote_id inexistente ou nulo: "${peca.lote || '(vazio)'}"`,
        valorEsperado: 'Lote existente na coleção cdv_lotes',
        valorEncontrado: peca.lote || '(vazio)',
      })
    }
  }

  // Lotes que deveriam ter peças mas não têm nenhuma associada (excluindo lotes anulados)
  for (const lote of lotes) {
    const pecasDoLote = pecasPorLote.get(lote.id) || []
    if (pecasDoLote.length === 0 && lote.status !== 'anulado') {
      afetadosOrfaos.push({
        id: lote.id,
        identificador: `Lote: ${lote.cdv_codigo || lote.id} - ${lote.cdv_nome}`,
        detalhes: `Lote com status "${lote.status}" não possui nenhuma peça vinculada em cdv_pecas`,
        valorEsperado: 'Ao menos 1 peça vinculada',
        valorEncontrado: '0 peças',
      })
    }
  }

  const auditoriaLotesOrfaos: ItemAuditoria = {
    id: 'lotes_e_pecas_orfaos',
    titulo: 'Integridade Relacional: Lotes e Peças Órfãos',
    descricao:
      'Identifica peças cujo lote não existe no banco e lotes ativos sem peças cadastradas na esteira dMRV.',
    status: afetadosOrfaos.length === 0 ? 'ok' : 'alerta',
    totalVerificados: lotes.length + pecas.length,
    totalInconformidades: afetadosOrfaos.length,
    registrosAfetados: afetadosOrfaos,
  }

  todasVerificacoes.push(
    auditoriaFatoresLegadosCobre,
    auditoriaChavesAcessoDuplicadas,
    auditoriaLotesOrfaos,
  )

  const totalAlertas = todasVerificacoes.filter((v) => v.status === 'alerta').length

  return {
    geradoEmIso: new Date().toISOString(),
    auditorResponsavel: auditorEmail,
    totalVerificacoes: todasVerificacoes.length,
    totalAlertas,
    itens: {
      reconciliacaoMatematicaLotes,
      reconciliacaoMatematicaInventarios,
      consistenciaFatorPecas,
      pecasRastreadasSemCo2e,
      integridadeProbatariaLotes,
      integridadeProbatariaSelos,
      higieneMateriaisCatalogados,
      higieneInventariosDuplicados,
      higieneCamposVeicularesNaoVeiculares,
      auditoriaFatoresLegadosCobre,
      auditoriaChavesAcessoDuplicadas,
      auditoriaLotesOrfaos,
    },
  }
}

export function imprimirLaudoIntegridadeHtml(resultado: LaudoIntegridadeResultado) {
  const dataFormatada = new Date(resultado.geradoEmIso).toLocaleString('pt-BR', {
    dateStyle: 'full',
    timeStyle: 'medium',
  })

  const listaItens = Object.values(resultado.itens)

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <title>Laudo de Auditoria de Integridade e Higiene dMRV - Orbis Protocol</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 15mm 15mm 20mm 15mm;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0F172A;
      background: #FFFFFF;
      margin: 0;
      padding: 20px;
      font-size: 11pt;
      line-height: 1.5;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .header {
      border-bottom: 2px solid #0F172A;
      padding-bottom: 12px;
      margin-bottom: 20px;
    }
    .brand {
      font-size: 18pt;
      font-weight: 900;
      letter-spacing: -0.5px;
      color: #0F172A;
    }
    .brand-tag {
      font-size: 9pt;
      font-weight: 700;
      color: #059669;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .title {
      font-size: 15pt;
      font-weight: 800;
      margin-top: 10px;
      color: #0F172A;
    }
    .meta-box {
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-radius: 6px;
      padding: 12px;
      margin-bottom: 20px;
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 8px;
      font-size: 9.5pt;
    }
    .meta-box div span {
      color: #64748B;
      font-weight: 600;
    }
    .summary-cards {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      margin-bottom: 24px;
    }
    .card {
      border: 1px solid #E2E8F0;
      border-radius: 6px;
      padding: 12px;
      background: #FFFFFF;
    }
    .card-val {
      font-size: 18pt;
      font-weight: 900;
    }
    .card-lbl {
      font-size: 8.5pt;
      color: #64748B;
      text-transform: uppercase;
      font-weight: 700;
    }
    .badge-ok {
      background: #DCFCE7;
      color: #166534;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 8.5pt;
      font-weight: 700;
      display: inline-block;
    }
    .badge-alerta {
      background: #FEF3C7;
      color: #92400E;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 8.5pt;
      font-weight: 700;
      display: inline-block;
    }
    .item-section {
      margin-bottom: 16px;
      border: 1px solid #E2E8F0;
      border-radius: 6px;
      padding: 12px;
      page-break-inside: avoid;
    }
    .item-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 6px;
    }
    .item-title {
      font-size: 11pt;
      font-weight: 700;
      color: #0F172A;
    }
    .item-desc {
      font-size: 9pt;
      color: #475569;
      margin-bottom: 8px;
    }
    .inconf-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 8.5pt;
      margin-top: 8px;
    }
    .inconf-table th, .inconf-table td {
      border: 1px solid #CBD5E1;
      padding: 6px;
      text-align: left;
    }
    .inconf-table th {
      background: #F1F5F9;
      font-weight: 700;
      color: #334155;
    }
    .footer {
      margin-top: 30px;
      padding-top: 14px;
      border-top: 1px solid #CBD5E1;
      font-size: 8.5pt;
      color: #64748B;
      text-align: center;
      line-height: 1.4;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="brand-tag">Orbis Protocol • Governança & dMRV</div>
    <div class="brand">LAUDO PERICIAL DE AUDITORIA DE INTEGRIDADE</div>
    <div class="title">Conformidade Contábil, Criptográfica e Higiene de Dados dMRV</div>
  </div>

  <div class="meta-box">
    <div><span>Data/Hora da Execução:</span> ${dataFormatada}</div>
    <div><span>Auditor Operador:</span> ${resultado.auditorResponsavel}</div>
    <div><span>Ambiente:</span> Produção / Banco Conectado Orbis</div>
    <div><span>Status Consolidado:</span> ${resultado.totalAlertas === 0 ? 'CONFORME (Nenhuma Inconformidade)' : `${resultado.totalAlertas} ALERTA(S) REQUERENDO ATENÇÃO`}</div>
  </div>

  <div class="summary-cards">
    <div class="card">
      <div class="card-val">${resultado.totalVerificacoes}</div>
      <div class="card-lbl">Testes de Consistência</div>
    </div>
    <div class="card">
      <div class="card-val" style="color: ${resultado.totalAlertas === 0 ? '#059669' : '#D97706'}">
        ${resultado.totalAlertas}
      </div>
      <div class="card-lbl">Apontamentos / Alertas</div>
    </div>
    <div class="card">
      <div class="card-val" style="color: #059669">
        ${resultado.totalVerificacoes - resultado.totalAlertas}
      </div>
      <div class="card-lbl">Verificações Conformes (OK)</div>
    </div>
  </div>

  <h3 style="font-size: 12pt; font-weight: 800; margin-bottom: 12px; color: #0F172A;">
    Detalhamento das Verificações Realizadas
  </h3>

  ${listaItens
    .map(
      (item) => `
    <div class="item-section">
      <div class="item-header">
        <span class="item-title">${item.titulo}</span>
        <span class="${item.status === 'ok' ? 'badge-ok' : 'badge-alerta'}">
          ${item.status === 'ok' ? 'OK (CONFORME)' : `ALERTA (${item.totalInconformidades} INCONFORMIDADES)`}
        </span>
      </div>
      <div class="item-desc">${item.descricao}</div>
      <div style="font-size: 8.5pt; color: #64748B;">
        Total de registros analisados: <strong>${item.totalVerificados}</strong> | Inconformidades: <strong>${item.totalInconformidades}</strong>
      </div>
      ${
        item.registrosAfetados.length > 0 && item.totalInconformidades > 0
          ? `
        <table class="inconf-table">
          <thead>
            <tr>
              <th>Identificador</th>
              <th>Detalhes da Divergência</th>
              <th>Esperado</th>
              <th>Encontrado</th>
            </tr>
          </thead>
          <tbody>
            ${item.registrosAfetados
              .slice(0, 10)
              .map(
                (r) => `
              <tr>
                <td><strong>${r.identificador}</strong></td>
                <td>${r.detalhes}</td>
                <td>${r.valorEsperado || '-'}</td>
                <td>${r.valorEncontrado || '-'}</td>
              </tr>
            `,
              )
              .join('')}
            ${item.registrosAfetados.length > 10 ? `<tr><td colspan="4" style="text-align: center; color: #64748B;">... e mais ${item.registrosAfetados.length - 10} registros inconformes listados no sistema.</td></tr>` : ''}
          </tbody>
        </table>
      `
          : ''
      }
    </div>
  `,
    )
    .join('')}

  <div class="footer">
    <strong>AVISO LEGAL E DE LIMITAÇÃO DE ESCOPO:</strong><br />
    Este laudo constitui procedimento pericial de auditoria interna da plataforma Orbis Protocol para monitoramento contínuo da consistência matemática, criptográfica e higiênica dos dados dMRV.<br />
    Documento emitido internamente pela governança do sistema — sem validade de certificação externa independente de terceira parte (VVB/Auditor Externo).
  </div>
</body>
</html>`

  const printWindow = window.open('', '_blank', 'width=950,height=1000')
  if (!printWindow) {
    alert(
      'Bloqueador de pop-ups ativo. Permita a abertura de novas janelas para visualizar e imprimir o laudo em PDF.',
    )
    return
  }

  printWindow.document.open()
  printWindow.document.write(html)
  printWindow.document.close()
  printWindow.focus()
  setTimeout(() => {
    printWindow.print()
  }, 400)
}
