import React from 'react'

interface OrbisGlobeProps {
  className?: string
  size?: number
}

export const OrbisGlobe: React.FC<OrbisGlobeProps> = ({ className = '', size = 36 }) => {
  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 ${className}`}
      style={{ width: size, height: size }}
      aria-label="Orbis Protocol Globe"
    >
      {/* Outer Glow */}
      <div className="absolute inset-0 rounded-full bg-[#12B886]/20 blur-sm pointer-events-none" />

      {/* Outer Rotating Ring */}
      <svg
        className="absolute inset-0 w-full h-full animate-spin-outer pointer-events-none"
        viewBox="0 0 100 100"
      >
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="rgba(18, 184, 134, 0.55)"
          strokeWidth="2"
          strokeDasharray="6 4"
        />
        <circle cx="50" cy="5" r="3" fill="#12B886" />
        <circle cx="50" cy="95" r="2" fill="#D9B36C" />
      </svg>

      {/* Counter-rotating Inner Ring */}
      <svg
        className="absolute inset-1 w-[calc(100%-8px)] h-[calc(100%-8px)] animate-spin-inner pointer-events-none"
        viewBox="0 0 100 100"
      >
        <ellipse
          cx="50"
          cy="50"
          rx="40"
          ry="18"
          fill="none"
          stroke="rgba(217, 179, 108, 0.45)"
          strokeWidth="1.8"
          transform="rotate(45 50 50)"
        />
        <ellipse
          cx="50"
          cy="50"
          rx="40"
          ry="18"
          fill="none"
          stroke="rgba(18, 184, 134, 0.35)"
          strokeWidth="1.5"
          transform="rotate(-45 50 50)"
        />
      </svg>

      {/* Core Globe Sphere */}
      <div className="relative w-3/5 h-3/5 rounded-full bg-gradient-to-tr from-[#0F231D] via-[#111820] to-[#12B886]/40 border border-[#12B886]/60 flex items-center justify-center shadow-inner">
        <div className="w-1.5 h-1.5 rounded-full bg-[#12B886] animate-ping" />
      </div>
    </div>
  )
}
