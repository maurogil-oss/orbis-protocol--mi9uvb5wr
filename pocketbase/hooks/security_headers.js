/**
 * CABEÇALHOS DE SEGURANÇA SERVER-SIDE - ORBIS PROTOCOL (Pré-Pentest)
 *
 * Adiciona cabeçalhos defensivos de proteção contra MIME sniffing, clickjacking,
 * vazamento de referrer e restrição de fontes de execução (Content-Security-Policy):
 * - X-Content-Type-Options: nosniff
 * - X-Frame-Options: DENY
 * - Referrer-Policy: strict-origin-when-cross-origin
 * - Content-Security-Policy: permissiva para os serviços essenciais da plataforma
 *   (fontes Google, script Vite/inline, APIs BrasilAPI, InfoSimples, Mercado Pago, Skip Cloud)
 *   sem comprometer a integridade e sem quebrar os fluxos em execução.
 */

routerUse((e) => {
  // 1. Bloqueio de acesso ao painel administrativo PocketBase (rota /_/)
  // Toda requisição cujo caminho comece com /_/ responde 404 JSON, exceto
  // se vier de IP expressamente autorizado da equipe técnica
  const req = e.request
  const urlPath = (req && req.url ? req.url.path : '') || ''
  if (urlPath.startsWith('/_/')) {
    let clientIp = '127.0.0.1'
    try {
      const info = e.requestInfo()
      if (info && info.headers) {
        const fwd =
          info.headers['x-forwarded-for'] || info.headers['x-real-ip'] || info.remoteIP || ''
        clientIp = String(fwd).split(',')[0].trim() || '127.0.0.1'
      }
    } catch (_) {
      clientIp = '127.0.0.1'
    }

    // Obter lista de IPs autorizados via env / cofre (ADMIN_ALLOWED_IPS)
    const allowedEnv = ($os.getenv('ADMIN_ALLOWED_IPS') || '').trim()
    let isAllowed = false

    if (allowedEnv) {
      const listaIps = allowedEnv
        .split(',')
        .map((ip) => ip.trim())
        .filter(Boolean)
      if (listaIps.indexOf(clientIp) !== -1) {
        isAllowed = true
      }
    } else {
      // Se a variável não estiver definida, bloqueia tudo que não seja localhost
      const isLocalhost =
        clientIp === '127.0.0.1' ||
        clientIp === '::1' ||
        clientIp === 'localhost' ||
        clientIp === '0.0.0.0'
      if (isLocalhost) {
        isAllowed = true
      }
    }

    if (!isAllowed) {
      // Resposta 404 JSON padronizada ocultando existência do painel
      return e.json(404, {
        code: 404,
        message: 'The requested resource was not found.',
        data: {},
      })
    }
  }

  const res = e.response
  if (res && res.header) {
    // 1. Prevenção de MIME Sniffing
    res.header().set('X-Content-Type-Options', 'nosniff')

    // 2. Prevenção contra Clickjacking
    res.header().set('X-Frame-Options', 'DENY')

    // 3. Política de Referrer estrita
    res.header().set('Referrer-Policy', 'strict-origin-when-cross-origin')

    // 4. Content Security Policy equilibrada para SPA + APIs fiscais e de pagamento
    const cspPolicy = [
      "default-src 'self' https: data: blob:",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://assets.pagseguro.com.br https://sdk.mercadopago.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' data: blob: https://img.usecurling.com https://assets.pagseguro.com.br https://*.pagseguro.uol.com.br https://*.pagbank.com.br https://http2.mlstatic.com https://*.mercadopago.com",
      "connect-src 'self' https: wss: http://127.0.0.1:* http://localhost:* https://brasilapi.com.br https://api.infosimples.com https://api.pagseguro.com https://sandbox.api.pagseguro.com https://api.mercadopago.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ')

    res.header().set('Content-Security-Policy', cspPolicy)
  }

  return e.next()
})
