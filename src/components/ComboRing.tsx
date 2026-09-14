import { useMemo } from 'react'

const CENTER = 110
const RADIUS = 92
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

type ComboRingProps = {
  /** Tamanho do combo: quantos pontos formam o circulo pontilhado. */
  size: number
  /** Unidades ja contadas no combo atual. */
  value: number
  /** True durante a animacao de combo fechado (o circulo acende inteiro). */
  complete: boolean
}

type Dot = { x: number; y: number }

export function ComboRing({ size, value, complete }: ComboRingProps) {
  const dots = useMemo<Dot[]>(() => {
    // Primeiro ponto no topo, seguindo no sentido horario.
    return Array.from({ length: size }, (_, index) => {
      const angle = (index / size) * Math.PI * 2 - Math.PI / 2
      return { x: CENTER + RADIUS * Math.cos(angle), y: CENTER + RADIUS * Math.sin(angle) }
    })
  }, [size])

  const lit = complete ? size : value
  // Quanto mais unidades no combo, menores os pontos — o anel nunca "engorda".
  const dotRadius = Math.min(6.5, Math.max(1.3, (0.3 * CIRCUMFERENCE) / size))
  const latest = lit > 0 ? dots[lit - 1] : null

  return (
    <svg className="ring__svg" viewBox="0 0 220 220" aria-hidden="true">
      <defs>
        <linearGradient id="ring-gradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--neon)" />
          <stop offset="100%" stopColor="var(--magenta)" />
        </linearGradient>
        <filter id="ring-blur" x="-120%" y="-120%" width="340%" height="340%">
          <feGaussianBlur stdDeviation={Math.max(2, dotRadius * 0.9)} />
        </filter>
      </defs>

      <circle className="ring__track" cx={CENTER} cy={CENTER} r={RADIUS} />

      <circle
        className="ring__arc"
        cx={CENTER}
        cy={CENTER}
        r={RADIUS}
        strokeDasharray={CIRCUMFERENCE}
        strokeDashoffset={CIRCUMFERENCE * (1 - lit / size)}
        transform={`rotate(-90 ${CENTER} ${CENTER})`}
      />

      {/* Camada de brilho: so os pontos acesos, desfocados por tras dos nitidos. */}
      <g>
        {dots.slice(0, lit).map((dot, index) => (
          <circle
            key={`glow-${index}`}
            className="ring__glow"
            cx={dot.x}
            cy={dot.y}
            r={dotRadius}
          />
        ))}
      </g>

      <g>
        {dots.map((dot, index) => (
          <circle
            key={index}
            className={index < lit ? 'ring__dot ring__dot--lit' : 'ring__dot'}
            cx={dot.x}
            cy={dot.y}
            r={index < lit ? dotRadius : dotRadius * 0.7}
          />
        ))}
      </g>

      {latest && (
        <circle
          key={`pulse-${lit}-${complete}`}
          className="ring__pulse"
          cx={latest.x}
          cy={latest.y}
          r={dotRadius}
        />
      )}

      {complete && (
        <circle key="burst" className="ring__burst" cx={CENTER} cy={CENTER} r={RADIUS} />
      )}
    </svg>
  )
}
