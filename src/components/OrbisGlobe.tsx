import React from 'react'
import { OrbisLogo } from './OrbisLogo'

interface OrbisGlobeProps {
  className?: string
  size?: number
}

/**
 * Emblema oficial do Orbis Protocol (Globo com folha estilizada e anel prateado)
 * Substitui o protótipo anterior por renderização do asset oficial com fundo transparente.
 */
export const OrbisGlobe: React.FC<OrbisGlobeProps> = ({ className = '', size = 36 }) => {
  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 ${className}`}
      style={{ width: size, height: size }}
      aria-label="Orbis Protocol Globe"
    >
      {/* Outer subtle glow matching official green/emerald tones (suave no claro, sem neon no escuro) */}
      <div className="absolute inset-0 rounded-full bg-emerald-500/20 dark:bg-[#059669]/25 blur-sm pointer-events-none scale-105" />

      {/* Traço/borda sutil em volta do globo para dar contraste perfeito em fundos claros */}
      <div className="absolute inset-0 rounded-full border border-slate-300/70 dark:border-slate-800 pointer-events-none" />

      {/* Official emblem with transparent background */}
      <OrbisLogo
        variant="emblem"
        height={size}
        width={size}
        alt="Orbis Protocol Globe"
        className="relative z-10 transition-transform duration-300 hover:scale-105 drop-shadow-[0_1px_3px_rgba(15,23,42,0.18)] dark:drop-shadow-[0_1px_3px_rgba(0,0,0,0.25)]"
      />
    </div>
  )
}
export default OrbisGlobe
