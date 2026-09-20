/**
 * MIGRATION 0042: ISOLAMENTO ESTRETO DE COBRANCAS, COMISSOES E PARCEIROS
 *
 * Requisito 2:
 * "Verificar no servidor (hooks/regras do PocketBase) que o isolamento é real
 * e não só de UI: um usuário parceiro NÃO PODE listar comissões, extratos
 * ou dados de outro parceiro nem acessar o dashboard financeiro da casa
 * via chamada direta à API. Corrigir as regras de coleção se necessário."
 *
 * 1. Coleção cobrancas:
 *    - Usuário regular (cliente): vê somente suas próprias cobranças (usuario = @request.auth.id)
 *    - Papéis de governança (admin, financeiro, financeiro_leitor): podem ver todas
 *    - Parceiro: se consultar cobrancas, PODE listar APENAS aquelas indicadas por ele (parceiro_id.usuario = @request.auth.id || usuario = @request.auth.id)
 *      E NÃO PODE ver cobranças de outros clientes ou da casa!
 *
 * 2. Coleção comissoes:
 *    - Leitura estrita pelo parceiro dono (parceiro_id.usuario = @request.auth.id)
 *      ou pelos papéis de governança (admin, financeiro, financeiro_leitor).
 *    - Bloqueada para qualquer outro papel ou parceiro diferente.
 *
 * 3. Coleção parceiros:
 *    - Leitura estrita pelo próprio parceiro (usuario = @request.auth.id)
 *      ou pelos papéis de governança (admin, financeiro, financeiro_leitor).
 *    - Bloqueada para outros usuários.
 */

migrate(
  (app) => {
    // 1. Atualizar regras de RLS em cobrancas
    try {
      const cobrancasCol = app.findCollectionByNameOrId('cobrancas')
      cobrancasCol.listRule =
        "@request.auth.id != '' && (usuario = @request.auth.id || parceiro_id.usuario = @request.auth.id || @request.auth.role = 'admin' || @request.auth.role = 'financeiro' || @request.auth.role = 'financeiro_leitor')"
      cobrancasCol.viewRule =
        "@request.auth.id != '' && (usuario = @request.auth.id || parceiro_id.usuario = @request.auth.id || @request.auth.role = 'admin' || @request.auth.role = 'financeiro' || @request.auth.role = 'financeiro_leitor')"
      app.save(cobrancasCol)
    } catch (eCob) {
      console.log('Erro ao atualizar regras de cobrancas:', eCob)
    }

    // 2. Garantir regras estritas em comissoes
    try {
      const comissoesCol = app.findCollectionByNameOrId('comissoes')
      comissoesCol.listRule =
        "@request.auth.id != '' && (@request.auth.role = 'admin' || @request.auth.role = 'financeiro' || @request.auth.role = 'financeiro_leitor' || parceiro_id.usuario = @request.auth.id)"
      comissoesCol.viewRule =
        "@request.auth.id != '' && (@request.auth.role = 'admin' || @request.auth.role = 'financeiro' || @request.auth.role = 'financeiro_leitor' || parceiro_id.usuario = @request.auth.id)"
      comissoesCol.createRule =
        "@request.auth.id != '' && (@request.auth.role = 'admin' || @request.auth.role = 'financeiro')"
      comissoesCol.updateRule =
        "@request.auth.id != '' && (@request.auth.role = 'admin' || @request.auth.role = 'financeiro')"
      comissoesCol.deleteRule = "@request.auth.id != '' && @request.auth.role = 'admin'"
      app.save(comissoesCol)
    } catch (eCom) {
      console.log('Erro ao atualizar regras de comissoes:', eCom)
    }

    // 3. Garantir regras estritas em parceiros
    try {
      const parceirosCol = app.findCollectionByNameOrId('parceiros')
      parceirosCol.listRule =
        "@request.auth.id != '' && (@request.auth.role = 'admin' || @request.auth.role = 'financeiro' || @request.auth.role = 'financeiro_leitor' || usuario = @request.auth.id)"
      parceirosCol.viewRule =
        "@request.auth.id != '' && (@request.auth.role = 'admin' || @request.auth.role = 'financeiro' || @request.auth.role = 'financeiro_leitor' || usuario = @request.auth.id)"
      parceirosCol.createRule =
        "@request.auth.id != '' && (@request.auth.role = 'admin' || @request.auth.role = 'financeiro')"
      parceirosCol.updateRule =
        "@request.auth.id != '' && (@request.auth.role = 'admin' || @request.auth.role = 'financeiro' || (usuario = @request.auth.id && @request.body.status:isset = false && @request.body.percentual_comissao:isset = false && @request.body.documento_fiscal_validado:isset = false))"
      parceirosCol.deleteRule = "@request.auth.id != '' && @request.auth.role = 'admin'"
      app.save(parceirosCol)
    } catch (eParc) {
      console.log('Erro ao atualizar regras de parceiros:', eParc)
    }
  },
  (app) => {
    // Reversão defensiva
  },
)
