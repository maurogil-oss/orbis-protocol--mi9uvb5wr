/**
 * MIGRATION 0030: SANITIZAÇÃO DE MARCA DE TERCEIROS NÃO AUTORIZADOS ("RENOVA")
 *
 * Regra da casa: nenhum nome de terceiro sem contrato formalizado pode aparecer em texto público ou dados de demonstração.
 * As menções legítimas a "RenovaBio" / CBIOs (Lei Federal 13.576/2017) são políticas públicas federais e DEVEM SER PRESERVADAS.
 * Esta migration faz uma varredura preventiva em todas as coleções que armazenam nomes, títulos ou razões sociais
 * e substitui qualquer menção a nomes fictícios como "Renova Peças", "Renova Ecopeças", etc., por termos genéricos neutros.
 */

migrate(
  (app) => {
    // 1. Atualizar leads_diagnostico se houver algum resquício de "Renova" em razao_social ou email
    try {
      app
        .db()
        .newQuery(
          `UPDATE leads_diagnostico
           SET razao_social = 'CDV Modelo — Demonstração Operacional (Credenciado DETRAN)',
               email = 'contato@cdvmodelo.com.br'
           WHERE (razao_social LIKE '%Renova%' AND razao_social NOT LIKE '%RenovaBio%')
              OR email LIKE '%renova%'`,
        )
        .execute()
    } catch (e1) {
      console.log('Aviso migration 0030 (leads_diagnostico):', e1)
    }

    // 2. Atualizar selos se houver empresa com 'Renova' que não seja RenovaBio
    try {
      app
        .db()
        .newQuery(
          `UPDATE selos
           SET empresa = 'Centro de Desmontagem Veicular Modelo Ltda'
           WHERE empresa LIKE '%Renova%' AND empresa NOT LIKE '%RenovaBio%'`,
        )
        .execute()
    } catch (e2) {
      console.log('Aviso migration 0030 (selos):', e2)
    }

    // 3. Atualizar cdv_lotes e cdv_pecas se houver cdv_nome com 'Renova'
    try {
      app
        .db()
        .newQuery(
          `UPDATE cdv_lotes
           SET cdv_nome = 'CDVerde Centro de Desmontagem Veicular'
           WHERE cdv_nome LIKE '%Renova%' AND cdv_nome NOT LIKE '%RenovaBio%'`,
        )
        .execute()

      app
        .db()
        .newQuery(
          `UPDATE cdv_pecas
           SET cdv_origem = 'CDVerde Centro de Desmontagem Veicular'
           WHERE cdv_origem LIKE '%Renova%' AND cdv_origem NOT LIKE '%RenovaBio%'`,
        )
        .execute()
    } catch (e3) {
      console.log('Aviso migration 0030 (cdv_lotes/pecas):', e3)
    }

    // 4. Atualizar dpp_destinacao_final
    try {
      app
        .db()
        .newQuery(
          `UPDATE dpp_destinacao_final
           SET razao_social_destinador = 'Siderurgia & Reciclagem de Metais do Brasil S.A.'
           WHERE razao_social_destinador LIKE '%Renova%' AND razao_social_destinador NOT LIKE '%RenovaBio%'`,
        )
        .execute()
    } catch (e4) {
      console.log('Aviso migration 0030 (dpp_destinacao_final):', e4)
    }

    // 5. Atualizar corporativo_demo
    try {
      app
        .db()
        .newQuery(
          `UPDATE corporativo_demo
           SET razao_social_parceiro = 'Fornecedor Credenciado Nacional S.A.'
           WHERE razao_social_parceiro LIKE '%Renova%' AND razao_social_parceiro NOT LIKE '%RenovaBio%'`,
        )
        .execute()
    } catch (e5) {
      console.log('Aviso migration 0030 (corporativo_demo):', e5)
    }
  },
  (app) => {
    // down migration: noop
  },
)
