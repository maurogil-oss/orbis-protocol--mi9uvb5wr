/// <reference path="../pb_data/types.d.ts" />

/**
 * Migration 0123: Reforço e Auditoria de API Rules de Backend
 *
 * Objetivo da Etapa 5, peça 5b (Piloto ACP):
 * 1. Isolamento estrito de dados entre empresas:
 *    - `cdv_lotes`: list e view antes públicos ("") agora exigem autenticação e isolam por CNPJ (`cdv_cnpj = @request.auth.cnpj`),
 *      preservando acesso pericial legítimo (master, admin, perito) e lotes de demonstração (`is_demo = true`).
 *    - `cdv_pecas`: list e view antes públicos ("") agora isolam por CNPJ da peça ou do lote, preservando acesso pericial e demo.
 *    - `nfe_upload`: reforço do isolamento por usuário (`usuario = @request.auth.id`), mantendo acesso pericial (master, admin, perito).
 *      Acesso restrito para admin_acp (admin_acp não lê notas individuais brutas).
 * 2. Proteção de convites ACP (`convites_acp`):
 *    - Leitura, listagem e mutação exclusivas para `admin_acp`, `admin` e `master`.
 *    - Validação de tokens por convidados públicos realizada exclusivamente via endpoint seguro dedicado (/backend/v1/acp/convites/validar/{token}).
 * 3. Proteção pericial de dossiês e inventários (`emissoes_inventario`, `simulacoes_credito_verde`, `cliente_certificados_a1`):
 *    - Isolamento por usuário (`usuario = @request.auth.id`) com acesso pericial exclusivo (master, admin, perito).
 */
migrate(
  (app) => {
    // 1. cdv_lotes — fechar leitura aberta ("") e isolar por empresa (cdv_cnpj)
    try {
      const lotesCol = app.findCollectionByNameOrId('cdv_lotes')
      lotesCol.listRule =
        "@request.auth.id != '' && (@request.auth.role = 'master' || @request.auth.role = 'admin' || @request.auth.role = 'perito' || (@request.auth.cnpj != '' && cdv_cnpj = @request.auth.cnpj) || is_demo = true)"
      lotesCol.viewRule =
        "@request.auth.id != '' && (@request.auth.role = 'master' || @request.auth.role = 'admin' || @request.auth.role = 'perito' || (@request.auth.cnpj != '' && cdv_cnpj = @request.auth.cnpj) || is_demo = true)"
      lotesCol.createRule =
        "@request.auth.id != '' && (@request.auth.role = 'master' || @request.auth.role = 'admin')"
      lotesCol.updateRule =
        "@request.auth.id != '' && (@request.auth.role = 'master' || @request.auth.role = 'admin')"
      lotesCol.deleteRule =
        "@request.auth.id != '' && (@request.auth.role = 'master' || @request.auth.role = 'admin')"
      app.save(lotesCol)
      console.log('[Migration 0123] cdv_lotes API rules endurecidas com sucesso.')
    } catch (err) {
      console.log('[Migration 0123] Erro ao endurecer cdv_lotes:', err)
    }

    // 2. cdv_pecas — fechar leitura aberta ("") e isolar por empresa
    try {
      const pecasCol = app.findCollectionByNameOrId('cdv_pecas')
      pecasCol.listRule =
        "@request.auth.id != '' && (@request.auth.role = 'master' || @request.auth.role = 'admin' || @request.auth.role = 'perito' || (@request.auth.cnpj != '' && cdv_cnpj = @request.auth.cnpj) || (@request.auth.cnpj != '' && lote.cdv_cnpj = @request.auth.cnpj) || lote.is_demo = true)"
      pecasCol.viewRule =
        "@request.auth.id != '' && (@request.auth.role = 'master' || @request.auth.role = 'admin' || @request.auth.role = 'perito' || (@request.auth.cnpj != '' && cdv_cnpj = @request.auth.cnpj) || (@request.auth.cnpj != '' && lote.cdv_cnpj = @request.auth.cnpj) || lote.is_demo = true)"
      pecasCol.createRule =
        "@request.auth.id != '' && (@request.auth.role = 'master' || @request.auth.role = 'admin')"
      pecasCol.updateRule =
        "@request.auth.id != '' && (@request.auth.role = 'master' || @request.auth.role = 'admin')"
      pecasCol.deleteRule =
        "@request.auth.id != '' && (@request.auth.role = 'master' || @request.auth.role = 'admin')"
      app.save(pecasCol)
      console.log('[Migration 0123] cdv_pecas API rules endurecidas com sucesso.')
    } catch (err) {
      console.log('[Migration 0123] Erro ao endurecer cdv_pecas:', err)
    }

    // 3. nfe_upload — reforço de isolamento e inclusão formal do master
    try {
      const nfeCol = app.findCollectionByNameOrId('nfe_upload')
      nfeCol.listRule =
        "@request.auth.id != '' && (usuario = @request.auth.id || @request.auth.role = 'master' || @request.auth.role = 'admin' || @request.auth.role = 'perito')"
      nfeCol.viewRule =
        "@request.auth.id != '' && (usuario = @request.auth.id || @request.auth.role = 'master' || @request.auth.role = 'admin' || @request.auth.role = 'perito')"
      nfeCol.createRule =
        "@request.auth.id != '' && (usuario = @request.auth.id || @request.auth.role = 'master' || @request.auth.role = 'admin')"
      nfeCol.updateRule =
        "@request.auth.id != '' && (usuario = @request.auth.id || @request.auth.role = 'master' || @request.auth.role = 'admin' || @request.auth.role = 'perito')"
      nfeCol.deleteRule =
        "@request.auth.id != '' && (usuario = @request.auth.id || @request.auth.role = 'master' || @request.auth.role = 'admin')"
      app.save(nfeCol)
      console.log('[Migration 0123] nfe_upload API rules reforçadas com sucesso.')
    } catch (err) {
      console.log('[Migration 0123] Erro ao reforçar nfe_upload:', err)
    }

    // 4. convites_acp — validação de integridade das rules restritas
    try {
      const convitesCol = app.findCollectionByNameOrId('convites_acp')
      if (convitesCol) {
        convitesCol.listRule =
          "@request.auth.id != '' && (@request.auth.role = 'admin_acp' || @request.auth.role = 'master' || @request.auth.role = 'admin')"
        convitesCol.viewRule =
          "@request.auth.id != '' && (@request.auth.role = 'admin_acp' || @request.auth.role = 'master' || @request.auth.role = 'admin')"
        convitesCol.createRule =
          "@request.auth.id != '' && (@request.auth.role = 'admin_acp' || @request.auth.role = 'master' || @request.auth.role = 'admin')"
        convitesCol.updateRule =
          "@request.auth.id != '' && (@request.auth.role = 'admin_acp' || @request.auth.role = 'master' || @request.auth.role = 'admin')"
        convitesCol.deleteRule =
          "@request.auth.id != '' && (@request.auth.role = 'admin_acp' || @request.auth.role = 'master' || @request.auth.role = 'admin')"
        app.save(convitesCol)
        console.log('[Migration 0123] convites_acp API rules confirmadas com sucesso.')
      }
    } catch (err) {
      console.log('[Migration 0123] Erro ao validar convites_acp:', err)
    }

    // 5. emissoes_inventario & certificados — inclusão explícita de master e isolamento
    try {
      const invCol = app.findCollectionByNameOrId('emissoes_inventario')
      if (invCol) {
        invCol.listRule =
          "@request.auth.id != '' && (usuario = @request.auth.id || @request.auth.role = 'master' || @request.auth.role = 'admin' || @request.auth.role = 'perito')"
        invCol.viewRule =
          "@request.auth.id != '' && (usuario = @request.auth.id || @request.auth.role = 'master' || @request.auth.role = 'admin' || @request.auth.role = 'perito')"
        invCol.createRule = "@request.auth.id != ''"
        invCol.updateRule =
          "@request.auth.id != '' && (usuario = @request.auth.id || @request.auth.role = 'master' || @request.auth.role = 'admin' || @request.auth.role = 'perito')"
        invCol.deleteRule =
          "@request.auth.id != '' && (@request.auth.role = 'master' || @request.auth.role = 'admin')"
        app.save(invCol)
      }
    } catch (_) {}

    try {
      const certCol = app.findCollectionByNameOrId('cliente_certificados_a1')
      if (certCol) {
        certCol.listRule =
          "@request.auth.id != '' && (usuario = @request.auth.id || @request.auth.role = 'master' || @request.auth.role = 'admin')"
        certCol.viewRule =
          "@request.auth.id != '' && (usuario = @request.auth.id || @request.auth.role = 'master' || @request.auth.role = 'admin')"
        certCol.createRule = "@request.auth.id != ''"
        certCol.updateRule =
          "@request.auth.id != '' && (usuario = @request.auth.id || @request.auth.role = 'master' || @request.auth.role = 'admin')"
        certCol.deleteRule =
          "@request.auth.id != '' && (usuario = @request.auth.id || @request.auth.role = 'master' || @request.auth.role = 'admin')"
        app.save(certCol)
      }
    } catch (_) {}
  },
  (app) => {
    // Rollback para estado pré-0123
    try {
      const lotesCol = app.findCollectionByNameOrId('cdv_lotes')
      lotesCol.listRule = ''
      lotesCol.viewRule = ''
      app.save(lotesCol)
    } catch (_) {}

    try {
      const pecasCol = app.findCollectionByNameOrId('cdv_pecas')
      pecasCol.listRule = ''
      pecasCol.viewRule = ''
      app.save(pecasCol)
    } catch (_) {}
  },
)
