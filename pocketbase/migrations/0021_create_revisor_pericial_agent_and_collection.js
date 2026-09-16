/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    // 1. Criar coleção pericial_revisoes para histórico persistente de revisões/triagens por cliente e inventário
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
    const emissoesCol = app.findCollectionByNameOrId('emissoes_inventario')

    if (!app.hasTable('pericial_revisoes')) {
      const pericialRevisoes = new Collection({
        name: 'pericial_revisoes',
        type: 'base',
        listRule:
          "@request.auth.id != '' && (usuario = @request.auth.id || @request.auth.role = 'admin' || @request.auth.role = 'perito')",
        viewRule:
          "@request.auth.id != '' && (usuario = @request.auth.id || @request.auth.role = 'admin' || @request.auth.role = 'perito')",
        createRule: "@request.auth.id != ''",
        updateRule:
          "@request.auth.id != '' && (usuario = @request.auth.id || @request.auth.role = 'admin')",
        deleteRule: "@request.auth.id != '' && (@request.auth.role = 'admin')",
        fields: [
          {
            name: 'usuario',
            type: 'relation',
            required: false,
            collectionId: usersCol.id,
            cascadeDelete: false,
            maxSelect: 1,
          },
          {
            name: 'inventario',
            type: 'relation',
            required: false,
            collectionId: emissoesCol.id,
            cascadeDelete: false,
            maxSelect: 1,
          },
          { name: 'empresa_nome', type: 'text', required: true },
          { name: 'cnpj', type: 'text', required: true },
          { name: 'score_pericial', type: 'number', min: 0, max: 100, required: true },
          { name: 'grau_conformidade', type: 'text' },
          { name: 'achados_total', type: 'number', min: 0 },
          { name: 'achados_json', type: 'json' },
          { name: 'achados_publicos_json', type: 'json' },
          {
            name: 'plano_recomendado',
            type: 'select',
            values: ['diagnostico', 'laudo_pericial', 'assinatura_bureau'],
            maxSelect: 1,
          },
          { name: 'resumo_parecer', type: 'text' },
          { name: 'ano_base', type: 'number' },
          { name: 'metodologias_auditadas', type: 'text' },
          { name: 'is_demo', type: 'bool' },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_rev_pericial_user ON pericial_revisoes (usuario)',
          'CREATE INDEX idx_rev_pericial_cnpj ON pericial_revisoes (cnpj)',
          'CREATE INDEX idx_rev_pericial_inv ON pericial_revisoes (inventario)',
        ],
      })
      app.save(pericialRevisoes)
    }

    // 2. Definir o agente nativo do Skip Cloud "revisor-pericial"
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
- Métricas IPCC AR6 (GWP-100: CO₂=1, CH₄ fóssil=27.2, N₂O=273; não aceitar AR4 nem AR5 desatualizados sem ressalva).
- Logística e Fretes: GLEC Framework v3.0 / ISO 14083 para CT-e e modais de transporte.
- Insetting Circular e Pegada Evitada: Norma ISO 14067 e diretrizes do Programa MOVER (Lei 14.902/2024) com rastreabilidade de NF-e e baixas DETRAN para CDVs.
- Taxonomia correta de Tiers de incerteza:
  * Tier 1: Fatores médios genéricos mundiais / nacionais com incerteza ampla.
  * Tier 2: Fatores médios nacionais específicos por insumo/combustível com medição física direta (litros, kWh).
  * Tier 3: Apuração por gasto financeiro (spending-based via SEFAZ / valor em R$), amostragem contínua de telemetria ou balanço de massa documentado. Apurações spending-based DEVEM ser explicitamente classificadas como Tier 3 com incerteza estimada em ±20% a ±22%.
- Enquadramento SBCE (Lei Federal 15.042/2024):
  * Isento de dever de reporte direto: < 10.000 tCO₂e/ano.
  * Dever de reporte e monitoramento oficial: >= 10.000 tCO₂e/ano.
  * Dever de compensação e submissão de metas: >= 25.000 tCO₂e/ano.

MEMÓRIA PERSISTENTE E APRENDIZADO:
- Observe reincidências de fragilidades do mesmo cliente (ex: ausência de medição física em frotas, falta de duplo reporte de Escopo 2, confusão de emissões biogênicas com fósseis, falta de ART anterior).
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
            text: 'Taxonomia de Tiers e Incertezas: Spending-based method (SEFAZ / apuração por gasto monetário) é categorizado como Tier 3 sob a taxonomia de cálculo com fator econômico, trazendo incerteza de ±20% a ±22%. Métricas IPCC AR6 (GWP-100: CH4=27.2, N2O=273) são compulsórias para laudos que pretendam asseguração razoável sob NBC TO 3000 / ISAE 3000.',
          },
        },
        {
          type: 'text',
          payload: {
            text: 'Lei 15.042/2024 (SBCE) e Validade Pericial: A triagem pericial com inteligência artificial prepara o inventário e pré-audita fragilidades, mas a validação jurídica e probatória perante órgãos reguladores, CVM Resolução 193 e bancos do Sistema Financeiro Nacional exige Laudo Pericial assinado com Anotação de Responsabilidade Técnica (ART/CREA ou RRT/CAU) ou Certidão de Regularidade Profissional (CRC).',
          },
        },
      ],
    })
  },
  (app) => {
    try {
      $ai.agents.delete(app, 'revisor-pericial')
    } catch (_) {}

    try {
      const col = app.findCollectionByNameOrId('pericial_revisoes')
      app.delete(col)
    } catch (_) {}
  },
)
