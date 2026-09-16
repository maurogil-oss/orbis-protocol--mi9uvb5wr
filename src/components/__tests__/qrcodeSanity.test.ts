import { describe, it, expect } from 'vitest'
import QRCode from 'qrcode'

describe('qrcode library sanity check', () => {
  it('QRCode.create generates modules synchronously', () => {
    const qr = QRCode.create(
      'https://orbisprotocol.goskip.app/passaporte/PR-BX-2026-1240105?via=qr',
      {
        errorCorrectionLevel: 'M',
      },
    )
    expect(qr).toBeDefined()
    expect(qr.modules).toBeDefined()
    expect(qr.modules.size).toBeGreaterThan(0)
    expect(qr.modules.data).toBeInstanceOf(Uint8Array)
  })

  it('QRCode.toString generates svg', async () => {
    const svg = await QRCode.toString(
      'https://orbisprotocol.goskip.app/passaporte/PR-BX-2026-1240105?via=qr',
      {
        type: 'svg',
        errorCorrectionLevel: 'M',
        margin: 1,
        color: {
          dark: '#0A0E12',
          light: '#FFFFFF',
        },
      },
    )
    expect(svg).toContain('<svg')
    expect(svg).toContain('</svg>')
  })
})
