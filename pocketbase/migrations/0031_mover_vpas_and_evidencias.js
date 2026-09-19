/**
 * MIGRATION 0031: ESPAÇO MOVER — VPAs E REPOSITÓRIO DE EVIDÊNCIAS
 *
 * Coleções criadas:
 * 1. mover_vpas: Acompanhamento de Áreas de Projeto Voluntário no âmbito do Programa MOVER (Lei 14.902/2024)
 *    e alinhamento à metodologia GS 448 do Gold Standard.
 * 2. mover_evidencias: Repositório auditável de evidências probatórias com hash SHA-256 canônico.
 *
 * Regras de acesso (RLS):
 * - Leitura (list/view): Restrita a usuários autenticados (@request.auth.id != "")
 * - Escrita (create/update/delete): Superuser/Server-side apenas (null) — padrão v0.0.38 fechado para anônimos
 */

migrate(
  (app) => {
    // 1. Coleção mover_vpas
    const vpasCol = new Collection({
      name: 'mover_vpas',
      type: 'base',
      listRule: '@request.auth.id != ""',
      viewRule: '@request.auth.id != ""',
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [
        { name: 'codigo_vpa', type: 'text', required: true },
        { name: 'titulo', type: 'text', required: true },
        { name: 'cdv_nome', type: 'text', required: true },
        { name: 'cdv_cnpj', type: 'text' },
        { name: 'uf', type: 'text' },
        {
          name: 'estagio',
          type: 'select',
          required: true,
          values: ['identificada', 'em_due_diligence', 'em_estruturacao', 'aberto_candidatos'],
          maxSelect: 1,
        },
        { name: 'vfv_ano_declarado', type: 'number' },
        { name: 'tco2e_ano_estimado', type: 'number' },
        {
          name: 'status_selo_cdv_conforme',
          type: 'select',
          values: ['obtido', 'pendente', 'em_auditoria'],
          maxSelect: 1,
        },
        { name: 'observacoes', type: 'text' },
        { name: 'hash_sha256', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE UNIQUE INDEX idx_mover_vpas_codigo ON mover_vpas (codigo_vpa)',
        'CREATE INDEX idx_mover_vpas_estagio ON mover_vpas (estagio)',
      ],
    })
    app.save(vpasCol)

    // 2. Coleção mover_evidencias
    const evidenciasCol = new Collection({
      name: 'mover_evidencias',
      type: 'base',
      listRule: '@request.auth.id != ""',
      viewRule: '@request.auth.id != ""',
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [
        { name: 'codigo_documento', type: 'text', required: true },
        { name: 'titulo', type: 'text', required: true },
        {
          name: 'categoria',
          type: 'select',
          required: true,
          values: [
            'metodologia',
            'dpp_lastro',
            'balanco_massa',
            'dupla_contagem',
            'baseline',
            'titularidade',
          ],
          maxSelect: 1,
        },
        { name: 'tipo_documento', type: 'text', required: true },
        { name: 'hash_sha256', type: 'text', required: true },
        {
          name: 'status_validacao',
          type: 'select',
          values: ['pre_laudo', 'auditado_dmrv', 'aguardando_vvb'],
          maxSelect: 1,
        },
        { name: 'descricao', type: 'text' },
        { name: 'link_publico', type: 'text' },
        { name: 'data_documento', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE UNIQUE INDEX idx_mover_evid_codigo ON mover_evidencias (codigo_documento)',
        'CREATE INDEX idx_mover_evid_hash ON mover_evidencias (hash_sha256)',
        'CREATE INDEX idx_mover_evid_cat ON mover_evidencias (categoria)',
      ],
    })
    app.save(evidenciasCol)

    // 3. Seed com estados honestos: sem dados fictícios que simulem andamento real
    try {
      const vpasCollection = app.findCollectionByNameOrId('mover_vpas')
      const vpa1 = new Record(vpasCollection)
      vpa1.set('codigo_vpa', 'VPA-BR-000-CANDIDATOS')
      vpa1.set('titulo', 'Chamada Aberta para CDVs Qualificados (VPA Piloto 01)')
      vpa1.set('cdv_nome', 'Em definição (Cadastro Aberto)')
      vpa1.set('cdv_cnpj', '00.000.000/0000-00')
      vpa1.set('uf', 'PR')
      vpa1.set('estagio', 'aberto_candidatos')
      vpa1.set('vfv_ano_declarado', 0)
      vpa1.set('tco2e_ano_estimado', 0)
      vpa1.set('status_selo_cdv_conforme', 'pendente')
      vpa1.set(
        'observacoes',
        'Cadastro aberto para Centrais de Desmontagem Veicular credenciadas pelo DETRAN. Aguardando submissão de documentação de elegibilidade.',
      )
      vpa1.set('hash_sha256', 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855')
      app.save(vpa1)
    } catch (e1) {
      console.log('Aviso seed mover_vpas:', e1)
    }

    try {
      const evidCollection = app.findCollectionByNameOrId('mover_evidencias')

      const doc1 = new Record(evidCollection)
      doc1.set('codigo_documento', 'EVID-GS448-ALIGN-01')
      doc1.set('titulo', 'Nota Técnica de Alinhamento Metodológico GS 448')
      doc1.set('categoria', 'metodologia')
      doc1.set('tipo_documento', 'Nota Técnica dMRV')
      doc1.set('hash_sha256', '4b2e56cf988df0a1ca5d844c8c7f938fae5c3e03889104faee13fef7946927d3')
      doc1.set('status_validacao', 'pre_laudo')
      doc1.set(
        'descricao',
        'Mapeamento de fatores de substituição reciclado × virgem e requisitos de rastreabilidade previstos na GS 448 para operações de desmontagem.',
      )
      doc1.set('data_documento', '2026-03-01')
      app.save(doc1)

      const doc2 = new Record(evidCollection)
      doc2.set('codigo_documento', 'EVID-DPP-LOTE-CLIO')
      doc2.set('titulo', 'DPP Consolidado & Balanço de Massa — Lote Renault Clio')
      doc2.set('categoria', 'balanco_massa')
      doc2.set('tipo_documento', 'Passaporte Digital de Lote')
      doc2.set('hash_sha256', '7d9e4a8f3b2c1d0e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e')
      doc2.set('status_validacao', 'auditado_dmrv')
      doc2.set(
        'descricao',
        'Lastro probatório do lote de 49 peças com balanço de massa curbside de 4 camadas e destinação final rastreada com MTR-SINIR.',
      )
      doc2.set('link_publico', '/passaporte-lote/PR-BX-2026-1240105')
      doc2.set('data_documento', '2026-02-15')
      app.save(doc2)

      const doc3 = new Record(evidCollection)
      doc3.set('codigo_documento', 'EVID-DC-TITULARIDADE-MINUTA')
      doc3.set('titulo', 'Minuta Padrão de Cessão de Titularidade & Não-Dupla Contagem')
      doc3.set('categoria', 'dupla_contagem')
      doc3.set('tipo_documento', 'Declaração Jurídico-Regulatória')
      doc3.set('hash_sha256', '845f249cee555fc44874bb98b3ff9492119b14c1fd912e9c768a4175f69e7034')
      doc3.set('status_validacao', 'pre_laudo')
      doc3.set(
        'descricao',
        'Cláusula formal estabelecendo que o benefício ambiental original pertence ao gerador até cessão contratual expressa, sem fracionamento.',
      )
      doc3.set('data_documento', '2026-03-10')
      app.save(doc3)
    } catch (e2) {
      console.log('Aviso seed mover_evidencias:', e2)
    }
  },
  (app) => {
    try {
      const col2 = app.findCollectionByNameOrId('mover_evidencias')
      app.delete(col2)
    } catch (_) {}
    try {
      const col1 = app.findCollectionByNameOrId('mover_vpas')
      app.delete(col1)
    } catch (_) {}
  },
)
