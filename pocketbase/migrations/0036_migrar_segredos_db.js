/**
 * MIGRATION 0036: LIMPEZA DE SEGREDOS SENSÍVEIS DO BANCO
 *
 * Remove o valor sensível em texto claro de app_config_secrets, mantendo apenas
 * a referência de chave e descrição indicando que o valor agora reside em variáveis
 * de ambiente (process.env / $os.getenv).
 */

migrate(
  (app) => {
    try {
      const rec = app.findFirstRecordByData('app_config_secrets', 'chave', 'INFOSIMPLES_TOKEN')
      if (rec) {
        rec.set('valor', '[MIGRADO_PARA_ENV_VAR]')
        rec.set(
          'descricao',
          'Token InfoSimples migrado com sucesso para o cofre de variáveis de ambiente ($os.getenv/INFOSIMPLES_TOKEN).',
        )
        app.save(rec)
      }
    } catch (_) {}
  },
  (app) => {},
)
