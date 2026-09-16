import React, { useEffect, useState } from 'react'
import rawLogoUrl from '@/assets/protocol-e651d.jpg'

// Cache dos dataURLs transparentes processados para não reprocessar repetidamente
let cachedEmblemOnlyUrl: string | null = null
let cachedFullLogoUrl: string | null = null
let processingPromise: Promise<{ full: string; emblem: string }> | null = null

function processImageTransparency(): Promise<{ full: string; emblem: string }> {
  if (cachedFullLogoUrl && cachedEmblemOnlyUrl) {
    return Promise.resolve({ full: cachedFullLogoUrl, emblem: cachedEmblemOnlyUrl })
  }
  if (processingPromise) {
    return processingPromise
  }

  processingPromise = new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.src = rawLogoUrl

    img.onload = () => {
      try {
        const width = img.naturalWidth || img.width
        const height = img.naturalHeight || img.height

        // Canvas 1: Logo completa com fundo branco recortado e texto clareado/realçado para fundos escuros
        const canvasFull = document.createElement('canvas')
        canvasFull.width = width
        canvasFull.height = height
        const ctxFull = canvasFull.getContext('2d', { willReadFrequently: true })

        if (!ctxFull) {
          resolve({ full: rawLogoUrl, emblem: rawLogoUrl })
          return
        }

        ctxFull.drawImage(img, 0, 0)
        const imgDataFull = ctxFull.getImageData(0, 0, width, height)
        const dFull = imgDataFull.data

        // Usamos flood-fill a partir das 4 bordas para remover apenas o fundo branco exterior,
        // preservando os brancos internos da folha/nervuras e brilhos prateados.
        const visited = new Uint8Array(width * height)
        const queue: number[] = []

        // Critério de tolerância para o branco de fundo exterior (JPEG compression artifacts)
        const isWhiteBgPixel = (idx: number) => {
          const r = dFull[idx]
          const g = dFull[idx + 1]
          const b = dFull[idx + 2]
          // Em torno de branco puro ou quase branco
          return r > 218 && g > 218 && b > 218
        }

        // Adiciona bordas superior, inferior, esquerda e direita na fila
        for (let x = 0; x < width; x++) {
          // Top row
          const topIdx = (0 * width + x) * 4
          if (isWhiteBgPixel(topIdx)) {
            visited[0 * width + x] = 1
            queue.push(0 * width + x)
          }
          // Bottom row
          const btmIdx = ((height - 1) * width + x) * 4
          if (isWhiteBgPixel(btmIdx)) {
            visited[(height - 1) * width + x] = 1
            queue.push((height - 1) * width + x)
          }
        }
        for (let y = 0; y < height; y++) {
          // Left col
          const leftIdx = (y * width + 0) * 4
          if (!visited[y * width + 0] && isWhiteBgPixel(leftIdx)) {
            visited[y * width + 0] = 1
            queue.push(y * width + 0)
          }
          // Right col
          const rightIdx = (y * width + (width - 1)) * 4
          if (!visited[y * width + (width - 1)] && isWhiteBgPixel(rightIdx)) {
            visited[y * width + (width - 1)] = 1
            queue.push(y * width + (width - 1))
          }
        }

        // BFS flood fill para identificar todo o fundo exterior conectado
        let head = 0
        while (head < queue.length) {
          const curr = queue[head++]
          const cx = curr % width
          const cy = Math.floor(curr / width)

          // 4 vizinhos
          const neighbors = [
            cy > 0 ? (cy - 1) * width + cx : -1,
            cy < height - 1 ? (cy + 1) * width + cx : -1,
            cx > 0 ? cy * width + (cx - 1) : -1,
            cx < width - 1 ? cy * width + (cx + 1) : -1,
          ]

          for (const n of neighbors) {
            if (n >= 0 && !visited[n]) {
              const nIdx = n * 4
              if (isWhiteBgPixel(nIdx)) {
                visited[n] = 1
                queue.push(n)
              }
            }
          }
        }

        // Aplica transparência suave nos pixels de fundo exterior visitados
        for (let i = 0; i < width * height; i++) {
          const p = i * 4
          if (visited[i]) {
            dFull[p + 3] = 0 // Alfa transparente
          } else {
            // Anti-aliasing suave na transição se o pixel for muito claro próximo da borda
            const r = dFull[p]
            const g = dFull[p + 1]
            const b = dFull[p + 2]
            if (r > 240 && g > 240 && b > 240) {
              const lum = (r + g + b) / 3
              // se estiver quase branco isolado, desvanece
              if (lum > 250) {
                dFull[p + 3] = 0
              }
            }
          }
        }

        ctxFull.putImageData(imgDataFull, 0, 0)
        cachedFullLogoUrl = canvasFull.toDataURL('image/png')

        // Canvas 2: Apenas o Emblema Circular (globo + folha + anel metálico),
        // perfeito para favicons, ícones compactos e avatares
        const canvasEmblem = document.createElement('canvas')
        // O emblema fica no lado esquerdo da imagem (~primeiros 43% da largura)
        const emblemW = Math.round(width * 0.44)
        canvasEmblem.width = emblemW
        canvasEmblem.height = height
        const ctxEmblem = canvasEmblem.getContext('2d')
        if (ctxEmblem) {
          ctxEmblem.drawImage(canvasFull, 0, 0, emblemW, height, 0, 0, emblemW, height)
          cachedEmblemOnlyUrl = canvasEmblem.toDataURL('image/png')
        } else {
          cachedEmblemOnlyUrl = cachedFullLogoUrl
        }

        resolve({ full: cachedFullLogoUrl, emblem: cachedEmblemOnlyUrl })
      } catch {
        resolve({ full: rawLogoUrl, emblem: rawLogoUrl })
      }
    }

    img.onerror = () => {
      resolve({ full: rawLogoUrl, emblem: rawLogoUrl })
    }
  })

  return processingPromise
}

export interface OrbisLogoProps {
  /**
   * 'full': logotipo completo (emblema circular + barra + texto ORBIS PROTOCOL)
   * 'emblem': apenas o emblema circular (globo com folha e anel prateado)
   * 'auto': responsivo (em telas muito pequenas ou espaços compactos pode usar emblem)
   */
  variant?: 'full' | 'emblem'
  className?: string
  alt?: string
  /**
   * Altura em pixels (ex.: 36, 40, 48, 64)
   */
  height?: number
  /**
   * Largura explícita opcional (por padrão auto mantendo proporção)
   */
  width?: number
}

export const OrbisLogo: React.FC<OrbisLogoProps> = ({
  variant = 'full',
  className = '',
  alt = 'Orbis Protocol',
  height = 40,
  width,
}) => {
  const [logoUrls, setLogoUrls] = useState<{ full: string; emblem: string } | null>(() => {
    if (cachedFullLogoUrl && cachedEmblemOnlyUrl) {
      return { full: cachedFullLogoUrl, emblem: cachedEmblemOnlyUrl }
    }
    return null
  })

  useEffect(() => {
    if (!logoUrls) {
      processImageTransparency().then((res) => {
        setLogoUrls(res)
      })
    }
  }, [logoUrls])

  // A proporção da imagem original é ~ 2.18 : 1 (largura / altura). O emblema é ~ 1 : 1.
  const isEmblem = variant === 'emblem'
  const activeUrl = isEmblem ? logoUrls?.emblem || rawLogoUrl : logoUrls?.full || rawLogoUrl

  // Se o browser ainda não terminou o processamento Canvas (ou em SSR),
  // usamos máscara ou filtro para já exibir sem corte feio
  const computedStyle: React.CSSProperties = {
    height: height ? `${height}px` : undefined,
    width: width ? `${width}px` : 'auto',
    objectFit: 'contain',
    display: 'inline-block',
  }

  // Se ainda estiver carregando o recorte fino, garantimos que não haja explosão visual
  if (!logoUrls) {
    return (
      <div
        className={`relative inline-flex items-center justify-center shrink-0 overflow-hidden ${className}`}
        style={{
          height: `${height}px`,
          width: width ? `${width}px` : isEmblem ? `${height}px` : `${Math.round(height * 2.2)}px`,
        }}
      >
        <img
          src={rawLogoUrl}
          alt={alt}
          style={{
            height: '100%',
            width: isEmblem ? 'auto' : '100%',
            objectFit: 'contain',
            objectPosition: isEmblem ? 'left center' : 'center',
            filter: 'contrast(1.15) brightness(1.05)',
          }}
          className="transition-opacity duration-200"
          loading="eager"
        />
      </div>
    )
  }

  return (
    <img
      src={activeUrl}
      alt={alt}
      style={computedStyle}
      className={`shrink-0 select-none ${
        isEmblem
          ? 'drop-shadow-[0_2px_8px_rgba(18,184,134,0.35)]'
          : 'drop-shadow-[0_2px_10px_rgba(18,184,134,0.25)]'
      } ${className}`}
      loading="eager"
      decoding="async"
    />
  )
}

/**
 * Componente de Emblema puro (globo oficial com folha e aro prateado)
 * Substitui o antigo OrbisGlobe mantendo compatibilidade de API (props: size, className).
 */
export const OrbisOfficialGlobe: React.FC<{ size?: number; className?: string }> = ({
  size = 40,
  className = '',
}) => {
  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 ${className}`}
      style={{ width: size, height: size }}
      aria-label="Orbis Protocol Emblem"
    >
      {/* Halo de luz esmeralda suave ao redor do anel prateado */}
      <div
        className="absolute inset-0 rounded-full bg-[#12B886]/25 blur-md pointer-events-none scale-110"
        aria-hidden="true"
      />
      <OrbisLogo variant="emblem" height={size} width={size} alt="Orbis Protocol Globe" />
    </div>
  )
}
export default OrbisLogo
