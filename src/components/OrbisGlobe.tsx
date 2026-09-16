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
      {/* Outer subtle glow matching official green/emerald tones */}
      <div className="absolute inset-0 rounded-full bg-[#12B886]/25 blur-sm pointer-events-none scale-105" />

      {/* Official emblem with transparent background */}
      <OrbisLogo
        variant="emblem"
        height={size}
        width={size}
        alt="Orbis Protocol Globe"
        className="relative z-10 transition-transform duration-300 hover:scale-105"
      />
    </div>
  )
}
export default OrbisGlobe
