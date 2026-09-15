migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    let adminUserId = ''

    // 1. Seed admin user maurog1@hotmail.com / Skip@Pass
    try {
      const existing = app.findAuthRecordByEmail('_pb_users_auth_', 'maurog1@hotmail.com')
      adminUserId = existing.id
    } catch (_) {
      const record = new Record(users)
      record.setEmail('maurog1@hotmail.com')
      record.setPassword('Skip@Pass')
      record.setVerified(true)
      record.set('name', 'Mauro Gestor Orbis')
      app.save(record)
      adminUserId = record.id
    }

    // 2. Seed 5 modelos de teste
    const leadsCol = app.findCollectionByNameOrId('leads_diagnostico')
    const modelos = [
      {
        cnpj: '76.123.456/0001-12',
        razao_social: 'Distribuidora de Alimentos & Bebidas Brasil S.A.',
        email: 'contato@alimentosbrasil.com.br',
        whatsapp: '(41) 99123-4567',
        responsavel: 'Carlos Eduardo Silva',
        categoria_profissional: 'Empresário / Diretor / Gestor da Empresa',
        conselho: 'CRA-PR 12948',
        vinculo_institucional: 'Associado ACP (Paraná)',
        regime_tributario: 'Lucro Presumido',
        status: 'novo',
      },
      {
        cnpj: '14.882.310/0001-44',
        razao_social: 'Metalúrgica & Peças Industriais Confiança Ltda',
        email: 'fiscal@confiancametal.ind.br',
        whatsapp: '(11) 98765-4321',
        responsavel: 'Roberto Antunes Mendes',
        categoria_profissional: 'Engenheiro Mecânico / Ambiental (CREA - Resp. Técnico)',
        conselho: 'CREA-SP 5061234',
        vinculo_institucional: 'Mercado Nacional (Bahia, SP, Brasil)',
        regime_tributario: 'Lucro Real',
        status: 'em_analise',
      },
      {
        cnpj: '43.904.740/0001-44',
        razao_social: 'Transportes & Logística de Cargas Expresso Verde Ltda',
        email: 'sustentabilidade@expressoverde.com.br',
        whatsapp: '(71) 99234-8899',
        responsavel: 'Mariana Barreto Costa',
        categoria_profissional: 'Consultor de Sustentabilidade & Compliance',
        conselho: 'CRBio 04981',
        vinculo_institucional: 'Mercado Nacional (Bahia, SP, Brasil)',
        regime_tributario: 'Lucro Real',
        status: 'em_analise',
      },
      {
        cnpj: '18.394.029/0001-88',
        razao_social: 'Centro de Desmontagem Veicular Renova Peças (CDV DETRAN)',
        email: 'diretoria@renovacdv.com.br',
        whatsapp: '(19) 98112-9900',
        responsavel: 'Felipe Nogueira',
        categoria_profissional: 'Centro de Desmontagem Veicular (CDV / Desmanche Credenciado)',
        conselho: 'DETRAN-SP 0842/2022',
        vinculo_institucional: 'Cadeia Automotiva / CDV (Programa MOVER)',
        regime_tributario: 'Lucro Presumido',
        status: 'concluido',
      },
      {
        cnpj: '19.958.964/0001-01',
        razao_social: 'Comércio & Serviços Varejistas Prime Ltda (MGM)',
        email: 'diretoria@mgmconsultoria.com.br',
        whatsapp: '(41) 99876-0011',
        responsavel: 'Mauro Gilberto',
        categoria_profissional: 'Contador / Auditor Independente (CRC)',
        conselho: 'CRC-PR 054812',
        vinculo_institucional: 'Associado ACP (Paraná)',
        regime_tributario: 'Simples Nacional',
        status: 'concluido',
      },
    ]

    for (let i = 0; i < modelos.length; i++) {
      const mod = modelos[i]
      try {
        app.findFirstRecordByData('leads_diagnostico', 'cnpj', mod.cnpj)
      } catch (_) {
        const rec = new Record(leadsCol)
        rec.set('cnpj', mod.cnpj)
        rec.set('razao_social', mod.razao_social)
        rec.set('email', mod.email)
        rec.set('whatsapp', mod.whatsapp)
        rec.set('responsavel', mod.responsavel)
        rec.set('categoria_profissional', mod.categoria_profissional)
        rec.set('conselho', mod.conselho)
        rec.set('vinculo_institucional', mod.vinculo_institucional)
        rec.set('regime_tributario', mod.regime_tributario)
        rec.set('status', mod.status)
        if (adminUserId) {
          rec.set('usuario', adminUserId)
        }
        app.save(rec)
      }
    }

    // 3. Seed 3 selos de exemplo
    const selosCol = app.findCollectionByNameOrId('selos')
    const selosExemplo = [
      {
        codigo_selo: 'ORB-2024-0001',
        empresa: 'Distribuidora de Alimentos & Bebidas Brasil S.A.',
        cnpj: '76.123.456/0001-12',
        status: 'ativo',
        data_emissao: '2024-03-15 00:00:00.000Z',
        data_validade: '2026-03-15 00:00:00.000Z',
      },
      {
        codigo_selo: 'ORB-2024-0002',
        empresa: 'Metalúrgica & Peças Industriais Confiança Ltda',
        cnpj: '14.882.310/0001-44',
        status: 'ativo',
        data_emissao: '2024-04-10 00:00:00.000Z',
        data_validade: '2026-04-10 00:00:00.000Z',
      },
      {
        codigo_selo: 'ORB-2024-0003',
        empresa: 'Transportes & Logística de Cargas Expresso Verde Ltda',
        cnpj: '43.904.740/0001-44',
        status: 'ativo',
        data_emissao: '2024-05-20 00:00:00.000Z',
        data_validade: '2026-05-20 00:00:00.000Z',
      },
    ]

    for (let j = 0; j < selosExemplo.length; j++) {
      const s = selosExemplo[j]
      try {
        app.findFirstRecordByData('selos', 'codigo_selo', s.codigo_selo)
      } catch (_) {
        const recSelo = new Record(selosCol)
        recSelo.set('codigo_selo', s.codigo_selo)
        recSelo.set('empresa', s.empresa)
        recSelo.set('cnpj', s.cnpj)
        recSelo.set('status', s.status)
        recSelo.set('data_emissao', s.data_emissao)
        recSelo.set('data_validade', s.data_validade)
        app.save(recSelo)
      }
    }
  },
  (app) => {
    // down migration
  },
)
