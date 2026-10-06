/**
 * Hook onRecordAfterCreateSuccess para a coleção cdv_lotes.
 * Ao criar um novo lote CDV:
 * - Auto-preenche as 77 linhas em cdv_pecas a partir do catálogo oficial cdv_pecas_catalogo;
 * - Inicializa cada peça com situacao_checklist='nao_desmontada';
 * - Não duplica peças já cadastradas ou vindas no payload do lote;
 * - Não altera lotes já existentes (só dispara em novos lotes criados com sucesso).
 *
 * NOTA: De acordo com a arquitetura do PocketBase JSVM, todo o código auxiliar deve ser inline.
 */

onRecordAfterCreateSuccess((e) => {
  try {
    const loteRec = e.record
    if (!loteRec || !loteRec.id) return

    // GUARDA DEFENSIVA: auto-preenchimento do catálogo CONTRAN/MOVER (77 peças)
    // destina-se EXCLUSIVAMENTE a lotes CDV automotivos reais.
    // Lotes sintéticos/sandbox (origem = 'sintetico' ou cdv_codigo iniciando com 'SANDBOX-')
    // e lotes de outros segmentos produtivos (Agro, Concreto, Energia, Química, etc.)
    // NÃO devem receber peças veiculares.
    // Critério defensivo:
    // 1. Pular imediatamente se origem for 'sintetico' ou is_demo for verdadeiro;
    // 2. Pular imediatamente se cdv_codigo iniciar por 'SANDBOX-';
    // 3. Pular imediatamente se não for lote veicular (exige chassi preenchido ou cdv_codigo iniciando com 'DETRAN').
    const origem = loteRec.getString('origem') || ''
    const isDemo = loteRec.getBool('is_demo')
    const cdvCodigoLote = loteRec.getString('cdv_codigo') || ''
    const chassiLote = loteRec.getString('veiculo_chassi') || ''

    if (origem === 'sintetico' || isDemo || cdvCodigoLote.toUpperCase().startsWith('SANDBOX-')) {
      return
    }

    const isLoteAutomotivoLegitimo =
      chassiLote.trim() !== '' || cdvCodigoLote.toUpperCase().startsWith('DETRAN')

    if (!isLoteAutomotivoLegitimo) {
      return
    }

    const app = e.app || $app
    const catalogoCol = app.findCollectionByNameOrId('cdv_pecas_catalogo')
    const pecasCol = app.findCollectionByNameOrId('cdv_pecas')

    // Carregar todas as 77 peças do catálogo ordenadas por número
    let itensCatalogo = []
    try {
      itensCatalogo = app.findRecordsByFilter('cdv_pecas_catalogo', '', 'numero', 100, 0)
    } catch (errCat) {
      console.log('[cdv_lote_autopreencher] Erro ao carregar catálogo:', errCat)
      return
    }

    if (!itensCatalogo || itensCatalogo.length === 0) {
      return
    }

    // Carregar peças que porventura já foram criadas para este lote
    let pecasExistentes = []
    try {
      pecasExistentes = app.findRecordsByFilter(
        'cdv_pecas',
        "lote = '" + loteRec.id + "'",
        '',
        200,
        0,
      )
    } catch (_) {
      pecasExistentes = []
    }

    // Indexar por catalogo_numero e por descrição normalizada para não duplicar
    const numerosExistentes = {}
    const descricoesExistentes = {}
    for (let p = 0; p < pecasExistentes.length; p++) {
      const recP = pecasExistentes[p]
      const num = recP.getInt('catalogo_numero')
      if (num && num > 0) {
        numerosExistentes[num] = true
      }
      const desc = (recP.getString('descricao_peca') || '').toLowerCase().trim()
      if (desc) {
        descricoesExistentes[desc] = true
      }
    }

    const cdvCodigo = loteRec.getString('cdv_codigo') || 'DETRAN-PR-CDV-0089'
    const cdvCnpj = loteRec.getString('cdv_cnpj') || ''
    const veiculoModelo = loteRec.getString('veiculo_marca_modelo') || ''
    const veiculoChassi = loteRec.getString('veiculo_chassi') || ''
    const veiculoBaixa = loteRec.getString('veiculo_baixa_detran') || ''
    const veiculoSeguradora = loteRec.getString('veiculo_seguradora') || ''

    const anoCorrente = new Date().getFullYear()

    // Mapeamento de subsistema para categoria de material padrão
    const mapearCategoriaMaterial = (sub, nome) => {
      const subNorm = (sub || '').toLowerCase()
      const nomeNorm = (nome || '').toLowerCase()

      if (
        nomeNorm.includes('cobre') ||
        nomeNorm.includes('bobina') ||
        nomeNorm.includes('alternador')
      )
        return 'cobre'
      if (
        nomeNorm.includes('alum') ||
        nomeNorm.includes('radiador') ||
        nomeNorm.includes('cabeçote') ||
        nomeNorm.includes('condensador')
      )
        return 'aluminio'
      if (
        nomeNorm.includes('polímero') ||
        nomeNorm.includes('parachoque') ||
        nomeNorm.includes('termoplástico') ||
        nomeNorm.includes('tanque') ||
        nomeNorm.includes('pneu')
      )
        return 'polimeros'
      if (
        subNorm.includes('motor') ||
        subNorm.includes('câmbio') ||
        subNorm.includes('suspensão') ||
        subNorm.includes('freios') ||
        subNorm.includes('carroceria') ||
        subNorm.includes('escape')
      )
        return 'aco'
      return 'outros'
    }

    // Catálogo canônico de fatores padrão (DM-ORB-001 v1.1 §6.3 / catalogoFatoresOficiais)
    const fatoresCo2e = {
      aco: 2.18,
      aluminio: 14.4,
      cobre: 4.1,
      polimeros: 1.9,
      outros: 1.5,
    }

    let adicionadas = 0

    for (let i = 0; i < itensCatalogo.length; i++) {
      const itemCat = itensCatalogo[i]
      const numero = itemCat.getInt('numero')
      const nomePeca = itemCat.getString('nome_peca')
      const subsistema = itemCat.getString('subsistema')

      // Se já existe peça com este catalogo_numero ou mesma descrição neste lote, pula
      if (numerosExistentes[numero]) {
        continue
      }
      if (descricoesExistentes[nomePeca.toLowerCase().trim()]) {
        continue
      }

      // Gerar selo DPP único
      let selo = ''
      let tentativas = 0
      while (tentativas < 10) {
        const randSuf = Math.floor(100000 + Math.random() * 900000)
        const cand = 'PR-SEAL-' + anoCorrente + '-' + randSuf
        try {
          app.findFirstRecordByData('cdv_pecas', 'selo_dpp', cand)
        } catch (_) {
          selo = cand
          break
        }
        tentativas++
      }
      if (!selo) {
        selo = 'PR-SEAL-' + anoCorrente + '-' + Date.now().toString().slice(-6)
      }

      const categoriaMat = mapearCategoriaMaterial(subsistema, nomePeca)
      const fator = fatoresCo2e[categoriaMat] || 1.5
      // Peso estimado padrão zero para peça não desmontada (aferido quando desmontada/pesada)
      const pesoKg = 0.0
      const co2eEvitadoKg = 0.0
      const sku =
        'CAT-' + String(numero).padStart(3, '0') + '-' + loteRec.id.slice(-4).toUpperCase()

      // Hash canônico inicial para integridade
      const canonicalStr =
        selo +
        '|' +
        sku +
        '|' +
        nomePeca +
        '|0.00|0.00|' +
        veiculoBaixa.toUpperCase().trim() +
        '|' +
        cdvCnpj.trim()
      const sha256 = $security.sha256(canonicalStr)

      const recPeca = new Record(pecasCol)
      recPeca.set('lote', loteRec.id)
      recPeca.set('sku_interno', sku)
      recPeca.set('selo_dpp', selo)
      recPeca.set('descricao_peca', nomePeca)
      recPeca.set('categoria_material', categoriaMat)
      recPeca.set('material_declarado', 'Catálogo Oficial CONTRAN/MOVER')
      recPeca.set('peso_kg', pesoKg)
      recPeca.set('fator_co2e_kg', fator)
      recPeca.set('co2e_evitado_kg', co2eEvitadoKg)
      recPeca.set('hash_sha256', sha256)
      recPeca.set('responsavel_crea', 'CREA a designar pelo CDV')
      recPeca.set('cdv_origem', cdvCodigo)
      recPeca.set('cdv_cnpj', cdvCnpj)
      recPeca.set('status', 'ativo')
      recPeca.set('veiculo_marca_modelo', veiculoModelo)
      recPeca.set('veiculo_chassi_mascarado', veiculoChassi)
      recPeca.set('veiculo_baixa_detran', veiculoBaixa.toUpperCase().trim())
      recPeca.set('veiculo_seguradora', veiculoSeguradora)
      recPeca.set('subsistema', subsistema)
      recPeca.set('catalogo_numero', numero)
      recPeca.set('situacao_checklist', 'nao_desmontada')

      try {
        app.save(recPeca)
        adicionadas++
        numerosExistentes[numero] = true
      } catch (errSave) {
        console.log('[cdv_lote_autopreencher] Erro ao salvar peca ' + numero + ':', errSave)
      }
    }

    if (adicionadas > 0) {
      console.log(
        '[cdv_lote_autopreencher] Lote ' +
          loteRec.id +
          ': ' +
          adicionadas +
          ' pecas do catalogo auto-preenchidas.',
      )
    }
  } catch (err) {
    console.log('[cdv_lote_autopreencher] Erro geral no hook onRecordAfterCreateSuccess:', err)
  }
}, 'cdv_lotes')
