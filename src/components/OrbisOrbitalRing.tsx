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
          {/* Gradiente Escuro: Verde-Esmeralda & Dourado */}
          <linearGradient id="orbitalGradientEmerald" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#059669" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#10B981" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#D9B36C" stopOpacity="0.7" />
          </linearGradient>

          {/* Gradiente Claro: Traço visível grafite / slate-700 mesclado com esmeralda corporativo */}
          <linearGradient id="orbitalGradientEmeraldLight" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#059669" stopOpacity="0.75" />
            <stop offset="50%" stopColor="#334155" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#B45309" stopOpacity="0.65" />
          </linearGradient>

          <linearGradient id="orbitalGradientSubtle" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#D9B36C" stopOpacity="0.4" />
            <stop offset="50%" stopColor="#059669" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#94A3B8" stopOpacity="0.3" />
          </linearGradient>

          <linearGradient id="orbitalGradientSubtleLight" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#D97706" stopOpacity="0.5" />
            <stop offset="50%" stopColor="#475569" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#64748B" stopOpacity="0.4" />
          </linearGradient>
        </defs>

        {/* Anel Externo com rotação lenta no sentido horário */}
        <g className="animate-spin-slow origin-center">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={rOuter}
            strokeWidth={strokeWidth}
            strokeDasharray={`${size * 0.15} ${size * 0.08} ${size * 0.4} ${size * 0.12}`}
            strokeOpacity="0.7"
            className="stroke-[url(#orbitalGradientEmeraldLight)] dark:stroke-[url(#orbitalGradientEmerald)]"
          />
          {/* Marcador orbital ponto no anel externo */}
          <circle
            cx={size / 2 + rOuter}
            cy={size / 2}
            r={strokeWidth * 2.2}
            className="fill-emerald-600 dark:fill-[#059669] filter drop-shadow-[0_1px_3px_rgba(0,0,0,0.25)]"
          />
          <circle
            cx={size / 2 - rOuter}
            cy={size / 2}
            r={strokeWidth * 1.5}
            fillOpacity="0.85"
            className="fill-amber-600 dark:fill-[#D9B36C]"
          />
        </g>

        {/* Anel Intermediário com rotação lenta no sentido anti-horário */}
        <g className="animate-spin-reverse-slow origin-center">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={rMiddle}
            strokeWidth={strokeWidth}
            strokeDasharray="3 7"
            strokeOpacity="0.6"
            className="stroke-[url(#orbitalGradientSubtleLight)] dark:stroke-[url(#orbitalGradientSubtle)]"
          />
          {/* Marcadores discretos */}
          <circle
            cx={size / 2}
            cy={size / 2 - rMiddle}
            r={strokeWidth * 1.8}
            className="fill-amber-600 dark:fill-[#D9B36C] filter drop-shadow-[0_0_3px_rgba(217,119,6,0.3)] dark:drop-shadow-[0_0_4px_#D9B36C]"
          />
        </g>

        {/* Anel Interno Fino: visível em grafite/slate-300 no tema claro e sutil no escuro */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={rInner}
          strokeWidth={strokeWidth}
          className="stroke-slate-400/40 dark:stroke-slate-800"
        />

        {/* Núcleo central com ponto pulsante caso solicitado */}
        {showCore && (
          <g>
            <circle
              cx={size / 2}
              cy={size / 2}
              r={strokeWidth * 3}
              fillOpacity="0.25"
              className="fill-emerald-600 dark:fill-[#059669] animate-ping origin-center"
            />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={strokeWidth * 1.8}
              className="fill-emerald-600 dark:fill-[#059669]"
            />
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
    <div className={`relative w-full flex items-center justify-center my-10 sm:my-14 ${className}`}>
      {/* Linha fina com gradiente suave nas pontas para fusão imperceptível */}
      <div className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-slate-300 dark:via-slate-800 to-transparent" />

      {/* Elemento central com anel orbital e badge discreta opcional em fundo contínuo */}
      <div className="relative z-10 flex items-center gap-3 px-4 py-1 bg-white/95 dark:bg-[#0A1628]/90 border border-slate-200 dark:border-slate-800 backdrop-blur-sm rounded-full shadow-xs dark:shadow-none">
        <div className="relative flex items-center justify-center w-8 h-8">
          <div className="absolute inset-0 rounded-full bg-emerald-500/10 dark:bg-[#059669]/10 blur-sm" />
          <OrbisOrbitalRing size={32} showCore={false} glow={false} strokeWidth={0.8} />
        </div>
        {label && (
          <span className="text-[10px] font-mono font-semibold tracking-[0.2em] text-slate-700 dark:text-[#94A3B8]/80 uppercase">
            {label}
          </span>
        )}
      </div>
    </div>
  )
}

export default OrbisOrbitalRing
