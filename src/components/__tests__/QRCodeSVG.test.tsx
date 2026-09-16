import { describe, it, expect } from 'vitest'
import React from 'react'
import { renderToString } from 'react-dom/server'
import jsQR from 'jsqr'
import { QRCodeSVG } from '../QRCodeSVG'

/**
 * Helper para decodificar o HTML de um componente <QRCodeSVG /> via jsQR.
 * Extrai a dimensão do viewBox e os retângulos de módulos desenhados no SVG
 * (usando a string do path com formato "M{x} {y}h{w}v1h-{w}Z"), projeta
 * em um buffer RGBA e decodifica com o algoritmo de leitura óptica do jsQR.
 */
function decodeSvgToQrData(svgHtml: string): string | null {
  // Extrair dimensão do viewBox="0 0 N N"
  const viewBoxMatch = svgHtml.match(/viewBox="0 0 (\d+) (\d+)"/)
  if (!viewBoxMatch) {
    return null
  }

  const totalSize = parseInt(viewBoxMatch[1], 10)
  if (!totalSize || totalSize <= 0) {
    return null
  }

  // Extrair o comando d="..." do path dos módulos escuros
  const pathMatch = svgHtml.match(/<path[^>]*d="([^"]+)"/)
  if (!pathMatch) {
    return null
  }
  const pathD = pathMatch[1]

  // Inicializar grid de módulos
  const grid: boolean[][] = Array.from({ length: totalSize }, () =>
    new Array(totalSize).fill(false),
  )

  // O componente QRCodeSVG gera o path com segmentos: M{x} {y}h{len}v1h-{len}Z
  const segmentRegex = /M(\d+)\s+(\d+)h(\d+)v1h-\d+Z/g
  let match: RegExpExecArray | null
  while ((match = segmentRegex.exec(pathD)) !== null) {
    const startX = parseInt(match[1], 10)
    const y = parseInt(match[2], 10)
    const len = parseInt(match[3], 10)
    for (let x = startX; x < startX + len; x++) {
      if (y >= 0 && y < totalSize && x >= 0 && x < totalSize) {
        grid[y][x] = true
      }
    }
  }

  // Cria buffer RGBA com escala 4x para leitura óptica nítida pelo jsQR
  const scale = 4
  const pixelWidth = totalSize * scale
  const pixelHeight = totalSize * scale
  const rgba = new Uint8ClampedArray(pixelWidth * pixelHeight * 4)

  for (let py = 0; py < pixelHeight; py++) {
    const modY = Math.floor(py / scale)
    for (let px = 0; px < pixelWidth; px++) {
      const modX = Math.floor(px / scale)
      const isDark = grid[modY]?.[modX] ?? false
      const color = isDark ? 0 : 255
      const idx = (py * pixelWidth + px) * 4
      rgba[idx] = color // R
      rgba[idx + 1] = color // G
      rgba[idx + 2] = color // B
      rgba[idx + 3] = 255 // A
    }
  }

  const result = jsQR(rgba, pixelWidth, pixelHeight)
  return result?.data ?? null
}

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

  it('decodes directly from the rendered <QRCodeSVG /> output for platform DPP URLs (real scannability check)', () => {
    const platformUrls = [
      'https://orbisprotocol.goskip.app/passaporte-lote/PR-BX-2026-1240105?via=qr',
      'https://orbisprotocol.goskip.app/passaporte/PR-SEAL-2026-991823?via=qr',
      'https://orbisprotocol.goskip.app/bureau/fornecedor/CDV-CURITIBA-01?via=qr',
      '00020126580014br.gov.bcb.pix0136123e4567-e89b-12d3-a456-4266141740005204000053039865406150.005802BR5913OrbisProtocol6008Curitiba62070503***6304ABCD',
    ]

    for (const url of platformUrls) {
      const html = renderToString(<QRCodeSVG value={url} size={200} />)
      const decoded = decodeSvgToQrData(html)
      expect(decoded).toBe(url)
    }
  })

  it('handles empty value gracefully without throwing', () => {
    const html = renderToString(<QRCodeSVG value="" size={100} />)
    expect(html).toContain('<svg')
    expect(html).toContain('width="100"')
    expect(html).not.toContain('<path')
  })

  it('handles invalid or non-string value gracefully', () => {
    const html = renderToString(<QRCodeSVG value={null as unknown as string} size={120} />)
    expect(html).toContain('<svg')
    expect(html).toContain('width="120"')
  })
})
