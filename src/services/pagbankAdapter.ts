/**
 * ADAPTER PAGBANK (PagSeguro / PagBank API v4)
 *
 * Módulo client/service para integração de pagamentos e cobranças PIX via PagBank.
 * Mantém a interface padrão de gateway de pagamento para o ecossistema Orbis Protocol,
 * oferecendo suporte a geração de cobrança PIX (Orders/Charges), consulta de status,
 * webhooks e degradação graciosa caso a credencial (PAGBANK_TOKEN) não esteja cadastrada no cofre.
 *
 * Credencial esperada:
 * - PAGBANK_TOKEN (Token de aplicação ou autenticação Bearer da API PagBank)
 * - PAGBANK_ENV (Opcional: 'sandbox' ou 'production', padrão 'production')
 */

export interface PagBankCustomer {
  name: string
  email: string
  tax_id: string
  phones?: Array<{
    country: string
    area: string
    number: string
    type: 'MOBILE' | 'BUSINESS' | 'HOME'
  }>
}

export interface PagBankQrCodeResponse {
  id: string
  amount: {
    value: number
  }
  text: string
  arrangements: string[]
  links: Array<{
    rel: string
    href: string
    media: string
    type: string
  }>
  expiration_date?: string
}

export interface PagBankOrderResponse {
  id: string
  reference_id: string
  created_at: string
  customer: PagBankCustomer
  items?: Array<{
    reference_id: string
    name: string
    quantity: number
    unit_amount: number
  }>
  qr_codes?: PagBankQrCodeResponse[]
  notification_urls?: string[]
  charges?: Array<{
    id: string
    reference_id: string
    status: 'PAID' | 'AUTHORIZED' | 'IN_ANALYSIS' | 'DECLINED' | 'CANCELED' | 'WAITING' | string
    amount: {
      value: number
      currency: string
      summary?: {
        total: number
        paid: number
        refunded: number
      }
    }
    payment_method?: {
      type: string
      pix?: {
        qr_code?: string
        qr_code_base64?: string
      }
    }
  }>
}

export interface PagBankChargeCreatePayload {
  reference_id: string
  customer: PagBankCustomer
  items: Array<{
    reference_id: string
    name: string
    quantity: number
    unit_amount: number // em centavos: R$ 490,00 -> 49000
  }>
  qr_codes: Array<{
    amount: {
      value: number
    }
    expiration_date?: string
  }>
  notification_urls?: string[]
}

/**
 * Constrói payload de ordem PIX no padrão PagBank v4
 */
export function buildPagBankOrderPayload(params: {
  referenceId: string
  servicoId: string
  servicoNome: string
  valorReais: number
  tomadorNome: string
  tomadorCpfCnpj: string
  tomadorEmail: string
  notificationUrl?: string
  expiracaoMinutos?: number
}): PagBankChargeCreatePayload {
  const cleanDoc = params.tomadorCpfCnpj.replace(/\D/g, '')
  const centavos = Math.round(params.valorReais * 100)
  const expiraMin = params.expiracaoMinutos || 30
  const expiraData = new Date(Date.now() + expiraMin * 60 * 1000).toISOString()

  return {
    reference_id: params.referenceId,
    customer: {
      name: params.tomadorNome.trim(),
      email: params.tomadorEmail.trim(),
      tax_id: cleanDoc,
    },
    items: [
      {
        reference_id: params.servicoId,
        name: `${params.servicoNome} - Orbis Protocol`,
        quantity: 1,
        unit_amount: centavos,
      },
    ],
    qr_codes: [
      {
        amount: {
          value: centavos,
        },
        expiration_date: expiraData,
      },
    ],
    ...(params.notificationUrl ? { notification_urls: [params.notificationUrl] } : {}),
  }
}

/**
 * Extrai dados do PIX (copia e cola, imagem/link) da resposta PagBank
 */
export function extractPagBankPixData(order: PagBankOrderResponse): {
  paymentId: string
  qrCodeText: string
  qrCodePngUrl?: string
  status: string
} {
  const qr = order.qr_codes && order.qr_codes.length > 0 ? order.qr_codes[0] : null
  const pngLink = qr?.links?.find((l) => l.media === 'image/png' || l.rel === 'QRCODE.PNG')?.href

  return {
    paymentId: order.id,
    qrCodeText: qr?.text || '',
    qrCodePngUrl: pngLink,
    status: order.charges && order.charges[0] ? order.charges[0].status : 'WAITING',
  }
}
