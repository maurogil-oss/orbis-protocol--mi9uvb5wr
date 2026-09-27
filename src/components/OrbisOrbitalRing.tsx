import React from 'react'

export interface OrbisOrbitalRingProps {
  size?: number
  className?: string
  glow?: boolean
  showCore?: boolean
  strokeWidth?: number
  variant?: 'hero' | 'divider' | 'compact' | 'footer'
}

/**
 * OrbisOrbitalRing
 * Elemento gráfico recorrente em linha fina no estilo Linear:
 * anéis orbitais concêntricos com marcadores discretos, gradiente esmeralda/dourado
 * e rotação suave constante, simbolizando o protocolo dMRV descentralizado e contínuo.
 */
export const OrbisOrbitalRing: React.FC<OrbisOrbitalRingProps> = ({
  size = 280,
  className = '',
  glow = true,
  showCore = true,
  strokeWidth = 1,
  variant = 'hero',
}) => {
  // Ajuste de escala e raio conforme variante
  const rOuter = size * 0.44
  const rMiddle = size * 0.35
  const rInner = size * 0.24

  return (
    <div
      className={`relative inline-flex items-center justify-center pointer-events-none select-none ${className}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      {/* Glow suave ao fundo */}
      {glow && (
        <div
          className="absolute inset-0 rounded-full blur-2xl opacity-40 transition-opacity"
          style={{
            background:
              'radial-gradient(circle, rgba(18, 184, 134, 0.25) 0%, rgba(217, 179, 108, 0.12) 50%, transparent 70%)',
          }}
        />
      )}

      {/* SVG com anéis em linha fina e marcadores de órbita */}
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="relative z-10 w-full h-full"
      >
        <defs>
          <linearGradient id="orbitalGradientEmerald" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#12B886" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#27C08C" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#D9B36C" stopOpacity="0.7" />
          </linearGradient>

          <linearGradient id="orbitalGradientSubtle" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#D9B36C" stopOpacity="0.4" />
            <stop offset="50%" stopColor="#12B886" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#93A3B5" stopOpacity="0.3" />
          </linearGradient>
        </defs>

        {/* Anel Externo com rotação lenta no sentido horário */}
        <g className="animate-spin-slow origin-center">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={rOuter}
            stroke="url(#orbitalGradientEmerald)"
            strokeWidth={strokeWidth}
            strokeDasharray={`${size * 0.15} ${size * 0.08} ${size * 0.4} ${size * 0.12}`}
            strokeOpacity="0.6"
          />
          {/* Marcador orbital ponto no anel externo */}
          <circle
            cx={size / 2 + rOuter}
            cy={size / 2}
            r={strokeWidth * 2.2}
            fill="#12B886"
            className="filter drop-shadow-[0_0_6px_#12B886]"
          />
          <circle
            cx={size / 2 - rOuter}
            cy={size / 2}
            r={strokeWidth * 1.5}
            fill="#D9B36C"
            fillOpacity="0.8"
          />
        </g>

        {/* Anel Intermediário com rotação lenta no sentido anti-horário */}
        <g className="animate-spin-reverse-slow origin-center">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={rMiddle}
            stroke="url(#orbitalGradientSubtle)"
            strokeWidth={strokeWidth}
            strokeDasharray="3 7"
            strokeOpacity="0.5"
          />
          {/* Marcadores discretos */}
          <circle
            cx={size / 2}
            cy={size / 2 - rMiddle}
            r={strokeWidth * 1.8}
            fill="#D9B36C"
            className="filter drop-shadow-[0_0_4px_#D9B36C]"
          />
        </g>

        {/* Anel Interno Fino */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={rInner}
          stroke="rgba(244, 247, 250, 0.12)"
          strokeWidth={strokeWidth}
        />

        {/* Núcleo central com ponto pulsante caso solicitado */}
        {showCore && (
          <g>
            <circle
              cx={size / 2}
              cy={size / 2}
              r={strokeWidth * 3}
              fill="#12B886"
              fillOpacity="0.2"
              className="animate-ping origin-center"
            />
            <circle cx={size / 2} cy={size / 2} r={strokeWidth * 1.8} fill="#12B886" />
          </g>
        )}
      </svg>
    </div>
  )
}

/**
 * Divisor de seção no estilo Linear com anel orbital sutil no centro
 */
export const OrbisSectionDivider: React.FC<{
  className?: string
  label?: string
}> = ({ className = '', label }) => {
  return (
    <div className={`relative w-full flex items-center justify-center my-12 sm:my-16 ${className}`}>
      {/* Linha fina com gradiente para as bordas */}
      <div className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-[rgba(244,247,250,0.12)] to-transparent" />

      {/* Elemento central com anel orbital e badge discreta opcional */}
      <div className="relative z-10 flex items-center gap-3 px-4 bg-[#0A0E12]">
        <div className="relative flex items-center justify-center w-8 h-8">
          <div className="absolute inset-0 rounded-full bg-[#12B886]/10 blur-sm" />
          <OrbisOrbitalRing size={32} showCore={false} glow={false} strokeWidth={0.8} />
        </div>
        {label && (
          <span className="text-[10px] font-mono font-medium tracking-[0.2em] text-[#93A3B5]/80 uppercase">
            {label}
          </span>
        )}
      </div>
    </div>
  )
}

export default OrbisOrbitalRing
