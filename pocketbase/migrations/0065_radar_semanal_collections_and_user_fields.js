/**
 * MIGRATION 0065: PRODUTO RADAR SEMANAL
 *
 * 1. users:
 *    - radar_acesso_status: select ('trial' | 'ativo' | 'expirado' | 'cancelado' | 'nenhum')
 *    - radar_plano_faixa: select ('1_cnpj' | 'ate_5_cnpjs' | 'ate_30_cnpjs' | 'acima_30_sob_consulta' | 'nenhum')
 *    - radar_trial_fim: text (data ISO de expiração do trial de 15 dias)
 *    - radar_assinatura_fim: text (data ISO de expiração da assinatura)
 *    - radar_ref_origem: text (código ref de quem indicou este usuário)
 *
 * 2. leads_diagnostico:
 *    - ref_indicacao: text (código ref de indicação capturado do link/digest)
 *
 * 3. radar_edicoes:
 *    - numero_edicao: number
 *    - titulo: text
 *    - resumo_semana: text
 *    - data_edicao: text (ex: 2026-03-30)
 *    - aberta_publico: bool (edição do mês aberta para captura de leads)
 *    - mes_ano_referencia: text (ex: "Março 2026")
 *    - itens_normas_json: json (array de normas formatadas: o_que_e, quem_afeta, o_que_muda, prazo, o_que_fazer_agora, tag, base_legal)
 *    - autor_editorial: text
 *    - publicada: bool
 *    - total_destinatarios_enviados: number
 *    - data_envio_digest: text
 *
 * 4. radar_leituras:
 *    - usuario: relation -> users
 *    - edicao: relation -> radar_edicoes
 *    - lida: bool
 *    - data_leitura: text
 */

migrate(
  (app) => {
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')

    if (!usersCol.fields.getByName('radar_acesso_status')) {
      usersCol.fields.add(
        new SelectField({
          name: 'radar_acesso_status',
          values: ['trial', 'ativo', 'expirado', 'cancelado', 'nenhum'],
          maxSelect: 1,
        }),
      )
    }

    if (!usersCol.fields.getByName('radar_plano_faixa')) {
      usersCol.fields.add(
        new SelectField({
          name: 'radar_plano_faixa',
          values: ['1_cnpj', 'ate_5_cnpjs', 'ate_30_cnpjs', 'acima_30_sob_consulta', 'nenhum'],
          maxSelect: 1,
        }),
      )
    }

    if (!usersCol.fields.getByName('radar_trial_fim')) {
      usersCol.fields.add(new TextField({ name: 'radar_trial_fim' }))
    }

    if (!usersCol.fields.getByName('radar_assinatura_fim')) {
      usersCol.fields.add(new TextField({ name: 'radar_assinatura_fim' }))
    }

    if (!usersCol.fields.getByName('radar_ref_origem')) {
      usersCol.fields.add(new TextField({ name: 'radar_ref_origem' }))
    }

    app.save(usersCol)

    // Atualiza leads_diagnostico com ref_indicacao
    const leadsCol = app.findCollectionByNameOrId('leads_diagnostico')
    if (!leadsCol.fields.getByName('ref_indicacao')) {
      leadsCol.fields.add(new TextField({ name: 'ref_indicacao' }))
      app.save(leadsCol)
    }

    // Criação da coleção radar_edicoes se não existir
    let edicoesCol
    try {
      edicoesCol = app.findCollectionByNameOrId('radar_edicoes')
    } catch (_) {
      edicoesCol = new Collection({
        name: 'radar_edicoes',
        type: 'base',
        listRule: "@request.auth.id != '' || aberta_publico = true",
        viewRule: "@request.auth.id != '' || aberta_publico = true",
        createRule:
          "@request.auth.id != '' && (@request.auth.role = 'admin' || @request.auth.role = 'master' || @request.auth.role = 'controller')",
        updateRule:
          "@request.auth.id != '' && (@request.auth.role = 'admin' || @request.auth.role = 'master' || @request.auth.role = 'controller')",
        deleteRule:
          "@request.auth.id != '' && (@request.auth.role = 'admin' || @request.auth.role = 'master')",
        fields: [
          { name: 'numero_edicao', type: 'number', required: true, onlyInt: true },
          { name: 'titulo', type: 'text', required: true },
          { name: 'resumo_semana', type: 'text' },
          { name: 'data_edicao', type: 'text', required: true },
          { name: 'aberta_publico', type: 'bool' },
          { name: 'mes_ano_referencia', type: 'text' },
          { name: 'itens_normas_json', type: 'json' },
          { name: 'autor_editorial', type: 'text' },
          { name: 'publicada', type: 'bool' },
          { name: 'total_destinatarios_enviados', type: 'number', onlyInt: true },
          { name: 'data_envio_digest', type: 'text' },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE UNIQUE INDEX idx_radar_edicoes_numero ON radar_edicoes (numero_edicao)',
          'CREATE INDEX idx_radar_edicoes_data ON radar_edicoes (data_edicao DESC)',
          'CREATE INDEX idx_radar_edicoes_aberta ON radar_edicoes (aberta_publico)',
        ],
      })
      app.save(edicoesCol)
    }

    // Criação da coleção radar_leituras se não existir
    let leiturasCol
    try {
      leiturasCol = app.findCollectionByNameOrId('radar_leituras')
    } catch (_) {
      leiturasCol = new Collection({
        name: 'radar_leituras',
        type: 'base',
        listRule:
          "@request.auth.id != '' && (usuario = @request.auth.id || @request.auth.role = 'admin' || @request.auth.role = 'master')",
        viewRule:
          "@request.auth.id != '' && (usuario = @request.auth.id || @request.auth.role = 'admin' || @request.auth.role = 'master')",
        createRule: "@request.auth.id != '' && usuario = @request.auth.id",
        updateRule:
          "@request.auth.id != '' && (usuario = @request.auth.id || @request.auth.role = 'admin' || @request.auth.role = 'master')",
        deleteRule:
          "@request.auth.id != '' && (usuario = @request.auth.id || @request.auth.role = 'admin' || @request.auth.role = 'master')",
        fields: [
          {
            name: 'usuario',
            type: 'relation',
            collectionId: usersCol.id,
            required: true,
            maxSelect: 1,
            cascadeDelete: true,
          },
          {
            name: 'edicao',
            type: 'relation',
            collectionId: edicoesCol.id,
            required: true,
            maxSelect: 1,
            cascadeDelete: true,
          },
          { name: 'lida', type: 'bool' },
          { name: 'data_leitura', type: 'text' },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE UNIQUE INDEX idx_radar_leituras_user_edicao ON radar_leituras (usuario, edicao)',
        ],
      })
      app.save(leiturasCol)
    }

    // Seed: 3 primeiras edições com base no acervo editorial existente (src/data/radarRegulatorioData.ts)
    // Uma delas definida como "aberta_publico: true" (Edição do Mês aberta como prova de qualidade)
    try {
      const ed1 = app.findFirstRecordByData('radar_edicoes', 'numero_edicao', 1)
      if (ed1) return
    } catch (_) {
      // Edição 1 (Histórica / Aberta ao público como Edição Demonstrativa do Mês)
      const rec1 = new Record(edicoesCol)
      rec1.set('numero_edicao', 1)
      rec1.set(
        'titulo',
        'Edição 01 — Marco CVM 244, ProBioQAV CS-SAF e Calendário Fase-Teste IBS/CBS',
      )
      rec1.set(
        'resumo_semana',
        'Análise regulatória aprofundada: revogação da obrigatoriedade IFRS S1/S2 no Brasil com veto ao greenwashing associativo; regras do CS-SAF em book and claim; e cronograma de adequação fiscal para agosto de 2026.',
      )
      rec1.set('data_edicao', '2026-03-09')
      rec1.set('aberta_publico', true)
      rec1.set('mes_ano_referencia', 'Março 2026')
      rec1.set('publicada', true)
      rec1.set('autor_editorial', 'Curadoria Regulatória Orbis Protocol')
      rec1.set('total_destinatarios_enviados', 0)
      rec1.set('itens_normas_json', [
        {
          id: 'cvm-244',
          norma: 'Resolução CVM nº 244/2026 & Ofício-Circular CVM',
          segmento: 'Ambiental/ESG',
          o_que_e:
            'Fim da obrigatoriedade de reporte IFRS S1/S2 e veto expresso a menções de conformidade ISSB sem comprovação integral e verificável.',
          quem_afeta:
            'Companhias abertas, emissores de dívida, fundos de investimento ASG e empresas participantes de cadeias de valor.',
          o_que_muda_na_pratica:
            'Declarações vagas como "baseado em" ou "alinhado ao ISSB" passam a ser autuáveis como publicidade enganosa/greenwashing por associação.',
          prazo: 'Vigente desde a publicação',
          o_que_fazer_agora:
            'Substituir declarações institucionais genéricas por notas explicativas embasadas em dados primários e conciliação documental auditável.',
          base_legal: 'Resolução CVM nº 244/2026',
        },
        {
          id: 'probioqav-cssaf',
          norma: 'Decreto Federal nº 13.094/2026 & Lei 14.993/2024',
          segmento: 'Energia',
          o_que_e:
            'Regulamentação do Certificado de Combustível Sustentável de Aviação (CS-SAF) em regime de book and claim com norma ISO 22095-3:2026.',
          quem_afeta:
            'Operadores aéreos, usinas produtoras de SAF, distribuidoras e grandes exportadores com metas CORSIA/ICAO.',
          o_que_muda_na_pratica:
            'Separação formal entre a entrega física do biocombustível e a reivindicação do atributo climático (TIEC), com vedação absoluta de dupla contagem contra CBIOs.',
          prazo: 'Metas mandatórias a partir de 2027; interoperabilidade SBCE em estruturação',
          o_que_fazer_agora:
            'Auditar a custódia digital de lotes de combustíveis renováveis e verificar ausência de sobreposição de selos fiscais.',
          base_legal: 'Decreto nº 13.094/2026 e Art. 3º da Lei nº 14.993/2024',
        },
        {
          id: 'fase-teste-ibscbs',
          norma: 'LC 214/2025 (Art. 348) & EC 132/2023',
          segmento: 'Fiscal / Tributário',
          o_que_e:
            'Início oficial da fase de testes com destaque de 0,1% de IBS e 0,9% de CBS na NF-e modelo 55 e NFC-e modelo 65.',
          quem_afeta: 'Todas as empresas emissoras de documentos fiscais eletrônicos no Brasil.',
          o_que_muda_na_pratica:
            'Obrigatoriedade de emissão com campos XML <IBSCBS> preenchidos, com dispensa de recolhimento financeiro mediante envio tempestivo das obrigações acessórias.',
          prazo: '01/08/2026',
          o_que_fazer_agora:
            'Cobrar o fornecedor de ERP e parametrizar tags tributárias cClassTrib para evitar rejeições de lote na SEFAZ.',
          base_legal: 'Art. 348 da Lei Complementar nº 214/2025',
        },
      ])
      app.save(rec1)

      // Edição 2 (Exclusiva para Assinantes Ativos/Trial)
      const rec2 = new Record(edicoesCol)
      rec2.set('numero_edicao', 2)
      rec2.set(
        'titulo',
        'Edição 02 — Bacen 586/2026, Portaria Previc 728 e Desoneração CDV no Imposto Seletivo',
      )
      rec2.set(
        'resumo_semana',
        'Exigência de dados primários e relatórios GRSAC pelo Banco Central; governança de risco ASG em fundos de pensão pela Previc; e detalhes da blindagem de peças desmontadas no IS.',
      )
      rec2.set('data_edicao', '2026-03-16')
      rec2.set('aberta_publico', false)
      rec2.set('mes_ano_referencia', 'Março 2026')
      rec2.set('publicada', true)
      rec2.set('autor_editorial', 'Curadoria Regulatória Orbis Protocol')
      rec2.set('total_destinatarios_enviados', 0)
      rec2.set('itens_normas_json', [
        {
          id: 'bacen-586',
          norma: 'Resolução CMN/Bacen nº 586/2026',
          segmento: 'Financeiro',
          o_que_e:
            'Atualização mandatória dos relatórios de gerenciamento de riscos e oportunidades sociais, ambientais e climáticas (GRSAC).',
          quem_afeta:
            'Instituições financeiras autorizadas, cooperativas de crédito e tomadores corporativos de crédito bancário e Green Capital.',
          o_que_muda_na_pratica:
            'Bancos passam a exigir dados primários e rastreabilidade documental em operações de crédito estruturado e financiamento verde.',
          prazo: 'Vigência imediata no ciclo de reporte 2026',
          o_que_fazer_agora:
            'Estruturar dossiês fiscais comprobatórios antes de submeter pleitos de crédito sustentável.',
          base_legal: 'Resolução CMN/Bacen nº 586/2026',
        },
        {
          id: 'previc-728',
          norma: 'Portaria Previc nº 728/2026',
          segmento: 'Financeiro',
          o_que_e:
            'Integração compulsória de fatores ASG e análise de dupla materialidade nos investimentos de Entidades Fechadas de Previdência Complementar.',
          quem_afeta:
            'Fundos de pensão (EFPCs), gestores de recursos e empresas emissoras de debêntures e ações.',
          o_que_muda_na_pratica:
            'Exigência de plano ASG formal e diligência qualificada sobre o risco de transição dos ativos investidos.',
          prazo: 'Ciclo de governança 2026/2027',
          o_que_fazer_agora:
            'Apresentar aos investidores institucionais demonstrativo de resiliência climática com rastreabilidade.',
          base_legal: 'Portaria Previc nº 728/2026',
        },
        {
          id: 'imposto-seletivo-cdv',
          norma: 'LC 214/2025 (Imposto Seletivo)',
          segmento: 'Fiscal / Tributário',
          o_que_e:
            'Incidência extrafiscal monofásica do IS sobre veículos a combustão com desoneração para reciclagem e desmontagem veicular (CDV).',
          quem_afeta:
            'Montadoras, centros de desmontagem veicular, distribuidoras de autopeças e frotistas.',
          o_que_muda_na_pratica:
            'Peças reutilizadas com rastreabilidade e lastro pericial contam com tratamento fiscal protetivo frente a peças novas poluentes.',
          prazo: 'Fase de regulamentação 2026; vigência progressiva',
          o_que_fazer_agora:
            'Adequar cadastros NCM e exigir passaporte digital do desmontador credenciado.',
          base_legal: 'LC 214/2025, Anexo do Imposto Seletivo e EC 132/2023',
        },
      ])
      app.save(rec2)

      // Edição 3 (Mais recente — semana atual)
      const rec3 = new Record(edicoesCol)
      rec3.set('numero_edicao', 3)
      rec3.set(
        'titulo',
        'Edição 03 — Limiares da Lei 15.042 (SBCE), Consulta Susep e Rastreabilidade PNRS',
      )
      rec3.set(
        'resumo_semana',
        'Consolidação dos limiares de reporte mandatório (10k tCO₂e) e metas (25k tCO₂e) do SBCE; alinhamento da Susep aos padrões ISSB; e conferência documental de logística reversa.',
      )
      rec3.set('data_edicao', '2026-03-23')
      rec3.set('aberta_publico', false)
      rec3.set('mes_ano_referencia', 'Março 2026')
      rec3.set('publicada', true)
      rec3.set('autor_editorial', 'Curadoria Regulatória Orbis Protocol')
      rec3.set('total_destinatarios_enviados', 0)
      rec3.set('itens_normas_json', [
        {
          id: 'sbce-15042',
          norma: 'Lei Federal nº 15.042/2024 (Marco Legal do SBCE)',
          segmento: 'Ambiental/ESG',
          o_que_e:
            'Sistema Brasileiro de Comércio de Emissões de GEE com limiares mandatórios de conformidade e governança.',
          quem_afeta:
            'Grandes indústrias, termoelétricas, transportadoras e instalações com consumo energético intensivo.',
          o_que_muda_na_pratica:
            'Emissões anuais acima de 10.000 tCO₂e exigem reporte formal obrigatório; acima de 25.000 tCO₂e impõem alocação e entrega de cotas de emissão.',
          prazo: 'Fase preparatória em curso; vigência operacional plena até 2029',
          o_que_fazer_agora:
            'Realizar o inventário de emissões de Escopo 1 e 2 com metodologia ISO 14064 e base de dados fiscais (SPED/NF-e).',
          base_legal: 'Lei Federal nº 15.042/2024',
        },
        {
          id: 'susep-issb',
          norma: 'Consulta Pública Susep (Substituição da Circular 666/2022)',
          segmento: 'Financeiro',
          o_que_e:
            'Convergência do setor de seguros privados aos padrões globais de reporte ISSB (IFRS S1 e S2).',
          quem_afeta:
            'Seguradoras, resseguradores, entidades abertas de previdência e indústrias com apólices de grandes riscos.',
          o_que_muda_na_pratica:
            'Quatro tabelas padronizadas cobrindo governança, estratégia, gestão de riscos climáticos e métricas de emissões.',
          prazo: 'Vigência a partir de 31/12/2026; coleta em 2027 e divulgação obrigatória em 2028',
          o_que_fazer_agora:
            'Organizar dados primários de infraestrutura e apólices em conformidade com as matrizes Susep.',
          base_legal: 'Edital de Consulta Pública Susep 2026',
        },
        {
          id: 'pnrs-logistica-reversa',
          norma: 'Lei Federal nº 12.305/2010 & Decretos 11.044 e 11.413',
          segmento: 'Ambiental/ESG',
          o_que_e:
            'Comprovação de logística reversa obrigatória de embalagens, pneus, óleos lubrificantes e baterias.',
          quem_afeta:
            'Fabricantes, importadores e distribuidores de produtos sujeitos à responsabilidade compartilhada.',
          o_que_muda_na_pratica:
            'Exigência de Certificados de Crédito de Reciclagem (CCRR/CCRLR) e MTR/SINIR sem duplicidade de lastro.',
          prazo: 'Obrigação contínua anual',
          o_que_fazer_agora:
            'Conciliar faturas fiscais de destinação com o manifesto oficial de transporte de resíduos.',
          base_legal: 'Decretos nº 11.044/2022 e 11.413/2023',
        },
      ])
      app.save(rec3)
    }
  },
  (app) => {
    try {
      const leiturasCol = app.findCollectionByNameOrId('radar_leituras')
      app.delete(leiturasCol)
    } catch (_) {}
    try {
      const edicoesCol = app.findCollectionByNameOrId('radar_edicoes')
      app.delete(edicoesCol)
    } catch (_) {}
  },
)
