migrate(
  (app) => {
    // 1. Reconciliar os totais do lote demo Renault Clio (cartela 12401050711)
    // calculando a soma REAL das peças registradas em cdv_pecas para este lote.
    const demoCartela = '12401050711'
    const demoBaixa = 'PR-BX-2026-1240105'

    let demoLoteRecord
    try {
      demoLoteRecord = app.findFirstRecordByData('cdv_lotes', 'cartela_desmontagem', demoCartela)
    } catch (_) {
      try {
        demoLoteRecord = app.findFirstRecordByData('cdv_lotes', 'veiculo_baixa_detran', demoBaixa)
      } catch (_) {
        // Se o lote não existir nesta instância, não há o que reconciliar
        return
      }
    }

    if (!demoLoteRecord) return

    // Buscar todas as peças do lote demo
    const pecas = app.findRecordsByFilter('cdv_pecas', `lote = '${demoLoteRecord.id}'`, '', 100, 0)

    let somaPeso = 0
    let somaCo2e = 0

    for (const p of pecas) {
      somaPeso += Number(p.get('peso_kg')) || 0
      somaCo2e += Number(p.get('co2e_evitado_kg')) || 0
    }

    // Arredondamento padronizado em 2 casas decimais
    const pesoFinal = pecas.length > 0 ? Number(somaPeso.toFixed(2)) : 437.7
    const co2eFinal = pecas.length > 0 ? Number(somaCo2e.toFixed(2)) : 1584.81

    demoLoteRecord.set('total_pecas', pecas.length || 49)
    demoLoteRecord.set('total_peso_kg', pesoFinal)
    demoLoteRecord.set('total_co2e_evitado_kg', co2eFinal)

    // Atualizar payload_bruto_json com os totais reais reconciliados
    let payload = {}
    try {
      payload = demoLoteRecord.get('payload_bruto_json') || {}
      if (typeof payload === 'string') {
        payload = JSON.parse(payload)
      }
    } catch (_) {
      payload = {}
    }

    payload.total_peso_kg = pesoFinal
    payload.total_co2e_evitado_kg = co2eFinal
    payload.reconciliado_anexo1 = true
    demoLoteRecord.set('payload_bruto_json', payload)

    app.save(demoLoteRecord)
  },
  (app) => {
    // Reversão opcional para os valores anteriores da migração 0024
    const demoCartela = '12401050711'
    try {
      const lote = app.findFirstRecordByData('cdv_lotes', 'cartela_desmontagem', demoCartela)
      lote.set('total_peso_kg', 480.0)
      lote.set('total_co2e_evitado_kg', 2097.02)
      app.save(lote)
    } catch (_) {}
  },
)
