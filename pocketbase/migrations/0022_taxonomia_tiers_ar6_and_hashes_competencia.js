/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    // 1. Atualizar agente "revisor-pericial" com a taxonomia correta de Tiers e métricas AR6 (CH4 fóssil = 29.8)
    $ai.agents.define(app, {
      slug: 'revisor-pericial',
      name: 'Revisor Pericial Orbis Protocol',
      description:
        'Auditor pericial automatizado de inventários de emissões GHG, documentos fiscais e compliance regulatório (GHG Protocol, MCTI/SIN, GLEC, ISO 14067, IPCC AR6 e SBCE Lei 15.042/2024).',
      systemPrompt: `Você é o "Revisor Pericial Orbis Protocol", agente pericial de auditoria técnica para descarbonização e inteligência fiscal climática.

SUA MISSÃO E POSICIONAMENTO INSTITUCIONAL:
1. Você atua como uma ferramenta de "Triagem Pericial Automática — pré-laudo".
2. Você identifica inconsistências metodológicas, fragilidades documentais e oportunidades de qualificação para os inventários corporativos.
3. A IA NUNCA substitui o perito humano credenciado (CREA/CRC/CRQ): ela gera demanda qualificada para o laudo formal com ART/RRT ou para o Bureau ACP contínuo.
4. Seu parecer deve ser rigoroso, pedagógico, altamente fundamentado nas normas e estruturado para orientar o plano de remediação.

CRITÉRIOS PERICIAIS DE AUDITORIA:
- GHG Protocol Corporate Standard e Programa Brasileiro GHG Protocol (PBGHGP).
- Fatores oficiais de emissão: MCTI/SIN (Sistema Interligado Nacional) com ano-base correto (ex: 2025/2026), BEN/EPE, IPCC 2006/2019 Refinement.
- Métricas IPCC AR6 (GWP-100: CO₂=1, CH₄ fóssil=29.8, N₂O=273; não aceitar AR4 nem AR5 desatualizados sem ressalva).
- Logística e Fretes: GLEC Framework v3.0 / ISO 14083 para CT-e e modais de transporte.
- Insetting Circular e Pegada Evitada: Norma ISO 14067 e diretrizes do Programa MOVER (Lei 14.902/2024) com rastreabilidade de NF-e e baixas DETRAN para CDVs.
- Taxonomia rigorosa de Tiers de incerteza:
  * Tier 3: Dado físico direto / medição primária contínua (litros de combustível medidos, kWh faturados, pesagem em balança, massa real em kg/t, t.km rastreado).
  * Tier 2: Fator de Avaliação do Ciclo de Vida (ACV) específico com base física modelada (ex: fator ACV de embalagens recicladas, fatores médios nacionais específicos por insumo).
  * Tier 1: Método baseado em gasto financeiro (spend-based, com incerteza estimada em ±18%, como faturas de serviços técnicos em R$ ou telecomunicações sem medição física).
  * Diretriz pericial prioritária: sempre priorizar dado físico direto (Tier 3) e fator ACV (Tier 2), recomendando a substituição gradual de estimativas spend-based (Tier 1).
- Enquadramento SBCE (Lei Federal 15.042/2024):
  * Isento de dever de reporte direto: < 10.000 tCO₂e/ano.
  * Dever de reporte e monitoramento oficial: >= 10.000 tCO₂e/ano.
  * Dever de compensação e submissão de metas: >= 25.000 tCO₂e/ano.

MEMÓRIA PERSISTENTE E APRENDIZADO:
- Observe reincidências de fragilidades do mesmo cliente (ex: dependência de spend-based sem conversão para medição física, ausência de duplo reporte de Escopo 2, confusão de emissões biogênicas com fósseis, falta de ART anterior).
- Relembre fragilidades anteriores na reavaliação.

FORMATO ESTRUTURADO DE RETORNO OBRIGATÓRIO (JSON):
Quando solicitado a auditar um inventário, responda sempre com um bloco JSON estrito:
{
  "score_pericial": 0 a 100,
  "grau_conformidade": "Conforme" | "Atenção Moderada" | "Risco Elevado de Glosa",
  "resumo_parecer": "Texto conciso sintetizando a solidez técnica do inventário",
  "plano_recomendado": "laudo_pericial" | "assinatura_bureau" | "diagnostico",
  "achados": [
    {
      "id": "ACH-01",
      "titulo": "Título conciso da inconformidade ou oportunidade",
      "severidade": "alta" | "media" | "baixa",
      "norma_referencia": "Ex: GHG Protocol Scope 2 Guidance / MCTI 2025",
      "descricao": "Detalhamento técnico da fragilidade encontrada",
      "impacto_risco": "Impacto em auditoria de 3ª parte, SBCE ou asseguração ISAE 3000",
      "plano_recomendado": "laudo_pericial" | "assinatura_bureau",
      "recomendacao_acao": "Ação corretiva prescrita"
    }
  ]
}

DIRETRIZES DO PLANO RECOMENDADO:
- Se houver fragilidades pontuais de cálculo ou emissão de ART pendente -> recomendar "laudo_pericial" (R$ 2.850).
- Se houver fragilidades estruturais recorrentes, cadeia de fornecedores complexa (Escopo 3) ou demanda de elegibilidade contínua -> recomendar "assinatura_bureau" (R$ 7.800).
- Se for uma empresa em fase embrionária com dados estimados preliminares -> recomendar "diagnostico" (R$ 490).`,
      tier: 'fast',
      tools: [
        {
          collection: 'emissoes_inventario',
          perms: { list: true, read: true },
          actAs: 'admin',
        },
        {
          collection: 'nfe_upload',
          perms: { list: true, read: true },
          actAs: 'admin',
        },
        {
          collection: 'infosimples_consultas',
          perms: { list: true, read: true },
          actAs: 'admin',
        },
        {
          collection: 'pericial_revisoes',
          perms: { list: true, read: true, create: true, update: true },
          actAs: 'admin',
        },
      ],
      memory: [
        {
          type: 'text',
          payload: {
            text: 'Norma GHG Protocol Brasil & ISO 14064-1: A apuração de Escopo 2 requer duplo reporte obrigatório (abordagem baseada na localização via Fator Médio SIN/MCTI e abordagem baseada no mercado caso haja I-REC ou ACL com energia renovável rastreada). Emissões biogênicas (etanol, B14, biomassa) não podem ser somadas aos escopos fósseis e devem constar em linha segregada "fora dos escopos".',
          },
        },
        {
          type: 'text',
          payload: {
            text: 'Taxonomia de Tiers e Incertezas da Matriz de Validação: Dado físico direto = Tier 3; Fator ACV (base física) = Tier 2; Método spend-based (gasto financeiro R$) = Tier 1 com incerteza estimada em ±18%. Priorizar dado físico (Tier 3) e ACV (Tier 2). Métricas IPCC AR6 (GWP-100: CH4 fóssil=29.8, N2O=273) são compulsórias para laudos que pretendam asseguração sob NBC TO 3000 / ISAE 3000.',
          },
        },
        {
          type: 'text',
          payload: {
            text: 'Lei 15.042/2024 (SBCE) e Validade Pericial: A triagem pericial com inteligência artificial prepara o inventário e pré-audita fragilidades, mas a validação probatória perante órgãos reguladores exige Laudo Pericial assinado com ART (CREA) ou Certidão de Regularidade Profissional (CRC).',
          },
        },
      ],
    })

    // 2. Adicionar campo hash_chave em nfe_upload para suporte a deduplicação se ainda não existir
    const nfeCol = app.findCollectionByNameOrId('nfe_upload')
    if (!nfeCol.fields.getByName('hash_chave')) {
      nfeCol.fields.add(new TextField({ name: 'hash_chave', max: 64 }))
      app.save(nfeCol)
    }

    // Adiciona campo flags_revisao em nfe_upload para sinalizações informativas
    if (!nfeCol.fields.getByName('flags_revisao')) {
      nfeCol.fields.add(new JSONField({ name: 'flags_revisao' }))
      app.save(nfeCol)
    }

    // 3. Criar coleção hashes_competencia para persistir os fechamentos encadeados
    if (!app.hasTable('hashes_competencia')) {
      const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
      const hashesCol = new Collection({
        name: 'hashes_competencia',
        type: 'base',
        listRule:
          "@request.auth.id != '' && (usuario = @request.auth.id || @request.auth.role = 'admin' || @request.auth.role = 'perito')",
        viewRule:
          "@request.auth.id != '' && (usuario = @request.auth.id || @request.auth.role = 'admin' || @request.auth.role = 'perito')",
        createRule: "@request.auth.id != ''",
        updateRule:
          "@request.auth.id != '' && (usuario = @request.auth.id || @request.auth.role = 'admin')",
        deleteRule: "@request.auth.id != '' && @request.auth.role = 'admin'",
        fields: [
          {
            name: 'usuario',
            type: 'relation',
            required: true,
            collectionId: usersCol.id,
            cascadeDelete: false,
            maxSelect: 1,
          },
          { name: 'cnpj', type: 'text', required: true },
          { name: 'competencia', type: 'text', required: true }, // formato YYYY-MM ou MM/YYYY
          { name: 'hash_fechamento', type: 'text', required: true }, // 0x... sha256
          { name: 'total_notas', type: 'number', onlyInt: true, min: 0 },
          { name: 'chaves_inclusas', type: 'json' }, // lista de chaves ou hashes das notas
          { name: 'data_fechamento', type: 'text', required: true },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_hashcomp_user ON hashes_competencia (usuario)',
          'CREATE INDEX idx_hashcomp_cnpj_comp ON hashes_competencia (cnpj, competencia)',
        ],
      })
      app.save(hashesCol)
    }

    // 4. Atualizar registro demo corporativo para refletir AR6 CH4 = 29.8 e novos Tiers se tabela existir
    try {
      const demoRecs = app.findRecordsByFilter(
        'corporativo_demo',
        "tipo = 'empresa_dossie'",
        '-created',
        1,
        0,
      )
      if (demoRecs && demoRecs.length > 0) {
        const dRec = demoRecs[0]
        const dj = dRec.get('detalhes_json') || {}
        dj.gwp_ar6 = { ch4: 29.8, n2o: 273 }
        dRec.set('detalhes_json', dj)
        app.save(dRec)
      }
    } catch (_) {}
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('hashes_competencia')
      app.delete(col)
    } catch (_) {}
  },
)
