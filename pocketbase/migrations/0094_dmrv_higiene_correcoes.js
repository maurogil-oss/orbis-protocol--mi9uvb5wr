/**
 * MIGRATION 0094: CORREÇÕES DE HIGIENE dMRV (ENTREGA 1)
 *
 * 1. Adicionar valor 'concreto' ao SelectField 'categoria_material' em 'cdv_pecas'
 *    (valores permitidos passam a ser: ['aco', 'aluminio', 'cobre', 'polimeros', 'concreto', 'outros'])
 *    e migrar peças sintéticas de concreto gravadas anteriormente como 'outros' para 'concreto'.
 *
 * 2. Tornar 'veiculo_baixa_detran' em 'cdv_lotes' opcional (required: false).
 *    Sanitizar lotes sintéticos de segmentos NÃO-VEICULARES (origem='sintetico' e cdv_codigo != 'SANDBOX-AUTOMOTIVA'),
 *    limpando veiculo_chassi, veiculo_baixa_detran, veiculo_marca_modelo, veiculo_seguradora, veiculo_placa.
 *    (Manter veiculo_marca_modelo limpo apenas se puramente automotivo, ou manter o título da cadeia).
 *    Conforme especificação: "sanitizar registros sintéticos existentes de segmentos não-veiculares (campos veiculares → vazio)".
 *
 * 3. Deduplicar registros existentes em 'emissoes_inventario' (origem='sintetico' + cnpj + segmento):
 *    manter o registro mais recente de cada grupo e re-vincular os cdv_lotes (inventarioGhgId no payload_bruto_json) ao ID sobrevivente.
 */

migrate(
  (app) => {
    // -------------------------------------------------------------------------
    // PARTE 1: Atualizar schema de cdv_pecas.categoria_material para incluir 'concreto'
    // -------------------------------------------------------------------------
    try {
      const pecasCol = app.findCollectionByNameOrId('cdv_pecas')
      const catField = pecasCol.fields.getByName('categoria_material')
      if (catField) {
        catField.values = ['aco', 'aluminio', 'cobre', 'polimeros', 'concreto', 'outros']
        app.save(pecasCol)
      }
    } catch (err) {
      console.log('Erro ao atualizar categoria_material em cdv_pecas:', err)
      throw err
    }

    // -------------------------------------------------------------------------
    // PARTE 2: Tornar veiculo_baixa_detran opcional em cdv_lotes
    // -------------------------------------------------------------------------
    try {
      const lotesCol = app.findCollectionByNameOrId('cdv_lotes')
      const baixaField = lotesCol.fields.getByName('veiculo_baixa_detran')
      if (baixaField) {
        baixaField.required = false
        app.save(lotesCol)
      }
    } catch (err) {
      console.log('Erro ao atualizar veiculo_baixa_detran em cdv_lotes:', err)
      throw err
    }

    // -------------------------------------------------------------------------
    // PARTE 3: Atualizar peças de concreto existentes (de 'outros' para 'concreto')
    // -------------------------------------------------------------------------
    const nowIso = new Date().toISOString()
    try {
      app
        .db()
        .newQuery(
          `UPDATE cdv_pecas 
           SET categoria_material = 'concreto', updated = {:now}
           WHERE (
             categoria_material = 'outros' AND (
               LOWER(descricao_peca) LIKE '%cimento%' OR 
               LOWER(descricao_peca) LIKE '%concreto%' OR 
               LOWER(material_declarado) LIKE '%concreto%' OR
               LOWER(material_declarado) LIKE '%rcd%'
             )
           )`,
        )
        .bind({ now: nowIso })
        .execute()
    } catch (err) {
      console.log('Aviso ao migrar pecas de concreto:', err)
    }

    // -------------------------------------------------------------------------
    // PARTE 4: Sanitizar campos veiculares em lotes sintéticos não-veiculares
    // -------------------------------------------------------------------------
    try {
      // Segmento automotivo usa cdv_codigo = 'SANDBOX-AUTOMOTIVA'.
      // Para todos os outros lotes sintéticos, limpar os campos veiculares.
      app
        .db()
        .newQuery(
          `UPDATE cdv_lotes
           SET veiculo_chassi = '',
               veiculo_baixa_detran = '',
               veiculo_placa = '',
               veiculo_seguradora = '',
               updated = {:now}
           WHERE origem = 'sintetico' 
             AND cdv_codigo != 'SANDBOX-AUTOMOTIVA'`,
        )
        .bind({ now: nowIso })
        .execute()
    } catch (err) {
      console.log('Aviso ao sanitizar campos veiculares de lotes sintéticos:', err)
    }

    // -------------------------------------------------------------------------
    // PARTE 5: Deduplicação de emissoes_inventario (origem='sintetico' + cnpj + segmento)
    // -------------------------------------------------------------------------
    try {
      // Buscar todos os inventários sintéticos ordenados por created decrescente (mais recente primeiro)
      const inventarios = app.findRecordsByFilter(
        'emissoes_inventario',
        "origem = 'sintetico'",
        '-created',
        500,
        0,
      )

      const mapaSobreviventes = new Map() // chave -> idSobrevivente (o mais recente)
      const idsParaDeletar = []
      const remapeamento = new Map() // idDuplicata -> idSobrevivente

      for (let i = 0; i < inventarios.length; i++) {
        const inv = inventarios[i]
        const cnpj = inv.getString('cnpj') || ''
        let segmento = ''
        try {
          const raw = inv.get('laudo_detalhes_json')
          if (raw && typeof raw === 'object' && raw.segmento) {
            segmento = String(raw.segmento)
          } else if (raw && typeof raw === 'string') {
            const parsed = JSON.parse(raw)
            if (parsed.segmento) segmento = String(parsed.segmento)
          }
        } catch (_) {}

        const chave = `${cnpj}|${segmento}`
        if (!mapaSobreviventes.has(chave)) {
          // Primeiro encontrado é o mais recente por causa do sort '-created'
          mapaSobreviventes.set(chave, inv.id)
        } else {
          // Duplicata mais antiga encontrada
          const sobreviventeId = mapaSobreviventes.get(chave)
          idsParaDeletar.push(inv.id)
          remapeamento.set(inv.id, sobreviventeId)
        }
      }

      // Re-vincular os cdv_lotes que apontavam para inventários duplicados
      if (remapeamento.size > 0) {
        remapeamento.forEach((sobreviventeId, duplicadoId) => {
          // Atualiza JSON do payload_bruto_json onde o inventarioGhgId era o duplicadoId
          try {
            app
              .db()
              .newQuery(
                `UPDATE cdv_lotes
                 SET payload_bruto_json = replace(payload_bruto_json, {:dupId}, {:sobId}),
                     updated = {:now}
                 WHERE payload_bruto_json LIKE {:pattern}`,
              )
              .bind({
                dupId: duplicadoId,
                sobId: sobreviventeId,
                pattern: `%${duplicadoId}%`,
                now: nowIso,
              })
              .execute()
          } catch (updateErr) {
            console.log('Aviso ao re-vincular lote:', updateErr)
          }

          // Deletar o inventário duplicado
          try {
            app
              .db()
              .newQuery(`DELETE FROM emissoes_inventario WHERE id = {:dupId}`)
              .bind({ dupId: duplicadoId })
              .execute()
          } catch (delErr) {
            console.log('Aviso ao deletar inventário duplicado:', delErr)
          }
        })
      }
    } catch (err) {
      console.log('Erro na deduplicação de inventários sintéticos:', err)
      throw err
    }
  },
  (app) => {
    // Reverter valores do SelectField se necessário
    try {
      const pecasCol = app.findCollectionByNameOrId('cdv_pecas')
      const catField = pecasCol.fields.getByName('categoria_material')
      if (catField) {
        catField.values = ['aco', 'aluminio', 'cobre', 'polimeros', 'outros']
        app.save(pecasCol)
      }
    } catch (_) {}

    try {
      const lotesCol = app.findCollectionByNameOrId('cdv_lotes')
      const baixaField = lotesCol.fields.getByName('veiculo_baixa_detran')
      if (baixaField) {
        baixaField.required = true
        app.save(lotesCol)
      }
    } catch (_) {}
  },
)
