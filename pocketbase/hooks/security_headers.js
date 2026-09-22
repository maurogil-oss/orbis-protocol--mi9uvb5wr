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
