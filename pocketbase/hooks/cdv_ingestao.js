routerAdd('POST', '/backend/v1/cdv/lotes', (e) => {
  // ACHADO 3: Endpoint legado v1 descontinuado (HTTP 410 Gone)
  // O motor v1 calculava peso x fator linearmente sem fator de desconto (DF=0,30),
  // sem dedup de chassi/peça, sem segregação de claims (confirmado/potencial)
  // e sem arredondamento conservador floor2 (DM-ORB-001 v1.1).
  // Todos os clientes e integrações CDV devem utilizar o endpoint v2:
  // POST /backend/v2/cdv/lotes
  return e.json(410, {
    sucesso: false,
    codigo: 'ENDPOINT_DEPRECATED_V1',
    erro: 'A API de Ingestão de Lotes CDV v1 foi descontinuada (HTTP 410 Gone) em conformidade com o Orbis Protocol DM-ORB-001 v1.1.',
    mensagem:
      'Utilize o endpoint v2 oficial: POST /backend/v2/cdv/lotes. A v2 implementa fator de desconto conservador (DF=0,30), desduplicação canônica por chassi/peça e geração de claims auditáveis.',
    migracao: {
      endpoint_legado: 'POST /backend/v1/cdv/lotes',
      endpoint_vigente: 'POST /backend/v2/cdv/lotes',
      documentacao: '/api-docs/cdv',
      versao_metodologia: 'DM-ORB-001 v1.1',
    },
  })
})
