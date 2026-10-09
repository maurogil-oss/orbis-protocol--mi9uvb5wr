/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    // 1. Coleção 'escolas' (entidade própria na plataforma)
    if (!app.hasTable('escolas')) {
      const escolas = new Collection({
        name: 'escolas',
        type: 'base',
        listRule: '',
        viewRule: '',
        createRule: '',
        updateRule: "@request.auth.id != ''",
        deleteRule:
          "@request.auth.id != '' && (@request.auth.role = 'gestor_master' || @request.auth.role = 'admin')",
        fields: [
          { name: 'nome', type: 'text', required: true },
          { name: 'cnpj_inep', type: 'text', required: true },
          { name: 'municipio', type: 'text', required: true },
          { name: 'uf', type: 'text', required: true },
          {
            name: 'rede',
            type: 'select',
            required: true,
            values: ['municipal', 'estadual', 'particular'],
            maxSelect: 1,
          },
          {
            name: 'perfil_modalidade',
            type: 'select',
            required: true,
            values: ['publica_patrocinada', 'particular_compradora'],
            maxSelect: 1,
          },
          // Alunos por etapa
          { name: 'alunos_educacao_infantil', type: 'number', min: 0 },
          { name: 'alunos_fundamental_1', type: 'number', min: 0 },
          { name: 'alunos_fundamental_2', type: 'number', min: 0 },
          { name: 'alunos_ensino_medio', type: 'number', min: 0 },
          { name: 'total_alunos', type: 'number', min: 0 },
          // Turmas e responsável
          { name: 'graus_turmas_atendidas', type: 'text' },
          { name: 'responsavel_pedagogico_nome', type: 'text' },
          { name: 'responsavel_pedagogico_email', type: 'text' },
          { name: 'responsavel_pedagogico_telefone', type: 'text' },
          // Vínculo institucional / secretaria / patrocinador
          { name: 'secretaria_ou_patrocinador', type: 'text' },
          { name: 'lote_inscricao_id', type: 'text' },
          // Camada comercial para particulares (placeholders definidos com honestidade canônica)
          { name: 'faixa_preco_comercial', type: 'text' },
          {
            name: 'status_adesao',
            type: 'select',
            values: ['inscrita', 'piloto_ativo', 'concluida', 'em_negociacao'],
            maxSelect: 1,
          },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_escolas_cnpj_inep ON escolas (cnpj_inep)',
          'CREATE INDEX idx_escolas_rede ON escolas (rede)',
          'CREATE INDEX idx_escolas_municipio_uf ON escolas (municipio, uf)',
          'CREATE INDEX idx_escolas_perfil ON escolas (perfil_modalidade)',
        ],
      })
      app.save(escolas)
    }

    // 2. Coleção 'educacao_participantes' (participantes MEI e turmas/alunos de escolas)
    if (!app.hasTable('educacao_participantes')) {
      const participantes = new Collection({
        name: 'educacao_participantes',
        type: 'base',
        listRule: '',
        viewRule: '',
        createRule: '',
        updateRule: "@request.auth.id != ''",
        deleteRule:
          "@request.auth.id != '' && (@request.auth.role = 'gestor_master' || @request.auth.role = 'admin')",
        fields: [
          {
            name: 'tipo_publico',
            type: 'select',
            required: true,
            values: ['mei', 'escola_aluno', 'escola_turma', 'gestor_escolar'],
            maxSelect: 1,
          },
          { name: 'nome_participante', type: 'text', required: true },
          { name: 'documento_identificador', type: 'text' }, // CPF/CNPJ MEI ou identificador escolar
          { name: 'email', type: 'text' },
          { name: 'whatsapp', type: 'text' },
          { name: 'municipio', type: 'text' },
          { name: 'uf', type: 'text' },
          // Vínculo com escola se aplicável
          { name: 'escola_id', type: 'text' },
          { name: 'escola_nome', type: 'text' },
          { name: 'turma_grau', type: 'text' },
          { name: 'patrocinador_entidade', type: 'text' },
          // Progresso da trilha
          { name: 'progresso_licoes_concluidas', type: 'number', min: 0, max: 20 },
          { name: 'total_licoes', type: 'number', min: 1, max: 20 },
          { name: 'percentual_conclusao', type: 'number', min: 0, max: 100 },
          {
            name: 'status_trilha',
            type: 'select',
            values: ['inscrito', 'em_andamento', 'concluido'],
            maxSelect: 1,
          },
          // Atestado de Participação emitido
          { name: 'codigo_atestado', type: 'text' },
          { name: 'hash_sha256', type: 'text' },
          { name: 'data_conclusao', type: 'text' },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_educacao_part_tipo ON educacao_participantes (tipo_publico)',
          'CREATE INDEX idx_educacao_part_escola ON educacao_participantes (escola_id)',
          'CREATE INDEX idx_educacao_part_atestado ON educacao_participantes (codigo_atestado)',
        ],
      })
      app.save(participantes)
    }

    // 3. Atualizar coleção 'leads_diagnostico' para receber segmento e respostas detalhadas de Alimentação
    try {
      const leadsCol = app.findCollectionByNameOrId('leads_diagnostico')
      if (!leadsCol.fields.getByName('segmento_economico')) {
        leadsCol.fields.add(
          new TextField({
            name: 'segmento_economico',
          }),
        )
      }
      if (!leadsCol.fields.getByName('diagnostico_segmento_json')) {
        leadsCol.fields.add(
          new JSONField({
            name: 'diagnostico_segmento_json',
            maxSize: 1048576,
          }),
        )
      }
      if (!leadsCol.fields.getByName('protocolo_dx_codigo')) {
        leadsCol.fields.add(
          new TextField({
            name: 'protocolo_dx_codigo',
          }),
        )
      }
      app.save(leadsCol)
    } catch (errLeads) {
      console.log('[Migration 0104] Aviso ao atualizar leads_diagnostico:', errLeads)
    }

    // 4. Atualizar coleção 'selos' para acomodar tipo de documento 'atestado_participacao' se não existir campo tipo_documento
    try {
      const selosCol = app.findCollectionByNameOrId('selos')
      if (!selosCol.fields.getByName('tipo_documento')) {
        selosCol.fields.add(
          new SelectField({
            name: 'tipo_documento',
            values: [
              'atestado_conformidade',
              'passaporte_dpp',
              'atestado_participacao',
              'laudo_dmrv',
            ],
            maxSelect: 1,
          }),
        )
        app.save(selosCol)
      }
    } catch (errSelos) {
      console.log('[Migration 0104] Aviso ao atualizar selos:', errSelos)
    }
  },
  (app) => {
    try {
      if (app.hasTable('educacao_participantes')) {
        const p = app.findCollectionByNameOrId('educacao_participantes')
        app.delete(p)
      }
    } catch (_) {}

    try {
      if (app.hasTable('escolas')) {
        const e = app.findCollectionByNameOrId('escolas')
        app.delete(e)
      }
    } catch (_) {}
  },
)
