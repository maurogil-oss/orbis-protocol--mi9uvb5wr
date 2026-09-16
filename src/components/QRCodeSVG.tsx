import React, { useId, useMemo } from 'react'
import QRCode from 'qrcode'

export interface QRCodeSVGProps {
  value: string
  size?: number
  bgColor?: string
  fgColor?: string
  className?: string
  title?: string
}

/**
 * Gerador de QR Code vetorial nativo (SVG) em conformidade com o padrão ISO/IEC 18004.
 * Utiliza correção de erro de nível M (Medium - até 15% de recuperação) e gera
 * a matriz real de dados codificados para leitura imediata por câmeras e leitores ópticos.
 */
export function QRCodeSVG({
  value,
  size = 140,
  bgColor = '#FFFFFF',
  fgColor = '#0A0E12',
  className = '',
  title = 'QR Code de Autenticidade',
}: QRCodeSVGProps) {
  const clipId = useId()

  const qrData = useMemo(() => {
    if (!value || typeof value !== 'string') {
      return null
    }

    try {
      const qr = QRCode.create(value, {
        errorCorrectionLevel: 'M',
      })

      const moduleCount = qr.modules.size
      const data = qr.modules.data
      const margin = 2
      const totalSize = moduleCount + margin * 2

      // Constrói o path SVG vetorial dos módulos escuros (otimizado com linhas horizontais contínuas)
      let path = ''
      for (let r = 0; r < moduleCount; r++) {
        let runStart = -1
        for (let c = 0; c < moduleCount; c++) {
          const isDark = Boolean(data[r * moduleCount + c])
          if (isDark) {
            if (runStart === -1) {
              runStart = c
            }
          } else {
            if (runStart !== -1) {
              const runLength = c - runStart
              path += `M${margin + runStart} ${margin + r}h${runLength}v1h-${runLength}Z `
              runStart = -1
            }
          }
        }
        if (runStart !== -1) {
          const runLength = moduleCount - runStart
          path += `M${margin + runStart} ${margin + r}h${runLength}v1h-${runLength}Z `
        }
      }

      return {
        totalSize,
        path,
      }
    } catch (err) {
      console.error('[QRCodeSVG] Erro ao codificar valor:', err)
      return null
    }
  }, [value])

  if (!qrData) {
    return (
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className={`rounded-lg ${className}`}
        role="img"
        aria-label={title}
      >
        <title>{title}</title>
        <rect width={size} height={size} fill={bgColor} rx="6" />
      </svg>
    )
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${qrData.totalSize} ${qrData.totalSize}`}
      className={`rounded-lg ${className}`}
      role="img"
      aria-label={title}
      shapeRendering="crispEdges"
    >
      <title>{title}</title>
      <defs>
        <clipPath id={clipId}>
          <rect width={qrData.totalSize} height={qrData.totalSize} rx="1.5" />
        </clipPath>
      </defs>
      <rect width={qrData.totalSize} height={qrData.totalSize} fill={bgColor} />
      <g clipPath={`url(#${clipId})`}>
        <path d={qrData.path} fill={fgColor} />
      </g>
    </svg>
  )
}
