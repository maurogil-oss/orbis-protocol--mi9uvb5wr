/**
 * MIGRATION 0096: TORNAR veiculo_marca_modelo OPCIONAL EM cdv_lotes
 *
 * Segmentos não-automotivos (ex.: Agronegócio, Concreto, Energia, etc.) não possuem
 * veículo/marca/modelo e o pipeline de ingestão envia string vazia '' ou omite o campo.
 * Como veiculo_marca_modelo estava configurado como required=true desde a criação da
 * coleção (0012_cdv_lotes_and_pecas.js), tentativas de gravação de lotes sintéticos
 * para esses segmentos falhavam com HTTP 400 "Failed to create record."
 *
 * Esta migração:
 * 1. Altera a definição do campo veiculo_marca_modelo na coleção cdv_lotes para required = false.
 * 2. Mantém o campo existente (não remove), permitindo que lotes automotivos continuem
 *    preenchendo-o normalmente.
 * 3. Sanitiza lotes sintéticos já existentes no banco de segmentos não-veiculares
 *    (origem='sintetico' e cdv_codigo != 'SANDBOX-AUTOMOTIVA'), garantindo veiculo_marca_modelo = ''
 *    e updated = datetime('now') via SQL direto para não acionar hooks colaterais.
 */

migrate(
  (app) => {
    // 1. Tornar veiculo_marca_modelo opcional (required: false) em cdv_lotes
    try {
      const lotesCol = app.findCollectionByNameOrId('cdv_lotes')
      const modeloField = lotesCol.fields.getByName('veiculo_marca_modelo')
      if (modeloField) {
        modeloField.required = false
        app.save(lotesCol)
      }
    } catch (err) {
      console.log('Erro ao atualizar veiculo_marca_modelo em cdv_lotes:', err)
      throw err
    }

    // 2. Sanitizar lotes sintéticos de segmentos não-automotivos já gravados
    const nowIso = new Date().toISOString()
    try {
      app
        .db()
        .newQuery(
          `UPDATE cdv_lotes
           SET veiculo_marca_modelo = '',
               updated = {:now}
           WHERE origem = 'sintetico'
             AND cdv_codigo != 'SANDBOX-AUTOMOTIVA'
             AND veiculo_marca_modelo != ''`,
        )
        .bind({ now: nowIso })
        .execute()
    } catch (err) {
      console.log(
        'Aviso ao sanitizar veiculo_marca_modelo em lotes sintéticos não-automotivos:',
        err,
      )
    }
  },
  (app) => {
    try {
      const lotesCol = app.findCollectionByNameOrId('cdv_lotes')
      const modeloField = lotesCol.fields.getByName('veiculo_marca_modelo')
      if (modeloField) {
        modeloField.required = true
        app.save(lotesCol)
      }
    } catch (_) {}
  },
)
