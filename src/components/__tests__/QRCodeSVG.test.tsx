import { describe, it, expect } from 'vitest'
import React from 'react'
import { renderToString } from 'react-dom/server'
import QRCode from 'qrcode'
import jsQR from 'jsqr'
import { QRCodeSVG } from '../QRCodeSVG'

describe('QRCodeSVG Component & QR Scannability', () => {
  it('renders SVG element with title and valid dimensions', () => {
    const html = renderToString(
      <QRCodeSVG
        value="https://orbisprotocol.goskip.app/passaporte/PR-BX-2026-1240105?via=qr"
        size={180}
        title="QR Code DPP Teste"
      />,
    )

    expect(html).toContain('<svg')
    expect(html).toContain('width="180"')
    expect(html).toContain('height="180"')
    expect(html).toContain('<title>QR Code DPP Teste</title>')
    expect(html).toContain('<path')
    expect(html).toContain('fill="#0A0E12"')
  })

  it('renders custom bgColor and fgColor correctly', () => {
    const html = renderToString(
      <QRCodeSVG
        value="https://orbisprotocol.goskip.app/passaporte-lote/PR-BX-2026-1240105?via=qr"
        bgColor="#F9FAFB"
        fgColor="#000000"
      />,
    )

    expect(html).toContain('fill="#F9FAFB"')
    expect(html).toContain('fill="#000000"')
  })

  it('generates a decodable QR code matrix adhering to ISO/IEC 18004 for platform DPP URLs', () => {
    const testUrls = [
      'https://orbisprotocol.goskip.app/passaporte/PR-BX-2026-1240105?via=qr',
      'https://orbisprotocol.goskip.app/passaporte-lote/PR-BX-2026-1240105?via=qr',
      'https://orbisprotocol.goskip.app/bureau/fornecedor/CDV-CURITIBA-01?via=qr',
      '00020126580014br.gov.bcb.pix0136123e4567-e89b-12d3-a456-4266141740005204000053039865406150.005802BR5913OrbisProtocol6008Curitiba62070503***6304ABCD',
    ]

    for (const url of testUrls) {
      const qr = QRCode.create(url, { errorCorrectionLevel: 'M' })
      const moduleCount = qr.modules.size
      const data = qr.modules.data
      const margin = 4
      const imageSize = moduleCount + margin * 2

      // Render to RGBA pixel buffer to feed into jsQR decoder
      const rgba = new Uint8ClampedArray(imageSize * imageSize * 4)

      for (let y = 0; y < imageSize; y++) {
        for (let x = 0; x < imageSize; x++) {
          const idx = (y * imageSize + x) * 4
          const modX = x - margin
          const modY = y - margin

          let isDark = false
          if (modX >= 0 && modX < moduleCount && modY >= 0 && modY < moduleCount) {
            isDark = Boolean(data[modY * moduleCount + modX])
          }

          const color = isDark ? 0 : 255
          rgba[idx] = color // R
          rgba[idx + 1] = color // G
          rgba[idx + 2] = color // B
          rgba[idx + 3] = 255 // A
        }
      }

      const decoded = jsQR(rgba, imageSize, imageSize)
      expect(decoded).not.toBeNull()
      expect(decoded?.data).toBe(url)
    }
  })

  it('handles empty value gracefully without throwing', () => {
    const html = renderToString(<QRCodeSVG value="" size={100} />)
    expect(html).toContain('<svg')
    expect(html).toContain('width="100"')
  })
})
